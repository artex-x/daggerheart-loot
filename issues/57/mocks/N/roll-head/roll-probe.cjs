/* Probe of the roll head under the Head Order Rule on the live site (read-only; DOM moved):
   h1 «Бросок» / "Roll", the mode pills, the pin, the help in one row from 1000 px; from 761 to
   999 px the pills take their own row under the title row. Both pin states. */
const puppeteer = require('E:/dev/daggerheart-loot/.claude/worktrees/57/node_modules/puppeteer');
const fs = require('fs');
const BASE = 'https://daggerheart-loot.pages.dev/';
const OUT = process.argv[2];
const ROUTES = ['std', 'alt', 'wondrous', 'dread', 'voa', 'dv', 'arazo', 'community', 'mwt'];
const SIZES = [
  [768, 1024],
  [900, 720],
  [1000, 720],
  [1050, 720],
  [1100, 720],
  [1180, 720]
];
const SHOTS = new Set([
  'alt|1000|ru|on',
  'mwt|1000|ru|on',
  'wondrous|1000|ru|on',
  'alt|768|ru|off',
  'alt|768|en|off',
  'std|1180|ru|off',
  'alt|1180|en|on',
  'mwt|900|ru|on'
]);

async function move(page, lang, mid) {
  return page.evaluate(
    (lang, mid) => {
      const nav = document.querySelector('nav.modes');
      const head = document.querySelector('.page-head');
      const h1 = head?.querySelector('h1');
      if (!nav || !head || !h1) return false;
      h1.textContent = lang === 'ru' ? 'Бросок' : 'Roll';
      const inner = nav.querySelector('.modes-in');
      inner.style.cssText =
        'width:auto;padding:0;margin:0;display:flex;gap:8px;align-items:center;flex-wrap:nowrap';
      nav.style.cssText = 'border:0';
      if (mid) {
        nav.style.cssText = 'border:0;margin:10px 0 12px';
        head.after(nav);
      } else {
        h1.after(nav);
      }
      return true;
    },
    lang,
    mid
  );
}

async function geo(page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    scrollTo(0, 0);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const R = (el) => (el ? el.getBoundingClientRect() : null);
    const head = document.querySelector('.page-head');
    const parts = {
      h1: R(head.querySelector('h1')),
      nav: R(document.querySelector('nav.modes .modes-in')),
      pin: R(head.querySelector('.homebtn')),
      help: R(head.querySelector('.helpbtn'))
    };
    const col = R(document.querySelector('#main'));
    const tops = Object.values(parts)
      .filter(Boolean)
      .map((r) => Math.round(r.top + r.height / 2));
    const rows = [];
    for (const t of tops) if (!rows.some((x) => Math.abs(x - t) <= 8)) rows.push(t);
    const right = Math.max(
      ...Object.values(parts)
        .filter(Boolean)
        .map((r) => r.right)
    );
    const prim = [...document.querySelectorAll('[data-primary]')].find(
      (e) => e.getBoundingClientRect().height > 0
    );
    const sub = R(document.querySelector('.page-sub'));
    return {
      rows: rows.length,
      spare: Math.round(col.right - right),
      pillLeft: parts.nav ? Math.round(parts.nav.left) : null,
      pillTop: parts.nav ? Math.round(parts.nav.top) : null,
      gapTitlePills: parts.nav ? Math.round(parts.nav.top - parts.h1.bottom) : null,
      gapPillsLead: parts.nav && sub ? Math.round(sub.top - parts.nav.bottom) : null,
      pinLabel: document.querySelector('.page-head .homebtn')?.textContent.trim(),
      help: document.querySelector('.page-head .helpbtn')?.textContent.trim(),
      first: prim ? Math.round(prim.getBoundingClientRect().top) : null
    };
  });
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const log = [];
  try {
    for (const lang of ['ru', 'en']) {
      for (const [w, h] of SIZES) {
        for (const r of ROUTES) {
          for (const pin of ['off', 'on']) {
            const page = await browser.newPage();
            await page.setViewport({ width: w, height: h });
            await page.evaluateOnNewDocument(
              (l) => localStorage.setItem('dhloot.lang.v1', l),
              lang
            );
            await page.goto(BASE + '#/roll/' + r, { waitUntil: 'networkidle0' });
            await page.waitForSelector('.page-head', { timeout: 15000 });
            const today = await geo(page);
            if (pin === 'on') {
              await page.click('.page-head .homebtn');
              await new Promise((res) => setTimeout(res, 150));
            }
            const ok = await move(page, lang, w < 1000);
            const g = await geo(page);
            const key = `${r}|${w}|${lang}|${pin}`;
            if (SHOTS.has(key))
              await page.screenshot({
                path: OUT + `roll-${r}__${w}__${lang}__pin-${pin}.png`,
                clip: { x: 0, y: 0, width: w, height: Math.min(h, 420) }
              });
            log.push({ route: r, w, h, lang, pin, moved: ok, todayFirst: today.first, ...g });
            console.log(key, today.first, JSON.stringify(g));
            await page.close();
          }
        }
      }
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(OUT + 'roll-head.json', JSON.stringify(log, null, 1) + '\n');
})();
