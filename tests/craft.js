/* Craft/upgrade chains: data integrity + rendering + clipboard payload. */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = require('path').join(__dirname, '..');
let fail = 0;
const ok = (cond, msg) => { if (!cond) { fail++; console.log('  FAIL ' + msg); } };

/* ---------- 1. data integrity, no DOM needed ---------- */
global.window = {};
require(path.join(ROOT, 'data.js'));
const DATA = global.window.LOOT.items;
const ALL = [].concat(...Object.values(DATA));
const BY_ID = {};
ALL.forEach(x => { BY_ID[x.id] = x; });
const withCraft = ALL.filter(x => x.craft);

console.log('data (' + withCraft.length + ' chains)');
ok(withCraft.length === 15, 'expected 15 chains, got ' + withCraft.length);

const targets = {};
withCraft.forEach(x => {
  const c = x.craft;
  // the field is a bare id: a chain that points nowhere is not represented at all
  ok(typeof c === 'string', x.id + ': craft should be a plain id string, got ' + JSON.stringify(c));
  ok(!!BY_ID[c], x.id + ': craft target "' + c + '" does not exist');
  ok(c !== x.id, x.id + ': crafts into itself');
  ok(!targets[c], c + ': two different sources claim it');
  targets[c] = x.id;
});

// Chrono-Quill is a typo in the source book: indexed, but never described
ok(!ALL.some(x => /Хронопера|Chrono.?Quill/i.test(JSON.stringify(x))),
   'Chrono-Quill should be gone from the data entirely');

// a chain must terminate: following craft can never come back around
withCraft.forEach(x => {
  const seen = {};
  let cur = x;
  while (cur && cur.craft) {
    if (seen[cur.id]) { ok(false, x.id + ': cycle in the craft chain'); break; }
    seen[cur.id] = 1;
    cur = BY_ID[cur.craft];
  }
});

// the prose the metadata replaced must be gone from every description
const leftover = ALL.filter(x => /Переработать в|Craft\s*into/i.test((x.rud || '') + (x.ende || '')));
ok(leftover.length === 0, 'stale craft sentence in: ' + leftover.map(x => x.id).join(', '));

// nothing else got damaged while rewriting data.js
ok(ALL.length === 572, 'expected 572 records, got ' + ALL.length);
ALL.forEach(x => {
  ok(!!(x.id && x.en && x.ru), x.id + ': empty field');
  /* Снаряжению из кампейн-фрейма книга свойства не даёт вовсе - у части записей
     в графе стоит прочерк, и пустое описание там законно. */
  ok(!!(x.ende && x.rud) || !!x.eq, x.id + ': empty description');
  /* Арта для фреймов нет, исходников тоже; заглушка - осознанное состояние */
  ok(!x.img || x.img === x.id + '.webp', x.id + ': img/id mismatch');
});

/* ---------- 2. rendering, in a real DOM ---------- */
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://artex-x.github.io/daggerheart-loot/',
  beforeParse(w){
    w.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
    w.scrollTo = () => {};
    w.HTMLElement.prototype.scrollIntoView = () => {};
    // app.js lives in an IIFE, so the clipboard is the only way to observe
    // what a copy actually puts on the pasteboard
    w.isSecureContext = true;
    // lists are read from storage once at startup, so seed before app.js runs
    w.localStorage.setItem('dhloot.lists.v2', JSON.stringify(
      [{ id: 'tst', name: 'Тест', ids: ['w3', 'w1'], created: 1 }]));
    w.ClipboardItem = class { constructor(map){ this.map = map; } };
    w.__clip = null;
    Object.defineProperty(w.navigator, 'clipboard', {
      configurable: true,
      value: { write: items => { w.__clip = items[0].map; return Promise.resolve(); } }
    });
  }
});
const w = dom.window;
['data.js', 'app.js'].forEach(f => {
  const s = w.document.createElement('script');
  s.textContent = fs.readFileSync(path.join(ROOT, f), 'utf8');
  w.document.body.appendChild(s);
});

const go = hash => {
  w.location.hash = hash;
  w.dispatchEvent(new w.Event('hashchange'));
};
const card = () => w.document.querySelector('#view .card.full');

console.log('render');

// forward direction, target exists → real link
go('#/i/w3');
let c = card().querySelector('.craft');
ok(!!c, 'w3: no craft block');
ok(/Улучшается до/.test(c.textContent), 'w3: wrong label, got "' + c.textContent.trim() + '"');
ok(/Чай Эфироцвета/.test(c.textContent), 'w3: target name missing');
ok(c.querySelector('a') && c.querySelector('a').getAttribute('href') === '#/i/w2',
   'w3: link should point at #/i/w2');

// reverse direction is derived, not stored
go('#/i/w2');
c = card().querySelector('.craft');
ok(!!c && /Получается из/.test(c.textContent), 'w2: reverse label missing');
ok(c && c.querySelector('a') && c.querySelector('a').getAttribute('href') === '#/i/w3',
   'w2: link should point back at #/i/w3');

// the chain to the item the book never described is gone, not half-rendered
go('#/i/w15');
ok(!card().querySelector('.craft'), 'w15: craft block should be gone with Chrono-Quill');

// every rendered craft row is a working link — no dead ends anywhere in the set
withCraft.concat(Object.keys(targets).map(id => BY_ID[id])).forEach(x => {
  go('#/i/' + x.id);
  const rows = [...card().querySelectorAll('.craft p')];
  ok(rows.length > 0, x.id + ': expected a craft row');
  rows.forEach(p => {
    const a = p.querySelector('a');
    ok(!!a, x.id + ': craft row without a link');
    if (a) ok(!!BY_ID[a.getAttribute('href').replace('#/i/', '')],
              x.id + ': craft link points at a missing record');
  });
});

// core recipe, same neutral wording as everything else
go('#/i/ci19');
c = card().querySelector('.craft');
ok(!!c && /Улучшается до/.test(c.textContent), 'ci19: label');
ok(c && c.querySelector('a').getAttribute('href') === '#/i/cc7', 'ci19: link target');

// an ordinary item stays clean
go('#/i/w1');
ok(!card().querySelector('.craft'), 'w1: craft block rendered on an item with no chain');

/* ---------- 3. language ---------- */
w.document.querySelector('#langSeg button[data-lang="en"]').click();
go('#/i/w3');
c = card().querySelector('.craft');
ok(!!c && /Upgrades to/.test(c.textContent), 'EN: label not translated, got "' + (c && c.textContent.trim()) + '"');
ok(c && /Aetherflower Tea/.test(c.textContent), 'EN: target name should be English');
w.document.querySelector('#langSeg button[data-lang="ru"]').click();

/* ---------- 4. clipboard payload ---------- */
console.log('copy / share');

/* Copies the item the way a user does — clicking the button — and reads back
   both clipboard flavours. Returns {plain, html}. */
async function copyOf(id){
  go('#/i/' + id);
  w.__clip = null;
  card().querySelector('[data-copy-full]').click();
  await new Promise(r => setTimeout(r, 0));
  ok(!!w.__clip, id + ': nothing reached the clipboard');
  if (!w.__clip) return { plain: '', html: '' };
  return {
    plain: await w.__clip['text/plain'].text(),
    html:  await w.__clip['text/html'].text()
  };
}

(async function () {
  const a = await copyOf('w3');
  ok(/Улучшается до: Чай Эфироцвета/.test(a.plain), 'w3 copy: craft line missing:\n' + a.plain);
  ok(/Эфироцвет/.test(a.plain) && a.plain.length > 60, 'w3 copy: description lost');
  ok(/<b>/.test(a.html), 'w3 copy: rich flavour lost the bold name');
  ok(/Улучшается до: Чай Эфироцвета/.test(a.html), 'w3 copy: rich flavour lost the craft line');
  ok(!/<a /.test(a.html), 'w3 copy: rich flavour should paste link-free');
  ok(a.plain.indexOf('*') < 0, 'w3 copy: stray markdown in the plain flavour');

  const b = await copyOf('w2');
  ok(/Получается из: Эфироцвет/.test(b.plain), 'w2 copy: reverse line missing');

  const c2 = await copyOf('w1');
  ok(c2.plain.indexOf('Улучшается') < 0 && c2.plain.indexOf('Получается из') < 0,
     'w1 copy: craft line added to an item with no chain');

  // and through the list export
  go('#/lists/tst');
  const btn = w.document.querySelector('[data-copy-listtext]');
  ok(!!btn, 'list page: copy button missing');
  if (btn) {
    w.__clip = null;
    btn.click();
    await new Promise(r => setTimeout(r, 0));
    const lp = w.__clip ? await w.__clip['text/plain'].text() : '';
    const lh = w.__clip ? await w.__clip['text/html'].text() : '';
    ok(/Улучшается до: Чай Эфироцвета/.test(lp), 'list copy: craft line missing:\n' + lp);
    ok(/Улучшается до/.test(lh), 'list copy: rich flavour lost the craft line');
  }
  finish();
})();

/* ---------- 5. dense rows, share stubs ---------- */
function finish(){
console.log('table rows');
go('#/tables/wondrous');
const rows = [...w.document.querySelectorAll('#view .row')];
ok(rows.length > 0, 'no rows rendered');
const w3row = rows.find(r => r.querySelector('[data-open="w3"]'));
ok(!!w3row && !!w3row.querySelector('.rcraft'), 'w3 row: craft caption missing');
ok(!w3row || !w3row.querySelector('.rcraft a'), 'w3 row: a link cannot be nested inside the row button');
const w1row = rows.find(r => r.querySelector('[data-open="w1"]'));
ok(!w1row || !w1row.querySelector('.rcraft'), 'w1 row: caption on an item with no chain');

/* ---------- 6. share stubs ---------- */
console.log('share stubs');
const stub = fs.readFileSync(path.join(ROOT, 'i', 'w3.html'), 'utf8');
ok(/Улучшается до: Чай Эфироцвета/.test(stub), 'i/w3.html: og description missing the craft line');
/* loot + consumables + the equipment tables */
ok(fs.readdirSync(path.join(ROOT, 'i')).filter(f => f.endsWith('.html')).length === 953,
   'i/: expected 953 stubs');
const stale = ALL.filter(x => {
  const p = path.join(ROOT, 'i', x.id + '.html');
  return !fs.existsSync(p) || fs.readFileSync(p, 'utf8').indexOf(x.rud.slice(0, 40)) < 0;
});
ok(stale.length === 0, 'stubs out of date: ' + stale.slice(0, 5).map(x => x.id).join(', '));

console.log(fail ? '\n' + fail + ' FAILED' : '\nall checks passed');
process.exit(fail ? 1 : 0);
}
