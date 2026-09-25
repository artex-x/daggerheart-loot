import { describe, expect, it } from 'vitest';
import { agoText } from './ago.js';
import { dict } from './dict.js';

const NOW = Date.parse('2026-09-25T12:00:00Z');
const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const ago = (ms: number, lang: 'ru' | 'en') => agoText(NOW - ms, NOW, lang, dict(lang));

describe('agoText', () => {
  it('reads the steps in Russian', () => {
    expect(
      [10 * SEC, 5 * MIN, HOUR, 3 * DAY, 30 * DAY, 400 * DAY].map((d) => ago(d, 'ru'))
    ).toEqual([
      'изменён только что',
      'изменён 5 минут назад',
      'изменён 1 час назад',
      'изменён 3 дня назад',
      'изменён в прошлом месяце',
      'изменён в прошлом году'
    ]);
  });

  it('reads the steps in English', () => {
    expect(
      [10 * SEC, 5 * MIN, HOUR, 3 * DAY, 30 * DAY, 400 * DAY].map((d) => ago(d, 'en'))
    ).toEqual([
      'edited just now',
      'edited 5 minutes ago',
      'edited 1 hour ago',
      'edited 3 days ago',
      'edited last month',
      'edited last year'
    ]);
  });

  it('reads a time in the future as just now', () => {
    expect(ago(-5 * MIN, 'ru')).toBe('изменён только что');
  });

  it('turns to months at 30 days and to years at 12 months', () => {
    expect(ago(29 * DAY, 'en')).toBe('edited 29 days ago');
    expect(ago(359 * DAY, 'en')).toBe('edited 11 months ago');
    expect(ago(360 * DAY, 'en')).toBe('edited last year');
    expect(ago(800 * DAY, 'en')).toBe('edited 2 years ago');
  });

  it('reads an updated text in both languages', () => {
    const updated = (ms: number, lang: 'ru' | 'en') =>
      agoText(NOW - ms, NOW, lang, dict(lang), 'updated');
    expect([updated(10 * SEC, 'ru'), updated(3 * DAY, 'ru')]).toEqual([
      'Обновлено только что',
      'Обновлено 3 дня назад'
    ]);
    expect([updated(10 * SEC, 'en'), updated(3 * DAY, 'en')]).toEqual([
      'Updated just now',
      'Updated 3 days ago'
    ]);
  });
});
