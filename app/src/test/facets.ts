/* The set-up that facets.test.ts and facets.timed.test.ts share: n own items over three
 * sources of 30 sections each, as the homebrew limits allow, and the first source's rows. */

import { buildIndex, srcOf, type Index } from '../lib/data.js';
import { recordOf, withRecords, type HomebrewRecord } from '../lib/homebrew.js';
import type { Record_ } from '../lib/types.js';

/* A key of the 19-character shape for the n-th own row. */
const key = (head: string, n: number): string =>
  (
    'hb_' +
    head +
    'abcdefghij'.charAt(Math.floor(n / 100) % 10) +
    'abcdefghij'.charAt(Math.floor(n / 10) % 10) +
    'abcdefghij'.charAt(n % 10)
  ).padEnd(19, 'a');

const KINDS = ['item', 'consumable'] as const;

const BOOKS = [0, 1, 2].map((b) => ({
  key: key('src', b),
  ru: 'Источник ' + String(b),
  sections: Array.from({ length: 30 }, (_, s) => ({
    key: key('s' + 'abc'.charAt(b), s),
    ru: 'Раздел ' + String(s)
  }))
}));

/** Returns an index with n own items, the first source's key and that source's rows. */
export function ownAtScale(n: number): { index: Index; source: string; shown: Record_[] } {
  const own: HomebrewRecord[] = Array.from({ length: n }, (_, i) => {
    const book = BOOKS[i % 3] as (typeof BOOKS)[number];
    return recordOf(
      key('own', i),
      {
        kind: KINDS[i % 2] as (typeof KINDS)[number],
        ru: 'Своя вещь ' + String(i),
        section: (book.sections[i % 30] as { key: string }).key
      },
      book
    );
  });
  const index = withRecords(buildIndex({ items: {}, eq: [] }), own, []);
  const source = (BOOKS[0] as (typeof BOOKS)[number]).key;
  const shown = (index.rows.get('homebrew') ?? []).filter((it) => srcOf(it) === source);
  return { index, source, shown };
}
