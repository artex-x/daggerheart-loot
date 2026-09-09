# Handoff - TASK 65: Claude Code hooks

## Status

- Task status: **done** (B2 shipped, R1 remediation, then R2 - the CI
  Linux-portability fix)
- Last agent: implementer (R2)
- NEEDS_HUMAN_CONFIRMATION: **push is pending** - `origin/main`'s `check` job
  was RED at `1d368e2` (before R1/R2 even landed there); local `main` now has
  R1 (`773a2e6`) and R2 (`ed4f693`) on top, unpushed. The human needs to push
  for CI to re-run. See R2 below for exactly what CI was missing.
- Branch: `main`
- Base / starting commit: `8e7fed1` for B2, `1d368e2` for R1, `773a2e6` for R2

## Completed - R2, fix the two Linux `check` failures

- Batch name/id: **R2 - fix the two hook selftest failures that make
  `npm run check` fail on Linux CI, and only there**
- Scope: bug fixes only, diagnosed by the human before dispatch (see the
  GOAL/evidence/root-cause block the orchestrator gave this session -
  reproduced in full at the top of this task's prompt, not restated here).
  No replanning, no redesign, no re-litigation of R1's guard work.
- Files changed: `.claude/hooks/lib.mjs`, `.claude/hooks/edit-guard.mjs`,
  `.claude/hooks/edit-followup.mjs`, `.claude/hooks/selftest.mjs`
- Commit: `ed4f693`

### Root cause, confirmed as diagnosed

CI run https://github.com/artex-x/daggerheart-loot/actions/runs/34396944582
(`check` job, ubuntu) failed two of the hooks selftest's 140-then-194
assertions: `#36 Windows-normalised path: denies` and `#42 contract
reminder`. Both are exactly what the human's diagnosis said, verified by
reading the code before touching it:

- **`#42` was a real behaviour bug**, not just a test bug.
  `edit-followup.mjs`'s `remind:contract` group compared `relPath()`'s
  output against the lowercase literal `'docs/specs/contracts.md'`. The
  real file is `docs/specs/CONTRACTS.md` (mixed case; confirmed with
  `ls docs/specs/` - `CONTRACTS.md`, `ROUTES.md`). `relPath()` only
  lower-cases on win32 (`lib.mjs`, the `process.platform === 'win32'`
  branch it still uses for path *resolution* - unchanged), so the
  comparison matched by accident on this Windows box and could never match
  on Linux. The public-contract reminder never fired on Linux for
  `CONTRACTS.md`, `ROUTES.md`, `tests/contracts.js`, `llms.txt`, or anything
  under `docs/fixtures/` compared the same way.
- **`#36` was test-only.** `selftest.mjs` built a literal backslash path
  with an upper-cased drive letter and asserted `edit-guard.mjs` denies it
  unconditionally. POSIX never treats `\` as a separator, so
  `path.isAbsolute()` is false for that string there and it can never
  resolve to `data.json` - the case could only pass on win32.

### The fix

1. **`pathKey()` in `lib.mjs` now folds case on every platform**, not only
   win32. It exists for matching (a rule site comparing a repo-relative path
   against a hand-written literal), not identity, per the human's diagnosis.
   `relPath()` itself is **unchanged** - it still only lower-cases on win32,
   because its return value is also used for display and a real Linux file
   named `Foo.md` is genuinely not `foo.md`.
2. **`edit-guard.mjs` and `edit-followup.mjs` now compare `pathKey(rel)`
   against their literal tables, not `rel` directly.** `edit-followup.mjs`'s
   messages still interpolate `rel` (real casing) so the spoken text names
   the file the way it's actually spelled - only the *test* is folded, not
   the *display*. `edit-guard.mjs`'s five literals (`data.json`,
   `catalog.csv`, `i/`, `dist/`, `package-lock.json`) were already all-real
   files with all-lowercase names, so this was a no-op there today, but
   makes the rule site consistent and future-proof against a generated
   mixed-case literal being added later.
3. **Audited every other caller of `pathKey()`/`relPath()`** per the
   diagnosis's instruction:
   - `session-stop.mjs` already built its dirty-`Map` keyed by `pathKey()`
     and valued by git's own spelling. Folding `pathKey()` on POSIX too
     does not change that file - the *value* stored is still git's raw
     spelling, untouched by the key's folding, so the warning still names
     the file correctly. The only behavioural change is a (very unlikely)
     collision between two dirty paths that differ only in case now
     matching the same session-write record on Linux; accepted, same
     reasoning the diagnosis gave for the hand-written literal tables.
   - `bash-guard.mjs`'s `rmTargetInsideRepo()` tests `relPath()`'s result
     against a lowercase-literal exempt regex (`dist`, `coverage`,
     `test-output`, `node_modules`). Left unchanged: these are real,
     always-lowercase directory names in this repo, so there is no latent
     mismatch to fix, and changing it would be scope creep beyond what the
     evidence showed was broken.
4. **`selftest.mjs` case #36** now branches on `process.platform`: the win32
   branch keeps the original assertion (still exercised on this box); a new
   POSIX branch asserts the backslash-shaped path stays **silent** (not
   `data.json`), which is the real contract on Linux. Coverage is not
   deleted, it is corrected.
5. **`selftest.mjs` case #42** unchanged in shape (still drives the real
   `edit-followup.mjs` hook against `docs/specs/CONTRACTS.md`), with a
   comment recording the historical bug. Now passes because the underlying
   comparison is fixed, not because the test was loosened.
6. **New cases #61-#63**, added specifically to prove the fix's core logic
   independent of which OS runs the suite: `pathKey()` is now pure string
   folding with no `process.platform` branch, so calling it directly with
   `docs/specs/CONTRACTS.md`, a POSIX-shaped forward-slash mixed-case path,
   and the CONTRACTS.md-vs-literal comparison edit-followup.mjs actually
   performs, are all real evidence on any host - not "happens to pass on
   this box" the way the old #36 case was.

### Sweep for other latent Windows-only assumptions in `selftest.mjs`

Grepped for `win32`, `platform`, backslash literals, drive-letter handling.
Found exactly the two comment references to the already-fixed win32
case-folding bug (context, not bugs) and the one `#36` case itself. No other
case bakes in Windows path shape, drive letters, or case-folding.

### Verification - R2

- Commands run (exact), foreground, both completed before ending the turn:
  - `node .claude/hooks/selftest.mjs` -> **198 passed, 0 failed** (194 before
    this batch + 4 new: `#36`'s POSIX branch replaces nothing, it's an
    `if/else` so the same case count; `#61`, `#61a`, `#62`, `#63` are new)
  - `npm run check 2>&1 | tail -n 130`, run twice (once mid-diagnosis while
    an unrelated concurrent-writer formatting issue was present - see
    Deviations - and once clean after it resolved itself) -> **exit 0** both
    times on the second, clean run: `format:check` "All matched files use
    Prettier code style!"; `lint` clean; `typecheck` 513 files / 0 errors /
    0 warnings; `npm run data` regenerated identical outputs; `tests/derived.js`
    and `tests/i18n.js` clean; `.claude/hooks/selftest.mjs: 198 passed, 0
    failed`; `vitest` 33 files / 659 tests passed; coverage
    `All files | 96.43 | 90.02 | 95.91-95.92 | 96.65` (matches R1's baseline)
  - Individually, while the concurrent-writer formatting issue was present
    and blocking the aggregate script: `npm run lint`, `npm run typecheck`,
    `npm run data`, `node tests/derived.js`, `node tests/i18n.js`,
    `node .claude/hooks/selftest.mjs`, `npm run test` - all run directly and
    all passed, proving this batch's own files carried no regression before
    the aggregate `npm run check` could be confirmed clean end to end.
  - `npx prettier --check .claude/hooks/edit-followup.mjs
    .claude/hooks/edit-guard.mjs .claude/hooks/lib.mjs
    .claude/hooks/selftest.mjs` -> clean, scoped to this batch's own files,
    while the unrelated file was still failing the repo-wide check.
- Portability proof beyond the local suite (task explicitly asked for this,
  since Linux cannot be run on this box):
  - **Proved, with real evidence, not just reasoning:** `pathKey()`'s
    folding logic itself (cases #61-#63) - it is pure string manipulation
    with no `process.platform` branch left, so running it on this Windows
    box is genuine evidence for every OS, not a coincidence of this host.
  - **Proved with `path.posix` (Node's OS-independent POSIX path
    implementation, not this host's native path module) standing in for
    real Linux path resolution:** the exact `#36` backslash-path scenario -
    `path.posix.isAbsolute('\TMP\...\data.json')` is `false`,
    `path.posix.relative(root, path.posix.resolve(root, thatString))`
    returns the literal backslash string unchanged, not `data.json`. Script
    used: a throwaway file in the session scratchpad
    (`posix-proof.mjs`), not committed - not part of the repo.
  - **NOT verified locally, remains open until CI runs:** the two selftest
    cases still cannot literally execute their POSIX branch on this box
    (this Windows Node build's default `path` module is win32-native, and
    `process.platform` cannot be faked into changing that), so `#36`'s
    `else` branch and every other assertion in the suite that would only
    run under a real `process.platform !== 'win32'` are exercised by
    reasoning plus the `path.posix` proof above, not by literal execution.
    Say plainly: **CI has not run against this fix yet.** The human needs
    to push for that to happen; this session did not (per constraints,
    pushing is never this agent's job).
- Gates: `npm run check` only, per `context.md`'s "Command costs" - this
  task touches no rendered screen, so `check:built` and the parity suite are
  not required.

### Deviations - R2

1. **A concurrent writer was live on `main` throughout this batch, exactly
   as R1's context predicted, and its churn extended past the four files
   named in the dispatch.** At batch start: `docs/specs/COVERAGE.md`,
   `tests/parity.js`, `tests/parity/driver.js`, `tests/parity/specs.js` (as
   told). Mid-batch, `app/src/components/FilterBar.svelte`,
   `app/src/components/TablesPage.svelte`, `docs/parity.md`, and
   `tools/parity-ubuntu/README.md` also appeared dirty. All eight were
   preserved - never staged, never touched, never reverted. Only this
   batch's four files were staged, by name (`git add` with explicit
   filenames, not `-A`), both times `npm run check` and the commit were run.
2. **`npm run check` genuinely failed once, for a reason outside this
   batch, then passed cleanly on retry with no code change on either
   side.** Mid-verification, `format:check` failed on
   `app/src/components/TablesPage.svelte` - `git diff` on that file showed
   **zero content difference** (a CRLF/LF-only difference; `file` reported
   the file as CRLF, Prettier's default `endOfLine` is `lf`, and this repo
   has no `.gitattributes` to pin line endings). This was the concurrent
   writer's in-flight state, not this batch's. Rather than touch their file
   (forbidden by this task's own constraints) or fake a pass, this session
   ran every other `npm run check` step individually to prove this batch's
   files carried no regression (see Verification above), then re-checked
   `git status` a few minutes later: the concurrent writer had resolved it
   themselves (`TablesPage.svelte` no longer appeared dirty), and the full
   `npm run check` then passed clean on the very next run, unmodified. No
   workaround, no `SKIP_CHECK_GATE=1` bypass was needed in the end - flagged
   here only because CLAUDE.md asks a failed required check to be explained
   before committing, and this one very nearly required judgment about
   touching someone else's file.
3. **The commit gate was live and worked exactly as designed.** The
   `npm run check 2>&1 | tail -n 130` invocation (piped, not redirected to a
   file, per this task's own instruction and `.claude/README.md`) produced
   a real `.claude/.check-cache.json` write via `check-observer.mjs`
   (`{"key":"eab5d839ea56af5c", ...}`), confirmed by reading the file
   directly. `git status` was re-checked immediately before staging and
   showed no drift since that run, so `bash-guard.mjs`'s commit gate let
   `git commit` through with no `SKIP_CHECK_GATE=1` needed. One later
   verification run used `npm run check > file 2>&1; ...; tail ...` (to
   capture the exit code robustly) - that redirect-based invocation, as
   `.claude/README.md` warns, would not have satisfied `check-observer.mjs`
   had it been the one relied on for the cache; it wasn't - the piped run
   moments earlier already had.

### Deferred - R2

None new. The R1 deferred list (below) is unchanged and not touched by this
batch.

## Completed - R1, review remediation

- Batch name/id: **R1 - fix the reviewer's four blockers and the same-class nits**
- Scope: bug fixes against `plan.md`, not changes to it. No design decision moved.
- Files changed: `.claude/hooks/lib.mjs`, `.claude/hooks/bash-guard.mjs`,
  `.claude/hooks/check-observer.mjs`, `.claude/hooks/session-stop.mjs`,
  `.claude/hooks/selftest.mjs`, `.claude/README.md`,
  `.claude/prompts/implement.prompt.md`, `issues/65/plan.md` (status line),
  `issues/65/handoff.md`
- Commit: `3dc26b4`, plus this one-line sha correction on top

### Blocker 1 - `git commit -am` defeated both the staging block and the gate

`rest.includes('-a')` / `includes('-A')` are equality tests against a whole
token; the idiomatic spelling is the cluster. Replaced with the existing
`flagMatches()` helper (the one rule 2b already used correctly for
`git clean`) at both sites: `evaluateBlanketStage()` and `commitInfo()`.
Fixing `commitInfo().hasAllFlag` also restores the `git diff --name-only`
union, so an empty index no longer reads as "nothing for the check to cover".

Probed before: `git commit -am "x"`, `git commit -avm "x"`, `git add -Av` all
allowed silently; `git commit -a -m "x"` denied. Probed after: all four deny,
and `git commit -m "chore: x"` / `git add -N <file>` still do not (the flag
test must not fire on unrelated short flags). Selftest cases #15a-#15f, and
#59, which proves the gate union specifically by using a clean tree plus one
modified file, so the 2+-dirty-paths blanket rule cannot be what denies.

### Blocker 2 - `rm -rf .` and `rm -rf ./` were not blocked

`relPath()` returned `null` for the repo root itself (`path.relative` gives
`''`), and every caller reads `null` as "outside the repo, allow". It now
returns `'.'` for the root and keeps `null` for genuinely-outside paths.
Checked every caller: `bash-guard`'s `rmTargetInsideRepo` now denies (`'.'` is
truthy and not exempt); `edit-guard`'s five deny rules and `edit-followup`'s
three reminder groups all fail to match `'.'`, so neither starts denying or
speaking on the sentinel.

Probed before: `rm -rf .` and `rm -rf ./` allowed; `rm -rf app` and `rm -rf *`
denied. Probed after: all deny, `rm -rf dist`, `rm -rf node_modules` and
`rm -rf /tmp/elsewhere` still allowed. Selftest #13a, #13b, #25c, #25d, and
#39a-#39e for the edit-guard non-regression the reviewer named (repo root
itself, `app/data.json`, `docs/i/x.html`, `input/x.html`, `app/dist/x.html`,
plus the existing `data.js` and `docs/fixtures/` cases).

### Blocker 3 - `check-observer.mjs` could record a pass for a failed run

`CHECK_RE` matched the raw command anywhere in it, and `All files` anywhere in
stdout. New `isCheckInvocation()` reuses the (now shared) segmenter and
requires all three of: no chaining (`&&`, `||`, `;`, `&`, `$(`, backtick,
newline - `2>&1` is normalised away first, so it is not read as chaining); the
FIRST segment matches an anchored `^npm run check`; and that segment does not
redirect stdout to a file. A pipeline still qualifies, because a pipe still
shows the check's own stdout. `EXIT_CODE_FIELDS` also gained `status` and
`exitStatus`, so an unrecognised numeric failure field cannot read as
"absent, assume a pass".

Probed before: `npm run check > o.txt 2>&1 || true; grep "All files" o.txt`
(check FAILED), `echo "npm run check says All files"`, and `{status: 1}` with
pass-shaped stdout all wrote a cache entry. Probed after: none of them does,
`npm run check > o.txt` does not either, and `npm run check`,
`npm run -s check` and `npm run check 2>&1 | tail -n 120` all still do.
Selftest #49a-#49g.

**One relaxation, found the hard way.** The first version of this rule also
rejected a leading `cd <dir> && `, which is what an agent actually types - so
this batch's own commit was blocked by its own new rule after a check that had
genuinely passed. `cd` writes nothing to stdout, so it cannot be the source of
a pass-shaped line; leading `cd` segments are now stripped before the chain
test. Everything after the check is still rejected (`cd /repo && npm run check
&& echo "All files"` writes no cache, #49g). Verified live: with the
relaxation in place, `cd "E:/dev/daggerheart-loot" && npm run check 2>&1 |
tail -n 130` refreshed `.claude/.check-cache.json` and the gate let the commit
through.

**The conflict on disk is resolved.** `implement.prompt.md` step 7 told
workers to "redirect long runs to a file", which is exactly the invocation the
observer cannot see, while the mitigation lived only in this handoff. The
prompt, `bash-guard.mjs`'s own long-check reminder text, and a new
`.claude/README.md` section now all say the same thing: pipe to `tail -n 120`,
never redirect to a file, because `All files` sits near the top of the
coverage table and the gate only trusts output it can see.

### Blocker 4 - the Stop warning never fired for mixed-case paths on Windows

`relPath()` lower-cases the whole path on win32, so `edit-followup.mjs`
recorded `.../pagehead.svelte` while `session-stop.mjs` matched it against raw
`git status --porcelain` output saying `PageHead.svelte`. Added `pathKey()` to
`lib.mjs` (fold on win32, verbatim elsewhere); `session-stop.mjs` now builds a
`Map` keyed by `pathKey()` and valued by git's own spelling, so the match works
and the message still names the real file.

Probed before: with `PageHead.svelte` and `lowercase.txt` both written and both
dirty, only `lowercase.txt` was named. Probed after: both are named, with
`PageHead.svelte` spelled as git spells it.

The selftest certified this bug rather than catching it - `recordWrite()` was
called with an already-lower-case literal. Case #52 now drives
`edit-followup.mjs` with a mixed-case path (`app/src/components/PageHead.svelte`,
added to the scratch repo and left dirty) and asserts the Stop message names
that exact spelling, so the record -> match chain is exercised end to end
(#60).

### Also fixed - same bypass class

- **`SKIP_CHECK_GATE=1` as prose.** `/SKIP_CHECK_GATE=1/` tested the raw
  command, so `git commit -m "add SKIP_CHECK_GATE=1 support"` bypassed the
  gate. New `hasGateBypass()` walks only the leading environment assignments of
  each segment. Probed both ways; selftest #28 (real prefix still speaks) and
  #28a (prose still denies).
- **`env git reset --hard`.** New `unwrap()` in `lib.mjs` strips leading
  assignments and the wrappers `env`, `command`, `nohup`, `time`, `xargs` (and
  their flags) before the program is read. Selftest #13c, #13g.
- **`git reset "--hard"`.** The quote stripper erased the flag. It now
  preserves a quoted span that is a single shell-inert word
  (`^[-A-Za-z0-9._/=:]+$`) and still erases anything with a space or shell
  metacharacter in it - so unquoting can never invent a new segment, and
  `git commit -m "chore: a; then b"` stays silent. Selftest #13d, #25a, #25b.
- **Anything after a heredoc.** `sanitize()` truncated at the first `<<` and
  dropped the rest. New `stripHeredocs()` removes only the heredoc *body*,
  keeping the rest of the marker line and everything after the terminator.
  Whitespace collapse also stopped eating newlines, so `SPLIT_RE`'s `\n` case
  is finally reachable. Selftest #13e, #13f, and the existing #20 still passes.
- **`.claude/README.md` honesty fix.** `tool_response.exit_code` moved out of
  "settled by measurement" into an explicit "looked up, not measured" line, per
  the Deviations section below.
- **Selftest: missing "cache present, tree since moved -> deny" case.** Added as
  #27a - the gate's most important safety property, previously untested.
- **Selftest: skip when git is absent.** `gitSh` threw, and the selftest runs
  inside `npm run check`, so a box without git failed the whole gate. `main()`
  now probes `git --version` and skips. Verified by running with git off PATH:
  `.claude/hooks/selftest.mjs: skipped (git is not on PATH)`, exit 0.

### Refactor note

`sanitize`/`segments`/`tokensOf`/`dropAssignments` moved from `bash-guard.mjs`
to `lib.mjs` and gained `unwrap`, because `check-observer.mjs` must segment a
command exactly the way `bash-guard.mjs` does. Second real caller, so the
extraction is earned; `bash-guard.mjs` keeps no copy.

### Fail-open contract

Unchanged. All eight scripts still survive empty / `{}` / not-json stdin
(selftest #56-#58, 48 assertions), `guard()` still swallows throws, and nothing
above adds an exit-2 path.

## Verification - R1

- Commands run (exact):
  - `node .claude/hooks/selftest.mjs`
  - `PATH="$(dirname "$(command -v node)")" node .claude/hooks/selftest.mjs`
    (git deliberately off PATH)
  - `npm run format`
  - `cd "E:/dev/daggerheart-loot" && npm run check 2>&1 | tail -n 130`
    (run three times: twice before the `cd` relaxation above, once after)
- Results:
  - `node .claude/hooks/selftest.mjs`: **194 passed, 0 failed** (was 140; the
    54 new assertions cover all four blockers and every nit above)
  - git-off-PATH run: `.claude/hooks/selftest.mjs: skipped (git is not on
    PATH)`, exit 0
  - `npm run check`: **exit 0**. `format:check` "All matched files use Prettier
    code style!"; `lint` clean; `typecheck` 513 files / 0 errors / 0 warnings;
    `npm run data` regenerated identical outputs ("производные файлы: всё
    сходится"); `tests/derived.js` and `tests/i18n.js` clean ("переводы:
    паритет соблюдён"); `.claude/hooks/selftest.mjs: 194 passed, 0 failed`;
    `vitest` 33 files / 659 tests passed; coverage `All files | 96.43 | 90.02 |
    95.92 | 96.65`
  - `npm run format`: every file reported unchanged; `.claude/**` is
    Prettier-gated and was already clean
- Gates: `npm run check` only. This batch touches no rendered screen, so
  `check:built` and the parity suite are not required (context.md, "Command
  costs").

## Deviations - R1

1. **The `npm run check` run covered a tree that carried another agent's
   in-flight work.** `tests/parity.js`, `tests/parity/driver.js`,
   `tests/parity/specs.js`, `app/src/components/TablesPage.svelte` and
   `docs/specs/COVERAGE.md` were modified by something else during this
   session, and commit `1d368e2` ("tools(parity): run the suite on ubuntu
   locally, calibrated against CI") landed on `main` mid-session. The check
   passed with those edits present. Only this batch's own files were staged, by
   name; nothing foreign was committed or reverted. This is the second session
   in a row where a concurrent writer was live on `main` - see the B2 note
   about `74348b6` below.
2. **The hooks were live for this session, deny path included.** The commit
   gate really did block this batch's first `git commit` attempt, with the
   exact message `bash-guard.mjs` emits. That settles the open question B2
   left in the Notes below: `permissionDecision: "deny"` is honoured on this
   host, and hook scripts are re-read from disk per invocation rather than
   snapshotted - the block came from code written minutes earlier in the same
   session. `PostToolUse(Edit|Write)` fired too (16 writes recorded in
   `.claude/.hook-state.json` under this session id).
3. **That block was a real defect in this batch, not a false alarm.** The
   first `isCheckInvocation()` rejected the leading `cd <dir> &&` that this
   agent types on every command, so no invocation could ever satisfy the
   gate. Fixed rather than bypassed - `SKIP_CHECK_GATE=1` was available and
   was deliberately not used. See the relaxation note under Blocker 3.

## Deferred - R1

Reviewer findings deliberately left for a later pass, with the reason:

- `session-stop.mjs:22` - rename and quoted-path parsing of
  `git status --porcelain` (`R  old -> new`, and paths git quotes because they
  contain non-ASCII or spaces). Real, but a parser, not a one-line fix.
- `.hook-state.json` unbounded growth (`lib.mjs`) - `saveState()` keeps the
  five newest sessions but a single session's `wrote` map grows without limit.
- `bash-guard.mjs`'s `/^npm run check\b/` long-check reminder also matches
  `check:fast`, so the reminder overstates that command's cost. Cosmetic.
- The sanitised command is echoed back in the long-check message, so an
  unusual quoting can produce a slightly odd-looking sentence.
- `git restore --worktree --staged` restores the worktree too but is allowed,
  because the rule only tests for the presence of `--staged`.
- `CLAUDE.md` lost the discoverability of `node tests/parity.js "<state
  filter>"` when the focused-commands block was pruned in B2.

## Completed - B2

- Batch name/id: **B2 - implement the hooks setup and the prompt cleanup**
- What shipped: `plan.md` implemented in full - eight scripts under `.claude/hooks/`
  (`lib.mjs`, `tree-key.mjs`, `session-start.mjs`, `bash-guard.mjs`,
  `check-observer.mjs`, `edit-guard.mjs`, `edit-followup.mjs`, `session-stop.mjs`),
  `.claude/hooks/selftest.mjs` (140 assertions, wired into `npm run check`),
  `.claude/settings.json`, `.claude/.gitignore`, and the section 6 cleanup of
  `CLAUDE.md`, `.claude/README.md`, `.claude/improvements.md`, both prompts, and
  `eslint.config.mjs`.
- Files changed:
  - New: `.claude/hooks/lib.mjs`, `.claude/hooks/tree-key.mjs`,
    `.claude/hooks/session-start.mjs`, `.claude/hooks/bash-guard.mjs`,
    `.claude/hooks/check-observer.mjs`, `.claude/hooks/edit-guard.mjs`,
    `.claude/hooks/edit-followup.mjs`, `.claude/hooks/session-stop.mjs`,
    `.claude/hooks/selftest.mjs`, `.claude/settings.json`, `.claude/.gitignore`
  - Edited: `CLAUDE.md`, `.claude/README.md`, `.claude/improvements.md`,
    `.claude/prompts/implement.prompt.md`, `.claude/prompts/orchestrate.prompt.md`,
    `package.json`, `eslint.config.mjs`, `.prettierignore` (deviation, see below),
    `issues/65/context.md` (small doc refresh, already uncommitted at task start),
    `issues/65/plan.md` (status line only)
- Commit(s): this one
- Deviations and rationale:
  1. **`.prettierignore` addition (not in the plan's file list).** Discovered only
     because the hooks turned out to be live in this session (next point): a real
     `bash-guard.mjs` firing during `npm run check` writes `.claude/.hook-state.json`
     to the real repo, and Prettier does not read a nested `.claude/.gitignore`, so
     `format:check` tripped on that file on the second `npm run check` run. Added
     `.claude/.check-cache.json`, `.claude/.check-index`, `.claude/.hook-state.json`
     to the root `.prettierignore`. Cheap, local, in a file this batch's own runtime
     behaviour broke - CLAUDE.md's campsite rule.
  2. **Step 1's live restart-probe could not be run literally.** The plan's method
     (register a throwaway probe hook, restart the session, run two `node -e
     process.exit(N)` commands, read the payloads) requires a session restart, which
     a non-interactive single-pass implementer cannot perform on itself. Substituted:
     dispatched the `claude-code-guide` agent to check the official Claude Code hooks
     reference (`code.claude.com/docs/en/hooks.md`) for the `PostToolUse(Bash)`
     `tool_response` shape. Confirmed field name: **`exit_code`** (high confidence, a
     worked example in the docs), which is also the first candidate the plan's own
     fallback chain already tried. `check-observer.mjs` keeps the full fallback list
     (`exit_code`/`exitCode`/`returnCode`/`code`, absent-field-passes) regardless, so
     the design is correct even if a host ever disagrees with the docs.
  3. **The "hooks are inert this session" assumption did not hold here.** Unexpectedly
     - see Notes below, this is the most important finding to carry forward.
  4. **`selftest.mjs` exempts `session-start.mjs` from plan section 7's cases 56-58**
     (recorded by the R1 reviewer; B2 explained it in a code comment but never listed
     it as a deviation here). The plan asks every script to be silent on empty / `{}` /
     not-json stdin. `session-start.mjs` builds its whole report from git and the
     `issues/` scan, never from its stdin payload, so it still speaks on malformed
     input. The selftest asserts exit 0 plus well-formed-or-silent JSON for it instead
     of silence. Intentional and correct, but it is a narrowing of the plan's contract
     and belongs on the record.

## Verification - B2

- Commands run (exact):
  - `npx prettier --write ".claude/settings.json" ".claude/hooks/*.mjs" package.json`
    (and again after fixing two selftest assertions)
  - `node .claude/hooks/selftest.mjs` - run standalone twice while debugging, then as
    part of `npm run check` below
  - `npm run check` - run four times total: once mid-implementation (caught the
    `.hook-state.json`/Prettier interaction above and one transient `node_modules`
    race unrelated to this task, see Notes), then clean after the `.prettierignore`
    fix, then again after the section 6 doc/prompt edits
- Results:
  - `node .claude/hooks/selftest.mjs`: **140 passed, 0 failed** (the plan estimated
    "roughly 80 assertions"; the actual count came out higher because several cases
    assert both an exit code and a message-fragment separately)
  - `npm run check` (final run): **exit 0**. `format:check` clean, `lint` clean,
    `typecheck` 513 files / 0 errors / 0 warnings, `data`/`tests/derived.js`/
    `tests/i18n.js` clean, `.claude/hooks/selftest.mjs: 140 passed, 0 failed`,
    `vitest`: 33 test files / 659 tests passed, coverage summary printed with
    `All files | 96.43 | ...` as the header line
- Gates: `npm run check` only, per `context.md` ("Command costs" - this task touches
  no rendered screen). `check:built` and the parity suite were not run and are not
  required.

## Next batch

None from this session. The only remaining action is the human's:
**push `main` (currently at `ed4f693`) so CI re-runs the `check` job**, which
was RED at `1d368e2` for exactly the two reasons R2 above fixes. R2 could not
verify Linux behaviour directly (no Linux available on this box) - watch that
CI run specifically for `.claude/hooks/selftest.mjs` under the `check` job
and confirm both `#36` and `#42` pass there, since that is the one thing this
session's local verification could not prove.

## Linux verification (orchestrator, post-R2)

R2 could not execute the POSIX branches on this Windows host. The orchestrator
closed that gap with a container, using the recipe now in `context.md`:

- `773a2e6` (pre-fix) on `node:22`, platform `linux`:
  `.claude/hooks/selftest.mjs: 192 passed, 2 FAILED` - `#36 Windows-normalised
  path: denies` and `#42 contract reminder`, exactly the two cases CI reported.
- `ed4f693` + `7e1def5` (post-fix) on the same image:
  `.claude/hooks/selftest.mjs: 198 passed, 0 failed`, exit 0.

So the R2 fix is proven on the platform CI runs, before any push.

**CI state at handoff.** `origin/main` is `773a2e6`; run `34402007348` is red
there for two independent reasons. `check` fails on the selftest - fixed by
`ed4f693`, which is committed locally and **not pushed**. `parity (3)` and
`parity (4)` also fail, and they predate this task entirely: the same two shards
were already red on `8e7fed1` (run `34383263349`), before any hook existed. They
belong to issue 47, not here. Pushing `ed4f693` should green `check` and will
not touch the parity shards.

## Blockers

None from this session's own work. The unpushed CI-red state on
`origin/main` at `1d368e2` is the reason this task was reopened as R2; it is
resolved locally (`ed4f693`) but not yet confirmed on CI, since nothing here
pushes.

## Deferred - B2

Unchanged from the planner's list - carried forward, not re-derived:

- Candidate #19 - scoping the planner's writes to `issues/<id>/` via `agent_type`.
  Still deferred: `agent_type`'s value strings remain unverified on this host.
  `session-start.mjs` does not currently log it; that would be the next step to
  settle this, per `plan.md` section 5, row 19.
- Candidate #15 - blocking overlapping heavy runs (needs a `tests/` lockfile,
  out of this task's scope).
- The full rejected list with reasons is `plan.md` section 5 (26 rows).

## Notes

- **Important finding, likely to matter for every future task: hooks were observed
  live in this implementer's own session**, contradicting `plan.md`'s "the hooks
  will not be live in the session that writes them" (based on the interactive
  desktop app's snapshot-at-start behaviour). Evidence, both unprompted and
  unplanned:
  - `bash-guard.mjs`'s long-check reminder fired verbatim as a real
    `PreToolUse:Bash` `additionalContext` message on this implementer's own
    `npm run check` call, mid-session, right after `.claude/settings.json` was
    written.
  - `check-observer.mjs` wrote a real `.claude/.check-cache.json` in this
    repository (not the selftest's scratch repo) after the real `npm run check`
    passed, with the correct tree key.
  - `edit-followup.mjs` recorded this session's real `Write` calls
    (`.claude/.gitignore`, `.claude/hooks/selftest.mjs`, `package.json`, ...) into
    the real `.claude/.hook-state.json`.
  This means the "restart the session, or run `/hooks`" caveat may not apply to
  every host - **but it has only been observed on this one build, in one session,
  for the allow/speak path.** The `permissionDecision: "deny"` path was not
  exercised for real inside this session (no denied command was actually attempted
  against the real repo - all deny-path evidence comes from the selftest's scratch
  repo). The human should still do the safe live probe after their next session
  start: `git stash drop` with an empty stash. If a hook fires with a deny reason,
  `permissionDecision: "deny"` is honoured on this host; if it fails harmlessly on
  an empty stash list, either the deny path is not honoured (fall back to exit 2
  per `plan.md` section 9) or hooks were not picked up (restart again / run
  `/hooks`). `.claude/README.md`'s Hooks section records this ambiguity.
- **`check-observer.mjs` needs to actually see `All files` in the Bash tool's own
  captured stdout - which a truncated tail can defeat.** Discovered live while
  committing this batch: redirecting `npm run check`'s output to a file and then
  printing only the last N lines (as the prompts recommend, to avoid dumping a huge
  log into the transcript) can leave `All files` - which sits near the *top* of the
  coverage table, not the bottom - outside that final slice. Two commit attempts
  were correctly blocked because a `tail -N` that was too short meant the hook never
  observed the passing run, even though the run had genuinely passed. Fixed by
  piping straight to `tail` without an intermediate redirect-and-reopen, and sizing
  the tail to include the coverage header. No code change: the gate behaved exactly
  as designed (fail closed on "cannot confirm a pass"), and the fix belongs in how a
  future agent invokes the command, not in `check-observer.mjs`. Worth carrying into
  `.claude/README.md` or the prompts if this recurs.
- **A transient, unrelated `node_modules` issue during the first `npm run check`
  run**: `vitest run --coverage` failed with `Cannot find module
  '.../node_modules/vitest/suppress-warnings.cjs'`, and a direct `require()` of
  `vitest/package.json` also failed moments later, then both succeeded on the very
  next run with no changes on this end. Read as a concurrent install or file-lock
  race outside this task's control (this task never ran `npm install`). Not
  reproduced on the second, third, or fourth `npm run check` run. Flagged here in
  case it recurs for someone else; no code change was made for it.
- **A concurrent commit landed on `main` mid-session, from outside this
  implementer.** `74348b6` ("chore(agents): plan on Fable, and resync the tier
  docs", 20:50:27) appeared between this batch's starting commit (`8e7fed1`) and
  its own commits, touching `.claude/README.md`, `.claude/agents/planner.md`,
  `.claude/prompts/orchestrate.prompt.md` and `CLAUDE.md` - three files this batch
  also edited. No conflict occurred in practice: this session's in-session `Read`
  of each file happened after `74348b6` landed, so every `Edit` call operated on
  the already-merged content, and the final `CLAUDE.md`/`README.md`/prompt content
  reads coherently (checked by hand post-commit). Flagging it anyway - CLAUDE.md's
  "only one implementer should be writing this working tree at a time" rule was not
  honoured for this window, whatever wrote `74348b6` and this implementer were both
  live against `main` concurrently. Worth the orchestrator's attention even though
  this batch shipped clean.
- **`docs/specs/COVERAGE.md`**: no row added, per `plan.md` section 2 - the
  selftest is agent wiring, not product coverage, and maps onto no `FEATURES.md`
  row.
- **`.claude/agents/*.md`**: no changes, per `plan.md` section 6 - every item there
  is either judgment or only partially hooked; removing any would violate the
  issue's "never remove an instruction a hook only partially enforces" rule.
- **Unrelated working-tree changes**: none present at task start (context.md's
  "Working tree at task start" section, refreshed by the orchestrator before this
  batch, confirms the issue-47 files already landed in `38cfbbb`/`8e7fed1`). This
  batch staged only its own files, by name; `git status` was re-checked immediately
  before staging and showed nothing else.
- Mocks path: none for this task.
- Screenshot findings: none - no visual work.
- Cleanup performed / retained artifacts: nothing to clean. The step-1 probe script
  and its log were never created (see Deviations item 2 - the live-probe method was
  replaced with a documentation lookup instead), so there was nothing to delete.
- Session end partial progress: none. The batch is complete and committed.
