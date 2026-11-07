/* The mode row of the nine roll sections and its supplements menu
 * (docs/specs/FEATURES.md, "Chrome"). */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import { SECTION_LABEL, dict } from '../lib/dict.js';
import { sectionHash } from '../lib/hash.js';
import { SUPPLEMENTS } from '../lib/nav.js';
import type { Section } from '../lib/types.js';
import { fakeEnv, memoryRouter, memoryStorage } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import ModeRow from './ModeRow.svelte';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView: the supplements menu calls it once open. */
Element.prototype.scrollIntoView = vi.fn();

const ROLL: readonly Section[] = ['roll/std', 'roll/alt', ...SUPPLEMENTS];

function row(hash: string, lang: 'ru' | 'en' = 'ru') {
  const app = new AppState(
    fakeEnv({ router: memoryRouter(hash), storage: memoryStorage({ 'dhloot.lang.v1': lang }) })
  );
  const view = render(ModeRow, { app });
  const nav = screen.getByRole('navigation', { name: dict(lang).modesLabel });
  return { app, view, nav };
}

const button = (nav: HTMLElement): HTMLElement =>
  within(nav).getByRole('button', { expanded: false });

describe('the mode row', () => {
  it.each(ROLL)('draws three controls on %s and lights the one for it', (s) => {
    const { nav } = row(sectionHash(s));
    const links = within(nav).getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual([
      'Обычные правила',
      'Альтернативные таблицы'
    ]);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/roll/std', '/roll/alt']);
    const lit = [...nav.querySelectorAll('[aria-current="page"]')];
    expect(lit).toHaveLength(1);
    expect(lit[0]?.getAttribute('data-section')).toBe(sectionHash(s));
    const sup = button(nav);
    expect(sup).toHaveAttribute('aria-haspopup', 'menu');
    expect(sup.textContent).toBe(
      s.startsWith('roll/s') || s === 'roll/alt' ? 'Дополнения' : dict('ru')[SECTION_LABEL[s]]
    );
  });

  /* Rule 4: the heading names the job, «Бросок»; the lit control reads the page's name,
     as the tab title does. */
  it.each(ROLL)(
    'reads the tab title of %s on its lit control under the heading «Бросок»',
    async (s) => {
      render(App, { env: fakeEnv({ router: memoryRouter(sectionHash(s)) }) });
      const h1 = await screen.findByRole('heading', { level: 1 });
      expect(h1.textContent).toBe('Бросок');
      const nav = screen.getByRole('navigation', { name: 'Режим броска' });
      const lit = nav.querySelector('[aria-current="page"]')?.textContent ?? '';
      expect(lit).not.toBe('');
      expect(document.title.startsWith(`${lit} - `)).toBe(true);
    }
  );

  it('draws the same three controls with no row of its own in the page head', async () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/roll/alt') }));
    const view = render(ModeRow, { app, inhead: true });
    const nav = screen.getByRole('navigation', { name: 'Режим броска' });
    expect(nav).toHaveClass('inhead');
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent)
    ).toEqual(['Обычные правила', 'Альтернативные таблицы']);
    expect(button(nav).textContent).toBe('Дополнения');
    await expectNoA11yViolations(view.container);
  });

  it.each(['#/tables', '#/search', '#/lists', '#/i/ci1', '#/account'])(
    'draws no mode row on %s',
    (hash) => {
      render(App, { env: fakeEnv({ router: memoryRouter(hash) }) });
      expect(screen.queryByRole('navigation', { name: 'Режим броска' })).toBeNull();
    }
  );

  it('names the controls in English', () => {
    const { nav } = row('#/roll/dread_gm_toolbox', 'en');
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent)
    ).toEqual(['Standard rules', 'Alternate tables']);
    expect(button(nav).textContent).toBe('Dread GM Toolbox');
  });

  it('passes axe with the menu closed', async () => {
    const { view } = row('#/roll/vault_of_ages');
    await expectNoA11yViolations(view.container);
  });
});

describe('the supplements menu', () => {
  async function open(hash: string, lang: 'ru' | 'en' = 'ru') {
    const r = row(hash, lang);
    await userEvent.click(button(r.nav));
    const menu = screen.getByRole('menu', { name: dict(lang).grpSupplements });
    return { ...r, menu, items: within(menu).getAllByRole('menuitem') };
  }

  it('holds the ten supplements in order with the open one checked, the first focused', async () => {
    const { view, menu, items } = await open('#/roll/vault_of_ages');
    expect(items.map((i) => i.textContent)).toEqual(
      SUPPLEMENTS.map((s) => dict('ru')[SECTION_LABEL[s]])
    );
    expect(items.map((i) => i.getAttribute('href'))).toEqual(
      SUPPLEMENTS.map((s) => sectionHash(s).slice(1))
    );
    const current = items.filter((i) => i.getAttribute('aria-current') === 'page');
    expect(current.map((i) => i.getAttribute('href'))).toEqual(['/roll/vault_of_ages']);
    expect(current[0]?.querySelector('svg')).not.toBeNull();
    expect(items.filter((i) => i.querySelector('svg'))).toHaveLength(1);
    expect(menu).toHaveClass('supmenu');
    await waitFor(() => {
      expect(items[0]).toHaveFocus();
    });
    await expectNoA11yViolations(view.container);
  });

  it('checks no item off a supplement page', async () => {
    const { items } = await open('#/roll/std');
    expect(items.filter((i) => i.getAttribute('aria-current'))).toHaveLength(0);
  });

  it('moves with Down, Up, Home and End, and closes on Escape to its button', async () => {
    const { nav, items } = await open('#/roll/std', 'en');
    await waitFor(() => {
      expect(items[0]).toHaveFocus();
    });
    await userEvent.keyboard('{ArrowDown}');
    expect(items[1]).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(items[9]).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(items[0]).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(items[9]).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(button(nav)).toHaveFocus();
  });

  it('returns the focus to its button after a supplement is picked', async () => {
    const { nav, items } = await open('#/roll/std');
    const noNavigation = (e: MouseEvent): void => {
      e.preventDefault();
    };
    document.addEventListener('click', noNavigation);
    await userEvent.click(items[3] as HTMLElement);
    document.removeEventListener('click', noNavigation);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(button(nav)).toHaveFocus();
  });

  it('closes on a click outside it', async () => {
    await open('#/roll/std');
    await userEvent.click(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes when the focus moves elsewhere', async () => {
    const { nav } = await open('#/roll/std');
    within(nav).getAllByRole('link')[0]?.focus();
    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull();
    });
  });

  it('closes when a navigation happens', async () => {
    const { app } = await open('#/roll/std');
    app.go('#/roll/dread_gm_toolbox');
    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull();
    });
  });
});
