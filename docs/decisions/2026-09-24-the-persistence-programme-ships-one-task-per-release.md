# 2026-09-24 - The persistence programme ships one task per release

- Task: `persistent-storage` (owner decision, 2026-09-24).
- Decision: every deployable sub-feature of the persistence work (auth,
  lists, Realtime, migration, import/export, homebrew, media, item share,
  legacy removal) is its own task, `persist-<n>-<name>`, under the standing
  law unchanged: first batch commits, later batches amend, closeout deletes
  the task directory and pushes once; the push to `main` deploys. The
  programme roadmap stays a task document of `persistent-storage` until the
  last release ships. Migrations are pushed by the owner from the CLI before the
  release push.
- Rejected: one task with one commit per phase and owner-called pushes -
  lawful, but one directory and one growing commit message for months; one
  task per batch - a batch is not a deployable feature; a CI job with
  production database credentials and a protected environment - a new
  class of secret and failure for a personal tool.
