/* The labelled on/off switch: its role and name, its state, a click and Space. */
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Switch from './Switch.svelte';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

describe('Switch', () => {
  it('is a switch named by its label, checked while on, with no title', async () => {
    const { container } = render(Switch, {
      label: 'Свои предметы',
      on: true,
      onchange: vi.fn()
    });
    const input = screen.getByRole('switch', { name: 'Свои предметы' });
    expect(input).toBeChecked();
    expect(input).not.toHaveAttribute('title');
    expect(container.querySelector('.track')).toHaveAttribute('aria-hidden', 'true');
    await expectNoA11yViolations(container);
  });

  it('is unchecked while off, and passes axe', async () => {
    const { container } = render(Switch, {
      label: 'Own items',
      on: false,
      onchange: vi.fn()
    });
    expect(screen.getByRole('switch', { name: 'Own items' })).not.toBeChecked();
    await expectNoA11yViolations(container);
  });

  it('calls onchange with the new state on a click on the label', async () => {
    const onchange = vi.fn();
    render(Switch, { label: 'Свои предметы', on: true, onchange });
    await userEvent.click(screen.getByText('Свои предметы'));
    expect(onchange).toHaveBeenCalledWith(false);
  });

  it('calls onchange with the new state on Space on the focused input', async () => {
    const onchange = vi.fn();
    render(Switch, { label: 'Свои предметы', on: false, onchange });
    await userEvent.tab();
    expect(screen.getByRole('switch')).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(onchange).toHaveBeenCalledWith(true);
  });
});
