/* The plain table: chip nav, the toolbar, rows and tiles, selection, and a row
 * opening the record modal.
 *
 * Held against a small fixture rather than the real catalog: what matters
 * here is the shape (search narrows, the empty state has no button of its
 * own, a hash change drops the selection) rather than any particular record. */

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { flushSync, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import FilterBar from './FilterBar.svelte';
import RowMain from './RowMain.svelte';
import SelBar from './SelBar.svelte';
import TablesPage from './TablesPage.svelte';
import {
  fakeClipboard,
  fakeData,
  fakeEnv,
  fakeMotion,
  fakeViewport,
  memoryRouter,
  memoryStorage,
  noData
} from '../ports/index.js';
import { fakePage } from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid, type SeedList } from '../ports/fake-cloud-seed.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import { readList } from '../test/accountList.js';
import { DAY, listOf, seedWith, TWO_LISTS } from '../test/seed.js';
import { ART_BASE } from '../lib/art.js';
import { buildIndex, type Loot } from '../lib/data.js';
import { ICONS } from '../lib/icons.js';
import { dict } from '../lib/dict.js';
import type { FacetRow } from '../lib/facets.js';
import { recordOf, withRecords } from '../lib/homebrew.js';
import { tablesHash } from '../lib/hash.js';
import type { Record_, TableId } from '../lib/types.js';
import { readLoot } from '../test/loot.js';

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
      row({ id: 'ci2', roll: 2, ru: 'Плащ Теней', craft: ['ci3'] }),
      row({ id: 'ci3', roll: 3, ru: 'Плащ Бездны' }),
      /* No roll: it is equipment, so it carries a stat line instead - and its
         description is two blocks, a labeled line then a labeled list item,
         to reach both shapes a row draws. */
      row({
        id: 'ci4',
        ru: 'Клинок Эха',
        rud: '*Свойство:* Острое.\n- *Хват:* Одноручное',
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
    ],
    starting: [
      row({ id: 's1', src: 'core', kind: 'item', starting: true, ru: 'Стартовый предмет' })
    ],
    /* One more frame-sourced record, an armor, so the equipment `src` facet
       row has a frame to offer alongside the books - f1 and f2 stay as they
       were for the plain sectioned-body tests above. */
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
      }),
      row({
        id: 'f3',
        src: 'frame',
        frame: 'beast_feast',
        kind: 'item',
        ru: 'Доспех Зверя',
        eq: { t: 'armor', tier: 2, as: 5 }
      })
    ]
  },
  /* Weapons of all four tiers with both burdens and both classes, a
     secondary weapon, and an armor - enough to exercise every facet row the
     equipment tables offer and every one of their four tier sections. */
  eq: [
    row({
      id: 'q1',
      ru: 'Меч Рассвета',
      eq: { t: 'weapon', tier: 1, cls: 'phy', tr: 'agility', rg: 'melee', bu: 1 }
    }),
    row({
      id: 'q2',
      src: 'hnf',
      ru: 'Посох Бури',
      eq: { t: 'weapon', tier: 2, cls: 'mag', tr: 'knowledge', rg: 'far', bu: 2 }
    }),
    row({ id: 'q3', ru: 'Копьё Ранга', eq: { t: 'weapon', tier: 3, cls: 'phy', bu: 1 } }),
    row({ id: 'q4', ru: 'Клинок Легенды', eq: { t: 'weapon', tier: 4, cls: 'mag', bu: 2 } }),
    row({ id: 'q5', ru: 'Кинжал Тени', eq: { t: 'secondary', tier: 1, cls: 'mag' } }),
    row({ id: 'q6', ru: 'Латы Стража', eq: { t: 'armor', tier: 1, as: 3 } })
  ],
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

/** Every row's own tick checkbox, in document order - each one is named
 *  after its own record instead of the generic "Выбрано", so the group is
 *  found by elimination: every checkbox except the selection bar's «Все». */
const rowCheckboxes = (): HTMLElement[] => {
  /* The catalog draws its ticks in the selection mode: «Выбрать» opens it. */
  const mode = screen.queryByRole('button', { name: 'Выбрать' });
  if (mode) {
    mode.click();
    flushSync();
  }
  return screen.getAllByRole('checkbox').filter((cb) => !cb.closest('.selall'));
};

/** Opens the selection mode, as «Выбрать» does. */
const selectMode = (): void => {
  rowCheckboxes();
};

describe('the index', () => {
  it('keeps the same navigation node when the table changes', async () => {
    const env = at();
    const { container } = render(App, { env });
    const before = container.querySelector('.tablenav');
    expect(before).not.toBeNull();
    for (const hash of ['#/tables/core_consumable', '#/tables/hnf_item', '#/tables/wondrous']) {
      env.router.navigate(hash, 'ru');
      await tick();
      expect(container.querySelector('.tablenav'), hash).toBe(before);
    }
    expect(screen.getByRole('link', { name: 'Wondrous Environments' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

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
    /* The language tag is an own item's: no catalog row draws it. */
    expect(document.querySelector('.row-main .lt')).toBeNull();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('draws no relation line on a row: the dialog holds them', async () => {
    /* ci1 -> ci2 -> ci3, so ci2 carries both directions. */
    const CHAINED: Loot = {
      ...LOOT,
      items: {
        ...LOOT.items,
        core_item: (LOOT.items['core_item'] ?? []).map((r) =>
          r.id === 'ci1' ? { ...r, craft: ['ci2'] } : r
        )
      }
    };
    const { container } = render(App, { env: at({ data: fakeData(CHAINED) }) });
    const t = dict('ru');
    for (const id of ['ci1', 'ci2', 'ci3']) {
      const it = container.querySelector(`[data-row="${id}"]`);
      expect(it, id).not.toBeNull();
      expect(it?.querySelector('.rcraft'), id).toBeNull();
      expect(it?.textContent, id).not.toContain(t.craftInto);
      expect(it?.textContent, id).not.toContain(t.craftFrom);
    }
    await expectNoA11yViolations(container);
  });

  it('draws no Core tag on a row of a table that mixes books, and keeps the other book', async () => {
    const MIXED: Loot = {
      ...LOOT,
      items: {
        ...LOOT.items,
        starting: [
          row({ id: 'ai1', src: 'core', ru: 'Ключ Ядра' }),
          row({ id: 'ai2', src: 'hnf', ru: 'Ключ Надежды' })
        ]
      }
    };
    const { container } = render(App, {
      env: at({ router: memoryRouter('#/tables/other_starting'), data: fakeData(MIXED) })
    });
    await waitFor(() => {
      expect(container.querySelector('[data-row="ai2"]')).not.toBeNull();
    });
    const tags = (id: string): string[] =>
      [
        ...(container.querySelector(`[data-row="${id}"]`)?.querySelectorAll('.badge.src') ?? [])
      ].map((b) => b.textContent.trim());
    expect(tags('ai1')).toEqual([]);
    expect(tags('ai2')).toEqual(['Hope & Fear']);
    await expectNoA11yViolations(container);
  });

  it('draws a stat line instead of a roll number for equipment', () => {
    render(App, { env: at() });
    expect(screen.getByText(/Вплотную/)).toBeInTheDocument();
    expect(
      screen.queryByText('Клинок Эха')?.closest('.row')?.querySelector('.rnum')
    ).toBeNull();
  });

  it('splits a labeled line and a labeled list item into a name and a body', () => {
    render(App, { env: at() });
    expect(screen.getByText('Свойство:')).toBeInTheDocument();
    expect(screen.getByText('Хват:')).toBeInTheDocument();
  });

  it('draws formatted text as one run: bold, a numbered list and table rows, with no span', async () => {
    const FORMATTED: Loot = {
      ...LOOT,
      items: {
        ...LOOT.items,
        core_item: (LOOT.items['core_item'] ?? []).map((r) =>
          r.id === 'ci1'
            ? {
                ...r,
                rud: '**Раз:** тихо.\n2. Один\n3. Два\n| А | Б |\n|---|---|\n| 1 | *2* |'
              }
            : r
        )
      }
    };
    const { container } = render(App, { env: at({ data: fakeData(FORMATTED) }) });
    const run = container.querySelector('[data-row="ci1"] .rt > span:not(.rh):not(.rstats)');
    expect(run?.innerHTML.replace(/<!---->/g, '')).toBe(
      '<b>Раз:</b> тихо.<br>2. Один<br>3. Два<br>А | Б<br>1 | <i>2</i>'
    );
    expect(run?.querySelector('span')).toBeNull();
    await expectNoA11yViolations(container);
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
    await userEvent.type(screen.getByPlaceholderText('Поиск'), 'тишины');
    expect(rows()).toHaveLength(1);
    /* The match is marked in the name, with more than color (WCAG 1.4.1). */
    const mark = document.querySelector('[data-row="ci1"] mark');
    expect(mark).toHaveTextContent('Тишины');
    /* One parent for every run: the name line is flex, and a run of its own is a flex
       item with a gap around it. */
    expect(mark?.parentElement).toHaveClass('rname');
    expect(mark?.parentElement).toHaveTextContent('Кольцо Тишины');
    /* A table names its numbers, so a row draws the bare number. */
    expect(document.querySelector('[data-row="ci1"] .rnum')?.textContent).toMatch(/^\d+$/);
  });

  it('a grid tile marks the queried words of its name', async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Сетка' }));
    await userEvent.type(screen.getByPlaceholderText('Поиск'), 'тишины');
    const name = document.querySelector('[data-row="ci1"] .tile-b b');
    expect(name?.querySelector('mark')).toHaveTextContent('Тишины');
    expect(name).toHaveTextContent('Кольцо Тишины');
  });

  it('draws a row with no query the same as before: no mark, the name whole', () => {
    render(App, { env: at() });
    const name = document.querySelector('[data-row="ci1"] .rname');
    expect(name?.querySelector('mark')).toBeNull();
    expect(name?.children).toHaveLength(0);
    expect(name?.textContent).toBe('Кольцо Тишины');
  });

  it('shows the empty state with no reset button of its own', async () => {
    render(App, { env: at() });
    await userEvent.type(screen.getByPlaceholderText('Поиск'), 'нет такого');
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Сбросить всё' })).not.toBeInTheDocument();
  });
});

describe('the view switch', () => {
  it('draws tiles instead of rows, and keeps the same names', async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Сетка' }));
    expect(screen.getByText('Кольцо Тишины')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Список' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сетка' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it("carries a tile's own tier where there is no roll and no stat block", async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Сетка' }));
    const tile = screen.getByText('Осколок Легенды').closest('.tilewrap');
    expect(tile?.querySelector('.tile-n')).toHaveTextContent('A');
  });

  it("carries equipment's own tier where there is no roll but there is a stat block", async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Сетка' }));
    const tile = screen.getByText('Клинок Эха').closest('.tilewrap');
    expect(tile?.querySelector('.tile-n')).toHaveTextContent('Ранг 1');
    /* One kind of table: the kind is the page's, so the tile draws no kind badge. */
    expect(tile?.querySelector('.tile-k')).toBeNull();
  });

  it('leaves the tile bare when there is neither a roll nor a tier of any kind', async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Сетка' }));
    const tile = screen.getByText('Пыль').closest('.tilewrap');
    expect(tile?.querySelector('.tile-n')).toBeNull();
    expect(tile?.querySelector('.tile-k')).toBeNull();
  });

  it('draws the kind glyph and no picture in a row and on a tile of a record with no art', async () => {
    const { container } = render(App, { env: at() });
    const rowEl = screen.getByText('Кольцо Тишины').closest('[data-row]');
    expect(rowEl?.querySelector('img')).toBeNull();
    expect(rowEl?.querySelector('.ra svg path')).toHaveAttribute('d', ICONS.kindItem.d);
    await userEvent.click(screen.getByRole('button', { name: 'Сетка' }));
    const tile = screen.getByText('Кольцо Тишины').closest('.tilewrap');
    expect(tile?.querySelector('img')).toBeNull();
    expect(tile?.querySelector('.tile-img svg path')).toHaveAttribute('d', ICONS.kindItem.d);
    await expectNoA11yViolations(container);
  });

  it('changes the view for this visit and stores nothing', async () => {
    const env = at();
    render(App, { env });
    await userEvent.click(screen.getByRole('button', { name: 'Сетка' }));
    expect(document.querySelector('.tilewrap')).toBeInTheDocument();
    expect(env.storage.get('dhloot.prefs.v1')).toBeNull();
    expect(document.querySelector('.keepnote')).toBeNull();
  });

  it('draws no note under the view switch, which carries the choice alone', async () => {
    const { container } = render(App, { env: at({ cloud: fakeCloud(SEED) }) });
    await userEvent.click(screen.getByRole('button', { name: 'Сетка' }));
    expect(document.querySelector('.keepnote')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('labels a tile of a table of two kinds with its kind, and draws its stat line second', async () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/wondrous'), data: fakeData(LOOT) })
    });
    await userEvent.click(screen.getByRole('button', { name: 'Сетка' }));
    const tile = screen.getByText('Зелье Ветра').closest('.tilewrap');
    expect(tile?.querySelector('.tile-k .badge')).toHaveTextContent('Расходник');
    expect(tile?.querySelector('.tile-n')).toHaveTextContent('2');
  });

  it('reads the English name first on an English tile, and the other name second', async () => {
    render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lang.v1': 'en' }) })
    });
    await userEvent.click(screen.getByRole('button', { name: 'Grid' }));
    const tile = document.querySelector('[data-row="ci1"] .tile-b');
    expect(tile?.querySelector('b')).toHaveTextContent('Thing');
    expect(tile?.querySelector('span')).toHaveTextContent('Кольцо Тишины');
  });
});

describe('selection', () => {
  it('ticks a row, and select-all ticks every row shown', async () => {
    render(App, { env: at() });
    const boxes = rowCheckboxes();
    await userEvent.click(boxes[0] as HTMLElement);
    expect(boxes[0]).toBeChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
    for (const b of boxes) expect(b).toBeChecked();
  });

  it('unticks a row that was already ticked', async () => {
    render(App, { env: at() });
    const box = rowCheckboxes()[0] as HTMLElement;
    await userEvent.click(box);
    expect(box).toBeChecked();
    await userEvent.click(box);
    expect(box).not.toBeChecked();
  });

  it('select-all drops every tick when everything is already selected', async () => {
    render(App, { env: at() });
    selectMode();
    const all = screen.getByRole('checkbox', { name: 'Выбрать все' });
    await userEvent.click(all);
    const boxes = rowCheckboxes();
    for (const b of boxes) expect(b).toBeChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
    for (const b of boxes) expect(b).not.toBeChecked();
  });

  it('belongs to the table it was made on: a hash change drops it', async () => {
    const env = at();
    render(App, { env });
    const box = rowCheckboxes()[0] as HTMLElement;
    await userEvent.click(box);
    expect(box).toBeChecked();
    env.router.navigate('#/tables/hnf_item', 'ru');
    await tick();
    env.router.navigate('#/tables', 'ru');
    await tick();
    const again = rowCheckboxes()[0] as HTMLElement;
    expect(again).not.toBeChecked();
  });
});

/** Renders the tables as gm4, who holds `lists`, and waits for the account. */
async function openBar(lists: SeedList[] = TWO_LISTS) {
  Element.prototype.scrollIntoView = vi.fn();
  const cloud = fakeCloud(seedWith({ gm4: lists }), 'gm4');
  const page = fakePage();
  const view = render(App, { env: at({ cloud, page }) });
  await screen.findByRole('button', { name: 'Аккаунт: gm4@example.test' });
  return { ...view, cloud, page };
}

/** Presses «В список» and waits for the menu's newest chip. */
async function openBarMenu(first = 'Лавка в порту'): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: 'В список' }));
  await screen.findByRole('button', { name: first });
}

describe('the selection bar', () => {
  it('draws nothing until something is ticked', () => {
    const { container } = render(App, { env: at() });
    expect(container.querySelector('.selcount')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Снять выделение' })).not.toBeInTheDocument();
  });

  it('reads the count, and offers add-to-list, print and copy for one tick', async () => {
    const { container } = render(App, { env: at({ cloud: fakeCloud(SEED) }) });
    const boxes = rowCheckboxes();
    await userEvent.click(boxes[0] as HTMLElement);

    expect(container.querySelector('.selcount')).toHaveTextContent(/^Выбрано: 1$/);
    expect(container.querySelector('.selsumm')).toHaveAttribute('aria-live', 'polite');
    expect(container.querySelector('.seltotal')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Снять выделение' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'В список' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    const print = screen.getByRole('button', { name: 'Печать' });
    expect(print).toHaveAttribute('title', 'Собрать карточки для печати: девять на лист A4');
    expect(screen.getByRole('button', { name: 'Скопировать текст' })).toBeInTheDocument();
  });

  it('draws no print control with no sign-in configured', async () => {
    render(App, { env: at() });
    await userEvent.click(rowCheckboxes()[0] as HTMLElement);
    expect(screen.queryByRole('button', { name: 'Печать' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Скопировать текст' })).toBeInTheDocument();
  });

  it('replaces the action row with the sign-in prompt signed out, and «Отмена» brings it back', async () => {
    const { container } = render(App, { env: at({ cloud: fakeCloud(SEED) }) });
    await userEvent.click(rowCheckboxes()[0] as HTMLElement);
    const print = screen.getByRole('button', { name: 'Печать' });
    await waitFor(() => {
      expect(print).toBeEnabled();
    });
    await userEvent.click(print);
    expect(screen.getByText('Войдите, чтобы печатать карточки.')).toBeInTheDocument();
    expect(container.querySelector('.selacts .seldrop')).toBeNull();
    expect(container.querySelector('.printq .signin.compact')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Войти' })).toHaveFocus();
    });
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(container.querySelector('.selacts .seldrop')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Печать' })).toHaveFocus();
    });
  });

  it('makes a set of every ticked id, in tick order, signed in, and opens it', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const env = at({ cloud });
    render(App, { env });
    const boxes = rowCheckboxes();
    await userEvent.click(boxes[1] as HTMLElement);
    await userEvent.click(boxes[0] as HTMLElement);
    const print = screen.getByRole('button', { name: 'Печать' });
    await waitFor(() => {
      expect(print).toBeEnabled();
    });
    await userEvent.click(print);
    await waitFor(() => {
      expect(env.router.hash()).toMatch(/^#\/p\/[A-Za-z0-9_-]{12}$/);
    });
    const read = await cloud.prints.read(env.router.hash().slice(4));
    expect(read).toMatchObject({ ok: true, set: { entries: [{ k: 'ci2' }, { k: 'ci1' }] } });
  });

  it('«Снять выделение» clears every tick, leaves the mode and returns the focus to «Выбрать»', async () => {
    const { container } = render(App, { env: at() });
    const boxes = rowCheckboxes();
    await userEvent.click(boxes[0] as HTMLElement);
    await userEvent.click(boxes[1] as HTMLElement);
    await userEvent.click(screen.getByRole('button', { name: 'Снять выделение' }));

    expect(container.querySelector('.selcount')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Выбрать' })).toHaveFocus();
    });
  });

  it('«Выбрать» opens the mode with zero ticks: the actions off, the clear on, the focus on «Все»', async () => {
    const { container } = render(App, { env: at({ cloud: fakeCloud(SEED) }) });
    await userEvent.click(screen.getByRole('button', { name: 'Выбрать' }));
    expect(screen.queryByRole('button', { name: 'Выбрать' })).toBeNull();
    const all = screen.getByRole('checkbox', { name: 'Выбрать все' });
    await waitFor(() => {
      expect(all).toHaveFocus();
    });
    expect(container.querySelector('.selcount')).toHaveTextContent('Выбрано: 0');
    expect(screen.getByRole('button', { name: 'В список' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Скопировать текст' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Снять выделение' })).toBeEnabled();
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Снять выделение' }));
    expect(screen.getByRole('button', { name: 'Выбрать' })).toBeInTheDocument();
  });

  it('«Все» ticks every row of every section, and reads mixed while some are ticked', async () => {
    const { container } = render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/eq_weapon'), data: fakeData(LOOT) })
    });
    const boxes = rowCheckboxes();
    await userEvent.click(boxes[0] as HTMLElement);
    const all = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Выбрать все' });
    expect(all.indeterminate).toBe(true);
    await userEvent.click(all);
    expect(container.querySelector('.selcount')).toHaveTextContent(
      `Выбрано: ${String(boxes.length)}`
    );
    for (const b of boxes) expect(b).toBeChecked();
  });

  it("select-all's count reaches the bar too", async () => {
    const { container } = render(App, { env: at() });
    selectMode();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
    expect(container.querySelector('.selcount')).toHaveTextContent('Выбрано: 6');
  });

  it('the menu names a single ticked record "лежит в списках"', async () => {
    await openBar();
    await userEvent.click(rowCheckboxes()[0] as HTMLElement);
    await openBarMenu();
    expect(screen.getByText('Лежит в списках')).toBeInTheDocument();
  });

  it('the menu names two or more ticked records "Добавить в"', async () => {
    await openBar();
    const boxes = rowCheckboxes();
    await userEvent.click(boxes[0] as HTMLElement);
    await userEvent.click(boxes[1] as HTMLElement);
    await openBarMenu();
    expect(screen.getByText('Добавить в')).toBeInTheDocument();
  });

  it('keeps the menu newest first for two ticked records, even where a list holds one of them', async () => {
    const holding = listOf(811, 'Клад дракона', [{ key: 'ci1' }], {
      createdAgoMs: 2 * DAY,
      editedAgoMs: 2 * DAY
    });
    await openBar([holding, TWO_LISTS[1] as SeedList]);
    const boxes = rowCheckboxes();
    await userEvent.click(boxes[0] as HTMLElement);
    await userEvent.click(boxes[1] as HTMLElement);
    await openBarMenu();
    const chips = screen.getAllByRole('button', { name: /Клад дракона|Лавка в порту/ });
    expect(chips.map((c) => c.textContent)).toEqual(['Лавка в порту', 'Клад дракона']);
  });

  it('a chip adds every ticked id in one press, keeps the ticks, and toasts the count', async () => {
    const { cloud, page } = await openBar();
    const boxes = rowCheckboxes();
    await userEvent.click(boxes[0] as HTMLElement);
    await userEvent.click(boxes[1] as HTMLElement);
    await openBarMenu();
    await userEvent.click(screen.getByRole('button', { name: 'Клад дракона' }));

    expect(screen.getByText('Добавлено в «Клад дракона»: 2')).toBeInTheDocument();
    expect(boxes[0]).toBeChecked();
    expect(boxes[1]).toBeChecked();
    expect((await readList(cloud, page, uuid(811)))?.ids).toEqual(['ci1', 'ci2']);
  });

  it('copies both flavors of every ticked record, joined with no OR, and toasts', async () => {
    const clip = fakeClipboard();
    render(App, { env: at({ clipboard: clip }) });
    const boxes = rowCheckboxes();
    await userEvent.click(boxes[0] as HTMLElement);
    await userEvent.click(boxes[1] as HTMLElement);
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать текст' }));

    const rich = clip.last.rich;
    expect(rich?.plain).toContain('Кольцо Тишины');
    expect(rich?.plain).toContain('Плащ Теней');
    expect(rich?.plain).not.toMatch(/— .+ —/);
    expect(screen.getByText('Выбранное скопировано')).toBeInTheDocument();
  });

  it('toasts an alert when the clipboard refuses', async () => {
    render(App, { env: at({ clipboard: fakeClipboard({ fail: true }) }) });
    await userEvent.click(rowCheckboxes()[0] as HTMLElement);
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать текст' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось скопировать');
  });

  it('copies nothing and says nothing when a selection outlives the row it named', async () => {
    /* `app.toggleSel(id)` (state/app.svelte.ts) accepts any id, so a selection
       holding one the index does not carry is a real shape - a row removed
       from under a ticked selection, say - and reaches `copySel`'s early
       return that a chosen-and-present id never does. */
    const clip = fakeClipboard();
    const app = new AppState(at({ clipboard: clip }));
    app.toggleSel('nope');
    render(SelBar, { app });
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать текст' }));
    expect(clip.last.rich).toBeUndefined();
    expect(clip.last.text).toBeUndefined();
    expect(app.toast).toBeNull();
  });

  it('has no axe violations with the bar up and its menu open', async () => {
    const { container } = await openBar();
    await userEvent.click(rowCheckboxes()[0] as HTMLElement);
    await openBarMenu();
    await expectNoA11yViolations(container);
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
    expect(clip.last.text).toBe('https://example.test/tables/core_item');
    expect(screen.getByText('Ссылка на таблицу скопирована')).toBeInTheDocument();
  });

  it('copies the English address in English', async () => {
    const clip = fakeClipboard();
    const { container } = render(App, {
      env: at({ clipboard: clip, storage: memoryStorage({ 'dhloot.lang.v1': 'en' }) })
    });
    await userEvent.click(screen.getByRole('button', { name: 'Link to this table' }));
    expect(clip.last.text).toBe('https://example.test/en/tables/core_item');
    await expectNoA11yViolations(container);
  });

  it('says so when the clipboard refuses', async () => {
    render(App, { env: at({ clipboard: fakeClipboard({ fail: true }) }) });
    await userEvent.click(screen.getByRole('button', { name: 'Ссылка на таблицу' }));
    expect(screen.getByText('Не удалось скопировать')).toBeInTheDocument();
  });

  it('copies the preview link of the table, the filter and a block, with no v', async () => {
    const ORIGIN = 'https://daggerheart-loot.pages.dev';
    const clip = fakeClipboard();
    render(App, { env: at({ clipboard: clip, preview: ORIGIN }) });
    await userEvent.click(screen.getByRole('button', { name: 'Ссылка на таблицу' }));
    expect(clip.last.text).toBe(ORIGIN + '/tables/core_item');
    expect(screen.getByText('Ссылка на таблицу скопирована')).toBeInTheDocument();
    cleanup();
    const en = fakeClipboard();
    render(App, {
      env: at({
        clipboard: en,
        preview: ORIGIN,
        storage: memoryStorage({ 'dhloot.lang.v1': 'en' })
      })
    });
    await userEvent.click(screen.getByRole('button', { name: 'Link to this table' }));
    expect(en.last.text).toBe(ORIGIN + '/en/tables/core_item');
    cleanup();
    const filter = fakeClipboard();
    render(App, {
      env: fakeEnv({
        router: memoryRouter('#/tables/wondrous'),
        data: fakeData(LOOT),
        clipboard: filter,
        preview: ORIGIN
      })
    });
    await userEvent.click(screen.getByRole('button', { name: 'Предметы' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ссылка на фильтры' }));
    expect(filter.last.text).toBe(ORIGIN + '/tables/wondrous_environments/f_kind-item');
    cleanup();
    const block = fakeClipboard();
    render(App, {
      env: fakeEnv({
        router: memoryRouter('#/tables/voa'),
        data: fakeData(LOOT),
        clipboard: block,
        preview: ORIGIN
      })
    });
    const [, artifactSection] = screen.getAllByRole('button', {
      name: 'Ссылка на раздел'
    });
    await userEvent.click(artifactSection as HTMLElement);
    expect(block.last.text).toBe(ORIGIN + '/tables/vault_of_ages/tA');
  });
});

describe('the filter', () => {
  const wond = (over: Partial<Env> = {}): Env =>
    fakeEnv({ router: memoryRouter('#/tables/wondrous'), data: fakeData(LOOT), ...over });

  it('draws no link button without a copy action, and the pills and the reset still', async () => {
    const t = dict('ru');
    const rows: FacetRow[] = [
      { group: 'kind', label: t.kindF, values: [{ value: 'item', label: t.fItems }] }
    ];
    const props = {
      rows,
      picked: { kind: ['item'] },
      shown: 1,
      total: 2,
      open: false,
      t,
      ontoggle: vi.fn(),
      onpick: vi.fn(),
      onreset: vi.fn()
    };
    const { container } = render(FilterBar, props);
    expect(container.querySelector('.fpill')).toHaveTextContent(t.fItems);
    expect(screen.getByRole('button', { name: 'Сбросить всё' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.filterLink })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
    cleanup();
    render(FilterBar, { ...props, oncopylink: vi.fn() });
    expect(screen.getByRole('button', { name: t.filterLink })).toBeInTheDocument();
  });

  it('draws the column from 1000 px with «Все» pressed, and no count line', async () => {
    const { container } = render(App, { env: wond() });
    const column = within(screen.getByRole('complementary', { name: 'Фильтры' }));
    expect(column.getByRole('heading', { name: 'Фильтры' })).toBeInTheDocument();
    expect(column.getByRole('button', { name: 'Все' })).toHaveAttribute('aria-pressed', 'true');
    expect(column.getByRole('button', { name: 'Предметы' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(container.querySelector('.count')).toBeNull();
    expect(container.querySelector('.fcol .lbl')?.textContent).toBe('Тип');
    expect(screen.queryByRole('button', { name: 'Сбросить' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Ссылка на фильтры' })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('narrows the table on a chip, presses it, and names the pick in the count line', async () => {
    const { container } = render(App, { env: wond() });
    await userEvent.click(screen.getByRole('button', { name: 'Предметы' }));
    expect(screen.getByText('Плащ Ветра')).toBeInTheDocument();
    expect(screen.queryByText('Зелье Ветра')).not.toBeInTheDocument();
    const chip = screen.getByRole('button', { name: 'Предметы' });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(chip).toHaveAttribute('data-fval', 'kind:item');
    expect(screen.getByRole('button', { name: 'Все' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('heading', { name: 'Фильтры · 1' })).toBeInTheDocument();
    /* The column shows the pick, so the row repeats the count alone. */
    expect(container.querySelector('.count')?.textContent.trim()).toBe('Показано 1 из 2');
  });

  it('names the pick in the search row at the mid band, where no column shows it', () => {
    const { container } = render(App, {
      env: fakeEnv({
        router: memoryRouter('#/tables/wondrous/f_kind-item'),
        data: fakeData(LOOT),
        viewport: fakeViewport('mid')
      })
    });
    expect(container.querySelector('.searchrow .count')).toHaveTextContent(
      'Предметы · Показано 1 из 2'
    );
  });

  it('a search alone shows the count too, without values', async () => {
    const { container } = render(App, { env: wond() });
    await userEvent.type(screen.getByPlaceholderText('Поиск'), 'плащ');
    expect(container.querySelector('.count')).toHaveTextContent('Показано 1 из 2');
  });

  it('resets from the column once something is picked, and clears the address', async () => {
    const env = wond();
    render(App, { env });
    await userEvent.click(screen.getByRole('button', { name: 'Предметы' }));
    expect(env.router.hash()).not.toBe('#/tables/wondrous_environments');
    expect(screen.getByRole('button', { name: 'Ссылка на фильтры' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Сбросить' }));
    expect(screen.getByText('Зелье Ветра')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Сбросить' })).not.toBeInTheDocument();
    expect(env.router.hash()).toBe('#/tables/wondrous_environments');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Все' })).toHaveFocus();
    });
  });

  it('grows a primary reset in the empty state, and the cause names the query and the value', async () => {
    const { container } = render(App, { env: wond() });
    await userEvent.click(screen.getByRole('button', { name: 'Предметы' }));
    await userEvent.type(screen.getByPlaceholderText('Поиск'), 'нет такого');
    const empty = screen.getByText('Ничего не найдено').closest('.empty') as HTMLElement;
    expect(empty).toHaveTextContent('Нет совпадений с «нет такого» среди фильтров: Предметы.');
    expect(empty.querySelector('.glyph svg')).not.toBeNull();
    const reset = within(empty).getByRole('button', { name: 'Сбросить фильтры' });
    expect(reset).toHaveClass('primary');
    await expectNoA11yViolations(container);
  });

  it('shows the plate with no reset when only a search narrows', async () => {
    render(App, { env: wond() });
    await userEvent.type(screen.getByPlaceholderText('Поиск'), 'нет такого');
    const empty = screen.getByText('Ничего не найдено').closest('.empty') as HTMLElement;
    expect(empty).toHaveTextContent(
      'Нет совпадений с «нет такого» в названиях и описаниях этой таблицы.'
    );
    expect(within(empty).queryByRole('button')).toBeNull();
  });

  it('keeps a query with replacement patterns as text in the cause', async () => {
    render(App, { env: wond() });
    await userEvent.click(screen.getByRole('button', { name: 'Предметы' }));
    await userEvent.type(screen.getByPlaceholderText('Поиск'), '%v $&');
    expect(screen.getByText('Ничего не найдено').closest('.empty')).toHaveTextContent(
      'Нет совпадений с «%v $&» среди фильтров: Предметы.'
    );
  });

  it('draws no cause for a picked value that no row offers, and keeps the reset', () => {
    const { container } = render(App, {
      env: fakeEnv({
        router: memoryRouter('#/tables/eq_weapon/f_tier-9'),
        data: fakeData(LOOT)
      })
    });
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    expect(container.querySelector('.cause')).toBeNull();
    expect(screen.getByRole('button', { name: 'Сбросить фильтры' })).toBeInTheDocument();
  });

  it('draws no «Выбрать» while no row is drawn, and draws it again with the rows', async () => {
    render(App, { env: wond() });
    const box = screen.getByPlaceholderText('Поиск');
    await userEvent.type(box, 'нет такого');
    expect(screen.queryByRole('button', { name: 'Выбрать' })).toBeNull();
    await userEvent.clear(box);
    expect(screen.getByRole('button', { name: 'Выбрать' })).toBeInTheDocument();
  });

  it('below 1000 px opens no sheet on a filter link; «Фильтры · 1» opens it and «Закрыть» returns', async () => {
    const env = fakeEnv({
      router: memoryRouter('#/tables/wondrous/f_kind-item'),
      data: fakeData(LOOT),
      viewport: fakeViewport('narrow')
    });
    const { container } = render(App, { env });
    expect(screen.queryByRole('dialog')).toBeNull();
    const line = container.querySelector('p.count.line');
    expect(line?.querySelector('.vals')).toHaveTextContent('Предметы');
    expect(line?.querySelector('.n')).toHaveTextContent('Показано 1 из 2');
    expect(line?.textContent).not.toContain('·');
    const toggle = screen.getByRole('button', { name: 'Фильтры · 1' });
    expect(toggle).toHaveClass('toggle');
    await userEvent.click(toggle);
    const sheet = within(screen.getByRole('dialog', { name: 'Фильтры' }));
    expect(sheet.getByRole('button', { name: 'Предметы' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(sheet.getByRole('button', { name: 'Показать 1' })).toBeInTheDocument();
    expect(sheet.getByRole('button', { name: 'Ссылка на фильтры' })).toBeInTheDocument();
    await expectNoA11yViolations(document.body);
    await userEvent.click(sheet.getByRole('button', { name: 'Сбросить' }));
    await waitFor(() => {
      expect(sheet.getByRole('button', { name: 'Закрыть' })).toHaveFocus();
    });
    expect(sheet.getByRole('button', { name: 'Показать 2' })).toBeInTheDocument();
    await userEvent.click(sheet.getByRole('button', { name: 'Закрыть' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Фильтры' })).toHaveFocus();
  });

  it('draws the head of the mid band: the visible heading, the labeled pin and the sheet toggle', () => {
    render(App, { env: wond({ viewport: fakeViewport('mid') }) });
    expect(screen.getByRole('heading', { level: 1, name: 'Таблицы' })).not.toHaveClass('vh');
    expect(screen.getByRole('button', { name: 'Открывать при запуске' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Об этих данных' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Фильтры' })).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Фильтры' })).toBeNull();
  });

  it('keeps the selection (and the bar) on a filter pick, and drops both on a navigation', async () => {
    const env = wond();
    const { container } = render(App, { env });
    const box = rowCheckboxes()[0] as HTMLElement;
    await userEvent.click(box);
    expect(box).toBeChecked();
    expect(container.querySelector('.selcount')).toHaveTextContent('Выбрано: 1');

    await userEvent.click(screen.getByRole('button', { name: 'Предметы' }));
    expect(rowCheckboxes()[0]).toBeChecked();
    expect(container.querySelector('.selcount')).toHaveTextContent('Выбрано: 1');

    env.router.navigate('#/tables/wondrous', 'ru');
    await tick();
    expect(container.querySelector('.selcount')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Выбрать' })).toBeInTheDocument();
  });

  it('closes the modal on a navigation', async () => {
    const env = wond();
    render(App, { env });
    await userEvent.click(screen.getByRole('button', { name: /Плащ Ветра/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    env.router.navigate('#/tables/dread', 'ru');
    await tick();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('copies the filter link, with the picked value in the address', async () => {
    const clip = fakeClipboard();
    render(App, { env: wond({ clipboard: clip }) });
    await userEvent.click(screen.getByRole('button', { name: 'Предметы' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ссылка на фильтры' }));
    expect(clip.last.text).toBe(
      'https://example.test/tables/wondrous_environments/f_kind-item'
    );
    expect(screen.getByText('Ссылка на фильтры скопирована')).toBeInTheDocument();
  });
});

describe('the equipment tables', () => {
  it('groups weapons into their own tier sections, in order, dropping an empty tier', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/eq_weapon'), data: fakeData(LOOT) })
    });
    expect(document.getElementById('sec-t1')).not.toBeNull();
    expect(document.getElementById('sec-t2')).not.toBeNull();
    expect(document.getElementById('sec-t3')).not.toBeNull();
    expect(document.getElementById('sec-t4')).not.toBeNull();
    expect(document.querySelectorAll('.tsec-head .lbl')[0]).toHaveTextContent('Ранг 1');
    expect(document.getElementById('sec-tA')).toBeNull();
  });

  it('draws an Artifacts section after tier 4 when an artifact weapon exists', async () => {
    const withArtifact: Loot = {
      ...LOOT,
      items: {
        ...LOOT.items,
        voa: [
          ...(LOOT.items['voa'] ?? []),
          row({
            id: 'v3',
            src: 'voa',
            kind: 'equip',
            tier: 'A',
            ru: 'Клятва Равновесия',
            eq: { t: 'weapon', tier: 'A', cls: 'phy', tr: 'strength', rg: 'melee', bu: 2 }
          })
        ]
      }
    };
    const { container } = render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/eq_weapon'), data: fakeData(withArtifact) })
    });
    const labels = [...document.querySelectorAll('.tsec-head .lbl')].map(
      (el) => el.textContent
    );
    expect(labels).toEqual(['Ранг 1', 'Ранг 2', 'Ранг 3', 'Ранг 4', 'Артефакты']);
    const section = document.getElementById('sec-tA');
    expect(section).not.toBeNull();
    expect(
      within(section?.closest('.tsection') as HTMLElement).getByText('Клятва Равновесия')
    ).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('drops a tier with no rows - armor has none in tier 3 or 4', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/eq_armor'), data: fakeData(LOOT) })
    });
    expect(document.getElementById('sec-t1')).not.toBeNull();
    expect(document.getElementById('sec-t2')).not.toBeNull();
    expect(document.getElementById('sec-t3')).toBeNull();
    expect(document.getElementById('sec-t4')).toBeNull();
  });

  it('draws no count line with nothing picked, and names the pool once narrowed', async () => {
    const { container } = render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/eq_weapon'), data: fakeData(LOOT) })
    });
    expect(container.querySelector('.count')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Магическое' }));
    /* `core_item` carries a weapon stat block too, so the pool is one more than `eq`'s
       own four weapon rows. */
    expect(container.querySelector('.count')?.textContent.trim()).toBe('Показано 2 из 5');
  });

  it('draws only the fields the rows can narrow: six on weapons, two on armor, none on one secondary', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/eq_weapon'), data: fakeData(LOOT) })
    });
    /* Every weapon here is unique, so «Линейка» cannot narrow. */
    const labels = (): (string | undefined)[] =>
      [...document.querySelectorAll('.frow .lbl')].map((el) => el.textContent.trim());
    expect(labels()).toEqual([
      'Ранг',
      'Источник',
      'Класс',
      'Характеристика',
      'Дистанция',
      'Хват'
    ]);

    cleanup();
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/eq_armor'), data: fakeData(LOOT) })
    });
    expect(labels()).toEqual(['Ранг', 'Источник']);

    cleanup();
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/eq_secondary'), data: fakeData(LOOT) })
    });
    expect(screen.queryByRole('complementary', { name: 'Фильтры' })).toBeNull();
  });

  /* A second secondary weapon of the other class, so the class row can narrow. */
  const twoSecondaries: Loot = {
    ...LOOT,
    eq: [
      ...(LOOT.eq ?? []),
      row({ id: 'q7', ru: 'Щит Стража', eq: { t: 'secondary', tier: 1, cls: 'phy' } })
    ]
  };

  it('reads a tier no secondary weapon has as before: no chip, no row, «Сбросить фильтры»', async () => {
    const { container } = render(App, {
      env: fakeEnv({
        router: memoryRouter('#/tables/eq_secondary/f_tier-A'),
        data: fakeData(twoSecondaries)
      })
    });
    expect(container.querySelector('[data-fval][aria-pressed="true"]')).toBeNull();
    expect(container.querySelector('[data-row]')).toBeNull();
    expect(screen.getByText('Ничего не найдено', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сбросить фильтры' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('labels the class row Класс on every weapon kind', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/eq_weapon'), data: fakeData(LOOT) })
    });
    expect(screen.getByText('Класс')).toBeInTheDocument();

    cleanup();
    render(App, {
      env: fakeEnv({
        router: memoryRouter('#/tables/eq_secondary'),
        data: fakeData(twoSecondaries)
      })
    });
    expect(screen.getByText('Класс')).toBeInTheDocument();
  });

  it('a tier pick reads "Ранг 1" and a burden pick reads "Двуручное" in the count line', async () => {
    const { container } = render(App, {
      env: fakeEnv({
        router: memoryRouter('#/tables/eq_weapon'),
        data: fakeData(LOOT),
        viewport: fakeViewport('mid')
      })
    });
    await userEvent.click(screen.getByRole('button', { name: 'Фильтры' }));
    await userEvent.click(screen.getByRole('button', { name: '1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Двуручное' }));
    expect(container.querySelector('.count')?.textContent.replace(/\s+/g, ' ').trim()).toMatch(
      /^Ранг 1, Двуручное · Показано \d+ из \d+$/
    );
  });

  it('a mag pick drops physical weapons', async () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/eq_weapon'), data: fakeData(LOOT) })
    });
    await userEvent.click(screen.getByRole('button', { name: 'Магическое' }));
    expect(screen.queryByText('Меч Рассвета')).not.toBeInTheDocument();
    expect(screen.getByText('Посох Бури')).toBeInTheDocument();
  });

  it('a filter link arrives with both chips pressed in the column', () => {
    const { container } = render(App, {
      env: fakeEnv({
        router: memoryRouter('#/tables/eq_weapon/f_tier-2.cls-mag'),
        data: fakeData(LOOT)
      })
    });
    const column = within(container.querySelector('.fcol') as HTMLElement);
    expect(column.getByRole('button', { name: '2' })).toHaveAttribute('aria-pressed', 'true');
    expect(column.getByRole('button', { name: 'Магическое' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(column.getByRole('heading', { name: 'Фильтры · 2' })).toBeInTheDocument();
  });

  it('a second press on a picked chip drops it from the address', async () => {
    const env = fakeEnv({
      router: memoryRouter('#/tables/eq_weapon/f_tier-2.cls-mag'),
      data: fakeData(LOOT)
    });
    render(App, { env });
    await userEvent.click(screen.getByRole('button', { name: 'Магическое' }));
    expect(env.router.hash()).toBe('#/tables/eq_weapon/f_tier-2');
    expect(screen.getByRole('heading', { name: 'Фильтры · 1' })).toBeInTheDocument();
  });

  it('a group the table does not offer leaves it whole - burden on armor', () => {
    render(App, {
      env: fakeEnv({
        router: memoryRouter('#/tables/eq_armor/f_burden-2'),
        data: fakeData(LOOT)
      })
    });
    expect(screen.getByText('Латы Стража')).toBeInTheDocument();
    expect(screen.getByText('Доспех Зверя')).toBeInTheDocument();
  });

  it('the empty state names the values and grows its own reset button', async () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/eq_weapon'), data: fakeData(LOOT) })
    });
    await userEvent.click(screen.getByRole('button', { name: 'Магическое' }));
    await userEvent.click(screen.getByRole('button', { name: 'Одноручное' }));
    const empty = screen.getByText('Ничего не найдено').closest('.empty');
    expect(empty).toHaveTextContent('Ничего не подходит под фильтры: Магическое, Одноручное.');
    expect(
      within(empty as HTMLElement).getByRole('button', { name: 'Сбросить фильтры' })
    ).toBeInTheDocument();
  });

  it('a press on «Все» clears its row and keeps the focus on it', async () => {
    const env = fakeEnv({
      router: memoryRouter('#/tables/eq_weapon/f_tier-1-2.cls-mag'),
      data: fakeData(LOOT)
    });
    const { container } = render(App, { env });
    const tierRow = within(screen.getByRole('group', { name: 'Ранг' }));
    const all = tierRow.getByRole('button', { name: 'Все' });
    expect(all).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(all);
    expect(env.router.hash()).toBe('#/tables/eq_weapon/f_cls-mag');
    expect(all).toHaveAttribute('aria-pressed', 'true');
    expect(all).toHaveFocus();
    await expectNoA11yViolations(container);
  });

  it('hands the focus to the first «Все» after «Сбросить», in the column and in the empty state', async () => {
    render(App, {
      env: fakeEnv({
        router: memoryRouter('#/tables/eq_weapon/f_tier-2'),
        data: fakeData(LOOT)
      })
    });
    const firstAll = (): HTMLElement =>
      within(screen.getByRole('group', { name: 'Ранг' })).getByRole('button', { name: 'Все' });
    await userEvent.click(screen.getByRole('button', { name: 'Сбросить' }));
    await waitFor(() => {
      expect(firstAll()).toHaveFocus();
    });
    await userEvent.click(screen.getByRole('button', { name: 'Магическое' }));
    await userEvent.click(screen.getByRole('button', { name: 'Одноручное' }));
    const empty = screen.getByText('Ничего не найдено').closest('.empty') as HTMLElement;
    await userEvent.click(within(empty).getByRole('button', { name: 'Сбросить фильтры' }));
    await waitFor(() => {
      expect(firstAll()).toHaveFocus();
    });
  });

  it('keeps its three link controls on a catalog table', () => {
    render(App, {
      env: fakeEnv({
        router: memoryRouter('#/tables/eq_weapon/f_tier-2'),
        data: fakeData(LOOT)
      })
    });
    expect(screen.getByRole('button', { name: 'Ссылка на таблицу' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: dict('ru').filterLink })).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: dict('ru').copySection }).length
    ).toBeGreaterThan(0);
  });

  it('searching the type word keeps every weapon - the search fix', async () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/eq_weapon'), data: fakeData(LOOT) })
    });
    await userEvent.type(screen.getByPlaceholderText('Поиск'), 'основное');
    expect(screen.getByText('Меч Рассвета')).toBeInTheDocument();
    expect(screen.getByText('Посох Бури')).toBeInTheDocument();
    expect(screen.getByText('Копьё Ранга')).toBeInTheDocument();
    expect(screen.getByText('Клинок Легенды')).toBeInTheDocument();
  });

  it('a section anchor flashes its tier section', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/eq_weapon/t2'), data: fakeData(LOOT) })
    });
    await waitFor(() => {
      expect(document.getElementById('sec-t2')).toHaveClass('flash');
    });
  });

  it('a row anchor flashes the row', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/eq_weapon/q1'), data: fakeData(LOOT) })
    });
    await waitFor(() => {
      expect(document.querySelector('[data-row="q1"]')).toHaveClass('flash');
    });
  });
});

describe('the chip nav', () => {
  const groupChips = (): string[] => {
    const nav = screen.getByRole('group', { name: 'Группа' });
    return [...nav.querySelectorAll('a')].map((a) => a.textContent);
  };
  const bookRow = (): HTMLElement | null => document.querySelector('.tablenav .tabs');

  it('draws six group chips signed out, the supplements under one', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/core_item'), data: fakeData(LOOT) })
    });
    expect(groupChips()).toEqual([
      'Core',
      'Hope & Fear',
      'Альт. таблицы',
      'Дополнения',
      'Снаряжение',
      'Прочее'
    ]);
  });

  it.each(['many_worlds_tavern', 'core_item'])(
    'holds the group and book chips of %s in one navigation landmark named by the tab',
    async (table) => {
      const { container } = render(App, {
        env: fakeEnv({ router: memoryRouter(`#/tables/${table}`), data: fakeData(LOOT) })
      });
      const navs = screen.getAllByRole('navigation', { name: 'Таблицы' });
      expect(navs).toHaveLength(1);
      expect(navs[0]).toHaveClass('tablenav');
      expect(
        within(navs[0] as HTMLElement).getByRole('link', { name: 'Core' })
      ).toBeInTheDocument();
      if (table === 'many_worlds_tavern') {
        expect(navs[0]).toContainElement(bookRow());
      }
      await expectNoA11yViolations(container);
      cleanup();
      render(App, {
        env: fakeEnv({
          router: memoryRouter(`#/tables/${table}`),
          data: fakeData(LOOT),
          storage: memoryStorage({ 'dhloot.lang.v1': 'en' })
        })
      });
      expect(screen.getAllByRole('navigation', { name: 'Tables' })).toHaveLength(1);
    }
  );

  it('draws a seventh, Homebrew, signed in', async () => {
    render(App, {
      env: fakeEnv({
        router: memoryRouter('#/tables/core_item'),
        data: fakeData(LOOT),
        cloud: fakeCloud(SEED, 'gm1')
      })
    });
    await waitFor(() => {
      expect(groupChips()).toHaveLength(7);
    });
  });

  it.each(['wondrous', 'dread', 'voa', 'dv', 'arazo', 'community', 'mwt'])(
    'lights «Дополнения» on %s and draws the book row with that book current',
    async (table) => {
      const { container } = render(App, {
        env: fakeEnv({ router: memoryRouter(`#/tables/${table}`), data: fakeData(LOOT) })
      });
      const tablenav = document.querySelector('.tablenav') as HTMLElement;
      const group = within(tablenav).getByRole('link', { name: 'Дополнения' });
      expect(group).toHaveAttribute('aria-current', 'page');
      expect(group).toHaveAttribute('href', '/tables/wondrous_environments');
      const row = bookRow() as HTMLElement;
      const books = within(row).getAllByRole('link');
      const names = [
        'Wondrous Environments',
        'Dread GM Toolbox',
        'Vault of Ages',
        "The Dragon's Vault",
        "Arazo's Artifacts",
        'Предметы сообществ',
        'Many Worlds Tavern'
      ];
      expect(books).toEqual(names.map((name) => within(row).getByRole('link', { name })));
      expect(row).toHaveAttribute('aria-label', 'Дополнения');
      expect(
        books
          .filter((a) => a.getAttribute('aria-current') === 'page')
          .map((a) => a.getAttribute('href'))
      ).toEqual([tablesHash(table as TableId).slice(1)]);
      if (table === 'voa') await expectNoA11yViolations(container);
    }
  );

  it('draws the nothing-found state on Many Worlds Tavern when the catalog has no realm rows', async () => {
    const { container } = render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/mwt'), data: fakeData(LOOT) })
    });
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    expect(container.querySelectorAll('.rows .row')).toHaveLength(0);
    await expectNoA11yViolations(container);
  });

  it("draws Core's own sub-tables, not the books, on a Core table", () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/core_item'), data: fakeData(LOOT) })
    });
    const subs = within(bookRow() as HTMLElement).getAllByRole('link');
    expect(subs.map((a) => a.textContent)).toEqual(['Предметы', 'Расходники']);
  });
});

describe('a sectioned body: Vault of Ages by tier', () => {
  it('groups rows into their tier, in book order, dropping tiers with no rows', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/voa'), data: fakeData(LOOT) })
    });
    const heads = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(heads).toContain('Ранг 1');
    expect(heads).toContain('Артефакты');
    /* Nothing at all in tier 2, 3, 4 or the cursed-objects division. */
    expect(heads).not.toContain('Ранг 2');
    expect(heads).not.toContain('Проклятые предметы');
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
      name: 'Ссылка на раздел'
    });
    await userEvent.click(artifactSection as HTMLElement);
    expect(clip.last.text).toBe('https://example.test/tables/vault_of_ages/tA');
    expect(screen.getByText('Ссылка на раздел скопирована')).toBeInTheDocument();
  });

  it("draws no select-all per section: the bar's «Все» is the one control of the mode", () => {
    const { container } = render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/voa'), data: fakeData(LOOT) })
    });
    expect(container.querySelectorAll('.tsection').length).toBeGreaterThan(1);
    selectMode();
    expect(screen.getAllByRole('checkbox', { name: /Выбрать все/ })).toHaveLength(1);
    expect(screen.queryByText(/Выбрать все/)).toBeNull();
    expect(document.querySelector('.tsection .selall')).toBeNull();
  });
});

describe('a sectioned body: Other', () => {
  it('lists every campaign that has a row, including one with a single row', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/other_frames'), data: fakeData(LOOT) })
    });
    /* The row's own source badge carries the same name (label.test.ts's own
       fix), so a section heading is not the only place the text appears. */
    expect(document.querySelectorAll('.tsec-head .lbl')).toHaveLength(2);
    expect(document.querySelector('.tsection #sec-starting')).toBeNull();
    expect(screen.getAllByText('Пир зверей').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Материнская Плата').length).toBeGreaterThan(0);
    /* No row belongs to it in this fixture, so it draws no section at all. */
    expect(screen.queryByText('Колоссы Сухоземья')).not.toBeInTheDocument();
  });

  it('keeps a frame-selected starting item in its setting section', () => {
    const motherboardStarter = row({
      id: 's2',
      src: 'core',
      kind: 'item',
      starting: true,
      frame: 'motherboard',
      ru: 'Стартовая материнская плата'
    });
    const data = structuredClone(LOOT);
    data.items['starting']!.push(motherboardStarter);
    render(App, {
      env: fakeEnv({
        router: memoryRouter('#/tables/other_frames/f_frame-motherboard'),
        data: fakeData(data)
      })
    });
    expect(document.getElementById('sec-starting')).toBeNull();
    expect(document.getElementById('sec-motherboard')).not.toBeNull();
    expect(document.querySelector('#sec-motherboard [data-row="s2"]')).not.toBeNull();
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

  it("ticks both columns through the bar's «Все»", async () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/alt_item'), data: fakeData(LOOT) })
    });
    const boxes = rowCheckboxes();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
    for (const b of boxes) expect(b).toBeChecked();
  });

  it("reads the source badge as the frame's own name, not its raw id", () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/other_frames'), data: fakeData(LOOT) })
    });
    const row = screen.getByRole('button', { name: /Пирог Зверя/ });
    /* The section heading above the row names the setting, so the row repeats no
       source tag (rowTags.ts). */
    expect(within(row).queryByText('Пир зверей')).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'Пир зверей' })).toBeInTheDocument();
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

  it('scrolls smoothly to the row a link named', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/core_item/ci2'), data: fakeData(LOOT) })
    });
    await waitFor(() => {
      expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });
  });

  it('jumps to the row instead when the reader asked for less motion', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(App, {
      env: fakeEnv({
        router: memoryRouter('#/tables/core_item/ci2'),
        data: fakeData(LOOT),
        motion: fakeMotion(true)
      })
    });
    await waitFor(() => {
      expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
    });
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

  it('the outline follows the record into the grid view', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    vi.useFakeTimers();
    try {
      render(App, {
        env: fakeEnv({ router: memoryRouter('#/tables/core_item/ci2'), data: fakeData(LOOT) })
      });
      await tick();
      await Promise.resolve();
      expect(document.querySelector('[data-row="ci2"]')).toHaveClass('flash');
      await fireEvent.click(screen.getByRole('button', { name: 'Сетка' }));
      await tick();
      const tile = document.querySelector('[data-row="ci2"]');
      expect(tile).toHaveClass('tilewrap');
      expect(tile).toHaveClass('flash');
      expect(scroll).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(1599);
      await tick();
      expect(tile).toHaveClass('flash');
      vi.advanceTimersByTime(1);
      await tick();
      expect(document.querySelector('[data-row="ci2"]')).not.toHaveClass('flash');
    } finally {
      vi.useRealTimers();
    }
  });

  it('re-plays the scroll and the outline on a language switch', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/core_item/ci2'), data: fakeData(LOOT) })
    });
    await waitFor(() => {
      expect(document.querySelector('[data-row="ci2"]')).toHaveClass('flash');
      expect(scroll).toHaveBeenCalledTimes(1);
    });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    await waitFor(() => {
      expect(scroll).toHaveBeenCalledTimes(2);
      expect(document.querySelector('[data-row="ci2"]')).toHaveClass('flash');
    });
  });

  it('a search keystroke does not re-play it', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables/core_item/ci2'), data: fakeData(LOOT) })
    });
    await waitFor(() => {
      expect(scroll).toHaveBeenCalledTimes(1);
    });
    await userEvent.type(screen.getByPlaceholderText('Поиск'), 'а');
    expect(scroll).toHaveBeenCalledTimes(1);
  });

  it('clears a flash in flight when a route change drops the anchor', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    const env = fakeEnv({
      router: memoryRouter('#/tables/core_item/ci2'),
      data: fakeData(LOOT)
    });
    render(App, { env });
    await waitFor(() => {
      expect(document.querySelector('[data-row="ci2"]')).toHaveClass('flash');
    });
    /* A different table under 1.6s carries no anchor of its own, and the
       alternate tables share ids across tables (`ci*`/`q*`): without the
       clear, the stale class would light whatever row on the new table
       happens to carry the same id. A real address-bar click cannot be
       used here - `Chip`'s `<a href>` relies on a browser's own
       hashchange, which `memoryRouter` does not fire - so the fake
       router is driven directly, the file's own pattern (see "belongs
       to the table it was made on: a hash change drops it"). */
    env.router.navigate('#/tables/hnf_item', 'ru');
    await tick();
    expect(document.querySelector('.flash')).not.toBeInTheDocument();
  });
});

describe('a dataset that did not load', () => {
  it('says so rather than drawing an empty table', () => {
    render(App, { env: fakeEnv({ router: memoryRouter('#/tables'), data: noData() }) });
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
  });
});

describe('the head below 761 px', () => {
  const narrow = (over: Partial<Env> = {}): Env =>
    fakeEnv({
      router: memoryRouter('#/tables/eq_weapon'),
      data: fakeData(LOOT),
      viewport: fakeViewport('narrow'),
      ...over
    });

  it('reads the page name, draws the picker, the view switch and «Ещё», and no column', async () => {
    const { container } = render(App, { env: narrow() });
    expect(screen.getByRole('heading', { level: 1, name: 'Таблицы' })).toHaveClass('vh');
    expect(screen.getByRole('button', { name: 'Таблица: Оружие' })).toHaveTextContent('Оружие');
    expect(screen.getByRole('button', { name: 'Список' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ещё' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Открывать при запуске' })).toBeNull();
    expect(screen.queryByRole('complementary', { name: 'Фильтры' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Фильтры' })).toBeInTheDocument();
    expect(document.querySelector('.page-sub')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('names the book in the picker where the caption alone names none', () => {
    render(App, { env: narrow({ router: memoryRouter('#/tables/core_item') }) });
    expect(
      screen.getByRole('button', { name: 'Таблица: Core · Предметы' })
    ).toBeInTheDocument();
  });

  it("reaches another group's table in three taps through the picker sheet", async () => {
    const env = narrow();
    render(App, { env });
    await userEvent.click(screen.getByRole('button', { name: 'Таблица: Оружие' }));
    const sheet = within(screen.getByRole('dialog', { name: 'Таблица: Оружие' }));
    expect(sheet.getByRole('group', { name: 'Группа' })).toBeInTheDocument();
    expect(sheet.getByRole('link', { name: 'Оружие' })).toHaveAttribute('aria-current', 'page');
    await expectNoA11yViolations(document.body);
    await userEvent.click(sheet.getByRole('button', { name: 'Hope & Fear' }));
    const link = sheet.getByRole('link', { name: 'Расходники' });
    expect(link).toHaveAttribute('href', '/tables/hope_and_fear_consumable');
    await userEvent.click(link);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('holds the table link, the pin and «Об этих данных» in «Ещё»', async () => {
    const clip = fakeClipboard();
    const { container } = render(App, { env: narrow({ clipboard: clip }) });
    await userEvent.click(screen.getByRole('button', { name: 'Ещё' }));
    const items = screen.getAllByRole('menuitem').map((m) => m.textContent);
    expect(items).toEqual(['Ссылка на таблицу', 'Открывать при запуске', 'Об этих данных']);
    await expectNoA11yViolations(container);
    const more = screen.getByRole('button', { name: 'Ещё' });
    await userEvent.click(screen.getByRole('menuitem', { name: 'Ссылка на таблицу' }));
    expect(clip.last.text).toBe('https://example.test/tables/eq_weapon');
    expect(more).toHaveFocus();
    await userEvent.click(more);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Открывать при запуске' }));
    expect(
      screen.getByText('Приложение будет открываться на этом разделе')
    ).toBeInTheDocument();
    expect(more).toHaveFocus();
    await userEvent.click(more);
    expect(
      screen.getByRole('menuitem', { name: 'Открывается при запуске' })
    ).toBeInTheDocument();
    const about = screen.getByRole('menuitem', { name: 'Об этих данных' });
    expect(about.querySelector('svg')).not.toBeNull();
    await userEvent.click(about);
    expect(screen.getByText(/Класс - раздел книги, а не тип урона/)).toBeInTheDocument();
    expect(more).toHaveFocus();
  });

  it('marks «Об этих данных» open in «Ещё», and closes its panel with «Закрыть»', async () => {
    const { container } = render(App, { env: narrow() });
    const more = screen.getByRole('button', { name: 'Ещё' });
    await userEvent.click(more);
    const closed = screen.getByRole('menuitem', { name: 'Об этих данных' });
    expect(closed).toHaveAttribute('aria-expanded', 'false');
    const helpPath = closed.querySelector('svg path')?.getAttribute('d');
    await userEvent.click(closed);
    const panel = screen.getByText(/Класс - раздел книги, а не тип урона/).closest('.helpbox');
    expect(panel).not.toBeNull();
    await userEvent.click(more);
    const open = screen.getByRole('menuitem', { name: 'Об этих данных' });
    expect(open).toHaveAttribute('aria-expanded', 'true');
    expect(open.querySelector('svg path')?.getAttribute('d')).not.toBe(helpPath);
    await expectNoA11yViolations(container);
    await userEvent.keyboard('{Escape}');
    await userEvent.click(
      within(panel as HTMLElement).getByRole('button', { name: 'Закрыть' })
    );
    expect(screen.queryByText(/Класс - раздел книги, а не тип урона/)).toBeNull();
    expect(more).toHaveFocus();
  });

  it('closes «Ещё» for good on a band change, and places the focus', async () => {
    const viewport = fakeViewport('narrow');
    render(App, { env: narrow({ viewport }) });
    await userEvent.click(screen.getByRole('button', { name: 'Ещё' }));
    viewport.set('mid');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Фильтры' })).toHaveFocus();
    });
    viewport.set('narrow');
    await tick();
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.getByRole('button', { name: 'Ещё' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('closes the picker for good on a band change, and places the focus', async () => {
    const viewport = fakeViewport('narrow');
    render(App, { env: narrow({ viewport }) });
    await userEvent.click(screen.getByRole('button', { name: 'Таблица: Оружие' }));
    viewport.set('mid');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Фильтры' })).toHaveFocus();
    });
    viewport.set('narrow');
    await tick();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes the filter sheet for good when the column takes over, and focuses its «Все»', async () => {
    const viewport = fakeViewport('mid');
    render(App, { env: narrow({ viewport }) });
    await userEvent.click(screen.getByRole('button', { name: 'Фильтры' }));
    viewport.set('wide');
    const column = await screen.findByRole('complementary', { name: 'Фильтры' });
    await waitFor(() => {
      expect(within(column).getAllByRole('button', { name: 'Все' })[0]).toHaveFocus();
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    viewport.set('mid');
    await tick();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('keeps the filter sheet open between the two bands that draw it', async () => {
    const viewport = fakeViewport('mid');
    render(App, { env: narrow({ viewport }) });
    await userEvent.click(screen.getByRole('button', { name: 'Фильтры' }));
    viewport.set('narrow');
    await tick();
    expect(screen.getByRole('dialog', { name: 'Фильтры' })).toBeInTheDocument();
  });

  it('draws «Свои предметы» once at the mid band: in the search row, not in the sheet', async () => {
    render(App, {
      env: narrow({ viewport: fakeViewport('mid'), cloud: fakeCloud(SEED, 'gm1') })
    });
    await screen.findByRole('switch', { name: 'Свои предметы' });
    await userEvent.click(screen.getByRole('button', { name: 'Фильтры' }));
    const sheet = within(screen.getByRole('dialog', { name: 'Фильтры' }));
    expect(sheet.queryByRole('switch')).toBeNull();
  });

  it('draws no table link in «Ещё» on the own items table (rule 17)', async () => {
    render(App, {
      env: narrow({ router: memoryRouter('#/tables/homebrew'), cloud: fakeCloud(SEED, 'gm1') })
    });
    await userEvent.click(screen.getByRole('button', { name: 'Ещё' }));
    expect(screen.queryByRole('menuitem', { name: 'Ссылка на таблицу' })).toBeNull();
  });
});

describe('the own items table at scale', () => {
  it('draws 300 own items, and «Все» ticks the rows a search leaves', async () => {
    const env = fakeEnv({
      router: memoryRouter('#/tables/homebrew'),
      data: fakeData(LOOT),
      cloud: fakeCloud(SEED, 'gm1', { fillItems: 300 })
    });
    const { container } = render(App, { env });
    await waitFor(() => {
      /* The first source tab holds the most of the 300. */
      expect(container.querySelectorAll('[data-row]').length).toBeGreaterThan(100);
    });
    await userEvent.type(screen.getByPlaceholderText('Поиск'), '001');
    const left = container.querySelectorAll('[data-row]').length;
    expect(left).toBeLessThan(100);
    await userEvent.click(screen.getByRole('button', { name: 'Выбрать' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
    expect(container.parentElement?.querySelector('.selcount')).toHaveTextContent(
      `Выбрано: ${String(left)}`
    );
  });
});

describe('the help', () => {
  it('is «Об этих данных», the three data notes, named on its button', async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Об этих данных' }));
    expect(screen.getByText(/Класс - раздел книги, а не тип урона/)).toBeInTheDocument();
    expect(screen.queryByText(/срезы через все книги сразу/)).toBeNull();
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

describe("a row with the author's own relations", () => {
  it('draws no relation line and no Core tag: the dialog holds them', async () => {
    const REAL = readLoot();
    const names = Array.from(
      { length: 15 },
      (_, i) => `Зелье ${String.fromCharCode(1103 - i)}`
    );
    const own = names.map((ru, i) =>
      recordOf(
        'hb_potion' + String.fromCharCode(97 + i) + 'aaaaaaaaa',
        { kind: 'item', ru, craft_from: ['ci18'] },
        null
      )
    );
    const index = withRecords(buildIndex(REAL), own, []);
    const it = index.byId.get('ci18');
    if (!it) throw new Error('The catalog lacks ci18');
    const { container } = render(RowMain, {
      props: {
        it,
        lang: 'ru',
        artBroken: () => false,
        onartfail: () => {},
        onopen: () => {}
      }
    });
    expect(container.querySelector('.rcraft')).toBeNull();
    expect(container.textContent).not.toContain(dict('ru').craftInto);
    expect(container.textContent).not.toContain('Зелье я');
    expect(container.querySelector('.badge.src')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it("draws an own picture's 160 px file on a row, and the placeholder once it failed", () => {
    const img = `p/${'b'.repeat(32)}.webp`;
    const it = recordOf(
      'hb_lanternaaaaaaaaa',
      { kind: 'item', ru: 'Фонарь' },
      null,
      [],
      'id',
      img
    );
    const props = {
      it,
      lang: 'ru' as const,
      onartfail: () => {},
      onopen: () => {}
    };
    const drawn = render(RowMain, { props: { ...props, artBroken: () => false } });
    expect(drawn.container.querySelector('img')?.getAttribute('src')).toBe(
      ART_BASE + `t/${'b'.repeat(32)}.webp`
    );
    drawn.unmount();
    const broken = render(RowMain, { props: { ...props, artBroken: () => true } });
    expect(broken.container.querySelector('img')).toBeNull();
    expect(broken.container.querySelector('.ra svg')).not.toBeNull();
  });

  it('names a GM-only entry for a screen reader after the name and dims its art, with no visible text', async () => {
    const REAL = readLoot();
    const index = buildIndex(REAL);
    const it = index.byId.get('ci18');
    if (!it) throw new Error('The catalog lacks ci18');
    const props = {
      it,
      lang: 'ru' as const,
      artBroken: () => false,
      onartfail: () => {},
      onopen: () => {}
    };
    const marked = render(RowMain, { props: { ...props, gmOnly: true } });
    const button = marked.container.querySelector('.row-main');
    expect(button?.textContent).toContain(`${it.ru}, Только для мастера`);
    expect(marked.container.querySelector('.ra')?.classList.contains('gm')).toBe(true);
    /* The words sit only in the visually hidden span (its rule is RowMain.svelte's
       `.gmstate`; tests/app/states.js case 69 proves its box is at most 1x1 px). */
    const holders = [...marked.container.querySelectorAll('*')].filter(
      (el) => el.children.length === 0 && el.textContent.includes('Только для мастера')
    );
    expect(holders.map((el) => el.classList.contains('gmstate'))).toEqual([true]);
    await expectNoA11yViolations(marked.container);
    marked.unmount();

    const plain = render(RowMain, { props });
    expect(plain.container.querySelector('.row-main')?.textContent).not.toContain(
      'Только для мастера'
    );
    expect(plain.container.querySelector('.ra')?.classList.contains('gm')).toBe(false);
    await expectNoA11yViolations(plain.container);
  });
});
