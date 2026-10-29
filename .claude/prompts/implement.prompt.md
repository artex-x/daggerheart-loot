TASK: <id>

The `TASK` value above is a placeholder. Prefer the TASK id from the orchestrator or user message when present.

Interpret it as:

* `TASK_ID`: the entire non-empty value after `TASK:`, trimmed; hyphens are part of the id
* `TASK_DIR`: `issues/<TASK_ID>`

Use `<TASK_ID>` as a variable. Never treat a sample id as hard-coded.

This session is for implementation of the approved technical design.
You are implementing, not redesigning.

This prompt is written for Claude Code; a host without agent tools runs it as a plain prompt.
Always read and follow `CLAUDE.md` in the repo root before doing anything else.

Follow the plan tightly: it is written so that a smaller model can execute it.
Do not select a role's model. A helper you dispatch follows
`.claude/README.md`, "Helper agents".
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
   Search with `rtk grep` (`-E` for alternation) or `git grep` - see
   `.claude/README.md`, "Code navigation". Before you rename a symbol or change a
   signature, search for every use of the name, imports and re-exports included.
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
* A schema batch (a change under `supabase/migrations/`) stops after `rtk npm run check:fast`, `npm run check:db` and the commit: it does not push before the review approves (rule 2r denies the push, which starts CI's `migrate-test` on the test project); the orchestrator resumes you for the push
* If primary approach fails: stop; present named fallback only with human confirmation; else report blocker + recommendation
* If human ends session mid-batch: stop coding, do not commit a half-batch, update handoff partial progress and exact next step
* A message that starts with `USAGE WRAP-UP` is the same stop, sent by the orchestrator before a plan limit cuts the session: follow its steps exactly. Commit only a batch whose gates passed, and revert nothing.
* After each numbered step of the batch, replace the handoff's line that starts `- Session end partial progress (if any):` with one `Edit` whose `old_string` is the whole current line, so a cut leaves a resumable record: `- Session end partial progress (if any): <batch> step <n> of <m> done; next: step <n+1>, <its first five words>.` Keep it one line; a `USAGE WRAP-UP` rewrites the same line.
* Write a durable fact or decision to its permanent home in this batch (`CLAUDE.md`, "Task and session protocol"); a comment follows `CLAUDE.md`, "Comments"

For the current batch:
1. Confirm objective, scope, acceptance criteria, mock/visual constraints
2. Implement the complete batch, including necessary local fixes in touched code per `CLAUDE.md`
3. Add or update focused tests. Prove a fix's test fails before the fix in a detached worktree at the base sha (`git worktree add --detach`, the new tests copied in), never by a mutation or a `git checkout --` of a tracked file in the task tree (since a guard's refusal was worked around through a script, 2026-10-22)
4. Run focused checks during development. Before the gate, run `rtk npm run check:fast`
   (one call, Bash timeout 600000): prettier, svelte-check and the snapshot test on the
   tree, vitest with coverage on the tests of the changed files, and the bundle budget
   when app code changed. Its exit 0 arms the commit gate on a task branch; fix what it
   finds.
5. Run verification from handoff, including as applicable:
   - `npm run check:db` (PowerShell) when `supabase/` or `tests/db/` changed
   - data/image/stub/build steps for data batches
   - the heavy gates (`npm run check`, `check:built`, the browser suites, `e2e`) are CI's
     run on the pushed commit; run one locally only when the handoff names it
6. Do not commit if required checks fail
7. Never end a turn with a check still running: its output dies with your shell, and
   from outside a stopped turn is indistinguishable from a dead agent. Run each check as
   one foreground call with the Bash timeout set to 600000 (no pipe, no `set -o
   pipefail`, no redirect). If the tool moves it to the background, stay in the turn
   until it exits and read its output for the `gate credit:` line; run it again only
   when that line is missing. Never run a cold full `npm run check` in a subagent: it
   takes 10-18 min, and the main session runs it in the background. A redirect to a file
   hides the result from the commit gate and blocks the commit. See `.claude/README.md`.
   If you must stop first, name the command and its task id in your final message - the
   orchestrator can resume you with your context intact, so say exactly
   where you stopped.
8. Review the final diff for unintended changes
9. Update `<TASK_DIR>/plan.md`
10. Update `<TASK_DIR>/handoff.md` using template headings (completed, verification commands/results, next batch, blockers) - say what happened to every inherited acceptance line, not only the batch's own; set the line `Session end partial progress` to `none`; record the pre-batch sha (`git rev-parse HEAD` before the commit) as "Previous sha" - the handoff is inside the commit it would otherwise name, so it never records a "new" sha for itself; report that sha in this turn's final summary instead
11. Commit only after checks pass, using Conventional Commits as defined in `CLAUDE.md` - each batch is a new commit on the task branch, never an amend of a pushed one; commit the coherent batch, not unrelated foreign changes. The message body names the task id (a `Task: <id>` line, or the id stated in a sentence) - this is what `git log --grep=<id>` and a `docs/decisions/` file's provenance pointer resolve through; a commit that never names it leaves that pointer dead.
12. Before the push, `git fetch origin` and merge the latest `origin/main` (a merge commit, never a rebase; owner, 2026-10-22); on a conflict outside `docs/DECISIONS.md` (`.claude/README.md` has its procedure), stop and report. Push the task branch (`git push -u origin <branch>`) unless the dispatch says not to, or the batch is a schema batch before its approve; the orchestrator then waits on CI with the CI credit (`CLAUDE.md`, "Source and commit conventions"; `.claude/README.md`, "CI credit").

Finish with a concise summary of the batch, verification, commit (sha, previous sha, pushed or not), and next batch.