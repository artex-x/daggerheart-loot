/* lib/homebrew.ts against the fixtures the SQL validators share
 * (docs/fixtures/homebrew/, tests/db/homebrew.test.mjs): every case gives exactly its
 * problems, and recordOf writes every snapshot case as homebrew_snapshot_of does. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  bookProblems,
  browseIndex,
  canonJson,
  cardProblems,
  cardMembers,
  cardUses,
  contentOfRecord,
  contentProblems,
  counterFrom,
  editLang,
  groupsOf,
  hbFilterFix,
  pickSource,
  sectionKeysOf,
  sourceGroups,
  sourceKeyOf,
  sourcesOf,
  hasName,
  HOMEBREW_KEY,
  isHomebrewKey,
  isHomebrewRecord,
  itemUses,
  keyFrom,
  nameTaken,
  recordOf,
  SNAPSHOT_BYTES,
  snapshotValid,
  withRecords,
  type BookRef,
  type BookRow,
  type CardRef,
  type HomebrewContent,
  type HomebrewRecord,
  type ItemRow,
  type Problem,
  copyRows
} from './homebrew.js';
import { buildIndex, madeFrom, setOf, upgradesTo } from './data.js';
import type { Record_ } from './types.js';

const DIR = join(import.meta.dirname, '..', '..', '..', 'docs', 'fixtures', 'homebrew');
const read = (name: string): unknown => JSON.parse(readFileSync(join(DIR, name), 'utf8'));

interface Cases {
  valid: { name: string; content: unknown }[];
  invalid: { name: string; content: unknown; problems: Problem[] }[];
}
interface Snapshots {
  valid: {
    name: string;
    key: string;
    content: HomebrewContent;
    book: BookRef | null;
    cards?: CardRef[];
    snapshot: unknown;
  }[];
  invalid: { name: string; snapshot: unknown }[];
}

interface CardCases {
  valid: { name: string; kind: unknown; content: unknown }[];
  invalid: { name: string; kind: unknown; content: unknown; problems: Problem[] }[];
}

const items = read('items.json') as Cases;
const cards = read('cards.json') as CardCases;
const books = read('books.json') as Cases;
const snapshots = read('snapshots.json') as Snapshots;

describe('hasName', () => {
  /* The class homebrew_names_ok holds: JavaScript's whitespace plus U+0085 and U+180E. */
  const SPACES = [
    0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x20, 0x85, 0xa0, 0x1680, 0x180e, 0x2000, 0x2005, 0x200a,
    0x2028, 0x2029, 0x202f, 0x205f, 0x3000, 0xfeff
  ];

  it.each(SPACES.map((c) => [c.toString(16), String.fromCharCode(c)] as const))(
    'takes U+%s for a space',
    (_hex, ch) => {
      expect(hasName(ch + ch)).toBe(false);
    }
  );

  it.each(
    [0x200b, 0x2060, 0x41, 0x416].map((c) => [c.toString(16), String.fromCharCode(c)] as const)
  )('takes U+%s for a name', (_hex, ch) => {
    expect(hasName(' ' + ch)).toBe(true);
  });

  it('decides the language the editor writes in with the same class', () => {
    expect(
      editLang({ kind: 'item', en: String.fromCharCode(0x180e), ru: 'Кольцо' }, 'en')
    ).toBe('ru');
  });
});

describe('contentProblems over docs/fixtures/homebrew/items.json', () => {
  it.each(items.valid.map((c) => [c.name, c.content] as const))('accepts %s', (_n, content) => {
    expect(contentProblems(content)).toEqual([]);
  });
  it.each(items.invalid.map((c) => [c.name, c.content, c.problems] as const))(
    'refuses %s with exactly its problems',
    (_n, content, problems) => {
      expect(contentProblems(content)).toEqual(problems);
    }
  );
  it('refuses a name or a text holding U+0000, which jsonb refuses at input', () => {
    expect(contentProblems({ kind: 'item', ru: 'a\u0000' })).toEqual([
      { path: 'ru', rule: 'pattern' }
    ]);
    expect(contentProblems({ kind: 'item', ru: 'a', ende: '\u0000' })).toEqual([
      { path: 'ende', rule: 'pattern' }
    ]);
  });
  it('reads a kind that is not a string as the wrong type', () => {
    expect(contentProblems({ kind: 3, ru: 'a' })).toEqual([{ path: 'kind', rule: 'type' }]);
  });
  it('refuses an item that names its own key in craft or craft_from, and only with the key', () => {
    const key = 'hb_buckleaaaaaaaaaa';
    const content = { kind: 'item', ru: 'Пряжка', craft: [key], craft_from: ['q1', key] };
    expect(contentProblems(content, key)).toEqual([
      { path: 'craft.0', rule: 'self' },
      { path: 'craft_from.1', rule: 'self' }
    ]);
    expect(contentProblems(content)).toEqual([]);
    expect(contentProblems({ kind: 'item', ru: 'Пряжка', refs: [key] }, key)).toEqual([]);
  });
  it('takes an upgrade line that is the item own key', () => {
    const key = 'hb_aldermailaaaaaaa';
    const eq = { t: 'armor', tier: 1, as: 3, th: [6, 12], line: key };
    expect(contentProblems({ kind: 'equip', en: 'Mail', eq }, key)).toEqual([]);
    expect(contentProblems({ kind: 'equip', en: 'Mail', eq: { ...eq, line: 'a b' } })).toEqual([
      { path: 'eq.line', rule: 'pattern' }
    ]);
  });
});

describe('cardProblems over docs/fixtures/homebrew/cards.json', () => {
  it.each(cards.valid.map((c) => [c.name, c.kind, c.content] as const))(
    'accepts %s',
    (_n, kind, content) => {
      expect(cardProblems(kind, content)).toEqual([]);
    }
  );
  it.each(cards.invalid.map((c) => [c.name, c.kind, c.content, c.problems] as const))(
    'refuses %s with exactly its problems',
    (_n, kind, content, problems) => {
      expect(cardProblems(kind, content)).toEqual(problems);
    }
  );
  it('refuses a link holding a control by its pattern of controls, once', () => {
    expect(cardProblems('ref', { en: 'Brand', url: 'https://a\u0007' })).toEqual([
      { path: 'url', rule: 'pattern' }
    ]);
  });
});

describe('bookProblems over docs/fixtures/homebrew/books.json', () => {
  it.each(books.valid.map((c) => [c.name, c.content] as const))('accepts %s', (_n, content) => {
    expect(bookProblems(content)).toEqual([]);
  });
  it.each(books.invalid.map((c) => [c.name, c.content, c.problems] as const))(
    'refuses %s with exactly its problems',
    (_n, content, problems) => {
      expect(bookProblems(content)).toEqual(problems);
    }
  );
  it('refuses a source that is not an object and sections that are not a list', () => {
    expect(bookProblems('Alder')).toEqual([{ path: '', rule: 'type' }]);
    expect(bookProblems({ ru: 'a', sections: {} })).toEqual([
      { path: 'sections', rule: 'type' }
    ]);
    expect(bookProblems({ ru: 'a', sections: [1] })).toEqual([
      { path: 'sections.0', rule: 'type' }
    ]);
  });
});

describe('recordOf and snapshotValid over docs/fixtures/homebrew/snapshots.json', () => {
  it.each(snapshots.valid.map((c) => [c.name, c] as const))(
    'writes %s as its snapshot, which is valid',
    (_n, c) => {
      const record = recordOf(c.key, c.content, c.book, c.cards ?? []);
      expect(record).toEqual(c.snapshot);
      expect(snapshotValid(record)).toBe(true);
    }
  );
  it.each(snapshots.invalid.map((c) => [c.name, c.snapshot] as const))(
    'refuses %s',
    (_n, snapshot) => {
      expect(snapshotValid(snapshot)).toBe(false);
    }
  );
  it('keeps the maximal snapshot under the bytes a list entry takes', () => {
    const max = snapshots.valid.find((c) => c.key === 'hb_maximalitemaaaaa');
    expect(max).toBeDefined();
    const bytes = new TextEncoder().encode(JSON.stringify(max?.snapshot)).length;
    expect(bytes).toBeGreaterThan(25_000);
    expect(bytes).toBeLessThan(SNAPSHOT_BYTES);
  });
  it('keeps the maximal snapshot with three rule cards and a set card under the bound', () => {
    const max = snapshots.valid.find((c) => c.key === 'hb_maximalcardsaaaa');
    expect(max).toBeDefined();
    const bytes = new TextEncoder().encode(JSON.stringify(max?.snapshot)).length;
    expect(bytes).toBeGreaterThan(75_000);
    expect(bytes).toBeLessThan(SNAPSHOT_BYTES);
    expect(SNAPSHOT_BYTES).toBe(131072);
  });
  it('writes no cards key when the item names no given card', () => {
    const r = recordOf(
      'hb_aaaaaaaaaaaaaaaa',
      { kind: 'item', ru: 'Камень', set: 'ember-spark' },
      null,
      [{ key: 'hb_aldersetaaaaaaaa', kind: 'set', ru: 'Комплект' }]
    );
    expect('cards' in r).toBe(false);
  });
  it('refuses cards that are not an object and a group that is not one', () => {
    const c = snapshots.valid.find((x) => x.key === 'hb_relateditemaaaaa')?.snapshot as Record<
      string,
      unknown
    >;
    expect(snapshotValid(c)).toBe(true);
    expect(snapshotValid({ ...c, cards: [] })).toBe(false);
    expect(snapshotValid({ ...c, cards: { sets: [] } })).toBe(false);
  });
  it('fills a missing language and an empty one from the other', () => {
    const r = recordOf('hb_aaaaaaaaaaaaaaaa', { kind: 'item', en: '', ru: 'Камень' }, null);
    expect([r.en, r.ru, r.ende, r.rud]).toEqual(['Камень', 'Камень', '', '']);
    const book = recordOf(
      'hb_aaaaaaaaaaaaaaaa',
      { kind: 'item', en: 'Stone' },
      {
        key: 'hb_bbbbbbbbbbbbbbbb',
        en: '',
        ru: 'Мастерская'
      }
    ).book;
    expect(book).toEqual({ key: 'hb_bbbbbbbbbbbbbbbb', en: 'Мастерская', ru: 'Мастерская' });
  });
  it('refuses a value that is not an object, a source with a bad key or a bad section', () => {
    expect(snapshotValid(null)).toBe(false);
    const axe = snapshots.valid.find((c) => c.key === 'hb_emberaxeaaaaaaaa')
      ?.snapshot as Record<string, unknown>;
    expect(snapshotValid({ ...axe, book: { key: 'x', en: 'A', ru: 'A' } })).toBe(false);
    expect(
      snapshotValid({ ...axe, book: { key: 'hb_bbbbbbbbbbbbbbbb', en: 'A', section: 1 } })
    ).toBe(false);
  });
  it('writes the row id as hid when given, which a valid record may carry beside it', () => {
    const HID = '00000000-0000-4000-8000-000000000511';
    const axe = snapshots.valid.find((c) => c.key === 'hb_emberaxeaaaaaaaa');
    if (!axe) throw new Error('no axe');
    const r = recordOf(axe.key, axe.content, axe.book, axe.cards ?? [], HID);
    expect(r).toEqual({ ...(axe.snapshot as HomebrewRecord), hid: HID });
    expect(snapshotValid(r)).toBe(true);
    expect(snapshotValid({ ...r, hid: 5 })).toBe(false);
  });
});

describe('contentOfRecord', () => {
  it.each(snapshots.valid.map((c) => [c.name, c] as const))(
    'gives %s back the content that makes the same record in the default source',
    (_n, c) => {
      const content = contentOfRecord({ ...(c.snapshot as HomebrewRecord), hid: 'x' });
      expect(contentProblems(content, c.key)).toEqual([]);
      const rest: Record<string, unknown> = { ...(c.snapshot as HomebrewRecord) };
      delete rest['book'];
      expect(recordOf(c.key, content, null, c.cards ?? [])).toEqual(rest);
    }
  );
});

describe('keys', () => {
  it('makes a fixed key from fixed bytes, of the key shape', () => {
    const bytes = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    const key = keyFrom(bytes);
    expect(key).toBe('hb_aaaqeayeaudaocaj');
    expect(key).toMatch(HOMEBREW_KEY);
    expect(isHomebrewKey(key)).toBe(true);
    expect(keyFrom(new Uint8Array(10).fill(255))).toBe('hb_7777777777777777');
  });
  it('throws for fewer than 10 bytes', () => {
    expect(() => keyFrom(new Uint8Array(9))).toThrow(/10 random bytes/);
  });
  it('refuses a key of another shape', () => {
    expect(isHomebrewKey('hb_x1')).toBe(false);
    expect(isHomebrewKey('ci1')).toBe(false);
  });
});

describe('canonJson', () => {
  it('writes equal objects with keys in another order as one text, arrays in order', () => {
    expect(canonJson({ b: 1, a: { d: [2, 1], c: null } })).toBe(
      canonJson({ a: { c: null, d: [2, 1] }, b: 1 })
    );
    expect(canonJson({ a: [1, 2] })).not.toBe(canonJson({ a: [2, 1] }));
  });
});

const ALDER: BookRow = {
  id: 'b1',
  key: 'hb_alderworkshopaaa',
  content: {
    ru: 'Мастерская Ольхи',
    en: 'Alder Workshop',
    sections: [
      { key: 'hb_sectpistolsaaaaa', ru: 'Пистоли', en: 'Pistols' },
      { key: 'hb_sectbladesaaaaaa', ru: 'Холодное оружие', en: 'Blades' }
    ]
  },
  revision: 1,
  created_at: '2026-09-20T10:00:00Z',
  updated_at: '2026-09-20T10:00:00Z'
};
const LATER: BookRow = {
  id: 'b2',
  key: 'hb_laterbookaaaaaaa',
  content: { en: 'Later Book' },
  revision: 1,
  created_at: '2026-09-25T10:00:00Z',
  updated_at: '2026-09-25T10:00:00Z'
};
const refOf = (b: BookRow): BookRef => ({ ...b.content, key: b.key });

describe('isHomebrewRecord', () => {
  it('answers true for a homebrew record and false for a catalog one', () => {
    expect(
      isHomebrewRecord(recordOf('hb_aaaaaaaaaaaaaaaa', { kind: 'item', ru: 'А' }, null))
    ).toBe(true);
    expect(
      isHomebrewRecord({
        id: 'ci1',
        src: 'core',
        kind: 'item',
        en: '',
        ru: '',
        ende: '',
        rud: ''
      })
    ).toBe(false);
  });
});

describe('withRecords', () => {
  const base = buildIndex({
    items: {
      core_item: [{ id: 'ci1', src: 'core', kind: 'item', en: 'A', ru: 'А', ende: '', rud: '' }]
    }
  });
  const own = recordOf('hb_owneditemaaaaaa', { kind: 'item', ru: 'Своё' }, null);
  const frozenOwn = recordOf('hb_owneditemaaaaaa', { kind: 'item', ru: 'Старое' }, null);
  const frozen = recordOf('hb_frozenitemaaaaa', { kind: 'item', ru: 'Чужое' }, null);

  it('answers the base itself when there is nothing to add', () => {
    expect(withRecords(base, [], [])).toBe(base);
  });

  it('adds own records and frozen copies to byId and keeps the rest of the base', () => {
    const ix = withRecords(base, [own], [frozen]);
    expect(ix).not.toBe(base);
    expect(ix.byId.get('ci1')).toBe(base.byId.get('ci1'));
    expect(ix.byId.get(own.id)).toBe(own);
    expect(ix.byId.get(frozen.id)).toBe(frozen);
    expect(ix.all).toBe(base.all);
    expect(base.byId.has(own.id)).toBe(false);
  });

  it('never lets a frozen copy replace an own record, in either order of arrival', () => {
    expect(withRecords(base, [own], [frozenOwn]).byId.get(own.id)).toBe(own);
    const first = withRecords(base, [own], []);
    expect(withRecords(first, [], [frozenOwn]).byId.get(own.id)).toBe(own);
  });

  it('never lets a frozen copy replace a catalog record', () => {
    const fake = { ...frozen, id: 'ci1' };
    expect(withRecords(base, [], [fake]).byId.get('ci1')).toBe(base.byId.get('ci1'));
  });

  const axe = recordOf(
    'hb_ownaxeaaaaaaaaaa',
    {
      kind: 'equip',
      ru: 'Топор',
      eq: {
        t: 'weapon',
        tier: 2,
        cls: 'phy',
        tr: 'strength',
        rg: 'melee',
        dmg: 'd8',
        dt: 'phy',
        bu: 1
      }
    },
    null
  );

  it('puts own records after the catalog in search, own equipment after it, and makes the homebrew rows', () => {
    const ix = withRecords(base, [own, axe], []);
    expect(ix.searchable).toEqual([...base.searchable, own, axe]);
    expect(ix.allEquip).toEqual([...base.allEquip, axe]);
    expect(ix.rows.get('homebrew')).toEqual([own, axe]);
    expect(ix.rows.get('core_item')).toBe(base.rows.get('core_item'));
    expect(base.rows.has('homebrew')).toBe(false);
    expect(ix.all).toBe(base.all);
  });

  it('changes only byId with frozen copies alone', () => {
    const ix = withRecords(base, [], [frozen]);
    expect(ix.searchable).toBe(base.searchable);
    expect(ix.allEquip).toBe(base.allEquip);
    expect(ix.rows).toBe(base.rows);
    expect(ix.craftedFrom).toBe(base.craftedFrom);
  });
});

describe('the relations of withRecords', () => {
  const rec = (id: string, extra: Partial<Record_> = {}): Record_ => ({
    id,
    src: 'core',
    kind: 'item',
    en: id,
    ru: id,
    ende: '',
    rud: '',
    ...extra
  });
  const base = buildIndex({
    items: {
      t: [
        rec('ci1', { craft: ['ci2'] }),
        rec('ci2'),
        rec('s1', { set: 'saints-ensemble' }),
        rec('s2', { set: 'saints-ensemble' }),
        rec('x1', { craft: ['ci3'] }),
        rec('ci3')
      ]
    },
    refs: {
      slow: { en: 'Slow', ru: 'Медленно', ensub: '', rusub: '', ende: '', rud: '', url: '' }
    },
    sets: { 'saints-ensemble': { en: 'Saints', ru: 'Святые', ende: '', rud: '' } }
  });
  const SET = 'hb_aldersetaaaaaaaa';
  const RULE = 'hb_alderrulecardaaa';
  const owned: CardRef[] = [
    { key: SET, kind: 'set', ru: 'Комплект Ольхи', rud: 'Бонус.' },
    { key: RULE, kind: 'ref', en: 'Alder Brand', ende: 'Reroll.' },
    { key: 'slow', kind: 'ref', en: 'Not the catalog one' }
  ];
  const up = recordOf(
    'hb_upaaaaaaaaaaaaaa',
    { kind: 'item', ru: 'Выше', craft_from: ['ci2'] },
    null
  );
  const also = recordOf(
    'hb_alsoaaaaaaaaaaaa',
    { kind: 'item', ru: 'Тоже', craft_from: ['ci2', 'ci2'], craft: ['ci1'] },
    null
  );
  const member = recordOf(
    'hb_memberaaaaaaaaaa',
    { kind: 'item', ru: 'Член', set: 'saints-ensemble', refs: [RULE, 'slow'] },
    null,
    owned
  );

  it("makes an own record's craft_from an upgrade of the catalog record", () => {
    const ix = withRecords(base, [up], []);
    const ci2 = ix.byId.get('ci2') as Record_;
    expect(upgradesTo(ix, ci2).map((r) => r.id)).toEqual([up.id]);
    expect(madeFrom(ix, up).map((r) => r.id)).toEqual(['ci2']);
    expect(base.craftedInto.size).toBe(0);
  });

  it('puts the catalog records first and names each record once', () => {
    const ix = withRecords(base, [up, also], []);
    const ci2 = ix.byId.get('ci2') as Record_;
    const ci1 = ix.byId.get('ci1') as Record_;
    expect(upgradesTo(ix, ci2).map((r) => r.id)).toEqual([up.id, also.id]);
    expect(madeFrom(ix, ci2).map((r) => r.id)).toEqual(['ci1']);
    expect(madeFrom(ix, ci1).map((r) => r.id)).toEqual([also.id]);
    expect(madeFrom(ix, also).map((r) => r.id)).toEqual(['ci2']);
    const both = recordOf(
      'hb_bothaaaaaaaaaaaa',
      { kind: 'item', ru: 'Оба', craft: ['hb_upaaaaaaaaaaaaaa', 'ci3'] },
      null
    );
    const ix2 = withRecords(base, [up, both], []);
    expect(upgradesTo(ix2, both).map((r) => r.id)).toEqual(['ci3', up.id]);
    expect(madeFrom(ix2, ix2.byId.get('ci3') as Record_).map((r) => r.id)).toEqual([
      'x1',
      both.id
    ]);
  });

  it('joins no relation for a frozen copy', () => {
    const ix = withRecords(base, [], [up]);
    expect(upgradesTo(ix, ix.byId.get('ci2') as Record_)).toEqual([]);
    expect(ix.craftedInto).toBe(base.craftedInto);
    const mixed = withRecords(base, [also], [up]);
    expect(upgradesTo(mixed, mixed.byId.get('ci2') as Record_).map((r) => r.id)).toEqual([
      also.id
    ]);
  });

  it("joins an own record to its catalog set after the catalog's members", () => {
    const ix = withRecords(base, [member], []);
    expect(setOf(ix, member).map((r) => r.id)).toEqual(['s1', 's2', member.id]);
    expect(base.setMembers.get('saints-ensemble')).toHaveLength(2);
  });

  it('holds the cards the own records embed, a frozen card only for a new key, never over the catalog', () => {
    const ownSet = recordOf(
      'hb_ownsetaaaaaaaaaa',
      { kind: 'item', ru: 'Своё', set: SET },
      null,
      owned
    );
    const frozenSet = recordOf(
      'hb_frozensetaaaaaaa',
      { kind: 'item', ru: 'Чужое', set: SET },
      null,
      [{ key: SET, kind: 'set', ru: 'Чужой комплект' }]
    );
    const frozenRule = recordOf(
      'hb_frozenruleaaaaaa',
      { kind: 'item', ru: 'Чужое', refs: ['hb_otherrulecardaaa'] },
      null,
      [{ key: 'hb_otherrulecardaaa', kind: 'ref', en: 'Other' }]
    );
    const ix = withRecords(base, [member, ownSet], [frozenSet, frozenRule]);
    expect(ix.refs['slow']).toBe(base.refs['slow']);
    expect(ix.refs[RULE]?.en).toBe('Alder Brand');
    expect(ix.sets[SET]?.ru).toBe('Комплект Ольхи');
    expect(ix.sets['saints-ensemble']).toBe(base.sets['saints-ensemble']);
    expect(ix.refs['hb_otherrulecardaaa']?.en).toBe('Other');
    expect(Object.keys(base.refs)).toEqual(['slow']);
    const frozenOnly = withRecords(base, [], [frozenSet]);
    expect(frozenOnly.sets[SET]?.ru).toBe('Чужой комплект');
  });
});

describe('browseIndex', () => {
  const base = buildIndex({
    items: {
      core_item: [{ id: 'ci1', src: 'core', kind: 'item', en: 'A', ru: 'А', ende: '', rud: '' }]
    }
  });
  const own = recordOf('hb_owneditemaaaaaa', { kind: 'item', ru: 'Своё' }, null);
  const index = withRecords(base, [own], []);

  it('answers the index itself while the switch is on, or when it holds no own item', () => {
    expect(browseIndex(index, base, true)).toBe(index);
    expect(browseIndex(base, base, false)).toBe(base);
  });

  it('takes search and equipment from the catalog with the switch off, and keeps byId and rows', () => {
    const hidden = browseIndex(index, base, false);
    expect(hidden.searchable).toBe(base.searchable);
    expect(hidden.allEquip).toBe(base.allEquip);
    expect(hidden.byId.get(own.id)).toBe(own);
    expect(hidden.rows.get('homebrew')).toEqual([own]);
  });
});

describe('editLang', () => {
  it('answers the UI language for a new item and for one named in both languages', () => {
    expect(editLang(null, 'ru')).toBe('ru');
    expect(editLang(null, 'en')).toBe('en');
    expect(editLang({ kind: 'item', ru: 'А', en: 'A' }, 'en')).toBe('en');
    expect(editLang({ kind: 'item', ru: 'А', en: 'A' }, 'ru')).toBe('ru');
  });

  it('answers the one language that names the item', () => {
    expect(editLang({ kind: 'item', en: 'Cap' }, 'ru')).toBe('en');
    expect(editLang({ kind: 'item', ru: 'Кольцо', en: '  ' }, 'en')).toBe('ru');
    expect(editLang({ ru: 'Клеймо', rud: 'Текст.' }, 'en')).toBe('ru');
    expect(editLang({ en: 'Brand', ru: 'Клеймо' }, 'en')).toBe('en');
  });
});

describe('nameTaken', () => {
  const names = [{ ru: 'Мастерская Ольхи', en: 'Alder Workshop' }, { en: 'Homebrew' }];

  it('finds a name in either language, trimmed and without case', () => {
    expect(nameTaken(names, '  мастерская ольхи ')).toBe(true);
    expect(nameTaken(names, 'ALDER WORKSHOP')).toBe(true);
    expect(nameTaken(names, 'homebrew')).toBe(true);
  });

  it('answers false for a new name and for an empty one', () => {
    expect(nameTaken(names, 'Кузня')).toBe(false);
    expect(nameTaken(names, '   ')).toBe(false);
  });
});

describe('groupsOf', () => {
  const alder = refOf(ALDER);
  const axe = recordOf(
    'hb_emberaxeaaaaaaaa',
    { kind: 'item', ru: 'Топор', en: 'Axe', section: 'hb_sectbladesaaaaaa' },
    alder
  );
  const gun = recordOf(
    'hb_gunaaaaaaaaaaaaa',
    { kind: 'item', ru: 'Пистоль', en: 'Gun', section: 'hb_sectpistolsaaaaa' },
    alder
  );
  const loose = recordOf('hb_looseaaaaaaaaaaa', { kind: 'item', ru: 'Молот' }, alder);
  const stray = recordOf(
    'hb_strayaaaaaaaaaaa',
    { kind: 'item', ru: 'Клещи', section: 'hb_sectgoneaaaaaaa' },
    alder
  );
  const ring = recordOf('hb_ringaaaaaaaaaaaa', { kind: 'item', ru: 'Кольцо' }, null);
  const cap = recordOf('hb_capaaaaaaaaaaaaa', { kind: 'item', en: 'Cap' }, null);
  const late = recordOf('hb_lateaaaaaaaaaaaa', { kind: 'item', en: 'Late' }, refOf(LATER));

  it('orders sources by creation, sections in order, the section-less items, then the default', () => {
    const groups = groupsOf(
      [LATER, ALDER],
      [ring, late, loose, axe, cap, gun, stray],
      'ru',
      'Хоумбрю'
    );
    expect(groups.map((g) => [g.id, g.label, g.items.map((i) => i.id)])).toEqual([
      ['hb_sectpistolsaaaaa', 'Мастерская Ольхи · Пистоли', [gun.id]],
      ['hb_sectbladesaaaaaa', 'Мастерская Ольхи · Холодное оружие', [axe.id]],
      ['hb_alderworkshopaaa', 'Мастерская Ольхи', [stray.id, loose.id]],
      ['hb_laterbookaaaaaaa', 'Later Book', [late.id]],
      ['hb', 'Хоумбрю', [ring.id, cap.id]]
    ]);
  });

  it('names the groups in English and leaves an empty group out', () => {
    const groups = groupsOf([ALDER], [axe], 'en', 'Homebrew');
    expect(groups.map((g) => g.label)).toEqual(['Alder Workshop · Blades']);
  });

  it('puts an item whose source is not held under the default source', () => {
    expect(groupsOf([], [late], 'ru', 'Хоумбрю').map((g) => g.id)).toEqual(['hb']);
  });
});

describe('the source chips of #/tables/homebrew', () => {
  const alder = refOf(ALDER);
  const axe = recordOf(
    'hb_emberaxeaaaaaaaa',
    { kind: 'item', ru: 'Топор', section: 'hb_sectbladesaaaaaa' },
    alder
  );
  const loose = recordOf('hb_looseaaaaaaaaaaa', { kind: 'item', ru: 'Молот' }, alder);
  const ring = recordOf('hb_ringaaaaaaaaaaaa', { kind: 'item', ru: 'Кольцо' }, null);
  const late = recordOf('hb_lateaaaaaaaaaaaa', { kind: 'item', en: 'Late' }, refOf(LATER));
  const all = [ring, late, loose, axe];
  const t = { srcHomebrew: 'Хоумбрю', hbNoSection: 'Без раздела' };
  const chips = sourcesOf([LATER, ALDER], all, 'ru', 'Хоумбрю');

  it('lists the sources that hold an item by creation, «Хоумбрю» last', () => {
    expect(chips).toEqual([
      { key: 'hb_alderworkshopaaa', label: 'Мастерская Ольхи' },
      { key: 'hb_laterbookaaaaaaa', label: 'Later Book' },
      { key: 'hb', label: 'Хоумбрю' }
    ]);
  });

  it('leaves an empty source out and counts an item of an unknown source as «Хоумбрю»', () => {
    expect(sourcesOf([LATER, ALDER], [axe], 'ru', 'Хоумбрю').map((s) => s.key)).toEqual([
      'hb_alderworkshopaaa'
    ]);
    expect(sourcesOf([ALDER], [late], 'ru', 'Хоумбрю').map((s) => s.key)).toEqual(['hb']);
    expect(sourceKeyOf(late, new Set([ALDER.key]))).toBe('hb');
    expect(sourceKeyOf(axe, new Set([ALDER.key]))).toBe(ALDER.key);
  });

  it('picks no chip with fewer than two sources', () => {
    expect(pickSource(chips.slice(0, 1), { src: ['hb'] }, '', all, [ALDER])).toBeNull();
    expect(pickSource([], {}, '', [], [])).toBeNull();
  });

  it('picks the first held src value, then the anchor, then the first sect, then the first chip', () => {
    const pick = (filter: Record<string, string[]>, anchor = ''): string | null =>
      pickSource(chips, filter, anchor, all, [LATER, ALDER]);
    expect(pick({ src: ['hb_nosuchsourceaaa', 'hb', 'hb_laterbookaaaaaaa'] })).toBe('hb');
    expect(pick({}, 'hb')).toBe('hb');
    expect(pick({}, 'hb_laterbookaaaaaaa')).toBe('hb_laterbookaaaaaaa');
    expect(pick({}, 'hb_sectbladesaaaaaa')).toBe('hb_alderworkshopaaa');
    expect(pick({}, ring.id)).toBe('hb');
    expect(pick({}, 'hb_nosuchanchoraaa')).toBe('hb_alderworkshopaaa');
    expect(pick({ sect: ['hb_sectbladesaaaaaa'] })).toBe('hb_alderworkshopaaa');
    expect(pick({ src: ['hb_nosuchsourceaaa'] })).toBe('hb_alderworkshopaaa');
    expect(pick({})).toBe('hb_alderworkshopaaa');
  });

  it('skips an anchor or a sect whose source holds no item', () => {
    const two = sourcesOf([LATER, ALDER], [ring, axe], 'ru', 'Хоумбрю');
    expect(pickSource(two, {}, 'hb_laterbookaaaaaaa', [ring, axe], [LATER, ALDER])).toBe(
      'hb_alderworkshopaaa'
    );
  });

  it('writes a disagreeing filter and leaves an agreeing one', () => {
    const blades = ['hb_sectpistolsaaaaa', 'hb_sectbladesaaaaaa'];
    expect(hbFilterFix({}, 'hb', [])).toBeNull();
    expect(hbFilterFix({ kind: ['item'] }, 'hb', [])).toBeNull();
    expect(hbFilterFix({ src: ['hb'] }, 'hb', [])).toBeNull();
    expect(
      hbFilterFix({ src: [ALDER.key], sect: ['hb_sectbladesaaaaaa'] }, ALDER.key, blades)
    ).toBeNull();
    expect(hbFilterFix({ sect: ['hb_sectbladesaaaaaa'] }, ALDER.key, blades)).toBeNull();
    expect(hbFilterFix({ src: ['hb', ALDER.key] }, 'hb', [])).toEqual({ src: ['hb'] });
    expect(hbFilterFix({ kind: ['item'], src: ['hb_x'] }, 'hb', [])).toEqual({
      kind: ['item'],
      src: ['hb']
    });
    expect(
      hbFilterFix(
        { src: [ALDER.key], sect: ['hb_sectbladesaaaaaa', 'hb_sectgoneaaaaaaa'] },
        ALDER.key,
        blades
      )
    ).toEqual({ src: [ALDER.key], sect: ['hb_sectbladesaaaaaa'] });
    expect(hbFilterFix({ sect: ['hb_sectbladesaaaaaa'] }, 'hb', [])).toEqual({ src: ['hb'] });
  });

  it('gives the section keys of a source, and none of «Хоумбрю»', () => {
    expect(sectionKeysOf([ALDER], ALDER.key)).toEqual([
      'hb_sectpistolsaaaaa',
      'hb_sectbladesaaaaaa'
    ]);
    expect(sectionKeysOf([ALDER], 'hb')).toEqual([]);
  });

  it('heads a chip by its sections in order, then «Без раздела», and «Хоумбрю» by its name', () => {
    expect(
      sourceGroups([LATER, ALDER], all, ALDER.key, 'ru', t).map((g) => [
        g.id,
        g.label,
        g.items.map((i) => i.id)
      ])
    ).toEqual([
      ['hb_sectbladesaaaaaa', 'Холодное оружие', [axe.id]],
      ['hb_alderworkshopaaa', 'Без раздела', [loose.id]]
    ]);
    expect(sourceGroups([LATER, ALDER], all, 'hb', 'ru', t)).toEqual([
      { id: 'hb', label: 'Хоумбрю', items: [ring] }
    ]);
  });

  it('draws 300 items of one chip under its 30 sections and «Без раздела»', () => {
    const sections = Array.from({ length: 30 }, (_, n) => ({
      key:
        'hb_sect' +
        String(n)
          .padStart(2, '0')
          .replace(/\d/g, (d) => 'abcdefghij'.charAt(Number(d))) +
        'aaaaaaaaaa',
      ru: 'Раздел ' + String(n)
    }));
    const big: BookRow = { ...ALDER, content: { ru: 'Большой', sections } };
    const items = Array.from({ length: 300 }, (_, n) =>
      recordOf(
        'hb_big' +
          String(n)
            .padStart(3, '0')
            .replace(/\d/g, (d) => 'abcdefghij'.charAt(Number(d))) +
          'aaaaaaaaaa',
        {
          kind: 'item',
          ru: 'Вещь ' + String(n),
          ...(n % 31 === 30 ? {} : { section: sections[n % 31]?.key ?? '' })
        },
        { ...big.content, key: big.key }
      )
    );
    const groups = sourceGroups([big], items, big.key, 'ru', t);
    expect(groups).toHaveLength(31);
    expect(groups.at(-1)?.label).toBe('Без раздела');
    expect(groups.reduce((n, g) => n + g.items.length, 0)).toBe(300);
  });
});

const used = (key: string, content: ItemRow['content']): ItemRow => ({
  id: 'id-' + key,
  key,
  book_id: null,
  content,
  revision: 1,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:00:00Z'
});

describe('itemUses and cardUses', () => {
  const RING = 'hb_engravedringaaaa';
  const items = [
    used(RING, {
      kind: 'item',
      ru: 'Кольцо',
      craft: [RING, 'ci1'],
      set: 'hb_setaaaaaaaaaaaaa'
    }),
    used('hb_aaaaaaaaaaaaaaaa', { kind: 'item', ru: 'А', craft: [RING] }),
    used('hb_bbbbbbbbbbbbbbbb', { kind: 'item', ru: 'Б', craft_from: [RING], refs: ['slow'] }),
    used('hb_cccccccccccccccc', {
      kind: 'equip',
      ru: 'В',
      eq: { t: 'armor', tier: 1, as: 1, th: [1, 2], line: RING },
      refs: ['slow', 'hb_cardaaaaaaaaaaaa']
    }),
    used('hb_dddddddddddddddd', { kind: 'item', ru: 'Г', set: 'hb_setaaaaaaaaaaaaa' })
  ];

  it('counts the other items that name an item in a craft link or a line', () => {
    expect(itemUses(items, RING)).toBe(3);
    expect(itemUses(items, 'ci1')).toBe(1);
    expect(itemUses(items, 'hb_zzzzzzzzzzzzzzzz')).toBe(0);
  });

  it('counts the items that name a set card or a rule card', () => {
    expect(cardUses(items, 'set', 'hb_setaaaaaaaaaaaaa')).toBe(2);
    expect(cardUses(items, 'ref', 'slow')).toBe(2);
    expect(cardUses(items, 'ref', 'hb_cardaaaaaaaaaaaa')).toBe(1);
    expect(cardUses(items, 'set', 'slow')).toBe(0);
  });

  it('lists the members of a set card and of a rule card in order', () => {
    expect(cardMembers(items, 'set', 'hb_setaaaaaaaaaaaaa').map((i) => i.key)).toEqual([
      RING,
      'hb_dddddddddddddddd'
    ]);
    expect(cardMembers(items, 'ref', 'slow').map((i) => i.key)).toEqual([
      'hb_bbbbbbbbbbbbbbbb',
      'hb_cccccccccccccccc'
    ]);
    expect(cardMembers(items, 'ref', 'hb_setaaaaaaaaaaaaa')).toEqual([]);
  });
});

describe('counterFrom', () => {
  it('startsTheCounterPastFiveSixthsOfTheCap', () => {
    expect([counterFrom(3000), counterFrom(1500), counterFrom(7)]).toEqual([2500, 1250, 5]);
  });
});

describe('copyRows', () => {
  const ids = (): (() => string) => {
    let n = 0;
    return () => 'id' + String(++n);
  };
  const SET = 'hb_starsleepsetaaaa';
  const REFS = ['hb_refoneaaaaaaaaaa', 'hb_reftwoaaaaaaaaaa', 'hb_refthreeaaaaaaaa'];
  const ref = (en: string) => ({
    en,
    ru: en,
    ensub: '',
    rusub: '',
    ende: 'T',
    rud: 'Т',
    url: ''
  });
  const record = recordOf(
    'hb_rangerrollaaaaaa',
    {
      kind: 'equip',
      ru: 'Скатка',
      craft: ['hb_sentryrollaaaaaa', 'ci1'],
      craft_from: ['hb_travelrollaaaaaa'],
      set: SET,
      refs: REFS,
      eq: { t: 'armor', tier: 2, as: 3, th: [5, 9], line: 'hb_otherlineaaaaaaa' }
    },
    { key: 'hb_authorbookaaaaaa', ru: 'Книга' },
    [
      { key: SET, kind: 'set', ru: 'Сон', rud: 'Бонус' },
      ...REFS.map((key, i) => ({ key, kind: 'ref' as const, ...ref('R' + String(i)) }))
    ],
    '00000000-0000-4000-8000-000000000662'
  );

  it('keeps the key, drops the source and the author keys, keeps catalog ids, and copies every embedded card', () => {
    const rows = copyRows(record, { newId: ids(), hasCard: () => false });
    expect(rows.books).toEqual([]);
    expect(rows.update).toBe(false);
    expect(rows.items).toEqual([
      {
        id: 'id5',
        key: 'hb_rangerrollaaaaaa',
        book: null,
        content: {
          kind: 'equip',
          ru: 'Скатка',
          en: 'Скатка',
          ende: '',
          rud: '',
          craft: ['ci1'],
          set: SET,
          refs: REFS,
          eq: { t: 'armor', tier: 2, as: 3, th: [5, 9] }
        }
      }
    ]);
    expect(rows.cards.map((c) => [c.id, c.key, c.kind, c.book])).toEqual([
      ['id1', SET, 'set', null],
      ['id2', REFS[0], 'ref', null],
      ['id3', REFS[1], 'ref', null],
      ['id4', REFS[2], 'ref', null]
    ]);
    expect(contentProblems(rows.items[0]?.content, 'hb_rangerrollaaaaaa')).toEqual([]);
    for (const c of rows.cards) expect(cardProblems(c.kind, c.content)).toEqual([]);
  });

  it('names a card key the account holds and drops an author key with no card', () => {
    const bare = { ...record, cards: { refs: { [REFS[0] as string]: ref('R0') } } };
    const rows = copyRows(bare, { newId: ids(), hasCard: (k) => k === SET });
    expect(rows.cards.map((c) => c.key)).toEqual([REFS[0]]);
    expect(rows.items[0]?.content.set).toBe(SET);
    expect(rows.items[0]?.content.refs).toEqual([REFS[0]]);
  });

  it('copies an item with no relations and no cards as it is', () => {
    const plain = recordOf(
      'hb_plainaaaaaaaaaaa',
      { kind: 'item', ru: 'Простое', set: 'saints-ensemble' },
      null
    );
    const rows = copyRows({ ...plain, hid: 'x' }, { newId: ids(), hasCard: () => false });
    expect(rows.cards).toEqual([]);
    expect(rows.items[0]?.content).toEqual({
      kind: 'item',
      ru: 'Простое',
      en: 'Простое',
      ende: '',
      rud: '',
      set: 'saints-ensemble'
    });
  });
});
