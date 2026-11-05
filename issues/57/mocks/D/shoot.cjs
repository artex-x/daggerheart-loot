/* Batch D mock (planner, 2026-11-05): the live site with the proposed CSS injected - the empty plate with a solid
 * border on a quieter ground and the 16 px gap token, and the page lead at 120ch. Shoots before and after and
 * re-measures the gap and the lead lines on the injected page.
 *   node issues/57/mocks/D/shoot.cjs
 * Writes issues/57/mocks/D/shots/*.png and issues/57/mocks/D/after.json. One browser at a time. */
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');

const BASE = 'https://daggerheart-loot.pages.dev';
const OUT = __dirname;
const SHOTS = path.join(OUT, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

/* Option A (recommended): solid seam border, Vault Wall ground. Option B: no border, the ground only. */
/* `!important` only because the page's scoped classes outrank an injected selector; the build writes the
   rules into the components themselves. The `:has` pair is the filter-column case of plan-D.md, step S3. */
const GAP = `:root{--gap-plate:16px} main .empty{margin-top:var(--gap-plate)!important}
  main .body.withcol:has(> .rowscol > .empty:first-child){margin-top:var(--gap-plate)!important}
  main .body.withcol > .rowscol > .empty:first-child{margin-top:0!important}
  main .page-sub{max-width:120ch!important}`;
const CSS = {
  today: '',
  a:
    GAP +
    ` main .empty{border-style:solid!important;border-color:var(--line)!important;background:var(--bg2)!important}`,
  b: GAP + ` main .empty{border-color:transparent!important;background:var(--bg2)!important}`
};

const JOBS = [
  {
    id: 'search',
    route: '/search',
    variants: ['today', 'a'],
    widths: [360, 1180],
    langs: ['ru', 'en']
  },
  { id: 'search', route: '/search', variants: ['b'], widths: [1180], langs: ['ru'] },
  { id: 'search', route: '/search', variants: ['today', 'a'], widths: [1920], langs: ['ru'] },
  {
    id: 'tables-none',
    route: '/tables/eq_weapon',
    type: 'zzqxj',
    variants: ['today', 'a'],
    widths: [360, 1180],
    langs: ['ru', 'en']
  }
];

const url = (route, lang) => BASE + (lang === 'en' ? '/en' + route : route);

function probe() {
  const vis = (e) => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden';
  };
  const out = {};
  const plate = [...document.querySelectorAll('main .empty')].find(vis);
  if (plate) {
    const pr = plate.getBoundingClientRect();
    let best = null;
    for (const e of document.querySelectorAll('main *')) {
      if (e === plate || e.contains(plate) || plate.contains(e) || !vis(e)) continue;
      const r = e.getBoundingClientRect();
      if (r.bottom > pr.top + 0.5 || r.right <= pr.left || r.left >= pr.right) continue;
      if (!best || r.bottom > best.bottom) best = r;
    }
    out.gap = best ? +(pr.top - best.bottom).toFixed(1) : null;
    out.plateTop = +pr.top.toFixed(1);
    out.border = getComputedStyle(plate).borderTopStyle;
  }
  const sub = [...document.querySelectorAll('main .page-sub')].find(vis);
  if (sub) {
    const cs = getComputedStyle(sub);
    out.leadLines = Math.round(sub.getBoundingClientRect().height / parseFloat(cs.lineHeight));
    out.leadMax = cs.maxWidth;
  }
  return out;
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const res = [];
  try {
    for (const j of JOBS)
      for (const v of j.variants)
        for (const w of j.widths)
          for (const lang of j.langs) {
            const ctx = await browser.createBrowserContext();
            const page = await ctx.newPage();
            const h = w === 360 ? 640 : w === 1920 ? 1080 : 720;
            await page.setViewport({ width: w, height: h });
            await page.goto(url(j.route, lang), { waitUntil: 'networkidle0', timeout: 60000 });
            if (CSS[v]) await page.addStyleTag({ content: CSS[v] });
            if (j.type) {
              const el = await page.$('main input[type=search]');
              await el.click();
              await el.type(j.type, { delay: 10 });
              await page.evaluate(() => document.activeElement.blur());
            }
            await page.evaluate(() => document.fonts.ready);
            await new Promise((r) => setTimeout(r, 600));
            res.push({ id: j.id, variant: v, w, lang, ...(await page.evaluate(probe)) });
            await page.screenshot({
              path: path.join(SHOTS, `${j.id}__${w}__${lang}__${v}.png`)
            });
            await ctx.close();
          }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, 'after.json'), JSON.stringify(res, null, 1));
  for (const r of res)
    console.log(
      r.id,
      r.variant,
      r.w,
      r.lang,
      'gap',
      r.gap,
      r.border,
      'lead',
      r.leadLines,
      r.leadMax
    );
})();
