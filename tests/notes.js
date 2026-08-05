/* GM notes on lists: storage, the link format, and what stays out of a copy.
   The link format is the delicate part — links people saved earlier must open
   exactly as they did before. */
const puppeteer = require('puppeteer');
const ROOT = 'file://' + require('path').join(__dirname, '..', 'index.html');

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL ' + m); } };
const b64 = s => Buffer.from(s, 'utf8').toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const REC = '\x1e', SEP = '\x1f';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 1000 });
  await page.evaluateOnNewDocument(() => {
    window.isSecureContext = true;
    window.__clip = null;
    window.ClipboardItem = class { constructor(m) { this.map = m; } };
    Object.defineProperty(navigator, 'clipboard', {
      value: { write: i => { window.__clip = i[0].map; return Promise.resolve(); } }
    });
    localStorage.setItem('dhloot.lists.v1', JSON.stringify(
      [{ id: 'a', name: 'Мой клад', ids: ['w3', 'w1'], created: 1 }]));
  });
  const go = async h => {
    await page.goto(ROOT + h, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 260));
  };
  const settle = () => new Promise(r => setTimeout(r, 260));
  /* puppeteer scrolls a target into view before clicking, and the sticky header
     then covers it — so these clicks are dispatched on the element itself */
  const tap = async sel => { await page.$eval(sel, e => e.click()); await settle(); };
  const txt = s => page.$eval(s, e => e.textContent.trim()).catch(() => null);
  const has = s => page.evaluate(x => !!document.querySelector(x), s);

  /* ---------- links saved before notes existed ---------- */
  console.log('старые ссылки');
  const OLD = [
    ['Клад\nw3,w1',             'голые id'],
    ['Клад\nw3*2,w1',           'с количеством'],
    ['Клад\nw3*2*150,w1*1*40',  'с количеством и золотом']
  ];
  for (const [raw, what] of OLD) {
    await go('#/l/' + b64(raw));
    ok(await has('[data-act="saveShared"]'), what + ': не открылась как чужой список');
    const rows = await page.$$eval('.rows .row', els => els.length);
    ok(rows === 2, what + ': позиций ' + rows + ' вместо 2');
    const h = await txt('.page-h');
    ok(h === 'Клад', what + ': имя «' + h + '»');
  }
  // the qty/gold that rode in the old payload must still be shown
  await go('#/l/' + b64('Клад\nw3*2*150,w1*1*40'));
  const tail = await page.$eval('.rows .row .rtail', e => e.textContent).catch(() => '');
  ok(/×2/.test(tail) && /150/.test(tail), 'количество и золото из старой ссылки потерялись: ' + tail);

  /* ---------- a list without notes encodes byte-for-byte as before ---------- */
  console.log('формат без заметок не изменился');
  await go('#/lists');
  await page.click('.listcard-main');
  await settle();
  const hash = await page.evaluate(() => location.hash);
  ok(hash === '#/l/' + b64('Мой клад\nw3,w1'),
     'список без заметок кодируется иначе, чем раньше:\n   ' + hash + '\n   ' + '#/l/' + b64('Мой клад\nw3,w1'));

  /* ---------- notes travel in the link ---------- */
  console.log('заметки в ссылке');
  await page.click('.lnote summary');          // складка закрыта, пока заметка пуста
  await settle();
  await page.type('.lnote textarea', 'Позиции под прилавком');
  await settle();
  const h2 = await page.evaluate(() => location.hash);
  ok(h2 !== hash, 'адрес не изменился после заметки списка');
  ok(h2 === '#/l/' + b64('Мой клад\nw3,w1\n' + REC + '~' + SEP + 'Позиции под прилавком'),
     'заметка списка закодирована не так, как ожидалось:\n   ' + h2);

  await page.click('.lrow .lrow-note');
  await settle();
  await page.type('.lrow .rnote textarea', 'Пахнет мятой');
  await settle();
  const h3 = await page.evaluate(() => location.hash);
  ok(h3 === '#/l/' + b64('Мой клад\nw3,w1\n' + REC + '~' + SEP + 'Позиции под прилавком' + REC + 'w3' + SEP + 'Пахнет мятой'),
     'заметка позиции закодирована не так, как ожидалось:\n   ' + h3);

  // …and come back out of it
  await go(h3);
  ok((await page.$eval('.lnote textarea', e => e.value)) === 'Позиции под прилавком',
     'заметка списка не восстановилась из ссылки');
  ok((await page.$eval('.lrow .rnote textarea', e => e.value)) === 'Пахнет мятой',
     'заметка позиции не восстановилась из ссылки');
  ok(await has('.lrow-note.on'), 'кнопка заметки не подсвечена, хотя заметка есть');
  ok(await has('.lnote[open]'), 'заметка списка свёрнута, хотя не пуста');

  // a note with newlines must survive: the format keeps them in the tail
  const multi = 'Чужой\nw3,w1\nпервая строка\nвторая строка' + REC + 'w3' + SEP + 'а\nб';
  await go('#/l/' + b64(multi));
  ok(await has('[data-act="saveShared"]'), 'многострочная заметка сломала разбор ссылки');
  const rows2 = await page.$$eval('.rows .row', els => els.length);
  ok(rows2 === 2, 'многострочная заметка съела позиции: ' + rows2);

  /* ---------- the roll surfaces the note for whatever came up ---------- */
  console.log('заметка на выпавшем');
  await go(h3);
  for (let i = 0; i < 12; i++) {
    await page.click('[data-act="rollList"]');
    await new Promise(r => setTimeout(r, 120));
    const rolled = await page.$eval('.panel .card .card-name', e => e.textContent.trim()).catch(() => '');
    const shown = await page.$eval('.hitnote', e => e.textContent).catch(() => null);
    if (/Эфироцвет/.test(rolled)) {                 // w3 — the one with a note
      ok(shown !== null && /Пахнет мятой/.test(shown), 'у выпавшего предмета не показана его заметка');
    } else if (rolled) {
      ok(shown === null, 'заметка показана у предмета, у которого её нет: ' + rolled);
    }
  }
  // and it must not leak into what gets copied from that card
  await page.evaluate(() => { window.__clip = null; });
  const cardCopy = await page.$('.panel .card [data-copy-full]');
  if (cardCopy) {
    await cardCopy.click();
    await settle();
    const c = await page.evaluate(async () => window.__clip ? await window.__clip['text/plain'].text() : '');
    ok(!/Пахнет мятой/.test(c), 'заметка уехала в копию карточки после броска');
  }

  /* ---------- by default notes stay with the GM ---------- */
  console.log('копирование без заметок');
  await go(h3);
  await page.click('[data-copy-listtext]');
  await settle();
  const copied = await page.evaluate(async () => await window.__clip['text/plain'].text());
  ok(!/под прилавком/.test(copied), 'заметка списка попала в скопированный текст');
  ok(!/Пахнет мятой/.test(copied), 'заметка позиции попала в скопированный текст');
  ok(/Эфироцвет/.test(copied), 'сам список из копии пропал');

  /* ---------- ticking the switch lets one note travel ---------- */
  console.log('галка «копировать вместе с предметом»');
  await tap('[data-note-show]');
  ok(await has('.rnote .noteshow.on'), 'галка не подсветилась');
  const h4 = await page.evaluate(() => location.hash);
  ok(h4 === '#/l/' + b64('Мой клад\nw3,w1\n' + REC + '~' + SEP + 'Позиции под прилавком' + REC + '+w3' + SEP + 'Пахнет мятой'),
     'флаг записан в ссылку не так, как ожидалось:\n   ' + h4);

  await page.click('[data-copy-listtext]');
  await settle();
  let c2 = await page.evaluate(async () => await window.__clip['text/plain'].text());
  ok(/Пахнет мятой/.test(c2), 'помеченная заметка не попала в текст');
  ok(!/под прилавком/.test(c2), 'непомеченная заметка списка всё равно попала в текст');
  // it must come last, after the description and the reference blocks
  const after = c2.slice(c2.indexOf('Эфироцвет'));
  const iCraft = after.indexOf('Улучшается до'), iNote = after.indexOf('Пахнет мятой');
  ok(iNote < 0 || iCraft < 0 || iNote > iCraft, 'заметка встала не в конец блока');

  // the flag survives a round trip through the link
  await go(h4);
  ok(await has('.rnote .noteshow.on'), 'флаг не восстановился из ссылки');
  ok((await page.$eval('.rnote textarea', e => e.value)) === 'Пахнет мятой', 'текст заметки потерялся');

  // and the list note can travel too, landing after the last item
  await tap('[data-list-note-show]');
  await page.click('[data-copy-listtext]');
  await settle();
  c2 = await page.evaluate(async () => await window.__clip['text/plain'].text());
  ok(/под прилавком/.test(c2), 'помеченная заметка списка не попала в текст');
  // она про список целиком, поэтому идёт преамбулой сразу за названием
  const head = c2.slice(0, c2.indexOf('Эфироцвет') >= 0 ? c2.indexOf('Эфироцвет') : 400);
  ok(/под прилавком/.test(head), 'заметка списка встала не сразу под названием:\n' + head);

  /* ---------- the rolled card carries a note the GM ticked ---------- */
  console.log('заметка на карточке после броска');
  for (let i = 0; i < 14; i++) {
    await page.click('[data-act="rollList"]');
    await new Promise(r => setTimeout(r, 110));
    const rolled = await page.$eval('.panel .card .card-name', e => e.textContent.trim()).catch(() => '');
    if (/Эфироцвет/.test(rolled)) break;
  }
  await page.evaluate(() => { window.__clip = null; });
  const cardBtn = await page.$('.panel .card [data-copy-full]');
  if (cardBtn) {
    await cardBtn.click();
    await settle();
    const cc = await page.evaluate(async () => window.__clip ? await window.__clip['text/plain'].text() : '');
    // the roll happened inside the list, so the list is known and a ticked
    // note belongs with the item just like anywhere else
    ok(/Пахнет мятой/.test(cc), 'помеченная заметка не уехала с выпавшей карточкой');
  }

  // untick and both flags leave the link again
  await tap('[data-note-show]');
  await tap('[data-list-note-show]');
  ok((await page.evaluate(() => location.hash)) === h3, 'снятие галок не вернуло ссылку к прежнему виду');

  /* ---------- an empty note leaves no trace ---------- */
  console.log('пустая заметка');
  await page.$eval('.lnote textarea', e => { e.value = ''; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.$eval('.lrow .rnote textarea', e => { e.value = ''; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await settle();
  ok((await page.evaluate(() => location.hash)) === hash,
     'после очистки заметок адрес не вернулся к прежнему виду');

  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\nвсе проверки заметок прошли');
  process.exit(fail ? 1 : 0);
})();
