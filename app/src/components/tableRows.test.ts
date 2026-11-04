/* TableRows.svelte on its own: a long table draws its first rows in the first task and
   the rest in later ones; an anchored table draws them all at once. */
import { cleanup, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import TableRows from './TableRows.svelte';
import { buildIndex } from '../lib/data.js';
import { readLoot } from '../test/loot.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);
/* The first budget refills after the task that took it: a test starts in a fresh one. */
beforeEach(async () => {
  await new Promise((r) => setTimeout(r, 0));
});

const index = buildIndex(readLoot());
const weapons = index.searchable.slice(0, 150).map((it) => ({ it }));

function rows(over: { whole?: boolean; entries?: typeof weapons } = {}) {
  return render(TableRows, {
    entries: over.entries ?? weapons,
    view: 'list',
    index,
    lang: 'ru',
    selected: () => false,
    artBroken: () => false,
    ontoggle: () => undefined,
    onartfail: () => undefined,
    onopen: () => undefined,
    ticks: false,
    ...(over.whole ? { whole: true } : {})
  });
}

const drawnRows = (c: HTMLElement): number => c.querySelectorAll('.row').length;

describe('a long table', () => {
  it('draws its first 60 rows in the first task and the rest after it', async () => {
    expect(weapons.length).toBe(150);
    const { container } = rows();
    expect(drawnRows(container)).toBe(60);
    expect(container.querySelector('[data-drawing]')).not.toBeNull();
    await waitFor(() => {
      expect(drawnRows(container)).toBe(weapons.length);
    });
    expect(container.querySelector('[data-drawing]')).toBeNull();
  });

  it('shares the first budget between the tables that mount in one task', async () => {
    const first = rows({ entries: weapons.slice(0, 40) });
    const second = rows({ entries: weapons.slice(40, 120) });
    expect(drawnRows(first.container)).toBe(40);
    expect(drawnRows(second.container)).toBe(20);
    await waitFor(() => {
      expect(drawnRows(second.container)).toBe(80);
    });
    await expectNoA11yViolations(second.container);
  });

  it('draws every row at once for an anchor', () => {
    const { container } = rows({ whole: true });
    expect(drawnRows(container)).toBe(weapons.length);
    expect(container.querySelector('[data-drawing]')).toBeNull();
  });

  it('draws rows that arrive after the first draw at once', async () => {
    const view = rows({ entries: weapons.slice(0, 5) });
    expect(drawnRows(view.container)).toBe(5);
    await new Promise((r) => setTimeout(r, 0));
    await view.rerender({ entries: weapons });
    expect(drawnRows(view.container)).toBe(weapons.length);
  });
});
