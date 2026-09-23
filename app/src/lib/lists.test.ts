import { describe, expect, it } from 'vitest';
import { encodeList, type DecodedList } from './listLink.js';
import {
  copyInit,
  findListByPayload,
  itemMeta,
  keepLists,
  liftNotes,
  matchLists,
  mergeLists,
  moveEntry,
  pickerOrder,
  stockLeft,
  takenQty,
  takenTotal,
  type LegacyList,
  type StoredList
} from './lists.js';

const list = (id: string, ids: string[] = ['ci1']): StoredList => ({ id, name: id, ids });

describe('reading storage', () => {
  it('keeps what looks like a list', () => {
    expect(keepLists([list('a'), list('b')])).toHaveLength(2);
  });

  it('drops what does not, instead of throwing', () => {
    /* Storage may have been written by an older build, edited by hand, or
       corrupted. One bad entry must not cost the rest. */
    const mixed = [list('a'), null, {}, { id: 'b' }, { ids: [] }, 'nope', list('c')];
    expect(keepLists(mixed).map((l) => l.id)).toEqual(['a', 'c']);
  });

  it('treats anything that is not an array as empty', () => {
    for (const bad of [null, undefined, {}, 'x', 7]) expect(keepLists(bad)).toEqual([]);
  });
});

describe('the note split, applied to lists written before it', () => {
  const old = (): LegacyList => ({
    id: 'old',
    name: 'Shop',
    ids: ['ci1', 'cc1'],
    note: 'Visible to players',
    noteShow: true,
    meta: {
      ci1: { qty: 2, note: 'Also visible', noteShow: true },
      cc1: { note: "The GM's own" }
    }
  });

  it('reads the split off the flag rather than guessing', () => {
    /* `noteShow` meant "copy this along with the item", which is precisely the
       note meant for players */
    const moved = liftNotes(old());
    expect(moved.note).toBe('Visible to players');
    expect(moved.hnote).toBeUndefined();
  });

  it('applies the same rule to every entry', () => {
    const moved = liftNotes(old());
    expect(moved.meta?.['ci1']?.note).toBe('Also visible');
    expect(moved.meta?.['ci1']?.hnote).toBeUndefined();
    expect(moved.meta?.['cc1']?.hnote).toBe("The GM's own");
    expect(moved.meta?.['cc1']?.note).toBeUndefined();
  });

  it('keeps everything else about an entry', () => {
    expect(liftNotes(old()).meta?.['ci1']?.qty).toBe(2);
  });

  it('leaves no flag behind', () => {
    const moved = liftNotes(old()) as unknown as Record<string, unknown>;
    expect('noteShow' in moved).toBe(false);
    expect(JSON.stringify(moved)).not.toContain('noteShow');
  });

  it('does not touch the list it was given', () => {
    const before = old();
    liftNotes(before);
    expect(before.note).toBe('Visible to players');
  });
});

describe('two tabs', () => {
  it('keep this tab order, and this tab wins on a shared id', () => {
    const mine = [list('b'), list('a')];
    const stored = [list('a', ['zzz']), list('c')];
    const out = mergeLists(mine, stored);
    expect(out.map((l) => l.id)).toEqual(['b', 'a', 'c']);
    expect(out[1]?.ids).toEqual(['ci1']);
  });

  it('keep a list only the other tab has', () => {
    /* Before the merge existed, saving here destroyed it silently, with no
       server and no export to recover from */
    expect(mergeLists([list('a')], [list('b')]).map((l) => l.id)).toEqual(['a', 'b']);
  });

  it('do not resurrect one this tab deleted', () => {
    /* Deleted here means absent from `mine` - the same as never having had it.
       Only `deleted` tells the two apart. */
    expect(mergeLists([list('a')], [list('b')], { b: true }).map((l) => l.id)).toEqual(['a']);
  });

  it('still take back a list the other tab created after the delete', () => {
    expect(
      mergeLists([list('a')], [list('b'), list('c')], { b: true }).map((l) => l.id)
    ).toEqual(['a', 'c']);
  });

  it('survive empty storage', () => {
    expect(mergeLists([list('a')], []).map((l) => l.id)).toEqual(['a']);
    expect(mergeLists([], [list('a')]).map((l) => l.id)).toEqual(['a']);
  });
});

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
});

describe('findListByPayload', () => {
  const knows = (id: string): boolean => ['ci1', 'ci2'].includes(id);

  const stored: StoredList = {
    id: 'a',
    name: 'Тайник',
    ids: ['ci1', 'ci2'],
    hnote: 'Только для мастера'
  };

  it('recognises its own players’ payload even though it carries no GM note', () => {
    const payload = encodeList(stored, true);
    expect(findListByPayload([stored], payload, knows)).toBe(stored);
  });

  it('recognises its own GM payload', () => {
    const payload = encodeList(stored, false);
    expect(findListByPayload([stored], payload, knows)).toBe(stored);
  });

  it('does not match a renamed list', () => {
    const payload = encodeList(stored, true);
    const renamed: StoredList = { ...stored, name: 'Другое имя' };
    expect(findListByPayload([renamed], payload, knows)).toBeNull();
  });

  it('does not match a reordered list', () => {
    const payload = encodeList(stored, true);
    const reordered: StoredList = { ...stored, ids: ['ci2', 'ci1'] };
    expect(findListByPayload([reordered], payload, knows)).toBeNull();
  });

  it('does not match when the payload carries a price the store does not have', () => {
    const priced: StoredList = { ...stored, meta: { ci1: { gold: 100 } } };
    const payload = encodeList(priced, true);
    expect(findListByPayload([stored], payload, knows)).toBeNull();
  });

  it('is null for a payload that will not decode', () => {
    expect(findListByPayload([stored], 'not-a-real-payload', knows)).toBeNull();
  });
});

describe('copyInit', () => {
  it('copiesIdsMetaMoneyAndBothNotes', () => {
    const meta = { ci1: { qty: 5, gold: 50, note: 'Видно игрокам' } };
    const decoded: DecodedList = {
      name: 'Тайник',
      ids: ['ci1', 'ci2'],
      money: 'coin',
      note: 'Видно игрокам',
      hnote: 'Только для ГМ',
      meta,
      dropped: 0
    };
    const init = copyInit(decoded);
    expect(init).toEqual({
      ids: ['ci1', 'ci2'],
      money: 'coin',
      note: 'Видно игрокам',
      hnote: 'Только для ГМ',
      meta
    });
    expect(init.meta?.['ci1']).not.toBe(meta.ci1);
    expect(init.ids).not.toBe(decoded.ids);
  });

  it('leavesOutWhatTheLinkDoesNotCarry', () => {
    const decoded: DecodedList = { name: 'X', ids: ['ci1'], dropped: 0 };
    expect(copyInit(decoded)).toEqual({ ids: ['ci1'] });
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
