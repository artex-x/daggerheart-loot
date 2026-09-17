/* Captures what the built rewrite actually puts on the clipboard for a
 * record - the rewrite's own golden, last matched against the live app at
 * `cf96e6f` (R0b.4 C3, before R0c deleted `app.js`/`index.html`). It is
 * observed rather than called directly: stub `navigator.clipboard`, open a
 * record page in `dist/`, press each copy button by its accessible name
 * (`dict.ts`'s `copyName`/`copyText`, hardcoded here in both languages the
 * way `tests/app/inventory.js`'s own `NAME` dictionary is - neither file
 * imports the other), and read both flavours back.
 *
 * The records below are chosen to cover the shape of the format rather than the
 * catalogue: a plain item, a consumable (which gains a suffix outside the app),
 * equipment (whose stat line is part of the heading), an upgrade chain (which
 * travels forward only), and a record with referenced Core cards.
 *
 * Run: npm run build, then node tools/capture-share-fixture.mjs
 * Output: docs/fixtures/share/records.json
 *
 * A non-empty diff on this run is a divergence between the rewrite and the
 * last live-app capture - record it, do not regenerate to make it go away
 * (issue 47, R0c, `plan.md`'s stop-and-raise list). Before R0c the tool drove
 * the live app's own `index.html` and gripped `[data-copy-name]`/
 * `[data-copy-full]`, which `dist/` never rendered; `git show
 * a6b4a94:tools/capture-share-fixture.mjs` is that version.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = 'file://' + join(ROOT, 'dist', 'index.html');
const OUT = join(ROOT, 'docs', 'fixtures', 'share', 'records.json');

if (!existsSync(join(ROOT, 'dist', 'index.html'))) {
  console.log('no dist/index.html - run `npm run build` first');
  process.exit(1);
}

/* `dict.ts`'s own two labels, both languages - the accessible name
 * `RecordActions.svelte` gives each copy button (`aria-label`/`title`, both
 * set to the same string; `textContent` would work too but the driver's own
 * `NAME_FN` reads aria-label/title first, so this matches what it would find). */
const LABELS = {
  ru: { name: 'Скопировать название', full: 'Скопировать текст' },
  en: { name: 'Copy name', full: 'Copy text' }
};

const LOOT = JSON.parse(readFileSync(join(ROOT, 'data.json'), 'utf8'));
/* Same walk as buildIndex in app/src/lib/data.ts: source tables (including the
   non-roll campaign frames) live under `items`, alternative tables under
   `alt`, and standalone equipment in its own array. */
const byId = new Map();
const walk = (node) => {
  if (Array.isArray(node)) for (const r of node) byId.set(r.id, r);
  else if (node && typeof node === 'object') for (const v of Object.values(node)) walk(v);
};
/* `alt` nests one level deeper than `items` - by rarity rather than by table -
   so the walk is recursive rather than two loops that have to stay in step. */
walk(LOOT.items);
walk(LOOT.alt);
walk(LOOT.eq);

/** One id per shape the formatter has a branch for. */
function pickIds() {
  const all = [...byId.values()];
  const first = (fn) => all.find(fn)?.id;
  const ids = [
    first((r) => r.kind === 'item' && !r.eq && !r.craft && !r.refs),
    first((r) => r.kind === 'consumable' && !r.refs),
    first((r) => r.eq?.t === 'weapon'),
    first((r) => r.eq?.t === 'armor'),
    first((r) => r.craft),
    first((r) => r.refs?.length),
    first((r) => r.src === 'voa'),
    first((r) => r.src === 'dread'),
    /* w118 (Yeti Coat) references a beastform card whose attached block is
       5+ lines with its own stat line on its own line - a shape no other
       picked id's reference carries, so its copy format needs its own
       fixture entry rather than riding on the generic refs?.length pick
       above. issue 47, R0b.1. */
    'w118'
  ].filter(Boolean);
  return [...new Set(ids)];
}

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 900 });

await page.evaluateOnNewDocument(() => {
  /* Watch the clipboard rather than the operating system's. */
  window.isSecureContext = true;
  window.__clip = null;
  window.ClipboardItem = class {
    constructor(m) {
      this.map = m;
    }
  };
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      write: (i) => {
        window.__clip = i[0].map;
        return Promise.resolve();
      },
      writeText: (t) => {
        window.__clip = { 'text/plain': { text: () => Promise.resolve(t) } };
        return Promise.resolve();
      }
    }
  });
});

const ready = () =>
  page.waitForFunction(() => {
    const root = document.querySelector('#app');
    return !!root && root.children.length > 0;
  });

const settle = () => new Promise((r) => setTimeout(r, 150));

/* Clicks a button or link by its accessible name - the same read
 * `tests/app/driver.js`'s `NAME_FN` uses (aria-label, then title, then
 * textContent), because `dist/` renders no `data-copy-*` attribute for a
 * CSS-selector grip to find. */
async function clickByName(name) {
  return page.evaluate((label) => {
    const nameOf = (el) =>
      (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '')
        .replace(/\s+/g, ' ')
        .trim();
    const el = [...document.querySelectorAll('button, a[href]')].find((e) => nameOf(e) === label);
    if (el) el.click();
    return !!el;
  }, name);
}

async function capture(id, lang) {
  await page.goto(PAGE + '#/i/' + id, { waitUntil: 'networkidle0' });
  await ready();
  await page.evaluate((l) => {
    localStorage.setItem('dhloot.lang.v1', l);
  }, lang);
  await page.reload({ waitUntil: 'networkidle0' });
  await ready();

  const out = {};
  for (const [key, label] of [
    ['name', LABELS[lang].name],
    ['full', LABELS[lang].full]
  ]) {
    await page.evaluate(() => {
      window.__clip = null;
    });
    const found = await clickByName(label);
    if (!found) throw new Error(`no button named "${label}" on #/i/${id} (${lang})`);
    await settle();
    out[key] = await page.evaluate(async () => {
      if (!window.__clip) return null;
      const m = window.__clip;
      const read = async (k) => (m[k] ? await m[k].text() : null);
      return { html: await read('text/html'), text: await read('text/plain') };
    });
    if (!out[key]) throw new Error(`nothing copied for ${key} on #/i/${id}`);
  }
  return out;
}

const ids = pickIds();
const fixture = {};
for (const id of ids) {
  const rec = byId.get(id);
  fixture[id] = {
    why: [
      rec.kind,
      rec.eq ? 'equipment/' + rec.eq.t : null,
      rec.craft ? 'upgrades into ' + rec.craft : null,
      rec.refs?.length ? 'references ' + rec.refs.length + ' card(s)' : null,
      'src ' + rec.src
    ]
      .filter(Boolean)
      .join(', '),
    ru: await capture(id, 'ru'),
    en: await capture(id, 'en')
  };
  console.log('captured ' + id);
}

await browser.close();
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(fixture, null, 2) + '\n', 'utf8');
console.log(`${String(ids.length)} records -> docs/fixtures/share/records.json`);
