/* The page going out of sight. `pagehide` is listened to beside
 * `visibilitychange`: on a navigation or a close it fires before the
 * document turns hidden (the HTML unload steps), and a mobile browser may
 * discard a hidden tab with no further event. */

import type { PagePort } from './types.js';

type PageWindow = Pick<Window, 'addEventListener' | 'removeEventListener'> & {
  document: Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>;
};

export function browserPage(win: PageWindow = window): PagePort {
  return {
    onHidden(fn) {
      const onVisibility = (): void => {
        if (win.document.visibilityState === 'hidden') fn();
      };
      const onPageHide = (): void => {
        fn();
      };
      win.document.addEventListener('visibilitychange', onVisibility);
      win.addEventListener('pagehide', onPageHide);
      return () => {
        win.document.removeEventListener('visibilitychange', onVisibility);
        win.removeEventListener('pagehide', onPageHide);
      };
    }
  };
}

/** A page a test hides with `fireHidden()`. */
export function fakePage(): PagePort & { fireHidden(): void } {
  const listeners = new Set<() => void>();
  return {
    onHidden(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    fireHidden() {
      for (const fn of [...listeners]) fn();
    }
  };
}
