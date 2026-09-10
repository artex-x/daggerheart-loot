/* The list store, on its own - no component, no router.
 *
 * Read off the live app's `loadLists`..`storageWorks` (app.js 1149-1204) and
 * `createList` (app.js 1320-1330): the v1-to-v2 migration runs once and
 * leaves v1 alone, a save merges with whatever another tab wrote rather than
 * overwriting it, and a refused write keeps the session working. */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dict } from '../lib/dict.js';
import { brokenStorage, fakeEnv, memoryStorage } from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { ListStore } from './lists.svelte.js';

const t = () => dict('ru');

const at = (over: Partial<Env> = {}): Env => fakeEnv(over);

const said: { msg: string; error?: boolean | undefined }[] = [];
const say = (msg: string, error?: boolean): void => {
  said.push({ msg, error });
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

  it('is empty with neither key, and empty on broken JSON', () => {
    expect(new ListStore(at(), say, t).lists).toEqual([]);
    const env = at({ storage: memoryStorage({ 'dhloot.lists.v2': '{not json' }) });
    expect(new ListStore(env, say, t).lists).toEqual([]);
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
    /* `toEqual`, not `toBe`: `lists` is `$state`, and Svelte 5 wraps a stored
       object in a reactive proxy, so what comes back is not the same
       reference `create()` handed out - only the same content. */
    expect(store.lists[0]).toEqual(l);
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
});

describe('removing a list', () => {
  it('drops it from memory and storage', () => {
    const l = { id: 'a', name: 'Клад', ids: [], created: 1 };
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([l]) });
    const store = new ListStore(at({ storage }), say, t);

    store.remove('a');
    expect(store.lists).toEqual([]);
    expect(JSON.parse(storage.get('dhloot.lists.v2') ?? '')).toEqual([]);
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
});

describe('watching for another tab', () => {
  /** `memoryStorage` never fires its own listeners on `set` - nothing here
   *  simulates two tabs sharing one `Storage` object. This captures the
   *  callback `watch()` registers so the test can fire it directly, the way
   *  the browser's own `storage` event would. */
  const withCapturedListener = (
    base: ReturnType<typeof memoryStorage>
  ): { storage: Env['storage']; fire: (key: string) => void } => {
    let fn: ((key: string) => void) | null = null;
    return {
      storage: {
        ...base,
        onExternalChange(f) {
          fn = f;
          return () => {
            fn = null;
          };
        }
      },
      fire: (key) => fn?.(key)
    };
  };

  it('reloads on the lists key', () => {
    const base = memoryStorage({
      'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'A', ids: [], created: 1 }])
    });
    const { storage, fire } = withCapturedListener(base);
    const store = new ListStore(at({ storage }), say, t);
    store.watch();

    // the other tab's write lands in the same key
    storage.set(
      'dhloot.lists.v2',
      JSON.stringify([{ id: 'b', name: 'B', ids: [], created: 2 }])
    );
    fire('dhloot.lists.v2');
    expect(store.lists).toEqual([{ id: 'b', name: 'B', ids: [], created: 2 }]);
  });

  it('ignores every other key', () => {
    const base = memoryStorage({
      'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'A', ids: [], created: 1 }])
    });
    const { storage, fire } = withCapturedListener(base);
    const store = new ListStore(at({ storage }), say, t);
    store.watch();

    storage.set('dhloot.lang.v1', 'en');
    fire('dhloot.lang.v1');
    expect(store.lists).toEqual([{ id: 'a', name: 'A', ids: [], created: 1 }]);
  });

  it('stops on unsubscribe', () => {
    const base = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([]) });
    const { storage, fire } = withCapturedListener(base);
    const store = new ListStore(at({ storage }), say, t);
    const stop = store.watch();
    stop();

    storage.set(
      'dhloot.lists.v2',
      JSON.stringify([{ id: 'b', name: 'B', ids: [], created: 2 }])
    );
    fire('dhloot.lists.v2');
    expect(store.lists).toEqual([]);
  });
});
