/* Batch 8 evidence, not a gate: the lists page, the add-to-list menu, the list not found and
   the number stepper at 360x640 and 1180x720 RU and EN, and `/lists` and `/roll/std` at
   1920x1080 (W's size list).
   node issues/57/mocks/8/built/shoot.js  (after `npm run build:test`).
   Scratch: the closeout deletes it with issues/57/. */
const path = require('path');
const { fresh, closeBrowser } = require('../../../../../tests/app/lib.js');
const { STATES } = require('../../../../../tests/app/inventory.js');

const OUT = __dirname;
const SMALL = [
  [360, 640],
  [1180, 720]
];
const WIDE = [...SMALL, [1920, 1080]];

/* Opens the record dialog over the catalog, then its add-to-list menu. */
const dialogMenu = async (d, lang) => {
  await d.press(lang === 'en' ? 'Premium Bedroll' : 'Первоклассный Спальный Мешок');
  await d.press(lang === 'en' ? 'Add to list' : 'В список');
};
/* Opens the roll settings up to 760 px. */
const settings = async (d, lang, width) => {
  if (width <= 760) await d.click(lang === 'en' ? 'Set up' : 'Настроить');
};

/* [file id, inventory state id or route, sizes, as, a step after the language] */
const PAGES = [
  ['lists', '#/lists as gm1', WIDE],
  ['lists-many', '#/lists ~ many lists as gm4', SMALL],
  ['lists-limit', '#/lists ~ list limit as gm2', SMALL],
  ['lists-empty', '#/lists ~ empty as gm4', SMALL],
  ['lists-signedout', '#/lists', SMALL],
  ['lists-new', '#/lists ~ new list as gm1', SMALL],
  ['lists-cardmenu', '#/lists ~ card menu as gm1', SMALL],
  ['lists-more', '#/lists ~ more as gm1', [[360, 640]]],
  ['lists-selected', '#/lists ~ lists selected as gm1', SMALL],
  ['lists-import', '#/lists ~ import panel as gm1', SMALL],
  ['lists-preview', '#/lists ~ import preview as gm1', SMALL],
  ['lists-error', '#/lists ~ load failed', SMALL],
  ['item-listmenu', '#/i/ci1 ~ list menu as gm1', SMALL],
  ['dialog-listmenu', '#/tables', SMALL, 'gm1', dialogMenu],
  ['lists-nope', '#/lists/00000000-0000-4000-8000-000000000101', SMALL],
  ['lists-nope-signedin', '#/lists/00000000-0000-4000-8000-000000009999 as gm1', SMALL],
  ['roll-std', '#/roll/std', WIDE, undefined, settings]
];

/** Opens inventory state `sid` (or the route `sid`) in a fresh context, as case 83 does. */
async function inv(sid, width, height, lang, as) {
  const state = STATES.find((x) => x.id === sid);
  const got = await fresh({ width, height, storage: state?.storage });
  if (!state) {
    await got.d.open(sid, { as });
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
  for (const [id, sid, sizes, as, after] of PAGES) {
    for (const [width, height] of sizes) {
      for (const lang of ['ru', 'en']) {
        try {
          const got = await inv(sid, width, height, lang, as);
          if (after) await after(got.d, lang, width);
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
