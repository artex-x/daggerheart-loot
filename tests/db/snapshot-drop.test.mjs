/*
  The drop of the null column list_entries.snapshot
  (20261010120000_drop_list_entry_snapshot.sql): the column and its check
  list_entries_snapshot_null are gone; the reversal re-adds both, so a
  non-null snapshot is refused again; the migration then applies again. The
  seed runs in a transaction that rolls back. .claude/README.md, "Backups
  and restore".
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect } from './roles.mjs';

const SUPABASE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'supabase'
);
const NAME = '20261010120000_drop_list_entry_snapshot.sql';
const UP = readFileSync(path.join(SUPABASE, 'migrations', NAME), 'utf8');
const DOWN = readFileSync(path.join(SUPABASE, 'reversals', NAME), 'utf8');

const A = '00000000-0000-4000-8000-0000000000a1';
const LIST = '00000000-0000-4000-8000-000000012001';
const ENTRY = '00000000-0000-4000-8000-000000012101';

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

/* Answers whether the column and the check exist now. */
async function shape(tx) {
  const [{ column, check }] = await tx`select
      exists (select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'list_entries'
          and column_name = 'snapshot') as column,
      exists (select 1 from pg_constraint
        where conname = 'list_entries_snapshot_null') as check`;
  return { column, check };
}

describe('the drop of list_entries.snapshot', () => {
  it('leaves no snapshot column and no list_entries_snapshot_null check', async () => {
    assert.deepEqual(await shape(sql), { column: false, check: false });
  });

  it('reverses to a null column that refuses a snapshot, and applies again', async () => {
    const out = await rolledBack(async (tx) => {
      await tx`insert into auth.users (id) values (${A})`;
      await tx`insert into public.lists (id, owner_id) values (${LIST}, ${A})`;
      await tx`insert into public.list_entries (id, list_id, item_key, source, position)
        values (${ENTRY}, ${LIST}, 'ci1', 'official', 0)`;
      await tx.unsafe(DOWN);
      const down = await shape(tx);
      const [{ held }] =
        await tx`select count(*) filter (where snapshot is not null)::int as held
        from public.list_entries`;
      const err = await tx
        .savepoint(
          (sp) => sp`update public.list_entries set snapshot = ${sp.json({ id: 'ci1' })}
            where id = ${ENTRY}`
        )
        .then(
          () => null,
          (e) => e
        );
      await tx.unsafe(UP);
      return { down, held, err, up: await shape(tx) };
    });
    assert.deepEqual(out.down, { column: true, check: true });
    assert.equal(out.held, 0);
    assert.equal(out.err?.code, '23514');
    assert.match(out.err.message, /list_entries_snapshot_null/);
    assert.deepEqual(out.up, { column: false, check: false });
  });
});
