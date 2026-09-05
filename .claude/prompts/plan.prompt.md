TASK: <id>

The `TASK` value above is a placeholder. Prefer the TASK id from the orchestrator or user message when present.

Interpret it as:

* `TASK_ID`: everything after `TASK:` and before the first `-` (or the whole id if there is no `-`)
* `TASK_GOAL`: optional text after the first `-`, or GOAL from the user message
* `TASK_DIR`: `issues/<TASK_ID>`

Use `<TASK_ID>` as a variable. Never treat a sample id as hard-coded. Works for any task/issue number.

This session is for investigation, technical design, and durable planning.
Do not implement production application code for the feature itself.

This prompt is agent-agnostic (Claude Code, Codex, or similar).
Always read and follow `CLAUDE.md` in the repo root before doing anything else, even if the host agent normally uses other instruction files.

Assume a stronger model is planning and a cheaper model may implement.
Write plans that a smaller implementation model can execute without redesigning.

Do not select or recommend models for implementation or review. The orchestrator chooses models.

Before doing anything else:

1. Read `CLAUDE.md` and follow all standing guidance there
2. Read the GitHub issue for this task (when TASK_ID is a GitHub issue number):
   - Prefer: `gh issue view <TASK_ID> --comments` if `gh` is available
   - If `gh` is unavailable, incomplete, or images matter: open the issue in the browser
     (derive the URL from `git remote`, typically `https://github.com/<owner>/<repo>/issues/<TASK_ID>`)
   - In the browser, read the full issue body, comments, and open/view embedded screenshots and attachments directly
   - Use the GitHub API only as a last-resort text fallback
3. Read and analyze images/screenshots on the issue:
   - Prefer opening the actual image assets in the browser
   - Extract UI/state, expected vs actual, labels/layout/errors, and annotations
   - Treat screenshots as first-class requirements evidence when they clarify ambiguous text
   - If unreadable or ambiguous, note that explicitly rather than guessing
4. Check whether `<TASK_DIR>` exists
5. If present, read `<TASK_DIR>/plan.md` and `<TASK_DIR>/handoff.md`
6. If this is a new task, inspect nearby issue directories only to learn expected document structure
7. Review the relevant files under `docs/specs/`
8. Inspect the source code, tests, fixtures, styles, and public contracts relevant to the task
9. Inspect the current live UI where relevant (root app and/or running rewrite) so design stays grounded in what exists today

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
- If the whole task or remaining work can be implemented safely as one verifiable batch, plan it as one batch вЂ” do not split for its own sake
- Split only for risk, reviewability, or independent verification
- When you split, each batch should still be a meaningful vertical slice

Design decisions вЂ” ask sparingly:
- Default: decide from repo, issue, screenshots, specs, and existing patterns; do not ask the human to approve routine choices
- Ask the human only when there are multiple materially different design options that affect UX, architecture, or public behaviour, and the repository does not clearly pick a winner
- When asking, present 2-3 options max, state tradeoffs briefly, and give one clear recommendation with why
- Do not overuse confirmation. If the human would reasonably not care, choose the recommended option and record it in the plan
- Never block planning on minor naming, trivial structure, or other low-impact choices

UI / visual design вЂ” grounded mockups, not detached redesigns and not full implementation:
- If the work introduces a new UI element, changes layout/interaction, or leaves visual structure under-specified, produce lightweight mockups before finalizing that part of the plan
- Ground every mockup in the current app:
  - reuse existing spacing, type, controls, tokens, and patterns from the live UI / `style.css` / `styles/tokens.css` / existing components
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
- Store mockup artifacts under `<TASK_DIR>/` when useful (e.g. `<TASK_DIR>/mocks/`), and reference them from plan/handoff

Each implement-ready batch must include:
- Objective
- In scope / out of scope
- Expected files to create or edit
- Behaviour/UI constraints from issue, screenshots, specs, and any approved mocks
- Ordered implementation steps explicit enough for a smaller model
- Acceptance criteria that are observable or testable
- Verification commands
- Risks / do-nots / settled decisions not to reopen
- Fallback alternatives only when a meaningful secondary approach was considered, so implementation can switch with human confirmation if the primary path fails

Also cover in the overall design when mode A applies (and update as needed in mode B):
- Current state and objective grounded in the GitHub issue
- Screenshot evidence and design impact
- Scope and explicit non-goals
- Existing behaviour and relevant code paths
- Architecture approach: where code lives, reuse vs new, boundaries, fit with current codebase
- Contracts and behaviour that must remain stable
- Required tests, fixtures, documentation, and specification changes
- Compatibility or migration considerations
- Risks, assumptions, dependencies, and unresolved questions
- Deferred improvements
- Ordered batches and verification strategy

Planning is complete only when:
- Material design forks are either decided, or explicitly waiting on human confirmation
- Any required mockups are grounded in current UI and attached/referenced
- `plan.md` has ordered batches and clear status
- The next batch is implement-ready in the sense above
- `handoff.md` names that exact next batch and its verification commands
- Open product/architecture questions are decided or listed as blockers
- Nothing critical is left for the implementer to invent

After investigation:

1. Create `<TASK_DIR>` if necessary
2. Create or update `<TASK_DIR>/plan.md`
3. Create or update `<TASK_DIR>/handoff.md` with:
   - what was investigated or reviewed
   - what was decided or changed
   - key screenshot/mock findings
   - approved visual/design constraints for implementation
   - the exact next implementation batch (implement-ready)
   - relevant files and hot paths
   - risks, assumptions, blockers
   - required verification commands
   - optional named fallback approach if primary path hits a wall
4. Pause for human confirmation when required by the design-decision rules above; otherwise finish
5. Do not implement the production feature in this session
6. Finish with a concise summary suitable for starting a fresh implementation session