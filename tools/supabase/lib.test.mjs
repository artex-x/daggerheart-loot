/*
  node:test over lib.mjs's pure logic. No filesystem, no process, no
  network - hand-built inputs, in the style of tools/artwork/lib.test.mjs.
*/
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
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
  driftSummary
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
