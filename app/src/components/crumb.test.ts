/* The way back and the heading on one row: the item editor's head and the print page's
   (docs/specs/FEATURES.md, "Homebrew" and "Print"). */

import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Crumb from './Crumb.svelte';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

describe('the crumb', () => {
  it('draws the link with its icon and label, then the heading with its title', async () => {
    const { container } = render(Crumb, {
      href: '/homebrew',
      label: 'Мои предметы',
      title: 'Топор Тлеющих Углей'
    });
    const link = screen.getByRole('link', { name: 'Мои предметы' });
    expect(link).toHaveAttribute('href', '/homebrew');
    expect(link).toHaveClass('back');
    expect(link.querySelector('svg')).not.toBeNull();
    const heading = screen.getByRole('heading', { level: 1, name: 'Топор Тлеющих Углей' });
    expect(heading).toHaveAttribute('title', 'Топор Тлеющих Углей');
    expect(link.parentElement).toBe(heading.parentElement);
    expect(link.parentElement).toHaveClass('crumb');
    await expectNoA11yViolations(container);
  });

  it('hands the press to `onback` first, which can keep the link from following', async () => {
    const onback = vi.fn((e: MouseEvent) => {
      e.preventDefault();
    });
    const { container } = render(Crumb, {
      href: '/roll/std',
      label: 'Назад',
      title: 'Печать карточек',
      onback
    });
    const link = screen.getByRole('link', { name: 'Назад' });
    expect(await fireEvent.click(link)).toBe(false);
    expect(onback).toHaveBeenCalledOnce();
    expect(onback.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
    await expectNoA11yViolations(container);
  });
});
