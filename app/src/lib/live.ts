/* The live feed of one Realtime topic: its states, what each event does, the
 * rejoin backoff, and the two message shapes. Pure: `state/liveFeed.svelte.ts`
 * runs the effects. docs/specs/FEATURES.md, "Account and browser lists";
 * docs/DECISIONS.md, 2026-09-25, "Realtime is the primary live path; the 45 s
 * poll runs while it is down". */

import { isCloudId } from './cloudLists.js';
import type { Random } from './roll.js';

/** How long a join may take before the feed counts it as lost. */
export const JOIN_MS = 10_000;
/** The first rejoin delay; each failed attempt doubles it. */
export const BACKOFF_MIN_MS = 2_000;
/** The longest rejoin delay: a project at a platform limit sees one join per tab per 5 minutes. */
export const BACKOFF_MAX_MS = 300_000;
/** The re-read interval while the feed is live, for a message that never arrives. */
export const SAFETY_MS = 300_000;
/** How long a message waits for the next one, so a burst costs one read. */
export const COALESCE_MS = 250;

export type FeedState = 'off' | 'connecting' | 'live' | 'down';
export type FeedEvent = 'watch' | 'joined' | 'lost' | 'timeout' | 'retry' | 'stop';

/** One transition and the effects the driver runs for it. */
export interface FeedStep {
  to: FeedState;
  subscribe: boolean;
  unsubscribe: boolean;
  joinTimer: 'start' | 'clear' | null;
  retry: 'schedule' | 'clear' | null;
  resetBackoff: boolean;
  refetch: boolean;
}

const NONE: Omit<FeedStep, 'to'> = {
  subscribe: false,
  unsubscribe: false,
  joinTimer: null,
  retry: null,
  resetBackoff: false,
  refetch: false
};

const step = (to: FeedState, effects: Partial<Omit<FeedStep, 'to'>>): FeedStep => ({
  to,
  ...NONE,
  ...effects
});

/** Returns the transition of `event` in state `from`, or null when the pair does nothing. */
export function feedStep(from: FeedState, event: FeedEvent): FeedStep | null {
  if (event === 'stop') {
    return from === 'off'
      ? null
      : step('off', { unsubscribe: true, joinTimer: 'clear', retry: 'clear' });
  }
  switch (from) {
    case 'off':
      return event === 'watch'
        ? step('connecting', { subscribe: true, joinTimer: 'start' })
        : null;
    case 'connecting':
      if (event === 'joined') {
        return step('live', { joinTimer: 'clear', resetBackoff: true, refetch: true });
      }
      if (event === 'timeout' || event === 'lost') {
        return step('down', { joinTimer: 'clear', retry: 'schedule' });
      }
      return null;
    case 'live':
      return event === 'lost' ? step('down', { retry: 'schedule', refetch: true }) : null;
    case 'down':
      if (event === 'retry') {
        return step('connecting', { unsubscribe: true, subscribe: true, joinTimer: 'start' });
      }
      if (event === 'joined') {
        return step('live', { retry: 'clear', resetBackoff: true, refetch: true });
      }
      return null;
  }
}

/** Returns the delay before rejoin `attempt` (0 first): doubled per attempt, capped, +/-20 %. */
export function backoffMs(attempt: number, random: Random): number {
  const base = Math.min(BACKOFF_MAX_MS, BACKOFF_MIN_MS * 2 ** attempt);
  return Math.round(base * (0.8 + 0.4 * random()));
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

/* A revision, or null for a share or list that is gone; undefined when neither. */
function revisionOf(v: unknown): number | null | undefined {
  if (v === null) return null;
  return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : undefined;
}

/** Returns a share topic's message, or null for any other shape. Realtime adds the message's
 *  own `id`; other keys are ignored. */
export function readShareMessage(
  event: string,
  payload: unknown
): { revision: number | null } | null {
  if (event !== 'revision' || !isRecord(payload)) return null;
  const revision = revisionOf(payload['revision']);
  return revision === undefined ? null : { revision };
}

/** Returns an owner topic's message, or null for any other shape; a missing `by` reads as
 *  null, other keys are ignored. */
export function readOwnerMessage(
  event: string,
  payload: unknown
): { list: string; revision: number | null; by: string | null } | null {
  if (event !== 'list' || !isRecord(payload)) return null;
  const list = payload['list'];
  const revision = revisionOf(payload['revision']);
  const by = payload['by'] ?? null;
  if (typeof list !== 'string' || !isCloudId(list) || revision === undefined) return null;
  if (by !== null && typeof by !== 'string') return null;
  return { list, revision, by };
}

/** Returns an owner topic's purchase-request message (a request sent or decided), or null
 *  for any other shape; a missing `by` reads as null, other keys are ignored. */
export function readRequestMessage(
  event: string,
  payload: unknown
): { list: string; by: string | null } | null {
  if (event !== 'request' || !isRecord(payload)) return null;
  const list = payload['list'];
  const by = payload['by'] ?? null;
  if (typeof list !== 'string' || !isCloudId(list)) return null;
  if (by !== null && typeof by !== 'string') return null;
  return { list, by };
}
