/* The shared state, on its own.
 *
 * `shell.test.ts` reaches this class through what the frame draws, which covers
 * the language and the lit tab and nothing else. The rest of it - which address
 * may be pinned, what a refused write does, what an old section name sets - was
 * read off the live app rather than invented, and no component asks for it yet.
 * It is tested here directly rather than left dark until a screen needs it,
 * because those are the rules that would be re-derived, differently, by whoever
 * writes that screen. */

import { describe, expect, it } from 'vitest';
import { brokenStorage, fakeEnv, memoryRouter, memoryStorage } from '../ports/index.js';
import type { Env } from '../ports/index.js';
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
      '#/print/w1,w2',
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
});

describe('the address on the way in', () => {
  it('opens the pinned section when there is no address', () => {
    for (const empty of ['', '#', '#/']) {
      const env = at(empty, { storage: stored({ [HOME_KEY]: '#/roll/wondrous' }) });
      const app = new AppState(env);
      expect(app.hash, empty).toBe('#/roll/wondrous');
    }
  });

  it('rewrites the address rather than pushing, so back still leaves', () => {
    const router = memoryRouter('');
    new AppState(fakeEnv({ router, storage: stored({ [HOME_KEY]: '#/roll/dread' }) }));
    expect(router.stack).toEqual(['#/roll/dread']);
    expect(router.canGoBack()).toBe(false);
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
  it('pins the current address and reports itself pinned', () => {
    const app = new AppState(at('#/roll/wondrous'));
    expect(app.isHome).toBe(false);
    expect(app.toggleHome()).toBe(true);
    expect(app.home).toBe('#/roll/wondrous');
    expect(app.isHome).toBe(true);
  });

  it('unpins back to the default, not to nothing', () => {
    const env = at('#/roll/wondrous', { storage: stored({ [HOME_KEY]: '#/roll/wondrous' }) });
    const app = new AppState(env);
    expect(app.isHome).toBe(true);
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

  it('offers the pin only where it can be honoured', () => {
    expect(new AppState(at('#/roll/std')).canPinHome).toBe(true);
    expect(new AppState(at('#/tables/eq_weapon')).canPinHome).toBe(true);
    /* A name outside TABLE_IDS leaves the table unset, so there is nothing
       specific to pin - the bare tables address is the same case. */
    expect(new AppState(at('#/tables')).canPinHome).toBe(false);
    expect(new AppState(at('#/tables/weapons')).canPinHome).toBe(false);
    expect(new AppState(at('#/i/w12')).canPinHome).toBe(false);
    /* The lists tab is a section like any other and may be pinned; a single
       stored list, below it, may not. */
    expect(new AppState(at('#/lists')).canPinHome).toBe(true);
    expect(new AppState(at('#/lists/abc')).canPinHome).toBe(false);
  });

  it('writes the language through to storage', () => {
    const env = at('#/roll/std');
    const app = new AppState(env);
    app.setLang('en');
    expect(env.storage.get(LANG_KEY)).toBe('en');
  });
});

describe('which tab is lit', () => {
  it('lights the section a route belongs to', () => {
    /* A section id carries its prefix - see SECTIONS in lib/types.ts */
    expect(new AppState(at('#/roll/dread')).section).toBe('roll/dread');
    expect(new AppState(at('#/tables/eq_weapon')).section).toBe('tables');
    expect(new AppState(at('#/lists/abc')).section).toBe('lists');
    expect(new AppState(at('#/l/eyJ')).section).toBe('lists');
  });

  it('lights nothing on a record or a print sheet', () => {
    expect(new AppState(at('#/i/w12')).section).toBe(null);
    expect(new AppState(at('#/print/w1,w2')).section).toBe(null);
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
