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
  EntryPatch,
  EntryRow,
  ListPatch,
  ListRow,
  NewListRow,
  ShareAudience,
  SharedRow,
  ShareRow
} from '../lib/cloudLists.js';
import type { Loot } from '../lib/data.js';
import type { PendingAction, SignInAfter } from '../lib/pending.js';
import type { Prefs } from '../lib/prefs.js';
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
  url: string;
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
  /** Any other refusal by the database. */
  | { ok: false; error: 'refused' };

/** `{ ok: false }` is signed out or a read that failed, never an empty account. */
export type ListsRead = { ok: true; lists: ListRow[] } | { ok: false };

/** The signed-in owner's lists (docs/specs/FEATURES.md, "Lists"). Every write is
 *  idempotent on the client-made ids, so a retry cannot duplicate a row. */
export interface ListRepository {
  /** A fresh list or entry id. */
  newId(): string;
  /** The owner's lists, each with its entries in list order. */
  list(): Promise<ListsRead>;
  /** Inserts the list and its entries; a second call with the same ids inserts nothing. */
  create(list: NewListRow, entries: EntryRow[]): Promise<ListWrite>;
  update(id: string, patch: ListPatch): Promise<ListWrite>;
  /** Inserts the entries; an id already there is left as it is. */
  addEntries(listId: string, entries: EntryRow[]): Promise<ListWrite>;
  updateEntry(entryId: string, patch: EntryPatch): Promise<ListWrite>;
  removeEntries(entryIds: string[]): Promise<ListWrite>;
  /** Sets every entry's position from its index in `entryIds` (`reorder_list`). */
  reorder(listId: string, entryIds: string[]): Promise<ListWrite>;
  remove(id: string): Promise<ListWrite>;
}

/** The owner's shares of one list, stopped ones included; `{ ok: false }` is signed out
 *  or a read that failed. */
export type SharesRead = { ok: true; shares: ShareRow[] } | { ok: false };
/** A share made, or why not. */
export type ShareMade =
  { ok: true; id: string; token: string } | Exclude<ListWrite, { ok: true }>;
/** `shared: null` is a link that opens nothing: stopped, deleted, unknown or malformed. */
export type SharedRead = { ok: true; shared: SharedRow | null } | { ok: false };

/** An account list's share links (docs/specs/FEATURES.md, "Account lists"). The owner
 *  makes and deletes them; anyone holding a token reads the list through it. */
export interface ShareRepository {
  /** The list's shares, stopped ones included; another user's list reads none. */
  list(listId: string): Promise<SharesRead>;
  /** The audience's active share, or a new one (`create_list_share`). */
  create(listId: string, audience: ShareAudience): Promise<ShareMade>;
  /** Stops the share; a stopped one stays as it is (`revoke_list_share`). */
  revoke(shareId: string): Promise<ListWrite>;
  /** The list as the link's audience sees it (`get_shared_list`), signed out too. */
  read(token: string): Promise<SharedRead>;
  /** The reader's own list id behind the token; null signed out, for another user's
   *  list, or when the read failed. */
  ownerOf(token: string): Promise<string | null>;
  /** Saves a copy of the link's list as the reader's list `id` (`clone_shared_list`);
   *  a second call with the same id copies nothing. */
  clone(token: string, id: string): Promise<ListWrite>;
}

/** Grows one member per release (R1 auth, R1 prefs, R2 lists and shares, ...). */
export interface CloudPort {
  auth: AuthPort;
  prefs: PreferencesPort;
  lists: ListRepository;
  shares: ShareRepository;
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
  /** null in an unconfigured build: no cloud control is drawn. */
  cloud: CloudPort | null;
}
