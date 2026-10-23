/** A chip row folds past this many values and draws the first CHIP_FOLD_SHOWN. */
export const CHIP_FOLD_AT = 12;
export const CHIP_FOLD_SHOWN = 10;
/** A list of rows folds past this many and draws that many (the import's rows). */
export const ROW_FOLD_AT = 20;

/** Returns the rows a fold draws (docs/specs/FEATURES.md, rule 12): every row while it
 *  is open or holds no more than `at`, else the first `shown` and each row `keep`
 *  answers true for, in their order; `more` counts the rows left out. */
export function foldRows<T>(
  rows: readonly T[],
  open: boolean,
  at: number,
  shown: number,
  keep: (row: T) => boolean = () => false
): { rows: T[]; more: number } {
  if (open || rows.length <= at) return { rows: [...rows], more: 0 };
  const out = rows.filter((r, i) => i < shown || keep(r));
  return { rows: out, more: rows.length - out.length };
}
