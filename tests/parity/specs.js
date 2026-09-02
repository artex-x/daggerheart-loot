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
  async run(d) {
    return {
      copyName: await d.has('Скопировать название'),
      copyText: await d.has('Скопировать текст'),
      copyImage: await d.has('Скопировать изображение'),
      copyLink: await d.has('Скопировать ссылку'),
      send: await d.has('Отправить'),
      addToList: await d.has('Добавить в список')
    };
  }
};

const copiedName = {
  presses: true,
  name: 'the name that lands on the clipboard',
  only: ['#/i/ci1', '#/i/q1'],
  async run(d) {
    await d.resetClipboard();
    await d.click('Скопировать название');
    return { clip: await d.clipboard() };
  }
};

const copiedText = {
  presses: true,
  name: 'the text that lands on the clipboard',
  only: ['#/i/ci1', '#/i/q1'],
  async run(d) {
    await d.resetClipboard();
    await d.click('Скопировать текст');
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
  async run(d) {
    await d.resetClipboard();
    await d.click('Скопировать изображение');
    return { image: await d.clipboardImage() };
  }
};

/** The roll pages: the label on the button says which die, or that there is none. */
const rollControls = {
  name: 'the roll controls',
  only: ['#/roll/wondrous', '#/roll/dread'],
  async run(d) {
    const controls = await d.controls();
    return {
      /* The label carries the range, so it is the one string worth comparing
         character for character - "Случайно 1-29" is a promise about the table. */
      rollLabel: controls.find((c) => c.startsWith('Бросить') || c.startsWith('Случайно')) ?? null,
      stepper: (await d.has('На единицу меньше')) && (await d.has('На единицу больше')),
      pinSection: await d.has('Открывать этот раздел при запуске')
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

  /* The other language. Every string on the screen changes and so does the
     wrapping, and one press is all it takes to get here. */
  {
    id: '#/i/ci1 ~ en',
    route: '#/i/ci1',
    why: 'a record in the other language',
    enter: async (d) => {
      await d.click('EN');
    }
  },
  {
    id: '#/roll/wondrous ~ en',
    route: '#/roll/wondrous',
    why: 'a roll page in the other language',
    enter: async (d) => {
      await d.click('EN');
    }
  },

  /* A phone. style.css has four breakpoints and the harness was only ever
     asking about the widest of them. */
  { id: '#/i/ci1 ~ 375', route: '#/i/ci1', why: 'a record on a phone', width: 375, height: 812 },
  {
    id: '#/roll/wondrous ~ 375',
    route: '#/roll/wondrous',
    why: 'a roll page on a phone',
    width: 375,
    height: 812
  },

  /* Below the fold. A record card is taller than the window, so the picture,
     the badges and the name were being compared and the description, the craft
     chain, the references and the footer were not. */
  { id: '#/i/ci1 ~ whole', route: '#/i/ci1', why: 'a record page end to end', whole: true },

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

  { id: '#/roll/std', route: '#/roll/std', why: 'Core rules', pending: 'roll panel for two sources' },
  { id: '#/roll/alt', route: '#/roll/alt', why: 'the alternate tables', pending: 'duality dice' },
  { id: '#/roll/voa', route: '#/roll/voa', why: 'Vault of Ages', pending: 'section picker' },
  {
    id: '#/roll/community',
    route: '#/roll/community',
    why: 'communities',
    pending: 'community picker'
  },
  { id: '#/tables', route: '#/tables', why: 'the table index', pending: 'tables slice' },
  {
    id: '#/tables/eq_weapon',
    route: '#/tables/eq_weapon',
    why: 'one equipment table',
    pending: 'tables slice'
  },
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
const VISUAL_DEBT = {
  '#/i/ci1': {
    pct: 0.71,
    why: 'the add-to-list and print row under the card is not drawn yet, and the footer - added because the licence asks for it on every page - therefore sits higher than the original'
  },
  '#/i/q1': {
    pct: 0.98,
    why: 'the add-to-list and print row, as above'
  },
  '#/roll/dread': {
    pct: 0.17,
    why: 'a hair on the first row, which is equipment: its stat chips wrap one pixel differently from the original at this width'
  },

  '#/roll/wondrous ~ modal': {
    pct: 6.03,
    why: 'the same add-to-list and print row the record page owes - the modal draws the full card, so it is short by that row and everything above it is centred higher. The close button also carries a focus ring the original has not got, because showModal() moves the keyboard into the dialog and the live app leaves it on the page behind'
  },

  '#/roll/wondrous ~ help': {
    pct: 0.3,
    why: 'two lines of the help text rasterise a pixel lower. Measured rather than guessed: the box, every paragraph, all thirteen line boxes and the colour are identical to three decimal places and the text matches character for character, so there is no value here to copy - do not go looking for one'
  },

  '#/i/ci1 ~ en': {
    pct: 0.57,
    why: 'the add-to-list and print row, as in Russian. It scores lower than the Russian page only because English is shorter and there is less of it to disagree about'
  },

  /* The phone. style.css has four breakpoints; the rewrite has copied the
     values at the widest one and nothing below it, which is why these two are
     the largest numbers in the file. */
  '#/i/ci1 ~ 375': {
    pct: 9.24,
    why: 'the mobile breakpoints are not ported: the picture column, the badge row, the name row and the topbar all keep their desktop sizes, so the card body is wider and everything inside it wraps differently'
  },
  '#/roll/wondrous ~ 375': {
    pct: 15.04,
    why: 'the mobile breakpoints, as above, over a result card - the widest gap in the port and the next thing to close'
  },

  '#/i/ci1 ~ whole': {
    pct: 5.31,
    why: 'the same missing add-to-list and print row as the fold-height state, over a page four times as tall: the whole card, the craft chain and the footer are all shifted up by the row that is not drawn'
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
  '#/i/ci1 :: what a record offers :: addToList': 'lists are a later slice',
  '#/i/q1 :: what a record offers :: addToList': 'lists are a later slice',
  '#/roll/wondrous ~ modal :: what a record offers :: addToList': 'lists are a later slice',

  /* The frame is not finished. The footer and its links, the help panel, the
     section anchor and the add-to-list control all live outside the slices
     built so far, so every route differs by the same handful of names. Each
     will be deleted from here by the slice that draws it. */
  '#/i/ci1 :: the controls on the page :: controls': 'add-to-list and print are later slices',
  '#/i/q1 :: the controls on the page :: controls': 'add-to-list and print are later slices',
  '#/i/ci1 ~ en :: the controls on the page :: controls': 'add-to-list and print, in English',
  '#/i/ci1 ~ 375 :: the controls on the page :: controls': 'add-to-list and print, on a phone',
  '#/i/ci1 ~ whole :: the controls on the page :: controls': 'add-to-list and print, whole page',
  '#/roll/wondrous ~ modal :: the controls on the page :: controls':
    'add-to-list, which the card in a modal offers too',

  /* The record card carries a metadata line the rewrite does not draw yet -
     source, kind, roll number, and a link into the table - and the roll pages
     carry an explanation above the control. Both are content, not chrome, and
     both are outstanding rather than deliberate. */
  /* ci1 matches now. q1 does not: the equipment card prints its stats as a row
     of chips and the rewrite prints one line, so the text after the heading
     still reads differently. */
  '#/i/q1 :: the first line of the page :: starts': 'the equipment stat chips are one line here and a row there',
};

module.exports = { SPECS, STATES, ACCEPTED, VISUAL_DEBT, DEBT_SLACK, JITTER };
