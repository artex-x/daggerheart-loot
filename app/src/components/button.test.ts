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

  it('carries the toggle variant, for the filter strip once something is picked', () => {
    render(Button, {
      variant: 'toggle',
      size: 'sm',
      onclick: () => undefined,
      children: label
    });
    expect(screen.getByRole('button', { name: 'Press' })).toHaveClass('btn', 'toggle', 'sm');
  });

  it('carries aria-expanded for a button that folds a panel open', () => {
    render(Button, { expanded: false, onclick: () => undefined, children: label });
    expect(screen.getByRole('button', { name: 'Press' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('leaves aria-expanded off a button that does not fold anything', () => {
    render(Button, { onclick: () => undefined, children: label });
    expect(screen.getByRole('button', { name: 'Press' })).not.toHaveAttribute('aria-expanded');
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

  it('carries the ghost variant, for the cancel button beside a primary one', () => {
    render(Button, { variant: 'ghost', size: 'sm', onclick: () => undefined, children: label });
    expect(screen.getByRole('button', { name: 'Press' })).toHaveClass('btn', 'ghost', 'sm');
  });

  it('carries the pressed look with `on`, without changing its variant', () => {
    render(Button, {
      variant: 'primary',
      on: true,
      onclick: () => undefined,
      children: label
    });
    expect(screen.getByRole('button', { name: 'Press' })).toHaveClass('btn', 'primary', 'on');
  });

  it('leaves the pressed class off by default', () => {
    render(Button, { onclick: () => undefined, children: label });
    expect(screen.getByRole('button', { name: 'Press' })).not.toHaveClass('on');
  });

  it('draws a caret after the children, flipped by expanded', () => {
    const { container, rerender } = render(Button, {
      caret: true,
      expanded: false,
      onclick: () => undefined,
      children: label
    });
    const caret = container.querySelector('i.caret');
    expect(caret).toBeInTheDocument();
    expect(caret).not.toHaveClass('up');

    void rerender({ caret: true, expanded: true, onclick: () => undefined });
    expect(container.querySelector('i.caret')).toHaveClass('up');
  });

  it('draws no caret unless asked', () => {
    const { container } = render(Button, { onclick: () => undefined, children: label });
    expect(container.querySelector('i.caret')).not.toBeInTheDocument();
  });

  it('draws a caret on the href form too', () => {
    const { container } = render(Button, { href: '#/tables', caret: true, children: label });
    expect(container.querySelector('a i.caret')).toBeInTheDocument();
  });

  it('opens the href form in a new tab by default', () => {
    render(Button, { href: '#/tables', children: label });
    const el = screen.getByRole('link', { name: 'Press' });
    expect(el).toHaveAttribute('target', '_blank');
    expect(el).toHaveAttribute('rel', 'noopener');
  });

  it('omits target and rel when sameTab is set - the print link opens in place', () => {
    render(Button, { href: '#/print/ci1', sameTab: true, children: label });
    const el = screen.getByRole('link', { name: 'Press' });
    expect(el).not.toHaveAttribute('target');
    expect(el).not.toHaveAttribute('rel');
  });
});
