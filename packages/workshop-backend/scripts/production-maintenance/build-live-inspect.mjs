import{readFileSync,writeFileSync,mkdirSync,chmodSync}from'node:fs';
import{createHash}from'node:crypto';
import{createRequire,builtinModules}from'node:module';
import{resolve,dirname}from'node:path';
import{fileURLToPath}from'node:url';
const require=createRequire(new URL('../../package.json',import.meta.url));
const{parse}=require('jsonc-parser');const{build}=require('esbuild');
const [sourceRoot,snapshotRoot,oldRepo,output]=process.argv.slice(2);
if(!output)throw new Error('Usage: build-live-inspect.mjs PROTECTED_SOURCE_ROOT SNAPSHOTS OLD_REPO NEW_OUTPUT');
const read=p=>parse(readFileSync(p,'utf8'));
const saved=name=>read(resolve(snapshotRoot,name+'-settings.snapshot')).result;
const settings=saved('family-os');
const auth=Object.fromEntries(settings.bindings.filter(b=>['ADMINS','CF_ACCESS_AUD','CF_ACCESS_ISS'].includes(b.name)).map(b=>[b.name,b.type==='json'?(typeof b.json==='string'?JSON.parse(b.json):b.json):b.text]));
if(Object.keys(auth).length!==3)throw new Error('All existing Access/admin settings must be retained');
mkdirSync(output,{mode:0o700});
const helper=resolve(dirname(fileURLToPath(import.meta.url)),'live-inspect.ts');
const hashes={'family-os':'09f7cd7ad7478571677c38959f9d6cc4a35e847dbc964e56a72076f8a6f1997c','family-os-context':'33cfc63175aadec00e527109c6e235ce02e3a7f4f269380972dd8414f6b9e5e0'};
for(const name of Object.keys(hashes)){
 const context=name==='family-os-context';
 const source=resolve(sourceRoot,name,context?'index.js':'server.js');
 if(createHash('sha256').update(readFileSync(source)).digest('hex')!==hashes[name])throw new Error('Unrecognized deployed runtime');
 const directory=resolve(output,name);mkdirSync(directory,{mode:0o700});
 const config=read(resolve(oldRepo,'packages',context?'gatekeeper-context':'workshop-backend','wrangler.prod.jsonc'));
 delete config.build;delete config.rules;delete config.migrations;
 if(!context)delete config.exports.FamilyDeviceSessionDurableObject;
 const names=Object.keys(config.exports);
 const code=`import actual,* as original from ${JSON.stringify(source)};
 import {inspectLiveRoot,authorizeLiveInspect} from ${JSON.stringify(helper)};
 export * from ${JSON.stringify(source)};
 ${names.map(n=>`export class ${n} extends original.${n}{maintenanceInspect(assertion){return inspectLiveRoot(this.ctx.storage,assertion,this.env)}}`).join('\n')}
 export default {async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(${context?'false':"url.pathname==='/api/maintenance/context/inspect'"}){
   const denied=await authorizeLiveInspect(request,env);if(denied)return denied;
   url.pathname='/maintenance/inspect';return env.CONTEXT_HTTP.fetch(new Request(url,request));
  }
  if(url.pathname!==${JSON.stringify(context?'/maintenance/inspect':'/api/maintenance/inspect')})return actual.fetch(request,env,ctx);
  const denied=await authorizeLiveInspect(request,env);if(denied)return denied;
  const name=url.searchParams.get('class');const id=url.searchParams.get('id');
  if(!${JSON.stringify(names)}.includes(name)||!id)return new Response('Explicit existing namespace and root ID required',{status:400});
  const ns=ctx.exports[name];const root=ns.get(ns.idFromString(id));
  return Response.json(await root.maintenanceInspect(request.headers.get('cf-access-jwt-assertion')),{headers:{'cache-control':'no-store'}});
 }};`;
 await build({stdin:{contents:code,resolveDir:dirname(source),sourcefile:'authorized-live-inspect.js'},bundle:true,format:'esm',platform:'neutral',mainFields:['browser','module','main'],conditions:['workerd','worker','browser'],external:['cloudflare:*','node:*',...builtinModules],loader:{'.txt':'text'},outfile:resolve(directory,'worker.js')});
 config.main=resolve(directory,'worker.js');config.vars={};
 for(const b of saved(name).bindings){if(b.type==='plain_text')config.vars[b.name]=b.text;else if(b.type==='json')config.vars[b.name]=typeof b.json==='string'?JSON.parse(b.json):b.json;}
 config.vars={...config.vars,...auth};
 if(!context){
  config.services??=[];config.services.push({binding:'CONTEXT_HTTP',service:'family-os-context'});
  // This is only a local configuration proposal; original remote assets must not be replaced.
  if(config.assets)config.assets.directory=resolve(oldRepo,'packages/workshop-backend',config.assets.directory);
 }
 writeFileSync(resolve(directory,'wrangler.jsonc'),JSON.stringify(config,null,2)+'\n',{mode:0o600});chmodSync(resolve(directory,'worker.js'),0o600);
 const liveSettings=saved(name);
 const retainedBindings=liveSettings.bindings.filter(binding=>binding.type!=='secret_text');
 if(context){
  for(const binding of settings.bindings.filter(binding=>['ADMINS','CF_ACCESS_AUD','CF_ACCESS_ISS'].includes(binding.name)))retainedBindings.push(binding);
 }else retainedBindings.push({name:'CONTEXT_HTTP',type:'service',service:'family-os-context'});
 const metadata={main_module:'worker.js',compatibility_date:liveSettings.compatibility_date,compatibility_flags:liveSettings.compatibility_flags,bindings:retainedBindings,keep_bindings:['secret_text'],keep_assets:!context,exports:config.exports,observability:liveSettings.observability,placement:liveSettings.placement,logpush:liveSettings.logpush,tags:liveSettings.tags,tail_consumers:liveSettings.tail_consumers,annotations:liveSettings.annotations,usage_model:liveSettings.usage_model};
 writeFileSync(resolve(directory,'upload-metadata.json'),JSON.stringify(metadata,null,2)+'\n',{mode:0o600});
 writeFileSync(resolve(directory,'PUBLICATION.md'),'Use the reviewed multipart metadata with keep_assets; do not deploy the local Wrangler configuration, which cannot prove the original remote asset bytes. Existing workers.dev/routes stay unchanged. No namespace lifecycle change or secret value upload.\n',{mode:0o600});
 writeFileSync(resolve(directory,'provenance.json'),JSON.stringify({sourceSha256:hashes[name],mode:'additive-live-inspect',deployed:false,originalAlarmInherited:true,rootExports:names,liveFacetInspection:false,assetPublicationVerified:false})+'\n',{mode:0o600});
 console.log(name+': recognized live runtime + authorized inspect assembled; original exports/alarm retained');
}
