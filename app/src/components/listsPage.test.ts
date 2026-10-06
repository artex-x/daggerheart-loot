/* The lists index, `#/lists` - off `renderLists`/`storageWarning`/`hideWarn`/
 * `listCardHTML` in app.js and the create/share/delete handlers
 * (app.js 4136-4270), plus the account group and the sign-in prompt over the
 * fake cloud. `shell.test.ts` used to cover the storage notice as the frame's
 * own invention; it lives here now, where the live app draws it. */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import {
  brokenStorage,
  fakeClipboard,
  fakeData,
  fakeDialog,
  fakeEnv,
  fakeImage,
  fakePage,
  fixedClock,
  memoryRouter,
  memoryStorage,
  noData,
  plainCompress
} from '../ports/index.js';
import type { CloudPort, Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import { LEGACY_WRITE_UNTIL } from '../lib/legacy.js';
import { encodeList, encodeListRaw } from '../lib/listLink.js';
import { AppState } from '../state/app.svelte.js';
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

/** A list with one known id and one the data does not - the meta line counts
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
    expect(screen.getByRole('heading', { level: 1, name: 'Мои списки' })).toBeInTheDocument();
    expect(screen.getByText('Списки живут только в этом браузере.')).toBeInTheDocument();
    expect(screen.getByText('подробнее')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Скрыть' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Например: клад дракона')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByText('Списков пока нет - создайте первый выше.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('opens the six help paragraphs, two of them with two bold runs', async () => {
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
  it('draws two cards in store order, a known-record count, thumbs or the empty line', async () => {
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
      'Клад дракона1 позиция',
      'Лавка в порту0 позицийСписок пуст'
    ]);
    /* The count is a line in words, not the roll number's badge. */
    expect(container.querySelector('.listcard .badge')).toBeNull();

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

    expect(dialog.asked).toEqual(['Удалить список «Клад дракона»? Отменить удаление нельзя.']);
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
    expect(screen.getByRole('heading', { level: 1, name: 'Мои списки' })).toBeInTheDocument();
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Например: клад дракона')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Списков пока нет - создайте первый выше.')
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

  it("counts another account's linked item and an own item on their cards, each with a thumb", async () => {
    const gm2 = withCloud(fakeCloud(SEED, 'gm2'));
    const linked = await screen.findByRole('link', { name: /^Список второго ГМа, / });
    expect(linked.querySelector('.listcard-meta')?.textContent).toMatch(/^1 позиция · /);
    const known = linked.querySelectorAll('.listcard-thumbs img').length;
    expect(known).toBeGreaterThan(0);
    gm2.unmount();
    withCloud(fakeCloud(SEED, 'gm1'));
    const shop = await screen.findByRole('link', { name: /^Лавка кузнеца, / });
    expect(shop.querySelectorAll('.listcard-thumbs img').length).toBeGreaterThan(1);
  });

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
      screen.queryByText('Списков пока нет - создайте первый выше.')
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

  const withRequests = () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const storage = memoryStorage();
    cloud.request('player-token-1', [{ item: 'ci1', qty: 1 }]);
    cloud.request('gm-token-1', [{ item: 'cc1', qty: 1 }]);
    return { ...withCloud(cloud, { storage }), storage };
  };

  it("counts an account list's pending requests on its card and in its link's name", async () => {
    const { container } = withRequests();
    const line = await screen.findByText('2 запроса ждут ответа');
    expect(line).toHaveClass('listcard-req');
    const link = line.closest('a');
    expect(link?.getAttribute('aria-label')).toMatch(/, 2 запроса ждут ответа$/);
    expect(container.querySelectorAll('.listcard-req')).toHaveLength(1);
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

  it('counts the unread notices beside the requests, and alone, in both plural forms', async () => {
    const cloud = fakeCloud({ ...SEED, notices: shopNotices(1) }, 'gm1');
    cloud.request('player-token-1', [{ item: 'ci1', qty: 1 }]);
    cloud.request('gm-token-1', [{ item: 'cc1', qty: 1 }]);
    const { container } = withCloud(cloud);
    const line = await screen.findByText('2 запроса ждут ответа · 1 изменение');
    expect(line).toHaveClass('listcard-req');
    await expectNoA11yViolations(container);
    cleanup();
    withCloud(fakeCloud(SEED, 'gm2'));
    expect(await screen.findByText('2 изменения')).toHaveClass('listcard-req');
    cleanup();
    withCloud(fakeCloud({ ...SEED, notices: shopNotices(5) }, 'gm1'));
    expect(await screen.findByText('5 изменений')).toHaveClass('listcard-req');
  });

  it('drops the line once the requests expire', async () => {
    const { container, storage } = withRequests();
    await screen.findByText('2 запроса ждут ответа');
    const now = Date.now;
    try {
      /* The lists page never reads a request, so each lasts its 30 unread days. */
      Date.now = () => now() + 30 * 86_400_000 + 60_000;
      storage.fireExternalChange(null);
      await waitFor(() => {
        expect(container.querySelector('.listcard-req')).toBeNull();
      });
    } finally {
      Date.now = now;
    }
    await expectNoA11yViolations(container);
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

  /* Another account's browser lists: they stay in the browser group, beside
     the account's own. */
  const FOREIGN = JSON.stringify({ owner: 'another-account', lists: {} });

  it('draws the account group newest edit first, then this browser with its notice', async () => {
    const { container } = withCloud(fakeCloud(SEED, 'gm1'), {
      storage: memoryStorage({ 'dhloot.lists.v2': TWO, 'dhloot.migrated.v1': FOREIGN })
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
    expect([...container.querySelectorAll('.listcard-meta')].map((p) => p.textContent)).toEqual(
      [
        '0 позиций · изменён 1 час назад',
        '2 позиции · изменён 3 дня назад',
        '1 позиция · изменён в прошлом месяце',
        '1 позиция',
        '0 позиций'
      ]
    );
    const shop = screen.getByRole('link', {
      name: 'Лавка кузнеца, 2 позиции, изменён 3 дня назад'
    });
    expect(shop).toHaveAttribute('href', '#/lists/00000000-0000-4000-8000-000000000101');
    /* An account card has one action: delete. */
    const acts = shop.parentElement?.querySelectorAll('.listcard-acts button');
    expect([...(acts ?? [])].map((b) => b.textContent)).toEqual(['Удалить']);
    /* Drawn once the move found the lists another account's. */
    await screen.findByText('Списки живут только в этом браузере.');
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

  it('creates an account list, first in the account group', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const page = fakePage();
    const { container } = withCloud(cloud, { page });
    await screen.findByText('Список второго ГМа');
    await userEvent.type(screen.getByPlaceholderText('Например: клад дракона'), 'Тайник');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(cardNames(container)).toEqual(['Тайник', 'Список второго ГМа']);
    expect(screen.getByText('Список «Тайник» создан')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Тайник/ })).toHaveAttribute(
      'href',
      '#/lists/00000000-0000-4000-8000-000000005000'
    );
    page.fireHidden();
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
    empty.lists.list = () =>
      Promise.resolve({ ok: true, lists: [], listLimit: 50, entryLimit: 100 });
    withCloud(empty);
    expect(
      await screen.findByText('В аккаунте пока нет списков - создайте первый выше.')
    ).toBeInTheDocument();
    expect(screen.getByText('0 списков из 50')).toBeInTheDocument();
  });

  it('counts the account lists with the limit, at the limit and at an override of 150', async () => {
    const { container } = withCloud(fakeCloud(SEED, 'gm1'));
    expect(await screen.findByText('3 списка из 50')).toBeInTheDocument();
    await expectNoA11yViolations(container);
    cleanup();
    withCloud(fakeCloud(SEED, 'gm1', { limits: { lists: 3 } }));
    expect(await screen.findByText('3 списка из 3')).toBeInTheDocument();
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

  it('filters both groups with one box and folds them as one sequence', async () => {
    const { container } = withCloud(fakeCloud(SEED, 'gm1'), {
      storage: memoryStorage({
        'dhloot.lists.v2': many(30, ['Лавка у моря']),
        'dhloot.migrated.v1': FOREIGN
      })
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

describe('the move into the account and the cutoff', () => {
  const GM1 = SEED.users.gm1.id;
  const AFTER = { clock: fixedClock(LEGACY_WRITE_UNTIL) };
  const slot = (container: HTMLElement): string =>
    [...container.querySelectorAll('.group')].at(1)?.textContent ?? '';
  const actionsOf = (name: RegExp): string[] => {
    const card = screen.getByRole('link', { name }).parentElement;
    return [...(card?.querySelectorAll('.listcard-acts button') ?? [])].map(
      (b) => b.textContent
    );
  };

  it('says «Переносим...» while the lists move, the cards read-only, then the notice', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    let release = (): void => undefined;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const move = cloud.lists.move.bind(cloud.lists);
    cloud.lists.move = async (id, text) => {
      await gate;
      return move(id, text);
    };
    const storage = memoryStorage({ 'dhloot.lists.v2': TWO });
    const { container } = render(App, { env: at({ cloud, storage }) });
    expect(await screen.findByText('Переносим списки в аккаунт...')).toBeInTheDocument();
    expect(actionsOf(/Клад дракона/)).toEqual([]);
    expect(screen.getByRole('link', { name: /Клад дракона/ })).toHaveAttribute(
      'href',
      '#/lists/a'
    );
    await expectNoA11yViolations(container);
    release();
    expect(
      await screen.findByText(
        'Списки из этого браузера перенесены в ваш аккаунт: «Клад дракона», «Лавка в порту».'
      )
    ).toBeInTheDocument();
    expect(readLists(storage)).toEqual([]);
    expect(screen.queryByRole('heading', { level: 2, name: 'Этот браузер' })).toBeNull();
  });

  it('says the network stopped the move, and «Повторить» reads the account and moves', async () => {
    const retry = vi.spyOn(AppState.prototype, 'retryLists');
    const cloud = fakeCloud(SEED, 'gm1', { offline: true });
    const storage = memoryStorage({ 'dhloot.lists.v2': TWO });
    const { container } = render(App, { env: at({ cloud, storage }) });
    expect(
      await screen.findByText(
        'Не все списки перенесены: нет связи. Попробуем при следующем открытии.'
      )
    ).toBeInTheDocument();
    expect(actionsOf(/Лавка в порту/)).toEqual([]);
    await expectNoA11yViolations(container);
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(retry).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(readLists(storage)).toEqual([]);
    });
    retry.mockRestore();
  });

  it('names a list the server refused, and keeps it', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    vi.spyOn(cloud.lists, 'move').mockResolvedValueOnce({ ok: false, error: 'refused' });
    const storage = memoryStorage({ 'dhloot.lists.v2': TWO });
    const { container } = render(App, { env: at({ cloud, storage }) });
    await screen.findByText('Не перенесён: «Клад дракона».');
    expect(slot(container)).toContain(
      'Не перенесён: «Клад дракона». Сервер не принял список. Напишите на daggerheart.loot@gmail.com.'
    );
    await waitFor(() => {
      expect(readLists(storage).map((l) => l.id)).toEqual(['a']);
    });
    await expectNoA11yViolations(container);
  });

  it('names a held list, and a delete takes the list and its text away', async () => {
    const storage = memoryStorage({
      'dhloot.lists.v2': TWO,
      'dhloot.migrated.v1': JSON.stringify({ owner: GM1, lists: { b: 'x' }, held: ['a'] })
    });
    const { container } = render(App, {
      env: at({ cloud: fakeCloud(SEED, 'gm1'), storage, dialog: fakeDialog(true) })
    });
    await screen.findByText('Не перенесён: «Клад дракона».');
    expect(slot(container)).toContain(
      'Копия в аккаунте не совпала со списком. Напишите на daggerheart.loot@gmail.com.'
    );
    await expectNoA11yViolations(container);
    const card = screen.getByRole('link', { name: /Клад дракона/ }).parentElement;
    const del = [...(card?.querySelectorAll('.listcard-acts button') ?? [])].find(
      (btn) => btn.textContent === 'Удалить'
    );
    await userEvent.click(del as HTMLElement);
    expect(screen.queryByText('Не перенесён: «Клад дракона».')).toBeNull();
    expect(readLists(storage)).toEqual([]);
  });

  it('prunes a held list from the tombstones when it is deleted after the cutoff', async () => {
    const storage = memoryStorage({
      'dhloot.lists.v2': TWO,
      'dhloot.migrated.v1': JSON.stringify({ owner: GM1, lists: {}, held: ['a'] })
    });
    render(App, {
      env: at({ storage, dialog: fakeDialog(true), cloud: fakeCloud(SEED), ...AFTER })
    });
    await screen.findByRole('button', { name: 'Войти' });
    await userEvent.click(screen.getAllByRole('button', { name: 'Удалить' })[0] as HTMLElement);
    expect(
      (JSON.parse(storage.get('dhloot.migrated.v1') ?? '{}') as { held?: string[] }).held
    ).toBeUndefined();
  });

  it('adds the move sentence signed out only while no account owns the lists', async () => {
    const out = render(App, {
      env: at({ cloud: fakeCloud(SEED), storage: memoryStorage({ 'dhloot.lists.v2': TWO }) })
    });
    await screen.findByRole('button', { name: 'Войти' });
    const sentence =
      'Войдите до 26 октября 2026 года - и они перенесутся в аккаунт. После этой даты приложение перестанет их показывать.';
    expect(screen.getByText(sentence)).toBeInTheDocument();
    await expectNoA11yViolations(out.container);
    cleanup();
    render(App, {
      env: at({
        cloud: fakeCloud(SEED),
        storage: memoryStorage({
          'dhloot.lists.v2': TWO,
          'dhloot.migrated.v1': JSON.stringify({ owner: GM1, lists: {} })
        })
      })
    });
    await screen.findByRole('button', { name: 'Войти' });
    expect(screen.queryByText(sentence)).toBeNull();
    expect(screen.getByText('Списки живут только в этом браузере.')).toBeInTheDocument();
    cleanup();
    render(App, { env: at({ storage: memoryStorage({ 'dhloot.lists.v2': TWO }) }) });
    expect(screen.queryByText(sentence)).toBeNull();
  });

  it('draws the read-only notice and cards after the cutoff, with a delete that has no undo', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': TWO });
    const dialog = fakeDialog(true);
    const { container } = render(App, {
      env: at({ cloud: fakeCloud(SEED), storage, dialog, ...AFTER })
    });
    await screen.findByRole('button', { name: 'Войти' });
    expect(
      screen.getByText('Списки в этом браузере только для чтения с 26 октября 2026 года.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Войдите - они перенесутся в аккаунт, и их снова можно будет править. Скопировать текст и напечатать можно и так.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Скрыть' })).toBeNull();
    expect(actionsOf(/Клад дракона/)).toEqual(['Удалить']);
    expect(screen.getByRole('link', { name: /Клад дракона/ })).toHaveAttribute(
      'href',
      '#/lists/a'
    );
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getAllByRole('button', { name: 'Удалить' })[0] as HTMLElement);
    expect(dialog.asked).toEqual(['Удалить список «Клад дракона»? Отменить удаление нельзя.']);
    expect(readLists(storage).map((l) => l.id)).toEqual(['b']);
    expect(screen.getByText('Список «Клад дракона» удалён')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Вернуть' })).toBeNull();
  });

  it('draws the read-only title alone after the cutoff once an account owns the lists', async () => {
    const storage = memoryStorage({
      'dhloot.lists.v2': TWO,
      'dhloot.migrated.v1': JSON.stringify({ owner: GM1, lists: {} })
    });
    render(App, { env: at({ cloud: fakeCloud(SEED), storage, ...AFTER }) });
    await screen.findByRole('button', { name: 'Войти' });
    expect(
      screen.getByText('Списки в этом браузере только для чтения с 26 октября 2026 года.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/Войдите - они перенесутся/)).toBeNull();
  });

  it('keeps a build with no sign-in writable after the cutoff', () => {
    render(App, { env: at({ storage: memoryStorage({ 'dhloot.lists.v2': TWO }), ...AFTER }) });
    expect(actionsOf(/Клад дракона/)).toEqual(['Поделиться', 'Удалить']);
    expect(screen.getByText('Списки живут только в этом браузере.')).toBeInTheDocument();
  });
});

describe('selecting account lists', () => {
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
  const pick = (name: string): HTMLInputElement =>
    screen.getByRole('checkbox', { name: 'Выбрать: ' + name });
  const summary = (c: HTMLElement): string =>
    c.querySelector('.batch-summ')?.textContent.trim() ?? '';
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

  it('gives each account card a pick box and every card a count line, no badge', async () => {
    const { container } = await signedIn(fakeCloud(SEED, 'gm1'), {
      storage: memoryStorage({
        'dhloot.lists.v2': TWO,
        'dhloot.migrated.v1': JSON.stringify({ owner: 'another-account', lists: {} })
      })
    });
    expect(
      screen
        .getAllByRole('checkbox', { name: /^Выбрать: / })
        .map((b) => b.getAttribute('aria-label'))
    ).toEqual(['Выбрать: Пустой список', 'Выбрать: Лавка кузнеца', 'Выбрать: Трофеи']);
    expect(container.querySelectorAll('.listcard .badge')).toHaveLength(0);
    expect(container.querySelectorAll('.listcard-meta')).toHaveLength(5);
    /* The box is outside the card's link, which keeps its own name. */
    expect(pick(EMPTY).closest('a')).toBeNull();
    expect(screen.getByRole('link', { name: /^Пустой список, / })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Выбрать все' })).not.toBeChecked();
    expect(summary(container)).toBe('');
  });

  it('draws the strip on for two ticked cards, and downloads the two in index order', async () => {
    const image = fakeImage();
    const { container } = await signedIn(fakeCloud(SEED, 'gm1'), { image });
    await userEvent.click(pick(TROPHIES));
    await userEvent.click(pick(EMPTY));
    expect(summary(container)).toBe('Выбрано 2');
    const all = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Выбрать все' });
    expect(all.indeterminate).toBe(true);
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
    expect(screen.getByRole('button', { name: 'Удалить (2)' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('keeps everything when the confirm is refused', async () => {
    const { container } = await signedIn(fakeCloud(SEED, 'gm1'), {
      dialog: fakeDialog(false)
    });
    await userEvent.click(pick(EMPTY));
    await userEvent.click(pick(TROPHIES));
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (2)' }));
    expect(cardNames(container)).toEqual([EMPTY, 'Лавка кузнеца', TROPHIES]);
    expect(ticked(container)).toBe(2);
  });

  it('deletes the ticked lists after one confirm that names them, with no undo', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const page = fakePage();
    const dialog = fakeDialog();
    const { container } = await signedIn(cloud, { page, dialog });
    await userEvent.click(pick(EMPTY));
    await userEvent.click(pick(TROPHIES));
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (2)' }));
    expect(dialog.asked).toEqual([
      'Удалить списки (2): «Пустой список», «Трофеи»? Ссылки для игроков и мастера на них перестанут работать. Отменить удаление нельзя.'
    ]);
    expect(cardNames(container)).toEqual(['Лавка кузнеца']);
    expect(screen.getByText('Удалено списков: 2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Вернуть' })).toBeNull();
    expect(summary(container)).toBe('');
    expect(ticked(container)).toBe(0);
    page.fireHidden();
    await waitFor(async () => {
      const read = await cloud.lists.list();
      expect(read.ok && read.lists.map((l) => l.name)).toEqual(['Лавка кузнеца']);
    });
  });

  it('names five lists in the confirm, then counts the rest', async () => {
    const dialog = fakeDialog();
    await signedIn(await withLists(['А', 'Б', 'В', 'Г']), { dialog });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
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
    await userEvent.click(pick('Порт Ветров'));
    await userEvent.click(pick('Рынок'));
    expect(summary(container)).toBe('Выбрано 2');
    await userEvent.type(findBox(), 'порт');
    expect(summary(container)).toBe('Выбрано 1');
    expect(screen.getByRole('button', { name: 'Удалить (1)' })).toBeInTheDocument();
    await userEvent.clear(findBox());
    expect(pick('Рынок')).not.toBeChecked();
    expect(summary(container)).toBe('Выбрано 1');
    await userEvent.type(findBox(), 'порт');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
    expect(summary(container)).toBe('Выбрано 2');
    expect(ticked(container)).toBe(2);
    expect(screen.getByRole('button', { name: 'Скачать JSON (2)' })).toBeInTheDocument();
    await userEvent.clear(findBox());
    expect(ticked(container)).toBe(2);
    expect(summary(container)).toBe('Выбрано 2');
  });

  it('keeps the ticks when «Показать ещё» draws more', async () => {
    const cloud = await withLists(Array.from({ length: 27 }, (_, i) => 'Ещё ' + String(i + 1)));
    const { container } = render(App, { env: at({ router: memoryRouter('#/lists'), cloud }) });
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Выбрать: Ещё 27' }));
    await userEvent.click(screen.getByRole('button', { name: 'Показать ещё (6)' }));
    expect(ticked(container)).toBe(1);
    expect(summary(container)).toBe('Выбрано 1');
  });

  it('draws the import toggle only while the lists are read', async () => {
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

    const offline = fakeCloud(SEED, 'gm1', { offline: true });
    render(App, { env: at({ router: memoryRouter('#/lists'), cloud: offline }) });
    await screen.findByText('Не получилось загрузить списки аккаунта.');
    expect(screen.queryByRole('button', { name: 'Импорт из файла' })).toBeNull();
    cleanup();

    await signedIn();
    expect(screen.getByRole('button', { name: 'Импорт из файла' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('names the pick box of a list with no name «Без названия»', async () => {
    await signedIn(await withLists(['']));
    expect(screen.getByRole('checkbox', { name: 'Выбрать: Без названия' })).toBeInTheDocument();
  });

  it('draws the missing-art thumb after a card picture fails', async () => {
    const withArt: Loot = {
      ...LOOT,
      items: { core_item: [{ ...LOOT.items['core_item']![0]!, img: 'ci1.webp' }] }
    };
    const { container } = await signedIn(fakeCloud(SEED, 'gm1'), { data: fakeData(withArt) });
    const img = container.querySelector<HTMLImageElement>('.listcard-thumbs img');
    expect(img).toHaveAttribute('src', 'img/thumb/ci1.webp');
    await fireEvent.error(img!);
    await waitFor(() => {
      expect(container.querySelector('.listcard-thumbs img')).toHaveAttribute(
        'src',
        'img/thumb/_none.webp'
      );
    });
  });

  it('passes axe with one card picked', async () => {
    const { container } = await signedIn();
    await userEvent.click(pick('Лавка кузнеца'));
    expect(summary(container)).toBe('Выбрано 1');
    await expectNoA11yViolations(container);
  });
});
