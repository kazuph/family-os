// Extends only the newly extracted legacy fixture; neither production nor an existing state is edited.
import {spawnSync} from 'node:child_process';
import {copyFileSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const [destination]=process.argv.slice(2);
if(!destination)throw new Error('Usage: prepare-cutover.mjs NEW_ISOLATED_DIRECTORY');
const result=spawnSync(process.execPath,[new URL('./prepare-legacy.mjs',import.meta.url).pathname,destination],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status??1);
const source=resolve(destination,'packages/workshop-backend/src');
copyFileSync(new URL('./cutover-legacy-extension.ts.txt',import.meta.url),source+'/cutover-legacy-extension.ts');
const path=source+'/book-fixture-worker.ts';
let text=readFileSync(path,'utf8');
const marker="    if(args.operation==='owner')";
if(text.split(marker).length!==2)throw new Error('Pinned fixture authentication boundary changed');
text="import {createCutoverChildBook} from './cutover-legacy-extension';\n"+text.replace(marker,"    if(args.operation==='child')return Response.json(await createCutoverChildBook(ctx,env,args.username,ownerId));\n"+marker);
writeFileSync(path,text);
console.log('Pinned legacy cutover fixture prepared:',resolve(destination));
