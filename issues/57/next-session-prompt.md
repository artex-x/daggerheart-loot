You are the orchestrator. Follow .claude/prompts/orchestrate.prompt.md with TASK: 57 in the worktree
E:\dev\daggerheart-loot\.claude\worktrees\57, branch claude/57. GOAL: finish task 57. The owner restarted the laptop
and is present for the session (not AFK); ask only for the decisions in the handoff.

First run `ListAgents`, `git rev-parse HEAD` and `git status --short` in the worktree. Expected: HEAD is a descendant of
c035fc6a whose commits above it are docs(57) commits, and the worktree holds UNCOMMITTED batch PW3 work (about 47
paths). Do not run git clean, checkout, restore or stash there. If a subagent of another session is `running`, report
and end the turn. Check that nothing is in flight: `gh run list --branch main --limit 3` and `gh run list --branch
claude/57 --limit 3`; if a run is still in progress, `gh run watch <id> --exit-status` before any push.

Then read, in order: CLAUDE.md, issues/57/handoff.md (Status and "Next step, in order" are the order of work),
issues/57/context.md (the section "Owner decisions of the 2026-11-06 session" and every ANSWER/APPROVED line: settled),
issues/57/plan-pw3.md (part B is the batch, part C the whole-app review prompt additions), issues/57/reviews.md (open
rows), plan-debt.md. Agent ages are unknown, so every resume is a spawn.

Do: (1) dispatch a fresh implementer (opus) to finish batch PW3 from the uncommitted tree under the CI-first policy
(check:fast, golden re-seeds, affected vitest, push; CI and one fix pass find the rest); (2) CI credit, batch review,
one fix pass; (3) squash S2 onto main (the main checkout is on claude/roll-per-line: switch to main and back, it was
clean), deploy, merge back; (4) give the owner the short signed-in checklist for production (Claude in Chrome); (5) the
whole-app blind review with the part C additions and its remediation as S3; (6) closeout: Impeccable `document` for
.impeccable/design.json, move plan-debt.md to issues/57-debt/, delete issues/57/, last squash. No commit message carries
an attribution line. Stage files by name. One writer at a time on the tree. Every vitest run uses VITEST_MAX_WORKERS=2,
one heavy command at a time, foreground, Bash timeout 600000. Stop and report only for: deleting a branch or a
worktree (the remote branch deletion waits for the owner), NEEDS_HUMAN_CONFIRMATION: yes, a fable dispatch, an effort
exception, a gate still red after the one fix cycle, a replan, a product-law change (the print card stays 63x88 mm).
Read the usage at each wake (orchestrate.prompt.md, "Usage guards") and create the usage tick when a subagent starts.
