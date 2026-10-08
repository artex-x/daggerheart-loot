/* The account list page at three times the entry limit, in the `timed` project: select-all
 * over 300 rows crossed the 30 s timeout under load (vite.config.mts, `timed`). */

import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App.svelte';
import type { Loot } from '../lib/data.js';
import { fakeData, fakeEnv, memoryRouter } from '../ports/index.js';
import { filled, SHOP, sub, withStandins } from '../test/accountList.js';

afterEach(cleanup);

/* The shop's three other catalog records, so each of its ten seed entries counts. */
const SEEDED: Loot = {
  items: {
    core_item: ['ci1', 'cc1', 'q1'].map((id) => ({
      id,
      src: 'core',
      kind: 'item' as const,
      roll: 1,
      en: id,
      ende: '',
      ru: id,
      rud: ''
    }))
  },
  eq: [],
  refs: {}
};
const STANDINS = withStandins(SEEDED);

describe('an account list at three times the limit', () => {
  it('counts 290 GM-only entries of 300, and select-all offers to hide all 300', async () => {
    const cloud = await filled(290, 300, true);
    const { container } = render(App, {
      env: fakeEnv({ router: memoryRouter(SHOP), data: fakeData(STANDINS), cloud })
    });
    await screen.findByRole('textbox', { name: 'Название списка' });
    await waitFor(() => {
      expect(sub(container)).toBe('300 позиций из 300 · только для мастера: 290 · Сохранено');
    });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
    expect(screen.getByRole('button', { name: 'Скрыть от игроков (300)' })).toBeInTheDocument();
  });
});
