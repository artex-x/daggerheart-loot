/* The layout band. DESIGN.md, "The Two Breakpoints Rule", gives the two widths; no
 * other code reads the window's width. A port because jsdom has no `matchMedia`. */

import type { Band, ViewportPort } from './types.js';

const NARROW = '(max-width: 760px)';
const WIDE = '(min-width: 1000px)';

export function browserViewport(): ViewportPort {
  if (typeof matchMedia !== 'function') return fakeViewport('wide');
  const narrow = matchMedia(NARROW);
  const wide = matchMedia(WIDE);
  const band = (): Band => (narrow.matches ? 'narrow' : wide.matches ? 'wide' : 'mid');
  return {
    band,
    onchange(cb) {
      const fire = (): void => {
        cb(band());
      };
      narrow.addEventListener('change', fire);
      wide.addEventListener('change', fire);
      return () => {
        narrow.removeEventListener('change', fire);
        wide.removeEventListener('change', fire);
      };
    }
  };
}

export interface FakeViewport extends ViewportPort {
  /** Moves the fake to `band` and tells every listener. */
  set(band: Band): void;
}

export function fakeViewport(start: Band = 'wide'): FakeViewport {
  let now = start;
  const subs = new Set<(band: Band) => void>();
  return {
    band: () => now,
    onchange(cb) {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
    set(band) {
      now = band;
      for (const cb of subs) cb(band);
    }
  };
}
