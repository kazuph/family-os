module move_notification_versioned {
  import move_notification_candidate.* from "./move-notification-candidate"

  // The implementation must capture entry + persisted per-action revision together,
  // before an await. Receivers compare revisions within sourceWorkspaceId:actionId.
  action deliverReplayVersioned = all {
    st.replayPending,
    st' = if (st.replaySnapshot >= st.visibleVersion)
      { ...st, replayPending: false, visibleVersion: st.replaySnapshot,
        maxVisible: st.replaySnapshot }
    else { ...st, replayPending: false }
  }
  action deliverNotificationVersioned = all {
    not(st.otherTargetPending), st.queued.length() > 0,
    st' = if (st.queued.head() >= st.visibleVersion)
      { ...st, queued: st.queued.tail(), visibleVersion: st.queued.head(),
        maxVisible: st.queued.head() }
    else { ...st, queued: st.queued.tail() }
  }
  action versionedStep = any {
    change, readReplay, deliverReplayVersioned, otherTargetReturns,
    deliverNotificationVersioned, st' = st
  }
  run stale_notification_repaired_trace = init.then(change).then(change).then(readReplay)
    .then(deliverReplayVersioned).then(otherTargetReturns).then(deliverNotificationVersioned)
    .then(all { assert(no_stale_overwrite), st' = st })
}
