/* data.json и catalog.csv собираются из data.js и лежат рядом с ним.
   Внутри `npm run check` они уже пересобраны командой `npm run data` прямо
   перед этой проверкой, так что здесь сверяется генератор сам с собой, а не
   закоммиченная копия. Пропущенный перед коммитом пересбор ловит отдельный
   шаг в CI (`git diff --exit-code` после `npm run check`), не этот файл. */
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
const catalogPath = path.join(ROOT, 'catalog.csv');
const rows = fs.existsSync(catalogPath)
  ? fs.readFileSync(catalogPath, 'utf8').trim().split('\n') : [];
ok(rows.length > 0, 'catalog.csv: файла нет — запусти node tools/build.js');
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
/* Проверяется исходник, а не сборка: `npm run check` ничего не собирает, и
   тест, читающий вчерашний dist/, хуже, чем отсутствие теста. Раньше здесь
   стояли обе входные страницы - корневая и app/index.html, - пока рядом жило
   старое приложение (R0c удалил его). */
ok(NOINDEX.test(fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8')),
   'на app/index.html нет noindex');
ok(NOINDEX.test(page(ALL[0])), 'генератор заглушек перестал ставить noindex');
const rob = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
ok(/^User-agent: \*\s*\nAllow: \//m.test(rob),
   'robots.txt закрывает обход — тогда noindex никто не прочитает');
ok(/GPTBot|CCBot/.test(rob) && /Disallow: \//.test(rob),
   'robots.txt не отсекает сборщиков для обучения');
ok(!fs.existsSync(path.join(ROOT, 'sitemap.xml')),
   'карта сайта вернулась, а она нужна ровно для индексации');

console.log('голова app/index.html читается');
/* Раньше здесь сверялись две входные страницы - корневая и app/index.html, -
   пока старое приложение жило рядом. R0c удалил index.html вместе с ним, так
   что сверять больше не с чем; осталась одна входная страница, и её голова
   просто должна разбираться и нести всё, что нужно карточке для мессенджеров.
   `headFacts` читает только `<head>`, а не весь документ - тело может
   упомянуть `<meta`/`<title>` в примере кода без риска попасть в разбор. */
const HEAD_META = ['description', 'robots', 'color-scheme', 'viewport'];
function headFacts(file) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const head = (/<head[^>]*>([\s\S]*?)<\/head>/i.exec(html) || ['', ''])[1];
  const out = {};
  const title = /<title>([\s\S]*?)<\/title>/i.exec(head);
  if (title) out['<title>'] = title[1];
  (head.match(/<meta\s[^>]*>/gi) || []).forEach(function (tag) {
    const attr = {};
    const re = /([\w:-]+)\s*=\s*"([^"]*)"/g;
    let m;
    while ((m = re.exec(tag))) attr[m[1].toLowerCase()] = m[2];
    const key = attr.property || attr.name;
    if (!key) return;
    if (HEAD_META.indexOf(key) >= 0 || /^(og|twitter):/.test(key)) out[key] = attr.content;
  });
  return out;
}
const shareFacts = headFacts('app/index.html');
/* Раньше здесь стоял голый порог `>= 20` - "сломался разбор". На живых данных
   он читал ровно 20 (19 <meta> плюс <title>), то есть был не полом, а точным
   числом без запаса: убери любой одиночный <meta> - сообщение соврёт, что
   разбор сломался, хотя разбор был бы прав, просто поле исчезло. Вместо
   порога - поимённая проверка того, что разбор обязан найти: каждый ключ из
   HEAD_META и заголовок. У og: и twitter: своя проверка по значению ниже. */
HEAD_META.forEach(function (key) {
  ok(key in shareFacts, 'из головы app/index.html пропал ' + key);
});
ok('<title>' in shareFacts, 'из головы app/index.html пропал <title>');
/* Иконка — тоже часть головы, но это <link>, а не <meta>. */
const ICON = /<link\s+rel="icon"\s+href="([^"]*)"/i;
const icon = (ICON.exec(fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8')) || [])[1];
ok(!!icon, 'пропала иконка вкладки на app/index.html');

console.log('раскладка не гуляет между короткой и длинной страницей');
/* tokens.css:93. Reserves the scrollbar gutter whether or not the page needs
   one, so a short route does not measure fifteen pixels wider than a long
   one - nothing else in tests/app/ reads this file as source text. */
ok(
  /scrollbar-gutter:\s*stable/.test(
    fs.readFileSync(path.join(ROOT, 'app', 'src', 'styles', 'tokens.css'), 'utf8')
  ),
  'html больше не резервирует scrollbar-gutter: stable'
);

console.log('og-факты — абсолютные значения');
/* Раньше этот блок пинал только то, в чём сходились index.html и
   app/index.html - смена генератора, сдвинувшая обе страницы в одну и ту же
   неверную сторону, всё равно прошла бы. Теперь сверяется одна страница
   против абсолютных значений напрямую. */
const SITE = 'https://artex-x.github.io/daggerheart-loot/';
ok(shareFacts['og:image'] === SITE + 'og/_share.jpg',
   'og:image не общая картинка сайта, а что-то другое: ' + shareFacts['og:image']);
ok(shareFacts['og:image:width'] === '1200' && shareFacts['og:image:height'] === '630',
   'og:image не 1200x630: ' + shareFacts['og:image:width'] + 'x' + shareFacts['og:image:height']);
ok(fs.existsSync(path.join(ROOT, 'og', '_share.jpg')), 'общей og-картинки нет на диске');
ok(shareFacts['twitter:image'] === shareFacts['og:image'],
   'twitter:image разошлась с og:image: ' + shareFacts['twitter:image']);
ok(shareFacts['og:locale'] === 'ru_RU', 'og:locale не ru_RU: ' + shareFacts['og:locale']);

/* Every stub (i/<id>.html) is a square-art "summary" card, never the site's
   own "summary_large_image" - one record with art, one built with its art
   field stripped, so both branches of the img fallback are pinned, not only
   that a stub matches its own generator (the check above this file already
   proves that). Every real record carries art today, so the no-art branch
   has no record of its own to read off - built rather than found. */
const artless = Object.assign({}, ALL.find((x) => x.img && !x.eq && !x.craft));
delete artless.img;
[ALL.find((x) => x.img), artless].forEach(function (x) {
  const html = page(x);
  const twCard = /<meta name="twitter:card" content="([^"]*)">/.exec(html);
  ok(twCard && twCard[1] === 'summary', 'заглушка ' + x.id + ': twitter:card не summary');
  const ogImg = /<meta property="og:image" content="([^"]*)">/.exec(html);
  const wantImg = SITE + 'og/' + (x.img ? x.img.replace(/\.webp$/, '.jpg') : '_none.jpg');
  ok(
    ogImg && ogImg[1] === wantImg,
    'заглушка ' + x.id + ': og:image не ' + wantImg + ', а ' + (ogImg && ogImg[1])
  );
});

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
ok(voaLists.length === 5, 'списков в Vault of Ages не 5, а ' + voaLists.length);
/* «Узы Души» печатают три свойства камня списком, и в один абзац они слипались */
ok(voaLists.some(x => x.id === 'voa2_a1'), 'у «Уз Души» свойства камня не списком');
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
   Теперь он взят из книги, и в модулях приложения не должно остаться ни того,
   ни другого - CLAUDE.md's "never infer equipment tier from stats". */
console.log('ранг не выводится из характеристик');
const libDir = path.join(ROOT, 'app', 'src', 'lib');
fs.readdirSync(libDir).filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'))
  .forEach(function (f) {
    const text = fs.readFileSync(path.join(libDir, f), 'utf8');
    ok(text.indexOf('tierBand') < 0,
       'app/src/lib/' + f + ': догадка о ранге по характеристикам (tierBand) вернулась');
  });
/* `srcWond`-style guessing (deriving a tier by source when one is not stated)
   has no matching grep here: it cannot recur by construction, not just by
   absence. `i18n.ts`'s `eqLine()` pushes `labels.tier`/`e.tier` unconditionally
   whenever `!opts.noTier` (no ternary, no source check), so there is no branch
   left where a rewrite author could slip a guess back in without touching this
   one line, which every other equipment-line test already pins byte for byte. */

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

/* Форма вещи из Vault of Ages - «кинжал», «коса», «лёгкая» - в книге стоит
   для антуража, а в приложении занимала место класса оружия: по ней нельзя
   отфильтровать, и физическое с магическим у этих вещей не работало. Класс
   теперь проставлен у всего оружия, а формы нет ни у чего. */
ok(!ALL.some(x => x.eq && x.eq.sub), 'форма вещи вернулась в данные: ' +
   ALL.filter(x => x.eq && x.eq.sub).map(x => x.id).join());
const NO_CLS = ALL.filter(x => x.eq && x.eq.t !== 'armor' && !x.eq.cls);
ok(!NO_CLS.length, 'оружие без класса: ' + NO_CLS.map(x => x.id).join());
/* Там, где класс проставлен по типу урона - Vault of Ages, Dread, фреймы, -
   они совпадают. Корник и Hope & Fear разводят их сами: Призрачный Клинок
   магический, а урон у него физический, и это остаётся как есть. */
ALL.filter(x => x.eq && x.eq.t !== 'armor' &&
                ['voa', 'dread', 'frame'].indexOf(x.src) >= 0).forEach(function (x) {
  ok(x.eq.cls === x.eq.dt, 'класс и урон разошлись у ' + x.id + ': ' +
     x.eq.cls + ' и ' + x.eq.dt);
});

console.log('снаряжение фреймов');
/* Кампейн-фреймы дают своё снаряжение вместо стартового. Ранги здесь не
   выдуманы: Beast Feast книга прямо называет набором первого ранга, у
   остальных наборов расписаны все четыре. */
const FR = L.items.frames;
ok(FR.length === 94, 'снаряжения фреймов не 94, а ' + FR.length);
ok(FR.every(x => x.roll == null), 'у снаряжения фреймов появился номер броска');
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
   руками в семи файлах — и промах ничем не виден: страница выглядит
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
/* index.html и app.js were the live app's own copies of these numbers and
   left the list at R0c along with the files themselves. */
['app/index.html', 'README.md', 'README.ru.md',
 'llms.txt', 'robots.txt', 'app/src/lib/dict.ts', 'app/src/lib/i18n.ts',
 'app/src/lib/search.ts', 'tools/bundle-budget.mjs']
  .forEach(function (file) {
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

/* Кости на кнопках рисуются теми же путями, что печатаются на карточке. Читать
   файл на лету нельзя - `fetch` из `file://` запрещён, - поэтому пути выписаны
   в dice.ts, и вот тут они сверяются с самими файлами. Иначе правка вектора в
   `card/` тихо разъедется с экраном. */
console.log('кости на кнопках');
const diceTs = fs.readFileSync(path.join(ROOT, 'app', 'src', 'lib', 'dice.ts'), 'utf8');
[4, 6, 8, 10, 12, 20].forEach(function (d) {
  const svg = fs.readFileSync(path.join(ROOT, 'card', 'die-d' + d + '-bw.svg'), 'utf8');
  const want = (svg.match(/\sd="([^"]+)"/g) || []).map(x => x.slice(4, -1));
  const box = /viewBox="([^"]+)"/.exec(svg)[1];
  const got = new RegExp(
    d + ":\\s*\\{\\s*viewBox:\\s*'([^']+)',\\s*body:\\s*'([^']+)',\\s*faces:\\s*\\n?\\s*'([^']+)'"
  ).exec(diceTs);
  ok(got, 'в dice.ts нет силуэта d' + d);
  if (!got) return;
  ok(got[1] === box, 'd' + d + ': рамка разошлась с файлом: ' + got[1] + ' и ' + box);
  ok(got[2] === want[0] && got[3] === want[1], 'd' + d + ': пути разошлись с файлом');
});

/* Ссылка на источник - не украшение, а условие лицензии (DPCGL 2.0, п. 4.1):
   без неё право пользоваться текстами не возникает. Формула задана дословно, и
   стоять она должна везде, где сайт «делится» материалом: в подвале обоих
   языков, в README и в llms.txt. Раз уж номер SRD теперь входит в саму формулу,
   версия проверяется вместе с ней - на 1.0 её оставили в трёх местах из
   четырёх, и заметить это было нечем.

   Заодно проверяется, что Hope & Fear больше не числится вне лицензии: 25
   августа 2026 года DPCGL 2.0 добавила его в список игр, и старая оговорка
   стала неверной. */
console.log('ссылка на источник');
const CITE = 'Daggerheart System Reference Document 2.0, © Critical Role, LLC.' +
             ' under the terms of the Darrington Press Community Gaming (DPCGL)' +
             ' License.';
['README.md', 'README.ru.md', 'llms.txt'].forEach(function (file) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\s+/g, ' ');
  ok(text.indexOf(CITE) >= 0, file + ': нет дословной ссылки на источник');
  ok(text.indexOf('Reference Document 1.0') < 0, file + ': ссылка всё ещё на SRD 1.0');
});
/* В подвале - на обоих языках: он и есть то, чем делятся. Подвал теперь
   собран из трёх частей словаря (footBefore/footLink/footAfter), а не одной
   строки с разметкой - вся дословная цитата целиком лежит в footBefore. */
const dictTs = fs.readFileSync(path.join(ROOT, 'app', 'src', 'lib', 'dict.ts'), 'utf8');
const feet = dictTs.match(/footBefore:\s*\n?\s*'([^']*)'/g) || [];
ok(feet.length === 2, 'подвалов не два, а ' + feet.length);
feet.forEach(function (f, i) {
  ok(f.indexOf(CITE) >= 0,
     'в подвале ' + (i ? 'по-английски' : 'по-русски') + ' нет ссылки на источник');
});
/* Старая оговорка перечисляла Hope & Fear среди того, что под лицензию не
   подпадает. Дополнения, которые там остались, проверяются заодно: их из списка
   выкинуть тоже нельзя. */
const OUTSIDE = ['Wondrous Environments', 'Dread GM Toolbox', 'Vault of Ages',
                 'Community Magic Items', 'Alternate Loot & Consumable Tables'];
[['README.md', /^.*fall\s+outside that licence[\s\S]*?\n\n/m],
 ['README.ru.md', /^.*под эту лицензию не подпадают[\s\S]*?\n\n/m]].forEach(function (pair) {
  const file = pair[0];
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\n  /g, ' ');
  const clause = (pair[1].exec(text) || [''])[0];
  ok(clause, file + ': пропала оговорка о том, что под лицензию не подпадает');
  ok(clause.indexOf('Hope & Fear') < 0,
     file + ': Hope & Fear всё ещё числится вне лицензии, хотя DPCGL 2.0 его включила');
  OUTSIDE.forEach(function (name) {
    ok(clause.indexOf(name) >= 0, file + ': ' + name + ' пропал из списка вне лицензии');
  });
});

/* Pages must wait for every quality matrix. Keep this dependency-free: the
   workflow is deliberately small here, and accepting a stray `golden` mention
   elsewhere would let deploy bypass a failing structural baseline. */
const workflow = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8');
const deploy = /^  deploy:\s*\r?\n([\s\S]*?)(?=^  [A-Za-z0-9_-]+:\s*(?:#.*)?$|(?![\s\S]))/m.exec(workflow);
ok(deploy, 'deploy.needs: deploy job is missing');
const deployNeeds = deploy && /^    needs:\s*\[([^\]\r\n]*)\]\s*$/m.exec(deploy[1]);
ok(deployNeeds, 'deploy.needs: inline needs list is missing or unparseable');
if (deployNeeds) {
  const names = deployNeeds[1].split(',').map(function (name) { return name.trim(); });
  ok(names.includes('golden'), 'deploy.needs: golden is missing');
}

console.log(fail ? '\n' + fail + ' FAILED' : '\nпроизводные файлы: всё сходится');
process.exit(fail ? 1 : 0);
