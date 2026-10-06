import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
const [legacyRoot, output, variant] = process.argv.slice(2);
if (variant && !['--with-siblings', '--with-connections', '--with-chat-history'].includes(variant)) throw new Error("Unknown capture variant");
if (!legacyRoot || !output) throw new Error('Usage: capture-legacy-live.mjs LEGACY_ROOT OUTPUT (requires explicit OPENCODE_GO_API_TOKEN)');
if (existsSync(resolve(output))) throw new Error('Capture output already exists; refusing overwrite');
if (variant === '--with-connections' && existsSync(resolve(output + '.connected.json'))) throw new Error('Connected capture already exists; refusing overwrite');
if (!process.env.OPENCODE_GO_API_TOKEN) throw new Error('Explicit live Go token required');
const dir=resolve(legacyRoot, 'packages/workshop-backend');
const manifest=JSON.parse(readFileSync(resolve(legacyRoot, '.book-fixture-provenance.json'), 'utf8'));
assert.equal(manifest.baseline, 'f41f7db45e6a2ecf593241288b6ba5f02c405c71');
const require=createRequire(dir+'/package.json');
const {createTestHarness}=require('wrangler');
const {parse}=require('jsonc-parser');
const {newWebSocketRpcSession}=require('capnweb');
const Y=require('yjs');
const config=parse(readFileSync(dir+'/wrangler.jsonc','utf8'));
config.main=dir+'/.wrangler/validate/src/book-fixture-worker.ts';
delete config.build; delete config.browser;
config.vars={...config.vars,OPENCODE_GO_API_TOKEN:process.env.OPENCODE_GO_API_TOKEN};
config.exports.BookInspectionFacet={type:'durable-object',storage:'sqlite'};
const server=createTestHarness({root:dir,workers:[{config}]});
const encode=v=>v instanceof Date?{$date:v.toISOString()}:v instanceof Uint8Array?{$bytes:Buffer.from(v).toString('base64')}:Array.isArray(v)?v.map(encode):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encode(x)])):v;
const decode=v=>v?.$bytes?new Uint8Array(Buffer.from(v.$bytes,'base64')):v?.$date?new Date(v.$date):Array.isArray(v)?v.map(decode):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,decode(x)])):v;
let root;
try {
  const {url}=await server.listen();
  const wsUrl=new URL('/api',url);wsUrl.protocol='ws:';
  root=newWebSocketRpcSession(wsUrl.toString());
  const username='legacybook'+crypto.randomUUID().replaceAll('-','');
  const token=await root.createAccount(username,'Legacy book author',new Uint8Array([1,2,3]));assert.ok(token);
  const api=await root.authenticate(token);
  const diagnostic=async args=>{const r=await fetch(new URL('/__isolated_book_fixture',url),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username,token,...args})});if(!r.ok)throw new Error('Fixture diagnostic failed: '+r.status);return decode(await r.json());};
  const source=await api.newGadgetFromBlueprint('format.book',{AI:{type:'aiModel',modelId:'deepseek-v4-flash'}});
  const target=await api.newGadget();
  const sourceWorkspaceId=(await source.getMetadata()).id,targetWorkspaceId=(await target.getMetadata()).id;
  const siblings=[];
  if (variant) {
    for (const [workspace, workspaceId, title] of [[source,sourceWorkspaceId,'Source sibling'],[target,targetWorkspaceId,'Target sibling']]) {
      const sibling=await workspace.createGadget(title);
      const gadgetId=await sibling.getHostGadgetId();
      const state=await diagnostic({operation:'state',workspaceId,gadgetId});
      const doc=new Y.Doc();Y.applyUpdateV2(doc,state.update);
      const changes=[];doc.on('updateV2',u=>changes.push(u));
      const content=title+' accepted code retained';
      const text=new Y.Text();text.insert(0,content);doc.getMap(state.root).set('README.md',text);
      await sibling.updateCode(Y.mergeUpdatesV2(changes));
      siblings.push({workspaceId,gadgetId,files:[['README.md',content]]});
    }
  }
  const owner=await diagnostic({operation:'owner'});
  const book=await diagnostic({operation:'book',workspaceId:sourceWorkspaceId});
  const sourceGadgetId=book.gadgetId;
  const gadget=await source.getGadget(sourceGadgetId);
  await diagnostic({operation:'put',workspaceId:sourceWorkspaceId,gadgetId:sourceGadgetId,files:[{path:'content/toc.json',content:JSON.stringify({title:'Legacy preserved book',parts:[{title:'Part',chapters:[{id:'legacy',title:'Legacy chapter',file:'legacy.md'}]}]})},{path:'content/legacy.md',content:'# Legacy chapter\n\nA preserved manuscript with $x^2$.'}]});
  console.log('native-stage:real-tutor');
  await diagnostic({operation:'prepare',workspaceId:sourceWorkspaceId,gadgetId:sourceGadgetId});
  if (variant !== '--with-connections') await gadget.unbind('AI');
  if (variant === '--with-chat-history') {
    const existingChat = await target.newChat('Existing target conversation must remain', null);
    await target.stopAgent(existingChat);
    for (const state of ['accepted','discarded']) {
      const historyId = await source.newChat('Preserve '+state+' conversation', null);
      await source.stopAgent(historyId);
      const current = await diagnostic({operation:'state',workspaceId:sourceWorkspaceId,gadgetId:sourceGadgetId});
      const historyDoc=new Y.Doc();Y.applyUpdateV2(historyDoc,current.update);
      const historyUpdates=[];historyDoc.on('updateV2',u=>historyUpdates.push(u));
      const serverCode=historyDoc.getMap(current.root).get('server.js');
      serverCode.insert(serverCode.length,'\n// '+state+' legacy history edit\n');
      await gadget.updateCode(Y.mergeUpdatesV2(historyUpdates),historyId);
      if (state==='accepted') await source.mergeChanges(historyId,null,{includeDraft:true});
      else { await source.finalizeChatDraft(historyId);await source.revertChanges(historyId,1); }
    }
  }
  const chatId=await source.newChat('Preserve my unaccepted code edit',null);
  await source.stopAgent(chatId);
  const accepted=await diagnostic({operation:'state',workspaceId:sourceWorkspaceId,gadgetId:sourceGadgetId});
  const doc=new Y.Doc();Y.applyUpdateV2(doc,accepted.update);
  const updates=[];doc.on('updateV2',u=>updates.push(u));
  const code=doc.getMap(accepted.root).get('server.js');assert.ok(code);code.insert(code.length,'\n// Preserved unaccepted legacy edit\n');
  await gadget.updateCode(Y.mergeUpdatesV2(updates),chatId);
  const location=await gadget.moveToWorkspace(targetWorkspaceId),targetGadgetId=location.gadgetId;
  let connected;
  if (variant === '--with-connections') {
    const connectedSource=await diagnostic({operation:'state',workspaceId:sourceWorkspaceId,gadgetId:sourceGadgetId});
    const connectedTarget=await diagnostic({operation:'state',workspaceId:targetWorkspaceId,gadgetId:targetGadgetId});
    const connectedOwner=await diagnostic({operation:'owner'});
    connected={
      baseline:manifest.baseline,username,ownerId:owner.ownerId,ownerKv:connectedOwner.kv,
      sourceWorkspaceId,sourceGadgetId,targetWorkspaceId,targetGadgetId,
      sourceKv:connectedSource.kv,targetKv:connectedTarget.kv,siblings,
    };
    // This is the authenticated owner's existing public operation. It forwards to the moved
    // host and syncs the destination binding record; no capability is cloned into the new runtime.
    // Moving may reset the source DO and close its old workspace session. Reconnect as the
    // browser does, then open only the destination through the same owner's session token.
    console.log('native-stage:owner-reconnect-after-move');
    root[Symbol.dispose]();
    root=newWebSocketRpcSession(wsUrl.toString());
    const reconnectedApi=await root.authenticate(token);
    console.log('native-stage:owner-open-moved-target');
    const reconnectedTarget=await reconnectedApi.openGadget(targetWorkspaceId);
    const movedGadget = await reconnectedTarget.getGadget(targetGadgetId);
    console.log('native-stage:owner-list-moved-bindings');
    assert.ok((await movedGadget.listBindings()).some(binding=>binding.name==='AI'));
    console.log('native-stage:owner-detach-moved-AI');
    await movedGadget.unbind('AI');
    console.log('native-stage:owner-detach-returned');
    assert.equal((await movedGadget.listBindings()).some(binding=>binding.name==='AI'),false);
    console.log('native-stage:owner-detach-confirmed');
  }
  const sourceState=await diagnostic({operation:'state',workspaceId:sourceWorkspaceId,gadgetId:sourceGadgetId});
  const targetState=await diagnostic({operation:'state',workspaceId:targetWorkspaceId,gadgetId:targetGadgetId});
  const tables=await diagnostic({operation:'tables',workspaceId:sourceWorkspaceId,gadgetId:sourceGadgetId});
  assert.equal(tables.book_files.length,2);assert.equal(tables.progress[0].completed,1);assert.equal(tables.messages.length,2);
  assert.ok(sourceState.kv.some(([k])=>k.startsWith('chatDraftUpdates:')));
  const ownerFinal=await diagnostic({operation:'owner'});
  const fixture={baseline:'f41f7db45e6a2ecf593241288b6ba5f02c405c71',username,ownerId:owner.ownerId,ownerKv:ownerFinal.kv,sourceWorkspaceId,sourceGadgetId,targetWorkspaceId,targetGadgetId,sourceKv:sourceState.kv,targetKv:targetState.kv,tables,siblings};
  if (connected) writeFileSync(resolve(output + '.connected.json'),JSON.stringify(encode({...connected,tables})),{flag:'wx'});
  writeFileSync(resolve(output),JSON.stringify(encode(fixture)),{flag:'wx'});
  console.log('native-fixture:PASS',{book_files:tables.book_files.length,progress:tables.progress.length,messages:tables.messages.length,settings:tables.settings.length});
} catch(error) {
  console.error('native-fixture-failure:', error instanceof Error ? error.message : String(error));
  throw error;
} finally {root?.[Symbol.dispose]();await server.close();}
