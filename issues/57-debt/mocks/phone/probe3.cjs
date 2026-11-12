/* Planner probe 3: D132's popover case - «В список» in the record dialog with twelve lists
   (the search box shows), at 1000x720, 1180x720 and 1180x600. */
const path = require('path');
const fs = require('fs');
const WT = 'E:/dev/daggerheart-loot/.claude/worktrees/57-debt';
const puppeteer = require('E:/dev/daggerheart-loot/node_modules/puppeteer');
const { makeDriver, prepare } = require(WT + '/tests/app/driver.js');
const { serveDist } = require(WT + '/tests/app/serve.js');
const OUT = __dirname;
const out = {};
const TWELVE = [
  'Клад дракона',
  'Лавка в порту',
  'Храм Солнца',
  'Рынок',
  'Порт Ветров',
  'Логово',
  'Трофеи',
  'Кузнец',
  'Сессия 3',
  'Сессия 4',
  'Сундук мага',
  'Ёлочная ярмарка'
].map((name, i) => ({ n: 1 + i, name, ids: i === 0 ? ['ci1'] : [] }));

async function main() {
  const server = await serveDist(path.join(WT, 'dist-test'));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-gpu'],
    protocolTimeout: 300000
  });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (const [w, h] of [
    [1000, 720],
    [1180, 720],
    [1180, 600],
    [1920, 950]
  ]) {
    const name = `D132 popover 12 lists ${w}x${h}`;
    try {
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      await prepare(page);
      await page.setViewport({ width: w, height: h });
      const d = makeDriver(page, 'next', base);
      await d.open('#/tables/core_item', { as: 'gm4' });
      await d.settled();
      await d.accountLists(TWELVE);
      await d.press('Первоклассный Спальный Мешок');
      for (let i = 0; i < 40 && !(await page.$('dialog[open] .modal-card')); i++)
        await wait(100);
      await wait(500);
      await page.click('dialog[open] .seldrop > .btn');
      await wait(700);
      out[name] = await page.evaluate(() => {
        const card = document.querySelector('dialog[open] .modal-card');
        const cb = card.getBoundingClientRect();
        const m = document.querySelector('dialog[open] .dropmenu');
        const mb = m?.getBoundingClientRect();
        const field = m?.querySelector('input');
        const btn = document
          .querySelector('dialog[open] .seldrop > .btn')
          .getBoundingClientRect();
        return {
          scrollTop: card.scrollTop,
          card: { top: Math.round(cb.top), bottom: Math.round(cb.bottom) },
          btn: { top: Math.round(btn.top), bottom: Math.round(btn.bottom) },
          menu: mb
            ? {
                top: Math.round(mb.top),
                bottom: Math.round(mb.bottom),
                h: Math.round(mb.height),
                up: m.classList.contains('up'),
                cropTop: Math.max(0, Math.round(cb.top - mb.top))
              }
            : null,
          field: field ? Math.round(field.getBoundingClientRect().top) : null,
          win: innerHeight
        };
      });
      await page.screenshot({ path: path.join(OUT, `d132c-popover-${w}x${h}.png`) });
      await ctx.close();
    } catch (e) {
      out[name] = { error: String((e && e.message) || e) };
    }
    console.log(name, JSON.stringify(out[name]));
  }
  fs.writeFileSync(path.join(OUT, 'probe3.json'), JSON.stringify(out, null, 2));
  await browser.close();
  server.closeAllConnections();
  server.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
