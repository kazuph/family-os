import{readFileSync,writeFileSync,mkdirSync,chmodSync}from'node:fs';import{createRequire,builtinModules}from'node:module';import{resolve,dirname}from'node:path';import{fileURLToPath}from'node:url';
const require=createRequire(new URL('../../package.json',import.meta.url));const{parse}=require('jsonc-parser');const{build}=require('esbuild');
const {default:capnwebValidate}=await import(require.resolve('capnweb-validate/esbuild'));
const [draftPath,output,kind]=process.argv.slice(2);if(!draftPath||!output||!['backend','context','same-origin','conversion'].includes(kind))throw new Error('Usage: build-stage.mjs DRAFT_JSONC NEW_LOCAL_DIRECTORY backend|context|same-origin|conversion');
const draft=parse(readFileSync(draftPath,'utf8'));if(draft.migrations)throw new Error('Live exports lifecycle must not be replaced by migrations');
mkdirSync(output,{mode:0o700});
const entry=resolve(dirname(fileURLToPath(import.meta.url)),kind==='context'?'context-worker.ts':kind==='same-origin'?'same-origin.ts':kind==='conversion'?'migration-worker.ts':'worker.ts');
await build({banner:{js:"import {createRequire as __maintenanceCreateRequire} from 'node:module';const require=__maintenanceCreateRequire('/worker.js');"},entryPoints:[entry],bundle:true,format:'esm',platform:'neutral',mainFields:['browser','module','main'],conditions:['workerd','worker','browser'],external:['cloudflare:*','node:*',...builtinModules],loader:{'.txt':'text'},plugins:[capnwebValidate({tsconfig:resolve(dirname(fileURLToPath(import.meta.url)),'../../tsconfig.json')}),{name:'text-imports',setup(build){build.onResolve({filter:/\.txt$/},args=>({path:resolve(args.resolveDir,args.path),namespace:'maintenance-text'}));build.onLoad({filter:/.*/,namespace:'maintenance-text'},args=>({contents:readFileSync(args.path,'utf8'),loader:'text'}));}}],outfile:resolve(output,'worker.js')});
chmodSync(resolve(output,'worker.js'),0o600);
const config={...draft,main:resolve(output,'worker.js')};delete config.build;delete config.rules;
if(kind!=='same-origin'){
 delete config.assets;
 const expected=kind==='context'?['ContextCollectionDurableObject','ContextGatekeeper','LibraryRegistryDurableObject','UserLibraryDurableObject']:['UserDurableObject','OverseerDurableObject','FamilyDurableObject','AdminSettings','BrowserVerificationLimiterDurableObject','PendingLogin','LanguageModelGatekeeper','AgentSpawnerGatekeeper'];
 config.exports=Object.fromEntries(expected.map(name=>{if(!draft.exports[name])throw new Error('Missing live namespace export '+name);return[name,draft.exports[name]]}));
}
writeFileSync(resolve(output,'wrangler.jsonc'),JSON.stringify(config,null,2)+'\n',{mode:0o600});
writeFileSync(resolve(output,'stage-status.json'),JSON.stringify({kind,deployed:false,productionWrites:false,meaning:kind==='same-origin'?'Requires per-workspace pre-conversion/lease inspection before deployment':kind==='conversion'?'Explicit parent-run POST stage; native bookmark before checked transaction':'Stops ordinary traffic; admin-only GET inspection; no new namespace'} )+'\n',{mode:0o600});
console.log('PASS: local '+kind+' artifact assembled; nothing uploaded or deployed');
