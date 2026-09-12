/* What to look at on each route, in a form that says nothing about which app.
 *
 * A spec observes and returns; it never asserts. Whatever it returns from the
 * live app is what the rewrite has to return too, so adding a spec adds a
 * requirement without anybody having to write down the answer - and the answer
 * cannot drift out of date, because it is re-read from the live app on every
 * run.
 *
 * `only` names the routes a spec applies to. `pending` marks a spec whose route
 * the rewrite has not reached: it still runs against the live app, so the
 * expectation is being collected all along, and it is reported as outstanding
 * rather than as a failure.
 */

/** A known-good list link, shared with `listLink.test.ts` and `contracts.js`
 *  so all three read the same fixture rather than three copies of one payload. */
const EQUIPMENT_ENTRY = require('../../docs/fixtures/lists/equipment-entry.json');
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

/** The eight states that draw a sheet at all - every print state but the
 *  empty one, `#/print/nope`. */
const PRINT_CARD_STATES = [
  NINE,
  NINE + ' ~ black and white',
  LONG,
  LONG + ' ~ black and white',
  '#/print/ci1-q1',
  '#/print/ci1-q1 ~ black and white',
  TEN,
  TOO_MANY_ID
];

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

/*
 * `presses: true` marks a spec that changes the page - it clicks something, or
 * it reads a clipboard that a click filled. Those get a page of their own.
 * Everything else only looks, so the harness arrives once and runs all of them
 * against the same paint, which is what keeps a run inside a couple of minutes
 * now that a state costs as much as a route used to.
 */

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

/** Controls are compared as a set of names: order on screen is not the point. */
const inventory = {
  name: 'the controls on the page',
  async run(d) {
    return { controls: await d.controls() };
  }
};

const heading = {
  name: 'the first line of the page',
  async run(d) {
    const text = await d.text();
    return { starts: text.slice(0, 80) };
  }
};

/**
 * What the tab says, and what a bookmark or a shared link is called.
 *
 * Nothing else looks at it - it is off the screen, so no screenshot and no
 * inventory can see it - and the rewrite had drifted to a different wording in
 * Russian without anything noticing.
 */
const title = {
  name: 'the title of the document',
  async run(d) {
    return { title: await d.title() };
  }
};

/**
 * Everything a person can do with one record, wherever the card is drawn.
 *
 * The modal is in `only` on purpose. A card in a modal is the same card, and
 * the rewrite drew it there with no actions at all for a while - the page had
 * them, so no route-level spec noticed.
 */
const recordActions = {
  name: 'what a record offers',
  only: [
    '#/i/ci1',
    '#/i/q1',
    '#/i/ci1 ~ whole',
    '#/i/f1',
    '#/roll/wondrous ~ modal',
    '#/i/q1 ~ another tier',
    '#/tables ~ a row opened'
  ],
  async run(d, lang) {
    const n = NAME[lang];
    return {
      copyName: await d.has(n.copyName),
      copyText: await d.has(n.copyText),
      copyImage: await d.has(n.copyImage),
      copyLink: await d.has(n.copyLink),
      send: await d.has(n.send),
      addToList: await d.has(n.addToList)
    };
  }
};

const copiedName = {
  presses: true,
  name: 'the name that lands on the clipboard',
  only: ['#/i/ci1', '#/i/q1'],
  async run(d, lang) {
    await d.resetClipboard();
    await d.click(NAME[lang].copyName);
    return { clip: await d.clipboard() };
  }
};

const copiedText = {
  presses: true,
  name: 'the text that lands on the clipboard',
  only: ['#/i/ci1', '#/i/q1'],
  async run(d, lang) {
    await d.resetClipboard();
    await d.click(NAME[lang].copyText);
    return { clip: await d.clipboard() };
  }
};

/**
 * Copying the picture.
 *
 * This is the one path a unit test cannot reach - jsdom has no canvas - so it
 * is checked here, in a real browser, on both apps. What is compared is the
 * type and that something arrived; the bytes differ because the two apps encode
 * at different moments and a PNG is not reproducible byte for byte.
 */
const copiedImage = {
  presses: true,
  name: 'the picture that lands on the clipboard',
  only: ['#/i/ci1'],
  async run(d, lang) {
    await d.resetClipboard();
    await d.click(NAME[lang].copyImage);
    return { image: await d.clipboardImage() };
  }
};

/**
 * The address after a filter pick.
 *
 * Off screen, so no screenshot can see it: `f_kind-item` is a frozen contract
 * (docs/specs/CONTRACTS.md) and this is what actually holds the two apps to
 * writing the same segment.
 */
const filteredAddress = {
  presses: true,
  name: 'the address after a filter pick',
  only: ['#/tables/wondrous ~ filtered', '#/tables/eq_weapon ~ filtered'],
  async run(d) {
    return { hash: await d.hash() };
  }
};

/**
 * What the filter-link button hands to the clipboard.
 *
 * Only the hash is compared: the two targets live at different paths on this
 * machine (the repository root against `dist/`), so the base of the link
 * differs between them for a reason that has nothing to do with the filter -
 * `copiedName` and `copiedText` never hit this because neither copies a URL.
 */
const copiedFilterLink = {
  presses: true,
  name: 'the filter link that lands on the clipboard',
  only: ['#/tables/wondrous ~ filtered', '#/tables/eq_weapon ~ filtered'],
  async run(d, lang) {
    await d.resetClipboard();
    await d.click(NAME[lang].filterLink);
    const clip = await d.clipboard();
    const hash = clip.text?.slice(clip.text.indexOf('#')) ?? null;
    return { hash };
  }
};

/**
 * The write path an add-to-list press takes, compared as data rather than
 * only as the tick on a chip.
 *
 * `#/i/ci1 ~ list menu`'s own English cells show the menu folded - the `EN`
 * press `arrive()` makes is a click outside `.seldrop`/`.dropmenu`, which
 * closes it on both apps, honestly. So this re-opens it first when the chip
 * is not already on screen, presses it, and reads storage back: both apps,
 * both languages, `[['a', ['ci1']], ['b', []]]` - the seed order is the save
 * order, not the display order.
 */
const listMembership = {
  presses: true,
  name: 'the write path an add-to-list press takes',
  only: ['#/i/ci1 ~ list menu'],
  async run(d, lang) {
    if (!(await d.has('Клад дракона'))) await d.click(NAME[lang].addToList);
    await d.click('Клад дракона');
    const stored = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]');
    return {
      ticked: await d.has('✓ Клад дракона'),
      stored: stored.map((l) => [l.id, l.ids])
    };
  }
};

/**
 * What copying the whole selection puts on the clipboard.
 *
 * `#/tables ~ a row ticked` only ticks one row itself, before the `EN` press
 * `arrive()` makes for an English run - so by the time this runs, the
 * checkbox's own name has already followed the language switch. A second tick
 * (`click(NAME[lang].selected, 1)`) before pressing copy is what lands two
 * records - `shareSelection` meeting `selAsText`/`selAsHtml` in app.js, with
 * no OR between them, unlike a copied roll.
 */
const copiedSelection = {
  presses: true,
  name: 'the selection that lands on the clipboard',
  only: ['#/tables ~ a row ticked', '#/search ~ a row ticked'],
  async run(d, lang) {
    await d.resetClipboard();
    await d.click(NAME[lang].selected, 1);
    await d.click(NAME[lang].copySel);
    return { clip: await d.clipboard() };
  }
};

/**
 * The write path a press on the bar's own menu takes, off `applyAddTo`/
 * `addIdsTo` in app.js.
 *
 * `#/tables ~ bar menu`'s own English cells show the menu folded - the same
 * outside-click rule `listMembership` already works around - so this reopens
 * it first when the chip is not already on screen, presses it, and reads
 * storage back: both ids land in the one list in a single press, and the
 * selection (and the bar itself) survives it.
 */
const barMembership = {
  presses: true,
  name: "the write path a press on the bar's own menu takes",
  only: ['#/tables ~ bar menu'],
  async run(d, lang) {
    if (!(await d.has('Клад дракона'))) await d.click(NAME[lang].addToList);
    await d.click('Клад дракона');
    const stored = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]');
    return {
      stored: stored.map((l) => [l.id, l.ids.length]),
      barStillUp: await d.has(NAME[lang].clearSel)
    };
  }
};

/**
 * The short players' link a share press copies - `listShareUrlShort` in
 * app.js, `share()` here. `file://index.html` and `dist/index.html` are
 * different bases, so only the hash after it is compared: both apps deflate
 * the same bytes in the same Chrome and both keep the packed form only when
 * it comes out shorter, so the string itself has to match.
 */
const sharedListLink = {
  presses: true,
  name: "the short players' link a share press copies",
  only: ['#/lists ~ two lists'],
  async run(d, lang) {
    await d.resetClipboard();
    await d.click(NAME[lang].share);
    const clip = await d.clipboard();
    return { hash: clip.text.slice(clip.text.indexOf('#')) };
  }
};

/**
 * Deleting a list, off `deleteList` in app.js. Neither the question nor the
 * result paints anything a screenshot can catch, so this compares them as
 * data: the driver's own dialog auto-accept is what lets `el.click()` return
 * at all here (context.md, "confirm() blocks puppeteer").
 */
const deletedList = {
  presses: true,
  name: 'deleting a list, and the question it asks first',
  only: ['#/lists ~ two lists'],
  async run(d, lang) {
    await d.click(NAME[lang].del);
    const stored = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]');
    return { asked: d.dialog(), stored: stored.map((l) => l.id) };
  }
};

/**
 * Restoring a list from a plain link, off `importList` in app.js. A plain
 * link on purpose, not the packed short one `sharedListLink` reads back: the
 * packed form is where the two apps now differ, by this batch's own fix to
 * the restore field's regex (context.md, "Decided in planning"), so this
 * proves the path the fix does not touch.
 */
const restoredList = {
  presses: true,
  name: 'restoring a list from a plain link',
  only: ['#/lists'],
  async run(d, lang) {
    await d.type(NAME[lang].importPh, '#/l/' + EQUIPMENT_ENTRY.player.payload);
    await d.click(NAME[lang].restore);
    const stored = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]');
    return { hash: await d.hash(), stored: stored.map((l) => [l.name, l.ids]) };
  }
};

/**
 * The address a list page settles on - the live `syncListUrl`/`freshenListUrl`
 * (app.js 1596-1606), which every writer on the page calls. `#/lists/nope`
 * is the one case that never adopts: an id nobody has stays as typed.
 */
const listAddress = {
  name: 'the address the list page settles on',
  only: [
    '#/lists/a',
    '#/lists/a ~ noted',
    '#/lists/a ~ money help',
    '#/lists/a ~ roll panel',
    '#/lists/a ~ rolled',
    '#/lists/a ~ removed',
    '#/lists/a ~ note opened',
    '#/lists/a ~ a row ticked',
    '#/lists/a ~ prices',
    '#/lists/a ~ prices, none priced',
    '#/lists/a ~ prices set',
    '#/lists/a ~ batch deleted',
    '#/lists/b',
    '#/lists/nope',
    '#/l/ ~ own list',
    '#/l/ ~ shared',
    '#/l/ ~ shared, noted',
    '#/l/ ~ packed',
    '#/l/zzzz'
  ],
  async run(d) {
    return { hash: await d.hash() };
  }
};

/**
 * Taking a shared list whole, off `+ Новый список` on the shared page's own
 * add-to-list menu - the live `createFor`'s '@' branch (app.js 4221-4228).
 */
const tookSharedList = {
  presses: true,
  name: "taking a shared list whole, into a new list of one's own",
  only: ['#/l/ ~ shared, noted'],
  async run(d, lang) {
    await d.click(NAME[lang].addToList);
    await d.click(NAME[lang].newList);
    await d.click(NAME[lang].create);
    const stored = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]');
    return {
      hash: await d.hash(),
      stored: stored.map((l) => [l.name, l.ids, l.note ?? null, l.hnote ?? null, l.meta ?? null])
    };
  }
};

/**
 * Adding a shared list's ids into an existing list of one's own, off a chip
 * on the shared page's own add-to-list menu - the live `applyAddTo`'s '@'
 * branch (app.js 1907-1920), which copies the players'-visible meta along.
 */
const addedSharedToList = {
  presses: true,
  name: "a chip adding a shared list's ids and meta into an existing list",
  only: ['#/l/ ~ shared'],
  async run(d, lang) {
    await d.click(NAME[lang].addToList);
    await d.click('Клад дракона');
    const stored = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]');
    return { hash: await d.hash(), stored: stored.map((l) => [l.id, l.ids, l.meta ?? null]) };
  }
};

const renamedList = {
  presses: true,
  name: 'renaming a list, off the title input',
  only: ['#/lists/a'],
  async run(d, lang) {
    await d.type(NAME[lang].rename, 'Тайник');
    const stored = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]');
    return { hash: await d.hash(), name: stored[0].name };
  }
};

const movedByPosition = {
  presses: true,
  name: 'moving an entry by typing its position',
  only: ['#/lists/a'],
  async run(d, lang) {
    await d.type(NAME[lang].position, '3', 'change');
    const stored = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]');
    return { hash: await d.hash(), ids: stored[0].ids };
  }
};

const reorderedByDrag = {
  presses: true,
  name: 'reordering by dragging',
  only: ['#/lists/a'],
  async run(d) {
    await d.drag(0, 2, true);
    const first = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]')[0].ids;
    await d.drag(2, 0, false);
    const second = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]')[0].ids;
    /* Legacy and rewrite are compared against each other, never against the
       order the seed started in - so if the drag sequence ever stops moving
       anything on *both* apps (a broken driver, a dead grip selector), `first`
       and `second` come back identically unchanged and the cell still reads
       "совпадает". This is the one thing the app-to-app comparison alone
       cannot catch: throw here so a no-op fails instead of passing quietly. */
    if (JSON.stringify(first) === JSON.stringify(second)) {
      throw new Error('reorderedByDrag: the two drags left the list order unchanged');
    }
    return { first, hash: await d.hash(), second };
  }
};

const guessedPrices = {
  presses: true,
  name: 'applying the suggested price to a ticked row, and undoing it',
  only: ['#/lists/a'],
  async run(d, lang) {
    await d.click(NAME[lang].pickRow);
    await d.click(NAME[lang].prices);
    await d.click(NAME[lang].applyPrices);
    const gold =
      JSON.parse((await d.storage('dhloot.lists.v2')) || '[]')[0].meta?.ci1?.gold ?? null;
    await d.click(NAME[lang].undo);
    const undone =
      JSON.parse((await d.storage('dhloot.lists.v2')) || '[]')[0].meta?.ci1?.gold ?? null;
    return { gold, hash: await d.hash(), undone };
  }
};

const repricedRows = {
  presses: true,
  name: "discounting a ticked, priced row, and undoing it",
  only: ['#/lists/a ~ noted'],
  async run(d, lang) {
    await d.click(NAME[lang].pickRow, 1);
    await d.click(NAME[lang].prices);
    await d.click(NAME[lang].discount);
    const gold =
      JSON.parse((await d.storage('dhloot.lists.v2')) || '[]')[0].meta?.ci2?.gold ?? null;
    await d.click(NAME[lang].undo);
    const undone =
      JSON.parse((await d.storage('dhloot.lists.v2')) || '[]')[0].meta?.ci2?.gold ?? null;
    return { gold, hash: await d.hash(), undone };
  }
};

const clearedPrices = {
  presses: true,
  name: "clearing a ticked, priced row's price, and undoing it",
  only: ['#/lists/a ~ noted'],
  async run(d, lang) {
    await d.click(NAME[lang].pickRow, 1);
    await d.click(NAME[lang].prices);
    await d.click(NAME[lang].clearPriceOne);
    const gold =
      JSON.parse((await d.storage('dhloot.lists.v2')) || '[]')[0].meta?.ci2?.gold ?? null;
    await d.click(NAME[lang].undo);
    const undone =
      JSON.parse((await d.storage('dhloot.lists.v2')) || '[]')[0].meta?.ci2?.gold ?? null;
    return { gold, hash: await d.hash(), undone };
  }
};

const batchDeleted = {
  presses: true,
  name: 'batch-deleting a ticked row, and undoing it',
  only: ['#/lists/a ~ noted'],
  async run(d, lang) {
    await d.click(NAME[lang].pickRow, 1);
    await d.click(NAME[lang].delOne);
    const gone = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]')[0];
    await d.click(NAME[lang].undo);
    const back = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]')[0];
    return {
      ids: gone.ids,
      meta: gone.meta ?? null,
      hash: await d.hash(),
      backIds: back.ids,
      backMeta: back.meta ?? null
    };
  }
};

const pricedRow = {
  presses: true,
  name: "a row's first price, and the money picker it raises",
  only: ['#/lists/a'],
  async run(d, lang) {
    await d.type('—', '231');
    const stored = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]');
    return {
      hash: await d.hash(),
      meta: stored[0].meta,
      picker: await d.has(NAME[lang].moneyCoin)
    };
  }
};

const removedRow = {
  presses: true,
  name: 'removing a row, and undoing it',
  only: ['#/lists/a'],
  async run(d, lang) {
    await d.click(NAME[lang].removeItem);
    const afterRemove = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]')[0].ids;
    const hash = await d.hash();
    await d.click(NAME[lang].undo);
    const afterUndo = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]')[0].ids;
    return { afterRemove, hash, afterUndo };
  }
};

const deletedFromPage = {
  presses: true,
  name: 'deleting a list from its own page',
  only: ['#/lists/a'],
  async run(d, lang) {
    await d.click(NAME[lang].del);
    return { asked: d.dialog(), hash: await d.hash() };
  }
};

const copiedListText = {
  presses: true,
  name: "the list's own export, off shareList",
  only: ['#/lists/a ~ noted'],
  async run(d, lang) {
    await d.resetClipboard();
    await d.click(NAME[lang].copyText);
    const clip = await d.clipboard();
    return { text: clip.text, html: clip.html };
  }
};

const ownLinks = {
  presses: true,
  name: "the players' and the GM's own links",
  only: ['#/lists/a ~ noted'],
  async run(d, lang) {
    await d.resetClipboard();
    await d.click(NAME[lang].sharePlayers);
    const players = await d.clipboard();
    await d.resetClipboard();
    await d.click(NAME[lang].shareGm);
    const gm = await d.clipboard();
    return {
      players: players.text.slice(players.text.indexOf('#')),
      gm: gm.text.slice(gm.text.indexOf('#'))
    };
  }
};

const moneyMode = {
  presses: true,
  name: 'switching the money mode to coins',
  only: ['#/lists/a ~ noted'],
  async run(d, lang) {
    await d.click(NAME[lang].moneyCoin);
    const stored = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]');
    return { hash: await d.hash(), money: stored[0].money ?? null };
  }
};

const noteCleared = {
  presses: true,
  name: "clearing the list's own note, and undoing it",
  only: ['#/lists/a ~ noted'],
  async run(d, lang) {
    /* The first "Очистить заметку" in DOM order is the list note's own
       players' side - it comes before every row's. */
    await d.click(NAME[lang].noteClear);
    const after = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]')[0].note ?? null;
    const hash = await d.hash();
    await d.click(NAME[lang].undo);
    const back = JSON.parse((await d.storage('dhloot.lists.v2')) || '[]')[0].note;
    return { note: after, hash, back };
  }
};

/** The roll pages: the label on the button says which die, or that there is none. */
const rollControls = {
  name: 'the roll controls',
  only: [
    '#/roll/wondrous',
    '#/roll/dread',
    '#/roll/voa',
    '#/roll/voa ~ artifacts',
    '#/roll/community',
    '#/roll/community ~ second'
  ],
  async run(d, lang) {
    const n = NAME[lang];
    const controls = await d.controls();
    const starts = lang === 'ru' ? ['Бросить', 'Случайно'] : ['Roll', 'Random'];
    return {
      /* The label carries the range, so it is the one string worth comparing
         character for character - "Случайно 1-29" is a promise about the table. */
      rollLabel: controls.find((c) => starts.some((p) => c.startsWith(p))) ?? null,
      stepper: (await d.has(n.stepDown)) && (await d.has(n.stepUp)),
      pinSection: await d.has(n.pinSection)
    };
  }
};

/**
 * How the page looks, in numbers.
 *
 * Not a screenshot: a pixel count says "40% differs" and sends nobody anywhere.
 * These are the values that drive the pixels, and each one names something to
 * go and change.
 */
const visuals = {
  name: 'the look, measured',
  async run(d) {
    return await d.metrics();
  }
};

/**
 * The type on the controls a page percentage cannot see.
 *
 * `#/tables/community`'s search box, row text and filter hint each carried a
 * real defect - a wrong font-size, a wrapped width 4px short, a trimmed space -
 * while the whole-page pixel diff scored under JITTER and reported the state
 * as matching (B3.6). These four probes measure the controls those defects
 * went through directly: computed type, text content and a measured advance,
 * rather than a percentage of the page.
 *
 * `perWidth: true` runs this once per viewport inside the width sweep, not
 * once at the widest layout the way `looks` specs do - the row-width defect
 * only showed at 375, so a spec that ran at 1100 alone would have caught two
 * of the three.
 */
const typeRuns = {
  perWidth: true,
  name: 'the type on the controls a page percentage cannot see',
  only: [
    '#/tables',
    '#/tables/hnf_consumable',
    '#/tables/dread',
    '#/tables/wondrous ~ panel open',
    '#/tables/community ~ panel open',
    '#/tables/community',
    '#/tables/voa',
    '#/search',
    '#/search ~ searched'
  ],
  async run(d) {
    return await d.typeAt({
      search: 'input[type=search]',
      rowText: '[data-row] .rt',
      rowTitle: '[data-row] .rt b',
      filterLabel: '.ffilter .field .lbl'
    });
  }
};

/**
 * How many rows a search actually drew, as a number rather than as a set of
 * deduplicated names - `inventory` reads names off `button, a[href], input,
 * select, textarea` and dedupes them, so 87 rows of the same three or four
 * kinds would read as a handful of distinct names. This is what pins 87 / 34
 * / the stat-line count / 300 as counts.
 */
const foundRows = {
  name: 'how many rows a search drew',
  only: [
    '#/search ~ searched',
    '#/search ~ kind off',
    '#/search ~ stat line',
    '#/search ~ capped'
  ],
  async run(d) {
    const rows = await d.count('.rows [data-row]');
    console.log(`       foundRows ${d.target}: ${rows}`);
    return { rows };
  }
};

/**
 * Whether a packed shared-list address finished expanding - the carried
 * B5.6 risk 1 (`handoff.md`, "Deferred"): every other spec on `~ packed`
 * compares pixels or a control's name, neither of which can tell "expanded"
 * from "landed on the bad-link page" when both apps land on the same wrong
 * page.
 *
 * The comment on `reorderedByDrag` applies here too: the two apps are
 * compared against each other, so two identical failures would read
 * "совпадает" unless something throws. `#/l/zzzz` is exactly that identical
 * failure, so it throws rather than reporting `expanded: false` on both.
 */
const packedExpanded = {
  name: 'whether the packed address actually expanded',
  only: ['#/l/ ~ packed'],
  async run(d) {
    const hash = await d.hash();
    if (hash === '#/l/zzzz') {
      throw new Error(
        'packedExpanded: the packed address landed on the bad-link page - nothing was expanded'
      );
    }
    return { expanded: !hash.startsWith('#/l/~') };
  }
};

/* Geometry for the one full-page state, so a noisy capture can be told from
   a layout change by reading, not by probing (B5.2 part 0). */
const geometry = {
  perWidth: true,
  name: 'the geometry of the page a full-page capture photographs',
  only: ['#/i/ci1 ~ whole'],
  async run(d) {
    return await d.rectsAt({ card: '.card', pick: '.cardpick', foot: '.foot' });
  }
};

/**
 * The sheet's own arithmetic, as counts rather than pixels - the fast,
 * always-on half of what a print state checks. Off `renderPrint`
 * (app.js 3510-3558): how many sheets, how many cards, how many blanks pad
 * the last one, which sheets are marked as a page break, whether the
 * black-and-white class reached the sheet as well as every card, and
 * whether the too-many note is on screen.
 */
const sheetCounts = {
  name: 'the print sheet, in counts',
  only: PRINT_CARD_STATES,
  async run(d) {
    return {
      sheets: await d.count('.psheet'),
      cards: await d.count('.pcard'),
      blanks: await d.count('.pcard.blank'),
      breaks: await d.count('.psheet[data-next]'),
      bw: await d.count('.psheet.bw'),
      warn: await d.count('.printnote.warnnote')
    };
  }
};

/**
 * The fit, as the numbers `fitPrintCards` actually wrote onto each card -
 * what tells a noisy `whole` capture from a card that fitted differently
 * before anyone opens a diff image (`docs/parity.md`, "Two unstable
 * classes"). `perWidth` because the card's own container query makes its
 * size the one thing worth re-checking at every width, even though the
 * card itself is a fixed 63mm regardless of the viewport around it.
 */
const cardFit = {
  perWidth: true,
  name: 'the fit, as the numbers it wrote onto each card',
  only: PRINT_CARD_STATES,
  async run(d) {
    return {
      text: await d.eachAt('.pcard:not(.blank) .pc-text', ['font-size']),
      box: await d.eachAt('.pcard:not(.blank) .pc-content', ['--pcpad']),
      art: await d.eachAt('.pc-art', ['height', '--artw', 'display']),
      strip: await d.eachAt('.pc-strip .pc-box b', ['font-size']),
      head: await d.eachAt('.pc-head', [])
    };
  }
};

/**
 * The sheet under print media - the chrome hidden, the page unshadowed and
 * page-broken, the print colours kept. Runs before the shots on the same
 * page (leaving print media on would photograph the wrong medium), so it
 * always restores the medium in a `finally`.
 */
const printMedia = {
  name: 'the sheet under print media',
  only: ['#/print/ci1-q1', '#/print/ci1-q1 ~ black and white', TEN, '#/print/nope'],
  async run(d) {
    await d.media('print');
    try {
      return {
        header: await d.computed('header', ['display']),
        nav: await d.computed('nav', ['display']),
        footer: await d.computed('footer', ['display']),
        skip: await d.computed('a.skip', ['display']),
        bar: await d.computed('.printbar', ['display']),
        body: await d.computed('body', ['background-color', 'color']),
        main: await d.computed('main', [
          'max-width',
          'width',
          'padding-top',
          'padding-left',
          'margin-left'
        ]),
        sheet: await d.computed('.psheet', [
          'margin-top',
          'margin-left',
          'box-shadow',
          'break-inside'
        ]),
        last: await d.computed('.psheet:last-child', ['height']),
        next: await d.computed('.psheet[data-next]', ['break-before']),
        card: await d.computed('.pcard', ['break-inside', 'print-color-adjust'])
      };
    } finally {
      await d.media(undefined);
    }
  }
};

/** The set-link button, copied - the `copiedFilterLink` shape. Only the hash
 *  is compared: the two apps live at different paths. */
const copiedPrintLink = {
  presses: true,
  name: 'the print link, copied',
  only: ['#/print/ci1-q1'],
  async run(d, lang) {
    await d.resetClipboard();
    await d.click(NAME[lang].printLink);
    const clip = await d.clipboard();
    const hash = clip.text?.slice(clip.text.indexOf('#')) ?? null;
    return { hash };
  }
};

/**
 * The states both apps are asked about, and whether the rewrite draws them yet.
 *
 * A state is a route plus what was done to it. Opening a URL and screenshotting
 * it only ever compares the first paint of the default language at one width,
 * and everything a person reaches by pressing something was invisible to this
 * harness: the modal shipped four times too wide and nothing said so, because
 * no route draws it.
 *
 * Each state carries:
 *   id       what the report and VISUAL_DEBT call it, "<route> ~ <what>"
 *   route    where to start
 *   enter    what to press to get there, in names a person would read
 *   width    the viewport, where it is not the default 1100
 *   whole    the entire page rather than the fold, for a screen that scrolls
 *   pending  the slice that will draw it, for a route the rewrite has not reached
 *   timed    an `enter` that raises a toast; arrived at afresh at every width
 *            instead of swept, so a shot is never a stale clock away from the press
 *
 * A state marked pending is still visited on the live app - the expectation is
 * collected from the first run - and reported as outstanding rather than failed.
 */
/**
 * Every state is compared in both languages and at three widths.
 *
 * Not because somebody remembered to ask for it: the harness multiplies the
 * list below by this matrix, so a state added for one reason is checked for
 * five more. Written out by hand, the English and the phone states were the
 * two nobody got round to - and English is where "Core rules" sat wrong for
 * weeks.
 *
 * The widths are style.css's breakpoints rather than three round numbers: 1100
 * is above all of them, 768 sits between the 900 and 640 rules, and 375 is
 * under 430 where the number field and the card change again.
 */
const LANGS = ['ru', 'en'];
const WIDTHS = [
  { w: 1100, h: 900 },
  { w: 768, h: 900 },
  { w: 375, h: 812 }
];

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

const SPECS = [
  inventory,
  heading,
  title,
  recordActions,
  copiedName,
  copiedText,
  copiedImage,
  rollControls,
  filteredAddress,
  copiedFilterLink,
  listMembership,
  copiedSelection,
  barMembership,
  sharedListLink,
  deletedList,
  restoredList,
  listAddress,
  tookSharedList,
  addedSharedToList,
  renamedList,
  movedByPosition,
  reorderedByDrag,
  guessedPrices,
  repricedRows,
  clearedPrices,
  batchDeleted,
  pricedRow,
  removedRow,
  deletedFromPage,
  copiedListText,
  ownLinks,
  moneyMode,
  noteCleared,
  visuals,
  typeRuns,
  foundRows,
  packedExpanded,
  geometry,
  sheetCounts,
  cardFit,
  printMedia,
  copiedPrintLink
];

/**
 * How much of the screen is still allowed to differ, per state.
 *
 * **The expectation is zero.** The site is not supposed to change - see
 * CLAUDE.md, "This is a refactor, not a redesign" - so a state with no entry
 * here must match the original exactly, and any difference at all fails.
 *
 * An entry is a debt, not a tolerance. It records what has not been reproduced
 * yet, with the reason, and it is enforced from both sides:
 *
 * - the screen drifts worse than the number -> fail, it regressed
 * - the screen gets better than the number -> fail, lower the number
 *
 * So the figure normally only ratchets down, and the last slice to close a
 * screen deletes its entry. A figure that goes **up** always has to say so in
 * its own reason, not only in a comment above it, and there are three ways it
 * legitimately can:
 *
 * 1. content that is required and correct lands before the content that
 *    positions it, so it is in the right shape at the wrong height. The footer
 *    did exactly that - it is on every page because the licence asks for it,
 *    and until the panels above it are the same height as the original's it
 *    counts as changed twice over;
 * 2. a fix elsewhere moves the state - `#/tables/voa ~ section anchor @ ru
 *    375` went up when the `.selbox` mobile width was corrected, because the
 *    rows above its target then reflowed differently;
 * 3. the number was taken on a machine that is not the baseline. CI is the
 *    baseline (docs/parity.md, "Machine variance"): a whole-page state can
 *    read half a percent higher there than on a development machine, and the
 *    CI figure is the one that goes in.
 *
 * A number may also stay put while its reason is rewritten, which is what
 * happens when a "noise" excuse turns out to name a real cause.
 *
 * Both screenshots and a diff image land in test-output/parity/ on every run,
 * so what is left is a picture rather than an argument.
 */
const VISUAL_DEBT = {
  /* The row landed (B5.1). What is left in all three modal states below is
     the residue B5 planning already named: showModal() moves the keyboard
     into the dialog and the live app leaves it on the page behind it, which
     is the accessibility fix ACCEPTED records - the close button's own focus
     ring is the only thing still different, and a centred dialog reflows by
     that ring's few pixels when the card's height settles. Measured on this
     host (Windows, advisory - CI to confirm): 0.02% at 1100, 0.03% at 768,
     0.07% at 375, the same in both languages, for all three states this
     shape covers. Down from the pre-B5.1 debt by two orders of magnitude. */
  '#/i/q1 ~ another tier @ ru 1100': { pct: 0.02, why: "the close button's own focus ring" },
  '#/i/q1 ~ another tier @ ru 768': { pct: 0.03, why: 'the same ring, mid width' },
  '#/i/q1 ~ another tier @ ru 375': { pct: 0.07, why: 'the same ring, on a phone' },
  '#/i/q1 ~ another tier @ en 1100': { pct: 0.02, why: "the same ring, in English" },
  '#/i/q1 ~ another tier @ en 768': { pct: 0.03, why: 'the same ring, in English, mid width' },
  '#/i/q1 ~ another tier @ en 375': { pct: 0.07, why: 'the same ring, in English, on a phone' },

  /* The row landed. Same shape as #/i/q1 ~ another tier above: only the
     close button's own focus ring is left, off `showModal()`'s accessibility
     fix (ACCEPTED). Measured on this host (Windows, advisory - CI to
     confirm), the same three figures. */
  '#/roll/wondrous ~ modal @ ru 1100': { pct: 0.02, why: "the close button's own focus ring" },
  '#/roll/wondrous ~ modal @ ru 768': { pct: 0.03, why: 'the same ring, mid width' },
  '#/roll/wondrous ~ modal @ ru 375': { pct: 0.07, why: 'the same ring, on a phone' },
  '#/roll/wondrous ~ modal @ en 1100': { pct: 0.02, why: 'the same ring, in English' },
  '#/roll/wondrous ~ modal @ en 768': { pct: 0.03, why: 'the same ring, in English, mid width' },
  '#/roll/wondrous ~ modal @ en 375': { pct: 0.07, why: 'the same ring, in English, on a phone' },

  /* The row landed. Same shape as #/roll/wondrous ~ modal above - only the
     close button's own focus ring is left. Measured on this host (Windows,
     advisory - CI to confirm), the same three figures again. */
  '#/tables ~ a row opened @ ru 1100': { pct: 0.02, why: "the close button's own focus ring" },
  '#/tables ~ a row opened @ ru 768': { pct: 0.03, why: 'the same ring, mid width' },
  '#/tables ~ a row opened @ ru 375': { pct: 0.07, why: 'the same ring, on a phone' },
  '#/tables ~ a row opened @ en 1100': { pct: 0.02, why: 'the same ring, in English' },
  '#/tables ~ a row opened @ en 768': { pct: 0.03, why: 'the same ring, in English, mid width' },
  '#/tables ~ a row opened @ en 375': { pct: 0.07, why: 'the same ring, in English, on a phone' },

  /* The row and section anchors - all seven remaining entries, deleted by B9.
     Two mechanisms, both closed: the flash was a class written straight onto
     the DOM node (`target.classList.add('flash')`), which a keyed
     `{#each}`/`{#if}` re-render (a view switch, a language switch) discards
     along with the node, so the ring never drew on any route since it was
     wired up - that was the `@ en 1100|768` residue. And the 375 cells'
     residue was `tokens.css`'s blanket reduced-motion kill: the live app
     leaves every declared `transition` alive under `prefers-reduced-motion:
     reduce` (style.css 311/544 kill only two named animations), so Chrome's
     scroll anchoring adjusts the live document across the width sweep's
     transitions and the rewrite, with every transition dead, was not
     adjusted. B9 makes the flash reactive state (`flashKey` on
     `TablesPage`/`TableRows`, keyed on `${navigations}|${lang}` so it also
     re-plays on a language switch, as the live app does) and deletes the
     blanket kill outright - a real policy is owed after the migration,
     `docs/specs/DEBT.md`, D1. Measured 0.00% on every one of the seven
     entries, locally, after both fixes. The full diagnostic history - the
     `.flash` probe, the scroll-position readings, the transition-policy
     injection proof - is in git at `274aa99`, not repeated here. */
};


/** How far under its debt a state may sit before the number has to come down. */
const DEBT_SLACK = 0.5;

/**
 * Rendering noise, in percent.
 *
 * Zero means zero, but two machines do not hint text identically and a build
 * agent is not this laptop. pixelmatch already discards antialiasing pixels,
 * which removes most of it; this covers what is left. It is deliberately tiny -
 * a real difference is a control or a box, and those are worth whole percents,
 * not hundredths.
 */
const JITTER = 0.1;

/**
 * Recorded, not keyed: `Chip.svelte`'s button form writes `aria-pressed` where
 * the live money chips write nothing and the live menu chips write
 * `aria-current="true"` (app.js 2944). `d.controls()` reads names only, so no
 * key differs - an entry here would fail every run as stale, per `parity.js`'s
 * own rule that a stale `ACCEPTED` key is a failure, not a silent pass.
 * `Seg.svelte` writes `aria-pressed` on every segment, so the tables view
 * switch (app.js:2553) and the print page's colour / black-and-white switch
 * (3534-3537), which write none live, differ the same way; and
 * `PrintCard.svelte` draws the card's name as `<h2 class="pc-name">` where
 * `printCardHTML` writes `<h3>` (app.js:3419) - a heading level
 * `d.controls()` does not read. Both are B7's deliberate improvements;
 * Phase 7's sweep carries them into `FEATURES.md`.
 *
 * The live app also re-plays the anchor scroll-and-flash on every `render()`,
 * a tables search keystroke included (app.js:4435: `S.tables.q = el.value;
 * render()`); the rewrite re-plays it on a navigation and a language switch
 * only. No parity state types or ticks with an anchor in the address, so
 * nothing keys this either (`docs/specs/FEATURES.md`, "Tables and search").
 *
 * A two-frame link (`#/tables/frames/f_frame-beast_feast-colossus`) opens both
 * frames in the rewrite and empties the table in the live app, whose `fDecode`
 * (app.js:2724) reads it as the old `_` form on arrival; no state holds this
 * because the difference is the whole table, not a control. Phase 7's sweep
 * carries it into `FEATURES.md`.
 */

/**
 * Differences that are expected and are not defects.
 *
 * Keyed by `state :: spec :: field`. Every entry needs a reason, and
 * tests/parity.js fails if one of them stops differing - an excuse that is no
 * longer true is worse than none.
 */
const ACCEPTED = {
  /* An accessibility fix, not a drift. The live app names both number fields
     "Result of the roll" and all four steppers "One lower" / "One higher", so
     a screen reader hears the same two controls twice over and nothing says
     which die is being changed - on the one screen where that is the whole
     point. The rewrite puts the die in front of each name, which is what makes
     these sets differ. */
  '#/roll/alt @ ru :: the controls on the page :: controls': 'each die names its own field and steppers',
  '#/roll/alt @ en :: the controls on the page :: controls': 'each die names its own field and steppers',
  '#/roll/alt ~ crit @ ru :: the controls on the page :: controls': 'the same, on a critical success',
  '#/roll/alt ~ crit @ en :: the controls on the page :: controls': 'the same, on a critical success',
  '#/roll/alt ~ legendary crit @ ru :: the controls on the page :: controls': 'the same, at the top rarity',
  '#/roll/alt ~ legendary crit @ en :: the controls on the page :: controls': 'the same, at the top rarity',
  '#/roll/alt ~ crit, items only @ ru :: the controls on the page :: controls': 'the same, with one kind on',
  '#/roll/alt ~ crit, items only @ en :: the controls on the page :: controls': 'the same, with one kind on',

  /* A legacy defect, not an accessibility fix, and recorded here rather than
     reproduced: `list.map(tileHTML)` in app.js passes the array index as
     `tileHTML`'s second parameter (`num`), which the function treats as a roll
     number override. Every tile past the first in a plain table's grid view
     therefore shows its position in the list instead of its own roll number -
     confirmed against data.js, where core_item's first twelve rolls are a
     plain 1-12 and the live app draws 1, 1, 2, 3, 4, .... The rewrite draws
     each tile's real `roll`, which is the number the row view already shows
     and the number printed in the book. Copying the bug would mean carrying
     it forward past the point the live app is deleted, for a rewrite that is
     supposed to fix nothing on its own initiative - worth a note to the
     repository owner, not a value to reproduce. */
  '#/tables ~ grid @ ru :: the controls on the page :: controls':
    "a legacy bug: list.map(tileHTML) passes the array index as the tile's number past the first row",
  '#/tables ~ grid @ en :: the controls on the page :: controls':
    'the same, in English'
};


module.exports = { SPECS, STATES, LANGS, WIDTHS, ACCEPTED, VISUAL_DEBT, DEBT_SLACK, JITTER };
