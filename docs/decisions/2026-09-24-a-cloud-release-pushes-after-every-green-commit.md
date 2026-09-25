# 2026-09-24 - A cloud release pushes after every green commit; the owner squash-merges it

- Task: `persist-1-auth` (owner confirmation, 2026-09-24, cloud session 2).
- Decision: a cloud session pushes its branch after every green commit (a
  reclaimed container loses what is not pushed) and never amends a pushed
  commit, so a cloud release is a branch of one commit per batch and a
  remediation after a push is its own commit. At closeout the owner
  cherry-picks any tooling commit the release carries on its own first, then
  squash-merges the branch onto `main` as the release's one commit (`git
  merge --squash`, authored `artex-x`), pushes `main` and deletes the
  branch. A local release still amends and pushes once. Rule 2o already
  allows exactly these pushes; no guard changes. Amended 2026-09-25: the
  orchestrator merges (entry of that date).
- Rejected: amend plus `--force-with-lease` (the law forbids every force
  shape); one push at closeout (a release longer than one session loses a
  batch); pushing "at session end" (no signal precedes an idle reclaim); N
  commits on `main` (a deploy's undo stops being one revert); the UI merge
  button (a merge commit); a fast-forward (`main` moves under bot commits).
- Supersedes "A cloud session runs a whole release on its own task branch" (2026-09-24).
