# 2026-09-25 - Migrations deploy from CI as steps of `e2e` and `deploy`; the database is the applied record

- Amended 2026-09-25: the test project by "CI applies the test project's
  migrations file by file ...", the secret and the job by "The production
  connection string lives in an Environment limited to `main`".
- Task: `persist-1-auth` (owner, 2026-09-24; the shape: planner, 2026-09-25).
- Decision: the `e2e` job first runs `supabase db push --db-url` against
  the test project, and `deploy` runs it against production before its
  build - on a push to `main` or the owner's `skip_e2e` dispatch, which
  refuses when production lacks a migration (`pending-check.mjs`). Both
  strings are repository secrets. The applied record is the database's
  `supabase_migrations.schema_migrations`: `applied.json` is gone;
  `edit-guard.mjs` locks a migration that any remote-tracking ref holds.
  `config:push` stays the owner's, `db:push` a manual path.
- Rejected: separate `migrate-*` jobs and an approval Environment (both
  amended, above); a committed history snapshot (drifts as `applied.json`
  did); "every migration in HEAD" as the lock.
