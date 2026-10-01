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
  officialOnly,
  overBounds,
  toBundle,
  type Bundle
} from '../lib/bundle.js';
import {
  entrySource,
  isCloudId,
  limitText,
  snapshotRecords,
  type CloudList
} from '../lib/cloudLists.js';
import { buildIndex, type Index } from '../lib/data.js';
import { dict, type Dict, type Msg } from '../lib/dict.js';
import {
  appUrl,
  legacySource,
  PACK_MARK,
  parseHash,
  recordUrl,
  sectionHash,
  sharedListHash,
  storedListHash,
  stripHash,
  type Route,
  type Site
} from '../lib/hash.js';
import {
  browseIndex,
  isHomebrewKey,
  withRecords,
  type HomebrewRecord
} from '../lib/homebrew.js';
import { fewNames, nameOf } from '../lib/i18n.js';
import { plural } from '../lib/plural.js';
import { legacyWritable } from '../lib/legacy.js';
import { decodeList, encodeList, type DecodedList } from '../lib/listLink.js';
import { copyInit, findListByPayload, LIST_PAGE, type StoredList } from '../lib/lists.js';
import type { PendingAction, SignInAfter } from '../lib/pending.js';
import { readPrefs, type NotifyGm, type Prefs } from '../lib/prefs.js';
import { isLastOn, type Chosen } from '../lib/std.js';
import type { Kind, Lang, Record_, Section } from '../lib/types.js';
import type { AuthResult, Env, Provider, Session } from '../ports/index.js';
import { CloudLists } from './cloudLists.svelte.js';
import { Homebrew } from './homebrew.svelte.js';
import { LegacyMove } from './legacyMove.svelte.js';
import { ListStore, type ListModel, type MovedList } from './lists.svelte.js';
import { OwnerRequests } from './ownerRequests.svelte.js';
import { RequestSender } from './requestSender.svelte.js';
import { SharedView } from './sharedView.svelte.js';

const LANG_KEY = 'dhloot.lang.v1';
const HOME_KEY = 'dhloot.home.v1';
const WARN_KEY = 'dhloot.warn.v1';
const PREFS_KEY = 'dhloot.prefs.v1';

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
     `homeAllows` (app.js 1124-1130) keeps that shape, for a pin written
     before this fix as much as one typed by hand - but a name outside
     TABLE_IDS is not, because there is nothing specific behind it to reopen.
     `parseHash` cannot tell "no name" from "a name it did not recognise"
     (both come back `table: null`), so the bare case is read off the string
     itself rather than off the route. */
  if (v === '#/tables/frames') return '#/tables/other_frames';
  const r = parseHash(v);
  if (r.kind === 'section') return v;
  if (r.kind === 'tables' && (r.table || stripHash(v) === 'tables')) return v;
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
   * see docs/specs/FEATURES.md, "Records". A `#/l/` link and a lists file read it
   * alone: they hold catalog ids only.
   */
  readonly catalog: Index | null;

  /** The signed-in author's homebrew; null with no sign-in configured. */
  readonly homebrew: Homebrew | null;

  /** The catalogue with the signed-in author's own items: what every page that draws
   *  records reads. The catalogue object itself while the account holds none. */
  index: Index | null = $derived.by(() => {
    const own = this.homebrew?.records ?? [];
    return this.catalog && own.length ? withRecords(this.catalog, own, []) : this.catalog;
  });

  /**
   * The «Хоумбрю» chip on search and the equipment tables: whether their row pools hold
   * the own items. Memory only, kept across pages like `kinds`, on again at each sign-in
   * (docs/specs/STATE.md).
   */
  homebrewShown = $state(true);

  /** The index search and the equipment tables read their rows and facets from: `index`
   *  without the own items in `searchable` and `allEquip` while the chip is off. */
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

  /** The lists a person has made in this browser, and how they are saved. */
  readonly lists: ListStore;
  /** The signed-in owner's account lists; null in a build with no sign-in configured. */
  readonly cloudLists: CloudLists | null;
  /** The list behind the open share link; null in a build with no sign-in configured. */
  readonly sharedView: SharedView | null;
  /** The move of this browser's lists into the account; null with no sign-in configured. */
  readonly legacyMove: LegacyMove | null;
  /** The signed-in owner's purchase requests; null with no sign-in configured. */
  readonly ownerRequests: OwnerRequests | null;
  /** A share page reader's purchase request; null with no sign-in configured. */
  readonly requestSender: RequestSender | null;
  /**
   * Whether browser lists may be written: before the legacy write cutoff, read once
   * at load (a tab open across the midnight keeps its value). Always true in a
   * build with no sign-in configured: it has no account to move into.
   */
  readonly legacyWritable: boolean;
  /** The clock the relative times read: moved every 45 s and when the tab is shown again. */
  now = $state(Date.now());
  /** True while «Сохранить себе» copies a share link's list. */
  cloning = $state(false);
  /**
   * Where a sign-in prompt's «Войти» came from and what it started - kept
   * while the reader is on `#/account`, handed to the provider redirect by
   * `signIn`, and forgotten on any navigation to another page
   * (docs/specs/STATE.md, "Session"). Raw: it crosses into sessionStorage.
   */
  signInFor = $state.raw<SignInAfter | null>(null);
  /** The name a reader typed for a new list before a sign-in; the add-to-list menu that
   *  reopens after it takes the name into its create slot, once. */
  pendingListName = $state<string | null>(null);
  /* The action a sign-in finishes once the account's lists are read. A
     navigation or a sign-out forgets it, so it never runs on another page
     or for the next user. */
  #pending: PendingAction | null = null;
  #listPoll: ReturnType<typeof setInterval> | null = null;
  /* The one page with unsaved edits asks before any navigation leaves it. */
  #leaveCheck: (() => boolean) | null = null;

  /**
   * The list currently open on the list page, and the payload its address
   * was last rewritten to - the live `S.openList` / `S.urlPayload`. Both are
   * cleared on any route that is not a list page, the way the live app
   * clears them on every other route.
   */
  openList = $state('');
  urlPayload = $state('');

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
   * What the open shared page shows - the live `S.shared` (app.js 51,
   * 3140-3141). Set by `SharedListPage` while mounted, null on every other
   * page: the route gate the live `metaForKey` applies (`route is l/ and no
   * openList`, 1874-1877), done here by mount instead. Every add-to-list menu
   * on the shared page - the bar's, a card's - reads this to copy the
   * entry's qty, price and players' note along.
   */
  shared = $state<DecodedList | null>(null);

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

  #home = $state(DEFAULT_HOME);
  /** Whether the "lists live in this browser only" notice has been dismissed
   *  for good - the live app's `dhloot.warn.v1`. App-level because the list
   *  page reads the same flag, not only the index. */
  #warnHidden = $state(false);
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
  /** The packed payload a failed expansion is stuck on, or `''`.
   *  Compared against `route.payload` by whoever draws the bad-link state, so
   *  a later navigation to a *different* packed link is not mistaken for the
   *  same failure. */
  expandFailed = $state('');
  /** Whether storage works at all, read once - probing it (a write and a
   *  delete) on every mount of `StorageNotice` cost the same round trip for
   *  nothing, since the answer cannot change while the page is open. */
  readonly storageWorks: boolean;
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
  #stopListWatch: (() => void) | null = null;
  #stopAuth: (() => void) | null = null;
  #stopHidden: (() => void) | null = null;
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
    this.#warnHidden = env.storage.get(WARN_KEY) === '1';
    const local = readLocalPrefs(env);
    this.#tablesView = local.view;
    this.#printBW = local.printBw;
    this.#printCompact = local.printCompact;
    this.storageWorks = env.storage.works();
    if (!env.cloud) this.user = null;
    this.showInstall = !env.pwa.standalone();
    const say = (msg: Msg, error?: boolean): void => {
      this.say(msg, { error });
    };
    this.lists = new ListStore(env, say, () => this.t);
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
                has: (k) => this.homebrew?.has(k) ?? false
              },
              this.frozenCopy(key)
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
    this.legacyMove = env.cloud ? new LegacyMove(this, () => this.user?.userId ?? null) : null;
    this.legacyWritable = !env.cloud || legacyWritable(env.clock.now());

    /* A bare address opens the pinned section - but only at boot, and only a
       bare one: a link to a record or a shared list must not be overridden by
       a preference. Live's own boot check, app.js 4610-4614: an assignment,
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
    this.#expand();
  }

  /**
   * What a non-boot address resolves to, and what it does to the bar -
   * live's `currentRoute` fallback (app.js 3638-3647), reused by the
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
      this.hash = this.#fallback(h);
      this.#forgetSignIn();
      this.#forgetPending();
      this.navigations++;
      this.menuFor = '';
      this.#clearTicks();
      this.#applySource();
      this.#expand();
    });
    /* A list another tab moved leaves this one; its open page follows it. */
    this.#stopListWatch = this.lists.watch((moved) => {
      this.followMoved(moved);
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
      if (!this.user) return;
      if (this.#stale) this.#saveAccount();
      else void this.#pull();
      void this.cloudLists?.refresh().then(() => this.#listsReady());
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
    /* Another user's move said nothing about this one's. */
    this.legacyMove?.reset();
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
        return this.#listsReady();
      });
    }
  }

  /* The account's lists were read: the move runs when it is due, then the
     action a sign-in left. The move first, so the action never runs beside
     it (docs/specs/FEATURES.md, "Account and browser lists"). */
  async #listsReady(): Promise<void> {
    const id = this.user?.userId;
    if (id && this.legacyMove) await this.legacyMove.runIfDue(id);
    this.#runPending();
  }

  /** «Повторить» after a failed read of the account: reads again, then runs the move. */
  async retryLists(): Promise<void> {
    await this.cloudLists?.load();
    await this.#listsReady();
  }

  /** Downloads the account's lists as one lists file: every list, or the lists `ids` names,
   *  in the index's order. A file past the schema's bounds still downloads whole, and a
   *  toast says why it cannot be imported whole (docs/specs/FEATURES.md, "Account and
   *  browser lists"). */
  async exportLists(ids?: readonly string[]): Promise<void> {
    const store = this.cloudLists;
    if (!store) return;
    const lists = ids ? store.lists.filter((l) => ids.includes(l.id)) : store.lists;
    const now = this.#exportedAt();
    const { b, skipped } = this.#bundle(lists, now);
    try {
      await this.env.image.download(
        new Blob([bundleText(b)], { type: 'application/json' }),
        bundleFileName(lists, now)
      );
    } catch {
      this.say((t) => t.accountFailed, { error: true });
      return;
    }
    this.#warnBounds(b, skipped);
  }

  /** Downloads «Скачать мои данные»: a store-only zip holding `lists.json`, the lists file
   *  of every account list (docs/specs/CONTRACTS.md section 4). */
  async exportData(): Promise<void> {
    const store = this.cloudLists;
    if (!store) return;
    const now = this.#exportedAt();
    const { b, skipped } = this.#bundle(store.lists, now);
    try {
      const { zipStored } = await import('../lib/zip.js');
      const bytes = zipStored(
        [{ name: 'lists.json', bytes: new TextEncoder().encode(bundleText(b)) }],
        now
      );
      await this.env.image.download(
        new Blob([bytes], { type: 'application/zip' }),
        dataFileName(now)
      );
    } catch {
      this.say((t) => t.accountFailed, { error: true });
      return;
    }
    this.#warnBounds(b, skipped);
  }

  /* The export's moment: the test build's fixed clock names a known file. */
  #exportedAt(): Date {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a moment read once, never state
    return new Date(this.env.clock.now());
  }

  /* The lists file is official only (docs/specs/CONTRACTS.md section 4): a homebrew entry
     is left out and counted. */
  #bundle(lists: readonly CloudList[], now: Date): { b: Bundle; skipped: number } {
    const byId = this.index?.byId;
    const { lists: official, skipped } = officialOnly(lists);
    const b = toBundle(
      official,
      (id) => {
        const it = byId?.get(id);
        return it ? nameOf(it, this.lang) : undefined;
      },
      this.t.untitled,
      now
    );
    return { b, skipped };
  }

  /* Not an error: the file downloaded. */
  #warnBounds(b: Bundle, skipped: number): void {
    const { many, long } = overBounds(b);
    const over = many || long.length > 0;
    if (!over && !skipped) return;
    this.say((t, lang) =>
      [
        over ? t.exportOverBounds : '',
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
        skipped ? plural(skipped, t.exportHomebrewSkippedN, lang) : ''
      ]
        .filter(Boolean)
        .join(' ')
    );
  }

  /**
   * Whether a signed-in reader's browser lists wait for the move: from sign-in until a
   * run ends with nothing left (or finds the lists another account's). They are
   * read-only and cannot be deleted meanwhile (docs/DECISIONS.md, 2026-09-26,
   * "Browser lists are read-only while the move is due").
   */
  get moveDue(): boolean {
    return !!this.user && !!this.legacyMove && this.legacyMove.status !== 'done';
  }

  /** Whether a browser list may be edited now: before the cutoff, and not while the move is due. */
  get localWritable(): boolean {
    return this.legacyWritable && !this.moveDue;
  }

  /**
   * Moves the address of a browser list's open page to the account list it moved into:
   * the list the page holds (`openList`), the `#/lists/<id>` on screen, or a `#/l/`
   * payload that matches a removed list. `replace`, so a waiting action is kept.
   */
  followMoved(removed: readonly MovedList[]): void {
    if (!removed.length) return;
    const into = (id: string): string | undefined =>
      removed.find((m) => m.list.id === id)?.accountId;
    const r = this.route;
    let to = this.openList ? into(this.openList) : undefined;
    if (!to && r.kind === 'storedList') to = into(r.listId);
    if (!to && r.kind === 'sharedList' && !r.packed) {
      const knows = (id: string): boolean => this.catalog?.byId.has(id) ?? false;
      const mine = findListByPayload(
        removed.map((m) => m.list),
        r.payload,
        knows
      );
      if (mine) to = into(mine.id);
    }
    if (!to) return;
    this.clearOpenList();
    this.replace(storedListHash(to));
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
     owner's topic is not joined; a failed first read, or a move the network
     stopped, is retried on every route, so the browser's lists move once the
     network returns. */
  #pollLists(): void {
    this.now = Date.now();
    this.#refreshShared(false);
    const lists = this.cloudLists;
    if (!lists || !this.user) return;
    const r = this.route;
    const shown =
      (r.kind === 'section' && r.section === 'lists') ||
      (r.kind === 'storedList' && lists.get(r.listId) !== undefined);
    const retry = lists.status === 'error' || this.legacyMove?.status === 'failed';
    if ((shown && !lists.live) || retry) void lists.refresh().then(() => this.#listsReady());
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
   * Returns the frozen copy of another account's item that `key` names: the open share's
   * first (the view holds a projection only while `#/s/` is on screen), then the first one an
   * account list holds. A frozen copy is drawn only where a list carries it: never in search,
   * tables or `#/i/` (docs/specs/FEATURES.md, "Lists"). Reads no route: `route` asks it.
   */
  frozenCopy(key: string): HomebrewRecord | undefined {
    if (!isHomebrewKey(key)) return undefined;
    const shown = snapshotRecords(this.sharedView?.shared).find((r) => r.id === key);
    if (shown) return shown;
    for (const l of this.cloudLists?.lists ?? []) {
      const copy = l.frozen?.[key];
      if (copy) return copy;
    }
    return undefined;
  }

  /** Returns the record `id` names: the catalogue's or an own item, else a frozen copy. */
  recordFor(id: string): Record_ | undefined {
    return this.index?.byId.get(id) ?? this.frozenCopy(id);
  }

  /** Whether `recordFor` finds a record for `id`. */
  knows(id: string): boolean {
    return this.recordFor(id) !== undefined;
  }

  /** How many account lists hold any of `keys`. */
  listsHolding(keys: readonly string[]): number {
    return (this.cloudLists?.lists ?? []).filter((l) => l.ids.some((id) => keys.includes(id)))
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
   * Where a list made now goes: `local` in a build with no sign-in, `wait`
   * while the session is unknown (nothing is drawn, so a signed-in reader
   * never sees the prompt flash), `prompt` signed out, `cloud` signed in.
   */
  get newListTarget(): 'local' | 'cloud' | 'prompt' | 'wait' {
    if (!this.cloudLists) return 'local';
    if (this.user === undefined) return 'wait';
    return this.user ? 'cloud' : 'prompt';
  }

  /** The store that holds `listId`: the account's, or this browser's. */
  storeFor(listId: string): ListModel {
    return this.cloudLists?.get(listId) ? this.cloudLists : this.lists;
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
    this.pendingListName = null;
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

  /* Waits for a user and the account's lists, and for a packed `#/l/`
     address to expand. */
  #runPending(): void {
    const action = this.#pending;
    const lists = this.cloudLists;
    if (!action || !this.user || lists?.status !== 'ready') return;
    /* The move settles first - it has not run yet (`idle`) or runs now -
       and `#listsReady` runs this again when it ends. */
    const move = this.legacyMove?.status;
    if (move === 'idle' || move === 'moving') return;
    if (action.do === 'addToList') {
      this.#pending = null;
      /* Only the bar's menu acts on the ticks; a card's acts on its record. */
      if (action.key === 'sel') {
        this.#clearTicks();
        for (const id of action.ids) this.sel.add(id);
        for (const [id, n] of Object.entries(action.picked ?? {})) this.picked.set(id, n);
      }
      this.pendingListName = action.name ?? null;
      this.menuFor = action.key;
      return;
    }
    const r = this.route;
    if (r.kind === 'sharedList' && r.packed) return;
    this.#pending = null;
    if (r.kind === 'share') {
      void this.saveShareCopy(r.token);
      return;
    }
    /* After the cutoff a `#/l/` address draws the retired page: nothing to save. */
    if (r.kind !== 'sharedList' || !this.legacyWritable) return;
    const d = decodeList(r.payload, (id) => this.catalog?.byId.has(id) ?? false);
    if (d) this.saveCopyOf(d);
  }

  /** Saves a shared list into the account and opens it. */
  saveCopyOf(d: DecodedList): void {
    const lists = this.cloudLists;
    if (!lists) return;
    const l = lists.create(d.name, copyInit(d));
    const name = l.name;
    this.say((t) => t.listCreated.replace('%s', name));
    this.go(storedListHash(l.id));
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
      /* A move skipped for the copy runs now. */
      void this.#listsReady();
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
    this.#stopListWatch?.();
    this.#stopListWatch = null;
    this.#stopAuth?.();
    this.#stopAuth = null;
    this.#stopHidden?.();
    this.#stopHidden = null;
    this.cloudLists?.unwatch();
    this.ownerRequests?.clear();
    this.homebrew?.clear();
    /* A timer left running past the listeners it would otherwise update is a
       leak of the same kind `#stopRouter`/`#stopListWatch` already guard
       against. */
    this.hideToast();
  }

  /**
   * Says something with no place on screen - a toast, off `showToast` in
   * app.js. Plain notices last 1600ms, an error 2600ms and `role="alert"`,
   * and one with an action 7000ms. A second call replaces the first and
   * restarts the clock, the same as the live app's single timer.
   */
  say(
    msg: Msg,
    opts: { error?: boolean | undefined; action?: ToastAction | undefined } = {}
  ): void {
    const mode: Toast['mode'] = opts.action ? 'act' : opts.error ? 'err' : '';
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

  hideToast(): void {
    this.#said = null;
    this.#toastLeft = null;
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
    return { base: this.env.router.base() };
  }

  /** The app's own address, for a link to a section or a filtered table. An
   *  address to hand somebody else, in the language on screen, so a messenger
   *  builds its preview in that language. */
  linkTo(hash: string): string {
    return appUrl(this.site, hash, this.lang);
  }

  /** A record's address, which is its stub page rather than the app.
   *  An address to hand somebody else, in the language on screen, so a
   *  messenger builds its preview in that language. */
  linkToRecord(id: string): string {
    return recordUrl(this.site, id, this.lang);
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

  /** The one route kind that reads the data at all: print needs to know
   *  which ids the cap threw away versus which were simply unknown.
   *  `$derived` rather than a getter: `Shell`, `App` and every page
   *  read this several times per render, and a getter re-parses the hash on
   *  each one. */
  route: Route = $derived.by(() => parseHash(this.hash, (id) => this.knows(id)));

  /** Which tab is lit. Nothing is lit on a record, a list page or a print
   *  sheet - the live `renderTabs` (app.js 3667-3673) compares against the
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
    this.hash = this.#fallback(hash);
    this.#forgetSignIn();
    this.#forgetPending();
    this.navigations++;
    this.menuFor = '';
    this.#clearTicks();
    this.#applySource();
    this.#expand();
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

  /** Switches the «Хоумбрю» chip: the own items in search and the equipment tables. */
  toggleHomebrew(): void {
    this.homebrewShown = !this.homebrewShown;
  }

  /**
   * Expands a packed shared-list address in place - the live `expandHash`
   * (app.js 3589-3603). Runs at the same three moments the live app calls it:
   * the constructor (after the first route is settled), every navigation the
   * router announces, and every `go()`. Never from `replace()` - the
   * expansion's own `replace` below would re-enter this.
   *
   * The live shape replaced the address unconditionally,
   * which meant a slow unpack resolving after the reader had already moved on
   * sent them back to the shared list. `stillHere()` re-reads `this.route`
   * at resolve time and both branches below drop the result unless the route
   * is still the exact packed payload this call started from.
   *
   * `unpack` hands back a payload still starting with `PACK_MARK` when the
   * port cannot decompress at all (the test env's `plainCompress`, and a
   * browser without `DecompressionStream` inside the real port's own catch) -
   * that is the same failure as a rejected promise. Both used to land on
   * `#/l/zzzz`, replacing the address the reader actually has; now both keep
   * it and record the failure in `expandFailed` instead, so `ListPage` can
   * draw the bad-link state without the address itself moving.
   */
  #expand(): void {
    const r = this.route;
    /* After the cutoff a packed link is never unpacked: it draws the retired page. */
    if (r.kind !== 'sharedList' || !r.packed || !this.legacyWritable) return;
    const { payload } = r;
    const stillHere = (): boolean => {
      const cur = this.route;
      return cur.kind === 'sharedList' && cur.packed && cur.payload === payload;
    };
    void this.env.compress
      .unpack(payload)
      .then((plain) => {
        if (!stillHere()) return;
        if (plain.startsWith(PACK_MARK)) {
          this.expandFailed = payload;
        } else {
          this.expandFailed = '';
          this.replace(sharedListHash(plain));
          this.#runPending();
        }
      })
      .catch(() => {
        if (!stillHere()) return;
        this.expandFailed = payload;
      });
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

  /**
   * Rewrites the address to the list's players' payload, in place - the live
   * `syncListUrl` (app.js 1596-1598). `replace` uses `replaceState`, which
   * fires no navigation, so this never re-enters the router's own `onChange`:
   * after it runs, the route's payload equals `urlPayload` and the same list
   * resolves, so the hash already matches and the effect that calls this
   * does not loop.
   */
  syncListUrl(l: StoredList): void {
    const want = this.#claimList(l);
    if (this.hash !== want) this.replace(want);
  }

  /**
   * Opens a list this tab just made (a restored or saved copy) at its
   * players' address, claimed by id as `syncListUrl` leaves it: matched by
   * content alone, a second copy of one link could open an older copy.
   */
  openNewList(l: StoredList): void {
    this.go(this.#claimList(l));
  }

  #claimList(l: StoredList): string {
    const payload = encodeList(l, true);
    this.openList = l.id;
    this.urlPayload = payload;
    return sharedListHash(payload);
  }

  /** The live app clears `S.openList`/`S.urlPayload` on every route that is
   *  not a list page. */
  clearOpenList(): void {
    this.openList = '';
    this.urlPayload = '';
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
   * can). `PageHead` passes it through from there; every other caller pins
   * `this.hash` exactly as before.
   */
  toggleHome(hash?: string): boolean {
    const current = hash ?? this.hash;
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

  /** Whether the "lists live in this browser only" notice has been dismissed. */
  get warnHidden(): boolean {
    return this.#warnHidden;
  }

  /** Dismisses the notice for good - the live `hideWarn`, which ignores a
   *  refused write the same way: storage refusing means the page is drawing
   *  the other, undismissable warning anyway. */
  hideWarn(): void {
    this.env.storage.set(WARN_KEY, '1');
    this.#warnHidden = true;
  }
}
