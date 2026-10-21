import { describe, expect, it } from 'vitest';
import {
  cardArt,
  COMPACT_PER_SHEET,
  dmgParts,
  pages,
  PREVIEW_MAX_PX,
  previewScale,
  PRINTED_PX,
  printTrait,
  setLineOf
} from './print.js';
import { buildIndex } from './data.js';
import { withRecords, type HomebrewRecord } from './homebrew.js';
import type { Record_ } from './types.js';

describe("the trait cell's word", () => {
  it('abbreviates the Spellcast trait in Russian, where the full term does not fit', () => {
    expect(printTrait('spellcast', 'ru')).toBe('Хар. Заклинателя');
    expect(printTrait('spellcast', 'en')).toBe('Spellcast');
  });

  it("keeps the stat line's word for every other trait", () => {
    expect(printTrait('agility', 'ru')).toBe('Проворность');
    expect(printTrait(undefined, 'ru')).toBe('');
  });
});

describe('a vector file name', () => {
  it('is plain in colour', () => {
    expect(cardArt('shield', false)).toBe('card/shield.svg');
  });

  it('takes -bw in black and white for each pair drawn as two files', () => {
    expect(cardArt('shield', true)).toBe('card/shield-bw.svg');
    expect(cardArt('burden-1', true)).toBe('card/burden-1-bw.svg');
    expect(cardArt('burden-2', true)).toBe('card/burden-2-bw.svg');
  });
});

describe("the editor preview's scale", () => {
  it('holds the printed widths of the two cells in CSS px', () => {
    expect(PRINTED_PX.std).toBeCloseTo((63 / 25.4) * 96, 2);
    expect(PRINTED_PX.compact).toBeCloseTo((44 / 25.4) * 96, 2);
    expect(PREVIEW_MAX_PX).toBe(420);
  });

  it('draws the card at the column width, at most 420 px, cut to two decimals', () => {
    expect(previewScale(328, false)).toBe(1.37);
    expect(previewScale(340, false)).toBe(1.42);
    expect(previewScale(420, false)).toBe(1.76);
    expect(previewScale(900, false)).toBe(1.76);
    expect(previewScale(328, true)).toBe(1.97);
    expect(previewScale(420, true)).toBe(2.52);
  });

  it('never passes the column', () => {
    for (const w of [300, 328, 333, 340, 401, 420]) {
      expect(previewScale(w, false) * PRINTED_PX.std).toBeLessThanOrEqual(w);
      expect(previewScale(w, true) * PRINTED_PX.compact).toBeLessThanOrEqual(w);
    }
  });

  it('is 1 before the column has a width', () => {
    expect(previewScale(0, false)).toBe(1);
    expect(previewScale(Number.NaN, true)).toBe(1);
  });
});

describe('a damage string split into die and bonus', () => {
  it('splits a die with a bonus', () => {
    expect(dmgParts('d8+3')).toEqual({ die: 'd8', bonus: '+3' });
  });

  it('splits a bare die', () => {
    expect(dmgParts('d6')).toEqual({ die: 'd6', bonus: '' });
  });

  it('leaves nothing undefined', () => {
    expect(dmgParts(undefined)).toEqual({ die: '', bonus: '' });
  });
});

describe('nine-up sheets', () => {
  const of = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

  it('makes no sheet at all for nothing to print', () => {
    expect(pages(of(0))).toEqual({ pages: [], blanks: 0 });
  });

  it('pads a short sheet up to nine', () => {
    expect(pages(of(2))).toEqual({ pages: [of(2)], blanks: 7 });
  });

  it('leaves a full sheet with no blanks', () => {
    expect(pages(of(9))).toEqual({ pages: [of(9)], blanks: 0 });
  });

  it('splits a second sheet and pads only it', () => {
    const r = pages(of(10));
    expect(r.pages).toHaveLength(2);
    expect(r.pages[0]).toHaveLength(9);
    expect(r.pages[1]).toHaveLength(1);
    expect(r.blanks).toBe(8);
  });

  it('fills twenty full sheets with no blanks', () => {
    const r = pages(of(180));
    expect(r.pages).toHaveLength(20);
    expect(r.blanks).toBe(0);
  });
});

describe('sixteen-up compact sheets', () => {
  const of = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

  it('holds sixteen cards to a sheet', () => {
    expect(COMPACT_PER_SHEET).toBe(16);
  });

  it('pads a short sheet up to sixteen', () => {
    expect(pages(of(2), 16)).toEqual({ pages: [of(2)], blanks: 14 });
  });

  it('leaves a full sheet with no blanks', () => {
    expect(pages(of(16), 16)).toEqual({ pages: [of(16)], blanks: 0 });
  });

  it('splits a second sheet and pads only it', () => {
    const r = pages(of(17), 16);
    expect(r.pages).toHaveLength(2);
    expect(r.pages[1]).toHaveLength(1);
    expect(r.blanks).toBe(15);
  });

  it('cuts the 180-card cap into twelve sheets, the last with four cards', () => {
    const r = pages(of(180), 16);
    expect(r.pages).toHaveLength(12);
    expect(r.pages[11]).toHaveLength(4);
    expect(r.blanks).toBe(12);
  });
});

describe("a card's set line", () => {
  const member = (id: string, set?: string): Record_ => ({
    id,
    src: 'core',
    kind: 'item',
    en: 'Thing ' + id,
    ende: '',
    ru: 'Вещь ' + id,
    rud: '',
    ...(set ? { set } : {})
  });
  const a = member('x1', 'pair');
  const b = member('x2', 'pair');
  const index = buildIndex({
    items: { core_item: [a, b, member('x3')] },
    sets: { pair: { ru: 'Пара', en: 'Pair', rud: 'Оба вместе.', ende: 'Both together.' } }
  });

  it('is absent outside a set', () => {
    expect(setLineOf(index, member('x3'), 'ru')).toBeUndefined();
  });

  it('names the set and its members, then the bonus, in each language', () => {
    expect(setLineOf(index, a, 'ru')).toEqual({
      label: 'Пара (Комплект: Вещь x1, Вещь x2)',
      body: 'Оба вместе.'
    });
    expect(setLineOf(index, a, 'en')).toEqual({
      label: 'Pair (Set: Thing x1, Thing x2)',
      body: 'Both together.'
    });
  });

  it('names the set alone for a frozen copy with no other member', () => {
    const card = { ru: 'Свой комплект', en: 'Own Set', rud: 'Бонус.', ende: 'A bonus.' };
    const copy: HomebrewRecord = {
      ...member('hb_copyaaaaaaaaaaaa'),
      src: 'homebrew',
      set: 'hb_ownsetaaaaaaaaaa',
      cards: { sets: { hb_ownsetaaaaaaaaaa: card } }
    };
    const ix = withRecords(index, [], [copy]);
    expect(setLineOf(ix, copy, 'en')).toEqual({ label: 'Own Set', body: 'A bonus.' });
  });
});
