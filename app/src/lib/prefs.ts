/* The reader's preferences as one object: what `dhloot.prefs.v1` holds and
 * what the account keeps for a signed-in reader (docs/specs/STATE.md,
 * "Account preferences"). Type imports only, so the hosted E2E can load it
 * under Node's type stripping with nothing behind it. */

import type { Lang } from './types.js';

export interface Prefs {
  lang?: Lang;
  /** The pinned starting section, as an address (`#/...`). */
  home?: string;
  view?: 'list' | 'grid';
  printBw?: boolean;
  printCompact?: boolean;
}

const HOME_MAX = 2048;

/** Reads a stored or fetched value as untrusted data: each field is kept only
 *  when valid, anything else - and anything that is not an object - is
 *  dropped. Whether `home` still names a section is the caller's check. */
export function readPrefs(raw: unknown): Prefs {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const r = raw as Record<string, unknown>;
  const out: Prefs = {};
  if (r['lang'] === 'ru' || r['lang'] === 'en') out.lang = r['lang'];
  const home = r['home'];
  if (typeof home === 'string' && home.startsWith('#/') && home.length <= HOME_MAX) {
    out.home = home;
  }
  if (r['view'] === 'list' || r['view'] === 'grid') out.view = r['view'];
  if (typeof r['printBw'] === 'boolean') out.printBw = r['printBw'];
  if (typeof r['printCompact'] === 'boolean') out.printCompact = r['printCompact'];
  return out;
}
