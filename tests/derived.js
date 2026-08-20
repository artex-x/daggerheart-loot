/* data.json и catalog.csv собираются из data.js и лежат рядом с
   ним. Стоит поправить данные и забыть пересобрать — они разойдутся молча, и
   ничего в них не будет выглядеть неправильным. Поэтому здесь они собираются
   заново в память и сравниваются с тем, что закоммичено. */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const D = require(path.join(ROOT, 'tools', 'derived.js'));
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL ' + m); } };

global.window = {};
require(path.join(ROOT, 'data.js'));
const L = global.window.LOOT;

console.log('производные файлы совпадают с data.js');
[['data.json', D.dataJson], ['catalog.csv', D.catalogCsv]]
  .forEach(function ([name, make]) {
    const disk = fs.existsSync(path.join(ROOT, name))
      ? fs.readFileSync(path.join(ROOT, name), 'utf8') : null;
    ok(disk !== null, name + ': файла нет — запусти node tools/build.js');
    if (disk !== null) ok(disk === make(L), name + ': устарел — запусти node tools/build.js');
  });

console.log('каталог читается');
const rows = fs.readFileSync(path.join(ROOT, 'catalog.csv'), 'utf8').trim().split('\n');
const ALL = D.everything(L);
/* Описания содержат и запятые, и кавычки, и переводов строк в них быть не
   должно — иначе строк в файле окажется больше, чем записей. */
ok(rows.length === ALL.length + 1, 'строк в catalog.csv не ' + (ALL.length + 1) + ', а ' + rows.length);
const head = rows[0].split(',');
ok(head[0] === 'id' && head.indexOf('tier') > 0 && head.indexOf('name_ru') > 0,
   'шапка каталога не та: ' + rows[0].slice(0, 60));

/* Достаточно ли каталога, чтобы собрать лавку кузнеца: броня 1-2 ранга,
   физическое основное оружие тех же рангов. Если да — агенту хватит его одного. */
const idx = {};
head.forEach((h, i) => { idx[h] = i; });
const parsed = rows.slice(1).map(function (line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
             else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
});
ok(parsed.every(r => r.length === head.length), 'в каталоге есть строка не той ширины');
const smith = parsed.filter(r => (r[idx.kind] === 'armor' || (r[idx.kind] === 'weapon' && r[idx.class] === 'physical'))
                                 && ['1', '2'].indexOf(r[idx.tier]) >= 0);
ok(smith.length > 40, 'по каталогу не отобрать товар кузнеца: нашлось ' + smith.length);
ok(parsed.every(r => !r[idx.id] || /^https:\/\/artex-x\.github\.io\//.test(r[idx.url])),
   'в каталоге битая ссылка на страницу записи');

console.log('заглушки совпадают с генератором');
/* craft.js сверяет заглушки по началу описания — этого хватает, пока меняются
   данные. Но правка самого генератора (скажем, добавленный мета-тег) так не
   видна: описание на месте, а устарели страницы все разом. Поэтому здесь все
   953 рисуются заново и сравниваются целиком. */
const { page } = require(path.join(ROOT, 'tools', 'build-share-pages.js'));
const drift = ALL.filter(function (x) {
  const p = path.join(ROOT, 'i', x.id + '.html');
  return !fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== page(x);
});
ok(drift.length === 0, 'заглушек устарело ' + drift.length + ', например ' +
   drift.slice(0, 5).map(x => x.id).join(', ') + ' — запусти node tools/build.js');

console.log('не индексируется');
/* Личный инструмент: страницы не должны попадать в выдачу. Работает это только
   в паре — обход разрешён, чтобы noindex вообще прочитали, а закрытая роботсом
   страница может попасть в выдачу голой ссылкой, так и не прочитав тег. */
const NOINDEX = /<meta\s+name="robots"\s+content="noindex/i;
ok(NOINDEX.test(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')),
   'на index.html нет noindex');
ok(NOINDEX.test(page(ALL[0])), 'генератор заглушек перестал ставить noindex');
const rob = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
ok(/^User-agent: \*\s*\nAllow: \//m.test(rob),
   'robots.txt закрывает обход — тогда noindex никто не прочитает');
ok(/GPTBot|CCBot/.test(rob) && /Disallow: \//.test(rob),
   'robots.txt не отсекает сборщиков для обучения');
ok(!fs.existsSync(path.join(ROOT, 'sitemap.xml')),
   'карта сайта вернулась, а она нужна ровно для индексации');

console.log('llms.txt');
const llms = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8');
['catalog.csv', 'data.json', '#/l/', 'stamp', '10 handfuls = 1 bag',
 'Player note', 'GM note', 'Not indexed', 'Read `catalog.csv` first', 'Dread GM Toolbox', 'Never name an item from memory',
 'daggerheart.com/srd', 'deflate-raw',
 /* #13: раздел про источники — агенту нужно знать, чем они отличаются, а не
    только что они бывают. #9: про длину ссылки вместо рецепта сжатия. */
 'Campaign Frames', 'Do not invent a compression scheme'].forEach(s =>
  ok(llms.indexOf(s) > 0, 'llms.txt не упоминает ' + s));
/* Число записей названо и в описании сайта, и здесь — пусть расходится громко */
ok(llms.indexOf(String(ALL.length)) > 0, 'в llms.txt не то число записей');

/* Разобранный пример в llms.txt — это то, что агент скопирует и повторит.
   Контрольная сумма в нём должна сходиться с тем, что даёт описанный тут же
   алгоритм, а идентификаторы — существовать. */
const items = /\nitems\s+([a-z0-9*,]+)\n/.exec(llms);
const st = /\nstamp\s+([0-9a-z]+\.[0-9a-z]{1,4})~/.exec(llms);
const pay = /\npayload\s+([\s\S]*?)\n\s*```/.exec(llms);
ok(!!items && !!st && !!pay, 'в llms.txt не нашёлся разобранный пример списка');
if (items && st && pay) {
  const body = items[1], parts = body.split(',');
  let h = 2166136261;
  for (let i = 0; i < body.length; i++) { h ^= body.charCodeAt(i); h = Math.imul(h, 16777619); }
  const want = parts.length.toString(36) + '.' + (h >>> 0).toString(36).slice(-4);
  ok(want === st[1], 'контрольная сумма в примере не сходится: в тексте ' + st[1] + ', а надо ' + want);
  const byId = {}; ALL.forEach(x => { byId[x.id] = x; });
  parts.forEach(p => ok(!!byId[p.split('*')[0]], 'в примере несуществующий id: ' + p));

  /* Эталонная строка обещает агенту: «получилось не то — значит, ошибся».
     Обещание держится только пока она и правда собирается по описанию. */
  const name = /\nname\s+(.+)/.exec(llms)[1].trim();
  /* Заметки берём только из самого эталонного блока: примеры заметок есть и в
     других местах файла, и они не имеют к нему отношения. */
  const block = /\nnotes\s+([\s\S]*?)\n\s*\npayload/.exec(llms);
  ok(!!block, 'в эталонном блоке не нашлись заметки');
  const notes = ((block ? block[1] : '').match(/\\x1e\+?[~a-z0-9]*\\x1f[^\n]+/g) || [])
    .map(s => s.replace(/\\x1e/g, '\x1e').replace(/\\x1f/g, '\x1f')).join('');
  const raw = name + '\n' + want + '~' + body + '\n' + notes;
  const mine = Buffer.from(raw, 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const shown = pay[1].replace(/\s+/g, '');
  ok(mine === shown, 'эталонный payload в llms.txt не собирается по описанию оттуда же');
}

console.log('Dread GM Toolbox');
/* Раздел устроен как Wondrous: свой список, свой бросок, свои картинки. Ранги
   у семи единиц снаряжения книга называет сама - выдумывать их нельзя. */
const DR = L.items.dread;
ok(DR.length === 29, 'в Dread не 29 позиций, а ' + DR.length);
ok(DR.every((x, i) => x.roll === i + 1), 'номера Dread не идут подряд с единицы');
ok(DR.every(x => x.src === 'dread' && x.img), 'у Dread не проставлен источник или картинка');
const dreadEq = DR.filter(x => x.eq);
ok(dreadEq.length === 7, 'снаряжения в Dread не 7, а ' + dreadEq.length);
ok(dreadEq.every(x => x.eq.tier === 3 || x.eq.tier === 4), 'ранг снаряжения Dread не из книги');
ok(DR.filter(x => x.kind === 'consumable').length === 7,
   'расходников в Dread не 7, а ' + DR.filter(x => x.kind === 'consumable').length);
/* Строка таблицы из книги уехала в eq и не должна остаться в описании */
ok(dreadEq.every(x => !/^Tier \d|^Магическое Оружие/.test(x.ende + x.rud)),
   'в описании снаряжения Dread осталась строка таблицы');

console.log('снаряжение целиком');
/* Таблицы оружия и брони брали только `LOOT.eq` - две базовые книги, - и
   четверть снаряжения в них не попадала вовсе: ни найти, ни отфильтровать.
   Здесь проверяется само правило: сколько снаряжения в данных, столько и
   должно раскладываться по трём таблицам. */
const EVERY_EQ = ALL.filter(x => x.eq);
const BY_T = {};
EVERY_EQ.forEach(x => { BY_T[x.eq.t] = (BY_T[x.eq.t] || 0) + 1; });
ok(Object.keys(BY_T).sort().join() === 'armor,secondary,weapon',
   'у снаряжения завёлся новый вид: ' + Object.keys(BY_T).join());
ok(EVERY_EQ.length === L.eq.length + 134,
   'снаряжения вне двух базовых книг не 134, а ' + (EVERY_EQ.length - L.eq.length));
/* Ранг обязателен у всего снаряжения. У Wondrous он выведен из книги: таблица
   «Loot items by environment» привязывает вещь к локации, а у локации ранг
   напечатан. Пока это правило держится, таблица снаряжения раскладывается по
   четырём рангам без остатка и незачем возвращать раздел «без ранга». */
const noTierEq = EVERY_EQ.filter(x => !x.eq.tier);
ok(noTierEq.length === 0, 'снаряжение без ранга: ' +
   noTierEq.map(x => x.id).join());
ok(EVERY_EQ.every(x => [1, 2, 3, 4].indexOf(x.eq.tier) >= 0),
   'ранг снаряжения вне диапазона с первого по четвёртый');
/* Ранги Wondrous выведены вручную по таблице локаций - если запись поедет,
   молча съедет и ранг, поэтому они прибиты здесь поимённо. */
const WOND_TIER = { w7: 3, w22: 2, w25: 4, w31: 3, w51: 2, w54: 3,
                    w57: 2, w79: 2, w82: 2, w85: 2, w88: 2 };
const wondEq = EVERY_EQ.filter(x => x.src === 'wondrous');
ok(wondEq.length === Object.keys(WOND_TIER).length,
   'снаряжения в Wondrous стало ' + wondEq.length + ', а рангов прописано ' +
   Object.keys(WOND_TIER).length);
wondEq.forEach(x => ok(x.eq.tier === WOND_TIER[x.id],
   'ранг ' + x.id + ' разошёлся с локацией из книги: ' + x.eq.tier));

console.log('Vault of Ages');
/* Единственный набор, где ранг стоит и на добыче: книга разложена по рангам
   целиком, а сверх четырёх идут артефакты и проклятые предметы. Ранг не
   выведен из урона и не угадан - он напечатан заголовком раздела в книге и
   продублирован в id, так что эти два источника обязаны сходиться. */
const VOA = L.items.voa;
ok(VOA.length === 108, 'в Vault of Ages не 108 позиций, а ' + VOA.length);
ok(VOA.every(x => x.src === 'voa' && x.img), 'у Vault of Ages не проставлен источник или картинка');
const VOA_SIZE = { 1: 24, 2: 24, 3: 24, 4: 25, A: 6, C: 5 };
Object.keys(VOA_SIZE).forEach(function (k) {
  const g = VOA.filter(x => String(x.tier) === k);
  ok(g.length === VOA_SIZE[k], 'в разделе ' + k + ' не ' + VOA_SIZE[k] + ' позиций, а ' + g.length);
  /* Бросок идёт внутри раздела, а не по всей книге: номера обязаны быть
     сплошными от единицы, иначе кость будет указывать в пустоту */
  ok(g.every((x, i) => x.roll === i + 1), 'номера раздела ' + k + ' не идут подряд с единицы');
});
ok(VOA.every(function (x) {
  const mid = x.id.split('_')[1];
  const want = mid[0] === 'a' ? 'A' : mid[0] === 'c' ? 'C' : +mid[1];
  return String(x.tier) === String(want);
}), 'ранг Vault of Ages разошёлся с тем, что закодировано в id');
/* Снаряжение книга подписывает сама, и вторичное оружие - это отдельный вид,
   а не основное с пометкой */
const voaEq = VOA.filter(x => x.eq);
ok(voaEq.length === 24, 'снаряжения в Vault of Ages не 24, а ' + voaEq.length);
ok(voaEq.filter(x => x.eq.t === 'secondary').length === 4,
   'вторичного оружия не 4: ' + voaEq.filter(x => x.eq.t === 'secondary').length);
ok(voaEq.every(x => x.eq.tier === x.tier), 'ранг снаряжения разошёлся с рангом записи');
ok(voaEq.every(x => !x.eq.line), 'у Vault of Ages завелась лестница улучшений, которой в книге нет');
/* Шапка карточки уехала в eq и в ярлыки - в описании ей делать нечего */
ok(VOA.every(x => !/^(Loot|Consumable|Cursed Object|Primary Weapon|Secondary Weapon|Armor)\.|^(Предмет|Расходник|Проклятый Объект|Основное оружие|Вспомогательное оружие|Броня)\./.test(x.ende + '|' + x.rud)),
   'в описании Vault of Ages осталась строка категории');
ok(VOA.every(x => !/Tier \d\.|Ранг \d\./.test(x.ende + x.rud)),
   'в описании Vault of Ages остался ранг, который уже стоит ярлыком');
/* Стоимость Призыва - правило этой книги, и она осталась в тексте ярлыком */
const rc = VOA.filter(x => x.recall != null);
ok(rc.length === 83, 'Стоимость Призыва стоит не у 83 записей, а у ' + rc.length);
ok(rc.every(x => x.rud.indexOf('Стоимость Призыва: ' + x.recall + '\n') === 0 &&
                 x.ende.indexOf('Recall Cost: ' + x.recall + '\n') === 0),
   'Стоимость Призыва не открывает описание отдельной строкой');

/* Книга печатает именованные свойства отдельным абзацем, а варианты выбора -
   маркированным списком. В одну строку они читаются как сплошная стена, и
   «Кровавый Шип» посреди предложения перестаёт быть названием свойства. */
const voaLists = VOA.filter(x => x.rud.indexOf('\n- ') > 0);
ok(voaLists.length === 4, 'списков в Vault of Ages не 4, а ' + voaLists.length);
ok(voaLists.every(x => x.ende.split('\n- ').length === x.rud.split('\n- ').length),
   'список разошёлся по числу пунктов между языками');
/* Пункт списка идёт после вводной строки, а не первой строкой описания */
ok(VOA.every(x => x.rud.indexOf('- ') !== 0 && x.ende.indexOf('- ') !== 0),
   'описание начинается с пункта списка, без вводной строки');
const named = VOA.filter(function (x) {
  return x.rud.replace(/^Стоимость Призыва: \d+\n/, '').split('\n').some(function (line) {
    const i = line.replace(/^- /, '').indexOf(': ');
    return i > 0 && i < 46;
  });
});
ok(named.length >= 29, 'именованных свойств разнесено по строкам всего ' + named.length);
/* Число строк в обоих языках одно: расхождение значит, что абзац потерялся */
ok(VOA.every(x => x.ende.split('\n').length === x.rud.split('\n').length),
   'число строк описания разошлось между языками');

/* Ранг когда-то подставляли источником, а потом догадкой по характеристикам.
   Теперь он взят из книги, и в чипе не должно остаться ни того, ни другого. */
const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
ok(app.indexOf('tierBand') < 0, 'догадка о ранге по характеристикам вернулась в app.js');
ok(app.indexOf("out.push(e.tier ? t().tier + ' ' + e.tier : t().srcWond)") < 0,
   'в чипе ранга снова подставляется источник');

/* «Универсальное» - это второй набор характеристик, спрятанный в прозе
   свойства. Он разобран в `eq.alt` один раз и дальше читается как данные:
   на печатной карте он стоит второй полосой, а не строчкой текста. Если
   свойство появится у новой вещи, а разбор не обновят, счёт разойдётся. */
const VERSATILE = ALL.filter(x => x.eq && /Универсальное:/.test(x.rud || ''));
ok(VERSATILE.length === 18, 'универсального оружия стало ' + VERSATILE.length + ', а не 18');
ok(VERSATILE.every(x => x.eq.alt), 'у универсального оружия нет разобранного второго набора: ' +
   VERSATILE.filter(x => !x.eq.alt).map(x => x.id).join());
ok(ALL.filter(x => x.eq && x.eq.alt).length === VERSATILE.length,
   'второй набор характеристик завёлся не только у универсального оружия');
VERSATILE.forEach(function (x) {
  const a = x.eq.alt;
  ok(a.tr && a.rg && /^d\d+([+-]\d+)?$/.test(a.dmg || ''),
     'второй набор у ' + x.id + ' разобран неполно: ' + JSON.stringify(a));
  /* Он именно второй: повторять первый ему незачем */
  ok(a.tr !== x.eq.tr || a.rg !== x.eq.rg || a.dmg !== x.eq.dmg,
     'второй набор у ' + x.id + ' совпал с первым');
});

console.log('снаряжение фреймов');
/* Кампейн-фреймы дают своё снаряжение вместо стартового. Ранги здесь не
   выдуманы: Beast Feast книга прямо называет набором первого ранга, у
   остальных наборов расписаны все четыре. */
const FR = L.items.frames;
ok(FR.length === 94, 'снаряжения фреймов не 94, а ' + FR.length);
ok(FR.every((x, i) => x.roll === i + 1), 'номера фреймов не идут подряд');
ok(FR.every(x => x.src === 'frame' && x.frame), 'у записи фрейма нет источника или названия кампании');
const byFrame = {};
FR.forEach(x => { byFrame[x.frame] = (byFrame[x.frame] || 0) + 1; });
ok(byFrame.beast_feast === 36 && byFrame.dark_heart === 36 &&
   byFrame.colossus === 21 && byFrame.motherboard === 1,
   'состав фреймов сбился: ' + JSON.stringify(byFrame));
/* Beast Feast заменяет стартовый набор целиком - только первый ранг */
ok(FR.filter(x => x.frame === 'beast_feast').every(x => x.eq && x.eq.tier === 1),
   'в Beast Feast появился не первый ранг');
/* Линии улучшения: у многоранговых наборов все четыре ступени и общая линия */
const lines = {};
FR.forEach(x => { if (x.eq && x.eq.line) (lines[x.eq.line] = lines[x.eq.line] || []).push(x.eq.tier); });
ok(Object.keys(lines).length === 14, 'линий улучшения не 14, а ' + Object.keys(lines).length);
Object.keys(lines).forEach(k => ok(lines[k].sort().join() === '1,2,3,4',
  'в линии ' + k + ' не все ранги: ' + lines[k].join()));
/* Слова ступеней те же, что в корнике, - иначе одна и та же вещь называется
   по-разному в двух местах сайта */
['Improved', 'Advanced', 'Legendary'].forEach(w =>
  ok(FR.some(x => x.en.indexOf(w + ' ') === 0), 'нет ступени ' + w));
['Улучшенн', 'Продвинут', 'Легендарн'].forEach(w =>
  ok(FR.some(x => x.ru.indexOf(w) === 0), 'нет русской ступени ' + w));

console.log('счётчики в текстах');
/* Число записей выписано словами в мета-описаниях, в README и в подсказке
   поиска. Данные меняются редко, но каждый раз эти числа приходится править
   руками в четырёх файлах — и промах ничем не виден: страница выглядит
   исправной и врёт. Поэтому каждое число из трёх и более цифр рядом со «своим»
   словом сверяется с тем, что на самом деле лежит в data.js. Три цифры было
   мало: на 1061 записи проверка читала «061» и ругалась на верное число. */
const N = {
  loot: [].concat(...Object.values(L.items)).length,
  eq: L.eq.length,
  all: ALL.length,
  wondrous: L.items.wondrous.length,
  // в README описана папка, а в ней лежит ещё и заглушка _none.webp
  art: fs.readdirSync(path.join(ROOT, 'img')).filter(f => f.endsWith('.webp')).length
};
/* Слово «позиции» честно занято двумя счётчиками сразу — всего по сайту и
   таблицей Wondrous, — поэтому для него проверяется принадлежность, а не
   равенство. Остальные слова однозначны. */
const COUNTERS = [
  [/(\d{3,})\s+предмет/g,    [N.loot],            'предметов и расходников'],
  [/(\d{3,})\s+единиц/g,     [N.eq],              'единиц снаряжения'],
  [/(\d{3,})\s+запис/g,      [N.all],             'записей'],
  [/(\d{3,})\s+страниц/g,    [N.all],             'страниц-заглушек'],
  [/(\d{3,})\s+картин/g,     [N.art],             'картинок'],
  [/(\d{3,})\s+records/g,    [N.all],             'records'],
  [/(\d{3,})\s+позици/g,     [N.all, N.wondrous], 'позиций'],
  [/(\d{3,})\s+entries/g,    [N.all, N.wondrous], 'entries']
];
['index.html', 'README.md', 'app.js', 'llms.txt'].forEach(function (file) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  COUNTERS.forEach(function ([re, want, what]) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(text))) {
      ok(want.indexOf(+m[1]) >= 0,
         file + ': «' + m[1] + ' ' + what + '» — на деле ' + want.join(' или '));
    }
  });
  ok(text.indexOf(String(N.all)) >= 0, file + ': пропало упоминание общего числа записей');
});

console.log(fail ? '\n' + fail + ' FAILED' : '\nпроизводные файлы: всё сходится');
process.exit(fail ? 1 : 0);
