import { describe, expect, it } from 'vitest';
import {
  itemMeta,
  keepLists,
  liftNotes,
  mergeLists,
  moveEntry,
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
