/*
  The drop of the browser-list move (20261028120000_drop_legacy_move.sql):
  move_legacy_list() is gone, the count limits hold even with the old
  dhloot.move setting on, and lists.legacy_fingerprint and its index are
  gone. The reversal restores the shape (not the values) and the guard; the
  migration then applies again. Each case rolls back.
  docs/decisions/2026-10-28-r10-drops-the-move-function-and-the-fingerprint-column.md.
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
const NAME = '20261028120000_drop_legacy_move.sql';
const UP = readFileSync(path.join(SUPABASE, 'migrations', NAME), 'utf8');
const DOWN = readFileSync(path.join(SUPABASE, 'reversals', NAME), 'utf8');

const A = '00000000-0000-4000-8000-0000000000a1';
const LIST = '00000000-0000-4000-8000-000000013001';
const SEARCH_PATH = ['search_path=public, pg_temp'];

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

const user = (tx) => tx`insert into auth.users (id) values (${A})`;
const asA = (fn) => asRole(sql, { role: 'authenticated', sub: A, setup: user }, fn);
const moveOn = (tx) => tx`select set_config('dhloot.move', 'on', true)`;
const limitError = (key, detail) => (err) => {
  assert.equal(err.code, 'P0001', err.message);
  assert.equal(err.message, `limit: ${key}`);
  assert.equal(err.detail, detail);
  return true;
};

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

/* Returns the header, the callers' EXECUTE and the guard of both limit
 * functions, keyed by name. */
async function limitFunctions(tx) {
  const rows = await tx`
    select p.proname as fn, p.prosecdef, p.proconfig,
      exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
        where a.grantee = 0 and a.privilege_type = 'EXECUTE') as public,
      has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') as authed,
      has_function_privilege('service_role', p.oid, 'EXECUTE') as service,
      strpos(p.prosrc, 'dhloot.move') > 0 as guard
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in ('lists_limit', 'list_entries_limit')
    order by p.proname`;
  return Object.fromEntries(rows.map(({ fn, ...r }) => [fn, { ...r }]));
}

const limits = (guard) => {
  const one = {
    prosecdef: true,
    proconfig: SEARCH_PATH,
    public: false,
    anon: false,
    authed: false,
    service: false,
    guard
  };
  return { list_entries_limit: one, lists_limit: one };
};

/* Returns what of the move is in the schema now. */
async function moveShape(tx) {
  const [column] = await tx`
    select format_type(a.atttypid, a.atttypmod) as type, a.attnotnull
    from pg_attribute a
    where a.attrelid = 'public.lists'::regclass and a.attname = 'legacy_fingerprint'
      and not a.attisdropped`;
  const checks = await tx`
    select c.conname, pg_get_constraintdef(c.oid) as def from pg_constraint c
    where c.conrelid = 'public.lists'::regclass
      and pg_get_constraintdef(c.oid) like '%legacy_fingerprint%'`;
  const [index] = await tx`
    select i.indisunique, pg_get_expr(i.indpred, i.indrelid) as pred,
      pg_get_indexdef(i.indexrelid) as def
    from pg_index i
    where i.indexrelid = to_regclass('public.lists_legacy_fingerprint')`;
  const [fn] = await tx`
    select p.prosecdef, p.proconfig,
      has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') as authed,
      has_function_privilege('service_role', p.oid, 'EXECUTE') as service
    from pg_proc p
    where p.oid = to_regprocedure('public.move_legacy_list(uuid,text)')`;
  return {
    column: column ? { ...column } : null,
    checks: checks.map((c) => ({ ...c })),
    index: index ? { ...index } : null,
    fn: fn ? { ...fn } : null
  };
}

const GONE = { column: null, checks: [], index: null, fn: null };

describe('the drop of the browser-list move', () => {
  it('refuses a signed-in call of move_legacy_list as an unknown function', async () => {
    await assert.rejects(
      asA((tx) => tx`select * from public.move_legacy_list(${LIST}::uuid, ${'{}'}::text)`),
      (err) => {
        assert.equal(err.code, '42883', err.message);
        return true;
      }
    );
  });

  it('leaves no legacy_fingerprint column, no check on it and no index', async () => {
    assert.deepEqual(await moveShape(sql), GONE);
  });

  it('keeps both limit functions definer with a fixed search_path, no caller EXECUTE and no guard', async () => {
    assert.deepEqual(await limitFunctions(sql), limits(false));
  });
});

describe('the count limits with the old dhloot.move setting on', () => {
  it('refuses the 51st list of an owner', async () => {
    await assert.rejects(
      asA(async (tx) => {
        await moveOn(tx);
        await tx`insert into public.lists (id, owner_id)
          select gen_random_uuid(), ${A} from generate_series(1, 50)`;
        await tx`insert into public.lists (id, owner_id) values (${LIST}, ${A})`;
      }),
      limitError('lists_per_owner', '50')
    );
  });

  it('refuses the 101st entry of a list', async () => {
    await assert.rejects(
      asA(async (tx) => {
        await moveOn(tx);
        await tx`insert into public.lists (id, owner_id) values (${LIST}, ${A})`;
        await tx`insert into public.list_entries (id, list_id, item_key, position)
          select gen_random_uuid(), ${LIST}, 'k' || g, g - 1 from generate_series(1, 100) as g`;
        await tx`insert into public.list_entries (id, list_id, item_key, position)
          values (gen_random_uuid(), ${LIST}, 'k101', 100)`;
      }),
      limitError('entries_per_list', '100')
    );
  });
});

describe('the reversal of the drop', () => {
  it('restores the column, the index, the function and the guard, and the drop applies again', async () => {
    const out = await rolledBack(async (tx) => {
      await tx.unsafe(DOWN);
      const down = { shape: await moveShape(tx), limits: await limitFunctions(tx) };
      await tx.unsafe(UP);
      return { down, up: { shape: await moveShape(tx), limits: await limitFunctions(tx) } };
    });
    const { shape } = out.down;
    assert.deepEqual(shape.column, { type: 'text', attnotnull: false });
    assert.equal(shape.checks.length, 1);
    assert.equal(shape.checks[0].conname, 'lists_legacy_fingerprint_check');
    assert.match(shape.checks[0].def, /legacy_fingerprint ~ '\^\[0-9a-f\]\{64\}\$'/);
    assert.equal(shape.index.indisunique, true);
    assert.match(shape.index.pred, /^\(?legacy_fingerprint IS NOT NULL\)?$/);
    assert.match(shape.index.def, /\(owner_id, legacy_fingerprint\)/);
    assert.deepEqual(shape.fn, {
      prosecdef: true,
      proconfig: SEARCH_PATH,
      anon: false,
      authed: true,
      service: false
    });
    assert.deepEqual(out.down.limits, limits(true));
    assert.deepEqual(out.up, { shape: GONE, limits: limits(false) });
  });

  // A list insert queues a deferred lists_broadcast event, and Postgres
  // refuses the drop of a column while one is pending (55006), so this case
  // never applies the migration again.
  it('lets 51 lists of one owner in with the setting on after the reversal', async () => {
    const n = await rolledBack(async (tx) => {
      await user(tx);
      await tx.unsafe(DOWN);
      await moveOn(tx);
      await tx`insert into public.lists (id, owner_id)
        select gen_random_uuid(), ${A} from generate_series(1, 51)`;
      const [r] = await tx`select count(*)::int as n from public.lists where owner_id = ${A}`;
      return r.n;
    });
    assert.equal(n, 51);
  });
});
