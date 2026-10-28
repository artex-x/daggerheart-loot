/* The tab bar's own scroll-into-view, off P11 - jsdom has no layout, so the
 * geometry `TabBar.svelte`'s effect reads is defined by hand here, and
 * `scrollIntoView` is left unstubbed on purpose: calling it would throw,
 * which is the proof the fix reads `offsetLeft` arithmetic instead. */
import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { dict } from '../lib/dict.js';
import { SUPPLEMENTS } from '../lib/nav.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import TabBar from './TabBar.svelte';

afterEach(cleanup);

const throwOnScrollIntoView = (el: HTMLElement): void => {
  el.scrollIntoView = () => {
    throw new Error('must not call scrollIntoView');
  };
};

describe('keeping the lit tab in view', () => {
  it('centers the newly active tab in the nav via scrollLeft arithmetic', async () => {
    const { container, rerender } = render(TabBar, {
      t: dict('ru'),
      current: 'roll/std',
      label: 'Разделы'
    });
    const nav = container.querySelector('nav.tabs') as HTMLElement;
    const tablesTab = [...nav.querySelectorAll('a')].find(
      (a) => a.getAttribute('href') === '#/tables'
    ) as HTMLAnchorElement;

    Object.defineProperty(nav, 'clientWidth', { value: 300, configurable: true });
    Object.defineProperty(tablesTab, 'offsetLeft', { value: 500, configurable: true });
    Object.defineProperty(tablesTab, 'offsetWidth', { value: 60, configurable: true });
    throwOnScrollIntoView(tablesTab);

    await rerender({ t: dict('ru'), current: 'tables', label: 'Разделы' });
    // target = offsetLeft - (clientWidth - offsetWidth) / 2 = 500 - 120 = 380
    expect(nav.scrollLeft).toBe(380);
  });

  it('does not scroll past the left edge for a tab near the start', async () => {
    const { container, rerender } = render(TabBar, {
      t: dict('ru'),
      current: 'search',
      label: 'Разделы'
    });
    const nav = container.querySelector('nav.tabs') as HTMLElement;
    const stdTab = [...nav.querySelectorAll('a')].find(
      (a) => a.getAttribute('href') === '#/roll/std'
    ) as HTMLAnchorElement;

    Object.defineProperty(nav, 'clientWidth', { value: 300, configurable: true });
    Object.defineProperty(stdTab, 'offsetLeft', { value: 10, configurable: true });
    Object.defineProperty(stdTab, 'offsetWidth', { value: 60, configurable: true });
    throwOnScrollIntoView(stdTab);

    await rerender({ t: dict('ru'), current: 'roll/std', label: 'Разделы' });
    expect(nav.scrollLeft).toBe(0);
  });

  it('does nothing when nothing is lit', () => {
    const { container } = render(TabBar, { t: dict('ru'), current: null, label: 'Разделы' });
    const nav = container.querySelector('nav.tabs') as HTMLElement;
    expect(nav.scrollLeft).toBe(0);
  });
});

describe('the five tabs', () => {
  it('draws five links without #/lists, and Tables keeps its separator', () => {
    const { container } = render(TabBar, { t: dict('ru'), current: null, label: 'Разделы' });
    const links = [...container.querySelectorAll('nav.tabs a')];
    expect(links).toHaveLength(5);
    expect(links.map((a) => a.getAttribute('href'))).not.toContain('#/lists');
    expect(container.querySelector('a[href="#/tables"]')).toHaveClass('sep');
  });

  it('lights no tab on #/lists', () => {
    const { container } = render(TabBar, { t: dict('ru'), current: 'lists', label: 'Разделы' });
    expect(container.querySelector('nav.tabs a[aria-current="page"]')).toBeNull();
  });
});

describe('the supplements tab', () => {
  const lit = (container: HTMLElement): (string | null)[] =>
    [...container.querySelectorAll('nav.tabs a[aria-current="page"]')].map((a) =>
      a.getAttribute('href')
    );

  it('draws Core rules, the alternate tables and one supplements tab before Tables', () => {
    const { container } = render(TabBar, { t: dict('en'), current: null, label: 'Sections' });
    expect([...container.querySelectorAll('nav.tabs a')].map((a) => a.textContent)).toEqual([
      'Standard rules',
      'Alt. tables',
      'Supplements',
      'Tables',
      'Search'
    ]);
  });

  it.each(SUPPLEMENTS)('lights «Дополнения» with aria-current on %s', (s) => {
    const { container } = render(TabBar, { t: dict('ru'), current: s, label: 'Разделы' });
    expect(lit(container)).toEqual(['#/roll/wondrous_environments']);
    const tab = container.querySelector('a.on') as HTMLElement;
    expect(tab.textContent).toBe('Дополнения');
  });

  it.each(['roll/std', 'roll/alt', 'tables'] as const)(
    'lights its own tab and not «Дополнения» on %s',
    (s) => {
      const { container } = render(TabBar, { t: dict('ru'), current: s, label: 'Разделы' });
      expect(lit(container)).toEqual([`#/${s}`]);
    }
  );

  it('has no axe violations with the supplements tab lit', async () => {
    const { container } = render(TabBar, {
      t: dict('ru'),
      current: 'roll/voa',
      label: 'Разделы'
    });
    await expectNoA11yViolations(container);
  });
});
