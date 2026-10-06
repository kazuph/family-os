import { verifyCfAccessJwt, type CfAccessEnv } from '../../src/access';
import { MaintenanceRoot } from './read-only';

// Preserve class names and namespaces. None of these constructors run application migrations.
/** Stopped account storage. */
export class UserDurableObject extends MaintenanceRoot {}
/** Stopped workspace storage. */
export class OverseerDurableObject extends MaintenanceRoot {}
/** Retained household data; this is not a Family authentication implementation. */
export class FamilyDurableObject extends MaintenanceRoot {}
/** Stopped deployment settings storage. */
export class AdminSettings extends MaintenanceRoot {}
/** Retained limiter storage. */
export class BrowserVerificationLimiterDurableObject extends MaintenanceRoot {}
/** Retained pending authentication storage. */
export class PendingLogin extends MaintenanceRoot {}
/** Retained model storage. */
export class LanguageModelGatekeeper extends MaintenanceRoot {}
/** Retained agent spawner storage. */
export class AgentSpawnerGatekeeper extends MaintenanceRoot {}

/** Existing Access and deployment-admin configuration; no new secret. */
export type MaintenanceEnv=CfAccessEnv & {ADMINS?: string|string[]};
/** Only loopback namespaces from the stopped deployment. */
export type MaintenanceContext=Omit<ExecutionContext,'exports'> & {exports:Record<string,DurableObjectNamespace<MaintenanceRoot>>};
const classes=new Set(['UserDurableObject','OverseerDurableObject','FamilyDurableObject','AdminSettings','BrowserVerificationLimiterDurableObject','PendingLogin','LanguageModelGatekeeper','AgentSpawnerGatekeeper','ContextCollectionDurableObject','ContextGatekeeper','LibraryRegistryDurableObject','UserLibraryDurableObject']);

/** Require the same verified Access email and exact configured admin name used by standard auth. */
export async function authorizeMaintenance(request:Request,env:MaintenanceEnv,verifier?:Parameters<typeof verifyCfAccessJwt>[2]):Promise<boolean> {
  const claims=await verifyCfAccessJwt(request,env,verifier);
  const admins=typeof env.ADMINS==='string'?JSON.parse(env.ADMINS):env.ADMINS;
  return typeof claims?.email==='string' && Array.isArray(admins) && admins.includes(claims.email);
}

/** Maintenance is a stopped deployment: only signed Access human admins may perform GET reads. */
export default {
  async fetch(request:Request,env:MaintenanceEnv,ctx:MaintenanceContext):Promise<Response> {
    if (!await authorizeMaintenance(request,env)) return new Response('Forbidden',{status:403});
    if (request.method!=='GET') return new Response('Read-only maintenance',{status:405});
    const url=new URL(request.url);
    if (url.pathname!=='/maintenance/inspect' && url.pathname!=='/maintenance/bookmark') return new Response('Deployment stopped for maintenance',{status:503});
    const name=url.searchParams.get('class')??'';
    if (!classes.has(name)) return new Response('Unknown namespace class',{status:400});
    const id=url.searchParams.get('id');
    if (!id) return new Response('Explicit existing object id required',{status:400});
    const namespace=ctx.exports[name];
    if(!namespace)return new Response('Class is not part of this deployment',{status:400});
    const root=namespace.get(namespace.idFromString(id));
    const gadget=url.searchParams.get('gadget');
    if(gadget!==null && (name!=='OverseerDurableObject' || !/^\d+$/.test(gadget) || !Number.isSafeInteger(Number(gadget)))) return new Response('Invalid gadget',{status:400});
    const value=url.pathname==='/maintenance/bookmark'?{bookmark:await root.bookmark()}:gadget===null?await root.inspect():await root.inspectGadget(Number(gadget));
    return Response.json(value,{headers:{'cache-control':'no-store'}});
  },
};
