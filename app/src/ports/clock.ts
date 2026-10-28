/* The time the app reads for export names and relative times. The test build pins it at
 * `TEST_NOW` (docs/specs/COVERAGE.md, "Test layers"); `?toasts=held` stops its toasts from
 * timing out. */

import type { ClockPort } from './types.js';

/** The test build's fixed moment. */
export const TEST_NOW = Date.UTC(2026, 9, 1, 12);

export function browserClock(): ClockPort {
  return { now: () => Date.now() };
}

export function fixedClock(ms: number): ClockPort {
  return { now: () => ms };
}

/** A clock fixed at `ms`; with `?toasts=held` in `search` it holds every toast until the
 *  next one. */
export function queryClock(search: string, ms: number): ClockPort {
  const held = new URLSearchParams(search).get('toasts') === 'held';
  return held ? { now: () => ms, holdsToasts: () => true } : fixedClock(ms);
}
