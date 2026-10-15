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
  langOptions,
  matchRecords,
  previewOf,
  problemLang,
  problemText,
  recordMatches,
  recordOption,
  type CardDraft,
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
const draft = (over: Partial<ItemDraft>): ItemDraft => ({ ...draftOf(null), ...over });
/* What the item form opened on: the row and its draft. */
const opened = (r: ItemRow) => ({ base: r.content, draft: draftOf(r) });

describe('draftOf and contentOf', () => {
  it('starts a new item as a plain item in the default source', () => {
    const d = draftOf(null);
    expect(d).toMatchObject({ kind: 'item', t: 'weapon', bookId: null, section: null });
    expect([d.ru, d.en, d.rud, d.ende]).toEqual(['', '', '', '']);
    expect(d.eqTier).toBe('');
  });

  it.each([
    ['a weapon with a second set', AXE],
    ['an English-only loot item', CAP],
    ['an armour artifact', COAT]
  ] as const)('writes back %s unchanged', (_name, r) => {
    expect(canonJson(contentOf(draftOf(r), opened(r)))).toBe(canonJson(r.content));
    expect(canonJson(contentOf(draftOf(r), null))).toBe(canonJson(r.content));
  });

  it('writes the edited language and keeps the other one from the base', () => {
    const d = { ...draftOf(CAP), ru: '  Шапка  ' };
    expect(contentOf(d, opened(CAP))).toEqual({
      kind: 'item',
      ru: 'Шапка',
      en: 'Whispering Cap',
      ende: 'Hear.',
      tier: 2
    });
  });

  it('writes nothing of another kind or type, and keeps it in the draft', () => {
    const d = { ...draftOf(AXE), kind: 'item' as const };
    const c = contentOf(d, opened(AXE)) as Record<string, unknown>;
    expect(c['eq']).toBeUndefined();
    expect([d.dmgDie, d.dmgBonus]).toEqual(['d10', '2']);
    const armour = contentOf({ ...draftOf(AXE), t: 'armor' }, null) as {
      eq: Record<string, unknown>;
    };
    expect(Object.keys(armour.eq).sort()).toEqual(['t', 'tier']);
  });

  it('splits a stored damage into the die and the bonus', () => {
    const d = draftOf(AXE);
    expect([d.dmgDie, d.dmgBonus]).toEqual(['d10', '2']);
    expect([d.altDmgDie, d.altDmgBonus]).toEqual(['d8', '']);
    const four = draftOf(
      row({ kind: 'equip', ru: 'Нож', eq: { ...AXE.content.eq!, dmg: 'd4' } })
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
      null
    ) as { eq: Record<string, unknown> };
    expect(c.eq['dmg']).toBe(dmg);
  });

  it('writes the second set from its own pair and reads the numbers of an armour', () => {
    const c = contentOf(
      draft({ kind: 'equip', t: 'weapon', eqTier: '1', bu: 'any', altDmgDie: 'd6' }),
      null
    ) as { eq: Record<string, unknown> };
    expect(c.eq['bu']).toBe('any');
    expect(c.eq['alt']).toEqual({ dmg: 'd6' });
    const a = contentOf(
      draft({ kind: 'equip', t: 'armor', eqTier: 'A', as: '4', th0: '5', th1: 'x' }),
      null
    ) as { eq: Record<string, unknown> };
    expect(a.eq).toEqual({ t: 'armor', tier: 'A', as: 4, th: [5, 'x'] });
  });

  it('writes the section only with a named source, and a loot tier only when chosen', () => {
    const c = contentOf(
      draft({ ru: 'А', section: 'hb_sectbladesaaaaaa', tier: 'C' }),
      null
    ) as Record<string, unknown>;
    expect(c['section']).toBeUndefined();
    expect(c['tier']).toBe('C');
    const named = contentOf(
      draft({ ru: 'А', bookId: 'b1', section: 'hb_sectbladesaaaaaa' }),
      null
    ) as Record<string, unknown>;
    expect(named['section']).toBe('hb_sectbladesaaaaaa');
    expect(named['tier']).toBeUndefined();
  });
});

describe('formProblems', () => {
  it('passes a draft the validators take', () => {
    expect(formProblems(draftOf(AXE), opened(AXE), [BOOK])).toEqual([]);
    expect(contentProblems(contentOf(draftOf(COAT), null))).toEqual([]);
  });

  it('refuses an equipment item with no tier, no name and every weapon field empty', () => {
    const fields = formProblems(draft({ kind: 'equip' }), null, []).map(fieldOf);
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
    expect(formProblems(draft({ ru: 'А', bookId: 'b9' }), null, [BOOK])).toEqual([
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
      const main = { ...draftOf(AXE), dmgDie: die, dmgBonus: bonus };
      expect(formProblems(main, opened(AXE), [BOOK]).map(fieldOf)).toEqual(
        bad ? ['hb-dmg'] : []
      );
      const alt = { ...draftOf(AXE), altDmgDie: die, altDmgBonus: bonus };
      expect(formProblems(alt, opened(AXE), [BOOK]).map(fieldOf)).toEqual(
        bad ? ['hb-alt-dmg'] : []
      );
    }
  );

  it('refuses a half-filled second set on each field left empty', () => {
    const d = { ...draftOf(AXE), altRg: '' as const, altDt: '' as const };
    expect(formProblems(d, opened(AXE), [BOOK]).map(fieldOf)).toEqual([
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
    const d = { ...draftOf(AXE), eqTier: '' as const };
    expect(previewOf(AXE.key, d, null).eq).toBeUndefined();
  });

  it('draws the source and section, and an artifact as the record tier', () => {
    const r = previewOf(COAT.key, draftOf(COAT), null);
    expect(r.tier).toBe('A');
    const axe = previewOf(AXE.key, draftOf(AXE), {
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
      ...draftOf(AXE),
      set: 'hb_aldersetaaaaaaaa',
      refs: ['slow', 'hb_alderrulecardaaa']
    };
    const r = previewOf(AXE.key, d, null, cards);
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
    const back = contentOf(draftOf(r), opened(r), r.key);
    expect(canonJson(back)).toBe(canonJson(r.content));
  });

  it('reads each line mode', () => {
    expect(draftOf(AXE)).toMatchObject({ lineMode: 'unique', line: '' });
    expect(draftOf(RELATED)).toMatchObject({ lineMode: 'in', line: 'q1' });
    const own = row({ ...COAT.content, eq: { ...COAT.content.eq!, line: COAT.key } });
    expect(draftOf(own)).toMatchObject({ lineMode: 'new', line: '' });
  });

  it('writes the key as a new line only when it has one, and no line for «Уникальный»', () => {
    const d = { ...draftOf(COAT), lineMode: 'new' as const };
    const eq = (key?: string) => (contentOf(d, null, key) as { eq: { line?: string } }).eq;
    expect(eq('hb_newkeyaaaaaaaaaa').line).toBe('hb_newkeyaaaaaaaaaa');
    expect(eq().line).toBeUndefined();
    const unique = { ...draftOf(RELATED), lineMode: 'unique' as const };
    const c = contentOf(unique, null, RELATED.key) as { eq: { line?: string } };
    expect(c.eq.line).toBeUndefined();
  });

  it('refuses the item itself, a line that is missing or of another type, and an open card form', () => {
    const self = { ...draftOf(AXE), craft: [AXE.key] };
    expect(formProblems(self, opened(AXE), [BOOK], { key: AXE.key })).toEqual([
      { path: 'craft.0', rule: 'self' }
    ]);
    const none = { ...draftOf(AXE), lineMode: 'in' as const };
    expect(formProblems(none, opened(AXE), [BOOK])).toEqual([
      { path: 'eq.line', rule: 'required' }
    ]);
    const armour = { eq: { t: 'armor', tier: 1, line: 'f81' } } as unknown as Record_;
    const typed = { ...draftOf(RELATED) };
    expect(formProblems(typed, opened(RELATED), [BOOK], { rungs: [armour] })).toEqual([
      { path: 'eq.line', rule: 'enum' }
    ]);
    expect(formProblems(draftOf(AXE), opened(AXE), [BOOK], { open: 'set' })).toEqual([
      { path: 'set', rule: 'open' }
    ]);
    expect(formProblems(draftOf(AXE), opened(AXE), [BOOK], { open: 'ref' })).toEqual([
      { path: 'refs', rule: 'open' }
    ]);
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

const cardDraft = (over: Partial<CardDraft>): CardDraft => ({
  ...cardDraftOf(null, null),
  ...over
});
const cardOpened = (c: CardRow) => ({ base: c.content, draft: cardDraftOf(c, null) });

describe('the card form', () => {
  it('reads a card in both languages with its own source, and a new card in the given one', () => {
    expect(cardDraftOf(card({}), null)).toEqual({
      ru: 'Клеймо',
      en: 'Brand',
      rusub: 'Черта',
      ensub: 'Feature',
      rud: 'Р.',
      ende: 'E.',
      url: '',
      bookId: 'b1'
    });
    expect(cardDraftOf(null, 'b2')).toEqual({
      ru: '',
      en: '',
      rusub: '',
      ensub: '',
      rud: '',
      ende: '',
      url: '',
      bookId: 'b2'
    });
  });

  it('writes the edited language and keeps the other one; a set writes no subtitle or link', () => {
    const c = card({});
    const d = {
      ...cardDraftOf(c, null),
      ru: ' Клеймо II ',
      rusub: '',
      rud: 'Новый.',
      url: ' https://a.test ',
      bookId: null
    };
    expect(cardContentOf('ref', d, cardOpened(c))).toEqual({
      en: 'Brand',
      ensub: 'Feature',
      ende: 'E.',
      ru: 'Клеймо II',
      rud: 'Новый.',
      url: 'https://a.test'
    });
    expect(cardContentOf('set', d, cardOpened(c))).toEqual({
      en: 'Brand',
      ende: 'E.',
      ru: 'Клеймо II',
      rud: 'Новый.'
    });
    const items = ['q1', 'ci1'];
    const kept = cardContentOf('set', d, { ...cardOpened(c), base: { ...c.content, items } });
    expect(kept.items).toEqual(items);
    expect(kept.items).not.toBe(items);
  });

  it('keepsAnotherDevicesWriteInAnUntouchedCardLanguage', () => {
    const c = card({});
    const d = { ...cardDraftOf(c, null), ru: 'Клеймо II' };
    /* Another device wrote the English text after the form opened; the base is the row now. */
    const now = { ...c.content, ende: 'Twice per rest.' };
    const out = cardContentOf('ref', d, { base: now, draft: cardDraftOf(c, null) });
    expect(out).toMatchObject({ ru: 'Клеймо II', en: 'Brand', ende: 'Twice per rest.' });
  });

  it('refuses an empty name and text, a name another card holds and a link that is not https', () => {
    const empty = cardDraft({ rud: ' ' });
    expect(cardFormProblems('set', empty, null, []).map(cardFieldOf)).toEqual(['name', 'text']);
    /* U+180E survives trim() and is still a space of the class homebrew_names_ok holds. */
    const mongolian = String.fromCharCode(0x180e);
    const spaced = cardDraft({ ru: mongolian, rud: mongolian });
    expect(cardFormProblems('set', spaced, null, []).map(cardFieldOf)).toEqual([
      'name',
      'text'
    ]);
    const taken = cardDraft({ ru: 'клеймо', rud: 'Т.', url: 'http://a.test' });
    const problems = cardFormProblems('ref', taken, null, [card({})]);
    expect(problems).toEqual([
      { path: 'url', rule: 'pattern' },
      { path: 'ru', rule: 'duplicate' }
    ]);
    expect(problems.map((p) => cardProblemText('ref', p, t, taken.ru))).toEqual([
      t.hbErrUrl,
      'Карта правил «клеймо» уже есть.'
    ]);
  });

  it('checksANameDuplicatePerChangedLanguage', () => {
    const others = [card({ id: 'c2', content: { ru: 'Кузня', en: 'Forge', rud: 'Т.' } })];
    const mine = card({ content: { ru: 'Кузня', en: 'Brand', rud: 'Р.' } });
    /* A name the card held when the form opened is not checked again. */
    const same = cardDraftOf(mine, null);
    expect(cardFormProblems('ref', same, cardOpened(mine), others)).toEqual([]);
    const renamed = { ...same, en: 'forge' };
    expect(cardFormProblems('ref', renamed, cardOpened(mine), others)).toEqual([
      { path: 'en', rule: 'duplicate' }
    ]);
    /* A new card checks every language it names. */
    const fresh = cardDraft({ ru: 'кузня', en: 'Forge', rud: 'Т.' });
    expect(cardFormProblems('set', fresh, null, others)).toEqual([
      { path: 'ru', rule: 'duplicate' },
      { path: 'en', rule: 'duplicate' }
    ]);
  });

  it.each([
    ['set', { path: 'name', rule: 'required' }, 'name', t.hbErrName],
    ['set', { path: 'text', rule: 'required' }, 'text', t.hbErrSetBonus],
    ['ref', { path: 'text', rule: 'required' }, 'text', t.hbErrCardText],
    ['set', { path: 'ru', rule: 'duplicate' }, 'name', 'Комплект «Кузня» уже есть.'],
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

describe('both languages', () => {
  it('writesBothLanguagesOfTheDraftInOneContent', () => {
    const d = draft({ ru: 'Рог', en: 'Horn', rud: '**Трубит.**', ende: 'Blows.' });
    expect(contentOf(d, null)).toEqual({
      kind: 'item',
      ru: 'Рог',
      en: 'Horn',
      rud: '**Трубит.**',
      ende: 'Blows.'
    });
  });

  it('writesAnUntouchedLanguageAsTheRowHoldsIt', () => {
    /* A stored text that another client wrote untrimmed stays as it is. */
    const raw = row({ kind: 'item', ru: 'Шапка', en: ' Cap ', ende: 'Hear. ' });
    const d = { ...draftOf(raw), ru: 'Шапка II' };
    expect(contentOf(d, opened(raw))).toEqual({
      kind: 'item',
      ru: 'Шапка II',
      en: ' Cap ',
      ende: 'Hear. '
    });
    /* The base wins over the draft for an untouched language: a reload changed the row. */
    const moved = { base: { ...raw.content, ende: 'Newer.' }, draft: draftOf(raw) };
    expect(contentOf(d, moved)).toMatchObject({ ende: 'Newer.' });
  });

  it('trimsOnlyAChangedLanguage', () => {
    const raw = row({ kind: 'item', ru: ' Шапка ', en: ' Cap ' });
    const d = { ...draftOf(raw), en: ' Cap II ' };
    expect(contentOf(d, opened(raw))).toEqual({ kind: 'item', ru: ' Шапка ', en: 'Cap II' });
  });

  it('readsTheLanguageOfAProblemFromItsPath', () => {
    const lang = (path: string) => problemLang({ path, rule: 'long' });
    expect(['en', 'ende', 'ensub', 'sections.1.en'].map(lang)).toEqual([
      'en',
      'en',
      'en',
      'en'
    ]);
    expect(['ru', 'rud', 'rusub'].map(lang)).toEqual(['ru', 'ru', 'ru']);
    expect(['name', 'text', 'eq.tier', ''].map(lang)).toEqual([null, null, null, null]);
  });

  it('marks an empty language on the switch', () => {
    const d = draft({ ru: 'Рог', ende: ' ' });
    expect(langOptions('item', d, t)).toEqual([
      { value: 'ru', label: 'RU' },
      { value: 'en', label: 'EN - пусто' }
    ]);
    expect(langOptions('ref', cardDraft({ ensub: 'Sub' }), dict('en'))).toEqual([
      { value: 'ru', label: 'RU - empty' },
      { value: 'en', label: 'EN' }
    ]);
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
