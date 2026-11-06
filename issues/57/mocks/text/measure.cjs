/* Text-measure probe (planner, 2026-11-05, owner item 15): reads every multi-line text block that a signed-out
 * reader can reach on the live site, at 360, 768, 1180, 1440 and 1920 px, RU and EN.
 *   node issues/57/mocks/text/measure.cjs today|after
 * "after" injects after.css (the proposed measure tokens) before each reading.
 * Writes issues/57/mocks/text/<mode>.json and a few shots in shots/. One browser at a time. */
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');

const BASE = 'https://daggerheart-loot.pages.dev';
const OUT = __dirname;
const MODE = process.argv[2] || 'today';
const ONLY = process.argv[3] || '';
const AFTER_CSS = MODE === 'after' ? fs.readFileSync(path.join(OUT, 'after.css'), 'utf8') : '';
const WIDTHS = [
  [360, 640],
  [768, 1024],
  [1180, 900],
  [1440, 900],
  [1920, 1080]
];

/* act: what to open before the reading. */
const STATES = [
  { id: 'search-start', route: '/search' },
  { id: 'search-none', route: '/search', type: 'zzqxj' },
  { id: 'search-rows', route: '/search', type: 'меч', typeEn: 'sword' },
  { id: 'tables-weapon-help', route: '/tables/eq_weapon', act: 'help' },
  { id: 'tables-loot', route: '/tables/core_item' },
  { id: 'tables-voa', route: '/tables/vault_of_ages' },
  { id: 'tables-none', route: '/tables/core_item', type: 'zzqxj' },
  { id: 'tables-dialog', route: '/tables/core_item', act: 'dialog' },
  { id: 'roll-std-help', route: '/roll/std', act: 'help' },
  { id: 'roll-std-result', route: '/roll/std', act: 'roll' },
  { id: 'roll-alt-help', route: '/roll/alt', act: 'help' },
  { id: 'roll-voa-help', route: '/roll/vault_of_ages', act: 'help' },
  { id: 'lists-out', route: '/lists' },
  { id: 'homebrew-out', route: '/homebrew' },
  { id: 'account-out', route: '/account' },
  { id: 'item-page', route: '/i/ci1' },
  { id: 'item-voa', route: '@voa' },
  /* The longest description of the catalog (847 characters RU, 874 EN). */
  { id: 'item-long', route: '/i/voa2_a3' },
  { id: 'print', route: '/p/set-twocards' },
  { id: 'notfound', route: '/no-such-page' },
  { id: 'share-notfound', route: '/s/' },
  { id: 'footer', route: '/roll/std', act: 'footer' },
  { id: 'privacy', route: '@privacy' },
  { id: 'terms', route: '@terms' }
];

const url = (route, lang) =>
  route.startsWith('http') ? route : BASE + (lang === 'en' ? '/en' + route : route);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(page, route, lang, w, h) {
  await page.setViewport({ width: w, height: h });
  await page.goto(url(route, lang), { waitUntil: 'networkidle0', timeout: 60000 });
  if (AFTER_CSS) await page.addStyleTag({ content: AFTER_CSS });
  await page.evaluate(() => document.fonts.ready);
  await sleep(400);
}

async function typeSearch(page, text) {
  const el = await page.$('main input[type=search], main input[type=text]');
  if (!el) return false;
  await el.click();
  await el.type(text, { delay: 10 });
  await sleep(800);
  return true;
}

async function clickFirst(page, fn) {
  const ok = await page.evaluate(fn);
  await sleep(700);
  return ok;
}

const openHelp = () => {
  const vis = (e) => e.getBoundingClientRect().width > 0;
  const b = [
    ...document.querySelectorAll('main .helpbtn, main [aria-controls][aria-expanded]')
  ].find(
    (e) =>
      vis(e) &&
      /help|справк|об этих|about/i.test(
        e.className + ' ' + e.textContent + ' ' + (e.getAttribute('aria-label') || '')
      )
  );
  if (!b) return false;
  b.click();
  return true;
};
const openDialog = () => {
  const a = [...document.querySelectorAll('main button.row-main, main a[href*="/i/"]')].find(
    (e) => e.getBoundingClientRect().width > 0
  );
  if (!a) return false;
  a.click();
  return true;
};
const doRoll = () => {
  const b = [...document.querySelectorAll('main button')].find(
    (e) =>
      e.getBoundingClientRect().width > 0 && /^(бросить|roll)\b/i.test(e.textContent.trim())
  );
  if (!b) return false;
  b.click();
  return true;
};
const openFooter = () => {
  const s = document.querySelector('footer details summary');
  if (!s) return false;
  s.click();
  s.scrollIntoView();
  return true;
};

/* Every block whose own inline text is 25 characters or more. */
function textProbe() {
  const SKIP =
    'script,style,svg,button,input,textarea,select,option,label,summary,h1,h2,h3,nav,[aria-hidden=true],.vh';
  const scopes = [
    ...document.querySelectorAll(
      'main, footer, [role=dialog], dialog[open], [role=status], [role=alert], .toast'
    )
  ];
  const seen = new Set();
  const out = [];
  const inlineText = (el) => {
    let s = '';
    for (const n of el.childNodes) {
      if (n.nodeType === 3) s += n.data;
      else if (n.nodeType === 1) {
        const d = getComputedStyle(n).display;
        if (d === 'inline' || d === 'inline-block' || d === 'inline-flex') s += n.textContent;
      }
    }
    return s.replace(/\s+/g, ' ').trim();
  };
  const cls = (e) => {
    const c =
      typeof e.className === 'string'
        ? e.className.split(/\s+/).filter((x) => x && !/^svelte-/.test(x))
        : [];
    return e.tagName.toLowerCase() + (c.length ? '.' + c.join('.') : '');
  };
  const chPx = (el) => {
    const s = document.createElement('span');
    s.textContent = '0'.repeat(100);
    s.style.cssText =
      'position:absolute;visibility:hidden;white-space:nowrap;font:inherit;letter-spacing:inherit';
    el.appendChild(s);
    const v = s.getBoundingClientRect().width / 100;
    s.remove();
    return v;
  };
  const lineBoxes = (el) => {
    const r = document.createRange();
    r.selectNodeContents(el);
    const rows = new Map();
    for (const q of r.getClientRects()) {
      if (q.width < 1) continue;
      const k = Math.round(q.top / 4);
      const v = rows.get(k) || { l: q.left, r: q.right };
      v.l = Math.min(v.l, q.left);
      v.r = Math.max(v.r, q.right);
      rows.set(k, v);
    }
    return [...rows.values()].map((v) => v.r - v.l);
  };
  for (const scope of scopes)
    for (const el of scope.querySelectorAll('*')) {
      if (seen.has(el) || el.closest(SKIP)) continue;
      const cs = getComputedStyle(el);
      if (/^inline/.test(cs.display) || cs.display === 'none' || cs.display === 'contents')
        continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1 || cs.visibility === 'hidden') continue;
      const text = inlineText(el);
      if (text.length < 25) continue;
      seen.add(el);
      const fs = parseFloat(cs.fontSize);
      const lh = cs.lineHeight === 'normal' ? fs * 1.2 : parseFloat(cs.lineHeight);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const lines = Math.max(1, Math.round((el.clientHeight - padY) / lh));
      const boxes = lineBoxes(el);
      const widest = boxes.length ? Math.max(...boxes) : 0;
      const clamp =
        cs.webkitLineClamp && cs.webkitLineClamp !== 'none' ? +cs.webkitLineClamp : 0;
      /* The width the block would take without its own cap, in place. */
      const keepMax = el.style.maxWidth;
      el.style.maxWidth = 'none';
      const freeW = el.getBoundingClientRect().width - padX;
      const freeLines = Math.max(1, Math.round((el.clientHeight - padY) / lh));
      el.style.maxWidth = keepMax;
      const clone = el.cloneNode(true);
      clone.style.cssText =
        'position:absolute;visibility:hidden;white-space:nowrap;max-width:none;width:auto;left:0;top:0;-webkit-line-clamp:none;display:block';
      el.parentElement.appendChild(clone);
      const oneLine = clone.getBoundingClientRect().width - padX;
      clone.remove();
      const ch = chPx(el);
      const capPx = cs.maxWidth === 'none' ? null : parseFloat(cs.maxWidth);
      const where = el.closest('[role=dialog], dialog')
        ? 'dialog'
        : el.closest('footer')
          ? 'footer'
          : el.closest('[role=status], [role=alert], .toast') && !el.closest('main')
            ? 'live'
            : 'main';
      const chain = [];
      for (let p = el; p && p !== scope && chain.length < 4; p = p.parentElement)
        chain.push(cls(p));
      out.push({
        key: cls(el),
        chain: chain.join(' < '),
        where,
        chars: text.length,
        text: text.slice(0, 90),
        fontSize: +fs.toFixed(1),
        lineHeight: +lh.toFixed(1),
        ch: +ch.toFixed(2),
        capPx: capPx === null ? null : +capPx.toFixed(1),
        capCh: capPx === null ? null : +(capPx / ch).toFixed(1),
        width: +(rect.width - padX).toFixed(1),
        widest: +widest.toFixed(1),
        lines,
        clamp,
        cpl: +(
          text.length / (clamp && lines >= clamp ? Math.max(boxes.length, lines) : lines)
        ).toFixed(1),
        freeW: +freeW.toFixed(1),
        freeLines,
        oneLine: +oneLine.toFixed(1),
        emptyBand: +(freeW - widest).toFixed(1),
        early: lines > freeLines
      });
    }
  return out;
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  let ctx = null;
  let page = null;
  const fresh = async () => {
    if (ctx) await ctx.close();
    ctx = await browser.createBrowserContext();
    page = await ctx.newPage();
  };
  const out = [];
  const shots = path.join(OUT, 'shots');
  fs.mkdirSync(shots, { recursive: true });
  try {
    /* Resolve the routes that come from the page: a long Vault of Ages record, the footer's static pages. */
    await fresh();
    await open(page, '/tables/vault_of_ages', 'ru', 1180, 900);
    const voa = await page.evaluate(() => {
      const a = [...document.querySelectorAll('main a[href*="/i/"]')];
      return a.length ? new URL(a[0].href).pathname : '/i/ci1';
    });
    const pages = await page.evaluate(() =>
      Object.fromEntries(
        [...document.querySelectorAll('footer a')].map((a) => [a.textContent.trim(), a.href])
      )
    );
    const pick = (re) => Object.entries(pages).find(([k]) => re.test(k))?.[1] || null;
    const special = {
      '@voa': voa,
      '@privacy': pick(/privacy|конфиден/i),
      '@terms': pick(/terms|услов/i)
    };
    for (const s of STATES) {
      if (ONLY && !ONLY.split(',').includes(s.id)) continue;
      const route = special[s.route] || s.route;
      if (!route) continue;
      for (const lang of ['ru', 'en'])
        for (const [w, h] of WIDTHS) {
          await fresh();
          await open(
            page,
            route.startsWith('http') && lang === 'en'
              ? route.replace(/\/pages\//, '/pages/en/')
              : route,
            lang,
            w,
            h
          );
          let acted = true;
          if (s.type)
            acted = await typeSearch(page, lang === 'en' && s.typeEn ? s.typeEn : s.type);
          if (s.act === 'help') {
            acted = await clickFirst(page, openHelp);
            /* Up to 760 px the page help can sit in the head's menu. */
            if (!acted)
              for (const b of await page.$$(
                'main button[aria-haspopup], main button[aria-expanded]'
              )) {
                if (!(await b.boundingBox())) continue;
                await b.click();
                await sleep(300);
                acted = await clickFirst(page, () => {
                  const m = [
                    ...document.querySelectorAll(
                      '[role=menuitem], [role=menu] button, [role=menu] a'
                    )
                  ].find(
                    (e) =>
                      e.getBoundingClientRect().width > 0 &&
                      /об этих|about|справк|help|где какая|rarit/i.test(e.textContent)
                  );
                  if (!m) return false;
                  m.click();
                  return true;
                });
                if (acted) break;
                await page.keyboard.press('Escape');
              }
          }
          if (s.act === 'dialog') acted = await clickFirst(page, openDialog);
          if (s.act === 'roll') acted = await clickFirst(page, doRoll);
          if (s.act === 'footer') acted = await clickFirst(page, openFooter);
          const blocks = await page.evaluate(textProbe);
          out.push({
            id: s.id,
            route,
            lang,
            w,
            acted,
            main: await page.evaluate(
              () => document.querySelector('main')?.getBoundingClientRect().width || 0
            ),
            blocks
          });
          if (lang === 'ru' && (w === 1180 || w === 1920) && /help|dialog|out|print/.test(s.id))
            await page.screenshot({ path: path.join(shots, `${MODE}-${s.id}__${w}__ru.png`) });
        }
      console.log(s.id, 'done');
    }
    fs.writeFileSync(
      path.join(OUT, MODE + (ONLY ? '-' + ONLY.replace(/,/g, '_') : '') + '.json'),
      JSON.stringify(out, null, 1)
    );
  } finally {
    if (ctx) await ctx.close();
    await browser.close();
  }
  console.log(MODE, out.length, 'readings');
})();
