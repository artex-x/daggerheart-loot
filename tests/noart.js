/* Entries without art. Two ways to get there: the record never had a picture
   (new items arriving before one is drawn), or the file failed to load. */
const puppeteer = require('puppeteer');
const { ready } = require('./lib.js');
const ROOT = 'file://' + require('path').join(__dirname, '..', 'index.html');

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL ' + m); } };

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  /* ---------- 1. a record with no picture at all ---------- */
  console.log('записи без картинки');
  const page = await browser.newPage();
  page.on('pageerror', e => { fail++; console.log('  FAIL страница упала: ' + e.message); });
  await page.setViewport({ width: 1000, height: 900 });
  await page.evaluateOnNewDocument(() => {
    window.isSecureContext = true;
    window.__shared = null;
    navigator.share = o => { window.__shared = o; return Promise.resolve(); };
    navigator.canShare = () => true;
  });
  await page.goto(ROOT + '#/roll/std', { waitUntil: 'domcontentloaded' });
  await ready(page);
  // strip the art the way a freshly added entry would arrive
  await page.evaluate(() => {
    window.LOOT.items.wondrous.find(x => x.id === 'w3').img = '';
  });
  await page.goto(ROOT + '#/i/w3', { waitUntil: 'domcontentloaded' });
  await ready(page);

  const src = await page.$eval('.card-media img', e => e.getAttribute('src'));
  ok(/_none\.webp$/.test(src), 'вместо заглушки подставлено: ' + src);
  ok(await page.$eval('.card-media img', e => e.classList.contains('noart')),
     'картинка-заглушка не помечена классом');
  ok(!(await page.$('.card [data-copy-img]')), 'кнопка «Картинка» осталась у предмета без картинки');
  ok(!!(await page.$('.card [data-copy-full]')), 'кнопка «Текст» пропала заодно');
  ok(!!(await page.$('.card [data-send]')), 'кнопка отправки пропала заодно');

  // sharing must fall straight through to text, not try to build a picture
  await page.click('[data-send]');
  await new Promise(r => setTimeout(r, 400));
  const shared = await page.evaluate(() => window.__shared);
  ok(shared !== null, 'отправка не сработала без картинки');
  ok(shared && !shared.files, 'без картинки в отправку всё равно вложили файл');
  ok(shared && /Эфироцвет/.test(shared.text || ''), 'в отправке нет текста предмета');

  // and the entry still behaves normally everywhere else
  await page.goto(ROOT + '#/tables/wondrous', { waitUntil: 'domcontentloaded' });
  await ready(page);
  const rowSrc = await page.evaluate(() => {
    const row = [...document.querySelectorAll('.row')].find(r => r.querySelector('[data-open="w3"]'));
    return row ? row.querySelector('img').getAttribute('src') : null;
  });
  ok(/_none\.webp$/.test(rowSrc || ''), 'в строке таблицы заглушка не подставилась: ' + rowSrc);
  await page.close();

  /* ---------- 2. the file is there in the data but fails to load ---------- */
  console.log('картинка не загрузилась');
  const p2 = await browser.newPage();
  p2.on('pageerror', e => { fail++; console.log('  FAIL страница упала: ' + e.message); });
  await p2.setViewport({ width: 1000, height: 900 });
  await p2.setRequestInterception(true);
  p2.on('request', req => {
    if (/\/img\/w3\.webp$/.test(req.url())) req.abort();
    else req.continue();
  });
  await p2.goto(ROOT + '#/i/w3', { waitUntil: 'domcontentloaded' });
  await ready(p2);

  const src2 = await p2.$eval('.card-media img', e => e.getAttribute('src'));
  ok(/_none\.webp$/.test(src2), 'сломанная картинка не подменилась заглушкой: ' + src2);
  ok(!(await p2.$('.card [data-copy-img]')),
     'кнопка «Картинка» осталась, хотя файл не загрузился');

  // the app remembers, so the button does not come back on the next render
  await p2.goto(ROOT + '#/tables/wondrous', { waitUntil: 'domcontentloaded' });
  await ready(p2);
  await p2.goto(ROOT + '#/i/w3', { waitUntil: 'domcontentloaded' });
  await ready(p2);
  ok(!(await p2.$('.card [data-copy-img]')),
     'после перерисовки кнопка «Картинка» вернулась');
  await p2.close();

  /* ---------- 3. everyone else keeps their picture ---------- */
  console.log('остальные не задеты');
  const p3 = await browser.newPage();
  await p3.setViewport({ width: 1000, height: 900 });
  await p3.goto(ROOT + '#/i/w1', { waitUntil: 'domcontentloaded' });
  await ready(p3);
  ok(/w1\.webp$/.test(await p3.$eval('.card-media img', e => e.getAttribute('src'))),
     'у обычного предмета подменилась картинка');
  ok(!!(await p3.$('.card [data-copy-img]')), 'у обычного предмета пропала кнопка «Картинка»');
  await p3.close();

  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\nбез картинки: все проверки прошли');
  process.exit(fail ? 1 : 0);
})();
