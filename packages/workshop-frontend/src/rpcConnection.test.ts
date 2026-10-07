// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RpcStub } from 'capnweb'
import { PublicApi } from '@gadgets/workshop-shared/api'
import { createRpcConnection, IDLE_DISCONNECT_MS, type RpcConnection } from './rpcConnection'

let visibility: DocumentVisibilityState = 'visible'

Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })

const fireVisibility = (state: DocumentVisibilityState) => {
  visibility = state
  document.dispatchEvent(new Event('visibilitychange'))
}

interface FakeStub {
  stub: RpcStub<PublicApi>
  ping: ReturnType<typeof vi.fn<() => Promise<void>>>
  dispose: ReturnType<typeof vi.fn<() => void>>
  break: (error?: unknown) => void
}

function makeFakeStub(ping?: () => Promise<void>): FakeStub {
  let broken: ((error: unknown) => void) | undefined
  const pingMock = vi.fn<() => Promise<void>>(ping ?? (() => Promise.resolve()))
  // Real sessions report onRpcBroken when the main stub is disposed (session shutdown), so the
  // fake does too — the connection code relies on its own guard to ignore that callback.
  const disposeMock = vi.fn<() => void>(() => {
    broken?.(new Error('RPC session was shut down by disposing the main stub'))
  })
  const stub = {
    ping: pingMock,
    onRpcBroken: (cb: (error: unknown) => void) => { broken = cb },
    [Symbol.dispose]: disposeMock,
  }
  return {
    stub: stub as unknown as RpcStub<PublicApi>,
    ping: pingMock,
    dispose: disposeMock,
    break: (error) => broken?.(error ?? new Error('test: socket broken')),
  }
}

const connections: RpcConnection[] = []

// Each stub produced by `connect` asks `ping` for its behavior, so tests can flip failure on and
// off between reconnect attempts.
function setup(ping?: () => Promise<void>) {
  const stubs: FakeStub[] = []
  const connect = vi.fn<() => RpcStub<PublicApi>>(() => {
    const s = makeFakeStub(ping)
    stubs.push(s)
    return s.stub
  })
  const conn = createRpcConnection(connect)
  connections.push(conn)
  return { conn, connect, stubs }
}

beforeEach(() => {
  vi.useFakeTimers()
  visibility = 'visible'
})

afterEach(() => {
  while (connections.length) connections.pop()!.destroy()
  vi.useRealTimers()
})

describe('idle tab disconnect', () => {
  it('closes the socket after 15 continuous hidden minutes and never reconnects while hidden', async () => {
    const { conn, connect, stubs } = setup()
    const notify = vi.fn<() => void>()
    conn.subscribers.add(notify)
    const firstStub = conn.getState().stub

    fireVisibility('hidden')
    await vi.advanceTimersByTimeAsync(IDLE_DISCONNECT_MS / 2)
    // A repeated hidden event must not re-arm the timer.
    fireVisibility('hidden')
    await vi.advanceTimersByTimeAsync(IDLE_DISCONNECT_MS / 2 - 1)
    expect(stubs[0].dispose).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(stubs[0].dispose).toHaveBeenCalledTimes(1)
    expect(conn.getState().stub).toBe(firstStub)
    expect(conn.getState().connectionLost).toBe(true)
    // The teardown stays quiet while hidden — subscribers hear only the visible-side pair.
    expect(notify).not.toHaveBeenCalled()

    // Still hidden an hour later: not a single reconnect attempt was made.
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000)
    expect(connect).toHaveBeenCalledTimes(1)
  })

  it('cancels the idle disconnect when the tab becomes visible before the deadline', async () => {
    const { conn, connect, stubs } = setup()

    fireVisibility('hidden')
    await vi.advanceTimersByTimeAsync(IDLE_DISCONNECT_MS - 1000)
    fireVisibility('visible')
    await vi.advanceTimersByTimeAsync(IDLE_DISCONNECT_MS * 2)

    expect(stubs[0].dispose).not.toHaveBeenCalled()
    expect(connect).toHaveBeenCalledTimes(1)
    expect(conn.getState().connectionLost).toBe(false)
  })

  it('reconnects through the normal publish path as soon as the tab is visible again', async () => {
    const { conn, connect, stubs } = setup()
    const notify = vi.fn<() => void>()
    conn.subscribers.add(notify)
    const firstStub = conn.getState().stub

    fireVisibility('hidden')
    await vi.advanceTimersByTimeAsync(IDLE_DISCONNECT_MS)
    expect(conn.getState().connectionLost).toBe(true)

    fireVisibility('visible')
    // The last successful connect was ages ago, so the deferred reconnect skips the first
    // backoff and synchronously opens the next socket...
    expect(connect).toHaveBeenCalledTimes(2)
    // ...while subscribers get the same lost→restored pair as an organic outage: the published
    // stub is replaced once, by the reconnect promise's facade.
    expect(conn.getState().stub).not.toBe(firstStub)
    expect(notify).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(0)
    expect(stubs[1].ping).toHaveBeenCalled()
    expect(conn.getState().connectionLost).toBe(false)
    expect(notify).toHaveBeenCalledTimes(2)
  })

  it('defers reconnection when the socket breaks while hidden', async () => {
    const { conn, connect, stubs } = setup()

    fireVisibility('hidden')
    stubs[0].break(new Error('socket died'))
    expect(conn.getState().connectionLost).toBe(true)

    // No reconnect attempts for the whole time the tab stays hidden — not even when the idle
    // timer fires on top of the already-dead connection.
    await vi.advanceTimersByTimeAsync(30 * 60 * 1000)
    expect(connect).toHaveBeenCalledTimes(1)

    fireVisibility('visible')
    await vi.advanceTimersByTimeAsync(0)
    expect(connect).toHaveBeenCalledTimes(2)
    expect(stubs[1].ping).toHaveBeenCalled()
    expect(conn.getState().connectionLost).toBe(false)
  })

  it('parks an in-flight reconnect loop while hidden instead of attempting connections', async () => {
    let pingShouldFail = false
    const { conn, connect, stubs } = setup(() =>
      pingShouldFail ? Promise.reject(new Error('ping failed')) : Promise.resolve())

    // Break while visible: the loop starts, and its first candidate fails the probe.
    pingShouldFail = true
    stubs[0].break(new Error('socket died'))
    await vi.advanceTimersByTimeAsync(2000)
    expect(connect).toHaveBeenCalledTimes(2)
    expect(stubs[1].dispose).toHaveBeenCalled()

    // Hide mid-backoff: the loop parks instead of burning attempts nobody will see.
    fireVisibility('hidden')
    await vi.advanceTimersByTimeAsync(30 * 60 * 1000)
    expect(connect).toHaveBeenCalledTimes(2)

    // Visible again: the parked loop resumes on its own — no second publish, no extra attempts.
    pingShouldFail = false
    fireVisibility('visible')
    await vi.advanceTimersByTimeAsync(2000)
    expect(connect).toHaveBeenCalledTimes(3)
    expect(stubs[2].ping).toHaveBeenCalled()
    expect(conn.getState().connectionLost).toBe(false)
  })

  it('keeps the existing backoff reconnect for breaks while visible', async () => {
    const { conn, connect, stubs } = setup()
    const notify = vi.fn<() => void>()
    conn.subscribers.add(notify)
    const firstStub = conn.getState().stub

    stubs[0].break(new Error('socket died'))
    // handleBroken replaces the stub with the unresolved reconnect facade right away.
    expect(conn.getState().connectionLost).toBe(true)
    expect(conn.getState().stub).not.toBe(firstStub)
    expect(notify).toHaveBeenCalledTimes(1)

    // The connection died moments after connecting, so the first retry waits out the backoff.
    await vi.advanceTimersByTimeAsync(2000)
    expect(connect).toHaveBeenCalledTimes(2)
    expect(stubs[1].ping).toHaveBeenCalled()
    expect(conn.getState().connectionLost).toBe(false)
    expect(notify).toHaveBeenCalledTimes(2)
  })

  it('starts the idle timer when the page loads already hidden', async () => {
    // No `visibilitychange` fires for a page loaded in the background — the timer must arm itself.
    visibility = 'hidden'
    const { conn, connect, stubs } = setup()

    await vi.advanceTimersByTimeAsync(IDLE_DISCONNECT_MS)
    expect(stubs[0].dispose).toHaveBeenCalledTimes(1)
    expect(conn.getState().connectionLost).toBe(true)

    // Still hidden later: no reconnect attempts.
    await vi.advanceTimersByTimeAsync(30 * 60 * 1000)
    expect(connect).toHaveBeenCalledTimes(1)

    // Visible for the first time: reconnects immediately through the normal publish path.
    fireVisibility('visible')
    expect(connect).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(0)
    expect(stubs[1].ping).toHaveBeenCalled()
    expect(conn.getState().connectionLost).toBe(false)
  })

  it('cancels an initially-hidden idle timer when the tab is first shown', async () => {
    visibility = 'hidden'
    const { conn, connect, stubs } = setup()

    await vi.advanceTimersByTimeAsync(IDLE_DISCONNECT_MS - 1000)
    fireVisibility('visible')
    await vi.advanceTimersByTimeAsync(IDLE_DISCONNECT_MS * 2)

    expect(stubs[0].dispose).not.toHaveBeenCalled()
    expect(connect).toHaveBeenCalledTimes(1)
    expect(conn.getState().connectionLost).toBe(false)
  })

  it('still probes a live socket on network-online', async () => {
    const { stubs } = setup()

    // Older than the wake-probe idle threshold, so the probe actually pings.
    await vi.advanceTimersByTimeAsync(60_000)
    window.dispatchEvent(new Event('online'))
    await vi.advanceTimersByTimeAsync(0)

    expect(stubs[0].ping).toHaveBeenCalledTimes(1)
  })
})
