/*
  The production restore's core (tools/supabase/restore-prod.mjs,
  restoreToTarget) against a fake production: the local database, seeded
  from tests/db/fixtures/restore-prod/current.sql and reached through the
  same libpq environment path as a hosted target. The right ref restores
  the backup after an encrypted safety backup, keeps a user the backup
  lacks and never lowers the sequence; the safety backup undoes it; a wrong
  ref, a missing or stale receipt and a failing load write nothing. main
  refuses without a terminal before it reads the key, and no error holds
  the connection string. .claude/README.md, "Restore production (owner)".
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateX25519Identity, identityToRecipient } from 'age-encryption';
import { connect, rowCounts } from '../../tools/supabase/db.mjs';
import {
  decryptAge,
  dumpRowCounts,
  localProjectId,
  pgEnvFromUrl,
  prodReport,
  receiptFor
} from '../../tools/supabase/lib.mjs';
import {
  LOCAL_PG_ENV,
  dumpDatabase,
  newestMigration,
  readSource,
  resetLocal,
  sha256
} from '../../tools/supabase/restore.mjs';
import { restoreToTarget } from '../../tools/supabase/restore-prod.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const FIXTURES = path.join(HERE, 'fixtures', 'restore-prod');
const DRILL_FIXTURES = path.join(HERE, 'fixtures', 'restore-drill');
const CONTAINER = `supabase_db_${localProjectId(
  readFileSync(path.join(ROOT, 'supabase', 'config.toml'), 'utf8')
)}`;
const MIGRATIONS_DIR = path.join(ROOT, 'supabase', 'migrations');
const REF = 'fakeprodref';
const HOST = 'restore-test-host';
const TABLES = [
  'auth.refresh_tokens',
  'auth.users',
  'public.limit_defaults',
  'public.list_entries',
  'public.list_shares',
  'public.lists',
  'public.user_limit_overrides',
  'public.user_prefs'
];
const FIXTURE_VALUES = ['@example.invalid', 'drill-secret-value', 'token-', 'list of'];
const C_ID = 'c0000000-0000-4000-8000-00000000000c';

const dbUrl = process.env.DHLOOT_DB_URL;
const read = (dir, name) => readFileSync(path.join(dir, name), 'utf8');
const SCHEMA = read(DRILL_FIXTURES, 'schema.sql');
const temps = [];
let identity;
let recipient;
let seeded;
// The last case resets; the after hook resets only when it did not finish.
let clean = false;

function tempDir() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'restore-prod-test-'));
  temps.push(dir);
  return dir;
}

function source(id, dataText, schemaText = SCHEMA) {
  return { id, name: id, schemaText, dataText, dataHash: sha256(Buffer.from(dataText)) };
}

function receiptOf(src, overrides = {}) {
  return receiptFor({
    source: src.id,
    schemaHash: sha256(Buffer.from(src.schemaText)),
    dataHash: src.dataHash,
    newestMigration: newestMigration(),
    host: HOST,
    at: new Date(),
    ...overrides
  });
}

async function restore(src, { receipts, typed = REF, safetyRoot = tempDir() }) {
  const said = [];
  const state = await restoreToTarget({
    container: CONTAINER,
    pgEnv: LOCAL_PG_ENV,
    dbUrl,
    source: src,
    receipts,
    newestMigration: newestMigration(),
    migrationsDir: MIGRATIONS_DIR,
    host: HOST,
    now: new Date(),
    recipient,
    safetyRoot,
    expectRef: REF,
    confirm: async () => typed,
    say: (line) => said.push(line)
  });
  const report = prodReport(state);
  return { state, report, said };
}

async function withSql(fn) {
  const sql = connect(dbUrl);
  try {
    return await fn(sql);
  } finally {
    await sql.end();
  }
}

const seed = () => withSql((sql) => sql.unsafe(read(FIXTURES, 'current.sql')));

/* Row counts, emails, token ids, C's lists and the sequence. */
const snapshot = () =>
  withSql(async (sql) => ({
    counts: Object.fromEntries(await rowCounts(sql, TABLES)),
    emails: (await sql`select email from auth.users order by email`).map((r) => r.email),
    tokens: (await sql`select id::int as id from auth.refresh_tokens order by id`).map(
      (r) => r.id
    ),
    listsOfC: (
      await sql`select count(*)::int as n from public.lists where owner_id = ${C_ID}`
    )[0].n,
    seq: (await sql`select last_value::int as v from auth.refresh_tokens_id_seq`)[0].v
  }));

async function decryptDir(dir) {
  const out = {};
  for (const [key, file] of [
    ['schema', 'schema.sql.age'],
    ['data', 'data.sql.age']
  ]) {
    out[key] = new TextDecoder().decode(
      await decryptAge(readFileSync(path.join(dir, file)), identity)
    );
  }
  return out;
}

const noFixtureValue = (lines) => {
  for (const line of lines) {
    for (const value of FIXTURE_VALUES) assert.ok(!line.includes(value), line);
  }
};

before(async () => {
  if (!dbUrl)
    throw new Error('DHLOOT_DB_URL is not set. Run the suite through `npm run check:db`.');
  identity = await generateX25519Identity();
  recipient = await identityToRecipient(identity);
  await seed();
  seeded = await snapshot();
});
after(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
  if (!clean) assert.equal(resetLocal(), true, 'supabase db reset --local failed');
});

describe('restoreToTarget', () => {
  const backup = source('run 1', read(FIXTURES, 'data.sql'));
  let firstSafety;

  it('restores the backup after a safety backup, keeps C and never lowers the sequence', async () => {
    const { state, report, said } = await restore(backup, { receipts: [receiptOf(backup)] });
    assert.equal(report.verdict, 'PASS', report.lines.join('\n'));
    // The rows and the prompt's prefix were printed before the confirm.
    assert.ok(said.includes('rows (production now -> backup):'));
    assert.deepEqual(said, report.lines.slice(0, said.length));

    firstSafety = state.safety.dir;
    assert.deepEqual(readdirSync(firstSafety).sort(), ['data.sql.age', 'schema.sql.age']);
    const safety = await decryptDir(firstSafety);
    const safetyCounts = dumpRowCounts(safety.data);
    for (const name of TABLES) {
      assert.equal(safetyCounts.get(name) ?? 0, seeded.counts[name], `safety ${name}`);
    }

    const now = await snapshot();
    const dump = dumpRowCounts(backup.dataText);
    for (const name of TABLES.filter((t) => t.startsWith('public.'))) {
      assert.equal(now.counts[name], dump.get(name) ?? 0, name);
    }
    assert.deepEqual(now.emails, ['backup-a@example.invalid', 'now-c@example.invalid']);
    assert.equal(now.listsOfC, 0);
    assert.deepEqual(now.tokens, [1, 2, 3, 50]);
    assert.ok(now.seq >= 80, `refresh_tokens_id_seq is ${now.seq}`);
    noFixtureValue(report.lines);
  });

  it('undoes the restore from the safety backup', async () => {
    const stamp = path.basename(firstSafety);
    const read_ = readSource({ kind: 'safety', stamp }, process.env, {
      safetyRoot: path.dirname(firstSafety)
    });
    const texts = await decryptDir(firstSafety);
    assert.equal(read_.id, `safety ${stamp}`);
    const undo = source(read_.id, texts.data, texts.schema);
    const { report } = await restore(undo, { receipts: [receiptOf(undo)] });
    assert.equal(report.verdict, 'PASS', report.lines.join('\n'));
    const now = await snapshot();
    assert.equal(now.listsOfC, 2);
    assert.deepEqual(now.emails, ['now-a@example.invalid', 'now-c@example.invalid']);
    assert.ok(now.seq >= 80, `refresh_tokens_id_seq is ${now.seq}`);
  });

  it('aborts on a wrong ref, writes nothing and keeps the safety backup', async () => {
    assert.equal(resetLocal(), true, 'supabase db reset --local failed');
    await seed();
    const { state, report } = await restore(backup, {
      receipts: [receiptOf(backup)],
      typed: 'zzmrftmzefcqehhyztjq'
    });
    assert.equal(report.verdict, 'ABORTED', report.lines.join('\n'));
    assert.deepEqual(await snapshot(), seeded);
    assert.ok(existsSync(path.join(state.safety.dir, 'data.sql.age')));
    assert.ok(report.lines.some((l) => l.includes(state.safety.dir)));
  });

  it('refuses before any safety backup without a matching receipt', async () => {
    const day = 3600 * 1000;
    for (const [receipts, reason] of [
      [[], 'none'],
      [[receiptOf(backup, { at: new Date(Date.now() - 25 * day) })], 'older than 24 h'],
      [[{ ...receiptOf(backup), dataHash: 'other' }], 'other data'],
      [
        [receiptOf(backup, { newestMigration: '20990101000000_x.sql' })],
        'other newest migration'
      ],
      [[receiptOf(backup, { host: 'another-host' })], 'other host']
    ]) {
      const safetyRoot = path.join(tempDir(), 'safety');
      const { state, report } = await restore(backup, { receipts, safetyRoot });
      assert.equal(report.verdict, 'FAIL');
      assert.match(state.failure, new RegExp(`receipt: ${reason}\\)`));
      assert.match(state.failure, /npm run restore:drill -- --backup 1/);
      assert.equal(state.safety, undefined);
      assert.equal(existsSync(safetyRoot), false);
    }
    assert.deepEqual(await snapshot(), seeded);
  });

  it('refuses before any safety backup when the target lacks a table of the backup', async () => {
    const wider = source(
      'run 3',
      backup.dataText,
      `${SCHEMA}\nCREATE TABLE IF NOT EXISTS "public"."not_in_target" ("id" "uuid" NOT NULL);\n`
    );
    const safetyRoot = path.join(tempDir(), 'safety');
    const { state, report } = await restore(wider, {
      receipts: [receiptOf(wider)],
      safetyRoot
    });
    assert.equal(report.verdict, 'FAIL');
    assert.match(
      state.failure,
      /the target lacks public\.not_in_target; apply the migrations first/
    );
    assert.equal(state.safety, undefined);
    assert.equal(existsSync(safetyRoot), false);
    assert.deepEqual(await snapshot(), seeded);
  });

  it('rolls a failing load back, keeps the safety backup and reports no value', async () => {
    const bad = source('run 2', read(DRILL_FIXTURES, 'data-bad-column.sql'));
    const { state, report } = await restore(bad, { receipts: [receiptOf(bad)] });
    assert.equal(report.verdict, 'FAIL');
    assert.equal(state.load.sqlstate, '42703');
    assert.deepEqual(await snapshot(), seeded);
    assert.ok(existsSync(path.join(state.safety.dir, 'data.sql.age')));
    noFixtureValue(report.lines);
  });

  it('leaves no fixture row after the reset', async () => {
    assert.equal(resetLocal(), true, 'supabase db reset --local failed');
    const now = await snapshot();
    assert.equal(now.counts['auth.users'], 0);
    assert.equal(now.counts['public.lists'], 0);
    clean = true;
  });
});

describe('the terminal wall and the connection string', () => {
  // A spawn-level probe of main needs a terminal; the order is read from
  // the source: the TTY check is main's first statement, before the key.
  it('refuses without a terminal before it takes the key', () => {
    const text = readFileSync(path.join(ROOT, 'tools', 'supabase', 'restore-prod.mjs'), 'utf8');
    const main = text.slice(text.indexOf('async function main()'));
    const body = main.slice(main.indexOf('{') + 1).trimStart();
    assert.ok(
      body.startsWith('if (!(process.stdin.isTTY && process.stdout.isTTY))'),
      'the TTY check is not the first statement of main'
    );
    const take = main.indexOf('takeIdentity(process.env)');
    assert.ok(take > 0, 'main does not call takeIdentity(process.env)');
    for (const call of [
      'dockerAnswers(',
      'childEnv(',
      'readSource(',
      'gh(',
      'ensureStackWithAuth(',
      'runningContainer(',
      'readHidden('
    ]) {
      const at = main.indexOf(call);
      assert.ok(at === -1 || at > take, `${call} runs before the key is taken`);
    }
  });

  it('keeps the password and the string out of a failed dump', () => {
    const password = 'fake-secret-pw';
    const url = `postgresql://postgres.fakeref:${password}@127.0.0.1:1/postgres`;
    const pgEnv = pgEnvFromUrl(url);
    assert.throws(
      () => dumpDatabase({ container: CONTAINER, pgEnv }),
      (err) =>
        /^pg_dump failed: /.test(err.message) &&
        !err.message.includes(password) &&
        !err.message.includes('postgresql://')
    );
  });
});
