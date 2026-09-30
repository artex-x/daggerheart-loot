# 2026-09-30 - The configured bundle budget is 210 kB; the unconfigured stays 150 kB

- Task: `persist-4b-requests-polish` (owner, 2026-09-30, after CI run 36638258244 measured the configured build at 202.1 kB).
- Decision: `tools/bundle-budget.mjs` allows 210 kB gzip for the configured
  build (with the account client chunk) and keeps 150 kB for the
  unconfigured one. Reason: R6's import and export and R4b's requests
  polish took the configured build to 203.0 kB (unconfigured 144.9 kB), and
  the owner accepts the growth. `docs/specs/DEBT.md` D60 (the slimmer
  account client) still owes the real cut.
- Rejected: a lazy `import()` of `ImportPanel` (the budget counts every
  chunk, lazy ones included: 204.1 kB, more than before); counting only the
  chunks loaded on first paint (it changes what the budget measures and
  hides growth in lazy chunks).
- Supersedes "The bundle budget is 150 kB unconfigured and 200 kB configured" (2026-09-26).
