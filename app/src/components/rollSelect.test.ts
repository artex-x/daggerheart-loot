/* The choice among parts on a roll page: a native select under the name and the value. */

import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RollSelect from './RollSelect.svelte';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const OPTIONS = [
  { id: 't1', label: 'Ранг 1' },
  { id: 't2', label: 'Ранг 2' }
];

describe('the select', () => {
  it('draws the name over the chosen value', () => {
    const { container } = render(RollSelect, {
      label: 'Раздел',
      value: 't2',
      options: OPTIONS,
      onchange: vi.fn()
    });
    expect(container.querySelector('.pk')).toHaveTextContent('Раздел');
    expect(container.querySelector('.pv')).toHaveTextContent('Ранг 2');
    expect(screen.getByRole('combobox', { name: 'Раздел' })).toHaveValue('t2');
  });

  it('draws no value for an id it does not offer', () => {
    const { container } = render(RollSelect, {
      label: 'Раздел',
      value: 'gone',
      options: OPTIONS,
      onchange: vi.fn()
    });
    expect(container.querySelector('.pv')?.textContent.trim()).toBe('');
  });

  it('calls back with the id of a new choice', async () => {
    const onchange = vi.fn();
    render(RollSelect, { label: 'Раздел', value: 't1', options: OPTIONS, onchange });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Раздел' }), 't2');
    expect(onchange).toHaveBeenCalledExactlyOnceWith('t2');
  });

  it('has no axe violations', async () => {
    const { container } = render(RollSelect, {
      label: 'Раздел',
      value: 't1',
      options: OPTIONS,
      onchange: vi.fn()
    });
    await expectNoA11yViolations(container);
  });
});
