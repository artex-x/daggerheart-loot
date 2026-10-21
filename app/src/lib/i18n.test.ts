/* The stat line, held to what the live app renders.
 *
 * docs/fixtures/statlines/equipment.json was captured from the old app, in both
 * languages, across every equipment kind and four sources. Tests written
 * alongside the code only prove it is self-consistent; this proves the port is
 * faithful, which is the whole point of Phase 2.
 *
 * One entry is not a capture any more: `f7` (a frame record) holds the tier
 * word by deliberate post-migration divergence from the old app, per D11/Q6
 * ("print the tier on frame equipment"). Do not "fix" it back to match a
 * fresh capture. */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildIndex, equipOfKind, otherTableRows, type Loot } from './data.js';
import { dict } from './dict.js';
import { EQ_TABLE, decodeFilter, groupsFor } from './filters.js';
import { whereFrom } from './label.js';
import type { Rarity } from './money.js';
import { communities, communityGroup, realmGroup } from './sections.js';
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
  fewNames,
  selCountText,
  nameOf,
  type StatLabels
} from './i18n.js';
import { FRAME_ORDER, frameName } from './frames.js';
import { REALM_ORDER, realmName } from './realms.js';
import { TABLE_IDS, type Lang, type Record_, type TableId } from './types.js';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const LOOT = JSON.parse(readFileSync(join(ROOT, 'data.json'), 'utf8')) as Loot;
const index = buildIndex(LOOT);

const FIXTURE = JSON.parse(
  readFileSync(join(ROOT, 'docs', 'fixtures', 'statlines', 'equipment.json'), 'utf8')
) as Record<string, Record<Lang, string[]>>;

/* The words the stat line needs that are not in the vocabulary maps.
   They live in the interface dictionary, so the caller supplies them. */
const LABELS: Record<Lang, StatLabels> = {
  ru: { tier: 'Ранг', thresholds: 'Пороги', armorScore: 'Броня', artifact: 'Артефакт' },
  en: { tier: 'Tier', thresholds: 'Thresholds', armorScore: 'Armor', artifact: 'Artifact' }
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
        expect(eqParts(record, lang, LABELS[lang], { noType: true })).toEqual(
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

  it('can omit a tier from a direct frame-record stat line', () => {
    const frame = index.byId.get('f1') as Record_;
    expect(eqLine(frame, 'ru', LABELS.ru, { noType: true, noTier: true })).not.toContain(
      'Ранг'
    );
  });

  it('always carry a tier, because every piece has one from a book', () => {
    /* An artifact's section is its tier word (Oath of Balance, voa4_a3). */
    for (const eq of index.allEquip) {
      const want = eq.eq?.tier === 'A' ? 'Артефакт' : 'Ранг';
      expect(eqParts(eq, 'ru', LABELS.ru).some((p) => p.startsWith(want))).toBe(true);
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

  it('print the class of a secondary weapon before its trait', () => {
    const scalpel = index.byId.get('w7') as Record_;
    expect(scalpel.eq?.t).toBe('secondary');
    const parts = eqParts(scalpel, 'ru', LABELS.ru);
    expect(parts.indexOf('Магическое')).toBe(parts.indexOf('Искусность') - 1);
    expect(eqLine(scalpel, 'en', LABELS.en)).toContain('Magic · Finesse');
  });

  it('give armour thresholds and a score instead of trait and range', () => {
    const armour = index.byId.get('q337') as Record_;
    const parts = eqParts(armour, 'ru', LABELS.ru, { noType: true });
    expect(parts.some((p) => p.startsWith('Пороги'))).toBe(true);
    expect(parts.some((p) => p.startsWith('Броня'))).toBe(true);
    expect(parts).not.toContain('Вплотную');
  });

  it("name a Spellcast weapon's trait with the site's term", () => {
    const spellblade = index.byId.get('dve50') as Record_;
    expect(eqLine(spellblade, 'ru', LABELS.ru)).toContain(
      'Характеристика Заклинателя · Вплотную · d10+4 маг'
    );
    expect(eqLine(spellblade, 'en', LABELS.en)).toContain('Spellcast · Melee · d10+4 mag');
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

  it('names an artifact weapon in place of its tier, in both languages', () => {
    const weapon = gear({ t: 'weapon', tier: 'A', cls: 'phy', tr: 'strength', dmg: 'd10+6' });
    const ru = eqLine(weapon, 'ru', LABELS.ru);
    const en = eqLine(weapon, 'en', LABELS.en);
    expect(ru).toContain(' · Артефакт · ');
    expect(en).toContain(' · Artifact · ');
    expect(ru).not.toContain('Ранг');
    expect(en).not.toContain('Tier');
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

describe('selCountText', () => {
  it('agrees the verb and the noun with the entries and adds the pieces only when they differ', () => {
    const ru = dict('ru');
    expect(selCountText(1, 1, 'ru', ru)).toBe('Выбрана 1 позиция');
    expect(selCountText(2, 2, 'ru', ru)).toBe('Выбрано 2 позиции');
    expect(selCountText(4, 9, 'ru', ru)).toBe('Выбрано 4 позиции · 9 шт.');
    expect(selCountText(5, 7, 'ru', ru)).toBe('Выбрано 5 позиций · 7 шт.');
    expect(selCountText(11, 11, 'ru', ru)).toBe('Выбрано 11 позиций');
    expect(selCountText(21, 30, 'ru', ru)).toBe('Выбрана 21 позиция · 30 шт.');
  });

  it('reads the same shape in English', () => {
    const en = dict('en');
    expect(selCountText(1, 1, 'en', en)).toBe('Selected 1 item');
    expect(selCountText(1, 3, 'en', en)).toBe('Selected 1 item · 3 pcs');
    expect(selCountText(4, 9, 'en', en)).toBe('Selected 4 items · 9 pcs');
    expect(selCountText(21, 21, 'en', en)).toBe('Selected 21 items');
  });
});

describe('fewNames', () => {
  const ru = dict('ru');
  const names = ['«А»', '«Б»', '«В»', '«Г»', '«Д»', '«Е»', '«Ж»'];

  it('joins up to five names', () => {
    expect(fewNames(names.slice(0, 3), ru)).toBe('«А», «Б», «В»');
    expect(fewNames(names.slice(0, 5), ru)).toBe('«А», «Б», «В», «Г», «Д»');
  });

  it('counts the names past five', () => {
    expect(fewNames(names, ru)).toBe('«А», «Б», «В», «Г», «Д» и ещё 2');
    expect(fewNames(names, dict('en'))).toBe('«А», «Б», «В», «Г», «Д» and 2 more');
  });

  it('counts the names not given', () => {
    expect(fewNames(names.slice(0, 5), ru, 4)).toBe('«А», «Б», «В», «Г», «Д» и ещё 4');
  });
});

describe('llms.txt', () => {
  it("names the interface's own labels, Russian and English", () => {
    const llms = readFileSync(join(ROOT, 'llms.txt'), 'utf8').replace(/\s+/g, ' ');
    const ru = dict('ru');
    const en = dict('en');
    for (const key of ['importOpen', 'newList', 'exportJson', 'exportData'] as const) {
      expect(llms).toContain(`«${ru[key]}» ("${en[key]}")`);
    }
  });
});

/**
 * `tools/share-card.mjs` hand-copies these six maps and the frame names
 * into its own `[ru, en]` tables for the share stubs in both languages. This
 * is the pin: a CJS `require` of the generator, which re-exports them, checked pair for pair against
 * this file and `frames.ts`. Without it, editing a word in one place and not
 * the other is a silent divergence no test catches.
 */
describe('the share-stub generator quotes the same words', () => {
  const require_ = createRequire(import.meta.url);
  type Pairs = Record<string, readonly [string, string]>;
  const stubs = require_('../../../tools/build-share-pages.js') as {
    EQ_TYPE: Pairs;
    EQ_TRAIT: Pairs;
    EQ_RANGE: Pairs;
    EQ_DT: Pairs;
    EQ_CLS: Pairs;
    EQ_BURDEN: Pairs;
    FRAME_LABEL: Pairs;
  };

  it.each([
    ['EQ_TYPE', EQ_TYPE, stubs.EQ_TYPE],
    ['EQ_TRAIT', EQ_TRAIT, stubs.EQ_TRAIT],
    ['EQ_RANGE', EQ_RANGE, stubs.EQ_RANGE],
    ['EQ_DT', EQ_DT, stubs.EQ_DT],
    ['EQ_CLS', EQ_CLS, stubs.EQ_CLS],
    ['EQ_BURDEN', EQ_BURDEN, stubs.EQ_BURDEN]
  ] as const)(
    '%s matches the generator word for word in both languages',
    (_name, dictMap, stubMap) => {
      expect(stubMap).toEqual(dictMap);
    }
  );

  it('names every frame as frames.ts does, in both languages', () => {
    const want = Object.fromEntries(
      FRAME_ORDER.map((id) => [id, [frameName(id, 'ru'), frameName(id, 'en')]])
    );
    expect(stubs.FRAME_LABEL).toEqual(want);
  });
});

/**
 * `tools/share-card.mjs` draws the preview host's cards too (`preview/worker.mjs`):
 * the homebrew item, shared list, print set and table cards. Its words, its path line
 * and its filter reader are copies of the app's; `tools/derived.js` writes the table
 * counts into `names.json` by the app's own rules. These cases hold each copy equal.
 */
describe('the preview card quotes the app', () => {
  const require_ = createRequire(import.meta.url);
  type Words = Record<string, string>;
  const share = require_('../../../tools/share-card.mjs') as {
    TEXT: Record<Lang, Words>;
    PATH_TEXT: Record<Lang, Words>;
    homebrewSubtitle: (it: Record_, lang: Lang) => string;
    decodeFilter: (segment: string, groups: readonly string[]) => Record<string, string[]>;
    LABEL_GROUPS: Record<string, readonly string[]>;
    REALM_LABEL: Record<string, readonly [string, string]>;
  };
  const derived = require_('../../../tools/derived.js') as {
    namesJson: (l: Loot) => string;
  };
  const WORDS = [
    'srcHomebrew',
    'hbTag',
    'notFound',
    'notFoundSub',
    'andMore',
    'itemsN',
    'untitled',
    'shareLinkGm',
    'shareGone',
    'shareGoneSub',
    'printTitle',
    'signInToPrint',
    'printSetGone',
    'communityLabel',
    'commF',
    'frameF',
    'realmF'
  ] as const;

  it.each(['ru', 'en'] as const)('copies the words of dict.ts (%s)', (lang) => {
    const t = dict(lang);
    for (const key of WORDS) expect(share.TEXT[lang][key], key).toBe(t[key]);
    expect(share.PATH_TEXT[lang]['alt']).toBe(t.alt);
    expect(share.PATH_TEXT[lang]['mwt']).toBe(t.mwt);
  });

  it('names every realm as realms.ts does, in both languages', () => {
    const want = Object.fromEntries(
      REALM_ORDER.map((id) => [id, [realmName(id, 'ru'), realmName(id, 'en')]])
    );
    expect(share.REALM_LABEL).toEqual(want);
  });

  it.each(['ru', 'en'] as const)(
    'draws a homebrew path line as whereFrom and eqLine do (%s)',
    (lang) => {
      const t = dict(lang);
      const labels: StatLabels = {
        tier: t.tier,
        thresholds: t.eqTh,
        armorScore: t.eqScore,
        artifact: t.voaArtifact1
      };
      const book = { key: 'hb_aaaaaaaaaaaaaaaa', en: 'Alder Workshop', ru: 'Мастерская Ольхи' };
      const section = { key: 'hb_bbbbbbbbbbbbbbbb', en: 'Blades', ru: 'Клинки' };
      const records = [
        {
          id: 'hb_cccccccccccccccc',
          src: 'homebrew',
          kind: 'item',
          en: 'A',
          ru: 'А',
          ende: '',
          rud: ''
        },
        {
          id: 'hb_dddddddddddddddd',
          src: 'homebrew',
          kind: 'equip',
          en: 'B',
          ru: 'Б',
          ende: '',
          rud: '',
          book: { ...book, section },
          eq: {
            t: 'weapon',
            tier: 2,
            cls: 'phy',
            tr: 'agility',
            rg: 'melee',
            dmg: 'd8+2',
            dt: 'phy',
            bu: 1
          }
        },
        {
          id: 'hb_eeeeeeeeeeeeeeee',
          src: 'homebrew',
          kind: 'equip',
          tier: 'A',
          en: 'C',
          ru: 'В',
          ende: '',
          rud: '',
          book,
          eq: { t: 'armor', tier: 'A', th: [9, 20], as: 5 }
        }
      ] as unknown as Record_[];
      for (const it of records) {
        const want = [whereFrom(it, lang), it.eq ? eqLine(it, lang, labels) : '']
          .filter(Boolean)
          .join(' · ');
        expect(share.homebrewSubtitle(it, lang)).toBe(want);
      }
    }
  );

  it('reads a filter as decodeFilter does on the three labelled tables', () => {
    const cases: [TableId, string][] = [
      ['community', 'f_comm-Loreborne-Orderborne'],
      ['community', 'f_comm-Highborne-Highborne'],
      ['community', 'f_'],
      ['other_frames', 'f_frame-beast_feast-colossus'],
      ['other_frames', 'f_kind-armor.frame-colossus'],
      ['other_frames', 'f_kind-armor_frame-colossus'],
      ['other_frames', 'f_frame-beast_feast'],
      ['other_frames', 'tail'],
      ['mwt', 'f_realm-warrens'],
      ['mwt', 'f_kind-equip.realm-sporopolis-godsvale'],
      ['mwt', 'f_kind-item_realm-wagerwood']
    ];
    for (const [table, segment] of cases) {
      expect(share.LABEL_GROUPS[table]).toEqual(groupsFor(table));
      expect(share.decodeFilter(segment, groupsFor(table)), segment).toEqual(
        decodeFilter(segment, groupsFor(table))
      );
    }
  });

  it('writes the counts the signed-out tables page draws into names.json', () => {
    const names = JSON.parse(derived.namesJson(LOOT)) as {
      tables: Record<string, { n: number }>;
      communities: Record<string, { ru: string; n: number }>;
      frames: Record<string, { n: number }>;
      realms: Record<string, { n: number }>;
    };
    const altCount = (kind: 'item' | 'consumable'): number =>
      (Object.keys(LOOT.alt?.[kind] ?? {}) as Rarity[]).reduce(
        (sum, r) =>
          sum +
          index.altColumn(kind, r, 'hope').length +
          index.altColumn(kind, r, 'fear').length,
        0
      );
    const want: Record<string, number> = {};
    for (const t of TABLE_IDS) {
      if (t === 'homebrew') continue;
      if (t === 'other_starting' || t === 'other_frames')
        want[t] = otherTableRows(index, t).length;
      else if (t === 'alt_item') want[t] = altCount('item');
      else if (t === 'alt_consumable') want[t] = altCount('consumable');
      else if (EQ_TABLE[t]) want[t] = equipOfKind(index, EQ_TABLE[t]).length;
      else want[t] = index.rows.get(t)?.length ?? -1;
    }
    expect(Object.keys(want)).toHaveLength(18);
    expect(Object.fromEntries(Object.entries(names.tables).map(([k, v]) => [k, v.n]))).toEqual(
      want
    );
    expect(names.communities).toEqual(
      Object.fromEntries(
        communities(index).map((c) => [
          c.id,
          { ru: c.ru, n: communityGroup(index, c.id).length }
        ])
      )
    );
    const frameRows = otherTableRows(index, 'other_frames');
    expect(names.frames).toEqual(
      Object.fromEntries(
        FRAME_ORDER.map((f) => [f, { n: frameRows.filter((x) => x.frame === f).length }])
      )
    );
    expect(names.realms).toEqual(
      Object.fromEntries(REALM_ORDER.map((r) => [r, { n: realmGroup(index, r).length }]))
    );
  });
});
