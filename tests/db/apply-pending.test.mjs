/*
  The applier behind CI's `migrate-test` step (tools/supabase/db.mjs) on the
  local stack: it applies the migrations the history lacks, in order, with
  the history row the CLI would write; it lists a version no local file
  names and does not fail on it; a file that fails leaves neither its
  objects nor its row. It leaves every migration applied, with the history
  rows the CLI would write, so the files after it need no reset; only a
  failed run resets. docs/DECISIONS.md, 2026-09-25, "CI applies the test
  project's migrations file by file and ignores other branches' versions".
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appliedVersions, applyPending, connect } from '../../tools/supabase/db.mjs';
import { lineDiff, resetLocal, snapshot } from './roles.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = path.resolve(HERE, '..', '..', 'supabase', 'migrations');
const FIXTURES = path.join(HERE, 'fixtures', 'pending');
const FOREIGN = '99991231235959';
const GOOD = '20990101000000';
const BAD = '20990101000100';

const local = readdirSync(MIGRATIONS)
  .filter((n) => n.endsWith('.sql'))
  .sort();

let sql;
let failed = false;
/* Wraps a case body so that a failure is remembered for the after hook. */
const guarded = (fn) => async () => {
  try {
    await fn();
  } catch (err) {
    failed = true;
    throw err;
  }
};
/* The schema the CLI's reset in run.mjs left, before this file resets. */
let cliSchema;
before(() => {
  // A before hook that throws skips the cases; the after hook then resets.
  failed = true;
  cliSchema = snapshot(['public']);
  resetLocal(['--version', local[0].slice(0, 14)]);
  const url = process.env.DHLOOT_DB_URL;
  if (!url)
    throw new Error('DHLOOT_DB_URL is not set. Run the suite through `npm run check:db`.');
  sql = connect(url);
  failed = false;
});
after(async () => {
  await sql.end();
  // The applier leaves every migration applied; only a failed run resets.
  if (failed) resetLocal();
});

describe('applyPending', () => {
  it(
    'applies the missing migrations oldest first, with the name the CLI records',
    guarded(async () => {
      const logged = [];
      const { applied, foreign } = await applyPending(sql, MIGRATIONS, (f) => logged.push(f));
      assert.deepEqual(applied, local.slice(1));
      assert.deepEqual(logged, local.slice(1));
      assert.deepEqual(foreign, []);
      const versions = await appliedVersions(sql);
      assert.deepEqual(
        [...versions].sort(),
        local.map((n) => n.slice(0, 14))
      );
      const [{ reg }] = await sql`select to_regclass('public.user_prefs')::text as reg`;
      assert.equal(reg, 'user_prefs');
      const rows = await sql`
      select version, name from supabase_migrations.schema_migrations order by version`;
      // The first row is the CLI's own: the applier's rows must read the same way.
      assert.deepEqual(
        rows.map((r) => `${r.version}_${r.name}.sql`),
        local
      );
      // The applier's schema equals the CLI's; the reversibility walk ends on it.
      assert.deepEqual(lineDiff(cliSchema, snapshot(['public'])), []);
    })
  );

  it(
    'lists a version no local file names and applies nothing',
    guarded(async () => {
      await sql`insert into supabase_migrations.schema_migrations (version, name)
      values (${FOREIGN}, 'another_branch')`;
      try {
        const result = await applyPending(sql, MIGRATIONS);
        assert.deepEqual(result, { applied: [], foreign: [FOREIGN] });
      } finally {
        await sql`delete from supabase_migrations.schema_migrations where version = ${FOREIGN}`;
      }
    })
  );

  it(
    'stops at a failing file, naming it, and keeps neither its objects nor its row',
    guarded(async () => {
      await sql.unsafe('drop schema if exists gate_fixture cascade');
      try {
        await assert.rejects(applyPending(sql, FIXTURES), /20990101000100_bad\.sql/);
        const [{ ok, bad }] = await sql`
        select to_regclass('gate_fixture.pending_ok')::text as ok,
               to_regclass('gate_fixture.pending_bad')::text as bad`;
        assert.equal(ok, 'gate_fixture.pending_ok');
        assert.equal(bad, null);
        const versions = await appliedVersions(sql);
        assert.ok(versions.includes(GOOD), 'the good file has no history row');
        assert.ok(!versions.includes(BAD), 'the failed file left a history row');
      } finally {
        await sql`delete from supabase_migrations.schema_migrations
        where version in (${GOOD}, ${BAD})`;
        await sql.unsafe('drop schema if exists gate_fixture cascade');
      }
    })
  );
});
