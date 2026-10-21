import { describe, expect, it } from 'vitest';
import { REALM_ORDER, realmName } from './realms.js';
import type { Realm } from './realms.js';

describe('realmName', () => {
  it('names every realm in both languages, in release order', () => {
    expect(REALM_ORDER).toEqual([
      'sporopolis',
      'wagerwood',
      'warrens',
      'godsvale',
      'hornet',
      'drome'
    ]);
    expect(realmName('sporopolis', 'ru')).toBe('Спорополис');
    expect(realmName('sporopolis', 'en')).toBe('Sporopolis');
    expect(realmName('wagerwood', 'ru')).toBe('Лес Пари');
    expect(realmName('wagerwood', 'en')).toBe('Wagerwood');
    expect(realmName('warrens', 'ru')).toBe('Воюющие Норы');
    expect(realmName('warrens', 'en')).toBe("Warrin' Warrens");
    expect(realmName('godsvale', 'ru')).toBe('Долина Богов');
    expect(realmName('godsvale', 'en')).toBe('Godsvale');
    expect(realmName('hornet', 'ru')).toBe('Оплот Шершней');
    expect(realmName('hornet', 'en')).toBe('Hornet Hold');
    expect(realmName('drome', 'ru')).toBe('Дром');
    expect(realmName('drome', 'en')).toBe('The Drome');
  });

  it('falls back to the raw id for a realm it does not know', () => {
    /* Cast: the fallback serves an id outside the closed set - untrusted data. */
    expect(realmName('unknown_realm' as Realm, 'en')).toBe('unknown_realm');
  });
});
