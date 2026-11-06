/* Live-site mock (read-only; DOM moved, CSS injected): the lit roll pill as the shipped gold fill
   or the Toggle look (gold label, 45% gold border, no fill), in the Head Order Rule order, 1180x720. */
const puppeteer = require('E:/dev/daggerheart-loot/.claude/worktrees/57/node_modules/puppeteer');
const OUT = process.argv[2];
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  for (const r of ['alt', 'mwt'])
    for (const v of ['fill', 'toggle']) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1180, height: 720 });
      await page.evaluateOnNewDocument(() => localStorage.setItem('dhloot.lang.v1', 'ru'));
      await page.goto('https://daggerheart-loot.pages.dev/#/roll/' + r, {
        waitUntil: 'networkidle0'
      });
      await page.waitForSelector('[data-primary]');
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      await new Promise((res) => setTimeout(res, 500));
      await page.evaluate((v) => {
        const nav = document.querySelector('nav.modes');
        const head = document.querySelector('.page-head');
        const h1 = head.querySelector('h1');
        h1.textContent = 'Бросок';
        nav.querySelector('.modes-in').style.cssText =
          'width:auto;padding:0;margin:0;display:flex;gap:8px;align-items:center';
        nav.style.border = '0';
        h1.after(nav);
        if (v === 'toggle') {
          const s = document.createElement('style');
          s.textContent =
            '.mode.on{background:transparent!important;border-color:color-mix(in srgb,var(--gold) 45%,transparent)!important;color:var(--gold-soft)!important}';
          document.head.append(s);
        }
      }, v);
      await new Promise((res) => setTimeout(res, 100));
      const okMove = await page.evaluate(
        () =>
          document.querySelector('.page-head h1')?.textContent === 'Бросок' &&
          !!document.querySelector('.page-head nav.modes')
      );
      console.log(r, v, okMove);
      await page.screenshot({
        path: OUT + `roll-${r}__1180__ru__lit-${v}.png`,
        clip: { x: 0, y: 0, width: 1180, height: 460 },
        captureBeyondViewport: false
      });
      await page.close();
    }
  await browser.close();
})();
