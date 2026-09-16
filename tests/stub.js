/* The standalone share stub `i/w3.html` - its own stylesheet, no app around
 * it, so it is neither `dist/` (`tests/app/sweep.js`'s own header says it
 * walks `dist/`) nor the live app. `tests/app/lib.js` is reused only for its
 * browser/context plumbing - `fresh()`'s own driver is pointed at `dist/`
 * and goes unused here, since nothing in this file opens a route through it.
 * `craftmob.js:101-110`. */
const path = require('path');
const { fresh, reporter, closeBrowser } = require('./app/lib.js');

const rep = reporter();
const { ok } = rep;

const STUB = 'file://' + path.join(__dirname, '..', 'i', 'w3.html');

(async () => {
  for (const width of [320, 390]) {
    const { ctx, page } = await fresh({ width, height: 800 });
    await page.goto(STUB, { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 80));
    const over = await page.evaluate(
      (w) => document.documentElement.scrollWidth > w + 1,
      width
    );
    ok(!over, 'заглушка i/w3.html прокручивается вбок на ' + width + 'px');
    await ctx.close();
  }

  await closeBrowser();
  console.log(
    rep.failed ? '\n' + rep.failed + ' FAILED' : '\nстраницы-заглушки i/: не прокручиваются вбок'
  );
  process.exit(rep.failed ? 1 : 0);
})();
