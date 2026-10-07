import { RpcPromise, RpcStub, newWebSocketRpcSession } from 'capnweb'
import { PublicApi } from '@gadgets/workshop-shared/api'
import { getBackendHost } from './connectHandoff'

// WebSocket RPC connection management.
//
// React's useEffect / useState machinery is kind of obnoxious in that, in dev mode, it runs
// everything twice (runs once, immediately cleans up, then runs again). This isn't so good for
// our WebSocket as it means we are creating redundant connections to the server and throwing
// them away instantly. It gets even worse when we start trying to handle disconnects gracefully:
// we can end up with two connections that are fighting to replace each other.
//
// Or maybe I (Kenton) was just holding it wrong, idk.
//
// Anyway, the connection management lives in this module's state instead of React state.

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 10000;
// Generous probe deadlines let a slow-but-alive backend settle instead of connect/dispose looping
// (or, on wake, tearing down a healthy socket under load).
const RECONNECT_PROBE_TIMEOUT_MS = 20000;
const WAKE_PROBE_TIMEOUT_MS = 10000;
const WAKE_PROBE_MIN_IDLE_MS = 15000;

/**
 * An open RPC socket pins the Overseer Durable Object awake for as long as the Worker holds the
 * stub — roughly 10,750 GB-s/day for a tab nobody is looking at. After this long continuously
 * hidden, the tab deliberately closes its socket; it reconnects the moment it becomes visible.
 */
export const IDLE_DISCONNECT_MS = 15 * 60 * 1000;

/** Snapshot of the current stub plus whether the connection is known-broken. */
export interface RpcConnectionState {
  stub: RpcStub<PublicApi>;
  connectionLost: boolean;
}

/** A managed WebSocket RPC session with backoff reconnect, wake probes, and idle disconnect. */
export interface RpcConnection {
  /** Callbacks fired whenever the current stub or connection state is updated. */
  readonly subscribers: Set<() => void>;
  /** Current stub plus whether the connection is known-broken, as one atomic snapshot. */
  getState(): RpcConnectionState;
  /** Removes event listeners and releases parked reconnect waits (test teardown). */
  destroy(): void;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const disposeQuietly = (stub: RpcStub<PublicApi>) => {
  try { stub[Symbol.dispose](); } catch { /* already broken */ }
};

/**
 * Starts a managed connection: `connect()` is called once immediately and again from the
 * backoff reconnect loop after the socket breaks while the tab is visible.
 */
export function createRpcConnection(connect: () => RpcStub<PublicApi>): RpcConnection {
  let currentStub: RpcStub<PublicApi>;
  let lastConnectTime = 0;
  let connectionLost = false;
  // True while a reconnect() loop is in flight, including parked on `untilVisible`. Distinguishes
  // "a loop will resume by itself" from "nobody is reconnecting" when the tab becomes visible.
  let reconnecting = false;
  let probing = false;
  let lastProvenAt = Date.now();
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let visibleWaiters: Array<() => void> = [];
  let destroyed = false;

  const subscribers = new Set<() => void>();
  const notifySubscribers = () => subscribers.forEach(cb => cb());

  const untilVisible = () => new Promise<void>(resolve => { visibleWaiters.push(resolve); });

  function startConnection(): RpcStub<PublicApi> {
    lastConnectTime = Date.now();
    const stub = connect();
    stub.onRpcBroken(handleBroken);
    return stub;
  }

  // Publishes a stub for the connection we have not made yet, so the dead one stops being
  // reachable immediately. capnweb queues calls pipelined onto an unresolved `RpcPromise` and
  // delivers them, in order, once it resolves — so work issued during the outage waits for the
  // replacement instead of failing against a socket known to be gone. The `RpcPromise` takes
  // ownership of its resolution, keeping the proven stub on a single disposal path.
  function publishReconnect() {
    reconnecting = true;
    currentStub = new RpcPromise<PublicApi>(reconnect().finally(() => { reconnecting = false; }));
    notifySubscribers();
  }

  // Connects with jittered backoff until a candidate answers a probe, and resolves only to that
  // proven connection: capnweb queues sends while a socket is still CONNECTING, so an unproven stub
  // looks fine right up until everything pipelined onto it fails at once.
  async function reconnect(): Promise<RpcStub<PublicApi>> {
    // Fast recovery from one-off blips: skip the first backoff if the dying connection was up a while.
    let skipSleep = Date.now() - lastConnectTime >= INITIAL_BACKOFF_MS;
    let backoff = INITIAL_BACKOFF_MS;
    for (;;) {
      // A hidden tab holds no socket and starts none — every open connection pins the Overseer
      // Durable Object awake, which is exactly what the idle disconnect exists to stop. The loop
      // parks here until the tab is visible again, then attempts immediately.
      while (document.visibilityState === 'hidden') {
        await untilVisible();
        if (destroyed) break;
      }
      if (!skipSleep) {
        await sleep(backoff * (0.85 + 0.3 * Math.random()));  // jittered against stampedes
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
        if (document.visibilityState === 'hidden') {
          // The tab hid during the backoff sleep: repark rather than burn one attempt, and skip
          // the wait once it wakes.
          skipSleep = true;
          continue;
        }
      }
      skipSleep = false;

      const candidate = startConnection();
      try {
        await withTimeout(candidate.ping(), RECONNECT_PROBE_TIMEOUT_MS);
      } catch (probeError) {
        console.debug('Reconnect attempt failed:', probeError);
        disposeQuietly(candidate);
        continue;
      }

      lastProvenAt = Date.now();
      connectionLost = false;
      console.warn('RPC connection restored.');
      notifySubscribers();
      return candidate;
    }
  }

  // Subscribers hear exactly twice per outage — lost here, restored in `reconnect` — because
  // `currentStub` is replaced once, by a promise, rather than once per attempt.
  function handleBroken(error: unknown) {
    if (connectionLost || destroyed) return;  // stale/disposed stub, or recovery already underway
    connectionLost = true;

    console.warn('RPC connection lost:', error);

    // A socket that dies while the tab is hidden is not re-established until the tab becomes
    // visible again: reconnecting a tab nobody is looking at keeps the Durable Object awake for
    // nothing. onVisibilityChange publishes the same reconnect path on `visible`. Subscribers are
    // not notified while hidden — there is nobody to see it, and the visible-time publish keeps
    // the "exactly twice per outage" invariant intact.
    if (document.visibilityState === 'hidden') return;

    publishReconnect();
  }

  // Passive close detection misses sockets killed during laptop sleep or tab throttling, so on
  // tab-visible / network-online signals probe the connection instead of letting the user's next
  // action hang on a zombie socket.
  async function probeOnWake() {
    if (connectionLost || probing || Date.now() - lastProvenAt < WAKE_PROBE_MIN_IDLE_MS) return;
    probing = true;
    const suspect = currentStub;
    try {
      await withTimeout(suspect.ping(), WAKE_PROBE_TIMEOUT_MS);
      lastProvenAt = Date.now();
    } catch (error) {
      if (currentStub !== suspect || connectionLost) return;  // a real broken event won the race
      console.warn('Connection unresponsive after wake:', error);
      // Disposal fires onRpcBroken → handleBroken recovers. Its skip-first-backoff path retries
      // immediately — right for "the network just came back".
      disposeQuietly(suspect);
    } finally {
      probing = false;
    }
  }

  // Fires after IDLE_DISCONNECT_MS continuously hidden. Marking the connection lost before
  // disposing does two things at once: the onRpcBroken that disposal fires lands on the
  // already-lost guard in handleBroken (a deliberate close must not start the backoff loop while
  // the tab stays hidden), and the visible-time path knows to reconnect rather than just probe.
  function disconnectForIdle() {
    idleTimer = undefined;
    if (destroyed || document.visibilityState !== 'hidden' || connectionLost) return;
    connectionLost = true;
    console.warn(`Tab hidden for ${IDLE_DISCONNECT_MS}ms — closing RPC connection until the tab is visible again.`);
    disposeQuietly(currentStub);
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      // `??=` keeps the timer running when the event repeats without a visible gap; visible
      // clears it below, so this counts 15 continuous hidden minutes, not cumulative ones.
      idleTimer ??= setTimeout(disconnectForIdle, IDLE_DISCONNECT_MS);
      return;
    }
    clearTimeout(idleTimer);
    idleTimer = undefined;
    const waiters = visibleWaiters;
    visibleWaiters = [];
    for (const wake of waiters) wake();
    if (connectionLost) {
      // `reconnecting` means a loop is parked on `untilVisible` and just resumed — it will notify
      // subscribers itself once the probe succeeds, so there is nothing to do here.
      if (!reconnecting) publishReconnect();
    } else {
      void probeOnWake();
    }
  }

  const onOnline = () => void probeOnWake();
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('online', onOnline);

  currentStub = startConnection();

  return {
    subscribers,
    getState: () => ({ stub: currentStub, connectionLost }),
    destroy() {
      destroyed = true;
      clearTimeout(idleTimer);
      idleTimer = undefined;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
      const waiters = visibleWaiters;
      visibleWaiters = [];
      for (const wake of waiters) wake();
    },
  };
}

/** Creates the production connection to `/api` on the deployment's backend host. */
export function createWebSocketRpcConnection(): RpcConnection {
  return createRpcConnection(() => {
    const apiHost = getBackendHost();
    const wsUrl = (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + apiHost + '/api';
    return newWebSocketRpcSession<PublicApi>(wsUrl);
  });
}
