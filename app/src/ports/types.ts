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
import type { Loot } from '../lib/data.js';

export interface StoragePort {
  get(key: string): string | null;
  set(key: string, value: string): boolean;
  remove(key: string): void;
  /** Whether storage works at all - what the warning in the lists section asks. */
  works(): boolean;
  /**
   * Another tab wrote to a key. The whole two-tab merge hangs off this, so it
   * is part of the port rather than something a component wires up itself.
   */
  onExternalChange(fn: (key: string) => void): () => void;
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
  /**
   * Whether a server is serving this, rather than a folder on disk.
   *
   * It changes what a shared link may point at: on a host there are stub pages
   * with Open Graph tags for messengers to unfurl, and from disk there are not.
   * `lib/hash.ts` holds that rule; this only reports the fact.
   */
  hosted(): boolean;
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

/* ---------- dragging ---------- */

export interface DragHandlers {
  /** Where the entry ended up, both indices zero-based. */
  onDrop(from: number, to: number): void;
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
 * `data.js` is a classic script that assigns `window.LOOT`, because a page
 * opened from a folder cannot fetch a local JSON - CONTRACTS.md section 4. That
 * makes reading it a browser fact rather than an import, and `null` a real
 * answer: if the script failed to load the app has to say so rather than render
 * an empty catalogue as though it were the truth.
 */
export interface DataPort {
  load(): Loot | null;
}

export interface Env {
  data: DataPort;
  storage: StoragePort;
  clipboard: ClipboardPort;
  share: SharePort;
  router: RouterPort;
  compress: CompressPort;
  drag: DragPort;
}
