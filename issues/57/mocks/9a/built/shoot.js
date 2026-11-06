/* Batch 9a evidence, not a gate: the list pages at 360x640, 390x844 and 1180x720 RU and EN, and
   at 1920x1080 for the search row and the bar (W's size list).
   node issues/57/mocks/9a/built/shoot.js  (after `npm run build:test`).
   Scratch: the closeout deletes it with issues/57/. */
const path = require('path');
const { fresh, closeBrowser } = require('../../../../../tests/app/lib.js');
const { STATES } = require('../../../../../tests/app/inventory.js');

const OUT = __dirname;
const LIST_A = '#/lists/00000000-0000-4000-8000-000000008001';

/* [file id, inventory state id, the sizes it is shot at] */
const SMALL = [
  [360, 640],
  [1180, 720]
];
const ROWS = [...SMALL, [390, 844]];
const PAGES = [
  ['list', LIST_A + ' as gm4', ROWS],
  ['list-many', LIST_A + ' ~ many as gm4', [...ROWS, [1920, 1080]]],
  ['list-open', LIST_A + ' ~ compact, row open as gm4', [[360, 640]]],
  ['list-noted', LIST_A + ' ~ compact, noted as gm4', [[360, 640]]],
  ['list-selecting', LIST_A + ' ~ compact, selecting as gm4', SMALL],
  ['list-more', LIST_A + ' ~ more as gm4', [[360, 640]]],
  ['list-filter', LIST_A + ' ~ filter sheet as gm4', SMALL],
  ['list-narrowed', LIST_A + ' ~ narrowed as gm4', SMALL],
  ['list-nomatch', LIST_A + ' ~ no match as gm4', SMALL],
  ['list-prices', LIST_A + ' ~ price sheet as gm4', SMALL],
  ['list-longname', LIST_A + ' ~ long name as gm4', [[360, 640]]],
  ['store', '#/lists/00000000-0000-4000-8000-000000000301 ~ compact as gm3', [[360, 640]]],
  ['shared', '#/s/player-token-1', [...ROWS, [1920, 1080]]],
  ['shared-open', '#/s/player-token-1 ~ compact, row open', [[360, 640]]],
  ['shared-selecting', '#/s/player-token-1 ~ selecting', [...SMALL, [1920, 1080]]],
  ['shared-filter', '#/s/player-token-1 ~ filters open', SMALL],
  ['shared-longname', '#/s/player-token-1 ~ long name', SMALL],
  ['shared-gm', '#/s/gm-token-1 ~ compact', [[360, 640]]],
  ['shared-gone', '#/s/unknown', [[360, 640]]]
];

/** Opens inventory state `sid` in a fresh context the way case 83 does. */
async function inv(sid, width, height, lang) {
  const state = STATES.find((x) => x.id === sid);
  const got = await fresh({ width, height, storage: state?.storage });
  if (!state) {
    await got.d.open(sid);
    await got.d.settled(sid);
  } else {
    await got.d.open(state.route, {
      as: state.as,
      items: state.items,
      sections: state.sections,
      sources: state.sources,
      hold: state.hold
    });
    if (state.enter) await state.enter(got.d);
    await got.d.settled(state.id);
  }
  if (lang === 'en') {
    await got.d.click('EN');
    if (state?.again) await state.again(got.d);
  }
  await got.d.addressSettled();
  return got;
}

(async () => {
  for (const [id, sid, sizes] of PAGES) {
    for (const [width, height] of sizes) {
      for (const lang of ['ru', 'en']) {
        try {
          const got = await inv(sid, width, height, lang);
          await got.d.settle();
          await got.page.evaluate(() => document.fonts.ready);
          await got.page.screenshot({ path: path.join(OUT, `${id}__${width}__${lang}.png`) });
          await got.ctx.close();
        } catch (e) {
          console.log('skipped ' + id + ' ' + width + ' ' + lang + ': ' + e.message);
        }
      }
    }
  }
  await closeBrowser();
})();
