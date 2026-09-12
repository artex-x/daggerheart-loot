/* Is the thing that is actually published the thing we meant to publish?
 *
 * Every other gate reads the repository or a local build. Nothing has ever read
 * the live URL, so the one failure mode the cut-over introduces - a deploy that
 * is green and wrong - would be found by a person opening the site, if anyone
 * happened to. This runs as the deploy job's last step against
 * `steps.pages.outputs.page_url`, and by hand against the same URL:
 *
 *     node tools/check-site.mjs https://artex-x.github.io/daggerheart-loot/
 *
 * It cannot un-publish anything and is not meant to: it is what tells a person
 * that the revert described in .github/workflows/ci.yml is needed, in the place
 * they already look. Issue 47, B13.
 *
 * Plain Node, global fetch, no dependency - it has to run in a job that has not
 * necessarily installed anything.
 */

const base = process.argv[2];
if (!base) {
  console.log('  FAIL no base url - usage: node tools/check-site.mjs <url>');
  process.exit(1);
}
const ROOT = base.endsWith('/') ? base : base + '/';

/* A fresh deploy is not served instantly, and the CDN can hand back the
   previous page for a few seconds after the API says the deployment is done.
   So the whole assertion set is retried rather than any single request: a
   half-old, half-new read is exactly the state worth waiting out. */
const TRIES = 6;
const WAIT_MS = 10_000;

async function get(pathname) {
  const url = ROOT + pathname;
  const res = await fetch(url, { cache: 'no-store', redirect: 'follow' });
  const body = res.ok ? await res.text() : '';
  return { url, status: res.status, type: res.headers.get('content-type') || '', body };
}

async function run() {
  const bad = [];
  const ok = (c, m) => {
    if (!c) bad.push(m);
  };

  const index = await get('');
  ok(index.status === 200, 'корень отдал ' + index.status + ', а не 200');
  ok(/html/i.test(index.type), 'корень отдан как ' + index.type + ', а не html');
  ok(/<meta\s+name="robots"\s+content="noindex/i.test(index.body),
     'на опубликованной странице нет noindex - META.md раздел 1');
  ok(index.body.includes('assets/app.js'), 'опубликованная страница не ссылается на assets/app.js');
  ok(/<div\s+id="app"/.test(index.body), 'на опубликованной странице нет <div id="app">');
  /* The assertion that the flip actually took: the old app's entry script must
     be gone, not merely joined by the new one. */
  ok(!/src="\.?\/?app\.js"/.test(index.body), 'опубликована смесь двух приложений: остался src="app.js"');

  const bundle = await get('assets/app.js');
  ok(bundle.status === 200, 'assets/app.js отдал ' + bundle.status);
  ok(bundle.body.length > 20000,
     'assets/app.js всего ' + bundle.body.length + ' байт - это не сборка');

  const data = await get('data.js');
  ok(data.status === 200, 'data.js отдал ' + data.status);
  ok(data.body.startsWith('window.LOOT'), 'data.js больше не присваивает window.LOOT');

  for (const f of ['data.json', 'catalog.csv', 'llms.txt', 'robots.txt']) {
    const r = await get(f);
    ok(r.status === 200, f + ' отдал ' + r.status);
  }

  /* The stubs are what a messenger fetches for a link preview. */
  const stub = await get('i/w1.html');
  ok(stub.status === 200, 'i/w1.html отдал ' + stub.status);
  ok(stub.body.includes('og:image'), 'у заглушки i/w1.html пропала картинка превью');

  /* One probe per symlinked folder: img/, og/ and card/ are links the build
     makes, and a broken link is served as a 404 rather than as an error. */
  for (const f of ['img/_none.webp', 'og/_share.jpg', 'card/die-d12-bw.svg']) {
    const r = await get(f);
    ok(r.status === 200, f + ' отдал ' + r.status);
  }

  return bad;
}

let bad = [];
for (let i = 1; i <= TRIES; i++) {
  try {
    bad = await run();
  } catch (e) {
    bad = ['запрос не прошёл: ' + String(e && e.message ? e.message : e)];
  }
  if (!bad.length) break;
  if (i < TRIES) {
    console.log('попытка ' + i + ' из ' + TRIES + ': ' + bad.length + ' не сошлось, жду');
    await new Promise((r) => setTimeout(r, WAIT_MS));
  }
}

bad.forEach((m) => console.log('  FAIL ' + m));
console.log(bad.length ? '\n' + bad.length + ' FAILED: ' + ROOT : 'сайт опубликован верно: ' + ROOT);
process.exit(bad.length ? 1 : 0);
