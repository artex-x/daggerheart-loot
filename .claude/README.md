# Claude / Codex agent wiring

| Agent | Prompt | Default model frontmatter |
|-------|--------|---------------------------|
| planner | prompts/plan.prompt.md | opus |
| implementer | prompts/implement.prompt.md | sonnet |
| reviewer | prompts/review.prompt.md | opus |
| add-source | prompts/add-source.prompt.md | sonnet |
| refresh-artwork | prompts/refresh-artwork.prompt.md | sonnet |

Orchestrator: prompts/orchestrate.prompt.md

## Host-aware explicit routing policy

Claude hosts use the frontmatter defaults above and human-controlled
session-level effort. On Codex, the orchestrator explicitly passes `model` and
`reasoning_effort` on every worker dispatch with `fork_turns: "none"` or a
bounded positive count. The role defaults are Sol/medium for planner and
reviewer, and Terra/medium for implementer, add-source, and refresh-artwork.
The only Codex ladder is Sol -> Terra -> Luna; Luna is only for an explicit,
bounded low-risk mechanical or read-only helper. `medium` is the default and
`high` the only escalation. See prompts/orchestrate.prompt.md. The planner's
tier can be escalated to `fable` for one dispatch under the named tests in
prompts/orchestrate.prompt.md, "Planner tier"; the frontmatter stays `opus`,
and a resume keeps its tier.

The orchestrator owns final reconciliation and cleanup: wait for workers, align context/plan/handoff, preserve evidence and unrelated work, and remove only clearly disposable task-scoped scratch artifacts.

Per-task disk state under issues/<id>/:
- context.md - shared facts (issue summary, constraints); avoid re-fetch
- plan.md / handoff.md - design + execution (see templates/)
- mocks/ - optional

Kickoff:
  Follow .claude/prompts/orchestrate.prompt.md
  TASK: <id>
  GOAL: <feature or add source items...>

## Skills

Three project skills, all manual (`disable-model-invocation: true`),
so they cost nothing in the skill listing and are followed by reading
the file when an agent needs them:

| Skill | File | Owns |
|---|---|---|
| `/orchestrate` | `skills/orchestrate/SKILL.md` | one pointer to `prompts/orchestrate.prompt.md` |
| `/handoff` | `skills/handoff/SKILL.md` | session closeout, the task-state size budget (150 KB warn, 300 KB collapse), the never-drop and always-drop lists, per-file collapse actions, retirement |
| `/small-fix` | `skills/small-fix/SKILL.md` | a single-file visual bug pinned to a width: reproduce at that width first, then fix, every gate, commit; no planner, no `context.md`, no review |

`.claude/skills/` is untracked as a directory because it also holds
owner-local tools; the three files above are tracked by name.

The `<!-- setup-claude-agents -->` markers around `CLAUDE.md`'s
Orchestration section came from `29f8920`, this repository's own
wiring commit; no generator on this host reads them. The block is
hand-owned and edited in place.

## Resuming a worker

A subagent that ended its turn is still listed and still holds its
context; `SendMessage` to its name resumes it from its transcript, and
its reply arrives as an ordinary task notification. Measured 2026-09-11
on the Windows desktop app - the host `improvements.md` Finding 1 and
the orchestrate prompt (until this change) recorded as unable to do it:

| Direction | Status | Evidence |
|---|---|---|
| main session -> its own subagent | works, context intact | the issue 47 B9 implementer, resumed with the review's blocker after its turn had ended, kept every fact and produced `84ca6df` |
| subagent -> main session | works | a probe loaded `SendMessage` via `ToolSearch` and delivered a line that arrived as `<agent-message from="...">` |
| subagent -> sibling subagent | **unproven** | only one subagent was alive; the probe's reported sibling id was its own. Settle it with two live subagents before designing on it |

A send carries no model; a resumed agent keeps its tier.

Facts that bound the rules in `prompts/orchestrate.prompt.md`, "Resume,
do not replace":

- `SendMessage` is not in a subagent's default tool list here; a subagent
  must `ToolSearch select:SendMessage` first. No prompt currently tells a
  subagent to send; one that does must say this. `ListAgents` is built in
  and lists the parent, the subagent itself and every peer session.
- A send carries no `model`; a resumed agent keeps its tier. Escalation is
  a fresh dispatch.
- A subagent's send goes out under its parent session's address and any
  reply lands in the parent's conversation, so two subagents cannot hold a
  conversation on this host; one-way dispatch is what exists.
- Direct reviewer -> implementer routing was proposed and declined
  2026-09-11: it drops the orchestrator's blocker/nit filter without
  dropping a hop (the reply still lands in the parent's conversation, not
  the reviewer's), and the filter has a measured save - the B9
  remediation, where the implementer was told the reviewer's
  third-deviation concern was already resolved and not to re-litigate it.
- Resuming a finished writer while another writer is live is two writers
  on one tree - the same violation as spawning one. The orchestrator does
  the `ListAgents` and HEAD preflight before a resume as before a spawn.
- Whether the reviewer's `permissionMode: plan` blocks `SendMessage` is
  unknown; the review prompt forbids the send in prose (candidate 36).

## Hooks

Deterministic enforcement lives in `.claude/hooks/*.mjs`, registered in
`.claude/settings.json`. Every script exits 0 on every path - a throw, a
missing file, or absent git lets the action through. The only blocks are the
ones listed below; everything else is silent or a message.

| Event | Matcher | Script | What it does | Block or warn |
|---|---|---|---|---|
| `SessionStart` | - | `session-start.mjs` | Reports branch, HEAD, dirty files, most recently touched `issues/<id>/`. | warn (informational) |
| `PreToolUse` | `Bash` | `bash-guard.mjs` | Blocks `git reset --hard`, forced `git clean`, a bare `git push --force`, `git checkout`/`restore` discards, `git stash drop`/`clear`, `rm -rf` inside the repo, `rm`/`git rm` of an `issues/<id>/plan.md` still cited by a tracked line elsewhere, blanket staging (`git add -A`, `git commit -a`) with 2+ dirty paths, AI attribution in a commit message, commits when `npm run check` has not passed for the tree, a backgrounded `npm run check`, a heavy run (`npm run check`, `check:built`, `check:fast`, `npm test`/vitest, `npm run build`, parity, run-all) while `test-output/parity.lock` is live, and `grep -n` / `tail -c` (readers that bypass RTK; use `rtk grep`, `rtk read`, or the Grep/Read tools). Reminds once per session per command family before a long check. | **block** (+ one allow-and-remind case) |
| `PreToolUse` | `Edit\|MultiEdit\|Write\|NotebookEdit` | `edit-guard.mjs` | Blocks writes to `data.json`, `catalog.csv`, `i/*.html`, `dist/`, `package-lock.json`. | **block** |
| `PostToolUse` | `Bash` | `check-observer.mjs` | Records a passing `npm run check` against the current tree fingerprint, so the commit gate has something to check against. Accepts a leading `cd <dir> &&` and `set -o pipefail;`. | never (silent) |
| `PostToolUse` | `Edit\|MultiEdit\|Write\|NotebookEdit` | `edit-followup.mjs` | Records the write for the `Stop` hook. Reminds once per session per group about `data.js` -> `node tools/build.js`, public-contract fixtures, and the parity baseline. | warn |
| `Stop` | - | `session-stop.mjs` | Warns when this session's own writes are still uncommitted, or the active task's `handoff.md` looks stale next to what this session wrote. Separately names this session's own writes that are still untracked (excluding `docs/` and the task-document set - `context.md`/`plan.md`/`handoff.md`/`mocks/` - in any `issues/<id>/`), as candidates for either a commit or deletion; never both sentences for the same path. Warns when a task document of the active task is past its size budget (150 KB; past 300 KB it names the collapse action per file), only for the session that wrote into that task directory. | warn, never block |

**Hook config may be snapshotted at session start.** Editing a hook script or
`settings.json` may have no effect on the session that made the edit - restart
the session, or run `/hooks`, to pick it up. On this Windows desktop build the
opposite has now been observed twice, deny path included: a script edited
mid-session blocked a command minutes later, so the scripts are re-read per
invocation here. See `issues/65/handoff.md`. Do not rely on either behaviour
across hosts.

Three runtime files live under `.claude/` and are gitignored
(`.claude/.gitignore`):

| File | Written by | Contents |
|---|---|---|
| `.check-cache.json` | `check-observer.mjs` | `{ key, at, command }` for the last observed passing `npm run check`. |
| `.check-index` | `tree-key.mjs` | A throwaway copy of `.git/index`, never the real one. |
| `.hook-state.json` | `lib.mjs` | Per-session dedupe markers and the set of paths each session wrote. |

**Escape hatch:** `SKIP_CHECK_GATE=1 git commit -m "..."` bypasses the commit
gate and announces the bypass to the human via `systemMessage`. It must be a
real environment prefix; merely naming it in a commit message does nothing.
Use it only when `npm run check` genuinely cannot run - not because it is
inconvenient.

### Run a long check

So the gate can see it pass, and so you can read the result:
`check-observer.mjs` reads the Bash tool's own captured
stdout, and only trusts stdout it can attribute to the check: the
command must start with the check invocation (a leading `cd <dir> &&`
and a leading `set -o pipefail;` are fine - neither writes to stdout),
must not chain anything after it (`&&`, `;`, `||`), and must not
redirect stdout to a file. A pipe is fine and is the way to keep a
huge log out of the transcript, but `All files` sits near the *top*
of the coverage table, so size the tail generously. The one
invocation, in one foreground call with the Bash tool's `timeout` set
to 600000:

```text
set -o pipefail; npm run check 2>&1 | tail -n 120
```

Each part is load-bearing (all measured 2026-09-10 on this host):

- **The prefix is how you learn whether it passed.** A pipeline's
  status is its last command's, so without the prefix a failed check
  exits 0 through `tail`, the tool prints no exit line, and the
  result reads as a pass. With it the tool prints `Exit code 1` as
  the first line of a failed run, and the hook sees `exit_code: 1`
  and refuses to arm. Twelve check runs across five sessions were
  spent re-running the check to learn its status a second way. Do
  not ask a later call for `$?`: each call is a fresh shell, and
  `$?` there is always 0.
- **The timeout is how the call survives.** The tool never kills a
  command; when it outlives its `timeout` it is moved to the
  background (`Command did not complete within its 120s timeout and
  was moved to the background`), and for a subagent that is a lost
  run. The default is 120 s and the check is ~165 s (stage by stage:
  format 11s, lint 30s, typecheck 12s, data 4s, derived 1s, i18n 0s,
  selftest 19s, vitest with coverage 88s), so a check call without a
  timeout cannot finish in the foreground. 600000 is the tool's
  maximum; a check that outlives even that is the fork-pool stall
  below, not a timeout problem.
- **The tail keeps the result under the tool's cap.** A result over
  about 30,000 characters is not shown; the tool saves it to
  `tool-results/<id>.txt` and names the path. `npm run check` piped
  to `tail -n 120` stays under. Parity does not: its diff lines carry
  a page's whole text, so `tail -n` cannot bound the bytes - grep the
  file the tool names instead of running it again.

`npm run check > out.txt 2>&1` then reading the file does **not**
satisfy the gate, however genuinely the run passed - the hook never
saw the output - and after the prefix there is no status a file gets
you that the pipe does not. Nor does a run started with
`run_in_background`: `check-observer.mjs` returns early on it by
design, because there is no stdout to attribute yet. Backgrounding
cost three worker runs on issue 47 and is now blocked at
`PreToolUse` (candidate 27).

**What the check does not cover: markdown.** `.prettierignore` has
carried `*.md` since `5ab5880` (2026-08-30), with its reasoning beside
it - the markdown here is wrapped by hand because a line break carries
meaning in the specs, and the licence line is pinned by
`tests/derived.js`. `prettier --file-info` reports `"ignored": true`
for a handoff, a spec and `CLAUDE.md` alike. So an `issues/**` or
`docs/specs/` edit can neither fail a check nor be corrupted by one,
and there is no reason to hold off editing a handoff while a check
runs - which is also why the commit gate exempts those paths
(`isExempt`). To change that, remove the one line from
`.prettierignore`; the reasoning is written next to it. Beware the
opposite error too: `npx prettier --check <some>.md` prints "All
matched files use Prettier code style!" while matching zero files, so
a success message there is not evidence of anything.

**One heavy run at a time.** `tests/parity.js` writes
`test-output/parity.lock` (`pid`, `startedAt`, heartbeat `at`, `argv`)
while it runs, touches it once per state, removes it on exit, and
refuses to start over a live one. `bash-guard.mjs` reads the same lock
through `tests/parity/lock.js` and blocks the heavy runs listed in the
table beside it. A lock is live only while its pid answers
`kill(pid, 0)` and the heartbeat is under fifteen minutes old, so a
killed run's lock is ignored on its own; if a block names a run that is
not actually alive, delete `test-output/parity.lock`.

**A check reporting zero coverage everywhere ran no test at all.** Vitest's
fork-pool worker start timeout is 60s and hardcoded (`START_TIMEOUT` in
`vitest/dist/chunks/cli-api.*.js` - no config knob), and `isolate` defaults to
true, so the forks pool spawns one child per test file. When the host cannot
boot a child in time, every file fails in turn and the output reads
`Test Files no tests`, `Errors <file count>`, `Failed to start forks worker ...
Timeout waiting for worker to respond`, with zeros down the whole coverage
table. Nothing ran, so nothing regressed - re-run it rather than investigating
a coverage drop. If it repeats on the same tree,
`npx vitest run --coverage --maxWorkers=4` is the measured fallback and costs
171s against 88s; the gate still needs a real `npm run check` call afterwards.
Free memory does **not** predict this: the failing session had 2.9 GB free and
the passing one 1.0 GB, so do not build a rule around watching it.

Run the tests: `node .claude/hooks/selftest.mjs` (also wired into `npm run
check`; it skips when git is not on PATH). It never touches this repository's
tree or state - every case runs against a throwaway git repo in the OS temp
directory.

Known limitations of `bash-guard.mjs`'s sanitiser, recorded rather than
papered over. It is a guard against habit and haste, not against an
adversary:

- A command hidden inside `sh -c "..."` or `bash -lc '...'` is erased with the
  quoted span and matches nothing.
- A quoted span is only preserved when it is a single shell-inert word, so
  `git reset "--hard"` is caught but `git reset "--hard HEAD~1"` is not.
- `git commit <pathspec>` with an explicit path can slip a checked file past
  the commit gate; CI still runs the suite.
- Wrapper stripping covers `env`, `command`, `nohup`, `time` and `xargs`, not
  every possible launcher.
- The vitest-alive side of "one heavy run" is invisible: `npm run check`
  writes no lock, so a coverage pass beside a live parity run is only caught
  by the parity side blocking `npm run check`, not by anything watching vitest.
- A container parity run (`tools/parity-ubuntu/`) writes its own
  `test-output/` inside the container and is invisible to this host's lock.
- On Windows a crashed run's pid can be reused inside the fifteen-minute TTL
  and reads as alive until the heartbeat expires - the deny message says to
  delete the lock.
- The orphan-`plan.md` rule (row 40) is invisible to a deletion through
  `git clean`, through `node -e "fs.rmSync(...)"`, through an unexpanded glob
  (`rm issues/65/*` reaches the hook as the literal token), or from the
  human's own terminal.
- It is also invisible to a citation living only in an untracked file:
  `git grep` searches tracked files.
- The RTK-bypass deny (row 43) sees the program token only: `sh -c "grep -n
  ..."` is erased with its quotes like every other quoted command, and `rg -n`
  is not covered (not in the measured miss).
- Not `bash-guard.mjs`, but worth recording beside it: `activeTask()`
  (`lib.mjs`, shared by `session-stop.mjs` and other hooks) picks the
  `issues/<id>/` directory with the newest file mtime, and on an exact tie
  keeps whichever directory `readdirSync()` returns first - filesystem-
  dependent, not alphabetical on every platform. A test (or any script) that
  depends on which task is "active" must pin the mtimes of every other
  `issues/<id>/` directory to something safely old, not just the one
  directory it expects to compete with. Traced from a CI-only failure
  (`config-audit` B3, 2026-09-16): `.claude/hooks/selftest.mjs`'s
  `testTaskBudget()` pinned only one competing directory, passed on this
  host and in a Linux container, and still failed on the GitHub runner -
  the real competing directory was a different one, rewritten later in the
  same test run, that neither local environment's filesystem happened to
  tie against. Pinning every directory's files, not just the one suspected,
  fixed it.

Facts settled during implementation (issue 65):

- Measured: `All files` (vitest's coverage-table header) reliably appears in a
  passing `npm run check`, and does not appear alongside the failure markers
  (`npm error`, `ELIFECYCLE`, `FAILED`, `Tests \d+ failed`) in a passing run.
- Looked up, not measured: `tool_response.exit_code` is the numeric Bash
  exit-code field, per the official hooks reference. `check-observer.mjs` also
  accepts `exitCode`/`returnCode`/`code`/`status`/`exitStatus`, and treats a
  missing field as a pass, so the design stays correct even off this host.

Facts settled during implementation (`hooks-guardrails`, 2026-09-10):

- `PreToolUse(Bash)` fires on a backgrounded call, and denies it under rule
  2g (probe A): `tool_input.run_in_background` reaches the hook as `true`.
- `tool_input`'s key list depends on what the caller set: a foreground call
  with an explicit `timeout: 600000` carries `["command","timeout","description"]`
  with `timeout` a number; a call with no `timeout` carries
  `["command","description"]` - the key is absent entirely, not present as
  `null` (probe A0).
- A live lock denies a heavy run and names the holder's pid and filter; a
  dead-pid lock does not deny, and after a run acquires over it and exits,
  the lock file is gone (probe B).
- On the Bash tool, `false | tail -n 2` comes back as `(Bash completed with
  no output)` and `set -o pipefail; false | tail -n 2` as `Exit code 1`.
- A command that outlives its `timeout` is moved to the background, not
  killed - 27 recorded results.
- A result over about 30,000 characters is persisted to
  `tool-results/<id>.txt`, largest shown 29,787, smallest persisted 29.8 KB.

Facts settled during measurement (`agent-effort`, 2026-09-11):

- `$CLAUDE_EFFORT` in a worker's Bash tool reports the level it runs under;
  the PowerShell tool does not carry it on this host.
- Hook input's `effort` field is `{ level }` (docs; not measured here - the
  fallback instrument that would read it was not needed).
- **Propagation, measured**: three probes against three controls read
  `high` / `low` / `high` in lockstep with the session (W1=E0, W2=E1,
  W3=E0) - session effort propagates to a dispatched worker.
- **Frontmatter `effort:` key, unverified**: one probe under a session at
  `high` still read `high` while `implementer.md` carried a scratch
  `effort: low` line. Agent definitions may be read once at session start,
  so a mid-session edit could simply not have been seen; a fresh-session
  repeat, not yet run, would settle it - the same standing as
  `disallowedTools` at candidate row 36.
- Model default effort is `high` on every model that supports effort, which
  is why a single `high` reading under a `high` session proves nothing;
  contrast levels must be `low` vs `high`.
- `set_session_effort` refuses the calling session and targets sessions, not
  subagents - the orchestrator has no lever to set a worker's effort per
  dispatch, only the human's own session control or `/effort`.

## Candidates considered (issue 65)

The full list evaluated when the hooks were designed, kept so nobody re-derives
it. Adopted beyond the original ticket's six are marked **+**. Consult this
before adding a hook: several tempting ones are rejected for reasons that have
not changed.

| # | Candidate | Event | Verdict | Reason |
|---|---|---|---|---|
| 1 | Session briefing: branch, dirty files, active task | `SessionStart` | **adopt** | Ticket. Cheap, once per session, states facts nothing else states. |
| 2 | Dangerous git commands | `PreToolUse(Bash)` | **adopt** | Ticket. Deterministic, destructive, irreversible. |
| 3 | Commit gate on a passing `npm run check` | `PreToolUse(Bash)` | **adopt** | Ticket. Scoped to covered files so it stays quiet on doc commits. |
| 4 | Generated-file write block | `PreToolUse(Edit\|Write)` | **adopt** | Ticket. Purely mechanical; a wrong edit here is silently overwritten by the next build. |
| 5 | Derived-artefact / contract reminder | `PostToolUse(Edit\|Write)` | **adopt** | Ticket. Once per session per group, or it is wallpaper. |
| 6 | Uncommitted work / stale handoff | `Stop` | **adopt** | Ticket. Warn only, scoped to this session's writes. |
| 7 | Block a bare `git push --force` | `PreToolUse(Bash)` | **adopt** | Narrowed 2026-09-12 from "block every push": agents now push at each committed boundary, so the blanket block was the thing keeping committed work off the remote. `--force-with-lease` refuses a ref that moved under it and is allowed; a bare `--force` is the only push that destroys history, and belongs with the other irreversible-git blocks. |
| 8 | **+** Block blanket staging (`git add -A`, `git commit -a`) with 2+ dirty paths | `PreToolUse(Bash)` | **adopt** | CLAUDE.md's preserve-unrelated-changes rule and `issues/65/context.md` both flag the in-flight issue-47 files; blanket staging is exactly how they get swept into someone else's commit. |
| 9 | **+** Block AI attribution in a commit message | `PreToolUse(Bash)` | **adopt** | An explicit standing user rule ("no Co-Authored-By trailer, ever") against a well-known default agent behaviour. Zero false positives; fires never once respected. |
| 10 | **+** Long-check reminder | `PreToolUse(Bash)` | **adopt** | `improvements.md` Finding 1: three of five workers made this exact mistake in one session. Fires on four command shapes, once per session each. |
| 11 | **+** Parity-baseline warning on `index.html` / `app.js` / `style.css` | `PostToolUse(Edit\|Write)` | **adopt** | `improvements.md` Finding 5 calls the static root frozen because it *is* the parity expectation; a block would be wrong because count updates legitimately touch it. |
| 12 | **+** Block writes to `dist/` and `package-lock.json` | `PreToolUse(Edit\|Write)` | **adopt** | Two array entries in a list that already exists; both catch real mistakes; neither can fire on a legitimate edit. |
| 13 | Warn when a worker is dispatched with no explicit `model` | `PreToolUse(Task)` | **reject** | Fixed structurally at `60172d3` by putting real defaults in agent frontmatter. A hook would re-litigate a solved problem. |
| 14 | Warn before `TaskStop` ("run ListAgents first") | `PreToolUse(TaskStop)` | **reject** | The recorded failure (`001aa43`) was a misread status, which is judgment. `orchestrate.prompt.md`'s "a worker that went quiet" section owns it and are the right owner. |
| 15 | Block a heavy run while another is alive | `PreToolUse(Bash)` | **reject** | Needs process enumeration; `tasklist` on Windows costs 200-500 ms and cannot distinguish a headless harness Chromium from the human's browser. Unreliable input, tool-path cost. Deferred alternative: have `tests/parity.js` write a lockfile the hook can stat in microseconds - a change to `tests/`, out of scope for issue 65. |
| 16 | Report the last CI conclusion at session start | `SessionStart` | **reject** | Needs `gh` over the network. Network in a hook can hang the session start, and the rule is that no hook path touches the network - even the one that is not a tool path. |
| 17 | Enforce Conventional Commits subject format | `PreToolUse(Bash)` | **reject** | Never a recorded failure here - every commit in the log conforms - and extracting a subject from an arbitrary `git commit` invocation (`-F`, two `-m` flags, `$'...'`) is exactly where a false block would land on a legitimate commit. The attribution check (#9) gets the value without the parsing risk, because it scans the raw string for a literal. |
| 18 | Verify `git config user.email` matches the required author | `SessionStart` | **reject** | Already configured globally on this host and has never failed. A rule that has never fired and can never fire is clutter. |
| 19 | Restrict the planner to writing under `issues/<id>/` using `agent_type` | `PreToolUse(Edit\|Write)` | **reject, top deferred candidate** | Fully enforceable in principle and a real failure mode. But `agent_type`'s value strings are unverified on this host: a wrong string either never fires (useless) or blocks a legitimate writer (harmful). The cheaper instrument is agent frontmatter - `reviewer.md` already uses `permissionMode: plan`. Settle it by logging `agent_type` from `session-start.mjs` for a session or two first. |
| 20 | Require `npm run check:built` when a screen changes | `PreToolUse(Bash)` | **reject** | "Alters what a screen draws" is judgment, not a path test. CLAUDE.md's `check:built` rule keeps it, and a hook must not pretend to enforce it. |
| 21 | Enforce the per-file coverage threshold | `PostToolUse(Write)` | **reject** | Already enforced by `vite.config.mts` at the real moment. A second copy would say nothing new. |
| 22 | Inject the active task on every prompt | `UserPromptSubmit` | **reject** | Duplicates `SessionStart` on every single turn. The definition of the noise the human warned against. |
| 23 | Preserve a handoff pointer across compaction | `PreCompact` | **reject** | `Stop` and `SessionStart` already bracket the session; a third copy of the same pointer earns nothing. |
| 24 | Anything reading the five-hour usage window | any | **reject** | Measured impossible on this host (`79e26c9`, `issues/65/context.md`). Explicitly out of scope. |
| 25 | Block edits to `docs/fixtures/**` as "generated" | `PreToolUse(Edit\|Write)` | **reject** | They look generated but CLAUDE.md requires updating them by hand in the same commit as a contract change. Blocking them would block the correct fix. Listed here because it is the tempting mistake in hook 4. |
| 26 | `SessionEnd` bookkeeping | `SessionEnd` | **reject** | Cannot influence the model or the human in time. `Stop` already covers the moment that matters. |
| 27 | Block `npm run check` launched with `run_in_background` | `PreToolUse(Bash)` | **adopt** | Three workers on issue 47 backgrounded the check, the third with three paragraphs of dispatch warning against it; prose is exhausted. False-positive-free: `check-observer.mjs` refuses a backgrounded run by design, so one can never satisfy the gate, and blocking it forbids nothing that works. Scoped to the gate-feeding check only - `check:built`, parity and run-all can legitimately run detached from a main session, and the reminder already covers them. Matched per segment, because the recorded shapes were piped, chained, `cd`-prefixed and file-redirected. The message names the replacement in one line, including the Bash timeout. Measured 2026-09-10: `PreToolUse(Bash)` fires for a backgrounded call and denies it (probe A); `tool_input.run_in_background` reaches the hook as `true`. |
| 28 | Block a heavy run while a parity run is alive, via a lockfile `tests/parity.js` writes | `PreToolUse(Bash)` | **adopt** (bundled with #27 by owner decision, 2026-09-10) | #15's deferred alternative. The input problem #15 rejected on is gone: the run itself writes the lock, so the hook stats one file instead of enumerating processes, and a human's terminal run is seen too. The stale-lock false positive is closed by liveness (`process.kill(pid, 0)`, no `tasklist`) plus a heartbeat TTL - a dead pid or a stale heartbeat is ignored, so the rule can only fire on a run that is actually alive, and a second heavy run beside it produces garbage, so the block forbids nothing that works. `parity.js` also refuses to start over a live lock, which covers parity-vs-parity with no hook in the loop. Fifteen peers on one tree make the overlap a matter of when. Known gaps, recorded above: the vitest-alive side is invisible; a container run is invisible; on Windows a crashed run's pid can be reused inside the TTL, which the message answers with "delete the lock". Measured 2026-09-10 (probe B): a live lock denies, a dead-pid lock does not. |
| 29 | Report HEAD moving under a session | `PreToolUse(Bash)` on `git commit`, or `Stop` | **reject for now** | Nothing collided in the recorded case; the prose that owns it ("Your writers are not the only writers", `3541a23`/`e5a26a2`) is one day old and has not been given a chance to fail, and the standing bar is a repeated mistake. Not `PreToolUse(Task)`: the dispatch tool is `Agent` on this host and `Task` in the reference, an unverified matcher (#19-shaped). Not `UserPromptSubmit`: #22. If the prose fails once, the cheapest deterministic form needs no unverified input: `session-start.mjs` records the HEAD sha in the session's `.hook-state.json` entry; `bash-guard.mjs`, on a `git commit` segment it already parses, compares `git rev-parse HEAD` against it and speaks (never denies) "HEAD moved since this session started: X -> Y, N commits not yours - `git log --oneline X..Y`; your commit lands on top, record Y as the base in the handoff"; `check-observer.mjs` refreshes the stored sha after the session's own commit. |
| 30 | Accept a leading `set -o pipefail` in the observer's attribution rule, and make the canonical invocation carry it | `PostToolUse(Bash)` (attribution only) | **adopt** (owner decision, 2026-09-10) | The recommended pipe reports `tail`'s status, so a failed check comes back with no exit line and reads as a pass; twelve check runs across five sessions were spent learning the status a second way. With the prefix the tool prints `Exit code 1` on a failed check, `check-observer.mjs` sees `exit_code: 1` and refuses to arm, and the worker reads one line. Forgery: `set -o pipefail` writes nothing to stdout, so the check stays the only stdout producer; the strip removes exactly the tokens `set -o pipefail` plus one `;` or `&&` at the start, on either side of the `cd` strip, and nothing else, after which every existing refusal applies unchanged. `set -o pipefail; echo "All files"`, `set -o pipefail; npm run check > o.txt 2>&1; grep "All files" o.txt`, `set -o pipefail; true; npm run check ...`, `set -eo pipefail; ...` and `set -x; ...` are all still refused. A forger gains nothing: omitting the prefix is today's state, and with it the exit code only tightens the gate. Measured 2026-09-10 on the Bash tool. |
| 31 | Deny a foreground `npm run check` with no `timeout` (rule 2g, second trigger) | `PreToolUse(Bash)` | **reject for now**, sketched | The tool moves a call that outlives its timeout to the background instead of killing it, the default is 120 s, and the check is ~165 s healthy, so a check call without a `timeout` cannot finish in the foreground on this host and is lost exactly as a backgrounded one is - measured once (`8ba57351` afff seq 57). But the number was undocumented until now: B1 puts it in the 2g deny message, the 2f reminder, the README, `CLAUDE.md` and the implement prompt, and the deny message arrives at the exact moment a worker retries in the foreground. That prose has not been given a chance to fail, which is the standing bar (row 29). And the deny has a failure mode of its own: it must fire on an *absent* field, so a host that stops passing `tool_input.timeout` to hooks would deny every foreground check - loud and diagnosable, but the one thing a guard must not do. Sketched verbatim in `issues/hooks-guardrails/plan.md` section 5, "Row 31, when it is needed"; probe A0 measured the field's shape on 2026-09-10 so the decision is a copy-paste later. |
| 32 | The observer speaks its verdict (armed / not armed and why) | `PostToolUse(Bash)` | **reject** | Tempting and cheap. But the only recorded reads of `.check-cache.json` are issue 65 verifying its own hook, and once the exit code is the check's (row 30) the worker has the status. No evidence; the observer stays silent by design. |
| 33 | Speak on `echo $?` as the first command of a call | `PreToolUse(Bash)` | **reject** | Two occurrences, both inside R1; row 30 removes the reason to ask. One README sentence instead. |
| 34 | A hook for a result over the output cap | any | **reject** | The size is unknowable before the run, and the tool already persists the full output and names the file. The failure is re-running instead of reading it: the reminder gains one clause and the README one sentence. Parity's one-line-per-page diff text is the producer; shortening it is a `tests/` change with diagnostic cost, not this task's. |
| 35 | Deny `SendMessage` to a writer while another writer is live | `PreToolUse(SendMessage)` | **reject** | The input does not exist in a hook: liveness and role come from `ListAgents`, which a hook cannot call - it gets stdin JSON and nothing else. The matcher is unverified on this host (`tool_name` for `SendMessage` has never reached a hook here; #19/#29-shaped). Zero recorded failures; the standing bar is a repeated one. The prompt's "a resume is a dispatch" sentence owns it. |
| 36 | Deny the reviewer any `SendMessage` (write-by-proxy) | agent frontmatter `disallowedTools`, not a hook | **reject for now**, sketched | The cheaper instrument exists (row 19's argument): one frontmatter line in `reviewer.md`. But `disallowedTools` is unverified as a key this host honours, `SendMessage` is not in a subagent's default tool list so sending needs a deliberate `ToolSearch` load - a guard against habit and haste has no habit to guard here - and the failure has never been recorded. If a reviewer ever sends: add `disallowedTools: SendMessage` (or the key the host documents) under `permissionMode: plan` in `.claude/agents/reviewer.md`, and verify with a probe that the reviewer's `ToolSearch select:SendMessage` then returns nothing. |
| 37 | Warn on a second implementer dispatch for the same task while a completed one is listed | `PreToolUse(Agent)` | **reject** | The dispatch tool is `Agent` here and `Task` in the reference - the unverified matcher row 29 already rejects - and the hook cannot see the agent list. "Resume, do not replace" is a preference, and a wrong warning on a legitimate fresh dispatch (tier change, killed agent) is the one thing a guard must not do. |
| 38 | Log effort from a hook | `PreToolUse(Bash)` | **reject** | The Bash tool's `$CLAUDE_EFFORT` is the same value with no edit (measured 2026-09-11); an observe-only hook would be the first here, guards no recorded mistake, and re-measurement is one echo from any worker. Fallback sketched in `issues/agent-effort/plan.md` 3.4, reverted if used. |
| 39 | Stop names this session's own untracked writes | `Stop` | **adopt** | `closeout-hygiene`. The ten dead citations to issue 65's retired `plan.md` were found only by a human-initiated audit; the checklist step that would have caught the underlying pattern (an untracked scratch file left behind) can be skipped without anything noticing. Excludes `docs/` and the task-document set (`context.md`/`plan.md`/`handoff.md`/`mocks/` in any `issues/<id>/`) rather than the whole active issue directory, so the rule still catches a scratch script that lives inside one (`issues/dh-image-polish/refresh_artwork.py`, the one recorded instance). Considered and rejected: a second `Stop` script (re-parses the same `git status`, speaks in a second message the human has to reconcile with the first - `session-stop.mjs` already owns the moment and the input). |
| 40 | Deny `rm`/`git rm` of an `issues/<id>/plan.md` still cited by a tracked line | `PreToolUse(Bash)` | **adopt** | `closeout-hygiene`. A retirement looks complete on its own - nothing breaks, `npm run check` still passes - and the orphans are found months later by someone reading a citation that points at nothing; ten of them shipped this way for issue 65's retired `plan.md`. Deny, not warn: a `speak` at `PreToolUse` is acknowledged and stepped past, which is the thing being guarded against, and the escape (repair the citations first, or run the command in the human's own terminal) is the same shape every other block in this family offers. Considered and rejected: `edit-guard.mjs` never sees a deletion (no Edit-family tool fires for one); `session-stop.mjs` would fire on history rather than on the action, after the content is only recoverable from git history; `selftest.mjs` cannot be the rule, since it runs inside `npm run check` and a `.md`-only retirement commit is gate-exempt, so the check need never run between the deletion and the commit. `bash-guard.mjs` is the only site with both the input and the timing. Fallback if this proves too blunt: downgrade to `speak` at the one call site (trigger, lookup and message unchanged) - record the downgrade here rather than deleting the row. Retiring `issues/hooks-guardrails/plan.md` or `issues/agent-effort/plan.md` will need rows 31 and 38 above repaired first, or this rule denies the retirement - that is the rule working. |
| 41 | Reviewer `tools:` allowlist (`Read, Grep, Glob, Bash`) | agent frontmatter | **adopt** (`config-audit` B2) | Read-only posture becomes deterministic instead of prose plus `permissionMode: plan`; Edit/Write/NotebookEdit/Agent/ToolSearch drop out, which also closes row 36 (no `ToolSearch`, no `SendMessage`). Bash stays for `git status`/`diff`/`log` and focused checks. **Probed 2026-09-16 on this host: enforced.** A dispatched reviewer reported exactly `Read`, `Grep`, `Glob`, `Bash` and no others; `Edit`, `Write`, `NotebookEdit`, `Agent`, `ToolSearch` and `SendMessage` were all absent, which closes row 36 in fact and not only on paper. Two limits on what the probe establishes: it covers the tool allowlist only - `permissionMode` is not observable from inside a subagent without performing an action the probe forbade, so that half stays unverified; and `Bash` in the allowlist means the read-only posture still rests on the reviewer prompt and the permission settings, since a shell redirection writes. The allowlist is not by itself a read-only guarantee. |
| 42 | Persistence-era guards: RLS gate, migration-reversibility gate, applied-migration `edit-guard.mjs` rule, gitleaks-on-commit, one session per shared database | gates, `edit-guard.mjs`, `bash-guard.mjs`, `CLAUDE.md` | **decided, not installed** | Trigger: persistence Phase 0, after issue 47 closes at R0c; design in `issues/config-audit/plan.md` section 5 until that directory retires, then the persistence task's own plan. A dormant gate guards nothing and a skill installed early spends listing budget until it is needed. |
| 43 | Deny `grep -n` and `tail -c` (readers that bypass RTK) | `PreToolUse(Bash)` | **adopt** (`config-audit` B3) | Measured 2026-09-16: 198 sessions / 20,710 Bash commands over thirty days; ~281.4K tokens missed over 1,052 commands; `grep -n` 342 calls / ~117.6K and `tail -c` 159 / ~40.8K, together 158.4K of 281.4K = 56.3%, over half, in two commands. RTK's hook rewrites only at line start, so the miss is the piped, `$(...)` and `cd`-prefixed shapes prose has not moved. Matches the program token only, so `echo`, `git grep -n` and `rtk grep -n` are untouched; a line-start `grep -n` that RTK would have rewritten now costs one retry, the accepted price. Not `npm run check` and never `rtk npm run check`: the commit-gate trap (`issues/config-audit/context.md`; `check-observer.mjs` arms only on the bare invocation with the coverage table in stdout). Fallback if the retry proves noisy: exempt a single-segment, single-line shape - record here, do not delete the row. |
| 44 | Warn when a task document is past its size budget | `Stop` | **adopt** (`config-audit` B3) | Measured 2026-09-15: issue 47's `plan.md` 1,031 KB (57.7% shipped-batch briefs), `handoff.md` 523 KB (96% of Status superseded snapshots), `context.md` 227 KB, growing 350-1,400 lines per working day, read by every worker at dispatch. Warn, never block: a Stop hook that blocks session-end is worse than a large file. Scoped to the session that wrote into the directory, deduped per state. The procedure and the never-drop / always-drop lists live in `.claude/skills/handoff/SKILL.md`. Rejected: a `PreToolUse(Write)` size deny (blocks the closeout write that fixes it); a `SessionStart` notice (the writer is who needs it). |
