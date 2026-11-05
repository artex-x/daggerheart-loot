/* Read-only probe (batch N mock, run from the repo root): option A with a VISIBLE h1 on the roll pages.
   The mode row moves into `.page-head` after the pin and the help; the h1 reads the job name
   ("Бросок" / "Roll", `jobRoll`) instead of the lit mode's name. DOM moves on the built dist-test/; not built code. */
const T = 'E:/dev/daggerheart-loot/.claude/worktrees/57/tests/app/';
const OUT = 'E:/dev/daggerheart-loot/.claude/worktrees/57/issues/57/mocks/N/';
const fs = require('fs');
const { fresh, closeBrowser } = require(T + 'lib.js');
const { STATES } = require(T + 'inventory.js');
const states = new Map(STATES.map((s) => [s.id, s]));

const IDS = ['#/roll/std', '#/roll/alt', '#/roll/mwt', '#/roll/wondrous', '#/roll/voa'];
const SIZES = process.argv[2] ? [[Number(process.argv[2]), Number(process.argv[3])]] : [[1180, 720], [1000, 720], [768, 1024], [360, 640]];
const SHOTS = new Set(['#/roll/std|1180|ru', '#/roll/alt|1180|ru', '#/roll/mwt|1180|ru', '#/roll/alt|768|ru']);

async function geo(page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    scrollTo(0, 0);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const r = (el) => (el ? el.getBoundingClientRect() : null);
    const prim = [...document.querySelectorAll('[data-primary]')].find((e) => e.getBoundingClientRect().height > 0);
    const head = document.querySelector('.page-head');
    const h1 = document.querySelector('main h1');
    const pills = [...document.querySelectorAll('.page-head .mode, nav.modes .mode')];
    const tops = new Set(pills.map((p) => Math.round(p.getBoundingClientRect().top)));
    const btns = [...document.querySelectorAll('.page-head > *')].map((e) => Math.round(e.getBoundingClientRect().top));
    const last = pills.length ? Math.round(pills[pills.length - 1].getBoundingClientRect().right) : null;
    return {
      primaryTop: prim ? Math.round(prim.getBoundingClientRect().top) : null,
      headH: head ? Math.round(r(head).height) : null,
      h1Text: h1 ? h1.textContent.trim() : null,
      h1Visible: h1 ? r(h1).width > 2 && r(h1).height > 2 : null,
      pillRows: tops.size,
      headRowTops: [...new Set(btns)].length,
      lastPillRight: last,
      scrollW: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
}

(async () => {
  const all = [];
  for (const id of IDS) {
    const state = states.get(id);
    if (!state) { console.log('NO STATE', id); continue; }
    for (const [width, height] of SIZES) {
      for (const lang of ['ru', 'en']) {
        const { ctx, page, d } = await fresh({ width, height, storage: state.storage });
        try {
          await d.open(state.route, { as: state.as, items: state.items, sections: state.sections, sources: state.sources, hold: state.hold });
          if (state.enter) await state.enter(d);
          await d.settled(state.id);
          if (lang === 'en') await d.click('EN');
          await d.addressSettled();
          const today = await geo(page);
          let moved = null;
          if (width >= 761) {
            await page.evaluate(([job, w]) => {
              const nav = document.querySelector('nav.modes');
              const head = document.querySelector('.page-head');
              if (!nav || !head) return;
              const inner = nav.querySelector('.modes-in');
              inner.style.cssText = 'width:auto;padding:0;margin:0;display:flex;gap:8px;align-items:center;flex:1 1 0;flex-wrap:wrap;min-width:0' + (w < 1000 ? ';flex-basis:100%;flex-grow:1;flex-shrink:0' : '');
              nav.style.cssText = 'border:0;display:contents';
              head.append(nav);
              const h1 = head.querySelector('h1');
              if (h1) h1.textContent = job;
            }, [lang === 'ru' ? 'Бросок' : 'Roll', width]);
            moved = await geo(page);
            if (SHOTS.has(`${id}|${width}|${lang}`)) await page.screenshot({ path: OUT + `${id.replace('#/roll/', 'roll-')}__${width}__${lang}__h1.png` });
          }
          all.push({ id, width, height, lang, today, moved });
          console.log(id, width, lang, 'today', today.primaryTop, 'headH', today.headH, '| moved', moved ? [moved.primaryTop, 'headH', moved.headH, 'pillRows', moved.pillRows, 'headRows', moved.headRowTops, 'h1', moved.h1Text, moved.h1Visible, 'lastRight', moved.lastPillRight, 'sw', moved.scrollW].join(' ') : '-');
        } catch (e) {
          console.log('ERR', id, width, lang, String(e).slice(0, 200));
        } finally {
          await ctx.close();
        }
      }
    }
  }
  fs.writeFileSync(OUT + (process.argv[2] ? 'measure-roll-h1-' + process.argv[2] + '.json' : 'measure-roll-h1.json'), JSON.stringify(all, null, 1) + '\n');
  await closeBrowser();
  process.exit(0);
})();
