/* Batch 7 evidence: /search, /account and the error pages at 360 and 1180 in RU and EN, and
   /search at 761. Logs the first-screen tops and the D8 probe (the English word on the
   English page). node issues/57/mocks/7/built/shoot.js  (after `npm run build:test`).
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
  const measures = [];
  const primary = (page) =>
    page.evaluate(async () => {
      await document.fonts.ready;
      scrollTo(0, 0);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const el = [...document.querySelectorAll('[data-primary]')].find(
        (e) => e.getBoundingClientRect().height > 0
      );
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    });
  for (const lang of ['ru', 'en']) {
    const w = (ru, en) => (lang === 'ru' ? ru : en);
    for (const [width, height] of SIZES) {
      const narrow = width === 360;
      const { page, d, ctx } = await fresh({ width, height, lang });
      const shot = async (id) => {
        await d.settle();
        await page.screenshot({ path: path.join(OUT, `${id}__${width}__${lang}.png`) });
      };
      const open = async (hash, as, extra = {}) => {
        await d.open(hash, { as, lang, ...extra });
        await d.settle();
      };

      await open('#/search');
      await shot('search-start');
      if (narrow) {
        await d.openMore('.headrow [aria-haspopup="menu"]');
        await shot('search-more');
        await page.keyboard.press('Escape');
      }
      await d.type(PH[lang], w('меч', 'sword'));
      await d.settle();
      measures.push({ state: 'search searched', width, lang, top: await primary(page) });
      await shot('search-searched');
      if (narrow) {
        await d.press(w('Фильтры', 'Filters'));
        await shot('search-sheet');
        await d.click(w('Снаряжение', 'Equipment'));
        await page.keyboard.press('Escape');
        await d.settle();
      } else {
        await d.click(w('Снаряжение', 'Equipment'));
      }
      measures.push({ state: 'search kind picked', width, lang, top: await primary(page) });
      await shot('search-kind');
      await d.type(PH[lang], 'zzzqqqxx123');
      await shot('search-nothing');
      await d.click(w('Сбросить фильтры', 'Reset the filters'));
      await d.type(PH[lang], w('меч', 'sword'));
      await d.click(w('Выбрать', 'Select'));
      const names = await d.tickNames();
      if (names[0]) await d.tick(names[0]);
      await shot('search-select');

      await open('#/search', 'gm1');
      await d.type(PH[lang], w('топор', 'axe'));
      await shot('search-own');

      await open('#/account', 'gm1');
      await page.waitForSelector('.acc .ids li', { timeout: 5000 });
      measures.push({ state: 'account gm1', width, lang, top: await primary(page) });
      await shot('account');
      await d.press(w('Удалить аккаунт...', 'Delete account...'));
      await d.type('', w('удалить', 'delete'));
      measures.push({
        state: 'D8 probe',
        width,
        lang,
        enabled: await page.evaluate(
          (f) =>
            [...document.querySelectorAll('button')].some(
              (b) => b.textContent.trim() === f && !b.disabled
            ),
          w('Удалить навсегда', 'Delete for good')
        )
      });
      await shot('account-delete');

      await open('#/account');
      await shot('account-signed-out');
      await open('#/l/~AAAA');
      await shot('nowhere');
      await open('#/print/ci1-q1');
      await shot('print-retired');
      await open('#/p/bad');
      await shot('print-bad');
      await open('#/p/set-expired1', 'gm2');
      await page.waitForSelector('.page-sub, .errpage', { timeout: 5000 });
      await shot('print-expired');
      await open('#/p/set-twocards', 'gm2', { hold: 'print:fail' });
      await page.waitForSelector('.errpage', { timeout: 5000 });
      await shot('print-failed');
      await ctx.close();
    }
    const { page, d, ctx } = await fresh({ width: 761, height: 768, lang });
    await d.open('#/search', { lang });
    await d.type(PH[lang], w('меч', 'sword'));
    await d.settle();
    await page.screenshot({ path: path.join(OUT, `search__761__${lang}.png`) });
    await ctx.close();
  }
  console.log(JSON.stringify(measures));
  await closeBrowser();
})().catch(async (e) => {
  console.error(e);
  await closeBrowser();
  process.exit(1);
});
