TASK: <id>

The `TASK` value above is a placeholder. Prefer the TASK id from the orchestrator or user message when present.

Interpret it as:

* `TASK_ID`: everything after `TASK:` and before the first `-` (or the whole id if there is no `-`)
* `TASK_DIR`: `issues/<TASK_ID>`

Use `<TASK_ID>` as a variable. Never treat a sample id as hard-coded.

This session is for implementation of the approved technical design.
You are implementing, not redesigning.

This prompt is agent-agnostic (Claude Code, Codex, or similar).
Always read and follow `CLAUDE.md` in the repo root before doing anything else, even if the host agent normally uses other instruction files.

Assume the plan was written for a cheaper implementation model: follow it tightly and do not redesign.
Do not select models.

Before doing anything else:

1. Read `CLAUDE.md` and follow all standing guidance there
2. Read the GitHub issue for this task (when TASK_ID is a GitHub issue number):
   - Prefer: `gh issue view <TASK_ID> --comments` if `gh` is available
   - If `gh` is unavailable, incomplete, or images matter: open the issue in the browser
     (derive the URL from `git remote`, typically `https://github.com/<owner>/<repo>/issues/<TASK_ID>`)
   - In the browser, read the full issue body, comments, and open/view embedded screenshots and attachments directly
   - Use the GitHub API only as a last-resort text fallback
   - Do not let issue chatter override settled decisions in `plan.md` without evidence
3. Read and analyze images/screenshots on the issue when relevant to the batch
4. Read `<TASK_DIR>/plan.md`
5. Read `<TASK_DIR>/handoff.md`
6. Read any referenced mocks under `<TASK_DIR>/` (e.g. `mocks/`)
7. Read the relevant files under `docs/specs/`
8. Inspect the source code, tests, fixtures, and public contracts identified for the next implementation batch
9. Inspect `git status` and `git diff` before starting

If `plan.md` or `handoff.md` does not exist, stop and report that planning must be completed first. Do not create an improvised design.

If the next batch is not implement-ready (missing concrete acceptance criteria, files, steps, or verification commands), stop and say planning must refine the batch. Do not invent a design.

If the working tree is conflicting or unclear, stop and report it.

Treat `plan.md` as the approved technical design and `handoff.md` as the current execution state.
Treat approved mocks and visual constraints as binding unless they conflict with `CLAUDE.md` hard rules or public contracts вЂ” in that case stop and report the conflict.
Start from where the previous session stopped.

Session rules:

* Complete exactly one implementation batch per session unless the human explicitly asks for more
* If the batch is too large, split it in the plan/handoff rather than partially implementing
* Implement the next incomplete batch described in the plan and handoff
* Follow approved mocks/design constraints; do not freestyle a different UI direction
* Treat this as a refactor, not a redesign, unless the plan explicitly says otherwise
* Preserve documented behaviour and public contracts
* Do not invent abstractions ahead of need
* Do not reopen settled decisions without concrete evidence of a problem
* Update affected documentation, specifications, tests, and fixtures in the same batch
* Preserve unrelated changes already present in the working tree
* Do not expand beyond the batch in the name of making the change "bigger" вЂ” batch sizing is a planning decision
* If the primary approach fails or reality diverges unexpectedly:
  - stop before inventing a new design
  - if the plan/handoff names a fallback alternative, present it and ask the human before switching
  - if no fallback exists, report the blocker and options briefly with one recommendation, then wait
* If implementation reveals a material design gap or conflict with plan/issue/screenshots/mocks, stop and document it instead of silently redesigning
* If the human says the session is ending before the batch is complete: stop coding, do not commit a half-batch, update handoff with partial progress, remaining work, and the exact next step

For the current batch:

1. Confirm the batch objective, in/out scope, acceptance criteria, and any mock/visual constraints
2. Inspect the working tree and existing implementation state
3. Implement the complete batch, including necessary local/campsite fixes in touched code per `CLAUDE.md`
4. Add or update focused tests
5. Run relevant focused checks during development
6. Run `npm run check` before considering the batch complete
7. Also run any batch-specific checks named in the plan/handoff
8. Do not commit if required checks fail
9. Review the final diff for unintended changes
10. Update `<TASK_DIR>/plan.md` with completed items and verified decisions
11. Update `<TASK_DIR>/handoff.md` with:
    * What was completed
    * Files changed
    * Tests and checks run, including exact commands and results
    * Any deviations from the plan and their rationale
    * Whether mocks/visual constraints were followed
    * Remaining risks or blockers
    * Deferred improvements noticed while touching code
    * The exact next implementation batch
12. Commit the coherent batch only after all required checks pass, using Conventional Commits as defined in `CLAUDE.md`

Finish with a concise summary of the completed batch, verification results, commit details, and next batch.