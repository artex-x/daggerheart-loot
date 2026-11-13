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
import { buildIndex, equipOfKind, facetsOf, lineMembers } from '../app/src/lib/data.ts';
import { dict } from '../app/src/lib/dict.ts';
import { groupsFor } from '../app/src/lib/filters.ts';
import { TABLE_SLUG, recordUrl } from '../app/src/lib/hash.ts';
import { rollPool } from '../app/src/lib/roll.ts';
import { PICKER_ROLL, ROLL_MODES, rowsOf } from '../app/src/lib/rollTables.ts';
import { decodeFilter, passes } from '../app/src/lib/filters.ts';
import { foldQuery, parseQuery, rankHits } from '../app/src/lib/search.ts';
import { poolFor } from '../app/src/lib/std.ts';
import { SECTIONS, TABLE_IDS } from '../app/src/lib/types.ts';
import { parseSearch, readCapOf } from '../preview/api/rest.mjs';
import { createService } from '../preview/api/service.mjs';
import { BUDGET, SITE, budgetOf, readAudit, renderApiData, rollIdOf } from './api-data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
globalThis.window = {};
createRequire(import.meta.url)(join(ROOT, 'data.js'));
const LOOT = globalThis.window.LOOT;
const AUDIT = readAudit(join(ROOT, 'docs', 'rights', 'records.json'));
const VERSIONS = createRequire(import.meta.url)('./build-share-pages.js').cardVersions();
const FILES = renderApiData(LOOT, AUDIT, VERSIONS);
const parsed = (files, path) => JSON.parse(files.get(path));
const ROLL_SECTIONS = SECTIONS.filter((s) => s.startsWith('roll/'));

const ids = (rows) => rows.map((r) => r.id);
const CHUNK = /^api\/v1\/catalog\/\d+\.json$/;

/** Returns the records of a chunk file read line by line: line 0 is the head, line `l + 1` is
 *  record `l`, and the last line closes the array. */
function linesOf(text) {
  const lines = text.split('\n');
  assert.equal(lines.pop(), '', 'the file ends with a newline');
  assert.equal(lines.pop(), ']}');
  assert.match(
    lines[0],
    /^\{"format":"daggerheart-loot\/api-catalog-chunk","version":1,"data_version":"[0-9a-f]{0,16}","records":\[$/
  );
  return lines.slice(1).map((line, i, all) => {
    assert.equal(line.endsWith(','), i < all.length - 1, `line ${String(i + 1)} comma`);
    return JSON.parse(i < all.length - 1 ? line.slice(0, -1) : line);
  });
}

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

/** Renders the tripled catalog with an 8-character version for every synthetic id, so the
 *  budgets count the ?v bytes. */
function tripledFiles() {
  const loot3 = tripled(LOOT);
  const versions = Object.fromEntries(
    [...buildIndex(loot3).byId.keys()].map((id) => [id, 'abcd1234'])
  );
  return renderApiData(loot3, AUDIT, versions);
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

  it('writes one record per line, the same JSON as the whole file, and names the line', () => {
    index.chunks.forEach((_, n) => {
      const path = `api/v1/catalog/${String(n)}.json`;
      assert.deepEqual(linesOf(FILES.get(path)), parsed(FILES, path).records, path);
    });
    const records = parsed(FILES, 'apidata/records/index.json');
    for (const section of ROLL_SECTIONS) {
      const file = parsed(FILES, `apidata/roll/${rollIdOf(section)}.json`);
      for (const row of Object.values(file.items).flat()) {
        assert.ok(Number.isInteger(row.l) && row.l >= 0, `${section} ${row.id} has no line`);
        assert.equal(records.chunks[row.c][row.l], row.id, `${section} ${row.id}`);
        const line = FILES.get(`api/v1/catalog/${String(row.c)}.json`).split('\n')[row.l + 1];
        assert.equal(JSON.parse(line.replace(/,$/, '')).id, row.id);
      }
    }
  });

  it('links every record as the app does, with the card version of the build', () => {
    for (const id of byId.keys())
      assert.ok(Object.hasOwn(VERSIONS, id), `${id} has no version`);
    for (const [path] of FILES) {
      if (!CHUNK.test(path)) continue;
      for (const r of parsed(FILES, path).records) {
        for (const lang of ['ru', 'en']) {
          assert.equal(
            r.link[lang],
            recordUrl({ base: SITE }, r.id, lang, VERSIONS[r.id]),
            `${r.id} ${lang}`
          );
        }
      }
    }
  });

  it('leaves a record that the version map does not hold without a ?v', () => {
    const none = renderApiData(LOOT, AUDIT, {});
    const rec = parsed(none, 'api/v1/catalog/0.json').records[0];
    assert.equal(rec.link.ru, recordUrl({ base: SITE }, rec.id, 'ru'));
    assert.ok(!rec.link.ru.includes('?'));
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
    const edited = renderApiData(loot, AUDIT, VERSIONS);
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
    const unreviewed = renderApiData(LOOT, { ...AUDIT, reviewed: null }, VERSIONS);
    assert.notEqual(
      parsed(unreviewed, 'apidata/version.json').data_version,
      parsed(FILES, 'apidata/version.json').data_version
    );
    assert.equal(AUDIT.reviewed, '2026-11-12');
    const licenseIn = (files, id) => {
      for (const [path] of files) {
        if (!CHUNK.test(path)) continue;
        const rec = parsed(files, path).records.find((r) => r.id === id);
        if (rec) return rec.rights.license;
      }
      return null;
    };
    assert.equal(licenseIn(FILES, 'f49'), 'dpcgl');
    assert.equal(licenseIn(FILES, 'q140'), 'owner');
    assert.equal(licenseIn(unreviewed, 'f49'), 'owner');
  });
});

const SHARD = /^apidata\/search\/\d+\.txt$/;

describe('the search projection', () => {
  const index = parsed(FILES, 'apidata/search/index.json');
  const records = [...FILES.keys()]
    .filter((p) => CHUNK.test(p))
    .sort(
      (a, b) =>
        parseInt(a.match(/(\d+)\.json$/)[1], 10) - parseInt(b.match(/(\d+)\.json$/)[1], 10)
    )
    .flatMap((p) => parsed(FILES, p).records);
  const lines = Array.from({ length: index.shards }, (_, n) => {
    const all = FILES.get(`apidata/search/${String(n)}.txt`).split('\n');
    assert.equal(all.pop(), '', 'every line ends with a newline');
    return all.slice(1);
  }).flat();
  const decoded = lines.map((line) => {
    const [fru, fen, id, v, ru, en] = line.slice(5).split('\t');
    return { codes: line.slice(0, 5), fru, fen, id, v, ru, en };
  });

  it('writes every record on exactly one line, in the order of the catalog index', () => {
    assert.deepEqual(
      decoded.map((d) => d.id),
      records.map((r) => r.id)
    );
    assert.equal(new Set(decoded.map((d) => d.id)).size, records.length);
  });

  it('decodes the codes to the source, kind, table, tier and rarity of the record', () => {
    const value = (field, ch) => index.codes[field][ch.charCodeAt(0) - 0x30];
    decoded.forEach((d, i) => {
      const r = records[i];
      const got = [0, 1, 2, 3, 4].map((k) =>
        value(['source', 'kind', 'table', 'tier', 'rarity'][k], d.codes[k])
      );
      assert.deepEqual(got, [r.source, r.kind, r.table, r.tier, r.rarity], r.id);
    });
    for (const list of Object.values(index.codes)) assert.ok(list.length <= 64);
  });

  it('holds no TAB or line break in a name, folded names, and the card version', () => {
    decoded.forEach((d, i) => {
      const r = records[i];
      assert.equal(d.ru, r.name.ru, r.id);
      assert.equal(d.en, r.name.en, r.id);
      assert.equal(d.fru, foldQuery(r.name.ru), r.id);
      assert.equal(d.fen, foldQuery(r.name.en), r.id);
      assert.equal(foldQuery(d.fru), d.fru, `${r.id} fold is idempotent`);
      assert.equal(foldQuery(d.fen), d.fen, `${r.id} fold is idempotent`);
      assert.equal(d.v, Object.hasOwn(VERSIONS, r.id) ? VERSIONS[r.id] : '', r.id);
      assert.ok(!/[\t\n\r]/.test(d.ru + d.en), r.id);
    });
  });

  it('stamps the data_version of the build into the head of each shard', () => {
    const dv = parsed(FILES, 'apidata/version.json').data_version;
    for (let n = 0; n < index.shards; n++) {
      const head = JSON.parse(FILES.get(`apidata/search/${String(n)}.txt`).split('\n')[0]);
      assert.deepEqual(head, {
        format: 'daggerheart-loot/api-search-shard',
        version: 1,
        data_version: dv
      });
    }
  });
});

describe('the facet values of a table row', () => {
  const full = buildIndex(LOOT);
  it('equal the facets of the app, cut to the groups of the table', () => {
    let checked = 0;
    for (const table of TABLE_IDS) {
      if (table === 'homebrew') continue;
      const groups = groupsFor(table);
      const url = TABLE_SLUG[table] ?? table;
      const paths = [...FILES.keys()].filter(
        (p) => p === `apidata/table/${url}.json` || p.startsWith(`apidata/table/${url}/`)
      );
      assert.ok(paths.length > 0, table);
      for (const path of paths) {
        for (const row of parsed(FILES, path).rows) {
          if (!groups.length) {
            assert.ok(!('f' in row), `${table} ${row.id} has no groups`);
            continue;
          }
          const facets = facetsOf(table)(full.byId.get(row.id));
          assert.deepEqual(
            row.f,
            Object.fromEntries(groups.map((g) => [g, facets[g] ?? ''])),
            `${table} ${row.id}`
          );
          checked++;
        }
      }
    }
    assert.ok(checked > 1000, String(checked));
    assert.ok(equipOfKind(full, 'weapon').length > 0);
  });
});

describe('the file-check data', () => {
  const full = buildIndex(LOOT);
  const data = parsed(FILES, 'apidata/file-check.json');
  /* The catalog half of HomebrewImport.svelte context(). */
  const members = (line) =>
    lineMembers(full, line).flatMap((r) => (r.eq ? [{ key: r.id, t: r.eq.t }] : []));

  it('answers what the import panel answers for every set, rule card and line', () => {
    assert.deepEqual(data.sets, Object.keys(full.sets));
    assert.deepEqual(data.refs, Object.keys(full.refs));
    const lineKeys = new Set(full.allEquip.flatMap((it) => (it.eq?.line ? [it.eq.line] : [])));
    assert.deepEqual(Object.keys(data.lines).sort(), [...lineKeys].sort());
    for (const line of lineKeys) assert.deepEqual(data.lines[line], members(line), line);
  });
});

/** Returns the service over the rendered files, with in-memory reads and no Supabase. */
function serviceOver(files) {
  return createService({
    assets: async (path) => JSON.parse(files.get(path)),
    text: async (path) => {
      const body = files.get(path);
      if (body === undefined) throw new Error(path);
      return body;
    },
    rpc: async () => ({ fail: 'status' }),
    site: { base: SITE, art: '' },
    cache: new Map()
  });
}

/** Queries of the parity test: word forms in both languages, any order, a phrase, a short
 *  word, an apostrophe, and a facet. Each is accepted (neither cap) at today's size and at 3x. */
const QUERIES = [
  { q: 'меч' },
  { q: 'мечи' },
  { q: 'sword' },
  { q: 'swords' },
  { q: 'зелье' },
  { q: 'зелья' },
  { q: 'лечения зелье' },
  { q: '"зелье лечения"' },
  { q: 'potion healing' },
  { q: '"healing potion"' },
  { q: 'яд' },
  { q: 'zweihander' },
  { q: "duelist's" },
  { q: 'armor plate' },
  { q: 'посох огня' },
  { q: 'ring' },
  { q: 'щит' },
  { q: 'меч', kind: 'weapon' },
  { q: 'sword', tier: '2' },
  { q: 'potion', kind: 'consumable', source: 'core' }
];

/** Returns the catalog index and the names-only haystack the API ranks with. */
function namesHayOf(loot) {
  const full = buildIndex(loot);
  const hay = (it) => ({
    names: [it.ru, it.en].filter(Boolean).map(foldQuery),
    texts: []
  });
  return { full, hay };
}

/** Returns the record of each catalog id, from the rendered chunks. */
function recordsOf(files) {
  const out = new Map();
  for (const [path] of files) {
    if (!CHUNK.test(path)) continue;
    for (const r of parsed(files, path).records) out.set(r.id, r);
  }
  return out;
}

for (const [label, make] of [
  ["today's size", () => ({ loot: LOOT, files: FILES })],
  [
    'three times the size',
    () => {
      const loot3 = tripled(LOOT);
      const versions = Object.fromEntries(
        [...buildIndex(loot3).byId.keys()].map((id) => [id, 'abcd1234'])
      );
      return { loot: loot3, files: renderApiData(loot3, AUDIT, versions) };
    }
  ]
]) {
  describe(`the search answers as the app ranks names, at ${label}`, () => {
    const { loot, files } = make();
    const { full, hay } = namesHayOf(loot);
    const service = serviceOver(files);
    const records = recordsOf(files);

    it('finds the ids of rankHits over the names, in its order, with its total', async () => {
      for (const query of QUERIES) {
        const input = parseSearch(
          Object.fromEntries(Object.entries({ ...query, limit: '50' }))
        );
        let want = rankHits(full.searchable, parseQuery(query.q), undefined, hay).map(
          (r) => r.id
        );
        want = want.filter((id) => {
          const r = records.get(id);
          return (
            (query.kind === undefined || r.kind === query.kind) &&
            (query.tier === undefined || String(r.tier) === query.tier) &&
            (query.source === undefined || r.source.id === query.source)
          );
        });
        const { body } = await service.searchRecords(input);
        assert.equal(body.total, want.length, JSON.stringify(query));
        assert.deepEqual(
          body.rows.map((r) => r.id),
          want.slice(0, 50),
          JSON.stringify(query)
        );
      }
    });

    it('gives each row the fields of the record of the same names', async () => {
      const { body } = await service.searchRecords(parseSearch({ q: 'зелье', limit: '50' }));
      assert.ok(body.rows.length > 0);
      for (const row of body.rows) {
        const r = records.get(row.id);
        assert.deepEqual(row, {
          id: r.id,
          name: r.name,
          kind: r.kind,
          source: r.source,
          table: r.table,
          tier: r.tier,
          rarity: r.rarity,
          link: r.link
        });
      }
    });

    it('lists the records of a table as its rows do, in catalog order', async () => {
      const list = parsed(files, 'apidata/tables.json').tables;
      const order = [...full.byId.keys()];
      for (const t of list) {
        const rowIds = new Set(
          [...files.keys()]
            .filter(
              (p) =>
                p === `apidata/table/${t.id}.json` || p.startsWith(`apidata/table/${t.id}/`)
            )
            .flatMap((p) => parsed(files, p).rows.map((r) => r.id))
        );
        const want = order.filter((id) => rowIds.has(id));
        const { body } = await service.searchRecords({ terms: [], table: t.id, limit: 100000 });
        assert.deepEqual(
          body.rows.map((r) => r.id),
          want,
          t.id
        );
        assert.equal(body.total, want.length, t.id);
      }
    });

    it('filters a table as the tables page does, for a value of each group', async () => {
      const list = parsed(files, 'apidata/tables.json').tables;
      let narrowed = 0;
      for (const t of list) {
        const table = TABLE_IDS.find((id) => (TABLE_SLUG[id] ?? id) === t.id);
        const groups = groupsFor(table);
        if (!groups.length) continue;
        const parts = t.part_required ? t.parts.map((p) => p.id) : [undefined];
        for (const part of parts) {
          const whole = (await service.getTable(t.id, part)).body.rows;
          for (const g of groups) {
            const value = whole
              .map((r) => decodeFacet(table, full, r.id, g))
              .flat()
              .find((v) => v !== '');
            if (value === undefined) continue;
            const segment = `f_${g}-${value}`;
            const state = decodeFilter(segment, groups);
            const want = whole
              .filter((r) =>
                passes(state, groups, (group) => decodeFacet(table, full, r.id, group))
              )
              .map((r) => r.id);
            const got = (await service.getTable(t.id, part, segment)).body.rows;
            assert.deepEqual(
              got.map((r) => r.id),
              want,
              `${t.id} ${String(part)} ${segment}`
            );
            assert.ok(got.every((r) => !('f' in r)));
            if (want.length < whole.length) narrowed++;
          }
        }
      }
      assert.ok(narrowed > 0);
    });
  });
}

/** Returns the facet value of a record of the table for a group, from the app's functions. */
function decodeFacet(table, full, id, group) {
  return facetsOf(table)(full.byId.get(id))[group] ?? '';
}

const SCHEMAS = {
  'daggerheart-loot/api-search-index': ['shards', 'codes'],
  'daggerheart-loot/api-file-check-data': ['sets', 'refs', 'lines'],
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
    if (SHARD.test(path)) {
      const head = JSON.parse(body.split('\n', 1)[0]);
      assert.equal(head.format, 'daggerheart-loot/api-search-shard', path);
      assert.equal(head.data_version, dv, path);
      assert.ok(body.endsWith('\n'), path);
      const limit = budgetOf(path);
      assert.ok(Buffer.byteLength(body) <= limit, `${path} is past ${String(limit)}`);
      continue;
    }
    const v = JSON.parse(body);
    assert.ok(Object.hasOwn(SCHEMAS, v.format), `${path}: unknown format ${String(v.format)}`);
    assert.equal(v.version, 1, path);
    assert.equal(v.data_version, dv, path);
    for (const field of SCHEMAS[v.format]) assert.ok(field in v, `${path} lacks ${field}`);
    if (!CHUNK.test(path)) assert.equal(body, JSON.stringify(v) + '\n', path);
    const limit = budgetOf(path);
    if (limit !== null) {
      assert.ok(
        Buffer.byteLength(body) <= limit,
        `${path} is ${String(Buffer.byteLength(body))} B, past ${String(limit)}`
      );
    }
  }
}

/** Returns the number and the sizes of the search shards, for a diagnostic. */
function shardSizes(files) {
  const sizes = [...files]
    .filter(([p]) => SHARD.test(p))
    .map(([, body]) => Buffer.byteLength(body));
  return `${String(sizes.length)} search shards (${sizes.join(', ')} B)`;
}

describe('every file keeps its schema and its budget', () => {
  it("at today's size", (t) => {
    checkFiles(FILES);
    const chunks = [...FILES.keys()].filter((p) =>
      /^api\/v1\/catalog\/\d+\.json$/.test(p)
    ).length;
    t.diagnostic(`${String(FILES.size)} files, ${String(chunks)} chunks`);
    t.diagnostic(shardSizes(FILES));
    t.diagnostic(
      `records/index.json ${String(Buffer.byteLength(FILES.get('apidata/records/index.json')))} B`
    );
    t.diagnostic(
      `api/v1/catalog/index.json ${String(Buffer.byteLength(FILES.get('api/v1/catalog/index.json')))} B`
    );
    assert.equal(BUDGET.small, 65536);
  });

  it("at three times today's size", (t) => {
    const big = tripledFiles();
    checkFiles(big);
    const chunks = [...big.keys()].filter((p) =>
      /^api\/v1\/catalog\/\d+\.json$/.test(p)
    ).length;
    t.diagnostic(`3x: ${String(big.size)} files, ${String(chunks)} chunks`);
    t.diagnostic(`3x: ${shardSizes(big)}`);
    assert.equal(parsed(big, 'apidata/search/index.json').shards, 3);
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

  it('is read by the worker with a cap at least as large as the budget of each file', () => {
    const big = tripledFiles();
    for (const files of [FILES, big]) {
      for (const [path, body] of files) {
        if (!path.startsWith('apidata/')) continue;
        const budget = budgetOf(path);
        const cap = readCapOf(path);
        if (budget !== null) {
          assert.ok(budget <= cap, `${path}: budget ${String(budget)} past cap ${String(cap)}`);
        }
        assert.ok(
          Buffer.byteLength(body) <= cap,
          `${path} is ${String(Buffer.byteLength(body))} B, past the read cap ${String(cap)}`
        );
      }
    }
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
