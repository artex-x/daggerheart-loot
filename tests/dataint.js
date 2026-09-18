/* Invariants of data.js, checked without a browser: ids, numbering, references,
   text hygiene and the files the records point at. */
const fs = require('fs');
const path = require('path');
const ROOT = require('path').join(__dirname, '..');
const { ok, failed } = require('./ok.js');

global.window = {};
require(path.join(ROOT, 'data.js'));
const L = global.window.LOOT;
const DATA = L.items, EQ = L.eq, ALT = L.alt, REFS = L.refs;
const ALL = [].concat(...Object.values(DATA), EQ);

console.log('identifiers');
const byId = {};
ALL.forEach(x => { ok(!byId[x.id], 'duplicate id: ' + x.id); byId[x.id] = x; });
ok(ALL.length === 1091, 'records are not 1091, but ' + ALL.length);
/* Vault of Ages numbers its cards by book volume and section, not straight
   through: voa2_a1 - volume two, first artifact. Links, filenames and list
   codes all hang on id, so the book's own scheme is different but just as
   strict. */
ALL.forEach(x => ok(/^[a-z]+\d+$/.test(x.id) || /^voa[123]_(t[1-4]|a|c)[a-z0-9]+$/.test(x.id),
  'odd id: ' + x.id));

console.log('required fields');
ALL.forEach(x => {
  ['en', 'ende', 'ru', 'rud'].forEach(k => {
    const v = x[k];
    // equipment without a feature has no description, and that is legitimate
    if (k.endsWith('e') && x.eq && v === '') return;
    if (k === 'rud' && x.eq && v === '') return;
    ok(typeof v === 'string' && v.length > 0, x.id + ': empty field ' + k);
  });
  ok(['item', 'consumable', 'equip'].indexOf(x.kind) >= 0, x.id + ': unknown kind ' + x.kind);
  ok(['core', 'hnf', 'wondrous', 'dread', 'voa', 'frame', 'community'].indexOf(x.src) >= 0, x.id + ': unknown src ' + x.src);
});

console.log('text hygiene');
ALL.forEach(x => {
  ['en', 'ende', 'ru', 'rud'].forEach(k => {
    const v = x[k] || '';
    ok(v === v.trim(), x.id + '.' + k + ': whitespace at the edges');
    ok(!/\s\s/.test(v), x.id + '.' + k + ': double space');
    ok(!/<[a-z/]/i.test(v), x.id + '.' + k + ': markup in the text');
    /* daggerheart.su ships markdown: emphasis and rule links. The links were
       stripped, the asterisks were not, and one description shipped *Restrain*
       to the reader. */
    ok(!/[*`]/.test(v), x.id + '.' + k + ': markdown markup in the text');
    ok(!/\[[^\]]*\]\(|\/rule\/|#\{|\}#/.test(v), x.id + '.' + k + ': leftover markdown link');
    /* Those same links lost the space that followed them, gluing a rule term to
       the next word: "within Meleerange", "bonus to your Proficiencyon". */
    ok(!/(Melee|Close|Far|Proficiency|Evasion|Spellcast|advantage|disadvantage)(range|on|of|to|with)\b/.test(v),
       x.id + '.' + k + ': words glued together after a link');
    ok(!/�/.test(v), x.id + '.' + k + ': broken character');
  });
  ok(!/^[a-z]/.test(x.en), x.id + ': English name starts lowercase — ' + x.en);
  ok(!/^[а-яё]/.test(x.ru), x.id + ': Russian name starts lowercase — ' + x.ru);
});

console.log('table numbering');
const ROLL_POOLS = [];
Object.keys(DATA).forEach(table => {
  if (table === 'frames' || table === 'starting') return;
  if (table === 'community') {
    const byC = {};
    DATA[table].forEach(x => { (byC[x.community] = byC[x.community] || []).push(x); });
    ok(Object.keys(byC).length === 9, 'communities are not 9');
    Object.entries(byC).forEach(([community, rows]) => ROLL_POOLS.push([table + '/' + community, rows]));
  } else if (table === 'voa') {
    /* A Vault roll is within its printed section, so each section is its own
       pool rather than a position in the whole book. */
    const byT = {};
    DATA[table].forEach(x => { (byT[x.tier] = byT[x.tier] || []).push(x); });
    ok(Object.keys(byT).length === 6, 'Vault of Ages sections are not 6, but ' + Object.keys(byT).length);
    Object.entries(byT).forEach(([tier, rows]) => ROLL_POOLS.push([table + '/' + tier, rows]));
  } else {
    ROLL_POOLS.push([table, DATA[table]]);
  }
});
const ROLLED = new Set(ROLL_POOLS.flatMap(([, rows]) => rows));
ALL.forEach(x => ok(ROLLED.has(x) === (x.roll != null),
  x.id + ': roll number does not match pool membership'));
ROLL_POOLS.forEach(([name, rows]) => {
  const rolls = rows.map(x => x.roll);
  ok(rolls.every(n => Number.isInteger(n) && n > 0), name + ': roll number is not a positive integer');
  ok(new Set(rolls).size === rolls.length, name + ': duplicate roll number');
  ok([...rolls].sort((a, b) => a - b).join() === rows.map((_, i) => i + 1).join(),
    name + ': numbers do not cover 1-' + rows.length);
});

console.log('alternate tables');
['item', 'consumable'].forEach(kind => {
  Object.keys(ALT[kind]).forEach(rar => {
    ['hope', 'fear'].forEach(col => {
      const ids = ALT[kind][rar][col];
      ok(ids.length === 12, 'alt/' + kind + '/' + rar + '/' + col + ': not 12 entries');
      ids.forEach(id => {
        ok(!!byId[id], 'alt/' + kind + '/' + rar + '/' + col + ': no record ' + id);
        ok(byId[id] && byId[id].kind === kind,
           'alt/' + kind + ': ' + id + ' is actually ' + (byId[id] || {}).kind);
      });
    });
  });
});

console.log('cross-references between records');
ALL.forEach(x => {
  if (x.craft) ok(!!byId[x.craft], x.id + ': upgrades into a nonexistent ' + x.craft);
  (x.refs || []).forEach(r => ok(!!REFS[r], x.id + ': reference to an unknown card ' + r));
});
const craftTargets = {};
ALL.filter(x => x.craft).forEach(x => {
  ok(!craftTargets[x.craft], 'more than one record upgrades into ' + x.craft);
  craftTargets[x.craft] = x.id;
});
Object.keys(REFS).forEach(k => {
  ok(ALL.some(x => (x.refs || []).indexOf(k) >= 0), 'card ' + k + ' is not mentioned by any record');
  ['en', 'ende', 'ru', 'rud', 'url'].forEach(f => ok(!!REFS[k][f], 'card ' + k + ' is missing field ' + f));
});

console.log('equipment');
const TRAITS = ['agility','strength','finesse','instinct','presence','knowledge'];
const RANGES = ['melee','veryclose','close','far','veryfar'];
EQ.forEach(x => {
  const e = x.eq;
  ok(!!e, x.id + ': no eq block');
  ok(['weapon','secondary','armor'].indexOf(e.t) >= 0, x.id + ': unknown type ' + e.t);
  ok(e.tier >= 1 && e.tier <= 4, x.id + ': tier outside 1-4');
  if (e.t === 'armor') {
    ok(e.as > 0 && Array.isArray(e.th) && e.th.length === 2, x.id + ': armour is missing thresholds or a score');
    ok(e.th[0] < e.th[1], x.id + ': thresholds are not ascending');
    ok(e.tr === null && e.rg === null && e.bu === null, x.id + ': armour has weapon fields filled in');
  } else {
    ok(TRAITS.indexOf(e.tr) >= 0, x.id + ': trait ' + e.tr);
    ok(RANGES.indexOf(e.rg) >= 0, x.id + ': range ' + e.rg);
    ok(/^d\d+(\+\d+)?$/.test(e.dmg || ''), x.id + ': damage ' + e.dmg);
    ok(['phy','mag','any'].indexOf(e.dt) >= 0, x.id + ': damage type ' + e.dt);
    ok(['phy','mag'].indexOf(e.cls) >= 0, x.id + ': class ' + e.cls);
    ok(e.bu === 1 || e.bu === 2, x.id + ': burden ' + e.bu);
    ok(e.as === null && e.th === null, x.id + ': weapon has armour fields filled in');
  }
  if (e.line) {
    ok(!!byId[e.line], x.id + ': upgrade line points at a nonexistent ' + e.line);
    ok(byId[e.line] && byId[e.line].eq.t === e.t, x.id + ': upgrade line is a different equipment type');
  }
});
/* four steps per line, and the head is its own first step */
const lines = {};
EQ.filter(x => x.eq.line).forEach(x => { (lines[x.eq.line] = lines[x.eq.line] || []).push(x); });
Object.keys(lines).forEach(head => {
  const tiers = lines[head].map(x => x.eq.tier).sort();
  ok(tiers.join() === '1,2,3,4', 'line ' + head + ': tiers ' + tiers.join());
  ok(byId[head].eq.tier === 1, 'line ' + head + ' does not start at tier 1');
});
ok(Object.keys(lines).length === 58, 'upgrade lines are not 58, but ' + Object.keys(lines).length);

console.log('files');
ALL.forEach(x => {
  if (!x.img) return;
  ok(fs.existsSync(path.join(ROOT, 'img', x.img)), x.id + ': missing file img/' + x.img);
  ok(fs.existsSync(path.join(ROOT, 'og', x.img.replace(/\.webp$/, '.jpg'))),
     x.id + ': missing file og/' + x.img.replace(/\.webp$/, '.jpg'));
});
/* Several records may point at one file: the book gives an upgraded weapon the
   same picture as its base, and four copies of the same bytes helped nobody. */
const used = new Set(ALL.filter(x => x.img).map(x => x.img));
fs.readdirSync(path.join(ROOT, 'img')).forEach(f => {
  if (f === '_none.webp' || !f.endsWith('.webp')) return;
  ok(used.has(f), 'picture img/' + f + ' belongs to nobody');
});
/* Same trap, ingest side: a stray og/<id>.jpg with no claiming record passes
   every other gate. og/ is named after the asset (img/<asset>.webp), not the
   record id, so this is the same `used` set, just re-suffixed. */
const usedJpg = new Set(Array.from(used).map(f => f.replace(/\.webp$/, '.jpg')));
fs.readdirSync(path.join(ROOT, 'og')).forEach(f => {
  if (f === '_none.jpg' || f === '_share.jpg' || !f.endsWith('.jpg')) return;
  ok(usedJpg.has(f), 'picture og/' + f + ' belongs to nobody');
});
ALL.forEach(x => ok(fs.existsSync(path.join(ROOT, 'i', x.id + '.html')),
                    x.id + ': no stub page'));
ok(fs.readdirSync(path.join(ROOT, 'i')).filter(f => f.endsWith('.html')).length === ALL.length,
   'stubs in i/ do not equal the record count');

console.log('shared pictures');
const shared = {};
ALL.filter(x => x.img).forEach(x => { (shared[x.img] = shared[x.img] || []).push(x); });
Object.keys(shared).forEach(img => {
  const rows = shared[img];
  if (rows.length < 2) return;
  // sharing is only legitimate inside one upgrade line
  const lines = new Set(rows.map(r => (r.eq && r.eq.line) || r.id));
  ok(lines.size === 1, 'picture ' + img + ' is shared by unrelated records: ' + rows.map(r => r.en).join(', '));
});
/* Extraction used to swallow the row that followed the last one in a table:
   the next item's name in caps, or the header of the next table, ended up glued
   to a description — and the last row itself came out truncated (issues #1, #3). */
console.log('descriptions carry no stray text');
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
    HEADERS.forEach(h => ok(t.indexOf(h) < 0, x.id + '.' + f + ': table header «' + h + '»'));
    const m = caps.exec(t);
    ok(!m || m[1].length <= 5, x.id + '.' + f + ': caps in the tail «' + (m && m[1]) + '»');
  });
  /* one language finishing a sentence where the other does not means one of
     them lost its tail */
  const e = (x.ende || '').trim(), r = (x.rud || '').trim();
  if (e && r) ok(ENDS.test(e) === ENDS.test(r),
    x.id + ': sentence ends differently — EN «…' + e.slice(-30) + '» / RU «…' + r.slice(-30) + '»');
});

/* the tier 4 armour that was missing from Hope & Fear entirely */
['Hallowed Heroplate', 'Resonant Harness'].forEach(n =>
  ok(EQ.some(x => x.en === n), 'missing armour ' + n));
const t4 = EQ.filter(x => x.src === 'hnf' && x.eq.t === 'armor' && x.eq.tier === 4);
ok(t4.length === 10, 'tier 4 armour from H&F is not 10, but ' + t4.length);

/* A table-header word once slipped into a name straight out of the book's
   tables: «Брони Ускользающее Лезвие» (Armour[-header-word] Elusive Blade).
   A header word has nowhere else to come from at the start of a name. */
console.log('names carry no header words');
const HEADWORDS = ['Брони', 'Броня', 'Оружие', 'Оружия', 'Предмет', 'Расходник',
                   'Название', 'Ранг', 'Свойство', 'Хват', 'Урон', 'Дистанция',
                   'Характеристика', 'Пороги', 'Показатель'];
ALL.forEach(x => {
  const first = x.ru.split(' ')[0];
  ok(!(HEADWORDS.indexOf(first) >= 0 && x.ru.split(' ').length > 1),
     x.id + ': name starts with a header word — ' + x.ru);
  ok(!/^(Name|Trait|Range|Damage|Burden|Feature|Base)\b/.test(x.en),
     x.id + ': English name is a table header word — ' + x.en);
});

/* no two files may hold the same bytes */
const crypto = require('crypto');
const seen = {};
fs.readdirSync(path.join(ROOT, 'img')).forEach(f => {
  if (!f.endsWith('.webp')) return;
  const sum = crypto.createHash('md5').update(fs.readFileSync(path.join(ROOT, 'img', f))).digest('hex');
  ok(!seen[sum], 'img/' + f + ' is a byte-for-byte copy of ' + seen[sum]);
  seen[sum] = f;
});

console.log(failed() ? '\n' + failed() + ' FAILED' : '\ndata: every invariant holds');
process.exit(failed() ? 1 : 0);
