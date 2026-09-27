import { describe, expect, it } from 'vitest';
import {
  backoffMs,
  BACKOFF_MAX_MS,
  feedStep,
  readOwnerMessage,
  readRequestMessage,
  readShareMessage,
  type FeedEvent,
  type FeedState
} from './live.js';

const LIST = '00000000-0000-4000-8000-000000000101';
const STATES: FeedState[] = ['off', 'connecting', 'live', 'down'];
const EVENTS: FeedEvent[] = ['watch', 'joined', 'lost', 'timeout', 'retry', 'stop'];

describe('feedStep', () => {
  const none = {
    subscribe: false,
    unsubscribe: false,
    joinTimer: null,
    retry: null,
    resetBackoff: false,
    refetch: false
  };

  it('joins on watch and starts the join timer', () => {
    expect(feedStep('off', 'watch')).toEqual({
      ...none,
      to: 'connecting',
      subscribe: true,
      joinTimer: 'start'
    });
  });

  it('goes live on a join, resets the backoff and reads once', () => {
    expect(feedStep('connecting', 'joined')).toEqual({
      ...none,
      to: 'live',
      joinTimer: 'clear',
      resetBackoff: true,
      refetch: true
    });
  });

  it('goes down on a join timeout or a loss while connecting, and schedules a retry', () => {
    for (const e of ['timeout', 'lost'] as const) {
      expect(feedStep('connecting', e)).toEqual({
        ...none,
        to: 'down',
        joinTimer: 'clear',
        retry: 'schedule'
      });
    }
  });

  it('reads once and schedules a retry when a live topic is lost', () => {
    expect(feedStep('live', 'lost')).toEqual({
      ...none,
      to: 'down',
      retry: 'schedule',
      refetch: true
    });
  });

  it('leaves and joins again on a retry', () => {
    expect(feedStep('down', 'retry')).toEqual({
      ...none,
      to: 'connecting',
      unsubscribe: true,
      subscribe: true,
      joinTimer: 'start'
    });
  });

  it('goes live from down on a late join', () => {
    expect(feedStep('down', 'joined')).toEqual({
      ...none,
      to: 'live',
      retry: 'clear',
      resetBackoff: true,
      refetch: true
    });
  });

  it('stops from every state but off', () => {
    for (const from of ['connecting', 'live', 'down'] as const) {
      expect(feedStep(from, 'stop')).toEqual({
        ...none,
        to: 'off',
        unsubscribe: true,
        joinTimer: 'clear',
        retry: 'clear'
      });
    }
  });

  it('answers null for every other pair', () => {
    const table = new Set([
      'off watch',
      'connecting joined',
      'connecting timeout',
      'connecting lost',
      'live lost',
      'down retry',
      'down joined',
      'connecting stop',
      'live stop',
      'down stop'
    ]);
    for (const from of STATES) {
      for (const e of EVENTS) {
        if (!table.has(from + ' ' + e)) expect(feedStep(from, e)).toBeNull();
      }
    }
  });
});

describe('backoffMs', () => {
  it('doubles from 2 s with +/-20 %', () => {
    expect([0, 0.5, 1].map((r) => backoffMs(0, () => r))).toEqual([1600, 2000, 2400]);
    expect([0, 0.5, 1].map((r) => backoffMs(1, () => r))).toEqual([3200, 4000, 4800]);
    expect(backoffMs(7, () => 0.5)).toBe(256_000);
  });

  it('caps at 300 s', () => {
    expect([0, 0.5, 1].map((r) => backoffMs(8, () => r))).toEqual([240_000, 300_000, 360_000]);
    expect(backoffMs(40, () => 0.5)).toBe(BACKOFF_MAX_MS);
  });
});

describe('readShareMessage', () => {
  it('reads a revision or null, with Realtime id key ignored', () => {
    expect(readShareMessage('revision', { revision: 7 })).toEqual({ revision: 7 });
    expect(readShareMessage('revision', { revision: 0, id: 'm1' })).toEqual({ revision: 0 });
    expect(readShareMessage('revision', { revision: null, id: 'm2' })).toEqual({
      revision: null
    });
  });

  it('drops any other event or shape', () => {
    for (const [event, payload] of [
      ['list', { revision: 1 }],
      ['revision', null],
      ['revision', [1]],
      ['revision', {}],
      ['revision', { revision: -1 }],
      ['revision', { revision: 1.5 }],
      ['revision', { revision: '1' }],
      ['revision', { revision: Number.MAX_SAFE_INTEGER + 1 }]
    ] as const) {
      expect(readShareMessage(event, payload)).toBeNull();
    }
  });
});

describe('readOwnerMessage', () => {
  it('reads a list, a revision or null, and by or none', () => {
    expect(readOwnerMessage('list', { list: LIST, revision: 3, by: 'tab-1', id: 'm' })).toEqual(
      {
        list: LIST,
        revision: 3,
        by: 'tab-1'
      }
    );
    expect(readOwnerMessage('list', { list: LIST, revision: null, by: null })).toEqual({
      list: LIST,
      revision: null,
      by: null
    });
    expect(readOwnerMessage('list', { list: LIST, revision: 2 })).toEqual({
      list: LIST,
      revision: 2,
      by: null
    });
  });

  it('drops any other event or shape', () => {
    for (const [event, payload] of [
      ['revision', { list: LIST, revision: 1 }],
      ['list', 'x'],
      ['list', [LIST]],
      ['list', { list: 'l1', revision: 1 }],
      ['list', { list: 5, revision: 1 }],
      ['list', { list: LIST }],
      ['list', { list: LIST, revision: -2 }],
      ['list', { list: LIST, revision: 1, by: 4 }]
    ] as const) {
      expect(readOwnerMessage(event, payload)).toBeNull();
    }
  });
});

describe('readRequestMessage', () => {
  it('reads a list and by or none, with Realtime id key ignored', () => {
    expect(readRequestMessage('request', { list: LIST, by: null, id: 'm' })).toEqual({
      list: LIST,
      by: null
    });
    expect(readRequestMessage('request', { list: LIST, by: 'tab-1' })).toEqual({
      list: LIST,
      by: 'tab-1'
    });
    expect(readRequestMessage('request', { list: LIST })).toEqual({ list: LIST, by: null });
  });

  it('drops any other event or shape', () => {
    for (const [event, payload] of [
      ['list', { list: LIST, revision: 1, by: null }],
      ['request', null],
      ['request', [LIST]],
      ['request', {}],
      ['request', { list: 'l1' }],
      ['request', { list: 5 }],
      ['request', { list: LIST, by: 4 }]
    ] as const) {
      expect(readRequestMessage(event, payload)).toBeNull();
    }
  });

  it('is not read as a list message, so a client without it drops the event', () => {
    expect(readOwnerMessage('request', { list: LIST, by: null })).toBeNull();
  });
});
