import { exports, RpcStub as NativeRpcStub } from "cloudflare:workers";
import { runInDurableObject } from "cloudflare:test";
import type ActionProviderService from "./local-action-provider.js";
import { newWebSocketRpcSession, RpcTarget, RpcStub } from "capnweb";
import type { PublicApi, AuthenticatedApi, CodeSubscriber, CodeUpdate, WorkpieceId } from "@gadgets/workshop-shared/api";
import { unwrapFamilyRpcResult } from "@gadgets/workshop-shared/api";
import { expect, it } from "vitest";
import * as Y from "yjs";
import { FAMILY_ACCESS_ADULT, FAMILY_ACCESS_API_URL, signFamilyAccessJwt } from "./family-access-jwt.js";

class ScopedCodeCollector extends RpcTarget implements CodeSubscriber {
  updates: CodeUpdate[] = [];
  disposeCount = 0;
  #resolveDisposed!: () => void;
  readonly disposed = new Promise<void>(resolve => { this.#resolveDisposed = resolve; });
  [Symbol.dispose](): void { this.disposeCount++; this.#resolveDisposed(); }
  #resolveReady!: () => void;
  readonly initialized = new Promise<void>(resolve => { this.#resolveReady = resolve; });
  update(value: CodeUpdate): void { this.updates.push(value); }
  ready(): void { this.#resolveReady(); }
}

async function rejection(value: PromiseLike<unknown>): Promise<Error> {
  try {
    await value;
  } catch (error) {
    if (!(error instanceof Error)) throw new TypeError("Expected an RPC Error.", {cause: error});
    return error;
  }
  throw new Error("Expected RPC rejection.");
}

async function withAuthenticatedApi(run: (api: RpcStub<AuthenticatedApi>, disconnected: Promise<void>) => Promise<void>): Promise<void> {
  const response = await exports.default.fetch(new Request(FAMILY_ACCESS_API_URL, {
    headers: {
      Upgrade: "websocket",
      Origin: "https://workshop.invalid",
      Cookie: "CF_Authorization=login-1200",
      "cf-access-jwt-assertion": await signFamilyAccessJwt(1200),
    },
  }));
  expect(response.status).toBe(101);
  if (!response.webSocket) throw new Error("Expected authenticated WebSocket.");
  response.webSocket.accept();
  using api = newWebSocketRpcSession<PublicApi>(response.webSocket);
  let resolveDisconnected!: () => void;
  const disconnected = new Promise<void>(resolve => { resolveDisconnected = resolve; });
  api.onRpcBroken(() => resolveDisconnected());
  using family = await api.authenticateFromCfAccess();
  family.onRpcBroken(() => {});
  unwrapFamilyRpcResult(await family.selectAdultProfile());
  using authenticated = unwrapFamilyRpcResult(await family.getAuthenticatedApi());
  authenticated.onRpcBroken(() => {});
  if (!(await authenticated.isOnboardingCompleted())) {
    await authenticated.setOwnDisplayName("Move boundary verification");
    await authenticated.completeOnboarding();
  }
  await run(authenticated, disconnected);
}

it("a moved gadget's code capability neither discloses nor modifies another source gadget", async () => {
  let sourceId!: string;
  let targetId!: string;
  let movedId!: WorkpieceId;
  let privateId!: WorkpieceId;
  let movingRoot!: string;
  let privateRoot!: string;
  const initial = new Y.Doc();
  const privateCode = 'export const sourceSecret = "source-private-code-must-not-cross-host-boundary";';
  await withAuthenticatedApi(async (authenticated, disconnected) => {
    using source = await authenticated.newGadget();
    using target = await authenticated.newGadget();
    using moving = await source.createGadget("Movable", undefined, "MOVABLE");
    using privateGadget = await source.createGadget("Source only", undefined, "SOURCE_ONLY");
    movingRoot = String(await moving.getId());
    privateId = await privateGadget.getId();
    privateRoot = String(privateId);
    initial.getMap<Y.Text>(movingRoot).set("client.js", new Y.Text('export const movable = true;'));
    initial.getMap<Y.Text>(privateRoot).set("client.js", new Y.Text(privateCode));
    await source.updateCode(Y.encodeStateAsUpdateV2(initial));

    sourceId = (await source.getMetadata()).id;
    targetId = (await target.getMetadata()).id;
    movedId = (await moving.moveToWorkspace(targetId)).gadgetId;
    await disconnected;
  });
  await withAuthenticatedApi(async authenticated => {
    using source = await authenticated.openGadget(sourceId);
    using target = await authenticated.openGadget(targetId);
    using privateGadget = await source.getGadget(privateId);
    using moved = await target.getGadget(movedId);
    const collector = new ScopedCodeCollector();
    using _subscription = await moved.subscribeToCode(collector);
    await collector.initialized;
    const view = new Y.Doc();
    let decodedStrings = "";
    for (const { update } of collector.updates) {
      Y.applyUpdateV2(view, update);
      for (const struct of Y.decodeUpdateV2(update).structs) {
        if ("content" in struct) {
          decodedStrings += struct.content.getContent().filter(value => typeof value === "string").join("");
        }
      }
    }
    expect(view.getMap<Y.Text>(movingRoot).get("client.js")?.toString()).toBe('export const movable = true;');
    expect([...view.share.keys()]).not.toContain(privateRoot);
    expect(decodedStrings).not.toContain("source-private-code-must-not-cross-host-boundary");

    const nativeSource = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(sourceId));
    const ownerId = exports.UserDurableObject.idFromName(FAMILY_ACCESS_ADULT.email).toString();
    // Assert rejection inside the real host instance: workers-sdk#14736 duplicates handled
    // negative RPC results in this test pool. Public proxy reads/subscriptions remain above.
    const rejectHostUpdate = (update: Uint8Array) => runInDurableObject(nativeSource, async instance => {
      const status = await instance.getGadgetMoveStatus(Number(movingRoot), ownerId);
      if (!status.token) throw new Error("Expected an active host lease.");
      const host = await instance.getMovedGadgetHost(Number(movingRoot), targetId, movedId, status.token, ownerId);
      expect((await rejection(host.updateCode(update))).message)
        .toBe("Code update is outside this gadget's code root.");
    });
    const malicious = new Y.Doc();
    malicious.getMap<Y.Text>(privateRoot).set("client.js", new Y.Text('export const overwritten = true;'));
    await rejectHostUpdate(Y.encodeStateAsUpdateV2(malicious));
    await expect(privateGadget.getUiBundle()).resolves.toMatchObject({ jsCode: privateCode });

    // Deletions refer to existing struct IDs rather than a named root; these must be scoped too.
    const deletions: Uint8Array[] = [];
    initial.on("updateV2", update => deletions.push(update));
    initial.getMap<Y.Text>(privateRoot).get("client.js")!.delete(0, privateCode.length);
    await rejectHostUpdate(Y.mergeUpdatesV2(deletions));
    await expect(privateGadget.getUiBundle()).resolves.toMatchObject({ jsCode: privateCode });
    _subscription[Symbol.dispose]();
    await collector.disposed;
    expect(collector.disposeCount).toBe(1);
  });
});

it("preserves live SQLite state across move and source deletion, then stops the host on target deletion", async () => {
  let sourceId!: string;
  let targetId!: string;
  let movedId!: WorkpieceId;
  await withAuthenticatedApi(async (authenticated, disconnected) => {
    using source = await authenticated.newGadget();
    using target = await authenticated.newGadget();
    using gadget = await source.createGadget("Persistent move counter", undefined, "COUNTER");
    const gadgetId = await gadget.getId();
    sourceId = (await source.getMetadata()).id;
    targetId = (await target.getMetadata()).id;
    const doc = new Y.Doc();
    doc.getMap<Y.Text>(String(gadgetId)).set("server.js", new Y.Text(`
      import { DurableObject } from "cloudflare:workers";
      export class Gadget extends DurableObject {
        constructor(ctx, env) {
          super(ctx, env);
          ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS counter (value INTEGER NOT NULL)");
          if (ctx.storage.sql.exec("SELECT value FROM counter").toArray().length === 0) {
            ctx.storage.sql.exec("INSERT INTO counter VALUES (0)");
          }
        }
        increment() {
          this.ctx.storage.sql.exec("UPDATE counter SET value = value + 1");
          return this.ctx.storage.sql.exec("SELECT value FROM counter").one().value;
        }
      }
    `));
    await gadget.updateCode(Y.encodeStateAsUpdateV2(doc));
    using initialFacet = await gadget.connectToGadget();
    initialFacet.onRpcBroken(() => {});
    expect(await initialFacet.increment()).toBe(1);

    const nativeSource = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(sourceId));
    const ownerId = exports.UserDurableObject.idFromName(FAMILY_ACCESS_ADULT.email).toString();
    await nativeSource.beginGadgetMove(gadgetId, targetId, ownerId);
    await runInDurableObject(nativeSource, async instance => {
      using ownerSession = new RpcStub(await instance.open(
        ownerId, FAMILY_ACCESS_ADULT.email, new NativeRpcStub(() => {})));
      expect((await rejection(ownerSession.deleteSelf())).message).toMatch(/mov/i);
    });

    movedId = (await gadget.moveToWorkspace(targetId)).gadgetId;
    await disconnected;
  });
  await withAuthenticatedApi(async (authenticated, disconnected) => {
    using source = await authenticated.openGadget(sourceId);
    using target = await authenticated.openGadget(targetId);
    using moved = await target.getGadget(movedId);
    using movedFacet = await moved.connectToGadget();
    movedFacet.onRpcBroken(() => {});
    expect(await movedFacet.increment()).toBe(2);
    const nativeSource = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(sourceId));
    await runInDurableObject(nativeSource, async (_instance, state) => {
      await state.storage.setAlarm(new Date("2030-01-01T00:00:00Z"));
      expect(await state.storage.getAlarm()).not.toBeNull();
    });
    await source.deleteSelf();
    await disconnected;
    const restartedSource = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(sourceId));
    await runInDurableObject(restartedSource, async (_instance, state) => {
      expect(await state.storage.getAlarm()).toBeNull();
    });
  });
  await withAuthenticatedApi(async (authenticated, disconnected) => {
    using target = await authenticated.openGadget(targetId);
    using moved = await target.getGadget(movedId);
    expect((await authenticated.listGadgets()).some(workspace => workspace.id === sourceId)).toBe(false);
    using retainedFacet = await moved.connectToGadget();
    const hostStopped = new Promise<unknown>(resolve => retainedFacet.onRpcBroken(resolve));
    expect(await retainedFacet.increment()).toBe(3);

    await target.deleteSelf();
    expect(await hostStopped).toBeInstanceOf(Error);
    await disconnected;
  });
  await withAuthenticatedApi(async authenticated => {
    expect((await authenticated.listGadgets()).some(workspace => workspace.id === targetId)).toBe(false);
  });
});


it("keeps two moved host roots and a target-local root in independent agent documents", async () => {
  const original = new Y.Doc({gc: false});
  let sourceId!: string;
  let targetId!: string;
  const sourceIds: WorkpieceId[] = [];
  const targetIds: WorkpieceId[] = [];
  let localId!: WorkpieceId;
  let chatId!: number;
  await withAuthenticatedApi(async authenticated => {
    using source = await authenticated.newGadget();
    using target = await authenticated.newGadget();
    sourceId = (await source.getMetadata()).id;
    targetId = (await target.getMetadata()).id;
    for (const name of ["First", "Second"]) {
      using gadget = await source.createGadget(name, undefined, name.toUpperCase());
      const id = await gadget.getId();
      sourceIds.push(id);
      original.getMap<Y.Text>(String(id)).set("client.js", new Y.Text(`export const value = "${name}";`));
    }
    await source.updateCode(Y.encodeStateAsUpdateV2(original));
    using local = await target.createGadget("Local", undefined, "LOCAL");
    localId = await local.getId();
    const localDoc = new Y.Doc();
    localDoc.getMap<Y.Text>(String(localId)).set("client.js", new Y.Text('export const local = "untouched";'));
    await target.updateCode(Y.encodeStateAsUpdateV2(localDoc));
    chatId = await target.newChat("Agent code isolation verification", null);
  });
  for (const id of sourceIds) {
    await withAuthenticatedApi(async (authenticated, disconnected) => {
      using source = await authenticated.openGadget(sourceId);
      using gadget = await source.getGadget(id);
      targetIds.push((await gadget.moveToWorkspace(targetId)).gadgetId);
      await disconnected;
    });
  }
  const targetNative = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(targetId));
  await runInDurableObject(targetNative, async instance => {
    const hooks = instance["impl"];
    await hooks.prepareAgentCode(chatId);
    const infos = hooks.listGadgetInfo(chatId);
    const first = hooks.buildAgentGadgetDoc(chatId, targetIds[0]);
    const second = hooks.buildAgentGadgetDoc(chatId, targetIds[1]);
    const local = hooks.buildYDoc("current").ydoc;
    try {
      const firstRoot = infos.find(info => info.id === targetIds[0])!.rootName;
      const secondRoot = infos.find(info => info.id === targetIds[1])!.rootName;
      expect(first.getMap<Y.Text>(firstRoot).get("client.js")!.toString()).toContain('"First"');
      expect(second.getMap<Y.Text>(secondRoot).get("client.js")!.toString()).toContain('"Second"');
      expect(local.getMap<Y.Text>(String(localId)).get("client.js")!.toString()).toContain('"untouched"');
      const update = new Promise<Uint8Array>(resolve => first.once("updateV2", resolve));
      const text = first.getMap<Y.Text>(firstRoot).get("client.js")!;
      first.transact(() => { text.delete(0, text.length); text.insert(0, 'export const value = "Edited";'); });
      const change = await update;
      expect(Y.decodeUpdateV2(change).ds.clients.size).toBeGreaterThan(0);
      await hooks.withMovedGadgetHost(targetIds[0], host => host.applyMovedGadgetCode(change));
      const addedFile = new Promise<Uint8Array>(resolve => first.once("updateV2", resolve));
      first.getMap<Y.Text>(firstRoot).set("new-private-module.js", new Y.Text('export const movedOnly = true;'));
      const addedUpdate = await addedFile;
      hooks.addChatMessages(chatId, {type: "user", id: "verification", name: "Verification"}, [{
        type: "changes", update: addedUpdate, gadgetIds: [targetIds[0]],
      }]);
      expect(hooks.getProposedGadgetCodeUpdate(chatId, targetIds[0])).toBeDefined();
      expect(hooks.getProposedGadgetCodeUpdate(chatId, localId)).toBeUndefined();
      expect(hooks.getProposedGadgetCodeUpdate(chatId, targetIds[1])).toBeUndefined();
      expect(second.getMap<Y.Text>(secondRoot).get("client.js")!.toString()).toContain('"Second"');
    } finally { first.destroy(); second.destroy(); local.destroy(); }
  });
  await withAuthenticatedApi(async authenticated => {
    using target = await authenticated.openGadget(targetId);
    using first = await target.getGadget(targetIds[0]);
    using second = await target.getGadget(targetIds[1]);
    using local = await target.getGadget(localId);
    expect((await first.getUiBundle()).jsCode).toBe('export const value = "Edited";');
    expect((await second.getUiBundle()).jsCode).toBe('export const value = "Second";');
    expect((await local.getUiBundle()).jsCode).toBe('export const local = "untouched";');
  });
});


it("deleting a workspace that both hosts and receives moved gadgets removes only its incoming host", async () => {
  const workspaceIds: string[] = [];
  let incomingSourceId!: WorkpieceId;
  let outgoingSourceId!: WorkpieceId;
  let outgoingTargetId!: WorkpieceId;
  await withAuthenticatedApi(async (api, disconnected) => {
    using first = await api.newGadget();
    using middle = await api.newGadget();
    using last = await api.newGadget();
    for (const workspace of [first, middle, last]) {
      workspaceIds.push((await workspace.getMetadata()).id);
    }
    using incoming = await first.createGadget("Incoming", undefined, "INCOMING");
    incomingSourceId = await incoming.getId();
    using outgoing = await middle.createGadget("Outgoing", undefined, "OUTGOING");
    outgoingSourceId = await outgoing.getId();
    const doc = new Y.Doc();
    doc.getMap<Y.Text>(String(outgoingSourceId)).set("client.js", new Y.Text("export const retained = true;"));
    await outgoing.updateCode(Y.encodeStateAsUpdateV2(doc));
    await incoming.moveToWorkspace(workspaceIds[1]);
    await disconnected;
  });
  await withAuthenticatedApi(async (api, disconnected) => {
    using middle = await api.openGadget(workspaceIds[1]);
    using outgoing = await middle.getGadget(outgoingSourceId);
    outgoingTargetId = (await outgoing.moveToWorkspace(workspaceIds[2])).gadgetId;
    await disconnected;
  });
  await withAuthenticatedApi(async (api, disconnected) => {
    using middle = await api.openGadget(workspaceIds[1]);
    await middle.deleteSelf();
    await disconnected;
  });
  await withAuthenticatedApi(async api => {
    using last = await api.openGadget(workspaceIds[2]);
    using outgoing = await last.getGadget(outgoingTargetId);
    expect(await outgoing.getUiBundle()).toMatchObject({jsCode: "export const retained = true;"});
    expect((await api.listGadgets()).some(workspace => workspace.id === workspaceIds[1])).toBe(false);
    const first = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(workspaceIds[0]));
    await runInDurableObject(first, instance => {
      expect(instance["impl"].storage.gadgets.get(incomingSourceId)).toBeUndefined();
    });
  });
});


it("runs and exports moved server drafts without accepting them, preserving SQLite on revert and accept", async () => {
  let targetId!: string;
  let movedId!: WorkpieceId;
  let hostId!: WorkpieceId;
  const base = new Y.Doc({gc: false});
  const server = `
    import {DurableObject, WorkerEntrypoint} from "cloudflare:workers";
    export class Gadget extends DurableObject {
      version() { return "BASE"; }
      increment() {
        this.ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS counter (n INTEGER NOT NULL)");
        if (this.ctx.storage.sql.exec("SELECT n FROM counter").toArray().length === 0)
          this.ctx.storage.sql.exec("INSERT INTO counter VALUES (0)");
        this.ctx.storage.sql.exec("UPDATE counter SET n = n + 1");
        return this.ctx.storage.sql.exec("SELECT n FROM counter").one().n;
      }
    }
    export class ExportHandler extends WorkerEntrypoint {
      async getExportFormats(gadget) {
        return [{id: "text", label: await gadget.version(), mode: "server",
          contentType: "text/plain", fileExtension: ".txt"}];
      }
      async export(gadget) { return new Response(await gadget.version()).body; }
    }
  `;
  await withAuthenticatedApi(async (api, disconnected) => {
    using source = await api.newGadget();
    using target = await api.newGadget();
    targetId = (await target.getMetadata()).id;
    using gadget = await source.createGadget("Server preview", undefined, "PREVIEW");
    hostId = await gadget.getId();
    base.getMap<Y.Text>(String(hostId)).set("server.js", new Y.Text(server));
    await gadget.updateCode(Y.encodeStateAsUpdateV2(base));
    movedId = (await gadget.moveToWorkspace(targetId)).gadgetId;
    await disconnected;
  });
  await withAuthenticatedApi(async api => {
    using target = await api.openGadget(targetId);
    using gadget = await target.getGadget(movedId);
    const chatId = await target.newChat("Preview edits", null);
    const edit = (version: string) => {
      const doc = new Y.Doc({gc: false});
      Y.applyUpdateV2(doc, Y.encodeStateAsUpdateV2(base));
      const updates: Uint8Array[] = [];
      doc.on("updateV2", update => updates.push(update));
      doc.getMap<Y.Text>(String(hostId)).set("server.js", new Y.Text(server.replace('"BASE"', JSON.stringify(version))));
      return Y.mergeUpdatesV2(updates);
    };
    using canonical = await gadget.connectToGadget();
    canonical.onRpcBroken(() => {});
    expect(await canonical.version()).toBe("BASE");
    expect(await canonical.increment()).toBe(1);
    await gadget.updateCode(edit("DRAFT"), chatId);
    using preview = await gadget.connectToGadget(chatId);
    preview.onRpcBroken(() => {});
    expect(await preview.version()).toBe("DRAFT");
    expect(await preview.increment()).toBe(2);
    expect(await gadget.getExportFormats(chatId)).toMatchObject([{id: "text", label: "DRAFT"}]);
    expect(await new Response(await gadget.export("text", chatId)).text()).toBe("DRAFT");
    using original = await gadget.connectToGadget();
    original.onRpcBroken(() => {});
    expect(await original.version()).toBe("BASE");
    expect(await original.increment()).toBe(3);
    await target.revertChanges(chatId, 0);
    using reverted = await gadget.connectToGadget(chatId);
    reverted.onRpcBroken(() => {});
    expect(await reverted.version()).toBe("BASE");
    await gadget.updateCode(edit("ACCEPTED"), chatId);
    await target.mergeChanges(chatId, null, {includeDraft: true});
    using accepted = await gadget.connectToGadget();
    accepted.onRpcBroken(() => {});
    expect(await accepted.version()).toBe("ACCEPTED");
    expect(await accepted.increment()).toBe(4);
    expect(await new Response(await gadget.export("text")).text()).toBe("ACCEPTED");
  });
});



it("approves and rejects real moved provider actions without exposing a shared connection's private actions", async () => {
  let sourceId!: string;
  let targetId!: string;
  let privateId!: WorkpieceId;
  let gatekeeperId!: WorkpieceId;
  let sourceGadgetId!: WorkpieceId;
  await withAuthenticatedApi(async (api, disconnected) => {
    using source = await api.newGadget();
    using target = await api.newGadget();
    sourceId = (await source.getMetadata()).id;
    targetId = (await target.getMetadata()).id;
    using moving = await source.createGadget("Approval target", undefined, "MOVING");
    using privateGadget = await source.createGadget("Private caller", undefined, "PRIVATE");
    sourceGadgetId = await moving.getId();
    privateId = await privateGadget.getId();
    const native = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(sourceId));
    gatekeeperId = await runInDurableObject(native, async instance => {
      const impl = instance["impl"];
      const provider = (impl.env as Cloudflare.Env & {
        LOCAL_ACTION_PROVIDER: Service<ActionProviderService>;
      }).LOCAL_ACTION_PROVIDER;
      const connection = await impl.addGatekeeper(await provider.getClass());
      return connection.getId();
    });
    await moving.bind("QUEUE", gatekeeperId);
    await privateGadget.bind("QUEUE", gatekeeperId);
    const doc = new Y.Doc();
    for (const id of [sourceGadgetId, privateId]) {
      doc.getMap<Y.Text>(String(id)).set("server.js", new Y.Text(`
        import {DurableObject} from "cloudflare:workers";
        export class Gadget extends DurableObject {
          append(value) { return this.env.QUEUE.append(value); }
        }
      `));
    }
    await source.updateCode(Y.encodeStateAsUpdateV2(doc));
    await moving.moveToWorkspace(targetId);
    await disconnected;
  });
  await withAuthenticatedApi(async api => {
    using source = await api.openGadget(sourceId);
    using target = await api.openGadget(targetId);
    const sourceHost = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(sourceId));
    // This is the native entrypoint the gadget binding loopback invokes. The test pool rejects
    // that loopback's Proxy prototype; exercise its real session and provider without replacing it.
    using movedSession = await sourceHost.startGatekeeperSession(
        {type: "gatekeeper", id: gatekeeperId}, {from: "gadget", gadgetId: sourceGadgetId});
    using privateSession = await sourceHost.startGatekeeperSession(
        {type: "gatekeeper", id: gatekeeperId}, {from: "gadget", gadgetId: privateId});
    await movedSession.append("approve moved");
    await movedSession.append("reject moved");
    await privateSession.append("private pending");
    const page = await target.listActions({filter: "pending"});
    expect(page.entries.map(entry => entry.description.title).toSorted()).toEqual(["approve moved", "reject moved"]);
    const approved = page.entries.find(entry => entry.description.title === "approve moved")!;
    const rejected = page.entries.find(entry => entry.description.title === "reject moved")!;
    const sourceNative = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(sourceId));
    const ownerId = exports.UserDurableObject.idFromName(FAMILY_ACCESS_ADULT.email).toString();
    await runInDurableObject(sourceNative, async instance => {
      using sourceClient = new RpcStub(await instance.open(
          ownerId, FAMILY_ACCESS_ADULT.email, new NativeRpcStub(() => {})));
      expect((await rejection(sourceClient.approveAction(approved.id))).message)
        .toBe(`No such action: ${approved.id}`);
      expect((await rejection(sourceClient.rejectAction(rejected.id))).message)
        .toBe(`No such action: ${rejected.id}`);
    });
    await target.approveAction({sourceWorkspaceId: sourceId, actionId: approved.id});
    await target.rejectAction({sourceWorkspaceId: sourceId, actionId: rejected.id});
    expect((await target.listActions({filter: "pending"})).entries).toEqual([]);
    expect((await source.listActions({filter: "pending"})).entries.map(entry => entry.description.title))
        .toEqual(["private pending"]);
    const native = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(sourceId));
    await runInDurableObject(native, async instance => {
      const provider = instance["impl"].getGatekeeperFacet(gatekeeperId);
      expect(await (await provider.fetch("https://local-action-provider.invalid/state")).json()).toEqual([
        {value: "approve moved", state: "applied"},
        {value: "reject moved", state: "rejected"},
        {value: "private pending", state: "pending"},
      ]);
    });
  });
});


it.each([false, true])("keeps moved auto-approval separate from a shared source connection (existing rule: %s)", async existingRule => {
  let sourceId!: string;
  let targetId!: string;
  let sourceGadgetId!: WorkpieceId;
  let targetGadgetId!: WorkpieceId;
  let privateId!: WorkpieceId;
  let gatekeeperId!: WorkpieceId;
  await withAuthenticatedApi(async (api, disconnected) => {
    using source = await api.newGadget();
    using target = await api.newGadget();
    sourceId = (await source.getMetadata()).id;
    targetId = (await target.getMetadata()).id;
    using moving = await source.createGadget("Auto-approval target", undefined, "MOVING");
    using privateGadget = await source.createGadget("Private caller", undefined, "PRIVATE");
    sourceGadgetId = await moving.getId();
    privateId = await privateGadget.getId();
    const native = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(sourceId));
    gatekeeperId = await runInDurableObject(native, async instance => {
      const impl = instance["impl"];
      const provider = (impl.env as Cloudflare.Env & {
        LOCAL_ACTION_PROVIDER: Service<ActionProviderService>;
      }).LOCAL_ACTION_PROVIDER;
      const connection = await impl.addGatekeeper(await provider.getClass());
      return connection.getId();
    });
    await moving.bind("QUEUE", gatekeeperId);
    await privateGadget.bind("QUEUE", gatekeeperId);
    if (existingRule) await source.setAutoApprovedActionKind(gatekeeperId, {tag: "append", label: "Append"});
    targetGadgetId = (await moving.moveToWorkspace(targetId)).gadgetId;
    await disconnected;
  });
  await withAuthenticatedApi(async api => {
    using source = await api.openGadget(sourceId);
    using target = await api.openGadget(targetId);
    const native = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(sourceId));
    const initial = await target.listAutoApprovedActionKinds();
    expect(initial.some(rule => rule.gatekeeperId === gatekeeperId && rule.sourceWorkspaceId === sourceId))
        .toBe(existingRule);
    using movedSession = await native.startGatekeeperSession(
        {type: "gatekeeper", id: gatekeeperId}, {from: "gadget", gadgetId: sourceGadgetId});
    using privateSession = await native.startGatekeeperSession(
        {type: "gatekeeper", id: gatekeeperId}, {from: "gadget", gadgetId: privateId});
    await target.setAutoApprovedActionKind(gatekeeperId, {tag: "append", label: "Append"}, sourceId);
    await movedSession.append("moved enabled");
    await privateSession.append("private unaffected");
    const states = () => runInDurableObject(native, async instance => {
      const provider = instance["impl"].getGatekeeperFacet(gatekeeperId);
      return (await provider.fetch("https://local-action-provider.invalid/state")).json();
    });
    await expect.poll(states).toEqual([
      {value: "moved enabled", state: "applied"},
      {value: "private unaffected", state: existingRule ? "applied" : "pending"},
    ]);
    if (!existingRule) {
      const pending = await source.listActions({filter: "pending"});
      expect(pending.entries.map(entry => entry.description.title)).toEqual(["private unaffected"]);
      await source.rejectAction(pending.entries[0].id);
    }
    await target.removeAutoApprovedActionKind(gatekeeperId, "append", sourceId);
    expect(await target.listAutoApprovedActionKinds()).toEqual([]);
    expect((await target.listPreApprovableActions()).find(action =>
      action.gatekeeperId === gatekeeperId && action.actionKind.tag === "append")?.alreadyEnabled).toBe(false);
    await privateSession.append("private after target disable");
    await movedSession.append("moved disabled");
    await expect.poll(states).toEqual([
      {value: "moved enabled", state: "applied"},
      {value: "private unaffected", state: existingRule ? "applied" : "rejected"},
      {value: "private after target disable", state: existingRule ? "applied" : "pending"},
      {value: "moved disabled", state: "pending"},
    ]);
    expect((await target.listAutoApprovedActionKinds()).filter(rule => rule.gatekeeperId === gatekeeperId))
        .toEqual([]);
    expect((await source.listAutoApprovedActionKinds()).some(rule => rule.gatekeeperId === gatekeeperId))
        .toBe(existingRule);
    expect((await target.listActions({filter: "pending"})).entries.map(entry => entry.description.title))
        .toEqual(["moved disabled"]);
  });
  await withAuthenticatedApi(async (api, disconnected) => {
    using source = await api.openGadget(sourceId);
    using target = await api.openGadget(targetId);
    await target.setAutoApprovedActionKind(gatekeeperId, {tag: "append", label: "Append"}, sourceId);
    await source.deleteSelf();
    await disconnected;
  });
  await withAuthenticatedApi(async api => {
    expect((await api.listGadgets()).some(workspace => workspace.id === sourceId)).toBe(false);
    using target = await api.openGadget(targetId);
    expect((await target.listAutoApprovedActionKinds()).some(rule =>
        rule.gatekeeperId === gatekeeperId && rule.sourceWorkspaceId === sourceId)).toBe(true);
    const native = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(sourceId));
    using session = await native.startGatekeeperSession(
        {type: "gatekeeper", id: gatekeeperId}, {from: "gadget", gadgetId: sourceGadgetId});
    await session.append("moved after source deletion");
    await expect.poll(() => runInDurableObject(native, async instance => {
      const response = await instance["impl"].getGatekeeperFacet(gatekeeperId)
          .fetch("https://local-action-provider.invalid/state");
      const rows = await response.json<{value: string; state: string}[]>();
      return rows.filter(row => row.value.startsWith("moved"));
    })).toEqual([
      {value: "moved enabled", state: "applied"},
      {value: "moved disabled", state: "applied"},
      {value: "moved after source deletion", state: "applied"},
    ]);
    using moved = await target.getGadget(targetGadgetId);
    using connection = await moved.getGatekeeperById(gatekeeperId);
    await connection.remove();
    expect(await target.listAutoApprovedActionKinds()).toEqual([]);
    expect((await target.listPreApprovableActions()).some(action => action.gatekeeperId === gatekeeperId)).toBe(false);
  });
});


it("compacts independent moved manual drafts without mixing same-named roots on accept or revert", async () => {
  const sources: {workspaceId: string; gadgetId: WorkpieceId}[] = [];
  const movedIds: WorkpieceId[] = [];
  let targetId!: string;
  let localId!: WorkpieceId;
  const names = ["FIRST", "SECOND"];
  await withAuthenticatedApi(async api => {
    using target = await api.newGadget();
    targetId = (await target.getMetadata()).id;
    using local = await target.createGadget("Local", undefined, "LOCAL");
    localId = await local.getId();
    const localDoc = new Y.Doc();
    localDoc.getMap<Y.Text>(String(localId)).set("client.js", new Y.Text('export const value = "LOCAL";'));
    await local.updateCode(Y.encodeStateAsUpdateV2(localDoc));
    for (const name of names) {
      using source = await api.newGadget();
      using gadget = await source.createGadget(name, undefined, name);
      const gadgetId = await gadget.getId();
      const doc = new Y.Doc();
      doc.getMap<Y.Text>(String(gadgetId)).set("client.js", new Y.Text(`export const value = "${name}";`));
      await gadget.updateCode(Y.encodeStateAsUpdateV2(doc));
      sources.push({workspaceId: (await source.getMetadata()).id, gadgetId});
    }
  });
  expect(sources[0].gadgetId).toBe(sources[1].gadgetId);
  for (const source of sources) {
    await withAuthenticatedApi(async (api, disconnected) => {
      using workspace = await api.openGadget(source.workspaceId);
      using gadget = await workspace.getGadget(source.gadgetId);
      movedIds.push((await gadget.moveToWorkspace(targetId)).gadgetId);
      await disconnected;
    });
  }
  await withAuthenticatedApi(async api => {
    using target = await api.openGadget(targetId);
    using first = await target.getGadget(movedIds[0]);
    using second = await target.getGadget(movedIds[1]);
    using local = await target.getGadget(localId);
    const gadgets = [first, second];
    const docs: Y.Doc[] = [];
    for (const gadget of gadgets) {
      const collector = new ScopedCodeCollector();
      using _subscription = await gadget.subscribeToCode(collector);
      await collector.initialized;
      const doc = new Y.Doc();
      for (const {update} of collector.updates) Y.applyUpdateV2(doc, update);
      docs.push(doc);
    }
    const chatId = await target.newChat("Independent manual drafts", null);
    let canonical = names.map(name => `export const value = "${name}";`);
    // Existing CHAT_DRAFT_COMPACT_THRESHOLD in overseer.ts; reach the real persistence boundary.
    const compactThreshold = 128;
    const native = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(targetId));
    for (const accept of [true, false]) {
      const previousSequence = Math.max(-1, ...(await target.getChatHistory(chatId)).messages.map(message => message.sequence));
      const expected = [...canonical];
      for (let index = 0; index < compactThreshold; index++) {
        const selected = index % gadgets.length;
        const doc = docs[selected];
        const text = doc.getMap<Y.Text>(String(sources[selected].gadgetId)).get("client.js")!;
        expected[selected] = `export const value = "${names[selected]}-${accept ? "accept" : "revert"}-${index}";`;
        const update = new Promise<Uint8Array>(resolve => doc.once("updateV2", resolve));
        doc.transact(() => { text.delete(0, text.length); text.insert(0, expected[selected]); });
        await gadgets[selected].updateCode(await update, chatId);
      }
      await runInDurableObject(native, instance => {
        const updates = instance["impl"].listChatDraftUpdates(chatId);
        expect(updates).toHaveLength(gadgets.length);
        expect(updates.map(update => update.gadgetIds)).toEqual(movedIds.map(id => [id]));
      });
      await target.finalizeChatDraft(chatId);
      const changes = (await target.getChatHistory(chatId)).messages
          .filter(message => message.type === "changes" && message.sequence > previousSequence);
      expect(changes).toHaveLength(gadgets.length);
      expect(changes.map(message => message.type === "changes" ? message.gadgetIds : undefined))
          .toEqual(movedIds.map(id => [id]));
      for (let index = 0; index < gadgets.length; index++) {
        expect((await gadgets[index].getUiBundle()).jsCode).toBe(canonical[index]);
        expect((await gadgets[index].getUiBundle(chatId)).jsCode).toBe(expected[index]);
      }
      expect((await local.getUiBundle(chatId)).jsCode).toBe('export const value = "LOCAL";');
      if (accept) {
        await target.mergeChanges(chatId, changes.at(-1)!.sequence, {includeDraft: true});
        canonical = expected;
      } else {
        await target.revertChanges(chatId, changes[0].sequence);
      }
      for (let index = 0; index < gadgets.length; index++) {
        expect((await gadgets[index].getUiBundle()).jsCode).toBe(canonical[index]);
        expect((await gadgets[index].getUiBundle(chatId)).jsCode).toBe(canonical[index]);
      }
      expect((await local.getUiBundle()).jsCode).toBe('export const value = "LOCAL";');
    }
    for (const doc of docs) doc.destroy();
  });
});

it("retains unbound gadget connections on source retirement and destroys removed connections", async () => {
  let sourceId!: string, targetId!: string;
  let movedId!: WorkpieceId, connectionId!: WorkpieceId;
  await withAuthenticatedApi(async (api, disconnected) => {
    using source = await api.newGadget();
    using target = await api.newGadget();
    sourceId = (await source.getMetadata()).id;
    targetId = (await target.getMetadata()).id;
    using _existingTarget = await target.createGadget("Existing target", undefined, "EXISTING");
    using gadget = await source.createGadget("Connection retention", undefined, "CONNECTIONS");
    using connection = await gadget.newAgentSpawnerGatekeeper({displayName: "Retained connection", modelId: null, env: {}});
    connectionId = await connection.getId();
    movedId = (await gadget.moveToWorkspace(targetId)).gadgetId;
    expect(movedId).toBe(connectionId);
    await disconnected;
  });
  await withAuthenticatedApi(async (api, disconnected) => {
    using source = await api.openGadget(sourceId);
    using target = await api.openGadget(targetId);
    using gadget = await target.getGadget(movedId);
    const nativeSource = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(sourceId));
    const ownerId = exports.UserDurableObject.idFromName(FAMILY_ACCESS_ADULT.email).toString();
    await runInDurableObject(nativeSource, async instance => {
      using session = new RpcStub(await instance.open(
          ownerId, FAMILY_ACCESS_ADULT.email, new NativeRpcStub(() => {})));
      expect((await rejection(session.getGatekeeperById(connectionId))).message).toContain("No such gatekeeper");
      expect((await rejection(instance["impl"].startGatekeeperSession(
          {type: "gatekeeper", id: connectionId}, {from: "user"}))).message).toContain("No such gatekeeper");
    });
    using connection = await gadget.getGatekeeperById(connectionId);
    expect(await connection.getTitle()).toBe("Retained connection");
    const hostGadgetId = await gadget.getHostGadgetId();
    expect(hostGadgetId).not.toBe(connectionId);
    using spawner = await gadget.newAgentSpawnerGatekeeper({displayName: "After move spawner", modelId: null,
      env: {SELF: hostGadgetId, CONNECTION: connectionId}});
    expect(await spawner.getCreationSpec()).toMatchObject({type: "agentSpawner", config: {
      env: {SELF: hostGadgetId, CONNECTION: connectionId},
    }});
    using spawnerSession = await spawner.openSession();
    await spawnerSession.spawn("Host IDs remain distinct", "Do not run an AI model.");
    expect((await target.listChats()).some(chat => chat.title === "Host IDs remain distinct")).toBe(true);
    await gadget.bind("BEFORE", connectionId);
    await gadget.renameBinding("BEFORE", "AFTER");
    const nativeTarget = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(targetId));
    await runInDurableObject(nativeTarget, async instance => {
      expect(instance["impl"].storage.gadgets.get(movedId)?.bindings.AFTER.resourceTitle)
          .toBe("Retained connection");
    });
    await gadget.unbind("AFTER");
    await source.deleteSelf();
    await disconnected;
  });
  await withAuthenticatedApi(async api => {
    using target = await api.openGadget(targetId);
    using gadget = await target.getGadget(movedId);
    using connection = await gadget.getGatekeeperById(connectionId);
    expect(await connection.getTitle()).toBe("Retained connection");
    await connection.remove();
    const nativeSource = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(sourceId));
    await runInDurableObject(nativeSource, async instance => {
      expect(instance["impl"].storage.gatekeepers.get(connectionId)).toBeUndefined();
      expect([...instance["impl"].storage.gadgets.list()].some(record =>
        record.createdGatekeeperIds?.includes(connectionId))).toBe(false);
    });
  });
});

it.each([true, false])("keeps moved approval choices visible and revocable after reclaim (source enabled: %s)", async initialEnabled => {
  let sourceId!: string, targetId!: string;
  let sourceGadgetId!: WorkpieceId, targetGadgetId!: WorkpieceId;
  let privateId!: WorkpieceId, gatekeeperId!: WorkpieceId;
  await withAuthenticatedApi(async (api, disconnected) => {
    using source = await api.newGadget();
    using target = await api.newGadget();
    sourceId = (await source.getMetadata()).id;
    targetId = (await target.getMetadata()).id;
    using moving = await source.createGadget("Return approval", undefined, "RETURNING");
    using privateGadget = await source.createGadget("Private approval", undefined, "PRIVATE");
    sourceGadgetId = await moving.getId();
    privateId = await privateGadget.getId();
    const native = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(sourceId));
    gatekeeperId = await runInDurableObject(native, async instance => {
      const impl = instance["impl"];
      const provider = (impl.env as Cloudflare.Env & {LOCAL_ACTION_PROVIDER: Service<ActionProviderService>}).LOCAL_ACTION_PROVIDER;
      const connection = await impl.addGatekeeper(await provider.getClass());
      return connection.getId();
    });
    await moving.bind("QUEUE", gatekeeperId);
    await privateGadget.bind("QUEUE", gatekeeperId);
    if (initialEnabled) await source.setAutoApprovedActionKind(gatekeeperId, {tag: "append", label: "Append"});
    targetGadgetId = (await moving.moveToWorkspace(targetId)).gadgetId;
    await disconnected;
  });
  await withAuthenticatedApi(async (api, disconnected) => {
    using _hostWorkspace = await api.openGadget(sourceId);
    using target = await api.openGadget(targetId);
    if (initialEnabled) await target.removeAutoApprovedActionKind(gatekeeperId, "append", sourceId);
    else await target.setAutoApprovedActionKind(gatekeeperId, {tag: "append", label: "Append"}, sourceId);
    using moved = await target.getGadget(targetGadgetId);
    await moved.moveToWorkspace(sourceId);
    await disconnected;
  });
  await withAuthenticatedApi(async api => {
    using source = await api.openGadget(sourceId);
    const native = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(sourceId));
    using privateSession = await native.startGatekeeperSession({type: "gatekeeper", id: gatekeeperId}, {from: "gadget", gadgetId: privateId});
    using returnedSession = await native.startGatekeeperSession({type: "gatekeeper", id: gatekeeperId}, {from: "gadget", gadgetId: sourceGadgetId});
    const states = () => runInDurableObject(native, async instance => {
      return (await instance["impl"].getGatekeeperFacet(gatekeeperId).fetch("https://local-action-provider.invalid/state")).json();
    });
    const enabled = await source.listAutoApprovedActionKinds();
    expect(enabled.filter(rule => rule.gatekeeperId === gatekeeperId && rule.actionKind.tag === "append")).toHaveLength(1);
    expect((await source.listPreApprovableActions()).find(action =>
      action.gatekeeperId === gatekeeperId && action.actionKind.tag === "append")?.alreadyEnabled).toBe(true);
    // Queue the enabled caller first; a manual action intentionally blocks later actions.
    const choices = initialEnabled ? ["private choice", "returned choice"] : ["returned choice", "private choice"];
    if (initialEnabled) {
      await privateSession.append(choices[0]);
      await returnedSession.append(choices[1]);
    } else {
      await returnedSession.append(choices[0]);
      await privateSession.append(choices[1]);
    }
    await expect.poll(states).toEqual([
      {value: choices[0], state: "applied"},
      {value: choices[1], state: "pending"},
    ]);
    await source.removeAutoApprovedActionKind(gatekeeperId, "append");
    expect(await source.listAutoApprovedActionKinds()).toEqual([]);
    expect((await source.listPreApprovableActions()).find(action =>
      action.gatekeeperId === gatekeeperId && action.actionKind.tag === "append")?.alreadyEnabled).toBe(false);
    await returnedSession.append("after disabling");
    await expect.poll(states).toEqual([
      {value: choices[0], state: "applied"},
      {value: choices[1], state: "pending"},
      {value: "after disabling", state: "pending"},
    ]);
    await source.setAutoApprovedActionKind(gatekeeperId, {tag: "append", label: "Append"});
    await expect.poll(states).toEqual([
      {value: choices[0], state: "applied"},
      {value: choices[1], state: "applied"},
      {value: "after disabling", state: "applied"},
    ]);
  });
});
