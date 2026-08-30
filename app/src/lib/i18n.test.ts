/* The stat line, held to what the live app renders.
 *
 * docs/fixtures/statlines/equipment.json was captured from the old app, in both
 * languages, across every equipment kind and four sources. Tests written
 * alongside the code only prove it is self-consistent; this proves the port is
 * faithful, which is the whole point of Phase 2. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildIndex, type Loot } from './data.js';
import { descOf, eqLine, eqParts, EQ_TRAIT, eqWord, nameOf } from './i18n.js';
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
        expect(eqParts(it_ as Record_, lang, LABELS[lang], { noType: true })).toEqual(
          FIXTURE[id]?.[lang]
        );
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

  it('prints a half-filled threshold pair without inventing the other half', () => {
    const parts = eqParts(gear({ t: 'armor', tier: 1, th: '5' }), 'ru', LABELS.ru, {
      noType: true
    });
    expect(parts.join(' ')).toContain(`${LABELS.ru.thresholds} 5/`);
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
