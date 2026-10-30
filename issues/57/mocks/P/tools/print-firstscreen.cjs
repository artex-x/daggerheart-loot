/* The print preview page against the First-Screen Rule today: the top of the first sheet
   at 360x640 and 1180x720, RU and EN, standard and compact. Screenshots to argv[2]. */
const W = 'E:/dev/daggerheart-loot/.claude/worktrees/57';
const path = require('path');
const { fresh, closeBrowser, openPrint } = require(W + '/tests/app/lib.js');
(async () => {
  for (const lang of ['ru', 'en']) {
    for (const [w, h] of [
      [360, 640],
      [1180, 720]
    ]) {
      const { ctx, page, d } = await fresh({ width: w, height: h, lang });
      await openPrint(d, 'ci1-q1-q313-cc1-voa2_a3-q23-w51-q35-di11');
      await page.evaluate(() => window.scrollTo(0, 0));
      const m = await page.evaluate(() => {
        const s = document.querySelector('.psheet, .pcard');
        const bar = document.querySelector('.printbar');
        return {
          sheetTop: Math.round(s.getBoundingClientRect().top),
          barH: bar ? Math.round(bar.getBoundingClientRect().height) : null,
          limit: Math.round(innerHeight * 0.4),
          cardW: Math.round(document.querySelector('.pcard').getBoundingClientRect().width)
        };
      });
      console.log(lang, w + 'x' + h, JSON.stringify(m));
      await page.screenshot({
        path: path.join(process.argv[2], `p-page-${w}x${h}-${lang}.png`)
      });
      await ctx.close();
    }
  }
  await closeBrowser();
})().catch(async (e) => {
  console.error(e);
  await closeBrowser();
  process.exit(1);
});
