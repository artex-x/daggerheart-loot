/* Planner probe 5: D133 - the /s/ bar with «Скопировать текст» and «Сообщить владельцу» folded
   into one «Ещё», and «В список», «Печать», «Ещё» on one row, at 360x640 and 320x568. */
const path = require('path');
const fs = require('fs');
const WT = 'E:/dev/daggerheart-loot/.claude/worktrees/57-debt';
const puppeteer = require('E:/dev/daggerheart-loot/node_modules/puppeteer');
const { makeDriver, prepare } = require(WT + '/tests/app/driver.js');
const { serveDist } = require(WT + '/tests/app/serve.js');
const OUT = __dirname;
const out = {};

async function main() {
  const server = await serveDist(path.join(WT, 'dist-test'));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-gpu'],
    protocolTimeout: 300000
  });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (const lang of ['ru', 'en']) {
    for (const [w, h] of [
      [360, 640],
      [320, 568]
    ]) {
      const name = `D133 ${lang} ${w}x${h}`;
      try {
        const ctx = await browser.createBrowserContext();
        const page = await ctx.newPage();
        await prepare(page);
        await page.evaluateOnNewDocument((l) => {
          try {
            localStorage.setItem('dhloot.lang.v1', l);
          } catch (e) {
            void e;
          }
        }, lang);
        await page.setViewport({ width: w, height: h });
        const d = makeDriver(page, 'next', base);
        await d.open('#/s/player-token-1');
        await d.settled();
        await page.evaluate((l) => {
          const want = l === 'ru' ? 'Выбрать' : 'Select';
          [...document.querySelectorAll('button')]
            .find((x) => x.textContent.trim() === want)
            ?.click();
        }, lang);
        await wait(400);
        /* Tick the first row so the bar is in its enabled state. */
        await page.evaluate(() =>
          document.querySelector('main input[type="checkbox"]:not(.selall input)')?.click()
        );
        await wait(300);
        const r = await page.evaluate((l) => {
          const s = document.querySelector('.selbar');
          const before = s.getBoundingClientRect().height;
          const words =
            l === 'ru'
              ? ['Скопировать текст', 'Сообщить владельцу']
              : ['Copy text', 'Notify the owner'];
          const hide = [...s.querySelectorAll('button')].filter((b) =>
            words.some((wd) => b.textContent.includes(wd))
          );
          const notify = s.querySelector('.notify');
          if (notify) notify.style.display = 'none';
          for (const b of hide) b.style.display = 'none';
          const print = [...s.querySelectorAll('button')].find((b) =>
            b.textContent.includes(l === 'ru' ? 'Печать' : 'Print')
          );
          const more = print.cloneNode(false);
          more.textContent = l === 'ru' ? 'Ещё' : 'More';
          more.style.display = '';
          print.after(more);
          /* «В список» stops taking the whole row. */
          for (const el of s.querySelectorAll('*')) {
            if (
              el.getBoundingClientRect().width >= innerWidth - 60 &&
              el.querySelector('button') &&
              el.contains(s.querySelector('.seldrop'))
            )
              continue;
          }
          const drop = s.querySelector('.seldrop');
          if (drop) {
            drop.style.flex = '0 1 auto';
            drop.style.width = 'auto';
          }
          const dbtn = drop?.querySelector(':scope > .btn');
          if (dbtn) dbtn.style.width = 'auto';
          const rows = [...s.querySelectorAll('button')]
            .filter((b) => b.getBoundingClientRect().width > 0)
            .map((b) => ({
              t: b.textContent.trim().replace(/\s+/g, ' '),
              top: Math.round(b.getBoundingClientRect().top),
              w: Math.round(b.getBoundingClientRect().width)
            }));
          return {
            before,
            after: s.getBoundingClientRect().height,
            rows,
            scrollW: document.documentElement.scrollWidth
          };
        }, lang);
        await page.screenshot({ path: path.join(OUT, `d133b-${lang}-${w}.png`) });
        out[name] = r;
        await ctx.close();
      } catch (e) {
        out[name] = { error: String((e && e.message) || e) };
      }
      console.log(name, JSON.stringify(out[name]));
    }
  }
  fs.writeFileSync(path.join(OUT, 'probe5.json'), JSON.stringify(out, null, 2));
  await browser.close();
  server.closeAllConnections();
  server.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
