/* Batch 4 evidence: the record page, its menu, the dialog and the error pages at 360 and
   1180 in RU and EN. node issues/57/mocks/4/built/shoot.js  (after `npm run build:test`).
   Scratch: the closeout deletes it with issues/57/. */
const path = require('path');
const { fresh, closeBrowser } = require('../../../../../tests/app/lib.js');

const OUT = __dirname;
const HB_AXE = 'hb_emberaxeaaaaaaaa';
const H_ITEM = '#/h/00000000-0000-4000-8000-000000000513';
const SIZES = [
  [360, 640],
  [1180, 720]
];

(async () => {
  const measures = [];
  for (const lang of ['ru', 'en']) {
    const more = lang === 'ru' ? 'Ещё' : 'More';
    for (const [width, height] of SIZES) {
      const { page, d, ctx } = await fresh({ width, height, lang });
      const shot = async (id) => {
        await d.settle();
        await page.screenshot({ path: path.join(OUT, `${id}__${width}__${lang}.png`) });
      };
      const openRow = async () => {
        await d.open('#/tables/eq_weapon', { lang });
        await d.click(lang === 'ru' ? 'Палаш' : 'Broadsword');
        await page.waitForSelector('dialog[open] .modal-card', { timeout: 5000 });
      };

      await d.open('#/i/ci1', { lang });
      await shot('item');
      await d.press(more);
      await shot('item-more');

      await d.open('#/i/ci1', { lang, as: 'gm1' });
      await d.press(more);
      await shot('item-more-signed-in');

      await d.open(`#/i/${HB_AXE}`, { lang, as: 'gm1' });
      await shot('own-item');

      await d.open(H_ITEM, { lang, as: 'gm1' });
      await shot('h-item');

      await d.open(H_ITEM, { lang, as: 'gm2' });
      await d.press(more);
      await shot('h-item-more');

      await openRow();
      await shot('dialog');
      await page.click('dialog[open] .morewrap .btn');
      await shot('dialog-more');
      const backdrop = await page.evaluate(() => {
        const r = document.querySelector('dialog[open]').getBoundingClientRect();
        return { w: r.width, h: r.height, iw: innerWidth, ih: innerHeight };
      });
      measures.push({ state: 'backdrop', width, lang, ...backdrop });

      await d.open('/#/i/nope', { lang });
      await shot('item-nope');

      await d.open(H_ITEM, { lang, hold: 'item:fail' });
      await shot('h-failed');

      await ctx.close();
    }
  }
  console.log(JSON.stringify(measures));
  await closeBrowser();
})().catch(async (e) => {
  console.error(e);
  await closeBrowser();
  process.exit(1);
});
