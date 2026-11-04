/* SelectionBar.svelte on its own: the tri-state «Все», the summary, the actions and
   «Снять выделение» last (DESIGN.md, "Components"). */
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SelectionBar from './SelectionBar.svelte';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const html = (s: string) => createRawSnippet(() => ({ render: () => s }));

function bar(picked: number, total = 3, idle = false) {
  const onall = vi.fn();
  const onclear = vi.fn();
  const view = render(SelectionBar, {
    label: 'Выбранные записи',
    total,
    picked,
    allLabel: 'Выбрать все',
    allText: 'Все',
    count: `Выбрано: ${String(picked)}`,
    clearText: 'Снять выделение',
    onall,
    onclear,
    idle,
    actions: html('<button type="button">Печать</button>')
  });
  const all = screen.queryByRole('checkbox', { name: 'Выбрать все' }) as HTMLInputElement;
  return { ...view, onall, onclear, all };
}

describe('the selection bar', () => {
  it('reads zero ticks with «Все» empty, its label visible and «Снять выделение» last', async () => {
    const { container, all } = bar(0);
    expect(all.checked).toBe(false);
    expect(all.indeterminate).toBe(false);
    expect(container.querySelector('.selall')).toHaveTextContent('Все');
    expect(container.querySelector('.selsumm')).toHaveAttribute('aria-live', 'polite');
    expect(container.querySelector('.selcount')).toHaveTextContent('Выбрано: 0');
    const buttons = screen.getAllByRole('button').map((b) => b.textContent);
    expect(buttons.at(-1)).toBe('Снять выделение');
    await expectNoA11yViolations(container);
  });

  it('reads some ticks as mixed, and all of them as checked', async () => {
    const some = bar(1);
    expect(some.all.indeterminate).toBe(true);
    await expectNoA11yViolations(some.container);
    cleanup();
    const full = bar(3);
    expect(full.all.checked).toBe(true);
    expect(full.all.indeterminate).toBe(false);
    await expectNoA11yViolations(full.container);
  });

  it('calls back on «Все» with the new state and on «Снять выделение»', async () => {
    const { all, onall, onclear } = bar(0);
    await userEvent.click(all);
    expect(onall).toHaveBeenCalledWith(true);
    await userEvent.click(screen.getByRole('button', { name: 'Снять выделение' }));
    expect(onclear).toHaveBeenCalledOnce();
  });

  it('draws no «Все» where the page registers no row', () => {
    bar(0, 0);
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('holds no tab stop while idle, and keeps its live region for the first tick', () => {
    const { container } = bar(0, 3, true);
    expect(container.querySelector('input, button, a')).toBeNull();
    expect(container.querySelector('.selsumm')).toHaveAttribute('aria-live', 'polite');
  });

  it('reads the largest table: every one of 458 ids ticked, the box checked', () => {
    const { all, container } = bar(458, 458);
    expect(all.checked).toBe(true);
    expect(all.indeterminate).toBe(false);
    expect(container.querySelector('.selcount')).toHaveTextContent('Выбрано: 458');
  });

  it('sets the page scroll padding to its height while mounted', () => {
    let fire = (): void => undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: () => void) {
          fire = cb;
        }
        observe(): void {
          fire();
        }
        disconnect(): void {}
      }
    );
    try {
      const { unmount } = bar(1);
      expect(document.documentElement.style.getPropertyValue('--selbar-h')).toBe('0px');
      unmount();
      expect(document.documentElement.style.getPropertyValue('--selbar-h')).toBe('');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
