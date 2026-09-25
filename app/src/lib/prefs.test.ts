/* The preferences reader: `dhloot.prefs.v1` and the account's row are both
   untrusted, so a bad field is dropped rather than applied. */
import { describe, expect, it } from 'vitest';
import { readPrefs } from './prefs.js';

describe('readPrefs', () => {
  it('keeps every valid field', () => {
    const all = {
      lang: 'en',
      home: '#/tables/dread',
      view: 'grid',
      printBw: true,
      printCompact: false
    };
    expect(readPrefs(all)).toEqual(all);
    expect(readPrefs({ lang: 'ru', view: 'list' })).toEqual({ lang: 'ru', view: 'list' });
  });

  it('drops each invalid value and keeps the rest', () => {
    expect(readPrefs({ lang: 'de', view: 'grid' })).toEqual({ view: 'grid' });
    expect(readPrefs({ view: 'tiles', lang: 'en' })).toEqual({ lang: 'en' });
    expect(readPrefs({ printBw: 'yes', printCompact: true })).toEqual({ printCompact: true });
    expect(readPrefs({ printCompact: 1 })).toEqual({});
    expect(readPrefs({ home: 'roll/std' })).toEqual({});
    expect(readPrefs({ home: '#/' + 'x'.repeat(2047) })).toEqual({});
    expect(readPrefs({ home: '#/' + 'x'.repeat(2046) }).home).toHaveLength(2048);
    expect(readPrefs({ home: 5 })).toEqual({});
  });

  it('drops unknown keys, a money mode among them', () => {
    expect(readPrefs({ view: 'list', money: 'gold', extra: 1 })).toEqual({ view: 'list' });
  });

  it('reads anything that is not an object as nothing', () => {
    for (const raw of [null, [], 'x', undefined, 7, true]) {
      expect(readPrefs(raw), String(raw)).toEqual({});
    }
  });
});
