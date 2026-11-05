/* Read-only probe of the live site: where the /tables/* head spends its height at 768-1180 px. */
const puppeteer = require('E:/dev/daggerheart-loot/.claude/worktrees/57/node_modules/puppeteer');
const BASE = 'https://daggerheart-loot.pages.dev/';
const SIZES = [
  [768, 1024],
  [820, 1180],
  [900, 720],
  [1000, 720],
  [1180, 720]
];
const ROUTES = ['#/tables/eq_weapon', '#/tables/wondrous', '#/tables/core_item'];

async function geo(page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    scrollTo(0, 0);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return [Math.round(r.top), Math.round(r.bottom), Math.round(r.left), Math.round(r.right)];
    };
    const prim = [...document.querySelectorAll('[data-primary]')].find(
      (e) => e.getBoundingClientRect().height > 0
    );
    const chips = [...document.querySelectorAll('.tablenav .groups .chip')];
    const tabs = [...document.querySelectorAll('.tablenav .tabslot > .tabs .tab')];
    const chipW =
      chips.reduce((s, c) => s + c.getBoundingClientRect().width, 0) +
      7 * Math.max(0, chips.length - 1);
    const main = document.querySelector('#main');
    return {
      url: location.hash,
      header: Math.round(
        document.querySelector('header.top')?.getBoundingClientRect().bottom ?? 0
      ),
      mainPadTop: main ? getComputedStyle(main).paddingTop : null,
      head: box(document.querySelector('.page-head')),
      h1: box(document.querySelector('.page-head h1')),
      pin: box(document.querySelector('.page-head .homebtn')),
      help: box(document.querySelector('.page-head .helpbtn')),
      groups: box(document.querySelector('.tablenav .groups')),
      chipCount: chips.length,
      chipW: Math.round(chipW),
      chipLines: new Set(chips.map((c) => Math.round(c.getBoundingClientRect().top))).size,
      tabslot: box(document.querySelector('.tablenav .tabslot')),
      tabs: box(document.querySelector('.tablenav .tabslot > .tabs')),
      tabLines: new Set(tabs.map((c) => Math.round(c.getBoundingClientRect().top))).size,
      search: box(document.querySelector('.searchrow')),
      primary: box(prim),
      col: box(main)
    };
  });
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const out = [];
  try {
    for (const lang of ['ru', 'en']) {
      for (const [w, h] of SIZES) {
        for (const r of ROUTES) {
          const page = await browser.newPage();
          await page.setViewport({ width: w, height: h });
          await page.evaluateOnNewDocument(
            (l) => localStorage.setItem('dhloot.lang.v1', l),
            lang
          );
          await page.goto(BASE + r, { waitUntil: 'networkidle0' });
          await page.waitForSelector('[data-primary]', { timeout: 15000 }).catch(() => {});
          const g = await geo(page);
          out.push({ lang, w, h, r, ...g });
          console.log(lang, w, r, JSON.stringify(g));
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
  require('fs').writeFileSync(process.argv[2], JSON.stringify(out, null, 1) + '\n');
})();
