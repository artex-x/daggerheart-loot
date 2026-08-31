/* The number field's rules, including the one that was a defect.
 *
 * "47 becomes 74" is not a hypothetical: it is #64, and it happened because a
 * filter that strips non-digits also sends the caret to the end. The cases
 * below are the ones a person actually produces - typing a second digit,
 * pasting, typing in the middle, going over the maximum. */

import { describe, expect, it } from 'vitest';
import { clamp, committed, typed } from './numField.js';

describe('while it is being typed', () => {
  it('keeps the caret where the person put it', () => {
    /* Defect #64: the caret jumping to the end turned 4|7 into 47 -> 74. */
    expect(typed('47', 1, 60)).toEqual({ value: '47', caret: 1 });
    expect(typed('123', 2, 999)).toEqual({ value: '123', caret: 2 });
  });

  it('drops anything that is not a digit and pulls the caret back with it', () => {
    /* One letter removed in front of the caret means the caret moves one left,
       not to the end of the field. */
    expect(typed('4a7', 3, 60)).toEqual({ value: '47', caret: 2 });
    expect(typed('a47', 1, 60)).toEqual({ value: '47', caret: 0 });
    expect(typed('4-7', 2, 60)).toEqual({ value: '47', caret: 1 });
  });

  it('leaves the caret alone when what was removed sits after it', () => {
    expect(typed('47x', 1, 60)).toEqual({ value: '47', caret: 1 });
  });

  it('survives a paste of mixed rubbish', () => {
    expect(typed('  1 2\n3 ', 8, 999)).toEqual({ value: '123', caret: 3 });
  });

  it('caps a number over the maximum as it is typed', () => {
    /* Better than letting somebody type 99 into a range of 29 and only saying
       so once they look away. */
    expect(typed('99', 2, 29)).toEqual({ value: '29', caret: 2 });
    expect(typed('600', 3, 60)).toEqual({ value: '60', caret: 2 });
  });

  it('does not push a half-typed number up to the minimum', () => {
    /* 0 on the way to 10 is unfinished, not wrong. Clamping up here would make
       the field fight the person mid-word. */
    expect(typed('0', 1, 60)).toEqual({ value: '0', caret: 1 });
  });

  it('allows the field to be emptied', () => {
    expect(typed('', 0, 60)).toEqual({ value: '', caret: 0 });
    expect(typed('abc', 3, 60)).toEqual({ value: '', caret: 0 });
  });
});

describe('once it is committed', () => {
  it('brings a number into range', () => {
    expect(committed('0', 1, 60)).toBe(1);
    expect(committed('61', 1, 60)).toBe(60);
    expect(committed('47', 1, 60)).toBe(47);
  });

  it('reads an empty field as the minimum', () => {
    /* On a roll page there is nothing to show for "no number", so the field
       settles on the lowest one rather than going blank. */
    expect(committed('', 1, 60)).toBe(1);
    expect(committed('   ', 1, 60)).toBe(1);
  });

  it('reads rubbish as the minimum rather than as NaN', () => {
    expect(committed('abc', 1, 60)).toBe(1);
  });
});

describe('clamp', () => {
  it('holds a value between the two ends, inclusive', () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(0, 1, 10)).toBe(1);
    expect(clamp(11, 1, 10)).toBe(10);
    expect(clamp(1, 1, 10)).toBe(1);
    expect(clamp(10, 1, 10)).toBe(10);
  });
});
