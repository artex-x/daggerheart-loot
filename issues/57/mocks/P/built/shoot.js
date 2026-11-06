/* Batch P evidence, not a gate: the print page head, the dock, one card per row, RU and EN.
   node issues/57/mocks/P/built/shoot.js [file id prefix]  (after `npm run build:test`).
   Scratch: the closeout deletes it with issues/57/. */
const path = require('path');
const { fresh, closeBrowser } = require('../../../../../tests/app/lib.js');
const { STATES } = require('../../../../../tests/app/inventory.js');

const SIZES = [
  [360, 640],
  [390, 844],
  [768, 1024],
  [1180, 720]
];

/* [file id, inventory state id, sizes] */
const PAGES = [
  ['p-emberaxe', '#/p/set-emberaxe as gm2', SIZES],
  ['p-tencards', '#/p/set-tencards as gm2', SIZES],
  ['p-more', '#/p/set-emberaxe ~ phone more as gm2', [[360, 640]]]
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
          await got.d.settle();
          await got.page.evaluate(async () => {
            await document.fonts.ready;
            if (!document.getElementById('print-more')) scrollTo(0, 0);
          });
          await got.page.screenshot({
            path: path.join(__dirname, `${id}__${width}__${lang}.png`)
          });
          if (id === 'p-tencards') {
            await got.page.evaluate(() =>
              document.querySelector('.psheet-n')?.scrollIntoView({ block: 'center' })
            );
            await got.page.screenshot({
              path: path.join(__dirname, `${id}-sheet2__${width}__${lang}.png`)
            });
          }
          await got.ctx.close();
        } catch (e) {
          console.log('skipped ' + id + ' ' + width + ' ' + lang + ': ' + e.message);
        }
      }
    }
  }
  await closeBrowser();
})();
