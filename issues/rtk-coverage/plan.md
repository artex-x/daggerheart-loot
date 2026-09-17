# Plan - TASK rtk-coverage

Written after the fact, on remediation - see `context.md` for why this
task's files did not exist when B1 was first dispatched (a fully-specified
inline batch spec stood in for plan+handoff at the time). Batches below
reflect what actually happened, not a forward design.

## Batch B1 - close the two gaps in RTK's effective coverage

**Objective:** stop two repo-owned hooks from being strictly worse than no
rule, on top of RTK's own 38% coverage ceiling.

**Scope:**
- Prefix-tolerance for the commit-gate check invocation
  (`CHECK_INVOCATION_RE`, `LONG_CHECKS`, `check-observer.mjs`'s
  normalizer), so the gate can arm on `rtk npm run check`, the shape RTK's
  own hook actually produces, not only on the piped form it cannot
  rewrite.
- Narrow `bash-guard.mjs` rule 2j (deny `grep -n`/`tail -c`) to the shapes
  RTK genuinely cannot rewrite, replacing `config-audit` B3's blanket deny.
- Retire the piped canonical form (`set -o pipefail; npm run check 2>&1 |
  tail -n 120`) as the recommended way to run the check, across `CLAUDE.md`,
  `.claude/README.md`, the implement/orchestrate prompts, and
  `small-fix/SKILL.md`.
- `selftest.mjs` coverage for all of the above.

**Out of scope (both passes):** `issues/**` outside this directory (history,
not live facts); `npm run check:built` (no screen-drawing change);
replanning or widening beyond the reader rule and the check-gate prefix.

**Acceptance criteria:**
- `node .claude/hooks/selftest.mjs` passes with 0 failures.
- One foreground `rtk npm run check` (Bash timeout 600000) passes, itself
  proving the check-gate half of the fix.
- The commit itself arms and passes the commit gate (no `SKIP_CHECK_GATE`).
- Reader-rule deny/allow decisions match a direct `rtk hook check` probe
  of the installed RTK version, not a description of RTK's own hook logic.

### Attempt 1 (commit `76bc021`) - REJECTED, DO NOT MERGE

Shipped the check-gate half correctly (verified: the commit itself armed
the gate on a bare `rtk npm run check`, proving the fix works end to end).
The reader-rule half was built to a boundary ("piped, `$(...)`, or
downstream of a `cd`/`&&`/`;`") that was never independently verified
against the installed RTK - it was inferred from RTK's own hook-matching
description in `CLAUDE.md`. Review found this boundary wrong in both
directions:
- Under-denied: a reader leading its own pipe (`grep -rn x . | head -50`)
  was silent, because the rule only checked segments after the first.
- The review's own corrected boundary, briefed for the fix, was *also*
  wrong: "anything in a pipeline is never rewritten" turned out false for
  `grep -n` as a pipe's final stage (measured rewritten) - caught only by
  running `rtk hook check` on that exact shape rather than trusting either
  party's generalisation.

### Attempt 2 (remediation, this commit) - what changed

- Reverted `tail -c`/`--bytes` bare-leading cases to deny (no rewrite
  exists for them in any position - there was never a leading-position
  exemption to grant).
- Added the leading-pipe-stage deny cases the review named
  (`grep -rn x . | head -50`, `tail -c 5 f | wc -l`).
- Allowed `grep -n` across every list-operator chain (`&&`, `;`, `&`, a
  leading `cd`, an env-var prefix) in either direction, per direct
  measurement - the review asked for this and it held up.
- **Beyond the review's brief:** allowed `grep -n` as a pipe's own final
  stage (`cat f | grep -n x`), and added a middle-pipe-stage deny case
  (`a | grep -n x | b`) and a wrapper deny case (`nohup grep -n x f`) -
  none of these were named in the review, but the corrected boundary
  requires them and they are directly measured, not inferred.
- Fixed `check-observer.mjs`'s `rtk `-stripping loop (item 5): it stripped
  up to 3 times while `CHECK_INVOCATION_RE` tolerates exactly 1, so
  `rtk rtk npm run check` armed the observer but was invisible to the
  guard. Fixed by deleting the explicit strip entirely (not reducing it to
  one pass, which would still double-tolerate - see `context.md` and the
  code comment for why).
- Measured and quantified the "tail keeps output under the cap" README
  claim the first attempt had left as an unquantified "prints
  considerably more": `rtk npm run check`'s full output is 21,382
  characters / 361 lines, comfortably under the ~30,000-character cap.
- Corrected the row 43 addendum and the Hooks table row in
  `.claude/README.md` to state the measured boundary, cite `rtk hook
  check` as the reproducible probe, and pin `rtk 0.48.0`.
- Created this directory (`context.md`, `plan.md`, `handoff.md`).

**Status:** implemented, gates run, awaiting a second review pass (see
`handoff.md`).
