/* The address bar.
 *
 * `hash.ts` decides what an address means; this decides how it is read and
 * written. The two are separate because the meaning is a frozen contract and
 * the mechanism is not - and because a parser that reaches for `location`
 * cannot be tested without a browser. */

import type { RouterPort } from './types.js';

interface RouterWin {
  location: { hash: string; pathname: string; search: string; href: string; protocol: string };
  /* `replaceState` is optional on purpose: the guard below is what keeps the
     page working where it is missing, and typing it as always present would
     make that guard look like dead code. */
  history: {
    length: number;
    replaceState?: (s: unknown, t: string, u: string) => void;
    back?: () => void;
  };
  addEventListener: (t: string, fn: () => void) => void;
  removeEventListener: (t: string, fn: () => void) => void;
}

export function hashRouter(win: RouterWin = window): RouterPort {
  return {
    hash: () => win.location.hash,

    navigate(hash) {
      /* Assigning the hash is what puts an entry in history, which is what the
         back button then walks. */
      win.location.hash = hash;
    },

    replace(hash) {
      /* The filter segment is rewritten on every click. Through `navigate` that
         would bury the page the person came from under a hundred entries, so
         the address is swapped in place and the file:// case - where
         replaceState is unavailable - falls back to assigning it. */
      if (win.history.replaceState) {
        win.history.replaceState(null, '', win.location.pathname + win.location.search + hash);
      } else {
        win.location.hash = hash;
      }
    },

    onChange(fn) {
      const handler = (): void => {
        fn(win.location.hash);
      };
      win.addEventListener('hashchange', handler);
      return () => {
        win.removeEventListener('hashchange', handler);
      };
    },

    base: () => (win.location.href.split('#')[0] ?? '').replace(/index\.html$/, ''),
    hosted: () => /^https?:$/.test(win.location.protocol),

    canGoBack: () => win.history.length > 1,
    back() {
      win.history.back?.();
    }
  };
}

/** A router in a variable, with a history a test can inspect. */
/** Somewhere for a link to point in a test, so an assertion can name it. */
const BASE = 'https://example.test/';

export function memoryRouter(start = '#/roll/std'): RouterPort & { readonly stack: string[] } {
  const stack = [start];
  const listeners = new Set<(hash: string) => void>();
  const announce = (): void => {
    for (const fn of listeners) fn(stack[stack.length - 1] ?? '');
  };
  return {
    stack,
    hash: () => stack[stack.length - 1] ?? '',
    navigate(hash) {
      stack.push(hash);
      announce();
    },
    replace(hash) {
      /* The real router's replaceState fires no hashchange - see hashRouter
         above - so the fake must not announce either. A test that saw one here
         would pass while a browser, watching the counter this drives, would
         not: exactly the gap AppState.navigations exists to catch. */
      stack[stack.length - 1] = hash;
    },
    onChange(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    base: () => BASE,
    hosted: () => true,

    canGoBack: () => stack.length > 1,
    back() {
      if (stack.length > 1) stack.pop();
      announce();
    }
  };
}
