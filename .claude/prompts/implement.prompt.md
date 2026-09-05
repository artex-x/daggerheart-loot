TASK: <id>

The `TASK` value above is a placeholder. Prefer the TASK id from the orchestrator or user message when present.

Interpret it as:

* `TASK_ID`: the entire non-empty value after `TASK:`, trimmed; hyphens are part of the id
* `TASK_DIR`: `issues/<TASK_ID>`

Use `<TASK_ID>` as a variable. Never treat a sample id as hard-coded.

This session is for implementation of the approved technical design.
You are implementing, not redesigning.

This prompt is agent-agnostic (Claude Code, Codex, or similar).
Always read and follow `CLAUDE.md` in the repo root before doing anything else.

Assume the plan was written for a cheaper implementation model: follow it tightly.
Do not select models.
Only one implementer should be writing this working tree at a time.

Before doing anything else:

1. Read `CLAUDE.md` and follow all standing guidance there
2. Read `<TASK_DIR>/context.md` if it exists. Prefer its captured facts over fetching the same issue or attachments again; refresh only when facts are missing, stale, or superseded by new human input.
3. GitHub issue (optional):
   - If TASK_ID is a GitHub issue number: prefer `gh issue view`, else browser; screenshots when relevant
   - If no GitHub issue: proceed from plan/handoff/GOAL; do not fail only because `gh` failed
   - Do not let issue chatter override settled plan decisions without evidence
4. Read and analyze images/screenshots when relevant to the batch
5. Read `<TASK_DIR>/plan.md`
6. Read `<TASK_DIR>/handoff.md` (expect template headings from `.claude/templates/handoff.template.md`)
7. Read any referenced mocks under `<TASK_DIR>/`
8. Read the relevant files under `docs/specs/`
9. Inspect the source code, tests, fixtures, and public contracts for the next batch
10. Preflight working tree:
   - Inspect `git status` and `git diff`
   - If the tree has conflicting or unclear unrelated changes that make the batch unsafe, stop and report
   - Preserve unrelated changes; do not revert foreign work

If `plan.md` or `handoff.md` does not exist, stop - planning must be completed first.
If handoff marks `NEEDS_HUMAN_CONFIRMATION: yes`, stop - orchestrator/human must resolve first.
If the next batch is not implement-ready (missing acceptance criteria, files, steps, or verification commands), stop and say planning must refine the batch.

Treat `plan.md` as approved design and `handoff.md` as execution state.
Treat approved mocks/visual constraints as binding unless they conflict with `CLAUDE.md` or public contracts - then stop and report.

Session rules:
* Execute only the next batch named in handoff/plan
* Follow approved mocks/design constraints
* Complete that full batch when feasible; do not arbitrarily subdivide it
* Do not start later batches unless the human explicitly asks
* Do not expand beyond the batch to make it "bigger"
* Follow settled decisions; do not reopen without concrete conflict evidence
* Update affected docs/specs/tests/fixtures in the same batch when required
* If primary approach fails: stop; present named fallback only with human confirmation; else report blocker + recommendation
* If human ends session mid-batch: stop coding, do not commit a half-batch, update handoff partial progress and exact next step

For the current batch:
1. Confirm objective, scope, acceptance criteria, mock/visual constraints
2. Implement the complete batch, including necessary local fixes in touched code per `CLAUDE.md`
3. Add or update focused tests
4. Run focused checks during development
5. Run verification from handoff, including as applicable:
   - `npm run check` when code/app surface changed
   - `npm run check:built` when screen output / dist assets may change (per CLAUDE.md)
   - data/image/stub/build steps for data batches
6. Do not commit if required checks fail
7. Review the final diff for unintended changes
8. Update `<TASK_DIR>/plan.md`
9. Update `<TASK_DIR>/handoff.md` using template headings (completed, verification commands/results, next batch, blockers)
10. Commit only after checks pass, using Conventional Commits as defined in `CLAUDE.md` - commit the coherent batch, not unrelated foreign changes

Finish with a concise summary of the batch, verification, commit, and next batch.