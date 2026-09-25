/*
  Layer 3 helpers for tests/db/*.test.mjs. A test acts as a Data API role
  by `set local role` plus `request.jwt.claims` inside a transaction that
  always rolls back, on a direct `postgres` connection: RLS reads
  auth.uid() from the claims either way, and nothing a test writes
  persists. See docs/specs/COVERAGE.md, "Suites".
*/
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { SUPABASE_CLI } from '../../tools/supabase/lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ROLES = new Set(['anon', 'authenticated']);

class Rollback extends Error {}

/** Returns a one-connection client for the database that run.mjs reset. */
export function connect() {
  const url = process.env.DHLOOT_DB_URL;
  if (!url)
    throw new Error('DHLOOT_DB_URL is not set. Run the suite through `npm run check:db`.');
  return postgres(url, { max: 1, onnotice: () => {} });
}

/** Runs `fn(tx)` as `role` with the JWT claims `{ role, sub }`, then rolls
 * the transaction back. `setup(tx)`, when given, runs first as the
 * connection's own role - rows the role itself may not write, such as
 * auth.users - and is rolled back with the rest. Returns what `fn`
 * returned; rethrows what it threw. */
export async function asRole(sql, { role, sub, setup }, fn) {
  if (!ROLES.has(role)) throw new Error(`The role "${role}" is not anon or authenticated.`);
  const claims = JSON.stringify(sub ? { role, sub } : { role });
  let result;
  try {
    await sql.begin(async (tx) => {
      if (setup) await setup(tx);
      await tx.unsafe(`set local role ${role}`);
      await tx`select set_config('request.jwt.claims', ${claims}, true)`;
      result = await fn(tx);
      throw new Rollback('rollback');
    });
  } catch (err) {
    if (!(err instanceof Rollback)) throw err;
  }
  return result;
}

/** Returns the schema-only dump of `schemas` from the local database, or
 * an empty string when none of them exists. */
export function snapshot(schemas) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'dhloot-dump-'));
  const file = path.join(dir, 'schema.sql');
  try {
    const r = spawnSync(
      process.execPath,
      [SUPABASE_CLI, 'db', 'dump', '--local', '--schema', schemas.join(','), '-f', file],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    // The CLI runs pg_dump with strict names, so an absent schema is an
    // error rather than an empty dump.
    if (r.status !== 0 && /no matching schemas were found/.test(r.stderr)) return '';
    if (r.error || r.status !== 0) {
      throw new Error(`supabase db dump failed (${r.status}): ${r.stderr}`);
    }
    return readFileSync(file, 'utf8');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Resets the local database to supabase/migrations/ - with `--version
 * <14 digits>`, only up to that migration. It drops every connection: end
 * yours before, connect again after. Throws on a non-zero exit. */
export function resetLocal(args = []) {
  const r = spawnSync(process.execPath, [SUPABASE_CLI, 'db', 'reset', '--local', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (r.error || r.status !== 0) {
    throw new Error(
      `supabase db reset --local ${args.join(' ')} failed (${r.status}): ${r.stderr}`
    );
  }
}

/** Runs a multi-statement SQL text as the connection's own role. */
export function applySql(sql, text) {
  return sql.unsafe(text);
}

/** Returns the lines only in `a` (`- `) and only in `b` (`+ `), at most
 * ten, ignoring blank lines. */
export function lineDiff(a, b) {
  const lines = (s) => s.split(/\r?\n/).filter((l) => l.trim());
  const inA = lines(a);
  const inB = lines(b);
  const setA = new Set(inA);
  const setB = new Set(inB);
  const out = [
    ...inA.filter((l) => !setB.has(l)).map((l) => `- ${l}`),
    ...inB.filter((l) => !setA.has(l)).map((l) => `+ ${l}`)
  ];
  return out.slice(0, 10);
}
