import { DurableObject } from 'cloudflare:workers';
import { COMPATIBILITY_DATE } from '@gadgets/scripts/worker-config';

/** A typed export value; opaque authorities remain in their original namespace. */
export type MaintenanceValue = null | boolean | number | string | {
  type: string;
  value?: string | MaintenanceValue[] | Array<[string, MaintenanceValue]>;
};

/** Describe data without calling, disposing, serializing or replacing an opaque capability. */
export function describeValue(value: unknown): MaintenanceValue {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : {type:'number',value:String(value)};
  if (typeof value === 'bigint') return {type:'bigint',value:value.toString()};
  if (value === undefined) return {type:'undefined'};
  if (value instanceof Date) return {type:'Date',value:value.toISOString()};
  if (value instanceof ArrayBuffer) return {type:'ArrayBuffer',value:new Uint8Array(value).toHex()};
  if (ArrayBuffer.isView(value)) return {type:value.constructor.name,value:new Uint8Array(value.buffer,value.byteOffset,value.byteLength).toHex()};
  if (Array.isArray(value)) return {type:'Array',value:value.map(describeValue)};
  if (value instanceof Map) return {type:'Map',value:[...value].map(([key,item])=>({type:'entry',value:[describeValue(key),describeValue(item)]}))};
  if (value instanceof Set) return {type:'Set',value:[...value].map(describeValue)};
  if (typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) {
    return {type:'Object',value:Object.entries(value).map(([key,item])=>[key,describeValue(item)])};
  }
  // In particular, do not enumerate properties of an RPC proxy or invoke toJSON on it.
  return {type:'opaque-preserved-in-namespace'};
}

/** Read existing application tables and KV without initializing their schema or loading gadget code. */
export function readStorage(storage: DurableObjectStorage) {
  const kv = [...storage.kv.list()].map(([key,value]) => [key,describeValue(value)] as const);
  const schema = storage.sql.exec<{name:string;sql:string|null}>(
    "SELECT name, sql FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__cf_%' ORDER BY name").toArray().filter(({name})=>!name.toLowerCase().startsWith('_cf_'));
  const tables = schema.map(({name,sql})=>({name,sql,rows:storage.sql.exec('SELECT * FROM "'+name.replaceAll('"','""')+'"').toArray().map(describeValue)}));
  return {kv,tables};
}

/** A maintenance facet has no dynamic gadget constructor, migration, alarm or write path. */
export class MaintenanceFacet extends DurableObject {
  /** Read the existing facet's storage only. */
  inspect() {return readStorage(this.ctx.storage);}
}

/** A stopped root opens storage directly, without instantiating the old or new application. */
export class MaintenanceRoot extends DurableObject {
  /** Export scalar data with explicit markers for authorities retained in-place. */
  async inspect() {
    const snapshot=readStorage(this.ctx.storage);
    const alarm=await this.ctx.storage.getAlarm();
    return {...snapshot,alarm};
  }
  /** Read the exact legacy gadget facet name derived from the persisted registry. */
  async inspectGadget(gadgetId: number) {
    const record=[...this.ctx.storage.kv.list({prefix:'gadgets:'})].map(([,value])=>value as {id?:number}).find(value=>value.id===gadgetId);
    if (!record) throw new Error('Gadget is absent from the stored registry');
    const facetName=this.ctx.storage.kv.get('defaultGadgetId')===gadgetId?'gadget':`gadget${gadgetId}`;
    // A loader-only class avoids creating a new root namespace/lifecycle change for inspection.
    const loader=(this.env as {LOADER:WorkerLoader}).LOADER;
    const worker=loader.get('maintenance-storage-reader',()=>({
      compatibilityDate:COMPATIBILITY_DATE,
      compatibilityFlags:['allow_irrevocable_stub_storage'],
      mainModule:'reader.js',
      modules:{'reader.js':{js:"import {DurableObject} from 'cloudflare:workers';\n"+describeValue.toString()+"\n"+readStorage.toString()+"\nexport class Reader extends DurableObject {inspect(){return readStorage(this.ctx.storage)}}"}},
      globalOutbound:null,
    }));
    const facet=this.ctx.facets.get(facetName,()=>({class:worker.getDurableObjectClass<MaintenanceFacet>('Reader'),id:facetName}));
    return {facetName,...await facet.inspect()};
  }
  /** Capture a native recovery point; no restore or alarm cancellation is performed. */
  bookmark() {return this.ctx.storage.getCurrentBookmark();}
}
