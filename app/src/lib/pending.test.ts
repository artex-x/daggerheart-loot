import { describe, expect, it } from 'vitest';
import { readPending } from './pending.js';

const add = (over: Record<string, unknown> = {}) => ({
  do: 'addToList',
  key: 'sel',
  ids: ['ci1', 'q1'],
  ...over
});

describe('readPending', () => {
  it('reads both actions', () => {
    expect(readPending({ do: 'saveList', extra: 1 })).toEqual({ do: 'saveList' });
    expect(readPending(add({ picked: { ci1: 2 } }))).toEqual({
      do: 'addToList',
      key: 'sel',
      ids: ['ci1', 'q1'],
      picked: { ci1: 2 }
    });
    expect(readPending(add({ name: 'Клад' }))).toMatchObject({ name: 'Клад' });
    expect(readPending(add({ picked: {} }))).toEqual({
      do: 'addToList',
      key: 'sel',
      ids: ['ci1', 'q1']
    });
  });

  it('refuses what this app never writes', () => {
    for (const bad of [
      null,
      'addToList',
      { do: 'deleteList' },
      add({ key: '' }),
      add({ key: 'a b' }),
      add({ key: 7 }),
      add({ ids: [] }),
      add({ ids: 'ci1' }),
      add({ ids: Array.from({ length: 181 }, (_, i) => 'q' + String(i)) }),
      add({ ids: ['ci1', 'ci1'] }),
      add({ ids: ['ci1', 'bad id'] }),
      add({ ids: ['ci1', 3] }),
      add({ picked: { ci1: 0 } }),
      add({ picked: { ci1: 100 } }),
      add({ picked: { ci1: 1.5 } }),
      add({ picked: { ci1: '2' } }),
      add({ picked: { w1: 2 } }),
      add({ picked: [2] }),
      add({ picked: null }),
      add({ name: '' }),
      add({ name: 7 }),
      add({ name: 'x'.repeat(201) })
    ]) {
      expect(readPending(bad), JSON.stringify(bad)).toBeNull();
    }
    expect(
      readPending(add({ ids: Array.from({ length: 180 }, (_, i) => 'q' + String(i)) }))
    ).not.toBeNull();
  });
});
