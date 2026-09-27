/*
  The nightly usage report's database half (tools/supabase/usage.mjs):
  collect() on seeded rows relative to a baseline (the host volume can hold
  committed Auth rows), the Storage branch this stack has, the near-limit
  counts with the part above 100 %, the one-row-a-day upsert and the
  400-day delete, the 28-day history before today, the realtime.messages
  rows of the last 24 hours, and no Data API role on
  public.usage_snapshots. .claude/README.md, "Usage monitoring".
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asRole, connect, realtimePartition } from './roles.mjs';
import { collect, readHistory, saveSnapshot } from '../../tools/supabase/usage.mjs';
import { mauPlan, monthStart } from '../../tools/supabase/usage-lib.mjs';

const A = '00000000-0000-4000-8000-0000000000a1';
const B = '00000000-0000-4000-8000-0000000000b2';
const DAY_MS = 86_400_000;
const PRIVS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'];
const PUBLIC_TABLES = [
  'limit_defaults',
  'list_entries',
  'list_shares',
  'lists',
  'purchase_request_lines',
  'purchase_requests',
  'usage_snapshots',
  'user_limit_overrides',
  'user_prefs'
];
const TODAY = '2030-01-15';
const dayBefore = (n) =>
  new Date(Date.parse(`${TODAY}T00:00:00Z`) - n * DAY_MS).toISOString().slice(0, 10);

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

/* Runs `fn(tx)` as the connection's own role and rolls it back. */
async function rolledBack(fn) {
  const rollback = new Error('rollback');
  let result;
  await assert.rejects(
    sql.begin(async (tx) => {
      result = await fn(tx);
      throw rollback;
    }),
    (err) => err === rollback
  );
  return result;
}

async function planOf(tx) {
  const rows = await tx`
    select table_schema || '.' || table_name || '.' || column_name as name
    from information_schema.columns
    where table_schema = 'auth' and table_name in ('users', 'sessions')`;
  return mauPlan(rows.map((r) => r.name));
}

const rowsOf = (m) => Object.fromEntries(m.tables.map((t) => [t.name, t.rows]));

describe('collect()', () => {
  it('reads the sizes, every public table and the MAU estimate over a baseline', async () => {
    const now = new Date();
    const start = monthStart(now);
    const { base, next, plan } = await rolledBack(async (tx) => {
      const base = await collect(tx, now);
      const plan = await planOf(tx);
      if (plan.users) {
        await tx`insert into auth.users (id, email, last_sign_in_at) values
          (${A}, 'usage-a@example.test', ${start}),
          (${B}, 'usage-b@example.test', ${new Date(start.getTime() - DAY_MS)})`;
      } else {
        await tx`insert into auth.users (id, email) values
          (${A}, 'usage-a@example.test'), (${B}, 'usage-b@example.test')`;
      }
      await tx`insert into public.lists (id, owner_id)
        select gen_random_uuid(), ${A} from generate_series(1, 3)`;
      const [{ id }] = await tx`select id from public.lists where owner_id = ${A} limit 1`;
      await tx`insert into public.list_entries (id, list_id, item_key, position)
        select gen_random_uuid(), ${id}, 'k' || g, g from generate_series(1, 2) as g`;
      return { base, next: await collect(tx, now), plan };
    });
    assert.ok(next.db_bytes > 0);
    assert.equal(next.auth_users, base.auth_users + 2);
    assert.deepEqual(
      next.tables.map((t) => t.name),
      PUBLIC_TABLES
    );
    const was = rowsOf(base);
    const is = rowsOf(next);
    for (const name of PUBLIC_TABLES) {
      const seeded = { lists: 3, list_entries: 2 }[name] ?? 0;
      assert.equal(is[name], was[name] + seeded, name);
    }
    if (plan.users || plan.sessions) {
      assert.equal(next.mau, base.mau + (plan.users ? 1 : 0));
    } else {
      assert.equal(base.mau, null);
      assert.equal(next.mau, null);
    }
  });

  it('reads the Storage branch this stack has', async (t) => {
    const out = await rolledBack(async (tx) => {
      const [{ present }] =
        await tx`select to_regclass('storage.objects') is not null as present`;
      const base = await collect(tx, new Date());
      if (!present) return { present, base };
      let insertError = null;
      try {
        await tx.savepoint(async (sp) => {
          await sp`insert into storage.buckets (id, name) values ('usage-test', 'usage-test')`;
          await sp`insert into storage.objects (bucket_id, name, metadata)
            values ('usage-test', 'usage-test.bin', ${tx.json({ size: 1234 })}::jsonb)`;
        });
      } catch (err) {
        insertError = err.message;
      }
      const [direct] = await tx`
        select coalesce(sum((metadata->>'size')::bigint), 0)::bigint as bytes,
          count(*)::bigint as n from storage.objects`;
      return { present, base, next: await collect(tx, new Date()), insertError, direct };
    });
    if (!out.present) {
      assert.equal(out.base.storage_bytes, 0);
      assert.equal(out.base.storage_objects, 0);
      assert.equal(out.base.storage_note, 'no storage.objects');
      return;
    }
    if (out.insertError) {
      t.diagnostic(`storage.objects insert failed on this stack: ${out.insertError}`);
      assert.equal(out.next.storage_bytes, Number(out.direct.bytes));
      assert.equal(out.next.storage_objects, Number(out.direct.n));
      return;
    }
    assert.equal(out.next.storage_bytes, out.base.storage_bytes + 1234);
    assert.equal(out.next.storage_objects, out.base.storage_objects + 1);
  });

  it('counts the owners and lists near a limit, above 100 % too, and never a null limit', async () => {
    const out = await rolledBack(async (tx) => {
      await tx`insert into auth.users (id, email) values
        (${A}, 'usage-a@example.test'), (${B}, 'usage-b@example.test')`;
      const near = async () => (await collect(tx, new Date())).near_limits;
      const base = await near();
      await tx`insert into public.lists (id, owner_id)
        select gen_random_uuid(), ${A} from generate_series(1, 40)`;
      const [{ id }] = await tx`select id from public.lists where owner_id = ${A} limit 1`;
      await tx`insert into public.list_entries (id, list_id, item_key, position)
        select gen_random_uuid(), ${id}, 'k' || g, g from generate_series(1, 80) as g`;
      const at80 = await near();
      // Set after the inserts: the limit triggers refuse them otherwise.
      await tx`insert into public.user_limit_overrides (user_id, key, value)
        values (${A}, 'lists_per_owner', 10), (${A}, 'entries_per_list', 50)`;
      const above = await near();
      await tx`insert into public.user_limit_overrides (user_id, key, value)
        values (${B}, 'lists_per_owner', null)`;
      await tx`insert into public.lists (id, owner_id)
        select gen_random_uuid(), ${B} from generate_series(1, 60)`;
      const unlimited = await near();
      return { base, at80, above, unlimited };
    });
    const plus = (a, b) =>
      Object.fromEntries(Object.keys(a).map((k) => [k, a[k] + (b[k] ?? 0)]));
    assert.deepEqual(out.at80, plus(out.base, { owners_near: 1, lists_near: 1 }));
    assert.deepEqual(
      out.above,
      plus(out.base, { owners_near: 1, owners_over: 1, lists_near: 1, lists_over: 1 })
    );
    assert.deepEqual(out.unlimited, out.above);
  });

  it('counts the realtime.messages rows of the last 24 hours over a baseline', async () => {
    await realtimePartition(sql);
    const out = await rolledBack(async (tx) => {
      const base = await collect(tx, new Date());
      await tx`select realtime.send(${tx.json({ revision: 1 })}::jsonb, 'revision',
        ${'share:' + crypto.randomUUID()}, true)`;
      return { base, next: await collect(tx, new Date()) };
    });
    assert.equal(typeof out.base.realtime_rows_24h, 'number');
    assert.equal(out.next.realtime_rows_24h, out.base.realtime_rows_24h + 1);
  });

  it('runs in a read only transaction, as the nightly report does', async () => {
    const m = await sql.begin('read only', (tx) => collect(tx, new Date()));
    assert.ok(m.db_bytes > 0);
  });
});

describe('the snapshot history', () => {
  it('keeps one row a day and deletes the rows older than 400 days', async () => {
    const out = await rolledBack(async (tx) => {
      await saveSnapshot(tx, TODAY, { run: 1 });
      await saveSnapshot(tx, TODAY, { run: 2 });
      const same =
        await tx`select metrics from public.usage_snapshots where taken_on = ${TODAY}`;
      await tx`insert into public.usage_snapshots (taken_on, metrics) values
        (${dayBefore(401)}, '{}'), (${dayBefore(400)}, '{}'), (${dayBefore(399)}, '{}')`;
      await saveSnapshot(tx, TODAY, { run: 3 });
      const days = await tx`select taken_on::text as d from public.usage_snapshots order by 1`;
      return { same: same.map((r) => r.metrics), days: days.map((r) => r.d) };
    });
    assert.deepEqual(out.same, [{ run: 2 }]);
    assert.deepEqual(out.days, [dayBefore(400), dayBefore(399), TODAY]);
  });

  it('reads the 28 days before today, oldest first, without today', async () => {
    const history = await rolledBack(async (tx) => {
      await tx`insert into public.usage_snapshots (taken_on, metrics) values
        (${TODAY}, '{"d": 0}'), (${dayBefore(1)}, '{"d": 1}'),
        (${dayBefore(29)}, '{"d": 29}'), (${dayBefore(28)}, '{"d": 28}')`;
      return readHistory(tx, TODAY);
    });
    assert.deepEqual(history, [
      { taken_on: dayBefore(28), metrics: { d: 28 } },
      { taken_on: dayBefore(1), metrics: { d: 1 } }
    ]);
  });

  it('grants no Data API role anything, with row level security on', async () => {
    const rows = await sql`
      select r.role, p.priv
      from unnest(array['anon', 'authenticated', 'service_role']) as r(role)
      cross join unnest(${PRIVS}::text[]) as p(priv)
      where has_table_privilege(r.role, 'public.usage_snapshots'::regclass, p.priv)`;
    assert.deepEqual([...rows], []);
    const [r] =
      await sql`select relrowsecurity from pg_class where oid = 'public.usage_snapshots'::regclass`;
    assert.equal(r.relrowsecurity, true);
    await assert.rejects(
      asRole(
        sql,
        { role: 'authenticated', sub: A },
        (tx) => tx`select * from public.usage_snapshots`
      ),
      /permission denied/
    );
  });
});
