/* The header has three jobs and a mode row on the roll sections
 * (docs/decisions/2026-10-29-the-header-has-three-jobs-and-a-mode-row.md).
 * The sections and their addresses do not change; only what lights does.
 *
 * Pure module: no DOM, no data. */

import type { Section } from './types.js';

/** The supplement roll sections, in menu order. */
export const SUPPLEMENTS = [
  'roll/wondrous',
  'roll/dread',
  'roll/voa',
  'roll/dv',
  'roll/arazo',
  'roll/community',
  'roll/mwt'
] as const satisfies readonly Section[];

/** The three jobs of the header. */
export type Job = 'roll' | 'tables' | 'search';

/** Returns whether a section is a supplement, that is, reached through the supplements menu. */
export function isSupplement(s: Section | null): boolean {
  return s !== null && (SUPPLEMENTS as readonly Section[]).includes(s);
}

/** Returns whether a section is one of the nine roll sections. */
export function isRoll(s: Section | null): boolean {
  return s !== null && s.startsWith('roll/');
}

/** Returns the job that lights for a section: every roll section is the roll job. */
export function jobOf(s: Section | null): Job | null {
  if (isRoll(s)) return 'roll';
  if (s === 'tables' || s === 'search') return s;
  return null;
}

/** Returns the mode row control that lights for a section, or null off the roll sections.
 *  A supplement lights the menu button, which names that supplement. */
export function modeOf(s: Section | null): Section | null {
  return isRoll(s) ? s : null;
}
