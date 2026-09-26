# 2026-09-26 - The configured bundle budget is 180 kB until a slimmer account client

- Task: `persist-2-lists` (owner, 2026-09-26, after CI run 36228323330).
- Decision: `tools/bundle-budget.mjs` allows 180 kB gzip for the configured
  build (with the account client chunk); the unconfigured limit stays 120.
  Reason: the full supabase-js client (55.1 kB, with realtime and storage
  the app does not use yet) put the lists release at 172.0 kB against 170.
  The limit returns below 170 when `ports/supabase.ts` builds its client
  from `@supabase/auth-js` and `@supabase/postgrest-js` (about 27 kB
  against 54.8 kB, measured 2026-09-26); `docs/specs/DEBT.md` D60 owes it.
- Rejected: lazy-loading the share panel (the budget counts every chunk,
  lazy ones included, so the total does not move); measuring first paint
  only (it changes what the budget means); cutting app code (no cheap
  candidate, and the Realtime release would fail the limit again).
