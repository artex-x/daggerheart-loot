/* TableNav.svelte on its own: the group chips and the tabs from 761 px, the picker and
   its sheet below it, the source tabs of the own items table and their fold. */
import { cleanup, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import TableNav from './TableNav.svelte';
import type { SourceChip } from '../lib/homebrew.js';
import type { TableId } from '../lib/types.js';
import { fakeEnv, fakeViewport, type Band } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

function nav(
  table: TableId,
  band: Band,
  sources: SourceChip[] = [],
  source: string | null = null
) {
  const app = new AppState(fakeEnv({ viewport: fakeViewport(band) }));
  return render(TableNav, { app, table, sources, source, filter: {} });
}

describe('the table navigation', () => {
  it.each(['wide', 'mid'] as const)(
    'draws the group chips and the tabs at %s',
    async (band) => {
      const { container } = nav('eq_weapon', band);
      const groups = within(screen.getByRole('group', { name: 'Группа' }));
      expect(groups.getByRole('link', { name: 'Снаряжение' })).toHaveAttribute(
        'aria-current',
        'page'
      );
      const tabs = within(screen.getByRole('group', { name: 'Снаряжение' }));
      expect(tabs.getByRole('link', { name: 'Оружие' })).toHaveAttribute(
        'aria-current',
        'page'
      );
      expect(tabs.getByRole('link', { name: 'Броня' })).not.toHaveAttribute('aria-current');
      await expectNoA11yViolations(container);
    }
  );

  it('draws the picker at narrow, named for the table, and its sheet with both levels', async () => {
    nav('core_item', 'narrow');
    const picker = screen.getByRole('button', { name: 'Таблица: Core · Предметы' });
    expect(picker).toHaveAttribute('aria-haspopup', 'dialog');
    expect(screen.queryByRole('group', { name: 'Группа' })).toBeNull();
    await userEvent.click(picker);
    const sheet = within(screen.getByRole('dialog'));
    expect(sheet.getByRole('button', { name: 'Core' })).toHaveAttribute('aria-pressed', 'true');
    expect(sheet.getByRole('link', { name: 'Предметы' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await expectNoA11yViolations(document.body);
    await userEvent.click(sheet.getByRole('link', { name: 'Расходники' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('returns the focus to the picker after a pick closes the sheet', async () => {
    nav('eq_weapon', 'narrow');
    const picker = screen.getByRole('button', { name: 'Таблица: Оружие' });
    await userEvent.click(picker);
    const sheet = within(screen.getByRole('dialog'));
    await userEvent.click(sheet.getByRole('link', { name: 'Броня' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(picker);
    await userEvent.click(picker);
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Core' })
    );
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('link', { name: 'Предметы' })
    );
    expect(document.activeElement).toBe(picker);
    await expectNoA11yViolations(document.body);
  });

  it('names a one-table group by its book in the picker', () => {
    nav('voa', 'narrow');
    expect(screen.getByRole('button', { name: 'Таблица: Vault of Ages' })).toBeInTheDocument();
  });

  it('draws the sources of the own items as tabs, folded past twelve', async () => {
    const sources = Array.from({ length: 14 }, (_, i) => ({
      key: `b${String(i)}`,
      label: i === 0 ? 'И'.repeat(80) : `Источник ${String(i)}`
    }));
    const { container } = nav('homebrew', 'wide', sources, 'b0');
    const tabs = within(screen.getByRole('group', { name: 'Источник' }));
    expect(tabs.getByRole('link', { name: 'И'.repeat(80) })).toHaveAttribute(
      'aria-current',
      'page'
    );
    const before = tabs.getAllByRole('link').length;
    expect(before).toBeLessThan(14);
    await userEvent.click(tabs.getByRole('button', { name: /и ещё/ }));
    expect(tabs.getAllByRole('link')).toHaveLength(14);
    await expectNoA11yViolations(container);
  });
});
