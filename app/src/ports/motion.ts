/* Whether the reader asked for less motion. A port because jsdom has no
 * `matchMedia`, and a component test needs both answers. */

import type { MotionPort } from './types.js';

export function browserMotion(): MotionPort {
  return {
    reduced: () =>
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  };
}

export function fakeMotion(reduced = false): MotionPort {
  return { reduced: () => reduced };
}
