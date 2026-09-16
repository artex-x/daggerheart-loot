/* The shared state, on its own.
 *
 * `shell.test.ts` reaches this class through what the frame draws, which covers
 * the language and the lit tab and nothing else. The rest of it - which address
 * may be pinned, what a refused write does, what an old section name sets - was
 * read off the live app rather than invented, and no component asks for it yet.
 * It is tested here directly rather than left dark until a screen needs it,
 * because those are the rules that would be re-derived, differently, by whoever
 * writes that screen. */

import { describe, expect, it, vi } from 'vitest';
import type { Loot } from '../lib/data.js';
import { sharedListHash } from '../lib/hash.js';
import { encodeList } from '../lib/listLink.js';
import type { StoredList } from '../lib/lists.js';
import { LOOT_KINDS } from '../lib/std.js';
import { KINDS } from '../lib/types.js';
import { brokenStorage, fakeEnv, memoryRouter, memoryStorage } from '../ports/index.js';
import type { CompressPort, Env } from '../ports/index.js';
import { AppState } from './app.svelte.js';

const LANG_KEY = 'dhloot.lang.v1';
const HOME_KEY = 'dhloot.home.v1';

const at = (hash: string, over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter(hash), ...over });

/** A store already holding something, the way a returning visitor's would. */
const stored = memoryStorage;

describe('settings are read as untrusted data', () => {
  it('takes a remembered language', () => {
    const app = new AppState(at('#/roll/std', { storage: stored({ [LANG_KEY]: 'en' }) }));
    expect(app.lang).toBe('en');
  });

  it('falls back when the stored language is not one of ours', () => {
    /* The value is whatever the last version of the app wrote, or whatever
       somebody typed into a console. It must not be able to break a render. */
    const app = new AppState(at('#/roll/std', { storage: stored({ [LANG_KEY]: 'fr' }) }));
    expect(app.lang).toBe('ru');
  });

  it('refuses a pinned address that is not a section', () => {
    /* A record or a list is a snapshot: the id drifts out of the data and the
       visitor opens the app on an error. Only a section survives that. */
    for (const bad of [
      '#/i/w12',
      '#/lists/abc',
      '#/print/w1-w2',
      '#/tables/weapons',
      'nonsense'
    ]) {
      const app = new AppState(at('', { storage: stored({ [HOME_KEY]: bad }) }));
      expect(app.home, bad).toBe('#/roll/std');
    }
  });

  it('accepts a section or a named table as the pinned address', () => {
    for (const good of ['#/roll/wondrous', '#/tables/eq_weapon']) {
      const app = new AppState(at('', { storage: stored({ [HOME_KEY]: good }) }));
      expect(app.home, good).toBe(good);
    }
  });

  it('accepts a bare #/tables too, the one shape the app itself no longer writes', () => {
    /* Live's own homeAllows (app.js 1124-1130) keeps this - `tables` is a
       tab in TAB_LIST, not only a table name - so a pin written before this
       fix, or by hand, still opens rather than silently falling back
       (B12.1 nit 1/4: the rewrite used to refuse it and lose the pin at the
       next boot). The writer below never produces this shape any more -
       see 'pinning'. */
    const app = new AppState(at('', { storage: stored({ [HOME_KEY]: '#/tables' }) }));
    expect(app.home).toBe('#/tables');
  });
});

describe('the address on the way in', () => {
  it('opens the pinned section when there is no address', () => {
    for (const empty of ['', '#', '#/']) {
      const env = at(empty, { storage: stored({ [HOME_KEY]: '#/roll/wondrous' }) });
      const app = new AppState(env);
      expect(app.hash, empty).toBe('#/roll/wondrous');
    }
  });

  it('opens the default at boot and leaves the bare bar untouched when nothing is pinned', () => {
    /* Row 1 of plan.md's B12.1 table: live's own boot check (app.js
       4610-4614) never assigns `location.hash` when the pinned home is
       already the default - there is nothing to add - so a bare address
       stays bare while the default section draws. */
    const router = memoryRouter('#/');
    const app = new AppState(fakeEnv({ router }));
    expect(app.hash).toBe('#/roll/std');
    expect(router.stack).toEqual(['#/']);
  });

  it('pushes a pinned section at boot, so Back leaves the bare address behind', () => {
    /* Row 2: live's boot check is a plain assignment, not a replaceState
       (app.js 4610-4614), so a non-default pin is a real history entry -
       unlike the unreadable-address case below, which replaces. */
    const router = memoryRouter('');
    const app = new AppState(fakeEnv({ router, storage: stored({ [HOME_KEY]: '#/search' }) }));
    expect(app.hash).toBe('#/search');
    expect(router.stack).toEqual(['', '#/search']);
    expect(router.canGoBack()).toBe(true);
  });

  it('replaces an unreadable address at boot with the pinned section', () => {
    /* Row 3, boot half - the live `currentRoute` fallback (app.js 3638-3647)
       answers an unknown address the same way whether it is met at boot or
       on navigation; see 'navigation' below for the navigation half. */
    const router = memoryRouter('#/nonsense');
    const app = new AppState(
      fakeEnv({ router, storage: stored({ [HOME_KEY]: '#/roll/wondrous' }) })
    );
    expect(app.hash).toBe('#/roll/wondrous');
    expect(router.stack).toEqual(['#/roll/wondrous']);
  });

  it('never overrides a real address with a preference', () => {
    /* Someone opening a shared list must land on that list, whatever this
       browser happens to prefer. */
    const app = new AppState(
      at('#/i/w12', { storage: stored({ [HOME_KEY]: '#/roll/dread' }) })
    );
    expect(app.hash).toBe('#/i/w12');
  });
});

describe('pinning', () => {
  it('pins the current address', () => {
    const app = new AppState(at('#/roll/wondrous'));
    expect(app.toggleHome()).toBe(true);
    expect(app.home).toBe('#/roll/wondrous');
  });

  it('unpins back to the default, not to nothing', () => {
    const env = at('#/roll/wondrous', { storage: stored({ [HOME_KEY]: '#/roll/wondrous' }) });
    const app = new AppState(env);
    expect(app.toggleHome()).toBe(true);
    expect(app.home).toBe('#/roll/std');
    expect(env.storage.get(HOME_KEY)).toBe(null);
  });

  it('survives a browser that refuses to write, and says so', () => {
    /* The caller needs the false: it is what tells the visitor the setting did
       not stick, instead of showing a button that lies. */
    const app = new AppState(at('#/roll/wondrous', { storage: brokenStorage() }));
    expect(app.toggleHome()).toBe(false);
    expect(app.home).toBe('#/roll/std');
  });

  it('pins the address it is given, not just the one on the bar', () => {
    /* PageHead's own override, for TablesPage: a bare #/tables can be
       showing any table underneath (`lastTable`, which AppState cannot see -
       `App.svelte` does not remount the page between two `tables`
       addresses), so the caller hands over the address that is genuinely on
       screen rather than letting toggleHome fall back to `this.hash`. */
    const app = new AppState(at('#/tables'));
    expect(app.hash).toBe('#/tables');
    expect(app.toggleHome('#/tables/eq_weapon')).toBe(true);
    expect(app.home).toBe('#/tables/eq_weapon');
  });

  it('unpins the address it is given, the same way', () => {
    const env = at('#/tables', { storage: stored({ [HOME_KEY]: '#/tables/eq_weapon' }) });
    const app = new AppState(env);
    expect(app.toggleHome('#/tables/eq_weapon')).toBe(true);
    expect(app.home).toBe('#/roll/std');
    expect(env.storage.get(HOME_KEY)).toBe(null);
  });

  it('takes the address on screen when it is not given one, exactly as before', () => {
    const app = new AppState(at('#/tables/eq_weapon'));
    expect(app.toggleHome()).toBe(true);
    expect(app.home).toBe('#/tables/eq_weapon');
  });

  it('writes the language through to storage', () => {
    const env = at('#/roll/std');
    const app = new AppState(env);
    app.setLang('en');
    expect(env.storage.get(LANG_KEY)).toBe('en');
  });
});

describe('the storage notice', () => {
  const WARN_KEY = 'dhloot.warn.v1';

  it('is hidden with the flag stored, and shown otherwise', () => {
    expect(
      new AppState(at('#/lists', { storage: stored({ [WARN_KEY]: '1' }) })).warnHidden
    ).toBe(true);
    expect(new AppState(at('#/lists')).warnHidden).toBe(false);
  });

  it('dismisses for good, writing the flag', () => {
    const env = at('#/lists');
    const app = new AppState(env);
    app.hideWarn();
    expect(app.warnHidden).toBe(true);
    expect(env.storage.get(WARN_KEY)).toBe('1');
  });

  it('sets the flag in memory even when storage refuses the write', () => {
    /* The live `hideWarn` ignores the write's result too: with storage
       refusing, the page draws the undismissable warning instead, so the
       flag reaching storage does not matter. */
    const app = new AppState(at('#/lists', { storage: brokenStorage() }));
    app.hideWarn();
    expect(app.warnHidden).toBe(true);
  });
});

describe('which tab is lit', () => {
  it('lights the section a route belongs to', () => {
    /* A section id carries its prefix - see SECTIONS in lib/types.ts */
    expect(new AppState(at('#/roll/dread')).section).toBe('roll/dread');
    expect(new AppState(at('#/tables/eq_weapon')).section).toBe('tables');
  });

  it('lights nothing on a record, a list page or a print sheet', () => {
    /* The live `renderTabs` (app.js 3667-3673) compares against the raw route
       string, and a list route - `l/…` or `lists/…` - is never that string,
       so no tab is lit there either, Lists included. */
    expect(new AppState(at('#/i/w12')).section).toBe(null);
    expect(new AppState(at('#/print/w1-w2')).section).toBe(null);
    expect(new AppState(at('#/lists/abc')).section).toBe(null);
    expect(new AppState(at('#/l/eyJ')).section).toBe(null);
  });
});

describe('the print route', () => {
  const loot: Loot = {
    items: {
      core_item: [
        { id: 'ci1', src: 'core', kind: 'item', en: 'A', ende: '', ru: 'А', rud: '', roll: 1 }
      ]
    }
  };

  it('resolves the ids the data knows, and counts nothing dropped', () => {
    const app = new AppState(at('#/print/ci1-zzz', { data: { load: () => loot } }));
    const r = app.route;
    expect(r.kind).toBe('print');
    if (r.kind === 'print') {
      expect(r.ids).toEqual(['ci1']);
      expect(r.dropped).toBe(0);
    }
  });

  it('carries no ids when the data never loaded', () => {
    const app = new AppState(at('#/print/ci1', { data: { load: () => null } }));
    const r = app.route;
    expect(r.kind).toBe('print');
    if (r.kind === 'print') expect(r.ids).toEqual([]);
  });
});

describe('the list page address', () => {
  const list: StoredList = { id: 'a', name: 'Клад', ids: ['w1', 'w2'] };

  it('rewrites the address to the players’ payload and remembers both', () => {
    const app = new AppState(at('#/lists/a'));
    app.syncListUrl(list);
    const payload = encodeList(list, true);
    expect(app.hash).toBe(sharedListHash(payload));
    expect(app.openList).toBe('a');
    expect(app.urlPayload).toBe(payload);
  });

  it('leaves an address that already matches the payload alone', () => {
    const payload = encodeList(list, true);
    const app = new AppState(at(sharedListHash(payload)));
    const before = app.hash;
    app.syncListUrl(list);
    expect(app.hash).toBe(before);
  });

  it('rewrites again after an edit changes the payload', () => {
    const app = new AppState(at('#/lists/a'));
    app.syncListUrl(list);
    const first = app.hash;
    app.syncListUrl({ ...list, name: 'Другое имя' });
    expect(app.hash).not.toBe(first);
  });

  it('clears both on clearOpenList, as every other route does', () => {
    const app = new AppState(at('#/lists/a'));
    app.syncListUrl(list);
    app.clearOpenList();
    expect(app.openList).toBe('');
    expect(app.urlPayload).toBe('');
  });
});

describe('navigation', () => {
  it('follows the address bar once started, and lets go on stop', () => {
    const router = memoryRouter('#/roll/std');
    const app = new AppState(fakeEnv({ router }));
    const stop = app.start();

    router.navigate('#/tables/eq_armor');
    expect(app.hash).toBe('#/tables/eq_armor');
    expect(app.section).toBe('tables');

    stop();
    router.navigate('#/lists');
    expect(app.hash, 'a stopped listener must not keep writing').toBe('#/tables/eq_armor');
  });

  it('is safe to stop twice', () => {
    const app = new AppState(at('#/roll/std'));
    app.start();
    app.stop();
    expect(() => {
      app.stop();
    }).not.toThrow();
  });

  it('moving by hand pushes and updates in one step', () => {
    const router = memoryRouter('#/roll/std');
    const app = new AppState(fakeEnv({ router }));
    app.go('#/lists');
    expect(app.hash).toBe('#/lists');
    expect(router.hash()).toBe('#/lists');
    expect(router.canGoBack()).toBe(true);
  });

  it('an old section name still sets which books the roll draws from', () => {
    /* Links to the pre-merge sections are in other people's chat logs, and they
       carry the source in the name. See docs/specs/ROUTES.md. */
    const app = new AppState(at('#/roll/core'));
    expect(app.source).toEqual({ core: true, hnf: false });

    app.start();
    app.go('#/roll/hnf');
    expect(app.source).toEqual({ core: false, hnf: true });
  });

  it('keeps the last source when a route says nothing about it', () => {
    const app = new AppState(at('#/roll/core'));
    app.start();
    app.go('#/tables/eq_weapon');
    expect(app.source).toEqual({ core: true, hnf: false });
  });

  it('reaching a bare address by navigating draws the default, not the pinned section, and leaves the bar bare', () => {
    /* Row 4 of plan.md's B12.1 table: unlike boot (row 1/2 above), a bare
       address met after the app is already running never consults the
       pinned home - live's own home check runs once at boot only, app.js
       4610-4614 - so it always lands on `#/roll/std`. */
    const router = memoryRouter('#/tables');
    const app = new AppState(fakeEnv({ router, storage: stored({ [HOME_KEY]: '#/search' }) }));
    app.start();
    router.navigate('#/');
    expect(app.hash).toBe('#/roll/std');
    expect(router.stack).toEqual(['#/tables', '#/']);
  });

  it('reaching an unreadable address by navigating replaces it with the pinned section', () => {
    /* Row 3, navigation half - the same fallback rule the boot branch above
       uses for an unknown kind. */
    const router = memoryRouter('#/tables');
    const app = new AppState(fakeEnv({ router, storage: stored({ [HOME_KEY]: '#/search' }) }));
    app.start();
    router.navigate('#/nonsense');
    expect(app.hash).toBe('#/search');
    expect(router.stack).toEqual(['#/tables', '#/search']);
  });
});

describe('replace vs navigate', () => {
  it('rewrites the address and counts as a navigation when go() does it', () => {
    const router = memoryRouter('#/tables');
    const app = new AppState(fakeEnv({ router }));
    expect(app.navigations).toBe(0);
    app.go('#/lists');
    expect(app.hash).toBe('#/lists');
    expect(router.stack).toEqual(['#/tables', '#/lists']);
    expect(app.navigations).toBe(1);
  });

  it('rewrites the address in place and does not count as a navigation', () => {
    const router = memoryRouter('#/tables');
    const app = new AppState(fakeEnv({ router }));
    app.replace('#/tables/f_kind-item');
    expect(app.hash).toBe('#/tables/f_kind-item');
    expect(router.hash()).toBe('#/tables/f_kind-item');
    expect(router.stack).toHaveLength(1);
    expect(app.navigations).toBe(0);
  });

  it('counts an address that changed underneath it, from start()', () => {
    const router = memoryRouter('#/tables');
    const app = new AppState(fakeEnv({ router }));
    app.start();
    router.navigate('#/lists');
    expect(app.navigations).toBe(1);
  });
});

describe('the add-to-list menu', () => {
  it('clears on go(), and on a navigation the router announces', () => {
    const router = memoryRouter('#/i/ci1');
    const app = new AppState(fakeEnv({ router }));
    app.start();

    app.menuFor = 'ci1';
    app.go('#/i/q1');
    expect(app.menuFor).toBe('');

    app.menuFor = 'q1';
    router.navigate('#/lists');
    expect(app.menuFor).toBe('');
  });

  it('survives replace() - a filter pick must not fold an open menu', () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/tables') }));
    app.menuFor = 'sel';
    app.replace('#/tables/f_kind-item');
    expect(app.menuFor).toBe('sel');
  });
});

describe('the selection', () => {
  it('clears on go(), and on a navigation the router announces', () => {
    const router = memoryRouter('#/tables');
    const app = new AppState(fakeEnv({ router }));
    app.start();

    app.sel.add('ci1');
    app.go('#/tables/eq_weapon');
    expect(app.sel.size).toBe(0);

    app.sel.add('ci1');
    router.navigate('#/lists');
    expect(app.sel.size).toBe(0);
  });

  it('survives replace() - a filter pick must not drop the ticks', () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/tables') }));
    app.sel.add('ci1');
    app.replace('#/tables/f_kind-item');
    expect([...app.sel]).toEqual(['ci1']);
  });

  it('clearSel empties the selection and folds an open menu', () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/tables') }));
    app.sel.add('ci1');
    app.sel.add('q1');
    app.menuFor = 'sel';
    app.clearSel();
    expect(app.sel.size).toBe(0);
    expect(app.menuFor).toBe('');
  });

  it('toggleSel adds an absent id and removes a present one', () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/tables') }));
    app.toggleSel('ci1');
    expect([...app.sel]).toEqual(['ci1']);
    app.toggleSel('ci1');
    expect(app.sel.size).toBe(0);
  });

  it('shared starts null', () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/tables') }));
    expect(app.shared).toBeNull();
  });
});

describe('the kind filter', () => {
  it('a fresh app has all three kinds on', () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/tables') }));
    expect(app.kinds).toEqual({ item: true, consumable: true, equip: true });
  });

  it('toggleKind turns one off and raises no toast', () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/tables') }));
    app.toggleKind('consumable', KINDS);
    expect(app.kinds.consumable).toBe(false);
    expect(app.toast).toBeNull();
  });

  it('refuses to turn the last one off, among the row the chip sits in', () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/tables') }));
    app.toggleKind('item', KINDS);
    app.toggleKind('equip', KINDS);
    app.toggleKind('consumable', KINDS);
    expect(app.kinds.consumable).toBe(true);
    expect(app.toast).toEqual({
      msg: 'Нужен хотя бы один тип',
      mode: 'err',
      action: undefined
    });
  });

  it('over LOOT_KINDS the judgement ignores equip', () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/tables') }));
    app.toggleKind('consumable', KINDS);
    /* `equip` is still on, but the roll pages never offer it as a chip - the
       judgement has to look only at the row it is asked about. */
    app.toggleKind('item', LOOT_KINDS);
    expect(app.kinds.item).toBe(true);
    expect(app.toast?.msg).toBe('Нужен хотя бы один тип');
  });

  it('is left alone by go() and by a navigation the router announces', () => {
    const router = memoryRouter('#/roll/std');
    const app = new AppState(fakeEnv({ router }));
    app.start();
    app.toggleKind('consumable', KINDS);
    app.go('#/tables');
    expect(app.kinds.consumable).toBe(false);
    router.navigate('#/lists');
    expect(app.kinds.consumable).toBe(false);
  });
});

describe('a packed address', () => {
  /** The shape `listsPage.test.ts` (302-314) already uses: no real deflate,
   *  only that `unpack` runs before the payload is read as plain. */
  const stub = (
    unpack: CompressPort['unpack'] = (p) => Promise.resolve(p.slice(1))
  ): CompressPort => ({
    available: () => true,
    pack: (raw) => Promise.resolve(raw),
    unpack
  });

  it('expands at construction - a replace, not a step', async () => {
    const router = memoryRouter('#/l/~abc');
    const app = new AppState(fakeEnv({ router, compress: stub() }));
    await vi.waitFor(() => {
      expect(app.hash).toBe('#/l/abc');
    });
    expect(router.hash()).toBe('#/l/abc');
    expect(router.stack).toHaveLength(1);
    expect(app.navigations).toBe(0);
  });

  it('lands on #/l/zzzz when the port cannot unpack, and does not loop', async () => {
    const router = memoryRouter('#/l/~abc');
    const unpack = vi.fn((p: string) => Promise.resolve(p));
    const app = new AppState(fakeEnv({ router, compress: stub(unpack) }));
    await vi.waitFor(() => {
      expect(app.hash).toBe('#/l/zzzz');
    });
    expect(router.hash()).toBe('#/l/zzzz');
    expect(unpack).toHaveBeenCalledTimes(1);
  });

  it('lands on #/l/zzzz when unpack rejects', async () => {
    const router = memoryRouter('#/l/~abc');
    const unpack = () => Promise.reject(new Error('no DecompressionStream'));
    const app = new AppState(fakeEnv({ router, compress: stub(unpack) }));
    await vi.waitFor(() => {
      expect(app.hash).toBe('#/l/zzzz');
    });
  });

  it('expands a packed hash the router announces after start()', async () => {
    const router = memoryRouter('#/tables');
    const app = new AppState(fakeEnv({ router, compress: stub() }));
    app.start();
    router.navigate('#/l/~abc');
    await vi.waitFor(() => {
      expect(app.hash).toBe('#/l/abc');
    });
  });

  it('expands through go()', async () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/tables'), compress: stub() }));
    app.go('#/l/~abc');
    await vi.waitFor(() => {
      expect(app.hash).toBe('#/l/abc');
    });
  });
});

describe('the toast', () => {
  it('shows a plain notice for 1600ms', () => {
    vi.useFakeTimers();
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    app.say('Добавлено в «Клад дракона»');
    expect(app.toast).toEqual({
      msg: 'Добавлено в «Клад дракона»',
      mode: '',
      action: undefined
    });

    vi.advanceTimersByTime(1599);
    expect(app.toast).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(app.toast).toBeNull();
    vi.useRealTimers();
  });

  it('shows an error for 2600ms', () => {
    vi.useFakeTimers();
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    app.say('Сначала назовите список', { error: true });
    expect(app.toast?.mode).toBe('err');

    vi.advanceTimersByTime(2599);
    expect(app.toast).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(app.toast).toBeNull();
    vi.useRealTimers();
  });

  it('shows an action for 7000ms', () => {
    vi.useFakeTimers();
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    const run = vi.fn();
    app.say('«Клад» убран', { action: { label: 'Вернуть', run } });
    expect(app.toast?.mode).toBe('act');
    expect(app.toast?.action?.label).toBe('Вернуть');

    vi.advanceTimersByTime(6999);
    expect(app.toast).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(app.toast).toBeNull();
    expect(run).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('replaces the first toast and restarts the clock', () => {
    vi.useFakeTimers();
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    app.say('one');
    vi.advanceTimersByTime(1000);
    app.say('two');
    vi.advanceTimersByTime(1000);
    // the first timer would have fired by now had it not been cleared
    expect(app.toast?.msg).toBe('two');
    vi.advanceTimersByTime(600);
    expect(app.toast).toBeNull();
    vi.useRealTimers();
  });

  it('hides immediately and clears the timer', () => {
    vi.useFakeTimers();
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    app.say('one');
    app.hideToast();
    expect(app.toast).toBeNull();
    vi.advanceTimersByTime(5000);
    expect(app.toast).toBeNull();
    vi.useRealTimers();
  });
});
