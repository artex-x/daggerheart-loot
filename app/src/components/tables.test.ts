/* The plain table: chip nav, the toolbar, rows and tiles, selection, and a row
 * opening the record modal.
 *
 * Held against a small fixture rather than the real catalogue: what matters
 * here is the shape (search narrows, the empty state has no button of its
 * own, a hash change drops the selection) rather than any particular record. */

import { cleanup, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App.svelte';
import TablesPage from './TablesPage.svelte';
import { fakeClipboard, fakeData, fakeEnv, memoryRouter, noData } from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import type { Loot } from '../lib/data.js';
import type { Record_ } from '../lib/types.js';

afterEach(cleanup);

const row = (over: Partial<Record_>): Record_ => ({
  id: 'x',
  src: 'core',
  kind: 'item',
  en: 'Thing',
  ende: 'Does a thing.',
  ru: 'Вещь',
  rud: 'Делает что-то.',
  ...over
});

const LOOT: Loot = {
  items: {
    core_item: [
      row({ id: 'ci1', roll: 1, ru: 'Кольцо Тишины', rud: '- Тихо. \n- Очень тихо.' }),
      row({ id: 'ci2', roll: 2, ru: 'Плащ Теней', craft: 'ci3' }),
      row({ id: 'ci3', roll: 3, ru: 'Плащ Бездны' }),
      /* No roll: it is equipment, so it carries a stat line instead - and its
         description is two parts, a labelled line then a labelled list item,
         to reach both shapes `descParts` produces. */
      row({
        id: 'ci4',
        ru: 'Клинок Эха',
        rud: 'Свойство: Острое.\n- Хват: Одноручное',
        eq: {
          t: 'weapon',
          tier: 1,
          cls: 'phy',
          tr: 'strength',
          rg: 'melee',
          dmg: 'd8',
          dt: 'phy'
        }
      }),
      /* No roll, no stat block: only a tier of its own, the way a Vault of
         Ages artifact would carry one on a table this slice does not draw. */
      row({ id: 'ci5', ru: 'Осколок Легенды', tier: 'A' }),
      /* Nothing at all to badge a tile with, and no description either. */
      row({ id: 'ci6', kind: 'consumable', ru: 'Пыль', ende: '', rud: '' })
    ],
    core_consumable: [row({ id: 'cc1', kind: 'consumable', roll: 1, ru: 'Зелье' })],
    hnf_item: [row({ id: 'hi1', src: 'hnf', roll: 1, ru: 'Предмет H&F' })],
    hnf_consumable: [
      row({ id: 'hc1', src: 'hnf', kind: 'consumable', roll: 1, ru: 'Расходник H&F' })
    ]
  },
  eq: [],
  refs: {},
  alt: {}
};

const at = (over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter('#/tables'), data: fakeData(LOOT), ...over });

const rows = (): HTMLElement[] =>
  screen.getAllByRole('button', { name: /Кольцо|Плащ|Клинок|Осколок|Пыль/ });

describe('the index', () => {
  it('opens on core_item, with the book chip on and its two sub-chips shown', () => {
    render(App, { env: at() });
    expect(screen.getByRole('link', { name: 'Core' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Предметы' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: 'Расходники' })).toBeInTheDocument();
  });

  it('lists every row of the table, each carrying its roll number', () => {
    render(App, { env: at() });
    expect(rows()).toHaveLength(6);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows an upgrade chain inline, without a clamp of its own', () => {
    render(App, { env: at() });
    expect(screen.getByText(/Улучшается до: Плащ Бездны/)).toBeInTheDocument();
  });

  it('shows what it was made from, on the record the upgrade points at', () => {
    render(App, { env: at() });
    expect(screen.getByText(/Получается из: Плащ Теней/)).toBeInTheDocument();
  });

  it('draws a stat line instead of a roll number for equipment', () => {
    render(App, { env: at() });
    expect(screen.getByText(/Вплотную/)).toBeInTheDocument();
    expect(
      screen.queryByText('Клинок Эха')?.closest('.row')?.querySelector('.rnum')
    ).toBeNull();
  });

  it('splits a labelled line and a labelled list item into a name and a body', () => {
    render(App, { env: at() });
    expect(screen.getByText('Свойство:')).toBeInTheDocument();
    expect(screen.getByText('Хват:')).toBeInTheDocument();
  });
});

describe('a second table', () => {
  it('moves the chosen chip and the sub-row, off the address alone', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/hnf_consumable'), data: fakeData(LOOT) })
    });
    expect(screen.getByRole('link', { name: 'Hope & Fear' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByText('Расходник H&F')).toBeInTheDocument();
  });
});

describe('search', () => {
  it('narrows the table to what matches', async () => {
    render(App, { env: at() });
    await userEvent.type(
      screen.getByPlaceholderText('Поиск по названию или описанию…'),
      'тишины'
    );
    expect(rows()).toHaveLength(1);
    expect(screen.getByText('Кольцо Тишины')).toBeInTheDocument();
  });

  it('shows the empty state with no reset button of its own', async () => {
    render(App, { env: at() });
    await userEvent.type(
      screen.getByPlaceholderText('Поиск по названию или описанию…'),
      'нет такого'
    );
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Сбросить всё' })).not.toBeInTheDocument();
  });
});

describe('the view switch', () => {
  it('draws tiles instead of rows, and keeps the same names', async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Сеткой' }));
    expect(screen.getByText('Кольцо Тишины')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Списком' })).toBeInTheDocument();
  });

  it("carries a tile's own tier where there is no roll and no stat block", async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Сеткой' }));
    const tile = screen.getByText('Осколок Легенды').closest('.tilewrap');
    expect(tile?.querySelector('.tile-n')).toHaveTextContent('A');
  });

  it("carries equipment's own tier where there is no roll but there is a stat block", async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Сеткой' }));
    const tile = screen.getByText('Клинок Эха').closest('.tilewrap');
    expect(tile?.querySelector('.tile-n')).toHaveTextContent('Ранг 1');
    expect(tile?.querySelector('.tile-k')).toHaveClass('eq-weapon');
  });

  it('leaves the tile bare when there is neither a roll nor a tier of any kind', async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Сеткой' }));
    const tile = screen.getByText('Пыль').closest('.tilewrap');
    expect(tile?.querySelector('.tile-n')).toBeNull();
    expect(tile?.querySelector('.tile-k')).toHaveClass('cons');
  });
});

describe('selection', () => {
  it('ticks a row, and select-all ticks every row shown', async () => {
    render(App, { env: at() });
    const boxes = screen.getAllByRole('checkbox', { name: 'Выбрано' });
    await userEvent.click(boxes[0] as HTMLElement);
    expect(boxes[0]).toBeChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: /Выбрать все/ }));
    for (const b of boxes) expect(b).toBeChecked();
  });

  it('unticks a row that was already ticked', async () => {
    render(App, { env: at() });
    const box = screen.getAllByRole('checkbox', { name: 'Выбрано' })[0] as HTMLElement;
    await userEvent.click(box);
    expect(box).toBeChecked();
    await userEvent.click(box);
    expect(box).not.toBeChecked();
  });

  it('select-all drops every tick when everything is already selected', async () => {
    render(App, { env: at() });
    const all = screen.getByRole('checkbox', { name: /Выбрать все/ });
    await userEvent.click(all);
    const boxes = screen.getAllByRole('checkbox', { name: 'Выбрано' });
    for (const b of boxes) expect(b).toBeChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: /Выбрать все/ }));
    for (const b of boxes) expect(b).not.toBeChecked();
  });

  it('belongs to the table it was made on: a hash change drops it', async () => {
    const env = at();
    render(App, { env });
    const box = screen.getAllByRole('checkbox', { name: 'Выбрано' })[0] as HTMLElement;
    await userEvent.click(box);
    expect(box).toBeChecked();
    env.router.navigate('#/tables/hnf_item');
    await tick();
    env.router.navigate('#/tables');
    await tick();
    const again = screen.getAllByRole('checkbox', { name: 'Выбрано' })[0] as HTMLElement;
    expect(again).not.toBeChecked();
  });
});

describe('a row opened', () => {
  it('opens the record over the table, in the same modal every route uses', async () => {
    render(App, { env: at() });
    await userEvent.click(rows()[0] as HTMLElement);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByText('Кольцо Тишины')).toBeInTheDocument();
  });
});

describe('the table link', () => {
  it('copies an address that opens on this table', async () => {
    const clip = fakeClipboard();
    render(App, { env: at({ clipboard: clip }) });
    await userEvent.click(screen.getByRole('button', { name: 'Ссылка на таблицу' }));
    expect(clip.last.text).toBe('https://example.test/#/tables/core_item');
    expect(screen.getByText('Ссылка на таблицу скопирована')).toBeInTheDocument();
  });

  it('says so when the clipboard refuses', async () => {
    render(App, { env: at({ clipboard: fakeClipboard({ fail: true }) }) });
    await userEvent.click(screen.getByRole('button', { name: 'Ссылка на таблицу' }));
    expect(screen.getByText('Не удалось скопировать')).toBeInTheDocument();
  });
});

describe('a table this slice has not built', () => {
  it('still resolves through the nav, as a placeholder', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/eq_weapon'), data: fakeData(LOOT) })
    });
    expect(screen.getByRole('link', { name: 'Снаряжение' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByText('#/tables/eq_weapon')).toBeInTheDocument();
  });

  it('draws only the top row of chips for a book with one table', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/wondrous'), data: fakeData(LOOT) })
    });
    expect(screen.getByRole('link', { name: 'Wondrous Loot' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    /* Nothing under it: a single-table book has no second row of chips. */
    expect(screen.queryByRole('link', { name: 'Предметы' })).not.toBeInTheDocument();
  });
});

describe('a dataset that did not load', () => {
  it('says so rather than drawing an empty table', () => {
    render(App, { env: fakeEnv({ router: memoryRouter('#/tables'), data: noData() }) });
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
  });
});

describe('the help', () => {
  it('explains the two things that stand apart from the books', async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Как это работает' }));
    expect(screen.getByText(/срезы через все книги сразу/)).toBeInTheDocument();
  });
});

describe('mounted off its own route', () => {
  it('keeps the last table it knew about - defensive, since App.svelte never does this', () => {
    /* TablesPage is only ever mounted while the route is 'tables' - App.svelte
       picks the branch. Rendering it directly against a different route is
       the only way to reach that guard at all, and it is worth reaching: a
       future caller that gets this wrong should fall back rather than throw. */
    const app = new AppState(
      fakeEnv({ router: memoryRouter('#/roll/std'), data: fakeData(LOOT) })
    );
    render(TablesPage, { app });
    expect(screen.getByRole('link', { name: 'Core' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('accessibility', () => {
  it('has no axe violations on the page', async () => {
    const { container } = render(App, { env: at() });
    await expectNoA11yViolations(container);
  });
});
