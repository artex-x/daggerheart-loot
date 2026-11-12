/* The modes of the twelve roll sections: the picker and its sheet up to 760 px, the three
 * pills from 761 px (docs/specs/FEATURES.md, "Chrome"). */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import { SECTION_LABEL, dict } from '../lib/dict.js';
import { sectionHash } from '../lib/hash.js';
import { SUPPLEMENTS } from '../lib/nav.js';
import type { Section } from '../lib/types.js';
import {
  fakeEnv,
  fakeViewport,
  memoryRouter,
  memoryStorage,
  type Band
} from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import ModeRow from './ModeRow.svelte';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView: the sheet calls it once open. */
const scrolled = vi.fn();
Element.prototype.scrollIntoView = scrolled;

const ROLL: readonly Section[] = ['roll/std', 'roll/alt', ...SUPPLEMENTS];

function row(hash: string, band: Band, lang: 'ru' | 'en' = 'ru') {
  const app = new AppState(
    fakeEnv({
      router: memoryRouter(hash),
      viewport: fakeViewport(band),
      storage: memoryStorage({ 'dhloot.lang.v1': lang })
    })
  );
  const view = render(ModeRow, { app });
  const nav = screen.getByRole('navigation', { name: dict(lang).modesLabel });
  return { app, view, nav };
}

describe('the mode pills from 761 px', () => {
  it.each(ROLL)('draws three controls on %s and lights the one for it', (s) => {
    const { nav } = row(sectionHash(s), 'wide');
    const links = within(nav).getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual([
      'Обычные правила',
      'Альтернативные таблицы'
    ]);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/roll/std', '/roll/alt']);
    const lit = [...nav.querySelectorAll('[aria-current="page"]')];
    expect(lit).toHaveLength(1);
    expect(lit[0]?.getAttribute('data-section')).toBe(sectionHash(s));
    const button = within(nav).getByRole('button');
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    expect(button.textContent).toBe(
      s === 'roll/std' || s === 'roll/alt' ? 'Дополнения' : dict('ru')[SECTION_LABEL[s]]
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

  it('names the controls in English', () => {
    const { nav } = row('#/roll/dread_gm_toolbox', 'wide', 'en');
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent)
    ).toEqual(['Standard rules', 'Alternate tables']);
    expect(within(nav).getByRole('button').textContent).toBe('Dread GM Toolbox');
  });

  it.each(['#/tables', '#/search', '#/lists', '#/i/ci1', '#/account'])(
    'draws no mode row on %s',
    (hash) => {
      render(App, { env: fakeEnv({ router: memoryRouter(hash) }) });
      expect(screen.queryByRole('navigation', { name: 'Режим броска' })).toBeNull();
    }
  );

  it('passes axe with the sheet closed and open', async () => {
    const { view, nav } = row('#/roll/vault_of_ages', 'wide');
    await expectNoA11yViolations(view.container);
    await userEvent.click(within(nav).getByRole('button'));
    expect(
      screen.getByRole('dialog', { name: 'Режим броска: Vault of Ages' })
    ).toBeInTheDocument();
    await expectNoA11yViolations(document.body);
  });
});

describe('the mode picker up to 760 px', () => {
  it.each(ROLL)('draws one picker named for %s and no link', (s) => {
    const { nav } = row(sectionHash(s), 'narrow');
    const picker = within(nav).getByRole('button');
    expect(picker).toHaveAttribute('aria-haspopup', 'dialog');
    expect(picker).toHaveAttribute('data-section', sectionHash(s));
    expect(picker).not.toHaveAttribute('aria-current');
    expect(picker.textContent).toBe(dict('ru')[SECTION_LABEL[s]]);
    expect(picker.getAttribute('aria-label')).toBe(
      `Режим броска: ${dict('ru')[SECTION_LABEL[s]]}`
    );
    expect(within(nav).queryByRole('link')).toBeNull();
  });

  it('names the picker in English', () => {
    const { nav } = row('#/roll/alt', 'narrow', 'en');
    expect(
      within(nav).getByRole('button', { name: 'Roll mode: Alternate tables' })
    ).toBeVisible();
  });

  async function open(hash: string, lang: 'ru' | 'en' = 'ru') {
    const r = row(hash, 'narrow', lang);
    const picker = within(r.nav).getByRole('button');
    await userEvent.click(picker);
    const sheet = screen.getByRole('dialog', { name: picker.getAttribute('aria-label') ?? '' });
    return { ...r, picker, sheet, links: within(sheet).getAllByRole('link') };
  }

  it('opens a sheet titled «Бросок» with the twelve modes in order, the open one current', async () => {
    const { sheet, links } = await open('#/roll/vault_of_ages');
    expect(within(sheet).getByRole('heading', { name: 'Бросок' })).toBeInTheDocument();
    expect(links.map((a) => a.textContent.trim())).toEqual(
      ROLL.map((s) => dict('ru')[SECTION_LABEL[s]])
    );
    expect(links.map((a) => a.getAttribute('href'))).toEqual(
      ROLL.map((s) => sectionHash(s).slice(1))
    );
    const current = links.filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current.map((a) => a.getAttribute('href'))).toEqual(['/roll/vault_of_ages']);
    expect(within(sheet).getByRole('group', { name: 'Дополнения' })).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: 'Закрыть' })).toHaveFocus();
    expect(scrolled).toHaveBeenCalled();
    await expectNoA11yViolations(document.body);
  });

  it('titles the sheet «Roll» in English', async () => {
    const { sheet } = await open('#/roll/std', 'en');
    expect(within(sheet).getByRole('heading', { name: 'Roll' })).toBeInTheDocument();
    expect(within(sheet).getByRole('group', { name: 'Supplements' })).toBeInTheDocument();
  });

  it('closes by «Закрыть» and returns the focus to the picker', async () => {
    const { picker } = await open('#/roll/std');
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(picker).toHaveFocus();
  });

  it('closes on a press of the open mode and keeps the focus on the picker', async () => {
    const { picker, links } = await open('#/roll/std');
    const noNavigation = (e: MouseEvent): void => {
      e.preventDefault();
    };
    document.addEventListener('click', noNavigation);
    await userEvent.click(links[0] as HTMLElement);
    document.removeEventListener('click', noNavigation);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(picker).toHaveFocus();
  });

  it('draws the picker in the page and opens the sheet there', async () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/roll/alt'), viewport: fakeViewport('narrow') })
    });
    const picker = await screen.findByRole('button', {
      name: 'Режим броска: Альтернативные таблицы'
    });
    expect(picker.closest('#main')).not.toBeNull();
    expect(screen.queryByRole('link', { name: 'Обычные правила' })).toBeNull();
    await userEvent.click(picker);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('the sheet from 761 px', () => {
  it('opens from «Дополнения» with the same twelve modes', async () => {
    const { nav } = row('#/roll/std', 'wide');
    const button = within(nav).getByRole('button');
    await userEvent.click(button);
    const sheet = screen.getByRole('dialog', { name: 'Режим броска: Обычные правила' });
    expect(within(sheet).getAllByRole('link')).toHaveLength(12);
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(button).toHaveFocus();
  });
});
