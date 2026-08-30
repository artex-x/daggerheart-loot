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
         for: this tab already knows what it wrote. */
      const handler = (e: StorageEvent): void => {
        if (e.key) fn(e.key);
      };
      win.addEventListener('storage', handler);
      return () => {
        win.removeEventListener('storage', handler);
      };
    }
  };
}

/**
 * Storage that lives in a variable.
 *
 * For tests, and for the case where the browser refuses: the app keeps working
 * for the session, and says plainly that nothing will survive a reload.
 */
export function memoryStorage(initial: Record<string, string> = {}): StoragePort {
  const map = new Map(Object.entries(initial));
  const listeners = new Set<(key: string) => void>();
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
