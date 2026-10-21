/* The supplement roll sections share one header tab and a chip panel
 * (docs/decisions/2026-10-20-supplement-roll-sections-share-one-tab-and-a-chip-panel.md).
 * The sections and their addresses do not change; only the tab that lights does.
 *
 * Pure module: no DOM, no data. */

import type { Section } from './types.js';

/** The supplement roll sections, in panel order. The first is the tab's own link. */
export const SUPPLEMENTS = [
  'roll/wondrous',
  'roll/dread',
  'roll/voa',
  'roll/dv',
  'roll/arazo',
  'roll/community'
] as const satisfies readonly Section[];

/** Returns whether a section is a supplement, that is, drawn under the supplements tab. */
export function isSupplement(s: Section | null): boolean {
  return s !== null && (SUPPLEMENTS as readonly Section[]).includes(s);
}

/** Returns the header tab that lights for a section: the supplements tab for a supplement. */
export function tabOf(s: Section | null): Section | null {
  return isSupplement(s) ? SUPPLEMENTS[0] : s;
}
