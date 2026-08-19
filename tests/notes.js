/* Two notes per list and per entry: one the table gets to read, one that stays
   with the GM. Checked from both ends — what leaves in text and links, and what
   happens to lists and links written before the split existed. */
const puppeteer = require('puppeteer');
const { ready } = require('./lib.js');
const ROOT = 'file://' + require('path').join(__dirname, '..', 'index.html');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL ' + m); } };

(async () => {
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
  const mk = async (seed) => {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    page.on('pageerror', e => { fail++; console.log('  FAIL страница упала: ' + e.message); });
    await page.setViewport({ width: 1180, height: 1000 });
    await page.evaluateOnNewDocument(() => {
      window.isSecureContext = true; window.__clip = null;
      window.ClipboardItem = class { constructor(m){ this.map = m; } };
      Object.defineProperty(navigator, 'clipboard', {
        value: { write: i => { window.__clip = i[0].map; return Promise.resolve(); },
                 writeText: s => { window.__clip = { 'text/plain': { text: async () => s } }; return Promise.resolve(); } } });
    });
    if (seed) await page.evaluateOnNewDocument(seed);
    return page;
  };
  const settle = () => new Promise(r => setTimeout(r, 280));
  const go = async (page, h) => { await page.goto(ROOT + h, { waitUntil: 'domcontentloaded' });
                                  await ready(page);
                                  await page.evaluate(() => window.scrollTo(0, 0)); };
  const clip = (page, k) => page.evaluate(async x =>
    window.__clip && window.__clip[x] ? await window.__clip[x].text() : '', k);
  const type = async (page, sel, text) => {
    await page.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, text);
    await settle();
  };
  const lists = page => page.evaluate(() => JSON.parse(localStorage.getItem('dhloot.lists.v2')));

  const FRESH = () => localStorage.setItem('dhloot.lists.v2', JSON.stringify(
    [{ id:'a', name:'Лавка', ids:['ci1','cc1'], created:1 }]));

  /* ---------- writing both notes ---------- */
  console.log('две заметки');
  let page = await mk(FRESH);
  await go(page, '#/lists/a');
  ok((await page.$$eval('.lnote textarea', e => e.length)) === 2, 'у списка не два поля заметки');
  ok(await page.$('.lnote .n-pub') && await page.$('.lnote .n-hid'), 'поля не помечены');
  await type(page, '.lnote .n-pub textarea', 'Лавка закрыта до утра');
  await type(page, '.lnote .n-hid textarea', 'Хозяин — контрабандист');

  await page.evaluate(() => document.querySelector('[data-note-toggle]').click());
  await settle();
  ok((await page.$$eval('.lrow:first-child .rnote textarea', e => e.length)) === 2,
     'у позиции не два поля');
  await type(page, '.lrow:first-child .rnote .n-pub textarea', 'Пахнет мятой');
  await type(page, '.lrow:first-child .rnote .n-hid textarea', 'Подделка');

  const stored = (await lists(page))[0];
  ok(stored.note === 'Лавка закрыта до утра' && stored.hnote === 'Хозяин — контрабандист',
     'заметки списка сохранились не туда: ' + JSON.stringify(stored.note) + ' / ' + JSON.stringify(stored.hnote));
  ok(stored.meta.ci1.note === 'Пахнет мятой' && stored.meta.ci1.hnote === 'Подделка',
     'заметки позиции сохранились не туда: ' + JSON.stringify(stored.meta.ci1));
  ok(!('noteShow' in stored) && !('noteShow' in stored.meta.ci1), 'остался старый флаг noteShow');
  ok(await page.$eval('.lrow-note', e => e.classList.contains('on')), 'кнопка заметки не отмечена');

  /* ---------- what leaves in the copied text ---------- */
  console.log('копирование текста');
  await page.evaluate(() => document.querySelector('[data-copy-listtext]').click());
  await settle();
  const txt = await clip(page, 'text/plain');
  ok(/Лавка закрыта до утра/.test(txt), 'заметка для игроков не попала в текст');
  ok(/Пахнет мятой/.test(txt), 'заметка позиции для игроков не попала в текст');
  ok(!/контрабандист/.test(txt) && !/Подделка/.test(txt), 'заметка мастера уехала в текст игрокам');

  /* ---------- what leaves in each link ---------- */
  console.log('две ссылки');
  await page.evaluate(() => document.querySelector('[data-share-list]').click());
  await settle();
  const playersUrl = await clip(page, 'text/plain');
  await page.evaluate(() => document.querySelector('[data-share-gm]').click());
  await settle();
  const gmUrl = await clip(page, 'text/plain');
  ok(playersUrl !== gmUrl, 'обе кнопки дают одну и ту же ссылку');

  const readBack = async (url) => {
    const p2 = await mk();
    await go(p2, url.slice(url.indexOf('#')));
    const seen = await p2.evaluate(() => document.body.innerText);
    await p2.close();
    return seen;
  };
  const asPlayer = await readBack(playersUrl);
  ok(/Лавка закрыта до утра/.test(asPlayer), 'по ссылке игрокам нет заметки для игроков');
  ok(!/контрабандист/.test(asPlayer) && !/Подделка/.test(asPlayer),
     'по ссылке игрокам видны заметки мастера');
  const asGm = await readBack(gmUrl);
  ok(/контрабандист/.test(asGm) && /Подделка/.test(asGm), 'своя ссылка растеряла заметки мастера');

  /* Адресную строку можно скопировать руками, и это должна быть ссылка для
     игроков. Совпадения символ в символ с кнопкой больше нет: кнопка отдаёт
     сжатый вариант, а адрес остаётся обычным. Проверяем по смыслу - что
     лежащее в адресе открывается без мастерских заметок. */
  const inBar = await page.evaluate(() => location.hash);
  const fromBar = await readBack('x' + inBar);
  ok(/Лавка закрыта до утра/.test(fromBar), 'в адресной строке нет заметки для игроков');
  ok(!/контрабандист/.test(fromBar) && !/Подделка/.test(fromBar),
     'в адресной строке лежат заметки мастера');
  await page.close();

  /* ---------- lists written before the split ---------- */
  console.log('старые списки');
  page = await mk(() => {
    localStorage.setItem('dhloot.lists.v1', JSON.stringify([{
      id:'old', name:'Старый', ids:['ci1','cc1'], created:1,
      note:'Видно игрокам', noteShow:true,
      meta:{ ci1:{ qty:2, note:'Тоже видно', noteShow:true },
             cc1:{ note:'Секрет мастера' } }
    }]));
  });
  await go(page, '#/lists/old');
  const moved = (await lists(page))[0];
  ok(!!moved, 'старый список не перенёсся в новое хранилище');
  ok(moved.note === 'Видно игрокам' && !moved.hnote,
     'помеченная заметка списка стала не заметкой для игроков: ' + JSON.stringify(moved));
  ok(moved.meta.ci1.note === 'Тоже видно' && moved.meta.ci1.qty === 2,
     'помеченная заметка позиции потерялась вместе с количеством');
  ok(moved.meta.cc1.hnote === 'Секрет мастера' && !moved.meta.cc1.note,
     'непомеченная заметка не стала мастерской: ' + JSON.stringify(moved.meta.cc1));
  ok(await page.evaluate(() => localStorage.getItem('dhloot.lists.v1') !== null),
     'старый ключ удалён, откатиться будет некуда');
  await page.evaluate(() => document.querySelector('[data-copy-listtext]').click());
  await settle();
  const oldTxt = await clip(page, 'text/plain');
  ok(/Видно игрокам/.test(oldTxt) && /Тоже видно/.test(oldTxt), 'из старого списка пропало видимое');
  ok(!/Секрет мастера/.test(oldTxt), 'из старого списка утекло мастерское');
  await page.close();

  /* ---------- links written before the split ---------- */
  console.log('старые ссылки');
  page = await mk();
  await go(page, '#/roll/std');
  const oldLink = await page.evaluate(() => {
    // exactly what the old encoder produced: "+" meant "copy along with it"
    const raw = 'Старая ссылка\nci1*2,cc1\n' +
      '\x1e+~\x1fПреамбула для игроков' +
      '\x1e+ci1\x1fВидно' +
      '\x1ecc1\x1fНе видно';
    const bytes = new TextEncoder().encode(raw);
    let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  });
  await go(page, '#/l/' + oldLink);
  const seen = await page.evaluate(() => document.body.innerText);
  ok(/Старая ссылка/.test(seen), 'старая ссылка не открылась');
  ok(/Преамбула для игроков/.test(seen) && /Видно/.test(seen), 'из старой ссылки пропало видимое');
  await page.click('[data-act="menu"][data-val="@"]'); await settle();
  await page.click('[data-act="newListFor"][data-val="@"]'); await settle();
  await page.click('[data-act="createFor"][data-val="@"]'); await settle();
  const saved = (await lists(page))[0];
  ok(saved.note === 'Преамбула для игроков' && !saved.hnote,
     'помеченная заметка из ссылки легла не туда: ' + JSON.stringify(saved));
  ok(saved.meta.ci1.note === 'Видно' && saved.meta.ci1.qty === 2, 'позиция из старой ссылки поехала');
  ok(saved.meta.cc1.hnote === 'Не видно' && !saved.meta.cc1.note,
     'непомеченная заметка из ссылки стала видимой: ' + JSON.stringify(saved.meta.cc1));
  await page.close();

  /* ---------- saving a link and opening it again ---------- */
  console.log('своя ссылка после сохранения');
  page = await mk();
  await go(page, '#/roll/std');
  // a real link from before the split: the list note carries no marker
  const backup = await page.evaluate(() => {
    const raw = 'Скупщик трофеев\nq335,cc21*5*50,q337*1*150\n' +
      '\x1e~\x1fОружие давно не знало заботливой руки' +
      '\x1e+q337\x1fНа нагруднике необычный герб';
    const bytes = new TextEncoder().encode(raw);
    let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  });
  await go(page, '#/l/' + backup);
  ok(await page.$('[data-act="menu"][data-val="@"]'), 'ссылка не открылась как чужая');
  await page.click('[data-act="menu"][data-val="@"]'); await settle();
  await page.click('[data-act="newListFor"][data-val="@"]'); await settle();
  await page.click('[data-act="createFor"][data-val="@"]'); await settle();
  ok(!(await page.$('[data-act="menu"][data-val="@"]')), 'после сохранения список всё ещё чужой');

  // and coming back to the very same link has to land on the saved list
  await go(page, '#/l/' + backup);
  ok(!(await page.$('[data-act="menu"][data-val="@"]')),
     'своя же ссылка снова показана как чужая — сохранять её можно бесконечно');
  ok(await page.$('#rename'), 'список открылся не в режиме правки');
  ok((await lists(page)).length === 1, 'список сохранился дважды');
  await page.close();

  /* ---------- a list with no notes still encodes as before ---------- */
  console.log('список без заметок');
  page = await mk(FRESH);
  await go(page, '#/lists/a');
  const plain = await page.evaluate(() => location.hash);
  await page.evaluate(() => document.querySelector('[data-share-gm]').click());
  await settle();
  const gmPlain = await clip(page, 'text/plain');
  ok(gmPlain.indexOf(plain) >= 0, 'без заметок ссылки мастеру и игрокам разошлись');

  /* ---------- the note the list roll turns up ---------- */
  console.log('заметка на выпавшем');
  await page.evaluate(() => document.querySelector('[data-note-toggle]').click());
  await settle();
  await type(page, '.lrow:first-child .rnote .n-pub textarea', 'Видно всем');
  await type(page, '.lrow:first-child .rnote .n-hid textarea', 'Только мне');
  // typing the number picks that entry; the button would roll at random
  await page.evaluate(() => { const n = document.getElementById('n');
    n.value = '1'; n.dispatchEvent(new Event('input', { bubbles: true })); });
  await settle();
  const hits = await page.$$eval('.hitnote', e => e.map(x => x.textContent));
  ok(hits.length === 2, 'на выпавшей позиции показаны не обе заметки: ' + hits.length);
  ok(hits.join(' ').indexOf('Только мне') >= 0, 'мастерская заметка не показана мастеру');
  await page.evaluate(() => document.querySelector('.orgrid [data-copy-full], .panel .card [data-copy-full]').click());
  await settle();
  const card = await clip(page, 'text/plain');
  ok(/Видно всем/.test(card), 'с выпавшей карточки не уехала заметка для игроков');
  ok(!/Только мне/.test(card), 'с выпавшей карточки уехала заметка мастера');
  await page.close();

  /* ---------- очистка заметки крестиком ---------- */
  console.log('очистка заметки');
  {
    const page = await mk(FRESH);
    await go(page, '#/lists/a');
    const shown = () => page.$$eval('.lnote .note-x', e => e.map(x => getComputedStyle(x).display));
    /* У пустого поля чистить нечего, и крестика там нет */
    ok((await shown()).every(d => d === 'none'), 'у пустых заметок висит крестик');
    await type(page, '.lnote .n-pub textarea', 'Лавка закрыта до утра');
    const vis = await shown();
    ok(vis[0] !== 'none' && vis[1] === 'none', 'крестик появился не у того поля: ' + vis.join());

    await page.evaluate(() => document.querySelector('.lnote .n-pub .note-x').click());
    await settle();
    ok(await page.$eval('.lnote .n-pub textarea', e => e.value) === '', 'крестик не очистил поле');
    ok(!(await lists(page))[0].note, 'очистка не дошла до хранилища');
    ok(/Заметка очищена/.test(await page.$eval('#toast', e => e.textContent)), 'нет уведомления об очистке');

    await page.click('#toast button');
    await settle();
    ok(await page.$eval('.lnote .n-pub textarea', e => e.value) === 'Лавка закрыта до утра',
       'отмена не вернула текст в поле');
    ok((await lists(page))[0].note === 'Лавка закрыта до утра', 'отмена не вернула текст в хранилище');
    /* #10: `.toast.act` стоит в файле ниже `.toast[hidden]` и с той же
       специфичностью, так что погашенный тост оставался висеть пустой плашкой.
       Проверяем то, что видит глаз, а не атрибут. */
    ok(await page.$eval('#toast', e => getComputedStyle(e).display) === 'none',
       'после отмены осталась пустая плашка тоста');
    await page.close();
  }

  /* ---------- how tall the boxes stand (issues #6 and #12) ----------
     The height is no longer remembered anywhere: it follows the text, up to a
     ceiling, and a box the GM drags is left alone until the next render. */
  console.log('высота полей заметок');
  {
    const page = await mk(FRESH);
    await go(page, '#/lists/a');
    const box = sel => page.$$eval(sel, e => e.map(t => {
      const cs = getComputedStyle(t), pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      return { h: t.offsetHeight, lines: Math.round((t.clientHeight - pad) / parseFloat(cs.lineHeight)) };
    }));
    const type = (sel, v) => page.$eval(sel, (t, val) => {
      t.value = val;
      t.dispatchEvent(new Event('input', { bubbles: true }));
    }, v);

    // an empty box is the three lines its rows attribute asks for
    let ln = await box('.lnote textarea');
    ok(ln.length === 2 && ln.every(x => x.lines === 3),
       'пустая заметка списка открывается не на три строки: ' + JSON.stringify(ln));

    // and it grows under the text without anyone dragging it
    await type('.lnote .n-pub textarea', Array.from({ length: 8 }, (_, i) => 'строка ' + i).join('\n'));
    await settle();
    ln = await box('.lnote textarea');
    ok(ln[0].lines >= 8, 'поле не выросло под текст: ' + JSON.stringify(ln));
    // the neighbour is a different note and keeps its own size
    ok(ln[1].lines === 3, 'соседнее поле выросло заодно: ' + JSON.stringify(ln));

    // ...to a ceiling, past which it scrolls rather than swallowing the page
    await type('.lnote .n-pub textarea', Array.from({ length: 80 }, (_, i) => 'строка ' + i).join('\n'));
    await settle();
    const tall = (await box('.lnote textarea'))[0];
    ok(tall.h <= 320, 'поле переросло потолок: ' + tall.h);
    ok(await page.$eval('.lnote .n-pub textarea', t => t.scrollHeight > t.clientHeight),
       'выше потолка текст должен прокручиваться');

    /* Сжимается тем же правилом, но не ниже трёх строк: пол задан атрибутом
       rows, и это правильный пол - поле, схлопнувшееся в одну строку, читается
       как сломанное, а печатать в него всё равно сейчас будут. */
    await type('.lnote .n-pub textarea', 'одна строка');
    await settle();
    ok((await box('.lnote textarea'))[0].lines === 3, 'поле не вернулось к трём строкам');

    // a row's box is hidden until it is opened, and измеряется уже открытым
    await page.click('.lrow:first-child .lrow-note');
    await settle();
    const rn = await box('.lrow:first-child .rnote textarea');
    ok(rn.length === 2 && rn.every(x => x.lines === 3 && x.h > 0),
       'заметка позиции открылась схлопнутой: ' + JSON.stringify(rn));

    // nothing about heights is kept in the settings any more
    const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('dhloot.prefs.v1') || '{}'));
    ok(!('noteH' in kept), 'высота заметок снова осела в настройках');
    await page.close();
  }

  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\nзаметки: все проверки прошли');
  process.exit(fail ? 1 : 0);
})();
