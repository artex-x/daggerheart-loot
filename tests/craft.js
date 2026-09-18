/* Craft/upgrade chains: data integrity + the generated share stubs.

   R0c (2026-09-17) trimmed this file to its two DOM-free sections - data
   integrity and the share stubs on disk. The middle sections rendered the
   live `index.html` + `app.js` in JSDOM (craft-block rendering, the language
   switch, the clipboard payload, table-row captions); `docs/specs/
   COVERAGE.md`'s `craft` row says where each of those assertions went - most
   are now covered by `record.test.ts`/`share.test.ts`/`tables.test.ts` on a
   synthetic or golden-pinned record, and the sweep (`issues/47/sweep.md`,
   Part E(ii-a)) records the handful that lost their real-data breadth. */
const fs = require('fs');
const path = require('path');

const ROOT = require('path').join(__dirname, '..');
const { ok, failed } = require('./ok.js');

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
ok(ALL.length === 710, 'expected 710 records, got ' + ALL.length);
ALL.forEach(x => {
  ok(!!(x.id && x.en && x.ru), x.id + ': empty field');
  /* Equipment from a campaign frame carries no feature from the book at all -
     some records show a dash in that column, and an empty description there
     is legitimate. */
  ok(!!(x.ende && x.rud) || !!x.eq, x.id + ': empty description');
  /* A picture may be shared with another record: the steps of an upgrade
     line draw the same item, and keeping four copies of one file serves
     nobody. */
  ok(!x.img || /^[a-z0-9_]+\.webp$/.test(x.img), x.id + ': odd picture name ' + x.img);
});

/* ---------- 6. share stubs ---------- */
console.log('share stubs');
/* Only what an item upgrades into goes into the player-facing message. The
   reverse direction - the recipe for what they already hold - is not needed
   in the copy. */
{
  const potion = ALL.find(x => x.id === 'cc16');
  const recipe = ALL.find(x => x.id === 'ci24');
  ok(!!potion && !!recipe, 'missing the recipe/potion pair for the copy check');
}

const stub = fs.readFileSync(path.join(ROOT, 'i', 'w3.html'), 'utf8');
ok(/Улучшается до: Чай Эфироцвета/.test(stub), 'i/w3.html: og description missing the craft line');
/* loot + consumables + the equipment tables */
ok(fs.readdirSync(path.join(ROOT, 'i')).filter(f => f.endsWith('.html')).length === 1091,
   'i/: expected 1091 stubs');
const stale = ALL.filter(x => {
  const p = path.join(ROOT, 'i', x.id + '.html');
  /* Only the first line, not a raw 40-char slice: issues/phase-8, O6 made the
     generator print one <p> per source line, so a multi-line description
     (five Vault of Ages records open with a one-line "Стоимость Призыва: N"
     header under 40 characters) no longer carries a raw "line one\nline two"
     substring anywhere in the stub - the newline is now a paragraph break. */
  const probe = x.rud.split('\n')[0].slice(0, 40);
  return !fs.existsSync(p) || fs.readFileSync(p, 'utf8').indexOf(probe) < 0;
});
ok(stale.length === 0, 'stubs out of date: ' + stale.slice(0, 5).map(x => x.id).join(', '));

console.log(failed() ? '\n' + failed() + ' FAILED' : '\nall checks passed');
process.exit(failed() ? 1 : 0);
