import { actionKey, compareActionOrder } from './actionIdentity'
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { RpcStub, RpcTarget } from 'capnweb'
import { ActionLogEntry, ActionsSubscriber, Overseer, actionChangeTime } from '@gadgets/workshop-shared/api'

// One ref-counted store per Overseer stub, shared across consumers. On open the store initiates
// the live subscription first, then pages the currently-pending set via
// listActions({filter: 'pending'}): await registration on every host before the first page
// reads, so every record is covered — pages snapshot call-time state, and
// everything that changes after arrives on the subscription. Pages fold with live-wins
// semantics; the last page loading is the "settled" signal. Resolved history is demand-paged
// separately (see useActionHistory).
//
// Stubs registered through linkActionLog() additionally park a resume watermark: a settled store
// records its last change time by workspace key on close, and the next store with the same key
// subscribes with startAfter — the server replays the gap (inclusive, as upserts) through the
// subscription, so per-record consumers are patched without refetching.

export type ActionsState = {
  /**
   * 'checking' until the subscription is registered and the last pending page has loaded;
   * 'error' if either failed (`pending` keeps whatever was gathered).
   */
  status: 'checking' | 'ready' | 'error'

  /** Pending-review records found so far, oldest first (createdAt, then id). */
  pending: readonly ActionLogEntry[]
}

type Store = {
  // Immutable object handed to useSyncExternalStore; rebuilt from the staged fields on commit.
  snapshot: ActionsState
  stagedPending: Map<string, ActionLogEntry>
  // Records delivered on the live subscription (only — paged records are not entries), retained
  // for useActionEntries' mount-time replay.
  stagedEntries: Map<string, ActionLogEntry>
  refCount: number
  listeners: Set<() => void>
  entryListeners: Set<(record: ActionLogEntry) => void>
  subscription: RpcStub<{}> | null
  generation: number
  notifyScheduled: boolean
  // Max change time (actionChangeTime, the server's index key) received this session, live or
  // paged. Every change a settled session missed has change time ≥ its disconnect time ≥ this
  // max, so an inclusive startAfter replay from it covers the gap.
  lastChanged: Date | undefined
  resumed: boolean
}

const EMPTY_STATE: ActionsState = {
  status: 'checking',
  pending: [],
}

const stores = new WeakMap<RpcStub<Overseer>, Store>()

const storeKeys = new WeakMap<RpcStub<Overseer>, string>()
// Never deleted: a failed later session leaves the last good watermark in place, and resuming
// from an older watermark just replays more.
const watermarks = new Map<string, Date>()

/**
 * Give the stub a stable workspace identity so its store parks a resume watermark on close and
 * a later stub with the same key replays the gap. Unlinked stubs always open blind.
 */
export function linkActionLog(overseer: RpcStub<Overseer>, key: string): void {
  storeKeys.set(overseer, key)
}

/**
 * Whether the stub's store subscribed with startAfter — its gap is replayed as entries.
 * Consumers may trust this without a failure path: a resumed session that later errors surfaces
 * as store status 'error' and never parks a watermark, so the next stub swap replays its entire
 * gap from the last good one.
 */
export function actionLogResumed(overseer: RpcStub<Overseer> | null,
  previous?: RpcStub<Overseer> | null): boolean {
  if (!overseer || !stores.get(overseer)?.resumed) return false
  return previous === undefined || (previous !== null
    && storeKeys.get(previous) !== undefined && storeKeys.get(previous) === storeKeys.get(overseer))
}

function getStore(overseer: RpcStub<Overseer>): Store {
  let store = stores.get(overseer)
  if (!store) {
    store = {
      snapshot: EMPTY_STATE,
      stagedPending: new Map(),
      stagedEntries: new Map(),
      refCount: 0,
      listeners: new Set(),
      entryListeners: new Set(),
      subscription: null,
      generation: 0,
      notifyScheduled: false,
      lastChanged: undefined,
      resumed: false,
    }
    stores.set(overseer, store)
  }
  return store
}

function commit(store: Store, status: ActionsState['status'] = store.snapshot.status): void {
  // IDs are only ordered inside their host; merge all hosts by creation time and identity.
  const pending = [...store.stagedPending.values()].toSorted((a, b) =>
    compareActionOrder(a, b))
  store.snapshot = { status, pending }
  for (const listener of store.listeners) listener()
}

// Coalesce bursts of entries into one snapshot per frame. Status transitions commit synchronously
// instead (see openSubscription) so a throttled background tab still settles.
function scheduleNotify(store: Store) {
  if (store.notifyScheduled) return
  store.notifyScheduled = true

  window.requestAnimationFrame(() => {
    store.notifyScheduled = false
    commit(store)
  })
}

// Bumps the generation (orphaning any in-flight callbacks) and clears the staged session state.
function resetSession(store: Store): number {
  store.generation++
  store.stagedPending = new Map()
  store.stagedEntries = new Map()
  store.snapshot = EMPTY_STATE
  store.lastChanged = undefined
  store.resumed = false
  return store.generation
}

function trackChange(store: Store, record: ActionLogEntry): void {
  const changed = actionChangeTime(record)
  if (!store.lastChanged || changed > store.lastChanged) store.lastChanged = changed
}

function openSubscription(overseer: RpcStub<Overseer>, store: Store) {
  const generation = resetSession(store)
  const key = storeKeys.get(overseer)
  const startAfter = key === undefined ? undefined : watermarks.get(key)
  store.resumed = startAfter !== undefined

  class ActionsSubscriberImpl extends RpcTarget implements ActionsSubscriber {
    entry(record: ActionLogEntry): void {
      if (store.generation !== generation) return
      trackChange(store, record)
      store.stagedEntries.set(actionKey(record), record)
      let pendingChanged: boolean
      if (record.state === 'pending') {
        store.stagedPending.set(actionKey(record), record)
        pendingChanged = true
      } else {
        pendingChanged = store.stagedPending.delete(actionKey(record))
      }
      // Entries that never touch the pending set (observations, hook events) don't need a
      // re-sorted snapshot or a consumer re-render.
      if (pendingChanged) scheduleNotify(store)
      for (const listener of store.entryListeners) {
        try {
          listener(record)
        } catch (err) {
          console.error('Action entry listener failed:', err)
        }
      }
    }

    // Settledness is signalled by the pending page loop draining, not by the subscription.
    ready(): void {}
  }
  const subscriber = new ActionsSubscriberImpl() as unknown as RpcStub<ActionsSubscriber>

  const fail = (error: unknown) => {
    if (store.generation !== generation) return
    console.error('Failed to load pending actions:', error)
    commit(store, 'error')
  }

  // A moved gadget registers on another host asynchronously. Await the full subscription
  // before paging so an action cannot land between that host's snapshot and registration.
  const subscribed = startAfter
    ? overseer.subscribeToActions(subscriber, startAfter)
    : overseer.subscribeToActions(subscriber)


  // One page in flight at a time. Records created mid-paging are live-only (their ids are above
  // page 1's snapshot bound), so the fold only has to resolve one conflict class: a page's stale
  // copy of a record the subscription already delivered — the subscription's copy (in any state)
  // is newer by definition, so a record resolved live is never re-marked pending by a page that
  // predates the resolution.
  ;(async () => {
    const sub = await subscribed
    if (store.generation !== generation) {
      sub[Symbol.dispose]()
      return
    }
    store.subscription = sub
    let cursor: string | undefined
    do {
      const page = await overseer.listActions({ filter: 'pending', cursor })
      if (store.generation !== generation) return
      for (const record of page.entries) {
        trackChange(store, record)
        if (!store.stagedEntries.has(actionKey(record))) store.stagedPending.set(actionKey(record), record)
      }
      cursor = page.nextCursor
      scheduleNotify(store)
    } while (cursor !== undefined)
    // Synchronous commit so a throttled background tab still settles.
    commit(store, 'ready')
  })().catch(fail)
}

function closeSubscription(overseer: RpcStub<Overseer>, store: Store) {
  const key = storeKeys.get(overseer)
  // Only a cleanly settled session sets the watermark: pages drained AND subscribe resolved. The
  // second condition is load-bearing — a page-only watermark is poison, because a pending
  // record's createdAt can exceed a resolution the dead live stream never delivered, hiding it
  // from every future replay.
  if (key !== undefined && store.snapshot.status === 'ready' && store.subscription !== null &&
      store.lastChanged) {
    watermarks.set(key, store.lastChanged)
  }
  resetSession(store)
  store.subscription?.[Symbol.dispose]()
  store.subscription = null
}

function acquire(overseer: RpcStub<Overseer>): Store {
  const store = getStore(overseer)
  store.refCount++
  if (store.refCount === 1) {
    openSubscription(overseer, store)
  }
  return store
}

function release(overseer: RpcStub<Overseer>) {
  const store = stores.get(overseer)
  if (!store) return
  store.refCount--
  if (store.refCount <= 0) {
    closeSubscription(overseer, store)
    stores.delete(overseer)
  }
}

/** Subscribe to the gadget's action log. Pass `null` to no-op ('checking', empty maps). */
export function useActions(overseer: RpcStub<Overseer> | null): ActionsState {
  useEffect(() => {
    if (!overseer) return
    acquire(overseer)
    return () => release(overseer)
  }, [overseer])

  const subscribe = useCallback((cb: () => void) => {
    if (!overseer) return () => {}
    const store = getStore(overseer)
    store.listeners.add(cb)
    return () => { store.listeners.delete(cb) }
  }, [overseer])
  const getSnapshot = useCallback(() => {
    if (!overseer) return EMPTY_STATE
    return stores.get(overseer)?.snapshot ?? EMPTY_STATE
  }, [overseer])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * Per-entry callback variant. Fires once per entry delivered on the live subscription (paged
 * pending records are not entries); on mount it replays the records already received this
 * session. That covers patching content fetched over the same stub: anything fetched reflects
 * the log at fetch time, and everything that changed since arrived through the stream.
 */
export function useActionEntries(
  overseer: RpcStub<Overseer> | null,
  onEntry: (record: ActionLogEntry) => void,
): void {
  const callbackRef = useRef(onEntry)
  callbackRef.current = onEntry

  useEffect(() => {
    if (!overseer) return

    function listener(record: ActionLogEntry): void {
      callbackRef.current(record)
    }

    const store = acquire(overseer)
    store.entryListeners.add(listener)

    // Retained until `release()` drops refCount to 0 and deletes the store, so late
    // consumers can replay already-received entries while a shared subscription is still alive.
    for (const record of store.stagedEntries.values()) {
      listener(record)
    }

    return () => {
      const s = stores.get(overseer)
      s?.entryListeners.delete(listener)
      release(overseer)
    }
  }, [overseer])
}
