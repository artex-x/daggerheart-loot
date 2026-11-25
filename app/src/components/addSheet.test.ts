/* AddSheet.svelte: the share page's add sheet, opened by the bar's «В список» and by an
 * accepted request's toast. Through `App`, as `sharedListPage.test.ts` reaches the page; the
 * request's own lines are tried on the component alone.
 * docs/specs/FEATURES.md, "Purchase requests: the send". */

import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import AddSheet from './AddSheet.svelte';
import type { Loot } from '../lib/data.js';
import { dict } from '../lib/dict.js';
import type { HomebrewRecord } from '../lib/homebrew.js';
import { fakeData, fakeEnv, fakePage, memoryRouter } from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { fakeCloud } from '../ports/fake-cloud.js';
import { uuid, type SeedList, type SeedShare } from '../ports/fake-cloud-seed.js';
import { AppState, type AddSheetSource } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import { readList } from '../test/accountList.js';
import { listOf, seedWith } from '../test/seed.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

Element.prototype.scrollIntoView = () => {};

const item = (id: string, n: number) => ({
  id,
  src: 'core',
  kind: 'item' as const,
  roll: n,
  en: 'Thing ' + id,
  ende: '',
  ru: 'Вещь ' + id,
  rud: ''
});

/* ci1..ci7 are plain items; cc21 and q337 are the two priced ones. */
const LOOT: Loot = {
  items: {
    core_item: ['ci1', 'ci2', 'ci3', 'ci4', 'ci5', 'ci6', 'ci7', 'cc21', 'q337'].map((id, i) =>
      item(id, i + 1)
    )
  },
  eq: [],
  refs: {}
};

/* The share: ci1 x2 with a note for players, cc21 x5 at 50, q337 at 12. */
const SHOP: SeedList = listOf(902, 'Лавка', [
  { key: 'ci1', qty: 2, note: 'Видно игрокам', hnote: 'Подделка' },
  { key: 'cc21', qty: 5, gold: 50 },
  { key: 'q337', gold: 12 }
]);
const SHARES: SeedShare[] = [
  {
    id: uuid(911),
    listId: uuid(902),
    audience: 'player',
    token: 'player-token-92',
    topicKey: uuid(912)
  }
];
const HASH = '#/s/player-token-92';

const DRAGON = uuid(811);
/* gm2's lists: two empty, two that hold cc21 (a coin mode and a bag mode), one that holds
   every line. */
const GM2: SeedList[] = [
  listOf(811, 'Клад дракона', [], { createdAgoMs: 5_000 }),
  listOf(812, 'Лавка в порту', [], { createdAgoMs: 4_000 }),
  listOf(813, 'Монетный', [{ key: 'cc21', qty: 2, gold: 30, note: 'моя' }], {
    money: 'coin',
    createdAgoMs: 3_000
  }),
  listOf(814, 'Мешочный', [{ key: 'cc21', qty: 2, gold: 30, note: 'моя' }], {
    createdAgoMs: 2_000
  }),
  listOf(815, 'Все есть', [{ key: 'ci1' }, { key: 'cc21' }, { key: 'q337' }], {
    createdAgoMs: 1_000
  })
];
const SEEDED = seedWith({ gm2: GM2, gm4: [SHOP] }, SHARES);

const at = (over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter(HASH), data: fakeData(LOOT), ...over });

async function open(cloud = fakeCloud(SEEDED, 'gm2')) {
  const page = fakePage();
  const r = render(App, { env: at({ cloud, page }) });
  await screen.findByRole('heading', { level: 1, name: 'Лавка' });
  await screen.findByRole('button', { name: 'Аккаунт: gm2@example.test' });
  return { ...r, cloud, page };
}

/** Keeps the `AppState` that `App` builds: the first sheet it opens names it. */
function captureApp(): { app: () => AppState } {
  const spy = vi.spyOn(AppState.prototype, 'openAddSheet');
  return { app: () => spy.mock.contexts[0] as AppState };
}

const bar = (): HTMLElement => document.querySelector('.selbarwrap') as HTMLElement;

/** Ticks every row. */
async function tickAll(): Promise<void> {
  await userEvent.click(document.querySelector('button.selmode') as HTMLElement);
  await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
}

/** Ticks every row and opens the add sheet from the bar. */
async function sheet(cloud = fakeCloud(SEEDED, 'gm2')) {
  const view = await open(cloud);
  await tickAll();
  await userEvent.click(within(bar()).getByRole('button', { name: 'В список' }));
  const dialog = await screen.findByRole('dialog', { name: 'Добавить в список' });
  return { ...view, dialog, bar: bar() };
}

async function choose(dialog: HTMLElement, list: string): Promise<void> {
  await userEvent.click(within(dialog).getByRole('radio', { name: list }));
  await waitFor(() => {
    expect(within(dialog).queryByRole('status')).toBeNull();
  });
}

const addButton = (dialog: HTMLElement): HTMLElement =>
  within(dialog).getByRole('button', { name: 'Добавить' });

describe('before a choice', () => {
  it('opens with the lead, the rows, the prompt, no fold and «Добавить» off, and nothing chosen', async () => {
    const { dialog, container } = await sheet();
    expect(
      within(dialog).getByText('Добавится выбранное: 3 позиции · 8 шт.')
    ).toBeInTheDocument();
    expect(within(dialog).getAllByRole('radio').length).toBeGreaterThanOrEqual(5);
    for (const radio of within(dialog).getAllByRole('radio')) {
      expect(radio).toHaveAttribute('aria-checked', 'false');
    }
    expect(
      within(dialog).getByText('Выберите список, чтобы увидеть, что изменится.')
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Что изменится' })).toBeNull();
    expect(addButton(dialog)).toBeDisabled();
    await expectNoA11yViolations(container);
  });

  it('opens fresh at each opening and stores nothing in the browser', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { dialog } = await sheet();
    await choose(dialog, 'Клад дракона');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Что копировать' }));
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Копировать цену' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Отмена' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(within(bar()).getByRole('button', { name: 'В список' }));
    const again = await screen.findByRole('dialog', { name: 'Добавить в список' });
    expect(within(again).queryByRole('button', { name: 'Что копировать' })).toBeNull();
    await choose(again, 'Клад дракона');
    await userEvent.click(within(again).getByRole('button', { name: 'Что копировать' }));
    expect(within(again).getByRole('checkbox', { name: 'Копировать цену' })).toBeChecked();
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it('closes on «Отмена», adding nothing, with the focus back on «В список»', async () => {
    const { dialog, cloud, page } = await sheet();
    await choose(dialog, 'Клад дракона');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Отмена' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => {
      expect(within(bar()).getByRole('button', { name: 'В список' })).toHaveFocus();
    });
    expect((await readList(cloud, page, DRAGON))?.ids).toEqual([]);
  });

  it('closes when the selection empties or the signed-in reader goes', async () => {
    const { dialog, cloud } = await sheet();
    expect(dialog).toBeInTheDocument();
    await cloud.auth.signOut();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});

describe('the sheet of the bar when its source is gone', () => {
  it('closes with no toast when the selection empties', async () => {
    const got = captureApp();
    await sheet();
    const app = got.app();
    expect(app.sel.size).toBeGreaterThan(1);
    app.sel.clear();
    await waitFor(() => {
      expect(app.addSheet).toBeNull();
    });
    expect(app.toast).toBeNull();
  });

  it('closes with no toast when the link stops', async () => {
    const got = captureApp();
    await sheet();
    const app = got.app();
    app.shared = null;
    await waitFor(() => {
      expect(app.addSheet).toBeNull();
    });
    expect(app.toast).toBeNull();
  });
});

describe('a chosen list', () => {
  it('chooses on a tap and adds nothing, then names what the add does, folds closed', async () => {
    const { dialog, cloud, page, container } = await sheet();
    await choose(dialog, 'Клад дракона');
    expect(within(dialog).getByRole('radio', { name: 'Клад дракона' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(within(dialog).getByText('Добавится: 3 позиции · 8 шт.')).toBeInTheDocument();
    expect(within(dialog).queryByText(/уже в списке/)).toBeNull();
    for (const name of ['Что изменится', 'Что копировать']) {
      expect(within(dialog).getByRole('button', { name })).toHaveAttribute(
        'aria-expanded',
        'false'
      );
    }
    expect(addButton(dialog)).toBeEnabled();
    expect((await readList(cloud, page, DRAGON))?.ids).toEqual([]);
    await expectNoA11yViolations(container);
  });

  it('opens the two folds on their own, each panel under its own button', async () => {
    const { dialog } = await sheet();
    await choose(dialog, 'Клад дракона');
    const diff = within(dialog).getByRole('button', { name: 'Что изменится' });
    const copy = within(dialog).getByRole('button', { name: 'Что копировать' });
    await userEvent.click(copy);
    expect(copy).toHaveAttribute('aria-expanded', 'true');
    expect(diff).toHaveAttribute('aria-expanded', 'false');
    expect(within(dialog).queryByRole('table')).toBeNull();
    await userEvent.click(diff);
    const table = within(dialog).getByRole('table');
    expect(diff.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const toggles = document.getElementById('addsheet-copy') as HTMLElement;
    expect(
      table.compareDocumentPosition(toggles) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      copy.compareDocumentPosition(toggles) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    await userEvent.click(diff);
    expect(within(dialog).queryByRole('table')).toBeNull();
    expect(within(dialog).getByRole('checkbox', { name: 'Копировать цену' })).toBeChecked();
  });

  it('draws the table: the stock now, what is added, what it becomes, the price', async () => {
    const { dialog } = await sheet();
    await choose(dialog, 'Клад дракона');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Что изменится' }));
    const rows = within(dialog).getAllByRole('row');
    expect(rows.length).toBe(4);
    const cc21 = rows.find((r) => r.textContent.includes('Вещь cc21')) as HTMLElement;
    expect(within(cc21).getByText('нет в списке')).toBeInTheDocument();
    expect(within(cc21).getAllByText('5').length).toBe(2);
    expect(rows.find((r) => r.textContent.includes('Вещь ci1'))?.textContent).toContain(
      '+ заметка для игроков'
    );
  });

  it('adds the new keys with the price and the note, and says so', async () => {
    const { dialog, cloud, page } = await sheet();
    await choose(dialog, 'Клад дракона');
    await userEvent.click(addButton(dialog));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(await screen.findByText('Добавлено в «Клад дракона»: 3')).toBeInTheDocument();
    const a = await readList(cloud, page, DRAGON);
    expect(a?.ids).toEqual(['ci1', 'cc21', 'q337']);
    expect(a?.meta).toEqual({
      ci1: { qty: 2, note: 'Видно игрокам' },
      cc21: { qty: 5, gold: 50 },
      q337: { gold: 12 }
    });
    expect(
      within(bar()).getByRole('group', {
        name: 'Сообщить владельцу списка, что вы взяли эти предметы?'
      })
    ).toBeInTheDocument();
  });

  it('adds without the price or the note a toggle switches off, and never the GM note', async () => {
    const { dialog, cloud, page } = await sheet();
    await choose(dialog, 'Клад дракона');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Что копировать' }));
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Копировать цену' }));
    await userEvent.click(
      within(dialog).getByRole('checkbox', { name: 'Копировать заметку для игроков' })
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Что изменится' }));
    const text = within(dialog)
      .getAllByRole('row')
      .map((r) => r.textContent)
      .join(' ');
    expect(text).not.toContain('+ заметка для игроков');
    expect(text).toContain('без цены');
    await userEvent.click(addButton(dialog));
    const a = await readList(cloud, page, DRAGON);
    expect(a?.meta).toEqual({ ci1: { qty: 2 }, cc21: { qty: 5 } });
  });
});

describe('a held key', () => {
  it('leaves the entry as it is, names it on the closed sheet and in the table, and adds the rest', async () => {
    const { dialog, cloud, page, container } = await sheet();
    await choose(dialog, 'Монетный');
    expect(within(dialog).getByText('Добавится: 2 позиции · 3 шт.')).toBeInTheDocument();
    expect(
      within(dialog).getByText('1 позиция уже в списке и не изменится')
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Что изменится' }));
    expect(
      within(dialog).getByText('Уже в списке: 2 шт. по 30 зол., ваша заметка останется')
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Что копировать' }));
    await expectNoA11yViolations(container);
    await userEvent.click(addButton(dialog));
    const a = await readList(cloud, page, uuid(813));
    expect(a?.ids).toEqual(['cc21', 'ci1', 'q337']);
    expect(a?.meta?.['cc21']).toEqual({ qty: 2, gold: 30, note: 'моя' });
    expect(await screen.findByText('Добавлено в «Монетный»: 2')).toBeInTheDocument();
  });

  it('writes the held price in the money mode of the chosen list', async () => {
    const { dialog } = await sheet();
    await choose(dialog, 'Мешочный');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Что изменится' }));
    expect(
      within(dialog).getByText(/Уже в списке: 2 шт\. по 3 горст.*, ваша заметка останется/)
    ).toBeInTheDocument();
  });

  it('turns «Добавить» off and says why when every line is held', async () => {
    const { dialog } = await sheet();
    await choose(dialog, 'Все есть');
    expect(
      within(dialog).getByText('Все позиции уже есть в «Все есть»: выберите другой список.')
    ).toBeInTheDocument();
    expect(addButton(dialog)).toBeDisabled();
  });
});

describe('a new list', () => {
  it('asks for a name, then makes the list and adds every line to it', async () => {
    const { dialog, cloud } = await sheet();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Новый список' }));
    expect(within(dialog).getByText('Добавится: 3 позиции · 8 шт.')).toBeInTheDocument();
    await userEvent.click(addButton(dialog));
    expect(await screen.findByText('Сначала назовите список')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('Клад дракона'), 'Сундук');
    await userEvent.click(addButton(dialog));
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(async () => {
      const heads = await cloud.lists.list();
      expect(heads.ok && heads.lists.some((l) => l.name === 'Сундук')).toBe(true);
    });
  });

  it('scrolls the name field into view after it takes the focus', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    try {
      const { dialog } = await sheet();
      await userEvent.click(within(dialog).getByRole('button', { name: 'Новый список' }));
      const field = screen.getByPlaceholderText('Клад дракона');
      await waitFor(() => {
        expect(scroll.mock.contexts).toContain(field);
      });
    } finally {
      Element.prototype.scrollIntoView = () => {};
    }
  });

  it('makes the list once when the first add writes nothing', async () => {
    const { dialog, app } = await direct(taken(LINES.slice(0, 1)));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Новый список' }));
    await userEvent.type(screen.getByPlaceholderText('Клад дракона'), 'Сундук');
    vi.spyOn(app.cloudLists!, 'add').mockReturnValueOnce([]);
    await userEvent.click(addButton(dialog));
    expect(app.addSheet).not.toBeNull();
    expect(within(dialog).getByRole('radio', { name: 'Сундук' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await waitFor(() => {
      expect(addButton(dialog)).toBeEnabled();
    });
    await userEvent.click(addButton(dialog));
    await waitFor(() => {
      expect(app.addSheet).toBeNull();
    });
    expect(app.cloudLists!.lists.filter((l) => l.name === 'Сундук').length).toBe(1);
  });

  it('refuses at the list limit, as the menu does, and keeps the sheet open', async () => {
    const { dialog } = await sheet(fakeCloud(SEEDED, 'gm2', { limits: { lists: 5 } }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Новый список' }));
    await userEvent.type(screen.getByPlaceholderText('Клад дракона'), 'Ещё');
    await userEvent.click(addButton(dialog));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0);
  });
});

describe('many lists', () => {
  it('draws the search box from eight lists and narrows the rows', async () => {
    const lists = [
      ...GM2,
      ...['Шестая', 'Седьмая', 'Восьмая'].map((name, i) => listOf(816 + i, name, []))
    ];
    const { dialog } = await sheet(
      fakeCloud(seedWith({ gm2: lists, gm4: [SHOP] }, SHARES), 'gm2')
    );
    await userEvent.type(
      within(dialog).getByRole('searchbox', { name: 'Найти список' }),
      'Седьм'
    );
    const rows = within(dialog).getAllByRole('radio');
    expect(rows.length).toBe(1);
    expect(rows[0]).toHaveTextContent('Седьмая');
  });
});

/* Opens the sheet over an accepted request's lines, with no page behind it. */
async function direct(source: AddSheetSource) {
  const cloud = fakeCloud(SEEDED, 'gm2');
  const page = fakePage();
  const app = new AppState(
    fakeEnv({ router: memoryRouter(HASH), data: fakeData(LOOT), cloud, page })
  );
  app.start();
  await waitFor(() => {
    expect(app.cloudLists?.status).toBe('ready');
    expect(app.homebrew?.status).toBe('ready');
    expect(app.index).toBeTruthy();
  });
  app.openAddSheet(source);
  const view = render(AddSheet, { app, source });
  const dialog = await screen.findByRole('dialog', { name: 'Добавить в список' });
  return { ...view, app, cloud, page, dialog };
}

const LINES = ['ci1', 'ci2', 'ci3', 'ci4', 'ci5', 'ci6', 'ci7'].map((item) => ({
  item,
  qty: 1
}));
const taken = (
  lines: { item: string; qty: number }[],
  carry: Record<string, { qty?: number; gold?: number; note?: string }> = {},
  records: Record<string, HomebrewRecord> = {}
): AddSheetSource => ({ kind: 'taken', lines, carry, records });

describe('the lines of an accepted request', () => {
  it('opens with the owner lead, no list chosen, over the lines as sent', async () => {
    const { dialog, container } = await direct(taken(LINES.slice(0, 2)));
    expect(within(dialog).getByText('Владелец принял запрос: 2 позиции')).toBeInTheDocument();
    expect(addButton(dialog)).toBeDisabled();
    await expectNoA11yViolations(container);
  });

  it('folds seven lines to five and opens the rest', async () => {
    const { dialog, container } = await direct(taken(LINES));
    await choose(dialog, 'Клад дракона');
    expect(within(dialog).getByText('Добавится: 7 позиций')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Что изменится' }));
    expect(within(dialog).getAllByRole('row').length).toBe(6);
    await userEvent.click(within(dialog).getByRole('button', { name: 'и ещё 2 позиции' }));
    expect(within(dialog).getAllByRole('row').length).toBe(8);
    await expectNoA11yViolations(container);
  });

  it('adds with the price and note kept at the send, and puts the focus on the page', async () => {
    const { dialog, cloud, page, app } = await direct(
      taken([{ item: 'cc21', qty: 3 }], { cc21: { qty: 3, gold: 50, note: 'Бочка' } })
    );
    await choose(dialog, 'Клад дракона');
    await userEvent.click(addButton(dialog));
    expect(app.addSheet).toBeNull();
    expect(await screen.findByText('Добавлено в «Клад дракона»')).toBeInTheDocument();
    const a = await readList(cloud, page, DRAGON);
    expect(a?.meta).toEqual({ cc21: { qty: 3, gold: 50, note: 'Бочка' } });
  });

  it('closes with no add on a close of the dialog', async () => {
    const { dialog, app } = await direct(taken(LINES.slice(0, 1)));
    await choose(dialog, 'Клад дракона');
    dialog.dispatchEvent(new Event('close'));
    expect(app.addSheet).toBeNull();
  });

  it('closes with no add when the reader signs out', async () => {
    const { cloud, app } = await direct(taken(LINES.slice(0, 1)));
    await cloud.auth.signOut();
    await waitFor(() => {
      expect(app.addSheet).toBeNull();
    });
  });

  it('clears a choice when its list is deleted elsewhere', async () => {
    const { dialog, app } = await direct(taken(LINES.slice(0, 1)));
    await choose(dialog, 'Клад дракона');
    app.cloudLists?.remove(DRAGON);
    await waitFor(() => {
      expect(
        within(dialog).getByText('Выберите список, чтобы увидеть, что изменится.')
      ).toBeInTheDocument();
    });
  });
});

describe('a line the store cannot write', () => {
  /* A linked record with no `hid` is not the reader's to write: `sourceOf` answers null. */
  const HB = 'hb_axeaaaaaaaaaaaaa';
  const record = {
    id: HB,
    src: 'hb',
    kind: 'item',
    roll: 1,
    en: 'Axe',
    ende: '',
    ru: 'Топор',
    rud: ''
  } as unknown as HomebrewRecord;

  it('counts nothing for it, shows the refusal in its row and keeps «Добавить» off alone', async () => {
    const { dialog } = await direct(taken([{ item: HB, qty: 1 }], {}, { [HB]: record }));
    await choose(dialog, 'Клад дракона');
    expect(within(dialog).getByText(dict('ru').hbNotAdded)).toBeInTheDocument();
    expect(addButton(dialog)).toBeDisabled();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Что изменится' }));
    expect(within(dialog).getAllByText(dict('ru').hbNotAdded).length).toBe(2);
  });

  it('adds the other lines and names the refusal beside the summary', async () => {
    const { dialog, cloud, page } = await direct(
      taken(
        [
          { item: 'ci1', qty: 1 },
          { item: HB, qty: 1 }
        ],
        {},
        { [HB]: record }
      )
    );
    await choose(dialog, 'Клад дракона');
    expect(within(dialog).getByText('Добавится: 1 позиция')).toBeInTheDocument();
    expect(within(dialog).getByText(dict('ru').hbNotAdded)).toBeInTheDocument();
    await userEvent.click(addButton(dialog));
    expect((await readList(cloud, page, DRAGON))?.ids).toEqual(['ci1']);
  });

  it('toasts the refusal and stays open when the store writes nothing', async () => {
    const { dialog, app } = await direct(
      taken(
        [
          { item: 'ci1', qty: 1 },
          { item: HB, qty: 1 }
        ],
        {},
        { [HB]: record }
      )
    );
    await choose(dialog, 'Клад дракона');
    vi.spyOn(app.cloudLists!, 'add').mockReturnValueOnce([]);
    await userEvent.click(addButton(dialog));
    expect(app.toast).toMatchObject({ msg: dict('ru').hbNotAdded, mode: 'err' });
    expect(app.addSheet).not.toBeNull();
  });

  it('names the refusal by the state of the account items', async () => {
    const { app } = await direct(taken([{ item: 'ci1', qty: 1 }]));
    const ru = dict('ru');
    const say = (): string => app.hbRefusal()(ru, 'ru');
    expect(say()).toBe(ru.hbNotAdded);
    app.homebrew!.status = 'loading';
    expect(say()).toBe(ru.hbNotReady);
    app.homebrew!.status = 'error';
    expect(say()).toBe(ru.hbLoadFailed);
  });
});

describe('the toast of an accepted request', () => {
  /* The page ticked whole and sent by hand, then applied by the owner. */
  async function applied() {
    const cloud = fakeCloud(SEEDED, 'gm2');
    const send = vi.spyOn(cloud.requests, 'send');
    const view = await open(cloud);
    await tickAll();
    await userEvent.click(within(bar()).getByRole('button', { name: 'Сообщить владельцу' }));
    await screen.findByText('Запрос отправлен владельцу списка.');
    const id = send.mock.calls[0]?.[0] as string;
    expect(cloud.decide(id, 'applied')).toBe(true);
    const toast = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('.toast.page');
      expect(el?.textContent).toContain('Владелец принял ваш запрос.');
      return el as HTMLElement;
    });
    return { ...view, toast };
  }

  it('offers «В список» without taking the focus, and opens the sheet over the lines sent', async () => {
    const { toast } = await applied();
    const act = within(toast).getByRole('button', { name: 'В список' });
    expect(document.activeElement).not.toBe(act);
    await userEvent.click(act);
    const dialog = await screen.findByRole('dialog', { name: 'Добавить в список' });
    expect(
      within(dialog).getByText('Владелец принял запрос: 3 позиции · 8 шт.')
    ).toBeInTheDocument();
    for (const radio of within(dialog).getAllByRole('radio')) {
      expect(radio).toHaveAttribute('aria-checked', 'false');
    }
    await waitFor(() => {
      expect(document.querySelector('.toast.page')?.textContent ?? '').not.toContain(
        'Владелец принял'
      );
    });
  });

  it('returns the toast with the focus on its button when the sheet closes with no add', async () => {
    const { toast } = await applied();
    await userEvent.click(within(toast).getByRole('button', { name: 'В список' }));
    const dialog = await screen.findByRole('dialog', { name: 'Добавить в список' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Отмена' }));
    await waitFor(() => {
      expect(document.activeElement?.textContent).toBe('В список');
      expect(document.activeElement?.closest('.toast')).not.toBeNull();
    });
  });

  it('adds from the offer, leaves no toast of the decision and asks nothing', async () => {
    const { toast, cloud, page } = await applied();
    await userEvent.click(within(toast).getByRole('button', { name: 'В список' }));
    const dialog = await screen.findByRole('dialog', { name: 'Добавить в список' });
    await choose(dialog, 'Клад дракона');
    await userEvent.click(addButton(dialog));
    expect(await screen.findByText('Добавлено в «Клад дракона»: 3')).toBeInTheDocument();
    expect((await readList(cloud, page, DRAGON))?.ids).toEqual(['ci1', 'cc21', 'q337']);
    expect(document.body.textContent).not.toContain('Владелец принял ваш запрос.');
    expect(screen.queryByRole('group', { name: /Сообщить владельцу списка/ })).toBeNull();
    await waitFor(() => {
      expect(document.activeElement).toBe(document.getElementById('main'));
    });
  });

  it('closes the open record first and opens only the sheet', async () => {
    const got = captureApp();
    const cloud = fakeCloud(SEEDED, 'gm2');
    const send = vi.spyOn(cloud.requests, 'send');
    await open(cloud);
    await tickAll();
    await userEvent.click(within(bar()).getByRole('button', { name: 'Сообщить владельцу' }));
    await screen.findByText('Запрос отправлен владельцу списка.');
    await userEvent.click(
      screen.getAllByRole('button', { name: /Вещь ci1/ })[0] as HTMLElement
    );
    const record = screen.getByRole('dialog');
    expect(cloud.decide(send.mock.calls[0]?.[0] as string, 'applied')).toBe(true);
    const act = await waitFor(() => {
      const el = record.querySelector<HTMLElement>('.toast .toast-act');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    await userEvent.click(act);
    await screen.findByRole('dialog', { name: 'Добавить в список' });
    expect(document.querySelectorAll('dialog[open]').length).toBe(1);
    expect(got.app().dialogOpen).toBe(true);
  });
});
