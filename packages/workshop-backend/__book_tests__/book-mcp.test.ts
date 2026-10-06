import { env, exports } from 'cloudflare:workers';
import { SELF, runInDurableObject, abortAllDurableObjects } from 'cloudflare:test';
import { newWebSocketRpcSession } from 'capnweb';
import type { PublicApi } from '@gadgets/workshop-shared/api';
import { expect, it } from 'vitest';
import { commitIdentityForAuthor } from '../src/git-store';


async function account(token: string) {
  console.log('mcp-account:fetch');
  const response = await SELF.fetch(new Request('https://workshop.invalid/api', {headers: {Upgrade: 'websocket', Origin: 'https://workshop.invalid', 'cf-access-jwt-assertion': token}}));
  expect(response.status).toBe(101);
  if (!response.webSocket) throw new Error('Expected authenticated WebSocket');
  console.log('mcp-account:accepted-response');
  response.webSocket!.accept();
  const root = newWebSocketRpcSession<PublicApi>(response.webSocket!);
  console.log('mcp-account:rpc-authentication');
  const api = await root.authenticateFromCfAccess();
  return {root, api};
}
async function call(token: string | undefined, name: string, args: Record<string, unknown> = {}) {
  const response = await SELF.fetch(new Request('https://workshop.invalid/mcp', {
    method: 'POST', headers: {'content-type': 'application/json', ...(token ? {'cf-access-jwt-assertion': token} : {})},
    body: JSON.stringify({jsonrpc: '2.0', id: 1, method: 'tools/call', params: {name, arguments: args}}),
  }));
  return {status: response.status, body: response.headers.get('content-type')?.includes('json') ? await response.json() as any : await response.text()};
}

it('uses signed local Access assertions and real owner DOs for all book MCP boundaries', async () => {
  const issuer = (env as Record<string, unknown>).CF_ACCESS_ISS as string;
  console.log('mcp-stage:signed-token-fetch');
  const tokens = await (await fetch(issuer + '/tokens')).json() as Record<string, string>;
  console.log('mcp-stage:owner-auth');
  const ownerConnection = await account(tokens.owner);
  console.log('mcp-stage:stranger-auth');
  const strangerConnection = await account(tokens.stranger);
  // Hold both normal WebSocket sessions until their derived account capabilities are disposed.
  using _ownerRoot = ownerConnection.root;
  using _strangerRoot = strangerConnection.root;
  using owner = ownerConnection.api;
  using stranger = strangerConnection.api;
  expect((await owner.whoami()).id).toBe('BookOwner@local.test');
  expect((await stranger.whoami()).id).toBe('OtherOwner@local.test');
  const admin = exports.AdminSettings.getByName('');
  await admin.updateAdminConfig({signupsEnabled:false});
  const closed = await call(tokens.newOwner, 'book.create');
  expect(closed.body.error.message).toContain('sign-ups are currently disabled');
  const serviceNew = await call(tokens.service, 'book.create', {ownerEmail:'ServiceTypo@local.test'});
  expect(serviceNew.body.error.message).toContain('sign-ups are currently disabled');
  const existing = await call(tokens.service, 'book.create', {ownerEmail:'BookOwner@local.test',title:'Existing owner while signups closed'});
  expect(existing.body.error).toBeUndefined();
  await admin.updateAdminConfig({signupsEnabled:true});
  expect((await call(tokens.newOwner, 'book.create',{title:'Standard Access registration'})).body.error).toBeUndefined();
  expect((await call(tokens.service, 'book.create',{ownerEmail:'AnotherServiceTypo@local.test'})).body.error.message).toContain('sign-ups are currently disabled');
  console.log('mcp-stage:book-create');
  const created = await call(tokens.owner, 'book.create', {title: 'Signed local MCP book'});
  expect(created.status).toBe(200);
  expect(created.body.error).toBeUndefined();
  const book = created.body.result.structuredContent.value;
  expect(book.gadgetId).toBeTypeOf('number');
  const file = {path: 'content/signed.md', content: '# Signed manuscript\n\nOwner-specific content.'};
  const args = {workspaceId: book.workspaceId, gadgetId: book.gadgetId};
  console.log('mcp-stage:book-write');
  const put = await call(tokens.owner, 'book.put_files', {...args, files: [file]});
  expect(put.body.error).toBeUndefined();
  console.log('mcp-stage:book-read');
  const read = await call(tokens.owner, 'book.read_files', {...args, paths: [file.path]});
  expect(read.body.result.structuredContent.value).toEqual([file]);
  const initial = await call(tokens.owner, 'book.read_files', args);
  expect(initial.body.result.structuredContent.value.some((f:any)=>f.path==='content/introduction.md')).toBe(true);
  const replacementToc = {path:'content/toc.json',content:JSON.stringify({title:'Replacement',parts:[{title:'Part',chapters:[{id:'signed',title:'Signed',file:'signed.md'}]}]})};
  expect((await call(tokens.owner,'book.put_files',{...args,files:[replacementToc]})).body.error).toBeUndefined();
  const custom = await call(tokens.owner,'book.read_files',args);
  expect(custom.body.result.structuredContent.value.map((f:any)=>f.path).toSorted()).toEqual(['content/signed.md','content/toc.json']);

  expect((await call(tokens.owner, 'book.list')).body.result.structuredContent.value)
    .toContainEqual(expect.objectContaining(args));
  const workspace = exports.OverseerDurableObject.get(
    exports.OverseerDurableObject.idFromString(book.workspaceId));
  const profile = await owner.whoami();
  const secondId = await runInDurableObject(workspace, async (instance: any) => {
    const impl = instance.impl;
    const first = impl.getGadgetRecord(book.gadgetId);
    const facet = await impl.getGadgetFacet(book.gadgetId);
    try { await facet.setChapterComplete('signed', true); }
    finally { facet[Symbol.dispose]?.(); }
    // Exercise the real commit writer and gadget creation contract used by blueprint/agent
    // creation. This setup is not a browser creation claim and fabricates no SQL/output row.
    const files = await impl.readGadgetFiles(book.gadgetId);
    const commit = await impl.gitStore.writeFilesAsCommit(files, {
      parents: [], author: commitIdentityForAuthor(profile),
      message: 'Instantiate second book for MCP selection', timestamp: new Date(),
    });
    return impl.createGadget('Second signed book', 'SECOND_BOOK', undefined,
      first.output, commit).id;
  });
  expect((await call(tokens.owner, 'book.read_progress', args)).body.result.structuredContent.value)
    .toEqual({signed: true});
  const secondArgs = {...args, gadgetId: secondId};
  const secondFile = {path: file.path, content: '# Second book\n\nSeparate manuscript.'};
  expect((await call(tokens.owner, 'book.put_files', {...secondArgs, files: [secondFile]})).body.error)
    .toBeUndefined();
  expect((await call(tokens.owner, 'book.read_files', {...secondArgs, paths: [file.path]}))
    .body.result.structuredContent.value).toEqual([secondFile]);
  expect((await call(tokens.owner, 'book.read_files', {...args, paths: [file.path]}))
    .body.result.structuredContent.value).toEqual([file]);
  for (const tool of ['book.read_files', 'book.put_files', 'book.read_progress']) {
    expect((await call(tokens.owner, tool, {workspaceId: book.workspaceId, files: [file]}))
      .body.error.message).toContain('multiple books; specify gadgetId');
  }
  expect((await call(tokens.owner, 'book.list')).body.result.structuredContent.value
    .filter((entry: any) => entry.workspaceId === book.workspaceId)).toHaveLength(2);
  await abortAllDurableObjects();
  expect((await call(tokens.owner, 'book.read_progress', args)).body.result.structuredContent.value)
    .toEqual({signed: true});
  console.log('mcp-stage:user-owner-denials');
  const otherOwner = await call(tokens.owner, 'book.read_files', {...args, ownerEmail: 'OtherOwner@local.test'});
  expect(otherOwner.body.error.message).toContain('only reach books owned');
  const foreignWorkspace = await call(tokens.stranger, 'book.put_files', {...args, files: [file]});
  expect(foreignWorkspace.body.error.message).toContain('does not own');
  const executable = await call(tokens.owner, 'book.put_files', {...args, files: [{path: 'server.js', content: 'export class Gadget {}'}]});
  expect(executable.body.error.message).toContain('cannot edit');
  expect((await call(tokens.service, 'book.read_files', args)).body.error.message).toContain('ownerEmail is required');
  console.log('mcp-stage:service-owner-boundary');
  const serviceRead = await call(tokens.service, 'book.read_files', {...args, ownerEmail: 'BookOwner@local.test', paths: [file.path]});
  expect(serviceRead.body.result.structuredContent.value).toEqual([file]);
  const serviceForeign = await call(tokens.service, 'book.read_files', {...args, ownerEmail: 'OtherOwner@local.test'});
  expect(serviceForeign.body.error.message).toContain('does not own');
  for (const invalid of [undefined, tokens.wrongKey, tokens.wrongIssuer, tokens.wrongAudience, tokens.expired]) {
    expect((await call(invalid, 'book.list')).status).toBe(403);
  }
});
