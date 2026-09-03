import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { parseBlueprintArchive } from "../src/blueprint-archive.js";
import { FORMAT_BLUEPRINTS } from "../src/generated/format-blueprints.js";
import { readUiBundle } from "../src/ui-bundle.js";

async function readBookFiles(): Promise<{
  entry: (typeof FORMAT_BLUEPRINTS)[number],
  metadata: Awaited<ReturnType<typeof parseBlueprintArchive>>["metadata"],
  files: Map<string, Y.Text>,
}> {
  let entry = FORMAT_BLUEPRINTS.find((item) => item.blueprintId === "format.book");
  expect(entry).toBeDefined();
  let archive = new Response(Uint8Array.fromBase64(entry!.archive) as BufferSource).body!;
  let {metadata, content} = await parseBlueprintArchive(archive);
  let update = new Uint8Array(await new Response(
      content.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
  let doc = new Y.Doc();
  Y.applyUpdateV2(doc, update);
  return {entry: entry!, metadata, files: doc.getMap<Y.Text>()};
}

describe("workspace book format", () => {
  it("ships a generic book presentation and AI binding", async () => {
    let {entry, metadata} = await readBookFiles();

    expect(entry.output).toEqual({id: "book", noun: "本", plural: "本", icon: "fileText"});
    expect(metadata.bindings).toEqual({
      AI: {
        type: "aiModel",
        title: "AIチューター",
        description: "開いている章の本文に沿って質問へ答えます。",
      },
    });
  });

  it("keeps book content separate from the reusable reader and server", async () => {
    let {files} = await readBookFiles();
    let client = files.get("client.js")!.toString();
    expect([...files.keys()].toSorted()).toEqual(["README.md", "client.js", "server.js"]);
    expect([...files.keys()].some((name) => name.startsWith("client.js.gz/"))).toBe(false);
    expect(client).not.toContain("data:image/");
    expect(client).toContain("gadget.getBookFiles");
    expect(client).toContain("gadget.setChapterComplete");
    expect(client).toContain("gadget.askTutor");
    expect(client).toContain("event.isComposing");
    expect(client).toContain("event.keyCode === 229");
    expect(client).toContain('bookFiles["content/toc.json"]');
    expect(client).toContain("globalThis.__gadgetAssets");
    expect((await readUiBundle(files))!.jsCode).toContain("gadget.getBookFiles");

    let server = files.get("server.js")!.toString();
    expect(server).toContain("this.env.AI.run");
    expect(server).toContain("CREATE TABLE IF NOT EXISTS messages");
    expect(server).toContain("CREATE TABLE IF NOT EXISTS progress");
    expect(server).toContain("CREATE TABLE IF NOT EXISTS book_files");
    expect(server).toContain("getBookFiles()");
    expect(server).toContain("putBookFiles(files)");
    expect(server).toContain("chapterText");
    expect(server).toContain('"content/introduction.md"');
    expect(server).toContain("新しい本");
  });
});
