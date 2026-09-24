import { describe, expect, it } from 'vitest';
import { dict } from './dict.js';
import { plural } from './plural.js';

const COUNTS = [0, 1, 2, 5, 11, 12, 21, 22, 25, 101, 111];

describe('plural', () => {
  it('picksRussianOneFewManyByTheLastDigits', () => {
    const forms = '%n позиция|%n позиции|%n позиций';
    expect(COUNTS.map((n) => plural(n, forms, 'ru'))).toEqual([
      '0 позиций',
      '1 позиция',
      '2 позиции',
      '5 позиций',
      '11 позиций',
      '12 позиций',
      '21 позиция',
      '22 позиции',
      '25 позиций',
      '101 позиция',
      '111 позиций'
    ]);
  });

  it('picksEnglishOneForOneAndOtherForEveryOtherCount', () => {
    const forms = '%n item|%n items';
    for (const n of COUNTS) {
      expect(plural(n, forms, 'en')).toBe(n === 1 ? '1 item' : `${String(n)} items`);
    }
  });

  it('returnsAWordWhenTheFormHasNoNumber', () => {
    expect(plural(2, 'мешок|мешка|мешков', 'ru')).toBe('мешка');
  });

  it('fallsBackToTheLastFormWhenAFormIsMissing', () => {
    expect(plural(5, 'шт.', 'ru')).toBe('шт.');
    expect(plural(2, '%n x', 'en')).toBe('2 x');
  });

  it('givesEveryFormSetThreeRussianAndTwoEnglishForms', () => {
    const ru = dict('ru');
    const en = dict('en');
    const keys = (Object.keys(ru) as (keyof typeof ru)[]).filter((k) => ru[k].includes('|'));
    expect(keys).toContain('selectedN');
    for (const k of keys) {
      expect(ru[k].split('|'), k).toHaveLength(3);
      expect(en[k].split('|'), k).toHaveLength(2);
    }
  });

  it('agreesTheSelectionVerbWithTheCount', () => {
    const ru = dict('ru').selectedN;
    const en = dict('en').selectedN;
    expect([1, 4, 5, 21].map((n) => plural(n, ru, 'ru'))).toEqual([
      'Выбрана 1 позиция',
      'Выбрано 4 позиции',
      'Выбрано 5 позиций',
      'Выбрана 21 позиция'
    ]);
    expect([1, 21].map((n) => plural(n, en, 'en'))).toEqual([
      'Selected 1 item',
      'Selected 21 items'
    ]);
  });

  it('agreesTheDroppedItemsToastWithTheCount', () => {
    const ru = dict('ru').droppedItems;
    const en = dict('en').droppedItems;
    expect([1, 2, 5, 21].map((n) => plural(n, ru, 'ru'))).toEqual([
      'Пропущено позиций, которых больше нет в данных: 1',
      'Пропущено позиций, которых больше нет в данных: 2',
      'Пропущено позиций, которых больше нет в данных: 5',
      'Пропущено позиций, которых больше нет в данных: 21'
    ]);
    expect([1, 2].map((n) => plural(n, en, 'en'))).toEqual([
      'Skipped 1 item - no longer in the data',
      'Skipped 2 items - no longer in the data'
    ]);
  });
});
