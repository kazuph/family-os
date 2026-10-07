import { exports } from "cloudflare:workers";
import { abortAllDurableObjects, runInDurableObject } from "cloudflare:test";
import { newWebSocketRpcSession } from "capnweb";
import { expect, it } from "vitest";
import * as Y from "yjs";
import { joinCodeSnapshotParts } from "../src/code-snapshot-parts";
import type { PublicApi } from "@gadgets/workshop-shared/api";
import { makeOverseerStorage } from "../src/storage-schema/overseer-storage";
import { assertLegacyWorkspaceIsLocal, needsGitStorageMigration } from "../src/storage-schema/overseer-migrations";

it("keeps a Git version-2 workspace's commits and source records through restart", async () => {
  const connect = async () => {
    const response = await exports.default.fetch(new Request("https://workshop.invalid/api", {
      headers: {Upgrade: "websocket"},
    }));
    if (!response.webSocket) throw new Error("Expected authenticated Workshop WebSocket");
    response.webSocket.accept();
    return newWebSocketRpcSession<PublicApi>(response.webSocket);
  };
  const username = "cutover" + crypto.randomUUID().replaceAll("-", "");
  let workspaceId: string;
  using root = await connect();
  const token = (await root.createAccount(username, "Cutover author", new Uint8Array([1, 2, 3])))!;
  expect(token).toBeTruthy();
  using api = await root.authenticate(token);
  await exports.AdminSettings.getByName("").ensureBundledBlueprintsInstalled();
  {
    using workspace = await api.newGadgetFromBlueprint("format.book", {});
    workspaceId = (await workspace.getMetadata()).id;
  }
  const namespace = exports.OverseerDurableObject;
  const stub = namespace.get(namespace.idFromString(workspaceId));
  const before = await runInDurableObject(stub, (_instance, ctx) => {
    const storage = makeOverseerStorage(ctx.storage);
    storage.version.put(2);
    const gadget = [...storage.gadgets.list()][0];
    const legacyMove = {...gadget, movedFrom: {
      sourceWorkspaceId: "retained-source", sourceGadgetId: gadget.id, token: "opaque-local-capability",
    }};
    storage.gadgets.put(legacyMove);
    const sourceRows = [...ctx.storage.kv.list()];
    expect(() => assertLegacyWorkspaceIsLocal(storage, workspaceId)).toThrow(/contains 1 moved or pending gadgets/);
    expect([...ctx.storage.kv.list()]).toEqual(sourceRows);
    storage.gadgets.put(gadget);
    expect(needsGitStorageMigration(storage)).toBe(false);
    return [...storage.gitObjects.list()];
  });
  expect(before.length).toBeGreaterThan(0);
  await api.whoami();
  await abortAllDurableObjects();
  const ownerId = exports.UserDurableObject.getByName(username).id.toString();
  expect((await namespace.get(namespace.idFromString(workspaceId)).getBookMcpWorkspaces(ownerId))[0].workspaceId)
      .toBe(workspaceId);
  await runInDurableObject(namespace.get(namespace.idFromString(workspaceId)), (_instance, ctx) => {
    const storage = makeOverseerStorage(ctx.storage);
    expect(storage.version.get()).toBe(4);
    expect(needsGitStorageMigration(storage)).toBe(false);
    expect([...storage.gitObjects.list()]).toEqual(before);
  });
});

it("reconstructs a real Yjs snapshot and refuses missing or mismatched parts", () => {
  const source = new Y.Doc();
  source.getMap().set("server.js", new Y.Text("// preserved accepted source"));
  const update = Y.encodeStateAsUpdateV2(source);
  const boundary = Math.floor(update.length / 2);
  const timestamp = new Date();
  const parts = [
    {key: "snapshot-a", version: 2, timestamp, index: 0, partCount: 2, update: update.slice(0, boundary)},
    {key: "snapshot-b", version: 2, timestamp, index: 1, partCount: 2, update: update.slice(boundary)},
  ];
  const complete = joinCodeSnapshotParts(parts.toReversed())!;
  const restored = new Y.Doc();
  Y.applyUpdateV2(restored, complete.update);
  expect(restored.getMap().get("server.js")!.toString()).toBe("// preserved accepted source");
  expect(() => joinCodeSnapshotParts(parts.slice(0, 1))).toThrow(/incomplete/);
  expect(() => joinCodeSnapshotParts([parts[0], {...parts[1], version: 3}])).toThrow(/inconsistent/);
  source.destroy();
  restored.destroy();
});
