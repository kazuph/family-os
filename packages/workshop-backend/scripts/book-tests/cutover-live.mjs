import {createRequire} from 'node:module';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const [legacyRoot, frontend, output] = process.argv.slice(2);
if (!legacyRoot || !frontend || !output) throw new Error('Usage: cutover-live.mjs LEGACY_ROOT LOCAL_FRONTEND OUTPUT');
if (!process.env.OPENCODE_GO_API_TOKEN) throw new Error('Explicit existing Go credential required');
const cwd = resolve(import.meta.dirname, '../..');
const require = createRequire(cwd + '/package.json');
const {createTestHarness} = require('wrangler');
const {parse} = createRequire(require.resolve('wrangler'))('jsonc-parser');
const {newWebSocketRpcSession} = require('capnweb');
const username = 'cutoveradmin';
const hashBundle = await require('esbuild').build({
  entryPoints:[resolve(cwd,'../workshop-frontend/src/passwordHash.ts')],
  bundle:true,platform:'node',format:'esm',write:false,
});
const {hashPassword} = await import('data:text/javascript;base64,' + Buffer.from(hashBundle.outputFiles[0].contents).toString('base64'));
const hash = await hashPassword(username, 'Cutover-local-password');
const decode = value => value?.$bytes ? new Uint8Array(Buffer.from(value.$bytes, 'base64'))
  : value?.$date ? new Date(value.$date)
  : Array.isArray(value) ? value.map(decode)
  : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k,v])=>[k,decode(v)])) : value;
const legacyDir = resolve(legacyRoot, 'packages/workshop-backend');
const oldConfig = parse(readFileSync(legacyDir + '/wrangler.jsonc', 'utf8'));
oldConfig.main = legacyDir + '/.wrangler/validate/src/book-fixture-worker.ts';
oldConfig.name = 'family-os';
delete oldConfig.build;
delete oldConfig.browser;
oldConfig.vars = {ADMINS:[username], OPENCODE_GO_API_TOKEN:process.env.OPENCODE_GO_API_TOKEN};
const server = createTestHarness({root:legacyDir, workers:[{config:oldConfig}]});
let url;
const connect = async () => {
  const address = new URL('/api',url);
  address.protocol = 'ws:';
  return newWebSocketRpcSession(address.toString());
};
try {
  url = (await server.listen()).url;
  using root = await connect();
  const token = await root.createAccount(username, 'Cutover administrator', hash);
  assert.ok(token);
  using api = await root.authenticate(token);
  const diagnostic = async args => {
    const response = await fetch(new URL('/__isolated_book_fixture',url), {
      method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username,token,...args}),
    });
    if (!response.ok) throw new Error('Authenticated legacy fixture failed: '+response.status);
    return decode(await response.json());
  };
  using workspace = await api.newGadgetFromBlueprint('format.book',{AI:{type:'aiModel',modelId:'deepseek-v4-flash'}});
  const workspaceId = (await workspace.getMetadata()).id;
  const {gadgetId} = await diagnostic({operation:'book',workspaceId});
  const image = readFileSync(resolve(cwd, '../../docs/images/q3-planning-workspace.png')).toString('base64');
  const files = [
    {path:'content/toc.json',content:JSON.stringify({title:'Preserved adult book',parts:[{title:'Part',chapters:[{id:'legacy',title:'Legacy chapter',file:'legacy.md'}]}]})},
    {path:'content/legacy.md',content:'# Legacy chapter\n\nA preserved manuscript with $x^2$.\n\n![Preserved illustration](data:image/png;base64,'+image+')'},
  ];
  await diagnostic({operation:'put',workspaceId,gadgetId,files});
  await diagnostic({operation:'prepare',workspaceId,gadgetId});
  const chatId = await workspace.newChat('Preserved workspace conversation', null);
  await workspace.stopAgent(chatId);
  using ordinary = await api.newGadgetFromBlueprint('format.document',{});
  const ordinaryId = (await ordinary.getMetadata()).id;
  assert.ok((await api.listGadgets()).some(item=>item.id===ordinaryId));
  const child = await diagnostic({operation:'child'});
  let oldFiles;
  {
    using oldGadget = await workspace.getGadget(gadgetId);
    using oldBook = await oldGadget.connectToGadget();
    oldFiles = await oldBook.getBookFiles();
  }
  const adultBefore = await diagnostic({operation:'state',workspaceId,gadgetId});
  const ownerBefore = await diagnostic({operation:'owner'});
  const newConfig = parse(readFileSync(cwd + '/wrangler.jsonc','utf8'));
  newConfig.name = 'family-os';
  newConfig.main = cwd + '/.wrangler/validate/src/server.ts';
  delete newConfig.build;
  delete newConfig.browser;
  delete newConfig.migrations;
  newConfig.exports = {...oldConfig.exports, UserDirectoryDurableObject:{type:'durable-object',storage:'sqlite'}};
  newConfig.vars = oldConfig.vars;
  newConfig.assets = {directory:resolve(frontend),binding:'ASSETS',not_found_handling:'single-page-application',run_worker_first:['/api','/api/*','/mcp','/blueprint-screenshot/*']};
  console.log('cutover-stage: same Worker and SQLite namespace identities, changing code only');
  await server.update({root:cwd,workers:[{config:newConfig}]});
  url = (await server.listen()).url;
  using newRoot = await connect();
  using newApi = await newRoot.authenticate(token);
  const listed = await newApi.listGadgets();
  assert.ok(listed.some(item=>item.id===workspaceId));
  assert.ok(listed.some(item=>item.id===ordinaryId));
  assert.ok(listed.some(item=>item.id===child.workspaceId));
  using migrated = await newApi.openGadget(workspaceId);
  assert.ok((await migrated.listChats()).some(chat=>chat.id===chatId));
  using adultGadget = await migrated.getGadget(gadgetId);
  using adultBook = await adultGadget.connectToGadget();
  const migratedFiles = await adultBook.getBookFiles();
  assert.deepEqual(Object.keys(migratedFiles).toSorted(),Object.keys(oldFiles).toSorted());
  for (const [path,content] of Object.entries(oldFiles)) {
    const digest = value=>createHash('sha256').update(value).digest('hex');
    assert.equal(digest(migratedFiles[path]),digest(content),path);
  }
  const adultState = await adultBook.getState();
  assert.equal(adultState.progress.legacy,true);
  assert.ok(adultState.messages.some(message=>message.role==='assistant'));
  using childWorkspace = await newApi.openGadget(child.workspaceId);
  assert.equal((await childWorkspace.getMetadata()).owner.id,child.profileId);
  using childGadget = await childWorkspace.getGadget(child.gadgetId);
  using childBook = await childGadget.connectToGadget();
  assert.equal((await childBook.getState()).progress.child,true);
  assert.match((await childBook.getBookFiles())['content/child.md'],/original owner/);
  {
    using visitorRoot = await connect();
    const visitorToken = await visitorRoot.createAccount('cutovervisitor','Ordinary visitor',hash);
    using visitor = await visitorRoot.authenticate(visitorToken);
    assert.equal((await visitor.listGadgets()).some(item=>item.id===child.workspaceId),false);
    await assert.rejects(async()=>{using _denied = await visitor.openGadget(child.workspaceId);}, /access|permission|shared/i);
  }
  const result={url,username,password:'Cutover-local-password',workspaceId,gadgetId,ordinaryId,child,
    adultProgress:adultState.progress,adultMessages:adultState.messages.length,nonAdminChildDenied:true,legacyCodeKeys:adultBefore.kv.map(row=>Array.isArray(row)?row[0]:row.key).filter(key=>String(key).includes("code")||String(key).includes("snapshot")),adultSourceRows:adultBefore.kv.length,ownerSourceRows:ownerBefore.kv.length};
  writeFileSync(resolve(output),JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log('cutover-live:PASS; normal UI fixture ready',url);
  await new Promise(resolveExit=>{process.once('SIGTERM',resolveExit);process.once('SIGINT',resolveExit);});
} finally {await server.close();}
