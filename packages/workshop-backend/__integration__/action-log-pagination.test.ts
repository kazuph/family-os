import {
  exports, RpcStub as NativeRpcStub,
} from "cloudflare:workers";
import { runInDurableObject } from "cloudflare:test";
import { newWebSocketRpcSession, RpcStub, RpcTarget as CapnRpcTarget } from "capnweb";
import type {
  ActionLogEntry, ActionsSubscriber, AuthenticatedApi, Overseer, PublicApi,
} from "@gadgets/workshop-shared/api";
import { unwrapFamilyRpcResult } from "@gadgets/workshop-shared/api";
import { describe, expect, it } from "vitest";
import {
  ACTION_HISTORY_PAGE_DEFAULT_LIMIT, ACTION_REPLAY_PAGE_SIZE, OverseerDurableObject,
} from "../src/overseer.js";
import {
  FIXTURE_EPOCH, HOOK_ENTRYPOINT, makePreIndexActionStorage, putAction,
  type ActionTestStorage,
} from "./action-log-fixtures.js";
import { FAMILY_ACCESS_ADULT, FAMILY_ACCESS_API_URL, signFamilyAccessJwt } from "./family-access-jwt.js";
import { localHookController } from "./hook-controller-fixtures.js";

type ActionWorkspaceContext = {
  native: DurableObjectStub<OverseerDurableObject>;
  ownerId: string;
  workspaceId: string;
  gadgetId: number;
  workspace: RpcStub<Overseer>;
};

async function rejection(value: PromiseLike<unknown>): Promise<Error> {
  try {
    await value;
  } catch (error) {
    if (!(error instanceof Error)) throw new TypeError("Expected an RPC Error.", {cause: error});
    return error;
  }
  throw new Error("Expected RPC rejection.");
}

async function withAuthenticatedApi(
    run: (api: RpcStub<AuthenticatedApi>, disconnected: Promise<void>) => Promise<void>):
    Promise<void> {
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
    await authenticated.setOwnDisplayName("Action history integration");
    await authenticated.completeOnboarding();
  }
  await run(authenticated, disconnected);
}

async function withActionWorkspace(
    run: (context: ActionWorkspaceContext) => Promise<void>): Promise<void> {
  await withAuthenticatedApi(async authenticated => {
    using createdWorkspace = await authenticated.newGadget();
    using gadget = await createdWorkspace.createGadget("Action history fixture");
    let workspaceId = (await createdWorkspace.getMetadata()).id;
    let gadgetId = await gadget.getId();
    using workspace = await authenticated.openGadget(workspaceId);
    let native = exports.OverseerDurableObject.get(
        exports.OverseerDurableObject.idFromString(workspaceId));
    let ownerId = exports.UserDurableObject.idFromName(FAMILY_ACCESS_ADULT.email).toString();
    await run({native, ownerId, workspaceId, gadgetId, workspace});
  });
}

async function withLiveStorage(
    context: ActionWorkspaceContext,
    run: (storage: ActionTestStorage) => void | Promise<void>):
    Promise<void> {
  await runInDurableObject(context.native, async instance => {
    await run(instance["impl"].storage);
  });
}

// A real Cap'n Web target. Its async entry method lets the mid-replay case hold the first replay
// page open while the same running Durable Object writes a live record.
class ActionCollector extends CapnRpcTarget implements ActionsSubscriber {
  entries: ActionLogEntry[] = [];
  events: Array<number | "ready"> = [];
  readyCalled = false;
  #resolveReady!: () => void;
  readonly readyReceived = new Promise<void>(resolve => { this.#resolveReady = resolve; });
  onEntry?: (record: ActionLogEntry) => void;

  constructor(private gate?: Promise<void>) {
    super();
  }

  async entry(record: ActionLogEntry): Promise<void> {
    this.entries.push(record);
    this.events.push(record.id);
    this.onEntry?.(record);
    if (this.gate) await this.gate;
  }

  ready(): void {
    this.readyCalled = true;
    this.events.push("ready");
    this.#resolveReady();
  }

  waitForEntry(predicate: (record: ActionLogEntry) => boolean): Promise<void> {
    let existing = this.entries.find(predicate);
    if (existing) return Promise.resolve();
    return new Promise(resolve => {
      let previous = this.onEntry;
      this.onEntry = record => {
        previous?.(record);
        if (predicate(record)) {
          this.onEntry = previous;
          resolve();
        }
      };
    });
  }

  waitForCount(count: number): Promise<void> {
    if (this.entries.length >= count) return Promise.resolve();
    return new Promise(resolve => {
      let previous = this.onEntry;
      this.onEntry = record => {
        previous?.(record);
        if (this.entries.length >= count) {
          this.onEntry = previous;
          resolve();
        }
      };
    });
  }
}

async function withHookController(
    context: ActionWorkspaceContext,
    run: (controller: any, storage: ActionTestStorage, instance: OverseerDurableObject) =>
        void | Promise<void>,
): Promise<void> {
  await runInDurableObject(context.native, async instance => {
    let controller = Reflect.get(instance["impl"].env, "LOCAL_HOOK_CONTROLLER");
    await run(controller, instance["impl"].storage, instance);
  });
}

describe("subscribeToActions", () => {
  it("delivers no pre-existing records: ready fires immediately", async () => {
    await withActionWorkspace(async context => {
      // Live deltas only — the current pending set is queried via listActions({filter: "pending"}).
      await withLiveStorage(context, storage => {
        putAction(storage, 0, {gadgetId: context.gadgetId});
        putAction(storage, 1, {state: "approved", gadgetId: context.gadgetId});
        putAction(storage, 2, {
          type: "bindHook", state: "pending", gadgetId: context.gadgetId,
        });
      });
      let subscriber = new ActionCollector();
      using _subscription = await context.workspace.subscribeToActions(subscriber);
      expect(subscriber.events).toEqual(["ready"]);
    });
  });

  it("delivers adds and resolutions live, in stream order", async () => {
    await withActionWorkspace(async context => {
      let subscriber = new ActionCollector();
      let subscription = await context.workspace.subscribeToActions(subscriber);
      let delivered = subscriber.waitForCount(2);
      await withLiveStorage(context, storage => {
        putAction(storage, 0, {gadgetId: context.gadgetId});
        let record = storage.actions.get(0)!;
        record.state = "approved";
        storage.actions.put(record);
      });
      await delivered;
      subscription[Symbol.dispose]();

      expect(subscriber.events).toEqual(["ready", 0, 0]);
    });
  });

  it("replays every record, resolved included, for an epoch startAfter", async () => {
    await withActionWorkspace(async context => {
      await withLiveStorage(context, storage => {
        putAction(storage, 0, {gadgetId: context.gadgetId});
        putAction(storage, 1, {state: "approved", gadgetId: context.gadgetId});
        putAction(storage, 2, {
          type: "observation", state: "rejected", gadgetId: context.gadgetId,
        });
        putAction(storage, 3, {
          type: "bindHook", state: "pending", gadgetId: context.gadgetId,
        });
      });
      let subscriber = new ActionCollector();
      using _subscription = await context.workspace.subscribeToActions(subscriber, new Date(0));
      expect(subscriber.events).toEqual([0, 1, 2, 3, "ready"]);
    });
  });

  it("replays only records whose last state change is at or past startAfter", async () => {
    await withActionWorkspace(async context => {
      await withLiveStorage(context, storage => {
        // putAction stamps createdAt = FIXTURE_EPOCH + id, so the cutoff falls mid-log. The bound
        // is inclusive: the record last changed exactly at the cutoff is re-delivered.
        putAction(storage, 0, {gadgetId: context.gadgetId});
        putAction(storage, 1, {state: "approved", gadgetId: context.gadgetId});
        putAction(storage, 2, {state: "rejected", gadgetId: context.gadgetId});
        putAction(storage, 3, {gadgetId: context.gadgetId});
      });
      let subscriber = new ActionCollector();
      using _subscription = await context.workspace.subscribeToActions(
          subscriber, new Date(FIXTURE_EPOCH + 1));
      expect(subscriber.events).toEqual([1, 2, 3, "ready"]);
    });
  });

  it("replays only the changed records, in change-time order, however large the log", async () => {
    await withActionWorkspace(async context => {
      await withLiveStorage(context, storage => {
        for (let id = 0; id < 550; id++) {
          putAction(storage, id, {state: "approved", gadgetId: context.gadgetId});
        }
        // Two records resolved after the cutoff, in the opposite of id order.
        putAction(storage, 7, {
          state: "approved", appliedAt: new Date(FIXTURE_EPOCH + 2000), gadgetId: context.gadgetId,
        });
        putAction(storage, 3, {
          state: "approved", appliedAt: new Date(FIXTURE_EPOCH + 3000), gadgetId: context.gadgetId,
        });
      });
      let subscriber = new ActionCollector();
      using _subscription = await context.workspace.subscribeToActions(
          subscriber, new Date(FIXTURE_EPOCH + 1000));
      expect(subscriber.events).toEqual([7, 3, "ready"]);
    });
  });

  it("replays a whole batch tied at the cutoff instant, each record once", async () => {
    await withActionWorkspace(async context => {
      let instant = new Date(FIXTURE_EPOCH + 100);
      await withLiveStorage(context, storage => {
        // The frozen clock stamps whole batches with one instant; an exclusive bound would lose the
        // siblings of the last-seen record.
        putAction(storage, 0, {state: "approved", gadgetId: context.gadgetId});
        putAction(storage, 1, {createdAt: instant, gadgetId: context.gadgetId});
        putAction(storage, 2, {createdAt: instant, gadgetId: context.gadgetId});
        // Changed twice within the instant: one index key, so one delivery of the final state.
        putAction(storage, 3, {
          createdAt: instant, appliedAt: instant, gadgetId: context.gadgetId,
        });
        putAction(storage, 3, {
          createdAt: instant, appliedAt: instant, state: "approved", gadgetId: context.gadgetId,
        });
      });
      let subscriber = new ActionCollector();
      using _subscription = await context.workspace.subscribeToActions(subscriber, instant);
      expect(subscriber.entries.map(entry => entry.id)).toEqual([1, 2, 3]);
      expect(subscriber.entries[2].state).toBe("approved");
    });
  });

  it("hands records changing mid-replay to the live stream and still terminates", async () => {
    await withActionWorkspace(async context => {
      // Two pages, so the sweep is parked mid-replay while the gate holds the first page open.
      await withLiveStorage(context, storage => {
        for (let id = 0; id <= ACTION_REPLAY_PAGE_SIZE; id++) {
          putAction(storage, id, {gadgetId: context.gadgetId});
        }
      });
      let release!: () => void;
      let gate = new Promise<void>(resolve => { release = resolve; });
      let subscriber = new ActionCollector(gate);
      let replayStarted = subscriber.waitForEntry(entry => entry.id === 0);
      let subscribe = context.workspace.subscribeToActions(subscriber, new Date(0));
      await replayStarted;
      let newId = ACTION_REPLAY_PAGE_SIZE + 100;
      await withLiveStorage(context, storage => putAction(storage, newId, {
        gadgetId: context.gadgetId,
      }));
      release();
      using _subscription = await subscribe;

      // Delivered once, by the live subscription; the replay ends at its end key.
      expect(subscriber.entries.filter(entry => entry.id === newId).map(entry => entry.id))
          .toEqual([newId]);
      expect(subscriber.events.at(-1)).toBe("ready");
      expect(subscriber.events.length).toBe(ACTION_REPLAY_PAGE_SIZE + 3);
    });
  });

  it("replays a record created before the cutoff but resolved after it", async () => {
    await withActionWorkspace(async context => {
      await withLiveStorage(context, storage => {
        putAction(storage, 0, {
          state: "approved", appliedAt: new Date(FIXTURE_EPOCH + 500), gadgetId: context.gadgetId,
        });
        putAction(storage, 1, {state: "approved", gadgetId: context.gadgetId});
      });
      let subscriber = new ActionCollector();
      using _subscription = await context.workspace.subscribeToActions(
          subscriber, new Date(FIXTURE_EPOCH + 100));
      expect(subscriber.events).toEqual([0, "ready"]);
    });
  });

  it("replays a hook toggled after the cutoff, carrying the toggled state", async () => {
    await withActionWorkspace(async context => {
      let controllerKey = `${context.workspaceId}:action-history-hook`;
      await withHookController(context, async (controller, storage, instance) => {
        await controller.register(controllerKey);
        putAction(storage, 0, {
          type: "bindHook", state: "pending", gadgetId: context.gadgetId, hookId: 7,
          caller: {from: "hook", gadgetId: context.gadgetId},
        });
        let provider = Reflect.get(instance["impl"].env, "LOCAL_ACTION_PROVIDER");
        let gatekeeperClass = await provider.getClass();
        storage.gatekeepers.put({
          id: 1,
          class: gatekeeperClass,
          hook: HOOK_ENTRYPOINT,
          creationSpec: {
            type: "gatekeeper",
            vendorId: "email",
            resourceUrl: "https://example.com/resource",
            typeUrlPattern: "https://*",
          },
        });
        let callback = await controller.getPersistentCallback();
        storage.boundHooks.put({
          id: 7,
          actionId: 0,
          gatekeeperId: 1,
          gadgetId: context.gadgetId,
          controller: await controller.getPersistentController(),
          callback,
          description: {title: "Hook 7", description: "Action history hook fixture"},
          enabled: true,
        });
      });
      await context.workspace.disableHook(7);
      expect(await localHookController.read()).toMatchObject({
        key: controllerKey, registered: true, enabled: false, deleted: false,
      });
      let subscriber = new ActionCollector();
      using _subscription = await context.workspace.subscribeToActions(
          subscriber, new Date(FIXTURE_EPOCH + 100));
      expect(subscriber.entries.map(entry => entry.id)).toEqual([0]);
      expect(subscriber.entries[0]).toMatchObject({type: "bindHook", enabled: false});
    });
  });

  it("rejects the resume replay when the subscriber fails mid-sweep", async () => {
    await withActionWorkspace(async context => {
      await withLiveStorage(context, storage => {
        // More than one page, so the failure must also stop the sweep from advancing.
        for (let id = 0; id <= ACTION_REPLAY_PAGE_SIZE; id++) {
          putAction(storage, id, {gadgetId: context.gadgetId});
        }
      });
      await runInDurableObject(context.native, async instance => {
        let controller = Reflect.get(instance["impl"].env, "LOCAL_HOOK_CONTROLLER");
        let subscriber = await controller.getFailingSubscriber();
        let overseer = await instance.open(
            context.ownerId, FAMILY_ACCESS_ADULT.email, new NativeRpcStub(() => {}));
        // Keep this negative callback boundary on native RPC. Crossing the same rejection through
        // the public Cap'n Web WebSocket duplicates the intentionally failing entry future in the
        // vitest worker, while the public replay cases above exercise the WebSocket path normally.
        expect((await rejection(overseer.subscribeToActions(subscriber, new Date(0)))).message)
            .toBe("entry failed");
        let subscriberState = await subscriber.state();
        expect(subscriberState.readyCalled).toBe(false);
        expect(subscriberState.entries).toBeLessThanOrEqual(ACTION_REPLAY_PAGE_SIZE);
        subscriber[Symbol.dispose]();
        overseer[Symbol.dispose]();
      });
    });
  });

  it("stops delivering after the subscription is disposed", async () => {
    await withActionWorkspace(async context => {
      await withLiveStorage(context, storage => {
        putAction(storage, 0, {gadgetId: context.gadgetId});
      });
      let subscriber = new ActionCollector();
      let subscription = await context.workspace.subscribeToActions(subscriber);
      subscription[Symbol.dispose]();
      await scheduler.wait(0);  // let the stub's disposer run
      await withLiveStorage(context, storage => putAction(storage, 1, {
        gadgetId: context.gadgetId,
      }));
      await scheduler.wait(0);

      expect(subscriber.events).toEqual(["ready"]);
    });
  });
});

describe("listActions", () => {
  it("returns records newest-first, pending included", async () => {
    await withActionWorkspace(async context => {
      await withLiveStorage(context, storage => {
        putAction(storage, 0, {state: "approved", gadgetId: context.gadgetId});
        putAction(storage, 1, {gadgetId: context.gadgetId});
        putAction(storage, 2, {state: "rejected", gadgetId: context.gadgetId});
        putAction(storage, 3, {
          type: "observation", state: "approved", gadgetId: context.gadgetId,
        });
      });
      let page = await context.workspace.listActions();
      expect(page.entries.map(entry => entry.id)).toEqual([3, 2, 1, 0]);
      expect(page.nextCursor).toBeUndefined();
    });
  });

  it("filters by record type, pending included", async () => {
    await withActionWorkspace(async context => {
      await withLiveStorage(context, storage => {
        putAction(storage, 0, {state: "approved", gadgetId: context.gadgetId});
        putAction(storage, 1, {
          type: "observation", state: "approved", gadgetId: context.gadgetId,
        });
        putAction(storage, 2, {
          type: "bindHook", state: "approved", gadgetId: context.gadgetId,
        });
        putAction(storage, 3, {
          type: "observation", state: "pending", gadgetId: context.gadgetId,
        });
      });
      let page = await context.workspace.listActions({filter: "observation"});
      expect(page.entries.map(entry => entry.id)).toEqual([3, 1]);
    });
  });

  it("applies the default limit and reports more history", async () => {
    await withActionWorkspace(async context => {
      await withLiveStorage(context, storage => {
        let total = ACTION_HISTORY_PAGE_DEFAULT_LIMIT + 10;
        for (let id = 0; id < total; id++) {
          putAction(storage, id, {state: "approved", gadgetId: context.gadgetId});
        }
      });
      let first = await context.workspace.listActions();
      expect(first.entries.length).toBe(ACTION_HISTORY_PAGE_DEFAULT_LIMIT);
      expect(first.nextCursor).toEqual(expect.any(String));
      let cursor = first.nextCursor;
      if (cursor === undefined) throw new Error("Expected an action history cursor.");

      let second = await context.workspace.listActions({cursor});
      expect(second.entries.length).toBe(10);
      expect(second.nextCursor).toBeUndefined();
    });
  });

  it("returns sparse matches in one full page, however much history buries them", async () => {
    await withActionWorkspace(async context => {
      await withLiveStorage(context, storage => {
        // A few observations buried under far more history than the old design's per-call scan cap:
        // the index-backed read must surface them in ONE call, with no cursor dance.
        putAction(storage, 0, {
          type: "observation", state: "approved", gadgetId: context.gadgetId,
        });
        putAction(storage, 1, {
          type: "observation", state: "rejected", gadgetId: context.gadgetId,
        });
        for (let id = 2; id < 550; id++) {
          putAction(storage, id, {state: "approved", gadgetId: context.gadgetId});
        }
      });
      let page = await context.workspace.listActions({filter: "observation"});
      expect(page.entries.map(entry => entry.id)).toEqual([1, 0]);
      expect(page.nextCursor).toBeUndefined();
    });
  });

  it("pages without overlap or gaps", async () => {
    await withActionWorkspace(async context => {
      let expected: number[] = [];
      await withLiveStorage(context, storage => {
        for (let id = 0; id < 130; id++) {
          // Mixed states, so the "all" pages span records with differing byHistoryFilter keys.
          putAction(storage, id, {
            state: id % 4 === 0 ? "pending" : "approved", gadgetId: context.gadgetId,
          });
          expected.unshift(id);
        }
      });
      let ids: number[] = [];
      let cursor: string | undefined;
      do {
        let page = await context.workspace.listActions({cursor});
        ids.push(...page.entries.map(entry => entry.id));
        cursor = page.nextCursor;
      } while (cursor !== undefined);

      expect(ids).toEqual(expected);
    });
  });

  it("rejects an invalid action history cursor", async () => {
    await withActionWorkspace(async context => {
      await runInDurableObject(context.native, async instance => {
        let overseer = await instance.open(
            context.ownerId, FAMILY_ACCESS_ADULT.email, new NativeRpcStub(() => {}));
        // Assert this malformed cursor on native RPC so the expected rejection is not duplicated
        // by the Cap'n Web WebSocket test transport; normal pagination remains public above.
        expect((await rejection(overseer.listActions({cursor: "not-a-cursor"}))).message)
            .toBe("Invalid action history cursor.");
        overseer[Symbol.dispose]();
      });
    });
  });
});

describe("listActions with the pending filter", () => {
  it("returns pendings of any type newest-first across gatekeepers, excluding resolved", async () => {
    await withActionWorkspace(async context => {
      await withLiveStorage(context, storage => {
        putAction(storage, 0, {gatekeeperId: 2, gadgetId: context.gadgetId});
        putAction(storage, 1, {
          state: "approved", gatekeeperId: 2, gadgetId: context.gadgetId,
        });
        putAction(storage, 2, {
          type: "bindHook", state: "pending", gatekeeperId: 1, gadgetId: context.gadgetId,
        });
        putAction(storage, 3, {
          state: "rejected", gatekeeperId: 2, gadgetId: context.gadgetId,
        });
        putAction(storage, 4, {gatekeeperId: 3, gadgetId: context.gadgetId});
      });
      // The index groups by gatekeeper; the page must still be one id-ordered (descending) stream.
      let page = await context.workspace.listActions({filter: "pending"});
      expect(page.entries.map(entry => entry.id)).toEqual([4, 2, 0]);
      expect(page.nextCursor).toBeUndefined();
    });
  });

  it("pages to exhaustion without overlap or gaps", async () => {
    await withActionWorkspace(async context => {
      let expected: number[] = [];
      await withLiveStorage(context, storage => {
        for (let id = 0; id < ACTION_HISTORY_PAGE_DEFAULT_LIMIT * 2 + 30; id++) {
          let pending = id % 3 !== 0;
          putAction(storage, id, {
            state: pending ? "pending" : "approved", gatekeeperId: id % 4,
            gadgetId: context.gadgetId,
          });
          if (pending) expected.unshift(id);
        }
      });
      let ids: number[] = [];
      let cursor: string | undefined;
      do {
        let page = await context.workspace.listActions({filter: "pending", cursor});
        expect(page.entries.length).toBeLessThanOrEqual(ACTION_HISTORY_PAGE_DEFAULT_LIMIT);
        ids.push(...page.entries.map(entry => entry.id));
        cursor = page.nextCursor;
      } while (cursor !== undefined);

      expect(ids).toEqual(expected);
    });
  });

  it("reflects a resolution between pages: the record stops appearing", async () => {
    await withActionWorkspace(async context => {
      await withLiveStorage(context, storage => {
        let total = ACTION_HISTORY_PAGE_DEFAULT_LIMIT + 10;
        for (let id = 0; id < total; id++) {
          putAction(storage, id, {gadgetId: context.gadgetId});
        }
      });

      let first = await context.workspace.listActions({filter: "pending"});
      expect(first.entries.length).toBe(ACTION_HISTORY_PAGE_DEFAULT_LIMIT);
      let cursor = first.nextCursor;
      if (cursor === undefined) throw new Error("Expected an action history cursor.");

      // Resolve a record that would have been on the second page.
      await withLiveStorage(context, storage => {
        let record = storage.actions.get(5)!;
        record.state = "approved";
        storage.actions.put(record);
      });

      let second = await context.workspace.listActions({filter: "pending", cursor});
      expect(second.entries.map(entry => entry.id)).toEqual([9, 8, 7, 6, 4, 3, 2, 1, 0]);
      expect(second.nextCursor).toBeUndefined();
    });
  });

  it("sees records written before the indexes existed once a rebuild backfills them", async () => {
    await withActionWorkspace(async context => {
      await runInDurableObject(context.native, (instance, state) => {
        // Mirrors the version-3 migration: records predate the index declarations, so each index
        // starts empty until the migration's rebuild() runs.
        let legacy = makePreIndexActionStorage(state.storage);
        putAction(legacy, 0, {gadgetId: context.gadgetId});
        putAction(legacy, 1, {state: "approved", gadgetId: context.gadgetId});
        putAction(legacy, 2, {gadgetId: context.gadgetId});
        putAction(legacy, 3, {
          type: "observation", state: "rejected", gadgetId: context.gadgetId,
        });

        let storage: ActionTestStorage = instance["impl"].storage;
        storage.actions.pendingByGatekeeper.rebuild();
        storage.actions.byHistoryFilter.rebuild();
        storage.actions.byLastChanged.rebuild();
      });

      // Every filter serves the legacy records.
      expect((await context.workspace.listActions({filter: "pending"})).entries
          .map(entry => entry.id)).toEqual([2, 0]);
      expect((await context.workspace.listActions()).entries.map(entry => entry.id))
          .toEqual([3, 2, 1, 0]);
      expect((await context.workspace.listActions({filter: "action"})).entries
          .map(entry => entry.id)).toEqual([2, 1, 0]);
      expect((await context.workspace.listActions({filter: "observation"})).entries
          .map(entry => entry.id)).toEqual([3]);

      // Resolving a backfilled record must not throw on any index's update.
      await withLiveStorage(context, storage => {
        let record = storage.actions.get(2)!;
        record.state = "approved";
        record.appliedAt = new Date(FIXTURE_EPOCH + 100);
        storage.actions.put(record);
      });
      expect((await context.workspace.listActions({filter: "pending"})).entries
          .map(entry => entry.id)).toEqual([0]);
      expect((await context.workspace.listActions()).entries.map(entry => entry.id))
          .toEqual([3, 2, 1, 0]);

      // The resume replay serves the backfilled records too.
      let subscriber = new ActionCollector();
      using _subscription = await context.workspace.subscribeToActions(
          subscriber, new Date(FIXTURE_EPOCH + 3));
      expect(subscriber.events).toEqual([3, 2, "ready"]);
    });
  });
});

describe("UseOverseerInterface", () => {
  it("answers listActions with an empty terminal page and the subscription inertly", async () => {
    await withActionWorkspace(async context => {
      let subscriber = new ActionCollector();
      let subscription!: RpcStub<{}>;
      await runInDurableObject(context.native, async instance => {
        let storage: ActionTestStorage = instance["impl"].storage;
        putAction(storage, 0, {gadgetId: context.gadgetId});
        putAction(storage, 1, {state: "approved", gadgetId: context.gadgetId});

        using owner = new RpcStub<Overseer>(await instance.open(
            context.ownerId, FAMILY_ACCESS_ADULT.email, new NativeRpcStub(() => {})));
        let share = unwrapFamilyRpcResult(await owner.createShareLink("use"));
        let viewerEmail = `action-use-viewer-${context.workspaceId}@integration.test`;
        let viewerId = exports.UserDurableObject.idFromName(viewerEmail).toString();
        let viewerUser = exports.UserDurableObject.get(
            exports.UserDurableObject.idFromName(viewerEmail));
        await viewerUser.loginOrCreateViaGatekeeper(viewerEmail, true);
        using viewer = new RpcStub<Overseer>(await instance.open(
            viewerId, viewerEmail, new NativeRpcStub(() => {}), share.key));
        expect(await viewer.listActions()).toEqual({entries: []});
        expect(await viewer.listActions({filter: "pending"})).toEqual({entries: []});

        subscription = await viewer.subscribeToActions(subscriber);
        putAction(instance["impl"].storage, 2, {gadgetId: context.gadgetId});
      });
      await subscriber.readyReceived;
      subscription[Symbol.dispose]();
      expect(subscriber.events).toEqual(["ready"]);  // settled empty; nothing replayed or delivered
    });
  });
});
