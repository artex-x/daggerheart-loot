/* Mock of the /tables/* head from 761 to 999 px on the live site (read-only; CSS injected).
   today: the shipped head, which is already the Head Order Rule's mid band (h1, pin, help;
   the pills on their own row; the reserved tab row).
   scroll: the tab slot reserves one line; a group whose tabs need more scrolls them sideways.
   scrollTrim: scroll, plus 6 px instead of 10 px above the tabs and 12 px instead of 16 px under them.
   noReserve: the slot takes the current group's height (A steady head given up in this band). */
const puppeteer = require('E:/dev/daggerheart-loot/.claude/worktrees/57/node_modules/puppeteer');
const fs = require('fs');
const BASE = 'https://daggerheart-loot.pages.dev/';
const OUT = process.argv[2];
const SIZES = [
  [768, 1024],
  [900, 720]
];
const ROUTES = [
  ['eq-weapon', '#/tables/eq_weapon'],
  ['wondrous', '#/tables/wondrous']
];
const CSS = {
  today: '',
  scroll:
    '.tablenav.below .tabs{flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin}.tablenav.below .tab{flex:none;white-space:nowrap}',
  scrollTrim:
    '.tablenav.below .tabs{flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;margin-top:6px}.tablenav.below .tab{flex:none;white-space:nowrap}.searchrow{margin-top:-4px}',
  noReserve: '.tablenav.below .ghosts{display:none}'
};

async function geo(page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    scrollTo(0, 0);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const b = (el) =>
      el
        ? [
            Math.round(el.getBoundingClientRect().top),
            Math.round(el.getBoundingClientRect().bottom)
          ]
        : null;
    const prim = [...document.querySelectorAll('[data-primary]')].find(
      (e) => e.getBoundingClientRect().height > 0
    );
    const cur = document.querySelector('.tablenav .tabslot > .tabs');
    const tabs = cur ? [...cur.querySelectorAll('.tab')] : [];
    const visible = tabs.filter((t) => {
      const r = t.getBoundingClientRect();
      const c = cur.getBoundingClientRect();
      return r.left >= c.left - 1 && r.right <= c.right + 1;
    }).length;
    return {
      head: b(document.querySelector('.page-head')),
      groups: b(document.querySelector('.tablenav .groups')),
      tabslot: b(document.querySelector('.tablenav .tabslot')),
      tabs: b(cur),
      tabsScroll: cur ? [cur.scrollWidth, cur.clientWidth] : null,
      tabsVisible: [visible, tabs.length],
      search: b(document.querySelector('.searchrow')),
      primary: prim ? Math.round(prim.getBoundingClientRect().top) : null
    };
  });
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const log = [];
  try {
    for (const lang of ['ru', 'en']) {
      for (const [w, h] of SIZES) {
        for (const [name, route] of ROUTES) {
          for (const [v, css] of Object.entries(CSS)) {
            const page = await browser.newPage();
            await page.setViewport({ width: w, height: h });
            await page.evaluateOnNewDocument(
              (l) => localStorage.setItem('dhloot.lang.v1', l),
              lang
            );
            await page.goto(BASE + route, { waitUntil: 'networkidle0' });
            await page.waitForSelector('[data-primary]', { timeout: 15000 });
            if (css) await page.addStyleTag({ content: css });
            const g = await geo(page);
            const limit = Math.round(h * 0.4);
            const file = `tables-${name}__${w}__${lang}__${v}.png`;
            await page.screenshot({
              path: OUT + file,
              clip: { x: 0, y: 0, width: w, height: Math.min(h, 460) }
            });
            log.push({
              page: name,
              w,
              h,
              lang,
              variant: v,
              file,
              limit720: 288,
              limitOwn: limit,
              ...g
            });
            console.log(file, JSON.stringify(g));
            await page.close();
          }
        }
      }
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(OUT + 'tables-mid.json', JSON.stringify(log, null, 1) + '\n');
})();
