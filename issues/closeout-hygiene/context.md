# Shared task context - TASK closeout-hygiene

Orchestrator maintains this file so later steps do not re-fetch the same sources.

## Goal

Closeout hygiene: make the orchestrator's end-of-task cleanup deterministic
where it can be, and reviewable where it cannot. The human asked whether a
dedicated cleanup agent should own this; the answer taken was no - one agent
would mix three jobs with three different gate profiles, a cold agent is the
worst judge of scratch-vs-evidence, and an agent whose job is "capture
insights" will find insights every session against a `CLAUDE.md` capped at
200 lines. Instead, three pieces:

- **A - hook, not agent.** Surface delete candidates deterministically, and
  refuse to orphan a reference to a retired `plan.md`.
- **B - reviewer clause, not cleanup agent.** Session-narrative prose in
  comments and docs is a review nit, cleared in the existing single
  remediation cycle on a terminal batch where gates already rerun.
- **C - sharpen closeout, do not delegate it.** The default is no new rule;
  a file citing a retired `plan.md` is updated in the commit that retires it.

## GitHub issue (if any)
- None. Human-initiated from an orchestration review, 2026-09-12.

## Evidence the gap is real (measured 2026-09-12)

- `issues/65/plan.md` was retired per closeout step 6, but nine files still
  cite it as their specification, at **ten** sites (count corrected during
  planning; the list below was always ten): `.claude/hooks/bash-guard.mjs:2`,
  `check-observer.mjs:4`, `edit-followup.mjs:4`, `edit-guard.mjs:2`,
  `lib.mjs:3` and `:131`, `selftest.mjs:7`, `session-start.mjs:2`,
  `session-stop.mjs:3`, `tree-key.mjs:3`. `issues/65/` now holds only
  `context.md` and `handoff.md`. The hooks point at nothing.
  `selftest.mjs:130` and `:1448` also contain the string but are scratch-repo
  path fixtures, not citations - leave them.
- Three task directories still carry `plan.md` (`agent-effort`,
  `dh-image-polish`, `hooks-guardrails`); whether each is retirable is the
  human's call, not this task's.
- `issues/dh-image-polish/refresh_artwork.py` is a retained scratch script.
- Production code is clean: no session narrative in `app/src`. The verbosity
  lives in `.claude/` prose and hook comments. Only two dated lines outside
  it: `tests/parity/lock.js:5`, `tools/parity-ubuntu/README.md:27`.

## Key paths
- Closeout prose: `.claude/prompts/orchestrate.prompt.md`, "Task closeout and
  cleanup" (steps 1-8) and "Session ending"
- Review prose: `.claude/prompts/review.prompt.md`, `.claude/agents/reviewer.md`
- Hooks: `.claude/hooks/session-stop.mjs` (already holds `getWrote(session_id)`,
  the per-session written-path map), `lib.mjs`, `edit-guard.mjs`,
  `bash-guard.mjs`, `selftest.mjs`
- Hook contract and candidate table: `.claude/README.md`
- `CLAUDE.md`, "Maintaining this file" (200-line cap, rule only after a
  repeated mistake) and "Orchestration"

## The commit gate decides the batch split (measured 2026-09-12)

`bash-guard.mjs:252` `isExempt()`: `issues/**` is exempt, and so is **every
`.md` except `README.md` and `README.ru.md`**. `treeKey()`
(`tree-key.mjs:27`) fingerprints the **whole** working tree - staged,
unstaged and untracked, gitignored out, HEAD excluded.

Consequences for this task:

- B and C are `.md`-only (`.claude/prompts/*`, `.claude/agents/*`,
  `CLAUDE.md`). The gate never fires; they commit on any tree.
- A touches `.claude/hooks/*.mjs`, which is **not** exempt, so it needs a
  passing `npm run check` recorded for the tree as it stands - including
  whatever else is uncommitted at that moment.
- `npm run check` runs `node .claude/hooks/selftest.mjs`, so a hook change
  is gated by the hook selftest directly. New hook behaviour earns a
  selftest case in the same commit.

## Tree state at kickoff (2026-09-12)

HEAD `a52c17d` (`test(app): the driver presses like a person, and the gates
move`) = B12 C1 of 3 on issue 47. **Issue 47's B12 is mid-batch in this
working tree**: 11 modified paths (`app/src/App.svelte`, `Chip.svelte`,
`FilterBar.svelte`, `StdPanel.svelte`, `shell.test.ts`, `tests/run-all.js`,
`.github/workflows/ci.yml`, `docs/specs/COVERAGE.md`, `docs/specs/DEBT.md`,
`CLAUDE.md`, `issues/47/handoff.md`) plus untracked `tests/app/*.js` (six
files) and `issues/tg-preview-refresh/`.

- **Path overlap with this task is exactly one file: `CLAUDE.md`**, dirty
  with a single added line about the browser-driven `tests/app` filters.
  Everything else is disjoint, so a scoped `git add` of `.claude/**` is clean.
- Preserve all of it. Never `git add -A`, never stage another task's paths.
- This does not block B or C. It does constrain A, which cannot commit until
  `npm run check` passes for the tree it is committing on.

## Command costs

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | a few minutes | yes |
| `npm run check:built` | a few minutes | yes |
| `node .claude/hooks/selftest.mjs` | seconds | yes |
| `node tests/run-all.js parity` | ~867s on CI | no |

`check:built` is not implicated: nothing here alters what a screen draws.

## Which machine is authoritative
- Windows 11, this tree. Hook behaviour is path-cased (`pathKey()` lower-cases
  on win32) - a case-insensitive match bug already cost the stop hook its
  `CLAUDE.md` and `PageHead.svelte` warnings once.

## Reasons already disproved

- "A dedicated cleanup agent" - considered and rejected this pass, with
  reasons above. The read-only closeout auditor (reviewer-shaped, reports a
  delete list and the orchestrator executes) stays available as the fallback
  if the checklist keeps being skipped; it is not this task's scope.

## Constraints
- No public contract, route, spec or parity surface is touched.
- Hooks warn or deny; they never delete. Deletion stays a human-or-orchestrator
  decision with the context that watched the files appear.
- `.claude/README.md`'s candidate table is the record of accepted and rejected
  hook ideas; a new hook lands there with its verdict.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs the tree (HEAD moves under this session - re-read
  `git log --oneline -3` before dispatching a writer)
