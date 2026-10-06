/* A set of 300 members (three times the item limit) on the Sets tab: its open fold draws
   300 member links within the bound of the 1000-list case. It runs in the `timed` vitest
   project, one file at a time after the parallel files (vite.config.mts), so another
   worker's load does not decide it. docs/specs/FEATURES.md, "Homebrew". */
import { cleanup, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
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

describe('a set of 300 members', () => {
  it('draws the add field first and its 300 member links within 3000 ms', async () => {
    const cloud = fakeCloud(SEED, 'gm2', { limits: { items: 300 } });
    await cloud.homebrew.import({
      books: [],
      cards: [
        {
          id: uuid(7300),
          key: BIG,
          kind: 'set',
          book: null,
          content: { ru: 'Большой комплект', rud: 'Бонус.' }
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
    const { container } = page('gm2', { cloud });
    const panel = await tab(t.hbSets);
    const fold = within(panel).getByRole('button', { name: 'Большой комплект' });
    const start = performance.now();
    await userEvent.click(fold);
    await waitFor(() => {
      expect(panel.querySelectorAll('.members a')).toHaveLength(300);
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
