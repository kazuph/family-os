import type { UiBundle } from '@gadgets/workshop-shared/api';

/** Read the existing book reader and its split data-URL assets without altering stored code. */
export async function readBookUiBundle(files: ReadonlyMap<string, string>): Promise<UiBundle | null> {
  let source = files.get('client.js');
  if (source === undefined) {
    const parts = [...files].filter(([name]) => name.startsWith('client.js.gz/'))
      .toSorted(([a], [b]) => a.localeCompare(b));
    if (parts.length === 0) return null;
    const compressed = Uint8Array.fromBase64(parts.map(([, part]) => part).join(''));
    source = await new Response(new Response(compressed).body!
      .pipeThrough(new DecompressionStream('gzip'))).text();
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
  const assets = Object.fromEntries([...grouped].map(([path, parts]) => [path,
    parts.toSorted(([a], [b]) => a.localeCompare(b)).map(([, value]) => value).join(''),
  ]));
  return { jsCode: `globalThis.__gadgetAssets=${JSON.stringify(assets)};\n${source}` };
}
