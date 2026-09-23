/* The lists index, `#/lists` - off `renderLists`/`storageWarning`/`hideWarn`/
 * `listCardHTML` in app.js and the create/share/delete/restore handlers
 * (app.js 4136-4270). `shell.test.ts` used to cover the storage notice
 * as the frame's own invention; it lives here now, where the live app draws
 * it. */

import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App.svelte';
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
import type { CompressPort, Env } from '../ports/index.js';
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
  it('draws the heading, the folded notice, both fields and the empty state', async () => {
    const { container } = render(App, { env: at() });
    expect(screen.getByRole('heading', { level: 1, name: 'Списки' })).toBeInTheDocument();
    expect(screen.getByText('Списки живут только в этом браузере.')).toBeInTheDocument();
    expect(screen.getByText('подробнее')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Скрыть' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Например: клад дракона')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ссылка на список')).toBeInTheDocument();
    expect(screen.getByText('Списков пока нет — создайте первый выше')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('opens the four help paragraphs, two of them with two bold runs', async () => {
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

  it('draws the unreadable-storage warning in place of the fold-open notice, undismissable (R1)', async () => {
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
    /* D3, paid off: `<details>` moved to a plain child of `.warn`, which now
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

    /* Matched by a loose regex rather than the exact accessible name: both
       jsdom's accessible-name computation and real Chrome's insert a space
       at the boundary between the two block-level elements (the count and
       the empty paragraph) - `tests/app/snapshots/_lists_two_lists.txt:37,41`
       shows Chrome computing `link "Клад дракона 7"` and `link "Лавка в
       порту 0 Список пуст"`, with the spaces; the two agree here. The
       `textContent` check below pins a different thing: the raw text-node
       structure, concatenated with no separator, not the accessible name. */
    /* The card link renders the GM payload, not the players' one - a live-app
       bug (`listCardHTML` calls `listHash(l)` with no second argument;
       `listHash`'s `forPlayers` goes undefined, falsy) that this port
       matches. Proof the two flavours actually differ for `listA` (its
       `hnote` makes them diverge) is what makes the assertion below
       meaningful rather than a line that would pass either way. */
    expect(encodeList(listA, false)).not.toBe(encodeList(listA, true));

    const cardA = screen.getByRole('link', { name: /Клад дракона/ });
    expect(cardA).toHaveAttribute('href', '#/l/' + encodeList(listA, false));
    expect(cardA.querySelectorAll('img')).toHaveLength(1);

    const cardB = screen.getByRole('link', { name: /Лавка в порту/ });
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
      'Не удалось сохранить: браузер блокирует локальное хранилище'
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
    expect(screen.getByRole('link', { name: 'Клад дракона1' })).toBeInTheDocument();
    expect(readLists(storage)).toHaveLength(2);
  });

  it('removes the card and the stored list on confirmation, and toasts with an undo (P5)', async () => {
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

describe('restoring a list', () => {
  const fixture: StoredList = {
    id: 'x',
    name: 'Оружейная',
    ids: ['ci1'],
    created: 1,
    meta: { ci1: { qty: 2 } }
  };

  it('takes a full link, navigates to it, and stores the name, ids and meta', async () => {
    const router = memoryRouter('#/lists');
    const storage = memoryStorage();
    const payload = encodeList(fixture, true);
    render(App, { env: fakeEnv({ router, data: fakeData(LOOT), storage }) });

    await userEvent.type(screen.getByPlaceholderText('Ссылка на список'), '#/l/' + payload);
    await userEvent.click(screen.getByRole('button', { name: 'Восстановить' }));

    expect(router.hash()).toBe('#/l/' + payload);
    const stored = readLists(storage);
    expect(stored[0]?.name).toBe('Оружейная');
    expect(stored[0]?.ids).toEqual(['ci1']);
    expect(stored[0]?.meta).toEqual({ ci1: { qty: 2 } });
  });

  it('takes a bare payload with no #/l/ prefix', async () => {
    const router = memoryRouter('#/lists');
    const storage = memoryStorage();
    const payload = encodeList(fixture, true);
    render(App, { env: fakeEnv({ router, data: fakeData(LOOT), storage }) });

    await userEvent.type(screen.getByPlaceholderText('Ссылка на список'), payload);
    await userEvent.click(screen.getByRole('button', { name: 'Восстановить' }));

    expect(router.hash()).toBe('#/l/' + payload);
    expect(readLists(storage)[0]?.ids).toEqual(['ci1']);
  });

  it('takes a packed payload through a compress port whose unpack maps it to the plain one', async () => {
    /* No real deflate here - what matters is that `unpack` runs before
       `decodeList`, not the compression itself, which `ports.test.ts` already
       covers against the real stream. */
    const plain = encodeList(fixture, true);
    const compress: CompressPort = {
      available: () => true,
      pack: () => Promise.resolve('~' + plain),
      unpack: (payload) => Promise.resolve(payload.startsWith('~') ? payload.slice(1) : payload)
    };
    const router = memoryRouter('#/lists');
    const storage = memoryStorage();
    render(App, { env: fakeEnv({ router, data: fakeData(LOOT), storage, compress }) });

    await userEvent.type(screen.getByPlaceholderText('Ссылка на список'), '#/l/~' + plain);
    await userEvent.click(screen.getByRole('button', { name: 'Восстановить' }));

    expect(router.hash()).toBe('#/l/' + plain);
    expect(readLists(storage)[0]?.ids).toEqual(['ci1']);
  });

  it('passes money, note and hnote through instead of dropping them, and toasts the dropped-id count (R3/P9)', async () => {
    const withNotes: StoredList = {
      id: 'x',
      name: 'Оружейная',
      ids: ['ci1', 'zzz999'],
      created: 1,
      money: 'coin',
      note: 'Для игроков',
      hnote: 'Только для мастера'
    };
    const router = memoryRouter('#/lists');
    const storage = memoryStorage();
    /* The players' link, off which restore() is meant to work too - it never
       carries hnote, so that field's absence below is that shape, not a bug. */
    const payload = encodeList(withNotes, true);
    render(App, { env: fakeEnv({ router, data: fakeData(LOOT), storage }) });

    await userEvent.type(screen.getByPlaceholderText('Ссылка на список'), '#/l/' + payload);
    await userEvent.click(screen.getByRole('button', { name: 'Восстановить' }));

    const stored = readLists(storage)[0];
    expect(stored?.money).toBe('coin');
    expect(stored?.note).toBe('Для игроков');
    expect(stored?.hnote).toBeUndefined();
    expect(
      screen.getByText('Пропущена 1 позиция — её больше нет в данных')
    ).toBeInTheDocument();
  });

  it('toasts badShare as an alert for garbage', async () => {
    render(App, { env: at() });
    await userEvent.type(
      screen.getByPlaceholderText('Ссылка на список'),
      'not a link at all, just words'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Восстановить' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ссылка повреждена или собрана в другой версии данных.'
    );
  });
});

describe("another tab's write while the index is mounted (R2)", () => {
  /* The gap the dispatch named: no test fired a storage event into a mounted
     page. `listPage.test.ts` closes it for the note-field symptom;
     this closes it for R2's general reload trigger, on a second page type,
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
