/*
  The guard of a connected app's token (20261113120000_api_client_guard.sql).
  PostgREST is not in the check:db stack, so each case does what PostgREST does
  before a request: it sets the role, the verified claims, `request.method` and
  `request.path`, then runs the pre-request function. A client token is minted
  as claims: `client_id` and a `session_id` whose auth.sessions row the case
  inserts (the hosted fix of Supabase Auth that bounds such a token is not
  deployed, so no flow mints one; .claude/README.md, "Supabase configuration").
  Every case rolls back. docs/specs/META.md section 3;
  docs/decisions/2026-11-13-a-connected-app-reaches-only-the-api-s-account-scope.md.
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { connect } from './roles.mjs';

const A = '00000000-0000-4000-8000-0000000000c1';
const B = '00000000-0000-4000-8000-0000000000c2';
const SESSION = '00000000-0000-4000-8000-0000000000d1';
const CLIENT = '00000000-0000-4000-8000-0000000000e1';
const LIST_A = '00000000-0000-4000-8000-0000000000f1';
const LIST_B = '00000000-0000-4000-8000-0000000000f2';

/* The guard's lists, as 20261113120000_api_client_guard.sql writes them. */
const ALLOWED = {
  GET: [
    'lists',
    'list_entries',
    'list_shares',
    'purchase_requests',
    'purchase_request_lines',
    'list_notices',
    'homebrew_items',
    'homebrew_books',
    'homebrew_cards'
  ],
  POST: ['homebrew_items', 'homebrew_books', 'homebrew_cards'],
  PATCH: ['lists', 'homebrew_items', 'homebrew_books', 'homebrew_cards'],
  DELETE: ['lists', 'list_notices', 'homebrew_items', 'homebrew_books', 'homebrew_cards']
};
const RPCS = [
  'apply_list_writes',
  'import_lists',
  'my_limit',
  'get_homebrew_items',
  'get_homebrew_item',
  'create_list_share',
  'revoke_list_share',
  'clone_shared_list',
  'create_purchase_request',
  'apply_purchase_request',
  'decline_purchase_request',
  'mark_list_read',
  'import_homebrew',
  'move_homebrew_items',
  'delete_homebrew_items',
  'create_print_set'
];
const PRIVILEGE = { GET: 'SELECT', POST: 'INSERT', PATCH: 'UPDATE', DELETE: 'DELETE' };
const METHODS = ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE'];

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

class Rollback extends Error {}

/* Runs `fn(tx)` as postgres in a transaction that always rolls back. */
async function rolledBack(fn) {
  let result;
  try {
    await sql.begin(async (tx) => {
      result = await fn(tx);
      throw new Rollback('rollback');
    });
  } catch (err) {
    if (!(err instanceof Rollback)) throw err;
  }
  return result;
}

const seedUsers = async (tx) => {
  await tx`insert into auth.users (id) values (${A}), (${B})`;
  await tx`insert into auth.sessions (id, user_id) values (${SESSION}, ${A})`;
};

/* The verified claims of a token PostgREST hands the database. */
const appClaims = (sub = A) => ({ role: 'authenticated', aud: 'authenticated', sub });
const clientClaims = (extra = {}) => ({
  ...appClaims(),
  client_id: CLIENT,
  session_id: SESSION,
  ...extra
});

/* Acts as `authenticated` with `claims` inside the open transaction, then as postgres. */
async function as(tx, claims, fn) {
  await tx.unsafe('set local role authenticated');
  await tx`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`;
  try {
    return await fn();
  } finally {
    await tx.unsafe('reset role');
  }
}

/* The guard's answer for one request: null when it lets it through, else the error. */
async function guard(tx, claims, method, path) {
  return as(tx, claims, async () => {
    await tx`select set_config('request.method', ${method}, true),
      set_config('request.path', ${path}, true)`;
    return tx
      .savepoint((sp) => sp`select public.api_client_guard()`)
      .then(
        () => null,
        (err) => err
      );
  });
}

const allowed = (method, path) => {
  const m = method === 'HEAD' ? 'GET' : method;
  if (m === 'POST' && path.startsWith('/rpc/')) return RPCS.includes(path.slice(5));
  return (ALLOWED[m] ?? []).includes(path.slice(1));
};

/* Every public table and view a Data API role holds a privilege on, and every
   public function `authenticated` may execute. */
async function reachable(tx) {
  const tables = await tx`
    select c.relname as name from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p', 'f')
      and (has_table_privilege('authenticated', c.oid, 'select')
        or has_table_privilege('authenticated', c.oid, 'insert')
        or has_table_privilege('authenticated', c.oid, 'update')
        or has_table_privilege('authenticated', c.oid, 'delete'))
    order by 1`;
  const functions = await tx`
    select distinct p.proname as name from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('authenticated', p.oid, 'execute')
    order by 1`;
  return { tables: tables.map((r) => r.name), functions: functions.map((r) => r.name) };
}

describe('the pre-request guard', () => {
  it('is the role setting PostgREST reads', async () => {
    const rows = await sql`
      select unnest(r.rolconfig) as setting from pg_roles r where r.rolname = 'authenticator'`;
    assert.ok(
      rows.some((r) => r.setting === 'pgrst.db_pre_request=public.api_client_guard'),
      'authenticator has no pgrst.db_pre_request=public.api_client_guard'
    );
  });

  it('names only tables and functions that exist with the privilege of their method', async () => {
    const { tables, functions } = await reachable(sql);
    for (const [method, names] of Object.entries(ALLOWED)) {
      for (const name of names) {
        const [{ ok }] = await sql`
          select has_table_privilege('authenticated', ${'public.' + name}, ${PRIVILEGE[method]}) as ok`;
        assert.ok(tables.includes(name) && ok, `${method} /${name} names no reachable table`);
      }
    }
    for (const name of RPCS)
      assert.ok(functions.includes(name), `/rpc/${name} is not executable`);
  });

  it('lets the app token, anon and a token with no client through on every path', async () => {
    const out = await rolledBack(async (tx) => {
      await seedUsers(tx);
      const { tables, functions } = await reachable(tx);
      const paths = [...tables.map((t) => '/' + t), ...functions.map((f) => '/rpc/' + f)];
      const refused = [];
      for (const path of paths) {
        for (const method of METHODS) {
          if (await guard(tx, appClaims(), method, path)) refused.push(`app ${method} ${path}`);
        }
      }
      await tx.unsafe('set local role anon');
      await tx`select set_config('request.jwt.claims', ${JSON.stringify({ role: 'anon' })}, true),
        set_config('request.method', 'POST', true), set_config('request.path', '/rpc/x', true)`;
      await tx`select public.api_client_guard()`;
      await tx.unsafe('reset role');
      return refused;
    });
    assert.deepEqual(out, []);
  });

  /* One case per row of the guard's list. */
  for (const [method, names] of Object.entries(ALLOWED)) {
    for (const name of names) {
      it(`lets a client token through on ${method} /${name}, as the app token`, async () => {
        const out = await rolledBack(async (tx) => {
          await seedUsers(tx);
          return {
            client: await guard(tx, clientClaims(), method, '/' + name),
            app: await guard(tx, appClaims(), method, '/' + name)
          };
        });
        assert.deepEqual(out, { client: null, app: null });
      });
    }
  }
  for (const name of RPCS) {
    it(`lets a client token through on POST /rpc/${name}, as the app token`, async () => {
      const out = await rolledBack(async (tx) => {
        await seedUsers(tx);
        return {
          client: await guard(tx, clientClaims(), 'POST', '/rpc/' + name),
          app: await guard(tx, appClaims(), 'POST', '/rpc/' + name)
        };
      });
      assert.deepEqual(out, { client: null, app: null });
    });
  }

  it('judges HEAD as GET', async () => {
    const out = await rolledBack(async (tx) => {
      await seedUsers(tx);
      return {
        lists: await guard(tx, clientClaims(), 'HEAD', '/lists'),
        prefs: (await guard(tx, clientClaims(), 'HEAD', '/user_prefs'))?.code
      };
    });
    assert.deepEqual(out, { lists: null, prefs: '42501' });
  });

  it('refuses a client token everything else authenticated reaches', async () => {
    const out = await rolledBack(async (tx) => {
      await seedUsers(tx);
      const { tables, functions } = await reachable(tx);
      const paths = [
        ...tables.map((t) => '/' + t),
        ...functions.map((f) => '/rpc/' + f),
        '/rpc/move_legacy_list',
        '/',
        '/rpc/graphql',
        '//lists',
        '/lists/',
        '/LISTS',
        ''
      ];
      const wrong = [];
      for (const path of paths) {
        for (const method of METHODS) {
          const err = await guard(tx, clientClaims(), method, path);
          if (allowed(method, path)) {
            if (err) wrong.push(`refused ${method} ${path}: ${err.message}`);
          } else if (err?.code !== '42501' || !/^api_client_guard: /.test(err.message)) {
            wrong.push(`let through ${method} ${path}`);
          }
        }
      }
      return wrong;
    });
    assert.deepEqual(out, []);
  });

  it('refuses the account delete, the print-set read, the reorder and user_prefs', async () => {
    const out = await rolledBack(async (tx) => {
      await seedUsers(tx);
      const code = async (method, path) =>
        (await guard(tx, clientClaims(), method, path))?.code;
      return {
        deleteAccount: await code('POST', '/rpc/delete_account'),
        deleteRequests: await code('POST', '/rpc/delete_account_requests'),
        printSet: await code('POST', '/rpc/get_print_set'),
        reorder: await code('POST', '/rpc/reorder_list'),
        moveLegacy: await code('POST', '/rpc/move_legacy_list'),
        prefsRead: await code('GET', '/user_prefs'),
        prefsWrite: await code('POST', '/user_prefs'),
        prefsPatch: await code('PATCH', '/user_prefs')
      };
    });
    assert.deepEqual(out, {
      deleteAccount: '42501',
      deleteRequests: '42501',
      printSet: '42501',
      reorder: '42501',
      moveLegacy: '42501',
      prefsRead: '42501',
      prefsWrite: '42501',
      prefsPatch: '42501'
    });
  });
});

describe('the session of a client token', () => {
  const live = (tx, claims) =>
    as(tx, claims, async () => (await tx`select public.api_client_session_live() as v`)[0].v);

  it('is live while its auth.sessions row stays', async () => {
    const out = await rolledBack(async (tx) => {
      await seedUsers(tx);
      return live(tx, clientClaims());
    });
    assert.equal(out, true);
  });

  it('refuses a revoked grant: the deleted session ends the unexpired token', async () => {
    const out = await rolledBack(async (tx) => {
      await seedUsers(tx);
      const before = await guard(tx, clientClaims(), 'GET', '/lists');
      await tx`delete from auth.sessions where id = ${SESSION}`;
      const after = await guard(tx, clientClaims(), 'GET', '/lists');
      return { before, after: after?.code, message: after?.message };
    });
    assert.equal(out.before, null);
    assert.equal(out.after, '42501');
    assert.match(out.message, /^api_client_guard: /);
  });

  it("refuses no, a malformed, an unknown, another user's or a timed-out session, with no error", async () => {
    const out = await rolledBack(async (tx) => {
      await seedUsers(tx);
      const other = '00000000-0000-4000-8000-0000000000d2';
      const old = '00000000-0000-4000-8000-0000000000d3';
      await tx`insert into auth.sessions (id, user_id) values (${other}, ${B})`;
      await tx`insert into auth.sessions (id, user_id, not_after)
        values (${old}, ${A}, now() - interval '1 minute')`;
      const cases = {
        none: { ...appClaims(), client_id: CLIENT },
        malformed: clientClaims({ session_id: 'not-a-uuid' }),
        number: clientClaims({ session_id: 7 }),
        unknown: clientClaims({ session_id: '00000000-0000-4000-8000-0000000000d9' }),
        otherUser: clientClaims({ session_id: other }),
        timedOut: clientClaims({ session_id: old })
      };
      const seen = {};
      for (const [name, claims] of Object.entries(cases)) {
        seen[name] = {
          live: await live(tx, claims),
          guard: (await guard(tx, claims, 'GET', '/lists'))?.code
        };
      }
      return seen;
    });
    for (const [name, v] of Object.entries(out)) {
      assert.deepEqual(v, { live: false, guard: '42501' }, name);
    }
  });

  it('answers for the caller alone: anon may not run it', async () => {
    const [r] = await sql`
      select has_function_privilege('anon', 'public.api_client_session_live()', 'execute') as anon,
        has_function_privilege('authenticated', 'public.api_client_session_live()', 'execute') as auth,
        p.prosecdef as definer, p.proconfig as config
      from pg_proc p where p.oid = 'public.api_client_session_live()'::regprocedure`;
    assert.deepEqual(
      { ...r },
      { anon: false, auth: true, definer: true, config: ['search_path=public, pg_temp'] }
    );
  });
});

describe('the rows a client token reaches', () => {
  const seedLists = async (tx) => {
    await seedUsers(tx);
    await tx`insert into public.lists (id, owner_id, name) values
      (${LIST_A}, ${A}, 'A'), (${LIST_B}, ${B}, 'B')`;
    await tx`insert into public.user_prefs (user_id, prefs) values
      (${A}, '{"view":"grid"}'::jsonb)`;
  };

  it("reads and writes its own lists and never another account's", async () => {
    const out = await rolledBack(async (tx) => {
      await seedLists(tx);
      return as(tx, clientClaims(), async () => ({
        read: (await tx`select id from public.lists order by id`).map((r) => r.id),
        renamed: (
          await tx`update public.lists set name = 'A2' where id in (${LIST_A}, ${LIST_B})
            returning id`
        ).map((r) => r.id)
      }));
    });
    assert.deepEqual(out, { read: [LIST_A], renamed: [LIST_A] });
  });

  it('reads no user_prefs row and writes none, where the app token reads its own', async () => {
    const out = await rolledBack(async (tx) => {
      await seedLists(tx);
      const app = await as(tx, appClaims(), async () =>
        (await tx`select user_id from public.user_prefs`).map((r) => r.user_id)
      );
      const client = await as(tx, clientClaims(), async () => ({
        read: (await tx`select user_id from public.user_prefs`).map((r) => r.user_id),
        update: (
          await tx`update public.user_prefs set prefs = '{}'::jsonb returning user_id`
        ).map((r) => r.user_id),
        insert: await tx
          .savepoint(
            (sp) => sp`insert into public.user_prefs (user_id, prefs) values (${A}, '{}'::jsonb)
              on conflict (user_id) do update set prefs = excluded.prefs`
          )
          .then(
            () => null,
            (err) => err.message
          )
      }));
      return { app, client };
    });
    assert.deepEqual(out.app, [A]);
    assert.deepEqual(out.client.read, []);
    assert.deepEqual(out.client.update, []);
    assert.match(out.client.insert, /row-level security/);
  });

  /* PostgREST embeds a table into another only along a foreign key, so an embedded
     read is a join from an allowed table to one outside the list. */
  it('has a restrictive policy on every reachable table outside the GET list', async () => {
    const { tables } = await reachable(sql);
    const outside = tables.filter((t) => !ALLOWED.GET.includes(t));
    const rows = await sql`
      select tablename from pg_policies
      where schemaname = 'public' and permissive = 'RESTRICTIVE'
        and policyname = tablename || '_no_client' and cmd = 'ALL'
        and roles::text = '{authenticated}'`;
    const guarded = rows.map((r) => r.tablename);
    assert.deepEqual(
      outside.filter((t) => !guarded.includes(t)),
      [],
      'a reachable table outside the GET list has no <table>_no_client policy'
    );
    assert.ok(guarded.includes('print_sets'), 'print_sets has no print_sets_no_client policy');
  });

  /* PostgREST runs such a function as a computed field on `GET /<table>?select=fn`, a
     path the guard lets through. */
  it('has no executable function that takes the row of a table in the GET list', async () => {
    const rows = await sql`
      select p.oid::regprocedure::text as fn from pg_proc p
      join pg_type t on t.oid = any (p.proargtypes)
      join pg_class c on c.oid = t.typrelid
      where c.relnamespace = 'public'::regnamespace and c.relname = any (${ALLOWED.GET}::text[])
        and has_function_privilege('authenticated', p.oid, 'execute')
      order by 1`;
    assert.deepEqual(
      rows.map((r) => r.fn),
      []
    );
  });

  it('embeds nothing from an out-of-scope table for a client token, the full rows for the app', async () => {
    const out = await rolledBack(async (tx) => {
      await seedLists(tx);
      const { tables } = await reachable(tx);
      const outside = tables.filter((t) => !ALLOWED.GET.includes(t));
      /* Every foreign key between an allowed table and an out-of-scope one, either way. */
      const paths = await tx`
        select a.relname as allowed, o.relname as outside from pg_constraint k
        join pg_class a on a.oid in (k.conrelid, k.confrelid)
        join pg_class o on o.oid in (k.conrelid, k.confrelid) and o.oid <> a.oid
        where k.contype = 'f' and a.relname = any (${ALLOWED.GET}::text[])
          and o.relname = any (${outside}::text[])
          and a.relnamespace = 'public'::regnamespace and o.relnamespace = 'public'::regnamespace`;
      /* Today no foreign key joins them; user_prefs is the account-wide table a client
         must never read, so its join on the owner stands for an embedding. */
      const embed = (claims) =>
        as(tx, claims, async () =>
          (
            await tx`select l.id, coalesce((select jsonb_agg(p.prefs) from public.user_prefs p
                where p.user_id = l.owner_id), '[]'::jsonb) as prefs
              from public.lists l order by l.id`
          ).map((r) => ({ id: r.id, prefs: r.prefs }))
        );
      return {
        paths: paths.map((p) => `${p.allowed} -> ${p.outside}`),
        client: await embed(clientClaims()),
        app: await embed(appClaims())
      };
    });
    assert.deepEqual(out.paths, []);
    assert.deepEqual(out.client, [{ id: LIST_A, prefs: [] }]);
    assert.deepEqual(out.app, [{ id: LIST_A, prefs: [{ view: 'grid' }] }]);
  });
});

describe('Storage and a client token', () => {
  const NAME = 'p/' + 'c'.repeat(32) + '.webp';
  const seedObject = async (tx) => {
    await seedUsers(tx);
    await tx`insert into storage.objects (bucket_id, name, owner_id)
      values ('homebrew-art', ${NAME}, ${A})`;
    /* No permissive update or delete policy exists; the case adds one (and the read an
       update or a delete with a filter needs), so the restrictive pair is what refuses
       the client. */
    await tx.unsafe(`create policy case_select on storage.objects for select to authenticated
      using (owner_id = auth.uid()::text)`);
    await tx.unsafe(`create policy case_update on storage.objects for update to authenticated
      using (owner_id = auth.uid()::text) with check (owner_id = auth.uid()::text)`);
    await tx.unsafe(`create policy case_delete on storage.objects for delete to authenticated
      using (owner_id = auth.uid()::text)`);
    await tx`select set_config('storage.allow_delete_query', 'true', true)`;
  };
  const write = (tx, claims) =>
    as(tx, claims, async () => ({
      update: (
        await tx`update storage.objects set metadata = '{"x":1}'::jsonb where name = ${NAME}
          returning name`
      ).length,
      delete: (await tx`delete from storage.objects where name = ${NAME} returning name`).length
    }));

  it('refuses a client token an update and a delete that the app token may make', async () => {
    const client = await rolledBack(async (tx) => {
      await seedObject(tx);
      return write(tx, clientClaims());
    });
    const app = await rolledBack(async (tx) => {
      await seedObject(tx);
      return write(tx, appClaims());
    });
    assert.deepEqual(client, { update: 0, delete: 0 });
    assert.deepEqual(app, { update: 1, delete: 1 });
  });

  it('lets a client token insert a picture under homebrew_art_insert, as the app token', async () => {
    const insert = (claims, c) =>
      rolledBack(async (tx) => {
        await seedUsers(tx);
        return as(tx, claims, () =>
          tx
            .savepoint(
              (sp) => sp`insert into storage.objects (bucket_id, name, owner_id)
                values ('homebrew-art', ${'p/' + c.repeat(32) + '.webp'}, ${A})`
            )
            .then(
              () => null,
              (err) => err.code
            )
        );
      });
    assert.equal(await insert(clientClaims(), 'd'), null);
    assert.equal(await insert(appClaims(), 'e'), null);
  });

  /* Storage never runs the pre-request guard, so the insert policy ends a revoked grant. */
  it('refuses the insert of a client token whose session has ended', async () => {
    const insert = (claims, prepare) =>
      rolledBack(async (tx) => {
        await seedUsers(tx);
        await prepare(tx);
        return as(tx, claims, () =>
          tx
            .savepoint(
              (sp) => sp`insert into storage.objects (bucket_id, name, owner_id)
                values ('homebrew-art', ${'p/' + 'f'.repeat(32) + '.webp'}, ${A})`
            )
            .then(
              () => null,
              (err) => err.code
            )
        );
      });
    const revoked = (tx) => tx`delete from auth.sessions where id = ${SESSION}`;
    assert.equal(await insert(clientClaims(), revoked), '42501');
    assert.equal(await insert(clientClaims({ session_id: 'not-a-uuid' }), () => null), '42501');
    assert.equal(await insert(appClaims(), revoked), null);
  });

  it('has one restrictive insert, update and delete policy each, never one for all', async () => {
    const rows = await sql`
      select policyname, cmd from pg_policies
      where schemaname = 'storage' and tablename = 'objects' and permissive = 'RESTRICTIVE'
      order by policyname`;
    assert.deepEqual(
      rows.map((r) => `${r.policyname} ${r.cmd}`),
      [
        'objects_no_client_delete DELETE',
        'objects_no_client_insert INSERT',
        'objects_no_client_update UPDATE'
      ]
    );
  });
});

describe('an account delete and its grants', () => {
  it('leaves no session and no OAuth consent of the account', async () => {
    const out = await rolledBack(async (tx) => {
      await seedUsers(tx);
      const [{ consents }] = await tx`select to_regclass('auth.oauth_consents') as consents`;
      if (!consents) return { consentsTable: null };
      await tx`insert into auth.oauth_clients (id, client_name, client_type,
          registration_type, redirect_uris, grant_types, token_endpoint_auth_method)
        values (${CLIENT}, 'case', 'public', 'dynamic', 'http://127.0.0.1/cb',
          'authorization_code,refresh_token', 'none')`;
      await tx`insert into auth.oauth_consents (id, user_id, client_id, scopes)
        values (gen_random_uuid(), ${A}, ${CLIENT}, 'openid')`;
      await tx`update auth.sessions set oauth_client_id = ${CLIENT} where id = ${SESSION}`;
      await as(tx, appClaims(), () => tx`select public.delete_account()`);
      const [{ n }] =
        await tx`select count(*)::int as n from auth.sessions where user_id = ${A}`;
      const [{ left }] =
        await tx`select count(*)::int as left from auth.oauth_consents where user_id = ${A}`;
      return { consentsTable: 'auth.oauth_consents', sessions: n, consents: left };
    });
    /* Auth's own migrations create the consent table whether the OAuth server is on or off. */
    assert.deepEqual(out, { consentsTable: 'auth.oauth_consents', sessions: 0, consents: 0 });
  });
});
