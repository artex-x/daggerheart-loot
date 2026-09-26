/*
  The restore drill's load (tools/supabase/restore.mjs, restoreDump) on
  the local stack, with fake dumps in the CLI's format encrypted at run
  time to a fresh key: a good dump loads in one transaction after the
  truncate, every table matches its dump, and the sequence guard lifts the
  dump's low setval to the highest id; a dump that names a missing column
  fails with SQLSTATE 42703, reports no value and leaves no row; the reset
  restores the migrations' seed. The key leaves the environment before the
  drill starts any child process. .claude/README.md, "Run the agent drill".
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Encrypter, generateX25519Identity, identityToRecipient } from 'age-encryption';
import { connect, rowCounts } from '../../tools/supabase/db.mjs';
import {
  decryptAge,
  drillReport,
  dumpRowCounts,
  localProjectId
} from '../../tools/supabase/lib.mjs';
import { resetLocal, restoreDump, takeIdentity } from '../../tools/supabase/restore.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const FIXTURES = path.join(HERE, 'fixtures', 'restore-drill');
const CONTAINER = `supabase_db_${localProjectId(
  readFileSync(path.join(ROOT, 'supabase', 'config.toml'), 'utf8')
)}`;
const TABLES = [
  'auth.users',
  'public.limit_defaults',
  'public.list_entries',
  'public.list_shares',
  'public.lists',
  'public.user_limit_overrides',
  'public.user_prefs'
];
const FIXTURE_VALUES = ['@example.invalid', 'drill-secret-value', 'Drill list'];

const dbUrl = process.env.DHLOOT_DB_URL;
let identity;

/* Encrypts a fixture to the test key and decrypts it the drill's way. */
async function roundTrip(name) {
  const e = new Encrypter();
  e.addRecipient(await identityToRecipient(identity));
  const bytes = await e.encrypt(readFileSync(path.join(FIXTURES, name)));
  return new TextDecoder().decode(await decryptAge(bytes, identity));
}

async function counts() {
  const sql = connect(dbUrl);
  try {
    return await rowCounts(sql, TABLES);
  } finally {
    await sql.end();
  }
}

async function limitDefaults() {
  const sql = connect(dbUrl);
  try {
    const rows = await sql`select key, value from public.limit_defaults order by key`;
    return rows.map((r) => `${r.key}=${r.value}`);
  } finally {
    await sql.end();
  }
}

const report = (result) =>
  drillReport({
    artifact: { name: 'backup-2026-09-26', runId: 1, ageDays: 0 },
    failure: null,
    decrypted: true,
    ...result,
    cleanup: { tempRemoved: true, reset: true }
  });

let schemaText;
// The last case resets; the after hook resets only when it did not finish.
let clean = false;
before(async () => {
  if (!dbUrl)
    throw new Error('DHLOOT_DB_URL is not set. Run the suite through `npm run check:db`.');
  identity = await generateX25519Identity();
  schemaText = await roundTrip('schema.sql');
});
after(() => {
  if (!clean) assert.equal(resetLocal(), true, 'supabase db reset --local failed');
});

describe('restoreDump', () => {
  it('fails a dump that names a missing column, reports no value and leaves no row', async () => {
    const before = await counts();
    const seed = await limitDefaults();
    const result = await restoreDump({
      dbUrl,
      container: CONTAINER,
      schemaText,
      dataText: await roundTrip('data-bad-column.sql')
    });
    assert.equal(result.load.ok, false);
    assert.equal(result.load.sqlstate, '42703');
    // The dump line of the failing tuple, past the one truncate line.
    assert.equal(result.load.line, 20);
    const { pass, lines } = report(result);
    assert.equal(pass, false);
    for (const line of lines) {
      for (const value of FIXTURE_VALUES) assert.ok(!line.includes(value), line);
    }
    assert.deepEqual(await counts(), before);
    assert.deepEqual(await limitDefaults(), seed);
  });

  it('loads a dump after the truncate and matches every table', async () => {
    const dataText = await roundTrip('data.sql');
    const result = await restoreDump({ dbUrl, container: CONTAINER, schemaText, dataText });
    assert.deepEqual(result.load, { ok: true });
    const dump = dumpRowCounts(dataText);
    for (const name of TABLES) {
      assert.deepEqual(
        result.counts.get(name),
        { loaded: dump.get(name), dump: dump.get(name) },
        name
      );
    }
    // The dump's values, not the seed's: the truncate took the seed out.
    assert.deepEqual(await limitDefaults(), ['entries_per_list=9', 'lists_per_owner=7']);
    // The dump sets the sequence to 3; the guard lifts it to the highest id.
    const sql = connect(dbUrl);
    try {
      const [{ v }] = await sql`select last_value::int as v from auth.refresh_tokens_id_seq`;
      assert.ok(v >= 9, `refresh_tokens_id_seq is ${v}, below the highest id 9`);
    } finally {
      await sql.end();
    }
    assert.deepEqual(result.counts.get('auth.refresh_tokens'), { loaded: 2, dump: 2 });
    const { pass, lines } = report(result);
    assert.equal(pass, true, lines.join('\n'));
    for (const line of lines) {
      for (const value of FIXTURE_VALUES) assert.ok(!line.includes(value), line);
    }
  });

  it('leaves no fixture row after the reset and restores the seed', async () => {
    assert.equal(resetLocal(), true, 'supabase db reset --local failed');
    const now = await counts();
    assert.equal(now.get('public.lists'), 0);
    assert.equal(now.get('auth.users'), 0);
    assert.deepEqual(await limitDefaults(), ['entries_per_list=100', 'lists_per_owner=50']);
    clean = true;
  });
});

describe('the key and child processes', () => {
  it('takes a set key out of the environment it was given', async () => {
    const key = await generateX25519Identity();
    const env = { BACKUP_AGE_IDENTITY: key, OTHER: 'x' };
    assert.equal(takeIdentity(env), key);
    assert.deepEqual(env, { OTHER: 'x' });
  });

  it('takes a malformed key out too and answers null', () => {
    const env = { BACKUP_AGE_IDENTITY: 'not-a-key' };
    assert.equal(takeIdentity(env), null);
    assert.deepEqual(env, {});
  });

  // A spawn-level probe needs a fake docker.exe on PATH (without a shell,
  // Node on Windows resolves only .exe and .com), so the order is read from
  // the source: main takes the key before its first spawn.
  it('takes the key in main before any child process starts', () => {
    const text = readFileSync(
      path.join(ROOT, 'tools', 'supabase', 'restore-drill.mjs'),
      'utf8'
    );
    const main = text.slice(text.indexOf('async function main()'));
    const take = main.indexOf('takeIdentity(process.env)');
    assert.ok(take > 0, 'main does not call takeIdentity(process.env)');
    for (const call of [
      'spawnSync(',
      'cli(',
      'gh(',
      'dockerAnswers(',
      'readSource(',
      'resetLocal(',
      'ensureStackWithAuth('
    ]) {
      const at = main.indexOf(call);
      assert.ok(at === -1 || at > take, `${call} runs before the key is taken`);
    }
  });
});
