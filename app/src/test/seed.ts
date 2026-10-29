/* The fake cloud's seed with a test's own lists and share links added. */

import {
  uuid,
  SEED,
  type Seed,
  type SeedList,
  type SeedShare
} from '../ports/fake-cloud-seed.js';

/** Holds one day in milliseconds, the unit of a seeded list's age. */
export const DAY = 24 * 3_600_000;

/** Returns the seed list of `n` with its entries in order, ids from `uuid(n * 10 + 1)`, so a
 *  list holds at most nine entries per `n`. `more` also takes the list's two ages. */
export function listOf(
  n: number,
  name: string,
  entries: { key: string; qty?: number; gold?: number; note?: string; hnote?: string }[],
  more: Partial<
    Pick<SeedList, 'money' | 'note' | 'hnote' | 'createdAgoMs' | 'editedAgoMs'>
  > = {}
): SeedList {
  return {
    id: uuid(n),
    name,
    entries: entries.map(({ key, ...meta }, position) => ({
      id: uuid(n * 10 + 1 + position),
      itemKey: key,
      position,
      ...meta
    })),
    createdAgoMs: 4 * DAY,
    editedAgoMs: 2 * DAY,
    ...more
  };
}

/** Holds two empty lists, «Лавка в порту» edited after «Клад дракона», for a menu or an index
 *  that lists the newest edit first. */
export const TWO_LISTS: SeedList[] = [
  listOf(811, 'Клад дракона', [], { createdAgoMs: 2 * DAY, editedAgoMs: 2 * DAY }),
  listOf(812, 'Лавка в порту', [], { createdAgoMs: DAY, editedAgoMs: DAY })
];

/** Returns one list per row, `base + k` for row `k`, the first row edited last; a row's `keys`
 *  become its entries. */
export function manyLists(base: number, rows: { name: string; keys?: string[] }[]): SeedList[] {
  return rows.map(({ name, keys = [] }, k) =>
    listOf(
      base + k,
      name,
      keys.map((key) => ({ key })),
      { createdAgoMs: (k + 1) * 60_000, editedAgoMs: (k + 1) * 60_000 }
    )
  );
}

/** Returns `SEED` with `lists` appended to each named user's own lists and `shares` appended
 *  to the seed's share links. */
export function seedWith(
  lists: Partial<Record<keyof Seed['lists'], SeedList[]>>,
  shares: readonly SeedShare[] = []
): Seed {
  const all = { ...SEED.lists };
  for (const user of Object.keys(lists) as (keyof Seed['lists'])[]) {
    all[user] = [...all[user], ...(lists[user] ?? [])];
  }
  return { ...SEED, lists: all, shares: [...SEED.shares, ...shares] };
}
