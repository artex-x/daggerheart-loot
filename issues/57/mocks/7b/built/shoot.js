/* Batch 7b evidence, not a gate: the full card's relation line, a roll result, the dialog over a
   search row, the grid tile pills (also in the selection mode), a mixed table, the account's
   «Сейчас» badge and the table head on three tables, at 360 and 1180 in RU and EN.
   node issues/57/mocks/7b/built/shoot.js  (after `npm run build:test`).
   Scratch: the closeout deletes it with issues/57/. */
const path = require('path');
const { fresh, closeBrowser } = require('../../../../../tests/app/lib.js');

const OUT = __dirname;
const SIZES = [
  [360, 640],
  [1180, 720]
];
const PH = { ru: 'Поиск по названию или описанию...', en: 'Search by name or description...' };

(async () => {
  for (const lang of ['ru', 'en']) {
    const w = (ru, en) => (lang === 'ru' ? ru : en);
    for (const [width, height] of SIZES) {
      const { page, d, ctx } = await fresh({ width, height, lang });
      const shot = async (id, full = false) => {
        await d.settle();
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({
          path: path.join(OUT, `${id}__${width}__${lang}.png`),
          fullPage: full
        });
      };
      const open = async (hash, as) => {
        await d.open(hash, { as, lang });
        if (as) await d.settled(hash);
        await d.settle();
      };

      await open('#/i/ci1', 'gm3');
      await page.evaluate(() =>
        document.querySelector('.craft')?.scrollIntoView({ block: 'center' })
      );
      await shot('ci1-relations');

      await open('#/roll/std', 'gm3');
      await shot('roll-std');

      await open('#/search', 'gm3');
      await d.type(PH[lang], 'спальный мешок');
      await d.click(w('Первоклассный', 'Premium Bedroll'));
      await shot('search-dialog');

      await open('#/tables/voa');
      await d.click(w('Сетка', 'Grid'));
      await shot('voa-grid');
      await d.click(w('Выбрать', 'Select'));
      await shot('voa-grid-select');

      await open('#/tables/alt_item');
      await shot('alt-item');

      await open('#/account', 'gm1');
      await shot('account');

      if (width === 1180) {
        for (const t of ['core_item', 'wondrous', 'homebrew']) {
          await open('#/tables/' + t, 'gm3');
          await page.screenshot({
            path: path.join(OUT, `head-${t}__${width}__${lang}.png`),
            clip: { x: 0, y: 0, width, height: 340 }
          });
        }
      }
      await ctx.close();
    }
  }
  await closeBrowser();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
