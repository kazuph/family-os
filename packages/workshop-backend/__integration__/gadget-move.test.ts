import { runInDurableObject } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { newWebSocketRpcSession, RpcTarget, type RpcStub } from "capnweb";
import type {
  AgentSpawnerConfig,
  AuthenticatedApi,
  CodeSubscriber,
  CodeUpdate,
  FamilyEntry,
  PublicApi,
} from "@gadgets/workshop-shared/api";
import { unwrapFamilyRpcResult } from "@gadgets/workshop-shared/api";
import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import type { AgentSpawnerBinding } from "../src/agent-spawner-binding.js";
import {
  FAMILY_ACCESS_ADULT,
  FAMILY_ACCESS_API_URL,
  signFamilyAccessJwt,
} from "./family-access-jwt.js";

type Connection = {
  api: RpcStub<PublicApi>;
  family: RpcStub<FamilyEntry>;
  authenticated: RpcStub<AuthenticatedApi>;
};

async function connect(): Promise<Connection> {
  let response = await exports.default.fetch(new Request(FAMILY_ACCESS_API_URL, {
    headers: {
      Upgrade: "websocket",
      Origin: "https://workshop.invalid",
      Cookie: "CF_Authorization=login-1200",
      "cf-access-jwt-assertion": await signFamilyAccessJwt(1200),
    },
  }));
  if (response.status !== 101 || !response.webSocket) {
    throw new Error(`Access handshake failed: ${response.status}`);
  }
  response.webSocket.accept();
  let api = newWebSocketRpcSession<PublicApi>(response.webSocket);
  api.onRpcBroken(() => {});
  let family = await api.authenticateFromCfAccess();
  family.onRpcBroken(() => {});
  unwrapFamilyRpcResult(await family.selectAdultProfile());
  let authenticated = unwrapFamilyRpcResult(await family.getAuthenticatedApi());
  authenticated.onRpcBroken(() => {});
  if (!(await authenticated.isOnboardingCompleted())) {
    await authenticated.setOwnDisplayName("Move Tester");
    await authenticated.completeOnboarding();
  }
  return {api, family, authenticated};
}

async function withConnection(run: (api: RpcStub<AuthenticatedApi>, disconnected: Promise<void>) => Promise<void>) {
  const connected = await connect();
  using api = connected.api;
  using _family = connected.family;
  using authenticated = connected.authenticated;
  const disconnected = new Promise<void>(resolve => api.onRpcBroken(() => resolve()));
  await run(authenticated, disconnected);
}

class CodeCollector extends RpcTarget implements CodeSubscriber {
  readonly updates: CodeUpdate[] = [];
  readyCalled = false;

  update(update: CodeUpdate): void {
    this.updates.push(update);
  }

  ready(): void {
    this.readyCalled = true;
  }
}

function addClientFile(doc: Y.Doc, rootName: string, source: string): void {
  let files = doc.getMap<Y.Text>(rootName);
  let text = new Y.Text();
  text.insert(0, source);
  files.set("client.js", text);
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

describe("Gadget moves", () => {
  it("keeps the source workspace, forwards Yjs editing, and transfers the host lease on re-move", async () => {
    let sourceId!: string;
    let firstTargetId!: string;
    let secondTargetId!: string;
    let sourceGadgetId!: number;
    let firstGadgetId!: number;
    let secondFirstGadgetId!: number;
    let secondGadgetId!: number;
    let chatId!: number;
    const ownerId = exports.UserDurableObject.idFromName(FAMILY_ACCESS_ADULT.email).toString();
    const doc = new Y.Doc();
    const editedCode = "export const moved = true;\nexport const edited = true;";
    await withConnection(async (authenticated, disconnected) => {
      using source = await authenticated.newGadget();
      using first = await authenticated.newGadget();
      using second = await authenticated.newGadget();
      sourceId = (await source.getMetadata()).id;
      firstTargetId = (await first.getMetadata()).id;
      secondTargetId = (await second.getMetadata()).id;
      chatId = await source.newChat("Keep this conversation after moving", null);
      using gadget = await source.createGadget("Move me", undefined, "MOVE_ME");
      sourceGadgetId = await gadget.getId();
      addClientFile(doc, String(sourceGadgetId), "export const moved = true;");
      await gadget.updateCode(Y.encodeStateAsUpdateV2(doc));
      const location = await gadget.moveToWorkspace(firstTargetId);
      expect(location.workspaceId).toBe(firstTargetId);
      firstGadgetId = location.gadgetId;
      await disconnected;
    });
    const sourceNative = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(sourceId));
    await withConnection(async (authenticated, disconnected) => {
      using source = await authenticated.openGadget(sourceId);
      using first = await authenticated.openGadget(firstTargetId);
      using gadget = await first.getGadget(firstGadgetId);
      expect((await gadget.getUiBundle()).jsCode).toBe("export const moved = true;");
      const moveStatus = await sourceNative.getGadgetMoveStatus(sourceGadgetId, ownerId);
      if (moveStatus.state !== "leased" || !moveStatus.token) throw new Error("Expected active host lease.");
      expect(await exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(firstTargetId))
          .installMovedGadget({sourceWorkspaceId: sourceId, sourceGadgetId, ownerId,
            token: moveStatus.token, title: "Move me", created: new Date(),
            bindingName: "MOVE_ME", filesRoot: String(sourceGadgetId)}))
          .toEqual({workspaceId: firstTargetId, gadgetId: firstGadgetId});
      const updates: Uint8Array[] = [];
      doc.on("updateV2", update => updates.push(update));
      const file = doc.getMap<Y.Text>(String(sourceGadgetId)).get("client.js")!;
      file.insert(file.length, "\nexport const edited = true;");
      await gadget.updateCode(Y.mergeUpdatesV2(updates));
      expect((await gadget.getUiBundle()).jsCode).toBe(editedCode);
      const collector = new CodeCollector();
      using subscription = await gadget.subscribeToCode(collector, 0);
      expect(collector.readyCalled).toBe(true);
      expect(collector.updates.length).toBeGreaterThan(0);
      subscription[Symbol.dispose]();
      await runInDurableObject(sourceNative, instance => {
        expect(() => instance["impl"].getUserGadgetRecord(sourceGadgetId)).toThrow(/moved to another workspace/);
      });
      expect((await source.listChats()).some(chat => chat.id === chatId)).toBe(true);
      expect(await gadget.moveToWorkspace(sourceId)).toEqual({workspaceId: sourceId, gadgetId: sourceGadgetId});
      await disconnected;
    });
    await withConnection(async (authenticated, disconnected) => {
      using source = await authenticated.openGadget(sourceId);
      using gadget = await source.getGadget(sourceGadgetId);
      expect((await gadget.getUiBundle()).jsCode).toBe(editedCode);
      secondFirstGadgetId = (await gadget.moveToWorkspace(firstTargetId)).gadgetId;
      await disconnected;
    });
    await withConnection(async (authenticated, disconnected) => {
      // The fixed host restarts after a lease transfer; observe its close before reconnecting.
      using _hostWorkspace = await authenticated.openGadget(sourceId);
      using first = await authenticated.openGadget(firstTargetId);
      using gadget = await first.getGadget(secondFirstGadgetId);
      const location = await gadget.moveToWorkspace(secondTargetId);
      expect(location.workspaceId).toBe(secondTargetId);
      secondGadgetId = location.gadgetId;
      await disconnected;
    });
    await withConnection(async authenticated => {
      using second = await authenticated.openGadget(secondTargetId);
      using gadget = await second.getGadget(secondGadgetId);
      expect((await gadget.getUiBundle()).jsCode).toBe(editedCode);
      await runInDurableObject(exports.OverseerDurableObject.get(
          exports.OverseerDurableObject.idFromString(firstTargetId)), instance => {
        expect(() => instance["impl"].getUserGadgetRecord(secondFirstGadgetId)).toThrow(/No such gadget/);
      });
      const currentHost = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(sourceId));
      expect(await currentHost.getGadgetMoveStatus(sourceGadgetId, ownerId)).toMatchObject({
        state: "leased", targetWorkspaceId: secondTargetId, targetGadgetId: secondGadgetId,
      });
    });
  });

  it("resumes a persisted moving record after the source DO restarts", async () => {
    let {api, family, authenticated} = await connect();
    using sourceWorkspace = await authenticated.newGadget();
    using targetWorkspace = await authenticated.newGadget();
    let sourceId = (await sourceWorkspace.getMetadata()).id;
    let targetId = (await targetWorkspace.getMetadata()).id;
    using gadget = await sourceWorkspace.createGadget("Restartable move", undefined, "RESTART_MOVE");
    let gadgetId = await gadget.getId();
    let ownerId = exports.UserDurableObject.idFromName(FAMILY_ACCESS_ADULT.email).toString();
    let sourceNative = exports.OverseerDurableObject.get(
      exports.OverseerDurableObject.idFromString(sourceId),
    );

    await sourceNative.beginGadgetMove(gadgetId, targetId, ownerId);
    await expect(sourceNative.getGadgetMoveStatus(gadgetId, ownerId)).resolves.toMatchObject({
      state: "moving",
      targetWorkspaceId: targetId,
    });

    const disconnected = new Promise<void>(resolve => api.onRpcBroken(() => resolve()));
    await rejection(runInDurableObject(sourceNative, (_instance, state) => {
      state.abort("move restart recovery test");
    }));

    await disconnected;
    authenticated[Symbol.dispose]();
    family[Symbol.dispose]();
    api[Symbol.dispose]();
    const resumed = await connect();
    using _resumedApi = resumed.api;
    using _resumedFamily = resumed.family;
    using resumedAuthenticated = resumed.authenticated;
    using resumedSource = await resumedAuthenticated.openGadget(sourceId);
    using resumedGadget = await resumedSource.getGadget(gadgetId);
    let location = await resumedGadget.moveToWorkspace(targetId);
    expect(location.workspaceId).toBe(targetId);
    using resumedTarget = await resumedAuthenticated.openGadget(targetId);
    using movedGadget = await resumedTarget.getGadget(location.gadgetId);
    await expect(movedGadget.getTitle()).resolves.toBe("Restartable move");

    authenticated[Symbol.dispose]();
    family[Symbol.dispose]();
    api[Symbol.dispose]();
  });

  it("routes an existing Gadget agent spawner to the moved target chat", async () => {
    let {api, family, authenticated} = await connect();
    using sourceWorkspace = await authenticated.newGadget();
    using targetWorkspace = await authenticated.newGadget();
    let sourceId = (await sourceWorkspace.getMetadata()).id;
    let targetId = (await targetWorkspace.getMetadata()).id;
    using sourceGadget = await sourceWorkspace.createGadget(
        "Spawner move source", undefined, "SPAWNER_MOVE_SOURCE");
    using otherGadget = await sourceWorkspace.createGadget(
        "Spawner move resource", undefined, "SPAWNER_MOVE_RESOURCE");
    let sourceGadgetId = await sourceGadget.getId();
    let otherGadgetId = await otherGadget.getId();
    let config: AgentSpawnerConfig = {
      displayName: "Existing moved spawner",
      modelId: null,
      env: {SELF: sourceGadgetId, OTHER: otherGadgetId},
    };
    using connection = await sourceWorkspace.newAgentSpawnerGatekeeper(config);
    let connectionId = await connection.getId();
    await sourceGadget.bind("AGENT_SPAWNER", connectionId);
    await otherGadget.bind("SHARED_SPAWNER", connectionId);
    const disconnected = new Promise<void>(resolve => api.onRpcBroken(() => resolve()));
    let location = await sourceGadget.moveToWorkspace(targetId);
    await disconnected;
    authenticated[Symbol.dispose]();
    family[Symbol.dispose]();
    api[Symbol.dispose]();
    const resumed = await connect();
    using _resumedApi = resumed.api;
    using _resumedFamily = resumed.family;
    using resumedAuthenticated = resumed.authenticated;
    using resumedSource = await resumedAuthenticated.openGadget(sourceId);
    using resumedTarget = await resumedAuthenticated.openGadget(targetId);
    using resumedOtherGadget = await resumedSource.getGadget(otherGadgetId);
    let ownerId = exports.UserDurableObject.idFromName(FAMILY_ACCESS_ADULT.email).toString();
    let route = await exports.OverseerDurableObject.get(
        exports.OverseerDurableObject.idFromString(sourceId)).getMovedGadgetSpawnTarget(
            sourceGadgetId, ownerId, config.env);
    expect(route).toMatchObject({
      workspaceId: targetId,
      sourceWorkspaceId: sourceId,
      sourceGadgetId,
      bindingTargets: {
        SELF: {type: "gadget", id: sourceGadgetId},
        OTHER: {type: "gadget", id: otherGadgetId},
      },
    });
    using targetGadget = await resumedTarget.getGadget(location.gadgetId);
    let movedConnection = await targetGadget.getBinding("AGENT_SPAWNER");
    if (!movedConnection) throw new Error("Moved agent spawner binding is missing.");
    await expect(movedConnection.getId()).resolves.toBe(connectionId);
    await expect(movedConnection.describe()).resolves.toMatchObject({
      title: "Existing moved spawner",
    });
    using spawner = await movedConnection.openSession() as RpcStub<AgentSpawnerBinding>;
    await spawner.spawn("Moved agent chat", "No model is configured for this verification.");

    await expect(resumedTarget.listChats()).resolves.toEqual(
        expect.arrayContaining([expect.objectContaining({
          title: "Moved agent chat",
          spawnerName: "Existing moved spawner",
        })]));

    // The same source-side spawner remains source-routed for a non-moved Gadget. Its durable
    // class props are shared, so this proves routing is selected by the opened session's caller.
    let sourceSharedConnection = await resumedOtherGadget.getBinding("SHARED_SPAWNER");
    if (!sourceSharedConnection) throw new Error("Shared source spawner binding is missing.");
    using sourceSharedSpawner = await sourceSharedConnection.openSession() as RpcStub<AgentSpawnerBinding>;
    await sourceSharedSpawner.spawn("Source agent chat", "Remain on the source workspace.");
    await expect(resumedSource.listChats()).resolves.toEqual(
        expect.arrayContaining([expect.objectContaining({
          title: "Source agent chat",
          spawnerName: "Existing moved spawner",
        })]));

    authenticated[Symbol.dispose]();
    family[Symbol.dispose]();
    api[Symbol.dispose]();
  });
});
