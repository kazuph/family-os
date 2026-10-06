import * as Y from 'yjs';
import { keyString } from '@gadgets/typed-storage';
import { decodeLooseObject, parseGitCommitRefs, parseGitTree } from '../../src/git-codec';
import { chatChangeStatuses } from '../../src/agent-compaction';
import { legacyChatBaseVersion } from '../../src/storage-schema/overseer-git-migration';

/** A stopped legacy runtime's book-specific snapshot; source and destination remain separate. */
export type LegacyBookSnapshot = {
  /** Exact archive provenance; a numeric schema version alone cannot identify this fork. */
  baseline: 'f41f7db45e6a2ecf593241288b6ba5f02c405c71';
  ownerId: string;
  sourceWorkspaceId: string;
  sourceGadgetId: number;
  targetWorkspaceId: string;
  targetGadgetId: number;
  sourceKv: Array<[string, unknown]>;
  targetKv: Array<[string, unknown]>;
  tables: Record<string, Array<Record<string, string | number | null>>>;
  /** Actual destination SQLite rows on reapplication, rather than the source's rows. */
  targetTables?: LegacyBookSnapshot['tables'];
  /** Flattened live destination proposals after the upstream Git conversion. */
  targetDraftFiles?: Array<{ chatId: number; files: Array<[string, string]> }>;
};

type Row = Record<string, any>;
const record = (value: unknown): Row => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid legacy record');
  return value as Row;
};
const entries = (kv: Map<string, unknown>, prefix: string): Row[] => [...kv]
  .filter(([key]) => key.startsWith(prefix + ':')).toSorted(([a], [b]) => a.localeCompare(b))
  .map(([, value]) => record(value));
const files = (doc: Y.Doc, root: string): Map<string, string> =>
  new Map([...doc.getMap<Y.Text>(root)].map(([name, value]) => [name, value.toString()]));
const orderedFiles = (value: ReadonlyMap<string, string>) => [...value].toSorted(([a], [b]) => a.localeCompare(b));
function canonical(value: any): any {
  if (value instanceof Uint8Array) return { bytes: value.toBase64() };
  if (value instanceof Date) return { date: value.toISOString() };
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).toSorted(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
async function hash(value: unknown): Promise<string> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(canonical(value))))).toHex();
}
function replay(kv: Map<string, unknown>, version = Infinity): Y.Doc {
  const doc = new Y.Doc();
  // The fork prunes incremental rows behind its latest complete partitioned snapshot.
  const legacy = entries(kv, 'snapshots').filter(row => row.version <= version).at(-1);
  const parts = entries(kv, 'snapshotParts').filter(row => row.version <= version);
  const newest = parts.at(-1)?.version;
  let floor = legacy?.version ?? 0;
  if (newest !== undefined && newest > floor) {
    const selected = parts.filter(row => row.version === newest).toSorted((a, b) => a.index - b.index);
    if (selected.length !== selected[0].partCount || selected.some((row, index) => row.index !== index || row.partCount !== selected.length || !(row.update instanceof Uint8Array))) throw new Error('Incomplete legacy book code snapshot');
    const update = new Uint8Array(selected.reduce((size, row) => size + row.update.length, 0));
    let offset = 0;
    for (const row of selected) { update.set(row.update, offset); offset += row.update.length; }
    Y.applyUpdateV2(doc, update);
    floor = newest;
  } else if (legacy) {
    Y.applyUpdateV2(doc, legacy.update);
  }
  for (const row of entries(kv, 'code')) if (row.version > floor && row.version <= version) Y.applyUpdateV2(doc, row.update);
  return doc;
}
function proposed(source: Map<string, unknown>, meta: Row, sourceRoot: string): Map<string, string> {
  const messages = entries(source, 'chats').filter(row => row.chatId === meta.id);
  const checkpoint = entries(source, 'chatCompactions').filter(row => row.chatId === meta.id).at(-1);
  const anchor = legacyChatBaseVersion(checkpoint as Parameters<typeof legacyChatBaseVersion>[0], messages as Parameters<typeof legacyChatBaseVersion>[1]);
  const doc = replay(source, anchor === 'current' ? Infinity : anchor);
  const statuses = chatChangeStatuses(messages as Parameters<typeof chatChangeStatuses>[0]);
  for (const message of messages) if (message.type === 'changes' && statuses.get(message.sequence) !== 'reverted' && message.update) Y.applyUpdateV2(doc, message.update);
  for (const draft of entries(source, 'chatDraftUpdates').filter(row => row.chatId === meta.id)) Y.applyUpdateV2(doc, draft.update);
  return files(doc, sourceRoot);
}
function setFiles(doc: Y.Doc, root: string, next: ReadonlyMap<string, string>): void {
  const map = doc.getMap<Y.Text>(root);
  for (const name of map.keys()) if (!next.has(name)) map.delete(name);
  for (const [name, content] of next) {
    const previous = map.get(name);
    if (previous?.toString() === content) continue;
    const text = new Y.Text(); text.insert(0, content); map.set(name, text);
  }
}
function gitFiles(kv: Map<string, unknown>, oid: string): Map<string, string> {
  const read = (id: string) => decodeLooseObject(record(kv.get('gitObjects:' + id)).data);
  const commit = read(oid);
  if (commit.type !== 'commit') throw new Error('Invalid destination book head');
  const output = new Map<string, string>();
  const walk = (tree: string, prefix: string) => {
    const object = read(tree);
    if (object.type !== 'tree') throw new Error('Invalid destination book tree');
    for (const entry of parseGitTree(object.payload, tree)) {
      if (entry.mode === '40000') walk(entry.oid, prefix + entry.name + '/');
      else { const blob = read(entry.oid); if (blob.type !== 'blob') throw new Error('Unsupported book file object'); output.set(prefix + entry.name, new TextDecoder().decode(blob.payload)); }
    }
  };
  walk(parseGitCommitRefs(commit.payload, oid).tree, '');
  return output;
}

/** A copy plan for the original target IDs, with an immutable source fingerprint and full SQL rows. */
export type BookOfflineCopyPlan = {
  status: 'copy' | 'noop';
  sourceHash: string;
  targetKv: Array<[string, unknown]>;
  tables: LegacyBookSnapshot['tables'];
  acceptedFiles: Array<[string, string]>;
  draftFiles: Array<{ chatId: number; files: Array<[string, string]> }>;
};

/** Validate the old owner and lease before preparing a book-only copy; never modify the source. */
export async function planBookOfflineCopy(input: LegacyBookSnapshot): Promise<BookOfflineCopyPlan> {
  if (input.baseline !== 'f41f7db45e6a2ecf593241288b6ba5f02c405c71') throw new Error('Unsupported legacy book provenance');
  const source = new Map(input.sourceKv);
  const target = new Map(input.targetKv);
  if (source.get('ownerId') !== input.ownerId || target.get('ownerId') !== input.ownerId) throw new Error('Book owner mismatch');
  const sourceBook = record(source.get('gadgets:' + keyString(input.sourceGadgetId)));
  const targetBook = record(target.get('gadgets:' + keyString(input.targetGadgetId)));
  if (sourceBook.output?.id !== 'book' || targetBook.output?.id !== 'book') throw new Error('Only books can be copied');
  const lease = sourceBook.move;
  if (sourceBook.pending || sourceBook.movePending || targetBook.pending || targetBook.movePending || lease?.state !== 'leased' || lease.previousLease) throw new Error('Pending book move or edit lifecycle requires resolution');
  if (lease.targetWorkspaceId !== input.targetWorkspaceId || lease.targetGadgetId !== input.targetGadgetId) throw new Error('Book lease destination mismatch');
  const sourceRoot = source.get('defaultGadgetId') === input.sourceGadgetId ? '' : String(input.sourceGadgetId);
  const targetRoot = target.get('defaultGadgetId') === input.targetGadgetId ? '' : String(input.targetGadgetId);
  const accepted = files(replay(source), sourceRoot);
  if (accepted.size === 0) throw new Error('Legacy book has no accepted code');
  const sourceHash = await hash({ ownerId: input.ownerId, sourceWorkspaceId: input.sourceWorkspaceId, sourceGadgetId: input.sourceGadgetId, targetWorkspaceId: input.targetWorkspaceId, targetGadgetId: input.targetGadgetId, sourceKv: input.sourceKv, tables: input.tables });
  const receiptKey = 'bookOfflineCopy:' + keyString(input.targetGadgetId);
  const receipt = target.get(receiptKey) as Row | undefined;
  if (receipt) {
    if (receipt.sourceHash !== sourceHash) throw new Error('Book source hash mismatch; refusing overwrite');
    const current = targetBook.commitId ? gitFiles(target, targetBook.commitId) : files(replay(target), targetRoot);
    if (await hash(orderedFiles(current)) !== receipt.acceptedHash) throw new Error('Book destination code hash mismatch; refusing overwrite');
    // New-runtime SQL and proposed-code snapshots must be supplied on reapplication too.
    if (!input.targetTables || await hash(input.targetTables) !== receipt.tablesHash) throw new Error('Book destination SQLite hash mismatch; refusing overwrite');
    if (!input.targetDraftFiles || await hash(input.targetDraftFiles) !== await hash(receipt.draftFiles)) throw new Error('Book destination draft hash mismatch; refusing overwrite');
    return { status: 'noop', sourceHash, targetKv: input.targetKv, tables: input.tables, acceptedFiles: orderedFiles(accepted), draftFiles: receipt.draftFiles };
  }
  if (target.get('version') !== 2) throw new Error('Copy the legacy target before starting its Git migration');
  // Upstream's converter consumes the incremental code log, whereas this fork can prune it
  // behind partitioned snapshots. Do not expose a destination whose sibling history is lost.
  if (entries(target, 'snapshotParts').length) throw new Error('Compacted legacy destination requires preserved code-log conversion');
  if (entries(source, 'code').some(row => !(row.update instanceof Uint8Array) || !(row.timestamp instanceof Date)) ||
      entries(target, 'code').some(row => !(row.update instanceof Uint8Array) || !(row.timestamp instanceof Date)) ||
      [...target.keys()].some(key => key.startsWith('gitObjects:')) || targetBook.commitId) {
    throw new Error('Destination is not a stopped legacy Yjs workspace');
  }
  const origin = targetBook.movedFrom;
  if (origin?.sourceWorkspaceId !== input.sourceWorkspaceId || origin.sourceGadgetId !== input.sourceGadgetId || origin.token !== lease.token) throw new Error('Book source lease token mismatch');
  // A moved connection is a capability, not interchangeable with a new local connection. Keep
  // its records intact and require an explicit conversion before exposing a copied book.
  if (Object.keys(sourceBook.bindings ?? {}).length || Object.keys(targetBook.bindings ?? {}).length) throw new Error('Moved book connection capabilities require owner-preserving conversion');
  const targetDoc = replay(target);
  if (files(targetDoc, targetRoot).size) throw new Error('Book destination already has code; refusing overwrite');
  const before = Y.encodeStateVector(targetDoc);
  setFiles(targetDoc, targetRoot, accepted);
  const log = entries(target, 'code');
  const version = (log.at(-1)?.version ?? 0) + 1;
  const timestamp = log.at(-1)?.timestamp ?? sourceBook.created;
  target.set('code:' + keyString(version), { version, timestamp, update: Y.encodeStateAsUpdateV2(targetDoc, before) });
  const copied = { ...targetBook };
  delete copied.movedFrom; delete copied.filesRoot;
  target.set('gadgets:' + keyString(input.targetGadgetId), copied);
  const draftFiles: BookOfflineCopyPlan['draftFiles'] = [];
  let nextChatId = Number(target.get('nextChatId') ?? 0);
  for (const meta of entries(source, 'chatMeta')) {
    if (meta.activeAgent) throw new Error('An active legacy book turn must be stopped before copying');
    const next = proposed(source, meta, sourceRoot);
    const hasDraft = await hash(orderedFiles(next)) !== await hash(orderedFiles(accepted));
    const chatId = nextChatId++;
    const freshMeta: Row = { ...meta, id: chatId };
    delete freshMeta.codeBase;
    target.set('chatMeta:' + keyString(chatId), freshMeta);
    const messages = entries(source, 'chats').filter(row => row.chatId === meta.id);
    for (const old of messages) {
      const message: Row = { ...old, chatId };
      // Historical Yjs bytes remain in the untouched source snapshot. The destination's live
      // proposal is written once below against its own accepted root, so it cannot edit a sibling.
      if (message.type === 'changes') { delete message.update; message.observedCodeVersion = version; }
      if (message.type === 'merge') message.version = version;
      if (message.type === 'message') message.toolCalls = message.toolCalls?.map((call: Row) => ({ ...call, observedCodeVersion: version }));
      target.set('chats:' + keyString(chatId) + '.' + keyString(message.sequence), message);
    }
    target.set('nextChatSequences:' + keyString(chatId), { chatId, nextSequence: Math.max(0, ...messages.map(row => row.sequence + 1)) });
    if (!hasDraft) continue;
    const draftDoc = new Y.Doc(); Y.applyUpdateV2(draftDoc, Y.encodeStateAsUpdateV2(targetDoc));
    const vector = Y.encodeStateVector(draftDoc); setFiles(draftDoc, targetRoot, next);
    const oldDrafts = entries(source, 'chatDraftUpdates').filter(row => row.chatId === meta.id);
    const last = oldDrafts.at(-1);
    const draftTime = last?.timestamp ?? meta.lastActive;
    target.set('chatDraftUpdates:' + keyString(chatId) + '.' + keyString(draftTime.valueOf()), { chatId, timestamp: draftTime, author: last?.author ?? { type: 'user', id: input.ownerId, name: 'Book owner' }, gadgetIds: [input.targetGadgetId], update: Y.encodeStateAsUpdateV2(draftDoc, vector) });
    draftFiles.push({ chatId, files: orderedFiles(next) });
  }
  target.set('nextChatId', nextChatId);
  // In this exact fork version 2 means action indexes, not Git. Only the checked copy is
  // mapped to upstream's pre-Git state; the original source and Git workspaces are untouched.
  target.set('version', 1);
  target.set(receiptKey, { sourceHash, acceptedHash: await hash(orderedFiles(accepted)), tablesHash: await hash(input.tables), draftFiles });
  return { status: 'copy', sourceHash, targetKv: [...target], tables: structuredClone(input.tables), acceptedFiles: orderedFiles(accepted), draftFiles };
}
