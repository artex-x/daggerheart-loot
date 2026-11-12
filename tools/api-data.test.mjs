// tools/api-data.mjs on the real data.js: the projections hold the pools the app draws, every
// record sits in one chunk, `rev` moves with the record, every file keeps its schema and its
// budget at today's size and at three times it. `npm run check` runs it as part of the stage
// test:preview with the ts hooks (tools/check/lib.mjs).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { RARITIES, altPicks } from '../app/src/lib/alt.ts';
import { buildIndex } from '../app/src/lib/data.ts';
import { dict } from '../app/src/lib/dict.ts';
import { rollPool } from '../app/src/lib/roll.ts';
import { PICKER_ROLL, ROLL_MODES, rowsOf } from '../app/src/lib/rollTables.ts';
import { poolFor } from '../app/src/lib/std.ts';
import { SECTIONS } from '../app/src/lib/types.ts';
import { BUDGET, budgetOf, readAudit, renderApiData, rollIdOf } from './api-data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
globalThis.window = {};
createRequire(import.meta.url)(join(ROOT, 'data.js'));
const LOOT = globalThis.window.LOOT;
const AUDIT = readAudit(join(ROOT, 'docs', 'rights', 'records.json'));
const FILES = renderApiData(LOOT, AUDIT);
const parsed = (files, path) => JSON.parse(files.get(path));
const ROLL_SECTIONS = SECTIONS.filter((s) => s.startsWith('roll/'));

const ids = (rows) => rows.map((r) => r.id);

/** Returns the catalog with every record, rule card and set copied under a suffixed id. */
function tripled(loot) {
  const sfx = (v, k) => (k === 0 || v == null ? v : `${v}_${String(k)}`);
  const copy = (it, k) => {
    const out = { ...it, id: sfx(it.id, k) };
    if (it.craft) out.craft = it.craft.map((c) => sfx(c, k));
    if (it.refs) out.refs = it.refs.map((r) => sfx(r, k));
    if (it.set) out.set = sfx(it.set, k);
    if (it.eq?.line) out.eq = { ...it.eq, line: sfx(it.eq.line, k) };
    return out;
  };
  const times = (list) => [0, 1, 2].flatMap((k) => list.map((it) => copy(it, k)));
  const keyed = (o) =>
    Object.fromEntries(
      [0, 1, 2].flatMap((k) => Object.entries(o).map(([key, v]) => [sfx(key, k), v]))
    );
  const alt = {};
  for (const [kind, byRarity] of Object.entries(loot.alt)) {
    alt[kind] = {};
    for (const [r, cols] of Object.entries(byRarity)) {
      alt[kind][r] = {
        hope: [0, 1, 2].flatMap((k) => cols.hope.map((id) => sfx(id, k))),
        fear: [0, 1, 2].flatMap((k) => cols.fear.map((id) => sfx(id, k)))
      };
    }
  }
  return {
    items: Object.fromEntries(Object.entries(loot.items).map(([t, rows]) => [t, times(rows)])),
    eq: times(loot.eq),
    refs: keyed(loot.refs),
    sets: keyed(loot.sets),
    alt
  };
}

describe('the projections hold the pools the app draws', () => {
  const full = buildIndex(LOOT);

  it('gives each roll section the same pool from its lean file', () => {
    for (const section of ROLL_SECTIONS) {
      const lean = buildIndex(parsed(FILES, `apidata/roll/${rollIdOf(section)}.json`));
      const mode = ROLL_MODES[section];
      if (mode === 'table') {
        assert.deepEqual(
          ids(rollPool(rowsOf(section, lean))),
          ids(rollPool(rowsOf(section, full))),
          section
        );
      } else if (mode === 'part') {
        const parts = PICKER_ROLL[section].parts(dict('en'), 'en', full).map((p) => p.id);
        for (const part of parts) {
          assert.deepEqual(
            ids(rollPool(rowsOf(section, lean, part))),
            ids(rollPool(rowsOf(section, full, part))),
            `${section} ${part}`
          );
        }
      }
    }
  });

  it('gives the Core roll the same picks from its lean file', () => {
    const lean = buildIndex(parsed(FILES, 'apidata/roll/std.json'));
    for (const [core, hnf] of [
      [true, true],
      [true, false],
      [false, true]
    ]) {
      for (const [item, consumable] of [
        [true, true],
        [true, false],
        [false, true]
      ]) {
        for (let total = 1; total <= 60; total++) {
          assert.deepEqual(
            ids(poolFor(lean, total, { core, hnf }, { item, consumable })),
            ids(poolFor(full, total, { core, hnf }, { item, consumable }))
          );
        }
      }
    }
  });

  it('gives the alternate tables the same picks from their lean file', () => {
    const lean = buildIndex(parsed(FILES, 'apidata/roll/alt.json'));
    const kinds = { item: true, consumable: true };
    for (const rarity of RARITIES) {
      for (let hope = 1; hope <= 12; hope++) {
        for (let fear = 1; fear <= 12; fear++) {
          const a = altPicks(lean, rarity, { hope, fear }, kinds).map((p) => [
            p.it.id,
            p.col,
            p.n
          ]);
          const b = altPicks(full, rarity, { hope, fear }, kinds).map((p) => [
            p.it.id,
            p.col,
            p.n
          ]);
          assert.deepEqual(a, b, `${rarity} ${String(hope)} ${String(fear)}`);
        }
      }
    }
  });
});

describe('the catalog chunks', () => {
  const index = parsed(FILES, 'api/v1/catalog/index.json');
  const byId = buildIndex(LOOT).byId;

  it('holds every record in exactly one chunk, and the roll rows name it', () => {
    const where = new Map();
    index.chunks.forEach((_, n) => {
      for (const r of parsed(FILES, `api/v1/catalog/${String(n)}.json`).records) {
        assert.ok(!where.has(r.id), `${r.id} is in two chunks`);
        where.set(r.id, n);
      }
    });
    assert.deepEqual([...where.keys()], [...byId.keys()]);
    const records = parsed(FILES, 'apidata/records/index.json');
    records.chunks.forEach((list, n) =>
      list.forEach((id) => assert.equal(where.get(id), n, id))
    );
    for (const section of ROLL_SECTIONS) {
      const file = parsed(FILES, `apidata/roll/${rollIdOf(section)}.json`);
      const rows = [...Object.values(file.items).flat()];
      assert.ok(rows.length > 0);
      for (const row of rows) assert.equal(row.c, where.get(row.id), `${section} ${row.id}`);
    }
  });

  it('lists every record once with the chunk that holds it and the hash of its copy', () => {
    assert.equal(index.records.length, byId.size);
    assert.equal(new Set(index.records.map((r) => r.id)).size, byId.size);
    for (const { id, rev, chunk } of index.records) {
      const file = parsed(FILES, `api/v1/catalog/${String(chunk)}.json`);
      const record = file.records.find((r) => r.id === id);
      assert.ok(record, id);
      assert.equal(
        rev,
        createHash('sha256').update(JSON.stringify(record)).digest('hex').slice(0, 8)
      );
    }
    for (const url of index.chunks)
      assert.match(
        url,
        /^https:\/\/daggerheart-loot\.pages\.dev\/api\/v1\/catalog\/\d+\.json$/
      );
  });

  it('moves the rev of the records whose copy changed, and no other', () => {
    const loot = structuredClone(LOOT);
    loot.items.core_item[11].ende = 'An edited description.';
    const edited = renderApiData(loot, AUDIT);
    const after = parsed(edited, 'api/v1/catalog/index.json');
    const copies = (files, idx) =>
      new Map(
        idx.chunks.flatMap((_, n) =>
          parsed(files, `api/v1/catalog/${String(n)}.json`).records.map((r) => [
            r.id,
            JSON.stringify(r)
          ])
        )
      );
    const before = copies(FILES, index);
    const now = copies(edited, after);
    const revBefore = new Map(index.records.map((r) => [r.id, r.rev]));
    const changedRev = after.records
      .filter((r) => r.rev !== revBefore.get(r.id))
      .map((r) => r.id);
    const changedCopy = [...now]
      .filter(([id, json]) => json !== before.get(id))
      .map(([id]) => id);
    assert.deepEqual(changedRev.sort(), changedCopy.sort());
    assert.ok(changedRev.includes(LOOT.items.core_item[11].id));
    assert.notEqual(after.data_version, index.data_version);
  });

  it('changes data_version with the rights table', () => {
    const reviewed = renderApiData(LOOT, { ...AUDIT, reviewed: '2026-12-01' });
    assert.notEqual(
      parsed(reviewed, 'apidata/version.json').data_version,
      parsed(FILES, 'apidata/version.json').data_version
    );
  });
});

const SCHEMAS = {
  'daggerheart-loot/api-rolls': ['sections'],
  'daggerheart-loot/api-tables': ['tables'],
  'daggerheart-loot/api-table': ['table', 'rows'],
  'daggerheart-loot/api-cards': ['refs', 'sets', 'members'],
  'daggerheart-loot/api-roll-data': ['items'],
  'daggerheart-loot/api-records': ['chunks'],
  'daggerheart-loot/api-catalog': ['chunks', 'records'],
  'daggerheart-loot/api-catalog-chunk': ['records'],
  'daggerheart-loot/api-version': []
};

function checkFiles(files) {
  const dv = parsed(files, 'apidata/version.json').data_version;
  assert.match(dv, /^[0-9a-f]{16}$/);
  for (const [path, body] of files) {
    const v = JSON.parse(body);
    assert.ok(Object.hasOwn(SCHEMAS, v.format), `${path}: unknown format ${String(v.format)}`);
    assert.equal(v.version, 1, path);
    assert.equal(v.data_version, dv, path);
    for (const field of SCHEMAS[v.format]) assert.ok(field in v, `${path} lacks ${field}`);
    assert.equal(body, JSON.stringify(v) + '\n', path);
    const limit = budgetOf(path);
    if (limit !== null) {
      assert.ok(
        Buffer.byteLength(body) <= limit,
        `${path} is ${String(Buffer.byteLength(body))} B, past ${String(limit)}`
      );
    }
  }
}

describe('every file keeps its schema and its budget', () => {
  it("at today's size", (t) => {
    checkFiles(FILES);
    const chunks = [...FILES.keys()].filter((p) =>
      /^api\/v1\/catalog\/\d+\.json$/.test(p)
    ).length;
    t.diagnostic(`${String(FILES.size)} files, ${String(chunks)} chunks`);
    t.diagnostic(
      `records/index.json ${String(Buffer.byteLength(FILES.get('apidata/records/index.json')))} B`
    );
    t.diagnostic(
      `api/v1/catalog/index.json ${String(Buffer.byteLength(FILES.get('api/v1/catalog/index.json')))} B`
    );
    assert.equal(BUDGET.small, 65536);
  });

  it("at three times today's size", (t) => {
    const big = renderApiData(tripled(LOOT), AUDIT);
    checkFiles(big);
    const chunks = [...big.keys()].filter((p) =>
      /^api\/v1\/catalog\/\d+\.json$/.test(p)
    ).length;
    t.diagnostic(`3x: ${String(big.size)} files, ${String(chunks)} chunks`);
    t.diagnostic(
      `3x: records/index.json ${String(Buffer.byteLength(big.get('apidata/records/index.json')))} B`
    );
    t.diagnostic(
      `3x: api/v1/catalog/index.json ${String(Buffer.byteLength(big.get('api/v1/catalog/index.json')))} B`
    );
    t.diagnostic(
      `3x: cards.json ${String(Buffer.byteLength(big.get('apidata/cards.json')))} B`
    );
    assert.equal(parsed(big, 'api/v1/catalog/index.json').records.length, 3 * 1593);
  });
});

describe('the rights table', () => {
  const dir = mkdtempSync(join(tmpdir(), 'api-data-'));
  const run = (file) =>
    spawnSync(
      process.execPath,
      ['--import', './tools/ts-hooks.mjs', 'tools/api-data.mjs', '--check', '--audit', file],
      { encoding: 'utf8', cwd: ROOT }
    );

  it('throws an error that names the file when it is missing or invalid', () => {
    const missing = join(dir, 'missing.json');
    assert.throws(
      () => readAudit(missing),
      (e) => e.message.includes(missing)
    );
    const broken = join(dir, 'broken.json');
    writeFileSync(broken, '{nope');
    assert.throws(
      () => readAudit(broken),
      (e) => e.message.includes(broken)
    );
    const wrong = join(dir, 'wrong.json');
    writeFileSync(wrong, JSON.stringify({ format: 'other', version: 1 }));
    assert.throws(
      () => readAudit(wrong),
      (e) => e.message.includes(wrong)
    );
  });

  it('makes the command line exit 1 and name the file', () => {
    const missing = join(dir, 'missing.json');
    const res = run(missing);
    assert.equal(res.status, 1);
    assert.ok(res.stderr.includes(missing), res.stderr);
  });
});
