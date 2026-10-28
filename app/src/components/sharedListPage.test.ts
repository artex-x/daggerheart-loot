/* The shared page, `#/s/<token>`: an account list's share link - off `renderSharedList`
 * (`git show 23c00a6^:app.js`). Through `App`, the way `listPage.test.ts` reaches the index. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import type { Loot } from '../lib/data.js';
import { buildIndex } from '../lib/data.js';
import { dict } from '../lib/dict.js';
import { cardVersion } from '../lib/hash.js';
import { priceText } from '../lib/money.js';
import { plural } from '../lib/plural.js';
import { share } from '../lib/share.js';
import {
  fakeClipboard,
  fakeData,
  fakeEnv,
  fakePage,
  memoryRouter,
  memoryStorage
} from '../ports/index.js';
import type { CloudPort, Env } from '../ports/index.js';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid, type SeedList, type SeedShare } from '../ports/fake-cloud-seed.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import { readList } from '../test/accountList.js';
import { listOf, seedWith, TWO_LISTS } from '../test/seed.js';

afterEach(cleanup);

Element.prototype.scrollIntoView = () => {};

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

/** Returns the players' and the GM's share of list `n`: `player-token-<k>`, `gm-token-<k>`
 *  with `k` the list's last two digits, ids and topic keys from `uuid(911)` up. */
function sharesOf(n: number): SeedShare[] {
  const k = n - 900;
  const base = 911 + (k - 1) * 4;
  return [
    {
      id: uuid(base),
      listId: uuid(n),
      audience: 'player',
      token: 'player-token-9' + String(k),
      topicKey: uuid(base + 1)
    },
    {
      id: uuid(base + 2),
      listId: uuid(n),
      audience: 'gm',
      token: 'gm-token-9' + String(k),
      topicKey: uuid(base + 3)
    }
  ];
}

/* The three shared lists the page's cases read: both notes on the list and on one entry; a
   quantity, a quantity with a price and a bare price; coin mode. */
const NOTED = listOf(
  901,
  'Тайник',
  [{ key: 'ci1', note: 'Видно игрокам', hnote: 'Подделка' }, { key: 'cc1' }],
  { note: 'Лавка закрыта до утра', hnote: 'Хозяин - контрабандист' }
);
const PRICED = listOf(902, 'Лавка', [
  { key: 'ci1', qty: 2 },
  { key: 'cc21', qty: 5, gold: 50 },
  { key: 'q337', gold: 12 }
]);
const COINS = listOf(903, 'Монеты', [{ key: 'ci1', gold: 750 }], { money: 'coin' });
const SHARED = seedWith({ gm4: [NOTED, PRICED, COINS] }, [901, 902, 903].flatMap(sharesOf));
const NOTED_GM = '#/s/gm-token-91';
const PRICED_PLAYERS = '#/s/player-token-92';
const COINS_PLAYERS = '#/s/player-token-93';

/** Returns a seed with one more gm4 list, 904, shared to the players as `player-token-94`. */
const oneShared = (l: SeedList) => seedWith({ gm4: [l] }, sharesOf(904).slice(0, 1));
const ONE = '#/s/player-token-94';

/* The same shared lists, read by gm2, who holds the two lists of `TWO_LISTS` to add to. */
const SHARED_GM2 = seedWith(
  { gm2: TWO_LISTS, gm4: [NOTED, PRICED, COINS] },
  [901, 902, 903].flatMap(sharesOf)
);
const DRAGON = uuid(811);

const at = (hash: string, over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter(hash), data: fakeData(LOOT), ...over });

/** Renders `hash` signed out (or as `cloud`'s user) and waits for the heading `name`. */
async function openShared(
  hash: string,
  name: string,
  over: Partial<Env> = {},
  cloud: CloudPort = fakeCloud(SHARED)
) {
  const router = memoryRouter(hash);
  const r = render(App, { env: at(hash, { router, cloud, ...over }) });
  await screen.findByRole('heading', { level: 1, name });
  return { ...r, router, cloud };
}

/** Every row's own tick checkbox, in document order - each one is named
 *  after its own record instead of the generic "Выбрано", so the group is
 *  found by elimination: every checkbox except select-all's own (which
 *  keeps a name, "Выбрать все (N)", from its wrapping `<label>`). */
const rowCheckboxes = (): HTMLElement[] =>
  screen.getAllByRole('checkbox').filter((cb) => !cb.closest('.selall'));

/** Renders `hash` as gm2, who owns the lists of `TWO_LISTS`, and waits for the account. */
async function openAsGm2(hash: string, name: string, over: Partial<Env> = {}) {
  const cloud = fakeCloud(SHARED_GM2, 'gm2');
  const page = fakePage();
  const r = await openShared(hash, name, { page, ...over }, cloud);
  await screen.findByRole('button', { name: 'Аккаунт: gm2@example.test' });
  return { ...r, page };
}

describe('heading and sub', () => {
  it('draws the name, the sub as one text node, the save button and a way to select every row', async () => {
    const { container } = await openShared(NOTED_GM, 'Тайник');

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
    await openShared(NOTED_GM, 'Тайник');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все (2)' }));
    expect(screen.getByText('Выбрано 2 позиции')).toBeInTheDocument();
  });
});

describe('with a row ticked', () => {
  it('shows one add-to-list control, in the bar, and the save button above', async () => {
    const { container } = await openShared(NOTED_GM, 'Тайник');
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
  it('toasts the count once, without hiding the rows that did survive', async () => {
    await openShared(
      ONE,
      'X',
      {},
      fakeCloud(oneShared(listOf(904, 'X', [{ key: 'ci1' }, { key: 'nope999' }])))
    );
    expect(
      screen.getByText('Пропущено позиций, которых больше нет в данных: 1')
    ).toBeInTheDocument();
    expect(screen.getByText('Спальный мешок')).toBeInTheDocument();
  });
});

describe('every entry gone from the data', () => {
  it('opens as the list with no rows and the dropped-entries toast', async () => {
    const gone = listOf(904, 'Пропавшее', [{ key: 'zzz1' }, { key: 'zzz2' }]);
    const { container } = await openShared(ONE, 'Пропавшее', {}, fakeCloud(oneShared(gone)));
    expect(container.querySelector('.page-sub')).toHaveTextContent(
      'Список от другого игрока · 0 позиций'
    );
    expect(screen.getByRole('button', { name: 'Сохранить себе' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-row]')).toHaveLength(0);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getAllByText(plural(2, dict('ru').droppedItems, 'ru'))).toHaveLength(1);
    await expectNoA11yViolations(container);
  });
});

describe('untitled', () => {
  it('falls back to "Без названия" for a nameless list', async () => {
    await openShared(
      ONE,
      'Без названия',
      {},
      fakeCloud(oneShared(listOf(904, '', [{ key: 'ci1' }])))
    );
  });
});

describe('the notes', () => {
  it("draws both list notes above the rows, and each entry's own inside its row", async () => {
    const { container } = await openShared(NOTED_GM, 'Тайник');
    const notes = container.querySelectorAll('.hitnote');
    expect(notes[0]).toHaveTextContent('Для игроков');
    expect(notes[0]).toHaveTextContent('Лавка закрыта до утра');
    expect(notes[1]).toHaveTextContent('Только для мастера');
    expect(notes[1]).toHaveTextContent('Хозяин - контрабандист');

    /* Inside the row's border, under its main line (FEATURES.md, "Lists"). */
    const ci1Row = container.querySelector('[data-row="ci1"]');
    const inside = ci1Row?.querySelector(':scope > .rnotes');
    expect(inside?.previousElementSibling).toHaveClass('row-main');
    const [a, b] = [...(inside?.querySelectorAll('.hitnote') ?? [])];
    expect(a).toHaveTextContent('Видно игрокам');
    expect(b).toHaveTextContent('Подделка');
    expect(ci1Row?.nextElementSibling).toBe(container.querySelector('[data-row="cc1"]'));
    /* An entry with no note draws no box. */
    expect(container.querySelector('[data-row="cc1"] .rnotes')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('draws the notes before the take line of a ticked row', async () => {
    const l = listOf(904, 'X', [{ key: 'ci1', qty: 2, note: 'Видно игрокам' }]);
    const { container } = await openShared(ONE, 'X', {}, fakeCloud(oneShared(l)));
    const row = container.querySelector('[data-row="ci1"]');
    await userEvent.click(row?.querySelector('input[type="checkbox"]') as HTMLElement);
    const notes = row?.querySelector(':scope > .rnotes');
    expect(notes?.nextElementSibling).toHaveClass('pickrow');
    expect(notes).toHaveTextContent('Видно игрокам');
    await expectNoA11yViolations(container);
  });

  it('draws each line of a note as its own paragraph', async () => {
    const l = listOf(904, 'X', [{ key: 'ci1' }], { note: 'Первая\nВторая' });
    const { container } = await openShared(ONE, 'X', {}, fakeCloud(oneShared(l)));
    const note = container.querySelector('.hitnote .htext');
    expect([...(note?.querySelectorAll('p') ?? [])].map((p) => p.textContent)).toEqual([
      'Первая',
      'Вторая'
    ]);
  });

  it('draws a list note and an entry note as formatted text, the label first', async () => {
    const text = '**x** и *y*\n- пункт';
    const l = listOf(904, 'X', [{ key: 'ci1', note: text }], { note: text });
    const { container } = await openShared(ONE, 'X', {}, fakeCloud(oneShared(l)));
    const notes = [...container.querySelectorAll('.hitnote .htext')];
    expect(notes).toHaveLength(2);
    for (const note of notes) {
      expect(note.firstElementChild?.tagName).toBe('B');
      expect(note.firstElementChild).toHaveTextContent('Для игроков');
      expect(note.querySelector('p b')).toHaveTextContent('x');
      expect(note.querySelector('p i')).toHaveTextContent('y');
      expect(note.querySelector('ul li')).toHaveTextContent('пункт');
      expect(note.textContent).not.toContain('*');
    }
    await expectNoA11yViolations(container);
  });
});

describe('the tails', () => {
  it('reads a bare quantity, a quantity with a price, and a bare price', async () => {
    const { container } = await openShared(PRICED_PLAYERS, 'Лавка');
    expect(container.querySelector('[data-row="ci1"] .rtail')).toHaveTextContent('×2');
    expect(container.querySelector('[data-row="cc21"] .rtail')).toHaveTextContent(
      '×5 · ' + priceText(50, 'bag', 'ru')
    );
    expect(container.querySelector('[data-row="q337"] .rtail')).toHaveTextContent(
      priceText(12, 'bag', 'ru')
    );
  });

  it('draws no tail at all on a list with no qty or price', async () => {
    const { container } = await openShared(NOTED_GM, 'Тайник');
    expect(container.querySelectorAll('.rtail')).toHaveLength(0);
  });

  it('reads coin mode when the list carries it', async () => {
    const { container } = await openShared(COINS_PLAYERS, 'Монеты');
    expect(container.querySelector('[data-row="ci1"] .rtail')).toHaveTextContent(
      priceText(750, 'coin', 'ru')
    );
  });
});

describe('selection', () => {
  it('ticks a row and raises the bar; a second tick clears both', async () => {
    const { container } = await openShared(NOTED_GM, 'Тайник');
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
    const { cloud, page } = await openAsGm2(PRICED_PLAYERS, 'Лавка');

    const rowCheckbox = document
      .querySelector('[data-row="cc21"]')
      ?.querySelector('input[type="checkbox"]') as HTMLElement;
    await userEvent.click(rowCheckbox);

    const bar = document.querySelector('.selbarwrap') as HTMLElement;
    await userEvent.click(within(bar).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(await within(bar).findByRole('button', { name: 'Клад дракона' }));

    const a = await readList(cloud, page, DRAGON);
    const b = await readList(cloud, page, uuid(812));
    expect(a).toMatchObject({ ids: ['cc21'], meta: { cc21: { qty: 5, gold: 50 } } });
    expect(b?.ids).toEqual([]);
  });

  it('a chip pours the whole list with its meta, no note or hnote', async () => {
    const { cloud, page } = await openAsGm2(PRICED_PLAYERS, 'Лавка');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все (3)' }));
    const bar = document.querySelector('.selbarwrap') as HTMLElement;
    await userEvent.click(within(bar).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(await within(bar).findByRole('button', { name: 'Клад дракона' }));

    const a = await readList(cloud, page, DRAGON);
    expect(a?.ids).toEqual(['ci1', 'cc21', 'q337']);
    expect(a?.meta).toEqual({
      ci1: { qty: 2 },
      cc21: { qty: 5, gold: 50 },
      q337: { gold: 12 }
    });
    expect(a?.note).toBeUndefined();
    expect(a?.hnote).toBeUndefined();
    expect(screen.getByText('Добавлено в «Клад дракона»: 3')).toBeInTheDocument();
    /* A signed-in reader who took items is asked whether to tell the list's owner; that
       question stands in the bar where the menu was. */
    expect(
      within(bar).getByRole('group', {
        name: 'Сообщить владельцу списка, что вы взяли эти предметы?'
      })
    ).toBeInTheDocument();
  });

  it("leaves the GM's own note behind", async () => {
    const { cloud, page } = await openAsGm2(NOTED_GM, 'Тайник');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все (2)' }));
    const bar = document.querySelector('.selbarwrap') as HTMLElement;
    await userEvent.click(within(bar).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(await within(bar).findByRole('button', { name: 'Клад дракона' }));

    const a = await readList(cloud, page, DRAGON);
    expect(a?.meta).toEqual({ ci1: { note: 'Видно игрокам' } });
    expect(a?.note).toBeUndefined();
    expect(a?.hnote).toBeUndefined();
  });

  it("the bar's new list carries the shared meta too", async () => {
    const cloud = fakeCloud(SHARED, 'gm2');
    const page = fakePage();
    await openShared(PRICED_PLAYERS, 'Лавка', { page }, cloud);
    await screen.findByRole('button', { name: 'Аккаунт: gm2@example.test' });

    const rowCheckbox = document
      .querySelector('[data-row="cc21"]')
      ?.querySelector('input[type="checkbox"]') as HTMLElement;
    await userEvent.click(rowCheckbox);

    const bar = document.querySelector('.selbarwrap') as HTMLElement;
    await userEvent.click(within(bar).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(await within(bar).findByRole('button', { name: '+ Новый список' }));

    const input = screen.getByPlaceholderText('Например: клад дракона');
    await userEvent.clear(input);
    await userEvent.type(input, 'Сундук');
    await userEvent.click(within(bar).getByRole('button', { name: 'Создать' }));

    page.fireHidden();
    await waitFor(async () => {
      const heads = await cloud.lists.list();
      const id = heads.ok ? heads.lists.find((l) => l.name === 'Сундук')?.id : undefined;
      const read = await cloud.lists.rows(id ? [id] : []);
      const made = read.ok ? read.lists[0] : undefined;
      expect(made?.list_entries).toMatchObject([
        { item_key: 'cc21', quantity: 5, price_coins: 50 }
      ]);
    });
  });
});

describe('the taken count and the total', () => {
  /* PRICED: ci1 x2 unpriced, cc21 x5 at 50, q337 at 12. */
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
  const priced = (over: Partial<Env> = {}, cloud?: CloudPort) =>
    openShared(PRICED_PLAYERS, 'Лавка', over, cloud);

  it('draws a count field at the whole quantity only under a ticked entry over 1', async () => {
    await priced();
    expect(screen.queryByRole('spinbutton', { name: /^Взять/ })).not.toBeInTheDocument();

    await tick('ci1');
    expect(countOf('Спальный мешок')).toHaveValue(2);
    await tick('q337');
    expect(screen.getAllByRole('spinbutton', { name: /^Взять/ })).toHaveLength(1);
  });

  it('shows the total beside the selected count, with the unpriced count', async () => {
    const { container } = await priced();
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
    const { container } = await priced();
    await tick('cc21');
    await setCount('Эликсир ярости', '2');
    const line = container.querySelector('[data-row="cc21"] .pickrow');
    /* The label, the two ends and the field sit side by side with no text between them. */
    expect(line).toHaveTextContent('ВзятьМинМакс из 5 = 1 мешок');
    await expectNoA11yViolations(container);
  });

  it('draws «Мин», the count and «Макс» as one control', async () => {
    const { container } = await priced();
    await tick('cc21');
    const group = container.querySelector('[data-row="cc21"] .qgroup');
    expect(group?.children).toHaveLength(3);
    expect(group?.children[0]).toBe(
      screen.getByRole('button', { name: 'Мин, взять 1: Эликсир ярости' })
    );
    expect(group?.children[1]).toBe(countOf('Эликсир ярости'));
    expect(group?.children[2]).toBe(
      screen.getByRole('button', { name: 'Макс, взять все: Эликсир ярости' })
    );
    await expectNoA11yViolations(container);
  });

  it('sets the count to one and to the stock with «Мин» and «Макс», each disabled at its end', async () => {
    const { container } = await priced();
    await tick('cc21');
    const min = screen.getByRole('button', { name: 'Мин, взять 1: Эликсир ярости' });
    const max = screen.getByRole('button', { name: 'Макс, взять все: Эликсир ярости' });
    expect(max).toBeDisabled();
    expect(min).toBeEnabled();

    await userEvent.click(min);
    expect(countOf('Эликсир ярости')).toHaveValue(1);
    expect(min).toBeDisabled();
    expect(max).toBeEnabled();
    expect(container.querySelector('.selcount')).toHaveTextContent(/^Выбрана 1 позиция$/);

    await userEvent.click(max);
    expect(countOf('Эликсир ярости')).toHaveValue(5);
    expect(max).toBeDisabled();
    await expectNoA11yViolations(container);
  });

  it('mounts the empty live region before the first tick, so the first tick is announced', async () => {
    const { container } = await priced();
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
    const cloud = fakeCloud(SHARED, 'gm2');
    const { container, router } = await priced({}, cloud);
    await tickAllAndTakeTwo();
    const summ = container.querySelector('.selsumm');
    expect(summ).toHaveAttribute('aria-live', 'polite');
    expect(container.querySelector('.selcount')).toHaveTextContent('Выбрано 3 позиции · 5 шт.');
    expect(summ?.querySelector('.selx')).toBeNull();
    const bar = document.querySelector('.selbarwrap') as HTMLElement;
    await expectNoA11yViolations(container);
    const print = within(bar).getByRole('button', { name: 'Печать' });
    await waitFor(() => {
      expect(print).toBeEnabled();
    });
    await userEvent.click(print);
    await waitFor(() => {
      expect(router.hash()).toMatch(/^#\/p\/[A-Za-z0-9_-]{12}$/);
    });
    const read = await cloud.prints.read(router.hash().slice(4));
    expect(read).toMatchObject({
      ok: true,
      set: { entries: [{ k: 'ci1', q: 2 }, { k: 'cc21', q: 2 }, { k: 'q337' }] }
    });
  });

  it('keeps the taken counts in the print a signed-out press leaves for the sign-in', async () => {
    const cloud = fakeCloud(SHARED);
    const { container, router } = await priced({}, cloud);
    await tickAllAndTakeTwo();
    const bar = document.querySelector('.selbarwrap') as HTMLElement;
    const print = within(bar).getByRole('button', { name: 'Печать' });
    await waitFor(() => {
      expect(print).toBeEnabled();
    });
    await userEvent.click(print);
    expect(within(bar).getByText('Войдите, чтобы печатать карточки.')).toBeInTheDocument();
    expect(container.querySelector('.selacts')).toBeNull();
    await expectNoA11yViolations(container);
    await userEvent.click(within(bar).getByRole('button', { name: 'Войти' }));
    expect(router.hash()).toBe('#/account');
    await userEvent.click(await screen.findByRole('button', { name: 'Войти через Google' }));
    await waitFor(() => {
      expect(router.hash()).toMatch(/^#\/p\/[A-Za-z0-9_-]{12}$/);
    });
    const read = await cloud.prints.read(router.hash().slice(4));
    expect(read).toMatchObject({
      ok: true,
      set: { entries: [{ k: 'ci1', q: 2 }, { k: 'cc21', q: 2 }, { k: 'q337' }] }
    });
  });

  it('holds a typed count to the quantity, and puts the value back on an emptied commit', async () => {
    await priced();
    await tick('cc21');
    await setCount('Эликсир ярости', '9');
    expect(countOf('Эликсир ярости')).toHaveValue(5);

    await setCount('Эликсир ярости', '3');
    await userEvent.clear(countOf('Эликсир ярости'));
    await userEvent.tab();
    expect(countOf('Эликсир ярости')).toHaveValue(3);
  });

  it('adds the taken count to a list, with the price and no count of 1', async () => {
    const cloud = fakeCloud(SHARED_GM2, 'gm2');
    const page = fakePage();
    await priced({ page }, cloud);
    await screen.findByRole('button', { name: 'Аккаунт: gm2@example.test' });
    await tickAllAndTakeTwo();

    const bar = document.querySelector('.selbarwrap') as HTMLElement;
    await userEvent.click(within(bar).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(await within(bar).findByRole('button', { name: 'Клад дракона' }));

    const a = await readList(cloud, page, DRAGON);
    expect(a?.meta).toEqual({
      ci1: { qty: 2 },
      cc21: { qty: 2, gold: 50 },
      q337: { gold: 12 }
    });
  });

  it('copies each taken count and unit price, then the total line', async () => {
    const clip = fakeClipboard();
    await priced({ clipboard: clip });
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
    const { router } = await priced();
    await tick('cc21');
    await setCount('Эликсир ярости', '2');

    router.navigate('#/lists');
    router.navigate(PRICED_PLAYERS);
    flushSync();
    await screen.findByRole('heading', { level: 1, name: 'Лавка' });
    await tick('cc21');
    expect(countOf('Эликсир ярости')).toHaveValue(5);
  });

  it('has no violations with the count fields and the total on screen', async () => {
    const { container } = await priced();
    await tickAllAndTakeTwo();
    await expectNoA11yViolations(container);
  });
});

describe('a row opened', () => {
  it('opens the record over the page', async () => {
    await openShared(NOTED_GM, 'Тайник');
    await userEvent.click(screen.getByRole('button', { name: /Спальный мешок/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Спальный мешок')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Закрыть' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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
    expect(screen.getByText('Список от другого игрока · 3 позиции')).toBeInTheDocument();
    expect(screen.getByText('Обновлено 3 дня назад')).toBeInTheDocument();
    expect(screen.getByText('Открыта с рассвета до заката.')).toBeInTheDocument();
    expect(screen.queryByText(/Кузнец торгуется/)).not.toBeInTheDocument();
    expect(screen.queryByText(ru.ownList)).not.toBeInTheDocument();
  });

  it("draws a homebrew entry's picture on its row, signed out", async () => {
    open('#/s/player-token-1');
    const name = await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ });
    const row = name.closest('.lrow') ?? name.closest('li') ?? name.parentElement;
    expect(row?.querySelector('img')?.getAttribute('src')).toBe('img/thumb/ci1.webp');
  });

  it('draws «Загружаем...» while the link reads, then the list', async () => {
    const cloud = fakeCloud(SEED);
    let answer: (() => void) | null = null;
    const real = cloud.shares.read.bind(cloud.shares);
    cloud.shares.read = (token, since, held) =>
      new Promise((resolve) => {
        answer = () => {
          void real(token, since, held).then(resolve);
        };
      });
    const { container } = open('#/s/player-token-1', cloud);
    expect(await screen.findByText(ru.cloudLoading)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    await expectNoA11yViolations(container);
    await waitFor(() => {
      expect(answer).not.toBeNull();
    });
    (answer as unknown as () => void)();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' })
    ).toBeInTheDocument();
    expect(screen.queryByText(ru.cloudLoading)).toBeNull();
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

  describe('a GM-only entry', () => {
    const SHOP = uuid(101);
    const marked = (as?: string) => {
      const cloud = fakeCloud(SEED, as);
      cloud.playEntry(SHOP, 'cc1', { gm_only: true });
      return cloud;
    };
    const ownLine = (c: HTMLElement): string =>
      c.querySelector('.ownline')?.textContent.replace(/\s+/g, ' ').trim() ?? '';

    it("draws it on the GM's link in the GM-only look, named for a screen reader", async () => {
      const { container } = open('#/s/gm-token-1', marked());
      await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' });
      const row = container.querySelector('[data-row="cc1"]');
      expect(row).toHaveClass('gm-only');
      expect(row?.querySelector('.row-main')?.textContent).toContain(
        'Зелье, Только для мастера'
      );
      expect(container.querySelectorAll('.gm-only')).toHaveLength(1);
      await expectNoA11yViolations(container);
    });

    it("leaves it out of the players' link, with no GM-only look", async () => {
      const { container } = open('#/s/player-token-1', marked());
      await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' });
      expect(screen.getByText('Список от другого игрока · 2 позиции')).toBeInTheDocument();
      expect(container.querySelector('[data-row="cc1"]')).toBeNull();
      expect(container.querySelector('.gm-only')).toBeNull();
      expect(container.textContent).not.toContain('Только для мастера');
      await expectNoA11yViolations(container);
    });

    it('tells the owner on the own players link how many entries it leaves out', async () => {
      const { container } = open('#/s/player-token-1', marked('gm1'));
      await screen.findByRole('link', { name: ru.ownListEdit });
      await waitFor(() => {
        expect(ownLine(container)).toBe(
          'Это ваш список. Только для мастера: 1 - по этой ссылке их не видно. Открыть для правки'
        );
      });
      await expectNoA11yViolations(container);
    });

    it("reads the owner's list entries once for the count, and draws the line without it after a failed read", async () => {
      const cloud = marked('gm1');
      const rows = vi.spyOn(cloud.lists, 'rows');
      const first = open('#/s/player-token-1', cloud);
      await waitFor(() => {
        expect(ownLine(first.container)).toContain('Только для мастера: 1');
      });
      expect(rows).toHaveBeenCalledOnce();
      expect(rows).toHaveBeenCalledWith([uuid(101)]);
      cleanup();
      const failing = marked('gm1');
      failing.lists.rows = () => Promise.resolve({ ok: false });
      const second = open('#/s/player-token-1', failing);
      await screen.findByRole('button', { name: 'Аккаунт: gm1@example.test' });
      await new Promise((r) => setTimeout(r, 50));
      expect(ownLine(second.container)).toBe('Это ваш список. Открыть для правки');
      expect(screen.queryByText('Не получилось загрузить списки аккаунта.')).toBeNull();
    });

    it('says nothing more to the owner with no GM-only entry, or on the GM link', async () => {
      const plain = open('#/s/player-token-1', fakeCloud(SEED, 'gm1'));
      await screen.findByRole('link', { name: ru.ownListEdit });
      await screen.findByRole('button', { name: 'Аккаунт: gm1@example.test' });
      expect(ownLine(plain.container)).toBe('Это ваш список. Открыть для правки');
      await expectNoA11yViolations(plain.container);
      cleanup();
      const gm = open('#/s/gm-token-1', marked('gm1'));
      await screen.findByRole('link', { name: ru.ownListEdit });
      await waitFor(() => {
        expect(gm.container.querySelector('.gm-only')).not.toBeNull();
      });
      expect(ownLine(gm.container)).toBe('Это ваш список. Открыть для правки');
      await expectNoA11yViolations(gm.container);
    });
  });

  it('draws a GM link read-only for another user, with the GM notes and the save button', async () => {
    open('#/s/gm-token-1', fakeCloud(SEED, 'gm2'));
    await screen.findByText('Кузнец торгуется, если назвать имя его брата.');
    await screen.findByRole('button', { name: 'Аккаунт: gm2@example.test' });
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
    await screen.findByRole('button', { name: 'Аккаунт: gm2@example.test' });
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

  describe('the live status', () => {
    const region = (): HTMLElement | null => document.querySelector('.said[role="status"]');

    it('is empty after the first read and marked live once the topic joins', async () => {
      const { container } = open('#/s/player-token-1');
      await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' });
      await waitFor(() => {
        expect(region()).toHaveAttribute('data-live', 'live');
      });
      expect(region()).toHaveTextContent('');
      await expectNoA11yViolations(container);
    });

    it('is not marked live while Realtime is down', async () => {
      const { container } = open(
        '#/s/player-token-1',
        fakeCloud(SEED, undefined, { live: false })
      );
      await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' });
      expect(region()).not.toHaveAttribute('data-live');
      await expectNoA11yViolations(container);
    });

    it("says the list was updated once after another device's rename, and nothing after a GM note edit", async () => {
      const { cloud, container } = open('#/s/player-token-1');
      await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' });
      await waitFor(() => {
        expect(region()).toHaveAttribute('data-live', 'live');
      });
      cloud.play(uuid(101), { gm_note: 'новая' });
      await waitFor(() => {
        expect(screen.getByText('Обновлено только что')).toBeInTheDocument();
      });
      expect(region()).toHaveTextContent('');
      cloud.play(uuid(101), { name: 'Лавка у моста' });
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Лавка у моста' })
      ).toBeInTheDocument();
      expect(region()).toHaveTextContent(ru.listUpdated);
      await expectNoA11yViolations(container);
    });

    it('says the list was updated again after a second change, in a new node', async () => {
      const { cloud, container } = open('#/s/player-token-1');
      await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' });
      await waitFor(() => {
        expect(region()).toHaveAttribute('data-live', 'live');
      });
      cloud.play(uuid(101), { name: 'Лавка у моста' });
      await screen.findByRole('heading', { level: 1, name: 'Лавка у моста' });
      const first = region()?.querySelector('span');
      expect(first).toHaveTextContent(ru.listUpdated);
      cloud.play(uuid(101), { name: 'Лавка у реки' });
      await screen.findByRole('heading', { level: 1, name: 'Лавка у реки' });
      const second = region()?.querySelector('span');
      expect(second).toHaveTextContent(ru.listUpdated);
      expect(second).not.toBe(first);
      expect(first?.isConnected).toBe(false);
      await expectNoA11yViolations(container);
    });

    it('says once that the list is no longer available when its link is revoked live', async () => {
      const { cloud, container } = open('#/s/player-token-1');
      await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' });
      await waitFor(() => {
        expect(region()).toHaveAttribute('data-live', 'live');
      });
      await cloud.as('gm1').shares.revoke(uuid(111));
      expect(
        await screen.findByRole('heading', { level: 1, name: ru.shareGone })
      ).toBeInTheDocument();
      expect(region()).toHaveTextContent(ru.shareGone);
      expect(region()?.querySelectorAll('span')).toHaveLength(1);
      await expectNoA11yViolations(container);
    });

    it("closes a player's open record of the GM's own item when the GM removes its row", async () => {
      const { cloud, container } = open('#/s/player-token-1');
      await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' });
      await waitFor(() => {
        expect(region()).toHaveAttribute('data-live', 'live');
      });
      await userEvent.click(screen.getByRole('button', { name: /Топор Тлеющих Углей/ }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(
        (await cloud.as('gm1').lists.apply([{ op: 'remove_entries', ids: [uuid(1110)] }])).ok
      ).toBe(true);
      cloud.play(uuid(101), { name: 'Лавка у моста' });
      await screen.findByRole('heading', { level: 1, name: 'Лавка у моста' });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });
      await expectNoA11yViolations(container);
    });

    it('says nothing for an unknown token, also right after a drawn one', async () => {
      const { container } = open('#/s/unknown-token');
      expect(
        await screen.findByRole('heading', { level: 1, name: ru.shareGone })
      ).toBeInTheDocument();
      expect(region()).not.toBeNull();
      expect(region()).toHaveTextContent('');
      await expectNoA11yViolations(container);
      cleanup();
      const next = open('#/s/player-token-1');
      await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' });
      next.router.navigate('#/s/unknown-token');
      expect(
        await screen.findByRole('heading', { level: 1, name: ru.shareGone })
      ).toBeInTheDocument();
      expect(region()).toHaveTextContent('');
      expect(next.router.hash()).toBe('#/s/unknown-token');
    });
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
    await openShared(NOTED_GM, 'Тайник');
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
    const { container } = await openShared(NOTED_GM, 'Тайник');
    await expectNoA11yViolations(container);
  });

  it('has no violations with the menu open and the new-list form showing', async () => {
    const { container } = await openShared(NOTED_GM, 'Тайник', {}, fakeCloud(SHARED, 'gm2'));
    await screen.findByRole('button', { name: 'Аккаунт: gm2@example.test' });
    const box = rowCheckboxes()[0] as HTMLElement;
    await userEvent.click(box);
    const bar = container.querySelector('.selbarwrap') as HTMLElement;
    await userEvent.click(within(bar).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(await within(bar).findByRole('button', { name: '+ Новый список' }));
    expect(screen.getByPlaceholderText('Например: клад дракона')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('has no violations with a row ticked and the bar showing', async () => {
    const { container } = await openShared(NOTED_GM, 'Тайник');
    const box = rowCheckboxes()[0] as HTMLElement;
    await userEvent.click(box);
    await expectNoA11yViolations(container);
  });
});

describe('saving with sign-in configured', () => {
  it('saves into the account signed in, and opens the copy', async () => {
    const cloud = fakeCloud(SHARED, 'gm2');
    const page = fakePage();
    const { router } = await openShared(COINS_PLAYERS, 'Монеты', { page }, cloud);
    await screen.findByRole('button', { name: 'Аккаунт: gm2@example.test' });
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить себе' }));
    await waitFor(() => {
      expect(router.hash()).toBe('#/lists/' + uuid(5000));
    });
    expect(await screen.findByText('Список «Монеты» создан')).toBeInTheDocument();
    page.fireHidden();
    await waitFor(async () => {
      const read = await cloud.lists.list();
      const made = read.ok ? read.lists.find((l) => l.name === 'Монеты') : undefined;
      expect(made?.money_mode).toBe('coin');
      expect(made?.list_entries.map((e) => e.item_key)).toEqual(['ci1']);
    });
  });

  it('opens the prompt under the pressed button signed out, and a second press folds it', async () => {
    const { container, router } = await openShared(COINS_PLAYERS, 'Монеты');
    await screen.findByRole('link', { name: 'Войти' });
    const save = screen.getByRole('button', { name: 'Сохранить себе' });
    expect(save).not.toHaveAttribute('aria-expanded');
    await userEvent.click(save);
    expect(screen.getByText('Войдите, и список сохранится в ваш аккаунт.')).toBeInTheDocument();
    expect(save).toHaveClass('on');
    expect(save).toHaveAttribute('aria-expanded', 'true');
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
      expect(router.hash()).toBe('#/lists/' + uuid(5000));
    });
    expect(await screen.findByRole('textbox', { name: 'Название списка' })).toHaveValue(
      'Монеты'
    );
  });

  it('does nothing while the session is unknown', async () => {
    const cloud = fakeCloud(SHARED);
    cloud.auth.session = () => new Promise(() => undefined);
    const { router } = await openShared(COINS_PLAYERS, 'Монеты', {}, cloud);
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить себе' }));
    expect(router.hash()).toBe(COINS_PLAYERS);
    expect(screen.queryByText(/Войдите/)).not.toBeInTheDocument();
  });
});

describe('a purchase request', () => {
  const open = (hash: string, cloud = fakeCloud(SEED), over: Partial<Env> = {}) => {
    const r = render(App, { env: at(hash, { router: memoryRouter(hash), cloud, ...over }) });
    return { ...r, cloud };
  };
  const bar = (): HTMLElement => document.querySelector('.selbarwrap') as HTMLElement;
  const tickFirst = async (): Promise<void> => {
    await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' });
    await userEvent.click(rowCheckboxes()[0] as HTMLElement);
  };
  const ticked = (): number => document.querySelectorAll('.sel[data-row]').length;
  const notify = (): HTMLElement | null =>
    within(bar()).queryByRole('button', { name: 'Сообщить владельцу' });

  it('offers «Сообщить владельцу» signed out and signed in, and sends the ticks with their counts', async () => {
    const { cloud, container } = open('#/s/player-token-1');
    const send = vi.spyOn(cloud.requests, 'send');
    await tickFirst();
    await userEvent.click(notify() as HTMLElement);
    expect(send).toHaveBeenCalledWith(uuid(5000), 'player-token-1', [{ item: 'ci1', qty: 2 }]);
    expect(await screen.findByText('Запрос отправлен владельцу списка.')).toBeInTheDocument();
    expect(ticked()).toBe(1);
    expect(notify()).not.toBeInTheDocument();
    expect(within(bar()).getByRole('button', { name: 'Запрос отправлен' })).toBeDisabled();
    expect(cloud.decide(uuid(5000), 'declined')).toBe(true);
    await expectNoA11yViolations(container);
    cleanup();
    const signed = open('#/s/player-token-1', fakeCloud(SEED, 'gm2'));
    await screen.findByRole('button', { name: 'Аккаунт: gm2@example.test' });
    await tickFirst();
    expect(notify()).toBeInTheDocument();
    await expectNoA11yViolations(signed.container);
  });

  it('enables «Сообщить владельцу» again after a changed count', async () => {
    const { cloud, container } = open('#/s/player-token-1');
    const send = vi.spyOn(cloud.requests, 'send');
    await tickFirst();
    await userEvent.click(notify() as HTMLElement);
    await screen.findByText('Запрос отправлен владельцу списка.');
    await userEvent.click(screen.getByRole('button', { name: 'Мин, взять 1: Спальный мешок' }));
    expect(notify()).toBeEnabled();
    await userEvent.click(notify() as HTMLElement);
    expect(send).toHaveBeenLastCalledWith(uuid(5001), 'player-token-1', [
      { item: 'ci1', qty: 1 }
    ]);
    await expectNoA11yViolations(container);
  });

  it('drops a ticked entry the list no longer holds after the owner applies the request', async () => {
    const { cloud, container } = open('#/s/player-token-1');
    await tickFirst();
    await waitFor(() => {
      expect(document.querySelector('.said[role="status"]')).toHaveAttribute(
        'data-live',
        'live'
      );
    });
    await userEvent.click(notify() as HTMLElement);
    await screen.findByText('Запрос отправлен владельцу списка.');
    expect(cloud.decide(uuid(5000), 'applied')).toBe(true);
    await waitFor(() => {
      expect(ticked()).toBe(0);
    });
    expect(within(bar()).queryByRole('button', { name: 'Снять выделение' })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it("is not offered to the list's owner", async () => {
    const { container } = open('#/s/player-token-1', fakeCloud(SEED, 'gm1'));
    await screen.findByRole('link', { name: dict('ru').ownListEdit });
    await tickFirst();
    expect(notify()).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('reads «Отправляем...» and is disabled while the call runs', async () => {
    const { cloud, container } = open('#/s/player-token-1');
    let release = (): void => undefined;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const real = cloud.requests.send.bind(cloud.requests);
    cloud.requests.send = async (...args) => {
      await gate;
      return real(...args);
    };
    await tickFirst();
    await userEvent.click(notify() as HTMLElement);
    const sending = within(bar()).getByRole('button', { name: 'Отправляем...' });
    expect(sending).toBeDisabled();
    await expectNoA11yViolations(container);
    release();
    expect(await screen.findByText('Запрос отправлен владельцу списка.')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it.each([
    [
      { ok: false, error: 'limit', key: 'request_rate', value: 5 },
      'Слишком много запросов по этой ссылке: подождите минуту.'
    ],
    [
      { ok: false, error: 'limit', key: 'pending_requests_per_list', value: 10 },
      'У владельца уже 10 запросов без ответа. Попробуйте позже.'
    ],
    [
      { ok: false, error: 'network' },
      'Не получилось отправить. Проверьте соединение и попробуйте ещё раз.'
    ]
  ] as const)('keeps the selection and says %j', async (answer, text) => {
    const { cloud, container } = open('#/s/player-token-1');
    vi.spyOn(cloud.requests, 'send').mockResolvedValueOnce(answer);
    await tickFirst();
    await userEvent.click(notify() as HTMLElement);
    expect(await screen.findByRole('alert')).toHaveTextContent(text);
    expect(ticked()).toBe(1);
    await expectNoA11yViolations(container);
  });

  it('reads the link again for a stale list, and draws the gone page for a gone link', async () => {
    const { cloud, container } = open('#/s/player-token-1');
    const send = vi.spyOn(cloud.requests, 'send');
    const read = vi.spyOn(cloud.shares, 'read');
    send.mockResolvedValueOnce({ ok: false, error: 'stale' });
    await tickFirst();
    const reads = read.mock.calls.length;
    await userEvent.click(notify() as HTMLElement);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Список изменился. Проверьте выбор и отправьте снова.'
    );
    expect(read.mock.calls.length).toBe(reads + 1);
    send.mockResolvedValueOnce({ ok: false, error: 'gone' });
    read.mockResolvedValue({ ok: true, shared: null });
    await userEvent.click(notify() as HTMLElement);
    expect(
      await screen.findByRole('heading', { level: 1, name: dict('ru').shareGone })
    ).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  describe('flow b', () => {
    const addButton = (): HTMLElement =>
      within(bar()).getByRole('button', { name: 'Добавить в список' });
    const addToOwn = async (): Promise<void> => {
      await userEvent.click(within(bar()).getByRole('button', { name: 'Добавить в список' }));
      await userEvent.click(within(bar()).getByRole('button', { name: 'Список второго ГМа' }));
    };
    const signedIn = async (notifyGm?: 'always' | 'never') => {
      const cloud = fakeCloud(SEED, 'gm2');
      if (notifyGm) await cloud.prefs.save({ notifyGm });
      const view = open('#/s/player-token-1', cloud);
      await screen.findByRole('button', { name: 'Аккаунт: gm2@example.test' });
      await tickFirst();
      return { ...view, send: vi.spyOn(cloud.requests, 'send') };
    };

    it('asks after an add from the bar, with the focus on the question, and «Сообщить» sends and keeps the ticks', async () => {
      const { container, send } = await signedIn();
      await addToOwn();
      const q = within(bar()).getByRole('group', {
        name: 'Сообщить владельцу списка, что вы взяли эти предметы?'
      });
      expect(within(bar()).queryByRole('button', { name: 'Добавить в список' })).toBeNull();
      await waitFor(() => {
        expect(document.activeElement?.id).toBe('notifyq-text');
      });
      await expectNoA11yViolations(container);
      await userEvent.click(within(q).getByRole('button', { name: 'Сообщить' }));
      expect(send).toHaveBeenCalledWith(uuid(5001), 'player-token-1', [
        { item: 'ci1', qty: 2 }
      ]);
      expect(
        await screen.findByText('Добавлено в «Список второго ГМа». Владелец получил запрос.')
      ).toBeInTheDocument();
      expect(ticked()).toBe(1);
      expect(within(bar()).queryByRole('group')).toBeNull();
      await waitFor(() => {
        expect(document.activeElement).toBe(addButton());
      });
      await expectNoA11yViolations(container);
    });

    it('remembers «Не сообщать» with «Запомнить ответ», and then asks no more', async () => {
      const { cloud, send, container } = await signedIn();
      await addToOwn();
      await userEvent.click(within(bar()).getByRole('checkbox', { name: 'Запомнить ответ' }));
      await userEvent.click(within(bar()).getByRole('button', { name: 'Не сообщать' }));
      await waitFor(async () => {
        const read = await cloud.prefs.load();
        expect(read.ok && read.prefs?.notifyGm).toBe('never');
      });
      expect(send).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(document.activeElement).toBe(addButton());
      });
      await expectNoA11yViolations(container);
    });

    it('remembers «Сообщить» as always', async () => {
      const { cloud, container } = await signedIn();
      await addToOwn();
      await userEvent.click(within(bar()).getByRole('checkbox', { name: 'Запомнить ответ' }));
      await userEvent.click(within(bar()).getByRole('button', { name: 'Сообщить' }));
      await waitFor(async () => {
        const read = await cloud.prefs.load();
        expect(read.ok && read.prefs?.notifyGm).toBe('always');
      });
      await expectNoA11yViolations(container);
    });

    it('sends with no question on always, and does nothing on never', async () => {
      const always = await signedIn('always');
      await addToOwn();
      expect(
        await screen.findByText('Добавлено в «Список второго ГМа». Владелец получил запрос.')
      ).toBeInTheDocument();
      expect(always.send).toHaveBeenCalledOnce();
      expect(within(bar()).queryByRole('group')).toBeNull();
      cleanup();
      const never = await signedIn('never');
      await addToOwn();
      expect(await screen.findByText('Добавлено в «Список второго ГМа»')).toBeInTheDocument();
      expect(never.send).not.toHaveBeenCalled();
      expect(within(bar()).queryByRole('group')).toBeNull();
      await expectNoA11yViolations(never.container);
    });

    it('drops the question when the selection is cleared', async () => {
      const { container } = await signedIn();
      await addToOwn();
      await userEvent.click(within(bar()).getByRole('button', { name: 'Снять выделение' }));
      await userEvent.click(rowCheckboxes()[0] as HTMLElement);
      expect(within(bar()).queryByRole('group')).toBeNull();
      expect(notify()).toBeInTheDocument();
      await expectNoA11yViolations(container);
    });

    it("never asks after a card's own add", async () => {
      const { send, container } = await signedIn();
      await userEvent.click(within(bar()).getByRole('button', { name: 'Снять выделение' }));
      await userEvent.click(screen.getByRole('button', { name: /Спальный мешок/ }));
      const dialog = screen.getByRole('dialog');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Добавить в список' }));
      await userEvent.click(within(dialog).getByRole('button', { name: 'Список второго ГМа' }));
      expect(await screen.findByText('Добавлено в «Список второго ГМа»')).toBeInTheDocument();
      expect(document.querySelector('.notifyq')).toBeNull();
      expect(send).not.toHaveBeenCalled();
      await expectNoA11yViolations(container);
    });
  });
});

describe('homebrew entries on a share link', () => {
  const AXE = 'hb_emberaxeaaaaaaaa';
  const open = (hash: string, cloud: CloudPort) => {
    const router = memoryRouter(hash);
    const page = fakePage();
    const r = render(App, { env: at(hash, { router, cloud, page }) });
    return { ...r, router, page };
  };
  async function saved(cloud: CloudPort, id: string) {
    const read = await cloud.lists.rows([id]);
    return (read.ok ? read.lists.find((l) => l.id === id) : undefined)?.list_entries.find(
      (e) => e.item_key === AXE
    );
  }

  it("draws the owner's own item from the projection, signed out", async () => {
    const { container } = open('#/s/player-token-1', fakeCloud(SEED));
    expect(
      await screen.findByRole('button', { name: /Топор Тлеющих Углей/ })
    ).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it("links the owner's item for another reader who saves the list", async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const { router, page } = open('#/s/player-token-1', cloud);
    await screen.findByRole('button', { name: 'Аккаунт: gm2@example.test' });
    await screen.findByRole('button', { name: /Топор Тлеющих Углей/ });
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить себе' }));
    await waitFor(() => {
      expect(router.hash()).toBe('#/lists/' + uuid(5000));
    });
    expect(
      await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ })
    ).toBeInTheDocument();
    page.fireHidden();
    const axe = await saved(cloud, uuid(5000));
    expect(axe?.source).toBe('homebrew');
    expect(axe?.hb_item).toBe(uuid(511));
  });

  it('keeps the link to the item when its author saves the list', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const made = await cloud.shares.create(uuid(201), 'player');
    if (!made.ok) throw new Error('no share');
    await cloud.auth.signOut();
    await cloud.auth.signIn('google');
    const { router } = open('#/s/' + made.token, cloud);
    await screen.findByRole('button', { name: 'Аккаунт: gm1@example.test' });
    await screen.findByRole('button', { name: /Топор Тлеющих Углей/ });
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить себе' }));
    await waitFor(() => {
      expect(router.hash()).toMatch(/^#\/lists\//);
    });
    const id = router.hash().slice('#/lists/'.length);
    const axe = await saved(cloud, id);
    expect(axe?.source).toBe('homebrew');
    expect(axe?.hb_item).toBe(uuid(511));
  });
});

/* The search box and the filter strip (docs/specs/FEATURES.md, "Lists"), over the real
   data, so the seeded share draws its 10 entries. */
describe('the filter', () => {
  const ru = dict('ru');
  const REAL = JSON.parse(
    readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
  ) as Loot;
  const SHOP = uuid(101);
  const real = (hash: string, over: Partial<Env> = {}): Env =>
    fakeEnv({ router: memoryRouter(hash), data: fakeData(REAL), ...over });
  const open = (hash: string, cloud: CloudPort = fakeCloud(SEED), over: Partial<Env> = {}) => {
    const router = memoryRouter(hash);
    const clip = fakeClipboard();
    const r = render(App, { env: real(hash, { router, cloud, clipboard: clip, ...over }) });
    return { ...r, router, cloud, clip };
  };
  const rowsOf = (c: HTMLElement): string[] =>
    [...c.querySelectorAll<HTMLElement>('[data-row]')].map((e) => e.dataset['row'] ?? '');
  const pills = (c: HTMLElement): string[] =>
    [...c.querySelectorAll<HTMLElement>('.fpill')].map((e) => e.dataset['val'] ?? '');
  const pill = (c: HTMLElement, val: string): HTMLElement =>
    c.querySelector<HTMLElement>('.fpill[data-val="' + val + '"]') as HTMLElement;
  const count = (c: HTMLElement): string => c.querySelector('.fcount')?.textContent ?? '';
  const chip = (name: string): HTMLElement =>
    within(document.querySelector('.ffilter') as HTMLElement).getByRole('button', { name });
  const shopReady = (): Promise<HTMLElement> =>
    screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' });
  /* «Лавка кузнеца» holding only `keys`, so a test sets the count or the kinds. */
  const shopOf = (keys: string[]): typeof SEED => {
    const [shop, ...rest] = SEED.lists.gm1;
    if (!shop) throw new Error('no seeded shop');
    return {
      ...SEED,
      lists: {
        ...SEED.lists,
        gm1: [
          {
            ...shop,
            entries: keys.map((itemKey, position) => ({
              id: uuid(9000 + position),
              itemKey,
              position
            }))
          },
          ...rest
        ]
      }
    };
  };
  const EIGHT = ['ci1', 'cc1', 'q1', 'q313', 'q23', 'w51', 'q35', 'di11'];
  /* gm4's lists of 7, 8 and 3 entries, each shared to the players. */
  const keyed = (keys: string[]) => keys.map((key) => ({ key }));
  const sized = (): CloudPort =>
    fakeCloud(
      seedWith(
        {
          gm4: [
            listOf(905, 'Семь', keyed(EIGHT.slice(0, 7))),
            listOf(906, 'Склад', keyed(EIGHT)),
            listOf(907, 'Три', keyed(['ci1', 'q1', 'cc1']))
          ]
        },
        [905, 906, 907].flatMap((n) => sharesOf(n).slice(0, 1))
      )
    );

  describe('the threshold', () => {
    it('draws no search box below 8 entries, and the box and the strip at 8', async () => {
      open('#/s/player-token-95', sized());
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Семь' })
      ).toBeInTheDocument();
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: ru.filters })).not.toBeInTheDocument();
      cleanup();
      const { container } = open('#/s/player-token-96', sized());
      await screen.findByRole('heading', { level: 1, name: 'Склад' });
      expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', ru.searchPh);
      expect(screen.getByRole('button', { name: ru.filters })).toHaveAttribute(
        'aria-expanded',
        'false'
      );
      expect(count(container)).toBe('8');
      await expectNoA11yViolations(container);
    });

    it('draws the search box alone for 8 entries no row can narrow, and a filter link names nothing in force', async () => {
      const potions = Array.from({ length: 8 }, (_, i) => 'cc' + String(i + 1));
      const { container, router } = open(
        '#/s/player-token-1/f_kind-consumable',
        fakeCloud(shopOf(potions))
      );
      await shopReady();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
      expect(container.querySelector('.fbar')).toBeNull();
      expect(pills(container)).toEqual([]);
      expect(rowsOf(container)).toHaveLength(8);
      expect(router.hash()).toBe('#/s/player-token-1/f_kind-consumable');
      await expectNoA11yViolations(container);
    });

    it('stays drawn when the last pill goes, the query clears and a re-read shrinks the list', async () => {
      const cloud = fakeCloud(SEED);
      for (const key of ['ci1', 'cc1', 'voa2_a3'])
        cloud.playEntry(SHOP, key, { gm_only: true });
      const { container } = open('#/s/player-token-1/f_kind-weapon', cloud);
      await shopReady();
      expect(rowsOf(container)).toHaveLength(5);
      await userEvent.click(pill(container, 'kind:weapon'));
      expect(pills(container)).toEqual([]);
      expect(rowsOf(container)).toHaveLength(7);
      const box = screen.getByRole('searchbox');
      await userEvent.type(box, 'палаш');
      await userEvent.clear(box);
      expect(screen.getByRole('searchbox')).toBe(box);
      cloud.playEntry(SHOP, 'q1', { gm_only: true });
      await waitFor(() => {
        expect(rowsOf(container)).toHaveLength(6);
      });
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('starts unfiltered, folded and without the box on another list', async () => {
      const { container, router } = open('#/s/player-token-96', sized());
      await screen.findByRole('heading', { level: 1, name: 'Склад' });
      await userEvent.click(screen.getByRole('button', { name: ru.filters }));
      await userEvent.click(chip('Оружие'));
      await userEvent.type(screen.getByRole('searchbox'), 'посох');
      router.navigate('#/s/player-token-97');
      await screen.findByRole('heading', { level: 1, name: 'Три' });
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
      expect(rowsOf(container)).toEqual(['ci1', 'q1', 'cc1']);
      router.navigate('#/s/player-token-96');
      await screen.findByRole('heading', { level: 1, name: 'Склад' });
      expect(screen.getByRole('searchbox')).toHaveValue('');
      expect(screen.getByRole('button', { name: ru.filters })).toHaveAttribute(
        'aria-expanded',
        'false'
      );
      expect(rowsOf(container)).toHaveLength(8);
    });
  });

  describe('on a share link', () => {
    it('narrows by a pick, writes the address in place and reads the list once', async () => {
      const cloud = fakeCloud(SEED);
      const read = vi.spyOn(cloud.shares, 'read');
      const { container, router } = open('#/s/player-token-1', cloud);
      await shopReady();
      await waitFor(() => {
        expect(container.querySelector('.said[data-live="live"]')).not.toBeNull();
      });
      const reads = read.mock.calls.length;
      expect(rowsOf(container)).toHaveLength(10);
      expect(count(container)).toBe('10');
      await userEvent.click(screen.getByRole('button', { name: ru.filters }));
      await userEvent.click(chip('Оружие'));
      await userEvent.click(chip('1'));
      expect(rowsOf(container)).toEqual(['q1', 'q23', 'q35']);
      expect(count(container)).toBe('3 из 10');
      expect(pills(container)).toEqual(['kind:weapon', 'tier:1']);
      expect(router.hash()).toBe('#/s/player-token-1/f_kind-weapon.tier-1');
      expect(router.stack).toHaveLength(1);
      await userEvent.click(pill(container, 'tier:1'));
      expect(router.hash()).toBe('#/s/player-token-1/f_kind-weapon');
      expect(rowsOf(container)).toHaveLength(5);
      await userEvent.click(screen.getByRole('button', { name: ru.resetAll }));
      expect(router.hash()).toBe('#/s/player-token-1');
      expect(rowsOf(container)).toHaveLength(10);
      expect(read).toHaveBeenCalledTimes(reads);
      await expectNoA11yViolations(container);
    });

    it('opens the panel with the values of a filter link pressed', async () => {
      const { container } = open('#/s/player-token-1/f_kind-weapon.tier-1');
      await shopReady();
      expect(screen.getByRole('button', { name: `${ru.filters} (2)` })).toHaveAttribute(
        'aria-expanded',
        'true'
      );
      expect(chip('Оружие')).toHaveAttribute('aria-pressed', 'true');
      expect(chip('1')).toHaveAttribute('aria-pressed', 'true');
      expect(chip('Броня')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: ru.filterLink })).toBeInTheDocument();
      expect(rowsOf(container)).toHaveLength(3);
      await expectNoA11yViolations(container);
    });

    it('ignores a value no entry answers, and the next pick writes only the values in force', async () => {
      const { container, router } = open('#/s/player-token-1/f_range-veryfar');
      await shopReady();
      expect(pills(container)).toEqual([]);
      expect(rowsOf(container)).toHaveLength(10);
      expect(screen.getByRole('button', { name: ru.filters })).toBeInTheDocument();
      await userEvent.click(chip('Оружие'));
      expect(router.hash()).toBe('#/s/player-token-1/f_kind-weapon');
    });

    it('drops a value in force once a re-read removes the last entry that answers it', async () => {
      const cloud = fakeCloud(SEED);
      const { container, router } = open('#/s/player-token-1/f_kind-armor', cloud);
      await shopReady();
      expect(rowsOf(container)).toEqual(['q313']);
      cloud.playEntry(SHOP, 'q313', { gm_only: true });
      await waitFor(() => {
        expect(pills(container)).toEqual([]);
      });
      expect(rowsOf(container)).toHaveLength(9);
      expect(router.hash()).toBe('#/s/player-token-1/f_kind-armor');
      expect(screen.queryByRole('button', { name: 'Броня' })).not.toBeInTheDocument();
    });

    it('copies the filter link and toasts; the English link goes through en/', async () => {
      const { clip } = open('#/s/player-token-1/f_kind-weapon');
      await shopReady();
      await userEvent.click(screen.getByRole('button', { name: ru.filterLink }));
      expect(clip.last.text).toBe('https://example.test/#/s/player-token-1/f_kind-weapon');
      expect(screen.getByText(ru.filterLinkCopied)).toBeInTheDocument();
      cleanup();
      const en = open('#/s/player-token-1/f_kind-weapon', fakeCloud(SEED), {
        storage: memoryStorage({ 'dhloot.lang.v1': 'en' })
      });
      await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' });
      await userEvent.click(screen.getByRole('button', { name: dict('en').filterLink }));
      expect(en.clip.last.text).toBe(
        'https://example.test/en/#/s/player-token-1/f_kind-weapon'
      );
      expect(screen.getByText('Filter link copied')).toBeInTheDocument();
    });

    it('copies only the values in force, and toasts the GM warning on a GM link', async () => {
      const { clip, container } = open('#/s/gm-token-1/f_kind-weapon.range-veryfar');
      await shopReady();
      await userEvent.click(screen.getByRole('button', { name: ru.filterLink }));
      expect(clip.last.text).toBe('https://example.test/#/s/gm-token-1/f_kind-weapon');
      expect(screen.getByText(ru.gmFilterLinkCopied)).toBeInTheDocument();
      await expectNoA11yViolations(container);
    });

    it("copies the preview link with the share panel's version of the token's card", async () => {
      const ORIGIN = 'https://daggerheart-loot.pages.dev';
      /* One GM-only entry: the players' card counts 9 entries, the GM's every one. */
      const [shop, ...rest] = SEED.lists.gm1;
      if (!shop) throw new Error('no seeded shop');
      const seed: typeof SEED = {
        ...SEED,
        lists: {
          ...SEED.lists,
          gm1: [
            {
              ...shop,
              entries: shop.entries.map((e) =>
                e.itemKey === 'q313' ? { ...e, gmOnly: true as const } : e
              )
            },
            ...rest
          ]
        }
      };
      const v = (n: number) => cardVersion([shop.name, shop.note, n]);
      const players = open('#/s/player-token-1/f_kind-weapon', fakeCloud(seed), {
        preview: ORIGIN
      });
      await shopReady();
      await userEvent.click(screen.getByRole('button', { name: ru.filterLink }));
      expect(players.clip.last.text).toBe(`${ORIGIN}/s/player-token-1/f_kind-weapon?v=${v(9)}`);
      cleanup();
      const gm = open('#/s/gm-token-1/f_kind-weapon', fakeCloud(seed), {
        preview: ORIGIN,
        storage: memoryStorage({ 'dhloot.lang.v1': 'en' })
      });
      await shopReady();
      await userEvent.click(screen.getByRole('button', { name: dict('en').filterLink }));
      expect(gm.clip.last.text).toBe(`${ORIGIN}/en/s/gm-token-1/f_kind-weapon?v=${v(10)}`);
    });

    it('toasts the failure when the clipboard refuses, and leaves the address', async () => {
      const { router } = open('#/s/player-token-1/f_kind-weapon', fakeCloud(SEED), {
        clipboard: fakeClipboard({ fail: true })
      });
      await shopReady();
      await userEvent.click(screen.getByRole('button', { name: ru.filterLink }));
      expect(screen.getByRole('alert')).toHaveTextContent(ru.copyFailed);
      expect(router.hash()).toBe('#/s/player-token-1/f_kind-weapon');
    });

    it('narrows by the query as a table does, and never writes it to the address', async () => {
      const { container, router } = open('#/s/player-token-1');
      await shopReady();
      await userEvent.type(screen.getByRole('searchbox'), 'кинжал');
      expect(rowsOf(container)).toEqual(['q35']);
      expect(count(container)).toBe('10');
      expect(router.hash()).toBe('#/s/player-token-1');
    });

    it('says nothing is found and offers the reset while a value is in force', async () => {
      const { container, router } = open('#/s/player-token-1/f_kind-armor.tier-2');
      await shopReady();
      expect(count(container)).toBe('0 из 10');
      expect(screen.getByText(ru.nothing)).toBeInTheDocument();
      expect(screen.queryByRole('checkbox', { name: /Выбрать все/ })).not.toBeInTheDocument();
      await expectNoA11yViolations(container);
      const resets = screen.getAllByRole('button', { name: ru.resetAll });
      await userEvent.click(resets.at(-1) as HTMLElement);
      expect(router.hash()).toBe('#/s/player-token-1');
      expect(rowsOf(container)).toHaveLength(10);
      /* Rule 20: the empty state's reset left with it; «Фильтры» takes the focus. */
      await waitFor(() => {
        expect(screen.getByRole('button', { name: ru.filters })).toHaveFocus();
      });
    });

    it('hands focus to the next pill, then «Фильтры», as pills drop', async () => {
      const { container } = open('#/s/player-token-1/f_kind-armor.tier-2');
      await shopReady();
      await userEvent.click(pill(container, 'kind:armor'));
      await waitFor(() => {
        expect(pill(container, 'tier:2')).toHaveFocus();
      });
      await userEvent.click(pill(container, 'tier:2'));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: ru.filters })).toHaveFocus();
      });
    });

    it('keeps a tick the filter hides, and ticks only the drawn rows from select-all', async () => {
      const { container } = open('#/s/player-token-1');
      await shopReady();
      await userEvent.click(
        screen.getByRole('checkbox', { name: 'Первоклассный Спальный Мешок' })
      );
      await userEvent.click(screen.getByRole('button', { name: ru.filters }));
      await userEvent.click(chip('Оружие'));
      await userEvent.click(chip('1'));
      expect(rowsOf(container)).not.toContain('ci1');
      expect(screen.getByText(/^Выбрана 1 позиция/)).toBeInTheDocument();
      await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все (3)' }));
      expect(screen.getByText(/^Выбрано 4 позиции/)).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: ru.resetAll }));
      expect(
        screen.getByRole('checkbox', { name: 'Первоклассный Спальный Мешок' })
      ).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Колода Сумерек' })).not.toBeChecked();
      await expectNoA11yViolations(container);
    });

    it('reads the strip, the panel and the no-match line in English', async () => {
      const en = dict('en');
      const { container } = open('#/s/player-token-1/f_kind-armor.tier-2', fakeCloud(SEED), {
        storage: memoryStorage({ 'dhloot.lang.v1': 'en' })
      });
      await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' });
      expect(screen.getByRole('button', { name: `${en.filters} (2)` })).toBeInTheDocument();
      expect(count(container)).toBe(`0 ${en.outOf} 10`);
      expect(screen.getByText(en.nothing)).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', en.searchPh);
      expect(chip('Armor')).toHaveAttribute('aria-pressed', 'true');
      expect(container.querySelector('.ffilter')?.textContent).toContain(en.eqTrait);
    });
  });

  it("draws the owner's own set on a book item of its own link, and none signed out", async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const held = await cloud.homebrew.load();
    const set = held.ok ? held.cards.find((c) => c.kind === 'set') : undefined;
    if (!set) throw new Error('The seed has no set card. Restore it in fake-cloud-seed.ts.');
    await cloud.homebrew.updateCard(
      set.id,
      { content: { ...set.content, items: ['q1', 'q23'] }, book_id: set.book_id },
      null
    );
    const { container } = open('#/s/player-token-1', cloud);
    await screen.findByRole('link', { name: ru.ownListEdit });
    await userEvent.click(await screen.findByRole('button', { name: /^Палаш/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('link', { name: 'Комплект Ольхи' })).toHaveAttribute(
      'href',
      '#/homebrew/sets/hb_aldersetaaaaaaaa'
    );
    await expectNoA11yViolations(container);
    cleanup();
    open('#/s/player-token-1');
    await shopReady();
    await userEvent.click(await screen.findByRole('button', { name: /^Палаш/ }));
    expect(within(screen.getByRole('dialog')).queryByText(/Комплект Ольхи/)).toBeNull();
  });
});
