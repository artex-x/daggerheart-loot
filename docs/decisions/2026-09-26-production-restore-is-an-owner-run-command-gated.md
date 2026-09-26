# 2026-09-26 - Production restore is an owner-run command gated by a same-backup drill

- Task: `persist-restore-drill` (owner, 2026-09-26).
- Decision: `npm run restore:prod -- --backup <date|run id>` (or `--safety
  <stamp>`) refuses without a terminal and without a drill receipt of the
  same backup (hash, under 24 h, same newest migration and host). It asks
  for the connection string with echo off, takes an encrypted safety
  backup, shows production's rows against the backup's, wants the typed
  ref, then in one transaction empties `public`, deletes the dumped `auth`
  rows by key, loads the dump and never lowers a sequence. Rule 2n denies it.
- Rejected: an agent-run restore (the owner); runbook step 6 by hand only
  (no receipt, no safety backup); the string in `SUPABASE_DB_URL` (agents
  inherit it); loading `schema.sql` into a new project (migrations do).
- Consequences: Risk R2 - hosted `postgres` may be refused `SET
  session_replication_role`, an `auth` delete or the sequence read (`42501`):
  the load rolls back, no other role exists; the owner's first use measures it.
- Amends "The restore drill loads the newest backup into the local stack only" (2026-09-26): the drill also takes `--backup` or `--safety` and writes the receipt.
