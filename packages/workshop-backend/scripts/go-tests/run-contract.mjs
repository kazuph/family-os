import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
let mode='normal', requests=0;
const server=createServer((req,res)=>{
 if(req.url==='/mode') {let body='';req.on('data',data=>body+=data);req.on('end',()=>{mode=body;requests=0;res.end();});return;}
 if(req.url==='/requests'){res.end(JSON.stringify({requests}));return;}
 requests++;
 if(mode==='stall')return;
 if(mode==='failure'){res.writeHead(503).end();return;}
 if(req.url==='/models'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({data:['deepseek-v4-flash','deepseek-v4-pro','dynamic-local-vision','hy3-preview'].map(id=>({id}))}));return;}
 const metadata=(name,npm,input,context,output)=>({name,reasoning:true,modalities:{input},limit:{context,output},provider:{npm}});
 res.setHeader('Content-Type','application/json');res.end(JSON.stringify({'opencode-go':{npm:'@ai-sdk/openai-compatible',models:{
 'deepseek-v4-flash':metadata('Flash','@ai-sdk/openai-compatible',['text'],1048576,32768),
 'deepseek-v4-pro':metadata('Pro','@ai-sdk/openai-compatible',['text'],1048576,32768),
 'dynamic-local-vision':metadata('Dynamic vision','@ai-sdk/anthropic',['text','image'],200000,64000),
 }}}));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const child=spawn('pnpm',['exec','vitest','run','--config','vitest.go-contract.config.ts'],{cwd:fileURLToPath(new URL('../../',import.meta.url)),stdio:'inherit',env:{...process.env,GO_TEST_BASE_URL:base}});
child.on('exit',code=>{server.closeAllConnections();server.close(()=>process.exit(code??1));});
