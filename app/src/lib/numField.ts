/* The rules a roll number field follows, with no field to hold them.
 *
 * These look fussy and are not. The old app used `type=text` deliberately,
 * because a number input refuses `setSelectionRange`: after the re-render every
 * keystroke triggered, the caret could not be put back, so the second digit of
 * a two-digit roll landed in front of the first - 47 was typed and 74 arrived,
 * then clamped to 60. That is defect #64, and `tests/qa.js` still guards it on
 * the live app.
 *
 * Svelte does not rebuild the field on every keystroke, so the caret is not
 * yanked for that reason any more. It still moves when characters are removed,
 * which is what `typed` computes: strip anything that is not a digit and shift
 * the caret by however much was dropped in front of it.
 *
 * Pure, so the rules can be checked without a browser - which is the only way
 * "the caret stays where it was" gets asserted at all. */

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

export interface Typed {
  /** The text the field should now hold. */
  value: string;
  /** Where the caret should now sit. */
  caret: number;
}

/**
 * What a keystroke leaves behind.
 *
 * Digits only, and the caret moves back by the number of characters removed
 * before it - not to the end, which is where a naive filter sends it and which
 * is what made the field unusable with a keyboard.
 *
 * A value over the maximum is clamped as it is typed, because the alternative
 * is letting somebody type 99 into a range of 29 and only telling them once
 * they look away. Nothing is clamped upward here: 0 on the way to 10 is a
 * half-typed number, not a mistake.
 */
export function typed(raw: string, caret: number, max: number): Typed {
  const digits = raw.replace(/\D/g, '');
  if (digits === '') return { value: '', caret: 0 };

  const removedBefore =
    raw.slice(0, caret).length - raw.slice(0, caret).replace(/\D/g, '').length;
  const at = clamp(caret - removedBefore, 0, digits.length);

  const n = Number(digits);
  if (n > max) {
    const capped = String(max);
    return { value: capped, caret: capped.length };
  }
  return { value: digits, caret: at };
}

/**
 * What the field holds once it is done being edited.
 *
 * Half-typed input is left alone while typing so the caret is not disturbed;
 * on commit it has to be a number in range again. An empty field commits to the
 * minimum on a roll page - there would be nothing to show otherwise.
 */
export function committed(raw: string, min: number, max: number): number {
  const n = Number(raw.replace(/\D/g, ''));
  return raw.trim() === '' || !Number.isFinite(n) ? min : clamp(n, min, max);
}
