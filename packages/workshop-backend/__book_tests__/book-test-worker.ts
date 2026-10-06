import { Gadget as BookGadget } from "../../bundled-blueprints/blueprints/workspace-book/files/server.js";
import { DurableObject, restore } from "cloudflare:workers";
import { OverseerDurableObject as RealOverseerDurableObject } from "../src/server.js";
import { copyBookSqliteTables } from '../scripts/book-offline-copy/apply';
export * from "../src/server.js";
export { default } from "../src/server.js";

/**
 * The pool stands a proxy class in front of every Durable Object (`createDurableObjectWrapper`) and
 * forwards only string-keyed methods to the instance it constructs, so when the runtime looks up
 * `[restore]` on the entrypoint -- which is what `ctx.restore()` does -- it finds nothing. The
 * wrapper's prototype chain does end at `DurableObject.prototype`, and it hands the instance the
 * very `ctx` it was given, so a `[restore]()` there can route by `ctx` to any instance that has
 * registered itself (below).
 */
const restoreTargets = new WeakMap<DurableObjectState, DurableObject>();
function bridgedRestore(this: DurableObject, params: unknown): unknown {
  const target = restoreTargets.get(this.ctx) as { [restore]?: (params: unknown) => unknown } | undefined;
  if (target?.[restore] === undefined || target[restore] === bridgedRestore) {
    throw new TypeError("This Durable Object does not implement a [restore]() method.");
  }
  return target[restore](params);
}
(DurableObject.prototype as unknown as Record<symbol, unknown>)[restore] = bridgedRestore;

/** The overseer, registered for the bridge above so tests can exercise `ctx.restore()`. */
export class OverseerDurableObject extends RealOverseerDurableObject {
  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    super(ctx, env);
    restoreTargets.set(ctx, this);
  }
}
// The pool discovers entrypoints from explicit exports, rather than following export-star.
export { UserDurableObject, AdminSettings, GatekeeperLoopback, GatekeeperHookLoopback,
  CodeModeTailLoopback, AgentSpawnerGatekeeper, GadgetTailLoopback, AgentSelfLoopback,
  PendingLogin, UserDirectoryDurableObject, ExternalMessageGateway, LanguageModelGatekeeper } from "../src/server.js";

/** Local-only SQLite transfer facet; never exported by the deployment entrypoint. */
export class BookOfflineCopyFacet extends BookGadget {
  inspectTables() {
    return Object.fromEntries(['book_files', 'progress', 'messages', 'settings'].map(name =>
      [name, [...this.ctx.storage.sql.exec('SELECT * FROM ' + name)]]));
  }
  copyTables(tables: Record<string, Record<string, string | number | null>[]>) {
    return copyBookSqliteTables(this.ctx.storage, tables);
  }
  async verifyCopyRefusal(tables: Record<string, Record<string, string | number | null>[]>) {
    try {
      await this.copyTables(tables);
      return {accepted: true, message: ''};
    } catch (error) {
      return {accepted: false, message: error instanceof Error ? error.message : String(error)};
    }
  }
}
