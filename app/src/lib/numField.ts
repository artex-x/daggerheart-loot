/* The rules a roll number field follows, with no field to hold them.
 *
 * These look fussy and are not. The old app used `type=text` deliberately,
 * because a number input refuses `setSelectionRange`: after the re-render every
 * keystroke triggered, the caret could not be put back, so the second digit of
 * a two-digit roll landed in front of the first - 47 was typed and 74 arrived,
 * then clamped to 60. That is defect #64, and `numField.test.ts`'s "keeps the
 * caret where the person put it" guards it here.
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
 * Digits only, plus a single leading minus when the field's own range dips
 * below zero - the reprice field is the one caller with a negative `min`
 * (`-90`); every roll field keeps `min` at 1 or more, so this is unreachable
 * there and their stripping is untouched. A minus anywhere but the front, or
 * a second one, is noise from a stray keystroke rather than a sign.
 */
function digitsOf(raw: string, allowNeg: boolean): string {
  if (!allowNeg) return raw.replace(/\D/g, '');
  const kept = raw.replace(/[^-0-9]/g, '');
  return (kept.startsWith('-') ? '-' : '') + kept.replace(/-/g, '');
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
export function typed(raw: string, caret: number, max: number, min = 0): Typed {
  const allowNeg = min < 0;
  const digits = digitsOf(raw, allowNeg);
  if (digits === '' || digits === '-') return { value: digits, caret: digits.length };

  const removedBefore =
    raw.slice(0, caret).length - digitsOf(raw.slice(0, caret), allowNeg).length;
  const at = clamp(caret - removedBefore, 0, digits.length);

  /* app.js 4336-4343: the reprice field's own `input` handler never clamps -
     only the stepper does (app.js 3916, ported in NumberField.svelte's
     `step()`). A roll field's range never dips below zero, so this leaves
     every existing caller's per-keystroke cap untouched. */
  if (allowNeg) return { value: digits, caret: at };

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
 * on commit it has to be a number again. An empty field commits to the minimum
 * on a roll page - there would be nothing to show otherwise.
 *
 * The reprice field (`min < 0`) is not a roll field and is not clamped here at
 * all - app.js 4336-4343 commits `parseInt(el.value, 10) || 0` verbatim, so a
 * typed `-900` stays `-900` and a bare `-` or an empty field reads as `0`, not
 * as `min`; only the stepper clamps (app.js 3916). Every existing `min >= 1`
 * caller keeps its old clamped reading unchanged.
 */
export function committed(raw: string, min: number, max: number): number {
  const allowNeg = min < 0;
  const digits = digitsOf(raw, allowNeg);
  const n = Number(digits);
  if (raw.trim() === '' || digits === '-' || !Number.isFinite(n)) return allowNeg ? 0 : min;
  return allowNeg ? n : clamp(n, min, max);
}
