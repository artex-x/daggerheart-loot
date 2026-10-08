/* Accessibility, on states rather than on first paints.
 *
 * The other component tests each end with an axe assertion, and every one of
 * them ran on a screen nobody had pressed anything on - the same blind spot
 * the parity harness (deleted at 23c00a6, R0c, issue 47) had before it compared
 * states. The modal is the sharpest example: a focus trap, `aria-modal`, and
 * a close button, none of which any axe run had ever seen, because opening
 * it takes two presses.
 *
 * This file holds the states reached by pressing, and the guard below, which
 * is what keeps the coverage from quietly lapsing when a component is added. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import { fakeData, fakeEnv, fixedClock, memoryRouter, memoryStorage } from '../ports/index.js';
import type { CloudPort, Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import type { Loot } from '../lib/data.js';
import type { Record_ } from '../lib/types.js';

/** A list from another player, both notes and a noted entry - read the same
 *  way `listLink.test.ts` reads every fixture. `ci1` and `cc1` are both in
 *  this file's own `LOOT` below. */
const NOTES_BOTH_KINDS_GM_PAYLOAD: string = (
  JSON.parse(
    readFileSync(
      join(
        import.meta.dirname,
        '..',
        '..',
        '..',
        'docs',
        'fixtures',
        'lists',
        'notes-both-kinds.json'
      ),
      'utf8'
    )
  ) as { gm: { payload: string } }
).gm.payload;

afterEach(cleanup);

/* jsdom does not implement scrollIntoView - the add-to-list menu's placement
   effect calls it unconditionally once open. */
Element.prototype.scrollIntoView = vi.fn();

const row = (over: Partial<Record_>): Record_ => ({
  id: 'x',
  src: 'wondrous',
  kind: 'item',
  en: 'Thing',
  ende: 'Does a thing.',
  ru: 'Вещь',
  rud: 'Делает что-то.',
  ...over
});

const LOOT: Loot = {
  items: {
    wondrous: [
      row({ id: 'w1', roll: 1, ru: 'Первая вещь' }),
      row({ id: 'w2', kind: 'consumable', roll: 2, ru: 'Вторая вещь' })
    ],
    core_item: [row({ id: 'ci1', src: 'core', roll: 1, ru: 'Предмет корника' })],
    core_consumable: [
      row({ id: 'cc1', src: 'core', kind: 'consumable', roll: 1, ru: 'Расходник корника' })
    ],
    hnf_item: [row({ id: 'hi1', src: 'hnf', roll: 1, ru: 'Предмет H&F' })],
    hnf_consumable: [
      row({ id: 'hc1', src: 'hnf', kind: 'consumable', roll: 1, ru: 'Расходник H&F' })
    ],
    voa: [
      row({ id: 'v1', src: 'voa', tier: 1, ru: 'Реликвия' }),
      row({ id: 'v2', src: 'voa', tier: 1, kind: 'consumable', ru: 'Эликсир' })
    ],
    community: [
      row({ id: 'c1', src: 'community', community: 'Loreborne', community_ru: 'Научное' })
    ]
  },
  /* Two weapons of different tiers, enough for the equipment tables' own
     tier sections and the widest facet panel to both draw. */
  eq: [
    row({
      id: 'q1',
      src: 'core',
      ru: 'Меч',
      eq: { t: 'weapon', tier: 1, cls: 'phy', bu: 1 }
    }),
    row({
      id: 'q2',
      src: 'hnf',
      ru: 'Посох',
      eq: { t: 'weapon', tier: 2, cls: 'mag', bu: 2 }
    })
  ],
  refs: {},
  /* One row per column, which is all the alternate tables need to draw a card
     and a critical-success box. */
  alt: {
    item: { common: { hope: ['ci1'], fear: ['hi1'] } },
    consumable: { common: { hope: ['cc1'], fear: ['hc1'] } }
  }
};

const at = (hash: string, over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter(hash), data: fakeData(LOOT), ...over });

/* A RegExp is for a table row: its accessible name is the whole row - name,
   stat line, description and badges - so an exact match would have to spell
   all of that out rather than the one word that identifies it. */
const press = (name: string | RegExp): Promise<void> =>
  userEvent.click(screen.getByRole('button', { name }));

/* Opens «Импорт из файла» and gives the hidden input a file of
   docs/fixtures/import/, as the browser's picker would. */
async function chooseImport(name: string): Promise<void> {
  await userEvent.click(await screen.findByRole('button', { name: 'Импорт из файла' }));
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('no file input');
  const bytes = readFileSync(
    join(import.meta.dirname, '..', '..', '..', 'docs', 'fixtures', 'import', name)
  );
  Object.defineProperty(input, 'files', {
    value: [new File([new Uint8Array(bytes)], name)],
    configurable: true
  });
  await fireEvent.change(input);
}

/**
 * The states axe is run on, beyond the first paints the other files cover.
 *
 * Each is reached the way a person reaches it. A state that is not here is not
 * checked, so adding a way into a screen means adding it - the same rule
 * `STATES` follows in tests/app/inventory.js.
 */
const STATES: {
  what: string;
  route: string;
  storage?: Record<string, string>;
  cloud?: () => CloudPort;
  /** The day the page opens on, for a state after the legacy write cutoff. */
  today?: number;
  enter?: (() => Promise<void>) | undefined;
}[] = [
  {
    what: 'the record over the page, which has the focus trap',
    route: '#/roll/wondrous',
    enter: () => press('Страница')
  },
  {
    what: 'the add-to-list menu, with two lists to choose from',
    route: '#/i/ci1',
    storage: {
      'dhloot.lists.v2': JSON.stringify([
        { id: 'a', name: 'Клад дракона', ids: [], created: 1 },
        { id: 'b', name: 'Лавка в порту', ids: [], created: 2 }
      ])
    },
    enter: () => press('Добавить в список')
  },
  {
    what: 'the help panel, unfolded',
    route: '#/roll/wondrous',
    enter: () => press('Как это работает')
  },
  {
    what: 'the section pinned as the one to open on',
    route: '#/roll/wondrous',
    enter: () => press('Открывать этот раздел при запуске')
  },
  {
    what: 'a roll page in English',
    route: '#/roll/wondrous',
    enter: () => press('EN')
  },
  {
    what: 'Core rules with one source switched off, which halves the grid',
    route: '#/roll/std',
    enter: () => press('Hope & Fear')
  },
  {
    what: 'Core rules with the help panel unfolded',
    route: '#/roll/std',
    enter: () => press('Как это работает')
  },
  {
    what: 'the alternate tables on a critical success, which raises the box',
    route: '#/roll/alt',
    /* Hope opens on 1 and Fear on 2, so one press puts them level. */
    enter: () => press('Кость Страха: На единицу меньше')
  },
  {
    what: 'the alternate tables with the help panel unfolded',
    route: '#/roll/alt',
    enter: () => press('Как это работает')
  },
  {
    what: 'a division of Vault of Ages that is not a tier',
    route: '#/roll/voa',
    enter: () => press('Артефакты')
  },
  {
    what: 'Vault of Ages in English',
    route: '#/roll/voa',
    enter: () => press('EN')
  },
  {
    what: 'communities in English',
    route: '#/roll/community',
    enter: () => press('EN')
  },
  {
    what: 'the record modal over a table',
    route: '#/tables',
    enter: () => press(/Предмет корника/)
  },
  {
    what: 'the grid view of a table',
    route: '#/tables',
    enter: () => press('Сеткой')
  },
  {
    what: 'the table filter panel, open with a value picked',
    route: '#/tables/wondrous',
    enter: async () => {
      await press('Фильтры');
      await press('Предметы');
    }
  },
  {
    what: 'a sectioned table with its filter panel open - two fields, not one',
    route: '#/tables/voa',
    enter: () => press('Фильтры')
  },
  {
    what: 'the equipment table with its widest panel open and a bare-number value pressed',
    route: '#/tables/eq_weapon',
    enter: async () => {
      await press('Фильтры');
      await press('1');
    }
  },
  {
    what: 'the selection bar with its menu open',
    route: '#/tables',
    storage: {
      'dhloot.lists.v2': JSON.stringify([
        { id: 'a', name: 'Клад дракона', ids: [], created: 1 },
        { id: 'b', name: 'Лавка в порту', ids: [], created: 2 }
      ])
    },
    /* `press` grips buttons; the row checkbox is reached by role instead -
       it is named after its own record rather than the generic "Выбрано",
       so the first one is found by excluding select-all's own (named
       "Выбрать все (N)" by its wrapping `<label>`). */
    enter: async () => {
      await userEvent.click(
        screen.getAllByRole('checkbox').filter((cb) => !cb.closest('.selall'))[0] as HTMLElement
      );
      await press('Добавить в список');
    }
  },
  {
    what: 'the lists index with its notice unfolded and two lists',
    route: '#/lists',
    storage: {
      'dhloot.lists.v2': JSON.stringify([
        { id: 'a', name: 'Клад дракона', ids: [], created: 1 },
        { id: 'b', name: 'Лавка в порту', ids: [], created: 2 }
      ])
    },
    /* `press` grips buttons; "подробнее" sits in an `<i>` inside the
       disclosure's `<summary>`, which jsdom toggles open the same way a
       browser does on a click. */
    enter: () => userEvent.click(screen.getByText('подробнее'))
  },
  {
    what: 'a list page with a priced, noted entry and the roll panel open',
    route: '#/lists/a',
    storage: {
      'dhloot.lists.v2': JSON.stringify([
        {
          id: 'a',
          name: 'Тайник',
          ids: ['ci1', 'cc1'],
          meta: {
            ci1: {
              qty: 2,
              gold: 100,
              note: 'Заметка для игроков',
              hnote: 'Только для мастера'
            }
          }
        }
      ])
    },
    /* `press` grips buttons; the roll panel folds open on its `<summary>`,
       which jsdom does not expose as role "button" the way a browser does -
       the same reason the lists index's own disclosure above is clicked by
       its text. */
    enter: () => userEvent.click(screen.getByText('Бросок по списку'))
  },
  {
    what: "a list page with a row's note box open",
    route: '#/lists/a',
    storage: {
      'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'Тайник', ids: ['ci1'] }])
    },
    enter: () => press('Заметка')
  },
  {
    what: 'a list from another player, with both notes and a noted entry',
    route: '#/l/' + NOTES_BOTH_KINDS_GM_PAYLOAD
  },
  {
    /* "вещь" is the word this file's own LOOT gives w1 ("Первая вещь") and
       w2 ("Вторая вещь"), so this state carries two rows of two kinds with
       the third chip switched off. */
    what: 'the search page with a query typed and a kind switched off',
    route: '#/search',
    enter: async () => {
      await userEvent.type(
        screen.getByPlaceholderText('Поиск по названию или описанию…'),
        'вещь'
      );
      await press('Снаряжение');
    }
  },
  {
    what: 'a print sheet switched to black and white',
    route: '#/print/w1-w2',
    enter: async () => {
      await press('Чёрно-белая');
    }
  },
  {
    what: 'a GM share link with both notes, signed out',
    route: '#/s/gm-token-1',
    cloud: () => fakeCloud(SEED),
    enter: async () => {
      await screen.findByText('Кузнец торгуется, если назвать имя его брата.');
    }
  },
  {
    what: 'a share link that opens nothing',
    route: '#/s/unknown',
    cloud: () => fakeCloud(SEED),
    enter: async () => {
      await screen.findByRole('heading', { level: 1, name: 'Список больше не доступен' });
    }
  },
  {
    what: 'the notice under the header after a sign-in moved two browser lists',
    route: '#/lists',
    storage: {
      'dhloot.lists.v2': JSON.stringify([
        { id: 'a', name: 'Тайник', ids: ['ci1'] },
        { id: 'b', name: 'Лавка', ids: [] }
      ])
    },
    cloud: () => fakeCloud(SEED, 'gm1'),
    enter: async () => {
      await screen.findByText(
        'Списки из этого браузера перенесены в ваш аккаунт: «Тайник», «Лавка».'
      );
    }
  },
  {
    what: 'a browser list page read-only after the legacy write cutoff, a row ticked',
    route: '#/lists/a',
    storage: {
      'dhloot.lists.v2': JSON.stringify([
        { id: 'a', name: 'Тайник', ids: ['ci1', 'cc1'], meta: { ci1: { qty: 2, gold: 100 } } }
      ])
    },
    cloud: () => fakeCloud(SEED),
    today: Date.UTC(2026, 9, 26),
    enter: async () => {
      await screen.findByText(
        'Списки в этом браузере только для чтения с 26 октября 2026 года.'
      );
      await userEvent.click(screen.getByRole('checkbox', { name: 'Предмет корника' }));
    }
  },
  {
    what: 'the account page with the delete confirmation open',
    route: '#/account',
    cloud: () => fakeCloud(SEED, 'gm1'),
    enter: async () => {
      await userEvent.click(await screen.findByRole('button', { name: 'Удалить аккаунт...' }));
      await userEvent.type(screen.getByRole('textbox'), 'удалить');
    }
  },
  {
    what: 'the move banner under the header, signed out with a browser list',
    route: '#/roll/std',
    storage: { 'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'Тайник', ids: ['ci1'] }]) },
    cloud: () => fakeCloud(SEED),
    enter: async () => {
      await screen.findByRole('button', { name: 'Войти и перенести списки' });
    }
  },
  {
    what: 'the lists index with two account lists ticked',
    route: '#/lists',
    cloud: () => fakeCloud(SEED, 'gm1'),
    enter: async () => {
      await userEvent.click(
        await screen.findByRole('checkbox', { name: 'Выбрать: Пустой список' })
      );
      await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать: Трофеи' }));
      await screen.findByRole('button', { name: 'Удалить (2)' });
    }
  },
  {
    what: 'the import field with a preview and its report',
    route: '#/lists',
    cloud: () => fakeCloud(SEED, 'gm1'),
    enter: async () => {
      await chooseImport('unknown-id.json');
      await screen.findByText(/Пропущено позиций/);
    }
  },
  {
    what: 'the import field with an error report',
    route: '#/lists',
    cloud: () => fakeCloud(SEED, 'gm1'),
    enter: async () => {
      await chooseImport('errors.json');
      await screen.findByText(
        'В файле ошибки - ничего не импортировано. Исправьте их и выберите файл снова.'
      );
    }
  },
  {
    what: '«Ваши данные» on the account page, ready to download',
    route: '#/account',
    cloud: () => fakeCloud(SEED, 'gm1'),
    enter: async () => {
      await screen.findByRole('heading', { level: 2, name: 'Ваши данные' });
      await vi.waitFor(() => {
        expect(screen.getByRole('button', { name: 'Скачать мои данные (ZIP)' })).toBeEnabled();
      });
    }
  },
  {
    what: '#/homebrew/sources with a source sections open and a new source field',
    route: '#/homebrew/sources',
    cloud: () => fakeCloud(SEED, 'gm1'),
    enter: async () => {
      await userEvent.click(await screen.findByRole('button', { name: 'Разделы' }));
      await userEvent.click(screen.getByRole('button', { name: 'Новый источник' }));
      await screen.findByLabelText('Новый источник');
    }
  },
  {
    what: 'the homebrew editor after a failed save',
    route: '#/homebrew/hb_emberaxeaaaaaaaa',
    cloud: () => fakeCloud(SEED, 'gm1'),
    enter: async () => {
      const bonus = await screen.findByRole('textbox', { name: 'Бонус к урону' });
      await userEvent.clear(bonus);
      await userEvent.type(bonus, 'x');
      await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
      await screen.findByText('Не сохранено: исправьте 1 поле.');
    }
  },
  {
    what: 'an account list with its own item and a refused own-item panel open',
    route: '#/lists/00000000-0000-4000-8000-000000000101',
    cloud: () => fakeCloud(SEED, 'gm1'),
    enter: async () => {
      await userEvent.click(await screen.findByRole('button', { name: 'Свой предмет' }));
      await userEvent.click(screen.getByRole('button', { name: 'Добавить в список' }));
      await screen.findByText('Введите название.');
    }
  },
  {
    what: 'an account list with the own-item row folded after its entries',
    route: '#/lists/00000000-0000-4000-8000-000000000101',
    cloud: () => fakeCloud(SEED, 'gm1'),
    enter: async () => {
      await screen.findByRole('button', { name: 'Свой предмет', expanded: false });
    }
  },
  {
    what: 'an empty account list with its hint and the own-item row',
    route: '#/lists/00000000-0000-4000-8000-000000000102',
    cloud: () => fakeCloud(SEED, 'gm1'),
    enter: async () => {
      await screen.findByText(/Свой предмет можно создать здесь же/);
    }
  },
  {
    what: 'the own-item toast with its «Изменить» link',
    route: '#/lists/00000000-0000-4000-8000-000000000101',
    cloud: () => fakeCloud(SEED, 'gm1'),
    enter: async () => {
      await userEvent.click(await screen.findByRole('button', { name: 'Свой предмет' }));
      await userEvent.type(screen.getByRole('textbox', { name: 'Название*' }), 'Фляга{Enter}');
      await screen.findByRole('link', { name: 'Изменить' });
    }
  },
  {
    what: 'the lists index while the account read is loading',
    route: '#/lists',
    cloud: () => {
      const cloud = fakeCloud(SEED, 'gm1');
      cloud.lists.list = () => new Promise(() => undefined);
      return cloud;
    },
    enter: async () => {
      await screen.findByText('Загружаем...');
    }
  },
  {
    what: 'the lists index after a failed account read, with «Повторить»',
    route: '#/lists',
    cloud: () => {
      const cloud = fakeCloud(SEED, 'gm1');
      cloud.lists.list = () => Promise.resolve({ ok: false });
      return cloud;
    },
    enter: async () => {
      await screen.findByText('Не получилось загрузить списки аккаунта.');
    }
  },
  {
    what: 'an account list page after a failed account read',
    route: '#/lists/00000000-0000-4000-8000-000000000101',
    cloud: () => {
      const cloud = fakeCloud(SEED, 'gm1');
      cloud.lists.list = () => Promise.resolve({ ok: false });
      return cloud;
    },
    enter: async () => {
      await screen.findByRole('heading', { level: 1, name: 'Список не загрузился' });
    }
  },
  {
    what: '#/homebrew after a failed read of the own items',
    route: '#/homebrew',
    cloud: () => {
      const cloud = fakeCloud(SEED, 'gm1');
      cloud.homebrew.load = () => Promise.resolve({ ok: false });
      return cloud;
    },
    enter: async () => {
      await screen.findByText('Не получилось загрузить ваши предметы.');
    }
  },
  {
    what: 'the account menu open over a section, signed in',
    route: '#/roll/std',
    cloud: () => fakeCloud(SEED, 'gm1'),
    enter: async () => {
      await userEvent.click(
        await screen.findByRole('button', { name: 'Аккаунт: gm1@example.test' })
      );
      await screen.findByRole('menu');
    }
  }
];

describe('states reached by pressing something', () => {
  it.each(STATES)(
    'has no axe violations on $what',
    async ({ route, storage, cloud, today, enter }) => {
      const { container } = render(App, {
        env: at(route, {
          ...(storage ? { storage: memoryStorage(storage) } : {}),
          ...(cloud ? { cloud: cloud() } : {}),
          ...(today === undefined ? {} : { clock: fixedClock(today) })
        })
      });
      await enter?.();
      await expectNoA11yViolations(container);
    }
  );
});

/**
 * Where each component is rendered under axe.
 *
 * A guard, not documentation: the test below compares this against the files
 * on disk, so a new component fails until somebody says which state exercises
 * it. Coverage already forces a component to be *rendered* by some test; this
 * is what forces it to be rendered while axe is watching, which is a different
 * question and the one that was going unasked.
 */
const COVERED: Record<string, string> = {
  'AccountMenu.svelte': 'the account menu open, in the state above, and accountMenu.test.ts',
  'AccountPage.svelte':
    'accountPage.test.ts in every state, the delete confirmation open and «Ваши данные» above',
  'Actions.svelte': 'the card actions on every record state above, and record.test.ts',
  'AddToList.svelte': 'the add-to-list menu, in the state above',
  'Toast.svelte':
    'the toast the add-to-list press raises, in the state above, and shell.test.ts',
  'DiceBar.svelte': 'the Core rules panel - std.test.ts and the state below',
  'FilterBar.svelte': 'tables.test.ts, and the filter panel state below',
  'HelpBox.svelte': "PageHead's help panel states above",
  'HomebrewEditor.svelte':
    'homebrewEditor.test.ts in every kind, the problems and the banners; the failed save above',
  'HomebrewImport.svelte':
    'homebrewImport.test.ts: the panel empty, a preview with every row note, a refused file, the update chosen',
  'HomebrewPage.svelte':
    'homebrewPage.test.ts on each tab, filled, empty and signed out; the Sources tab above',
  'HomebrewSources.svelte':
    'homebrewPage.test.ts, and the Sources tab with the sections and the new source open above',
  'HomebrewCards.svelte':
    'homebrewPage.test.ts on the Sets and Rules tabs: a card closed and open, each card form open, every refusal',
  'CardForm.svelte':
    'homebrewPage.test.ts on the Sets and Rules tabs, and homebrewEditor.test.ts with its inline set and rule card forms',
  'HomebrewRelations.svelte':
    'homebrewEditor.test.ts with the fold «Связи» open for each kind, its problems and its forms',
  'ItemPage.svelte': 'itemPage.test.ts: each state, a reader and the author',
  'ItemPicker.svelte': 'itemPicker.test.ts closed, open and full, and homebrewEditor.test.ts',
  'NameField.svelte':
    'the new source field above, and homebrewEditor.test.ts with its inline source',
  'PickRow.svelte': 'record.test.ts on a catalog and an own record, and inside the modal above',
  'QuickItem.svelte': 'quickItem.test.ts, and the refused own-item panel above',
  'FormField.svelte':
    'the own-item panel above, and every field of homebrewEditor.test.ts with each «?» closed and open',
  'TextArea.svelte': 'the own-item panel above, and the description in homebrewEditor.test.ts',
  'HelpButton.svelte':
    "PageHead's help panel states above, the list page's own priced entry below, and each field «?» of homebrewEditor.test.ts closed and open",
  'HitNote.svelte':
    "the list page's priced, noted entry with the roll panel open above, and the shared list below",
  'ListPage.svelte': 'listPage.test.ts, and both list-page states below',
  'ListCard.svelte': 'listsPage.test.ts, signed out, signed in and with a failed read',
  'OrGrid.svelte': 'the Core rules panel, which is the only screen with a choice',
  'StdPanel.svelte': 'std.test.ts, and both pressed states below',
  'Button.svelte':
    'the roll button and the card actions, on every roll page; the second set disclosure in homebrewEditor.test.ts',
  'Chip.svelte': 'the Vault of Ages and community pickers - sections.test.ts and above',
  'AltPanel.svelte': 'alt.test.ts, and the critical-success state below',
  'BatchBar.svelte':
    'batchBar.test.ts idle, some and all ticked; the lists index with two ticked above; listPage.test.ts',
  'ImportPanel.svelte':
    'importPanel.test.ts empty, previewed, refused and with errors; the preview and error reports above',
  'Badge.svelte': 'badge.test.ts, record.test.ts, tables.test.ts, and the lists index above',
  'ChipRow.svelte': 'the same two pickers',
  'CommunityPanel.svelte': 'sections.test.ts, and in English above',
  'Die.svelte': 'the roll button on every roll page',
  'Empty.svelte': "tables.test.ts's nothing-found states, and the lists index above",
  'Field.svelte': 'the number row on every roll page, and both pickers',
  'Icon.svelte': 'the card actions and the pin toggle',
  'KeepNote.svelte':
    'the note under the print bar in printPage.test.ts, and under the toolbar in tables.test.ts',
  'ListsPage.svelte': 'listsPage.test.ts, and the state above',
  'LoadState.svelte':
    'the loading and failed account reads above; homebrewCatalog.test.ts failed, with axe; homebrewPage.test.ts, homebrewEditor.test.ts and record.test.ts loading and failed',
  'MoveNotice.svelte': 'moveNotice.test.ts in every form, and the moved-lists state above',
  'MoveStatus.svelte': 'moveStatus.test.ts in every form, and listsPage.test.ts',
  'NoticeBox.svelte': 'through MoveNotice and MoveStatus, in their tests and the state above',
  'NoData.svelte': "record.test.ts's no-data case, and every page test's own",
  'NumberField.svelte': 'the number row on every roll page',
  'NumRow.svelte': 'the number row on every roll page, and the lists index above',
  'PageHead.svelte': 'the heading of every roll page, with both help states above',
  'PageTitle.svelte':
    "record.test.ts's record and not-found pages, listPage/printPage/sharedListPage.test.ts",
  'Panel.svelte': 'every roll page state above, the lists index and search',
  'PickQty.svelte':
    "the taken-count fields in listPage.test.ts's and sharedListPage.test.ts's own a11y cases",
  'RecordActions.svelte': 'record.test.ts, and inside the modal above',
  'RecordCard.svelte': 'record.test.ts, and inside the modal above',
  'RecordHost.svelte':
    'the first state above (through RollPanel), and every page test that opens the modal',
  'RecordModal.svelte': 'the first state above, and the tier ladder in record.test.ts',
  'RecordPage.svelte': 'record.test.ts',
  'RequestsPanel.svelte':
    'requestsPanel.test.ts pending, short with and without «Принять доступное», and the fold open',
  'ImportFile.svelte':
    'importPanel.test.ts and homebrewImport.test.ts, the field open with and without a file',
  'ImportLines.svelte':
    "importPanel.test.ts's grouped report and refusals, and homebrewImport.test.ts's refused file",
  'RollPanel.svelte': 'roll.test.ts, and the pressed states above',
  'PrintCard.svelte': 'printPage.test.ts, and the black-and-white sheet below',
  'PrintPage.svelte': 'printPage.test.ts, and the black-and-white sheet below',
  'Seg.svelte':
    'the frame, on every state here and in shell.test.ts; the tables view switch in tables.test.ts; the print sheet below',
  'RowMain.svelte':
    "tables.test.ts's sectioned-body axe check, both list-page states below, and a GM-only row in listPage.test.ts",
  'SearchBox.svelte':
    "the tables toolbar in tables.test.ts, and the search page's own box below",
  'SearchPage.svelte': 'searchPage.test.ts, and the searched state with a kind off below',
  'SectionHead.svelte': "tables.test.ts's sectioned-body axe check",
  'SelBar.svelte': 'the state above, and tables.test.ts',
  'SourcePicker.svelte':
    "homebrewImport.test.ts's «Куда» rows, and the move panel open in homebrewPage.test.ts",
  'SharedListPage.svelte':
    'sharedListPage.test.ts in both modes, and the shared list and both share links above',
  'SharePanel.svelte': 'sharePanel.test.ts open, with a deleted link, and with a failed read',
  'SignInPrompt.svelte':
    'signInPrompt.test.ts in its three forms, and inside the add-to-list menu (lists.test.ts)',
  'Shell.svelte': 'shell.test.ts',
  'StorageNotice.svelte': 'the lists index state above, and the list page below',
  'Switch.svelte':
    'switch.test.ts on and off, and «Свои предметы» on search and the equipment tables (homebrewCatalog.test.ts)',
  'TabBar.svelte': 'the frame, on every state',
  'TextInput.svelte':
    'the lists index above, and the delete confirmation open above (accountPage.test.ts)',
  'TableLink.svelte': "record.test.ts and itemPage.test.ts: the author's table link",
  'TableRows.svelte': "tables.test.ts's sectioned-body axe check, and the plain table above",
  'TablesPage.svelte': 'tables.test.ts, and the pressed states below',
  'VoaPanel.svelte': 'sections.test.ts, and in English above'
};

describe('the guard', () => {
  it('has an axe-covered state named for every component', () => {
    /* Vite resolves this at build time, so it needs no filesystem and no guess
       about the working directory - `import.meta.url` is rewritten by the
       transform, and cwd differs between `npm test` and a single-file run. */
    const onDisk = Object.keys(import.meta.glob('./*.svelte'))
      .map((p) => p.replace('./', ''))
      .sort();
    /* Compared as a whole rather than one-way: a component that is deleted has
       to lose its entry too, or the list drifts into fiction. */
    expect(onDisk).toEqual(Object.keys(COVERED).sort());
  });

  it('says something about each, rather than carrying an empty promise', () => {
    for (const [file, where] of Object.entries(COVERED)) {
      expect(where.length, file).toBeGreaterThan(10);
    }
  });
});
