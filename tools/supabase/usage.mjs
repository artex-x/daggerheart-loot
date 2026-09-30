/*
  SUPABASE_DB_URL=<the project's connection string> \
    node tools/supabase/usage.mjs --project test|prod

  The nightly free-plan usage report (.github/workflows/usage.yml): reads
  the sizes, the rows, an MAU estimate and the near-limit counts in one
  read-only transaction, the request counts through the Management API
  (SUPABASE_USAGE_TOKEN, optional), makes the keep-alive Data API call
  (SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY, optional), writes the summary,
  then stores today's snapshot. A fail row, a fatal token answer or a
  failed save exits 1 after the summary. .claude/README.md, "Usage monitoring".
*/
import { appendFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect } from './db.mjs';
import { dbUrlProject, parseProjectArg } from './lib.mjs';
import {
  KEEP_DAYS,
  WINDOW_DAYS,
  annotationsOf,
  dayOf,
  evaluate,
  exitCodeOf,
  fetchApiCounts,
  keepAlive,
  mauPlan,
  monthStart,
  renderSummary
} from './usage-lib.mjs';

const num = (v) => (v === null || v === undefined ? null : Number(v));

/* The MAU estimate: distinct users who signed in, or whose session was
   refreshed, since the month began (UTC); null without any source. */
async function readMau(db, now) {
  const columns = await db`
    select table_schema || '.' || table_name || '.' || column_name as name
    from information_schema.columns
    where table_schema = 'auth' and table_name in ('users', 'sessions')`;
  const plan = mauPlan(columns.map((r) => r.name));
  const sources = [];
  if (plan.users) sources.push('select id from auth.users where last_sign_in_at >= $1');
  // plan.sessions is one of two fixed column names, never input.
  if (plan.sessions) {
    sources.push(
      `select user_id from auth.sessions where coalesce(${plan.sessions}, created_at) >= $1`
    );
  }
  if (!sources.length) return null;
  const [{ n }] = await db.unsafe(
    `select count(distinct id)::int as n from (${sources.join(' union ')}) as s(id)`,
    [monthStart(now)]
  );
  return n;
}

/* Storage size and object count: 0 without storage.objects, null when the
   role may not read it (a 0 there would hide real files). */
async function readStorage(db) {
  const [s] = await db`
    select to_regclass('storage.objects') is not null as present,
      coalesce(has_table_privilege(to_regclass('storage.objects'), 'select'), false) as readable`;
  if (!s.present)
    return { storage_bytes: 0, storage_objects: 0, storage_note: 'no storage.objects' };
  if (!s.readable) {
    return {
      storage_bytes: null,
      storage_objects: null,
      storage_note: 'no storage.objects access'
    };
  }
  const [r] = await db`
    select coalesce(sum((metadata->>'size')::bigint), 0)::bigint as bytes, count(*)::bigint as n
    from storage.objects`;
  return { storage_bytes: num(r.bytes), storage_objects: num(r.n) };
}

/* The rows of realtime.messages inserted in the last 24 hours: 0 without
   the table, null when the role may not read it. */
async function readRealtime(db) {
  const [s] = await db`
    select to_regclass('realtime.messages') is not null as present,
      coalesce(has_table_privilege(to_regclass('realtime.messages'), 'select'), false) as readable`;
  if (!s.present) return { realtime_rows_24h: 0, realtime_note: 'no realtime.messages' };
  if (!s.readable) {
    return { realtime_rows_24h: null, realtime_note: 'no realtime.messages access' };
  }
  const [r] = await db`
    select count(*)::bigint as n from realtime.messages
    where inserted_at >= now() - interval '24 hours'`;
  return { realtime_rows_24h: num(r.n) };
}

/** Returns today's metrics from `db` (a connection or a transaction):
 * `db_bytes`, the Storage figures, `mau`, `auth_users`,
 * `realtime_rows_24h`, `tables` (every
 * `public` table's exact rows and total bytes) and `near_limits`. Totals
 * only: no id, email or name leaves the database. */
export async function collect(db, now) {
  const [{ bytes }] =
    await db`select sum(pg_database_size(datname))::bigint as bytes from pg_database`;
  const [{ users }] = await db`select count(*)::bigint as users from auth.users`;
  const names =
    await db`select tablename from pg_tables where schemaname = 'public' order by 1`;
  const tables = [];
  for (const { tablename } of names) {
    const [t] = await db`
      select (select count(*) from ${db('public')}.${db(tablename)})::bigint as n,
        pg_total_relation_size(c.oid)::bigint as size
      from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
      where ns.nspname = 'public' and c.relname = ${tablename}`;
    tables.push({ name: tablename, rows: num(t.n), bytes: num(t.size) });
  }
  // A null limit is no limit and never counts; move_legacy_list can pass a
  // limit (docs/specs/DEBT.md D62), so the part above 100 % is counted too.
  const [near] = await db`
    with per_owner as (
      select count(*) as n, public.effective_limit(owner_id, 'lists_per_owner') as lim
      from public.lists group by owner_id
    ), per_list as (
      select count(*) as n, public.effective_limit(l.owner_id, 'entries_per_list') as lim
      from public.list_entries e join public.lists l on l.id = e.list_id
      group by l.id, l.owner_id
    ), per_items as (
      select count(*) as n, public.effective_limit(owner_id, 'homebrew_items_per_owner') as lim
      from public.homebrew_items group by owner_id
    )
    select
      (select count(*) from per_owner where lim is not null and n >= 0.8 * lim)::int as owners_near,
      (select count(*) from per_owner where lim is not null and n > lim)::int as owners_over,
      (select count(*) from per_list where lim is not null and n >= 0.8 * lim)::int as lists_near,
      (select count(*) from per_list where lim is not null and n > lim)::int as lists_over,
      (select count(*) from per_items where lim is not null and n >= 0.8 * lim)::int as items_near,
      (select count(*) from per_items where lim is not null and n > lim)::int as items_over`;
  return {
    db_bytes: num(bytes),
    ...(await readStorage(db)),
    mau: await readMau(db, now),
    auth_users: num(users),
    ...(await readRealtime(db)),
    tables,
    near_limits: { ...near }
  };
}

/** Returns the snapshots of the last WINDOW_DAYS days before `today`
 * (`YYYY-MM-DD`), oldest first, as `[{ taken_on, metrics }]`; today's own
 * row is left out, so a same-day re-run gives no second point. */
export async function readHistory(db, today) {
  const rows = await db`
    select taken_on::text as taken_on, metrics from public.usage_snapshots
    where taken_on >= ${today}::date - ${WINDOW_DAYS}::int and taken_on < ${today}::date
    order by taken_on`;
  return rows.map((r) => ({ taken_on: r.taken_on, metrics: r.metrics }));
}

/** Upserts the row of `today` and deletes the rows older than KEEP_DAYS
 * days before the same `today` (never `current_date`). */
export async function saveSnapshot(db, today, metrics) {
  await db`
    insert into public.usage_snapshots (taken_on, taken_at, metrics)
    values (${today}::date, now(), ${db.json(metrics)}::jsonb)
    on conflict (taken_on) do update set taken_at = excluded.taken_at, metrics = excluded.metrics`;
  await db`delete from public.usage_snapshots where taken_on < ${today}::date - ${KEEP_DAYS}::int`;
}

function emit(text) {
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
  console.log(text);
}

async function main() {
  let args;
  try {
    args = parseProjectArg(process.argv.slice(2));
  } catch (err) {
    console.error(`usage: ${err.message}`);
    return 1;
  }
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error('usage: SUPABASE_DB_URL is not set');
    return 1;
  }
  if (dbUrlProject(url) !== args.project) {
    console.error(
      `usage: SUPABASE_DB_URL is not the ${args.project} project (the session pooler form with the user postgres.<ref>, no query string)`
    );
    return 1;
  }
  const token = process.env.SUPABASE_USAGE_TOKEN || null;
  const apiUrl = process.env.SUPABASE_URL || null;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || null;
  const now = new Date();
  const today = dayOf(now);
  const sql = connect(url);
  try {
    let snapshot;
    let history;
    await sql.begin('read only', async (tx) => {
      snapshot = await collect(tx, now);
      history = await readHistory(tx, today);
    });
    const requests = token
      ? await fetchApiCounts({ ref: args.ref, token, fetchImpl: globalThis.fetch })
      : undefined;
    const kept =
      apiUrl && key
        ? await keepAlive({ url: apiUrl, key, fetchImpl: globalThis.fetch })
        : undefined;
    const metrics = { ...snapshot, requests_24h: requests?.ok ? requests.counts : null };
    const rows = evaluate(metrics, history, today, { requests, keepAlive: kept });
    emit(
      renderSummary({
        today,
        rows,
        tables: snapshot.tables,
        nearLimits: snapshot.near_limits,
        points: history.length + 1
      })
    );
    for (const line of annotationsOf(rows)) console.log(line);
    let fatal = Boolean(requests && !requests.ok && requests.fatal);
    try {
      await sql.begin((tx) => saveSnapshot(tx, today, metrics));
    } catch (err) {
      const line = `usage: the snapshot was not saved: ${err.message}`;
      emit(line);
      console.log(`::error::${line}`);
      fatal = true;
    }
    return exitCodeOf(rows, fatal);
  } finally {
    await sql.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (err) => {
      console.error(err.message.startsWith('usage:') ? err.message : `usage: ${err.message}`);
      process.exitCode = 1;
    }
  );
}
