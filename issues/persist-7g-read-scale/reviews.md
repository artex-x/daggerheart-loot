# Review register - TASK persist-7g-read-scale

## `reviews/plan-B7g.1.md` - plan before B7g.1, fix-then-continue (reviewed `bb37a572`)

Applied once by the planner, 2026-10-01; no second look follows.

| Id | Finding | Severity | Scope | Status |
|---|---|---|---|---|
| `plan-B7g.1-B1` | The UPDATE trigger misses a row whose `id` changes (transition tables do not pair rows); check lists of rows with no unchanged old twin (`not exists` on id, list and snapshot); test a new `id` with a big snapshot (refused) and a reorder and a note edit on an over-limit list (taken) | blocker | local | fixed plan |
| `plan-B7g.1-B2` | `tests/db/restore-drill.test.mjs` pins seven seeded `limit_defaults` keys; `.claude/README.md` "Restore production (owner)" step 4 lacks the new row; "seven defaults" in `limits.test.mjs` and `COVERAGE.md` | blocker | local | fixed plan |
| `plan-B7g.1-B3` | `check:db` ran second; run it last (`check`, `check:built`, `app/states`, `check:db`), then `db:push` and `e2e` after the batch review | blocker | local | fixed plan |
| `plan-B7g.1-R1` | The trigger function's `set search_path = public, pg_temp` unstated; pin it in `homebrew.test.mjs` | risk | local | fixed plan |
| `plan-B7g.1-R2` | The fake must check the entry count before the byte sum (trigger name order) | risk | local | fixed plan |
| `plan-B7g.1-R3` | `p_since` keeps an open page on an old projection after a migration that changes it with no revision bump; state it as an accepted trade-off in 4.3 and D2 | risk | local | fixed plan |
| `plan-B7g.1-R4` | The exact-sum case at the default needs no near-maximal copies with cards; valid copies (at most 100 entries) whose sizes sum to 1048576 | risk | local | fixed plan |
| `plan-B7g.1-N1` | D74 may be taken by R7e or R7f; use the next free D number at dispatch | nit | local | fixed plan |
| `plan-B7g.1-N2` | The RU toast is about 27 characters longer, not 20 | nit | local | fixed plan |
| `plan-B7g.1-N3` | `Math.floor` shows «0 КБ» under 1024 bytes; use `Math.ceil` | nit | local | fixed plan |
| `plan-B7g.1-N4` | `tests/e2e/contract.mjs` comment "The two functions anon may run" becomes three | nit | local | fixed plan |
| `plan-B7g.1-N5` | The handoff's "Review:" line lacks the report path | nit | local | fixed plan |
| `plan-B7g.1-N6` | `CloudLists.#pull` has no guard against an older read answering after a newer one (pre-existing) | nit | deferred-scope | fixed plan (placed in the handoff's "Deferred") |
