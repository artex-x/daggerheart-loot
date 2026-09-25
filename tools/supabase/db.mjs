/*
  The one module of the release tools that opens a database connection.
  migrate-test.mjs applies the test project's pending migrations with it,
  pending-check.mjs reads production's history, and
  tests/db/apply-pending.test.mjs proves applyPending on the local stack.
  Why CI does not run `supabase db push` for the test project:
  docs/DECISIONS.md, 2026-09-25, "CI applies the test project's migrations
  file by file and ignores other branches' versions".
*/
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { migrationVersion, pendingMigrations } from './lib.mjs';

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);

/** Returns a one-connection client for `url`. The local stack serves no
 * TLS; a hosted project always does. `prepare: false` keeps the session
 * pooler from seeing named statements. */
export function connect(url) {
  const ssl = LOCAL_HOSTS.has(new URL(url).hostname) ? false : 'require';
  return postgres(url, { ssl, max: 1, prepare: false, onnotice: () => {} });
}

/** Returns the versions in supabase_migrations.schema_migrations, or `null`
 * when the table is absent (the project never received a migration). */
export async function appliedVersions(sql) {
  try {
    const rows = await sql`select version from supabase_migrations.schema_migrations`;
    return rows.map((row) => row.version);
  } catch (err) {
    if (err.code === '42P01') return null;
    throw err;
  }
}

/** Applies every migration in `dir` whose version the history lacks,
 * oldest first, each in its own transaction with its history row, so a
 * failed file leaves neither objects nor a row. Returns `{ applied, foreign
 * }`: the file names applied, and the history versions that no file in
 * `dir` names (another branch's migrations), which are listed, never an
 * error. Throws, naming the file, on the first file that fails. */
export async function applyPending(sql, dir, log = () => {}) {
  const history = await appliedVersions(sql);
  if (history === null) {
    throw new Error(
      "the project has no migration history; run the CLI's `db push` once to create it"
    );
  }
  const local = readdirSync(dir).filter((n) => n.endsWith('.sql'));
  const localVersions = new Set(local.map(migrationVersion));
  const foreign = history.filter((v) => !localVersions.has(v)).sort();
  const applied = [];
  for (const file of pendingMigrations(local, history)) {
    const version = migrationVersion(file);
    if (version === null) {
      throw new Error(`${file}: the name does not match <14 digits>_<snake_case>.sql`);
    }
    // The CLI records the name without the 14-digit stamp, its `_` and `.sql`.
    const name = file.slice(15, -'.sql'.length);
    const text = readFileSync(path.join(dir, file), 'utf8');
    try {
      await sql.begin(async (tx) => {
        await tx.unsafe(text);
        await tx`insert into supabase_migrations.schema_migrations (version, name)
          values (${version}, ${name})`;
      });
    } catch (err) {
      throw new Error(`${file} failed and was rolled back: ${err.message}`, { cause: err });
    }
    applied.push(file);
    log(file);
  }
  return { applied, foreign };
}
