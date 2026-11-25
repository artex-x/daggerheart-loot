/* ListRows.svelte: the account's lists as rows, in the three modes the add menu and the
 * add sheet use (docs/specs/FEATURES.md, "Lists"). */

import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ListRows from './ListRows.svelte';
import type { StoredList } from '../lib/lists.js';
import { fakeEnv } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const list = (id: string, name: string): StoredList => ({ id, name, ids: [] });
const THREE = [list('a', 'Клад дракона'), list('b', 'Лавка в порту'), list('c', 'Инвентарь')];
const MANY = Array.from({ length: 8 }, (_, i) => list('m' + String(i), 'Список ' + String(i)));

function draw(over: Record<string, unknown> = {}) {
  const app = new AppState(fakeEnv());
  const onpick = vi.fn();
  const onquery = vi.fn();
  const view = render(ListRows, {
    app,
    lists: THREE,
    mode: 'add',
    idBase: 't',
    query: '',
    onquery,
    onpick,
    ...over
  });
  return { ...view, onpick, onquery };
}

describe('the add mode', () => {
  it('draws a button per list with its name and count, and presses the list', async () => {
    const { onpick, container } = draw({ onnew: vi.fn() });
    const row = screen.getByRole('button', { name: 'Клад дракона' });
    expect(row).not.toHaveAttribute('aria-pressed');
    expect(row).toHaveAccessibleDescription('0 позиций');
    await userEvent.click(row);
    expect(onpick).toHaveBeenCalledWith(THREE[0]);
    expect(screen.getByRole('button', { name: 'Новый список' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('draws only the new-list row where the reader holds no list, and the nothing line for none', () => {
    const none = draw({ showRows: false, onnew: vi.fn() });
    expect(screen.queryByRole('button', { name: 'Клад дракона' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Новый список' })).toBeInTheDocument();
    none.unmount();
    draw({ lists: [] });
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
  });

  it('takes the new-list row place with the creating snippet', async () => {
    const { createRawSnippet } = await import('svelte');
    draw({
      onnew: vi.fn(),
      creating: createRawSnippet(() => ({ render: () => '<input aria-label="Название" />' }))
    });
    expect(screen.getByRole('textbox', { name: 'Название' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Новый список' })).toBeNull();
  });
});

describe('the toggle mode', () => {
  it('presses a list the check marks, and leaves the others unpressed', async () => {
    const { container } = draw({ mode: 'toggle', checked: (l: StoredList) => l.id === 'b' });
    expect(screen.getByRole('button', { name: 'Лавка в порту' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Клад дракона' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    await expectNoA11yViolations(container);
  });

  it('draws a busy row disabled and does not press it', async () => {
    const { onpick } = draw({ mode: 'toggle', busyId: 'a' });
    const row = screen.getByRole('button', { name: 'Клад дракона' });
    expect(row).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(row);
    expect(onpick).not.toHaveBeenCalled();
  });
});

describe('the choose mode', () => {
  it('draws a radio group where one row is checked, and a press only reports the choice', async () => {
    const { onpick, container } = draw({
      mode: 'choose',
      labelledby: 'lbl',
      checked: (l: StoredList) => l.id === 'c'
    });
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-labelledby', 'lbl');
    expect(screen.getByRole('radio', { name: 'Инвентарь' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByRole('radio', { name: 'Клад дракона' })).toHaveAttribute(
      'aria-checked',
      'false'
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Клад дракона' }));
    expect(onpick).toHaveBeenCalledOnce();
    await expectNoA11yViolations(container);
  });
});

describe('the search box', () => {
  it('draws none below eight lists, and from eight narrows the rows by the query', async () => {
    const few = draw();
    expect(screen.queryByRole('searchbox')).toBeNull();
    few.unmount();
    const { onquery, rerender } = draw({ lists: MANY });
    const box = screen.getByRole('searchbox', { name: 'Найти список' });
    await userEvent.type(box, '7');
    expect(onquery).toHaveBeenLastCalledWith('7');
    await rerender({ query: '7' });
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      expect.stringContaining('Список 7')
    ]);
  });
});
