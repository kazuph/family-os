import {type GadgetRecord,makeOverseerStorage} from '../../src/storage-schema/overseer-storage';
import {migrateCodeLogToGit} from '../../src/storage-schema/overseer-git-migration';
import {GitStore} from '../../src/git-store';

/** Exact deployed source whose version 2 denotes Yjs plus action indexes, not Git. */
export const LEGACY_SOURCE_SHA256='09f7cd7ad7478571677c38959f9d6cc4a35e847dbc964e56a72076f8a6f1997c';

/** Convert only the recognized stopped legacy schema in-place; never rewrite authority records. */
export async function convertRecognizedWorkspace(ctx:DurableObjectState,sourceSha256:string,ownerId:string) {
  if(sourceSha256!==LEGACY_SOURCE_SHA256)throw new Error('Unrecognized deployed source');
  if(ctx.storage.kv.get('ownerId')!==ownerId)throw new Error('Workspace owner mismatch');
  const storage=makeOverseerStorage(ctx.storage);
  const receipt=ctx.storage.kv.get<{sourceSha256:string;ownerId:string}>('maintenanceGitConversion');
  if(receipt){
    if(receipt.sourceSha256!==sourceSha256||receipt.ownerId!==ownerId||storage.version.get()!==4)throw new Error('Conversion receipt/state mismatch');
    return {status:'noop' as const};
  }
  if(storage.version.get()!==2 || [...storage.gitObjects.list()].length)throw new Error('Not recognized legacy Yjs version 2');
  if([...ctx.storage.kv.list({prefix:'snapshotParts:'})].length)throw new Error('Pruned partitioned history requires reconstruction before Git conversion');
  const gadgets=[...storage.gadgets.list()].map(g=>{if(g.type!==undefined)throw new Error('Unknown legacy gadget discriminant');return g as GadgetRecord;});
  if(gadgets.some(g=>Object.hasOwn(g,'movedFrom')||Object.hasOwn(g,'move')))throw new Error('Moved workspace requires lease-aware preservation before conversion');
  if(gadgets.some(g=>g.commitId||g.pending||Object.hasOwn(g,'movePending')))throw new Error('Workspace has Git or pending gadget lifecycle');
  for(const meta of storage.chatMeta.list())if(meta.activeAgent||meta.codeBase)throw new Error('Workspace has an active agent or previously converted chat');
  const code=[...storage.code.list()];
  if(code.some(row=>!(row.update instanceof Uint8Array)||!(row.timestamp instanceof Date)))throw new Error('Unknown legacy code structure');
  if([...storage.chats.list()].some(row=>!(row.timestamp instanceof Date)))throw new Error('Unknown legacy conversation structure');
  let timestamp=Math.max(0,...[...storage.chats.list()].map(row=>row.timestamp.valueOf()));
  // The native storage transaction retains all original references on failure; facets are untouched.
  return await ctx.storage.transaction(async()=>{
    const result=await migrateCodeLogToGit({
      storage,gitStore:new GitStore(storage.gitObjects),
      ownerIdentity:{name:'Workspace owner',email:ownerId},
      defaultGadgetId:storage.defaultGadgetId.get(),
      createDefaultGadget(){throw new Error('Unregistered implicit gadget requires explicit preservation before conversion');},
      getChatTimestamp(){return new Date(++timestamp);},
    });
    storage.actions.pendingByGatekeeper.rebuild();
    storage.actions.byHistoryFilter.rebuild();
    storage.actions.byLastChanged.rebuild();
    for(const gadget of storage.gadgets.list())storage.gadgets.put({...(gadget as GadgetRecord),type:'gadget'});
    storage.version.put(4);
    ctx.storage.kv.put('maintenanceGitConversion',{sourceSha256,ownerId});
    return {status:'converted' as const,commits:result.commits};
  });
}
