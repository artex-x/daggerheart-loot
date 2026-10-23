# 2026-10-22 - A task branch takes main by a merge, never a rebase

- Task: `persist-review` (owner, decision 45, "45 global", 2026-10-22).
- Decision: every branch merges the latest `origin/main` before each push (a merge commit),
  and also when a squash onto `main` refuses: the merged tip is pushed, gets its green CI run
  and credit, and is squashed again (`.claude/prompts/implement.prompt.md` step 12,
  `orchestrate.prompt.md`, "Task closeout and cleanup", step 8).
- Rejected: a rebase onto `main` (it rewrites pushed commits and needs a force-push, which
  `CLAUDE.md` and every guard forbid).
- Amends "The orchestrator merges a release branch onto `main`; the owner keeps the dashboard steps" (2026-09-25): no rebase fallback; a refused squash is answered by a merge of `origin/main`.
