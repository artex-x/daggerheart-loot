/* The three jobs of the header: their links, icons and the lit job
 * (docs/specs/FEATURES.md, "Chrome"). */
import { cleanup, render, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { fakeEnv, memoryRouter, memoryStorage } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import TabBar from './TabBar.svelte';

afterEach(cleanup);

const HOME_KEY = 'dhloot.home.v1';

function bar(hash: string, lang: 'ru' | 'en' = 'ru', stored: Record<string, string> = {}) {
  const app = new AppState(
    fakeEnv({
      router: memoryRouter(hash),
      storage: memoryStorage({ 'dhloot.lang.v1': lang, ...stored })
    })
  );
  const view = render(TabBar, { app });
  const nav = view.container.querySelector('nav.tabs') as HTMLElement;
  return { app, view, nav, links: [...nav.querySelectorAll('a')] };
}

describe('the job row', () => {
  it.each([
    ['ru', ['Бросок', 'Таблицы', 'Поиск'], 'Разделы', ['/roll/std', '/tables', '/search']],
    [
      'en',
      ['Roll', 'Tables', 'Search'],
      'Sections',
      ['/en/roll/std', '/en/tables', '/en/search']
    ]
  ] as const)(
    'draws three labeled links with their icons in %s',
    async (lang, names, label, hrefs) => {
      const { view, nav, links } = bar('#/roll/std', lang);
      expect(nav).toHaveAttribute('aria-label', label);
      expect(links.map((a) => a.textContent)).toEqual(names);
      expect(links.map((a) => a.getAttribute('href'))).toEqual(hrefs);
      expect(links.map((a) => a.dataset['job'])).toEqual(['roll', 'tables', 'search']);
      for (const a of links) expect(a.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
      await expectNoA11yViolations(view.container);
    }
  );

  it.each([
    ['#/roll/std', 'roll'],
    ['#/roll/vault_of_ages', 'roll'],
    ['#/roll/hnf', 'roll'],
    ['#/tables/eq_weapon', 'tables'],
    ['#/tables', 'tables'],
    ['#/search', 'search']
  ])('lights one job with aria-current on %s', (hash, job) => {
    const { links } = bar(hash);
    const lit = links.filter((a) => a.getAttribute('aria-current') === 'page');
    expect(lit.map((a) => a.dataset['job'])).toEqual([job]);
    expect(lit[0]).toHaveClass('on');
  });

  it.each(['#/lists', '#/lists/abc', '#/i/ci1', '#/p/set-emberaxe', '#/account', '#/homebrew'])(
    'lights no job on %s',
    (hash) => {
      const { nav } = bar(hash);
      expect(within(nav).queryAllByRole('link', { current: 'page' })).toHaveLength(0);
      expect(nav.querySelector('a.on')).toBeNull();
    }
  );

  it('links «Бросок» to the last roll section of this tab', () => {
    const { links } = bar('#/roll/dread_gm_toolbox');
    expect(links[0]).toHaveAttribute('href', '/roll/dread_gm_toolbox');
  });

  it('links «Бросок» to a pinned roll section when this tab showed no roll', () => {
    const { links } = bar('#/tables', 'ru', { [HOME_KEY]: '#/roll/vault_of_ages' });
    expect(links[0]).toHaveAttribute('href', '/roll/vault_of_ages');
  });
});
