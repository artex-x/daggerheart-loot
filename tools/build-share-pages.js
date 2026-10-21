/*
  Builds two tiny HTML stubs per item: i/<id>.html in Russian and
  i/en/<id>.html in English, and the English entry document en/index.html.
  Each page carries Open Graph tags, so pasting the link into Telegram,
  Discord, WhatsApp etc. unfurls the picture, the name and the description
  in the language of the link. A human opening a page is redirected into the
  app; an English page first stores English as the language when no choice
  is stored yet (docs/specs/I18N.md).

  Run after editing data.js:   node tools/build-share-pages.js
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://artex-x.github.io/daggerheart-loot/';
const OUT = path.join(ROOT, 'i');
const OUT_EN = path.join(OUT, 'en');
const OUT_ROOT_EN = path.join(ROOT, 'en');

/* data.js is placed onto window exactly once: a repeat require returns the
   cache and runs nothing, so window must not be clobbered here - a test
   loads the data before this file does. */
if (!global.window) global.window = {};
if (!global.window.LOOT) require(path.join(ROOT, 'data.js'));
const DATA = global.window.LOOT.items;
const EQ = global.window.LOOT.eq || [];
const SETS = global.window.LOOT.sets || {};

/* The card template, its words and the record's path line live in
   tools/share-card.mjs, which the preview host draws its cards with too. */
const {
  esc,
  TEXT,
  FRAME_LABEL,
  EQ_TYPE,
  EQ_TRAIT,
  EQ_RANGE,
  EQ_DT,
  EQ_BURDEN,
  EQ_CLS,
  nameOf,
  eqLine,
  provenance,
  tableOf,
  subtitle,
  card,
  SEED_EN,
  STYLE
} = require('./share-card.mjs');
/* A stub carries record text as it reads: no markup (docs/specs/CONTRACTS.md section 4). */
const { markupText } = require('../app/src/lib/markup.ts');

/* The English entry document, en/index.html. The counts are computed from
   data.js, like tests/derived.js's "counters in the text". */
const ROOT_TEXT = {
  description: (n) =>
    'Daggerheart loot generator: ' +
    n.loot +
    ' items and consumables, ' +
    n.eq +
    " weapons and armour. Core, Hope & Fear, Wondrous Environments, Dread GM Toolbox, Vault of Ages, The Dragon's Vault, Arazo's Artifacts, Many Worlds Tavern, community items and alternative tables. Russian and English.",
  card: (n) =>
    n.all +
    ' entries with pictures: loot, consumables, weapons and armour from Core, Hope & Fear, Wondrous Environments and community items. Russian and English.',
  short: (n) =>
    n.all +
    ' entries with pictures: loot, consumables, weapons and armour. Russian and English.',
  data: 'The data is also readable without JavaScript:',
  csv: 'one row per entry',
  json: 'the same, whole',
  llms: 'what the site is, the address grammar, the list link format',
  open: 'Open the loot generator'
};

/* Crafting chains, resolved the same way the app does it: the target is stored
   forward, the "made from" direction is derived so the halves cannot drift. */
const ALL = [].concat(...Object.values(DATA));
const BY_ID = {};
EQ.concat(ALL).forEach((it) => {
  BY_ID[it.id] = it;
});
// A target id -> the records whose `craft` names it, in the app's order.
const CRAFTED_FROM = {};
EQ.concat(ALL).forEach((it) => {
  new Set(it.craft || []).forEach((id) => {
    if (BY_ID[id]) (CRAFTED_FROM[id] = CRAFTED_FROM[id] || []).push(it);
  });
});

const SET_MEMBERS = {};
EQ.concat(ALL).forEach((it) => {
  if (it.set) (SET_MEMBERS[it.set] = SET_MEMBERS[it.set] || []).push(it);
});

function setLines(it, lang) {
  const members = (it.set && SET_MEMBERS[it.set]) || [];
  if (members.length < 2) return [];
  const out = [TEXT[lang].set + members.map((m) => nameOf(m, lang)).join(', ')];
  const b = SETS[it.set];
  if (b)
    out.push(
      lang === 'ru' ? b.ru + ': ' + markupText(b.rud) : b.en + ': ' + markupText(b.ende)
    );
  return out;
}

// Chain order, as the app's record card draws it (FEATURES.md, "Records").
function craftLines(it, lang) {
  const t = TEXT[lang];
  const out = [];
  const names = (list) => list.map((r) => nameOf(r, lang)).join(', ');
  const from = CRAFTED_FROM[it.id] || [];
  if (from.length) out.push(t.craftFrom + names(from));
  const into = [...new Set(it.craft || [])].map((id) => BY_ID[id]).filter(Boolean);
  if (into.length) out.push(t.craftInto + names(into));
  return out;
}

function page(it, lang = 'ru') {
  if (!TEXT[lang])
    throw new Error('No share page text for language "' + lang + '". Use ru or en');
  const craft = craftLines(it, lang);
  const set = setLines(it, lang);
  const rawDesc = markupText((lang === 'ru' ? it.rud || it.ende : it.ende) || '');
  const from = provenance(it, lang);
  const up = lang === 'ru' ? '../' : '../../';
  return card(lang, {
    title: nameOf(it, lang),
    desc:
      (from ? from + '. ' : '') +
      (it.eq ? eqLine(it, lang) + '. ' : '') +
      rawDesc.replace(/\s*\n\s*/g, ' '),
    body: rawDesc,
    craft,
    set,
    // JPEG copy: some Telegram clients will not render a WebP og:image.
    // An entry without art still needs one, or the unfurl comes out blank.
    img: SITE + 'og/' + (it.img ? it.img.replace(/\.webp$/, '.jpg') : '_none.jpg'),
    imgSrc: up + 'img/' + (it.img || '_none.webp'),
    url: SITE + (lang === 'ru' ? 'i/' : 'i/en/') + it.id + '.html',
    app: SITE + '#/i/' + it.id,
    subtitle: subtitle(it, lang),
    seed: lang !== 'ru'
  });
}

/* The English entry document, published at <site>en/: the English card of
   every link the app hands out in English (docs/specs/META.md section 2). It
   redirects to the app at the root and keeps the fragment, which is why it
   has no meta refresh: that would drop a list link's payload. */
function rootPage() {
  const n = { loot: ALL.length, eq: EQ.length, all: ALL.length + EQ.length };
  const title = TEXT.en.site;
  const url = SITE + 'en/';
  const img = SITE + 'og/_share_en.jpg';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- kept out of search results; see robots.txt for why crawling is allowed -->
<meta name="robots" content="noindex, nofollow">
<title>${title}</title>
<meta name="description" content="${esc(ROOT_TEXT.description(n))}">
<meta name="color-scheme" content="dark">
<link rel="canonical" href="${url}">

<meta property="og:type" content="website">
<meta property="og:site_name" content="${title}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${esc(ROOT_TEXT.card(n))}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${title}">
<meta property="og:locale" content="en_US">
<meta property="og:locale:alternate" content="ru_RU">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${esc(ROOT_TEXT.short(n))}">
<meta name="twitter:image" content="${img}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ctext y='26' font-size='26'%3E%F0%9F%97%9D%3C/text%3E%3C/svg%3E">
${STYLE}
</head>
<body>
  <div class="w">
    <h1>${title}</h1>
    <p>${esc(ROOT_TEXT.card(n))}</p>
    <p class="c">${ROOT_TEXT.data}
      <a href="../catalog.csv">catalog.csv</a> (${ROOT_TEXT.csv}),
      <a href="../data.json">data.json</a> (${ROOT_TEXT.json}),
      <a href="../llms.txt">llms.txt</a> (${ROOT_TEXT.llms}).</p>
    <a href="../">${ROOT_TEXT.open}</a>
  </div>
  <script>${SEED_EN}location.replace('../' + location.hash);</script>
</body>
</html>
`;
}

/* Exported so the test can render every page into memory and compare with
   what is on disk: that catches a change to this generator that was never
   rebuilt, not just data that moved on. */
module.exports = {
  page,
  rootPage,
  tableOf,
  SITE,
  FRAME_LABEL,
  EQ_TYPE,
  EQ_TRAIT,
  EQ_RANGE,
  EQ_DT,
  EQ_CLS,
  EQ_BURDEN
};

if (require.main === module) {
  for (const dir of [OUT, OUT_EN, OUT_ROOT_EN]) fs.mkdirSync(dir, { recursive: true });
  for (const dir of [OUT, OUT_EN]) {
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.html')) fs.unlinkSync(path.join(dir, f));
    }
  }

  let n = 0;
  for (const arr of Object.values(DATA).concat([EQ])) {
    for (const it of arr) {
      fs.writeFileSync(path.join(OUT, it.id + '.html'), page(it, 'ru'), 'utf8');
      fs.writeFileSync(path.join(OUT_EN, it.id + '.html'), page(it, 'en'), 'utf8');
      n++;
    }
  }
  fs.writeFileSync(path.join(OUT_ROOT_EN, 'index.html'), rootPage(), 'utf8');
  console.log('wrote ' + n + ' share pages into i/, ' + n + ' into i/en/, and en/index.html');
}
