/* The built page opens over HTTP.
 *
 * `dist/` is served by the same static server the browser suites use
 * (tests/app/lib.js), on a free port of 127.0.0.1. The entry is an ES module
 * with a hashed name; `data.js` stays a classic script that puts the dataset
 * into window.LOOT before the module runs (docs/specs/CONTRACTS.md section 4).
 * The service worker registers and controls the page after one reload
 * (docs/specs/META.md section 9).
 */
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
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

/* CommonJS, shared with tests/app/: it also refuses a stale dist/. */
const { serveDist } = createRequire(import.meta.url)('../tests/app/lib.js');
const server = await serveDist();
const root = 'http://127.0.0.1:' + String(server.address().port) + '/';

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
page.on('requestfailed', (r) => errors.push('failed to load: ' + r.url()));
/* A console error catches what raises no request event: a refused manifest
   or a refused worker registration. */
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console error: ' + m.text());
});

await page.goto(root + 'index.html#/roll/std', { waitUntil: 'load' });
const ready = await page.evaluate(() =>
  Promise.race([
    navigator.serviceWorker.ready.then(() => true),
    new Promise((r) => setTimeout(() => r(false), 10_000))
  ])
);
ok(ready, 'the service worker never became ready');

const seen = await page.evaluate(() => {
  const scripts = [...document.querySelectorAll('script[src]')];
  return {
    mounted: !!document.querySelector('#app')?.childElementCount,
    data: typeof window.LOOT === 'object' && window.LOOT !== null,
    /* An absolute base would break exactly this: paths would start at the server root */
    srcs: scripts.map((s) => s.getAttribute('src')),
    modules: scripts.filter((s) => s.type === 'module').map((s) => s.getAttribute('src')),
    dataModule: scripts.some(
      (s) => s.getAttribute('src') === './data.js' && s.type === 'module'
    )
  };
});

ok(seen.mounted, 'the app did not render over HTTP');
ok(seen.data, 'the data did not arrive: window.LOOT is empty');
ok(
  seen.modules.length === 1 && /^\.\/assets\/index-[\w-]+\.js$/.test(seen.modules[0] ?? ''),
  'the entry is not one hashed module under assets/: ' + JSON.stringify(seen.modules)
);
ok(!seen.dataModule, 'data.js became a module - it must stay a classic script');
ok(
  seen.srcs.every((s) => s.startsWith('./')),
  'a script path is not relative: ' + seen.srcs.join(', ')
);

await page.reload({ waitUntil: 'load' });
const after = await page.evaluate(async () => ({
  registrations: (await navigator.serviceWorker.getRegistrations()).length,
  controlled: navigator.serviceWorker.controller !== null,
  mounted: !!document.querySelector('#app')?.childElementCount
}));
ok(after.registrations === 1, 'not one worker registration: ' + String(after.registrations));
ok(after.controlled, 'the worker does not control the page after one reload');
ok(after.mounted, 'the app did not render on the controlled reload');
ok(!errors.length, 'the page complains over HTTP: ' + errors.join('; '));

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
server.closeAllConnections();
await new Promise((resolve) => server.close(resolve));
console.log(fail ? '\n' + fail + ' FAILED' : 'the built page opens over HTTP');
process.exit(fail ? 1 : 0);
