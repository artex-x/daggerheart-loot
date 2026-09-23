/* The worked examples here are not invented: they are the ones the app's own
   help panel promises a reader, word for word. If this file and that text ever
   disagree, one of them is lying to somebody. */
import { describe, expect, it } from 'vitest';
import { dict } from './dict.js';
import {
  guessBand,
  guessPrice,
  guessWhy,
  MONEY_DEFAULT,
  priceText,
  reprice,
  totalText,
  type Rarity
} from './money.js';
import type { Record_ } from './types.js';

const none = (): Rarity | undefined => undefined;

describe('the default is the book, not coins', () => {
  it('bags, because coins are the optional rule', () => {
    expect(MONEY_DEFAULT).toBe('bag');
  });
});

describe('prices as the book counts them', () => {
  /* Straight out of the help text: "750 is 7 bags 5 handfuls, 894 is 8 bags
     9 handfuls, and 899 is already 9 bags. There are no coins in this reading
     at all: 804 is simply 8 bags." */
  it.each([
    [750, '7 мешков 5 горстей'],
    [894, '8 мешков 9 горстей'],
    [899, '9 мешков'],
    [804, '8 мешков']
  ])('%i reads as %s', (coins, want) => {
    expect(priceText(coins, 'bag', 'ru')).toBe(want);
  });

  it('says the same in English', () => {
    expect(priceText(750, 'bag', 'en')).toBe('7 bags 5 handfuls');
    expect(priceText(899, 'bag', 'en')).toBe('9 bags');
  });

  it('never spells more than two units', () => {
    for (const n of [1234, 1111, 987, 9999, 4321]) {
      expect(priceText(n, 'bag', 'ru').split(' ').length).toBeLessThanOrEqual(4);
    }
  });

  it('rounds a carry up into the larger unit instead of saying "10 handfuls"', () => {
    expect(priceText(996, 'bag', 'ru')).toBe('1 сундук');
    expect(priceText(99, 'bag', 'ru')).toBe('1 мешок');
  });

  it('anything under a handful still reads as one', () => {
    /* Otherwise a price of four coins would show as an empty string */
    for (const n of [1, 4, 9]) expect(priceText(n, 'bag', 'ru')).toBe('1 горсть');
  });

  it('nothing is nothing', () => {
    for (const n of [0, -5, NaN]) expect(priceText(n, 'bag', 'ru')).toBe('');
  });
});

describe('prices in coins', () => {
  it('are the number and the unit, unchanged', () => {
    expect(priceText(750, 'coin', 'ru')).toBe('750 зол.');
    expect(priceText(750, 'coin', 'en')).toBe('750 gp');
  });

  it('the mode changes the reading, never the stored number', () => {
    /* Both readings come from the same integer: 804 coins is 8 bags */
    expect(priceText(804, 'coin', 'ru')).toBe('804 зол.');
    expect(priceText(804, 'bag', 'ru')).toBe('8 мешков');
  });
});

describe('Russian plurals', () => {
  it('follow the last digits, not the size', () => {
    expect(priceText(100, 'bag', 'ru')).toBe('1 мешок');
    expect(priceText(200, 'bag', 'ru')).toBe('2 мешка');
    expect(priceText(500, 'bag', 'ru')).toBe('5 мешков');
  });

  it('treat the teens as the exception they are', () => {
    /* 11 handfuls would be "горстей", not "горсть", if it ever printed - the
       rounding carries it into a bag first, so the rule is checked on bags. */
    expect(priceText(1100, 'bag', 'ru')).toBe('1 сундук 1 мешок');
    expect(priceText(2100, 'bag', 'ru')).toBe('2 сундука 1 мешок');
  });
});

describe('suggested prices', () => {
  const weapon = (tier: 1 | 2 | 3 | 4): Record_ => ({
    id: 'q1',
    src: 'core',
    kind: 'equip',
    en: '',
    ende: '',
    ru: '',
    rud: '',
    eq: { t: 'weapon', tier }
  });

  it('read equipment off its tier', () => {
    expect(guessBand(weapon(1), none)).toEqual([20, 30]);
    expect(guessBand(weapon(4), none)).toEqual([1000, 1500]);
    expect(guessPrice(weapon(1), none)).toBe(25);
  });

  it('give armour its own scale', () => {
    const armour: Record_ = {
      id: 'q2',
      src: 'core',
      kind: 'equip',
      en: '',
      ende: '',
      ru: '',
      rud: '',
      eq: { t: 'armor', tier: 4 }
    };
    expect(guessBand(armour, none)).toEqual([1500, 2000]);
  });

  const loot = (kind: 'item' | 'consumable', id = 'ci1'): Record_ => ({
    id,
    src: 'core',
    kind,
    en: '',
    ende: '',
    ru: '',
    rud: ''
  });

  it('read loot off its rarity', () => {
    const rare = (): Rarity => 'rare';
    expect(guessBand(loot('item'), rare)).toEqual([400, 600]);
    expect(guessBand(loot('consumable'), rare)).toEqual([50, 70]);
  });

  it('fall back to the middle of the scale where there is no rarity', () => {
    /* Wondrous, Dread and community records are not in the alternate tables, so
       no rarity was ever written down for them. Inventing one from the name
       would be worse than saying "ordinary". */
    expect(guessBand(loot('item'), none)).toEqual([150, 250]);
  });

  it('read Vault of Ages off its tier instead', () => {
    const voa: Record_ = { ...loot('item', 'voa2_a1'), tier: 'A' };
    expect(guessBand(voa, none)).toEqual([1500, 2500]);
  });
});

describe('the band label', () => {
  const ru = dict('ru');
  const none = (): Rarity | undefined => undefined;

  it('names the rank, for equipment', () => {
    const weapon: Record_ = {
      id: 'q1',
      src: 'core',
      kind: 'equip',
      en: '',
      ende: '',
      ru: '',
      rud: '',
      eq: { t: 'weapon', tier: 2 }
    };
    expect(guessWhy(weapon, none, ru)).toBe('Ранг 2 · 100–150 зол.');
  });

  it('prices an artifact weapon as the artifact section, not as a rank', () => {
    const weapon: Record_ = {
      id: 'voa_a9',
      src: 'voa',
      kind: 'equip',
      en: '',
      ende: '',
      ru: '',
      rud: '',
      tier: 'A',
      eq: { t: 'weapon', tier: 'A' }
    };
    expect(guessBand(weapon, none)).toEqual([1500, 2500]);
    expect(guessWhy(weapon, none, ru)).toBe('Артефакты · 1500–2500 зол.');
  });

  it('names the rarity, for loot the alternate tables know', () => {
    const loot: Record_ = {
      id: 'ci1',
      src: 'core',
      kind: 'item',
      en: '',
      ende: '',
      ru: '',
      rud: ''
    };
    const rare = (): Rarity => 'rare';
    expect(guessWhy(loot, rare, ru)).toBe('Редкая · 400–600 зол.');
  });

  it('names the Vault of Ages tier, where there is no rarity to read', () => {
    const voa: Record_ = {
      id: 'voa2_a1',
      src: 'voa',
      kind: 'item',
      en: '',
      ende: '',
      ru: '',
      rud: '',
      tier: 'A'
    };
    expect(guessWhy(voa, none, ru)).toBe('Артефакты · 1500–2500 зол.');
  });

  it('names the other Vault of Ages sections and its numbered tiers', () => {
    const cursed: Record_ = {
      id: 'voa2_c1',
      src: 'voa',
      kind: 'item',
      en: '',
      ende: '',
      ru: '',
      rud: '',
      tier: 'C'
    };
    expect(guessWhy(cursed, none, ru)).toBe('Проклятые предметы · 1500–2500 зол.');

    const tier2: Record_ = {
      id: 'voa1_i1',
      src: 'voa',
      kind: 'item',
      en: '',
      ende: '',
      ru: '',
      rud: '',
      tier: 2
    };
    expect(guessWhy(tier2, none, ru)).toBe('Ранг 2 · 150–250 зол.');
  });

  it('admits there is nothing to go on, for equipment outside every band', () => {
    /* Off the map entirely - guessBand's GUESS_EQ has no such kind. */
    const unknown = {
      id: 'q9',
      src: 'core',
      kind: 'equip',
      en: '',
      ende: '',
      ru: '',
      rud: '',
      eq: { t: 'shield', tier: 2 }
    } as unknown as Record_;
    expect(guessWhy(unknown, none, ru)).toBe(ru.guessNoTier);
  });

  it('reads the same way in English', () => {
    const en = dict('en');
    const loot: Record_ = {
      id: 'ci1',
      src: 'core',
      kind: 'item',
      en: '',
      ende: '',
      ru: '',
      rud: ''
    };
    expect(guessWhy(loot, () => 'rare', en)).toBe('Rare · 400–600 gp');
  });
});

describe('shifting prices by a percentage', () => {
  it('rounds to whole coins', () => {
    expect(reprice(231, -20)).toBe(185);
    expect(reprice(100, 15)).toBe(115);
  });

  it('never lets a discount reach zero', () => {
    /* A price of zero is not a discount, it is a price that went missing */
    expect(reprice(1, -99)).toBe(1);
    expect(reprice(2, -100)).toBe(1);
  });
});

describe('the selection total', () => {
  const ru = dict('ru');

  it('draws nothing when no taken entry has a price', () => {
    expect(totalText({ coins: 0, unpriced: 2 }, 'bag', 'ru', ru)).toBe('');
  });

  it('reads the sum once, in the list money mode', () => {
    expect(totalText({ coins: 112, unpriced: 0 }, 'bag', 'ru', ru)).toBe(
      'Итого: 1 мешок 1 горсть'
    );
    expect(totalText({ coins: 112, unpriced: 0 }, 'coin', 'en', dict('en'))).toBe(
      'Total: 112 gp'
    );
  });

  it('counts the unpriced taken entries after the sum', () => {
    expect(totalText({ coins: 112, unpriced: 1 }, 'bag', 'ru', ru)).toBe(
      'Итого: 1 мешок 1 горсть (без цены: 1)'
    );
  });
});
