/* Selection replaced three different ways of adding to a list, so the point of
   these checks is that the one remaining way behaves the same everywhere. */
const puppeteer = require('puppeteer');
const { ready } = require('./lib.js');
const ROOT = 'file://' + require('path').join(__dirname, '..', 'index.html');

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL ' + m); } };

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  page.on('pageerror', e => { fail++; console.log('  FAIL страница упала: ' + e.message); });
  await page.setViewport({ width: 1000, height: 900 });
  await page.evaluateOnNewDocument(() => {
    window.isSecureContext = true;
    window.__clip = null;
    window.ClipboardItem = class { constructor(m) { this.map = m; } };
    Object.defineProperty(navigator, 'clipboard', {
      value: { write: i => { window.__clip = i[0].map; return Promise.resolve(); } }
    });
    localStorage.setItem('dhloot.lists.v2', JSON.stringify([
      { id: 'a', name: 'Клад дракона', ids: [], created: 1 },
      { id: 'b', name: 'Лавка в порту', ids: [], created: 2 }]));
  });
  const go = async h => {
    await page.goto(ROOT + h, { waitUntil: 'domcontentloaded' });
    await ready(page);
  };
  const settle = () => new Promise(r => setTimeout(r, 250));
  const has = s => page.evaluate(x => !!document.querySelector(x), s);
  const lists = () => page.evaluate(() => JSON.parse(localStorage.getItem('dhloot.lists.v2')));
  const clip = () => page.evaluate(async () => window.__clip ? await window.__clip['text/plain'].text() : '');

  /* ---------- the old collect mode is gone for good ---------- */
  console.log('старый режим убран');
  await go('#/tables/core_item');
  ok(!(await has('[data-act="collect"]')), 'кнопка режима пополнения ещё жива');
  ok(!(await has('.row-add')), 'кнопка «+» в строке ещё жива');
  ok(await has('[data-sel]'), 'чекбоксов в строках нет');
  ok(await has('[data-sel-all]'), 'нет «выбрать все»');

  /* ---------- ticking, the bar, the cross ---------- */
  console.log('выделение и панель');
  ok(await page.evaluate(() => document.querySelector('#selBar').hidden), 'панель видна без выделения');
  const boxes = await page.$$('[data-sel]');
  await boxes[0].click(); await boxes[1].click();
  await settle();
  ok(!(await page.evaluate(() => document.querySelector('#selBar').hidden)), 'панель не появилась');
  ok(/2/.test(await page.$eval('.selcount', e => e.textContent)), 'счётчик не показывает 2');
  ok((await page.$$eval('.row.sel', e => e.length)) === 2, 'выбранные строки не подсвечены');
  // the bar hangs at the bottom of the window, not in the flow at the top
  const bottomGap = await page.evaluate(() =>
    Math.abs(document.querySelector('#selBar').getBoundingClientRect().bottom - window.innerHeight));
  ok(bottomGap <= 2, 'панель не прижата к низу окна: ' + bottomGap);

  /* ---------- batch add ---------- */
  console.log('пакетное добавление');
  await page.click('[data-act="menu"]');
  await settle();
  ok(await has('#selBar .dropmenu'), 'меню не открылось');
  ok((await page.$eval('#selBar .dropmenu .lbl', e => e.textContent)) === 'Добавить в',
     'у нескольких предметов заголовок меню не про добавление');
  // the chip has to be actually clickable, not buried under the sticky header
  const reachable = await page.evaluate(() => {
    const c = document.querySelector('#selBar .dropmenu [data-add-to]');
    const r = c.getBoundingClientRect();
    return c.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
  });
  ok(reachable, 'чип меню перекрыт другим элементом');
  // the picker puts the newest list first, so read the target off the chip
  const barTarget = await page.$eval('#selBar .dropmenu [data-add-to]', e => e.dataset.addTo.split('|')[0]);
  const barName = (await lists()).find(l => l.id === barTarget).name;
  await page.click('#selBar .dropmenu [data-add-to]');
  await settle();
  ok((await lists()).find(l => l.id === barTarget).ids.length === 2, 'в список попало не 2 позиции');
  ok((await page.$eval('#toast', e => e.textContent)).indexOf(barName) >= 0, 'нет тоста с именем списка');
  ok(!(await page.evaluate(() => document.querySelector('#selBar').hidden)),
     'выделение сбросилось после добавления — мешает добавить в два списка подряд');

  /* ---------- batch copy: a set, not alternatives ---------- */
  console.log('пакетное копирование');
  await page.click('[data-act="copySel"]');
  await settle();
  const txt = await clip();
  ok(!/ИЛИ/.test(txt), 'в пакетной копии появился разделитель ИЛИ');
  ok(txt.split('\n\n').length >= 4, 'скопировался не весь набор');

  /* ---------- the cross clears everything ---------- */
  await page.click('.selx');
  await settle();
  ok(await page.evaluate(() => document.querySelector('#selBar').hidden), 'крестик не снял выделение');
  ok((await page.$$eval('.row.sel', e => e.length)) === 0, 'подсветка строк осталась');

  /* ---------- select all follows the filter ---------- */
  console.log('выбрать все');
  await page.click('.selall');
  await settle();
  ok(/60/.test(await page.$eval('.selcount', e => e.textContent)), '«выбрать все» взяло не всю таблицу');
  await page.click('.selall');
  await settle();
  ok(await page.evaluate(() => document.querySelector('#selBar').hidden), 'повторный клик не снял всё');

  await go('#/search');
  await page.type('#sq', 'зелье');
  await settle();
  const found = await page.$$eval('.rows .row', e => e.length);
  await page.click('.selall');
  await settle();
  ok(new RegExp(String(found)).test(await page.$eval('.selcount', e => e.textContent)),
     'в поиске «выбрать все» взяло не найденное');

  /* ---------- selection belongs to the page ---------- */
  console.log('сброс при переходе');
  await go('#/tables/core_item');
  const b2 = await page.$$('[data-sel]');
  await b2[0].click();
  await settle();
  await page.evaluate(() => { location.hash = '#/tables/wondrous'; });
  await settle();
  ok(await page.evaluate(() => document.querySelector('#selBar').hidden),
     'выделение пережило переход между таблицами');

  /* ---------- the card uses the very same control ---------- */
  console.log('карточка');
  await go('#/i/w3');
  ok(await has('.cardpick [data-act="menu"]'), 'на карточке нет кнопки добавления');
  await page.click('.cardpick [data-act="menu"]');
  await settle();
  ok((await page.$eval('.cardpick .dropmenu .lbl', e => e.textContent)) === 'Лежит в списках',
     'у одного предмета заголовок меню не про членство');
  const cardTarget = await page.$eval('.cardpick .dropmenu [data-add-to]', e => e.dataset.addTo.split('|')[0]);
  await page.click('.cardpick .dropmenu [data-add-to]');
  await settle();
  ok((await lists()).find(l => l.id === cardTarget).ids.indexOf('w3') >= 0, 'с карточки предмет не добавился');
  // the menu stays open so the next list is one click away, not three
  ok(await has('.cardpick .dropmenu'), 'меню закрылось после добавления');
  ok(await has('.cardpick .dropmenu .chip.on'), 'членство не отмечено галочкой');
  // a second list takes the same item without reopening anything
  const second = await page.$$eval('.cardpick .dropmenu [data-add-to]',
    e => (e[1] || {}).dataset ? e[1].dataset.addTo : '');
  if (second) {
    await page.evaluate(() => document.querySelectorAll('.cardpick .dropmenu [data-add-to]')[1].click());
    await settle();
    ok((await lists()).find(l => l.id === second.split('|')[0]).ids.indexOf('w3') >= 0,
       'во второй список за один клик не добавилось');
  }
  // and the same chip takes it back out, still without closing
  await page.click('.cardpick .dropmenu .chip.on');
  await settle();
  ok(await has('.cardpick .dropmenu'), 'меню закрылось после удаления');
  ok((await lists()).find(l => l.id === cardTarget).ids.indexOf('w3') < 0, 'повторный клик не убрал из списка');
  ok(!(await page.$eval('.cardpick .dropmenu [data-add-to]', e => e.classList.contains('on'))),
     'галочка осталась после удаления');
  // clicking away is what dismisses it now
  await page.evaluate(() => document.querySelector('.page-h').click());
  await settle();
  ok(!(await has('.cardpick .dropmenu')), 'клик мимо не закрыл меню');

  /* ---------- the modal is a card too, and gets the same control ---------- */
  console.log('модалка');
  await go('#/tables/core_item');
  // a row that earlier sections have not already put into the list, otherwise
  // the chip acts as a toggle and takes the item back out
  const fresh = await page.evaluate(() => {
    const owned = [].concat(...JSON.parse(localStorage.getItem('dhloot.lists.v2')).map(l => l.ids));
    const el = [...document.querySelectorAll('[data-open]')].find(e => owned.indexOf(e.dataset.open) < 0);
    el.click();
    return el.dataset.open;
  });
  await settle();
  ok(await page.evaluate(() => !document.querySelector('#modal').hidden), 'модалка не открылась');
  ok(await has('#modal [data-act="menu"]'), 'в модалке нет кнопки добавления');
  // the modal lives outside #view, so it has to be redrawn along with the page
  await page.evaluate(() => document.querySelector('#modal [data-act="menu"]').click());
  await settle();
  ok(await has('#modal .dropmenu'), 'меню внутри модалки не открылось');
  ok(await page.evaluate(() => !document.querySelector('#modal').hidden),
     'модалка закрылась при открытии меню');
  const reach = await page.evaluate(() => {
    const c = document.querySelector('#modal .dropmenu [data-add-to]');
    const r = c.getBoundingClientRect();
    return c.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
  });
  ok(reach, 'чип меню в модалке нельзя нажать');
  const chip = await page.evaluate(() => document.querySelector('#modal .dropmenu [data-add-to]').dataset.addTo);
  const target = chip.split('|')[0];
  const idx = (await lists()).findIndex(l => l.id === target);
  const before = (await lists())[idx].ids.length;
  await page.evaluate(() => document.querySelector('#modal .dropmenu [data-add-to]').click());
  await settle();
  ok((await lists())[idx].ids.indexOf(fresh) >= 0,
     'из модалки предмет ' + fresh + ' не добавился: чип ' + chip + ', было ' + before);

  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\nвыделение: все проверки прошли');
  process.exit(fail ? 1 : 0);
})();
