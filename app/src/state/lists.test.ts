/* The list store, on its own - no component, no router.
 *
 * Read off the live app's `loadLists`..`storageWorks` (app.js 1149-1204) and
 * `createList` (app.js 1320-1330): the v1-to-v2 migration runs once and
 * leaves v1 alone, a save merges with whatever another tab wrote rather than
 * overwriting it, and a refused write keeps the session working. */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dict, type Msg } from '../lib/dict.js';
import { canonicalList } from '../lib/legacy.js';
import type { StoredList } from '../lib/lists.js';
import { brokenStorage, fakeEnv, memoryStorage } from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { ListStore } from './lists.svelte.js';

const t = () => dict('ru');

const at = (over: Partial<Env> = {}): Env => fakeEnv(over);

const said: { msg: string; error?: boolean | undefined }[] = [];
const say = (msg: Msg, error?: boolean): void => {
  said.push({ msg: msg(t(), 'ru'), error });
};

beforeEach(() => {
  said.length = 0;
});

describe('reading what is stored', () => {
  it('reads v2 directly', () => {
    const stored = [{ id: 'a', name: 'Клад', ids: ['w1'], created: 1 }];
    const env = at({ storage: memoryStorage({ 'dhloot.lists.v2': JSON.stringify(stored) }) });
    const store = new ListStore(env, say, t);
    expect(store.lists).toEqual(stored);
  });

  it('migrates v1 once, lifting notes, and leaves v1 untouched', () => {
    const v1 = [{ id: 'a', name: 'Клад', ids: ['w1'], note: 'для игроков', noteShow: true }];
    const storage = memoryStorage({ 'dhloot.lists.v1': JSON.stringify(v1) });
    const env = at({ storage });
    const store = new ListStore(env, say, t);

    expect(store.lists).toEqual([{ id: 'a', name: 'Клад', ids: ['w1'], note: 'для игроков' }]);
    expect(storage.get('dhloot.lists.v1')).toBe(JSON.stringify(v1));
    expect(JSON.parse(storage.get('dhloot.lists.v2') ?? 'null')).toEqual([
      { id: 'a', name: 'Клад', ids: ['w1'], note: 'для игроков' }
    ]);
  });

  it('migrates a hidden note to hnote, not note', () => {
    const v1 = [{ id: 'a', name: 'Клад', ids: [], note: 'только мастеру' }];
    const env = at({ storage: memoryStorage({ 'dhloot.lists.v1': JSON.stringify(v1) }) });
    const store = new ListStore(env, say, t);
    expect(store.lists).toEqual([{ id: 'a', name: 'Клад', ids: [], hnote: 'только мастеру' }]);
  });

  it('is empty with neither key, and is not marked unreadable', () => {
    const store = new ListStore(at(), say, t);
    expect(store.lists).toEqual([]);
    expect(store.unreadable).toBe(false);
  });

  it('is empty on broken JSON, marks itself unreadable, and backs the raw value up once (R1)', () => {
    const env = at({ storage: memoryStorage({ 'dhloot.lists.v2': '{not json' }) });
    const store = new ListStore(env, say, t);
    expect(store.lists).toEqual([]);
    expect(store.unreadable).toBe(true);
    expect(env.storage.get('dhloot.lists.v2.bad')).toBe('{not json');
  });

  it('does not overwrite an existing backup with a second bad read', () => {
    const env = at({
      storage: memoryStorage({
        'dhloot.lists.v2': '{not json',
        'dhloot.lists.v2.bad': 'already backed up'
      })
    });
    new ListStore(env, say, t);
    expect(env.storage.get('dhloot.lists.v2.bad')).toBe('already backed up');
  });

  it('backs up a value that turns corrupt between construction and a later save, rather than silently overwriting it (R1)', () => {
    /* The exact defect this finding named: `load()` and `save()` used to
       catch the same parse failure independently, both treating storage as
       `[]`, so the second one's write replaced the corrupt value with no
       trace of what it had been. */
    const storage = memoryStorage({
      'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'A', ids: [], created: 1 }])
    });
    const store = new ListStore(at({ storage }), say, t);
    store.lists = [{ id: 'a', name: 'A', ids: ['w1'], created: 1 }];

    // another tab, or an extension, writes something this tab cannot read
    storage.set('dhloot.lists.v2', 'not json at all');
    store.save();

    expect(store.unreadable).toBe(true);
    expect(storage.get('dhloot.lists.v2.bad')).toBe('not json at all');
    // this tab's own edit is not lost either - the merge still proceeded
    expect(JSON.parse(storage.get('dhloot.lists.v2') ?? '')).toEqual([
      { id: 'a', name: 'A', ids: ['w1'], created: 1 }
    ]);
  });

  it('clears unreadable once the key is readable again', () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': '{not json' });
    const store = new ListStore(at({ storage }), say, t);
    expect(store.unreadable).toBe(true);

    storage.set('dhloot.lists.v2', JSON.stringify([]));
    expect(store.load()).toEqual([]);
    expect(store.unreadable).toBe(false);
  });
});

describe('saving', () => {
  it('merges with what another tab already wrote, appended after ours', () => {
    const mine = { id: 'a', name: 'Моё', ids: [], created: 2 };
    const theirs = { id: 'b', name: 'Чужое', ids: [], created: 1 };
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([mine, theirs]) });
    const store = new ListStore(at({ storage }), say, t);
    // this tab only knows about `mine` - `theirs` arrived after construction
    store.lists = [mine];
    store.save();
    expect(JSON.parse(storage.get('dhloot.lists.v2') ?? '')).toEqual([mine, theirs]);
  });

  it('says saveFailed and keeps the list in memory when storage refuses', () => {
    const store = new ListStore(at({ storage: brokenStorage() }), say, t);
    store.lists = [{ id: 'a', name: 'Клад', ids: [], created: 1 }];
    const ok = store.save();
    expect(ok).toBe(false);
    expect(said).toEqual([{ msg: t().saveFailed, error: true }]);
    expect(store.lists).toEqual([{ id: 'a', name: 'Клад', ids: [], created: 1 }]);
  });
});

describe('creating a list', () => {
  it('puts the new one first, trims the name, and stamps it', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const store = new ListStore(at(), say, t);
    const existing = { id: 'old', name: 'Старый', ids: [], created: 1 };
    store.lists = [existing];

    const l = store.create('  Клад дракона  ');
    expect(l.name).toBe('Клад дракона');
    expect(l.created).toBe(1000);
    /* `toBe`, not `toEqual`: the store is raw state, so the list a caller
       gets back is the very object the store holds. */
    expect(store.lists[0]).toBe(l);
    expect(store.lists[1]).toEqual(existing);
    vi.restoreAllMocks();
  });

  it('falls back to untitled for a blank name', () => {
    const store = new ListStore(at(), say, t);
    const l = store.create('   ');
    expect(l.name).toBe(t().untitled);
  });

  it('writes ids and meta from init in the one save - a restore', () => {
    const store = new ListStore(at(), say, t);
    const meta = { q26: { qty: 2 } };
    const l = store.create('Оружейная', { ids: ['q26', 'q33'], meta });
    expect(l.ids).toEqual(['q26', 'q33']);
    expect(l.meta).toEqual(meta);
    expect(store.get(l.id)).toEqual(l);
  });

  it('reads saved true after a good write and false after a refused one', () => {
    const good = new ListStore(at(), say, t);
    expect(good.saved).toBe(true);
    good.create('Клад');
    expect(good.saved).toBe(true);

    const bad = new ListStore(at({ storage: brokenStorage() }), say, t);
    bad.create('Клад');
    expect(bad.saved).toBe(false);
  });
});

describe('adding and removing ids', () => {
  const knows = (id: string): boolean => id !== 'ghost';

  it('adds only ids the data knows and the list does not already hold', () => {
    const store = new ListStore(at(), say, t);
    const l = { id: 'a', name: 'Клад', ids: ['w1'], created: 1 };
    store.lists = [l];

    const fresh = store.addIds(l, ['w1', 'w2', 'ghost'], knows);
    expect(fresh).toEqual(['w2']);
    expect(store.get('a')?.ids).toEqual(['w1', 'w2']);
  });

  it('removes an id', () => {
    const store = new ListStore(at(), say, t);
    const l = { id: 'a', name: 'Клад', ids: ['w1', 'w2'], created: 1 };
    store.lists = [l];

    store.removeId(l, 'w1');
    expect(store.get('a')?.ids).toEqual(['w2']);
  });

  it('copies qty above 1, gold above 0 and note, never hnote, for fresh ids only', () => {
    const store = new ListStore(at(), say, t);
    const l = { id: 'a', name: 'Клад', ids: [], created: 1 };
    store.lists = [l];

    store.addIds(l, ['w1', 'w2', 'w3'], knows, {
      w1: { qty: 5, gold: 50, note: 'x', hnote: 'y' },
      w2: { gold: 12 },
      w3: { qty: 1 }
    });

    expect(store.get('a')?.meta).toEqual({
      w1: { qty: 5, gold: 50, note: 'x' },
      w2: { gold: 12 }
    });
  });

  it('leaves an id already in the list with its own meta untouched', () => {
    const store = new ListStore(at(), say, t);
    const l = { id: 'a', name: 'Клад', ids: ['w1'], created: 1, meta: { w1: { qty: 3 } } };
    store.lists = [l];

    store.addIds(l, ['w1', 'w2'], knows, { w1: { qty: 9 }, w2: { qty: 5 } });

    expect(store.get('a')?.meta).toEqual({ w1: { qty: 3 }, w2: { qty: 5 } });
  });

  it('leaves list.meta exactly as it was when called without meta', () => {
    const store = new ListStore(at(), say, t);
    const l = { id: 'a', name: 'Клад', ids: [], created: 1 };
    store.lists = [l];

    store.addIds(l, ['w1'], knows);

    expect(store.get('a')?.meta).toBeUndefined();
  });

  it('adds by id and saves, the same as addIds and save', () => {
    const storage = memoryStorage();
    const store = new ListStore(at({ storage }), say, t);
    const l = { id: 'a', name: 'Клад', ids: ['w1'], created: 1 };
    store.lists = [l];

    expect(
      store.add('a', ['w1', 'w2', 'ghost'], knows, { w2: { qty: 2, hnote: 'h' } })
    ).toEqual(['w2']);
    const twin = new ListStore(at(), say, t);
    twin.lists = [l];
    twin.addIds(l, ['w1', 'w2', 'ghost'], knows, { w2: { qty: 2, hnote: 'h' } });
    expect(store.get('a')).toEqual(twin.get('a'));
    expect(JSON.parse(storage.get('dhloot.lists.v2') ?? 'null')).toEqual([twin.get('a')]);
    expect(store.add('nope', ['w3'], knows)).toEqual([]);
  });
});

describe('removing a list', () => {
  it('drops it from memory and storage, and returns it with its old index (P5)', () => {
    const l = { id: 'a', name: 'Клад', ids: [], created: 1 };
    const other = { id: 'b', name: 'Другой', ids: [], created: 2 };
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([other, l]) });
    const store = new ListStore(at({ storage }), say, t);

    const removed = store.remove('a');
    expect(removed).toEqual({ list: l, index: 1 });
    expect(store.lists).toEqual([other]);
    expect(JSON.parse(storage.get('dhloot.lists.v2') ?? '')).toEqual([other]);
  });

  it('reports undefined for an id already gone', () => {
    const store = new ListStore(at(), say, t);
    expect(store.remove('ghost')).toBeUndefined();
  });

  describe('restoreList - the undo', () => {
    it('splices the list back at its old index and saves', () => {
      const l = { id: 'a', name: 'Клад', ids: [], created: 1 };
      const other = { id: 'b', name: 'Другой', ids: [], created: 2 };
      const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([other, l]) });
      const store = new ListStore(at({ storage }), say, t);
      const removed = store.remove('a')!;

      store.restoreList(removed.list, removed.index);
      expect(store.lists).toEqual([other, l]);
      expect(JSON.parse(storage.get('dhloot.lists.v2') ?? '')).toEqual([other, l]);
    });

    it('unsets #deleted too, so a plain reload does not filter the list back out', () => {
      const l = { id: 'a', name: 'Клад', ids: [], created: 1 };
      const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([l]) });
      const store = new ListStore(at({ storage }), say, t);
      const removed = store.remove('a')!;
      store.restoreList(removed.list, removed.index);

      expect(store.load()).toEqual([l]);
    });
  });

  it('does not come back through a merge with another tab that still has it', () => {
    /* The `#deleted` set is what tells "I removed it" apart from "I never had
       it" - without it, a save's own merge would take the other tab's copy
       right back. */
    const l = { id: 'a', name: 'Клад', ids: [], created: 1 };
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([l]) });
    const store = new ListStore(at({ storage }), say, t);
    store.remove('a');

    // another tab's still-unmerged copy of the deleted list lands in storage
    storage.set('dhloot.lists.v2', JSON.stringify([l]));
    store.save();
    expect(JSON.parse(storage.get('dhloot.lists.v2') ?? '')).toEqual([]);
  });

  it('does not come back through a reload either', () => {
    /* save()'s own merge already filtered #deleted (the test above) - this
       is the same guard on the plain-read side, reachable through watch()'s
       reload rather than a write. */
    const l = { id: 'a', name: 'Клад', ids: [], created: 1 };
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([l]) });
    const store = new ListStore(at({ storage }), say, t);
    store.remove('a');

    // another tab's still-unmerged copy lands in storage and this tab reloads
    storage.set('dhloot.lists.v2', JSON.stringify([l]));
    expect(store.load()).toEqual([]);
  });
});

describe('watching for another tab', () => {
  /* `memoryStorage` never fires its own listeners on `set` - nothing here
     simulates two tabs sharing one `Storage` object - so `fireExternalChange`
     stands in for the browser's own `storage` event (R2's own test hook). */

  it('reloads on the lists key', () => {
    const storage = memoryStorage({
      'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'A', ids: [], created: 1 }])
    });
    const store = new ListStore(at({ storage }), say, t);
    store.watch();

    // the other tab's write lands in the same key
    storage.set(
      'dhloot.lists.v2',
      JSON.stringify([{ id: 'b', name: 'B', ids: [], created: 2 }])
    );
    storage.fireExternalChange('dhloot.lists.v2');
    expect(store.lists).toEqual([{ id: 'b', name: 'B', ids: [], created: 2 }]);
  });

  it('ignores every other key', () => {
    const storage = memoryStorage({
      'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'A', ids: [], created: 1 }])
    });
    const store = new ListStore(at({ storage }), say, t);
    store.watch();

    storage.set('dhloot.lang.v1', 'en');
    storage.fireExternalChange('dhloot.lang.v1');
    expect(store.lists).toEqual([{ id: 'a', name: 'A', ids: [], created: 1 }]);
  });

  it('also reloads on a null key - a cleared storage, or this tab catching up after being backgrounded (R2)', () => {
    const storage = memoryStorage({
      'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'A', ids: [], created: 1 }])
    });
    const store = new ListStore(at({ storage }), say, t);
    store.watch();

    storage.set(
      'dhloot.lists.v2',
      JSON.stringify([{ id: 'b', name: 'B', ids: [], created: 2 }])
    );
    storage.fireExternalChange(null);
    expect(store.lists).toEqual([{ id: 'b', name: 'B', ids: [], created: 2 }]);
  });

  it('keeps the same array when an external signal finds nothing new in storage', () => {
    const storage = memoryStorage({
      'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'A', ids: [], created: 1 }])
    });
    const store = new ListStore(at({ storage }), say, t);
    store.watch();
    store.rename('a', 'Б');
    const drawn = store.lists;

    storage.fireExternalChange(null);
    expect(store.lists).toBe(drawn);
    storage.fireExternalChange('dhloot.lists.v2');
    expect(store.lists).toBe(drawn);
  });

  it('keeps a refused edit on screen when a signal finds storage unchanged', () => {
    const storage = memoryStorage({
      'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'A', ids: [], created: 1 }])
    });
    const store = new ListStore(at({ storage }), say, t);
    store.watch();
    storage.set = () => false;
    store.rename('a', 'Б');
    expect(store.saved).toBe(false);

    storage.fireExternalChange(null);
    expect(store.lists).toEqual([{ id: 'a', name: 'Б', ids: [], created: 1 }]);
  });

  it('reloads when another tab changed the stored value since this tab drew it', () => {
    const storage = memoryStorage({
      'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'A', ids: [], created: 1 }])
    });
    const store = new ListStore(at({ storage }), say, t);
    store.watch();
    store.rename('a', 'Б');

    storage.set(
      'dhloot.lists.v2',
      JSON.stringify([{ id: 'a', name: 'В', ids: [], created: 1 }])
    );
    storage.fireExternalChange(null);
    expect(store.lists).toEqual([{ id: 'a', name: 'В', ids: [], created: 1 }]);
  });

  it("shows another tab's list on the next signal after a save merged it in", () => {
    const mine = { id: 'a', name: 'A', ids: [], created: 1 };
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([mine]) });
    const store = new ListStore(at({ storage }), say, t);
    store.watch();

    // another tab's list lands in storage with no signal yet
    const theirs = { id: 'x', name: 'X', ids: [], created: 2 };
    storage.set('dhloot.lists.v2', JSON.stringify([mine, theirs]));
    store.rename('a', 'Б');
    expect(store.lists.map((l) => l.id)).toEqual(['a']);

    storage.fireExternalChange(null);
    expect(store.lists.map((l) => l.id)).toEqual(['a', 'x']);
  });

  it('does not parse the stored value it last wrote', () => {
    const storage = memoryStorage({
      'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'A', ids: [], created: 1 }])
    });
    const store = new ListStore(at({ storage }), say, t);
    const parse = vi.spyOn(JSON, 'parse');
    try {
      store.rename('a', 'Б');
      store.rename('a', 'БВ');
      expect(parse).not.toHaveBeenCalled();
    } finally {
      parse.mockRestore();
    }
    expect(JSON.parse(storage.get('dhloot.lists.v2') ?? '')).toEqual([
      { id: 'a', name: 'БВ', ids: [], created: 1 }
    ]);
  });

  it('stops on unsubscribe', () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([]) });
    const store = new ListStore(at({ storage }), say, t);
    const stop = store.watch();
    stop();

    storage.set(
      'dhloot.lists.v2',
      JSON.stringify([{ id: 'b', name: 'B', ids: [], created: 2 }])
    );
    storage.fireExternalChange('dhloot.lists.v2');
    expect(store.lists).toEqual([]);
  });
});

/* The list page's own writers - app.js 1211-1231, 3944-3969, 4086-4094,
   4421-4434. Every one ends in a save, so each test reads storage back
   rather than only memory. */
describe('the list page writers', () => {
  const seed = (l: { id: string; name: string; ids: string[] } & Record<string, unknown>) => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([l]) });
    const store = new ListStore(at({ storage }), say, t);
    const stored = (): unknown => JSON.parse(storage.get('dhloot.lists.v2') ?? 'null');
    return { store, stored };
  };

  describe('rename', () => {
    it('keeps whatever was typed, with no trim', () => {
      const { store, stored } = seed({ id: 'a', name: 'Old', ids: [] });
      store.rename('a', '  Тайник  ');
      expect(store.get('a')?.name).toBe('  Тайник  ');
      expect((stored() as { name: string }[])[0]?.name).toBe('  Тайник  ');
    });
  });

  describe('setMeta', () => {
    it('sets a truthy value and prunes an entry emptied by a falsy one', () => {
      const { store } = seed({ id: 'a', name: 'A', ids: ['ci1'] });
      store.setMeta('a', 'ci1', 'qty', 3);
      expect(store.get('a')?.meta).toEqual({ ci1: { qty: 3 } });

      store.setMeta('a', 'ci1', 'qty', 0);
      expect(store.get('a')?.meta).toBeUndefined();
    });

    it('keeps a sibling field when only one is cleared', () => {
      const { store } = seed({ id: 'a', name: 'A', ids: ['ci1'] });
      store.setMeta('a', 'ci1', 'qty', 2);
      store.setMeta('a', 'ci1', 'gold', 750);
      store.setMeta('a', 'ci1', 'gold', 0);
      expect(store.get('a')?.meta).toEqual({ ci1: { qty: 2 } });
    });
  });

  describe('setNote', () => {
    it('trims the text and deletes the key when it is blank', () => {
      const { store } = seed({ id: 'a', name: 'A', ids: [] });
      store.setNote('a', 'note', '  Лавка закрыта  ');
      expect(store.get('a')?.note).toBe('Лавка закрыта');
      store.setNote('a', 'note', '   ');
      expect(store.get('a')?.note).toBeUndefined();
    });

    it('writes hnote and note independently', () => {
      const { store } = seed({ id: 'a', name: 'A', ids: [] });
      store.setNote('a', 'hnote', 'Только для мастера');
      expect(store.get('a')?.hnote).toBe('Только для мастера');
      expect(store.get('a')?.note).toBeUndefined();
    });
  });

  describe('setMoney', () => {
    it('stores coin mode and deletes the key for the default bag mode', () => {
      const { store } = seed({ id: 'a', name: 'A', ids: [] });
      store.setMoney('a', 'coin');
      expect(store.get('a')?.money).toBe('coin');
      store.setMoney('a', 'bag');
      expect(store.get('a')?.money).toBeUndefined();
    });
  });

  describe('move', () => {
    it('reorders and reports true when the position actually changes', () => {
      const { store } = seed({ id: 'a', name: 'A', ids: ['x', 'y', 'z'] });
      expect(store.move('a', 'z', 0)).toBe(true);
      expect(store.get('a')?.ids).toEqual(['z', 'x', 'y']);
    });

    it('reports false and does not save when the position does not change', () => {
      const { store } = seed({ id: 'a', name: 'A', ids: ['x', 'y', 'z'] });
      expect(store.move('a', 'x', 0)).toBe(false);
      expect(store.get('a')?.ids).toEqual(['x', 'y', 'z']);
    });

    it('reports false for an entry the list does not have', () => {
      const { store } = seed({ id: 'a', name: 'A', ids: ['x'] });
      expect(store.move('a', 'ghost', 0)).toBe(false);
    });
  });

  describe('restoreEntry', () => {
    it('splices the entry back at its old position and restores its meta', () => {
      const { store } = seed({ id: 'a', name: 'A', ids: ['x', 'z'], meta: {} });
      store.restoreEntry('a', 'y', 1, { qty: 2 });
      expect(store.get('a')?.ids).toEqual(['x', 'y', 'z']);
      expect(store.get('a')?.meta).toEqual({ y: { qty: 2 } });
    });

    it('clamps a position past the end', () => {
      const { store } = seed({ id: 'a', name: 'A', ids: ['x'] });
      store.restoreEntry('a', 'y', 99, {});
      expect(store.get('a')?.ids).toEqual(['x', 'y']);
    });

    it('does nothing when the entry is already there', () => {
      const { store } = seed({ id: 'a', name: 'A', ids: ['x', 'y'] });
      store.restoreEntry('a', 'y', 0, { qty: 5 });
      expect(store.get('a')?.ids).toEqual(['x', 'y']);
      expect(store.get('a')?.meta).toBeUndefined();
    });
  });

  describe('removeEntry', () => {
    it('removes the id and saves, leaving the list itself alone', () => {
      const { store, stored } = seed({ id: 'a', name: 'A', ids: ['x', 'y'] });
      store.removeEntry('a', 'x');
      expect(store.get('a')?.ids).toEqual(['y']);
      expect(store.lists).toHaveLength(1);
      expect((stored() as { ids: string[] }[])[0]?.ids).toEqual(['y']);
    });

    it('does nothing for a list that does not exist', () => {
      const { store } = seed({ id: 'a', name: 'A', ids: ['x'] });
      store.removeEntry('ghost', 'x');
      expect(store.get('a')?.ids).toEqual(['x']);
    });
  });
});

describe('the move into the account: removal and dhloot.migrated.v1', () => {
  const A = { id: 'a', name: 'Клад дракона', ids: ['ci1'], created: 1 };
  const B = { id: 'b', name: 'Лавка в порту', ids: [], created: 2 };
  const C = { id: 'c', name: 'Сундук', ids: ['q1'], created: 3 };
  const seedOf = (lists: unknown[], more: Record<string, string> = {}) =>
    memoryStorage({ 'dhloot.lists.v2': JSON.stringify(lists), ...more });
  const pair = (l: StoredList, accountId: string) => ({
    localId: l.id,
    accountId,
    canonical: canonicalList(l),
    name: l.name
  });
  const migratedOf = (storage: { get(k: string): string | null }) =>
    JSON.parse(storage.get('dhloot.migrated.v1') ?? 'null') as Record<string, unknown> | null;
  const storedIds = (storage: { get(k: string): string | null }) =>
    (JSON.parse(storage.get('dhloot.lists.v2') ?? '[]') as { id: string }[]).map((l) => l.id);

  it('removes by id against fresh storage another tab grew, keeping its list', () => {
    const storage = seedOf([A, B]);
    const store = new ListStore(at({ storage }), say, t);
    storage.set('dhloot.lists.v2', JSON.stringify([A, B, C]));
    expect(store.removeMany(['a'])).toBe(true);
    expect(storedIds(storage)).toEqual(['b', 'c']);
    expect(store.lists.map((l) => l.id)).toEqual(['b', 'c']);
    /* Remembered: another tab's stale copy does not bring it back. */
    storage.set('dhloot.lists.v2', JSON.stringify([A, B, C]));
    const off = store.watch();
    storage.fireExternalChange('dhloot.lists.v2');
    off();
    expect(store.lists.map((l) => l.id)).toEqual(['b', 'c']);
  });

  it('reports a refused removal through saved', () => {
    const storage = seedOf([A, B]);
    const store = new ListStore(at({ storage }), say, t);
    storage.set = () => false;
    expect(store.removeMany(['a'])).toBe(false);
    expect(store.saved).toBe(false);
    expect(said.at(-1)?.msg).toBe(t().saveFailed);
  });

  it('settles an unchanged pair: tombstoned, named, and removed after the tombstone is written', () => {
    const storage = seedOf([A, B]);
    const order: string[] = [];
    const set = storage.set.bind(storage);
    storage.set = (k, v) => {
      order.push(k);
      return set(k, v);
    };
    const store = new ListStore(at({ storage }), say, t);
    const r = store.settleMove('u1', [pair(A, 'x1')]);
    expect(r?.removed.map((m) => [m.list.id, m.accountId])).toEqual([['a', 'x1']]);
    expect(r?.changed).toEqual([]);
    expect(order).toEqual(['dhloot.migrated.v1', 'dhloot.lists.v2']);
    expect(migratedOf(storage)).toEqual({
      owner: 'u1',
      lists: { a: 'x1' },
      notice: ['Клад дракона']
    });
    expect(storedIds(storage)).toEqual(['b']);
    expect(store.lists.map((l) => l.id)).toEqual(['b']);
  });

  it('holds a changed pair: kept in storage and in memory, neither tombstoned nor named', () => {
    const storage = seedOf([{ ...A, name: 'Переименован' }, B]);
    const store = new ListStore(at({ storage }), say, t);
    const r = store.settleMove('u1', [pair(A, 'x1'), pair(B, 'x2')]);
    expect(r?.changed).toEqual(['a']);
    expect(migratedOf(storage)).toEqual({
      owner: 'u1',
      lists: { b: 'x2' },
      notice: ['Лавка в порту'],
      held: ['a']
    });
    expect(storedIds(storage)).toEqual(['a']);
    expect(store.lists.map((l) => l.id)).toEqual(['a']);
  });

  it('compares a list another tab tombstoned meanwhile: the raw read still sees it', () => {
    const storage = seedOf([A, B]);
    const store = new ListStore(at({ storage }), say, t);
    storage.set('dhloot.migrated.v1', JSON.stringify({ owner: 'u1', lists: { a: 'x1' } }));
    const r = store.settleMove('u1', [pair(A, 'x1')]);
    /* Seen and removed, but not named again: its tombstone is not new. */
    expect(r?.removed.map((m) => m.list.id)).toEqual(['a']);
    expect(storedIds(storage)).toEqual(['b']);
    expect(migratedOf(storage)?.['notice']).toBeUndefined();
  });

  it('holds a changed list under a tombstone another tab wrote, and lifts that tombstone', () => {
    const storage = seedOf([{ ...A, name: 'Изменён' }]);
    const store = new ListStore(at({ storage }), say, t);
    storage.set('dhloot.migrated.v1', JSON.stringify({ owner: 'u1', lists: { a: 'x1' } }));
    const r = store.settleMove('u1', [pair(A, 'x1')]);
    expect(r?.changed).toEqual(['a']);
    expect(migratedOf(storage)).toEqual({ owner: 'u1', lists: {}, held: ['a'] });
    expect(storedIds(storage)).toEqual(['a']);
    expect(store.lists.map((l) => [l.id, l.name])).toEqual([['a', 'Изменён']]);
    /* No later write drops it: a removal of another id keeps it. */
    store.removeMany(['zz']);
    expect(storedIds(storage)).toEqual(['a']);
  });

  it('leaves a pair another tab already holds: not tombstoned, not removed', () => {
    const storage = seedOf([A, B]);
    const store = new ListStore(at({ storage }), say, t);
    const other = new ListStore(at({ storage }), say, t);
    other.markHeld('u1', ['a']);
    const r = store.settleMove('u1', [pair(A, 'x1'), pair(B, 'x2')]);
    expect(r?.removed.map((m) => m.list.id)).toEqual(['b']);
    expect(r?.changed).toEqual([]);
    expect(storedIds(storage)).toEqual(['a']);
    expect(migratedOf(storage)).toEqual({
      owner: 'u1',
      lists: { b: 'x2' },
      notice: ['Лавка в порту'],
      held: ['a']
    });
  });

  it('reads dhloot.migrated.v1 with no lists key at all', () => {
    const store = new ListStore(
      at({
        storage: memoryStorage({
          'dhloot.migrated.v1': JSON.stringify({ owner: 'u1', lists: {}, notice: ['Н'] })
        })
      }),
      say,
      t
    );
    expect(store.migrated).toEqual({ owner: 'u1', lists: {}, notice: ['Н'] });
    expect(store.current()).toEqual([]);
  });

  it('tombstones and names a pair gone from storage without writing the lists', () => {
    const storage = seedOf([B]);
    const store = new ListStore(at({ storage }), say, t);
    const raw = storage.get('dhloot.lists.v2');
    const r = store.settleMove('u1', [pair(A, 'x1')]);
    expect(r?.removed).toEqual([]);
    expect(storage.get('dhloot.lists.v2')).toBe(raw);
    expect(migratedOf(storage)).toEqual({
      owner: 'u1',
      lists: { a: 'x1' },
      notice: ['Клад дракона']
    });
  });

  it('hides a tombstoned list seeded in storage and drops it on the next removal', () => {
    const storage = seedOf([A, B, C], {
      'dhloot.migrated.v1': JSON.stringify({ owner: 'u1', lists: { a: 'x1' } })
    });
    const store = new ListStore(at({ storage }), say, t);
    expect(store.lists.map((l) => l.id)).toEqual(['b', 'c']);
    store.removeMany(['c']);
    expect(storedIds(storage)).toEqual(['b']);
  });

  it('writes nothing and answers null over a lists key that does not parse', () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': '{not json' });
    const store = new ListStore(at({ storage }), say, t);
    storage.set('dhloot.migrated.v1', '{"owner":"u1","lists":{}}');
    expect(store.settleMove('u1', [pair(A, 'x1')])).toBeNull();
    expect(storage.get('dhloot.lists.v2')).toBe('{not json');
    expect(storage.get('dhloot.migrated.v1')).toBe('{"owner":"u1","lists":{}}');
  });

  it('answers null and removes nothing when the tombstones cannot be written', () => {
    const storage = seedOf([A]);
    const store = new ListStore(at({ storage }), say, t);
    const set = storage.set.bind(storage);
    storage.set = (k, v) => k !== 'dhloot.migrated.v1' && set(k, v);
    expect(store.settleMove('u1', [pair(A, 'x1')])).toBeNull();
    expect(storedIds(storage)).toEqual(['a']);
  });

  it('keeps the tombstones when the lists write is refused, and hides the list', () => {
    const storage = seedOf([A, B]);
    const store = new ListStore(at({ storage }), say, t);
    const set = storage.set.bind(storage);
    storage.set = (k, v) => k !== 'dhloot.lists.v2' && set(k, v);
    const r = store.settleMove('u1', [pair(A, 'x1')]);
    expect(r?.removed).toHaveLength(1);
    expect(store.saved).toBe(false);
    expect(storedIds(storage)).toEqual(['a', 'b']);
    expect(store.lists.map((l) => l.id)).toEqual(['b']);
  });

  it('hides a list on the next signal for the tombstone key, the lists key unchanged', () => {
    const storage = seedOf([A, B]);
    const store = new ListStore(at({ storage }), say, t);
    const moved = vi.fn();
    const off = store.watch(moved);
    const raw = storage.get('dhloot.lists.v2');
    storage.set('dhloot.migrated.v1', JSON.stringify({ owner: 'u1', lists: { a: 'x1' } }));
    storage.fireExternalChange('dhloot.migrated.v1');
    off();
    expect(storage.get('dhloot.lists.v2')).toBe(raw);
    expect(store.lists.map((l) => l.id)).toEqual(['b']);
    expect(moved).toHaveBeenCalledWith([{ list: A, accountId: 'x1' }]);
    expect(store.migrated.lists).toEqual({ a: 'x1' });
  });

  it('hides a moved list on a shown-again signal too, and calls back only for a list that left', () => {
    const storage = seedOf([A, B]);
    const store = new ListStore(at({ storage }), say, t);
    const moved = vi.fn();
    const off = store.watch(moved);
    storage.fireExternalChange(null);
    expect(moved).not.toHaveBeenCalled();
    storage.set('dhloot.migrated.v1', JSON.stringify({ lists: { b: 'x2' } }));
    storage.fireExternalChange(null);
    off();
    expect(moved).toHaveBeenCalledWith([{ list: B, accountId: 'x2' }]);
  });

  it('merges two stores over one storage: both pairs and both names stay', () => {
    const storage = seedOf([A, B]);
    const one = new ListStore(at({ storage }), say, t);
    const two = new ListStore(at({ storage }), say, t);
    one.settleMove('u1', [pair(A, 'x1')]);
    two.settleMove('u1', [pair(B, 'x2')]);
    expect(migratedOf(storage)).toEqual({
      owner: 'u1',
      lists: { a: 'x1', b: 'x2' },
      notice: ['Клад дракона', 'Лавка в порту']
    });
    expect(storedIds(storage)).toEqual([]);
  });

  it('keeps a dismissal made in one store through the other store later marking the backup', () => {
    const storage = seedOf([A], { 'dhloot.lists.v2.bad': '{' });
    const one = new ListStore(at({ storage }), say, t);
    const two = new ListStore(at({ storage }), say, t);
    one.markBad('u1');
    one.settleMove('u1', [pair(A, 'x1')]);
    expect(migratedOf(storage)?.['bad']).toBe(true);
    one.dismissNotice();
    two.markBad('u1');
    expect(migratedOf(storage)).toEqual({ owner: 'u1', lists: { a: 'x1' }, bad: false });
    expect(two.migrated.bad).toBe(false);
    expect(two.hasBadBackup).toBe(true);
    expect(storage.get('dhloot.lists.v2.bad')).toBe('{');
  });

  it('names a list only with a new tombstone: a slower store does not bring a dismissed notice back', () => {
    const storage = seedOf([A]);
    const one = new ListStore(at({ storage }), say, t);
    const two = new ListStore(at({ storage }), say, t);
    one.settleMove('u1', [pair(A, 'x1')]);
    one.dismissNotice();
    two.settleMove('u1', [pair(A, 'x1')]);
    expect(migratedOf(storage)?.['notice']).toBeUndefined();
    expect(two.migrated.notice).toBeUndefined();
  });

  it('reads a value that does not parse as absent, field by field', () => {
    const bad = new ListStore(
      at({ storage: seedOf([A], { 'dhloot.migrated.v1': '{nope' }) }),
      say,
      t
    );
    expect(bad.migrated).toEqual({ lists: {} });
    expect(bad.lists).toHaveLength(1);
    const odd = JSON.stringify({
      owner: 5,
      lists: { a: 7, b: 'x2' },
      notice: ['Н', 3],
      bad: 'yes',
      held: 'a'
    });
    const store = new ListStore(
      at({ storage: seedOf([A], { 'dhloot.migrated.v1': odd }) }),
      say,
      t
    );
    expect(store.migrated).toEqual({ lists: { b: 'x2' }, notice: ['Н'] });
    const list = new ListStore(
      at({ storage: seedOf([A], { 'dhloot.migrated.v1': '[1]' }) }),
      say,
      t
    );
    expect(list.migrated).toEqual({ lists: {} });
  });

  it('holds an id once however often it is held, and a removal of a held list prunes it', () => {
    const storage = seedOf([A, B]);
    const store = new ListStore(at({ storage }), say, t);
    store.markHeld('u1', ['a']);
    store.markHeld('u2', ['a', 'b']);
    expect(migratedOf(storage)).toEqual({ owner: 'u1', lists: {}, held: ['a', 'b'] });
    store.removeMany(['a']);
    expect(store.migrated.held).toEqual(['b']);
    store.removeMany(['b']);
    expect(migratedOf(storage)?.['held']).toBeUndefined();
  });

  it('claims the browser for the first account only', () => {
    const storage = seedOf([A]);
    const store = new ListStore(at({ storage }), say, t);
    expect(store.claim('u1')).toBe(true);
    expect(store.claim('u2')).toBe(true);
    expect(migratedOf(storage)).toEqual({ owner: 'u1', lists: {} });
    expect(store.hasBadBackup).toBe(false);
  });
});
