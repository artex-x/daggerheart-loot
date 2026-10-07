/* The words a badge and the line under a heading carry.
 *
 * Held against the real data rather than invented records where it can be:
 * every source in the catalogue has to produce a label, and every record has to
 * land in a table, because a record that lands nowhere loses its "show in the
 * table" link and nobody notices until somebody looks for it. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildIndex, type Loot } from './data.js';
import { recordOf, type BookRef } from './homebrew.js';
import {
  FOLD_OWN,
  badgeKind,
  foldOwn,
  printSrc,
  relName,
  relOrder,
  relText,
  srcLabel,
  srcName,
  tableOf,
  whereFrom
} from './label.js';
import type { Record_ } from './types.js';

const LOOT = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
) as Loot;
const index = buildIndex(LOOT);

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

describe('which colour the chip takes', () => {
  it('is one of two, and equipment counts as a thing you have', () => {
    expect(badgeKind(rec({ kind: 'item' }))).toBe('item');
    expect(badgeKind(rec({ kind: 'consumable' }))).toBe('cons');
    expect(badgeKind(rec({ kind: 'equip' }))).toBe('item');
  });
});

describe('the book a record comes from', () => {
  it('names each book', () => {
    expect(srcLabel(rec({ src: 'core' }), 'ru')).toBe('Core');
    expect(srcLabel(rec({ src: 'hnf' }), 'ru')).toBe('Hope & Fear');
    expect(srcLabel(rec({ src: 'wondrous' }), 'ru')).toBe('Wondrous');
    expect(srcLabel(rec({ src: 'dread' }), 'ru')).toBe('Dread');
    expect(srcLabel(rec({ src: 'voa' }), 'ru')).toBe('Vault of Ages');
    expect(srcLabel(rec({ src: 'dv' }), 'ru')).toBe("Dragon's Vault");
    expect(srcLabel(rec({ src: 'arazo' }), 'ru')).toBe("Arazo's Artifacts");
  });

  it('names the frame, not its raw id', () => {
    expect(srcLabel(rec({ src: 'frame', frame: 'beast_feast' }), 'ru')).toBe('Пир зверей');
    expect(srcLabel(rec({ src: 'frame', frame: 'beast_feast' }), 'en')).toBe('Beast Feast');
    expect(srcLabel(rec({ src: 'frame' }), 'ru')).toBe('Сеттинг');
  });

  it('names the community, in the language on screen', () => {
    /* Beside other communities the book is obvious; the community is the thing
       that tells them apart. */
    const c = rec({ src: 'community', community: 'Highborne', community_ru: 'Великородное' });
    expect(srcLabel(c, 'ru')).toBe('Великородное');
    expect(srcLabel(c, 'en')).toBe('Highborne');
    expect(srcLabel(rec({ src: 'community' }), 'ru')).toBe('Сообщества');
  });

  it('falls back to the raw source rather than to nothing', () => {
    expect(srcLabel(rec({ src: 'somethingnew' }), 'ru')).toBe('somethingnew');
  });

  it('has something to say about every record in the data', () => {
    for (const it of index.searchable) {
      expect(srcLabel(it, 'ru'), it.id).not.toBe('');
      expect(srcLabel(it, 'en'), it.id).not.toBe('');
    }
  });
});

describe("the print card's source line", () => {
  it('names only the book for a shelved record', () => {
    expect(printSrc(rec({ src: 'core' }), 'ru')).toBe('Core');
  });

  it('names the community and then the book, because the card leaves the table', () => {
    const c = rec({ src: 'community', community: 'Highborne', community_ru: 'Великородное' });
    expect(printSrc(c, 'ru')).toBe('Сообщества · Великородное');
    expect(printSrc(c, 'en')).toBe('Communities · Highborne');
  });

  it('names only the frame for a campaign-frame record (D11, paid off)', () => {
    /* Used to print the full path (`Снаряжение · Сеттинги · <frame>`), the
       same special case the stat line's tier word got - both dropped
       together once the owner settled on treating frame equipment like any
       other equipment. */
    const f = rec({ src: 'frame', frame: 'beast_feast' });
    expect(printSrc(f, 'ru')).toBe('Пир зверей');
    expect(printSrc(f, 'en')).toBe('Beast Feast');
  });
});

describe('naming a source key with no record behind it', () => {
  it('names each book', () => {
    expect(srcName('core', 'ru')).toBe('Core');
    expect(srcName('hnf', 'ru')).toBe('Hope & Fear');
    expect(srcName('wondrous', 'ru')).toBe('Wondrous');
    expect(srcName('dread', 'ru')).toBe('Dread');
    expect(srcName('voa', 'ru')).toBe('Vault of Ages');
    expect(srcName('dv', 'ru')).toBe("Dragon's Vault");
    expect(srcName('arazo', 'en')).toBe("Arazo's Artifacts");
  });

  it('falls through to a frame name', () => {
    expect(srcName('beast_feast', 'ru')).toBe('Пир зверей');
    expect(srcName('beast_feast', 'en')).toBe('Beast Feast');
  });

  it('falls back to the key itself for anything else', () => {
    expect(srcName('somethingnew', 'ru')).toBe('somethingnew');
  });
});

describe('which table a record is printed in', () => {
  it('sends Vault of Ages to its own table, stat block or not', () => {
    /* Two dozen of its pieces carry stats but live in the Vault's table, and
       the "show in the table" link must not land in the weapons section. */
    expect(tableOf(rec({ src: 'voa', eq: { t: 'weapon', tier: 1 } }))).toBe('voa');
  });

  it('sends roll-less campaign-frame equipment to its own table', () => {
    expect(tableOf(rec({ src: 'frame', eq: { t: 'weapon', tier: 1 } }))).toBe('other_frames');
  });

  it('sends equipment to the table for its kind', () => {
    expect(tableOf(rec({ src: 'core', eq: { t: 'weapon', tier: 1 } }))).toBe('eq_weapon');
    expect(tableOf(rec({ src: 'core', eq: { t: 'secondary', tier: 1 } }))).toBe('eq_secondary');
    expect(tableOf(rec({ src: 'core', eq: { t: 'armor', tier: 1 } }))).toBe('eq_armor');
  });

  it('leaves a piece with a roll number in its roll table', () => {
    /* Eleven Wondrous records carry a stat block and a place in the roll
       table; the roll number is what says which one they belong to. */
    expect(tableOf(rec({ src: 'wondrous', roll: 4, eq: { t: 'weapon', tier: 1 } }))).toBe(
      'wondrous'
    );
  });

  it('splits the two books by kind', () => {
    expect(tableOf(rec({ src: 'core', kind: 'item' }))).toBe('core_item');
    expect(tableOf(rec({ src: 'core', kind: 'consumable' }))).toBe('core_consumable');
    expect(tableOf(rec({ src: 'hnf', kind: 'item' }))).toBe('hnf_item');
    expect(tableOf(rec({ src: 'hnf', kind: 'consumable' }))).toBe('hnf_consumable');
  });

  it("sends Dragon's Vault loot and equipment to its own table", () => {
    expect(tableOf(rec({ src: 'dv', kind: 'item' }))).toBe('dv');
    /* The equipment rolls on the book's table, so the roll number wins. */
    expect(tableOf(index.byId.get('dve1') as Record_)).toBe('dv');
  });

  it("sends Arazo's Artifacts items, rungs and artifacts to its own table", () => {
    expect(tableOf(index.byId.get('aa3') as Record_)).toBe('arazo');
    expect(tableOf(index.byId.get('aa8') as Record_)).toBe('arazo');
    expect(tableOf(index.byId.get('aa1') as Record_)).toBe('arazo');
  });

  it('places every record in the data somewhere', () => {
    for (const it of index.searchable) {
      expect(tableOf(it), it.id).not.toBe(null);
    }
  });

  it('has nowhere to send a source it does not know', () => {
    expect(tableOf(rec({ src: 'somethingnew' }))).toBe(null);
  });
});

describe('the line under the heading', () => {
  it('names the book and then the section inside it', () => {
    /* "Core - предметы" under a heading that already says Core would print the
       book twice, so the group and the sub are the two halves. */
    expect(whereFrom(rec({ src: 'core', kind: 'item' }), 'ru')).toBe('Core · Предметы');
    expect(whereFrom(rec({ src: 'hnf', kind: 'consumable' }), 'en')).toBe(
      'Hope & Fear · Consumables'
    );
  });

  it('gives a one-table book no second half', () => {
    expect(whereFrom(rec({ src: 'wondrous' }), 'ru')).toBe('Wondrous Loot');
    expect(whereFrom(rec({ src: 'dread' }), 'en')).toBe('Dread GM Toolbox');
  });

  it('names the equipment slice, whichever piece (the last un-pinned group)', () => {
    expect(whereFrom(rec({ src: 'core', eq: { t: 'weapon', tier: 1 } }), 'ru')).toBe(
      'Снаряжение · Оружие'
    );
    expect(whereFrom(rec({ src: 'hnf', eq: { t: 'armor', tier: 1 } }), 'en')).toBe(
      'Equipment · Armor'
    );
  });

  it('uses the concise Other breadcrumb for starters and settings', () => {
    expect(whereFrom(rec({ starting: true }), 'ru')).toBe('Прочее · Стартовые');
    expect(whereFrom(rec({ starting: true }), 'en')).toBe('Other · Starting');
    const frame = rec({ src: 'frame', frame: 'beast_feast' });
    expect(whereFrom(frame, 'ru')).toBe('Прочее · Сеттинги · Пир зверей');
    expect(whereFrom(frame, 'en')).toBe('Other · Frames · Beast Feast');
  });

  it('completes the path with the community, the leaf it is sectioned by', () => {
    const c = rec({ src: 'community', community: 'Highborne', community_ru: 'Великородное' });
    expect(whereFrom(c, 'ru')).toBe('Сообщества · Великородное');
    expect(whereFrom(c, 'en')).toBe('Communities · Highborne');
  });

  it('falls back to the source where there is no table', () => {
    expect(whereFrom(rec({ src: 'somethingnew' }), 'ru')).toBe('somethingnew');
  });

  it('says something for every record in the data', () => {
    for (const it of index.searchable) expect(whereFrom(it, 'ru'), it.id).not.toBe('');
  });
});

describe('a tag and a path, pinned apart', () => {
  /* One record of each shape the rule names, real data rather than invented
     records: `srcLabel` (the badge tag) and `whereFrom` (the record-page path)
     asserted side by side, so the two abstractions are pinned apart rather
     than one being derived from the other. */
  const shapes = ['ci61', 'hi61', 'f1', 'f95', 'cm1', 'voa2_a1'];

  it('never puts a path in a tag', () => {
    for (const id of shapes) {
      const it = index.byId.get(id);
      expect(it, id).toBeDefined();
      if (!it) continue;
      expect(srcLabel(it, 'ru')).not.toContain(' · ');
      expect(srcLabel(it, 'en')).not.toContain(' · ');
    }
  });

  it('pins the exact tag for each shape', () => {
    const byId = (id: string) => index.byId.get(id)!;
    expect(srcLabel(byId('ci61'), 'en')).toBe('Core');
    expect(srcLabel(byId('hi61'), 'en')).toBe('Hope & Fear');
    expect(srcLabel(byId('f1'), 'ru')).toBe('Пир зверей');
    expect(srcLabel(byId('f1'), 'en')).toBe('Beast Feast');
    expect(srcLabel(byId('f95'), 'ru')).toBe('Материнская Плата');
    expect(srcLabel(byId('f95'), 'en')).toBe('Motherboard');
    expect(srcLabel(byId('cm1'), 'ru')).toBe('Великородное');
    expect(srcLabel(byId('cm1'), 'en')).toBe('Highborne');
    expect(srcLabel(byId('voa2_a1'), 'en')).toBe('Vault of Ages');
  });

  it('pins the exact path for each shape', () => {
    const byId = (id: string) => index.byId.get(id)!;
    expect(whereFrom(byId('ci61'), 'ru')).toBe('Прочее · Стартовые');
    expect(whereFrom(byId('hi61'), 'en')).toBe('Other · Starting');
    expect(whereFrom(byId('f1'), 'ru')).toBe('Прочее · Сеттинги · Пир зверей');
    expect(whereFrom(byId('f95'), 'ru')).toBe('Прочее · Сеттинги · Материнская Плата');
    expect(whereFrom(byId('cm1'), 'ru')).toBe('Сообщества · Великородное');
    expect(whereFrom(byId('cm1'), 'en')).toBe('Communities · Highborne');
    expect(whereFrom(byId('voa2_a1'), 'en')).toBe('Vault of Ages');
  });
});

describe('a homebrew item', () => {
  const alder: BookRef = {
    key: 'hb_alderworkshopaaa',
    ru: 'Мастерская Ольхи',
    en: 'Alder Workshop',
    sections: [{ key: 'hb_sectbladesaaaaaa', ru: 'Холодное оружие', en: 'Blades' }]
  };
  const plain = recordOf('hb_engravedringaaaa', { kind: 'item', ru: 'Кольцо' }, null);
  const inSource = recordOf('hb_capaaaaaaaaaaaaa', { kind: 'item', en: 'Cap' }, alder);
  const inSection = recordOf(
    'hb_emberaxeaaaaaaaa',
    { kind: 'item', ru: 'Топор', section: 'hb_sectbladesaaaaaa' },
    alder
  );
  const englishSource = recordOf(
    'hb_whispercapaaaaaa',
    { kind: 'item', en: 'Cap' },
    { key: 'hb_englishbookaaaaa', en: 'Tinker Guild' }
  );

  it('tags the default source by its word and a named one with the Latin mark', () => {
    expect(srcLabel(plain, 'ru')).toBe('Хоумбрю');
    expect(srcLabel(plain, 'en')).toBe('Homebrew');
    expect(srcLabel(inSource, 'ru')).toBe('Мастерская Ольхи (HB)');
    expect(srcLabel(inSource, 'en')).toBe('Alder Workshop (HB)');
    expect(srcLabel(englishSource, 'ru')).toBe('Tinker Guild (HB)');
  });

  it('walks the path from the group through the source to the section', () => {
    expect(whereFrom(plain, 'ru')).toBe('Хоумбрю');
    expect(whereFrom(inSource, 'en')).toBe('Homebrew · Alder Workshop');
    expect(whereFrom(inSection, 'ru')).toBe('Хоумбрю · Мастерская Ольхи · Холодное оружие');
    expect(whereFrom(englishSource, 'ru')).toBe('Хоумбрю · Tinker Guild');
  });

  it('prints the path on a card and has the homebrew table', () => {
    expect(printSrc(inSection, 'en')).toBe('Homebrew · Alder Workshop · Blades');
    expect(tableOf(inSection)).toBe('homebrew');
    expect(
      tableOf(
        recordOf(
          'hb_aaaaaaaaaaaaaaaa',
          { kind: 'equip', ru: 'Щит', eq: { t: 'armor', tier: 1, as: 1, th: [1, 2] } },
          null
        )
      )
    ).toBe('homebrew');
  });
});

describe('a relation of a catalog record to homebrew records', () => {
  const own = (id: string, ru: string, en: string): Record_ =>
    rec({ id, src: 'homebrew', ru, en });
  const ownN = (n: number): Record_[] =>
    Array.from({ length: n }, (_, i) =>
      own(`hb_${String(i)}`, `Свой ${String(i)}`, `Own ${String(i)}`)
    );
  const cat = (id: string): Record_ => {
    const r = index.byId.get(id);
    if (!r) throw new Error(`The catalog lacks ${id}. Pick an id that data.json holds`);
    return r;
  };

  it('marks a homebrew name with (HB) in both languages and leaves a catalog name as it is', () => {
    const hb = own('hb_a', 'Мешок', 'Sack');
    expect(relName(hb, 'ru')).toBe('Мешок (HB)');
    expect(relName(hb, 'en')).toBe('Sack (HB)');
    expect(relName(cat('ci1'), 'ru')).toBe(cat('ci1').ru);
    expect(relName(cat('ci1'), 'en')).toBe(cat('ci1').en);
  });

  it('keeps a name that holds a replacement pattern', () => {
    expect(relName(own('hb_a', 'Мешок $& и $1', 'Sack $&'), 'ru')).toBe('Мешок $& и $1 (HB)');
    expect(relName(own('hb_a', 'Мешок', "Sack $'"), 'en')).toBe("Sack $' (HB)");
  });

  it('puts the catalog records first in their order, then the homebrew ones by name in the language on screen', () => {
    const b = own('hb_b', 'Альфа', 'Zulu');
    const a = own('hb_a', 'Яшма', 'Alpha');
    const list = [b, cat('q2'), a, cat('q1')];
    expect(relOrder(list, 'ru').map((r) => r.id)).toEqual(['q2', 'q1', 'hb_b', 'hb_a']);
    expect(relOrder(list, 'en').map((r) => r.id)).toEqual(['q2', 'q1', 'hb_a', 'hb_b']);
  });

  it('keeps every catalog record, the record itself and three homebrew records, and counts the rest', () => {
    for (const n of [0, 3, 15, 100, 1000]) {
      const list = [cat('q1'), ...ownN(n), cat('q2')];
      const { shown, more } = foldOwn(list, FOLD_OWN);
      expect(shown.map((r) => r.id)).toEqual([
        'q1',
        ...ownN(Math.min(n, 3)).map((r) => r.id),
        'q2'
      ]);
      expect(more).toBe(Math.max(0, n - 3));
    }
    const list = [cat('q1'), ...ownN(15)];
    const { shown, more } = foldOwn(list, FOLD_OWN, 'hb_4');
    expect(shown.map((r) => r.id)).toEqual(['q1', 'hb_0', 'hb_1', 'hb_2', 'hb_4']);
    expect(more).toBe(11);
  });

  it('writes a folded relation as text with «и ещё N» and "and N more"', () => {
    const list = [
      own('hb_b', 'Б', 'B'),
      cat('ci1'),
      own('hb_a', 'А', 'A'),
      own('hb_c', 'В', 'C')
    ];
    expect(relText(list, 'ru', 1)).toBe(`${cat('ci1').ru}, А (HB) и ещё 2`);
    expect(relText(list, 'en', 1)).toBe(`${cat('ci1').en}, A (HB) and 2 more`);
    expect(relText(list, 'en', FOLD_OWN)).toBe(`${cat('ci1').en}, A (HB), B (HB), C (HB)`);
    expect(relText([cat('ci1')], 'ru', 1)).toBe(cat('ci1').ru);
  });
});
