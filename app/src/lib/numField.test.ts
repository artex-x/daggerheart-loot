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

describe('a field whose range dips below zero', () => {
  /* The reprice field is the one caller: `min` is `-90`, so a leading minus is
     a sign rather than noise - unlike every roll field, where `min` stays 1 or
     more and a stray `-` is still stripped like any other letter. */
  it('keeps a leading minus as a sign', () => {
    expect(typed('-20', 3, 500, -90)).toEqual({ value: '-20', caret: 3 });
    expect(typed('-2', 2, 500, -90)).toEqual({ value: '-2', caret: 2 });
  });

  it('drops a minus that is not in front, or a second one', () => {
    expect(typed('2-0', 3, 500, -90)).toEqual({ value: '20', caret: 2 });
    expect(typed('--20', 4, 500, -90)).toEqual({ value: '-20', caret: 3 });
  });

  it('lets the field be just a sign, mid-typing', () => {
    expect(typed('-', 1, 500, -90)).toEqual({ value: '-', caret: 1 });
  });

  it('does not read a minus alone as a positive-only field would - unaffected', () => {
    /* Without a negative `min` this is exactly the existing stray-character
       case above: the sign is noise, not a digit. */
    expect(typed('4-7', 2, 60)).toEqual({ value: '47', caret: 1 });
  });

  it('never caps a negative-range field while it is typed - only the stepper does that', () => {
    /* app.js 4336-4343: the reprice field's own `input` handler does not
       clamp at all; app.js 3916's stepper is the only thing that does. A
       positive-only field still caps mid-keystroke (the case above). */
    expect(typed('900', 3, 500, -90)).toEqual({ value: '900', caret: 3 });
    expect(typed('-900', 4, 500, -90)).toEqual({ value: '-900', caret: 4 });
  });

  it('commits a negative number verbatim - unclamped, like the live field - and a bare minus to zero', () => {
    /* app.js 4336-4344: `S.rp = parseInt(el.value, 10) || 0`, with no clamp at
       all - a typed -900 stays -900, and a value floors to 1 only once it is
       applied to a price. A bare `-` parses to `NaN`, which `|| 0` turns into
       0, not into `min`: the button reads "Поднять цену" and a press does
       nothing, exactly as if nothing had been typed. */
    expect(committed('-20', -90, 500)).toBe(-20);
    expect(committed('-999', -90, 500)).toBe(-999);
    expect(committed('-', -90, 500)).toBe(0);
    expect(committed('', -90, 500)).toBe(0);
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
