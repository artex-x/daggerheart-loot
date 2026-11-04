/* Batch 5 evidence: the roll pages at 360 and 1180 in RU and EN, and /roll/alt at 761.
   node issues/57/mocks/5/built/shoot.js  (after `npm run build:test`).
   Scratch: the closeout deletes it with issues/57/. */
const path = require('path');
const { fresh, closeBrowser } = require('../../../../../tests/app/lib.js');

const OUT = __dirname;
const SIZES = [
  [360, 640],
  [1180, 720]
];
const PAGES = [
  ['alt', '#/roll/alt'],
  ['voa', '#/roll/vault_of_ages'],
  ['wondrous', '#/roll/wondrous_environments'],
  ['mwt', '#/roll/many_worlds_tavern']
];

(async () => {
  const measures = [];
  const primary = (page) =>
    page.evaluate(() =>
      Math.round(document.querySelector('[data-primary]').getBoundingClientRect().top)
    );
  for (const lang of ['ru', 'en']) {
    const w = (ru, en) => (lang === 'ru' ? ru : en);
    for (const [width, height] of SIZES) {
      const { page, d, ctx } = await fresh({ width, height, lang });
      const shot = async (id) => {
        await d.settle();
        await page.screenshot({ path: path.join(OUT, `${id}__${width}__${lang}.png`) });
      };

      await d.open('#/roll/std', { lang });
      measures.push({ state: 'std', width, lang, top: await primary(page) });
      await shot('std');
      if (width === 360) {
        await d.press(w('Настроить', 'Set up'));
        await shot('std-setup');
        await d.press(w('Расходники', 'Consumables'));
        await shot('std-items-only-open');
        await d.press(w('Предметы', 'Items'));
        await shot('std-items-only');
        await d.open('#/roll/std', { lang });
        await page.click('.reshead .morewrap .btn');
        await shot('std-more');
      } else {
        await d.press(w('Расходники', 'Consumables'));
        await shot('std-items-only');
        await d.press(w('Расходники', 'Consumables'));
      }
      await d.open('#/roll/std', { lang });
      await page.click('.resacts .morewrap .btn');
      await page.evaluate(() => document.querySelector('.resacts').scrollIntoView());
      await shot('std-card-more');

      for (const [id, hash] of PAGES) {
        await d.open(hash, { lang });
        measures.push({ state: id, width, lang, top: await primary(page) });
        await shot(id);
      }

      await d.open('#/roll/alt', { lang });
      if (width === 360) await d.press(w('Настроить', 'Set up'));
      await d.press(w('Кость Страха: На единицу меньше', 'Fear Die: One lower'));
      if (width === 360) await d.press(w('Настроить', 'Set up'));
      await shot('alt-crit');
      await ctx.close();
    }
    const { page, d, ctx } = await fresh({ width: 761, height: 768, lang });
    await d.open('#/roll/alt', { lang });
    await d.settle();
    await page.screenshot({ path: path.join(OUT, `alt__761__${lang}.png`) });
    await ctx.close();
  }
  console.log(JSON.stringify(measures));
  await closeBrowser();
})().catch(async (e) => {
  console.error(e);
  await closeBrowser();
  process.exit(1);
});
