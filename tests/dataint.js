/* Invariants of data.js, checked without a browser: ids, numbering, references,
   text hygiene and the files the records point at. */
const fs = require('fs');
const path = require('path');
const ROOT = require('path').join(__dirname, '..');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL ' + m); } };

global.window = {};
require(path.join(ROOT, 'data.js'));
const L = global.window.LOOT;
const DATA = L.items, EQ = L.eq, ALT = L.alt, REFS = L.refs;
const ALL = [].concat(...Object.values(DATA), EQ);

console.log('идентификаторы');
const byId = {};
ALL.forEach(x => { ok(!byId[x.id], 'повторяющийся id: ' + x.id); byId[x.id] = x; });
ok(ALL.length === 1061, 'записей не 1061, а ' + ALL.length);
/* Vault of Ages нумерует карточки по тому и разделу книги, а не сплошняком:
   voa2_a1 - второй том, первый артефакт. Ссылки, имена файлов и коды списков
   держатся на id, так что схема у книги своя, но она тоже строгая. */
ALL.forEach(x => ok(/^[a-z]+\d+$/.test(x.id) || /^voa[123]_(t[1-4]|a|c)[a-z0-9]+$/.test(x.id),
  'странный id: ' + x.id));

console.log('обязательные поля');
ALL.forEach(x => {
  ['en', 'ende', 'ru', 'rud'].forEach(k => {
    const v = x[k];
    // equipment without a feature has no description, and that is legitimate
    if (k.endsWith('e') && x.eq && v === '') return;
    if (k === 'rud' && x.eq && v === '') return;
    ok(typeof v === 'string' && v.length > 0, x.id + ': пустое поле ' + k);
  });
  ok(['item', 'consumable', 'equip'].indexOf(x.kind) >= 0, x.id + ': неизвестный kind ' + x.kind);
  ok(['core', 'hnf', 'wondrous', 'dread', 'voa', 'frame', 'community'].indexOf(x.src) >= 0, x.id + ': неизвестный src ' + x.src);
});

console.log('текстовая гигиена');
ALL.forEach(x => {
  ['en', 'ende', 'ru', 'rud'].forEach(k => {
    const v = x[k] || '';
    ok(v === v.trim(), x.id + '.' + k + ': пробелы по краям');
    ok(!/\s\s/.test(v), x.id + '.' + k + ': двойной пробел');
    ok(!/<[a-z/]/i.test(v), x.id + '.' + k + ': разметка в тексте');
    /* daggerheart.su ships markdown: emphasis and rule links. The links were
       stripped, the asterisks were not, and one description shipped *Restrain*
       to the reader. */
    ok(!/[*`]/.test(v), x.id + '.' + k + ': markdown-разметка в тексте');
    ok(!/\[[^\]]*\]\(|\/rule\/|#\{|\}#/.test(v), x.id + '.' + k + ': остаток markdown-ссылки');
    /* Those same links lost the space that followed them, gluing a rule term to
       the next word: "within Meleerange", "bonus to your Proficiencyon". */
    ok(!/(Melee|Close|Far|Proficiency|Evasion|Spellcast|advantage|disadvantage)(range|on|of|to|with)\b/.test(v),
       x.id + '.' + k + ': слипшиеся слова после ссылки');
    ok(!/�/.test(v), x.id + '.' + k + ': битый символ');
  });
  ok(!/^[a-z]/.test(x.en), x.id + ': английское название со строчной — ' + x.en);
  ok(!/^[а-яё]/.test(x.ru), x.id + ': русское название со строчной — ' + x.ru);
});

console.log('нумерация таблиц');
Object.keys(DATA).forEach(table => {
  const rolls = DATA[table].map(x => x.roll);
  if (table === 'community') {
    const byC = {};
    DATA[table].forEach(x => { (byC[x.community] = byC[x.community] || []).push(x.roll); });
    Object.keys(byC).forEach(c => ok(byC[c].join() === [...Array(10).keys()].map(i => i + 1).join(),
      table + '/' + c + ': номера не 1–10'));
    ok(Object.keys(byC).length === 9, 'сообществ не 9');
  } else if (table === 'voa') {
    /* Своей таблицы броска у книги нет: она разложена по рангам, и артефакты с
       проклятыми предметами стоят отдельно. Бросок идёт внутри раздела, так что
       и номера свои в каждом - шесть последовательностей, а не одна. */
    const byT = {};
    DATA[table].forEach(x => { (byT[x.tier] = byT[x.tier] || []).push(x.roll); });
    ok(Object.keys(byT).length === 6, 'разделов Vault of Ages не 6, а ' + Object.keys(byT).length);
    Object.keys(byT).forEach(k => ok(byT[k].join() === byT[k].map((_, i) => i + 1).join(),
      table + '/' + k + ': номера идут не подряд с 1'));
  } else {
    ok(rolls.join() === rolls.map((_, i) => i + 1).join(),
      table + ': номера идут не подряд с 1 (' + rolls.length + ' позиций)');
  }
});

console.log('альтернативные таблицы');
['item', 'consumable'].forEach(kind => {
  Object.keys(ALT[kind]).forEach(rar => {
    ['hope', 'fear'].forEach(col => {
      const ids = ALT[kind][rar][col];
      ok(ids.length === 12, 'alt/' + kind + '/' + rar + '/' + col + ': не 12 позиций');
      ids.forEach(id => {
        ok(!!byId[id], 'alt/' + kind + '/' + rar + '/' + col + ': нет записи ' + id);
        ok(byId[id] && byId[id].kind === kind,
           'alt/' + kind + ': ' + id + ' на самом деле ' + (byId[id] || {}).kind);
      });
    });
  });
});

console.log('ссылки между записями');
ALL.forEach(x => {
  if (x.craft) ok(!!byId[x.craft], x.id + ': улучшается в несуществующий ' + x.craft);
  (x.refs || []).forEach(r => ok(!!REFS[r], x.id + ': ссылка на неизвестную карту ' + r));
});
const craftTargets = {};
ALL.filter(x => x.craft).forEach(x => {
  ok(!craftTargets[x.craft], 'в ' + x.craft + ' улучшается больше одной записи');
  craftTargets[x.craft] = x.id;
});
Object.keys(REFS).forEach(k => {
  ok(ALL.some(x => (x.refs || []).indexOf(k) >= 0), 'карта ' + k + ' не упомянута ни одной записью');
  ['en', 'ende', 'ru', 'rud', 'url'].forEach(f => ok(!!REFS[k][f], 'у карты ' + k + ' нет поля ' + f));
});

console.log('снаряжение');
const TRAITS = ['agility','strength','finesse','instinct','presence','knowledge'];
const RANGES = ['melee','veryclose','close','far','veryfar'];
EQ.forEach(x => {
  const e = x.eq;
  ok(!!e, x.id + ': нет блока eq');
  ok(['weapon','secondary','armor'].indexOf(e.t) >= 0, x.id + ': неизвестный тип ' + e.t);
  ok(e.tier >= 1 && e.tier <= 4, x.id + ': ранг вне 1–4');
  if (e.t === 'armor') {
    ok(e.as > 0 && Array.isArray(e.th) && e.th.length === 2, x.id + ': у брони нет порогов или показателя');
    ok(e.th[0] < e.th[1], x.id + ': пороги не по возрастанию');
    ok(e.tr === null && e.rg === null && e.bu === null, x.id + ': у брони заполнены поля оружия');
  } else {
    ok(TRAITS.indexOf(e.tr) >= 0, x.id + ': характеристика ' + e.tr);
    ok(RANGES.indexOf(e.rg) >= 0, x.id + ': дистанция ' + e.rg);
    ok(/^d\d+(\+\d+)?$/.test(e.dmg || ''), x.id + ': урон ' + e.dmg);
    ok(['phy','mag','any'].indexOf(e.dt) >= 0, x.id + ': тип урона ' + e.dt);
    ok(['phy','mag'].indexOf(e.cls) >= 0, x.id + ': класс ' + e.cls);
    ok(e.bu === 1 || e.bu === 2, x.id + ': хват ' + e.bu);
    ok(e.as === null && e.th === null, x.id + ': у оружия заполнены поля брони');
  }
  if (e.line) {
    ok(!!byId[e.line], x.id + ': линейка указывает на несуществующий ' + e.line);
    ok(byId[e.line] && byId[e.line].eq.t === e.t, x.id + ': линейка из другого типа снаряжения');
  }
});
/* four steps per line, and the head is its own first step */
const lines = {};
EQ.filter(x => x.eq.line).forEach(x => { (lines[x.eq.line] = lines[x.eq.line] || []).push(x); });
Object.keys(lines).forEach(head => {
  const tiers = lines[head].map(x => x.eq.tier).sort();
  ok(tiers.join() === '1,2,3,4', 'линейка ' + head + ': ранги ' + tiers.join());
  ok(byId[head].eq.tier === 1, 'линейка ' + head + ' начинается не с ранга 1');
});
ok(Object.keys(lines).length === 58, 'линеек не 58, а ' + Object.keys(lines).length);

console.log('файлы');
ALL.forEach(x => {
  if (!x.img) return;
  ok(fs.existsSync(path.join(ROOT, 'img', x.img)), x.id + ': нет файла img/' + x.img);
  ok(fs.existsSync(path.join(ROOT, 'og', x.img.replace(/\.webp$/, '.jpg'))),
     x.id + ': нет файла og/' + x.img.replace(/\.webp$/, '.jpg'));
});
/* Several records may point at one file: the book gives an upgraded weapon the
   same picture as its base, and four copies of the same bytes helped nobody. */
const used = new Set(ALL.filter(x => x.img).map(x => x.img));
fs.readdirSync(path.join(ROOT, 'img')).forEach(f => {
  if (f === '_none.webp' || !f.endsWith('.webp')) return;
  ok(used.has(f), 'картинка img/' + f + ' никому не принадлежит');
});
ALL.forEach(x => ok(fs.existsSync(path.join(ROOT, 'i', x.id + '.html')),
                    x.id + ': нет страницы-заглушки'));
ok(fs.readdirSync(path.join(ROOT, 'i')).filter(f => f.endsWith('.html')).length === ALL.length,
   'заглушек в i/ не столько же, сколько записей');

console.log('общие картинки');
const shared = {};
ALL.filter(x => x.img).forEach(x => { (shared[x.img] = shared[x.img] || []).push(x); });
Object.keys(shared).forEach(img => {
  const rows = shared[img];
  if (rows.length < 2) return;
  // sharing is only legitimate inside one upgrade line
  const lines = new Set(rows.map(r => (r.eq && r.eq.line) || r.id));
  ok(lines.size === 1, 'картинку ' + img + ' делят несвязанные записи: ' + rows.map(r => r.en).join(', '));
});
/* Extraction used to swallow the row that followed the last one in a table:
   the next item's name in caps, or the header of the next table, ended up glued
   to a description — and the last row itself came out truncated (issues #1, #3). */
console.log('описания без чужого текста');
const HEADERS = ['Название Характеристика', 'Name Trait Range', 'Базовые Пороги',
                 'Base Thresholds', 'Хват Свойство', 'Burden Feature',
                 'Название Пороги', 'Показатель Брони Свойство'];
const ENDS = /[.!?»)”"’\]]\s*$/;
ALL.forEach(x => {
  [['ende', x.ende, /(?:^|[.\s])((?:[A-ZÄÖÜÉ][A-ZÄÖÜÉ’'-]{2,}\s+){0,4}[A-ZÄÖÜÉ][A-ZÄÖÜÉ’'-]{2,})\s*$/],
   ['rud',  x.rud,  /(?:^|[.\s])((?:[А-ЯЁ][А-ЯЁ-]{2,}\s+){0,4}[А-ЯЁ][А-ЯЁ-]{2,})\s*$/]
  ].forEach(([f, t, caps]) => {
    t = (t || '').trim();
    if (!t) return;
    HEADERS.forEach(h => ok(t.indexOf(h) < 0, x.id + '.' + f + ': шапка таблицы «' + h + '»'));
    const m = caps.exec(t);
    ok(!m || m[1].length <= 5, x.id + '.' + f + ': капсом в хвосте «' + (m && m[1]) + '»');
  });
  /* one language finishing a sentence where the other does not means one of
     them lost its tail */
  const e = (x.ende || '').trim(), r = (x.rud || '').trim();
  if (e && r) ok(ENDS.test(e) === ENDS.test(r),
    x.id + ': предложение кончается по-разному — EN «…' + e.slice(-30) + '» / RU «…' + r.slice(-30) + '»');
});

/* the tier 4 armour that was missing from Hope & Fear entirely */
['Hallowed Heroplate', 'Resonant Harness'].forEach(n =>
  ok(EQ.some(x => x.en === n), 'нет брони ' + n));
const t4 = EQ.filter(x => x.src === 'hnf' && x.eq.t === 'armor' && x.eq.tier === 4);
ok(t4.length === 10, 'брони 4 ранга из H&F не 10, а ' + t4.length);

/* Из таблиц книги в название однажды затесалось слово из шапки: «Брони
   Ускользающее Лезвие». Служебному слову в начале названия взяться неоткуда. */
console.log('названия без служебных слов');
const HEADWORDS = ['Брони', 'Броня', 'Оружие', 'Оружия', 'Предмет', 'Расходник',
                   'Название', 'Ранг', 'Свойство', 'Хват', 'Урон', 'Дистанция',
                   'Характеристика', 'Пороги', 'Показатель'];
ALL.forEach(x => {
  const first = x.ru.split(' ')[0];
  ok(!(HEADWORDS.indexOf(first) >= 0 && x.ru.split(' ').length > 1),
     x.id + ': название начинается со служебного слова — ' + x.ru);
  ok(!/^(Name|Trait|Range|Damage|Burden|Feature|Base)\b/.test(x.en),
     x.id + ': английское название из шапки таблицы — ' + x.en);
});

/* no two files may hold the same bytes */
const crypto = require('crypto');
const seen = {};
fs.readdirSync(path.join(ROOT, 'img')).forEach(f => {
  if (!f.endsWith('.webp')) return;
  const sum = crypto.createHash('md5').update(fs.readFileSync(path.join(ROOT, 'img', f))).digest('hex');
  ok(!seen[sum], 'img/' + f + ' — байт-в-байт копия ' + seen[sum]);
  seen[sum] = f;
});

console.log(fail ? '\n' + fail + ' FAILED' : '\nданные: все инварианты соблюдены');
process.exit(fail ? 1 : 0);
