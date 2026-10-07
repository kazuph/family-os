// One book gadget's complete state: the four SQLite tables behind `format.book`, carried across
// Durable Objects by the child-book migration (child-books.ts).
//
// A gadget's SQLite lives on the *facet* bound under the gadget's facet name, not on the
// workspace DO's own storage, so the overseer reaches it by binding this class to that name
// (the same mechanism __book_tests__ uses to inspect a book's tables).
//
// The book schema is a fixed contract shared by the old Family OS runtime and the current
// template (packages/bundled-blueprints/blueprints/workspace-book/files/server.js): a copied book
// must read identically under both, so the DDL is pinned here rather than imported, and import
// never depends on starting the gadget's own code.

import { DurableObject } from "cloudflare:workers";

/** One row of `book_files`: a manuscript file with its stored write time. */
export type BookDataFile = {
  path: string;
  content: string;
  /** Source `updated_at`, or null for a built-in default file the source never wrote. */
  updatedAt: number | null;
};

/** One row of `progress`: whether a chapter was marked read. */
export type BookDataProgress = {
  chapterId: string;
  /** Stored 0/1, kept verbatim. */
  completed: number;
  updatedAt: number;
};

/** One row of `messages`: a tutor conversation entry. */
export type BookDataMessage = {
  /** Row id; preserved so conversation order survives the copy. */
  id: number;
  role: string;
  content: string;
  chapterId: string;
  createdAt: number;
};

/** One row of `settings`; carries `lastChapter`, the reader's current position. */
export type BookDataSetting = { key: string; value: string };

/** Everything a book's reader-facing state consists of, ready to rebuild the four tables from. */
export type BookDataSnapshot = {
  /**
   * The effective file set the book served: every stored `book_files` row, plus any built-in
   * default the rows didn't override. The old runtime merged defaults unconditionally while the
   * current template only merges them when no `content/toc.json` row exists, so materializing the
   * set here is what makes the two runtimes agree on what the copy holds.
   */
  files: BookDataFile[];
  /** `progress` rows verbatim. */
  progress: BookDataProgress[];
  /** `messages` rows verbatim, in id (conversation) order. */
  messages: BookDataMessage[];
  /** `settings` rows verbatim. */
  settings: BookDataSetting[];
};

// The file set a fresh book serves before any putBookFiles. Identical in the old runtime and the
// current template; mirrored because the destination materializes the effective set (above).
const DEFAULT_BOOK_FILES: Record<string, string> = {
  "content/toc.json": JSON.stringify(
      {title: "新しい本", parts: [{title: "はじめに", chapters: [
        {id: "introduction", title: "はじめに", file: "introduction.md"}]}]}, null, 2),
  "content/introduction.md": "# はじめに\n\nこの章を書き換えて、本を作り始めましょう。\n",
};

/**
 * The book schema exactly as the template's constructor creates it. Duplicated deliberately:
 * importBookData runs on the book's facet storage under the BookDataFacet class below, so a
 * source book's own gadget code never has to run during a read, and a destination gets its
 * tables before its first open.
 */
export const BOOK_DATA_DDL = [
  `CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT NOT NULL CHECK(role IN ('user', 'assistant')), content TEXT NOT NULL, chapter_id TEXT NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS progress (chapter_id TEXT PRIMARY KEY, completed INTEGER NOT NULL CHECK(completed IN (0, 1)), updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS book_files (path TEXT PRIMARY KEY, content TEXT NOT NULL, updated_at INTEGER NOT NULL)`,
];

const BOOK_DATA_TABLES = ["book_files", "progress", "messages", "settings"] as const;

function tableRows(storage: DurableObjectStorage, name: string, orderBy?: string)
    : Record<string, SqlStorageValue>[] {
  let query = `SELECT * FROM ${name}` + (orderBy ? ` ORDER BY ${orderBy}` : "");
  return [...storage.sql.exec<Record<string, SqlStorageValue>>(query)];
}

function existingTables(storage: DurableObjectStorage): Set<string> {
  return new Set([...storage.sql.exec<{name: string}>(
      "SELECT name FROM sqlite_master WHERE type = 'table'")].map(row => row.name));
}

/**
 * Read the book tables verbatim. A pure read: a book that was never opened has no tables and
 * exports as defaults-only, without creating them.
 */
export function exportBookData(storage: DurableObjectStorage): BookDataSnapshot {
  let present = existingTables(storage);
  let rows = (name: string, orderBy?: string) =>
      present.has(name) ? tableRows(storage, name, orderBy) : [];

  let stored = new Map(rows("book_files").map(row =>
      [String(row.path), row] as [string, Record<string, SqlStorageValue>]));
  let files: BookDataFile[] = [];
  for (let [path, content] of Object.entries(DEFAULT_BOOK_FILES)) {
    if (!stored.has(path)) files.push({path, content, updatedAt: null});
  }
  for (let [path, row] of stored) {
    files.push({path, content: String(row.content), updatedAt: Number(row.updated_at)});
  }

  return {
    files,
    progress: rows("progress").map(row => ({
      chapterId: String(row.chapter_id),
      completed: Number(row.completed),
      updatedAt: Number(row.updated_at),
    })),
    messages: rows("messages", "id").map(row => ({
      id: Number(row.id),
      role: String(row.role),
      content: String(row.content),
      chapterId: String(row.chapter_id),
      createdAt: Number(row.created_at),
    })),
    settings: rows("settings").map(row => ({key: String(row.key), value: String(row.value)})),
  };
}

/**
 * Write a snapshot into this workspace's book tables, inside one transaction.
 *
 * Idempotent like the offline copier (scripts/book-offline-copy/apply.ts): an empty book takes
 * the rows, a book already holding this exact copy is a no-op, and anything else is refused so a
 * retried migration can never clobber data it didn't write. `book_files` compares on
 * (path, content) because a default row's write stamp is generated at import time.
 */
export function importBookData(storage: DurableObjectStorage, snapshot: BookDataSnapshot): void {
  let now = Date.now();
  storage.transactionSync(() => {
    for (let ddl of BOOK_DATA_DDL) storage.sql.exec(ddl);

    let match = (table: (typeof BOOK_DATA_TABLES)[number], rows: unknown[]) => {
      let existing = tableRows(storage, table);
      if (existing.length === 0) return "insert";
      let key = (row: unknown) => JSON.stringify(row);
      if (existing.length === rows.length &&
          existing.map(key).toSorted().join("\n") === rows.map(key).toSorted().join("\n")) {
        return "same";
      }
      throw new Error(
          `Destination book table "${table}" already holds different data; refusing overwrite.`);
    };

    // book_files compares on (path, content) alone: a built-in default row's updated_at is
    // stamped at import time, so a retried import's stamps legitimately differ.
    let fileIdentity = (file: {path?: unknown; content?: unknown}) =>
        JSON.stringify({path: String(file.path), content: String(file.content)});
    let existingFiles = tableRows(storage, "book_files");
    let filesStatus = existingFiles.length === 0 ? "insert"
        : (existingFiles.length === snapshot.files.length &&
            existingFiles.map(fileIdentity).toSorted().join("\n") ===
                snapshot.files.map(fileIdentity).toSorted().join("\n"))
          ? "same" : (() => { throw new Error(
              `Destination book table "book_files" already holds different data; ` +
              `refusing overwrite.`); })();

    if (filesStatus === "insert") {
      for (let file of snapshot.files) {
        storage.sql.exec(
            "INSERT INTO book_files (path, content, updated_at) VALUES (?, ?, ?)",
            file.path, file.content, file.updatedAt ?? now);
      }
    }

    if (match("progress", snapshot.progress.map(row => ({
      chapter_id: row.chapterId, completed: row.completed, updated_at: row.updatedAt,
    }))) === "insert") {
      for (let row of snapshot.progress) {
        storage.sql.exec(
            "INSERT INTO progress (chapter_id, completed, updated_at) VALUES (?, ?, ?)",
            row.chapterId, row.completed, row.updatedAt);
      }
    }

    if (match("messages", snapshot.messages.map(row => ({
      id: row.id, role: row.role, content: row.content, chapter_id: row.chapterId,
      created_at: row.createdAt,
    }))) === "insert") {
      for (let row of snapshot.messages) {
        storage.sql.exec(
            "INSERT INTO messages (id, role, content, chapter_id, created_at) VALUES (?, ?, ?, ?, ?)",
            row.id, row.role, row.content, row.chapterId, row.createdAt);
      }
    }

    if (match("settings", snapshot.settings.map(row => ({
      key: row.key, value: row.value,
    }))) === "insert") {
      for (let row of snapshot.settings) {
        storage.sql.exec("INSERT INTO settings (key, value) VALUES (?, ?)", row.key, row.value);
      }
    }
  });
}

/** What a migration plan reports per book: how much there is to copy. */
export function bookDataSummary(snapshot: BookDataSnapshot): {
  fileCount: number; messageCount: number; progressCount: number; lastChapter?: string;
} {
  return {
    fileCount: snapshot.files.length,
    messageCount: snapshot.messages.length,
    progressCount: snapshot.progress.length,
    lastChapter: snapshot.settings.find(row => row.key === "lastChapter")?.value,
  };
}

/**
 * Storage facet class bound over a book gadget's facet name so the overseer can reach the
 * book's SQLite partition directly. A gadget's tables live on the facet's storage, not the
 * workspace DO's, and only a facet under the same name can reach them; `ctx.facets.get`
 * returns whatever class is currently bound, so callers abort the name first (interrupting a
 * live gadget run without touching its data) and abort again when done, letting the next open
 * restart the real gadget code. The constructor runs no DDL: export must be a pure read even
 * for a book that was never opened.
 */
export class BookDataFacet extends DurableObject {
  /** Read the book tables verbatim as a snapshot. A pure read. */
  exportBookData(): BookDataSnapshot {
    return exportBookData(this.ctx.storage);
  }

  /** Rebuild the book tables from a snapshot. See importBookData for the overwrite rules. */
  importBookData(snapshot: BookDataSnapshot): void {
    importBookData(this.ctx.storage, snapshot);
  }
}
