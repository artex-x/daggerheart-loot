/* The time the app reads for the legacy write cutoff (docs/specs/FEATURES.md,
 * "Account and browser lists"). The test build pins it, so every state stays
 * before the cutoff unless its address says `?today=` (docs/specs/COVERAGE.md,
 * "Test layers"); `?toasts=held` stops its toasts from timing out. */

import type { ClockPort } from './types.js';

/** The test build's day: before the cutoff. */
export const TEST_NOW = Date.UTC(2026, 9, 1, 12);

export function browserClock(): ClockPort {
  return { now: () => Date.now() };
}

export function fixedClock(ms: number): ClockPort {
  return { now: () => ms };
}

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A clock fixed at UTC midnight of `?today=YYYY-MM-DD`, or at `fallback` when the query
 *  names no valid day; with `?toasts=held` it holds every toast until the next one. */
export function queryClock(search: string, fallback: number): ClockPort {
  const query = new URLSearchParams(search);
  const held = query.get('toasts') === 'held';
  const m = DAY.exec(query.get('today') ?? '');
  let ms = fallback;
  if (m) {
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const day = Date.UTC(y, mo - 1, d);
    const at = new Date(day);
    if (at.getUTCMonth() === mo - 1 && at.getUTCDate() === d) ms = day;
  }
  return held ? { now: () => ms, holdsToasts: () => true } : fixedClock(ms);
}
