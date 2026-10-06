import { env, exports } from 'cloudflare:workers';
import { SELF, abortAllDurableObjects, runInDurableObject } from 'cloudflare:test';
import { newWebSocketRpcSession } from 'capnweb';
import { expect, it } from 'vitest';
import type { PublicApi } from '@gadgets/workshop-shared/api';
import { keyString } from '@gadgets/typed-storage';
import { planBookOfflineCopy, type LegacyBookSnapshot } from '../scripts/book-offline-copy/plan';
import { publishBookOfflineCopy } from '../scripts/book-offline-copy/apply';

function decode(value: any): any {
  if (value?.$bytes) return Uint8Array.fromBase64(value.$bytes);
  if (value?.$date) return new Date(value.$date);
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decode(item)]));
  return value;
}
const fixture = (): LegacyBookSnapshot & {username: string; ownerKv: Array<[string, unknown]>; siblings?: Array<{workspaceId: string; gadgetId: number; files: Array<[string,string]>}>} => decode(JSON.parse((env as Record<string, unknown>).LEGACY_BOOK_SNAPSHOT as string));

it('copies a real leased legacy book into its original target and preserves its draft through Git conversion', async () => {
  const input = fixture();
  const unchangedSource = JSON.stringify(input.sourceKv);
  const plan = await planBookOfflineCopy(input);
  expect(plan.status).toBe('copy');
  const sourceMetas=input.sourceKv.filter(([key])=>key.startsWith('chatMeta:'));
  const targetMetas=input.targetKv.filter(([key])=>key.startsWith('chatMeta:'));
  const planned=new Map(plan.targetKv);
  expect(plan.targetKv.filter(([key])=>key.startsWith('chatMeta:'))).toHaveLength(sourceMetas.length+targetMetas.length);
  for (const [key,row] of input.targetKv.filter(([key])=>key.startsWith('chats:')||key.startsWith('chatMeta:'))) expect(planned.get(key)).toEqual(row);
  const start=Number(new Map(input.targetKv).get('nextChatId')??0);
  for (const [index,[,meta]] of sourceMetas.entries()) {
    const expected={...(meta as any),id:start+index};delete expected.codeBase;
    expect(planned.get('chatMeta:'+keyString(start+index))).toEqual(expected);
    const original=input.sourceKv.filter(([key,row])=>key.startsWith('chats:')&&(row as any).chatId===(meta as any).id&&(row as any).type==='message');
    for (const [,message] of original) expect(planned.get('chats:'+keyString(start+index)+'.'+keyString((message as any).sequence))).toEqual({...message as any,chatId:start+index});
    const active=structuredClone(input);(new Map(active.sourceKv).get('chatMeta:'+keyString((meta as any).id)) as any).activeAgent={type:'agent',id:'active',name:'Active'};
    await expect(planBookOfflineCopy(active)).rejects.toThrow('active legacy book turn');
  }

  const connectedCapture = (env as Record<string, unknown>).LEGACY_CONNECTED_BOOK_SNAPSHOT;
  if (connectedCapture) {
    const connected = decode(JSON.parse(connectedCapture as string));
    const unchanged = JSON.stringify(connected);
    await expect(planBookOfflineCopy(connected)).rejects.toThrow('Moved book connection capabilities require owner-preserving conversion');
    expect(JSON.stringify(connected)).toBe(unchanged);
  }
  const wrongLease = structuredClone(input);
  const sourceRecord = new Map(wrongLease.sourceKv).get('gadgets:' + keyString(input.sourceGadgetId)) as any;
  sourceRecord.move.targetWorkspaceId = input.sourceWorkspaceId;
  await expect(planBookOfflineCopy(wrongLease)).rejects.toThrow('lease destination mismatch');
  const wrongToken = structuredClone(input);
  const targetRecord = new Map(wrongToken.targetKv).get('gadgets:' + keyString(input.targetGadgetId)) as any;
  targetRecord.movedFrom.token += '-different';
  await expect(planBookOfflineCopy(wrongToken)).rejects.toThrow('lease token mismatch');
  const pendingMove = structuredClone(input);
  (new Map(pendingMove.sourceKv).get('gadgets:' + keyString(input.sourceGadgetId)) as any).movePending = {};
  await expect(planBookOfflineCopy(pendingMove)).rejects.toThrow('Pending book move');
  const compactedTarget = structuredClone(input);
  const preservedPartition = input.sourceKv.find(([key]) => key.startsWith('snapshotParts:'));
  if (!preservedPartition) throw new Error('The real legacy capture must include its partitioned snapshot');
  compactedTarget.targetKv.push(preservedPartition);
  const compactedBefore = JSON.stringify(compactedTarget);
  await expect(planBookOfflineCopy(compactedTarget)).rejects.toThrow('Compacted legacy destination');
  expect(JSON.stringify(compactedTarget)).toBe(compactedBefore);
  expect(plan.draftFiles).toHaveLength(1);
  expect(plan.acceptedFiles.find(([path]) => path === 'server.js')?.[1]).not.toContain('Preserved unaccepted legacy edit');
  expect(plan.draftFiles[0].files.find(([path]) => path === 'server.js')?.[1]).toContain('Preserved unaccepted legacy edit');
  const owner = exports.UserDurableObject.getByName(input.username);
  expect(owner.id.toString()).toBe(input.ownerId);
  await runInDurableObject(owner, (instance, ctx) => {
    if (ctx.storage.kv.list().size) throw new Error('The isolated account destination must be empty');
    ctx.storage.transactionSync(() => {
      for (const [key, value] of input.ownerKv) ctx.storage.kv.put(key, value);
    });
  });
  await abortAllDurableObjects();
  const response = await SELF.fetch(new Request('https://workshop.invalid/api', {headers: {Upgrade: 'websocket'}}));
  response.webSocket!.accept();
  using root = newWebSocketRpcSession<PublicApi>(response.webSocket!);
  const token = await root.login(input.username, new Uint8Array([1, 2, 3]));
  expect(token).toBeTruthy();
  expect(exports.UserDurableObject.getByName(input.username).id.toString()).toBe(input.ownerId);
  using api = await root.authenticate(token!);
  expect((await api.whoami()).id).toBe(input.username);
  const ns = exports.OverseerDurableObject;
  let target = ns.get(ns.idFromString(input.targetWorkspaceId));
  await runInDurableObject(target, (instance, ctx) => {
    if (ctx.storage.kv.list().size) throw new Error('The isolated destination must be empty before restoring its capture');
    ctx.storage.transactionSync(() => {
      for (const [key, value] of input.targetKv) ctx.storage.kv.put(key, value);
    });
  });
  // The stopped copy writes SQLite first. A failed publication can safely repeat an exact SQL
  // copy, while a different row set refuses overwrite. Main KV is published in one transaction.
  await runInDurableObject(target, async (instance, ctx) => {
    const recoveryFacet = ctx.facets.get('book-copy-recovery-proof', () => ({class: (ctx.exports as any).BookOfflineCopyFacet}));
    const failedCopy = structuredClone(input.tables);
    failedCopy.settings[0].unsupported_column = 'Force the actual copier to fail after earlier table writes';
    expect(await recoveryFacet.verifyCopyRefusal(failedCopy)).toEqual({accepted: false, message: 'Unsupported legacy SQLite column'});
    expect(Object.values(await recoveryFacet.inspectTables()).every(rows => rows.length === 0)).toBe(true);
    expect(await recoveryFacet.copyTables(input.tables)).toEqual(input.tables);
    const name = new Map(input.targetKv).get('defaultGadgetId') === input.targetGadgetId ? 'gadget' : `gadget${input.targetGadgetId}`;
    const facet = ctx.facets.get(name, () => ({class: (ctx.exports as any).BookOfflineCopyFacet}));
    expect(await facet.copyTables(input.tables)).toEqual(input.tables);
    const conflicting = structuredClone(input.tables);
    conflicting.book_files[0].content += '\nConflicting partial-copy retry';
    expect(await facet.verifyCopyRefusal(conflicting)).toEqual({accepted: false, message: 'Destination SQLite differs; refusing overwrite'});
    expect(await facet.inspectTables()).toEqual(input.tables);
    expect(await facet.copyTables(input.tables)).toEqual(input.tables);
    publishBookOfflineCopy(ctx, input, plan);
  });
  await abortAllDurableObjects();
  target = ns.get(ns.idFromString(input.targetWorkspaceId));
  const books = await target.getBookMcpWorkspaces(input.ownerId);
  expect((await api.listGadgets()).some(workspace => workspace.id === input.targetWorkspaceId)).toBe(true);
  expect(books.some(book => book.workspaceId === input.targetWorkspaceId && book.gadgetId === input.targetGadgetId)).toBe(true);
  const files = await target.readBookMcpFiles(input.ownerId, ['content/legacy.md'], input.targetGadgetId);
  expect(files[0].content).toContain('A preserved manuscript');
  expect(await target.readBookMcpProgress(input.ownerId, input.targetGadgetId)).toEqual({legacy: true});
  const raw = await runInDurableObject(target, (instance, ctx) => [...ctx.storage.kv.list()]);
  const kv = new Map(raw);
  for(const [index,[,meta]] of sourceMetas.entries()) {
    expect((kv.get('chatMeta:'+keyString(start+index)) as any).title).toBe((meta as any).title);
    for(const [,message] of input.sourceKv.filter(([key,row])=>key.startsWith('chats:')&&(row as any).chatId===(meta as any).id&&(row as any).type==='message')) {
      expect(kv.get('chats:'+keyString(start+index)+'.'+keyString((message as any).sequence))).toEqual({...message as any,chatId:start+index});
    }
  }
  for(const [key,row] of input.targetKv.filter(([key,row])=>key.startsWith('chats:')&&(row as any).type==='message')) expect(kv.get(key)).toEqual(row);

  expect(kv.get('version')).toBe(4);
  expect((kv.get('gadgets:' + keyString(input.targetGadgetId)) as any).commitId).toMatch(/^[0-9a-f]{40}$/);
  expect(raw.some(([key]) => key.startsWith('chatDraftUpdates:'))).toBe(false);
  expect(raw.some(([key, row]) => key.startsWith('chats:') && (row as any).type === 'changes' && (row as any).conversionBoundary)).toBe(true);
  const restored = await runInDurableObject(target, async (instance, ctx) => {
    const impl = (instance as any).impl;
    const acceptedFiles = [...await impl.readGadgetFiles(input.targetGadgetId)].toSorted(([a], [b]) => a.localeCompare(b));
    const drafts = await Promise.all(plan.draftFiles.map(async draft => ({chatId: draft.chatId, files: [...await impl.readGadgetFiles(input.targetGadgetId, draft.chatId)].toSorted(([a], [b]) => a.localeCompare(b))})));
    const name = impl.gadgetFacetName(input.targetGadgetId);
    ctx.facets.abort(name, new Error('Stopped copied book for local SQL comparison'));
    const inspector = ctx.facets.get(name, () => ({class: (ctx.exports as any).BookOfflineCopyFacet}));
    return {acceptedFiles, drafts, tables: await inspector.inspectTables()};
  });
  expect(restored.acceptedFiles).toEqual(plan.acceptedFiles);
  expect(restored.drafts).toEqual(plan.draftFiles);
  expect(restored.tables).toEqual(input.tables);
  for (const sibling of input.siblings ?? []) {
    if (sibling.workspaceId !== input.targetWorkspaceId) continue;
    const actual = await runInDurableObject(target, async instance =>
      [...await (instance as any).impl.readGadgetFiles(sibling.gadgetId)].toSorted(([a], [b]) => a.localeCompare(b)));
    expect(actual).toEqual(sibling.files);
    expect(sibling.gadgetId).not.toBe(input.targetGadgetId);
  }

  const accepted = new Map(plan.acceptedFiles);
  const assets = Object.fromEntries(plan.acceptedFiles
    .filter(([path]) => path.startsWith('client.assets/'))
    .map(([path, value]) => [decodeURIComponent(path.slice('client.assets/'.length, path.lastIndexOf('/'))), value]));
  expect(Object.keys(assets)).toHaveLength(4);
  const expectedUi = `globalThis.__gadgetAssets=${JSON.stringify(assets)};\n${accepted.get('client.js')}`;
  const retryInput = {...input, targetKv: raw, targetTables: restored.tables, targetDraftFiles: restored.drafts};
  expect((await planBookOfflineCopy(retryInput)).status).toBe('noop');
  const alteredTables = structuredClone(input.tables);
  alteredTables.book_files[0].content += '\nUnexpected competing edit';
  await expect(planBookOfflineCopy({...retryInput, targetTables: alteredTables})).rejects.toThrow('SQLite hash mismatch');
  await expect(planBookOfflineCopy({...retryInput, tables: alteredTables})).rejects.toThrow('source hash mismatch');
  await abortAllDurableObjects();
  target = ns.get(ns.idFromString(input.targetWorkspaceId));
  expect(await target.readBookMcpFiles(input.ownerId, ['content/legacy.md'], input.targetGadgetId)).toEqual(files);
  expect(await target.readBookMcpProgress(input.ownerId, input.targetGadgetId)).toEqual({legacy: true});
  const restartedUi = await runInDurableObject(target, async instance =>
    await (instance as any).impl.getGadgetUiBundle(input.targetGadgetId));
  expect(restartedUi?.jsCode).toBe(expectedUi);
  for (const sibling of input.siblings ?? []) {
    if (sibling.workspaceId !== input.targetWorkspaceId) continue;
    const actual = await runInDurableObject(target, async instance =>
      [...await (instance as any).impl.readGadgetFiles(sibling.gadgetId)].toSorted(([a], [b]) => a.localeCompare(b)));
    expect(actual).toEqual(sibling.files);
    expect(sibling.gadgetId).not.toBe(input.targetGadgetId);
  }

  expect(JSON.stringify(input.sourceKv)).toBe(unchangedSource);
  await expect(planBookOfflineCopy({...input, ownerId: 'another-owner'})).rejects.toThrow('owner mismatch');
  using workspace = await api.openGadget(input.targetWorkspaceId);
  for (const draft of plan.draftFiles) await workspace.discardChatDraftChanges(draft.chatId);
  await abortAllDurableObjects();
  target = ns.get(ns.idFromString(input.targetWorkspaceId));
  const afterDiscard = await runInDurableObject(target, async instance =>
    [...await (instance as any).impl.readGadgetFiles(input.targetGadgetId)].toSorted(([a], [b]) => a.localeCompare(b)));
  expect(afterDiscard).toEqual(plan.acceptedFiles);
  expect(JSON.stringify(input.sourceKv)).toBe(unchangedSource);
});
