# Handoff - TASK 65: Claude Code hooks

## Status

- Task status: **done**
- Last agent: implementer (B2, the whole remaining task)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `8e7fed1`

## Completed

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

## Verification

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

None. This was the whole task (`plan.md` section 1: "one batch, implement-ready. No
later batches").

## Blockers

None.

## Deferred

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
