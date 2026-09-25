/*
  SUPABASE_DB_URL=<production's connection string> node tools/supabase/pending-check.mjs

  Exits 1 and names every file in supabase/migrations/ whose version the
  database's supabase_migrations.schema_migrations does not hold. The CI
  `migrate-prod` job runs it against production on the owner's `skip_e2e`
  dispatch, so a dispatch that skips the test project cannot ship an
  unapplied migration. Refuses any connection string that is not
  production's. Procedure: .claude/README.md, "Supabase configuration".
*/
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appliedVersions, connect } from './db.mjs';
import { dbUrlProject, pendingMigrations } from './lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

async function main() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error('pending-check: SUPABASE_DB_URL is not set');
    return 1;
  }
  if (dbUrlProject(url) !== 'prod') {
    console.error(
      'pending-check: SUPABASE_DB_URL is not the production project (the session pooler form with the user postgres.<prod ref>, no query string)'
    );
    return 1;
  }
  const dir = path.join(ROOT, 'supabase', 'migrations');
  const local = existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.sql')) : [];
  const sql = connect(url);
  let applied;
  try {
    // A project that never received a push has no history table.
    applied = (await appliedVersions(sql)) ?? [];
  } finally {
    await sql.end();
  }
  const pending = pendingMigrations(local, applied);
  if (!pending.length) {
    console.log(`pending-check: none pending (${applied.length} applied)`);
    return 0;
  }
  console.error(
    `pending-check: ${pending.length} migration(s) production has not received:\n  ${pending.join('\n  ')}\nDispatch the check workflow without skip_e2e, or wait for the test project.`
  );
  return 1;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    console.error(`pending-check: ${err.message}`);
    process.exitCode = 1;
  }
);
