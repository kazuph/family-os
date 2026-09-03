import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { parseBlueprintArchive } from "../src/blueprint-archive.js";
import { FORMAT_BLUEPRINTS } from "../src/generated/format-blueprints.js";
import { readUiBundle, UI_ASSET_PREFIX } from "../src/ui-bundle.js";

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
    let client = files.get("client.js")!.toString();
    expect([...files.keys()].some((name) => name.startsWith("client.js.gz/"))).toBe(false);
    expect(client).not.toContain("data:image/");
    expect(client).toContain("isComposing");
    expect(client).toContain("keyCode === 229");
    expect(client).toContain("sendTutorMessage");
    expect(client).toContain('class="composer"');
    expect(client).toContain('class="send" type="button"');
    expect(client).toContain('querySelector(".send").addEventListener("click"');
    expect(client).not.toContain('<form class="composer"');
    expect(client).toContain("katex");
    expect(client).toContain("data-anim");
    for (let animation of [
      "source-filter", "cepstrum-split", "lpc-residual", "mel-filterbank", "beamform-delay",
      "tf-masking", "impedance-layer", "bmode-scan", "doppler-flow", "string-modes",
      "pipe-modes", "temperament-compare", "alert-sound-design", "hrtf-spatial",
      "three-domain-bridge",
    ]) {
      expect(client).toContain(animation);
    }
    expect(client).toContain('"Hiragino Sans"');
    expect(client).toContain('"Hiragino Kaku Gothic ProN"');
    expect(client).not.toContain('"Yu Mincho"');

    let assetNames = [...files.keys()].filter((name) => name.startsWith(UI_ASSET_PREFIX));
    for (let path of [
      "ch42%2F01-source-filter.png", "ch42%2F02-vocoder.png", "ch43%2F01-mic-array.png",
      "ch43%2F02-mfcc-bank.png", "ch44%2F01-transducer-silence.png",
      "ch44%2F02-ultrasonic-clean.png", "ch45%2F01-guitar-fft.png",
      "ch45%2F02-strings-and-pipes.png", "ch46%2F01-notification-design.png",
      "ch46%2F02-spatial-audio.png", "ch46%2F03-afterword-desk.png",
    ]) {
      expect(assetNames.some((name) => name.includes(path))).toBe(true);
    }
    expect((await readUiBundle(files))!.jsCode).toContain("data:image/webp;base64,");

    let server = files.get("server.js")!.toString();
    expect(server).toContain("this.env.AI.run");
    expect(server).toContain("CREATE TABLE IF NOT EXISTS messages");
    expect(server).toContain("CREATE TABLE IF NOT EXISTS progress");
    expect(server).toContain("CREATE TABLE IF NOT EXISTS book_files");
    expect(server).toContain("getBookFiles()");
    expect(server).toContain("putBookFiles(files)");
    expect(server).toContain("chapterText");
    for (let name of [
      "content/part0/ch00.md", "content/part1/ch01.md", "content/part2/ch23.md",
      "content/part3/ch35.md", "content/part4/ch41.md", "content/part4/ch42.md",
      "content/part4/ch46.md", "content/part5/afterword.md",
    ]) {
      expect(server).toContain(name);
    }
    expect(server).not.toMatch(/\npart:\s*\d+/);
    expect(server).not.toMatch(/\nchapter:\s*\d+/);
    expect(server).not.toMatch(/\nprerequisites:/);
  });
});
