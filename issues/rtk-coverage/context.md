# Context - TASK rtk-coverage

## What this task is

`rtk discover` measured RTK covering only 38% of Bash commands: 2025 of
3642 sampled commands (55%) contain a `|` or `$(...)`, and RTK's own
PreToolUse hook only rewrites a command it can match at the start of a
line. Two repo-owned hooks made this worse on top of RTK's own ceiling:

1. `check-observer.mjs`'s `CHECK_INVOCATION_RE` was anchored at `^npm`, so
   the commit gate could only ever arm on the one shape RTK cannot
   rewrite (`set -o pipefail; npm run check 2>&1 | tail -n 120`), never on
   a bare `npm run check` - because RTK silently rewrites the bare form to
   `rtk npm run check` before any hook sees it, live-probed by a temporary
   `appendFileSync` in `check-observer.mjs` that logged `cat package.json`
   arriving as `rtk read package.json`.
2. `bash-guard.mjs` rule 2j denied `grep -n`/`tail -c` in every shape,
   including ones RTK rewrites cleanly, at `config-audit` B3 (`7cc259d`).

B1 fixed both. It shipped once (`76bc021`), then failed review
(**DO NOT MERGE**) because the reader-rule boundary it was briefed against
was itself measured wrong twice over - first by `config-audit` B3, then
again by the B1 remediation brief. Both times the fix was to actually run
the tool (`rtk hook check "<command>"`) rather than reason about it from
RTK's own hook-matching description. This file exists so a third pass
does not repeat that.

## Measured RTK boundary (pinned to `rtk 0.48.0`, reproducible)

Every row below is `rtk hook check "<command>"`, run directly in this
worktree, 2026-09-18. `rtk hook check` prints the rewritten command on a
rewrite, and exits 1 with `No rewrite for: <command>` otherwise - that
exit code is the signal, not the text.

### `grep -n` / `--line-number`

| shape | rewritten? |
|---|---|
| `grep -n foo path.ts` (bare leading) | yes -> `rtk grep -n foo path.ts` |
| `A=1 grep -n foo path.ts` (env-var prefix) | yes -> `A=1 rtk grep -n foo path.ts` |
| `cd docs && grep -n x f` | yes -> `cd docs && rtk grep -n x f` |
| `true; grep -n x f` | yes -> `true; rtk grep -n x f` |
| `echo ok && grep -n x f` | yes -> `echo ok && rtk grep -n x f` |
| `grep -n x f && echo ok` | yes -> `rtk grep -n x f && echo ok` |
| `grep -n x f &` (backgrounded) | yes -> `rtk grep -n x f &` |
| `npm run check; grep -n x f` | yes -> `rtk npm run check; rtk grep -n x f` |
| `env grep -n x f` | yes -> `env rtk grep -n x f` |
| `command grep -n x f` | yes -> `command rtk grep -n x f` |
| `cat f \| grep -n x` (pipe, grep is the FINAL stage) | **yes** -> `cat f \| rtk grep -n x` |
| `a \| b \| grep -n x` (3-stage pipe, grep final) | **yes** -> `a \| b \| rtk grep -n x` |
| `grep -n x f \| wc -l` (pipe, grep is the LEADING stage) | no |
| `grep -rn x . \| head -50` (pipe, grep leading) | no |
| `a \| grep -n x \| b` (pipe, grep is a MIDDLE stage) | no |
| `find . -name x \| xargs grep -n x` | no |
| `cat f \| xargs grep -n x` | no |
| `xargs grep -n x` (bare, no pipe) | no |
| `nohup grep -n x f` | no |
| `time grep -n x f` | no |
| `echo $(grep -n x f)` | no |
| `echo \`grep -n x f\`` | no |
| `echo $(cat f \| grep -n x)` | no (substitution wins over the pipe-final-stage exemption) |

**The boundary is not "leading segment" and not "outside a pipeline."**
Both were tried and both are wrong:
- "Leading segment only" (B1's first cut) under-denied: `grep -rn x . |
  head -50` (grep leading a pipe) was silent, and unfiltered recursive
  grep output reached context.
- "Anything in a pipeline is never rewritten" (the remediation brief that
  replaced it) over-denied: `cat f | grep -n x` (grep as the pipe's own
  *final* stage) is measured rewritten, so denying it was a wasted round
  trip with no safety benefit - exactly the cost this task exists to
  remove.

The actual rule: `grep -n` rewrites everywhere except (a) a non-final pipe
stage, (b) inside `$(...)`/backtick at any internal position, or (c)
wrapped by `xargs`, `nohup`, or `time`. `env` and `command` are
transparent to RTK (measured, both rewrite), but `bash-guard.mjs` cannot
tell them apart from the blocking three using `lib.mjs`'s shared
`unwrap()` (which strips all five uniformly), so it treats every wrapper
as blocking - a same-cost-as-before false deny for `env`/`command`, never
a false allow.

### `tail -c` / `--bytes`

| shape | rewritten? |
|---|---|
| `tail -c 200 f` (bare leading) | no |
| `tail --bytes=20 f` (bare leading) | no |
| `cd d && tail -c 20 f` | no |
| `cat f \| tail -c 20` (pipe, tail trailing) | no |
| `tail -c 5 f \| wc -l` (pipe, tail leading) | no |
| `echo $(tail -c 20 f)` | no |
| `tail -n 20 f` (contrast: `-n`, not `-c`) | yes -> `rtk read f --tail-lines 20` |
| `cat f \| tail -n 20` (contrast: `-n`, piped) | no (unlike `grep -n`, `tail -n` does not get a pipe-final-stage exemption either - not relevant to this rule, since it only matches `-c`/`--bytes`, but recorded here so a future change to `tail -n`'s row does not assume it behaves like `grep -n`) |

`rtk read` has no byte-offset mode - only `--tail-lines` - so `tail -c`/
`--bytes` has nothing to rewrite into, in any position, chain or pipe.
This rule denies it unconditionally once matched; there is no leading- or
final-stage exemption to grant it the way there is for `grep -n`.

## Selftest baseline: 330, not 357

`issues/config-audit/handoff.md` and `issues/hook-state-cap/context.md`
both record "357 assertions, #1-130 named cases" - that number predates
`23c00a6` (R0c), which deleted the parity harness and the test-case family
that exercised it. The reviewer measured merge base `421dddb` directly
(`git archive` + a scratch run of `.claude/hooks/selftest.mjs` against the
original hook files) and got **330 passed, 0 failed** - matching this
session's own independent measurement, done the same way before any B1
edit landed. 357 is stale; nothing needs correcting in the *code*, only in
whichever `issues/` file still quotes it (not fixed here - `issues/**`
outside this task is out of scope and those files record history, not
live facts).

- B1's first commit (`76bc021`): 330 -> 350 (+20, 0 case ids dropped).
- Remediation (this file's own commit): 350 -> 373 (+23): reverted
  `#116`/`#117` (bare `tail -c`/`--bytes`) to deny; retired `#136` (`grep
  -n` after `cd &&`, now allowed); added `#144`-`#153` covering the
  env-prefix, chain, and pipe-final/leading/middle-stage shapes above.

## Key paths

- `.claude/hooks/bash-guard.mjs` - rule 2j (`evaluateRtkReaders`,
  `RTK_READERS`, `isRewritable`, `splitListItems`, `splitPipeStages`), the
  commit-gate `CHECK_INVOCATION_RE` consumer, `LONG_CHECKS`.
- `.claude/hooks/lib.mjs` - `CHECK_INVOCATION_RE`, `unwrap()`,
  `dropAssignments()` (the last two are what makes `bash-guard.mjs` unable
  to distinguish `env`/`command` from `xargs`/`nohup`/`time` without new
  code - see above).
- `.claude/hooks/check-observer.mjs` - `isCheckInvocation()`'s normalizer.
- `.claude/hooks/selftest.mjs` - cases `#112`-`#153` (rule 2j),
  `#29`/`#64`-`#67`/`#75` (long-check + background-check message text),
  `#142`-`#143` (rtk-prefixed check arming).
- Reviewer's probe battery: `probe.mjs`, `out-base.txt`, `out-new.txt` in
  the session scratchpad (`C:\Users\Ignat\AppData\Local\Temp\claude\...\
  scratchpad\`) - re-run against every remediated build; a three-way diff
  (base / B1 / remediated) is the fastest way to see exactly what a future
  change to this rule moves.

## Constraints

- `issues/**` outside this directory is untouched by design - those files
  record what was actually run at the time, not live facts to keep in
  sync.
- The check-gate half of B1 (rtk-prefix tolerance in `CHECK_INVOCATION_RE`,
  `LONG_CHECKS`, `check-observer.mjs`'s cd/pipefail stripping) was **not**
  reopened by the remediation, per explicit instruction, except for the
  one bug named above (the triple-strip of `rtk `). Do not re-litigate the
  rest of it without new evidence.

## Do not re-fetch unless

- A future `rtk` upgrade changes the measured boundary above - re-run the
  `rtk hook check` table before touching rule 2j again, do not reason from
  memory of this table.
- Human provides new info.
