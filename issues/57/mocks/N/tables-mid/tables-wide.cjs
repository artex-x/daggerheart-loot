/* Live-site probe (read-only; DOM moved): the /tables/* head from 1000 px in the Head Order Rule order. */
const puppeteer = require('E:/dev/daggerheart-loot/.claude/worktrees/57/node_modules/puppeteer');
const fs = require('fs');
const OUT = process.argv[2];
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const log = [];
  for (const lang of ['ru', 'en'])
    for (const w of [1000, 1050, 1100, 1180])
      for (const r of ['eq_weapon', 'wondrous', 'core_item']) {
        const page = await browser.newPage();
        await page.setViewport({ width: w, height: 720 });
        await page.evaluateOnNewDocument(
          (l) => localStorage.setItem('dhloot.lang.v1', l),
          lang
        );
        await page.goto('https://daggerheart-loot.pages.dev/#/tables/' + r, {
          waitUntil: 'networkidle0'
        });
        await page.waitForSelector('[data-primary]');
        const g = await page.evaluate(async () => {
          await document.fonts.ready;
          const head = document.querySelector('.page-head');
          const groups = head.querySelector('.groups');
          const pin = head.querySelector('.homebtn');
          const prim = () =>
            Math.round(
              [...document.querySelectorAll('[data-primary]')]
                .find((e) => e.getBoundingClientRect().height > 0)
                .getBoundingClientRect().top
            );
          const today = prim();
          head.insertBefore(groups, pin);
          groups.style.flex = '0 1 auto';
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          const R = (e) => e.getBoundingClientRect();
          const chips = [...groups.querySelectorAll('.chip')];
          return {
            today,
            first: prim(),
            groupsLeft: Math.round(R(groups).left),
            chipLines: new Set(chips.map((c) => Math.round(R(c).top))).size,
            pinTop: Math.round(R(pin).top),
            pinLeft: Math.round(R(pin).left),
            headH: Math.round(R(head).height)
          };
        });
        if (r === 'eq_weapon' && lang === 'ru' && (w === 1000 || w === 1180))
          await page.screenshot({
            path: OUT + `tables-eq-weapon__${w}__ru__order.png`,
            clip: { x: 0, y: 0, width: w, height: 420 }
          });
        log.push({ lang, w, r, ...g });
        console.log(lang, w, r, JSON.stringify(g));
        await page.close();
      }
  await browser.close();
  fs.writeFileSync(OUT + 'tables-wide.json', JSON.stringify(log, null, 1) + '\n');
})();
