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
ok(ALL.length === 828, 'записей не 828, а ' + ALL.length);
ALL.forEach(x => ok(/^[a-z]+\d+$/.test(x.id), 'странный id: ' + x.id));

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
  ok(['core', 'hnf', 'wondrous', 'community'].indexOf(x.src) >= 0, x.id + ': неизвестный src ' + x.src);
});

console.log('текстовая гигиена');
ALL.forEach(x => {
  ['en', 'ende', 'ru', 'rud'].forEach(k => {
    const v = x[k] || '';
    ok(v === v.trim(), x.id + '.' + k + ': пробелы по краям');
    ok(!/\s\s/.test(v), x.id + '.' + k + ': двойной пробел');
    ok(!/<[a-z/]/i.test(v), x.id + '.' + k + ': разметка в тексте');
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
const used = new Set(ALL.filter(x => x.img).map(x => x.img));
fs.readdirSync(path.join(ROOT, 'img')).forEach(f => {
  if (f === '_none.webp') return;
  ok(used.has(f), 'картинка img/' + f + ' никому не принадлежит');
});
ALL.forEach(x => ok(fs.existsSync(path.join(ROOT, 'i', x.id + '.html')),
                    x.id + ': нет страницы-заглушки'));
ok(fs.readdirSync(path.join(ROOT, 'i')).filter(f => f.endsWith('.html')).length === ALL.length,
   'заглушек в i/ не столько же, сколько записей');

console.log(fail ? '\n' + fail + ' FAILED' : '\nданные: все инварианты соблюдены');
process.exit(fail ? 1 : 0);
