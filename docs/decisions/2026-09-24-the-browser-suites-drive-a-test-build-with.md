# 2026-09-24 - The browser suites drive a test build with a deterministic fake cloud

- Task: `persistent-storage` (owner decision, 2026-09-24).
- Decision: `vite build --mode test` writes `dist-test/` with an in-memory
  `CloudPort` fake seeded with fixed users, lists, homebrew, ids, tokens
  and timestamps; `?as=<user>` signs a seeded user in, absent means signed
  out. `tests/app/` drives that build, so every account-era screen has
  offline, parallel, pixel and structural coverage in both states. The
  production build never contains the fake: a build-time define that
  Rollup drops, and `check:built` fails on the fake's marker in `dist/`.
  The same contract assertions run against the fake and the real adapter
  (hosted E2E), so drift fails a gate. Pixel comparisons exist only in this
  layer; real network and real Supabase only in the database and E2E layers.
- Rejected: an unconfigured build keeping local creation as the golden
  subject (the planner's first choice) - the deployed anonymous screens
  would never be captured; a runtime-selectable fake in the production
  bundle - harness in shipped code.
