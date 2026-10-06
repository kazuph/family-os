import {readFileSync,writeFileSync,mkdirSync,chmodSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire,builtinModules} from 'node:module';
import {resolve} from 'node:path';
const require=createRequire(new URL('../../package.json',import.meta.url));
const {build}=require('esbuild');
const [source,output]=process.argv.slice(2);
if(!source||!output)throw new Error('Usage: prepare-live-fixture.mjs PROTECTED_SERVER_JS NEW_PROTECTED_DIRECTORY');
const digest=createHash('sha256').update(readFileSync(source)).digest('hex');
if(digest!=='09f7cd7ad7478571677c38959f9d6cc4a35e847dbc964e56a72076f8a6f1997c')throw new Error('Unrecognized live source; inspect its schema before changing this gate');
mkdirSync(output,{mode:0o700});
const code=`import actual,{UserDurableObject as User,OverseerDurableObject as Overseer} from ${JSON.stringify(resolve(source))};
export * from ${JSON.stringify(resolve(source))};
export class UserDurableObject extends User {inspectKv(){return [...this.ctx.storage.kv.list()]}}
export class OverseerDurableObject extends Overseer {inspectKv(owner){if(this.ctx.storage.kv.get('ownerId')!==owner)throw new Error('Owner mismatch');return [...this.ctx.storage.kv.list()]}}
export default {async fetch(req,env,ctx){if(new URL(req.url).pathname!='/__local_capture')return actual.fetch(req,env,ctx);const a=await req.json();const u=ctx.exports.UserDurableObject.getByName(a.username);const [name,token]=a.token.split(':');if(name!==a.username)throw new Error('Session mismatch');await u.authenticate(token);const ns=ctx.exports.OverseerDurableObject;const w=ns.get(ns.idFromString(a.workspaceId));return Response.json(encode(await w.inspectKv(u.id.toString())))} };
function encode(v){if(v instanceof Date)return {$date:v.toISOString()};if(v instanceof Uint8Array)return {$bytes:v.toBase64()};if(Array.isArray(v))return v.map(encode);if(v&&typeof v==='object'){if(Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)throw new Error('Local generated fixture has opaque values; preserve in namespace');return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encode(x)]))}return v}
`;
await build({stdin:{contents:code,resolveDir:process.cwd(),sourcefile:'local-live-fixture.js'},bundle:true,format:'esm',platform:'neutral',external:['cloudflare:*','node:*',...builtinModules],loader:{'.txt':'text'},outfile:resolve(output,'worker.js')});
chmodSync(resolve(output,'worker.js'),0o600);
writeFileSync(resolve(output,'provenance.json'),JSON.stringify({sourceSha256:digest,gitCommitProven:false})+'\n',{mode:0o600});
console.log('PASS: recognized live source assembled only in protected local directory');
