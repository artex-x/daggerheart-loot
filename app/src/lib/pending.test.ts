import { describe, expect, it } from 'vitest';
import { printAction, readPending } from './pending.js';

const HID = '00000000-0000-4000-8000-000000000511';

const add = (over: Record<string, unknown> = {}) => ({
  do: 'addToList',
  key: 'sel',
  ids: ['ci1', 'q1'],
  ...over
});

describe('readPending', () => {
  it('reads every action', () => {
    expect(readPending({ do: 'saveList', extra: 1 })).toEqual({ do: 'saveList' });
    expect(readPending({ do: 'saveItem', hid: HID, extra: 1 })).toEqual({
      do: 'saveItem',
      hid: HID
    });
    expect(readPending({ do: 'saveItem', id: 'dve19' })).toEqual({
      do: 'saveItem',
      id: 'dve19'
    });
    expect(readPending(add({ picked: { ci1: 2 } }))).toEqual({
      do: 'addToList',
      key: 'sel',
      ids: ['ci1', 'q1'],
      picked: { ci1: 2 }
    });
    /* An older tab wrote a typed list name; it reads back without it and still reopens the menu. */
    expect(readPending(add({ name: 'Клад' }))).toEqual({
      do: 'addToList',
      key: 'sel',
      ids: ['ci1', 'q1']
    });
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
      { do: 'saveItem' },
      { do: 'saveItem', hid: 'hb_emberaxeaaaaaaaa' },
      { do: 'saveItem', hid: HID + '0' },
      { do: 'saveItem', hid: 7 },
      { do: 'saveItem', id: 'bad id' },
      { do: 'saveItem', id: 'x'.repeat(65) },
      { do: 'saveItem', id: 7 },
      { do: 'saveItem', id: 'hb_emberaxeaaaaaaaa' },
      { do: 'saveItem', hid: HID, id: 'dve19' }
    ]) {
      expect(readPending(bad), JSON.stringify(bad)).toBeNull();
    }
    expect(
      readPending(add({ ids: Array.from({ length: 180 }, (_, i) => 'q' + String(i)) }))
    ).not.toBeNull();
  });
});

describe('the print action', () => {
  const ks = (n: number) => Array.from({ length: n }, (_, i) => ({ k: 'c' + String(i) }));
  const print = (over: Record<string, unknown> = {}) => ({
    do: 'print',
    entries: ks(1),
    ...over
  });

  it('reads 1 and 180 entries, with and without the count cut', () => {
    expect(readPending(print())).toEqual({ do: 'print', entries: [{ k: 'c0' }] });
    expect(readPending(print({ entries: ks(180) }))).toMatchObject({ do: 'print' });
    expect(readPending(print({ entries: [{ h: HID, q: 3 }], cut: 1 }))).toEqual({
      do: 'print',
      entries: [{ h: HID, q: 3 }],
      cut: 1
    });
    expect(readPending(print({ cut: 9999 }))).toMatchObject({ cut: 9999 });
  });

  it('refuses an action with no entry, past 180, a bad entry or a bad cut', () => {
    for (const bad of [
      print({ entries: [] }),
      print({ entries: ks(181) }),
      print({ entries: 'ci1' }),
      print({ entries: [{ k: 'ci1', q: 1 }] }),
      print({ cut: 0 }),
      print({ cut: -1 }),
      print({ cut: 1.5 }),
      print({ cut: 10000 }),
      print({ cut: '1' })
    ]) {
      expect(readPending(bad), JSON.stringify(bad)).toBeNull();
    }
  });

  it('copies each entry it reads', () => {
    const entries = [{ k: 'ci1' }];
    const read = readPending({ do: 'print', entries });
    expect(read && read.do === 'print' && read.entries[0]).not.toBe(entries[0]);
  });

  it('builds the action with the cut only over 0', () => {
    expect(printAction({ entries: [{ k: 'ci1' }], cut: 0 })).toEqual({
      do: 'print',
      entries: [{ k: 'ci1' }]
    });
    expect(printAction({ entries: [{ k: 'ci1' }], cut: 2 })).toEqual({
      do: 'print',
      entries: [{ k: 'ci1' }],
      cut: 2
    });
  });
});
