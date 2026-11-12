# 2026-11-12 - ai-mcp lands on main in two squashes

- Task: `ai-mcp` (owner, 2026-11-10: "publish as soon as B1 ships"; planner, 2026-11-12).
- Decision: the first squash follows B1's approving batch review (`reviews/B1.md`) and a green CI run of the
  `claude/ai-mcp` tip that holds B0, B0's follow-up commit and B1, after the orchestrator confirms that
  `docs/rights/records.json` `reviewed` holds a date. It squash-merges the branch as one commit, and
  `issues/ai-mcp/` goes onto `main` with it, as in task 57. The orchestrator then merges `origin/main` into
  `claude/ai-mcp` with a merge commit, runs `check:fast` on it and pushes it; CI's green run of that tree gates B2.
  No force-push and no rebase. The second squash is the closeout after B5 and carries only the commits after the merge.
- Rejected: one squash at closeout (publication waits for B2-B5); a squash per batch; leaving the task directory out of the squash.
- Amends "A task branch pushes every batch; a green CI run of the same tree gates main" (2026-10-21): for ai-mcp, two squashes.
- Evidence: the precedent is "Task 57 lands on main in three waves" (2026-10-29).
