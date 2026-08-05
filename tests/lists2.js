/* The list page after the reordering rework: drag, type a position, the picker
   with many lists, the dismissable storage notice, equipment labels. */
const puppeteer = require('puppeteer');
const ROOT = 'file://' + require('path').join(__dirname, '..', 'index.html');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL ' + m); } };

(async () => {
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
  const page = await browser.newPage();
  page.on('pageerror', e => { fail++; console.log('  FAIL страница упала: ' + e.message); });
  await page.setViewport({ width: 1180, height: 1000 });
  await page.evaluateOnNewDocument(() => {
    window.isSecureContext = true; window.__clip = null;
    window.ClipboardItem = class { constructor(m){ this.map = m; } };
    Object.defineProperty(navigator, 'clipboard', {
      value: { write: i => { window.__clip = i[0].map; return Promise.resolve(); },
               writeText: s => { window.__clip = { 'text/plain': { text: async () => s } }; return Promise.resolve(); } } });
    const ids = ['ci1','ci2','ci3','ci4','ci5','q1','q313'];
    localStorage.setItem('dhloot.lists.v2', JSON.stringify(
      [{ id:'a', name:'Клад дракона', ids: ids, created: 1 }].concat(
        Array.from({ length: 11 }, (_, i) => ({ id:'x'+i, name:'Лавка №'+(i+1), ids:[], created: 10+i })))));
  });
  /* A hash-only move keeps the scroll position, and puppeteer then clicks a
     point that the sticky header covers — so every page starts at the top. */
  const go = async h => { await page.goto(ROOT + h, { waitUntil:'domcontentloaded' });
                          await new Promise(r => setTimeout(r, 550));
                          await page.evaluate(() => window.scrollTo(0, 0));
                          await new Promise(r => setTimeout(r, 80)); };
  const settle = () => new Promise(r => setTimeout(r, 260));
  const lists = () => page.evaluate(() => JSON.parse(localStorage.getItem('dhloot.lists.v2')));
  const order = async () => (await lists()).find(l => l.id === 'a').ids;
  const clip = k => page.evaluate(async x => window.__clip && window.__clip[x] ? await window.__clip[x].text() : '', k);

  /* ---------- ordering ---------- */
  console.log('порядок позиций');
  await go('#/lists/a');
  ok(!(await page.$('[data-move]')), 'кнопки «выше/ниже» ещё на месте');
  ok((await page.$$eval('[data-drag]', e => e.length)) === 7, 'нет ручек для перетаскивания');

  // typing a position moves the entry there in one go
  await page.evaluate(() => {
    const inp = document.querySelectorAll('[data-pos]')[0];
    inp.value = '6';
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await settle();
  ok((await order()).join() === 'ci2,ci3,ci4,ci5,q1,ci1,q313',
     'ввод позиции переставил не туда: ' + (await order()).join());

  // out-of-range input is refused, not clamped into a surprise move
  await page.evaluate(() => {
    const inp = document.querySelectorAll('[data-pos]')[0];
    inp.value = '99';
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await settle();
  ok((await order()).join() === 'ci2,ci3,ci4,ci5,q1,ci1,q313', 'номер вне диапазона что-то сдвинул');

  // dragging the first entry onto the third
  const dragged = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.lrow')];
    const grip = rows[0].querySelector('[data-drag]');
    const dt = new DataTransfer();
    grip.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    const box = rows[2].getBoundingClientRect();
    rows[2].dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt,
      clientY: box.top + box.height - 2 }));
    const marked = rows[2].className;
    rows[2].dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt,
      clientY: box.top + box.height - 2 }));
    return marked;
  });
  await settle();
  ok(/drop-after/.test(dragged), 'место вставки не подсвечено: ' + dragged);
  ok((await order()).join() === 'ci3,ci4,ci2,ci5,q1,ci1,q313',
     'перетаскивание переставило не туда: ' + (await order()).join());
  ok((await page.$$eval('.lrow.dragging', e => e.length)) === 0, 'строка осталась в состоянии перетаскивания');

  /* ---------- equipment inside a list ---------- */
  console.log('снаряжение в списке');
  const badges = await page.$$eval('.lrow .badge', e => e.map(x => x.textContent));
  ok(badges.indexOf('Основное оружие') >= 0 && badges.indexOf('Броня') >= 0,
     'в списке снаряжение подписано как предмет: ' + badges.join('|'));
  ok((await page.$$eval('.lrow .rstats', e => e.length)) === 2, 'в списке нет характеристик снаряжения');

  await page.click('[data-copy-listtext]'); await settle();
  const txt = await clip('text/plain');
  ok(/Палаш\nОсновное оружие · Ранг 1 · Физическое/.test(txt),
     'в копии списка у оружия нет характеристик:\n' + txt.slice(0, 400));
  ok(/Стеганый Доспех\nБроня · Ранг 1 · Пороги 5\/11 · Броня 3/.test(txt),
     'в копии списка у брони нет характеристик');

  /* ---------- the storage notice ---------- */
  console.log('предупреждение о хранении');
  // the same slot as on the index page: under the header, above the content
  const warnPos = await page.evaluate(() => {
    const w = document.querySelector('.warn');
    const note = document.querySelector('.lnote'), rows = document.querySelector('.lrows');
    if (!w || !note || !rows) return 'none';
    const before = n => !!(w.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING);
    return before(note) && before(rows) ? 'top' : 'elsewhere';
  });
  ok(warnPos === 'top', 'предупреждение стоит не под шапкой: ' + warnPos);
  const idxPos = await page.evaluate(async () => {
    location.hash = '#/lists';
    await new Promise(r => setTimeout(r, 300));
    const w = document.querySelector('.warn'), panel = document.querySelector('.panel');
    return w && panel && (w.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING) ? 'top' : 'elsewhere';
  });
  ok(idxPos === 'top', 'на странице списков предупреждение стоит иначе: ' + idxPos);
  await go('#/lists/a');
  ok(await page.$('.warn-x'), 'у предупреждения нет крестика');
  await page.click('.warn-x'); await settle();
  ok(!(await page.$('.warn')), 'крестик не убрал предупреждение');
  await go('#/lists');
  ok(!(await page.$('.warn')), 'предупреждение вернулось после перехода');
  await go('#/lists/a');
  ok(!(await page.$('.warn')), 'предупреждение вернулось после перезагрузки');

  /* ---------- creating and picking a list ---------- */
  console.log('создание и выбор списка');
  await go('#/lists');
  await page.type('#lname', 'Тайник');
  await page.click('[data-act="createList"]'); await settle();
  ok(await page.evaluate(() => location.hash.indexOf('/lists') >= 0 && location.hash.indexOf('/l/') < 0),
     'создание списка увело со страницы списков');
  ok((await lists()).some(l => l.name === 'Тайник'), 'список не создался');
  ok(/Тайник/.test(await page.$eval('#toast', e => e.textContent)), 'нет подтверждения о создании');

  await go('#/i/w3');
  await page.click('.cardpick [data-act="menu"]'); await settle();
  ok(await page.$('#pickq'), 'при 13 списках не появился поиск');
  ok(await page.$eval('.cardpick .dropmenu .chip', e => e.textContent.trim() === 'Тайник'),
     'новый список не первый в выборе');
  await page.type('#pickq', 'Лавка №7'); await settle();
  ok((await page.$$eval('.cardpick .dropmenu .chip:not(.ghost)', e => e.length)) === 1,
     'поиск по спискам не сузил выбор');
  await page.click('.cardpick .dropmenu [data-add-to]'); await settle();
  ok((await lists()).find(l => l.name === 'Лавка №7').ids.indexOf('w3') >= 0,
     'найденный поиском список не принял предмет');

  /* ---------- the pressed state of the button ---------- */
  // the previous block left the menu open on this very page, and going to the
  // same address again changes nothing — so start from somewhere else
  await go('#/tables/wondrous');
  await go('#/i/w3');
  const btn = () => page.$eval('.cardpick .btn', e => ({ cls: e.className, caret: !!e.querySelector('.caret') }));
  ok((await btn()).caret, 'на кнопке нет стрелки состояния');
  await page.click('.cardpick [data-act="menu"]'); await settle();
  const b2 = await btn();
  ok(/\bon\b/.test(b2.cls), 'нажатая кнопка не помечена: ' + b2.cls);
  ok(await page.$('.cardpick .dropmenu'), 'меню не открылось');
  const colour = await page.$eval('.cardpick .btn', e => getComputedStyle(e).color);
  ok(colour !== 'rgb(99, 194, 148)', 'нажатая кнопка снова бирюзовая на золотом');

  /* ---------- roll pages do not offer equipment ---------- */
  console.log('снаряжение не в бросках');
  await go('#/roll/std');
  const kinds = await page.$$eval('[data-act="kind"]', e => e.map(x => x.textContent));
  ok(kinds.length === 2 && kinds.indexOf('Снаряжение') < 0, 'на броске остался тип «Снаряжение»: ' + kinds);
  await go('#/search');
  const kinds2 = await page.$$eval('[data-act="kind"]', e => e.map(x => x.textContent));
  ok(kinds2.indexOf('Снаряжение') >= 0, 'в поиске пропал тип «Снаряжение»');

  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\nсписки: все проверки прошли');
  process.exit(fail ? 1 : 0);
})();
