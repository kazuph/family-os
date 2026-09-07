import { DurableObject, RpcStub, RpcTarget, WorkerEntrypoint, restore } from "cloudflare:workers";

class FailingSubscriber extends RpcTarget {
  constructor() {
    super();
    this.entries = 0;
    this.readyCalled = false;
  }

  entry() {
    ++this.entries;
    throw new Error("entry failed");
  }

  ready() {
    this.readyCalled = true;
  }

  state() {
    return {entries: this.entries, readyCalled: this.readyCalled};
  }
}

export class HookCallback extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.storage.sql.exec(
        "CREATE TABLE IF NOT EXISTS callback_state (id INTEGER PRIMARY KEY, entries INTEGER)");
    ctx.storage.sql.exec(
        "INSERT OR IGNORE INTO callback_state (id, entries) VALUES (1, 0)");
  }

  entry() {
    this.ctx.storage.sql.exec("UPDATE callback_state SET entries = entries + 1 WHERE id = 1");
  }

  ready() {}

  state() {
    return {entries: this.ctx.storage.sql.exec(
        "SELECT entries FROM callback_state WHERE id = 1").one().entries};
  }

  reset() {
    this.ctx.storage.sql.exec("UPDATE callback_state SET entries = 0 WHERE id = 1");
  }
}

let current = {
  key: null,
  registered: false,
  enabled: false,
  deleted: false,
  target: null,
};

function snapshot() {
  return {...current};
}

export class LocalHookController extends WorkerEntrypoint {
  register(key) {
    current = {key, registered: true, enabled: false, deleted: false, target: null};
  }

  enable(_initiator, target) {
    if (!current.registered) throw new Error("Hook controller is not registered.");
    current.enabled = true;
    current.deleted = false;
    current.target = target;
  }

  disable() {
    if (!current.registered) throw new Error("Hook controller is not registered.");
    current.enabled = false;
  }

  deleteHook() {
    if (!current.registered) throw new Error("Hook controller is not registered.");
    current.enabled = false;
    current.deleted = true;
  }

  read() {
    return snapshot();
  }

  getFailingSubscriber() {
    return new FailingSubscriber();
  }

  getPersistentController() {
    return this.ctx.exports.LocalHookController({props: {}});
  }

  async getPersistentCallback() {
    await this.env.CALLBACK.get(this.env.CALLBACK.idFromName("persistent-callback")).reset();
    return this.ctx.restore({type: "hook-callback"});
  }

  [restore](params) {
    if (params.type !== "hook-callback") throw new Error("Unknown callback restore parameters.");
    return new RpcStub(new PersistentHookCallback(this.env.CALLBACK));
  }

  callbackState() {
    let namespace = this.env.CALLBACK;
    return namespace.get(namespace.idFromName("persistent-callback")).state();
  }

  fetch() {
    return Response.json(snapshot());
  }
}

class PersistentHookCallback extends RpcTarget {
  constructor(namespace) { super(); this.namespace = namespace; }
  entry() { return this.namespace.get(this.namespace.idFromName("persistent-callback")).entry(); }
  state() { return this.namespace.get(this.namespace.idFromName("persistent-callback")).state(); }
}

export default LocalHookController;
