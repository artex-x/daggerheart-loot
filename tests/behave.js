/* Behaviour the layout sweep cannot see: what a roll may return, what search
   finds, the language switch, navigation back and forth, the copy buttons,
   the keyboard, and what happens when the browser refuses to store anything. */
const puppeteer = require('puppeteer');
const ROOT = 'file://' + require('path').join(__dirname, '..', 'index.html');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL ' + m); } };

(async () => {
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
  /* Each block gets its own context: pages of one browser share localStorage,
     so without this the language block leaked English into everything after it
     — which is exactly how these three checks first went red. */
  const newPage = async (before) => {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    page.on('pageerror', e => { fail++; console.log('  FAIL страница упала: ' + e.message); });
    await page.setViewport({ width: 1180, height: 950 });
    await page.evaluateOnNewDocument(() => {
      // seeded once, so a reload can be used to check what the app remembered
      if (!localStorage.getItem('dhloot.seeded')) {
        localStorage.setItem('dhloot.seeded', '1');
        localStorage.setItem('dhloot.lang.v1', 'ru');
      }
      window.isSecureContext = true; window.__clip = null; window.__shared = null;
      window.ClipboardItem = class { constructor(m){ this.map = m; } };
      Object.defineProperty(navigator, 'clipboard', {
        value: { write: i => { window.__clip = i[0].map; return Promise.resolve(); },
                 writeText: s => { window.__clip = { 'text/plain': { text: async () => s } }; return Promise.resolve(); } } });
      navigator.share = o => { window.__shared = o; return Promise.resolve(); };
      navigator.canShare = () => true;
    });
    if (before) await page.evaluateOnNewDocument(before);
    return page;
  };
  const settle = () => new Promise(r => setTimeout(r, 260));
  const go = async (page, h) => { await page.goto(ROOT + h, { waitUntil: 'domcontentloaded' });
                                  await new Promise(r => setTimeout(r, 520));
                                  await page.evaluate(() => window.scrollTo(0, 0)); };
  const clip = (page, k) => page.evaluate(async x =>
    window.__clip && window.__clip[x] ? await window.__clip[x].text() : '', k);

  /* ---------- what a roll may return ---------- */
  console.log('броски');
  let page = await newPage();
  await go(page, '#/roll/std');

  // every number in the table has something behind it, in every source mix
  const std = await page.evaluate(() => {
    const out = { holes: [], counts: {} };
    for (let n = 1; n <= 60; n++) {
      document.getElementById('n').value = n;
      document.getElementById('n').dispatchEvent(new Event('input', { bubbles: true }));
      const cards = document.querySelectorAll('.results .card');
      out.counts[cards.length] = (out.counts[cards.length] || 0) + 1;
      if (!cards.length) out.holes.push(n);
    }
    return out;
  });
  await settle();
  ok(!std.holes.length, 'на числах ' + std.holes.slice(0, 5) + ' бросок ничего не выдаёт');
  ok(Object.keys(std.counts).join() === '4', 'бросок выдаёт не 4 варианта: ' + JSON.stringify(std.counts));

  // switching a source off has to remove exactly that source from the results
  await page.click('[data-act="src"][data-val="hnf"]'); await settle();
  const srcs = await page.$$eval('.results .badge.src', e => e.map(x => x.textContent));
  ok(srcs.length === 2 && srcs.every(s => s === 'Core'), 'выключенный источник всё ещё в выдаче: ' + srcs);
  await page.click('[data-act="kind"][data-val="consumable"]'); await settle();
  const kinds = await page.$$eval('.results .badge.item, .results .badge.cons', e => e.map(x => x.textContent));
  ok(kinds.length === 1 && kinds[0] === 'Предмет', 'выключенный тип всё ещё в выдаче: ' + kinds);
  // and the last one may not be switched off
  await page.click('[data-act="kind"][data-val="item"]'); await settle();
  ok((await page.$$eval('.results .card', e => e.length)) > 0, 'удалось выключить оба типа');

  // the dice button follows the number of sides that actually exist
  await go(page, '#/roll/wondrous');
  const wond = await page.evaluate(() => {
    const out = [];
    for (const n of [1, 60, 119]) {
      document.getElementById('n').value = n;
      document.getElementById('n').dispatchEvent(new Event('input', { bubbles: true }));
      out.push(document.querySelectorAll('.results .card').length);
    }
    return out;
  });
  ok(wond.join() === '1,1,1', 'wondrous отдаёт не по одной позиции: ' + wond);
  ok(/119/.test(await page.$eval('[data-act="roll"]', e => e.textContent)),
     'кнопка броска не сообщает диапазон 1–119');

  await go(page, '#/roll/community');
  const comm = await page.$$eval('.results .card', e => e.length);
  ok(comm === 1, 'сообщество отдаёт не одну позицию');

  // a critical success offers the way up
  await go(page, '#/roll/alt');
  await page.evaluate(() => {
    for (const id of ['hope', 'fear']) {
      const el = document.getElementById(id);
      el.value = 7; el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await settle();
  ok(await page.$('.crit-acts'), 'при совпадении костей нет блока критического успеха');
  await page.close();

  /* ---------- search ---------- */
  console.log('поиск');
  page = await newPage();
  await go(page, '#/search');
  const find = async q => {
    await page.$eval('#sq', (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, q);
    await settle();
    return page.$$eval('.rows .row b', e => e.map(x => x.textContent));
  };
  ok((await find('катана')).length >= 4, 'поиск по русскому названию не находит катану');
  ok((await find('katana')).length >= 4, 'поиск по английскому названию не находит катану');
  ok((await find('стресс')).length > 20, 'поиск по описанию находит слишком мало');
  ok((await find('двуручное')).length > 20, 'поиск по характеристикам ничего не даёт');
  ok((await find('КаТаНа')).length >= 4, 'поиск чувствителен к регистру');
  ok((await find('жжжж')).length === 0, 'поиск находит несуществующее');
  ok(await page.$('.empty'), 'нет сообщения о пустой выдаче');
  await find('меч');
  const before = (await page.$$eval('.rows .row', e => e.length));
  await page.click('[data-act="kind"][data-val="equip"]'); await settle();
  const after = (await page.$$eval('.rows .row', e => e.length));
  ok(after < before, 'фильтр типа не влияет на поиск');
  ok((await page.$$eval(".rows .badge[class*='eq-']", e => e.length)) === 0,
     'после выключения типа остались строки с ярлыком снаряжения');
  // including the Wondrous entries that are weapons: the badge is the promise
  ok((await find('снежный')).length === 0,
     'оружие из Wondrous не подчиняется фильтру «Снаряжение»');
  await page.click('[data-act="kind"][data-val="equip"]'); await settle();
  ok((await find('снежный')).length === 1, 'снаряжение из Wondrous не ищется');
  await page.close();

  /* ---------- language ---------- */
  console.log('язык');
  page = await newPage();
  await go(page, '#/tables/eq_weapon');
  ok(await page.$eval('#langSeg button.on', e => e.textContent === 'RU'), 'страница открылась не по-русски');
  const en = async () => page.evaluate(() => {
    [...document.querySelectorAll('#langSeg button')].find(b => b.dataset.lang === 'en').click();
  });
  await en(); await settle();
  ok(await page.$eval('.page-h', e => /Tables/.test(e.textContent)), 'интерфейс не переключился на английский');
  ok(await page.$eval('.rows .row b', e => e.textContent === 'Broadsword'), 'названия остались русскими');
  ok(await page.evaluate(() => document.documentElement.lang === 'en'), 'lang документа не обновился');
  // the choice has to survive a reload and a link
  await go(page, '#/i/w1');
  ok(await page.$eval('.card-name', e => /Abyssal Sap/.test(e.textContent)), 'язык не пережил переход');
  await page.reload({ waitUntil: 'domcontentloaded' }); await new Promise(r => setTimeout(r, 520));
  ok(await page.$eval('.card-name', e => /Abyssal Sap/.test(e.textContent)), 'язык не пережил перезагрузку');
  ok(await page.$eval('#langSeg button.on', e => e.textContent === 'EN'), 'переключатель показывает не тот язык');
  await page.close();

  /* ---------- what outlives a reload, and what must not ---------- */
  console.log('запомненные настройки');
  page = await newPage();
  const reload = async () => { await page.reload({ waitUntil: 'domcontentloaded' });
                               await new Promise(r => setTimeout(r, 560)); };

  // the layout is remembered
  await go(page, '#/tables/wondrous');
  ok(await page.$('.rows'), 'таблица открылась не списком');
  await page.click('[data-act="view"][data-val="grid"]'); await settle();
  ok(await page.$('.tgrid'), 'вид не переключился на сетку');
  await reload();
  ok(await page.$('.tgrid'), 'вид сетки не пережил перезагрузку');
  // and it is one choice for every table, not one per table
  await go(page, '#/tables/eq_weapon');
  ok(await page.$('.tgrid'), 'на другой таблице вид снова списком');

  /* Everything that changes what is shown or asked starts fresh. A filter
     brought back from yesterday is state nobody remembers setting. */
  await go(page, '#/search');
  await page.click('[data-act="kind"][data-val="equip"]'); await settle();
  await reload();
  ok(await page.$eval('[data-act="kind"][data-val="equip"]', e => e.classList.contains('on')),
     'выключенный тип пережил перезагрузку, хотя фильтры должны сбрасываться');

  await go(page, '#/roll/std');
  await page.click('[data-act="src"][data-val="hnf"]'); await settle();
  await reload();
  ok(await page.$eval('[data-act="src"][data-val="hnf"]', e => e.classList.contains('on')),
     'выключенный источник пережил перезагрузку');
  await page.$eval('#n', e => { e.value = '42'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await settle();
  await reload();
  ok(await page.$eval('#n', e => e.value !== '42'), 'номер броска запомнился, хотя не должен');

  await go(page, '#/roll/alt');
  await page.click('[data-act="rarity"][data-val="rare"]'); await settle();
  await reload();
  ok(await page.$eval('[data-act="rarity"][data-val="rare"]', e => !e.classList.contains('on')),
     'выбранная редкость запомнилась, хотя это вопрос текущего броска');

  await go(page, '#/roll/community');
  await page.click('[data-act="comm"][data-val="Seaborne"]'); await settle();
  await reload();
  ok(await page.$eval('[data-act="comm"][data-val="Seaborne"]', e => !e.classList.contains('on')),
     'выбранное сообщество запомнилось');

  /* Nothing but the layout is kept, so the stored blob stays that small: how a
     table is laid out. Anything answering "what am I doing this minute" is
     asked again, and note heights answer themselves from the text (#12). */
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('dhloot.prefs.v1') || '{}'));
  ok(Object.keys(kept).sort().join() === 'view', 'в настройках хранится лишнее: ' + Object.keys(kept));
  await page.close();

  /* ---------- storage that lies ---------- */
  console.log('испорченные настройки');
  page = await newPage(() => {
    localStorage.setItem('dhloot.prefs.v1', JSON.stringify({ view: 'зигзагом', kind: 'нет' }));
  });
  await go(page, '#/tables/wondrous');
  ok(await page.$('.rows'), 'при испорченных настройках вид не вернулся к списку');
  ok((await page.$$eval('.rows .row', e => e.length)) === 119, 'таблица пуста при испорченных настройках');
  await page.close();
  page = await newPage(() => localStorage.setItem('dhloot.prefs.v1', '{'));
  await go(page, '#/tables/wondrous');
  ok(await page.$('.rows'), 'сломанный json настроек уронил страницу');
  await page.close();

  /* ---------- the section the app opens on ---------- */
  console.log('стартовый раздел');
  page = await newPage();
  await go(page, '#/roll/std');
  ok((await page.$$eval('#tabs a .n', e => e.length)) === 0, 'на вкладках остались номера');
  ok(await page.$('.page-head .homebtn'), 'нет кнопки стартового раздела');
  ok(await page.$eval('.page-head .homebtn', e => e.classList.contains('on')),
     'по умолчанию стартовым не отмечены обычные правила');

  await go(page, '#/search');
  ok(!(await page.$eval('.page-head .homebtn', e => e.classList.contains('on'))),
     'поиск отмечен стартовым, хотя его не выбирали');
  await page.evaluate(() => document.querySelector('.page-head .homebtn').click());
  await settle();
  ok(await page.$eval('.page-head .homebtn', e => e.classList.contains('on')), 'выбор не отметился');
  ok(await page.evaluate(() => localStorage.getItem('dhloot.home.v1') === '#/search'),
     'выбор не сохранился');

  // opened with no address at all — that is when the setting has to work
  await page.goto(ROOT, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 620));
  ok(await page.$('#sq'), 'приложение открылось не на поиске');

  // a table by name works too
  await go(page, '#/tables/eq_armor');
  await page.evaluate(() => document.querySelector('.page-head .homebtn').click());
  await settle();
  await page.goto(ROOT, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 620));
  ok(await page.$eval('.chips .chip.on', e => e.textContent === 'Броня'),
     'приложение открылось не на выбранной таблице');

  // pressing the marked one puts the default back
  await page.evaluate(() => document.querySelector('.page-head .homebtn').click());
  await settle();
  ok(await page.evaluate(() => !localStorage.getItem('dhloot.home.v1')), 'повторный клик не сбросил выбор');
  await page.goto(ROOT, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 620));
  ok(await page.$eval('.page-h', e => /Обычные правила/.test(e.textContent)),
     'после сброса приложение открылось не на обычных правилах');

  // a single item is not a section, so it cannot be pinned
  await go(page, '#/i/w1');
  ok(!(await page.$('.homebtn')), 'кнопку стартового раздела предложили на карточке предмета');
  await page.close();

  /* ---------- moving back and forth ---------- */
  console.log('навигация');
  page = await newPage();
  await go(page, '#/roll/std');
  await page.evaluate(() => { location.hash = '#/tables/eq_armor'; }); await settle();
  await page.evaluate(() => { location.hash = '#/search'; }); await settle();
  await page.goBack(); await new Promise(r => setTimeout(r, 520));
  ok(await page.$eval('.chips .chip.on', e => e.textContent === 'Броня'), 'назад вернуло не ту таблицу');
  await page.goForward(); await new Promise(r => setTimeout(r, 520));
  ok(await page.$('#sq'), 'вперёд не вернуло поиск');
  // a modal belongs to the page it was opened from
  await go(page, '#/tables/core_item');
  await page.evaluate(() => document.querySelector('[data-open]').click()); await settle();
  ok(await page.evaluate(() => !document.querySelector('#modal').hidden), 'модалка не открылась');
  await page.evaluate(() => { location.hash = '#/search'; }); await settle();
  ok(await page.evaluate(() => document.querySelector('#modal').hidden), 'модалка пережила переход');
  // and Escape closes it
  await go(page, '#/tables/core_item');
  await page.evaluate(() => document.querySelector('[data-open]').click()); await settle();
  await page.keyboard.press('Escape'); await settle();
  ok(await page.evaluate(() => document.querySelector('#modal').hidden), 'Escape не закрывает модалку');
  await page.close();

  /* ---------- the copy buttons ---------- */
  console.log('копирование и отправка');
  page = await newPage();
  await go(page, '#/i/w1');
  await page.evaluate(() => document.querySelector('[data-copy-name]').click()); await settle();
  // the suffix is deliberate: outside the app a bare name loses its badge
  ok((await clip(page, 'text/plain')) === 'Смола Бездны (расходник)',
     'кнопка названия копирует не название');
  await page.evaluate(() => document.querySelector('[data-share]').click()); await settle();
  const link = await clip(page, 'text/plain');
  ok(/\/i\/w1|#\/i\/w1/.test(link), 'кнопка ссылки копирует не ссылку: ' + link);
  await page.evaluate(() => document.querySelector('[data-copy-full]').click()); await settle();
  const full = await clip(page, 'text/plain');
  ok(/Смола Бездны/.test(full) && /Неистовое опутывание/.test(full),
     'в текст не попала упомянутая карта');
  await page.evaluate(() => document.querySelector('[data-send]').click()); await settle();
  const shared = await page.evaluate(() => window.__shared);
  ok(shared && /Смола Бездны/.test(shared.text || ''), 'отправка ушла без текста');
  await page.close();

  /* ---------- storage refused ---------- */
  console.log('хранилище недоступно');
  page = await newPage(() => {
    const boom = () => { throw new Error('denied'); };
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: { getItem: boom, setItem: boom, removeItem: boom, clear: boom, key: boom, length: 0 }
    });
  });
  await go(page, '#/lists');
  ok(await page.$('.warn'), 'нет предупреждения о заблокированном хранилище');
  ok(!(await page.$('.warn-x')), 'предупреждение о блокировке можно закрыть, хотя запомнить это негде');
  await page.type('#lname', 'Проверка');
  await page.evaluate(() => document.querySelector('[data-act="createList"]').click()); await settle();
  ok(await page.$('.listgrid'), 'без хранилища список не создался даже на время сессии');
  await go(page, '#/tables/eq_weapon');
  ok((await page.$$eval('.rows .row', e => e.length)) > 0, 'без хранилища перестали работать таблицы');
  await page.close();

  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\nповедение: все проверки прошли');
  process.exit(fail ? 1 : 0);
})();
