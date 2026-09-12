/* The lists index, `#/lists` - off `renderLists`/`storageWarning`/`hideWarn`/
 * `listCardHTML` in app.js and the create/share/delete/restore handlers the
 * plan reads off 4136-4270. `shell.test.ts` used to cover the storage notice
 * as the frame's own invention; it lives here now, where the live app draws
 * it. */

import { cleanup, render, screen } from '@testing-library/svelte';
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
    // D3: the notice's dismiss button lives inside its own <summary>, ported live markup.
    await expectNoA11yViolations(container, { allow: ['nested-interactive'] });
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

  it('folds the notice again on a language switch, as the live re-render does', async () => {
    const { container } = render(App, { env: at() });
    await userEvent.click(screen.getByText('подробнее'));
    expect(container.querySelector<HTMLDetailsElement>('details.warn')?.open).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(container.querySelector<HTMLDetailsElement>('details.warn')?.open).toBe(false);
    expect(screen.getByText('more')).toBeInTheDocument();
    // D3: the notice's dismiss button lives inside its own <summary>, ported live markup.
    await expectNoA11yViolations(container, { allow: ['nested-interactive'] });
  });
});

describe('a card per list', () => {
  it('draws two cards in store order, a known-record badge, thumbs or the empty line', async () => {
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': TWO }) })
    });

    /* Matched by a loose regex rather than the exact accessible name: jsdom's
       accessible-name library inserts a space at the boundary between the
       two block-level elements (the count and the empty paragraph) that real
       Chrome's own computation does not - context.md, "A card's accessible
       name is its text with no spaces", measured against the live app. The
       `textContent` check below is the one that actually pins the no-space
       requirement, reading the DOM text nodes directly rather than through
       that computation. */
    /* The card link renders the GM payload, not the players' one - a live-app
       bug (`listCardHTML` calls `listHash(l)` with no second argument;
       `listHash`'s `forPlayers` goes undefined, falsy) that this port
       matches: see context.md, "The card link renders the GM payload". Proof
       the two flavours actually differ for `listA` (its `hnote` makes them
       diverge) is what makes the assertion below meaningful rather than a
       line that would pass either way. */
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

    // D3: the notice's dismiss button lives inside its own <summary>, ported live markup.
    await expectNoA11yViolations(container, { allow: ['nested-interactive'] });
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

  it('removes the card and the stored list on confirmation', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': TWO });
    render(App, { env: at({ storage, dialog: fakeDialog(true) }) });
    await userEvent.click(screen.getAllByRole('button', { name: 'Удалить' })[0] as HTMLElement);

    expect(screen.queryByRole('link', { name: /Клад дракона/ })).not.toBeInTheDocument();
    expect(readLists(storage).map((l) => l.id)).toEqual(['b']);
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
