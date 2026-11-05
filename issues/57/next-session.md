# Next session: start prompt for TASK 57 (AFK)

Paste the block below as the first message of the new orchestrator session.

```
You are the orchestrator. Follow .claude/prompts/orchestrate.prompt.md with TASK: 57 in the worktree
E:\dev\daggerheart-loot\.claude\worktrees\57, branch claude/57. GOAL: finish it, with the owner AFK for the whole
session: deliver wave 3 (CI fix pass, then batches TD, N, P, 10), the wave 3 blind review and its mitigation, the
closeout (squash onto main, deploy, merge back), then the whole-feature blind review and its mitigation.

First run `ListAgents` and `git rev-parse HEAD`. If a subagent of another session shows `running`, or HEAD is not
a descendant of 22d9a00b whose commits above it are only `docs(57)` commits, report both and end the turn. Then read, in
order: CLAUDE.md, issues/57/handoff.md (Status and "Next step" are the order of work), issues/57/context.md (items
7-15 and every ANSWER/APPROVED line are the owner's decisions of 2026-11-05; do not reopen them), issues/57/plan.md
Status, issues/57/reviews.md, and the plan file of the batch you dispatch (plan-ci.md, plan-T.md + plan-D.md +
plan-text.md, plan-N.md, plan-P.md). Agent ages are unknown, so every resume is a spawn.

Owner AFK rules: take the recommended option at every choice and log it in
C:\Users\Ignat\.dhloot\notes\owner-afk-2026-11-03\decisions.md (items 1-23 so far). Pushes, the squash onto main
and the closeout landing proceed without the owner after the green CI credit of the tip and the wave's review.
Stop and report only for: deleting a branch or a worktree, NEEDS_HUMAN_CONFIRMATION: yes, a fable dispatch, an
effort exception, a gate still red after the one remediation cycle, a replan from a second look, a product-law
change (the print card stays 63x88 mm). No commit message carries an attribution line. Stage files by name
(`git commit -am` is blocked). One writer at a time on the tree; planners write only issues/57/ plan files.
Reviewer dispatches name the guideline set: DESIGN.md (named rules and "Proposed rules"), the Impeccable
critique lens, the Clarity Rule, and the official sources in the guideline report
C:\Users\Ignat\.dhloot\notes\57\material-review.md (a reviewer may read it; the repo may not cite it).

Machine: the host is memory-starved when other apps run. Every vitest run uses VITEST_MAX_WORKERS=2, one heavy
command at a time, in the foreground with the Bash timeout 600000; browser suites and sweeps run on CI. CI jobs
now end in about 10-11 min (app/states runs as four rows). Read the usage at each wake (orchestrate.prompt.md,
"Usage guards") and create the usage tick when a subagent starts. At 50% context at a batch boundary, offer a
fresh session as the prompt says.
```
