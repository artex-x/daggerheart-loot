/* The page's scroll. A port because jsdom scrolls nothing, and a component test needs
 * to move it. */

import type { ScrollPort } from './types.js';

/* A smooth scroll, or the browser's own restore on Back, starts within a frame or two
   and sends an event each frame; this long with no event ends it. */
const QUIET_MS = 150;
/* A page that never goes quiet still gives the header back. */
const CAP_MS = 2000;

export function browserScroll(): ScrollPort {
  let busy = false;
  let quiet: ReturnType<typeof setTimeout> | undefined;
  let cap: ReturnType<typeof setTimeout> | undefined;

  const done = (): void => {
    busy = false;
    clearTimeout(quiet);
    clearTimeout(cap);
    window.removeEventListener('scroll', again);
  };
  const again = (): void => {
    clearTimeout(quiet);
    quiet = setTimeout(done, QUIET_MS);
  };
  const settle = (): void => {
    if (!busy) {
      busy = true;
      window.addEventListener('scroll', again, { passive: true });
    }
    clearTimeout(cap);
    cap = setTimeout(done, CAP_MS);
    again();
  };
  const max = (): number =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  return {
    y: () => Math.min(Math.max(window.scrollY, 0), max()),
    max,
    onscroll(fn) {
      let frame = 0;
      const on = (): void => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          fn();
        });
      };
      window.addEventListener('scroll', on, { passive: true });
      return () => {
        window.removeEventListener('scroll', on);
        cancelAnimationFrame(frame);
      };
    },
    into(el, options) {
      settle();
      el.scrollIntoView(options);
    },
    settle,
    busy: () => busy
  };
}

export interface FakeScroll extends ScrollPort {
  /** Moves the fake to `y` and tells every listener. */
  to(y: number, max?: number): void;
  /** Ends the settling, as a quiet page does. */
  quiet(): void;
}

export function fakeScroll(): FakeScroll {
  let y = 0;
  let top = 10000;
  let busy = false;
  const subs = new Set<() => void>();
  return {
    y: () => y,
    max: () => top,
    onscroll(fn) {
      subs.add(fn);
      return () => {
        subs.delete(fn);
      };
    },
    into(el, options) {
      busy = true;
      el.scrollIntoView(options);
    },
    settle() {
      busy = true;
    },
    busy: () => busy,
    to(next, max = top) {
      top = max;
      y = next;
      for (const fn of subs) fn();
    },
    quiet() {
      busy = false;
    }
  };
}
