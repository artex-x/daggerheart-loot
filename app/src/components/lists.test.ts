/* The add-to-list row on the card, driven through fake ports.
 *
 * `state/lists.test.ts` covers the store itself; this is what a person sees
 * and presses - the button, the menu, a chip's tick, the new-list form, and
 * the toast each of those raises. Off `listMenuHTML`/`addToListBtn` in
 * app.js and `listMemberFor(item)`'s own live behaviour. */

import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import {
  brokenStorage,
  fakeData,
  fakeEnv,
  memoryRouter,
  memoryStorage
} from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import type { Loot } from '../lib/data.js';
import type { StoredList } from '../lib/lists.js';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView - `placeMenu`'s port calls it
   unconditionally once the menu is open. */
Element.prototype.scrollIntoView = vi.fn();

/** Typed, so a read-back assertion is not an unsafe member access on `any`. */
const readLists = (storage: { get: (k: string) => string | null }): StoredList[] =>
  JSON.parse(storage.get('dhloot.lists.v2') ?? '[]') as StoredList[];

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

const TWO = JSON.stringify([
  { id: 'a', name: 'Клад дракона', ids: [], created: 1 },
  { id: 'b', name: 'Лавка в порту', ids: [], created: 2 }
]);

const at = (over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter('#/i/ci1'), data: fakeData(LOOT), ...over });

const openMenu = (): Promise<void> =>
  userEvent.click(screen.getByRole('button', { name: 'Добавить в список' }));

describe('the row under a full card', () => {
  it('draws the button, folded, and the print link', () => {
    render(App, { env: at() });
    expect(screen.getByRole('button', { name: 'Добавить в список' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    const print = screen.getByRole('link', { name: 'Печать' });
    expect(print).toHaveAttribute('href', '#/print/ci1');
    expect(print).toHaveAttribute('title', 'Собрать карточки для печати: девять на лист A4');
  });

  it('opens the menu newest list first, naming a single record "лежит в списках"', async () => {
    render(App, { env: at({ storage: memoryStorage({ 'dhloot.lists.v2': TWO }) }) });
    await openMenu();

    expect(screen.getByText('Лежит в списках')).toBeInTheDocument();
    const chips = screen.getAllByRole('button', { name: /Лавка в порту|Клад дракона/ });
    expect(chips.map((c) => c.textContent)).toEqual(['Лавка в порту', 'Клад дракона']);
    expect(screen.getByRole('button', { name: 'Добавить в список' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('adds on a chip press, ticks it, keeps the menu open, and toasts', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': TWO });
    render(App, { env: at({ storage }) });
    await openMenu();

    await userEvent.click(screen.getByRole('button', { name: 'Клад дракона' }));
    expect(screen.getByRole('button', { name: '✓ Клад дракона' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Добавить в список' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByText('Добавлено в «Клад дракона»')).toBeInTheDocument();
    expect(readLists(storage)[0]?.ids).toEqual(['ci1']);
  });

  it('removes on a second press, toasts the removal, and undoes back into place with its meta (P5)', async () => {
    const inList = JSON.stringify([
      {
        id: 'a',
        name: 'Клад дракона',
        ids: ['w1', 'ci1'],
        created: 1,
        meta: { ci1: { qty: 3 } }
      },
      { id: 'b', name: 'Лавка в порту', ids: [], created: 2 }
    ]);
    const storage = memoryStorage({ 'dhloot.lists.v2': inList });
    render(App, { env: at({ storage }) });
    await openMenu();

    await userEvent.click(screen.getByRole('button', { name: '✓ Клад дракона' }));
    expect(screen.getByRole('button', { name: 'Клад дракона' })).toBeInTheDocument();
    expect(screen.getByText('Убрано из «Клад дракона»')).toBeInTheDocument();
    expect(readLists(storage)[0]?.ids).toEqual(['w1']);

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect(readLists(storage)[0]?.ids).toEqual(['w1', 'ci1']);
    expect(readLists(storage)[0]?.meta).toEqual({ ci1: { qty: 3 } });
  });

  it('grows a search box past eight lists, and narrows by typing', async () => {
    const eight = JSON.stringify(
      Array.from({ length: 8 }, (_, i) => ({
        id: 'l' + String(i),
        name: i === 3 ? 'Лавка у порта' : 'Список ' + String(i),
        ids: [],
        created: i
      }))
    );
    render(App, { env: at({ storage: memoryStorage({ 'dhloot.lists.v2': eight }) }) });
    await openMenu();

    const search = screen.getByRole('searchbox', { name: 'Найти список' });
    await userEvent.type(search, 'порта');
    expect(screen.getByRole('button', { name: 'Лавка у порта' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Список 0' })).not.toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, 'zzz');
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
  });

  it('draws no search box under eight lists', async () => {
    render(App, { env: at({ storage: memoryStorage({ 'dhloot.lists.v2': TWO }) }) });
    await openMenu();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('opens the new-list form with focus, refuses a blank name, and creates a named one', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': TWO });
    render(App, { env: at({ storage }) });
    await openMenu();

    await userEvent.click(screen.getByRole('button', { name: '+ Новый список' }));
    const input = screen.getByPlaceholderText('Например: клад дракона');
    expect(input).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Сначала назовите список');

    await userEvent.type(input, 'Новый клад');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));

    expect(screen.queryByPlaceholderText('Например: клад дракона')).not.toBeInTheDocument();
    const saved = readLists(storage);
    expect(saved[0]?.name).toBe('Новый клад');
    expect(saved[0]?.ids).toEqual(['ci1']);
  });

  it('folds the new-list form on cancel', async () => {
    render(App, { env: at({ storage: memoryStorage({ 'dhloot.lists.v2': TWO }) }) });
    await openMenu();
    await userEvent.click(screen.getByRole('button', { name: '+ Новый список' }));
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(screen.queryByPlaceholderText('Например: клад дракона')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Новый список' })).toBeInTheDocument();
  });

  it('opens the new-list form under a real browser event ordering', async () => {
    /* jsdom's userEvent.click and parity's el.click() both dispatch on a
       non-empty call stack, so no microtask checkpoint runs between the app
       root's delegated handler and AddToList's own `<svelte:document
       onclick>` - Svelte 5's flush (a microtask) waits until the stack
       unwinds, so both layers see the menu still holding the pressed chip
       and pass regardless of the fix. A trusted click in a real browser runs
       a checkpoint after every listener; this test reproduces that ordering
       by flushing from a bubble listener planted between the two: it runs
       after the app root's handler (a descendant, so bubbles first) and
       before `document`'s (bubbles last). */
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': TWO }) })
    });
    await openMenu();

    const onBubble = (): void => {
      flushSync();
    };
    document.body.addEventListener('click', onBubble);
    try {
      await userEvent.click(screen.getByRole('button', { name: '+ Новый список' }));
      expect(screen.getByPlaceholderText('Например: клад дракона')).toHaveFocus();
      expect(screen.getByText('Лежит в списках')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));
      expect(screen.getByText('Лежит в списках')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+ Новый список' })).toBeInTheDocument();
    } finally {
      document.body.removeEventListener('click', onBubble);
    }
    await expectNoA11yViolations(container);
  });

  it('closes on a click outside the control', async () => {
    render(App, { env: at({ storage: memoryStorage({ 'dhloot.lists.v2': TWO }) }) });
    await openMenu();
    expect(screen.getByText('Лежит в списках')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('heading', { level: 1 }));
    expect(screen.queryByText('Лежит в списках')).not.toBeInTheDocument();
  });

  it('closes on a navigation', async () => {
    const router = memoryRouter('#/i/ci1');
    render(App, { env: fakeEnv({ router, data: fakeData(LOOT) }) });
    await openMenu();
    router.navigate('#/tables');
    await waitFor(() => {
      expect(screen.queryByText('Лежит в списках')).not.toBeInTheDocument();
    });
  });

  it('keeps adding for the session and toasts saveFailed when storage refuses', async () => {
    /* Broken storage reads back nothing, so there is no existing list to seed
       - the only way to reach a list at all is to create one, which also
       exercises the store's own refusal from inside `create()`. */
    render(App, { env: at({ storage: brokenStorage() }) });
    await openMenu();
    await userEvent.click(screen.getByRole('button', { name: '+ Новый список' }));
    await userEvent.type(screen.getByPlaceholderText('Например: клад дракона'), 'Клад дракона');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Не удалось сохранить: браузер блокирует локальное хранилище'
    );
    // added for the session even though nothing persisted
    expect(screen.getByRole('button', { name: '✓ Клад дракона' })).toBeInTheDocument();
  });

  it('draws the same row inside the modal a table row opens', async () => {
    render(App, { env: fakeEnv({ router: memoryRouter('#/tables'), data: fakeData(LOOT) }) });
    await userEvent.click(screen.getByRole('button', { name: /Спальный мешок/ }));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('button', { name: 'Добавить в список' })
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Печать' })).toHaveAttribute(
      'href',
      '#/print/ci1'
    );
  });
});

/** Eight lists, the menu's search threshold; `ci1` lies in «Сундук мага» (the
 *  oldest) and «Порт Ветров», never in the newest. */
const EIGHT = JSON.stringify(
  [
    'Сундук мага',
    'Рынок',
    'Порт Ветров',
    'Трофеи ёжа',
    'Кузнец',
    'Логово',
    'Храм Солнца',
    'Лавка в порту'
  ].map((name, i) => ({
    id: 'l' + String(i),
    name,
    ids: i === 0 || i === 2 ? ['ci1'] : [],
    created: i + 1
  }))
);

const chipNames = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('.pickchips .chip')].map((c) => c.textContent);

describe('many lists in the menu', () => {
  it('puts the lists holding the record first, newest first in each group', async () => {
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': EIGHT }) })
    });
    await openMenu();
    expect(chipNames(container)).toEqual([
      '✓ Порт Ветров',
      '✓ Сундук мага',
      'Лавка в порту',
      'Храм Солнца',
      'Логово',
      'Кузнец',
      'Трофеи ёжа',
      'Рынок'
    ]);
  });

  it('keeps a pressed chip in its place until the menu opens again', async () => {
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': EIGHT }) })
    });
    await openMenu();
    await userEvent.click(screen.getByRole('button', { name: 'Кузнец' }));
    await userEvent.click(screen.getByRole('button', { name: '✓ Порт Ветров' }));
    expect(chipNames(container)).toEqual([
      'Порт Ветров',
      '✓ Сундук мага',
      'Лавка в порту',
      'Храм Солнца',
      'Логово',
      '✓ Кузнец',
      'Трофеи ёжа',
      'Рынок'
    ]);

    await openMenu();
    await openMenu();
    expect(chipNames(container).slice(0, 3)).toEqual([
      '✓ Кузнец',
      '✓ Сундук мага',
      'Лавка в порту'
    ]);
  });

  it('finds a list with ё from a query typed with е', async () => {
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': EIGHT }) })
    });
    await openMenu();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Найти список' }), 'ежа');
    expect(chipNames(container)).toEqual(['Трофеи ёжа']);
  });

  it('scrolls the chips only: the search and the new-list chip sit outside them', async () => {
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': EIGHT }) })
    });
    await openMenu();
    const chips = container.querySelector('.pickchips');
    expect(chips).not.toBeNull();
    expect(chips?.contains(screen.getByRole('searchbox', { name: 'Найти список' }))).toBe(
      false
    );
    expect(chips?.contains(screen.getByRole('button', { name: '+ Новый список' }))).toBe(false);
    expect(chips?.contains(screen.getByRole('button', { name: 'Рынок' }))).toBe(true);
  });

  it('starts the new-list form with the query, and a create clears the query', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': EIGHT });
    const { container } = render(App, { env: at({ storage }) });
    await openMenu();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Найти список' }), 'Сундук ');
    await userEvent.click(screen.getByRole('button', { name: '+ Новый список' }));

    const input = screen.getByPlaceholderText('Например: клад дракона');
    expect(input).toHaveValue('Сундук');
    expect(input).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(screen.getByRole('searchbox', { name: 'Найти список' })).toHaveValue('');
    expect(readLists(storage)[0]).toMatchObject({ name: 'Сундук', ids: ['ci1'] });
    // a list created while the menu is open joins the lists holding the record
    expect(chipNames(container)[0]).toBe('✓ Сундук');
  });
});

describe('accessibility', () => {
  it('has no axe violations with the menu open', async () => {
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': TWO }) })
    });
    await openMenu();
    await expectNoA11yViolations(container);
  });

  it('has no axe violations with a chip ticked and the toast showing', async () => {
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': TWO }) })
    });
    await openMenu();
    await userEvent.click(screen.getByRole('button', { name: 'Клад дракона' }));
    await expectNoA11yViolations(container);
  });

  it('has no axe violations with the new-list form open', async () => {
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': TWO }) })
    });
    await openMenu();
    await userEvent.click(screen.getByRole('button', { name: '+ Новый список' }));
    await expectNoA11yViolations(container);
  });

  it('has no axe violations with eight lists, the search drawn and a query typed', async () => {
    const { container } = render(App, {
      env: at({ storage: memoryStorage({ 'dhloot.lists.v2': EIGHT }) })
    });
    await openMenu();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Найти список' }), 'порт');
    await expectNoA11yViolations(container);
  });
});
