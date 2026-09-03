/* Two render forms of the same chip, off `.chip` in style.css.
 *
 * Both are exercised end to end through other components already - the roll
 * pickers press the button form, the table nav clicks the link form - so this
 * file only has to prove the two forms and the shared bits (on, sub, size)
 * work the same regardless of which element they land on. */

import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Chip from './Chip.svelte';

afterEach(cleanup);

describe('the button form', () => {
  it('is pressed when on, and calls back on click', () => {
    const onclick = vi.fn();
    render(Chip, { label: 'Обычная', on: true, onclick });
    const btn = screen.getByRole('button', { name: 'Обычная' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    btn.click();
    expect(onclick).toHaveBeenCalledOnce();
  });

  it('carries a second, quieter line when given one', () => {
    render(Chip, { label: 'Обычная', on: false, sub: 'Ранг 1', onclick: vi.fn() });
    expect(screen.getByText('Ранг 1')).toBeInTheDocument();
  });
});

describe('the link form', () => {
  it('is a real link, current when on, off otherwise', () => {
    render(Chip, { label: 'Core', on: true, href: '#/tables/core_item' });
    const link = screen.getByRole('link', { name: 'Core' });
    expect(link).toHaveAttribute('href', '#/tables/core_item');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('carries no aria-current when it is not the one chosen', () => {
    render(Chip, { label: 'Hope & Fear', on: false, href: '#/tables/hnf_item' });
    expect(screen.getByRole('link', { name: 'Hope & Fear' })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('takes the small size the table nav’s second row uses', () => {
    render(Chip, { label: 'Предметы', on: false, href: '#/tables/core_item', size: 'sm' });
    expect(screen.getByRole('link', { name: 'Предметы' }).className).toContain('sm');
  });

  it('can carry a second line too, since the shape is shared with the button form', () => {
    render(Chip, { label: 'Core', on: false, href: '#/tables/core_item', sub: 'Предметы' });
    expect(screen.getByText('Предметы')).toBeInTheDocument();
  });

  it('can carry a title, same as the button form', () => {
    render(Chip, { label: 'Core', on: false, href: '#/tables/core_item', title: 'Core' });
    expect(screen.getByRole('link', { name: 'Core' })).toHaveAttribute('title', 'Core');
  });
});
