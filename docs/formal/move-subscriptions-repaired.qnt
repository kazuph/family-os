// This candidate changes only useActions.fail(). Normal idle fan-out is unchanged.
module move_subscriptions_repaired {
  import move_subscriptions_current.* from "./move-subscriptions-current"

  action pageFailureReleases = all {
    st.pagePending,
    st' = if (st.clientOpen)
      { ...st, phase: "error", pagePending: false,
        held: Set(), localHeld: false, disposed: true }
    else { ...st, pagePending: false }
  }

  action repairedStep = any {
    start, hostSuccess, hostFailure, readySuccess, readyFailure,
    deliverResult, pageSuccess, pageFailureReleases, close, st' = st
  }

  run failed_page_repaired_trace = init.then(start).then(hostSuccess).then(hostSuccess)
    .then(readySuccess).then(deliverResult).then(pageFailureReleases)
    .then(all { assert(failed_load_releases), st' = st })
}
