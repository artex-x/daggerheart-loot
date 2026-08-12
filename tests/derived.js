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
   859 рисуются заново и сравниваются целиком. */
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
 'daggerheart.com/srd', 'deflate-raw'].forEach(s =>
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

/* Ранга может не быть - и тогда его не показывают, а не подставляют источник */
const noTier = [].concat(...Object.values(L.items)).filter(x => x.eq && !x.eq.tier);
ok(noTier.length > 0 && noTier.every(x => x.src === 'wondrous'),
   'без ранга оказалось не только снаряжение Wondrous');
const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
ok(app.indexOf("out.push(e.tier ? t().tier + ' ' + e.tier : t().srcWond)") < 0,
   'в чипе ранга снова подставляется источник');

console.log('счётчики в текстах');
/* Число записей выписано словами в мета-описаниях, в README и в подсказке
   поиска. Данные меняются редко, но каждый раз эти числа приходится править
   руками в четырёх файлах — и промах ничем не виден: страница выглядит
   исправной и врёт. Поэтому каждое трёхзначное число рядом со «своим» словом
   сверяется с тем, что на самом деле лежит в data.js. */
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
  [/(\d{3})\s+предмет/g,    [N.loot],            'предметов и расходников'],
  [/(\d{3})\s+единиц/g,     [N.eq],              'единиц снаряжения'],
  [/(\d{3})\s+запис/g,      [N.all],             'записей'],
  [/(\d{3})\s+страниц/g,    [N.all],             'страниц-заглушек'],
  [/(\d{3})\s+картин/g,     [N.art],             'картинок'],
  [/(\d{3})\s+records/g,    [N.all],             'records'],
  [/(\d{3})\s+позици/g,     [N.all, N.wondrous], 'позиций'],
  [/(\d{3})\s+entries/g,    [N.all, N.wondrous], 'entries']
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
