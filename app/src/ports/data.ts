/* Reading the dataset.
 *
 * `data.js` assigns `window.LOOT` from a classic script: a page opened from a
 * folder cannot fetch a local JSON, so the data cannot be imported and has to be
 * picked up off the global. That is a browser fact, which is why it lives behind
 * a port instead of in `lib` - and it is what lets a test hand the app a
 * two-record catalogue instead of the whole book. */

import type { Loot } from '../lib/data.js';
import type { DataPort } from './types.js';

/**
 * A shape check rather than a cast.
 *
 * The value comes off a global that any script on the page could have written,
 * and a wrong one would otherwise surface as a crash somewhere far away. This
 * checks only the container - `items` is an object of arrays - because the
 * records themselves are pinned by `tests/dataint.js` against the real file.
 */
function looksLikeLoot(v: unknown): v is Loot {
  if (typeof v !== 'object' || v === null) return false;
  const items: unknown = (v as { items?: unknown }).items;
  if (typeof items !== 'object' || items === null) return false;
  return Object.values(items).every((rows) => Array.isArray(rows));
}

/**
 * Reads the global by name.
 *
 * A getter rather than a window object, because there is nothing to declare: the
 * value is whatever `data.js` assigned, it is `unknown` until it is checked, and
 * a test supplies its own reader without having to build a fake `Window`.
 */
export function browserData(
  read: () => unknown = () => Reflect.get(globalThis, 'LOOT')
): DataPort {
  return {
    load: () => {
      const v = read();
      return looksLikeLoot(v) ? v : null;
    }
  };
}

/**
 * Nothing loaded at all - which is not the same as an empty catalogue.
 *
 * `data.js` missing from a folder, or served as an HTML error page by a broken
 * deploy. The app has to be able to say "the data did not load" rather than
 * show an empty book as though that were the truth.
 */
export function noData(): DataPort {
  return { load: () => null };
}

export function fakeData(loot: Loot): DataPort {
  return { load: () => loot };
}
