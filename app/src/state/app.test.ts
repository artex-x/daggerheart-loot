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
import {
  bundleText,
  ENTRIES_MAX,
  FILE_MAX_BYTES,
  LISTS_MAX,
  parseBundle,
  toBundle,
  type ImportList
} from '../lib/bundle.js';
import { linkedOf } from '../lib/cloudLists.js';
import { nameOf } from '../lib/i18n.js';
import { derivedKey } from '../lib/homebrew.js';
import {
  defaultTarget,
  deriveFile,
  homebrewText,
  parseHomebrew,
  rowsOf,
  subsetOf,
  toHomebrewFile,
  toHomebrewRows
} from '../lib/homebrewFile.js';
import type { Loot } from '../lib/data.js';
import { dict } from '../lib/dict.js';
import { cardVersion, sharedListHash } from '../lib/hash.js';
import { encodeList } from '../lib/listLink.js';
import type { StoredList } from '../lib/lists.js';
import { LOOT_KINDS } from '../lib/std.js';
import { readDataZip } from '../lib/zip.js';
import type { Prefs } from '../lib/prefs.js';
import { KINDS, type Record_ } from '../lib/types.js';
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
import { fakeCloud, type FakeCloud, type FakeCloudOptions } from '../ports/fake-cloud.js';
import { SEED, uuid, type Seed } from '../ports/fake-cloud-seed.js';
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
      at('#/roll/std', {
        storage: stored({ [PREFS_KEY]: '{"view":"grid","printBw":true,"printCompact":true}' })
      })
    );
    expect([app.tablesView, app.printBW, app.printCompact]).toEqual(['grid', true, true]);
  });

  it("reads live's old { view } shape as colour on the standard sheet", () => {
    const app = new AppState(
      at('#/roll/std', { storage: stored({ [PREFS_KEY]: '{"view":"grid"}' }) })
    );
    expect([app.tablesView, app.printBW, app.printCompact]).toEqual(['grid', false, false]);
  });

  it('reads broken JSON as the defaults', () => {
    const app = new AppState(at('#/roll/std', { storage: stored({ [PREFS_KEY]: '{not' }) }));
    expect([app.tablesView, app.printBW, app.printCompact]).toEqual(['list', false, false]);
  });

  it('writes the whole key on a press', () => {
    const env = at('#/roll/std');
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
    const env = at('#/roll/std');
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
    const app = new AppState(at('#/roll/std'));
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
    const app = new AppState(at('#/roll/std'));
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
    const env = at('#/roll/std', {
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
    const app = new AppState(fakeEnv({ router: memoryRouter('#/roll/std'), storage, cloud }));
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
    const app = new AppState(fakeEnv({ router: memoryRouter('#/roll/std'), storage, cloud }));
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

const HID = '00000000-0000-4000-8000-000000000511';

describe('links to hand somebody else', () => {
  it('follow the language on screen', () => {
    const app = new AppState(at('#/roll/std'));
    expect(app.linkToRecord({ id: 'w1' } as Record_)).toBe('https://example.test/i/w1.html');
    expect(app.linkTo('#/lists')).toBe('https://example.test/#/lists');
    app.setLang('en');
    expect(app.linkToRecord({ id: 'w1' } as Record_)).toBe('https://example.test/i/en/w1.html');
    expect(app.linkTo('#/lists')).toBe('https://example.test/en/#/lists');
  });

  it('keep the app address for every card family in a build with no preview host', () => {
    const app = new AppState(at('#/roll/std'));
    const hb = { id: 'hb_emberaxeaaaaaaaa', src: 'homebrew', hid: HID } as unknown as Record_;
    expect(app.linkToRecord(hb)).toBe('https://example.test/#/h/' + HID);
    expect(app.linkTo('#/s/tok', 'v1')).toBe('https://example.test/#/s/tok');
    expect(app.linkTo('#/p/AbCdEf123456')).toBe('https://example.test/#/p/AbCdEf123456');
    expect(app.linkTo('#/tables/core_item')).toBe('https://example.test/#/tables/core_item');
  });
});

describe('links through the preview host', () => {
  const ORIGIN = 'https://daggerheart-loot.pages.dev';
  const hb = (over: object = {}): Record_ =>
    ({
      id: 'hb_emberaxeaaaaaaaa',
      src: 'homebrew',
      kind: 'item',
      hid: HID,
      ru: 'Топор',
      en: 'Axe',
      ...over
    }) as unknown as Record_;

  it("hand out an item's preview link, versioned by the record, in the language on screen", () => {
    const app = new AppState(at('#/roll/std', { preview: ORIGIN }));
    const v = cardVersion(hb());
    expect(app.linkToRecord(hb())).toBe(`${ORIGIN}/h/${HID}?v=${v}`);
    expect(app.linkToRecord(hb({ ru: 'Другой топор' }))).not.toBe(`${ORIGIN}/h/${HID}?v=${v}`);
    expect(app.linkToRecord(hb({ img: 'q1.webp' }))).not.toBe(`${ORIGIN}/h/${HID}?v=${v}`);
    app.setLang('en');
    expect(app.linkToRecord(hb())).toBe(`${ORIGIN}/en/h/${HID}?v=${v}`);
  });

  it('keep a catalog record on its stub and every other address in the app', () => {
    const app = new AppState(at('#/roll/std', { preview: ORIGIN }));
    expect(app.linkToRecord({ id: 'w1' } as Record_)).toBe('https://example.test/i/w1.html');
    expect(app.linkTo('#/lists')).toBe('https://example.test/#/lists');
    expect(app.linkTo('#/l/ABC')).toBe('https://example.test/#/l/ABC');
    expect(app.linkTo('#/tables/homebrew')).toBe('https://example.test/#/tables/homebrew');
    expect(app.linkTo('#/tables/homebrew/f_src-hb_alderworkshopaaa')).toBe(
      'https://example.test/#/tables/homebrew/f_src-hb_alderworkshopaaa'
    );
  });

  it('put v on a share link only, and none on a print set or a table', () => {
    const app = new AppState(at('#/roll/std', { preview: ORIGIN }));
    expect(app.linkTo('#/s/tok', 'v1')).toBe(ORIGIN + '/s/tok?v=v1');
    expect(app.linkTo('#/p/AbCdEf123456')).toBe(ORIGIN + '/p/AbCdEf123456');
    expect(app.linkTo('#/tables/core_item')).toBe(ORIGIN + '/tables/core_item');
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
    expect(new AppState(at('#/p/set-twocards')).section).toBe(null);
    expect(new AppState(at('#/lists/abc')).section).toBe(null);
    expect(new AppState(at('#/l/eyJ')).section).toBe(null);
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

  it('keeps the ticks and their counts between two «Мои предметы» tabs, and clears them on any other navigation', () => {
    const router = memoryRouter('#/homebrew');
    const app = new AppState(fakeEnv({ router }));
    app.start();
    const tick = (): void => {
      app.sel.add('hb_engravedringaaaa');
      app.picked.set('hb_engravedringaaaa', 2);
    };
    tick();
    app.go('#/homebrew/sources');
    router.navigate('#/homebrew/sets/hb_aldersetaaaaaaaa');
    app.go('#/homebrew');
    expect([...app.sel]).toEqual(['hb_engravedringaaaa']);
    expect(app.picked.get('hb_engravedringaaaa')).toBe(2);

    app.go('#/homebrew/hb_engravedringaaaa');
    expect(app.sel.size).toBe(0);
    expect(app.picked.size).toBe(0);

    app.go('#/homebrew');
    tick();
    router.navigate('#/lists');
    expect(app.sel.size).toBe(0);

    tick();
    app.go('#/homebrew/rules');
    expect(app.sel.size).toBe(0);
    expect(app.picked.size).toBe(0);
    app.stop();
  });

  it('keeps the ticks between two #/tables/homebrew addresses, and clears them on leaving the table', () => {
    const router = memoryRouter('#/tables/homebrew');
    const app = new AppState(fakeEnv({ router }));
    app.start();
    app.sel.add('hb_emberaxeaaaaaaaa');
    app.go('#/tables/homebrew/f_src-hb');
    router.navigate('#/tables/homebrew/hb_sectbladesaaaaaa');
    app.go('#/tables/homebrew');
    expect([...app.sel]).toEqual(['hb_emberaxeaaaaaaaa']);

    app.go('#/tables/core_item');
    expect(app.sel.size).toBe(0);

    app.go('#/tables/homebrew');
    app.sel.add('hb_emberaxeaaaaaaaa');
    router.navigate('#/homebrew');
    expect(app.sel.size).toBe(0);
    app.sel.add('hb_emberaxeaaaaaaaa');
    app.go('#/tables/homebrew');
    expect(app.sel.size).toBe(0);
    app.stop();
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
      msg: 'Не получилось. Проверьте соединение и попробуйте ещё раз.',
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
    expect(app.toast?.msg).toBe(
      'Не получилось сохранить список себе. Проверьте соединение и попробуйте ещё раз.'
    );
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
    expect(app.toast?.msg).toBe(
      'Не получилось сохранить список себе. Проверьте соединение и попробуйте ещё раз.'
    );
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
    limits: FakeCloudOptions['limits'] = {},
    as: 'gm1' | 'gm2' | 'gm3' = 'gm1',
    seed: Seed = SEED
  ) {
    const app = new AppState(
      fakeEnv({
        router: memoryRouter('#/lists'),
        storage: memoryStorage(),
        cloud: fakeCloud(seed, as, { limits }),
        data: { load: () => loot },
        clock: fixedClock(NOW),
        image
      })
    );
    app.start();
    await flush();
    await vi.waitFor(() => {
      expect(app.homebrew?.status).toBe('ready');
    });
    return { app, image };
  }

  /* The seed with gm1's list `name` of one entry past the file's bound: the database refuses
     a create of that many entries, so the list comes from the seed, not from a write. */
  const LONG = uuid(9900);
  const withLong = (name: string): Seed => ({
    ...SEED,
    lists: {
      ...SEED.lists,
      gm1: [
        ...SEED.lists.gm1,
        {
          id: LONG,
          name,
          entries: Array.from({ length: ENTRIES_MAX + 1 }, (_, i) => ({
            id: uuid(20000 + i),
            itemKey: 'r' + String(i),
            position: i
          })),
          createdAgoMs: 1000,
          editedAgoMs: 1000
        }
      ]
    }
  });

  const AXE = 'hb_emberaxeaaaaaaaa';
  /* The lists file as the export writes it: the axe gm1's first list refers to carries the
     live item as its snapshot. */
  const expected = (app: AppState, ids?: string[]): string => {
    const store = app.cloudLists!;
    const lists = ids ? store.lists.filter((l) => ids.includes(l.id)) : store.lists;
    const names: Record<string, string> =
      app.lang === 'ru' ? { ci1: 'А', q1: 'Б' } : { ci1: 'A', q1: 'B' };
    return bundleText(
      toBundle(
        lists,
        (id) => {
          const own = app.homebrew?.records.find((r) => r.id === id);
          return names[id] ?? (own ? nameOf(own, app.lang) : undefined);
        },
        app.t.untitled,
        new Date(NOW),
        (id, list) =>
          app.homebrew?.records.find((r) => r.id === id) ?? linkedOf(list)[id] ?? null
      ).bundle
    );
  };

  it('downloads every list as the dated file, in the index order, version 2 with the axe', async () => {
    const { app, image } = await signedIn();
    await app.exportLists();
    const [file] = image.downloaded;
    expect(file?.filename).toBe(`daggerheart-loot-lists-${DAY}.json`);
    expect(file?.blob.type).toBe('application/json');
    const text = await file!.blob.text();
    expect(text).toBe(expected(app));
    const doc = JSON.parse(text) as {
      version: number;
      lists: { name: string; entries: { id: string; source?: string; snapshot?: unknown }[] }[];
    };
    expect(doc.version).toBe(2);
    expect(doc.lists.map((l) => l.name)).toEqual(['Пустой список', 'Лавка кузнеца', 'Трофеи']);
    const axe = doc.lists.flatMap((l) => l.entries).find((e) => e.id === AXE);
    expect(axe?.source).toBe('homebrew');
    /* The file's record has no row id and no picture: the files carry none. */
    const { hid, img, ...record } = app.homebrew!.records.find((r) => r.id === AXE)!;
    expect(hid).toBe('00000000-0000-4000-8000-000000000511');
    expect(img).toBe('ci1.webp');
    expect(axe?.snapshot).toEqual(record);
    expect(app.toast).toBeNull();
    app.stop();
  });

  it('counts an own item the account no longer holds, left out of the file', async () => {
    const { app, image } = await signedIn();
    /* Deleted on another device, before this tab read its lists again. */
    app.homebrew!.items = app.homebrew!.items.filter((i) => i.key !== AXE);
    await app.exportLists();
    const text = await image.downloaded[0]!.blob.text();
    expect(text).not.toContain(AXE);
    expect(app.toast).toMatchObject({
      msg: '1 свой предмет не попал в файл: его больше нет в аккаунте.',
      mode: ''
    });
    app.stop();
  });

  it('downloads nothing while the own items load when a list holds one, and says so', async () => {
    const { app, image } = await signedIn();
    app.homebrew!.status = 'loading';
    await app.exportLists();
    expect(image.downloaded).toEqual([]);
    expect(app.toast).toMatchObject({ msg: app.t.hbNotReady, mode: 'err' });
    app.hideToast();
    await app.exportLists([EMPTY]);
    expect(image.downloaded.map((d) => d.filename)).toEqual(['Пустой список.json']);
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
    const { app } = await signedIn(
      fakeImage({ failDownload: true }),
      { entries: ENTRIES_MAX + 100 },
      'gm1',
      withLong('Длинный')
    );
    await app.exportLists();
    expect(app.toast).toMatchObject({ msg: app.t.accountFailed, mode: 'err' });
    await app.exportData();
    expect(app.toast).toMatchObject({ msg: app.t.accountFailed, mode: 'err' });
    app.stop();
  });

  it("downloads the account's data as a zip: the lists file, then the homebrew file", async () => {
    const { app, image } = await signedIn();
    await app.exportData();
    const [file] = image.downloaded;
    expect(file?.filename).toBe(`daggerheart-loot-data-${DAY}.zip`);
    expect(file?.blob.type).toBe('application/zip');
    const bytes = new Uint8Array(await file!.blob.arrayBuffer());
    expect(readDataZip(bytes, 'lists.json')).toEqual({
      ok: true,
      text: expected(app),
      sibling: true,
      other: [],
      more: 0
    });
    const own = app.homebrew!;
    expect(readDataZip(bytes, 'homebrew.json')).toEqual({
      ok: true,
      text: homebrewText(toHomebrewFile(own.books, own.items, own.cards, new Date(NOW))),
      sibling: true,
      other: [],
      more: 0
    });
    app.stop();
  });

  it('writes no homebrew.json for an account with no own source, card or item', async () => {
    const image = fakeImage();
    const app = new AppState(
      fakeEnv({
        router: memoryRouter('#/lists'),
        storage: memoryStorage(),
        cloud: fakeCloud(SEED, 'gm2'),
        data: { load: () => loot },
        clock: fixedClock(NOW),
        image
      })
    );
    app.start();
    await vi.waitFor(() => {
      expect(app.homebrew?.status).toBe('ready');
    });
    await vi.waitFor(() => {
      expect(app.cloudLists?.lists.length).toBeGreaterThan(0);
    });
    await app.exportData();
    const bytes = new Uint8Array(await image.downloaded[0]!.blob.arrayBuffer());
    expect(readDataZip(bytes, 'lists.json')).toMatchObject({ ok: true, sibling: false });
    expect(readDataZip(bytes, 'homebrew.json')).toEqual({ ok: false, reason: 'missing' });
    app.stop();
  });

  it('downloads no zip while the own items load or after their read failed, and says so', async () => {
    const { app, image } = await signedIn();
    app.homebrew!.status = 'loading';
    await app.exportData();
    app.homebrew!.status = 'error';
    await app.exportData();
    await app.exportHomebrew({ book: null }, 'Хоумбрю');
    expect(image.downloaded).toEqual([]);
    expect(app.toast).toMatchObject({ msg: app.t.hbNotReady, mode: 'err' });
    app.stop();
  });

  it('downloads one source, the default source and the ticked items as homebrew files', async () => {
    const { app, image } = await signedIn();
    const own = app.homebrew!;
    const alder = own.books[0]!;
    await app.exportHomebrew({ book: alder.id }, 'Мастерская Ольхи');
    await app.exportHomebrew({ book: null }, 'Хоумбрю');
    await app.exportHomebrew({ items: [AXE] }, null);
    expect(image.downloaded.map((d) => [d.filename, d.blob.type])).toEqual([
      ['Мастерская Ольхи.json', 'application/json'],
      ['Хоумбрю.json', 'application/json'],
      [`daggerheart-loot-homebrew-${DAY}.json`, 'application/json']
    ]);
    const fileOf = (pick: Parameters<typeof subsetOf>[1]): string => {
      const rows = subsetOf(own, pick);
      return homebrewText(toHomebrewFile(rows.books, rows.items, rows.cards, new Date(NOW)));
    };
    expect(await image.downloaded[0]!.blob.text()).toBe(fileOf({ book: alder.id }));
    expect(await image.downloaded[1]!.blob.text()).toBe(fileOf({ book: null }));
    expect(await image.downloaded[2]!.blob.text()).toBe(fileOf({ items: [AXE] }));
    expect(app.toast).toBeNull();
    app.stop();
  });

  it('says a failed homebrew download', async () => {
    const { app } = await signedIn(fakeImage({ failDownload: true }));
    await app.exportHomebrew({ items: [AXE] }, null);
    expect(app.toast).toMatchObject({ msg: app.t.accountFailed, mode: 'err' });
    app.stop();
  });

  it("downloads a list past the file's entry bound whole and names it in one toast", async () => {
    const { app, image } = await signedIn(
      fakeImage(),
      { entries: ENTRIES_MAX + 100 },
      'gm1',
      withLong('Склад')
    );
    await app.exportLists([LONG]);
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
    const { app } = await signedIn(
      fakeImage(),
      { lists: LISTS_MAX + 100, entries: ENTRIES_MAX + 100 },
      'gm1',
      withLong('Склад')
    );
    const store = app.cloudLists!;
    for (let i = 0; i < LISTS_MAX - 2; i++) store.create('Список ' + String(i));
    await app.exportLists(store.lists.filter((l) => l.id !== LONG).map((l) => l.id));
    expect(app.toast?.msg).toBe(
      'Этот файл нельзя импортировать целиком. В нём больше 1000 списков: экспортируйте их частями.'
    );
    await app.exportData();
    expect(app.toast?.msg).toBe(
      'Этот файл нельзя импортировать целиком. В нём больше 1000 списков: экспортируйте их частями. В списках «Склад» позиций больше 5000: разделите такие списки.'
    );
    app.stop();
  });

  it('says a lists file past 5 MB, downloaded alone and in the zip', async () => {
    const { app, image } = await signedIn(fakeImage(), { entries: 1000 });
    /* 700 entries with a GM note of 4000 two-byte characters: about 5.6 MB of UTF-8. */
    const ids = Array.from({ length: 700 }, (_, i) => 'r' + String(i));
    const note = 'я'.repeat(4000);
    const big = app.cloudLists!.create('Склад', {
      ids,
      meta: Object.fromEntries(ids.map((id) => [id, { hnote: note }]))
    });
    await app.exportLists([big.id]);
    expect(image.downloaded[0]!.blob.size).toBeGreaterThan(FILE_MAX_BYTES);
    const said =
      'Этот файл нельзя импортировать целиком. Он больше 5 МБ: экспортируйте списки частями.';
    expect(app.toast).toMatchObject({ msg: said, mode: '' });
    app.hideToast();
    await app.exportData();
    expect(app.toast).toMatchObject({ msg: said, mode: '' });
    app.stop();
  });

  it("says the zip's homebrew.json past 5 MB, and not the lists file under it", async () => {
    const { app } = await signedIn();
    const own = app.homebrew!;
    const [ring] = own.items.filter((i) => i.key === 'hb_engravedringaaaa');
    /* 700 copies with a description of 4000 two-byte characters: about 5.6 MB. */
    const copies = Array.from({ length: 700 }, (_, i) => ({
      ...ring!,
      id: 'copy' + String(i),
      key: 'hb_copy' + String(i).padStart(12, 'a'),
      content: { ...ring!.content, rud: 'я'.repeat(4000) }
    }));
    own.items = [...own.items, ...copies];
    await app.exportData();
    expect(app.toast).toMatchObject({
      msg: 'Файл homebrew.json больше 5 МБ: скачайте источники по одному на странице «Мои предметы».',
      mode: ''
    });
    app.setLang('en');
    await app.exportData();
    expect(app.toast?.msg).toBe(
      'The homebrew.json file is larger than 5 MB: download the sources one by one on the My items page.'
    );
    app.stop();
  });

  it("restores gm2's and gm1's data zips into an empty account: a fixed copy, then a link to it", async () => {
    const zipOf = async (as: 'gm1' | 'gm2'): Promise<Uint8Array> => {
      const { app, image } = await signedIn(fakeImage(), {}, as);
      await app.exportData();
      app.stop();
      return new Uint8Array(await image.downloaded[0]!.blob.arrayBuffer());
    };
    const [gm1, gm2] = [await zipOf('gm1'), await zipOf('gm2')];
    const empty: Seed = {
      ...SEED,
      lists: { ...SEED.lists, gm3: [] },
      homebrew: { ...SEED.homebrew, gm3: { books: [], items: [], cards: [] } }
    };
    const { app } = await signedIn(fakeImage(), {}, 'gm3', empty);
    const own = app.homebrew!;
    const lists = app.cloudLists!;
    expect([lists.lists, own.items]).toEqual([[], []]);
    const loadLists = async (zip: Uint8Array): Promise<void> => {
      const read = readDataZip(zip, 'lists.json');
      if (!read.ok) throw new Error('The zip holds no lists.json');
      const parsed = parseBundle(read.text, (id) => app.catalog?.byId.has(id) ?? false);
      if (!parsed.ok) throw new Error('The lists.json is refused: ' + parsed.reason);
      const plan = app.importPlan(parsed.lists);
      if (!plan) throw new Error('No plan with a cloud');
      expect(await app.importLists(plan)).toEqual({ ok: true });
    };
    /* gm2's lists first: the account lacks the axe, so the import makes it a fixed copy
       under gm3's derived key. */
    const AXE3 = derivedKey(uuid(3), AXE);
    expect(readDataZip(gm2, 'homebrew.json')).toEqual({ ok: false, reason: 'missing' });
    await loadLists(gm2);
    expect(own.has(AXE)).toBe(false);
    expect(own.item(AXE3)?.book_id).toBeNull();
    const hb = readDataZip(gm1, 'homebrew.json');
    if (!hb.ok) throw new Error('The zip holds no homebrew.json');
    const parsed = parseHomebrew(hb.text, {
      catalogHas: (id) => app.catalog?.byId.has(id) ?? false,
      catalogSet: () => false,
      catalogRef: () => false,
      ownItem: (key) => own.has(key),
      ownCard: () => null,
      lineMembers: () => []
    });
    if (!parsed.ok) throw new Error('The homebrew.json is refused: ' + parsed.reason);
    /* The panel's mapping: every key gm3 does not hold takes gm3's derived key. */
    const mapped = deriveFile(parsed.file, uuid(3), own).file;
    const rows = rowsOf(mapped);
    const ids = {
      id: () => own.newIds().id,
      key: (_slot: string, first?: string) => first ?? own.newIds().key
    };
    const call = toHomebrewRows(
      mapped,
      rows,
      rows.map((r) => defaultTarget(r, own)),
      own,
      false,
      ids
    );
    /* The copy holds the axe's derived key: the homebrew file skips it. */
    expect(await own.import(call)).toMatchObject({ ok: true, counts: { items_skipped: 1 } });
    await loadLists(gm1);
    const withAxe = lists.lists.filter((l) => l.ids.includes(AXE3));
    expect(withAxe).toHaveLength(2);
    expect(lists.lists.some((l) => l.ids.includes(AXE))).toBe(false);
    /* Both lists link the account's own axe: no record of another account. */
    expect(withAxe.map((l) => l.links?.[AXE3])).toEqual([
      own.item(AXE3)?.id,
      own.item(AXE3)?.id
    ]);
    expect(withAxe.map((l) => linkedOf(l)[AXE3])).toEqual([undefined, undefined]);
    app.stop();
  });

  it("moves gm1's data zip into gm2, homebrew first: the lists link the moved items and copy none, and gm2's own row still draws gm1's axe", async () => {
    const { app: from, image } = await signedIn(fakeImage(), {}, 'gm1');
    await from.exportData();
    from.stop();
    const zip = new Uint8Array(await image.downloaded[0]!.blob.arrayBuffer());
    const { app } = await signedIn(fakeImage(), {}, 'gm2');
    const own = app.homebrew!;
    const GM2 = SEED.users.gm2.id;
    const hb = readDataZip(zip, 'homebrew.json');
    if (!hb.ok) throw new Error('The zip holds no homebrew.json');
    const parsed = parseHomebrew(hb.text, {
      catalogHas: (id) => app.catalog?.byId.has(id) ?? false,
      catalogSet: () => false,
      catalogRef: () => false,
      ownItem: (key) => own.has(key),
      ownCard: () => null,
      lineMembers: () => []
    });
    if (!parsed.ok) throw new Error('The homebrew.json is refused: ' + parsed.reason);
    const mapped = deriveFile(parsed.file, GM2, own).file;
    const rows = rowsOf(mapped);
    const call = toHomebrewRows(
      mapped,
      rows,
      rows.map((r) => defaultTarget(r, own)),
      own,
      false,
      { id: () => own.newIds().id, key: (_slot, first) => first ?? own.newIds().key }
    );
    expect(await own.import(call)).toMatchObject({ ok: true });
    expect(own.items.map((i) => i.key).sort()).toEqual(
      parsed.file.items.map((i) => derivedKey(GM2, i.key)).sort()
    );
    /* gm2's seeded row links gm1's axe by its key: it still draws gm1's item. */
    const axe = app.recordFor(AXE) as Record_ & { hid?: string };
    expect(axe.hid).toBe('00000000-0000-4000-8000-000000000511');
    const read = readDataZip(zip, 'lists.json');
    if (!read.ok) throw new Error('The zip holds no lists.json');
    const lists = parseBundle(read.text, (id) => app.catalog?.byId.has(id) ?? false);
    if (!lists.ok) throw new Error('The lists.json is refused');
    const plan = app.importPlan(lists.lists);
    expect(plan?.copies).toBeNull();
    const linked = plan?.rows.flatMap((r) => r.entries.filter((e) => e.source === 'homebrew'));
    expect(linked?.length).toBeGreaterThan(0);
    for (const e of linked ?? []) expect(own.has(e.item_key)).toBe(true);
    expect(await app.importLists(plan!)).toEqual({ ok: true });
    app.stop();
  });

  it("keeps the preview's plan for a press while the own items are read again", async () => {
    const { app } = await signedIn(fakeImage(), {}, 'gm2');
    const own = app.homebrew!;
    const lists = lamps();
    const first = lists[0]!.entries[0]!.item_key;
    /* gm2 holds the first lamp under its derived key: the plan links it, copying two. */
    const made = await own.import({
      books: [],
      cards: [],
      items: [
        {
          id: own.newIds().id,
          key: derivedKey(SEED.users.gm2.id, first),
          book: null,
          content: { kind: 'item', ru: 'Лампа' }
        }
      ],
      update: false
    });
    expect(made.ok).toBe(true);
    const plan = app.importPlan(lists);
    if (!plan) throw new Error('No plan with a cloud');
    expect(plan.copies?.items).toHaveLength(2);
    /* The held lamp goes: a ready read re-plans with its copy; a read in flight keeps the plan. */
    own.items = [];
    expect(app.importPlan(lists, plan)?.copies?.items).toHaveLength(3);
    const port = app.env.cloud!.homebrew;
    port.load = () => new Promise(() => undefined);
    void own.load();
    expect(own.status).toBe('loading');
    expect(app.importPlan(lists, plan)).toBe(plan);
    app.stop();
  });

  /* A lists file of three own lamps the account does not hold. */
  const lamps = (): ImportList[] => {
    const key = (n: number) =>
      'hb_lamp' + 'abcdefghijklmnopqrstuvwxyz234567'.charAt(n) + 'aaaaaaaaaaa';
    return [
      {
        name: 'Лампы',
        money_mode: 'bag',
        player_note: '',
        gm_note: '',
        entries: [0, 1, 2].map((n) => ({
          item_key: key(n),
          source: 'homebrew' as const,
          snapshot: {
            id: key(n),
            src: 'homebrew',
            kind: 'item',
            en: 'Lamp ' + String(n),
            ru: 'Лампа ' + String(n),
            ende: '',
            rud: ''
          },
          quantity: 1,
          price_coins: null,
          player_note: '',
          gm_note: ''
        }))
      }
    ];
  };

  it('refuses a lists file whose copies pass the item limit whole, writing nothing', async () => {
    const { app } = await signedIn(fakeImage(), { items: 2 }, 'gm2');
    const plan = app.importPlan(lamps());
    expect(plan?.copies?.items).toHaveLength(3);
    const before = app.cloudLists!.lists.length;
    expect(await app.importLists(plan!)).toEqual({
      ok: false,
      error: 'limit',
      key: 'homebrew_items_per_owner',
      value: 2
    });
    expect(app.cloudLists!.lists).toHaveLength(before);
    expect(app.homebrew!.items).toEqual([]);
    app.stop();
  });

  it('keeps the copies of a lists call that failed, and links them on the retry', async () => {
    const { app } = await signedIn(fakeImage(), {}, 'gm2');
    const cloud = app.env.cloud!;
    const plan = app.importPlan(lamps())!;
    vi.spyOn(cloud.lists, 'import').mockResolvedValueOnce({ ok: false, error: 'refused' });
    expect(await app.importLists(plan)).toEqual({ ok: false, error: 'refused' });
    expect(app.homebrew!.items.map((i) => i.key)).toEqual(plan.copies?.items.map((i) => i.key));
    const again = app.importPlan(lamps(), plan);
    expect(again).toBe(plan);
    expect(await app.importLists(plan)).toEqual({ ok: true });
    const made = app.cloudLists!.get(plan.rows[0]!.list.id);
    expect(Object.values(made?.links ?? {})).toEqual(app.homebrew!.items.map((i) => i.id));
    app.stop();
  });

  it('answers network for an import with no cloud', async () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/lists'), cloud: null }));
    expect(app.importPlan(lamps())).toBeNull();
    expect(await app.importLists({ rows: [], copies: null })).toEqual({
      ok: false,
      error: 'network'
    });
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
        hb_item: e.hb_item
      }));
    }
    const AXE_ID = '00000000-0000-4000-8000-000000000511';

    it("finds another account's record in the open share first, then in a list, and knows it", async () => {
      const cloud = fakeCloud(SEED, 'gm2');
      const { app } = started(cloud, '#/lists');
      await flush();
      const kept = app.cloudLists?.get(GM2_LIST)?.linked?.[AXE];
      expect(kept).toMatchObject({ src: 'homebrew', hid: AXE_ID });
      expect(app.linkedRecord(AXE)).toBe(kept);
      expect(app.recordFor(AXE)).toBe(kept);
      expect(app.knows(AXE)).toBe(true);
      expect(app.knows('hb_smithpotionaaaaa')).toBe(false);
      expect(app.linkedRecord('ci1')).toBeUndefined();
      expect(app.recordFor('ci1')).toBe(app.catalog?.byId.get('ci1'));
      await app.sharedView?.open('player-token-1', '00000000-0000-4000-8000-000000000002');
      const shown = app.sharedView?.shared?.entries.find((e) => e.item_key === AXE);
      expect(shown?.hid).toBe(AXE_ID);
      expect(shown?.img).toBe('ci1.webp');
      expect(app.linkedRecord(AXE)).toEqual({
        ...(shown?.snapshot as object),
        hid: AXE_ID,
        img: 'ci1.webp'
      });
      app.sharedView?.close();
      expect(app.linkedRecord(AXE)).toBe(kept);
      app.stop();
    });

    it("links the open share's item on an add from #/s/, and the owner's own item by its id", async () => {
      const cloud = fakeCloud(SEED, 'gm2');
      const { app } = started(cloud, '#/s/player-token-1');
      await flush();
      await app.sharedView?.open('player-token-1', '00000000-0000-4000-8000-000000000002');
      const store = app.cloudLists!;
      const l = store.create('С полки');
      expect(store.add(l.id, [AXE, 'ci1'], (id) => app.knows(id))).toEqual([AXE, 'ci1']);
      await store.flushNow();
      expect(await written(cloud, l.id)).toEqual([
        { key: AXE, source: 'homebrew', hb_item: AXE_ID },
        { key: 'ci1', source: 'official', hb_item: null }
      ]);
      app.stop();

      const own = fakeCloud(SEED, 'gm1');
      const gm1 = started(own, '#/s/player-token-1');
      await flush();
      await gm1.app.sharedView?.open('player-token-1', '00000000-0000-4000-8000-000000000001');
      gm1.app.cloudLists?.add(EMPTY_LIST, [AXE], (id) => gm1.app.knows(id));
      await gm1.app.cloudLists?.flushNow();
      expect(await written(own, EMPTY_LIST)).toEqual([
        { key: AXE, source: 'homebrew', hb_item: AXE_ID }
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

describe('the item page and «Сохранить себе»', () => {
  const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
  const loot: Loot = {
    items: {
      core_item: [
        { id: 'ci1', src: 'core', kind: 'item', en: 'A', ende: '', ru: 'А', rud: '', roll: 1 }
      ]
    }
  };
  const AXE = 'hb_emberaxeaaaaaaaa';
  const AXE_ID = '00000000-0000-4000-8000-000000000511';
  const CAP = 'hb_whispercapaaaaaa';
  const CAP_ID = '00000000-0000-4000-8000-000000000513';
  const ROLL_B = '00000000-0000-4000-8000-000000000662';
  const GM2_LIST = '00000000-0000-4000-8000-000000000201';
  const SECOND = '00000000-0000-4000-8000-000000009201';
  const ru = dict('ru');

  function started(cloud: CloudPort, hash: string) {
    const router = memoryRouter(hash);
    const storage = memoryStorage();
    const app = new AppState(fakeEnv({ router, storage, cloud, data: { load: () => loot } }));
    app.start();
    return { app, router, storage };
  }

  /* The server's rows of a list: what a relink must keep, and what it moves. */
  async function rows(cloud: CloudPort, id: string) {
    const read = await cloud.lists.list();
    const l = read.ok ? read.lists.find((x) => x.id === id) : undefined;
    return l?.list_entries.map((e) => ({ ...e }));
  }

  it('reads the open item first for a key, and re-reads it signed out when the tab is shown again', async () => {
    const world = fakeCloud(SEED);
    const { app } = started(world.as('gm2'), '#/h/' + AXE_ID);
    await flush();
    await app.itemView?.open(AXE_ID, SEED.users.gm2.id);
    expect(app.linkedRecord(AXE)).toBe(app.itemView?.record);
    app.stop();

    const out = started(world.as(), '#/h/' + ROLL_B);
    await flush();
    await out.app.itemView?.open(ROLL_B, null);
    const read = vi.spyOn(out.app.itemView as NonNullable<typeof out.app.itemView>, 'refresh');
    out.storage.fireExternalChange(null);
    expect(read).toHaveBeenCalledOnce();
    out.app.stop();
  });

  it('re-reads the open item every 45 s, signed out and signed in, on no other route, and keeps an unchanged record', async () => {
    vi.useFakeTimers();
    try {
      for (const who of [undefined, 'gm2'] as const) {
        const port = fakeCloud(SEED).as(who);
        const { app } = started(port, '#/h/' + ROLL_B);
        await vi.advanceTimersByTimeAsync(0);
        const view = app.itemView as NonNullable<typeof app.itemView>;
        await view.open(ROLL_B, app.user?.userId ?? null);
        const record = view.record;
        const item = vi.spyOn(port.lists, 'item');
        await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
        expect(item).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
        expect(item).toHaveBeenCalledTimes(2);
        expect(view.record).toBe(record);
        expect(view.changes).toBe(0);
        app.go('#/lists');
        await vi.advanceTimersByTimeAsync(LIST_POLL_MS);
        expect(item).toHaveBeenCalledTimes(2);
        app.stop();
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps a «Сохранить себе» action across the sign-in, hands it to the page after the lists read, and forgets it on a navigation', async () => {
    const { app } = started(fakeCloud(SEED), '#/h/' + ROLL_B);
    await flush();
    app.askSignIn({ hash: '#/h/' + ROLL_B, action: { do: 'saveItem', hid: ROLL_B } });
    await app.signIn('google');
    await flush();
    expect(app.hash).toBe('#/h/' + ROLL_B);
    expect(app.saveItemFor).toBe(ROLL_B);
    app.go('#/lists');
    expect(app.saveItemFor).toBeNull();
    app.stop();
  });

  it('saves a copy under the derived key and relinks every list that links the item to it, each entry kept', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    await cloud.lists.apply([
      {
        op: 'create',
        list: { id: SECOND, name: 'Второй', money_mode: 'bag', player_note: '', gm_note: '' },
        entries: [
          {
            id: '00000000-0000-4000-8000-000000009202',
            item_key: AXE,
            source: 'homebrew',
            hb_item: AXE_ID,
            position: 0,
            quantity: 3,
            price_coins: 40,
            player_note: 'Игрокам',
            gm_note: 'Мастеру'
          }
        ]
      }
    ]);
    const { app } = started(cloud, '#/lists/' + GM2_LIST);
    await flush();
    const before = [
      ...((await rows(cloud, GM2_LIST)) ?? []),
      ...((await rows(cloud, SECOND)) ?? [])
    ];
    const record = app.linkedRecord(AXE);
    expect(record?.hid).toBe(AXE_ID);
    expect(app.isForeignItem(record!)).toBe(true);
    expect(app.relinkTargets(record!).sort()).toEqual([GM2_LIST, SECOND].sort());
    await app.saveItem(record!);
    await app.cloudLists?.flushNow();
    const COPY = derivedKey(SEED.users.gm2.id, AXE);
    expect(app.homebrew?.has(AXE)).toBe(false);
    const own = app.homebrew?.item(COPY);
    expect(own?.id).not.toBe(AXE_ID);
    expect(own?.book_id).toBeNull();
    const after = [
      ...((await rows(cloud, GM2_LIST)) ?? []),
      ...((await rows(cloud, SECOND)) ?? [])
    ];
    const rowsOfKey = (rs: typeof before, key: string) => rs.filter((e) => e.item_key === key);
    expect(rowsOfKey(after, AXE)).toEqual([]);
    expect(rowsOfKey(after, COPY)).toEqual(
      rowsOfKey(before, AXE).map((e) => ({ ...e, item_key: COPY, hb_item: own?.id }))
    );
    expect(app.toast?.msg).toBe(ru.saveItemRelinked.replace('%s', 'Топор Тлеющих Углей'));
    expect(app.toast?.action?.href).toBe('#/homebrew/' + COPY);
    expect(app.isForeignItem(record!)).toBe(true);
    expect(app.relinkTargets(record!)).toEqual([]);
    app.stop();
  });

  it('writes the copy and its set card under the derived keys', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const { app } = started(cloud, '#/h/' + ROLL_B);
    await flush();
    await app.itemView?.open(ROLL_B, SEED.users.gm2.id);
    const record = app.itemView?.record;
    if (!record) throw new Error('no record');
    await app.saveItem(record);
    const GM2 = SEED.users.gm2.id;
    const read = await cloud.homebrew.load();
    if (!read.ok) throw new Error('no read');
    expect(read.items.map((i) => i.key)).toEqual([derivedKey(GM2, 'hb_rangerrollaaaaaa')]);
    expect(read.cards.map((c) => c.key)).toEqual([derivedKey(GM2, 'hb_starsleepsetaaaa')]);
    expect(read.items[0]?.content.set).toBe(derivedKey(GM2, 'hb_starsleepsetaaaa'));
    app.stop();
  });

  /* gm2's lists past its seeded one, each with one row that links gm1's axe. */
  async function linking(cloud: CloudPort, n: number): Promise<void> {
    const ops = Array.from({ length: n }, (_, i) => ({
      op: 'create' as const,
      list: {
        id: uuid(9300 + i),
        name: 'Список ' + String(i),
        money_mode: 'bag' as const,
        player_note: '',
        gm_note: ''
      },
      entries: [
        {
          id: uuid(9500 + i),
          item_key: AXE,
          source: 'homebrew' as const,
          hb_item: AXE_ID,
          position: 0,
          quantity: i + 1,
          price_coins: i,
          player_note: 'Игрокам ' + String(i),
          gm_note: 'Мастеру ' + String(i),
          ...(i % 2 ? { gm_only: true } : {})
        }
      ]
    }));
    const r = await cloud.lists.apply(ops);
    expect(r.ok).toBe(true);
  }

  it.each([50, 150])(
    'moves the row of the axe in each of %i lists to the copy with its fields, one relink per list',
    async (n) => {
      const cloud = fakeCloud(SEED, 'gm2', { limits: { lists: n } });
      await linking(cloud, n - 1);
      const { app } = started(cloud, '#/lists/' + GM2_LIST);
      await flush();
      const record = app.linkedRecord(AXE);
      if (!record) throw new Error('no axe');
      const all = async () => {
        const read = await cloud.lists.list();
        return read.ok ? read.lists.flatMap((l) => l.list_entries.map((e) => ({ ...e }))) : [];
      };
      const before = (await all()).filter((e) => e.item_key === AXE);
      expect(before).toHaveLength(n);
      const apply = vi.spyOn(cloud.lists, 'apply');
      await app.saveItem(record);
      await app.cloudLists?.flushNow();
      const COPY = derivedKey(SEED.users.gm2.id, AXE);
      const copyId = app.homebrew?.item(COPY)?.id;
      const after = await all();
      expect(after.filter((e) => e.item_key === AXE)).toEqual([]);
      const moved = after.filter((e) => e.item_key === COPY);
      const strip = (e: (typeof before)[number]) => ({ ...e, updated_at: '' });
      expect(moved.map(strip).sort((a, b) => a.id.localeCompare(b.id))).toEqual(
        before
          .map((e) => strip({ ...e, item_key: COPY, hb_item: copyId! }))
          .sort((a, b) => a.id.localeCompare(b.id))
      );
      const relinks = apply.mock.calls.flatMap(([ops]) => ops.filter((o) => o.op === 'relink'));
      expect(relinks).toHaveLength(n);
      expect(app.toast?.msg).toBe(ru.saveItemRelinked.replace('%s', 'Топор Тлеющих Углей'));
      app.stop();
    }
  );

  it('makes one copy for a lost answer whose rows landed and a second press', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const real = cloud.homebrew.import.bind(cloud.homebrew);
    const imported = vi.fn(async (rows: Parameters<typeof real>[0]) => {
      await real(rows);
      return { ok: false as const, error: 'network' as const };
    });
    cloud.homebrew.import = imported;
    const { app } = started(cloud, '#/lists/' + GM2_LIST);
    await flush();
    const record = app.linkedRecord(AXE);
    if (!record) throw new Error('no axe');
    await app.saveItem(record);
    await app.saveItem(record);
    expect(imported).toHaveBeenCalledOnce();
    const read = await cloud.homebrew.load();
    expect(read.ok && read.items.map((i) => i.key)).toEqual([
      derivedKey(SEED.users.gm2.id, AXE)
    ]);
    app.stop();
  });

  it('writes nothing at the item limit and says the limit', async () => {
    const cloud = fakeCloud(SEED, 'gm2', { limits: { items: 0 } });
    const { app } = started(cloud, '#/lists/' + GM2_LIST);
    await flush();
    const record = app.linkedRecord(AXE);
    if (!record) throw new Error('no axe');
    await app.saveItem(record);
    expect(app.toast?.msg).toBe(ru.limitHbItems.replace('%n', '0'));
    const read = await cloud.homebrew.load();
    expect(read.ok && read.items).toEqual([]);
    expect((await rows(cloud, GM2_LIST))?.some((e) => e.item_key === AXE)).toBe(true);
    app.stop();
  });

  it('offers the press again when the relink never ran, and the press relinks with no second import', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const real = cloud.homebrew.import.bind(cloud.homebrew);
    const load = cloud.homebrew.load.bind(cloud.homebrew);
    const imported = vi.fn(async (r: Parameters<typeof real>[0]) => {
      await real(r);
      return { ok: false as const, error: 'network' as const };
    });
    const { app } = started(cloud, '#/lists/' + GM2_LIST);
    await flush();
    const record = app.linkedRecord(AXE);
    if (!record) throw new Error('no axe');
    cloud.homebrew.import = imported;
    cloud.homebrew.load = () => Promise.resolve({ ok: false });
    await app.saveItem(record);
    expect(app.toast?.msg).toBe(ru.saveItemFailed);
    cloud.homebrew.load = load;
    await app.homebrew?.read();
    const COPY = derivedKey(SEED.users.gm2.id, AXE);
    expect(app.homebrew?.has(COPY)).toBe(true);
    expect(app.relinkTargets(record)).toEqual([GM2_LIST]);
    await app.saveItem(record);
    await app.cloudLists?.flushNow();
    expect(imported).toHaveBeenCalledOnce();
    expect(app.toast?.msg).toBe(ru.saveItemRelinked.replace('%s', 'Топор Тлеющих Углей'));
    const keys = (await rows(cloud, GM2_LIST))?.map((e) => e.item_key);
    expect(keys).toContain(COPY);
    expect(keys).not.toContain(AXE);
    expect(app.relinkTargets(record)).toEqual([]);
    app.stop();
  });

  it('says the plain save when the row was removed while the copy was made', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const { app } = started(cloud, '#/lists/' + GM2_LIST);
    await flush();
    const record = app.linkedRecord(AXE)!;
    const real = cloud.homebrew.import.bind(cloud.homebrew);
    cloud.homebrew.import = async (rows) => {
      app.cloudLists?.removeEntry(GM2_LIST, AXE);
      return real(rows);
    };
    await app.saveItem(record);
    expect(app.toast?.msg).toBe(ru.saveItemSaved.replace('%s', 'Топор Тлеющих Углей'));
    app.stop();
  });

  /* gm1's axe with an own picture file of gm1's. */
  async function ownPicture(cloud: FakeCloud): Promise<string> {
    const author = cloud.as('gm1');
    const name = `p/${'a'.repeat(32)}.webp`;
    const blob = new Blob(['x'], { type: 'image/webp' });
    expect((await author.homebrew.uploadArt(name, blob)).ok).toBe(true);
    expect((await author.homebrew.uploadArt(`t/${'a'.repeat(32)}.webp`, blob)).ok).toBe(true);
    expect((await author.homebrew.setArt(AXE_ID, name, false)).ok).toBe(true);
    return name;
  }

  const artOf = async (cloud: FakeCloud, key: string): Promise<string | null | undefined> => {
    const read = await cloud.homebrew.load();
    return read.ok ? read.items.find((i) => i.key === key)?.art : undefined;
  };

  it("copies the author's own picture file to a name of the copy's, before the relink", async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const name = await ownPicture(cloud);
    const { app } = started(cloud, '#/lists/' + GM2_LIST);
    await flush();
    const record = app.linkedRecord(AXE);
    if (!record) throw new Error('no axe');
    expect(record.img).toBe(name);
    const order: string[] = [];
    const setArt = cloud.homebrew.setArt.bind(cloud.homebrew);
    cloud.homebrew.setArt = (...a) => {
      order.push('setArt');
      return setArt(...a);
    };
    const apply = cloud.lists.apply.bind(cloud.lists);
    cloud.lists.apply = (ops) => {
      if (ops.some((o) => o.op === 'relink')) order.push('relink');
      return apply(ops);
    };
    await app.saveItem(record);
    await app.cloudLists?.flushNow();
    const COPY = derivedKey(SEED.users.gm2.id, AXE);
    const copied = await artOf(cloud, COPY);
    expect(copied).toMatch(/^p\/[0-9a-f]{32}\.webp$/);
    expect(copied).not.toBe(name);
    expect(cloud.artStatus(copied!)).toBe(200);
    expect(order).toEqual(['setArt', 'relink']);
    expect(app.toast?.msg).toBe(ru.saveItemRelinked.replace('%s', 'Топор Тлеющих Углей'));
    app.stop();
  });

  it('names a catalog picture on the copy as it is', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const copyArt = vi.spyOn(cloud.homebrew, 'copyArt');
    const { app } = started(cloud, '#/lists/' + GM2_LIST);
    await flush();
    const record = app.linkedRecord(AXE);
    if (!record) throw new Error('no axe');
    expect(record.img).toBe('ci1.webp');
    await app.saveItem(record);
    expect(await artOf(cloud, derivedKey(SEED.users.gm2.id, AXE))).toBe('ci1.webp');
    expect(copyArt).not.toHaveBeenCalled();
    app.stop();
  });

  it('says a failed picture copy, and still saves the copy and relinks', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    await ownPicture(cloud);
    cloud.homebrew.copyArt = () => Promise.resolve({ ok: false });
    const { app } = started(cloud, '#/lists/' + GM2_LIST);
    await flush();
    const record = app.linkedRecord(AXE);
    if (!record) throw new Error('no axe');
    await app.saveItem(record);
    await app.cloudLists?.flushNow();
    const COPY = derivedKey(SEED.users.gm2.id, AXE);
    expect((await artOf(cloud, COPY)) ?? null).toBeNull();
    expect(app.toast?.msg).toBe(
      ru.saveItemRelinked.replace('%s', 'Топор Тлеющих Углей') + ' ' + ru.copyArtFailed
    );
    expect((await rows(cloud, GM2_LIST))?.map((e) => e.item_key)).toContain(COPY);
    app.stop();
  });

  it('writes nothing for an item with no picture', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    expect((await cloud.as('gm1').homebrew.setArt(AXE_ID, null, false)).ok).toBe(true);
    const setArt = vi.spyOn(cloud.homebrew, 'setArt');
    const { app } = started(cloud, '#/lists/' + GM2_LIST);
    await flush();
    const record = app.linkedRecord(AXE);
    if (!record) throw new Error('no axe');
    await app.saveItem(record);
    expect(setArt).not.toHaveBeenCalled();
    expect((await artOf(cloud, derivedKey(SEED.users.gm2.id, AXE))) ?? null).toBeNull();
    app.stop();
  });

  /* A first press whose import landed but whose answer and account read were lost: the
     copy is held without a picture, and the rows still link the author's item. */
  async function lostFirstPress(cloud: FakeCloud) {
    const real = cloud.homebrew.import.bind(cloud.homebrew);
    const load = cloud.homebrew.load.bind(cloud.homebrew);
    const { app } = started(cloud, '#/lists/' + GM2_LIST);
    await flush();
    const record = app.linkedRecord(AXE);
    if (!record) throw new Error('no axe');
    cloud.homebrew.import = async (r) => {
      await real(r);
      return { ok: false, error: 'network' };
    };
    cloud.homebrew.load = () => Promise.resolve({ ok: false });
    await app.saveItem(record);
    cloud.homebrew.load = load;
    await app.homebrew?.read();
    const COPY = derivedKey(SEED.users.gm2.id, AXE);
    const held = app.homebrew?.item(COPY);
    if (!held) throw new Error('no held copy');
    expect(held.art ?? null).toBeNull();
    return { app, record, COPY, held };
  }

  it("gives a held copy without a picture the author's picture on the relink-only press", async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const name = await ownPicture(cloud);
    const { app, record, COPY } = await lostFirstPress(cloud);
    await app.saveItem(record);
    await app.cloudLists?.flushNow();
    const copied = await artOf(cloud, COPY);
    expect(copied).toMatch(/^p\/[0-9a-f]{32}\.webp$/);
    expect(copied).not.toBe(name);
    expect(app.toast?.msg).toBe(ru.saveItemRelinked.replace('%s', 'Топор Тлеющих Углей'));
    app.stop();
  });

  it('keeps the picture of a held copy that has one, and one another device set meanwhile', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const { app, record, COPY, held } = await lostFirstPress(cloud);
    /* Another device sets a picture after this tab's read. */
    expect((await cloud.homebrew.setArt(held.id, 'w1.webp', false)).ok).toBe(true);
    await app.saveItem(record);
    await app.cloudLists?.flushNow();
    expect(await artOf(cloud, COPY)).toBe('w1.webp');
    expect(app.homebrew?.item(COPY)?.art).toBe('w1.webp');
    const copyArt = vi.spyOn(cloud.homebrew, 'copyArt');
    const setArt = vi.spyOn(cloud.homebrew, 'setArt');
    await app.saveItem(record);
    expect(copyArt).not.toHaveBeenCalled();
    expect(setArt).not.toHaveBeenCalled();
    app.stop();
  });

  it('copies the picture on the press that a sign-in handed over', async () => {
    const cloud = fakeCloud(SEED);
    const { app } = started(cloud, '#/h/' + ROLL_B);
    await flush();
    app.askSignIn({ hash: '#/h/' + ROLL_B, action: { do: 'saveItem', hid: ROLL_B } });
    await app.signIn('google');
    await flush();
    expect(app.saveItemFor).toBe(ROLL_B);
    const user = app.user;
    if (!user) throw new Error('no user');
    await app.itemView?.open(ROLL_B, user.userId);
    const record = app.itemView?.record;
    if (!record) throw new Error('no record');
    expect(record.img).toBe('w1.webp');
    await app.saveItem(record);
    expect(await artOf(cloud, derivedKey(user.userId, 'hb_rangerrollaaaaaa'))).toBe('w1.webp');
    app.stop();
  });

  it('refuses an add of an item its author deleted meanwhile, and the add leaves the buffer', async () => {
    const world = fakeCloud(SEED, 'gm1');
    const { app } = started(world.as('gm2'), '#/h/' + CAP_ID);
    await flush();
    await app.itemView?.open(CAP_ID, SEED.users.gm2.id);
    expect(app.cloudLists?.add(GM2_LIST, [CAP], (id) => app.knows(id))).toEqual([CAP]);
    await world.homebrew.removeItem(CAP_ID);
    expect(await app.cloudLists?.flushNow()).toBe(true);
    await flush();
    expect(app.toast?.msg).toBe(ru.writeRefused);
    expect(app.cloudLists?.get(GM2_LIST)?.ids).not.toContain(CAP);
    app.stop();
  });

  it('drops a buffered edit of a row the author deleted, and reads the list again', async () => {
    const world = fakeCloud(SEED, 'gm1');
    const gm2 = world.as('gm2');
    const { app } = started(gm2, '#/lists/' + GM2_LIST);
    await flush();
    app.cloudLists?.setMeta(GM2_LIST, AXE, 'qty', 4);
    await world.homebrew.removeItem(AXE_ID);
    expect(await app.cloudLists?.flushNow()).toBe(true);
    await flush();
    await flush();
    expect(app.cloudLists?.get(GM2_LIST)?.ids).toEqual(['q23']);
    const notices = await gm2.requests.notices(GM2_LIST);
    expect(notices.ok && notices.notices.find((n) => n.item_key === AXE)?.kind).toBe('deleted');
    app.stop();
  });
});

describe('printing', () => {
  const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
  const AXE = 'hb_emberaxeaaaaaaaa';
  const AXE_ID = uuid(511);
  const GM2 = '00000000-0000-4000-8000-000000000002';
  const ru = dict('ru');
  /* 300 catalog records, three times the entries a list holds. */
  const loot: Loot = {
    items: {
      core_item: Array.from({ length: 300 }, (_, i) => ({
        id: 'ci' + String(i + 1),
        src: 'core',
        kind: 'item' as const,
        en: 'A',
        ende: '',
        ru: 'А',
        rud: '',
        roll: i + 1
      })),
      core_consumable: [
        {
          id: 'q1',
          src: 'core',
          kind: 'consumable',
          en: 'B',
          ende: '',
          ru: 'Б',
          rud: '',
          roll: 1
        }
      ]
    }
  };
  const many = (n: number): string[] =>
    Array.from({ length: n }, (_, i) => 'ci' + String(i + 1));
  const tooMany = (cut: number): string =>
    ru.printTooMany.replace('%n', '180').replace('%d', String(cut));

  function started(cloud: CloudPort | null, hash: string, over: Partial<Env> = {}) {
    const router = memoryRouter(hash);
    const app = new AppState(
      fakeEnv({ router, storage: memoryStorage(), cloud, data: { load: () => loot }, ...over })
    );
    app.start();
    return { app, router };
  }

  async function entriesOf(cloud: CloudPort, hash: string) {
    const read = await cloud.prints.read(hash.slice('#/p/'.length));
    return read.ok ? (read.set as { entries: unknown[] } | null)?.entries : undefined;
  }

  it('names the target of a print control in each state', async () => {
    expect(started(null, '#/i/ci1').app.printTarget).toBe('none');
    const out = started(fakeCloud(SEED), '#/i/ci1');
    expect(out.app.printTarget).toBe('wait');
    await flush();
    expect(out.app.printTarget).toBe('prompt');
    const gm1 = started(fakeCloud(SEED, 'gm1'), '#/i/ci1');
    await flush();
    expect(gm1.app.printTarget).toBe('cloud');
    out.app.stop();
    gm1.app.stop();
  });

  it('makes a set with the counts, disabled while it runs, and opens its #/p/ address', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { app } = started(cloud, '#/i/ci1');
    await flush();
    const run = app.print(['ci1', 'zzz', 'q1'], { ci1: 3, q1: 1 });
    expect(app.printing).toBe(true);
    await run;
    expect(app.printing).toBe(false);
    expect(app.hash).toMatch(/^#\/p\/[A-Za-z0-9_-]{12}$/);
    expect(await entriesOf(cloud, app.hash)).toEqual([{ k: 'ci1', q: 3 }, { k: 'q1' }]);
    expect(app.toast).toBeNull();
    app.stop();
  });

  it.each([
    [181, 1],
    [300, 120]
  ])('stores the first 180 of %i records and says how many were cut', async (n, cut) => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { app } = started(cloud, '#/lists');
    await flush();
    await app.print(many(n));
    expect(await entriesOf(cloud, app.hash)).toHaveLength(180);
    expect(app.toast?.msg).toBe(tooMany(cut));
    app.stop();
  });

  it('says the own items are loading for an unread key and makes nothing', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    vi.spyOn(cloud.homebrew, 'load').mockReturnValue(new Promise(() => undefined));
    const create = vi.spyOn(cloud.prints, 'create');
    const { app } = started(cloud, '#/i/ci1');
    await flush();
    await app.print(['hb_smithpotionaaaaa', 'ci1']);
    expect(app.toast).toMatchObject({ msg: ru.hbNotReady, mode: 'err' });
    expect(create).not.toHaveBeenCalled();
    expect(app.hash).toBe('#/i/ci1');
    app.stop();
  });

  it('says a failed make and the limit, and stays on the page', async () => {
    const cloud = fakeCloud(SEED, 'gm1', { limits: { printSets: 1 } });
    const { app } = started(cloud, '#/i/ci1');
    await flush();
    await app.print(['ci1']);
    app.go('#/i/q1');
    await app.print(['q1']);
    expect(app.hash).toBe('#/i/q1');
    expect(app.toast).toMatchObject({ msg: ru.printSetLimit.replace('%n', '1'), mode: 'err' });
    cloud.setOffline(true);
    await app.print(['ci1']);
    expect(app.hash).toBe('#/i/q1');
    expect(app.toast).toMatchObject({ msg: ru.printSetFailed, mode: 'err' });
    app.stop();
  });

  it('drops the answer of a make that a navigation overtook', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    let answer: (v: { ok: true; id: string }) => void = () => undefined;
    vi.spyOn(cloud.prints, 'create').mockReturnValue(
      new Promise((r) => {
        answer = r;
      })
    );
    const { app } = started(cloud, '#/i/ci1');
    await flush();
    const run = app.print(['ci1']);
    app.go('#/roll/std');
    answer({ ok: true, id: 'AbCdEf-_1234' });
    await run;
    expect(app.hash).toBe('#/roll/std');
    expect(app.toast).toBeNull();
    app.stop();
  });

  it("stores only what a players' link shows: a GM-only entry never reaches a set", async () => {
    const seed: Seed = {
      ...SEED,
      lists: {
        ...SEED.lists,
        gm1: SEED.lists.gm1.map((l) => ({
          ...l,
          entries: l.entries.map((e) =>
            e.itemKey === AXE ? { ...e, gmOnly: true as const } : e
          )
        })),
        gm2: []
      }
    };
    const cloud = fakeCloud(seed, 'gm2');
    const { app } = started(cloud, '#/s/player-token-1');
    await flush();
    await app.sharedView?.open('player-token-1', GM2);
    await app.print([AXE, 'q1']);
    expect(await entriesOf(cloud, app.hash)).toEqual([{ k: 'q1' }]);
    app.stop();
  });

  it("prints another account's item from a share link and reads it back after a reload", async () => {
    const world = fakeCloud(SEED);
    const { app } = started(world.as('gm2'), '#/s/player-token-1');
    await flush();
    await app.sharedView?.open('player-token-1', GM2);
    await app.print([AXE]);
    const hash = app.hash;
    expect(hash).toMatch(/^#\/p\//);
    app.stop();
    const reloaded = started(world.as('gm2'), hash);
    await flush();
    const read = await reloaded.app.loadPrintSet(hash.slice(4));
    const row = read.ok ? read.set?.rows[0] : undefined;
    expect(row && 'record' in row ? [row.record.id, row.record.hid] : null).toEqual([
      AXE,
      AXE_ID
    ]);
    reloaded.app.stop();
  });

  it('makes the set a signed-out press left once the sign-in has read the lists', async () => {
    const { app } = started(fakeCloud(SEED), '#/i/ci1');
    await flush();
    const { entries } = app.printEntriesOf(['ci1']);
    app.askSignIn({ hash: '#/i/ci1', action: { do: 'print', entries, cut: 1 } });
    await app.signIn('google');
    await flush();
    await flush();
    expect(app.hash).toMatch(/^#\/p\/[A-Za-z0-9_-]{12}$/);
    expect(app.toast?.msg).toBe(tooMany(1));
    app.stop();
  });

  it('says a failed pending make on the page the sign-in returned to', async () => {
    const cloud = fakeCloud(SEED);
    vi.spyOn(cloud.prints, 'create').mockResolvedValue({ ok: false, error: 'network' });
    const { app } = started(cloud, '#/i/ci1');
    await flush();
    app.askSignIn({ hash: '#/i/ci1', action: { do: 'print', entries: [{ k: 'ci1' }] } });
    await app.signIn('google');
    await flush();
    await flush();
    expect(app.hash).toBe('#/i/ci1');
    expect(app.toast).toMatchObject({ msg: ru.printSetFailed, mode: 'err' });
    app.stop();
  });

  it('reads a set for #/p/: none with no cloud, not ok offline, the rows of a seeded set', async () => {
    expect(await started(null, '#/p/set-twocards').app.loadPrintSet('set-twocards')).toEqual({
      ok: true,
      set: null
    });
    const cloud = fakeCloud(SEED, 'gm2');
    const { app } = started(cloud, '#/p/set-twocards');
    await flush();
    expect(await app.loadPrintSet('set-twocards')).toEqual({
      ok: true,
      set: { rows: [{ id: 'ci1' }, { id: 'q1' }], missing: 0 }
    });
    expect(await app.loadPrintSet('set-expired1')).toEqual({ ok: true, set: null });
    cloud.setOffline(true);
    expect(await app.loadPrintSet('set-twocards')).toEqual({ ok: false });
    app.stop();
  });
});

describe("another tab's settings", () => {
  const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
  const WARN_KEY = 'dhloot.warn.v1';
  const PREFS_KEY = 'dhloot.prefs.v1';

  const signedOut = (cloud: CloudPort | null) => {
    const storage = memoryStorage();
    const app = new AppState(at('#/roll/std', { storage, cloud }));
    app.start();
    return { app, storage };
  };

  it.each([
    ['with no cloud', null],
    ['with a cloud, signed out', 'cloud']
  ] as const)('follows the language, start, warning and display defaults %s', async (_, c) => {
    const { app, storage } = signedOut(c === null ? null : fakeCloud(SEED));
    await flush();
    app.showPrintBW(true);
    storage.set(LANG_KEY, 'en');
    storage.fireExternalChange(LANG_KEY);
    expect(app.lang).toBe('en');
    storage.set(HOME_KEY, '#/tables/other_frames');
    storage.fireExternalChange(HOME_KEY);
    expect(app.home).toBe('#/tables/other_frames');
    storage.set(WARN_KEY, '1');
    storage.fireExternalChange(WARN_KEY);
    expect(app.warnHidden).toBe(true);
    storage.set(PREFS_KEY, '{"view":"grid","printBw":false,"printCompact":true}');
    storage.fireExternalChange(null);
    expect([app.tablesView, app.printBW, app.printCompact]).toEqual(['grid', false, true]);
    /* A page's own pick stays: only the default moved. */
    expect(app.shownPrintBW).toBe(true);
    app.stop();
  });

  it('falls back on a bad value and writes nothing back', () => {
    const { app, storage } = signedOut(null);
    const set = vi.spyOn(storage, 'set');
    storage.set(LANG_KEY, 'de');
    storage.set(HOME_KEY, '#/i/ci1');
    storage.set(PREFS_KEY, '{not');
    set.mockClear();
    storage.fireExternalChange(LANG_KEY);
    expect([app.lang, app.home, app.tablesView]).toEqual(['ru', '#/roll/std', 'list']);
    expect(set).not.toHaveBeenCalled();
    app.stop();
  });

  it('ignores another key, and follows nothing signed in', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const storage = memoryStorage();
    const app = new AppState(at('#/roll/std', { storage, cloud }));
    app.start();
    await flush();
    expect(app.user).not.toBeNull();
    const lang = app.lang;
    storage.set(LANG_KEY, lang === 'ru' ? 'en' : 'ru');
    storage.fireExternalChange(LANG_KEY);
    expect(app.lang).toBe(lang);
    app.stop();
    const out = signedOut(null);
    out.storage.set(LANG_KEY, 'en');
    out.storage.fireExternalChange('dhloot.lists.v2');
    expect(out.app.lang).toBe('ru');
    out.app.stop();
  });

  it('stops following once stopped', () => {
    const { app, storage } = signedOut(null);
    app.stop();
    storage.set(LANG_KEY, 'en');
    storage.fireExternalChange(LANG_KEY);
    expect(app.lang).toBe('ru');
  });
});

describe('ownKeyFor', () => {
  const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
  const AXE = 'hb_emberaxeaaaaaaaa';
  const NONE = 'hb_nosuchitemaaaaaa';

  it('answers the same keys from its memo and follows an items change and a user switch', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const app = new AppState(at('#/homebrew', { storage: memoryStorage(), cloud }));
    app.start();
    await flush();
    const gm2 = SEED.users.gm2.id;
    expect(app.ownKeyFor(AXE)).toBe(derivedKey(gm2, AXE));
    expect(app.ownKeyFor(AXE)).toBe(derivedKey(gm2, AXE));
    expect(app.ownKeyFor('ci1')).toBe('ci1');
    const store = app.homebrew;
    if (!store) throw new Error('no homebrew store');
    const ids = { id: store.newIds().id, key: AXE };
    expect(await store.createItem(ids, null, { kind: 'item', ru: 'Свой топор' })).toEqual({
      ok: true
    });
    expect(app.ownKeyFor(AXE)).toBe(AXE);
    expect(app.ownKeyFor(NONE)).toBe(derivedKey(gm2, NONE));
    await cloud.auth.signOut();
    await cloud.auth.signIn('google');
    await flush();
    const now = app.user?.userId;
    expect(now).not.toBe(gm2);
    expect(app.ownKeyFor(NONE)).toBe(derivedKey(now as string, NONE));
    app.stop();
  });
});
