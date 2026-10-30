/* Mock P (task 57): the /p/ page today beside the proposed bar and the 360 preview,
 * against the pre-batch-1 build in C:\Users\Ignat\.dhloot\notes\57\p-build. The proposal
 * is a DOM rearrangement of the built page, for the picture and the First-Screen
 * numbers only. node mockp-page.cjs <out-dir>; prints one JSON line per render. */
const path = require('path');
const B = 'C:/Users/Ignat/.dhloot/notes/57/p-build';
const { fresh, closeBrowser, openPrint } = require(B + '/tests/app/lib.js');
const OUT = process.argv[2];

function propose(lang) {
  const bar = document.querySelector('.printbar');
  const h1 = bar.querySelector('h1');
  const acts =
    bar.querySelector('.card-acts, .acts, [class*="acts"]') ||
    h1.parentElement.nextElementSibling;
  const buttons = [...bar.querySelectorAll('button, a.btn')];
  const back = buttons.find((b) => /Назад|Back/.test(b.textContent));
  const link = buttons.find((b) => /Ссылка|Link/.test(b.textContent));
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:center;gap:12px;flex-wrap:nowrap';
  h1.parentNode.insertBefore(row, h1);
  row.appendChild(back);
  row.appendChild(h1);
  h1.style.margin = '0';
  if (link) {
    link.textContent = lang === 'en' ? 'More' : 'Ещё';
    link.parentElement.appendChild(link);
  }
  for (const n of bar.querySelectorAll('.printnote:not(.warnnote), .keepnote')) n.remove();
  if (acts) acts.style.rowGap = '8px';
  /* The switches say what they set: the size in mm, colour in a short word. */
  const SHORT =
    lang === 'en'
      ? { Colour: 'Colour', 'Black and white': 'B&W', Standard: '63×88', Compact: '44×63' }
      : { Цветная: 'Цвет', 'Чёрно-белая': 'Ч/б', Обычная: '63×88', Компактная: '44×63' };
  for (const b of bar.querySelectorAll('button')) {
    const t = b.textContent.trim();
    if (SHORT[t]) b.textContent = SHORT[t];
  }
  /* The sub (cards, sheets, size) moves under the sheets; each sheet gets its label. */
  const sub = bar.querySelector('.page-sub');
  const fitBox = document.querySelector('.pfit');
  if (sub) fitBox.after(sub);
  const sheetsAll = [...document.querySelectorAll('.psheet')];
  sheetsAll.forEach((s, i) => {
    const label = document.createElement('p');
    label.textContent =
      lang === 'en'
        ? `Sheet ${i + 1} of ${sheetsAll.length}`
        : `Лист ${i + 1} из ${sheetsAll.length}`;
    label.style.cssText = 'margin:0 0 6px;font-size:13px;color:#8a83a3';
    if (innerWidth >= 600) s.before(label);
    else s.dataset.label = label.textContent;
  });
  /* At 360 the print action and «Ещё» sit in a fixed bottom bar, as the item sheet's. */
  if (innerWidth < 600) {
    const printBtn = buttons.find((b) => /Отправить|Send to printer/.test(b.textContent));
    const fixed = document.createElement('div');
    fixed.style.cssText =
      'position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;gap:8px;padding:10px 16px;background:#14111d;border-top:1px solid #2a2440';
    fixed.appendChild(printBtn);
    if (link) fixed.appendChild(link);
    document.body.appendChild(fixed);
  }
  /* At 360: one card per row at the column width, the sheet label between sheets. */
  if (innerWidth < 600) {
    const fit = document.querySelector('.pfit');
    const inner = document.querySelector('.pfit-in');
    const col = fit.clientWidth;
    const cardPx = (63 * 96) / 25.4;
    const k = col / cardPx;
    const sheets = [...document.querySelectorAll('.psheet')];
    let n = 0;
    sheets.forEach((s, i) => {
      /* The first sheet needs no label at 360: «Лист 2 из 2» says the count. */
      if (i > 0) {
        const label = document.createElement('p');
        label.textContent = s.dataset.label;
        label.style.cssText = `margin:0 0 6px;font-size:${13 / k}px;color:#8a83a3`;
        s.before(label);
      }
      s.style.cssText =
        'width:63mm;height:auto;padding:0;grid-template-columns:63mm;grid-template-rows:none;grid-auto-rows:88mm;gap:2mm;box-shadow:none;background:none;margin:0 0 12px';
      for (const b of s.querySelectorAll('.pcard.blank')) b.remove();
      n += s.querySelectorAll('.pcard').length;
    });
    inner.style.cssText = `display:flow-root;width:63mm;transform:scale(${k});transform-origin:0 0`;
    fit.style.cssText = `height:${Math.ceil(inner.scrollHeight * k)}px`;
  }
}

(async () => {
  for (const variant of ['current', 'proposed']) {
    for (const lang of ['ru', 'en']) {
      for (const [w, h] of [
        [360, 640],
        [1180, 720]
      ]) {
        const { ctx, page, d } = await fresh({ width: w, height: h, lang });
        await openPrint(d, 'ci1-q1-q313-cc1-voa2_a3-q23-w51-q35-di11-cm26');
        if (variant === 'proposed') await page.evaluate(propose, lang);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.evaluate(
          () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        );
        const m = await page.evaluate(() => {
          const first = document.querySelector('.pcard[data-pid]');
          const sheet = document.querySelector('.psheet');
          return {
            sheetTop: Math.round(sheet.getBoundingClientRect().top),
            primaryTop: Math.round(first.getBoundingClientRect().top),
            cardWidth: Math.round(first.getBoundingClientRect().width),
            limit: Math.round(innerHeight * 0.4)
          };
        });
        console.log(JSON.stringify({ variant, lang, size: w + 'x' + h, ...m }));
        await page.screenshot({
          path: path.join(OUT, `page-${variant}__${w}x${h}__${lang}.png`)
        });
        await ctx.close();
      }
    }
  }
  await closeBrowser();
})().catch(async (e) => {
  console.error(e);
  await closeBrowser();
  process.exit(1);
});
