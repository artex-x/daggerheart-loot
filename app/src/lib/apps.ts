/* Connected apps: the consent page `#/connect/<id>` and the account section
 * «Подключённые приложения» (docs/specs/FEATURES.md, "Connect an app").
 *
 * Pure module: no DOM, no network. */

import type { Lang } from './types.js';

/** The shape of an authorization id the Supabase OAuth server hands the consent page:
 *  32 characters of `[a-z0-9]` (measured on the test project, 2026-11-13). */
const AUTHORIZATION_ID = /^[a-z0-9]{32}$/;

/** Returns whether `id` has the shape of an authorization id; another shape draws the
 *  expired page with no read. */
export function isAuthorizationId(id: string): boolean {
  return AUTHORIZATION_ID.test(id);
}

/** Returns the host line of an app: the host of an `https` address; any other address
 *  as given, its scheme and host (`http://127.0.0.1:53682`, `cursor://anysphere`), since
 *  a desktop client's loopback port or custom scheme is the fact to show; '' for an
 *  address that does not parse. */
export function appHost(uri: string): string {
  let u: URL;
  try {
    u = new URL(uri);
  } catch {
    return '';
  }
  if (u.protocol === 'https:') return u.host;
  if (u.host) return u.protocol + '//' + u.host;
  return u.protocol + (u.pathname.split('/').find((p) => p !== '') ?? '');
}

/** One connected app, an OAuth grant of the reader. */
export interface AppGrant {
  clientId: string;
  name: string;
  /** `appHost` of the client's own address (a grant carries no redirect address). */
  host: string;
  /** ISO 8601. */
  grantedAt: string;
}

const MONTHS: Record<Lang, readonly string[]> = {
  ru: [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря'
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]
};

/** Returns the long date of an ISO time in `lang`, by UTC: «12 ноября 2026», "12 November
 *  2026"; '' for a time that does not parse. */
export function longDate(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return [
    String(d.getUTCDate()),
    String(MONTHS[lang][d.getUTCMonth()]),
    String(d.getUTCFullYear())
  ].join(' ');
}

/** Returns `apps` newest first; the same time keeps the name order. */
export function newestFirst(apps: readonly AppGrant[]): AppGrant[] {
  return [...apps].sort(
    (a, b) => b.grantedAt.localeCompare(a.grantedAt) || a.name.localeCompare(b.name)
  );
}
