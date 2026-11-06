/* The document's font loading. A port because jsdom has no `FontFaceSet`, and because a
 * test must hold the face back to see what a page draws before it arrives. */

import type { FontsPort } from './types.js';

export function browserFonts(): FontsPort {
  return {
    settled() {
      /* Declared non-optional in lib.dom; absent in jsdom and in an old browser. */
      const fonts = (globalThis.document as { fonts?: FontFaceSet } | undefined)?.fonts;
      if (!fonts) return Promise.resolve(false);
      const loading = fonts.status === 'loading';
      /* `ready` also waits for the document to finish loading while no face is pending, so
         a caller that only needs the final layout waits on it in both cases. */
      return fonts.ready.then(() => loading);
    }
  };
}

export interface FakeFonts extends FontsPort {
  /** Settles every held call: `loading` is the answer each gets. */
  release(loading: boolean): void;
}

/** Answers `false` at once, or, with `hold`, waits for `release`. */
export function fakeFonts(hold = false): FakeFonts {
  const waiting: ((loading: boolean) => void)[] = [];
  return {
    settled() {
      if (!hold) return Promise.resolve(false);
      return new Promise<boolean>((resolve) => {
        waiting.push(resolve);
      });
    },
    release(loading) {
      for (const resolve of waiting.splice(0)) resolve(loading);
    }
  };
}
