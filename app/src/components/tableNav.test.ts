/* TableNav.svelte on its own: from 761 px the group chips (the page head's pills) and the
   tabs (under the head) as two parts, the picker and its sheet below it, the source tabs
   of the own items table and their fold. */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import TableNav from './TableNav.svelte';
import type { SourceChip } from '../lib/homebrew.js';
import type { TableId } from '../lib/types.js';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import { fakeEnv, fakeViewport, type Band } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(() => {
  cleanup();
  for (const main of document.querySelectorAll('body > main')) main.remove();
});

function nav(
  table: TableId,
  band: Band,
  sources: SourceChip[] = [],
  source: string | null = null
) {
  const app = new AppState(fakeEnv({ viewport: fakeViewport(band) }));
  /* In the page the tabs sit in `main`, as axe's region rule needs. */
  const main = document.body.appendChild(document.createElement('main'));
  render(TableNav, { target: main, props: { app, table, sources, source, filter: {} } });
  if (band !== 'narrow')
    render(TableNav, {
      target: main,
      props: { app, table, sources, source, filter: {}, part: 'tabs' }
    });
  return { container: document.body };
}

describe('the table navigation', () => {
  it.each(['wide', 'mid'] as const)(
    'draws the group chips and the tabs at %s',
    async (band) => {
      const { container } = nav('eq_weapon', band);
      /* One landmark: the chips; the tabs follow it, a group named by the chips' group. */
      const landmark = screen.getByRole('navigation', { name: 'Таблицы' });
      const groups = within(within(landmark).getByRole('group', { name: 'Группа' }));
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
      expect(landmark.contains(screen.getByRole('group', { name: 'Снаряжение' }))).toBe(false);
      expect(
        landmark.compareDocumentPosition(screen.getByRole('group', { name: 'Снаряжение' }))
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
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

describe('the tab slot', () => {
  it.each(['wide', 'mid'] as const)(
    "holds every group's tabs unseen at %s, with no link and no name, also on a table with none",
    async (band) => {
      const { container } = nav('homebrew', band);
      expect(screen.queryByRole('group', { name: 'Хоумбрю' })).toBeNull();
      const ghosts = container.querySelector('.tabslot .ghosts');
      expect(ghosts).toHaveAttribute('aria-hidden', 'true');
      expect(ghosts?.querySelector('a, button')).toBeNull();
      expect(ghosts?.querySelectorAll('.tabs').length).toBeGreaterThanOrEqual(5);
      expect(ghosts).toHaveTextContent('Wondrous Environments');
      await expectNoA11yViolations(container);
    }
  );

  it('takes the same ghost tabs with twelve long sources as with none, so the other groups keep their head', async () => {
    const ghostsOf = (container: HTMLElement): string | null | undefined =>
      container.querySelector('.tabslot .ghosts')?.textContent;
    const sources = Array.from({ length: 12 }, (_, i) => ({
      key: `b${String(i)}`,
      label: String(i).padStart(2, '0') + 'И'.repeat(78)
    }));
    const cloud = fakeCloud(SEED, 'gm1');
    const app = new AppState(fakeEnv({ cloud, viewport: fakeViewport('wide') }));
    const stop = app.start();
    await waitFor(() => {
      expect(app.user).toBeTruthy();
    });
    render(TableNav, { app, table: 'eq_weapon', sources: [], source: null, filter: {} });
    expect(
      within(screen.getByRole('group', { name: 'Группа' })).getByRole('link', {
        name: 'Хоумбрю'
      })
    ).toBeInTheDocument();
    cleanup();
    const without = render(TableNav, {
      app,
      table: 'eq_weapon',
      sources: [],
      source: null,
      filter: {},
      part: 'tabs'
    });
    const base = ghostsOf(without.container);
    cleanup();
    const crowded = render(TableNav, {
      app,
      table: 'eq_weapon',
      sources,
      source: null,
      filter: {},
      part: 'tabs'
    });
    expect(ghostsOf(crowded.container)).toBe(base);
    expect(ghostsOf(crowded.container)).not.toContain('ИИИ');
    stop();
  });

  it('draws no slot at narrow, where the tabs live in the sheet', () => {
    const { container } = nav('core_item', 'narrow');
    expect(container.querySelector('.tabslot')).toBeNull();
  });
});
