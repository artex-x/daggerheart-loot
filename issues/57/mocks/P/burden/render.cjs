/* Batch P, step S1 (task 57): renders the four exported Figma hands beside today's
 * card/burden-*.svg, and checks each hands file against its raw Copy-as-SVG export
 * (the node's own vector with the «ХВАТ» label): the raw file is drawn in a 62x37
 * window, so the label below y 37 is cut, and the two renders must match pixel for pixel.
 *
 * node issues/57/mocks/P/burden/render.cjs [<worktree root>]
 * Writes issues/57/mocks/P/burden/sheet.png (12x scale, on white and on the dark art
 * well) and burden.json (per file: size, the pixel difference to the raw export, ink
 * share). Reads C:\Users\Ignat\.dhloot\notes\57\figma\ (outside the checkout). */
const fs = require('fs');
const path = require('path');
const ROOT = process.argv[2] || path.join(__dirname, '..', '..', '..', '..', '..');
const puppeteer = require(path.join(ROOT, 'node_modules', 'puppeteer'));
const FIG = 'C:/Users/Ignat/.dhloot/notes/57/figma/';
const OUT = __dirname;
const K = 12;

const PAIRS = [
  ['burden-1', 'colour'],
  ['burden-2', 'colour'],
  ['burden-1', 'bw'],
  ['burden-2', 'bw']
];
const uri = (file) => 'data:image/svg+xml;base64,' + fs.readFileSync(file).toString('base64');
const today = (name, paint) =>
  path.join(ROOT, 'card', name + (paint === 'bw' ? '-bw' : '') + '.svg');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1400, deviceScaleFactor: 1 });
  const rows = PAIRS.map(([name, paint]) => ({
    name,
    paint,
    hands: uri(FIG + name + '-' + paint + '-hands.svg'),
    raw: uri(FIG + name + '-' + paint + '.svg'),
    today: uri(today(name, paint))
  }));
  const html = `<!doctype html><html><body style="margin:0;font:14px sans-serif;background:#fff">
  <table style="border-collapse:collapse">${rows
    .map(
      (r, i) => `<tr><td style="padding:8px;width:160px">${r.name} ${r.paint}</td>
      ${['today', 'hands', 'raw']
        .map(
          (k) =>
            `<td style="padding:8px"><div style="font-size:12px">${k}${
              k === 'raw' ? ' (label cut at y 37)' : ''
            }</div>${['#fff', '#0a0810']
              .map(
                (bg) => `<div class="cell" data-row="${i}" data-k="${k}" data-bg="${bg}"
              style="display:inline-block;margin:4px;width:${62 * K}px;height:${37 * K}px;overflow:hidden;background:${bg}"><img src="${r[k]}" style="width:${62 * K}px;height:auto;display:block"></div>`
              )
              .join('')}</td>`
        )
        .join('')}</tr>`
    )
    .join('')}</table></body></html>`;
  await page.setContent(html);
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
  await page.screenshot({ path: path.join(OUT, 'sheet.png'), fullPage: true });

  /* One cell's pixels, by drawing its image onto a canvas at the cell's size. */
  const report = await page.evaluate((K) => {
    const pixels = (img, bg) => {
      const c = document.createElement('canvas');
      c.width = 62 * K;
      c.height = 37 * K;
      const g = c.getContext('2d');
      g.fillStyle = bg;
      g.fillRect(0, 0, c.width, c.height);
      const h = (img.naturalHeight / img.naturalWidth) * c.width;
      g.drawImage(img, 0, 0, c.width, h);
      return g.getImageData(0, 0, c.width, c.height).data;
    };
    const out = [];
    const cells = [...document.querySelectorAll('.cell[data-bg="#fff"]')];
    const rowsN = new Set(cells.map((c) => c.dataset.row)).size;
    for (let r = 0; r < rowsN; r++) {
      const get = (k) =>
        document.querySelector(`.cell[data-row="${r}"][data-k="${k}"][data-bg="#fff"] img`);
      const hands = pixels(get('hands'), '#fff');
      const raw = pixels(get('raw'), '#fff');
      const now = pixels(get('today'), '#fff');
      let diffRaw = 0;
      let diffToday = 0;
      let ink = 0;
      for (let i = 0; i < hands.length; i += 4) {
        const d = (a, b) =>
          Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
        if (d(hands, raw) > 24) diffRaw++;
        if (d(hands, now) > 24) diffToday++;
        if (hands[i] + hands[i + 1] + hands[i + 2] < 700) ink++;
      }
      const n = hands.length / 4;
      out.push({
        row: r,
        natural: [get('hands').naturalWidth, get('hands').naturalHeight],
        todayNatural: [get('today').naturalWidth, get('today').naturalHeight],
        diffToRawPct: Math.round((diffRaw / n) * 10000) / 100,
        diffToTodayPct: Math.round((diffToday / n) * 10000) / 100,
        inkPct: Math.round((ink / n) * 10000) / 100
      });
    }
    return out;
  }, K);
  const named = report.map((r) => ({ file: PAIRS[r.row].join('-'), ...r }));
  fs.writeFileSync(path.join(OUT, 'burden.json'), JSON.stringify(named, null, 2) + '\n');
  console.log(JSON.stringify(named, null, 2));
  await browser.close();
})();
