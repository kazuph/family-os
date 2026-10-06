import{createRequire}from'node:module';import{readFileSync,writeFileSync,chmodSync}from'node:fs';import{resolve}from'node:path';import assert from'node:assert/strict';
const require=createRequire(new URL('../../package.json',import.meta.url));
const {createTestHarness}=require('wrangler');const{parse}=require('jsonc-parser');const{newWebSocketRpcSession}=require('capnweb');const Y=require('yjs');
const [root]=process.argv.slice(2);if(!root)throw new Error('Protected fixture directory required');
const provenance=JSON.parse(readFileSync(resolve(root,'provenance.json'),'utf8'));
const config=parse(readFileSync(new URL('../../wrangler.jsonc',import.meta.url),'utf8'));
config.main=resolve(root,'worker.js');delete config.build;delete config.browser;delete config.migrations;
config.name='maintenance-live-local';config.vars={};
delete config.services;delete config.assets;
config.exports={};for(const className of ['UserDurableObject','OverseerDurableObject','PendingLogin','FamilyDurableObject','AdminSettings','LanguageModelGatekeeper','AgentSpawnerGatekeeper','BrowserVerificationLimiterDurableObject'])config.exports[className]={type:'durable-object',storage:'sqlite'};
const server=createTestHarness({root,workers:[{config}]});let rpc;
try{
 const{url}=await server.listen();const u=new URL('/api',url);u.protocol='ws:';rpc=newWebSocketRpcSession(u.toString());
 const username='liveschema'+crypto.randomUUID().replaceAll('-','');const token=await rpc.createAccount(username,'Live schema fixture',new Uint8Array([1,2,3]));const api=await rpc.authenticate(token);
 const workspace=await api.newGadget();const workspaceId=(await workspace.getMetadata()).id;const gadget=await workspace.createGadget('Preserved live schema');const gadgetId=await gadget.getHostGadgetId();
 const doc=new Y.Doc();const text=new Y.Text();text.insert(0,'Accepted live-schema manuscript');doc.getMap(String(gadgetId)).set('README.md',text);await gadget.updateCode(Y.encodeStateAsUpdateV2(doc));
 const chatId=await workspace.newChat('Unaccepted draft to preserve',null);await workspace.stopAgent(chatId);
 const updates=[];doc.on('updateV2',update=>updates.push(update));text.insert(text.length,' with pending edit');await gadget.updateCode(Y.mergeUpdatesV2(updates),chatId);
 const response=await fetch(new URL('/__local_capture',url),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username,token,workspaceId})});assert.equal(response.status,200);
 const kv=await response.json();const file=resolve(root,'generated-workspace.json');writeFileSync(file,JSON.stringify({sourceSha256:provenance.sourceSha256,workspaceId,gadgetId,chatId,kv}),{mode:0o600,flag:'wx'});chmodSync(file,0o600);
 assert.equal(new Map(kv).get('version'),2);assert(kv.some(([key])=>key.startsWith('chatDraftUpdates:')));
 console.log('PASS: actual deployed runtime generated accepted code and unaccepted chat draft; protected fixture saved');
}finally{rpc?.[Symbol.dispose]();await server.close();}
