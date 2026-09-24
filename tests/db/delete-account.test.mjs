/*
  delete_account(): the one way a signed-in user removes their account.
  It runs as its owner (security definer, a fixed search_path), only a
  signed-in user may call it, and it removes the caller and nobody else.
  docs/specs/FEATURES.md, "Account".
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asRole, connect } from './roles.mjs';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const FN = 'public.delete_account()';

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

const twoUsers = (tx) => tx`insert into auth.users (id) values (${A}), (${B})`;

describe('delete_account()', () => {
  it('runs as its owner with a fixed search_path', async () => {
    const [r] = await sql`
      select p.prosecdef, p.proconfig
      from pg_proc p where p.oid = ${FN}::regprocedure`;
    assert.equal(r.prosecdef, true);
    assert.deepEqual(r.proconfig, ['search_path=public, pg_temp']);
  });

  it('is executable by authenticated, and by neither anon nor PUBLIC', async () => {
    const [r] = await sql`
      select
        has_function_privilege('anon', ${FN}::regprocedure, 'EXECUTE') as anon,
        has_function_privilege('authenticated', ${FN}::regprocedure, 'EXECUTE') as authed,
        exists (
          select 1 from pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
          where p.oid = ${FN}::regprocedure and a.grantee = 0 and a.privilege_type = 'EXECUTE'
        ) as public_grant`;
    assert.deepEqual(r, { anon: false, authed: true, public_grant: false });
  });

  it("removes the caller's user and keeps everyone else's", async () => {
    const left = await asRole(
      sql,
      { role: 'authenticated', sub: A, setup: twoUsers },
      async (tx) => {
        await tx`select public.delete_account()`;
        await tx.unsafe('reset role');
        const rows = await tx`select id from auth.users where id in (${A}, ${B}) order by id`;
        return rows.map((r) => r.id);
      }
    );
    assert.deepEqual(left, [B]);
  });

  it('refuses an authenticated call with no user id', async () => {
    await assert.rejects(
      asRole(
        sql,
        { role: 'authenticated', setup: twoUsers },
        (tx) => tx`select public.delete_account()`
      ),
      /delete_account: not signed in/
    );
  });

  it('refuses anon', async () => {
    await assert.rejects(
      asRole(
        sql,
        { role: 'anon', sub: A, setup: twoUsers },
        (tx) => tx`select public.delete_account()`
      ),
      /permission denied/
    );
  });
});
