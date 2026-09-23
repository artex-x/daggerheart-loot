/* Craft/upgrade chains: data integrity + the generated share stubs.

   This file covers only its two DOM-free sections - data integrity and the
   share stubs on disk. The sections that used to render the live
   `index.html` + `app.js` in JSDOM (craft-block rendering, the language
   switch, the clipboard payload, table-row captions) are gone; `docs/specs/
   COVERAGE.md`'s `craft` row says where each of those assertions went - most
   are now covered by `record.test.ts`/`share.test.ts`/`tables.test.ts` on a
   synthetic or golden-pinned record. */
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
ALL.forEach((x) => {
  BY_ID[x.id] = x;
});
const withCraft = ALL.filter((x) => x.craft);

console.log('data (' + withCraft.length + ' chains)');
ok(withCraft.length === 17, 'expected 17 chains, got ' + withCraft.length);

const targets = {};
withCraft.forEach((x) => {
  const c = x.craft;
  // the field is a bare id: a chain that points nowhere is not represented at all
  ok(
    typeof c === 'string',
    x.id + ': craft should be a plain id string, got ' + JSON.stringify(c)
  );
  ok(!!BY_ID[c], x.id + ': craft target "' + c + '" does not exist');
  ok(c !== x.id, x.id + ': crafts into itself');
  ok(!targets[c], c + ': two different sources claim it');
  targets[c] = x.id;
});

// Chrono-Quill is a typo in the source book: indexed, but never described
ok(
  !ALL.some((x) => /Хронопера|Chrono.?Quill/i.test(JSON.stringify(x))),
  'Chrono-Quill should be gone from the data entirely'
);

// a chain must terminate: following craft can never come back around
withCraft.forEach((x) => {
  const seen = {};
  let cur = x;
  while (cur && cur.craft) {
    if (seen[cur.id]) {
      ok(false, x.id + ': cycle in the craft chain');
      break;
    }
    seen[cur.id] = 1;
    cur = BY_ID[cur.craft];
  }
});

// the prose the metadata replaced must be gone from every description
const leftover = ALL.filter((x) =>
  /Переработать в|Craft\s*into/i.test((x.rud || '') + (x.ende || ''))
);
ok(leftover.length === 0, 'stale craft sentence in: ' + leftover.map((x) => x.id).join(', '));

// nothing else got damaged while rewriting data.js
ok(ALL.length === 891, 'expected 891 records, got ' + ALL.length);
ALL.forEach((x) => {
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
  const potion = ALL.find((x) => x.id === 'cc16');
  const recipe = ALL.find((x) => x.id === 'ci24');
  ok(!!potion && !!recipe, 'missing the recipe/potion pair for the copy check');
}

const stub = fs.readFileSync(path.join(ROOT, 'i', 'w3.html'), 'utf8');
ok(
  /Улучшается до: Чай Эфироцвета/.test(stub),
  'i/w3.html: og description missing the craft line'
);
ok(
  /Получается из: Фроствирд \(Дремлющий\)\. Улучшается до: Фроствирд \(Возвышенный\)\./.test(
    fs.readFileSync(path.join(ROOT, 'i', 'dve25.html'), 'utf8')
  ),
  'i/dve25.html: og description must name made-from before upgrades-to'
);
/* loot + consumables + the equipment tables */
ok(
  fs.readdirSync(path.join(ROOT, 'i')).filter((f) => f.endsWith('.html')).length === 1272,
  'i/: expected 1272 stubs'
);
const stale = ALL.filter((x) => {
  const p = path.join(ROOT, 'i', x.id + '.html');
  /* Only the first line, not a raw 40-char slice: the generator prints one
     <p> per source line, so a multi-line description
     (five Vault of Ages records open with a one-line "Стоимость Призыва: N"
     header under 40 characters) no longer carries a raw "line one\nline two"
     substring anywhere in the stub - the newline is now a paragraph break. */
  const probe = x.rud.split('\n')[0].slice(0, 40);
  return !fs.existsSync(p) || fs.readFileSync(p, 'utf8').indexOf(probe) < 0;
});
ok(
  stale.length === 0,
  'stubs out of date: ' +
    stale
      .slice(0, 5)
      .map((x) => x.id)
      .join(', ')
);

/* 140 of 1272 stub pages (every record whose rud carries a newline) render a
   multi-line description, and nothing pins the new shape - the staleness
   probe above only proves a stub isn't stale, not what a fresh one actually
   renders. Pin it directly: descHtml() in tools/build-share-pages.js renders
   one <p> per source line, not one glued paragraph. */
console.log('multi-line description rendering');
const w6 = ALL.find((x) => x.id === 'w6');
ok(
  !!w6 && w6.rud.split('\n').length > 1,
  'w6 is expected to carry a multi-line rud for this probe'
);
if (w6) {
  const w6Lines = w6.rud.split('\n');
  const w6Stub = fs.readFileSync(path.join(ROOT, 'i', 'w6.html'), 'utf8');
  const w6Paragraphs = [...w6Stub.matchAll(/^\s*<p>(.*)<\/p>$/gm)].map((m) => m[1]);
  ok(
    w6Paragraphs.length === w6Lines.length,
    'w6.html: expected one <p> per source line (' +
      w6Lines.length +
      '), got ' +
      w6Paragraphs.length
  );
  w6Lines.forEach((line, i) => {
    ok(
      w6Paragraphs[i] === line,
      'w6.html: paragraph ' + i + ' does not match its source line verbatim'
    );
  });
}

console.log(failed() ? '\n' + failed() + ' FAILED' : '\nall checks passed');
process.exit(failed() ? 1 : 0);
