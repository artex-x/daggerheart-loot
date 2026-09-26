# 2026-09-25 - Production's free-plan usage is reported nightly by its own workflow

- Task: `persist-usage-monitoring` (R11; planner, 2026-09-25, on the owner's request of the same day).
- Decision: `.github/workflows/usage.yml`, job `report`, runs at 03:47 UTC
  and on dispatch in the Environment `production`. It reads database size,
  per-table rows and bytes, Storage bytes, an MAU estimate and the users
  near their count limits over `SUPABASE_DB_URL_PROD`, and request counts
  per service from the Management API's `usage.api-counts` with a scoped
  read-only token (`SUPABASE_USAGE_TOKEN_PROD`). It forecasts days left,
  writes a summary table every night, warns at 50 % or under 60 days and
  fails at 80 % or under 14 days, so GitHub emails the owner.
- Rejected: a step in `backup.yml` (a usage alert would read as a failed
  backup, and a failed dump would skip the report); the Management API for
  every metric (no public endpoint returns billed egress, MAU, database or
  Storage size, 2026-09-25); Supabase's own quota emails and the dashboard
  alone (they arrive after a quota is passed).
