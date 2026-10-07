// Real two-Worker, loopback HTTP check; no production request or dependency replacement.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {productionConfigs} from './production-config.ts';
const require=createRequire(import.meta.url);
const {createTestHarness}=require('wrangler');
const root=resolve(import.meta.dirname,'..');
const workers=Object.entries(productionConfigs).map(([pkg,original])=>{
 const config=structuredClone(original);
 const base=resolve(root,'packages',pkg,'.wrangler/production/config');
 config.main=resolve(base,config.main);
 if(config.assets)config.assets.directory=resolve(base,config.assets.directory);
 delete config.browser;
 // These remote-only integrations are not exercised by this local routing gate.
 delete config.ai;
 return {config};
});
const server=createTestHarness({root,workers});
try{
 const {url}=await server.listen();
 for(const path of ['/gatekeeper/context','/gatekeeper/context/status']){
  const response=await fetch(new URL(path,url));
  assert.equal(response.status,200);
  assert.equal(await response.text(),'Context Library worker is running.');
 }
 const response=await fetch(new URL('/gatekeeper/context-other',url));
 assert.equal(response.status,200);
 assert.match(await response.text(),/<html/);
 console.log('PASS: exact Context prefix reaches the real Context Worker; neighboring path reaches frontend assets');
}finally{await server.close();}
