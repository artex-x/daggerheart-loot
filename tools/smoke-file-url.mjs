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
  modules: [...document.querySelectorAll('script[type="module"]')].length
}));

ok(seen.mounted, 'the app did not render from a folder');
ok(seen.data, 'the data did not arrive: window.LOOT is empty');
ok(seen.modules === 0, 'a script type="module" survived into the build - it will not load from a folder');
ok(
  seen.scripts.every((s) => s.startsWith('./') || s.startsWith('../')),
  'a script path is not relative: ' + seen.scripts.join(', ')
);

await browser.close();
console.log(fail ? '\n' + fail + ' FAILED' : 'the built page opens from a folder');
process.exit(fail ? 1 : 0);
