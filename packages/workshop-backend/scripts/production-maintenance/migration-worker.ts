import readOnly,{authorizeMaintenance,type MaintenanceEnv,type MaintenanceContext} from './worker';
import {MaintenanceRoot} from './read-only';
import {convertRecognizedWorkspace} from './convert';
export * from './worker';

/** Explicit write-stage workspace; ordinary application constructors and gadget facets stay stopped. */
export class OverseerDurableObject extends MaintenanceRoot {
  /** Obtain native recovery point before applying the checked transaction; opaque values stay in-place. */
  async convert(sourceSha256:string,ownerId:string) {
    const bookmark=await this.bookmark();
    return {bookmark,...await convertRecognizedWorkspace(this.ctx,sourceSha256,ownerId)};
  }
}

type MigrationContext=Omit<MaintenanceContext,'exports'> & {
  exports:MaintenanceContext['exports'] & {OverseerDurableObject:DurableObjectNamespace<OverseerDurableObject>};
};

/** This write entrypoint is assembled separately and is never enabled by the read-only stage. */
export default {
  async fetch(request:Request,env:MaintenanceEnv,ctx:MigrationContext) {
    if(new URL(request.url).pathname!=='/maintenance/convert')return readOnly.fetch(request,env,ctx);
    if(!await authorizeMaintenance(request,env))return new Response('Forbidden',{status:403});
    if(request.method!=='POST')return new Response('Explicit POST required',{status:405});
    const body:unknown=await request.json();
    if(!body||typeof body!=='object'||!('id'in body)||!('ownerId'in body)||!('sourceSha256'in body)||typeof body.id!=='string'||typeof body.ownerId!=='string'||typeof body.sourceSha256!=='string')return new Response('Explicit object, owner and source identity required',{status:400});
    const namespace=ctx.exports.OverseerDurableObject;
    const value=await namespace.get(namespace.idFromString(body.id)).convert(body.sourceSha256,body.ownerId);
    return Response.json(value,{headers:{'cache-control':'no-store'}});
  },
};
