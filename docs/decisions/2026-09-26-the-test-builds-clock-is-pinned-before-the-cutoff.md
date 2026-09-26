# 2026-09-26 - The test build's clock is pinned before the cutoff, and `?today=` moves it

- Task: `persist-5-migration` (planner, planning pass 1).
- Decision: `Env` gains a clock port; the production build reads
  `Date.now()`, the test build (`dist-test/`) reads `?today=YYYY-MM-DD` and
  otherwise a fixed day before `LEGACY_WRITE_UNTIL` (2026-10-01). Only the
  legacy gate reads it. So every golden and states case stays before the
  cutoff after 2026-10-26 until R10 deletes them with the codec, and the
  after-date states name their day (`tests/app/driver.js` `open(route, {
  as, today })`; `golden.js` writes `# today:`). `fakeEnv` uses the same
  fixed clock; a unit test passes another. The gate itself applies only
  where a cloud exists: an unconfigured build keeps local creation.
- Rejected: the real clock in the test build (CI red from the date until
  R10, on every push); a second build per side of the date (two golden
  sets for one app); a build-time define of the day (a golden could not
  hold both sides).
- Amends "The browser suites drive a test build with a deterministic fake cloud" (2026-09-24): the test build also has a pinned clock.
