/* The lists file: the validator against the published schema (the drift guard), every
   branch of the walk, the fixtures under docs/fixtures/import/ and the example llms.txt
   hands an AI assistant (docs/specs/CONTRACTS.md section 4). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BUNDLE_FORMAT,
  BUNDLE_SCHEMA,
  BUNDLE_VERSION,
  bundleFileName,
  bundleText,
  dataFileName,
  decodeText,
  ENTRIES_MAX,
  ENTRY_KEYS,
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
  toBundle,
  toImportRows,
  type Bundle,
  type BundleList,
  type Parsed
} from './bundle.js';
import { NAME_MAX, NOTE_MAX, PRICE_MAX, type CloudList } from './cloudLists.js';
import { buildIndex, type Loot } from './data.js';
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
          { item_key: 'ci1', quantity: 3, price_coins: 7, player_note: 'ep', gm_note: 'eg' }
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
    expect(parseBundle(fixture('v2.json'), knows)).toEqual({
      ok: false,
      reason: 'version',
      version: 2
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
          { item_key: 'ci1', quantity: 1, price_coins: null, player_note: '', gm_note: '' }
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
          { item_key: 'ci1', quantity: 2, price_coins: 150, player_note: '', gm_note: '' },
          {
            item_key: 'q1',
            quantity: 1,
            price_coins: null,
            player_note: 'Последний в наличии.',
            gm_note: ''
          },
          {
            item_key: 'q313',
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
      AT
    );
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
      AT
    );
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
    const text = bundleText(toBundle(lists, nameOf, 'U', AT));
    expect(text.endsWith('}\n')).toBe(true);
    expect(text).toBe(JSON.stringify(JSON.parse(text), null, 2) + '\n');
    expect(okOf(parseBundle(text, knows)).lists).toEqual([
      {
        name: 'Лавка',
        money_mode: 'coin',
        player_note: '',
        gm_note: 'g',
        entries: [
          { item_key: 'q313', quantity: 1, price_coins: null, player_note: '', gm_note: 'b' },
          { item_key: 'ci1', quantity: 99, price_coins: 99999, player_note: 'a', gm_note: '' }
        ]
      }
    ]);
  });
});

describe('toImportRows', () => {
  it('makes every id with newId and counts positions after the skips', () => {
    let n = 0;
    const p = okOf(parseBundle(fixture('unknown-id.json'), knows));
    const rows = toImportRows(p.lists, () => 'id' + String(n++));
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
        snapshot: null,
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
        snapshot: null,
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
        snapshot: null,
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
