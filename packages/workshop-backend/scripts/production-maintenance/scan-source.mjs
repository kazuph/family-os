import {readFileSync,writeFileSync,chmodSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../package.json',import.meta.url));
const ts=require(process.env.MAINTENANCE_TYPESCRIPT_PARSER??'typescript');
if(!ts.createSourceFile)throw new Error('Set MAINTENANCE_TYPESCRIPT_PARSER to an already-installed TypeScript JS parser; no dependency install is performed');
const [sourcePath,output]=process.argv.slice(2);
if(!sourcePath||!output)throw new Error('Usage: node scan-source.mjs protected-source.js protected-report.json');
const source=readFileSync(sourcePath,'utf8');
const hash=value=>createHash('sha256').update(value).digest('hex');
const ast=ts.createSourceFile(sourcePath,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const findings=[];
function visit(node){
  if(ts.isStringLiteralLike(node)){
    const value=node.text;
    const key=ts.isPropertyAssignment(node.parent)?node.parent.name.getText(ast):ts.isVariableDeclaration(node.parent)?node.parent.name.getText(ast):'';
    const reason=/^(?:sk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.test(value)?'credential-shaped literal':/^(?:apiToken|apiKey|clientSecret|password|OPENCODE_GO_API_TOKEN|CF_API_TOKEN)$/i.test(key.replaceAll(/['"]/g,''))&&value.length>0?'credential field literal':null;
    if(reason)findings.push({reason,classification:value==='unused'?'static unused placeholder':value===key.replaceAll(/["']/g,'')?'property-name/schema marker':'requires protected inspection',line:ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1,valueSha256:hash(value)});
  }
  ts.forEachChild(node,visit);
}
visit(ast);
const report={sourceSha256:hash(source),parseErrors:ast.parseDiagnostics.length,findings,meaning:'Heuristic review aid, not proof that every secret is absent. Never commit raw production bundles or data.'};
writeFileSync(output,JSON.stringify(report,null,2)+'\n',{mode:0o600});chmodSync(output,0o600);
console.log(JSON.stringify({parseErrors:report.parseErrors,suspectedLiteralCount:findings.length,report:output}));
