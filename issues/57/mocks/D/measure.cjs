/* Batch D probe (planner, 2026-11-05): measures on the live site (production) the gap between the block above
 * every empty plate (`.empty`) and the plate's top edge, and the page lead (`.page-sub`) of every head page:
 * its length, its lines, its cap and the width it needs on one line.
 *   node issues/57/mocks/D/measure.cjs gaps|leads
 * Writes issues/57/mocks/D/gaps.json or leads.json. One browser at a time. */
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');

const BASE = 'https://daggerheart-loot.pages.dev';
const OUT = __dirname;
const MODE = process.argv[2] || 'gaps';

const GAP_STATES = [
  { id: 'search-what', route: '/search' },
  { id: 'search-none', route: '/search', type: 'zzqxj' },
  { id: 'tables-none', route: '/tables/eq_weapon', type: 'zzqxj' },
  { id: 'tables-loot-none', route: '/tables/core_item', type: 'zzqxj' },
  { id: 'tables-homebrew', route: '/tables/homebrew' },
  { id: 'lists-out', route: '/lists' },
  { id: 'homebrew-out', route: '/homebrew' }
];

const LEAD_ROUTES = [
  '/search',
  '/tables/eq_weapon',
  '/lists',
  '/homebrew',
  '/account',
  '/p/set-twocards',
  '/roll/std',
  '/roll/alt',
  '/roll/wondrous',
  '/roll/dread',
  '/roll/voa',
  '/roll/dv',
  '/roll/arazo',
  '/roll/community',
  '/roll/mwt'
];

const url = (route, lang) => BASE + (lang === 'en' ? '/en' + route : route);

async function open(page, route, lang, w, h) {
  await page.setViewport({ width: w, height: h });
  await page.goto(url(route, lang), { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 400));
}

async function typeSearch(page, text) {
  const sel = 'main input[type=search], main input[type=text]';
  const el = await page.$(sel);
  if (!el) return false;
  await el.click();
  await el.type(text, { delay: 10 });
  await new Promise((r) => setTimeout(r, 700));
  return true;
}

function gapProbe() {
  const vis = (e) => {
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const plate = [...document.querySelectorAll('main .empty')].find(vis);
  if (!plate) return { plate: null };
  const pr = plate.getBoundingClientRect();
  let best = null;
  for (const e of document.querySelectorAll('main *')) {
    if (e === plate || e.contains(plate) || plate.contains(e) || !vis(e)) continue;
    const r = e.getBoundingClientRect();
    if (r.bottom > pr.top + 0.5) continue;
    if (r.right <= pr.left || r.left >= pr.right) continue;
    if (!best || r.bottom > best.r.bottom + 0.01) best = { e, r };
  }
  const pcs = getComputedStyle(plate);
  const par = plate.parentElement;
  const parcs = getComputedStyle(par);
  const cls = (e) =>
    e.tagName.toLowerCase() +
    (e.className && typeof e.className === 'string'
      ? '.' + e.className.trim().split(/\s+/).join('.')
      : '');
  const above = best
    ? {
        el: cls(best.e),
        text: (best.e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
        bottom: +best.r.bottom.toFixed(1),
        parent: cls(best.e.parentElement)
      }
    : null;
  return {
    plate: {
      top: +pr.top.toFixed(1),
      height: +pr.height.toFixed(1),
      width: +pr.width.toFixed(1),
      marginTop: pcs.marginTop,
      border: pcs.borderTopStyle + ' ' + pcs.borderTopColor,
      bg: pcs.backgroundColor
    },
    parent: {
      el: cls(par),
      display: parcs.display,
      rowGap: parcs.rowGap,
      paddingTop: parcs.paddingTop
    },
    above,
    gap: best ? +(pr.top - best.r.bottom).toFixed(1) : null,
    title: (plate.querySelector('.title')?.textContent || plate.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50)
  };
}

function leadProbe() {
  const sub = [...document.querySelectorAll('main .page-sub')].find(
    (e) => e.getBoundingClientRect().width > 0
  );
  if (!sub) return { lead: null };
  const r = sub.getBoundingClientRect();
  const cs = getComputedStyle(sub);
  const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
  const clone = sub.cloneNode(true);
  clone.style.cssText =
    'position:absolute;visibility:hidden;white-space:nowrap;max-width:none;width:auto;left:0;top:0';
  sub.parentElement.appendChild(clone);
  const natural = clone.getBoundingClientRect().width;
  clone.remove();
  const col = sub.parentElement.getBoundingClientRect().width;
  const text = sub.textContent.replace(/\s+/g, ' ').trim();
  return {
    lead: {
      chars: text.length,
      text: text.slice(0, 140),
      width: +r.width.toFixed(1),
      lines: Math.round(r.height / lh),
      lineHeight: +lh.toFixed(1),
      maxWidth: cs.maxWidth,
      fontSize: cs.fontSize,
      oneLineWidth: +natural.toFixed(1),
      column: +col.toFixed(1),
      fitsColumn: natural <= col
    }
  };
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  /* A fresh context per reading: the app keeps the last language in localStorage, so a
     reused page would draw the RU route in English after an EN visit. */
  let ctx = null;
  let page = null;
  const fresh = async () => {
    if (ctx) await ctx.close();
    ctx = await browser.createBrowserContext();
    page = await ctx.newPage();
  };
  const out = [];
  try {
    if (MODE === 'gaps') {
      for (const s of GAP_STATES)
        for (const lang of ['ru', 'en'])
          for (const w of [360, 1180, 1920]) {
            await fresh();
            await open(page, s.route, lang, w, w === 360 ? 640 : 900);
            if (w === 1180 && lang === 'ru' && /out|homebrew/.test(s.id))
              await page.screenshot({ path: path.join(OUT, `today-${s.id}__1180__ru.png`) });
            if (s.type) await typeSearch(page, s.type);
            out.push({ id: s.id, lang, w, ...(await page.evaluate(gapProbe)) });
          }
      fs.writeFileSync(path.join(OUT, 'gaps.json'), JSON.stringify(out, null, 1));
    } else {
      await fresh();
      await open(page, '/roll/std', 'ru', 1180, 900);
      const more = await page.evaluate(() => [
        ...new Set(
          [...document.querySelectorAll('a[href^="/roll/"]')].map(
            (a) => new URL(a.href).pathname
          )
        )
      ]);
      const routes = [...new Set([...LEAD_ROUTES, ...more])];
      for (const route of routes)
        for (const lang of ['ru', 'en'])
          for (const w of [360, 1180, 1440, 1920]) {
            await fresh();
            await open(page, route, lang, w, w === 360 ? 640 : 900);
            out.push({ route, lang, w, ...(await page.evaluate(leadProbe)) });
          }
      fs.writeFileSync(path.join(OUT, 'leads.json'), JSON.stringify(out, null, 1));
    }
  } finally {
    if (ctx) await ctx.close();
    await browser.close();
  }
  console.log(MODE, out.length, 'readings');
})();
