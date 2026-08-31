/* The state the whole app shares, and nothing else.
 *
 * docs/specs/STATE.md draws the line: how a page looks is remembered, what was
 * asked on it is not. So the language and the starting section live here and go
 * to storage; a roll, a search or a ticked row do not - they belong to the
 * component that owns them, and they start over on reload on purpose. A filter
 * carried in from yesterday is a state nobody remembers, and the page just
 * looks broken.
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

const LANG_KEY = 'dhloot.lang.v1';
const HOME_KEY = 'dhloot.home.v1';

const DEFAULT_HOME = '#/roll/std';

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

  #home = $state(DEFAULT_HOME);
  #stopRouter: (() => void) | null = null;

  constructor(env: Env) {
    this.env = env;
    const loot = env.data.load();
    this.index = loot ? buildIndex(loot) : null;
    this.lang = readLang(env);
    this.#home = readHome(env);

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
      this.#applySource();
    });
    return () => {
      this.stop();
    };
  }

  stop(): void {
    this.#stopRouter?.();
    this.#stopRouter = null;
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
