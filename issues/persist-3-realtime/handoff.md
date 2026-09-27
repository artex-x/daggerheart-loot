# Handoff - TASK persist-3-realtime
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: blocked - waits for the second-look plan review
  (`reviews/plan-B3.1-2.md`), then for its release slot: after
  `display-settings`, before R4
- Last agent: planner (2026-09-27, planning pass 2, fixes for the plan
  review `reviews/plan-B3.1.md`, fix-then-continue)
- NEEDS_HUMAN_CONFIRMATION: no - Q1-Q3 answered 2026-09-26 (`plan.md`
  section 13); the owner chose the precursor commit `B3.0` on 2026-09-27
  (review B1)
- Branch: planned on a worktree branch from `f6079277`; the release
  starts on `main` after `display-settings` ships
- Base / starting commit: `f6079277` (planning); the release starts on
  `main`
- Pushed: no

## Completed
- Batch name/id: planning pass 1 (2026-09-25); planning pass 2
  (2026-09-27, refresh against `f6079277`)
- What shipped: pass 2 resolved every **[R2-refresh]** mark, moved the
  tolerant reorder's fake and contract into `B3.1` (its E2E runs the
  contract after the push), placed D56 on `B3.1` and D57, D59 and the
  D60 rewording on `B3.2`, specified the usage row R11 placed, and
  declared the plan review. The plan review returned
  fix-then-continue; the fixes add `B3.0` (the precursor contract
  commit, owner 2026-09-27), the safe header read and warning wrapper
  (B2), the spike's extra checks and fallbacks (R1-R3), the full overlap
  list (R4) and nits N1-N9.
- Files changed: `issues/persist-3-realtime/{context,plan,handoff,reviews}.md`,
  `issues/persist-3-realtime/reviews/plan-B3.1.md` (the review, as
  written by the orchestrator)
- Previous sha (batch diff base): `f6079277`
- Deviations and rationale: `B3.1` now edits four `app/` files
  (`fake-cloud.ts`, `fake-cloud.test.ts`, `cloud.contract.ts`,
  `cloudLists.test.ts`): a schema batch runs `npm run e2e` after its
  approve (`process-guards`), and the contract's "reorder that misses an
  entry is refused" would fail against the tolerant `reorder_list`.
- Review: required (trigger: migration, SECURITY DEFINER, sync feed),
  report issues/persist-3-realtime/reviews/plan-B3.1.md -
  fix-then-continue; second look next

## Verification
- Commands run (exact): none (planning pass; reading only)
- Results: -
- Gates: planning only; no `npm run check` (no code changed)

## Next batch (implement-ready)
- First: `B3.0` - the precursor contract commit on `main` (`plan.md`
  section 10.0): `cloud.contract.ts` case G's refused write becomes a
  duplicate `add`, the reorder refusal goes; `COVERAGE.md` G; gates
  `rtk npm run check`, `npm run e2e`; commit, push alone (owner,
  2026-09-27). It closes the window from `B3.1`'s test push to R3's
  closeout push in which every other `e2e`, and `main`'s deploy, would
  fail.
- Then: `B3.1` - the database half and the tolerant reorder (`plan.md`
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
- The second-look plan review (`agent-guard.mjs` denies every
  implementer of this task, `B3.0` included, until
  `reviews/plan-B3.1-2.md` reads `Verdict: approve`).
- `display-settings` ships first (release slot). Q2 is an owner action
  after `B3.2` is live.

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
