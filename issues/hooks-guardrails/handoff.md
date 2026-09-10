# Handoff - TASK hooks-guardrails

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/hooks-guardrails/context.md`, then `plan.md`, then this file.

## Status
- Task status: **done**. B1 (the only batch) implemented and committed in
  one commit, 2026-09-10 - see "Completed" below for the sha and "Next
  batch" for why there is none.
- Reviewed: **approve** (reviewer, Opus, read-only, 2026-09-10). It
  re-derived `isCheckInvocation` from the shipped file and ran ~50 adversarial
  shapes through it: no ordering, repetition or interleaving of the `cd` and
  `set -o pipefail` strips admits anything new, and all six of row 30's
  forgery shapes are refused by the shipped code, not merely by a selftest
  string. It confirmed rule 2g inert on an absent or non-boolean flag, rule 2h
  fail-open on every malformed/dead/stale/missing-lock path, the lock acquired
  before the `test-output/` wipe and unable to wedge the tree, and one
  canonical invocation across `.claude`, `CLAUDE.md` and `docs`. It verified
  `selftest.mjs` at **292 passed, 0 failed** itself. One gap, fixed in
  reconciliation (below); nits are in Deferred. It also judged the two
  commits acceptable (a handoff cannot carry its own sha) and the
  `check-observer.mjs` doc-comment fix correct under the campsite rule.
- Last agent: orchestrator (2026-09-10, reconciliation: the review's one
  finding plus its nit 3, `.md` only - see "Completed")
- Prior agent: implementer (2026-09-10: implemented plan.md section 5 steps
  1-10 exactly - the shared regex and observer prefix strip, the lock
  module, the runner wiring, rules 2g and 2h in `bash-guard.mjs`, the
  reminder's timeout and persisted-file hints, selftest cases `#64-#101`
  plus the `#29`/`#49e` extensions, README/prompts/`docs/parity.md`/
  `CLAUDE.md` text, probes A0/A/B, one commit)
- NEEDS_HUMAN_CONFIRMATION: **no**. Q1 was the one question and the owner
  answered it (`context.md`, decision 3): the observer accepts a leading
  `set -o pipefail`, the canonical call becomes
  `set -o pipefail; npm run check 2>&1 | tail -n 120`, the plain pipe stays
  accepted for a human, and every forgery the row lists must still be
  refused with its selftest case - implemented as written. The Q1 block
  below is kept for its reasoning; it was settled input, not a question, by
  the time this batch started.
- Branch: `main`
- Base / starting commit: `a404a52` (HEAD at dispatch, matching the four
  preconditions the orchestrator measured before dispatch). See "Completed"
  for the commit this batch produced on top of it.

Verdicts, one line each (full rows in `plan.md` section 3):

1. Backgrounded `npm run check` - **hook**, rule 2g (candidate 27, adopt;
   approved by the owner as written; its deny message now quotes the new
   canonical invocation).
2. Two heavy runs on one tree - **hook plus runner lockfile**, rule 2h
   (candidate 28, adopt; bundled by owner decision).
3. HEAD moving under a session - **no hook** (candidate 29, reject for now).
4. A worker re-running a long check because the result cannot be read
   back - measured in `plan.md` section 2d, seven shapes:
   - R1, re-run to learn the exit status (twelve extra check runs across
     five sessions, three of them today): **documented invocation plus one
     relaxation of the gate's attribution rule** - `check-observer.mjs`
     accepts a leading `set -o pipefail;`, and the canonical call becomes
     `set -o pipefail; npm run check 2>&1 | tail -n 120` with Bash
     `timeout: 600000` (candidate 30, adopt, pending Q1). Measured on the
     Bash tool: the plain pipe returns a failed check as `(Bash completed
     with no output)`; with the prefix it returns `Exit code 1`.
   - R2, `$?` asked of a fresh call (two, both inside R1): **README
     sentence**, no hook (candidate 33, reject).
   - R3, the host moves a foreground call to the background at its
     `timeout` (27 recorded; `npm run check` with the default 120 s once,
     eight polling calls and a turn ended waiting): **reject for now,
     sketched** (candidate 31). B1 writes the timeout into five places
     including the 2g deny message; that prose has not had its chance to
     fail, and the deny's own failure mode (an absent field denies every
     check) needs probe A0's measurement first.
   - R4, output over the ~30,000-character cap (parity only; one wasted
     ~9 min run; the tool persists the full output and names the file):
     **one clause in the 2f reminder and one README sentence**, no hook
     (candidate 34, reject).
   - R5, R6, R7 (backgrounded task files, checks outliving the 600 s
     maximum, results read from a file): not new failures; leave alone,
     recorded in `plan.md` sections 2d and 9.

**Q1 - relax the gate's attribution rule to accept a leading
`set -o pipefail`?** Recommended: **yes**, exactly as `plan.md` section 5
step 1 specifies - the tokens `set -o pipefail` plus one `;` or `&&`, at
the start, either side of the `cd` strip, nothing else stripped, the plain
pipe still accepted. Forgery: the prefix writes nothing to stdout, so the
check stays the only stdout producer, and every existing refusal applies
after the strip; six forgery shapes are pinned by selftest `#96-#101`,
including `set -o pipefail; echo "All files"` and `set -o pipefail; npm run
check > o.txt 2>&1; grep "All files" o.txt`. A forger who omits the prefix
is where the gate stands today; with it a failed check's `exit_code: 1`
reaches the observer and it refuses to arm regardless of markers or tail
size, so the change only tightens the gate. Options B (refuse; tell the
worker to read `npm error` lines - twelve re-runs say that line is not read)
and C (require the prefix; breaks the human's plain `npm run check`) are in
`plan.md` section 10. If the answer is no, the fallback in section 5 removes
one regex line and ten cases and puts the plain form back everywhere.

Measured vs assumed: `PreToolUse(Bash)` firing on a backgrounded call is
measured (first pass). The Bash tool's exit-line behaviour with and without
the prefix, the move-to-background-on-timeout behaviour and the output cap
are measured (third pass, section 2d). The presence of
`tool_input.run_in_background` and `tool_input.timeout` in the hook payload
is assumed and is probe A0 (a scratch edit, reverted). `kill(pid, 0)`
liveness across processes is probe B.

## Completed
- Batch name/id: B1 - the guardrails around a long check (the only batch;
  implemented in full, plan.md section 5 steps 1-10)
- What shipped this pass:
  - `lib.mjs` exports `CHECK_INVOCATION_RE`; `check-observer.mjs` imports it
    (its local `CHECK_RE` copy deleted), and `isCheckInvocation` strips a
    leading `set -o pipefail;`/`&&` alongside the existing `cd` strip, doc
    comment extended (and its stale example fixed to the canonical form -
    a local cleanup in a file this batch already touched).
  - `tests/parity/lock.js` created verbatim from the plan: `acquire`,
    `touch`, `release`, `readLock`, `isLive`, `describe`, `LOCK_TTL_MS`.
  - `tests/parity.js` requires the lock, acquires before the
    `test-output/parity/` wipe (exits 1 with the Russian message on a live
    lock), heartbeats once per state, releases via `process.on('exit')`,
    header comment gained the one-run-per-tree paragraph.
  - `bash-guard.mjs`: imports the lock module inside a fail-open `try`;
    `MSG.backgroundCheck` and `MSG.parityLock`; rule 2g
    (`evaluateBackgroundCheck`) and rule 2h (`evaluateParityLock`,
    `HEAVY_RUNS`) inserted between the commit gate and the long-check
    reminder; entry point wired; reminder message rewritten to the
    canonical invocation with the 600000 hint and the persisted-file
    clause; header comment now says "seven rule families" and documents
    `segmentInfo`'s reader/wrapper handling.
  - `selftest.mjs`: header range extended to `#1-#101`; helpers
    `scratchLockPath`/`writeLock`/`removeLock`/`deadPid`/`lockDeny`;
    `testBackgroundCheck()` (`#64-#75`) and `testParityLock()` (`#76-#91`,
    async) added to `main()` after `testLongCheck()`; `#29` extended to
    assert `600000` and the canonical invocation; `#49e`'s label reworded
    to "the plain pipe, still accepted"; ten new `attributionCases` rows
    `#92-#101` for the prefix's four accepted and six refused shapes.
  - Durable text: `.claude/README.md` (hook table rows for `bash-guard.mjs`
    and `check-observer.mjs`; "Run a long check" replaced whole; new "One
    heavy run at a time" paragraph; three new "Known limitations" bullets;
    a new dated "Facts settled" list for this task; candidate row 27
    flipped to adopt and rows 28-34 appended verbatim from `plan.md`
    section 3, row 30's verdict cell folded to plain adopt); both prompts
    (`implement.prompt.md` step 7, `orchestrate.prompt.md`'s "did not
    work" paragraph); `docs/parity.md` "Before a run"; `CLAUDE.md`'s one
    line under Quality gates.
  - Row 31 (the no-timeout deny) was **not** shipped, as scoped - its
    precondition (probe A0's key-shape measurement) is recorded below for
    whoever ships it later.
  - `issues/47/handoff.md`'s false gotcha ("`npm run check` starts with
    `prettier --check .`, which covers markdown") was already gone before
    this batch started - `grep -n "starts with \`prettier"
    issues/47/handoff.md` finds nothing, and `a404a52`
    ("docs(issue-47): close B5.1, withdraw a gotcha that was never true")
    is the commit that removed it. Nothing for this batch to do there;
    `plan.md` section 5 does not assign that file to it either way.
- Files changed: `.claude/hooks/lib.mjs`, `.claude/hooks/check-observer.mjs`,
  `.claude/hooks/bash-guard.mjs`, `.claude/hooks/selftest.mjs`,
  `tests/parity.js`, `.claude/README.md`,
  `.claude/prompts/orchestrate.prompt.md`,
  `.claude/prompts/implement.prompt.md`, `docs/parity.md`, `CLAUDE.md`,
  `issues/hooks-guardrails/plan.md`, `handoff.md`, `context.md`. Created:
  `tests/parity/lock.js`.
- Commit(s): one commit, staged by name - `b6a2fcd`
  `feat(hooks): the check call shows its status, cannot be lost, runs alone`.
  Working tree clean afterward; `git log --oneline -3` ->
  `b6a2fcd`/`a404a52`/`d1c1367`, HEAD unmoved from dispatch until this
  commit landed on top of it.
- Deviations and rationale: none against plan.md section 5's steps. One
  local fix within a touched file, per CLAUDE.md's campsite rule: the
  `isCheckInvocation` doc comment in `check-observer.mjs` had a stale
  example (`npm run check 2>&1 | tail -120`, no `set -o pipefail` and no
  `-n`) sitting directly above the freshly written paragraph about the
  prefix; corrected to the canonical invocation so the comment does not
  contradict itself. CLAUDE.md's new line sits directly under the
  ```npm run check``` fence with no blank line before it (blank line kept
  only before the next paragraph) so the net addition is exactly one
  physical line, matching the plan's `wc -l` acceptance number (195, not
  196).

## Verification
- Commands run (exact) and results, this pass, in order:
  - Preconditions (re-confirmed, not re-derived - the orchestrator's
    2026-09-10 measurement stood): `git log --oneline -3` ->
    `a404a52`/`d1c1367`/`b269e20`, matching dispatch; `git status
    --porcelain` -> only `issues/hooks-guardrails/handoff.md` modified (the
    orchestrator's own pre-dispatch edit), no foreign `app/`/`tests/` path;
    `wc -l CLAUDE.md` -> 194.
  - `node .claude/hooks/selftest.mjs` after the code edits ->
    **292 passed, 0 failed** (198 before, +94 new checks across the two
    new test functions and the extended `#29`/`#49e`/attribution cases).
  - `npx prettier --write .claude/hooks/*.mjs` (the plan's step 4i) - only
    `selftest.mjs` reformatted (whitespace only, re-verified with
    `node .claude/hooks/selftest.mjs` afterwards, same 292/0); a second
    `--write` on `check-observer.mjs` alone after the doc-comment fix
    reported unchanged. No `--check` failures.
  - `grep -rn "npm run check 2>&1" .claude CLAUDE.md docs` - every match
    carries `set -o pipefail;` immediately before it, except the
    deliberate selftest cases (`#65-#67`, `#92-#101` region, `check-
    observer.mjs`'s doc comment after the fix above) which are exactly the
    plain/forged/recorded shapes the acceptance criterion allows.
  - Probe A0 (`plan.md` step 7): scratch-instrumented `evaluateLongCheck`
    to echo `Object.keys(toolInput)`, `timeout` and `run_in_background`.
    Foreground `cd /nonexistent-hooks-probe-dir && npm run check` with
    Bash `timeout: 600000` -> reminder fired (family `check`, first time
    this session), `[probe: ["command","timeout","description"]
    timeout=600000 bg=undefined]`. Because this session's `session_id` is
    fixed and the `check` family's once-marker was now consumed, the
    "no timeout" shape was probed on a different family instead of a
    second fresh session (same code path, same question): foreground
    `cd /nonexistent-hooks-probe-dir && npm run check:built` with no Bash
    `timeout` argument -> `[probe: ["command","description"]
    timeout=undefined bg=undefined]` - the key is **absent**, not `null`.
    Both calls exited 1 on the `cd` and ran nothing. Scratch edit reverted;
    `git diff .claude/hooks/bash-guard.mjs | grep -n "probe:"` -> no match
    (exit 1, confirmed).
  - Probe A (`plan.md` step 8): backgrounded (`run_in_background: true`)
    `cd /nonexistent-hooks-probe-dir && npm run check` -> **denied** with
    `MSG.backgroundCheck` verbatim. `tool_input.run_in_background` reaches
    `PreToolUse` as `true` on this host, measured 2026-09-10. Rule 2g
    stays; row 27 recorded as adopt with this date in the README.
  - Probe B (`plan.md` step 9), no parity run alive beforehand, lock
    absent: (1) backgrounded `node -e "const l=require('./tests/parity/
    lock.js'); l.acquire(process.cwd(), ['probe']); setTimeout(()=>{},
    180000)"` -> lock written, pid 180244. (2) Foreground `node
    tests/parity.js --nonexistent-probe-filter` -> **denied**, reason
    named `pid 180244`, the start time and `probe`; foreground `npm run
    lint` -> allowed (clean, no lint errors). (3) `taskkill //PID 180244
    //F` -> holder killed; `cat test-output/parity.lock` still showed the
    dead pid (crashed-run state confirmed); foreground `node
    tests/parity.js --nonexistent-probe-filter` again -> **not denied**
    (only the long-check reminder spoke), ran, found no matching states,
    exited, and released its lock (`test-output/parity.lock` absent
    afterward - no manual cleanup needed). Both forks in the plan
    (live-not-denied, dead-denied) were **not** hit - every step matched
    its expected branch, nothing to stop-and-report.
  - Gate: `set -o pipefail; npm run check 2>&1 | tail -n 120`, foreground,
    Bash `timeout: 600000` - format/lint/typecheck/data/derived/i18n all
    clean, `.claude/hooks/selftest.mjs: 292 passed, 0 failed`, vitest
    `Test Files 35 passed (35)`, `Tests 732 passed (732)`, coverage `All
    files 96.67/89.64/96.57/97.01`. No `Exit code` line (status 0).
    `cat .claude/.check-cache.json` afterward ->
    `{"key":"6cd429588709e821","at":1789048401,"command":"npm run check"}`
    - a fresh `at`. `wc -l CLAUDE.md` -> **195**, matching the acceptance
    number.

## Reconciliation (orchestrator, 2026-09-10, after review)

One `.md`-only commit; `.claude/README.md` is gate-exempt (`isExempt`), so no
`npm run check` re-run was needed and the armed cache for `b6a2fcd`'s tree
still stands.

- **The review's one finding.** `context.md`'s "two pieces of durable text B1
  owns" named the markdown-coverage sentence, and plan section 5 step 6's
  verbatim README paragraph silently dropped it - a planning miss the
  implementer could not have caught while following the plan literally. The
  "Run a long check" section now ends with a paragraph saying the check does
  not cover markdown at all, that `.prettierignore` has carried `*.md` since
  `5ab5880` with its reasoning beside it, that an `issues/**` or
  `docs/specs/` edit therefore can neither fail a check nor be corrupted by
  one (which is also why the gate exempts those paths), how to change it, and
  the trap that `npx prettier --check <some>.md` prints a success message
  while matching zero files. The other piece - deleting issue 47's false
  gotcha - had already landed in `a404a52`.
- **Nit 3.** The hook table's rule 2h row omitted `check:fast` from the
  blocked heavy families. It is blocked (`LONG_CHECKS`'s `/^npm run check/`
  matches it, proved by selftest `#77`); only the table was wrong.

## Next batch
- None. This was the only batch (`plan.md` section 7; "There is no B2").
- **`plan.md` is deliberately retained.** `.claude/README.md`'s candidate
  row 31 points at `plan.md` section 5, "Row 31, when it is needed" for the
  verbatim sketch, so the closeout rule's condition - delete it once nothing
  in it is still referenced - is not met. Everything else durable already
  lives in `.claude/README.md` and `docs/parity.md`. Whoever ships row 31
  should move the sketch into its README row and delete `plan.md` then.
- Not shipped, by scope, with its own precondition already measured: row
  31 (the no-timeout deny), sketched verbatim in `plan.md` section 5, "Row
  31, when it is needed". Probe A0 above measured `tool_input.timeout`
  arrives as a number when set and is **absent** (not `null`) when not -
  the precondition row 31's sketch requires before it can ship. Ship it
  only on the first recorded check actually lost to the default timeout,
  per the row's own verdict in `plan.md` section 3 and `context.md`.

## Blockers
- None. The task is done.

## Deferred

Review nits, 2026-09-10. None justified a remediation cycle; the reviewer's
one blocker-shaped finding was fixed in reconciliation instead.

- `context.md`'s measured fact 2 still names
  `set -o pipefail; npm run check 2>&1 | tee <log> | tail -n 120` as the form
  B1 should write into its five places. It is superseded: the owner's
  decision 3 and the shipped batch use the `tail`-only form, and "no second
  form circulates" is a settled constraint. The `tee` measurement itself
  stands. The reviewer confirmed by direct probe that the observer **does**
  accept a `tee` pipeline with or without the prefix - so fact 2's
  read-from-code claim was right - but nothing pins that with a selftest
  case, because `tee` left the canonical form before the case list was
  written. Measured, not pinned.
- `tests/parity/lock.js:54`: `describe()` can throw `RangeError` on a
  finite-but-out-of-range `startedAt`; `readLock` validates `at`, not
  `startedAt`. In the hook this fails open (`guard()` swallows it); on
  `tests/parity.js:299`'s already-running path it would surface as an
  uncaught throw. Needs a live pid plus a hand-corrupted lock.
- `tests/parity/lock.js:68`: `acquire` is read-then-write, not atomic (no
  `wx` open), so two runs starting in the same instant can both acquire.
  Consistent with "a guard against habit and haste, not against an
  adversary".
- The heartbeat covers only the `STATES` loop; browser launch, `prepare` and
  post-loop reporting do not touch the lock. If either exceeds the 15-minute
  TTL the lock reads stale while the run is alive - the fail-open direction
  (the guard goes quiet), never a false block.
- **Pre-existing, recorded so it is not rediscovered as new:** the `cd` strip
  runs before the `$(`/backtick test, so `cd $(pwd) && npm run check` is
  accepted by the observer. Not a stdout-forgery vector - a command
  substitution's stdout is captured by the substitution and never reaches the
  tool's captured stdout, which is what the `All files` test reads. Identical
  regex, identical ordering, before and after `b6a2fcd`.
- `CLAUDE.md:104` sits flush against the closing fence with no blank line, to
  hit the plan's `wc -l` = 195 acceptance number. Renders correctly; the
  constraint was self-imposed.

Standing deferrals:

- Row 31, the no-timeout deny, on the first check lost to the default
  timeout after this batch's prose has had its chance; sketch in `plan.md`
  section 5, precondition measured by probe A0.
- Candidate 29's HEAD-moved notice, on the first recorded failure of the
  orchestrate prompt's "Your writers are not the only writers".
- A lock-holding wrapper for `npm run check`, on the first recorded
  parity-beside-check collision.
- A check that outlives the tool's 600 s maximum (six recorded, the last
  today): the README's fork-pool stall, not a timeout problem; nobody
  should answer it by raising the timeout hint.
- Parity's one-line-per-page diff text is what pushes its results over the
  tool's cap; shortening it is a `tests/parity.js` change with diagnostic
  cost.
- `node tests/run-all.js` cannot fit the Bash tool's 600000 maximum; the
  reminder's "stay in this turn" is unobeyable for it. Not this task's
  failure.
- **For the issue 47 reader:** the `tests/parity.js` edit in this batch
  invalidates the legacy screenshot cache (the file hashes itself into the
  key). The first parity run after this commit is cold - ~867 s in CI,
  longer locally. Whichever issue 47 batch follows B5.1 pays it once.

## Notes
- Mocks path: none (no UI)
- Screenshot findings: none
- Cleanup performed / retained artifacts: probe A0's scratch edit to
  `bash-guard.mjs` was reverted before committing (confirmed by `git diff`
  showing no `probe:` text - see Verification). Probe B's lock file
  (`test-output/parity.lock`, gitignored) was released by the runner itself
  on its last step and is absent; nothing left to delete by hand. This
  session's dedupe markers in the gitignored `.claude/.hook-state.json`
  (`long-check:check`, `long-check:check:built` from probe A0, plus the
  various probe/selftest session ids used above) are runtime state, pruned
  to five sessions automatically by `lib.mjs` - not cleaned up by hand, per
  prior task practice. Nothing else was written outside the files listed
  under "Completed".
- Session end partial progress (if any): none - the batch is complete and
  committed.
