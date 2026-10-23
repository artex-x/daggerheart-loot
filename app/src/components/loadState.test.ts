/* The load line's «Повторить» hands focus on when the read that answers removes it
 * (docs/specs/FEATURES.md, rule 20): to the group's lead control when given, else `#main`;
 * focus that moved elsewhere stays, and a retry that fails keeps its button. */

import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tick } from 'svelte';
import LoadState from './LoadState.svelte';
import { dict } from '../lib/dict.js';
import { expectNoA11yViolations } from '../test/a11y.js';

const t = dict('ru');
let main: HTMLElement;
let lead: HTMLInputElement;

beforeEach(() => {
  main = document.createElement('main');
  main.id = 'main';
  main.tabIndex = -1;
  lead = document.createElement('input');
  lead.setAttribute('aria-label', 'Новый список');
  document.body.append(main, lead);
});
afterEach(() => {
  cleanup();
  main.remove();
  lead.remove();
});

const settle = async (): Promise<void> => {
  await tick();
  await Promise.resolve();
};

describe('the retry that leaves', () => {
  it('moves focus to #main when the read answers', async () => {
    const onretry = vi.fn();
    const { unmount, container } = render(LoadState, {
      t,
      failed: true,
      text: 'Не получилось загрузить запросы.',
      onretry
    });
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onretry).toHaveBeenCalledOnce();
    unmount();
    await settle();
    expect(document.activeElement).toBe(main);
  });

  it('moves focus to the lead control when one is given', async () => {
    const { unmount } = render(LoadState, {
      t,
      failed: true,
      text: 'x',
      onretry: () => undefined,
      after: () => lead
    });
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    unmount();
    await settle();
    expect(document.activeElement).toBe(lead);
  });

  it('leaves focus that moved elsewhere, and moves nothing with no press', async () => {
    const first = render(LoadState, { t, failed: true, text: 'x', onretry: () => undefined });
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    lead.focus();
    first.unmount();
    await settle();
    expect(document.activeElement).toBe(lead);
    lead.blur();
    const second = render(LoadState, { t, failed: true, text: 'x', onretry: () => undefined });
    second.unmount();
    await settle();
    expect(document.activeElement).toBe(document.body);
  });

  it('keeps the same button, focused, when the retry fails', async () => {
    const { rerender } = render(LoadState, {
      t,
      failed: true,
      text: 'x',
      onretry: () => undefined
    });
    const button = screen.getByRole('button', { name: 'Повторить' });
    await userEvent.click(button);
    await rerender({ t, failed: true, text: 'x', onretry: () => undefined });
    await settle();
    expect(screen.getByRole('button', { name: 'Повторить' })).toBe(button);
    expect(document.activeElement).toBe(button);
  });
});
