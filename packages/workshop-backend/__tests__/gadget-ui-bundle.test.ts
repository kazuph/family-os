import { expect, it } from 'vitest';
import { readGadgetUiBundle } from '../src/gadget-ui-bundle';

it('returns a plain gadget\'s client.js byte-for-byte with no asset prelude', async () => {
  const jsCode = 'document.body.textContent = "A gadget";';
  expect(await readGadgetUiBundle(new Map([['client.js', jsCode]])))
      .toEqual({ jsCode });
});

it('reconstructs split assets in their filename order for any gadget', async () => {
  const files = new Map([
    ['client.js', 'document.body.textContent = "Reader";'],
    ['client.assets/font%2Fapp.woff2/01', 'second'],
    ['client.assets/font%2Fapp.woff2/00', 'data:font/woff2;base64,first'],
  ]);
  const bundle = await readGadgetUiBundle(files);
  expect(bundle?.jsCode).toBe('globalThis.__gadgetAssets={"font/app.woff2":"data:font/woff2;base64,firstsecond"};\ndocument.body.textContent = "Reader";');
});

it('reads a genuinely gzip-compressed client without rewriting its persisted files', async () => {
  const reader = 'document.body.textContent = "Compressed UI";';
  const compressed = new Uint8Array(await new Response(new Response(reader).body!.pipeThrough(new CompressionStream('gzip'))).arrayBuffer()).toBase64();
  const middle = Math.ceil(compressed.length / 2);
  const files = new Map([['client.js.gz/01', compressed.slice(middle)], ['client.js.gz/00', compressed.slice(0, middle)]]);
  const original = [...files];
  expect((await readGadgetUiBundle(files))?.jsCode).toBe('globalThis.__gadgetAssets={};\n' + reader);
  expect([...files]).toEqual(original);
});

it('retains missing UI and corrupt compressed UI failure behavior', async () => {
  expect(await readGadgetUiBundle(new Map())).toBeNull();
  await expect(readGadgetUiBundle(new Map([['client.js.gz/00', new TextEncoder().encode('not gzip').toBase64()]]))).rejects.toThrow();
});
