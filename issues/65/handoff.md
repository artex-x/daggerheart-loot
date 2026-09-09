# Handoff - TASK 65: Claude Code hooks

## Status

- Task status: **in_progress** - planned, not implemented. One batch, implement-ready.
- Last agent: planner (design complete); orchestrator wrote context and this file
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `f7308a9`

**Read in this order:** `CLAUDE.md`, then `issues/65/context.md`, then
`issues/65/plan.md`. The plan is 1158 lines and is the specification - it settles
the file list, every hook's exact behaviour and literal message text, the
adopted/rejected candidate table, the cleanup diff, the verification cases, and an
ordered step list in section 8. Do not re-derive any of it and do not re-fetch
issue 65; `context.md` already summarizes it.

## Completed

- Batch name/id: **B1 design** (planning only)
- What shipped: no production code. Design and shared facts only.
- Files changed: `issues/65/context.md`, `issues/65/plan.md`, `issues/65/handoff.md`
- Commit(s): this one (docs only)
- Deviations and rationale: the original session GOAL said finish in one pass with
  no handoff document. The human is short on tokens and asked to hand off instead,
  so this file exists and `plan.md`'s note about it has been corrected. Nothing else
  about the plan changed.

## Verification

- Commands run (exact): none - no code was written this session
- Results: n/a
- Gates: `npm run check` is the only gate this task needs. It touches no rendered
  screen, so `check:built` and the parity suite are not required.

## Next batch (implement-ready)

- Name: **B2 - implement the hooks setup and the prompt cleanup** (the whole task)
- Objective: build the hooks exactly as `plan.md` specifies, apply the section 6
  cleanup, and prove it with the selftest.
- In scope: everything in `plan.md` section 2's file table.
- Out of scope: anything touching `data.js`, generated artefacts, routes, contracts,
  or a rendered screen. This task changes none of them.
- Files expected: 8 new scripts under `.claude/hooks/`, `.claude/settings.json`,
  `.claude/.gitignore`; edits to `CLAUDE.md`, `.claude/README.md`,
  `.claude/improvements.md`, `.claude/prompts/{implement,orchestrate}.prompt.md`,
  `package.json`, `eslint.config.mjs`.
- Steps: `plan.md` section 8, in order.
- Acceptance criteria: `plan.md` section 7's case list (~58 selftest cases) passes,
  and `npm run check` passes with the selftest wired into it.
- Verification commands: `node .claude/hooks/selftest.mjs`, then `npm run check`.
- Risks / do-nots: `plan.md` section 9. The three that bite hardest are repeated
  under Blockers and Notes below.
- Fallback: if `permissionDecision: "deny"` turns out not to be honoured on this
  host, fall back to exit code 2 with the reason on stderr (plan section 9).

## Blockers

None. Two facts must be **measured, not assumed**, early in the batch - both are
steps in plan section 8, and neither blocks starting:

1. The `tool_response` exit-code field name for `PostToolUse(Bash)` (step 1, a
   ten-second probe). The check-observer cannot record a passing run without it.
2. That the literal `All files` really appears in a passing `npm run check` (step 9).
   If it does not, the commit gate is permanently **shut** rather than open. The
   `SKIP_CHECK_GATE=1` escape hatch exists regardless.

## Deferred

- Candidate #19 - scoping the planner's writes to `issues/<id>/` via `agent_type`.
  Deferred, not rejected: the value strings are unverified on this host, so a wrong
  guess either never fires or blocks a legitimate writer. Settle it by logging
  `agent_type` from `session-start.mjs` for a session or two first.
- Candidate #15 - blocking overlapping heavy runs. Needs a lockfile written by
  `tests/parity.js`, which is a `tests/` change and out of this task's scope.
- The full rejected list with reasons is `plan.md` section 5 (26 rows). It exists so
  the next session does not re-derive it; consult it before adding a hook.

## Notes

- **The hooks are inert in the session that writes them.** Claude Code snapshots hook
  configuration at session start, so there is no bootstrap deadlock (the commit gate
  cannot block its own commit) and also no way to verify by trying. Verification is
  the checked-in selftest. The implementer's final message must tell the human to
  restart the session, or run `/hooks`, to arm them. A safe live probe after restart
  is `git stash drop` on an empty stash.
- **Unrelated working-tree changes - preserve, never stage.**
  `app/src/components/PageHead.svelte`, `app/src/components/TablesPage.svelte` and
  `tests/parity/driver.js` are all modified and all belong to issue 47. Stage this
  task's files by name; never `git add -A` - which is also what adopted hook #8
  exists to prevent.
  Flagged for issue 47, not for this task: `driver.js`'s new comment says
  `TablesPage.svelte` defers its `scrollIntoView` behind `fonts.ready`, while the
  uncommitted `TablesPage.svelte` change removes that deferral and argues
  `fonts.ready` is meaningless here. The two read as inconsistent.
- **Prettier gates `.claude/`.** `.prettierignore` excludes `*.md`, `tests/` and
  `tools/`, but not `.claude/**`. Every `.mjs` and `settings.json` written must be
  Prettier-clean or `npm run format:check` - the first step of `npm run check` -
  fails. `.claude/**` is eslint-ignored and outside every tsconfig, so nothing else
  checks these files. Do not hand-format them; run `npm run format`.
- **No `bash` + `jq`.** `jq` is confirmed absent on this box (re-checked this
  session). Node startup here measures 179-323 ms, median ~225 ms, which is why all
  five Bash-path rules live in one script: one spawn per Bash call, not five.
- Mocks path: none for this task.
- Screenshot findings: none - no visual work.
- Cleanup performed / retained artifacts: nothing to clean. No scratch artifacts were
  created; `issues/65/` is the only output.
- Session end partial progress: none. Design is complete; implementation has not
  started, so there is no half-batch anywhere.
