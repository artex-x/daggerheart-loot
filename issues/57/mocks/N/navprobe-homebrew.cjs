/* Read-only probe (batch N mock: DOM moves on the built dist-test/; run from the repo root): where the sibling navigation sits on roll pages and table pages, and the first-screen
   offset under two moves (DOM moves on the built dist-test/; not built code). */
const T = 'E:/dev/daggerheart-loot/.claude/worktrees/57/tests/app/';
const OUT = 'E:/dev/daggerheart-loot/.claude/worktrees/57/issues/57/mocks/N/';
const fs = require('fs');
const { fresh, closeBrowser } = require(T + 'lib.js');
const { STATES } = require(T + 'inventory.js');
const states = new Map(STATES.map((s) => [s.id, s]));

const ROWS = [
  [
    '#/homebrew as gm3',
    [
      [1180, 720],
      [1000, 720],
      [768, 1024],
      [360, 640]
    ]
  ]
];

async function geo(page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    scrollTo(0, 0);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const top = (el) => (el ? Math.round(el.getBoundingClientRect().top) : null);
    const h = (el) => (el ? Math.round(el.getBoundingClientRect().height) : null);
    const prim = [...document.querySelectorAll('[data-primary]')].find(
      (e) => e.getBoundingClientRect().height > 0
    );
    const modes = document.querySelector('nav.modes');
    const head = document.querySelector('.page-head');
    const h1 = document.querySelector('main h1, h1.page-h');
    const hb = document.querySelector('.hbtabs');
    const groups = document.querySelector('.tablenav .groups');
    return {
      primaryTop: top(prim),
      headerBottom: Math.round(
        document.querySelector('header.top')?.getBoundingClientRect().bottom ?? 0
      ),
      modesTop: top(modes),
      modesH: h(modes),
      headTop: top(head),
      headH: h(head),
      h1Top: top(h1),
      h1Visible: h1
        ? h1.getBoundingClientRect().width > 2 && h1.getBoundingClientRect().height > 2
        : null,
      hbTop: top(hb),
      hbH: h(hb),
      groupsTop: top(groups),
      groupsH: h(groups)
    };
  });
}

(async () => {
  const all = [];
  for (const [id, sizes] of ROWS) {
    const state = states.get(id);
    if (!state) {
      console.log('NO STATE', id);
      continue;
    }
    for (const [width, height] of sizes) {
      for (const lang of ['ru', 'en']) {
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
          const today = await geo(page);
          let moved = null;
          if (id.startsWith('#/homebrew') && width >= 761) {
            await page.evaluate(() => {
              const tabs = document.querySelector('.hbtabs');
              const head = document.querySelector('.page-head');
              if (!tabs || !head) return;
              const row = document.createElement('div');
              row.style.cssText = 'border-bottom:1px solid var(--line);margin:6px 0 10px';
              row.append(tabs);
              const sub = head.nextElementSibling;
              (sub && sub.classList.contains('page-sub') ? sub : head).after(row);
            });
            moved = await geo(page);
          }
          const rec = { id, width, height, lang, today, moved };
          all.push(rec);
          console.log(
            id,
            width,
            lang,
            'today',
            JSON.stringify(today),
            'moved',
            JSON.stringify(moved)
          );
          if (lang === 'ru' && moved && width === 1180)
            await page.screenshot({
              path: OUT + 'nav-hb' + id.replace(/[^a-z_]/g, '') + '__1180__ru.png'
            });
        } catch (e) {
          console.log('ERR', id, width, lang, String(e).slice(0, 200));
        } finally {
          await ctx.close();
        }
      }
    }
  }
  fs.writeFileSync(OUT + 'measure-nav-hb.json', JSON.stringify(all, null, 1) + '\n');
  await closeBrowser();
  process.exit(0);
})();
