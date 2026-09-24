/*
  The layer 3 harness proves itself, and pins two invariants every schema
  batch inherits: no `public` table grants anything to anon, and every
  `public` table has row level security enabled.
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asRole, connect } from './roles.mjs';

const USER = '00000000-0000-4000-8000-000000000001';

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

describe('asRole', () => {
  it('acts as anon with no user id', async () => {
    const row = await asRole(sql, { role: 'anon' }, async (tx) => {
      const [r] = await tx`select current_user as who, auth.uid() as uid`;
      return r;
    });
    assert.equal(row.who, 'anon');
    assert.equal(row.uid, null);
  });

  it('acts as an authenticated user with the given id', async () => {
    const row = await asRole(sql, { role: 'authenticated', sub: USER }, async (tx) => {
      const [r] = await tx`select current_user as who, auth.uid() as uid`;
      return r;
    });
    assert.equal(row.who, 'authenticated');
    assert.equal(row.uid, USER);
  });

  it('refuses anon a read of auth.users', async () => {
    await assert.rejects(
      asRole(sql, { role: 'anon' }, (tx) => tx`select id from auth.users limit 1`),
      /permission denied/
    );
  });

  it('refuses a role other than anon or authenticated', async () => {
    await assert.rejects(
      asRole(sql, { role: 'service_role' }, () => null),
      /not anon/
    );
  });

  it('rolls back every write made inside it', async () => {
    await sql.unsafe(`
      create schema harness_probe;
      create table harness_probe.t (n int);
      grant usage on schema harness_probe to authenticated;
      grant insert, select on harness_probe.t to authenticated;`);
    try {
      await asRole(sql, { role: 'authenticated', sub: USER }, async (tx) => {
        await tx`insert into harness_probe.t values (1)`;
        const [r] = await tx`select count(*)::int as n from harness_probe.t`;
        assert.equal(r.n, 1);
      });
      const [r] = await sql`select count(*)::int as n from harness_probe.t`;
      assert.equal(r.n, 0);
    } finally {
      await sql`drop schema harness_probe cascade`;
    }
  });
});

// has_table_privilege, not information_schema.role_table_grants: the view
// lists grants made to anon by name and misses a grant to PUBLIC, which
// anon holds too.
function anonPrivileges(db) {
  return db`
    select c.relname, p.priv
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE',
      'REFERENCES', 'TRIGGER']) as p(priv)
    where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f')
      and has_table_privilege('anon', c.oid, p.priv)
    order by c.relname, p.priv`;
}

describe('public schema invariants', () => {
  it('grants nothing on a public table to anon', async () => {
    const rows = await anonPrivileges(sql);
    assert.deepEqual(
      rows.map((r) => `${r.relname}: ${r.priv}`),
      []
    );
  });

  it('sees a grant to PUBLIC as a grant to anon', async () => {
    const rollback = new Error('rollback');
    let rows;
    await assert.rejects(
      sql.begin(async (tx) => {
        await tx.unsafe(`
          create table public.harness_public_probe (n int);
          revoke all on public.harness_public_probe from anon;
          grant select on public.harness_public_probe to public;`);
        rows = await anonPrivileges(tx);
        throw rollback;
      }),
      (err) => err === rollback
    );
    assert.deepEqual(
      rows.map((r) => `${r.relname}: ${r.priv}`),
      ['harness_public_probe: SELECT']
    );
  });

  it('enables row level security on every public table', async () => {
    const rows = await sql`
      select c.relname
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity`;
    assert.deepEqual(
      rows.map((r) => r.relname),
      []
    );
  });
});
