/*
  SUPABASE_DB_URL=<the test project's connection string> node tools/supabase/migrate-test.mjs

  CI's `migrate-test` step: applies every file in supabase/migrations/
  whose version the test project's history lacks, each in its own
  transaction, and lists the history versions no local file names (another
  branch's migrations) without failing on them. Refuses any connection
  string that is not the test project's. Why not `supabase db push`:
  docs/DECISIONS.md, 2026-09-25, "CI applies the test project's migrations
  file by file and ignores other branches' versions". Procedure:
  .claude/README.md, "Supabase configuration".
*/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyPending, connect } from './db.mjs';
import { dbUrlProject } from './lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

async function main() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error('migrate-test: SUPABASE_DB_URL is not set');
    return 1;
  }
  if (dbUrlProject(url) !== 'test') {
    console.error(
      'migrate-test: SUPABASE_DB_URL is not the test project (the session pooler form with the user postgres.<test ref>, no query string)'
    );
    return 1;
  }
  const sql = connect(url);
  try {
    const { applied, foreign } = await applyPending(
      sql,
      path.join(ROOT, 'supabase', 'migrations')
    );
    if (applied.length) {
      console.log(`migrate-test: applied ${applied.length}\n  ${applied.join('\n  ')}`);
    } else {
      console.log('migrate-test: none pending');
    }
    if (foreign.length) {
      console.log(
        `migrate-test: ${foreign.length} version(s) from other branches\n  ${foreign.join('\n  ')}`
      );
    }
    return 0;
  } finally {
    await sql.end();
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    console.error(`migrate-test: ${err.message}`);
    process.exitCode = 1;
  }
);
