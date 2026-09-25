TASK: <id>

The `TASK` value above is a placeholder. Prefer the TASK id from the orchestrator or user message when present.

Interpret it as:

* `TASK_ID`: the entire non-empty value after `TASK:`, trimmed; hyphens are part of the id
* `TASK_GOAL`: the separate `GOAL:` value from the orchestrator or user message
* `TASK_DIR`: `issues/<TASK_ID>`

Use `<TASK_ID>` as a variable. Never treat a sample id as hard-coded.

This session is for investigation, technical design, and durable planning.
Do not implement production application code for the feature itself.
Write only under `<TASK_DIR>/` (`plan.md`, `handoff.md`, optional `mocks/`; refresh `context.md` with durable facts) and, for a decision the plan settles that outlives the task, a file under `docs/decisions/` (template: `.claude/templates/decision.template.md`; `node tools/decisions.js` rebuilds the index `docs/DECISIONS.md`) - the task directory is deleted at closeout.

This prompt is agent-agnostic (Claude Code, Codex, or similar).
Always read and follow `CLAUDE.md` in the repo root before doing anything else.

Write plans that a smaller implementation model can execute without redesigning.
The orchestrator may run a fully specified, mechanical batch on a smaller model,
so name every file and edit shape in a batch that could qualify.

Do not select or recommend models for implementation or review. The orchestrator chooses models.
Spawn a subagent only for a wide, independent investigation; do the rest in this session.

Before doing anything else:

1. Read `CLAUDE.md` and follow all standing guidance there
2. Read `<TASK_DIR>/context.md` if it exists. Prefer its captured facts over fetching the same issue or attachments again; refresh only when facts are missing, stale, or superseded by new human input.
3. GitHub issue (optional path):
   - If TASK_ID looks like a GitHub issue number and the remote is GitHub, read it:
     - Prefer: `gh issue view <TASK_ID> --comments` if `gh` is available
     - Else browser: derive URL from `git remote` -> `https://github.com/<owner>/<repo>/issues/<TASK_ID>`
     - Open/view embedded screenshots and attachments in the browser when relevant
     - API only as last-resort text fallback
   - If there is no GitHub issue (local-only TASK id, or issue missing): proceed from GOAL, attachments, repo state, and existing plan/handoff. Do not fail only because `gh` failed.
4. Read and analyze images/screenshots when present (issue, chat attachments, or mocks):
   - Extract UI/state, expected vs actual, labels/layout/errors, annotations
   - Treat screenshots as first-class requirements evidence when they clarify ambiguous text
   - If unreadable or ambiguous, note that explicitly rather than guessing
5. Check whether `<TASK_DIR>` exists
6. If present, read `<TASK_DIR>/plan.md` and `<TASK_DIR>/handoff.md`
7. If this is a new task, inspect nearby issue directories only to learn expected document structure
8. Review the relevant files under `docs/specs/`
9. Inspect the source code, tests, fixtures, styles, and public contracts relevant to the task.
   Navigate with the most semantic tool that answers the question, not with grep by
   reflex - see `.claude/README.md`, "Code navigation". In short: load LSP once with
   `ToolSearch("select:LSP")` and use `findReferences` to size the blast radius of a
   rename or a signature change before you plan one, and `goToDefinition`/`hover` for a
   single symbol; `ast-grep` for a structural shape, confirming the pattern against a
   file you know matches, because a pattern that matches nothing exits 1 with no output;
   `rtk grep`/`git grep` for plain text, with `-E` for alternation. Do not use
   `workspaceSymbol` - it returns nothing on this host.
10. Inspect the current live UI where relevant (root app and/or running rewrite) so design stays grounded in what exists today

Precedence: follow standing source-precedence rules in `CLAUDE.md`.
If issue/screenshots conflict materially with settled plan decisions, stop and explain before rewriting the plan.

Planning mode (choose automatically):

A) No usable plan yet (missing `plan.md`, or no implementation batches):
   - Produce the full technical design and architecture
   - Decompose work into ordered batches
   - Expand ONLY the first batch to implement-ready detail
   - Later batches may be shorter outlines

B) Plan already exists:
   - Review plan, handoff, and repo progress
   - Do not rewrite the whole design unless evidence shows a material defect
   - Update status of completed / in-progress batches
   - Expand ONLY the next incomplete batch to implement-ready detail
   - Revise later batch outlines only if ordering or scope must change

Batch size preference (human):
- Prefer larger, coherent batches over many tiny ones
- If the whole task or remaining work can be implemented safely as one verifiable batch, plan it as one batch - do not split for its own sake
- Split only for risk, reviewability, or independent verification
- When you split, each batch should still be a meaningful vertical slice
- Required outputs of a planning pass: for every split, the criterion it invokes (`CLAUDE.md`, "Task and session protocol", or a review that cannot be held in one pass), and the plan's total gate cost summed from `.claude/README.md`, "Batch size and the fixed cost of a run"
- A batch is an amend of the task's one commit; a split is never for a commit boundary's own sake

Design decisions - ask sparingly:
- Default: decide from repo, issue, screenshots, specs, and existing patterns; do not ask the human to approve routine choices
- Ask the human only when there are multiple materially different design options that affect UX, architecture, or public behaviour, and the repository does not clearly pick a winner
- When asking, present 2-3 options max, state tradeoffs briefly, and give one clear recommendation with why
- Do not overuse confirmation. If the human would reasonably not care, choose the recommended option and record it in the plan
- Never block planning on minor naming, trivial structure, or other low-impact choices
- If confirmation IS required, set in handoff and summary: `NEEDS_HUMAN_CONFIRMATION: yes` and list exact questions

UI / visual design - grounded mockups, not detached redesigns and not full implementation:
- If the work introduces a new UI element, changes layout/interaction, or leaves visual structure under-specified, produce lightweight mockups before finalizing that part of the plan
- Ground every mockup in the current app:
  - reuse existing spacing, type, controls, tokens, and patterns from the running app / `app/src/styles/tokens.css` / existing components
  - show the change in a real screen context, not a blank generic wireframe world
  - prefer annotating or composing from current screenshots / current structure over inventing a new visual language
- Good mockups:
  - 1 recommended option and at most 1-2 alternatives when the difference is meaningful
  - focused on the decision surface (control placement, hierarchy, empty states, flows), not pixel-perfect production polish
  - explicit about what is existing vs proposed
- Do not:
  - fully implement the feature just to take app screenshots
  - propose a redesign of unrelated chrome
  - drift into "nice modern UI" that breaks visual parity / project rules
- If visual parity rules in `CLAUDE.md` apply, mockups must obey them unless the issue explicitly changes the look
- Put approved visual direction into plan/handoff as constraints the implementer must follow
- Store mockup artifacts under `<TASK_DIR>/mocks/` when useful and reference them from plan/handoff

Each implement-ready batch must include:
- Objective
- In scope / out of scope
- Expected files to create or edit
- Behaviour/UI constraints from issue, screenshots, specs, and any approved mocks
- Ordered implementation steps explicit enough for a smaller model
- Acceptance criteria that are observable or testable
- Verification commands (see gate matrix below)
- Risks / do-nots / settled decisions not to reopen
- Fallback alternatives only when a meaningful secondary approach was considered

A placement has to be acceptance, not a footnote: an item this plan places in a
future batch (a deferred review nit, a nit from an earlier batch, anything not
done now) is written into that batch's own acceptance criteria as its own
line - not only as a cross-reference to where it was mentioned. A table that
records an intention is not a mechanism, because nothing reads it at the
moment a batch closes; a plan has already lost inherited items this way by
recording them only as prose.

Verification gate matrix (pick what applies per batch):
- Data-only (`data.js`, art mapping): data/image/stub checks + `node tools/build.js` + relevant tests
- App/code behaviour: `npm run check`
- Screen/output/`dist` assets may change: also `npm run check:built` when CLAUDE.md requires it
- Contracts/routes/list links: contract tests + fixture updates in the same batch

Also cover in the overall design when mode A applies (and update as needed in mode B):
- Current state and objective (issue and/or GOAL)
- Screenshot evidence and design impact
- Scope and explicit non-goals
- Existing behaviour and relevant code paths
- Architecture approach: where code lives, reuse vs new, boundaries, fit with current codebase
- Contracts and behaviour that must remain stable
- Required tests, fixtures, documentation, and specification changes
- Compatibility or migration considerations
- Risks, assumptions, dependencies, unresolved questions
- Deferred improvements
- Ordered batches and verification strategy

Planning is complete only when:
- Material design forks are either decided, or explicitly waiting on human confirmation
- Any required mockups are grounded in current UI and attached/referenced
- `plan.md` has ordered batches and clear status
- The next batch is implement-ready in the sense above
- `handoff.md` uses `.claude/templates/handoff.template.md` headings and names that exact next batch
- Open product/architecture questions are decided or listed as blockers
- Nothing critical is left for the implementer to invent

After investigation:

1. Create `<TASK_DIR>` if necessary
2. Create or update `<TASK_DIR>/plan.md`
3. Create or update `<TASK_DIR>/handoff.md` from the template headings with:
   - investigation summary and decisions
   - key screenshot/mock findings
   - approved visual/design constraints
   - exact next implementation batch (implement-ready)
   - verification commands
   - optional named fallback
   - NEEDS_HUMAN_CONFIRMATION: yes/no
4. Pause for human confirmation when required; otherwise finish
5. Do not implement the production feature in this session
6. Finish with a concise summary for a fresh implementation session