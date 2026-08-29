import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { readGadgetArchiveFiles } from './gadgetArchiveImport'

async function archive(files: Record<string, string>): Promise<File> {
  const doc = new Y.Doc()
  const root = doc.getMap<Y.Text>()
  for (const [name, content] of Object.entries(files)) root.set(name, new Y.Text(content))
  const update = Y.encodeStateAsUpdateV2(doc)
  const source = new Response(update.buffer.slice(
    update.byteOffset,
    update.byteOffset + update.byteLength,
  ) as ArrayBuffer).body!
  const content = await new Response(source.pipeThrough(new CompressionStream('gzip'))).arrayBuffer()
  const metadata = new TextEncoder().encode(JSON.stringify({ title: 'Imported' }))
  const prefix = new Uint8Array(24)
  const view = new DataView(prefix.buffer)
  view.setBigUint64(0, 0xec2e2d3a2300e317n)
  view.setUint32(8, 1)
  view.setUint32(12, metadata.byteLength)
  view.setBigUint64(16, BigInt(content.byteLength))
  return new File([prefix, metadata, content], 'book.gadget')
}

describe('gadget archive import', () => {
  it('reads the complete file map', async () => {
    await expect(readGadgetArchiveFiles(await archive({
      'client.js': 'document.body.textContent = "book"',
      'server.js': 'export class Gadget {}',
    }))).resolves.toEqual(new Map([
      ['client.js', 'document.body.textContent = "book"'],
      ['server.js', 'export class Gadget {}'],
    ]))
  })

  it('rejects a truncated archive', async () => {
    const valid = new Uint8Array(await (await archive({'client.js': 'ok'})).arrayBuffer())
    await expect(readGadgetArchiveFiles(new File([valid.subarray(0, -1)], 'bad.gadget')))
      .rejects.toThrow('Invalid gadget archive lengths.')
  })
})
