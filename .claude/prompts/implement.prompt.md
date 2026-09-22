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

Follow the plan tightly: it is written so that a smaller model can execute it.
Do not select models.
Spawn no subagent for reads, searches, reviews or verification that you can
finish in a few tool calls. The batch's gates are the verification.
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
9. Inspect the source code, tests, fixtures, and public contracts for the next batch.
   Navigate with the most semantic tool that answers the question, not with grep by
   reflex - see `.claude/README.md`, "Code navigation". In short: load LSP once with
   `ToolSearch("select:LSP")` and use `findReferences` before you rename a symbol or
   change a signature, and `goToDefinition`/`hover` for one symbol; `ast-grep` for a
   structural shape, confirming the pattern against a file you know matches, because a
   pattern that matches nothing exits 1 with no output; `rtk grep`/`git grep` for plain
   text, with `-E` for alternation. Do not use `workspaceSymbol` - it returns nothing
   on this host.
10. Preflight working tree:
   - Inspect `git status` and `git diff`
   - If the tree has conflicting or unclear unrelated changes that make the batch unsafe, or another implementation batch appears mid-flight on the same files, stop and report
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
* A placement is acceptance, not a footnote: an inherited item (a deferred
  review nit, a nit carried from an earlier batch) is only done when its own
  acceptance-criteria line is checked, not when it is merely mentioned in a
  commit or a comment - a plan has already lost items this way
* If primary approach fails: stop; present named fallback only with human confirmation; else report blocker + recommendation
* If human ends session mid-batch: stop coding, do not commit a half-batch, update handoff partial progress and exact next step
* Write a durable fact or decision to its permanent home in this batch (`CLAUDE.md`, "Task and session protocol"); a comment follows `CLAUDE.md`, "Comments"

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
7. Never end a turn with a check still running: its output dies with your shell, and
   from outside a stopped turn is indistinguishable from a dead agent. Run it as
   `rtk npm run check` with the Bash timeout set to 600000 (no pipe, no
   `set -o pipefail`; `rtk` propagates the exit code directly) and stay in the turn
   until it finishes - do not redirect it to a file, which
   hides the result from the commit gate and blocks the commit. See `.claude/README.md`.
   If you must stop first, name the command and its task id in your final message - the
   orchestrator can resume you with your context intact, so say exactly
   where you stopped.
8. Review the final diff for unintended changes
9. Update `<TASK_DIR>/plan.md`
10. Update `<TASK_DIR>/handoff.md` using template headings (completed, verification commands/results, next batch, blockers) - say what happened to every inherited acceptance line, not only the batch's own; record the pre-batch sha (`git rev-parse HEAD` before the amend) as "Previous sha" - the handoff is inside the commit it would otherwise name, so it never records a "new" sha for itself; report that sha in this turn's final summary instead
11. Commit only after checks pass, using Conventional Commits as defined in `CLAUDE.md` - the first batch commits, every later batch amends (`git commit --amend`) the task's one commit; commit the coherent batch, not unrelated foreign changes. The message body names the task id (a `Task: <id>` line, or the id stated in a sentence) - this is what `git log --grep=<id>` and a `docs/DECISIONS.md` entry's provenance pointer resolve through; a commit that never names it leaves that pointer dead.
12. Do not push. The task's commit is pushed once, at closeout, after the task directory is retired (`CLAUDE.md`, "Source and commit conventions"; `.claude/skills/handoff/SKILL.md`).

Finish with a concise summary of the batch, verification, commit (amended sha, previous sha), and next batch.