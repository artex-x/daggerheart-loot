# 2026-09-26 - The backup key lives in .env.restore.local so an agent runs the restore drill

- Task: `persist-restore-drill` (owner, 2026-09-26).
- Decision: the owner's `age` private key, the pair of `BACKUP_AGE_RECIPIENT`,
  lives permanently in the git-ignored `.env.restore.local` at the main
  checkout's root as `BACKUP_AGE_IDENTITY`. Only `npm run restore:drill`
  and the owner's `npm run restore:prod` read it; no agent opens the file, and no command prints the value. The
  privacy pages stay true: a backup stays encrypted everywhere but a local
  drill, which writes no plaintext file and removes the restored rows at
  the SQL level (a database reset). Freed Postgres pages and recycled WAL
  in the local Docker volume can still hold row bytes until overwritten;
  the drill does not scrub them.
- Rejected: a separate drill key added as a second `age` recipient (the
  orchestrator's recommendation; declined by the owner - one key to keep);
  the owner pasting the key for each drill (an agent cannot run the drill
  alone).
- Amends "Production is backed up nightly, encrypted to the owner's key, kept 30 days" (2026-09-25): the private key is also on the owner's disk.
