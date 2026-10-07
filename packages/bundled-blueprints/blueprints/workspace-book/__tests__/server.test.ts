// @vitest-environment node
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { Gadget } from "../files/server.js";

const TOC = {
  title: "検証の本",
  parts: [{
    title: "第一部",
    chapters: [
      { id: "one", title: "一章", file: "one.md" },
      { id: "two", title: "二章", file: "two.md" },
    ],
  }],
};

const FILES = {
  "content/toc.json": JSON.stringify(TOC),
  "content/one.md": "# 一章\n\none の本文",
  "content/two.md": "# 二章\n\ntwo の本文",
};

// The gadget's only SQL surface is Durable Object `storage.sql.exec`, which returns an
// iterable of rows for reads and nothing meaningful for writes. node:sqlite provides the
// same semantics in memory so the tests run the real server.js queries unchanged.
function fakeCtx() {
  const db = new DatabaseSync(":memory:");
  const exec = (text: string, ...params: (string | number)[]) => {
    const statement = db.prepare(text);
    if (/^\s*select/i.test(text)) return statement.all(...params);
    statement.run(...params);
    return [];
  };
  return { storage: { sql: { exec } }, exec };
}

function makeGadget(ai?: { run: (args: { prompt: string; systemPrompt?: string }) => Promise<string> }) {
  const { storage, exec } = fakeCtx();
  const gadget = new Gadget({ storage } as never, { AI: ai } as never);
  gadget.putBookFiles(Object.entries(FILES).map(([path, content]) => ({ path, content })));
  return { gadget, exec };
}

function seedMessages(exec: ReturnType<typeof fakeCtx>["exec"], chapterId: string, contents: string[]) {
  contents.forEach((content, index) => exec(
    "INSERT INTO messages (role, content, chapter_id, created_at) VALUES (?, ?, ?, ?)",
    index % 2 === 0 ? "user" : "assistant", content, chapterId, index + 1));
}

describe("workspace-book gadget", () => {
  it("scopes getState messages to the given chapter", () => {
    const { gadget, exec } = makeGadget();
    seedMessages(exec, "one", ["一章の質問", "一章の返答"]);
    seedMessages(exec, "two", ["二章の質問"]);
    const one = gadget.getState("one");
    expect(one.messages.map((item: { content: string }) => item.content))
      .toEqual(["一章の質問", "一章の返答"]);
    expect(gadget.getState("two").messages).toHaveLength(1);
    // A chapter-less call is the metadata-only form: no messages leave the store.
    expect(gadget.getState().messages).toEqual([]);
  });

  it("answers the tutor with the chapter's own text and last 12 of that chapter only", async () => {
    const calls: { prompt: string; systemPrompt?: string }[] = [];
    const { gadget, exec } = makeGadget({
      run: (args) => {
        calls.push(args);
        return Promise.resolve("澪の返答");
      },
    });
    seedMessages(exec, "one", Array.from({ length: 15 }, (_, index) => `一章の会話${index + 1}`));
    seedMessages(exec, "two", ["二章の会話"]);
    const state = await gadget.askTutor({ message: "新しい質問", chapterId: "one" });
    expect(calls).toHaveLength(1);
    const { prompt, systemPrompt } = calls[0]!;
    expect(systemPrompt).toContain("澪");
    // The chapter body comes from book_files via toc.json, not from the caller.
    expect(prompt).toContain("one の本文");
    expect(prompt).not.toContain("two の本文");
    // History is the open chapter's last 12, including the question just stored:
    // 16 messages exist for the chapter after the insert, so the oldest 4 are dropped
    // and nothing from the other chapter is quoted.
    expect(prompt).toContain("新しい質問");
    expect(prompt).toContain("一章の会話5");
    expect(prompt).toContain("一章の会話15");
    expect(prompt).not.toContain("一章の会話4");
    expect(prompt).not.toContain("二章の会話");
    // The returned state is the chapter's conversation: seeded 15 + question + reply.
    expect(state.messages).toHaveLength(17);
    expect(state.messages.at(-1)).toEqual({ role: "assistant", content: "澪の返答" });
    expect(state.messages.some((item: { content: string }) => item.content === "二章の会話")).toBe(false);
    // The other chapter's conversation is untouched and still readable.
    expect(gadget.getState("two").messages.map((item: { content: string }) => item.content))
      .toEqual(["二章の会話"]);
  });

  it("reads conversations, progress and last chapter written by the previous schema", async () => {
    const { gadget, exec } = makeGadget();
    seedMessages(exec, "one", ["古い質問", "古い返答"]);
    exec("INSERT INTO progress (chapter_id, completed, updated_at) VALUES ('one', 1, 1)");
    exec("INSERT INTO settings (key, value) VALUES ('lastChapter', 'two')");
    const state = gadget.getState("one");
    expect(state.messages.map((item: { content: string }) => item.content))
      .toEqual(["古い質問", "古い返答"]);
    expect(state.progress).toEqual({ one: true });
    expect(state.lastChapter).toBe("two");
    await expect(gadget.askTutor({ message: "q", chapterId: "one" })).rejects.toThrow("未接続");
  });

  it("deletes stored book files and falls back to defaults only once the toc is gone", () => {
    const { gadget } = makeGadget();
    const after = gadget.deleteBookFiles(["content/two.md"]);
    expect(after["content/two.md"]).toBeUndefined();
    expect(after["content/one.md"]).toBe(FILES["content/one.md"]);
    expect(after["content/toc.json"]).toBe(FILES["content/toc.json"]);
    const restored = gadget.deleteBookFiles(["content/toc.json"]);
    expect(JSON.parse(restored["content/toc.json"]!).title).toBe("新しい本");
    expect(restored["content/introduction.md"]).toBeDefined();
  });
});
