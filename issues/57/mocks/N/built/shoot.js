/* Batch N evidence, not a gate: the Head Order Rule and the die marks, RU and EN.
   node issues/57/mocks/N/built/shoot.js [file id prefix]  (after `npm run build:test`).
   Scratch: the closeout deletes it with issues/57/. */
const path = require('path');
const { fresh, closeBrowser } = require('../../../../../tests/app/lib.js');
const { STATES } = require('../../../../../tests/app/inventory.js');

const SIZES = [
  [360, 640],
  [768, 1024],
  [1000, 720],
  [1180, 720],
  [1920, 1080]
];

/* [file id, inventory state id, sizes] */
const PAGES = [
  ['roll-std', '#/roll/std', SIZES],
  ['roll-alt', '#/roll/alt', SIZES],
  ['roll-mwt', '#/roll/mwt', SIZES],
  ['tables-eq-weapon', '#/tables/eq_weapon', SIZES],
  ['tables-wondrous', '#/tables/wondrous', SIZES],
  ['homebrew', '#/homebrew as gm3', SIZES],
  ['lists', '#/lists as gm1', SIZES],
  ['search', '#/search', SIZES],
  ['roll-alt-setup', '#/roll/std ~ set up', [[360, 640]]]
];

async function inv(sid, width, height, lang) {
  const state = STATES.find((x) => x.id === sid);
  if (!state) throw new Error('no state ' + sid);
  const got = await fresh({ width, height, storage: state.storage });
  await got.d.open(state.route, { as: state.as, items: state.items, hold: state.hold });
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
  for (const [id, sid, sizes] of PAGES) {
    if (only && !id.startsWith(only)) continue;
    for (const [width, height] of sizes) {
      for (const lang of ['ru', 'en']) {
        try {
          const got = await inv(sid, width, height, lang);
          if (id === 'roll-alt-setup') {
            await got.d.go('#/roll/alt');
            await got.d.click(lang === 'ru' ? 'Настроить' : 'Set up');
          }
          await got.d.settle();
          await got.page.evaluate(async () => {
            await document.fonts.ready;
            scrollTo(0, 0);
          });
          await got.page.screenshot({
            path: path.join(__dirname, `${id}__${width}__${lang}.png`)
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
