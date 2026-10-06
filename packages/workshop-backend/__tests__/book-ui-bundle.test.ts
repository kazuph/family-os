import { expect, it } from 'vitest';
import { readBookUiBundle } from '../src/book-ui-bundle';

it('reconstructs the existing split book assets in their filename order', async () => {
  const files = new Map([
    ['client.js', 'document.body.textContent = "Book reader";'],
    ['client.assets/font%2Fbook.woff2/01', 'second'],
    ['client.assets/font%2Fbook.woff2/00', 'data:font/woff2;base64,first'],
  ]);
  const bundle = await readBookUiBundle(files);
  expect(bundle?.jsCode).toBe('globalThis.__gadgetAssets={"font/book.woff2":"data:font/woff2;base64,firstsecond"};\ndocument.body.textContent = "Book reader";');
});

it('reads a genuinely gzip-compressed legacy client without rewriting its persisted files', async () => {
  const reader = 'document.body.textContent = "Legacy reader";';
  const compressed = new Uint8Array(await new Response(new Response(reader).body!.pipeThrough(new CompressionStream('gzip'))).arrayBuffer()).toBase64();
  const middle = Math.ceil(compressed.length / 2);
  const files = new Map([['client.js.gz/01', compressed.slice(middle)], ['client.js.gz/00', compressed.slice(0, middle)]]);
  const original = [...files];
  expect((await readBookUiBundle(files))?.jsCode).toBe('globalThis.__gadgetAssets={};\n' + reader);
  expect([...files]).toEqual(original);
});

it('retains missing UI and corrupt compressed UI failure behavior', async () => {
  expect(await readBookUiBundle(new Map())).toBeNull();
  await expect(readBookUiBundle(new Map([['client.js.gz/00', new TextEncoder().encode('not gzip').toBase64()]]))).rejects.toThrow();
});
