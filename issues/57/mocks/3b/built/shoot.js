/* Batch 3b evidence: the header at 360 and 1180 in RU and EN, shown and hidden.
   node issues/57/mocks/3b/built/shoot.js  (after `npm run build:test`). Scratch: the
   closeout deletes it with issues/57/. */
const path = require('path');
const { fresh, closeBrowser } = require('../../../../../tests/app/lib.js');

const OUT = __dirname;

(async () => {
  const measures = [];
  for (const lang of ['ru', 'en']) {
    const shot = async (page, id, width) => {
      const edges = await page.evaluate(() => {
        const r = document.querySelector('.topbar').getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, y: scrollY };
      });
      measures.push({ state: id, width, lang, ...edges });
      await page.screenshot({ path: path.join(OUT, `${id}__${width}__${lang}.png`) });
    };
    const narrow = await fresh({ width: 360, height: 640, lang });
    await narrow.d.open('#/tables/eq_weapon', { lang });
    await shot(narrow.page, 'header-top', 360);
    await narrow.d.scrollPage(800);
    await shot(narrow.page, 'header-hidden', 360);
    await narrow.page.evaluate(() => {
      window.scrollBy(0, -20);
    });
    await narrow.d.settle();
    await shot(narrow.page, 'header-back', 360);
    await narrow.d.scrollPage(900);
    await narrow.page.focus('.topbar .seg button');
    await narrow.d.settle();
    await shot(narrow.page, 'header-focused', 360);
    await narrow.ctx.close();

    const wide = await fresh({ width: 1180, height: 720, lang });
    await wide.d.open('#/tables/eq_weapon', { lang });
    await wide.d.scrollPage(800);
    await shot(wide.page, 'header-sticky', 1180);
    await wide.ctx.close();
  }
  console.log(JSON.stringify(measures));
  await closeBrowser();
})().catch(async (e) => {
  console.error(e);
  await closeBrowser();
  process.exit(1);
});
