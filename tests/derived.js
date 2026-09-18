/* data.json and catalog.csv are generated from data.js and live beside it.
   Inside `npm run check` they are already rebuilt by `npm run data` right
   before this check, so here the generator is compared against itself, not
   against the committed copy. A rebuild skipped before commit is caught by a
   separate CI step (`git diff --exit-code` after `npm run check`), not by
   this file. */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const D = require(path.join(ROOT, 'tools', 'derived.js'));
const { ok, failed } = require('./ok.js');

global.window = {};
require(path.join(ROOT, 'data.js'));
const L = global.window.LOOT;

console.log('generated files match data.js');
[
  ['data.json', D.dataJson],
  ['catalog.csv', D.catalogCsv]
].forEach(function ([name, make]) {
  const disk = fs.existsSync(path.join(ROOT, name))
    ? fs.readFileSync(path.join(ROOT, name), 'utf8')
    : null;
  ok(disk !== null, name + ': file is missing — run node tools/build.js');
  if (disk !== null) ok(disk === make(L), name + ': stale — run node tools/build.js');
});

console.log('catalog reads clean');
const catalogPath = path.join(ROOT, 'catalog.csv');
const rows = fs.existsSync(catalogPath)
  ? fs.readFileSync(catalogPath, 'utf8').trim().split('\n')
  : [];
ok(rows.length > 0, 'catalog.csv: file is missing — run node tools/build.js');
const ALL = D.everything(L);
/* Descriptions contain commas and quotes, and must never contain a newline -
   otherwise the file would have more lines than records. */
ok(
  rows.length === ALL.length + 1,
  'catalog.csv should have ' + (ALL.length + 1) + ' lines, not ' + rows.length
);
const head = rows[0].split(',');
ok(
  head[0] === 'id' && head.indexOf('tier') > 0 && head.indexOf('name_ru') > 0,
  'catalog header is wrong: ' + rows[0].slice(0, 60)
);

/* Is the catalog enough to stock a blacksmith: tier 1-2 armour, tier 1-2
   physical primary weapons. If so, an agent needs only this one file. */
const idx = {};
head.forEach((h, i) => {
  idx[h] = i;
});
const parsed = rows.slice(1).map(function (line) {
  const out = [];
  let cur = '',
    q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
});
ok(
  parsed.every((r) => r.length === head.length),
  'the catalog has a row of the wrong width'
);
const smith = parsed.filter(
  (r) =>
    (r[idx.kind] === 'armor' || (r[idx.kind] === 'weapon' && r[idx.class] === 'physical')) &&
    ['1', '2'].indexOf(r[idx.tier]) >= 0
);
ok(
  smith.length > 40,
  "can't pick a blacksmith's stock from the catalog: found " + smith.length
);
ok(
  parsed.every((r) => !r[idx.id] || /^https:\/\/artex-x\.github\.io\//.test(r[idx.url])),
  'the catalog has a broken link to a record page'
);

console.log('stubs match the generator');
/* craft.js checks stubs against the start of the description - that is
   enough while only the data changes. But an edit to the generator itself
   (say, an added meta tag) does not show there: the description matches
   while every page at once is stale. So here all 953 are re-rendered and
   compared in full. */
const { page } = require(path.join(ROOT, 'tools', 'build-share-pages.js'));
const drift = ALL.filter(function (x) {
  const p = path.join(ROOT, 'i', x.id + '.html');
  return !fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== page(x);
});
ok(
  drift.length === 0,
  'stubs are stale: ' +
    drift.length +
    ', for example ' +
    drift
      .slice(0, 5)
      .map((x) => x.id)
      .join(', ') +
    ' — run node tools/build.js'
);

console.log('not indexed');
/* A private tool: the pages must not show up in search results. This works
   only as a pair - crawling must stay allowed so noindex is even read, since
   a page blocked by robots can surface as a bare link in results without the
   tag ever being read. */
const NOINDEX = /<meta\s+name="robots"\s+content="noindex/i;
/* This checks the source, not the build: `npm run check` builds nothing, and
   a test that reads yesterday's dist/ is worse than no test. This used to
   compare both input pages - the root and app/index.html - while the old app
   lived alongside it (R0c deleted it). */
ok(
  NOINDEX.test(fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8')),
  'app/index.html has no noindex'
);
ok(NOINDEX.test(page(ALL[0])), 'the stub generator stopped setting noindex');
/* 404.html is authored, not generated (tools/build.js never touches it), so
   neither of the above two checks reaches it - a deleted noindex or a
   deleted id="app-404" marker on this file stayed green through npm run
   check and only reddened in the deploy guard's own 404-fallback checks
   (issues/phase-8, B4-5). Two lines make it a local gate too. */
const notFoundHtml = fs.readFileSync(path.join(ROOT, '404.html'), 'utf8');
ok(NOINDEX.test(notFoundHtml), '404.html has no noindex');
ok(notFoundHtml.includes('id="app-404"'), '404.html has lost its id="app-404" marker');
const rob = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
ok(
  /^User-agent: \*\s*\nAllow: \//m.test(rob),
  'robots.txt blocks crawling — then nobody reads noindex'
);
ok(
  /GPTBot|CCBot/.test(rob) && /Disallow: \//.test(rob),
  'robots.txt does not block AI training crawlers'
);
ok(
  !fs.existsSync(path.join(ROOT, 'sitemap.xml')),
  'a sitemap came back, and it exists for exactly the indexing this rejects'
);

console.log('app/index.html head reads clean');
/* This used to compare two input pages - the root and app/index.html -
   while the old app lived alongside it. R0c deleted index.html with it, so
   there is nothing left to compare against; one input page remains, and its
   head simply has to parse and carry everything a messenger preview card
   needs. `headFacts` reads only `<head>`, not the whole document - the body
   may mention `<meta`/`<title>` inside a code sample without risking being
   parsed. */
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
/* This used to be a bare `>= 20` threshold - "parsing broke". On live data
   it read exactly 20 (19 <meta> plus <title>), so it was not a floor but an
   exact count with no slack: drop any single <meta> and the message would
   lie that parsing broke, when parsing was right and the field simply
   vanished. Instead of a threshold - a named check for what parsing must
   find: every key in HEAD_META, plus the title. og: and twitter: get their
   own value checks below. */
HEAD_META.forEach(function (key) {
  ok(key in shareFacts, 'app/index.html head is missing ' + key);
});
ok('<title>' in shareFacts, 'app/index.html head is missing <title>');
/* The icon is part of the head too, but it is a <link>, not a <meta>. */
const ICON = /<link\s+rel="icon"\s+href="([^"]*)"/i;
const icon = (ICON.exec(fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8')) ||
  [])[1];
ok(!!icon, 'the tab icon is missing on app/index.html');

console.log('layout does not shift between a short and a long page');
/* tokens.css:93. Reserves the scrollbar gutter whether or not the page needs
   one, so a short route does not measure fifteen pixels wider than a long
   one - nothing else in tests/app/ reads this file as source text. */
ok(
  /scrollbar-gutter:\s*stable/.test(
    fs.readFileSync(path.join(ROOT, 'app', 'src', 'styles', 'tokens.css'), 'utf8')
  ),
  'html no longer reserves scrollbar-gutter: stable'
);

console.log('og facts are absolute values');
/* This block used to pin only what index.html and app/index.html agreed on -
   a generator change that shifted both pages the same wrong way would still
   pass. Now one page is checked against absolute values directly. */
const SITE = 'https://artex-x.github.io/daggerheart-loot/';
ok(
  shareFacts['og:image'] === SITE + 'og/_share.jpg',
  "og:image is not the site's shared picture, but something else: " + shareFacts['og:image']
);
ok(
  shareFacts['og:image:width'] === '1200' && shareFacts['og:image:height'] === '630',
  'og:image is not 1200x630: ' +
    shareFacts['og:image:width'] +
    'x' +
    shareFacts['og:image:height']
);
ok(fs.existsSync(path.join(ROOT, 'og', '_share.jpg')), 'the shared og picture is not on disk');
ok(
  shareFacts['twitter:image'] === shareFacts['og:image'],
  'twitter:image diverges from og:image: ' + shareFacts['twitter:image']
);
ok(shareFacts['og:locale'] === 'ru_RU', 'og:locale is not ru_RU: ' + shareFacts['og:locale']);

/* `/daggerheart-loot/` is hardcoded in 404.html's two way-home links too
   (tools/derived.js and tools/build-share-pages.js already read SITE, and
   llms.txt carries the same literal) - a repo rename or an apex CNAME would
   break all of them with every other gate green. One assertion against the
   pathname SITE already carries closes 404.html's own copy (issues/phase-8,
   B4-R4). */
ok(
  fs.readFileSync(path.join(ROOT, '404.html'), 'utf8').includes(new URL(SITE).pathname),
  '404.html no longer contains ' +
    new URL(SITE).pathname +
    ' - a repo rename or an apex CNAME would silently break its way-home links'
);

/* Every stub (i/<id>.html) is a square-art "summary" card, never the site's
   own "summary_large_image" - one record with art, one built with its art
   field stripped, so both branches of the img fallback are pinned, not only
   that a stub matches its own generator (the check above this file already
   proves that). Every real record carries art today, so the no-art branch
   has no record of its own to read off - built rather than found. */
const artless = Object.assign(
  {},
  ALL.find((x) => x.img && !x.eq && !x.craft)
);
delete artless.img;
[ALL.find((x) => x.img), artless].forEach(function (x) {
  const html = page(x);
  const twCard = /<meta name="twitter:card" content="([^"]*)">/.exec(html);
  ok(twCard && twCard[1] === 'summary', 'stub ' + x.id + ': twitter:card is not summary');
  const ogImg = /<meta property="og:image" content="([^"]*)">/.exec(html);
  const wantImg = SITE + 'og/' + (x.img ? x.img.replace(/\.webp$/, '.jpg') : '_none.jpg');
  ok(
    ogImg && ogImg[1] === wantImg,
    'stub ' + x.id + ': og:image is not ' + wantImg + ', but ' + (ogImg && ogImg[1])
  );
});

console.log('llms.txt');
const llms = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8');
[
  'catalog.csv',
  'data.json',
  '#/l/',
  'stamp',
  '10 handfuls = 1 bag',
  'Player note',
  'GM note',
  'Not indexed',
  'Read `catalog.csv` first',
  'Dread GM Toolbox',
  'Never name an item from memory',
  'daggerheart.com/srd',
  'deflate-raw',
  /* #13: the sources section - an agent needs to know how they differ, not
    just that they exist. #9: about link length rather than a compression
    recipe. */
  'Campaign Frames',
  'Do not invent a compression scheme'
].forEach((s) => ok(llms.indexOf(s) > 0, 'llms.txt does not mention ' + s));
/* The record count is named both in the site description and here - let a
   divergence be loud */
ok(llms.indexOf(String(ALL.length)) > 0, 'llms.txt has the wrong record count');

/* The worked example in llms.txt is what an agent will copy and repeat. Its
   checksum has to match what the algorithm described right there produces,
   and the ids have to exist. */
const items = /\nitems\s+([a-z0-9*,]+)\n/.exec(llms);
const st = /\nstamp\s+([0-9a-z]+\.[0-9a-z]{1,4})~/.exec(llms);
const pay = /\npayload\s+([\s\S]*?)\n\s*```/.exec(llms);
ok(!!items && !!st && !!pay, 'llms.txt: the worked list example was not found');
if (items && st && pay) {
  const body = items[1],
    parts = body.split(',');
  let h = 2166136261;
  for (let i = 0; i < body.length; i++) {
    h ^= body.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const want = parts.length.toString(36) + '.' + (h >>> 0).toString(36).slice(-4);
  ok(
    want === st[1],
    'the example checksum does not match: the text has ' + st[1] + ', but it should be ' + want
  );
  const byId = {};
  ALL.forEach((x) => {
    byId[x.id] = x;
  });
  parts.forEach((p) => ok(!!byId[p.split('*')[0]], 'the example has a nonexistent id: ' + p));

  /* The worked example promises the agent: "got something different - you
     made a mistake". The promise holds only while it really is assembled
     from the description. */
  const name = /\nname\s+(.+)/.exec(llms)[1].trim();
  /* Notes are taken only from the worked example block itself: note examples
     exist elsewhere in the file too, and they are unrelated to this one. */
  const block = /\nnotes\s+([\s\S]*?)\n\s*\npayload/.exec(llms);
  ok(!!block, 'no notes were found in the worked example block');
  const notes = ((block ? block[1] : '').match(/\\x1e\+?[~a-z0-9]*\\x1f[^\n]+/g) || [])
    .map((s) => s.replace(/\\x1e/g, '\x1e').replace(/\\x1f/g, '\x1f'))
    .join('');
  const raw = name + '\n' + want + '~' + body + '\n' + notes;
  const mine = Buffer.from(raw, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const shown = pay[1].replace(/\s+/g, '');
  ok(
    mine === shown,
    'the worked payload in llms.txt does not assemble from its own description'
  );
}

console.log('Dread GM Toolbox');
/* This section is built like Wondrous: its own list, its own roll, its own
   pictures. The book itself names the tiers for the seven equipment items -
   they must not be invented. */
const DR = L.items.dread;
ok(DR.length === 29, 'Dread does not have 29 entries, but ' + DR.length);
ok(
  DR.every((x, i) => x.roll === i + 1),
  "Dread's numbers do not run consecutively from one"
);
ok(
  DR.every((x) => x.src === 'dread' && x.img),
  'Dread is missing a source or a picture'
);
const dreadEq = DR.filter((x) => x.eq);
ok(dreadEq.length === 7, 'Dread does not have 7 equipment items, but ' + dreadEq.length);
ok(
  dreadEq.every((x) => x.eq.tier === 3 || x.eq.tier === 4),
  "Dread's equipment tier is not from the book"
);
ok(
  DR.filter((x) => x.kind === 'consumable').length === 7,
  'Dread does not have 7 consumables, but ' + DR.filter((x) => x.kind === 'consumable').length
);
/* The book's table row moved into eq and must not remain in the description */
ok(
  dreadEq.every((x) => !/^Tier \d|^Магическое Оружие/.test(x.ende + x.rud)),
  "Dread's equipment description still has the table row"
);

console.log('equipment as a whole');
/* The weapon and armour tables only drew from `LOOT.eq` - the two base
   books - and a quarter of all equipment never appeared there at all:
   findable by neither search nor filter. This checks the rule itself: as
   much equipment as exists in the data, that much must sort into the three
   tables. */
const EVERY_EQ = ALL.filter((x) => x.eq);
const BY_T = {};
EVERY_EQ.forEach((x) => {
  BY_T[x.eq.t] = (BY_T[x.eq.t] || 0) + 1;
});
ok(
  Object.keys(BY_T).sort().join() === 'armor,secondary,weapon',
  'equipment grew a new kind: ' + Object.keys(BY_T).join()
);
ok(
  EVERY_EQ.length === L.eq.length + 134,
  'equipment outside the two base books is not 134, but ' + (EVERY_EQ.length - L.eq.length)
);
/* Every piece of equipment must carry a tier. Wondrous's is derived from the
   book: the "Loot items by environment" table ties an item to a location,
   and the location carries a printed tier. As long as this rule holds, the
   equipment table sorts into four tiers with nothing left over, so there is
   no need to bring back a "no tier" section. */
const noTierEq = EVERY_EQ.filter((x) => !x.eq.tier);
ok(noTierEq.length === 0, 'equipment with no tier: ' + noTierEq.map((x) => x.id).join());
ok(
  EVERY_EQ.every((x) => [1, 2, 3, 4].indexOf(x.eq.tier) >= 0),
  'an equipment tier is outside the range one to four'
);
/* Wondrous tiers are derived by hand from the location table - if an entry
   moves, its tier silently drifts too, so they are pinned here by name. */
const WOND_TIER = {
  w7: 3,
  w22: 2,
  w25: 4,
  w31: 3,
  w51: 2,
  w54: 3,
  w57: 2,
  w79: 2,
  w82: 2,
  w85: 2,
  w88: 2
};
const wondEq = EVERY_EQ.filter((x) => x.src === 'wondrous');
ok(
  wondEq.length === Object.keys(WOND_TIER).length,
  'Wondrous equipment count became ' +
    wondEq.length +
    ', but tiers are pinned for ' +
    Object.keys(WOND_TIER).length
);
wondEq.forEach((x) =>
  ok(
    x.eq.tier === WOND_TIER[x.id],
    'tier ' + x.id + ' diverges from the book location: ' + x.eq.tier
  )
);

console.log('Vault of Ages');
/* The one set where tier is printed on the loot itself too: the book is laid
   out by tier throughout, and past the fourth come artifacts and cursed
   items. Tier is not derived from damage and not guessed - it is printed as
   the section heading in the book and duplicated in the id, so these two
   sources have to agree. */
const VOA = L.items.voa;
ok(VOA.length === 108, 'Vault of Ages does not have 108 entries, but ' + VOA.length);
ok(
  VOA.every((x) => x.src === 'voa' && x.img),
  'Vault of Ages is missing a source or a picture'
);
const VOA_SIZE = { 1: 24, 2: 24, 3: 24, 4: 25, A: 6, C: 5 };
Object.keys(VOA_SIZE).forEach(function (k) {
  const g = VOA.filter((x) => String(x.tier) === k);
  ok(
    g.length === VOA_SIZE[k],
    'section ' + k + ' does not have ' + VOA_SIZE[k] + ' entries, but ' + g.length
  );
  /* The roll runs within a section, not across the whole book: the numbers
     must be consecutive from one, or the die would point into nothing */
  ok(
    g.every((x, i) => x.roll === i + 1),
    'section ' + k + "'s numbers do not run consecutively from one"
  );
});
ok(
  VOA.every(function (x) {
    const mid = x.id.split('_')[1];
    const want = mid[0] === 'a' ? 'A' : mid[0] === 'c' ? 'C' : +mid[1];
    return String(x.tier) === String(want);
  }),
  'Vault of Ages tier diverges from what is encoded in the id'
);
/* The book labels equipment itself, and secondary weapons are a distinct
   kind - not a primary one with a tag */
const voaEq = VOA.filter((x) => x.eq);
ok(voaEq.length === 24, 'Vault of Ages does not have 24 equipment items, but ' + voaEq.length);
ok(
  voaEq.filter((x) => x.eq.t === 'secondary').length === 4,
  'secondary weapons are not 4: ' + voaEq.filter((x) => x.eq.t === 'secondary').length
);
ok(
  voaEq.every((x) => x.eq.tier === x.tier),
  "an equipment tier diverges from its record's tier"
);
ok(
  voaEq.every((x) => !x.eq.line),
  'Vault of Ages grew an upgrade ladder the book does not have'
);
/* The card's header moved into eq and into labels - it has no business in
   the description */
ok(
  VOA.every(
    (x) =>
      !/^(Loot|Consumable|Cursed Object|Primary Weapon|Secondary Weapon|Armor)\.|^(Предмет|Расходник|Проклятый Объект|Основное оружие|Вспомогательное оружие|Броня)\./.test(
        x.ende + '|' + x.rud
      )
  ),
  'Vault of Ages description still has the category line'
);
ok(
  VOA.every((x) => !/Tier \d\.|Ранг \d\./.test(x.ende + x.rud)),
  'Vault of Ages description still has a tier that already sits as a label'
);
/* Recall Cost ("Стоимость Призыва") is this book's own rule, and it stays in
   the text as a label */
const rc = VOA.filter((x) => x.recall != null);
ok(rc.length === 83, 'Recall Cost is not on 83 records, but on ' + rc.length);
ok(
  rc.every(
    (x) =>
      x.rud.indexOf('Стоимость Призыва: ' + x.recall + '\n') === 0 &&
      x.ende.indexOf('Recall Cost: ' + x.recall + '\n') === 0
  ),
  'Recall Cost does not open the description as its own line'
);

/* The book prints named properties as their own paragraph, and choice
   variants as a bulleted list. Read as one line they read as a solid wall,
   and «Кровавый Шип» mid-sentence stops being a property name. */
const voaLists = VOA.filter((x) => x.rud.indexOf('\n- ') > 0);
ok(voaLists.length === 5, 'Vault of Ages does not have 5 lists, but ' + voaLists.length);
/* «Узы Души» prints the stone's three properties as a list, and they used to
   run together into one paragraph */
ok(
  voaLists.some((x) => x.id === 'voa2_a1'),
  '«Узы Души» properties are not a list'
);
ok(
  voaLists.every((x) => x.ende.split('\n- ').length === x.rud.split('\n- ').length),
  'the list item count diverges between languages'
);
/* A list item follows an intro line, not the description's first line */
ok(
  VOA.every((x) => x.rud.indexOf('- ') !== 0 && x.ende.indexOf('- ') !== 0),
  'the description starts with a list item, with no intro line'
);
const named = VOA.filter(function (x) {
  return x.rud
    .replace(/^Стоимость Призыва: \d+\n/, '')
    .split('\n')
    .some(function (line) {
      const i = line.replace(/^- /, '').indexOf(': ');
      return i > 0 && i < 46;
    });
});
ok(named.length >= 29, 'named properties split across lines total only ' + named.length);
/* The line count is the same in both languages: a divergence means a
   paragraph was lost */
ok(
  VOA.every((x) => x.ende.split('\n').length === x.rud.split('\n').length),
  'the description line count diverges between languages'
);

/* Tier used to be filled in from source, then guessed from stats. Now it is
   taken from the book, and no app module should have either kind left -
   CLAUDE.md's "never infer equipment tier from stats". */
console.log('tier is not derived from stats');
const libDir = path.join(ROOT, 'app', 'src', 'lib');
fs.readdirSync(libDir)
  .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
  .forEach(function (f) {
    const text = fs.readFileSync(path.join(libDir, f), 'utf8');
    ok(
      text.indexOf('tierBand') < 0,
      'app/src/lib/' + f + ': the stat-based tier guess (tierBand) came back'
    );
  });
/* `srcWond`-style guessing (deriving a tier by source when one is not stated)
   has no matching grep here: it cannot recur by construction, not just by
   absence. `i18n.ts`'s `eqLine()` pushes `labels.tier`/`e.tier` unconditionally
   whenever `!opts.noTier` (no ternary, no source check), so there is no branch
   left where a rewrite author could slip a guess back in without touching this
   one line, which every other equipment-line test already pins byte for byte. */

/* "Универсальное" (Versatile) is a second set of stats hidden in a
   property's prose. It is parsed into `eq.alt` once and read as data from
   then on: on the printed card it sits as a second strip, not a line of
   text. If the property shows up on a new item and the parser is not
   updated, the count will diverge. */
const VERSATILE = ALL.filter((x) => x.eq && /Универсальное:/.test(x.rud || ''));
ok(VERSATILE.length === 18, 'versatile weapons became ' + VERSATILE.length + ', not 18');
ok(
  VERSATILE.every((x) => x.eq.alt),
  'versatile weapon is missing a parsed second stat set: ' +
    VERSATILE.filter((x) => !x.eq.alt)
      .map((x) => x.id)
      .join()
);
ok(
  ALL.filter((x) => x.eq && x.eq.alt).length === VERSATILE.length,
  'a second stat set showed up on more than just versatile weapons'
);
VERSATILE.forEach(function (x) {
  const a = x.eq.alt;
  ok(
    a.tr && a.rg && /^d\d+([+-]\d+)?$/.test(a.dmg || ''),
    'the second stat set on ' + x.id + ' parsed incomplete: ' + JSON.stringify(a)
  );
  /* It is specifically the second set: it has no reason to repeat the first */
  ok(
    a.tr !== x.eq.tr || a.rg !== x.eq.rg || a.dmg !== x.eq.dmg,
    'the second stat set on ' + x.id + ' matches the first'
  );
});

/* An item's shape from Vault of Ages - "dagger", "scythe", "light" - sits in
   the book for flavour, but in the app it was taking the place of weapon
   class: it could not be filtered by, and physical/magical did not work for
   these items. Class is now set on every weapon, and shape is set on
   nothing. */
ok(
  !ALL.some((x) => x.eq && x.eq.sub),
  "an item's shape came back into the data: " +
    ALL.filter((x) => x.eq && x.eq.sub)
      .map((x) => x.id)
      .join()
);
const NO_CLS = ALL.filter((x) => x.eq && x.eq.t !== 'armor' && !x.eq.cls);
ok(!NO_CLS.length, 'weapon with no class: ' + NO_CLS.map((x) => x.id).join());
/* Where class is set by damage type - Vault of Ages, Dread, frames - they
   agree. The core book and Hope & Fear split them on their own: Призрачный
   Клинок is magical, but its damage is physical, and that stays as is. */
ALL.filter(
  (x) => x.eq && x.eq.t !== 'armor' && ['voa', 'dread', 'frame'].indexOf(x.src) >= 0
).forEach(function (x) {
  ok(
    x.eq.cls === x.eq.dt,
    'class and damage type diverge on ' + x.id + ': ' + x.eq.cls + ' and ' + x.eq.dt
  );
});

console.log('frame equipment');
/* Campaign frames give their own equipment instead of the starting kit.
   Tiers here are not invented: the book calls Beast Feast a tier-one set
   outright, and the other sets spell out all four tiers. */
const FR = L.items.frames;
ok(FR.length === 94, 'frame equipment is not 94, but ' + FR.length);
ok(
  FR.every((x) => x.roll == null),
  'frame equipment grew a roll number'
);
ok(
  FR.every((x) => x.src === 'frame' && x.frame),
  'a frame record is missing a source or a campaign name'
);
const byFrame = {};
FR.forEach((x) => {
  byFrame[x.frame] = (byFrame[x.frame] || 0) + 1;
});
ok(
  byFrame.beast_feast === 36 &&
    byFrame.dark_heart === 36 &&
    byFrame.colossus === 21 &&
    byFrame.motherboard === 1,
  'the frame composition drifted: ' + JSON.stringify(byFrame)
);
/* Beast Feast replaces the starting kit entirely - tier one only */
ok(
  FR.filter((x) => x.frame === 'beast_feast').every((x) => x.eq && x.eq.tier === 1),
  'Beast Feast has a tier other than the first'
);
/* Upgrade lines: a multi-tier set has all four steps under one shared line */
const lines = {};
FR.forEach((x) => {
  if (x.eq && x.eq.line) (lines[x.eq.line] = lines[x.eq.line] || []).push(x.eq.tier);
});
ok(
  Object.keys(lines).length === 14,
  'upgrade lines are not 14, but ' + Object.keys(lines).length
);
Object.keys(lines).forEach((k) =>
  ok(
    lines[k].sort().join() === '1,2,3,4',
    'line ' + k + ' is missing a tier: ' + lines[k].join()
  )
);
/* The step words are the same ones the core book uses - otherwise the same
   item is named differently in two places on the site */
['Improved', 'Advanced', 'Legendary'].forEach((w) =>
  ok(
    FR.some((x) => x.en.indexOf(w + ' ') === 0),
    'missing the step word ' + w
  )
);
['Улучшенн', 'Продвинут', 'Легендарн'].forEach((w) =>
  ok(
    FR.some((x) => x.ru.indexOf(w) === 0),
    'missing the Russian step word ' + w
  )
);

console.log('counters in the text');
/* The record count is spelled out in words in the meta descriptions, in the
   README, and in the search hint. The data changes rarely, but every time it
   does these numbers have to be fixed by hand across seven files - and a
   miss is invisible: the page looks fine and lies. So every number of three
   or more digits next to its own word is checked against what data.js
   actually holds. Three digits was not enough: at 1061 records the check
   read "061" and complained about the correct number. */
const N = {
  loot: [].concat(...Object.values(L.items)).length,
  eq: L.eq.length,
  all: ALL.length,
  wondrous: L.items.wondrous.length,
  // the README describes the folder, and it also holds the _none.webp stub
  art: fs.readdirSync(path.join(ROOT, 'img')).filter((f) => f.endsWith('.webp')).length
};
/* The word "позиции" (entries) is honestly shared between two counters at
   once - the whole site and the Wondrous table - so it is checked for
   membership rather than equality. Every other word is unambiguous. */
const COUNTERS = [
  [/(\d{3,})\s+предмет/g, [N.loot], 'предметов и расходников'],
  [/(\d{3,})\s+единиц/g, [N.eq], 'единиц снаряжения'],
  [/(\d{3,})\s+запис/g, [N.all], 'записей'],
  [/(\d{3,})\s+страниц/g, [N.all], 'страниц-заглушек'],
  [/(\d{3,})\s+картин/g, [N.art], 'картинок'],
  [/(\d{3,})\s+records/g, [N.all], 'records'],
  [/(\d{3,})\s+позици/g, [N.all, N.wondrous], 'позиций'],
  [/(\d{3,})\s+entries/g, [N.all, N.wondrous], 'entries']
];
/* index.html and app.js were the live app's own copies of these numbers and
   left the list at R0c along with the files themselves. */
const COUNT_BEARING_FILES = [
  'app/index.html',
  'README.md',
  'README.ru.md',
  'llms.txt',
  'robots.txt',
  'app/src/lib/dict.ts',
  'app/src/lib/i18n.ts',
  'app/src/lib/search.ts',
  'tools/bundle-budget.mjs'
];
COUNT_BEARING_FILES.forEach(function (file) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  COUNTERS.forEach(function ([re, want, what]) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(text))) {
      ok(
        want.indexOf(+m[1]) >= 0,
        file + ': «' + m[1] + ' ' + what + '» — actually ' + want.join(' or ')
      );
    }
  });
  ok(text.indexOf(String(N.all)) >= 0, file + ': the overall record count went unmentioned');
});

/* Dice drawn on buttons use the same paths that print on the card. The file
   cannot be read on the fly - `fetch` from `file://` is forbidden - so the
   paths are written out in dice.ts, and this is where they are checked
   against the actual files. Otherwise an edit to a vector in `card/` would
   silently drift from the screen. */
console.log('dice on the buttons');
const diceTs = fs.readFileSync(path.join(ROOT, 'app', 'src', 'lib', 'dice.ts'), 'utf8');
[4, 6, 8, 10, 12, 20].forEach(function (d) {
  const svg = fs.readFileSync(path.join(ROOT, 'card', 'die-d' + d + '-bw.svg'), 'utf8');
  const want = (svg.match(/\sd="([^"]+)"/g) || []).map((x) => x.slice(4, -1));
  const box = /viewBox="([^"]+)"/.exec(svg)[1];
  const got = new RegExp(
    d +
      ":\\s*\\{\\s*viewBox:\\s*'([^']+)',\\s*body:\\s*'([^']+)',\\s*faces:\\s*\\n?\\s*'([^']+)'"
  ).exec(diceTs);
  ok(got, 'dice.ts has no silhouette for d' + d);
  if (!got) return;
  ok(
    got[1] === box,
    'd' + d + ': the viewBox diverges from the file: ' + got[1] + ' and ' + box
  );
  ok(got[2] === want[0] && got[3] === want[1], 'd' + d + ': the paths diverge from the file');
});

/* The source citation is not decoration, it is a licence condition (DPCGL
   2.0, clause 4.1): without it there is no right to use the text. The
   wording is fixed verbatim, and it has to stand everywhere the site
   "shares" material: in the footer in both languages, in the README, and in
   llms.txt. Since the SRD number is now part of the formula itself, the
   version is checked along with it - it was left at 1.0 in three places out
   of four, and there was nothing to notice it.

   This also checks that Hope & Fear is no longer listed as outside the
   licence: on 25 August 2026 DPCGL 2.0 added it to the list of covered
   games, and the old caveat became wrong. */
console.log('source citation');
const CITE =
  'Daggerheart System Reference Document 2.0, © Critical Role, LLC.' +
  ' under the terms of the Darrington Press Community Gaming (DPCGL)' +
  ' License.';
['README.md', 'README.ru.md', 'llms.txt'].forEach(function (file) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\s+/g, ' ');
  ok(text.indexOf(CITE) >= 0, file + ': missing the verbatim source citation');
  ok(
    text.indexOf('Reference Document 1.0') < 0,
    file + ': the citation still points at SRD 1.0'
  );
});
/* In the footer - in both languages: it is exactly what gets shared. The
   footer is now assembled from three dictionary parts (footBefore/footLink/
   footAfter) rather than one string with markup - the whole verbatim
   citation lives entirely in footBefore. */
const dictTs = fs.readFileSync(path.join(ROOT, 'app', 'src', 'lib', 'dict.ts'), 'utf8');
const feet = dictTs.match(/footBefore:\s*\n?\s*'([^']*)'/g) || [];
ok(feet.length === 2, 'footers are not two, but ' + feet.length);
feet.forEach(function (f, i) {
  ok(
    f.indexOf(CITE) >= 0,
    'the ' + (i ? 'English' : 'Russian') + ' footer has no source citation'
  );
});
/* The old caveat listed Hope & Fear among what the licence does not cover.
   The supplements that remain there are checked too: they must not be
   dropped from the list either. */
const OUTSIDE = [
  'Wondrous Environments',
  'Dread GM Toolbox',
  'Vault of Ages',
  'Community Magic Items',
  'Alternate Loot & Consumable Tables'
];
[
  ['README.md', /^.*fall\s+outside that licence[\s\S]*?\n\n/m],
  ['README.ru.md', /^.*под эту лицензию не подпадают[\s\S]*?\n\n/m]
].forEach(function (pair) {
  const file = pair[0];
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\n {2}/g, ' ');
  const clause = (pair[1].exec(text) || [''])[0];
  ok(clause, file + ': the caveat about what falls outside the licence went missing');
  ok(
    clause.indexOf('Hope & Fear') < 0,
    file +
      ': Hope & Fear is still listed as outside the licence, though DPCGL 2.0 now includes it'
  );
  OUTSIDE.forEach(function (name) {
    ok(clause.indexOf(name) >= 0, file + ': ' + name + ' fell out of the outside-licence list');
  });
});

/* Pages must wait for every quality matrix. Keep this dependency-free: the
   workflow is deliberately small here, and accepting a stray `browser`
   mention elsewhere would let deploy bypass a failing structural baseline -
   `browser` is the sharded matrix that runs tests/run-all.js, structural
   goldens included (issues/phase-8, B3; it replaced a separate `golden`
   job, which this assertion named until then). */
const workflow = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8');
const deploy =
  /^ {2}deploy:\s*\r?\n([\s\S]*?)(?=^ {2}[A-Za-z0-9_-]+:\s*(?:#.*)?$|(?![\s\S]))/m.exec(
    workflow
  );
ok(deploy, 'deploy.needs: deploy job is missing');
const deployNeeds = deploy && /^ {4}needs:\s*\[([^\]\r\n]*)\]\s*$/m.exec(deploy[1]);
ok(deployNeeds, 'deploy.needs: inline needs list is missing or unparseable');
if (deployNeeds) {
  const names = deployNeeds[1].split(',').map(function (name) {
    return name.trim();
  });
  ok(names.includes('browser'), 'deploy.needs: browser is missing');
}

/* R1 (issues/phase-8, B3 review -> routed into B4): the browser matrix and
   the divisor tests/run-all.js's own --shard flag divides by have to agree,
   and three ways of breaking that are loud - a divisor above the matrix
   throws inside run-all.js, a deleted browser: job fails the assertion
   above, a renamed job fails it too. One way is silent: shrinking
   `shard: [1, 2, 3]` while leaving `--shard=${{ matrix.shard }}/4` drops
   shard 4's suites (including sweep1180-ru and golden4) from the matrix
   entirely, and CI stays green - the three jobs that do run all pass. This
   is the assertion that catches that: the matrix list's length has to equal
   the divisor, and the list has to be exactly 1..m. */
const browserJob =
  /^ {2}browser:\s*\r?\n([\s\S]*?)(?=^ {2}[A-Za-z0-9_-]+:\s*(?:#.*)?$|(?![\s\S]))/m.exec(
    workflow
  );
ok(browserJob, 'browser job: missing from ci.yml');
const shardList = browserJob && /^\s*shard:\s*\[([^\]]*)\]\s*$/m.exec(browserJob[1]);
ok(shardList, 'browser.strategy.matrix.shard: missing or unparseable');
const shardRun =
  browserJob && /--shard=\$\{\{\s*matrix\.shard\s*\}\}\/(\d+)/.exec(browserJob[1]);
ok(shardRun, 'browser job: no "--shard=${{ matrix.shard }}/<m>" run line');
if (shardList && shardRun) {
  const list = shardList[1].split(',').map(function (s) {
    return Number(s.trim());
  });
  const divisor = Number(shardRun[1]);
  ok(
    list.length === divisor,
    'browser matrix/divisor mismatch: the shard list has ' +
      list.length +
      ' entries but the run line divides by ' +
      divisor +
      ' - shortening the matrix without the divisor silently drops coverage'
  );
  const want = [];
  for (let i = 1; i <= divisor; i++) want.push(i);
  ok(
    list.length === want.length &&
      list.every(function (n, i) {
        return n === want[i];
      }),
    'browser matrix: shard list is ' + JSON.stringify(list) + ', expected exactly 1..' + divisor
  );
}

console.log(failed() ? '\n' + failed() + ' FAILED' : '\nderived files: everything matches');
process.exit(failed() ? 1 : 0);
