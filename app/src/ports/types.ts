/* Ports: the seams where the app meets the browser.
 *
 * Everything with a plausible second implementation is named here as an
 * interface, and nothing else in the app is allowed to reach for the browser
 * global behind it. Two reasons, both practical rather than architectural
 * taste:
 *
 * - every one of these can fail in a way that is not a bug. Storage throws in a
 *   private window, the clipboard is refused outside a secure context, the
 *   share sheet is dismissed by the person using it, compression does not exist
 *   in an older browser. Each port says so in its type, so a caller cannot
 *   forget the case;
 * - none of them can be exercised in a unit test as a global. As an argument
 *   they can, which is the difference between testing the behaviour and testing
 *   that a browser exists.
 *
 * `app/src/lib` may not import this file: pure logic stays pure, and a port is
 * already an admission that something outside is involved. ESLint enforces both
 * directions. */

/* ---------- storage ---------- */

/**
 * Key-value storage, which may simply not work.
 *
 * A private window, a browser with site data disabled, or a full quota all
 * throw rather than returning nothing, so every method here is total: reads
 * answer `null`, writes answer whether they succeeded. The app shows a warning
 * and keeps running; it does not pretend the lists are saved.
 */
import type {
  ImportRow,
  LinkedRow,
  ListOp,
  ListRow,
  ShareAudience,
  SharedRow,
  ShareRow
} from '../lib/cloudLists.js';
import type { Loot } from '../lib/data.js';
import type {
  BookContent,
  BookRow,
  CardContent,
  CardRow,
  HomebrewContent,
  ItemRow,
  NewBookRow,
  NewCardRow,
  NewItemRow
} from '../lib/homebrew.js';
import type { HomebrewImported, HomebrewImportRows } from '../lib/homebrewFile.js';
import type { PendingAction, SignInAfter } from '../lib/pending.js';
import type { Prefs } from '../lib/prefs.js';
import type { NoticeRow, OwnerRequest, ShortLine } from '../lib/requests.js';
import type { Random } from '../lib/roll.js';

export interface StoragePort {
  get(key: string): string | null;
  set(key: string, value: string): boolean;
  remove(key: string): void;
  /** Whether storage works at all - what the warning in the lists section asks. */
  works(): boolean;
  /**
   * Another tab wrote to a key, or - `null` - this tab has reason to believe
   * it might have missed one (R2). The whole two-tab merge hangs off this,
   * so it is part of the port rather than something a component wires up
   * itself. `null` covers `localStorage.clear()`, which fires a `storage`
   * event with no key at all, and the two moments a backgrounded tab is
   * given no `storage` event for anyway - becoming visible again, and a
   * back-forward-cache restore - both of which a caller answers the same
   * way it answers a named key: reload and merge.
   */
  onExternalChange(fn: (key: string | null) => void): () => void;
}

/* ---------- clipboard ---------- */

export interface RichText {
  html: string;
  plain: string;
}

/**
 * Copying, which is allowed to fail and must then fall back rather than throw.
 *
 * Rich copy puts both `text/html` and `text/plain` on the clipboard so that
 * Telegram, Word and Notion take the formatted one and everything else takes
 * clean text. Markdown asterisks are deliberately not used: where they are not
 * parsed they are litter.
 */
export interface ClipboardPort {
  /** Resolves to whether the text actually made it. */
  writeText(text: string): Promise<boolean>;
  /** Falls back to plain text where rich copy is unavailable. */
  writeRich(text: RichText): Promise<boolean>;
  /** Browsers refuse WebP, so an image is converted before it is offered. */
  writeImage(png: () => Promise<Blob>): Promise<boolean>;
}

/* ---------- sharing ---------- */

export interface Shareable {
  title: string;
  text: string;
  /** Absent for a record that has no address another person can open (an own item). */
  url?: string;
  /** Optional picture. Sharing must still work when it fails to load. */
  file?: () => Promise<File>;
}

export type ShareResult =
  | 'shared'
  /** The person dismissed the sheet. Not a failure, and must not be reported as one. */
  | 'dismissed'
  /** No share sheet here; the caller falls back to copying the link. */
  | 'unsupported'
  | 'failed';

export interface SharePort {
  available(): boolean;
  share(what: Shareable): Promise<ShareResult>;
}

/* ---------- the address ---------- */

/**
 * Reading and writing the hash.
 *
 * `replace` exists separately from `navigate` because the difference is
 * load-bearing: the filter segment is rewritten on every click and must not
 * fill the back button, while opening a list is a step a person expects to be
 * able to undo.
 */
export interface RouterPort {
  hash(): string;
  navigate(hash: string): void;
  replace(hash: string): void;
  onChange(fn: (hash: string) => void): () => void;
  /**
   * Where the page itself lives, with any hash stripped and `index.html` off
   * the end - a web server serves the directory, so naming the file is noise.
   */
  base(): string;
  /** How many entries back there are, so a print page knows whether to offer one. */
  canGoBack(): boolean;
  back(): void;
}

/* ---------- short links ---------- */

/**
 * Compressing a list payload.
 *
 * Optional in the strict sense: `CompressionStream` may be absent, and the
 * plain form has to keep working when it is. `pack` therefore returns whichever
 * came out shorter - for a list of three entries with no notes, compression
 * only adds length.
 */
export interface CompressPort {
  available(): boolean;
  pack(raw: string): Promise<string>;
  /** Accepts either form; the marker on the front says which it is. */
  unpack(payload: string): Promise<string>;
}

/* ---------- confirming ---------- */

/**
 * The browser's own dialogs: a confirm, and the print dialog.
 *
 * Deleting a list is `confirm`'s only caller: `confirm()` blocks the calling
 * script until it is answered, which a headless driver cannot do without
 * help, and a test cannot exercise as a global at all. `print` is the same
 * kind of seam - `window.print()` opens UI this app does not control - so it
 * lives on this port rather than opening a new `Env` key for one method.
 */
export interface DialogPort {
  confirm(message: string): boolean;
  print(): void;
}

/* ---------- dragging ---------- */

export interface DragHandlers {
  /** Where the entry ended up, both indices zero-based. */
  onDrop(from: number, to: number): void;
  /** dragstart: which row is being dragged. */
  onDrag?(from: number): void;
  /** dragover: where the entry would land; `null` when it would not move, or
   *  when the pointer has left the list. `over` is always `-1` when `where`
   *  is `null`, not only for the "left the list" case. */
  onOver?(over: number, where: 'before' | 'after' | null): void;
  /** dragend, and after a drop: no row is dragged, no row is marked. */
  onEnd?(): void;
}

/**
 * Reordering by dragging.
 *
 * Native HTML5 drag first, as the plan asks: it costs nothing, it is
 * keyboard-reachable through the position field beside every row, and a
 * library would have to earn its way in past that.
 */
export interface DragPort {
  /** Binds a container whose children carry `data-index`. Returns an unbind. */
  bind(container: HTMLElement, handlers: DragHandlers): () => void;
}

/* ---------- everything at once ---------- */

/**
 * What the app is handed instead of the browser.
 *
 * One object rather than six imports, so a test can swap the whole outside
 * world in a line and a component never has to know which of these is real.
 */
/**
 * The dataset.
 *
 * `data.js` is a classic script that assigns `window.LOOT`: it is cached apart
 * from the bundle and needs no async bootstrap - CONTRACTS.md section 4. That
 * makes reading it a browser fact rather than an import, and `null` a real
 * answer: if the script failed to load the app has to say so rather than render
 * an empty catalogue as though it were the truth.
 */
export interface DataPort {
  load(): Loot | null;
}

/**
 * The installable app.
 *
 * `register` answers `'unsupported'` where the browser has no service worker
 * container; the worker it registers caches the pictures and the hashed
 * build files (docs/specs/META.md section 9).
 */
export type Registration = 'registered' | 'unsupported' | 'failed';

export type Persistence = 'persisted' | 'denied' | 'skipped';

export interface PwaPort {
  /** Registers `./sw.js`. */
  register(): Promise<Registration>;
  /** Whether the page runs as an installed app (standalone display mode). */
  standalone(): boolean;
  /** Asks the browser to keep this origin's storage under storage pressure;
   *  only in the installed app. */
  persist(): Promise<Persistence>;
}

export interface MotionPort {
  /** Whether the reader asked for less motion; read per call, the setting
   *  can change while the page is open. */
  reduced(): boolean;
}

/**
 * The page going out of sight: the tab hidden, or the page closed or left.
 * The account's write buffer is sent at once then (docs/specs/FEATURES.md,
 * "Account and browser lists").
 */
export interface PagePort {
  /** Calls `fn` on `visibilitychange` to hidden and on `pagehide`. Returns an unsubscribe. */
  onHidden(fn: () => void): () => void;
  /** Asks the browser's own prompt before the page closes while `dirty()` answers true.
   *  Returns the removal. */
  guardUnload(dirty: () => boolean): () => void;
}

/**
 * The time of day the app reads for the legacy write cutoff. A test build pins it
 * (`?today=`), so its states stay on one side of the date whatever day they run.
 */
export interface ClockPort {
  now(): number;
  /** True only in a test build opened with `?toasts=held`: a toast then stays until the
   *  next one replaces it, so a capture that arrives late still reads it. */
  holdsToasts?(): boolean;
}

/* ---------- cloud ---------- */

export type Provider = 'google' | 'discord';

export interface Identity {
  id: string;
  provider: Provider;
  email: string;
}

export interface Session {
  userId: string;
  email: string;
  /** The account's first provider; null when it is neither Google nor
   *  Discord (an email identity). */
  provider: Provider | null;
}

export type AuthError = 'alreadyLinked' | 'lastIdentity' | 'failed';

/** A refusal is an answer, not a throw - the way `ClipboardPort` and
 *  `SharePort` report failure. */
export type AuthResult = { ok: true } | { ok: false; error: AuthError };

/** How a provider redirect this page load came back from ended. */
export interface AuthRedirect {
  kind: 'signIn' | 'link';
  provider: Provider | null;
  result: AuthResult;
  /** What the sign-in prompt that led here asked to finish; null when none did. */
  action: PendingAction | null;
}

export interface AuthPort {
  session(): Promise<Session | null>;
  /** `[]` signed out; `null` when a signed-in read failed, so a caller never
   *  mistakes "could not read" for "none connected". The fake never answers
   *  null. */
  identities(): Promise<Identity[] | null>;
  /** Starts the provider redirect; the fake signs the seed's default user in.
   *  A redirect that cannot start is a refusal, answered at once; a started
   *  one leaves the page, so the real port answers only if this page comes
   *  back from the back-forward cache. `after` names the page the redirect
   *  returns to and the action it finishes there; the fake ignores it. */
  signIn(provider: Provider, after?: SignInAfter): Promise<AuthResult>;
  /** Like `signIn`; the fake links in place and answers at once. */
  link(provider: Provider): Promise<AuthResult>;
  unlink(identityId: string): Promise<AuthResult>;
  signOut(scope?: 'local' | 'global'): Promise<AuthResult>;
  deleteAccount(): Promise<AuthResult>;
  onChange(fn: (session: Session | null) => void): () => void;
  /** The outcome of the provider redirect that opened this page, or null
   *  when none did - one answer per page load. A link refused on the
   *  provider's side reaches the page only here. */
  redirectResult(): Promise<AuthRedirect | null>;
}

/** A read of the account's preferences: `prefs: null` is an account with
 *  no row yet; `{ ok: false }` is signed out or a read that failed, never
 *  null, so a failed read cannot pass as an empty account and be seeded
 *  over. */
export type PrefsRead = { ok: true; prefs: Prefs | null } | { ok: false };

/** The signed-in reader's preferences, one row per account
 *  (docs/specs/STATE.md, "Account preferences"). */
export interface PreferencesPort {
  load(): Promise<PrefsRead>;
  /** Replaces the whole row with `p` - a field `p` lacks is gone. Answers
   *  false signed out or refused. */
  save(p: Prefs): Promise<boolean>;
}

/** A write's answer; a refusal is an answer, never a throw. */
export type ListWrite =
  | { ok: true }
  /** No answer: offline, a 5xx, a thrown fetch. The write may be sent again. */
  | { ok: false; error: 'network' }
  /** A count limit (`limit: <key>`); `value` is the limit the database applied. */
  | { ok: false; error: 'limit'; key: string; value: number | null }
  /** Any other refusal by the database; `tooSlow` (only `import` sets it) is a call the
   *  database stopped at its statement timeout, which the same call would reach again. */
  | { ok: false; error: 'refused'; reason?: 'tooSlow' };

/** `{ ok: false }` is signed out or a read that failed, never an empty account. `kept`
 *  names the lists whose revision equals the one the caller holds; their rows are not
 *  sent, and an id in neither `lists` nor `kept` is gone. A limit is null for no limit and
 *  undefined when its read failed, so the caller keeps the limit it knows. */
export type ListsRead =
  | {
      ok: true;
      lists: ListRow[];
      kept?: readonly string[];
      listLimit: number | null | undefined;
      entryLimit: number | null | undefined;
    }
  | { ok: false };

/** One write's answer inside an `apply` call: never `network`; `gone` when the row it
 *  edits was deleted or is not the caller's (`P0002`). */
export type ListOpResult =
  Exclude<ListWrite, { error: 'network' }> | { ok: false; error: 'gone' };

/** An `apply` call's answer: a result per write, or the call's own failure. */
export type ListWrites =
  | { ok: true; results: ListOpResult[] }
  /** No answer, a lapsed session or a passing server fault: the call may be sent again. */
  | { ok: false; error: 'network' }
  /** The database failed the call itself (a statement timeout, a defect): the caller
   *  counts it and splits a request that keeps failing. */
  | { ok: false; error: 'fault' }
  /** The call was refused whole: every write in it is dropped. */
  | { ok: false; error: 'refused' };

/** A browser list's move: the account row, and whether this call made it (false: the
 *  owner moved the same text before, and the answer is that first row). */
export type MoveWrite =
  | { ok: true; id: string; inserted: boolean }
  /** No answer, a lapsed session or a row deleted during the move: the next load moves
   *  it again. */
  | { ok: false; error: 'network' }
  /** The text is not a list the database takes. */
  | { ok: false; error: 'refused' };

/** The signed-in owner's lists (docs/specs/FEATURES.md, "Lists"). Every write is
 *  idempotent on the client-made ids, so a retry cannot duplicate a row. */
export interface ListRepository {
  /** A fresh list or entry id. */
  newId(): string;
  /** The owner's lists, each with its entries in list order; the real port orders them
   *  newest first, the fake in its own order. `known` maps a list id to the revision the
   *  caller holds: a list still at that revision answers in
   *  `kept`, not in `lists`. */
  list(known?: Readonly<Record<string, number>>): Promise<ListsRead>;
  /** Applies the writes in order in one request (`apply_list_writes`), each on its own:
   *  a refused write rolls back alone. */
  apply(ops: ListOp[]): Promise<ListWrites>;
  /** Moves one browser list, as its canonical text, into the account as the list `id`
   *  (`move_legacy_list`); idempotent per owner on the text. Exempt from the count
   *  limits (docs/specs/FEATURES.md, "Account and browser lists"). */
  move(id: string, canonical: string): Promise<MoveWrite>;
  /** Inserts every list and entry in one transaction (`import_lists`), or nothing; a list
   *  id already the caller's is a retry and adds only its missing entries. */
  import(lists: ImportRow[]): Promise<ListWrite>;
  /** The records of the homebrew items `ids` name, of any account (`get_homebrew_items`, at
   *  most 1000 ids a call: more go in several calls); an id with no item answers nothing.
   *  `{ ok: false }` is signed out or a read that failed. */
  items(ids: readonly string[]): Promise<{ ok: true; items: LinkedRow[] } | { ok: false }>;
  /** One homebrew item by its id, for anyone, signed out too (`get_homebrew_item`): the raw
   *  answer, which `itemOf` reads; `item` null for an id no item has. `{ ok: false }` is a
   *  read that failed. */
  item(id: string): Promise<{ ok: true; item: unknown } | { ok: false }>;
}

/** The owner's shares of one list, stopped ones included; `{ ok: false }` is signed out
 *  or a read that failed. */
export type SharesRead = { ok: true; shares: ShareRow[] } | { ok: false };
/** A share made, or why not. */
export type ShareMade =
  { ok: true; id: string; token: string } | Exclude<ListWrite, { ok: true }>;
/** `shared: null` is a link that opens nothing: stopped, deleted, unknown or malformed.
 *  `unchanged` answers a read that named a revision the list has not passed. */
export type SharedRead =
  | { ok: true; shared: SharedRow | null; unchanged?: never }
  | { ok: true; unchanged: true; shared?: never }
  | { ok: false };

/** An account list's share links (docs/specs/FEATURES.md, "Account and browser lists"). The owner
 *  makes and deletes them; anyone holding a token reads the list through it. */
export interface ShareRepository {
  /** The list's shares, stopped ones included; another user's list reads none. */
  list(listId: string): Promise<SharesRead>;
  /** The audience's active share, or a new one (`create_list_share`). */
  create(listId: string, audience: ShareAudience): Promise<ShareMade>;
  /** Stops the share; a stopped one stays as it is (`revoke_list_share`). */
  revoke(shareId: string): Promise<ListWrite>;
  /** The list as the link's audience sees it (`get_shared_list`), signed out too. With
   *  `since`, a list whose revision is at most `since` answers `unchanged`. */
  read(token: string, since?: number): Promise<SharedRead>;
  /** The reader's own list id behind the token; null signed out, for another user's
   *  list, or when the read failed. */
  ownerOf(token: string): Promise<string | null>;
  /** Saves a copy of the link's list as the reader's list `id` (`clone_shared_list`);
   *  a second call with the same id copies nothing. */
  clone(token: string, id: string): Promise<ListWrite>;
}

/** A feed's channel joined (`live`) or lost (`down`). */
export type LiveStatus = 'live' | 'down';

/** Private Realtime topics (docs/specs/FEATURES.md, "Account and browser lists"). */
export interface EventsPort {
  /** Joins `topic` on a private channel; `status` reports the join and each loss.
   *  Returns the leave. A message is untyped here; `lib/live.ts` reads it. */
  subscribe(
    topic: string,
    on: { message(event: string, payload: unknown): void; status(s: LiveStatus): void }
  ): () => void;
  /** This page load's id, sent as `x-dhloot-tab` on every PostgREST request. */
  readonly tab: string;
}

/** A request's send: `gone` is a link that opens nothing, `stale` an item the list no
 *  longer holds, `limit` a bound of the function (`limit: <key>`). */
export type RequestSent =
  | { ok: true }
  | { ok: false; error: 'gone' | 'stale' | 'network' | 'refused' }
  | { ok: false; error: 'limit'; key: string; value: number | null };
/** An apply: the count taken, the lines the stock cannot fill, or why not. `gone` is a
 *  request that no longer exists or is not the caller's. */
export type RequestApplied =
  | { ok: true; taken: number }
  | { ok: false; error: 'short'; short: ShortLine[] }
  | { ok: false; error: 'decided' | 'expired' | 'gone' | 'network' | 'refused' };
/** A decline, or why not; the errors read as an apply's. */
export type RequestDeclined =
  { ok: true } | { ok: false; error: 'decided' | 'expired' | 'gone' | 'network' | 'refused' };
/** `{ ok: false }` is signed out or a read that failed, never an empty account. */
export type RequestsRead = { ok: true; requests: OwnerRequest[] } | { ok: false };

/** Purchase requests from a share link to its list's owner (docs/specs/FEATURES.md,
 *  "Account and browser lists"). Any link holder sends; the owner reads and decides. */
export interface RequestRepository {
  /** The signed-in owner's pending requests over all lists, lines included; expired rows
   *  too (the caller hides them by `expiresAt`). */
  list(): Promise<RequestsRead>;
  /** `id` is made by the caller; the same id again is a replay that inserts nothing and
   *  answers ok. */
  send(id: string, token: string, lines: { item: string; qty: number }[]): Promise<RequestSent>;
  /** Takes the request's counts from its list; `clamp` takes what is there. */
  apply(id: string, clamp: boolean): Promise<RequestApplied>;
  decline(id: string): Promise<RequestDeclined>;
  /** Marks the list's unread requests (and notices) read now (`mark_list_read`): each such
   *  request expires an hour later at most. Only unread rows change. */
  markRead(listId: string): Promise<ListWrite>;
  /** The signed-in owner's change-log rows, newest first: of one list with `listId`, else of
   *  every list, which PostgREST cuts at its row cap (`max_rows`), so only a count reads it.
   *  `{ ok: false }` is signed out or a read that failed. */
  notices(listId?: string): Promise<{ ok: true; notices: NoticeRow[] } | { ok: false }>;
  /** Deletes the list's notices `ids` (the owner's «Скрыть»); a row already gone is ok. */
  hideNotices(listId: string, ids: readonly string[]): Promise<ListWrite>;
}

/** `{ ok: false }` is signed out or a read that failed; a limit is null for no limit and
 *  undefined when its read failed, so the caller keeps the limit it knows. */
export type HomebrewRead =
  | {
      ok: true;
      books: BookRow[];
      items: ItemRow[];
      cards: CardRow[];
      itemLimit: number | null | undefined;
      bookLimit: number | null | undefined;
      cardLimit: number | null | undefined;
    }
  | { ok: false };
/** An update's answer: the row's new revision, or why not. */
export type HomebrewSaved =
  | { ok: true; revision: number }
  | { ok: false; error: 'conflict' | 'gone' }
  | Exclude<ListWrite, { ok: true }>;

/** An import's answer: the counts, or why not; `refused` with `tooSlow` is a call the
 *  database stopped at its statement timeout, as for a lists import. */
export type HomebrewImport =
  { ok: true; counts: HomebrewImported } | Exclude<ListWrite, { ok: true }>;
/** A move's answer: `conflict` - an item's revision is no longer the one sent; `gone` - the
 *  target source or section no longer exists; `refused` - any other refusal, a timeout
 *  included. Nothing moved unless ok. */
export type HomebrewMoved =
  { ok: true } | { ok: false; error: 'conflict' | 'gone' } | Exclude<ListWrite, { ok: true }>;

/** The signed-in author's homebrew
 *  (docs/decisions/2026-09-30-a-homebrew-item-carries-the-whole-catalog-shape.md). Row level
 *  security keeps every row the author's; a create is idempotent on the client-made id. */
export interface HomebrewRepository {
  newId(): string;
  /** A fresh `hb_` key for a source, a section or an item. */
  newKey(): string;
  load(): Promise<HomebrewRead>;
  createBook(row: NewBookRow): Promise<ListWrite>;
  /** `revision` null writes whatever the row's revision is. */
  updateBook(id: string, content: BookContent, revision: number | null): Promise<HomebrewSaved>;
  removeBook(id: string): Promise<ListWrite>;
  createItem(row: NewItemRow): Promise<ListWrite>;
  updateItem(
    id: string,
    patch: { content: HomebrewContent; book_id: string | null },
    revision: number | null
  ): Promise<HomebrewSaved>;
  removeItem(id: string): Promise<ListWrite>;
  /** A set card or a rule card; its kind never changes after the create. */
  createCard(row: NewCardRow): Promise<ListWrite>;
  updateCard(
    id: string,
    patch: { content: CardContent; book_id: string | null },
    revision: number | null
  ): Promise<HomebrewSaved>;
  removeCard(id: string): Promise<ListWrite>;
  /** Writes a homebrew file's sources, cards and items in one call (`import_homebrew`),
   *  every row or none; a held key is skipped, or rewritten with `update`. */
  import(rows: HomebrewImportRows): Promise<HomebrewImport>;
  /** Moves items to a source (null: the default one) and one of its sections (null: none)
   *  in one call (`move_homebrew_items`), every item or none; each item names the revision
   *  the caller read. */
  moveItems(
    items: readonly { id: string; revision: number }[],
    bookId: string | null,
    section: string | null
  ): Promise<HomebrewMoved>;
}

/** Grows one member per release (R1 auth, R1 prefs, R2 lists and shares, R3 events, R4
 *  requests, R7 homebrew, ...). */
export interface CloudPort {
  auth: AuthPort;
  prefs: PreferencesPort;
  lists: ListRepository;
  shares: ShareRepository;
  events: EventsPort;
  requests: RequestRepository;
  homebrew: HomebrewRepository;
}

/**
 * Redrawing a picture as something the clipboard will accept.
 *
 * The art is WebP and no browser will put WebP on a clipboard, so it goes
 * through a canvas first. Canvas, Image and toBlob do not exist in jsdom, which
 * is why this is a port rather than a helper.
 */
export interface ImagePort {
  /** A PNG of whatever is at `src`. Rejects if it cannot be drawn - a tainted
   *  canvas (D10) among the reasons, indistinguishable here from any other
   *  failure: the caller falls back the same way regardless of why. */
  pngOf(src: string): Promise<Blob>;
  /** D14: saves a blob as a file, the fallback for a clipboard that will not
   *  take the picture. Resolves once the download was triggered - there is
   *  no way to know whether the browser's own save dialog then completed. */
  download(blob: Blob, filename: string): Promise<void>;
}

export interface Env {
  data: DataPort;
  image: ImagePort;
  /**
   * Where a roll comes from.
   *
   * `Math.random` in a browser, a fixed sequence in a test. Without this a test
   * of a roll can only assert that something came up, which is the assertion
   * that lets a wrong table through.
   */
  random: Random;
  storage: StoragePort;
  clipboard: ClipboardPort;
  share: SharePort;
  router: RouterPort;
  compress: CompressPort;
  drag: DragPort;
  dialog: DialogPort;
  pwa: PwaPort;
  motion: MotionPort;
  page: PagePort;
  clock: ClockPort;
  /** null in an unconfigured build: no cloud control is drawn. */
  cloud: CloudPort | null;
}
