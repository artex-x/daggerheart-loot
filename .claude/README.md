# Claude / Codex agent wiring

| Agent | Prompt | Default model frontmatter |
|-------|--------|---------------------------|
| planner | prompts/plan.prompt.md | fable (opus when Fable access is unavailable) |
| implementer | prompts/implement.prompt.md | sonnet |
| reviewer | prompts/review.prompt.md | opus |
| add-source | prompts/add-source.prompt.md | sonnet |
| refresh-artwork | prompts/refresh-artwork.prompt.md | sonnet |

Orchestrator: prompts/orchestrate.prompt.md

Each agent's frontmatter carries its real default tier, so a dispatch that names
no model still runs where it should. Never use `model: inherit` for a worker -
inherit means the session model, so a worker dispatched from a strong session
silently runs at that tier instead of its documented one. The orchestrator raises
a tier with an explicit `model` argument per dispatch; see the model selection
section of prompts/orchestrate.prompt.md.

The orchestrator owns final reconciliation and cleanup: wait for workers, align context/plan/handoff, preserve evidence and unrelated work, and remove only clearly disposable task-scoped scratch artifacts.

Per-task disk state under issues/<id>/:
- context.md - shared facts (issue summary, constraints); avoid re-fetch
- plan.md / handoff.md - design + execution (see templates/)
- mocks/ - optional

Kickoff:
  Follow .claude/prompts/orchestrate.prompt.md
  TASK: <id>
  GOAL: <feature or add source items...>

## Hooks

Deterministic enforcement lives in `.claude/hooks/*.mjs`, registered in
`.claude/settings.json`. Every script exits 0 on every path - a throw, a
missing file, or absent git lets the action through. The only blocks are the
ones listed below; everything else is silent or a message.

| Event | Matcher | Script | What it does | Block or warn |
|---|---|---|---|---|
| `SessionStart` | - | `session-start.mjs` | Reports branch, HEAD, dirty files, most recently touched `issues/<id>/`. | warn (informational) |
| `PreToolUse` | `Bash` | `bash-guard.mjs` | Blocks `git reset --hard`, forced `git clean`, `git push`, `git checkout`/`restore` discards, `git stash drop`/`clear`, `rm -rf` inside the repo, blanket staging (`git add -A`, `git commit -a`) with 2+ dirty paths, AI attribution in a commit message, and commits when `npm run check` has not passed for the tree. Reminds once per session per command family before a long check. | **block** (+ one allow-and-remind case) |
| `PreToolUse` | `Edit\|MultiEdit\|Write\|NotebookEdit` | `edit-guard.mjs` | Blocks writes to `data.json`, `catalog.csv`, `i/*.html`, `dist/`, `package-lock.json`. | **block** |
| `PostToolUse` | `Bash` | `check-observer.mjs` | Records a passing `npm run check` against the current tree fingerprint, so the commit gate has something to check against. | never (silent) |
| `PostToolUse` | `Edit\|MultiEdit\|Write\|NotebookEdit` | `edit-followup.mjs` | Records the write for the `Stop` hook. Reminds once per session per group about `data.js` -> `node tools/build.js`, public-contract fixtures, and the parity baseline. | warn |
| `Stop` | - | `session-stop.mjs` | Warns when this session's own writes are still uncommitted, or the active task's `handoff.md` looks stale next to what this session wrote. | warn, never block |

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

**Run a long check so the gate can see it pass.** `check-observer.mjs` reads
the Bash tool's own captured stdout, and only trusts stdout it can attribute
to the check: the command must start with the check invocation (a leading
`cd <dir> &&` is fine), must not chain anything after it (`&&`, `;`, `||`),
and must not redirect stdout to a file. A pipe is fine and is the way to keep
a huge log out of the transcript, but `All files` sits near the *top* of the
coverage table, so size the tail generously:

```text
npm run check 2>&1 | tail -n 120
```

`npm run check > out.txt 2>&1` then reading the file does **not** satisfy the
gate, however genuinely the run passed - the hook never saw the output.

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

Facts settled during implementation (issue 65):

- Measured: `All files` (vitest's coverage-table header) reliably appears in a
  passing `npm run check`, and does not appear alongside the failure markers
  (`npm error`, `ELIFECYCLE`, `FAILED`, `Tests \d+ failed`) in a passing run.
- Looked up, not measured: `tool_response.exit_code` is the numeric Bash
  exit-code field, per the official hooks reference. `check-observer.mjs` also
  accepts `exitCode`/`returnCode`/`code`/`status`/`exitStatus`, and treats a
  missing field as a pass, so the design stays correct even off this host.

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
| 7 | **+** Block every `git push`, not only forced | `PreToolUse(Bash)` | **adopt** | CLAUDE.md's never-push rule is already absolute; the narrower rule would leave the broader one unenforced for nothing. |
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
