import { DurableObject, WorkerEntrypoint } from "cloudflare:workers";

export class ExportHandler extends WorkerEntrypoint {
  getExportFormats() {
    return [
      { id: "html", label: "HTML", mode: "browser", contentType: "text/html", fileExtension: ".html" },
      { id: "pdf", label: "PDF", mode: "browser", contentType: "application/pdf", fileExtension: ".pdf" },
    ];
  }
}

const DEFAULT_BOOK_FILES = {
  "content/toc.json": JSON.stringify({ title: "新しい本", parts: [{ title: "はじめに", chapters: [{ id: "introduction", title: "はじめに", file: "introduction.md" }] }] }, null, 2),
  "content/introduction.md": "# はじめに\n\nこの章を書き換えて、本を作り始めましょう。\n",
};
const TUTOR_INSTRUCTIONS = `あなたは本の学習チューター「波多野 澪」です。やわらかい口調で、現在の章の本文に沿って簡潔かつ正確に答えてください。読者の知識や学習目的を決めつけず、数式は必要に応じて説明してください。`;

export class Gadget extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT NOT NULL CHECK(role IN ('user', 'assistant')), content TEXT NOT NULL, chapter_id TEXT NOT NULL, created_at INTEGER NOT NULL)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS progress (chapter_id TEXT PRIMARY KEY, completed INTEGER NOT NULL CHECK(completed IN (0, 1)), updated_at INTEGER NOT NULL)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS book_files (path TEXT PRIMARY KEY, content TEXT NOT NULL, updated_at INTEGER NOT NULL)`);
  }

  getBookFiles() {
    const stored = Object.fromEntries([...this.sql.exec("SELECT path, content FROM book_files")].map(row => [row.path, row.content]));
    return "content/toc.json" in stored ? stored : { ...DEFAULT_BOOK_FILES, ...stored };
  }

  putBookFiles(files) {
    const updatedAt = Date.now();
    for (const { path, content } of files) this.sql.exec("INSERT INTO book_files (path, content, updated_at) VALUES (?, ?, ?) ON CONFLICT(path) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at", path, content, updatedAt);
    return this.getBookFiles();
  }

  getState() {
    const messages = [...this.sql.exec("SELECT role, content FROM messages ORDER BY id")];
    const progress = Object.fromEntries([...this.sql.exec("SELECT chapter_id, completed FROM progress")].map((row) => [row.chapter_id, row.completed === 1]));
    const last = [...this.sql.exec("SELECT value FROM settings WHERE key = 'lastChapter'")][0];
    return { messages, progress, lastChapter: last?.value };
  }

  setChapterComplete(chapterId, completed) {
    this.sql.exec("INSERT INTO progress (chapter_id, completed, updated_at) VALUES (?, ?, ?) ON CONFLICT(chapter_id) DO UPDATE SET completed = excluded.completed, updated_at = excluded.updated_at", chapterId, completed ? 1 : 0, Date.now());
    this.sql.exec("INSERT INTO settings (key, value) VALUES ('lastChapter', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", chapterId);
    return Object.fromEntries([...this.sql.exec("SELECT chapter_id, completed FROM progress")].map((row) => [row.chapter_id, row.completed === 1]));
  }

  async askTutor({ message, chapterId, chapterText }) {
    if (!this.env.AI) throw new Error("本のAIモデルが未接続です。ConnectionsでAIモデルを追加し、接続名をAIにしてください。");
    const createdAt = Date.now();
    this.sql.exec("INSERT INTO messages (role, content, chapter_id, created_at) VALUES ('user', ?, ?, ?)", message, chapterId, createdAt);
    this.sql.exec("INSERT INTO settings (key, value) VALUES ('lastChapter', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", chapterId);
    const prompt = `[現在の章]\n${chapterText}\n\n[これまでの会話]\n${[...this.sql.exec("SELECT role, content FROM messages ORDER BY id DESC LIMIT 12")].reverse().map((item) => `${item.role === "user" ? "読者" : "澪"}: ${item.content}`).join("\n")}\n\n[読者の質問]\n${message}`;
    const response = await this.env.AI.run({ prompt, systemPrompt: TUTOR_INSTRUCTIONS });
    this.sql.exec("INSERT INTO messages (role, content, chapter_id, created_at) VALUES ('assistant', ?, ?, ?)", response, chapterId, Date.now());
    return this.getState();
  }
}
