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
import { badgeKind, srcLabel, tableOf, whereFrom } from './label.js';
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
  });

  it('names the frame, not its raw id', () => {
    expect(srcLabel(rec({ src: 'frame', frame: 'beast_feast' }), 'ru')).toBe('Пир зверей');
    expect(srcLabel(rec({ src: 'frame', frame: 'beast_feast' }), 'en')).toBe('Beast Feast');
    expect(srcLabel(rec({ src: 'frame' }), 'ru')).toBe('Фрейм');
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

describe('which table a record is printed in', () => {
  it('sends Vault of Ages to its own table, stat block or not', () => {
    /* Two dozen of its pieces carry stats but live in the Vault's table, and
       the "show in the table" link must not land in the weapons section. */
    expect(tableOf(rec({ src: 'voa', eq: { t: 'weapon', tier: 1 } }))).toBe('voa');
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

  it('places every record in the data somewhere', () => {
    for (const it of index.searchable) expect(tableOf(it), it.id).not.toBe(null);
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

  it('names the community instead of the book', () => {
    const c = rec({ src: 'community', community: 'Highborne', community_ru: 'Великородное' });
    expect(whereFrom(c, 'ru')).toBe('Великородное');
  });

  it('falls back to the source where there is no table', () => {
    expect(whereFrom(rec({ src: 'somethingnew' }), 'ru')).toBe('somethingnew');
  });

  it('says something for every record in the data', () => {
    for (const it of index.searchable) expect(whereFrom(it, 'ru'), it.id).not.toBe('');
  });
});
