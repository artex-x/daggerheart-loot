# 2026-09-25 - Migrations deploy from CI as steps of `e2e` and `deploy`; the database is the applied record

- Task: `persist-1-auth` (owner, 2026-09-24; the shape: planner, 2026-09-25).
- Decision: the `e2e` job first runs `supabase db push --db-url` against
  the test project, and `deploy` runs it against production before its
  build - on a push to `main` or the owner's `skip_e2e` dispatch, which
  refuses when production lacks a migration (`pending-check.mjs`). Both
  connection strings are repository secrets, no Environment. The applied
  record is the database's `supabase_migrations.schema_migrations`:
  `applied.json` and `applied-check.mjs` are gone; `edit-guard.mjs` locks a
  migration that any remote-tracking ref holds (a pushed commit is never
  amended; CI applies what is pushed). `config:push` stays the owner's,
  `db:push` a manual path that records nothing.
- Rejected: separate `migrate-*` jobs (more job-level `if:`s on `deploy`'s
  needs, a second concurrency group for one database); an approval
  Environment (the backup is the recovery); a committed history snapshot
  (drifts as `applied.json` did); "every migration in HEAD" as the lock.
