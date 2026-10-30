/* Print audit, task 57: real print output (Chrome PDF, print media) of two sample sets,
   both sheets, both layouts, RU and EN, against dist-test/. PDFs go to argv[2]. */
const W = 'E:/dev/daggerheart-loot/.claude/worktrees/57';
const path = require('path');
const { fresh, closeBrowser } = require(W + '/tests/app/lib.js');
const OUT = process.argv[2];
const NOPIC = { h: '00000000-0000-4000-8000-000000000461' };
const LONGHB = { h: '00000000-0000-4000-8000-000000000516' };
const k = (...ids) => ids.map((x) => ({ k: x }));
const NINE = [...k('ci1', 'cc7', 'voa2_a3', 'q1', 'w7', 'f23', 'f33', 'voa4_t2b'), NOPIC];
const SIXTEEN = [...NINE, ...k('cm26', 'voa4_a3', 'q313', 'cc1', 'di11', 'voa2_a1'), LONGHB];
const NAMES = {
  ru: { color: 'Цветная', bw: 'Чёрно-белая', std: 'Обычная', compact: 'Компактная' },
  en: { color: 'Colour', bw: 'Black and white', std: 'Standard', compact: 'Compact' }
};

(async () => {
  for (const lang of ['ru', 'en']) {
    const { ctx, page, d } = await fresh({ width: 1180, height: 950, lang });
    const N = NAMES[lang];
    for (const compact of [false, true]) {
      await d.open('#/p/', { as: 'gm4', lang });
      const made = await d.fake('prints.create', compact ? SIXTEEN : NINE);
      if (!made || !made.ok) throw new Error('refused ' + JSON.stringify(made));
      await d.go('#/p/' + made.id);
      for (let i = 0; i < 400; i++) {
        if ((await d.count('.pcard')) > 0) break;
        await new Promise((r) => setTimeout(r, 50));
      }
      if (process.env.FONT) {
        await require('./font-inject.cjs')(page);
        await d.click(N.bw);
        await d.click(N.color);
      }
      for (const bw of [false, true]) {
        await d.click(bw ? N.bw : N.color);
        await d.click(compact ? N.compact : N.std);
        /* Let every picture load before the PDF. */
        await page.evaluate(() =>
          Promise.all(
            [...document.images].map((im) =>
              im.complete ? 0 : new Promise((r) => ((im.onload = r), (im.onerror = r)))
            )
          )
        );
        await new Promise((r) => setTimeout(r, 500));
        const name =
          (process.env.FONT ? 'trial-ssp-' : '') +
          `print-${compact ? 'compact16' : 'std9'}-${bw ? 'bw' : 'colour'}-${lang}.pdf`;
        await page.pdf({
          path: path.join(OUT, name),
          printBackground: true,
          preferCSSPageSize: true,
          pageRanges: '1'
        });
        console.log('wrote', name);
      }
    }
    await ctx.close();
  }
  await closeBrowser();
})().catch(async (e) => {
  console.error(e);
  await closeBrowser();
  process.exit(1);
});
