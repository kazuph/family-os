import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { parseBlueprintArchive } from "../src/blueprint-archive.js";
import { FORMAT_BLUEPRINTS } from "../src/generated/format-blueprints.js";

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
  it("ships the curated book presentation and AI binding", async () => {
    let {entry, metadata} = await readBookFiles();

    expect(entry.output).toEqual({id: "book", noun: "本", plural: "本", icon: "fileText"});
    expect(metadata.bindings).toEqual({
      AI: {
        type: "aiModel",
        title: "波多野 澪のAIモデル",
        description: "章の本文に沿って質問へ答える学習チューターです。",
      },
    });
  });

  it("contains the selected chapters, images, animations, and reader behavior", async () => {
    let {files} = await readBookFiles();
    let clientArchive = [...files]
      .filter(([name]) => name.startsWith("client.js.gz/"))
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([, content]) => content.toString()).join("");
    let client = await new Response(
      new Response(Uint8Array.fromBase64(clientArchive) as BufferSource).body!
        .pipeThrough(new DecompressionStream("gzip")),
    ).text();
    expect(client).toContain("isComposing");
    expect(client).toContain("keyCode===229");
    expect(client).toContain("sendTutorMessage");
    expect(client).toContain('class="composer"');
    expect(client).toContain('class="send" type="button"');
    expect(client).toContain('querySelector(".send").addEventListener("click"');
    expect(client).not.toContain('<form class="composer"');
    expect(client).toContain("katex");
    expect(client).toContain("data-anim");
    expect(client).toContain("data:image/");
    for (let animation of ["learning-map", "circle-to-sine", "wave-sum"]) {
      expect(client).toContain(animation);
    }
    expect(client).toContain('"Hiragino Sans"');
    expect(client).toContain('"Hiragino Kaku Gothic ProN"');
    expect(client).not.toContain('"Yu Mincho"');

    let server = files.get("server.js")!.toString();
    expect(server).toContain("this.env.AI.run");
    expect(server).toContain("CREATE TABLE IF NOT EXISTS messages");
    expect(server).toContain("CREATE TABLE IF NOT EXISTS progress");
    expect(server).toContain("CREATE TABLE IF NOT EXISTS book_files");
    expect(server).toContain("getBookFiles()");
    expect(server).toContain("putBookFiles(files)");
    expect(server).toContain("chapterText");
    // 執筆済みの全章（第0〜41章）を同梱する。未執筆の第42章は含まない。
    for (let name of ["content/part0/ch00.md", "content/part1/ch01.md", "content/part2/ch23.md", "content/part3/ch35.md", "content/part4/ch41.md"]) {
      expect(server).toContain(name);
    }
    expect(server).not.toContain("content/part4/ch42.md");
    expect(server).not.toMatch(/\npart:\s*\d+/);
    expect(server).not.toMatch(/\nchapter:\s*\d+/);
    expect(server).not.toMatch(/\nprerequisites:/);
  });
});
