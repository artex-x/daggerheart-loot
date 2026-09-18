/* The built page has to open from a folder.
 *
 * Not decoration: `file://` is written down in docs/specs/META.md section 4, and
 * it is what dictates the relative `base` and one classic bundle instead of
 * modules. The check is cheap and the failure is silent - Chrome simply refuses
 * to load the module, while on Pages everything still looks fine.
 *
 * It also confirms the data arrived: a `fetch` for a local json is blocked, so
 * the dataset comes as a script that puts itself into window.LOOT.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';

const DIST = join(import.meta.dirname, '..', 'dist');
const INDEX = join(DIST, 'index.html');

let fail = 0;
const ok = (c, m) => {
  if (!c) {
    fail++;
    console.log('  FAIL ' + m);
  }
};

if (!existsSync(INDEX)) {
  console.log('  FAIL no dist/index.html - run `npm run build` first');
  process.exit(1);
}

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
page.on('requestfailed', (r) => errors.push('failed to load: ' + r.url()));

await page.goto(pathToFileURL(INDEX).href, { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 400));

ok(!errors.length, 'the page complains when opened from a folder: ' + errors.join('; '));

const seen = await page.evaluate(() => ({
  mounted: !!document.querySelector('#app')?.childElementCount,
  data: typeof window.LOOT === 'object' && window.LOOT !== null,
  /* An absolute base would break exactly this: paths would start at the drive root */
  scripts: [...document.querySelectorAll('script[src]')].map((s) => s.getAttribute('src')),
  modules: [...document.querySelectorAll('script[type="module"]')].length,
  defers: [...document.querySelectorAll('script[src]')].map((s) => s.hasAttribute('defer'))
}));

ok(seen.mounted, 'the app did not render from a folder');
ok(seen.data, 'the data did not arrive: window.LOOT is empty');
ok(
  seen.modules === 0,
  'a script type="module" survived into the build - it will not load from a folder'
);
ok(
  seen.scripts.every((s) => s.startsWith('./') || s.startsWith('../')),
  'a script path is not relative: ' + seen.scripts.join(', ')
);
/* Without type="module" a plain script blocks the parser and runs in source
   order regardless - defer is what keeps data.js and app.js off the
   critical path and still guarantees that order, the same contract a
   module script carries for free. */
ok(
  seen.defers.length === 2 && seen.defers.every(Boolean),
  'a built script tag lost its defer: ' + JSON.stringify(seen.defers)
);

/* The <noscript> block's own links: with scripting on, the browser never
   parses its content into real DOM, so it is read back as text and parsed
   by hand. Each href has to resolve to a file dist/ actually
   holds - Vite's build does not copy catalog.csv, data.json or llms.txt on
   its own, so this failed before vite.config.mts's closeBundle copy landed. */
const noscriptHrefs = await page.evaluate(() =>
  [...document.querySelectorAll('noscript')].flatMap((n) => {
    const div = document.createElement('div');
    div.innerHTML = n.textContent ?? '';
    return [...div.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
  })
);
ok(noscriptHrefs.length > 0, 'no noscript link found to check at all');
for (const href of noscriptHrefs) {
  ok(existsSync(join(DIST, href)), 'noscript link resolves to nothing under dist/: ' + href);
}

await browser.close();
console.log(fail ? '\n' + fail + ' FAILED' : 'the built page opens from a folder');
process.exit(fail ? 1 : 0);
