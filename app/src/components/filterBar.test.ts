/* The filter strip's own parts: the fold of a long row (more than 12 values draw 10, every
   picked one, and «и ещё N» / «свернуть») and the focus after a control removes itself
   (rule 20, the strip leaving). docs/specs/FEATURES.md, "Tables and search" and
   "Consistency rules". */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FilterBar from './FilterBar.svelte';
import { dict } from '../lib/dict.js';
import type { FacetRow } from '../lib/facets.js';
import type { FilterState } from '../lib/filters.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const t = dict('ru');

const sectRow = (n: number): FacetRow => ({
  group: 'sect',
  label: t.hbSection,
  values: Array.from({ length: n }, (_, i) => ({
    value: `s${String(i + 1)}`,
    label: `Раздел ${String(i + 1).padStart(2, '0')}`
  }))
});

function strip(rows: FacetRow[], picked: FilterState = {}) {
  return render(FilterBar, {
    rows,
    picked,
    shown: 1,
    total: 2,
    open: true,
    t,
    ontoggle: vi.fn(),
    onpick: vi.fn(),
    onreset: vi.fn()
  });
}

const chipNames = (): string[] =>
  within(document.querySelector<HTMLElement>('.ffilter') as HTMLElement)
    .getAllByRole('button')
    .map((b) => b.textContent.trim());

describe('the fold of a long row', () => {
  it('draws a row of 12 values whole, with no fold', () => {
    strip([sectRow(12)]);
    expect(chipNames()).toHaveLength(12);
    expect(screen.queryByRole('button', { name: /^и ещё/ })).toBeNull();
  });

  it('folds a row of 13 values after 10 with «и ещё 3», and opens to «свернуть»', async () => {
    const { container } = strip([sectRow(13)]);
    const fold = screen.getByRole('button', { name: 'и ещё 3' });
    expect(fold).toHaveAttribute('aria-expanded', 'false');
    expect(chipNames().slice(0, -1)).toHaveLength(10);
    await expectNoA11yViolations(container);
    await userEvent.click(fold);
    expect(fold).toHaveAccessibleName(t.relLess);
    expect(fold).toHaveAttribute('aria-expanded', 'true');
    expect(fold).toHaveFocus();
    expect(chipNames().slice(0, -1)).toHaveLength(13);
    await expectNoA11yViolations(container);
    await userEvent.click(fold);
    expect(fold).toHaveAccessibleName('и ещё 3');
  });

  it('draws 10 of 22 values and «и ещё 12», then all and «свернуть»', async () => {
    strip([sectRow(22)]);
    await userEvent.click(screen.getByRole('button', { name: 'и ещё 12' }));
    expect(chipNames().slice(0, -1)).toHaveLength(22);
  });

  it('draws 10 of 300 values and «и ещё 290»', () => {
    strip([sectRow(300)]);
    expect(screen.getByRole('button', { name: 'и ещё 290' })).toBeInTheDocument();
    expect(chipNames()).toHaveLength(11);
  });

  it('draws a picked value past the tenth while folded, pressed, before the fold', () => {
    strip([sectRow(22)], { sect: ['s15'] });
    const names = chipNames();
    expect(names.slice(0, 10)).toEqual(sectRow(10).values.map((v) => v.label));
    expect(names[10]).toBe('Раздел 15');
    const panel = within(document.querySelector<HTMLElement>('.ffilter') as HTMLElement);
    expect(panel.getByRole('button', { name: 'Раздел 15' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(names[11]).toBe('и ещё 11');
  });

  it('folds each long row on its own', async () => {
    strip([sectRow(13), { ...sectRow(14), group: 'src', label: t.source }]);
    await userEvent.click(screen.getByRole('button', { name: 'и ещё 3' }));
    expect(screen.getByRole('button', { name: 'и ещё 4' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });
});

describe('the focus after a pill or «Сбросить всё» removes itself', () => {
  it('goes to `#main` when the strip itself left', async () => {
    const main = document.createElement('main');
    main.id = 'main';
    main.tabIndex = -1;
    document.body.append(main);
    try {
      const view = strip([sectRow(3)], { sect: ['s1'] });
      const onpick = vi.fn(() => {
        void view.rerender({ rows: [] });
      });
      await view.rerender({ onpick });
      await userEvent.click(screen.getByTitle(t.dropValue));
      expect(onpick).toHaveBeenCalledWith('sect', 's1');
      await waitFor(() => {
        expect(document.activeElement).toBe(main);
      });
    } finally {
      main.remove();
    }
  });

  it('goes to «Фильтры» after «Сбросить всё»', async () => {
    const view = strip([sectRow(3)], { sect: ['s1', 's2'] });
    const onreset = vi.fn(() => {
      void view.rerender({ picked: {} });
    });
    await view.rerender({ onreset });
    await userEvent.click(screen.getByRole('button', { name: t.resetAll }));
    expect(onreset).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: t.filters })).toHaveFocus();
    });
  });
});
