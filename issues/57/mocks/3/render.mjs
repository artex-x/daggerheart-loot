/* Renders chosen states of a batch mock to PNG (task 57, round 5):
     node issues/57/mocks/3/render.mjs <mock> [name,name,...]
   reads mocks/<mock>/shots.json (every shot, or only those whose `name` is listed)
   and writes <name>__<width>__<lang>.png next to it. Same options as
   mocks/1/render.mjs: `screen: true` is the first screen only (360x640,
   1180x720); `size: [w, h]` is one exact viewport; `widths`, `langs`, `page`
   and `q` as there. Needs the puppeteer devDependency. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';

const here = dirname(fileURLToPath(import.meta.url));
const mocks = dirname(here);
const [mock, only] = process.argv.slice(2);
if (!mock) throw new Error('No mock given. Run: node render.mjs 5 [name,name]');
const want = only ? only.split(',') : null;

const browser = await puppeteer.launch({ headless: true });
let count = 0;
try {
  const dir = join(mocks, mock);
  const shots = JSON.parse(readFileSync(join(dir, 'shots.json'), 'utf8'));
  for (const shot of shots) {
    if (want && !want.includes(shot.name)) continue;
    const widths = shot.size ? [shot.size[0]] : shot.widths || [360, 1180];
    for (const lang of shot.langs || ['ru', 'en']) {
      for (const w of widths) {
        const page = await browser.newPage();
        page.on('pageerror', (e) =>
          console.error(`${mock}/${shot.name} ${lang} ${w}: ${e.message}`)
        );
        page.on('requestfailed', (r) => console.error(`${mock}/${shot.name}: no ${r.url()}`));
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
              i.complete ? 0 : new Promise((r) => i.addEventListener('load', r, { once: true }))
            )
          );
        });
        const out = shot.size ? `${shot.name}__${lang}.png` : `${shot.name}__${w}__${lang}.png`;
        await page.screenshot({ path: join(dir, out), fullPage: !shot.size && !shot.screen });
        await page.close();
        count++;
      }
    }
  }
} finally {
  await browser.close();
}
console.log(`${count} PNGs`);
