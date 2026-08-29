import * as Y from 'yjs'

const ARCHIVE_MAGIC = 0xec2e2d3a2300e317n
const ARCHIVE_VERSION = 1
const PREFIX_BYTES = 24
const MAX_METADATA_BYTES = 64 * 1024
const MAX_CONTENT_BYTES = 32 * 1024 * 1024

export async function readGadgetArchiveFiles(file: File): Promise<Map<string, string>> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (bytes.byteLength < PREFIX_BYTES) throw new Error('Invalid gadget archive.')

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (view.getBigUint64(0) !== ARCHIVE_MAGIC) throw new Error('Invalid gadget archive magic number.')
  if (view.getUint32(8) !== ARCHIVE_VERSION) throw new Error('Unsupported gadget archive version.')

  const metadataBytes = view.getUint32(12)
  const contentBytes = Number(view.getBigUint64(16))
  if (metadataBytes === 0 || metadataBytes > MAX_METADATA_BYTES ||
      !Number.isSafeInteger(contentBytes) || contentBytes < 0 || contentBytes > MAX_CONTENT_BYTES ||
      PREFIX_BYTES + metadataBytes + contentBytes !== bytes.byteLength) {
    throw new Error('Invalid gadget archive lengths.')
  }

  JSON.parse(new TextDecoder().decode(bytes.subarray(PREFIX_BYTES, PREFIX_BYTES + metadataBytes)))
  const compressed = bytes.subarray(PREFIX_BYTES + metadataBytes)
  const stream = new Response(compressed).body
  if (!stream) throw new Error('Unable to read gadget archive.')
  const update = new Uint8Array(await new Response(
    stream.pipeThrough(new DecompressionStream('gzip')),
  ).arrayBuffer())

  const doc = new Y.Doc()
  Y.applyUpdateV2(doc, update)
  return new Map([...doc.getMap<Y.Text>()].map(([name, text]) => [name, text.toString()]))
}
