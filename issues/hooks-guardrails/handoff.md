# Handoff - TASK hooks-guardrails

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/hooks-guardrails/context.md`, then `plan.md`, then this file.

## Status
- Task status: blocked - planned, implement-ready, waiting on two things:
  issue 47's B5.1 landing (the tree fails typecheck on its uncommitted work,
  `.claude/hooks/*.mjs` is a covered path for the commit gate, and B5.1
  holds `tests/parity.js`, which this batch edits), and the owner's answer
  to Q1 below.
- Last agent: planner (2026-09-10, third pass: measured the retrieval
  failures across every session and subagent transcript, folded the one
  adopted instrument into B1, sketched the one rejected-for-now deny,
  rewrote this file, appended durable facts to `context.md`; nothing
  written outside `issues/hooks-guardrails/`; no hook, settings, app or test
  file touched)
- NEEDS_HUMAN_CONFIRMATION: **yes** - one question, at the end of this
  section.
- Branch: `main`
- Base / starting commit: `720266d` (HEAD at this pass; B5.1's paths still
  uncommitted on top of it, `tests/parity.js` among them)

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
- Batch name/id: planning (three passes)
- What shipped this pass: `plan.md` - revision note; failure 4 in section
  1; section 2d (the evidence: 3,094 Bash calls paired with results, the
  three tool probes, seven shapes with counts and verdicts); rows 30-34 and
  four rejected extensions in section 3; "The third instrument folds in
  too" in section 4; section 5's objective, files, constraints, step 1 (the
  strip), step 4b/4f (the messages), step 5 (cases `#92-#101` and the
  `#29`/`#49e` extensions), step 6 (the README paragraph rewritten whole,
  the implement prompt, the `CLAUDE.md` line, the facts list), probe A0,
  step 10's commit, the row 31 sketch, acceptance criteria, risks,
  fallback; sections 6-10 updated; this handoff; `context.md` gained the
  pass's durable facts
- Files changed: `issues/hooks-guardrails/plan.md`, `handoff.md`,
  `context.md`
- Commit(s): none - `issues/**` is gate-exempt, but the orchestrator owns
  reconciliation and the tree is B5.1's until it lands
- Deviations and rationale: none against the brief. The brief allowed
  "fold or split, your call": folded, for the reason in `plan.md` section 4
  - row 30 edits rule 2g's own message string and the 2f reminder, so a B1
  without it ships a deny that teaches the form that hides the exit code,
  and a B0 before it waits on B5.1 just the same. Row 31 is the one place
  the pass declined a deny the brief's framing invited: the reasoning is in
  its verdict cell and section 10.

## Verification
- Commands run (exact), this pass:
  - A scratch extractor over `~/.claude/projects/E--dev-daggerheart-loot/`
    (15 session and 26 subagent `.jsonl` files): every Bash `tool_use`
    paired with its `tool_result`, then classified - 3,094 calls, 3,093
    with results, 135 `run_in_background: true`, 296 with an explicit
    `timeout`, 75 persisted results, 27 moved-to-background results, 0
    "Command timed out" results
  - `bash -c 'false | tail -n 2; echo $?; set -o pipefail; false | tail -n
    2; echo $?; (exit 3) | tail -n 1; echo ${PIPESTATUS[0]}'` - 0, 1, 3;
    Git Bash 4.4.23
  - On the Bash tool itself, three calls: `false | tail -n 2` -> `(Bash
    completed with no output)`; `set -o pipefail; false | tail -n 2` ->
    `Exit code 1`; `set -o pipefail && (echo "line of output"; exit 3) |
    tail -n 2` -> `Exit code 3` then the output
  - `awk` over `CLAUDE.md` - 21 lines over 80 characters, longest 143;
    `wc -l` 194
  - Greps for every quoted invocation: `bash-guard.mjs` (reminder),
    `check-observer.mjs` (comment), `selftest.mjs` (`#49e`, `#49f`),
    `implement.prompt.md` step 7, `README.md` line 80
- Results: the anchor fact holds; the harness prints `Exit code N` only on
  a non-zero status, and a piped check's status is `tail`'s; the harness
  never kills a command at its timeout, it backgrounds it; the output cap
  is about 30,000 characters (largest shown 29,787, smallest persisted
  29.8 KB) and the full output is saved to `tool-results/<id>.txt`
- Gates: none run; no production file changed. Selftest not run (no hook
  edit to verify; the tree is another writer's).

## Next batch (implement-ready)
- Name: **B1 - the guardrails around a long check** (rule 2g, backgrounded
  check; rule 2h, live parity lock; the observer's `set -o pipefail`
  prefix and the one canonical invocation; one commit)
- Objective: `bash-guard.mjs` denies a Bash call with
  `tool_input.run_in_background === true` whose command contains an
  `npm run check` invocation in any segment, and denies a heavy run while
  `test-output/parity.lock` is live; `tests/parity.js` writes, heartbeats
  and releases that lock; liveness is one definition in
  `tests/parity/lock.js`; `check-observer.mjs` accepts a leading
  `set -o pipefail` (`;` or `&&`, either side of the `cd` strip, nothing
  else) so the recommended call carries the check's own exit code; the
  canonical invocation `set -o pipefail; npm run check 2>&1 | tail -n 120`
  with `timeout: 600000` is the one string in the 2g deny, the 2f reminder,
  the README, both prompts and the `CLAUDE.md` line; the reminder also says
  to grep a persisted result rather than re-run; the check regex is shared
  from `lib.mjs`; selftest proves both denies, every no-fire case, the four
  accepted prefix shapes and the six refused ones; three live probes
  measure what the selftest cannot.
- In scope: `plan.md` section 5, steps 1-10, exactly.
- Out of scope: row 31 (sketched in section 5, not shipped); any other
  command family for rule 2g; a file-redirected foreground check; process
  enumeration; a lock written by `npm run check`, vitest or `run-all.js`;
  anything under `app/`; `tests/run-all.js`, `tests/parity/specs.js`,
  `tests/parity/driver.js`; `.claude/settings.json`; the once-marker
  behaviour of the reminder; requiring the prefix; stripping any other
  `set` form; parity's diff line format.
- Files expected: create `tests/parity/lock.js`; edit `.claude/hooks/lib.mjs`,
  `.claude/hooks/check-observer.mjs`, `.claude/hooks/bash-guard.mjs`,
  `.claude/hooks/selftest.mjs`, `tests/parity.js`, `.claude/README.md`,
  `.claude/prompts/orchestrate.prompt.md`,
  `.claude/prompts/implement.prompt.md`, `docs/parity.md`, `CLAUDE.md`,
  `issues/hooks-guardrails/plan.md`, `handoff.md`, `context.md`
- Steps: `plan.md` section 5, "Ordered steps" 1-10. The lock module's full
  text, the strip's regex and comment, all three messages, both rules, the
  runner wiring, the `SELFTEST_CASES` list (`#64-#101` plus the `#29` and
  `#49e` extensions), the README paragraph (verbatim), the other doc edits
  and all three probes with their forks are written there; do not redesign
  them.
- Acceptance criteria: `plan.md` section 5, "Acceptance criteria".
- Verification commands:
  - Preconditions first: `git status --porcelain` (no foreign `app/` or
    `tests/` paths), `node .claude/hooks/selftest.mjs` (198 pass on the
    untouched tree), `wc -l CLAUDE.md` (194)
  - After edits: `node .claude/hooks/selftest.mjs` (new count, recorded
    here), `npx prettier --check .claude/hooks`,
    `grep -rn "npm run check 2>&1" .claude CLAUDE.md docs` (only prefixed
    forms outside the selftest's deliberate plain and forged cases)
  - Probe A0 (`plan.md` step 7, scratch edit reverted - `git diff
    .claude/hooks/bash-guard.mjs` shows no `probe:`), probe A (step 8),
    probe B (step 9); results recorded here
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` - foreground, one
    call, Bash timeout 600000; then `cat .claude/.check-cache.json` shows a
    fresh `at`
  - `wc -l CLAUDE.md` - 195
- Risks / do-nots: `plan.md` section 5, "Risks and do-nots". The four that
  matter most: do not start while `git status` shows B5.1's paths or before
  Q1 is answered; do not delete rule 2g or 2h on an ambiguous probe
  negative - follow the forks; do not widen the prefix strip past the one
  regex; stage by name, one commit.
- Fallback (optional): probe A's measured-absent branch - rule 2h, the
  shared regex, the prefix, the reminder hints and the docs still ship;
  rule 2g and cases `#64-#75` are removed before the commit and row 27
  records the measurement. Q1 answered no - the one strip line, cases
  `#92-#101` and the `#29`/`#49e` extensions come out and the plain
  invocation goes back in every quoted place; rules 2g and 2h untouched.
  Rule 2h has no fallback: its probe negatives end in "stop and report".

## Blockers
- Issue 47 B5.1 must be committed first: the tree fails typecheck on its
  uncommitted work, it holds `tests/parity.js`, and there is another writer
  on the tree.
- Q1 (above) must be answered; the implementer's step 1 and every quoted
  invocation depend on it.

## Deferred
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
- Cleanup performed / retained artifacts: this pass wrote nothing in the
  repo outside `issues/hooks-guardrails/`. The transcript extractor and its
  outputs lived in this session's scratchpad and are disposable; the
  numbers they produced are in `plan.md` section 2d. The first pass's
  probe left a `long-check:parity` dedupe marker for that session in the
  gitignored `.claude/.hook-state.json` - runtime state, pruned to five
  sessions by `lib.mjs`. Probe B will write the gitignored
  `test-output/parity.lock`; its step 3 says to delete it by hand if it
  remains. Probe A0 is a scratch edit to `bash-guard.mjs` that must be
  reverted before the commit.
- Session end partial progress (if any): none - planning complete, one
  question open.
