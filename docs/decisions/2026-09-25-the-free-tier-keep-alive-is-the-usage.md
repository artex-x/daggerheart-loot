# 2026-09-25 - The free-tier keep-alive is the usage report's Data API call, not the dump

- Task: `persist-usage-monitoring` (R11; planner, 2026-09-25).
- Decision: Supabase pauses a free project without "sufficient user
  database activity over the past week" and does not say whether a
  `pg_dump` counts; a Supabase collaborator confirmed that REST API calls
  do. So `usage.yml` makes one Data API call a night with the public
  publishable key (`rpc/get_shared_list` with a token that matches no
  share). Supabase's warning email a week before a pause stays the backstop.
- Rejected: the nightly dump alone (undocumented as activity); a `pg_cron`
  job inside the database (activity inside the database is undocumented
  too, and it runs even when nothing reads the result); a separate
  keep-alive workflow (one more schedule that GitHub disables after 60
  days without a push).
- Amends "Production is backed up nightly, encrypted to the owner's key, kept 30 days" (2026-09-25): the keep-alive clause.
