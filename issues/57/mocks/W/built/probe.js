/* Batch W evidence, not a gate: the counter's width against its block. node issues/57/mocks/W/built/probe.js */
const { fresh, closeBrowser } = require('../../../../../tests/app/lib.js');

(async () => {
  for (const hash of ['#/roll/std', '#/roll/alt']) {
    for (const w of [360, 450, 530, 600, 700, 760, 761, 900, 1180]) {
      const { page, d, ctx } = await fresh({ width: w, height: 800, lang: 'ru' });
      await d.open(hash, { as: 'gm3', lang: 'ru' });
      await d.settled(hash);
      await d.settle();
      if (w < 761) {
        try {
          await d.click('Настроить');
        } catch (e) {}
        await d.settle();
      }
      const r = await page.evaluate(() =>
        [...document.querySelectorAll('.numbox')].map((n) => {
          const p = n.parentElement.getBoundingClientRect();
          return [Math.round(n.getBoundingClientRect().width), Math.round(p.width)];
        })
      );
      console.log(hash, w, JSON.stringify(r));
      await ctx.close();
    }
  }
  await closeBrowser();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
