import { exports } from "cloudflare:workers";
import { abortAllDurableObjects, runInDurableObject } from "cloudflare:test";
import { newWebSocketRpcSession, RpcTarget, type RpcStub } from "capnweb";
import type { PublicApi, AuthenticatedApi, ActionLogEntry, ActionsSubscriber } from "@gadgets/workshop-shared/api";
import { unwrapFamilyRpcResult } from "@gadgets/workshop-shared/api";
import { expect, it } from "vitest";
import { makeOverseerStorage, ACTION_HISTORY_PAGE_DEFAULT_LIMIT } from "../src/overseer.js";
import { FAMILY_ACCESS_API_URL, signFamilyAccessJwt } from "./family-access-jwt.js";

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

class ActionCollector extends RpcTarget implements ActionsSubscriber {
  entries: ActionLogEntry[] = [];
  readyCalled = false;
  disposeCount = 0;
  #resolveDisposed!: () => void;
  readonly disposed = new Promise<void>(resolve => { this.#resolveDisposed = resolve; });
  onEntry?: (record: ActionLogEntry) => void;
  entry(record: ActionLogEntry): void {
    this.entries.push(record);
    this.onEntry?.(record);
  }
  ready(): void { this.readyCalled = true; }
  [Symbol.dispose](): void {
    this.disposeCount++;
    this.#resolveDisposed();
  }
}

it("pages and replays equal action IDs from multiple hosts without exposing their other gadgets", async () => {
  const recordsPerHost = ACTION_HISTORY_PAGE_DEFAULT_LIMIT + 1;
  const epoch = new Date("2026-09-01T00:00:00Z");
  const sources: {workspaceId: string; gadgetId: number}[] = [];
  let targetId!: string;
  let latestEntry!: ActionLogEntry;
  const expected = new Set<string>();
  await withAuthenticatedApi(async authenticated => {
    using target = await authenticated.newGadget();
    targetId = (await target.getMetadata()).id;
    using local = await target.createGadget("Target local", undefined, "LOCAL_GADGET");
    const localId = await local.getId();
    for (const sourceLabel of ["FIRST", "SECOND"]) {
      using source = await authenticated.newGadget();
      using moving = await source.createGadget(sourceLabel, undefined, sourceLabel);
      using privateGadget = await source.createGadget("Private", undefined, "PRIVATE_GADGET");
      const workspaceId = (await source.getMetadata()).id;
      const gadgetId = await moving.getId();
      const privateId = await privateGadget.getId();
      sources.push({workspaceId, gadgetId});
      const native = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(workspaceId));
      await runInDurableObject(native, (_instance, state) => {
        const storage = makeOverseerStorage(state.storage);
        for (let index = 0; index < recordsPerHost; index++) {
          for (const [offset, visibleGadget] of [[0, gadgetId], [1, privateId]]) {
            const id = index * 2 + offset;
            storage.actions.put({id, gatekeeperId: gadgetId,
              caller: {from: "gadget", gadgetId: visibleGadget},
              createdAt: new Date(epoch.valueOf() + index), state: "approved", type: "observation",
              resourceTitle: offset === 0 ? sourceLabel : "PRIVATE MUST NOT LEAK",
              description: {title: "Stored observation", description: "Action history fixture"},
            });
          }
        }
      });
      for (let index = 0; index < recordsPerHost; index++) expected.add(`${workspaceId}:${index * 2}`);
    }
    const targetNative = exports.OverseerDurableObject.get(exports.OverseerDurableObject.idFromString(targetId));
    await runInDurableObject(targetNative, (_instance, state) => {
      makeOverseerStorage(state.storage).actions.put({id: 0, gatekeeperId: localId,
        caller: {from: "gadget", gadgetId: localId}, createdAt: epoch,
        state: "approved", type: "observation",
        description: {title: "Target observation", description: "Local history remains visible"},
      });
    });
    expected.add(`${targetId}:0`);
  });
  for (const source of sources) {
    await withAuthenticatedApi(async (authenticated, disconnected) => {
      using workspace = await authenticated.openGadget(source.workspaceId);
      using gadget = await workspace.getGadget(source.gadgetId);
      await gadget.moveToWorkspace(targetId);
      await disconnected;
    });
  }
  await withAuthenticatedApi(async authenticated => {
    using target = await authenticated.openGadget(targetId);
    let cursor: string | undefined;
    const seenCursors = new Set<string>();
    const entries: ActionLogEntry[] = [];
    do {
      const page = await target.listActions({cursor});
      expect(page.entries.length).toBeLessThanOrEqual(ACTION_HISTORY_PAGE_DEFAULT_LIMIT);
      entries.push(...page.entries);
      cursor = page.nextCursor;
      if (cursor !== undefined) {
        expect(seenCursors.has(cursor)).toBe(false);
        seenCursors.add(cursor);
      }
    } while (cursor !== undefined);
    const keys = entries.map(entry => `${entry.sourceWorkspaceId}:${entry.id}`);
    expect(keys.length).toBe(expected.size);
    expect(new Set(keys)).toEqual(expected);
    expect(entries.some(entry => entry.resourceTitle === "PRIVATE MUST NOT LEAK")).toBe(false);
    const collector = new ActionCollector();
    const subscription = await target.subscribeToActions(collector, epoch);
    subscription.onRpcBroken(() => {});
    expect(collector.readyCalled).toBe(true);
    expect(new Set(collector.entries.map(entry => `${entry.sourceWorkspaceId}:${entry.id}`))).toEqual(expected);
    const source = sources[0];
    const liveId = recordsPerHost * 2;
    const delivered = new Promise<void>(resolve => {
      collector.onEntry = record => {
        if (record.sourceWorkspaceId === source.workspaceId && record.id === liveId) resolve();
      };
    });
    const native = exports.OverseerDurableObject.get(
        exports.OverseerDurableObject.idFromString(source.workspaceId));
    await runInDurableObject(native, instance => {
      // Use the running DO's store so its real typed-storage subscribers receive the write.
      instance["impl"].storage.actions.put({id: liveId, gatekeeperId: source.gadgetId,
        caller: {from: "gadget", gadgetId: source.gadgetId}, createdAt: epoch,
        state: "approved", type: "observation",
        description: {title: "Live observation", description: "Delivered after replay"},
      });
    });
    await delivered;
    expected.add(`${source.workspaceId}:${liveId}`);
    expect(new Set(collector.entries.map(entry => `${entry.sourceWorkspaceId}:${entry.id}`)))
        .toEqual(expected);
    const targetNative = exports.OverseerDurableObject.get(
        exports.OverseerDurableObject.idFromString(targetId));
    const lease = await runInDurableObject(targetNative, instance => {
      const impl = instance["impl"];
      const proxy = [...impl.storage.gadgets.list()].find(record =>
        record.movedFrom?.sourceWorkspaceId === source.workspaceId &&
        record.movedFrom.sourceGadgetId === source.gadgetId);
      if (!proxy?.movedFrom || !impl.ownerId) throw new Error("Expected published move lease.");
      return {gadgetId: proxy.id, token: proxy.movedFrom.token, ownerId: impl.ownerId};
    });
    const first = collector.entries.find(record =>
      record.sourceWorkspaceId === source.workspaceId && record.id === liveId)!;
    const versions = (sink: ActionCollector) => sink.entries.filter(record =>
      record.sourceWorkspaceId === source.workspaceId && record.id === liveId)
      .map(record => record.sourceVersion);
    const change = async (sink: ActionCollector, title: string): Promise<ActionLogEntry> => {
      const observed = new Promise<ActionLogEntry>(resolve => {
        sink.onEntry = record => {
          if (record.sourceWorkspaceId === source.workspaceId && record.id === liveId &&
              record.description.title === title) resolve(record);
        };
      });
      await runInDurableObject(native, instance => {
        const storage = instance["impl"].storage;
        const record = storage.actions.get(liveId)!;
        storage.actions.put({...record, description: {...record.description, title}});
      });
      return await observed;
    };
    const resendFirst = () => targetNative.receiveMovedGadgetAction(
        source.workspaceId, source.gadgetId, lease.gadgetId, lease.token, lease.ownerId, first);
    const second = await change(collector, "Second revision");
    await resendFirst();
    const third = await change(collector, "Third revision");
    expect(versions(collector)).toEqual([first.sourceVersion, second.sourceVersion, third.sourceVersion]);
    expect(second.sourceVersion).toBeGreaterThan(first.sourceVersion!);
    expect(third.sourceVersion).toBeGreaterThan(second.sourceVersion!);
    subscription[Symbol.dispose]();
    // Await the runtime's final callback-reference release, not a timed snapshot.
    await collector.disposed;
    expect(collector.disposeCount).toBe(1);
    const reconnected = new ActionCollector();
    using _replay = await target.subscribeToActions(reconnected, epoch);
    expect(reconnected.readyCalled).toBe(true);
    expect(new Set(reconnected.entries.map(entry => `${entry.sourceWorkspaceId}:${entry.id}`)))
        .toEqual(expected);
    await resendFirst();
    const fourth = await change(reconnected, "Fourth revision");
    expect(versions(reconnected)).toEqual([third.sourceVersion, fourth.sourceVersion]);
    _replay[Symbol.dispose]();
    await reconnected.disposed;
    expect(reconnected.disposeCount).toBe(1);
    const initial = new ActionCollector();
    using initialSubscription = await target.subscribeToActions(initial);
    expect(initial.readyCalled).toBe(true);
    await resendFirst();
    const fifth = await change(initial, "Fifth revision");
    latestEntry = fifth;
    expect(versions(initial)).toEqual([fifth.sourceVersion]);
    initialSubscription[Symbol.dispose]();
    await initial.disposed;
    expect(initial.disposeCount).toBe(1);
  });
  await abortAllDurableObjects();
  await withAuthenticatedApi(async authenticated => {
    using target = await authenticated.openGadget(targetId);
    const restarted = new ActionCollector();
    using subscription = await target.subscribeToActions(restarted, epoch);
    const recovered = restarted.entries.find(entry =>
      entry.sourceWorkspaceId === latestEntry.sourceWorkspaceId && entry.id === latestEntry.id);
    expect(recovered).toEqual(latestEntry);
    subscription[Symbol.dispose]();
    await restarted.disposed;
    expect(restarted.disposeCount).toBe(1);
  });
});
