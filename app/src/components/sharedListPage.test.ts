/* The shared page, `#/l/<payload>` for a payload that is nobody's own list -
 * off `renderSharedList` (app.js 3130-3170). Through `App`, the way
 * `listPage.test.ts` reaches the index. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App.svelte';
import type { Loot } from '../lib/data.js';
import { buildIndex } from '../lib/data.js';
import { dict } from '../lib/dict.js';
import { encodeList, toBase64Url } from '../lib/listLink.js';
import { priceText } from '../lib/money.js';
import { plural } from '../lib/plural.js';
import type { StoredList } from '../lib/lists.js';
import { share } from '../lib/share.js';
import {
  fakeClipboard,
  fakeData,
  fakeEnv,
  memoryRouter,
  memoryStorage
} from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
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

/** Every row's own tick checkbox, in document order - each one is named
 *  after its own record instead of the generic "Выбрано", so the group is
 *  found by elimination: every checkbox except select-all's own (which
 *  keeps a name, "Выбрать все (N)", from its wrapping `<label>`). */
const rowCheckboxes = (): HTMLElement[] =>
  screen.getAllByRole('checkbox').filter((cb) => !cb.closest('.selall'));

const readLists = (storage: { get: (k: string) => string | null }): StoredList[] =>
  JSON.parse(storage.get('dhloot.lists.v2') ?? '[]') as StoredList[];

describe('heading and sub', () => {
  it('draws the name, the sub as one text node, the save button and a way to select every row', () => {
    const { container } = render(App, {
      env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload)
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Тайник' })).toBeInTheDocument();

    const sub = container.querySelector('.page-sub');
    expect(sub).toHaveTextContent('Список от другого игрока · 2 позиции');
    expect(sub?.childNodes).toHaveLength(1);

    expect(screen.getByRole('button', { name: 'Сохранить себе' })).not.toHaveAttribute(
      'aria-expanded'
    );
    expect(screen.queryByRole('button', { name: 'Добавить в список' })).not.toBeInTheDocument();
    /* Printing a shared list used to mean ticking every row by
       hand - `ontoggleall` now reaches the shared `AppState.toggleAllIn`,
       the same one the tables and search pages already used. */
    expect(screen.getByRole('checkbox', { name: 'Выбрать все (2)' })).toBeInTheDocument();
    expect(container.querySelector('.selbarwrap')).toHaveClass('idle');
    expect(screen.queryByRole('button', { name: 'Снять выделение' })).not.toBeInTheDocument();
  });

  it('ticks every row from select-all', async () => {
    render(App, { env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload) });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все (2)' }));
    expect(screen.getByText('Выбрано 2 позиции')).toBeInTheDocument();
  });
});

describe('with a row ticked', () => {
  it('shows one add-to-list control, in the bar, and the save button above', async () => {
    const { container } = render(App, {
      env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload)
    });
    const box = rowCheckboxes()[0] as HTMLElement;
    await userEvent.click(box);

    const addButtons = screen.getAllByRole('button', { name: 'Добавить в список' });
    expect(addButtons).toHaveLength(1);
    const bar = container.querySelector('.selbarwrap') as HTMLElement;
    expect(bar).toContainElement(addButtons[0] ?? null);

    const save = screen.getByRole('button', { name: 'Сохранить себе' });
    expect(bar).not.toContainElement(save);
  });
});

describe('a dropped entry (P9)', () => {
  it('toasts the count once, without hiding the rows that did survive', () => {
    const payload = encodeList({ name: 'X', ids: ['ci1', 'nope999'] }, true);
    render(App, { env: at('#/l/' + payload) });
    expect(
      screen.getByText('Пропущено позиций, которых больше нет в данных: 1')
    ).toBeInTheDocument();
    expect(screen.getByText('Спальный мешок')).toBeInTheDocument();
  });
});

describe('every entry gone from the data', () => {
  it('opens as the list with no rows and the dropped-entries toast, not as a damaged link', async () => {
    /* A legacy unstamped payload: no checksum, so it needs no stamp. */
    const payload = toBase64Url('Пропавшее\nzzz1,zzz2');
    const { container } = render(App, { env: at('#/l/' + payload) });
    expect(screen.getByRole('heading', { level: 1, name: 'Пропавшее' })).toBeInTheDocument();
    expect(container.querySelector('.page-sub')).toHaveTextContent(
      'Список от другого игрока · 0 позиций'
    );
    expect(screen.getByRole('button', { name: 'Сохранить себе' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-row]')).toHaveLength(0);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getAllByText(plural(2, dict('ru').droppedItems, 'ru'))).toHaveLength(1);
    expect(screen.queryByText(dict('ru').badShare)).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('saves the empty copy and opens it as an own list, not as a damaged link', async () => {
    const storage = memoryStorage();
    render(App, { env: at('#/l/' + toBase64Url('Пропавшее\nzzz1,zzz2'), { storage }) });
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить себе' }));
    expect(readLists(storage)).toMatchObject([{ name: 'Пропавшее', ids: [] }]);
    expect(screen.getByRole('heading', { level: 1, name: 'Пропавшее' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Сохранить себе' })).not.toBeInTheDocument();
    expect(screen.queryByText(dict('ru').badShare)).not.toBeInTheDocument();
    await expectNoA11yViolations(document.body);
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
  it("draws both list notes above the rows, and each entry's own after its row", () => {
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
    expect(container.querySelector('.selcount')).toHaveTextContent('Выбрана 1 позиция');

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

    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все (3)' }));
    const bar = document.querySelector('.selbarwrap') as HTMLElement;
    await userEvent.click(within(bar).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(within(bar).getByRole('button', { name: 'Клад дракона' }));

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
    expect(within(bar).getByRole('button', { name: 'Добавить в список' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it("leaves the GM's own note behind", async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify(TWO) });
    render(App, { env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload, { storage }) });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все (2)' }));
    const bar = document.querySelector('.selbarwrap') as HTMLElement;
    await userEvent.click(within(bar).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(within(bar).getByRole('button', { name: 'Клад дракона' }));

    const [a] = readLists(storage);
    expect(a?.meta).toEqual({ ci1: { note: 'Видно игрокам' } });
    expect(a?.note).toBeUndefined();
    expect(a?.hnote).toBeUndefined();
  });

  it("the bar's new list carries the shared meta too", async () => {
    const storage = memoryStorage();
    render(App, { env: at('#/l/' + QTY_AND_PRICE.player.payload, { storage }) });

    const rowCheckbox = document
      .querySelector('[data-row="cc21"]')
      ?.querySelector('input[type="checkbox"]') as HTMLElement;
    await userEvent.click(rowCheckbox);

    const bar = document.querySelector('.selbarwrap') as HTMLElement;
    await userEvent.click(within(bar).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(within(bar).getByRole('button', { name: '+ Новый список' }));

    const input = screen.getByPlaceholderText('Например: клад дракона');
    await userEvent.clear(input);
    await userEvent.type(input, 'Сундук');
    await userEvent.click(within(bar).getByRole('button', { name: 'Создать' }));

    const [l] = readLists(storage);
    expect(l).toMatchObject({
      name: 'Сундук',
      ids: ['cc21'],
      meta: { cc21: { qty: 5, gold: 50 } }
    });
  });
});

describe('the taken count and the total', () => {
  /* qty-and-price.json: ci1 x2 unpriced, cc21 x5 at 50, q337 at 12. */
  const tick = async (id: string): Promise<void> => {
    const box = document
      .querySelector(`[data-row="${id}"]`)
      ?.querySelector('input[type="checkbox"]') as HTMLElement;
    await userEvent.click(box);
  };
  const countOf = (name: string): HTMLElement =>
    screen.getByRole('spinbutton', { name: 'Взять: ' + name });
  const setCount = async (name: string, n: string): Promise<void> => {
    const field = countOf(name);
    await userEvent.clear(field);
    await userEvent.type(field, n);
  };
  const tickAllAndTakeTwo = async (): Promise<void> => {
    await tick('ci1');
    await tick('cc21');
    await tick('q337');
    await setCount('Эликсир ярости', '2');
  };

  it('draws a count field at the whole quantity only under a ticked entry over 1', async () => {
    render(App, { env: at('#/l/' + QTY_AND_PRICE.player.payload) });
    expect(screen.queryByRole('spinbutton', { name: /^Взять/ })).not.toBeInTheDocument();

    await tick('ci1');
    expect(countOf('Спальный мешок')).toHaveValue(2);
    await tick('q337');
    expect(screen.getAllByRole('spinbutton', { name: /^Взять/ })).toHaveLength(1);
  });

  it('shows the total beside the selected count, with the unpriced count', async () => {
    const { container } = render(App, { env: at('#/l/' + QTY_AND_PRICE.player.payload) });
    await tick('ci1');
    expect(container.querySelector('.seltotal')).not.toBeInTheDocument();

    await tick('cc21');
    await tick('q337');
    await setCount('Эликсир ярости', '2');
    expect(container.querySelector('.seltotal')).toHaveTextContent(
      'Итого: 1 мешок 1 горсть (без цены: 1)'
    );
  });

  it('draws the take line inside the ticked row, with the stock and the line sum', async () => {
    const { container } = render(App, { env: at('#/l/' + QTY_AND_PRICE.player.payload) });
    await tick('cc21');
    await setCount('Эликсир ярости', '2');
    const line = container.querySelector('[data-row="cc21"] .pickrow');
    expect(line).toHaveTextContent('Взять из 5 = 1 мешок');
    await expectNoA11yViolations(container);
  });

  it('mounts the empty live region before the first tick, so the first tick is announced', async () => {
    const { container } = render(App, { env: at('#/l/' + QTY_AND_PRICE.player.payload) });
    const summ = container.querySelector('.selsumm');
    expect(summ).toHaveAttribute('aria-live', 'polite');
    expect(summ).toBeEmptyDOMElement();
    expect(screen.queryByRole('button', { name: 'Снять выделение' })).not.toBeInTheDocument();

    await tick('ci1');
    expect(container.querySelector('.selsumm')).toBe(summ);
    expect(summ).toHaveTextContent('Выбрана 1 позиция · 2 шт.');
    await expectNoA11yViolations(container);
  });

  it('names entries and pieces apart in a live region, and prints the taken counts', async () => {
    const { container } = render(App, { env: at('#/l/' + QTY_AND_PRICE.player.payload) });
    await tickAllAndTakeTwo();
    const summ = container.querySelector('.selsumm');
    expect(summ).toHaveAttribute('aria-live', 'polite');
    expect(container.querySelector('.selcount')).toHaveTextContent('Выбрано 3 позиции · 5 шт.');
    expect(summ?.querySelector('.selx')).toBeNull();
    const bar = document.querySelector('.selbarwrap') as HTMLElement;
    expect(within(bar).getByRole('link', { name: 'Печать' })).toHaveAttribute(
      'href',
      '#/print/ci1*2-cc21*2-q337'
    );
    await expectNoA11yViolations(container);
  });

  it('holds a typed count to the quantity, and puts the value back on an emptied commit', async () => {
    render(App, { env: at('#/l/' + QTY_AND_PRICE.player.payload) });
    await tick('cc21');
    await setCount('Эликсир ярости', '9');
    expect(countOf('Эликсир ярости')).toHaveValue(5);

    await setCount('Эликсир ярости', '3');
    await userEvent.clear(countOf('Эликсир ярости'));
    await userEvent.tab();
    expect(countOf('Эликсир ярости')).toHaveValue(3);
  });

  it('adds the taken count to a list, with the price and no count of 1', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify(TWO) });
    render(App, { env: at('#/l/' + QTY_AND_PRICE.player.payload, { storage }) });
    await tickAllAndTakeTwo();

    const bar = document.querySelector('.selbarwrap') as HTMLElement;
    await userEvent.click(within(bar).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(within(bar).getByRole('button', { name: 'Клад дракона' }));

    const [a] = readLists(storage);
    expect(a?.meta).toEqual({
      ci1: { qty: 2 },
      cc21: { qty: 2, gold: 50 },
      q337: { gold: 12 }
    });
  });

  it('copies each taken count and unit price, then the total line', async () => {
    const clip = fakeClipboard();
    render(App, { env: at('#/l/' + QTY_AND_PRICE.player.payload, { clipboard: clip }) });
    await tickAllAndTakeTwo();

    const bar = document.querySelector('.selbarwrap') as HTMLElement;
    await userEvent.click(within(bar).getByRole('button', { name: 'Скопировать' }));

    const index = buildIndex(LOOT);
    const rec = (id: string) => index.byId.get(id)!;
    const parts = [
      share(rec('ci1'), index, 'ru', { suffix: ' ×2' }),
      share(rec('cc21'), index, 'ru', { suffix: ' ×2 — по ' + priceText(50, 'bag', 'ru') }),
      share(rec('q337'), index, 'ru', { suffix: ' — ' + priceText(12, 'bag', 'ru') })
    ];
    expect(clip.last.text).toBe(
      [...parts.map((p) => p.text), 'Итого: 1 мешок 1 горсть (без цены: 1)'].join('\n\n')
    );
    expect(screen.getByText(dict('ru').selCopied)).toBeInTheDocument();
  });

  it('forgets the count on a navigation', async () => {
    const router = memoryRouter('#/l/' + QTY_AND_PRICE.player.payload);
    render(App, { env: at('#/l/' + QTY_AND_PRICE.player.payload, { router }) });
    await tick('cc21');
    await setCount('Эликсир ярости', '2');

    router.navigate('#/lists');
    router.navigate('#/l/' + QTY_AND_PRICE.player.payload);
    flushSync();
    await tick('cc21');
    expect(countOf('Эликсир ярости')).toHaveValue(5);
  });

  it('has no violations with the count fields and the total on screen', async () => {
    const { container } = render(App, { env: at('#/l/' + QTY_AND_PRICE.player.payload) });
    await tickAllAndTakeTwo();
    await expectNoA11yViolations(container);
  });
});

describe('saving the whole list', () => {
  it('creates a new list with the name, ids, both notes and the entry meta', async () => {
    const storage = memoryStorage();
    const router = memoryRouter('#/l/' + NOTES_BOTH_KINDS.gm.payload);
    render(App, { env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload, { storage, router }) });

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить себе' }));

    const [l] = readLists(storage);
    expect(l).toMatchObject({
      name: 'Тайник',
      ids: ['ci1', 'cc1'],
      note: 'Лавка закрыта до утра',
      hnote: 'Хозяин - контрабандист',
      meta: { ci1: { note: 'Видно игрокам', hnote: 'Подделка' } }
    });
    expect(screen.getByText('Список «Тайник» создан')).toBeInTheDocument();
    expect(router.hash()).toBe('#/l/' + NOTES_BOTH_KINDS.player.payload);

    /* The own list page now, not the shared one - a title input, no
       "Список от другого игрока". */
    expect(screen.getByRole('textbox', { name: 'Название списка' })).toHaveValue('Тайник');
    expect(screen.queryByText('Список от другого игрока')).not.toBeInTheDocument();
  });

  it('keeps the money mode', async () => {
    const storage = memoryStorage();
    render(App, { env: at('#/l/' + MONEY_COIN_MODE.player.payload, { storage }) });

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить себе' }));

    const [l] = readLists(storage);
    expect(l?.name).toBe('Монеты');
    expect(l?.money).toBe('coin');
  });

  it('saves a nameless list as Без названия', async () => {
    const storage = memoryStorage();
    const payload = encodeList({ name: '', ids: ['ci1'] }, true);
    render(App, { env: at('#/l/' + payload, { storage }) });

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить себе' }));

    const [l] = readLists(storage);
    expect(l?.name).toBe('Без названия');
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
    expect(screen.queryByRole('button', { name: 'Сохранить себе' })).not.toBeInTheDocument();
  });
});

describe('the legacy announcement', () => {
  it('names the date on a link that decodes, and not on the bad-link page', () => {
    render(App, { env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload) });
    expect(screen.getByText(dict('ru').legacyLinks)).toBeInTheDocument();
    cleanup();
    render(App, { env: at('#/l/zzzz') });
    expect(screen.queryByText(dict('ru').legacyLinks)).not.toBeInTheDocument();
  });
});

describe('a share link', () => {
  const ru = dict('ru');
  const open = (hash: string, cloud = fakeCloud(SEED), over: Partial<Env> = {}) => {
    const router = memoryRouter(hash);
    const r = render(App, { env: at(hash, { router, cloud, ...over }) });
    return { ...r, router, cloud };
  };

  it("draws the players' view signed out: the name, the sub, the update time and no GM note", async () => {
    open('#/s/player-token-1');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' })
    ).toBeInTheDocument();
    expect(screen.getByText('Список от другого игрока · 2 позиции')).toBeInTheDocument();
    expect(screen.getByText('Обновлено 3 дня назад')).toBeInTheDocument();
    expect(screen.getByText('Открыта с рассвета до заката.')).toBeInTheDocument();
    expect(screen.queryByText(/Кузнец торгуется/)).not.toBeInTheDocument();
    expect(screen.queryByText(ru.ownList)).not.toBeInTheDocument();
    expect(screen.queryByText(ru.legacyLinks)).not.toBeInTheDocument();
  });

  it('toasts the entries the data does not know, once', async () => {
    open('#/s/player-token-1');
    await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' });
    expect(screen.getByText(plural(7, ru.droppedItems, 'ru'))).toBeInTheDocument();
  });

  it('draws both notes on a GM link', async () => {
    open('#/s/gm-token-1');
    expect(
      await screen.findByText('Кузнец торгуется, если назвать имя его брата.')
    ).toBeInTheDocument();
    expect(screen.getByText('Открыта с рассвета до заката.')).toBeInTheDocument();
  });

  it('tells the owner it is their list, with a link to its page', async () => {
    open('#/s/player-token-1', fakeCloud(SEED, 'gm1'));
    const edit = await screen.findByRole('link', { name: ru.ownListEdit });
    expect(edit).toHaveAttribute('href', '#/lists/' + uuid(101));
    expect(screen.getByText(ru.ownList, { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сохранить себе' })).toBeInTheDocument();
  });

  it('draws a GM link read-only for another user, with the GM notes and the save button', async () => {
    open('#/s/gm-token-1', fakeCloud(SEED, 'gm2'));
    await screen.findByText('Кузнец торгуется, если назвать имя его брата.');
    await screen.findByRole('link', { name: 'Аккаунт: gm2@example.test' });
    expect(screen.getByRole('button', { name: 'Сохранить себе' })).toBeInTheDocument();
    expect(screen.queryByText(ru.ownList, { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(document.querySelector('textarea')).toBeNull();
  });

  for (const hash of ['#/s/unknown', '#/s/']) {
    it(`draws the no-longer-available page for ${hash}, the address kept`, async () => {
      const { router } = open(hash);
      expect(
        await screen.findByRole('heading', { level: 1, name: ru.shareGone })
      ).toBeInTheDocument();
      expect(screen.getByText(ru.shareGoneSub)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'На главную' })).toHaveAttribute(
        'href',
        '#/roll/std'
      );
      expect(router.hash()).toBe(hash);
    });
  }

  it('draws the no-longer-available page in a build with no sign-in', () => {
    render(App, { env: at('#/s/player-token-1') });
    expect(screen.getByRole('heading', { level: 1, name: ru.shareGone })).toBeInTheDocument();
  });

  it('draws the load failure offline, and the list after Повторить online', async () => {
    const cloud = fakeCloud(SEED, undefined, { offline: true });
    open('#/s/player-token-1', cloud);
    expect(
      await screen.findByRole('heading', { level: 1, name: ru.sharedFailed })
    ).toBeInTheDocument();
    expect(screen.getByText(ru.sharedFailedSub)).toBeInTheDocument();
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' })
    ).toBeInTheDocument();
  });

  it('saves a copy signed in and opens it', async () => {
    const { router } = open('#/s/player-token-1', fakeCloud(SEED, 'gm2'));
    await screen.findByRole('link', { name: 'Аккаунт: gm2@example.test' });
    await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' });
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить себе' }));
    await waitFor(() => {
      expect(router.hash()).toBe('#/lists/' + uuid(5000));
    });
    expect(await screen.findByText('Список «Лавка кузнеца» создан')).toBeInTheDocument();
  });

  it('opens the prompt signed out, and makes the copy by itself after the sign-in', async () => {
    const { router } = open('#/s/player-token-1');
    await screen.findByRole('link', { name: 'Войти' });
    await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' });
    const save = screen.getByRole('button', { name: 'Сохранить себе' });
    await userEvent.click(save);
    expect(save).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Войдите, и список сохранится в ваш аккаунт.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
    expect(router.hash()).toBe('#/account');
    await userEvent.click(await screen.findByRole('button', { name: 'Войти через Google' }));
    await waitFor(() => {
      expect(router.hash()).toBe('#/lists/' + uuid(5000));
    });
    expect(await screen.findByRole('textbox', { name: 'Название списка' })).toHaveValue(
      'Лавка кузнеца'
    );
  });

  it("has no violations on the players' view, the owner's view and the gone page", async () => {
    const player = open('#/s/player-token-1');
    await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' });
    await expectNoA11yViolations(player.container);
    cleanup();
    const owner = open('#/s/player-token-1', fakeCloud(SEED, 'gm1'));
    await screen.findByRole('link', { name: ru.ownListEdit });
    await expectNoA11yViolations(owner.container);
    cleanup();
    const gone = open('#/s/unknown');
    await screen.findByRole('heading', { level: 1, name: ru.shareGone });
    await expectNoA11yViolations(gone.container);
  });
});

describe('English', () => {
  it('reads the sub, the note labels and the save button in English', async () => {
    render(App, { env: at('#/l/' + NOTES_BOTH_KINDS.gm.payload) });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(screen.getByText('A list from another player · 2 items')).toBeInTheDocument();
    /* The list note and ci1's own entry note both carry the label. */
    expect(screen.getAllByText('For players').length).toBeGreaterThan(0);
    expect(screen.getAllByText('GM only').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Save to my lists' })).toBeInTheDocument();
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
    const box = rowCheckboxes()[0] as HTMLElement;
    await userEvent.click(box);
    const bar = container.querySelector('.selbarwrap') as HTMLElement;
    await userEvent.click(within(bar).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(within(bar).getByRole('button', { name: '+ Новый список' }));
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

describe('saving with sign-in configured', () => {
  const PAYLOAD = encodeList({ name: 'Лавка', ids: ['ci1', 'cc1'], money: 'coin' }, true);

  it('saves into the account signed in, and opens the copy', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const router = memoryRouter('#/l/' + PAYLOAD);
    const storage = memoryStorage();
    render(App, { env: at('#/l/' + PAYLOAD, { router, storage, cloud }) });
    await screen.findByRole('link', { name: 'Аккаунт: gm2@example.test' });
    await new Promise((r) => setTimeout(r, 0));
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить себе' }));
    expect(router.hash()).toBe('#/lists/00000000-0000-4000-8000-000000005000');
    expect(screen.getByText('Список «Лавка» создан')).toBeInTheDocument();
    expect(readLists(storage)).toEqual([]);
    const read = await cloud.lists.list();
    const made = read.ok ? read.lists.find((l) => l.name === 'Лавка') : undefined;
    expect(made?.money_mode).toBe('coin');
    expect(made?.list_entries.map((e) => e.item_key)).toEqual(['ci1', 'cc1']);
  });

  it('opens the prompt under the pressed button signed out, and a second press folds it', async () => {
    const router = memoryRouter('#/l/' + PAYLOAD);
    const storage = memoryStorage();
    const { container } = render(App, {
      env: at('#/l/' + PAYLOAD, { router, storage, cloud: fakeCloud(SEED) })
    });
    await screen.findByRole('link', { name: 'Войти' });
    const save = screen.getByRole('button', { name: 'Сохранить себе' });
    expect(save).not.toHaveAttribute('aria-expanded');
    await userEvent.click(save);
    expect(screen.getByText('Войдите, и список сохранится в ваш аккаунт.')).toBeInTheDocument();
    expect(save).toHaveClass('on');
    expect(save).toHaveAttribute('aria-expanded', 'true');
    expect(readLists(storage)).toEqual([]);
    await expectNoA11yViolations(container);
    await userEvent.click(save);
    expect(
      screen.queryByText('Войдите, и список сохранится в ваш аккаунт.')
    ).not.toBeInTheDocument();
    expect(save).not.toHaveAttribute('aria-expanded');
    await userEvent.click(save);
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
    expect(router.hash()).toBe('#/account');
    await userEvent.click(await screen.findByRole('button', { name: 'Войти через Google' }));
    await waitFor(() => {
      expect(router.hash()).toBe('#/lists/00000000-0000-4000-8000-000000005000');
    });
    expect(await screen.findByRole('textbox', { name: 'Название списка' })).toHaveValue(
      'Лавка'
    );
    expect(readLists(storage)).toEqual([]);
  });

  it('does nothing while the session is unknown', async () => {
    const cloud = fakeCloud(SEED);
    cloud.auth.session = () => new Promise(() => undefined);
    const router = memoryRouter('#/l/' + PAYLOAD);
    render(App, { env: at('#/l/' + PAYLOAD, { router, cloud }) });
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить себе' }));
    expect(router.hash()).toBe('#/l/' + PAYLOAD);
    expect(screen.queryByText(/Войдите/)).not.toBeInTheDocument();
  });
});
