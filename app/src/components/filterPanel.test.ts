/* FilterPanel.svelte on its own: «Все» as the neutral default, a pick, the column from
   1000 px and the sheet below it, the head count, the link, the fold and the focus after
   «Сбросить» (docs/specs/FEATURES.md, "Tables and search"). */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FilterPanel from './FilterPanel.svelte';
import type { FacetRow } from '../lib/facets.js';
import type { FilterState } from '../lib/filters.js';
import { fakeEnv, type Band } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const ROWS: FacetRow[] = [
  {
    group: 'tier',
    label: 'Ранг',
    values: ['1', '2', '3', '4'].map((v) => ({ value: v, label: v }))
  },
  {
    group: 'src',
    label: 'Источник',
    values: Array.from({ length: 14 }, (_, i) => ({
      value: `s${String(i)}`,
      label: `Книга ${String(i)}`
    }))
  }
];

function panel(
  picked: FilterState,
  band: Band,
  over: {
    open?: boolean;
    oncopylink?: () => void;
    own?: { on: boolean; onchange: () => void };
  } = {}
) {
  const app = new AppState(fakeEnv());
  const props = {
    app,
    rows: ROWS,
    picked,
    shown: 4,
    band,
    open: over.open ?? false,
    onclose: vi.fn(),
    onpick: vi.fn(),
    onclear: vi.fn(),
    onreset: vi.fn(),
    oncopylink: over.oncopylink,
    own: over.own
  };
  const view = render(FilterPanel, props);
  return { ...view, props };
}

describe('the filter column', () => {
  it('presses «Все» on a row with no pick and not on a row with one', async () => {
    const { container } = panel({ tier: ['2'] }, 'wide');
    const tier = within(screen.getByRole('group', { name: 'Ранг' }));
    expect(tier.getByRole('button', { name: 'Все' })).toHaveAttribute('aria-pressed', 'false');
    expect(tier.getByRole('button', { name: '2' })).toHaveAttribute('aria-pressed', 'true');
    const src = within(screen.getByRole('group', { name: 'Источник' }));
    expect(src.getByRole('button', { name: 'Все' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Фильтры · 1' })).toBeInTheDocument();
    expect(screen.queryByText('любое')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('clears a row on «Все» and picks a value on its chip', async () => {
    const { props } = panel({ tier: ['2'] }, 'wide');
    const tier = within(screen.getByRole('group', { name: 'Ранг' }));
    await userEvent.click(tier.getByRole('button', { name: 'Все' }));
    expect(props.onclear).toHaveBeenCalledWith('tier');
    await userEvent.click(tier.getByRole('button', { name: '3' }));
    expect(props.onpick).toHaveBeenCalledWith('tier', '3');
  });

  it('draws the link only with a copy action and a pick', () => {
    panel({ tier: ['2'] }, 'wide');
    expect(screen.queryByRole('button', { name: 'Ссылка на фильтры' })).toBeNull();
    cleanup();
    panel({}, 'wide', { oncopylink: vi.fn() });
    expect(screen.queryByRole('button', { name: 'Ссылка на фильтры' })).toBeNull();
    cleanup();
    panel({ tier: ['2'] }, 'wide', { oncopylink: vi.fn() });
    expect(screen.getByRole('button', { name: 'Ссылка на фильтры' })).toBeInTheDocument();
  });

  it('folds a row of fourteen values and opens it with one button', async () => {
    panel({}, 'wide');
    const src = within(screen.getByRole('group', { name: 'Источник' }));
    const before = src.getAllByRole('button').length;
    await userEvent.click(src.getByRole('button', { name: /и ещё/ }));
    expect(src.getAllByRole('button').length).toBeGreaterThan(before);
  });

  it('moves the focus to the first «Все» after «Сбросить»', async () => {
    const { props } = panel({ tier: ['2'] }, 'wide');
    await userEvent.click(screen.getByRole('button', { name: 'Сбросить' }));
    expect(props.onreset).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(
        within(screen.getByRole('group', { name: 'Ранг' })).getByRole('button', { name: 'Все' })
      ).toHaveFocus();
    });
  });
});

describe('the filter sheet', () => {
  it.each(['narrow', 'mid'] as const)('draws nothing while closed at %s', (band) => {
    panel({}, band);
    expect(screen.queryByRole('group', { name: 'Ранг' })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens as a sheet with the own switch first, the foot reset and «Показать N»', async () => {
    const onchange = vi.fn();
    panel({ tier: ['2'] }, 'narrow', { open: true, own: { on: true, onchange } });
    const sheet = within(screen.getByRole('dialog', { name: 'Фильтры' }));
    expect(sheet.getByRole('heading', { name: 'Фильтры · 1' })).toBeInTheDocument();
    const first = document.querySelector('.sheet-body .frow');
    expect(first).toHaveClass('own');
    expect(sheet.getByRole('button', { name: 'Показать 4' })).toBeInTheDocument();
    await expectNoA11yViolations(document.body);
    await userEvent.click(sheet.getByRole('button', { name: 'Сбросить' }));
    await waitFor(() => {
      expect(sheet.getByRole('button', { name: 'Закрыть' })).toHaveFocus();
    });
  });

  it('closes on «Показать N»', async () => {
    const { props } = panel({}, 'mid', { open: true });
    await userEvent.click(screen.getByRole('button', { name: 'Показать 4' }));
    expect(props.onclose).toHaveBeenCalledOnce();
  });
});
