/* Batch T probe (planner, 2026-11-05): measures every pressable control and the first-screen top on the live
 * site (production, wave 2b), before and after the Thumb Rule CSS is injected.
 *   node issues/57/mocks/T/probe.cjs [widths] [--inject] [--shots]
 * Writes issues/57/mocks/T/measure-<before|after>.json and, with --shots, PNGs into issues/57/mocks/T/. */
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');

const BASE = 'https://daggerheart-loot.pages.dev';
const OUT = __dirname;
const argv = process.argv.slice(2);
const INJECT = argv.includes('--inject');
const FOLD = argv.includes('--fold');
const ONLYIDS = (argv.find((a) => a.startsWith('--only=')) || '')
  .slice(7)
  .split(',')
  .filter(Boolean);
const SHOTS = argv.includes('--shots');
const WIDTHS = argv.filter((a) => /^\d+$/.test(a)).map(Number);
const widths = WIDTHS.length ? WIDTHS : [360, 390, 600];
const SHOT_IDS = [
  'roll-std',
  'roll-alt',
  'roll-std-setup',
  'tables-eq-weapon',
  'tables-filters',
  'tables-selecting',
  'tables-grid-selecting',
  'search'
];
const THUMB_CSS = fs.readFileSync(path.join(OUT, 'thumb.css'), 'utf8');

/* State: a route and the presses that open it. `primary: true` marks a FIRST_SCREEN row. */
const STATES = [
  { id: 'roll-std', route: '/roll/std', primary: true },
  { id: 'roll-alt', route: '/roll/alt', primary: true },
  { id: 'roll-voa', route: '/roll/vault_of_ages', primary: true },
  { id: 'roll-wondrous', route: '/roll/wondrous_environments', primary: true },
  { id: 'roll-std-more', route: '/roll/std', open: ['.reshead .morewrap > button'] },
  { id: 'roll-std-setup', route: '/roll/std', open: ['text:Настроить|Set up'] },
  { id: 'roll-sup-menu', route: '/roll/std', open: ['text:Дополнения|Supplements'] },
  {
    id: 'roll-result-more',
    route: '/roll/std',
    open: ['.orgrid .morewrap > button, [data-primary] .morewrap > button']
  },
  { id: 'tables-eq-weapon', route: '/tables/eq_weapon', primary: true },
  { id: 'tables-two-filters', route: '/tables/eq_weapon/f_tier-1.range-melee', primary: true },
  { id: 'tables-core-item', route: '/tables/core_item' },
  { id: 'tables-picker', route: '/tables/eq_weapon', open: ['.pickrow button'] },
  { id: 'tables-filters', route: '/tables/eq_weapon', open: ['text:Фильтры|Filters'] },
  {
    id: 'tables-more',
    route: '/tables/eq_weapon',
    open: ['.pickrow .morewrap > button, .page-head .morewrap > button']
  },
  {
    id: 'tables-selecting',
    route: '/tables/core_item',
    open: ['text:Выбрать|Select', 'tick:0', 'tick:1']
  },
  { id: 'tables-grid', route: '/tables/core_item', open: ['text:Сетка|Grid'] },
  {
    id: 'tables-grid-selecting',
    route: '/tables/core_item',
    open: ['text:Сетка|Grid', 'text:Выбрать|Select', 'tick:0']
  },
  {
    id: 'dialog-more',
    route: '/tables/core_item',
    open: ['button.row-main', 'dialog[open] .morewrap > button']
  },
  { id: 'item', route: '/i/ci1', primary: true },
  { id: 'item-more', route: '/i/ci1', open: ['text:Ещё|More'] },
  { id: 'item-listmenu', route: '/i/ci1', open: ['text:В список|Add to list'] },
  { id: 'dialog', route: '/tables/core_item', open: ['button.row-main'] },
  { id: 'search', route: '/search' },
  { id: 'search-searched', route: '/search', type: 'меч', primary: true },
  { id: 'search-more', route: '/search', open: ['.morewrap > button'] },
  { id: 'lists-out', route: '/lists' },
  { id: 'account-out', route: '/account' },
  { id: 'print-out', route: '/p/set-twocards' },
  { id: 'homebrew-out', route: '/homebrew' }
];

function url(route, lang) {
  return BASE + (lang === 'en' ? '/en' + route : route);
}

async function press(page, how) {
  if (how.startsWith('text:')) {
    const names = how.slice(5).split('|');
    return page.evaluate((names) => {
      const els = [...document.querySelectorAll('button, a[href], [role=menuitem], summary')];
      const el = els.find((e) => {
        const r = e.getBoundingClientRect();
        const t = (e.textContent || '').replace(/\s+/g, ' ').trim();
        return (
          r.width > 0 && names.some((n) => t === n || t.startsWith(n + ' ') || t.startsWith(n))
        );
      });
      if (!el) return false;
      el.click();
      return true;
    }, names);
  }
  if (how.startsWith('tick:')) {
    const i = Number(how.slice(5));
    return page.evaluate((i) => {
      const boxes = [...document.querySelectorAll('input[type=checkbox]')].filter(
        (b) => !b.closest('.selbar, .selbarwrap, .selectionbar, [class*=selbar]')
      );
      const b = boxes[i];
      if (!b) return false;
      b.click();
      return true;
    }, i);
  }
  if (how.startsWith('row:')) {
    const i = Number(how.slice(4));
    return page.evaluate((i) => {
      const rows = [
        ...document.querySelectorAll(
          '.row-main a, .rows a.rname, .rows .rbody, .rows button.rbody'
        )
      ];
      const r = rows[i];
      if (!r) return false;
      r.click();
      return true;
    }, i);
  }
  return page.evaluate((sel) => {
    const el = [...document.querySelectorAll(sel)].find(
      (e) => e.getBoundingClientRect().width > 0
    );
    if (!el) return false;
    el.click();
    return true;
  }, how);
}

async function settle(page, ms = 350) {
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, ms));
}

/* Reads every visible pressable control: its box, its name, its kind. Inline links inside running text are tagged. */
function readControls() {
  const sel =
    'button, a[href], input:not([type=hidden]), select, textarea, summary, [role=menuitem], [role=menuitemradio], [role=menuitemcheckbox], [role=button], [role=tab], [role=option], [tabindex="0"]';
  const seen = new Set();
  const out = [];
  const vis = (e) => {
    const c = getComputedStyle(e);
    if (c.visibility === 'hidden' || c.display === 'none') return false;
    if (c.clipPath === 'inset(50%)' || (c.clip && c.clip !== 'auto')) return false;
    return true;
  };
  for (const e of document.querySelectorAll(sel)) {
    if (e.closest('[hidden], [inert], [aria-hidden=true]')) continue;
    if (e.closest('dialog:not([open])')) continue;
    let target = e;
    /* A visually hidden native box is pressed through its label. */
    if (e.matches('input[type=checkbox], input[type=radio]')) {
      const lab = e.closest('label');
      const r0 = e.getBoundingClientRect();
      if (lab) target = lab;
    }
    if (seen.has(target)) continue;
    seen.add(target);
    if (!vis(target)) continue;
    const r = target.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    let ancestorHidden = false;
    for (let p = target; p; p = p.parentElement) {
      const c = getComputedStyle(p);
      if (c.display === 'none' || c.visibility === 'hidden') ancestorHidden = true;
    }
    if (ancestorHidden) continue;
    const tag = target.tagName.toLowerCase();
    const cls =
      typeof target.className === 'string'
        ? target.className.split(/\s+/).filter((c) => c && !/^svelte-/.test(c))
        : [];
    const name = (
      target.getAttribute('aria-label') ||
      target.textContent ||
      target.getAttribute('placeholder') ||
      target.value ||
      ''
    )
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40);
    /* A link inside running text: inline, and its block holds 20 or more characters beyond the link. */
    let inline = false;
    if (tag === 'a') {
      const c = getComputedStyle(target);
      if (c.display === 'inline') {
        const block = target.parentElement;
        const t = (block?.textContent || '').replace(/\s+/g, ' ').trim();
        inline = t.length >= (target.textContent || '').trim().length + 20;
      }
    }
    const role = target.getAttribute('role') || '';
    const parentCls = (() => {
      const p = target.parentElement;
      return p && typeof p.className === 'string'
        ? p.className
            .split(/\s+/)
            .filter((c) => c && !/^svelte-/.test(c))
            .slice(0, 2)
            .join('.')
        : '';
    })();
    out.push({
      sel:
        tag +
        (cls.length ? '.' + cls.slice(0, 3).join('.') : '') +
        (role ? '[role=' + role + ']' : ''),
      parent: parentCls,
      name,
      w: Math.round(r.width * 10) / 10,
      h: Math.round(r.height * 10) / 10,
      top: Math.round(r.top + scrollY),
      inline,
      menu: /menuitem/.test(role)
    });
  }
  return out;
}

async function primaryTop(page) {
  return page.evaluate(async () => {
    window.scrollTo(0, 0);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const el = [...document.querySelectorAll('[data-primary]')].find(
      (e) => e.getBoundingClientRect().height > 0
    );
    return el ? Math.round(el.getBoundingClientRect().top * 10) / 10 : null;
  });
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const result = { inject: INJECT, base: BASE, at: new Date().toISOString(), states: [] };
  try {
    for (const width of widths) {
      for (const lang of ['ru', 'en']) {
        const page = await browser.newPage();
        await page.setViewport({ width, height: 640, deviceScaleFactor: 1 });
        for (const s of STATES.filter((x) => !ONLYIDS.length || ONLYIDS.includes(x.id))) {
          const rec = { id: s.id, width, lang, route: s.route };
          try {
            await page.goto(url(s.route, lang), { waitUntil: 'networkidle2', timeout: 45000 });
            if (INJECT) await page.addStyleTag({ content: THUMB_CSS });
            if (FOLD)
              await page.addStyleTag({
                content: fs.readFileSync(path.join(OUT, 'fold.css'), 'utf8')
              });
            await settle(page, 500);
            if (s.type) {
              await page.type('input[type=search]', s.type);
              await settle(page, 700);
            }
            if (s.primary) rec.primaryTop = await primaryTop(page);
            for (const how of s.open || []) {
              const ok = await press(page, how);
              if (!ok) rec.missed = (rec.missed || []).concat(how);
              await settle(page, 450);
            }
            rec.controls = await page.evaluate(readControls);
            rec.docH = await page.evaluate(() => document.documentElement.scrollHeight);
            rec.header = await page.evaluate(
              () =>
                Math.round(
                  (document.querySelector('.topbar')?.getBoundingClientRect().height || 0) * 10
                ) / 10
            );
            if (SHOTS && SHOT_IDS.includes(s.id) && width <= 390) {
              await page.evaluate(() => window.scrollTo(0, 0));
              await settle(page, 200);
              const f =
                s.id +
                '__' +
                width +
                '__' +
                lang +
                (INJECT ? (FOLD ? '__fold' : '__after') : '__before') +
                '.png';
              await page.screenshot({ path: path.join(OUT, 'shots', f) });
            }
          } catch (e) {
            rec.error = String(e.message || e).slice(0, 200);
          }
          result.states.push(rec);
          process.stdout.write('.');
        }
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  const file = path.join(
    OUT,
    'measure-' +
      (INJECT ? (FOLD ? 'fold' : 'after') : 'before') +
      (WIDTHS.length ? '-' + widths.join('-') : '') +
      '.json'
  );
  fs.writeFileSync(file, JSON.stringify(result, null, 1));
  console.log('\nwrote', file);
})();
