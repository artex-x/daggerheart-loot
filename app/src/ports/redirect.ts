/* The way back from a provider's consent screen.
 *
 * Sign-in and linking leave the page for Google or Discord and come back to
 * `?auth-callback=1` with a `code` - or with the error parameters, which is
 * the only place a refused link or a cancelled consent is ever reported.
 * `takeRedirect` runs before the app mounts: it reads those parameters,
 * takes the record `saveReturn` left in this tab, and puts the address back
 * to the page the reader left, so the router never sees the callback.
 * docs/specs/FEATURES.md, "Account"; docs/specs/STATE.md. */

import { readPending, type PendingAction } from '../lib/pending.js';
import type { Provider } from './types.js';

export const RETURN_KEY = 'dhloot.auth.return';
/** A record older than this is someone else's abandoned attempt. */
export const RETURN_MS = 10 * 60 * 1000;
/** The longest page address the record keeps: a `#/l/` link with notes passes 2048. */
const HASH_MAX = 16384;

const CALLBACK = 'auth-callback';
const DROP = [CALLBACK, 'code', 'error', 'error_code', 'error_description'];
const PROVIDERS: readonly string[] = ['google', 'discord'];
const KINDS: readonly string[] = ['signIn', 'link'];

type Kind = 'signIn' | 'link';

/** The part of `window` this module touches, so a test can hand in a stub. */
export interface RedirectWindow {
  location: { href: string; hash: string };
  sessionStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  history: Pick<History, 'replaceState'>;
}

export interface ReturnRecord {
  hash: string;
  kind: Kind;
  provider: Provider;
  /** What a sign-in prompt asked to finish on `hash` (lib/pending.ts). */
  action?: PendingAction;
}

export interface Redirect {
  code: string | null;
  error: string | null;
  kind: Kind;
  provider: Provider | null;
  action: PendingAction | null;
}

/** The address a provider sends the reader back to: the page itself, without
 *  `index.html`, plus the callback flag - the form `supabase/config.toml`
 *  allows. */
export function callbackUrl(href: string): string {
  const u = new URL(href);
  return u.origin + u.pathname.replace(/index\.html$/, '') + '?' + CALLBACK + '=1';
}

/** Remembers where to come back to, for this tab only. A storage that refuses
 *  loses the way back, not the sign-in: the page then opens `#/account`. */
export function saveReturn(win: RedirectWindow, record: ReturnRecord, now = Date.now()): void {
  try {
    win.sessionStorage.setItem(RETURN_KEY, JSON.stringify({ ...record, at: now }));
  } catch {
    /* no record */
  }
}

/** Takes the record out of storage and answers it only when every field is
 *  one this module could have written, recently. */
function takeRecord(win: RedirectWindow, now: number): ReturnRecord | null {
  let raw: string | null;
  try {
    raw = win.sessionStorage.getItem(RETURN_KEY);
    win.sessionStorage.removeItem(RETURN_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!v || typeof v !== 'object') return null;
  const r = v as Record<string, unknown>;
  const { hash, at, kind, provider, action } = r;
  if (typeof hash !== 'string' || !hash.startsWith('#/') || hash.length >= HASH_MAX)
    return null;
  if (typeof at !== 'number' || now - at < 0 || now - at > RETURN_MS) return null;
  if (typeof kind !== 'string' || !KINDS.includes(kind)) return null;
  if (typeof provider !== 'string' || !PROVIDERS.includes(provider)) return null;
  /* A bad action costs the action, not the way back. */
  const pending = readPending(action);
  return {
    hash,
    kind: kind as Kind,
    provider: provider as Provider,
    ...(pending ? { action: pending } : {})
  };
}

/** Reads a returning redirect and cleans the address, or answers null and
 *  touches nothing when the page did not come back from one. An error in the
 *  hash (`#error=...`) is read as parameters, never routed. */
export function takeRedirect(win: RedirectWindow = window, now = Date.now()): Redirect | null {
  const url = new URL(win.location.href);
  if (!url.searchParams.has(CALLBACK)) return null;
  const params = [url.searchParams];
  if (/^#(error|access_token)/.test(url.hash)) {
    params.push(new URLSearchParams(url.hash.slice(1)));
  }
  const read = (name: string): string | null => {
    for (const p of params) {
      const v = p.get(name);
      if (v) return v;
    }
    return null;
  };
  const code = read('code');
  const error = read('error_code') ?? read('error');
  const record = takeRecord(win, now);

  for (const name of DROP) url.searchParams.delete(name);
  const query = url.searchParams.toString();
  win.history.replaceState(
    null,
    '',
    url.origin + url.pathname + (query ? '?' + query : '') + (record?.hash ?? '#/account')
  );
  return {
    code,
    error,
    kind: record?.kind ?? 'signIn',
    provider: record?.provider ?? null,
    action: record?.action ?? null
  };
}
