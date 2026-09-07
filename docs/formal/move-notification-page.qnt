// One action and two state changes: the minimum stale-page/late-notification race.
// Bounds describe the search only; they are not product limits.
module move_notification_page {
  type State = {
    persisted: int, queued: List[int], initializing: bool, floor: int,
    buffered: int, pagePending: bool, pageRead: bool, pageSnapshot: int,
    liveDuringPage: int, loaded: bool, visible: int, maxVisible: int
  }
  var s: State
  action init = s' = {
    persisted: 0, queued: List(), initializing: true, floor: 0, buffered: -1,
    pagePending: false, pageRead: false, pageSnapshot: 0,
    liveDuringPage: -1, loaded: false, visible: -1, maxVisible: -1
  }
  pure def maximum(a: int, b: int): int = if (a > b) a else b
  action change = all {
    s.persisted < 2,
    s' = {...s, persisted: s.persisted + 1, queued: s.queued.append(s.persisted + 1)}
  }
  // Replay registration returns the persisted floor. An initial subscriber next reads
  // pending/history; it must not admit a queued event older than that floor.
  action registrationReturns = all {
    s.initializing,
    s' = {...s, initializing: false, floor: s.persisted, buffered: -1}
  }
  action readPage = all {
    not(s.initializing), not(s.pagePending),
    s' = {...s, pagePending: true, pageRead: true, pageSnapshot: s.persisted}
  }
  action notification = all {
    s.queued.length() > 0,
    val v = s.queued.head()
    s' = if (s.initializing)
      {...s, queued: s.queued.tail(), buffered: maximum(s.buffered, v)}
    else if (v <= s.floor)
      {...s, queued: s.queued.tail()}
    else {...s, queued: s.queued.tail(),
      liveDuringPage: if (s.pagePending) maximum(s.liveDuringPage, v) else s.liveDuringPage,
      visible: if (s.loaded) maximum(s.visible, v) else s.visible,
      maxVisible: if (s.loaded) maximum(s.maxVisible, v) else s.maxVisible}
  }
  action pageReturns = all {
    s.pagePending,
    val v = maximum(s.pageSnapshot, s.liveDuringPage)
    s' = {...s, pagePending: false, loaded: true, liveDuringPage: -1,
      visible: maximum(s.visible, v), maxVisible: maximum(s.maxVisible, v)}
  }
  // Restart may lose an in-flight best-effort notification, not the host revision.
  // A new page is the recovery path; no autonomous retry is invented here.
  action sourceRestart = s' = {...s, queued: List()}
  action step = any {change, registrationReturns, readPage, notification, pageReturns,
    sourceRestart, s' = s}
  val no_stale_overwrite = s.visible == s.maxVisible
  val page_includes_live = s.pagePending or s.liveDuringPage == -1
  run live_before_first_page_trace = init.then(registrationReturns).then(readPage)
    .then(change).then(notification).then(pageReturns)
    .then(all {assert(s.visible == 1), s' = s})
  run old_notification_after_page_trace = init.then(change).then(registrationReturns)
    .then(readPage).then(change).then(notification).then(notification).then(pageReturns)
    .then(all {assert(s.visible == 2), s' = s})
  run restart_recovery_trace = init.then(registrationReturns).then(change).then(sourceRestart)
    .then(readPage).then(pageReturns)
    .then(all {assert(s.visible == s.persisted), s' = s})
}
