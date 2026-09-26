/* The time the app reads for the legacy write cutoff (docs/specs/FEATURES.md,
 * "Account and browser lists"). The test build pins it, so every state stays
 * before the cutoff unless its address says `?today=` (docs/specs/COVERAGE.md,
 * "Test layers"). */

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
 *  names no valid day. */
export function queryClock(search: string, fallback: number): ClockPort {
  const m = DAY.exec(new URLSearchParams(search).get('today') ?? '');
  if (m) {
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const ms = Date.UTC(y, mo - 1, d);
    const at = new Date(ms);
    if (at.getUTCMonth() === mo - 1 && at.getUTCDate() === d) return fixedClock(ms);
  }
  return fixedClock(fallback);
}
