/* The state the whole app shares, and nothing else.
 *
 * docs/specs/STATE.md draws the line: how a page looks is remembered, what was
 * asked on it is not. So the language and the starting section live here and go
 * to storage; a roll or a search do not - they belong to the component that
 * owns them, and start over on reload on purpose. A ticked row is shared
 * instead, memory-only like the rest: the selection bar it raises is drawn by
 * the frame, not by the page, so it lives here for the same reason `menuFor`
 * does, and it still starts over on reload. A filter carried in from
 * yesterday is a state nobody remembers, and the page just looks broken.
 *
 * Everything outside arrives as an `Env`. That is what makes this testable and
 * what stops a component reaching past it. */

import { SvelteSet } from 'svelte/reactivity';
import { buildIndex, type Index } from '../lib/data.js';
import { dict, type Dict } from '../lib/dict.js';
import {
  appUrl,
  legacySource,
  parseHash,
  recordUrl,
  type Route,
  type Site
} from '../lib/hash.js';
import type { Lang, Section } from '../lib/types.js';
import type { Env } from '../ports/index.js';
import { ListStore } from './lists.svelte.js';

const LANG_KEY = 'dhloot.lang.v1';
const HOME_KEY = 'dhloot.home.v1';

const DEFAULT_HOME = '#/roll/std';

/** What one action can undo, carried on a toast for the 7000ms it lasts. */
export interface ToastAction {
  label: string;
  run: () => void;
}

/** Off `showToast` in app.js: a plain notice, an error (`role=alert`), or one
 *  with an undo action - each its own duration, decided by `say` below. */
export interface Toast {
  msg: string;
  mode: '' | 'err' | 'act';
  action?: ToastAction | undefined;
}

/** Settings are read as untrusted data: a bad value falls back, quietly. */
function readLang(env: Env): Lang {
  const v = env.storage.get(LANG_KEY);
  return v === 'ru' || v === 'en' ? v : 'ru';
}

function readHome(env: Env): string {
  const v = env.storage.get(HOME_KEY);
  /* A pinned section has to still be a section. A record or a list is refused
     because it is a snapshot that drifts away from the data. */
  if (!v) return DEFAULT_HOME;
  const r = parseHash(v);
  return r.kind === 'section' || (r.kind === 'tables' && r.table) ? v : DEFAULT_HOME;
}

export class AppState {
  readonly env: Env;

  /**
   * The catalogue, or null if `data.js` did not load.
   *
   * Built once: it is a few thousand records and nothing about it changes while
   * the page is open. Null is a state the interface has to render, not a crash -
   * see docs/specs/FEATURES.md, "Records".
   */
  readonly index: Index | null;

  lang = $state<Lang>('ru');
  hash = $state('');
  /** Which sources the Core roll draws from. An old section name sets it. */
  source = $state<{ core: boolean; hnf: boolean }>({ core: true, hnf: true });

  /**
   * How many times somebody has actually gone somewhere, as opposed to the
   * address being rewritten under them.
   *
   * `go()` counts; `replace()` does not, the same way the live app's
   * `hashchange` listener does not fire on a `replaceState`. A component that
   * has to forget something on navigation - the tables selection, an open
   * modal - watches this rather than `hash`, because a filter pick rewrites
   * the hash without being a navigation.
   */
  navigations = $state(0);

  /** The lists a person has made, and how they are saved. */
  readonly lists: ListStore;

  /**
   * Which opener's add-to-list menu is open, app-wide - a record id on a
   * card, or an id the bar and the shared page will use once they exist.
   * One at a time, the way `S.menuFor` is: opening one closes any other.
   */
  menuFor = $state('');

  /**
   * The ids ticked on the current page, app-wide - a table's rows today,
   * search's rows once that slice exists. It lives here rather than on the
   * page component because the selection bar is drawn by the frame, not by
   * the page: `Shell.svelte` renders it for whichever screen is current.
   *
   * Memory only, cleared on a real navigation and left alone by `replace()` -
   * the same rule `menuFor` follows and the live app's own `hashchange`
   * listener (`S.sel = {}`). A filter pick or a search keystroke does not
   * touch it; a route change does, because a selection belongs to the page it
   * was made on, not to whatever page loads next.
   */
  readonly sel = new SvelteSet<string>();

  /** What the toast is showing, or nothing. `Shell.svelte` renders it. */
  toast = $state<Toast | null>(null);
  #toastTimer: ReturnType<typeof setTimeout> | null = null;

  #home = $state(DEFAULT_HOME);
  #stopRouter: (() => void) | null = null;
  #stopListWatch: (() => void) | null = null;

  constructor(env: Env) {
    this.env = env;
    const loot = env.data.load();
    this.index = loot ? buildIndex(loot) : null;
    this.lang = readLang(env);
    this.#home = readHome(env);
    this.lists = new ListStore(
      env,
      (msg, error) => {
        this.say(msg, { error });
      },
      () => this.t
    );

    /* An empty address opens the pinned section - but only an empty one. A link
       to a record or a shared list must not be overridden by a preference. */
    const first = env.router.hash();
    this.hash = first === '' || first === '#' || first === '#/' ? this.#home : first;
    if (this.hash !== first) env.router.replace(this.hash);
    this.#applySource();
  }

  /** Starts listening. Returns a stop, so a test does not leak a listener. */
  start(): () => void {
    this.#stopRouter = this.env.router.onChange((h) => {
      this.hash = h;
      this.navigations++;
      this.menuFor = '';
      this.sel.clear();
      this.#applySource();
    });
    this.#stopListWatch = this.lists.watch();
    return () => {
      this.stop();
    };
  }

  stop(): void {
    this.#stopRouter?.();
    this.#stopRouter = null;
    this.#stopListWatch?.();
    this.#stopListWatch = null;
  }

  /**
   * Says something with no place on screen - a toast, off `showToast` in
   * app.js. Plain notices last 1600ms, an error 2600ms and `role="alert"`,
   * and one with an action 7000ms. A second call replaces the first and
   * restarts the clock, the same as the live app's single timer.
   */
  say(
    msg: string,
    opts: { error?: boolean | undefined; action?: ToastAction | undefined } = {}
  ): void {
    const mode: Toast['mode'] = opts.action ? 'act' : opts.error ? 'err' : '';
    const ms = opts.action ? 7000 : opts.error ? 2600 : 1600;
    this.toast = { msg, mode, action: opts.action };
    if (this.#toastTimer) clearTimeout(this.#toastTimer);
    this.#toastTimer = setTimeout(() => {
      this.hideToast();
    }, ms);
  }

  hideToast(): void {
    this.toast = null;
    if (this.#toastTimer) {
      clearTimeout(this.#toastTimer);
      this.#toastTimer = null;
    }
  }

  #applySource(): void {
    const legacy = legacySource(this.hash);
    if (legacy) this.source = legacy;
  }

  /** Where this page is, as the link builders in lib/hash.ts want it. */
  get site(): Site {
    return { base: this.env.router.base(), hosted: this.env.router.hosted() };
  }

  /** The app's own address, for a link to a section or a filtered table. */
  linkTo(hash: string): string {
    return appUrl(this.site, hash);
  }

  /** A record's address, which on a host is its stub page rather than the app. */
  linkToRecord(id: string): string {
    return recordUrl(this.site, id);
  }

  /* Art that failed to load, remembered for the session only: a missing file
     stays missing while the page is open, and is worth retrying on the next
     visit in case it was a bad connection rather than a bad deploy. */
  readonly #brokenArt = new SvelteSet<string>();

  artBroken(id: string): boolean {
    return this.#brokenArt.has(id);
  }

  markArtBroken(id: string): void {
    this.#brokenArt.add(id);
  }

  get t(): Dict {
    return dict(this.lang);
  }

  get route(): Route {
    return parseHash(this.hash);
  }

  /** Which tab is lit. Nothing is lit on a record, a list or a print sheet. */
  get section(): Section | null {
    const r = this.route;
    if (r.kind === 'section') return r.section;
    if (r.kind === 'tables') return 'tables';
    if (r.kind === 'storedList' || r.kind === 'sharedList') return 'lists';
    return null;
  }

  setLang(lang: Lang): void {
    this.lang = lang;
    this.env.storage.set(LANG_KEY, lang);
  }

  go(hash: string): void {
    this.env.router.navigate(hash);
    this.hash = hash;
    this.navigations++;
    this.menuFor = '';
    this.sel.clear();
    this.#applySource();
  }

  /** Clears the selection and folds its menu - the live `clearSel` action. */
  clearSel(): void {
    this.sel.clear();
    this.menuFor = '';
  }

  /**
   * Rewrites the address in place - a filter pick, not a step. Keeps `hash` in
   * step with what `replaceState` just wrote, the way `go()` does for
   * `navigate`, but adds no history entry and does not count as a navigation:
   * see `navigations` above.
   */
  replace(hash: string): void {
    this.env.router.replace(hash);
    this.hash = hash;
    this.#applySource();
  }

  get home(): string {
    return this.#home;
  }

  /** Whether the address on screen is the pinned one - the button reads off this. */
  get isHome(): boolean {
    return this.#home === this.hash;
  }

  /** Pins the current address, or unpins it if it is already pinned. */
  toggleHome(): boolean {
    const next = this.isHome ? '' : this.hash;
    if (next) {
      if (!this.env.storage.set(HOME_KEY, next)) return false;
      this.#home = next;
    } else {
      this.env.storage.remove(HOME_KEY);
      this.#home = DEFAULT_HOME;
    }
    return true;
  }

  /** Only a section or a named table may be pinned, so the button hides elsewhere. */
  get canPinHome(): boolean {
    const r = this.route;
    return r.kind === 'section' || (r.kind === 'tables' && !!r.table);
  }
}
