import {authorizeMaintenance,type MaintenanceEnv} from './worker';
import {readStorage} from './read-only';
import{createRemoteJWKSet,customFetch,jwtVerify}from'jose';

type LiveEnv=MaintenanceEnv & {ACCESS_IDENTITY?:Fetcher};
const authorize=(request:Request,env:LiveEnv)=>authorizeMaintenance(request,env,env.ACCESS_IDENTITY?async(token,config)=>{
  const keys=createRemoteJWKSet(new URL(config.CF_ACCESS_ISS+'/cdn-cgi/access/certs'),{[customFetch]:(input,init)=>env.ACCESS_IDENTITY!.fetch(input,init)});
  return(await jwtVerify(token,keys,{issuer:config.CF_ACCESS_ISS,audience:config.CF_ACCESS_AUD})).payload;
}:undefined);

/** Inspect inside the original runtime class; its constructor, alarm and capabilities stay intact. */
export async function inspectLiveRoot(storage:DurableObjectStorage,assertion:string,env:LiveEnv) {
  const request=new Request('https://maintenance.local/maintenance/inspect',{headers:{'cf-access-jwt-assertion':assertion}});
  if(!await authorize(request,env))throw new Error('Forbidden');
  return {...readStorage(storage),alarm:await storage.getAlarm()};
}

/** Restrict additive inspection to explicit root IDs and verified human admins. */
export async function authorizeLiveInspect(request:Request,env:LiveEnv) {
  if(!await authorize(request,env))return new Response('Forbidden',{status:403});
  if(request.method!=='GET')return new Response('Read-only inspection',{status:405});
  if(new URL(request.url).searchParams.has('gadget'))return new Response('Live facet substitution is disabled; inspect root lifecycle first',{status:409});
  return null;
}
