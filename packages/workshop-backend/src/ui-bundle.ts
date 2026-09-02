import type * as Y from "yjs";
import type { UiBundle } from "@gadgets/workshop-shared/api";

/** Prefix of the Yjs file names holding a gzipped, base64-encoded UI bundle, in sorted order. */
export const COMPRESSED_UI_PREFIX = "client.js.gz/";

/** Prefix for opaque, text-encoded UI assets kept separate from editable client source. */
export const UI_ASSET_PREFIX = "client.assets/";

function readUiAssets(files: Y.Map<Y.Text>): Record<string, string> {
  let grouped = new Map<string, Array<[string, string]>>();
  for (let [name, content] of files) {
    if (!name.startsWith(UI_ASSET_PREFIX)) continue;
    let rest = name.slice(UI_ASSET_PREFIX.length);
    let separator = rest.lastIndexOf("/");
    if (separator <= 0) continue;
    let encodedPath = rest.slice(0, separator);
    let parts = grouped.get(encodedPath) ?? [];
    parts.push([rest.slice(separator + 1), content.toString()]);
    grouped.set(encodedPath, parts);
  }

  return Object.fromEntries([...grouped].map(([encodedPath, parts]) => [
    decodeURIComponent(encodedPath),
    parts.toSorted(([a], [b]) => a.localeCompare(b)).map(([, part]) => part).join(""),
  ]));
}

function withUiAssets(source: string, files: Y.Map<Y.Text>): string {
  let assets = readUiAssets(files);
  if (Object.keys(assets).length === 0) return source;
  return `globalThis.__gadgetAssets=${JSON.stringify(assets)};\n${source}`;
}

/**
 * A Gadget normally keeps its UI in a plain `client.js`. Older book archives compressed and split
 * that source across `client.js.gz/0000`, `client.js.gz/0001`, ... to work around the former
 * single-row snapshot storage. Every caller uses this helper while those archives still exist.
 */
export async function readUiBundle(files: Y.Map<Y.Text>): Promise<UiBundle | null> {
  let file = files.get("client.js");
  if (file) return { jsCode: withUiAssets(file.toString(), files) };

  let compressedParts = [...files]
    .filter(([name]) => name.startsWith(COMPRESSED_UI_PREFIX))
    .toSorted(([a], [b]) => a.localeCompare(b));
  if (compressedParts.length === 0) return null;

  let compressed = Uint8Array.fromBase64(compressedParts.map(([, part]) => part.toString()).join(""));
  let stream = new Response(compressed).body;
  if (!stream) throw new Error("Unable to read compressed Gadget UI.");
  return { jsCode: await new Response(stream.pipeThrough(new DecompressionStream("gzip"))).text() };
}
