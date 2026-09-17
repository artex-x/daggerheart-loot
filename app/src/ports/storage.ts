/* Storage, and the fact that it may not be there.
 *
 * Every call is wrapped: a private window, disabled site data or a full quota
 * throw on read as well as on write, and one throw must not take the page with
 * it. docs/specs/STATE.md lists what is kept and why. */

import type { StoragePort } from './types.js';

/** A key nobody stores anything under - written and removed to test the water. */
const PROBE = 'dhloot.probe';

export function browserStorage(win: Window = window): StoragePort {
  const ls = (): Storage | null => {
    try {
      return win.localStorage;
    } catch {
      return null;
    }
  };

  return {
    get(key) {
      try {
        return ls()?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        const s = ls();
        /* No storage at all is a failed write, not a quiet success: the caller
           has to be able to tell the person their lists were not saved. */
        if (!s) return false;
        s.setItem(key, value);
        return true;
      } catch {
        /* Out of quota, or storage refused outright. The caller tells the
           person their lists were not saved rather than pretending. */
        return false;
      }
    },
    remove(key) {
      try {
        ls()?.removeItem(key);
      } catch {
        /* Nothing to do about it, and nothing worth saying */
      }
    },
    works() {
      try {
        const s = ls();
        if (!s) return false;
        s.setItem(PROBE, '1');
        s.removeItem(PROBE);
        return true;
      } catch {
        return false;
      }
    },
    onExternalChange(fn) {
      /* Fires only for other tabs, which is exactly the case the merge exists
         for: this tab already knows what it wrote. A `null` key -
         `localStorage.clear()` - used to be dropped here; R2 treats it the
         same as a named key, since the merge's own `mergeLists(mine, [])`
         already answers "storage came back empty" correctly. */
      const handler = (e: StorageEvent): void => {
        fn(e.key);
      };
      win.addEventListener('storage', handler);

      /* R2: a backgrounded tab receives no `storage` event at all in most
         browsers - the event is a same-origin, other-document notification,
         and a hidden tab is not guaranteed to be running enough of its own
         event loop to receive it promptly, if at all, depending on the
         browser's own throttling. Two moments this tab can catch up on its
         own instead: becoming visible again, and a back-forward-cache
         restore (`pageshow` with `persisted: true`, though every `pageshow`
         is treated the same way here - re-reading on a normal load too costs
         nothing and needs no extra state to tell the two apart). Neither
         carries a key of its own, so both answer with `null`, the same as a
         `clear()` this tab has no more specific news about either. */
      const onVisible = (): void => {
        if (win.document.visibilityState === 'visible') fn(null);
      };
      const onShow = (): void => {
        fn(null);
      };
      win.document.addEventListener('visibilitychange', onVisible);
      win.addEventListener('pageshow', onShow);

      return () => {
        win.removeEventListener('storage', handler);
        win.document.removeEventListener('visibilitychange', onVisible);
        win.removeEventListener('pageshow', onShow);
      };
    }
  };
}

/** `memoryStorage`'s own test hook (R2): a test cannot raise a real
 *  `storage` event, `visibilitychange` or `pageshow`, and every caller of
 *  `onExternalChange` is meant to treat the three identically anyway - so
 *  this fires whatever is currently registered, standing in for all three. */
export interface FakeStoragePort extends StoragePort {
  fireExternalChange(key: string | null): void;
}

/**
 * Storage that lives in a variable.
 *
 * For tests, and for the case where the browser refuses: the app keeps working
 * for the session, and says plainly that nothing will survive a reload.
 */
export function memoryStorage(initial: Record<string, string> = {}): FakeStoragePort {
  const map = new Map(Object.entries(initial));
  const listeners = new Set<(key: string | null) => void>();
  return {
    get: (k) => map.get(k) ?? null,
    set(k, v) {
      map.set(k, v);
      return true;
    },
    remove(k) {
      map.delete(k);
    },
    works: () => true,
    onExternalChange(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    fireExternalChange(key) {
      for (const fn of listeners) fn(key);
    }
  };
}

/** Storage that always fails, to exercise the branch a person in a private window gets. */
export function brokenStorage(): StoragePort {
  return {
    get: () => null,
    set: () => false,
    remove: () => undefined,
    works: () => false,
    onExternalChange: () => () => undefined
  };
}
