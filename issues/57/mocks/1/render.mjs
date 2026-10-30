/* Renders the unit A batch mocks to PNG: node issues/57/mocks/1/render.mjs 1 3
   reads mocks/<N>/shots.json and writes <name>__<width>__<lang>.png next to
   it. A shot with `screen: true` is the first screen only (360x640, 1180x720). A shot with `size: [w, h]` is one exact viewport (the share cards)
   and is named <name>__<lang>.png. Needs the puppeteer devDependency. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';

const here = dirname(fileURLToPath(import.meta.url));
const mocks = dirname(here);
const batches = process.argv.slice(2);
if (!batches.length) throw new Error('No batch given. Run: node render.mjs 1 2 3');

const browser = await puppeteer.launch({ headless: true });
let count = 0;
try {
  for (const b of batches) {
    const dir = join(mocks, b);
    const shots = JSON.parse(readFileSync(join(dir, 'shots.json'), 'utf8'));
    for (const shot of shots) {
      const widths = shot.size ? [shot.size[0]] : shot.widths || [360, 1180];
      for (const lang of shot.langs || ['ru', 'en']) {
        for (const w of widths) {
          const page = await browser.newPage();
          page.on('pageerror', (e) =>
            console.error(`${b}/${shot.name} ${lang} ${w}: ${e.message}`)
          );
          page.on('requestfailed', (r) => console.error(`${b}/${shot.name}: no ${r.url()}`));
          await page.setViewport({
            width: w,
            height: shot.size ? shot.size[1] : shot.screen ? (w < 760 ? 640 : 720) : 900
          });
          const q = new URLSearchParams({ ...(shot.q || {}), lang });
          if (shot.s) q.set('s', shot.s);
          await page.goto(`${pathToFileURL(join(dir, shot.page || 'state.html')).href}?${q}`, {
            waitUntil: 'load'
          });
          await page.evaluate(async () => {
            await document.fonts.ready;
            await Promise.all(
              [...document.images].map((i) =>
                i.complete
                  ? 0
                  : new Promise((r) => i.addEventListener('load', r, { once: true }))
              )
            );
          });
          const out = shot.size
            ? `${shot.name}__${lang}.png`
            : `${shot.name}__${w}__${lang}.png`;
          await page.screenshot({ path: join(dir, out), fullPage: !shot.size && !shot.screen });
          await page.close();
          count++;
        }
      }
    }
  }
} finally {
  await browser.close();
}
console.log(`${count} PNGs`);
