# Shared task context - TASK persist-usage-monitoring

Release R11 on the roadmap (`issues/persistent-storage/plan.md`, section 9),
placed directly after R5. The working id stays the task id: the directory
already exists, and the roadmap row names it.

## Goal
Monitor the Supabase free-plan usage of production and warn the owner
before a limit is reached or when growth forecasts a limit too soon, so
the owner can tune limits (`limits:set`, per user or the default).

## Owner request (2026-09-25; also in `issues/persistent-storage/context.md`, last section)
- Track everything important: database size, row counts per table, file
  storage (from R8 homebrew art), egress, monthly active users; forecast
  days left from recent growth.
- Alert: warn in the job summary (e.g. 50% of a limit or under 60 days
  left); fail the job so GitHub emails the owner (e.g. 80% or under 14
  days). Thresholds are the planner's proposal for the owner to confirm.
- Orchestrator's proposal: a step in the nightly `backup.yml` job, which
  already holds `SUPABASE_DB_URL_PROD` through the GitHub Environment
  `production` (main only). Egress and users need the Supabase Management
  API with a personal access token as a new `production` environment
  secret (owner setup).
- Open fact to settle: a free project pauses after about a week without
  activity; is the nightly `pg_dump` activity enough? Settled below: not
  documented either way.

## Platform facts (read 2026-09-25; re-read only if a batch finds a contradiction)

Free-plan quotas, `https://supabase.com/pricing` and
`https://supabase.com/docs/guides/platform/billing-on-supabase`:

| Quota | Free plan |
|---|---|
| Database size | 500 MB per project; read-only mode above it |
| Egress | 5 GB uncached plus 5 GB cached, independent quotas |
| Monthly active users | 50,000 |
| File storage | 1 GB (744 GB-hours) |
| Max upload | 50 MB |
| Realtime | 200 peak connections, 2 million messages a month |
| Edge Function invocations | 500,000 |
| Pausing | "Free projects are paused after 1 week of inactivity" |
| Active free projects | 2 |

- Database size: `https://supabase.com/docs/guides/platform/database-size`
  measures it as `select sum(pg_database_size(datname)) from pg_database`
  (all databases of the cluster). Above 500 MB a free project goes
  read-only (`cannot execute INSERT in a read-only transaction`).
- Storage size: `https://supabase.com/docs/guides/platform/manage-your-usage/storage-size`
  sums `(metadata->>'size')` over `storage.objects`, per bucket.
- MAU: `https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users`
  - "distinct users who sign in or refresh their token during the billing
  cycle". No SQL or API is given; the dashboard's organization usage page is
  the only reader. Over quota on the free plan: an email and a grace period
  under the Fair Use Policy.
- Egress: `https://supabase.com/docs/guides/platform/manage-your-usage/egress`
  - all services count; the page names no API, only the dashboard.
- Pausing: `https://supabase.com/docs/guides/platform/free-project-pausing`
  - "inactive if it does not receive sufficient user database activity over
  the past week"; "a few user requests to the database each day over the
  previous week is enough"; a warning email about one week before the
  pause; a paused project restores from the dashboard for up to a year.
  Whether a `pg_dump` over the session pooler counts is not documented. A
  Supabase collaborator: "for sure REST API calls are counted"
  (`https://github.com/orgs/supabase/discussions/38442`, 2025-09-05).

Management API, from the OpenAPI document `https://api.supabase.com/api/v1-json`
(version 1.0.0, 115 paths, downloaded 2026-09-25), base
`https://api.supabase.com`, `Authorization: Bearer <token>`; rate limit 120
requests a minute, analytics 30 (`https://supabase.com/docs/reference/api/introduction`):

| Endpoint | OAuth scope in the spec | Use here |
|---|---|---|
| `GET /v1/projects/{ref}/analytics/endpoints/usage.api-counts?interval=1day` | none listed (bearer) | request counts per service: `result[]` of `{ timestamp, total_auth_requests, total_rest_requests, total_storage_requests, total_realtime_requests }` |
| `GET /v1/projects/{ref}/analytics/endpoints/logs` (`sql`, `iso_timestamp_start`, `iso_timestamp_end`) | `analytics:read` | not used in B11.1 (a bytes estimate would need an unverified log schema) |
| `POST /v1/projects/{ref}/database/query/read-only` (Beta) | `database:read` | not used: the Environment's connection string reads the same data |
| `GET /v1/projects/{ref}` | `projects:read` | not used: a paused project already fails the SQL step |

- The public API has **no** endpoint for billed egress, MAU, database size
  or storage size, and none for Realtime peak connections or messages
  (2026-09-25). The `interval` enum is `15min`..`7day`; its bucket width
  is not documented.
- Personal access tokens: `https://supabase.com/docs/guides/platform/personal-access-tokens`.
  A classic token carries the account's full access to every organization
  and project. A scoped token carries "only the organizations, projects,
  and permissions you choose", each Read or Read-write; the project
  permissions include "Usage Analytics" and "Logs". Created from the
  account's access tokens settings in the dashboard. The page names no
  mapping from a permission to an OAuth scope and no expiry choices.

GitHub:
- "Notifications for scheduled workflows are sent to the user who
  initially created the workflow", or the user who last changed its cron or
  re-enabled it
  (`https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs`).
- A public repository's run logs, job summaries and artifacts are readable
  by anyone (the reason `backup.yml` encrypts).
- A workflow file runs first on `main`: GitHub refuses to dispatch a file
  that is not on the default branch (`.claude/README.md`, "Backups and
  restore").

Repository facts:
- The production publishable key and URL are the Actions variables
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (`ci.yml`,
  deploy); they are public by design (the built bundle holds them).
- `public.get_shared_list(p_token text)` is the anon-callable RPC; a token
  that is not 43 characters of `[A-Za-z0-9_-]` returns before any table
  read (R2's `20260925130200_list_shares.sql`, uncommitted edits in the
  main tree on 2026-09-25 - re-read at implementation).
- `backup.yml`'s comment and the backup decision call the dump "the
  free-tier keep-alive"; the documentation does not support that claim.

## Sources
- `.github/workflows/backup.yml`, `.github/workflows/ci.yml`,
  `tools/supabase/` (`db.mjs`, `lib.mjs`, `limits.mjs`), `.claude/README.md`
  ("Backups and restore", "Supabase configuration"), `tests/derived.js`
  (it pins workflow facts), `docs/decisions/` (backup, Environment,
  limits decisions).

## Constraints
- Do not query production or the test project while planning. Reading
  files, git history and public documentation only.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
