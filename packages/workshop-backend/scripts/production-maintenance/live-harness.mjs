import{createRequire}from'node:module';import{readFileSync,writeFileSync}from'node:fs';import{resolve}from'node:path';import{once}from'node:events';import{request as httpRequest}from'node:http';import assert from'node:assert/strict';
const require=createRequire(new URL('../../package.json',import.meta.url));const{createTestHarness}=require('wrangler');const{newWebSocketRpcSession}=require('capnweb');const Y=require('yjs');
const root=process.env.MAINTENANCE_LIVE_ARTIFACT;if(!root||!process.env.MAINTENANCE_JWKS)throw new Error('Protected artifacts and signed launcher required');
const tokens=await(await fetch(process.env.MAINTENANCE_JWKS+'/tokens')).json();
const{WebSocket}=createRequire(require.resolve('wrangler'))('ws');
const identityFile='/tmp/family-maintenance-identity-'+process.pid+'.mjs';
writeFileSync(identityFile,"export default{fetch(request,env){const url=new URL(request.url);return fetch(new URL(url.pathname,env.AUTH_BASE),request)}}",{mode:0o600});
const workers=['family-os','family-os-context'].map(name=>{
 const config=JSON.parse(readFileSync(resolve(root,name,'wrangler.jsonc'),'utf8'));delete config.assets;delete config.build;delete config.browser;delete config.ai;
 config.vars={...config.vars,CF_ACCESS_ISS:process.env.MAINTENANCE_ISSUER,CF_ACCESS_AUD:'maintenance-local',ADMINS:['Admin@local.test']};
 config.services??=[];config.services.push({binding:'ACCESS_IDENTITY',service:'local-access-identity'});
 return{config};
});
workers.push({config:{name:'local-access-identity',main:identityFile,compatibility_date:'2026-02-02',vars:{AUTH_BASE:process.env.MAINTENANCE_JWKS}}});
if(process.env.MAINTENANCE_SAME_ORIGIN_ARTIFACT){
 const config=JSON.parse(readFileSync(resolve(process.env.MAINTENANCE_SAME_ORIGIN_ARTIFACT,'wrangler.jsonc'),'utf8'));
 config.name='same-origin-local';delete config.assets;delete config.build;delete config.browser;delete config.ai;
 workers.push({config});
}
const server=createTestHarness({root,workers});let rpc;
const boundaryRequest=url=>new Promise((resolve,reject)=>{const req=httpRequest(url,{headers:{Upgrade:'websocket'}},response=>{let text='';response.setEncoding('utf8');response.on('data',chunk=>text+=chunk);response.on('end',()=>resolve({status:response.statusCode,text}));response.on('error',reject);});req.on('error',reject);req.end();});
try{
 const{url}=await server.listen();
 const revisionRejected=await boundaryRequest(new URL('/api',url));assert.equal(revisionRejected.status,426);assert.equal(revisionRejected.text,'Reload Family OS to update the client.');
 const originRejected=await boundaryRequest(new URL('/api?client-version=worker-owned-websocket-v3',url));assert.equal(originRejected.status,403);assert.equal(originRejected.text,'Cross-origin API access not allowed.');
 if(process.env.MAINTENANCE_API_BOUNDARY_ONLY==='1'){
  console.log('PASS: original API revision426 and origin403 contracts retained, response bodies drained');
 }else{
 const u=new URL('/api',url);u.protocol='ws:';u.searchParams.set('client-version','worker-owned-websocket-v3');
 const socket=new WebSocket(u,{headers:{Origin:new URL(url).origin,'cf-access-jwt-assertion':tokens.admin,Cookie:'CF_Authorization='+tokens.admin}});await once(socket,'open');rpc=newWebSocketRpcSession(socket);
 const entry=await rpc.authenticateFromCfAccess();const selection=await entry.selectAdultProfile();assert.equal(selection.ok,true);const authenticated=await entry.getAuthenticatedApi();assert.equal(authenticated.ok,true);const api=authenticated.value;
 const workspace=await api.newGadget();const workspaceId=(await workspace.getMetadata()).id;const gadget=await workspace.createGadget('Read-only retained manuscript');const gadgetId=await gadget.getHostGadgetId();
 const doc=new Y.Doc();const text=new Y.Text();text.insert(0,'Preserved live inspector manuscript');doc.getMap(String(gadgetId)).set('README.md',text);await gadget.updateCode(Y.encodeStateAsUpdateV2(doc));
 const endpoint=new URL('/api/maintenance/inspect?class=OverseerDurableObject&id='+workspaceId,url);
 const headers={'cf-access-jwt-assertion':tokens.admin};
 for(const assertion of [undefined,tokens.other,tokens.service,tokens.wrongKey,tokens.wrongIssuer,tokens.wrongAudience,tokens.expired]){
  assert.equal((await fetch(endpoint,{headers:assertion?{'cf-access-jwt-assertion':assertion}:{}})).status,403);
 }
 const response=await fetch(endpoint,{headers});assert.equal(response.status,200);const before=await response.json();assert.deepEqual(await(await fetch(endpoint,{headers})).json(),before);
 assert.equal((await workspace.getMetadata()).id,workspaceId);
 console.log('PASS: standard original account/workspace/code APIs remain usable; signed additive inspect leaves stored root unchanged');
 const backend=await server.getWorker('family-os').getEnv();
 const vendor=await backend.GATEKEEPER_CONTEXT.describe();assert.equal(vendor.displayName,'Context');
 const account=await backend.GATEKEEPER_CONTEXT.createAccount();const ui=await account.startAppUi({isAdmin:true});assert.equal(typeof ui.iframeHtml,'string');assert(ui.iframeHtml.length>0);
 const context=server.getWorker('family-os-context');
 const library=await context.getDurableObjectStorage('UserLibraryDurableObject',{name:'local-inspection-library'});
 await library.exec('CREATE TABLE inspection_fixture (value TEXT)');await library.exec('INSERT INTO inspection_fixture VALUES (?)','retained-context-root');
 const ids=await context.listDurableObjectIds('UserLibraryDurableObject');assert(ids.length>0);
 const contextUrl=new URL('/api/maintenance/context/inspect?class=UserLibraryDurableObject&id='+ids[0],url);
 assert.equal((await fetch(contextUrl)).status,403);assert.equal((await fetch(contextUrl,{headers:{'cf-access-jwt-assertion':tokens.other}})).status,403);
 const first=await fetch(contextUrl,{headers});assert.equal(first.status,200);assert.equal(first.headers.get('cache-control'),'no-store');
 assert.deepEqual(await(await fetch(contextUrl,{headers})).json(),await first.json());
 console.log('PASS: original Vendor RPC/account/UI document works; existing backend public entry reaches signed Context root inspect, unchanged on repeat');
 if(process.env.MAINTENANCE_SAME_ORIGIN_ARTIFACT){
  const sameOrigin=server.getWorker('same-origin-local');
  for(const path of ['/gatekeeper/context','/gatekeeper/context/reader']){
   const result=await sameOrigin.fetch(path);assert.equal(result.status,200);assert.equal(await result.text(),'Context Library worker is running.');
  }
  assert.equal((await sameOrigin.fetch('/gatekeeper/contextual')).status,404);
  console.log('PASS: built merged same-origin HTTP wrapper reaches the actual live Context handler at exact prefix and descendant; neighbouring prefix stays with backend');
 }
 }
}catch(error){server.debug();throw error;}finally{rpc?.[Symbol.dispose]();await server.close();}
