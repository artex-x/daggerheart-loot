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

/** The record page: everything a person can do with one record. */
const recordActions = {
  name: 'what a record offers',
  only: ['#/i/ci1', '#/i/q1'],
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
  name: 'the name that lands on the clipboard',
  only: ['#/i/ci1', '#/i/q1'],
  async run(d) {
    await d.resetClipboard();
    await d.click('Скопировать название');
    return { clip: await d.clipboard() };
  }
};

const copiedText = {
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
 * The routes both apps are asked about, and whether the rewrite draws them yet.
 *
 * A route marked pending is still visited on the live app - the expectation is
 * collected from the first run - and reported as outstanding rather than failed.
 */
const ROUTES = [
  { route: '#/i/ci1', why: 'a loot record' },
  { route: '#/i/q1', why: 'an equipment record' },
  { route: '#/roll/wondrous', why: 'a roll on a table with a real die' },
  { route: '#/roll/dread', why: 'a roll on a table with no die of its own' },
  { route: '#/roll/std', why: 'Core rules', pending: 'roll panel for two sources' },
  { route: '#/roll/alt', why: 'the alternate tables', pending: 'duality dice' },
  { route: '#/roll/voa', why: 'Vault of Ages', pending: 'section picker' },
  { route: '#/roll/community', why: 'communities', pending: 'community picker' },
  { route: '#/tables', why: 'the table index', pending: 'tables slice' },
  { route: '#/tables/eq_weapon', why: 'one equipment table', pending: 'tables slice' },
  { route: '#/lists', why: 'the lists page', pending: 'lists slice' },
  { route: '#/search', why: 'search', pending: 'search slice' },
  { route: '#/print/ci1-q1', why: 'a print sheet', pending: 'print slice' }
];

const SPECS = [
  inventory,
  heading,
  recordActions,
  copiedName,
  copiedText,
  copiedImage,
  rollControls
];

/**
 * Differences that are expected and are not defects.
 *
 * Keyed by `route :: spec :: field`. Every entry needs a reason, and
 * tests/parity.js fails if one of them stops differing - an excuse that is no
 * longer true is worse than none.
 */
const ACCEPTED = {
  '#/i/ci1 :: what a record offers :: addToList': 'lists are a later slice',
  '#/i/q1 :: what a record offers :: addToList': 'lists are a later slice',
  '#/roll/wondrous :: the roll controls :: pinSection':
    'AppState.toggleHome exists and is tested; the control is not drawn yet',
  '#/roll/dread :: the roll controls :: pinSection':
    'AppState.toggleHome exists and is tested; the control is not drawn yet',

  /* The frame is not finished. The footer and its links, the help panel, the
     section anchor and the add-to-list control all live outside the slices
     built so far, so every route differs by the same handful of names. Each
     will be deleted from here by the slice that draws it. */
  '#/i/ci1 :: the controls on the page :: controls': 'footer and add-to-list are later slices',
  '#/i/q1 :: the controls on the page :: controls': 'footer and add-to-list are later slices',
  '#/roll/wondrous :: the controls on the page :: controls':
    'footer, help panel and section anchor are later slices',
  '#/roll/dread :: the controls on the page :: controls':
    'footer, help panel and section anchor are later slices',

  /* The record card carries a metadata line the rewrite does not draw yet -
     source, kind, roll number, and a link into the table - and the roll pages
     carry an explanation above the control. Both are content, not chrome, and
     both are outstanding rather than deliberate. */
  '#/i/ci1 :: the first line of the page :: starts': 'card metadata line is not ported yet',
  '#/i/q1 :: the first line of the page :: starts': 'card metadata line is not ported yet',
  '#/roll/wondrous :: the first line of the page :: starts':
    'the panel intro text is not ported yet',
  '#/roll/dread :: the first line of the page :: starts': 'the panel intro text is not ported yet'
};

module.exports = { SPECS, ROUTES, ACCEPTED };
