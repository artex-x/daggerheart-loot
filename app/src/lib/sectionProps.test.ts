import { describe, expect, it } from 'vitest';
import { SECTION_PROP, VOLUME_ORDER, sectionLeaf, volumeName } from './sectionProps.js';
import type { Record_ } from './types.js';

const rec = (over: Partial<Record_>): Record_ => ({
  id: 'x1',
  src: 'core',
  kind: 'item',
  en: 'X',
  ende: '',
  ru: 'Х',
  rud: '',
  ...over
});

describe('the sectioned tables', () => {
  it('names every volume with its number', () => {
    expect(VOLUME_ORDER).toEqual([1, 2, 3]);
    expect(volumeName(2, 'ru')).toBe('Том 2');
    expect(volumeName(3, 'en')).toBe('Volume 3');
  });

  it('sections Many Worlds Tavern by realm and Pistolheart by volume, and nothing else', () => {
    expect(Object.keys(SECTION_PROP)).toEqual(['mwt', 'ph']);
    expect(SECTION_PROP.mwt?.group).toBe('realm');
    expect(SECTION_PROP.mwt?.chip).toBeUndefined();
    expect(SECTION_PROP.ph?.order).toEqual(['1', '2', '3']);
    expect(SECTION_PROP.ph?.chip?.('2')).toBe('2');
    expect(SECTION_PROP.ph?.valueOf(rec({ src: 'ph' }))).toBe('');
    expect(SECTION_PROP.mwt?.valueOf(rec({ src: 'mwt' }))).toBe('');
    expect(SECTION_PROP.mwt?.name('nowhere', 'en')).toBe('nowhere');
    expect(sectionLeaf(rec({ src: 'core' }), 'en')).toBe('');
  });

  it('gives the section leaf of a sectioned record only', () => {
    expect(sectionLeaf(rec({ src: 'ph', vol: 2 }), 'ru')).toBe('Том 2');
    expect(sectionLeaf(rec({ src: 'mwt', realm: 'drome' }), 'en')).toBe('The Drome');
    expect(sectionLeaf(rec({ src: 'vh' }), 'en')).toBe('');
    expect(sectionLeaf(rec({ src: 'lr' }), 'en')).toBe('');
    expect(sectionLeaf(rec({ src: 'ph' }), 'en')).toBe('');
  });
});
