/* HitNote.svelte on its own: a read-only list note, and its fold up to 760 px (docs/specs/FEATURES.md,
   "Lists"). jsdom lays nothing out, so the body's heights are faked and restored. */
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HitNote from './HitNote.svelte';
import { dict } from '../lib/dict.js';
import type { Lang } from '../lib/types.js';
import { expectNoA11yViolations } from '../test/a11y.js';

const heightOf = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
const scrollOf = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight');

/** Gives `.nbody` the heights of a note of `scroll` px under a clamp of `client` px. */
function layout(scroll: number, client: number): void {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.classList.contains('nbody') ? scroll : 0;
    }
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.classList.contains('nbody') ? client : 0;
    }
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  for (const [name, desc] of [
    ['clientHeight', heightOf],
    ['scrollHeight', scrollOf]
  ] as const) {
    if (desc) Object.defineProperty(HTMLElement.prototype, name, desc);
    else Reflect.deleteProperty(HTMLElement.prototype, name);
  }
});

const note = (over: Record<string, unknown> = {}, lang: Lang = 'ru') =>
  render(HitNote, {
    icon: 'eye',
    label: lang === 'ru' ? 'Для игроков' : 'For players',
    text: 'First line.\n\nSecond paragraph.',
    t: dict(lang),
    ...over
  });

describe('a read-only note', () => {
  it('draws nothing for an empty text', () => {
    note({ text: '' });
    expect(document.querySelector('.hitnote')).toBeNull();
  });

  it('draws a short note with no toggle, folded or not', async () => {
    layout(60, 60);
    const { container } = note({ fold: true });
    expect(screen.queryByRole('button')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('shows a long note as four lines and a toggle that opens it whole, the focus kept', async () => {
    layout(200, 80);
    const { container } = note({ fold: true });
    const body = document.querySelector('.nbody');
    expect(body).toHaveClass('clamp');
    const toggle = screen.getByRole('button', { name: 'Показать полностью' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expectNoA11yViolations(container);
    await userEvent.click(toggle);
    const less = screen.getByRole('button', { name: 'свернуть' });
    expect(less).toHaveAttribute('aria-expanded', 'true');
    expect(less).toHaveFocus();
    expect(body).not.toHaveClass('clamp');
    await expectNoA11yViolations(container);
    await userEvent.click(less);
    expect(screen.getByRole('button', { name: 'Показать полностью' })).toBeInTheDocument();
    expect(body).toHaveClass('clamp');
  });

  it('names the toggle in English', () => {
    layout(200, 80);
    note({ fold: true }, 'en');
    expect(screen.getByRole('button', { name: 'Show in full' })).toBeInTheDocument();
  });

  it('draws a long note whole with no observer when it does not fold', () => {
    layout(200, 80);
    const made = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor() {
          made();
        }
        observe(): void {}
        disconnect(): void {}
      }
    );
    note();
    expect(screen.queryByRole('button')).toBeNull();
    expect(document.querySelector('.nbody')).not.toHaveClass('clamp');
    expect(made).not.toHaveBeenCalled();
  });

  it('measures again when the observer fires', () => {
    layout(60, 60);
    let fire = (): void => undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: () => void) {
          fire = cb;
        }
        observe(): void {}
        disconnect(): void {}
      }
    );
    note({ fold: true });
    expect(screen.queryByRole('button')).toBeNull();
    layout(200, 80);
    fire();
    return vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'Показать полностью' })).toBeInTheDocument();
    });
  });
});
