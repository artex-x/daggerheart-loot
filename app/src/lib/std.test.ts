/* The closed «Настроить» on a roll page: what it reads while a row is narrowed. */
import { describe, expect, it } from 'vitest';
import { narrowedLabel, pickKinds } from './std.js';

const whole = { left: ['Core', 'Hope & Fear'], of: 2 };

describe('narrowedLabel', () => {
  it('is empty while every row is whole', () => {
    expect(narrowedLabel([whole, whole], 'Настроить')).toBe('');
  });

  it('names the value left on in the one narrowed row', () => {
    expect(narrowedLabel([whole, { left: ['Предметы'], of: 2 }], 'Настроить')).toBe('Предметы');
  });

  it('counts two narrowed rows', () => {
    expect(
      narrowedLabel(
        [
          { left: ['Core'], of: 2 },
          { left: ['Предметы'], of: 2 }
        ],
        'Настроить'
      )
    ).toBe('Настроить · 2');
  });
});

describe('pickKinds', () => {
  const KEYS = ['item', 'consumable', 'equip'] as const;
  const ALL = { item: true, consumable: true, equip: true };

  it('picks one key alone from «Все»', () => {
    expect(pickKinds(ALL, KEYS, 'equip')).toEqual({
      item: false,
      consumable: false,
      equip: true
    });
  });

  it('adds a second pick', () => {
    const one = pickKinds(ALL, KEYS, 'item');
    expect(pickKinds(one, KEYS, 'equip')).toEqual({
      item: true,
      consumable: false,
      equip: true
    });
  });

  it('turns an already-picked key off', () => {
    const two = { item: true, consumable: false, equip: true };
    expect(pickKinds(two, KEYS, 'item')).toEqual({
      item: false,
      consumable: false,
      equip: true
    });
  });

  it('returns to «Все» when the last pick goes off', () => {
    const one = pickKinds(ALL, KEYS, 'consumable');
    expect(pickKinds(one, KEYS, 'consumable')).toEqual(ALL);
  });

  it('leaves the picks it is given alone', () => {
    const before = { ...ALL };
    pickKinds(before, KEYS, 'item');
    expect(before).toEqual(ALL);
  });
});
