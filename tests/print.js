/* Печать карточек (#20): сетка, размеры, вёрстка карты, точки входа. */
const puppeteer = require('puppeteer');
const { ready } = require('./lib.js');
const ROOT = 'file://' + require('path').join(__dirname, '..', 'index.html');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL ' + m); } };
const MM = 96 / 25.4;   // css-пиксель на миллиметр

(async () => {
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
  const page = await browser.newPage();
  page.on('pageerror', e => { fail++; console.log('  FAIL страница упала: ' + e.message); });
  await page.setViewport({ width: 1180, height: 950 });
  const go = async h => { await page.goto(ROOT + h, { waitUntil:'domcontentloaded' }); await ready(page); };
  const settle = () => new Promise(r => setTimeout(r, 250));

  /* ---------- размер карты ----------
     63x88 мм - размер игральной карты: под него продаются протекторы и коробки.
     Ошибиться тут нельзя, поэтому размер проверяется в миллиметрах, а не «на
     глаз по картинке». */
  console.log('размер и сетка');
  await go('#/print/ci1-ci2-ci3-w7-w1-q1-voa1_t1a-cc1-f1');
  const box = await page.$eval('.pcard', e => {
    const r = e.getBoundingClientRect(); return { w: r.width, h: r.height };
  });
  ok(Math.abs(box.w / MM - 63) < 0.4, 'ширина карты не 63 мм: ' + (box.w / MM).toFixed(2));
  ok(Math.abs(box.h / MM - 88) < 0.4, 'высота карты не 88 мм: ' + (box.h / MM).toFixed(2));

  ok((await page.$$eval('.psheet', e => e.length)) === 1, 'девять карт легли не на один лист');
  ok((await page.$$eval('.pcard', e => e.length)) === 9, 'на листе не девять мест');
  /* Лист - целая A4: поля внутри него, а не у страницы, иначе третий столбец
     уезжает на следующий лист. */
  const sheet = await page.$eval('.psheet', e => {
    const r = e.getBoundingClientRect(); return { w: r.width, h: r.height };
  });
  ok(Math.abs(sheet.w / MM - 210) < 0.6 && Math.abs(sheet.h / MM - 297) < 0.6,
     'лист не A4: ' + (sheet.w / MM).toFixed(1) + 'x' + (sheet.h / MM).toFixed(1));
  /* Между картами зазор: по нему и режут, а рамка карты остаётся видимой */
  const gap = await page.evaluate(() => {
    const c = document.querySelectorAll('.pcard');
    return c[1].getBoundingClientRect().left - c[0].getBoundingClientRect().right;
  });
  ok(gap / MM > 1 && gap / MM < 4, 'зазор между картами не под рез: ' + (gap / MM).toFixed(2) + ' мм');

  /* Десятая карта заводит второй лист, а пустые места добиваются до девяти:
     по полной сетке резать ровнее. */
  console.log('несколько листов');
  await go('#/print/ci1-ci2-ci3-ci4-ci5-ci6-ci7-ci8-ci9-ci10');
  ok((await page.$$eval('.psheet', e => e.length)) === 2, 'десятая карта не завела второй лист');
  ok((await page.$$eval('.pcard', e => e.length)) === 18, 'второй лист не добит до девяти мест');
  ok((await page.$$eval('.pcard.blank', e => e.length)) === 8, 'пустых мест не восемь');
  ok(await page.$('.psheet[data-next]'), 'второй лист не помечен как начало страницы');
  /* На третий лист - двадцатая карта, и каждый лист остаётся ровно A4 */
  await go('#/print/' + Array.from({ length: 20 }, (_, i) => 'ci' + (i + 1)).join('-'));
  const heights = await page.$$eval('.psheet', e => e.map(x => x.getBoundingClientRect().height));
  ok(heights.length === 3, 'двадцать карт легли не на три листа: ' + heights.length);
  ok(heights.every(h => Math.abs(h / (96 / 25.4) - 297) < 0.6), 'какой-то лист не A4: ' + heights);

  /* Весь Wondrous разом - 119 карточек - помещается: прежний предел в 54
     обрезал ровно этот случай, и обрезал молча. */
  console.log('большой набор');
  const many = await page.evaluate(() => window.LOOT.items.wondrous.map(x => x.id));
  await go('#/print/' + many.join('-'));
  ok((await page.$$eval('.pcard:not(.blank)', e => e.length)) === many.length,
     'весь Wondrous не поместился: ' + (await page.$$eval('.pcard:not(.blank)', e => e.length)) +
     ' из ' + many.length);
  ok(!(await page.$('.warnnote')), 'предупреждение об обрезке на наборе, который поместился');
  /* А если всё-таки не влезло - об этом говорят, а не отбрасывают втихую */
  const tooMany = many.concat(await page.evaluate(() => window.LOOT.items.voa.map(x => x.id)))
                      .concat(await page.evaluate(() => window.LOOT.items.community.map(x => x.id)));
  await go('#/print/' + tooMany.join('-'));
  ok(await page.$('.warnnote'), 'набор обрезан молча, без предупреждения');

  /* ---------- вёрстка карты ----------
     По макету печатной карты: лента ранга, ладони хвата, пара плашек, имя
     прописными, полоса характеристик в рамке, текст, подпись с книгой. */
  console.log('вёрстка карты');
  await go('#/print/q1');
  const parts = await page.evaluate(() => {
    const q = s => { const e = document.querySelector(s); return e && e.textContent.trim(); };
    return { tier: q('.pc-tier'), tags: [...document.querySelectorAll('.pc-tag')].map(x => x.textContent.trim()),
             name: q('.pc-name'), text: q('.pc-text'), cells: q('.pc-cells'),
             bottom: q('.pc-bottom'), hands: document.querySelectorAll('.pc-burden img').length,
             ribbon: !!document.querySelector('.pc-ribbon'), die: q('.pc-die') };
  });
  ok(/^1/.test(parts.tier || ''), 'в ленте не ранг: ' + parts.tier);
  ok(/ОРУЖИЕ/i.test(parts.tags[0] || ''), 'на первой плашке не вид вещи: ' + parts.tags);
  ok(/ФИЗИЧЕСК/i.test(parts.tags[1] || ''), 'на второй плашке не класс: ' + parts.tags);
  ok(parts.name === 'Палаш', 'имя на карте другое: ' + parts.name);
  ok(/Надёжное/.test(parts.text), 'нет текста свойства');
  ok(parts.die === 'd8', 'на кости не тот урон: ' + parts.die);
  ok(parts.ribbon, 'полоса характеристик без рамки');
  ok(/Проворность/i.test(parts.cells) && /Вплотную/i.test(parts.cells),
     'в полосе характеристик нет черты или дистанции: ' + parts.cells);
  ok(parts.hands === 2, 'ладоней хвата не две: ' + parts.hands);

  /* Ладони - пара, левая и правая: правая стояла дважды, и хват в две руки
     выглядел как две правые ладони. Занятость - это заливка, а не форма. */
  const hands = () => page.$$eval('.pc-burden img',
    e => e.map(x => x.getAttribute('src').replace(/^.*\//, '')));
  await go('#/print/w51');                              // хват в две руки
  let hh = await hands();
  ok(/-l-/.test(hh[0]) && /-r-/.test(hh[1]), 'ладони не пара: ' + hh.join(' и '));
  ok(hh.every(h => /-used/.test(h)), 'при хвате в две руки ладонь свободна: ' + hh.join(' и '));
  await go('#/print/w7');                               // хват в одну
  hh = await hands();
  ok(/-l-free/.test(hh[0]) && /-r-used/.test(hh[1]),
     'при хвате в одну руку не одна свободная ладонь: ' + hh.join(' и '));
  ok(/Daggerheart/.test(parts.bottom) && /Core/i.test(parts.bottom),
     'в подписи нет книги: ' + parts.bottom);
  /* У вещи сообщества подпись называет книгу, а не только само сообщество:
     карта уезжает на стол одна, и «Великородное» не говорит, откуда она. */
  await go('#/print/cm1');
  const commBottom = await page.$eval('.pc-bottom', e => e.textContent);
  ok(/Сообществ/i.test(commBottom) && /Великородное/.test(commBottom),
     'на карте сообщества нет книги: ' + commBottom);

  /* Урон с бонусом: «d6 +2» рядом с костью, а не цифрой поверх неё */
  await go('#/print/w7');
  ok((await page.$eval('.pc-die', e => e.textContent.trim())) === 'd6', 'бонус урона залез на кость');
  ok((await page.$eval('.pc-bonus', e => e.textContent.trim())) === '+2', 'бонус урона не показан отдельно');

  /* «Универсальное» - это второй набор характеристик, и в книге он спрятан в
     прозе свойства. На карте он стоит второй полосой, как в макете. */
  console.log('универсальное оружие');
  await go('#/print/q23');
  const strips = await page.$$eval('.pc-strip .pc-cells', e => e.map(x => x.textContent));
  ok(strips.length === 2, 'у универсального оружия не две полосы: ' + strips.length);
  ok(/Далеко/i.test(strips[0]) && /Вплотную/i.test(strips[1]),
     'вторая полоса повторяет первую: ' + strips.join(' | '));
  const dice = await page.$$eval('.pc-die', e => e.map(x => x.textContent.trim()));
  ok(dice.join() === 'd6,d8', 'кости двух полос не из книги: ' + dice.join());

  /* Форма кости своя у каждой кости, а цвет - у типа урона: физический
     золотой, магический сине-фиолетовый. */
  console.log('кость по типу урона');
  await go('#/print/q1');
  ok(/die-d8-phy\.svg$/.test(await page.$eval('.pc-die img', e => e.getAttribute('src'))),
     'у физического d8 не своя кость');
  await go('#/print/q35');
  const md = await page.$$eval('.pc-die img', e => e.map(x => x.getAttribute('src')));
  ok(/die-d6-mag\.svg$/.test(md[0]), 'у магического d6 не магическая кость: ' + md[0]);
  ok(await page.$('.pc-die.mag'), 'магическая кость не помечена классом');
  /* У каждой кости своя форма, и ни одна не рисуется общим шестиугольником:
     d4 и d12 когда-то попадали именно в него и выглядели чужими. */
  const DICE = [['q241','d4'],['q13','d6'],['q1','d8'],['q2','d10'],['q6','d12'],['q143','d20']];
  for (const [id, die] of DICE) {
    await go('#/print/' + id);
    const src = await page.$eval('.pc-die img', e => e.getAttribute('src'));
    ok(new RegExp('die-' + die + '-(phy|mag)\\.svg$').test(src),
       die + ' взял чужую форму: ' + src);
    ok(await page.$('.pc-die.own'), die + ' нарисован общим шестиугольником');
  }

  /* Значения в полосе не обрезаются многоточием: они ужимаются шрифтом */
  await go('#/print/q129');
  const cut = await page.$$eval('.pc-box b', e => e.filter(function (x) {
    const r = document.createRange(); r.selectNodeContents(x);
    return r.getBoundingClientRect().width > x.clientWidth + 1;
  }).map(x => x.textContent));
  ok(!cut.length, 'значение в полосе обрезано: ' + cut.join(', '));

  /* Броня считается иначе: вместо хвата - щит с Показателем Брони, вместо
     урона - шкала порогов. */
  console.log('броня');
  await go('#/print/q313');
  ok(!(await page.$('.pc-burden')), 'у брони завелись ладони хвата');
  const shield = await page.$eval('.pc-shield', e => e.textContent.trim());
  ok(/^3/.test(shield), 'на щите не Показатель Брони: ' + shield);
  ok(/БРОНЯ/i.test(shield), 'на щите нет слова: ' + shield);
  const th = await page.$eval('.pc-thstrip', e => e.textContent);
  ok(/5/.test(th) && /11/.test(th), 'на шкале нет порогов: ' + th);
  ok((await page.$$eval('.pc-th-box', e => e.length)) === 2, 'порогов на шкале не два');
  /* Обе клетки порога одного размера, сколько бы цифр в них ни стояло */
  const thBox = await page.$$eval('.pc-th-box', e => e.map(x => Math.round(x.getBoundingClientRect().width)));
  ok(thBox[0] === thBox[1], 'клетки порогов разной ширины: ' + thBox.join(' и '));
  /* И ромбы над подписями: их один, два или три, но сам ромб один и тот же */
  const dots = await page.$$eval('.pc-th-lab img', e => e.map(x => {
    const r = x.getBoundingClientRect(); return +(r.width / r.height).toFixed(2) + '@' + Math.round(r.height);
  }));
  ok(new Set(dots.map(d => d.split('@')[1])).size === 1,
     'ромбы над подписями разной высоты: ' + dots.join(', '));
  /* Рамка шкалы рисуется рамкой css, а не картинкой: картинка тянулась по
     высоте (файл вдвое ниже места под неё) и скругления выходили овалами.
     Признак того, что она вернулась: непустой background-image. */
  const frame = await page.$eval('.pc-thstrip', function (e) {
    const c = getComputedStyle(e), r = e.getBoundingClientRect();
    return { img: c.backgroundImage, rad: parseFloat(c.borderTopLeftRadius),
             h: r.height, w: r.width };
  });
  ok(frame.img === 'none', 'рамка шкалы порогов снова картинка: ' + frame.img);
  ok(frame.rad <= frame.h / 2 + 0.5,
     'скругление рамки больше половины высоты: ' + frame.rad + ' при ' + frame.h);
  /* Клетки свисают за рамку сверху и снизу - так в макете */
  const thH = await page.$eval('.pc-th-box', e => e.getBoundingClientRect().height);
  ok(thH > frame.h, 'клетки порогов не выходят за рамку: ' + thH + ' и ' + frame.h);
  ok(!(await page.$('.pc-die')), 'у брони завелась кость урона');

  /* У добычи ни того, ни другого */
  await go('#/print/ci1');
  ok(!(await page.$('.pc-strip')) && !(await page.$('.pc-thstrip')),
     'у предмета завелась полоса характеристик');
  ok(!(await page.$('.pc-burden')), 'у предмета завелись ладони хвата');

  /* Артефакт и проклятый предмет ранга не имеют, и слово из книги встаёт на
     плашку вместо «предмета». */
  await go('#/print/voa2_a3');
  ok(!(await page.$('.pc-tier')), 'у артефакта завелась лента ранга');
  ok(/АРТЕФАКТ/i.test(await page.$eval('.pc-tag', e => e.textContent)), 'артефакт не назван на плашке');

  /* Цепочка улучшений и ссылки на другие карты на печать не едут: карта уходит
     к игроку, а это разговор с мастером, и 63 мм он занимает целиком. */
  console.log('лишнее не печатается');
  await go('#/print/ci18');
  const crafted = await page.$eval('.pcard', e => e.textContent);
  ok(!/Крафт|Craft|улучш/i.test(crafted), 'на карту попала цепочка улучшений: ' + crafted.slice(0, 120));

  /* Карта светлая нарочно: тёмный фон съедает картридж и на чёрно-белом
     принтере превращает текст в кашу. */
  const paint = await page.$eval('.pcard', e => ({
    card: getComputedStyle(e).backgroundColor,
    name: getComputedStyle(e.querySelector('.pc-name')).color
  }));
  ok(/255, 255, 255/.test(paint.card), 'карта печатается не белой: ' + paint.card);
  const lum = (paint.name.match(/\d+/g) || []).slice(0, 3).map(Number).reduce((a, b) => a + b, 0) / 3;
  ok(lum < 90, 'имя на карте слишком светлое для печати: ' + paint.name);

  /* ---------- чёрно-белый лист ----------
     Это не «цветной без цвета»: картинок нет вовсе, детали идут белые с тёмным
     контуром, а лента, плашка и знак собраны в строку над именем. */
  console.log('чёрно-белый лист');
  await go('#/print/q1');
  ok(await page.$('.pc-img'), 'в цветном режиме нет картинки');
  await page.click('[data-act="printArt"][data-val="bw"]'); await settle();
  ok(await page.$('.pcard.bw'), 'кнопка не включила чёрно-белый лист');
  ok(!(await page.$('.pc-img')) && !(await page.$('.pc-art')),
     'в чёрно-белом осталась картинка');
  ok(await page.$('.pc-head .pc-tier') && await page.$('.pc-head .pc-tags'),
     'в чёрно-белом лента и плашка не собрались в строку');
  ok(/-bw\.svg$/.test(await page.$eval('.pc-tier img', e => e.getAttribute('src'))),
     'в чёрно-белом взята цветная деталь');
  /* У магического оружия число на кости белое - на синей заливке. В чёрно-белом
     заливка белая, и число обязано потемнеть, иначе его просто нет. */
  await go('#/print/q35');
  await page.click('[data-act="printArt"][data-val="bw"]'); await settle();
  /* Внутри кости в чёрно-белом чистое поле: грани там перечёркивали цифру, и
     «d12» на них не читалось. */
  const bwDie = await page.$eval('.pc-die img', e => e.getAttribute('src'));
  ok(/-bw\.svg$/.test(bwDie), 'в чёрно-белом взята цветная кость: ' + bwDie);
  const bwFile = require('fs').readFileSync(
    require('path').join(__dirname, '..', bwDie), 'utf8');
  ok((bwFile.match(/<path/g) || []).length === 1,
     'в чёрно-белой кости остались грани поверх цифры');
  const dieInk = await page.$eval('.pc-die b', e => getComputedStyle(e).color);
  const dl = (dieInk.match(/\d+/g) || []).slice(0, 3).map(Number).reduce((a, b) => a + b, 0) / 3;
  ok(dl < 90, 'в чёрно-белом число на кости белое по белому: ' + dieInk);
  await go('#/print/q1');
  await page.click('[data-act="printArt"][data-val="color"]'); await settle();
  ok(await page.$('.pc-img'), 'кнопка не вернула цветной лист');

  /* ---------- длинный текст ----------
     У артефактов описание в разы длиннее, чем у зелья, а место одно. */
  console.log('длинный текст ужимается');
  await go('#/print/voa2_a3-voa2_a1-voa2_c4-voa2_c3-voa2_t4e-voa2_t4d-voa2_c1-voa2_a6-di11');
  const over = await page.$$eval('.pc-text', e => e.map(x => x.scrollHeight - x.clientHeight));
  ok(over.every(v => v <= 1), 'длинный текст вылез за карту: ' + over.join(','));
  const shrunk = await page.$$eval('.pcard', e => e.filter(function (c) {
    const t = c.querySelector('.pc-text'), b = c.querySelector('.pc-content');
    return (t && t.style.fontSize) || (b && b.style.paddingTop);
  }).length);
  ok(shrunk > 0, 'ни одна длинная карта не ужалась - правило не сработало');

  /* Печать заменяет собой страницу, с которой пришли: без кнопки «назад»
     возвращаться было некуда, кроме как через историю браузера. */
  console.log('дорога назад');
  await go('#/tables/core_item');
  await page.click('.rows .row .selbox input'); await settle();
  await page.click('#selBar a[href^="#/print/"]'); await settle();
  ok(await page.$('[data-act="printBack"]'), 'с печати нет дороги назад');
  await page.click('[data-act="printBack"]'); await settle();
  ok(/#\/tables\/core_item/.test(await page.evaluate(() => location.hash)),
     'кнопка «назад» увела не туда, откуда пришли: ' + (await page.evaluate(() => location.hash)));

  /* ---------- откуда печатают ----------
     Три места: карточка вещи, список и полоса выделения в таблице. */
  console.log('точки входа');
  await go('#/i/q1');
  ok((await page.$eval('a[href^="#/print/"]', e => e.getAttribute('href'))) === '#/print/q1',
     'со страницы вещи печатается не она');
  /* И стоит она в одном ряду с «отправить» и «текст», а не отдельной строкой
     под карточкой: это действие над той же вещью. */
  ok(await page.$('.card.full .card-acts a[href^="#/print/"]'),
     'кнопка печати оторвана от карточки');

  await go('#/tables/core_item');
  await page.click('.rows .row .selbox input'); await settle();
  const sel = await page.$eval('#selBar a[href^="#/print/"]', e => e.getAttribute('href'));
  ok(/^#\/print\/\w+$/.test(sel), 'из полосы выделения не печатается: ' + sel);

  await page.evaluate(() => localStorage.setItem('dhloot.lists.v2', JSON.stringify(
    [{ id: 'p', name: 'Печать', ids: ['ci1', 'q1'], created: 1 }])));
  await page.goto(ROOT + '#/lists/p', { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' }); await ready(page);
  ok((await page.$eval('.card-acts a[href^="#/print/"]', e => e.getAttribute('href'))) === '#/print/ci1-q1',
     'со списка печатается не он');

  /* Мусор в адресе не должен ронять страницу - только сказать, что печатать
     нечего. */
  await go('#/print/nosuchid');
  ok(!(await page.$('.psheet')), 'из выдуманного адреса собрался лист');
  ok(/\S/.test(await page.$eval('.page-h', e => e.textContent)), 'пустая печать без заголовка');

  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\nпечать: все проверки прошли');
  process.exit(fail ? 1 : 0);
})();
