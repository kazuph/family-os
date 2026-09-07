// Unadopted plain-data notification candidate saved in
// /tmp/move-action-notification-candidate.patch. NOT the deployed/current kernel.
module move_notification_candidate {
  type State = {
    sourceVersion: int, visibleVersion: int, maxVisible: int,
    queued: List[int], otherTargetPending: bool, replaySnapshot: int,
    replayPending: bool, liveSeen: bool
  }
  var st: State
  action init = st' = {
    sourceVersion: 0, visibleVersion: 0, maxVisible: 0, queued: List(),
    otherTargetPending: true, replaySnapshot: 0, replayPending: false, liveSeen: false
  }

  // Two changes to one hook/action, queued behind an unresolved notification for
  // another gadget on this host. Versions are logical ordering, not product fields.
  action change = all {
    st.sourceVersion < 2,
    st' = { ...st, sourceVersion: st.sourceVersion + 1,
      queued: st.queued.append(st.sourceVersion + 1) }
  }
  action readReplay = all {
    not(st.replayPending),
    st' = { ...st, replayPending: true, replaySnapshot: st.sourceVersion }
  }
  action deliverReplay = all {
    st.replayPending,
    st' = if (st.liveSeen) { ...st, replayPending: false }
    else { ...st, replayPending: false, visibleVersion: st.replaySnapshot,
      maxVisible: if (st.replaySnapshot > st.maxVisible) st.replaySnapshot else st.maxVisible }
  }
  action otherTargetReturns = all {
    st.otherTargetPending,
    st' = { ...st, otherTargetPending: false }
  }
  action deliverNotification = all {
    not(st.otherTargetPending), st.queued.length() > 0,
    st' = { ...st, queued: st.queued.tail(), liveSeen: true,
      visibleVersion: st.queued.head(),
      maxVisible: if (st.queued.head() > st.maxVisible) st.queued.head() else st.maxVisible }
  }
  action step = any {
    change, readReplay, deliverReplay, otherTargetReturns, deliverNotification, st' = st
  }
  val no_stale_overwrite = st.visibleVersion == st.maxVisible
  run stale_notification_trace = init.then(change).then(change).then(readReplay)
    .then(deliverReplay).then(otherTargetReturns).then(deliverNotification)
    .then(all { assert(not(no_stale_overwrite)), st' = st })
}
