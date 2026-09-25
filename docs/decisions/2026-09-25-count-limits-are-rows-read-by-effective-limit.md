# 2026-09-25 - Count limits are rows read by `effective_limit()`, with per-user overrides

- Task: `persist-2-lists` (owner amendment, confirmed 2026-09-25).
- Decision: `limit_defaults(key, value)` holds every count limit (now
  `lists_per_owner` 50 and `entries_per_list` 100; later keys arrive with
  their triggers); `user_limit_overrides(user_id, key, value)` raises or
  lowers one user's limit - a missing row is the default, `null` no limit.
  `effective_limit(user, key)` raises for an unknown key, so a typo never
  reads as unlimited; every limit trigger calls it under a per-owner
  advisory lock. No grant to `anon` or `authenticated`. `npm run limits:set
  -- --project test|prod --user <email|uuid> --key <key> --value <n>|
  --default|--unlimited|--clear` edits one override over `SUPABASE_DB_URL`
  from the environment (checked against the project; production needs a
  terminal), never in CI or the cloud. R4's rate and expiry stay constants.
- Rejected: `user_limits` with a column per limit (a new limit is a schema
  change; a missing column reads as the default); constants in the triggers
  (no override); the secret key through PostgREST (a `service_role` grant).
