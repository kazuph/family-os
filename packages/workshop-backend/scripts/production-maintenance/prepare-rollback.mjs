import{readFileSync,writeFileSync,mkdirSync,copyFileSync,chmodSync}from'node:fs';
import{resolve}from'node:path';
import{createHash}from'node:crypto';
const [snapshots,output]=process.argv.slice(2);
if(!output)throw new Error('Usage: prepare-rollback.mjs PROTECTED_SNAPSHOTS NEW_OUTPUT');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest=JSON.parse(readFileSync(resolve(snapshots,'manifest.json'),'utf8'));
for(const record of manifest){if(hash(readFileSync(resolve(snapshots,record.name)))!==record.sha256)throw new Error('Snapshot hash mismatch');}
mkdirSync(output,{mode:0o700});
const plan=[];
for(const name of ['family-os','family-os-context']){
 const deployment=JSON.parse(readFileSync(resolve(snapshots,name+'-deployments.snapshot'),'utf8')).result.deployments[0];
 if(deployment.strategy!=='percentage'||deployment.versions.length!==1||deployment.versions[0].percentage!==100)throw new Error('Expected exact saved active deployment');
 for(const suffix of ['source','settings','deployments']){const destination=resolve(output,name+'-'+suffix+'.snapshot');copyFileSync(resolve(snapshots,name+'-'+suffix+'.snapshot'),destination);chmodSync(destination,0o600);}
 plan.push({worker:name,request:{method:'POST',path:'/accounts/$ACCOUNT_ID/workers/scripts/'+name+'/deployments',body:{strategy:deployment.strategy,versions:deployment.versions,annotations:{'workers/message':'Restore pre-inspection runtime version'}}},version:deployment.versions[0].version_id});
}
writeFileSync(resolve(output,'rollback-plan.json'),JSON.stringify({executed:false,plan,scope:'Original version code, versioned settings and attached assets; does not restore DO data or non-versioned routes/settings',preconditions:['Saved versions still exist','No namespace lifecycle creation/deletion','Resource IDs unchanged','For converted DOs restore recorded PITR before original code'],snapshotManifest:manifest},null,2)+'\n',{mode:0o600});
const script=`import{readFileSync}from'node:fs';
 const plan=JSON.parse(readFileSync(new URL('./rollback-plan.json',import.meta.url),'utf8'));
 const execute=process.argv.includes('--execute');
 for(const item of plan.plan){
  if(item.request.method!=='POST'||item.request.body.versions.length!==1||item.request.body.versions[0].percentage!==100)throw new Error('Invalid saved rollback request');
  if(!execute){console.log(item.worker+': dry validation PASS; original saved version '+item.version);continue;}
  const account=process.env.CLOUDFLARE_ACCOUNT_ID;const token=process.env.CLOUDFLARE_API_TOKEN;
  if(!account||!token)throw new Error('Use the authorized parent direnv environment');
  const response=await fetch('https://api.cloudflare.com/client/v4'+item.request.path.replace('$ACCOUNT_ID',account),{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(item.request.body)});
  if(!response.ok)throw new Error('Rollback failed HTTP '+response.status);
  const result=await response.json();if(result.success!==true)throw new Error('Rollback rejected');
  console.log(item.worker+': original version deployment restored; verify Access, assets and DO state separately');
 }
`;
writeFileSync(resolve(output,'rollback.mjs'),script,{mode:0o600});
console.log('PASS: original source/settings snapshots hash-checked; existing-version rollback artifact prepared, not executed');
