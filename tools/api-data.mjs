/*
  Renders the read API's build-time projections from data.js with the app's own pure
  modules (docs/specs/CONTRACTS.md section 6):

    apidata/            internal, changed without notice: rolls.json, tables.json,
                        cards.json, roll/<section>.json, table/<table>.json,
                        table/<eq table>/<tier>.json, records/index.json, version.json,
                        search/index.json and search/<n>.txt, file-check.json
    api/v1/catalog/     public, frozen: index.json and the record chunks <n>.json

  Both folders are generated, never committed (.gitignore), and published by
  tools/collect-site.sh. The worker (preview/api/service.mjs) reads the first through
  env.ASSETS and the chunks of the second; a client reads the second over HTTP.

  Run after every edit to data.js, through tools/build.js:
    node --import ./tools/ts-hooks.mjs tools/api-data.mjs [--check]
  --check renders to memory and exits 1 naming each file that differs from disk or passes
  its budget. --audit <path> reads the rights table from another file (tests).
*/
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { apiRecord, licenseOf } from '../app/src/lib/apiRecord.ts';
import {
  buildIndex,
  equipOfKind,
  facetsOf,
  lineMembers,
  otherTableRows
} from '../app/src/lib/data.ts';
import { dict, sectionLabel } from '../app/src/lib/dict.ts';
import { groupsFor } from '../app/src/lib/filters.ts';
import { FRAME_ORDER, frameName } from '../app/src/lib/frames.ts';
import {
  SECTION_SLUG,
  TABLE_SLUG,
  appUrl,
  sectionHash,
  tablesHash
} from '../app/src/lib/hash.ts';
import { rarityKey } from '../app/src/lib/label.ts';
import { foldQuery } from '../app/src/lib/search.ts';
import { RARITIES } from '../app/src/lib/alt.ts';
import { rollPool, isRung } from '../app/src/lib/roll.ts';
import { PICKER_ROLL, ROLL_MODES, ROLL_TABLE, rowsOf } from '../app/src/lib/rollTables.ts';
import { SECTION_PROP } from '../app/src/lib/sectionProps.ts';
import {
  VOA_SECTIONS,
  communityParts,
  sectionParts,
  voaParts,
  voaSectionName
} from '../app/src/lib/sections.ts';
import { TABLE_GROUPS, pickerLabel, pickerParts } from '../app/src/lib/tables.ts';
import { SECTIONS } from '../app/src/lib/types.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The site the links are built on; the same as tools/derived.js `SITE`. */
export const SITE = 'https://daggerheart-loot.pages.dev/';
/** The links and pictures of a catalog record: it has no own picture. */
const SITE_OF_RECORDS = { base: SITE, art: '' };

/** The per-file budgets in bytes (.claude/README.md, "Preview host"): what the worker may
 *  read and parse inside its CPU limit, and what a client reads. */
export const BUDGET = {
  small: 65536,
  large: 131072,
  /* The rule cards are 39 KB of Russian and English text today; three times that and the
     members pass 131072 B by 0.4 %, so this one file has more room (parsed in about 2 ms at
     the rate measured on 2026-11-10; the owner's CPU reading decides). */
  cards: 196608,
  catalogIndex: 262144,
  /* A search shard: the worker scans it as one string, never parses it. */
  search: 262144
};

/** Where a chunk file stops: a chunk holds records while the file stays within this. */
const CHUNK_MAX = BUDGET.small;
/** A stand-in the width of a real `data_version`, so chunk packing never depends on it. */
const DV_WIDTH = 'x'.repeat(16);
const CHUNK_PATH = /^api\/v1\/catalog\/\d+\.json$/;
const SEARCH_PATH = /^apidata\/search\/\d+\.txt$/;
/** The first code character of a search line; code `i` is `String.fromCharCode(CODE_BASE + i)`. */
const CODE_BASE = 0x30;
/** The most values a code list may hold: the characters `0` to `o`. */
const CODE_LIST_MAX = 64;

/** Returns the first line of a chunk file: everything up to the open `records` array. */
const chunkHead = (dv) =>
  `{"format":"daggerheart-loot/api-catalog-chunk","version":1,"data_version":${JSON.stringify(dv)},"records":[`;

/** Returns a chunk file: line 0 is the head, line `l + 1` is record `l` (every record line but
 *  the last ends with a comma), the last line closes the array. The file stays one JSON value;
 *  the worker reads one record by its line (preview/api/service.mjs). */
function chunkText(lines, dv) {
  const body = lines.map((j, i) => (i < lines.length - 1 ? j + ',' : j)).join('\n');
  return chunkHead(dv) + '\n' + body + '\n]}\n';
}

const ROLL_SECTIONS = SECTIONS.filter((s) => s.startsWith('roll/'));
const EQ_TABLES = { eq_weapon: 'weapon', eq_secondary: 'secondary', eq_armor: 'armor' };
const EQ_TIERS = VOA_SECTIONS.filter((k) => k !== 'C').map(String);
const LEAN_FIELDS = [
  'id',
  'src',
  'kind',
  'roll',
  'en',
  'ru',
  'eq',
  'tier',
  'community',
  'community_ru',
  'realm',
  'vol',
  'frame',
  'starting'
];

const pair = (of) => ({ ru: of('ru'), en: of('en') });
const text = (v) => JSON.stringify(v) + '\n';
const sha = (s) => createHash('sha256').update(s).digest('hex');

/** Returns the id of a roll section as the URL writes it: the slug without `roll/`, else the
 *  section id without `roll/`. */
export const rollIdOf = (section) => (SECTION_SLUG[section] ?? section).slice(5);

/** Returns the id of a table as the URL writes it. */
export const tableIdOf = (table) => TABLE_SLUG[table] ?? table;

/**
 * Returns the rights table read from `path`; throws an error that names the file when it is
 * missing or not valid. The CLI turns the error into exit code 1.
 */
export function readAudit(path) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    throw new Error(`The rights table ${path} is missing. Restore docs/rights/records.json.`);
  }
  let v;
  try {
    v = JSON.parse(raw);
  } catch {
    throw new Error(`The rights table ${path} is not valid JSON. Fix the file.`);
  }
  const isObject = (o) => o !== null && typeof o === 'object' && !Array.isArray(o);
  const ok =
    isObject(v) &&
    v.format === 'daggerheart-loot/rights-audit' &&
    v.version === 1 &&
    isObject(v.sources) &&
    isObject(v.records) &&
    (v.reviewed === null || typeof v.reviewed === 'string');
  if (!ok) {
    throw new Error(
      `The rights table ${path} is not a daggerheart-loot/rights-audit v1 file. ` +
        'Expected format, version 1, sources, records and a reviewed date or null.'
    );
  }
  return v;
}

/* ---------- rows ---------- */

const apiKindOf = (it) => (it.eq ? it.eq.t : it.kind === 'consumable' ? 'consumable' : 'item');

/** Returns the part of a table row: the value of the table's section property, else null. */
function partOf(table, it, rarity) {
  if (table === 'voa') return String(it.tier);
  if (table === 'community') return it.community ?? null;
  if (table === 'other_frames') return it.frame ?? null;
  if (table in EQ_TABLES) return String(it.eq.tier);
  if (table === 'alt_item' || table === 'alt_consumable') return rarity ?? null;
  const prop = SECTION_PROP[table];
  return prop ? prop.valueOf(it) || null : null;
}

/** Returns the rows of a table in the tables page's order: `{ it, n, rarity }`. */
function tableEntries(index, table) {
  if (table in EQ_TABLES) return equipOfKind(index, EQ_TABLES[table]).map((it) => ({ it }));
  if (table === 'other_starting' || table === 'other_frames') {
    return otherTableRows(index, table).map((it) => ({ it }));
  }
  if (table === 'alt_item' || table === 'alt_consumable') {
    const kind = table === 'alt_item' ? 'item' : 'consumable';
    return RARITIES.flatMap((rarity) =>
      ['hope', 'fear'].flatMap((col) =>
        index.altColumn(kind, rarity, col).map(({ it, n }) => ({ it, n, rarity }))
      )
    );
  }
  return (index.rows.get(table) ?? []).map((it) => ({ it }));
}

/** Returns the facet values of a row cut to the groups its table offers, a missing value as ''. */
function facetsFor(table, it) {
  const groups = groupsFor(table);
  if (!groups.length) return null;
  const facets = facetsOf(table)(it);
  return Object.fromEntries(groups.map((g) => [g, facets[g] ?? '']));
}

function rowOf(index, table, { it, n, rarity }) {
  const f = facetsFor(table, it);
  return {
    id: it.id,
    n: n ?? it.roll ?? null,
    name: pair((lang) => (lang === 'ru' ? it.ru || it.en : it.en)),
    kind: apiKindOf(it),
    tier: it.eq ? it.eq.tier : (it.tier ?? null),
    rarity: index.rarityOf(it.id) ?? null,
    part: partOf(table, it, rarity),
    rung: isRung(it),
    ...(f ? { f } : {})
  };
}

/** Returns the parts of a table as `{ id, name }`: its sections, the tier parts of an
 *  equipment table, or the rarities of an alternate table. */
function partsOf(index, table) {
  const named = (list) => list.map(({ id, ru, en }) => ({ id, name: { ru, en } }));
  const both = (of) => {
    const ru = of('ru');
    const en = of('en');
    return ru.map((p, i) => ({ id: p.id, ru: p.label, en: en[i].label }));
  };
  if (table === 'voa') return named(both((lang) => voaParts(dict(lang))));
  if (table === 'community') return named(both((lang) => communityParts(index, lang)));
  if (table in SECTION_PROP) return named(both((lang) => sectionParts(table, lang)));
  if (table === 'other_frames') {
    return FRAME_ORDER.map((id) => ({ id, name: pair((lang) => frameName(id, lang)) }));
  }
  if (table in EQ_TABLES) {
    return EQ_TIERS.map((id) => ({
      id,
      name: pair((lang) => voaSectionName(id === 'A' ? 'A' : Number(id), dict(lang)))
    }));
  }
  if (table === 'alt_item' || table === 'alt_consumable') {
    return RARITIES.map((id) => ({ id, name: pair((lang) => dict(lang)[rarityKey(id)]) }));
  }
  return [];
}

/* ---------- the files ---------- */

/** The roll section that rolls a table, as the URL writes it, or null. */
function rollSectionOf(table) {
  if (/^(core|hnf)_/.test(table)) return 'std';
  if (table.startsWith('alt_')) return 'alt';
  for (const [section, cfg] of Object.entries(ROLL_TABLE)) {
    if (cfg.table === table) return rollIdOf(section);
  }
  for (const [section, cfg] of Object.entries(PICKER_ROLL)) {
    if (cfg.section === table) return rollIdOf(section);
  }
  return null;
}

function rollsFile(index) {
  const sections = ROLL_SECTIONS.map((section) => {
    const mode = ROLL_MODES[section];
    const id = rollIdOf(section);
    const picker = PICKER_ROLL[section];
    const parts = picker
      ? (() => {
          const ru = picker.parts(dict('ru'), 'ru', index);
          const en = picker.parts(dict('en'), 'en', index);
          return ru.map((p, i) => ({
            id: p.id,
            name: { ru: p.label, en: en[i].label },
            rows: rollPool(rowsOf(section, index, p.id)).length
          }));
        })()
      : [];
    const pool = mode === 'table' ? rollPool(rowsOf(section, index)).length : 0;
    const options = {
      std: {
        dice: { min: 1, max: 5 },
        total: { min: 1, max: 60 },
        sources: ['core', 'hnf'],
        kinds: ['item', 'consumable']
      },
      alt: {
        rarity: [...RARITIES],
        kinds: ['item', 'consumable'],
        hope: { min: 1, max: 12 },
        fear: { min: 1, max: 12 }
      },
      table: { value: { min: 1, max: pool } },
      part: { part: { required: true }, value: { min: 1, max: null } }
    }[mode];
    const shortId = section.slice(5);
    return {
      id,
      ids: shortId === id ? [] : [shortId],
      name: pair((lang) => sectionLabel(section, dict(lang))),
      mode,
      link: pair((lang) => appUrl({ base: SITE }, sectionHash(section), lang)),
      parts,
      options
    };
  });
  return { format: 'daggerheart-loot/api-rolls', version: 1, sections };
}

function tablesFile(index) {
  const tables = [];
  for (const group of TABLE_GROUPS) {
    for (const table of group.subs) {
      if (table === 'homebrew') continue;
      const entries = tableEntries(index, table);
      const picked = pickerParts(table, dict('ru'));
      const pickedEn = pickerParts(table, dict('en'));
      const parts = partsOf(index, table);
      tables.push({
        id: tableIdOf(table),
        ids: [
          table === tableIdOf(table) ? null : table,
          table === 'other_frames' ? 'frames' : null
        ].filter(Boolean),
        name: {
          ru: pickerLabel(table, dict('ru')),
          en: pickerLabel(table, dict('en'))
        },
        book: picked.book === null ? null : { ru: picked.book, en: pickedEn.book },
        rows: entries.length,
        parts,
        part_required: table in EQ_TABLES,
        link: pair((lang) => appUrl({ base: SITE }, tablesHash(table), lang)),
        roll: rollSectionOf(table)
      });
    }
  }
  return { format: 'daggerheart-loot/api-tables', version: 1, tables };
}

function tableFiles(index) {
  const out = new Map();
  for (const group of TABLE_GROUPS) {
    for (const table of group.subs) {
      if (table === 'homebrew') continue;
      const rows = tableEntries(index, table).map((e) => rowOf(index, table, e));
      const id = tableIdOf(table);
      if (table in EQ_TABLES) {
        for (const tier of EQ_TIERS) {
          out.set(`apidata/table/${id}/${tier}.json`, {
            format: 'daggerheart-loot/api-table',
            version: 1,
            table: id,
            part: tier,
            rows: rows.filter((r) => r.part === tier)
          });
        }
      } else {
        out.set(`apidata/table/${id}.json`, {
          format: 'daggerheart-loot/api-table',
          version: 1,
          table: id,
          rows
        });
      }
    }
  }
  return out;
}

function cardsFile(loot, index) {
  const members = Object.keys(loot.sets ?? {}).flatMap((key) =>
    (index.setMembers.get(key) ?? []).map((it) => ({
      id: it.id,
      src: it.src,
      kind: it.kind,
      set: it.set,
      en: it.en,
      ru: it.ru,
      ende: it.ende,
      rud: it.rud
    }))
  );
  return {
    format: 'daggerheart-loot/api-cards',
    version: 1,
    refs: loot.refs ?? {},
    sets: loot.sets ?? {},
    members
  };
}

/** Returns the records of a lean loot cut to the fields a roll reads, with their chunk. */
function lean(it, chunkOf, lineOf) {
  const out = {};
  for (const f of LEAN_FIELDS) if (it[f] !== undefined) out[f] = it[f];
  out.c = chunkOf.get(it.id);
  out.l = lineOf.get(it.id);
  return out;
}

function rollFiles(loot, index, chunkOf, lineOf) {
  const out = new Map();
  const tableOfRecord = new Map();
  for (const [key, rows] of Object.entries(loot.items)) {
    for (const it of rows) tableOfRecord.set(it.id, key);
  }
  for (const section of ROLL_SECTIONS) {
    const mode = ROLL_MODES[section];
    const items = {};
    let alt;
    if (mode === 'std') {
      for (const key of ['core_item', 'core_consumable', 'hnf_item', 'hnf_consumable']) {
        items[key] = (loot.items[key] ?? []).map((it) => lean(it, chunkOf, lineOf));
      }
    } else if (mode === 'alt') {
      alt = loot.alt ?? {};
      const ids = new Set(
        Object.values(alt).flatMap((byRarity) =>
          Object.values(byRarity).flatMap((cols) => [...cols.hope, ...cols.fear])
        )
      );
      for (const [key, rows] of Object.entries(loot.items)) {
        const kept = rows.filter((it) => ids.has(it.id));
        if (kept.length) items[key] = kept.map((it) => lean(it, chunkOf, lineOf));
      }
      const inEq = (loot.eq ?? []).filter((it) => ids.has(it.id) && !tableOfRecord.has(it.id));
      if (inEq.length) items.equipment = inEq.map((it) => lean(it, chunkOf, lineOf));
    } else {
      const table = ROLL_TABLE[section]?.table ?? PICKER_ROLL[section]?.section;
      items[table] = (loot.items[table] ?? []).map((it) => lean(it, chunkOf, lineOf));
    }
    const file = { format: 'daggerheart-loot/api-roll-data', version: 1, items };
    if (alt) file.alt = alt;
    out.set(`apidata/roll/${rollIdOf(section)}.json`, file);
  }
  return out;
}

/* ---------- the catalog ---------- */

function catalogFiles(index, audit, versions) {
  const ids = [...index.byId.keys()];
  const records = ids.map((id) => {
    const it = index.byId.get(id);
    const v = Object.hasOwn(versions, id) ? versions[id] : undefined;
    return apiRecord(index, it, SITE_OF_RECORDS, licenseOf(audit, it), v);
  });
  const json = records.map((r) => JSON.stringify(r));
  /* Packed in order while a file stays within CHUNK_MAX; the stand-in has the width of a
     real data_version, so the layout never moves with it. */
  const chunks = [];
  /* The head line and its newline, and the closing `]}` and newline. */
  const overhead = Buffer.byteLength(chunkHead(DV_WIDTH)) + 1 + 3;
  let current = null;
  let size = 0;
  json.forEach((j, i) => {
    /* The record, its comma and its newline. */
    const bytes = Buffer.byteLength(j) + 2;
    if (current === null || size + bytes > CHUNK_MAX) {
      current = [];
      chunks.push(current);
      size = overhead;
    }
    current.push(i);
    size += bytes;
  });
  const chunkOf = new Map();
  const lineOf = new Map();
  chunks.forEach((list, n) =>
    list.forEach((i, l) => {
      chunkOf.set(ids[i], n);
      lineOf.set(ids[i], l);
    })
  );
  return { ids, records, json, chunks, chunkOf, lineOf, versions };
}

/* ---------- search and file checks ---------- */

/** Returns the head line of a search shard and the shard's text: the head, then one record per line. */
const searchHead = (dv) =>
  `{"format":"daggerheart-loot/api-search-shard","version":1,"data_version":${JSON.stringify(dv)}}`;
const searchText = (lines, dv) => [searchHead(dv), ...lines].join('\n') + '\n';

/**
 * Returns the search projection of the catalog: `index` (the code lists) and `shards` (the
 * lines of each file). A line is five code characters (source, kind, table, tier, rarity),
 * then the folded Russian and English names, the id, the card version and the display names,
 * separated by TABs (docs/specs/CONTRACTS.md section 5).
 */
function searchFiles(catalog) {
  const fields = ['source', 'kind', 'table', 'tier', 'rarity'];
  const seen = Object.fromEntries(fields.map((f) => [f, new Map()]));
  const codes = Object.fromEntries(fields.map((f) => [f, []]));
  const codeOf = (field, value) => {
    const key = JSON.stringify(value);
    let i = seen[field].get(key);
    if (i === undefined) {
      i = codes[field].length;
      if (i >= CODE_LIST_MAX) {
        throw new Error(
          `The search code list ${field} passes ${String(CODE_LIST_MAX)} values. Widen the code in tools/api-data.mjs.`
        );
      }
      seen[field].set(key, i);
      codes[field].push(value);
    }
    return String.fromCharCode(CODE_BASE + i);
  };
  const lines = catalog.records.map((r, i) => {
    const id = catalog.ids[i];
    if ([r.name.ru, r.name.en, id].some((v) => /[\t\n\r]/.test(v))) {
      throw new Error(`The record ${id} holds a TAB or a line break in its id or name.`);
    }
    const version = Object.hasOwn(catalog.versions, id) ? catalog.versions[id] : '';
    return (
      fields.map((f) => codeOf(f, r[f])).join('') +
      [foldQuery(r.name.ru), foldQuery(r.name.en), id, version, r.name.ru, r.name.en].join('\t')
    );
  });
  /* Packed in order while a file stays within the budget; the stand-in has the width of a
     real data_version, so the layout never moves with it. */
  const shards = [];
  const overhead = Buffer.byteLength(searchHead(DV_WIDTH)) + 1;
  let size = 0;
  for (const line of lines) {
    const bytes = Buffer.byteLength(line) + 1;
    if (shards.length === 0 || size + bytes > BUDGET.search) {
      shards.push([]);
      size = overhead;
    }
    shards[shards.length - 1].push(line);
    size += bytes;
  }
  return {
    index: {
      format: 'daggerheart-loot/api-search-index',
      version: 1,
      shards: shards.length,
      codes
    },
    shards
  };
}

/**
 * Returns the catalog half of the homebrew file check's context: the keys of the sets and of
 * the rule cards, and the members of each upgrade line (`HomebrewImport.svelte` `context()`).
 */
function fileCheckFile(loot, index) {
  const lines = {};
  for (const it of index.allEquip) {
    const line = it.eq?.line;
    if (line && !Object.hasOwn(lines, line)) {
      lines[line] = lineMembers(index, line).flatMap((r) =>
        r.eq ? [{ key: r.id, t: r.eq.t }] : []
      );
    }
  }
  return {
    format: 'daggerheart-loot/api-file-check-data',
    version: 1,
    sets: Object.keys(loot.sets ?? {}),
    refs: Object.keys(loot.refs ?? {}),
    lines
  };
}

/* ---------- the whole tree ---------- */

/**
 * Returns every output by its published path (`apidata/...` and `api/v1/catalog/...`) as text.
 *
 * @param loot The catalog as `data.js` holds it.
 * @param audit The rights table (`readAudit`); a change of it changes `data_version`.
 * @param versions The build's card versions by record id (`cardVersions()` of
 *   tools/build-share-pages.js); a record it does not hold has a link without `?v`.
 */
export function renderApiData(loot, audit, versions = {}) {
  const index = buildIndex(loot);
  const catalog = catalogFiles(index, audit, versions);
  const files = new Map();
  const add = (path, value) => files.set(path, value);

  add('apidata/rolls.json', rollsFile(index));
  add('apidata/tables.json', tablesFile(index));
  add('apidata/cards.json', cardsFile(loot, index));
  for (const [path, v] of rollFiles(loot, index, catalog.chunkOf, catalog.lineOf)) add(path, v);
  for (const [path, v] of tableFiles(index)) add(path, v);
  const search = searchFiles(catalog);
  add('apidata/search/index.json', search.index);
  search.shards.forEach((lines, n) => add(`apidata/search/${String(n)}.txt`, { lines }));
  add('apidata/file-check.json', fileCheckFile(loot, index));
  add('apidata/records/index.json', {
    format: 'daggerheart-loot/api-records',
    version: 1,
    chunks: catalog.chunks.map((list) => list.map((i) => catalog.ids[i]))
  });
  catalog.chunks.forEach((list, n) => {
    add(`api/v1/catalog/${n}.json`, { lines: list.map((i) => catalog.json[i]) });
  });
  add('api/v1/catalog/index.json', {
    format: 'daggerheart-loot/api-catalog',
    version: 1,
    chunks: catalog.chunks.map((_, n) => `${SITE}api/v1/catalog/${n}.json`),
    records: catalog.ids.map((id, i) => ({
      id,
      rev: sha(catalog.json[i]).slice(0, 8),
      chunk: catalog.chunkOf.get(id)
    }))
  });

  /* Rendered once with an empty data_version: the hash is over those bytes, then the value is
     stamped into each file. `rev` hashes the record alone, which holds no data_version. */
  const render = (dv) =>
    new Map(
      [...files]
        .map(([path, v]) => [
          path,
          CHUNK_PATH.test(path)
            ? chunkText(v.lines, dv)
            : SEARCH_PATH.test(path)
              ? searchText(v.lines, dv)
              : text({ ...stamp(v, dv) })
        ])
        .sort(([a], [b]) => (a < b ? -1 : 1))
    );
  const empty = render('');
  const hash = createHash('sha256');
  for (const [path, body] of empty) hash.update(path + '\0' + body);
  const dataVersion = hash.digest('hex').slice(0, 16);
  const out = render(dataVersion);
  out.set(
    'apidata/version.json',
    text({ format: 'daggerheart-loot/api-version', version: 1, data_version: dataVersion })
  );
  return out;
}

/** Returns `v` with `data_version` placed after `version`. */
function stamp(v, dv) {
  const { format, version, ...rest } = v;
  return { format, version, data_version: dv, ...rest };
}

/** Returns the budget of a published path in bytes, or null for none. */
export function budgetOf(path) {
  if (path === 'apidata/version.json') return null;
  if (path === 'api/v1/catalog/index.json') return BUDGET.catalogIndex;
  if (path === 'apidata/cards.json') return BUDGET.cards;
  if (path.startsWith('apidata/roll/')) return BUDGET.large;
  if (path.startsWith('apidata/table/')) return BUDGET.large;
  if (SEARCH_PATH.test(path)) return BUDGET.search;
  return BUDGET.small;
}

/* ---------- the CLI ---------- */

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => relative(ROOT, join(e.parentPath, e.name)).split(sep).join('/'));
}

function main() {
  const check = process.argv.includes('--check');
  let audit;
  try {
    const at = process.argv.indexOf('--audit');
    audit = readAudit(
      at > 0 ? process.argv[at + 1] : join(ROOT, 'docs', 'rights', 'records.json')
    );
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  globalThis.window = {};
  createRequire(import.meta.url)(join(ROOT, 'data.js'));
  const versions = createRequire(import.meta.url)('./build-share-pages.js').cardVersions();
  const out = renderApiData(globalThis.window.LOOT, audit, versions);

  if (check) {
    const bad = [];
    for (const [path, body] of out) {
      const limit = budgetOf(path);
      const size = Buffer.byteLength(body);
      if (limit !== null && size > limit) bad.push(`${path}: ${size} bytes, past its ${limit}`);
      const disk = existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), 'utf8') : null;
      if (disk !== body)
        bad.push(`${path}: ${disk === null ? 'missing' : 'stale'}, run node tools/build.js`);
    }
    const onDisk = [...listFiles(join(ROOT, 'apidata')), ...listFiles(join(ROOT, 'api'))];
    for (const path of onDisk) if (!out.has(path)) bad.push(`${path}: not rendered any more`);
    const chunks = [...out.keys()].filter((p) =>
      /^api\/v1\/catalog\/\d+\.json$/.test(p)
    ).length;
    const idxSize = Buffer.byteLength(out.get('apidata/records/index.json'));
    const shards = [...out.keys()].filter((p) => SEARCH_PATH.test(p)).length;
    console.log(
      `api-data: ${out.size} files, ${chunks} catalog chunks, ${shards} search shards, ` +
        `records/index.json ${idxSize} B`
    );
    for (const line of bad) console.error(line);
    process.exit(bad.length ? 1 : 0);
  }

  rmSync(join(ROOT, 'apidata'), { recursive: true, force: true });
  rmSync(join(ROOT, 'api'), { recursive: true, force: true });
  for (const [path, body] of out) {
    mkdirSync(dirname(join(ROOT, path)), { recursive: true });
    writeFileSync(join(ROOT, path), body);
  }
  const chunks = [...out.keys()].filter((p) => /^api\/v1\/catalog\/\d+\.json$/.test(p)).length;
  const shards = [...out.keys()].filter((p) => SEARCH_PATH.test(p)).length;
  console.log(
    `apidata/ and api/v1/catalog/ - ${out.size} files, ${chunks} chunks, ${shards} search shards, ` +
      `records/index.json ${Buffer.byteLength(out.get('apidata/records/index.json'))} B`
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
