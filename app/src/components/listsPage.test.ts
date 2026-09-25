/* The lists index, `#/lists` - off `renderLists`/`storageWarning`/`hideWarn`/
 * `listCardHTML` in app.js and the create/share/delete handlers
 * (app.js 4136-4270), plus the account group and the sign-in prompt over the
 * fake cloud. `shell.test.ts` used to cover the storage notice as the frame's
 * own invention; it lives here now, where the live app draws it. */

import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import {
  brokenStorage,
  fakeClipboard,
  fakeData,
  fakeDialog,
  fakeEnv,
  memoryRouter,
  memoryStorage,
  noData,
  plainCompress
} from '../ports/index.js';
import type { CloudPort, Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import { encodeList, encodeListRaw } from '../lib/listLink.js';
import type { Loot } from '../lib/data.js';
import type { StoredList } from '../lib/lists.js';

afterEach(cleanup);

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

/** A list with one known id and one the data does not - the badge counts
 *  known records, not `l.ids.length`. Carries a GM-only `hnote` so its two
 *  payload flavours (`encodeList(listA, true|false)`) are not byte-identical -
 *  see the card-link assertions below. */
const listA: StoredList = {
  id: 'a',
  name: 'Клад дракона',
  ids: ['ci1', 'nope'],
  created: 2,
  hnote: 'только для мастера'
};
const listB: StoredList = { id: 'b', name: 'Лавка в порту', ids: [], created: 1 };
const TWO = JSON.stringify([listA, listB]);

const at = (over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter('#/lists'), data: fakeData(LOOT), ...over });

/** Typed, so a read-back assertion is not an unsafe member access on `any`. */
const readLists = (storage: { get: (k: string) => string | null }): StoredList[] =>
  JSON.parse(storage.get('dhloot.lists.v2') ?? '[]') as StoredList[];

describe('the head and the panel', () => {
  it('draws the heading, the create field, the folded notice and the empty state', async () => {
    const { container } = render(App, { env: at() });
    expect(screen.getByRole('heading', { level: 1, name: 'Списки' })).toBeInTheDocument();
    expect(screen.getByText('Списки живут только в этом браузере.')).toBeInTheDocument();
    expect(screen.getByText('подробнее')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Скрыть' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Например: клад дракона')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByText('Списков пока нет — создайте первый выше')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('opens the five help paragraphs, two of them with two bold runs', async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Как это работает' }));
    expect(screen.getByText('Для игроков')).toBeInTheDocument();
    expect(screen.getByText('Только для мастера')).toBeInTheDocument();
    expect(screen.getByText('Ссылка игрокам')).toBeInTheDocument();
    expect(screen.getByText('Ссылка себе')).toBeInTheDocument();
  });

  it('dismisses the notice for good, writing the flag, without toggling the disclosure', async () => {
    const storage = memoryStorage();
    render(App, { env: at({ storage }) });
    await userEvent.click(screen.getByRole('button', { name: 'Скрыть' }));
    expect(screen.queryByText('Списки живут только в этом браузере.')).not.toBeInTheDocument();
    expect(storage.get('dhloot.warn.v1')).toBe('1');
  });

  it('draws no notice once the flag is already stored', () => {
    render(App, { env: at({ storage: memoryStorage({ 'dhloot.warn.v1': '1' }) }) });
    expect(screen.queryByText('Списки живут только в этом браузере.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Скрыть' })).not.toBeInTheDocument();
  });

  it('draws the plain, undismissable warning when storage refuses', async () => {
    const { container } = render(App, { env: at({ storage: brokenStorage() }) });
    expect(screen.getByText('Браузер блокирует локальное хранилище.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Скрыть' })).not.toBeInTheDocument();
    expect(screen.queryByText('подробнее')).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('draws the unreadable-storage warning in place of the fold-open notice, undismissable', async () => {
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': '{' }) })
    });
    expect(screen.getByText('Сохранённые списки не удалось прочитать.')).toBeInTheDocument();
    expect(screen.queryByText('Списки живут только в этом браузере.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Скрыть' })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('folds the notice again on a language switch, as the live re-render does', async () => {
    const { container } = render(App, { env: at() });
    await userEvent.click(screen.getByText('подробнее'));
    /* `<details>` moved to a plain child of `.warn`, which now
       carries the dismiss button as a sibling rather than as a class of its
       own. */
    expect(container.querySelector<HTMLDetailsElement>('.warn details')?.open).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(container.querySelector<HTMLDetailsElement>('.warn details')?.open).toBe(false);
    expect(screen.getByText('more')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});

describe('a card per list', () => {
  it('draws two cards in store order, a known-record badge, thumbs or the empty line', async () => {
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': TWO }) })
    });

    /* The link's name is its own `aria-label`, the list name and the count;
       the `textContent` check below pins a different thing: the raw
       text-node structure, concatenated with no separator. */
    /* The card link renders the GM payload, not the players' one - a live-app
       bug (`listCardHTML` calls `listHash(l)` with no second argument;
       `listHash`'s `forPlayers` goes undefined, falsy) that this port
       matches. Proof the two flavours actually differ for `listA` (its
       `hnote` makes them diverge) is what makes the assertion below
       meaningful rather than a line that would pass either way. */
    expect(encodeList(listA, false)).not.toBe(encodeList(listA, true));

    const cardA = screen.getByRole('link', { name: 'Клад дракона, 1 позиция' });
    expect(cardA).toHaveAttribute('href', '#/l/' + encodeList(listA, false));
    expect(cardA.querySelectorAll('img')).toHaveLength(1);
    expect(cardA.querySelector('img')).toHaveAttribute('src', 'img/thumb/_none.webp');

    const cardB = screen.getByRole('link', { name: 'Лавка в порту, 0 позиций' });
    expect(cardB).toHaveAttribute('href', '#/l/' + encodeList(listB, false));
    expect(cardB.querySelectorAll('img')).toHaveLength(0);

    // store order, not alphabetical
    const cards = screen.getAllByRole('link', { name: /Клад дракона|Лавка в порту/ });
    expect(cards.map((c) => c.textContent)).toEqual([
      'Клад дракона1',
      'Лавка в порту0Список пуст'
    ]);

    await expectNoA11yViolations(container);
  });
});

describe('creating a list', () => {
  it('refuses a blank name as an alert and focuses the input', async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Сначала назовите список');
    expect(screen.getByPlaceholderText('Например: клад дракона')).toHaveFocus();
  });

  it('puts the new one first, clears the field, toasts, and lands in storage', async () => {
    const storage = memoryStorage();
    render(App, { env: at({ storage }) });
    await userEvent.type(screen.getByPlaceholderText('Например: клад дракона'), 'Тайник');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));

    expect(screen.getByText('Список «Тайник» создан')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Например: клад дракона')).toHaveValue('');
    expect(screen.getByRole('link', { name: /Тайник/ })).toBeInTheDocument();
    expect(readLists(storage)[0]?.name).toBe('Тайник');
  });

  it('still shows the card under refused storage, toasts saveFailed, and not "created"', async () => {
    render(App, { env: at({ storage: brokenStorage() }) });
    await userEvent.type(screen.getByPlaceholderText('Например: клад дракона'), 'Клад дракона');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Не удалось сохранить: браузер не дал записать в локальное хранилище — оно заблокировано или переполнено'
    );
    expect(screen.queryByText(/создан/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Клад дракона/ })).toBeInTheDocument();
  });
});

describe('sharing a list', () => {
  it('toasts listEmpty and writes nothing for an empty list', async () => {
    const clip = fakeClipboard();
    render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': TWO }), clipboard: clip })
    });
    // the empty list, "Лавка в порту", is second in store order
    const buttons = screen.getAllByRole('button', { name: 'Поделиться' });
    await userEvent.click(buttons[1] as HTMLElement);
    // the toast, not the empty list's own "Список пуст" line
    expect(screen.getByRole('status')).toHaveTextContent('Список пуст');
    expect(clip.last.text).toBeUndefined();
  });

  it('copies the short players link and toasts for a filled list', async () => {
    const clip = fakeClipboard();
    render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': TWO }), clipboard: clip })
    });
    const buttons = screen.getAllByRole('button', { name: 'Поделиться' });
    await userEvent.click(buttons[0] as HTMLElement);

    const payload = await plainCompress().pack(encodeListRaw(listA, true));
    expect(clip.last.text).toBe('https://example.test/#/l/' + payload);
    expect(
      screen.getByText('Ссылка для игроков скопирована — заметок мастера в ней нет')
    ).toBeInTheDocument();
  });

  it('copies the English players link in English', async () => {
    const clip = fakeClipboard();
    const { container } = render(App, {
      env: at({
        storage: memoryStorage({ 'dhloot.lists.v2': TWO, 'dhloot.lang.v1': 'en' }),
        clipboard: clip
      })
    });
    const buttons = screen.getAllByRole('button', { name: 'Share' });
    await userEvent.click(buttons[0] as HTMLElement);

    const payload = await plainCompress().pack(encodeListRaw(listA, true));
    expect(clip.last.text).toBe('https://example.test/en/#/l/' + payload);
    await expectNoA11yViolations(container);
  });

  it('toasts copyFailed as an alert when the clipboard refuses', async () => {
    render(App, {
      env: at({
        storage: memoryStorage({ 'dhloot.lists.v2': TWO }),
        clipboard: fakeClipboard({ fail: true })
      })
    });
    const buttons = screen.getAllByRole('button', { name: 'Поделиться' });
    await userEvent.click(buttons[0] as HTMLElement);
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось скопировать');
  });
});

describe('deleting a list', () => {
  it('asks the live question and changes nothing on a refusal', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': TWO });
    const dialog = fakeDialog(false);
    render(App, { env: at({ storage, dialog }) });
    await userEvent.click(screen.getAllByRole('button', { name: 'Удалить' })[0] as HTMLElement);

    expect(dialog.asked).toEqual(['Удалить список «Клад дракона»? Это действие необратимо.']);
    expect(screen.getByRole('link', { name: 'Клад дракона, 1 позиция' })).toBeInTheDocument();
    expect(readLists(storage)).toHaveLength(2);
  });

  it('removes the card and the stored list on confirmation, and toasts with an undo', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': TWO });
    render(App, { env: at({ storage, dialog: fakeDialog(true) }) });
    await userEvent.click(screen.getAllByRole('button', { name: 'Удалить' })[0] as HTMLElement);

    expect(screen.queryByRole('link', { name: /Клад дракона/ })).not.toBeInTheDocument();
    expect(readLists(storage).map((l) => l.id)).toEqual(['b']);
    expect(screen.getByText('Список «Клад дракона» удалён')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect(readLists(storage).map((l) => l.id)).toEqual(['a', 'b']);
    expect(screen.getByRole('link', { name: /Клад дракона/ })).toBeInTheDocument();
  });
});

describe('opening a list', () => {
  it("opens an empty list from its card, through the card's own link", async () => {
    const router = memoryRouter('#/lists');
    render(App, {
      env: fakeEnv({
        router,
        data: fakeData(LOOT),
        storage: memoryStorage({ 'dhloot.lists.v2': TWO })
      })
    });
    const card = screen.getByRole('link', { name: /Лавка в порту/ });
    router.navigate(card.getAttribute('href') ?? '');
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Лавка в порту' })
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText('Ссылка повреждена или собрана в другой версии данных.')
    ).not.toBeInTheDocument();
  });
});

describe("another tab's write while the index is mounted", () => {
  /* The gap the dispatch named: no test fired a storage event into a mounted
     page. `listPage.test.ts` closes it for the note-field symptom;
     this closes it for the general reload trigger, on a second page type,
     through the `null`-key path a `storage` event with no key (or this
     tab becoming visible again) uses. */
  it('redraws with another tab’s list on a null-key external change', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': TWO });
    render(App, { env: at({ storage }) });
    expect(screen.queryByRole('link', { name: /Клад дракона/ })).toBeInTheDocument();

    const third: StoredList = { id: 'c', name: 'Третий список', ids: [], created: 3 };
    storage.set('dhloot.lists.v2', JSON.stringify([listA, listB, third]));
    storage.fireExternalChange(null);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Третий список/ })).toBeInTheDocument();
    });
  });
});

/** `n` lists in store order, «Список 1» first; the names in `names` replace
 *  the first few. */
const many = (n: number, names: string[] = []): string =>
  JSON.stringify(
    Array.from({ length: n }, (_, i) => ({
      id: 'm' + String(i),
      name: names[i] ?? 'Список ' + String(i + 1),
      ids: [],
      created: n - i
    }))
  );

const cardNames = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('.listcard-top b')].map((b) => b.textContent);

/* The box is named by its placeholder alone, which Chrome's accessible name
   reads and jsdom's does not. */
const findBox = (): HTMLElement => screen.getByPlaceholderText('Найти список');

describe('the name filter', () => {
  it('draws no filter under eight lists', () => {
    render(App, { env: at({ storage: memoryStorage({ 'dhloot.lists.v2': TWO }) }) });
    expect(screen.queryByPlaceholderText('Найти список')).not.toBeInTheDocument();
  });

  it('draws the filter from the eighth list and narrows by folded name, in store order', async () => {
    const names = ['Порт Ветров', 'Рынок', 'Лавка в порту', 'Логово'];
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': many(8, names) }) })
    });
    expect(container.querySelectorAll('.listcard')).toHaveLength(8);

    await userEvent.type(findBox(), 'ПОРТ');
    expect(cardNames(container)).toEqual(['Порт Ветров', 'Лавка в порту']);
    await expectNoA11yViolations(container);
  });

  it('draws «Ничего не найдено» and no card for a query nothing matches', async () => {
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': many(8) }) })
    });
    await userEvent.type(findBox(), 'zzz');
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    expect(container.querySelectorAll('.listcard')).toHaveLength(0);
    await expectNoA11yViolations(container);
  });

  it('clears the query on a create and shows the new card first', async () => {
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': many(8) }) })
    });
    await userEvent.type(findBox(), 'zzz');
    await userEvent.type(screen.getByPlaceholderText('Например: клад дракона'), 'Тайник');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));

    expect(findBox()).toHaveValue('');
    expect(cardNames(container)[0]).toBe('Тайник');
    expect(container.querySelectorAll('.listcard')).toHaveLength(9);
  });
});

describe('«Показать ещё»', () => {
  const more = (n: number): HTMLElement =>
    screen.getByRole('button', { name: 'Показать ещё (' + String(n) + ')' });

  it('draws every card and no button at 24 lists', () => {
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': many(24) }) })
    });
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    expect(screen.queryByRole('button', { name: /Показать ещё/ })).not.toBeInTheDocument();
  });

  it('draws 24 of 30, and a press draws the rest, drops the button and focuses the 25th card', async () => {
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': many(30) }) })
    });
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    await expectNoA11yViolations(container);

    await userEvent.click(more(6));
    expect(container.querySelectorAll('.listcard')).toHaveLength(30);
    expect(screen.queryByRole('button', { name: /Показать ещё/ })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(container.querySelectorAll('.listcard-main')[24]);
  });

  it('adds 24 a press: two presses reach 60', async () => {
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': many(60) }) })
    });
    await userEvent.click(more(36));
    expect(container.querySelectorAll('.listcard')).toHaveLength(48);
    await userEvent.click(more(12));
    expect(container.querySelectorAll('.listcard')).toHaveLength(60);
  });

  it("folds the filter's result by the same rule, and a query edit folds it back to 24", async () => {
    // ten «Логово» lists, then thirty «Список» ones
    const lairs = Array.from({ length: 10 }, (_, i) => 'Логово ' + String(i + 1));
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': many(40, lairs) }) })
    });
    await userEvent.type(findBox(), 'спис');
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    await userEvent.click(more(6));
    expect(container.querySelectorAll('.listcard')).toHaveLength(30);

    await userEvent.type(findBox(), 'о');
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    expect(more(6)).toBeInTheDocument();
  });

  it('keeps the drawn count across a visit to a list and back, and starts the query over', async () => {
    const router = memoryRouter('#/lists');
    const { container } = render(App, {
      env: fakeEnv({
        router,
        data: fakeData(LOOT),
        storage: memoryStorage({ 'dhloot.lists.v2': many(30) })
      })
    });
    await userEvent.click(more(6));
    // the address the 26th card links to, as a press on it would open
    const card = container.querySelectorAll('.listcard-main')[25];
    router.navigate(card?.getAttribute('href') ?? '');
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
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': many(30) }) })
    });
    await userEvent.type(screen.getByPlaceholderText('Например: клад дракона'), 'Тайник');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(cardNames(container)[0]).toBe('Тайник');
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    expect(more(7)).toBeInTheDocument();
  });

  it('reads "Show more (N)" in English', async () => {
    render(App, {
      env: at({
        storage: memoryStorage({ 'dhloot.lists.v2': many(30), 'dhloot.lang.v1': 'en' })
      })
    });
    expect(await screen.findByRole('button', { name: 'Show more (6)' })).toBeInTheDocument();
  });
});

describe('a dataset that did not load', () => {
  it('draws noData and no panel', () => {
    render(App, { env: fakeEnv({ router: memoryRouter('#/lists'), data: noData() }) });
    expect(screen.getByRole('heading', { level: 1, name: 'Списки' })).toBeInTheDocument();
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Например: клад дракона')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Списков пока нет — создайте первый выше')
    ).not.toBeInTheDocument();
  });
});

describe('with sign-in configured', () => {
  const withCloud = (cloud: CloudPort, over: Partial<Env> = {}) => {
    const router = memoryRouter('#/lists');
    const dialog = fakeDialog();
    const view = render(App, { env: at({ router, dialog, cloud, ...over }) });
    return { ...view, router, dialog };
  };
  const groupNames = (container: HTMLElement): string[] =>
    [...container.querySelectorAll('h2')].map((h) => h.textContent);

  it('draws the prompt as the panel signed out, and «Войти» opens the account page', async () => {
    const { container, router } = withCloud(fakeCloud(SEED));
    const button = await screen.findByRole('button', { name: 'Войти' });
    expect(screen.getByRole('heading', { level: 2, name: 'Новый список' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Войдите, чтобы создавать списки: они хранятся в аккаунте и открываются на любом устройстве.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Например: клад дракона')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Войти через/ })).not.toBeInTheDocument();
    /* No local lists and working storage: no browser group, no notice. */
    expect(screen.queryByText('Списки живут только в этом браузере.')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Списков пока нет — создайте первый выше')
    ).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
    await userEvent.click(button);
    expect(router.hash()).toBe('#/account');
  });

  it("keeps this browser's cards with the notice, and no group heading, signed out", async () => {
    const { container } = withCloud(fakeCloud(SEED), {
      storage: memoryStorage({ 'dhloot.lists.v2': TWO })
    });
    await screen.findByRole('button', { name: 'Войти' });
    expect(cardNames(container)).toEqual(['Клад дракона', 'Лавка в порту']);
    expect(groupNames(container)).toEqual(['Новый список']);
    expect(screen.getByText('Списки живут только в этом браузере.')).toBeInTheDocument();
  });

  it('still says the stored lists could not be read, signed out', async () => {
    withCloud(fakeCloud(SEED), { storage: memoryStorage({ 'dhloot.lists.v2': '{' }) });
    expect(
      await screen.findByText('Сохранённые списки не удалось прочитать.')
    ).toBeInTheDocument();
  });

  it('draws no panel while the session is unknown', () => {
    const cloud = fakeCloud(SEED);
    cloud.auth.session = () => new Promise(() => undefined);
    withCloud(cloud);
    expect(screen.queryByRole('button', { name: 'Войти' })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Например: клад дракона')).not.toBeInTheDocument();
  });

  it('draws the account group newest edit first, then this browser with its notice', async () => {
    const { container } = withCloud(fakeCloud(SEED, 'gm1'), {
      storage: memoryStorage({ 'dhloot.lists.v2': TWO })
    });
    await screen.findByText('Пустой список');
    expect(groupNames(container)).toEqual(['Ваш аккаунт', 'Этот браузер']);
    expect(cardNames(container)).toEqual([
      'Пустой список',
      'Лавка кузнеца',
      'Трофеи',
      'Клад дракона',
      'Лавка в порту'
    ]);
    expect(
      [...container.querySelectorAll('.listcard-edited')].map((p) => p.textContent)
    ).toEqual(['изменён 1 час назад', 'изменён 3 дня назад', 'изменён в прошлом месяце']);
    const shop = screen.getByRole('link', {
      name: 'Лавка кузнеца, 1 позиция, изменён 3 дня назад'
    });
    expect(shop).toHaveAttribute('href', '#/lists/00000000-0000-4000-8000-000000000101');
    /* An account card has one action: delete. */
    const acts = shop.parentElement?.querySelectorAll('.listcard-acts button');
    expect([...(acts ?? [])].map((b) => b.textContent)).toEqual(['Удалить']);
    const browser = container.querySelectorAll('.group')[1];
    expect(browser?.textContent).toContain('Списки живут только в этом браузере.');
    await expectNoA11yViolations(container);
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
        [...container.querySelectorAll('.listcard-edited')].map((p) => p.textContent);
      expect(edited()[0]).toBe('изменён 1 час назад');
      const read = vi.spyOn(cloud.lists, 'list');
      await vi.advanceTimersByTimeAsync(3_600_000);
      await waitFor(() => {
        expect(edited()[0]).toBe('изменён 2 часа назад');
      });
      const answers = await Promise.all(read.mock.results.map((r) => r.value as unknown));
      expect(answers.every((a) => JSON.stringify(a) === JSON.stringify(answers[0]))).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('creates an account list, first in the account group', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const { container } = withCloud(cloud);
    await screen.findByText('Список второго ГМа');
    await userEvent.type(screen.getByPlaceholderText('Например: клад дракона'), 'Тайник');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(cardNames(container)).toEqual(['Тайник', 'Список второго ГМа']);
    expect(screen.getByText('Список «Тайник» создан')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Тайник/ })).toHaveAttribute(
      'href',
      '#/lists/00000000-0000-4000-8000-000000005000'
    );
    await waitFor(async () => {
      const read = await cloud.lists.list();
      expect(read.ok && read.lists.map((l) => l.name)).toContain('Тайник');
    });
  });

  it('deletes an account list after a confirm that names its links, with no undo', async () => {
    const { container, dialog } = withCloud(fakeCloud(SEED, 'gm1'));
    await screen.findByText('Трофеи');
    const trophies = screen.getByRole('link', { name: /Трофеи/ });
    const del = trophies.parentElement?.querySelector('.listcard-acts button');
    await userEvent.click(del as HTMLElement);
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
    const del = screen
      .getByRole('link', { name: /Трофеи/ })
      .parentElement?.querySelector('.listcard-acts button');
    await userEvent.click(del as HTMLElement);
    expect(cardNames(container)).toContain('Трофеи');
  });

  it('says loading, then a failed read with a retry that loads', async () => {
    const cloud = fakeCloud(SEED, 'gm1', { offline: true });
    const { container } = withCloud(cloud);
    expect(await screen.findByText('Не получилось загрузить списки аккаунта.')).toBeVisible();
    await expectNoA11yViolations(container);
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByText('Лавка кузнеца')).toBeInTheDocument();
  });

  it('says loading while the first read is in flight, and none when the account is empty', async () => {
    const slow = fakeCloud(SEED, 'gm1');
    slow.lists.list = () => new Promise(() => undefined);
    withCloud(slow);
    expect(await screen.findByText('Загружаем...')).toBeInTheDocument();
    cleanup();
    const empty = fakeCloud(SEED, 'gm1');
    empty.lists.list = () => Promise.resolve({ ok: true, lists: [] });
    withCloud(empty);
    expect(
      await screen.findByText('В аккаунте пока нет списков - создайте первый выше.')
    ).toBeInTheDocument();
  });

  it('filters both groups with one box and folds them as one sequence', async () => {
    const { container } = withCloud(fakeCloud(SEED, 'gm1'), {
      storage: memoryStorage({ 'dhloot.lists.v2': many(30, ['Лавка у моря']) })
    });
    await screen.findByText('Лавка кузнеца');
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    expect(cardNames(container).slice(0, 4)).toEqual([
      'Пустой список',
      'Лавка кузнеца',
      'Трофеи',
      'Лавка у моря'
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Показать ещё (9)' }));
    expect(container.querySelectorAll('.listcard')).toHaveLength(33);
    expect(document.activeElement).toBe(container.querySelectorAll('.listcard-main')[24]);

    await userEvent.type(findBox(), 'лавк');
    expect(cardNames(container)).toEqual(['Лавка кузнеца', 'Лавка у моря']);
    await userEvent.clear(findBox());
    await userEvent.type(findBox(), 'zzz');
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    expect(container.querySelectorAll('.listcard')).toHaveLength(0);
  });
});
