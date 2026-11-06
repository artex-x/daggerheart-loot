/* HomebrewTabs.svelte on its own: the link pills with their counts from 761 px, the picker and
   its sheet up to 760 px, and the focus when the sheet closes. */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import HomebrewTabs from './HomebrewTabs.svelte';
import type { HomebrewTab } from '../lib/hash.js';
import { fakeEnv, fakeViewport, type Band } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const COUNTS = { items: 9, sources: 2, sets: 1, rules: 3 };

function tabs(band: Band, tab: HomebrewTab = 'items') {
  const app = new AppState(fakeEnv({ viewport: fakeViewport(band) }));
  return render(HomebrewTabs, { app, tab, counts: COUNTS, limitText: '9 предметов из 100' });
}

describe('the homebrew tabs', () => {
  it.each(['wide', 'mid'] as const)(
    'draws four link pills with their counts at %s, the lit one with no check',
    async (band) => {
      const { container } = tabs(band, 'sets');
      const nav = within(screen.getByRole('navigation', { name: 'Мои предметы' }));
      const links = nav.getAllByRole('link');
      for (const a of links) expect(a).toHaveClass('chip');
      expect(links[2]).toHaveClass('on');
      expect(links[2]?.querySelector('svg')).toBeNull();
      expect(links[0]?.querySelector('.n')?.textContent).toBe('9');
      expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
        ['Предметы 9', '/homebrew'],
        ['Источники 2', '/homebrew/sources'],
        ['Комплекты 1', '/homebrew/sets'],
        ['Карты правил 3', '/homebrew/rules']
      ]);
      expect(links.map((a) => a.getAttribute('aria-current'))).toEqual([
        null,
        null,
        'page',
        null
      ]);
      expect(screen.queryByRole('button')).toBeNull();
      await expectNoA11yViolations(container);
    }
  );

  it('draws the picker at narrow, named for the tab, and its sheet with the counter', async () => {
    const { container } = tabs('narrow');
    const picker = screen.getByRole('button', { name: 'Мои предметы: Предметы' });
    expect(picker).toHaveAttribute('aria-haspopup', 'dialog');
    expect(screen.queryByRole('link')).toBeNull();
    await expectNoA11yViolations(container);
    await userEvent.click(picker);
    const sheet = within(screen.getByRole('dialog', { name: 'Мои предметы: Предметы' }));
    expect(sheet.getAllByRole('link')).toHaveLength(4);
    expect(sheet.getByText('9 предметов из 100')).toBeInTheDocument();
    await expectNoA11yViolations(document.body);
  });

  it('closes the sheet on a tab press and returns the focus to the picker', async () => {
    tabs('narrow');
    const picker = screen.getByRole('button', { name: 'Мои предметы: Предметы' });
    await userEvent.click(picker);
    await userEvent.click(screen.getByRole('link', { name: 'Источники 2' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(picker).toHaveFocus();
  });

  it('returns the focus to the picker when the sheet closes by its own button', async () => {
    tabs('narrow');
    const picker = screen.getByRole('button', { name: 'Мои предметы: Предметы' });
    await userEvent.click(picker);
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(picker).toHaveFocus();
  });
});
