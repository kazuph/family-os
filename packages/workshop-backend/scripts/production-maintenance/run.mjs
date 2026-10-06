import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(cwd+'/package.json');
const {generateKeyPair,exportJWK,SignJWT,jwtVerify}=await import(require.resolve('jose'));
const key=await generateKeyPair('RS256');const wrong=await generateKeyPair('RS256');
const jwk={...await exportJWK(key.publicKey),kid:'maintenance-local',alg:'RS256',use:'sig'};
let tokens;
const server=createServer(async(req,res)=>{
  res.setHeader('content-type','application/json');
  if(req.url==='/cdn-cgi/access/certs')return res.end(JSON.stringify({keys:[jwk]}));
  if(req.url==='/tokens')return res.end(JSON.stringify(tokens));
  if(req.url==='/cdn-cgi/access/get-identity'){
    const assertion=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('CF_Authorization='))?.slice('CF_Authorization='.length);
    try{const {payload}=await jwtVerify(assertion,key.publicKey,{issuer,audience:'maintenance-local'});return res.end(JSON.stringify({email:payload.email,id:payload.sub,iat:payload.iat}));}catch{return res.writeHead(403).end();}
  }
  res.writeHead(404).end();
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const issuer=process.argv.includes('--harness')?'https://maintenance.local':base;
const sign=(payload,options={})=>new SignJWT(payload).setProtectedHeader({alg:'RS256',kid:jwk.kid}).setSubject(payload.email??'local-service').setIssuedAt().setIssuer(options.issuer??issuer).setAudience(options.audience??'maintenance-local').setExpirationTime(options.expired?1:'5m').sign(options.key??key.privateKey);
tokens={admin:await sign({email:'Admin@local.test'}),other:await sign({email:'Other@local.test'}),service:await sign({common_name:'service'}),wrongKey:await sign({email:'Admin@local.test'},{key:wrong.privateKey}),wrongIssuer:await sign({email:'Admin@local.test'},{issuer:'http://wrong'}),wrongAudience:await sign({email:'Admin@local.test'},{audience:'wrong'}),expired:await sign({email:'Admin@local.test'},{expired:true})};
const config=process.argv.includes('--live')?'vitest.maintenance-live.config.ts':'vitest.maintenance.config.ts';
const harness=process.argv.includes('--harness');
const child=spawn(harness?'node':'pnpm',harness?['scripts/production-maintenance/live-harness.mjs']:['exec','vitest','run','--config',config],{cwd,stdio:'inherit',env:{...process.env,MAINTENANCE_JWKS:base,MAINTENANCE_ISSUER:issuer}});
child.on('exit',code=>{server.closeAllConnections();server.close(()=>process.exit(code??1));});
