/* The supplements panel on its own: one chip per supplement roll section, the
   open one gold and the current page. docs/specs/FEATURES.md, "Rolling". */
import { cleanup, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import SupplementNav from './SupplementNav.svelte';
import { sectionHash } from '../lib/hash.js';
import { SUPPLEMENTS } from '../lib/nav.js';
import { fakeEnv, memoryRouter } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const appAt = (hash: string): AppState => new AppState(fakeEnv({ router: memoryRouter(hash) }));

const chips = (name: string): HTMLElement[] =>
  within(screen.getByRole('navigation', { name })).getAllByRole('link');

describe('SupplementNav', () => {
  it('links every supplement section in order, in Russian', () => {
    render(SupplementNav, { app: appAt('#/roll/wondrous') });
    const links = chips('Дополнения');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(
      SUPPLEMENTS.map((x) => sectionHash(x).slice(1))
    );
    const nav = screen.getByRole('navigation', { name: 'Дополнения' });
    for (const name of [
      'Wondrous Environments',
      'Dread GM Toolbox',
      'Vault of Ages',
      "The Dragon's Vault",
      "Arazo's Artifacts",
      'Предметы сообществ',
      'Many Worlds Tavern'
    ])
      expect(within(nav).getByRole('link', { name })).toBeInTheDocument();
  });

  it('names the panel and the community chip in English', () => {
    const app = appAt('#/roll/dread');
    app.setLang('en');
    render(SupplementNav, { app });
    const nav = screen.getByRole('navigation', { name: 'Supplements' });
    expect(within(nav).getByRole('link', { name: 'Community items' })).toBeInTheDocument();
  });

  it('gives three chips a short form under 640 px and keeps the full name as the name', async () => {
    const { container } = render(SupplementNav, { app: appAt('#/roll/wondrous') });
    const nav = screen.getByRole('navigation', { name: 'Дополнения' });
    const shorts: Record<string, string> = {
      'Wondrous Environments': 'Wondrous',
      'Dread GM Toolbox': 'Dread',
      "The Dragon's Vault": "Dragon's Vault"
    };
    for (const [name, short] of Object.entries(shorts)) {
      const chip = within(nav).getByRole('link', { name });
      expect(chip).toHaveAttribute('aria-label', name);
      const span = chip.querySelector('.short');
      expect(span).toHaveAttribute('aria-hidden', 'true');
      expect(span?.textContent).toBe(short);
    }
    for (const name of [
      'Vault of Ages',
      "Arazo's Artifacts",
      'Предметы сообществ',
      'Many Worlds Tavern'
    ]) {
      const chip = within(nav).getByRole('link', { name });
      expect(chip).not.toHaveAttribute('aria-label');
      expect(chip.querySelector('.short')).toBeNull();
    }
    await expectNoA11yViolations(container);
  });

  it.each(SUPPLEMENTS)('lights the %s chip gold with aria-current and no other', async (s) => {
    const { container } = render(SupplementNav, { app: appAt(`#/${s}`) });
    const on = container.querySelectorAll('a.on');
    expect(on).toHaveLength(1);
    expect(on[0]).toHaveAttribute('href', sectionHash(s).slice(1));
    expect(on[0]).toHaveAttribute('aria-current', 'page');
    await expectNoA11yViolations(container);
  });
});
