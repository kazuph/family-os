import { collection, createTypedStorage } from "@gadgets/typed-storage";
import { makeOverseerStorage } from "../src/overseer.js";
import type { ActionRecord } from "../src/overseer.js";

/** Storage shape used by the real action-log records in an Overseer Durable Object. */
export type ActionTestStorage = ReturnType<typeof makeOverseerStorage>;

/** Base timestamp for fixture records: putAction stamps createdAt = FIXTURE_EPOCH + id. */
export const FIXTURE_EPOCH = 1700000000000;

/** Entrypoint name exported by the fixed local hook-controller callback fixture. */
export const HOOK_ENTRYPOINT = "HookCallback";

/**
 * Put one action-log record into real typed storage while keeping the allocator ahead of it.
 * The factory only creates records; callers choose the actual storage instance.
 */
export function putAction(
    storage: Pick<ActionTestStorage, "actions" | "nextActionId">,
    id: number,
    opts: {
      state?: ActionRecord["state"],
      type?: ActionRecord["type"],
      gatekeeperId?: number,
      actionTag?: string,
      autoApprovable?: boolean,
      createdAt?: Date,
      appliedAt?: Date,
      gadgetId?: number,
      hookId?: number,
      caller?: ActionRecord["caller"],
    } = {}) {
  let base = {
    id,
    gatekeeperId: opts.gatekeeperId ?? 1,
    caller: opts.caller ?? (opts.gadgetId === undefined
        ? {from: "agent", chatId: 1} as const
        : {from: "gadget", gadgetId: opts.gadgetId} as const),
    resourceTitle: `Resource ${id}`,
    createdAt: opts.createdAt ?? new Date(FIXTURE_EPOCH + id),
    ...(opts.appliedAt !== undefined ? {appliedAt: opts.appliedAt} : {}),
    state: opts.state ?? "pending",
  };
  let description = {title: `Action ${id}`, description: `Action ${id} description`};
  let type = opts.type ?? "action";
  if (type === "action") {
    storage.actions.put({...base, type, action: id, description: {
      ...description,
      implementsRevert: true,
      actionKind: {tag: opts.actionTag ?? "edit", label: "Edits"},
      autoApprovable: opts.autoApprovable ?? true,
    }});
  } else if (type === "observation") {
    storage.actions.put({...base, type, description});
  } else {
    storage.actions.put({...base, type, description, enabled: true,
      ...(opts.hookId === undefined ? {} : {hookId: opts.hookId})});
  }
  if (id >= storage.nextActionId.get()) storage.nextActionId.put(id + 1);
}

/**
 * Declare only the primary-key action collection over the same SQLite database. This mirrors a
 * pre-index workspace so the real Overseer index rebuild can be exercised afterward.
 */
export function makePreIndexActionStorage(storage: DurableObjectStorage) {
  return createTypedStorage(storage, {
    singletons: {nextActionId: 0},
    collections: {actions: collection<ActionRecord>()({primaryKey: "id"})},
  });
}
