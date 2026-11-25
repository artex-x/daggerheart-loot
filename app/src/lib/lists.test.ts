import { describe, expect, it } from 'vitest';
import {
  copyMeta,
  gmOnlyCount,
  itemMeta,
  matchLists,
  moveEntry,
  narrowEntries,
  pickerOrder,
  stockLeft,
  takenQty,
  takenRows,
  takenTotal,
  withIds,
  withMeta,
  type StoredList
} from './lists.js';
import { parseQuery } from './search.js';
import type { Record_ } from './types.js';

const list = (id: string, ids: string[] = ['ci1']): StoredList => ({ id, name: id, ids });

describe('reordering', () => {
  const ids = ['a', 'b', 'c', 'd', 'e'];

  it('moves an entry to the position that was typed', () => {
    expect(moveEntry(ids, 4, 1)).toEqual(['a', 'e', 'b', 'c', 'd']);
    expect(moveEntry(ids, 0, 2)).toEqual(['b', 'c', 'a', 'd', 'e']);
  });

  it('clamps a position past the end instead of losing the entry', () => {
    expect(moveEntry(ids, 0, 99)).toEqual(['b', 'c', 'd', 'e', 'a']);
    expect(moveEntry(ids, 4, -3)).toEqual(['e', 'a', 'b', 'c', 'd']);
  });

  it('ignores a source that is not there', () => {
    expect(moveEntry(ids, 9, 0)).toEqual(ids);
  });

  it('does not touch the array it was given', () => {
    const before = [...ids];
    moveEntry(ids, 0, 3);
    expect(ids).toEqual(before);
  });
});

describe('entry meta', () => {
  it('is empty rather than missing on a list saved before it existed', () => {
    expect(itemMeta(list('a'), 'ci1')).toEqual({});
    expect(itemMeta({ ...list('a'), meta: { ci1: { qty: 3 } } }, 'ci1').qty).toBe(3);
  });

  it('sets the GM-only mark, and false removes it with the emptied meta', () => {
    const on = withMeta(list('a'), 'ci1', 'gmOnly', true);
    expect(on.meta).toEqual({ ci1: { gmOnly: true } });
    expect(withMeta(on, 'ci1', 'gmOnly', false)).not.toHaveProperty('meta');
  });

  it('never carries the GM-only mark into an add', () => {
    const added = withIds(list('a', []), ['ci1', 'q1'], {
      ci1: { gmOnly: true, qty: 2 },
      q1: { gmOnly: true }
    });
    expect(added.meta).toEqual({ ci1: { qty: 2 } });
  });
});

describe('a selection taken count', () => {
  it('takes the whole stock when nothing was picked', () => {
    expect(takenQty({ qty: 5 })).toBe(5);
    expect(takenQty({})).toBe(1);
  });

  it('holds a picked count to 1..stock and drops a fraction', () => {
    expect(takenQty({ qty: 5 }, 0)).toBe(1);
    expect(takenQty({ qty: 5 }, 9)).toBe(5);
    expect(takenQty({ qty: 5 }, 2.7)).toBe(2);
  });

  it('leaves the rest of the stock, and 0 when all of it is taken', () => {
    expect(stockLeft({ qty: 5 }, 2)).toBe(3);
    expect(stockLeft({ qty: 2 }, 2)).toBe(0);
    expect(stockLeft({}, 1)).toBe(0);
  });

  it('sums the priced taken entries in coins and counts the unpriced ones', () => {
    const meta: Record<string, { qty?: number; gold?: number }> = {
      a: { qty: 2 },
      b: { qty: 5, gold: 50 },
      c: { gold: 12 }
    };
    const taken: Record<string, number> = { a: 2, b: 2, c: 1 };
    expect(
      takenTotal(
        ['a', 'b', 'c'],
        (id) => meta[id] ?? {},
        (id) => taken[id] ?? 1
      )
    ).toEqual({ coins: 112, unpriced: 1, pieces: 5 });
  });

  it('counts the taken pieces over priced and unpriced entries alike', () => {
    const meta: Record<string, { qty?: number; gold?: number }> = {
      a: { qty: 3, gold: 40 },
      b: { qty: 2, gold: 750 },
      c: { gold: 120 },
      d: { qty: 5 }
    };
    const taken: Record<string, number> = { a: 1, b: 2, c: 1, d: 5 };
    expect(
      takenTotal(
        ['a', 'b', 'c', 'd'],
        (id) => meta[id] ?? {},
        (id) => taken[id] ?? 1
      )
    ).toEqual({ coins: 1660, unpriced: 1, pieces: 9 });
  });

  it('is zero with nothing ticked', () => {
    expect(
      takenTotal(
        [],
        () => ({}),
        () => 1
      )
    ).toEqual({ coins: 0, unpriced: 0, pieces: 0 });
  });
});

describe('gmOnlyCount', () => {
  const l: StoredList = {
    ...list('a', ['ci1', 'ci2', 'ci3']),
    meta: { ci1: { gmOnly: true }, ci2: { qty: 2 }, ci3: { gmOnly: true, note: 'x' } }
  };
  const metaOf = (id: string) => itemMeta(l, id);

  it('counts none when no entry is marked', () => {
    expect(gmOnlyCount(['ci2'], metaOf)).toBe(0);
    expect(gmOnlyCount([], metaOf)).toBe(0);
  });

  it('counts one marked entry', () => {
    expect(gmOnlyCount(['ci1', 'ci2'], metaOf)).toBe(1);
  });

  it('counts every entry when all are marked', () => {
    expect(gmOnlyCount(['ci1', 'ci3'], metaOf)).toBe(2);
  });
});

describe('finding a list by name', () => {
  const named = (id: string, name: string, created?: number): StoredList =>
    created === undefined ? { id, name, ids: [] } : { id, name, ids: [], created };
  const lists = [
    named('a', 'Порт Ветров'),
    named('b', 'Рынок'),
    named('c', 'Трофеи ёжа'),
    named('d', 'Лавка в порту')
  ];

  it('keeps every list, in order, for an empty or blank query', () => {
    expect(matchLists(lists, '').map((l) => l.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(matchLists(lists, '   ').map((l) => l.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('folds case and ё the way search does', () => {
    expect(matchLists(lists, 'ЕЖ').map((l) => l.id)).toEqual(['c']);
  });

  it('matches a part of the name, not a list without it', () => {
    expect(matchLists(lists, 'порт').map((l) => l.id)).toEqual(['a', 'd']);
  });

  it('answers the same on every keystroke, and reads a renamed list by its new name', () => {
    const one = named('x', 'Склад');
    expect(matchLists([one], 'скл').map((l) => l.id)).toEqual(['x']);
    expect(matchLists([one], 'склад').map((l) => l.id)).toEqual(['x']);
    one.name = 'Рынок';
    expect(matchLists([one], 'скл')).toEqual([]);
    expect(matchLists([one], 'рын').map((l) => l.id)).toEqual(['x']);
  });

  it('puts the lists that pass first ahead of the rest, each group newest first', () => {
    const mixed = [
      named('old', 'a', 1),
      named('held-old', 'b', 2),
      named('none', 'c'),
      named('new', 'd', 4),
      named('held-new', 'e', 3)
    ];
    const held = new Set(['held-old', 'held-new']);
    expect(pickerOrder(mixed, (l) => held.has(l.id)).map((l) => l.id)).toEqual([
      'held-new',
      'held-old',
      'new',
      'old',
      'none'
    ]);
  });

  it('is plain newest first when no list passes', () => {
    const three = [named('x', 'x', 1), named('y', 'y', 3), named('z', 'z', 2)];
    expect(pickerOrder(three, () => false).map((l) => l.id)).toEqual(['y', 'z', 'x']);
  });
});

describe('narrowEntries', () => {
  const rec = (id: string, kind: 'item' | 'consumable', en: string): Record_ => ({
    id,
    src: 'core',
    kind,
    en,
    ru: en,
    ende: '',
    rud: ''
  });
  const rows = [
    { id: 'a', it: rec('a', 'item', 'Rope') },
    { id: 'gone', it: null },
    { id: 'b', it: rec('b', 'consumable', 'Potion') },
    { id: 'c', it: rec('c', 'item', 'Ropeladder') }
  ];

  it('passes every row with no value in force and no term', () => {
    expect(narrowEntries(rows, {}, [], () => '').map((r) => r.at)).toEqual([0, 1, 2, 3]);
  });

  it('keeps the true index while a value or a term narrows, and drops a row with no record', () => {
    expect(
      narrowEntries(rows, { kind: ['item'] }, [], () => '').map((r) => [r.id, r.at])
    ).toEqual([
      ['a', 0],
      ['c', 3]
    ]);
    expect(narrowEntries(rows, {}, parseQuery('potion'), () => '').map((r) => r.at)).toEqual([
      2
    ]);
    expect(narrowEntries(rows, { kind: [] }, [], () => '').length).toBe(4);
  });

  it('narrows 300 rows and keeps their order', () => {
    const many = Array.from({ length: 300 }, (_, i) => ({
      id: String(i),
      it: rec(String(i), i % 3 ? 'item' : 'consumable', 'Thing ' + String(i))
    }));
    const kept = narrowEntries(many, { kind: ['consumable'] }, [], () => '');
    expect(kept.length).toBe(100);
    expect(kept.map((r) => r.at).every((at, i, all) => i === 0 || at > (all[i - 1] ?? 0))).toBe(
      true
    );
  });
});

describe('copyMeta', () => {
  const meta = {
    a: { qty: 3, gold: 50, note: 'для игроков', hnote: 'для мастера' },
    b: { qty: 1 }
  };

  it('keeps the count and drops the fields the toggles switch off, and never the GM note', () => {
    expect(copyMeta(meta, { price: true, note: true })).toEqual({
      a: { qty: 3, gold: 50, note: 'для игроков' },
      b: { qty: 1 }
    });
    expect(copyMeta(meta, { price: false, note: true })['a']).toEqual({
      qty: 3,
      note: 'для игроков'
    });
    expect(copyMeta(meta, { price: true, note: false })['a']).toEqual({ qty: 3, gold: 50 });
    expect(copyMeta(meta, { price: false, note: false })['a']).toEqual({ qty: 3 });
  });
});

describe('takenRows', () => {
  const held: StoredList = {
    id: 'l',
    name: 'Инвентарь',
    ids: ['a', 'x'],
    meta: { a: { qty: 2, gold: 30, note: 'моя' } }
  };
  const lines = [
    { item: 'a', qty: 1 },
    { item: 'b', qty: 4 },
    { item: 'gone', qty: 1 },
    { item: 'hb', qty: 2 }
  ];
  const carry = {
    a: { qty: 1, gold: 50, note: 'чужая' },
    b: { qty: 4, gold: 12, note: 'для игроков' },
    hb: { qty: 2 }
  };
  const knows = (id: string): boolean => id !== 'gone';
  const on = { price: true, note: true };

  it('leaves a held key as it is, adds a new one, and skips a key the data does not know', () => {
    const rows = takenRows(held, lines, carry, knows, on, (k) => k !== 'hb');
    expect(rows.map((r) => r.item)).toEqual(['a', 'b', 'hb']);
    expect(rows[0]).toMatchObject({
      was: 2,
      add: 0,
      becomes: 2,
      held: { qty: 2, gold: 30, note: true },
      refused: false
    });
    expect(rows[1]).toMatchObject({
      was: null,
      add: 4,
      becomes: 4,
      gold: 12,
      note: true,
      held: null
    });
    expect(rows[2]).toMatchObject({ was: null, add: 0, becomes: 0, refused: true });
  });

  it('follows the copy toggles for a new row and never for a held one', () => {
    const off = takenRows(held, lines, carry, knows, { price: false, note: false }, () => true);
    expect(off[1]).toMatchObject({ gold: null, note: false, add: 4 });
    expect(off[0]?.held).toEqual({ qty: 2, gold: 30, note: true });
  });

  it('counts every line as new for a list not made yet, and names a held key with no price or note', () => {
    expect(
      takenRows(null, lines, carry, knows, on, () => true).every((r) => r.held === null)
    ).toBe(true);
    const bare = takenRows(
      { id: 'l', name: 'n', ids: ['x'] },
      [{ item: 'x', qty: 1 }],
      {},
      knows,
      on,
      () => true
    );
    expect(bare[0]?.held).toEqual({ qty: 1, gold: null, note: false });
  });
});
