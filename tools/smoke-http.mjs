/* The built page opens over HTTP.
 *
 * `dist/` is served by the same static server the browser suites use
 * (tests/app/serve.js), on a free port of 127.0.0.1. The entry is an ES module
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

let fail = 0;
const ok = (c, m) => {
  if (!c) {
    fail++;
    console.log('  FAIL ' + m);
  }
};

/* CommonJS, shared with tests/app/, which drive dist-test/ through it; this
   file keeps driving dist/, what is published. It refuses a missing or
   stale build. */
const { assertBuilt, serveDist } = createRequire(import.meta.url)('../tests/app/serve.js');
assertBuilt(DIST, 'dist/');
const server = await serveDist(DIST);
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

await page.goto(root + 'roll/std', { waitUntil: 'load' });
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
    /* Root-absolute: the app runs at every route path (docs/specs/META.md section 4). */
    srcs: scripts.map((s) => s.getAttribute('src')),
    modules: scripts.filter((s) => s.type === 'module').map((s) => s.getAttribute('src')),
    dataModule: scripts.some((s) => s.getAttribute('src') === '/data.js' && s.type === 'module')
  };
});

ok(seen.mounted, 'the app did not render over HTTP');
ok(seen.data, 'the data did not arrive: window.LOOT is empty');
ok(
  seen.modules.length === 1 && /^\/assets\/index-[\w-]+\.js$/.test(seen.modules[0] ?? ''),
  'the entry is not one hashed module under assets/: ' + JSON.stringify(seen.modules)
);
ok(!seen.dataModule, 'data.js became a module - it must stay a classic script');
ok(
  seen.srcs.every((s) => s.startsWith('/') && !s.startsWith('//')),
  'a script path is not root-absolute: ' + seen.srcs.join(', ')
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

/* A deep path: the host answers it with the app document, every URL resolves from
   the root, and the worker registered from `/sw.js` controls it with the scope `/`. */
await page.goto(root + 'i/ci1', { waitUntil: 'load' });
await page.waitForFunction(() => !!document.querySelector('#app h1'));
const deep = await page.evaluate(async () => ({
  path: location.pathname,
  scope: (await navigator.serviceWorker.getRegistration())?.scope ?? '',
  controlled: navigator.serviceWorker.controller !== null,
  data: typeof window.LOOT === 'object' && window.LOOT !== null
}));
ok(deep.path === '/i/ci1', 'the record path moved to ' + deep.path);
ok(deep.scope === root, 'the worker scope is not the root: ' + deep.scope);
ok(deep.controlled, 'the worker does not control a deep path');
ok(deep.data, 'the data did not arrive on a deep path');

/* A record path is the app document with the record's card in its head, in the
   language of the path (docs/specs/CONTRACTS.md section 5). */
const share = createRequire(import.meta.url)('./build-share-pages.js');
const ci1 = share.records().find((it) => it.id === 'ci1');
for (const [path, lang] of [
  ['i/ci1', 'ru'],
  ['i/en/ci1', 'en']
]) {
  const text = await (await fetch(root + path)).text();
  const name = lang === 'ru' ? ci1.ru : ci1.en;
  ok(
    text.includes('<meta property="og:title" content="' + name + '">'),
    path + ' does not carry the og:title ' + name
  );
  ok(text.includes('\n' + share.headOf(ci1, lang) + '\n'), path + ' does not carry its card');
  ok(
    text.includes(share.bodyOf(ci1, lang)),
    path + ' does not carry the record text in <noscript>'
  );
  ok(text.includes('<html lang="' + lang + '">'), path + ' is not <html lang="' + lang + '">');
}

/* A build with no sign-in configured - what `npm run build` makes unless the
   two VITE_SUPABASE_* values are in its environment - draws no account
   control, and `/account` is the not-found page at the same address
   (docs/specs/FEATURES.md, "Account"). */
if (!process.env.VITE_SUPABASE_URL) {
  const control = await page.evaluate(
    () => !!document.querySelector('header a[href="/account"]')
  );
  ok(!control, 'an unconfigured build draws the account control');
  await page.goto(root + 'account', { waitUntil: 'load' });
  await page.waitForFunction(() => !!document.querySelector('#app h1'));
  const account = await page.evaluate(() => ({
    heading: document.querySelector('#app h1')?.textContent ?? '',
    path: location.pathname,
    control: !!document.querySelector('header a[href="/account"]')
  }));
  ok(
    account.heading === 'Предмет не найден',
    'an unconfigured /account does not draw the not-found page: ' + account.heading
  );
  ok(account.path === '/account', 'an unconfigured /account moved to ' + account.path);
  ok(!account.control, 'an unconfigured /account draws the account control');
}
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
