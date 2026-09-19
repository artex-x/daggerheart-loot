/* The list page, `#/lists/<id>` and `#/l/<payload>` - off `renderOneList` and
 * everything it draws. Through `App`, the way `listsPage.test.ts` reaches the
 * index: the address rewrite, the tab bar and the modal all live above this
 * component. */

import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import { buildIndex } from '../lib/data.js';
import { dict } from '../lib/dict.js';
import { encodeList } from '../lib/listLink.js';
import type { Loot } from '../lib/data.js';
import { shareList } from '../lib/share.js';
import type { StoredList } from '../lib/lists.js';
import {
  fakeClipboard,
  fakeData,
  fakeDialog,
  fakeDrag,
  fakeEnv,
  memoryRouter,
  memoryStorage,
  noData,
  plainCompress
} from '../ports/index.js';
import type { CompressPort, Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView or the layout getters autoSize
   reads; the note boxes' own effect skips them (offsetParent is always
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

/** Three known ids and one the data does not know, priced/counted/noted on
 *  one entry, a list note both public and hidden - the "noted" shape. */
const listA: StoredList = {
  id: 'a',
  name: 'Тайник',
  ids: ['ci1', 'cc1', 'q1'],
  created: 1,
  note: 'Лавка закрыта до утра',
  hnote: 'Не для игроков',
  meta: {
    cc1: { qty: 2, gold: 750, note: 'Светится в темноте', hnote: 'Проклят' }
  }
};

const at = (hash: string, over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter(hash), data: fakeData(LOOT), ...over });

const withA = (hash = '#/lists/a', over: Partial<Env> = {}): Env =>
  at(hash, { storage: memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) }), ...over });

const readLists = (storage: { get: (k: string) => string | null }): StoredList[] =>
  JSON.parse(storage.get('dhloot.lists.v2') ?? '[]') as StoredList[];

/** listA's rows in order (each row checkbox is now named after its own
 *  record, not the generic "Выбрать позицию"). */
const ROW_NAMES = ['Спальный мешок', 'Зелье', 'Меч'];

describe('the address', () => {
  it('rewrites #/lists/<id> to the players’ payload on mount', async () => {
    /* The rewrite is debounced 150ms trailing, so this now waits
       for it rather than reading `router.hash()` straight away. */
    const router = memoryRouter('#/lists/a');
    render(App, { env: withA('#/lists/a', { router }) });
    await waitFor(() => {
      expect(router.hash()).toBe('#/l/' + encodeList(listA, true));
    });
  });

  it('draws the same page for #/l/<payload of a>', () => {
    render(App, { env: withA('#/l/' + encodeList(listA, true)) });
    expect(screen.getByDisplayValue('Тайник')).toBeInTheDocument();
  });

  it('draws the shared page for a payload that is nobody’s', () => {
    const other: StoredList = { id: 'z', name: 'Другой', ids: ['ci1'] };
    const payload = encodeList(other, true);
    render(App, { env: withA('#/l/' + payload) });
    /* The `h1` reads the payload's own name, not a title input - this is the
       shared page, not the own-list page with a rename box. */
    expect(screen.getByRole('heading', { level: 1, name: 'Другой' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Название списка' })).not.toBeInTheDocument();
  });

  it('draws only the frame while a packed address expands, then the shared page once it lands', async () => {
    const other: StoredList = { id: 'z', name: 'Другой', ids: ['ci1'] };
    const payload = encodeList(other, true);
    const compress: CompressPort = {
      available: () => true,
      pack: (raw) => Promise.resolve(raw),
      unpack: (p) => Promise.resolve(p.slice(1))
    };
    render(App, { env: withA('#/l/~' + payload, { compress }) });
    const main = screen.getByRole('main');
    expect(within(main).queryByRole('heading', { level: 1 })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(within(main).getByRole('heading', { level: 1 })).toHaveTextContent('Другой');
    });
  });

  it('draws the bad-link page and leaves the address alone when the port cannot expand a packed address (R10/D2)', async () => {
    const payload = encodeList({ name: 'Другой', ids: ['ci1'] }, true);
    const router = memoryRouter('#/l/~' + payload);
    render(App, { env: withA('#/l/~' + payload, { router }) });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Предмет не найден' })
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText('Ссылка повреждена или собрана в другой версии данных.')
    ).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'На главную' });
    expect(link).toHaveAttribute('href', '#/roll/std');
    /* R10: the address itself is left where it was, unlike a plain #/l/zzzz
       link, which has nowhere to keep and never had one to keep it from. */
    expect(router.hash()).toBe('#/l/~' + payload);
  });

  it('draws "Список не найден" for an unknown id, and never rewrites', () => {
    const router = memoryRouter('#/lists/nope');
    render(App, { env: withA('#/lists/nope', { router }) });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Список не найден' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Возможно, он удалён или открыт в другом браузере.')
    ).toBeInTheDocument();
    /* Two links share the name: the tab bar's own "Списки" and this button. */
    const links = screen.getAllByRole('link', { name: 'Списки' });
    expect(
      links.some((l) => l.getAttribute('href') === '#/lists' && l.className.includes('btn'))
    ).toBe(true);
    expect(router.hash()).toBe('#/lists/nope');
  });
});

describe('the heading and the action row', () => {
  it('holds the name, renames on input, and rewrites the address', () => {
    const router = memoryRouter('#/lists/a');
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { router, storage }) });
    const input = screen.getByRole('textbox', { name: 'Название списка' });
    expect(input).toHaveValue('Тайник');
  });

  it('counts known records in the sub, dropping the unknown id', () => {
    render(App, { env: withA() });
    expect(screen.getByText('3 позиции')).toBeInTheDocument();
  });

  it('shows five actions including the print link, by name', () => {
    render(App, { env: withA() });
    expect(screen.getByRole('button', { name: 'Ссылка игрокам' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ссылка себе' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Скопировать текст' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument();
    const print = screen.getByTitle('Собрать карточки для печати: девять на лист A4');
    expect(print).toHaveAttribute('href', '#/print/ci1-cc1-q1');
  });

  it('has no print link on an empty list', () => {
    const empty: StoredList = { id: 'e', name: 'Пусто', ids: [] };
    render(App, {
      env: at('#/lists/e', {
        storage: memoryStorage({ 'dhloot.lists.v2': JSON.stringify([empty]) })
      })
    });
    expect(
      screen.queryByTitle('Собрать карточки для печати: девять на лист A4')
    ).not.toBeInTheDocument();
  });
});

describe('the storage notice', () => {
  it('draws on the list page too, and Скрыть dismisses it', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { storage }) });
    expect(screen.getByText('Списки живут только в этом браузере.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Скрыть' }));
    expect(screen.queryByText('Списки живут только в этом браузере.')).not.toBeInTheDocument();
    expect(storage.get('dhloot.warn.v1')).toBe('1');
  });

  it('sits under the heading and above the rows, on both routes ListPage draws', () => {
    /* ListPage.svelte handles both app.route.kind === 'storedList'
       (#/lists/<id>) and 'sharedList' (#/l/<payload>) - App.svelte:73-74. */
    const own = render(App, { env: withA('#/lists/a') });
    const heading = own.container.querySelector('h1');
    const notice = own.container.querySelector('.warn');
    const rows = own.container.querySelector('.lrows');
    expect(heading && notice && rows).toBeTruthy();
    expect(
      heading!.compareDocumentPosition(notice!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      notice!.compareDocumentPosition(rows!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    cleanup();

    const shared = render(App, { env: withA('#/l/' + encodeList(listA, true)) });
    const sHeading = shared.container.querySelector('h1');
    const sNotice = shared.container.querySelector('.warn');
    const sRows = shared.container.querySelector('.lrows');
    expect(sHeading && sNotice && sRows).toBeTruthy();
    expect(
      sHeading!.compareDocumentPosition(sNotice!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      sNotice!.compareDocumentPosition(sRows!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});

describe('the money picker', () => {
  it('marks the selected mode with aria-pressed, like every other chip', () => {
    /* Owner ruling, 2026-09-16: kept as aria-pressed on both modes rather
       than restored to the live app's own aria-current on the selected one
       alone - nothing measured the money picker as a special case. */
    render(App, { env: withA() });
    expect(screen.getByRole('button', { name: 'Как в книге' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Монетами' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('draws only when some entry has a price', () => {
    render(App, { env: withA() });
    expect(screen.getByRole('button', { name: 'Как в книге' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Монетами' })).toBeInTheDocument();
  });

  it('is absent on a list with no price at all', () => {
    const plain: StoredList = { id: 'p', name: 'Без цен', ids: ['ci1'] };
    render(App, {
      env: at('#/lists/p', {
        storage: memoryStorage({ 'dhloot.lists.v2': JSON.stringify([plain]) })
      })
    });
    expect(screen.queryByRole('button', { name: 'Монетами' })).not.toBeInTheDocument();
  });

  it('stores coin mode and rewrites the address; removes the gold hint', async () => {
    const router = memoryRouter('#/lists/a');
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { router, storage }) });
    expect(screen.getAllByTitle('7 мешков 5 горстей')[0]!).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Монетами' }));
    expect(readLists(storage)[0]?.money).toBe('coin');
    // The address rewrite is now debounced 150ms trailing.
    await waitFor(() => {
      expect(router.hash()).toBe('#/l/' + encodeList({ ...listA, money: 'coin' }, true));
    });
    expect(screen.queryAllByTitle('7 мешков 5 горстей')).toHaveLength(0);

    await userEvent.click(screen.getByRole('button', { name: 'Как в книге' }));
    expect(readLists(storage)[0]?.money).toBeUndefined();
  });

  it('draws the gold hint as a span mirroring itself into title, not a button', () => {
    /* Ported from tests/lists2.js:322-330: the "?" is a visible cue that a
       tooltip exists, not something to press. */
    const { container } = render(App, { env: withA() });
    const hint = container.querySelector('[data-goldhint]');
    expect(hint?.tagName).toBe('SPAN');
    const value = hint?.getAttribute('data-goldhint');
    expect(value).toBe('7 мешков 5 горстей');
    expect(hint).toHaveAttribute('title', value);
  });

  it('opens the help with five bold runs on its own "?"', async () => {
    render(App, { env: withA() });
    const help = screen.getByRole('button', { name: 'Как это работает' });
    expect(help).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(help);
    expect(help).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('горстями, мешками и сундуками')).toBeInTheDocument();
    expect(screen.getByText('8 мешков')).toBeInTheDocument();
  });
});

describe('the list note', () => {
  it('opens when a note exists, folds when neither does', () => {
    const { container } = render(App, { env: withA() });
    expect(container.querySelector('details.lnote')).toHaveProperty('open', true);
    cleanup();

    const bare: StoredList = { id: 'b', name: 'Без заметок', ids: ['ci1'] };
    const { container: c2 } = render(App, {
      env: at('#/lists/b', {
        storage: memoryStorage({ 'dhloot.lists.v2': JSON.stringify([bare]) })
      })
    });
    expect(c2.querySelector('details.lnote')).toHaveProperty('open', false);
  });

  it('stores what is typed and deletes the key when it is blanked', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { storage }) });
    const pub = screen.getByPlaceholderText('Например: лавка закрыта до утра');
    await userEvent.clear(pub);
    await userEvent.type(pub, 'Новая запись');
    expect(readLists(storage)[0]?.note).toBe('Новая запись');

    await userEvent.clear(pub);
    expect(readLists(storage)[0]?.note).toBeUndefined();
  });

  it('debounces twenty rapid keystrokes into one address rewrite', async () => {
    const router = memoryRouter('#/lists/a');
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { router, storage }) });
    await waitFor(() => {
      expect(router.hash()).toBe('#/l/' + encodeList(listA, true));
    });
    const replaceSpy = vi.spyOn(router, 'replace');

    const pub = screen.getByPlaceholderText('Например: лавка закрыта до утра');
    await userEvent.clear(pub);
    await userEvent.type(pub, '12345678901234567890', { delay: null });

    // the storage side stays synchronous, on every keystroke
    expect(readLists(storage)[0]?.note).toBe('12345678901234567890');
    expect(replaceSpy).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(replaceSpy).toHaveBeenCalledTimes(1);
    });
    expect(router.hash()).toBe(
      '#/l/' + encodeList({ ...listA, note: '12345678901234567890' }, true)
    );
  });

  it('flushes a pending edit on visibilitychange, once, even if pagehide also fires', async () => {
    /* pagehide alone missed the mobile-Safari case where a hidden tab is
       discarded with no pagehide at all; visibilitychange is the more
       reliable last callback there. Both firing for the same teardown must
       not write the address twice. */
    const router = memoryRouter('#/lists/a');
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { router, storage }) });
    await waitFor(() => {
      expect(router.hash()).toBe('#/l/' + encodeList(listA, true));
    });
    const replaceSpy = vi.spyOn(router, 'replace');

    const pub = screen.getByPlaceholderText('Например: лавка закрыта до утра');
    await userEvent.clear(pub);
    await userEvent.type(pub, 'flushed', { delay: null });
    expect(replaceSpy).not.toHaveBeenCalled(); // still inside the 150ms debounce

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(replaceSpy).toHaveBeenCalledTimes(1); // flushed synchronously, no wait
    expect(router.hash()).toBe('#/l/' + encodeList({ ...listA, note: 'flushed' }, true));

    // pagehide firing right after must find nothing left to flush
    window.dispatchEvent(new Event('pagehide'));
    expect(replaceSpy).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true
    });
  });
});

describe('the roll panel', () => {
  it('is absent with one known entry, folded with more than one', () => {
    render(App, { env: withA() });
    expect(screen.getByText('Бросок по списку')).toBeInTheDocument();
    cleanup();

    const one: StoredList = { id: 'o', name: 'Одна позиция', ids: ['ci1'] };
    render(App, {
      env: at('#/lists/o', {
        storage: memoryStorage({ 'dhloot.lists.v2': JSON.stringify([one]) })
      })
    });
    expect(screen.queryByText('Бросок по списку')).not.toBeInTheDocument();
  });

  it('shows an entry’s compact card, badged, with both hitnotes, on a typed number', async () => {
    render(App, { env: withA() });
    await userEvent.click(screen.getByText('Бросок по списку'));
    const field = screen.getByRole('textbox', { name: 'Результат броска' });
    await userEvent.clear(field);
    await userEvent.type(field, '2');

    /* "Зелье" names both the row and the roll result's own compact card. */
    expect(screen.getAllByText('Зелье').length).toBeGreaterThanOrEqual(2);
    /* The hit's note shows both on its own row and in the roll result's card. */
    expect(screen.getAllByText('Светится в темноте').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Проклят').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('button', { name: 'Сбросить' })).toBeInTheDocument();
  });

  it('rolls entry 1 with a fixed random source, and Сбросить empties the field without folding', async () => {
    const { container } = render(App, { env: withA('#/lists/a', { random: () => 0 }) });
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
    render(App, { env: withA() });
    await userEvent.click(screen.getByText('Бросок по списку'));
    const field = screen.getByRole('textbox', { name: 'Результат броска' });
    expect(field).toHaveValue('');
    await userEvent.click(screen.getByRole('button', { name: 'На единицу больше' }));
    expect(field).toHaveValue('1');
  });
});

describe('select-all', () => {
  it('ticks every row and reads the count; one row reads 1; none reads "select all"', async () => {
    render(App, { env: withA() });
    expect(screen.getByRole('checkbox', { name: 'Выбрать все' })).toBeInTheDocument();

    const rows = ROW_NAMES.map((name) => screen.getByRole('checkbox', { name }));
    expect(rows).toHaveLength(3);
    await userEvent.click(rows[0] as HTMLElement);
    expect(screen.getByText('Выбрано 1')).toBeInTheDocument();

    // untick the same row - its own name never changes with selection state
    await userEvent.click(rows[0] as HTMLElement);
    expect(screen.getByText('Выбрать все')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
    expect(screen.getByText('Выбрано 3')).toBeInTheDocument();
  });

  it('clears when history moves to a different list, not just a different page', async () => {
    const listB: StoredList = { id: 'b', name: 'Другой', ids: ['q1'], created: 2 };
    const router = memoryRouter('#/lists/a');
    render(App, {
      env: at('#/lists/a', {
        router,
        storage: memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA, listB]) })
      })
    });

    await userEvent.click(screen.getByRole('checkbox', { name: ROW_NAMES[0]! }));
    expect(screen.getByText('Выбрано 1')).toBeInTheDocument();

    router.navigate('#/lists/b');
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
    expect(screen.queryByText(/Выбрано/)).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Выбрать все' })).toBeInTheDocument();
  });
});

describe('the actions under a ticked selection', () => {
  /* listA's rows in order: ci1 (unpriced), cc1 (750 gold), q1 (unpriced). */
  const tickRow = async (n: number): Promise<void> => {
    await userEvent.click(screen.getByRole('checkbox', { name: ROW_NAMES[n]! }));
  };

  it('shows Цены and Удалить (N) once a row is ticked, and hides them again', async () => {
    render(App, { env: withA() });
    expect(screen.queryByRole('button', { name: 'Цены' })).not.toBeInTheDocument();

    await tickRow(0);
    expect(screen.getByRole('button', { name: 'Цены' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить (1)' })).toBeInTheDocument();

    await tickRow(0);
    expect(screen.queryByRole('button', { name: 'Цены' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Удалить \(/ })).not.toBeInTheDocument();
  });

  it('holds exactly two buttons in the batch bar, with no percentage widget', async () => {
    /* Ported from tests/lists2.js's own batch-bar shape check: the reprice
       percentage field lives in the separate .guess panel, not in
       .batch-acts alongside Цены/Удалить. */
    const { container } = render(App, { env: withA() });
    await tickRow(0);
    const bar = container.querySelector('.batch-acts');
    expect(bar).toBeInTheDocument();
    expect(within(bar as HTMLElement).getAllByRole('button')).toHaveLength(2);
    expect((bar as HTMLElement).querySelector('input')).toBeNull();
  });

  it('opens the panel on Цены and flips aria-expanded', async () => {
    render(App, { env: withA() });
    await tickRow(0);
    const btn = screen.getByRole('button', { name: 'Цены' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/^В книге цен нет/)).not.toBeInTheDocument();

    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/^В книге цен нет/)).toBeInTheDocument();
  });

  it('shows the reprice row and the clear-price button only once a ticked row is priced', async () => {
    render(App, { env: withA() });
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
    const { container } = render(App, { env: withA() });
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
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { storage }) });
    await tickRow(0); // ci1: no eq, no rarity, no tier - the uncommon band, 150-250
    await userEvent.click(screen.getByRole('button', { name: 'Цены' }));
    await userEvent.click(screen.getByRole('button', { name: 'Проставить эти цены' }));

    expect(screen.getByText('Цены проставлены (1)')).toBeInTheDocument();
    expect(screen.queryByText(/^В книге цен нет/)).not.toBeInTheDocument(); // the panel folded
    expect(readLists(storage)[0]?.meta?.['ci1']?.gold).toBe(200);

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect(readLists(storage)[0]?.meta?.['ci1']?.gold).toBeUndefined();
  });

  it('reprices a ticked, priced row at -20% and undoes it', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { storage }) });
    await tickRow(1); // cc1, 750 gold
    await userEvent.click(screen.getByRole('button', { name: 'Цены' }));
    await userEvent.click(screen.getByRole('button', { name: 'Сделать скидку' }));

    expect(screen.getByText('Цены пересчитаны (-20%, 1)')).toBeInTheDocument();
    expect(readLists(storage)[0]?.meta?.['cc1']?.gold).toBe(600);

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect(readLists(storage)[0]?.meta?.['cc1']?.gold).toBe(750);
  });

  it('clears the price on a ticked, priced row and undoes it', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { storage }) });
    await tickRow(1); // cc1, 750 gold
    await userEvent.click(screen.getByRole('button', { name: 'Цены' }));
    await userEvent.click(screen.getByRole('button', { name: 'Убрать цену (1)' }));

    expect(screen.getByText('Убрать цену')).toBeInTheDocument();
    expect(readLists(storage)[0]?.meta?.['cc1']?.gold).toBeUndefined();

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect(readLists(storage)[0]?.meta?.['cc1']?.gold).toBe(750);
  });

  it('batch-deletes the ticked rows, clears the ticks, and undoes both back into place', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { storage }) });
    await tickRow(0); // ci1
    await tickRow(2); // q1 (cc1, index 1, stays)
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (2)' }));

    expect(screen.getByText('Убрано из списка (2)')).toBeInTheDocument();
    expect(readLists(storage)[0]?.ids).toEqual(['cc1']);
    expect(screen.queryByRole('button', { name: 'Цены' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect(readLists(storage)[0]?.ids).toEqual(['ci1', 'cc1', 'q1']);
    expect(readLists(storage)[0]?.meta?.['cc1']?.gold).toBe(750);
  });

  it('has no violations with the money panel open and both a priced and an unpriced row ticked', async () => {
    const { container } = render(App, { env: withA() });
    await tickRow(0);
    await tickRow(1);
    await userEvent.click(screen.getByRole('button', { name: 'Цены' }));
    await expectNoA11yViolations(container);
  });
});

describe('a row', () => {
  it('moves on a committed position and resets on an out-of-range one', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { storage }) });
    const pos = screen.getAllByRole('spinbutton', { name: 'Позиция в списке' });
    expect(pos).toHaveLength(3);

    await userEvent.click(pos[2] as HTMLElement);
    await userEvent.clear(pos[2] as HTMLElement);
    await userEvent.type(pos[2] as HTMLElement, '1');
    await userEvent.tab();
    expect(readLists(storage)[0]?.ids).toEqual(['q1', 'ci1', 'cc1']);

    const posAfter = screen.getAllByRole('spinbutton', { name: 'Позиция в списке' });
    await userEvent.click(posAfter[0] as HTMLElement);
    await userEvent.clear(posAfter[0] as HTMLElement);
    await userEvent.type(posAfter[0] as HTMLElement, '99');
    await userEvent.tab();
    expect((posAfter[0] as HTMLInputElement).value).toBe('1');
    expect(readLists(storage)[0]?.ids).toEqual(['q1', 'ci1', 'cc1']);
  });

  it('stores qty and gold on input; the gold hint follows the price and vanishes in coin mode', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { storage }) });

    expect(screen.getAllByTitle('7 мешков 5 горстей')[0]!).toBeInTheDocument();

    const golds = screen.getAllByPlaceholderText('—');
    const goldForCc1 = golds[1] as HTMLElement; // ci1, cc1, q1 in that order
    await userEvent.clear(goldForCc1);
    await userEvent.type(goldForCc1, '231');
    expect(readLists(storage)[0]?.meta?.['cc1']?.gold).toBe(231);

    await userEvent.click(screen.getByRole('button', { name: 'Монетами' }));
    expect(screen.queryByTitle(/мешк/)).not.toBeInTheDocument();
  });
});

describe('a row’s note', () => {
  it('opens on "Заметка", focuses the first textarea, and follows has-note', async () => {
    const bare: StoredList = { id: 'n', name: 'Без заметок', ids: ['ci1'] };
    const { container } = render(App, {
      env: at('#/lists/n', {
        storage: memoryStorage({ 'dhloot.lists.v2': JSON.stringify([bare]) })
      })
    });
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
    render(App, { env: withA() });
    // cc1's own row, its public note field specifically (not the list's own).
    const rowMain = screen.getByRole('button', { name: /Зелье/ });
    const row = rowMain.closest('.lrow') as HTMLElement;
    const pubField = row.querySelector('.n-pub') as HTMLElement;
    const clear = within(pubField).getByRole('button', { name: 'Очистить заметку' });
    const textarea = pubField.querySelector('textarea') as HTMLTextAreaElement;
    await userEvent.click(clear);
    expect(screen.getByText('Заметка очищена')).toBeInTheDocument();
    /* The field's `textContent` is the live app's own quirk too: an
       uncontrolled textarea keeps its original text node once seeded, and
       only `.value` tracks a later edit - including one made by script, the
       way the clear cross itself does. */
    expect(textarea).toHaveValue('');

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect(screen.getByDisplayValue('Светится в темноте')).toBeInTheDocument();
  });
});

describe('removing and undoing', () => {
  it('removes the row, toasts with the name and an undo, and restores order and meta', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { storage }) });
    const removes = screen.getAllByRole('button', { name: 'Убрать из списка' });
    await userEvent.click(removes[1] as HTMLElement); // cc1, the priced/noted one

    expect(screen.getByText('«Зелье» убран')).toBeInTheDocument();
    expect(readLists(storage)[0]?.ids).toEqual(['ci1', 'q1']);

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect(readLists(storage)[0]?.ids).toEqual(['ci1', 'cc1', 'q1']);
    expect(readLists(storage)[0]?.meta?.['cc1']?.gold).toBe(750);
  });
});

describe('copying and sharing', () => {
  it('copies the list export written by shareList', async () => {
    const clip = fakeClipboard();
    render(App, { env: withA('#/lists/a', { clipboard: clip }) });
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать текст' }));
    expect(screen.getByText('Список скопирован')).toBeInTheDocument();

    const index = buildIndex(LOOT);
    const { text } = shareList(listA, index, 'ru', dict('ru'));
    expect(clip.last.text).toBe(text);
  });

  it('writes packed players’/GM payloads under plainCompress, and toasts each', async () => {
    const clip = fakeClipboard();
    render(App, {
      env: withA('#/lists/a', { clipboard: clip, compress: plainCompress() })
    });
    await userEvent.click(screen.getByRole('button', { name: 'Ссылка игрокам' }));
    expect(screen.getByText(/Ссылка для игроков скопирована/)).toBeInTheDocument();
    const playersLink = clip.last.text ?? '';

    await userEvent.click(screen.getByRole('button', { name: 'Ссылка себе' }));
    expect(screen.getByText(/Ссылка со всеми заметками скопирована/)).toBeInTheDocument();
    const gmLink = clip.last.text ?? '';

    expect(playersLink).not.toBe(gmLink);
  });

  it('toasts listEmpty for both links on an empty list', async () => {
    const empty: StoredList = { id: 'e', name: 'Пусто', ids: [] };
    render(App, {
      env: at('#/lists/e', {
        storage: memoryStorage({ 'dhloot.lists.v2': JSON.stringify([empty]) })
      })
    });
    await userEvent.click(screen.getByRole('button', { name: 'Ссылка игрокам' }));
    expect(screen.getByText('Список пуст')).toBeInTheDocument();
  });
});

describe('deleting', () => {
  it('asks, and on accept removes the list, goes to #/lists, and toasts with an undo (P5)', async () => {
    const router = memoryRouter('#/lists/a');
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    const dialog = fakeDialog(true);
    render(App, { env: at('#/lists/a', { router, storage, dialog }) });
    await userEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(dialog.asked[0]).toBe('Удалить список «Тайник»? Это действие необратимо.');
    expect(router.stack[router.stack.length - 1]).toBe('#/lists');
    expect(readLists(storage)).toEqual([]);
    expect(screen.getByText('Список «Тайник» удалён')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect(readLists(storage)).toEqual([listA]);
  });

  it('declines without asking again, and removes nothing', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    const dialog = fakeDialog(false);
    render(App, { env: at('#/lists/a', { storage, dialog }) });
    await userEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(readLists(storage)).toEqual([listA]);
    expect(screen.queryByText('Список «Тайник» удалён')).not.toBeInTheDocument();
  });
});

describe("another tab's write, while this page is mounted", () => {
  /* The gap the dispatch named: no test fired a storage event into a mounted
     page, though the harness (`memoryStorage`'s own `fireExternalChange`)
     already existed for `state/lists.test.ts`. Closes it directly here;
     `listsPage.test.ts` closes it for R2's own general reload trigger. */
  it('re-seeds an unfocused note field with another tab’s edit', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { storage }) });

    const rowMain = screen.getByRole('button', { name: /Зелье/ });
    const row = rowMain.closest('.lrow') as HTMLElement;
    const pubField = within(row).getByPlaceholderText('Как предмет выглядит, что о нём знают');
    expect(pubField).toHaveValue('Светится в темноте');

    const other: StoredList = {
      ...listA,
      meta: { ...listA.meta, cc1: { ...listA.meta!['cc1'], note: 'Правка из другой вкладки' } }
    };
    storage.set('dhloot.lists.v2', JSON.stringify([other]));
    storage.fireExternalChange('dhloot.lists.v2');

    await waitFor(() => {
      expect(pubField).toHaveValue('Правка из другой вкладки');
    });
  });

  it('leaves a focused field alone even though the store changed under it', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { storage }) });

    const rowMain = screen.getByRole('button', { name: /Зелье/ });
    const row = rowMain.closest('.lrow') as HTMLElement;
    const pubField = within(row).getByPlaceholderText('Как предмет выглядит, что о нём знают');
    pubField.focus();

    const other: StoredList = {
      ...listA,
      meta: { ...listA.meta, cc1: { ...listA.meta!['cc1'], note: 'Правка из другой вкладки' } }
    };
    storage.set('dhloot.lists.v2', JSON.stringify([other]));
    storage.fireExternalChange('dhloot.lists.v2');
    await tick();

    expect(pubField).toHaveValue('Светится в темноте');
  });
});

describe('a row’s modal', () => {
  it('opens on the row body, and its copy text carries the entry’s players’ note', async () => {
    const clip = fakeClipboard();
    render(App, { env: withA('#/lists/a', { clipboard: clip }) });
    await userEvent.click(screen.getByRole('button', { name: /Зелье/ }));
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
    render(App, { env: withA('#/lists/a', { clipboard: clip }) });
    await userEvent.click(screen.getByRole('button', { name: /Зелье/ }));
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
  it('moves an entry through the port’s onDrop', () => {
    const drag = fakeDrag();
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { storage, drag }) });
    drag.handlers?.onDrop(0, 2);
    expect(readLists(storage)[0]?.ids).toEqual(['cc1', 'q1', 'ci1']);
  });

  it('marks the grip draggable, so the browser actually fires dragstart', () => {
    const { container } = render(App, { env: withA() });
    expect(container.querySelector('.lrow-grip')).toHaveAttribute('draggable', 'true');
  });

  it('follows the port’s onDrag/onOver/onEnd with the dragging/drop-before/drop-after classes, both sides of the gap', async () => {
    const drag = fakeDrag();
    const { container } = render(App, { env: withA('#/lists/a', { drag }) });
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
  /* Both movers funnel through store.move(), which answers "did anything
     move" - the live region fires on true and stays silent on false
     (context.md, "Measured this pass"). */
  it('announces a drag that lands an entry elsewhere, and would stay silent for a no-op drop', async () => {
    const drag = fakeDrag();
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    const { container } = render(App, { env: at('#/lists/a', { storage, drag }) });
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('');

    drag.handlers?.onDrop(0, 2);
    await tick();
    expect(region).toHaveTextContent('«Спальный мешок» — позиция 3 из 3');

    await expectNoA11yViolations(container);
  });

  it('announces a committed position that moves a row, and stays silent when the position is its own', async () => {
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { storage }) });
    const region = screen.getByRole('status');

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
    expect(region).toHaveTextContent('«Меч» — позиция 1 из 3');
  });

  it('announces the same typed move in English under dhloot.lang.v1: en', async () => {
    const storage = memoryStorage({
      'dhloot.lists.v2': JSON.stringify([listA]),
      'dhloot.lang.v1': 'en'
    });
    render(App, { env: at('#/lists/a', { storage }) });
    const region = screen.getByRole('status');

    const pos = screen.getAllByRole('spinbutton', { name: 'Position in the list' });
    await userEvent.click(pos[2] as HTMLElement);
    await userEvent.clear(pos[2] as HTMLElement);
    await userEvent.type(pos[2] as HTMLElement, '1');
    await userEvent.tab();
    expect(region).toHaveTextContent('"Sword" - position 1 of 3');
  });
});

describe('no data', () => {
  it('draws the paragraph rather than a broken page', () => {
    render(App, { env: at('#/lists/a', { data: noData() }) });
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
  });
});

describe('the textarea seed', () => {
  it('sets textContent to the value once, so the field is named by its text', () => {
    render(App, { env: withA() });
    /* The live inventory names a noted textarea by its text content - not by
       `bind:value`, which leaves `textContent` empty. */
    expect(screen.getByText('Светится в темноте').tagName).toBe('TEXTAREA');
    expect(screen.getByText('Не для игроков').tagName).toBe('TEXTAREA');
  });
});

describe('accessibility', () => {
  it('has no violations on the page as it stands, priced and noted', async () => {
    const { container } = render(App, { env: withA() });
    await expectNoA11yViolations(container);
  });

  it('has no violations with the roll panel open and a hit shown', async () => {
    const { container } = render(App, { env: withA() });
    await userEvent.click(screen.getByText('Бросок по списку'));
    await userEvent.click(screen.getByRole('button', { name: 'На единицу больше' }));
    await expectNoA11yViolations(container);
  });
});
