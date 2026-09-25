# 2026-09-25 - Agents may write to the test project; production is CI's or the owner's

- Task: `persist-1-auth` (owner, 2026-09-25).
- Decision: `bash-guard.mjs` rule 2n allows a `db`, `migration` or
  `config push` command whose target is provably the test project (a
  `--project-ref` equal to the test ref, a `--db-url` that carries it, or
  a wrapper with `--project test`) and denies production, `--linked` and
  every target the command does not name; `link`, `login`, `secrets`,
  `functions deploy` and `storage` stay denied. `npm run db:push --
  --project test --yes` runs without a terminal and reads the password
  from `SUPABASE_DB_PASSWORD_TEST` (a cloud variable, test only);
  `--project prod` keeps the typed `yes`, the fallback behind `migrate-prod`.
  No production secret enters a cloud environment.
- Rejected: "agents never write to a hosted project" as written (the
  owner's words supersede it); `--linked` as proof of the target (state
  outside the command); a `--yes` for production (the pipeline or a typed
  yes there, by the owner's words).
