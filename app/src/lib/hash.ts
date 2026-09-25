/* Parsing and building the address.
 *
 * The grammar is frozen: docs/specs/ROUTES.md, with golden fixtures in
 * docs/fixtures/urls/routes.json. A link someone pasted into a chat has to keep
 * opening after the app is rewritten, so there is no "improved" form here - only
 * the ones already scattered across other people's messages.
 *
 * Pure module: `location` never appears; the address arrives as a string. */

import { decodeFilter, encodeFilter, groupsFor, type FilterState } from './filters.js';
import { QTY_MAX } from './listLink.js';
import { isSection, isTableId, type Lang, type Section, type TableId } from './types.js';

/** A packed link is marked with "~": base64url has no tilde and never can. */
export const PACK_MARK = '~';

/** More than this and the browser stalls. Twenty sheets of nine. */
export const PRINT_MAX = 180;

export const ACCOUNT_HASH = '#/account';

export type Route =
  | { kind: 'section'; section: Section }
  | { kind: 'tables'; table: TableId | null; anchor: string; filter: FilterState }
  | { kind: 'record'; id: string }
  /** `dropped` is how many known ids the cap threw away - the red note on
   *  the bar counts them, off `printTooMany`. */
  | {
      kind: 'print';
      ids: string[];
      dropped: number;
      /** Counts over 1 by id, off `*<n>` - the list link's own quantity grammar. */
      qty: Record<string, number>;
    }
  | { kind: 'storedList'; listId: string }
  | { kind: 'sharedList'; payload: string; packed: boolean }
  /** An account list's share link; `token` is the leading run of `[A-Za-z0-9_-]`,
   *  empty for a bare `#/s/` (docs/specs/ROUTES.md). */
  | { kind: 'share'; token: string }
  /** In every build: with no sign-in configured it draws the not-found page,
   *  so the address never falls home (docs/specs/ROUTES.md, "Account"). */
  | { kind: 'account' }
  /** Nothing could be read - the caller replaces it with the home section. */
  | { kind: 'unknown' };

/** The three section names that travel in old links, and what each turns on. */
const LEGACY: Record<string, { core: boolean; hnf: boolean }> = {
  'roll/core': { core: true, hnf: false },
  'roll/hnf': { core: false, hnf: true },
  'roll/all': { core: true, hnf: true }
};

const TABLES_RE = /^tables(?:\/([a-z_]+))?(?:\/([A-Za-z0-9_.-]+))?$/;
const TABLE_ALIASES: Record<string, TableId> = { frames: 'other_frames' };

/** Strips `#` and the leading `/`: everything below works on a bare path. */
export function stripHash(hash: string): string {
  return hash.replace(/^#\/?/, '');
}

/**
 * Which source an old section name turns on, if the hash is one of them.
 *
 * The address is not rewritten: an old link stays as it was written and keeps
 * working.
 */
export function legacySource(hash: string): { core: boolean; hnf: boolean } | null {
  return LEGACY[stripHash(hash)] ?? null;
}

/** Reads a print segment: known ids without repeats, and each kept id's
 *  count over 1, clamped. A repeated id keeps its first count. */
function readPrint(
  segment: string,
  knows: (id: string) => boolean
): { ids: string[]; qty: Record<string, number> } {
  const seen = new Set<string>();
  const ids: string[] = [];
  const qty: Record<string, number> = {};
  for (const token of segment.split('-')) {
    const star = token.indexOf('*');
    const id = star < 0 ? token : token.slice(0, star);
    if (!id || seen.has(id) || !knows(id)) continue;
    seen.add(id);
    ids.push(id);
    const n = star < 0 ? NaN : parseInt(token.slice(star + 1), 10);
    if (n > 1) qty[id] = Math.min(n, QTY_MAX);
  }
  return { ids, qty };
}

/** Ids the address asks for: known ones only, no repeats, uncapped - off
 *  `printAsked` in app.js. A `*<n>` count is read, not part of the id. */
export function printAsked(segment: string, knows: (id: string) => boolean): string[] {
  return readPrint(segment, knows).ids;
}

/** Ids to print: `printAsked`, capped at the limit. */
export function printIds(segment: string, knows: (id: string) => boolean): string[] {
  return printAsked(segment, knows).slice(0, PRINT_MAX);
}

/**
 * Parses the address. `knows` is only needed by print - no other branch asks
 * anything about the data.
 */
export function parseHash(hash: string, knows: (id: string) => boolean = () => true): Route {
  const h = stripHash(hash);

  if (h.startsWith('l/' + PACK_MARK)) {
    return { kind: 'sharedList', payload: h.slice(2), packed: true };
  }
  if (/^i\/[\w-]+$/.test(h)) return { kind: 'record', id: h.slice(2) };
  if (/^print\/[\w*-]+$/.test(h)) {
    const asked = readPrint(h.slice(6), knows);
    const ids = asked.ids.slice(0, PRINT_MAX);
    const qty: Record<string, number> = {};
    for (const id of ids) {
      const n = asked.qty[id];
      if (n) qty[id] = n;
    }
    return { kind: 'print', ids, dropped: asked.ids.length - ids.length, qty };
  }
  if (/^lists\/[\w-]+$/.test(h)) return { kind: 'storedList', listId: h.slice(6) };
  /* A stray character a chat client leaves after the token is dropped; the
     address is not rewritten. */
  if (/^s\//.test(h)) {
    return { kind: 'share', token: /^[A-Za-z0-9_-]*/.exec(h.slice(2))?.[0] ?? '' };
  }
  if (h === 'account') return { kind: 'account' };
  /* Was `/^l\/[A-Za-z0-9_-]+$/`: a stray character after the payload - a chat
     client swallowing a trailing full stop is the reachable case (R5) - used
     to fail the character class and fall through to `unknown`, which sent the
     whole address home instead of to the shared-list page's own "not found"
     screen. The payload itself is read as written, valid or not; decoding it
     is `decodeList`'s job, not the router's. */
  if (/^l\//.test(h)) {
    return { kind: 'sharedList', payload: h.slice(2), packed: false };
  }

  /* Old names lead to the same section; the source is read by legacySource() */
  if (LEGACY[h]) return { kind: 'section', section: 'roll/std' };

  const m = TABLES_RE.exec(h);
  if (m) {
    const name = m[1] ?? '';
    const tail = m[2] ?? '';
    /* A bare `#/tables` carries no name at all and keeps whichever table is
       already open - that case is untouched, hence null rather than
       'core_item'. A *named* table that is neither an alias nor a TableId
       used to be treated the same way (silently ignored, table kept); R9/Q3
       settled it the other way - one unreadable-address rule for every case,
       so it falls to `unknown` and the caller replaces it with the home
       section, the same as any other address nothing here can parse. */
    if (name && !TABLE_ALIASES[name] && !isTableId(name)) return { kind: 'unknown' };
    const table = name ? (TABLE_ALIASES[name] ?? (isTableId(name) ? name : null)) : null;
    return tail.startsWith('f_')
      ? {
          kind: 'tables',
          table,
          anchor: '',
          filter: decodeFilter(tail, table ? groupsFor(table) : [])
        }
      : { kind: 'tables', table, anchor: tail, filter: {} };
  }

  if (isSection(h)) return { kind: 'section', section: h };
  return { kind: 'unknown' };
}

/* ---------- back again ---------- */

export function sectionHash(section: Section): string {
  return '#/' + section;
}

export function recordHash(id: string): string {
  return '#/i/' + id;
}

/** Writes `*<n>` only for a count over 1, so a bare address stays byte-identical. */
export function printHash(
  ids: readonly string[],
  qty: Readonly<Record<string, number>> = {}
): string {
  return (
    '#/print/' +
    ids
      .map((id) => {
        const n = qty[id] ?? 0;
        return n > 1 ? `${id}*${String(Math.min(n, QTY_MAX))}` : id;
      })
      .join('-')
  );
}

export function sharedListHash(payload: string): string {
  return '#/l/' + payload;
}

export function storedListHash(listId: string): string {
  return '#/lists/' + listId;
}

export function shareHash(token: string): string {
  return '#/s/' + token;
}

/**
 * A table address. The anchor and the filter occupy the same slot, so they never
 * appear together - as in the app itself, where picking a filter drops the
 * anchor.
 */
export function tablesHash(
  table: TableId,
  opts: { anchor?: string; filter?: FilterState } = {}
): string {
  const seg = opts.filter ? encodeFilter(opts.filter, groupsFor(table)) : '';
  const tail = seg || opts.anchor || '';
  return '#/tables/' + table + (tail ? '/' + tail : '');
}

/* ---------- links to hand somebody else ---------- */

/** Where the page itself is. */
export interface Site {
  base: string;
}

/**
 * The address of the app itself.
 *
 * A web server serves `index.html` for the bare directory, so the file is not
 * named. With `lang` `en` the address goes through the English entry document
 * `en/`, which carries the English preview and redirects to the app
 * (docs/specs/I18N.md); without a language it is the app itself.
 */
export function appUrl(site: Site, hash: string, lang?: Lang): string {
  return site.base + (lang === 'en' ? 'en/' : '') + hash;
}

/**
 * The address of one record: the static stub in `i/`, not the app.
 *
 * The stub carries per-record Open Graph tags, so Telegram and Discord unfurl
 * the picture, the name and the description without anyone opening anything.
 * The stub of the language on screen: `i/<id>.html` Russian, `i/en/<id>.html`
 * English.
 */
export function recordUrl(site: Site, id: string, lang: Lang): string {
  return site.base + (lang === 'en' ? 'i/en/' : 'i/') + id + '.html';
}
