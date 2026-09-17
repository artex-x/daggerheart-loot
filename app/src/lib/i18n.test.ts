/* The stat line, held to what the live app renders.
 *
 * docs/fixtures/statlines/equipment.json was captured from the old app, in both
 * languages, across every equipment kind and four sources. Tests written
 * alongside the code only prove it is self-consistent; this proves the port is
 * faithful, which is the whole point of Phase 2. */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildIndex, type Loot } from './data.js';
import {
  descOf,
  eqLine,
  eqParts,
  EQ_BURDEN,
  EQ_CLS,
  EQ_DT,
  EQ_RANGE,
  EQ_TRAIT,
  EQ_TYPE,
  eqWord,
  itemsWord,
  nameOf
} from './i18n.js';
import { isFrameRecord } from './label.js';
import type { Lang, Record_ } from './types.js';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const LOOT = JSON.parse(readFileSync(join(ROOT, 'data.json'), 'utf8')) as Loot;
const index = buildIndex(LOOT);

const FIXTURE = JSON.parse(
  readFileSync(join(ROOT, 'docs', 'fixtures', 'statlines', 'equipment.json'), 'utf8')
) as Record<string, Record<Lang, string[]>>;

/* The three words the stat line needs that are not in the vocabulary maps.
   They live in the interface dictionary, so the caller supplies them. */
const LABELS: Record<Lang, { tier: string; thresholds: string; armorScore: string }> = {
  ru: { tier: 'Ранг', thresholds: 'Пороги', armorScore: 'Броня' },
  en: { tier: 'Tier', thresholds: 'Thresholds', armorScore: 'Armor' }
};

describe('the stat line matches the app it came from', () => {
  it('has something to compare against', () => {
    expect(Object.keys(FIXTURE).length).toBeGreaterThanOrEqual(10);
  });

  for (const id of Object.keys(FIXTURE)) {
    for (const lang of ['ru', 'en'] as const) {
      it(`${id} in ${lang}`, () => {
        const it_ = index.byId.get(id);
        expect(it_).toBeDefined();
        const record = it_ as Record_;
        expect(
          eqParts(record, lang, LABELS[lang], { noType: true, noTier: isFrameRecord(record) })
        ).toEqual(FIXTURE[id]?.[lang]);
      });
    }
  }
});

describe('the pieces of the line', () => {
  const katana = () => index.byId.get('q26') as Record_;

  it('lead with the type unless asked not to', () => {
    expect(eqParts(katana(), 'ru', LABELS.ru)[0]).toBe('Основное оружие');
    expect(eqParts(katana(), 'en', LABELS.en)[0]).toBe('Primary weapon');
  });

  it('join with a middle dot', () => {
    expect(eqLine(katana(), 'ru', LABELS.ru, { noType: true })).toContain(' · ');
  });

  it('can omit a tier from a direct frame-record stat line', () => {
    const frame = index.byId.get('f1') as Record_;
    expect(eqLine(frame, 'ru', LABELS.ru, { noType: true, noTier: true })).not.toContain(
      'Ранг'
    );
  });

  it('always carry a tier, because every piece has one from a book', () => {
    for (const eq of index.allEquip) {
      expect(eqParts(eq, 'ru', LABELS.ru).some((p) => p.startsWith('Ранг'))).toBe(true);
    }
  });

  it('print the class of a magic weapon whose damage can be physical', () => {
    /* The Shadowblade is cls:'mag' with dt:'any' - the class is printed, not
       inferred from the damage */
    const shadow = index.byId.get('q33') as Record_;
    expect(shadow.eq?.cls).toBe('mag');
    expect(shadow.eq?.dt).toBe('any');
    expect(eqParts(shadow, 'ru', LABELS.ru)).toContain('Магическое');
  });

  it('give armour thresholds and a score instead of trait and range', () => {
    const armour = index.byId.get('q337') as Record_;
    const parts = eqParts(armour, 'ru', LABELS.ru, { noType: true });
    expect(parts.some((p) => p.startsWith('Пороги'))).toBe(true);
    expect(parts.some((p) => p.startsWith('Броня'))).toBe(true);
    expect(parts).not.toContain('Вплотную');
  });

  it('produce nothing at all for a record with no stat block', () => {
    expect(eqParts(index.byId.get('ci1') as Record_, 'ru', LABELS.ru)).toEqual([]);
    expect(eqLine(index.byId.get('ci1') as Record_, 'ru', LABELS.ru)).toBe('');
  });
});

describe('the vocabulary', () => {
  it('follows daggerheart.su, which the rest of the app quotes', () => {
    expect(eqWord(EQ_TRAIT, 'finesse', 'ru')).toBe('Искусность');
    expect(eqWord(EQ_TRAIT, 'presence', 'ru')).toBe('Влияние');
  });

  it('says nothing for a key it does not know, rather than printing the key', () => {
    expect(eqWord(EQ_TRAIT, 'nonsense', 'ru')).toBe('');
    expect(eqWord(EQ_TRAIT, undefined, 'ru')).toBe('');
  });
});

describe('record text', () => {
  it('picks the field for the language', () => {
    const katana = index.byId.get('q26') as Record_;
    expect(nameOf(katana, 'ru')).toBe(katana.ru);
    expect(nameOf(katana, 'en')).toBe(katana.en);
    expect(descOf(katana, 'ru')).toBe(katana.rud);
  });

  it('falls back to English in Russian, because a record may arrive untranslated', () => {
    const bare: Record_ = {
      id: 'x',
      src: 'core',
      kind: 'item',
      en: 'Name',
      ende: 'Text',
      ru: '',
      rud: ''
    };
    expect(nameOf(bare, 'ru')).toBe('Name');
    expect(descOf(bare, 'ru')).toBe('Text');
  });

  it('never falls back the other way, because English is the source', () => {
    const ruOnly: Record_ = {
      id: 'x',
      src: 'core',
      kind: 'item',
      en: '',
      ende: '',
      ru: 'Имя',
      rud: 'Текст'
    };
    expect(nameOf(ruOnly, 'en')).toBe('');
  });

  it('leaves no record without a name in either language', () => {
    for (const rec of index.searchable) {
      expect(nameOf(rec, 'ru')).toBeTruthy();
      expect(nameOf(rec, 'en')).toBeTruthy();
    }
  });
});

describe('a stat block with gaps in it', () => {
  /* Every piece in both books fills these in, so the fallbacks never ran. They
     are there so a gap prints as nothing rather than as "undefined" or as a
     stray slash, which is what a reader would see on a card. */
  const gear = (eq: NonNullable<Record_['eq']>): Record_ => ({
    id: 'x1',
    src: 'core',
    kind: 'equip',
    en: 'Thing',
    ende: '',
    ru: 'Вещь',
    rud: '',
    eq
  });

  it('omits thresholds and armour score when the armour has neither', () => {
    /* `noType` because the word for armour and the word for its score are the
       same in Russian, and the type is not what is being asserted here. */
    const parts = eqParts(gear({ t: 'armor', tier: 1 }), 'ru', LABELS.ru, { noType: true });
    expect(parts.join(' ')).not.toContain(LABELS.ru.thresholds);
    expect(parts.join(' ')).not.toContain(LABELS.ru.armorScore);
    expect(parts.join(' ')).not.toContain('undefined');
  });

  it('prints a threshold pair, minor and major separated by a slash', () => {
    /* The data always carries both halves of the pair or neither - `th` is
       typed as the pair it is - so there is no half-filled case to defend
       against, unlike `as`, which is a lone number and can be zero alone. */
    const parts = eqParts(gear({ t: 'armor', tier: 1, th: [5, 11] }), 'ru', LABELS.ru, {
      noType: true
    });
    expect(parts.join(' ')).toContain(`${LABELS.ru.thresholds} 5/11`);
    expect(parts.join(' ')).not.toContain('undefined');
  });

  it('keeps an armour score of zero', () => {
    const parts = eqParts(gear({ t: 'armor', tier: 1, as: 0 }), 'ru', LABELS.ru, {
      noType: true
    });
    expect(parts.join(' ')).toContain(`${LABELS.ru.armorScore} 0`);
  });

  it('drops the damage entirely when there is none', () => {
    const parts = eqParts(gear({ t: 'weapon', tier: 1 }), 'ru', LABELS.ru);
    expect(parts.join(' ')).not.toContain('undefined');
    expect(parts.every((p) => p.trim() !== '')).toBe(true);
  });

  it('prints damage without a type, and a type without inventing damage', () => {
    expect(eqParts(gear({ t: 'weapon', tier: 1, dmg: 'd6' }), 'ru', LABELS.ru)).toContain('d6');
    const typed = eqParts(gear({ t: 'weapon', tier: 1, dt: 'phy' }), 'ru', LABELS.ru);
    expect(typed.join(' ')).not.toContain('undefined');
  });

  it('says nothing about burden when the weapon does not carry one', () => {
    const parts = eqParts(gear({ t: 'weapon', tier: 1 }), 'ru', LABELS.ru);
    expect(parts.join(' ')).not.toContain('undefined');
  });

  it('has nothing to say about a record with no stat block', () => {
    const { eq, ...loot } = gear({ t: 'weapon', tier: 1 });
    void eq;
    expect(eqParts(loot, 'ru', LABELS.ru)).toEqual([]);
  });
});

describe('itemsWord', () => {
  it('picks the Russian form by the last digits, with the 11-14 exception', () => {
    expect(itemsWord(1, 'ru')).toBe('позиция');
    expect(itemsWord(21, 'ru')).toBe('позиция');
    expect(itemsWord(2, 'ru')).toBe('позиции');
    expect(itemsWord(4, 'ru')).toBe('позиции');
    expect(itemsWord(5, 'ru')).toBe('позиций');
    expect(itemsWord(0, 'ru')).toBe('позиций');
    expect(itemsWord(11, 'ru')).toBe('позиций');
    expect(itemsWord(14, 'ru')).toBe('позиций');
  });

  it('only ever singular or plural in English', () => {
    expect(itemsWord(1, 'en')).toBe('item');
    expect(itemsWord(0, 'en')).toBe('items');
    expect(itemsWord(2, 'en')).toBe('items');
    expect(itemsWord(11, 'en')).toBe('items');
    expect(itemsWord(21, 'en')).toBe('items');
  });
});

/**
 * `tools/build-share-pages.js` hand-copies these six maps into its own
 * Russian-only `EQ_*` constants for the share stubs (this file's own header
 * comment says so, and says nothing pins the two equal). This is that pin:
 * a CJS `require` of the generator, checked key-for-key against the `ru` half
 * of each `Pair` here. Without it, editing a word in one place and not the
 * other is a silent divergence no test catches.
 */
describe('the share-stub generator quotes the same words', () => {
  const require_ = createRequire(import.meta.url);
  const stubs = require_('../../../tools/build-share-pages.js') as {
    EQ_TYPE: Record<string, string>;
    EQ_TRAIT: Record<string, string>;
    EQ_RANGE: Record<string, string>;
    EQ_DT: Record<string, string>;
    EQ_CLS: Record<string, string>;
    EQ_BURDEN: Record<string, string>;
  };

  const ru = (map: Record<string, readonly [string, string]>): Record<string, string> =>
    Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v[0]]));

  it.each([
    ['EQ_TYPE', EQ_TYPE, stubs.EQ_TYPE],
    ['EQ_TRAIT', EQ_TRAIT, stubs.EQ_TRAIT],
    ['EQ_RANGE', EQ_RANGE, stubs.EQ_RANGE],
    ['EQ_DT', EQ_DT, stubs.EQ_DT],
    ['EQ_CLS', EQ_CLS, stubs.EQ_CLS],
    ['EQ_BURDEN', EQ_BURDEN, stubs.EQ_BURDEN]
  ] as const)('%s matches the generator word for word', (_name, dictMap, stubMap) => {
    expect(stubMap).toEqual(ru(dictMap));
  });
});
