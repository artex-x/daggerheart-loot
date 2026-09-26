# 2026-09-26 - The bundle budget is 150 kB unconfigured and 200 kB configured

- Task: `persist-5-migration` (owner, 2026-09-26, after the move of browser lists measured the unconfigured build at 121.0 kB).
- Decision: `tools/bundle-budget.mjs` allows 150 kB gzip for the unconfigured
  build and 200 kB for the configured one (with the account client chunk).
  Reason: the persistence releases add features - the move of browser
  lists, read-only mode, notice and status took the unconfigured build from
  115.8 to 121.0 kB and the configured one from 172.9 to 178.2 kB - and the
  owner accepts the growth. `docs/specs/DEBT.md` D60 (the slimmer account
  client) still owes its 27 kB.
- Rejected: cutting 1 kB of app code in the last batch (no cheap candidate:
  the new texts in two languages and the components are the bulk); a lazy
  `import()` of the move (the budget counts every chunk, lazy ones included).
- Supersedes "The configured bundle budget is 180 kB until a slimmer account client" (2026-09-26).
