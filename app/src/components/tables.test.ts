/* The plain table: chip nav, the toolbar, rows and tiles, selection, and a row
 * opening the record modal.
 *
 * Held against a small fixture rather than the real catalogue: what matters
 * here is the shape (search narrows, the empty state has no button of its
 * own, a hash change drops the selection) rather than any particular record. */

import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
    wondrous: [
      row({ id: 'w1', src: 'wondrous', roll: 1, ru: 'Плащ Ветра' }),
      row({ id: 'w2', src: 'wondrous', kind: 'consumable', roll: 2, ru: 'Зелье Ветра' })
    ],
    dread: [
      row({ id: 'd1', src: 'dread', roll: 1, ru: 'Клык Ужаса' }),
      row({ id: 'd2', src: 'dread', kind: 'consumable', roll: 2, ru: 'Яд Ужаса' })
    ],
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
    ],
    voa: [
      row({ id: 'v1', src: 'voa', tier: 1, ru: 'Реликвия Первого Ранга' }),
      row({ id: 'v2', src: 'voa', tier: 'A', ru: 'Артефакт Утра' })
    ],
    frames: [
      row({
        id: 'f1',
        src: 'frame',
        frame: 'beast_feast',
        kind: 'consumable',
        ru: 'Пирог Зверя'
      }),
      row({
        id: 'f2',
        src: 'frame',
        frame: 'motherboard',
        kind: 'consumable',
        ru: 'Чип Памяти'
      })
    ],
    community: [
      row({
        id: 'com1',
        src: 'community',
        community: 'Loreborne',
        community_ru: 'Научное',
        ru: 'Свиток Знания'
      }),
      row({
        id: 'com2',
        src: 'community',
        community: 'Highborne',
        community_ru: 'Великородное',
        ru: 'Перстень Рода'
      })
    ]
  },
  eq: [],
  refs: {},
  /* `ci3` (roll 3 in core_item) and `ci2` (roll 2) are reused as alternate-
     table entries, so a test can tell the die-face number apart from the
     record's own roll in the table it also belongs to. */
  alt: {
    item: { common: { hope: ['ci3'], fear: ['ci2'] } },
    consumable: { common: { hope: ['cc1'], fear: [] } }
  }
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

describe('the filter', () => {
  const wond = (): Env =>
    fakeEnv({ router: memoryRouter('#/tables/wondrous'), data: fakeData(LOOT) });

  it('draws the strip folded, with nothing picked and the plain total', () => {
    const { container } = render(App, { env: wond() });
    expect(screen.getByRole('button', { name: 'Фильтры' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(container.querySelector('.fcount')).toHaveTextContent('2');
    expect(screen.queryByRole('button', { name: 'Предметы' })).not.toBeInTheDocument();
  });

  it('unfolds on the toggle, and folds again on a second press', async () => {
    render(App, { env: wond() });
    const toggle = screen.getByRole('button', { name: 'Фильтры' });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Предметы' })).toBeInTheDocument();
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('narrows the table on a chip, names the pick and the shown/of count', async () => {
    render(App, { env: wond() });
    await userEvent.click(screen.getByRole('button', { name: 'Фильтры' }));
    await userEvent.click(screen.getByRole('button', { name: 'Предметы' }));
    expect(screen.getByText('Плащ Ветра')).toBeInTheDocument();
    expect(screen.queryByText('Зелье Ветра')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Фильтры (1)' })).toBeInTheDocument();
    expect(screen.getByText('1 из 2')).toBeInTheDocument();
  });

  it('drops the same value from its pill', async () => {
    const { container } = render(App, { env: wond() });
    await userEvent.click(screen.getByRole('button', { name: 'Фильтры' }));
    await userEvent.click(screen.getByRole('button', { name: 'Предметы' }));
    const pill = container.querySelector('.fpill');
    expect(pill).toHaveAttribute('title', 'Убрать из фильтра');
    await userEvent.click(pill as HTMLElement);
    expect(screen.getByText('Зелье Ветра')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Фильтры' })).toBeInTheDocument();
  });

  it('resets from the strip once something is picked', async () => {
    render(App, { env: wond() });
    await userEvent.click(screen.getByRole('button', { name: 'Фильтры' }));
    await userEvent.click(screen.getByRole('button', { name: 'Предметы' }));
    await userEvent.click(screen.getByRole('button', { name: 'Сбросить всё' }));
    expect(screen.getByText('Зелье Ветра')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Сбросить всё' })).not.toBeInTheDocument();
  });

  it('grows its own reset button in the empty state', async () => {
    render(App, { env: wond() });
    await userEvent.click(screen.getByRole('button', { name: 'Фильтры' }));
    await userEvent.click(screen.getByRole('button', { name: 'Предметы' }));
    await userEvent.type(
      screen.getByPlaceholderText('Поиск по названию или описанию…'),
      'нет такого'
    );
    const empty = screen.getByText('Ничего не найдено').closest('.empty');
    expect(
      within(empty as HTMLElement).getByRole('button', { name: 'Сбросить всё' })
    ).toBeInTheDocument();
  });

  it('arriving at a filter link opens the panel with that value picked', () => {
    render(App, {
      env: fakeEnv({
        router: memoryRouter('#/tables/wondrous/f_kind-item'),
        data: fakeData(LOOT)
      })
    });
    expect(screen.getByRole('button', { name: 'Фильтры (1)' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Предметы' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('changing table clears the filter and folds the panel', async () => {
    const env = fakeEnv({
      router: memoryRouter('#/tables/wondrous/f_kind-item'),
      data: fakeData(LOOT)
    });
    render(App, { env });
    env.router.navigate('#/tables/dread');
    await tick();
    expect(screen.getByRole('button', { name: 'Фильтры' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('keeps the selection on a filter pick, and drops it on a navigation', async () => {
    const env = wond();
    render(App, { env });
    const box = screen.getAllByRole('checkbox', { name: 'Выбрано' })[0] as HTMLElement;
    await userEvent.click(box);
    expect(box).toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: 'Фильтры' }));
    await userEvent.click(screen.getByRole('button', { name: 'Предметы' }));
    expect(screen.getAllByRole('checkbox', { name: 'Выбрано' })[0]).toBeChecked();

    env.router.navigate('#/tables/wondrous');
    await tick();
    expect(screen.getAllByRole('checkbox', { name: 'Выбрано' })[0]).not.toBeChecked();
  });

  it('closes the modal on a navigation, but a filter pick leaves it alone', async () => {
    const env = wond();
    render(App, { env });
    await userEvent.click(screen.getByRole('button', { name: /Плащ Ветра/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Фильтры' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    env.router.navigate('#/tables/wondrous');
    await tick();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('copies the filter link, with the picked value in the address', async () => {
    const clip = fakeClipboard();
    render(App, {
      env: fakeEnv({
        router: memoryRouter('#/tables/wondrous'),
        data: fakeData(LOOT),
        clipboard: clip
      })
    });
    await userEvent.click(screen.getByRole('button', { name: 'Фильтры' }));
    await userEvent.click(screen.getByRole('button', { name: 'Предметы' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ссылка на фильтры' }));
    expect(clip.last.text).toBe('https://example.test/#/tables/wondrous/f_kind-item');
    expect(screen.getByText('Ссылка на фильтры скопирована')).toBeInTheDocument();
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

describe('a sectioned body: Vault of Ages by tier', () => {
  it('groups rows into their tier, in book order, dropping tiers with no rows', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/voa'), data: fakeData(LOOT) })
    });
    expect(screen.getByText('Ранг 1')).toBeInTheDocument();
    expect(screen.getByText('Артефакты')).toBeInTheDocument();
    /* Nothing at all in tier 2, 3, 4 or the cursed-objects division. */
    expect(screen.queryByText('Ранг 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Проклятые предметы')).not.toBeInTheDocument();
  });

  it('copies a direct link to one section, off its own link button', async () => {
    const clip = fakeClipboard();
    render(App, {
      env: fakeEnv({
        router: memoryRouter('#/tables/voa'),
        data: fakeData(LOOT),
        clipboard: clip
      })
    });
    const [, artifactSection] = screen.getAllByRole('button', {
      name: 'Скопировать ссылку на этот раздел'
    });
    await userEvent.click(artifactSection as HTMLElement);
    expect(clip.last.text).toBe('https://example.test/#/tables/voa/tA');
    expect(screen.getByText('Ссылка на раздел скопирована')).toBeInTheDocument();
  });

  it('gives each section its own select-all, scoped to its own rows only', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/voa'), data: fakeData(LOOT) })
    });
    const boxes = screen.getAllByText(/Выбрать все/);
    expect(boxes).toHaveLength(2);
    expect(boxes[0]).toHaveTextContent('Выбрать все (1)');
  });
});

describe('a sectioned body: campaign frames', () => {
  it('lists every campaign that has a row, including one with a single row', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/frames'), data: fakeData(LOOT) })
    });
    /* The row's own source badge carries the same name (label.test.ts's own
       fix), so a section heading is not the only place the text appears. */
    expect(document.querySelectorAll('.tsec-head .lbl')).toHaveLength(2);
    expect(screen.getAllByText('Пир зверей').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Материнская Плата').length).toBeGreaterThan(0);
    /* No row belongs to it in this fixture, so it draws no section at all. */
    expect(screen.queryByText('Колоссы Сухоземья')).not.toBeInTheDocument();
  });
});

describe('a sectioned body: communities', () => {
  it("names each section with the community's own name, in the language on screen", () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/community'), data: fakeData(LOOT) })
    });
    /* The row's own source badge carries the same name, so a section heading
       is not the only place the text appears - each community still gets one. */
    expect(document.querySelectorAll('.tsec-head .lbl')).toHaveLength(2);
    expect(screen.getAllByText('Научное').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Великородное').length).toBeGreaterThan(0);
  });
});

describe('the alternate tables', () => {
  it('numbers each row by the die face that found it, not by its own table roll', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/alt_item'), data: fakeData(LOOT) })
    });
    /* ci3's own roll in core_item is 3; as the first hope entry here it reads 1. */
    const hopeRow = document.querySelector('[data-row="ci3"]');
    expect(hopeRow).not.toBeNull();
    expect(within(hopeRow as HTMLElement).getByText('1')).toBeInTheDocument();
  });

  it('splits hope and fear into their own subheadings, per rarity', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/alt_item'), data: fakeData(LOOT) })
    });
    expect(screen.getByText('Надежда')).toBeInTheDocument();
    expect(screen.getByText('Страх')).toBeInTheDocument();
  });

  it('draws no select-all bar - the live app never wraps these rows in one', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/alt_item'), data: fakeData(LOOT) })
    });
    expect(screen.queryByText(/Выбрать все/)).not.toBeInTheDocument();
  });

  it("reads the source badge as the frame's own name, not its raw id", () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/frames'), data: fakeData(LOOT) })
    });
    const row = screen.getByRole('button', { name: /Пирог Зверя/ });
    expect(within(row).getByText('Пир зверей')).toBeInTheDocument();
  });
});

describe('the row and section anchor', () => {
  it('scrolls to and flashes the row a link named', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/core_item/ci2'), data: fakeData(LOOT) })
    });
    const target = document.querySelector('[data-row="ci2"]');
    await waitFor(() => {
      expect(target).toHaveClass('flash');
    });
    expect(scroll).toHaveBeenCalled();
  });

  it('scrolls to and flashes the section a link named', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/voa/tA'), data: fakeData(LOOT) })
    });
    await waitFor(() => {
      expect(document.getElementById('sec-tA')).toHaveClass('flash');
    });
  });

  it('does nothing when the address names neither a row nor a section', () => {
    Element.prototype.scrollIntoView = vi.fn();
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/core_item/nope'), data: fakeData(LOOT) })
    });
    expect(document.querySelector('.flash')).not.toBeInTheDocument();
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

  it('has no axe violations on a sectioned body', async () => {
    const { container } = render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/voa'), data: fakeData(LOOT) })
    });
    await expectNoA11yViolations(container);
  });
});
