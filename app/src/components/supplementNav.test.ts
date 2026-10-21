/* The supplements panel on its own: one chip per supplement roll section, the
   open one gold and the current page. docs/specs/FEATURES.md, "Rolling". */
import { cleanup, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import SupplementNav from './SupplementNav.svelte';
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
    expect(links.map((a) => a.getAttribute('href'))).toEqual(SUPPLEMENTS.map((s) => `#/${s}`));
    expect(links.map((a) => a.textContent)).toEqual([
      'Wondrous',
      'Dread',
      'Vault of Ages',
      "Dragon's Vault",
      "Arazo's Artifacts",
      'Сообщества'
    ]);
  });

  it('names the panel and the community chip in English', () => {
    const app = appAt('#/roll/dread');
    app.setLang('en');
    render(SupplementNav, { app });
    expect(chips('Supplements').map((a) => a.textContent)).toContain('Communities');
  });

  it.each(SUPPLEMENTS)('lights the %s chip gold with aria-current and no other', async (s) => {
    const { container } = render(SupplementNav, { app: appAt(`#/${s}`) });
    const on = container.querySelectorAll('a.on');
    expect(on).toHaveLength(1);
    expect(on[0]).toHaveAttribute('href', `#/${s}`);
    expect(on[0]).toHaveAttribute('aria-current', 'page');
    await expectNoA11yViolations(container);
  });
});
