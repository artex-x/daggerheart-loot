# 2026-09-26 - Realtime public access is off; the owner sets it in the dashboard

- Task: `persist-3-realtime` (owner, Q2, 2026-09-26).
- Decision: "Allow public access" in the Realtime settings is off on the
  test and the production project, so every join must be private. The
  setting has no `config.toml` key; the owner sets it in the dashboard
  after the client release of `persist-3-realtime` is live and reads it
  back each release.
- Rejected: leaving it on (anyone who holds the publishable key can use
  the project's public channels as a relay and spend its message quota).
- Amends "Supabase configuration is code; the dashboard is read-only; no Branching" (2026-09-24): one named dashboard setting, read back each release.
