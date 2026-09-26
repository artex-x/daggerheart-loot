# 2026-09-25 - The usage history is a table in production that the nightly report writes

- Task: `persist-usage-monitoring` (R11; planner, 2026-09-25).
- Decision: `public.usage_snapshots (taken_on date primary key, taken_at,
  metrics jsonb)`, RLS on, no grant to `anon` or `authenticated`. The
  nightly report upserts one row a day and deletes rows older than 400
  days; the forecast reads the last 28. The nightly `auth,public` dump
  backs it up. It holds aggregate numbers only.
- Rejected: a workflow artifact (90 days at most, each run must fetch the
  last one's, and a public repository's artifacts are public); the Actions
  cache (eviction resets the forecast without a sign); a file committed
  each night (`contents: write` for a job that holds the production
  secret, and a push to `main` that races the owner's).
