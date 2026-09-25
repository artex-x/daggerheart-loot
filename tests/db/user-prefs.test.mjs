/*
  user_prefs: one row of UI preferences per user. A signed-in user reads,
  inserts, updates and upserts only its own row and never deletes it; anon
  and a caller with no user id get nothing; the database bounds the row's
  shape and size; the row goes with its user. docs/specs/STATE.md,
  "Account preferences".
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asRole, connect } from './roles.mjs';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const GRID = { view: 'grid' };

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

const users = (tx) => tx`insert into auth.users (id) values (${A}), (${B})`;
const withRowOf =
  (...ids) =>
  async (tx) => {
    await users(tx);
    for (const id of ids) {
      await tx`insert into public.user_prefs (user_id, prefs) values (${id}, ${tx.json(GRID)})`;
    }
  };
const asA = (setup, fn) => asRole(sql, { role: 'authenticated', sub: A, setup }, fn);
const ids = (rows) => rows.map((r) => r.user_id);

describe('user_prefs grants', () => {
  it('grants authenticated select, insert and update only, and anon nothing', async () => {
    const privs = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'];
    const rows = await sql`
      select r.role, p.priv
      from unnest(array['anon', 'authenticated']) as r(role)
      cross join unnest(${privs}::text[]) as p(priv)
      where has_table_privilege(r.role, 'public.user_prefs', p.priv)
      order by r.role, p.priv`;
    assert.deepEqual(
      rows.map((r) => `${r.role}: ${r.priv}`),
      ['authenticated: INSERT', 'authenticated: SELECT', 'authenticated: UPDATE']
    );
  });

  /* SELECT and DELETE are the grant migration's (the E2E admin client);
     TRUNCATE, REFERENCES and TRIGGER come from the default privileges
     postgres holds on new public tables, which the first migration revokes
     from anon and authenticated only. Never INSERT or UPDATE. */
  it('grants service_role select and delete, never insert or update', async () => {
    const privs = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'];
    const rows = await sql`
      select p.priv from unnest(${privs}::text[]) as p(priv)
      where has_table_privilege('service_role', 'public.user_prefs', p.priv)
      order by p.priv`;
    assert.deepEqual(
      rows.map((r) => r.priv),
      ['DELETE', 'REFERENCES', 'SELECT', 'TRIGGER', 'TRUNCATE']
    );
  });

  it('has row level security on', async () => {
    const [r] = await sql`
      select c.relrowsecurity from pg_class c
      where c.oid = 'public.user_prefs'::regclass`;
    assert.equal(r.relrowsecurity, true);
  });
});

describe('user_prefs rows, as user A', () => {
  it('inserts its own row', async () => {
    const rows = await asA(
      users,
      (tx) =>
        tx`insert into public.user_prefs (user_id, prefs) values (${A}, ${tx.json(GRID)})
           returning user_id`
    );
    assert.deepEqual(ids(rows), [A]);
  });

  it("sees its own row and not B's", async () => {
    const rows = await asA(withRowOf(A, B), (tx) => tx`select user_id from public.user_prefs`);
    assert.deepEqual(ids(rows), [A]);
  });

  it('may not insert a row naming B', async () => {
    await assert.rejects(
      asA(
        users,
        (tx) =>
          tx`insert into public.user_prefs (user_id, prefs) values (${B}, ${tx.json(GRID)})`
      ),
      /row-level security/
    );
  });

  it("touches nothing when it updates B's row", async () => {
    const rows = await asA(
      withRowOf(B),
      (tx) =>
        tx`update public.user_prefs set prefs = '{}'::jsonb where user_id = ${B}
           returning user_id`
    );
    assert.deepEqual(ids(rows), []);
  });

  it('upserts its own row, new and existing', async () => {
    const upsert = (tx, prefs) =>
      tx`insert into public.user_prefs (user_id, prefs) values (${A}, ${tx.json(prefs)})
         on conflict (user_id) do update set prefs = excluded.prefs
         returning prefs`;
    const [first, second] = await asA(users, async (tx) => [
      await upsert(tx, GRID),
      await upsert(tx, { view: 'list' })
    ]);
    assert.deepEqual(first[0].prefs, { view: 'grid' });
    assert.deepEqual(second[0].prefs, { view: 'list' });
  });

  it("may not upsert over B's row", async () => {
    await assert.rejects(
      asA(
        withRowOf(B),
        (tx) =>
          tx`insert into public.user_prefs (user_id, prefs) values (${B}, ${tx.json(GRID)})
             on conflict (user_id) do update set prefs = excluded.prefs`
      ),
      /row-level security/
    );
  });

  it('may not delete its own row', async () => {
    await assert.rejects(
      asA(withRowOf(A), (tx) => tx`delete from public.user_prefs where user_id = ${A}`),
      /permission denied/
    );
  });

  it('is refused a value that is not an object, or too large', async () => {
    await assert.rejects(
      asA(
        users,
        (tx) => tx`insert into public.user_prefs (user_id, prefs) values (${A}, '[]'::jsonb)`
      ),
      /user_prefs_object/
    );
    const big = { home: '#/' + 'x'.repeat(5000) };
    await assert.rejects(
      asA(
        users,
        (tx) =>
          tx`insert into public.user_prefs (user_id, prefs) values (${A}, ${tx.json(big)})`
      ),
      /user_prefs_size/
    );
  });
});

describe('user_prefs rows, with no user', () => {
  it('reads nothing and inserts nothing as authenticated with no user id', async () => {
    const rows = await asRole(
      sql,
      { role: 'authenticated', setup: withRowOf(A, B) },
      (tx) => tx`select user_id from public.user_prefs`
    );
    assert.deepEqual(ids(rows), []);
    await assert.rejects(
      asRole(
        sql,
        { role: 'authenticated', setup: users },
        (tx) =>
          tx`insert into public.user_prefs (user_id, prefs) values (${A}, ${tx.json(GRID)})`
      ),
      /row-level security/
    );
  });

  it('refuses anon a read', async () => {
    await assert.rejects(
      asRole(
        sql,
        { role: 'anon', setup: withRowOf(A) },
        (tx) => tx`select user_id from public.user_prefs`
      ),
      /permission denied/
    );
  });
});

describe('user_prefs rows go with their user', () => {
  it("when the user is deleted, and through delete_account(), keeping B's", async () => {
    const afterDelete = await asA(withRowOf(A, B), async (tx) => {
      await tx.unsafe('reset role');
      await tx`delete from auth.users where id = ${A}`;
      return ids(await tx`select user_id from public.user_prefs order by user_id`);
    });
    assert.deepEqual(afterDelete, [B]);

    const afterRpc = await asA(withRowOf(A, B), async (tx) => {
      await tx`select public.delete_account()`;
      await tx.unsafe('reset role');
      return ids(await tx`select user_id from public.user_prefs order by user_id`);
    });
    assert.deepEqual(afterRpc, [B]);
  });
});
