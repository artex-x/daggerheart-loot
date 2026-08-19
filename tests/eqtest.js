/* Equipment tables, their facets, and the shapes the entries take when copied. */
const puppeteer = require('puppeteer');
const ROOT = 'file://' + require('path').join(__dirname, '..', 'index.html');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL ' + m); } };

(async () => {
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
  const page = await browser.newPage();
  page.on('pageerror', e => { fail++; console.log('  FAIL страница упала: ' + e.message); });
  await page.setViewport({ width: 1180, height: 950 });
  await page.evaluateOnNewDocument(() => {
    window.isSecureContext = true; window.__clip = null;
    window.ClipboardItem = class { constructor(m){ this.map = m; } };
    Object.defineProperty(navigator, 'clipboard', {
      value: { write: i => { window.__clip = i[0].map; return Promise.resolve(); },
               writeText: s => { window.__clip = { 'text/plain': { text: async () => s } }; return Promise.resolve(); } } });
  });
  const go = async h => { await page.goto(ROOT + h, { waitUntil:'domcontentloaded' });
                          await new Promise(r => setTimeout(r, 550)); };
  const settle = () => new Promise(r => setTimeout(r, 250));
  const rows = () => page.$$eval('.rows .row', e => e.length);
  const clip = k => page.evaluate(async x => window.__clip && window.__clip[x] ? await window.__clip[x].text() : '', k);
  const open = async () => { if (!(await page.$('.eqfilter'))) { await page.click('[data-act="eqOpen"]'); await settle(); } };

  /* ---------- the data behind the tables ---------- */
  console.log('данные');
  await go('#/tables/eq_weapon');
  const d = await page.evaluate(() => {
    const eq = window.LOOT.eq;
    const byT = k => eq.filter(x => x.eq.t === k).length;
    return {
      n: eq.length, w: byT('weapon'), s: byT('secondary'), a: byT('armor'),
      wond: window.LOOT.items.wondrous.filter(x => x.eq).length,
      noCls: eq.filter(x => x.eq.t !== 'armor' && !x.eq.cls).length,
      names: new Set(eq.map(x => x.en)).size,
      firstT1: eq.filter(x => x.eq.t === 'weapon' && x.eq.tier === 1).slice(0, 3).map(x => x.en),
      // the book prints Core physical, Core magic, then the same for H&F
      seq: eq.filter(x => x.eq.t === 'weapon' && x.eq.tier === 1)
             .map(x => x.src + ':' + x.eq.cls).filter((v, i, a) => v !== a[i-1])
    };
  });
  ok(d.n === 381, 'снаряжения не 381: ' + d.n);
  ok(d.w === 239 && d.s === 73 && d.a === 69, 'разбивка по типам сбилась: ' + [d.w,d.s,d.a]);
  ok(d.names === 381, 'английские названия не уникальны: ' + d.names);
  ok(!d.noCls, 'у ' + d.noCls + ' единиц оружия нет класса');
  ok(d.wond === 11, 'в Wondrous размечено не 11 предметов');
  ok(d.seq.join(' ') === 'core:phy core:mag hnf:phy hnf:mag',
     'порядок в ранге 1 не как в книге: ' + d.seq.join(' '));
  ok(d.firstT1[0] === 'Broadsword', 'ранг 1 начинается не с Палаша: ' + d.firstT1);

  /* ---------- Wondrous stays in its own table ---------- */
  console.log('Wondrous только в своей таблице');
  ok((await rows()) === 239, 'в оружии не 239 строк: ' + (await rows()));
  ok(!(await page.$('[data-val="tier:0"]')), 'в фильтре остался ранг Wondrous');
  await go('#/tables/wondrous');
  ok((await rows()) === 119, 'таблица Wondrous потеряла позиции: ' + (await rows()));
  await go('#/i/w82');
  ok(await page.$eval('.card-meta', e => /Основное оружие/.test(e.textContent)),
     'у оружия из Wondrous пропал значок снаряжения');

  /* ---------- a magic weapon stays magic ---------- */
  console.log('класс оружия');
  await go('#/tables/eq_weapon');
  const gb = await page.evaluate(() => {
    const x = window.LOOT.eq.find(r => r.en === 'Ghostblade');
    return { cls: x.eq.cls, dt: x.eq.dt, id: x.id };
  });
  ok(gb.cls === 'mag' && gb.dt === 'any',
     'Призрачный Клинок должен быть магическим оружием с уроном физ/маг: ' + JSON.stringify(gb));
  await go('#/i/' + gb.id);
  const chips = await page.$$eval('.eqstats span', e => e.map(x => x.textContent));
  ok(chips[1] === 'Магическое' && /физ\/маг/.test(chips.join(' ')),
     'класс и тип урона не разведены: ' + chips.join('|'));

  /* ---------- facets: pick to narrow, empty row means any ---------- */
  console.log('фильтры');
  await go('#/tables/eq_weapon');
  ok(!(await page.$('.eqfilter')), 'фильтры открыты при заходе на страницу');
  ok(await page.$eval('.eqcount', e => e.textContent.trim() === '239'), 'нет счёта позиций');
  await open();
  ok((await page.$$eval('.eqfilter .chip.on', e => e.length)) === 0,
     'при чистом фильтре значения выглядят выбранными');
  ok((await page.$$eval('.eqfilter .lbl i', e => e.map(x => x.textContent))).every(x => x === 'любое'),
     'нетронутые строки не подписаны «любое»');
  ok(await page.$('[data-val="src:core"]') && await page.$('[data-val="src:hnf"]'),
     'нет фильтра по источнику');
  ok(!(await page.$('[data-val^="dtype:"]')), 'фильтр физ/маг остался отдельно');
  ok(!(await page.$('.eqclear')) && !(await page.$('.eqlink')),
     'сброс и ссылка показаны, хотя фильтр пуст');

  /* one click is all it takes to get down to a single tier */
  await page.click('.eqfilter [data-val="tier:2"]'); await settle();
  const t2 = await rows();
  ok(t2 === 67, 'один клик по рангу 2 дал не 67 строк: ' + t2);
  ok((await page.$$eval('.tsection', e => e.length)) === 1, 'остался не один раздел');
  ok(await page.$eval('.eqtoggle', e => /\(1\)/.test(e.textContent)), 'счётчик выбранного не положительный');
  ok(!/−/.test(await page.$eval('.eqtoggle', e => e.textContent)), 'счётчик снова показывает минус');
  ok(await page.$eval('.eqcount', e => /67 из 239/.test(e.textContent)), 'счёт найденного не обновился');
  ok(await page.$('.eqclear') && await page.$('.eqlink'), 'сброс и ссылка не появились рядом с выбранным');
  // both stay reachable with the panel folded — that is the point of moving them
  await page.click('[data-act="eqOpen"]'); await settle();
  ok(!(await page.$('.eqfilter')), 'панель не свернулась');
  ok(await page.$('.eqclear') && await page.$('.eqlink'), 'со свёрнутой панелью сброс и ссылка пропали');
  await page.click('[data-act="eqOpen"]'); await settle();

  /* values inside a row add up */
  await page.click('.eqfilter [data-val="tier:3"]'); await settle();
  ok((await rows()) > t2, 'второе значение в строке не расширило выборку');
  await page.click('.eqfilter [data-val="tier:3"]'); await settle();
  ok((await rows()) === t2, 'повторный клик не убрал значение');

  /* rows narrow each other */
  await page.click('.eqfilter [data-val="src:hnf"]'); await settle();
  const both = await rows();
  ok(both > 0 && both < t2, 'вторая строка фильтра не сузила выборку: ' + both);

  /* a pick can be dropped from the folded bar in one click */
  const pills = await page.$$eval('.eqpill', e => e.map(x => x.textContent.replace('×','')));
  ok(pills.length === 2 && pills.indexOf('Ранг 2') >= 0,
     'выбранное не показано плашками или номер ранга остался без подписи: ' + pills);
  await page.click('.eqpill[data-val="src:hnf"]'); await settle();
  ok((await rows()) === t2, 'крестик на плашке не снял значение');
  ok((await page.$$eval('.eqpill', e => e.length)) === 1, 'плашка не исчезла');

  /* a weapon that deals either kind of damage answers to both classes */
  await page.click('.eqclear'); await settle();
  ok((await rows()) === 239, 'сброс не вернул все строки');
  ok(!(await page.$('.eqclear')), 'сброс остался после сброса');
  await open();
  await page.click('.eqfilter [data-val="cls:phy"]'); await settle();
  const phyNames = await page.$$eval('.rows .row b', e => e.map(x => x.textContent));
  ok(phyNames.indexOf('Призрачный Клинок') < 0,
     'магическое оружие с физическим уроном попало в физический фильтр');
  ok(phyNames.indexOf('Палаш') >= 0, 'Палаш выпал из физического фильтра');
  await page.click('.eqfilter [data-val="cls:phy"]'); await settle();
  await page.click('.eqfilter [data-val="cls:mag"]'); await settle();
  const magNames = await page.$$eval('.rows .row b', e => e.map(x => x.textContent));
  ok(magNames.indexOf('Призрачный Клинок') >= 0, 'магическое оружие выпало из магического фильтра');
  ok(magNames.indexOf('Палаш') < 0, 'в магическое оружие попал Палаш');

  /* ---------- the filter as a link ---------- */
  console.log('ссылка на фильтры');
  await page.click('[data-act="eqLink"]'); await settle();
  const url = await clip('text/plain');
  ok(/#\/tables\/eq_weapon\/f_/.test(url), 'ссылка не несёт состояние фильтров: ' + url);
  await go(url.slice(url.indexOf('#')));
  ok(await page.$('.eqfilter'), 'по ссылке фильтры не раскрылись');
  ok(await page.$eval('.eqfilter [data-val="cls:mag"]', e => e.classList.contains('on')),
     'ссылка не восстановила выбранные значения');

  /* ---------- arriving by a filter link ---------- */
  console.log('переход по ссылке на фильтры');
  await go('#/tables/eq_weapon/f_tier-2-3-4_trait-strength_burden-2');
  const viaLink = await rows();
  ok(viaLink > 0, 'по ссылке ничего не нашлось');
  ok(await page.$('.eqfilter'), 'по ссылке фильтры не раскрылись');
  // the panel used to reopen on every render because the address was read back
  await page.click('[data-act="eqOpen"]'); await settle();
  ok(!(await page.$('.eqfilter')), 'фильтры не закрываются после перехода по ссылке');
  await page.click('[data-act="eqOpen"]'); await settle();
  // and a chip clicked itself back to whatever the link said
  await page.click('.eqfilter [data-val="tier:2"]'); await settle();
  ok((await rows()) !== viaLink, 'клик по чипу откатился к состоянию из ссылки');
  ok(await page.evaluate(() => location.hash.indexOf('tier-3-4') > 0),
     'адрес не поехал за фильтром: ' + await page.evaluate(() => location.hash));
  await page.click('.eqclear'); await settle();
  ok(await page.evaluate(() => location.hash === '#/tables/eq_weapon'),
     'после сброса в адресе остался фильтр');

  /* ---------- section anchors ---------- */
  console.log('якоря разделов');
  await go('#/tables/eq_weapon/t2');
  ok(await page.evaluate(() => !!document.getElementById('sec-t2')), 'раздел ранга 2 не найден');
  ok(await page.evaluate(() => location.hash === '#/tables/eq_weapon/t2'), 'адрес с якорем не удержался');
  const scrolled = await page.evaluate(() => window.scrollY);
  ok(scrolled > 100, 'страница не прокрутилась к разделу: ' + scrolled);

  /* ---------- each kind of gear reads as its own ---------- */
  console.log('цвета по видам');
  const tone = async (hash) => {
    await go(hash);
    return page.$$eval('.rows .row .rstats', e => [...new Set(e.map(x => getComputedStyle(x).color))]);
  };
  const cw = await tone('#/tables/eq_weapon');
  const cs = await tone('#/tables/eq_secondary');
  const ca = await tone('#/tables/eq_armor');
  // the stat line keeps one tone everywhere: three colours of numbers was noise
  ok(new Set([].concat(cw, cs, ca)).size === 1,
     'характеристики окрашены по-разному: ' + [cw, cs, ca].join(' | '));
  // the kind is told by the badge instead
  const badge = async (hash) => { await go(hash);
    return page.$$eval('.rows .badge[class*="eq-"]',
      e => [...new Set(e.map(x => x.className.match(/eq-\w+/)[0] + ':' + getComputedStyle(x).color))]); };
  const bw = await badge('#/tables/eq_weapon');
  const bs = await badge('#/tables/eq_secondary');
  const ba = await badge('#/tables/eq_armor');
  ok(bw.length === 1 && bs.length === 1 && ba.length === 1, 'в таблице ярлыки разных видов');
  ok(bw[0].indexOf('eq-weapon') === 0 && bs[0].indexOf('eq-secondary') === 0 && ba[0].indexOf('eq-armor') === 0,
     'ярлык помечен не своим классом: ' + [bw[0], bs[0], ba[0]].join(' | '));
  ok(new Set([bw[0].split(':')[1], bs[0].split(':')[1], ba[0].split(':')[1]]).size === 3,
     'ярлыки трёх видов одного цвета: ' + [bw[0], bs[0], ba[0]].join(' | '));

  /* ---------- copying ---------- */
  console.log('копирование');
  await go('#/i/q17');   // Hallowed Axe: magic weapon with no feature
  const q1 = await page.evaluate(() => window.LOOT.eq.find(r => r.en === 'Broadsword').id);
  await go('#/i/' + q1);
  await page.click('[data-copy-full]'); await settle();
  const txt = await clip('text/plain');
  ok(/^Палаш\nОсновное оружие · Ранг 1 · Физическое · Проворность · Вплотную · d8 физ · Одноручное\n\nНадёжное: \+1 к Броскам Атаки$/.test(txt),
     'текст собран иначе:\n' + JSON.stringify(txt));
  const html = await clip('text/html');
  ok(/<i>Надёжное:<\/i>/.test(html), 'свойство не курсивом: ' + html.slice(0, 200));
  ok(!/<b>Надёжное/.test(html), 'свойство осталось жирным');

  // attached blocks get a blank line of their own
  await go('#/i/w1');
  await page.click('[data-copy-full]'); await settle();
  const ref = await clip('text/plain');
  ok(/\n\n[^\n]+\n/.test(ref.split('\n\n').slice(2).join('\n\n')) || ref.split('\n\n').length >= 3,
     'вложенный блок не отделён пустой строкой:\n' + ref);
  const refHtml = await clip('text/html');
  ok(/<br><br><i>/.test(refHtml), 'в html вложенный блок прижат к описанию');

  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\nснаряжение: все проверки прошли');
  process.exit(fail ? 1 : 0);
})();
