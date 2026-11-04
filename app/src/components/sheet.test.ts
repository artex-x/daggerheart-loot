/* Sheet.svelte: the bottom sheet's name, its three ways to close, the dialog flag and the
   head and foot snippets (DESIGN.md, "Components"). */
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Sheet from './Sheet.svelte';
import { fakeEnv } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const html = (s: string) => createRawSnippet(() => ({ render: () => s }));

function open(): {
  app: AppState;
  onclose: ReturnType<typeof vi.fn>;
  dialog: HTMLDialogElement;
} {
  const app = new AppState(fakeEnv());
  const onclose = vi.fn();
  render(Sheet, {
    app,
    label: 'Фильтры',
    title: 'Фильтры · 2',
    onclose,
    head: html('<button type="button">Ссылка на фильтры</button>'),
    children: html('<p>Тело</p>'),
    foot: html('<button type="button">Показать 4</button>')
  });
  return {
    app,
    onclose,
    dialog: screen.getByRole<HTMLDialogElement>('dialog', { name: 'Фильтры' })
  };
}

describe('the bottom sheet', () => {
  it('opens as a named modal with its head, body and foot, the focus on «Закрыть»', async () => {
    const { app, dialog } = open();
    expect(dialog.open).toBe(true);
    expect(app.dialogOpen).toBe(true);
    expect(screen.getByRole('heading', { name: 'Фильтры · 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ссылка на фильтры' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Показать 4' })).toBeInTheDocument();
    expect(screen.getByText('Тело')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Закрыть' })).toHaveFocus();
    await expectNoA11yViolations(document.body);
  });

  it('closes on «Закрыть» and calls back once', async () => {
    const { onclose, dialog } = open();
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(dialog.open).toBe(false);
    expect(onclose).toHaveBeenCalledOnce();
  });

  it('closes on a press on the scrim, and not on a press inside', async () => {
    const { onclose, dialog } = open();
    await userEvent.click(screen.getByText('Тело'));
    expect(onclose).not.toHaveBeenCalled();
    await userEvent.click(dialog);
    expect(onclose).toHaveBeenCalledOnce();
  });

  it('closes on Escape through the native close event', () => {
    const { onclose, dialog } = open();
    dialog.close();
    expect(onclose).toHaveBeenCalledOnce();
  });

  it('clears the dialog flag when it leaves', () => {
    const app = new AppState(fakeEnv());
    const view = render(Sheet, {
      app,
      label: 'Таблица',
      title: 'Таблица',
      onclose: vi.fn(),
      children: html('<p>Тело</p>')
    });
    expect(app.dialogOpen).toBe(true);
    view.unmount();
    expect(app.dialogOpen).toBe(false);
  });
});
