/* The editor's form over the database's own rules: a draft writes the stored part the
   validators take, and each problem finds its field and its text. */

import { describe, expect, it } from 'vitest';
import { dict } from './dict.js';
import { canonJson, contentProblems, type BookRow, type ItemRow } from './homebrew.js';
import {
  contentOf,
  draftOf,
  fieldOf,
  formProblems,
  previewOf,
  problemText,
  type ItemDraft
} from './homebrewForm.js';

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
    expect(d.dmg).toBe('d10+2');
    const armour = contentOf({ ...draftOf(AXE, 'ru'), t: 'armor' }, 'ru', null) as {
      eq: Record<string, unknown>;
    };
    expect(Object.keys(armour.eq).sort()).toEqual(['t', 'tier']);
  });

  it('lower-cases the damage, drops its spaces and reads the numbers of an armour', () => {
    const c = contentOf(
      draft({
        kind: 'equip',
        t: 'weapon',
        eqTier: '1',
        dmg: ' D8 + 2 ',
        bu: 'any',
        altDmg: 'D6'
      }),
      'ru',
      null
    ) as { eq: Record<string, unknown> };
    expect(c.eq['dmg']).toBe('d8+2');
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
});
