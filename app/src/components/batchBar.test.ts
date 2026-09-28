/* BatchBar.svelte on its own: the strip the list page's rows and the index's
 * account cards share. The callers' own tests drive it through their pages
 * (listPage.test.ts, listsPage.test.ts); this file proves the states every
 * caller relies on - idle, some ticked, all ticked - and the two optional
 * parts only the list page passes. */
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BatchBar from './BatchBar.svelte';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const html = (s: string) => createRawSnippet(() => ({ render: () => s }));
const actions = html('<button type="button">Удалить (1)</button>');

const base = {
  total: 3,
  label: 'Выбрать все',
  count: 'Выбрано 1',
  onall: () => undefined,
  actions
};

const box = (): HTMLInputElement => screen.getByRole('checkbox', { name: 'Выбрать все' });
const live = (c: Element): Element => {
  const el = c.querySelector('[aria-live="polite"]');
  if (!el) throw new Error('no live region');
  return el;
};

describe('the selection strip', () => {
  it('shows the select-all text and an empty live region while nothing is ticked', async () => {
    const { container } = render(BatchBar, { ...base, picked: 0 });
    expect(box().checked).toBe(false);
    expect(box().indeterminate).toBe(false);
    expect(container.querySelector('.batch')).not.toHaveClass('on');
    expect(container.querySelector('.batch-all')).toHaveTextContent('Выбрать все');
    expect(live(container)).toBeEmptyDOMElement();
    expect(screen.queryByRole('button')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('draws the count, the summary and the actions while some are ticked', async () => {
    const { container } = render(BatchBar, {
      ...base,
      picked: 1,
      summary: html('<span class="extra">Итого 5</span>')
    });
    expect(container.querySelector('.batch')).toHaveClass('on');
    expect(box().checked).toBe(false);
    expect(box().indeterminate).toBe(true);
    expect(container.querySelector('.batch-all')).toHaveTextContent('');
    expect(live(container)).toHaveTextContent('Выбрано 1 Итого 5');
    expect(screen.getByRole('button', { name: 'Удалить (1)' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('checks the box when every one is ticked', async () => {
    const { container } = render(BatchBar, { ...base, picked: 3, count: 'Выбрано 3' });
    expect(box().checked).toBe(true);
    expect(box().indeterminate).toBe(false);
    await expectNoA11yViolations(container);
  });

  it("hands the box's new state to onall", async () => {
    const onall = vi.fn();
    const { container, rerender } = render(BatchBar, { ...base, picked: 0, onall });
    await userEvent.click(box());
    expect(onall).toHaveBeenLastCalledWith(true);
    await rerender({ ...base, picked: 3, onall });
    await userEvent.click(box());
    expect(onall).toHaveBeenLastCalledWith(false);
    await expectNoA11yViolations(container);
  });

  it('joins the rows under it and draws the part below inside the strip', async () => {
    const { container } = render(BatchBar, {
      ...base,
      picked: 1,
      joined: true,
      below: html('<div class="under">Цены</div>')
    });
    const strip = container.querySelector('.batch');
    expect(strip).toHaveClass('joined');
    expect(strip?.querySelector('.under')).toHaveTextContent('Цены');
    await expectNoA11yViolations(container);
  });

  it('stands alone by default', async () => {
    const { container } = render(BatchBar, { ...base, picked: 0 });
    expect(container.querySelector('.batch')).not.toHaveClass('joined');
    await expectNoA11yViolations(container);
  });
});
