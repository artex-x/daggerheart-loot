/*
  The scheduled clean-up (public.lifecycle_cleanup(), which pg_cron runs
  hourly as dhloot-lifecycle): the job's row, each retention with a kept
  and a deleted case - requests whose expires_at has passed, decided or
  not, stopped share links over 30 days old with a newer row of their list
  and audience, notices read over an hour ago or unread and made over 30
  days ago, the job's own runs over 7 days old - the counts it answers, a
  second call that deletes nothing, no API role that may execute it, a send
  that no longer deletes, and the reversal that removes the job. Every seed,
  call and assertion runs in one transaction that rolls back, so the hourly
  job never sees a seed. docs/specs/META.md, section 3;
  docs/decisions/2026-10-07-lifecycle-data-is-deleted-by-the-database-on-a-schedule.md;
  docs/decisions/2026-10-07-a-lists-change-log-shares-the-requests-view-and-clean-up.md.
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { asRole, connect } from './roles.mjs';

const SUPABASE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'supabase'
);
const NAME = '20261007120000_lifecycle_cleanup.sql';
const A = '00000000-0000-4000-8000-0000000000c1';
const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const L1 = id(7001);
const L2 = id(7002);
const P_OLD = id(7101);
const P_MID = id(7102);
const P_NOW = id(7103);
const G_OLD = id(7104);
const Q_OLD = id(7105);
const TOKEN = 'L'.repeat(43);
const R = {
  decidedGone: id(7201),
  decidedLive: id(7202),
  expired: id(7203),
  expiredNow: id(7204),
  live: id(7205)
};
const N = {
  read61: id(7401),
  read59: id(7402),
  made31: id(7403),
  made29: id(7404)
};

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

/* A's list L1 with the entry ci1 and three player links - stopped 31 days
   ago, stopped 29 days ago, active - and a GM link stopped 31 days ago; A's
   list L2 with one player link stopped 31 days ago. */
async function shares(tx) {
  await tx`insert into auth.users (id) values (${A})`;
  await tx`insert into public.lists (id, owner_id) values (${L1}, ${A}), (${L2}, ${A})`;
  await tx`insert into public.list_entries (id, list_id, item_key, position)
    values (${id(7301)}, ${L1}, 'ci1', 0)`;
  await tx`insert into public.list_shares (id, list_id, audience, token, created_at, revoked_at) values
    (${P_OLD}, ${L1}, 'player', ${'a'.repeat(43)}, now() - interval '90 days', now() - interval '31 days'),
    (${P_MID}, ${L1}, 'player', ${'b'.repeat(43)}, now() - interval '40 days', now() - interval '29 days'),
    (${P_NOW}, ${L1}, 'player', ${TOKEN}, now() - interval '10 days', null),
    (${G_OLD}, ${L1}, 'gm', ${'c'.repeat(43)}, now() - interval '90 days', now() - interval '31 days'),
    (${Q_OLD}, ${L2}, 'player', ${'d'.repeat(43)}, now() - interval '60 days', now() - interval '31 days')`;
}

/* The shares, then five requests on the active link, each with one line:
   decided and expired a minute ago, decided and expiring in 59 minutes,
   pending and expired 25 hours and 1 minute ago, pending and live; then four
   notices on L1: read 61 and 59 minutes ago, unread and made 31 and 29 days
   ago. */
async function world(tx) {
  await shares(tx);
  const put = (rid, status, expiresIn, decidedAgo) =>
    tx`insert into public.purchase_requests
      (id, list_id, share_id, audience, status, created_at, expires_at, decided_at, read_at)
      values (${rid}, ${L1}, ${P_NOW}, 'player', ${status}, now() - interval '30 hours',
        now() + ${expiresIn}::interval, now() - ${decidedAgo}::interval,
        now() - interval '2 hours')`;
  await put(R.decidedGone, 'applied', '-1 minute', '1 hour 1 minute');
  await put(R.decidedLive, 'declined', '59 minutes', '1 minute');
  await put(R.expired, 'pending', '-25 hours', null);
  await put(R.expiredNow, 'pending', '-1 minute', null);
  await put(R.live, 'pending', '30 minutes', null);
  for (const rid of Object.values(R)) {
    await tx`insert into public.purchase_request_lines (request_id, item_key, quantity)
      values (${rid}, 'ci1', 1)`;
  }
  const note = (nid, key, readAgo, madeAgo) =>
    tx`insert into public.list_notices (id, list_id, item_key, kind, name, created_at, read_at)
      values (${nid}, ${L1}, ${key}, 'changed', ${tx.json({ en: 'x', ru: 'x' })},
        now() - ${madeAgo}::interval, now() - ${readAgo}::interval)`;
  await note(N.read61, 'hb_readsixtyoneaaaa', '61 minutes', '2 days');
  await note(N.read59, 'hb_readfiftynineaaa', '59 minutes', '2 days');
  await note(N.made31, 'hb_madethirtyoneaaa', null, '31 days');
  await note(N.made29, 'hb_madetwentynineaa', null, '29 days');
}

const cleanup = async (tx) => {
  const [{ v }] = await tx`select public.lifecycle_cleanup() as v`;
  return v;
};
const count = async (tx, table) => {
  const [{ n }] = await tx`select count(*)::int as n from ${tx(table)}`;
  return n;
};
const ids = async (tx, table, among) => {
  const rows =
    await tx`select id from ${tx(table)} where id = any(${among}::uuid[]) order by id`;
  return rows.map((r) => r.id);
};

describe('the job', () => {
  it('runs public.lifecycle_cleanup() at minute 7 of every hour as postgres', async () => {
    const rows = await sql`select schedule, command, username, active from cron.job
      where jobname = 'dhloot-lifecycle'`;
    assert.deepEqual(
      [...rows],
      [
        {
          schedule: '7 * * * *',
          command: 'select public.lifecycle_cleanup()',
          username: 'postgres',
          active: true
        }
      ]
    );
  });

  it('is gone after the reversal and back after the migration', async () => {
    const out = await rolledBack(async (tx) => {
      await tx.unsafe(readFileSync(path.join(SUPABASE, 'reversals', NAME), 'utf8'));
      const [gone] = await tx`select to_regclass('cron.job') is null as cron,
        to_regprocedure('public.lifecycle_cleanup()') is null as fn`;
      await tx.unsafe(readFileSync(path.join(SUPABASE, 'migrations', NAME), 'utf8'));
      const back = await tx`select jobname from cron.job where jobname = 'dhloot-lifecycle'`;
      return { gone, back: back.length };
    });
    assert.deepEqual(out, { gone: { cron: true, fn: true }, back: 1 });
  });
});

describe('the retentions', () => {
  it('deletes the requests whose expiry has passed, decided or not, with their lines, and keeps the rest', async () => {
    const out = await rolledBack(async (tx) => {
      await world(tx);
      const before = await count(tx, 'purchase_requests');
      const v = await cleanup(tx);
      const lines = await tx`select request_id from public.purchase_request_lines
        where request_id = any(${Object.values(R)}::uuid[]) order by request_id`;
      return {
        v,
        gone: before - (await count(tx, 'purchase_requests')),
        kept: await ids(tx, 'purchase_requests', Object.values(R)),
        lines: lines.map((r) => r.request_id)
      };
    });
    const kept = [R.decidedLive, R.live].sort();
    assert.deepEqual(out.kept, kept);
    assert.deepEqual(out.lines, kept);
    assert.equal(out.v.requests, out.gone);
    assert.ok(out.gone >= 3);
  });

  it('deletes a notice an hour after its read, or 30 days after it was made while unread', async () => {
    const out = await rolledBack(async (tx) => {
      await world(tx);
      const before = await count(tx, 'list_notices');
      const v = await cleanup(tx);
      return {
        v,
        gone: before - (await count(tx, 'list_notices')),
        kept: await ids(tx, 'list_notices', Object.values(N))
      };
    });
    assert.deepEqual(out.kept, [N.read59, N.made29].sort());
    assert.equal(out.v.notices, out.gone);
    assert.ok(out.gone >= 2);
  });

  it('deletes a link stopped over 30 days ago only when its list and audience have a newer row', async () => {
    const out = await rolledBack(async (tx) => {
      await shares(tx);
      const before = await count(tx, 'list_shares');
      const v = await cleanup(tx);
      return {
        v,
        gone: before - (await count(tx, 'list_shares')),
        kept: await ids(tx, 'list_shares', [P_OLD, P_MID, P_NOW, G_OLD, Q_OLD])
      };
    });
    // P_OLD has the newer P_MID; P_MID was stopped 29 days ago; G_OLD has
    // only newer player rows; Q_OLD is its list's newest.
    assert.deepEqual(out.kept, [P_MID, P_NOW, G_OLD, Q_OLD].sort());
    assert.equal(out.v.shares, out.gone);
    assert.ok(out.gone >= 1);
  });

  it("deletes the job's runs that ended over 7 days ago", async () => {
    const out = await rolledBack(async (tx) => {
      const [{ jobid }] =
        await tx`select jobid from cron.job where jobname = 'dhloot-lifecycle'`;
      // Fixed run ids: postgres may not use cron.runid_seq, and the job's
      // own runs stay far below these.
      const seeded = await tx`insert into cron.job_run_details
        (jobid, runid, command, status, start_time, end_time) values
        (${jobid}, 9000000001, 'select 1', 'succeeded',
          now() - interval '8 days', now() - interval '8 days'),
        (${jobid}, 9000000002, 'select 1', 'succeeded',
          now() - interval '6 days', now() - interval '6 days')
        returning runid, end_time < now() - interval '7 days' as old`;
      const before = await count(tx, 'cron.job_run_details');
      const v = await cleanup(tx);
      const left = await tx`select runid from cron.job_run_details
        where runid = any(${seeded.map((r) => r.runid)}::bigint[])`;
      return {
        v,
        gone: before - (await count(tx, 'cron.job_run_details')),
        left: left.map((r) => String(r.runid)),
        young: seeded.filter((r) => !r.old).map((r) => String(r.runid))
      };
    });
    assert.deepEqual(out.left, out.young);
    assert.equal(out.v.runs, out.gone);
    assert.ok(out.gone >= 1);
  });

  it('answers zeros on a second call', async () => {
    const out = await rolledBack(async (tx) => {
      await world(tx);
      const first = await cleanup(tx);
      return { first, second: await cleanup(tx) };
    });
    assert.ok(
      out.first.requests >= 3 && out.first.shares >= 1 && out.first.notices >= 2,
      JSON.stringify(out.first)
    );
    assert.deepEqual(out.second, { requests: 0, shares: 0, runs: 0, notices: 0 });
  });
});

describe('the roles and the send', () => {
  it('lets no API role execute it', async () => {
    const rows = await sql`
      select r.role, has_function_privilege(r.role, 'public.lifecycle_cleanup()', 'EXECUTE') as x
      from unnest(array['anon', 'authenticated', 'service_role']) as r(role) order by 1`;
    assert.deepEqual(
      rows.map((r) => `${r.role}: ${r.x}`),
      ['anon: false', 'authenticated: false', 'service_role: false']
    );
    const [fn] = await sql`select p.prosecdef, p.proconfig from pg_proc p
      where p.oid = 'public.lifecycle_cleanup()'::regprocedure`;
    assert.deepEqual(
      { ...fn },
      { prosecdef: false, proconfig: ['search_path=public, pg_temp'] }
    );
    for (const role of ['anon', 'authenticated']) {
      await assert.rejects(
        asRole(sql, { role, sub: role === 'anon' ? undefined : A }, cleanup),
        (err) => err.code === '42501'
      );
    }
  });

  it('leaves every expired request in place on a send', async () => {
    const kept = await asRole(sql, { role: 'anon', setup: world }, async (tx) => {
      await tx`select public.create_purchase_request(${id(7206)}::uuid, ${TOKEN}::text,
        ${tx.json([{ item: 'ci1', qty: 1 }])}::jsonb)`;
      await tx.unsafe('reset role');
      return ids(tx, 'purchase_requests', [...Object.values(R), id(7206)]);
    });
    assert.deepEqual(kept, [...Object.values(R), id(7206)].sort());
  });
});
