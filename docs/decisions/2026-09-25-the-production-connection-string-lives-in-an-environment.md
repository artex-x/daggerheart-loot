# 2026-09-25 - The production connection string lives in an Environment limited to `main`

- Task: `persist-2-lists` (owner, 2026-09-25, reversing the owner's earlier
  answer that kept the secret without an Environment).
- Decision: a GitHub Environment `production` with the deployment branch
  rule `main` only and no required reviewers holds `SUPABASE_DB_URL_PROD`
  as an environment secret; the repository secret of that name is deleted
  after the first green `main` run. `ci.yml` moves `pending-check` and
  `migrate-prod` into a job `migrate-prod` (`environment: production`, the
  same `needs` and `if` as `deploy`, which then needs it - `deploy` holds
  `environment: github-pages` and a job has one environment); `backup.yml`'s
  `dump` job declares `environment: production`. Reason: a workflow file
  edited on any branch used to run with the repository secret and could read
  the production string; R2 puts the first user rows behind it.
  `SUPABASE_DB_URL_TEST` stays a repository secret (branch runs need it).
- Rejected: required reviewers (an approval gate stalls nightly backups and
  every deploy; the backup is the recovery); keeping both steps inside
  `deploy` (one environment per job); a second environment for the backup.
