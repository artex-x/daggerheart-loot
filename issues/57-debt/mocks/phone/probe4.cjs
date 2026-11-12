/* Planner probe 4: D126 - the record dialog's dock on a short wide window, now and with the
   picture capped at 45dvh (width follows the 4:3 ratio). */
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
  for (const [w, h] of [
    [600, 500],
    [760, 560],
    [700, 481],
    [360, 640],
    [390, 844],
    [740, 360]
  ]) {
    const name = `D126 ci1 ${w}x${h}`;
    try {
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      await prepare(page);
      await page.setViewport({ width: w, height: h });
      const d = makeDriver(page, 'next', base);
      await d.open('#/tables/core_item');
      await d.settled();
      await d.press('Первоклассный Спальный Мешок');
      for (let i = 0; i < 40 && !(await page.$('dialog[open] .cardpick')); i++) await wait(100);
      await wait(500);
      const read = () =>
        page.evaluate(() => {
          const dock = document.querySelector('dialog[open] .cardpick').getBoundingClientRect();
          const media = document
            .querySelector('dialog[open] .card-media')
            ?.getBoundingClientRect();
          const name = document
            .querySelector('dialog[open] .card-name')
            ?.getBoundingClientRect();
          const card = document.querySelector('dialog[open] .modal-card');
          return {
            win: innerHeight,
            dockTop: Math.round(dock.top),
            dockBottom: Math.round(dock.bottom),
            media: media && { w: Math.round(media.width), h: Math.round(media.height) },
            nameTop: name && Math.round(name.top),
            cardScrollH: card.scrollHeight,
            cardClientH: card.clientHeight
          };
        });
      const now = await read();
      await page.addStyleTag({
        content:
          '@media (max-width: 760px) { .modal-card .card.dossier .card-media { max-height: 45dvh; width: auto; max-width: 100%; justify-self: center; } }'
      });
      await wait(200);
      const proto = await read();
      await page.screenshot({ path: path.join(OUT, `d126-${w}x${h}-proto.png`) });
      out[name] = { now, proto };
      await ctx.close();
    } catch (e) {
      out[name] = { error: String((e && e.message) || e) };
    }
    console.log(name, JSON.stringify(out[name]));
  }
  fs.writeFileSync(path.join(OUT, 'probe4.json'), JSON.stringify(out, null, 2));
  await browser.close();
  server.closeAllConnections();
  server.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
