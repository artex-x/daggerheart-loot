/* The tab bar's own scroll-into-view, off P11 - jsdom has no layout, so the
 * geometry `TabBar.svelte`'s effect reads is defined by hand here, and
 * `scrollIntoView` is left unstubbed on purpose: calling it would throw,
 * which is the proof the fix reads `offsetLeft` arithmetic instead. */
import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { dict } from '../lib/dict.js';
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
