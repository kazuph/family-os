import{readFileSync}from'node:fs';import{resolve}from'node:path';
const [root,...options]=process.argv.slice(2);if(!root)throw new Error('Reviewed protected artifact directory required');
const execute=options.includes('--execute');
for(const name of ['family-os-context','family-os']){
 const directory=resolve(root,name);const metadata=JSON.parse(readFileSync(resolve(directory,'upload-metadata.json'),'utf8'));
 const expected=name==='family-os'?8:4;
 if(Object.keys(metadata.exports).length!==expected||metadata.migrations||metadata.assets||!metadata.keep_bindings.includes('secret_text'))throw new Error('Unexpected lifecycle, assets upload or secret replacement');
 if(name==='family-os'&&metadata.keep_assets!==true)throw new Error('Original remote assets must be kept');
 if(metadata.bindings.some(b=>b.type==='secret_text'))throw new Error('No secret values may be uploaded');
 for(const required of ['ADMINS','CF_ACCESS_ISS','CF_ACCESS_AUD'])if(!metadata.bindings.some(b=>b.name===required))throw new Error('Missing existing auth setting');
 if(!execute){console.log(name+': dry multipart metadata validation PASS, original assets/secrets/lifecycle retained');continue;}
 const token=process.env.CLOUDFLARE_API_TOKEN;const account=process.env.CLOUDFLARE_ACCOUNT_ID;
 if(!token||!account)throw new Error('Only the authorized parent may execute with the existing direnv environment');
 const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}));form.set('worker.js',new Blob([readFileSync(resolve(directory,'worker.js'))],{type:'application/javascript+module'}),'worker.js');
 const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+'/workers/scripts/'+name,{method:'PUT',headers:{authorization:'Bearer '+token},body:form});
 if(!response.ok)throw new Error('Publication failed HTTP '+response.status);
 const result=await response.json();if(result.success!==true)throw new Error('Publication rejected');
 console.log(name+': additive inspect published; parent must verify Access, original app/assets and resource identity');
}
