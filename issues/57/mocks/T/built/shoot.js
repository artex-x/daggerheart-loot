/* Batch TD evidence, not a gate: the Thumb Rule (mocks/T/built), the plates and the GM looks
   (mocks/D/built) and the text measure (mocks/text/built), RU and EN.
   node issues/57/mocks/T/built/shoot.js [file id prefix]  (after `npm run build:test`).
   Scratch: the closeout deletes it with issues/57/. */
const path = require('path');
const { fresh, closeBrowser } = require('../../../../../tests/app/lib.js');
const { STATES } = require('../../../../../tests/app/inventory.js');

const T = __dirname;
const D = path.join(__dirname, '..', '..', 'D', 'built');
const X = path.join(__dirname, '..', '..', 'text', 'built');
const LIST = '#/lists/00000000-0000-4000-8000-000000008001';
const PHONE = [
  [360, 640],
  [390, 844]
];
const SMALL = [
  [360, 640],
  [1180, 720]
];

/* [dir, file id, inventory state id, sizes, full page] */
const PAGES = [
  [T, 'roll-std', '#/roll/std', PHONE, false],
  [T, 'roll-alt', '#/roll/alt', PHONE, false],
  [T, 'roll-std-setup', '#/roll/std ~ set up', PHONE, false],
  [T, 'tables-eq-weapon', '#/tables/eq_weapon', PHONE, false],
  [T, 'tables-filters', '#/tables/eq_weapon ~ filter sheet', PHONE, false],
  [T, 'tables-selecting', '#/tables/eq_weapon ~ selecting', PHONE, false],
  [T, 'search', '#/search ~ searched', PHONE, false],
  [T, 'lists', '#/lists as gm1', PHONE, false],
  [T, 'lists-many', '#/lists ~ many lists as gm4', PHONE, false],
  [T, 'list-many', LIST + ' ~ many as gm4', PHONE, false],
  [T, 'shared-player', '#/s/player-token-1', PHONE, false],
  [T, 'homebrew', '#/homebrew as gm3', PHONE, false],
  [T, 'editor', '#/homebrew/hb_emberaxeaaaaaaaa as gm1', PHONE, false],
  [T, 'item-q1', '#/i/q1 ~ more as gm3', PHONE, false],
  [T, 'lists-limit', '#/lists ~ list limit as gm2', [[360, 640]], false],
  [D, 'search', '#/search', [...SMALL, [1920, 1080]], false],
  [D, 'search-none', '#/search ~ nothing found', SMALL, false],
  [D, 'tables-none', '#/tables/eq_armor ~ nothing found', [[1180, 720]], false],
  [D, 'tables-none', '#/tables ~ nothing found', [[360, 640]], false],
  [D, 'lists-empty', '#/lists ~ empty as gm4', SMALL, false],
  [D, 'lists-out', '#/lists', SMALL, false],
  [D, 'homebrew-none', '#/homebrew ~ no match as gm3', [...SMALL, [1920, 1080]], false],
  [
    D,
    'list-gm-only',
    '#/lists/00000000-0000-4000-8000-000000000101 ~ gm only as gm1',
    SMALL,
    true
  ],
  [D, 'shared-gm-only', '#/s/gm-token-1 ~ gm only', SMALL, true],
  [
    X,
    'help-tables',
    '#/roll/std ~ help',
    [
      [768, 1024],
      [1920, 1080]
    ],
    false
  ],
  [
    X,
    'help-voa',
    '#/roll/arazo ~ help',
    [
      [768, 1024],
      [1920, 1080]
    ],
    false
  ],
  [
    X,
    'note',
    '#/s/gm-token-1',
    [
      [768, 1024],
      [1920, 1080]
    ],
    false
  ],
  [
    X,
    'signin',
    '#/lists',
    [
      [768, 1024],
      [1920, 1080]
    ],
    false
  ],
  [
    X,
    'account',
    '#/account',
    [
      [768, 1024],
      [1920, 1080]
    ],
    false
  ]
];

async function inv(sid, width, height, lang) {
  const state = STATES.find((x) => x.id === sid);
  if (!state) throw new Error('no state ' + sid);
  const got = await fresh({ width, height, storage: state.storage });
  await got.d.open(state.route, {
    as: state.as,
    items: state.items,
    sections: state.sections,
    sources: state.sources,
    hold: state.hold
  });
  if (state.enter) await state.enter(got.d);
  await got.d.settled(state.id);
  if (lang === 'en') {
    await got.d.click('EN');
    if (state.again) await state.again(got.d);
  }
  await got.d.addressSettled();
  return got;
}

(async () => {
  const only = process.argv[2];
  for (const [dir, id, sid, sizes, full] of PAGES) {
    if (only && !id.startsWith(only)) continue;
    for (const [width, height] of sizes) {
      for (const lang of ['ru', 'en']) {
        try {
          const got = await inv(sid, width, height, lang);
          await got.d.settle();
          await got.page.evaluate(async () => {
            await document.fonts.ready;
            scrollTo(0, 0);
          });
          await got.page.screenshot({
            path: path.join(dir, `${id}__${width}__${lang}.png`),
            fullPage: full
          });
          await got.ctx.close();
        } catch (e) {
          console.log('skipped ' + id + ' ' + width + ' ' + lang + ': ' + e.message);
        }
      }
    }
  }
  await closeBrowser();
})();
