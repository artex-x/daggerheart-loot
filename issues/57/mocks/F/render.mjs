/* Renders the feedback mock (task 57): node issues/57/mocks/F/render.mjs [name,name]
   Reads shots.json, writes <name>__<w>x<h>__<lang>.png, and rows.json with the first
   entry's top and the rows per screen of each list frame. Needs the puppeteer
   devDependency. Headless Chrome only: it runs no build and no test. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const req = createRequire(join(here, '../../../../package.json'));
const puppeteer = req('puppeteer');
const want = process.argv[2] ? process.argv[2].split(',') : null;
const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));
const outFile = join(here, 'rows.json');
const table = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : {};
const browser = await puppeteer.launch({ headless: true });
const ROW = '.crow, .lrow, .clrow, .trow, .rl, article.scard';
let count = 0;
try {
  for (const shot of shots) {
    if (want && !want.includes(shot.name)) continue;
    for (const [w, h] of shot.sizes) {
      for (const lang of shot.langs || ['ru', 'en']) {
        const page = await browser.newPage();
        page.on('pageerror', (e) => console.error(`${shot.name} ${lang} ${w}: ${e.message}`));
        await page.setViewport({ width: w, height: h });
        const q = new URLSearchParams({ ...(shot.q || {}), lang, s: shot.s });
        const file = join(here, shot.page || 'state.html');
        await page.goto(`${pathToFileURL(file).href}?${q}`, { waitUntil: 'load' });
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(
            [...document.images].map((i) =>
              i.complete ? 0 : new Promise((r) => i.addEventListener('load', r, { once: true }))
            )
          );
        });
        if (shot.css) await page.addStyleTag({ content: shot.css });
        if (shot.js) await page.evaluate(shot.js);
        if (shot.scroll) await page.evaluate((y) => scrollTo(0, y), shot.scroll);
        await new Promise((r) => setTimeout(r, 60));
        const m = await page.evaluate((sel) => {
          const head = document.querySelector('header.top');
          const hb = head ? head.getBoundingClientRect() : { bottom: 0 };
          const rows = [...document.querySelectorAll(sel)].filter(
            (e) => e.getBoundingClientRect().height > 0
          );
          const bar = document.querySelector('.pinbar');
          const top0 = Math.max(0, hb.bottom);
          const bottom = bar ? bar.getBoundingClientRect().top : innerHeight;
          let seen = 0;
          let whole = 0;
          for (const e of rows) {
            const b = e.getBoundingClientRect();
            const vis = Math.min(b.bottom, bottom) - Math.max(b.top, top0);
            if (vis > 0) seen += vis / b.height;
            if (b.top >= top0 - 0.5 && b.bottom <= bottom + 0.5) whole += 1;
          }
          return {
            first: rows.length
              ? Math.round(rows[0].getBoundingClientRect().top + scrollY)
              : null,
            head: Math.round(Math.max(0, hb.bottom)),
            rowH: rows.map((e) => Math.round(e.getBoundingClientRect().height)),
            seen: Math.round(seen * 10) / 10,
            whole,
            bar: bar ? Math.round(bar.getBoundingClientRect().height) : 0,
            sw: document.documentElement.scrollWidth
          };
        }, ROW);
        const key = `${shot.name}__${w}x${h}__${lang}`;
        table[key] = m;
        await page.screenshot({ path: join(here, `${key}.png`), fullPage: !!shot.full });
        await page.close();
        count++;
      }
    }
  }
} finally {
  await browser.close();
}
writeFileSync(outFile, JSON.stringify(table).replace(/\},/g, '},\n'));
console.log(`${count} PNGs`);
