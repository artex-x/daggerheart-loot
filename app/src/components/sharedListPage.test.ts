/* The shared page, `#/l/<payload>` for a payload that is nobody's own list -
 * off `renderSharedList` (app.js 3130-3170), read in `plan.md`, "B5.6
 * planned". Through `App`, the way `listPage.test.ts` reaches the index. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App.svelte';
import type { Loot } from '../lib/data.js';
import { encodeList } from '../lib/listLink.js';
import { priceText } from '../lib/money.js';
import type { StoredList } from '../lib/lists.js';
import { fakeData, fakeEnv, memoryRouter, memoryStorage } from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

Element.prototype.scrollIntoView = () => {};

interface Fixture {
  list: { id: string; name: string; ids: string[] };
  player: { payload: string };
  gm: { payload: string };
}

const DIR = join(import.meta.dirname, '..', '..', '..', 'docs', 'fixtures', 'lists');
const readFixture = (name: string): Fixture =>
  JSON.parse(readFileSync(join(DIR, name), 'utf8')) as Fixture;

const NOTES_BOTH_KINDS = readFixture('notes-both-kinds.json');
const QTY_AND_PRICE = readFixture('qty-and-price.json');
const MONEY_COIN_MODE = readFixture('money-coin-mode.json');

/* Four plain records, known by id - names are what the assertions read, not
   the source book. */
const LOOT: Loot = {
  items: {
    core_item: [
      {
        id: 'ci1',
        src: 'core',
        kind: 'item',
        roll: 1,
        en: 'Bedroll',
        ende: '',
        ru: 'Спальный мешок',
        rud: ''
      }
    ],
    core_consumable: [
      {
        id: 'cc1',
        src: 'core',
        kind: 'consumable',
        roll: 1,
        en: 'Potion',
        ende: '',
        ru: 'Зелье',
        rud: ''
      },
      {
        id: 'cc21',
        src: 'core',
        kind: 'consumable',
        roll: 21,
        en: 'Rage elixir',
        ende: '',
        ru: 'Эликсир ярости',
        rud: ''
      }
    ]
  },
  eq: [
    {
      id: 'q337',
      src: 'core',
      kind: 'item',
      en: 'Guard blade',
      ende: '',
      ru: 'Клинок стража',
      rud: '',
      eq: { t: 'weapon', tier: 1, cls: 'phy', bu: 1 }
    }
  ],
  refs: {}
};

const TWO: StoredList[] = [
  { id: 'a', name: 'Клад дракона', ids: [], created: 1 },
  { id: 'b', name: 'Лавка в порту', ids: [], created: 2 }
];

const at = (hash: string, over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter(hash), data: fakeData(LOOT), ...over });

const withTwo = (hash: string, over: Partial<Env> = {}): Env =>
  at(hash, { storage: memoryStorage({ 'dhloot.lists.v2': JSON.stringify(TWO) }), ...over });

/** Every row's own tick checkbox, in document order - P2 named each one
 *  after its own record instead of the generic "Выбрано", so the group is
 *  found by elimination: every checkbox except select-all's own (which
 *  keeps a name, "Выбрать все (N)", from its wrapping `<label>`). */
const rowCheckboxes = (): HTMLElement[] =>
  screen.getAllByRole('checkbox').filter((cb) => !cb.closest('.selall'));

const readLists = (storage: { get: (k: string) => string | null }): StoredList[] =>
  JSON.parse(storage.get('dhloot.lists.v2') ?? '[]') as StoredList[];

describe('heading and sub', () => {
  it('draws the name, the sub as one text node, the add button and a way to select every row (P8)', () => {
    const { container } = render(App, {
      env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload)
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Тайник' })).toBeInTheDocument();

    const sub = container.querySelector('.page-sub');
    expect(sub).toHaveTextContent('Список от другого игрока · 2 позиции');
    expect(sub?.childNodes).toHaveLength(1);

    expect(screen.getByRole('button', { name: 'Добавить в список' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    /* P8, paid off: printing a shared list used to mean ticking every row by
       hand - `ontoggleall` now reaches the shared `AppState.toggleAllIn`,
       the same one the tables and search pages already used. */
    expect(screen.getByRole('checkbox', { name: 'Выбрать все (2)' })).toBeInTheDocument();
    expect(container.querySelector('.selbarwrap')).not.toBeInTheDocument();
  });

  it('ticks every row from select-all (P8)', async () => {
    render(App, { env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload) });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все (2)' }));
    expect(screen.getByText('Выбрано 2')).toBeInTheDocument();
  });
});

describe('a dropped entry (P9)', () => {
  it('toasts the count once, without hiding the rows that did survive', () => {
    const payload = encodeList({ name: 'X', ids: ['ci1', 'nope999'] }, true);
    render(App, { env: at('#/l/' + payload) });
    expect(
      screen.getByText('Пропущено позиций: 1 — их больше нет в данных')
    ).toBeInTheDocument();
    expect(screen.getByText('Спальный мешок')).toBeInTheDocument();
  });
});

describe('untitled', () => {
  it('falls back to "Без названия" for a nameless list', () => {
    const payload = encodeList({ name: '', ids: ['ci1'] }, true);
    render(App, { env: at('#/l/' + payload) });
    expect(screen.getByRole('heading', { level: 1, name: 'Без названия' })).toBeInTheDocument();
  });
});

describe('the notes', () => {
  it('draws both list notes above the rows, and each entry’s own after its row', () => {
    const { container } = render(App, {
      env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload)
    });
    const notes = container.querySelectorAll('.hitnote');
    expect(notes[0]).toHaveTextContent('Для игроков');
    expect(notes[0]).toHaveTextContent('Лавка закрыта до утра');
    expect(notes[1]).toHaveTextContent('Только для мастера');
    expect(notes[1]).toHaveTextContent('Хозяин - контрабандист');

    const ci1Row = container.querySelector('[data-row="ci1"]');
    const afterA = ci1Row?.nextElementSibling;
    const afterB = afterA?.nextElementSibling;
    expect(afterA).toHaveClass('hitnote');
    expect(afterA).toHaveTextContent('Видно игрокам');
    expect(afterB).toHaveClass('hitnote');
    expect(afterB).toHaveTextContent('Подделка');

    const cc1Row = container.querySelector('[data-row="cc1"]');
    expect(afterB?.nextElementSibling).toBe(cc1Row);
  });

  it('renders a newline in a note as a line break', () => {
    const payload = encodeList({ name: 'X', ids: ['ci1'], note: 'Первая\nВторая' }, true);
    const { container } = render(App, { env: at('#/l/' + payload) });
    const note = container.querySelector('.hitnote');
    expect(note?.querySelector('br')).toBeInTheDocument();
    expect(note).toHaveTextContent('ПерваяВторая');
  });
});

describe('the tails', () => {
  it('reads a bare quantity, a quantity with a price, and a bare price', () => {
    const { container } = render(App, {
      env: at('#/l/' + QTY_AND_PRICE.player.payload)
    });
    expect(container.querySelector('[data-row="ci1"] .rtail')).toHaveTextContent('×2');
    expect(container.querySelector('[data-row="cc21"] .rtail')).toHaveTextContent(
      '×5 · ' + priceText(50, 'bag', 'ru')
    );
    expect(container.querySelector('[data-row="q337"] .rtail')).toHaveTextContent(
      priceText(12, 'bag', 'ru')
    );
  });

  it('draws no tail at all on a payload with no qty or price', () => {
    const { container } = render(App, {
      env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload)
    });
    expect(container.querySelectorAll('.rtail')).toHaveLength(0);
  });

  it('reads coin mode when the payload carries it', () => {
    const { container } = render(App, {
      env: at('#/l/' + MONEY_COIN_MODE.player.payload)
    });
    expect(container.querySelector('[data-row="ci1"] .rtail')).toHaveTextContent(
      priceText(750, 'coin', 'ru')
    );
  });
});

describe('selection', () => {
  it('ticks a row and raises the bar; a second tick clears both', async () => {
    const { container } = render(App, {
      env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload)
    });
    const box = rowCheckboxes()[0] as HTMLElement;
    await userEvent.click(box);

    expect(container.querySelector('[data-row="ci1"]')).toHaveClass('sel');
    expect(container.querySelector('.selcount')).toHaveTextContent('Выбрано 1');

    await userEvent.click(box);
    expect(container.querySelector('[data-row="ci1"]')).not.toHaveClass('sel');
    expect(container.querySelector('.selcount')).not.toBeInTheDocument();
  });
});

describe('adding to an existing list', () => {
  it('the bar carries the shared meta for a ticked entry', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify(TWO) });
    render(App, { env: at('#/l/' + QTY_AND_PRICE.player.payload, { storage }) });

    const rowCheckbox = document
      .querySelector('[data-row="cc21"]')
      ?.querySelector('input[type="checkbox"]') as HTMLElement;
    await userEvent.click(rowCheckbox);

    const bar = document.querySelector('.selbarwrap') as HTMLElement;
    await userEvent.click(within(bar).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(within(bar).getByRole('button', { name: 'Клад дракона' }));

    const [a, b] = readLists(storage);
    expect(a).toMatchObject({ ids: ['cc21'], meta: { cc21: { qty: 5, gold: 50 } } });
    expect(b?.ids).toEqual([]);
  });

  it('a chip pours the whole list with its meta, no note or hnote', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify(TWO) });
    render(App, { env: at('#/l/' + QTY_AND_PRICE.player.payload, { storage }) });

    const cardActs = document.querySelector('.card-acts') as HTMLElement;
    await userEvent.click(within(cardActs).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(within(cardActs).getByRole('button', { name: 'Клад дракона' }));

    const [a] = readLists(storage);
    expect(a?.ids).toEqual(['ci1', 'cc21', 'q337']);
    expect(a?.meta).toEqual({
      ci1: { qty: 2 },
      cc21: { qty: 5, gold: 50 },
      q337: { gold: 12 }
    });
    expect(a?.note).toBeUndefined();
    expect(a?.hnote).toBeUndefined();
    expect(screen.getByText('Добавлено в «Клад дракона»: 3')).toBeInTheDocument();
    /* The chip poured the list without closing the menu it came from. */
    expect(within(cardActs).getByRole('button', { name: 'Добавить в список' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('leaves the GM’s own note behind', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify(TWO) });
    render(App, { env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload, { storage }) });

    const cardActs = document.querySelector('.card-acts') as HTMLElement;
    await userEvent.click(within(cardActs).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(within(cardActs).getByRole('button', { name: 'Клад дракона' }));

    const [a] = readLists(storage);
    expect(a?.meta).toEqual({ ci1: { note: 'Видно игрокам' } });
    expect(a?.note).toBeUndefined();
    expect(a?.hnote).toBeUndefined();
  });
});

describe('taking the whole list', () => {
  it('creates a new list with the name, ids, both notes and the entry meta', async () => {
    const storage = memoryStorage();
    const router = memoryRouter('#/l/' + NOTES_BOTH_KINDS.gm.payload);
    render(App, { env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload, { storage, router }) });

    const cardActs = document.querySelector('.card-acts') as HTMLElement;
    await userEvent.click(within(cardActs).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(within(cardActs).getByRole('button', { name: '+ Новый список' }));

    const input = screen.getByPlaceholderText('Например: клад дракона');
    expect(input).toHaveValue('Тайник');
    expect(input).toHaveFocus();

    await userEvent.click(within(cardActs).getByRole('button', { name: 'Создать' }));

    const [l] = readLists(storage);
    expect(l).toMatchObject({
      name: 'Тайник',
      ids: ['ci1', 'cc1'],
      note: 'Лавка закрыта до утра',
      hnote: 'Хозяин - контрабандист',
      meta: { ci1: { note: 'Видно игрокам', hnote: 'Подделка' } }
    });
    expect(screen.getByText('Добавлено в «Тайник»')).toBeInTheDocument();
    expect(router.hash()).toBe('#/l/' + NOTES_BOTH_KINDS.player.payload);

    /* The own list page now, not the shared one - a title input, no
       "Список от другого игрока". */
    expect(screen.getByRole('textbox', { name: 'Название списка' })).toHaveValue('Тайник');
    expect(screen.queryByText('Список от другого игрока')).not.toBeInTheDocument();
  });

  it('refuses a blank name', async () => {
    const storage = memoryStorage();
    render(App, { env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload, { storage }) });

    const cardActs = document.querySelector('.card-acts') as HTMLElement;
    await userEvent.click(within(cardActs).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(within(cardActs).getByRole('button', { name: '+ Новый список' }));

    const input = screen.getByPlaceholderText('Например: клад дракона');
    await userEvent.clear(input);
    await userEvent.click(within(cardActs).getByRole('button', { name: 'Создать' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Сначала назовите список');
    expect(readLists(storage)).toHaveLength(0);
    expect(screen.getByPlaceholderText('Например: клад дракона')).toBeInTheDocument();
  });
});

describe('a row opened', () => {
  it('opens the record over the page', async () => {
    render(App, { env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload) });
    await userEvent.click(screen.getByRole('button', { name: /Спальный мешок/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Спальный мешок')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Закрыть' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('the bad link', () => {
  it('draws "Предмет не найден", the sub and the home button, with no add control', () => {
    render(App, { env: at('#/l/zzzz') });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Предмет не найден' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Ссылка повреждена или собрана в другой версии данных.')
    ).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'На главную' });
    expect(link).toHaveAttribute('href', '#/roll/std');
    expect(screen.queryByRole('button', { name: 'Добавить в список' })).not.toBeInTheDocument();
  });
});

describe('English', () => {
  it('reads the sub, the note labels and the add button in English', async () => {
    render(App, { env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload) });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(screen.getByText('A list from another player · 2 items')).toBeInTheDocument();
    /* The list note and ci1's own entry note both carry the label. */
    expect(screen.getAllByText('For players').length).toBeGreaterThan(0);
    expect(screen.getAllByText('GM only').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Add to list' })).toBeInTheDocument();
  });
});

describe('accessibility', () => {
  it('has no violations on the noted page as drawn', async () => {
    const { container } = render(App, {
      env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload)
    });
    await expectNoA11yViolations(container);
  });

  it('has no violations on the bad-link page', async () => {
    const { container } = render(App, { env: at('#/l/zzzz') });
    await expectNoA11yViolations(container);
  });

  it('has no violations with the menu open and the new-list form showing', async () => {
    const { container } = render(App, {
      env: withTwo('#/l/' + NOTES_BOTH_KINDS.gm.payload)
    });
    const cardActs = document.querySelector('.card-acts') as HTMLElement;
    await userEvent.click(within(cardActs).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(within(cardActs).getByRole('button', { name: '+ Новый список' }));
    await expectNoA11yViolations(container);
  });

  it('has no violations with a row ticked and the bar showing', async () => {
    const { container } = render(App, {
      env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload)
    });
    const box = rowCheckboxes()[0] as HTMLElement;
    await userEvent.click(box);
    await expectNoA11yViolations(container);
  });
});
