/* The homebrew file: the validator against the published schema (the drift guard), every
   refusal and file rule with its path, the notes, the hand-test files of
   docs/fixtures/homebrew-file/ to their expected results, and the export
   (docs/specs/CONTRACTS.md section 4). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ID_PATTERN } from './bundle.js';
import { buildIndex, type Loot } from './data.js';
import {
  BOOK_NAME_MAX,
  CARD_NAME_MAX,
  CARD_SUB_MAX,
  CARD_TEXT_MAX,
  CARD_URL_MAX,
  CRAFT_MAX,
  DESC_MAX,
  HOMEBREW_KEY,
  NAME_MAX,
  REFS_MAX,
  SECTIONS_MAX,
  type BookRow,
  type CardKind,
  type CardRow,
  type ItemRow
} from './homebrew.js';
import {
  BOOK_KEYS,
  CARD_KEYS,
  defaultTarget,
  EQ_KEYS,
  ERRORS_MAX,
  FILE_BOOKS_MAX,
  FILE_CARDS_MAX,
  FILE_ITEMS_MAX,
  HOMEBREW_FORMAT,
  HOMEBREW_SCHEMA,
  HOMEBREW_VERSION,
  heldOf,
  homebrewFileName,
  homebrewText,
  ITEM_KEYS,
  newName,
  parseHomebrew,
  planOf,
  ROOT_KEYS,
  rowsOf,
  SECTION_KEYS,
  STATS_KEYS,
  subsetOf,
  toHomebrewFile,
  toHomebrewRows,
  withNewlines,
  type EqType,
  type FileContext,
  type HeldRows,
  type HomebrewFile,
  type HomebrewParsed,
  type ImportIds,
  type Target
} from './homebrewFile.js';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const read = (...path: string[]): string => readFileSync(join(ROOT, ...path), 'utf8');
const fixture = (name: string): string => read('docs', 'fixtures', 'homebrew-file', name);

const index = buildIndex(JSON.parse(read('data.json')) as Loot);

/* The catalog of data.json and an account that holds `items` and `cards`. */
function contextOf(
  items: Record<string, EqType | null> = {},
  cards: Record<string, CardKind> = {}
): FileContext {
  return {
    catalogHas: (id) => index.byId.has(id),
    catalogSet: (key) => key in index.sets,
    catalogRef: (key) => key in index.refs,
    ownItem: (key) => key in items,
    ownCard: (key) => cards[key] ?? null,
    lineMembers: (line) => [
      ...[...index.byId.values()].flatMap((r) =>
        r.eq?.line === line ? [{ key: r.id, t: r.eq.t }] : []
      ),
      ...Object.entries(items).flatMap(([key, t]) => (t && key === line ? [{ key, t }] : []))
    ]
  };
}
const CTX = contextOf();

const okOf = (p: HomebrewParsed): Extract<HomebrewParsed, { ok: true }> => {
  if (!p.ok) throw new Error('refused: ' + JSON.stringify(p));
  return p;
};
const errorsOf = (p: HomebrewParsed): { path: string; rule: string }[] => {
  if (p.ok || p.reason !== 'errors') throw new Error('not refused: ' + JSON.stringify(p));
  return p.errors.map((e) => ({ path: e.path, rule: e.rule }));
};
const doc = (o: Record<string, unknown>): string =>
  JSON.stringify({ format: HOMEBREW_FORMAT, version: 1, ...o });
const BASE32 = 'abcdefghijklmnopqrstuvwxyz234567';
/* A key from a number: `hb_` and 16 base32 characters. */
const keyN = (n: number): string => {
  let tail = '';
  let v = n;
  do {
    tail = BASE32.charAt(v % 32) + tail;
    v = Math.floor(v / 32);
  } while (v > 0);
  return 'hb_' + tail.padStart(16, 'a');
};
const KEY = (n: number): string =>
  'hb_test' + 'abcdefghijklmnopqrstuvwxyz'.charAt(n) + 'aaaaaaaaaaa';
const item = (n: number, extra: Record<string, unknown> = {}) => ({
  key: KEY(n),
  kind: 'item',
  ru: 'Предмет ' + String(n),
  ...extra
});

/* ---------- the drift guard ---------- */

interface Node {
  $id?: string;
  $ref?: string;
  const?: unknown;
  enum?: unknown[];
  type?: string;
  pattern?: string;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  minimum?: number;
  maximum?: number;
  required?: string[];
  additionalProperties?: unknown;
  description?: string;
  properties?: Record<string, Node>;
  items?: Node;
  $defs?: Record<string, Node>;
}
const SCHEMA = JSON.parse(read('schema', 'homebrew-v1.json')) as Node;
const V2 = JSON.parse(read('schema', 'import-v2.json')) as Node;
const V3 = JSON.parse(read('schema', 'import-v3.json')) as Node;
const defs = SCHEMA.$defs ?? {};
const def = (name: string, s: Node = SCHEMA): Node => {
  const d = s.$defs?.[name];
  if (!d) throw new Error('no $def ' + name);
  return d;
};
const props = (n: Node): Record<string, Node> => n.properties ?? {};
const p = (n: Node, key: string): Node => {
  const x = props(n)[key];
  if (!x) throw new Error('no property ' + key);
  return x;
};
/* A property's own node, or the $def it refers to. */
const resolved = (n: Node, s: Node = SCHEMA): Node =>
  n.$ref ? { ...def(n.$ref.replace('#/$defs/', ''), s), ...n } : n;

describe('the schema and the validator (the drift guard)', () => {
  it('names the published URL, the format and the version the validator reads', () => {
    expect(SCHEMA.$id).toBe(HOMEBREW_SCHEMA);
    expect(p(SCHEMA, 'format').const).toBe(HOMEBREW_FORMAT);
    expect(p(SCHEMA, 'version').const).toBe(HOMEBREW_VERSION);
  });

  it('names the keys the validator knows, in the order the export writes them', () => {
    expect(Object.keys(props(SCHEMA))).toEqual(ROOT_KEYS);
    expect(Object.keys(props(def('book')))).toEqual(BOOK_KEYS);
    expect(Object.keys(props(def('section')))).toEqual(SECTION_KEYS);
    expect(Object.keys(props(def('card')))).toEqual(CARD_KEYS);
    expect(Object.keys(props(def('item')))).toEqual(ITEM_KEYS);
    expect(Object.keys(props(def('eq')))).toEqual(EQ_KEYS);
    expect(Object.keys(props(def('stats')))).toEqual(STATS_KEYS);
    expect(SCHEMA.required).toEqual(['format', 'version']);
    expect(def('book').required).toEqual(['key']);
    expect(def('section').required).toEqual(['key']);
    expect(def('card').required).toEqual(['key', 'kind']);
    expect(def('item').required).toEqual(['key', 'kind']);
    expect(def('eq').required).toEqual(['t', 'tier']);
    expect(def('stats').required).toEqual(['tr', 'rg', 'dmg', 'dt']);
  });

  it('closes every object and describes every property', () => {
    for (const n of [
      SCHEMA,
      ...['book', 'section', 'card', 'item', 'eq', 'stats'].map((d) => def(d))
    ]) {
      expect(n.additionalProperties).toBe(false);
      for (const x of Object.values(props(n))) expect(resolved(x).description).toBeTruthy();
    }
    for (const d of Object.values(defs)) expect(d.description).toBeTruthy();
  });

  it('holds the bounds the validator applies, the call ceilings of one import', () => {
    expect(p(SCHEMA, 'books').maxItems).toBe(FILE_BOOKS_MAX);
    expect(p(SCHEMA, 'cards').maxItems).toBe(FILE_CARDS_MAX);
    expect(p(SCHEMA, 'items').maxItems).toBe(FILE_ITEMS_MAX);
    expect(FILE_BOOKS_MAX).toBeGreaterThanOrEqual(3 * 20);
    expect(FILE_ITEMS_MAX).toBeGreaterThanOrEqual(3 * 100);
    expect(FILE_CARDS_MAX).toBeGreaterThanOrEqual(3 * 100);
    expect(p(def('book'), 'sections').maxItems).toBe(SECTIONS_MAX);
    for (const d of ['book', 'section']) {
      expect(p(def(d), 'en').maxLength).toBe(BOOK_NAME_MAX);
      expect(p(def(d), 'ru').maxLength).toBe(BOOK_NAME_MAX);
    }
    const card = def('card');
    expect([p(card, 'en').maxLength, p(card, 'ru').maxLength]).toEqual([
      CARD_NAME_MAX,
      CARD_NAME_MAX
    ]);
    expect([p(card, 'ensub').maxLength, p(card, 'rusub').maxLength]).toEqual([
      CARD_SUB_MAX,
      CARD_SUB_MAX
    ]);
    expect([p(card, 'ende').maxLength, p(card, 'rud').maxLength]).toEqual([
      CARD_TEXT_MAX,
      CARD_TEXT_MAX
    ]);
    expect(p(card, 'url')).toMatchObject({
      maxLength: CARD_URL_MAX,
      pattern: '^(https://[\\x21-\\x7e]+)?$'
    });
    const it_ = def('item');
    expect([p(it_, 'en').maxLength, p(it_, 'ru').maxLength]).toEqual([NAME_MAX, NAME_MAX]);
    expect([p(it_, 'ende').maxLength, p(it_, 'rud').maxLength]).toEqual([DESC_MAX, DESC_MAX]);
    for (const k of ['craft', 'craft_from']) {
      expect(p(it_, k)).toMatchObject({ minItems: 1, maxItems: CRAFT_MAX });
    }
    expect(p(it_, 'refs')).toMatchObject({ minItems: 1, maxItems: REFS_MAX });
    expect(p(def('eq'), 'as')).toMatchObject({ minimum: 0, maximum: 12 });
    expect(p(def('eq'), 'th').items).toMatchObject({ minimum: 1, maximum: 99 });
  });

  it('holds the patterns and the enums the validators apply', () => {
    expect(def('key').pattern).toBe(HOMEBREW_KEY.source);
    expect(def('relationId').pattern).toBe(ID_PATTERN.source);
    expect(def('damage').pattern).toBe('^d(4|6|8|10|12|20)(\\+[1-9][0-9]?)?$');
    expect(p(def('item'), 'kind').enum).toEqual(['item', 'consumable', 'equip']);
    expect(p(def('item'), 'tier').enum).toEqual([1, 2, 3, 4, 'A', 'C']);
    expect(p(def('card'), 'kind').enum).toEqual(['set', 'ref']);
    expect(p(def('eq'), 't').enum).toEqual(['weapon', 'secondary', 'armor']);
    expect(p(def('eq'), 'tier').enum).toEqual([1, 2, 3, 4, 'A']);
    expect(p(def('eq'), 'cls').enum).toEqual(['phy', 'mag']);
    expect(p(def('eq'), 'bu').enum).toEqual([1, 2, 'any']);
    expect(def('trait').enum).toEqual([
      'agility',
      'strength',
      'finesse',
      'instinct',
      'presence',
      'knowledge',
      'spellcast'
    ]);
    expect(def('range').enum).toEqual(['melee', 'veryclose', 'close', 'far', 'veryfar']);
    expect(def('damageType').enum).toEqual(['phy', 'mag', 'any']);
  });

  it("holds import-v2's and import-v3's copies of the stat block and the key deep-equal, and its card fields to the same bounds", () => {
    for (const name of [
      'key',
      'relationId',
      'eq',
      'stats',
      'trait',
      'range',
      'damage',
      'damageType'
    ]) {
      expect(def(name, V2)).toEqual(def(name));
      expect(def(name, V3)).toEqual(def(name));
    }
    const card = props(def('card'));
    for (const [snap, keys] of [
      ['snapshotSet', ['en', 'ru', 'ende', 'rud']],
      ['snapshotRef', ['en', 'ru', 'ensub', 'rusub', 'ende', 'rud', 'url']]
    ] as const) {
      const s = def(snap, V2);
      expect(Object.keys(props(s))).toEqual(keys);
      expect(s.required).toEqual(keys);
      expect(s.additionalProperties).toBe(false);
      for (const k of keys) {
        const { maxLength, pattern, type } = card[k] ?? {};
        expect(props(s)[k]).toMatchObject({ maxLength, type, ...(pattern ? { pattern } : {}) });
      }
    }
    const snapshot = props(def('snapshot', V2));
    const item = props(def('item'));
    for (const k of [
      'kind',
      'en',
      'ru',
      'ende',
      'rud',
      'eq',
      'craft',
      'craft_from',
      'set',
      'refs'
    ]) {
      expect(snapshot[k]).toEqual(item[k]);
    }
    expect(snapshot['tier']?.enum).toEqual(item['tier']?.enum);
  });
});

/* ---------- the parse ---------- */

describe('parseHomebrew', () => {
  it('refuses text that is not JSON, not a homebrew file, of another version, or empty', () => {
    expect(parseHomebrew('{', CTX)).toEqual({ ok: false, reason: 'notJson' });
    expect(parseHomebrew('[]', CTX)).toEqual({ ok: false, reason: 'notHomebrew' });
    expect(parseHomebrew('{"format":"daggerheart-loot/lists","version":1}', CTX)).toEqual({
      ok: false,
      reason: 'notHomebrew'
    });
    expect(parseHomebrew(fixture('wrong-version.json'), CTX)).toEqual({
      ok: false,
      reason: 'version',
      version: 2
    });
    expect(parseHomebrew('{"format":"daggerheart-loot/homebrew"}', CTX)).toEqual({
      ok: false,
      reason: 'version',
      version: undefined
    });
    expect(parseHomebrew(doc({}), CTX)).toEqual({ ok: false, reason: 'empty' });
    expect(parseHomebrew(doc({ books: [], cards: [], items: [] }), CTX)).toEqual({
      ok: false,
      reason: 'empty'
    });
  });

  it('refuses the file keys by their type and bounds, and a key it does not name', () => {
    const text = doc({
      $schema: 1,
      exported_at: false,
      books: {},
      items: Array.from({ length: FILE_ITEMS_MAX + 1 }, (_, i) => ({
        key: keyN(i),
        kind: 'item',
        ru: 'П'
      })),
      qty: 1
    });
    expect(errorsOf(parseHomebrew(text, CTX))).toEqual([
      { path: '$schema', rule: 'type' },
      { path: 'exported_at', rule: 'type' },
      { path: 'books', rule: 'type' },
      { path: 'items', rule: 'many' },
      { path: 'qty', rule: 'extra' }
    ]);
  });

  it('names each error by its object and path, a name problem at the object itself', () => {
    const text = doc({
      books: [
        { key: 'hb_bookaaaaaaaaaaaa', ru: 'Книга', sections: [{ key: 'bad', ru: 'Р' }] },
        'x'
      ],
      cards: [
        { key: KEY(1), ru: 'Карта' },
        { key: KEY(2), kind: 'set', ru: 'К', url: '' }
      ],
      items: [
        item(0, { eq: { t: 'weapon' } }),
        item(1, { key: KEY(0) }),
        { key: 'nope', kind: 'item' },
        item(3, { book: 'hb_nosuchbookaaaaaa' }),
        item(4, { section: 'hb_sectaaaaaaaaaaaa' }),
        item(5, { book: 'hb_bookaaaaaaaaaaaa', section: 'hb_sectaaaaaaaaaaaa' })
      ]
    });
    expect(errorsOf(parseHomebrew(text, CTX))).toEqual([
      { path: 'books[0].sections[0].key', rule: 'pattern' },
      { path: 'books[1]', rule: 'type' },
      { path: 'cards[0].kind', rule: 'required' },
      { path: 'cards[1].url', rule: 'extra' },
      { path: 'items[0].eq', rule: 'extra' },
      { path: 'items[1].key', rule: 'duplicate' },
      { path: 'items[2].key', rule: 'pattern' },
      { path: 'items[2]', rule: 'required' },
      { path: 'items[3].book', rule: 'unknown' },
      { path: 'items[4].section', rule: 'unknown' },
      { path: 'items[5].section', rule: 'unknown' }
    ]);
  });

  it('refuses a line whose known members hold another equipment type, and leaves out an own item the file replaces', () => {
    const armour = { t: 'armor', tier: 1, as: 3, th: [6, 13] };
    const weapon = {
      t: 'weapon',
      tier: 2,
      cls: 'phy',
      tr: 'agility',
      rg: 'far',
      dmg: 'd6',
      dt: 'phy',
      bu: 2
    };
    const inFile = doc({
      items: [
        item(0, { kind: 'equip', eq: { ...weapon, line: KEY(0) } }),
        item(1, { kind: 'equip', eq: { ...armour, line: KEY(0) } })
      ]
    });
    expect(errorsOf(parseHomebrew(inFile, CTX))).toEqual([
      { path: 'items[0].eq.line', rule: 'enum' },
      { path: 'items[1].eq.line', rule: 'enum' }
    ]);
    const own = 'hb_ownarmouraaaaaaa';
    const account = contextOf({ [own]: 'armor' });
    const joins = doc({ items: [item(0, { kind: 'equip', eq: { ...weapon, line: own } })] });
    expect(errorsOf(parseHomebrew(joins, account))).toEqual([
      { path: 'items[0].eq.line', rule: 'enum' }
    ]);
    const replaces = doc({
      items: [
        item(0, { key: own, kind: 'equip', eq: { ...weapon, line: own } }),
        item(1, { kind: 'equip', eq: { ...weapon, line: own } })
      ]
    });
    expect(okOf(parseHomebrew(replaces, account)).file.items).toHaveLength(2);
  });

  it('keeps the first ERRORS_MAX errors and counts the rest', () => {
    const items = Array.from({ length: ERRORS_MAX + 7 }, (_, i) => ({
      key: KEY(i % 26) + String(i),
      kind: 'item',
      ru: 'П'
    }));
    const p = parseHomebrew(doc({ items }), CTX);
    if (p.ok || p.reason !== 'errors') throw new Error('not refused');
    expect(p.errors).toHaveLength(ERRORS_MAX);
    expect(p.more).toBe(7);
    expect(p.names.items).toHaveLength(ERRORS_MAX + 7);
  });

  it('turns \\r\\n and \\r into \\n in every string before it validates', () => {
    expect(withNewlines({ a: ['x\r\ny', { b: 'p\rq' }], n: 1 })).toEqual({
      a: ['x\ny', { b: 'p\nq' }],
      n: 1
    });
    const p = okOf(parseHomebrew(fixture('crlf.json'), CTX));
    expect(p.file.items.map((i) => [i.ende, i.rud])).toEqual([
      [
        'First line.\nSecond line.\nThird line.',
        'Первая строка.\nВторая строка.\nТретья строка.'
      ],
      [undefined, 'Пометка на полях.\nЕщё одна пометка.']
    ]);
    expect(fixture('crlf.json')).toContain('\\r\\n');
  });

  it('notes a relation that names nothing, and a held card of another kind, never refusing them', () => {
    const text = doc({
      cards: [{ key: KEY(9), kind: 'set', ru: 'Набор' }],
      items: [
        item(0, {
          craft: ['ci1', 'hb_nowhereaaaaaaaaa', KEY(1)],
          craft_from: ['nosuchid'],
          set: 'hb_nosetaaaaaaaaaaa',
          refs: ['enrapture', 'hb_heldruleaaaaaaa', 'hb_norefaaaaaaaaaa']
        }),
        item(1, { set: KEY(9) }),
        item(2, {
          set: 'saints-ensemble',
          kind: 'equip',
          eq: { t: 'armor', tier: 1, as: 1, th: [1, 2], line: 'zz' }
        })
      ]
    });
    const account = contextOf({}, { hb_heldruleaaaaaaa: 'ref', [KEY(9)]: 'ref' });
    expect(okOf(parseHomebrew(text, account)).notes).toEqual([
      { kind: 'cardKind', index: 0, key: KEY(9) },
      { kind: 'relation', index: 0, field: 'craft', id: 'hb_nowhereaaaaaaaaa' },
      { kind: 'relation', index: 0, field: 'craft_from', id: 'nosuchid' },
      { kind: 'relation', index: 0, field: 'set', id: 'hb_nosetaaaaaaaaaaa' },
      { kind: 'relation', index: 0, field: 'refs', id: 'hb_norefaaaaaaaaaa' },
      { kind: 'relation', index: 2, field: 'eq.line', id: 'zz' }
    ]);
  });
});

/* ---------- the hand-test files (plan section 5 of the task; docs/specs/CONTRACTS.md 4) ---------- */

describe('the hand-test files', () => {
  it('every file is canonical JSON', () => {
    for (const name of [
      'example.json',
      'example-edited.json',
      'no-book.json',
      'bedrolls.json',
      'lines.json',
      'line-mixed.json',
      'crlf.json',
      'errors.json',
      'nbsp-name.json',
      'wrong-version.json',
      'bad-section.json',
      'over-limit.json',
      'same-names.json',
      'export.json'
    ]) {
      const text = fixture(name);
      expect(JSON.stringify(JSON.parse(text), null, 2) + '\n', name).toBe(text);
    }
  });

  it('example.json: one source with two sections, two cards and three items, clean', () => {
    const p = okOf(parseHomebrew(fixture('example.json'), CTX));
    expect(p.notes).toEqual([]);
    const f = p.file;
    expect([
      f.books.length,
      f.books[0]?.sections?.length,
      f.cards.length,
      f.items.length
    ]).toEqual([1, 2, 2, 3]);
    expect(f.books[0]).toMatchObject({ key: 'hb_alderworkshopaaa', ru: 'Мастерская Ольхи' });
    expect(f.cards.map((c) => [c.ru, c.kind])).toEqual([
      ['Тлеющая пара', 'set'],
      ['Перезарядка', 'ref']
    ]);
    expect(
      f.items.map((i) => [i.ru, i.book ?? null, i.section ?? null, i.eq?.line ?? null])
    ).toEqual([
      [
        'Кремнёвый пистоль',
        'hb_alderworkshopaaa',
        'hb_sectpistolsaaaaa',
        'hb_flintlockpistola'
      ],
      [
        'Двуствольный пистоль',
        'hb_alderworkshopaaa',
        'hb_sectpistolsaaaaa',
        'hb_flintlockpistola'
      ],
      ['Лоскутный спальник', null, null, null]
    ]);
    expect(f.items[2]?.craft_from).toEqual(['ci1', 'dv34']);
  });

  it("example-edited.json holds example.json's five keys with new names or texts, and two new items", () => {
    const a = okOf(parseHomebrew(fixture('example.json'), CTX)).file;
    const b = okOf(parseHomebrew(fixture('example-edited.json'), CTX)).file;
    const keys = (f: HomebrewFile) => [...f.cards, ...f.items].map((x) => x.key);
    const held = keys(a);
    expect(held).toHaveLength(5);
    expect(keys(b).filter((k) => held.includes(k))).toEqual(held);
    expect(keys(b).filter((k) => !held.includes(k))).toHaveLength(2);
    for (const k of held) {
      const was = [...a.cards, ...a.items].find((x) => x.key === k);
      const now = [...b.cards, ...b.items].find((x) => x.key === k);
      expect(JSON.stringify(now), k).not.toBe(JSON.stringify(was));
    }
    expect(b.books[0]?.key).toBe(a.books[0]?.key);
  });

  it('no-book.json: three items and a rule card with no source', () => {
    const f = okOf(parseHomebrew(fixture('no-book.json'), CTX)).file;
    expect([f.books.length, f.items.length, f.cards.map((c) => c.kind)]).toEqual([
      0,
      3,
      ['ref']
    ]);
    expect([...f.items, ...f.cards].every((x) => x.book === undefined)).toBe(true);
  });

  it('bedrolls.json: every relation, both languages everywhere, clean', () => {
    const p = okOf(parseHomebrew(fixture('bedrolls.json'), CTX));
    expect(p.notes).toEqual([]);
    const f = p.file;
    expect([f.books.length, f.cards.length, f.items.length]).toEqual([1, 2, 6]);
    for (const x of [...f.books, ...(f.books[0]?.sections ?? []), ...f.cards, ...f.items]) {
      expect(x.en && x.ru, JSON.stringify(x)).toBeTruthy();
    }
    const by = (ru: string) => f.items.find((i) => i.ru === ru);
    const traveller = by('Скатка путника');
    const tracker = by('Скатка следопыта');
    const warden = by('Скатка стража');
    expect(traveller?.craft_from).toEqual(['ci1']);
    expect(traveller?.craft).toEqual([tracker?.key]);
    expect(tracker?.craft).toEqual([warden?.key]);
    const stars = f.cards.find((c) => c.ru === 'Сон под звёздами');
    const rest = f.cards.find((c) => c.ru === 'Привал');
    expect([stars?.kind, rest?.kind]).toEqual(['set', 'ref']);
    expect(f.items.filter((i) => i.set === stars?.key).map((i) => i.ru)).toEqual([
      'Скатка следопыта',
      'Подушка из мха',
      'Походный плед'
    ]);
    expect(traveller?.refs).toEqual([rest?.key]);
    expect(warden?.refs).toEqual([rest?.key]);
    expect(by('Подушка из мха')?.refs).toEqual(['enrapture']);
    expect(index.refs['enrapture']?.ru).toBe('Очарование');
    expect(index.byId.get('ci1')?.ru).toBe('Первоклассный Спальный Мешок');
    expect(index.byId.get('dv34')?.ru).toBe('Одеяло от Призраков');
  });

  it('lines.json: an own line of tiers 1-4 and a rung in the catalog line f37', () => {
    const f = okOf(parseHomebrew(fixture('lines.json'), CTX)).file;
    const bows = f.items.filter((i) => i.eq?.line === 'hb_ashbowoneaaaaaaa');
    expect(bows.map((b) => b.eq?.tier)).toEqual([1, 2, 3, 4]);
    expect(bows[0]?.key).toBe('hb_ashbowoneaaaaaaa');
    const revolver = f.items.find((i) => i.eq?.line === 'f37');
    expect(revolver).toMatchObject({
      ru: 'Револьвер с гравировкой',
      eq: { t: 'weapon', tier: 2 }
    });
    expect(index.byId.get('f37')).toMatchObject({
      ru: 'Револьвер',
      eq: { t: 'weapon', line: 'f37' }
    });
  });

  it('line-mixed.json: armour in a weapon line, refused at its eq.line', () => {
    const p = parseHomebrew(fixture('line-mixed.json'), CTX);
    expect(errorsOf(p)).toEqual([{ path: 'items[1].eq.line', rule: 'enum' }]);
    if (!p.ok && p.reason === 'errors')
      expect(p.names.items[1]).toMatchObject({ ru: 'Кираса-револьвер' });
  });

  it('crlf.json: imports with no carriage return left', () => {
    const f = okOf(parseHomebrew(fixture('crlf.json'), CTX)).file;
    expect(JSON.stringify(f)).not.toContain('\\r');
  });

  it('errors.json: three errors, each at its object and path', () => {
    const p = parseHomebrew(fixture('errors.json'), CTX);
    expect(errorsOf(p)).toEqual([
      { path: 'items[2].eq.dmg', rule: 'pattern' },
      { path: 'items[6]', rule: 'required' },
      { path: 'items[11].refs', rule: 'many' }
    ]);
    if (!p.ok && p.reason === 'errors') {
      expect(p.names.items[2]).toEqual({ ru: 'Мушкет' });
      expect(p.errors[1]).toMatchObject({ array: 'items', index: 6, field: 'name' });
    }
  });

  it('nbsp-name.json: a name of only U+00A0 is no name', () => {
    expect(errorsOf(parseHomebrew(fixture('nbsp-name.json'), CTX))).toEqual([
      { path: 'items[0]', rule: 'required' }
    ]);
  });

  it('wrong-version.json: version 2, refused before the walk', () => {
    expect(parseHomebrew(fixture('wrong-version.json'), CTX)).toMatchObject({
      ok: false,
      reason: 'version',
      version: 2
    });
  });

  it('bad-section.json: a section its source lacks', () => {
    expect(errorsOf(parseHomebrew(fixture('bad-section.json'), CTX))).toEqual([
      { path: 'items[0].section', rule: 'unknown' }
    ]);
  });

  it('over-limit.json: 101 items with no source, clean', () => {
    const f = okOf(parseHomebrew(fixture('over-limit.json'), CTX)).file;
    expect([f.items.length, f.items.every((i) => i.book === undefined)]).toEqual([101, true]);
  });

  it("same-names.json: new keys with example.json's two pistol names, and one new item", () => {
    const a = okOf(parseHomebrew(fixture('example.json'), CTX)).file;
    const f = okOf(parseHomebrew(fixture('same-names.json'), CTX)).file;
    const names = a.items.map((i) => i.ru);
    expect(f.items.filter((i) => names.includes(i.ru)).map((i) => i.ru)).toEqual([
      'Кремнёвый пистоль',
      'Двуствольный пистоль'
    ]);
    expect(f.items.some((i) => a.items.some((x) => x.key === i.key))).toBe(false);
    expect(f.items).toHaveLength(3);
  });
});

/* ---------- the export ---------- */

const row = <T>(o: T, created: string) => ({
  ...o,
  revision: 1,
  created_at: created,
  updated_at: created
});

describe('toHomebrewFile and homebrewText', () => {
  it('writes the rows by creation, each key in schema order, book as the source key, empty arrays kept', () => {
    const books: BookRow[] = [
      row(
        {
          id: 'b1',
          key: 'hb_bookbbbbbbbbbbbb',
          content: { sections: [{ ru: 'Р', key: 'hb_sectaaaaaaaaaaaa' }], ru: 'К' }
        },
        '2026-09-02'
      )
    ];
    const items: ItemRow[] = [
      row(
        {
          id: 'i2',
          key: KEY(2),
          book_id: null,
          content: { ru: 'Второй', kind: 'item' as const }
        },
        '2026-09-03'
      ),
      row(
        {
          id: 'i1',
          key: KEY(1),
          book_id: 'b1',
          content: {
            refs: ['slow'],
            eq: {
              line: 'q1',
              alt: {
                dt: 'phy' as const,
                dmg: 'd6',
                rg: 'far' as const,
                tr: 'agility' as const
              },
              t: 'weapon' as const,
              tier: 1 as const,
              cls: 'phy' as const,
              tr: 'agility' as const,
              rg: 'melee' as const,
              dmg: 'd8',
              dt: 'phy' as const,
              bu: 1 as const
            },
            section: 'hb_sectaaaaaaaaaaaa',
            kind: 'equip' as const,
            ru: 'Первый'
          }
        },
        '2026-09-01'
      )
    ];
    const f = toHomebrewFile(books, items, [], new Date('2026-09-25T12:00:00.000Z'));
    expect(Object.keys(f)).toEqual(ROOT_KEYS);
    expect(f.cards).toEqual([]);
    expect(f.items.map((i) => i.key)).toEqual([KEY(1), KEY(2)]);
    expect(Object.keys(f.items[0] ?? {})).toEqual([
      'key',
      'book',
      'section',
      'kind',
      'ru',
      'eq',
      'refs'
    ]);
    expect(Object.keys(f.items[0]?.eq ?? {})).toEqual([
      't',
      'tier',
      'cls',
      'tr',
      'rg',
      'dmg',
      'dt',
      'bu',
      'alt',
      'line'
    ]);
    expect(Object.keys(f.items[0]?.eq?.alt ?? {})).toEqual(['tr', 'rg', 'dmg', 'dt']);
    expect(Object.keys(f.books[0] ?? {})).toEqual(['key', 'ru', 'sections']);
    expect(Object.keys(f.books[0]?.sections?.[0] ?? {})).toEqual(['key', 'ru']);
    expect(f.items[0]?.book).toBe('hb_bookbbbbbbbbbbbb');
    expect(f.items[1]?.book).toBeUndefined();
    const text = homebrewText(f);
    expect(text).toBe(JSON.stringify(f, null, 2) + '\n');
    expect(okOf(parseHomebrew(text, CTX)).file.items).toHaveLength(2);
  });

  it('writes a card with its kind and source key, and reads export.json back clean', () => {
    const cards: CardRow[] = [
      row(
        {
          id: 'c1',
          key: KEY(5),
          kind: 'ref' as const,
          book_id: 'gone',
          content: { url: '', en: 'R' }
        },
        '2026-09-01'
      )
    ];
    const f = toHomebrewFile([], [], cards, new Date(0));
    expect(f.cards).toEqual([{ key: KEY(5), kind: 'ref', en: 'R', url: '' }]);
    expect(okOf(parseHomebrew(fixture('export.json'), CTX)).notes).toEqual([]);
  });
});

/* The blind round (docs/specs/COVERAGE.md): a fresh agent that read only llms.txt,
   catalog.csv and the two export.json files wrote this file for request R-A - a source
   with two sections, two blades in their own line, an armour, a flask made from the
   Premium Bedroll, a set card joining the flask and the armour, a rule card named by the
   first blade. */
describe('from-llms.json, the blind round', () => {
  const p = okOf(parseHomebrew(fixture('from-llms.json'), CTX));
  const f = p.file;
  const by = (ru: string) => f.items.find((i) => i.ru === ru);

  it('parses clean, with no note', () => {
    expect(p.notes).toEqual([]);
  });

  it('does what the GM asked', () => {
    expect(f.books).toHaveLength(1);
    const book = f.books[0];
    expect(book).toMatchObject({ en: 'North Wind Forge', ru: 'Кузница Северного Ветра' });
    expect(book?.sections?.map((s) => s.ru)).toEqual(['Клинки', 'Доспехи']);
    const [blades, armour] = book?.sections ?? [];
    const ice = by('Ледяной клинок');
    const tempered = by('Закалённый ледяной клинок');
    expect(ice?.eq).toMatchObject({
      t: 'weapon',
      tier: 1,
      cls: 'phy',
      tr: 'finesse',
      rg: 'melee',
      dmg: 'd8+1',
      dt: 'phy',
      bu: 1,
      line: ice?.key
    });
    expect(tempered?.eq).toMatchObject({ t: 'weapon', tier: 2, dmg: 'd10+2', line: ice?.key });
    expect([ice?.section, tempered?.section]).toEqual([blades?.key, blades?.key]);
    const fur = by('Меховой доспех');
    expect(fur?.eq).toMatchObject({ t: 'armor', tier: 1, as: 3, th: [5, 11] });
    expect(fur?.section).toBe(armour?.key);
    const flask = by('Тёплая фляга');
    expect(flask).toMatchObject({ kind: 'item', tier: 1 });
    expect(flask?.craft_from).toContain('ci1');
    const set = f.cards.find((c) => c.kind === 'set');
    const rule = f.cards.find((c) => c.kind === 'ref');
    expect(set).toMatchObject({ ru: 'Северный набор', rud: '+1 к Уклонению в снегу' });
    expect(
      f.items
        .filter((i) => i.set === set?.key)
        .map((i) => i.ru)
        .sort()
    ).toEqual(['Меховой доспех', 'Тёплая фляга']);
    expect(rule?.ru).toBe('Обморожение');
    expect(rule?.rusub ?? rule?.ensub).toBeTruthy();
    expect(rule?.rud ?? rule?.ende).toBeTruthy();
    expect(ice?.refs).toEqual([rule?.key]);
  });
});

/* ---------- the import plan, the call's rows and the downloads ---------- */

const ALDER = 'hb_alderworkshopaaa';
const PISTOLS = 'hb_sectpistolsaaaaa';
const BLADES = 'hb_sectbladesaaaaaa';
const fileOf = (name: string): HomebrewFile => okOf(parseHomebrew(fixture(name), CTX)).file;
/* An account as the import reads it: its sources, items and cards. */
const account = (
  books: BookRow[] = [],
  items: ItemRow[] = [],
  cards: CardRow[] = []
): HeldRows => ({ books, items, cards });
const book = (
  id: string,
  key: string,
  content: BookRow['content'],
  created = '2026-09-01'
): BookRow => row({ id, key, content }, created);
const heldItem = (key: string, content: ItemRow['content'], bookId: string | null = null) =>
  row({ id: 'i-' + key, key, book_id: bookId, content }, '2026-09-03');
/* Ids and keys as the panel keeps them: one per slot, the first call's. */
function idsOf(): ImportIds & { made: string[] } {
  const held = new Map<string, string>();
  const made: string[] = [];
  let n = 0;
  return {
    made,
    id: (slot) => {
      let v = held.get('id:' + slot);
      if (v === undefined) {
        v = 'id-' + slot;
        held.set('id:' + slot, v);
      }
      return v;
    },
    key: (slot, first) => {
      let v = held.get('key:' + slot);
      if (v === undefined) {
        v = first ?? KEY(20 + n++);
        if (first === undefined) made.push(v);
        held.set('key:' + slot, v);
      }
      return v;
    }
  };
}

describe('the import plan', () => {
  it('draws one row per source of the file, then one for the items and cards with none', () => {
    const rows = rowsOf(fileOf('example.json'));
    expect(rows.map((r) => [r.book?.key ?? null, r.items, r.cards])).toEqual([
      [ALDER, 2, 2],
      [null, 1, 0]
    ]);
    expect(rowsOf(fileOf('no-book.json')).map((r) => [r.book, r.items, r.cards])).toEqual([
      [null, 3, 1]
    ]);
  });

  it('defaults to the held key, then a held source of the same name, then a new source', () => {
    const rows = rowsOf(fileOf('example.json'));
    expect(rows.map((r) => defaultTarget(r, account()))).toEqual([
      { kind: 'new' },
      { kind: 'home' }
    ]);
    const byKey = account([book('b1', ALDER, { ru: 'Другое имя' })]);
    expect(defaultTarget(rows[0]!, byKey)).toEqual({ kind: 'held', id: 'b1' });
    /* Another key, the same name in the other case: the oldest source of the name. */
    const byName = account([
      book('b2', KEY(2), { en: 'alder workshop' }, '2026-09-05'),
      book('b1', KEY(1), { ru: 'МАСТЕРСКАЯ ОЛЬХИ' }, '2026-09-01')
    ]);
    expect(defaultTarget(rows[0]!, byName)).toEqual({ kind: 'held', id: 'b1' });
  });

  it("names the row's own new source with « 2», « 3» while a held or the default source has the name", () => {
    const alder = fileOf('example.json').books[0]!;
    expect(newName(alder, account())).toEqual({ en: 'Alder Workshop', ru: 'Мастерская Ольхи' });
    expect(newName(alder, account([book('b1', KEY(1), { ru: 'Мастерская Ольхи' })]))).toEqual({
      en: 'Alder Workshop 2',
      ru: 'Мастерская Ольхи 2'
    });
    const both = account([
      book('b1', KEY(1), { ru: 'Мастерская Ольхи' }),
      book('b2', KEY(2), { en: 'Alder Workshop 2' })
    ]);
    expect(newName(alder, both)).toEqual({ en: 'Alder Workshop 3', ru: 'Мастерская Ольхи 3' });
    expect(newName({ key: KEY(1), ru: 'Хоумбрю' }, account())).toEqual({ ru: 'Хоумбрю 2' });
  });

  it('notes what the press does for each row', () => {
    const rows = rowsOf(fileOf('example.json'));
    const one = book('b1', ALDER, {
      ru: 'Мастерская Ольхи',
      sections: [{ key: PISTOLS, ru: 'Пистоли' }]
    });
    const other = book('b2', KEY(2), { ru: 'Мастерская Ольхи' });
    expect(planOf(rows, [{ kind: 'new' }, { kind: 'home' }], account())).toEqual([
      { notes: [{ kind: 'new', sections: 2 }], full: null },
      { notes: [], full: null }
    ]);
    expect(
      planOf(rows, [{ kind: 'held', id: 'b1' }, { kind: 'home' }], account([one]))[0]
    ).toEqual({ notes: [{ kind: 'key' }, { kind: 'add', sections: 1 }], full: null });
    expect(
      planOf(rows, [{ kind: 'held', id: 'b2' }, { kind: 'home' }], account([other]))[0]
    ).toEqual({ notes: [{ kind: 'name' }, { kind: 'add', sections: 2 }], full: null });
    expect(planOf(rows, [{ kind: 'home' }, { kind: 'home' }], account())[0]).toEqual({
      notes: [{ kind: 'home' }],
      full: null
    });
    expect(
      planOf(
        rows,
        [{ kind: 'custom', name: 'Новое', lang: 'ru' }, { kind: 'home' }],
        account()
      )[0]
    ).toEqual({ notes: [{ kind: 'new', sections: 2 }], full: null });
  });

  it('joins a section by name and refuses a merge past 30 sections', () => {
    const rows = rowsOf(fileOf('example.json'));
    const sameName = book('b1', KEY(1), {
      ru: 'Источник',
      sections: [{ key: KEY(5), ru: 'пистоли' }]
    });
    expect(
      planOf(rows, [{ kind: 'held', id: 'b1' }, { kind: 'home' }], account([sameName]))[0]
    ).toEqual({ notes: [{ kind: 'add', sections: 1 }], full: null });
    const sections = Array.from({ length: SECTIONS_MAX - 1 }, (_, i) => ({
      key: KEY(i),
      ru: 'Раздел ' + String(i)
    }));
    const crowded = book('b1', KEY(1), { ru: 'Полный', sections });
    expect(
      planOf(rows, [{ kind: 'held', id: 'b1' }, { kind: 'home' }], account([crowded]))[0]?.full
    ).toEqual(crowded.content);
  });

  it('writes a first import: the new source with its sections, then the cards and items in it', () => {
    const file = fileOf('example.json');
    const rows = rowsOf(file);
    const r = toHomebrewRows(
      file,
      rows,
      [{ kind: 'new' }, { kind: 'home' }],
      account(),
      false,
      idsOf()
    );
    expect(r.update).toBe(false);
    expect(r.books).toEqual([
      {
        id: 'id-book:' + ALDER,
        key: ALDER,
        content: {
          en: 'Alder Workshop',
          ru: 'Мастерская Ольхи',
          sections: [
            { key: PISTOLS, en: 'Pistols', ru: 'Пистоли' },
            { key: BLADES, en: 'Blades', ru: 'Холодное оружие' }
          ]
        },
        names: true
      }
    ]);
    expect(r.cards.map((c) => [c.id, c.key, c.kind, c.book, 'key' in c.content])).toEqual([
      ['id-card:hb_emberpairsetaaaa', 'hb_emberpairsetaaaa', 'set', ALDER, false],
      ['id-card:hb_reloadruleaaaaaa', 'hb_reloadruleaaaaaa', 'ref', ALDER, false]
    ]);
    expect(r.items.map((i) => [i.key, i.book, i.content.section ?? null])).toEqual([
      ['hb_flintlockpistola', ALDER, PISTOLS],
      ['hb_doublepistolaaaa', ALDER, PISTOLS],
      ['hb_patchbedrollaaaa', null, null]
    ]);
    expect(r.items[0]?.content).not.toHaveProperty('key');
    expect(r.items[0]?.content).not.toHaveProperty('book');
  });

  it('writes a held source with the sections it lacks, and its names only for its own key', () => {
    const file = fileOf('example.json');
    const rows = rowsOf(file);
    const held = book('b1', KEY(1), {
      en: 'Mine',
      ru: 'Мой',
      sections: [{ key: KEY(5), ru: 'ПИСТОЛИ' }]
    });
    const r = toHomebrewRows(
      file,
      rows,
      [{ kind: 'held', id: 'b1' }, { kind: 'home' }],
      account([held]),
      true,
      idsOf()
    );
    expect(r.books).toEqual([
      {
        id: 'b1',
        key: KEY(1),
        content: {
          en: 'Mine',
          ru: 'Мой',
          sections: [{ key: BLADES, en: 'Blades', ru: 'Холодное оружие' }]
        },
        names: false
      }
    ]);
    expect(r.items.slice(0, 2).map((i) => [i.book, i.content.section])).toEqual([
      [KEY(1), KEY(5)],
      [KEY(1), KEY(5)]
    ]);
    const own = book('b1', ALDER, { ru: 'Старое имя', sections: [] });
    const update = toHomebrewRows(
      file,
      rows,
      [{ kind: 'held', id: 'b1' }, { kind: 'home' }],
      account([own]),
      true,
      idsOf()
    );
    expect(update.books[0]).toMatchObject({
      key: ALDER,
      content: { en: 'Alder Workshop', ru: 'Мастерская Ольхи' },
      names: true
    });
  });

  it('puts the items with no source into the default source, a source the file makes, or a new one', () => {
    const file = fileOf('example.json');
    const rows = rowsOf(file);
    const into = toHomebrewRows(
      file,
      rows,
      [{ kind: 'new' }, { kind: 'file', book: ALDER }],
      account(),
      false,
      idsOf()
    );
    expect(into.items[2]).toMatchObject({ key: 'hb_patchbedrollaaaa', book: ALDER });
    const ids = idsOf();
    const custom = toHomebrewRows(
      file,
      rows,
      [{ kind: 'home' }, { kind: 'custom', name: '  Находки ', lang: 'ru' }],
      account(),
      false,
      ids
    );
    expect(custom.books).toEqual([
      {
        id: 'id-book:' + String(ids.made[0]),
        key: ids.made[0],
        content: { ru: 'Находки' },
        names: true
      }
    ]);
    expect(custom.items.map((i) => [i.book, i.content.section ?? null])).toEqual([
      [null, null],
      [null, null],
      [ids.made[0], null]
    ]);
    /* A file source no longer made: the items with none fall back to the default source. */
    const dropped = toHomebrewRows(
      file,
      rows,
      [{ kind: 'home' }, { kind: 'file', book: ALDER }],
      account(),
      false,
      idsOf()
    );
    expect(dropped.items[2]?.book).toBeNull();
  });

  it('keeps the new source key and its names on a retry after the call landed', () => {
    const file = fileOf('example.json');
    const rows = rowsOf(file);
    const ids = idsOf();
    const targets: Target[] = [{ kind: 'new' }, { kind: 'home' }];
    const first = toHomebrewRows(file, rows, targets, account(), false, ids);
    const landed = account([book('b9', ALDER, { ru: 'Мастерская Ольхи' })]);
    const again = toHomebrewRows(file, rows, targets, landed, true, ids);
    expect(again.books[0]?.key).toBe(first.books[0]?.key);
    expect(again.books[0]?.id).toBe(first.books[0]?.id);
    expect(again.books[0]?.names).toBe(false);
    expect(again.items.map((i) => i.id)).toEqual(first.items.map((i) => i.id));
    /* A key the account held at the first press: the new source takes a fresh key. */
    const heldKey = account([book('b1', ALDER, { ru: 'Чужое' })]);
    const fresh = toHomebrewRows(file, rows, targets, heldKey, false, idsOf());
    expect(fresh.books[0]?.key).not.toBe(ALDER);
    expect(fresh.books[0]?.content).toMatchObject({ ru: 'Мастерская Ольхи' });
  });

  it('counts the held keys and the new keys with a held name, never matching by name', () => {
    const pistol = heldItem('hb_flintlockpistola', { kind: 'item', ru: 'Кремнёвый пистоль' });
    const other = heldItem('hb_doublepistolaaaa', { kind: 'item', en: 'двуствольный пистоль' });
    const held = account(
      [book('b1', ALDER, { ru: 'М' })],
      [pistol, other],
      [
        row(
          {
            id: 'c1',
            key: 'hb_reloadruleaaaaaa',
            kind: 'ref' as const,
            book_id: null,
            content: { ru: 'П' }
          },
          '2026-09-01'
        )
      ]
    );
    const ex = fileOf('example.json');
    const same = fileOf('same-names.json');
    const pair = (v: { en?: string; ru?: string }) => ({ en: v.en, ru: v.ru });
    expect(heldOf(ex, held)).toEqual({
      items: 2,
      cards: 1,
      books: 1,
      sameNames: 0,
      names: {
        items: ex.items.slice(0, 2).map(pair),
        cards: [pair(ex.cards[1]!)],
        books: [pair(ex.books[0]!)],
        sameNamed: []
      }
    });
    expect(heldOf(same, held)).toEqual({
      items: 0,
      cards: 0,
      books: 0,
      sameNames: 2,
      names: { items: [], cards: [], books: [], sameNamed: same.items.slice(0, 2).map(pair) }
    });
    expect(heldOf(ex, account()).names).toEqual({
      items: [],
      cards: [],
      books: [],
      sameNamed: []
    });
  });

  it('leaves a held card of the other kind out of the card names', () => {
    const held = account(
      [],
      [],
      [
        row(
          {
            id: 'c1',
            key: 'hb_reloadruleaaaaaa',
            kind: 'set' as const,
            book_id: null,
            content: { ru: 'П' }
          },
          '2026-09-01'
        )
      ]
    );
    const r = heldOf(fileOf('example.json'), held);
    expect(r.cards).toBe(1);
    expect(r.names.cards).toEqual([]);
  });
});

describe('the downloads', () => {
  const books = [
    book('b1', ALDER, { ru: 'Мастерская Ольхи', sections: [{ key: BLADES, ru: 'Клинки' }] })
  ];
  const items = [
    heldItem(
      'hb_aaaaaaaaaaaaaaaa',
      { kind: 'item', ru: 'А', set: 'hb_setaaaaaaaaaaaaa' },
      'b1'
    ),
    heldItem('hb_bbbbbbbbbbbbbbbb', { kind: 'item', ru: 'Б', refs: ['hb_refbbbbbbbbbbbbb'] }),
    heldItem('hb_cccccccccccccccc', { kind: 'item', ru: 'В' }, 'gone')
  ];
  const card = (key: string, kind: CardKind, bookId: string | null): CardRow =>
    row({ id: 'c-' + key, key, kind, book_id: bookId, content: { ru: key } }, '2026-09-02');
  const cards = [
    card('hb_setaaaaaaaaaaaaa', 'set', null),
    card('hb_refbbbbbbbbbbbbb', 'ref', 'b1'),
    card('hb_ownaaaaaaaaaaaaa', 'ref', 'b1'),
    card('hb_homeaaaaaaaaaaaa', 'ref', null)
  ];
  const held = account(books, items, cards);
  const keys = (rows: readonly { key: string }[]): string[] => rows.map((r) => r.key);

  it('writes a source with its items and the cards that belong to it or that its items name', () => {
    const s = subsetOf(held, { book: 'b1' });
    expect(keys(s.books)).toEqual([ALDER]);
    expect(keys(s.items)).toEqual(['hb_aaaaaaaaaaaaaaaa']);
    expect(keys(s.cards)).toEqual([
      'hb_setaaaaaaaaaaaaa',
      'hb_refbbbbbbbbbbbbb',
      'hb_ownaaaaaaaaaaaaa'
    ]);
  });

  it('writes the default source with the items of a gone source, and the cards in none', () => {
    const s = subsetOf(held, { book: null });
    expect(s.books).toEqual([]);
    expect(keys(s.items)).toEqual(['hb_bbbbbbbbbbbbbbbb', 'hb_cccccccccccccccc']);
    expect(keys(s.cards)).toEqual([
      'hb_setaaaaaaaaaaaaa',
      'hb_refbbbbbbbbbbbbb',
      'hb_homeaaaaaaaaaaaa'
    ]);
  });

  it('writes the ticked items with their sources and the cards they name', () => {
    const s = subsetOf(held, { items: ['hb_aaaaaaaaaaaaaaaa', 'hb_bbbbbbbbbbbbbbbb'] });
    expect(keys(s.books)).toEqual([ALDER]);
    expect(keys(s.items)).toEqual(['hb_aaaaaaaaaaaaaaaa', 'hb_bbbbbbbbbbbbbbbb']);
    expect(keys(s.cards)).toEqual(['hb_setaaaaaaaaaaaaa', 'hb_refbbbbbbbbbbbbb']);
    const f = toHomebrewFile(s.books, s.items, s.cards, new Date(0));
    expect(okOf(parseHomebrew(homebrewText(f), CTX)).file.items).toHaveLength(2);
  });

  it('leaves out a section its source no longer holds, so the file imports', () => {
    const stale = heldItem(
      'hb_dddddddddddddddd',
      { kind: 'item', ru: 'Г', section: PISTOLS },
      'b1'
    );
    const kept = heldItem(
      'hb_eeeeeeeeeeeeeeee',
      { kind: 'item', ru: 'Д', section: BLADES },
      'b1'
    );
    const f = toHomebrewFile(books, [stale, kept], [], new Date(0));
    expect(f.items.map((i) => i.section ?? null)).toEqual([null, BLADES]);
    expect(okOf(parseHomebrew(homebrewText(f), CTX)).file.items).toHaveLength(2);
  });

  it('names a source file by the source, unsafe characters replaced, and ticked items by the day', () => {
    const at = new Date(2026, 9, 2, 12);
    expect(homebrewFileName('Мастерская Ольхи', at)).toBe('Мастерская Ольхи.json');
    expect(homebrewFileName('Да/нет: «?»', at)).toBe('Да_нет_ «_».json');
    expect(homebrewFileName('   ', at)).toBe('homebrew.json');
    expect(homebrewFileName(null, at)).toBe('daggerheart-loot-homebrew-2026-10-02.json');
  });
});
