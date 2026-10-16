# Review findings - TASK debt-cleanup

One row per finding of every review of this task, with its status and where the change sits.

## Plan review before B1 (`reviews/plan-B1.md`, reviewed `35f1ff6a`, verdict fix-then-continue)

| Id | Finding | Status | Where |
|---|---|---|---|
| plan-B1 Blocker 1 | D90's timeout kills only the node wrapper; two more reset sites; `storage` missing from the preflight | fixed plan | `plan.md` 3.6, 7.1 step 2, D90 acceptance |
| plan-B1 Blocker 2 | D68: the database refuses the one over-long op, not the whole call | fixed plan | `plan.md` 3.7, D68 acceptance |
| plan-B1 Blocker 3 | D86: a kept id decided during the read; no partial-failure rule; unbounded chunks | fixed plan | `plan.md` 3.4, 7.1 step 11, D86 acceptance |
| plan-B1 Blocker 4 | D81: a locally written row keeps the client's times for ever | fixed plan | `plan.md` 3.1, 7.1 step 10, D81 acceptance |
| plan-B1 Blocker 5 | D83: the stop condition left a half-batch; the 2026-09-26 decision and `FEATURES.md` contradict the halving | fixed plan | `plan.md` 3.2, 7.1 files, step 19, stop condition, D83 acceptance |
| plan-B1 Risk 1 | K6: `'load'` makes once-only e2e checks vacuous; the cause is a guess | fixed plan | `plan.md` 3.9, 6, 10, 7.1 step 18, K6 acceptance, do-nots |
| plan-B1 Risk 2 | An older read can remove a new row or bring back a deleted one in three stores | fixed plan | `plan.md` 3.1, 3.4, 3.5, 4.1, the read-order acceptance line |
| plan-B1 Risk 3 | D83: the fake cannot answer a timeout | fixed plan | `plan.md` 3.2, 7.1 step 13 |
| plan-B1 Risk 4 | D83: the 3x seed has no measured cost | fixed plan | `plan.md` 3.2, 6, 7.1 steps 0c and 15, gate cost |
| plan-B1 Risk 5 | D90: the reset timeout is not measured; an interrupt reads as a timeout | fixed plan | `plan.md` 3.6, 7.1 step 0b |
| plan-B1 Nit 1 | 3.3's 60-card figure is the sources' | fixed plan | `plan.md` 3.3, K7 acceptance |
| plan-B1 Nit 2 | `PREFS_KEY` is in scope and has a `STATE.md` rule | fixed plan | `plan.md` 3.8, D61 acceptance |
| plan-B1 Nit 3 | build `known` inside the read loop | fixed plan | `plan.md` 3.1, 7.1 step 10 |
| plan-B1 Nit 4 | the revision proof is the `_before_update` triggers, not a grep | fixed plan | `plan.md` 7.1 step 0 |
| plan-B1 Nit 5 | K12's remedy names another checkout; `SUPABASE_CLI`'s worktree defect | fixed plan | `plan.md` 3.6, 3.9; `handoff.md` Deferred |
| plan-B1 Nit 6 | B5's error table must list a bulk delete and move with a filter-hidden tick | fixed plan | `plan.md` 3.13, 7.5 acceptance |

## Batch review of B1 (`reviews/B1.md`, reviewed `7430de8e`, verdict approve)

| Id | Finding | Status | Where |
|---|---|---|---|
| B1-1 | D83's "a third of the rows" is wrong: lines 1/27, entries 1/9 at the defaults | fixed B2 (D83 kept) | `plan.md` Status, 3.10.2, 7.2 step 5 and the B1-1 acceptance line |
| B1-2 | the `todo` 3x case still costs about 45 s per `check:db` | `todo` kept by B2's stop condition; cost in D83 | `plan.md` 10, 7.2 the B1-2 acceptance line |
| B1-3 | `OwnerRequests` advances `#appliedSeq` only on an ok requests part | fixed B2 | `plan.md` 3.10.4, 7.2 step 4 and the B1-3 acceptance line |
| B1-4 | the D61 bad-value test passes vacuously | placed B4 | `plan.md` 7.4, the B1-4 acceptance line |
| B1-5 | a missing CLI binary prints a stack trace, no FAIL line | fixed B2 | `plan.md` 3.10.4, 7.2 step 8 and the B1-5 acceptance line |
| B1-6 | `bytesText` prints 999 950 bytes as `1000.0 kB` | fixed B2 | `plan.md` 3.10.4, 7.2 step 8 and the B1-6 acceptance line |
| B1-7 | `SUPABASE_CLI` in `config.mjs` and `db-push.mjs` is a defect, not an owner note | fixed B2 (the CLI-start proof runs with the test push) | `plan.md` 3.10.4, 7.2 step 8 and the B1-7 acceptance line; `handoff.md` Deferred |
| B1 check 1 | a forced timeout at a piped reset site | done B2 (handoff) | `plan.md` 7.2 step 8, the acceptance line |
| B1 check 2 | the configured bundle figure | done B2 (handoff) | `plan.md` 7.2 step 0, the acceptance line |

## Plan review before B2 (`reviews/plan-B2.md`, reviewed `5b72cec0`, verdict fix-then-continue)

| Id | Finding | Status | Where |
|---|---|---|---|
| plan-B2 Blocker 1 | the hosted and fake proofs pass with both functions absent | fixed plan | `plan.md` 3.10.1, 7.2 step 3, three acceptance lines |
| plan-B2 Risk 1 | the test push command fails on this host | fixed plan (the `migrate-test.mjs` path, coordinator) | `plan.md` 7.2 step 10, verification, the B1-7 line |
| plan-B2 Risk 2 | no path for a failed push or e2e after the approve | fixed plan | `plan.md` 7.2 step 10, do-nots, acceptance |
| plan-B2 Risk 3 | no test proves the resume after the named loss | fixed plan | `plan.md` 4.2, 7.2 steps 5 and 6, acceptance |
| plan-B2 Risk 4 | the 80 % `explain` rule can double count | fixed plan | `plan.md` 7.2 step 0, stop condition, acceptance |
| plan-B2 Risk 5 | a later migration on `main` blocks the release | placed B5 closeout | `plan.md` 7 (release step), 7.5 acceptance |
| plan-B2 Nit 1 | `META.md` counts `anon` functions wrong | fixed plan | `plan.md` 3.10.1, 7.2 step 9, acceptance |
| plan-B2 Nit 2 | prune call counts | fixed plan | `plan.md` 4.2 item 1 |
| plan-B2 Nit 3 | a second unfillable answer | fixed plan | `plan.md` 3.10.1, 4.2, 7.2 step 3, acceptance |
| plan-B2 Nit 4 | the timed timeout from one alone figure | fixed plan | `plan.md` 3.10.3, 7.2 step 7, the D98 line |
| plan-B2 Nit 5 | the "What is enforced" axe row | fixed plan | `plan.md` 3.10.3, the D98 line |
| plan-B2 Nit 6 | two test stubs drop `held` | fixed plan | `plan.md` 3.10.1, 7.2 files and step 3 |
| plan-B2 Nit 7 | commit wording | fixed plan (a new commit, the closeout squashes) | `plan.md` 7.2 step 10, acceptance |
| plan-B2 Nit 8 | wait for the backup run | fixed plan | `plan.md` 7, 7.5 acceptance |
| plan-B2 Nit 9 | rule 2n's "(the tools' own entry)" | fixed plan | `plan.md` 7.2 step 9, acceptance |

## Batch review of B2 (`reviews/B2.md`, reviewed `a909287f`, verdict approve)

| Id | Finding | Status | Where |
|---|---|---|---|
| B2 Risk 1 | B1-7's line had no outcome; the push path starts no CLI | done B2 step 10 (`config.mjs diff`) | `handoff.md` Verification |
| B2 Risk 2 | the overload's database time at 3x is not measured | placed B3b | `plan.md` 3.11.3, 7.3b step 5 and its acceptance line |
| B2 Risk 3 | `STACK_TIMEOUT_MS` not measured and past the guard's stall kill; piped `start` | placed B3b | `plan.md` 3.11.3, 7.3b steps 0 and 4 and its acceptance line |
| B2 Nit 1 | D83's per-row trigger cause is inferred | placed B3b (clears when B3b deletes D83) | `plan.md` 3.11.2, 7.3b step 6, the D83 line |
| B2 Nit 2 | the README's `npm ci` remedy and rule 2n's `RESET_COMMAND` | placed B3b | `plan.md` 3.11.3, 7.3b step 6 and its acceptance line |
| B2 Nit 3 | the handoff lacks the template's "Commands run (exact):" label | fixed in the refresh before B3 | `handoff.md` Verification |
| B2 Nit 4 | the B2 commit subject names a batch id | placed B5 closeout (the squash) | `plan.md` 7.5 |
| B2 Nit 5 | `restore.mjs` `cli()` and `runningContainer()` have no timeout | placed B3b | `plan.md` 3.11.3, 7.3b step 4 and its acceptance line |

## Plan review before B3 (`reviews/plan-B3.md`, reviewed `f9cb7620`, verdict fix-then-continue)

| Id | Finding | Status | Where |
|---|---|---|---|
| plan-B3 Blocker 1 | no gate proves the auth client's options; no case runs the real packages | fixed plan (B3) | `plan.md` 3.11.1, 7.3 steps 2 and 3, three acceptance lines |
| plan-B3 Risk 1 | 4.3 states the wrong outcome of a request with no token | fixed plan (B3) | `plan.md` 4.3, the B3 trigger line, an acceptance line |
| plan-B3 Risk 2 | the D83 merge departs from Q1's "D60: its own batch" | fixed plan: split (orchestrator) - B3 D60 alone, B3b D83 and the tooling | `plan.md` 7 split criteria and gate cost, 7.3, 7.3b, Status |
| plan-B3 Risk 3 | step 0 may time the wrong CLI; the 240 s cap has no rule | fixed plan (B3b) | `plan.md` 3.11.3, 7.3b step 0, stop condition, acceptance |
| plan-B3 Risk 4 | the restore tooling cannot print the planned FAIL shape | fixed plan (B3b) | `plan.md` 3.11.3, 4.3, 7.3b step 4, acceptance |
| plan-B3 Nit 1 | `STATE.md`'s storage key row names supabase-js | fixed plan (B3) | `plan.md` 3.11.1, 7.3 |
| plan-B3 Nit 2 | COVERAGE and comments describe a supabase-js client | fixed plan (B3) | `plan.md` 3.11.1, 7.3 |
| plan-B3 Nit 3 | `INITIAL_SESSION` untested | fixed plan (B3) | `plan.md` 7.3 step 2, acceptance |
| plan-B3 Nit 4 | the bundle claim | fixed plan (B3): smaller, both figures recorded | `plan.md` 4.3, 7.3 acceptance |
| plan-B3 Nit 5 | the amendment line's facts | fixed plan (B3) | `plan.md` 3.11.1 |
| plan-B3 Nit 6 | `analyze` inside a rolled-back transaction | fixed plan (B3b) | `plan.md` 3.11.2, 7.3b step 1, acceptance |
| plan-B3 Nit 7 | the autoanalyze mechanism | fixed plan (B3b) | `plan.md` 3.11.2, acceptance |
| plan-B3 Nit 8 | `stalled()` prints a fraction of a minute | fixed plan (B3b) | `plan.md` 3.11.3, acceptance |
| plan-B3 Nit 9 | the `anon` timeout read and its fallback | fixed plan (B3b) | `plan.md` 3.11.3, 7.3b step 0 |
| plan-B3 Nit 10 | host-dependent times in `check:db` | fixed plan (B3b) | `plan.md` 3.11.3, 7.3b step 6 |
| plan-B3 Nit 11 | the busy estimate | fixed plan | `plan.md` 4.3 item 1 |
| plan-B3 Nit 12 | the handoff's "Screenshot findings:" line | fixed | `handoff.md` Notes |
| plan-B3 check | a manual Google and Discord sign-in and link before the push | placed B5 closeout (owner step) | `plan.md` 7.5 |
