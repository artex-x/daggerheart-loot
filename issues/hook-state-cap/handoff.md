# Handoff - TASK hook-state-cap
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (B1 implemented, gated and committed; B2 closeout remains)
- Last agent: implementer (2026-09-16, B1) - terminated early by a session rate limit after writing and self-testing the change; the orchestrator ran the required old-behaviour proof, the foreground gate, and the commit. See B1 Verification.
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main` (this repo has no feature branches)
- Base / starting commit: `618ad7c` (docs(hook-state-cap): open the task with the measured session-prune evidence)

## Completed
- Batch name/id: P0 - planning
- What shipped: `issues/hook-state-cap/plan.md` (design, decisions with rejected alternatives, B1 implement-ready, B2 closeout outline, Deferred) and this handoff. No production code.
- Files changed: `issues/hook-state-cap/plan.md`, `issues/hook-state-cap/handoff.md`
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

## Next batch (implement-ready)
- Name: B1 - reserve the writer, cap 64, pin it in the selftest
- Objective: `saveState()` always keeps the session being written and prunes the rest to the 64 most recently active; selftest cases `#131-#134` pin the reservation, the recency ranking and the exact cap; `.claude/README.md` records the cap and its loss condition.
- In scope: `.claude/hooks/lib.mjs` (`export const MAX_SESSIONS = 64`, `saveState(state, keepId)` per plan 3.2, three call sites in `once()`/`recordWrite()`, corrected catch comment); `.claude/hooks/selftest.mjs` (new `testStateCap()` called after `testTaskBudget()` and before `testFailOpen()`; header `#1-#134`; `testTaskBudget()` comment at `:1559-1579` rewritten per plan 4.5); `.claude/README.md` (`.hook-state.json` row at line 130; one "Known limitations" bullet after the `activeTask()` note ending line 280). Exact text for both README edits is in plan 7, step 4.
- Out of scope: `at`'s unit, the comparator and tie-break, `loadState()`, `getWrote()`, any hook message, atomic writes or race handling, `testTaskBudget()`'s isolation, `issues/config-audit/*`, `CLAUDE.md`.
- Files expected: `.claude/hooks/lib.mjs`, `.claude/hooks/selftest.mjs`, `.claude/README.md`, plus `issues/hook-state-cap/{plan,handoff}.md` in the same commit.
- Steps: plan 7, "Steps" 1-7. Summary: (1) `lib.mjs` per plan 3.2; (2) `testStateCap()` with `#131` writer survives at saturation (`MAX_SESSIONS + 8` tied `other-*` writes then `s-cap-writer`; assert its `getWrote`, the exact count, its presence - never which `other-*` survived), `#132` hand-seeded `e-1..e-N` with distinct old `at`, new write evicts `e-1` only and count stays exact, `#133` `once()` returns `true` then `false` for a writer against a tail of `MAX_SESSIONS` entries tied at the current second, `#134` `runHook('session-stop.mjs', ..., { state: capState })` names `app/src/lib/x.ts` after `#133`'s saturation, with a `git status --porcelain` precondition that `x.ts` is dirty; private `mkdtemp` state dir swapped into `LOOT_HOOK_STATE_DIR` in `try`/restored in `finally`, the `testTaskBudget()` shape; every `check()` with a `detail`; (3) `testTaskBudget()` comment and header; (4) README; (5) `node .claude/hooks/selftest.mjs` three times; (6) pre-flight then one foreground `npm run check`; (7) stage by name, commit, push.
- Acceptance criteria: plan 7, "Acceptance criteria" - in particular: `#131-#134` green with the count recorded here; restoring the old `saveState()` body once, locally, makes `#131`, `#133` and `#134` fail (recorded here, then reverted); `#44` and `#126-#130` untouched and green; README row and bullet present; `npm run check` passes in one foreground call; commit pushed.
- Verification commands:
  - `node .claude/hooks/selftest.mjs` (expect `N passed, 0 failed`, N > 357; run three times)
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout 600000, one foreground call, after pre-flight: no `golden.js`/`parity.js`/`run-all.js`/`vitest` process alive; `git status --porcelain -uall` shows only this task's files)
  - `git log --oneline -1`; `git status --porcelain -uall`
- Risks / do-nots: plan 7, "Risks / do-nots". Do not pin which tied entries survive in `#131`; do not add a warn, counter or TTL; do not touch `at`'s unit; do not weaken `testTaskBudget()`'s isolation; one session per working tree while the gate runs; verification is the selftest, not the live hook (hook config may be snapshotted at session start).
- Fallback (optional): none. `MAX_SESSIONS` is a single exported constant if the human wants a different number; every case reads it from the export.

## Blockers
- None.

## Deferred
- Torn-read wipe (`loadState()` parse failure -> next save holds only the writer) and the read-modify-write race between concurrent sessions: unmeasured, different mechanism (atomic rename or one re-read on parse failure), Windows rename-over-open-file needs a probe first. Plan 9. Its own task if ever observed.
- `wrote[path]`/`at` at second resolution against a millisecond `handoff.md` mtime in `session-stop.mjs:130`: cosmetic; if changed, both sides move together. Plan 9.
- B2 closeout after B1 is pushed: plan 8 - `git grep -n "issues/hook-state-cap/plan\.md"` must come back empty (B1 introduces no citation; the `lib.mjs` comments are self-contained), then `/handoff`, status `done`.

## Notes
- Mocks path: none (no UI).
- Screenshot findings: none (no UI).
- Cleanup performed / retained artifacts: nothing created outside `issues/hook-state-cap/`. The standalone probe referenced in `context.md` was a throwaway; it is reproduced as selftest `#131`, not kept as a file.
- Session end partial progress (if any): none. Design decisions (plan 4.1-4.7): writer always reserved (adopted); cap 5 -> 64, no TTL (adopted; TTL rejected as adding a resume-after-TTL loss path and nothing to correctness under recency ranking); `at` stays seconds and the tie-break is untouched (moot once the writer is reserved; unit change would break `session-stop.mjs:130` without a migration); no warn on drop (no reliable signal; answered by margin, tests and the README record); fail-open kept with its comment corrected to name the missing-Stop-sentence cost.
