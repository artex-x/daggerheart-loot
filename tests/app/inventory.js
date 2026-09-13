/* The durable copy of "everything a person can reach" - carried independently
 * of tests/parity/specs.js so it survives R0c's deletion of that file (issue
 * 47, "R0a planned: the evidence, the sweep, and the structural goldens").
 *
 * STATES below is a verbatim copy of specs.js's STATES array, together with
 * exactly the module-level constants it reads: the print routes, PACKED, the
 * button-name dictionary NAME (used inside several `enter` closures), the
 * fixture requires, and the storage seeds. Not SPECS, not ACCEPTED, not
 * VISUAL_DEBT, not EQUIPMENT_ENTRY - those retire with the harness in R0c.
 * tests/app/golden.js is the only reader; tests/app/lib.js's `fresh()` and
 * `makeDriver` do the rest.
 *
 * While tests/parity/specs.js still exists, the guard at the bottom keeps
 * this copy honest against it, by id and route - it retires itself once that
 * file is gone.
 */
const fs = require('fs');
const path = require('path');

/** Both notes on the list and both on one entry - the shared page's own
 *  noted state, and the payload `PACKED` below decompresses to. */
const NOTES_BOTH_KINDS = require('../../docs/fixtures/lists/notes-both-kinds.json');
/** Quantity and price on the shared page's rows - all three tail shapes. */
const QTY_AND_PRICE = require('../../docs/fixtures/lists/qty-and-price.json');
/** The real catalogue, for the print states that need a route built rather
 *  than typed by hand (the 181-id cap) - generated from `data.js`,
 *  `tests/derived.js` keeps the two equal. */
const LOOT = require('../../data.json');

/* The print routes, built once and shared between the states below and the
 * specs that key off their ids by name - `tests/print.js`'s own long-text
 * set for LONG. */
const NINE = '#/print/ci1-q1-q313-cc1-voa2_a3-q23-w51-q35-di11';
const LONG =
  '#/print/voa2_a3-voa2_a1-voa2_c4-voa2_c3-voa2_t4e-voa2_t4d-voa2_c1-voa2_a6-di11';
const TEN = '#/print/' + Array.from({ length: 10 }, (_, i) => 'ci' + String(i + 1)).join('-');
const TOO_MANY =
  '#/print/' +
  Object.values(LOOT.items)
    .flat()
    .slice(0, 181)
    .map((x) => x.id)
    .join('-');
const TOO_MANY_ID = '#/print/<181 ids> ~ too many';

/**
 * The packed form of `NOTES_BOTH_KINDS.gm.raw`, pasted rather than computed at
 * run time - computing it here would let a regression in the pack path pass
 * unnoticed, and the live app's own `sharedListLink` output must not stand in
 * for it either, for the same reason. Computed once, by hand:
 *
 *   node -e "const z=require('zlib');const f=require('./docs/fixtures/lists/notes-both-kinds.json');console.log('~'+z.deflateRawSync(Buffer.from(f.gm.raw,'utf8')).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''))"
 *
 * Verified in planning: `inflateRawSync` of it re-encodes to exactly
 * `NOTES_BOTH_KINDS.gm.payload`. Node's deflate bytes differ from Chrome's
 * `CompressionStream` output, but both are raw deflate, which
 * `DecompressionStream('deflate-raw')` reads either of.
 */
const PACKED =
  '~JY2hDsIwFAD9PqKrH5AUwwfVMIXCLqNIBAkWQUKCL6xkpdB-w70_IgN5d-K44nmRiaRquVhttuvOtmZmralU09Wc8TxIeM2IJ0kvB3ETBoqWvTjp8aqruVEY5Ugk67kmUcj_yh1PJhBlJ041tjU1JyKBTNFEBukp04WP-tULhUDgyXvSXw';

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
    addToList: 'Добавить в список',
    stepDown: 'На единицу меньше',
    stepUp: 'На единицу больше',
    pinSection: 'Открывать этот раздел при запуске',
    filters: 'Фильтры',
    itemsChip: 'Предметы',
    resetFilter: 'Сбросить всё',
    filterLink: 'Ссылка на фильтры',
    copySel: 'Скопировать',
    clearSel: 'Снять выделение',
    selected: 'Выбрано',
    share: 'Поделиться',
    del: 'Удалить',
    restore: 'Восстановить',
    importPh: 'Ссылка на список',
    note: 'Заметка',
    removeItem: 'Убрать из списка',
    undo: 'Вернуть',
    noteClear: 'Очистить заметку',
    sharePlayers: 'Ссылка игрокам',
    shareGm: 'Ссылка себе',
    rollBy: 'Бросок по списку',
    moneyCoin: 'Монетами',
    rename: 'Название списка',
    position: 'Позиция в списке',
    whatIsThis: 'Как это работает',
    printHint: 'Собрать карточки для печати: девять на лист A4',
    printLink: 'Ссылка на набор',
    pickRow: 'Выбрать позицию',
    prices: 'Цены',
    /* Exact, not the default fuzzy match: the action row's own delete-list
       button is named exactly "Удалить", and `d.click()` prefers an exact
       match at every index - the plain name would delete the list instead. */
    delOne: 'Удалить (1)',
    clearPriceOne: 'Убрать цену (1)',
    applyPrices: 'Проставить эти цены',
    discount: 'Сделать скидку',
    /* The chip's own text carries the "+ " - `d.click` needs the exact string
       because the EN press has already renamed it by the time a press spec
       runs. */
    newList: '+ Новый список',
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
    pinSection: 'Open this section on start',
    filters: 'Filters',
    itemsChip: 'Items',
    resetFilter: 'Reset all',
    filterLink: 'Filter link',
    copySel: 'Copy',
    clearSel: 'Clear selection',
    selected: 'Selected',
    share: 'Share',
    del: 'Delete',
    restore: 'Restore',
    importPh: 'Paste a list link',
    note: 'Note',
    removeItem: 'Remove from the list',
    undo: 'Undo',
    noteClear: 'Clear the note',
    /* A curly apostrophe, the way the live app prints it - not a plain one. */
    sharePlayers: 'Players’ link',
    shareGm: 'Your own link',
    rollBy: 'Roll on this list',
    moneyCoin: 'In coins',
    rename: 'List name',
    position: 'Position in the list',
    whatIsThis: 'How this works',
    printHint: 'Lay these out for printing: nine to an A4 sheet',
    printLink: 'Link to this set',
    pickRow: 'Select entry',
    prices: 'Prices',
    delOne: 'Delete (1)',
    clearPriceOne: 'Clear price (1)',
    applyPrices: 'Set these prices',
    discount: 'Discount',
    newList: '+ New list',
    create: 'Create'
  }
};

const LANGS = ['ru', 'en'];

/* Storage seeds for the list states below. A state that needs a list to
   exist cannot be entered - every state opens a fresh page whose `prepare()`
   clears storage - so it is seeded instead, the way tests/select.js and
   tests/lists2.js already do on the live app. */
const LISTS = [
  { id: 'a', name: 'Клад дракона', ids: [], created: 1 },
  { id: 'b', name: 'Лавка в порту', ids: [], created: 2 }
];
const two = { 'dhloot.lists.v2': JSON.stringify(LISTS) };
const inList = {
  'dhloot.lists.v2': JSON.stringify([{ ...LISTS[0], ids: ['ci1'] }, LISTS[1]])
};
const eight = {
  'dhloot.lists.v2': JSON.stringify([
    ...LISTS,
    ...Array.from({ length: 6 }, (_, i) => ({
      id: 'x' + String(i),
      name: 'Лавка №' + String(i + 1),
      ids: [],
      created: 10 + i
    }))
  ])
};

/* The lists index's own seed: one card with six thumbnails and a badge of 7,
   one empty card - `plan.md`, "B5.3 planned", "Parity states". */
const seven = {
  'dhloot.lists.v2': JSON.stringify([
    { ...LISTS[0], ids: ['ci1', 'ci2', 'ci3', 'ci4', 'ci5', 'ci6', 'ci7'] },
    LISTS[1]
  ])
};

/* The list page's own seed: a priced, counted, noted entry, and a list note
   both public and hidden - `plan.md`, "B5.4 planned". */
const noted = {
  'dhloot.lists.v2': JSON.stringify([
    {
      ...LISTS[0],
      ids: ['ci1', 'ci2', 'ci3', 'ci4', 'ci5', 'ci6', 'ci7'],
      meta: {
        ci2: { qty: 2, gold: 750, note: 'Светится в темноте', hnote: 'Проклят' }
      },
      note: 'Лавка закрыта до утра'
    },
    LISTS[1]
  ])
};

/* The empty list, on its own - `#/lists/b`. */
const oneEmpty = { 'dhloot.lists.v2': JSON.stringify([LISTS[1]]) };

const STATES = [
  { id: '#/i/ci1', route: '#/i/ci1', why: 'a loot record' },
  { id: '#/i/q1', route: '#/i/q1', why: 'an equipment record' },
  {
    id: '#/i/nope',
    route: '#/i/nope',
    why: 'the not-found record page: "Предмет не найден", the sub line, the "На главную" button'
  },
  { id: '#/roll/wondrous', route: '#/roll/wondrous', why: 'a roll on a table with a real die' },
  { id: '#/roll/dread', route: '#/roll/dread', why: 'a roll on a table with no die of its own' },

  /* The card over the page it was opened from. Reached by pressing the picture
     on a result, which is the only way in, and drawn by neither route. */
  {
    id: '#/roll/wondrous ~ modal',
    route: '#/roll/wondrous',
    why: 'the card opened over the roll',
    enter: async (d) => {
      await d.click('Страница');
    }
  },

  /* The explanation above the control, which is folded away until it is asked
     for. Four paragraphs and a link to the book, none of it on a first paint. */
  {
    id: '#/roll/wondrous ~ help',
    route: '#/roll/wondrous',
    why: 'the help panel, unfolded',
    enter: async (d) => {
      await d.click('Как это работает');
    }
  },

  /* The stepper, which is the other way to choose a row and the one a person
     uses when they rolled a real die and want the next entry. Deterministic,
     unlike the roll button - which cannot be compared by its result, because
     the live app's randomness cannot be seeded from here. */
  {
    id: '#/roll/wondrous ~ stepped',
    route: '#/roll/wondrous',
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
    route: '#/roll/wondrous',
    why: 'the section pinned as the one to open on',
    enter: async (d) => {
      await d.click('Открывать этот раздел при запуске');
    },
    /* a 1600ms toast; arrived at afresh per width - see docs/parity.md, 'Timed states' */
    timed: true
  },

  /* Below the fold. A record card is taller than the window, so the picture,
     the badges and the name were being compared and the description, the craft
     chain, the references and the footer were not. */
  { id: '#/i/ci1 ~ whole', route: '#/i/ci1', why: 'a record page end to end', whole: true },

  /* A rung of the tier ladder. Улучшенный, Продвинутый and Легендарный are the
     same weapon at four tiers and the ladder is how a person moves between
     them; it opens the other rung over this page rather than navigating, so no
     route draws it. It went unported for weeks behind a debt whose reason
     named only the add-to-list row. */
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
      await d.click('Скопировать название');
    },
    /* a 1600ms toast; arrived at afresh per width - see docs/parity.md, 'Timed states' */
    timed: true
  },

  /* The add-to-list menu, off `listMenuHTML` in app.js. Each seeds its own
     storage - a list state cannot be entered, only seeded, since every
     state opens a fresh page whose `prepare()` clears it. */
  {
    id: '#/i/ci1 ~ list menu',
    route: '#/i/ci1',
    why: 'the menu open under the card, newest list first',
    storage: two,
    enter: async (d) => {
      await d.click('Добавить в список');
    }
  },
  {
    id: '#/i/ci1 ~ in a list',
    route: '#/i/ci1',
    why: 'the chip lit for a list the record is already in',
    storage: inList,
    enter: async (d) => {
      await d.click('Добавить в список');
    }
  },
  {
    id: '#/i/ci1 ~ many lists',
    route: '#/i/ci1',
    why: 'the search box, once there are more lists than fit without one',
    storage: eight,
    enter: async (d) => {
      await d.click('Добавить в список');
      await d.type('Найти список', 'порту');
    }
  },
  {
    id: '#/i/ci1 ~ new list',
    route: '#/i/ci1',
    why: 'the inline form, both apps focusing the same input',
    storage: two,
    enter: async (d) => {
      await d.click('Добавить в список');
      await d.click('+ Новый список');
    }
  },

  { id: '#/roll/std', route: '#/roll/std', why: 'Core rules' },

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
    why: 'the help panel with bold lines inside a paragraph',
    enter: async (d) => {
      await d.click('Как это работает');
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
  { id: '#/roll/alt', route: '#/roll/alt', why: 'the alternate tables' },

  /* The critical-success box, which no route draws: the page opens on Hope 1
     and Fear 2, and stepping Hope up puts the two dice level. It carries the
     links into the tables and the offer of a rarity above this one, so it is
     the whole reason this mode is not just another roll. */
  {
    id: '#/roll/alt ~ crit',
    route: '#/roll/alt',
    why: 'the two dice agreeing, which is the offer of a whole rarity',
    enter: async (d) => {
      await d.click('На единицу больше');
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
  { id: '#/roll/voa', route: '#/roll/voa', why: 'Vault of Ages' },
  { id: '#/roll/community', route: '#/roll/community', why: 'communities' },

  /* The picker is the whole point of these two, and it is a state: the length
     of the roll, the die on the button and the card underneath all change with
     it, and the opening section shows none of that. Artifacts because it is the
     division that is not a tier, and the second community because picking one
     at all has to put the roll back to 1. */
  {
    id: '#/roll/voa ~ artifacts',
    route: '#/roll/voa',
    why: 'a division of the book that is not a tier',
    enter: async (d) => {
      await d.click('Артефакты');
    }
  },
  {
    id: '#/roll/community ~ second',
    route: '#/roll/community',
    why: 'a community other than the one it opens on',
    enter: async (d) => {
      await d.click('Научное');
    }
  },
  {
    id: '#/tables/wondrous',
    route: '#/tables/wondrous',
    why: 'the first table with a filter: the strip folded, nothing picked'
  },
  {
    id: '#/tables/wondrous ~ panel open',
    route: '#/tables/wondrous',
    why: 'the filter panel, unfolded and empty',
    enter: async (d) => {
      await d.click('Фильтры');
    }
  },
  {
    id: '#/tables/wondrous ~ filtered',
    route: '#/tables/wondrous',
    why: 'a value picked, which narrows the table and writes the address',
    enter: async (d) => {
      await d.click('Фильтры');
      /* Not "Equipment" - that word is also the equipment nav chip's, and a
         click by name finds the link before the panel's own chip. */
      await d.click('Предметы');
    }
  },
  {
    id: '#/tables/wondrous ~ filter link',
    route: '#/tables/wondrous/f_kind-item',
    why: 'arriving at a filter link, which opens the panel with that value picked'
  },
  {
    id: '#/tables/wondrous ~ nothing found',
    route: '#/tables/wondrous',
    why: 'a filter and a query together leaving nothing, with the empty state\'s own reset',
    enter: async (d) => {
      await d.click('Фильтры');
      await d.click('Предметы');
      await d.type('Поиск по названию или описанию…', 'zzzqqqxx123');
    }
  },
  { id: '#/tables/dread', route: '#/tables/dread', why: 'the second table with a kind row, and the smallest' },
  { id: '#/tables', route: '#/tables', why: 'the table index, which is core_item' },
  {
    id: '#/tables/hnf_consumable',
    route: '#/tables/hnf_consumable',
    why: 'a second table: the chosen chip moves, and the sub-row changes'
  },
  {
    id: '#/tables ~ grid',
    route: '#/tables',
    why: 'the grid view, a different body entirely',
    enter: async (d) => {
      await d.click('Сеткой');
    }
  },
  {
    id: '#/tables ~ searched',
    route: '#/tables',
    why: 'a query that narrows the table',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию…', 'кольцо');
    }
  },
  {
    id: '#/tables ~ nothing found',
    route: '#/tables',
    why: 'the empty state, which no route draws',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию…', 'zzzqqqxx123');
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
    id: '#/tables ~ a row opened, list menu',
    route: '#/tables',
    why: 'the add-to-list menu inside the modal, and which side of the button it opens on',
    storage: two,
    enter: async (d) => {
      await d.click('Кольцо Тишины');
      await d.click('Добавить в список');
    }
  },
  {
    id: '#/tables ~ a row opened, new list',
    route: '#/tables',
    // No `storage`: with the `two` seed every card opens up and the
    // divergence is never reached. With no lists seeded, Самоцвет Чутья
    // sits inside the 17px band at 1100 where the rewrite re-measures the
    // menu from its already-flipped side and sends it under the card's edge.
    why: 'the new-list form inside the modal, and which side the menu keeps when it grows - the rewrite re-measured from the flipped side and sent it under the card\'s edge',
    enter: async (d) => {
      await d.click('Самоцвет Чутья');
      await d.click('Добавить в список');
      await d.click('+ Новый список');
    }
  },
  {
    id: '#/tables ~ a row ticked',
    route: '#/tables',
    why: 'the bar, one row ticked',
    enter: async (d) => {
      await d.click('Выбрано');
    }
  },
  {
    id: '#/tables ~ bar menu',
    route: '#/tables',
    why: "the bar's own add-to-list menu, above it, right-aligned",
    storage: two,
    enter: async (d) => {
      await d.click('Выбрано');
      await d.click('Выбрано', 1);
      await d.click('Добавить в список');
    }
  },
  {
    id: '#/tables ~ selection copied',
    route: '#/tables',
    why: 'what the app says after copying the selection',
    enter: async (d) => {
      await d.click('Выбрано');
      await d.click('Скопировать');
    },
    /* a 1600ms toast; arrived at afresh per width - see docs/parity.md, 'Timed states' */
    timed: true
  },
  {
    id: '#/tables ~ help',
    route: '#/tables',
    why: 'the help panel, which uses a bold word mid-sentence twice over',
    enter: async (d) => {
      await d.click('Как это работает');
    }
  },
  {
    id: '#/tables/eq_weapon',
    route: '#/tables/eq_weapon',
    why: 'the biggest table: four tier sections, .fcount 317, the strip folded'
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
    id: '#/tables/eq_weapon ~ panel open',
    route: '#/tables/eq_weapon',
    why: 'seven rows, the widest panel the app has',
    enter: async (d) => {
      await d.click('Фильтры');
    }
  },
  {
    id: '#/tables/eq_weapon ~ filtered',
    route: '#/tables/eq_weapon',
    why: 'both branches of the pill rule on one screen - "Ранг 1" and "Двуручное" - and a two-group address',
    enter: async (d) => {
      await d.click('Фильтры');
      await d.click('1');
      await d.click('Двуручное');
    }
  },
  {
    id: '#/tables/eq_secondary ~ filter link',
    route: '#/tables/eq_secondary/f_cls-mag',
    why: 'arriving opens the panel; the cls row reads "Тип урона" here and "Класс" on weapons'
  },
  {
    id: '#/tables/eq_secondary ~ searched',
    route: '#/tables/eq_secondary',
    why: 'the type word is part of the searched stat line',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию…', 'вторичное');
    }
  },
  {
    id: '#/tables/eq_armor ~ nothing found',
    route: '#/tables/eq_armor',
    why: 'the three-row panel open, a pill, 0 из 90, the empty state with its own reset',
    enter: async (d) => {
      await d.click('Фильтры');
      await d.click('Уникальные');
      await d.type('Поиск по названию или описанию…', 'zzzqqqxx123');
    }
  },
  { id: '#/tables/voa', route: '#/tables/voa', why: 'a sectioned body: Vault of Ages by tier' },
  { id: '#/tables/frames', route: '#/tables/frames', why: 'a sectioned body: campaign frames' },
  {
    id: '#/tables/frames ~ two frames',
    route: '#/tables/frames',
    why: 'two frames picked in one row: values OR, and the second pick keeps the first',
    enter: async (d) => {
      await d.click('Фильтры');
      await d.click('Пир зверей');
      await d.click('Колоссы Сухоземья');
    }
  },
  { id: '#/tables/community', route: '#/tables/community', why: 'a sectioned body: communities' },
  {
    id: '#/tables/community ~ panel open',
    route: '#/tables/community',
    why: 'the filter panel on a sectioned table - the screen the human reported the search-box and любое defects from',
    enter: async (d) => {
      await d.click('Фильтры');
    }
  },
  { id: '#/tables/alt_item', route: '#/tables/alt_item', why: 'the alternate items table' },
  {
    id: '#/tables/alt_consumable',
    route: '#/tables/alt_consumable',
    why: 'the alternate consumables table'
  },

  /* The row/section anchor - `#/tables/<table>/<key>` - never had a state at
     all, on any table, so the mechanism went unwired since B1 without
     anything noticing. One of each: a section on a table this batch builds,
     and a row on one of B1's own tables, which is the only way the fix on the
     tables built earlier gets verified. */
  {
    id: '#/tables/voa ~ section anchor',
    route: '#/tables/voa/tA',
    why: 'arriving at a section link scrolls to and flashes it'
  },
  {
    id: '#/tables/core_item ~ row anchor',
    route: '#/tables/core_item/ci1',
    why: "arriving at a record's row link scrolls to and flashes it - a B1 table, not a new one"
  },

  /* `srcLabel`'s frame case returned the raw id rather than the frame's own
     name until this batch - `#/i/f1` is the first state to open a frame
     record at all, which is why nothing had caught it. */
  { id: '#/i/f1', route: '#/i/f1', why: 'a frame-equipment record, catching the source-badge fix' },

  /* The lists index, off `renderLists`/`storageWarning` in app.js. */
  {
    id: '#/lists',
    route: '#/lists',
    why: 'the folded notice, both fields, no lists yet'
  },
  {
    id: '#/lists ~ two lists',
    route: '#/lists',
    why: 'a card with six thumbs and a badge of 7, and an empty card',
    storage: seven
  },
  {
    id: '#/lists ~ notice unfolded',
    route: '#/lists',
    why: 'the disclosure open, the hint hidden, the page taller',
    storage: seven,
    enter: async (d) => {
      await d.click('подробнее');
    }
  },
  {
    id: '#/lists ~ notice dismissed',
    route: '#/lists',
    why: 'no notice at all - the panel sits directly under the page-sub',
    storage: seven,
    enter: async (d) => {
      await d.click('Скрыть');
    }
  },
  {
    id: '#/lists ~ help',
    route: '#/lists',
    why: 'the four paragraphs, two of them with two bold runs each',
    enter: async (d) => {
      await d.click('Как это работает');
    }
  },
  {
    id: '#/lists ~ created',
    route: '#/lists',
    why: 'the new card first, the field cleared, the toast',
    enter: async (d) => {
      await d.type('Например: клад дракона', 'Тайник');
      await d.click('Создать');
    },
    /* a 1600ms toast; arrived at afresh per width - see docs/parity.md, 'Timed states' */
    timed: true
  },

  /* The list page, off `renderOneList` and everything it draws - app.js
     2933-3128. `plan.md`, "B5.4 planned". */
  {
    id: '#/lists/a',
    route: '#/lists/a',
    storage: seven,
    why: 'the page: the title input, "7 позиций", five actions, the notice, no money picker, folded note and roll panel, "Выбрать все", seven plain rows'
  },
  {
    id: '#/lists/a ~ noted',
    route: '#/lists/a',
    storage: noted,
    why: 'the money picker, the list note open with two texts, row 2 priced and noted, its note box open, has-note'
  },
  {
    id: '#/lists/a ~ money help',
    route: '#/lists/a',
    storage: noted,
    why: 'the help box under the chips, "?" pressed',
    enter: async (d) => {
      await d.click(NAME.ru.whatIsThis);
    }
  },
  {
    id: '#/lists/a ~ roll panel',
    route: '#/lists/a',
    storage: seven,
    why: 'the panel open: empty numbox, "Случайно 1-7", the hint',
    enter: async (d) => {
      await d.click(NAME.ru.rollBy);
    }
  },
  {
    id: '#/lists/a ~ rolled',
    route: '#/lists/a',
    storage: noted,
    why: 'result 2: the compact card badged 2, both hitnotes, "Сбросить"',
    enter: async (d) => {
      await d.click(NAME.ru.rollBy);
      await d.click(NAME.ru.stepUp);
      await d.click(NAME.ru.stepUp);
    }
  },
  {
    id: '#/lists/a ~ removed',
    route: '#/lists/a',
    storage: seven,
    why: 'six rows, the undo toast',
    enter: async (d) => {
      await d.click(NAME.ru.removeItem);
    },
    /* a 7000ms toast; arrived at afresh per width - docs/parity.md, 'Timed states' */
    timed: true
  },
  {
    id: '#/lists/a ~ note opened',
    route: '#/lists/a',
    storage: seven,
    why: "row 1's empty note box open, focus in the first textarea",
    enter: async (d) => {
      await d.click(NAME.ru.note);
    }
  },
  {
    id: '#/lists/a ~ a row ticked',
    route: '#/lists/a',
    storage: seven,
    why: 'the bar on, "Выбрано 1", Цены with its caret, Удалить (1) - at 375 the 640px override drops the pair to its own full-width line',
    enter: async (d) => {
      await d.click(NAME.ru.pickRow);
    }
  },
  {
    id: '#/lists/a ~ prices',
    route: '#/lists/a',
    storage: noted,
    why: 'row 2 (750, bags) ticked: the percentage row at -20 with "Сделать скидку" and the hint, the note, one guess row with its band, "Проставить эти цены", "Убрать цену (1)"',
    enter: async (d) => {
      await d.click(NAME.ru.pickRow, 1);
      await d.click(NAME.ru.prices);
    }
  },
  {
    id: '#/lists/a ~ prices, none priced',
    route: '#/lists/a',
    storage: seven,
    why: 'row 1 ticked: no percentage row, no clear button - the two `priced` branches off',
    enter: async (d) => {
      await d.click(NAME.ru.pickRow);
      await d.click(NAME.ru.prices);
    }
  },
  {
    id: '#/lists/a ~ prices set',
    route: '#/lists/a',
    storage: seven,
    why: 'the panel folded, row 1 priced, the money picker now drawn (first price on the list), the toast "Цены проставлены (1)"',
    enter: async (d) => {
      await d.click(NAME.ru.pickRow);
      await d.click(NAME.ru.prices);
      await d.click(NAME.ru.applyPrices);
    },
    /* a 7000ms toast (it carries an undo); arrived at afresh per width - see docs/parity.md, 'Timed states' */
    timed: true
  },
  {
    id: '#/lists/a ~ batch deleted',
    route: '#/lists/a',
    storage: seven,
    why: 'six rows, the bar off, the toast "Убрано из списка (1)" with "Вернуть"',
    enter: async (d) => {
      await d.click(NAME.ru.pickRow);
      await d.click(NAME.ru.delOne);
    },
    /* a 7000ms toast; arrived at afresh per width - see docs/parity.md, 'Timed states' */
    timed: true
  },
  {
    id: '#/lists/b',
    route: '#/lists/b',
    storage: oneEmpty,
    why: 'the empty page: no print link, no money, the note folded, no roll panel, no bar, the hint'
  },
  {
    id: '#/lists/nope',
    route: '#/lists/nope',
    why: '"Список не найден", the sub, the "Списки" button; the address not rewritten'
  },
  {
    /* `encodeList({ name: 'Клад дракона', ids: [ci1..ci7] }, true)` - the
       payload `seven`'s list `a` rewrites its own address to. Computed once,
       by hand, off the frozen format (docs/specs/CONTRACTS.md section 3) -
       verified byte-identical to `encodeList`'s own output. */
    id: '#/l/ ~ own list',
    route: '#/l/0JrQu9Cw0LQg0LTRgNCw0LrQvtC90LAKNy50cm0zfmNpMSxjaTIsY2kzLGNpNCxjaTUsY2k2LGNpNw',
    storage: seven,
    why: 'own-list recognition: the same page as #/lists/a'
  },

  {
    id: '#/l/ ~ shared',
    route: '#/l/' + QTY_AND_PRICE.player.payload,
    storage: two,
    why:
      'a list from another player: heading "Лавка", the sub, the add control, three rows with ' +
      'their tails (×2; ×5 · price; price), no notes, no bar. Seeded so addedSharedToList has a ' +
      'list to add to; the lists are not drawn here, so the seed costs no pixel'
  },
  {
    id: '#/l/ ~ shared, noted',
    route: '#/l/' + NOTES_BOTH_KINDS.gm.payload,
    why:
      '"Тайник": both list hitnotes above two rows, ci1 with both entry hitnotes under it, no tails'
  },
  {
    id: '#/l/ ~ packed',
    route: '#/l/' + PACKED,
    enter: (d) => d.expanded(),
    why:
      'the packed form, expanded and rewritten to the plain form - pixels identical to ' +
      '"~ shared, noted"; listAddress proves the rewrite'
  },
  {
    id: '#/l/zzzz',
    route: '#/l/zzzz',
    why: 'the bad-link page: "Предмет не найден", the badShare line, the "На главную" button'
  },

  {
    id: '#/search',
    route: '#/search',
    why: 'the page as opened: head, sub, the box focused with its ring painted, three chips on, the hint'
  },
  {
    id: '#/search ~ searched',
    route: '#/search',
    why: '87 rows of loot and gear together in catalogue order, "Выбрать все (87)"',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию…', 'меч');
    }
  },
  {
    id: '#/search ~ kind off',
    route: '#/search',
    why: '34 rows, no equipment badge left, the chip off',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию…', 'меч');
      await d.click('Снаряжение');
    }
  },
  {
    id: '#/search ~ stat line',
    route: '#/search',
    why: 'rows found by the assembled stat line alone - the word is on no record as text',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию…', 'двуручное');
    }
  },
  {
    id: '#/search ~ capped',
    route: '#/search',
    why: 'the 300 cap: "Выбрать все (300)" over the first 300',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию…', 'а');
    }
  },
  {
    id: '#/search ~ nothing found',
    route: '#/search',
    why: '"Ничего не найдено", and no reset button - unlike the tables',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию…', 'zzzqqqxx123');
    }
  },
  {
    id: '#/search ~ a row ticked',
    route: '#/search',
    why: 'the bar over search',
    enter: async (d) => {
      await d.type('Поиск по названию или описанию…', 'меч');
      await d.click('Выбрано');
    }
  },
  {
    id: '#/print/ci1-q1',
    route: '#/print/ci1-q1',
    why: 'a print sheet: a loot card with its art beside a weapon card, seven blank places'
  },
  {
    id: '#/print/ci1-q1 ~ black and white',
    route: '#/print/ci1-q1',
    why: 'the other layout: no art, the band, the tag and the mark in a row over the name, -bw vectors',
    enter: async (d) => {
      await d.click('Чёрно-белая');
    }
  },
  {
    id: NINE,
    route: NINE,
    whole: true,
    why: 'every card shape on one sheet: item, weapon, armour, consumable, artifact, versatile magic, two-handed with a bonus, magic dagger, a long rule'
  },
  {
    id: NINE + ' ~ black and white',
    route: NINE,
    whole: true,
    why: 'the same nine, the other layout',
    enter: async (d) => {
      await d.click('Чёрно-белая');
    }
  },
  {
    id: LONG,
    route: LONG,
    whole: true,
    why: 'the fit ladder end to end: the font, then the padding, then the art gives way on the longest texts in the catalogue'
  },
  {
    id: LONG + ' ~ black and white',
    route: LONG,
    whole: true,
    why: 'the same, with the black-and-white padding floor',
    enter: async (d) => {
      await d.click('Чёрно-белая');
    }
  },
  {
    id: TEN,
    route: TEN,
    why: 'a second sheet: eighteen places, eight blank, the second sheet a page break; "Листов A4: 2"'
  },
  {
    id: TOO_MANY_ID,
    route: TOO_MANY,
    why: 'the cap: 180 cards on twenty sheets and the red note about the one left out'
  },
  {
    id: '#/print/nope',
    route: '#/print/nope',
    why: 'nothing to print: the heading, the note and the way to the lists'
  }
];

/* Self-retiring guard: while tests/parity/specs.js still exists, its own
 * STATES must name exactly the same (id, route) pairs as this copy - a copy
 * that has drifted is worse than no copy. Ids and routes only: `enter`
 * closures are functions and cannot be compared; a wrong `enter` produces a
 * wrong golden, caught by golden.js's own determinism proof instead. */
const SPECS_PATH = path.join(__dirname, '..', 'parity', 'specs.js');
if (fs.existsSync(SPECS_PATH)) {
  const theirs = require(SPECS_PATH).STATES.map((s) => s.id + ' :: ' + s.route);
  const mine = STATES.map((s) => s.id + ' :: ' + s.route);
  const theirSet = new Set(theirs);
  const mineSet = new Set(mine);
  const missing = theirs.filter((x) => !mineSet.has(x));
  const extra = mine.filter((x) => !theirSet.has(x));
  if (missing.length || extra.length) {
    throw new Error(
      'tests/app/inventory.js has drifted from tests/parity/specs.js - ' +
      (missing.length ? 'missing: ' + missing.join(', ') + '. ' : '') +
      (extra.length ? 'extra: ' + extra.join(', ') + '.' : '')
    );
  }
}

module.exports = { STATES, LANGS };
