
  import {DurableObject, RpcTarget, WorkerEntrypoint} from "cloudflare:workers";
  class Session extends RpcTarget {
    constructor(owner, queue) { super(); this.owner = owner; this.queue = queue.dup(); }
    [Symbol.dispose]() { this.queue[Symbol.dispose](); }
    async append(value) {
      const id = this.owner.enqueue(value);
      await this.queue.submitAction(id, {title: value, description: value,
        actionKind: {tag: "append", label: "Append"}, autoApprovable: true, implementsRevert: false});
      return id;
    }
  }
  export class LocalActionProvider extends DurableObject {
    constructor(ctx, env) {
      super(ctx, env);
      ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS operations (id INTEGER PRIMARY KEY, value TEXT, state TEXT)");
    }
    enqueue(value) {
      const id = this.ctx.storage.sql.exec("SELECT COALESCE(MAX(id) + 1, 0) AS next FROM operations").one().next;
      this.ctx.storage.sql.exec("INSERT INTO operations VALUES (?, ?, 'pending')", id, value);
      return id;
    }
    describe() { return {url: "https://local-action-provider.invalid", title: "Local append provider",
      snippet: "Persistent local action provider", suggestedBindingName: "QUEUE", tsType: "Queue"}; }
    getTypeScriptTypes() { return "interface Queue { append(value: string): Promise<number>; }"; }
    getAutoApprovableActions() { return [{tag: "append", label: "Append"}]; }
    startSession(queue) { return new Session(this, queue); }
    applyAction(id) { this.ctx.storage.sql.exec("UPDATE operations SET state = 'applied' WHERE id = ?", id); }
    rejectAction(id) { this.ctx.storage.sql.exec("UPDATE operations SET state = 'rejected' WHERE id = ?", id); }
    fetch() { return Response.json(this.ctx.storage.sql.exec("SELECT value, state FROM operations ORDER BY id").toArray()); }
  }
export default class ActionProviderService extends WorkerEntrypoint {
  getClass() { return this.ctx.exports.LocalActionProvider({props: {}}); }
}
