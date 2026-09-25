# 2026-09-25 - The orchestrator merges a release branch onto `main`; the owner keeps the dashboard steps

- Task: `persist-1-auth` (owner, 2026-09-25).
- Decision: at a release's closeout the orchestrator, on a host where the
  push rule allows it, squash-merges the release branch onto `main` as the
  release's one commit (question A's shape; the rebase fallback if the
  squash refuses; never a merge commit, never a force-push), pushes `main`,
  watches the run that deploys and deletes the branch; the agents also
  compact the programme roadmap in the closeout commit. The owner keeps
  what needs a terminal with secrets or a dashboard: `config:push`, the
  Security Advisor, the Data API check, the manual OAuth check, the restore
  drill's private key. Amends the 2026-09-24 entry "A cloud release pushes
  after every green commit; the owner squash-merges it": the merge is the
  orchestrator's now; the rest of that entry stands.
- Rejected: the owner merging (a manual step the pipeline does not need);
  the claude.ai/code merge button (a merge commit).
