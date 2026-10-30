// First-screen measure of chosen states (task 57, round 5), same method as
// mocks/measure.mjs: the top of the primary content below the top of the
// header, at 360x640 and 1180x720, RU and EN.
//   node issues/57/mocks/3/measure.mjs <mock>/<state>/<selector> [...]
// Example: node measure.mjs 3/catalog-filtered/".rl, tbody tr"
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const req = createRequire(
  join(dirname(fileURLToPath(import.meta.url)), '../../../../package.json')
);
const puppeteer = req('puppeteer');
const base = join(dirname(fileURLToPath(import.meta.url)), '..') + '/';
const VIEWS = [
  [360, 640],
  [1180, 720]
];
const browser = await puppeteer.launch({ headless: true });
for (const spec of process.argv.slice(2)) {
  const [folder, state, sel] = spec.split('/');
  for (const [w, h] of VIEWS) {
    for (const lang of ['ru', 'en']) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: h });
      await page.goto(
        pathToFileURL(base + folder + '/state.html').href + '?s=' + state + '&lang=' + lang,
        { waitUntil: 'load' }
      );
      await page.evaluate(() => document.fonts.ready);
      const r = await page.evaluate((sel) => {
        const head = document.querySelector('header.top');
        const top0 = head ? head.getBoundingClientRect().top : 0;
        const el = [...document.querySelectorAll(sel)].find(
          (e) => e.getBoundingClientRect().height > 0
        );
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return {
          top: Math.round(b.top - top0),
          height: Math.round(b.height),
          head: head ? Math.round(head.getBoundingClientRect().height) : 0
        };
      }, sel);
      const cap = Math.round(h * 0.4);
      const top = r ? r.top : null;
      const verdict =
        top === null
          ? 'not found'
          : top <= cap
            ? 'pass'
            : top < h
              ? 'fail (in screen)'
              : 'fail (below the fold)';
      console.log(
        [
          folder + '/' + state,
          w + 'x' + h,
          lang,
          top,
          'limit ' + cap,
          'head ' + (r ? r.head : '-'),
          verdict
        ].join(' | ')
      );
      await page.close();
    }
  }
}
await browser.close();
