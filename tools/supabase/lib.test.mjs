/*
  node:test over lib.mjs's pure logic. No filesystem, no process, no
  network - hand-built inputs, in the style of tools/artwork/lib.test.mjs.
*/
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PROJECTS,
  parseProjectArg,
  diffArgs,
  envRefs,
  parseEnvFile,
  missingEnv,
  MIGRATION_NAME_RE,
  pairMigrations,
  isAdditiveMarker,
  nonAdditiveStatements,
  readApplied,
  unapplied,
  markApplied,
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

describe('applied.json', () => {
  it('reads the two lists and refuses a malformed file', () => {
    assert.deepEqual(readApplied('{ "prod": [], "test": ["a"] }'), { prod: [], test: ['a'] });
    assert.throws(() => readApplied('{ "prod": [] }'), /"test" is not a list/);
    assert.throws(() => readApplied('{ "prod": [1], "test": [] }'), /"prod" is not a list/);
    assert.throws(() => readApplied('not json'));
  });

  it('lists a new migration as unapplied for one project only', () => {
    const applied = { prod: [M1], test: [M1, M2] };
    assert.deepEqual(unapplied([M2, M1], applied, 'prod'), [M2]);
    assert.deepEqual(unapplied([M1, M2], applied, 'test'), []);
  });

  it('marks migrations applied in order without duplicates', () => {
    const applied = { prod: [M1], test: [] };
    const next = markApplied(applied, 'prod', [M2, M1]);
    assert.deepEqual(next, { prod: [M1, M2], test: [] });
    assert.deepEqual(applied, { prod: [M1], test: [] });
  });
});
