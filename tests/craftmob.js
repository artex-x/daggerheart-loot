/* Real-browser check: the craft block must not overflow on narrow phones. */
const puppeteer = require('puppeteer');
const { ready } = require('./lib.js');
const ROOT = 'file://' + require('path').join(__dirname, '..', 'index.html');
const WIDTHS = [320, 360, 390, 430, 768];
// longest RU names in the set, plus the plain-text target and a core recipe
const ROUTES = ['#/roll/community', '#/roll/std', '#/roll/alt', '#/i/w65', '#/i/w3', '#/i/ci19', '#/i/w2', '#/tables/wondrous'];

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  let fail = 0;
  const page = await browser.newPage();

  for (const width of WIDTHS) {
    await page.setViewport({ width, height: 800, deviceScaleFactor: 1 });
    for (const route of ROUTES) {
      await page.goto(ROOT + route, { waitUntil: 'domcontentloaded' });
      await ready(page);

      const bad = await page.evaluate(function (w) {
        const out = [];
        // horizontal scroll anywhere on the page
        if (document.documentElement.scrollWidth > w + 1) {
          out.push('page scrolls horizontally: ' + document.documentElement.scrollWidth + ' > ' + w);
        }
        document.querySelectorAll('.craft, .rcraft, .dicebar, .numrow').forEach(function (el) {
          const r = el.getBoundingClientRect();
          if (r.right > w + 1) out.push(el.className + ' spills past the right edge (' + Math.round(r.right) + ')');
          if (r.left < -1)     out.push(el.className + ' spills past the left edge');
          if (el.scrollWidth > el.clientWidth + 1) out.push(el.className + ' has clipped content');
          // the caption must stay legible, not collapse to a sliver
          if (r.height > 0 && r.width < 60) out.push(el.className + ' squeezed to ' + Math.round(r.width) + 'px');
        });
        // the link has to stay tappable
        document.querySelectorAll('.craft a').forEach(function (a) {
          const r = a.getBoundingClientRect();
          if (r.height < 12) out.push('craft link only ' + Math.round(r.height) + 'px tall');
        });
        return out;
      }, width);

      if (bad.length) {
        fail += bad.length;
        console.log('  FAIL ' + width + 'px ' + route);
        bad.forEach(b => console.log('        ' + b));
      }
    }
    console.log(width + 'px checked');
  }

  /* Подсветка от указателя закрыта `@media (hover:hover)`. На телефоне состояние
     `:hover` остаётся на карточке до следующего касания, и она выглядит
     выбранной - рамка у наведённой и у выбранной была одна и та же. Проверка
     статическая: безголовый браузер сам сообщает `hover: none`, и подтвердить
     обратную ветку в нём нечем. */
  {
    const css = require('fs').readFileSync(
      require('path').join(__dirname, '..', 'style.css'), 'utf8');
    ['.tile:hover', '.row:hover'].forEach(function (sel) {
      const at = css.indexOf(sel);
      const open = css.lastIndexOf('@media (hover:hover){', at);
      const close = css.indexOf('}', open + 21);
      const guarded = at > 0 && open > 0 && at < close;
      if (!guarded) { fail++; console.log('  FAIL ' + sel + ' не закрыт @media (hover:hover)'); }
    });
    /* И выбранная плитка отличается от наведённой не только рамкой */
    if (!/\.tilewrap\.sel \.tile\{[^}]*background:/.test(css)) {
      fail++; console.log('  FAIL у выбранной плитки нет своей заливки');
    }
    console.log('подсветка касанием проверена');
  }

  /* Полоса выделения: три кнопки в ряд на телефон не помещаются, и подпись
     самой длинной вылезала за свою кнопку - слева от неё оставался обрезок.
     Проверяются те же ширины, что и у всего остального. */
  for (const width of [320, 360, 390]) {
    await page.setViewport({ width, height: 840 });
    await page.goto(ROOT + '#/tables/core_item', { waitUntil: 'domcontentloaded' });
    await ready(page);
    await page.click('.rows .row .selbox input');
    await new Promise(r => setTimeout(r, 300));
    const spill = await page.evaluate(function (w) {
      const out = [];
      document.querySelectorAll('#selBar .btn').forEach(function (b) {
        const r = b.getBoundingClientRect();
        if (b.scrollWidth > b.clientWidth + 1) out.push(b.textContent.trim() + ': подпись обрезана');
        if (r.left < -1 || r.right > w + 1) out.push(b.textContent.trim() + ': кнопка за краем экрана');
      });
      return out;
    }, width);
    if (spill.length) {
      fail += spill.length;
      console.log('  FAIL ' + width + 'px полоса выделения');
      spill.forEach(b => console.log('        ' + b));
    }
  }
  console.log('полоса выделения проверена');

  // and the standalone share stub, which has its own stylesheet
  for (const width of [320, 390]) {
    await page.setViewport({ width, height: 800 });
    await page.goto('file://' + require('path').join(__dirname, '..', 'i', 'w3.html'),
                    { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 80));
    const over = await page.evaluate(w => document.documentElement.scrollWidth > w + 1, width);
    if (over) { fail++; console.log('  FAIL stub i/w3.html scrolls horizontally at ' + width + 'px'); }
  }
  console.log('share stub checked');

  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\nno overflow at any width');
  process.exit(fail ? 1 : 0);
})();
