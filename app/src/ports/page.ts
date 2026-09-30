/* The page going out of sight. `pagehide` is listened to beside
 * `visibilitychange`: on a navigation or a close it fires before the
 * document turns hidden (the HTML unload steps), and a mobile browser may
 * discard a hidden tab with no further event. `beforeunload` asks before a
 * page with unsaved edits closes. */

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
    },
    guardUnload(dirty) {
      const onBeforeUnload = (e: BeforeUnloadEvent): void => {
        if (!dirty()) return;
        e.preventDefault();
        /* Deprecated, yet what Safari before 17 and old Chromium read to show the prompt. */
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        e.returnValue = '';
      };
      win.addEventListener('beforeunload', onBeforeUnload);
      return () => {
        win.removeEventListener('beforeunload', onBeforeUnload);
      };
    }
  };
}

/** A page a test hides with `fireHidden()`; `unloadAsks()` answers whether a close would
 *  ask now. */
export function fakePage(): PagePort & { fireHidden(): void; unloadAsks(): boolean } {
  const listeners = new Set<() => void>();
  const guards = new Set<() => boolean>();
  return {
    onHidden(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    fireHidden() {
      for (const fn of [...listeners]) fn();
    },
    guardUnload(dirty) {
      guards.add(dirty);
      return () => {
        guards.delete(dirty);
      };
    },
    unloadAsks() {
      return [...guards].some((g) => g());
    }
  };
}
