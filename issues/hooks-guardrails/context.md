# Shared task context - TASK hooks-guardrails

Orchestrator maintains this file so later steps do not re-fetch the same
sources. Read this before `plan.md` and `handoff.md`.

**Status, 2026-09-10: done.** B1 (the only batch) is implemented and
committed in one commit - see `handoff.md` "Completed" for the sha and
`plan.md` section 7. Nothing else in this file changed; the decisions and
measurements below held through implementation without revision.

## Goal

Design the deterministic guardrails for the failures recorded on issue 47,
where written instruction has demonstrably stopped working. Local-only task id;
there is no GitHub issue - do not run `gh issue view`.

## The failures, as measured

1. **A worker backgrounds `npm run check` and loses it.** Three worker runs on
   issue 47 (two in the 2026-09-09 session, one on 2026-09-10). The shell dies
   with the agent's turn, so the result is gone even when the command finished,
   and `check-observer.mjs` refuses a backgrounded run by design - there is no
   stdout to attribute - so the commit gate can never accept it. The third
   occurrence had three paragraphs of the dispatch warning against exactly
   this, naming the two runs it had already cost. Prose has failed three times.
2. **Two heavy runs overlap on one tree.** `test-output/parity/` is wiped and
   rewritten per run, and a vitest coverage pass beside a live parity run
   produces spurious 5000ms timeouts. `ListAgents` showed 15 peer sessions on
   2026-09-10, 6 of them interactive, all sharing this working tree.
3. **HEAD moves under a session.** A peer session committed `ce0c414`
   (`chore(art)`, 52 binary files) onto `main` while an issue 47 implementer
   held 27 uncommitted paths in the same tree. Nothing collided because the
   paths were disjoint. `SessionStart` reports HEAD once and never again.

## Decisions taken by the repository owner, 2026-09-10

Settled input, not options. Answered after reading the planner's three
questions in `handoff.md`.

1. **The B1 block is approved as written** - deny at `PreToolUse(Bash)` on a
   `npm run check` launched with `run_in_background`, strict boolean, the
   gate-feeding check only, with the one-line message the planner drafted
   (the foreground replacement and `timeout 600000`).
2. **Candidate 28, the parity lockfile, is bundled into B1** - the owner's
   call, against the planner's recommendation to run it as a later batch. One
   batch, one commit, covering both guardrails. The reason the planner wanted
   them split still holds and is now a scheduling fact rather than an
   ordering: the lockfile edits `tests/parity.js`, which issue 47's B5.1 holds
   uncommitted, so the bundled batch waits for B5.1 to land - as it already
   had to for the commit gate.
3. **Q1 answered 2026-09-10: the observer accepts a leading `set -o pipefail`**
   (candidate row 30, the recommended option). The canonical agent call becomes
   `set -o pipefail; npm run check 2>&1 | tail -n 120`; the strip removes
   exactly `set -o pipefail` plus one `;` or `&&` at the start and nothing
   else; the plain pipe stays accepted for a human at a terminal. Every
   forgery the row lists must still be refused, with its selftest case.
4. **The one `CLAUDE.md` line is approved** - under Quality gates, taking the
   file from 194 to 195 lines.

## Where the prior art is - read before designing anything

- `.claude/README.md` - the hook table (what each hook does today), the
  `bash-guard.mjs` sanitiser's recorded limitations, the gate's stdout
  attribution rules, the measured `npm run check` cost and the fork-pool
  signature, and **the issue 65 candidate table**: 26 hook candidates already
  evaluated, with reasons. Several tempting ones are rejected for reasons that
  have not changed. Candidate **#27** (block a backgrounded `npm run check`) is
  this task's nominee and is recorded there as open; **#15** (block a heavy run
  while another is alive) is rejected with a deferred alternative - a lockfile
  written by `tests/parity.js` that a hook can stat in microseconds; **#19** is
  the standing warning about wiring a hook to an input field whose value has
  not been verified on this host.
- `.claude/prompts/orchestrate.prompt.md` - "A worker waiting on a background
  check", "Your writers are not the only writers".
- `issues/65/` is **retired history**. Its durable knowledge was moved into
  `.claude/README.md` on purpose. Do not mine it for instructions.

## Measured while answering the owner, 2026-09-10 - B1 must carry these

Four facts the B1 batch needs and nobody should re-derive. All measured on
this host with the Bash tool.

1. **`set -o pipefail` scopes to a pipe into `tail`, not to every command.**
   `yes | head -n 2` exits **0** without the prefix and **141** with it - the
   producer takes SIGPIPE when `head` leaves early. `| tail` drains its input,
   so it never happens there. A blanket "prefix everything" rule would make
   `grep ... | head` report a load-dependent, intermittent failure and send a
   worker back for a second run, which is the waste this batch removes. The
   documented rule is therefore: **pipe a long verification run into `tail`
   with the prefix, because you need its status** - not "prefix everything".
   The hook change itself is narrower still and structural: `check-observer.mjs`
   only ever attributes `npm run check`, so only that command needs it to arm
   the gate.
2. **The prefix alone tells a worker that it failed, not why - `tee` is the
   other half.** With an early error followed by 200 lines of output,
   `| tail -n 120` loses the error entirely (grep: 0 matches) while reporting
   status 1; `| tee <log> | tail -n 120` keeps status **1** and the error is in
   the log (grep: 1 match). This is exactly a failing `npm run check`: vitest
   prints failure detail first, then the ~45-line coverage table and summary
   push it past a 120-line window. So the canonical invocation B1 writes into
   its five places should be
   `set -o pipefail; npm run check 2>&1 | tee <log> | tail -n 120`.
   Two things B1 has to settle rather than assume:
   - **the log belongs outside the repository** - a `check.log` in the tree is
     an untracked file that dirties `git status` and can be swept into someone
     else's commit;
   - **that the observer accepts a `tee` pipeline is read from the code, not
     measured.** `isCheckInvocation` allows pipes, rejects `&&`/`||`/`;`/`&`/
     newline/`$(`/backtick, and inspects only the first segment for a stdout
     redirect - which stays `npm run check 2>&1`. It was deliberately not
     probed by hand, because a crafted payload writes `.check-cache.json` and
     could arm the gate against someone else's tree. **It needs a selftest
     case, not an assumption.**
3. **`npm run check` does not check markdown at all, and never has.**
   `.prettierignore` has carried `*.md` since `5ab5880` (2026-08-30, Phase 1)
   with its reason - markdown here is wrapped by hand because a line break
   carries meaning in the specs and the licence line is pinned by
   `tests/derived.js`. `prettier --file-info` returns `"ignored": true` for
   `issues/47/handoff.md`, `docs/specs/COVERAGE.md` and `CLAUDE.md` alike. So
   an `issues/**` edit can neither fail a check nor be corrupted by one, which
   matches the commit gate's own `isExempt` (`issues/` and every `.md` but the
   two root READMEs). The repository has decided this twice; only a wrong
   sentence in a handoff said otherwise.
4. **`npx prettier --check <some>.md` prints "All matched files use Prettier
   code style!" while matching zero files.** A success message from an empty
   set reads exactly like a verified one. Worth knowing before anyone cites it
   as evidence.

**Two pieces of durable text B1 owns**, since it already rewrites
`.claude/README.md`'s "Run a long check" section whole:

- That section should say what the check does **not** cover - markdown is not
  formatted or linted by it - so nobody is cautious about editing a handoff
  mid-run, and so the way to change that is visible: it is one line in
  `.prettierignore`, which carries the reasoning beside it.
- `issues/47/handoff.md`'s gotcha beginning **"`npm run check` starts with
  `prettier --check .`, which covers markdown"** is **false** and must be
  deleted. It caused repeated, real caution, including two deferred edits by
  the orchestrator on 2026-09-10. If B1 does not own that file, say so and the
  orchestrator will delete it during reconciliation.

## Key paths

- Hooks: `.claude/hooks/*.mjs`, registered in `.claude/settings.json`;
  shared helpers in `lib.mjs`, tree fingerprint in `tree-key.mjs`
- Tests: `.claude/hooks/selftest.mjs` - 198 cases, wired into `npm run check`,
  runs against a throwaway git repo in the OS temp directory, never this tree

## Constraints

- **Nothing here can be committed until issue 47's B5.1 lands.**
  `.claude/hooks/*.mjs` is a covered path for the commit gate (only `issues/**`
  and `.md` files are exempt - `bash-guard.mjs`'s `isExempt`), so a commit
  needs a passing `npm run check` for the whole tree, and the tree currently
  fails typecheck on B5.1's uncommitted work. `selftest.mjs` is itself part of
  `npm run check`, so new cases must pass in the same run.
- One writer per tree. An issue 47 implementer holds 27 uncommitted paths right
  now. **Plan only; do not touch anything outside `issues/hooks-guardrails/`.**
- Every hook script exits 0 on every path - a throw, a missing file or absent
  git lets the action through. The only blocks are the ones the README lists.
- Hook config may be snapshotted at session start on some hosts, so a hook
  edited mid-session may not take effect in that session.
- A guard here is against habit and haste, not against an adversary. A rule
  that can never fire is clutter; a rule that can fire on legitimate work is
  worse than none.

## Command costs

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | ~165s measured 2026-09-10 | yes |
| `node .claude/hooks/selftest.mjs` | ~19s | yes |

## Learned during planning (2026-09-10) - durable, do not re-derive

- **The recorded backgrounded checks, verbatim from the transcripts** under
  `~/.claude/projects/E--dev-daggerheart-loot/` (`tool_use` inputs with
  `"run_in_background":true`): `npm run check 2>&1 | tail -20`;
  `npm run check 2>&1 | grep -E "..." ; echo CHECK_EXIT=$?` newline
  `npm run check:built 2>&1 | tail -15`; and
  `cd E:/dev/daggerheart-loot && npm run check > "<scratchpad>/checkN.log" 2>&1`
  launched three times in one session. Every one carried `timeout: 300000` -
  the workers knew the Bash tool's default 120000 ms cannot hold a 165 s
  check. Parity and vitest were backgrounded sixteen times across six
  sessions, almost always file-redirected.
- **Measured:** `PreToolUse(Bash)` fires for a `run_in_background: true` call
  on this host. Probe: backgrounded `cd /nonexistent-hooks-probe-dir && node
  tests/parity.js`; the long-check reminder came back as hook additional
  context and the command exited 1 on the `cd` with nothing launched.
- **Not measured, assumed:** `tool_input.run_in_background` is present in the
  `PreToolUse` payload. No existing hook exposes it at that event and
  transcripts record no hook payloads (their `hook_event_name` hits are docs
  text earlier sessions read). B1 measures it as its step 7.
- `tests/parity.js` is modified in the working tree by issue 47's B5.1; the
  B2 lockfile waits for that regardless of the gate. `tests/run-all.js` runs
  `parity` as a suite. `test-output/` and `coverage/` are gitignored.
- `.claude/prompts/orchestrate.prompt.md` lines 97-102 point at the open
  candidate as "a planning decision"; that paragraph goes stale when B1 ships.
- `CLAUDE.md` is 194 lines.
- This host notifies the main session when a background command exits; a
  backgrounded run is lost only when a subagent's turn ends. The gate cannot
  see it in either case.

## Learned during the merge pass (2026-09-10, second planner pass)

- **The batch is one: B1 carries both guardrails and one commit.** There is
  no B2. `plan.md` section 4 records what the bundle costs and that the
  ordering changed by owner decision, not planner preference.
- CI's parity job is a four-shard matrix with **one `ubuntu-latest` runner
  per shard** (`.github/workflows/ci.yml`), so a per-tree lock never sees a
  sibling shard. `tools/parity-ubuntu/` writes its own `test-output/`
  inside the container and is invisible to a host lock.
- `tests/run-all.js` `fs.rmSync`s all of `test-output/` at start and runs
  `parity` in a pool beside the other puppeteer suites.
- `tests/parity.js` hashes itself into the legacy screenshot cache key, so
  **any edit to it makes the next parity run cold** (~867 s in CI).
- `tests/**` is ignored by eslint, prettier and vitest coverage; a new
  `tests/parity/lock.js` needs no coverage number - the hook selftest is
  what reaches it. `.claude/hooks/*.mjs` **are** prettier-checked.
- Node is v24.15.0; an ESM hook can `await import()` a CommonJS module and
  read `.default`; `process.kill(pid, 0)` throws ESRCH for a dead pid and
  EPERM for one we cannot open.
- `selftest.mjs` labels already reach `#63` (`#59 -am cluster`, `#60`,
  `#61-#63 pathKey`); the first plan's `#59-#70` numbering collided. New
  groups are `#64-#75` (rule 2g) and `#76-#91` (rule 2h and the module).
- `process.on('exit')` fires on `process.exit()` but not on a signal or a
  crash: a killed parity run leaves its lock, which is why liveness plus a
  heartbeat TTL - not the file's existence - defines "live".

## Do not re-fetch unless

- The human provides new info
- context.md is missing a fact you need
- You suspect drift vs the README's candidate table

## Learned during the retrieval pass (2026-09-10, third planner pass)

Measured, do not re-derive; the evidence table is `plan.md` section 2d.

- **The Bash tool prints `Exit code N` only on a non-zero status, and a
  pipeline's status is its last command's.** On the tool itself:
  `false | tail -n 2` comes back as `(Bash completed with no output)`;
  `set -o pipefail; false | tail -n 2` comes back as `Exit code 1`;
  `set -o pipefail && (echo x; exit 3) | tail -n 2` as `Exit code 3` then
  the output. So the README's recommended pipe shows a failed check as a
  coverage table with no exit line. Git Bash 4.4.23; `PIPESTATUS[0]` also
  carries the real status.
- **Twelve status-motivated re-runs of `npm run check` across five
  sessions** (`452267b3` 09-03 six status-only runs; `eaf37c2b` main,
  `c9264e71` a5eba and a7638 09-09; `f1284991` aebc today, B5.1: piped,
  file-redirected for the status, piped again for the gate). Two `echo $?`
  asked of a fresh call, both printed 0. The issue 65 worker ran five
  file-redirected checks and had the commit blocked twice before using the
  pipe.
- **The Bash tool never kills a command at its `timeout`; it moves it to
  the background** (`Command did not complete within its Ns timeout and
  was moved to the background (ID: ...)`, and to a subagent: `it is
  terminated when you give your final response and no notification can
  follow`). 27 recorded results; 0 of the shape "Command timed out". A
  foreground `npm run check` with the default 120 s was moved once
  (`8ba57351` afff seq 57, 09-09) and the worker ended its turn polling an
  empty file. Six checks outlived the 600 s maximum (`844216a7` x4,
  `f1284991` aebc seq 84 today, plus one `npm test` at 300 s) - the fork-pool
  stall, not a timeout problem. 296 of 3,094 calls set an explicit timeout,
  72 at 600000.
- **The tool's output cap is about 30,000 characters** (largest shown
  29,787; smallest persisted 29.8 KB); over it the full output is saved to
  `~/.claude/projects/<project>/<session>/tool-results/<id>.txt` and the
  path is named. 75 persisted results; `npm run check` never hit it; parity
  does because its diff lines carry a page's whole text (`head -20` of a
  parity run persisted at 30 KB). Workers mostly grep the persisted file;
  one ~9 min parity run was wasted re-running instead.
- **135 `run_in_background: true` launches**: 69 sleep/poll loops (43 in one
  orchestrator session waiting on parity), 35 parity, 11 vitest, 8 check, 3
  run-all. Parity and vitest are file-redirected and grepped afterwards and
  that works from a main session.
- The only reads of `.claude/.check-cache.json` after a check are in
  `c9264e71` - issue 65 verifying its own hook. No evidence for an observer
  that speaks.
- The invocation string is quoted in: `bash-guard.mjs` (2f reminder),
  `check-observer.mjs` (comment), `selftest.mjs` (`#49e`, `#49f`),
  `implement.prompt.md` step 7, `README.md` line 80. `CLAUDE.md` has 21
  lines over 80 characters (longest 143) and Markdown is in
  `.prettierignore`, so a long one-liner there is neither unprecedented nor
  a format:check problem.
- Decisions of this pass: row 30 (accept the prefix) adopted pending the
  owner's Q1; row 31 (no-timeout deny) rejected for now and sketched in
  `plan.md` section 5; rows 32-34 rejected; the third instrument folds into
  B1 (`plan.md` section 4). HEAD at this pass: `720266d`.
