/* The address bar.
 *
 * `hash.ts` decides what an address means and `address.ts` how its route key and
 * its path form convert; this decides how the bar is read and written. The two
 * are separate because the meaning is a frozen contract and the mechanism is not
 * - and because a parser that reaches for `location` cannot be tested without a
 * browser. The router holds no language: every write takes it from its caller,
 * except the rewrite of a typed old fragment, which keeps the language of the path. */

import { addressOf, pathOf } from '../lib/address.js';
import { parseHash } from '../lib/hash.js';
import type { Lang } from '../lib/types.js';
import type { RouterPort } from './types.js';

/** Whether the app answers `hash` with a page of its own rather than the home section. */
const parses = (hash: string): boolean => parseHash(hash).kind !== 'unknown';

/** Returns `search` without its `v` parameter, then with `v=<v>` when `v` is given;
 *  the other parameters keep their order and their bytes. */
function queryWith(search: string, v: string | null): string {
  const parts = search
    .replace(/^\?/, '')
    .split('&')
    .filter((p) => p !== '' && p !== 'v' && !p.startsWith('v='));
  if (v) parts.push('v=' + v);
  return parts.length ? '?' + parts.join('&') : '';
}

/** Returns the `v` parameter of `search`, or null. */
function vOf(search: string): string | null {
  const p = search
    .replace(/^\?/, '')
    .split('&')
    .find((s) => s.startsWith('v='));
  return p ? p.slice(2) : null;
}

interface LinkClick {
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  target: unknown;
  preventDefault(): void;
}

interface RouterWin {
  location: {
    hash: string;
    pathname: string;
    search: string;
    href: string;
    origin: string;
  };
  /* Both writes are optional on purpose: the guards below are what keep the page
     working where one is missing, and typing them as always present would make
     those guards look like dead code. */
  history: {
    length: number;
    pushState?: (s: unknown, t: string, u: string) => void;
    replaceState?: (s: unknown, t: string, u: string) => void;
    back?: () => void;
  };
  addEventListener: (t: string, fn: () => void) => void;
  removeEventListener: (t: string, fn: () => void) => void;
  document?:
    | {
        addEventListener: (t: 'click', fn: (e: LinkClick) => void) => void;
        removeEventListener: (t: 'click', fn: (e: LinkClick) => void) => void;
      }
    | undefined;
}

/** Returns the link element a click landed in, or null. */
function linkOf(target: unknown): HTMLAnchorElement | null {
  const el = target as { closest?: (s: string) => Element | null } | null;
  const a = el?.closest?.('a[href]');
  return a ? (a as HTMLAnchorElement) : null;
}

export function pathRouter(win: RouterWin = window): RouterPort {
  const listeners = new Set<(hash: string) => void>();
  const read = (): { hash: string; lang: Lang | null } =>
    addressOf(win.location.pathname, win.location.hash, parses);
  /* The route the last write or event left: a fragment-only change (`#main`) and the
     `hashchange` a browser fires after the `popstate` of the same step read the same
     route, and neither is a navigation. */
  let seen = read().hash;
  const announce = (hash: string): void => {
    seen = hash;
    for (const fn of listeners) fn(hash);
  };
  const write = (
    method: 'pushState' | 'replaceState',
    hash: string,
    lang: Lang,
    v: string | null
  ): void => {
    seen = hash;
    /* WebKit throws past 100 history calls in a 30 s window - a filter's rewrites can
       reach it. The bar then keeps its last value and the route still changes in
       memory: a path has no reload-free fallback. */
    try {
      win.history[method]?.(null, '', pathOf(hash, lang) + queryWith(win.location.search, v));
    } catch {
      /* the bar keeps its last value */
    }
  };
  const onEvent = (): void => {
    const { hash } = read();
    if (hash !== seen) {
      announce(hash);
    } else if (win.location.hash.startsWith('#/')) {
      /* A typed `#/...` of the route on screen is no step, but the bar must lose it. An
         announce would count a navigation and close menus for a route that did not change. */
      const lang = addressOf(win.location.pathname, '').lang ?? 'ru';
      write('replaceState', hash, lang, vOf(win.location.search));
    }
  };
  return {
    hash: () => read().hash,
    lang: () => read().lang,

    navigate(hash, lang, v) {
      /* A click on the active tab or chip is no step: no entry, no announce. */
      if (!win.location.hash.startsWith('#/') && win.location.pathname === pathOf(hash, lang)) {
        return;
      }
      write('pushState', hash, lang, v ?? null);
      /* pushState fires no event, so the listeners hear the step here, at once, as
         memoryRouter's do - `AppState.go`'s `#expectHash` guard relies on it. */
      announce(hash);
    },

    replace(hash, lang, v) {
      write('replaceState', hash, lang, v === undefined ? vOf(win.location.search) : v);
    },

    relang(lang) {
      write('replaceState', read().hash, lang, vOf(win.location.search));
    },

    onChange(fn) {
      listeners.add(fn);
      if (listeners.size === 1) {
        win.addEventListener('popstate', onEvent);
        win.addEventListener('hashchange', onEvent);
      }
      return () => {
        listeners.delete(fn);
        if (listeners.size === 0) {
          win.removeEventListener('popstate', onEvent);
          win.removeEventListener('hashchange', onEvent);
        }
      };
    },

    onLink(fn) {
      const doc = win.document;
      if (!doc) return () => undefined;
      const handler = (e: LinkClick): void => {
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = linkOf(e.target);
        if (!a || a.target || a.hasAttribute('download')) return;
        let url: URL;
        try {
          url = new URL(a.href);
        } catch {
          return;
        }
        if (url.origin !== win.location.origin) return;
        const here =
          url.pathname === win.location.pathname && url.search === win.location.search;
        if (here && url.hash !== '' && !url.hash.startsWith('#/')) return;
        const { hash } = addressOf(url.pathname, url.hash, parses);
        if (hash !== '#/' && !parses(hash)) return;
        e.preventDefault();
        fn(hash);
      };
      doc.addEventListener('click', handler);
      return () => {
        doc.removeEventListener('click', handler);
      };
    },

    base: () => win.location.origin + '/',

    canGoBack: () => win.history.length > 1,
    back() {
      win.history.back?.();
    }
  };
}

/** Somewhere for a link to point in a test, so an assertion can name it. */
const BASE = 'https://example.test/';

interface Entry {
  hash: string;
  lang: Lang | null;
  v: string | null;
}

/** A router in a variable, with a history a test can inspect. `lang` is the language
 *  the start address names; a write without a language keeps the entry's own. */
export interface MemoryRouter extends RouterPort {
  /** The route key of every entry, oldest first. */
  readonly stack: string[];
  /** The bar of the current entry: its path form and `?v`. */
  bar(): string;
  navigate(hash: string, lang?: Lang, v?: string): void;
  replace(hash: string, lang?: Lang, v?: string | null): void;
  /** A click on a link to `href` (a path, or an old `#/` address), as the real router's
   *  click listener reads it. Answers whether a link listener took it. */
  click(href: string): boolean;
}

export function memoryRouter(start = '#/roll/std', lang: Lang | null = null): MemoryRouter {
  const stack = [start];
  const meta: Omit<Entry, 'hash'>[] = [{ lang, v: null }];
  const listeners = new Set<(hash: string) => void>();
  const links = new Set<(hash: string) => void>();
  const top = (): Omit<Entry, 'hash'> => meta[meta.length - 1] ?? { lang, v: null };
  const announce = (): void => {
    for (const fn of listeners) fn(stack[stack.length - 1] ?? '');
  };
  return {
    stack,
    hash: () => stack[stack.length - 1] ?? '',
    lang: () => lang,
    bar() {
      const { lang: l, v } = top();
      return pathOf(stack[stack.length - 1] ?? '', l ?? 'ru') + (v ? '?v=' + v : '');
    },
    navigate(hash, l, v) {
      const now = top();
      if (hash === stack[stack.length - 1] && (l ?? now.lang) === now.lang) return;
      stack.push(hash);
      meta.push({ lang: l ?? now.lang, v: v ?? null });
      announce();
    },
    replace(hash, l, v) {
      /* The real router's replaceState fires no event, so the fake must not announce
         either. A test that saw one here would pass while a browser, watching the
         counter this drives, would not: exactly the gap AppState.navigations exists
         to catch. */
      const now = top();
      stack[stack.length - 1] = hash;
      meta[meta.length - 1] = { lang: l ?? now.lang, v: v === undefined ? now.v : v };
    },
    relang(l) {
      meta[meta.length - 1] = { ...top(), lang: l };
    },
    onChange(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    onLink(fn) {
      links.add(fn);
      return () => {
        links.delete(fn);
      };
    },
    click(href) {
      const url = new URL(href, BASE);
      const { hash } = addressOf(url.pathname, url.hash, parses);
      if (links.size === 0 || (hash !== '#/' && !parses(hash))) return false;
      for (const fn of links) fn(hash);
      return true;
    },
    base: () => BASE,

    canGoBack: () => stack.length > 1,
    back() {
      if (stack.length > 1) {
        stack.pop();
        meta.pop();
      }
      announce();
    }
  };
}
