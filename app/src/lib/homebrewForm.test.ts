/* The editor's form over the database's own rules: a draft writes the stored part the
   validators take, and each problem finds its field and its text. */

import { describe, expect, it } from 'vitest';
import { dict } from './dict.js';
import {
  canonJson,
  contentProblems,
  recordOf,
  type BookRow,
  type CardRef,
  type CardRow,
  type ItemRow
} from './homebrew.js';
import {
  cardContentOf,
  cardDraftOf,
  cardFieldOf,
  cardFormProblems,
  cardMatches,
  cardOption,
  cardProblemText,
  contentOf,
  draftOf,
  fieldOf,
  formProblems,
  lineOption,
  matchRecords,
  previewOf,
  problemText,
  recordMatches,
  recordOption,
  type ItemDraft,
  deleteItemAsk
} from './homebrewForm.js';
import { foldQuery } from './search.js';
import type { Record_ } from './types.js';

const row = (content: ItemRow['content'], bookId: string | null = null): ItemRow => ({
  id: 'i1',
  key: 'hb_emberaxeaaaaaaaa',
  book_id: bookId,
  content,
  revision: 3,
  created_at: '2026-09-20T10:00:00Z',
  updated_at: '2026-09-20T10:00:00Z'
});

const AXE = row(
  {
    kind: 'equip',
    ru: 'Топор Тлеющих Углей',
    en: 'Ember Axe',
    rud: 'Лезвие тлеет.',
    ende: 'The blade smoulders.',
    section: 'hb_sectbladesaaaaaa',
    eq: {
      t: 'weapon',
      tier: 2,
      cls: 'mag',
      tr: 'spellcast',
      rg: 'melee',
      dmg: 'd10+2',
      dt: 'mag',
      bu: 2,
      alt: { tr: 'strength', rg: 'veryclose', dmg: 'd8', dt: 'phy' }
    }
  },
  'b1'
);
const CAP = row({ kind: 'item', en: 'Whispering Cap', ende: 'Hear.', tier: 2 });
const COAT = row({
  kind: 'equip',
  ru: 'Кожаный колет',
  eq: { t: 'armor', tier: 'A', as: 3, th: [6, 13] }
});
const BOOK: BookRow = {
  id: 'b1',
  key: 'hb_alderworkshopaaa',
  content: { ru: 'Мастерская Ольхи', sections: [{ key: 'hb_sectbladesaaaaaa', ru: 'Клинки' }] },
  revision: 1,
  created_at: '2026-09-20T10:00:00Z',
  updated_at: '2026-09-20T10:00:00Z'
};

const t = dict('ru');
const draft = (over: Partial<ItemDraft>): ItemDraft => ({ ...draftOf(null, 'ru'), ...over });

describe('draftOf and contentOf', () => {
  it('starts a new item as a plain item in the default source', () => {
    const d = draftOf(null, 'ru');
    expect(d).toMatchObject({ kind: 'item', t: 'weapon', bookId: null, section: null });
    expect(d.name).toBe('');
    expect(d.eqTier).toBe('');
  });

  it.each([
    ['a weapon with a second set, in Russian', AXE, 'ru'],
    ['a weapon, in English', AXE, 'en'],
    ['an English-only loot item', CAP, 'en'],
    ['an armour artifact', COAT, 'ru']
  ] as const)('writes back %s unchanged', (_name, r, lang) => {
    expect(canonJson(contentOf(draftOf(r, lang), lang, r.content))).toBe(canonJson(r.content));
  });

  it('writes the edited language and keeps the other one from the base', () => {
    const d = { ...draftOf(CAP, 'ru'), name: '  Шапка  ', desc: '' };
    expect(contentOf(d, 'ru', CAP.content)).toEqual({
      kind: 'item',
      ru: 'Шапка',
      en: 'Whispering Cap',
      ende: 'Hear.',
      tier: 2
    });
  });

  it('writes nothing of another kind or type, and keeps it in the draft', () => {
    const d = { ...draftOf(AXE, 'ru'), kind: 'item' as const };
    const c = contentOf(d, 'ru', AXE.content) as Record<string, unknown>;
    expect(c['eq']).toBeUndefined();
    expect([d.dmgDie, d.dmgBonus]).toEqual(['d10', '2']);
    const armour = contentOf({ ...draftOf(AXE, 'ru'), t: 'armor' }, 'ru', null) as {
      eq: Record<string, unknown>;
    };
    expect(Object.keys(armour.eq).sort()).toEqual(['t', 'tier']);
  });

  it('splits a stored damage into the die and the bonus', () => {
    const d = draftOf(AXE, 'ru');
    expect([d.dmgDie, d.dmgBonus]).toEqual(['d10', '2']);
    expect([d.altDmgDie, d.altDmgBonus]).toEqual(['d8', '']);
    const four = draftOf(
      row({ kind: 'equip', ru: 'Нож', eq: { ...AXE.content.eq!, dmg: 'd4' } }),
      'ru'
    );
    expect([four.dmgDie, four.dmgBonus]).toEqual(['d4', '']);
  });

  it.each([
    ['d12', '25', 'd12+25'],
    ['d12', '', 'd12'],
    ['d8', ' +7 ', 'd8+7'],
    ['d8', '05', 'd8+5'],
    ['', '', undefined]
  ] as const)('joins the die %s and the bonus %o into %o', (die, bonus, dmg) => {
    const c = contentOf(
      draft({ kind: 'equip', t: 'weapon', eqTier: '1', dmgDie: die, dmgBonus: bonus }),
      'ru',
      null
    ) as { eq: Record<string, unknown> };
    expect(c.eq['dmg']).toBe(dmg);
  });

  it('writes the second set from its own pair and reads the numbers of an armour', () => {
    const c = contentOf(
      draft({ kind: 'equip', t: 'weapon', eqTier: '1', bu: 'any', altDmgDie: 'd6' }),
      'ru',
      null
    ) as { eq: Record<string, unknown> };
    expect(c.eq['bu']).toBe('any');
    expect(c.eq['alt']).toEqual({ dmg: 'd6' });
    const a = contentOf(
      draft({ kind: 'equip', t: 'armor', eqTier: 'A', as: '4', th0: '5', th1: 'x' }),
      'ru',
      null
    ) as { eq: Record<string, unknown> };
    expect(a.eq).toEqual({ t: 'armor', tier: 'A', as: 4, th: [5, 'x'] });
  });

  it('writes the section only with a named source, and a loot tier only when chosen', () => {
    const c = contentOf(
      draft({ name: 'А', section: 'hb_sectbladesaaaaaa', tier: 'C' }),
      'ru',
      null
    ) as Record<string, unknown>;
    expect(c['section']).toBeUndefined();
    expect(c['tier']).toBe('C');
    const named = contentOf(
      draft({ name: 'А', bookId: 'b1', section: 'hb_sectbladesaaaaaa' }),
      'ru',
      null
    ) as Record<string, unknown>;
    expect(named['section']).toBe('hb_sectbladesaaaaaa');
    expect(named['tier']).toBeUndefined();
  });
});

describe('formProblems', () => {
  it('passes a draft the validators take', () => {
    expect(formProblems(draftOf(AXE, 'ru'), 'ru', AXE.content, [BOOK])).toEqual([]);
    expect(contentProblems(contentOf(draftOf(COAT, 'ru'), 'ru', null))).toEqual([]);
  });

  it('refuses an equipment item with no tier, no name and every weapon field empty', () => {
    const fields = formProblems(draft({ kind: 'equip' }), 'ru', null, []).map(fieldOf);
    expect(fields).toEqual([
      'hb-name',
      'hb-eqtier',
      'hb-cls',
      'hb-tr',
      'hb-rg',
      'hb-dmg',
      'hb-dt',
      'hb-bu'
    ]);
  });

  it('refuses a source another tab deleted', () => {
    expect(formProblems(draft({ name: 'А', bookId: 'b9' }), 'ru', null, [BOOK])).toEqual([
      { path: 'book', rule: 'gone' }
    ]);
  });

  it.each([
    ['', '5', true],
    ['d8', '0', true],
    ['d8', '100', true],
    ['d8', 'x', true],
    ['d8', '99', false]
  ] as const)(
    'refuses the die %o with the bonus %o as a damage problem: %s',
    (die, bonus, bad) => {
      const main = { ...draftOf(AXE, 'ru'), dmgDie: die, dmgBonus: bonus };
      expect(formProblems(main, 'ru', AXE.content, [BOOK]).map(fieldOf)).toEqual(
        bad ? ['hb-dmg'] : []
      );
      const alt = { ...draftOf(AXE, 'ru'), altDmgDie: die, altDmgBonus: bonus };
      expect(formProblems(alt, 'ru', AXE.content, [BOOK]).map(fieldOf)).toEqual(
        bad ? ['hb-alt-dmg'] : []
      );
    }
  );

  it('refuses a half-filled second set on each field left empty', () => {
    const d = { ...draftOf(AXE, 'ru'), altRg: '' as const, altDt: '' as const };
    expect(formProblems(d, 'ru', AXE.content, [BOOK]).map(fieldOf)).toEqual([
      'hb-alt-rg',
      'hb-alt-dt'
    ]);
  });
});

describe('fieldOf and problemText', () => {
  it.each([
    [{ path: 'name', rule: 'required' }, 'hb-name', t.hbErrName],
    [{ path: 'ru', rule: 'long' }, 'hb-name', 'Не длиннее 120 знаков.'],
    [{ path: 'rud', rule: 'long' }, 'hb-desc', 'Не длиннее 3000 знаков.'],
    [{ path: 'en', rule: 'pattern' }, 'hb-name', t.hbErrControl],
    [{ path: 'book', rule: 'gone' }, 'hb-book', t.hbErrBookGone],
    [{ path: 'eq.tier', rule: 'required' }, 'hb-eqtier', t.hbErrTier],
    [{ path: 'eq.cls', rule: 'required' }, 'hb-cls', t.hbErrPick],
    [{ path: 'eq.dmg', rule: 'pattern' }, 'hb-dmg', t.hbErrDmg],
    [{ path: 'eq.as', rule: 'range' }, 'hb-as', t.hbErrAs],
    [{ path: 'eq.th', rule: 'type' }, 'hb-th', t.hbErrTh],
    [{ path: 'eq.th', rule: 'order' }, 'hb-th', t.hbErrThOrder],
    [{ path: 'eq.alt.dmg', rule: 'required' }, 'hb-alt-dmg', t.hbErrAlt],
    [{ path: 'eq.alt.dmg', rule: 'pattern' }, 'hb-alt-dmg', t.hbErrDmg],
    [{ path: 'section', rule: 'pattern' }, 'hb-section', t.hbErrPick],
    [{ path: '', rule: 'type' }, 'hb-name', t.hbErrControl]
  ] as const)('reads %o as its field and text', (p, field, text) => {
    expect(fieldOf(p)).toBe(field);
    expect(problemText(p, t)).toBe(text);
  });
});

describe('previewOf', () => {
  it('draws no stat block until the author chose a tier', () => {
    const d = { ...draftOf(AXE, 'ru'), eqTier: '' as const };
    expect(previewOf(AXE.key, d, 'ru', AXE.content, null).eq).toBeUndefined();
  });

  it('draws the source and section, and an artifact as the record tier', () => {
    const r = previewOf(COAT.key, draftOf(COAT, 'ru'), 'ru', null, null);
    expect(r.tier).toBe('A');
    const axe = previewOf(AXE.key, draftOf(AXE, 'ru'), 'ru', AXE.content, {
      ...BOOK.content,
      key: BOOK.key
    });
    expect(axe.book?.section?.ru).toBe('Клинки');
    expect(axe.id).toBe(AXE.key);
  });

  it('embeds the own cards the draft names', () => {
    const cards: CardRef[] = [
      { key: 'hb_aldersetaaaaaaaa', kind: 'set', ru: 'Комплект', rud: 'Бонус.' },
      { key: 'hb_alderrulecardaaa', kind: 'ref', ru: 'Клеймо', rud: 'Текст.' },
      { key: 'hb_otherrulecardaaa', kind: 'ref', ru: 'Другая', rud: 'Текст.' }
    ];
    const d = {
      ...draftOf(AXE, 'ru'),
      set: 'hb_aldersetaaaaaaaa',
      refs: ['slow', 'hb_alderrulecardaaa']
    };
    const r = previewOf(AXE.key, d, 'ru', AXE.content, null, cards);
    expect(Object.keys(r.cards?.sets ?? {})).toEqual(['hb_aldersetaaaaaaaa']);
    expect(Object.keys(r.cards?.refs ?? {})).toEqual(['hb_alderrulecardaaa']);
  });
});

const RELATED = row(
  {
    ...AXE.content,
    craft: ['ci1', 'hb_smithpotionaaaaa'],
    craft_from: ['ci2'],
    set: 'ember-spark',
    refs: ['slow', 'hb_alderrulecardaaa'],
    eq: { ...AXE.content.eq!, line: 'q1' }
  },
  'b1'
);

describe('the relations of the draft', () => {
  it.each([
    ['all five relation keys', RELATED],
    ['an own line', row({ ...COAT.content, eq: { ...COAT.content.eq!, line: COAT.key } })]
  ] as const)('writes back an item with %s unchanged', (_name, r) => {
    const back = contentOf(draftOf(r, 'ru'), 'ru', r.content, r.key);
    expect(canonJson(back)).toBe(canonJson(r.content));
  });

  it('reads each line mode', () => {
    expect(draftOf(AXE, 'ru')).toMatchObject({ lineMode: 'unique', line: '' });
    expect(draftOf(RELATED, 'ru')).toMatchObject({ lineMode: 'in', line: 'q1' });
    const own = row({ ...COAT.content, eq: { ...COAT.content.eq!, line: COAT.key } });
    expect(draftOf(own, 'ru')).toMatchObject({ lineMode: 'new', line: '' });
  });

  it('writes the key as a new line only when it has one, and no line for «Уникальный»', () => {
    const d = { ...draftOf(COAT, 'ru'), lineMode: 'new' as const };
    const eq = (key?: string) =>
      (contentOf(d, 'ru', null, key) as { eq: { line?: string } }).eq;
    expect(eq('hb_newkeyaaaaaaaaaa').line).toBe('hb_newkeyaaaaaaaaaa');
    expect(eq().line).toBeUndefined();
    const unique = { ...draftOf(RELATED, 'ru'), lineMode: 'unique' as const };
    const c = contentOf(unique, 'ru', null, RELATED.key) as { eq: { line?: string } };
    expect(c.eq.line).toBeUndefined();
  });

  it('refuses the item itself, a line that is missing or of another type, and an open card form', () => {
    const self = { ...draftOf(AXE, 'ru'), craft: [AXE.key] };
    expect(formProblems(self, 'ru', AXE.content, [BOOK], { key: AXE.key })).toEqual([
      { path: 'craft.0', rule: 'self' }
    ]);
    const none = { ...draftOf(AXE, 'ru'), lineMode: 'in' as const };
    expect(formProblems(none, 'ru', AXE.content, [BOOK])).toEqual([
      { path: 'eq.line', rule: 'required' }
    ]);
    const armour = { eq: { t: 'armor', tier: 1, line: 'f81' } } as unknown as Record_;
    const typed = { ...draftOf(RELATED, 'ru') };
    expect(formProblems(typed, 'ru', RELATED.content, [BOOK], { rungs: [armour] })).toEqual([
      { path: 'eq.line', rule: 'enum' }
    ]);
    expect(
      formProblems(draftOf(AXE, 'ru'), 'ru', AXE.content, [BOOK], { open: 'set' })
    ).toEqual([{ path: 'set', rule: 'open' }]);
    expect(
      formProblems(draftOf(AXE, 'ru'), 'ru', AXE.content, [BOOK], { open: 'ref' })
    ).toEqual([{ path: 'refs', rule: 'open' }]);
  });

  it.each([
    [{ path: 'eq.line', rule: 'required' }, 'hb-line', t.hbErrLine],
    [{ path: 'eq.line', rule: 'enum' }, 'hb-line', t.hbErrLineType],
    [{ path: 'craft.3', rule: 'self' }, 'hb-craft', t.hbErrPick],
    [{ path: 'craft_from', rule: 'many' }, 'hb-craft-from', t.hbErrPick],
    [{ path: 'refs.1', rule: 'duplicate' }, 'hb-refs', t.hbErrPick],
    [{ path: 'set', rule: 'open' }, 'hb-set', t.hbErrSetOpen],
    [{ path: 'refs', rule: 'open' }, 'hb-refs', t.hbErrCardOpen]
  ] as const)('reads %o as its field and text', (p, field, text) => {
    expect(fieldOf(p)).toBe(field);
    expect(problemText(p, t)).toBe(text);
  });
});

const weapon = (id: string, tier: 1 | 2 | 'A', src = 'core'): Record_ =>
  ({
    id,
    src,
    en: 'Broadsword ' + id,
    ru: 'Палаш ' + id,
    ende: '',
    rud: '',
    tier,
    eq: { t: 'weapon', tier, line: 'q1' }
  }) as unknown as Record_;

describe('the picker options', () => {
  it('names a record with its type, source and tier, or its kind', () => {
    expect(recordOption(weapon('q1', 1), 'ru', t)).toEqual({
      id: 'q1',
      name: 'Палаш q1',
      meta: 'Основное оружие · Core · Ранг 1'
    });
    expect(recordOption(weapon('q9', 'A'), 'en', dict('en')).meta).toBe(
      'Primary weapon · Core · Artifact'
    );
    const potion = { id: 'p', src: 'core', kind: 'consumable', en: 'P', ru: 'Зелье' };
    expect(recordOption(potion as unknown as Record_, 'ru', t).meta).toBe('Расходник · Core');
  });

  it('names a line by its lowest rung and its size, or as a line with no other items', () => {
    const o = lineOption([weapon('q1', 1), weapon('q38', 2)], 'q1', 'ru', t);
    expect(o).toEqual({
      id: 'q1',
      name: 'Палаш q1',
      meta: 'Основное оружие · Core · Ранг 1 · линия из 2 рангов'
    });
    expect(lineOption([], 'hb_x', 'ru', t)).toEqual({
      id: 'hb_x',
      name: t.hbLineAlone,
      meta: ''
    });
  });

  it('names a rule card by its name and subtitle, an own one with its source', () => {
    expect(cardOption('slow', { ru: 'Медленный', rusub: 'Черта' }, 'ru', null)).toEqual({
      id: 'slow',
      name: 'Медленный',
      meta: 'Черта'
    });
    expect(cardOption('hb_c', { en: 'Brand' }, 'ru', 'Хоумбрю')).toEqual({
      id: 'hb_c',
      name: 'Brand',
      meta: 'Хоумбрю'
    });
  });

  it('finds a card by its name or subtitle in either language', () => {
    const card = { ru: 'Медленный', en: 'Slow', ensub: 'Adversary feature' };
    expect(cardMatches(card, foldQuery('медл'))).toBe(true);
    expect(cardMatches(card, foldQuery('adversary'))).toBe(true);
    expect(cardMatches(card, foldQuery('огонь'))).toBe(false);
  });
});

const card = (over: Partial<CardRow>): CardRow => ({
  id: 'c1',
  key: 'hb_alderrulecardaaa',
  kind: 'ref',
  book_id: 'b1',
  content: {
    ru: 'Клеймо',
    en: 'Brand',
    rusub: 'Черта',
    ensub: 'Feature',
    rud: 'Р.',
    ende: 'E.'
  },
  revision: 1,
  created_at: '2026-09-20T10:00:00Z',
  updated_at: '2026-09-20T10:00:00Z',
  ...over
});

describe('the card form', () => {
  it('reads a card in one language with its own source, and a new card in the given one', () => {
    expect(cardDraftOf(card({}), 'ru', null)).toEqual({
      name: 'Клеймо',
      sub: 'Черта',
      text: 'Р.',
      url: '',
      bookId: 'b1'
    });
    expect(cardDraftOf(null, 'en', 'b2')).toEqual({
      name: '',
      sub: '',
      text: '',
      url: '',
      bookId: 'b2'
    });
  });

  it('writes the edited language and keeps the other one; a set writes no subtitle or link', () => {
    const base = card({}).content;
    const d = {
      name: ' Клеймо II ',
      sub: '',
      text: 'Новый.',
      url: ' https://a.test ',
      bookId: null
    };
    expect(cardContentOf('ref', d, 'ru', base)).toEqual({
      en: 'Brand',
      ensub: 'Feature',
      ende: 'E.',
      ru: 'Клеймо II',
      rud: 'Новый.',
      url: 'https://a.test'
    });
    expect(cardContentOf('set', d, 'ru', base)).toEqual({
      en: 'Brand',
      ende: 'E.',
      ru: 'Клеймо II',
      rud: 'Новый.'
    });
    const items = ['q1', 'ci1'];
    const kept = cardContentOf('set', d, 'ru', { ...base, items });
    expect(kept.items).toEqual(items);
    expect(kept.items).not.toBe(items);
  });

  it('refuses an empty name and text, a name another card holds and a link that is not https', () => {
    const empty = { name: '', sub: '', text: ' ', url: '', bookId: null };
    expect(cardFormProblems('set', empty, 'ru', null, []).map(cardFieldOf)).toEqual([
      'name',
      'text'
    ]);
    /* U+180E survives trim() and is still a space of the class homebrew_names_ok holds. */
    const mongolian = String.fromCharCode(0x180e);
    const spaced = { name: mongolian, sub: '', text: mongolian, url: '', bookId: null };
    expect(cardFormProblems('set', spaced, 'ru', null, []).map(cardFieldOf)).toEqual([
      'name',
      'text'
    ]);
    const taken = { name: 'клеймо', sub: '', text: 'Т.', url: 'http://a.test', bookId: null };
    const problems = cardFormProblems('ref', taken, 'ru', null, [card({})]);
    expect(problems).toEqual([
      { path: 'url', rule: 'pattern' },
      { path: 'name', rule: 'duplicate' }
    ]);
    expect(problems.map((p) => cardProblemText('ref', p, t, taken.name))).toEqual([
      t.hbErrUrl,
      'Карта правил «клеймо» уже есть.'
    ]);
  });

  it.each([
    ['set', { path: 'name', rule: 'required' }, 'name', t.hbErrName],
    ['set', { path: 'text', rule: 'required' }, 'text', t.hbErrSetBonus],
    ['ref', { path: 'text', rule: 'required' }, 'text', t.hbErrCardText],
    ['set', { path: 'name', rule: 'duplicate' }, 'name', 'Комплект «Кузня» уже есть.'],
    ['ref', { path: 'ru', rule: 'long' }, 'name', 'Не длиннее 80 знаков.'],
    ['ref', { path: 'rusub', rule: 'long' }, 'sub', 'Не длиннее 60 знаков.'],
    ['ref', { path: 'rud', rule: 'long' }, 'text', 'Не длиннее 1500 знаков.'],
    ['ref', { path: 'url', rule: 'long' }, 'url', 'Не длиннее 300 знаков.'],
    ['ref', { path: 'ende', rule: 'pattern' }, 'text', t.hbErrControl],
    ['ref', { path: 'kind', rule: 'enum' }, 'name', t.hbErrControl]
  ] as const)('reads a %s card problem %o as its field and text', (kind, p, field, text) => {
    expect(cardFieldOf(p)).toBe(field);
    expect(cardProblemText(kind, p, t, ' Кузня ')).toBe(text);
  });
});

describe('deleteItemAsk', () => {
  it('puts the consequence for other lists before the undo sentence', () => {
    const t = dict('ru');
    expect(deleteItemAsk('Удалить предмет «А»?', false, t)).toBe(
      'Удалить предмет «А»? ' + t.hbDeleteOthers + ' Отменить удаление нельзя.'
    );
    expect(deleteItemAsk('Удалить предметы (2)?', true, dict('en'))).toBe(
      'Удалить предметы (2)? ' + dict('en').hbDeleteOthersMany + ' This cannot be undone.'
    );
  });
});

describe('matchRecords', () => {
  const rec = (id: string, ru: string, en: string): Record_ =>
    recordOf(id, { kind: 'item', ru, en }, null);
  const all = [
    rec('hb_aaaaaaaaaaaaaaaa', 'Ёлочный шар', 'Bauble'),
    rec('hb_bbbbbbbbbbbbbbbb', 'Кольцо', 'Ring'),
    rec('hb_cccccccccccccccc', 'Скатка', 'Bedroll')
  ];

  it('keeps every record for a blank or a space query, in order', () => {
    expect(matchRecords(all, '')).toEqual(all);
    expect(matchRecords(all, '   ')).toEqual(all);
  });

  it('matches either language and folds ё to е as search does', () => {
    expect(matchRecords(all, 'ring').map((r) => r.id)).toEqual(['hb_bbbbbbbbbbbbbbbb']);
    expect(matchRecords(all, ' КОЛЬ ').map((r) => r.id)).toEqual(['hb_bbbbbbbbbbbbbbbb']);
    expect(matchRecords(all, 'елоч').map((r) => r.id)).toEqual(['hb_aaaaaaaaaaaaaaaa']);
    expect(matchRecords(all, 'zzz')).toEqual([]);
  });

  it('tests one record against a folded query', () => {
    expect(recordMatches(all[2]!, 'bed')).toBe(true);
    expect(recordMatches(all[2]!, 'ring')).toBe(false);
  });
});
