/* The standalone generated pages - a share stub in each language, the English
 * entry document and a site page in each language. Each has its own
 * stylesheet and no app around it, so it is neither `dist/`
 * (`tests/app/sweep.js`'s own header says it walks `dist/`) nor the live app.
 * `tests/app/lib.js` is reused only for its browser/context plumbing -
 * `fresh()`'s own driver is pointed at `dist/` and goes unused here, since
 * nothing in this file opens a route through it.
 * Ported from `craftmob.js` (deleted at R0c, `23c00a6`). */
const path = require('path');
const { pathToFileURL } = require('url');
const { fresh, reporter, closeBrowser } = require('./app/lib.js');

const rep = reporter();
const { ok } = rep;

const FILES = [
  'i/w3.html',
  'i/en/w3.html',
  'en/index.html',
  'pages/install.html',
  'pages/en/install.html'
];

(async () => {
  for (const file of FILES) {
    const url = pathToFileURL(path.join(__dirname, '..', file)).href;
    for (const width of [320, 390]) {
      const { ctx, page } = await fresh({ width, height: 800 });
      /* A redirect page leaves for the app (a script, or a meta refresh)
         before the layout is measured, and the layout is what this checks:
         every navigation but the page's own is cancelled. */
      await page.setRequestInterception(true);
      page.on('request', (r) => {
        if (r.isNavigationRequest() && r.url() !== url) r.abort('aborted');
        else r.continue();
      });
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await new Promise((r) => setTimeout(r, 80));
      const over = await page.evaluate(
        (w) => document.documentElement.scrollWidth > w + 1,
        width
      );
      ok(!over, file + ' scrolls sideways at ' + width + 'px');
      await ctx.close();
    }
  }

  await closeBrowser();
  console.log(
    rep.failed ? '\n' + rep.failed + ' FAILED' : '\ngenerated pages: no sideways scroll'
  );
  process.exit(rep.failed ? 1 : 0);
})();
