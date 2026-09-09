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

**Hook config is snapshotted at session start.** Editing a hook script or
`settings.json` has no effect on the session that made the edit - restart the
session, or run `/hooks`, to pick it up. (On at least one host build this
session's own hooks were observed to fire live regardless - see
`issues/65/handoff.md` - but do not rely on that across hosts.)

Three runtime files live under `.claude/` and are gitignored
(`.claude/.gitignore`):

| File | Written by | Contents |
|---|---|---|
| `.check-cache.json` | `check-observer.mjs` | `{ key, at, command }` for the last observed passing `npm run check`. |
| `.check-index` | `tree-key.mjs` | A throwaway copy of `.git/index`, never the real one. |
| `.hook-state.json` | `lib.mjs` | Per-session dedupe markers and the set of paths each session wrote. |

**Escape hatch:** `SKIP_CHECK_GATE=1 git commit -m "..."` bypasses the commit
gate and announces the bypass to the human via `systemMessage`. Use it only
when `npm run check` genuinely cannot run - not because it is inconvenient.

Run the tests: `node .claude/hooks/selftest.mjs` (also wired into `npm run
check`). It never touches this repository's tree or state - every case runs
against a throwaway git repo in the OS temp directory.

Facts settled by measurement during implementation (issue 65):

- `tool_response.exit_code` is the numeric Bash exit-code field
  (`check-observer.mjs` also accepts `exitCode`/`returnCode`/`code` and treats
  a missing field as a pass, so the design stays correct even off this host).
- `All files` (vitest's coverage-table header) reliably appears in a passing
  `npm run check`, and does not appear alongside the failure markers
  (`npm error`, `ELIFECYCLE`, `FAILED`, `Tests \d+ failed`) in a passing run.
