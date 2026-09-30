# 2026-09-30 - A timed golden holds its toast until the capture reads it

- Task: `persist-7-homebrew` (owner, 2026-09-30, a campsite fix in R7's commit).
- Decision: `tests/app/golden.js` opens every `timed: true` state with
  `?toasts=held`. In the test build, `queryClock` then answers
  `holdsToasts()`, and `AppState.say` starts no hide timer: a toast stays
  until the next one replaces it. The golden still asserts the same tree
  with the toast in it; `waitForToast` still fails a toast that never rose.
  Reason: a toast raised at mount lives 1600 ms, and the capture arrives
  after `networkidle0`, `ready()`, `moveSettled` and a click. Measured on
  this host: the toast up at 240-990 ms and down at 2018-2466 ms, the open
  back at 1167-2838 ms; `#/l/ ~ every entry gone` failed 2 of 4 runs at
  `f39534d7` and 4 of 4 at `86aaa41c`. The shipped build never reads the
  parameter, and its toasts keep 1600, 2600 and 7000 ms.
- Rejected: holding the page's timers from the harness by their delay (the
  tables anchor flash uses 1600 ms too, and a delay is not a toast); a
  longer product toast (it changes what a reader sees).
