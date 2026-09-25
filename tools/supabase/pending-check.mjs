/*
  SUPABASE_DB_URL=<connection string> node tools/supabase/pending-check.mjs

  Exits 1 and names every file in supabase/migrations/ whose version the
  database's supabase_migrations.schema_migrations does not hold. The CI
  `deploy` job runs it against production on the owner's `skip_e2e`
  dispatch, so a dispatch that skips the test project cannot ship an
  unapplied migration. Procedure: .claude/README.md, "Supabase configuration".
*/
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { pendingMigrations } from './lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);

async function appliedVersions(url) {
  // The local stack serves no TLS; a hosted project always does.
  const ssl = LOCAL_HOSTS.has(new URL(url).hostname) ? false : 'require';
  const sql = postgres(url, { ssl, max: 1, prepare: false, onnotice: () => {} });
  try {
    const rows = await sql`select version from supabase_migrations.schema_migrations`;
    return rows.map((row) => row.version);
  } catch (err) {
    // A project that never received a push has no history table.
    if (err.code === '42P01') return [];
    throw err;
  } finally {
    await sql.end();
  }
}

async function main() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error('pending-check: SUPABASE_DB_URL is not set');
    return 1;
  }
  const dir = path.join(ROOT, 'supabase', 'migrations');
  const local = existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.sql')) : [];
  const applied = await appliedVersions(url);
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
