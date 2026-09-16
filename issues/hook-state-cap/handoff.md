# Handoff - TASK hook-state-cap
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: **done** (B1 implemented, gated, committed as `db01b92` and CI-confirmed green; B2 closeout completed 2026-09-16)
- Last agent: implementer (2026-09-16, B1) - terminated early by a session rate limit after writing and self-testing the change; the orchestrator ran the required old-behaviour proof, the foreground gate, and the commit. See B1 Verification.
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main` (this repo has no feature branches)
- Base / starting commit: `618ad7c` (docs(hook-state-cap): open the task with the measured session-prune evidence)

## Completed
- Batch name/id: P0 - planning
- What shipped: this task's `plan.md` (design, decisions with rejected alternatives, B1 implement-ready, B2 closeout outline, Deferred) - retired at closeout, see Cleanup - and this handoff. No production code.
- Files changed: this task's `plan.md` and `handoff.md`.
- Commit(s): none yet - the implementer commits the task documents with B1.
- Deviations and rationale: none. `context.md` needed no refresh; every fact it holds was confirmed against the code at `618ad7c` (`saveState()` at `lib.mjs:312-326`, consumers at `session-stop.mjs:79,175`, `edit-followup.mjs:49,53`, `bash-guard.mjs:521`).

- Batch name/id: **B1 - writer reservation and cap**
- What shipped: `saveState(state, keepId)` reserves the session being written before ranking the rest; `MAX_SESSIONS = 64` exported from `lib.mjs`; all three call sites (`once()` at :364, `recordWrite()` at :368 and :379) pass `sessionId`. `at` stays in seconds, comparator and tie-break untouched, no TTL, no warn, fail-open kept with its comment corrected to name the real cost (a missing Stop sentence, not only a duplicate reminder). Selftest cases `#131-#134` added, `testTaskBudget()`'s stale comment rewritten, header to `#1-#134`. README row and limitation bullet updated.
- Files changed: `.claude/hooks/lib.mjs`, `.claude/hooks/selftest.mjs`, `.claude/README.md`, plus this task's `plan.md` and `handoff.md`.
- Deviations and rationale: none from `plan.md` B1. The implementer was terminated mid-batch by a session rate limit (HTTP 429) after the code and cases were written and self-tested at 364 passed; it had not yet run the old-behaviour proof, the gate, or the commit. The orchestrator completed exactly those three steps and wrote nothing new - verified first that the change was whole, not half-applied (`testStateCap()` called at `selftest.mjs:1952`, `MAX_SESSIONS` exported and referenced by name throughout, all three `saveState()` call sites passing `sessionId`). The editor's "`testStateCap` is declared but never read" diagnostic was stale, as it has been every time today.

## Verification
- P0 (planning): no commands; `.md`-only, no gate applies.
- **B1 old-behaviour proof (the plan's acceptance criterion).** `saveState()`'s body was temporarily reverted to the pre-fix prune (`ids.slice(0, 5)`, no reservation) with the new cases left in place, and `node .claude/hooks/selftest.mjs` run: **359 passed, 5 FAILED** -
  - `#131 writer survives its own write at saturation: its write is intact: {}`
  - `#131 ... capped at MAX_SESSIONS, writer present: count=5 (MAX_SESSIONS=64) ids=["other-25","other-26","other-27","other-28","other-29"]`
  - `#132 eviction is by least-recent at, and the cap is exact: count=5 (MAX_SESSIONS=64) ids=["s-cap-new","e-64","e-63","e-62","e-61"]`
  - `#133 once() keeps the writer at a tied saturation: seen once, not twice: first=true second=true`
  - `#134 end to end: session-stop.mjs reads the retained entry`
  All four new named cases fail against the old implementation, so they are load-bearing rather than decorative - the point of the criterion, given that this defect survived precisely because nothing failed when it fired. The fix was then restored from a scratchpad copy and the suite reconfirmed at **364 passed, 0 failed**. (`plan.md` predicted `#131`, `#133`, `#134`; `#132` also fails, as it must - it pins the cap's exact value.)
- **B1 gate.** No peer heavy run alive (`Get-CimInstance Win32_Process` filtered to `golden.js`/`parity.js`/`run-all.js`/`vitest`/`npm-cli.js run` -> 0) immediately before starting. `set -o pipefail; npm run check 2>&1 | tail -n 40`, one foreground call: **passed**, ending with the coverage summary (statements 96.61%, branches 88.58%, functions 97.10%, lines 97.34%) - the table `check-observer.mjs` requires to arm the commit gate.
- `npm run check:built` and parity: not required; no app source changed.

## Next batch
- None. B1 is the only implementation batch and it is landed, pushed and green on CI (run 35094798905 on `db01b92`: `check`, all four `golden` shards, `audit`, `secrets`, `deploy` all success). B2 was closeout and is done - see Cleanup performed / retained artifacts.

## Blockers
- None.

## Deferred
- Torn-read wipe (`loadState()` parse failure -> next save holds only the writer) and the read-modify-write race between concurrent sessions: unmeasured, different mechanism (atomic rename or one re-read on parse failure), Windows rename-over-open-file needs a probe first. Plan 9. Its own task if ever observed.
- `wrote[path]`/`at` at second resolution against a millisecond `handoff.md` mtime in `session-stop.mjs:130`: cosmetic; if changed, both sides move together. Plan 9.
- B2 closeout after B1 is pushed: plan 8 - `git grep -n "issues/hook-state-cap/plan\.md"` must come back empty (B1 introduces no citation; the `lib.mjs` comments are self-contained), then `/handoff`, status `done`.

## Notes
- Cleanup performed / retained artifacts (closeout, 2026-09-16):
  - **Removed** this task's `plan.md`. Its durable content was rehoused first, in the same commit, because rule 2i denies the deletion while any tracked line still cites the path: the four rejected alternatives (tie-break fix, TTL, millisecond `at`, warn-on-drop) now live in `.claude/README.md` beside the `saveState()` limitation bullet, each with the reason it lost. B1 had already put the behaviour there (cap of 64, writer always kept, and what the old cap of 5 cost). Two citations in this file were rephrased; `git grep` outside the plan itself came back empty before the removal.
  - **Kept** `context.md` and this `handoff.md`. `context.md` holds the measurements - the deterministic prune probe, the live state file's 5 saturated entries spanning 71 hours, the consumer list - that any future change to this area should be checked against rather than re-measured.
  - **No mocks or scratch artifacts** were created in the repo by this task. The orchestrator's temporary copy of `lib.mjs` (taken so the old-behaviour proof could be reverted safely) lived in the session scratchpad outside the repository and is gone with it.
- Screenshot findings: none (no UI).
- Session end partial progress: none. The B1 implementer was terminated mid-batch by a session rate limit; the orchestrator completed the proof, gate and commit, and this handoff records that division of work under B1's Deviations.
