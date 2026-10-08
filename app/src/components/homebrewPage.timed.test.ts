/* A set of 300 own members (three times the item limit) and 100 book items (the card's
   limit) on the Sets tab: its open fold draws 400 member links within the bound of the
   1000-list case. It runs in the `timed` vitest
   project, one file at a time after the parallel files (vite.config.mts), so another
   worker's load does not decide it. docs/specs/FEATURES.md, "Homebrew". */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Loot } from '../lib/data.js';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { fakeData } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import { page, t, tab } from '../test/homebrewPage.js';

afterEach(cleanup);

Element.prototype.scrollIntoView = vi.fn();

const BIG = 'hb_bigsetaaaaaaaaaa';
const BASE32 = 'abcdefghijklmnopqrstuvwxyz234567';
const keyN = (n: number): string =>
  'hb_m' +
  BASE32.charAt(Math.floor(n / 32 / 32) % 32) +
  BASE32.charAt(Math.floor(n / 32) % 32) +
  BASE32.charAt(n % 32) +
  'aaaaaaaaaaaa';

/* The first 100 catalog records of no book set: the book items the card holds. */
const loot = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
) as Loot;
const BOOK_ITEMS = Object.values(loot.items)
  .flat()
  .filter((r) => !r.set)
  .slice(0, 100)
  .map((r) => r.id);

describe('a set of 300 own members and 100 book items', () => {
  it('draws the add field first and its 400 member links within 3000 ms', async () => {
    const cloud = fakeCloud(SEED, 'gm2', { limits: { items: 300 } });
    await cloud.homebrew.import({
      books: [],
      cards: [
        {
          id: uuid(7300),
          key: BIG,
          kind: 'set',
          book: null,
          content: { ru: 'Большой комплект', rud: 'Бонус.', items: BOOK_ITEMS }
        }
      ],
      items: Array.from({ length: 300 }, (_, i) => ({
        id: uuid(7301 + i),
        key: keyN(i),
        book: null,
        content: { kind: 'item' as const, ru: 'Предмет ' + String(i), set: BIG }
      })),
      update: false
    });
    const { container } = page('gm2', { cloud, env: { data: fakeData(loot) } });
    const panel = await tab(t.hbSets);
    const fold = within(panel).getByRole('button', { name: 'Большой комплект' });
    const start = performance.now();
    await userEvent.click(fold);
    await waitFor(() => {
      expect(panel.querySelectorAll('.members a')).toHaveLength(400);
    });
    expect(performance.now() - start).toBeLessThan(3000);
    const field = within(panel).getByRole('combobox', { name: t.hbAddMember });
    const first = panel.querySelector('.members a');
    expect(
      first && field.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    await expectNoA11yViolations(container);
  }, 120_000);
});
