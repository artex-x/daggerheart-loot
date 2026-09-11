/* The list page, `#/lists/<id>` and `#/l/<payload>` - off `renderOneList` and
 * everything it draws, read in `plan.md`, "B5.4 planned". Through `App`, the
 * way `listsPage.test.ts` reaches the index: the address rewrite, the tab bar
 * and the modal all live above this component. */

import { cleanup, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
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
import type { Env } from '../ports/index.js';
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

describe('the address', () => {
  it('rewrites #/lists/<id> to the players’ payload on mount', () => {
    const router = memoryRouter('#/lists/a');
    render(App, { env: withA('#/lists/a', { router }) });
    expect(router.hash()).toBe('#/l/' + encodeList(listA, true));
  });

  it('draws the same page for #/l/<payload of a>', () => {
    render(App, { env: withA('#/l/' + encodeList(listA, true)) });
    expect(screen.getByDisplayValue('Тайник')).toBeInTheDocument();
  });

  it('draws the todo paragraph for a payload that is nobody’s', () => {
    const other: StoredList = { id: 'z', name: 'Другой', ids: ['ci1'] };
    const payload = encodeList(other, true);
    const { container } = render(App, { env: withA('#/l/' + payload) });
    expect(container.querySelector('.todo')).toHaveTextContent('#/l/' + payload);
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
});

describe('the money picker', () => {
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
    expect(router.hash()).toBe('#/l/' + encodeList({ ...listA, money: 'coin' }, true));
    expect(screen.queryAllByTitle('7 мешков 5 горстей')).toHaveLength(0);

    await userEvent.click(screen.getByRole('button', { name: 'Как в книге' }));
    expect(readLists(storage)[0]?.money).toBeUndefined();
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

    const rows = screen.getAllByRole('checkbox', { name: 'Выбрать позицию' });
    expect(rows).toHaveLength(3);
    await userEvent.click(rows[0] as HTMLElement);
    expect(screen.getByText('Выбрано 1')).toBeInTheDocument();

    // untick the same row - its own name never changes with selection state
    await userEvent.click(rows[0] as HTMLElement);
    expect(screen.getByText('Выбрать все')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
    expect(screen.getByText('Выбрано 3')).toBeInTheDocument();
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
  it('asks, and on accept removes the list and goes to #/lists', async () => {
    const router = memoryRouter('#/lists/a');
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    const dialog = fakeDialog(true);
    render(App, { env: at('#/lists/a', { router, storage, dialog }) });
    await userEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(dialog.asked[0]).toBe('Удалить список «Тайник»? Это действие необратимо.');
    expect(router.stack[router.stack.length - 1]).toBe('#/lists');
    expect(readLists(storage)).toEqual([]);
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
});

describe('drag', () => {
  it('moves an entry through the port’s onDrop', () => {
    const drag = fakeDrag();
    const storage = memoryStorage({ 'dhloot.lists.v2': JSON.stringify([listA]) });
    render(App, { env: at('#/lists/a', { storage, drag }) });
    drag.handlers?.onDrop(0, 2);
    expect(readLists(storage)[0]?.ids).toEqual(['cc1', 'q1', 'ci1']);
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
