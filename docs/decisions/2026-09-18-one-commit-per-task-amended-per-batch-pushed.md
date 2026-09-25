# 2026-09-18 - One commit per task, amended per batch, pushed once at closeout

- Task: `workflow-hygiene` (human decision).
- Decision: a task's first batch runs `git commit`; every later batch and
  the closeout amend it (`git commit --amend`, message rewritten to cover
  the whole task so far); the commit gate (rule 2e) runs on each amend. The
  branch is pushed once, at closeout, after the task directory is deleted;
  the amend window closes at that push. Never force-push, in any form.
- Rejected: pushing at every batch's committed boundary (`CLAUDE.md`'s
  prior rule) - it produced many small commits per task, and a pushed
  commit cannot be amended without a force-push, so the two rules were
  incompatible as soon as amending was adopted.
- Evidence: the reviewer diffs a batch as `git diff <previous sha> HEAD`,
  both shas recorded in the handoff's Completed section.
- Supersedes "One commit per task, amend freely, push once - replaces the per-batch push rule" (2026-09-18).
