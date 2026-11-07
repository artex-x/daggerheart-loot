/* The page head in one order (DESIGN.md, "The Head Order Rule"): the heading, the pills,
 * the pin, the help, the primary from 1000 px; the pills after the primary from 761 to
 * 999 px; the third level under the head. */
import { cleanup, render, screen } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import PageHead from './PageHead.svelte';
import { helpFor } from '../lib/help.js';
import { fakeEnv, memoryRouter } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const nav = createRawSnippet(() => ({
  render: () =>
    '<nav aria-label="Режим"><a href="/roll/std">Обычные</a><a href="/roll/alt">Альтернативные</a></nav>'
}));
const extra = createRawSnippet(() => ({
  render: () => '<span class="headnew"><a class="btn primary" href="/new">Новый</a></span>'
}));
const below = createRawSnippet(() => ({
  render: () => '<div class="tabs" role="group" aria-label="Книги"><a href="/a">A</a></div>'
}));

function head(props: { navBelow?: boolean; withNav?: boolean; sub?: string } = {}) {
  const app = new AppState(fakeEnv({ router: memoryRouter('#/tables/eq_weapon') }));
  const { withNav = true, navBelow = false, sub = 'Строка под заголовком.' } = props;
  /* In the page the head sits in `main`, as axe's region rule needs. */
  const main = document.body.appendChild(document.createElement('main'));
  const view = render(PageHead, {
    target: main,
    props: {
      app,
      title: 'Таблицы',
      sub,
      help: helpFor('tables', 'ru'),
      extra,
      below,
      ...(withNav ? { nav, navBelow } : {})
    }
  });
  const parts = {
    h1: screen.getByRole('heading', { level: 1 }),
    pin: screen.getByRole('button', { name: 'Открывать при запуске' }),
    help: screen.getByRole('button', { name: 'Об этих данных' }),
    primary: screen.getByRole('link', { name: 'Новый' })
  };
  return { view, main, ...parts };
}

afterEach(() => {
  for (const main of document.querySelectorAll('body > main')) main.remove();
});

function expectOrder(...els: Element[]): void {
  for (let i = 1; i < els.length; i++) {
    expect(els[i - 1]?.compareDocumentPosition(els[i] as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  }
}

describe('the page head', () => {
  it('draws the heading, the pills, the pin, the help and the primary in one row from 1000 px', async () => {
    const { main, h1, pin, help, primary } = head();
    const pills = screen.getByRole('navigation', { name: 'Режим' });
    expectOrder(h1, pills, pin, help, primary);
    const row = main.querySelector('.page-head');
    expect(row).toHaveClass('hasnav');
    expect(row).not.toHaveClass('navbelow');
    expect(pills.closest('.headnav')).not.toHaveClass('below');
    await expectNoA11yViolations(main);
  });

  it('moves the pills after the primary from 761 to 999 px', async () => {
    const { main, h1, pin, help, primary } = head({ navBelow: true });
    const pills = screen.getByRole('navigation', { name: 'Режим' });
    expectOrder(h1, pin, help, primary, pills);
    expect(main.querySelector('.page-head')).toHaveClass('navbelow');
    expect(pills.closest('.headnav')).toHaveClass('below');
    /* The order only: the lead's 12 px under a mid-band head is measured in a browser
       (states.js case 112), since jsdom's cascade lets the later `.page-sub` rule win. */
    expect(main.querySelector('.page-head.navbelow + .page-below + .page-sub')).not.toBeNull();
    await expectNoA11yViolations(main);
  });

  it('draws the third level after the head and before the lead', () => {
    const { main } = head();
    const tabs = screen.getByRole('group', { name: 'Книги' });
    const headRow = main.querySelector('.page-head') as HTMLElement;
    expect(headRow.contains(tabs)).toBe(false);
    expect(tabs.closest('.page-below')).not.toBeNull();
    expectOrder(headRow, tabs, main.querySelector('.page-sub') as HTMLElement);
  });

  it('has no pills box without pills: the pin follows the heading', () => {
    const { main, h1, pin } = head({ withNav: false });
    expect(main.querySelector('.headnav')).toBeNull();
    expect(main.querySelector('.page-head')).not.toHaveClass('hasnav');
    expect(h1.nextElementSibling).toBe(pin);
  });

  it('keeps the focus on the same pill when the pills move across 1000 px', async () => {
    const { view } = head();
    const second = screen.getByRole('link', { name: 'Альтернативные' });
    second.focus();
    expect(document.activeElement).toBe(second);
    await view.rerender({ navBelow: true });
    await tick();
    await tick();
    const moved = screen.getByRole('link', { name: 'Альтернативные' });
    expect(moved.closest('.headnav')).toHaveClass('below');
    expect(document.activeElement).toBe(moved);
    await view.rerender({ navBelow: false });
    await tick();
    await tick();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Альтернативные' }));
  });

  it('leaves the focus alone when it is not on a pill', async () => {
    const { view, pin } = head();
    pin.focus();
    await view.rerender({ navBelow: true });
    await tick();
    await tick();
    expect(document.activeElement).toBe(pin);
  });
});
