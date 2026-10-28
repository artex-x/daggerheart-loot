/* Parsing and building the address.
 *
 * The grammar is frozen: docs/specs/ROUTES.md, with golden fixtures in
 * docs/fixtures/urls/routes.json. A link someone pasted into a chat has to keep
 * opening after the app is rewritten, so there is no "improved" form here - only
 * the ones already scattered across other people's messages.
 *
 * Pure module: `location` never appears; the address arrives as a string. */

import {
  decodeFilter,
  encodeFilter,
  groupsFor,
  LIST_GROUPS,
  type FilterState
} from './filters.js';
import { canonJson, fnv1a128 } from './homebrew.js';
import { isSection, isTableId, type Lang, type Section, type TableId } from './types.js';

/** More than this and the browser stalls. Twenty sheets of nine. */
export const PRINT_MAX = 180;

export const ACCOUNT_HASH = '#/account';

/** The signed-in author's own items (docs/specs/ROUTES.md, "Homebrew"). */
export const HOMEBREW_HASH = '#/homebrew';

/** The four tabs of «Мои предметы» (docs/specs/ROUTES.md, "Homebrew"). */
export type HomebrewTab = 'items' | 'sources' | 'sets' | 'rules';

export type Route =
  | { kind: 'section'; section: Section }
  | { kind: 'tables'; table: TableId | null; anchor: string; filter: FilterState }
  | { kind: 'record'; id: string }
  /** One homebrew item by its id, for everyone; `id` is the leading run of
   *  `[0-9A-Fa-f-]`, lowercased (docs/specs/ROUTES.md). */
  | { kind: 'item'; id: string }
  /** A stored print set; `id` is the leading run of `[A-Za-z0-9_-]`, read by the page
   *  only at 12 characters (docs/specs/ROUTES.md). */
  | { kind: 'printSet'; id: string }
  /** Any address under `#/print/`: the retired print page, nothing read from it. */
  | { kind: 'printRetired' }
  | { kind: 'storedList'; listId: string }
  /** An old list link (`#/l/...`): the not-found page, the address kept
   *  (docs/specs/ROUTES.md). */
  | { kind: 'listRetired' }
  /** An account list's share link; `token` is the leading run of `[A-Za-z0-9_-]`,
   *  empty for a bare `#/s/`, and `filter` the optional `/f_` segment after it
   *  (docs/specs/ROUTES.md). */
  | { kind: 'share'; token: string; filter: FilterState }
  /** In every build: with no sign-in configured it draws the not-found page,
   *  so the address never falls home (docs/specs/ROUTES.md, "Account"). */
  | { kind: 'account' }
  /** The author's own items, one tab; like `account`, in every build. `key` opens one
   *  card and is only read on `sets` and `rules`. */
  | { kind: 'homebrew'; tab: HomebrewTab; key: string | null }
  /** The editor of one own item; `key` null is a new item. */
  | { kind: 'homebrewItem'; key: string | null }
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

/* URL ids follow the source product
   (docs/decisions/2026-10-21-source-names-follow-the-source-product.md); the
   internal ids are data keys and never change; an old id still parses. */
export const TABLE_SLUG: Partial<Record<TableId, string>> = {
  hnf_item: 'hope_and_fear_item',
  hnf_consumable: 'hope_and_fear_consumable',
  wondrous: 'wondrous_environments',
  dread: 'dread_gm_toolbox',
  voa: 'vault_of_ages',
  dv: 'dragons_vault',
  arazo: 'arazos_artifacts',
  community: 'community_items',
  mwt: 'many_worlds_tavern'
};
export const SECTION_SLUG: Partial<Record<Section, string>> = {
  'roll/wondrous': 'roll/wondrous_environments',
  'roll/dread': 'roll/dread_gm_toolbox',
  'roll/voa': 'roll/vault_of_ages',
  'roll/dv': 'roll/dragons_vault',
  'roll/arazo': 'roll/arazos_artifacts',
  'roll/community': 'roll/community_items',
  'roll/mwt': 'roll/many_worlds_tavern'
};
const TABLE_OF_SLUG = new Map(
  Object.entries(TABLE_SLUG).map(([id, slug]) => [slug, id as TableId])
);
const SECTION_OF_SLUG = new Map(
  Object.entries(SECTION_SLUG).map(([id, slug]) => [slug, id as Section])
);

/** Returns the internal table id a URL name stands for: a slug, an old id or an alias. */
function tableOfName(name: string): TableId | null {
  return TABLE_OF_SLUG.get(name) ?? TABLE_ALIASES[name] ?? (isTableId(name) ? name : null);
}

/**
 * Returns `hash` with a renamed old id in its name segment swapped for its slug,
 * the rest kept as written; any other address comes back unchanged. The legacy
 * `#/roll/core|hnf|all` names stay: `legacySource` reads them raw.
 */
export function canonicalHash(hash: string): string {
  const m = /^#\/(roll|tables)\/([a-z_]+)(.*)$/.exec(hash);
  if (!m) return hash;
  const [, kind = '', name = '', rest = ''] = m;
  const slug =
    kind === 'roll' ? SECTION_SLUG[('roll/' + name) as Section] : TABLE_SLUG[name as TableId];
  return slug ? '#/' + (kind === 'roll' ? slug : 'tables/' + slug) + rest : hash;
}

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

/**
 * Parses the address. No branch reads the data: no route takes ids from the address.
 */
export function parseHash(hash: string): Route {
  const h = stripHash(hash);

  if (/^l\//.test(h)) return { kind: 'listRetired' };
  if (/^i\/[\w-]+$/.test(h)) return { kind: 'record', id: h.slice(2) };
  if (/^print\//.test(h)) return { kind: 'printRetired' };
  if (/^lists\/[\w-]+$/.test(h)) return { kind: 'storedList', listId: h.slice(6) };
  /* A stray character a chat client leaves after the token or the filter is
     dropped; the address is not rewritten. */
  const share = /^s\/([A-Za-z0-9_-]*)(?:\/(f_[A-Za-z0-9_.-]*))?/.exec(h);
  if (share) {
    return {
      kind: 'share',
      token: share[1] ?? '',
      filter: decodeFilter(share[2] ?? '', LIST_GROUPS)
    };
  }
  /* A stray character a chat client leaves after the id is dropped; the address is not
     rewritten. */
  const set = /^p\/([A-Za-z0-9_-]*)/.exec(h);
  if (set) return { kind: 'printSet', id: set[1] ?? '' };
  if (/^h\//.test(h)) {
    return { kind: 'item', id: (/^[0-9A-Fa-f-]*/.exec(h.slice(2))?.[0] ?? '').toLowerCase() };
  }
  if (h === 'account') return { kind: 'account' };
  if (h === 'homebrew') return { kind: 'homebrew', tab: 'items', key: null };
  const tab = /^homebrew\/(?:(sources)|(sets|rules)(?:\/(hb_[a-z2-7]{16}))?)$/.exec(h);
  if (tab) {
    return tab[1]
      ? { kind: 'homebrew', tab: 'sources', key: null }
      : { kind: 'homebrew', tab: tab[2] as HomebrewTab, key: tab[3] ?? null };
  }
  const hb = /^homebrew\/(new|hb_[a-z2-7]{16})$/.exec(h);
  if (hb) return { kind: 'homebrewItem', key: hb[1] === 'new' ? null : (hb[1] ?? null) };
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
    const table = name ? tableOfName(name) : null;
    if (name && !table) return { kind: 'unknown' };
    return tail.startsWith('f_')
      ? {
          kind: 'tables',
          table,
          anchor: '',
          filter: decodeFilter(tail, table ? groupsFor(table) : [])
        }
      : { kind: 'tables', table, anchor: tail, filter: {} };
  }

  const section = SECTION_OF_SLUG.get(h) ?? (isSection(h) ? h : null);
  if (section) return { kind: 'section', section };
  return { kind: 'unknown' };
}

/** Returns whether a navigation keeps the ticks: between two «Мои предметы» tabs, and
 *  between two addresses of `#/tables/homebrew`, where a source chip is a filter change
 *  (docs/specs/STATE.md, the UI row). */
export function keepsTicks(from: Route, to: Route): boolean {
  if (from.kind === 'homebrew' && to.kind === 'homebrew') return true;
  return (
    from.kind === 'tables' &&
    to.kind === 'tables' &&
    from.table === 'homebrew' &&
    to.table === 'homebrew'
  );
}

/* ---------- back again ---------- */

export function sectionHash(section: Section): string {
  return '#/' + (SECTION_SLUG[section] ?? section);
}

export function recordHash(id: string): string {
  return '#/i/' + id;
}

/** The address of one homebrew item, for everyone. */
export function itemHash(hid: string): string {
  return '#/h/' + hid;
}

/** Returns a record's address: a homebrew item's by its id when the record carries one,
 *  else the record page's. */
export function recordHref(it: { id: string; src?: string; hid?: string }): string {
  return it.src === 'homebrew' && typeof it.hid === 'string'
    ? itemHash(it.hid)
    : recordHash(it.id);
}

/** The address of a stored print set. */
export function printSetHash(id: string): string {
  return '#/p/' + id;
}

/** The editor of an own item; null is a new item. */
export function homebrewItemHash(key: string | null): string {
  return HOMEBREW_HASH + '/' + (key ?? 'new');
}

/** Returns the address of one «Мои предметы» tab; `key` opens one card on `sets` and `rules`. */
export function homebrewTabHash(tab: HomebrewTab, key: string | null = null): string {
  return tab === 'items' ? HOMEBREW_HASH : HOMEBREW_HASH + '/' + tab + (key ? '/' + key : '');
}

export function storedListHash(listId: string): string {
  return '#/lists/' + listId;
}

/** Returns a share link's address; a filter with a value adds its `/f_` segment. */
export function shareHash(token: string, opts: { filter?: FilterState } = {}): string {
  const seg = opts.filter ? encodeFilter(opts.filter, LIST_GROUPS) : '';
  return '#/s/' + token + (seg ? '/' + seg : '');
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
  return '#/tables/' + (TABLE_SLUG[table] ?? table) + (tail ? '/' + tail : '');
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
 * The stub of the language on screen, extensionless: `i/<id>` Russian,
 * `i/en/<id>` English. `v` is the card's version from the build's map; a
 * changed card is a new URL to a messenger's cache (docs/specs/CONTRACTS.md
 * section 5).
 */
export function recordUrl(site: Site, id: string, lang: Lang, v?: string): string {
  return site.base + (lang === 'en' ? 'i/en/' : 'i/') + id + (v ? '?v=' + v : '');
}

/* ---------- the preview host ---------- */

const CARD_FAMILY = /^#\/(?:(?:h|s|p)\/.|tables\/[a-z_])/;
const HOMEBREW_TABLE = /^#\/tables\/homebrew(?:\/|$)/;

/** Returns the preview host's address of `hash` in `lang`, with `?v=<v>` when `v` is
 *  given, or null when `hash` is not a card family (`docs/specs/CONTRACTS.md` section 5). */
export function previewUrl(
  origin: string,
  hash: string,
  lang: Lang,
  v?: string
): string | null {
  if (!CARD_FAMILY.test(hash) || HOMEBREW_TABLE.test(hash)) return null;
  return origin + (lang === 'en' ? '/en' : '') + hash.slice(1) + (v ? '?v=' + v : '');
}

/** Returns the `v` of a preview link: 40 bits of the FNV-1a hash of `drawn`'s canonical
 *  JSON in base 36, so a changed card is a new URL to a messenger's cache. */
export function cardVersion(drawn: unknown): string {
  return (fnv1a128(canonJson(drawn)) >> 88n).toString(36);
}
