import { DurableObject } from 'cloudflare:workers';
import { Gadget } from '../../bundled-blueprints/blueprints/workspace-book/files/server.js';
import { planBookOfflineCopy, type LegacyBookSnapshot } from '../scripts/book-offline-copy/plan';
import { copyBookSqliteTables, publishBookOfflineCopy } from '../scripts/book-offline-copy/apply';
export * from '../src/server';

/** Offline-only account restore target; this entrypoint refuses every HTTP request. */
export class UserDurableObject extends DurableObject {
  /** Restore an isolated empty account without changing its owner identity or credentials. */
  seed(rows: Array<[string, unknown]>) {
    if ([...this.ctx.storage.kv.list()].length) throw new Error('Account restore requires empty isolated storage');
    this.ctx.storage.transactionSync(() => {
      for (const [key, value] of rows) this.ctx.storage.kv.put(key, value);
    });
  }
}

/** Real book SQLite transfer facet for the stopped local copy. */
export class BookOfflineCopyFacet extends Gadget {
  /** Run the actual four-table copier. */
  copy(tables: LegacyBookSnapshot['tables']) { return copyBookSqliteTables(this.ctx.storage, tables); }
}

/** Stopped local workspace: deliberately does not start the normal runtime's Git migration. */
export class OverseerDurableObject extends DurableObject {
  /** Restore the captured destination only into empty isolated storage. */
  seed(rows: Array<[string, unknown]>) {
    if ([...this.ctx.storage.kv.list()].length) throw new Error('Workspace restore requires empty isolated storage');
    this.ctx.storage.transactionSync(() => {
      for (const [key, value] of rows) this.ctx.storage.kv.put(key, value);
    });
  }
  /** Inspect state across eviction without running upstream migrations. */
  inspect() { return [...this.ctx.storage.kv.list()]; }
  /** Exercise actual publication rollback, or publish the exact checked plan on retry. */
  async copy(input: LegacyBookSnapshot, failPublication: boolean) {
    const plan = await planBookOfflineCopy(input);
    const name = this.ctx.storage.kv.get('defaultGadgetId') === input.targetGadgetId ? 'gadget' : `gadget${input.targetGadgetId}`;
    const localExports = this.ctx.exports as typeof this.ctx.exports & {BookOfflineCopyFacet: DurableObjectClass<BookOfflineCopyFacet>};
    const facet = this.ctx.facets.get(name, () => ({class: localExports.BookOfflineCopyFacet}));
    const tables = await facet.copy(input.tables);
    if (failPublication) {
      // The actual KV serializer rejects a function after preceding plan rows were written.
      plan.targetKv.push(['offline-copy-invalid-value', () => {}]);
      try {
        publishBookOfflineCopy(this.ctx, input, plan);
        throw new Error('The invalid publication unexpectedly succeeded');
      } catch (error) {
        if (this.ctx.storage.kv.get('version') !== 2) throw new Error('Publication did not roll back', {cause: error});
        return {published: false, error: String(error), tables};
      }
    }
    publishBookOfflineCopy(this.ctx, input, plan);
    return {published: true, tables};
  }
}

/** Offline importer has no public route and cannot authenticate or serve a user session. */
export default { fetch() { return new Response('Offline copy only', {status: 503}); } };
