# 2026-09-27 - An agent pushes migrations to the test project only after an approving review

- Task: `process-guards` (owner's rule, 2026-09-26; mechanism by the planner, 2026-09-27).
- Decision: `bash-guard.mjs` denies an agent's migration write to the test
  project (`db:push --project test`, a `db-push.mjs` run, `supabase db
  push` or `migration up` with the test target, and a cloud session's push
  that changes `supabase/migrations/`) unless a report under
  `issues/*/reviews/` reads `Verdict: approve` and its `Reviewed:` commit
  has the same migrations tree as `HEAD`, with none uncommitted. A schema
  batch runs its push and `npm run e2e` after the approve.
- Rejected: a check inside `db-push.mjs` (a direct `supabase db push`
  bypasses it); a marker file the orchestrator writes (a second record to
  keep in step with the report).
- Amends "Agents may write to the test project; production is CI's or the owner's" (2026-09-25): a migration write waits for an approving review.
