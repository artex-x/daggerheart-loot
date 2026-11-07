/* The meta-line toggle of both list pages: its name, its open state and its chevron. */

import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MetaToggle from './MetaToggle.svelte';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

describe('the meta-line toggle', () => {
  it('is named by its label, says its open state and hides its chevron', async () => {
    const onclick = vi.fn();
    const { container } = render(MetaToggle, { label: 'Заметки', expanded: false, onclick });
    const button = screen.getByRole('button', { name: 'Заметки' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await userEvent.click(button);
    expect(onclick).toHaveBeenCalledOnce();
    await expectNoA11yViolations(container);
  });

  it('says it is open while its content shows', async () => {
    const { container } = render(MetaToggle, {
      label: 'Заметка',
      expanded: true,
      onclick: vi.fn()
    });
    expect(screen.getByRole('button', { name: 'Заметка' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await expectNoA11yViolations(container);
  });
});
