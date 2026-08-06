/* Regressions from the exploratory audit of 5 August 2026. One test per
   finding, named so the report can be read alongside it. */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const ROOT_DIR = path.join(__dirname, '..');
const ROOT = 'file://' + path.join(ROOT_DIR, 'index.html');

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL ' + m); } };
const lum = (hex) => {
  const c = [0, 2, 4].map(i => parseInt(hex.slice(1 + i, 3 + i), 16) / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

(async () => {
  const css = fs.readFileSync(path.join(ROOT_DIR, 'style.css'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

  /* ---------- 9.4 contrast ---------- */
  console.log('9.4 контраст приглушённого текста');
  const token = /--muted2:\s*(#[0-9a-f]{6})/i.exec(css);
  ok(!!token, 'не нашёл токен --muted2');
  if (token) {
    const onBg = contrast(token[1], '#0e0c15'), onPanel = contrast(token[1], '#1a1626');
    ok(onBg >= 4.5 && onPanel >= 4.5,
       '--muted2 ' + token[1] + ' даёт ' + onBg.toFixed(2) + ' на фоне и ' +
       onPanel.toFixed(2) + ' на панели при норме 4.5');
  }

  /* ---------- 7.2 scrollbar ---------- */
  console.log('7.2 полоса прокрутки не двигает страницу');
  ok(/scrollbar-gutter:\s*stable/.test(css), 'нет scrollbar-gutter: stable');

  /* ---------- 3.5 + сообщённое пользователем ---------- */
  console.log('3.5 превью ссылки');
  const og = (prop) => {
    const m = new RegExp('<meta (?:property|name)="' + prop + '" content="([^"]*)"').exec(html);
    return m ? m[1] : '';
  };
  ok(!/\/og\/(ci|cc|hi|hc|w|cm|q)\d+\.jpg/.test(og('og:image')),
     'og:image показывает картинку конкретного предмета: ' + og('og:image'));
  ok(og('og:image:width') === '1200' && og('og:image:height') === '630',
     'превью не 1200×630: ' + og('og:image:width') + '×' + og('og:image:height'));
  ok(fs.existsSync(path.join(ROOT_DIR, 'og', path.basename(og('og:image')))), 'файла превью нет на диске');
  ok(og('twitter:image') === og('og:image'), 'twitter:image и og:image разошлись');
  ok(!!og('og:locale'), 'не указан og:locale');
  // an item page shows the item, and a square picture wants a square card
  const stub = fs.readFileSync(path.join(ROOT_DIR, 'i', 'ci1.html'), 'utf8');
  ok(/content="summary"/.test(stub), 'карточка предмета всё ещё summary_large_image при квадратной картинке');
  ok(/og\/ci1\.jpg/.test(stub), 'страница предмета потеряла свою картинку');

  /* ---------- ссылки из одного места ---------- */
  console.log('ссылки выглядят одинаково');
  ok(!/baseUrl\(\) \+ 'index\.html'/.test(fs.readFileSync(path.join(ROOT_DIR, 'app.js'), 'utf8')),
     'какая-то ссылка снова дописывает index.html в обход appUrl');

  /* ---------- 8.2 scripts ---------- */
  console.log('8.2 скрипты не блокируют отрисовку');
  ok(/<script defer src="data\.js">/.test(html) && /<script defer src="app\.js">/.test(html),
     'скрипты подключены без defer');

  /* ---------- 2.2 dashes ---------- */
  console.log('2.2 одно тире в диапазонах');
  const app = fs.readFileSync(path.join(ROOT_DIR, 'app.js'), 'utf8');
  const hyphenRanges = (app.match(/'[0-9]+-[0-9]+'/g) || []);
  ok(!hyphenRanges.length, 'числовые диапазоны через дефис: ' + hyphenRanges.join(', '));

  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
  const mk = async (seed, width) => {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    page.on('pageerror', e => { fail++; console.log('  FAIL страница упала: ' + e.message); });
    await page.setViewport({ width: width || 1180, height: 900 });
    if (seed) await page.evaluateOnNewDocument(seed);
    return page;
  };
  const go = async (page, h) => { await page.goto(ROOT + h, { waitUntil: 'domcontentloaded' });
                                  await new Promise(r => setTimeout(r, 560)); };
  const settle = () => new Promise(r => setTimeout(r, 280));

  /* ---------- 1.1 the blocker ---------- */
  console.log('1.1 набор двузначного числа');
  let page = await mk();
  await go(page, '#/roll/std');
  await page.$eval('#n', e => { e.focus(); e.select(); });
  await page.keyboard.type('47', { delay: 40 });
  await settle();
  ok((await page.$eval('#n', e => e.value)) === '47',
     'набрали 4 и 7, получили ' + (await page.$eval('#n', e => e.value)));
  // and the caret survives editing in the middle
  await page.$eval('#n', e => { e.focus(); e.select(); });
  await page.keyboard.type('5');
  await settle();
  await page.$eval('#n', e => { e.focus(); e.setSelectionRange(0, 0); });
  await page.keyboard.type('4');
  await settle();
  ok((await page.$eval('#n', e => e.value)) === '45', 'вставка в начало поехала: ' +
     (await page.$eval('#n', e => e.value)));
  // out of range still clamps
  await page.$eval('#n', e => { e.focus(); e.select(); });
  await page.keyboard.type('99');
  await settle();
  ok((await page.$eval('#n', e => e.value)) === '60', 'значение вне диапазона не прижалось к 60');

  /* ---------- 1.4 empty field ---------- */
  console.log('1.4 опустошённое поле');
  await page.$eval('#n', e => { e.focus(); e.select(); });
  await page.keyboard.press('Backspace');
  await settle();
  ok((await page.$$eval('.results .card', e => e.length)) > 0, 'результаты пропали на полпути ввода');
  await page.$eval('#n', e => e.dispatchEvent(new Event('change', { bubbles: true })));
  await settle();
  ok((await page.$eval('#n', e => e.value)) === '1', 'после ухода из пустого поля оно не вернулось к числу');

  /* ---------- 9.1 focus ---------- */
  console.log('9.1 фокус переживает перерисовку');
  await go(page, '#/roll/std');
  await page.evaluate(() => document.querySelector('[data-act="roll"]').focus());
  await page.keyboard.press('Enter');
  await settle();
  ok((await page.evaluate(() => document.activeElement.dataset.act)) === 'roll',
     'после броска с клавиатуры фокус ушёл на ' + (await page.evaluate(() => document.activeElement.tagName)));
  await page.evaluate(() => document.querySelector('[data-act="src"]').focus());
  await page.keyboard.press('Enter');
  await settle();
  ok((await page.evaluate(() => document.activeElement.dataset.act)) === 'src',
     'после переключения источника фокус потерян');

  /* ---------- 9.2 live regions ---------- */
  console.log('9.2 объявление результата и тостов');
  ok(await page.$('.results[aria-live]'), 'у результата нет живой области');
  ok(await page.$eval('#toast', e => e.getAttribute('role') === 'status'), 'тост не объявляется');
  /* Switch types off one at a time — a render replaces the chips after every
     click, so they have to be looked up again each time. */
  for (let i = 0; i < 4; i++) {
    const on = await page.$$eval('[data-act="kind"].on', e => e.length);
    if (on <= 1) break;
    await page.evaluate(() => document.querySelector('[data-act="kind"].on').click());
    await settle();
  }
  ok((await page.$$eval('[data-act="kind"].on', e => e.length)) === 1, 'не осталось ровно одного типа');
  await page.evaluate(() => document.querySelector('[data-act="kind"].on').click());
  await settle();
  ok(await page.$eval('#toast', e => e.getAttribute('role') === 'alert' && !e.hidden),
     'отказ фильтра не объявлен как предупреждение');
  ok((await page.$$eval('.results .card', e => e.length)) > 0, 'последний тип всё-таки выключился');

  /* ---------- 9.3 headings ---------- */
  console.log('9.3 структура заголовков');
  await go(page, '#/roll/std');
  ok((await page.$eval('h1', e => e.textContent.trim())) === 'Обычные правила',
     'в имя заголовка затесались кнопки: ' + (await page.$eval('h1', e => e.textContent.trim())));
  ok((await page.$$eval('h3', e => e.length)) === 0, 'на странице есть h3 без h2');
  ok((await page.$$eval('h2', e => e.length)) > 0, 'названия предметов не стали h2');
  await page.close();

  /* ---------- 3.2 / 3.3 i18n of the chrome ---------- */
  console.log('3.2 ярлыки шапки и заголовок вкладки на языке');
  page = await mk(() => localStorage.setItem('dhloot.lang.v1', 'en'));
  await go(page, '#/tables');
  const cyr = await page.evaluate(() => [...document.querySelectorAll('[aria-label],[title]')]
    .map(e => e.getAttribute('aria-label') || e.getAttribute('title'))
    .filter(v => v && /[А-Яа-яЁё]/.test(v)));
  ok(!cyr.length, 'в английском режиме остались русские подписи: ' + cyr.slice(0, 4).join(', '));
  ok(!/[А-Яа-яЁё]/.test(await page.title()), 'заголовок вкладки остался русским: ' + await page.title());
  await page.close();

  /* ---------- 4.1 truncated share link ---------- */
  console.log('4.1 обрезанная ссылка на список');
  page = await mk(() => localStorage.setItem('dhloot.lists.v2', JSON.stringify(
    [{ id:'a', name:'Дивная добыча', ids:['ci1','ci2','ci3','ci4','ci5','cc1','cc2','cc3'], created:1 }])));
  await go(page, '#/lists/a');
  const full = await page.evaluate(() => location.hash.replace('#/l/', ''));
  await go(page, '#/l/' + full);
  ok(!(await page.$('[data-act="saveShared"]')), 'целая ссылка не опознана как своя');
  const cutUrl = full.slice(0, Math.floor(full.length * 0.75));
  await go(page, '#/l/' + cutUrl);
  const shownAsList = await page.evaluate(() =>
    !!document.querySelector('[data-act="saveShared"]') || !!document.querySelector('#rename'));
  ok(!shownAsList, 'обрезанная ссылка открылась как список меньшего размера');
  ok(await page.$eval('.page-sub', e => /повреждена|damaged|out of date|устарела/i.test(e.textContent)),
     'обрезанная ссылка не объяснила, что она битая');
  await page.close();

  /* ---------- 5.1 two tabs ---------- */
  console.log('5.1 две вкладки не затирают списки');
  page = await mk(() => localStorage.setItem('dhloot.lists.v2', JSON.stringify(
    [{ id:'base', name:'Общий', ids:['ci1'], created:1 }])));
  await go(page, '#/lists');
  // the other tab writes while this one is open and unaware
  await page.evaluate(() => {
    const cur = JSON.parse(localStorage.getItem('dhloot.lists.v2'));
    cur.unshift({ id: 'fromB', name: 'Из другой вкладки', ids: ['cc1'], created: 2 });
    localStorage.setItem('dhloot.lists.v2', JSON.stringify(cur));
  });
  await page.type('#lname', 'Из этой вкладки');
  await page.evaluate(() => document.querySelector('[data-act="createList"]').click());
  await settle();
  const names = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('dhloot.lists.v2')).map(l => l.name).sort().join('|'));
  ok(names === 'Из другой вкладки|Из этой вкладки|Общий',
     'вкладки затёрли друг друга, осталось: ' + names);
  // and deleting here must not be undone by the merge
  await page.evaluate(() => { window.confirm = () => true; });
  await go(page, '#/lists');
  await page.evaluate(() => {
    const card = [...document.querySelectorAll('[data-del-list]')]
      .find(b => b.closest('.listcard').textContent.indexOf('Общий') >= 0);
    if (card) card.click();
  });
  await settle();
  ok((await page.evaluate(() => JSON.parse(localStorage.getItem('dhloot.lists.v2')).some(l => l.name === 'Общий'))) === false,
     'удалённый список вернулся при слиянии');
  await page.close();

  /* ---------- 6.3 empty filter state ---------- */
  console.log('6.3 выход из пустой выдачи');
  page = await mk();
  await go(page, '#/tables/eq_armor/f_tier-1_src-hnf_line-uniq');
  ok(await page.$('.empty'), 'выдача не пуста, проверка не о том');
  ok(await page.$('.empty [data-val="reset"]'), 'в пустой выдаче нет кнопки сброса');
  await page.click('.empty [data-val="reset"]'); await settle();
  ok((await page.$$eval('.rows .row', e => e.length)) > 0, 'сброс из пустого состояния не вернул строки');

  /* ---------- 4.4 bogus hash ---------- */
  console.log('4.4 нечитаемый адрес не остаётся в строке');
  await go(page, '#/l/!!!not-base64!!!');
  ok((await page.evaluate(() => location.hash)) === '#/roll/std',
     'битый адрес остался в строке: ' + (await page.evaluate(() => location.hash)));
  await page.close();

  /* ---------- 6.4 unnamed list ---------- */
  console.log('6.4 список без названия не создаётся молча');
  page = await mk();
  await go(page, '#/lists');
  await page.evaluate(() => document.querySelector('[data-act="createList"]').click());
  await settle();
  ok((await page.evaluate(() => (localStorage.getItem('dhloot.lists.v2') || '[]'))) === '[]',
     'пустое имя создало список');
  // checked here and not below: the toast hides itself after a second and a half
  ok(await page.$eval('#toast', e => !e.hidden), 'пустое имя не объяснено');
  // 5.3: with storage refused the list still works for the session, but nothing
  // may report success on top of the failure notice
  const p2 = await mk(() => {
    const boom = () => { throw new Error('denied'); };
    Object.defineProperty(window, 'localStorage', { configurable: true,
      value: { getItem: boom, setItem: boom, removeItem: boom, clear: boom, key: boom, length: 0 } });
  });
  await go(p2, '#/lists');
  await p2.type('#lname', 'Временный');
  await p2.evaluate(() => document.querySelector('[data-act="createList"]').click());
  await settle();
  ok(await p2.$('.listgrid'), 'без хранилища список не создался даже на время сессии');
  ok(!/создан/.test(await p2.$eval('#toast', e => e.textContent)),
     'при неудачной записи всё равно отрапортовали об успехе');
  await p2.close();
  await page.close();

  /* ---------- a tile before its picture arrives ---------- */
  console.log('плитка без загруженной картинки');
  page = await mk(null, 360);
  await page.setRequestInterception(true);
  page.on('request', r => { if (/\/img\/.*\.webp$/.test(r.url())) return; r.continue(); });
  await go(page, '#/tables/eq_weapon');
  await page.evaluate(() => document.querySelector('[data-act="view"][data-val="grid"]').click());
  await new Promise(r => setTimeout(r, 700));
  const widths = await page.$$eval('.tilewrap .tile', e => [...new Set(e.map(x => Math.round(x.getBoundingClientRect().width)))]);
  ok(widths.length === 1 && widths[0] > 100,
     'без картинок плитки схлопнулись: ширины ' + widths.join(', '));
  const clash = await page.$$eval('.tilewrap', e => e.filter(w => {
    const n = w.querySelector('.tile-n'); if (!n) return false;
    const a = w.querySelector('.selbox').getBoundingClientRect(), b = n.getBoundingClientRect();
    return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  }).length);
  ok(clash === 0, 'галочка налезла на подпись у ' + clash + ' плиток');
  await page.close();

  /* ---------- every copied link shares one shape ---------- */
  console.log('ссылки на таблицу, фильтр и список');
  page = await mk(() => {
    window.isSecureContext = true; window.__clip = null;
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: s => { window.__clip = s; return Promise.resolve(); },
               write: () => Promise.resolve() } });
    localStorage.setItem('dhloot.lists.v2', JSON.stringify(
      [{ id:'a', name:'Клад', ids:['ci1'], created:1 }]));
  });
  const copied = async (sel) => {
    await page.evaluate(s => document.querySelector(s).click(), sel);
    await settle();
    return page.evaluate(() => window.__clip || '');
  };
  await go(page, '#/tables/eq_secondary');
  const tableLink = await copied('.toolbar [data-copy-sec]');
  await page.evaluate(() => document.querySelector('[data-act="eqOpen"]').click()); await settle();
  await page.evaluate(() => document.querySelector('.eqfilter [data-val="tier:3"]').click()); await settle();
  const filterLink = await copied('.eqlink');
  await go(page, '#/lists/a');
  const listLink = await copied('[data-share-list]');
  const shape = u => u.slice(0, u.indexOf('#'));
  ok(shape(tableLink) === shape(filterLink) && shape(filterLink) === shape(listLink),
     'ссылки собраны по-разному: ' + [shape(tableLink), shape(filterLink), shape(listLink)].join(' | '));
  ok(/f_tier-3/.test(filterLink), 'в ссылке на фильтры нет самого фильтра');
  await page.close();

  /* ---------- 6.1 the notice on a phone ---------- */
  console.log('6.1 предупреждение не занимает экран');
  page = await mk(() => localStorage.setItem('dhloot.lists.v2', JSON.stringify(
    [{ id:'a', name:'Клад', ids:['ci1'], created:1 }])), 320);
  await go(page, '#/lists/a');
  const warnH = await page.$eval('.warn', e => e.getBoundingClientRect().height);
  ok(warnH < 140, 'свёрнутое предупреждение занимает ' + Math.round(warnH) + 'px на экране 320px');
  ok(await page.$eval('.warn-x', e => e.getBoundingClientRect().width > 0),
     'крестик не виден, пока предупреждение свёрнуто');
  await page.close();

  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\nотчёт QA: все проверки прошли');
  process.exit(fail ? 1 : 0);
})();
