/* Planner probe 6: D129 - what sits above the first entry of /s/ at 360x640, RU and EN. */
const path = require('path');
const fs = require('fs');
const WT = 'E:/dev/daggerheart-loot/.claude/worktrees/57-debt';
const puppeteer = require('E:/dev/daggerheart-loot/node_modules/puppeteer');
const { makeDriver, prepare } = require(WT + '/tests/app/driver.js');
const { serveDist } = require(WT + '/tests/app/serve.js');
const out = {};

async function main() {
  const server = await serveDist(path.join(WT, 'dist-test'));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-gpu'],
    protocolTimeout: 300000
  });
  for (const lang of ['ru', 'en']) {
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
    await page.setViewport({ width: 360, height: 640 });
    const d = makeDriver(page, 'next', base);
    await d.open('#/s/player-token-1');
    await d.settled();
    await new Promise((r) => setTimeout(r, 400));
    out[lang] = await page.evaluate(() => {
      const first = document.querySelector('[data-primary]');
      const fr = first?.getBoundingClientRect();
      const blocks = [];
      const walk = (el, depth) => {
        for (const c of el.children) {
          const b = c.getBoundingClientRect();
          if (b.height === 0 || b.top >= (fr?.top ?? 9999)) continue;
          const cs = getComputedStyle(c);
          blocks.push({
            d: depth,
            tag:
              c.tagName.toLowerCase() +
              (c.className && typeof c.className === 'string'
                ? '.' + c.className.trim().split(/\s+/).slice(0, 2).join('.')
                : ''),
            top: Math.round(b.top),
            h: Math.round(b.height),
            mt: cs.marginTop,
            mb: cs.marginBottom,
            pt: cs.paddingTop,
            pb: cs.paddingBottom,
            gap: cs.rowGap,
            txt: c.textContent.trim().replace(/\s+/g, ' ').slice(0, 50)
          });
          if (depth < 3 && b.height > 20) walk(c, depth + 1);
        }
      };
      walk(document.querySelector('main'), 0);
      return {
        firstTop: fr && Math.round(fr.top * 10) / 10,
        header: Math.round(
          document.querySelector('header.topbar').getBoundingClientRect().bottom
        ),
        blocks
      };
    });
    console.log(lang, JSON.stringify(out[lang], null, 1));
    await ctx.close();
  }
  fs.writeFileSync(path.join(__dirname, 'probe6.json'), JSON.stringify(out, null, 2));
  await browser.close();
  server.closeAllConnections();
  server.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
