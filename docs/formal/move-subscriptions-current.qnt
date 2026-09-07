// Current implementation at 72611cee. No Cloudflare billing/eviction assumptions.
// Hosts 1/2 represent the two independent sources in gadget-move-actions.test.ts.
module move_subscriptions_current {
  type State = {
    phase: str, clientOpen: bool, pending: Set[int], held: Set[int],
    localHeld: bool, disposed: bool, pagePending: bool
  }
  var st: State

  action init = st' = {
    phase: "new", clientOpen: true, pending: Set(), held: Set(),
    localHeld: false, disposed: false, pagePending: false
  }

  // Local registration has completed before the remote Promise.all starts.
  action start = all {
    st.phase == "new", st.clientOpen,
    st' = { ...st, phase: "registering", pending: Set(1, 2), localHeld: true }
  }

  // addChild disposes results that arrive after another registration failed.
  action hostSuccess = {
    nondet host = st.pending.oneOf()
    st' = { ...st, pending: st.pending.exclude(Set(host)),
      held: if (st.disposed) st.held else st.held.union(Set(host)) }
  }

  action hostFailure = {
    nondet host = st.pending.oneOf()
    st' = { ...st, phase: "error", pending: st.pending.exclude(Set(host)),
      held: Set(), localHeld: false, disposed: true }
  }

  // Await ready(), then deliver the aggregate disposer separately.
  action readySuccess = all {
    st.phase == "registering", st.pending == Set(),
    st' = { ...st, phase: "returned" }
  }
  action readyFailure = all {
    st.phase == "registering", st.pending == Set(),
    st' = { ...st, phase: "error", held: Set(), localHeld: false, disposed: true }
  }

  // useActions checks generation after awaiting subscription delivery.
  action deliverResult = all {
    st.phase == "returned",
    st' = if (st.clientOpen)
      { ...st, phase: "paging", pagePending: true }
    else
      { ...st, phase: "closed", held: Set(), localHeld: false, disposed: true }
  }

  action pageSuccess = all {
    st.pagePending,
    st' = { ...st, phase: if (st.clientOpen) "ready" else st.phase, pagePending: false }
  }

  // Current fail() only commits status=error; it does not dispose the subscription.
  action pageFailure = all {
    st.pagePending,
    st' = { ...st, phase: if (st.clientOpen) "error" else st.phase, pagePending: false }
  }

  // Unmount before delivery changes generation; after delivery it also disposes.
  action close = all {
    st.clientOpen,
    st' = if (Set("paging", "ready", "error").contains(st.phase))
      { ...st, clientOpen: false, phase: "closed", held: Set(), localHeld: false, disposed: true }
    else { ...st, clientOpen: false }
  }

  action step = any {
    start, hostSuccess, hostFailure, readySuccess, readyFailure,
    deliverResult, pageSuccess, pageFailure, close, st' = st
  }

  // Quiescent close: this does NOT bound the completion time of unresolved RPCs.
  val closed_releases = and {
    (not(st.clientOpen) and st.pending == Set() and
      not(Set("registering", "returned").contains(st.phase))) implies
      (st.held == Set() and not(st.localHeld)),
    st.disposed implies (st.held == Set() and not(st.localHeld))
  }

  // A failed initial load has no recovery-to-ready transition in this store.
  val failed_load_releases =
    (st.phase == "error" and st.pending == Set() and not(st.pagePending)) implies
      (st.held == Set() and not(st.localHeld))

  // Proposed cost criterion, not a provider billed-duration assertion.
  val idle_has_no_remote_sessions =
    (st.phase == "ready" and not(st.pagePending)) implies st.held == Set()

  val ready_witness = st.phase == "ready" and st.held == Set(1, 2)
  val late_disposal_witness = st.disposed and st.pending == Set()

  run ready_trace = init.then(start).then(hostSuccess).then(hostSuccess)
    .then(readySuccess).then(deliverResult).then(pageSuccess)
    .then(all { assert(ready_witness), st' = st })
  run failed_page_trace = init.then(start).then(hostSuccess).then(hostSuccess)
    .then(readySuccess).then(deliverResult).then(pageFailure)
    .then(all { assert(not(failed_load_releases)), st' = st })
}
