/* Renders every mark candidate at every size it ships at:
   node issues/57/mocks/mark/render.mjs [candidate ids...]
   writes png/<id>__<view>[__<width>__<lang>].png and png/lineup[@2x].png from
   stage.html. Needs the puppeteer devDependency. */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';
import puppeteer from 'puppeteer';

const here = dirname(fileURLToPath(import.meta.url));
const ctx = { window: {} };
vm.runInNewContext(readFileSync(join(here, 'candidates.js'), 'utf8'), ctx);
const only = process.argv.slice(2);
const marks = ctx.window.MARKS.filter((m) => !only.length || only.includes(m.id));
const png = join(here, 'png');
mkdirSync(png, { recursive: true });
const stage = pathToFileURL(join(here, 'stage.html')).href;

const shots = [
  { out: 'lineup', q: { v: 'lineup' }, dpr: 1 },
  { out: 'lineup@2x', q: { v: 'lineup' }, dpr: 2 }
];
for (const m of marks) {
  shots.push({ out: `${m.id}__fav`, q: { v: 'fav', c: m.id }, dpr: 1 });
  shots.push({ out: `${m.id}__apps`, q: { v: 'apps', c: m.id }, dpr: 1 });
  shots.push({ out: `${m.id}__big`, q: { v: 'big', c: m.id }, dpr: 2 });
  for (const lang of ['ru', 'en']) {
    for (const w of [360, 1180]) {
      shots.push({
        out: `${m.id}__head__${w}__${lang}`,
        q: { v: 'head', c: m.id, lang },
        dpr: 2,
        size: [w, 61]
      });
    }
    shots.push({
      out: `${m.id}__share__${lang}`,
      q: { v: 'share', c: m.id, lang },
      dpr: 1,
      size: [1200, 630]
    });
  }
}

const browser = await puppeteer.launch({ headless: true });
try {
  for (const s of shots) {
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.error(`${s.out}: ${e.message}`));
    page.on('requestfailed', (r) => console.error(`${s.out}: no ${r.url()}`));
    const [w, h] = s.size || [1400, 900];
    await page.setViewport({ width: w, height: h, deviceScaleFactor: s.dpr });
    await page.goto(`${stage}?${new URLSearchParams(s.q)}`, { waitUntil: 'load' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images].map((i) =>
          i.complete ? 0 : new Promise((r) => i.addEventListener('load', r, { once: true }))
        )
      );
    });
    const path = join(png, `${s.out}.png`);
    if (s.size) {
      await page.screenshot({ path });
    } else {
      await page.$eval('#out', (el) => (el.style.display = 'inline-block'));
      await (await page.$('#out')).screenshot({ path });
    }
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(`${shots.length} PNGs in ${png}`);
