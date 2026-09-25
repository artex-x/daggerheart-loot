# 2026-09-25 - CI applies the test project's migrations file by file and ignores other branches' versions

- Task: `persist-2-lists` (planner; owner confirmed 2026-09-25).
- Decision: the `e2e` job's `migrate-test` step runs
  `tools/supabase/migrate-test.mjs`, not `supabase db push`: it applies each
  local migration whose version `supabase_migrations.schema_migrations`
  lacks, in its own transaction with its history row, and lists, never fails
  on, a remote version no local file names (another branch's). Production
  keeps `db push` in the `migrate-prod` job, where only `main` pushes. The test project's
  schema is then the union of every pushed branch; an orphan (an abandoned
  or renamed branch migration) is the owner's manual cleanup, so a pushed
  migration is locked against edits, `git rm` and `git mv` after a fetch.
- Rejected: a `main`-only test apply (a branch's `e2e` runs on a lagging
  schema); `migration repair --status reverted` (history, not objects: the
  merge onto `main` fails instead); a repair running the reversal (the file
  is on the branch); a per-branch database (Branching rejected 2026-09-24,
  both free projects used); `--include-all`; a push guard (cannot fix).
