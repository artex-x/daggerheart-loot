/* The shared button.
 *
 * It earns a test file of its own now that it has variants: the classes are
 * what carry `.btn`, `.btn.sm` and `.btn.primary` from style.css, and a variant
 * that silently stops applying one of them is a visual difference the pixel
 * comparison would report on a page rather than here. */

import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Button from './Button.svelte';
import { createRawSnippet } from 'svelte';

afterEach(cleanup);

const label = createRawSnippet(() => ({ render: () => '<span>Press</span>' }));

describe('the shared button', () => {
  it('is a button that does not submit anything', () => {
    render(Button, { onclick: () => undefined, children: label });
    expect(screen.getByRole('button', { name: 'Press' })).toHaveAttribute('type', 'button');
  });

  it('carries the classes the live stylesheet keys off', () => {
    render(Button, {
      variant: 'primary',
      size: 'sm',
      onclick: () => undefined,
      children: label
    });
    expect(screen.getByRole('button', { name: 'Press' })).toHaveClass('btn', 'primary', 'sm');
  });

  it('defaults to the plain full-height one', () => {
    render(Button, { onclick: () => undefined, children: label });
    expect(screen.getByRole('button', { name: 'Press' })).toHaveClass('btn', 'plain', 'md');
  });

  it('takes a name of its own where the text is not one', () => {
    /* An icon-only button reads as nothing without it. */
    render(Button, {
      label: 'Отправить',
      title: 'Отправить',
      onclick: () => undefined,
      children: label
    });
    const el = screen.getByRole('button', { name: 'Отправить' });
    expect(el).toHaveAttribute('title', 'Отправить');
  });

  it('leaves the name to its text when none is given', () => {
    render(Button, { onclick: () => undefined, children: label });
    expect(screen.getByRole('button', { name: 'Press' })).not.toHaveAttribute('aria-label');
  });

  it('calls back when pressed', async () => {
    const spy = vi.fn();
    render(Button, { onclick: spy, children: label });
    await userEvent.click(screen.getByRole('button', { name: 'Press' }));
    expect(spy).toHaveBeenCalledOnce();
  });

  it('follows a label that changes under it', async () => {
    /* The language switch changes every label on the page without remounting
       anything, so the update path is a real one rather than a formality. */
    const { rerender } = render(Button, {
      label: 'Отправить',
      title: 'Отправить',
      variant: 'plain',
      size: 'md',
      onclick: () => undefined,
      children: label
    });
    expect(screen.getByRole('button', { name: 'Отправить' })).toBeInTheDocument();

    await rerender({ label: 'Share', title: 'Share', variant: 'primary', size: 'sm' });
    const el = screen.getByRole('button', { name: 'Share' });
    expect(el).toHaveAttribute('title', 'Share');
    expect(el).toHaveClass('btn', 'primary', 'sm');
  });
});
