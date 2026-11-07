import { describe, expect, it } from 'vitest';
import { ROOM_ORDER, roomName } from './rooms.js';
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
  it('names every room in both languages, in the adventure order', () => {
    expect(ROOM_ORDER).toEqual(['basement', 'dressing', 'laboratory', 'library']);
    expect(ROOM_ORDER.map((id) => roomName(id, 'ru'))).toEqual([
      'Подвал',
      'Гардеробная',
      'Лаборатория',
      'Библиотека'
    ]);
    expect(roomName('dressing', 'en')).toBe('The Dressing Room');
    expect(roomName('attic', 'en')).toBe('attic');
  });

  it('names every volume with its number', () => {
    expect(VOLUME_ORDER).toEqual([1, 2, 3]);
    expect(volumeName(2, 'ru')).toBe('Том 2');
    expect(volumeName(3, 'en')).toBe('Volume 3');
  });

  it('sections Many Worlds Tavern by realm, Pistolheart by volume and Escape the Veiled Halls by room', () => {
    expect(Object.keys(SECTION_PROP)).toEqual(['mwt', 'ph', 'vh']);
    expect(SECTION_PROP.mwt?.group).toBe('realm');
    expect(SECTION_PROP.ph?.order).toEqual(['1', '2', '3']);
    expect(SECTION_PROP.ph?.chip?.('2')).toBe('2');
    expect(SECTION_PROP.vh?.chip).toBeUndefined();
    expect(SECTION_PROP.vh?.valueOf(rec({ src: 'vh', room: 'library' }))).toBe('library');
    expect(SECTION_PROP.ph?.valueOf(rec({ src: 'ph' }))).toBe('');
    expect(SECTION_PROP.mwt?.valueOf(rec({ src: 'mwt' }))).toBe('');
    expect(SECTION_PROP.vh?.valueOf(rec({ src: 'vh' }))).toBe('');
    expect(SECTION_PROP.mwt?.name('nowhere', 'en')).toBe('nowhere');
    expect(sectionLeaf(rec({ src: 'core' }), 'en')).toBe('');
  });

  it('gives the section leaf of a sectioned record only', () => {
    expect(sectionLeaf(rec({ src: 'ph', vol: 2 }), 'ru')).toBe('Том 2');
    expect(sectionLeaf(rec({ src: 'vh', room: 'basement' }), 'en')).toBe('The Basement');
    expect(sectionLeaf(rec({ src: 'mwt', realm: 'drome' }), 'en')).toBe('The Drome');
    expect(sectionLeaf(rec({ src: 'lr' }), 'en')).toBe('');
    expect(sectionLeaf(rec({ src: 'ph' }), 'en')).toBe('');
  });
});
