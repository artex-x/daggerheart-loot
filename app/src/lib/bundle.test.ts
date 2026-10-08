/* The lists file: the validator against the published schema (the drift guard), every
   branch of the walk, the fixtures under docs/fixtures/import/ and the example llms.txt
   hands an AI assistant (docs/specs/CONTRACTS.md section 4). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BUNDLE_FORMAT,
  BUNDLE_SCHEMA,
  BUNDLE_SCHEMA_GM_ONLY,
  BUNDLE_SCHEMA_HOMEBREW,
  BUNDLE_VERSION,
  BUNDLE_VERSION_GM_ONLY,
  BUNDLE_VERSION_HOMEBREW,
  bundleFileName,
  bundleText,
  dataFileName,
  decodeText,
  ENTRIES_MAX,
  ENTRY_KEYS,
  ENTRY_KEYS_GM_ONLY,
  ENTRY_KEYS_HOMEBREW,
  ENTRY_REQUIRED,
  ERRORS_MAX,
  FILE_MAX_BYTES,
  ID_PATTERN,
  LIST_KEYS,
  LIST_REQUIRED,
  LISTS_MAX,
  overBounds,
  parseBundle,
  ROOT_KEYS,
  ROOT_REQUIRED,
  SOURCES,
  SOURCES_HOMEBREW,
  toBundle,
  importPlan,
  withCopies,
  type ImportList,
  type PlanAccount,
  type Bundle,
  type BundleList,
  type Parsed
} from './bundle.js';
import { NAME_MAX, NOTE_MAX, PRICE_MAX, type CloudList } from './cloudLists.js';
import { buildIndex, type Loot } from './data.js';
import {
  recordOf,
  SNAPSHOT_BYTES,
  type BookContent,
  type CardContent,
  type CardKind,
  type HomebrewContent,
  type HomebrewRecord
} from './homebrew.js';
import { QTY_MAX } from './listLink.js';
import { MONEY_DEFAULT, MONEY_MODES } from './money.js';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const read = (...path: string[]): string => readFileSync(join(ROOT, ...path), 'utf8');
const fixture = (name: string): string => read('docs', 'fixtures', 'import', name);

const index = buildIndex(JSON.parse(read('data.json')) as Loot);
const knows = (id: string): boolean => index.byId.has(id);

interface Prop {
  const?: unknown;
  enum?: unknown[];
  default?: unknown;
  type?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  description?: string;
}
interface ObjectSchema {
  $id?: string;
  type: string;
  required: string[];
  additionalProperties: boolean;
  properties: Record<string, Prop>;
}
const SCHEMA = JSON.parse(read('schema', 'import-v1.json')) as ObjectSchema & {
  $defs: { list: ObjectSchema; entry: ObjectSchema };
  examples: unknown[];
};
const LIST = SCHEMA.$defs.list;
const ENTRY = SCHEMA.$defs.entry;
const prop = (s: ObjectSchema, key: string): Prop => {
  const p = s.properties[key];
  if (!p) throw new Error('the schema has no property ' + key);
  return p;
};

const doc = (lists: unknown, extra: Record<string, unknown> = {}): string =>
  JSON.stringify({ format: BUNDLE_FORMAT, version: 1, lists, ...extra });
const oneList = (list: Record<string, unknown>): string =>
  doc([{ name: 'L', entries: [], ...list }]);
const oneEntry = (entry: Record<string, unknown>): string =>
  oneList({ entries: [{ id: 'ci1', ...entry }] });
const errorsOf = (p: Parsed): Record<string, unknown>[] => {
  if (p.ok || p.reason !== 'errors')
    throw new Error('not refused with errors: ' + JSON.stringify(p));
  /* `toEqual` reads a key holding undefined as absent. */
  return p.errors.map((e) => ({
    path: e.path,
    field: e.field,
    kind: e.kind,
    value: e.value,
    limit: e.limit
  }));
};
const okOf = (p: Parsed): Extract<Parsed, { ok: true }> => {
  if (!p.ok) throw new Error('refused: ' + JSON.stringify(p));
  return p;
};

describe('the schema and the validator (the drift guard)', () => {
  it('names the published URL, the format and the version the validator reads', () => {
    expect(SCHEMA.$id).toBe(BUNDLE_SCHEMA);
    expect(prop(SCHEMA, 'format').const).toBe(BUNDLE_FORMAT);
    expect(prop(SCHEMA, 'version').const).toBe(BUNDLE_VERSION);
  });

  it('holds the bounds the validator applies', () => {
    expect(prop(SCHEMA, 'lists')).toMatchObject({ minItems: 1, maxItems: LISTS_MAX });
    expect(prop(LIST, 'entries').maxItems).toBe(ENTRIES_MAX);
    expect(prop(LIST, 'name')).toMatchObject({ minLength: 1, maxLength: NAME_MAX });
    expect(prop(ENTRY, 'name').maxLength).toBe(NAME_MAX);
    for (const s of [LIST, ENTRY]) {
      expect(prop(s, 'player_note').maxLength).toBe(NOTE_MAX);
      expect(prop(s, 'gm_note').maxLength).toBe(NOTE_MAX);
    }
    expect(prop(ENTRY, 'quantity')).toMatchObject({
      type: 'integer',
      minimum: 1,
      maximum: QTY_MAX
    });
    expect(prop(ENTRY, 'price_coins')).toMatchObject({
      type: 'integer',
      minimum: 1,
      maximum: PRICE_MAX
    });
    expect(prop(ENTRY, 'id').pattern).toBe(ID_PATTERN.source);
    expect(prop(LIST, 'money_mode').enum).toEqual(MONEY_MODES);
    expect(prop(LIST, 'money_mode').default).toBe(MONEY_DEFAULT);
    expect(prop(ENTRY, 'source').enum).toEqual(SOURCES);
  });

  it('names the keys the validator knows, and requires the ones it requires', () => {
    expect(Object.keys(SCHEMA.properties)).toEqual(ROOT_KEYS);
    expect(Object.keys(LIST.properties)).toEqual(LIST_KEYS);
    expect(Object.keys(ENTRY.properties)).toEqual(ENTRY_KEYS);
    expect(SCHEMA.required).toEqual(ROOT_REQUIRED);
    expect(LIST.required).toEqual(LIST_REQUIRED);
    expect(ENTRY.required).toEqual(ENTRY_REQUIRED);
    for (const s of [SCHEMA, LIST, ENTRY]) {
      expect(s.additionalProperties).toBe(false);
      for (const p of Object.values(s.properties)) expect(p.description).toBeTruthy();
    }
  });

  it('carries the example the fixture holds, and the example imports clean', () => {
    expect(SCHEMA.examples).toEqual([JSON.parse(fixture('example.json'))]);
    expect(okOf(parseBundle(JSON.stringify(SCHEMA.examples[0]), knows)).skipped).toEqual([]);
  });

  it('reads every key the schema names, with a valid value, as known', () => {
    const p = parseBundle(
      JSON.stringify({
        $schema: BUNDLE_SCHEMA,
        format: BUNDLE_FORMAT,
        version: 1,
        exported_at: '2026-09-25T12:00:00.000Z',
        lists: [
          {
            name: 'N',
            money_mode: 'coin',
            player_note: 'p',
            gm_note: 'g',
            entries: [
              {
                id: 'ci1',
                name: 'n',
                source: 'official',
                quantity: 3,
                price_coins: 7,
                player_note: 'ep',
                gm_note: 'eg'
              }
            ]
          }
        ]
      }),
      knows
    );
    expect(okOf(p).lists).toEqual([
      {
        name: 'N',
        money_mode: 'coin',
        player_note: 'p',
        gm_note: 'g',
        entries: [
          {
            item_key: 'ci1',
            source: 'official',
            snapshot: null,
            quantity: 3,
            price_coins: 7,
            player_note: 'ep',
            gm_note: 'eg'
          }
        ]
      }
    ]);
  });
});

describe('parseBundle', () => {
  it('refuses text that is not JSON', () => {
    expect(parseBundle('{', knows)).toEqual({ ok: false, reason: 'notJson' });
    expect(parseBundle('', knows)).toEqual({ ok: false, reason: 'notJson' });
  });

  it.each([
    ['an array', '[]'],
    ['null', 'null'],
    ['a string', '"daggerheart-loot/lists"'],
    ['no format', '{"version":1,"lists":[]}'],
    ['another format', '{"format":"daggerheart-loot/data","version":1,"lists":[]}']
  ])('refuses %s as not a lists file', (_what, text) => {
    expect(parseBundle(text, knows)).toEqual({ ok: false, reason: 'notBundle' });
  });

  it('refuses another version with the value found, before the walk', () => {
    expect(parseBundle(fixture('v4.json'), knows)).toEqual({
      ok: false,
      reason: 'version',
      version: 4
    });
    expect(parseBundle('{"format":"daggerheart-loot/lists","qty":1}', knows)).toEqual({
      ok: false,
      reason: 'version',
      version: undefined
    });
    expect(parseBundle('{"format":"daggerheart-loot/lists","version":"1"}', knows)).toEqual({
      ok: false,
      reason: 'version',
      version: '1'
    });
  });

  it('refuses a file with no lists as empty', () => {
    expect(parseBundle(doc([]), knows)).toEqual({ ok: false, reason: 'empty' });
  });

  it('reads the defaults of a key left out', () => {
    expect(okOf(parseBundle(oneEntry({}), knows)).lists).toEqual([
      {
        name: 'L',
        money_mode: 'bag',
        player_note: '',
        gm_note: '',
        entries: [
          {
            item_key: 'ci1',
            source: 'official',
            snapshot: null,
            quantity: 1,
            price_coins: null,
            player_note: '',
            gm_note: ''
          }
        ]
      }
    ]);
  });

  it('reports a key missing, after the object own keys, in the schema order', () => {
    expect(
      errorsOf(parseBundle('{"format":"daggerheart-loot/lists","version":1}', knows))
    ).toEqual([{ path: 'lists', field: 'lists', kind: 'missing' }]);
    expect(errorsOf(parseBundle(doc([{ qty: 1 }]), knows))).toEqual([
      { path: 'lists[0].qty', field: 'qty', kind: 'extra' },
      { path: 'lists[0].name', field: 'name', kind: 'missing' },
      { path: 'lists[0].entries', field: 'entries', kind: 'missing' }
    ]);
    expect(errorsOf(parseBundle(oneList({ entries: [{ quantity: 2 }] }), knows))).toEqual([
      { path: 'lists[0].entries[0].id', field: 'id', kind: 'missing' }
    ]);
    expect(errorsOf(parseBundle(oneList({ name: '' }), knows))).toEqual([
      { path: 'lists[0].name', field: 'name', kind: 'missing' }
    ]);
  });

  it('names the list and the entry of an error by their indexes', () => {
    const p = parseBundle(
      doc([
        { name: 'A', entries: [] },
        { name: 'B', entries: [{}, { id: 'q1', x: 1 }] }
      ]),
      knows
    );
    expect(
      p.ok || p.reason !== 'errors' ? null : p.errors.map((e) => [e.list, e.entry])
    ).toEqual([
      [1, 0],
      [1, 1]
    ]);
    const root = parseBundle(doc([], { x: 1 }), knows);
    expect(root.ok || root.reason !== 'errors' ? null : root.errors[0]).toMatchObject({
      list: null,
      entry: null
    });
  });

  it.each([
    ['$schema', doc([{ name: 'L', entries: [] }], { $schema: 1 }), '$schema', '1', 'string'],
    [
      'exported_at',
      doc([{ name: 'L', entries: [] }], { exported_at: null }),
      'exported_at',
      'null',
      'string'
    ],
    ['lists', doc({ a: 1 }), 'lists', '{"a":1}', 'array'],
    ['a list name', oneList({ name: 5 }), 'lists[0].name', '5', 'string'],
    ['a list note', oneList({ gm_note: false }), 'lists[0].gm_note', 'false', 'string'],
    ['entries', oneList({ entries: 'ci1' }), 'lists[0].entries', 'ci1', 'array'],
    ['an entry name', oneEntry({ name: 1 }), 'lists[0].entries[0].name', '1', 'string'],
    [
      'an entry note',
      oneEntry({ player_note: [] }),
      'lists[0].entries[0].player_note',
      '[]',
      'string'
    ],
    [
      'a fractional quantity',
      oneEntry({ quantity: 1.5 }),
      'lists[0].entries[0].quantity',
      '1.5',
      'integer'
    ],
    [
      'a price of null',
      oneEntry({ price_coins: null }),
      'lists[0].entries[0].price_coins',
      'null',
      'integer'
    ],
    [
      'a quantity as text',
      oneEntry({ quantity: '2' }),
      'lists[0].entries[0].quantity',
      '2',
      'integer'
    ],
    [
      'an id with a space',
      oneEntry({ id: 'ci 1' }),
      'lists[0].entries[0].id',
      'ci 1',
      ID_PATTERN.source
    ],
    ['an id as a number', oneEntry({ id: 1 }), 'lists[0].entries[0].id', '1', ID_PATTERN.source]
  ])('refuses %s of the wrong type', (_what, text, path, value, limit) => {
    const [e] = errorsOf(parseBundle(text, knows));
    expect(e).toMatchObject({ path, kind: 'type', value, limit });
  });

  it('refuses a list or an entry that is not an object, at its own path', () => {
    expect(errorsOf(parseBundle(doc(['x']), knows))).toEqual([
      { path: 'lists[0]', field: '', kind: 'type', value: 'x', limit: 'object' }
    ]);
    expect(errorsOf(parseBundle(oneList({ entries: [null] }), knows))).toEqual([
      { path: 'lists[0].entries[0]', field: '', kind: 'type', value: 'null', limit: 'object' }
    ]);
  });

  it('measures a length in code points', () => {
    const astral = '\u{1F5E1}';
    expect(
      okOf(parseBundle(oneList({ name: astral.repeat(NAME_MAX) }), knows)).lists
    ).toHaveLength(1);
    expect(
      errorsOf(parseBundle(oneList({ name: astral.repeat(NAME_MAX + 1) }), knows))
    ).toEqual([{ path: 'lists[0].name', field: 'name', kind: 'long', limit: NAME_MAX }]);
    expect(
      errorsOf(parseBundle(oneEntry({ gm_note: 'я'.repeat(NOTE_MAX + 1) }), knows))
    ).toEqual([
      { path: 'lists[0].entries[0].gm_note', field: 'gm_note', kind: 'long', limit: NOTE_MAX }
    ]);
    expect(errorsOf(parseBundle(oneEntry({ name: 'n'.repeat(NAME_MAX + 1) }), knows))).toEqual([
      { path: 'lists[0].entries[0].name', field: 'name', kind: 'long', limit: NAME_MAX }
    ]);
    expect(
      errorsOf(parseBundle(oneList({ player_note: 'n'.repeat(NOTE_MAX + 1) }), knows))[0]
    ).toMatchObject({ kind: 'long' });
  });

  it.each([
    [{ quantity: 0 }, 'quantity', '0', '1..99'],
    [{ quantity: 100 }, 'quantity', '100', '1..99'],
    [{ price_coins: 0 }, 'price_coins', '0', '1..99999'],
    [{ price_coins: 100000 }, 'price_coins', '100000', '1..99999']
  ])('refuses %o out of range', (entry, field, value, limit) => {
    expect(errorsOf(parseBundle(oneEntry(entry), knows))).toEqual([
      { path: 'lists[0].entries[0].' + field, field, kind: 'range', value, limit }
    ]);
  });

  it('refuses a value outside an enum, homebrew included', () => {
    expect(errorsOf(parseBundle(oneList({ money_mode: 'gold' }), knows))).toEqual([
      {
        path: 'lists[0].money_mode',
        field: 'money_mode',
        kind: 'enum',
        value: 'gold',
        limit: 'bag, coin'
      }
    ]);
    expect(errorsOf(parseBundle(oneEntry({ source: 'homebrew' }), knows))).toEqual([
      {
        path: 'lists[0].entries[0].source',
        field: 'source',
        kind: 'enum',
        value: 'homebrew',
        limit: 'official'
      }
    ]);
  });

  it('refuses a key the schema does not name, at every level', () => {
    expect(errorsOf(parseBundle(oneEntry({ qty: 2 }), knows))).toEqual([
      { path: 'lists[0].entries[0].qty', field: 'qty', kind: 'extra' }
    ]);
    expect(errorsOf(parseBundle(oneList({ id: 'x' }), knows))).toEqual([
      { path: 'lists[0].id', field: 'id', kind: 'extra' }
    ]);
    expect(
      errorsOf(parseBundle(doc([{ name: 'L', entries: [] }], { 'my key': 1 }), knows))
    ).toEqual([{ path: 'my key', field: 'my key', kind: 'extra' }]);
    const long = 'k'.repeat(60);
    expect(errorsOf(parseBundle(oneList({ 'odd key': 1, [long]: 1 }), knows))).toEqual([
      { path: 'lists[0]["odd key"]', field: 'odd key', kind: 'extra' },
      { path: 'lists[0].' + 'k'.repeat(40), field: 'k'.repeat(40), kind: 'extra' }
    ]);
  });

  it('refuses a 51st list and a 101st entry as too many', () => {
    const lists = Array.from({ length: LISTS_MAX + 1 }, () => ({ name: 'L', entries: [] }));
    expect(errorsOf(parseBundle(doc(lists), knows))).toEqual([
      { path: 'lists', field: 'lists', kind: 'many', limit: LISTS_MAX }
    ]);
    const entries = Array.from({ length: ENTRIES_MAX + 1 }, (_, i) => ({
      id: 'r' + String(i)
    }));
    expect(errorsOf(parseBundle(oneList({ entries }), knows))).toEqual([
      { path: 'lists[0].entries', field: 'entries', kind: 'many', limit: ENTRIES_MAX }
    ]);
  });

  it('keeps the first ERRORS_MAX errors and counts the rest', () => {
    const entries = Array.from({ length: 60 }, () => ({ id: 'ci1', qty: 2 }));
    const p = parseBundle(oneList({ entries }), knows);
    expect(p.ok || p.reason !== 'errors' ? null : [p.errors.length, p.more]).toEqual([
      ERRORS_MAX,
      60 - ERRORS_MAX
    ]);
  });

  it('cuts a value to 40 characters', () => {
    const [e] = errorsOf(parseBundle(oneList({ money_mode: 'б'.repeat(50) }), knows));
    expect(e?.['value']).toBe('б'.repeat(40));
  });

  it('reads errors.json as its four errors in file order, each entry error with its record', () => {
    const p = parseBundle(fixture('errors.json'), knows);
    const { lists } = JSON.parse(fixture('errors.json')) as { lists: { name: string }[] };
    expect(Array.from(lists[0]?.name ?? '')).toHaveLength(NAME_MAX + 1);
    expect(p.ok || p.reason !== 'errors' ? null : p.names).toEqual([lists[0]?.name]);
    expect(p.ok || p.reason !== 'errors' ? null : p.errors).toEqual([
      {
        path: 'lists[0].name',
        list: 0,
        entry: null,
        field: 'name',
        kind: 'long',
        limit: NAME_MAX
      },
      {
        path: 'lists[0].money_mode',
        list: 0,
        entry: null,
        field: 'money_mode',
        kind: 'enum',
        value: 'gold',
        limit: 'bag, coin'
      },
      {
        path: 'lists[0].entries[1].quantity',
        list: 0,
        entry: 1,
        item: 'q1',
        field: 'quantity',
        kind: 'range',
        value: '0',
        limit: '1..99'
      },
      {
        path: 'lists[0].entries[2].qty',
        list: 0,
        entry: 2,
        item: 'q313',
        field: 'qty',
        kind: 'extra'
      }
    ]);
  });

  it('names the record of an entry error even on a key before its id, and only a valid id', () => {
    const itemOf = (text: string): string | undefined => {
      const p = parseBundle(text, knows);
      return p.ok || p.reason !== 'errors' ? 'not refused' : p.errors[0]?.item;
    };
    expect(itemOf(oneList({ entries: [{ qty: 2, id: 'ci1' }] }))).toBe('ci1');
    expect(itemOf(oneList({ entries: [{ id: 'ci 1' }] }))).toBeUndefined();
    expect(itemOf(oneList({ money_mode: 'gold' }))).toBeUndefined();
  });

  it("gives each list's name when it is a string, and none when lists is not an array", () => {
    const namesOf = (text: string): unknown => {
      const p = parseBundle(text, knows);
      return p.ok || p.reason !== 'errors' ? 'not refused' : p.names;
    };
    expect(namesOf(doc(5))).toEqual([]);
    expect(
      namesOf(doc([{ name: 'A', entries: [], x: 1 }, 'x', { name: 3, entries: [] }]))
    ).toEqual(['A', null, null]);
  });

  it('skips an unknown id and a repeated one, and names both', () => {
    const p = okOf(parseBundle(fixture('unknown-id.json'), knows));
    expect(p.skipped).toEqual([
      { list: 0, entry: 3, id: 'zzz1', why: 'unknown' },
      { list: 0, entry: 4, id: 'ci1', why: 'repeat', first: 0 }
    ]);
    expect(p.lists.map((l) => [l.name, l.entries.map((e) => e.item_key)])).toEqual([
      ['Лавка кузнеца', ['ci1', 'q1', 'q313']],
      ['Пустой список', []]
    ]);
    expect(p.lists[0]?.entries[0]).toMatchObject({ quantity: 2, price_coins: 150 });
  });

  it('skips the repeat of an unknown id as unknown', () => {
    const p = okOf(parseBundle(oneList({ entries: [{ id: 'zz1' }, { id: 'zz1' }] }), knows));
    expect(p.skipped.map((s) => s.why)).toEqual(['unknown', 'unknown']);
    expect(p.lists[0]?.entries).toEqual([]);
  });
});

describe('the fixtures', () => {
  it('imports example.json clean, every id known', () => {
    const p = okOf(parseBundle(fixture('example.json'), knows));
    expect(p.skipped).toEqual([]);
    expect(p.lists).toEqual([
      {
        name: 'Лавка кузнеца',
        money_mode: 'coin',
        player_note: 'Открыта с рассвета до заката.',
        gm_note: 'Кузнец торгуется, если назвать имя его брата.',
        entries: [
          {
            item_key: 'ci1',
            source: 'official',
            snapshot: null,
            quantity: 2,
            price_coins: 150,
            player_note: '',
            gm_note: ''
          },
          {
            item_key: 'q1',
            source: 'official',
            snapshot: null,
            quantity: 1,
            price_coins: null,
            player_note: 'Последний в наличии.',
            gm_note: ''
          },
          {
            item_key: 'q313',
            source: 'official',
            snapshot: null,
            quantity: 1,
            price_coins: null,
            player_note: '',
            gm_note: 'Проклят.'
          }
        ]
      }
    ]);
  });

  it("names ci1 in example.json by the record's Russian name", () => {
    const text = fixture('example.json');
    expect(text).toContain('"name": "' + (index.byId.get('ci1')?.ru ?? '?') + '"');
  });

  it('imports export.json clean, with no id, date or share key of a row', () => {
    const text = fixture('export.json');
    expect(okOf(parseBundle(text, knows)).skipped).toEqual([]);
    for (const key of [
      'created_at',
      'updated_at',
      'revision',
      'legacy_fingerprint',
      'token',
      'item_key'
    ]) {
      expect(text).not.toContain('"' + key + '"');
    }
    const lists = (JSON.parse(text) as { lists: Record<string, unknown>[] }).lists;
    for (const l of lists) expect(Object.keys(l)).not.toContain('id');
  });
});

/* The rows of catalog.csv by id: a CSV reader of its own, quoted fields with commas,
   quotes and line breaks included. */
function catalog(): Map<string, Record<string, string>> {
  const text = read('catalog.csv');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text.charAt(i);
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n') {
      rows.push([...row, cell.replace(/\r$/, '')]);
      row = [];
      cell = '';
    } else cell += c;
  }
  const [head = [], ...body] = rows;
  return new Map(
    body.map((r) => [r[0] ?? '', Object.fromEntries(head.map((h, i) => [h, r[i] ?? '']))])
  );
}

/* The blind round (docs/specs/COVERAGE.md): a fresh agent that read only llms.txt,
   catalog.csv and export.json wrote this file for a GM's request - a tier 2 blacksmith's
   shop of six pieces of Core equipment priced in coins, a player note on the shop, a GM
   note on one item, quantity 2 on one, and an empty list named Stash. */
describe('from-llms.json, the blind round', () => {
  const text = fixture('from-llms.json');
  const doc = JSON.parse(text) as {
    lists: {
      name: string;
      money_mode?: string;
      player_note?: string;
      entries: { id: string; quantity?: number; price_coins?: number; gm_note?: string }[];
    }[];
  };

  it('imports clean, with no id skipped', () => {
    const p = okOf(parseBundle(text, knows));
    expect(p.skipped).toEqual([]);
    expect(p.lists).toHaveLength(2);
  });

  it('does what the GM asked', () => {
    const [shop, stash] = doc.lists;
    expect(stash).toEqual({ name: 'Stash', entries: [] });
    expect(shop?.money_mode).toBe('coin');
    expect(shop?.player_note).toBeTruthy();
    const entries = shop?.entries ?? [];
    expect(entries).toHaveLength(6);
    const rows = catalog();
    for (const e of entries) {
      expect(rows.get(e.id)).toMatchObject({ source: 'Core', tier: '2' });
      expect(['weapon', 'secondary', 'armor']).toContain(rows.get(e.id)?.['kind']);
      expect(e.price_coins).toBeGreaterThan(0);
    }
    expect(entries.filter((e) => e.quantity === 2)).toHaveLength(1);
    expect(entries.some((e) => e.gm_note)).toBe(true);
  });
});

describe('llms.txt', () => {
  const llms = read('llms.txt');
  const section = llms.slice(llms.indexOf('## Lists as a file (import-v1)'));

  it('carries a first json block in its section that imports clean', () => {
    expect(llms).toContain('## Lists as a file (import-v1)');
    const block = /\n```json\n([\s\S]*?)\n```\n/.exec(section)?.[1];
    expect(block).toBeTruthy();
    expect(okOf(parseBundle(block ?? '', knows)).skipped).toEqual([]);
  });
});

const cloud = (over: Partial<CloudList> = {}): CloudList => ({
  id: 'l1',
  name: 'Лавка',
  ids: [],
  updated: 0,
  entryIds: {},
  ...over
});
const AT = new Date('2026-09-25T12:00:00.000Z');
const nameOf = (id: string): string | undefined => index.byId.get(id)?.ru;

describe('toBundle and the round trip', () => {
  it('writes a sparse file: defaults and row keys left out', () => {
    const b = toBundle(
      [
        cloud({
          money: 'coin',
          note: 'p',
          hnote: 'g',
          ids: ['ci1', 'q1', 'zz_gone'],
          meta: { ci1: { qty: 2, gold: 150 }, q1: { note: 'n', hnote: 'h' } }
        }),
        cloud({ id: 'l2', name: 'Пусто' })
      ],
      nameOf,
      'Без названия',
      AT,
      () => null
    ).bundle;
    expect(b).toEqual({
      $schema: BUNDLE_SCHEMA,
      format: BUNDLE_FORMAT,
      version: 1,
      exported_at: '2026-09-25T12:00:00.000Z',
      lists: [
        {
          name: 'Лавка',
          money_mode: 'coin',
          player_note: 'p',
          gm_note: 'g',
          entries: [
            { id: 'ci1', name: 'Первоклассный Спальный Мешок', quantity: 2, price_coins: 150 },
            { id: 'q1', name: 'Палаш', player_note: 'n', gm_note: 'h' },
            { id: 'zz_gone' }
          ]
        },
        { name: 'Пусто', entries: [] }
      ]
    });
    expect(Object.keys(b.lists[0] ?? {})).toEqual([
      'name',
      'money_mode',
      'player_note',
      'gm_note',
      'entries'
    ]);
  });

  it('writes a blank name as untitled, and the file imports clean', () => {
    const b = toBundle(
      [cloud({ name: '' }), cloud({ id: 'l2', name: '   ', ids: ['ci1'] })],
      nameOf,
      'Без названия',
      AT,
      () => null
    ).bundle;
    expect(b.lists.map((l) => l.name)).toEqual(['Без названия', 'Без названия']);
    const p = okOf(parseBundle(bundleText(b), knows));
    expect(p.lists.map((l) => l.name)).toEqual(['Без названия', 'Без названия']);
  });

  it('reads back what it wrote', () => {
    const lists = [
      cloud({
        ids: ['q313', 'ci1'],
        money: 'coin',
        hnote: 'g',
        meta: { ci1: { qty: 99, gold: 99999, note: 'a' }, q313: { hnote: 'b' } }
      })
    ];
    const text = bundleText(toBundle(lists, nameOf, 'U', AT, () => null).bundle);
    expect(text.endsWith('}\n')).toBe(true);
    expect(text).toBe(JSON.stringify(JSON.parse(text), null, 2) + '\n');
    expect(okOf(parseBundle(text, knows)).lists).toEqual([
      {
        name: 'Лавка',
        money_mode: 'coin',
        player_note: '',
        gm_note: 'g',
        entries: [
          {
            item_key: 'q313',
            source: 'official',
            snapshot: null,
            quantity: 1,
            price_coins: null,
            player_note: '',
            gm_note: 'b'
          },
          {
            item_key: 'ci1',
            source: 'official',
            snapshot: null,
            quantity: 99,
            price_coins: 99999,
            player_note: 'a',
            gm_note: ''
          }
        ]
      }
    ]);
  });
});

/* An account holding the items `items` and the cards `cards`; ids and keys count up. */
const accountOf = (
  items: readonly string[] = [],
  cards: readonly string[] = []
): PlanAccount => {
  let n = 0;
  let k = 0;
  return {
    newId: () => 'id' + String(n++),
    newKey: () => 'hb_newkey' + 'abcdefghij'.charAt(k++) + 'aaaaaaaaa',
    hasItem: (key) => items.includes(key),
    hasCard: (key) => cards.includes(key)
  };
};

describe('importPlan', () => {
  it('makes every id with newId and counts positions after the skips', () => {
    const p = okOf(parseBundle(fixture('unknown-id.json'), knows));
    const { rows, copies } = importPlan(p.lists, accountOf());
    expect(copies).toBeNull();
    expect(rows.map((r) => r.list)).toEqual([
      {
        id: 'id0',
        name: 'Лавка кузнеца',
        money_mode: 'coin',
        player_note: 'Открыта с рассвета до заката.',
        gm_note: 'Кузнец торгуется, если назвать имя его брата.'
      },
      { id: 'id4', name: 'Пустой список', money_mode: 'bag', player_note: '', gm_note: '' }
    ]);
    expect(rows[0]?.entries).toEqual([
      {
        id: 'id1',
        item_key: 'ci1',
        source: 'official',
        hb_item: null,
        position: 0,
        quantity: 2,
        price_coins: 150,
        player_note: '',
        gm_note: ''
      },
      {
        id: 'id2',
        item_key: 'q1',
        source: 'official',
        hb_item: null,
        position: 1,
        quantity: 1,
        price_coins: null,
        player_note: 'Последний в наличии.',
        gm_note: ''
      },
      {
        id: 'id3',
        item_key: 'q313',
        source: 'official',
        hb_item: null,
        position: 2,
        quantity: 1,
        price_coins: null,
        player_note: '',
        gm_note: 'Проклят.'
      }
    ]);
    expect(rows[1]?.entries).toEqual([]);
  });
});

describe('bundleFileName', () => {
  const day = new Date(2026, 8, 5, 23, 30);

  it('dates a file of several lists, or of none, by the local day', () => {
    expect(bundleFileName([{ name: 'a' }, { name: 'b' }], day)).toBe(
      'daggerheart-loot-lists-2026-09-05.json'
    );
    expect(bundleFileName([], day)).toBe('daggerheart-loot-lists-2026-09-05.json');
  });

  it("names one list's file after the list, the unsafe characters replaced", () => {
    expect(bundleFileName([{ name: 'Лавка кузнеца' }], day)).toBe('Лавка кузнеца.json');
    expect(bundleFileName([{ name: ' a\\b/c:d*e?f"g<h>i|j\tk\u007f ' }], day)).toBe(
      'a_b_c_d_e_f_g_h_i_j_k_.json'
    );
    expect(bundleFileName([{ name: '  ' }], day)).toBe('list.json');
    expect(bundleFileName([{ name: '\u{1F5E1}'.repeat(90) }], day)).toBe(
      '\u{1F5E1}'.repeat(80) + '.json'
    );
  });
});

describe('dataFileName', () => {
  it('dates the data file by the local day', () => {
    expect(dataFileName(new Date(2026, 9, 1, 23, 59))).toBe(
      'daggerheart-loot-data-2026-10-01.zip'
    );
  });
});

describe('overBounds', () => {
  const list = (name: string, n: number): BundleList => ({
    name,
    entries: Array.from({ length: n }, (_, i) => ({ id: 'r' + String(i) }))
  });
  const file = (lists: BundleList[]): Bundle => ({
    $schema: BUNDLE_SCHEMA,
    format: BUNDLE_FORMAT,
    version: BUNDLE_VERSION,
    exported_at: '2026-10-01T12:00:00.000Z',
    lists
  });

  it('finds too many lists', () => {
    expect(overBounds(file(Array.from({ length: LISTS_MAX + 1 }, () => list('L', 0))))).toEqual(
      { many: true, long: [] }
    );
  });

  it('names the lists past the entry bound, in file order', () => {
    expect(
      overBounds(
        file([list('A', ENTRIES_MAX + 1), list('B', ENTRIES_MAX), list('C', ENTRIES_MAX + 2)])
      )
    ).toEqual({ many: false, long: ['A', 'C'] });
  });

  it('finds nothing in export.json', () => {
    expect(overBounds(JSON.parse(fixture('export.json')) as Bundle)).toEqual({
      many: false,
      long: []
    });
  });
});

describe('decodeText', () => {
  const bytes = (...b: number[]): Uint8Array => new Uint8Array(b);

  it('reads UTF-8 and drops a leading byte order mark', () => {
    expect(decodeText(new TextEncoder().encode('Лавка'))).toBe('Лавка');
    expect(decodeText(bytes(0xef, 0xbb, 0xbf, 0x7b, 0x7d))).toBe('{}');
  });

  it('answers null for bytes that are not UTF-8', () => {
    expect(decodeText(bytes(0x7b, 0xff, 0x7d))).toBeNull();
    expect(decodeText(bytes(0xd0))).toBeNull();
  });

  it('names a file limit of 5 MiB', () => {
    expect(FILE_MAX_BYTES).toBe(5 * 1024 * 1024);
  });
});

/* ---------- version 2: homebrew entries (schema/import-v2.json) ---------- */

/* A walk of a value against a schema node, for the keywords the two lists schemas use; the
   problems by path. */
type Schema = Record<string, unknown>;
function walk(v: unknown, node: Schema, root: Schema, path: string, out: string[]): void {
  const ref = node['$ref'];
  if (typeof ref === 'string') {
    const name = ref.replace('#/$defs/', '');
    walk(v, (root['$defs'] as Record<string, Schema>)[name] ?? {}, root, path, out);
  }
  if ('const' in node && v !== node['const']) out.push(path + ' const');
  if (Array.isArray(node['enum']) && !node['enum'].includes(v)) out.push(path + ' enum');
  const type = node['type'];
  const isObj = v !== null && typeof v === 'object' && !Array.isArray(v);
  if (type === 'object' && !isObj) out.push(path + ' type');
  if (type === 'array' && !Array.isArray(v)) out.push(path + ' type');
  if (type === 'string' && typeof v !== 'string') out.push(path + ' type');
  if (type === 'integer' && !Number.isInteger(v)) out.push(path + ' type');
  if (type === 'boolean' && typeof v !== 'boolean') out.push(path + ' type');
  if (typeof v === 'string') {
    if (typeof node['maxLength'] === 'number' && Array.from(v).length > node['maxLength'])
      out.push(path + ' maxLength');
    if (typeof node['pattern'] === 'string' && !new RegExp(node['pattern'], 'u').test(v))
      out.push(path + ' pattern');
  }
  if (typeof v === 'number') {
    if (typeof node['minimum'] === 'number' && v < node['minimum']) out.push(path + ' minimum');
    if (typeof node['maximum'] === 'number' && v > node['maximum']) out.push(path + ' maximum');
  }
  if (Array.isArray(v)) {
    if (typeof node['maxItems'] === 'number' && v.length > node['maxItems'])
      out.push(path + ' maxItems');
    if (typeof node['minItems'] === 'number' && v.length < node['minItems'])
      out.push(path + ' minItems');
    const items = node['items'] as Schema | undefined;
    if (items) {
      v.forEach((x, i) => {
        walk(x, items, root, path + '[' + String(i) + ']', out);
      });
    }
  }
  if (isObj) {
    const o = v as Record<string, unknown>;
    const props = (node['properties'] ?? {}) as Record<string, Schema>;
    for (const k of (node['required'] ?? []) as string[]) {
      if (!(k in o)) out.push(path + '.' + k + ' required');
    }
    for (const [k, x] of Object.entries(o)) {
      const own = props[k];
      if (own) walk(x, own, root, path + '.' + k, out);
      else if (node['additionalProperties'] === false) out.push(path + '.' + k + ' extra');
      else if (typeof node['additionalProperties'] === 'object') {
        walk(x, node['additionalProperties'] as Schema, root, path + '.' + k, out);
      }
      if (node['propertyNames']) {
        walk(k, node['propertyNames'] as Schema, root, path + ' key ' + k, out);
      }
    }
  }
  const passes = (n: Schema): boolean => {
    const probe: string[] = [];
    walk(v, n, root, path, probe);
    return !probe.length;
  };
  const cond = node['if'] as Schema | undefined;
  if (cond) {
    const branch = (passes(cond) ? node['then'] : node['else']) as Schema | undefined;
    if (branch) walk(v, branch, root, path, out);
  }
  const not = node['not'] as Schema | undefined;
  if (not && passes(not)) out.push(path + ' not');
  const anyOf = node['anyOf'] as Schema[] | undefined;
  if (anyOf && !anyOf.some(passes)) out.push(path + ' anyOf');
}
const V2 = JSON.parse(read('schema', 'import-v2.json')) as ObjectSchema & {
  $defs: Record<string, ObjectSchema>;
};
const problemsAgainst =
  (s: object) =>
  (v: unknown): string[] => {
    const out: string[] = [];
    walk(v, s as Schema, s as Schema, '', out);
    return out;
  };
const schemaProblems = problemsAgainst(V2);
const AXE = 'hb_emberaxeaaaaaaaa';
const SNAP: HomebrewRecord = recordOf(
  AXE,
  {
    kind: 'equip',
    ru: 'Топор',
    set: 'hb_aldersetaaaaaaaa',
    refs: ['hb_alderrulecardaaa', 'slow'],
    section: 'hb_sectbladesaaaaaa',
    eq: {
      t: 'weapon',
      tier: 'A',
      cls: 'mag',
      tr: 'spellcast',
      rg: 'melee',
      dmg: 'd10+2',
      dt: 'mag',
      bu: 2
    }
  },
  {
    key: 'hb_alderworkshopaaa',
    ru: 'Мастерская Ольхи',
    sections: [{ key: 'hb_sectbladesaaaaaa', en: 'Blades' }]
  },
  [
    { key: 'hb_aldersetaaaaaaaa', kind: 'set', ru: 'Комплект', rud: 'Бонус.' },
    { key: 'hb_alderrulecardaaa', kind: 'ref', en: 'Brand', ende: 'Text.' }
  ]
);

describe('the import-v2 schema and the validator (the drift guard)', () => {
  const list = V2.$defs['list'] as ObjectSchema;
  const entry = V2.$defs['entry'] as ObjectSchema;

  it('names its URL and version 2, and keeps every key and bound of version 1', () => {
    expect(V2.$id).toBe(BUNDLE_SCHEMA_HOMEBREW);
    expect(prop(V2, 'format').const).toBe(BUNDLE_FORMAT);
    expect(prop(V2, 'version').const).toBe(BUNDLE_VERSION_HOMEBREW);
    expect(Object.keys(V2.properties)).toEqual(ROOT_KEYS);
    expect(Object.keys(list.properties)).toEqual(LIST_KEYS);
    expect(Object.keys(entry.properties)).toEqual(ENTRY_KEYS_HOMEBREW);
    expect(prop(entry, 'source').enum).toEqual(SOURCES_HOMEBREW);
    expect(prop(V2, 'lists').maxItems).toBe(LISTS_MAX);
    expect(prop(list, 'entries').maxItems).toBe(ENTRIES_MAX);
    for (const k of Object.keys(LIST.properties)) expect(prop(list, k)).toEqual(prop(LIST, k));
    for (const k of ['name', 'quantity', 'price_coins', 'player_note', 'gm_note']) {
      expect(prop(entry, k)).toEqual(prop(ENTRY, k));
    }
    for (const s of [V2, list, entry, V2.$defs['snapshot'] as ObjectSchema]) {
      expect(s.additionalProperties).toBe(false);
      for (const x of Object.values(s.properties)) expect(x.description).toBeTruthy();
    }
  });

  it("describes the snapshot's tier rule and its byte bound", () => {
    const snapshot = V2.$defs['snapshot'] as ObjectSchema;
    expect(prop(snapshot, 'tier').description).toContain('eq.tier is A');
    expect(prop(entry, 'snapshot').description).toContain(String(SNAPSHOT_BYTES));
  });

  it('takes a v2 export with an embedded set and rule card, url "" included, by its own walk', () => {
    expect(SNAP.cards?.refs?.['hb_alderrulecardaaa']?.url).toBe('');
    const { bundle } = toBundle(
      [cloud({ ids: ['ci1', AXE], meta: { [AXE]: { qty: 2 } } })],
      nameOf,
      'U',
      AT,
      (id) => (id === AXE ? SNAP : null)
    );
    expect(schemaProblems(bundle)).toEqual([]);
    expect(schemaProblems(JSON.parse(fixture('example-v2.json')))).toEqual([]);
    expect(schemaProblems({ ...bundle, version: 1 })).toEqual(['.version const']);
    const bare = {
      ...bundle,
      lists: [{ name: 'L', entries: [{ id: AXE, source: 'homebrew' }] }]
    };
    expect(schemaProblems(bare)).toEqual([]);
    expect(schemaProblems(JSON.parse(fixture('keys-only-v2.json')))).toEqual([]);
  });

  it("does not require a homebrew entry's snapshot", () => {
    const then = (entry as ObjectSchema & { then?: { required?: string[] } }).then;
    expect(then?.required ?? []).not.toContain('snapshot');
  });
});

describe('a lists file of version 2', () => {
  it('reads version 1 and 2', () => {
    expect(okOf(parseBundle(fixture('example.json'), knows)).lists).toHaveLength(1);
    expect(okOf(parseBundle(fixture('example-v2.json'), knows)).lists).toHaveLength(1);
  });

  it('reads example-v2.json: the catalog entry, then two homebrew entries with their snapshots', () => {
    const [l] = okOf(parseBundle(fixture('example-v2.json'), knows)).lists;
    expect(l?.entries.map((e) => [e.item_key, e.source, e.snapshot?.id ?? null])).toEqual([
      ['ci1', 'official', null],
      ['hb_flintlockpistola', 'homebrew', 'hb_flintlockpistola'],
      ['hb_wanderlampaaaaaa', 'homebrew', 'hb_wanderlampaaaaaa']
    ]);
  });

  it('reads errors-v2.json as a snapshot that is not a copy and an id that is not a key', () => {
    expect(errorsOf(parseBundle(fixture('errors-v2.json'), knows))).toEqual([
      {
        path: 'lists[0].entries[1].snapshot',
        field: 'snapshot',
        kind: 'snapshot',
        value: undefined,
        limit: undefined
      },
      {
        path: 'lists[0].entries[2].id',
        field: 'id',
        kind: 'hbId',
        value: 'lamp-1',
        limit: undefined
      }
    ]);
  });

  const v2 = (entry: Record<string, unknown>): string =>
    JSON.stringify({
      format: BUNDLE_FORMAT,
      version: 2,
      lists: [{ name: 'L', entries: [{ id: AXE, ...entry }] }]
    });

  it('reads a homebrew entry without a snapshot as its key', () => {
    const p = okOf(parseBundle(v2({ source: 'homebrew' }), knows, () => true));
    expect(p.skipped).toEqual([]);
    expect(p.lists[0]?.entries).toEqual([
      {
        item_key: AXE,
        source: 'homebrew',
        snapshot: null,
        quantity: 1,
        price_coins: null,
        player_note: '',
        gm_note: ''
      }
    ]);
  });

  it('refuses a homebrew entry without a snapshot whose id is not a key, once', () => {
    const text = JSON.stringify({
      format: BUNDLE_FORMAT,
      version: 2,
      lists: [{ name: 'L', entries: [{ id: 'lamp-1', source: 'homebrew' }] }]
    });
    expect(
      errorsOf(parseBundle(text, knows, () => true)).map((e) => [e['field'], e['kind']])
    ).toEqual([['id', 'hbId']]);
  });

  it.each([
    [
      'a snapshot of another key',
      { source: 'homebrew', snapshot: { ...SNAP, id: 'hb_otherkeyaaaaaaaa' } },
      'snapshot',
      'snapshot'
    ],
    ['an official entry with a snapshot', { snapshot: SNAP }, 'snapshot', 'extra'],
    ['another source', { source: 'shared', snapshot: SNAP }, 'source', 'enum']
  ])('refuses %s', (_what, entry, field, kind) => {
    expect(
      errorsOf(parseBundle(v2(entry), knows)).map((e) => [e['field'], e['kind']])
    ).toContainEqual([field, kind]);
  });

  /* The keys schema/import-v2.json requires, which snapshotValid alone does not ask. */
  const without = (o: object, key: string): Record<string, unknown> =>
    Object.fromEntries(Object.entries(o).filter(([k]) => k !== key));
  const SET_KEY = 'hb_aldersetaaaaaaaa';
  const REF_KEY = 'hb_alderrulecardaaa';
  it.each(['en', 'ru', 'ende', 'rud'])('refuses a snapshot without its %s', (key) => {
    const snapshot = without(SNAP, key);
    expect(
      errorsOf(parseBundle(v2({ source: 'homebrew', snapshot }), knows)).map((e) => [
        e['path'],
        e['kind']
      ])
    ).toEqual([['lists[0].entries[0].snapshot', 'snapshot']]);
  });

  it.each(['en', 'ru', 'ende', 'rud'])('refuses an embedded set card without its %s', (key) => {
    const set = SNAP.cards?.sets?.[SET_KEY];
    expect(set).toBeDefined();
    const snapshot = {
      ...SNAP,
      cards: { ...SNAP.cards, sets: { [SET_KEY]: without(set!, key) } }
    };
    expect(
      errorsOf(parseBundle(v2({ source: 'homebrew', snapshot }), knows)).map((e) => e['kind'])
    ).toEqual(['snapshot']);
  });

  it.each(['en', 'ru', 'ensub', 'rusub', 'ende', 'rud', 'url'])(
    'refuses an embedded rule card without its %s',
    (key) => {
      const ref = SNAP.cards?.refs?.[REF_KEY];
      expect(ref).toBeDefined();
      const snapshot = {
        ...SNAP,
        cards: { ...SNAP.cards, refs: { [REF_KEY]: without(ref!, key) } }
      };
      expect(
        errorsOf(parseBundle(v2({ source: 'homebrew', snapshot }), knows)).map((e) => e['kind'])
      ).toEqual(['snapshot']);
    }
  );

  it('refuses a homebrew entry and a snapshot in version 1', () => {
    const v1 = JSON.stringify({
      format: BUNDLE_FORMAT,
      version: 1,
      lists: [{ name: 'L', entries: [{ id: AXE, source: 'homebrew', snapshot: SNAP }] }]
    });
    expect(errorsOf(parseBundle(v1, knows)).map((e) => [e['field'], e['kind']])).toEqual([
      ['source', 'enum'],
      ['snapshot', 'extra']
    ]);
  });

  it('never skips a homebrew entry as unknown, and skips its repeat', () => {
    const text = JSON.stringify({
      format: BUNDLE_FORMAT,
      version: 2,
      lists: [
        {
          name: 'L',
          entries: [
            { id: AXE, source: 'homebrew', snapshot: SNAP },
            { id: AXE, source: 'homebrew', snapshot: SNAP }
          ]
        }
      ]
    });
    const p = okOf(parseBundle(text, () => false));
    expect(p.lists[0]?.entries.map((e) => e.item_key)).toEqual([AXE]);
    expect(p.skipped).toEqual([{ list: 0, entry: 1, id: AXE, why: 'repeat', first: 0 }]);
  });

  it('sends every homebrew entry by its key, and makes a fixed copy of each key the account does not hold', () => {
    const p = okOf(parseBundle(fixture('example-v2.json'), knows));
    const held = importPlan(p.lists, accountOf(['hb_flintlockpistola']));
    expect(held.rows[0]?.entries.map((e) => [e.item_key, e.source, e.hb_item])).toEqual([
      ['ci1', 'official', null],
      ['hb_flintlockpistola', 'homebrew', null],
      ['hb_wanderlampaaaaaa', 'homebrew', null]
    ]);
    expect(held.copies).toEqual({
      books: [],
      cards: [],
      items: [
        {
          id: 'id4',
          key: 'hb_wanderlampaaaaaa',
          book: null,
          content: {
            kind: 'item',
            ru: 'Лампа странника',
            en: "Wanderer's Lamp",
            rud: 'Светит только тому, кто её несёт.',
            ende: 'Sheds light only for the one who carries it.'
          }
        }
      ],
      update: false
    });
    const none = importPlan(p.lists, accountOf());
    expect(none.copies?.items.map((i) => [i.key, i.book])).toEqual([
      ['hb_flintlockpistola', null],
      ['hb_wanderlampaaaaaa', null]
    ]);
    /* The pistol's set card and rule card come along, its source and section do not. */
    expect(none.copies?.cards.map((c) => [c.kind, c.key, c.book, c.content.en])).toEqual([
      ['set', 'hb_emberpairsetaaaa', null, 'Smouldering Pair'],
      ['ref', 'hb_reloadruleaaaaaa', null, 'Reload']
    ]);
    const pistol = none.copies?.items[0]?.content;
    expect(pistol?.section).toBeUndefined();
    expect([pistol?.set, pistol?.refs]).toEqual([
      'hb_emberpairsetaaaa',
      ['hb_reloadruleaaaaaa']
    ]);
  });

  it('names a card the account holds instead of copying it', () => {
    const p = okOf(parseBundle(fixture('example-v2.json'), knows));
    const plan = importPlan(p.lists, accountOf([], ['hb_emberpairsetaaaa']));
    expect(plan.copies?.cards.map((c) => c.key)).toEqual(['hb_reloadruleaaaaaa']);
    expect(plan.copies?.items[0]?.content.set).toBe('hb_emberpairsetaaaa');
  });

  it('makes one copy per distinct snapshot of a key, a later differing one under a new key', () => {
    const p = okOf(parseBundle(fixture('example-v2.json'), knows));
    const [list] = p.lists;
    const lamp = list?.entries[2];
    if (!list || !lamp?.snapshot) throw new Error('no lamp');
    const changed: ImportList = {
      ...list,
      entries: [{ ...lamp, snapshot: { ...lamp.snapshot, rud: 'Другая лампа.' } }]
    };
    const plan = importPlan([list, list, changed], accountOf(['hb_flintlockpistola']));
    expect(plan.copies?.items.map((i) => [i.key, i.content.rud])).toEqual([
      ['hb_wanderlampaaaaaa', 'Светит только тому, кто её несёт.'],
      ['hb_newkeyaaaaaaaaaa', 'Другая лампа.']
    ]);
    expect(plan.rows.map((r) => r.entries.at(-1)?.item_key)).toEqual([
      'hb_wanderlampaaaaaa',
      'hb_wanderlampaaaaaa',
      'hb_newkeyaaaaaaaaaa'
    ]);
  });

  it('gives a card variant a new key, which its copy then names', () => {
    const p = okOf(parseBundle(fixture('example-v2.json'), knows));
    const [list] = p.lists;
    const pistol = list?.entries[1];
    const snap = pistol?.snapshot;
    if (!list || !pistol || !snap?.cards?.sets) throw new Error('no pistol');
    const other: ImportList = {
      ...list,
      entries: [
        {
          ...pistol,
          snapshot: {
            ...snap,
            en: 'Flintlock Pistol II',
            cards: {
              ...snap.cards,
              sets: {
                hb_emberpairsetaaaa: {
                  ...snap.cards.sets['hb_emberpairsetaaaa']!,
                  en: 'Pair II'
                }
              }
            }
          }
        }
      ]
    };
    const plan = importPlan([list, other], accountOf(['hb_wanderlampaaaaaa']));
    expect(plan.copies?.cards.map((c) => [c.key, c.content.en])).toEqual([
      ['hb_emberpairsetaaaa', 'Smouldering Pair'],
      ['hb_reloadruleaaaaaa', 'Reload'],
      ['hb_newkeyaaaaaaaaaa', 'Pair II']
    ]);
    expect(plan.copies?.items.map((i) => [i.key, i.content.set])).toEqual([
      ['hb_flintlockpistola', 'hb_emberpairsetaaaa'],
      ['hb_newkeybaaaaaaaaa', 'hb_newkeyaaaaaaaaaa']
    ]);
  });

  it('writes version 1 when no homebrew entry is written, and counts the ones left out', () => {
    const lists = [cloud({ ids: ['ci1', AXE] })];
    const none = toBundle(lists, nameOf, 'U', AT, () => null);
    expect([none.bundle.version, none.bundle.$schema, none.skipped]).toEqual([
      1,
      BUNDLE_SCHEMA,
      1
    ]);
    expect(none.bundle.lists[0]?.entries).toEqual([
      { id: 'ci1', name: 'Первоклассный Спальный Мешок' }
    ]);
    const one = toBundle(lists, nameOf, 'U', AT, () => SNAP);
    expect([one.bundle.version, one.bundle.$schema, one.skipped]).toEqual([
      2,
      BUNDLE_SCHEMA_HOMEBREW,
      0
    ]);
    expect(Object.keys(one.bundle.lists[0]?.entries[1] ?? {})).toEqual([
      'id',
      'source',
      'snapshot'
    ]);
    const back = okOf(parseBundle(bundleText(one.bundle), knows));
    expect(back.lists[0]?.entries[1]).toMatchObject({
      item_key: AXE,
      source: 'homebrew',
      snapshot: SNAP
    });
  });

  it("writes a linked record's snapshot without its hid", () => {
    const lists = [cloud({ ids: [AXE] })];
    const linked = { ...SNAP, hid: '00000000-0000-4000-8000-000000000511' };
    const { bundle } = toBundle(lists, nameOf, 'U', AT, () => linked);
    expect(bundle.lists[0]?.entries[0]?.snapshot).toEqual(SNAP);
  });
});

/* The blind round's lists file for request R-B: the Premium Bedroll, 2 at 150 coins, and
   both blades of the agent's homebrew file, each with its snapshot. */
describe('from-llms-v2.json, the blind round', () => {
  const text = fixture('from-llms-v2.json');
  const blades = (
    JSON.parse(read('docs', 'fixtures', 'homebrew-file', 'from-llms.json')) as {
      items: { key: string; kind: string; eq?: { t: string } }[];
    }
  ).items
    .filter((i) => i.eq?.t === 'weapon')
    .map((i) => i.key);

  it('reads clean, and passes a walk of the schema', () => {
    expect(okOf(parseBundle(text, knows)).skipped).toEqual([]);
    expect(schemaProblems(JSON.parse(text))).toEqual([]);
  });

  it('does what the GM asked', () => {
    const [l] = okOf(parseBundle(text, knows)).lists;
    expect(l?.name).toBe('Лавка у перевала');
    expect(l?.entries[0]).toMatchObject({ item_key: 'ci1', quantity: 2, price_coins: 150 });
    const own = l?.entries.filter((e) => e.source === 'homebrew') ?? [];
    expect(own.map((e) => e.item_key)).toEqual(blades);
    expect(own.map((e) => e.snapshot?.id)).toEqual(blades);
  });
});

/* The owner's hand-test file over bedrolls.json: the catalog's Premium Bedroll and the six
   bedrolls, each with the snapshot `homebrew_snapshot_of` writes for its item. */
describe('bedroll-shop.json', () => {
  const text = fixture('bedroll-shop.json');
  const file = JSON.parse(read('docs', 'fixtures', 'homebrew-file', 'bedrolls.json')) as {
    books: (BookContent & { key: string })[];
    cards: (CardContent & { key: string; kind: CardKind })[];
    items: (HomebrewContent & { key: string; book?: string })[];
  };

  it('reads clean with the v2 reader, and passes a walk of the schema', () => {
    const p = okOf(parseBundle(text, knows));
    expect(p.skipped).toEqual([]);
    expect(schemaProblems(JSON.parse(text))).toEqual([]);
    const [l] = p.lists;
    expect(l?.name).toBe('Лавка спальников');
    expect(l?.entries.map((e) => e.item_key)).toEqual(['ci1', ...file.items.map((i) => i.key)]);
  });

  it("holds each snapshot equal to recordOf of its bedrolls.json item, with that file's cards", () => {
    /* recordOf reads a card's texts only: the file's `book` key changes nothing. */
    const cards = file.cards;
    const [l] = okOf(parseBundle(text, knows)).lists;
    for (const e of l?.entries.filter((x) => x.source === 'homebrew') ?? []) {
      const it = file.items.find((i) => i.key === e.item_key);
      expect(it).toBeDefined();
      const { key, book, ...content } = it!;
      const b = file.books.find((x) => x.key === book) ?? null;
      expect(e.snapshot).toEqual(recordOf(key, content, b, cards));
    }
  });

  it('links six held bedrolls with no copy, else makes six copies with their cards', () => {
    const p = okOf(parseBundle(text, knows));
    const keys = file.items.map((i) => i.key);
    const held = importPlan(
      p.lists,
      accountOf(
        keys,
        file.cards.map((c) => c.key)
      )
    );
    expect(held.copies).toBeNull();
    expect(held.rows[0]?.entries.filter((e) => e.source === 'homebrew')).toHaveLength(6);
    const none = importPlan(p.lists, accountOf());
    expect(none.copies?.items.map((i) => i.key)).toEqual(keys);
    expect(none.copies?.cards.length).toBeGreaterThan(0);
  });
});

describe('export-v2.json, the lists export with an own item', () => {
  it('reads clean, the axe as a homebrew entry, and passes a walk of the schema', () => {
    const text = fixture('export-v2.json');
    const p = okOf(parseBundle(text, knows));
    expect(schemaProblems(JSON.parse(text))).toEqual([]);
    expect(
      p.lists.flatMap((l) => l.entries).filter((e) => e.source === 'homebrew')
    ).toHaveLength(1);
  });
});

describe('keys-only-v2.json: homebrew entries without a snapshot', () => {
  const LAMP = 'hb_wanderlampaaaaaa';
  const text = fixture('keys-only-v2.json');
  const kept = (p: Extract<Parsed, { ok: true }>): [string, string | null][][] =>
    p.lists.map((l) => l.entries.map((e) => [e.item_key, e.snapshot?.id ?? null]));
  const oneList = (entries: Record<string, unknown>[], version = 2): string =>
    JSON.stringify({ format: BUNDLE_FORMAT, version, lists: [{ name: 'L', entries }] });

  it('passes a walk of the schema', () => {
    expect(schemaProblems(JSON.parse(text))).toEqual([]);
  });

  it('keeps a held key, skips an unheld one, and a skipped entry is no first (the axe held)', () => {
    const p = okOf(parseBundle(text, knows, (k) => k === AXE));
    expect(kept(p)).toEqual([
      [
        ['ci1', null],
        [AXE, null]
      ],
      [[LAMP, LAMP]]
    ]);
    expect(p.skipped).toEqual([
      { list: 0, entry: 2, id: LAMP, why: 'unheld' },
      { list: 0, entry: 3, id: AXE, why: 'repeat', first: 1 },
      { list: 1, entry: 0, id: LAMP, why: 'unheld' },
      { list: 1, entry: 2, id: LAMP, why: 'repeat', first: 1 }
    ]);
  });

  it('keeps the entries with a snapshot in an account with no own items', () => {
    const p = okOf(parseBundle(text, knows, () => false));
    expect(kept(p)).toEqual([
      [
        ['ci1', null],
        [AXE, AXE]
      ],
      [[LAMP, LAMP]]
    ]);
    expect(p.skipped).toEqual([
      { list: 0, entry: 1, id: AXE, why: 'unheld' },
      { list: 0, entry: 2, id: LAMP, why: 'unheld' },
      { list: 1, entry: 0, id: LAMP, why: 'unheld' },
      { list: 1, entry: 2, id: LAMP, why: 'repeat', first: 1 }
    ]);
  });

  it('skips an unknown id before a repeat, and a repeat before an unheld key', () => {
    const doc = oneList([
      { id: 'nosuchid' },
      { id: AXE, source: 'homebrew' },
      { id: 'nosuchid' },
      { id: AXE, source: 'homebrew' },
      { id: LAMP, source: 'homebrew' }
    ]);
    const p = okOf(parseBundle(doc, knows, (k) => k === AXE));
    expect(p.skipped.map((x) => [x.entry, x.why])).toEqual([
      [0, 'unknown'],
      [2, 'unknown'],
      [3, 'repeat'],
      [4, 'unheld']
    ]);
  });

  it('plans the held axe as a link and copies the lamp only', () => {
    const p = okOf(parseBundle(text, knows, (k) => k === AXE));
    const plan = importPlan(p.lists, accountOf([AXE]));
    expect(
      plan.rows.map((r) => r.entries.map((e) => [e.item_key, e.source, e.position, e.hb_item]))
    ).toEqual([
      [
        ['ci1', 'official', 0, null],
        [AXE, 'homebrew', 1, null]
      ],
      [[LAMP, 'homebrew', 0, null]]
    ]);
    expect(plan.rows[0]?.entries[1]?.price_coins).toBe(40);
    expect(plan.copies?.items.map((i) => i.key)).toEqual([LAMP]);
  });

  it('never copies an entry without a snapshot, also when its key is no longer held', () => {
    const p = okOf(parseBundle(oneList([{ id: AXE, source: 'homebrew' }]), knows, () => true));
    const plan = importPlan(p.lists, accountOf([AXE]));
    expect(plan.copies).toBeNull();
    expect(withCopies(plan, p.lists, accountOf())).toBe(plan);
  });

  it('reads a version 3 entry without a snapshot with its GM-only mark', () => {
    const doc = oneList([{ id: AXE, source: 'homebrew', gm_only: true }], 3);
    expect(okOf(parseBundle(doc, knows, () => true)).lists[0]?.entries[0]).toMatchObject({
      item_key: AXE,
      source: 'homebrew',
      snapshot: null,
      gm_only: true
    });
  });

  it('splits 5000 entries without a snapshot by the 300 held keys', () => {
    const B32 = 'abcdefghijklmnopqrstuvwxyz234567';
    const keys = Array.from(
      { length: ENTRIES_MAX },
      (_, n) =>
        'hb_' +
        Array.from({ length: 4 }, (_, d) => B32.charAt((n >> (5 * d)) & 31)).join('') +
        'aaaaaaaaaaaa'
    );
    expect(new Set(keys).size).toBe(ENTRIES_MAX);
    const held = new Set(keys.slice(0, 300));
    const doc = oneList(keys.map((id) => ({ id, source: 'homebrew' })));
    const p = okOf(parseBundle(doc, knows, (k) => held.has(k)));
    expect(p.lists[0]?.entries).toHaveLength(300);
    expect(p.skipped).toHaveLength(4700);
    expect(p.skipped.every((x) => x.why === 'unheld')).toBe(true);
  });

  it('sends no skipped entry: of 101 entries with one unheld, the plan holds 100 at 0-99', () => {
    const ids = [...index.byId.keys()].slice(0, 100);
    const doc = oneList([
      ...ids.slice(0, 50).map((id) => ({ id })),
      { id: LAMP, source: 'homebrew' },
      ...ids.slice(50).map((id) => ({ id }))
    ]);
    const p = okOf(parseBundle(doc, knows, () => false));
    const plan = importPlan(p.lists, accountOf());
    expect(plan.rows[0]?.entries.map((e) => e.position)).toEqual(
      Array.from({ length: 100 }, (_, n) => n)
    );
    expect(p.skipped).toEqual([{ list: 0, entry: 50, id: LAMP, why: 'unheld' }]);
  });

  it('imports a list whose every entry is an unheld skip as an empty list', () => {
    const p = okOf(
      parseBundle(oneList([{ id: LAMP, source: 'homebrew' }]), knows, () => false)
    );
    const plan = importPlan(p.lists, accountOf());
    expect(plan.rows.map((r) => r.entries.length)).toEqual([0]);
    expect(plan.copies).toBeNull();
  });
});

describe('withCopies: the plan again for a press', () => {
  it('copies a key the account no longer holds, every id kept, and keeps a plan nothing changed', () => {
    const p = okOf(parseBundle(fixture('example-v2.json'), knows));
    const plan = importPlan(p.lists, accountOf(['hb_flintlockpistola']));
    expect(withCopies(plan, p.lists, accountOf(['hb_flintlockpistola']))).toBe(plan);
    /* A copy whose key the account holds now is sent as it is: the call skips it. */
    expect(
      withCopies(plan, p.lists, accountOf(['hb_flintlockpistola', 'hb_wanderlampaaaaaa']))
    ).toBe(plan);
    const gone = withCopies(plan, p.lists, { ...accountOf(), newId: () => 'later' });
    expect(gone).not.toBe(plan);
    expect(gone.rows[0]?.entries.map((e) => e.id)).toEqual(
      plan.rows[0]?.entries.map((e) => e.id)
    );
    expect(gone.copies?.items.map((i) => [i.id, i.key])).toEqual([
      ['id4', 'hb_wanderlampaaaaaa'],
      ['later', 'hb_flintlockpistola']
    ]);
  });
});

/* ---------- version 3: the GM-only mark (schema/import-v3.json) ---------- */

const V3 = JSON.parse(read('schema', 'import-v3.json')) as ObjectSchema & {
  title: string;
  description: string;
  $defs: Record<string, ObjectSchema>;
};
const v3Problems = problemsAgainst(V3);

describe('the import-v3 schema and the validator (the drift guard)', () => {
  const entry = V3.$defs['entry'] as ObjectSchema;

  it('names its URL and version 3, and the entry keys the validator reads', () => {
    expect(V3.$id).toBe(BUNDLE_SCHEMA_GM_ONLY);
    expect(prop(V3, 'version').const).toBe(BUNDLE_VERSION_GM_ONLY);
    expect(Object.keys(entry.properties)).toEqual(ENTRY_KEYS_GM_ONLY);
    expect(prop(entry, 'gm_only')).toMatchObject({ type: 'boolean', default: false });
    expect(prop(entry, 'gm_only').description).toBeTruthy();
    const then = (entry as ObjectSchema & { then?: { required?: string[] } }).then;
    expect(then?.required ?? []).not.toContain('snapshot');
    expect(
      v3Problems(
        JSON.parse(
          fixture('keys-only-v2.json')
            .replace('"version": 2', '"version": 3')
            .replace('import-v2', 'import-v3')
        )
      )
    ).toEqual([]);
  });

  it("is import-v2 but for its $id, title, description, version and the entry's gm_only", () => {
    const without = (o: object, keys: readonly string[]): Record<string, unknown> =>
      Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));
    expect({ ...entry, properties: without(entry.properties, ['gm_only']) }).toEqual(
      V2.$defs['entry']
    );
    expect(without(V3.$defs, ['entry'])).toEqual(without(V2.$defs, ['entry']));
    const root = (s: ObjectSchema): Record<string, unknown> => ({
      ...without(s, ['$id', 'title', 'description', '$defs']),
      properties: without(s.properties, ['version'])
    });
    expect(root(V3)).toEqual(root(V2));
    expect(V3.description).toContain('import-v4.json');
  });

  it('takes example-v3.json and export-v3.json by its own walk, and refuses a non-boolean mark', () => {
    expect(v3Problems(JSON.parse(fixture('example-v3.json')))).toEqual([]);
    expect(v3Problems(JSON.parse(fixture('export-v3.json')))).toEqual([]);
    expect(v3Problems(JSON.parse(fixture('errors-v3.json')))).toEqual([
      '.lists[0].entries[0].gm_only type',
      '.lists[0].entries[1].gm_only type'
    ]);
  });
});

describe('a lists file of version 3', () => {
  const v3 = (entry: Record<string, unknown>, version = 3): string =>
    JSON.stringify({
      format: BUNDLE_FORMAT,
      version,
      lists: [{ name: 'L', entries: [{ id: 'ci1', ...entry }] }]
    });

  it('reads version 3 and refuses 4 with its value', () => {
    expect(okOf(parseBundle(fixture('example-v3.json'), knows)).lists).toHaveLength(1);
    expect(parseBundle(fixture('v4.json'), knows)).toEqual({
      ok: false,
      reason: 'version',
      version: 4
    });
  });

  it('reads example-v3.json clean: the GM-only mark on the sabre only', () => {
    const p = okOf(parseBundle(fixture('example-v3.json'), knows));
    expect(p.skipped).toEqual([]);
    expect(p.lists[0]?.entries.map((e) => [e.item_key, e.gm_only ?? null])).toEqual([
      ['ci1', null],
      ['q1', true],
      ['q313', null]
    ]);
  });

  it('reads gm_only true as the mark and false as none', () => {
    const marked = okOf(parseBundle(v3({ gm_only: true }), knows)).lists[0]?.entries[0];
    expect(marked?.gm_only).toBe(true);
    const shown = okOf(parseBundle(v3({ gm_only: false }), knows)).lists[0]?.entries[0];
    expect(shown && 'gm_only' in shown).toBe(false);
  });

  it('reads errors-v3.json as two type errors in file order', () => {
    expect(errorsOf(parseBundle(fixture('errors-v3.json'), knows))).toEqual([
      {
        path: 'lists[0].entries[0].gm_only',
        field: 'gm_only',
        kind: 'type',
        value: 'yes',
        limit: 'boolean'
      },
      {
        path: 'lists[0].entries[1].gm_only',
        field: 'gm_only',
        kind: 'type',
        value: 'null',
        limit: 'boolean'
      }
    ]);
  });

  it.each([1, 2])('refuses gm_only in a version %i file as an unknown field', (version) => {
    expect(errorsOf(parseBundle(v3({ gm_only: true }, version), knows))).toEqual([
      {
        path: 'lists[0].entries[0].gm_only',
        field: 'gm_only',
        kind: 'extra',
        value: undefined,
        limit: undefined
      }
    ]);
  });

  it('reads a homebrew entry with its snapshot and the mark', () => {
    const text = JSON.stringify({
      format: BUNDLE_FORMAT,
      version: 3,
      lists: [
        { name: 'L', entries: [{ id: AXE, source: 'homebrew', gm_only: true, snapshot: SNAP }] }
      ]
    });
    expect(okOf(parseBundle(text, knows)).lists[0]?.entries[0]).toMatchObject({
      item_key: AXE,
      source: 'homebrew',
      snapshot: SNAP,
      gm_only: true
    });
  });

  it('writes version 3 with "gm_only": true after gm_note on the GM-only entry only', () => {
    const { bundle } = toBundle(
      [
        cloud({
          ids: ['ci1', 'q1'],
          meta: { ci1: { qty: 2 }, q1: { hnote: 'h', gmOnly: true } }
        })
      ],
      nameOf,
      'U',
      AT,
      () => null
    );
    expect([bundle.version, bundle.$schema]).toEqual([3, BUNDLE_SCHEMA_GM_ONLY]);
    expect(bundle.lists[0]?.entries).toEqual([
      { id: 'ci1', name: 'Первоклассный Спальный Мешок', quantity: 2 },
      { id: 'q1', name: 'Палаш', gm_note: 'h', gm_only: true }
    ]);
    expect(Object.keys(bundle.lists[0]?.entries[1] ?? {})).toEqual([
      'id',
      'name',
      'gm_note',
      'gm_only'
    ]);
    expect(v3Problems(bundle)).toEqual([]);
    const back = okOf(parseBundle(bundleText(bundle), knows));
    expect(back.lists[0]?.entries.map((e) => e.gm_only ?? null)).toEqual([null, true]);
  });

  it('writes a GM-only homebrew entry as version 3, the mark before its snapshot', () => {
    const { bundle } = toBundle(
      [cloud({ ids: [AXE], meta: { [AXE]: { gmOnly: true } } })],
      nameOf,
      'U',
      AT,
      () => SNAP
    );
    expect(bundle.version).toBe(3);
    expect(Object.keys(bundle.lists[0]?.entries[0] ?? {})).toEqual([
      'id',
      'source',
      'gm_only',
      'snapshot'
    ]);
    expect(v3Problems(bundle)).toEqual([]);
  });

  it('keeps version 1 or 2 when the only GM-only entry is left out, and writes no mark', () => {
    const lists = (ids: string[]): CloudList[] => [
      cloud({ ids, meta: { [AXE]: { gmOnly: true } } })
    ];
    const one = toBundle(lists(['ci1', AXE]), nameOf, 'U', AT, () => null);
    expect([one.bundle.version, one.bundle.$schema, one.skipped]).toEqual([
      1,
      BUNDLE_SCHEMA,
      1
    ]);
    const other = 'hb_otherkeyaaaaaaaa';
    const two = toBundle(lists([other, AXE]), nameOf, 'U', AT, (id) =>
      id === other ? { ...SNAP, id: other } : null
    );
    expect([two.bundle.version, two.bundle.$schema]).toEqual([2, BUNDLE_SCHEMA_HOMEBREW]);
    expect(bundleText(two.bundle)).not.toContain('gm_only');
  });

  it("writes gm_only: true on a GM-only entry's row and no key on a shown one's", () => {
    const p = okOf(parseBundle(fixture('example-v3.json'), knows));
    const { rows, copies } = importPlan(p.lists, accountOf());
    expect(copies).toBeNull();
    expect(rows[0]?.entries.map((e) => ['gm_only' in e, e.gm_only])).toEqual([
      [false, undefined],
      [true, true],
      [false, undefined]
    ]);
  });

  it("keeps the mark on a fixed copy's link, also under a new key; the copy has none", () => {
    const entry = (snapshot: HomebrewRecord): Record<string, unknown> => ({
      id: AXE,
      source: 'homebrew',
      gm_only: true,
      snapshot
    });
    const text = JSON.stringify({
      format: BUNDLE_FORMAT,
      version: 3,
      lists: [
        { name: 'L', entries: [entry(SNAP)] },
        { name: 'M', entries: [entry({ ...SNAP, rud: 'Другой топор.' })] }
      ]
    });
    const p = okOf(parseBundle(text, knows));
    const plan = importPlan(p.lists, accountOf());
    const keys = plan.copies?.items.map((i) => i.key) ?? [];
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(AXE);
    expect(plan.rows.map((r) => [r.entries[0]?.item_key, r.entries[0]?.gm_only])).toEqual([
      [AXE, true],
      [keys[1], true]
    ]);
    for (const i of plan.copies?.items ?? [])
      expect(JSON.stringify(i)).not.toContain('gm_only');
  });

  it('reads export-v3.json clean: one GM-only entry, the axe with its snapshot', () => {
    const p = okOf(parseBundle(fixture('export-v3.json'), knows));
    const all = p.lists.flatMap((l) => l.entries);
    expect(all.filter((e) => e.gm_only).map((e) => e.item_key)).toEqual(['di11']);
    expect(all.filter((e) => e.source === 'homebrew')).toHaveLength(1);
    expect(JSON.parse(fixture('export-v3.json'))).toMatchObject({
      version: 3,
      $schema: BUNDLE_SCHEMA_GM_ONLY
    });
  });

  it("carries example-v3.json in llms.txt's version 3 section, which imports clean", () => {
    const llms = read('llms.txt');
    const head = '### Version 3: GM-only entries (import-v3)';
    expect(llms).toContain(head);
    const section = llms.slice(llms.indexOf(head));
    const block = /\n```json\n([\s\S]*?)\n```\n/.exec(section)?.[1];
    expect(JSON.parse(block ?? 'null')).toEqual(JSON.parse(fixture('example-v3.json')));
    expect(okOf(parseBundle(block ?? '', knows)).skipped).toEqual([]);
  });
});
