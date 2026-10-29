/* The list page, `#/lists/<id>` - off `renderOneList` and
 * everything it draws. Through `App`, the way `listsPage.test.ts` reaches the
 * index: the address, the tab bar and the modal all live above this
 * component. */

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import { buildIndex } from '../lib/data.js';
import { dict } from '../lib/dict.js';
import type { Loot } from '../lib/data.js';
import { priceText } from '../lib/money.js';
import { share, shareList } from '../lib/share.js';
import {
  fakeClipboard,
  fakeData,
  fakeDialog,
  fakeDrag,
  fakeEnv,
  fakeImage,
  fakePage,
  memoryRouter,
  memoryStorage,
  noData
} from '../ports/index.js';
import type { CloudPort, Env, ListWrites } from '../ports/index.js';
import { fakeCloud, type FakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid, type SeedList } from '../ports/fake-cloud-seed.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import { filled, readList, SHOP, sub, withStandins } from '../test/accountList.js';
import { listOf, seedWith } from '../test/seed.js';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView or the layout getters autoSize
   reads; a note box's own sizing skips them (offsetParent is always
   null), which is fine - the branch is covered, not measured. */

const LOOT: Loot = {
  items: {
    core_item: [
      {
        id: 'ci1',
        src: 'core',
        kind: 'item',
        roll: 1,
        en: 'Premium Bedroll',
        ende: 'Clear a Stress.',
        ru: 'Спальный мешок',
        rud: 'Очистите Стресс.'
      }
    ],
    core_consumable: [
      {
        id: 'cc1',
        src: 'core',
        kind: 'consumable',
        roll: 1,
        en: 'Potion',
        ende: 'Heals.',
        ru: 'Зелье',
        rud: 'Лечит.'
      }
    ]
  },
  eq: [
    {
      id: 'q1',
      src: 'core',
      kind: 'item',
      en: 'Sword',
      ende: '',
      ru: 'Меч',
      rud: '',
      eq: {
        t: 'weapon',
        tier: 1,
        cls: 'phy',
        bu: 1,
        dmg: 'd6',
        dt: 'phy',
        tr: 'agility',
        rg: 'melee'
      }
    }
  ],
  refs: {}
};

const at = (hash: string, over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter(hash), data: fakeData(LOOT), ...over });

/** A_LIST's rows in order (each row checkbox is named after its own record). */
const ROW_NAMES = ['Спальный мешок', 'Зелье', 'Меч'];

/** The account list the page cases run on, held by gm4: three known records, one of them
 *  priced, counted and noted, and a list note both public and hidden. */
const A_ENTRIES = [
  { key: 'ci1' },
  { key: 'cc1', qty: 2, gold: 750, note: 'Светится в темноте', hnote: 'Проклят' },
  { key: 'q1' }
];
const A_LIST = listOf(801, 'Тайник', A_ENTRIES, {
  note: 'Лавка закрыта до утра',
  hnote: 'Не для игроков'
});
const A_ID = uuid(801);
const A_HASH = '#/lists/' + A_ID;

/* `page.fireHidden()` sends the account's write buffer at once, as a
   hidden tab does, so a test reads the fake without the 2 s wait. */
const openAs = (cloud: CloudPort, hash = SHOP, over: Partial<Env> = {}) => {
  const router = memoryRouter(hash);
  const dialog = fakeDialog();
  const page = fakePage();
  const view = render(App, { env: at(hash, { router, dialog, cloud, page, ...over }) });
  return { ...view, router, dialog, page };
};

/** Renders `hash` signed in as gm4, who holds `A_LIST` and `more`, and waits for the page. */
async function openA(over: Partial<Env> = {}, hash = A_HASH, more: SeedList[] = []) {
  const cloud = fakeCloud(seedWith({ gm4: [A_LIST, ...more] }), 'gm4');
  const view = openAs(cloud, hash, over);
  await screen.findByRole('textbox', { name: /^(Название списка|List name)$/ });
  return { ...view, cloud };
}

describe('the address', () => {
  it('draws the not-found page for an old list link and keeps the address', async () => {
    for (const hash of [
      '#/l/0JvQsNCy0LrQsAozLnZvY3h-Y2kxKjIsY2MyMSo1KjUwLHEzMzcqMSoxMg',
      '#/l/~AAAA'
    ]) {
      const router = memoryRouter(hash);
      const { container } = render(App, {
        env: at(hash, { router, cloud: fakeCloud(SEED) })
      });
      expect(
        screen.getByRole('heading', { level: 1, name: 'Предмет не найден' })
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'На главную' })).toHaveAttribute(
        'href',
        '/roll/std'
      );
      expect(screen.queryByRole('textbox', { name: 'Название списка' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Сохранить себе' })).toBeNull();
      expect(container.querySelector('[aria-current="page"]')).toBeNull();
      expect(document.title).toBe('Генератор лута Daggerheart');
      await new Promise((r) => setTimeout(r, 200));
      expect(router.hash()).toBe(hash);
      await expectNoA11yViolations(container);
      cleanup();
    }
  });
});

describe("the list's entries read", () => {
  it('draws «Загружаем...» and no heading until the rows answer, then the page; one rows read', async () => {
    const cloud = fakeCloud(seedWith({ gm4: [A_LIST] }), 'gm4');
    let answer: (() => void) | null = null;
    const real = cloud.lists.rows.bind(cloud.lists);
    const rows = vi.fn(
      (ids: readonly string[]) =>
        new Promise<Awaited<ReturnType<typeof real>>>((r) => {
          answer = () => {
            r(real(ids));
          };
        })
    );
    cloud.lists.rows = rows;
    openAs(cloud, A_HASH);
    await waitFor(() => {
      expect(answer).not.toBeNull();
    });
    expect(screen.getByRole('status')).toHaveTextContent('Загружаем...');
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    answer!();
    expect(await screen.findByRole('textbox', { name: 'Название списка' })).toHaveValue(
      'Тайник'
    );
    expect(rows).toHaveBeenCalledOnce();
  });

  it('draws the failure with a primary «Повторить» when the rows read fails, and a retry draws the page', async () => {
    const cloud = fakeCloud(seedWith({ gm4: [A_LIST] }), 'gm4');
    const real = cloud.lists.rows.bind(cloud.lists);
    let fail = true;
    cloud.lists.rows = (ids) => (fail ? Promise.resolve({ ok: false }) : real(ids));
    const { container } = openAs(cloud, A_HASH);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Список не загрузился' })
    ).toBeInTheDocument();
    expect(screen.getByText('Не получилось загрузить списки аккаунта.')).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: 'Повторить' });
    expect(retry).toHaveClass('primary');
    await expectNoA11yViolations(container);
    fail = false;
    await userEvent.click(retry);
    expect(await screen.findByRole('textbox', { name: 'Название списка' })).toHaveValue(
      'Тайник'
    );
  });
});

describe('the heading and the action row', () => {
  it("stores the list's counts in the set signed in, and opens it", async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const router = memoryRouter('#/lists/' + uuid(101));
    render(App, { env: at('#/lists/' + uuid(101), { router, cloud }) });
    const print = await screen.findByTitle('Собрать карточки для печати: девять на лист A4');
    await waitFor(() => {
      expect(print).toBeEnabled();
    });
    await userEvent.click(print);
    await waitFor(() => {
      expect(router.hash()).toMatch(/^#\/p\/[A-Za-z0-9_-]{12}$/);
    });
    const read = await cloud.prints.read(router.hash().slice(4));
    expect(read.ok && (read.set as { entries: unknown[] }).entries).toMatchObject([
      { k: 'ci1', q: 2 },
      { k: 'q1' },
      { k: 'cc1', q: 5 },
      { hid: uuid(511) }
    ]);
  });

  it('has no print control on an empty list', async () => {
    render(App, { env: at('#/lists/' + uuid(102), { cloud: fakeCloud(SEED, 'gm1') }) });
    await screen.findByRole('textbox', { name: 'Название списка' });
    expect(
      screen.queryByTitle('Собрать карточки для печати: девять на лист A4')
    ).not.toBeInTheDocument();
  });
});

describe('the money picker', () => {
  it('marks the selected mode with aria-pressed, like every other chip', async () => {
    /* Owner ruling, 2026-09-16: kept as aria-pressed on both modes rather
       than restored to the live app's own aria-current on the selected one
       alone - nothing measured the money picker as a special case. */
    await openA();
    expect(screen.getByRole('button', { name: 'Как в книге' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Монетами' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('draws only when some entry has a price', async () => {
    await openA();
    expect(screen.getByRole('button', { name: 'Как в книге' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Монетами' })).toBeInTheDocument();
  });

  it('is absent on a list with no price at all', async () => {
    await openA({}, '#/lists/' + uuid(803), [listOf(803, 'Без цен', [{ key: 'ci1' }])]);
    expect(screen.queryByRole('button', { name: 'Монетами' })).not.toBeInTheDocument();
  });

  it('stores coin mode and keeps the address; removes the gold hint', async () => {
    const { router, cloud, page } = await openA();
    expect(screen.getByRole('button', { name: 'Подсказка: Цена' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Монетами' }));
    expect((await readList(cloud, page, A_ID))?.money).toBe('coin');
    await new Promise((r) => setTimeout(r, 200));
    expect(router.hash()).toBe(A_HASH);
    expect(screen.queryByRole('button', { name: 'Подсказка: Цена' })).toBeNull();
    expect(screen.queryByText('7 мешков 5 горстей')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Как в книге' }));
    expect((await readList(cloud, page, A_ID))?.money).toBeUndefined();
  });

  it('names the price «Цена» and opens its conversion from a «?» by click and by keyboard', async () => {
    const { container } = await openA();
    /* One «?», the priced row's: a row with no price has nothing to convert. */
    expect(screen.getAllByRole('spinbutton', { name: 'Цена' })).toHaveLength(3);
    const help = screen.getByRole('button', { name: 'Подсказка: Цена' });
    expect(help.closest('label')).toBeNull();
    expect(help).not.toHaveAttribute('title');
    const hint = document.getElementById(help.getAttribute('aria-controls') ?? '');
    expect(hint).toHaveTextContent('7 мешков 5 горстей');
    expect(help).toHaveAttribute('aria-expanded', 'false');
    expect(hint).not.toBeVisible();
    await expectNoA11yViolations(container);
    await userEvent.click(help);
    expect(help).toHaveAttribute('aria-expanded', 'true');
    expect(hint).toBeVisible();
    await expectNoA11yViolations(container);
    help.focus();
    await userEvent.keyboard('{Enter}');
    expect(help).toHaveAttribute('aria-expanded', 'false');
    expect(hint).not.toBeVisible();
    await userEvent.keyboard(' ');
    expect(hint).toBeVisible();
  });

  it('follows a price typed while the conversion is open', async () => {
    await openA();
    await userEvent.click(screen.getByRole('button', { name: 'Подсказка: Цена' }));
    const gold = screen.getAllByRole('spinbutton', { name: 'Цена' })[1] as HTMLElement;
    await userEvent.clear(gold);
    await userEvent.type(gold, '1500');
    const help = screen.getByRole('button', { name: 'Подсказка: Цена' });
    const hint = document.getElementById(help.getAttribute('aria-controls') ?? '');
    expect(hint).toBeVisible();
    expect(hint).toHaveTextContent('1 сундук 5 мешков');
  });

  it('opens the help with five bold runs on its own "?"', async () => {
    await openA();
    const help = screen.getByRole('button', { name: 'Как это работает' });
    expect(help).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(help);
    expect(help).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('горстями, мешками и сундуками')).toBeInTheDocument();
    expect(screen.getByText('8 мешков')).toBeInTheDocument();
  });
});

describe('the list note', () => {
  it('opens when a note exists, folds when neither does', async () => {
    const { container } = await openA();
    expect(container.querySelector('details.lnote')).toHaveProperty('open', true);
    cleanup();

    const { container: c2 } = await openA({}, '#/lists/' + uuid(805), [
      listOf(805, 'Без заметок', [{ key: 'ci1' }])
    ]);
    expect(c2.querySelector('details.lnote')).toHaveProperty('open', false);
  });

  it('stores what is typed and deletes the key when it is blanked', async () => {
    const { cloud, page } = await openA();
    const pub = screen.getByPlaceholderText('Например: лавка закрыта до утра');
    await userEvent.clear(pub);
    await userEvent.type(pub, 'Новая запись');
    expect((await readList(cloud, page, A_ID))?.note).toBe('Новая запись');

    await userEvent.clear(pub);
    expect((await readList(cloud, page, A_ID))?.note).toBeUndefined();
  });

  it('writes no address for a typed note, nor when the page is hidden', async () => {
    const { router, cloud, page } = await openA();
    const replaceSpy = vi.spyOn(router, 'replace');

    const pub = screen.getByPlaceholderText('Например: лавка закрыта до утра');
    await userEvent.clear(pub);
    await userEvent.type(pub, '12345678901234567890', { delay: null });
    expect((await readList(cloud, page, A_ID))?.note).toBe('12345678901234567890');

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true
    });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pagehide'));
    await new Promise((r) => setTimeout(r, 200));
    expect(replaceSpy).not.toHaveBeenCalled();
    expect(router.hash()).toBe(A_HASH);

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true
    });
  });
});

describe('the roll panel', () => {
  it('is absent with one known entry, folded with more than one', async () => {
    await openA();
    expect(screen.getByText('Бросок по списку')).toBeInTheDocument();
    cleanup();

    await openA({}, '#/lists/' + uuid(804), [listOf(804, 'Одна позиция', [{ key: 'ci1' }])]);
    expect(screen.queryByText('Бросок по списку')).not.toBeInTheDocument();
  });

  it('shows an entry’s compact card, badged, with both hitnotes, on a typed number', async () => {
    const { container } = await openA();
    await userEvent.click(screen.getByText('Бросок по списку'));
    const field = screen.getByRole('textbox', { name: 'Результат броска' });
    await userEvent.clear(field);
    await userEvent.type(field, '2');

    /* "Зелье" names both the row and the roll result's own compact card. */
    expect(screen.getAllByText('Зелье').length).toBeGreaterThanOrEqual(2);
    /* The hit's note shows both in its own row's box and in the roll result's card. */
    expect(screen.getByDisplayValue('Светится в темноте')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Проклят')).toBeInTheDocument();
    const hit = container.querySelector('.lroll') as HTMLElement;
    expect(within(hit).getByText('Светится в темноте')).toBeInTheDocument();
    expect(within(hit).getByText('Проклят')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сбросить' })).toBeInTheDocument();
  });

  it('rolls entry 1 with a fixed random source, and Сбросить empties the field without folding', async () => {
    const { container } = await openA({ random: () => 0 });
    await userEvent.click(screen.getByText('Бросок по списку'));
    await userEvent.click(screen.getByRole('button', { name: /Случайно/ }));
    expect(screen.getAllByText('Спальный мешок').length).toBeGreaterThanOrEqual(2);

    await userEvent.click(screen.getByRole('button', { name: 'Сбросить' }));
    const field = screen.getByRole('textbox', { name: 'Результат броска' });
    expect(field).toHaveValue('');
    expect(container.querySelector<HTMLDetailsElement>('details.lroll')).toHaveProperty(
      'open',
      true
    );
  });

  it('shows 1 from an empty field on the first "+"', async () => {
    await openA();
    await userEvent.click(screen.getByText('Бросок по списку'));
    const field = screen.getByRole('textbox', { name: 'Результат броска' });
    expect(field).toHaveValue('');
    await userEvent.click(screen.getByRole('button', { name: 'На единицу больше' }));
    expect(field).toHaveValue('1');
  });
});

describe('select-all', () => {
  it('ticks every row and reads the count; one row reads 1; none reads "select all"', async () => {
    await openA();
    expect(screen.getByRole('checkbox', { name: 'Выбрать все' })).toBeInTheDocument();

    const rows = ROW_NAMES.map((name) => screen.getByRole('checkbox', { name }));
    expect(rows).toHaveLength(3);
    await userEvent.click(rows[0] as HTMLElement);
    expect(screen.getByText('Выбрана 1 позиция')).toBeInTheDocument();

    // untick the same row - its own name never changes with selection state
    await userEvent.click(rows[0] as HTMLElement);
    expect(screen.getByText('Выбрать все')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
    expect(screen.getByText('Выбрано 3 позиции · 4 шт.')).toBeInTheDocument();
  });

  it('clears when history moves to a different list, not just a different page', async () => {
    const { router } = await openA({}, A_HASH, [listOf(802, 'Другой', [{ key: 'q1' }])]);

    await userEvent.click(screen.getByRole('checkbox', { name: ROW_NAMES[0]! }));
    expect(screen.getByText('Выбрана 1 позиция')).toBeInTheDocument();

    router.navigate('#/lists/' + uuid(802));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
    expect(screen.queryByText(/Выбрано/)).not.toBeInTheDocument();
    expect(await screen.findByRole('checkbox', { name: 'Выбрать все' })).toBeInTheDocument();
  });
});

describe('the actions under a ticked selection', () => {
  /* A_LIST's rows in order: ci1 (unpriced), cc1 (750 gold), q1 (unpriced). */
  const tickRow = async (n: number): Promise<void> => {
    await userEvent.click(screen.getByRole('checkbox', { name: ROW_NAMES[n]! }));
  };

  it('shows Цены and Удалить (N) once a row is ticked, and hides them again', async () => {
    await openA();
    expect(screen.queryByRole('button', { name: 'Цены' })).not.toBeInTheDocument();

    await tickRow(0);
    expect(screen.getByRole('button', { name: 'Цены' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить (1)' })).toBeInTheDocument();

    await tickRow(0);
    expect(screen.queryByRole('button', { name: 'Цены' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Удалить \(/ })).not.toBeInTheDocument();
  });

  it('holds four buttons in the batch bar, with no percentage widget', async () => {
    /* Ported from tests/lists2.js's own batch-bar shape check: the reprice
       percentage field lives in the separate .guess panel, not in
       .batch-acts alongside Цены/Скопировать/Удалить. */
    const { container } = await openA();
    await tickRow(0);
    const bar = container.querySelector('.batch-acts');
    expect(bar).toBeInTheDocument();
    expect(
      within(bar as HTMLElement)
        .getAllByRole('button')
        .map((b) => b.textContent)
    ).toEqual(['Цены', 'Скопировать', 'Скрыть от игроков (1)', 'Удалить (1)']);
    expect((bar as HTMLElement).querySelector('input')).toBeNull();
  });

  it('opens the panel on Цены and flips aria-expanded', async () => {
    await openA();
    await tickRow(0);
    const btn = screen.getByRole('button', { name: 'Цены' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/^В книге цен нет/)).not.toBeInTheDocument();

    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/^В книге цен нет/)).toBeInTheDocument();
  });

  it('shows the reprice row and the clear-price button only once a ticked row is priced', async () => {
    await openA();
    await tickRow(0); // ci1, unpriced
    await userEvent.click(screen.getByRole('button', { name: 'Цены' }));
    expect(screen.queryByText('Изменить на, %')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Убрать цену/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Проставить эти цены' })).toBeInTheDocument();

    await tickRow(1); // cc1, priced
    expect(screen.getByText('Изменить на, %')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Убрать цену (1)' })).toBeInTheDocument();
  });

  it('flips the reprice button’s label as the percentage’s own sign flips', async () => {
    const { container } = await openA();
    await tickRow(1); // cc1, priced
    await userEvent.click(screen.getByRole('button', { name: 'Цены' }));
    const panel = within(container.querySelector('.guess') as HTMLElement);
    expect(panel.getByRole('button', { name: 'Сделать скидку' })).toBeInTheDocument();

    const field = panel.getByRole('textbox', { name: 'Результат броска' });
    await userEvent.clear(field);
    await userEvent.type(field, '5');
    expect(panel.getByRole('button', { name: 'Поднять цену' })).toBeInTheDocument();
  });

  it('applies the guessed price, toasts, folds the panel, and undoes it', async () => {
    const { cloud, page } = await openA();
    await tickRow(0); // ci1: no eq, no rarity, no tier - the uncommon band, 150-250
    await userEvent.click(screen.getByRole('button', { name: 'Цены' }));
    await userEvent.click(screen.getByRole('button', { name: 'Проставить эти цены' }));

    expect(screen.getByText('Цены проставлены (1)')).toBeInTheDocument();
    expect(screen.queryByText(/^В книге цен нет/)).not.toBeInTheDocument(); // the panel folded
    expect((await readList(cloud, page, A_ID))?.meta?.['ci1']?.gold).toBe(200);

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect((await readList(cloud, page, A_ID))?.meta?.['ci1']?.gold).toBeUndefined();
  });

  it('reprices a ticked, priced row at -20% and undoes it', async () => {
    const { cloud, page } = await openA();
    await tickRow(1); // cc1, 750 gold
    await userEvent.click(screen.getByRole('button', { name: 'Цены' }));
    await userEvent.click(screen.getByRole('button', { name: 'Сделать скидку' }));

    expect(screen.getByText('Цены пересчитаны (-20%, 1)')).toBeInTheDocument();
    expect((await readList(cloud, page, A_ID))?.meta?.['cc1']?.gold).toBe(600);

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect((await readList(cloud, page, A_ID))?.meta?.['cc1']?.gold).toBe(750);
  });

  it('clears the price on a ticked, priced row and undoes it', async () => {
    const { cloud, page } = await openA();
    await tickRow(1); // cc1, 750 gold
    await userEvent.click(screen.getByRole('button', { name: 'Цены' }));
    await userEvent.click(screen.getByRole('button', { name: 'Убрать цену (1)' }));

    expect(screen.getByText('Убрать цену')).toBeInTheDocument();
    expect((await readList(cloud, page, A_ID))?.meta?.['cc1']?.gold).toBeUndefined();

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect((await readList(cloud, page, A_ID))?.meta?.['cc1']?.gold).toBe(750);
  });

  it('batch-deletes the ticked rows, clears the ticks, and undoes both back into place', async () => {
    const { cloud, page } = await openA();
    await tickRow(0); // ci1
    await tickRow(2); // q1 (cc1, index 1, stays)
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (2)' }));

    expect(screen.getByText('Убрано из списка (2)')).toBeInTheDocument();
    expect((await readList(cloud, page, A_ID))?.ids).toEqual(['cc1']);
    expect(screen.queryByRole('button', { name: 'Цены' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect((await readList(cloud, page, A_ID))?.ids).toEqual(['ci1', 'cc1', 'q1']);
    expect((await readList(cloud, page, A_ID))?.meta?.['cc1']?.gold).toBe(750);
  });

  it('has no violations with the money panel open and both a priced and an unpriced row ticked', async () => {
    const { container } = await openA();
    await tickRow(0);
    await tickRow(1);
    await userEvent.click(screen.getByRole('button', { name: 'Цены' }));
    await expectNoA11yViolations(container);
  });
});

describe('the taken count, the total and a partial removal', () => {
  /* A_LIST's rows in order: ci1 (unpriced), cc1 (x2 at 750 gold), q1 (unpriced). */
  const tickRow = async (n: number): Promise<void> => {
    await userEvent.click(screen.getByRole('checkbox', { name: ROW_NAMES[n]! }));
  };
  const takeOne = async (): Promise<void> => {
    const field = screen.getByRole('spinbutton', { name: 'Взять: Зелье' });
    await userEvent.clear(field);
    await userEvent.type(field, '1');
  };

  it('draws the count field at the stock under a ticked row over 1, and the total beside the count', async () => {
    const { container } = await openA();
    await tickRow(0);
    expect(screen.queryByRole('spinbutton', { name: /^Взять/ })).not.toBeInTheDocument();
    expect(container.querySelector('.batch-total')).not.toBeInTheDocument();

    await tickRow(1);
    expect(screen.getByRole('spinbutton', { name: 'Взять: Зелье' })).toHaveValue(2);
    expect(container.querySelector('.batch-total')).toHaveTextContent(
      'Итого: 1 сундук 5 мешков (без цены: 1)'
    );

    await tickRow(0);
    await takeOne();
    expect(container.querySelector('.batch-total')).toHaveTextContent(
      'Итого: 7 мешков 5 горстей'
    );
  });

  it('draws the take line inside the ticked row with its stock and line sum, and styles the row', async () => {
    const { container } = await openA();
    await tickRow(1);
    const row = container.querySelectorAll('.lrow')[1];
    expect(row).toHaveClass('sel');
    expect(container.querySelectorAll('.lrow')[0]).not.toHaveClass('sel');
    const take = row?.querySelector('.lrow-take');
    expect(take).toHaveTextContent('ВзятьМинМакс из 2 = 1 сундук 5 мешков');
    await takeOne();
    expect(take).toHaveTextContent('ВзятьМинМакс из 2 = 7 мешков 5 горстей');
    await expectNoA11yViolations(container);
  });

  it('shows the mixed select-all box and names entries and pieces apart in a live region', async () => {
    const { container } = await openA();
    const all = screen.getByRole('checkbox', { name: 'Выбрать все' });
    await tickRow(1);
    expect(all).toHaveProperty('indeterminate', true);
    expect(screen.getByRole('checkbox', { name: 'Выбрать все' })).toBe(all);
    const summ = container.querySelector('.batch-summ');
    expect(summ).toHaveAttribute('aria-live', 'polite');
    expect(summ).toHaveTextContent('Выбрана 1 позиция · 2 шт. Итого: 1 сундук 5 мешков');
    await tickRow(0);
    expect(summ).toHaveTextContent(
      'Выбрано 2 позиции · 3 шт. Итого: 1 сундук 5 мешков (без цены: 1)'
    );
    await tickRow(2);
    expect(all).toHaveProperty('indeterminate', false);
    expect(all).toBeChecked();
    await expectNoA11yViolations(container);
  });

  it('lowers a partly taken row, and one undo gives the stock back', async () => {
    const { cloud, page } = await openA();
    await tickRow(1);
    await takeOne();
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (1)' }));

    const l = await readList(cloud, page, A_ID);
    expect(l?.ids).toEqual(['ci1', 'cc1', 'q1']);
    expect(l?.meta?.['cc1']).toEqual({
      gold: 750,
      note: 'Светится в темноте',
      hnote: 'Проклят'
    });
    expect(screen.queryByRole('spinbutton', { name: /^Взять/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect((await readList(cloud, page, A_ID))?.meta?.['cc1']?.qty).toBe(2);
  });

  it('takes one piece of a ticked entry with «Мин»', async () => {
    const { container, cloud, page } = await openA();
    await tickRow(1);
    await userEvent.click(screen.getByRole('button', { name: 'Мин, взять 1: Зелье' }));
    expect(container.querySelector('.batch-summ')).toHaveTextContent(
      'Выбрана 1 позиция Итого: 7 мешков 5 горстей'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (1)' }));
    expect((await readList(cloud, page, A_ID))?.meta?.['cc1']?.qty).toBeUndefined();
    expect((await readList(cloud, page, A_ID))?.ids).toEqual(['ci1', 'cc1', 'q1']);
    await expectNoA11yViolations(container);
  });

  it('removes a whole row and lowers a partial one in one step, and undoes both into place', async () => {
    const { cloud, page } = await openA();
    await tickRow(0);
    await tickRow(1);
    await takeOne();
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (2)' }));

    expect(screen.getByText('Убрано из списка (2)')).toBeInTheDocument();
    expect((await readList(cloud, page, A_ID))?.ids).toEqual(['cc1', 'q1']);
    expect((await readList(cloud, page, A_ID))?.meta?.['cc1']?.qty).toBeUndefined();

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect(await readList(cloud, page, A_ID)).toMatchObject({
      ids: ['ci1', 'cc1', 'q1'],
      meta: { cc1: { qty: 2, gold: 750, note: 'Светится в темноте', hnote: 'Проклят' } },
      note: 'Лавка закрыта до утра',
      hnote: 'Не для игроков'
    });
  });

  it('copies the ticked rows with their taken counts and the total', async () => {
    const clip = fakeClipboard();
    await openA({ clipboard: clip });
    await tickRow(1);
    await tickRow(2);
    await takeOne();
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать' }));

    const index = buildIndex(LOOT);
    const rec = (id: string) => index.byId.get(id)!;
    const parts = [
      share(rec('cc1'), index, 'ru', { suffix: ' — ' + priceText(750, 'bag', 'ru') }),
      share(rec('q1'), index, 'ru')
    ];
    expect(clip.last.text).toBe(
      [...parts.map((p) => p.text), 'Итого: 7 мешков 5 горстей (без цены: 1)'].join('\n\n')
    );
    expect(screen.getByText('Выбранное скопировано')).toBeInTheDocument();
  });

  it('forgets the count when its row is unticked', async () => {
    await openA();
    await tickRow(1);
    await takeOne();
    await tickRow(1);
    await tickRow(1);
    expect(screen.getByRole('spinbutton', { name: 'Взять: Зелье' })).toHaveValue(2);
  });

  it('forgets the count on a navigation to another list and back, and when select-all clears', async () => {
    const { router } = await openA({}, A_HASH, [listOf(802, 'Другой', [{ key: 'q1' }])]);
    await tickRow(1);
    await takeOne();

    router.navigate('#/lists/' + uuid(802));
    await waitFor(() => {
      expect(screen.queryByRole('checkbox', { name: ROW_NAMES[1]! })).not.toBeInTheDocument();
    });
    router.navigate(A_HASH);
    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: ROW_NAMES[1]! })).toBeInTheDocument();
    });
    await tickRow(1);
    expect(screen.getByRole('spinbutton', { name: 'Взять: Зелье' })).toHaveValue(2);

    await takeOne();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
    await tickRow(1);
    expect(screen.getByRole('spinbutton', { name: 'Взять: Зелье' })).toHaveValue(2);
  });

  it('has no violations with the count field and the total on screen', async () => {
    const { container } = await openA();
    await tickRow(0);
    await tickRow(1);
    await takeOne();
    await expectNoA11yViolations(container);
  });
});

describe('a row', () => {
  it('moves on a committed position and resets on an out-of-range one', async () => {
    const { cloud, page } = await openA();
    const pos = screen.getAllByRole('spinbutton', { name: 'Позиция в списке' });
    expect(pos).toHaveLength(3);

    await userEvent.click(pos[2] as HTMLElement);
    await userEvent.clear(pos[2] as HTMLElement);
    await userEvent.type(pos[2] as HTMLElement, '1');
    await userEvent.tab();
    expect((await readList(cloud, page, A_ID))?.ids).toEqual(['q1', 'ci1', 'cc1']);

    const posAfter = screen.getAllByRole('spinbutton', { name: 'Позиция в списке' });
    await userEvent.click(posAfter[0] as HTMLElement);
    await userEvent.clear(posAfter[0] as HTMLElement);
    await userEvent.type(posAfter[0] as HTMLElement, '99');
    await userEvent.tab();
    expect((posAfter[0] as HTMLInputElement).value).toBe('1');
    expect((await readList(cloud, page, A_ID))?.ids).toEqual(['q1', 'ci1', 'cc1']);
  });

  it('stores qty and gold on input; the gold hint follows the price and vanishes in coin mode', async () => {
    const { cloud, page } = await openA();

    expect(screen.getByText('7 мешков 5 горстей')).toBeInTheDocument();

    const golds = screen.getAllByPlaceholderText('-');
    const goldForCc1 = golds[1] as HTMLElement; // ci1, cc1, q1 in that order
    await userEvent.clear(goldForCc1);
    await userEvent.type(goldForCc1, '231');
    expect((await readList(cloud, page, A_ID))?.meta?.['cc1']?.gold).toBe(231);

    await userEvent.click(screen.getByRole('button', { name: 'Монетами' }));
    expect(screen.queryByText(/мешк/)).not.toBeInTheDocument();
  });

  it('holds a typed quantity to 99', async () => {
    const { cloud, page } = await openA();
    const qty = screen.getAllByRole('spinbutton', { name: 'Кол-во' })[0] as HTMLElement;
    await userEvent.type(qty, '150');
    expect((await readList(cloud, page, A_ID))?.meta?.['ci1']?.qty).toBe(99);
    expect(qty).toHaveValue(99);
  });

  it('draws the held quantity back into the field when a key after 99 changes nothing stored', async () => {
    const { cloud, page } = await openA();
    const qty = screen.getAllByRole('spinbutton', { name: 'Кол-во' })[0] as HTMLElement;
    await userEvent.type(qty, '99');
    await userEvent.type(qty, '0');
    expect((await readList(cloud, page, A_ID))?.meta?.['ci1']?.qty).toBe(99);
    expect(qty).toHaveValue(99);
  });

  it('holds a negative quantity at none and empties the field', async () => {
    const { cloud, page } = await openA();
    const qty = screen.getAllByRole('spinbutton', { name: 'Кол-во' })[1] as HTMLElement;
    await fireEvent.input(qty, { target: { value: '-5' } });
    expect((await readList(cloud, page, A_ID))?.meta?.['cc1']?.qty).toBeUndefined();
    expect(qty).toHaveValue(null);
  });
});

describe('a row’s note', () => {
  it('opens on "Заметка", focuses the first textarea, and follows has-note', async () => {
    const { container } = await openA({}, '#/lists/' + uuid(805), [
      listOf(805, 'Без заметок', [{ key: 'ci1' }])
    ]);
    const toggle = screen.getByRole('button', { name: 'Заметка' });
    expect(container.querySelector('.lrow')).not.toHaveClass('has-note');

    await userEvent.click(toggle);
    const box = container.querySelector('.rnote');
    expect(box).toHaveProperty('hidden', false);
    const first = box?.querySelector('textarea');
    expect(first).toHaveFocus();

    await userEvent.type(first as HTMLElement, 'Спрятано под половицей');
    expect(container.querySelector('.lrow')).toHaveClass('has-note');
    expect(toggle).toHaveClass('on');
  });

  it('clears the box on the cross, toasts with an undo, and puts the text back', async () => {
    await openA();
    // cc1's own row, its public note field specifically (not the list's own).
    const rowMain = screen.getByRole('button', { name: /^Зелье/ });
    const row = rowMain.closest('.lrow') as HTMLElement;
    const pubField = row.querySelector('.n-pub') as HTMLElement;
    const clear = within(pubField).getByRole('button', { name: 'Очистить заметку' });
    const textarea = pubField.querySelector('textarea') as HTMLTextAreaElement;
    await userEvent.click(clear);
    expect(screen.getByText('Заметка очищена')).toBeInTheDocument();
    expect(textarea).toHaveValue('');

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect(screen.getByDisplayValue('Светится в темноте')).toBeInTheDocument();
  });

  it('draws a note box only on a row that has a note or was opened', async () => {
    const { container } = await openA();
    expect(container.querySelectorAll('.rnote')).toHaveLength(1);
    const bedroll = screen.getByRole('button', { name: /^Спальный мешок/ }).closest('.lrow');
    const toggle = within(bedroll as HTMLElement).getByRole('button', { name: 'Заметка' });
    await userEvent.click(toggle);
    expect(container.querySelectorAll('.rnote')).toHaveLength(2);
    await userEvent.click(toggle);
    expect(container.querySelectorAll('.rnote')).toHaveLength(1);
  });

  it('puts a cleared note back on undo when its box went with it', async () => {
    const { container, cloud, page } = await openA({}, '#/lists/' + uuid(806), [
      listOf(806, 'Одна заметка', [{ key: 'ci1', note: 'Под половицей' }])
    ]);
    const row = container.querySelector('.lrow') as HTMLElement;
    const pubField = row.querySelector('.n-pub') as HTMLElement;
    await userEvent.click(within(pubField).getByRole('button', { name: 'Очистить заметку' }));
    expect(row.querySelector('.rnote')).toBeNull();
    expect((await readList(cloud, page, uuid(806)))?.meta?.['ci1']?.note).toBeUndefined();
    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect(within(row).getByDisplayValue('Под половицей')).toBeInTheDocument();
    expect((await readList(cloud, page, uuid(806)))?.meta?.['ci1']?.note).toBe('Под половицей');
  });

  it('writes no note back on undo when another tab removed the entry', async () => {
    const { container, cloud, page } = await openA({}, '#/lists/' + uuid(807), [
      listOf(807, 'Две позиции', [{ key: 'ci1', note: 'Под половицей' }, { key: 'cc1' }])
    ]);
    const row = container.querySelector('.lrow') as HTMLElement;
    const pubField = row.querySelector('.n-pub') as HTMLElement;
    await userEvent.click(within(pubField).getByRole('button', { name: 'Очистить заметку' }));
    cloud.playRemove(uuid(807), 'ci1');
    await waitFor(() => {
      expect(container.querySelectorAll('.lrow')).toHaveLength(1);
    });
    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect((await readList(cloud, page, uuid(807)))?.ids).not.toContain('ci1');
  });

  it('sizes no note box on a keystroke in another field', async () => {
    const { container } = await openA();
    /* Past the boxes' own sizing at mount and the open fold's first `toggle` event. */
    await new Promise((r) => setTimeout(r, 0));
    const read = vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get');
    try {
      const gold = container.querySelector<HTMLElement>('input[data-gold]') as HTMLElement;
      await userEvent.type(gold, '12');
      const textareas = read.mock.contexts.filter((el) => el instanceof HTMLTextAreaElement);
      expect(textareas.map((el) => (el as HTMLElement).id)).toEqual([]);
    } finally {
      read.mockRestore();
    }
  });
});

describe('removing and undoing', () => {
  it('removes the row, toasts with the name and an undo, and restores order and meta', async () => {
    const { cloud, page } = await openA();
    const removes = screen.getAllByRole('button', { name: 'Убрать из списка' });
    await userEvent.click(removes[1] as HTMLElement); // cc1, the priced/noted one

    expect(screen.getByText('Убрано из списка: «Зелье»')).toBeInTheDocument();
    expect((await readList(cloud, page, A_ID))?.ids).toEqual(['ci1', 'q1']);

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect((await readList(cloud, page, A_ID))?.ids).toEqual(['ci1', 'cc1', 'q1']);
    expect((await readList(cloud, page, A_ID))?.meta?.['cc1']?.gold).toBe(750);
  });
});

describe('copying and sharing', () => {
  it('copies the list export written by shareList', async () => {
    const clip = fakeClipboard();
    const { cloud, page } = await openA({ clipboard: clip });
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать текст' }));
    expect(screen.getByText('Список скопирован')).toBeInTheDocument();

    const index = buildIndex(LOOT);
    const stored = await readList(cloud, page, A_ID);
    const { text } = shareList(stored!, index, 'ru', dict('ru'));
    expect(clip.last.text).toBe(text);
  });
});

describe("another tab's write, while this page is mounted", () => {
  /* The gap the dispatch named: no test fired a storage event into a mounted
     page, though the harness (`memoryStorage`'s own `fireExternalChange`)
     already existed for `state/lists.test.ts`. Closes it directly here;
     `listsPage.test.ts` closes it for the general reload trigger. */
  it('re-seeds an unfocused note field with another tab’s edit', async () => {
    const { cloud } = await openA();

    const rowMain = screen.getByRole('button', { name: /^Зелье/ });
    const row = rowMain.closest('.lrow') as HTMLElement;
    const pubField = within(row).getByPlaceholderText('Как предмет выглядит, что о нём знают');
    expect(pubField).toHaveValue('Светится в темноте');

    otherWrite(cloud, 'Правка из другой вкладки');

    await waitFor(() => {
      expect(pubField).toHaveValue('Правка из другой вкладки');
    });
  });

  it('leaves a focused field alone even though the store changed under it', async () => {
    const { cloud } = await openA();

    const rowMain = screen.getByRole('button', { name: /^Зелье/ });
    const row = rowMain.closest('.lrow') as HTMLElement;
    const pubField = within(row).getByPlaceholderText('Как предмет выглядит, что о нём знают');
    pubField.focus();

    otherWrite(cloud, 'Правка из другой вкладки');
    await tick();

    expect(pubField).toHaveValue('Светится в темноте');
  });

  const otherWrite = (cloud: FakeCloud, note: string): void => {
    cloud.playEntry(A_ID, 'cc1', { player_note: note });
  };

  it('keeps the typed text in a focused box when another tab writes', async () => {
    const { container, cloud } = await openA();
    const box = container.querySelector('#note-cc1-note') as HTMLTextAreaElement;
    box.focus();
    box.setSelectionRange(18, 18);
    await userEvent.keyboard(' и ');
    otherWrite(cloud, 'Правка из другой вкладки');
    await tick();
    await tick();
    expect(box).toHaveValue('Светится в темноте и ');
  });

  it("shows another tab's note when the focused box loses focus", async () => {
    const { container, cloud, page } = await openA();
    const box = container.querySelector('#note-cc1-note') as HTMLTextAreaElement;
    box.focus();
    box.setSelectionRange(18, 18);
    await userEvent.keyboard(' и ');
    /* The typed text is saved first: an unsent edit of the same field outlasts a later write. */
    await readList(cloud, page, A_ID);
    otherWrite(cloud, 'Правка из другой вкладки');
    await tick();
    expect(box).toHaveValue('Светится в темноте и ');
    box.blur();
    await waitFor(() => {
      expect(box).toHaveValue('Правка из другой вкладки');
    });
  });

  it('keeps the typed text in a box that loses focus with no other write', async () => {
    const { container } = await openA();
    const box = container.querySelector('#note-cc1-note') as HTMLTextAreaElement;
    box.focus();
    box.setSelectionRange(18, 18);
    await userEvent.keyboard(' и ');
    box.blur();
    await tick();
    expect(box).toHaveValue('Светится в темноте и ');
  });

  it('shows another tab’s note in a box without focus', async () => {
    const { container, cloud, page } = await openA();
    const box = container.querySelector('#note-cc1-note') as HTMLTextAreaElement;
    box.focus();
    box.setSelectionRange(18, 18);
    await userEvent.keyboard(' и ');
    box.blur();
    await readList(cloud, page, A_ID);
    otherWrite(cloud, 'Правка из другой вкладки');
    await waitFor(() => {
      expect(box).toHaveValue('Правка из другой вкладки');
    });
  });
});

describe('a row’s modal', () => {
  it('opens on the row body, and its copy text carries the entry’s players’ note', async () => {
    const clip = fakeClipboard();
    await openA({ clipboard: clip });
    await userEvent.click(screen.getByRole('button', { name: /^Зелье/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Скопировать текст' })
    );
    expect(clip.last.text ?? '').toContain('Светится в темноте');
  });

  it('carries neither the GM note, nor the price, nor ×qty', async () => {
    /* entryNoteBlock (lib/share.test.ts) already proves this at the unit
       level - this is the wiring proof, through the real modal, with cc1's
       full meta (qty 2, gold 750, a GM note) in play. */
    const clip = fakeClipboard();
    await openA({ clipboard: clip });
    await userEvent.click(screen.getByRole('button', { name: /^Зелье/ }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Скопировать текст' })
    );
    const text = clip.last.text ?? '';
    expect(text).not.toContain('Проклят');
    expect(text).not.toContain('750');
    expect(text).not.toContain('×2');
  });
});

describe('drag', () => {
  it('moves an entry through the port’s onDrop', async () => {
    const drag = fakeDrag();
    const { cloud, page } = await openA({ drag });
    drag.handlers?.onDrag?.(0);
    drag.handlers?.onDrop(0, 2);
    expect((await readList(cloud, page, A_ID))?.ids).toEqual(['cc1', 'q1', 'ci1']);
  });

  it('moves the entry the drag started with, even after another tab rewrote the list', async () => {
    const drag = fakeDrag();
    const { container, cloud, page } = await openA({ drag });
    const bound = drag.handlers;
    drag.handlers?.onDrag?.(1);

    cloud.playRemove(A_ID, 'ci1');
    await waitFor(() => {
      expect(container.querySelectorAll('.lrow')).toHaveLength(2);
    });
    expect(drag.handlers).toBe(bound);
    const dragging = container.querySelector('.lrow.dragging');
    expect(dragging).not.toBeNull();
    expect(within(dragging as HTMLElement).getByText('Зелье')).toBeInTheDocument();

    drag.handlers?.onDrop(1, 1);
    expect((await readList(cloud, page, A_ID))?.ids).toEqual(['q1', 'cc1']);
    await expectNoA11yViolations(container);
  });

  it('marks the grip draggable, so the browser actually fires dragstart', async () => {
    const { container } = await openA();
    expect(container.querySelector('.lrow-grip')).toHaveAttribute('draggable', 'true');
  });

  it('follows the port’s onDrag/onOver/onEnd with the dragging/drop-before/drop-after classes, both sides of the gap', async () => {
    const drag = fakeDrag();
    const { container } = await openA({ drag });
    const rowAt = (i: number): HTMLElement =>
      container.querySelectorAll('.lrow')[i] as HTMLElement;

    drag.handlers?.onDrag?.(0);
    await tick();
    expect(rowAt(0)).toHaveClass('dragging');
    expect(rowAt(1)).not.toHaveClass('dragging');

    /* The list's own edges have one side only - nothing sits past either end
       for its partner to light. */
    drag.handlers?.onOver?.(2, 'after');
    await tick();
    expect(rowAt(2)).toHaveClass('drop-after');
    expect(rowAt(2)).not.toHaveClass('drop-before');
    expect(rowAt(0)).not.toHaveClass('drop-after');
    expect(rowAt(1)).not.toHaveClass('drop-before');

    drag.handlers?.onOver?.(-1, null);
    await tick();
    expect(rowAt(2)).not.toHaveClass('drop-after');

    drag.handlers?.onEnd?.();
    await tick();
    expect(rowAt(0)).not.toHaveClass('dragging');

    /* The symmetric top edge: dragging a later row, a gap at 0 lights row 0
       alone - there is no row above it for a partner. */
    drag.handlers?.onDrag?.(2);
    drag.handlers?.onOver?.(0, 'before');
    await tick();
    expect(rowAt(0)).toHaveClass('drop-before');
    expect(rowAt(0)).not.toHaveClass('drop-after');
    expect(rowAt(1)).not.toHaveClass('drop-after');
    expect(rowAt(2)).not.toHaveClass('drop-before');

    drag.handlers?.onOver?.(-1, null);
    drag.handlers?.onEnd?.();
    await tick();

    /* "after 1" and "before 2" are one insertion point, so both rows beside
       the gap light at once. */
    drag.handlers?.onDrag?.(0);
    drag.handlers?.onOver?.(1, 'after');
    await tick();
    expect(rowAt(1)).toHaveClass('drop-after');
    expect(rowAt(1)).not.toHaveClass('drop-before');
    expect(rowAt(2)).toHaveClass('drop-before');

    /* Feeding the port's own callbacks directly (via fakeDrag) drives the
       derivation past what the real port would ever report here: row 0 is
       still marked `dragging` from the `onDrag(0)` above, and the real port
       never reports a mark on either gap touching the dragged row (both
       resolve to `onOver(-1, null)`), so `dragging` and `drop-after` on the
       same row is not a reachable combination - only the class derivation is
       under test. */
    drag.handlers?.onOver?.(1, 'before');
    await tick();
    expect(rowAt(1)).toHaveClass('drop-before');
    expect(rowAt(1)).not.toHaveClass('drop-after');
    expect(rowAt(0)).toHaveClass('drop-after');

    await expectNoA11yViolations(container);
  });
});

describe('announcing a reorder', () => {
  /* The account page draws a second status region after this one, for the save state. */
  const reorderRegion = (): HTMLElement =>
    screen
      .getAllByRole('status')
      .find((el) => el.nextElementSibling?.getAttribute('role') === 'status') as HTMLElement;

  /* Both movers funnel through store.move(), which answers "did anything
     move" - the live region fires on true and stays silent on false. */
  it('announces a drag that lands an entry elsewhere, and stays silent for a no-op drop', async () => {
    const drag = fakeDrag();
    const { container } = await openA({ drag });
    const region = reorderRegion();
    expect(region).toHaveTextContent('');

    drag.handlers?.onDrag?.(0);
    drag.handlers?.onDrop(0, 0);
    await tick();
    expect(region).toHaveTextContent('');

    drag.handlers?.onDrag?.(0);
    drag.handlers?.onDrop(0, 2);
    await tick();
    expect(region).toHaveTextContent('«Спальный мешок» - позиция 3 из 3');

    await expectNoA11yViolations(container);
  });

  it('clears the announcement when history moves to a different list', async () => {
    const drag = fakeDrag();
    const { router, container } = await openA({ drag }, A_HASH, [
      listOf(802, 'Другой', [{ key: 'q1' }])
    ]);

    drag.handlers?.onDrag?.(0);
    drag.handlers?.onDrop(0, 2);
    await tick();
    expect(reorderRegion()).toHaveTextContent('позиция 3 из 3');

    router.navigate('#/lists/' + uuid(802));
    await waitFor(() => {
      expect(sub(container)).toMatch(/^1 позиция/);
    });
    expect(reorderRegion()).toHaveTextContent('');
  });

  it('announces a committed position that moves a row, and stays silent when the position is its own', async () => {
    await openA();
    const region = reorderRegion();

    const pos = screen.getAllByRole('spinbutton', { name: 'Позиция в списке' });
    await userEvent.click(pos[0] as HTMLElement);
    await userEvent.clear(pos[0] as HTMLElement);
    await userEvent.type(pos[0] as HTMLElement, '1');
    await userEvent.tab();
    expect(region).toHaveTextContent(''); // ci1 was already position 1

    const posAfter = screen.getAllByRole('spinbutton', { name: 'Позиция в списке' });
    await userEvent.click(posAfter[2] as HTMLElement);
    await userEvent.clear(posAfter[2] as HTMLElement);
    await userEvent.type(posAfter[2] as HTMLElement, '1');
    await userEvent.tab();
    expect(region).toHaveTextContent('«Меч» - позиция 1 из 3');
  });

  it('announces the same typed move in English under dhloot.lang.v1: en', async () => {
    await openA({ storage: memoryStorage({ 'dhloot.lang.v1': 'en' }) });
    const region = reorderRegion();

    const pos = screen.getAllByRole('spinbutton', { name: 'Position in the list' });
    await userEvent.click(pos[2] as HTMLElement);
    await userEvent.clear(pos[2] as HTMLElement);
    await userEvent.type(pos[2] as HTMLElement, '1');
    await userEvent.tab();
    expect(region).toHaveTextContent('"Sword" - position 1 of 3');
  });
});

describe('no data', () => {
  it('draws the paragraph, signed in, rather than the list or a broken page', async () => {
    render(App, {
      env: fakeEnv({
        router: memoryRouter('#/lists/' + uuid(101)),
        data: noData(),
        cloud: fakeCloud(SEED, 'gm1')
      })
    });
    await screen.findByRole('button', { name: 'Аккаунт: gm1@example.test' });
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Название списка' })).toBeNull();
    expect(document.querySelectorAll('.lrow')).toHaveLength(0);
  });
});

describe('the note boxes', () => {
  const pubOf = (container: HTMLElement): HTMLElement =>
    container.querySelector('.lnote .n-pub') as HTMLElement;

  it('names each note box by its label and its line', async () => {
    await openA();
    const pub = screen.getAllByRole('textbox', { name: 'Для игроков' });
    const hid = screen.getAllByRole('textbox', { name: 'Только для мастера' });
    /* The list's pair and the noted entry's pair. */
    expect(pub).toHaveLength(2);
    expect(hid).toHaveLength(2);
    for (const box of pub)
      expect(box).toHaveAccessibleDescription('уедет с текстом и ссылкой для игроков');
    for (const box of hid) expect(box).toHaveAccessibleDescription('останется у вас');
    expect(pub[0]).toHaveValue('Лавка закрыта до утра');
    expect(pub[0]).toHaveAttribute('id', 'note-list-note');
    expect(hid[1]).toHaveAttribute('id', 'note-cc1-hnote');
  });

  it('draws the toolbar, «Просмотр» and the «?» on each note box', async () => {
    const { container } = await openA({}, '#/lists/' + uuid(808), [
      listOf(808, 'Тайник', A_ENTRIES, { note: '**Лавка** закрыта', hnote: 'Не для игроков' })
    ]);
    for (const name of ['Для игроков', 'Только для мастера']) {
      expect(screen.getAllByRole('toolbar', { name: `Оформление: ${name}` })).toHaveLength(2);
      expect(screen.getAllByRole('button', { name: `Подсказка: ${name}` })).toHaveLength(2);
    }
    const pub = pubOf(container);
    const bar = within(pub).getByRole('toolbar');
    for (const name of ['Жирный', 'Курсив', 'Список', 'Нумерованный список', 'Просмотр'])
      expect(within(bar).getByRole('button', { name })).toBeInTheDocument();
    expect(within(bar).queryByRole('button', { name: 'Таблица' })).toBeNull();

    await userEvent.click(within(bar).getByRole('button', { name: 'Просмотр' }));
    const pane = within(pub).getByRole('region', { name: 'Просмотр: Для игроков' });
    expect(pane.querySelector('b')).toHaveTextContent('Лавка');
    await expectNoA11yViolations(container);
  });

  it('opens the note hint under its label', async () => {
    const { container } = await openA();
    const pub = pubOf(container);
    const help = within(pub).getByRole('button', { name: 'Подсказка: Для игроков' });
    const hint = pub.querySelector('#note-list-note-help') as HTMLElement;
    expect(hint).not.toBeVisible();
    expect(help).toHaveAttribute('aria-controls', 'note-list-note-help');
    await userEvent.click(help);
    expect(help).toHaveAttribute('aria-expanded', 'true');
    expect(hint).toBeVisible();
    expect(hint.textContent).toBe(dict('ru').mdHelp.replace('%n', '4000'));
    /* Only the pressed box's hint opens. */
    expect(container.querySelector('#note-list-hnote-help')).not.toBeVisible();
    await expectNoA11yViolations(container);
  });

  it('keeps a typed trailing space in the box while the store trims it', async () => {
    const { container, cloud, page } = await openA();
    const box = container.querySelector('#note-cc1-note') as HTMLTextAreaElement;
    box.focus();
    box.setSelectionRange(18, 18);
    await userEvent.keyboard(' и ');
    expect(box).toHaveFocus();
    expect(box).toHaveValue('Светится в темноте и ');
    expect((await readList(cloud, page, A_ID))?.meta?.['cc1']?.note).toBe(
      'Светится в темноте и'
    );
  });
});

describe('accessibility', () => {
  it('has no violations on the page as it stands, priced and noted', async () => {
    const { container } = await openA();
    await expectNoA11yViolations(container);
  });

  it('has no violations with the roll panel open and a hit shown', async () => {
    const { container } = await openA();
    await userEvent.click(screen.getByText('Бросок по списку'));
    await userEvent.click(screen.getByRole('button', { name: 'На единицу больше' }));
    await expectNoA11yViolations(container);
  });
});

describe('an account list', () => {
  it('counts its entries against the entry limit, and bare when the limit read failed', async () => {
    const { container } = openAs(fakeCloud(SEED, 'gm1', { limits: { entries: 4 } }));
    await screen.findByRole('textbox', { name: 'Название списка' });
    expect(sub(container)).toBe('10 позиций из 4 · Сохранено');
    cleanup();
    const cloud = fakeCloud(SEED, 'gm1');
    const read = cloud.lists.list.bind(cloud.lists);
    cloud.lists.list = async () => {
      const r = await read();
      return r.ok ? { ...r, entryLimit: null } : r;
    };
    const bare = openAs(cloud);
    await screen.findByRole('textbox', { name: 'Название списка' });
    expect(sub(bare.container)).toBe('10 позиций · Сохранено');
  });

  const STANDINS = withStandins(LOOT);

  it('counts its entries at the limit and at three times the limit', async () => {
    const full = openAs(await filled(90, 100), SHOP, { data: fakeData(STANDINS) });
    await screen.findByRole('textbox', { name: 'Название списка' });
    await waitFor(() => {
      expect(sub(full.container)).toBe('100 позиций из 100 · Сохранено');
    });
    cleanup();
    const big = openAs(await filled(290, 300), SHOP, { data: fakeData(STANDINS) });
    await screen.findByRole('textbox', { name: 'Название списка' });
    await waitFor(() => {
      expect(sub(big.container)).toBe('300 позиций из 300 · Сохранено');
    });
  });

  /* gm1's shop as LOOT knows it: ci1, q1, cc1 and the homebrew axe. */
  const gmOnlyOf = async (cloud: CloudPort, key: string): Promise<boolean | undefined> => {
    const read = await cloud.lists.rows([uuid(101)]);
    const shop = read.ok ? read.lists.find((l) => l.id === uuid(101)) : undefined;
    return shop?.list_entries.find((e) => e.item_key === key)?.gm_only;
  };

  it('draws the GM-only eye between «Заметка» and «Убрать из списка», and a press marks the entry with no toast', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { container, page } = openAs(cloud);
    await screen.findByRole('textbox', { name: 'Название списка' });
    const eye = screen.getByRole('button', { name: 'Только для мастера: Спальный мешок' });
    const acts = [...(eye.parentElement?.children ?? [])].map((b) =>
      b.getAttribute('aria-label')
    );
    expect(acts).toEqual(['Заметка', 'Только для мастера: Спальный мешок', 'Убрать из списка']);
    expect(eye).toHaveAttribute('aria-pressed', 'false');
    expect(eye).toHaveAttribute('title', 'Только для мастера');
    expect(sub(container)).toBe('10 позиций из 100 · Сохранено');
    const row = eye.closest('.lrow');
    expect(row).not.toHaveClass('gm-only');
    const icon = eye.innerHTML;

    await userEvent.click(eye);
    expect(eye).toHaveAttribute('aria-pressed', 'true');
    expect(row).toHaveClass('gm-only');
    expect(eye.innerHTML).not.toBe(icon);
    expect(row?.querySelector('.row-main')?.textContent).toContain(
      'Спальный мешок, Только для мастера'
    );
    expect(sub(container)).toMatch(/^10 позиций из 100 · только для мастера: 1 · /);
    expect(screen.queryByRole('button', { name: 'Вернуть' })).not.toBeInTheDocument();
    page.fireHidden();
    await waitFor(async () => {
      expect(await gmOnlyOf(cloud, 'ci1')).toBe(true);
    });
    await waitFor(() => {
      expect(sub(container)).toBe('10 позиций из 100 · только для мастера: 1 · Сохранено');
    });
    await expectNoA11yViolations(container);

    await userEvent.click(eye);
    expect(eye).toHaveAttribute('aria-pressed', 'false');
    expect(eye.innerHTML).toBe(icon);
    expect(row).not.toHaveClass('gm-only');
    expect(row?.querySelector('.row-main')?.textContent).not.toContain('Только для мастера');
    page.fireHidden();
    await waitFor(async () => {
      expect(await gmOnlyOf(cloud, 'ci1')).toBe(false);
    });
    await waitFor(() => {
      expect(sub(container)).toBe('10 позиций из 100 · Сохранено');
    });
    expect(screen.queryByRole('button', { name: 'Вернуть' })).not.toBeInTheDocument();
  });

  it('hides the ticked entries from players from the bar, keeps the ticks, and undoes only what it changed', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { container, page } = openAs(cloud);
    await screen.findByRole('textbox', { name: 'Название списка' });
    await userEvent.click(screen.getByRole('button', { name: 'Только для мастера: Меч' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Спальный мешок' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Меч' }));
    const bar = container.querySelector('.batch-acts') as HTMLElement;
    expect(
      within(bar)
        .getAllByRole('button')
        .map((b) => b.textContent.trim())
    ).toEqual(['Цены', 'Скопировать', 'Скрыть от игроков (2)', 'Удалить (2)']);
    await expectNoA11yViolations(container);

    await userEvent.click(screen.getByRole('button', { name: 'Скрыть от игроков (2)' }));
    expect(screen.getByText('Скрыто от игроков: 1')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Спальный мешок' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Меч' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Показать игрокам (2)' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Только для мастера: Спальный мешок' })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(sub(container)).toMatch(/только для мастера: 2/);
    page.fireHidden();
    await waitFor(async () => {
      expect(await gmOnlyOf(cloud, 'ci1')).toBe(true);
    });

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect(
      screen.getByRole('button', { name: 'Только для мастера: Спальный мешок' })
    ).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Только для мастера: Меч' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    page.fireHidden();
    await waitFor(async () => {
      expect(await gmOnlyOf(cloud, 'ci1')).toBe(false);
    });
    expect(await gmOnlyOf(cloud, 'q1')).toBe(true);
  });

  it('shows the ticked entries to players when every ticked entry is GM-only', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { container, page } = openAs(cloud);
    await screen.findByRole('textbox', { name: 'Название списка' });
    await userEvent.click(screen.getByRole('button', { name: 'Только для мастера: Меч' }));
    await userEvent.click(screen.getByRole('button', { name: 'Только для мастера: Зелье' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Меч' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Зелье' }));
    await userEvent.click(screen.getByRole('button', { name: 'Показать игрокам (2)' }));
    expect(screen.getByText('Показано игрокам: 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Скрыть от игроков (2)' })).toBeInTheDocument();
    expect(container.querySelectorAll('.lrow.gm-only')).toHaveLength(0);
    page.fireHidden();
    await waitFor(async () => {
      expect(await gmOnlyOf(cloud, 'q1')).toBe(false);
    });
    expect(await gmOnlyOf(cloud, 'cc1')).toBe(false);
    await waitFor(() => {
      expect(sub(container)).toBe('10 позиций из 100 · Сохранено');
    });
    await expectNoA11yViolations(container);
  });

  it('counts the GM-only entries at the limit', async () => {
    const full = openAs(await filled(90, 100, true), SHOP, { data: fakeData(STANDINS) });
    await screen.findByRole('textbox', { name: 'Название списка' });
    await waitFor(() => {
      expect(sub(full.container)).toBe(
        '100 позиций из 100 · только для мастера: 90 · Сохранено'
      );
    });
  });

  it('stops the name at 200 characters and each note at 4000', async () => {
    const { container } = openAs(fakeCloud(SEED, 'gm1'));
    const input = await screen.findByRole('textbox', { name: 'Название списка' });
    expect(input).toHaveAttribute('maxlength', '200');
    const notes = [...container.querySelectorAll('.npair textarea')];
    expect(notes.length).toBeGreaterThan(0);
    for (const n of notes) expect(n).toHaveAttribute('maxlength', '4000');
  });

  it('keeps its address, draws no link buttons and no notice, and says saved', async () => {
    const { container, router } = openAs(fakeCloud(SEED, 'gm1'));
    const input = await screen.findByRole('textbox', { name: 'Название списка' });
    expect(input).toHaveValue('Лавка кузнеца');
    expect(sub(container)).toBe('10 позиций из 100 · Сохранено');
    expect(screen.queryByRole('button', { name: 'Ссылка игрокам' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ссылка себе' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Скопировать текст' })).toBeInTheDocument();
    expect(screen.queryByText('Списки живут только в этом браузере.')).not.toBeInTheDocument();
    await userEvent.type(input, '!');
    await new Promise((r) => setTimeout(r, 200));
    expect(router.hash()).toBe(SHOP);
    await expectNoA11yViolations(container);
  });

  it("marks the sync status live once the owner's topic joins, and not while Realtime is down", async () => {
    const live = openAs(fakeCloud(SEED, 'gm1'));
    await screen.findByRole('textbox', { name: 'Название списка' });
    const sync = (c: HTMLElement): Element | undefined =>
      [...c.querySelectorAll('.said')].at(-1);
    await waitFor(() => {
      expect(sync(live.container)).toHaveAttribute('data-live', 'live');
    });
    await expectNoA11yViolations(live.container);
    cleanup();
    const down = openAs(fakeCloud(SEED, 'gm1', { live: false }));
    await screen.findByRole('textbox', { name: 'Название списка' });
    expect(sync(down.container)).not.toHaveAttribute('data-live');
    await expectNoA11yViolations(down.container);
  });

  it('draws Поделиться and folds its panel', async () => {
    const clipboard = fakeClipboard();
    const { container } = openAs(fakeCloud(SEED, 'gm1'), SHOP, { clipboard });
    const share = await screen.findByRole('button', { name: 'Поделиться' });
    expect(share).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(share);
    expect(share).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByText('Ссылка для игроков')).toBeInTheDocument();
    for (const b of screen.getAllByRole('button', { name: 'Скопировать' })) {
      await userEvent.click(b);
      expect(clipboard.last.text).not.toContain('#/l/');
    }
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать текст' }));
    expect(clipboard.last.text).not.toContain('#/l/');
    await expectNoA11yViolations(container);
    await userEvent.click(share);
    expect(screen.queryByText('Ссылка для игроков')).not.toBeInTheDocument();
  });

  it('downloads an account list as its own file from «Скачать JSON», after «Скопировать текст»', async () => {
    const image = fakeImage();
    const { container } = openAs(fakeCloud(SEED, 'gm1'), SHOP, { image });
    const button = await screen.findByRole('button', { name: 'Скачать JSON' });
    const row = [...(button.parentElement?.children ?? [])].map((b) => b.textContent.trim());
    expect(row.indexOf('Скачать JSON')).toBe(row.indexOf('Скопировать текст') + 1);
    await userEvent.click(button);
    await waitFor(() => {
      expect(image.downloaded.map((d) => d.filename)).toEqual(['Лавка кузнеца.json']);
    });
    const text = await image.downloaded[0]!.blob.text();
    expect(
      (JSON.parse(text) as { lists: { name: string }[] }).lists.map((l) => l.name)
    ).toEqual(['Лавка кузнеца']);
    await expectNoA11yViolations(container);
  });

  it('draws the requests panel after the action row and an open share panel, before the money row', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    cloud.request('player-token-1', [{ item: 'ci1', qty: 1 }]);
    const { container } = openAs(cloud);
    const panel = (await screen.findByRole('heading', { name: 'Новое в списке (1)' }))
      .parentElement!;
    await userEvent.click(screen.getByRole('button', { name: 'Поделиться' }));
    const shares = (await screen.findByText('Ссылка для игроков')).closest('div')!;
    const money = container.querySelector('.money')!;
    const after = Node.DOCUMENT_POSITION_FOLLOWING;
    expect(shares.compareDocumentPosition(panel) & after).toBe(after);
    expect(panel.compareDocumentPosition(money) & after).toBe(after);
    await expectNoA11yViolations(container);
  });

  it('says saving from the first buffered edit until the write lands, then saved', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    let answer: (w: ListWrites) => void = () => undefined;
    const sent = vi.fn();
    cloud.lists.apply = (ops) => {
      sent(ops);
      return new Promise((r) => {
        answer = r;
      });
    };
    const { container, page } = openAs(cloud);
    const saving = () => container.querySelector('.sync')?.hasAttribute('data-saving');
    await userEvent.type(await screen.findByRole('textbox', { name: 'Название списка' }), '!');
    expect(sub(container)).toBe('10 позиций из 100 · Сохраняем...');
    expect(saving()).toBe(true);
    expect(sent).not.toHaveBeenCalled();
    page.fireHidden();
    await waitFor(() => {
      expect(sent).toHaveBeenCalledOnce();
    });
    expect(saving()).toBe(true);
    answer({ ok: true, results: [{ ok: true }] });
    await waitFor(() => {
      expect(sub(container)).toBe('10 позиций из 100 · Сохранено');
    });
    expect(saving()).toBe(false);
    await expectNoA11yViolations(container);
  });

  it('says not saved offline, keeps the edit, and announces the retry that saves it', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { container, page } = openAs(cloud);
    const input = await screen.findByRole('textbox', { name: 'Название списка' });
    cloud.setOffline(true);
    await userEvent.type(input, '!');
    page.fireHidden();
    await waitFor(() => {
      expect(sub(container)).toBe('10 позиций из 100 · Не сохраненоПовторить');
    });
    expect(input).toHaveValue('Лавка кузнеца!');
    const status = [...container.querySelectorAll('.said')].map((s) => s.textContent.trim());
    expect(status).toContain('Не сохранено');
    await expectNoA11yViolations(container);
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await waitFor(() => {
      expect(sub(container)).toBe('10 позиций из 100 · Сохранено');
    });
    const said = () =>
      [...container.querySelectorAll('.said')].map((s) => s.textContent.trim());
    expect(said()).toContain('Сохранено');
    const read = await cloud.lists.list();
    expect(read.ok && read.lists.find((l) => l.name === 'Лавка кузнеца!')).toBeTruthy();
    await userEvent.type(input, '?');
    await waitFor(() => {
      expect(said()).not.toContain('Сохранено');
    });
  });

  it('deletes after a confirm that names its links, back on the index, with no undo', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { router, dialog, page } = openAs(cloud);
    await screen.findByRole('textbox', { name: 'Название списка' });
    await userEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    page.fireHidden();
    expect(dialog.asked).toEqual([
      'Удалить список «Лавка кузнеца»? Ссылки для игроков и мастера перестанут работать. Отменить удаление нельзя.'
    ]);
    expect(router.hash()).toBe('#/lists');
    expect(screen.getByText('Список «Лавка кузнеца» удалён')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Вернуть' })).not.toBeInTheDocument();
    await waitFor(async () => {
      const read = await cloud.lists.list();
      expect(read.ok && read.lists.map((l) => l.name)).not.toContain('Лавка кузнеца');
    });
  });

  it('keeps the list when the delete is refused', async () => {
    const { router } = openAs(fakeCloud(SEED, 'gm1'), SHOP, { dialog: fakeDialog(false) });
    await screen.findByRole('textbox', { name: 'Название списка' });
    await userEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(router.hash()).toBe(SHOP);
  });

  it('asks a signed-out reader to sign in, and «Войти» opens the account page', async () => {
    const { container, router } = openAs(fakeCloud(SEED));
    expect(
      await screen.findByText('Если это список из вашего аккаунта, войдите, чтобы открыть его.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Список не найден' })
    ).toBeInTheDocument();
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
    expect(router.hash()).toBe('#/account');
  });

  it('draws nothing while the account answers, and a failed read as «Список не загрузился» with a retry', async () => {
    const pending = fakeCloud(SEED);
    pending.auth.session = () => new Promise(() => undefined);
    openAs(pending);
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    cleanup();

    const cloud = fakeCloud(SEED, 'gm1', { offline: true });
    const { container } = openAs(cloud);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не получилось загрузить списки аккаунта.'
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Список не загрузился' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Список не найден')).toBeNull();
    await expectNoA11yViolations(container);
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByRole('textbox', { name: 'Название списка' })).toHaveValue(
      'Лавка кузнеца'
    );
  });

  it("draws today's not-found page for an id the account does not hold", async () => {
    openAs(fakeCloud(SEED, 'gm2'));
    expect(
      await screen.findByText('Возможно, он удалён или открыт в другом браузере.')
    ).toBeInTheDocument();
  });
});

describe('a toast and a language switch', () => {
  it('redraws the removed row toast in the language switched to, with the record name in it', async () => {
    await openA();
    const removes = screen.getAllByRole('button', { name: 'Убрать из списка' });
    await userEvent.click(removes[1] as HTMLElement);
    expect(screen.getByText('Убрано из списка: «Зелье»')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByText('"Potion" removed from the list')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });
});

describe('homebrew entries', () => {
  /* jsdom does not implement scrollIntoView, which the record modal's add-to-list menu
     calls once it opens. */
  Element.prototype.scrollIntoView = vi.fn();
  const SHOP_ID = '00000000-0000-4000-8000-000000000101';
  const GM2_ID = '00000000-0000-4000-8000-000000000201';
  const AXE = 'hb_emberaxeaaaaaaaa';
  const open = (cloud: CloudPort, id: string) => {
    const page = fakePage();
    const storage = memoryStorage();
    const view = render(App, {
      env: at('#/lists/' + id, { router: memoryRouter('#/lists/' + id), cloud, page, storage })
    });
    return { ...view, page, storage };
  };
  /* The list's entries as the server holds them. */
  async function entries(cloud: CloudPort, id: string) {
    const read = await cloud.lists.rows([id]);
    return (read.ok ? read.lists.find((l) => l.id === id) : undefined)?.list_entries ?? [];
  }
  const axeRow = (): HTMLElement =>
    screen
      .getByRole('button', { name: /^Топор Тлеющих Углей/ })
      .closest('.lrow') as HTMLElement;

  it('draws an own item live: an edit of it redraws the row', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { storage } = open(cloud, SHOP_ID);
    expect(
      await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ })
    ).toBeInTheDocument();
    const axe = SEED.homebrew.gm1.items.find((i) => i.key === AXE);
    await cloud.homebrew.updateItem(
      '00000000-0000-4000-8000-000000000511',
      { content: { ...axe!.content, ru: 'Топор Пепла' }, book_id: axe!.bookId ?? null },
      null
    );
    /* The tab is shown again: the account's items are read again. */
    storage.fireExternalChange(null);
    expect(await screen.findByRole('button', { name: /^Топор Пепла/ })).toBeInTheDocument();
  });

  it("draws the picture of another account's linked item on its row", async () => {
    open(fakeCloud(SEED, 'gm2'), GM2_ID);
    await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ });
    expect(axeRow().querySelector('img')?.getAttribute('src')).toBe('/img/thumb/ci1.webp');
  });

  it("offers «Изменить» in the modal for an own item, and not for another account's", async () => {
    open(fakeCloud(SEED, 'gm1'), SHOP_ID);
    await userEvent.click(await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ }));
    expect(
      within(screen.getByRole('dialog')).getByRole('link', { name: 'Изменить' })
    ).toHaveAttribute('href', '/homebrew/' + AXE);
    cleanup();
    const { container } = open(fakeCloud(SEED, 'gm2'), GM2_ID);
    await userEvent.click(await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Мастерская Ольхи/)).toBeInTheDocument();
    expect(within(dialog).queryByRole('link', { name: 'Изменить' })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it("undoes a removed link to another account's item from the row, the bar and the list menu", async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const { page } = open(cloud, GM2_ID);
    await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ });
    const before = (await entries(cloud, GM2_ID))[1]?.hb_item;
    expect(before).toBe('00000000-0000-4000-8000-000000000511');
    const same = async (): Promise<void> => {
      page.fireHidden();
      await waitFor(async () => {
        const axe = (await entries(cloud, GM2_ID)).find((e) => e.item_key === AXE);
        expect(axe).toMatchObject({ item_key: AXE, source: 'homebrew' });
        expect(axe?.hb_item).toBe(before);
      });
    };
    await userEvent.click(within(axeRow()).getByRole('button', { name: 'Убрать из списка' }));
    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    await same();
    await userEvent.click(within(axeRow()).getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (1)' }));
    expect(
      screen.queryByRole('button', { name: /^Топор Тлеющих Углей/ })
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    await same();
    await userEvent.click(screen.getByRole('button', { name: /^Топор Тлеющих Углей/ }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Список второго ГМа' }));
    /* The record left the page with its row, so its modal closes; the undo stays. */
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    await same();
  });

  it('undoes a removed own link as a link to the same item', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { page } = open(cloud, SHOP_ID);
    await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ });
    await userEvent.click(within(axeRow()).getByRole('button', { name: 'Убрать из списка' }));
    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    page.fireHidden();
    await waitFor(async () => {
      expect((await entries(cloud, SHOP_ID)).find((e) => e.item_key === AXE)).toMatchObject({
        item_key: AXE,
        source: 'homebrew',
        hb_item: '00000000-0000-4000-8000-000000000511',
        price_coins: 800
      });
    });
  });

  it('draws «Свой предмет» and the empty hint points at it', async () => {
    const { container } = open(fakeCloud(SEED, 'gm1'), '00000000-0000-4000-8000-000000000102');
    const row = await screen.findByRole('button', { name: 'Свой предмет' });
    expect(row).toHaveAttribute('aria-expanded', 'false');
    const hint = screen.getByText(/Свой предмет можно создать здесь же, кнопкой ниже\./);
    expect(hint.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await expectNoA11yViolations(container);
  });

  it('draws «Свой предмет» as a row after the last entry, not among the actions', async () => {
    const { container } = open(fakeCloud(SEED, 'gm1'), SHOP_ID);
    const row = await screen.findByRole('button', { name: 'Свой предмет' });
    const share = screen.getByRole('button', { name: 'Поделиться' });
    expect(share.parentElement?.contains(row)).toBe(false);
    const rows = container.querySelectorAll('.lrow');
    const last = rows[rows.length - 1] as HTMLElement;
    expect(last.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(last.closest('.lrows')?.contains(row)).toBe(false);
    expect(row).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('region', { name: 'Свой предмет в этот список' });
    expect(row.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    /* A new item's entry lands last, right above the row. */
    await userEvent.type(
      within(panel).getByRole('textbox', { name: 'Название*' }),
      'Фляга{Enter}'
    );
    const made = await screen.findByRole('button', { name: /^Фляга/ });
    const after = container.querySelectorAll('.lrow');
    expect(after.length).toBe(rows.length + 1);
    expect(after[after.length - 1]?.contains(made)).toBe(true);
    await expectNoA11yViolations(container);
  });
});

describe('every stored entry of an account list', () => {
  Element.prototype.scrollIntoView = vi.fn();
  const GM2_ID = uuid(201);
  const AXE = 'hb_emberaxeaaaaaaaa';
  const open = (cloud: CloudPort, id: string) =>
    render(App, { env: at('#/lists/' + id, { router: memoryRouter('#/lists/' + id), cloud }) });
  /* gm2's list links gm1's axe; with the linked read failed, the page knows neither it
     nor `q23`, which this file's data lacks. */
  const unread = () => {
    const cloud = fakeCloud(SEED, 'gm2');
    vi.spyOn(cloud.lists, 'items').mockResolvedValue({ ok: false });
    return cloud;
  };
  const unknownRow = (key: string): HTMLElement =>
    screen.getByText(key, { selector: '.unk b' }).closest('.lrow') as HTMLElement;

  it('draws a row for an entry whose record the page has not read', async () => {
    const { container } = open(unread(), GM2_ID);
    await screen.findByText(AXE);
    const row = unknownRow(AXE);
    expect(within(row).getByText('Предмет не загружен')).toBeInTheDocument();
    expect(within(row).getByRole('checkbox', { name: AXE })).toBeInTheDocument();
    expect(container.querySelectorAll('.lrow')).toHaveLength(2);
    expect(sub(container)).toBe('2 позиции из 100 · Сохранено');
    expect(within(row).getByRole('spinbutton', { name: 'Позиция в списке' })).toHaveAttribute(
      'max',
      '2'
    );
    await expectNoA11yViolations(container);
    await userEvent.click(within(row).getByRole('button', { name: 'Убрать из списка' }));
    await waitFor(() => {
      expect(container.querySelectorAll('.lrow')).toHaveLength(1);
    });
    expect(sub(container)).toMatch(/^1 позиция из 100 · /);
    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect(await screen.findByText(AXE)).toBeInTheDocument();
  });

  it('rolls over every stored entry', async () => {
    open(unread(), GM2_ID);
    await screen.findByText(AXE);
    await userEvent.click(screen.getByText('Бросок по списку'));
    expect(screen.getByText('Результат броска (1-2)')).toBeInTheDocument();
    const up = screen.getByRole('button', { name: 'На единицу больше' });
    await userEvent.click(up);
    await userEvent.click(up);
    expect(screen.getByRole('textbox', { name: 'Результат броска' })).toHaveValue('2');
    expect(up).toBeDisabled();
  });

  it('prints the known rows, and the toast names the rest', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const create = vi.spyOn(cloud.prints, 'create');
    open(cloud, uuid(101));
    await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ });
    await userEvent.click(screen.getByRole('button', { name: 'Печать' }));
    expect(
      await screen.findByText('Не напечатано предметов: 6 - они не загружены.')
    ).toBeInTheDocument();
    expect(create.mock.calls[0]?.[0]).toHaveLength(4);
  });

  it('draws «Загружаем...» on an account address once the session is known, and nothing before', async () => {
    const held = fakeCloud(SEED, 'gm1');
    vi.spyOn(held.lists, 'list').mockReturnValue(new Promise(() => undefined));
    open(held, uuid(101));
    expect(await screen.findByText('Загружаем...')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    cleanup();
    const unknown = fakeCloud(SEED, 'gm1');
    vi.spyOn(unknown.auth, 'session').mockReturnValue(new Promise(() => undefined));
    open(unknown, uuid(101));
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText('Загружаем...')).toBeNull();
    expect(screen.queryByText('Список не найден')).toBeNull();
  });

  it("holds the list's name as text in its h1, the input keeping its label", async () => {
    open(fakeCloud(SEED, 'gm1'), uuid(101));
    const input = await screen.findByRole('textbox', { name: 'Название списка' });
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Лавка кузнеца');
    expect(h1).toContainElement(input);
  });

  it('names its h1 by the hidden name alone, so the input value does not name it twice', async () => {
    open(fakeCloud(SEED, 'gm1'), uuid(101));
    await screen.findByRole('textbox', { name: 'Название списка' });
    const h1 = screen.getByRole('heading', { level: 1 });
    const id = h1.getAttribute('aria-labelledby') ?? '';
    expect(id).toBe('list-name');
    expect(document.getElementById(id)?.textContent).toBe('Лавка кузнеца');
    expect(h1).toHaveAccessibleName('Лавка кузнеца');
  });
});
