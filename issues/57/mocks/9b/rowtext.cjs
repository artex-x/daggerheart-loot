/* Read-only mock pass for batch 9b's Row Text Rule: the built dist-test/ with the proposed CSS
   injected, shot and measured. Writes PNGs and measure.json into issues/57/mocks/9b/.
   Run: node issues/57/mocks/9b/rowtext.cjs  (one browser, sequential; needs a built dist-test/).
   Per load it measures three variants of the rows: today (70ch, 2 lines), noCap (no text cap, 2 lines:
   option B alone) and proposed (no text cap, 3 lines from 1000 px: B with the owner's fallback, the rule
   this mock draws). The shot shows proposed. */
const fs = require('fs');
const T = 'E:/dev/daggerheart-loot/.claude/worktrees/57/tests/app/';
const OUT = 'E:/dev/daggerheart-loot/.claude/worktrees/57/issues/57/mocks/9b/';
const { fresh, closeBrowser } = require(T + 'lib.js');
const { STATES } = require(T + 'inventory.js');
const states = new Map(STATES.map((s) => [s.id, s]));

const B = `
.row-main .rt{max-width:none!important}
@media (min-width:761px){.searchrow .grow,.lfind .grow,.tools .grow{max-width:720px!important}}
.numbox{max-width:480px!important}
.chip.on:not(.neutral){display:inline-flex!important;align-items:center;gap:6px}
.chip.on:not(.neutral)::before{content:"";width:14px;height:14px;flex:none;background:currentColor;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z'/%3E%3C/svg%3E") center/contain no-repeat}
`;
const FALLBACK = `@media (min-width:1000px){.row-main:not(.full) .rt>span:not(.rh):not(.rstats){-webkit-line-clamp:3!important;line-clamp:3!important}}`;

/* [state id, file stem, sizes, langs, shoot] */
const W4 = [
  [1180, 720],
  [1440, 900],
  [1920, 1080],
  [2560, 1440]
];
const SHOTS = [
  ['#/search ~ searched', 'search', W4, ['ru', 'en'], true],
  ['#/tables/eq_weapon', 'eq-weapon', W4, ['ru', 'en'], true],
  ['#/tables/voa', 'voa', W4, ['ru', 'en'], false],
  ['#/tables/wondrous', 'wondrous', W4, ['ru', 'en'], false],
  ['#/tables/hnf_consumable', 'hnf-consumable', W4, ['ru', 'en'], false],
  [
    '#/search ~ capped',
    'capped',
    [
      [1180, 720],
      [1440, 900],
      [1920, 1080]
    ],
    ['ru', 'en'],
    false
  ],
  [
    '#/s/player-token-1',
    'shared',
    [
      [1180, 720],
      [1920, 1080]
    ],
    ['ru', 'en'],
    true
  ],
  ['#/tables/eq_weapon ~ two filters', 'eq-weapon-filters', [[1180, 720]], ['ru', 'en'], true]
];

async function measure(page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    for (let i = 0; i < 60 && document.querySelector('[data-drawing]'); i++)
      await new Promise((r) => setTimeout(r, 100));
    scrollTo(0, 0);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const prim = [...document.querySelectorAll('[data-primary]')].find(
      (e) => e.getBoundingClientRect().height > 0
    );
    const rows = [...document.querySelectorAll('.rows > .row')];
    const first = rows.find((r) =>
      r.querySelector('.row-main .rt > span:not(.rh):not(.rstats)')
    );
    let avg = 6.5;
    if (first) {
      const probe = document.createElement('span');
      const sample = first.querySelector('.row-main .rt > span:not(.rh):not(.rstats)');
      const cs = getComputedStyle(sample);
      probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${cs.font}`;
      probe.textContent =
        'Небольшой кошель с серебряными монетами и мелкими вещами внутри '.repeat(4);
      document.body.append(probe);
      avg = probe.getBoundingClientRect().width / probe.textContent.length;
      probe.remove();
    }
    let withDesc = 0;
    let clamped = 0;
    let partial = 0;
    let hOver = 0;
    let wrapBreak = 0;
    let maxCpl = 0;
    const empty = [];
    const widths = [];
    for (const r of rows) {
      const rr = r.getBoundingClientRect();
      const d = r.querySelector('.row-main .rt > span:not(.rh):not(.rstats)');
      const rt = r.querySelector('.row-main .rt');
      if (rt) {
        let right = 0;
        const walk = document.createTreeWalker(rt, NodeFilter.SHOW_TEXT);
        for (let n = walk.nextNode(); n; n = walk.nextNode()) {
          if (!n.textContent.trim()) continue;
          const rg = document.createRange();
          rg.selectNodeContents(n);
          for (const q of rg.getClientRects())
            if (q.width > 0 && q.right > right && q.top < rr.bottom) right = q.right;
        }
        if (right) empty.push((rr.right - 1 - right) / rr.width);
        widths.push(rr.width);
      }
      if (!d) continue;
      withDesc++;
      const cs = getComputedStyle(d);
      const lh = parseFloat(cs.lineHeight) || 1;
      if (d.scrollHeight > d.clientHeight + 1) {
        clamped++;
        const lines = d.clientHeight / lh;
        if (Math.abs(lines - Math.round(lines)) > 0.05) partial++;
      }
      if (d.scrollWidth > d.clientWidth + 1) hOver++;
      if (/anywhere|break-word/.test(cs.overflowWrap) || cs.wordBreak === 'break-all')
        wrapBreak++;
      maxCpl = Math.max(maxCpl, d.clientWidth / avg);
    }
    empty.sort((a, b) => a - b);
    const box = document.querySelector('main input[type=search]');
    const nb = document.querySelector('main .numbox');
    const med = (a) => (a.length ? a[Math.floor(a.length / 2)] : 0);
    return {
      primaryTop: prim ? Math.round(prim.getBoundingClientRect().top) : null,
      rows: rows.length,
      withDesc,
      clamped,
      clampShare: withDesc ? Math.round((1000 * clamped) / withDesc) / 10 : 0,
      emptyMedianPct: Math.round(med(empty) * 100),
      rowW: Math.round(med(widths)),
      maxCharsPerLine: Math.round(maxCpl),
      partialLines: partial,
      hOverflow: hOver,
      wordBreakRules: wrapBreak,
      rowsInScreen: rows.filter((r) => r.getBoundingClientRect().bottom <= innerHeight).length,
      searchBox: box ? Math.round(box.getBoundingClientRect().width) : null,
      stepper: nb ? Math.round(nb.getBoundingClientRect().width) : null
    };
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const all = [];
  const only = process.argv[2];
  for (const [id, name, sizes, langs, shoot] of SHOTS) {
    if (only && !name.startsWith(only)) continue;
    const state = states.get(id);
    if (!state) {
      console.log('NO STATE', id);
      continue;
    }
    for (const [width, height] of sizes) {
      for (const lang of langs) {
        const { ctx, page, d } = await fresh({ width, height, storage: state.storage });
        try {
          await d.open(state.route, {
            as: state.as,
            items: state.items,
            sections: state.sections,
            sources: state.sources,
            hold: state.hold
          });
          if (state.enter) await state.enter(d);
          await d.settled(state.id);
          if (lang === 'en') await d.click('EN');
          await d.addressSettled();
          const today = await measure(page);
          await page.addStyleTag({ content: B });
          const noCap = await measure(page);
          await page.addStyleTag({ content: FALLBACK });
          const proposed = await measure(page);
          let file = null;
          if (shoot) {
            file = `${name}__${width}__${lang}.png`;
            await page.screenshot({ path: OUT + file });
          }
          const rec = { state: id, width, height, lang, file, today, noCap, proposed };
          all.push(rec);
          console.log(
            [
              id,
              width,
              lang,
              'today',
              today.clamped + '/' + today.withDesc,
              today.clampShare + '%',
              'noCap',
              noCap.clamped + '/' + noCap.withDesc,
              noCap.clampShare + '%',
              'proposed',
              proposed.clampShare + '%',
              'empty',
              proposed.emptyMedianPct + '%',
              'cpl',
              proposed.maxCharsPerLine,
              'partial',
              proposed.partialLines,
              'hover',
              proposed.hOverflow,
              'wb',
              proposed.wordBreakRules
            ].join(' ')
          );
        } catch (e) {
          console.log('ERR', id, width, lang, String(e).slice(0, 200));
        } finally {
          await ctx.close();
        }
      }
    }
  }
  fs.writeFileSync(
    OUT + (only ? `measure-${only}.json` : 'measure-rowtext.json'),
    JSON.stringify(all, null, 1) + '\n'
  );
  await closeBrowser();
  process.exit(0);
})();
