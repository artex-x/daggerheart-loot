You are the orchestrator. Follow .claude/prompts/orchestrate.prompt.md with TASK: 57-debt in the worktree
E:\dev\daggerheart-loot\.claude\worktrees\57-debt, branch claude/57-debt. GOAL: finish the remaining tasks, in order, each
released to production when it is done (squash onto `main` after a green CI run of its tip, watch the `main` run through
`deploy`, merge `main` back). The owner may be AFK: take the recommended option, log each default in
`C:\Users\Ignat\.dhloot\notes\57\` (`afk-decisions-*.md`), stop only for a critical case.

First run `ListAgents`, `git status --short` and `git log --oneline -3` in the worktree and in the main checkout
(`E:\dev\daggerheart-loot`, on `claude/roll-per-line`: switch to `main` before any squash and back after), and
`gh run list --branch main --limit 3`. Check that the `roll-per-line` squash `06f848fc` is on `main`. Read the usage
(`orchestrate.prompt.md`, "Usage guards"); the weekly window resets on 2026-11-10 at 21:00 UTC.

Then read, in order: `CLAUDE.md`, `issues/57-debt/handoff.md` (Status, "Order of work", "Pending from the owner", "Notes"),
`issues/57-debt/plan.md` (Step D, Step E, Step E2, the steps table), `issues/57-debt/plan-views.md` (batch VW1). Merge `main`
into `claude/57-debt`.

Do: the "Order of work" of the handoff, from step 1: D (catalog data fixes), E (the share link and Windows), `readme-screens`
B1 (stop for the owner to look at the screenshots before any image is committed), debt step 1 (tooling and CI, with eslint in
`check:fast`), VW1, debt steps 2 and 3 after one triage pass, the `persistent-storage` closeout audit, the `ai-mcp` plan (ask
the owner the product-law question first), the read-only branch inventory (delete nothing without the owner's yes). Ask the
owner the "Pending" items at the start; do not block on them.

Rules: CI-first (check:fast, the golden re-seeds, the affected tests and BOTH lints, `npm run lint:typed` and
`npm run lint:untyped`, before every push); `VITEST_MAX_WORKERS=2`, one heavy command at a time, foreground, Bash timeout
600000; one writer per tree; no attribution line in a commit; stage files by name; never amend a pushed commit or
force-push. Stop and report only for: deleting a branch or a worktree, NEEDS_HUMAN_CONFIRMATION: yes, a fable dispatch, an
effort exception, a gate still red after the one fix cycle, a replan, a product-law change (the print card stays 63x88 mm).
