/*
  Layer 3 helpers for tests/db/*.test.mjs. A test acts as a Data API role
  by `set local role` plus `request.jwt.claims` inside a transaction that
  always rolls back, on a direct `postgres` connection: RLS reads
  auth.uid() from the claims either way, and nothing a test writes
  persists. `commitAs` commits instead, for a deferred trigger that fires
  only at commit; its caller deletes what it wrote. See
  docs/specs/COVERAGE.md, "Suites".
*/
import { spawnSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
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

/** Runs `fn(tx)` as `role` with the JWT claims `{ role, sub }` in a
 * transaction that commits when `fn` returns. Returns what `fn` returned. */
export async function commitAs(sql, { role, sub }, fn) {
  if (!ROLES.has(role)) throw new Error(`The role "${role}" is not anon or authenticated.`);
  const claims = JSON.stringify(sub ? { role, sub } : { role });
  return sql.begin(async (tx) => {
    await tx.unsafe(`set local role ${role}`);
    await tx`select set_config('request.jwt.claims', ${claims}, true)`;
    return fn(tx);
  });
}

/** Returns an HS256 access token for the local stack: the claims `role`,
 * `sub` and `aud` of a user (only `role` for anon) and `exp` one hour
 * ahead, which Realtime checks. The secret is DHLOOT_JWT_SECRET. */
export function jwtFor(role, sub) {
  const secret = process.env.DHLOOT_JWT_SECRET;
  if (!secret) {
    throw new Error('DHLOOT_JWT_SECRET is not set. Run the suite through `npm run check:db`.');
  }
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const head = b64({ alg: 'HS256', typ: 'JWT' });
  const body = b64(sub ? { role, sub, aud: 'authenticated', exp } : { role, exp });
  const sig = createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}

/** Returns this project's policies on realtime.messages (the `dhloot_`
 * ones) as sorted text: the snapshot of the public schema does not hold
 * them. */
export async function realtimePolicies(sql) {
  const rows = await sql`
    select policyname, cmd, roles::text as roles, coalesce(qual, '') as qual,
      coalesce(with_check, '') as with_check
    from pg_policies
    where schemaname = 'realtime' and tablename = 'messages'
      and starts_with(policyname, 'dhloot_')
    order by policyname`;
  return rows
    .map((r) => `${r.policyname} ${r.cmd} ${r.roles} using (${r.qual}) check (${r.with_check})`)
    .join('\n');
}

/** Waits at most `ms` for the partition of realtime.messages that holds
 * the current time. Realtime makes the partitions when it starts, and the
 * CLI restarts it after every reset; `realtime.send` into a missing one
 * only warns. Throws when the time runs out. */
export async function realtimePartition(sql, ms = 60000) {
  const until = Date.now() + ms;
  for (;;) {
    const [{ ok }] = await sql`
      select exists (
        select 1 from pg_inherits i join pg_class c on c.oid = i.inhrelid
        where i.inhparent = 'realtime.messages'::regclass
          and c.relname = 'messages_' || to_char(now() at time zone 'utc', 'YYYY_MM_DD')
      ) as ok`;
    if (ok) return;
    if (Date.now() > until) {
      throw new Error(`Realtime made no partition of realtime.messages for today in ${ms} ms.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
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
