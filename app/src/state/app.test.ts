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
import { bundleText, ENTRIES_MAX, LISTS_MAX, officialOnly, toBundle } from '../lib/bundle.js';
import type { Loot } from '../lib/data.js';
import { dict } from '../lib/dict.js';
import { sharedListHash } from '../lib/hash.js';
import { encodeList } from '../lib/listLink.js';
import type { StoredList } from '../lib/lists.js';
import { LOOT_KINDS } from '../lib/std.js';
import { readDataZip } from '../lib/zip.js';
import type { Prefs } from '../lib/prefs.js';
import { KINDS } from '../lib/types.js';
import { LEGACY_WRITE_UNTIL } from '../lib/legacy.js';
import {
  brokenStorage,
  fakeDialog,
  fakeEnv,
  fakePage,
  fakeImage,
  fakePwa,
  fixedClock,
  memoryRouter,
  memoryStorage
} from '../ports/index.js';
import type {
  CloudPort,
  CompressPort,
  Env,
  FakeStoragePort,
  RouterPort,
  Session
} from '../ports/index.js';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import { AppState, LIST_POLL_MS, SIGN_OUT_WAIT_MS } from './app.svelte.js';

const LANG_KEY = 'dhloot.lang.v1';
const HOME_KEY = 'dhloot.home.v1';

const at = (hash: string, over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter(hash), ...over });

/** A store already holding something, the way a returning visitor's would. */
const stored = memoryStorage;

/** `memoryRouter`'s own `navigate()` announces unconditionally (its doc
 *  comment says why: it exists to catch `AppState.navigations` gaps, not to
 *  model this quirk). A real browser fires no `hashchange` at all for
 *  `location.hash = <the value it already holds>` - the one behaviour this
 *  double exists for, so `navigate()` here only announces on an actual
 *  change, and `fire()` stands in for a hashchange the browser dispatches on
 *  its own (a Back/Forward landing on an address, whether or not it happens
 *  to match the current one). */
function quirkyRouter(start: string): RouterPort & { fire: (h: string) => void } {
  let hash = start;
  const listeners = new Set<(h: string) => void>();
  return {
    hash: () => hash,
    navigate(h) {
      if (h === hash) return;
      hash = h;
      for (const fn of listeners) fn(hash);
    },
    replace(h) {
      hash = h;
    },
    onChange(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    base: () => 'https://example.test/',
    canGoBack: () => true,
    back() {
      /* Unused by this suite's one test. */
    },
    fire(h) {
      hash = h;
      for (const fn of listeners) fn(hash);
    }
  };
}

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
    /* Live's own homeAllows (app.js 1124-1130) keeps this - `tables` is one
       of the section tabs its own list checks, not only a specific table
       name (that list was `TAB_LIST`, an identifier that lived in app.js
       alone and has no equivalent anywhere in this rewrite, so it is named
       here in prose rather than cited as something a reader could go find in
       this tree). A pin written before this fix, or by hand, still opens
       rather than silently falling back (the rewrite used to refuse it and
       lose the pin at the next boot). The writer below never produces this
       shape any more - see 'pinning'. */
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
    /* Live's own boot check (app.js 4610-4614) never assigns `location.hash`
       when the pinned home is already the default - there is nothing to add
       - so a bare address stays bare while the default section draws. */
    const router = memoryRouter('#/');
    const app = new AppState(fakeEnv({ router }));
    expect(app.hash).toBe('#/roll/std');
    expect(router.stack).toEqual(['#/']);
  });

  it('pushes a pinned section at boot, so Back leaves the bare address behind', () => {
    /* Live's boot check is a plain assignment, not a replaceState
       (app.js 4610-4614), so a non-default pin is a real history entry -
       unlike the unreadable-address case below, which replaces. */
    const router = memoryRouter('');
    const app = new AppState(fakeEnv({ router, storage: stored({ [HOME_KEY]: '#/search' }) }));
    expect(app.hash).toBe('#/search');
    expect(router.stack).toEqual(['', '#/search']);
    expect(router.canGoBack()).toBe(true);
  });

  it('replaces an unreadable address at boot with the pinned section', () => {
    /* The live `currentRoute` fallback (app.js 3638-3647) answers an
       unknown address the same way whether it is met at boot or on
       navigation; see 'navigation' below for the navigation half. */
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

describe('the default tables view', () => {
  const PREFS_KEY = 'dhloot.prefs.v1';

  it('defaults to list with nothing stored', () => {
    expect(new AppState(at('#/tables')).tablesView).toBe('list');
  });

  it('reads a stored grid preference', () => {
    const app = new AppState(
      at('#/tables', { storage: stored({ [PREFS_KEY]: '{"view":"grid"}' }) })
    );
    expect(app.tablesView).toBe('grid');
  });

  it('falls back to list for a value that is not a recognised view', () => {
    for (const bad of ['{not json', '{"view":"tiles"}', 'null', '[]']) {
      const app = new AppState(at('#/tables', { storage: stored({ [PREFS_KEY]: bad }) }));
      expect(app.tablesView, bad).toBe('list');
    }
  });

  it('writes the choice through to storage', () => {
    const env = at('#/tables');
    const app = new AppState(env);
    app.setTablesView('grid');
    expect(app.tablesView).toBe('grid');
    expect(env.storage.get(PREFS_KEY)).toBe(
      '{"view":"grid","printBw":false,"printCompact":false}'
    );
  });

  it('keeps the print layout in the key when the view changes', () => {
    const env = at('#/tables', {
      storage: stored({ [PREFS_KEY]: '{"view":"list","printBw":true,"printCompact":true}' })
    });
    new AppState(env).setTablesView('grid');
    expect(env.storage.get(PREFS_KEY)).toBe(
      '{"view":"grid","printBw":true,"printCompact":true}'
    );
  });
});

describe('the default print layout', () => {
  const PREFS_KEY = 'dhloot.prefs.v1';

  it('is read at boot', () => {
    const app = new AppState(
      at('#/print/ci1', {
        storage: stored({ [PREFS_KEY]: '{"view":"grid","printBw":true,"printCompact":true}' })
      })
    );
    expect([app.tablesView, app.printBW, app.printCompact]).toEqual(['grid', true, true]);
  });

  it("reads live's old { view } shape as colour on the standard sheet", () => {
    const app = new AppState(
      at('#/print/ci1', { storage: stored({ [PREFS_KEY]: '{"view":"grid"}' }) })
    );
    expect([app.tablesView, app.printBW, app.printCompact]).toEqual(['grid', false, false]);
  });

  it('reads broken JSON as the defaults', () => {
    const app = new AppState(at('#/print/ci1', { storage: stored({ [PREFS_KEY]: '{not' }) }));
    expect([app.tablesView, app.printBW, app.printCompact]).toEqual(['list', false, false]);
  });

  it('writes the whole key on a press', () => {
    const env = at('#/print/ci1');
    const app = new AppState(env);
    app.setPrintBW(true);
    expect(env.storage.get(PREFS_KEY)).toBe(
      '{"view":"list","printBw":true,"printCompact":false}'
    );
    app.setPrintCompact(true);
    expect(app.printCompact).toBe(true);
    expect(env.storage.get(PREFS_KEY)).toBe(
      '{"view":"list","printBw":true,"printCompact":true}'
    );
  });
});

describe('a page switch lasts the visit', () => {
  const PREFS_KEY = 'dhloot.prefs.v1';
  const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

  it('changes what is shown and not the default, storing nothing', () => {
    const env = at('#/print/ci1');
    const app = new AppState(env);
    expect(app.printChanged).toBe(false);
    app.showPrintBW(true);
    app.showPrintCompact(true);
    app.showTablesView('grid');
    expect([app.shownPrintBW, app.shownPrintCompact, app.shownTablesView]).toEqual([
      true,
      true,
      'grid'
    ]);
    expect([app.printBW, app.printCompact, app.tablesView]).toEqual([false, false, 'list']);
    expect([app.printChanged, app.tablesViewChanged]).toEqual([true, true]);
    expect(env.storage.get(PREFS_KEY)).toBeNull();
  });

  it('clears the change when the switch is back on the default', () => {
    const app = new AppState(at('#/print/ci1'));
    app.showPrintBW(true);
    app.showPrintCompact(true);
    app.showPrintBW(false);
    expect(app.printChanged).toBe(true);
    app.showPrintCompact(false);
    expect(app.printChanged).toBe(false);
    app.showTablesView('grid');
    app.showTablesView('list');
    expect(app.tablesViewChanged).toBe(false);
  });

  it("drops a page's pick when the Display section sets the default", () => {
    const app = new AppState(at('#/print/ci1'));
    app.showPrintBW(true);
    app.showTablesView('grid');
    app.showPrintCompact(true);
    app.setPrintBW(false);
    app.setTablesView('list');
    app.setPrintCompact(false);
    expect([app.shownPrintBW, app.shownTablesView, app.shownPrintCompact]).toEqual([
      false,
      'list',
      false
    ]);
    expect([app.printChanged, app.tablesViewChanged]).toEqual([false, false]);
  });

  it('starts a new visit from the default over the same storage', () => {
    const env = at('#/print/ci1', {
      storage: stored({ [PREFS_KEY]: '{"view":"grid","printBw":true,"printCompact":false}' })
    });
    const first = new AppState(env);
    first.showPrintBW(false);
    first.showTablesView('list');
    const next = new AppState(env);
    expect([next.shownPrintBW, next.shownTablesView, next.printChanged]).toEqual([
      true,
      'grid',
      false
    ]);
  });

  it('saves nothing to the account, signed in', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const save = vi.spyOn(cloud.prefs, 'save');
    const storage = memoryStorage();
    const app = new AppState(fakeEnv({ router: memoryRouter('#/print/ci1'), storage, cloud }));
    app.start();
    await flush();
    const before = storage.get(PREFS_KEY);
    app.showTablesView('list');
    app.showPrintBW(false);
    app.showPrintCompact(false);
    await flush();
    expect(save).not.toHaveBeenCalled();
    expect(storage.get(PREFS_KEY)).toBe(before);
    expect([app.tablesView, app.printBW, app.printCompact]).toEqual(['grid', true, true]);
    app.stop();
  });

  it("moves the default on the account's answer and keeps a page's pick", async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const storage = memoryStorage();
    const app = new AppState(fakeEnv({ router: memoryRouter('#/print/ci1'), storage, cloud }));
    app.start();
    await flush();
    app.showPrintCompact(false);
    await cloud.prefs.save({ view: 'list', printBw: false });
    storage.fireExternalChange(null);
    await flush();
    expect([app.tablesView, app.printBW, app.printCompact]).toEqual(['list', false, true]);
    expect([app.shownTablesView, app.shownPrintBW, app.shownPrintCompact]).toEqual([
      'list',
      false,
      false
    ]);
    expect(app.printChanged).toBe(true);
    app.stop();
  });
});

describe('whether storage works, read once at construction', () => {
  it('is true for storage that works, false for storage that refuses', () => {
    expect(new AppState(at('#/lists')).storageWorks).toBe(true);
    expect(new AppState(at('#/lists', { storage: brokenStorage() })).storageWorks).toBe(false);
  });
});

describe('the install link', () => {
  it('is offered where the app is not installed', () => {
    expect(new AppState(at('#/roll/std')).showInstall).toBe(true);
  });

  it('is not offered inside the installed app', () => {
    expect(
      new AppState(at('#/roll/std', { pwa: fakePwa({ standalone: true }) })).showInstall
    ).toBe(false);
  });
});

describe('links to hand somebody else', () => {
  it('follow the language on screen', () => {
    const app = new AppState(at('#/roll/std'));
    expect(app.linkToRecord('w1')).toBe('https://example.test/i/w1.html');
    expect(app.linkTo('#/lists')).toBe('https://example.test/#/lists');
    app.setLang('en');
    expect(app.linkToRecord('w1')).toBe('https://example.test/i/en/w1.html');
    expect(app.linkTo('#/lists')).toBe('https://example.test/en/#/lists');
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
       string, and a list route - `l/...` or `lists/...` - is never that string,
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

  it('opens a new list at its payload, claimed by id even when it has no entry', () => {
    const empty: StoredList = { id: 'e', name: 'Пусто', ids: [] };
    const app = new AppState(at('#/lists'));
    app.openNewList(empty);
    const payload = encodeList(empty, true);
    expect(app.hash).toBe(sharedListHash(payload));
    expect(app.openList).toBe('e');
    expect(app.urlPayload).toBe(payload);
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

  it('stop() also hides a standing toast', () => {
    vi.useFakeTimers();
    const app = new AppState(at('#/roll/std'));
    app.start();
    app.say(() => 'one');
    expect(app.toast).not.toBeNull();
    app.stop();
    expect(app.toast).toBeNull();
    vi.useRealTimers();
  });

  it('does not double-count a navigation go() itself just wrote, once start() is listening', () => {
    /* Without the guard, a fake router's synchronous announce meant go()'s
       own bookkeeping and the router handler it triggered both counted the
       same navigation - reachable only once both start() and go() are used
       together, which no prior test did. */
    const router = memoryRouter('#/roll/std');
    const app = new AppState(fakeEnv({ router }));
    app.start();
    app.go('#/lists');
    expect(app.navigations).toBe(1);
    expect(app.hash).toBe('#/lists');
  });

  it('falls back home when go() itself is handed an unreadable hash', () => {
    const router = memoryRouter('#/tables');
    const app = new AppState(fakeEnv({ router, storage: stored({ [HOME_KEY]: '#/search' }) }));
    app.go('#/nonsense');
    expect(app.hash).toBe('#/search');
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
    /* Unlike boot (above), a bare address met after the app is already
       running never consults the pinned home - live's own home check runs
       once at boot only, app.js 4610-4614 - so it always lands on
       `#/roll/std`. */
    const router = memoryRouter('#/tables');
    const app = new AppState(fakeEnv({ router, storage: stored({ [HOME_KEY]: '#/search' }) }));
    app.start();
    router.navigate('#/');
    expect(app.hash).toBe('#/roll/std');
    expect(router.stack).toEqual(['#/tables', '#/']);
  });

  it('reaching an unreadable address by navigating replaces it with the pinned section', () => {
    /* The same fallback rule the boot branch above uses for an unknown
       kind. */
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

  it("does not swallow a later Back/Forward landing on go()'s own unchanged target", () => {
    /* go(X) used to set #expectHash unconditionally, even when X is already
       the address showing - a real browser then fires no hashchange for that
       write, so nothing ever cleared it. A subsequent Back/Forward landing on
       exactly X arrived past that guard and was swallowed as if it were go()'s
       own echo, though it never was: go() itself changed nothing that time. */
    const router = quirkyRouter('#/roll/std');
    const app = new AppState(fakeEnv({ router }));
    app.start();

    app.go('#/lists');
    expect(app.navigations).toBe(1);

    app.go('#/lists'); // same target go() already wrote - real browser: silent
    expect(app.navigations).toBe(2);

    router.fire('#/lists'); // a genuine Back/Forward landing on that address
    expect(app.navigations).toBe(3);
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

  it('drops every taken count on go() and on clearSel()', () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/tables') }));
    app.sel.add('ci1');
    app.pick('ci1', 2);
    app.go('#/lists');
    expect(app.picked.size).toBe(0);

    app.sel.add('ci1');
    app.pick('ci1', 2);
    app.clearSel();
    expect(app.picked.size).toBe(0);
  });

  it('drops the taken count of an id unticked through toggleSel or toggleAllIn', () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/tables') }));
    app.toggleSel('ci1');
    app.toggleSel('q1');
    app.pick('ci1', 2);
    app.pick('q1', 3);
    app.toggleSel('ci1');
    expect([...app.picked]).toEqual([['q1', 3]]);

    app.toggleAllIn(['q1']);
    expect(app.picked.size).toBe(0);
  });

  it('keepTicksIn drops the ticks and counts of entries not in the list', () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/tables') }));
    app.toggleSel('ci1');
    app.toggleSel('cc1');
    app.toggleSel('q1');
    app.pick('ci1', 2);
    app.pick('cc1', 3);
    app.keepTicksIn(['cc1', 'q1', 'q2']);
    expect([...app.sel]).toEqual(['cc1', 'q1']);
    expect([...app.picked]).toEqual([['cc1', 3]]);
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

  it('keeps the address and remembers the failure when the port cannot unpack, and does not loop', async () => {
    /* Was "lands on #/l/zzzz" - the live shape, since replaced:
       the address itself is left alone; `expandFailed` is what a page reads
       to draw the bad-link state instead. */
    const router = memoryRouter('#/l/~abc');
    const unpack = vi.fn((p: string) => Promise.resolve(p));
    const app = new AppState(fakeEnv({ router, compress: stub(unpack) }));
    await vi.waitFor(() => {
      expect(app.expandFailed).toBe('~abc');
    });
    expect(app.hash).toBe('#/l/~abc');
    expect(router.hash()).toBe('#/l/~abc');
    expect(unpack).toHaveBeenCalledTimes(1);
  });

  it('keeps the address and remembers the failure when unpack rejects', async () => {
    const router = memoryRouter('#/l/~abc');
    const unpack = () => Promise.reject(new Error('no DecompressionStream'));
    const app = new AppState(fakeEnv({ router, compress: stub(unpack) }));
    await vi.waitFor(() => {
      expect(app.expandFailed).toBe('~abc');
    });
    expect(app.hash).toBe('#/l/~abc');
  });

  it('drops a stale failure once the reader has moved to a different route, so an old payload cannot be mistaken for the new one', async () => {
    const router = memoryRouter('#/l/~abc');
    const unpack = () => Promise.reject(new Error('no DecompressionStream'));
    const app = new AppState(fakeEnv({ router, compress: stub(unpack) }));
    await vi.waitFor(() => {
      expect(app.expandFailed).toBe('~abc');
    });
    app.go('#/tables');
    expect(app.expandFailed).toBe('~abc');
    /* Stale, but harmless: the bad-link check also requires `route.packed`
       and a matching payload, neither of which `#/tables` has. */
    expect(app.route.kind).toBe('tables');
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
  it('stays until the next one replaces it on a clock that holds toasts', () => {
    vi.useFakeTimers();
    const clock = { now: () => 0, holdsToasts: () => true };
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1'), clock }));
    app.say(() => 'Раз');
    vi.advanceTimersByTime(60_000);
    expect(app.toast?.msg).toBe('Раз');
    app.say(() => 'Два', { error: true });
    vi.advanceTimersByTime(60_000);
    expect(app.toast?.msg).toBe('Два');
    app.hideToast();
    expect(app.toast).toBeNull();
    vi.useRealTimers();
  });

  it('shows a plain notice for 1600ms', () => {
    vi.useFakeTimers();
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    app.say(() => 'Добавлено в «Клад дракона»');
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
    app.say(() => 'Сначала назовите список', { error: true });
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
    app.say(() => 'Убрано из списка: «Клад»', { action: { label: () => 'Вернуть', run } });
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
    app.say(() => 'one');
    vi.advanceTimersByTime(1000);
    app.say(() => 'two');
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
    app.say(() => 'one');
    app.hideToast();
    expect(app.toast).toBeNull();
    vi.advanceTimersByTime(5000);
    expect(app.toast).toBeNull();
    vi.useRealTimers();
  });

  it('redraws a toast in the language switched to and keeps its deadline', () => {
    vi.useFakeTimers();
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    app.say((t) => t.homeSet);
    expect(app.toast?.msg).toBe(dict('ru').homeSet);
    vi.advanceTimersByTime(1000);
    app.setLang('en');
    expect(app.toast?.msg).toBe(dict('en').homeSet);
    vi.advanceTimersByTime(599);
    expect(app.toast).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(app.toast).toBeNull();
    vi.useRealTimers();
  });

  it('holds an action toast while it is hovered or focused and runs on with the time it had left', () => {
    vi.useFakeTimers();
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    app.say(() => 'Убрано', { action: { label: () => 'Вернуть', run: vi.fn() } });
    vi.advanceTimersByTime(4000);
    app.holdToast(true);
    vi.advanceTimersByTime(60_000);
    expect(app.toast).not.toBeNull();
    /* A second hold while held keeps the time it had left. */
    app.holdToast(true);
    app.holdToast(false);
    vi.advanceTimersByTime(2999);
    expect(app.toast).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(app.toast).toBeNull();
    /* A release with no hold, and a hold with no toast, do nothing. */
    app.holdToast(false);
    app.holdToast(true);
    expect(app.toast).toBeNull();
    vi.useRealTimers();
  });

  it('never holds a plain notice', () => {
    vi.useFakeTimers();
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    app.say(() => 'Добавлено');
    app.holdToast(true);
    vi.advanceTimersByTime(1600);
    expect(app.toast).toBeNull();
    app.say(() => 'Ошибка', { error: true });
    app.holdToast(true);
    vi.advanceTimersByTime(2600);
    expect(app.toast).toBeNull();
    vi.useRealTimers();
  });

  it('never holds or runs a toast on a clock that holds toasts', () => {
    vi.useFakeTimers();
    const clock = { now: () => 0, holdsToasts: () => true };
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1'), clock }));
    app.say(() => 'Убрано', { action: { label: () => 'Вернуть', run: vi.fn() } });
    app.holdToast(true);
    app.holdToast(false);
    vi.advanceTimersByTime(60_000);
    expect(app.toast?.msg).toBe('Убрано');
    vi.useRealTimers();
  });

  it("carries a link action's href", () => {
    vi.useFakeTimers();
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    app.say(() => 'Предмет добавлен', {
      action: { label: (t) => t.edit, href: '#/homebrew/hb_flask' }
    });
    expect(app.toast).toEqual({
      msg: 'Предмет добавлен',
      mode: 'act',
      action: { label: 'Изменить', href: '#/homebrew/hb_flask' }
    });
    vi.advanceTimersByTime(7000);
    expect(app.toast).toBeNull();
    vi.useRealTimers();
  });

  it("redraws an action's label and keeps its run", () => {
    vi.useFakeTimers();
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    const run = vi.fn();
    app.say((t) => t.noteCleared, { action: { label: (t) => t.undo, run } });
    expect(app.toast?.action?.label).toBe('Вернуть');
    app.setLang('en');
    expect(app.toast?.msg).toBe(dict('en').noteCleared);
    expect(app.toast?.action?.label).toBe('Undo');
    expect(app.toast?.action?.run).toBe(run);
    vi.useRealTimers();
  });
});

describe('the account session', () => {
  const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

  it('is null from the start with no sign-in configured', () => {
    const app = new AppState(at('#/roll/std'));
    expect(app.user).toBeNull();
    app.start();
    expect(app.user).toBeNull();
    app.stop();
  });

  it('is unknown until the cloud answers, then the session', async () => {
    const app = new AppState(at('#/roll/std', { cloud: fakeCloud(SEED, 'gm1') }));
    expect(app.user).toBeUndefined();
    app.start();
    await flush();
    expect(app.user?.email).toBe('gm1@example.test');
    app.stop();
  });

  it('follows a sign-out', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const app = new AppState(at('#/roll/std', { cloud }));
    app.start();
    await flush();
    await cloud.auth.signOut();
    expect(app.user).toBeNull();
    app.stop();
  });

  it('lets a notification win over a first answer read before it', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    let answer: (s: Session | null) => void = () => undefined;
    cloud.auth.session = () =>
      new Promise((r) => {
        answer = r;
      });
    const app = new AppState(at('#/roll/std', { cloud }));
    app.start();
    await cloud.auth.signOut();
    answer({ userId: 'stale', email: 'stale@example.test', provider: 'google' });
    await flush();
    expect(app.user).toBeNull();
    app.stop();
  });

  it('reads a session that cannot be read as signed out', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    cloud.auth.session = () => Promise.reject(new Error('offline'));
    const app = new AppState(at('#/roll/std', { cloud }));
    app.start();
    await flush();
    expect(app.user).toBeNull();
    app.stop();
  });

  it('marks the provider of a link refused as already linked', async () => {
    const cloud = fakeCloud(SEED, 'gm2', {
      returned: {
        kind: 'link',
        provider: 'discord',
        result: { ok: false, error: 'alreadyLinked' },
        action: null
      }
    });
    const app = new AppState(at('#/account', { cloud }));
    app.start();
    await flush();
    expect(app.alreadyLinked).toBe('discord');
    expect(app.toast).toBeNull();
    app.stop();
  });

  it('toasts any other refused redirect, and nothing for one that worked', async () => {
    const refused = new AppState(
      at('#/account', {
        cloud: fakeCloud(SEED, undefined, {
          returned: {
            kind: 'signIn',
            provider: null,
            result: { ok: false, error: 'failed' },
            action: null
          }
        })
      })
    );
    refused.start();
    await flush();
    expect(refused.toast).toEqual({
      msg: 'Не получилось. Попробуйте ещё раз.',
      mode: 'err',
      action: undefined
    });
    expect(refused.alreadyLinked).toBeNull();
    refused.stop();

    const worked = new AppState(
      at('#/account', {
        cloud: fakeCloud(SEED, 'gm1', {
          returned: { kind: 'link', provider: 'discord', result: { ok: true }, action: null }
        })
      })
    );
    worked.start();
    await flush();
    expect(worked.toast).toBeNull();
    worked.stop();
  });

  it('stops listening, and ignores answers that arrive after stop()', async () => {
    const cloud = fakeCloud(SEED, 'gm1', {
      returned: {
        kind: 'link',
        provider: 'discord',
        result: { ok: false, error: 'alreadyLinked' },
        action: null
      }
    });
    const app = new AppState(at('#/roll/std', { cloud }));
    app.start();
    app.stop();
    await flush();
    expect(app.user).toBeUndefined();
    expect(app.alreadyLinked).toBeNull();
    await cloud.auth.signOut();
    expect(app.user).toBeUndefined();
  });

  it('names the static pages of the language on screen', () => {
    const app = new AppState(at('#/roll/std'));
    expect(app.pagesDir).toBe('pages/');
    app.setLang('en');
    expect(app.pagesDir).toBe('pages/en/');
  });
});

describe('account preferences', () => {
  const PREFS_KEY = 'dhloot.prefs.v1';
  const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

  /** A signed-in app over its own storage, started and settled. */
  async function signedIn(
    cloud: CloudPort,
    initial: Record<string, string> = {},
    hash = '#/roll/std'
  ): Promise<{ app: AppState; storage: FakeStoragePort; router: RouterPort }> {
    const storage = memoryStorage(initial);
    const router = memoryRouter(hash);
    const app = new AppState(fakeEnv({ router, storage, cloud }));
    app.start();
    await flush();
    return { app, storage, router };
  }

  it("applies the account's row over this browser's values, saving nothing back", async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const save = vi.spyOn(cloud.prefs, 'save');
    const { app, storage } = await signedIn(cloud, { [LANG_KEY]: 'en' });
    expect(app.lang).toBe('ru');
    expect(storage.get(LANG_KEY)).toBe('ru');
    expect([app.tablesView, app.printBW, app.printCompact]).toEqual(['grid', true, true]);
    expect(storage.get(PREFS_KEY)).toBe('{"view":"grid","printBw":true,"printCompact":true}');
    expect(save).not.toHaveBeenCalled();
    app.stop();
  });

  it("pins the account's starting section without navigating", async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    await cloud.prefs.save({ home: '#/tables/dread' });
    const { app, storage, router } = await signedIn(cloud);
    expect(app.home).toBe('#/tables/dread');
    expect(storage.get(HOME_KEY)).toBe('#/tables/dread');
    expect(router.hash()).toBe('#/roll/std');
    app.stop();
  });

  it('removes the pin key for the default section', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    await cloud.prefs.save({ home: '#/roll/std' });
    const { app, storage } = await signedIn(cloud, { [HOME_KEY]: '#/tables/dread' });
    expect(app.home).toBe('#/roll/std');
    expect(storage.get(HOME_KEY)).toBeNull();
    app.stop();
  });

  it('ignores a starting section the pin check refuses', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    await cloud.prefs.save({ home: '#/i/w1' });
    const { app, storage, router } = await signedIn(cloud, { [HOME_KEY]: '#/tables/dread' });
    expect(app.home).toBe('#/tables/dread');
    expect(storage.get(HOME_KEY)).toBe('#/tables/dread');
    expect(router.hash()).toBe('#/roll/std');
    app.stop();
  });

  it("seeds an account with no row from this browser's five values, once", async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const save = vi.spyOn(cloud.prefs, 'save');
    const { app } = await signedIn(cloud, {
      [LANG_KEY]: 'en',
      [HOME_KEY]: '#/tables/dread',
      [PREFS_KEY]: '{"view":"grid","printBw":false,"printCompact":true}'
    });
    expect(save).toHaveBeenCalledOnce();
    expect(save).toHaveBeenCalledWith({
      lang: 'en',
      home: '#/tables/dread',
      view: 'grid',
      printBw: false,
      printCompact: true,
      notifyGm: 'ask'
    });
    app.stop();
  });

  it('applies and saves nothing when the read fails', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    cloud.prefs.load = () => Promise.resolve({ ok: false });
    const save = vi.spyOn(cloud.prefs, 'save');
    const { app, storage } = await signedIn(cloud, { [LANG_KEY]: 'en' });
    expect(app.lang).toBe('en');
    expect(app.tablesView).toBe('list');
    expect(storage.get(PREFS_KEY)).toBeNull();
    expect(save).not.toHaveBeenCalled();
    app.stop();
  });

  it('saves the whole object once from each of the five setters, signed in', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const save = vi.spyOn(cloud.prefs, 'save');
    const { app } = await signedIn(cloud);
    const presses: [string, () => void][] = [
      [
        'setLang',
        () => {
          app.setLang('en');
        }
      ],
      [
        'setTablesView',
        () => {
          app.setTablesView('list');
        }
      ],
      ['toggleHome', () => app.toggleHome('#/tables/dread')],
      [
        'setPrintBW',
        () => {
          app.setPrintBW(false);
        }
      ],
      [
        'setPrintCompact',
        () => {
          app.setPrintCompact(false);
        }
      ]
    ];
    for (const [name, press] of presses) {
      save.mockClear();
      press();
      await flush();
      expect(save, name).toHaveBeenCalledOnce();
    }
    expect(save).toHaveBeenLastCalledWith({
      lang: 'en',
      home: '#/tables/dread',
      view: 'list',
      printBw: false,
      printCompact: false,
      notifyGm: 'ask'
    });
    await flush();
    expect(await cloud.prefs.load()).toEqual({
      ok: true,
      prefs: {
        lang: 'en',
        home: '#/tables/dread',
        view: 'list',
        printBw: false,
        printCompact: false,
        notifyGm: 'ask'
      }
    });
    app.stop();
  });

  it('runs one save at a time, then the newest once, and takes stale from it', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { app, storage } = await signedIn(cloud);
    const answers: ((ok: boolean) => void)[] = [];
    const sent: Prefs[] = [];
    cloud.prefs.save = (p) => {
      sent.push(p);
      return new Promise((r) => answers.push(r));
    };
    const load = vi.spyOn(cloud.prefs, 'load');
    app.setTablesView('list');
    app.setPrintBW(false);
    app.setPrintCompact(false);
    expect(sent).toHaveLength(1);
    storage.fireExternalChange(null);
    await flush();
    expect(load).not.toHaveBeenCalled();
    answers[0]?.(false);
    await flush();
    expect(sent).toHaveLength(2);
    expect(sent[1]).toMatchObject({ view: 'list', printBw: false, printCompact: false });
    expect(load).not.toHaveBeenCalled();
    answers[1]?.(true);
    await flush();
    expect(load).toHaveBeenCalledOnce();
    storage.fireExternalChange(null);
    await flush();
    expect(sent).toHaveLength(2);
    expect(load).toHaveBeenCalledTimes(2);
    app.stop();
  });

  it('saves nothing signed out, nor from a pin storage refused', async () => {
    const out = fakeCloud(SEED);
    const outSave = vi.spyOn(out.prefs, 'save');
    const { app } = await signedIn(out);
    app.setLang('en');
    app.setTablesView('grid');
    app.toggleHome('#/tables/dread');
    app.setPrintBW(true);
    app.setPrintCompact(true);
    expect(outSave).not.toHaveBeenCalled();
    app.stop();

    const cloud = fakeCloud(SEED, 'gm1');
    const save = vi.spyOn(cloud.prefs, 'save');
    const broken = new AppState(
      fakeEnv({ router: memoryRouter('#/roll/std'), storage: brokenStorage(), cloud })
    );
    broken.start();
    await flush();
    expect(broken.toggleHome('#/tables/dread')).toBe(false);
    expect(save).not.toHaveBeenCalled();
    broken.stop();
  });

  it('lets a local change made while the read is pending win over the row', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const real = cloud.prefs.load.bind(cloud.prefs);
    let release: () => void = () => undefined;
    cloud.prefs.load = () =>
      new Promise((r) => {
        release = () => {
          void real().then(r);
        };
      });
    const save = vi.spyOn(cloud.prefs, 'save');
    const { app } = await signedIn(cloud);
    app.setTablesView('list');
    release();
    await flush();
    expect(app.tablesView).toBe('list');
    expect(app.printBW).toBe(false);
    expect(save).toHaveBeenCalledOnce();
    app.stop();
  });

  it('keeps every local value on sign-out', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { app, storage } = await signedIn(cloud, { [LANG_KEY]: 'en' });
    await cloud.auth.signOut();
    expect(app.user).toBeNull();
    expect([app.lang, app.tablesView, app.printBW]).toEqual(['ru', 'grid', true]);
    expect(storage.get(PREFS_KEY)).toBe('{"view":"grid","printBw":true,"printCompact":true}');
    app.stop();
  });

  it('pulls again for another user, and not for the same user notified twice', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const load = vi.spyOn(cloud.prefs, 'load');
    const { app } = await signedIn(cloud);
    expect(load).toHaveBeenCalledOnce();
    await cloud.auth.link('discord');
    await flush();
    expect(load).toHaveBeenCalledOnce();
    await cloud.auth.signOut();
    await cloud.auth.signIn('google');
    await flush();
    expect(load).toHaveBeenCalledTimes(2);
    expect(app.tablesView).toBe('grid');
    app.stop();
  });

  it('pulls again when the tab is shown again, signed in', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { app, storage } = await signedIn(cloud);
    await cloud.prefs.save({ view: 'list', lang: 'en' });
    storage.fireExternalChange(null);
    await flush();
    expect([app.tablesView, app.lang]).toEqual(['list', 'en']);
    app.stop();
  });

  it('saves instead of pulling when the last save was refused', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { app, storage } = await signedIn(cloud);
    const load = vi.spyOn(cloud.prefs, 'load');
    const save = vi.spyOn(cloud.prefs, 'save').mockResolvedValueOnce(false);
    app.setTablesView('list');
    await flush();
    storage.fireExternalChange(null);
    await flush();
    expect(load).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledTimes(2);
    expect(await cloud.prefs.load()).toMatchObject({ ok: true, prefs: { view: 'list' } });
    storage.fireExternalChange(null);
    await flush();
    expect(load).toHaveBeenCalledTimes(2);
    app.stop();
  });

  it('does nothing for a named key, signed out, or after stop()', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { app, storage } = await signedIn(cloud);
    const load = vi.spyOn(cloud.prefs, 'load');
    storage.fireExternalChange(LANG_KEY);
    app.stop();
    storage.fireExternalChange(null);
    await flush();
    expect(load).not.toHaveBeenCalled();

    const out = fakeCloud(SEED);
    const outLoad = vi.spyOn(out.prefs, 'load');
    const signedOut = await signedIn(out);
    signedOut.storage.fireExternalChange(null);
    await flush();
    expect(outLoad).not.toHaveBeenCalled();
    signedOut.app.stop();
  });

  it('sets the starting section from a section or a table, and saves it to the row', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { app, storage } = await signedIn(cloud);
    for (const [hash, pin] of [
      ['#/search', '#/search'],
      ['#/tables/dread', '#/tables/dread'],
      ['#/tables/frames', '#/tables/other_frames']
    ] as const) {
      expect(app.setHome(hash), hash).toBe(true);
      expect(app.home).toBe(pin);
      expect(storage.get(HOME_KEY)).toBe(pin);
      await flush();
      expect(await cloud.prefs.load()).toMatchObject({ ok: true, prefs: { home: pin } });
    }
    app.stop();
  });

  it('removes the pin key for the default section, and saves it to the row', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { app, storage } = await signedIn(cloud, { [HOME_KEY]: '#/tables/dread' });
    expect(app.setHome('#/roll/std')).toBe(true);
    expect(app.home).toBe('#/roll/std');
    expect(storage.get(HOME_KEY)).toBeNull();
    await flush();
    expect(await cloud.prefs.load()).toMatchObject({ ok: true, prefs: { home: '#/roll/std' } });
    app.stop();
  });

  it('refuses a record as the starting section, and a pin storage refused', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const save = vi.spyOn(cloud.prefs, 'save');
    const { app, storage } = await signedIn(cloud, { [HOME_KEY]: '#/search' });
    expect(app.setHome('#/i/ci1')).toBe(false);
    expect(app.home).toBe('#/search');
    expect(storage.get(HOME_KEY)).toBe('#/search');
    expect(save).not.toHaveBeenCalled();
    app.stop();

    const broken = new AppState(
      fakeEnv({ router: memoryRouter('#/roll/std'), storage: brokenStorage(), cloud })
    );
    broken.start();
    await flush();
    expect(broken.setHome('#/tables/dread')).toBe(false);
    expect(broken.home).toBe('#/roll/std');
    expect(save).not.toHaveBeenCalled();
    broken.stop();
  });

  it('asks by default and keeps the notify answer in the row, in no storage key', async () => {
    expect(new AppState(at('#/roll/std')).notifyGm).toBe('ask');
    const cloud = fakeCloud(SEED, 'gm1');
    const { app, storage } = await signedIn(cloud);
    expect(app.notifyGm).toBe('ask');
    const set = vi.spyOn(storage, 'set');
    app.setNotifyGm('always');
    expect(app.notifyGm).toBe('always');
    expect(set).not.toHaveBeenCalled();
    await flush();
    expect(await cloud.prefs.load()).toMatchObject({ ok: true, prefs: { notifyGm: 'always' } });
    app.stop();
  });

  it("applies the row's notify answer, and reads a row without one as ask", async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await cloud.prefs.save({ notifyGm: 'never' });
    const { app, storage } = await signedIn(cloud);
    expect(app.notifyGm).toBe('never');
    await cloud.prefs.save({ view: 'list' });
    storage.fireExternalChange(null);
    await flush();
    expect(app.notifyGm).toBe('ask');
    app.stop();
  });

  it("seeds a new user's row with ask after the previous user chose always", async () => {
    const cloud = fakeCloud({ ...SEED, defaultUser: 'gm2' }, 'gm1');
    const save = vi.spyOn(cloud.prefs, 'save');
    const { app } = await signedIn(cloud);
    app.setNotifyGm('always');
    await flush();
    await cloud.auth.signOut();
    expect(app.notifyGm).toBe('ask');
    save.mockClear();
    await cloud.auth.signIn('google');
    await flush();
    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0]?.[0]).toMatchObject({ notifyGm: 'ask' });
    app.stop();
  });

  it('saves no notify answer signed out', async () => {
    const out = fakeCloud(SEED);
    const save = vi.spyOn(out.prefs, 'save');
    const { app } = await signedIn(out);
    app.setNotifyGm('never');
    await flush();
    expect(save).not.toHaveBeenCalled();
    app.stop();
  });
});

describe('account lists', () => {
  const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
  const loot: Loot = {
    items: {
      core_item: [
        { id: 'ci1', src: 'core', kind: 'item', en: 'A', ende: '', ru: 'А', rud: '', roll: 1 },
        { id: 'q1', src: 'core', kind: 'item', en: 'B', ende: '', ru: 'Б', rud: '', roll: 2 }
      ]
    }
  };
  const SHOP = '00000000-0000-4000-8000-000000000101';

  function started(cloud: CloudPort | null, hash: string, over: Partial<Env> = {}) {
    const router = memoryRouter(hash);
    const storage = memoryStorage();
    const app = new AppState(
      fakeEnv({ router, storage, cloud, data: { load: () => loot }, ...over })
    );
    app.start();
    return { app, router, storage };
  }

  it('creates where the reader can: locally with no sign-in, waits, prompts, or the account', async () => {
    expect(started(null, '#/lists').app.newListTarget).toBe('local');
    const cloud = fakeCloud(SEED);
    const { app } = started(cloud, '#/lists');
    expect(app.newListTarget).toBe('wait');
    await flush();
    expect(app.newListTarget).toBe('prompt');
    await cloud.auth.signIn('google');
    expect(app.newListTarget).toBe('cloud');
    app.stop();
  });

  it("loads the account's lists on sign-in and names the store that holds a list", async () => {
    const { app } = started(fakeCloud(SEED, 'gm1'), '#/lists');
    await flush();
    expect(app.cloudLists?.status).toBe('ready');
    expect(app.cloudLists?.lists.map((l) => l.name)).toEqual([
      'Пустой список',
      'Лавка кузнеца',
      'Трофеи'
    ]);
    expect(app.storeFor(SHOP)).toBe(app.cloudLists);
    expect(app.storeFor('l1')).toBe(app.lists);
    app.stop();
  });

  it('remembers a prompt until the reader leaves the account page', async () => {
    const { app, router } = started(fakeCloud(SEED), '#/tables/eq_weapon');
    await flush();
    const after = { hash: '#/tables/eq_weapon' };
    app.askSignIn(after);
    expect(app.hash).toBe('#/account');
    expect(app.signInFor).toBe(after);
    router.navigate('#/account');
    expect(app.signInFor).toBe(after);
    router.navigate('#/roll/std');
    expect(app.signInFor).toBeNull();
    app.askSignIn(after);
    app.go('#/lists');
    expect(app.signInFor).toBeNull();
    app.stop();
  });

  it('returns after sign-in with the same rows ticked and the menu open', async () => {
    const cloud = fakeCloud(SEED);
    const signIn = vi.spyOn(cloud.auth, 'signIn');
    const { app } = started(cloud, '#/tables/eq_weapon');
    await flush();
    const after = {
      hash: '#/tables/eq_weapon',
      action: { do: 'addToList' as const, key: 'sel', ids: ['ci1', 'q1'], picked: { q1: 2 } }
    };
    app.askSignIn(after);
    expect(await app.signIn('google')).toEqual({ ok: true });
    expect(signIn).toHaveBeenCalledWith('google', after);
    expect(app.hash).toBe('#/tables/eq_weapon');
    expect(app.signInFor).toBeNull();
    await flush();
    expect([...app.sel]).toEqual(['ci1', 'q1']);
    expect([...app.picked]).toEqual([['q1', 2]]);
    expect(app.menuFor).toBe('sel');
    app.stop();
  });

  it("opens a card's menu without ticking its record", async () => {
    const { app } = started(fakeCloud(SEED), '#/i/ci1');
    await flush();
    app.askSignIn({ hash: '#/i/ci1', action: { do: 'addToList', key: 'ci1', ids: ['ci1'] } });
    await app.signIn('discord');
    await flush();
    expect(app.hash).toBe('#/i/ci1');
    expect(app.menuFor).toBe('ci1');
    expect(app.sel.size).toBe(0);
    app.stop();
  });

  it('stays on the account page after a sign-in no prompt started', async () => {
    const { app } = started(fakeCloud(SEED), '#/account');
    await flush();
    expect(await app.signIn('google')).toEqual({ ok: true });
    expect(app.hash).toBe('#/account');
    app.stop();
  });

  it('answers a refusal, and a build with no sign-in, without moving', async () => {
    const cloud = fakeCloud(SEED);
    cloud.auth.signIn = () => Promise.resolve({ ok: false, error: 'failed' });
    const { app } = started(cloud, '#/lists');
    await flush();
    app.askSignIn({ hash: '#/lists' });
    expect(await app.signIn('google')).toEqual({ ok: false, error: 'failed' });
    expect(app.hash).toBe('#/account');
    app.stop();
    expect(await new AppState(at('#/account')).signIn('google')).toEqual({
      ok: false,
      error: 'failed'
    });
  });

  it('finishes the action a provider redirect brought back, once the lists are read', async () => {
    const action = { do: 'addToList' as const, key: 'sel', ids: ['ci1'] };
    const cloud = fakeCloud(SEED, 'gm1', {
      returned: { kind: 'signIn', provider: 'google', result: { ok: true }, action }
    });
    const { app } = started(cloud, '#/tables/eq_weapon');
    await flush();
    await flush();
    expect(app.menuFor).toBe('sel');
    expect([...app.sel]).toEqual(['ci1']);
    app.stop();
  });

  it('saves an old shared link into the account and opens the copy', async () => {
    const shared = encodeList({ name: 'Лавка', ids: ['ci1', 'q1'] }, true);
    const { app } = started(fakeCloud(SEED), sharedListHash(shared));
    await flush();
    app.askSignIn({ hash: app.hash, action: { do: 'saveList' } });
    await app.signIn('google');
    await flush();
    expect(app.hash).toBe('#/lists/00000000-0000-4000-8000-000000005000');
    expect(app.cloudLists?.get('00000000-0000-4000-8000-000000005000')).toMatchObject({
      name: 'Лавка',
      ids: ['ci1', 'q1']
    });
    expect(app.toast?.msg).toBe('Список «Лавка» создан');
    app.stop();
  });

  it('waits for a packed link to expand before it saves it', async () => {
    const shared = encodeList({ name: 'Лавка', ids: ['ci1'] }, true);
    let expand: (plain: string) => void = () => undefined;
    const compress: CompressPort = {
      available: () => true,
      pack: (raw) => Promise.resolve(raw),
      unpack: () =>
        new Promise((r) => {
          expand = r;
        })
    };
    const action = { do: 'saveList' as const };
    const cloud = fakeCloud(SEED, 'gm1', {
      returned: { kind: 'signIn', provider: 'google', result: { ok: true }, action }
    });
    const { app } = started(cloud, '#/l/~packed', { compress });
    await flush();
    expect(app.hash).toBe('#/l/~packed');
    expand(shared);
    await flush();
    expect(app.hash).toBe('#/lists/00000000-0000-4000-8000-000000005000');
    app.stop();
  });

  it('forgets a waiting save when the reader moves to another shared link', async () => {
    const shared = encodeList({ name: 'Лавка', ids: ['ci1'] }, true);
    let expand: (plain: string) => void = () => undefined;
    const compress: CompressPort = {
      available: () => true,
      pack: (raw) => Promise.resolve(raw),
      unpack: () =>
        new Promise((r) => {
          expand = r;
        })
    };
    const action = { do: 'saveList' as const };
    const cloud = fakeCloud(SEED, 'gm1', {
      returned: { kind: 'signIn', provider: 'google', result: { ok: true }, action }
    });
    const { app, router } = started(cloud, '#/l/~packed', { compress });
    await flush();
    router.navigate('#/l/~other');
    expand(shared);
    await flush();
    expect(app.route.kind).toBe('sharedList');
    expect(app.cloudLists?.lists).toHaveLength(3);
    app.stop();
  });

  it('forgets a waiting action and its typed name on sign-out', async () => {
    const action = { do: 'addToList' as const, key: 'sel', ids: ['ci1'], name: 'Клад' };
    const cloud = fakeCloud(SEED, 'gm1', {
      returned: { kind: 'signIn', provider: 'google', result: { ok: true }, action }
    });
    const read = cloud.lists.list.bind(cloud.lists);
    let answer: () => void = () => undefined;
    cloud.lists.list = () =>
      new Promise((r) => {
        answer = () => {
          r(read());
        };
      });
    const { app } = started(cloud, '#/tables/eq_weapon');
    await flush();
    await cloud.auth.signOut();
    await cloud.auth.signIn('google');
    await flush();
    answer();
    await flush();
    expect(app.cloudLists?.status).toBe('ready');
    expect(app.menuFor).toBe('');
    expect(app.sel.size).toBe(0);
    expect(app.pendingListName).toBeNull();
    app.stop();
  });

  it('drops a save that returns to a page that is not a shared list', async () => {
    const action = { do: 'saveList' as const };
    const cloud = fakeCloud(SEED, 'gm1', {
      returned: { kind: 'signIn', provider: 'google', result: { ok: true }, action }
    });
    const { app } = started(cloud, '#/lists');
    await flush();
    await flush();
    expect(app.hash).toBe('#/lists');
    expect(app.cloudLists?.lists).toHaveLength(3);
    app.stop();
  });

  it('leaves an account list page for the index on sign-out, with no account list kept', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { app, router } = started(cloud, '#/lists/' + SHOP);
    await flush();
    expect(app.cloudLists?.get(SHOP)).toBeDefined();
    await cloud.auth.signOut();
    expect(app.hash).toBe('#/lists');
    expect(router.hash()).toBe('#/lists');
    expect(app.cloudLists?.lists).toEqual([]);
    expect(app.cloudLists?.status).toBe('idle');
    app.stop();
  });

  it('keeps a signed-out reader on an account address, and a local list page on sign-out', async () => {
    const out = started(fakeCloud(SEED), '#/lists/' + SHOP);
    await flush();
    expect(out.app.hash).toBe('#/lists/' + SHOP);
    out.app.stop();
    const cloud = fakeCloud(SEED, 'gm1');
    const local = started(cloud, '#/lists/l1');
    await flush();
    await cloud.auth.signOut();
    expect(local.app.hash).toBe('#/lists/l1');
    local.app.stop();
  });

  it('re-reads the lists when the tab is shown again', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { app, storage } = started(cloud, '#/lists');
    await flush();
    const list = vi.spyOn(cloud.lists, 'list');
    storage.fireExternalChange(null);
    await flush();
    expect(list).toHaveBeenCalledOnce();
    app.stop();
  });

  it('re-reads every 45 s on the index and an account list page while Realtime is down, not elsewhere', async () => {
    vi.useFakeTimers();
    try {
      const cloud = fakeCloud(SEED, 'gm1', { live: false });
      const { app } = started(cloud, '#/lists');
      await vi.advanceTimersByTimeAsync(0);
      const list = vi.spyOn(cloud.lists, 'list');
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(list).toHaveBeenCalledTimes(1);
      app.go('#/lists/' + SHOP);
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(list).toHaveBeenCalledTimes(2);
      app.go('#/tables/eq_weapon');
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(list).toHaveBeenCalledTimes(2);
      app.stop();
      app.go('#/lists');
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(list).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('re-reads nothing signed out', async () => {
    vi.useFakeTimers();
    try {
      const cloud = fakeCloud(SEED);
      const list = vi.spyOn(cloud.lists, 'list');
      const { app } = started(cloud, '#/lists');
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(list).not.toHaveBeenCalled();
      app.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('re-reads an open share link every 45 s signed out while Realtime is down, not elsewhere, and moves the clock', async () => {
    vi.useFakeTimers({ now: new Date('2026-09-25T12:00:00Z') });
    try {
      const cloud = fakeCloud(SEED, undefined, { live: false });
      const { app } = started(cloud, '#/s/player-token-1');
      await app.sharedView?.open('player-token-1', null);
      const read = vi.spyOn(cloud.shares, 'read');
      const before = app.now;
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(read).toHaveBeenCalledOnce();
      expect(app.now).toBe(before + LIST_POLL_MS);
      app.go('#/tables/eq_weapon');
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(read).toHaveBeenCalledOnce();
      expect(app.now).toBe(before + 2 * LIST_POLL_MS);
      app.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('re-reads an open share link and moves the clock when the tab is shown again, signed out', async () => {
    const cloud = fakeCloud(SEED);
    const { app, storage } = started(cloud, '#/s/player-token-1');
    await flush();
    await app.sharedView?.open('player-token-1', null);
    const read = vi.spyOn(cloud.shares, 'read');
    app.now = 0;
    storage.fireExternalChange(null);
    await flush();
    expect(read).toHaveBeenCalledOnce();
    expect(app.now).toBeGreaterThan(0);
    storage.fireExternalChange('dhloot.lists.v1');
    await flush();
    expect(read).toHaveBeenCalledOnce();
    app.stop();
  });

  it('reads an open share link on no 45 s tick while Realtime is live, and still when shown again', async () => {
    vi.useFakeTimers({ now: new Date('2026-09-25T12:00:00Z') });
    try {
      const cloud = fakeCloud(SEED);
      const { app, storage } = started(cloud, '#/s/player-token-1');
      await app.sharedView?.open('player-token-1', null);
      await vi.advanceTimersByTimeAsync(1000);
      expect(app.sharedView?.live).toBe(true);
      const read = vi.spyOn(cloud.shares, 'read');
      const before = app.now;
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(read).not.toHaveBeenCalled();
      expect(app.now).toBe(before + LIST_POLL_MS);
      storage.fireExternalChange(null);
      await vi.advanceTimersByTimeAsync(0);
      expect(read).toHaveBeenCalledOnce();
      cloud.setLive(false);
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(app.sharedView?.live).toBe(false);
      expect(read.mock.calls.length).toBeGreaterThanOrEqual(3);
      app.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('reads the account on no 45 s tick while Realtime is live, and retries a failed first read', async () => {
    vi.useFakeTimers();
    try {
      const cloud = fakeCloud(SEED, 'gm1');
      const list = vi.spyOn(cloud.lists, 'list').mockResolvedValueOnce({ ok: false });
      const { app } = started(cloud, '#/lists');
      await vi.advanceTimersByTimeAsync(1000);
      expect(app.cloudLists?.status).toBe('error');
      expect(app.cloudLists?.live).toBe(true);
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(app.cloudLists?.status).toBe('ready');
      const reads = list.mock.calls.length;
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(list).toHaveBeenCalledTimes(reads);
      cloud.setLive(false);
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(app.cloudLists?.live).toBe(false);
      expect(list.mock.calls.length).toBeGreaterThan(reads);
      app.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('leaves the owner topic on sign-out', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { app } = started(cloud, '#/lists');
    await flush();
    await flush();
    expect(app.cloudLists?.live).toBe(true);
    await cloud.auth.signOut();
    expect(app.cloudLists?.live).toBe(false);
    app.stop();
  });

  it('reads a share link whose first read failed again on the next tick and when shown again', async () => {
    vi.useFakeTimers({ now: new Date('2026-09-25T12:00:00Z') });
    try {
      const cloud = fakeCloud(SEED);
      const read = vi
        .spyOn(cloud.shares, 'read')
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false });
      const { app, storage } = started(cloud, '#/s/player-token-1');
      await app.sharedView?.open('player-token-1', null);
      expect(app.sharedView?.status).toBe('error');
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(read).toHaveBeenCalledTimes(2);
      expect(app.sharedView?.status).toBe('error');
      storage.fireExternalChange(null);
      await vi.advanceTimersByTimeAsync(0);
      /* The third read draws the list; the join's own re-read may follow it. */
      expect(read.mock.calls.length).toBeGreaterThanOrEqual(3);
      expect(app.sharedView?.status).toBe('ready');
      app.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('saves a share link into the account and opens the copy', async () => {
    const { app } = started(fakeCloud(SEED, 'gm2'), '#/s/player-token-1');
    await flush();
    await app.sharedView?.open('player-token-1', app.user?.userId ?? null);
    await app.saveShareCopy('player-token-1');
    expect(app.hash).toBe('#/lists/00000000-0000-4000-8000-000000005000');
    expect(app.cloudLists?.get('00000000-0000-4000-8000-000000005000')).toMatchObject({
      name: 'Лавка кузнеца',
      note: 'Открыта с рассвета до заката.'
    });
    expect(app.cloudLists?.get('00000000-0000-4000-8000-000000005000')?.hnote).toBeUndefined();
    expect(app.toast?.msg).toBe('Список «Лавка кузнеца» создан');
    expect(app.cloning).toBe(false);
    app.stop();
  });

  it('stays where the reader went while the copy was made', async () => {
    const { app } = started(fakeCloud(SEED, 'gm2'), '#/s/player-token-1');
    await flush();
    const saving = app.saveShareCopy('player-token-1');
    expect(app.cloning).toBe(true);
    await app.saveShareCopy('player-token-1');
    app.go('#/tables/eq_weapon');
    await saving;
    expect(app.hash).toBe('#/tables/eq_weapon');
    expect(app.cloudLists?.lists).toHaveLength(2);
    app.stop();
  });

  it('makes one copy when Save a copy is pressed again while the account is read back', async () => {
    const { app } = started(fakeCloud(SEED, 'gm2'), '#/s/player-token-1');
    await flush();
    const lists = app.cloudLists;
    if (!lists) throw new Error('The account lists are missing. Start the app signed in');
    const load = lists.load.bind(lists);
    let release = (): void => {};
    const held = new Promise<void>((r) => {
      release = r;
    });
    const readBack = vi.spyOn(lists, 'load').mockImplementationOnce(async () => {
      await held;
      await load();
    });
    const saving = app.saveShareCopy('player-token-1');
    await vi.waitFor(() => {
      expect(readBack).toHaveBeenCalledOnce();
    });
    expect(app.cloning).toBe(true);
    await app.saveShareCopy('player-token-1');
    release();
    await saving;
    expect(app.cloning).toBe(false);
    expect(lists.lists).toHaveLength(2);
    app.stop();
  });

  it('says the limit, or the failure, when the copy is refused', async () => {
    const { app } = started(
      fakeCloud(SEED, 'gm2', { limits: { lists: 1 } }),
      '#/s/player-token-1'
    );
    await flush();
    await app.saveShareCopy('player-token-1');
    expect(app.hash).toBe('#/s/player-token-1');
    expect(app.toast).toMatchObject({ mode: 'err' });
    expect(app.toast?.msg).toContain('Достигнут предел списков в аккаунте: 1.');
    await app.saveShareCopy('unknown-token');
    expect(app.toast?.msg).toBe('Не получилось сохранить список себе. Попробуйте ещё раз.');
    app.stop();
  });

  it('copies a share link once a sign-in that a prompt started comes back', async () => {
    const action = { do: 'saveList' as const };
    const cloud = fakeCloud(SEED, 'gm2', {
      returned: { kind: 'signIn', provider: 'google', result: { ok: true }, action }
    });
    const { app } = started(cloud, '#/s/gm-token-1');
    await flush();
    await flush();
    await flush();
    expect(app.hash).toBe('#/lists/00000000-0000-4000-8000-000000005000');
    expect(app.cloudLists?.get('00000000-0000-4000-8000-000000005000')?.hnote).toBe(
      'Кузнец торгуется, если назвать имя его брата.'
    );
    app.stop();
  });
});

describe("the account's write buffer", () => {
  const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
  const SHOP = '00000000-0000-4000-8000-000000000101';
  const nameOf = async (cloud: CloudPort, id: string): Promise<string | undefined> => {
    const read = await cloud.lists.list();
    return read.ok ? read.lists.find((l) => l.id === id)?.name : undefined;
  };

  function started(cloud: CloudPort, hash = '#/lists/' + SHOP, over: Partial<Env> = {}) {
    const page = fakePage();
    const app = new AppState(fakeEnv({ router: memoryRouter(hash), cloud, page, ...over }));
    app.start();
    return { app, page };
  }

  it('sends a buffered edit at once when the tab is hidden, and listens no more once stopped', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const apply = vi.spyOn(cloud.lists, 'apply');
    const { app, page } = started(cloud);
    await flush();
    app.cloudLists?.rename(SHOP, 'Лавка у моста');
    page.fireHidden();
    await flush();
    expect(apply).toHaveBeenCalledOnce();
    expect(await nameOf(cloud, SHOP)).toBe('Лавка у моста');
    app.stop();
    app.cloudLists?.rename(SHOP, 'Лавка');
    page.fireHidden();
    await flush();
    expect(apply).toHaveBeenCalledOnce();
    app.cloudLists?.clear();
  });

  it('sends the buffer before it signs out', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const order: string[] = [];
    const apply = cloud.lists.apply.bind(cloud.lists);
    cloud.lists.apply = (ops) => {
      order.push('apply');
      return apply(ops);
    };
    const signOut = cloud.auth.signOut.bind(cloud.auth);
    cloud.auth.signOut = (scope) => {
      order.push('signOut ' + String(scope));
      return signOut(scope);
    };
    const { app } = started(cloud);
    await flush();
    app.cloudLists?.rename(SHOP, 'Лавка у моста');
    expect(await app.signOut('global')).toEqual({ ok: true });
    expect(order).toEqual(['apply', 'signOut global']);
    await cloud.auth.signIn('google');
    expect(await nameOf(cloud, SHOP)).toBe('Лавка у моста');
    app.stop();
  });

  it('signs out after 5 s when the buffered write never answers', async () => {
    vi.useFakeTimers();
    try {
      const cloud = fakeCloud(SEED, 'gm1');
      cloud.lists.apply = () => new Promise(() => undefined);
      const signOut = vi.spyOn(cloud.auth, 'signOut');
      const { app } = started(cloud);
      await vi.advanceTimersByTimeAsync(0);
      app.cloudLists?.rename(SHOP, 'Не дойдёт');
      let done = false;
      void app.signOut().then(() => {
        done = true;
      });
      await vi.advanceTimersByTimeAsync(SIGN_OUT_WAIT_MS - 1);
      expect(signOut).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(signOut).toHaveBeenCalledWith('local');
      expect(done).toBe(true);
      expect(app.user).toBeNull();
      app.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('answers failed to a sign-out in a build with no sign-in', async () => {
    expect(await new AppState(at('#/account')).signOut()).toEqual({
      ok: false,
      error: 'failed'
    });
  });

  it('sends the buffer before a share link is copied, and copies nothing offline', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const order: string[] = [];
    const apply = cloud.lists.apply.bind(cloud.lists);
    cloud.lists.apply = (ops) => {
      order.push('apply');
      return apply(ops);
    };
    const clone = vi.spyOn(cloud.shares, 'clone');
    const { app } = started(cloud, '#/s/player-token-1');
    await flush();
    const own = '00000000-0000-4000-8000-000000000201';
    app.cloudLists?.rename(own, 'Своё');
    await app.saveShareCopy('player-token-1');
    expect(order).toEqual(['apply']);
    expect(clone).toHaveBeenCalledOnce();
    expect(await nameOf(cloud, own)).toBe('Своё');

    app.go('#/s/player-token-1');
    cloud.setOffline(true);
    app.cloudLists?.rename(own, 'Не дойдёт');
    await app.saveShareCopy('player-token-1');
    expect(clone).toHaveBeenCalledOnce();
    expect(app.toast?.msg).toBe('Не получилось сохранить список себе. Попробуйте ещё раз.');
    expect(app.cloning).toBe(false);
    app.stop();
    app.cloudLists?.clear();
  });

  it('makes no list for an old link over the entry limit, and names the limit', async () => {
    const keys = Array.from({ length: 101 }, (_, i) => 'r' + String(i));
    const loot: Loot = {
      items: {
        core_item: keys.map((id, i) => ({
          id,
          src: 'core',
          kind: 'item',
          en: id,
          ende: '',
          ru: id,
          rud: '',
          roll: i + 1
        }))
      }
    };
    const shared = encodeList({ name: 'Сто одна', ids: keys }, true);
    const cloud = fakeCloud(SEED, 'gm2');
    const { app } = started(cloud, sharedListHash(shared), { data: { load: () => loot } });
    await flush();
    app.saveCopyOf({ name: 'Сто одна', ids: keys, dropped: 0 });
    expect(await app.cloudLists?.flushNow()).toBe(true);
    await flush();
    expect(app.toast?.msg).toBe(
      'Достигнут предел позиций в списке: 100. Нужно больше - напишите на daggerheart.loot@gmail.com.'
    );
    const read = await cloud.lists.list();
    expect(read.ok && read.lists.map((l) => l.name)).not.toContain('Сто одна');
    expect(app.cloudLists?.lists.map((l) => l.name)).not.toContain('Сто одна');
    app.stop();
  });
});

describe('the move of browser lists and the cutoff', () => {
  const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
  /* The move chains several answers after the list read. */
  const settled = async (): Promise<void> => {
    for (let i = 0; i < 4; i++) await flush();
  };
  const loot: Loot = {
    items: {
      core_item: [
        { id: 'ci1', src: 'core', kind: 'item', en: 'A', ende: '', ru: 'А', rud: '', roll: 1 },
        { id: 'q1', src: 'core', kind: 'item', en: 'B', ende: '', ru: 'Б', rud: '', roll: 2 }
      ]
    }
  };
  const A: StoredList = { id: 'a', name: 'Клад дракона', ids: ['ci1'], created: 1 };
  const B: StoredList = { id: 'b', name: 'Лавка в порту', ids: [], created: 2 };
  const TWO = { 'dhloot.lists.v2': JSON.stringify([A, B]) };
  const MOVED_A = '00000000-0000-4000-8000-000000005000';
  const idsIn = (storage: FakeStoragePort): string[] =>
    (JSON.parse(storage.get('dhloot.lists.v2') ?? '[]') as { id: string }[]).map((l) => l.id);

  function started(
    cloud: CloudPort | null,
    hash: string,
    initial: Record<string, string> = TWO,
    over: Partial<Env> = {}
  ) {
    const router = memoryRouter(hash);
    const storage = memoryStorage(initial);
    const app = new AppState(
      fakeEnv({ router, storage, cloud, data: { load: () => loot }, ...over })
    );
    app.start();
    return { app, router, storage };
  }

  /* Holds every read of the account until `open()`. */
  function gated(cloud: CloudPort): () => void {
    let open = (): void => undefined;
    const gate = new Promise<void>((r) => {
      open = r;
    });
    const list = cloud.lists.list.bind(cloud.lists);
    cloud.lists.list = async () => {
      await gate;
      return list();
    };
    return open;
  }

  it('moves the browser lists after a sign-in, and is due until then', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const open = gated(cloud);
    const { app, storage } = started(cloud, '#/lists');
    expect(app.moveDue).toBe(false);
    await flush();
    expect(app.moveDue).toBe(true);
    expect(app.localWritable).toBe(false);
    open();
    await settled();
    expect(app.legacyMove?.status).toBe('done');
    expect(app.moveDue).toBe(false);
    expect(app.localWritable).toBe(true);
    expect(idsIn(storage)).toEqual([]);
    expect(app.cloudLists?.get(MOVED_A)?.name).toBe('Клад дракона');
    app.stop();
  });

  it('makes no move without browser lists, and none signed out', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const move = vi.spyOn(cloud.lists, 'move');
    const { app } = started(cloud, '#/lists', {});
    await settled();
    expect(app.legacyMove?.status).toBe('done');
    const out = fakeCloud(SEED);
    const outMove = vi.spyOn(out.lists, 'move');
    const signedOut = started(out, '#/lists');
    await settled();
    expect(signedOut.app.moveDue).toBe(false);
    expect(signedOut.app.localWritable).toBe(true);
    expect(move).not.toHaveBeenCalled();
    expect(outMove).not.toHaveBeenCalled();
    app.stop();
    signedOut.app.stop();
  });

  it('is never due for another account, and leaves its lists writable', async () => {
    const { app, storage } = started(fakeCloud(SEED, 'gm1'), '#/lists', {
      ...TWO,
      'dhloot.migrated.v1': JSON.stringify({ owner: 'someone', lists: {} })
    });
    await settled();
    expect(app.legacyMove?.foreign).toBe(true);
    expect(app.moveDue).toBe(false);
    expect(idsIn(storage)).toEqual(['a', 'b']);
    app.stop();
  });

  it('moves an offline sign-in once the network returns, on the shown signal, with no reload', async () => {
    const cloud = fakeCloud(SEED, 'gm1', { offline: true });
    const { app, storage } = started(cloud, '#/lists');
    await settled();
    expect(app.cloudLists?.status).toBe('error');
    expect(app.legacyMove?.status).toBe('failed');
    expect(app.moveDue).toBe(true);
    cloud.setOffline(false);
    storage.fireExternalChange(null);
    await settled();
    expect(app.cloudLists?.status).toBe('ready');
    expect(idsIn(storage)).toEqual([]);
    expect(app.moveDue).toBe(false);
    app.stop();
  });

  it('moves an offline sign-in on the 45 s poll on any route', async () => {
    vi.useFakeTimers();
    try {
      const cloud = fakeCloud(SEED, 'gm1', { offline: true });
      const { app, storage } = started(cloud, '#/i/ci1');
      await vi.advanceTimersByTimeAsync(0);
      expect(app.legacyMove?.status).toBe('failed');
      cloud.setOffline(false);
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(app.cloudLists?.status).toBe('ready');
      expect(idsIn(storage)).toEqual([]);
      expect(app.moveDue).toBe(false);
      app.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('retries a move the network stopped on the 45 s poll, on a browser list page', async () => {
    vi.useFakeTimers();
    try {
      const cloud = fakeCloud(SEED, 'gm1');
      const move = cloud.lists.move.bind(cloud.lists);
      let calls = 0;
      cloud.lists.move = (id, text) =>
        ++calls === 2 ? Promise.resolve({ ok: false, error: 'network' }) : move(id, text);
      const { app, storage } = started(cloud, '#/lists/b');
      await vi.advanceTimersByTimeAsync(0);
      expect(app.legacyMove?.status).toBe('failed');
      expect(app.cloudLists?.status).toBe('ready');
      expect(idsIn(storage)).toEqual(['b']);
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(idsIn(storage)).toEqual([]);
      expect(app.legacyMove?.status).toBe('done');
      app.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('runs the move at once on «Повторить»', async () => {
    const cloud = fakeCloud(SEED, 'gm1', { offline: true });
    const { app, storage } = started(cloud, '#/lists');
    await settled();
    cloud.setOffline(false);
    await app.retryLists();
    expect(app.legacyMove?.status).toBe('done');
    expect(idsIn(storage)).toEqual([]);
    app.stop();
  });

  it('runs a move skipped for a share copy once the copy lands', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const open = gated(cloud);
    const order: string[] = [];
    const move = cloud.lists.move.bind(cloud.lists);
    cloud.lists.move = (id, text) => {
      order.push('move');
      return move(id, text);
    };
    const clone = cloud.shares.clone.bind(cloud.shares);
    cloud.shares.clone = (token, id) => {
      order.push('clone');
      return clone(token, id);
    };
    const { app, storage } = started(cloud, '#/s/player-token-1');
    await flush();
    /* The first read is held: the copy starts while the move waits for it. */
    const copying = app.saveShareCopy('player-token-1');
    open();
    await copying;
    await settled();
    expect(order).toEqual(['clone', 'move', 'move']);
    expect(app.legacyMove?.status).toBe('done');
    expect(idsIn(storage)).toEqual([]);
    expect(app.cloudLists?.lists.map((l) => l.name)).toEqual(
      expect.arrayContaining(['Клад дракона', 'Лавка в порту', 'Лавка кузнеца'])
    );
    app.stop();
  });

  it('makes a remembered share copy only after the move read the account back', async () => {
    const action = { do: 'saveList' as const };
    const cloud = fakeCloud(SEED, 'gm2', {
      returned: { kind: 'signIn', provider: 'google', result: { ok: true }, action }
    });
    const order: string[] = [];
    const list = cloud.lists.list.bind(cloud.lists);
    cloud.lists.list = () => {
      order.push('list');
      return list();
    };
    const clone = cloud.shares.clone.bind(cloud.shares);
    cloud.shares.clone = (token, id) => {
      order.push('clone');
      return clone(token, id);
    };
    const move = cloud.lists.move.bind(cloud.lists);
    cloud.lists.move = (id, text) => {
      order.push('move');
      return move(id, text);
    };
    const { app, storage } = started(cloud, '#/s/player-token-1');
    await settled();
    await settled();
    expect(order.indexOf('clone')).toBeGreaterThan(order.lastIndexOf('move') + 1);
    expect(order.slice(0, 4)).toEqual(['list', 'move', 'move', 'list']);
    expect(idsIn(storage)).toEqual([]);
    expect(app.cloudLists?.lists.map((l) => l.name)).toEqual(
      expect.arrayContaining(['Клад дракона', 'Лавка в порту', 'Лавка кузнеца'])
    );
    app.stop();
  });

  it("follows a moved list's page to its account address, keeping a waiting action", async () => {
    const action = { do: 'addToList' as const, key: 'ci1', ids: ['ci1'] };
    const cloud = fakeCloud(SEED, 'gm1', {
      returned: { kind: 'signIn', provider: 'google', result: { ok: true }, action }
    });
    const { app, router } = started(cloud, '#/lists/a');
    await settled();
    expect(app.hash).toBe('#/lists/' + MOVED_A);
    expect(router.hash()).toBe('#/lists/' + MOVED_A);
    expect(app.menuFor).toBe('ci1');
    app.stop();
  });

  it('follows an own #/l/ page that no list claimed, the OAuth return with openList empty', async () => {
    const { app } = started(fakeCloud(SEED, 'gm1'), sharedListHash(encodeList(A, false)));
    expect(app.openList).toBe('');
    await settled();
    expect(app.hash).toBe('#/lists/' + MOVED_A);
    app.stop();
  });

  it('follows the open page when another tab moved its list', async () => {
    const { app, storage } = started(fakeCloud(SEED), '#/lists/a');
    await settled();
    storage.set('dhloot.migrated.v1', JSON.stringify({ owner: 'x', lists: { a: MOVED_A } }));
    storage.fireExternalChange('dhloot.migrated.v1');
    expect(app.hash).toBe('#/lists/' + MOVED_A);
    expect(app.lists.lists.map((l) => l.id)).toEqual(['b']);
    app.stop();
  });

  it('leaves a page that is not a moved list where it is', () => {
    const { app } = started(fakeCloud(SEED, 'gm1'), '#/lists/zz');
    app.followMoved([]);
    app.followMoved([{ list: B, accountId: MOVED_A }]);
    expect(app.hash).toBe('#/lists/zz');
    app.stop();
  });

  it('reads the cutoff once, only in a build with a cloud', () => {
    const after = { clock: fixedClock(LEGACY_WRITE_UNTIL) };
    const before = { clock: fixedClock(LEGACY_WRITE_UNTIL - 1) };
    const cloud = fakeCloud(SEED);
    expect(new AppState(at('#/lists', { cloud, ...after })).legacyWritable).toBe(false);
    expect(new AppState(at('#/lists', { cloud, ...before })).legacyWritable).toBe(true);
    expect(new AppState(at('#/lists', after)).legacyWritable).toBe(true);
  });

  it('never unpacks a packed link after the cutoff, and saves no #/l/ copy then', async () => {
    const unpack = vi.fn(() => Promise.resolve('x'));
    const compress: CompressPort = {
      available: () => true,
      pack: (raw) => Promise.resolve(raw),
      unpack
    };
    const clock = fixedClock(LEGACY_WRITE_UNTIL);
    const packed = started(fakeCloud(SEED), '#/l/~packed', {}, { compress, clock });
    await settled();
    expect(unpack).not.toHaveBeenCalled();
    expect(packed.app.expandFailed).toBe('');
    packed.app.stop();

    const shared = encodeList({ name: 'Лавка', ids: ['ci1'] }, true);
    const action = { do: 'saveList' as const };
    const cloud = fakeCloud(SEED, 'gm2', {
      returned: { kind: 'signIn', provider: 'google', result: { ok: true }, action }
    });
    const { app } = started(cloud, sharedListHash(shared), {}, { clock });
    await settled();
    expect(app.hash).toBe(sharedListHash(shared));
    expect(app.cloudLists?.lists).toHaveLength(1);
    app.stop();
  });
});

describe('purchase requests', () => {
  const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
  const SHOP = '00000000-0000-4000-8000-000000000101';
  const ONE = [{ item: 'ci1', qty: 1 }];

  function started(cloud: CloudPort | null, hash: string) {
    const storage = memoryStorage();
    const app = new AppState(fakeEnv({ router: memoryRouter(hash), storage, cloud }));
    app.start();
    return { app, storage };
  }

  it('has neither store in a build with no sign-in', () => {
    const { app } = started(null, '#/lists');
    expect(app.ownerRequests).toBeNull();
    expect(app.requestSender).toBeNull();
    expect(app.requestToken).toBeNull();
    app.stop();
  });

  it("reads the owner's requests once the lists are read, and clears them on sign-out and sign-in", async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    cloud.request('player-token-1', ONE);
    const { app } = started(cloud, '#/lists');
    await flush();
    await flush();
    expect(app.ownerRequests?.pendingCount(SHOP, Date.now())).toBe(1);
    const clear = vi.spyOn(app.ownerRequests!, 'clear');
    await cloud.auth.signOut();
    expect(clear).toHaveBeenCalledOnce();
    expect(app.ownerRequests?.requests).toEqual([]);
    await cloud.auth.signIn('google');
    expect(clear).toHaveBeenCalledTimes(2);
    await flush();
    await flush();
    expect(app.ownerRequests?.pendingCount(SHOP, Date.now())).toBe(1);
    app.stop();
    expect(clear).toHaveBeenCalledTimes(3);
  });

  it('reads them on the 45 s poll while the owner topic is down, on the lists pages only', async () => {
    vi.useFakeTimers();
    try {
      const cloud = fakeCloud(SEED, 'gm1', { live: false });
      const { app } = started(cloud, '#/lists');
      await vi.advanceTimersByTimeAsync(0);
      const list = vi.spyOn(cloud.requests, 'list');
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(list).toHaveBeenCalledTimes(1);
      app.go('#/lists/' + SHOP);
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(list).toHaveBeenCalledTimes(2);
      app.go('#/tables/eq_weapon');
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(list).toHaveBeenCalledTimes(2);
      app.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('reads them on no poll tick while the owner topic is live, and when the tab is shown again', async () => {
    vi.useFakeTimers();
    try {
      const cloud = fakeCloud(SEED, 'gm1');
      const { app, storage } = started(cloud, '#/lists');
      await vi.advanceTimersByTimeAsync(1000);
      const list = vi.spyOn(cloud.requests, 'list');
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(list).not.toHaveBeenCalled();
      storage.fireExternalChange(null);
      await vi.advanceTimersByTimeAsync(0);
      expect(list).toHaveBeenCalledOnce();
      app.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it("names the open link's token for a reader who is not its owner, and none elsewhere", async () => {
    const out = started(fakeCloud(SEED), '#/s/player-token-1');
    await out.app.sharedView?.open('player-token-1', null);
    expect(out.app.requestToken).toBe('player-token-1');
    out.app.go('#/lists');
    expect(out.app.requestToken).toBeNull();
    out.app.stop();
    const owner = started(fakeCloud(SEED, 'gm1'), '#/s/player-token-1');
    await flush();
    await owner.app.sharedView?.open('player-token-1', owner.app.user?.userId);
    expect(owner.app.sharedView?.mine).toBe(SHOP);
    expect(owner.app.requestToken).toBeNull();
    owner.app.stop();
    const gone = started(fakeCloud(SEED), '#/s/unknown');
    await gone.app.sharedView?.open('unknown', null);
    expect(gone.app.requestToken).toBeNull();
    gone.app.stop();
  });

  it('drops an unanswered question on a navigation and on a cleared selection', async () => {
    const { app } = started(fakeCloud(SEED, 'gm2'), '#/s/player-token-1');
    await flush();
    const sender = app.requestSender!;
    sender.afterAdd('player-token-1', ONE, () => 'Добавлено');
    expect(sender.asking).not.toBeNull();
    app.clearSel();
    expect(sender.asking).toBeNull();
    sender.afterAdd('player-token-1', ONE, () => 'Добавлено');
    app.go('#/lists');
    expect(sender.asking).toBeNull();
    app.stop();
  });

  it("sends through the account's answer, and saves the remembered one to the account", async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const send = vi.spyOn(cloud.requests, 'send');
    const { app } = started(cloud, '#/s/player-token-1');
    await flush();
    const sender = app.requestSender!;
    sender.afterAdd('player-token-1', ONE, () => 'Добавлено');
    sender.answer(true, true);
    await flush();
    expect(send).toHaveBeenCalledWith(expect.any(String), 'player-token-1', ONE);
    expect(app.notifyGm).toBe('always');
    expect(app.toast?.msg).toBe('Добавлено. Владелец получил запрос.');
    await flush();
    const read = await cloud.prefs.load();
    expect(read.ok && read.prefs?.notifyGm).toBe('always');
    app.stop();
  });
});

describe('the exports', () => {
  const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
  const loot: Loot = {
    items: {
      core_item: [
        { id: 'ci1', src: 'core', kind: 'item', en: 'A', ende: '', ru: 'А', rud: '', roll: 1 },
        { id: 'q1', src: 'core', kind: 'item', en: 'B', ende: '', ru: 'Б', rud: '', roll: 2 }
      ]
    }
  };
  const SHOP = '00000000-0000-4000-8000-000000000101';
  const EMPTY = '00000000-0000-4000-8000-000000000102';
  /* 2026-10-01 12:00 UTC, the test build's clock. */
  const NOW = Date.UTC(2026, 9, 1, 12);
  const DAY = [
    new Date(NOW).getFullYear(),
    String(new Date(NOW).getMonth() + 1).padStart(2, '0'),
    String(new Date(NOW).getDate()).padStart(2, '0')
  ].join('-');

  async function signedIn(
    image = fakeImage(),
    limits: { lists?: number; entries?: number } = {}
  ) {
    const app = new AppState(
      fakeEnv({
        router: memoryRouter('#/lists'),
        storage: memoryStorage(),
        cloud: fakeCloud(SEED, 'gm1', { limits }),
        data: { load: () => loot },
        clock: fixedClock(NOW),
        image
      })
    );
    app.start();
    await flush();
    return { app, image };
  }

  const expected = (app: AppState, ids?: string[]): string => {
    const store = app.cloudLists!;
    const lists = ids ? store.lists.filter((l) => ids.includes(l.id)) : store.lists;
    const names: Record<string, string> =
      app.lang === 'ru' ? { ci1: 'А', q1: 'Б' } : { ci1: 'A', q1: 'B' };
    return bundleText(
      toBundle(officialOnly(lists).lists, (id) => names[id], app.t.untitled, new Date(NOW))
    );
  };

  it('downloads every list as the dated file, in the index order, and counts the own items left out', async () => {
    const { app, image } = await signedIn();
    await app.exportLists();
    const [file] = image.downloaded;
    expect(file?.filename).toBe(`daggerheart-loot-lists-${DAY}.json`);
    expect(file?.blob.type).toBe('application/json');
    const text = await file!.blob.text();
    expect(text).toBe(expected(app));
    expect(text).not.toContain('hb_emberaxeaaaaaaaa');
    expect(
      (JSON.parse(text) as { lists: { name: string }[] }).lists.map((l) => l.name)
    ).toEqual(['Пустой список', 'Лавка кузнеца', 'Трофеи']);
    expect(app.toast).toMatchObject({
      msg: '1 свой предмет не попал в файл: файл списков пока переносит только предметы из книг.',
      mode: ''
    });
    app.hideToast();
    await app.exportLists([EMPTY]);
    expect(app.toast).toBeNull();
    app.stop();
  });

  it('keeps the index order whatever the order of the ids, and names one list its file', async () => {
    const { app, image } = await signedIn();
    await app.exportLists([SHOP, EMPTY]);
    expect(await image.downloaded[0]?.blob.text()).toBe(expected(app, [SHOP, EMPTY]));
    await app.exportLists([SHOP]);
    expect(image.downloaded[1]?.filename).toBe('Лавка кузнеца.json');
    app.stop();
  });

  it('names the entries in the language on screen, with both notes', async () => {
    const { app, image } = await signedIn();
    app.setLang('en');
    await app.exportLists([SHOP]);
    const text = await image.downloaded[0]!.blob.text();
    expect(text).toBe(expected(app, [SHOP]));
    const [shop] = (
      JSON.parse(text) as {
        lists: {
          player_note?: string;
          entries: { id: string; name?: string; gm_note?: string }[];
        }[];
      }
    ).lists;
    expect(shop?.player_note).toBe('Открыта с рассвета до заката.');
    expect(shop?.entries.find((e) => e.id === 'ci1')?.name).toBe('A');
    expect(shop?.entries.find((e) => e.id === 'voa2_a3')?.gm_note).toBe('Проклят.');
    app.stop();
  });

  it('says a failed download, and nothing about the bounds', async () => {
    const { app } = await signedIn(fakeImage({ failDownload: true }), {
      entries: ENTRIES_MAX + 100
    });
    app.cloudLists!.create('Длинный', {
      ids: Array.from({ length: ENTRIES_MAX + 1 }, (_, i) => 'r' + String(i))
    });
    await app.exportLists();
    expect(app.toast).toMatchObject({ msg: app.t.accountFailed, mode: 'err' });
    await app.exportData();
    expect(app.toast).toMatchObject({ msg: app.t.accountFailed, mode: 'err' });
    app.stop();
  });

  it("downloads the account's data as a zip whose lists.json is the lists file", async () => {
    const { app, image } = await signedIn();
    await app.exportData();
    const [file] = image.downloaded;
    expect(file?.filename).toBe(`daggerheart-loot-data-${DAY}.zip`);
    expect(file?.blob.type).toBe('application/zip');
    const read = readDataZip(new Uint8Array(await file!.blob.arrayBuffer()));
    expect(read).toEqual({ ok: true, lists: expected(app), other: [], more: 0 });
    app.stop();
  });

  it("downloads a list past the file's entry bound whole and names it in one toast", async () => {
    const { app, image } = await signedIn(fakeImage(), { entries: ENTRIES_MAX + 100 });
    const ids = Array.from({ length: ENTRIES_MAX + 1 }, (_, i) => 'r' + String(i));
    const long = app.cloudLists!.create('Склад', { ids });
    await app.exportLists([long.id]);
    const text = await image.downloaded[0]!.blob.text();
    expect(
      (JSON.parse(text) as { lists: { entries: unknown[] }[] }).lists[0]?.entries
    ).toHaveLength(ENTRIES_MAX + 1);
    expect(app.toast).toMatchObject({
      msg: 'Этот файл нельзя импортировать целиком. В списках «Склад» позиций больше 5000: разделите такие списки.',
      mode: ''
    });
    app.stop();
  });

  it("says a file past the file's list bound, and both bounds in one toast", async () => {
    const { app } = await signedIn(fakeImage(), {
      lists: LISTS_MAX + 100,
      entries: ENTRIES_MAX + 100
    });
    const store = app.cloudLists!;
    for (let i = 0; i < LISTS_MAX - 2; i++) store.create('Список ' + String(i));
    await app.exportLists();
    expect(app.toast?.msg).toBe(
      'Этот файл нельзя импортировать целиком. В нём больше 1000 списков: экспортируйте их частями. 1 свой предмет не попал в файл: файл списков пока переносит только предметы из книг.'
    );
    store.create('Склад', {
      ids: Array.from({ length: ENTRIES_MAX + 1 }, (_, i) => 'r' + String(i))
    });
    await app.exportData();
    expect(app.toast?.msg).toBe(
      'Этот файл нельзя импортировать целиком. В нём больше 1000 списков: экспортируйте их частями. В списках «Склад» позиций больше 5000: разделите такие списки. 1 свой предмет не попал в файл: файл списков пока переносит только предметы из книг.'
    );
    app.stop();
  });

  it('does nothing in a build with no sign-in', async () => {
    const image = fakeImage();
    const app = new AppState(fakeEnv({ router: memoryRouter('#/lists'), cloud: null, image }));
    await app.exportLists();
    await app.exportData();
    expect(image.downloaded).toEqual([]);
  });
});

describe('homebrew', () => {
  const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
  const loot: Loot = {
    items: {
      core_item: [
        { id: 'ci1', src: 'core', kind: 'item', en: 'A', ende: '', ru: 'А', rud: '', roll: 1 }
      ]
    }
  };
  const AXE = 'hb_emberaxeaaaaaaaa';

  function started(cloud: CloudPort | null, hash: string, over: Partial<Env> = {}) {
    const router = memoryRouter(hash);
    const storage = memoryStorage();
    const app = new AppState(
      fakeEnv({ router, storage, cloud, data: { load: () => loot }, ...over })
    );
    app.start();
    return { app, router, storage };
  }

  it('keeps the catalog as the index signed out and with no own item', async () => {
    const { app } = started(fakeCloud(SEED), '#/roll/std');
    await flush();
    expect(app.index).toBe(app.catalog);
    const empty = started(fakeCloud(SEED, 'gm2'), '#/roll/std');
    await flush();
    expect(empty.app.homebrew?.status).toBe('ready');
    expect(empty.app.index).toBe(empty.app.catalog);
    expect(started(null, '#/roll/std').app.homebrew).toBeNull();
    app.stop();
    empty.app.stop();
  });

  it('adds own items to the index on sign-in and drops them on sign-out', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { app } = started(cloud, '#/roll/std');
    await flush();
    expect(app.homebrew?.status).toBe('ready');
    expect(app.index?.byId.get(AXE)?.src).toBe('homebrew');
    expect(app.catalog?.byId.has(AXE)).toBe(false);
    expect(app.index?.byId.get('ci1')).toBe(app.catalog?.byId.get('ci1'));
    const before = app.index;
    await app.homebrew?.read();
    expect(app.index).toBe(before);
    await cloud.auth.signOut();
    await flush();
    expect(app.homebrew?.status).toBe('idle');
    expect(app.index).toBe(app.catalog);
    app.stop();
  });

  it('loads the next user homebrew after a sign-out, with nothing of the last one', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const { app } = started(cloud, '#/homebrew');
    await flush();
    expect(app.homebrew?.items).toEqual([]);
    const clear = vi.spyOn(app.homebrew!, 'clear');
    await cloud.auth.signOut();
    await cloud.auth.signIn('google');
    await flush();
    expect(clear).toHaveBeenCalledTimes(2);
    expect(app.homebrew?.has(AXE)).toBe(true);
    app.stop();
  });

  it('re-reads every 45 s on a homebrew page while Realtime is down, and after a failed load', async () => {
    vi.useFakeTimers();
    try {
      const cloud = fakeCloud(SEED, 'gm1', { live: false });
      const { app } = started(cloud, '#/homebrew');
      await vi.advanceTimersByTimeAsync(0);
      const load = vi.spyOn(cloud.homebrew, 'load');
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(load).toHaveBeenCalledTimes(1);
      app.go('#/i/' + AXE);
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(load).toHaveBeenCalledTimes(2);
      app.go('#/homebrew/new');
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(load).toHaveBeenCalledTimes(3);
      app.go('#/tables/homebrew');
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(load).toHaveBeenCalledTimes(4);
      app.go('#/i/ci1');
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(load).toHaveBeenCalledTimes(4);
      app.go('#/tables/eq_weapon');
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(load).toHaveBeenCalledTimes(4);
      cloud.setOffline(true);
      app.homebrew?.clear();
      await app.homebrew?.load();
      expect(app.homebrew?.status).toBe('error');
      cloud.setOffline(false);
      await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
      expect(app.homebrew?.status).toBe('ready');
      app.stop();
      expect(app.homebrew?.status).toBe('idle');
    } finally {
      vi.useRealTimers();
    }
  });

  it('starts with the own items shown, hides them from browse on a toggle, and keeps it across pages', async () => {
    const { app } = started(fakeCloud(SEED, 'gm1'), '#/search');
    await flush();
    expect(app.homebrewShown).toBe(true);
    expect(app.browse).toBe(app.index);
    expect(app.browse?.searchable.some((it) => it.id === AXE)).toBe(true);
    app.toggleHomebrew();
    expect(app.homebrewShown).toBe(false);
    expect(app.browse?.searchable).toBe(app.catalog?.searchable);
    expect(app.browse?.allEquip).toBe(app.catalog?.allEquip);
    expect(app.browse?.byId.get(AXE)).toBeDefined();
    app.go('#/tables/eq_weapon');
    expect(app.homebrewShown).toBe(false);
    app.toggleHomebrew();
    expect(app.browse).toBe(app.index);
    app.stop();
  });

  it('shows the own items again when another user signs in on the same tab', async () => {
    const cloud = fakeCloud({ ...SEED, defaultUser: 'gm2' }, 'gm1');
    const { app } = started(cloud, '#/search');
    await flush();
    app.toggleHomebrew();
    await cloud.auth.signOut();
    await cloud.auth.signIn('google');
    await flush();
    expect(app.homebrewShown).toBe(true);
    app.stop();
  });

  it('re-reads the homebrew when the tab is shown again', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { app, storage } = started(cloud, '#/homebrew');
    await flush();
    const load = vi.spyOn(cloud.homebrew, 'load');
    storage.fireExternalChange(null);
    await flush();
    expect(load).toHaveBeenCalledOnce();
    app.stop();
  });

  it('counts the account lists that hold a key', async () => {
    const { app } = started(fakeCloud(SEED, 'gm1'), '#/lists');
    await flush();
    expect(app.listsHolding(['ci1'])).toBeGreaterThan(0);
    expect(app.listsHolding([AXE])).toBe(1);
    expect(app.listsHolding(['hb_smithpotionaaaaa'])).toBe(0);
    expect(started(null, '#/lists').app.listsHolding(['ci1'])).toBe(0);
    app.stop();
  });

  describe('in lists', () => {
    const GM2_LIST = '00000000-0000-4000-8000-000000000201';
    const EMPTY_LIST = '00000000-0000-4000-8000-000000000102';

    /* The entries of a list as the server holds them. */
    async function written(cloud: CloudPort, id: string) {
      const read = await cloud.lists.list();
      const l = read.ok ? read.lists.find((x) => x.id === id) : undefined;
      return l?.list_entries.map((e) => ({
        key: e.item_key,
        source: e.source,
        snapshot: e.snapshot
      }));
    }

    it('finds a frozen copy in the open share first, then in a list, and knows it', async () => {
      const cloud = fakeCloud(SEED, 'gm2');
      const { app } = started(cloud, '#/lists');
      await flush();
      const kept = app.cloudLists?.get(GM2_LIST)?.frozen?.[AXE];
      expect(kept?.src).toBe('homebrew');
      expect(app.frozenCopy(AXE)).toBe(kept);
      expect(app.recordFor(AXE)).toBe(kept);
      expect(app.knows(AXE)).toBe(true);
      expect(app.knows('hb_smithpotionaaaaa')).toBe(false);
      expect(app.frozenCopy('ci1')).toBeUndefined();
      expect(app.recordFor('ci1')).toBe(app.catalog?.byId.get('ci1'));
      await app.sharedView?.open('player-token-1', '00000000-0000-4000-8000-000000000002');
      const shown = app.sharedView?.shared?.entries.find((e) => e.item_key === AXE)?.snapshot;
      expect(shown).toBeTruthy();
      expect(app.frozenCopy(AXE)).toBe(shown);
      app.sharedView?.close();
      expect(app.frozenCopy(AXE)).toBe(kept);
      app.stop();
    });

    it('prints a frozen copy of an own list, and not a key only a closed share carried', async () => {
      const gm2 = started(fakeCloud(SEED, 'gm2'), '#/print/' + AXE);
      await flush();
      expect(gm2.app.route).toMatchObject({ kind: 'print', ids: [AXE] });
      gm2.app.stop();
      const reader = started(fakeCloud(SEED), '#/print/' + AXE);
      await flush();
      expect(reader.app.route).toMatchObject({ kind: 'print', ids: [] });
      reader.app.stop();
    });

    it("writes the open share's snapshot on an add from #/s/, and a reference from the owner's own", async () => {
      const cloud = fakeCloud(SEED, 'gm2');
      const { app } = started(cloud, '#/s/player-token-1');
      await flush();
      await app.sharedView?.open('player-token-1', '00000000-0000-4000-8000-000000000002');
      const store = app.cloudLists!;
      const l = store.create('С полки');
      expect(store.add(l.id, [AXE, 'ci1'], (id) => app.knows(id))).toEqual([AXE, 'ci1']);
      await store.flushNow();
      const shown = app.sharedView?.shared?.entries.find((e) => e.item_key === AXE)?.snapshot;
      expect(await written(cloud, l.id)).toEqual([
        { key: AXE, source: 'homebrew', snapshot: shown },
        { key: 'ci1', source: 'official', snapshot: null }
      ]);
      app.stop();

      const own = fakeCloud(SEED, 'gm1');
      const gm1 = started(own, '#/s/player-token-1');
      await flush();
      await gm1.app.sharedView?.open('player-token-1', '00000000-0000-4000-8000-000000000001');
      gm1.app.cloudLists?.add(EMPTY_LIST, [AXE], (id) => gm1.app.knows(id));
      await gm1.app.cloudLists?.flushNow();
      expect(await written(own, EMPTY_LIST)).toEqual([
        { key: AXE, source: 'homebrew', snapshot: null }
      ]);
      gm1.app.stop();
    });

    it('writes no homebrew entry before the account items are read', async () => {
      const cloud = fakeCloud(SEED, 'gm1');
      vi.spyOn(cloud.homebrew, 'load').mockReturnValue(new Promise(() => undefined));
      const { app } = started(cloud, '#/lists');
      await flush();
      expect(app.cloudLists?.status).toBe('ready');
      expect(app.homebrew?.status).toBe('loading');
      const apply = vi.spyOn(cloud.lists, 'apply');
      expect(app.cloudLists?.add(EMPTY_LIST, [AXE], () => true)).toEqual([]);
      await app.cloudLists?.flushNow();
      expect(apply).not.toHaveBeenCalled();
      app.stop();
    });
  });

  describe('the leave guard', () => {
    it('asks on go() and keeps the page on a refusal', () => {
      const dialog = fakeDialog(false);
      const { app } = started(null, '#/homebrew/new', { dialog });
      let dirty = true;
      const release = app.guardLeave(() => dirty);
      app.go('#/lists');
      expect(dialog.asked).toEqual([dict('ru').leaveUnsaved]);
      expect(app.hash).toBe('#/homebrew/new');
      app.go('#/homebrew/new');
      expect(dialog.asked).toHaveLength(1);
      dirty = false;
      app.go('#/lists');
      expect(app.hash).toBe('#/lists');
      expect(dialog.asked).toHaveLength(1);
      release();
      app.stop();
    });

    it('puts the address back on a refused router change, and never asks on replace()', () => {
      const dialog = fakeDialog(false);
      const { app, router } = started(null, '#/homebrew/new', { dialog });
      const release = app.guardLeave(() => true);
      const navs = app.navigations;
      router.navigate('#/lists');
      expect(app.hash).toBe('#/homebrew/new');
      expect(router.hash()).toBe('#/homebrew/new');
      expect(app.navigations).toBe(navs);
      app.replace('#/homebrew/' + AXE);
      expect(app.hash).toBe('#/homebrew/' + AXE);
      expect(dialog.asked).toHaveLength(1);
      release();
      router.navigate('#/lists');
      expect(app.hash).toBe('#/lists');
      app.stop();
    });

    it('leaves on a yes, and a released check asks nothing', () => {
      const dialog = fakeDialog(true);
      const { app } = started(null, '#/homebrew/new', { dialog });
      const release = app.guardLeave(() => true);
      app.go('#/lists');
      expect(app.hash).toBe('#/lists');
      const other = app.guardLeave(() => true);
      release();
      app.go('#/search');
      expect(dialog.asked).toHaveLength(2);
      other();
      app.go('#/tables');
      expect(dialog.asked).toHaveLength(2);
      app.stop();
    });
  });

  it('decodes a #/l/ link with catalog ids only, own keys dropped', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const payload = encodeList({ name: 'С топором', ids: ['ci1', AXE] }, true);
    const { app } = started(cloud, sharedListHash(payload));
    await flush();
    expect(app.index?.byId.has(AXE)).toBe(true);
    app.askSignIn({ hash: sharedListHash(payload), action: { do: 'saveList' } });
    await app.signIn('google');
    await flush();
    const made = app.cloudLists?.lists.find((l) => l.name === 'С топором');
    expect(made?.ids).toEqual(['ci1']);
    app.stop();
  });
});
