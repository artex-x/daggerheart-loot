/* The state the whole app shares, and nothing else.
 *
 * docs/specs/STATE.md draws the line: how a page looks is remembered, what was
 * asked on it is not. So the language and the starting section live here and go
 * to storage; a roll's or a search's own query does not - it belongs to the
 * component that owns it, and starts over on reload on purpose. The kind
 * filter is the one piece of asked-for state the live app shares across
 * pages - Core rules, the alternate tables and search all narrow by the same
 * `S.kind` - so it lives here instead, memory-only and untouched by
 * navigation. A ticked row is shared the same way: the selection bar it
 * raises is drawn by the frame, not by the page, so it lives here for the
 * same reason `menuFor` does, and it still starts over on reload. A filter
 * carried in from yesterday is a state nobody remembers, and the page just
 * looks broken.
 *
 * Everything outside arrives as an `Env`. That is what makes this testable and
 * what stops a component reaching past it. */

import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import {
  bundleFileName,
  bundleText,
  dataFileName,
  FILE_MAX_BYTES,
  importPlan,
  overBounds,
  toBundle,
  withCopies,
  type Bundle,
  type ImportList,
  type ImportPlan,
  type PlanAccount
} from '../lib/bundle.js';
import {
  entrySource,
  isCloudId,
  limitText,
  linkedOf,
  snapshotRecords,
  type CloudList,
  type SharedList
} from '../lib/cloudLists.js';
import { isArtName, isOwnArt } from '../lib/art.js';
import { buildIndex, type Index } from '../lib/data.js';
import { dict, type Dict, type Msg } from '../lib/dict.js';
import {
  appUrl,
  canonicalHash,
  cardVersion,
  HOMEBREW_HASH,
  homebrewItemHash,
  itemHash,
  keepsTicks,
  legacySource,
  parseHash,
  previewUrl,
  printSetHash,
  PRINT_MAX,
  recordUrl,
  sectionHash,
  storedListHash,
  stripHash,
  type Route,
  type Site
} from '../lib/hash.js';
import {
  browseIndex,
  copyRows,
  isHomebrewKey,
  isHomebrewRecord,
  ownKeyFor,
  withRecords,
  type HomebrewRecord
} from '../lib/homebrew.js';
import { fewNames, nameOf } from '../lib/i18n.js';
import { plural } from '../lib/plural.js';
import { LIST_PAGE } from '../lib/lists.js';
import type { Subset } from '../lib/homebrewFile.js';
import type { PendingAction, SignInAfter } from '../lib/pending.js';
import { readPrefs, type NotifyGm, type Prefs } from '../lib/prefs.js';
import {
  printSetEntries,
  readPrintSet,
  type PrintSetEntry,
  type PrintSetRow
} from '../lib/printSet.js';
import { isLastOn, type Chosen } from '../lib/std.js';
import type { Kind, Lang, Record_, Section } from '../lib/types.js';
import type {
  AuthResult,
  Env,
  ListWrite,
  PrintSetMade,
  Provider,
  Session
} from '../ports/index.js';
import { CloudLists } from './cloudLists.svelte.js';
import { Homebrew } from './homebrew.svelte.js';
import { ItemView } from './itemView.svelte.js';
import { OwnerRequests } from './ownerRequests.svelte.js';
import { RequestSender } from './requestSender.svelte.js';
import { SharedView } from './sharedView.svelte.js';

const LANG_KEY = 'dhloot.lang.v1';
const HOME_KEY = 'dhloot.home.v1';
const PREFS_KEY = 'dhloot.prefs.v1';
/* The settings a signed-out tab follows when another tab writes them (docs/specs/STATE.md). */
const SETTINGS_KEYS: readonly string[] = [LANG_KEY, HOME_KEY, PREFS_KEY];

const DEFAULT_HOME = '#/roll/std';

/** How often the index, an account list page and a share page re-read the account's
 *  lists, and the relative times move. */
export const LIST_POLL_MS = 45_000;

/** The longest a sign-out waits for the account's buffered writes: a write that
 *  hangs must never keep a reader signed in. */
export const SIGN_OUT_WAIT_MS = 5_000;

/** What `dhloot.prefs.v1` holds, whole: the tables view and the print
 *  layout (docs/specs/STATE.md). */
interface LocalPrefs {
  view: 'list' | 'grid';
  printBw: boolean;
  printCompact: boolean;
}

/** Read as untrusted data, the same as every other stored setting: a bad or
 *  missing field falls back to its default rather than breaking the page, and
 *  live's old `{ view }` shape still reads. */
function readLocalPrefs(env: Env): LocalPrefs {
  let p: Prefs = {};
  const raw = env.storage.get(PREFS_KEY);
  try {
    if (raw) p = readPrefs(JSON.parse(raw));
  } catch {
    /* broken JSON: the defaults */
  }
  return {
    view: p.view ?? 'list',
    printBw: p.printBw ?? false,
    printCompact: p.printCompact ?? false
  };
}

/** What a toast offers for the 7000ms it lasts: an undo (`run`) or a link to
 *  a page opened in a new tab (`href`). The label is built in the language on
 *  screen each time it is drawn. */
export type ToastAction = { label: Msg; run: () => void } | { label: Msg; href: string };

/** Off `showToast` in app.js: a plain notice, an error (`role=alert`), or one
 *  with an action - each its own duration, decided by `say` below. */
export interface Toast {
  msg: string;
  mode: '' | 'err' | 'act';
  action?: { label: string; run?: () => void; href?: string } | undefined;
}

/* What `say` was given: the toast before it is drawn in a language. */
interface Said {
  msg: Msg;
  mode: Toast['mode'];
  action?: ToastAction | undefined;
}

/** Settings are read as untrusted data: a bad value falls back, quietly. */
function readLang(env: Env): Lang {
  const v = env.storage.get(LANG_KEY);
  return v === 'ru' || v === 'en' ? v : 'ru';
}

/** The pin an address makes, or null when a pin may not hold it. */
function pinOf(v: string): string | null {
  /* A pinned section has to still be a section. A record or a list is refused
     because it is a snapshot that drifts away from the data. A named table
     survives the same way; a bare `#/tables` is accepted too - live's own
     `homeAllows` (`git show 23c00a6^:app.js`) keeps that shape, for a pin written
     before this fix as much as one typed by hand - but a name outside
     TABLE_IDS is not, because there is nothing specific behind it to reopen.
     `parseHash` cannot tell "no name" from "a name it did not recognise"
     (both come back `table: null`), so the bare case is read off the string
     itself rather than off the route. «Мои предметы» is pinned by `#/homebrew` alone, one
     pin for every tab; like `#/tables/homebrew`, a build with no sign-in draws it as not
     found, address kept (docs/specs/FEATURES.md, "Homebrew"). */
  if (v === '#/tables/frames') return '#/tables/other_frames';
  if (v === HOMEBREW_HASH) return v;
  /* A pin of a renamed id reads as its slug; `#applyPrefs` then stores the slug
     (docs/specs/STATE.md). */
  const c = canonicalHash(v);
  const r = parseHash(c);
  if (r.kind === 'section') return c;
  if (r.kind === 'tables' && (r.table || stripHash(c) === 'tables')) return c;
  return null;
}

/** The starting section a stored value names, the default for nothing or a
 *  refused value. */
function homeOf(v: string | null): string {
  return (v && pinOf(v)) || DEFAULT_HOME;
}

export class AppState {
  readonly env: Env;

  /**
   * The catalogue, or null if `data.js` did not load.
   *
   * Built once: it is a few thousand records and nothing about it changes while
   * the page is open. Null is a state the interface has to render, not a crash -
   * see docs/specs/FEATURES.md, "Records". A lists file reads it alone: it holds
   * catalog ids only.
   */
  readonly catalog: Index | null;

  /** The signed-in author's homebrew; null with no sign-in configured. */
  readonly homebrew: Homebrew | null;

  /** The catalogue with the signed-in author's own items and own cards, which also apply
   *  to the catalog records they name in `items`: what every page that draws records
   *  reads. The catalogue object itself while the account holds neither. */
  index: Index | null = $derived.by(() => {
    const own = this.homebrew?.records ?? [];
    const cards = this.homebrew?.cardRefs ?? [];
    return this.catalog && (own.length || cards.length)
      ? withRecords(this.catalog, own, [], cards)
      : this.catalog;
  });

  /**
   * The «Свои предметы» switch on search and the equipment tables: whether their row pools hold
   * the own items. Memory only, kept across pages like `kinds`, on again at each sign-in
   * (docs/specs/STATE.md).
   */
  homebrewShown = $state(true);

  /** The index search and the equipment tables read their rows and facets from: `index`
   *  without the own items in `searchable` and `allEquip` while the switch is off. */
  browse: Index | null = $derived.by(() =>
    this.index && this.catalog
      ? browseIndex(this.index, this.catalog, this.homebrewShown)
      : this.index
  );

  lang = $state<Lang>('ru');
  /**
   * The address as the app reads it - not always what is in the bar. Live
   * keeps the two independent the same way: `currentRoute` (app.js
   * 3638-3647) returns a route that need not equal `location.hash`. A bare
   * or unreadable address can draw a section while the bar is left as it
   * was, rewritten, or a step behind - see `#fallback`, the constructor, and
   * `docs/specs/ROUTES.md`, "Fallback".
   */
  hash = $state('');
  /** Which sources the Core roll draws from. An old section name sets it. */
  source = $state<{ core: boolean; hnf: boolean }>({ core: true, hnf: true });

  /**
   * Which kinds a page's rows are narrowed to - the live `S.kind` (app.js
   * 60): one object shared by Core rules, the alternate tables and search,
   * never written to storage and left alone by `go()`, `onChange` and
   * `replace()` the way the live `hashchange` listener leaves it - a person
   * who switches consumables off on one screen expects them still off on
   * the next.
   */
  kinds = $state<Chosen<Kind>>({ item: true, consumable: true, equip: true });

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

  /** The signed-in owner's account lists; null in a build with no sign-in configured. */
  readonly cloudLists: CloudLists | null;
  /** The list behind the open share link; null in a build with no sign-in configured. */
  readonly sharedView: SharedView | null;
  /** The homebrew item behind the open `#/h/`; null in a build with no sign-in configured. */
  readonly itemView: ItemView | null;
  /** The signed-in owner's purchase requests; null with no sign-in configured. */
  readonly ownerRequests: OwnerRequests | null;
  /** A share page reader's purchase request; null with no sign-in configured. */
  readonly requestSender: RequestSender | null;
  /** The clock the relative times read: moved every 45 s and when the tab is shown again. */
  now = $state(Date.now());
  /** True while «Сохранить себе» copies a share link's list. */
  cloning = $state(false);
  /** The id of the homebrew item or catalog record «Сохранить себе» copies now, or null. */
  savingItem = $state<string | null>(null);
  /** The id of the homebrew item or catalog record a sign-in left to copy, until its pick
   *  row makes the copy once the account's items are read; forgotten with the pending action
   *  (docs/specs/STATE.md, "Session"). */
  saveItemFor = $state<string | null>(null);
  /** True while a print control makes a print set. */
  printing = $state(false);
  /**
   * Where a sign-in prompt's «Войти» came from and what it started - kept
   * while the reader is on `#/account`, handed to the provider redirect by
   * `signIn`, and forgotten on any navigation to another page
   * (docs/specs/STATE.md, "Session"). Raw: it crosses into sessionStorage.
   */
  signInFor = $state.raw<SignInAfter | null>(null);
  /* The action a sign-in finishes once the account's lists are read. A
     navigation or a sign-out forgets it, so it never runs on another page
     or for the next user. */
  #pending: PendingAction | null = null;
  #listPoll: ReturnType<typeof setInterval> | null = null;
  /* The one page with unsaved edits asks before any navigation leaves it. */
  #leaveCheck: (() => boolean) | null = null;
  /* `ownKeyFor`'s answers, for the user and the own items array they were made for. */
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a memo, never drawn
  #keyMemo = new Map<string, string>();
  #keyMemoUser: string | null = null;
  #keyMemoItems: readonly unknown[] | null = null;
  /* `<userId>\n<ref>` to the key of that user's last «Сохранить себе» of that source whose
     answer was lost; memory only, so a key never reaches another account. */
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- never drawn
  #copyRetry = new Map<string, string>();

  /**
   * Which opener's add-to-list menu is open, app-wide - a record id on a
   * card, or an id the bar and the shared page will use once they exist.
   * One at a time, the way `S.menuFor` is: opening one closes any other.
   */
  menuFor = $state('');

  /**
   * The ids ticked on the current page, app-wide - a table's rows, and
   * search's rows. It lives here rather than on the
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

  /**
   * The count a person narrowed a ticked shared-list entry to - a taken
   * count (docs/specs/FEATURES.md, "Lists"). An id with no count here takes
   * its whole stock. Memory only, and cleared with `sel`: a count never
   * outlives the tick it belongs to.
   */
  readonly picked = new SvelteMap<string, number>();

  /** Sets the taken count of one ticked entry. */
  pick(id: string, n: number): void {
    this.picked.set(id, n);
  }

  /* An unanswered "notify the owner?" question belongs to the ticks it asks about. */
  #clearTicks(): void {
    this.sel.clear();
    this.picked.clear();
    this.requestSender?.dismiss();
  }

  /* The «Мои предметы» tabs and the source chips keep the ticks (`keepsTicks`). */
  #clearTicksOnLeave(from: Route): void {
    if (!keepsTicks(from, this.route)) this.#clearTicks();
  }

  /**
   * "Select all" for whatever ids are on screen - always all of one list: the
   * whole table for a plain body, one section's own rows where the body is
   * split, or a shared list's own rows. Ticks every id if any of them is not
   * already ticked, unticks them otherwise. `TablesPage` and `SearchPage`
   * each carried an identical copy of this; moved here once `SharedListPage`
   * became a third caller, rather than adding a fourth.
   */
  toggleAllIn(ids: readonly string[]): void {
    const on = ids.some((id) => !this.sel.has(id));
    for (const id of ids) {
      if (on) this.sel.add(id);
      else {
        this.sel.delete(id);
        this.picked.delete(id);
      }
    }
  }

  /**
   * What the open shared page shows - the live `S.shared` (`git show 23c00a6^:app.js`,
   * 3140-3141). Set by `SharedListPage` while mounted, null on every other
   * page: the route gate is done here by mount. Every add-to-list menu on the shared page - the bar's, a
   * card's - reads this to copy the entry's qty, price and players' note along.
   */
  shared = $state<SharedList | null>(null);

  #said = $state.raw<Said | null>(null);
  /** What the toast is showing, or nothing, in the language on screen: a
   *  language switch redraws it and leaves its clock alone. `Shell.svelte`
   *  renders it. */
  toast: Toast | null = $derived.by(() => {
    const s = this.#said;
    if (!s) return null;
    const t = this.t;
    const lang = this.lang;
    return {
      msg: s.msg(t, lang),
      mode: s.mode,
      action:
        s.action &&
        ('run' in s.action
          ? { label: s.action.label(t, lang), run: s.action.run }
          : { label: s.action.label(t, lang), href: s.action.href })
    };
  });
  /** True while `RecordModal`'s modal dialog is open, set after its
   *  `showModal()`; the toast is drawn inside the dialog then
   *  (`Toast.svelte`). `RecordModal` is the only writer. */
  dialogOpen = $state(false);
  #toastTimer: ReturnType<typeof setTimeout> | null = null;
  /* An action toast's deadline while it runs, and its time left while held. */
  #toastDue = 0;
  #toastLeft: number | null = null;
  /* A plain message said while an error or an action toast shows: it waits for that
     toast's end (owner, 2026-10-08). One waits; a newer plain message takes its place. */
  #waiting: Msg | null = null;

  #home = $state(DEFAULT_HOME);
  /** The default tables view, list or grid, set by the Display section and
   *  the account and stored in `dhloot.prefs.v1` (`STATE.md`, "Account
   *  preferences"). */
  #tablesView = $state<'list' | 'grid'>('list');
  /** The default print layout, colour or black-and-white and standard or
   *  compact, set by the Display section and the account and stored beside
   *  the tables view (docs/specs/FEATURES.md, "Print"). */
  #printBW = $state(false);
  #printCompact = $state(false);
  /** The value a page switch picked for this visit, `null` to follow the
   *  default; memory only, so a reload drops it (`STATE.md`, "The rule"). */
  #tablesViewNow = $state<'list' | 'grid' | null>(null);
  #printBWNow = $state<boolean | null>(null);
  #printCompactNow = $state<boolean | null>(null);
  /** The remembered answer to "notify the list owner?": in the account row
   *  only, so it starts at `ask` for every user and signed out. */
  #notifyGm = $state<NotifyGm>('ask');
  /** How many lists the index draws - kept for the session so a return from
   *  a list page shows the same cards; a reload starts at `LIST_PAGE`
   *  (`STATE.md`'s "Lists" group). */
  listsShown = $state(LIST_PAGE);
  /** Whether the footer offers the install guide: inside the installed app it
   *  is done (`FEATURES.md`, "Chrome"). */
  readonly showInstall: boolean;
  /**
   * Who is signed in: `undefined` until the cloud has answered, `null`
   * signed out, and `null` from the start in a build with no sign-in
   * configured (`env.cloud` null). The header draws its account control
   * only once this is known, so a signed-in reader never sees «Войти» flash.
   */
  user = $state<Session | null | undefined>(undefined);
  /** The provider a link was refused for because its identity belongs to
   *  another account - drawn in that provider's row on `#/account` until
   *  the next account action there. */
  alreadyLinked = $state<Provider | null>(null);
  #stopRouter: (() => void) | null = null;
  #stopAuth: (() => void) | null = null;
  #stopHidden: (() => void) | null = null;
  #stopSettings: (() => void) | null = null;
  /* The account sync (docs/specs/STATE.md, "Account preferences"): whether
     `#watchAccount` is listening, the user whose row was last pulled, how
     many local edits there have been (a pull that sees it move drops its
     answer), whether the newest save was refused, the save in flight, and
     whether another was asked for meanwhile. */
  #watching = false;
  #prefsFor: string | null = null;
  #edits = 0;
  #stale = false;
  #saving: Promise<void> | null = null;
  #savePending = false;
  /** The hash `go()` itself just wrote, so the router's own change handler
   *  can tell "the app just navigated" apart from "the address changed
   *  underneath it" and not process the same navigation twice. Real
   *  browsers fire `hashchange` asynchronously, after `go()` has already
   *  returned, so this has to survive until then rather than being read and
   *  cleared inline. */
  #expectHash: string | null = null;

  constructor(env: Env) {
    this.env = env;
    const loot = env.data.load();
    this.catalog = loot ? buildIndex(loot) : null;
    this.lang = readLang(env);
    this.#home = homeOf(env.storage.get(HOME_KEY));
    const local = readLocalPrefs(env);
    this.#tablesView = local.view;
    this.#printBW = local.printBw;
    this.#printCompact = local.printCompact;
    if (!env.cloud) this.user = null;
    this.showInstall = !env.pwa.standalone();
    const say = (msg: Msg, error?: boolean): void => {
      this.say(msg, { error });
    };
    const cloud = env.cloud;
    this.homebrew = cloud
      ? new Homebrew(cloud.homebrew, {
          tab: () => cloud.events.tab,
          refreshLists: () => this.cloudLists?.refresh() ?? Promise.resolve()
        })
      : null;
    this.ownerRequests = cloud
      ? new OwnerRequests(cloud.requests, {
          flush: () => this.cloudLists?.flushNow() ?? Promise.resolve(true),
          refreshLists: () => this.cloudLists?.refresh() ?? Promise.resolve(),
          say,
          tab: () => cloud.events.tab
        })
      : null;
    this.cloudLists = cloud
      ? new CloudLists(
          cloud.lists,
          say,
          () => this.t,
          {
            events: cloud.events,
            random: env.random,
            requests: this.ownerRequests ?? undefined,
            homebrew: this.homebrew ?? undefined
          },
          (key) =>
            entrySource(
              key,
              {
                ready: this.homebrew?.status === 'ready',
                has: (k) => this.homebrew?.has(k) ?? false,
                hidOf: (k) => this.homebrew?.item(k)?.id ?? null
              },
              this.linkedRecord(key)
            )
        )
      : null;
    this.requestSender = cloud
      ? new RequestSender(cloud.requests, {
          newId: () => cloud.lists.newId(),
          say,
          reread: () => {
            void this.sharedView?.refresh();
          },
          notifyGm: () => this.notifyGm,
          setNotifyGm: (v) => {
            this.setNotifyGm(v);
          }
        })
      : null;
    this.sharedView = env.cloud
      ? new SharedView(env.cloud.shares, { events: env.cloud.events, random: env.random })
      : null;
    this.itemView = env.cloud ? new ItemView(env.cloud.lists, () => this.catalog) : null;

    /* A bare address opens the pinned section - but only at boot, and only a
       bare one: a link to a record or a shared list must not be overridden by
       a preference. Live's own boot check (`git show 23c00a6^:app.js`): an assignment,
       not a replaceState, so a non-default pin still pushes a history entry
       (Back leaves the bare address rather than returning to it); a default
       pin - nothing to add - writes nothing and leaves the bar bare. An
       unreadable address at boot is rule 2, below, same as on navigation. */
    const first = env.router.hash();
    if (first === '' || first === '#' || first === '#/') {
      this.hash = this.#home;
      if (this.#home !== DEFAULT_HOME) env.router.navigate(this.hash);
    } else {
      this.hash = this.#fallback(first);
    }
    this.#applySource();
  }

  /**
   * What a non-boot address resolves to, and what it does to the bar -
   * live's `currentRoute` fallback (`git show 23c00a6^:app.js`), reused by the
   * constructor for its own non-bare branch since an unreadable address is
   * answered the same way at boot or on navigation. A bare address here is
   * navigation's own rule, distinct from boot's above: it draws the default
   * section, never the pinned one, and touches nothing.
   */
  #fallback(h: string): string {
    if (h === '' || h === '#' || h === '#/') return DEFAULT_HOME;
    if (parseHash(h).kind !== 'unknown') return h;
    this.env.router.replace(this.#home);
    return this.#home;
  }

  /** Starts listening. Returns a stop, so a test does not leak a listener. */
  start(): () => void {
    this.#stopRouter = this.env.router.onChange((h) => {
      /* `go()` already did all of this synchronously for the hash it
         just wrote - a real browser's `hashchange` for that same write still
         fires, only asynchronously, and without this guard it was processed
         a second time, double-counting `navigations` for anyone who had
         called `start()`. */
      if (h === this.#expectHash) {
        this.#expectHash = null;
        return;
      }
      /* A refused leave puts the address back: the page with the edits stays. */
      if (h !== this.hash && !this.#mayLeave()) {
        this.env.router.replace(this.hash);
        return;
      }
      const from = this.route;
      this.hash = this.#fallback(h);
      this.#forgetSignIn();
      this.#forgetPending();
      this.navigations++;
      this.menuFor = '';
      this.#clearTicksOnLeave(from);
      this.#applySource();
    });
    this.#stopSettings = this.env.storage.onExternalChange((key) => {
      if (key === null || SETTINGS_KEYS.includes(key)) this.#followSettings();
    });
    this.#watchAccount();
    if (this.cloudLists) {
      this.#listPoll = setInterval(() => {
        this.#pollLists();
      }, LIST_POLL_MS);
      /* A hidden or closing tab sends the account's buffered writes at once. */
      this.#stopHidden = this.env.page.onHidden(() => {
        void this.cloudLists?.flushNow();
      });
    }
    return () => {
      this.stop();
    };
  }

  /* The session, and how a provider redirect that opened this page ended.
     A change notification always wins over the first `session()` answer,
     which may have been read before it. The storage port's `null` signal
     (shown again, a back-forward-cache restore) refetches the account's
     preferences, or saves them when the last save was refused. */
  #watchAccount(): void {
    const cloud = this.env.cloud;
    if (!cloud) return;
    let live = true;
    let notified = false;
    this.#watching = true;
    const off = cloud.auth.onChange((s) => {
      notified = true;
      this.#setUser(s);
    });
    const offShown = this.env.storage.onExternalChange((key) => {
      if (key !== null) return;
      this.now = Date.now();
      this.#refreshShared(true);
      if (this.route.kind === 'item') void this.itemView?.refresh();
      if (!this.user) return;
      if (this.#stale) this.#saveAccount();
      else void this.#pull();
      void this.cloudLists?.refresh().then(() => {
        this.#runPending();
      });
      void this.ownerRequests?.read();
      void this.homebrew?.read();
    });
    this.#stopAuth = () => {
      live = false;
      this.#watching = false;
      off();
      offShown();
    };
    void cloud.auth.session().then(
      (s) => {
        if (live && !notified) this.#setUser(s);
      },
      () => {
        if (live && !notified) this.#setUser(null);
      }
    );
    void cloud.auth.redirectResult().then((r) => {
      if (!live || !r) return;
      if (r.result.ok) {
        /* The real port has already put the address back to the prompt's page. */
        if (r.action) {
          this.#pending = r.action;
          this.#runPending();
        }
        return;
      }
      if (r.kind === 'link' && r.result.error === 'alreadyLinked' && r.provider) {
        this.alreadyLinked = r.provider;
      } else {
        this.say((t) => t.accountFailed, { error: true });
      }
    });
  }

  /* A new user pulls the account's preferences and lists; the same user
     again (a token refresh) pulls nothing. Signing out clears nothing local,
     but no account list stays on screen. */
  #setUser(s: Session | null): void {
    const was = this.#prefsFor;
    this.user = s;
    if (!s) {
      this.#prefsFor = null;
      this.#notifyGm = 'ask';
      if (was !== null) {
        this.#forgetPending();
        this.#listsSignedOut();
      }
      return;
    }
    if (s.userId === this.#prefsFor) return;
    this.#prefsFor = s.userId;
    this.#stale = false;
    /* One user's answer never seeds another's row. */
    this.#notifyGm = 'ask';
    /* One user's choice never hides another user's items. */
    this.homebrewShown = true;
    void this.#pull();
    const lists = this.cloudLists;
    if (lists) {
      lists.clear();
      this.ownerRequests?.clear();
      this.homebrew?.clear();
      void this.homebrew?.load();
      void lists.load().then(() => {
        /* The owner's topic from the first read until sign-out, on every route. */
        if (this.#prefsFor === s.userId) {
          lists.watch(s.userId);
          void this.ownerRequests?.read();
        }
        this.#runPending();
      });
    }
  }

  /** «Повторить» after a failed read of the account: reads again, then runs the action a
   *  sign-in left. */
  async retryLists(): Promise<void> {
    await this.cloudLists?.load();
    this.#runPending();
  }

  /** Downloads the account's lists as one lists file: every list, or the lists `ids` names,
   *  in the index's order. A file past the schema's bounds or the import's 5 MiB still
   *  downloads whole, and a toast says why it cannot be imported whole
   *  (docs/specs/FEATURES.md, "Account and browser lists"). The entries of the lists this
   *  tab has not read are read first; a failed read downloads nothing. */
  async exportLists(ids?: readonly string[]): Promise<void> {
    const store = this.cloudLists;
    if (!store) return;
    /* The ids are taken at the press: a list a re-read brings during the entries read has
       heads only, and the file is the account at the press. */
    const taken = ids ? [...ids] : store.lists.map((l) => l.id);
    const named = (): CloudList[] => store.lists.filter((l) => taken.includes(l.id));
    if (!this.#homebrewReady(named())) return;
    if (!(await store.detail(taken))) {
      this.say((t) => t.accountFailed, { error: true });
      return;
    }
    /* The read replaced the list objects. */
    const lists = named();
    const now = this.#exportedAt();
    const { b, skipped } = this.#bundle(lists, now);
    const bytes = new TextEncoder().encode(bundleText(b));
    try {
      await this.env.image.download(
        new Blob([bytes], { type: 'application/json' }),
        bundleFileName(lists, now)
      );
    } catch {
      this.say((t) => t.accountFailed, { error: true });
      return;
    }
    this.#warnBounds(b, skipped, bytes.length, 0);
  }

  /** Downloads «Скачать мои данные»: a store-only zip holding `lists.json`, the lists file
   *  of every account list, then `homebrew.json`, the account's whole homebrew file, when it
   *  holds a source, a card or an item (docs/specs/CONTRACTS.md section 4). */
  async exportData(): Promise<void> {
    const store = this.cloudLists;
    if (!store) return;
    if (!this.#homebrewReady(null)) return;
    /* As `exportLists`: the lists of the press, so none in the file has heads only. */
    const taken = store.lists.map((l) => l.id);
    if (!(await store.detail(taken))) {
      this.say((t) => t.accountFailed, { error: true });
      return;
    }
    const now = this.#exportedAt();
    const { b, skipped } = this.#bundle(
      store.lists.filter((l) => taken.includes(l.id)),
      now
    );
    const own = this.homebrew;
    const encode = (text: string): Uint8Array => new TextEncoder().encode(text);
    const listsBytes = encode(bundleText(b));
    let homebrewSize = 0;
    try {
      const { zipStored } = await import('../lib/zip.js');
      const files = [{ name: 'lists.json', bytes: listsBytes }];
      if (own && (own.books.length || own.cards.length || own.items.length)) {
        const f = await import('../lib/homebrewFile.js');
        const text = f.homebrewText(f.toHomebrewFile(own.books, own.items, own.cards, now));
        const homebrewBytes = encode(text);
        homebrewSize = homebrewBytes.length;
        files.push({ name: 'homebrew.json', bytes: homebrewBytes });
      }
      const bytes = zipStored(files, now);
      await this.env.image.download(
        new Blob([bytes], { type: 'application/zip' }),
        dataFileName(now)
      );
    } catch {
      this.say((t) => t.accountFailed, { error: true });
      return;
    }
    this.#warnBounds(b, skipped, listsBytes.length, homebrewSize);
  }

  /** Downloads a homebrew file: one source with its items and cards, or the ticked items
   *  (`subsetOf`). `name` is the source's name on screen, null for ticked items, which take
   *  a dated name (docs/specs/FEATURES.md, "Homebrew"). */
  async exportHomebrew(pick: Subset, name: string | null): Promise<void> {
    const own = this.homebrew;
    if (!own || !this.#homebrewReady(null)) return;
    const now = this.#exportedAt();
    try {
      const f = await import('../lib/homebrewFile.js');
      const rows = f.subsetOf(own, pick);
      const text = f.homebrewText(f.toHomebrewFile(rows.books, rows.items, rows.cards, now));
      await this.env.image.download(
        new Blob([text], { type: 'application/json' }),
        f.homebrewFileName(name, now)
      );
    } catch {
      this.say((t) => t.accountFailed, { error: true });
    }
  }

  /* A download that writes own items waits for the account's homebrew, so a file never
     silently lacks them: the zip and a homebrew file always, a lists file when one of its
     lists holds an own key. False after the toast. */
  #homebrewReady(lists: readonly CloudList[] | null): boolean {
    const own = this.homebrew;
    if (!own || own.status === 'ready') return true;
    if (lists && !lists.some((l) => l.ids.some(isHomebrewKey))) return true;
    this.say((t) => t.hbNotReady, { error: true });
    return false;
  }

  /* The export's moment: the test build's fixed clock names a known file. */
  #exportedAt(): Date {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a moment read once, never state
    return new Date(this.env.clock.now());
  }

  /* The lists file. A homebrew entry carries the snapshot of its live item: the own record
     of its key, else the linked record of another account's item; one with neither is left
     out and counted (docs/specs/CONTRACTS.md section 4). */
  #bundle(lists: readonly CloudList[], now: Date): { b: Bundle; skipped: number } {
    const byId = this.index?.byId;
    const own = this.homebrew;
    const { bundle: b, skipped } = toBundle(
      lists,
      (id) => {
        const it = byId?.get(id);
        return it ? nameOf(it, this.lang) : undefined;
      },
      this.t.untitled,
      now,
      (id, list) => own?.records.find((r) => r.id === id) ?? linkedOf(list)[id] ?? null
    );
    return { b, skipped };
  }

  /* Not an error: the file downloaded. `listsSize` and `homebrewSize` are the UTF-8 bytes of
     the lists file and of the zip's `homebrew.json` (0 when none), each read against the
     import's 5 MiB. */
  #warnBounds(b: Bundle, skipped: number, listsSize: number, homebrewSize: number): void {
    const { many, long } = overBounds(b);
    const big = listsSize > FILE_MAX_BYTES;
    const over = many || long.length > 0 || big;
    const homebrewBig = homebrewSize > FILE_MAX_BYTES;
    if (!over && !skipped && !homebrewBig) return;
    this.say((t, lang) =>
      [
        over ? t.exportOverBounds : '',
        big ? t.exportBig : '',
        many ? t.exportManyLists : '',
        long.length
          ? t.exportLongLists.replace(
              '%s',
              fewNames(
                long.map((n) => t.quoted.replace('%s', n)),
                t
              )
            )
          : '',
        homebrewBig ? t.exportHomebrewBig : '',
        skipped ? plural(skipped, t.exportHomebrewSkippedN, lang) : ''
      ]
        .filter(Boolean)
        .join(' ')
    );
  }

  #listsSignedOut(): void {
    this.cloudLists?.clear();
    this.ownerRequests?.clear();
    this.homebrew?.clear();
    const r = this.route;
    if (r.kind === 'storedList' && isCloudId(r.listId)) this.replace(sectionHash('lists'));
  }

  /* A share page re-reads its list, signed in or not; the poll only while its
     Realtime topic is not joined (`always` is the shown-again signal). */
  #refreshShared(always = false): void {
    const view = this.sharedView;
    if (this.route.kind === 'share' && (always || !view?.live)) void view?.refresh();
  }

  /* The index and an account list page re-read while they are on screen and the
     owner's topic is not joined; a failed first read is retried on every route.
     `#/h/` has no topic and re-reads on every tick, signed out too. */
  #pollLists(): void {
    this.now = Date.now();
    this.#refreshShared(false);
    if (this.route.kind === 'item') void this.itemView?.refresh();
    const lists = this.cloudLists;
    if (!lists || !this.user) return;
    const r = this.route;
    const shown =
      (r.kind === 'section' && r.section === 'lists') ||
      (r.kind === 'storedList' && lists.get(r.listId) !== undefined);
    const retry = lists.status === 'error';
    if ((shown && !lists.live) || retry) {
      void lists.refresh().then(() => {
        this.#runPending();
      });
    }
    if (shown && !lists.live) void this.ownerRequests?.read();
    const homebrew = this.homebrew;
    if (
      homebrew &&
      ((this.#ownItemsOnScreen() && !lists.live) || homebrew.status === 'error')
    ) {
      void homebrew.read();
    }
  }

  /* A page that draws own items: the homebrew pages, an own record and their table. */
  #ownItemsOnScreen(): boolean {
    const r = this.route;
    return (
      r.kind === 'homebrew' ||
      r.kind === 'homebrewItem' ||
      (r.kind === 'record' && isHomebrewKey(r.id)) ||
      (r.kind === 'tables' && r.table === 'homebrew')
    );
  }

  /**
   * Returns the record of another account's item that `key` names, with its `hid`: the open
   * share's first (the view holds a projection only while `#/s/` is on screen), then the
   * first one an account list links. Such a record is drawn only where a list carries it:
   * never in search, tables or `#/i/` (docs/specs/FEATURES.md, "Lists"). Reads no route:
   * `route` asks it.
   */
  linkedRecord(key: string): HomebrewRecord | undefined {
    if (!isHomebrewKey(key)) return undefined;
    const open = this.itemView?.record;
    if (open?.id === key) return open;
    const shown = snapshotRecords(this.sharedView?.shared).find((r) => r.id === key);
    if (shown) return shown;
    for (const l of this.cloudLists?.lists ?? []) {
      const linked = l.linked?.[key];
      if (linked) return linked;
    }
    return undefined;
  }

  /** Returns the record `id` names: the catalogue's or an own item, else another account's
   *  linked one. */
  recordFor(id: string): Record_ | undefined {
    return this.index?.byId.get(id) ?? this.linkedRecord(id);
  }

  /** Returns the record the page on screen draws for `id`: on `#/h/` the open item, on `#/s/`
   *  the share's, on an account list's page that list's linked record, else `recordFor`. A
   *  print press resolves by it, so an own item of a clashing key wins only where the page
   *  draws it (docs/specs/FEATURES.md, "Print"). Only a homebrew key can clash, so a
   *  catalogue id skips the share's snapshot. */
  pageRecordFor(id: string): Record_ | undefined {
    if (isHomebrewKey(id)) {
      const r = this.route;
      if (r.kind === 'item') {
        const open = this.itemView?.record;
        if (open?.id === id) return open;
      } else if (r.kind === 'share') {
        const shown = snapshotRecords(this.sharedView?.shared).find((x) => x.id === id);
        if (shown) return shown;
      } else if (r.kind === 'storedList') {
        const linked = this.cloudLists?.get(r.listId)?.linked?.[id];
        if (linked) return linked;
      }
    }
    return this.recordFor(id);
  }

  /** Returns whether `it` is another account's homebrew item: a record with an id that is not
   *  one of the reader's own items. Signed in, only once the own items are read. */
  isForeignItem(it: Record_): boolean {
    if (!isHomebrewRecord(it) || typeof it.hid !== 'string' || !this.homebrew) return false;
    if (this.user === null) return true;
    if (!this.user || this.homebrew.status !== 'ready') return false;
    return !this.homebrew.items.some((r) => r.id === it.hid);
  }

  /** Returns the account lists whose entry of `it`'s key links `it`, another account's item:
   *  the rows «Сохранить себе» relinks to the copy. Empty for an own item and a catalog
   *  record. */
  relinkTargets(it: Record_): string[] {
    const hid = isHomebrewRecord(it) ? it.hid : undefined;
    if (typeof hid !== 'string' || this.homebrew?.items.some((r) => r.id === hid)) return [];
    return (this.cloudLists?.lists ?? [])
      .filter((l) => l.links?.[it.id] === hid)
      .map((l) => l.id);
  }

  /** Returns whether «Сохранить себе» is offered on a catalog record: signed out, or signed
   *  in once the own items are read - the terms `isForeignItem` sets for another account's
   *  item. */
  get catalogCopyOffered(): boolean {
    if (!this.homebrew) return false;
    if (this.user === null) return true;
    return !!this.user && this.homebrew.status === 'ready';
  }

  /** Returns the key an item of `key` takes in the reader's account: itself when held, or
   *  with no user or no own items, else the derived key
   *  (docs/decisions/2026-10-10-a-key-the-account-does-not-hold-becomes-a-derived-key.md). */
  ownKeyFor(key: string): string {
    const own = this.homebrew;
    const user = this.user;
    if (!own || !user) return key;
    /* A derived key is a 128-bit hash: one per key until the user or the own items change
       (both replace on change). */
    if (this.#keyMemoUser !== user.userId || this.#keyMemoItems !== own.items) {
      this.#keyMemo.clear();
      this.#keyMemoUser = user.userId;
      this.#keyMemoItems = own.items;
    }
    let out = this.#keyMemo.get(key);
    if (out === undefined) {
      out = ownKeyFor(user.userId, (k) => own.has(k), key);
      this.#keyMemo.set(key, out);
    }
    return out;
  }

  /* The key a card of `key` takes in the reader's account, as `ownKeyFor` for an item. */
  #cardKeyFor(key: string): string {
    const own = this.homebrew;
    const user = this.user;
    if (!own || !user) return key;
    return ownKeyFor(user.userId, (k) => own.cardKeys.has(k), key);
  }

  /**
   * «Сохранить себе»: copies another account's item or a catalog record into the reader's
   * own items, in the default source under a new key at each press, named by `copyRows`;
   * then relinks in place every row of the reader's lists that links another account's item
   * to the copy, each keeping its position, quantity, price, notes and mark
   * (docs/decisions/2026-10-21-each-save-to-my-items-press-makes-a-new-copy.md). The
   * account's read after the import decides: a lost answer whose copy landed is a save; one
   * whose copy did not land keeps its key for the next press of the same source.
   */
  async saveItem(it: Record_): Promise<void> {
    const own = this.homebrew;
    const user = this.user;
    const ref = isHomebrewRecord(it) ? it.hid : it.id;
    if (!own || !this.cloudLists || typeof ref !== 'string' || !user) return;
    if (this.savingItem !== null) return;
    if (own.status === 'idle' || own.status === 'loading') {
      this.say((t) => t.hbNotReady, { error: true });
      return;
    }
    if (own.status === 'error') {
      this.say((t) => t.hbLoadFailed, { error: true });
      return;
    }
    /* Unread lists relink nothing: their rows would keep the author's link. */
    if (this.cloudLists.status === 'idle' || this.cloudLists.status === 'loading') {
      this.say((t) => t.hbNotReady, { error: true });
      return;
    }
    if (this.cloudLists.status === 'error') {
      this.say((t) => t.cloudLoadFailed, { error: true });
      return;
    }
    /* Another account's item the reader authored, by row id: a reader who holds the author's
       key still gets a copy. */
    if (isHomebrewRecord(it) && own.items.some((r) => r.id === it.hid)) return;
    /* Set before the first await: a second call in the same tick returns above. */
    this.savingItem = ref;
    try {
      const lists = this.relinkTargets(it);
      const retry = `${user.userId}\n${ref}`;
      /* A retry's copy may have landed and been given a picture meanwhile; a new key holds
         none. */
      const retried = this.#copyRetry.has(retry);
      const key = this.#copyRetry.get(retry) ?? own.newIds().key;
      const store = this.cloudLists;
      const relink = (ownId: string): boolean => {
        let relinked = false;
        for (const list of lists) {
          if (store.relinkAs(list, it.id, key, ownId)) relinked = true;
        }
        return relinked;
      };
      /* The own names as drawn, each language filled from the other. */
      // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a lookup within one call
      const enNames = new Set(own.records.map((r) => r.en));
      // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a lookup within one call
      const ruNames = new Set(own.records.map((r) => r.ru));
      /* A list's linked record is reactive state, which a port may clone. */
      const rows = copyRows(
        $state.snapshot(it),
        key,
        {
          newId: () => own.newIds().id,
          cardKeyFor: (k) => this.#cardKeyFor(k),
          hasCard: (k) => own.cards.some((c) => c.key === k),
          names: { en: enNames, ru: ruNames }
        },
        isHomebrewRecord(it)
          ? []
          : (this.catalog?.craftedFrom.get(it.id) ?? []).map((r) => r.id)
      );
      const sent = rows.items[0]?.content;
      const r = await own.import(rows);
      const made = rows.items[0]?.id ?? null;
      const ownId = own.item(key)?.id ?? (r.ok && r.counts.items_created === 1 ? made : null);
      if (ownId === null) {
        if (!r.ok && r.error === 'limit') {
          this.#copyRetry.delete(retry);
          const { key: limit, value } = r;
          this.say((t) => limitText(limit, value, t), { error: true });
        } else if (!r.ok && r.error === 'refused') {
          this.#copyRetry.delete(retry);
          this.say((t) => t.saveItemRefused, { error: true });
        } else {
          this.#copyRetry.set(retry, key);
          this.say((t) => t.saveItemFailed, { error: true });
        }
        return;
      }
      this.#copyRetry.delete(retry);
      /* The copy's own picture, by its row id: an own file of the author is copied to a new
         name, a catalog picture is named as it is. It runs before the relink, so a tab
         closed in the middle leaves the rows on the author's item. */
      let artFailed = false;
      const img = isArtName(it.img) ? it.img : null;
      if (img !== null && !(retried && own.item(key)?.art)) {
        let name: string | null = img;
        if (isOwnArt(img)) {
          const copied = await own.copyArt(img);
          name = copied.ok ? copied.name : null;
        }
        artFailed = name === null || !(await own.setArt(ownId, name, retried)).ok;
      }
      const relinked = relink(ownId);
      const drawn = own.records.find((x) => x.id === key);
      const nameIn = (lang: Lang): string =>
        drawn
          ? nameOf(drawn, lang)
          : ((lang === 'ru' ? sent?.ru || sent?.en : sent?.en || sent?.ru) ?? '');
      this.say(
        (t, lang) =>
          (relinked ? t.saveItemRelinked : t.saveItemSaved).replace('%s', nameIn(lang)) +
          (artFailed ? ' ' + t.copyArtFailed : ''),
        { action: { label: (t) => t.edit, href: homebrewItemHash(key) } }
      );
    } finally {
      this.savingItem = null;
    }
  }

  /* What a lists file import reads of the account; null signed out or with no cloud. */
  #planAccount(): PlanAccount | null {
    const cloud = this.env.cloud;
    const own = this.homebrew;
    if (!cloud || !own) return null;
    return {
      newId: () => cloud.lists.newId(),
      newKey: () => own.newIds().key,
      hasItem: (k) => own.has(k),
      hasCard: (k) => own.cards.some((c) => c.key === k),
      keyFor: (k) => this.ownKeyFor(k),
      cardKeyFor: (k) => this.#cardKeyFor(k)
    };
  }

  /** Returns a lists file's import plan (docs/specs/CONTRACTS.md section 4): built once per
   *  chosen file, then, with `plan`, again for a press: a key the account no longer holds
   *  gains its fixed copy, every id kept, `plan` itself when nothing changed or while the
   *  own items are not read (a derived key read from no items would copy a held one). Null
   *  with no cloud. */
  importPlan(lists: readonly ImportList[], plan?: ImportPlan): ImportPlan | null {
    const account = this.#planAccount();
    if (!account) return null;
    if (!plan) return importPlan(lists, account);
    return this.homebrew?.status === 'ready' ? withCopies(plan, lists, account) : plan;
  }

  /** Imports a plan: its fixed copies first (one `import_homebrew` call, every row or none),
   *  then its lists (one `import_lists` call). A refused copies call writes nothing; a
   *  failed lists call keeps the copies, and a retry skips their held keys and links them. */
  async importLists(plan: ImportPlan): Promise<ListWrite> {
    const store = this.cloudLists;
    if (!store) return { ok: false, error: 'network' };
    if (plan.copies) {
      const copied = await this.homebrew?.import(plan.copies);
      if (!copied) return { ok: false, error: 'network' };
      if (!copied.ok) return copied;
    }
    return store.import(plan.rows);
  }

  /** Whether `recordFor` finds a record for `id`. */
  knows(id: string): boolean {
    return this.recordFor(id) !== undefined;
  }

  /** How many account lists hold any of `keys`. */
  listsHolding(keys: readonly string[]): number {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a lookup within one call
    const wanted = new Set(keys);
    return (this.cloudLists?.lists ?? []).filter((l) => l.ids.some((id) => wanted.has(id)))
      .length;
  }

  /**
   * Makes every navigation ask `leaveUnsaved` while `dirty()` answers true: a link, `go()`,
   * Back and Forward. `replace()` never asks. One check at a time; returns its release.
   */
  guardLeave(dirty: () => boolean): () => void {
    this.#leaveCheck = dirty;
    return () => {
      if (this.#leaveCheck === dirty) this.#leaveCheck = null;
    };
  }

  #mayLeave(): boolean {
    const check = this.#leaveCheck;
    if (!check?.()) return true;
    return this.env.dialog.confirm(this.t.leaveUnsaved);
  }

  /**
   * The open share link's token while a reader other than its owner can send a purchase
   * request through it: on `#/s/`, the list read, and not the reader's own list.
   */
  get requestToken(): string | null {
    const view = this.sharedView;
    if (this.route.kind !== 'share' || view?.status !== 'ready' || view.mine !== null) {
      return null;
    }
    return view.token;
  }

  /**
   * Where a list made now goes: `none` in a build with no sign-in (it has no lists and
   * draws no add-to-list control), `wait` while the session is unknown (nothing is drawn,
   * so a signed-in reader never sees the prompt flash), `prompt` signed out, `cloud`
   * signed in.
   */
  get newListTarget(): 'none' | 'wait' | 'prompt' | 'cloud' {
    if (!this.cloudLists) return 'none';
    if (this.user === undefined) return 'wait';
    return this.user ? 'cloud' : 'prompt';
  }

  /**
   * What a print control does: `none` in a build with no sign-in (no control is drawn),
   * `wait` while the session is unknown, `prompt` signed out, `cloud` signed in
   * (docs/specs/FEATURES.md, "Print").
   */
  get printTarget(): 'none' | 'wait' | 'prompt' | 'cloud' {
    if (!this.env.cloud) return 'none';
    if (this.user === undefined) return 'wait';
    return this.user ? 'cloud' : 'prompt';
  }

  /** Returns the entries a print of `ids` stores, unknown ids dropped, and how many records
   *  the 180-card cap cut; a signed-out prompt carries the same in its pending action. */
  printEntriesOf(
    ids: readonly string[],
    qty: Readonly<Record<string, number>> = {}
  ): { entries: PrintSetEntry[]; cut: number } {
    const items = ids.flatMap((id) => {
      const it = this.pageRecordFor(id);
      return it ? [it] : [];
    });
    return printSetEntries(items, qty);
  }

  /** A print control's press, signed in: stores the cards and their counts as a print set
   *  and opens its `#/p/<id>`. */
  async print(
    ids: readonly string[],
    qty: Readonly<Record<string, number>> = {}
  ): Promise<void> {
    if (!this.env.cloud || !this.user || this.printing) return;
    const unread = this.homebrew?.status !== 'ready' || this.cloudLists?.status !== 'ready';
    if (unread && ids.some((id) => isHomebrewKey(id) && !this.pageRecordFor(id))) {
      this.say((t) => t.hbNotReady, { error: true });
      return;
    }
    const skipped = ids.filter((id) => !this.pageRecordFor(id)).length;
    const { entries, cut } = this.printEntriesOf(ids, qty);
    if (!entries.length) return;
    await this.#makePrint(entries, cut, skipped);
  }

  /* The make of a press and of a pending print. An answer that arrives after a navigation
     is dropped: the set may exist, and the same sheet pressed again returns it. `skipped`
     counts the ids of the press with no record, which the set leaves out. */
  async #makePrint(entries: readonly PrintSetEntry[], cut: number, skipped = 0): Promise<void> {
    const cloud = this.env.cloud;
    if (!cloud || this.printing) return;
    const at = this.navigations;
    this.printing = true;
    let made: PrintSetMade;
    try {
      made = await cloud.prints.create(entries);
    } finally {
      this.printing = false;
    }
    if (this.navigations !== at) return;
    if (made.ok) {
      this.go(printSetHash(made.id));
      if (cut > 0 || skipped > 0) {
        this.say((t) =>
          [
            cut > 0
              ? t.printTooMany.replace('%n', String(PRINT_MAX)).replace('%d', String(cut))
              : '',
            skipped > 0 ? t.printSkipped.replace('%n', String(skipped)) : ''
          ]
            .filter(Boolean)
            .join(' ')
        );
      }
      return;
    }
    if (made.error === 'limit') {
      const { key, value } = made;
      this.say((t) => limitText(key, value, t), { error: true });
      return;
    }
    this.say((t) => t.printSetFailed, { error: true });
  }

  /** Reads the print set `id` for `#/p/`: its rows in order and the count of deleted items;
   *  `set` null for a set that opens nothing, and with no sign-in configured. */
  async loadPrintSet(
    id: string
  ): Promise<
    { ok: false } | { ok: true; set: { rows: PrintSetRow[]; missing: number } | null }
  > {
    const cloud = this.env.cloud;
    if (!cloud) return { ok: true, set: null };
    const r = await cloud.prints.read(id);
    if (!r.ok) return { ok: false };
    if (r.set === null) return { ok: true, set: null };
    return { ok: true, set: readPrintSet(r.set, (k) => this.index?.byId.has(k) ?? false) };
  }

  /** A prompt's «Войти»: remembers the page and the action, then opens `#/account`. */
  askSignIn(after: SignInAfter): void {
    this.signInFor = after;
    this.go('#/account');
  }

  #forgetSignIn(): void {
    if (this.route.kind !== 'account') this.signInFor = null;
  }

  #forgetPending(): void {
    this.#pending = null;
    this.saveItemFor = null;
  }

  /**
   * The account page's sign-in. The remembered prompt rides the provider
   * redirect; a port that signs in at once (the fake) is taken back to the
   * prompt's page here, and its action runs once the lists are read.
   */
  async signIn(provider: Provider): Promise<AuthResult> {
    const cloud = this.env.cloud;
    if (!cloud) return { ok: false, error: 'failed' };
    const after = this.signInFor;
    const r = await cloud.auth.signIn(provider, after ?? undefined);
    if (r.ok && after && this.user && this.signInFor === after) {
      this.go(after.hash);
      if (after.action) {
        this.#pending = after.action;
        this.#runPending();
      }
    }
    return r;
  }

  /**
   * Signs out, for the account page and the account menu: the account's
   * buffered writes are sent first, for at most `SIGN_OUT_WAIT_MS`; a write
   * that did not land is lost, as a sign-out loses it.
   */
  async signOut(scope: 'local' | 'global' = 'local'): Promise<AuthResult> {
    const cloud = this.env.cloud;
    if (!cloud) return { ok: false, error: 'failed' };
    const lists = this.cloudLists;
    if (lists) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const waited = new Promise<void>((done) => {
        timer = setTimeout(done, SIGN_OUT_WAIT_MS);
      });
      await Promise.race([lists.flushNow(), waited]);
      clearTimeout(timer);
    }
    return cloud.auth.signOut(scope);
  }

  /* Waits for a user and the account's lists. */
  #runPending(): void {
    const action = this.#pending;
    const lists = this.cloudLists;
    if (!action || !this.user || lists?.status !== 'ready') return;
    if (action.do === 'addToList') {
      this.#pending = null;
      /* Only the bar's menu acts on the ticks; a card's acts on its record. */
      if (action.key === 'sel') {
        this.#clearTicks();
        for (const id of action.ids) this.sel.add(id);
        for (const [id, n] of Object.entries(action.picked ?? {})) this.picked.set(id, n);
      }
      this.menuFor = action.key;
      return;
    }
    if (action.do === 'saveItem') {
      /* The item's pick row makes the copy once the account's items are read. */
      this.#pending = null;
      this.saveItemFor = 'hid' in action ? action.hid : action.id;
      return;
    }
    if (action.do === 'print') {
      this.#pending = null;
      void this.#makePrint(action.entries, action.cut ?? 0);
      return;
    }
    /* `saveList` saves the open share link's list; on any other page, an old `#/l/` one
       among them, nothing is saved. */
    const r = this.route;
    this.#pending = null;
    if (r.kind === 'share') void this.saveShareCopy(r.token);
  }

  /** Says the list limit and answers true when the account is at it: an optimistic create
   *  would be refused about 2 s later and dropped. */
  listsFull(): boolean {
    const lists = this.cloudLists;
    if (!lists?.full()) return false;
    const limit = lists.listLimit;
    this.say((t) => limitText('lists_per_owner', limit, t), { error: true });
    return true;
  }

  /** Saves the share link's list into the account and opens the copy, while the reader
   *  is still on that link. */
  async saveShareCopy(token: string): Promise<void> {
    const cloud = this.env.cloud;
    const lists = this.cloudLists;
    if (!cloud || !lists || this.cloning) return;
    this.cloning = true;
    const id = cloud.lists.newId();
    try {
      /* The account must hold every buffered write first: the read-back
         below waits while a write is buffered. */
      if (!(await lists.flushNow())) {
        this.say((t) => t.cloneFailed, { error: true });
        return;
      }
      const r = await cloud.shares.clone(token, id);
      if (!r.ok) {
        if (r.error === 'limit') {
          const { key, value } = r;
          this.say((t) => limitText(key, value, t), { error: true });
        } else this.say((t) => t.cloneFailed, { error: true });
        if (r.error === 'refused') void this.sharedView?.refresh();
        return;
      }
      await lists.load();
    } finally {
      this.cloning = false;
    }
    const name = lists.get(id)?.name ?? this.sharedView?.shared?.list.name ?? '';
    this.say((t) => t.listCreated.replace('%s', name || t.untitled));
    const here = this.route;
    if (here.kind === 'share' && here.token === token) this.go(storedListHash(id));
  }

  /* The account wins over this browser; an account with no row is seeded
     from it. An answer is dropped when the page stopped, the user changed,
     or a local edit came first (that edit has already been saved). */
  async #pull(): Promise<void> {
    const cloud = this.env.cloud;
    const id = this.#prefsFor;
    const edits = this.#edits;
    if (!cloud || id === null) return;
    /* A read that overtook a save would read the row before it. */
    while (this.#saving) await this.#saving;
    const read = await cloud.prefs.load();
    if (!this.#watching || this.#prefsFor !== id || this.#edits !== edits || !read.ok) return;
    if (read.prefs === null) this.#saveAccount();
    else this.#applyPrefs(read.prefs);
  }

  /* Never navigates: first paint already chose the page. A `home` the pin
     check refuses is ignored, not reset. */
  #applyPrefs(p: Prefs): void {
    if (p.lang) {
      this.lang = p.lang;
      this.env.storage.set(LANG_KEY, p.lang);
    }
    const pin = p.home === undefined ? null : pinOf(p.home);
    if (pin) {
      this.#home = pin;
      if (pin === DEFAULT_HOME) this.env.storage.remove(HOME_KEY);
      else this.env.storage.set(HOME_KEY, pin);
    }
    if (p.view) this.#tablesView = p.view;
    if (p.printBw !== undefined) this.#printBW = p.printBw;
    if (p.printCompact !== undefined) this.#printCompact = p.printCompact;
    this.#notifyGm = p.notifyGm ?? 'ask';
    this.#writeLocalPrefs();
  }

  /* Signed in, the whole current object replaces the account's row. One
     save at a time: two in flight could land out of order and leave the row
     older than this tab. One asked for meanwhile runs once, afterwards, with
     the newest values, and only the newest save sets `#stale`. */
  #saveAccount(): void {
    const cloud = this.env.cloud;
    if (!cloud || !this.user) return;
    if (this.#saving) {
      this.#savePending = true;
      return;
    }
    this.#saving = cloud.prefs
      .save({
        lang: this.lang,
        home: this.#home,
        view: this.#tablesView,
        printBw: this.#printBW,
        printCompact: this.#printCompact,
        notifyGm: this.#notifyGm
      })
      .catch(() => false)
      .then((ok) => {
        this.#saving = null;
        if (!this.#watching) {
          this.#savePending = false;
          return;
        }
        if (this.#savePending) {
          this.#savePending = false;
          this.#saveAccount();
        } else {
          this.#stale = !ok;
        }
      });
  }

  /* Signed out, another tab's settings apply here as the start read them; a bad value
     reads as the start's fallback. A page's own value stays: only the defaults move, as
     the account's answer moves them. Signed in, the account's row decides. Nothing is
     written back. */
  #followSettings(): void {
    if (this.user) return;
    const lang = readLang(this.env);
    const home = homeOf(this.env.storage.get(HOME_KEY));
    const local = readLocalPrefs(this.env);
    const moved =
      lang !== this.lang ||
      home !== this.#home ||
      local.view !== this.#tablesView ||
      local.printBw !== this.#printBW ||
      local.printCompact !== this.#printCompact;
    if (!moved) return;
    this.lang = lang;
    this.#home = home;
    this.#tablesView = local.view;
    this.#printBW = local.printBw;
    this.#printCompact = local.printCompact;
    this.#changed();
  }

  /* Every setter writes this browser first, then the account. */
  #changed(): void {
    this.#edits++;
    this.#saveAccount();
  }

  #writeLocalPrefs(): void {
    const local: LocalPrefs = {
      view: this.#tablesView,
      printBw: this.#printBW,
      printCompact: this.#printCompact
    };
    this.env.storage.set(PREFS_KEY, JSON.stringify(local));
  }

  stop(): void {
    this.#stopRouter?.();
    this.#stopRouter = null;
    if (this.#listPoll !== null) clearInterval(this.#listPoll);
    this.#listPoll = null;
    this.#stopAuth?.();
    this.#stopAuth = null;
    this.#stopHidden?.();
    this.#stopHidden = null;
    this.#stopSettings?.();
    this.#stopSettings = null;
    this.cloudLists?.unwatch();
    this.ownerRequests?.clear();
    this.homebrew?.clear();
    /* A timer left running past the listeners it would otherwise update is a
       leak of the same kind `#stopRouter`/`#stopSettings` already guard
       against. */
    this.#waiting = null;
    this.hideToast();
  }

  /**
   * Says something with no place on screen - a toast, off `showToast` in
   * app.js. Plain notices last 1600ms, an error 2600ms and `role="alert"`,
   * and one with an action 7000ms. A second call replaces the first and
   * restarts the clock, except a plain notice said while an error or an action
   * toast shows: it waits and shows when that toast ends (docs/specs/FEATURES.md,
   * "Chrome").
   */
  say(
    msg: Msg,
    opts: { error?: boolean | undefined; action?: ToastAction | undefined } = {}
  ): void {
    const mode: Toast['mode'] = opts.action ? 'act' : opts.error ? 'err' : '';
    if (mode === '' && this.#said && this.#said.mode !== '') {
      this.#waiting = msg;
      return;
    }
    const ms = opts.action ? 7000 : opts.error ? 2600 : 1600;
    this.#said = { msg, mode, action: opts.action };
    if (this.#toastTimer) clearTimeout(this.#toastTimer);
    this.#toastTimer = null;
    this.#toastLeft = null;
    /* The golden harness's test build: a capture reads the toast however late it arrives. */
    if (this.env.clock.holdsToasts?.()) return;
    this.#runToast(ms);
  }

  #runToast(ms: number): void {
    /* `Date.now`, not the clock port: the test build's clock is a fixed day. */
    this.#toastDue = Date.now() + ms;
    this.#toastTimer = setTimeout(() => {
      this.hideToast();
    }, ms);
  }

  /**
   * Holds an action toast's clock while the pointer is over it or focus is
   * inside it (`on`), and runs it on with the time it had left when both end.
   * A plain notice and an error never hold: a resting pointer must not keep them.
   */
  holdToast(on: boolean): void {
    if (this.#said?.mode !== 'act' || this.env.clock.holdsToasts?.()) return;
    if (on) {
      if (this.#toastLeft !== null || !this.#toastTimer) return;
      clearTimeout(this.#toastTimer);
      this.#toastTimer = null;
      this.#toastLeft = Math.max(0, this.#toastDue - Date.now());
    } else if (this.#toastLeft !== null) {
      const left = this.#toastLeft;
      this.#toastLeft = null;
      this.#runToast(left);
    }
  }

  /**
   * Runs a clipboard/share action and toasts the result - the pattern every
   * copy button on the page repeats: run the port call, then say `ok` on
   * success or the shared `copyFailed` word on failure, `role="alert"` only
   * on failure. One method instead of fourteen call sites each writing the
   * same three lines.
   */
  async copied(run: () => Promise<boolean>, ok: Msg): Promise<void> {
    const success = await run();
    this.say(success ? ok : (t) => t.copyFailed, { error: !success });
  }

  /** Ends the shown toast - its timer, its close or its action - and shows a waiting
   *  plain message with its own 1600ms. */
  hideToast(): void {
    this.#said = null;
    this.#toastLeft = null;
    if (this.#toastTimer) {
      clearTimeout(this.#toastTimer);
      this.#toastTimer = null;
    }
    const next = this.#waiting;
    this.#waiting = null;
    if (next) this.say(next);
  }

  #applySource(): void {
    const legacy = legacySource(this.hash);
    if (legacy) this.source = legacy;
  }

  /** Where this page is, as the link builders in lib/hash.ts want it. */
  get site(): Site {
    return { base: this.env.router.base() };
  }

  /** An address to hand somebody else, in the language on screen, so a messenger
   *  builds its preview in that language. A card family (an item, a share link, a
   *  print set, a catalog table) goes through the preview host, so a messenger draws
   *  its own card; `v` is that card's version. Any other address, and every address in
   *  a build with no preview host, is the app's own. */
  linkTo(hash: string, v?: string): string {
    const card = this.env.preview ? previewUrl(this.env.preview, hash, this.lang, v) : null;
    return card ?? appUrl(this.site, hash, this.lang);
  }

  /** A record's address to hand somebody else, in the language on screen: a homebrew item's
   *  preview link, versioned by the record (its `#/h/` address in a build with no preview
   *  host), else the record's stub page, versioned by the build's card map when it holds
   *  the record. Every record with a `hid` is saved. */
  linkToRecord(it: Record_): string {
    const hid = isHomebrewRecord(it) ? it.hid : undefined;
    return typeof hid === 'string'
      ? this.linkTo(itemHash(hid), cardVersion(it))
      : recordUrl(this.site, it.id, this.lang, this.env.data.cardVersion(it.id));
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

  /** A static page has one copy per language (docs/specs/META.md section 9):
   *  the footer and the account page's consent line link the copy of the
   *  language on screen. */
  get pagesDir(): string {
    return this.lang === 'en' ? 'pages/en/' : 'pages/';
  }

  /** `$derived` rather than a getter: `Shell`, `App` and every page
   *  read this several times per render, and a getter re-parses the hash on
   *  each one. */
  route: Route = $derived.by(() => parseHash(this.hash));

  /** Which tab is lit. Nothing is lit on a record, a list page or a print
   *  sheet - the live `renderTabs` (`git show 23c00a6^:app.js`) compares against the
   *  raw route string, and a list route is never that string. */
  section: Section | null = $derived.by(() => {
    const r = this.route;
    if (r.kind === 'section') return r.section;
    if (r.kind === 'tables') return 'tables';
    return null;
  });

  setLang(lang: Lang): void {
    this.lang = lang;
    this.env.storage.set(LANG_KEY, lang);
    this.#changed();
  }

  /** Returns the default tables view, stored in `dhloot.prefs.v1`. */
  get tablesView(): 'list' | 'grid' {
    return this.#tablesView;
  }

  /** Sets the default from the Display section and drops a page's pick. */
  setTablesView(view: 'list' | 'grid'): void {
    this.#tablesView = view;
    this.#tablesViewNow = null;
    this.#writeLocalPrefs();
    this.#changed();
  }

  get printBW(): boolean {
    return this.#printBW;
  }

  /** Sets the default from the Display section and drops a page's pick. */
  setPrintBW(bw: boolean): void {
    this.#printBW = bw;
    this.#printBWNow = null;
    this.#writeLocalPrefs();
    this.#changed();
  }

  get printCompact(): boolean {
    return this.#printCompact;
  }

  /** Sets the default from the Display section and drops a page's pick. */
  setPrintCompact(compact: boolean): void {
    this.#printCompact = compact;
    this.#printCompactNow = null;
    this.#writeLocalPrefs();
    this.#changed();
  }

  /** Returns the tables view the page draws: its pick for this visit, else the default. */
  get shownTablesView(): 'list' | 'grid' {
    return this.#tablesViewNow ?? this.#tablesView;
  }

  get shownPrintBW(): boolean {
    return this.#printBWNow ?? this.#printBW;
  }

  get shownPrintCompact(): boolean {
    return this.#printCompactNow ?? this.#printCompact;
  }

  get tablesViewChanged(): boolean {
    return this.shownTablesView !== this.#tablesView;
  }

  get printChanged(): boolean {
    return this.shownPrintBW !== this.#printBW || this.shownPrintCompact !== this.#printCompact;
  }

  /** Changes the tables view for this visit: no storage write, no account save. */
  showTablesView(view: 'list' | 'grid'): void {
    this.#tablesViewNow = view === this.#tablesView ? null : view;
  }

  showPrintBW(bw: boolean): void {
    this.#printBWNow = bw === this.#printBW ? null : bw;
  }

  showPrintCompact(compact: boolean): void {
    this.#printCompactNow = compact === this.#printCompact ? null : compact;
  }

  get notifyGm(): NotifyGm {
    return this.#notifyGm;
  }

  /** Remembers the answer in the account row alone: no key in this browser. */
  setNotifyGm(v: NotifyGm): void {
    this.#notifyGm = v;
    this.#changed();
  }

  go(hash: string): void {
    if (hash !== this.hash && !this.#mayLeave()) return;
    /* Set before `navigate()`, which for a fake/in-memory router fires
       the change handler synchronously, inline in this same call - the
       handler reads it back before this method's own processing below runs,
       so the two do not double-count one navigation.
       Only set when the hash actually changes: a real
       browser fires no `hashchange` at all for a same-value assignment, so
       an unconditional set here used to leave a stale `#expectHash` behind
       whenever a caller navigated to the address already showing; a later
       Back/Forward landing on exactly that hash was then swallowed by the
       `h === this.#expectHash` guard above, instead of being processed. */
    if (hash !== this.env.router.hash()) this.#expectHash = hash;
    this.env.router.navigate(hash);
    /* `go()`'s callers all build a hash from this file's own writers,
       so this is defence rather than a reachable bug - but the router's own
       `onChange` handler already resolves a bad hash through `#fallback`
       (below), and this method deserved the same guarantee for the same
       reason: a route kind `App.svelte` cannot yet draw must not be the
       result of a call this class itself made. */
    const from = this.route;
    this.hash = this.#fallback(hash);
    this.#forgetSignIn();
    this.#forgetPending();
    this.navigations++;
    this.menuFor = '';
    this.#clearTicksOnLeave(from);
    this.#applySource();
  }

  /** Clears the selection and folds its menu - the live `clearSel` action. */
  clearSel(): void {
    this.#clearTicks();
    this.menuFor = '';
  }

  /** Ticks or unticks one row - `TablesPage.svelte`'s own copy moved here on
   *  its second use (the shared page). */
  toggleSel(id: string): void {
    if (this.sel.has(id)) {
      this.sel.delete(id);
      this.picked.delete(id);
    } else this.sel.add(id);
  }

  /** Drops the ticks, and their taken counts, of entries not in ids - the shared page after its list changed. */
  keepTicksIn(ids: readonly string[]): void {
    for (const id of [...this.sel]) {
      if (ids.includes(id)) continue;
      this.sel.delete(id);
      this.picked.delete(id);
    }
  }

  /**
   * Switches one kind chip - refusing to turn off the last one on, and
   * saying why rather than doing nothing (the live app's `keepOneKind`
   * toast). `among` is the row the chip sits in - `LOOT_KINDS` on a roll
   * page, `KINDS` on search - because "the last one on" is judged among the
   * chips a person can actually see, the way the live `kindChips(list)`
   * judges it.
   */
  toggleKind(kind: Kind, among: readonly Kind[]): void {
    if (isLastOn(this.kinds, among, kind)) {
      this.say((t) => t.keepOneKind, { error: true });
      return;
    }
    this.kinds = { ...this.kinds, [kind]: !this.kinds[kind] };
  }

  /** Switches «Свои предметы»: the own items in search and the equipment tables. */
  toggleHomebrew(): void {
    this.homebrewShown = !this.homebrewShown;
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

  /**
   * Sets the starting section from the Display section of `#/account`; the
   * pin button stays `toggleHome`'s. Returns false, and changes nothing, for
   * an address a pin may not hold or a refused write.
   */
  setHome(hash: string): boolean {
    const pin = pinOf(hash);
    if (pin === null) return false;
    if (pin === DEFAULT_HOME) this.env.storage.remove(HOME_KEY);
    else if (!this.env.storage.set(HOME_KEY, pin)) return false;
    this.#home = pin;
    this.#changed();
    return true;
  }

  /**
   * Pins the given address, or unpins it if it is already pinned; pins the
   * address on screen where none is given.
   *
   * The override is `TablesPage`'s: a bare `#/tables` still shows a real
   * table underneath (`lastTable`, kept by that component alone - `App.svelte`
   * does not remount it between two `tables` addresses, so `AppState` cannot
   * see which one is genuinely on screen the way live's own `S.tables.t`
   * can). `PageHead` passes it through from there, and from `HomebrewPage`, whose
   * tabs share the pin `#/homebrew`; every other caller pins `this.hash`.
   */
  toggleHome(hash?: string): boolean {
    const current = canonicalHash(hash ?? this.hash);
    const next = this.#home === current ? '' : current;
    if (next) {
      if (!this.env.storage.set(HOME_KEY, next)) return false;
      this.#home = next;
    } else {
      this.env.storage.remove(HOME_KEY);
      this.#home = DEFAULT_HOME;
    }
    this.#changed();
    return true;
  }
}
