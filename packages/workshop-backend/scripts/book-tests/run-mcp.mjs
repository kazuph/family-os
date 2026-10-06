import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const cwd=fileURLToPath(new URL('../../', import.meta.url));
const require=createRequire(cwd+'/package.json');
const {generateKeyPair,exportJWK,SignJWT}=await import(require.resolve('jose'));
if (!process.env.OPENCODE_GO_API_TOKEN) throw new Error('Explicit Go token required for default tutor binding, not inference');
const key=await generateKeyPair('RS256');
const jwk={...await exportJWK(key.publicKey),kid:'book-local-key',alg:'RS256',use:'sig'};
let makeTokens;
const server=createServer(async(req,res)=>{
 if(req.url==='/tokens'){res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify(await makeTokens()));return;}
 if(req.url!=='/cdn-cgi/access/certs'){res.writeHead(404).end();return;}
 res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify({keys:[jwk]}));
});
server.listen(0,'127.0.0.1',async()=>{
 const issuer='http://127.0.0.1:'+server.address().port;
 const sign=async(payload,opts={})=>new SignJWT(payload).setProtectedHeader({alg:'RS256',kid:jwk.kid}).setIssuer(opts.issuer??issuer).setAudience(opts.audience??'book-local-audience').setExpirationTime(opts.expired?1:'5m').sign(opts.key??key.privateKey);
 makeTokens=async()=>({newOwner:await sign({email:'NewBookOwner@local.test'}),owner:await sign({email:'BookOwner@local.test'}),stranger:await sign({email:'OtherOwner@local.test'}),service:await sign({common_name:'local-book-service'}),wrongIssuer:await sign({email:'BookOwner@local.test'},{issuer:'http://another-issuer'}),wrongAudience:await sign({email:'BookOwner@local.test'},{audience:'another-audience'}),expired:await sign({email:'BookOwner@local.test'},{expired:true}),wrongKey:await sign({email:'BookOwner@local.test'},{key:(await generateKeyPair('RS256')).privateKey})});
 const child=spawn('pnpm',['exec','vitest','run','--config','vitest.book-mcp.config.ts'],{cwd,stdio:'inherit',env:{...process.env,BOOK_TEST_ACCESS_ISS:issuer}});
 child.on('exit',code=>server.close(()=>process.exit(code??1)));
});
