/* Draws two SVG files at 12x on white and counts the pixels whose channels differ by more
   than 8. node pixcmp.cjs a.svg b.svg [...pairs] */
const fs = require('fs');
const puppeteer = require('E:/dev/daggerheart-loot/.claude/worktrees/57/node_modules/puppeteer');
const { PNG } = require('E:/dev/daggerheart-loot/.claude/worktrees/57/node_modules/pngjs');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 744, height: 444 });
  const shot = async (f) => {
    const uri = 'data:image/svg+xml;base64,' + fs.readFileSync(f).toString('base64');
    await page.setContent(
      `<body style="margin:0;background:#fff"><img src="${uri}" style="display:block;width:744px;height:444px">`
    );
    await page.waitForFunction(() => document.images[0].complete);
    return PNG.sync.read(Buffer.from(await page.screenshot()));
  };
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 2) {
    const x = await shot(a[i]);
    const y = await shot(a[i + 1]);
    let d = 0,
      max = 0;
    for (let k = 0; k < x.data.length; k += 4) {
      const m = Math.max(...[0, 1, 2].map((c) => Math.abs(x.data[k + c] - y.data[k + c])));
      max = Math.max(max, m);
      if (m > 8) d++;
    }
    console.log(
      a[i].split(/[\\/]/).pop(),
      'differ',
      ((d / (744 * 444)) * 100).toFixed(3) + '%',
      'max',
      max
    );
  }
  await browser.close();
})();
