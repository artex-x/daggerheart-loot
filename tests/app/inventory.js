/* "Everything a person can reach" - the states tests/app/golden.js
 * captures a structural snapshot of on both languages. Originated (issue 47)
 * as an independent copy of tests/parity/specs.js's STATES array plus the
 * module-level constants it read: the print routes and the button-name
 * dictionary NAME (used inside several `enter` closures). specs.js and the parity harness around it
 * were later deleted; this file is now the only copy.
 *
 * tests/app/golden.js is the only reader; tests/app/lib.js's `fresh()` and
 * `makeDriver` do the rest.
 *
 * A state with `again` runs it after the press on «EN», which closes an open `Menu`.
 *
 * A state marked `timed: true` raises a toast that lives 1600-7000ms.
 * golden.js arrives at it fresh per language instead of reusing one arrival
 * for both (`captureState`): a 50-120ms snapshot ahead of the EN press would
 * otherwise eat into the toast's own window on a state that needs one more
 * press to reach English, and it polls the toast up before snapshotting
 * (`waitForToast`) rather than guessing a fixed pause. `whole: true` is
 * carried over from this file's parity-era shape (a full-page screenshot,
 * as opposed to the viewport alone) but golden.js's accessibility-tree
 * capture reads the same either way, so it currently marks nothing golden.js
 * itself branches on.
 * The EN half of a `timed` state reads its toast in English: the toast
 * follows the switch (docs/specs/I18N.md, "Rules").
 *
 * A state with `as: '<user>'` opens signed in as that fake-cloud seed user
 * (`?as=<user>`, the test build only - docs/specs/COVERAGE.md, "Test
 * layers"); its id ends ` as <user>` and golden.js writes `# as: <user>`
 * into its header. A state without `as` is signed out and says nothing, so
 * no golden written before signed-in states existed moves. The test build
 * always has the fake cloud, so a signed-out state that would create a list
 * draws the sign-in prompt instead; the states that create one run `as gm2`
 * (docs/DECISIONS.md, 2026-09-25, "The browser suites' signed-out states draw
 * the sign-in prompt ...").
 * tests/app/golden.test.mjs pins the id convention both ways.
 */

const path = require('path');

/** A real 640 px square picture for the editor's «Картинка». */
const ART_FILE = path.join(__dirname, '../../img/ci1.webp');

/* The fake cloud seed's homebrew (`app/src/ports/fake-cloud-seed.ts`): the axe's
   row id, and its content renamed as another device would. */
const HB_AXE = 'hb_emberaxeaaaaaaaa';
const HB_RING = 'hb_engravedringaaaa';
const HB_CAP = 'hb_whispercapaaaaaa';
const HB_AXE_ID = '00000000-0000-4000-8000-000000000511';
const HB_AXE_RENAMED = {
  content: {
    kind: 'equip',
    ru: 'Топор Тлеющих Углей II',
    en: 'Ember Axe II',
    rud: 'Лезвие тлеет и не гаснет под дождём.',
    ende: 'The blade smoulders and does not go out in the rain.',
    section: 'hb_sectbladesaaaaaa',
    eq: {
      t: 'weapon',
      tier: 2,
      cls: 'mag',
      tr: 'spellcast',
      rg: 'melee',
      dmg: 'd10+2',
      dt: 'mag',
      bu: 2
    }
  },
  book_id: '00000000-0000-4000-8000-000000000501'
};

/* The print sets the states below open, seeded in the fake cloud
 * (`app/src/ports/fake-cloud-seed.ts`, `PRINT_SETS`): `gm4` made them, and a state
 * reads one as `gm2`, which has no print layout of its own, or as `gm1`. */
const TWO = '#/p/set-twocards';
/* «Ещё» on the h1 row of `#/search` up to 760 px. */
const SEARCH_MORE = '.headrow [aria-haspopup="menu"]';
const COUNTED = '#/p/set-counted1';
/* Every card shape on one sheet; `tests/app/print.js`'s own `NINE`. */
const NINE = '#/p/set-ninecard';
/* The longest texts; `tests/app/print.js`'s own `LONG`. */
const LONG = '#/p/set-longtext';
const TEN = '#/p/set-tencards';
/* Dragon's Vault's own worst cases: Frostwyrd's longest rung, the
 * One/Two-Handed grip mark, the Spellcast trait cell, two second strips
 * (Ember, Steampowered Gauntlets), the set line on both members, and a loot
 * card with a folded GM box. */
const DV_SET = '#/p/set-dragonvt';
/* Vault of Ages Volume 4's worst cases: the artifact weapon card, the three
 * set members, a consumable artifact, a weapon with a referenced adversary,
 * a folded condition line, and two bulleted lists. */
const VOA4_SET = '#/p/set-voa4wrst';

/* A description at the 3000-code-point limit, which the print card cuts off. */
const CLIPPED_TEXT =
  'Раз за отдых вы можете развернуть свиток и прочитать его вслух до конца сцены. '
    .repeat(40)
    .slice(0, 3000);

/** The print controls' name: the driver names a titled button by its text. */
const PRINT = 'Печать';

/** Waits until a `#/p/` page has left «Загружаем...»: its sheet, its sub or its error page. */
async function sheet(d) {
  for (let i = 0; i < 200; i++) {
    if ((await d.count('.printbar, .page-sub, .errpage')) > 0) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('a #/p/ state never left its loading line');
}

/**
 * The names a spec grips, in each language.
 *
 * A spec is handed the language it is running in and looks its buttons up
 * here. Before this the names were Russian literals, so in English the
 * clipboard specs threw and - worse - `recordActions` used `has`, which
 * returns false rather than throwing: it reported every button missing on
 * both apps and passed. A spec that cannot find anything must not agree with
 * itself.
 */
const NAME = {
  ru: {
    copyName: 'Скопировать название',
    copyText: 'Скопировать текст',
    copyImage: 'Скопировать изображение',
    copyLink: 'Скопировать ссылку',
    send: 'Отправить',
    addToList: 'В список',
    stepDown: 'На единицу меньше',
    stepUp: 'На единицу больше',
    pinSection: 'Открывать при запуске',
    filters: 'Фильтры',
    itemsChip: 'Предметы',
    resetFilter: 'Сбросить всё',
    filterLink: 'Ссылка на фильтры',
    clearSel: 'Снять выделение',
    share: 'Поделиться',
    del: 'Удалить',
    note: 'Заметка',
    removeItem: 'Убрать из списка',
    undo: 'Вернуть',
    noteClear: 'Очистить',
    rollBy: 'Бросить по списку',
    moneyCoin: 'Монетами',
    rename: 'Название списка',
    position: 'Позиция в списке',
    printHint: 'Собрать карточки для печати: девять на лист A4',
    printLink: 'Ссылка на набор',
    prices: 'Цены',
    /* Exact, not the default fuzzy match: the action row's own delete-list
       button is named exactly "Удалить", and `d.click()` prefers an exact
       match at every index - the plain name would delete the list instead. */
    delOne: 'Удалить (1)',
    clearPriceOne: 'Убрать цену (1)',
    applyPrices: 'Проставить эти цены',
    discount: 'Сделать скидку',
    /* Exact: the EN press has already renamed it by the time a press spec runs. */
    newList: 'Новый список',
    create: 'Создать'
  },
  en: {
    copyName: 'Copy name',
    copyText: 'Copy text',
    copyImage: 'Copy image',
    copyLink: 'Copy link',
    send: 'Share',
    addToList: 'Add to list',
    stepDown: 'One lower',
    stepUp: 'One higher',
    pinSection: 'Open on start',
    filters: 'Filters',
    itemsChip: 'Items',
    resetFilter: 'Reset all',
    filterLink: 'Filter link',
    clearSel: 'Clear selection',
    share: 'Share',
    del: 'Delete',
    note: 'Note',
    removeItem: 'Remove from the list',
    undo: 'Undo',
    noteClear: 'Clear',
    /* A plain apostrophe, the way the live app prints it (dict.ts's ASCII
       string, straightened) - not a curly one. */
    rollBy: 'Roll on this list',
    moneyCoin: 'In coins',
    rename: 'List name',
    position: 'Position in the list',
    printHint: 'Lay these out for printing: nine to an A4 sheet',
    printLink: 'Link to this set',
    prices: 'Prices',
    delOne: 'Delete (1)',
    clearPriceOne: 'Clear price (1)',
    applyPrices: 'Set these prices',
    discount: 'Discount',
    newList: 'New list',
    create: 'Create'
  }
};

const LANGS = ['ru', 'en'];

/** The first row's «Ещё» on the list page from 761 px. */
const FIRST_ROW_MORE = '.lrow-acts .morewrap > [aria-haspopup="menu"]';
/** The row «Ещё» of the list page's entry `name`, from 761 px. */
const ROW_MORE = (name) => '.lrow-acts .morewrap > [aria-label="Ещё: ' + name + '"]';

/** The fake seed's `gm1` list «Лавка кузнеца», `uuid(101)`, with both share links. */
const SHOP = '#/lists/00000000-0000-4000-8000-000000000101';
/** The fake seed's `gm1` list «Трофеи», `uuid(103)`, with no share link. */
const TROPHIES = '#/lists/00000000-0000-4000-8000-000000000103';
/** The fake seed's `gm1` list «Пустой список», `uuid(102)`, with no entries. */
const EMPTY_LIST = '#/lists/00000000-0000-4000-8000-000000000102';
/** The fake seed's `gm2` list, `uuid(201)`, which holds a link to gm1's axe. */
const GM2_LIST = '#/lists/00000000-0000-4000-8000-000000000201';

/* Another device marks «Брошюра по Истории Искусства» (di11) of the shop GM only once
   the share page's topic is joined. */
async function gmOnlyLive(d) {
  for (let i = 0; i < 40 && !(await d.count('.said[data-live="live"]')); i++) await d.settle();
  await d.fake('playEntry', '00000000-0000-4000-8000-000000000101', 'di11', { gm_only: true });
}

/* gm3's «Скатка следопыта», the middle of its own chain and set; gm3's item at the
   120-code-point name; an id no item has. */
const ITEM_H = '#/h/00000000-0000-4000-8000-000000000662';
const ITEM_LONG = '#/h/00000000-0000-4000-8000-000000000615';
const ITEM_NONE = '#/h/00000000-0000-4000-8000-000000009999';
const ITEM_MARKUP = '#/h/00000000-0000-4000-8000-000000000515';

/** Two purchase requests on «Лавка кузнеца» from other readers, the players' link
 *  first: the fake seed holds none, so a state makes its own. */
/** A file of docs/fixtures/import/, for the import field's states. */
const IMPORT = (name) => path.join(__dirname, '../../docs/fixtures/import', name);
const HB_FILE = (name) => path.join(__dirname, '../../docs/fixtures/homebrew-file', name);
/* A homebrew file whose source name is the longest one (80 code points, no space),
   written to the system's temp directory. */
function longNamesFile() {
  const fs = require('fs');
  const os = require('os');
  const file = path.join(os.tmpdir(), 'dhloot-golden-long-names.json');
  const book = 'hb_longnamesourceaa';
  fs.writeFileSync(
    file,
    JSON.stringify({
      format: 'daggerheart-loot/homebrew',
      version: 1,
      books: [{ key: book, ru: 'Мастерская'.repeat(8) }],
      items: [
        { key: 'hb_longnameitemaaaa', book, kind: 'item', ru: 'Предмет'.repeat(17) + 'а' }
      ]
    })
  );
  return file;
}
/* A homebrew file of 12 items with the keys of gm3's first 12 seeded bedrolls, so all 12
   are held, written to the system's temp directory. */
function heldNamesFile() {
  const fs = require('fs');
  const os = require('os');
  const file = path.join(os.tmpdir(), 'dhloot-golden-held-names.json');
  fs.writeFileSync(
    file,
    JSON.stringify({
      format: 'daggerheart-loot/homebrew',
      version: 1,
      items: Array.from({ length: 12 }, (_, i) => ({
        key: 'hb_bedroll' + String.fromCharCode(97 + i) + 'aaaaaaaa',
        kind: 'item',
        ru: 'Скатка из файла ' + String(i + 1).padStart(2, '0')
      }))
    })
  );
  return file;
}
/* The control the page names in its language: the sweep's English run draws a signed-in
   user's pages in English (`?lang=`). */
async function clickEither(d, ru, en) {
  if ((await d.text()).includes(ru)) await d.click(ru);
  else await d.click(en);
}

/* Ticks two of gm3's rows: the mode opens with the first tick. */
async function hbTickTwo(d) {
  const names = await d.tickNames();
  for (const name of names.slice(0, 2)) await d.tick(name);
}

/* «Импорт из файла» open on «Мои предметы», its lazy chunk loaded. The panel's caption is
   uppercase, and `innerText` reads it so. */
async function hbImportOpen(d) {
  /* Up to 760 px the import is an item of the head's «Ещё». */
  const more = '.pickrow [aria-haspopup="menu"]';
  if (await d.count(more)) await d.openMore(more);
  await clickEither(d, 'Импорт из файла', 'Import from file');
  for (
    let i = 0;
    i < 40 &&
    !/Импорт предметов из файла JSON|Import items from a JSON file/i.test(await d.text());
    i++
  )
    await d.settle();
}

/* The lists index's head «Ещё» up to 760 px, and the first card's «Ещё». */
const HEAD_MORE = '.headx .morewrap > [aria-haspopup="menu"]';
const CARD_MORE = '.listcard-acts .morewrap > [aria-haspopup="menu"]';

/** Waits for the account cards of the lists index. */
async function waitCards(d) {
  for (let i = 0; i < 40 && !(await d.count('.listcard')); i++) await d.settle();
}

/** Waits for gm1's account cards, then opens «Импорт из файла»: up to 760 px from the
 *  head's «Ещё». */
async function importOpen(d) {
  await waitCards(d);
  if (await d.count(HEAD_MORE)) await d.openMore(HEAD_MORE);
  await clickEither(d, 'Импорт из файла', 'Import from file');
}

/** Waits for gm1's account cards, then opens the selection mode and ticks «Пустой список»
 *  and «Трофеи». */
async function tickTwo(d) {
  await waitCards(d);
  await d.tick('Выбрать: Пустой список');
  await d.tick('Выбрать: Трофеи');
}

/** Presses «Новый список», types `name` and presses «Создать». */
async function createList(d, name) {
  await d.click('Новый список');
  await d.type('Клад дракона', name);
  await d.click('Создать');
}

/** Two purchase requests, sent once the owner's first requests read has landed: an arrival
 *  before it says nothing, so the new-request toast is the same in every run. */
async function twoRequests(d) {
  for (let i = 0; i < 40 && !(await d.count('main[data-requests="ready"]')); i++)
    await d.settle();
  await d.fake('request', 'player-token-1', [
    { item: 'ci1', qty: 1 },
    { item: 'cc1', qty: 3 }
  ]);
  await d.fake('request', 'gm-token-1', [
    { item: 'cc1', qty: 9 },
    { item: 'q1', qty: 1 }
  ]);
}

/** Opens the requests panel by its head button: it folds on each page visit
 *  (docs/specs/FEATURES.md, "Lists"). */
async function openRequests(d) {
  for (let i = 0; i < 40 && !(await d.count('.reqhead button')); i++) await d.settle();
  if (await d.count('.reqhead button[aria-expanded="false"]')) await d.click('Открыть');
}

/** Two purchase requests that arrive while the index is open, read there as heads, then
 *  «Лавка кузнеца» opened again. */
async function requestsOnIndex(d) {
  await d.go('#/lists');
  await twoRequests(d);
  for (let i = 0; i < 40 && !(await d.count('.listcard-new')); i++) await d.settle();
  await d.go(SHOP);
}

/** Four purchase requests on «Лавка кузнеца», the newest of seven lines: the panel
 *  draws three and folds the rest. */
async function manyRequests(d) {
  await twoRequests(d);
  await d.fake('request', 'player-token-1', [{ item: 'q1', qty: 1 }]);
  await d.fake(
    'request',
    'gm-token-1',
    ['ci1', 'q1', 'q313', 'cc1', 'voa2_a3', 'q23', 'w51'].map((item) => ({ item, qty: 1 }))
  );
}

/* Account list specs for the list states below (`driver.js`, `accountLists`: list `n` is
   `uuid(8000 + n)`). A state that needs a list makes it in `enter` on gm4, who owns none,
   with `onAccount`. */
const KLAD = { n: 1, name: 'Клад дракона', ids: [] };
const LAVKA = { n: 2, name: 'Лавка в порту', ids: [] };
const TWO_SPECS = [KLAD, LAVKA];
const RING_SPECS = [{ ...KLAD, ids: ['ci28'] }, LAVKA];
const EIGHT_SPECS = [
  ...TWO_SPECS,
  ...Array.from({ length: 6 }, (_, i) => ({
    n: 3 + i,
    name: 'Лавка №' + String(i + 1),
    ids: []
  }))
];

/* Twelve lists, past the search threshold of both the menu and the index:
   `ci1` lies in «Клад дракона», «Порт Ветров» and «Сессия 3». */
const TWELVE_SPECS = [
  { ...KLAD, ids: ['ci1'] },
  LAVKA,
  ...[
    'Храм Солнца',
    'Рынок',
    'Порт Ветров',
    'Логово',
    'Трофеи',
    'Кузнец',
    'Сессия 3',
    'Сессия 4',
    'Сундук мага',
    'Ёлочная ярмарка'
  ].map((name, i) => ({ n: 3 + i, name, ids: i === 2 || i === 6 ? ['ci1'] : [] }))
];
/* Forty-nine lists: with gm2's own one the account is at the limit of 50. */
const FORTY_NINE_SPECS = Array.from({ length: 49 }, (_, i) => ({
  n: 100 + i,
  name: 'Список ' + String(i + 2),
  ids: []
}));
/* Thirty lists: the index draws 24 and folds 6 under «Показать ещё (6)». */
const THIRTY_SPECS = [
  ...TWELVE_SPECS,
  ...Array.from({ length: 18 }, (_, i) => ({
    n: 13 + i,
    name: 'Сессия ' + String(5 + i),
    ids: []
  }))
];

const SEVEN_IDS = ['ci1', 'ci2', 'ci3', 'ci4', 'ci5', 'ci6', 'ci7'];
/* The list page's own lists: seven entries, and an empty list beside them. */
const SEVEN_SPECS = [{ ...KLAD, ids: SEVEN_IDS }, LAVKA];
/* A priced, counted, noted entry, and a list note both public and hidden. */
const NOTED_SPECS = [
  {
    ...KLAD,
    ids: SEVEN_IDS,
    meta: { ci2: { qty: 2, gold: 750, note: 'Светится в темноте', hnote: 'Проклят' } },
    note: 'Лавка закрыта до утра'
  },
  LAVKA
];
/* `NOTED_SPECS` with formatted notes: italics and a list in the list note, bold and a
   numbered list in row 2's (docs/specs/FEATURES.md, "Lists"). */
const FORMATTED_SPECS = [
  {
    ...KLAD,
    ids: SEVEN_IDS,
    meta: {
      ci2: {
        qty: 2,
        gold: 750,
        note: '**Светится** в темноте\n1. днём тускло\n2. ночью ярко',
        hnote: 'Проклят'
      }
    },
    note: 'Лавка *закрыта* до утра\n- вход со двора'
  },
  LAVKA
];

/* Fourteen entries: past the list page's search threshold of 8. */
const MANY_SPECS = [
  { ...KLAD, ids: [...SEVEN_IDS, 'ci8', 'cc1', 'cc2', 'cc3', 'q1', 'q2', 'q3'] },
  LAVKA
];
/* A list name at `NAME_MAX`, 120 code points. */
const LONG_LIST_NAME = Array.from({ length: 12 }, () => 'Сокровищница')
  .join(' ')
  .slice(0, 120);
const LONG_NAME_SPECS = [{ ...KLAD, name: LONG_LIST_NAME, ids: SEVEN_IDS }, LAVKA];

/** Opens the «Ещё» `sel` again after the EN press closed it, from the page's top: the
 *  menu scrolled the page, and up to 760 px the header covers a control under it. */
const reopen = (sel) => async (d) => {
  if (await d.count('[role="menu"]')) return;
  await d.scrollPage(0);
  await d.openMore(sel);
};

/** Makes the account lists `specs` on the signed-in page and opens the first (`go`) or stays. */
const onAccount = async (d, specs, go = true) => {
  await d.settled();
  const made = await d.accountLists(specs);
  if (go) await d.go(made[0].hash);
};

/* An account list id no account holds. */
const LIST_GONE = '#/lists/00000000-0000-4000-8000-000000009999';

/* The ported list page states: gm4's list `uuid(8001)`, made in `enter`. */
const LIST_A = '#/lists/00000000-0000-4000-8000-000000008001';

/** A list row's checkbox is named after its own record, so a spec ticking row 1 or row 2
 *  of `SEVEN_SPECS`/`NOTED_SPECS` clicks the record's own Russian name (ci1, ci2). */
const ROW1_CI1 = 'Первоклассный Спальный Мешок';
const ROW2_CI2 = 'Пронзительная Свирель';

const STATES = [
  { id: '#/i/ci1', route: '#/i/ci1', why: 'a loot record' },
  { id: '#/i/q1', route: '#/i/q1', why: 'an equipment record' },
  {
    id: '#/i/nope',
    // The old form: the host answers /i/nope, an id with no file, with 404.html.
    route: '/#/i/nope',
    why: 'the not-found record page: «Предмета по этому адресу нет», the address in the sentence, «Найти предмет» and «Открыть таблицы»'
  },
  {
    id: '#/i/ci1 ~ actions menu',
    route: '#/i/ci1',
    why: '«Ещё» open signed out: the four copies, then «Сохранить себе» with the second line «Сначала вход в аккаунт»',
    enter: (d) => d.openMore(),
    again: (d) => d.openMore()
  },
  {
    id: '#/i/ci1 ~ actions menu as gm1',
    route: '#/i/ci1',
    as: 'gm1',
    why: '«Ещё» open signed in: the four copies, then «Сохранить себе» with no second line (no list links the record)',
    enter: (d) => d.openMore(),
    again: (d) => d.openMore()
  },
  {
    id: '#/roll/wondrous',
    route: '#/roll/wondrous_environments',
    why: 'a roll on a table with a real die'
  },
  {
    id: '#/roll/dread',
    route: '#/roll/dread_gm_toolbox',
    why: 'a roll on a table with no die of its own'
  },

  /* The card over the page it was opened from. Reached by pressing the picture
     on a result, which is the only way in, and drawn by neither route. */
  {
    id: '#/roll/wondrous ~ modal',
    route: '#/roll/wondrous_environments',
    why: 'the card opened over the roll',
    enter: async (d) => {
      await d.click('Открыть карточку');
    }
  },

  /* The explanation above the control, which is folded away until it is asked
     for. Four paragraphs and a link to the book, none of it on a first paint. */
  {
    id: '#/roll/wondrous ~ help',
    route: '#/roll/wondrous_environments',
    why: 'the help panel, unfolded',
    enter: async (d) => {
      await d.click('Об этой таблице');
    }
  },

  /* The stepper, which is the other way to choose a row and the one a person
     uses when they rolled a real die and want the next entry. Deterministic,
     unlike the roll button - which cannot be compared by its result, because
     the live app's randomness cannot be seeded from here. */
  {
    id: '#/roll/wondrous ~ stepped',
    route: '#/roll/wondrous_environments',
    why: 'the roll stepped up twice',
    enter: async (d) => {
      await d.click('На единицу больше');
      await d.click('На единицу больше');
    }
  },

  /* The starting-section toggle: 26px of paint, 44px of target, and a mis-tap
     silently changes where the app opens. Pressed, it is a filled gold circle
     and its own name changes. */
  {
    id: '#/roll/wondrous ~ pinned',
    route: '#/roll/wondrous_environments',
    why: 'the section pinned as the one to open on',
    enter: async (d) => {
      await d.click('Открывать при запуске');
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },

  /* Below the fold. A record card is taller than the window, so the picture,
     the badges and the name were being compared and the description, the craft
     chain, the references and the footer were not. */
  { id: '#/i/ci1 ~ whole', route: '#/i/ci1', why: 'a record page end to end', whole: true },

  /* A rung of the tier ladder. Improved (Улучшенный), Advanced (Продвинутый)
     and Legendary (Легендарный) are the same weapon at four tiers, and the
     ladder is how a person moves between them; it opens the other rung over
     this page rather than navigating, so no route draws it. It went
     unported for weeks behind a debt whose reason named only the
     add-to-list row. */
  {
    id: '#/i/q1 ~ another tier',
    route: '#/i/q1',
    why: 'the card a rung of the tier ladder opens',
    enter: async (d) => {
      await d.click('Улучшенный Палаш');
    }
  },

  /* What the app says after a copy - the toast, now that it exists. */
  {
    id: '#/i/ci1 ~ toast',
    route: '#/i/ci1',
    why: 'what the app says after a copy',
    enter: async (d) => {
      await d.more('Скопировать название');
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },

  /* The add-to-list menu, off `listMenuHTML` (`git show 23c00a6^:app.js`). A state that
     needs lists makes them on gm4's account in `enter`. */
  {
    id: '#/i/ci1 ~ many lists as gm4',
    route: '#/i/ci1',
    as: 'gm4',
    why: 'the search box, once there are more lists than fit without one',
    enter: async (d) => {
      await onAccount(d, EIGHT_SPECS, false);
      await d.click('В список');
      await d.type('Найти список', 'порту');
    },
    again: async (d) => {
      await d.click('Add to list');
      await d.type('Find a list', 'порту');
    }
  },
  {
    id: '#/i/ci1 ~ new list',
    route: '#/i/ci1',
    why: 'signed out: the sign-in prompt in the new-list slot - one line, «Войти» and «Отмена», no provider buttons',
    enter: async (d) => {
      await d.click('В список');
      await d.click('Новый список');
    },
    again: async (d) => {
      await d.click('Add to list');
      await d.click('New list');
    }
  },
  {
    id: '#/i/ci1 ~ new list as gm2',
    route: '#/i/ci1',
    as: 'gm2',
    why: "signed in: the inline form, focused, over gm2's account lists",
    enter: async (d) => {
      await d.settled();
      await d.click('В список');
      await d.click('Новый список');
    },
    again: async (d) => {
      await d.click('Add to list');
      await d.click('New list');
    }
  },
  {
    id: '#/i/ci1 ~ list menu as gm1',
    route: '#/i/ci1',
    as: 'gm1',
    why: "the menu «Списки»: gm1's lists holding the record first with a check («Лавка кузнеца», «Трофеи»), then the rest, each with its count in words; «Новый список» under a separator",
    enter: async (d) => {
      await d.settled();
      await d.click('В список');
    },
    again: (d) => d.click('Add to list')
  },
  {
    id: '#/i/ci1 ~ in several lists as gm4',
    route: '#/i/ci1',
    as: 'gm4',
    why: 'the three lists holding the record first, with a check; the heading, the search and «Новый список» pinned over the scrolling rows',
    enter: async (d) => {
      await onAccount(d, TWELVE_SPECS, false);
      await d.click('В список');
    },
    again: (d) => d.click('Add to list')
  },
  {
    id: '#/i/ci1 ~ new list from a search as gm2',
    route: '#/i/ci1',
    as: 'gm2',
    why: 'the new-list form started with the query nothing matched, over twelve account lists',
    enter: async (d) => {
      await onAccount(d, TWELVE_SPECS, false);
      await d.click('В список');
      await d.type('Найти список', 'Шкатулка');
      await d.click('Новый список');
    },
    again: async (d) => {
      await d.click('Add to list');
      await d.type('Find a list', 'Шкатулка');
      await d.click('New list');
    }
  },

  {
    id: '#/roll/std',
    route: '#/roll/std',
    why: 'Core rules: four results draw row faces from 601 px'
  },

  /* One source off, which halves the roll from four cards to two - so the OR
     grid changes layout as well as content, and the chip has to refuse to
     turn the last one off. */
  {
    id: '#/roll/std ~ one source',
    route: '#/roll/std',
    why: 'Core rules with Hope & Fear switched off',
    enter: async (d) => {
      await d.click('Hope & Fear');
    }
  },

  /* The help panel Core rules shipped without a state for. It is the one help
     text with markup inside a paragraph - four rarities in bold on their own
     lines - and it went out with the tags showing as words, because axe reads
     structure and the other suites never opened it. */
  {
    id: '#/roll/std ~ help',
    route: '#/roll/std',
    why: '«Где какая редкость»: the four placement lines of the book, each with a bold rarity',
    enter: async (d) => {
      await d.click('Где какая редкость');
    }
  },

  /* And one kind off, which is the other way to get to two cards - down the
     other axis, so the pair that is left is a different pair. */
  {
    id: '#/roll/std ~ items only',
    route: '#/roll/std',
    why: 'Core rules with consumables switched off',
    enter: async (d) => {
      await d.click('Расходники');
    }
  },
  {
    id: '#/roll/std ~ one result',
    route: '#/roll/std',
    why: 'Core rules with Hope & Fear and consumables off: one result, the tall face at most 380 px wide (R7)',
    enter: async (d) => {
      await d.click('Hope & Fear');
      await d.click('Расходники');
    }
  },
  { id: '#/roll/alt', route: '#/roll/alt', why: 'the alternate tables' },
  {
    id: '#/roll/alt ~ narrow',
    route: '#/roll/alt',
    width: 360,
    why: 'up to 760 px: the rarity select and the primary on one row, the results line, the 96 px cards'
  },

  /* The roll pages up to 760 px: the settings behind «Настроить» and the rest of the page's
     controls in «Ещё»; the golden width draws the two panes. */
  {
    id: '#/roll/std ~ set up',
    route: '#/roll/std',
    width: 360,
    why: '«Настроить» open: the manual entry, the source and the type in a plate over the results',
    enter: async (d) => {
      await d.click('Настроить');
    }
  },
  {
    id: '#/roll/std ~ more',
    route: '#/roll/std',
    width: 360,
    why: '«Ещё» of the results line open: the copy of every option, the pin, the help',
    enter: (d) => d.openMore(),
    again: (d) => d.openMore()
  },
  {
    id: '#/roll/std ~ items only, set up',
    route: '#/roll/std',
    width: 360,
    why: 'consumables off and «Настроить» closed: the control is lit and names «Предметы»',
    enter: async (d) => {
      await d.click('Настроить');
      await d.click('Расходники');
      await d.click('Предметы');
    }
  },
  {
    id: '#/roll/std ~ card more',
    route: '#/roll/std',
    why: '«Ещё» of the first result open: the four copies',
    enter: (d) => d.openCardMore(),
    again: (d) => d.openCardMore()
  },
  {
    id: '#/roll/std ~ list menu as gm4',
    route: '#/roll/std',
    as: 'gm4',
    why: '«В список» of the first result open, with the account lists',
    enter: (d) => d.openCardList(),
    again: (d) => d.openCardList()
  },

  /* The critical-success box, which no route draws: the page opens on Hope 1
     and Fear 2, and stepping Hope up puts the two dice level. It carries the
     links into the tables and the offer of a rarity above this one, so it is
     the whole reason this mode is not just another roll. */
  {
    id: '#/roll/alt ~ crit',
    route: '#/roll/alt',
    why: 'the two dice agreeing, which is the offer of a whole rarity',
    enter: async (d) => {
      /* Up to 760 px the steppers are in «Настроить»: case 83 enters this state at 360. */
      const narrow = (await d.count('.reshead .morewrap')) > 0;
      if (narrow) await d.click('Настроить');
      await d.click('На единицу больше');
      if (narrow) await d.click('Настроить');
    }
  },

  /* The top of the ladder: the same box, with nothing to bump to. The chips
     also change every card, so this is the rarity picker as a state and not
     only as a row of names. */
  {
    id: '#/roll/alt ~ legendary crit',
    route: '#/roll/alt',
    why: 'a critical success with no rarity above it',
    enter: async (d) => {
      await d.click('Легендарная');
      await d.click('На единицу больше');
    }
  },

  /* One kind off, which halves the grid and renames what the crit box opens:
     with both kinds on the two links name their tables, with one they cannot
     be told apart and the label stays general. */
  {
    id: '#/roll/alt ~ crit, items only',
    route: '#/roll/alt',
    why: 'the crit box with a single table to open',
    enter: async (d) => {
      await d.click('Расходники');
      await d.click('На единицу больше');
    }
  },
  { id: '#/roll/voa', route: '#/roll/vault_of_ages', why: 'Vault of Ages' },
  {
    id: '#/roll/dv',
    route: '#/roll/dragons_vault',
    why: "a roll on Dragon's Vault, the tenth section"
  },
  {
    id: '#/roll/dv ~ help',
    route: '#/roll/dragons_vault',
    why: 'the help panel, unfolded: why the table has no die, and where the equipment half lives',
    enter: async (d) => {
      await d.click('Об этой книге');
    }
  },
  {
    id: '#/roll/arazo',
    route: '#/roll/arazos_artifacts',
    why: "a roll on Arazo's Artifacts, the eleventh section"
  },
  {
    id: '#/roll/arazo ~ help',
    route: '#/roll/arazos_artifacts',
    why: 'the help panel, unfolded: Destiny instead of a roll table, and the four versions of every piece of equipment',
    enter: async (d) => {
      await d.click('Об этой книге');
    }
  },
  { id: '#/roll/community', route: '#/roll/community_items', why: 'communities' },
  {
    id: '#/roll/wondrous ~ narrow',
    route: '#/roll/wondrous_environments',
    width: 360,
    why: 'one result up to 760 px: the 96 px card with the row under it'
  },

  /* The picker is the whole point of these two, and it is a state: the length
     of the roll, the die on the button and the card underneath all change with
     it, and the opening section shows none of that. Artifacts because it is the
     division that is not a tier, and the second community because picking one
     at all has to put the roll back to 1. */
  {
    id: '#/roll/voa ~ artifacts',
    route: '#/roll/vault_of_ages',
    why: 'a division of the book that is not a tier',
    enter: async (d) => {
      await d.part('Артефакты');
    }
  },
  {
    id: '#/roll/community ~ second',
    route: '#/roll/community_items',
    why: 'a community other than the one it opens on',
    enter: async (d) => {
      await d.part('Научное');
    }
  },

  /* Many Worlds Tavern rolls inside one realm's deck: each realm is a state, because the
     deck, the range and the card underneath change with it. Warrin' Warrens (21),
     Hornet Hold (11) and The Drome (17) are not a die, so their button picks at random. */
  {
    id: '#/roll/mwt',
    route: '#/roll/many_worlds_tavern',
    why: 'Many Worlds Tavern on its first realm, Sporopolis: the seven-chip supplements panel, «Мир» and a d20'
  },
  {
    id: '#/roll/mwt ~ wagerwood',
    route: '#/roll/many_worlds_tavern',
    why: 'the second realm, Wagerwood',
    enter: async (d) => {
      await d.part('Лес Пари');
    }
  },
  {
    id: '#/roll/mwt ~ warrens',
    route: '#/roll/many_worlds_tavern',
    why: "the third realm, Warrin' Warrens: 21 cards, the button picks 1-21 at random",
    enter: async (d) => {
      await d.part('Воюющие Норы');
    }
  },
  {
    id: '#/roll/mwt ~ godsvale',
    route: '#/roll/many_worlds_tavern',
    why: 'the fourth realm, Godsvale',
    enter: async (d) => {
      await d.part('Долина Богов');
    }
  },
  {
    id: '#/roll/mwt ~ hornet',
    route: '#/roll/many_worlds_tavern',
    why: 'the fifth realm, Hornet Hold: 11 cards, the button picks 1-11 at random',
    enter: async (d) => {
      await d.part('Оплот Шершней');
    }
  },
  {
    id: '#/roll/mwt ~ drome',
    route: '#/roll/many_worlds_tavern',
    why: 'the sixth realm, The Drome: 17 cards, the button picks 1-17 at random',
    enter: async (d) => {
      await d.part('Дром');
    }
  },
  {
    id: '#/roll/mwt ~ help',
    route: '#/roll/many_worlds_tavern',
    why: 'the help panel, unfolded: the six decks, the die, no domain cards and no rarity, one link per realm',
    enter: async (d) => {
      await d.click('Об этой книге');
    }
  },
  {
    id: '#/tables/wondrous',
    route: '#/tables/wondrous_environments',
    why: 'the first table with a filter: the column open, «Все» pressed, nothing picked'
  },
  {
    id: '#/tables/wondrous ~ filtered',
    route: '#/tables/wondrous_environments',
    why: 'a value picked, which narrows the table, writes the address and draws the count line',
    enter: async (d) => {
      /* Not "Equipment" - that word is also the equipment nav chip's, and a
         click by name finds the link before the column's own chip. */
      await d.click('Предметы');
    }
  },
  {
    id: '#/tables/wondrous ~ filter link',
    route: '#/tables/wondrous_environments/f_kind-item',
    why: 'arriving at a filter link: the value pressed in the column and named in the count line'
  },
  {
    id: '#/tables/wondrous ~ nothing found',
    route: '#/tables/wondrous_environments',
    why: 'a filter and a query together leaving nothing: the plate, the cause and the primary reset',
    enter: async (d) => {
      await d.click('Предметы');
      await d.type('Поиск по названию или описанию...', 'zzzqqqxx123');
    }
  },
  {
    id: '#/tables/dread',
    route: '#/tables/dread_gm_toolbox',
    why: 'the second table with a kind row, and the smallest'
  },
  { id: '#/tables', route: '#/tables', why: 'the table index, which is core_item' },
  {
    id: '#/tables/hnf_consumable',
    route: '#/tables/hope_and_fear_consumable',
    why: 'a second table: the chosen chip moves, and the sub-row changes'
  },
  {
    id: '#/tables ~ grid',
    route: '#/tables',
    why: 'the grid view, a different body entirely: two columns at 360, no kind badge on a one-kind table',
    enter: async (d) => {
      await d.click('Сетка');
    }
  },
  {
    id: '#/tables/eq_weapon ~ grid searched',
    route: '#/tables/eq_weapon',
    why: 'the grid view with «меч» typed: the tiles whose names hold the word, the word marked',
    enter: async (d) => {
      await d.click('Сетка');
      await d.type('Поиск', 'меч');
    }
  },
  {
    id: '#/tables ~ searched',
    route: '#/tables',
    why: 'a query that narrows the table',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'кольцо');
    }
  },
  {
    id: '#/tables ~ nothing found',
    route: '#/tables',
    why: 'the empty state, which no route draws',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'zzzqqqxx123');
    }
  },
  {
    id: '#/tables ~ a row opened',
    route: '#/tables',
    why: 'the record modal over a table',
    enter: async (d) => {
      await d.click('Кольцо Тишины');
    }
  },
  {
    id: '#/tables/eq_weapon ~ a row opened',
    route: '#/tables/eq_weapon',
    width: 360,
    why: 'the record dialog as a bottom sheet at 360: «Закрыть» first, the dossier, then the dock of four controls',
    enter: async (d) => {
      await d.click('Палаш');
    }
  },
  {
    id: '#/tables/eq_weapon ~ a row opened, actions menu',
    route: '#/tables/eq_weapon',
    width: 360,
    why: 'the same sheet with «Ещё» open above the dock, inside the card',
    enter: async (d) => {
      await d.click('Палаш');
      await d.openMore();
    },
    again: (d) => d.openMore()
  },
  {
    id: '#/tables ~ a row opened, list menu as gm4',
    route: '#/tables',
    as: 'gm4',
    why: 'the add-to-list menu inside the modal, and which side of the button it opens on',
    enter: async (d) => {
      await onAccount(d, TWO_SPECS, false);
      await d.click('Кольцо Тишины');
      await d.click('В список');
    },
    again: (d) => d.click('Add to list')
  },
  {
    id: '#/tables ~ a row opened, new list',
    route: '#/tables',
    // No lists: with two lists every card opens up and the divergence is
    // never reached. With none, Самоцвет Чутья
    // sits inside the 17px band at 1100 where the rewrite re-measures the
    // menu from its already-flipped side and sends it under the card's edge.
    why: "signed out: the sign-in prompt in the new-list slot of the modal's menu, and which side the menu keeps when it grows - the rewrite re-measured from the flipped side and sent it under the card's edge",
    enter: async (d) => {
      await d.click('Самоцвет Чутья');
      await d.click('В список');
      await d.click('Новый список');
    },
    again: async (d) => {
      await d.click('Add to list');
      await d.click('New list');
    }
  },
  {
    id: '#/tables ~ a row opened, removed from a list as gm4',
    route: '#/tables',
    as: 'gm4',
    why: 'the undo toast drawn inside the record modal after its card leaves a list, «Вернуть» focused',
    enter: async (d) => {
      await onAccount(d, RING_SPECS, false);
      await d.click('Кольцо Тишины');
      await d.click('В список');
      await d.click('Клад дракона');
    },
    /* a 7000ms toast; arrived at afresh per language - this file's header */
    timed: true
  },
  {
    id: '#/tables ~ a row opened, removing from a list as gm4',
    route: '#/tables',
    as: 'gm4',
    hold: 'rows:stall',
    why: 'the menu inside the modal after a press on «Клад дракона», which holds the ring and whose entries are not read yet: the chip pressed, busy and dimmed, no toast',
    enter: async (d) => {
      await onAccount(d, RING_SPECS, false);
      await d.click('Кольцо Тишины');
      await d.click('В список');
      await d.click('Клад дракона');
    }
  },
  {
    id: '#/tables ~ a row ticked',
    route: '#/tables',
    why: 'the bar, one row ticked',
    enter: async (d) => {
      await d.tick(ROW1_CI1);
    }
  },
  {
    id: '#/tables ~ bar menu as gm4',
    route: '#/tables',
    as: 'gm4',
    why: "the bar's own add-to-list menu, above it, right-aligned",
    enter: async (d) => {
      await onAccount(d, TWO_SPECS, false);
      await d.tick(ROW1_CI1);
      await d.tick(ROW2_CI2);
      await d.click('В список');
    },
    again: (d) => d.click('Add to list')
  },
  {
    id: '#/tables ~ selection copied',
    route: '#/tables',
    why: 'what the app says after copying the selection',
    enter: async (d) => {
      await d.tick(ROW1_CI1);
      await d.click('Скопировать текст');
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/tables ~ about this data',
    route: '#/tables',
    why: '«Об этих данных»: the three data notes, each with a bold lead, and the button named for them',
    enter: async (d) => {
      await d.click('Об этих данных');
    }
  },
  {
    id: '#/tables/eq_weapon ~ selecting',
    route: '#/tables/eq_weapon',
    why: '«Выбрать» pressed: the ticks and the bar with zero ticks, its actions off',
    enter: async (d) => {
      await d.click('Выбрать');
    }
  },
  {
    id: '#/tables/eq_weapon ~ two filters',
    route: '#/tables/eq_weapon/f_tier-1.range-melee',
    why: 'a two-group filter link: both chips pressed in the column and the count line «Ранг 1, Вплотную · Показано N из M»; also the first-screen row'
  },
  {
    id: '#/tables/eq_weapon ~ mid band',
    route: '#/tables/eq_weapon',
    width: 768,
    why: 'the 761-999 px band: the wide head with the labeled pin and the tabs, the filters behind «Фильтры»'
  },
  {
    id: '#/tables/eq_weapon ~ filter sheet',
    route: '#/tables/eq_weapon',
    width: 360,
    why: 'the filter sheet below 761 px: the head with «Закрыть», the rows with «Все» pressed, the foot',
    enter: async (d) => {
      await d.click('Фильтры');
    }
  },
  {
    id: '#/tables/eq_weapon ~ filter sheet, two filters',
    route: '#/tables/eq_weapon/f_tier-1.range-melee',
    width: 360,
    why: 'the sheet with two picks: «Фильтры · 2», the filter link in its head, «Показать N»',
    enter: async (d) => {
      await d.click('Фильтры · 2');
    }
  },
  {
    id: '#/tables/eq_weapon ~ filter sheet as gm1',
    route: '#/tables/eq_weapon',
    as: 'gm1',
    width: 360,
    why: 'own items held: the «Свои предметы» switch is the first row of the sheet',
    enter: async (d) => {
      await d.click('Фильтры');
    }
  },
  {
    id: '#/tables/eq_weapon ~ header hidden',
    route: '#/tables/eq_weapon',
    width: 360,
    why: 'the header out of sight after a scroll down: it stays in the tree and the tab order',
    enter: async (d) => {
      await d.scrollPage(800);
    }
  },
  {
    id: '#/tables/eq_weapon ~ table picker',
    route: '#/tables/eq_weapon',
    width: 360,
    why: 'the table picker sheet: the group chips and the tables of the group, «Оружие» current',
    enter: async (d) => {
      await d.click('Таблица: Оружие');
    }
  },
  {
    id: '#/tables/eq_weapon ~ more menu',
    route: '#/tables/eq_weapon',
    width: 360,
    why: '«Ещё» open: the table link, the pin and «Об этих данных»',
    enter: async (d) => {
      await d.click('Ещё');
    }
  },
  {
    id: '#/tables/eq_weapon ~ data notes from more',
    route: '#/tables/eq_weapon',
    width: 360,
    why: '«Об этих данных» opened from «Ещё»: the panel with «Закрыть» first, and «Ещё» open again with the item checked',
    enter: async (d) => {
      await d.click('Ещё');
      await d.click('Об этих данных');
      await d.click('Ещё');
    }
  },
  {
    id: '#/tables/eq_weapon',
    route: '#/tables/eq_weapon',
    why: 'the biggest table: four tier sections and the artifacts, the column open'
  },
  {
    id: '#/tables/eq_weapon/f_tier-A',
    route: '#/tables/eq_weapon/f_tier-A',
    why: 'the artifact chip on the equipment tier row, one row'
  },
  {
    id: '#/tables/eq_secondary',
    route: '#/tables/eq_secondary',
    why: 'a second kind, six facet groups'
  },
  {
    id: '#/tables/eq_armor',
    route: '#/tables/eq_armor',
    why: 'the third kind, three facet groups, the shortest'
  },
  {
    id: '#/tables/eq_weapon ~ filtered',
    route: '#/tables/eq_weapon',
    why: 'both branches of the chosen-value rule in the count line - "Ранг 1" and "Двуручное" - and a two-group address',
    enter: async (d) => {
      await d.click('1');
      await d.click('Двуручное');
    }
  },
  {
    id: '#/tables/eq_secondary ~ filter link',
    route: '#/tables/eq_secondary/f_cls-mag',
    why: 'arriving presses the chip in the column; the cls row reads "Класс", as on weapons'
  },
  {
    id: '#/tables/eq_secondary ~ searched',
    route: '#/tables/eq_secondary',
    why: 'the type word is part of the searched stat line',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'вторичное');
    }
  },
  {
    id: '#/tables/eq_armor ~ nothing found',
    route: '#/tables/eq_armor',
    why: 'the three-row column, a pressed chip, the empty plate with the cause and its own reset',
    enter: async (d) => {
      await d.click('Уникальные');
      await d.type('Поиск по названию или описанию...', 'zzzqqqxx123');
    }
  },
  {
    id: '#/tables/voa',
    route: '#/tables/vault_of_ages',
    why: 'a sectioned body: Vault of Ages by tier'
  },
  {
    id: '#/tables/dv',
    route: '#/tables/dragons_vault',
    why: "a plain body with a kind row, 145 rows: the tenth table's loot, then its equipment"
  },
  {
    id: '#/tables/arazo',
    route: '#/tables/arazos_artifacts',
    why: 'a plain body with a kind row, 78 rows in book order, four rungs per piece of equipment'
  },
  {
    id: '#/tables/mwt',
    route: '#/tables/many_worlds_tavern',
    why: 'a sectioned body: Many Worlds Tavern by realm, six realm headings, 109 rows'
  },
  {
    id: '#/tables/mwt ~ warrens picked',
    route: '#/tables/many_worlds_tavern',
    why: "the filter column with its kind and realm rows, Warrin' Warrens picked: 21 rows",
    enter: async (d) => {
      await d.click('Воюющие Норы');
    }
  },
  {
    id: '#/tables/mwt ~ warrens anchor',
    route: '#/tables/many_worlds_tavern/warrens',
    why: 'the realm section anchor'
  },
  {
    id: '#/tables/other_starting',
    route: '#/tables/other_starting',
    why: 'the plain starting-items subtable'
  },
  {
    id: '#/tables/other_frames',
    route: '#/tables/other_frames',
    why: 'the sectioned frame-items subtable'
  },
  {
    id: '#/tables/other_frames ~ two frames',
    route: '#/tables/other_frames',
    why: 'two frames picked in one row: values OR, and the second pick keeps the first',
    enter: async (d) => {
      await d.click('Пир зверей');
      await d.click('Колоссы Сухоземья');
    }
  },
  {
    id: '#/tables/other_frames ~ dark heart anchor',
    route: '#/tables/other_frames/dark_heart',
    why: 'the campaign-frame section anchor'
  },
  {
    id: '#/tables/frames',
    route: '#/tables/frames',
    why: 'legacy frame-items compatibility route'
  },
  {
    id: '#/tables/community',
    route: '#/tables/community_items',
    why: 'a sectioned body: communities'
  },
  { id: '#/tables/alt_item', route: '#/tables/alt_item', why: 'the alternate items table' },
  {
    id: '#/tables/alt_consumable',
    route: '#/tables/alt_consumable',
    why: 'the alternate consumables table'
  },

  /* The row/section anchor - `#/tables/<table>/<key>` - never had a state at
     all, on any table, so the mechanism went unwired without anything
     noticing. One of each: a section on a newly added table, and a row on
     an already-shipped one, which is the only way the fix on the earlier
     table gets verified. */
  {
    id: '#/tables/voa ~ section anchor',
    route: '#/tables/vault_of_ages/tA',
    why: 'arriving at a section link scrolls to and flashes it'
  },
  {
    id: '#/tables/core_item ~ row anchor',
    route: '#/tables/core_item/ci1',
    why: "arriving at a record's row link scrolls to and flashes it - an already-shipped table, not a new one"
  },

  /* `srcLabel`'s frame case returned the raw id rather than the frame's own
     name until this batch - `#/i/f1` is the first state to open a frame
     record at all, which is why nothing had caught it. */
  {
    id: '#/i/f1',
    route: '#/i/f1',
    why: 'a frame-equipment record, catching the source-badge fix'
  },

  /* A tag and a table path are two different things. Neither shape had a
     state before, which is why the human found both defects on the published
     site rather than in a golden. */
  {
    id: '#/i/cm1',
    route: '#/i/cm1',
    why: "a community record - the one table path whose leaf is the record's own community"
  },
  {
    id: '#/i/voa2_a1',
    route: '#/i/voa2_a1',
    why: 'an artifact - the tier word belongs in the path line, and no state opened one'
  },

  /* Dragon's Vault's own new mechanics: a craft chain that runs through a
     record (Frostwyrd), a weapon the book prints both One- and Two-Handed
     (Gryphon Hammer), a weapon with a `d0` blade and no die glyph
     (Spellblade), the set line a record with company draws, and an adversary
     feature an item grants, as a referenced card (Nightshroud). */
  {
    id: '#/i/dve25',
    route: '#/i/dve25',
    why: 'a craft chain in both directions'
  },
  {
    id: '#/i/dve66',
    route: '#/i/dve66',
    why: 'an armor record with a referenced adversary feature, folded'
  },
  {
    id: '#/i/dve30',
    route: '#/i/dve30',
    why: 'a weapon the book prints both One- and Two-Handed'
  },
  {
    id: '#/i/dve50',
    route: '#/i/dve50',
    why: "a weapon that uses its wielder's Spellcast trait"
  },
  {
    id: '#/i/dve19',
    route: '#/i/dve19',
    why: "the set line and the set's shared bonus: every member listed, the record itself inert"
  },
  {
    id: '#/i/dve19 ~ saved twice as gm1',
    route: '#/i/dve19',
    as: 'gm1',
    why: '«Сохранить себе» on a catalog record pressed twice in «Ещё»: the toast «Предмет «Уголёк (2)» сохранён в «Мои предметы»» with «Изменить»; the set line «Уголёк, Искра» names no copy',
    enter: async (d) => {
      await d.more('Сохранить себе');
      for (let i = 0; i < 40 && !(await d.text()).includes('«Уголёк» сохранён'); i++)
        await d.settle();
      await d.more('Сохранить себе');
      for (let i = 0; i < 40 && !(await d.text()).includes('«Уголёк (2)» сохранён'); i++)
        await d.settle();
    },
    /* a 7000ms action toast; arrived at afresh per language - see this file's header */
    timed: true
  },

  /* Vault of Ages Volume 4: the first artifact with a stat block, a
     three-member set, a referenced adversary card, a consumable artifact. */
  {
    id: '#/i/voa4_a3',
    route: '#/i/voa4_a3',
    why: "an artifact weapon: the Artifact badge, the stat line's artifact word, the strip, roll 9"
  },
  {
    id: '#/i/voa4_t3d',
    route: '#/i/voa4_t3d',
    why: 'a three-member set: the set line with two links, the shared bonus'
  },
  {
    id: '#/i/voa4_t1b',
    route: '#/i/voa4_t1b',
    why: 'a weapon with a referenced adversary card'
  },
  {
    id: '#/i/voa4_a2',
    route: '#/i/voa4_a2',
    why: 'a consumable artifact'
  },

  /* Many Worlds Tavern: a weapon with no printed trait, and the one new rulebook card. */
  {
    id: '#/i/mw47',
    route: '#/i/mw47',
    why: 'a weapon of any trait: «Любая» on the stat line, the realm on the badge and the path'
  },
  {
    id: '#/i/mw9 ~ ref open',
    route: '#/i/mw9',
    why: 'the referenced ancestry feature «Сеть фангрилов», unfolded',
    enter: async (d) => {
      await d.click('Сеть фангрилов');
    }
  },

  /* The lists index (docs/specs/FEATURES.md, "Lists"). */
  {
    id: '#/lists',
    route: '#/lists',
    why: 'signed out: the head with the pin and no primary, the plate with the kind glyph and the sign-in prompt'
  },
  {
    id: '#/lists as gm1',
    route: '#/lists',
    as: 'gm1',
    why: "the head with the pin, «Импорт из файла» and «Новый список»; «3 списка из 50» and «Выбрать»; gm1's three cards with «N позиций · изменён N назад» and a «Ещё: <name>» each; no group heading",
    enter: async (d) => {
      await d.settled();
    }
  },
  {
    id: '#/lists ~ load failed',
    route: '#/lists',
    why: 'signed in with no network: the head with «Новый список», the read failed and «Повторить»',
    enter: async (d) => {
      await d.fake('setOffline', true);
      await d.fake('auth.signIn', 'google');
      await d.settle();
    }
  },
  {
    id: '#/lists ~ empty as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'an account with no list: «0 списков из 50», the plate «Списков пока нет» with its hint and «Открыть таблицы»; no «Выбрать», no search',
    enter: async (d) => {
      await d.settled();
    }
  },
  {
    id: '#/lists ~ more as gm1',
    route: '#/lists',
    as: 'gm1',
    width: 360,
    why: 'the head «Ещё» up to 760 px: «Импорт из файла» and «Открывать при запуске»',
    enter: async (d) => {
      await waitCards(d);
      await d.openMore(HEAD_MORE);
    },
    again: reopen(HEAD_MORE)
  },
  {
    id: '#/lists ~ new list as gm1',
    route: '#/lists',
    as: 'gm1',
    why: '«Новый список» pressed: the panel under the head with «Название списка», the empty field focused, «Создать» and «Отмена»',
    enter: async (d) => {
      await waitCards(d);
      await d.click('Новый список');
    }
  },
  {
    id: '#/lists ~ created as gm2',
    route: '#/lists',
    as: 'gm2',
    why: 'the new account list first, «0 позиций · изменён только что», the field closed, the focus on «Новый список», the toast',
    enter: async (d) => {
      await waitCards(d);
      await createList(d, 'Тайник');
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/lists ~ not saved as gm2',
    route: '#/lists',
    as: 'gm2',
    why: 'a create with no network: the new card first, and the count line ends «· Не сохранено» in the danger color and «Повторить»',
    enter: async (d) => {
      for (let i = 0; i < 40 && !(await d.text()).includes('1 список из 50'); i++)
        await d.settle();
      await d.fake('setOffline', true);
      await createList(d, 'Тайник');
      /* A hidden tab sends the buffer at once, and it fails; the index draws no
         `[data-saving]` for `writesSettled()` to wait on. */
      await d.hidden();
      for (let i = 0; i < 40 && !(await d.text()).includes('Не сохранено'); i++)
        await d.settle();
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/lists ~ list limit as gm2',
    route: '#/lists',
    as: 'gm2',
    why: 'at 50 of 50 the press on «Новый список»: the toast «Достигнут предел списков в аккаунте: 50...», the field closed, the count «50 списков из 50» in red, 24 cards and «Показать ещё (26)»',
    enter: async (d) => {
      await onAccount(d, FORTY_NINE_SPECS, false);
      for (let i = 0; i < 40 && !(await d.text()).includes('50 списков из 50'); i++)
        await d.settle();
      await d.click('Новый список');
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/lists ~ many lists as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'the search row «Найти список» with the count and «Выбрать» last, 24 cards and «Показать ещё (6)»',
    enter: async (d) => {
      await onAccount(d, THIRTY_SPECS, false);
    }
  },
  {
    id: '#/lists ~ shown more as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'all 30 cards after one press, and no button',
    enter: async (d) => {
      await onAccount(d, THIRTY_SPECS, false);
      await d.click('Показать ещё (6)');
    }
  },
  {
    id: '#/lists ~ filtered as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'the two cards whose name holds «порт», and no button',
    enter: async (d) => {
      await onAccount(d, THIRTY_SPECS, false);
      await d.type('Найти список', 'порт');
    }
  },
  {
    id: '#/lists ~ nothing found as gm4',
    route: '#/lists',
    as: 'gm4',
    why: '«Ничего не найдено» in place of the grid',
    enter: async (d) => {
      await onAccount(d, THIRTY_SPECS, false);
      await d.type('Найти список', 'zzz');
    }
  },
  {
    id: '#/lists ~ requests as gm1',
    route: '#/lists',
    as: 'gm1',
    why: 'two purchase requests on «Лавка кузнеца», one per link: the neutral chip «Новое в списке (2)» in its card and in its link name; no chip on the other cards; the toast «Новых запросов по списку «Лавка кузнеца»: 2» with «Открыть»; the tab title «(2) Мои списки - ...»',
    enter: async (d) => {
      await twoRequests(d);
      for (let i = 0; i < 40 && !(await d.count('.listcard-new')); i++) await d.settle();
    },
    /* a 7000ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/roll/std ~ request arrived as gm1',
    route: '#/roll/std',
    as: 'gm1',
    why: 'two purchase requests on «Лавка кузнеца» arrive on another page: the gold action toast «Новых запросов по списку «Лавка кузнеца»: 2» with «Открыть» at the bottom; the tab title «(2) Обычные правила - ...»; the page itself unchanged',
    enter: async (d) => {
      await twoRequests(d);
      for (let i = 0; i < 40 && !(await d.count('.toast.act')); i++) await d.settle();
    },
    /* a 7000ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/lists ~ card menu as gm1',
    route: '#/lists',
    as: 'gm1',
    why: "the first card's «Ещё: Пустой список» open: «Открыть», «Скачать JSON», a separator and «Удалить список»",
    enter: async (d) => {
      await waitCards(d);
      await d.openMore(CARD_MORE);
    },
    again: reopen(CARD_MORE)
  },
  {
    id: '#/lists ~ selecting as gm1',
    route: '#/lists',
    as: 'gm1',
    why: '«Выбрать» pressed: a pick box on each card and no «Ещё»; the bar «Все» focused, «Выбрано: 0», «Скачать JSON (0)» and «Удалить (0)» off, «Снять выделение» last',
    enter: async (d) => {
      await waitCards(d);
      await d.click('Выбрать');
    }
  },
  {
    id: '#/lists ~ lists selected as gm1',
    route: '#/lists',
    as: 'gm1',
    why: '«Пустой список» and «Трофеи» ticked: the bar «Выбрано: 2» with «Скачать JSON (2)» and «Удалить (2)», «Все» mixed, the two cards neutral with a lit border',
    enter: tickTwo
  },
  {
    id: '#/lists ~ import panel as gm1',
    route: '#/lists',
    as: 'gm1',
    why: '«Импорт из файла» pressed and expanded: the panel under the head with «Импорт из файла JSON», «Выбрать файл...» and the hint linking the schema and llms.txt',
    enter: importOpen
  },
  {
    id: '#/lists ~ import preview as gm1',
    route: '#/lists',
    as: 'gm1',
    why: 'unknown-id.json chosen: «Списков: 2, позиций: 3. Пропущено позиций: 2.», the report by list - «1. Лавка кузнеца» with the name note and the closed fold «Пропущено: 2», «2. Пустой список» «без позиций» with the name note - then «Импортировать (2)» and «Отмена»',
    enter: async (d) => {
      await importOpen(d);
      await d.upload(IMPORT('unknown-id.json'));
      for (let i = 0; i < 40 && !(await d.text()).includes('Пропущено позиций'); i++)
        await d.settle();
    }
  },
  {
    id: '#/lists ~ import preview v2 as gm2',
    route: '#/lists',
    as: 'gm2',
    why: 'example-v2.json chosen in an account with no homebrew: «Списков: 1, позиций: 3.» and «Своих предметов, которых нет в аккаунте: 2 - они станут вашими копиями в «Мои предметы».», then «Импортировать (1)» and «Отмена»',
    enter: async (d) => {
      await importOpen(d);
      await d.upload(IMPORT('example-v2.json'));
      for (let i = 0; i < 40 && !(await d.text()).includes('Своих предметов, которых'); i++)
        await d.settle();
    }
  },
  {
    id: '#/lists ~ import preview by keys as gm1',
    route: '#/lists',
    as: 'gm1',
    why: 'keys-only-v2.json chosen: «Списков: 2, позиций: 3. Пропущено позиций: 4.», «Своих предметов, которых нет в аккаунте: 1 - ...», block 1 «2 позиции будут импортированы» and block 2 «1 позиция будет импортирована», each with a closed «Пропущено: 2», then «Импортировать (2)» and «Отмена»',
    enter: async (d) => {
      await importOpen(d);
      await d.upload(IMPORT('keys-only-v2.json'));
      for (let i = 0; i < 40 && !(await d.text()).includes('Пропущено позиций'); i++)
        await d.settle();
    }
  },
  {
    id: '#/lists ~ import refused as gm1',
    route: '#/lists',
    as: 'gm1',
    why: 'errors.json chosen: the alert «В файле ошибки - ничего не импортировано...», the block «1. <the name cut to 40>...» with four lines, each with its path, and «Отмена» only',
    enter: async (d) => {
      await importOpen(d);
      await d.upload(IMPORT('errors.json'));
      for (let i = 0; i < 40 && !(await d.count('.errs')); i++) await d.settle();
    }
  },
  {
    id: '#/lists ~ imported as gm1',
    route: '#/lists',
    as: 'gm1',
    why: 'example.json imported: the panel closed and its toggle focused, the new «Лавка кузнеца» first with «3 позиции · изменён только что», the toast «Импортировано списков: 1»',
    enter: async (d) => {
      await importOpen(d);
      await d.upload(IMPORT('example.json'));
      for (let i = 0; i < 40 && !(await d.text()).includes('Импортировать (1)'); i++)
        await d.settle();
      await d.click('Импортировать (1)');
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/lists ~ lists deleted as gm1',
    route: '#/lists',
    as: 'gm1',
    why: '«Удалить (2)» over «Пустой список» and «Трофеи», the confirm accepted: «Лавка кузнеца» alone, the mode still on with «Выбрано: 0» and «Все» focused, the toast «Удалено списков: 2» with no «Вернуть»',
    enter: async (d) => {
      await tickTwo(d);
      await d.click('Удалить (2)');
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },

  /* An account list's page: the address kept, no link buttons, no notice,
     and the save status in the sub. */
  {
    id: SHOP + ' as gm1',
    route: SHOP,
    as: 'gm1',
    why: '«Лавка кузнеца»: «10 позиций из 100 · Сохранено», «Поделиться» folded in place of «Ссылка игрокам»/«Ссылка себе», «Скачать JSON» after «Скопировать текст», no storage notice, coins, both list notes open; the own axe last, 800 монет, tagged «Мастерская Ольхи (HB)»; the row «Добавить свой предмет» folded after it'
  },
  {
    id: SHOP + ' ~ own item as gm1',
    route: SHOP,
    as: 'gm1',
    why: 'the row «Добавить свой предмет» after the entries pressed and expanded: the panel «Свой предмет в этот список» under it with «Название» *, «Описание», «В список», «Отмена» and the note on «Мои предметы»',
    enter: async (d) => {
      await d.click('Добавить свой предмет');
    }
  },
  {
    id: SHOP + ' ~ own item added as gm1',
    route: SHOP,
    as: 'gm1',
    why: 'a name typed and «Добавить в список» pressed: «11 позиций из 100», the new plain item last, right above the row, the fields empty, the toast «Предмет «Фляга контрабандиста» создан и добавлен в список» with the link «Изменить»',
    enter: async (d) => {
      await d.click('Добавить свой предмет');
      await d.type('Название', 'Фляга контрабандиста');
      await d.press('Добавить в список');
      for (let i = 0; i < 40 && !(await d.text()).includes('11 позиций'); i++) await d.settle();
    },
    /* a 7000ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: SHOP + ' ~ own item refused as gm1',
    route: SHOP,
    as: 'gm1',
    why: '«Добавить в список» with no name: «Введите название.» under «Название», the field aria-invalid, nothing made',
    enter: async (d) => {
      await d.click('Добавить свой предмет');
      await d.press('Добавить в список');
    }
  },
  {
    id: EMPTY_LIST + ' as gm1',
    route: EMPTY_LIST,
    as: 'gm1',
    why: '«Пустой список»: «0 позиций из 100 · Сохранено», the empty hint ending «Свой предмет можно создать здесь же, кнопкой ниже.», then the row «Добавить свой предмет» folded'
  },
  {
    id: GM2_LIST + ' as gm2',
    route: GM2_LIST,
    as: 'gm2',
    why: "gm2's list: «2 позиции», the panel «Новое в списке (2)» folded to its head with «Открыть»; the Scepter, then a link to gm1's axe tagged «Мастерская Ольхи (HB)», drawn as any row; no «Свой предмет» among the actions, the row «Добавить свой предмет» after the entries"
  },
  {
    id: GM2_LIST + ' ~ notices open as gm2',
    route: GM2_LIST,
    as: 'gm2',
    why: "the panel opened: gm1's two notices, each «новое»: «Автор изменил «Топор Тлеющих Углей».» with «Открыть», and the 120-code-point deleted name wrapped, each with «Скрыть», then «Скрыть изменения»; «Свернуть» on the head",
    enter: async (d) => {
      await openRequests(d);
    }
  },
  {
    id: GM2_LIST + ' ~ unknown records as gm2',
    route: GM2_LIST,
    as: 'gm2',
    hold: 'items:fail',
    why: "gm2's list with the linked records unread: the axe's row draws the key «hb_emberaxeaaaaaaaa» in bold and «Предмет не загружен» under it, with its tick, position, quantity, price, note, eye and cross; the sub still counts «2 позиции»"
  },
  {
    id: GM2_LIST + ' ~ one notice as gm2',
    route: GM2_LIST,
    as: 'gm2',
    why: "the first notice's «Скрыть» pressed: the panel «Новое в списке (1)» with the 120-code-point deleted name and its own «Скрыть» only, no «Скрыть изменения»",
    enter: async (d) => {
      await openRequests(d);
      await d.click('Скрыть изменение «Топор Тлеющих Углей»');
      for (let i = 0; i < 40 && (await d.text()).includes('Скрыть изменения'); i++)
        await d.settle();
    }
  },
  {
    id: GM2_LIST + ' ~ axe opened as gm2',
    route: GM2_LIST,
    as: 'gm2',
    why: "gm1's axe opened from its row: the dialog with «В список», «Поделиться», «Печать» and «Ещё», the relink line now inside «Ещё»",
    enter: async (d) => {
      await d.click('Лезвие тлеет');
    }
  },
  {
    id: GM2_LIST + ' ~ axe saved as gm2',
    route: GM2_LIST,
    as: 'gm2',
    why: "«Сохранить себе» pressed in the axe's modal: the row moves to the copy's new key, so the modal closes and the list page draws the row of the copy, with the toast «Предмет «Топор Тлеющих Углей» сохранён в «Мои предметы», строки ваших списков ведут на копию» and its «Изменить» (app/src/state/app.test.ts reads the relinked row)",
    enter: async (d) => {
      await d.click('Лезвие тлеет');
      await d.more('Сохранить себе');
      for (let i = 0; i < 40 && !(await d.text()).includes('ведут на копию'); i++)
        await d.settle();
    },
    /* a 7000ms action toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/lists ~ changes as gm2',
    route: '#/lists',
    as: 'gm2',
    why: "gm2's index: the card of «Список второго ГМа» says «2 изменения» in gold under its meta line, in its link's name too"
  },
  /* `#/h/<uuid>`: one homebrew item for everyone, with the author's relation lines. */
  {
    id: ITEM_H,
    route: ITEM_H,
    why: 'signed out: «Скатка следопыта», the sub «Предмет другого игрока · Хоумбрю», «Получается из» «Скатка путника», «Улучшается до» «Скатка стража», «Комплект» «Походный плед», «Подушка из мха», «Скатка следопыта» (current), the bonus «Сон под звёздами»; the action row with no «Изменить» and no table link'
  },
  {
    id: ITEM_H + ' as gm2',
    route: ITEM_H,
    as: 'gm2',
    why: 'another player signed in: the same three relation lines and the bonus, every link an item address'
  },
  {
    id: ITEM_H + ' as gm3',
    route: ITEM_H,
    as: 'gm3',
    why: 'the author: the same three relation lines and the bonus as a reader sees them; the sub «Хоумбрю» with «показать в таблице», «Печать» and «Изменить», no «Предмет другого игрока», no «Сохранить себе»'
  },
  {
    id: ITEM_H + ' ~ sign-in prompt',
    route: ITEM_H,
    why: 'signed out, «Сохранить себе» pressed: the boxed «Войдите, и копия предмета сохранится в «Мои предметы».» with «Войти»',
    enter: async (d) => {
      await d.more('Сохранить себе');
    }
  },
  {
    id: ITEM_H + ' ~ saved as gm2',
    route: ITEM_H,
    as: 'gm2',
    why: '«Сохранить себе» pressed in «Ещё»: the toast «Предмет «Скатка следопыта» сохранён в «Мои предметы»» with «Изменить»',
    enter: async (d) => {
      await d.more('Сохранить себе');
      for (let i = 0; i < 40 && !(await d.text()).includes('сохранён в «Мои'); i++)
        await d.settle();
    },
    /* a 7000ms action toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: ITEM_LONG + ' as gm2',
    route: ITEM_LONG,
    as: 'gm2',
    why: "gm3's item at the 120-code-point name, wrapped in the heading; «Получается из» «Первоклассный Спальный Мешок», a catalog record"
  },
  {
    id: ITEM_H + ' ~ read failed',
    route: ITEM_H,
    hold: 'item:fail',
    why: 'the read of the item failed: the title «Предмет не загрузился», the sentence and the primary «Повторить»'
  },
  {
    id: '#/h/' + HB_AXE_ID + ' ~ actions menu as gm2',
    route: '#/h/' + HB_AXE_ID,
    as: 'gm2',
    why: "gm1's axe, which gm2's list links: «Ещё» open, «Сохранить себе» with the relink line as its second line",
    enter: (d) => d.openMore(),
    again: (d) => d.openMore()
  },
  {
    id: ITEM_NONE,
    route: ITEM_NONE,
    why: 'an id no item has, after the read: «Предмета по этому адресу нет», the address in the sentence, «Найти предмет» and «Открыть таблицы»'
  },
  {
    id: SHOP + ' ~ share as gm1',
    route: SHOP,
    as: 'gm1',
    why: '«Поделиться» pressed and expanded: the panel with both seed links, «Скопировать» and «Удалить ссылку» in each row, and the hint',
    enter: async (d) => {
      await d.click('Поделиться');
    }
  },
  {
    id: SHOP + ' ~ share deleted as gm1',
    route: SHOP,
    as: 'gm1',
    why: 'the GM row after «Удалить ссылку»: «Ссылка удалена» and «Создать ссылку» alone and focused; the players row unchanged; the toast',
    enter: async (d) => {
      await d.click('Поделиться');
      await d.click('Удалить ссылку', 1);
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: SHOP + ' ~ requests as gm1',
    route: SHOP,
    as: 'gm1',
    why: 'the requests panel folded at the top of the rows column: «Новое в списке (2)» and «Открыть»; the toast «Новых запросов по списку «Лавка кузнеца»: 2» with «Показать»',
    enter: async (d) => {
      await twoRequests(d);
      for (let i = 0; i < 40 && !(await d.text()).includes('Новое в списке (2)'); i++)
        await d.settle();
    },
    /* a 7000ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: SHOP + ' ~ requests open as gm1',
    route: SHOP,
    as: 'gm1',
    why: "the requests panel opened: the GM link's request first, its columns «Было», «Возьмут», «Станет», «Цена» (cc1 5, 5, 0, 180 зол. with «Просили 9, в списке 5: возьмут 5» in the danger color; q1 1, 1, 0, «без цены»; «Итого: 180 зол. · 1 позиция без цены»), then the players' (ci1 2, 1, 1, 150 зол.; cc1 5, 3, 2, 60 зол.; «Итого: 210 зол.»), «Принять» and «Отклонить» under each; «Свернуть» on the head",
    enter: async (d) => {
      await twoRequests(d);
      await openRequests(d);
      /* A drawn request is read at once in a visible tab; wait for that read. */
      for (let i = 0; i < 40 && !(await d.text()).includes('истечёт через'); i++)
        await d.settle();
    },
    /* a 7000ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: SHOP + ' ~ requests loading as gm1',
    route: SHOP,
    as: 'gm1',
    hold: 'lines:stall',
    why: 'the requests read whose lines never answer: the small «Загружаем...» line in the panel slot after the action row, no panel; the page otherwise as «~ requests as gm1»; the toast «Новых запросов по списку «Лавка кузнеца»: 2» with «Показать» (the requests arrived on the index); the tab title «(2) Лавка кузнеца - ...» (unread: no lines drawn)',
    enter: async (d) => {
      /* A request that arrives on an open list page draws with no loading line: they arrive
         on the index, and the list page opened then reads their lines. */
      await requestsOnIndex(d);
      for (let i = 0; i < 40 && !(await d.text()).includes('Загружаем...'); i++)
        await d.settle();
    },
    /* a 7000ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: SHOP + ' ~ requests failed as gm1',
    route: SHOP,
    as: 'gm1',
    hold: 'lines:fail',
    why: 'the requests read whose lines fail: «Не получилось загрузить запросы.» in the danger color and a small «Повторить» in the panel slot, no panel; the toast «Новых запросов по списку «Лавка кузнеца»: 2» with «Показать» (the requests arrived on the index); the tab title «(2) Лавка кузнеца - ...» (unread: no lines drawn)',
    enter: async (d) => {
      await requestsOnIndex(d);
      for (
        let i = 0;
        i < 40 && !(await d.text()).includes('Не получилось загрузить запросы.');
        i++
      )
        await d.settle();
    },
    /* a 7000ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: SHOP + ' ~ details failed as gm1',
    route: SHOP,
    as: 'gm1',
    hold: 'rows:fail',
    why: "the list's entries read fails after the account read: the heading «Список не загрузился», «Не получилось загрузить списки аккаунта.» and a primary «Повторить»; no sub, no actions, no rows",
    enter: async (d) => {
      for (
        let i = 0;
        i < 40 && !(await d.text()).includes('Не получилось загрузить списки аккаунта.');
        i++
      )
        await d.settle();
    }
  },
  {
    id: SHOP + ' ~ many requests as gm1',
    route: SHOP,
    as: 'gm1',
    why: '«Новое в списке (4)»: three requests drawn, the newest first with its first five lines and «и ещё 2 позиции» under them, then «и ещё 1 запрос» after the third; each fold a bare button with a caret; no «истечёт»: the list is read only once every pending request is drawn; the toast «Новых запросов по списку «Лавка кузнеца»: 4» with «Показать»; the tab title «(4) Лавка кузнеца - ...» (unread: the fold is closed)',
    enter: async (d) => {
      await manyRequests(d);
      for (let i = 0; i < 40 && !(await d.text()).includes('Новое в списке (4)'); i++)
        await d.settle();
      await openRequests(d);
    },
    /* a 7000ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: SHOP + ' ~ short as gm1',
    route: SHOP,
    as: 'gm1',
    why: "«Принять» on the GM link's over-stock request: the alert «Не хватает: Зелье Быстрого Шага - просят 9, есть 5. Ничего не списано.», «Принять доступное» in place of «Принять»; nothing changed in the list; the toast «Новых запросов по списку «Лавка кузнеца»: 2» with «Показать» (the refusal is the panel's alert line, not a toast)",
    enter: async (d) => {
      await twoRequests(d);
      for (let i = 0; i < 40 && !(await d.text()).includes('Новое в списке (2)'); i++)
        await d.settle();
      await openRequests(d);
      await d.click('Принять');
      for (let i = 0; i < 40 && !(await d.count('.shortmsg')); i++) await d.settle();
    },
    /* a 7000ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: SHOP + ' ~ decided as gm1',
    route: SHOP,
    as: 'gm1',
    why: "«Отклонить» on the GM link's request, the fold opened: «Новое в списке (1)» with the players' request, «Решённые в этот раз (1)» expanded with «По ссылке для мастера · только что · отклонён», «Зелье Быстрого Шага ×9» and «Палаш ×1», and «Скрыть» at the fold row's end; the toast «Запрос отклонён», which replaced the new-request toast",
    enter: async (d) => {
      await twoRequests(d);
      for (let i = 0; i < 40 && !(await d.text()).includes('Новое в списке (2)'); i++)
        await d.settle();
      await openRequests(d);
      await d.click('Отклонить');
      for (let i = 0; i < 40 && !(await d.text()).includes('Решённые в этот раз (1)'); i++)
        await d.settle();
      await d.click('Решённые в этот раз (1)');
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: TROPHIES + ' ~ share as gm1',
    route: TROPHIES,
    as: 'gm1',
    why: 'a list with no link: both links made on open, #/s/share-token-1 for players and #/s/share-token-2 for the GM',
    enter: async (d) => {
      await d.click('Поделиться');
    }
  },
  {
    id: SHOP + ' ~ not saved as gm1',
    route: SHOP,
    as: 'gm1',
    why: 'an edit with no network: «Не сохранено» in the danger color and «Повторить» in the sub, the edit kept on screen, «Поделиться» folded',
    enter: async (d) => {
      await d.fake('setOffline', true);
      await d.click('Изменить');
      await d.type('Например: лавка закрыта до утра', 'Открыта с рассвета до полуночи.');
      /* The buffer is sent 2 s after the edit, and fails. */
      await d.writesSettled();
    }
  },
  {
    id: SHOP + ' ~ gm only as gm1',
    route: SHOP,
    as: 'gm1',
    why: 'the eye of «Брошюра по Истории Искусства» pressed: the crossed eye in the pressed look, the row dashed on the recessed ground with its art at 45%, no text on the row, and «10 позиций из 100 · только для мастера: 1 · Сохранено»',
    enter: async (d) => {
      await d.openMore(ROW_MORE('Брошюра по Истории Искусства'));
      await d.click('Скрыть от игроков');
      await d.writesSettled();
    }
  },
  {
    id: SHOP + ' ~ gm only ticked as gm1',
    route: SHOP,
    as: 'gm1',
    why: 'one GM-only row and one shown row ticked: «Скрыть от игроков (2)» before «Удалить (2)» in the bar',
    enter: async (d) => {
      await d.openMore(ROW_MORE('Брошюра по Истории Искусства'));
      await d.click('Скрыть от игроков');
      await d.writesSettled();
      await d.tick('Брошюра по Истории Искусства');
      await d.tick('Первоклассный Спальный Мешок');
    }
  },
  {
    id: SHOP + ' ~ gm only hidden as gm1',
    route: SHOP,
    as: 'gm1',
    why: '«Скрыть от игроков (2)» pressed: both ticked rows dashed, the ticks kept, «Показать игрокам (2)», «только для мастера: 2» in the sub, and the toast «Скрыто от игроков: 1» with «Вернуть»',
    enter: async (d) => {
      await d.openMore(ROW_MORE('Брошюра по Истории Искусства'));
      await d.click('Скрыть от игроков');
      await d.writesSettled();
      await d.tick('Брошюра по Истории Искусства');
      await d.tick('Первоклассный Спальный Мешок');
      await d.click('Скрыть от игроков (2)');
      await d.writesSettled();
    },
    /* a 7000ms action toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: SHOP,
    route: SHOP,
    why: 'signed out on an account address: the error page «Войдите, чтобы открыть список», its cause, «Войти» and «Открыть таблицы»'
  },
  {
    id: LIST_GONE + ' as gm1',
    route: LIST_GONE,
    as: 'gm1',
    why: 'signed in, an id the account does not hold: «Этого списка нет в вашем аккаунте», the cause with «Вы вошли как gm1@example.test.», «Мои списки» and «Открыть таблицы»',
    enter: async (d) => {
      await d.settled();
    }
  },

  /* The list page, off `renderOneList` and everything it draws
     (`git show 23c00a6^:app.js`), on gm4's list `LIST_A` made in `enter`. */
  {
    id: LIST_A + ' as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'the account list page from 761 px: the side column first (the title input, «7 позиций из 100» with the save status, «Поделиться», «Печать», «Бросить по списку» and «Ещё», no price switch, «Заметки»), then «Выбрать» on its own row, seven rows with no tick, each with «Заметка» and «Ещё: <name>», and «Добавить свой предмет» after them',
    enter: async (d) => {
      await onAccount(d, SEVEN_SPECS);
    }
  },
  {
    id: LIST_A + ' ~ noted as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'the price switch «Цены:» with «Как в книге» pressed and «Например: 7 мешков 5 горстей», the list notes read-only with «Изменить», row 2 priced and noted: both notes read-only in its row, «Заметка, заполнена», has-note',
    enter: async (d) => {
      await onAccount(d, NOTED_SPECS);
    }
  },
  {
    id: LIST_A + ' ~ roll panel as gm4',
    route: '#/lists',
    as: 'gm4',
    why: '«Бросить по списку» pressed: the panel «Бросок по списку» at the top of the rows column, the empty numbox, "Бросить 1-7", the hint',
    enter: async (d) => {
      await onAccount(d, SEVEN_SPECS);
      await d.click(NAME.ru.rollBy);
    }
  },
  {
    id: LIST_A + ' ~ rolled as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'result 2: the face of entry 2 with its row of actions, «2 шт. · по 7 мешков 5 горстей», both notes (the GM note in its dashed box), «Показать в списке», "Сбросить"',
    enter: async (d) => {
      await onAccount(d, NOTED_SPECS);
      await d.click(NAME.ru.rollBy);
      await d.click(NAME.ru.stepUp);
      await d.click(NAME.ru.stepUp);
    }
  },
  {
    id: LIST_A + ' ~ rolled, formatted as gm4',
    route: '#/lists',
    as: 'gm4',
    why: "result 2: the rolled entry's players' note draws bold and a numbered list, no markers",
    enter: async (d) => {
      await onAccount(d, FORMATTED_SPECS);
      await d.click(NAME.ru.rollBy);
      await d.click(NAME.ru.stepUp);
      await d.click(NAME.ru.stepUp);
    }
  },
  {
    id: LIST_A + ' ~ note preview as gm4',
    route: '#/lists',
    as: 'gm4',
    why: "the list's players' note with «Просмотр» pressed: the pane draws the italics and the list in place of the box; the format buttons disabled",
    enter: async (d) => {
      await onAccount(d, FORMATTED_SPECS);
      await d.click('Изменить');
      await d.click('Просмотр');
    }
  },
  {
    id: LIST_A + ' ~ removed as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'six rows, the undo toast',
    enter: async (d) => {
      await onAccount(d, SEVEN_SPECS);
      await d.openMore('.lrow-acts .morewrap > [aria-haspopup="menu"]');
      await d.click(NAME.ru.removeItem);
    },
    /* a 7000ms toast; arrived at afresh per language - this file's header */
    timed: true
  },
  {
    id: LIST_A + ' ~ note opened as gm4',
    route: '#/lists',
    as: 'gm4',
    why: "row 1's empty note area open: the switch with «Для игроков» pressed, «Видна по ссылке для игроков», the field with the focus, «Готово» and «Очистить»",
    enter: async (d) => {
      await onAccount(d, SEVEN_SPECS);
      await d.click(NAME.ru.note);
    }
  },
  {
    id: LIST_A + ' ~ note open as gm4',
    route: '#/lists',
    as: 'gm4',
    why: "row 2's note area open on the players' note: both options marked filled, «Светится в темноте» in the field, the caption, «Готово» and «Очистить»",
    enter: async (d) => {
      await onAccount(d, NOTED_SPECS);
      await d.click('Заметка, заполнена');
    }
  },
  {
    id: LIST_A + ' ~ note open, gm as gm4',
    route: '#/lists',
    as: 'gm4',
    why: "row 2's note area switched to «Только для мастера»: «Проклят» in the dashed field, «Игроки не видят»",
    enter: async (d) => {
      await onAccount(d, NOTED_SPECS);
      await d.click('Заметка, заполнена');
      await d.click('Только для мастера, заполнена');
    }
  },
  {
    id: LIST_A + ' ~ list notes open as gm4',
    route: '#/lists',
    as: 'gm4',
    why: "the side column's «Изменить» pressed: the list notes' area on the players' note «Лавка закрыта до утра», the GM option unmarked",
    enter: async (d) => {
      await onAccount(d, NOTED_SPECS);
      await d.click('Изменить');
    }
  },
  {
    id: LIST_A + ' ~ row menu as gm4',
    route: '#/lists',
    as: 'gm4',
    why: "row 1's «Ещё» from 761 px: «Скрыть от игроков», «Открыть карточку», a separator, «Убрать из списка»",
    enter: async (d) => {
      await onAccount(d, SEVEN_SPECS);
      await d.openMore(FIRST_ROW_MORE);
    },
    again: reopen(FIRST_ROW_MORE)
  },
  {
    id: LIST_A + ' ~ prices in coins as gm4',
    route: '#/lists',
    as: 'gm4',
    why: "«Монетами» pressed with its check: «Например: 750 зол.», the bar's and the roll's prices in coins",
    enter: async (d) => {
      await onAccount(d, NOTED_SPECS);
      await d.click(NAME.ru.moneyCoin);
    }
  },
  {
    id: LIST_A + ' ~ mid band as gm4',
    route: '#/lists',
    as: 'gm4',
    width: 768,
    why: 'from 761 to 999 px: the side content above the rows in one column, and each row with its quantity, price, «Заметка» and «Ещё» on a line under its text',
    enter: async (d) => {
      await onAccount(d, NOTED_SPECS);
    }
  },
  {
    id: LIST_A + ' ~ a row ticked as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'the bar on, the select-all box mixed and named "Выбрать все", "Выбрана 1 позиция", row 1 in the selected gold style, Цены with its caret, Скопировать, Удалить (1) - at 375 the 640px override drops the three to their own full-width block, Удалить (1) wrapping under the other two; no total, row 1 has no price',
    enter: async (d) => {
      await onAccount(d, SEVEN_SPECS);
      await d.tick(ROW1_CI1);
    }
  },
  {
    id: LIST_A + ' ~ prices as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'row 2 (750, bags) ticked: the take line inside the row, "Взять [2] из 2 = 1 сундук 5 мешков", "Выбрана 1 позиция · 2 шт." and "Итого: 1 сундук 5 мешков", Скопировать, the percentage row at -20 with "Сделать скидку" and the hint, the note, one guess row with its band, "Проставить эти цены", "Убрать цену (1)"',
    enter: async (d) => {
      await onAccount(d, NOTED_SPECS);
      await d.tick(ROW2_CI2);
      await d.click(NAME.ru.prices);
    }
  },
  {
    id: LIST_A + ' ~ prices, none priced as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'row 1 ticked: no percentage row, no clear button - the two `priced` branches off',
    enter: async (d) => {
      await onAccount(d, SEVEN_SPECS);
      await d.tick(ROW1_CI1);
      await d.click(NAME.ru.prices);
    }
  },
  {
    id: LIST_A + ' ~ prices set as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'the panel folded, row 1 priced and still ticked, so its total beside "Выбрана 1 позиция", the money picker now drawn (first price on the list), the toast "Цены проставлены (1)"',
    enter: async (d) => {
      await onAccount(d, SEVEN_SPECS);
      await d.tick(ROW1_CI1);
      await d.click(NAME.ru.prices);
      await d.click(NAME.ru.applyPrices);
    },
    /* a 7000ms toast (it carries an undo); arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: LIST_A + ' ~ picked as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'row 2 (x2, 750) ticked and taken at 1: the take line "Взять [1] из 2 = 7 мешков 5 горстей", "Выбрана 1 позиция" (pieces equal entries) and "Итого: 7 мешков 5 горстей", Цены, Скопировать, Удалить (1)',
    enter: async (d) => {
      await onAccount(d, NOTED_SPECS);
      await d.tick(ROW2_CI2);
      await d.type('Взять: ' + ROW2_CI2, '1');
    }
  },
  {
    id: LIST_A + ' ~ sold part as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'row 2 taken at 1 of 2 on its take line and deleted: seven rows, row 2 with an empty Кол-во and 750, the bar off, the toast "Убрано из списка (1)" with "Вернуть"',
    enter: async (d) => {
      await onAccount(d, NOTED_SPECS);
      await d.tick(ROW2_CI2);
      await d.type('Взять: ' + ROW2_CI2, '1');
      await d.click(NAME.ru.delOne);
    },
    /* a 7000ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: LIST_A + ' ~ batch deleted as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'six rows, the bar off, the toast "Убрано из списка (1)" with "Вернуть"',
    enter: async (d) => {
      await onAccount(d, SEVEN_SPECS);
      await d.tick(ROW1_CI1);
      await d.click(NAME.ru.delOne);
    },
    /* a 7000ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  /* The list page up to 760 px and the search row from 8 entries (docs/specs/FEATURES.md,
     "Lists"; DESIGN.md, "Compact row"). */
  {
    id: LIST_A + ' ~ compact as gm4',
    route: '#/lists',
    as: 'gm4',
    width: 360,
    why: 'up to 760 px: the name, «Выбрать» and «Ещё» on the title row, the meta line with «Заметки», seven folded rows, each one button with its number, name, kind and line, and the quantity field beside it',
    enter: async (d) => {
      await onAccount(d, SEVEN_SPECS);
    }
  },
  {
    id: LIST_A + ' ~ compact, row open as gm4',
    route: '#/lists',
    as: 'gm4',
    width: 360,
    why: 'row 2 unfolded: its tags and whole text, the position, the price, «Заметка, заполнена», «Ещё: Пронзительная Свирель» and both notes read-only',
    enter: async (d) => {
      await onAccount(d, NOTED_SPECS);
      await d.unfold(1);
    }
  },
  {
    id: LIST_A + ' ~ compact, noted as gm4',
    route: '#/lists',
    as: 'gm4',
    width: 360,
    why: 'row 2 noted and GM only: the note mark and the GM mark with their hidden names on its meta line, the dashed row; the list notes area open from «Заметки»',
    enter: async (d) => {
      await onAccount(d, NOTED_SPECS);
      await d.unfold(1);
      await d.openMore('.cfull .morewrap > [aria-haspopup="menu"]');
      await d.click('Скрыть от игроков');
      await d.click('Заметки');
    }
  },
  {
    id: LIST_A + ' ~ compact, selecting as gm4',
    route: '#/lists',
    as: 'gm4',
    width: 360,
    why: 'the selection mode: a tick column, row 2 ticked with «×2» in place of its field and its take line, row 1 ticked, the bar with «Все», the count, «Цены», «Ещё» and «Снять выделение»',
    enter: async (d) => {
      await onAccount(d, NOTED_SPECS);
      await d.tick(ROW1_CI1);
      await d.tick(ROW2_CI2);
    }
  },
  {
    id: LIST_A + ' ~ row more as gm4',
    route: '#/lists',
    as: 'gm4',
    width: 360,
    why: 'row 1 unfolded and its «Ещё» open: «Скрыть от игроков», «Открыть карточку», «Убрать из списка»',
    enter: async (d) => {
      await onAccount(d, SEVEN_SPECS);
      await d.unfold(0);
      await d.openMore('.cfull .morewrap > [aria-haspopup="menu"]');
    },
    again: reopen('.cfull .morewrap > [aria-haspopup="menu"]')
  },
  {
    id: LIST_A + ' ~ more as gm4',
    route: '#/lists',
    as: 'gm4',
    width: 360,
    why: 'the list «Ещё» up to 760 px: «Поделиться», «Печать», «Бросить по списку», «Цены: монетами», «Скопировать текст», «Скачать JSON», «Удалить список»',
    enter: async (d) => {
      await onAccount(d, NOTED_SPECS);
      await d.openMore('.lhead-acts .morewrap > [aria-haspopup="menu"]');
    },
    again: reopen('.lhead-acts .morewrap > [aria-haspopup="menu"]')
  },
  {
    id: LIST_A + ' ~ more wide as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'the list «Ещё» from 761 px: «Скопировать текст», «Скачать JSON», «Удалить список»',
    enter: async (d) => {
      await onAccount(d, SEVEN_SPECS);
      await d.openMore('.lacts .morewrap > [aria-haspopup="menu"]');
    },
    again: reopen('.lacts .morewrap > [aria-haspopup="menu"]')
  },
  {
    id: LIST_A + ' ~ many as gm4',
    route: '#/lists',
    as: 'gm4',
    why: '14 entries: the search row with the box, «Фильтры» and «Выбрать» last, the rows with their grips',
    enter: async (d) => {
      await onAccount(d, MANY_SPECS);
    }
  },
  {
    id: LIST_A + ' ~ filter sheet as gm4',
    route: '#/lists',
    as: 'gm4',
    width: 360,
    why: '14 entries and «Фильтры» pressed: the sheet with its rows, no filter link, «Сбросить» and «Показать 14»',
    enter: async (d) => {
      await onAccount(d, MANY_SPECS);
      await d.click('Фильтры');
    }
  },
  {
    id: LIST_A + ' ~ narrowed as gm4',
    route: '#/lists',
    as: 'gm4',
    why: '«Расходники» picked: «Показано 3 из 14» on the meta line, «Фильтры · 1», three rows with their true numbers, no grip',
    enter: async (d) => {
      await onAccount(d, MANY_SPECS);
      await d.click('Фильтры');
      await d.click('Расходники');
      await d.click('Закрыть');
    }
  },
  {
    id: LIST_A + ' ~ no match as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'a query that hits nothing: «Показано 0 из 14», «Ничего не найдено» and «Сбросить всё»',
    enter: async (d) => {
      await onAccount(d, MANY_SPECS);
      await d.type('Поиск по названию или описанию...', 'жжжж');
    }
  },
  {
    id: LIST_A + ' ~ selecting as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'the selection mode with no tick: the tick column, the bar with its actions off and «Снять выделение» on',
    enter: async (d) => {
      await onAccount(d, SEVEN_SPECS);
      await d.click('Выбрать');
    }
  },
  {
    id: LIST_A + ' ~ price sheet as gm4',
    route: '#/lists',
    as: 'gm4',
    why: 'row 2 ticked and «Цены» pressed: the sheet «Цены выбранных» with the percentage row, the guess and «Убрать цену (1)», «Проставить эти цены»',
    enter: async (d) => {
      await onAccount(d, NOTED_SPECS);
      await d.tick(ROW2_CI2);
      await d.click(NAME.ru.prices);
    }
  },
  {
    id: LIST_A + ' ~ long name as gm4',
    route: '#/lists',
    as: 'gm4',
    width: 360,
    why: 'a 120-character list name: the title field on one line beside «Выбрать» and «Ещё»',
    enter: async (d) => {
      await onAccount(d, LONG_NAME_SPECS);
    }
  },
  {
    id: '#/lists/00000000-0000-4000-8000-000000000301 ~ compact as gm3',
    route: '#/lists/00000000-0000-4000-8000-000000000301',
    as: 'gm3',
    width: 360,
    why: "gm3's «Склад» up to 760 px: own items with their pictures, sources cut on one line, the search row"
  },
  {
    id: '#/s/player-token-1 ~ compact',
    route: '#/s/player-token-1',
    width: 360,
    why: "the players' link up to 760 px: the lead line, folded rows with «×2» and no quantity at 1, the search row"
  },
  {
    id: '#/s/player-token-1 ~ compact, row open',
    route: '#/s/player-token-1',
    width: 360,
    why: "row 1 unfolded: its tags, text, players' note and «Открыть карточку»",
    enter: async (d) => {
      await d.unfold(0);
    }
  },
  {
    id: '#/s/player-token-1 ~ selecting',
    route: '#/s/player-token-1',
    why: 'the selection mode with no tick: the tick column, the bar with «Все» and «Снять выделение»',
    enter: async (d) => {
      await d.click('Выбрать');
    }
  },
  {
    id: '#/s/player-token-1 ~ long name',
    route: '#/s/player-token-1',
    width: 360,
    why: 'a 120-character list name on one line with an ellipsis',
    enter: async (d) => {
      for (let i = 0; i < 40 && !(await d.count('.said[data-live="live"]')); i++)
        await d.settle();
      await d.fake('play', '00000000-0000-4000-8000-000000000101', { name: LONG_LIST_NAME });
      for (let i = 0; i < 40 && !(await d.text()).includes(LONG_LIST_NAME.slice(0, 20)); i++)
        await d.settle();
    }
  },
  {
    id: '#/s/gm-token-1 ~ compact',
    route: '#/s/gm-token-1',
    width: 360,
    why: 'the GM link up to 760 px: «Заметка» and «Заметка мастера» on the lead line, the note marks on the noted rows'
  },
  {
    id: '#/lists/nope',
    route: '#/lists/nope',
    why: 'not an account address, signed out: «Войдите, чтобы открыть список», «Войти» and «Открыть таблицы»; the address not rewritten'
  },
  {
    /* The players' payload of the old `qty-and-price` fixture, as a link written before
       2026-10-26 carries it (`git show 0b73fd5c:docs/fixtures/lists/qty-and-price.json`). */
    id: '#/l/ ~ retired',
    route: '#/l/0JvQsNCy0LrQsAozLnZvY3h-Y2kxKjIsY2MyMSo1KjUwLHEzMzcqMSoxMg',
    why: 'an old list link draws the page of an address with no page: «Страницы по этому адресу нет», the address in code, «На главную» and «Открыть таблицы»; the address kept, nothing decoded'
  },
  {
    id: '#/l/~AAAA',
    route: '#/l/~AAAA',
    why: 'a packed old list link: the same page of an address with no page, the address kept'
  },

  /* An account list's share link, `#/s/<token>`: read-only for everyone, the
     owner included. The fake resolves its seed tokens in any session. */
  {
    id: '#/s/player-token-1',
    route: '#/s/player-token-1',
    why: "the players' view signed out: «Лавка кузнеца», the sub, «Обновлено 3 дня назад», «Сохранить себе», the players' list note, nine rows, no GM note, no 26 October line"
  },
  {
    id: '#/s/gm-token-1',
    route: '#/s/gm-token-1',
    why: 'the GM view signed out: the same page with the GM notes on the list and on «Проклят.»'
  },
  {
    id: '#/s/player-token-1 as gm1',
    route: '#/s/player-token-1',
    as: 'gm1',
    why: "the owner on their own players' link: «Это ваш список.» and «Открыть для правки» to #/lists/<uuid(101)> above the players' view"
  },
  {
    id: '#/s/gm-token-1 as gm2',
    route: '#/s/gm-token-1',
    as: 'gm2',
    why: 'another user on the GM link: read-only, the GM notes, «Сохранить себе», no own line'
  },
  {
    id: '#/s/player-token-1 ~ updated live',
    route: '#/s/player-token-1',
    why: 'signed out, after another device renamed the list while the share topic was joined: «Лавка у моста», «Обновлено только что», and the hidden status «Список обновлён», with no reload',
    enter: async (d) => {
      for (let i = 0; i < 40 && !(await d.count('.said[data-live="live"]')); i++)
        await d.settle();
      await d.fake('play', '00000000-0000-4000-8000-000000000101', { name: 'Лавка у моста' });
      for (let i = 0; i < 40 && !(await d.text()).includes('Лавка у моста'); i++)
        await d.settle();
    }
  },
  {
    id: '#/s/player-token-1 ~ gm only live',
    route: '#/s/player-token-1',
    why: 'signed out, after another device marked «Брошюра по Истории Искусства» GM only while the share topic was joined: the row gone with no reload, one entry fewer in the sub, and the hidden status «Список обновлён»',
    enter: async (d) => {
      await gmOnlyLive(d);
      for (let i = 0; i < 40 && (await d.text()).includes('Брошюра по Истории Искусства'); i++)
        await d.settle();
    }
  },
  {
    id: '#/s/gm-token-1 ~ gm only',
    route: '#/s/gm-token-1',
    why: "signed out on the GM's link, after another device marked «Брошюра по Истории Искусства» GM only: every row kept, that row dashed with its art at 45%, and its button named with «, Только для мастера» for a screen reader only",
    enter: async (d) => {
      await gmOnlyLive(d);
      for (let i = 0; i < 40 && !(await d.count('.gm-only')); i++) await d.settle();
    }
  },
  {
    id: '#/s/player-token-1 ~ gm only as gm1',
    route: '#/s/player-token-1',
    as: 'gm1',
    why: "the owner on their own players' link with one GM-only entry: «Это ваш список. Только для мастера: 1 - по этой ссылке их не видно. Открыть для правки» above the rows the link shows",
    enter: async (d) => {
      await gmOnlyLive(d);
      for (let i = 0; i < 40 && !(await d.text()).includes('Только для мастера: 1'); i++)
        await d.settle();
    }
  },
  {
    id: '#/s/player-token-1 ~ saved',
    route: '#/s/player-token-1',
    why: 'signed out, after «Сохранить себе»: the button pressed and the sign-in prompt under it',
    enter: async (d) => {
      await d.click('Сохранить себе');
    }
  },
  {
    id: '#/s/player-token-1 ~ ticked',
    route: '#/s/player-token-1',
    why: 'signed out, ci1 and cc1 ticked: the bar with «В список», «Печать», «Скопировать» and «Сообщить владельцу» last (its own line at 600 px or less)',
    enter: async (d) => {
      await d.tick('Первоклассный Спальный Мешок');
      await d.tick('Зелье Быстрого Шага');
    }
  },
  /* The search box and the filter (docs/specs/FEATURES.md, "Lists"): the seeded share
     holds 10 entries, past the threshold of 8. */
  {
    id: '#/s/player-token-1 ~ filters open',
    route: '#/s/player-token-1',
    why: 'the search box and «Фильтры» pressed: the panel with Тип (4), Источник (6), Ранг (1, 2), Класс, Характеристика (6), Дистанция (3), Хват and Улучшения и уникальные, each «любое»',
    enter: async (d) => {
      await d.click('Фильтры');
    }
  },
  {
    id: '#/s/player-token-1/f_kind-weapon.tier-1',
    route: '#/s/player-token-1/f_kind-weapon.tier-1',
    why: 'a filter link as it opens: the panel open with «Оружие» and «1» pressed, two pills, «Сбросить всё», the copy-link button, «3 из 10», three rows'
  },
  {
    id: '#/s/player-token-1 ~ filtered',
    route: '#/s/player-token-1',
    why: '«Первоклассный Спальный Мешок» ticked, then «Оружие» and Ранг «1» picked and the panel folded: two pills, the copy-link button, «3 из 10», the bar «Выбрана 1 позиция» for the hidden tick; the address ends /f_kind-weapon.tier-1',
    enter: async (d) => {
      await d.tick('Первоклассный Спальный Мешок');
      await d.click('Фильтры');
      await d.click('Оружие');
      await d.click('1');
      await d.click('Закрыть');
    }
  },
  {
    id: '#/s/player-token-1 ~ no match',
    route: '#/s/player-token-1',
    why: '«Броня» and Ранг «2»: «0 из 10», «Ничего не найдено» and «Сбросить всё», no rows and no «Выбрать все»',
    enter: async (d) => {
      await d.click('Фильтры');
      await d.click('Броня');
      await d.click('2');
    }
  },
  {
    id: '#/s/player-token-1 ~ searched',
    route: '#/s/player-token-1',
    why: '«кинжал» typed: one row, the strip «10», the address unchanged',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'кинжал');
    }
  },
  {
    id: '#/s/gm-token-1 ~ filter link copied',
    route: '#/s/gm-token-1',
    why: "«Оружие» picked and the copy-link button pressed on the GM's link: the toast «Ссылка на фильтры скопирована - это ссылка для мастера: в ней есть заметки и позиции «Только для мастера»»",
    enter: async (d) => {
      await d.click('Фильтры');
      await d.click('Оружие');
      await d.click('Ссылка на фильтры');
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/s/player-token-3 ~ long source picked',
    route: '#/s/player-token-3',
    why: "gm3's «Склад», 8 entries: the source at the 80-code-point name picked; its chip and its pill wrap inside the strip at 360 px; one row, gm4's «Фляга туманов»",
    enter: async (d) => {
      await d.click('Фильтры');
      await d.click(
        'Мастерская старого оружейника из долины туманов за перевалом у Северной реки, II'
      );
    }
  },
  {
    id: '#/s/player-token-1 ~ sent',
    route: '#/s/player-token-1',
    why: 'signed out, ci1 and cc1 ticked and «Сообщить владельцу» pressed: both ticks and both take lines kept, «Запрос отправлен» disabled last in the bar, the muted line under the actions «Запрос (2 позиции · 7 шт.) ждёт ответа владельца до 30 дней. Если владелец его примет, взятое спишут из этого списка.», the toast «Запрос отправлен владельцу списка.»',
    enter: async (d) => {
      await d.tick('Первоклассный Спальный Мешок');
      await d.tick('Зелье Быстрого Шага');
      await d.click('Сообщить владельцу');
      for (let i = 0; i < 40 && !(await d.count('.sentline')); i++) await d.settle();
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/s/player-token-1 ~ sent and declined',
    route: '#/s/player-token-1',
    why: 'signed out, ci1 and cc1 sent, then the owner declines on another device: the toast «Владелец отклонил ваш запрос.», the line «Владелец отклонил запрос.» under the actions, «Запрос отправлен» still disabled, both ticks kept',
    enter: async (d) => {
      /* The decision is heard on the share topic only once it is joined. */
      for (let i = 0; i < 40 && !(await d.count('.said[data-live="live"]')); i++)
        await d.settle();
      await d.tick('Первоклассный Спальный Мешок');
      await d.tick('Зелье Быстрого Шага');
      await d.click('Сообщить владельцу');
      for (let i = 0; i < 40 && !(await d.count('.sentline')); i++) await d.settle();
      await d.fake('decideNewest', 'player-token-1', 'declined');
      for (
        let i = 0;
        i < 40 &&
        !/Владелец отклонил запрос\.|The owner declined the request\./.test(await d.text());
        i++
      )
        await d.settle();
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/s/player-token-1 ~ notify question as gm2',
    route: '#/s/player-token-1',
    as: 'gm2',
    why: 'ci1 and cc1 ticked and added to «Список второго ГМа»: the question «Сообщить владельцу списка, что вы взяли эти предметы?» with «Сообщить», «Не сообщать» and «Запомнить ответ» in place of the action row, the ticks kept, the add toast',
    enter: async (d) => {
      await d.tick('Первоклассный Спальный Мешок');
      await d.tick('Зелье Быстрого Шага');
      await d.click('В список');
      await d.click('Список второго ГМа');
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/s/gm-token-1 ~ saved as gm2',
    route: '#/s/gm-token-1',
    as: 'gm2',
    why: 'signed in, after «Сохранить себе»: the copy at #/lists/<uuid(5000)> with both GM notes, «Поделиться», the toast «Список «Лавка кузнеца» создан»',
    enter: async (d) => {
      await d.click('Сохранить себе');
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/s/unknown-token',
    route: '#/s/unknown-token',
    why: 'a link that opens nothing: «Список больше не доступен», «Владелец удалил эту ссылку или список.», «На главную»; the address kept'
  },

  {
    id: '#/search',
    route: '#/search',
    why: 'the page as opened: the head with the lead and the labeled pin, the box focused, «Все» pressed and three kinds unpressed, the start plate «Что ищем?» with three examples'
  },
  {
    id: '#/search ~ narrow',
    route: '#/search',
    width: 360,
    why: 'up to 760 px: the h1 and «Ещё» on one row, the lead read only, the search row with «Фильтры», the start plate with three examples'
  },
  {
    id: '#/search ~ more',
    route: '#/search',
    width: 360,
    why: '«Ещё» open on the h1 row: the pin as its one item',
    enter: (d) => d.openMore(SEARCH_MORE),
    again: (d) => d.openMore(SEARCH_MORE)
  },
  {
    id: '#/search ~ filter sheet as gm1',
    route: '#/search',
    as: 'gm1',
    width: 360,
    why: '«меч» typed, «Фильтры» pressed: the sheet with «Свои предметы» first and the row «Тип» with «Все» pressed',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'меч');
      await d.click('Фильтры');
    }
  },
  {
    id: '#/search ~ selecting',
    route: '#/search',
    why: '«меч» typed, «Выбрать» pressed and one row ticked: the ticks in the rows, the bar with «Выбрано: 1», no select-all strip',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'меч');
      await d.click('Выбрать');
      await d.tick('Меч Хрустального Духа');
    }
  },
  {
    id: '#/search ~ nothing found, kind picked',
    route: '#/search',
    why: 'a query with no hit and «Расходники» picked: «Ничего не найдено», the cause naming the query and the kind, «Сбросить фильтры»',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'zzzqqqxx123');
      await d.click('Расходники');
    }
  },
  {
    id: '#/search ~ searched',
    route: '#/search',
    why: '139 rows of loot and gear together, ranked: the names with «меч» at a word start first and marked, «№ N» on the rolled rows; no ticks and no select-all strip',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'меч');
    }
  },
  {
    id: '#/search ~ kind picked',
    route: '#/search',
    why: '«Снаряжение» picked from «Все»: the gear rows alone, the chip lit, the count line «Снаряжение · Показано 91 из 139»',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'меч');
      await d.click('Снаряжение');
    }
  },
  {
    id: '#/search ~ stat line',
    route: '#/search',
    why: 'a phrase in quotes: rows found by the assembled stat line alone - the exact word is on no record as text',
    enter: async (d) => {
      /* A phrase: the bare word also reaches «двуручный» in descriptions by its stem */
      await d.type('Поиск по названию или описанию...', '"двуручное"');
    }
  },
  {
    id: '#/search ~ capped',
    route: '#/search',
    why: 'the 300 cap: the first 300 rows and the count line «Показано 300 из <n>»',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'а');
    }
  },
  {
    id: '#/search ~ words in any order',
    route: '#/search',
    why: 'two words in another order and form: the healing potions, which a contiguous match misses',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'лечения зелья');
    }
  },
  {
    id: '#/search ~ nothing found',
    route: '#/search',
    why: '«Ничего не найдено», the cause naming the query, and «Очистить поиск»',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'zzzqqqxx123');
    }
  },
  {
    id: '#/search ~ a row ticked',
    route: '#/search',
    why: 'the bar over search: «Выбрать» opens the mode, one row ticked',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'меч');
      /* The first ranked hit for "меч" - computed against `data.json` through
         `buildIndex`, `parseQuery` and `rankHits`. */
      await d.tick('Меч Хрустального Духа');
    }
  },
  {
    id: '#/print/ci1-q1',
    route: '#/print/ci1-q1',
    why: 'an old long print link: the error page «Такие ссылки на печать больше не открываются.», its sentence and «На главную»; the address kept'
  },
  {
    id: TWO,
    route: TWO,
    why: 'a stored print set signed out: the heading, «Войдите, чтобы печатать карточки.» and one «Войти»',
    enter: sheet
  },
  {
    id: '#/p/bad',
    route: '#/p/bad',
    why: 'a malformed set id signed out: the set-not-found sub and «На главную», no read'
  },
  {
    id: '#/p/set-expired1 as gm2',
    route: '#/p/set-expired1',
    as: 'gm2',
    why: 'a set no one opened for 90 days: the set-not-found sub and «На главную», the address kept',
    enter: sheet
  },
  {
    id: TWO + ' ~ load failed as gm2',
    route: TWO,
    as: 'gm2',
    hold: 'print:fail',
    why: 'the set read fails: the error page «Набор не загрузился», its sentence and the primary «Повторить»',
    enter: sheet
  },
  {
    id: '#/p/set-missing1 as gm2',
    route: '#/p/set-missing1',
    as: 'gm2',
    why: 'a set one of whose items was deleted: one card, and the red note under the bar counting the deleted item',
    enter: sheet
  },
  {
    id: '#/p/set-allgone1 as gm2',
    route: '#/p/set-allgone1',
    as: 'gm2',
    why: 'a set whose items were all deleted: «Печатать нечего», the note counting two, «На главную»',
    enter: sheet
  },
  {
    id: TWO + ' as gm2',
    route: TWO,
    as: 'gm2',
    why: 'a print sheet: a loot card with its art beside a weapon card, seven blank places',
    enter: sheet
  },
  {
    id: TWO + ' ~ black and white as gm2',
    route: TWO,
    as: 'gm2',
    why: 'the other layout: no art, the band, the tag and the mark in a row over the name, -bw vectors; the note under the bar',
    enter: async (d) => {
      await sheet(d);
      await d.click('Чёрно-белая');
    }
  },
  {
    id: COUNTED + ' as gm2',
    route: COUNTED,
    as: 'gm2',
    why: 'a sheet printed from a counted list entry: the loot card named with " ×3" beside a weapon card with no count',
    enter: sheet
  },
  {
    id: NINE + ' as gm2',
    route: NINE,
    as: 'gm2',
    whole: true,
    why: 'every card shape on one sheet: item, weapon, armor, consumable, artifact, versatile magic, two-handed with a bonus, magic dagger, a long rule',
    enter: sheet
  },
  {
    id: NINE + ' ~ black and white as gm2',
    route: NINE,
    as: 'gm2',
    whole: true,
    why: 'the same nine, the other layout; the note under the bar',
    enter: async (d) => {
      await sheet(d);
      await d.click('Чёрно-белая');
    }
  },
  {
    id: LONG + ' as gm2',
    route: LONG,
    as: 'gm2',
    whole: true,
    why: 'the fit ladder end to end: the font, then the padding, then the art gives way on the longest texts in the catalog',
    enter: sheet
  },
  {
    id: LONG + ' ~ black and white as gm2',
    route: LONG,
    as: 'gm2',
    whole: true,
    why: 'the same, with the black-and-white padding floor; the note under the bar',
    enter: async (d) => {
      await sheet(d);
      await d.click('Чёрно-белая');
    }
  },
  {
    id: TEN + ' as gm2',
    route: TEN,
    as: 'gm2',
    why: 'a second sheet: eighteen places, eight blank, the second sheet a page break; "Листов A4: 2"',
    enter: sheet
  },
  {
    id: '#/p/set-maxcards as gm2',
    route: '#/p/set-maxcards',
    as: 'gm2',
    why: 'the cap: 180 cards on twenty sheets, no note',
    enter: sheet
  },
  {
    id: DV_SET + ' as gm2',
    route: DV_SET,
    as: 'gm2',
    whole: true,
    why: "the Dragon's Vault worst cases: Frostwyrd's longest rung, the One/Two-Handed grip mark, the Spellcast trait cell, two second strips (Ember, Steampowered Gauntlets), the set line on both members, and a folded GM box",
    enter: sheet
  },
  {
    id: DV_SET + ' ~ black and white as gm2',
    route: DV_SET,
    as: 'gm2',
    whole: true,
    why: 'the same seven, the other layout; the note under the bar',
    enter: async (d) => {
      await sheet(d);
      await d.click('Чёрно-белая');
    }
  },
  {
    id: VOA4_SET + ' as gm2',
    route: VOA4_SET,
    as: 'gm2',
    whole: true,
    why: "Volume 4's worst cases: the artifact weapon card, the three set cards, a consumable artifact, a folded condition line, two lists",
    enter: sheet
  },
  {
    id: VOA4_SET + ' ~ black and white as gm2',
    route: VOA4_SET,
    as: 'gm2',
    whole: true,
    why: 'the same nine, the other layout; the note under the bar',
    enter: async (d) => {
      await sheet(d);
      await d.click('Чёрно-белая');
    }
  },
  {
    id: TWO + ' ~ compact as gm2',
    route: TWO,
    as: 'gm2',
    why: 'the compact sheet in color: the size switch pressed, the compact subtitle, sixteen places, fourteen blank; the note under the bar',
    enter: async (d) => {
      await sheet(d);
      await d.click('Компактная');
    }
  },
  {
    id: TWO + ' ~ compact black and white as gm2',
    route: TWO,
    as: 'gm2',
    why: 'the compact sheet in black and white: both switches pressed away from their defaults; the note under the bar',
    enter: async (d) => {
      await sheet(d);
      await d.click('Чёрно-белая');
      await d.click('Компактная');
    }
  },
  {
    id: NINE + ' ~ compact as gm2',
    route: NINE,
    as: 'gm2',
    whole: true,
    why: 'every card shape on the compact sheet, in color; the note under the bar',
    enter: async (d) => {
      await sheet(d);
      await d.click('Компактная');
    }
  },
  {
    id: NINE + ' ~ compact black and white as gm2',
    route: NINE,
    as: 'gm2',
    whole: true,
    why: 'every card shape on the compact sheet, in black and white: the grow rung at 44 mm; the note under the bar',
    enter: async (d) => {
      await sheet(d);
      await d.click('Чёрно-белая');
      await d.click('Компактная');
    }
  },
  {
    id: LONG + ' ~ compact as gm2',
    route: LONG,
    as: 'gm2',
    whole: true,
    why: 'the color fit ladder at 44 mm on the longest texts; the note under the bar',
    enter: async (d) => {
      await sheet(d);
      await d.click('Компактная');
    }
  },
  {
    id: LONG + ' ~ compact black and white as gm2',
    route: LONG,
    as: 'gm2',
    whole: true,
    why: 'the black-and-white fit at 44 mm on the longest texts; the note under the bar',
    enter: async (d) => {
      await sheet(d);
      await d.click('Чёрно-белая');
      await d.click('Компактная');
    }
  },
  {
    id: TEN + ' ~ compact as gm2',
    route: TEN,
    as: 'gm2',
    why: 'ten cards on one compact sheet: sixteen places, six blank, no page break; "Листов A4: 1"; the note under the bar',
    enter: async (d) => {
      await sheet(d);
      await d.click('Компактная');
    }
  },
  {
    id: '#/i/ci1 ~ print signed out',
    route: '#/i/ci1',
    why: '«Печать» pressed signed out: the boxed sign-in prompt under the action row, «Войдите, чтобы печатать карточки.»',
    enter: async (d) => {
      await d.click(PRINT);
    }
  },
  {
    id: '#/i/ci1 ~ save signed out',
    route: '#/i/ci1',
    why: '«Сохранить себе» on a catalog record pressed signed out: the boxed «Войдите, и копия предмета сохранится в «Мои предметы».» with «Войти»',
    enter: async (d) => {
      await d.more('Сохранить себе');
    }
  },
  {
    id: '#/tables ~ a row ticked, print signed out',
    route: '#/tables',
    why: "the selection bar's «Печать» pressed signed out: the compact sign-in prompt and «Отмена» in place of the bar's action row",
    enter: async (d) => {
      await d.tick(ROW1_CI1);
      await d.click(PRINT);
    }
  },
  {
    id: '#/account',
    route: '#/account',
    why: 'signed out: the sign-in chooser, both providers and the consent line'
  },
  {
    id: '#/account as gm2',
    route: '#/account',
    as: 'gm2',
    why: 'one identity: no Disconnect, the only-method hint and Connect Discord; «Ваши данные» with «Скачать мои данные (ZIP)»'
  },
  {
    id: '#/account as gm1',
    route: '#/account',
    as: 'gm1',
    why: 'two identities: the five sections in order, «Отображение на всех устройствах» first with no lead line and two print segments, Google marked «Сейчас», a Disconnect on each, «Ваши данные» between «Способы входа» and «Выход»'
  },
  {
    id: '#/account ~ narrow as gm1',
    route: '#/account',
    as: 'gm1',
    width: 360,
    why: 'one column at 360: the print row with its two segments wrapped, the sign-in methods under the Display section'
  },
  {
    id: '#/account ~ delete confirmation as gm1',
    route: '#/account',
    as: 'gm1',
    why: 'the typed confirmation open: «Будут удалены:» with the counts read and the fixed line, the word of each language typed and the filled final button enabled',
    enter: async (d) => {
      await d.click('Удалить аккаунт...');
      /* The only text box on the page; it is named by its <label>, which the
         driver's name lookup does not read, and has no placeholder. */
      await d.type('', 'удалить');
    },
    /* The English half types the English word: the word follows the interface language. */
    again: (d) => d.type('', 'delete')
  },
  {
    id: '#/roll/std as gm1',
    route: '#/roll/std',
    as: 'gm1',
    why: 'the header signed in: the initial on a menu button in place of «Войти»'
  },
  /* The English half is captured after the EN press, an outside click that
     closes the menu, as it closes the add-to-list menu. */
  /* The supplements menu of the mode row (FEATURES.md, "Chrome"), open on a supplement page:
     the seven supplements with the open one checked. Its axe case is modeRow.test.ts. */
  {
    id: '#/roll/vault_of_ages ~ supplements menu',
    route: '#/roll/vault_of_ages',
    why: 'the supplements menu open on Vault of Ages: the caption, seven supplements in table order, Vault of Ages checked and current',
    enter: async (d) => {
      await d.press('Vault of Ages');
    }
  },

  {
    id: '#/roll/std ~ account menu as gm1',
    route: '#/roll/std',
    as: 'gm1',
    why: 'the account menu open: «Аккаунт», «Мои списки», «Мои предметы», «Выйти»',
    enter: async (d) => {
      await d.press('Аккаунт: gm1@example.test');
    }
  },

  /* Homebrew (docs/specs/FEATURES.md, "Homebrew"): the seed's source «Мастерская
     Ольхи» with two sections, and four items - the axe in «Холодное оружие», a
     Russian-only potion, an English-only cap and a plain ring. */
  {
    id: '#/homebrew as gm1',
    route: '#/homebrew',
    as: 'gm1',
    why: 'the Items tab: the head with the pin, the tab links with their counts and «Новый предмет», then «4 предмета из 100», «Импорт из файла» and «Выбрать» (no search under eight items), the axe under «Мастерская Ольхи · Холодное оружие» and the other three under «Хоумбрю»'
  },
  {
    id: '#/homebrew as gm3',
    route: '#/homebrew',
    as: 'gm3',
    why: "gm3's 39 items: the search box «Найти предмет», «39 предметов из 100», «Импорт из файла», «Выбрать», the filter column and the groups"
  },
  {
    id: '#/homebrew ~ search as gm3',
    route: '#/homebrew',
    as: 'gm3',
    why: '«скатка» typed in «Найти предмет»: only the heading «Хоумбрю» with the three rolls of the chain, the count «39 предметов из 100» kept',
    enter: async (d) => {
      await d.type('Найти предмет', 'скатка');
    }
  },
  {
    id: '#/homebrew ~ no match as gm3',
    route: '#/homebrew',
    as: 'gm3',
    why: 'a query with no match: «Ничего не найдено» with its cause in place of the groups, the count «39 предметов из 100» kept',
    enter: async (d) => {
      await d.type('Найти предмет', 'яяяя');
    }
  },
  {
    id: '#/homebrew ~ import held names as gm3',
    route: '#/homebrew',
    as: 'gm3',
    why: "a file of 12 items with gm3's bedroll keys: under «Пропустить» the line «Предметы. Уже есть - останутся как есть:» with the first 10 names and «и ещё 2»",
    enter: async (d) => {
      await hbImportOpen(d);
      await d.upload(heldNamesFile());
      for (let i = 0; i < 40 && !(await d.text()).includes('Импортировать (12)'); i++)
        await d.settle();
    }
  },
  {
    id: '#/homebrew ~ import held names open as gm3',
    route: '#/homebrew',
    as: 'gm3',
    why: 'the same, «Обновить» and «и ещё 2» pressed: «Предметы. Уже есть - заменятся из файла:» with all 12 names and «свернуть»',
    enter: async (d) => {
      await hbImportOpen(d);
      await d.upload(heldNamesFile());
      for (let i = 0; i < 40 && !(await d.text()).includes('Импортировать (12)'); i++)
        await d.settle();
      await d.click('Обновить');
      await d.click('и ещё 2');
    }
  },
  {
    id: '#/homebrew ~ import panel as gm1',
    route: '#/homebrew',
    as: 'gm1',
    why: '«Импорт из файла» pressed and expanded: the panel «Импорт предметов из файла JSON» with «Выбрать файл...», the links «Формат файла» and «llms.txt» on its row and the line of what fits under it',
    enter: hbImportOpen
  },
  {
    id: '#/homebrew ~ import preview as gm1',
    route: '#/homebrew',
    as: 'gm1',
    why: 'example-edited.json chosen over the held «Мастерская Ольхи»: «Источников: 1, разделов: 2, карт: 2, предметов: 5.», «Куда положить предметы» with the row «Мастерская Ольхи» on «В «Мастерская Ольхи»» and «Ключ источника совпал с вашим...», the row «Без источника» on «В «Хоумбрю»», «Пропустить» pressed, the line «Источники. Уже есть - останутся как есть: Мастерская Ольхи.» and its note, «Импортировать (7)» and «Отмена»',
    enter: async (d) => {
      await hbImportOpen(d);
      await d.upload(HB_FILE('example-edited.json'));
      for (let i = 0; i < 40 && !(await d.text()).includes('Импортировать (7)'); i++)
        await d.settle();
    }
  },
  {
    id: '#/homebrew ~ import long names as gm1',
    route: '#/homebrew',
    as: 'gm1',
    why: 'a file whose source name is 80 code points with no space: the row label wraps inside the panel at 360 px (rule 16), the select with the new source under it; an error line cuts an item name to 40 characters, so no longer name reaches the panel',
    enter: async (d) => {
      await hbImportOpen(d);
      await d.upload(longNamesFile());
      for (let i = 0; i < 40 && !(await d.text()).includes('Импортировать (1)'); i++)
        await d.settle();
    }
  },
  {
    id: '#/homebrew ~ import refused as gm1',
    route: '#/homebrew',
    as: 'gm1',
    why: 'errors.json chosen: the alert «В файле ошибки - ничего не импортировано...» with three lines, each with its object, its text and its path, and «Отмена» only',
    enter: async (d) => {
      await hbImportOpen(d);
      await d.upload(HB_FILE('errors.json'));
      for (let i = 0; i < 40 && !(await d.count('.errs')); i++) await d.settle();
    }
  },
  {
    id: '#/homebrew ~ imported as gm1',
    route: '#/homebrew',
    as: 'gm1',
    why: 'example.json imported into the held source: the panel folded, the two pistols under «Мастерская Ольхи · Пистоли», the bedroll under «Хоумбрю», the toast «Импортировано предметов: 3, новых карт: 2»',
    enter: async (d) => {
      await hbImportOpen(d);
      await d.upload(HB_FILE('example.json'));
      for (let i = 0; i < 40 && !(await d.text()).includes('Импортировать (5)'); i++)
        await d.settle();
      await d.click('Импортировать (5)');
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/homebrew ~ move as gm1',
    route: '#/homebrew',
    as: 'gm1',
    why: 'the three items of «Хоумбрю» ticked, «Переместить (3)» pressed: the sheet with «Источник» on «Мастерская Ольхи», «Раздел» on «Без раздела», «Отмена» and «Переместить»',
    enter: async (d) => {
      for (const name of ['Настой кузнеца', 'Whispering Cap', 'Кольцо с гравировкой'])
        await d.tick(name);
      await d.click('Переместить (3)');
      /* The seed's «Мастерская Ольхи», `uuid(501)`. */
      await d.choose('#hb-move', '00000000-0000-4000-8000-000000000501');
    }
  },
  /* The head's pin, the Items tab's filter from the eighth item and the fold of a filter
     row of more than 12 values. `items` and `sections` seed the fake
     (`?items=`, `?sections=`): twelve items in two sources, or 66 with the first source's
     22 sections all used. */
  {
    id: '#/homebrew ~ pinned as gm1',
    route: '#/homebrew',
    as: 'gm1',
    why: 'the home button pressed: «Открывается при запуске» pressed, the toast «Приложение будет открываться на этом разделе»',
    enter: async (d) => {
      await d.click('Открывать при запуске');
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/homebrew ~ filters as gm1',
    route: '#/homebrew',
    as: 'gm1',
    items: 12,
    why: 'twelve own items: the search box, «12 предметов из 12», the filter column with no link button and the groups'
  },
  {
    id: '#/homebrew ~ filter hides a tick as gm1',
    route: '#/homebrew',
    as: 'gm1',
    items: 12,
    why: '«Кольцо с гравировкой» of «Хоумбрю» ticked, then «Мастерская Ольхи» picked: «Показано 7 из 12», only the source rows drawn, the tick dropped and the bar at zero; the pick wrote the address #/homebrew/f_src-hb_alderworkshopaaa',
    enter: async (d) => {
      await d.tick('Кольцо с гравировкой');
      await d.click('Мастерская Ольхи');
    }
  },
  /* The list head, the bar and the sheets of `#/homebrew` up to 760 px, and the editor's. */
  {
    id: '#/homebrew ~ narrow as gm3',
    route: '#/homebrew',
    as: 'gm3',
    width: 360,
    why: 'the head up to 760 px: the read-only heading and lead, the picker «Предметы», «Новый предмет» with no plus and «Ещё», the search row with «Фильтры» and «Выбрать»'
  },
  {
    id: '#/homebrew ~ tabs as gm3',
    route: '#/homebrew',
    as: 'gm3',
    width: 360,
    why: 'the picker pressed: the sheet with the four tabs, their counts and «39 предметов из 100»',
    enter: async (d) => {
      await d.click('Мои предметы: Предметы');
    }
  },
  {
    id: '#/homebrew ~ more as gm3',
    route: '#/homebrew',
    as: 'gm3',
    width: 360,
    why: '«Ещё» pressed: the menu with «Импорт из файла» and the pin',
    enter: (d) => d.openMore('.pickrow [aria-haspopup="menu"]'),
    again: (d) => d.openMore('.pickrow [aria-haspopup="menu"]')
  },
  {
    id: '#/homebrew ~ filter sheet as gm3',
    route: '#/homebrew',
    as: 'gm3',
    width: 360,
    why: '«Фильтры» pressed: the sheet with «Тип», «Источник» and «Раздел» where the seed has them, no link button, «Показать N»; a pick writes the address',
    enter: async (d) => {
      await d.click('Фильтры');
    }
  },
  {
    id: '#/homebrew ~ select as gm3',
    route: '#/homebrew',
    as: 'gm3',
    why: 'two rows ticked in the mode: the one bar with «Все», «В список», «Печать», «Скопировать текст», «Переместить (2)», «Скачать JSON (2)», «Удалить (2)» and «Снять выделение»',
    enter: hbTickTwo
  },
  {
    id: '#/homebrew ~ select narrow as gm3',
    route: '#/homebrew',
    as: 'gm3',
    width: 360,
    why: 'the bar up to 760 px: «В список», «Печать», «Ещё» and «Снять выделение», no strip',
    enter: hbTickTwo
  },
  {
    id: '#/homebrew ~ bar more as gm3',
    route: '#/homebrew',
    as: 'gm3',
    width: 360,
    why: "the bar's «Ещё» pressed: the menu opens upward with the copy, the move, the JSON, a separator and «Удалить (2)»",
    enter: async (d) => {
      await hbTickTwo(d);
      await d.openMore('.selbarwrap [aria-haspopup="menu"]');
    },
    again: (d) => d.openMore('.selbarwrap [aria-haspopup="menu"]')
  },
  {
    id: '#/homebrew/sources ~ menu as gm1',
    route: '#/homebrew/sources',
    as: 'gm1',
    why: "a source's «Ещё» pressed: «Переименовать», «Скачать JSON», a separator and «Удалить»",
    enter: (d) => d.openMore('.book [aria-haspopup="menu"]'),
    again: (d) => d.openMore('.book [aria-haspopup="menu"]')
  },
  {
    id: '#/homebrew/sets ~ empty as gm4',
    route: '#/homebrew/sets',
    as: 'gm4',
    why: 'an account with no set: the plate «Комплектов пока нет» and what a set is, no button inside'
  },
  {
    id: '#/homebrew/rules ~ empty as gm4',
    route: '#/homebrew/rules',
    as: 'gm4',
    why: 'an account with no rule card: the plate «Карт правил пока нет» and what a rule card is'
  },
  {
    id: '#/homebrew/new ~ narrow as gm1',
    route: '#/homebrew/new',
    as: 'gm1',
    width: 360,
    why: 'the editor up to 760 px: no preview column, the sticky bar «Сохранить» and «Предпросмотр», no «Ещё» on a new item'
  },
  {
    id: '#/homebrew/new ~ preview sheet as gm1',
    route: '#/homebrew/new',
    as: 'gm1',
    width: 360,
    why: '«Предпросмотр» pressed: the sheet with the screen and print switch and the card',
    enter: async (d) => {
      await d.click('Предпросмотр');
    }
  },
  {
    id: '#/homebrew/new ~ equipment as gm1',
    route: '#/homebrew/new',
    as: 'gm1',
    why: '«Снаряжение» pressed with no tier: the preview draws the weapon badge at once and no stat block; the group «Характеристики» opens',
    enter: async (d) => {
      await d.click('Снаряжение');
    }
  },
  {
    id: '#/homebrew/' + HB_AXE + ' ~ bar more as gm1',
    route: '#/homebrew/' + HB_AXE,
    as: 'gm1',
    width: 360,
    why: "the editor bar's «Ещё» pressed on a stored item: the menu opens upward with «Удалить»",
    enter: (d) => d.openMore('.ebar [aria-haspopup="menu"]'),
    again: (d) => d.openMore('.ebar [aria-haspopup="menu"]')
  },
  {
    id: '#/homebrew/f_src-hb_alderworkshopaaa as gm1',
    route: '#/homebrew/f_src-hb_alderworkshopaaa',
    as: 'gm1',
    items: 12,
    why: 'the Items tab at a filter address: «Мастерская Ольхи» picked in the column, «Показано 7 из 12», only the source rows drawn, the group heads without the source name'
  },
  {
    id: '#/homebrew ~ section fold as gm1',
    route: '#/homebrew',
    as: 'gm1',
    items: 66,
    sections: 20,
    why: 'the column over 66 items: «Раздел» draws its first 10 sections, then «и ещё 12» collapsed (a row of more than 12 values folds)'
  },
  {
    id: '#/homebrew ~ section fold open as gm1',
    route: '#/homebrew',
    as: 'gm1',
    items: 66,
    sections: 20,
    why: 'the same, «и ещё 12» pressed: all 22 sections and «свернуть» expanded, the focus kept on it',
    enter: async (d) => {
      await d.click('и ещё 12');
    }
  },
  {
    id: '#/tables/homebrew ~ section fold as gm1',
    route: '#/tables/homebrew',
    as: 'gm1',
    items: 66,
    sections: 20,
    why: 'the homebrew table on «Мастерская Ольхи» with its 22 sections: the column, «Раздел» folded after 10 with «и ещё 12»; no table, filter or section link'
  },
  {
    id: '#/homebrew/hb_longsrcaaaaaaaaa as gm4',
    route: '#/homebrew/hb_longsrcaaaaaaaaa',
    as: 'gm4',
    why: "the editor of gm4's item in the source whose name is 80 code points: the path line under the heading and the «Источник» select wrap inside the form at 360 px (rule 16)"
  },
  {
    id: '#/homebrew/sets ~ long name as gm4',
    route: '#/homebrew/sets',
    as: 'gm4',
    why: 'a set named by one unbroken 80-character word in the 80-character source: the fold name and its count line wrap at 360 px (rule 16), the toast «Комплект «Ж...» создан»',
    enter: async (d) => {
      await d.click('Новый комплект');
      await d.type('Название комплекта', 'Ж'.repeat(80));
      await d.type('Бонус комплекта', 'Бонус.');
      await d.choose('#hb-card-new-set-book', '00000000-0000-4000-8000-000000000451');
      await d.click('Создать комплект');
      for (let i = 0; i < 40 && !(await d.text()).includes('Комплект «Ж'); i++)
        await d.settle();
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/tables/homebrew ~ source fold as gm1',
    route: '#/tables/homebrew',
    as: 'gm1',
    items: 66,
    sources: 14,
    why: '16 source chips: the first 10, then «и ещё 6» collapsed (rule 12)'
  },
  {
    id: '#/homebrew/sources ~ search as gm1',
    route: '#/homebrew/sources',
    as: 'gm1',
    items: 66,
    sources: 14,
    why: '15 named sources: the search box «Найти источник» under «Новый источник», «Источник 07» alone under the kept count «15 источников из 20»',
    enter: async (d) => {
      await d.type('Найти источник', '07');
    }
  },
  {
    id: '#/homebrew/sources ~ section fold as gm1',
    route: '#/homebrew/sources',
    as: 'gm1',
    items: 66,
    sections: 25,
    why: '«Мастерская Ольхи» with 27 sections: the first 20, «и ещё 7», «Без раздела» and «Новый раздел» (rule 12)',
    enter: async (d) => {
      await d.click('Разделы');
    }
  },
  {
    id: '#/homebrew ~ import over the limit as gm1',
    route: '#/homebrew',
    as: 'gm1',
    items: 4,
    why: 'an account at its limit of 4 items and a file of 3 new ones: «Импорт не поместится: ...» over «Импортировать (5)» disabled',
    enter: async (d) => {
      await hbImportOpen(d);
      await d.upload(HB_FILE('example.json'));
      for (let i = 0; i < 40 && !(await d.text()).includes('Импортировать (5)'); i++)
        await d.settle();
    }
  },
  {
    id: '#/homebrew/hb_longtextaaaaaaaa ~ edit past the cap as gm4',
    route: '#/homebrew/hb_longtextaaaaaaaa',
    as: 'gm4',
    why: "gm4's item at 3000 characters: «Жирный» pressed, the toolbar edit does not fit, the alert «Достигнут предел в 3000 знаков: правка не поместилась.» under the box (rule 18)",
    enter: async (d) => {
      await d.press('Жирный');
      for (let i = 0; i < 40 && !(await d.text()).includes('Достигнут предел'); i++)
        await d.settle();
    }
  },
  {
    id: '#/homebrew/sets/hb_starsleepsetaaaa ~ member removed as gm3',
    route: '#/homebrew/sets/hb_starsleepsetaaaa',
    as: 'gm3',
    why: 'the member write: «Убрать» of «Подушка из мха», the toast «Сохранено: «Подушка из мха»» with «Вернуть», the focus on the next «Убрать» (rules 10, 20)',
    enter: async (d) => {
      for (let i = 0; i < 40 && !(await d.count('[id^="hb-card-body-"]')); i++)
        await d.settle();
      await d.click('Убрать: Подушка из мха');
      for (let i = 0; i < 40 && !(await d.text()).includes('Сохранено: «Подушка из мха»'); i++)
        await d.settle();
    },
    /* a 7000ms action toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/homebrew/sources as gm1',
    route: '#/homebrew/sources',
    as: 'gm1',
    why: 'the Sources tab: «Новый источник» first, «1 источник из 20», «Мастерская Ольхи» (a link to its rows) 1 предмет · 2 раздела из 30 with «Разделы» and «Ещё», then «Хоумбрю» (a link) 3 предмета with «Скачать JSON»'
  },
  {
    id: '#/homebrew/sources ~ sections as gm1',
    route: '#/homebrew/sources',
    as: 'gm1',
    why: '«Разделы» pressed and expanded: «Пистоли» 0, «Холодное оружие» 1, «Без раздела» 0, each named section with «Переименовать» and «Удалить», then «Новый раздел» with the plus icon',
    enter: async (d) => {
      await d.click('Разделы');
    }
  },
  {
    id: '#/homebrew/sets as gm1',
    route: '#/homebrew/sets',
    as: 'gm1',
    why: 'the Sets tab: «Новый комплект» first, «1 комплект · 2 карты из 100», the closed fold «Комплект Ольхи» with «0 предметов · Мастерская Ольхи», «Изменить» and «Удалить»'
  },
  {
    id: '#/homebrew/sets as gm2',
    route: '#/homebrew/sets',
    as: 'gm2',
    why: 'an account with no cards: «Новый комплект», «0 комплектов · 0 карт из 100», «Комплектов пока нет.»'
  },
  {
    id: '#/homebrew/rules as gm1',
    route: '#/homebrew/rules',
    as: 'gm1',
    why: 'the Rules tab: «Новая карта правил» first, «1 карта правил · 2 карты из 100», the closed fold «Клеймо Ольхи» with «0 предметов», «Изменить» and «Удалить»'
  },
  {
    id: '#/homebrew/rules ~ card edit as gm1',
    route: '#/homebrew/rules',
    as: 'gm1',
    why: '«Изменить» of the rule card: its form in place of its row, «Название карты» *, «Подзаголовок», «Текст карты» *, «Ссылка», «Источник» on «Хоумбрю», «Сохранить» and «Отмена»',
    enter: async (d) => {
      await d.click('Изменить');
    }
  },
  {
    id: '#/homebrew/sets/hb_starsleepsetaaaa as gm3',
    route: '#/homebrew/sets/hb_starsleepsetaaaa',
    as: 'gm3',
    why: 'the address opens the set S: its fold open with its bonus, then the field «Добавить предмет», then three member links (Подушка из мха, Походный плед, Скатка следопыта), «Убрать» each',
    enter: async (d) => {
      for (let i = 0; i < 40 && !(await d.count('[id^="hb-card-body-"]')); i++)
        await d.settle();
    }
  },
  {
    id: '#/homebrew/rules/hb_alderrulecardaaa ~ item added as gm1',
    route: '#/homebrew/rules/hb_alderrulecardaaa',
    as: 'gm1',
    why: 'the address opens «Клеймо Ольхи»; the axe picked in «Добавить предмет»: one member link «Топор Тлеющих Углей» with «Убрать», «1 предмет» on the card, the toast «Сохранено: «Топор Тлеющих Углей»»',
    enter: async (d) => {
      for (let i = 0; i < 40 && !(await d.count('[id^="hb-card-body-"]')); i++)
        await d.settle();
      /* The book's axes rank with the own one: the query names it. */
      await d.type('Найти предмет', 'Топор Тлеющих');
      await d.click('Топор Тлеющих Углей');
      for (let i = 0; i < 40 && !(await d.text()).includes('Сохранено: «Топор'); i++)
        await d.settle();
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/homebrew/sets/hb_aldersetaaaaaaaa ~ official picker open as gm1',
    route: '#/homebrew/sets/hb_aldersetaaaaaaaa',
    as: 'gm1',
    why: 'the address opens «Комплект Ольхи»; «меч» typed in «Добавить предмет»: the field expanded and focused, the named list under it, and «Ещё N - уточните запрос» for the book and own matches past eight; the tree holds no option rows (homebrewPage.test.ts pins them)',
    enter: async (d) => {
      for (let i = 0; i < 40 && !(await d.count('[id^="hb-card-body-"]')); i++)
        await d.settle();
      await d.type('Найти предмет', 'меч');
    }
  },
  {
    id: '#/homebrew/sets/hb_aldersetaaaaaaaa ~ official member as gm1',
    route: '#/homebrew/sets/hb_aldersetaaaaaaaa',
    as: 'gm1',
    why: 'the book item «Палаш» picked in «Добавить предмет»: its member row, a link with «Core» and «Убрать», «1 предмет · Мастерская Ольхи» on the card, the toast «Сохранено: «Палаш»»',
    enter: async (d) => {
      for (let i = 0; i < 40 && !(await d.count('[id^="hb-card-body-"]')); i++)
        await d.settle();
      await d.type('Найти предмет', 'Палаш');
      await d.click('Палаш');
      for (let i = 0; i < 40 && !(await d.text()).includes('Сохранено: «Палаш»'); i++)
        await d.settle();
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/i/q1 ~ own set as gm1',
    route: '#/homebrew/sets/hb_aldersetaaaaaaaa',
    as: 'gm1',
    why: '«Палаш» and «Топор Тлеющих Углей» joined «Комплект Ольхи», then #/i/q1: the set line «Палаш, Топор Тлеющих Углей (HB)» and the bonus named «Комплект Ольхи», a link to the Sets tab',
    enter: async (d) => {
      for (let i = 0; i < 40 && !(await d.count('[id^="hb-card-body-"]')); i++)
        await d.settle();
      await d.type('Найти предмет', 'Палаш');
      await d.click('Палаш');
      for (let i = 0; i < 40 && !(await d.text()).includes('Сохранено: «Палаш»'); i++)
        await d.settle();
      await d.type('Найти предмет', 'Топор Тлеющих');
      await d.click('Топор Тлеющих Углей');
      for (let i = 0; i < 40 && !(await d.text()).includes('Сохранено: «Топор'); i++)
        await d.settle();
      await d.go('#/i/q1');
      for (let i = 0; i < 40 && !(await d.text()).includes('Комплект Ольхи'); i++)
        await d.settle();
    }
  },
  {
    id: '#/homebrew as gm2',
    route: '#/homebrew',
    as: 'gm2',
    why: 'an account with no homebrew: the Items tab with «Новый предмет», «Импорт из файла» alone in the tool row, and the plate «Своих предметов пока нет» with its sentence and no button'
  },
  {
    id: '#/homebrew',
    route: '#/homebrew',
    why: 'signed out: the heading and «Войдите, чтобы создавать свои предметы.» with «Войти»'
  },
  {
    id: '#/homebrew/new as gm1',
    route: '#/homebrew/new',
    as: 'gm1',
    why: 'a new item: the way back and «Новый предмет» on one row, the groups «Предмет» («Вид» on «Предмет», «Название», «Описание», «Картинка», «Ранг» on «Без ранга» then 1-4, the optional ones marked) and «Где лежит» («Источник» on «Хоумбрю» with its caption), «Связи», «Сохранить», the preview card'
  },
  {
    id: '#/homebrew/new ~ picture refused as gm1',
    route: '#/homebrew/new',
    as: 'gm1',
    why: 'a file that is not a picture chosen for «Картинка»: the dialog closed, «Не получилось открыть картинку. Выберите файл PNG, JPEG или WebP.» under the field, «Выбрать файл» and «Выбрать из предметов» kept',
    enter: async (d) => {
      await d.upload(HB_FILE('example.json'));
      for (
        let i = 0;
        i < 40 && !(await d.text()).includes('Не получилось открыть картинку');
        i++
      )
        await d.settle();
    }
  },
  {
    id: '#/homebrew/new ~ crop dialog as gm1',
    route: '#/homebrew/new',
    as: 'gm1',
    why: 'the catalog picture ci1.webp chosen: the modal «Обрезать картинку» ready, its hint, the stage group, «Масштаб», «Готово» and «Отмена»',
    enter: async (d) => {
      await d.upload(ART_FILE);
      for (let i = 0; i < 40 && !(await d.text()).includes('Масштаб'); i++) await d.settle();
    }
  },
  {
    id: '#/homebrew/new ~ picture chosen as gm1',
    route: '#/homebrew/new',
    as: 'gm1',
    why: 'a crop done and not saved: the field with «Заменить», «Обрезать заново» and «Убрать картинку», the preview card drawing the crop',
    enter: async (d) => {
      await d.upload(ART_FILE);
      for (let i = 0; i < 40 && !(await d.text()).includes('Масштаб'); i++) await d.settle();
      await d.press('Готово');
      for (let i = 0; i < 40 && !(await d.text()).includes('Обрезать заново'); i++)
        await d.settle();
    }
  },
  {
    id: '#/homebrew/new ~ picture from items open as gm1',
    route: '#/homebrew/new',
    as: 'gm1',
    why: '«Выбрать из предметов» open and «Кольцо Тишины» typed: the picker «Предмет с картинкой» focused under the buttons with its named list; the tree holds no option rows (artField.test.ts pins the filter)',
    enter: async (d) => {
      await d.press('Выбрать из предметов');
      await d.type('Найти предмет по названию...', 'Кольцо Тишины');
    }
  },
  {
    id: '#/homebrew/new ~ armour as gm1',
    route: '#/homebrew/new',
    as: 'gm1',
    why: '«Снаряжение» and «Броня»: «Ранг» * 1-4, «Показатель брони» *, the caption «Пороги урона» * over two labeled boxes «Порог Ощутимого урона» and «Порог Тяжёлого урона»',
    enter: async (d) => {
      await d.click('Снаряжение');
      await d.click('Броня');
    }
  },
  {
    id: '#/homebrew/new ~ problems as gm1',
    route: '#/homebrew/new',
    as: 'gm1',
    why: '«Снаряжение», then «Сохранить» with nothing typed: the summary «Не сохранено: исправьте 8 полей.» with a link per field, each field with its line and aria-invalid on the text fields',
    enter: async (d) => {
      await d.click('Снаряжение');
      await d.press('Сохранить');
    }
  },
  {
    id: '#/homebrew/new ~ new source as gm1',
    route: '#/homebrew/new',
    as: 'gm1',
    why: '«+ Новый источник...» chosen: the select swapped for «Новый источник» with «Создать» and «Отмена»',
    enter: async (d) => {
      await d.choose('#hb-book', '__new');
    }
  },
  {
    id: '#/homebrew/new ~ picker open as gm1',
    route: '#/homebrew/new',
    as: 'gm1',
    why: 'the fold «Связи» open and «зель» typed in «Получается из»: the field expanded and focused, the named list under it, and «Ещё N - уточните запрос» for the matches past eight; the tree holds no option rows (itemPicker.test.ts pins them and the active one)',
    enter: async (d) => {
      await d.click('Связи');
      await d.type('Получается из', 'зель');
    }
  },
  {
    id: '#/homebrew/new ~ new set as gm1',
    route: '#/homebrew/new',
    as: 'gm1',
    why: 'the fold «Связи» open and «+ Новый комплект...» chosen: the select swapped for the set form, «Название комплекта» * focused, «Бонус комплекта» *, «Создать комплект» and «Отмена», the hint',
    enter: async (d) => {
      await d.click('Связи');
      await d.choose('#hb-set', '__new');
    }
  },
  {
    id: '#/homebrew/new ~ new card as gm1',
    route: '#/homebrew/new',
    as: 'gm1',
    why: 'the fold «Связи» open and «Новая карта правил» pressed: the rule card form under «Карты правил», «Название карты» * focused, «Подзаголовок», «Текст карты» *, «Ссылка», «Создать карту» and «Отмена», the hint',
    enter: async (d) => {
      await d.click('Связи');
      await d.press('Новая карта правил');
    }
  },
  {
    id: '#/homebrew/' + HB_AXE + ' as gm1',
    route: '#/homebrew/' + HB_AXE,
    as: 'gm1',
    why: 'the axe in its editor: the path «Хоумбрю · Мастерская Ольхи · Холодное оружие · Ранг 2», the weapon fields filled, «Урон» over «Кость урона» and «Бонус к урону», the disclosure «Второй набор характеристик» closed, «Удалить», the preview card'
  },
  {
    id: '#/homebrew/' + HB_AXE + ' ~ conflict as gm1',
    route: '#/homebrew/' + HB_AXE,
    as: 'gm1',
    why: 'the axe renamed on another device, then «Сохранить»: the banner «Этот предмет изменили на другом устройстве...» with «Сохранить мою версию» and «Показать новую версию», the form as it was',
    enter: async (d) => {
      await d.fake('homebrew.updateItem', HB_AXE_ID, HB_AXE_RENAMED, null);
      await d.press('Сохранить');
    }
  },
  {
    id: '#/homebrew/' + HB_AXE + ' ~ not saved as gm1',
    route: '#/homebrew/' + HB_AXE,
    as: 'gm1',
    why: 'the network lost, then «Сохранить»: «Не получилось сохранить. Проверьте соединение...» under the buttons, the form kept',
    enter: async (d) => {
      await d.fake('setOffline', true);
      await d.press('Сохранить');
    }
  },
  {
    id: '#/homebrew/' + HB_RING + ' ~ deleted as gm1',
    route: '#/homebrew/' + HB_RING,
    as: 'gm1',
    why: '«Удалить» with the confirm accepted: back on «3 предмета из 100» with the toast «Предмет «Кольцо с гравировкой» удалён»',
    enter: async (d) => {
      await d.press('Удалить');
    },
    /* a 1600ms toast; arrived at afresh per language - see this file's header */
    timed: true
  },
  {
    id: '#/homebrew/' + HB_CAP + ' as gm1',
    route: '#/homebrew/' + HB_CAP,
    as: 'gm1',
    why: 'the English-only cap in the Russian interface: the labels in Russian, «Название» holding «Whispering Cap», «Ранг» on 2'
  },
  {
    id: '#/homebrew ~ add to list as gm1',
    route: '#/homebrew',
    as: 'gm1',
    why: "the axe ticked: the selection bar «Выбрано 1» with its «В список» menu open on gm1's lists",
    enter: async (d) => {
      await d.tick('Топор Тлеющих Углей');
      await d.click('В список');
    },
    again: (d) => d.click('Add to list')
  },
  {
    id: '#/homebrew/' + HB_AXE + ' ~ add to list as gm1',
    route: '#/homebrew/' + HB_AXE,
    as: 'gm1',
    why: "the preview card's «В список» pressed: its menu open on gm1's lists, the form unchanged",
    enter: async (d) => {
      await d.click('В список');
    },
    again: (d) => d.click('Add to list')
  },
  {
    id: '#/homebrew/' + HB_AXE + ' ~ second set as gm1',
    route: '#/homebrew/' + HB_AXE,
    as: 'gm1',
    why: 'the disclosure «Второй набор характеристик» open, its hint closed behind its «?», «Проворность» pressed in it, then «Сохранить»: «Не сохранено: исправьте 3 поля.», three lines that name «Очистить второй набор», and that button',
    enter: async (d) => {
      await d.click('Второй набор характеристик');
      await d.click('Проворность', 1);
      await d.press('Сохранить');
    }
  },
  {
    id: '#/homebrew/' + HB_AXE + ' ~ second set cleared as gm1',
    route: '#/homebrew/' + HB_AXE,
    as: 'gm1',
    why: 'the same, then «Очистить второй набор»: the disclosure open with nothing pressed and the die on «Кость», no summary, no error line, no clear button',
    enter: async (d) => {
      await d.click('Второй набор характеристик');
      await d.click('Проворность', 1);
      await d.press('Сохранить');
      await d.click('Очистить второй набор');
    }
  },
  {
    id: '#/homebrew/' + HB_AXE + ' ~ relations as gm1',
    route: '#/homebrew/' + HB_AXE,
    as: 'gm1',
    why: 'the fold «Связи · 6» filled: «В линии» with «Палаш» and «линия из 4 рангов», «Улучшается до» «Длинный Меч», «Получается из» «Первоклассный Спальный Мешок», «Комплект» on «Пылающие близнецы», «Карты правил» «Клеймо Ольхи» and «Медленный»; the preview with four other rungs of the ladder, both craft lines, the two linked members of the set line and its bonus, two rule card folds; the tree holds neither the current rung of the axe «2 HB» nor its inert set entry «Топор Тлеющих Углей (HB)» (both spans, which the golden drops); homebrewEditor.test.ts pins «2 HB», record.test.ts an own inert «(HB)» entry',
    enter: async (d) => {
      await d.click('Связи');
      await d.click('В линии');
      await d.type('Линия, в которую встаёт предмет', 'Палаш');
      await d.click('Палаш');
      await d.type('Улучшается до', 'Длинный Меч');
      await d.click('Длинный Меч');
      await d.type('Получается из', 'Первоклассный Спальный');
      await d.click('Первоклассный Спальный Мешок');
      await d.choose('#hb-set', 'ember-spark');
      await d.type('Карты правил', 'Клеймо');
      await d.click('Клеймо Ольхи');
      await d.type('Карты правил', 'Медленный');
      await d.click('Медленный');
    }
  },
  {
    id: '#/i/' + HB_AXE + ' as gm1',
    route: '#/i/' + HB_AXE,
    as: 'gm1',
    why: 'an own item on its page: the path line, the tag «Мастерская Ольхи (HB)», «Изменить» after «Печать»'
  },
  {
    id: '#/i/' + HB_AXE + ' ~ read failed as gm1',
    route: '#/i/' + HB_AXE,
    as: 'gm1',
    hold: 'own:fail',
    why: "the author's items did not load: the title «Не получилось загрузить ваши предметы», the alert and the primary «Повторить», no not-found page"
  },
  {
    id: '#/i/' + HB_AXE,
    route: '#/i/' + HB_AXE,
    why: 'the same key signed out: «Предмета по этому адресу нет», the address in the sentence'
  },
  {
    id: '#/tables/homebrew as gm1',
    route: '#/tables/homebrew',
    as: 'gm1',
    why: 'the own items as a table: the group chip «Хоумбрю» last and on, the source chips «Мастерская Ольхи» (on, the first) and «Хоумбрю» under it, no filter strip (one item cannot be narrowed), the heading «Холодное оружие» with the axe, the grid of the account view'
  },
  {
    id: '#/tables/homebrew/f_src-hb as gm1',
    route: '#/tables/homebrew/f_src-hb',
    as: 'gm1',
    why: 'the source chip «Хоумбрю» by link: the chip on, the heading «Хоумбрю» with the three items, the filter button with the panel folded'
  },
  {
    id: '#/tables/homebrew/f_src-hb ~ filters open as gm1',
    route: '#/tables/homebrew/f_src-hb',
    as: 'gm1',
    why: "the column on the «Хоумбрю» tab: «Тип» with the tab's two kinds «Предметы» and «Расходники», no «Снаряжение», no «Раздел»"
  },
  {
    id: '#/tables/homebrew/f_src-hb_alderworkshopaaa.kind-item as gm1',
    route: '#/tables/homebrew/f_src-hb_alderworkshopaaa.kind-item',
    as: 'gm1',
    why: 'a kind the chip holds no item of, by link: the chip «Мастерская Ольхи» on, the panel open with «Тип» holding «Предметы» (kept by the pick) and «Снаряжение», the pill «Предметы», «0 из 1», «Ничего не найдено» with «Сбросить всё»'
  },
  {
    id: '#/tables/homebrew/f_sect-hb_sectbladesaaaaaa as gm1',
    route: '#/tables/homebrew/f_sect-hb_sectbladesaaaaaa',
    as: 'gm1',
    why: 'a section filter by link: the chip «Мастерская Ольхи» of the section on, the panel open with «Раздел» only (the chip holds one kind), the pill «Холодное оружие», one row'
  },
  {
    id: '#/tables/homebrew as gm2',
    route: '#/tables/homebrew',
    as: 'gm2',
    why: 'an account with no own item: «Своих предметов пока нет.» and «Новый предмет»'
  },
  {
    id: '#/tables/homebrew',
    route: '#/tables/homebrew',
    why: 'signed out: no «Хоумбрю» group chip, the prompt «Войдите, чтобы видеть свои предметы в таблицах.» with «Войти», no toolbar'
  },
  {
    id: '#/tables/eq_weapon as gm1',
    route: '#/tables/eq_weapon',
    as: 'gm1',
    why: 'own equipment in the weapons table: the axe in «Ранг 2» after the catalog weapons, the switch «Свои предметы» on after the view switch'
  },
  {
    id: '#/tables/eq_weapon ~ own items hidden as gm1',
    route: '#/tables/eq_weapon',
    as: 'gm1',
    why: 'the switch «Свои предметы» turned off: the switch unchecked, the axe gone from «Ранг 2»',
    enter: async (d) => {
      await d.tick('Свои предметы');
    }
  },
  {
    id: '#/tables/eq_weapon/f_src-hb_alderworkshopaaa as gm1',
    route: '#/tables/eq_weapon/f_src-hb_alderworkshopaaa',
    as: 'gm1',
    why: 'an own source in the weapons filter by link: the panel open, «Мастерская Ольхи» last in «Источник», the pill «Мастерская Ольхи», the axe alone, the switch «Свои предметы» on'
  },
  {
    id: '#/search ~ own items as gm1',
    route: '#/search',
    as: 'gm1',
    why: '«топор» typed: the axe ranked with the 13 catalog matches; the intro ends «И 4 ваших предмета.»; «Все» and the three kinds in the kind row and the switch «Свои предметы» on after them',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'топор');
    }
  },
  {
    id: '#/search ~ own items hidden as gm1',
    route: '#/search',
    as: 'gm1',
    why: 'the same, then the switch «Свои предметы» turned off: the 13 catalog matches alone, the intro sentence kept',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'топор');
      await d.tick('Свои предметы');
    }
  },
  /* gm3 holds 34 items that name catalog records: 15 made from ci1, 15 in q1's line,
     4 in saints-ensemble - the own relations a catalog card marks and folds
     (docs/specs/FEATURES.md, "Records") - and a chain of 5 own items that names none. */
  {
    id: '#/i/ci1 as gm3',
    route: '#/i/ci1',
    as: 'gm3',
    why: '«Улучшается до» «Мешок спокойных снов (HB)», «Спальный мешок дозорного (HB)», the 120-code-point name with «(HB)», then «и ещё 12» unpressed'
  },
  {
    id: '#/i/ci1 ~ more as gm3',
    route: '#/i/ci1',
    as: 'gm3',
    why: 'the same, «и ещё 12» pressed: all 15 names by name, each with «(HB)», then «свернуть» expanded',
    enter: async (d) => {
      await d.click('и ещё 12');
    }
  },
  {
    id: '#/i/q1 as gm3',
    route: '#/i/q1',
    as: 'gm3',
    why: '«Ранг» 1 (current), three «1 HB» rungs named «Учебный палаш 1 (HB)» to «Учебный палаш 3 (HB)», 2, 3, 4, then «и ещё 12»'
  },
  {
    id: '#/i/q1 ~ more as gm3',
    route: '#/i/q1',
    as: 'gm3',
    why: 'the same, «и ещё 12» pressed: the 19 rungs in tier order, the catalog rung first in each tier, then «свернуть» expanded',
    enter: async (d) => {
      await d.click('и ещё 12');
    }
  },
  {
    id: '#/i/voa4_t3d as gm3',
    route: '#/i/voa4_t3d',
    as: 'gm3',
    why: '«Комплект» «Святой Щит» (current), «Святой Клинок», «Святое Облачение», «Святой Венец (HB)», «Святой Пояс (HB)», «Святые Перчатки (HB)», «и ещё 1»; the bonus «Убранство Святого: ...»'
  },
  {
    id: '#/search ~ relations as gm3',
    route: '#/search',
    as: 'gm3',
    why: '«спальный мешок» typed: the catalog matches and the own bedrolls ranked together; no row draws a relation line',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'спальный мешок');
    }
  },
  {
    id: '#/search ~ relations, dialog as gm3',
    route: '#/search',
    as: 'gm3',
    why: "«спальный мешок» typed, ci1's row pressed: the dialog's «Улучшается до» with three «Хоумбрю» badges and «и ещё 12»",
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'спальный мешок');
      await d.click('Первоклассный');
    }
  },
  {
    id: '#/account ~ pinned table as gm2',
    route: '#/account',
    as: 'gm2',
    storage: { 'dhloot.home.v1': '#/tables/dread' },
    why: "the Display section's starting section reads «Таблицы» for a pinned table; «Ваши данные» under «Способы входа»"
  },
  {
    id: '#/tables/dread as gm1',
    route: '#/tables/dread_gm_toolbox',
    as: 'gm1',
    why: "the account's tables view: the grid, where signed out the list is drawn"
  },
  {
    id: TWO + ' as gm1',
    route: TWO,
    as: 'gm1',
    why: "the account's print layout: black and white on the compact sheet, where gm2 reads color on the standard sheet",
    enter: sheet
  },
  {
    id: TWO + ' ~ colour for this visit as gm1',
    route: TWO,
    as: 'gm1',
    why: "a page pick away from the account's default: color on the compact sheet; the note under the bar",
    enter: async (d) => {
      await sheet(d);
      await d.click('Цветная');
    }
  },
  {
    id: '#/p/set-ownitems as gm1',
    route: '#/p/set-ownitems',
    as: 'gm1',
    why: 'two own items of gm1 in a set another account made, on the black-and-white compact sheet: the axe with its stat block, the potion; each source line the path, «Мастерская Ольхи · Холодное оружие» and «Хоумбрю»',
    enter: sheet
  },
  {
    id: '#/p/set-emberaxe ~ colour for this visit as gm1',
    route: '#/p/set-emberaxe',
    as: 'gm1',
    why: "an own item's picture on print: the axe's color card draws its picture (the catalog's ci1.webp, seeded), as print.js pins",
    enter: async (d) => {
      await sheet(d);
      await d.click('Цветная');
    }
  },
  {
    id: '#/p/set-ownitems ~ colour for this visit as gm1',
    route: '#/p/set-ownitems',
    as: 'gm1',
    why: 'the same two own items in color on the compact sheet; the note under the bar',
    enter: async (d) => {
      await sheet(d);
      await d.click('Цветная');
    }
  },
  {
    id: '#/p/set-emberaxe as gm2',
    route: '#/p/set-emberaxe',
    as: 'gm2',
    why: "gm1's axe in a set made by another account, read by gm2 on the standard color sheet, its source line the path",
    enter: sheet
  },
  /* gm4's «Свиток Узоролиста»: every construct of the formatted text
     (docs/specs/FEATURES.md, "Records", "Formatted text"). */
  {
    id: ITEM_MARKUP + ' ~ markup as gm4',
    route: ITEM_MARKUP,
    as: 'gm4',
    why: 'the author: the card draws «Раз за отдых:» bold, «узор» italic, a bulleted list of two, a numbered list of two and a table «Бросок» / «Ответ» of two rows with «Да» bold'
  },
  {
    id: '#/search ~ markup row as gm4',
    route: '#/search',
    as: 'gm4',
    why: '«узоролист» typed: the one own row, its description one clamped run with «Раз за отдых:» bold, «• » list lines, «1. » lines and the table rows «Бросок | Ответ»',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию...', 'узоролист');
    }
  },
  {
    id: '#/p/set-clipped1 as gm2',
    route: '#/p/set-clipped1',
    as: 'gm2',
    why: "gm4's item at the 3000-character text on the standard color sheet: the card cut off, the warning box «Текст не помещается на карточки при печати: 1. ...» in the bar before the gray note, «Отправить на печать» enabled",
    enter: async (d) => {
      await sheet(d);
      for (let i = 0; i < 40 && !(await d.text()).includes('Текст не помещается'); i++)
        await d.settle();
    }
  },
  {
    id: '#/p/set-longsrc1 as gm2',
    route: '#/p/set-longsrc1',
    as: 'gm2',
    why: "gm4's item with an 80-code-point source and section on the standard color sheet: the source line wraps right-aligned beside «Daggerheart», the art block draws the kind glyph on the light print well",
    enter: sheet
  },
  {
    id: '#/p/set-longsrc1 ~ compact as gm2',
    route: '#/p/set-longsrc1',
    as: 'gm2',
    why: 'the same card on the compact color sheet: the source line still inside the card',
    enter: async (d) => {
      await sheet(d);
      await d.click('Компактная');
    }
  },
  {
    id: '#/p/set-markup01 as gm4',
    route: '#/p/set-markup01',
    as: 'gm4',
    why: 'the formatted item on print: bold, italic, both lists as lists and the table inside the text block, on the standard color sheet',
    enter: sheet
  },
  /* The formatted text boxes and the two languages of a homebrew form
     (docs/specs/FEATURES.md, "Consistency rules", rule 18; "Homebrew", "Language"). The
     form's own «EN» is the second control of that name: the header's switch comes first. */
  {
    id: '#/homebrew/' + HB_AXE + ' ~ formatted draft as gm1',
    route: '#/homebrew/' + HB_AXE,
    as: 'gm1',
    why: 'the description replaced by a text with bold, italic, a bulleted list and a 2-column table of two rows: the live card draws them on that input, the form dirty and unsaved',
    enter: async (d) => {
      await d.type(
        'Описание',
        '**Тлеет** под дождём, *шипит* на снегу.\n- Поджигает сухую траву.\n- Греет руки.\n| Бросок | Эффект |\n|---|---|\n| 1-3 | Искры |\n| 4-6 | Пламя |'
      );
    }
  },
  /* The editor's print view (docs/specs/FEATURES.md, "Homebrew"): the print card in the
     visit's layout, gm1's Display default black and white, compact. */
  {
    id: '#/homebrew/' + HB_AXE + ' ~ print preview as gm1',
    route: '#/homebrew/' + HB_AXE,
    as: 'gm1',
    why: '«На печати» of «Показать карточку» pressed: the print groups on «Чёрно-белая» and «Компактная», the 44x63 mm black-and-white print card in place of the screen card, no «В список», no warning',
    enter: async (d) => {
      await d.click('На печати');
    }
  },
  {
    id: '#/homebrew/new ~ print preview clipped as gm1',
    route: '#/homebrew/new',
    as: 'gm1',
    why: 'a name and a 3000-character «Описание», «На печати», then «Цветная»: the compact color print card cut off, the warning box «Текст не помещается на карточку при печати...» after «3000 / 3000», «Сохранить» enabled',
    enter: async (d) => {
      await d.type('Название', 'Свиток долгой ночи');
      await d.type('Описание', CLIPPED_TEXT);
      await d.click('На печати');
      await d.click('Цветная');
      for (let i = 0; i < 40 && !(await d.text()).includes('Текст не помещается'); i++)
        await d.settle();
    }
  },
  {
    id: '#/homebrew/' + HB_AXE + ' ~ english as gm1',
    route: '#/homebrew/' + HB_AXE,
    as: 'gm1',
    why: '«EN» of «Язык текста» pressed in the Russian interface: «Ember Axe» and the English description in the boxes, each with lang="en", the card in English with its English badges, the labels in Russian',
    enter: async (d) => {
      await d.click('EN', 1);
    }
  },
  {
    id: '#/homebrew/rules ~ new card preview as gm1',
    route: '#/homebrew/rules',
    as: 'gm1',
    why: '«Новая карта правил», a name and a formatted text typed, «Просмотр» pressed: the pane «Просмотр: Текст карты» draws bold, italic and a list in place of the box, the five format buttons disabled',
    enter: async (d) => {
      await d.press('Новая карта правил');
      await d.type('Название карты', 'Почта из пергамента');
      await d.type(
        'Текст карты',
        '***Доставка:*** письмо прибудет после **продолжительного отдыха**.\n- Птица не летит сквозь бурю.\n- Адресат может *ответить* на обороте.'
      );
      await d.press('Просмотр');
    }
  },
  {
    id: '#/homebrew/rules ~ duplicate in english as gm1',
    route: '#/homebrew/rules',
    as: 'gm1',
    why: 'a new card named «Alder Brand» in English and given a Russian text, then «Создать карту»: the form switched to «EN», «Карта правил «Alder Brand» уже есть.» under the name, nothing made',
    enter: async (d) => {
      await d.press('Новая карта правил');
      await d.click('EN - пусто');
      await d.type('Название карты', 'Alder Brand');
      await d.click('RU - пусто');
      await d.type('Текст карты', 'Цель горит.');
      await d.press('Создать карту');
    }
  },
  {
    id: SHOP + ' ~ own item preview as gm1',
    route: SHOP,
    as: 'gm1',
    why: '«Свой предмет» with a formatted description and «Просмотр» pressed: the pane under the toolbar of four format buttons, no «Язык текста»',
    enter: async (d) => {
      await d.click('Добавить свой предмет');
      await d.type('Название', 'Фляга контрабандиста');
      await d.type('Описание', '**Двойное дно:** во второй половине *можно* спрятать письмо.');
      /* The note areas are closed, so the quick item's «Просмотр» is the page's only one. */
      await d.press('Просмотр');
    }
  },
  {
    id: '#/h/00000000-0000-4000-8000-000000000513 as gm1',
    route: '#/h/00000000-0000-4000-8000-000000000513',
    as: 'gm1',
    why: 'the English-only cap on its page: «Текст только на английском» over its text, the text lang="en", in the Russian half; the English half draws no line'
  }
];

module.exports = {
  STATES,
  LANGS,
  HB_FILE,
  IMPORT,
  hbImportOpen,
  importOpen,
  heldNamesFile,
  longNamesFile
};
