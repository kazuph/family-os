import type * as Y from "yjs";
import type { UiBundle } from "@gadgets/workshop-shared/api";

/** Prefix of the Yjs file names holding a gzipped, base64-encoded UI bundle, in sorted order. */
export const COMPRESSED_UI_PREFIX = "client.js.gz/";

// A Gadget normally keeps its UI in a plain `client.js`. A Gadget whose UI is too large for one
// Yjs text -- the book format, whose reader bundles every chapter -- ships it gzipped and
// base64-encoded across `client.js.gz/0000`, `client.js.gz/0001`, ... instead. Every caller that
// serves a UI has to understand both, so they all come through here: a caller that only reads
// `client.js` silently hands a book reader nothing at all.
export async function readUiBundle(files: Y.Map<Y.Text>): Promise<UiBundle | null> {
  let file = files.get("client.js");
  if (file) return { jsCode: file.toString() };

  let compressedParts = [...files]
    .filter(([name]) => name.startsWith(COMPRESSED_UI_PREFIX))
    .toSorted(([a], [b]) => a.localeCompare(b));
  if (compressedParts.length === 0) return null;

  let compressed = Uint8Array.fromBase64(compressedParts.map(([, part]) => part.toString()).join(""));
  let stream = new Response(compressed).body;
  if (!stream) throw new Error("Unable to read compressed Gadget UI.");
  return { jsCode: await new Response(stream.pipeThrough(new DecompressionStream("gzip"))).text() };
}
