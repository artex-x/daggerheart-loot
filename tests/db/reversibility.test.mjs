/*
  The migration reversibility gate. Every file in supabase/migrations/ has a
  reversal of the same name in supabase/reversals/, either real SQL or the
  marker `-- additive` (allowed only when the migration drops, renames or
  retypes nothing). The up-down-up gate snapshots the schema with every
  migration applied, applies the reversals newest first and the migrations
  oldest first again, and requires the same snapshot. The fixtures prove
  the gate in both directions on a scratch schema.
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  pairMigrations,
  isAdditiveMarker,
  nonAdditiveStatements
} from '../../tools/supabase/lib.mjs';
import { applySql, connect, snapshot } from './roles.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SUPABASE = path.resolve(HERE, '..', '..', 'supabase');
const FIXTURE_SCHEMA = 'gate_fixture';

function sqlFiles(dir) {
  const full = path.join(SUPABASE, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((n) => n.endsWith('.sql'))
    .sort();
}

function read(...parts) {
  return readFileSync(path.join(...parts), 'utf8');
}

/** Returns the lines only in `a` (`- `) and only in `b` (`+ `), at most
 * ten, ignoring blank lines. */
function lineDiff(a, b) {
  const lines = (s) => s.split(/\r?\n/).filter((l) => l.trim());
  const inA = lines(a);
  const inB = lines(b);
  const setA = new Set(inA);
  const setB = new Set(inB);
  const out = [
    ...inA.filter((l) => !setB.has(l)).map((l) => `- ${l}`),
    ...inB.filter((l) => !setA.has(l)).map((l) => `+ ${l}`)
  ];
  return out.slice(0, 10);
}

/** Runs up-down-up over `steps` ({ up, down } texts, oldest first) with
 * every up already applied, and returns the problems found. With `base`
 * (the snapshot before any up), it also requires the reversals to restore
 * it. */
async function upDownUp(sql, schemas, steps, base = null) {
  const problems = [];
  const snapA = snapshot(schemas);
  try {
    for (const step of [...steps].reverse()) await applySql(sql, step.down);
  } catch (err) {
    return [`a reversal failed: ${err.message}`];
  }
  if (base !== null) {
    const diff = lineDiff(base, snapshot(schemas));
    if (diff.length)
      problems.push(`the reversals do not restore the schema:\n${diff.join('\n')}`);
  }
  try {
    for (const step of steps) await applySql(sql, step.up);
  } catch (err) {
    problems.push(`a migration failed after its reversal: ${err.message}`);
    return problems;
  }
  const diff = lineDiff(snapA, snapshot(schemas));
  if (diff.length) problems.push(`up-down-up changed the schema:\n${diff.join('\n')}`);
  return problems;
}

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

describe('supabase/migrations', () => {
  const migrations = sqlFiles('migrations');
  const reversals = sqlFiles('reversals');
  const { pairs, errors } = pairMigrations(migrations, reversals);

  it('pairs every migration with a reversal', () => {
    assert.deepEqual(errors, []);
  });

  it('marks a reversal additive only when its migration removes nothing', () => {
    const wrong = pairs
      .filter((p) => isAdditiveMarker(read(SUPABASE, 'reversals', p.name)))
      .filter((p) => nonAdditiveStatements(read(SUPABASE, 'migrations', p.name)).length)
      .map((p) => p.name);
    assert.deepEqual(wrong, []);
  });

  it('survives up-down-up', async (t) => {
    const steps = pairs
      .filter((p) => !isAdditiveMarker(read(SUPABASE, 'reversals', p.name)))
      .map((p) => ({
        up: read(SUPABASE, 'migrations', p.name),
        down: read(SUPABASE, 'reversals', p.name)
      }));
    if (!steps.length) {
      t.diagnostic('no migrations yet');
      return;
    }
    assert.deepEqual(await upDownUp(sql, ['public'], steps), []);
  });
});

describe('the gate on its fixtures', () => {
  async function runFixture(name) {
    const dir = path.join(HERE, 'fixtures', name);
    const step = { up: read(dir, 'up.sql'), down: read(dir, 'down.sql') };
    await sql.unsafe(`drop schema if exists ${FIXTURE_SCHEMA} cascade`);
    try {
      const base = snapshot([FIXTURE_SCHEMA]);
      await applySql(sql, step.up);
      return await upDownUp(sql, [FIXTURE_SCHEMA], [step], base);
    } finally {
      await sql.unsafe(`drop schema if exists ${FIXTURE_SCHEMA} cascade`);
    }
  }

  it('passes a complete reversal', async () => {
    assert.deepEqual(await runFixture('good'), []);
  });

  it('fails a reversal that leaves an object behind, and names it', async () => {
    const problems = await runFixture('bad');
    assert.ok(problems.length > 0, 'the bad fixture passed the gate');
    const text = problems.join('\n');
    assert.match(text, /do not restore the schema/);
    assert.match(text, /gate_fixture/);
  });
});
