# 2026-09-25 - Production is backed up nightly, encrypted to the owner's key, kept 30 days

- Amended by "The free-tier keep-alive is the usage report's Data API call, not the dump" (2026-09-25): the keep-alive clause.
- Task: `persist-1-auth` (owner, 2026-09-24: `auth` rows, `17 3 * * *` UTC).
- Decision: `backup.yml` runs nightly and on dispatch: `supabase db dump`
  of the schema and of the `auth` and `public` data (`--schema auth,public`;
  the CLI excludes `auth` by default) with the production connection
  string, each file `age`-encrypted to the `BACKUP_AGE_RECIPIENT` variable
  and uploaded as a 30-day artifact; nothing unencrypted leaves the job,
  which fails closed without a recipient. The private key stays in the
  owner's password manager. The run is production's free-tier keep-alive.
  The privacy page says a backup keeps deleted data at most 30 days. The
  runbook (`.claude/README.md`, "Backups and restore") restores into the
  local stack, then the test project, then production.
- Rejected: a monthly manual dump (nobody remembers a schedule); an
  unencrypted artifact (a public repository's artifacts are public); roles
  in the dump (a new project has its own); a backup before the first
  production migration (production held no user table).
