/* Search, `#/search` - reproduced from `renderSearch` in app.js.
 *
 * Held against a small fixture rather than the real catalogue, the same way
 * tables.test.ts is: what matters here is the shape (both languages at once,
 * the cap, the kind filter shared with the roll pages) rather than any
 * particular record. */

import { cleanup, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App.svelte';
import { fakeEnv, fakeData, memoryRouter, noData } from '../ports/index.js';
import type { Env } from '../ports/index.js';
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

/* Two records share "Ветра" in Russian and "Wind" in English - one item, one
 * consumable, so the kind chips have something to narrow. `ci2` shares
 * nothing with either word, in either language, but carries a stat block
 * whose range word ("Вплотную") is on no record as text - only the assembled
 * line finds it. `ci1` and `hi1` are unrelated filler, enough for the kind
 * filter to leave something behind when a chip goes off. */
const LOOT: Loot = {
  items: {
    wondrous: [
      row({ id: 'w1', src: 'wondrous', roll: 1, ru: 'Плащ Ветра', en: 'Wind Cloak' }),
      row({
        id: 'w2',
        src: 'wondrous',
        kind: 'consumable',
        roll: 2,
        ru: 'Сапоги Ветра',
        en: 'Wind Boots'
      })
    ],
    core_item: [
      row({ id: 'ci1', roll: 1, ru: 'Кольцо Тишины', en: 'Silence Ring' }),
      row({
        id: 'ci2',
        ru: 'Клинок Эха',
        en: 'Echo Blade',
        eq: {
          t: 'weapon',
          tier: 1,
          cls: 'phy',
          tr: 'strength',
          rg: 'melee',
          dmg: 'd8',
          dt: 'phy'
        }
      })
    ],
    core_consumable: [
      row({ id: 'cc1', kind: 'consumable', roll: 1, ru: 'Зелье', en: 'Potion' })
    ],
    hnf_item: [row({ id: 'hi1', src: 'hnf', roll: 1, ru: 'Предмет H&F', en: 'H&F Thing' })]
  },
  eq: [],
  refs: {}
};

const at = (over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter('#/search'), data: fakeData(LOOT), ...over });

const type = (text: string): Promise<void> =>
  userEvent.type(screen.getByPlaceholderText('Поиск по названию или описанию…'), text);

describe('arrival', () => {
  it('draws the head, the focused box and the hint - no results, no help button', () => {
    render(App, { env: at() });
    expect(screen.getByRole('heading', { name: 'Поиск' })).toBeInTheDocument();
    expect(screen.getByText(/Поиск по всем 1061 позиции сразу/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Как это работает' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Открывать этот раздел/ })).toBeInTheDocument();

    const box = screen.getByPlaceholderText('Поиск по названию или описанию…');
    expect(box).toHaveFocus();

    expect(screen.getByText('Начните вводить запрос')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Выбрать все/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Плащ|Кольцо|Клинок/ })
    ).not.toBeInTheDocument();

    for (const label of ['Предметы', 'Расходники', 'Снаряжение']) {
      const chip = screen.getByRole('button', { name: label });
      expect(chip).toHaveAttribute('aria-pressed', 'true');
      expect(chip).not.toHaveAttribute('title');
    }
  });
});

describe('a query narrows, in catalogue order', () => {
  it('finds both records sharing the Russian word', async () => {
    render(App, { env: at() });
    await type('Ветра');
    const rows = screen.getAllByRole('button', { name: /Ветра/ });
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringContaining('Плащ Ветра'),
      expect.stringContaining('Сапоги Ветра')
    ]);
    expect(screen.getByRole('checkbox', { name: 'Выбрать все (2)' })).toBeInTheDocument();
    expect(screen.queryByText('Начните вводить запрос')).not.toBeInTheDocument();
  });
});

describe('both languages at once', () => {
  it('finds the same two by the English word, while the page is in Russian', async () => {
    render(App, { env: at() });
    await type('Wind');
    expect(screen.getAllByRole('button', { name: /Ветра/ })).toHaveLength(2);
  });
});

describe('the stat line', () => {
  it('finds the equipment record by its assembled range word, and nothing else', async () => {
    render(App, { env: at() });
    await type('Вплотную');
    expect(screen.getByRole('button', { name: /Клинок Эха/ })).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox', { name: 'Выбрано' })).toHaveLength(1);
  });
});

describe('nothing found', () => {
  it('says so, with no reset button of its own', async () => {
    render(App, { env: at() });
    await type('zzz');
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Выбрать все/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Сбросить всё' })).not.toBeInTheDocument();
  });
});

describe('the cap', () => {
  it('shows the first 300 matches, and select-all ticks all 300', async () => {
    const many: Loot = {
      items: {
        core_item: Array.from({ length: 305 }, (_, i) =>
          row({
            id: `m${String(i)}`,
            roll: i + 1,
            ru: `Много ${String(i)}`,
            en: `Many ${String(i)}`
          })
        )
      },
      eq: [],
      refs: {}
    };
    render(App, { env: fakeEnv({ router: memoryRouter('#/search'), data: fakeData(many) }) });
    /* Typed character by character, 305 rows would re-render on every
       keystroke; a paste lands the whole query in one `input` event. */
    const box = screen.getByPlaceholderText('Поиск по названию или описанию…');
    await userEvent.click(box);
    await userEvent.paste('Много');
    expect(screen.getAllByRole('button', { name: /Много/ })).toHaveLength(300);
    expect(screen.getByRole('checkbox', { name: 'Выбрать все (300)' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все (300)' }));
    expect(screen.getByText('Выбрано 300')).toBeInTheDocument();
  });
});

describe('the kind filter narrows', () => {
  it('drops the consumable, then drops the rest with equipment still on', async () => {
    render(App, { env: at() });
    await type('Ветра');
    const consChip = screen.getByRole('button', { name: 'Расходники' });
    await userEvent.click(consChip);
    expect(screen.getAllByRole('button', { name: /Ветра/ })).toHaveLength(1);
    expect(consChip).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(screen.getByRole('button', { name: 'Предметы' }));
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
  });
});

describe('the last kind is refused', () => {
  it('keeps the last one on, and titles it why', async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Расходники' }));
    await userEvent.click(screen.getByRole('button', { name: 'Снаряжение' }));
    const itemsChip = screen.getByRole('button', { name: 'Предметы' });
    await userEvent.click(itemsChip);
    expect(screen.getByText('Нужен хотя бы один тип')).toBeInTheDocument();
    expect(itemsChip).toHaveAttribute('aria-pressed', 'true');
    expect(itemsChip).toHaveAttribute('title', 'Нужен хотя бы один тип');
  });
});

describe('equipment obeys the equipment chip whatever its own kind says', () => {
  it('is gone from a query that found it once Снаряжение is off', async () => {
    render(App, { env: at() });
    await type('Эха');
    expect(screen.getByRole('button', { name: /Клинок Эха/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Снаряжение' }));
    expect(screen.queryByRole('button', { name: /Клинок Эха/ })).not.toBeInTheDocument();
  });
});

describe('the filter is shared across pages', () => {
  it('carries a switched-off kind to Core rules, and resets on a fresh app', async () => {
    const env = at();
    render(App, { env });
    await userEvent.click(screen.getByRole('button', { name: 'Расходники' }));
    env.router.navigate('#/roll/std');
    expect(screen.getByRole('button', { name: 'Расходники' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    cleanup();

    render(App, { env: fakeEnv({ router: memoryRouter('#/roll/std'), data: fakeData(LOOT) }) });
    expect(screen.getByRole('button', { name: 'Расходники' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});

describe('selection', () => {
  it('ticks a row and raises the bar; a navigation drops it', async () => {
    const env = at();
    const { container } = render(App, { env });
    await type('Ветра');
    await userEvent.click(
      screen.getAllByRole('checkbox', { name: 'Выбрано' })[0] as HTMLElement
    );
    expect(container.querySelector('.selcount')).toHaveTextContent('Выбрано 1');
    env.router.navigate('#/tables');
    await tick();
    expect(container.querySelector('.selcount')).not.toBeInTheDocument();
  });
});

describe('a row opened', () => {
  it('opens the record in the shared modal, closed by its own button', async () => {
    render(App, { env: at() });
    await type('Ветра');
    await userEvent.click(screen.getByRole('button', { name: /Плащ Ветра/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Плащ Ветра')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('no data', () => {
  it('says so, and draws no search box', () => {
    render(App, { env: fakeEnv({ router: memoryRouter('#/search'), data: noData() }) });
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Поиск по названию или описанию…')
    ).not.toBeInTheDocument();
  });
});

describe('English', () => {
  it('draws the English head, chips and hint', async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('heading', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByText(/Search all 1061 entries at once/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name or description…')).toBeInTheDocument();
    expect(screen.getByText('Start typing')).toBeInTheDocument();
    for (const label of ['Items', 'Consumables', 'Equipment']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    await userEvent.type(screen.getByPlaceholderText('Search by name or description…'), 'Wind');
    expect(screen.getByRole('checkbox', { name: 'Select all (2)' })).toBeInTheDocument();
    await userEvent.clear(screen.getByPlaceholderText('Search by name or description…'));
    await userEvent.type(screen.getByPlaceholderText('Search by name or description…'), 'zzz');
    expect(screen.getByText('Nothing found')).toBeInTheDocument();
  });
});

describe('axe', () => {
  it('has no violations on arrival', async () => {
    const { container } = render(App, { env: at() });
    await expectNoA11yViolations(container);
  });

  it('has no violations with results and a row ticked', async () => {
    const { container } = render(App, { env: at() });
    await type('Ветра');
    await userEvent.click(
      screen.getAllByRole('checkbox', { name: 'Выбрано' })[0] as HTMLElement
    );
    await expectNoA11yViolations(container);
  });

  it('has no violations on the nothing-found page', async () => {
    const { container } = render(App, { env: at() });
    await type('zzz');
    await expectNoA11yViolations(container);
  });
});
