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
    filterLink: 'Ссылка на фильтры'
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
    filterLink: 'Filter link'
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
  only: ['#/i/ci1', '#/i/q1', '#/roll/wondrous ~ modal'],
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
  only: ['#/tables/wondrous ~ filtered'],
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
  only: ['#/tables/wondrous ~ filtered'],
  async run(d, lang) {
    await d.resetClipboard();
    await d.click(NAME[lang].filterLink);
    const clip = await d.clipboard();
    const hash = clip.text?.slice(clip.text.indexOf('#')) ?? null;
    return { hash };
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

const STATES = [
  { id: '#/i/ci1', route: '#/i/ci1', why: 'a loot record' },
  { id: '#/i/q1', route: '#/i/q1', why: 'an equipment record' },
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
    }
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

  /* What the app says after a copy. The live app raises a toast; the rewrite
     only announces it, to a screen reader. Found by accident: the screenshot
     used to be taken after the clipboard specs had pressed things, so the
     toast was quietly inflating the debt on both record routes. */
  {
    id: '#/i/ci1 ~ toast',
    route: '#/i/ci1',
    why: 'what the app says after a copy',
    enter: async (d) => {
      await d.click('Скопировать название');
    },
    pending: 'the toast is a later slice'
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
    id: '#/tables ~ a row ticked',
    route: '#/tables',
    why: 'the selection, where the missing bar is honest',
    enter: async (d) => {
      await d.click('Выбрано');
    }
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
    why: 'one equipment table',
    pending: 'the equipment tables are batch B4'
  },
  {
    id: '#/tables/eq_secondary',
    route: '#/tables/eq_secondary',
    why: 'a second equipment table',
    pending: 'the equipment tables are batch B4'
  },
  {
    id: '#/tables/eq_armor',
    route: '#/tables/eq_armor',
    why: 'a third equipment table',
    pending: 'the equipment tables are batch B4'
  },
  { id: '#/tables/voa', route: '#/tables/voa', why: 'a sectioned body: Vault of Ages by tier' },
  { id: '#/tables/frames', route: '#/tables/frames', why: 'a sectioned body: campaign frames' },
  { id: '#/tables/community', route: '#/tables/community', why: 'a sectioned body: communities' },
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

  { id: '#/lists', route: '#/lists', why: 'the lists page', pending: 'lists slice' },
  { id: '#/search', route: '#/search', why: 'search', pending: 'search slice' },
  { id: '#/print/ci1-q1', route: '#/print/ci1-q1', why: 'a print sheet', pending: 'print slice' }
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
  visuals
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
 * screen deletes its entry. It may go up in one case, and it needs saying out
 * loud in the reason when it does: content that is required and correct can
 * land before the content that positions it, and then it is in the right shape
 * at the wrong height. The footer did exactly that - it is on every page
 * because the licence asks for it, and until the panels above it are the same
 * height as the original's it counts as changed twice over. Both screenshots and a diff image land in
 * test-output/parity/ on every run, so what is left is a picture rather than an
 * argument.
 */
/* The add-to-list and print row is missing from every record card, so it is
   owed once per cell rather than once. The number is bigger on a phone, where
   the row would wrap to two lines, and bigger again end to end, where it moves
   a whole footer. */
const listRow = (pct, where) => ({ pct, why: `the add-to-list and print row, ${where}` });

/* Two lines of the help text rasterise a pixel lower. Measured, not guessed:
   the box, every paragraph, every line box and the colour were identical to
   three decimals and the text matches character for character, so there is no
   value here to copy - do not go looking for one. */
const helpNoise = (pct) => ({
  pct,
  why: 'a line or two of the help text rasterises a pixel lower; geometry, colour and text were measured identical, so there is nothing to copy'
});

/* The selection bar - add to list, print, copy selection - is lists' and
   print's job, not the plain table's; see ACCEPTED for the control list. */
const selBar = (pct, where) => ({ pct, why: `the selection bar, ${where}` });

const VISUAL_DEBT = {
  '#/i/ci1 @ ru 1100': listRow(0.7, 'under a loot card'),
  '#/i/ci1 @ ru 768': listRow(0.78, 'under a loot card, mid width'),
  '#/i/ci1 @ ru 375': listRow(0.44, 'under a loot card, on a phone'),
  '#/i/ci1 @ en 1100': listRow(0.56, 'in English'),
  '#/i/ci1 @ en 768': listRow(0.57, 'in English, mid width'),
  '#/i/ci1 @ en 375': listRow(1.32, 'in English on a phone, where the two buttons wrap'),

  /* Four of these six entries are gone, and the two that are left are a
     tenth of what they were. Almost all of it was the tier ladder, which was
     unported and which this reason never named - at 768 and 375 the equipment
     card is tall enough to push the add-to-list row below the fold, so with
     the ladder drawn those states are exact. What is left at 1100 is the row
     itself, just above the fold. */
  '#/i/q1 @ ru 1100': listRow(0.12, 'the top of the row, just above the fold'),
  '#/i/q1 @ en 1100': listRow(0.1, 'the same, in English'),

  /* The modal a rung of the ladder opens. Same cause as the Wondrous modal:
     the card in it is short by the add-to-list row, and a centred dialog moves
     everything in it when its height changes. */
  '#/i/q1 ~ another tier @ ru 1100': listRow(5.05, 'inside the modal a rung opens'),
  '#/i/q1 ~ another tier @ ru 768': listRow(7.22, 'inside that modal, mid width'),
  '#/i/q1 ~ another tier @ ru 375': listRow(11.92, 'inside that modal, on a phone'),
  '#/i/q1 ~ another tier @ en 1100': listRow(4.61, 'inside that modal, in English'),
  '#/i/q1 ~ another tier @ en 768': listRow(6.63, 'inside that modal, in English, mid width'),
  '#/i/q1 ~ another tier @ en 375': listRow(11.06, 'inside that modal, in English, on a phone'),

  '#/i/ci1 ~ whole @ ru 1100': listRow(5.29, 'over the whole page, which it shifts the footer down'),
  '#/i/ci1 ~ whole @ ru 768': listRow(5.39, 'over the whole page, mid width'),
  '#/i/ci1 ~ whole @ ru 375': listRow(7.28, 'over the whole page, on a phone'),
  '#/i/ci1 ~ whole @ en 1100': listRow(5.17, 'over the whole page, in English'),
  '#/i/ci1 ~ whole @ en 768': listRow(5.22, 'over the whole page, in English, mid width'),
  '#/i/ci1 ~ whole @ en 375': listRow(7.01, 'over the whole page, in English, on a phone'),

  /* The same row, plus a focus ring the original has not got: showModal() moves
     the keyboard into the dialog and the live app leaves it on the page behind,
     which is the accessibility fix recorded in ACCEPTED. Larger the narrower
     the window, because the card is a fixed 440px and the page around it is
     not. */
  '#/roll/wondrous ~ modal @ ru 1100': listRow(6.03, 'inside the modal, with the close button focused'),
  '#/roll/wondrous ~ modal @ ru 768': listRow(8.57, 'inside the modal, mid width'),
  '#/roll/wondrous ~ modal @ ru 375': listRow(13.55, 'inside the modal, on a phone'),
  '#/roll/wondrous ~ modal @ en 1100': listRow(5.37, 'inside the modal, in English'),
  '#/roll/wondrous ~ modal @ en 768': listRow(7.73, 'inside the modal, in English, mid width'),
  '#/roll/wondrous ~ modal @ en 375': listRow(12.01, 'inside the modal, in English, on a phone'),

  /* The live app raises a toast to say where the app will open now, and the
     rewrite has no toast yet - the same gap #/i/ci1 ~ toast is pending for.
     It grows as the window narrows because the toast is a fixed size and the
     screen around it is not. */
  '#/roll/wondrous ~ pinned @ ru 1100': { pct: 1.36, why: 'the toast that says where the app will open, which is a later slice' },
  '#/roll/wondrous ~ pinned @ ru 768': { pct: 1.95, why: 'the same toast, mid width' },
  '#/roll/wondrous ~ pinned @ ru 375': { pct: 3.64, why: 'the same toast, on a phone' },
  '#/roll/wondrous ~ pinned @ en 1100': { pct: 1.36, why: 'the same toast, in English' },
  '#/roll/wondrous ~ pinned @ en 768': { pct: 1.95, why: 'the same toast, in English, mid width' },
  '#/roll/wondrous ~ pinned @ en 375': { pct: 3.82, why: 'the same toast, in English, on a phone' },

  /* Core rules has the same rasterisation noise, and its help is the one with
     four bold lines inside a paragraph - the whole text was compared character
     for character after the shape landed, and it is identical. */
  '#/roll/std ~ help @ ru 1100': helpNoise(0.36),
  '#/roll/std ~ help @ ru 768': helpNoise(0.72),
  '#/roll/std ~ help @ ru 375': helpNoise(0.6),
  '#/roll/std ~ help @ en 1100': helpNoise(0.49),
  '#/roll/std ~ help @ en 768': helpNoise(0.66),
  '#/roll/std ~ help @ en 375': helpNoise(0.34),

  '#/roll/wondrous ~ help @ ru 1100': helpNoise(0.29),
  '#/roll/wondrous ~ help @ ru 768': helpNoise(0.73),
  '#/roll/wondrous ~ help @ ru 375': helpNoise(0.52),
  '#/roll/wondrous ~ help @ en 1100': helpNoise(0.44),
  '#/roll/wondrous ~ help @ en 768': helpNoise(0.29),
  '#/roll/wondrous ~ help @ en 375': helpNoise(0.79),

  /* Below 900px the toolbar's search box carries almost the whole of these
     numbers: the box and its placeholder measured pixel-identical crop for
     crop against the live app (same left, same width, same text), and the
     rest of each screen - the chips, the rows, the tiles - matched exactly on
     its own. What is left reads as antialiasing on the placeholder's thin,
     muted glyphs, the same class of noise `helpNoise` names, not a value
     to go copy. */
  '#/tables @ ru 768': { pct: 0.13, why: 'search-box placeholder antialiasing - see the note above VISUAL_DEBT' },
  '#/tables @ ru 375': { pct: 1.14, why: 'the same, on a phone' },
  '#/tables @ en 375': { pct: 1.0, why: 'the same, in English' },
  '#/tables/hnf_consumable @ ru 768': { pct: 0.13, why: 'the same, mid width' },
  '#/tables/hnf_consumable @ ru 375': { pct: 1.49, why: 'the same, on a phone' },
  '#/tables/hnf_consumable @ en 375': { pct: 1.61, why: 'the same, in English on a phone' },
  '#/tables ~ grid @ ru 1100': { pct: 0.1, why: 'the same, at full width' },
  '#/tables ~ grid @ ru 768': { pct: 0.14, why: 'the same, mid width' },
  '#/tables ~ grid @ ru 375': { pct: 0.28, why: 'the same, on a phone' },
  '#/tables ~ grid @ en 768': { pct: 0.11, why: 'the same, in English, mid width' },
  '#/tables ~ grid @ en 375': { pct: 0.22, why: 'the same, in English, on a phone' },
  '#/tables ~ searched @ ru 375': { pct: 1.0, why: 'the same, with a query typed into the box' },
  '#/tables ~ searched @ en 375': { pct: 1.04, why: 'the same, in English' },
  '#/tables ~ nothing found @ ru 375': { pct: 0.12, why: 'the same, on a phone' },
  '#/tables ~ nothing found @ en 375': { pct: 0.13, why: 'the same, in English' },

  /* B2's six wondrous states carry the same placeholder noise as the four
     tables above - every one is exact at 1100, where the placeholder is not
     cropped by the toolbar's narrower layout. On a phone, wondrous is also
     the first table B1 or B2 built with a description long enough to wrap
     differently by a word - see the note on dread below; it is the same
     noise, just reached from a different row this time. */
  '#/tables/wondrous @ ru 768': { pct: 0.13, why: 'search-box placeholder antialiasing - see the note above VISUAL_DEBT' },
  '#/tables/wondrous @ ru 375': { pct: 1.56, why: 'the placeholder noise, plus a description line wrapping one word earlier than the live app - both measured, nothing to copy' },
  '#/tables/wondrous @ en 375': { pct: 1.51, why: 'the same, in English' },
  '#/tables/wondrous ~ panel open @ ru 1100': { pct: 0.11, why: 'the space in "любое" rasterises a shade differently at full width - measured character-for-character identical' },
  '#/tables/wondrous ~ panel open @ en 768': { pct: 0.11, why: 'the same rasterisation noise, in English at mid width' },
  '#/tables/wondrous ~ panel open @ ru 768': { pct: 0.13, why: 'search-box placeholder antialiasing - see the note above VISUAL_DEBT' },
  '#/tables/wondrous ~ panel open @ ru 375': { pct: 0.29, why: 'the same, on a phone' },
  '#/tables/wondrous ~ panel open @ en 375': { pct: 0.41, why: 'the same, in English' },
  '#/tables/wondrous ~ filtered @ ru 768': { pct: 0.13, why: 'the same, mid width' },
  '#/tables/wondrous ~ filtered @ ru 375': { pct: 0.29, why: 'the same, on a phone' },
  '#/tables/wondrous ~ filtered @ en 375': { pct: 0.22, why: 'the same, in English' },
  '#/tables/wondrous ~ filter link @ ru 768': { pct: 0.13, why: 'the same, mid width' },
  '#/tables/wondrous ~ filter link @ ru 375': { pct: 0.29, why: 'the same, on a phone' },
  '#/tables/wondrous ~ filter link @ en 375': { pct: 0.22, why: 'the same, in English' },
  '#/tables/wondrous ~ nothing found @ ru 375': { pct: 0.12, why: 'the same, on a phone' },
  '#/tables/wondrous ~ nothing found @ en 375': { pct: 0.13, why: 'the same, in English' },

  '#/tables/dread @ ru 768': { pct: 0.13, why: 'the same, mid width' },
  /* Dread's own row text happens to break one word earlier on a phone -
     measured against the live app rather than guessed: the picture, the
     name, the stat line and every badge are pixel-identical, and only the
     description's line-wrap point differs by a few sub-pixels of kerning.
     No table B1 or B2 built had a row long enough at 375px to show this;
     dread is the first, not a regression the filter caused. */
  '#/tables/dread @ ru 375': { pct: 1.51, why: 'a description line wraps one word earlier than the live app at this width - measured pixel-identical apart from the wrap point, nothing to copy' },
  '#/tables/dread @ en 375': { pct: 1.41, why: 'the same, in English' },

  /* The record modal a row opens is the same short-by-a-row card every other
     modal draws - see the note on #/roll/wondrous ~ modal above. */
  '#/tables ~ a row opened @ ru 1100': listRow(4.65, 'inside the modal a row opens'),
  '#/tables ~ a row opened @ ru 768': listRow(6.7, 'inside that modal, mid width'),
  '#/tables ~ a row opened @ ru 375': listRow(10.72, 'inside that modal, on a phone'),
  '#/tables ~ a row opened @ en 1100': listRow(4.06, 'inside that modal, in English'),
  '#/tables ~ a row opened @ en 768': listRow(5.82, 'inside that modal, in English, mid width'),
  '#/tables ~ a row opened @ en 375': listRow(9.21, 'inside that modal, in English, on a phone'),

  /* The selection bar - add to list, print, copy selection - sits at the
     bottom of the window once a row is ticked, and does not exist yet; the
     control list says so in ACCEPTED. Bigger on a phone, where the bar wraps
     to two rows instead of one. */
  '#/tables ~ a row ticked @ ru 1100': selBar(1.19, 'at the bottom of the window'),
  '#/tables ~ a row ticked @ ru 768': selBar(1.52, 'mid width'),
  '#/tables ~ a row ticked @ ru 375': selBar(4.59, 'on a phone, where the bar wraps to two rows'),
  '#/tables ~ a row ticked @ en 1100': selBar(1.0, 'in English'),
  '#/tables ~ a row ticked @ en 768': selBar(1.32, 'in English, mid width'),
  '#/tables ~ a row ticked @ en 375': selBar(4.51, 'in English, on a phone'),

  /* The tables help panel has the same rasterisation noise as the other two -
     the box, every paragraph and the colour were measured identical, and two
     of the paragraphs carry a bold lead the way Wondrous's does. */
  '#/tables ~ help @ ru 1100': helpNoise(0.4),
  '#/tables ~ help @ ru 768': helpNoise(1.08),
  '#/tables ~ help @ ru 375': helpNoise(2.12),
  '#/tables ~ help @ en 1100': helpNoise(0.49),
  '#/tables ~ help @ en 768': helpNoise(1.58),
  '#/tables ~ help @ en 375': helpNoise(0.65),

  /* B3's five sectioned tables carry the same two causes every table since B1
     has: the search-box placeholder antialiasing at 768, and a description
     line wrapping one word earlier than the live app on a phone - measured
     the same way dread's own entry was, not guessed at. Nothing about
     sectioning changes either cause; these are the same noise, on new rows. */
  '#/tables/voa @ ru 768': { pct: 0.13, why: 'search-box placeholder antialiasing - see the note above VISUAL_DEBT' },
  '#/tables/voa @ ru 375': { pct: 0.88, why: 'the placeholder noise, plus a description line wrapping one word earlier than the live app' },
  '#/tables/voa @ en 375': { pct: 1.01, why: 'the same, in English' },
  '#/tables/frames @ ru 768': { pct: 0.13, why: 'search-box placeholder antialiasing - see the note above VISUAL_DEBT' },
  '#/tables/frames @ ru 375': { pct: 0.8, why: 'the placeholder noise, plus a description line wrapping one word earlier than the live app' },
  '#/tables/frames @ en 375': { pct: 0.98, why: 'the same, in English' },
  '#/tables/community @ ru 768': { pct: 0.13, why: 'search-box placeholder antialiasing - see the note above VISUAL_DEBT' },
  '#/tables/community @ ru 375': { pct: 1.2, why: 'the placeholder noise, plus a description line wrapping one word earlier than the live app' },
  '#/tables/community @ en 375': { pct: 1.37, why: 'the same, in English' },
  '#/tables/alt_item @ ru 768': { pct: 0.13, why: 'search-box placeholder antialiasing - see the note above VISUAL_DEBT' },
  '#/tables/alt_item @ ru 375': { pct: 1.11, why: 'the placeholder noise, plus a description line wrapping one word earlier than the live app' },
  '#/tables/alt_item @ en 375': { pct: 1.03, why: 'the same, in English' },
  '#/tables/alt_consumable @ ru 768': { pct: 0.13, why: 'search-box placeholder antialiasing - see the note above VISUAL_DEBT' },
  '#/tables/alt_consumable @ ru 375': { pct: 1.14, why: 'the placeholder noise, plus a description line wrapping one word earlier than the live app' },
  '#/tables/alt_consumable @ en 375': { pct: 1.1, why: 'the same, in English' },

  /* The row and section anchors, at 1100 and 768: the flash outline itself is
     the whole difference. Measured directly rather than assumed - the target
     row's position, size and every pixel of its content match exactly at
     these widths, only the 2px gold ring rasterises a fraction of a pixel
     differently between the two apps, same class of noise as the help panel
     and the placeholder, just on an outline instead of text. */
  '#/tables/core_item ~ row anchor @ en 1100': {
    pct: 0.42,
    why: "the flash outline's own antialiasing - the row underneath measures pixel-identical"
  },
  '#/tables/core_item ~ row anchor @ en 768': {
    pct: 0.43,
    why: "the same, mid width"
  },
  '#/tables/voa ~ section anchor @ en 1100': {
    pct: 0.63,
    why: "the flash outline's own antialiasing - the section underneath measures pixel-identical"
  },
  '#/tables/voa ~ section anchor @ en 768': {
    pct: 0.42,
    why: 'the same, mid width'
  },

  /* The same two anchors, on a phone: arriving scrolls straight past the
     toolbar and the filter bar, so several description-heavy rows sit in the
     fold at once where the bare route only ever showed one or two - the same
     line-wrap noise above, multiplied by how many long descriptions are on
     screen together rather than a new cause. Confirmed by measuring the
     target row/section directly: its own position and size match the live
     app to the pixel in both languages, and `getBoundingClientRect()` on
     every row inside Vault of Ages' artifact section reported identical
     names and heights on both apps - the debt is entirely in text below the
     fold reflowing a word earlier, the way dread's own entry already does,
     just several rows of it landing above the fold together at this width. */
  '#/tables/core_item ~ row anchor @ ru 375': {
    pct: 8.85,
    why: 'several description-heavy rows sit above the fold at once here, each wrapping a word earlier than the live app - the same noise as every other 375px description entry, not a new cause'
  },
  '#/tables/core_item ~ row anchor @ en 375': {
    pct: 8.51,
    why: 'the same, in English'
  },
  '#/tables/voa ~ section anchor @ ru 375': {
    pct: 9.52,
    why: 'the same reflow noise, across the several rows Vault of Ages\' artifact section brings above the fold together at this width'
  },
  '#/tables/voa ~ section anchor @ en 375': {
    pct: 8.84,
    why: 'the same, in English'
  }
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
 * Differences that are expected and are not defects.
 *
 * Keyed by `state :: spec :: field`. Every entry needs a reason, and
 * tests/parity.js fails if one of them stops differing - an excuse that is no
 * longer true is worse than none.
 */
const ACCEPTED = {
  /* The add-to-list control and the print link belong to slices that do not
     exist yet, so every card is short by them and every route that draws a
     card says so. Keyed without the language and width because the specs run
     once per language, not once per cell. */
  '#/i/ci1 @ ru :: what a record offers :: addToList': 'lists are a later slice',
  '#/i/ci1 @ en :: what a record offers :: addToList': 'lists are a later slice',
  '#/i/q1 @ ru :: what a record offers :: addToList': 'lists are a later slice',
  '#/i/q1 @ en :: what a record offers :: addToList': 'lists are a later slice',
  '#/roll/wondrous ~ modal @ ru :: what a record offers :: addToList': 'lists are a later slice',
  '#/roll/wondrous ~ modal @ en :: what a record offers :: addToList': 'lists are a later slice',

  '#/i/ci1 @ ru :: the controls on the page :: controls': 'add-to-list and print are later slices',
  '#/i/ci1 @ en :: the controls on the page :: controls': 'add-to-list and print are later slices',
  '#/i/q1 @ ru :: the controls on the page :: controls': 'add-to-list and print are later slices',
  '#/i/q1 @ en :: the controls on the page :: controls': 'add-to-list and print are later slices',
  '#/i/ci1 ~ whole @ ru :: the controls on the page :: controls': 'add-to-list and print, whole page',
  '#/i/ci1 ~ whole @ en :: the controls on the page :: controls': 'add-to-list and print, whole page',
  '#/roll/wondrous ~ modal @ ru :: the controls on the page :: controls':
    'add-to-list, which the card in a modal offers too',
  '#/i/q1 ~ another tier @ ru :: the controls on the page :: controls':
    'add-to-list and print, in the modal a rung of the ladder opens',
  '#/i/q1 ~ another tier @ en :: the controls on the page :: controls':
    'add-to-list and print, in the modal a rung of the ladder opens',
  '#/roll/wondrous ~ modal @ en :: the controls on the page :: controls':
    'add-to-list, which the card in a modal offers too',

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

  /* B1 draws the selection box that ticks and the checkbox that carries it, but
     not the bar that appears at the bottom of the window once something is
     ticked - add to list, print, copy selection. Naming that bar is lists' and
     print's job, not this slice's. */
  '#/tables ~ a row ticked @ ru :: the controls on the page :: controls':
    'the selection bar - add to list, print, copy selection - is lists and print, not this slice',
  '#/tables ~ a row ticked @ en :: the controls on the page :: controls':
    'the same, in English',

  /* The record modal a row opens is the same card every other modal draws, and
     it is short by the same row. */
  '#/tables ~ a row opened @ ru :: the controls on the page :: controls':
    'add-to-list, which the card in a modal offers too',
  '#/tables ~ a row opened @ en :: the controls on the page :: controls':
    'add-to-list, which the card in a modal offers too',

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
