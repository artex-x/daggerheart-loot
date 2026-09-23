import { describe, expect, it } from 'vitest';
import {
  cardArt,
  COMPACT_PER_SHEET,
  dmgParts,
  glyphKey,
  pages,
  PRINT_GLYPH,
  printTrait
} from './print.js';
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
    expect(cardArt('banner', false)).toBe('card/banner.svg');
  });

  it('takes -bw in black and white', () => {
    expect(cardArt('banner', true)).toBe('card/banner-bw.svg');
  });

  it('collapses a die name before appending -bw - colour was the only split', () => {
    expect(cardArt('die-d8-phy', true)).toBe('card/die-d8-bw.svg');
  });

  it('keeps the magic ribbon its own drawing in black and white', () => {
    expect(cardArt('ribbon-mag', true)).toBe('card/ribbon-mag-bw.svg');
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

describe('the fallback glyph for a record with no image', () => {
  const rec = (over: Partial<Record_>): Record_ => ({
    id: 'x1',
    src: 'core',
    kind: 'item',
    en: 'T',
    ende: '',
    ru: 'Т',
    rud: '',
    ...over
  });

  it('reads off equipment kind', () => {
    expect(glyphKey(rec({ eq: { t: 'weapon', tier: 1 } }))).toBe('weapon');
    expect(glyphKey(rec({ eq: { t: 'secondary', tier: 1 } }))).toBe('secondary');
    expect(glyphKey(rec({ eq: { t: 'armor', tier: 1 } }))).toBe('armor');
  });

  it('splits loot into item and consumable', () => {
    expect(glyphKey(rec({ kind: 'item' }))).toBe('item');
    expect(glyphKey(rec({ kind: 'consumable' }))).toBe('cons');
  });

  it('has a path for every kind, and every path starts with a moveto', () => {
    for (const d of Object.values(PRINT_GLYPH)) expect(d.startsWith('M')).toBe(true);
    expect(Object.keys(PRINT_GLYPH).sort()).toEqual(
      ['weapon', 'secondary', 'armor', 'item', 'cons'].sort()
    );
  });
});
