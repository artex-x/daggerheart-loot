import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JOIN_MS, SAFETY_MS } from '../lib/live.js';
import type { EventsPort, LiveStatus } from '../ports/index.js';
import { LiveFeed } from './liveFeed.svelte.js';

interface Joined {
  topic: string;
  on: { message(event: string, payload: unknown): void; status(s: LiveStatus): void };
  leave: ReturnType<typeof vi.fn>;
}

/* An events port that answers only when the test says so. */
function stubEvents(): EventsPort & { joins: Joined[]; last(): Joined } {
  const joins: Joined[] = [];
  return {
    tab: 'tab-1',
    joins,
    last() {
      const j = joins.at(-1);
      if (!j) throw new Error('no subscribe');
      return j;
    },
    subscribe(topic, on) {
      const leave = vi.fn();
      joins.push({ topic, on, leave });
      return leave;
    }
  };
}

let events: ReturnType<typeof stubEvents>;
let message: ReturnType<typeof vi.fn<(event: string, payload: unknown) => void>>;
let refetch: ReturnType<typeof vi.fn<() => void>>;
let feed: LiveFeed;

beforeEach(() => {
  vi.useFakeTimers();
  events = stubEvents();
  message = vi.fn();
  refetch = vi.fn();
  /* random 0.5: every backoff is its base, 2 s, 4 s, 8 s ... */
  feed = new LiveFeed(events, () => 0.5, {
    message: (e, p) => {
      message(e, p);
    },
    refetch: () => {
      refetch();
    }
  });
});

afterEach(() => {
  feed.stop();
  vi.useRealTimers();
});

describe('LiveFeed', () => {
  it('subscribes on watch, and once for the same topic twice', () => {
    feed.watch('share:a');
    feed.watch('share:a');
    expect(events.joins.map((j) => j.topic)).toEqual(['share:a']);
    expect(feed.state).toBe('connecting');
    expect(feed.topic).toBe('share:a');
  });

  it('leaves the first topic when another one is watched', () => {
    feed.watch('share:a');
    const first = events.last();
    feed.watch('share:b');
    expect(first.leave).toHaveBeenCalledOnce();
    expect(events.joins.map((j) => j.topic)).toEqual(['share:a', 'share:b']);
  });

  it('reads once when the topic joins', () => {
    feed.watch('share:a');
    events.last().on.status('live');
    expect(feed.state).toBe('live');
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('goes down when no join comes in 10 s, and joins again after the backoff', () => {
    feed.watch('share:a');
    const first = events.last();
    vi.advanceTimersByTime(JOIN_MS);
    expect(feed.state).toBe('down');
    expect(refetch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1999);
    expect(events.joins).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(first.leave).toHaveBeenCalledOnce();
    expect(events.joins).toHaveLength(2);
    expect(feed.state).toBe('connecting');
  });

  it('reads once and rejoins when a live topic is lost, the backoff doubling per failure', () => {
    feed.watch('share:a');
    events.last().on.status('live');
    events.last().on.status('down');
    expect(feed.state).toBe('down');
    expect(refetch).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(2000);
    expect(events.joins).toHaveLength(2);
    events.last().on.status('down');
    vi.advanceTimersByTime(3999);
    expect(events.joins).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(events.joins).toHaveLength(3);
  });

  it('resets the backoff on a join', () => {
    feed.watch('share:a');
    events.last().on.status('down');
    vi.advanceTimersByTime(2000);
    events.last().on.status('down');
    vi.advanceTimersByTime(4000);
    events.last().on.status('live');
    events.last().on.status('down');
    vi.advanceTimersByTime(2000);
    expect(events.joins).toHaveLength(4);
  });

  it('goes live from down when a late join arrives', () => {
    feed.watch('share:a');
    vi.advanceTimersByTime(JOIN_MS);
    events.last().on.status('live');
    expect(feed.state).toBe('live');
    vi.advanceTimersByTime(60_000);
    expect(events.joins).toHaveLength(1);
  });

  it('reads every 5 minutes only while live', () => {
    feed.watch('share:a');
    events.last().on.status('live');
    vi.advanceTimersByTime(SAFETY_MS);
    expect(refetch).toHaveBeenCalledTimes(2);
    events.last().on.status('down');
    expect(refetch).toHaveBeenCalledTimes(3);
    feed.stop();
    vi.advanceTimersByTime(3 * SAFETY_MS);
    expect(refetch).toHaveBeenCalledTimes(3);
  });

  it('leaves and clears every timer on stop', () => {
    feed.watch('share:a');
    const first = events.last();
    feed.stop();
    expect(first.leave).toHaveBeenCalledOnce();
    expect(feed.state).toBe('off');
    expect(feed.topic).toBeNull();
    vi.advanceTimersByTime(10 * SAFETY_MS);
    expect(events.joins).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('passes a message on only while live, and ignores a left channel', () => {
    feed.watch('share:a');
    const first = events.last();
    first.on.message('revision', { revision: 1 });
    expect(message).not.toHaveBeenCalled();
    first.on.status('live');
    first.on.message('revision', { revision: 2 });
    expect(message).toHaveBeenCalledWith('revision', { revision: 2 });
    feed.watch('share:b');
    first.on.message('revision', { revision: 3 });
    first.on.status('live');
    expect(message).toHaveBeenCalledOnce();
    expect(feed.state).toBe('connecting');
  });
});
