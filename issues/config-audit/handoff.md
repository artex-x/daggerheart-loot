# Handoff - TASK config-audit

## Status
- Task status: in_progress (planned; nothing implemented)
- Last agent: planner (2026-09-15)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `2d2e983` (committed boundary between issue 47 batches; land all three batches before R0b planning starts)

Gates for this task: `npm run check` for B3 only (it changes `.claude/hooks/*.mjs`, a covered path; `selftest.mjs` runs inside it). B1 and B2 are markdown-only and commit-gate exempt. **No batch changes a rendered screen or any app source, so `npm run check:built` and parity are not required anywhere in this task** (`context.md`, "Command costs").

## Completed
- Batch name/id: planning pass
- What shipped: `issues/config-audit/plan.md` (design, decisions D1-D12, target structure, persistence-era decisions, three batches); this file; `mocks/CLAUDE.proposed.md` (the exact post-trim `CLAUDE.md`, 181 lines, verified by `wc -l` and `diff`); `mocks/skills/{orchestrate,handoff,small-fix}/SKILL.md` (the three skills, copied verbatim in B1); durable facts appended to `context.md`.
- Files changed: `issues/config-audit/` only.
- Commit(s): none (task documents are committed with B1).
- Deviations and rationale: the trim lands at 181 lines, not the audit's 148 - `plan.md` D2/D3: no `/parity` skill (collides with R0c, which deletes that section by name; a manual skill would relax the rules for the 47 sessions that need them), and every other kept line has a recorded reason. Issue 47's files are not compacted in this task - D4, with the answer to `issues/47/plan.md:14784`.

## Verification
- Commands run (exact): `wc -l issues/config-audit/mocks/CLAUDE.proposed.md CLAUDE.md` -> 181 / 199; `diff CLAUDE.md issues/config-audit/mocks/CLAUDE.proposed.md` -> only the sections B1 step 1 lists differ; `git status --porcelain --ignored -- .claude/skills .claude/settings.local.json` -> `?? .claude/skills/` (untracked, holds owner-local `impeccable/`), `!! .claude/settings.local.json`; `git log -S "setup-claude-agents" --oneline -- CLAUDE.md` -> `29f8920`; `rtk --help` -> `grep`, `rg`, `read` subcommands exist.
- Results: as above; no hook, test or app file touched.
- Gates: none run (planning only).

## Next batch (implement-ready)
- Name: **B1 - always-loaded prose: `CLAUDE.md` trim, dead references, three manual skills**
- Objective: land recommendations A, B (per D2/D3) and D in one markdown-only commit.
- In scope: `CLAUDE.md` (replace with `mocks/CLAUDE.proposed.md`); `.claude/README.md` (heading `## Host-aware explicit routing policy`, heading `### Run a long check`, new `## Skills` section, rows 39-40 literal `issues/65/plan.md` -> prose); `.claude/prompts/plan.prompt.md:81` tokens path; `.claude/prompts/orchestrate.prompt.md` (one `/small-fix` route bullet, one closeout sentence); `.claude/templates/handoff.template.md` (one comment line); create `.claude/skills/{orchestrate,handoff,small-fix}/SKILL.md` from `mocks/skills/`; `issues/47/handoff.md:5975-5981` and `issues/47/context.md:571-573` (two stale `.gitleaks.toml` sentences).
- Out of scope: agents, model policy, hooks, Finding 7 (B2, B3); "Migration and parity", "Project shape", the parity rows, `edit-followup.mjs`, `add-source.prompt.md` (R0c's); the `npm run check` invocation string anywhere.
- Files expected: listed above; exact edits in `plan.md` section 7, B1 steps 1-8.
- Steps: `plan.md` B1 steps 1-8. Stage the three `SKILL.md` files **by name** - `.claude/skills/` also holds the owner's untracked `impeccable/`, which must stay untracked.
- Acceptance criteria: `plan.md` B1 "Acceptance criteria" (the `wc -l` = 181, the six greps, the skills tracked with `disable-model-invocation: true`, `impeccable/` still untracked, every deleted `CLAUDE.md` line accounted for).
- Verification commands: the greps in `plan.md` B1; `wc -l CLAUDE.md`; `node .claude/hooks/selftest.mjs` (expected unchanged, 111). No `npm run check` (no covered path changes); no `check:built`; no parity.
- Risks / do-nots: `plan.md` B1 "Risks / do-nots" - if the step-1 `diff` shows a change outside the listed sections, stop (mock and HEAD drifted).
- Fallback (optional): none needed; the mock is the text.

After B1: B2 (wrappers, reviewer allowlist, planner-tier policy, Finding 7) and B3 (hooks) are independent of each other; B3 depends on B1's `/handoff` file only for the message it names. Both are outlined in `plan.md` section 7 with the exact texts and code sketches; the planner does not need to be resumed to expand them unless a reviewer returns `replan`.

## Blockers
- None. The reviewer `tools:` probe (B2 acceptance, README row 41) is the orchestrator's to run after B2 lands; until then row 41 reads "probe pending" by design.

## Deferred
- **For issue 47 (human to carry into R0c's plan):** (1) compact `issues/47/{plan,handoff,context}.md` at R0c's closeout per `.claude/skills/handoff/SKILL.md` - this task installs the budget and does not compact (D4); (2) `CLAUDE.md` "Task and session protocol" cites `docs/parity.md`, "Batch size and the fixed cost of a run" - R0c deletes that file and must retarget the citation; (3) `CLAUDE.md` line numbers move in B1 (199 -> 181); R0c's plan cites sections by name, so re-read the file rather than any recorded number.
- **For the owner, outside this repo:** the persistence design's 17.4 names the audit prompt as `docs/agent-audit.v6.prompt.md`; no such file exists here (the prompt is `audit.prompt.md` on the desktop). User-level listing pressure (20 resume skills, `docx`/`pptx`/`xlsx`) and the owner-local `.claude/skills/impeccable/` (model-invocable, not in `context.md`'s count of 58) are the owner's call; the 2026-10-15 re-measure should count `impeccable`.
- `rg -n` as a further RTK-bypass reader: revisit on 2026-10-15 if measured.
- Closeout of this task: README row 42 cites `issues/config-audit/plan.md`; before retiring `plan.md`, move section 5 (persistence-era decisions) to its permanent home (the persistence task's plan, or the README) and retarget the row, or rule 2i denies the deletion. `mocks/` becomes disposable once B1 has copied it - delete it in the closing commit and record it here.

## Notes
- Mocks path: `issues/config-audit/mocks/CLAUDE.proposed.md`; `issues/config-audit/mocks/skills/{orchestrate,handoff,small-fix}/SKILL.md`. Text artefacts, not visual mocks; this task has no UI.
- Screenshot findings: none (no UI).
- Cleanup performed / retained artifacts: nothing removed. Retained: `.claude/skills/impeccable/` (owner-local, untracked, referenced by the ignored `settings.local.json`) - not this task's, never to be staged. `issues/tg-preview-refresh/` (untracked, another task's) - untouched.
- Session end partial progress (if any): none; planning complete.
