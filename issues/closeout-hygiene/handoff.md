# Handoff - TASK closeout-hygiene

## Status
- Task status: **done** - all three planned commits landed and pushed
- Last agent: orchestrator (the implementer's session ended; what remained was a
  verified tree plus two commits, so the orchestrator took the check and the commits
  rather than spending a cold writer that could only re-derive them, and that might
  invalidate the armed gate by touching a file)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: main
- Base / starting commit: `a52c17d` at planning -> `f6fb246` when the final pass began
  (five peer `docs(issue-47)` commits landed in between) -> `8116a6a` now, pushed

## Completed
- Batch name/id: B1 - closeout hygiene (hooks, review clause, closeout prose)
- What shipped: all production edits for the batch are written and correct (verified by `node .claude/hooks/selftest.mjs`, 312 passed / 0 failed, including new cases #102-#111). Only the commit split (plan step 9) is partially done - see Blockers.
- Files changed (all twelve, matching plan section 4 "In scope" exactly), now all committed:
  - `58dbd70`: `.claude/prompts/review.prompt.md`, `.claude/prompts/orchestrate.prompt.md`
  - `2aba1bc` and `8116a6a`: `.claude/hooks/session-stop.mjs`, `.claude/hooks/bash-guard.mjs`, `.claude/hooks/selftest.mjs`, `.claude/README.md`, `.claude/hooks/check-observer.mjs`, `.claude/hooks/edit-followup.mjs`, `.claude/hooks/edit-guard.mjs`, `.claude/hooks/lib.mjs`, `.claude/hooks/session-start.mjs`, `.claude/hooks/tree-key.mjs`
- Commit(s):
  - `58dbd70` `docs(agents): a review clause for session narration, and sharper closeout steps`
  - `2aba1bc` `feat(hooks): name this session's untracked writes, and refuse to orphan a plan citation`
    -> `session-stop.mjs`, `bash-guard.mjs`, `selftest.mjs`, `.claude/README.md`
  - `8116a6a` `docs(hooks): point the header comments at the README, not a retired plan`
    -> the six remaining `.mjs` files
  - All three pushed; `git rev-parse HEAD origin/main` agree at `8116a6a`.
  - `2aba1bc` was amended once before pushing: the first attempt used PowerShell
    here-string syntax inside the Bash tool, which left a literal `@` as the subject
    line. Amended with a heredoc while still unpushed.
- Deviations and rationale:
  - **The plan's "one check covers all three commits" arithmetic held technically but not in practice.** `treeKey()` is content-only and HEAD-excluding as designed, so a single passing run would indeed have armed the gate for all three commits. But two consecutive `npm run check` attempts both failed, and neither failure was in a file this batch touches:
    - Attempt 1 (after fixing a real prettier issue in the two files I'd rewritten - see below): 4 vitest test files (`app/src/lib/{listLink,lists,help,alt,print,numField,dice,tables,sections,frames}.test.ts` - the fork-pool couldn't start 10 workers) failed with `[vitest-pool-runner]: Timeout waiting for worker to respond` - the exact flake `.claude/README.md` already documents ("A check reporting zero coverage everywhere ran no test at all... re-run it rather than investigating a coverage drop"). Format/lint/typecheck/data/selftest all passed first.
    - Attempt 2 (retry, per that same README guidance): format/lint/typecheck/data/selftest all passed again (selftest: 312/0). vitest failed differently - 4 tests in `app/src/components/{searchPage,listPage}.test.ts` (neither touched by this batch), with individual test durations of 27-264 **seconds** each (should be well under a second) and three hitting the 30000ms test timeout; the fourth was a value mismatch (`expected 600 to be 750`) consistent with a race under extreme host slowness, not a real regression.
    - Both failures line up with measured host contention outside this batch's control: 17 `chrome` + 6 `msedgewebview2` processes were alive during both runs (`Get-Process`), matching `orchestrate.prompt.md`'s "stray chrome.exe" warning and `CLAUDE.md`'s "a second session's ... vitest coverage directory or parity run will corrupt the first's results, and the failure looks like a bug in whatever was running." `issues/47/plan.md` also changed under me mid-session (a new "B12.1 named" section appended, uncommitted) confirming a concurrent session is actively working the same tree - almost certainly the browser-driven `tests/app/*.js` work visible as untracked files at kickoff.
    - Per this task's explicit instruction for exactly this situation ("If the check fails on an issue-47 B12 path rather than on your own: do not fix another task's code, and do not reach for `SKIP_CHECK_GATE=1`... Commit the gate-exempt commit, stop, and report with the failing output"), I stopped after the second attempt rather than retrying further, committed only the all-`.md` (gate-exempt) commit, and am reporting here instead of forcing the gate.
  - **The prettier fix, made before either check attempt above**: `.claude/hooks/session-stop.mjs` and `.claude/hooks/selftest.mjs` failed `format:check` after my initial edits (line-wrap only, no logic change). Fixed with `npx prettier --write` on both files before the first `npm run check` attempt; confirmed via a second prettier run that the other seven touched files were already clean.
  - **The plan's acceptance criterion "`git grep -n \"issues/65/plan\\.md\"` returns exactly the two `selftest.mjs` scratch fixtures at `:130` and `:1448`, and nothing else" does not hold against the current tree, independent of anything this batch did.** Measured (`git grep -n "issues/65/plan\.md"`, run before and after all edits - identical both times):
    - `selftest.mjs:1449` (`gitSh(['add', 'issues/65/plan.md']);`) is a third scratch-fixture line, immediately adjacent to the accepted `:1448` (`appendFile('issues/65/plan.md', ...)`) - same committed-citing-file setup, just split across two lines. Pre-existing, not introduced by this batch.
    - `issues/65/handoff.md:16,225,454` cite `issues/65/plan.md` three times, as historical record of its own retirement (committed in `ccb80cb docs(agents): retire issue 65's plan, keep its rejected-candidate list`, which is HEAD's ancestor and predates this task). This file is outside this batch's "In scope" list and outside the ten citation sites `plan.md` section 2 enumerated - `issues/65/` is explicitly "history, not instructions" per `orchestrate.prompt.md` step 7, and closeout for that task already ran.
    - All ten of the `.mjs` citation sites the plan's evidence table names are repaired; `git grep -n "issues/47/plan\.md"` still returns its three unchanged `docs/` hits, confirmed.
    - This is a pre-existing gap in the plan's evidence-gathering (undercounted by one adjacent line, and didn't audit `issues/65/handoff.md`'s own text), not a design flaw and not something this batch's scope covers repairing. Flagging per "if the plan and live behaviour conflict, surface it" rather than silently claiming the literal criterion passed.

## Verification
- Commands run (exact):
  - `node .claude/hooks/selftest.mjs` (iteration, before the full check): 312 passed, 0 failed
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout 600000) - attempt 1: failed on `format:check` (prettier); fixed, see above
  - `npx prettier --write .claude/hooks/selftest.mjs .claude/hooks/session-stop.mjs` (+ 7 other touched hook files, confirmed unchanged)
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout 600000) - attempt 2 (post-prettier-fix): format/lint/typecheck/data/i18n/selftest all passed; vitest failed - 4 test files, 10 workers timed out (`app/src/lib/*.test.ts`, unrelated to this batch)
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout 600000) - attempt 3 (retry per README's documented flake remedy): format/lint/typecheck/data/i18n/selftest all passed again (selftest 312/0); vitest failed differently - 4 tests in `app/src/components/{searchPage,listPage}.test.ts`, three 30s timeouts and one value mismatch, individual test durations 27-264s (host-slowness signature, not a code defect)
  - `git grep -n "issues/65/plan\.md"` and `git grep -n "issues/47/plan\.md"` - see Deviations above for the exact result and the discrepancy against the plan's stated acceptance criterion
  - `git status --porcelain -uall` - confirmed before and after every edit that all issue-47 B12 paths remain modified/unstaged and `issues/tg-preview-refresh/`, `tests/app/` remain untracked (see below)
- Results: selftest passes cleanly and independently of the vitest flakes (it runs before vitest in the check pipeline and reports its own 312/0 both times). No failure in either check attempt touched a file this batch edited.
- Gates: commit gate armed and satisfied for the all-`.md` commit (exempt by `isExempt()`, no check needed). Not yet armed for the two `.mjs`-touching commits - blocked, see Blockers.

## Blockers
- **`npm run check` has not yet passed cleanly on this tree**, so the commit gate (`bash-guard.mjs`'s own rule, which now includes this batch's own edits) denies committing the two remaining commits. Both observed failures are in files outside this batch's scope and carry the signature of host contention (extreme per-test slowness, fork-pool worker-start timeouts) rather than a real regression - `.claude/hooks/selftest.mjs`'s own 312 cases (which do cover every line this batch changed) pass cleanly in both attempts.
- Do not use `SKIP_CHECK_GATE=1` here - per this task's instruction, that escape is for a check that cannot run, not one that fails, and this check machinery itself works (selftest proves it); it is failing on unrelated files under load.
- Root cause is a concurrent session sharing this tree (evidenced by 17 `chrome` + 6 `msedgewebview2` processes alive during both attempts, and `issues/47/plan.md` gaining a new uncommitted "B12.1 named" section mid-session) - almost certainly the browser-driven `tests/app/*.js` work visible as untracked files at kickoff. Preserved untouched throughout.

## Next batch (implement-ready)
- Name: **B1 continuation - land the two remaining commits**
- Objective: no further edits needed. All twelve files are already in their final, plan-conformant state (selftest 312/0 confirms it). The only remaining action is:
  1. Re-run `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout 600000) once host contention has cleared (no stray `chrome`/`msedgewebview2` processes competing for CPU, or the concurrent session's heavy run has finished) - check with `Get-Process chrome,chromium,msedge,msedgewebview2 -ErrorAction SilentlyContinue`.
  2. On a clean pass, make the two remaining commits exactly as specified in plan section 4 step 9 (do not touch any file between the check and the commits, or between the two commits - `treeKey()` will otherwise need a fresh pass):
     - `feat(hooks): name this session's untracked writes, and refuse to orphan a plan citation` -> `session-stop.mjs`, `bash-guard.mjs`, `selftest.mjs`, `.claude/README.md`
     - `docs(hooks): point the header comments at the README, not a retired plan` -> `check-observer.mjs`, `edit-followup.mjs`, `edit-guard.mjs`, `lib.mjs`, `session-start.mjs`, `tree-key.mjs`
     Stage by name only - never `git add -A`; this tree still carries issue 47's B12 (`app/src/*`, `tests/run-all.js`, `.github/workflows/ci.yml`, `docs/specs/{COVERAGE,DEBT}.md`, `CLAUDE.md`, `issues/47/{handoff,plan}.md`) plus untracked `tests/app/*.js` and `issues/tg-preview-refresh/`.
  3. Push once both commits land.
- Acceptance criteria still to confirm after the commits: `npm run check` passes (recorded); `node .claude/hooks/selftest.mjs` reports 312+ passed / 0 failed with #102-#111 present (already true); `git status` still shows every B12 path modified/unstaged and the two untracked directories/`.js` files untouched (already true); `.claude/README.md` documents both new behaviours and both candidate rows (already true, verify after commit).
- Note the acceptance criterion about `git grep -n "issues/65/plan\.md"` - see Deviations above; it will still show `selftest.mjs:1449` and the three `issues/65/handoff.md` lines after these commits land, and that is expected, not a regression to chase.

## Deferred
(unchanged from planning)
- A matching "do not write it in the first place" line in `.claude/prompts/implement.prompt.md`. Prevention is cheaper than review, but it is a second copy of an unmeasured rule; add it if the nit recurs.
- Whether `issues/agent-effort/`, `issues/dh-image-polish/` and `issues/hooks-guardrails/` retire, and whether `issues/dh-image-polish/refresh_artwork.py` is scratch or evidence. The human's call, on those directories' own closeout - not this task's.
- The two dated lines outside `.claude/` (`tests/parity/lock.js:5`, `tools/parity-ubuntu/README.md:27`). Neither path is touched here; they are what the new review clause is for, on whatever batch next touches them.
- The read-only closeout auditor (reviewer-shaped, reports a delete list the orchestrator executes) remains the fallback if the checklist keeps being skipped. Not built, not needed yet.
- New: whether `selftest.mjs:1449` and `issues/65/handoff.md`'s three self-citations should ever be touched. Recommendation: no - they are correct as they stand (a scratch-repo fixture and historical record respectively); only the plan's own evidence count was imprecise. Left for the human/orchestrator to note when `plan.md` retires with this task.

- New: `bash-guard` rule 2g denies an explicitly backgrounded `npm run check`, but the harness auto-backgrounds any foreground call that outlives its 600s timeout, and `check-observer` is a `PostToolUse` hook whose result then never reaches a live agent - so the gate cannot arm and 2g cannot see it. Hit three times on this task (twice by the implementer, once by the orchestrator). A planning question, not a patch to guess at: the fix may be a Stop-time reconciliation, a longer-lived observer, or accepting it and documenting the re-run. Evidence is in "Final pass" below.

## Notes
- Mocks path: none - no UI surface in this task
- Screenshot findings: none
- Cleanup performed / retained artifacts: nothing removed this pass. `issues/closeout-hygiene/` holds `context.md`, `plan.md` and `handoff.md` only; no scratch artifacts were created by this implementer pass.
- Session end partial progress: 10 of 12 files' worth of work is committed (2 files, `58dbd70`, pushed); the other 10 are fully written, verified by selftest, and staged-ready but uncommitted, blocked purely on a clean `npm run check` under current host load. No file needs further editing.

## Final pass - what actually blocked the gate, and what cleared it

The implementer's three red checks, and a fourth taken by the orchestrator, had
one cause, and it was neither this batch nor peer-session contention:

- **The host was throttled to a fifth of its nominal clock.** Peer sessions on
  issue 47 measured it while chasing the same blocker: `% Processor Performance`
  read **20** on this i7-8565U across four samples (`cfe9fdf`). That supersedes
  three earlier attributions, this session's "peer-session contention" among them
  - a percentage of a throttled core reads as a share of the machine. Their
  `f6fb246` adds the decisive test: the failing *set* was unstable across runs on
  an unedited tree (three tests, then two, then one, different each time), and a
  real regression fails the same way every run.
- Independently confirmed here: `searchPage.test.ts` and `listPage.test.ts` pass
  **65/65** run alone while failing under the full suite.
- By the final pass the throttle was gone - `% Processor Performance` read
  **145-154** - and the suite ran green first time: **1007/1007 in 63.69s**,
  against 127s on the previous run and roughly five times that while throttled.

**A second, self-inflicted delay worth recording.** A check that passed did not
arm the gate, and the cause was the invocation, not the hook: `check-observer.mjs`
requires `All files` in the observed stdout, and that run used `tail -n 25`, which
truncates the coverage table above that row. `CLAUDE.md` prescribes `tail -n 120`
for this exact reason. Re-running with the documented tail armed it immediately.
`check-observer.mjs`'s diff in this batch is a one-line comment repair; it did not
regress.

**Structural note for a future planner, not acted on here.** `bash-guard` rule 2g
denies an explicitly backgrounded `npm run check`, but the harness moves any
foreground call that outlives its 600s timeout into the background on its own, and
`check-observer` is a `PostToolUse` hook whose result then never returns to a live
agent. The gate cannot arm, and the rule meant to prevent exactly this cannot see
it. It happened three times across this task. Recorded in Deferred.

## Verification - final pass (orchestrator)

- `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout 600000):
  format/lint/typecheck (544 files, 0 errors)/data/derived/i18n green,
  `selftest.mjs` **312 passed, 0 failed**, vitest **41 files, 1007/1007, 63.69s**.
- Gate armed and verified: `.check-cache.json` key `ecd0d5a285809527` equals
  `treeKey()` for the same tree.
- `npx vitest run src/components/searchPage.test.ts src/components/listPage.test.ts`
  (isolation, taken while the host was still slow): **65 passed**.
- `git grep -n "issues/65/plan.md"` outside the selftest fixtures and `issues/65/`
  now returns only the two `.claude/README.md` candidate rows describing the new
  rule, and this task's own plan/context/handoff prose. All ten `.mjs` citation
  sites are repaired.
- `git status --porcelain -uall` after both commits: only issue 47's B12 paths
  (`app/src/*`, `CLAUDE.md`, `.github/workflows/ci.yml`, `docs/specs/*`,
  `tests/run-all.js`) modified-unstaged, plus untracked `tests/app/` and
  `issues/tg-preview-refresh/`. Nothing of this batch's remains, nothing of
  B12's was staged, `CLAUDE.md` never touched.
- `npm run check:built` not run and not required: nothing here alters what a
  screen draws.
