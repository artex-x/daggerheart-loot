/* Parsing and building the address.
 *
 * The grammar is frozen: docs/specs/ROUTES.md, with golden fixtures in
 * docs/fixtures/urls/routes.json. A link someone pasted into a chat has to keep
 * opening after the app is rewritten, so there is no "improved" form here - only
 * the ones already scattered across other people's messages.
 *
 * Pure module: `location` never appears; the address arrives as a string. */

import { decodeFilter, encodeFilter, groupsFor, type FilterState } from './filters.js';
import { isSection, isTableId, type Section, type TableId } from './types.js';

/** A packed link is marked with "~": base64url has no tilde and never can. */
export const PACK_MARK = '~';

/** More than this and the browser stalls. Twenty sheets of nine. */
export const PRINT_MAX = 180;

export type Route =
  | { kind: 'section'; section: Section }
  | { kind: 'tables'; table: TableId | null; anchor: string; filter: FilterState }
  | { kind: 'record'; id: string }
  | { kind: 'print'; ids: string[] }
  | { kind: 'storedList'; listId: string }
  | { kind: 'sharedList'; payload: string; packed: boolean }
  /** Nothing could be read - the caller replaces it with the home section. */
  | { kind: 'unknown' };

/** The three section names that travel in old links, and what each turns on. */
const LEGACY: Record<string, { core: boolean; hnf: boolean }> = {
  'roll/core': { core: true, hnf: false },
  'roll/hnf': { core: false, hnf: true },
  'roll/all': { core: true, hnf: true }
};

const TABLES_RE = /^tables(?:\/([a-z_]+))?(?:\/([A-Za-z0-9_.-]+))?$/;

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

/** Ids to print: known ones only, no repeats, never more than the limit. */
export function printIds(segment: string, knows: (id: string) => boolean): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of segment.split('-')) {
    if (!id || seen.has(id) || !knows(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length === PRINT_MAX) break;
  }
  return out;
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
  if (/^print\/[\w-]+$/.test(h)) return { kind: 'print', ids: printIds(h.slice(6), knows) };
  if (/^lists\/[\w-]+$/.test(h)) return { kind: 'storedList', listId: h.slice(6) };
  if (/^l\/[A-Za-z0-9_-]+$/.test(h)) {
    return { kind: 'sharedList', payload: h.slice(2), packed: false };
  }

  /* Old names lead to the same section; the source is read by legacySource() */
  if (LEGACY[h]) return { kind: 'section', section: 'roll/std' };

  const m = TABLES_RE.exec(h);
  if (m) {
    const name = m[1] ?? '';
    const tail = m[2] ?? '';
    /* A name that is not in the list does not reset the table to a default: the
       caller keeps whichever is already open. Hence null, not 'core_item'. */
    const table = name && isTableId(name) ? name : null;
    return tail.startsWith('f_')
      ? { kind: 'tables', table, anchor: '', filter: decodeFilter(tail) }
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

export function printHash(ids: readonly string[]): string {
  return '#/print/' + ids.join('-');
}

export function sharedListHash(payload: string): string {
  return '#/l/' + payload;
}

export function storedListHash(listId: string): string {
  return '#/lists/' + listId;
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

/** Where the page itself is, and whether a server is serving it. */
export interface Site {
  base: string;
  hosted: boolean;
}

/**
 * The address of the app itself.
 *
 * A web server serves `index.html` for the bare directory, so naming the file
 * only adds noise. Opened from a folder there is nothing to serve and the file
 * has to be named, or the link opens the directory listing.
 */
export function appUrl(site: Site, hash: string): string {
  return site.base + (site.hosted ? '' : 'index.html') + hash;
}

/**
 * The address of one record.
 *
 * On a real host this is the static stub in `i/`, not the app: the stub carries
 * per-record Open Graph tags, so Telegram and Discord unfurl the picture, the
 * name and the description without anyone opening anything. From a folder there
 * is no stub, so the in-app route is the only thing that can be linked.
 */
export function recordUrl(site: Site, id: string): string {
  return site.hosted ? `${site.base}i/${id}.html` : appUrl(site, recordHash(id));
}
