/* Shoots mocks/T/listcard.html at 360 px and prints each card's height and its «Ещё» box.
 *   node issues/57/mocks/T/shoot-card.cjs */
const path = require('node:path');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 360, height: 900, deviceScaleFactor: 2 });
    await page.goto('file://' + path.join(__dirname, 'listcard.html').replace(/\\/g, '/'), {
      waitUntil: 'load'
    });
    await page.evaluate(() => document.fonts.ready);
    const out = await page.evaluate(() =>
      [...document.querySelectorAll('.listcard')].map((c) => {
        const b = c.querySelector('.listcard-acts button').getBoundingClientRect();
        return {
          id: c.id,
          cardH: Math.round(c.getBoundingClientRect().height),
          more: [Math.round(b.width), Math.round(b.height)]
        };
      })
    );
    console.log(JSON.stringify(out));
    await page.screenshot({
      path: path.join(__dirname, 'shots', 'listcard__360__ru.png'),
      fullPage: true
    });
  } finally {
    await browser.close();
  }
})();
