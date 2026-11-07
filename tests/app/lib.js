/* What every tests/app/ suite shares, and nothing else. driver.js, its
 * sibling in this directory, drives dist-test/ - the test build, whose cloud
 * is the fake one, signed in by `?as=<user>` (docs/specs/COVERAGE.md, "Test
 * layers") - in a real browser; this file adds
 * what only matters for that - a guard that it was actually built, a page
 * factory that seeds storage before the first paint, and an axe runner.
 *
 * These suites check the rewrite against itself, with real input: does it
 * draw every address, is every control named, does axe find anything, is the
 * typography on the agreed scale. */
const path = require('path');
const puppeteer = require('puppeteer');
const { makeDriver, prepare } = require('./driver.js');
const { assertBuilt, serveDist: serveDistAt } = require('./serve.js');

const ROOT = path.join(__dirname, '..', '..');
const DIST_TEST = path.join(ROOT, 'dist-test');

/* Every suite requires this file before it does anything else, so the guard
   belongs at the top: a missing or stale dist-test/ should say so once, in
   one sentence, rather than have every suite fail every address with a stack
   trace that is really just "the page never opened". serve.js says why both
   halves of it exist. */
assertBuilt(DIST_TEST, 'dist-test/');

/** The static server over dist-test/ (serve.js). tools/smoke-http.mjs serves
 *  dist/ through serve.js itself. */
function serveDist() {
  return serveDistAt(DIST_TEST);
}

/* One server per process, started by the first page. */
let serverPromise = null;
let base = null;
async function startServer() {
  if (!serverPromise) {
    serverPromise = serveDist().then((server) => {
      base = 'http://127.0.0.1:' + String(server.address().port) + '/';
      return server;
    });
  }
  return serverPromise;
}

/** The served dist-test/ root, `http://127.0.0.1:<port>/`. Valid once a page
 *  from `fresh()` or `sharedPage()` exists. */
function baseUrl() {
  if (!base)
    throw new Error('The dist-test/ server is not started. Open a page through fresh() first');
  return base;
}

let browserPromise = null;
function browser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      /* This tree is shared with peer sessions (CLAUDE.md, "Task and session
         protocol"): a shared tree plus a loaded host makes a CDP round trip
         exceed puppeteer's default, so a `protocolTimeout` failure under
         load is contention, not a defect. */
      protocolTimeout: 300_000
    });
  }
  return browserPromise;
}

/** Closes the one browser this process launched, if it launched one. Call
 *  once, at the end of a suite, before process.exit. */
async function closeBrowser() {
  if (serverPromise) {
    const server = await serverPromise;
    serverPromise = null;
    base = null;
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  if (!browserPromise) return;
  const b = await browserPromise;
  browserPromise = null;
  await b.close();
}

/**
 * A fresh context and driver against dist-test/, seeded before the first paint.
 *
 * A context rather than a bare page: two pages that share `browser.newPage()`
 * also share cookies and storage, and `tests/app/states.js`'s two-tabs case
 * needs two contexts that do not. Every other suite gets one context per
 * call and simply never opens a second.
 *
 * `prepare()` (driver.js) stubs reduced motion, the clipboard, and clears
 * localStorage, so every page opened here starts from the same known state.
 * `lang` and `storage` are seeded *after* prepare() clears storage and
 * *before* the first navigation, the same ordering `d.seed()` documents on
 * the driver.
 */
async function fresh({ width = 1180, height = 900, lang, storage } = {}) {
  await startServer();
  const b = await browser();
  const ctx = await b.createBrowserContext();
  const page = await ctx.newPage();
  await prepare(page);
  await page.evaluateOnNewDocument(
    (l, kv) => {
      try {
        if (l) localStorage.setItem('dhloot.lang.v1', l);
        if (kv) for (const k of Object.keys(kv)) localStorage.setItem(k, kv[k]);
      } catch (e) {
        void e;
      }
    },
    lang,
    storage
  );
  await page.setViewport({ width, height });
  const d = makeDriver(page, 'next');
  return { ctx, page, d };
}

/**
 * A page on the browser's own default context, not an isolated one -
 * `tests/app/states.js`'s two-tabs case needs two pages that genuinely
 * share `localStorage`, which `fresh()`'s own incognito-like context (one
 * per call, by design, so every other case never leaks into the next)
 * keeps apart. There is no `ctx` to close: close
 * the page itself when done, and leave the shared context to `closeBrowser()`.
 *
 * Order matters to the one caller of this: open the page that must observe
 * the `storage` event first, and the page that writes second, so the second
 * page's own `prepare()` clear (harmless before anything real is written)
 * does not race the first page's read of what it expects to see.
 */
async function sharedPage({ width = 1180, height = 900, lang, storage } = {}) {
  await startServer();
  const b = await browser();
  const page = await b.newPage();
  await prepare(page);
  await page.evaluateOnNewDocument(
    (l, kv) => {
      try {
        if (l) localStorage.setItem('dhloot.lang.v1', l);
        if (kv) for (const k of Object.keys(kv)) localStorage.setItem(k, kv[k]);
      } catch (e) {
        void e;
      }
    },
    lang,
    storage
  );
  await page.setViewport({ width, height });
  const d = makeDriver(page, 'next');
  return { page, d };
}

const AXE_PATH = require.resolve('axe-core/axe.min.js');

/**
 * Runs axe over the page as it stands, with `color-contrast` on - the one
 * rule `app/src/test/a11y.ts` cannot answer honestly in jsdom, and the whole
 * reason this suite exists rather than another vitest case.
 *
 * No per-call rule disabling: the lists pages once needed one for
 * `nested-interactive` (a dismiss button nested in a `<summary>`); paid off,
 * and the parameter that carried it had gone unused by
 * every caller - `app/src/test/a11y.ts`'s own comment already argues that a
 * parameter with no caller is a maintained shape for nothing, so this suite
 * does not keep one either. A future live-shared defect that needs one adds
 * it back with a caller, not ahead of one.
 *
 * Returns violations only - a suite reads `.length` for "found anything" and
 * the array itself to print what.
 */
async function axe(page) {
  await page.addScriptTag({ path: AXE_PATH });
  const rules = { 'color-contrast': { enabled: true } };
  return page.evaluate(async (r) => {
    const res = await window.axe.run(document, { rules: r });
    return res.violations;
  }, rules);
}

/**
 * One failure counter and one dedupe set, shared by every suite so the five
 * report the same way - lifted from tests/audit2.js rather than reinvented.
 * Each suite calls this once for its own tally; nothing here is shared
 * across suites, since `run-all.js` runs each in its own process.
 */
function reporter() {
  let fail = 0;
  const seen = new Set();
  return {
    ok(c, m) {
      if (!c && !seen.has(m)) {
        seen.add(m);
        fail++;
        console.log('  FAIL ' + m);
      }
    },
    get failed() {
      return fail;
    }
  };
}

/** The seeded print sets of `gm4` by name, as `app/src/ports/fake-cloud-seed.ts`
 *  (`PRINT_SETS`) holds them; a state that reloads opens one of these. */
const PRINT_SETS = {
  twoCards: 'set-twocards',
  counted: 'set-counted1',
  nine: 'set-ninecard',
  longText: 'set-longtext',
  ten: 'set-tencards',
  max: 'set-maxcards',
  dragonVault: 'set-dragonvt',
  voa4: 'set-voa4wrst',
  ownItems: 'set-ownitems',
  emberAxe: 'set-emberaxe',
  clipped: 'set-clipped1',
  longSource: 'set-longsrc1',
  missing: 'set-missing1',
  allGone: 'set-allgone1',
  expired: 'set-expired1'
};

/* The retired address's `id[*n]-id` spelling as print set entries; a repeated id keeps
   its first, as `create_print_set` requires. */
function printEntries(spec) {
  if (Array.isArray(spec)) return spec;
  const seen = new Set();
  const out = [];
  for (const token of spec.split('-')) {
    const [k, n] = token.split('*');
    if (!k || seen.has(k)) continue;
    seen.add(k);
    const q = Math.min(parseInt(n ?? '', 10) || 0, 99);
    out.push(q > 1 ? { k, q } : { k });
  }
  return out;
}

/**
 * Opens a print sheet at its `#/p/<id>`: signs in as `as`, makes the set through the
 * fake (`spec` is the retired address's spelling or an array of entries), goes to it
 * and waits until the page leaves «Загружаем...». `gm2` by default: it has no print
 * layout of its own, so a sheet starts in color on the standard sheet. A reload empties
 * the fake, so a case that reloads opens a seeded set (`PRINT_SETS`) instead.
 */
async function openPrint(d, spec, { as = 'gm2' } = {}) {
  await d.open('#/p/', { as });
  const made = await d.fake('prints.create', printEntries(spec));
  if (!made || !made.ok)
    throw new Error('openPrint: the fake refused the set: ' + JSON.stringify(made));
  await d.go('#/p/' + made.id);
  for (let i = 0; i < 200; i++) {
    if ((await d.count('.printbar, .page-sub')) > 0) return made.id;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('openPrint: #/p/' + made.id + ' never left its loading state');
}

/** The controls that `targets` lets pass under the floor, each with the reason a source
 *  gives (DESIGN.md, "The Phone-First Rule"). A new entry needs its reason. A checkbox or a
 *  radio inside a `label` is not exempt: the label is measured in its place. */
const TARGET_ALLOW = [
  {
    why: 'a link inside running text, a block of 20 more characters that ends as a sentence (WCAG 2.5.8, "Inline")',
    test: 'inline'
  },
  { why: 'the skip link: shown on keyboard focus only (WCAG 2.4.1)', test: 'a.skip' },
  {
    why: 'a link or the «и ещё N» fold of a craft or relation line: the line height of its label sets its size (WCAG 2.5.8, "Inline")',
    test: '.craft a, .craft p .btn.bare'
  },
  { why: 'a disabled control is not pressable', test: ':disabled, [aria-disabled="true"]' }
];

/**
 * Returns every visible pressable control under the floor that a hit test does not prove
 * (DESIGN.md, "The Phone-First Rule"): `{ sel, name, w, h }` each. A box at or over
 * `floor` (`menuFloor` for a menu item) passes; a smaller one is scrolled to the window's
 * center and passes when the 8 edge points of a floor-sized square on its center all land
 * on it or inside it, so padding and a `::after` target count. `spacing` (768 px and up)
 * also passes a target whose 24 px circle meets no other target's box and no other
 * undersized target's circle (WCAG 2.5.8). While a modal dialog is open only its controls
 * are read. The page is left at scroll 0.
 */
async function targets(page, { floor, menuFloor = floor, spacing = false }) {
  return page.evaluate(
    (FLOOR, MENU, SPACING, ALLOW) => {
      const SEL =
        'button, a[href], input:not([type=hidden]), select, textarea, summary, ' +
        '[role^=menuitem], [role=option], [role=tab], [tabindex="0"]';
      const modal = [...document.querySelectorAll('dialog[open]')].find((x) =>
        x.matches(':modal')
      );
      const root = modal ?? document;
      const hidden = (el) => {
        if (el.closest('[hidden], [inert], [aria-hidden="true"]')) return true;
        if (!el.checkVisibility({ visibilityProperty: true })) return true;
        for (let e = el; e; e = e.parentElement)
          if (getComputedStyle(e).clipPath === 'inset(50%)') return true;
        const r = el.getBoundingClientRect();
        return r.width < 1 || r.height < 1;
      };
      const inline = (el) => {
        if (el.tagName !== 'A' || getComputedStyle(el).display !== 'inline') return false;
        let block = el.parentElement;
        while (block && getComputedStyle(block).display.startsWith('inline'))
          block = block.parentElement;
        const text = (block?.textContent ?? '').trim();
        const around = text.length - (el.textContent ?? '').trim().length;
        /* Running text is a sentence: a path line or a link after a label is not. */
        return around >= 20 && /[.!?][»")]?$/.test(text);
      };
      const allowed = (el) =>
        ALLOW.some((a) => (a.test === 'inline' ? inline(el) : el.matches(a.test)));
      const seen = new Set();
      const all = [];
      for (const raw of root.querySelectorAll(SEL)) {
        let el = raw;
        if (
          el.matches('input[type=checkbox], input[type=radio]') &&
          el.closest('label') &&
          el.closest('label') !== el
        )
          el = el.closest('label');
        if (seen.has(el)) continue;
        seen.add(el);
        if (hidden(el)) continue;
        all.push(el);
      }
      const name = (el) =>
        (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '')
          .trim()
          .replace(/\s+/g, ' ')
          .slice(0, 40);
      const sel = (el) => {
        const own = (e) =>
          e.tagName.toLowerCase() +
          [...e.classList]
            .filter((c) => !/^svelte-/.test(c))
            .map((c) => '.' + c)
            .join('');
        return (el.parentElement ? own(el.parentElement) + ' > ' : '') + own(el);
      };
      const out = [];
      const small = [];
      for (const el of all) {
        if (allowed(el)) continue;
        const f = el.matches('[role^=menuitem]') ? MENU : FLOOR;
        const r = el.getBoundingClientRect();
        if (r.width >= f - 0.5 && r.height >= f - 0.5) continue;
        el.scrollIntoView({ block: 'center', inline: 'center' });
        const b = el.getBoundingClientRect();
        const cx = b.left + b.width / 2;
        const cy = b.top + b.height / 2;
        const h = f / 2 - 1;
        const pts = [
          [cx - h, cy - h],
          [cx, cy - h],
          [cx + h, cy - h],
          [cx + h, cy],
          [cx + h, cy + h],
          [cx, cy + h],
          [cx - h, cy + h],
          [cx - h, cy]
        ];
        const hit = pts.every(([x, y]) => {
          const at = document.elementFromPoint(x, y);
          return !!at && (at === el || el.contains(at));
        });
        if (hit) continue;
        small.push({ el, cx, cy, b });
      }
      for (const s of small) {
        if (SPACING) {
          /* The 24 px circle on its center against every other target's box and against
             every other undersized target's circle (centers 24 px apart), read in the same
             scroll position. */
          s.el.scrollIntoView({ block: 'center', inline: 'center' });
          const b = s.el.getBoundingClientRect();
          const cx = b.left + b.width / 2;
          const cy = b.top + b.height / 2;
          const clear = all.every((o) => {
            if (o === s.el || o.contains(s.el) || s.el.contains(o)) return true;
            const q = o.getBoundingClientRect();
            const dx = Math.max(q.left - cx, 0, cx - q.right);
            const dy = Math.max(q.top - cy, 0, cy - q.bottom);
            return dx * dx + dy * dy >= 144;
          });
          const apart = small.every((o) => {
            if (o === s || o.el.contains(s.el) || s.el.contains(o.el)) return true;
            const q = o.el.getBoundingClientRect();
            const dx = q.left + q.width / 2 - cx;
            const dy = q.top + q.height / 2 - cy;
            return dx * dx + dy * dy >= 576;
          });
          if (clear && apart) continue;
        }
        out.push({
          sel: sel(s.el),
          name: name(s.el),
          w: Math.round(s.b.width * 10) / 10,
          h: Math.round(s.b.height * 10) / 10
        });
      }
      scrollTo(0, 0);
      return out;
    },
    floor,
    menuFloor,
    spacing,
    TARGET_ALLOW
  );
}

module.exports = {
  targets,
  TARGET_ALLOW,
  baseUrl,
  fresh,
  sharedPage,
  closeBrowser,
  axe,
  reporter,
  PRINT_SETS,
  openPrint
};
