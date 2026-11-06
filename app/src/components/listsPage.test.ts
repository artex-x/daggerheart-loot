/* The lists index, `#/lists` (docs/specs/FEATURES.md, "Lists"): the head with «Новый список»
 * and its field, the count line, the cards with their «Ещё», the selection mode and its bar,
 * the import toggle, and the empty, signed-out and failed states, over the fake cloud. */

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid, type SeedList } from '../ports/fake-cloud-seed.js';
import {
  fakeData,
  fakeDialog,
  fakeEnv,
  fakeImage,
  fakePage,
  fakeViewport,
  memoryRouter,
  memoryStorage,
  noData
} from '../ports/index.js';
import type { CloudPort, Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import { DAY, listOf, manyLists, seedWith, TWO_LISTS } from '../test/seed.js';
import type { Loot } from '../lib/data.js';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView; `MoreMenu` calls it once its menu is open. */
Element.prototype.scrollIntoView = vi.fn();

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
    ]
  },
  eq: [],
  refs: {}
};

const at = (over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter('#/lists'), data: fakeData(LOOT), ...over });

/** Renders `#/lists` signed in as gm4, who holds `lists`, and waits for the first card (or, with
 *  no lists, the empty plate). `limit` raises gm4's list limit for the long indexes. */
async function openIndex(lists: SeedList[] = [], limit?: number, over: Partial<Env> = {}) {
  const cloud = fakeCloud(
    seedWith({ gm4: lists }),
    'gm4',
    limit === undefined ? undefined : { limits: { lists: limit } }
  );
  const router = memoryRouter('#/lists');
  const view = render(App, { env: at({ router, cloud, ...over }) });
  if (lists[0])
    await screen.findByRole('link', { name: new RegExp('^' + lists[0].name + ', ') });
  else await screen.findByText('Списков пока нет');
  return { ...view, cloud, router };
}

/** `n` account lists, «Список 1» first (the newest edit); `names` replace the first few. */
const manyAccount = (n: number, names: string[] = []): SeedList[] =>
  manyLists(
    840,
    Array.from({ length: n }, (_, i) => ({ name: names[i] ?? 'Список ' + String(i + 1) }))
  );

const cardNames = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('.listcard-top b')].map((b) => b.textContent);

const countText = (container: HTMLElement): string =>
  (container.querySelector('.count')?.textContent ?? '').replace(/\s+/g, ' ').trim();

/* The box is named by its placeholder too, which Chrome's accessible name reads. */
const findBox = (): HTMLElement => screen.getByPlaceholderText('Найти список');

const primary = (): HTMLElement => screen.getByRole('button', { name: 'Новый список' });

/** Presses «Новый список» and answers the name field. */
async function openField(): Promise<HTMLElement> {
  await userEvent.click(primary());
  return screen.getByRole('textbox', { name: 'Название списка' });
}

/** Opens a card's «Ещё» and answers its menu. */
async function cardMenu(name: string): Promise<HTMLElement> {
  await userEvent.click(screen.getByRole('button', { name: 'Ещё: ' + name }));
  return screen.getByRole('menu');
}

describe('a card per list', () => {
  it('draws two cards newest edit first, a known-record count, thumbs or the empty line', async () => {
    const { container } = await openIndex([
      listOf(831, 'Клад дракона', [{ key: 'ci1' }, { key: 'nope' }], {
        hnote: 'только для мастера',
        editedAgoMs: DAY
      }),
      listOf(832, 'Лавка в порту', [])
    ]);

    /* The link's name is its own `aria-label`: the list name, the count and the edit age. */
    const cardA = screen.getByRole('link', { name: /^Клад дракона, 1 позиция, изменён / });
    expect(cardA).toHaveAttribute('href', '/lists/' + uuid(831));
    expect(cardA.querySelectorAll('.thumb')).toHaveLength(1);
    expect(cardA.querySelector('img')).toBeNull();
    expect(cardA.querySelector('.thumb svg')).not.toBeNull();

    const cardB = screen.getByRole('link', { name: /^Лавка в порту, 0 позиций, изменён / });
    expect(cardB).toHaveAttribute('href', '/lists/' + uuid(832));
    expect(cardB.querySelectorAll('img')).toHaveLength(0);
    expect(cardB).toHaveTextContent('Список пуст');

    // newest edit first, not alphabetical
    expect(cardNames(container)).toEqual(['Клад дракона', 'Лавка в порту']);
    expect([cardA, cardB].map((c) => c.textContent)).toEqual([
      'Клад дракона1 позиция · изменён вчера',
      'Лавка в порту0 позиций · изменён позавчераСписок пуст'
    ]);
    expect(container.querySelector('.listcard .badge')).toBeNull();
    /* No tick and no red «Удалить» outside the selection mode (A16): a labeled «Ещё». */
    expect(container.querySelector('.listcard-pick')).toBeNull();
    expect(container.querySelector('.listcard .btn.danger')).toBeNull();
    const more = screen.getByRole('button', { name: 'Ещё: Клад дракона' });
    expect(more).toHaveAttribute('aria-haspopup', 'menu');
    /* The card's corner draws «Ещё» as text alone, outside the card's link. */
    expect(more).toHaveClass('bare');
    expect(more.closest('a')).toBeNull();
    expect(more.closest('.listcard-acts')?.parentElement).toHaveClass('listcard');
    await expectNoA11yViolations(container);
  });
});

describe('the head', () => {
  it('draws the pin, the import toggle and the primary from 761 px, with no sub line and no help', async () => {
    const { container } = await openIndex(TWO_LISTS);
    const head = container.querySelector('.page-head') as HTMLElement;
    expect(within(head).getByRole('heading', { level: 1, name: 'Мои списки' })).toBeVisible();
    expect(within(head).getByRole('button', { name: 'Открывать при запуске' })).toBeVisible();
    expect(within(head).getByRole('button', { name: 'Импорт из файла' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(within(head).getByRole('button', { name: 'Новый список' })).toHaveClass('primary');
    expect(head.querySelector('.headx')?.lastElementChild).toHaveClass('primary');
    expect(container.querySelector('.page-sub')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Справка' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Ещё' })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('draws the primary and «Ещё» up to 760 px, the import and the pin in it, no round pin', async () => {
    const { container } = await openIndex(TWO_LISTS, undefined, {
      viewport: fakeViewport('narrow')
    });
    expect(container.querySelector('.homebtn')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Импорт из файла' })).toBeNull();
    expect(primary()).toHaveClass('sm');
    expect(primary().querySelector('svg')).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Ещё' }));
    const menu = screen.getByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((m) => m.textContent)
    ).toEqual(['Импорт из файла', 'Открывать при запуске']);
    await expectNoA11yViolations(container);
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Импорт из файла' }));
    expect(await screen.findByText('Импорт из файла JSON')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ещё' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Импорт из файла' }));
    expect(screen.queryByText('Импорт из файла JSON')).toBeNull();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ещё' })).toHaveFocus();
    });
  });

  it('keeps «Ещё» with the pin alone signed out up to 760 px, and no primary', async () => {
    render(App, {
      env: at({ cloud: fakeCloud(SEED), viewport: fakeViewport('narrow') })
    });
    await screen.findByRole('button', { name: 'Войти' });
    expect(screen.queryByRole('button', { name: 'Новый список' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Ещё' }));
    expect(
      within(screen.getByRole('menu'))
        .getAllByRole('menuitem')
        .map((m) => m.textContent)
    ).toEqual(['Открывать при запуске']);
  });
});

describe('a dataset that did not load', () => {
  it('draws noData and no field, signed in', async () => {
    render(App, {
      env: fakeEnv({
        router: memoryRouter('#/lists'),
        data: noData(),
        cloud: fakeCloud(SEED, 'gm1')
      })
    });
    await screen.findByRole('button', { name: 'Аккаунт: gm1@example.test' });
    expect(screen.getByRole('heading', { level: 1, name: 'Мои списки' })).toBeInTheDocument();
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Название списка' })).not.toBeInTheDocument();
    expect(document.querySelectorAll('.listcard')).toHaveLength(0);
  });
});

describe('opening a list', () => {
  it("opens an empty list from its card, through the card's own link", async () => {
    const { router } = await openIndex(TWO_LISTS.slice().reverse());
    const card = screen.getByRole('link', { name: /Лавка в порту/ });
    router.click(card.getAttribute('href') ?? '');
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Лавка в порту' })
      ).toBeInTheDocument();
    });
    expect(router.hash()).toBe('#/lists/' + uuid(812));
  });
});

describe('the name filter', () => {
  it('draws no filter under eight lists, the count and «Выбрать» at its end', async () => {
    const { container } = await openIndex(TWO_LISTS);
    expect(screen.queryByPlaceholderText('Найти список')).not.toBeInTheDocument();
    const head = container.querySelector('.lhead') as HTMLElement;
    expect(head.firstElementChild).toHaveClass('count');
    expect(head.lastElementChild).toHaveClass('selmode');
  });

  it('draws the filter from the eighth list and narrows by folded name, newest edit first', async () => {
    const names = ['Порт Ветров', 'Рынок', 'Лавка в порту', 'Логово'];
    const { container } = await openIndex(manyAccount(8, names));
    expect(container.querySelectorAll('.listcard')).toHaveLength(8);
    /* From 761 px the count sits in the search row, «Выбрать» last. */
    const row = container.querySelector('.lfind') as HTMLElement;
    expect(row.querySelector('.count')).toHaveTextContent('8 списков из 50');
    expect(row.lastElementChild).toHaveClass('selmode');

    await userEvent.type(findBox(), 'ПОРТ');
    expect(cardNames(container)).toEqual(['Порт Ветров', 'Лавка в порту']);
    await expectNoA11yViolations(container);
  });

  it('puts the count under the search row up to 760 px', async () => {
    const { container } = await openIndex(manyAccount(8), undefined, {
      viewport: fakeViewport('narrow')
    });
    const row = container.querySelector('.lfind') as HTMLElement;
    expect(row.querySelector('.count')).toBeNull();
    expect(row.nextElementSibling).toHaveClass('count');
  });

  it('draws «Ничего не найдено» and no card for a query nothing matches', async () => {
    const { container } = await openIndex(manyAccount(8));
    await userEvent.type(findBox(), 'zzz');
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    expect(container.querySelectorAll('.listcard')).toHaveLength(0);
    await expectNoA11yViolations(container);
  });

  it('clears the query on a create and shows the new card first', async () => {
    const { container } = await openIndex(manyAccount(8));
    await userEvent.type(findBox(), 'zzz');
    await userEvent.type(await openField(), 'Тайник');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));

    expect(findBox()).toHaveValue('');
    expect(cardNames(container)[0]).toBe('Тайник');
    expect(container.querySelectorAll('.listcard')).toHaveLength(9);
  });
});

describe('«Новый список»', () => {
  it('opens the field in place with its label, the focus inside, and Enter creates', async () => {
    const { container } = await openIndex(TWO_LISTS);
    expect(screen.queryByRole('textbox', { name: 'Название списка' })).toBeNull();
    expect(primary()).toHaveAttribute('aria-expanded', 'false');
    const field = await openField();
    expect(field).toHaveFocus();
    expect(primary()).toHaveAttribute('aria-expanded', 'true');
    expect(field).toHaveAttribute('placeholder', 'Клад дракона');
    expect(screen.getByText('Название списка').tagName).toBe('LABEL');
    await expectNoA11yViolations(container);
    await userEvent.type(field, 'Тайник{Enter}');
    expect(cardNames(container)[0]).toBe('Тайник');
    expect(screen.getByText('Список «Тайник» создан')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Название списка' })).toBeNull();
    await waitFor(() => {
      expect(primary()).toHaveFocus();
    });
  });

  it('discards on «Отмена» and on Escape, and the focus returns to the primary', async () => {
    const { container } = await openIndex(TWO_LISTS);
    await userEvent.type(await openField(), 'Черновик');
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(screen.queryByRole('textbox', { name: 'Название списка' })).toBeNull();
    await waitFor(() => {
      expect(primary()).toHaveFocus();
    });
    const field = await openField();
    expect(field).toHaveValue('');
    await userEvent.type(field, 'Ещё{Escape}');
    expect(screen.queryByRole('textbox', { name: 'Название списка' })).toBeNull();
    expect(cardNames(container)).toEqual(['Лавка в порту', 'Клад дракона']);
    await waitFor(() => {
      expect(primary()).toHaveFocus();
    });
  });

  it('refuses a blank name as an alert, keeps the field open and focuses the input', async () => {
    await openIndex(TWO_LISTS);
    const field = await openField();
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Сначала назовите список');
    expect(field).toHaveFocus();
  });

  it('stays enabled at the limit: the press says the limit, the field stays closed, the count is red', async () => {
    const { container } = render(App, {
      env: at({ cloud: fakeCloud(SEED, 'gm1', { limits: { lists: 3 } }) })
    });
    expect(await screen.findByText('3 списка из 3')).toHaveClass('over');
    expect(primary()).toBeEnabled();
    await userEvent.click(primary());
    expect(
      screen.getByText(
        'Достигнут предел списков в аккаунте: 3. Нужно больше - напишите на daggerheart.loot@gmail.com.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Название списка' })).toBeNull();
    expect(cardNames(container)).toHaveLength(3);
    await expectNoA11yViolations(container);
  });
});

describe('«Показать ещё»', () => {
  const more = (n: number): HTMLElement =>
    screen.getByRole('button', { name: 'Показать ещё (' + String(n) + ')' });

  it('draws every card and no button at 24 lists', async () => {
    const { container } = await openIndex(manyAccount(24));
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    expect(screen.queryByRole('button', { name: /Показать ещё/ })).not.toBeInTheDocument();
  });

  it('draws 24 of 30, and a press draws the rest, drops the button and focuses the 25th card', async () => {
    const { container } = await openIndex(manyAccount(30), 200);
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    await expectNoA11yViolations(container);

    await userEvent.click(more(6));
    expect(container.querySelectorAll('.listcard')).toHaveLength(30);
    expect(screen.queryByRole('button', { name: /Показать ещё/ })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(container.querySelectorAll('.listcard-main')[24]);
  });

  it('draws 24 of 150 at three times the default, and the bar «Все» ticks the drawn only', async () => {
    const { container } = await openIndex(manyAccount(150), 150);
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    expect(countText(container)).toContain('150 списков из 150');
    await userEvent.click(more(126));
    expect(container.querySelectorAll('.listcard')).toHaveLength(48);
    expect(document.activeElement).toBe(container.querySelectorAll('.listcard-main')[24]);
    await userEvent.click(screen.getByRole('button', { name: 'Выбрать' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
    expect(screen.getByRole('button', { name: 'Удалить (48)' })).toBeEnabled();
  });

  it("folds the filter's result by the same rule, and a query edit folds it back to 24", async () => {
    // ten «Логово» lists, then thirty «Список» ones
    const lairs = Array.from({ length: 10 }, (_, i) => 'Логово ' + String(i + 1));
    const { container } = await openIndex(manyAccount(40, lairs), 200);
    await userEvent.type(findBox(), 'спис');
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    await userEvent.click(more(6));
    expect(container.querySelectorAll('.listcard')).toHaveLength(30);

    await userEvent.type(findBox(), 'о');
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    expect(more(6)).toBeInTheDocument();
  });

  it('keeps the drawn count across a visit to a list and back, and starts the query over', async () => {
    const { container, router } = await openIndex(manyAccount(30), 200);
    await userEvent.click(more(6));
    const card = container.querySelectorAll('.listcard-main')[25];
    router.click(card?.getAttribute('href') ?? '');
    await waitFor(() => {
      expect(container.querySelector('.listcard')).not.toBeInTheDocument();
    });
    router.navigate('#/lists');
    await waitFor(() => {
      expect(container.querySelectorAll('.listcard')).toHaveLength(30);
    });
    expect(findBox()).toHaveValue('');
  });

  it('puts a card created on a folded page first, and the button counts one more', async () => {
    const { container } = await openIndex(manyAccount(30), 200);
    await userEvent.type(await openField(), 'Тайник');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(cardNames(container)[0]).toBe('Тайник');
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    expect(more(7)).toBeInTheDocument();
  });

  it('reads "Show more (N)" in English', async () => {
    const cloud = fakeCloud(seedWith({ gm4: manyAccount(30) }), 'gm4', {
      limits: { lists: 200 }
    });
    render(App, {
      env: at({ cloud, storage: memoryStorage({ 'dhloot.lang.v1': 'en' }) })
    });
    expect(await screen.findByRole('button', { name: 'Show more (6)' })).toBeInTheDocument();
  });
});

describe('with sign-in configured', () => {
  const withCloud = (cloud: CloudPort, over: Partial<Env> = {}) => {
    const router = memoryRouter('#/lists');
    const dialog = fakeDialog();
    const view = render(App, { env: at({ router, dialog, cloud, ...over }) });
    return { ...view, router, dialog };
  };

  it("counts another account's linked item and an own item on their cards, each with a thumb", async () => {
    const gm2 = withCloud(fakeCloud(SEED, 'gm2'));
    const linked = await screen.findByRole('link', { name: /^Список второго ГМа, / });
    expect(linked.querySelector('.listcard-meta')?.textContent).toMatch(/^1 позиция · /);
    expect(linked.querySelectorAll('.listcard-thumbs .thumb').length).toBeGreaterThan(0);
    gm2.unmount();
    withCloud(fakeCloud(SEED, 'gm1'));
    const shop = await screen.findByRole('link', { name: /^Лавка кузнеца, / });
    expect(shop.querySelectorAll('.listcard-thumbs .thumb').length).toBeGreaterThan(1);
  });

  it('draws the sign-in plate signed out, no primary and no import, and «Войти» opens the account page', async () => {
    const { container, router } = withCloud(fakeCloud(SEED));
    const button = await screen.findByRole('button', { name: 'Войти' });
    expect(button.closest('.empty')).not.toBeNull();
    expect(container.querySelector('.empty .glyph svg')).not.toBeNull();
    expect(
      screen.getByText(
        'Войдите, чтобы создавать списки: они хранятся в аккаунте и открываются на любом устройстве.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Новый список' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Импорт из файла' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Войти через/ })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
    await userEvent.click(button);
    expect(router.hash()).toBe('#/account');
  });

  const withRequests = () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const storage = memoryStorage();
    cloud.request('player-token-1', [{ item: 'ci1', qty: 1 }]);
    cloud.request('gm-token-1', [{ item: 'cc1', qty: 1 }]);
    return { ...withCloud(cloud, { storage }), storage };
  };

  it("counts an account list's pending requests in a neutral chip and in its link's name", async () => {
    const { container } = withRequests();
    const chip = await screen.findByText('Новое в списке (2)');
    expect(chip).toHaveClass('listcard-new');
    const link = chip.closest('a');
    expect(link?.getAttribute('aria-label')).toMatch(/, Новое в списке \(2\)$/);
    expect(container.querySelectorAll('.listcard-new')).toHaveLength(1);
    await expectNoA11yViolations(container);
  });

  /* `n` unread notices on gm1's shop, each of another item. */
  const shopNotices = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: uuid(9600 + i),
      listId: uuid(101),
      itemKey: 'hb_note' + String.fromCharCode(97 + i) + 'aaaaaaaaaaaa',
      hid: null,
      kind: 'deleted' as const,
      name: { en: 'Gone', ru: 'Ушёл' },
      createdAgoMs: 60_000 * (i + 1)
    }));

  it('counts the unread notices with the requests, and alone', async () => {
    const cloud = fakeCloud({ ...SEED, notices: shopNotices(1) }, 'gm1');
    cloud.request('player-token-1', [{ item: 'ci1', qty: 1 }]);
    cloud.request('gm-token-1', [{ item: 'cc1', qty: 1 }]);
    withCloud(cloud);
    expect(await screen.findByText('Новое в списке (3)')).toHaveClass('listcard-new');
    cleanup();
    withCloud(fakeCloud(SEED, 'gm2'));
    expect(await screen.findByText('Новое в списке (2)')).toHaveClass('listcard-new');
    cleanup();
    withCloud(fakeCloud({ ...SEED, notices: shopNotices(5) }, 'gm1'));
    expect(await screen.findByText('Новое в списке (5)')).toHaveClass('listcard-new');
  });

  it('drops the chip once the requests expire', async () => {
    const { container, storage } = withRequests();
    await screen.findByText('Новое в списке (2)');
    const now = Date.now;
    try {
      /* The lists page never reads a request, so each lasts its 30 unread days. */
      Date.now = () => now() + 30 * 86_400_000 + 60_000;
      storage.fireExternalChange(null);
      await waitFor(() => {
        expect(container.querySelector('.listcard-new')).toBeNull();
      });
    } finally {
      Date.now = now;
    }
    await expectNoA11yViolations(container);
  });

  it('draws no field and no plate while the session is unknown', () => {
    const cloud = fakeCloud(SEED);
    cloud.auth.session = () => new Promise(() => undefined);
    withCloud(cloud);
    expect(screen.queryByRole('button', { name: 'Войти' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Новый список' })).not.toBeInTheDocument();
  });

  it('draws the account lists newest edit first, with no group heading', async () => {
    const { container } = withCloud(fakeCloud(SEED, 'gm1'));
    await screen.findByText('Пустой список');
    expect(container.querySelectorAll('h2')).toHaveLength(0);
    expect(screen.queryByText('Ваш аккаунт')).toBeNull();
    expect(cardNames(container)).toEqual(['Пустой список', 'Лавка кузнеца', 'Трофеи']);
    expect([...container.querySelectorAll('.listcard-meta')].map((p) => p.textContent)).toEqual(
      [
        '0 позиций · изменён 1 час назад',
        '2 позиции · изменён 3 дня назад',
        '1 позиция · изменён в прошлом месяце'
      ]
    );
    const shop = screen.getByRole('link', {
      name: 'Лавка кузнеца, 2 позиции, изменён 3 дня назад'
    });
    expect(shop).toHaveAttribute('href', '/lists/00000000-0000-4000-8000-000000000101');
    await expectNoA11yViolations(container);
  });

  it("holds «Открыть», «Скачать JSON», a separator and «Удалить список» in a card's «Ещё»", async () => {
    const image = fakeImage();
    const { container } = withCloud(fakeCloud(SEED, 'gm1'), { image });
    await screen.findByText('Трофеи');
    const menu = await cardMenu('Трофеи');
    expect([...menu.children].map((c) => c.getAttribute('role'))).toEqual([
      'menuitem',
      'menuitem',
      'separator',
      'menuitem'
    ]);
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((m) => m.textContent)
    ).toEqual(['Открыть', 'Скачать JSON', 'Удалить список']);
    expect(within(menu).getByRole('menuitem', { name: 'Открыть' })).toHaveAttribute(
      'href',
      '/lists/' + uuid(103)
    );
    expect(within(menu).getByRole('menuitem', { name: 'Удалить список' })).toHaveClass(
      'danger'
    );
    await expectNoA11yViolations(container);
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Скачать JSON' }));
    await waitFor(() => {
      expect(image.downloaded).toHaveLength(1);
    });
    const text = await image.downloaded[0]!.blob.text();
    expect(
      (JSON.parse(text) as { lists: { name: string }[] }).lists.map((l) => l.name)
    ).toEqual(['Трофеи']);
  });

  it('moves «изменён N назад» with the 45 s clock while the index stays open', async () => {
    vi.useFakeTimers({
      now: new Date('2026-09-25T12:00:00Z'),
      toFake: ['Date', 'setInterval', 'clearInterval']
    });
    try {
      const cloud = fakeCloud(SEED, 'gm1');
      const { container } = withCloud(cloud);
      await screen.findByText('Пустой список');
      const edited = (): (string | null)[] =>
        [...container.querySelectorAll('.listcard-meta')].map((p) => p.textContent);
      expect(edited()[0]).toBe('0 позиций · изменён 1 час назад');
      const read = vi.spyOn(cloud.lists, 'list');
      await vi.advanceTimersByTimeAsync(3_600_000);
      await waitFor(() => {
        expect(edited()[0]).toBe('0 позиций · изменён 2 часа назад');
      });
      const answers = await Promise.all(read.mock.results.map((r) => r.value as unknown));
      expect(answers.every((a) => JSON.stringify(a) === JSON.stringify(answers[0]))).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('creates an account list, first on the page', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const page = fakePage();
    const { container } = withCloud(cloud, { page });
    await screen.findByText('Список второго ГМа');
    await userEvent.type(await openField(), 'Тайник');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(cardNames(container)).toEqual(['Тайник', 'Список второго ГМа']);
    expect(screen.getByText('Список «Тайник» создан')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Тайник/ })).toHaveAttribute(
      'href',
      '/lists/00000000-0000-4000-8000-000000005000'
    );
    page.fireHidden();
    await waitFor(async () => {
      const read = await cloud.lists.list();
      expect(read.ok && read.lists.map((l) => l.name)).toContain('Тайник');
    });
  });

  it('deletes an account list from its «Ещё» after a confirm that names its links, with no undo', async () => {
    const { container, dialog } = withCloud(fakeCloud(SEED, 'gm1'));
    await screen.findByText('Трофеи');
    const menu = await cardMenu('Трофеи');
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Удалить список' }));
    expect(dialog.asked).toEqual([
      'Удалить список «Трофеи»? Ссылки для игроков и мастера перестанут работать. Отменить удаление нельзя.'
    ]);
    expect(cardNames(container)).toEqual(['Пустой список', 'Лавка кузнеца']);
    expect(screen.getByText('Список «Трофеи» удалён')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Вернуть' })).not.toBeInTheDocument();
  });

  it('keeps an account list when the confirm is refused', async () => {
    const { container } = withCloud(fakeCloud(SEED, 'gm1'), { dialog: fakeDialog(false) });
    await screen.findByText('Трофеи');
    const menu = await cardMenu('Трофеи');
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Удалить список' }));
    expect(cardNames(container)).toContain('Трофеи');
  });

  it("hands focus to the next card's «Ещё», the previous one's, then the primary", async () => {
    const { container } = withCloud(fakeCloud(SEED, 'gm1'));
    await screen.findByText('Трофеи');
    const del = async (name: string): Promise<void> => {
      const menu = await cardMenu(name);
      await userEvent.click(within(menu).getByRole('menuitem', { name: 'Удалить список' }));
    };
    await del('Пустой список');
    expect(cardNames(container)).toEqual(['Лавка кузнеца', 'Трофеи']);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ещё: Лавка кузнеца' })).toHaveFocus();
    });
    await del('Трофеи');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ещё: Лавка кузнеца' })).toHaveFocus();
    });
    await del('Лавка кузнеца');
    await waitFor(() => {
      expect(primary()).toHaveFocus();
    });
  });

  it('says loading, then a failed read with a retry that loads and focuses the primary', async () => {
    const cloud = fakeCloud(SEED, 'gm1', { offline: true });
    const { container } = withCloud(cloud);
    expect(await screen.findByText('Не получилось загрузить списки аккаунта.')).toBeVisible();
    expect(primary()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Импорт из файла' })).toBeNull();
    await expectNoA11yViolations(container);
    const retry = screen.getByRole('button', { name: 'Повторить' });
    /* A grid item of `.stack` would stretch the retry across the column. */
    expect(retry.parentElement?.classList.contains('stack')).toBe(false);
    cloud.setOffline(false);
    retry.focus();
    await fireEvent.click(retry);
    expect(await screen.findByText('Лавка кузнеца')).toBeInTheDocument();
    await waitFor(() => {
      expect(primary()).toHaveFocus();
    });
  });

  it('shows «Не сохранено» and «Повторить» in the count line after a create that cannot be sent', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const page = fakePage();
    const { container } = withCloud(cloud, { page });
    await screen.findByText('Список второго ГМа');
    expect(countText(container)).toBe('1 список из 50');
    cloud.setOffline(true);
    await userEvent.type(await openField(), 'Тайник');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    page.fireHidden();
    await waitFor(() => {
      expect(countText(container)).toBe('2 списка из 50 · Не сохраненоПовторить');
    });
    expect(cardNames(container)).toEqual(['Тайник', 'Список второго ГМа']);
    const said = (): string[] =>
      [...container.querySelectorAll('.said[role="status"]')].map((r) => r.textContent.trim());
    expect(said()).toContain('Не сохранено');
    await expectNoA11yViolations(container);
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await waitFor(() => {
      expect(countText(container)).toBe('2 списка из 50');
    });
    expect(said()).toContain('Сохранено');
  });

  it('says loading while the first read is in flight, and the empty plate when the account has no list', async () => {
    const slow = fakeCloud(SEED, 'gm1');
    slow.lists.list = () => new Promise(() => undefined);
    withCloud(slow);
    expect(await screen.findByText('Загружаем...')).toBeInTheDocument();
    expect(primary()).toBeInTheDocument();
    cleanup();
    const empty = fakeCloud(SEED, 'gm1');
    empty.lists.list = () =>
      Promise.resolve({ ok: true, lists: [], listLimit: 50, entryLimit: 100 });
    const { container } = withCloud(empty);
    expect(await screen.findByText('Списков пока нет')).toHaveClass('title');
    expect(
      screen.getByText(
        'Нажмите «Новый список» - или «В список» у предмета в таблице или в броске.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Открыть таблицы' })).toHaveAttribute(
      'href',
      '/tables'
    );
    expect(screen.getByText('0 списков из 50')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Выбрать' })).toBeNull();
    expect(screen.queryByPlaceholderText('Найти список')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('counts the account lists with the limit, at the limit and at an override of 150', async () => {
    const { container } = withCloud(fakeCloud(SEED, 'gm1'));
    expect(await screen.findByText('3 списка из 50')).not.toHaveClass('over');
    await expectNoA11yViolations(container);
    cleanup();
    withCloud(fakeCloud(SEED, 'gm1', { limits: { lists: 3 } }));
    expect(await screen.findByText('3 списка из 3')).toHaveClass('over');
    cleanup();
    const big = fakeCloud(SEED, 'gm1', { limits: { lists: 150 } });
    for (let i = 0; i < 147; i++) {
      await big.lists.apply([
        {
          op: 'create',
          list: {
            id: uuid(9000 + i),
            name: 'Л' + String(i),
            money_mode: 'bag',
            player_note: '',
            gm_note: ''
          },
          entries: []
        }
      ]);
    }
    withCloud(big);
    expect(await screen.findByText('150 списков из 150')).toBeInTheDocument();
  });

  it('counts with no limit when the limit read failed', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const read = cloud.lists.list.bind(cloud.lists);
    cloud.lists.list = async () => {
      const r = await read();
      return r.ok ? { ...r, listLimit: null } : r;
    };
    withCloud(cloud);
    expect(await screen.findByText('3 списка')).toBeInTheDocument();
  });
});

describe('the selection mode', () => {
  const EMPTY = 'Пустой список';
  const TROPHIES = 'Трофеи';
  const signedIn = async (cloud = fakeCloud(SEED, 'gm1'), over: Partial<Env> = {}) => {
    const dialog = fakeDialog();
    const view = render(App, {
      env: at({ router: memoryRouter('#/lists'), dialog, cloud, ...over })
    });
    await screen.findByText('Лавка кузнеца');
    return { ...view, dialog };
  };
  const select = (): Promise<void> =>
    userEvent.click(screen.getByRole('button', { name: 'Выбрать' }));
  const pick = (name: string): HTMLInputElement =>
    screen.getByRole('checkbox', { name: 'Выбрать: ' + name });
  const all = (): HTMLInputElement => screen.getByRole('checkbox', { name: 'Выбрать все' });
  const summary = (): string => document.querySelector('.selcount')?.textContent.trim() ?? '';
  /* Account lists made on the server before the page opens. */
  const withLists = async (names: string[]) => {
    const cloud = fakeCloud(SEED, 'gm1');
    await cloud.lists.apply(
      names.map((name, i) => ({
        op: 'create' as const,
        list: {
          id: uuid(7000 + i),
          name,
          money_mode: 'bag' as const,
          player_note: '',
          gm_note: ''
        },
        entries: []
      }))
    );
    return cloud;
  };
  const ticked = (c: HTMLElement): number =>
    c.querySelectorAll('.listcard-pick input:checked').length;

  it("opens on «Выбрать» with the focus on the bar's «Все»: ticks on, no «Ещё», no badge", async () => {
    const { container } = await signedIn();
    expect(container.querySelector('.listcard-pick')).toBeNull();
    await select();
    expect(all()).toHaveFocus();
    expect(
      screen
        .getAllByRole('checkbox', { name: /^Выбрать: / })
        .map((b) => b.getAttribute('aria-label'))
    ).toEqual(['Выбрать: Пустой список', 'Выбрать: Лавка кузнеца', 'Выбрать: Трофеи']);
    expect(container.querySelectorAll('.listcard-acts')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Выбрать' })).toBeNull();
    expect(pick(EMPTY).closest('a')).toBeNull();
    expect(summary()).toBe('Выбрано: 0');
    expect(screen.getByRole('button', { name: 'Скачать JSON (0)' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Удалить (0)' })).toBeDisabled();
    const bar = screen.getByRole('region', { name: 'Выбранные записи' });
    expect(bar.querySelector('.selclear')?.textContent).toBe('Снять выделение');
    await expectNoA11yViolations(document.body);
  });

  it('ticks two cards neutral, downloads them in index order and «Снять выделение» returns to «Выбрать»', async () => {
    const image = fakeImage();
    const { container } = await signedIn(fakeCloud(SEED, 'gm1'), { image });
    await select();
    await userEvent.click(pick(TROPHIES));
    await userEvent.click(pick(EMPTY));
    expect(summary()).toBe('Выбрано: 2');
    expect(all().indeterminate).toBe(true);
    expect(pick(EMPTY).closest('.listcard')).toHaveClass('picked');
    expect(pick('Лавка кузнеца').closest('.listcard')).not.toHaveClass('picked');
    await userEvent.click(screen.getByRole('button', { name: 'Скачать JSON (2)' }));
    await waitFor(() => {
      expect(image.downloaded).toHaveLength(1);
    });
    const text = await image.downloaded[0]!.blob.text();
    expect(
      (JSON.parse(text) as { lists: { name: string }[] }).lists.map((l) => l.name)
    ).toEqual([EMPTY, TROPHIES]);
    expect(ticked(container)).toBe(2);
    await expectNoA11yViolations(document.body);
    await userEvent.click(screen.getByRole('button', { name: 'Снять выделение' }));
    expect(container.querySelector('.listcard-pick')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Выбранные записи' })).toBeNull();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Выбрать' })).toHaveFocus();
    });
  });

  it("disables «Скачать JSON (N)» while the ticked lists' entries are read", async () => {
    const image = fakeImage();
    const cloud = fakeCloud(SEED, 'gm1');
    const real = cloud.lists.rows.bind(cloud.lists);
    let release: () => void = () => undefined;
    cloud.lists.rows = (ids) =>
      new Promise((r) => {
        release = () => {
          r(real(ids));
        };
      });
    await signedIn(cloud, { image });
    await select();
    await userEvent.click(pick(TROPHIES));
    const button = screen.getByRole('button', { name: 'Скачать JSON (1)' });
    await userEvent.click(button);
    expect(button).toBeDisabled();
    release();
    await waitFor(() => {
      expect(image.downloaded).toHaveLength(1);
    });
    expect(button).toBeEnabled();
  });

  it('keeps everything when the confirm is refused', async () => {
    const { container } = await signedIn(fakeCloud(SEED, 'gm1'), {
      dialog: fakeDialog(false)
    });
    await select();
    await userEvent.click(pick(EMPTY));
    await userEvent.click(pick(TROPHIES));
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (2)' }));
    expect(cardNames(container)).toEqual([EMPTY, 'Лавка кузнеца', TROPHIES]);
    expect(ticked(container)).toBe(2);
  });

  it('deletes the ticked lists after one confirm that names them, with no undo, and stays on', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const page = fakePage();
    const dialog = fakeDialog();
    const { container } = await signedIn(cloud, { page, dialog });
    await select();
    await userEvent.click(pick(EMPTY));
    await userEvent.click(pick(TROPHIES));
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (2)' }));
    expect(dialog.asked).toEqual([
      'Удалить списки (2): «Пустой список», «Трофеи»? Ссылки для игроков и мастера на них перестанут работать. Отменить удаление нельзя.'
    ]);
    expect(cardNames(container)).toEqual(['Лавка кузнеца']);
    expect(screen.getByText('Удалено списков: 2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Вернуть' })).toBeNull();
    expect(summary()).toBe('Выбрано: 0');
    expect(ticked(container)).toBe(0);
    await waitFor(() => {
      expect(all()).toHaveFocus();
    });
    page.fireHidden();
    await waitFor(async () => {
      const read = await cloud.lists.list();
      expect(read.ok && read.lists.map((l) => l.name)).toEqual(['Лавка кузнеца']);
    });
  });

  it('leaves the mode when the last card goes, and the focus lands on the primary', async () => {
    const { container } = await signedIn();
    await select();
    await userEvent.click(all());
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (3)' }));
    expect(cardNames(container)).toEqual([]);
    expect(screen.queryByRole('region', { name: 'Выбранные записи' })).toBeNull();
    await waitFor(() => {
      expect(primary()).toHaveFocus();
    });
    await expectNoA11yViolations(container);
  });

  it('names five lists in the confirm, then counts the rest', async () => {
    const dialog = fakeDialog();
    await signedIn(await withLists(['А', 'Б', 'В', 'Г']), { dialog });
    await select();
    await userEvent.click(all());
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (7)' }));
    expect(dialog.asked[0]).toMatch(
      /^Удалить списки \(7\): «[^»]+», «[^»]+», «[^»]+», «[^»]+», «[^»]+» и ещё 2\? /
    );
  });

  it('ticks the drawn cards only, and drops a tick the query hides for good', async () => {
    const cloud = await withLists([
      'Порт Ветров',
      'Рынок',
      'Лавка в порту',
      'Сессия 1',
      'Сессия 2',
      'Сессия 3',
      'Сессия 4',
      'Сессия 5',
      'Сессия 6'
    ]);
    const { container } = await signedIn(cloud);
    await select();
    await userEvent.click(pick('Порт Ветров'));
    await userEvent.click(pick('Рынок'));
    expect(summary()).toBe('Выбрано: 2');
    await userEvent.type(findBox(), 'порт');
    expect(summary()).toBe('Выбрано: 1');
    expect(screen.getByRole('button', { name: 'Удалить (1)' })).toBeInTheDocument();
    await userEvent.clear(findBox());
    expect(pick('Рынок')).not.toBeChecked();
    expect(summary()).toBe('Выбрано: 1');
    await userEvent.type(findBox(), 'порт');
    await userEvent.click(all());
    expect(summary()).toBe('Выбрано: 2');
    expect(ticked(container)).toBe(2);
    expect(screen.getByRole('button', { name: 'Скачать JSON (2)' })).toBeInTheDocument();
    await userEvent.clear(findBox());
    expect(ticked(container)).toBe(2);
    expect(summary()).toBe('Выбрано: 2');
  });

  it('keeps the ticks when «Показать ещё» draws more', async () => {
    const cloud = await withLists(Array.from({ length: 27 }, (_, i) => 'Ещё ' + String(i + 1)));
    const { container } = render(App, { env: at({ router: memoryRouter('#/lists'), cloud }) });
    await screen.findByText('Ещё 27');
    await select();
    await userEvent.click(pick('Ещё 27'));
    await userEvent.click(screen.getByRole('button', { name: 'Показать ещё (6)' }));
    expect(ticked(container)).toBe(1);
    expect(summary()).toBe('Выбрано: 1');
  });

  it('names the pick box of a list with no name «Без названия»', async () => {
    await signedIn(await withLists(['']));
    await select();
    expect(screen.getByRole('checkbox', { name: 'Выбрать: Без названия' })).toBeInTheDocument();
  });
});

describe('the import toggle', () => {
  it('draws only while the lists are read, and opens and closes the panel with the focus back', async () => {
    render(App, { env: at({ router: memoryRouter('#/lists'), cloud: fakeCloud(SEED) }) });
    await screen.findByRole('button', { name: 'Войти' });
    expect(screen.queryByRole('button', { name: 'Импорт из файла' })).toBeNull();
    cleanup();

    const slow = fakeCloud(SEED, 'gm1');
    slow.lists.list = () => new Promise(() => undefined);
    render(App, { env: at({ router: memoryRouter('#/lists'), cloud: slow }) });
    await screen.findByText('Загружаем...');
    expect(screen.queryByRole('button', { name: 'Импорт из файла' })).toBeNull();
    cleanup();

    const { container } = render(App, {
      env: at({ router: memoryRouter('#/lists'), cloud: fakeCloud(SEED, 'gm1') })
    });
    await screen.findByText('Лавка кузнеца');
    const toggle = screen.getByRole('button', { name: 'Импорт из файла' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Импорт из файла JSON')).toBeInTheDocument();
    /* The panel sits under the head, above the collection. */
    const panel = screen.getByText('Импорт из файла JSON').closest('.panel') as HTMLElement;
    expect(
      panel.compareDocumentPosition(container.querySelector('.listgrid')!) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    await expectNoA11yViolations(container);
    await userEvent.click(toggle);
    expect(screen.queryByText('Импорт из файла JSON')).toBeNull();
    await waitFor(() => {
      expect(toggle).toHaveFocus();
    });
  });
});

describe('a card picture', () => {
  it('draws the kind glyph after a card picture fails', async () => {
    const withArt: Loot = {
      ...LOOT,
      items: { core_item: [{ ...LOOT.items['core_item']![0]!, img: 'ci1.webp' }] }
    };
    const { container } = render(App, {
      env: at({ cloud: fakeCloud(SEED, 'gm1'), data: fakeData(withArt) })
    });
    await screen.findByText('Лавка кузнеца');
    const img = container.querySelector<HTMLImageElement>('.listcard-thumbs img');
    expect(img).toHaveAttribute('src', '/img/thumb/ci1.webp');
    const thumb = img!.closest('.thumb')!;
    await fireEvent.error(img!);
    await waitFor(() => {
      expect(thumb.querySelector('img')).toBeNull();
    });
    expect(thumb.querySelector('svg')).not.toBeNull();
  });
});
