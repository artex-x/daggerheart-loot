/* ListFind.svelte on its own: the search row of both list pages and its filter sheet, which is
   a sheet at every band (docs/specs/FEATURES.md, "Account and browser lists"). */
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ListFind from './ListFind.svelte';
import type { FacetRow } from '../lib/facets.js';
import type { FilterState } from '../lib/filters.js';
import { fakeEnv } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const ROWS: FacetRow[] = [
  {
    group: 'kind',
    label: 'Вид',
    values: [
      { value: 'item', label: 'Предметы' },
      { value: 'weapon', label: 'Оружие' }
    ]
  }
];

function find(
  over: {
    rows?: FacetRow[];
    picked?: FilterState;
    open?: boolean;
    selectable?: boolean;
    oncopylink?: () => void;
  } = {}
) {
  const app = new AppState(fakeEnv());
  app.band = 'wide';
  const props = {
    app,
    rows: over.rows ?? ROWS,
    picked: over.picked ?? {},
    shown: 3,
    query: '',
    onquery: vi.fn(),
    open: over.open ?? false,
    onopen: vi.fn(),
    onclose: vi.fn(),
    onpick: vi.fn(),
    onclear: vi.fn(),
    onreset: vi.fn(),
    oncopylink: over.oncopylink,
    selectable: over.selectable ?? true,
    onselect: vi.fn()
  };
  return { ...render(ListFind, props), props };
}

describe('the list search row', () => {
  it('draws the box, «Фильтры» and «Выбрать» last, and passes the typed query', async () => {
    const { container, props } = find();
    const row = container.querySelector('.lfind') as HTMLElement;
    expect(row.lastElementChild).toHaveClass('selmode');
    await userEvent.type(screen.getByRole('searchbox', { name: /Поиск/ }), 'м');
    expect(props.onquery).toHaveBeenCalledWith('м');
    await userEvent.click(screen.getByRole('button', { name: 'Выбрать' }));
    expect(props.onselect).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Фильтры' }));
    expect(props.onopen).toHaveBeenCalledOnce();
    await expectNoA11yViolations(container);
  });

  it('draws no «Фильтры» without a filter row and no «Выбрать» while not selectable', () => {
    find({ rows: [], selectable: false });
    expect(screen.queryByRole('button', { name: 'Фильтры' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Выбрать' })).toBeNull();
  });

  it('lights «Фильтры · N» while a value is picked', () => {
    find({ picked: { kind: ['weapon'] } });
    const toggle = screen.getByRole('button', { name: 'Фильтры · 1' });
    expect(toggle).toHaveClass('toggle');
  });

  it('draws the sheet even at the wide band, with no link without a copy action', async () => {
    const { container, props } = find({ open: true, picked: { kind: ['weapon'] } });
    expect(document.querySelector('.fcol')).toBeNull();
    const sheet = screen.getByRole('dialog', { name: 'Фильтры' });
    expect(sheet).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ссылка на фильтры' })).toBeNull();
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(props.onclose).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Фильтры · 1' }));
  });

  it('draws the link in the sheet where the page can copy one', () => {
    find({ open: true, picked: { kind: ['weapon'] }, oncopylink: vi.fn() });
    expect(screen.getByRole('button', { name: 'Ссылка на фильтры' })).toBeInTheDocument();
  });

  it('draws the search box and «Выбрать» alone with no filter props, the page naming its box', async () => {
    const app = new AppState(fakeEnv());
    app.band = 'wide';
    const onquery = vi.fn();
    const { container } = render(ListFind, {
      app,
      query: '',
      onquery,
      placeholder: 'Найти список',
      label: 'Найти список',
      selectable: true,
      onselect: vi.fn(),
      beside: createRawSnippet(() => ({ render: () => '<p class="beside">3 списка</p>' }))
    });
    const row = container.querySelector('.lfind') as HTMLElement;
    expect(screen.getByRole('searchbox', { name: 'Найти список' })).toHaveAttribute(
      'placeholder',
      'Найти список'
    );
    expect(screen.queryByRole('button', { name: /Фильтры/ })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect([...row.children].map((c) => c.className.split(' ')[0])).toEqual([
      'grow',
      'beside',
      'selmode'
    ]);
    await userEvent.type(screen.getByRole('searchbox'), 'л');
    expect(onquery).toHaveBeenCalledWith('л');
    await expectNoA11yViolations(container);
  });
});
