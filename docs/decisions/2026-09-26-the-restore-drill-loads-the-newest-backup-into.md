# 2026-09-26 - The restore drill loads the newest backup into the local stack only

- Amended by "Production restore is an owner-run command gated by a same-backup drill" (2026-09-26): `--backup`, `--safety` and the receipt.
- Task: `persist-restore-drill` (owner, 2026-09-26: on demand, local only).
- Decision: `npm run restore:drill` downloads the newest `backup-<date>`
  artifact, decrypts it in memory with `age-encryption`, resets the local
  stack, empties `public`, loads `data.sql` through `psql` inside the
  database container in one transaction, compares the rows per table with
  the dump's, resets the local stack (SQL level only: freed pages and WAL
  in the Docker volume stay) and prints counts only. Steps 4-6 stay the owner's.
- Rejected: a schedule (the owner runs it on demand); the test project or
  production as a target (agents never load production rows there); a
  counts file from `backup.yml` (a production workflow change, a race with
  the dump, and no proof before a nightly on `main`); the `age` CLI (a host
  install on Windows); plaintext files in a temp directory (a killed run
  leaves them on disk); a committed ciphertext fixture with a test key
  (gitleaks flags the key; tests encrypt at run time instead).
