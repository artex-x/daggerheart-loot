/* The closed «Настроить» on a roll page: what it reads while a row is narrowed. */
import { describe, expect, it } from 'vitest';
import { narrowedLabel } from './std.js';

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
