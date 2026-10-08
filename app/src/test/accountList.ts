/* The set-up that listPage.test.ts and listPage.timed.test.ts share: gm1's shop
   «Лавка кузнеца» filled past its seed with stand-in records, and the reader of its sub. */
import type { Loot } from '../lib/data.js';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import type { CloudPort } from '../ports/index.js';

/** The address of gm1's shop, `uuid(101)`. */
export const SHOP = '#/lists/00000000-0000-4000-8000-000000000101';

/** Returns the data with a stand-in record for each of the shop's six records it lacks and
 *  for the 290 keys `filled` adds, so each entry counts. */
export function withStandins(loot: Loot): Loot {
  return {
    ...loot,
    items: {
      ...loot.items,
      core_item: [
        ...(loot.items['core_item'] ?? []),
        ...['q313', 'voa2_a3', 'q23', 'w51', 'q35', 'di11']
          .concat(Array.from({ length: 290 }, (_, i) => 'x' + String(i)))
          .map((id, i) => ({
            id,
            src: 'core',
            kind: 'item' as const,
            roll: 1,
            en: 'Stand-in ' + String(i),
            ende: '',
            ru: 'Подставка ' + String(i),
            rud: ''
          }))
      ]
    }
  };
}

/** Returns gm1's fake cloud with `more` stand-in entries added to the shop under an entry
 *  limit of `entries`, each marked GM only when `gmOnly` is set. */
export async function filled(
  more: number,
  entries: number,
  gmOnly = false
): Promise<CloudPort> {
  const cloud = fakeCloud(SEED, 'gm1', { limits: { entries } });
  const r = await cloud.lists.apply([
    {
      op: 'add',
      list_id: uuid(101),
      entries: Array.from({ length: more }, (_, i) => ({
        id: uuid(7000 + i),
        item_key: 'x' + String(i),
        source: 'official' as const,
        hb_item: null,
        position: 10 + i,
        quantity: 1,
        price_coins: null,
        player_note: '',
        gm_note: '',
        ...(gmOnly ? { gm_only: true } : {})
      }))
    }
  ]);
  if (!r.ok) throw new Error(`The fake refused ${String(more)} entries. Raise the limit.`);
  return cloud;
}

/** Returns an account list page's sub line, its whitespace folded. */
export const sub = (container: HTMLElement): string =>
  container.querySelector('.page-sub')?.textContent.replace(/\s+/g, ' ').trim() ?? '';
