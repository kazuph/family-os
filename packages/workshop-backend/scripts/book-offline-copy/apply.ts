import type { BookOfflineCopyPlan, LegacyBookSnapshot } from './plan';
import { makeOverseerStorage } from '../../src/storage-schema/overseer-storage';

/** Copy the four book tables into a stopped destination facet, refusing conflicting retries. */
export function copyBookSqliteTables(
  storage: DurableObjectStorage,
  tables: LegacyBookSnapshot['tables'],
): LegacyBookSnapshot['tables'] {
  const names = ['book_files', 'progress', 'messages', 'settings'];
  const inspect = () => Object.fromEntries(names.map(name =>
    [name, [...storage.sql.exec<Record<string, string | number | null>>('SELECT * FROM ' + name)]]));
  storage.transactionSync(() => {
    const existing = inspect();
    if (Object.values(existing).some(rows => rows.length)) {
      if (JSON.stringify(existing) !== JSON.stringify(tables)) throw new Error('Destination SQLite differs; refusing overwrite');
      return;
    }
    for (const name of names) {
      const columns = [...storage.sql.exec('PRAGMA table_info(' + name + ')')].map(row => String(row.name));
      if (!tables[name]) throw new Error('Missing legacy book table');
      for (const row of tables[name]) {
        if (Object.keys(row).some(key => !columns.includes(key))) throw new Error('Unsupported legacy SQLite column');
        storage.sql.exec('INSERT INTO ' + name + ' (' + columns.join(',') + ') VALUES (' + columns.map(() => '?').join(',') + ')', ...columns.map(key => row[key]));
      }
    }
  });
  return inspect();
}

/** Publish checked book KV only after its independent SQLite copy has completed. */
export function publishBookOfflineCopy(
  ctx: DurableObjectState,
  original: LegacyBookSnapshot,
  plan: BookOfflineCopyPlan,
): void {
  if (plan.status === 'noop') return;
  if (ctx.id.toString() !== original.targetWorkspaceId) throw new Error('Book copy target workspace mismatch');
  const storage = ctx.storage;
  if (storage.kv.get('ownerId') !== original.ownerId || storage.kv.get('version') !== 2) {
    throw new Error('Destination changed before book copy publication');
  }
  storage.transactionSync(() => {
    for (const [key, value] of plan.targetKv) storage.kv.put(key, value);
    // Copying raw primary records cannot maintain secondary indexes. Rebuild only the
    // collections whose book/chat records this copy wrote; upstream rebuilds actions itself.
    const typed = makeOverseerStorage(storage);
    typed.gadgets.byBindingName.rebuild();
    typed.chatMeta.byLastActive.rebuild();
    typed.chats.byTimestamp.rebuild();
  });
}
