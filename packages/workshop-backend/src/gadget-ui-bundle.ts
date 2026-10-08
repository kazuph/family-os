import type { UiBundle } from '@gadgets/workshop-shared/api';

/**
 * Read a gadget's UI bundle, reassembling the split storage form when present: a gzip-compressed
 * `client.js.gz/<n>` sequence plus data-URL assets stored as `client.assets/<encoded path>/<n>`.
 * Stored code is never altered. A gadget with neither split form gets its `client.js` back
 * untouched, so its `jsCode` is byte-for-byte what a plain read returned before this existed.
 */
export async function readGadgetUiBundle(files: ReadonlyMap<string, string>): Promise<UiBundle | null> {
  let source = files.get('client.js');
  let splitSource = false;
  if (source === undefined) {
    const parts = [...files].filter(([name]) => name.startsWith('client.js.gz/'))
      .toSorted(([a], [b]) => a.localeCompare(b));
    if (parts.length === 0) return null;
    const compressed = Uint8Array.fromBase64(parts.map(([, part]) => part).join(''));
    source = await new Response(new Response(compressed).body!
      .pipeThrough(new DecompressionStream('gzip'))).text();
    splitSource = true;
  }
  const grouped = new Map<string, Array<[string, string]>>();
  for (const [name, value] of files) {
    if (!name.startsWith('client.assets/')) continue;
    const rest = name.slice('client.assets/'.length);
    const separator = rest.lastIndexOf('/');
    if (separator <= 0) continue;
    const path = decodeURIComponent(rest.slice(0, separator));
    const parts = grouped.get(path) ?? [];
    parts.push([rest.slice(separator + 1), value]);
    grouped.set(path, parts);
  }
  // No split storage at all: return the code as stored, with no `__gadgetAssets` prelude.
  if (!splitSource && grouped.size === 0) return { jsCode: source };
  const assets = Object.fromEntries([...grouped].map(([path, parts]) => [path,
    parts.toSorted(([a], [b]) => a.localeCompare(b)).map(([, value]) => value).join(''),
  ]));
  return { jsCode: `globalThis.__gadgetAssets=${JSON.stringify(assets)};\n${source}` };
}
