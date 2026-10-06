import {env} from 'cloudflare:workers';
import {runInDurableObject} from 'cloudflare:test';
import {expect,it} from 'vitest';
import {getOpenCodeGoMetadata,listOpenCodeGoModels,getOpenCodeGoModel,isKnownOpenCodeGoModelId} from '../src/opencode-go';
import {assertChatAttachmentSupportedByProvider,getGoAttachmentCapabilities} from '../src/chat-attachment-validation';
import {getModelTokenLimits} from '../src/agent-compaction';
import type {UserDurableObject} from '../src/user';
import type {Model,Api} from '@earendil-works/pi-ai';
const base=(env as Cloudflare.Env & {GO_TEST_BASE_URL:string}).GO_TEST_BASE_URL;
const source={modelsUrl:base+'/models',metadataUrl:base+'/metadata'};
const deployment={OPENCODE_GO_API_TOKEN:'local-existence-check'} as Cloudflare.Env;
async function mode(value:string){expect((await fetch(base+'/mode',{method:'POST',body:value})).ok).toBe(true);}
const user=()=> (env as Cloudflare.Env & {TEST_USER:DurableObjectNamespace<UserDurableObject>}).TEST_USER.getByName(crypto.randomUUID());
it('keeps non-Go account resolution independent of failed or stalled Go HTTP',async()=>{
 for(const failure of ['failure','stall']){
  await mode(failure);
  const stub=user();
  await runInDurableObject(stub,async(instance:UserDurableObject)=>{
   await instance.addModel({type:'agent',id:'local-openai',name:'Own model'},{provider:'openai',model:'local-openai',apiToken:'local-provider-token'});
   await instance.setPreferredModel('local-openai');
   expect((await instance.getChatContext('local-openai')).aiModel?.config.provider).toBe('openai');
  });
  expect((await (await fetch(base+'/requests')).json() as {requests:number}).requests).toBe(0);
  expect(await listOpenCodeGoModels(deployment,source)).toEqual([]);
 }
 await mode('failure');
 await expect(getOpenCodeGoMetadata('deepseek-v4-flash',source)).rejects.toThrow('503');
});
it('retains dynamic catalog models and Go priority with actual routing/input/limits',async()=>{
 await mode('normal');
 const models=await listOpenCodeGoModels(deployment,source);
 expect(models[0].id).toBe('deepseek-v4-flash');
 expect(models.map(m=>m.id)).toContain('dynamic-local-vision');
 expect(models.map(m=>m.id)).not.toContain('hy3-preview');
 expect(isKnownOpenCodeGoModelId('dynamic-local-vision',source)).toBe(true);
 expect((await getOpenCodeGoModel(deployment,'dynamic-local-vision',source))?.config.apiToken).toBe('');
 const {api,metadata}=await getOpenCodeGoMetadata('dynamic-local-vision',source);
 expect(await getGoAttachmentCapabilities({provider:'opencode-go',model:'deepseek-v4-flash',apiToken:''},source)).toEqual({api:'openai-completions',input:['text']});
 expect(await getGoAttachmentCapabilities({provider:'opencode-go',model:'dynamic-local-vision',apiToken:''},source)).toEqual({api:'anthropic-messages',input:['text','image']});

 expect(api).toBe('anthropic-messages');
 const model={api,input:['text','image'],contextWindow:metadata.limit.context,maxTokens:metadata.limit.output} as Model<Api>;
 expect(()=>assertChatAttachmentSupportedByProvider('opencode-go','image/png',8,model)).not.toThrow();
 expect(()=>assertChatAttachmentSupportedByProvider('opencode-go','application/pdf',8,model)).not.toThrow();
 expect(()=>assertChatAttachmentSupportedByProvider('opencode-go','application/pdf',8,{...model,api:'openai-completions'})).toThrow('does not support');
 expect(()=>assertChatAttachmentSupportedByProvider('opencode-go','image/png',8,{...model,input:['text']})).toThrow('does not support');
 expect(getModelTokenLimits({provider:'opencode-go',model:'dynamic-local-vision',apiToken:''},model)).toEqual({inputBudget:136000,maxOutputTokens:64000});
 const stub=user();
 await runInDurableObject(stub,async(instance:UserDurableObject)=>{
  await instance.addModel({type:'agent',id:'deepseek-v4-flash',name:'Collision'},{provider:'openai',model:'collision',apiToken:'local'});
  expect((await instance.getChatContext('deepseek-v4-flash')).aiModel?.config.provider).toBe('opencode-go');
  await instance.addModel({type:'agent',id:'dynamic-local-vision',name:'Unadvertised collision'},{provider:'openai',model:'collision',apiToken:'local'});
  // Before this User's real catalog read, resolving the existing account model is network-free.
  expect((await instance.getChatContext('dynamic-local-vision')).aiModel?.config.provider).toBe('openai');
  await instance.listModels();
  expect((await instance.getChatContext('dynamic-local-vision')).aiModel?.config.provider).toBe('opencode-go');
 });
});
