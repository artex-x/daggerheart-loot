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

  /* ---------- пакетные действия над позициями ---------- */
  console.log('пакетные действия');
  {
    await go('#/lists/a');
    await page.evaluate(() => {
      [60, 150, 900].forEach(function (v, i) {
        const inp = document.querySelectorAll('[data-gold]')[i];
        inp.value = String(v);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
    await settle();
    const prices = () => page.$$eval('[data-gold]', e => e.slice(0, 3).map(x => x.value));
    const rows = () => page.$$eval('.lrow', e => e.length);
    ok((await page.$$('[data-lsel]')).length === await rows(), 'галочка есть не у каждой строки');
    ok(!(await page.$('.batch.on')), 'полоса действий подсвечена без выделения');

    await page.evaluate(() => document.querySelectorAll('[data-lsel]')[0].click());
    await settle();
    await page.evaluate(() => document.querySelectorAll('[data-lsel]')[2].click());
    await settle();
    ok(await page.$('.batch.on'), 'полоса действий не отметилась');
    ok(/2/.test(await page.$eval('.batch-all', e => e.textContent)), 'не показано, сколько выбрано');

    /* В самой полосе теперь две кнопки: «Цены» и «Удалить». Всё денежное - в
       панели под ней, иначе в строке набиралось пять виджетов сразу. */
    const actLabels = await page.$$eval('.batch-acts .btn', e => e.map(x => x.textContent.trim()));
    ok(actLabels.length === 2, 'в полосе действий не две кнопки: ' + actLabels.join(' | '));
    ok(!(await page.$('.batch-acts [data-reprice]')) && !(await page.$('.batch-acts #rp')),
       'проценты снова стоят в самой полосе');
    await page.click('[data-guess]'); await settle();

    /* #19: кнопки шага у поля процента шли мимо обработчика input - цифра
       менялась, а модель и подпись кнопки оставались на прежнем знаке. */
    const label = () => page.$eval('[data-reprice]', e => e.textContent.trim());
    ok(/скидк/i.test(await label()), 'по умолчанию поле стоит на скидке: ' + (await label()));
    await page.evaluate(() => {
      const inp = document.getElementById('rp');
      inp.value = '-1';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();
    await page.click('[data-step="1"][data-for="rp"]');
    await settle();
    ok(await page.$eval('#rp', e => e.value) === '0', 'шаг не изменил поле');
    await page.click('[data-step="1"][data-for="rp"]');
    await settle();
    ok(/подня|цену/i.test(await label()), 'подпись не переехала на наценку: ' + (await label()));
    await page.evaluate(() => {
      const inp = document.getElementById('rp');
      inp.value = '-20';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();
    ok(/скидк/i.test(await label()), 'подпись не вернулась на скидку: ' + (await label()));

    /* Скидка ложится только на выбранные: вторая цена остаётся прежней. */
    await page.click('[data-reprice]');
    await settle();
    ok((await prices()).join() === '48,150,720', 'пересчёт задел не те строки: ' + (await prices()).join());
    await page.click('#toast button'); await settle();
    ok((await prices()).join() === '60,150,900', 'отмена не вернула цены: ' + (await prices()).join());

    /* Удаление выбранных и возврат на прежние места. Выделение после отмены
       никуда не делось - повторный клик по галочкам снял бы его. */
    const was = await rows();
    ok(await page.$('.batch.on'), 'выделение слетело после отмены пересчёта');
    await page.click('[data-batch-del]');
    await settle();
    ok(await rows() === was - 2, 'удалилось не две строки: ' + (await rows()));
    await page.click('#toast button'); await settle();
    ok(await rows() === was, 'отмена не вернула строки: ' + (await rows()));
    ok((await prices()).join() === '60,150,900', 'после возврата потерялись цены: ' + (await prices()).join());
  }

  /* ---------- прототип: ступени линии улучшения ---------- */
  console.log('ступени линии улучшения');
  {
    await go('#/i/q26');
    const steps = await page.$$eval('#view .steps .step', e => e.map(x => x.textContent.trim()));
    ok(steps.join() === '1,2,3,4', 'ступеней не четыре: ' + steps.join());
    ok((await page.$$('#view .steps span.step.on')).length === 1, 'текущая ступень не одна');
    ok((await page.$$('#view .steps button.step')).length === 3, 'кликабельных ступеней не три');
    await page.evaluate(() => document.querySelectorAll('#view .steps button.step')[2].click());
    await settle();
    const seen = await page.$eval('#modalBody', e => e.innerText);
    ok(/Легендарн/.test(seen), 'по последней ступени открылось не легендарное: ' + seen.slice(0, 60));
    // у вещи без линии улучшения лестницы нет вовсе
    /* Ищем в самой странице: разметка закрытой модалки остаётся в DOM, и
       поиск по всему документу нашёл бы лестницу из предыдущего шага. */
    await go('#/i/q239');
    ok(!(await page.$('#view .steps')), 'у снаряжения без линии появились ступени');
  }

  /* ---------- ссылка, собранная по описанию из llms.txt ----------
     Формат списка описан в llms.txt для того, чтобы агент мог собрать адрес
     сам, ничего не вызывая. Смысл есть только если описание верно, поэтому
     здесь ссылка строится ровно по нему — своей реализацией, не функциями
     приложения — и проверяется, что приложение её открывает. */
  console.log('ссылка, собранная по описанию из llms.txt');
  {
    const stamp = parts => {
      const body = parts.join(',');
      let h = 2166136261;
      for (let i = 0; i < body.length; i++) { h ^= body.charCodeAt(i); h = Math.imul(h, 16777619); }
      return parts.length.toString(36) + '.' + (h >>> 0).toString(36).slice(-4) + '~';
    };
    const parts = ['q26*1*30', 'q313*2', 'ci1'];
    const raw = 'Лавка кузнеца\n' + stamp(parts) + parts.join(',') +
      '\n\x1e+~\x1fТовар лежит навалом.' +
      '\x1e~\x1fКузнец сбывает краденое.' +
      '\x1e+q26\x1fНа клинке зазубрина.';
    const payload = Buffer.from(raw, 'utf8').toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await go('#/l/' + payload);
    const text = await page.$eval('#view', e => e.innerText);
    ok(/Лавка кузнеца/.test(text), 'собранная ссылка не открылась как список');
    ok(/Катана/.test(text) && /Стеганый Доспех/.test(text) && /Спальный Мешок/.test(text),
       'в собранном списке не все позиции: ' + text.slice(0, 120));
    ok(/3 горсти/.test(text), 'цена из собранной ссылки не показана: ' + text.slice(0, 160));
    ok(/×2|x2/.test(text), 'количество из собранной ссылки не показано');
    ok(/Товар лежит навалом/.test(text) && /Кузнец сбывает краденое/.test(text),
       'заметки из собранной ссылки не показаны');
    ok(/На клинке зазубрина/.test(text), 'заметка о позиции не показана');
    // подпорченная контрольная сумма должна списком не открыться
    const broken = Buffer.from(raw.replace(stamp(parts), stamp(parts.slice(0, 2))), 'utf8')
      .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await go('#/l/' + broken);
    ok(!/Катана/.test(await page.$eval('#view', e => e.innerText)),
       'ссылка с неверной контрольной суммой всё равно открылась');
  }

  /* ---------- цены словами (#15) ---------- */
  console.log('режимы показа цены');
  {
    /* Пустой список ни о каких мешках не спрашивает */
    await go('#/lists/x1');
    ok(!(await page.$('[data-money]')), 'выбор режима показан у списка без цен');
    await go('#/lists/a');
    await page.evaluate(() => {
      const inp = document.querySelector('[data-gold="a:ci1"]');
      inp.value = '750';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await go('#/lists/a');
    ok(await page.$('[data-money]'), 'выбор режима не появился, когда цена есть');

    /* Книжный счёт стоит первым и по умолчанию: монеты - опциональное правило,
       и включать его молча за мастера не за что. */
    ok(await page.$eval('[data-money][data-val="bag"]', e => e.classList.contains('on')),
       'по умолчанию выбран не книжный счёт');
    ok(await page.$eval('[data-gold="a:ci1"]', e => e.title) === '7 мешков 5 горстей',
       'цена не переведена в мешки: ' + (await page.$eval('[data-gold="a:ci1"]', e => e.title)));
    ok((await lists()).find(l => l.id === 'a').money === undefined,
       'книжный счёт по умолчанию хранится зря');
    await page.click('[data-money][data-val="coin"]'); await settle();
    ok((await lists()).find(l => l.id === 'a').money === 'coin', 'отход от умолчания не сохранился');
    await page.click('[data-money][data-val="bag"]'); await settle();
    /* Число в поле остаётся монетами: править мешки цифрами нечем */
    ok(await page.$eval('[data-gold="a:ci1"]', e => e.value) === '750', 'поле цены перестало быть монетами');

    /* Пересчёт объясняется по вопросительному знаку, а не примером без слов */
    ok(!(await page.$('.money-help')), 'справка о золоте раскрыта без спроса');
    await page.click('.money .helpbtn'); await settle();
    const mh = await page.$eval('.money-help', e => e.innerText);
    ok(/сундук/i.test(mh) && /10 горстей/.test(mh), 'в справке нет пересчёта: ' + mh.slice(0, 90));
    await page.click('.money .helpbtn'); await settle();


    /* Режим едет в ссылке под id «$», которого нет и не может быть ни у одной
       записи: прежний разборщик на таком id делал return, так что старая сборка
       эту ссылку откроет как открывала, просто монетами. Payload собран руками
       под чужим именем - свой список по #/l/ открывается как свой и ничего бы
       не доказал. */
    const mstamp = parts => {
      const body = parts.join(',');
      let h = 2166136261;
      for (let i = 0; i < body.length; i++) { h ^= body.charCodeAt(i); h = Math.imul(h, 16777619); }
      return parts.length.toString(36) + '.' + (h >>> 0).toString(36).slice(-4) + '~';
    };
    const mparts = ['ci2*1*750'];
    const mraw = 'Казна гильдии\n' + mstamp(mparts) + mparts.join(',') + '\n\x1e$\x1fcoin';
    const mpay = Buffer.from(mraw, 'utf8').toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await go('#/l/' + mpay);
    const shared = await page.$eval('#view', e => e.innerText);
    ok(!(await page.$('[data-share-list]')), 'чужая ссылка открылась как свой список');
    ok(/750 зол\./.test(shared), 'режим не доехал по ссылке: ' + shared.slice(0, 160));
    /* Пометки нет - значит книжный счёт: он и есть умолчание */
    const plain = Buffer.from('Казна гильдии\n' + mstamp(mparts) + mparts.join(','), 'utf8')
      .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await go('#/l/' + plain);
    ok(/7 мешков 5 горстей/.test(await page.$eval('#view', e => e.innerText)),
       'ссылка без пометки читается не по книге');

    await go('#/lists/a');
    await page.click('[data-money][data-val="bag"]'); await settle();
    ok((await lists()).find(l => l.id === 'a').money === undefined, 'книжный счёт хранится зря');
  }

  /* ---------- ориентир по цене (#7) ---------- */
  console.log('ориентир по цене');
  {
    await go('#/lists/a');
    await page.click('[data-lsel="q1"]');   // Палаш: оружие ранга 1, вилка 20-30
    await settle();
    /* Панель могла остаться открытой с прошлого блока: смена адреса тут не
       перезагружает страницу, а состояние живёт в памяти. Проверяем правило -
       она открывается и закрывается кнопкой, - а не то, какой она застали. */
    if (await page.$('.guess')) { await page.click('[data-guess]'); await settle(); }
    ok(!(await page.$('.guess')), 'панель цен не закрылась по кнопке');
    await page.click('[data-guess]'); await settle();
    const panel = await page.$eval('.guess', e => e.innerText);
    ok(/105/.test(panel), 'не сказано, откуда взяты числа: ' + panel.slice(0, 90));
    ok(/20–30/.test(panel), 'не показана вилка для оружия ранга 1: ' + panel.slice(0, 90));
    await page.click('[data-guess-apply]'); await settle();
    ok((await lists()).find(l => l.id === 'a').meta.q1.gold === 25,
       'проставлена не середина вилки: ' + JSON.stringify((await lists()).find(l => l.id === 'a').meta.q1));
    await page.click('#toast button'); await settle();
    ok(!((await lists()).find(l => l.id === 'a').meta.q1 || {}).gold, 'отмена не убрала проставленную цену');
  }

  /* ---------- бросок по списку начинается пустым (#16) ---------- */
  console.log('пустое поле броска');
  {
    await go('#/lists/a');
    ok(await page.$eval('#n', e => e.value) === '', 'поле броска снова показывает единицу');
    ok(await page.$('.rollhint'), 'нет подсказки вместо результата');
    /* Ровно тот случай, ради которого всё затевалось: на кубике выпала 1 */
    await page.evaluate(() => {
      const inp = document.getElementById('n');
      inp.value = '1';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();
    ok(!(await page.$('.rollhint')), 'единица не показала позицию');
    ok(/Кожаный Спальник|Спальный Мешок|ci1/i.test(await page.$eval('.panel', e => e.innerText)) ||
       !!(await page.$('.panel .card')), 'по единице не выпала первая позиция');
  }

  /* ---------- забрать из чужого списка (#14) ---------- */
  console.log('забрать из чужого списка');
  {
    /* Ссылка именно чужая: у своего списка адрес #/l/ открывается как свой,
       со всеми правами на правку, и ничего бы не доказал. Поэтому payload
       собран руками под именем, которого в хранилище нет. */
    const stamp = parts => {
      const body = parts.join(',');
      let h = 2166136261;
      for (let i = 0; i < body.length; i++) { h ^= body.charCodeAt(i); h = Math.imul(h, 16777619); }
      return parts.length.toString(36) + '.' + (h >>> 0).toString(36).slice(-4) + '~';
    };
    const parts = ['ci1*1*750', 'q1*2', 'q313'];
    const raw = 'Лавка Феррина\n' + stamp(parts) + parts.join(',') +
      '\n\x1e+~\x1fТовар лежит навалом.' +
      '\n\x1e~\x1fФеррин сбывает краденое.' +
      '\n\x1e~ci1\x1fЭто мастерская заметка.';
    const pay = Buffer.from(raw, 'utf8').toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await go('#/l/' + pay);
    ok(!(await page.$('[data-share-list]')), 'чужая ссылка открылась как свой список');
    ok(await page.$('[data-act="menu"][data-val="@"]'), 'нет кнопки «забрать в свой список»');
    /* Кнопка называется как везде: «Добавить в список», а не своим словом */
    ok(/Добавить в список/.test(await page.$eval('[data-act="menu"][data-val="@"]', e => e.textContent)),
       'у кнопки своя формулировка вместо общей');

    await page.click('[data-act="menu"][data-val="@"]'); await settle();
    /* Переход по хэшу документ не перезагружает, так что в поиске по спискам
       ещё лежит запрос из проверки выше - иначе виден один список из тринадцати */
    await page.evaluate(() => {
      const q = document.getElementById('pickq');
      if (q) { q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await settle();
    await page.click('[data-add-to^="x0|"]');
    await settle();
    const mine = (await lists()).find(l => l.id === 'x0');
    ok(mine.ids.join() === 'ci1,q1,q313', 'позиции чужого списка не доехали: ' + JSON.stringify(mine.ids));
    ok(mine.meta && mine.meta.ci1 && mine.meta.ci1.gold === 750, 'цена не приехала вместе с позицией');
    ok(mine.meta.q1 && mine.meta.q1.qty === 2, 'количество не приехало вместе с позицией');
    /* Заметки мастера в чужой инвентарь не едут: они про его игру, не про мою */
    ok(!(mine.meta.ci1 || {}).hnote && !mine.hnote, 'мастерская заметка уехала в чужой список');
  }

  /* ---------- новый список из чужой ссылки ---------- */
  console.log('новый список из чужой ссылки');
  {
    /* Разбор ключа меню жил в двух копиях, и та, что стоит за «+ Новый список»,
       клала в него сам ключ «@» вместо позиций - получался пустой список. */
    const stamp = parts => {
      const body = parts.join(',');
      let h = 2166136261;
      for (let i = 0; i < body.length; i++) { h ^= body.charCodeAt(i); h = Math.imul(h, 16777619); }
      return parts.length.toString(36) + '.' + (h >>> 0).toString(36).slice(-4) + '~';
    };
    const parts = ['ci1*1*750', 'q1*2'];
    const raw = 'Лавка Феррина\n' + stamp(parts) + parts.join(',');
    const pay = Buffer.from(raw, 'utf8').toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await go('#/l/' + pay);
    await page.click('[data-act="menu"][data-val="@"]'); await settle();
    await page.click('[data-act="newListFor"][data-val="@"]'); await settle();
    /* Имя чужого списка подставляется само: переименовать проще, чем набрать */
    ok(await page.$eval('#newlist', e => e.value) === 'Лавка Феррина',
       'имя из ссылки не подставилось: ' + (await page.$eval('#newlist', e => e.value)));
    await page.click('[data-act="createFor"][data-val="@"]'); await settle();
    const mine = (await lists()).find(l => l.name === 'Лавка Феррина');
    ok(!!mine, 'список из чужой ссылки не создался');
    ok(mine && mine.ids.join() === 'ci1,q1', 'новый список пустой: ' + JSON.stringify(mine && mine.ids));
    ok(mine && mine.meta && mine.meta.ci1 && mine.meta.ci1.gold === 750, 'цена не доехала в новый список');
    /* Новый список из ссылки - её копия, и он сразу открывается своим */
    ok(await page.$('#rename'), 'после создания остались на чужой странице');
  }

  /* ---------- цена: подсказка вместо строки, и она не отстаёт ---------- */
  console.log('подсказка о цене');
  {
    await go('#/lists/a');
    await page.evaluate(() => {
      const inp = document.querySelector('[data-gold="a:ci1"]');
      inp.value = '750'; inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await go('#/lists/a');
    await page.click('[data-money][data-val="bag"]'); await settle();
    ok(!(await page.$('.lrow-money')), 'мешки снова занимают строку вместо подсказки');
    ok(await page.$eval('[data-gold="a:ci1"]', e => e.title) === '7 мешков 5 горстей',
       'на поле цены нет подсказки: ' + (await page.$eval('[data-gold="a:ci1"]', e => e.title)));
    /* Строку не перерисовывают на каждую цифру, так что подсказку надо
       обновлять на месте - иначе после правки она обещает старую цену */
    await page.evaluate(() => {
      const inp = document.querySelector('[data-gold="a:ci1"]');
      inp.value = '231'; inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();
    ok(await page.$eval('[data-gold="a:ci1"]', e => e.title) === '2 мешка 3 горсти',
       'подсказка отстала от цены: ' + (await page.$eval('[data-gold="a:ci1"]', e => e.title)));
    await page.click('[data-money][data-val="coin"]'); await settle();
    ok(!(await page.$eval('[data-gold="a:ci1"]', e => e.title)), 'в режиме монет подсказка лишняя');
  }

  /* ---------- бросок по списку свёрнут ---------- */
  console.log('бросок по списку');
  {
    /* Переход по хэшу документ не перезагружает, а проверки выше уже и бросали
       по этому списку, и раскрывали панель руками - и то и другое приложение
       теперь честно помнит. Смотрим на чистую загрузку. */
    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));
    await go('#/lists/a');
    ok(await page.$('.lroll'), 'панели броска нет');
    ok(!(await page.$eval('.lroll', e => e.open)), 'панель броска занимает экран без спроса');
    await page.click('.lroll summary'); await settle();
    await page.evaluate(() => {
      const inp = document.getElementById('n');
      inp.value = '1'; inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();
    ok(await page.$eval('.lroll', e => e.open), 'после броска панель схлопнулась вместе с результатом');
    ok(await page.$('.lroll .card'), 'результат броска не показан');

    /* Свёрнутое остаётся свёрнутым: перерисовка от смены режима цен или от
       «выбрать все» разворачивала обратно всё, что человек убрал с глаз.
       Выбор режима показан только там, где есть хоть одна цена. */
    await page.evaluate(() => {
      const inp = document.querySelector('[data-gold]');
      inp.value = '750'; inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();
    await page.$eval('.lnote', e => { e.open = false; });
    await page.$eval('.lroll', e => { e.open = false; });
    await settle();
    await page.click('[data-lsel-all]'); await settle();
    ok(!(await page.$eval('.lnote', e => e.open)) && !(await page.$eval('.lroll', e => e.open)),
       '«выбрать все» развернуло свёрнутое');
    await page.click('[data-money][data-val="coin"]'); await settle();
    ok(!(await page.$eval('.lnote', e => e.open)) && !(await page.$eval('.lroll', e => e.open)),
       'смена режима цен развернула свёрнутое');
    await page.click('[data-money][data-val="bag"]'); await settle();
    await page.click('[data-lsel-all]'); await settle();
  }

  /* ---------- заметка едет с копией позиции ---------- */
  console.log('заметка в копии позиции');
  {
    await go('#/lists/a');
    await page.evaluate(() => {
      const box = document.querySelector('.lrow [data-note-toggle]');
      box.click();
    });
    await settle();
    await page.evaluate(() => {
      const pub = document.querySelector('.lrow .rnote .n-pub textarea');
      pub.value = 'Куплено у Феррина';
      pub.dispatchEvent(new Event('input', { bubbles: true }));
      const hid = document.querySelector('.lrow .rnote .n-hid textarea');
      hid.value = 'Краденое';
      hid.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();
    await page.evaluate(() => document.querySelector('.lrow .row-main').click());
    await settle();
    await page.click('#modal [data-copy-full]'); await settle();
    const txt = await clip('text/plain');
    ok(/Куплено у Феррина/.test(txt), 'заметка для игроков не поехала с копией: ' + txt.slice(0, 160));
    ok(!/Краденое/.test(txt), 'мастерская заметка уехала в копию');
    /* Цена и количество остаются в списке: в тексте одной вещи им нечего делать */
    ok(!/750|×1/.test(txt), 'в копию позиции попали цена или количество');
  }

  /* ---------- фильтр по виду в таблицах ---------- */
  console.log('фильтр по виду');
  {
    /* Вид отбирают только там, где видов и правда больше одного: у Core вид и
       есть таблица, у сообществ он один - строка ничего бы не отбирала. Панель
       теперь общая со снаряжением, поэтому и селекторы у неё общие. */
    const openF = async () => { if (!(await page.$('.ffilter'))) {
      await page.click('[data-act="fOpen"]'); await settle(); } };
    await go('#/tables/core_item');
    ok(!(await page.$('.fbar')), 'у односоставной таблицы завелась панель фильтров');
    await go('#/tables/community');
    await openF();
    ok(!(await page.$('[data-val^="kind:"]')), 'у таблицы сообществ завёлся фильтр вида');
    ok(await page.$('[data-val^="comm:"]'), 'у таблицы сообществ нет фильтра по сообществу');

    await go('#/tables/wondrous');
    await openF();
    ok((await page.$$eval('.ffilter [data-val^="kind:"]', e => e.length)) === 3,
       'в Wondrous не три вида');
    const all = await page.$$eval('.rows .row', e => e.length);
    ok(all === 119, 'Wondrous открылся не целиком: ' + all);
    /* Ничего не выбрано - значит «любое»: один клик даёт один вид, а не гасит
       остальные два. */
    await page.click('.ffilter [data-val="kind:consumable"]'); await settle();
    ok((await page.$$eval('.rows .row', e => e.length)) === 59,
       'расходников в Wondrous отобралось не 59: ' + (await page.$$eval('.rows .row', e => e.length)));
    /* Таблица нумерована как одна кость: фильтр прячет строки, но не
       перенумеровывает их - иначе номер на карточке перестанет быть броском. */
    const nums = await page.$$eval('.rows .rnum', e => e.slice(0, 3).map(x => +x.textContent));
    ok(nums.join() !== '1,2,3' && nums[0] >= 1, 'номера пересчитались под фильтр: ' + nums.join());
    await page.click('.fclear'); await settle();
    ok((await page.$$eval('.rows .row', e => e.length)) === 119, 'сброс не вернул таблицу целиком');

    /* Сетка работает и в альтернативных таблицах: переключатель там появился,
       а колонки его не слушались. */
    await go('#/tables/alt_item');
    await page.click('[data-act="view"][data-val="grid"]'); await settle();
    ok((await page.$$eval('.tgrid .tilewrap', e => e.length)) === 120,
       'альтернативная таблица не показалась сеткой');
    ok(await page.$eval('.tgrid .tile-n', e => e.textContent === '1'),
       'на плитке не номер по кости');
    await page.click('[data-act="view"][data-val="list"]'); await settle();
  }

  /* ---------- альтернативные таблицы как все остальные (#8) ---------- */
  console.log('альтернативные таблицы');
  {
    await go('#/tables/alt_item');
    ok(!(await page.$('.alttable')), 'осталась старая таблица из трёх колонок');
    const rows = await page.$$eval('.tsection .row', e => e.length);
    ok(rows === 120, 'строк не 24 на каждую из пяти редкостей: ' + rows);
    /* Ровно то, из-за чего всё затевалось: описание видно, не открывая запись */
    ok((await page.$$eval('.tsection .row .rt span', e => e.length)) >= 100,
       'у строк альтернативной таблицы нет описаний');
    ok((await page.$$eval('.tsection [data-sel]', e => e.length)) === 120,
       'в альтернативной таблице нельзя отметить запись');
    /* Пара «надежда/страх» - это две колонки книги, и она должна читаться */
    const cols = await page.$$eval('.tsection:first-of-type .altcol', e => e.map(x => x.className));
    ok(cols.length === 2 && /hope/.test(cols[0]) && /fear/.test(cols[1]),
       'подзаголовки надежды и страха потерялись: ' + cols.join('|'));
    /* Номер свой, 1-12 по кости, а не тот, под которым запись стоит в книге */
    const nums = await page.evaluate(() => {
      const sec = document.querySelector('.tsection');
      return [...sec.querySelectorAll('.rows')[0].querySelectorAll('.rnum')].map(x => x.textContent);
    });
    ok(nums.join() === '1,2,3,4,5,6,7,8,9,10,11,12', 'нумерация по кости сбилась: ' + nums.join());
  }

  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\nсписки: все проверки прошли');
  process.exit(fail ? 1 : 0);
})();
