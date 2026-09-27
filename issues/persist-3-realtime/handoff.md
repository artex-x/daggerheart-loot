# Handoff - TASK persist-3-realtime
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in progress - `B3.0` implemented and gated; waits for
  the orchestrator to push it to `origin/main` before `B3.1` starts
- Last agent: implementer (2026-09-27, `B3.0`, the precursor contract
  commit)
- NEEDS_HUMAN_CONFIRMATION: no - Q1-Q3 answered 2026-09-26 (`plan.md`
  section 13); the owner chose the precursor commit `B3.0` on 2026-09-27
  (review B1)
- Branch: `main`
- Base / starting commit: `d1a9e604` (the R3 plan, cherry-picked onto
  `main`, on top of `30444209` `display-settings`)
- Pushed: no (the orchestrator pushes, per plan section 10.0)

## Completed
- Batch name/id: planning pass 1 (2026-09-25); planning pass 2
  (2026-09-27, refresh against `f6079277`); `B3.0`, the precursor
  contract commit (2026-09-27, implementer, plan section 10.0)
- What shipped (planning): pass 2 resolved every **[R2-refresh]** mark,
  moved the tolerant reorder's fake and contract into `B3.1` (its E2E
  runs the contract after the push), placed D56 on `B3.1` and D57, D59
  and the D60 rewording on `B3.2`, specified the usage row R11 placed,
  and declared the plan review. The plan review returned
  fix-then-continue; the fixes add `B3.0` (the precursor contract
  commit, owner 2026-09-27), the safe header read and warning wrapper
  (B2), the spike's extra checks and fallbacks (R1-R3), the full overlap
  list (R4) and nits N1-N9. The second-look review (`plan-B3.1-2.md`)
  returned `approve` with two open nits, R7 and N10.
- What shipped (`B3.0`): `cloud.contract.ts` case G's refused write
  changed from a `reorder` that misses entry `c` to a duplicate `add`
  of `ci1` (`unique (list_id, item_key)` refuses it under both the old
  and the tolerant `reorder_list`); the assertion message and
  `theList` label reworded to match; `COVERAGE.md`'s case G line
  reworded to "a second entry for one record refused". Also applied
  the second look's two cheap items in `plan.md` section 10.0: R7 (a
  note that any other branch running `e2e` in the `B3.1`-test-push to
  closeout-push window needs `B3.0` in its base) and N10 (`COVERAGE.md`
  added to the Files line). `reviews.md` marks `plan-B3.1-2-R7` and
  `-N10` fixed; `-N11` stays "named", no action.
- Files changed: `app/src/ports/cloud.contract.ts`,
  `docs/specs/COVERAGE.md`,
  `issues/persist-3-realtime/{plan,handoff,reviews}.md`
- Previous sha (batch diff base): `d1a9e604`
- Deviations and rationale: `B3.1` now edits four `app/` files
  (`fake-cloud.ts`, `fake-cloud.test.ts`, `cloud.contract.ts`,
  `cloudLists.test.ts`): a schema batch runs `npm run e2e` after its
  approve (`process-guards`), and the contract's "reorder that misses an
  entry is refused" would fail against the tolerant `reorder_list`.
- Review: `B3.0` review not required (plan section 10.0: "no trigger
  fired: a test-only change to one contract case, covered by this
  plan's second-look review"). Planning review: required (trigger:
  migration, SECURITY DEFINER, sync feed), report
  issues/persist-3-realtime/reviews/plan-B3.1.md - fix-then-continue;
  second look `reviews/plan-B3.1-2.md` - approve.

## Verification
- Commands run (exact): `rtk npm run check` (Bash, foreground, timeout
  600000); `npm run e2e` (Bash, foreground, timeout 600000)
- Results: `npm run check` - PASS (format, lint, typecheck 0
  errors/warnings, `tools/build.js` and all invariants clean, vitest
  2001 passed / 64 files, coverage 98.23% statements / 92.49% branches
  / 98.78% functions / 98.93% lines). `npm run e2e` - PASS (contract ok,
  9 cases, against the test project's current strict `reorder_list`;
  F0-F10 ok; cleanup ok).
- Gates: `check:db` not run (nothing under `supabase/` or `tests/db/`
  changed); `check:built` not run (nothing drawn).

## Next batch (implement-ready)
- `B3.0` is done (this batch, committed but not yet pushed - the
  orchestrator pushes it alone, per the owner's 2026-09-27 decision,
  before `B3.1` starts its test push).
- Next: `B3.1` - the database half and the tolerant reorder (`plan.md`
  section 10)
- Objective: broadcast triggers, `realtime.messages` policies, tolerant
  `reorder_list` with its fake and contract (D56), the usage report's
  `realtime_rows_24h`, proven by layer 3 with WebSocket clients against a
  local stack that runs `realtime` and `kong`.
- In scope: `plan.md` section 10, "In scope" and the file table.
- Out of scope: every other `app/` file (`B3.2`); every file
  `display-settings` edits (`plan.md` section 15); production.
- Files expected: `supabase/migrations/<ts>_realtime.sql`,
  `supabase/reversals/<ts>_realtime.sql`, `tools/supabase/lib.mjs`,
  `tests/db/run.mjs`, `tests/db/roles.mjs`, `tests/db/realtime.test.mjs`,
  `tests/db/reversibility.test.mjs`, `tests/db/apply-pending.test.mjs`,
  `tests/db/lists.test.mjs`, `tests/db/list-writes.test.mjs`,
  `tests/db/usage.test.mjs`, `tools/supabase/usage.mjs`,
  `tools/supabase/usage-lib.mjs`, `tools/supabase/usage-lib.test.mjs`,
  `app/src/ports/fake-cloud.ts`, `app/src/ports/fake-cloud.test.ts`,
  `app/src/ports/cloud.contract.ts`, `app/src/state/cloudLists.test.ts`,
  `docs/specs/FEATURES.md`, `docs/specs/COVERAGE.md`,
  `docs/specs/DEBT.md`, `.claude/README.md`, four new files in
  `docs/decisions/` and their pointer lines, `docs/DECISIONS.md`.
- Steps: `plan.md` section 10, steps 1-11 (step 1 is a measured spike
  with two fallbacks and one stop; record (a), (a2), (a3), (b) and (c)
  here before step 2).
- Acceptance criteria: `plan.md` section 10, "Acceptance" (includes D56
  and R11's `realtime_rows_24h` line).
- Verification commands: `rtk npm run check` (Bash, one foreground call,
  timeout 600000); `npm run check:db` (PowerShell, alone, timeout
  600000); commit; after the approve only, and with `B3.0` on
  `origin/main`: `node
  --env-file=.env.test.local tools/supabase/db-push.mjs --project test
  --yes`, then `npm run e2e`.
- Risks / do-nots: `plan.md` section 10, last paragraph; `private` is
  `true` in every `realtime.send`; no `insert` policy.
- Fallback (optional): step 1's fallbacks (restart the realtime container
  after a reset; `gotrue` for a real token); step 1's stop when a
  migration cannot see `realtime.messages` during `db reset --local`.

## Blockers
- `B3.0`'s commit must reach `origin/main` before `B3.1`'s test push
  (the orchestrator pushes it, per the owner's 2026-09-27 decision).
  `B3.1` cannot start its test push, and no other branch should run
  `npm run e2e`, until then.
- Q2 is an owner action after `B3.2` is live.

## Deferred
- Closing a hidden tab's channel after a minute (`plan.md` 6.4), only if
  the monthly check shows a peak above 150 connections.
- A live share panel on the owner's other device; Presence.
- For the `B3.2` refresh (review R5): a GM note edit moves a player
  share's `revision`; decide whether the status region compares the
  drawn content (`plan.md` section 11).

## Notes
- Mocks path: none - nothing new is drawn except a visually hidden status
  region (`plan.md` 6.5).
- Screenshot findings: none (no issue screenshots for this task).
- Cleanup performed / retained artifacts: none.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none;
  `B3.1` writes the two decision files and the spec lines.
