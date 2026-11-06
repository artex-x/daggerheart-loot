/* Counts the raster images in a PDF of one <img> of each given SVG file. */
const fs = require('fs');
const path = require('path');
const puppeteer = require('E:/dev/daggerheart-loot/.claude/worktrees/57/node_modules/puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  for (const f of process.argv.slice(2)) {
    const uri = 'data:image/svg+xml;base64,' + fs.readFileSync(f).toString('base64');
    await page.setContent(`<img src="${uri}" style="width:200px">`);
    await page.waitForFunction(() => document.images[0].complete);
    const pdf = Buffer.from(await page.pdf({ format: 'A4', printBackground: true }));
    const n = (pdf.toString('latin1').match(/\/Subtype\s*\/Image/g) || []).length;
    console.log(path.basename(f), n);
  }
  await browser.close();
})();
