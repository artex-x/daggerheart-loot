/* Captures what the live app actually puts on the clipboard for a record.
 *
 * app.js is a closed IIFE, so its share formatter cannot be called directly.
 * It can be observed: stub `navigator.clipboard`, open a record page, press the
 * copy button, and read both flavours back. That is the format as a person
 * receives it, which is what has to survive the rewrite - not a function
 * signature.
 *
 * The records below are chosen to cover the shape of the format rather than the
 * catalogue: a plain item, a consumable (which gains a suffix outside the app),
 * equipment (whose stat line is part of the heading), an upgrade chain (which
 * travels forward only), and a record with referenced Core cards.
 *
 * Run: node tools/capture-share-fixture.mjs
 * Output: docs/fixtures/share/records.json
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = 'file://' + join(ROOT, 'index.html');
const OUT = join(ROOT, 'docs', 'fixtures', 'share', 'records.json');

const LOOT = JSON.parse(readFileSync(join(ROOT, 'data.json'), 'utf8'));
/* Same walk as buildIndex in app/src/lib/data.ts: the roll tables live under
   `items` keyed by table, the alternative tables under `alt`, and equipment in
   its own array because it has stats instead of a roll number. */
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
    first((r) => r.src === 'dread')
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
    const v = document.querySelector('#view');
    return !!v && v.children.length > 0;
  });

const settle = () => new Promise((r) => setTimeout(r, 150));

async function capture(id, lang) {
  await page.goto(PAGE + '#/i/' + id, { waitUntil: 'networkidle0' });
  await ready();
  await page.evaluate((l) => {
    localStorage.setItem('dhloot.lang.v1', l);
  }, lang);
  await page.reload({ waitUntil: 'networkidle0' });
  await ready();

  const out = {};
  for (const [key, sel] of [
    ['name', '[data-copy-name]'],
    ['full', '[data-copy-full]']
  ]) {
    await page.evaluate(() => {
      window.__clip = null;
    });
    const found = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (el) el.click();
      return !!el;
    }, sel);
    if (!found) throw new Error(`no ${sel} on #/i/${id}`);
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
