/*
  node:test over lib.mjs's pure logic. No filesystem, no process, no
  network - hand-built inputs, in the style of tools/artwork/lib.test.mjs.
*/
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Encrypter, generateX25519Identity, identityToRecipient } from 'age-encryption';
import {
  PROJECTS,
  parseProjectArg,
  parseLimitsArgs,
  describeLimit,
  dbUrlProject,
  diffArgs,
  envRefs,
  parseEnvFile,
  missingEnv,
  MIGRATION_NAME_RE,
  pairMigrations,
  isAdditiveMarker,
  nonAdditiveStatements,
  migrationVersion,
  pendingMigrations,
  NOT_OWNED,
  splitDrift,
  driftSummary,
  localProjectId,
  isAgeIdentity,
  decryptAge,
  pickBackupArtifact,
  dumpRowCounts,
  dumpPublicTables,
  truncateStatement,
  drillReport,
  parseRestoreArgs,
  safetyStamp,
  staleSafetyStamps,
  dumpColumnValues,
  keyLiteral,
  authDeleteOrder,
  quoteQualified,
  keyDeleteStatements,
  sequenceGuard,
  cliShapedDataDump,
  receiptFor,
  addReceipt,
  checkReceipt,
  pgEnvFromUrl,
  prodReport
} from './lib.mjs';

const M1 = '20261001120000_lists.sql';
const M2 = '20261002120000_share_links.sql';

const change = (path, cls, declared) => ({
  path: path.split('.'),
  class: cls,
  declared,
  local: 1,
  remote: 2
});

describe('splitDrift', () => {
  const notOwnedRows = [...NOT_OWNED].map((p) => change(p, 'remote_only', false));

  it('reports no drift when only the undeclared not-owned rows differ', () => {
    const split = splitDrift(notOwnedRows);
    assert.equal(split.drift.length, 0);
    assert.equal(split.notOwned.length, 4);
    assert.equal(driftSummary(split), 'drift: none (4 not-owned)');
  });

  it('counts an owned update as drift beside the not-owned rows', () => {
    const owned = change('auth.minimum_password_length', 'update', true);
    const split = splitDrift([owned, ...notOwnedRows]);
    assert.deepEqual(split.drift, [owned]);
    assert.equal(driftSummary(split), 'drift: 1');
  });

  it('counts a not-owned path as drift once the file declares it or updates it', () => {
    const split = splitDrift([
      change('db.pooler.max_client_conn', 'remote_only', true),
      change('storage.vector.enabled', 'update', false)
    ]);
    assert.equal(split.drift.length, 2);
    assert.equal(split.notOwned.length, 0);
  });

  it('counts an undeclared remote_only path outside NOT_OWNED as drift', () => {
    const split = splitDrift([change('auth.sms.vonage.enabled', 'remote_only', false)]);
    assert.equal(driftSummary(split), 'drift: 1');
  });

  it('reads a missing changes list as no drift', () => {
    assert.equal(driftSummary(splitDrift(undefined)), 'drift: none (0 not-owned)');
  });
});

describe('parseProjectArg', () => {
  it('returns the ref of a known project', () => {
    assert.deepEqual(parseProjectArg(['--project', 'test']), {
      project: 'test',
      ref: PROJECTS.test,
      envFile: null
    });
    assert.equal(parseProjectArg(['--project=prod']).ref, PROJECTS.prod);
  });

  it('reads --env-file in both spellings', () => {
    assert.equal(
      parseProjectArg(['--project', 'prod', '--env-file', 'a.env']).envFile,
      'a.env'
    );
    assert.equal(parseProjectArg(['--env-file=b.env', '--project', 'prod']).envFile, 'b.env');
  });

  it('refuses an unknown or missing project and names the two values', () => {
    assert.throws(
      () => parseProjectArg(['--project', 'staging']),
      /--project test or --project prod/
    );
    assert.throws(() => parseProjectArg([]), /missing/);
    assert.throws(() => parseProjectArg(['--project', 'toString']), /toString/);
  });
});

describe('parseLimitsArgs', () => {
  const base = ['--project', 'test', '--user', 'gm@example.test', '--key', 'lists_per_owner'];

  it('reads each of the four modes', () => {
    assert.deepEqual(parseLimitsArgs([...base, '--value', '200']), {
      project: 'test',
      user: 'gm@example.test',
      key: 'lists_per_owner',
      mode: 'value',
      value: 200
    });
    assert.equal(parseLimitsArgs([...base, '--value', '0']).value, 0);
    assert.equal(parseLimitsArgs([...base, '--default']).mode, 'default');
    assert.equal(parseLimitsArgs([...base, '--clear']).mode, 'default');
    assert.deepEqual(parseLimitsArgs(['--project=prod', ...base.slice(2), '--unlimited']), {
      project: 'prod',
      user: 'gm@example.test',
      key: 'lists_per_owner',
      mode: 'unlimited',
      value: null
    });
  });

  it('refuses no mode, two modes, and --default with --clear', () => {
    assert.throws(() => parseLimitsArgs(base), /exactly one .*got 0/);
    assert.throws(() => parseLimitsArgs([...base, '--value', '2', '--unlimited']), /got 2/);
    assert.throws(() => parseLimitsArgs([...base, '--default', '--clear']), /got 2/);
  });

  it('refuses a value that is not a non-negative integer', () => {
    for (const bad of ['-1', '1.5', 'ten', '', '1e3', '99999999999']) {
      assert.throws(() => parseLimitsArgs([...base, '--value', bad]), /integer/, bad);
    }
    assert.throws(() => parseLimitsArgs([...base, '--value']), /missing/);
  });

  it('refuses a missing user, key or project, and an unknown argument', () => {
    assert.throws(
      () => parseLimitsArgs(['--project', 'test', '--key', 'k', '--default']),
      /user is missing/
    );
    assert.throws(
      () => parseLimitsArgs(['--project', 'test', '--user', 'u', '--default']),
      /key is missing/
    );
    assert.throws(() => parseLimitsArgs(base.slice(2).concat('--default')), /--project test/);
    assert.throws(() => parseLimitsArgs([...base, '--default', '--yes']), /--yes/);
  });
});

describe('describeLimit', () => {
  it('words an override and a default, each with a number or no limit', () => {
    assert.equal(describeLimit({ override: true, value: 200, fallback: 50 }), '200');
    assert.equal(describeLimit({ override: true, value: 0, fallback: 50 }), '0');
    assert.equal(describeLimit({ override: true, value: null, fallback: 50 }), 'unlimited');
    assert.equal(describeLimit({ override: false, value: null, fallback: 50 }), 'default 50');
    assert.equal(
      describeLimit({ override: false, value: null, fallback: null }),
      'default unlimited'
    );
  });
});

describe('dbUrlProject', () => {
  const pooler = (ref, extra = '') =>
    `postgresql://postgres.${ref}:p%40ss@aws-0-eu-west-1.pooler.supabase.com:5432/postgres${extra}`;
  const direct = (ref, user = 'postgres') =>
    `postgresql://${user}:x@db.${ref}.supabase.co:5432/postgres`;

  it('names the project of a session pooler string', () => {
    assert.equal(dbUrlProject(pooler(PROJECTS.test)), 'test');
    assert.equal(dbUrlProject(pooler(PROJECTS.prod)), 'prod');
  });

  it('names the project of a direct host with either user', () => {
    assert.equal(dbUrlProject(direct(PROJECTS.test)), 'test');
    assert.equal(dbUrlProject(direct(PROJECTS.prod, `postgres.${PROJECTS.prod}`)), 'prod');
    assert.equal(
      dbUrlProject(`postgres://postgres:x@db.${PROJECTS.test}.supabase.co/postgres`),
      'test'
    );
  });

  it('refuses a foreign ref, a mismatched user and a look-alike host', () => {
    assert.equal(dbUrlProject(pooler('abcdefghijklmnopqrst')), null);
    assert.equal(dbUrlProject(direct(PROJECTS.test, `postgres.${PROJECTS.prod}`)), null);
    assert.equal(
      dbUrlProject(`postgresql://postgres.${PROJECTS.test}:x@pooler.example.com:5432/postgres`),
      null
    );
    assert.equal(
      dbUrlProject(
        `postgresql://postgres:x@db.${PROJECTS.test}.supabase.co.example.com/postgres`
      ),
      null
    );
  });

  it('refuses a query string or a hash, which can move the target', () => {
    assert.equal(dbUrlProject(pooler(PROJECTS.test, '?sslmode=require')), null);
    assert.equal(dbUrlProject(pooler(PROJECTS.test, `?user=postgres.${PROJECTS.prod}`)), null);
    assert.equal(dbUrlProject(pooler(PROJECTS.test, '#x')), null);
  });

  it('refuses garbage, another scheme and a local stack', () => {
    assert.equal(dbUrlProject('garbage'), null);
    assert.equal(dbUrlProject(''), null);
    assert.equal(dbUrlProject(undefined), null);
    assert.equal(dbUrlProject(`https://db.${PROJECTS.test}.supabase.co/`), null);
    assert.equal(dbUrlProject('postgresql://postgres:postgres@127.0.0.1:54322/postgres'), null);
    assert.equal(
      dbUrlProject(`postgresql://postgres.${PROJECTS.test}%zz:x@x.pooler.supabase.com/p`),
      null
    );
  });
});

describe('diffArgs', () => {
  it('asks for JSON so an interactive terminal still gets a parseable diff', () => {
    const args = diffArgs(PROJECTS.test);
    assert.deepEqual(args.slice(0, 4), ['config', 'diff', '--project-ref', PROJECTS.test]);
    const i = args.indexOf('--output-format');
    assert.ok(i > 0);
    assert.equal(args[i + 1], 'json');
  });
});

describe('envRefs', () => {
  it('lists each env() name once, outside comments', () => {
    const toml = [
      '# secret = "env(COMMENTED_OUT)"',
      'client_id = "env(A_ID)"',
      'secret = "env(A_SECRET)"',
      '  # pass = "env(ALSO_COMMENTED)"',
      'again = "env(A_ID)"'
    ].join('\n');
    assert.deepEqual(envRefs(toml), ['A_ID', 'A_SECRET']);
  });

  it('returns an empty list for a file without references', () => {
    assert.deepEqual(envRefs('[api]\nenabled = true\n'), []);
  });
});

describe('parseEnvFile', () => {
  it('reads KEY=VALUE lines, quotes and export, and skips comments', () => {
    const text = [
      '# a comment',
      '',
      'PLAIN=one',
      'DOUBLE="two words"',
      "SINGLE='three'",
      'export EXPORTED=four',
      'EQUALS=a=b',
      'not a pair'
    ].join('\r\n');
    assert.deepEqual(parseEnvFile(text), {
      PLAIN: 'one',
      DOUBLE: 'two words',
      SINGLE: 'three',
      EXPORTED: 'four',
      EQUALS: 'a=b'
    });
  });

  it('keeps an unmatched quote as part of the value', () => {
    assert.equal(parseEnvFile('X="open').X, '"open');
  });
});

describe('missingEnv', () => {
  it('names only the absent or empty keys', () => {
    assert.deepEqual(missingEnv(['A', 'B', 'C'], { A: 'x', B: '' }), ['B', 'C']);
    assert.deepEqual(missingEnv(['A'], { A: 'x' }), []);
  });
});

describe('MIGRATION_NAME_RE', () => {
  it('accepts a timestamped snake_case name and refuses others', () => {
    assert.ok(MIGRATION_NAME_RE.test(M1));
    assert.ok(!MIGRATION_NAME_RE.test('2026_lists.sql'));
    assert.ok(!MIGRATION_NAME_RE.test('20261001120000_Lists.sql'));
    assert.ok(!MIGRATION_NAME_RE.test('20261001120000_lists.SQL'));
  });
});

describe('pairMigrations', () => {
  it('pairs each migration with its reversal, oldest first', () => {
    const { pairs, errors } = pairMigrations([M2, M1], [M1, M2]);
    assert.deepEqual(errors, []);
    assert.deepEqual(
      pairs.map((p) => p.name),
      [M1, M2]
    );
  });

  it('reports a missing reversal, an orphan reversal and a bad name', () => {
    const { pairs, errors } = pairMigrations([M1, 'bad.sql'], ['20261003120000_orphan.sql']);
    assert.deepEqual(pairs, []);
    assert.equal(errors.length, 3);
    assert.ok(errors.some((e) => e.startsWith(`${M1}: no reversal`)));
    assert.ok(errors.some((e) => e.startsWith('bad.sql: the name')));
    assert.ok(
      errors.some((e) => e.startsWith('20261003120000_orphan.sql: a reversal without'))
    );
  });

  it('is empty and clean for no migrations', () => {
    assert.deepEqual(pairMigrations([], []), { pairs: [], errors: [] });
  });
});

describe('isAdditiveMarker', () => {
  it('accepts exactly the marker, with or without a newline', () => {
    assert.ok(isAdditiveMarker('-- additive'));
    assert.ok(isAdditiveMarker('-- additive\n'));
    assert.ok(isAdditiveMarker('-- additive\r\n'));
  });

  it('refuses anything else', () => {
    assert.ok(!isAdditiveMarker('-- additive\ndrop table x;\n'));
    assert.ok(!isAdditiveMarker(' -- additive'));
    assert.ok(!isAdditiveMarker('drop table x;'));
  });
});

describe('nonAdditiveStatements', () => {
  it('flags a drop, a rename and a type change', () => {
    assert.equal(nonAdditiveStatements('drop table lists;').length, 1);
    assert.equal(nonAdditiveStatements('alter table lists rename to lists_old;').length, 1);
    assert.equal(nonAdditiveStatements('alter table x alter column y type text;').length, 1);
    assert.equal(nonAdditiveStatements('alter table x alter y set data type text;').length, 1);
    assert.equal(nonAdditiveStatements("alter type mood add value 'ok';").length, 1);
    assert.equal(nonAdditiveStatements('alter table x drop column y;').length, 1);
  });

  it('accepts a pure create and an added column', () => {
    const sql = [
      '-- drop nothing: this comment must not count',
      'create table lists (id uuid primary key);',
      '/* rename in a block comment */',
      'alter table lists add column title text;',
      'create index lists_title on lists (title);'
    ].join('\n');
    assert.deepEqual(nonAdditiveStatements(sql), []);
  });
});

describe('pending migrations', () => {
  it('reads the version as the 14 digits and gives null for a bad name', () => {
    assert.equal(migrationVersion(M1), '20261001120000');
    assert.equal(migrationVersion('0002_delete_account.sql'), null);
    assert.equal(migrationVersion('20261001120000_Lists.sql'), null);
  });

  it('lists the names whose version is not applied, sorted', () => {
    assert.deepEqual(pendingMigrations([M2, M1], ['20261001120000']), [M2]);
    assert.deepEqual(pendingMigrations([M1, M2], ['20261001120000', '20261002120000']), []);
  });

  it('lists a bad name as pending', () => {
    assert.deepEqual(pendingMigrations([M1, 'x.sql'], ['20261001120000']), ['x.sql']);
  });

  it('lists every migration when nothing is applied', () => {
    assert.deepEqual(pendingMigrations([M2, M1], []), [M1, M2]);
  });

  it('gives an empty list when there is no local migration', () => {
    assert.deepEqual(pendingMigrations([], ['20261001120000']), []);
  });
});

describe('localProjectId', () => {
  it('reads the top-level project_id', () => {
    assert.equal(
      localProjectId('# x\nproject_id = "daggerheart-loot"\n\n[api]\n'),
      'daggerheart-loot'
    );
  });

  it('gives null when the key is absent or only in a section', () => {
    assert.equal(localProjectId('[api]\nproject_id = "x"\n'), null);
    assert.equal(localProjectId(''), null);
  });

  it('ignores a commented line', () => {
    assert.equal(localProjectId('# project_id = "old"\n[api]\n'), null);
  });
});

describe('age keys and decryption', () => {
  it('accepts a generated identity and nothing else', async () => {
    const identity = await generateX25519Identity();
    assert.equal(identity.length, 74);
    assert.equal(isAgeIdentity(identity), true);
    assert.equal(isAgeIdentity(`${identity}\n`), true);
    assert.equal(isAgeIdentity(await identityToRecipient(identity)), false);
    assert.equal(isAgeIdentity(''), false);
    assert.equal(isAgeIdentity(undefined), false);
    assert.equal(isAgeIdentity(identity.toLowerCase()), false);
    assert.equal(isAgeIdentity(identity.slice(0, -1)), false);
  });

  it('decrypts what the recipient of the identity can open', async () => {
    const identity = await generateX25519Identity();
    const e = new Encrypter();
    e.addRecipient(await identityToRecipient(identity));
    const bytes = await e.encrypt('select 1;\n');
    const plain = await decryptAge(bytes, identity);
    assert.equal(new TextDecoder().decode(plain), 'select 1;\n');
  });

  it('turns a wrong identity into one message that names no key', async () => {
    const owner = await generateX25519Identity();
    const other = await generateX25519Identity();
    const e = new Encrypter();
    e.addRecipient(await identityToRecipient(owner));
    const bytes = await e.encrypt('select 1;\n');
    await assert.rejects(decryptAge(bytes, other), (err) => {
      assert.equal(err.message, 'the key does not open the file');
      assert.ok(!err.message.includes('AGE-SECRET-KEY'));
      return true;
    });
  });
});

describe('pickBackupArtifact', () => {
  const art = (name, expired = false) => ({
    name,
    expired,
    created_at: '2026-09-26T03:20:00Z'
  });

  it('takes the first backup artifact that has not expired', () => {
    assert.deepEqual(
      pickBackupArtifact([
        art('backup-2026-09-25', true),
        art('other'),
        art('backup-2026-09-26')
      ]),
      { name: 'backup-2026-09-26', createdAt: '2026-09-26T03:20:00Z' }
    );
  });

  it('skips a name that is not backup-<date>', () => {
    assert.equal(
      pickBackupArtifact([art('backup-latest'), art('backup-2026-09-26.zip')]),
      null
    );
  });

  it('gives null for no artifact', () => {
    assert.equal(pickBackupArtifact([]), null);
    assert.equal(pickBackupArtifact(undefined), null);
  });
});

describe('dumpRowCounts', () => {
  const EMAIL = 'drill-user@example.invalid';

  it('counts one row per statement and many rows per statement', () => {
    const text = [
      'SET session_replication_role = replica;',
      'INSERT INTO "public"."lists" ("id", "name") VALUES (\'a\', \'one\');',
      'INSERT INTO "public"."lists" ("id", "name") VALUES (\'b\', \'two\');',
      'INSERT INTO "auth"."users" ("id", "email") VALUES',
      "\t('u1', 'x@example.invalid'),",
      "\t('u2', 'y@example.invalid'),",
      "\t('u3', NULL);",
      'RESET ALL;'
    ].join('\n');
    assert.deepEqual(
      dumpRowCounts(text),
      new Map([
        ['public.lists', 2],
        ['auth.users', 3]
      ])
    );
  });

  it('reads through a string that holds quotes, brackets, a comment and a newline', () => {
    const tricky = "a ( b ) ; c '' d ),( e -- f\n g";
    const text = `INSERT INTO "public"."list_entries" ("id", "gm_note") VALUES ('e1', '${tricky.replace(/'/g, "''")}'), ('e2', 'plain');\n`;
    assert.deepEqual(dumpRowCounts(text), new Map([['public.list_entries', 2]]));
  });

  it('counts past OVERRIDING SYSTEM VALUE and ON CONFLICT', () => {
    const text =
      'INSERT INTO "auth"."refresh_tokens" ("id", "token") OVERRIDING SYSTEM VALUE VALUES (1, \'t\'), (2, \'u\') ON CONFLICT DO NOTHING;\n';
    assert.deepEqual(dumpRowCounts(text), new Map([['auth.refresh_tokens', 2]]));
  });

  it('counts the data lines of a COPY block', () => {
    const text = [
      'COPY "public"."lists" ("id", "name") FROM stdin;',
      'a\tone',
      'b\ttwo',
      'c\tthree',
      '\\.',
      "INSERT INTO public.user_prefs (user_id) VALUES ('u1');",
      ''
    ].join('\n');
    assert.deepEqual(
      dumpRowCounts(text),
      new Map([
        ['public.lists', 3],
        ['public.user_prefs', 1]
      ])
    );
  });

  it('skips psql meta lines and comments', () => {
    const text = [
      '\\restrict abc',
      '-- \\restrict abc',
      '-- INSERT INTO "public"."lists" VALUES (\'x\');',
      'INSERT INTO "public"."lists" ("id") VALUES (\'a\');',
      '\\unrestrict abc'
    ].join('\n');
    assert.deepEqual(dumpRowCounts(text), new Map([['public.lists', 1]]));
  });

  it('gives an empty map for empty text', () => {
    assert.deepEqual(dumpRowCounts(''), new Map());
  });

  it('throws on an unterminated string without quoting the dump', () => {
    const text = `INSERT INTO "auth"."users" ("email") VALUES ('${EMAIL});\n`;
    assert.throws(
      () => dumpRowCounts(text),
      (err) => {
        assert.equal(err.message, 'the dump has an unterminated string or statement');
        assert.ok(!err.message.includes(EMAIL));
        return true;
      }
    );
  });

  it('throws on an unterminated statement', () => {
    assert.throws(
      () => dumpRowCounts('INSERT INTO "public"."lists" VALUES (1)'),
      /unterminated/
    );
  });
});

describe('dumpPublicTables', () => {
  it('reads quoted, unquoted and IF NOT EXISTS names of the public schema only', () => {
    const schema = [
      'CREATE TABLE IF NOT EXISTS "public"."lists" (',
      '  "id" "uuid" NOT NULL',
      ');',
      'CREATE TABLE public.user_prefs (user_id uuid);',
      'create table "public"."odd""name" (x int);',
      'CREATE TABLE "auth"."users" (id uuid);',
      'CREATE TABLE IF NOT EXISTS "storage"."objects" (id uuid);',
      'CREATE TABLE "public"."lists" (id uuid);'
    ].join('\n');
    assert.deepEqual(dumpPublicTables(schema), ['lists', 'odd"name', 'user_prefs']);
  });

  it('gives an empty list for no table', () => {
    assert.deepEqual(dumpPublicTables('CREATE SCHEMA x;'), []);
  });
});

describe('truncateStatement', () => {
  it('quotes each public table and doubles a quote inside a name', () => {
    assert.equal(
      truncateStatement(['lists', 'odd"name']),
      'TRUNCATE TABLE "public"."lists", "public"."odd""name" CASCADE;\n'
    );
  });

  it('gives an empty string for no table', () => {
    assert.equal(truncateStatement([]), '');
  });
});

describe('drillReport', () => {
  const EMAIL = 'drill-user@example.invalid';
  const base = () => ({
    artifact: { name: 'backup-2026-09-26', runId: 123, ageDays: 0 },
    failure: null,
    decrypted: true,
    dumpTables: ['limit_defaults', 'lists'],
    localTables: ['limit_defaults', 'lists'],
    load: { ok: true },
    counts: new Map([
      ['auth.identities', { loaded: 2, dump: 2 }],
      ['auth.sessions', { loaded: 1, dump: 1 }],
      ['auth.users', { loaded: 2, dump: 2 }],
      ['public.limit_defaults', { loaded: 2, dump: 2 }],
      ['public.lists', { loaded: 5, dump: 5 }]
    ]),
    cleanup: { tempRemoved: true, reset: true }
  });
  const noEmail = (lines) =>
    assert.ok(
      lines.every((l) => !l.includes(EMAIL)),
      lines.join('\n')
    );

  it('passes when every step and every count matches', () => {
    const { pass, lines } = drillReport(base());
    assert.equal(pass, true);
    assert.deepEqual(lines, [
      'artifact: backup-2026-09-26 (run 123, 0 d old)',
      'decrypt: schema.sql.age ok, data.sql.age ok',
      'schema: 2 public tables in the dump, 2 local; missing locally: none',
      'load: ok (1 transaction)',
      'rows (loaded / in dump):',
      '  auth.users 2 / 2',
      '  public.limit_defaults 2 / 2',
      '  public.lists 5 / 5',
      '  auth: 2 other tables match (auth.identities, auth.sessions)',
      'cleanup: temp files deleted, local database reset'
    ]);
    noEmail(lines);
  });

  it('fails on a count mismatch and lists the auth table that differs', () => {
    const input = base();
    input.counts.set('public.lists', { loaded: 4, dump: 5 });
    input.counts.set('auth.sessions', { loaded: 0, dump: 1 });
    const { pass, lines } = drillReport(input);
    assert.equal(pass, false);
    assert.ok(lines.includes('  public.lists 4 / 5 MISMATCH'));
    assert.ok(lines.includes('  auth.sessions 0 / 1 MISMATCH'));
    assert.ok(lines.includes('  auth.identities 2 / 2'));
    noEmail(lines);
  });

  it('fails when the dump has a table the migrations do not make', () => {
    const input = {
      ...base(),
      dumpTables: ['limit_defaults', 'lists', 'new_table'],
      load: { ok: false, skipped: true },
      counts: null
    };
    const { pass, lines } = drillReport(input);
    assert.equal(pass, false);
    assert.ok(
      lines.includes('schema: 3 public tables in the dump, 2 local; missing locally: new_table')
    );
    assert.ok(
      lines.includes(
        'FAIL: production has a table the migrations do not make: public.new_table'
      )
    );
    assert.ok(lines.includes('load: skipped (the schema check failed)'));
  });

  it('names a local table that the dump lacks without failing', () => {
    const input = { ...base(), localTables: ['limit_defaults', 'lists', 'user_prefs'] };
    const { pass, lines } = drillReport(input);
    assert.equal(pass, true);
    assert.ok(lines.includes('info: local tables not in the dump: public.user_prefs'));
  });

  it('fails a load with the SQLSTATE, the dump line and a hint', () => {
    const input = {
      ...base(),
      load: { ok: false, sqlstate: '42703', line: 812, status: 3 },
      counts: null
    };
    const { pass, lines } = drillReport(input);
    assert.equal(pass, false);
    assert.ok(
      lines.includes(
        'load: FAIL SQLSTATE 42703 at dump line 812 (a column the backup names is missing locally - hosted Auth may be newer than the pinned CLI)'
      ),
      lines.join('\n')
    );
    const bare = drillReport({
      ...input,
      load: { ok: false, sqlstate: '22P02', line: 3, status: 3 }
    });
    assert.ok(bare.lines.includes('load: FAIL SQLSTATE 22P02 at dump line 3'));
    const none = drillReport({ ...input, load: { ok: false, status: 1 } });
    assert.ok(
      none.lines.includes('load: FAIL psql exited with status 1; no SQLSTATE was reported')
    );
    noEmail(lines);
  });

  it('turns a PASS into a FAIL when the cleanup failed', () => {
    const { pass, lines } = drillReport({
      ...base(),
      cleanup: { tempRemoved: true, reset: false }
    });
    assert.equal(pass, false);
    assert.match(lines.at(-1), /^cleanup: FAIL the local database was not reset/);
    assert.match(lines.at(-1), /db reset --local$/);
  });

  it('fails a drill that stopped early and says the stack was not reached', () => {
    const { pass, lines } = drillReport({
      artifact: null,
      failure: 'Docker did not answer in 20 s.',
      decrypted: false,
      dumpTables: null,
      localTables: null,
      load: null,
      counts: null,
      cleanup: { tempRemoved: true, reset: null }
    });
    assert.equal(pass, false);
    assert.deepEqual(lines, [
      'FAIL: Docker did not answer in 20 s.',
      'cleanup: temp files deleted; the drill stopped before the local stack'
    ]);
  });

  it('warns on a backup older than 2 days and keeps the verdict', () => {
    const input = base();
    input.artifact.ageDays = 3;
    const { pass, lines } = drillReport(input);
    assert.equal(pass, true);
    assert.ok(
      lines.includes('WARN: the newest backup is 3 days old; the nightly backup may be failing')
    );
    const fresh = base();
    fresh.artifact.ageDays = 2;
    assert.ok(!drillReport(fresh).lines.some((l) => l.startsWith('WARN')));
  });

  it('names a safety backup as the source and never warns on its age', () => {
    const { pass, lines } = drillReport({
      ...base(),
      artifact: { safety: '20260927T101500Z' }
    });
    assert.equal(pass, true);
    assert.equal(lines[0], 'source: safety 20260927T101500Z');
    assert.ok(!lines.some((l) => l.startsWith('WARN')));
  });
});

describe('parseRestoreArgs', () => {
  it('reads a date, a run id and a safety stamp in both spellings', () => {
    assert.deepEqual(parseRestoreArgs([]), { source: null });
    assert.deepEqual(parseRestoreArgs(['--backup', '2026-09-27']), {
      source: { kind: 'backup', date: '2026-09-27' }
    });
    assert.deepEqual(parseRestoreArgs(['--backup=18123456789']), {
      source: { kind: 'backup', runId: '18123456789' }
    });
    assert.deepEqual(parseRestoreArgs(['--safety', '20260927T101500Z']), {
      source: { kind: 'safety', stamp: '20260927T101500Z' }
    });
  });

  it('refuses both sources, an unknown argument and a bad or missing value', () => {
    assert.throws(
      () => parseRestoreArgs(['--backup', '2026-09-27', '--safety', '20260927T101500Z']),
      /Two sources/
    );
    assert.throws(() => parseRestoreArgs(['--db-url', 'x']), /Unknown argument/);
    assert.throws(() => parseRestoreArgs(['--backup', 'latest']), /bad value/);
    assert.throws(() => parseRestoreArgs(['--safety', '2026-09-27']), /bad value/);
    assert.throws(() => parseRestoreArgs(['--backup']), /missing or bad value/);
  });
});

describe('safety stamps', () => {
  it('stamps a time to the second in UTC', () => {
    assert.equal(safetyStamp(new Date('2026-09-27T10:15:00.123Z')), '20260927T101500Z');
  });

  it('lists the stamps older than 30 days and never another name', () => {
    const now = new Date('2026-10-30T00:00:00Z');
    assert.deepEqual(
      staleSafetyStamps(['20260927T101500Z', '20261001T000000Z', 'notes', '.tmp'], now),
      ['20260927T101500Z']
    );
    assert.deepEqual(staleSafetyStamps(['20261029T000000Z'], now, 0), ['20261029T000000Z']);
  });
});

describe('dumpColumnValues', () => {
  const dump = [
    'SET session_replication_role = replica;',
    'INSERT INTO "auth"."users" ("instance_id", "id", "email", "raw") VALUES',
    "\t(NULL, 'a0000000-0000-4000-8000-000000000001', 'x@example.invalid', 'a, b '') (c'),",
    "\t(NULL, 'a0000000-0000-4000-8000-000000000002', NULL, '{\"k\": [1, 2]}');",
    'INSERT INTO "auth"."refresh_tokens" ("id", "token") VALUES (1, \'t\'), (22, \'u\');',
    'INSERT INTO "auth"."users" ("id") VALUES (\'a0000000-0000-4000-8000-000000000003\');',
    'SELECT pg_catalog.setval(\'"auth"."refresh_tokens_id_seq"\', 22, true);',
    'RESET ALL;'
  ].join('\n');

  it('returns the column of every row, across statements and past odd strings', () => {
    assert.deepEqual(dumpColumnValues(dump, 'auth.users', 'id'), [
      "'a0000000-0000-4000-8000-000000000001'",
      "'a0000000-0000-4000-8000-000000000002'",
      "'a0000000-0000-4000-8000-000000000003'"
    ]);
    assert.deepEqual(dumpColumnValues(dump, 'auth.refresh_tokens', 'id'), ['1', '22']);
    // The third users statement names only "id", so the other columns are
    // read from the first statement alone.
    const first = dump.slice(0, dump.indexOf('INSERT INTO "auth"."refresh_tokens"'));
    assert.equal(dumpColumnValues(first, 'auth.users', 'raw')[0], "'a, b '') (c'");
    assert.equal(dumpColumnValues(first, 'auth.users', 'instance_id')[1], 'NULL');
    assert.throws(() => dumpColumnValues(dump, 'auth.users', 'raw'), /no column raw/);
    assert.deepEqual(dumpColumnValues(dump, 'auth.sessions', 'id'), []);
  });

  it('refuses a missing column and a COPY block without quoting a value', () => {
    assert.throws(
      () => dumpColumnValues(dump, 'auth.refresh_tokens', 'session_id'),
      (err) => /no column session_id/.test(err.message) && !err.message.includes("'t'")
    );
    const copy = 'COPY "auth"."users" ("id") FROM stdin;\nabc\n\\.\n';
    assert.throws(() => dumpColumnValues(copy, 'auth.users', 'id'), /COPY rows/);
  });
});

describe('keyLiteral', () => {
  it('accepts a quoted uuid and a bare integer and refuses anything else', () => {
    assert.equal(
      keyLiteral("'a0000000-0000-4000-8000-000000000001'"),
      "'a0000000-0000-4000-8000-000000000001'"
    );
    assert.equal(keyLiteral('42'), '42');
    for (const bad of ['NULL', "'x'); drop table t; --'", "'secret@example.invalid'", '-1']) {
      assert.throws(
        () => keyLiteral(bad),
        (err) => err.message === 'a key of the dump is not a uuid or an integer'
      );
    }
  });
});

describe('authDeleteOrder', () => {
  const measured = [
    { from: 'auth.identities', to: 'auth.users' },
    { from: 'auth.sessions', to: 'auth.users' },
    { from: 'auth.refresh_tokens', to: 'auth.sessions' },
    { from: 'auth.mfa_amr_claims', to: 'auth.sessions' }
  ];
  const tables = [
    'auth.users',
    'auth.sessions',
    'auth.identities',
    'auth.refresh_tokens',
    'auth.mfa_amr_claims',
    'auth.flow_state'
  ];

  it('orders the measured graph children first, ties by name', () => {
    assert.deepEqual(authDeleteOrder(tables, measured), [
      'auth.flow_state',
      'auth.identities',
      'auth.mfa_amr_claims',
      'auth.refresh_tokens',
      'auth.sessions',
      'auth.users'
    ]);
  });

  it('ignores an edge to a table not dumped and a self reference', () => {
    assert.deepEqual(
      authDeleteOrder(
        ['auth.users', 'auth.refresh_tokens'],
        [...measured, { from: 'auth.users', to: 'auth.users' }]
      ),
      ['auth.refresh_tokens', 'auth.users']
    );
  });

  it('refuses a cycle', () => {
    assert.throws(
      () =>
        authDeleteOrder(
          ['auth.a', 'auth.b'],
          [
            { from: 'auth.a', to: 'auth.b' },
            { from: 'auth.b', to: 'auth.a' }
          ]
        ),
      /cycle/
    );
  });
});

describe('keyDeleteStatements', () => {
  it('deletes in the given order, 1000 keys per statement, and skips an empty table', () => {
    const ids = Array.from({ length: 1001 }, (_, i) => String(i + 1));
    const text = keyDeleteStatements(
      ['auth.refresh_tokens', 'auth.sessions', 'auth.users'],
      new Map([
        ['auth.refresh_tokens', ids],
        ['auth.users', ["'a0000000-0000-4000-8000-000000000001'"]]
      ]),
      new Map([
        ['auth.refresh_tokens', 'id'],
        ['auth.sessions', 'id'],
        ['auth.users', 'id']
      ])
    );
    const lines = text.trim().split('\n');
    assert.equal(lines.length, 3);
    assert.ok(lines[0].startsWith('DELETE FROM "auth"."refresh_tokens" WHERE "id" IN (1, 2, '));
    assert.ok(lines[0].endsWith(', 1000);'));
    assert.equal(lines[1], 'DELETE FROM "auth"."refresh_tokens" WHERE "id" IN (1001);');
    assert.equal(
      lines[2],
      'DELETE FROM "auth"."users" WHERE "id" IN (\'a0000000-0000-4000-8000-000000000001\');'
    );
    assert.equal(keyDeleteStatements(['auth.users'], new Map(), new Map()), '');
  });

  it('refuses a table without a single key column before any statement', () => {
    assert.throws(
      () =>
        keyDeleteStatements(
          ['auth.users', 'auth.odd'],
          new Map([
            ['auth.users', ['1']],
            ['auth.odd', ['2']]
          ]),
          new Map([
            ['auth.users', 'id'],
            ['auth.odd', null]
          ])
        ),
      /auth\.odd has no single-column primary key/
    );
  });

  it('refuses a key that is not a uuid or an integer', () => {
    assert.throws(
      () =>
        keyDeleteStatements(
          ['auth.users'],
          new Map([['auth.users', ["'x'"]]]),
          new Map([['auth.users', 'id']])
        ),
      /not a uuid or an integer/
    );
  });
});

describe('quoteQualified and sequenceGuard', () => {
  it('quotes both parts of a name', () => {
    assert.equal(quoteQualified('auth.refresh_tokens'), '"auth"."refresh_tokens"');
    assert.equal(quoteQualified('public.a"b'), '"public"."a""b"');
  });

  it('keeps the old value and the column maximum with GREATEST, all names qualified', () => {
    const { before, after } = sequenceGuard([
      { seq: 'auth.refresh_tokens_id_seq', table: 'auth.refresh_tokens', column: 'id' }
    ]);
    assert.equal(
      before,
      'CREATE TEMP TABLE restore_seq_before ON COMMIT DROP AS SELECT \'"auth"."refresh_tokens_id_seq"\'::text AS seq, last_value FROM "auth"."refresh_tokens_id_seq";\n'
    );
    assert.equal(
      after,
      'SELECT pg_catalog.setval(\'"auth"."refresh_tokens_id_seq"\', GREATEST(COALESCE((SELECT max("id") FROM "auth"."refresh_tokens"), 1), (SELECT last_value FROM pg_temp.restore_seq_before WHERE seq = \'"auth"."refresh_tokens_id_seq"\')), true);\n'
    );
    assert.deepEqual(sequenceGuard([]), { before: '', after: '' });
  });

  it('joins two sequences into one temp table', () => {
    const { before, after } = sequenceGuard([
      { seq: 'auth.a_seq', table: 'auth.a', column: 'id' },
      { seq: 'public.b_seq', table: 'public.b', column: 'n' }
    ]);
    assert.equal(before.split(' UNION ALL ').length, 2);
    assert.equal(after.trim().split('\n').length, 2);
  });
});

describe('cliShapedDataDump', () => {
  it('adds the replication role and RESET ALL and comments out the restrict lines', () => {
    const text = cliShapedDataDump(
      '\\restrict abc\nINSERT INTO "public"."t" ("a") VALUES (1);\n\\unrestrict abc'
    );
    assert.equal(
      text,
      'SET session_replication_role = replica;\n-- \\restrict abc\nINSERT INTO "public"."t" ("a") VALUES (1);\n-- \\unrestrict abc\nRESET ALL;\n'
    );
    assert.deepEqual([...dumpRowCounts(text)], [['public.t', 1]]);
  });
});

describe('receipts', () => {
  const at = new Date('2026-09-27T10:00:00Z');
  const receipt = receiptFor({
    source: 'run 123',
    schemaHash: 's1',
    dataHash: 'd1',
    // A count the caller passes is not recorded: nothing reads it.
    counts: new Map([['public.lists', 2]]),
    newestMigration: '20260925130300_lists_service_role.sql',
    host: 'owner-pc',
    at
  });
  const want = {
    sourceId: 'run 123',
    dataHash: 'd1',
    newestMigration: '20260925130300_lists_service_role.sql',
    host: 'owner-pc',
    now: new Date('2026-09-27T12:00:00Z')
  };

  it('records the source, hashes, migration, host and time, and no row count', () => {
    assert.deepEqual(receipt, {
      source: 'run 123',
      schemaHash: 's1',
      dataHash: 'd1',
      newestMigration: '20260925130300_lists_service_role.sql',
      host: 'owner-pc',
      at: '2026-09-27T10:00:00.000Z'
    });
  });

  it('keeps the newest first, one per source, at most 20', () => {
    let list = [];
    for (let i = 0; i < 25; i++) list = addReceipt(list, { ...receipt, source: `run ${i}` });
    assert.equal(list.length, 20);
    assert.equal(list[0].source, 'run 24');
    list = addReceipt(list, { ...receipt, source: 'run 10', dataHash: 'new' });
    assert.equal(list.filter((r) => r.source === 'run 10').length, 1);
    assert.equal(list[0].dataHash, 'new');
  });

  it('accepts a matching receipt and names each reason it refuses', () => {
    assert.deepEqual(checkReceipt([receipt], want), { ok: true, receipt });
    assert.deepEqual(checkReceipt([], want), { ok: false, reason: 'none' });
    assert.deepEqual(checkReceipt([receipt], { ...want, sourceId: 'run 124' }), {
      ok: false,
      reason: 'none'
    });
    assert.deepEqual(
      checkReceipt([receipt], { ...want, now: new Date('2026-09-28T11:00:00Z') }),
      { ok: false, reason: 'older than 24 h' }
    );
    assert.deepEqual(checkReceipt([receipt], { ...want, dataHash: 'd2' }), {
      ok: false,
      reason: 'other data'
    });
    assert.deepEqual(checkReceipt([receipt], { ...want, newestMigration: 'x.sql' }), {
      ok: false,
      reason: 'other newest migration'
    });
    assert.deepEqual(checkReceipt([receipt], { ...want, host: 'laptop' }), {
      ok: false,
      reason: 'other host'
    });
  });
});

describe('pgEnvFromUrl', () => {
  const PASSWORD = 'p@ss:w/rd';
  const url = `postgresql://postgres.${PROJECTS.prod}:${encodeURIComponent(PASSWORD)}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`;

  it('returns the libpq variables with the user and password decoded', () => {
    assert.deepEqual(pgEnvFromUrl(url), {
      PGHOST: 'aws-0-eu-central-1.pooler.supabase.com',
      PGPORT: '5432',
      PGUSER: `postgres.${PROJECTS.prod}`,
      PGPASSWORD: PASSWORD,
      PGDATABASE: 'postgres',
      PGSSLMODE: 'require'
    });
    const bare = pgEnvFromUrl('postgres://u:p@h');
    assert.equal(bare.PGPORT, '5432');
    assert.equal(bare.PGDATABASE, 'postgres');
  });

  it('refuses a query string or another scheme and quotes no part of the string', () => {
    for (const bad of [`${url}?sslmode=require`, url.replace('postgresql:', 'mysql:'), 'x']) {
      assert.throws(
        () => pgEnvFromUrl(bad),
        (err) =>
          !err.message.includes('p%40ss') &&
          !err.message.includes(PASSWORD) &&
          !err.message.includes(PROJECTS.prod)
      );
    }
  });
});

describe('prodReport', () => {
  const EMAIL = 'prod-user@example.invalid';
  const base = () => ({
    failure: null,
    source: { name: 'backup-2026-09-27 (run 123)' },
    receipt: { at: '2026-09-27T10:02:00.000Z' },
    target: { publicTables: 2 },
    safety: { dir: '/x/.restore-safety/20260927T101500Z' },
    rows: [
      { table: 'auth.users', now: 5, backup: 4 },
      { table: 'public.lists', now: 12, backup: 9 }
    ],
    confirmed: true,
    load: { ok: true },
    verify: {
      tables: 3,
      mismatches: [],
      sequences: [{ seq: 'auth.refresh_tokens_id_seq', ok: true }]
    }
  });
  const noEmail = (lines) =>
    assert.ok(
      lines.every((l) => !l.includes(EMAIL)),
      lines.join('\n')
    );

  it('passes a restore that loaded and verified', () => {
    const { verdict, pass, lines } = prodReport(base());
    assert.equal(verdict, 'PASS');
    assert.equal(pass, true);
    assert.deepEqual(lines, [
      'source: backup-2026-09-27 (run 123), receipt 2026-09-27 10:02 UTC ok',
      'target: migrations match; 2 public tables present',
      'safety backup: /x/.restore-safety/20260927T101500Z (schema.sql.age, data.sql.age)',
      'rows (production now -> backup):',
      '  auth.users 5 -> 4',
      '  public.lists 12 -> 9',
      'confirm: typed ref ok',
      'load: ok (1 transaction)',
      'verify: 3 tables match; sequences not lowered: auth.refresh_tokens_id_seq',
      'undo: npm run restore:drill -- --safety 20260927T101500Z, then npm run restore:prod -- --safety 20260927T101500Z'
    ]);
    noEmail(lines);
  });

  it('aborts on a wrong ref and keeps the safety backup', () => {
    const { verdict, lines } = prodReport({
      ...base(),
      confirmed: false,
      load: undefined,
      verify: undefined
    });
    assert.equal(verdict, 'ABORTED');
    assert.deepEqual(lines.slice(-2), [
      'confirm: the typed text is not the production ref; nothing was written',
      'safety backup kept: /x/.restore-safety/20260927T101500Z; production is unchanged'
    ]);
  });

  it('fails a refusal before the safety backup', () => {
    const { verdict, lines } = prodReport({
      source: { name: 'safety 20260927T101500Z' },
      failure: 'no passed drill (receipt: none); nothing was written'
    });
    assert.equal(verdict, 'FAIL');
    assert.deepEqual(lines, [
      'source: safety 20260927T101500Z',
      'FAIL: no passed drill (receipt: none); nothing was written'
    ]);
  });

  it('fails a load with the SQLSTATE and says production is unchanged', () => {
    const { verdict, lines } = prodReport({
      ...base(),
      load: { ok: false, sqlstate: '42501', line: 3, status: 3 },
      verify: undefined
    });
    assert.equal(verdict, 'FAIL');
    assert.ok(
      lines.includes(
        'load: FAIL SQLSTATE 42501 at dump line 3 (the database user may not run a statement of the load, for example SET session_replication_role)'
      ),
      lines.join('\n')
    );
    assert.ok(lines.includes('  production is unchanged: the transaction rolled back'));
    assert.equal(
      lines.at(-1),
      'safety backup kept: /x/.restore-safety/20260927T101500Z; production is unchanged'
    );
    noEmail(lines);
  });

  it('claims no rollback when psql stopped without an SQL error, and names the undo', () => {
    for (const load of [
      { ok: false, status: 'error' },
      { ok: false, status: 1 }
    ]) {
      const { verdict, lines } = prodReport({ ...base(), load, verify: undefined });
      assert.equal(verdict, 'FAIL');
      assert.ok(!lines.some((l) => l.includes('unchanged')), lines.join('\n'));
      assert.ok(
        lines.includes(
          '  production state is unknown: psql stopped without an SQL error; compare the counts with a drill of the backup, and run the undo line if they differ'
        )
      );
      assert.match(lines.at(-1), /^undo: npm run restore:drill -- --safety 20260927T101500Z/);
    }
    const exit3 = prodReport({ ...base(), load: { ok: false, status: 3 }, verify: undefined });
    assert.ok(exit3.lines.includes('  production is unchanged: the transaction rolled back'));
  });

  it('fails a verify mismatch and a lowered sequence and names the undo', () => {
    const { verdict, lines } = prodReport({
      ...base(),
      verify: {
        tables: 3,
        mismatches: [{ name: 'public.lists', got: 8, want: 9 }],
        sequences: [{ seq: 'auth.refresh_tokens_id_seq', ok: false }]
      }
    });
    assert.equal(verdict, 'FAIL');
    assert.ok(lines.includes('verify: FAIL'));
    assert.ok(lines.includes('  public.lists 8 / 9 MISMATCH'));
    assert.ok(
      lines.includes("  auth.refresh_tokens_id_seq is below its column's highest value")
    );
    assert.match(lines.at(-1), /^undo: npm run restore:drill -- --safety 20260927T101500Z/);
  });

  it('grows its lines as the state grows, so a prefix can be printed early', () => {
    const early = { ...base(), confirmed: undefined, load: undefined, verify: undefined };
    const first = prodReport(early).lines;
    assert.equal(first.at(-1), '  public.lists 12 -> 9');
    for (const done of [base(), { ...early, confirmed: false }]) {
      assert.deepEqual(prodReport(done).lines.slice(0, first.length), first);
    }
  });
});
