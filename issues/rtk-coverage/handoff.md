# Handoff - TASK rtk-coverage
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (awaiting second review pass)
- Last agent: implementer (remediation of B1's rejected first attempt)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: worktree-agent-ace3ed9320840bf48
- Base / starting commit: `421dddb` (main)

## Completed
- Batch name/id: B1, remediation pass
- What shipped:
  - Reverted `tail -c`/`--bytes` bare-leading selftest cases to deny (no
    RTK rewrite exists for `tail -c` in any position).
  - Rewrote `bash-guard.mjs`'s rule 2j (`evaluateRtkReaders`) against a
    boundary measured directly with `rtk hook check` on the installed
    `rtk 0.48.0`, not inferred: `grep -n` denies only in a non-final pipe
    stage, inside `$(...)`/backtick, or wrapped by `xargs`/`nohup`/`time`;
    it allows a bare command, an env-var prefix, either side of any list
    operator (`&&`, `;`, `&`, a leading `cd`), and a pipe's own final
    stage. `tail -c`/`--bytes` denies unconditionally once matched, in any
    position - it has no rewrite to grant an exemption around.
  - Corrected `MSG.grepLineNumber` / `MSG.tailBytes` to state the measured
    boundary and cite `rtk hook check "<command>"` + the pinned version.
  - Fixed `check-observer.mjs`'s `isCheckInvocation`: deleted the explicit
    `rtk `-stripping line (it stripped up to 3 times in the same loop as
    `cd`/`pipefail`, while `CHECK_INVOCATION_RE` tolerates exactly 1, so
    `rtk rtk npm run check` armed the observer but was invisible to the
    guard - not a live vector, RTK never doubles its own prefix, but a
    real mismatch). Verified a single-strip alternative would NOT have
    been sufficient (it still layers a second, independent tolerance from
    `CHECK_INVOCATION_RE`'s own optional group) - deletion is correct,
    reduction to one pass is not.
  - Measured the real output size of `rtk npm run check` (21,382
    characters / 361 lines) and replaced the unquantified "prints
    considerably more" README claim with that number.
  - Corrected `.claude/README.md`'s row 43 addendum and the `PreToolUse
    (Bash)` Hooks-table row to state the measured boundary, cite `rtk hook
    check`, and pin `rtk 0.48.0`; added a "Fixed on remediation" note to
    row 45 for the check-observer bug.
  - `selftest.mjs`: reworked `testRtkReaders()` - #112-#114 stay allow,
    #116-#117 reverted to deny, #135/#137/#139 unchanged, #136 retired,
    #144-#153 added (env-prefix, four chain directions, pipe-final-stage
    allow, pipe-leading/middle-stage deny, wrapper deny). Updated the
    file's own case-range comment.
  - Created this task directory (`context.md`, `plan.md`, `handoff.md`),
    per review instruction - it did not exist for B1's first attempt (see
    `context.md`, "What this task is", for why that was defensible at the
    time and is not going forward).
- Files changed (second commit, on top of `76bc021`):
  `.claude/hooks/bash-guard.mjs`, `.claude/hooks/check-observer.mjs`,
  `.claude/hooks/selftest.mjs`, `.claude/README.md`,
  `issues/rtk-coverage/context.md`, `issues/rtk-coverage/plan.md`,
  `issues/rtk-coverage/handoff.md`.
- Commit(s): see `git log` on this branch after this handoff is written -
  filled in by the commit step, not before (this file is written first so
  the commit message can reference it).
- Deviations and rationale: went beyond the review's named blockers in
  one place - allowing `grep -n` as a pipe's own final stage
  (`cat f | grep -n x`), and the associated middle-stage deny
  (`a | grep -n x | b`) and wrapper deny (`nohup grep -n x f`) cases.
  The review's own corrected boundary ("anything in a pipeline is never
  rewritten") was disproved by directly running `rtk hook check` on that
  exact shape - see `context.md` and `plan.md` for the full trace. Flagged
  rather than silently applied: this is a real behavior change beyond
  what was asked, made because leaving it in would have kept a real,
  measured false-deny in a task whose entire purpose is removing those.
- Review: required - this is itself the remediation of a DO NOT MERGE
  review outcome; a second pass is expected before merge.

## Verification
- Commands run (exact):
  - `node .claude/hooks/selftest.mjs`
  - `rtk npm run check` (foreground, Bash timeout 600000)
  - Reviewer's probe battery: `node probe.mjs .claude/hooks` (from the
    session scratchpad), output saved as `out-remediated.txt` beside the
    reviewer's own `out-base.txt` (merge base `421dddb`) and `out-new.txt`
    (rejected first attempt, `76bc021`); three-way diffed.
  - `rtk hook check "<command>"` run individually on every shape named in
    `context.md`'s two boundary tables (grep: 23 shapes; tail: 7 shapes),
    plus `env`/`command`/`nohup`/`time` wrapper probes.
- Results:
  - `selftest.mjs`: 330 (measured merge-base baseline, matches reviewer's
    independent measurement) -> 350 (B1 first attempt) -> **373** (this
    remediation), 0 failed at every step.
  - `rtk npm run check`: passed in full (format, lint, typecheck, data
    build, selftest, unit tests, vitest with coverage); output measured
    21,382 characters / 361 lines.
  - Probe three-way diff: base -> remediated shows every intended fix
    (chain-allow, pipe-final-stage allow, bare-tail-deny,
    leading/middle-pipe-deny, rtk-rtk no-arm) and nothing else. new ->
    remediated isolates exactly the corrections this pass made: `cat f |
    grep -n x` and the chain cases flip from deny to silent; `tail -c 200
    f` and `tail --bytes=20 f` flip from silent to deny; `grep -n x f |
    wc -l` flips from silent to deny; message text updated; `rtk rtk npm
    run check` and (incidentally) `rtk cd /r && npm run check` flip from
    ARMED to no-arm (see next bullet).
  - One incidental behavior change from the item-5 fix, not asked for and
    not a regression against any named requirement: `rtk cd /r && npm run
    check` (rtk wrapping `cd`, a shape RTK itself never produces) went
    from ARMED to no-arm, because the old strip-loop's ordering happened
    to tolerate it as a side effect of over-stripping. The corrected,
    minimal fix does not special-case it, and nothing in this repo or the
    reviewer's probe list depends on that shape arming.
- Gates: `npm run check` (via `rtk npm run check`, foreground) | data/image/stub tests n/a | other: `node .claude/hooks/selftest.mjs`, `rtk hook check` probes, reviewer's probe battery

## Next batch (implement-ready)
- Name: none queued - awaiting review verdict on this remediation.
- If review passes: push the branch (not done by this session - orchestrator
  merges per the original B1 dispatch's explicit instruction not to push
  or touch `main` from here).
- If review finds another boundary error: re-run `rtk hook check` on the
  disputed shape before changing code - do not reason about it from RTK's
  own hook description or this file's table without re-measuring, since
  that is exactly the mistake made twice already.

## Blockers
- None. Two things this session could not verify and did not attempt to:
  whether `rtk`'s rewrite boundary is stable across a future RTK version
  (context.md's "Do not re-fetch unless" section names the re-check), and
  whether `env`/`command` wrapper false-denies for `grep -n` are frequent
  enough in practice to justify telling them apart from `xargs`/`nohup`/
  `time` with new code - deferred, not blocking, see plan.md.

## Deferred
- Distinguishing `env`/`command` (transparent to RTK) from `xargs`/
  `nohup`/`time` (blocking) in rule 2j's wrapper check - would need code
  independent of `lib.mjs`'s shared `unwrap()`, which strips all five
  uniformly. Left as a same-cost-as-before false deny for the transparent
  two; not measured to be a real cost (no recorded instance of an agent
  typing `env grep -n`/`command grep -n`).

## Notes
- Mocks path: n/a
- Screenshot findings: n/a
- Cleanup performed / retained artifacts: probe outputs and the bisect
  script used to rule out a hang during selftest (host load, not a bug -
  see below) are in the session scratchpad, not the repo.
- Session end partial progress (if any): none - this batch is complete
  through its own gates; ends at a committed boundary.
- Host-load note, in case it recurs: a full `node .claude/hooks/selftest.mjs`
  run was moved to the background by the Bash tool's 120s timeout during
  this session even though it later completed with exit 0 - each
  `bash-guard.mjs` subprocess spawn measured ~800-1200ms here (vs. the
  ~19s the whole suite took earlier in the same session), consistent with
  host load rather than a hang. Bisected case-by-case with a 5s-per-case
  timeout before concluding this; none hung.
