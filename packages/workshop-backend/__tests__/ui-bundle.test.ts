import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { readUiBundle } from "../src/ui-bundle.js";

function docFiles(entries: Record<string, string>): Y.Map<Y.Text> {
  let doc = new Y.Doc();
  let files = doc.getMap<Y.Text>();
  doc.transact(() => {
    for (let [name, content] of Object.entries(entries)) {
      let text = new Y.Text();
      text.insert(0, content);
      files.set(name, text);
    }
  });
  return files;
}

async function gzipParts(source: string, partLength: number): Promise<Record<string, string>> {
  let gzipped = new Uint8Array(await new Response(
    new Response(source).body!.pipeThrough(new CompressionStream("gzip"))).arrayBuffer());
  let base64 = gzipped.toBase64();
  let parts: Record<string, string> = {};
  for (let index = 0; index * partLength < base64.length; index++) {
    parts[`client.js.gz/${index.toString().padStart(4, "0")}`] =
      base64.slice(index * partLength, (index + 1) * partLength);
  }
  return parts;
}

describe("reading a Gadget UI bundle", () => {
  it("returns a plain client.js unchanged", async () => {
    let bundle = await readUiBundle(docFiles({"client.js": "export const ui = 1;"}));
    expect(bundle).toEqual({jsCode: "export const ui = 1;"});
  });

  it("injects opaque asset parts without mixing them into editable client source", async () => {
    let files = docFiles({
      "client.js": "document.body.append(image);",
      "client.assets/%2Fillustrations%2Fchapter.png/0001": "BBBB",
      "client.assets/%2Fillustrations%2Fchapter.png/0000": "data:image/webp;base64,AAAA",
    });
    let bundle = await readUiBundle(files);
    expect(bundle?.jsCode).toContain(
      'globalThis.__gadgetAssets={"/illustrations/chapter.png":"data:image/webp;base64,AAAABBBB"};',
    );
    expect(bundle?.jsCode).toContain("document.body.append(image);");
  });

  it("reassembles a UI that ships gzipped across several parts", async () => {
    // Legacy book archives used this layout before snapshots were persisted in bounded parts.
    let source = `export const chapters = ${JSON.stringify(
      Array.from({length: 42}, (_, chapter) => `content/ch${chapter}.md`))};`;
    let files = docFiles(await gzipParts(source, 64));
    expect([...files].length).toBeGreaterThan(1);
    await expect(readUiBundle(files)).resolves.toEqual({jsCode: source});
  });

  it("orders the parts by name rather than by insertion", async () => {
    let source = "export const ui = 'z'.repeat(4096);";
    let parts = await gzipParts(source, 16);
    let shuffled = Object.fromEntries(Object.entries(parts).toReversed());
    await expect(readUiBundle(docFiles(shuffled))).resolves.toEqual({jsCode: source});
  });

  it("returns null when the Gadget has no UI at all", async () => {
    await expect(readUiBundle(docFiles({"server.js": "export class Gadget {}"}))).resolves.toBeNull();
  });
});
