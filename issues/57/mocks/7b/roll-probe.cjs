/* Evidence, not a gate: measures the roll results of `/roll/std`, `/roll/alt` and `/roll/voa` (batch 7b, T12).
   Read-only: GET requests and in-page reads. Usage, one run per call:
     node issues/57/mocks/7b/roll-probe.cjs --base=https://daggerheart-loot.pages.dev/ [--inject]
   `--base` is any served build (production, or the built app served from `dist-test/`). `--inject` adds the
   planner's CSS model of option B (R7) to the page, so the numbers before the edit predict the edit; after the
   edit, run it without `--inject` and compare. Prints one line per state, size and language. */
const puppeteer = require('E:/dev/daggerheart-loot/node_modules/puppeteer-core');

const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith('--' + k + '='));
  return hit ? hit.slice(k.length + 3) : d;
};
const BASE = arg('base', 'https://daggerheart-loot.pages.dev/');
const INJECT = process.argv.includes('--inject');
const CHROME = arg('chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe');

/* The model of R7: the row face is the base; the tall face only inside a `faces` container of 641 px or more,
   which a roll of at most two results provides. The script names the containers, as `OrGrid` and `RollPanel`
   will. */
const MODEL = `
.card.face{flex-direction:row!important;align-items:flex-start!important}
.card.face .card-media{z-index:auto!important;width:96px!important;aspect-ratio:1!important;margin:10px 0 10px 10px!important;border-radius:8px!important;mask-image:none!important}
.card.face .card-body{margin-top:0!important;padding:10px 12px!important;gap:4px!important}
.card.face .badge.num{display:none!important}
.results:not(:has(.orwrap)){grid-template-columns:minmax(0,1fr)!important}
@container faces (min-width:641px){
 .card.face{flex-direction:column!important;align-items:stretch!important}
 .card.face .card-media{z-index:-1!important;width:100%!important;aspect-ratio:4/3!important;margin:0!important;border-radius:0!important;mask-image:linear-gradient(180deg,#000 72%,transparent)!important}
 .card.face .card-body{margin-top:-26px!important;padding:0 14px 12px!important;gap:7px!important}
 .card.face .badge.num{display:inline-block!important}
 .dealt{max-width:380px}
}
@container (min-width:641px){.ordiv.h{padding:6px 0!important}}`;

const SIZES = [
  [1919, 980],
  [1440, 900],
  [1366, 768],
  [1280, 800],
  [1180, 720],
  [1000, 720],
  [900, 720],
  [761, 720],
  [700, 400],
  [673, 800],
  [672, 800],
  [601, 800],
  [360, 640]
];

/* Each state: the route and the presses that make it; `n` sets the first number field. */
const STATES = (lang) => {
  const cons = lang === 'en' ? 'Consumables' : 'Расходники';
  return [
    { id: 'std 4', route: 'roll/std', off: [] },
    { id: 'std 4 n=45', route: 'roll/std', off: [], n: 45 },
    { id: 'std 2', route: 'roll/std', off: ['Hope & Fear'] },
    { id: 'std 1', route: 'roll/std', off: ['Hope & Fear', cons] },
    { id: 'alt 4', route: 'roll/alt', off: [] },
    { id: 'alt crit', route: 'roll/alt', off: [], n: 2 },
    { id: 'voa 1', route: 'roll/voa', off: [] }
  ];
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  for (const lang of ['ru', 'en']) {
    for (const st of STATES(lang)) {
      for (const [w, h] of SIZES) {
        await page.setViewport({ width: w, height: h });
        await page.goto(BASE + (lang === 'en' ? 'en/' : '') + st.route, {
          waitUntil: 'networkidle0'
        });
        await page.evaluate(() => document.fonts.ready);
        const narrow = w <= 760;
        const setUp = async (open) =>
          page.evaluate((open) => {
            const b = [...document.querySelectorAll('.reshead button')].find((x) =>
              x.hasAttribute('aria-expanded')
            );
            if (b && (b.getAttribute('aria-expanded') === 'true') !== open) b.click();
          }, open);
        if (narrow && (st.off.length || st.n)) await setUp(true);
        await wait(150);
        for (const label of st.off) {
          await page.evaluate((label) => {
            [...document.querySelectorAll('button')]
              .find((x) => x.textContent.trim() === label)
              ?.click();
          }, label);
          await wait(120);
        }
        if (st.n) {
          await page.evaluate((n) => {
            const inp = document.querySelector('.rp-set input, #rp-set input');
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(
              inp,
              String(n)
            );
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
          }, st.n);
        }
        if (narrow) await setUp(false);
        if (INJECT) {
          await page.evaluate(() => {
            for (const wrap of document.querySelectorAll('.orwrap'))
              if (wrap.querySelectorAll('.dealt').length <= 2)
                wrap.style.containerName = 'faces';
            for (const res of document.querySelectorAll('.results'))
              if (!res.querySelector('.orwrap')) res.style.container = 'faces / inline-size';
          });
          await page.addStyleTag({ content: MODEL });
        }
        await wait(450);
        const m = await page.evaluate(() => {
          scrollTo(0, 0);
          const cards = [...document.querySelectorAll('.dealt')].map((d) => {
            const r = (s) => d.querySelector(s)?.getBoundingClientRect();
            const num = d.querySelector('.badge.num');
            return {
              name: Math.round(r('.card-name').bottom),
              acts: Math.round(r('.resacts').bottom),
              pic:
                Math.round(r('.card-media').width) + 'x' + Math.round(r('.card-media').height),
              w: Math.round(d.getBoundingClientRect().width),
              num: !!num && getComputedStyle(num).display !== 'none'
            };
          });
          const p = document.querySelector('[data-primary]')?.getBoundingClientRect();
          return { prim: p ? Math.round(p.top) : null, cards };
        });
        if (!m.cards.length) {
          console.log(`${lang} ${st.id} ${w}x${h}: no result drawn`);
          continue;
        }
        const lastName = Math.max(...m.cards.map((c) => c.name));
        const acts = m.cards.map((c) => c.acts);
        const lastActs = Math.max(...acts);
        const whole = acts.filter((a) => a <= h).length;
        console.log(
          `${lang} ${st.id} ${w}x${h}: n${m.cards.length} prim ${m.prim} card w${m.cards[0].w} pic ${m.cards[0].pic} num ${m.cards[0].num ? 'on' : 'off'} | last name ${lastName} | last acts ${lastActs} | whole ${whole}/${m.cards.length} | ${lastActs <= h ? 'ALL' : lastName <= h ? 'names' : 'OVER'}`
        );
      }
    }
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
