import { describe, expect, it } from 'vitest';
import { CHIP_FOLD_AT, CHIP_FOLD_SHOWN, ROW_FOLD_AT, foldRows } from './folds.js';

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

describe('foldRows', () => {
  it('draws every row while the list holds no more than the fold point', () => {
    expect(foldRows(range(12), false, CHIP_FOLD_AT, CHIP_FOLD_SHOWN)).toEqual({
      rows: range(12),
      more: 0
    });
  });

  it('draws the first shown rows past the fold point and counts the rest', () => {
    expect(foldRows(range(13), false, CHIP_FOLD_AT, CHIP_FOLD_SHOWN)).toEqual({
      rows: range(10),
      more: 3
    });
  });

  it('keeps a row the keep test names, in its order', () => {
    const fold = foldRows(range(13), false, CHIP_FOLD_AT, CHIP_FOLD_SHOWN, (r) => r === 12);
    expect(fold).toEqual({ rows: [...range(10), 12], more: 2 });
  });

  it('draws every row while the fold is open', () => {
    expect(foldRows(range(30), true, CHIP_FOLD_AT, CHIP_FOLD_SHOWN)).toEqual({
      rows: range(30),
      more: 0
    });
  });

  it('cuts a list of rows at the row fold point', () => {
    expect(foldRows(range(21), false, ROW_FOLD_AT, ROW_FOLD_AT)).toEqual({
      rows: range(20),
      more: 1
    });
  });
});
