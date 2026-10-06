import{env,SELF,runInDurableObject,runDurableObjectAlarm}from'cloudflare:test';
import{it,expect}from'vitest';
const decode=(v:any):any=>v?.$date?new Date(v.$date):v?.$bytes?Uint8Array.fromBase64(v.$bytes):Array.isArray(v)?v.map(decode):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,decode(x)])):v;

it('additive inspect preserves live root state and the actual deployed alarm handler',async()=>{
 console.log('STAGE alarm: seed/auth/read begin');
 const bindings=env as any;
 const tokens=await(await fetch(bindings.MAINTENANCE_JWKS+'/tokens')).json() as Record<string,string>;
 const captured=JSON.parse(bindings.MAINTENANCE_LIVE_FIXTURE);
 const root=bindings.LIVE_OVERSEER.getByName('live-runtime-read-only');
 await runInDurableObject(root,async(_instance,state)=>{
  for(const[key,value]of decode(captured.kv))state.storage.kv.put(key,value);
  await state.storage.setAlarm(new Date('2099-01-01T00:00:00Z'));
 });
 const url='https://live.test/api/maintenance/inspect?class=OverseerDurableObject&id='+root.id;
 const get=(token?:string,path=url,method='GET')=>SELF.fetch(path,{method,headers:token?{'cf-access-jwt-assertion':token}:{}});
 for(const token of [undefined,tokens.other,tokens.service,tokens.wrongKey,tokens.wrongIssuer,tokens.wrongAudience,tokens.expired])expect((await get(token)).status).toBe(403);
 expect((await get(tokens.admin,url,'POST')).status).toBe(405);
 expect((await get(tokens.admin,url+'&gadget=1')).status).toBe(409);
 const beforeResponse=await get(tokens.admin);expect(beforeResponse.status).toBe(200);expect(beforeResponse.headers.get('cache-control')).toBe('no-store');
 const before=await beforeResponse.json() as any;
 expect(before.alarm).toBe(new Date('2099-01-01T00:00:00Z').valueOf());
 expect(await(await get(tokens.admin)).json()).toEqual(before);
 console.log('STAGE alarm: authenticated read invariant PASS, actual alarm begin');
 expect(await runDurableObjectAlarm(root)).toBe(true);
 console.log('STAGE alarm: actual alarm completed');
 const after=await(await get(tokens.admin)).json() as any;
 expect(after.alarm).toBeNull();expect(after.kv).toEqual(before.kv);expect(after.tables).toEqual(before.tables);
 console.log('STAGE alarm: post-alarm KV/SQL invariants PASS, test complete');
});
