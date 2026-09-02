/* The two sections that roll inside a chosen part of their book.
 *
 * The list of communities is derived rather than written down, so what is worth
 * testing is that the derivation keeps the book's order, tolerates a record
 * without a Russian name, and does not invent a community that has no records. */

import { describe, expect, it } from 'vitest';
import { buildIndex } from './data.js';
import { dict } from './dict.js';
import {
  VOA_SECTIONS,
  communities,
  communityGroup,
  communityName,
  voaGroup,
  voaSectionName
} from './sections.js';
import type { Loot } from './data.js';
import type { Record_ } from './types.js';

const rec = (over: Partial<Record_>): Record_ =>
  ({ id: 'x', src: 'voa', kind: 'item', en: 'X', ende: '', ru: 'Икс', rud: '', ...over });

const LOOT: Loot = {
  items: {
    voa: [
      rec({ id: 'v1', tier: 1, ru: 'Первый' }),
      rec({ id: 'va', tier: 'A', ru: 'Артефакт' }),
      rec({ id: 'vc', tier: 'C', ru: 'Проклятый' }),
      rec({ id: 'v1b', tier: 1, ru: 'Второй первого ранга' })
    ],
    community: [
      /* Loreborne first on purpose: the order is the records', not the
         alphabet's, and a test that used alphabetical order would pass on a
         broken implementation. */
      rec({ id: 'c1', src: 'community', community: 'Loreborne', community_ru: 'Научное' }),
      rec({ id: 'c2', src: 'community', community: 'Highborne', community_ru: 'Великородное' }),
      rec({ id: 'c3', src: 'community', community: 'Loreborne', community_ru: 'Научное' }),
      /* No Russian name: a record can arrive before its translation does. */
      rec({ id: 'c4', src: 'community', community: 'Wildborne' })
    ]
  },
  eq: [],
  refs: {}
};

const index = buildIndex(LOOT);
const t = dict('ru');

describe('the divisions of Vault of Ages', () => {
  it('offers four tiers and the two categories, in the book’s order', () => {
    expect([...VOA_SECTIONS]).toEqual([1, 2, 3, 4, 'A', 'C']);
  });

  it('names a tier with its number and the other two with their own words', () => {
    expect(voaSectionName(2, t)).toBe('Ранг 2');
    expect(voaSectionName('A', t)).toBe('Артефакты');
    expect(voaSectionName('C', t)).toBe('Проклятые предметы');
  });

  it('groups by tier, keeping the order the book prints', () => {
    expect(voaGroup(index, 1).map((x) => x.id)).toEqual(['v1', 'v1b']);
    expect(voaGroup(index, 'A').map((x) => x.id)).toEqual(['va']);
  });

  it('returns nothing for a division with no records rather than throwing', () => {
    expect(voaGroup(index, 3)).toEqual([]);
  });
});

describe('the communities', () => {
  it('comes from the records, in first-appearance order', () => {
    expect(communities(index).map((c) => c.id)).toEqual(['Loreborne', 'Highborne', 'Wildborne']);
  });

  it('falls back to the English name where there is no Russian one', () => {
    const wild = communities(index).find((c) => c.id === 'Wildborne');
    expect(communityName(wild!, 'ru')).toBe('Wildborne');
    expect(communityName(wild!, 'en')).toBe('Wildborne');
  });

  it('gives each language its own name', () => {
    const lore = communities(index)[0]!;
    expect(communityName(lore, 'ru')).toBe('Научное');
    expect(communityName(lore, 'en')).toBe('Loreborne');
  });

  it('rolls over one community at a time', () => {
    expect(communityGroup(index, 'Loreborne').map((x) => x.id)).toEqual(['c1', 'c3']);
  });
});
