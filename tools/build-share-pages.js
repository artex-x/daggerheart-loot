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

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const COMMUNITY_RU = {
  Highborne: 'Великородное',
  Loreborne: 'Научное',
  Orderborne: 'Догматичное',
  Ridgeborne: 'Горное',
  Seaborne: 'Морское',
  Slyborne: 'Криминальное',
  Underborne: 'Подземное',
  Wanderborne: 'Кочевое',
  Wildborne: 'Лесное'
};
const SRC_LABEL = {
  core: 'Core',
  hnf: 'Hope & Fear',
  wondrous: 'Wondrous Loot',
  dread: 'Dread GM Toolbox',
  voa: 'Vault of Ages',
  dv: "Dragon's Vault"
};
/* The words of a page in each language. The English ones are the app's own
   (app/src/lib/dict.ts); the maps below are copies of app/src/lib/i18n.ts
   and frames.ts, pinned equal by app/src/lib/i18n.test.ts. */
const TEXT = {
  ru: {
    site: 'Генератор лута Daggerheart',
    open: 'Открыть в генераторе лута',
    item: 'Предмет',
    cons: 'Расходник',
    ordinal: '№',
    other: 'Прочее',
    frames: 'Сеттинги',
    starting: 'Стартовые',
    communities: 'Сообщества',
    craftFrom: 'Получается из: ',
    craftInto: 'Улучшается до: ',
    set: 'Комплект: ',
    tier: 'Ранг',
    thresholds: 'Пороги',
    armor: 'Броня',
    artifact: 'Артефакт'
  },
  en: {
    site: 'Daggerheart Loot Generator',
    open: 'Open in the loot generator',
    item: 'Item',
    cons: 'Consumable',
    ordinal: '#',
    other: 'Other',
    frames: 'Frames',
    starting: 'Starting',
    communities: 'Communities',
    craftFrom: 'Made from: ',
    craftInto: 'Upgrades to: ',
    set: 'Set: ',
    tier: 'Tier',
    thresholds: 'Thresholds',
    armor: 'Armor',
    artifact: 'Artifact'
  }
};

/* The English entry document, en/index.html. The counts are computed from
   data.js, like tests/derived.js's "counters in the text". */
const ROOT_TEXT = {
  description: (n) =>
    'Daggerheart loot generator: ' +
    n.loot +
    ' items and consumables, ' +
    n.eq +
    " weapons and armour. Core, Hope & Fear, Wondrous Loot, Dread GM Toolbox, Vault of Ages, The Dragon's Vault, community items and alternative tables. Russian and English.",
  card: (n) =>
    n.all +
    ' entries with pictures: loot, consumables, weapons and armour from Core, Hope & Fear, Wondrous Loot and community items. Russian and English.',
  short: (n) =>
    n.all +
    ' entries with pictures: loot, consumables, weapons and armour. Russian and English.',
  data: 'The data is also readable without JavaScript:',
  csv: 'one row per entry',
  json: 'the same, whole',
  llms: 'what the site is, the address grammar, the list link format',
  open: 'Open the loot generator'
};

const FRAME_LABEL = {
  beast_feast: ['Пир зверей', 'Beast Feast'],
  colossus: ['Колоссы Сухоземья', 'Colossus of the Drylands'],
  dark_heart: ['Тёмное сердце Андалурии', 'Dark Heart of Andaluria'],
  motherboard: ['Материнская Плата', 'Motherboard']
};

const EQ_TYPE = {
  weapon: ['Основное оружие', 'Primary weapon'],
  secondary: ['Вторичное оружие', 'Secondary weapon'],
  armor: ['Броня', 'Armor']
};
const EQ_TRAIT = {
  agility: ['Проворность', 'Agility'],
  strength: ['Сила', 'Strength'],
  finesse: ['Искусность', 'Finesse'],
  instinct: ['Инстинкт', 'Instinct'],
  presence: ['Влияние', 'Presence'],
  knowledge: ['Знание', 'Knowledge'],
  spellcast: ['Характеристика Заклинателя', 'Spellcast']
};
const EQ_RANGE = {
  melee: ['Вплотную', 'Melee'],
  veryclose: ['Близко', 'Very Close'],
  close: ['Средне', 'Close'],
  far: ['Далеко', 'Far'],
  veryfar: ['Очень далеко', 'Very Far']
};
const EQ_DT = { phy: ['физ', 'phy'], mag: ['маг', 'mag'], any: ['физ/маг', 'phy/mag'] };
const EQ_BURDEN = {
  1: ['Одноручное', 'One-Handed'],
  2: ['Двуручное', 'Two-Handed'],
  any: ['Одноручное/двуручное', 'One/Two-Handed']
};
const EQ_CLS = { phy: ['Физическое', 'Physical'], mag: ['Магическое', 'Magic'] };

const pick = (pair, lang) => (pair ? pair[lang === 'ru' ? 0 : 1] : '');
// Russian falls back to English per field; English never falls back (I18N.md).
const nameOf = (x, lang) => (lang === 'ru' ? x.ru || x.en : x.en);

function eqLine(it, lang) {
  const t = TEXT[lang];
  const e = it.eq,
    out = [pick(EQ_TYPE[e.t], lang)];
  if (!isFrame(it))
    out.push(e.tier === 'A' ? t.artifact : e.tier ? t.tier + ' ' + e.tier : 'Wondrous');
  if (e.t === 'armor') {
    if (e.th) out.push(t.thresholds + ' ' + e.th[0] + '/' + e.th[1]);
    if (e.as != null) out.push(t.armor + ' ' + e.as);
  } else {
    if (e.t === 'weapon' && e.cls) out.push(pick(EQ_CLS[e.cls], lang));
    out.push(
      pick(EQ_TRAIT[e.tr], lang),
      pick(EQ_RANGE[e.rg], lang),
      e.dmg + (e.dt ? ' ' + pick(EQ_DT[e.dt], lang) : ''),
      pick(EQ_BURDEN[e.bu], lang)
    );
  }
  return out.filter(Boolean).join(' · ');
}

function isFrame(it) {
  return !!it.frame || it.src === 'frame';
}
function provenance(it, lang) {
  const t = TEXT[lang];
  if (isFrame(it))
    return t.other + ' · ' + t.frames + ' · ' + (pick(FRAME_LABEL[it.frame], lang) || it.frame);
  if (it.starting) return t.other + ' · ' + t.starting;
  return '';
}

function subtitle(it, lang) {
  const t = TEXT[lang];
  const from = provenance(it, lang);
  if (from) return from + (it.eq ? ' · ' + eqLine(it, lang) : '');
  if (it.eq) return eqLine(it, lang);
  const kind = it.kind === 'consumable' ? t.cons : t.item;
  const community =
    lang === 'ru' ? COMMUNITY_RU[it.community] || t.communities : it.community || t.communities;
  const src = it.src === 'community' ? community : SRC_LABEL[it.src];
  /* Frames are browsable source records rather than a roll pool. The two
     consumables without stat blocks retain the historical preview ordinal. */
  const number = it.roll ?? (it.src === 'frame' ? DATA.frames.indexOf(it) + 1 : '');
  return kind + ' · ' + src + ' · ' + t.ordinal + number;
}

/* Crafting chains, resolved the same way the app does it: the target is stored
   forward, the "made from" direction is derived so the halves cannot drift. */
const ALL = [].concat(...Object.values(DATA));
const BY_ID = {};
ALL.forEach((it) => {
  BY_ID[it.id] = it;
});
const CRAFTED_FROM = {};
ALL.forEach((it) => {
  if (it.craft && BY_ID[it.craft]) CRAFTED_FROM[it.craft] = it.id;
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
  if (b) out.push(lang === 'ru' ? b.ru + ': ' + b.rud : b.en + ': ' + b.ende);
  return out;
}

// Chain order, as the app's record card draws it (FEATURES.md, "Records").
function craftLines(it, lang) {
  const t = TEXT[lang];
  const out = [];
  const from = BY_ID[CRAFTED_FROM[it.id]];
  if (from) out.push(t.craftFrom + nameOf(from, lang));
  const into = BY_ID[it.craft];
  if (into) out.push(t.craftInto + nameOf(into, lang));
  return out;
}

// The visible paragraph keeps the line breaks the meta description above
// flattens: a multi-line body (98 records use "- " list lines) renders as one
// <p> per source line instead of a run-on paragraph once the newlines are gone.
function descHtml(raw) {
  return raw
    .split('\n')
    .map((line) => `<p>${esc(line)}</p>`)
    .join('\n');
}

const LOCALE = { ru: 'ru_RU', en: 'en_US' };

/* An English page stores English as the language only when nothing is stored:
   a reader's own choice always wins (docs/specs/I18N.md). Storage that throws
   is ignored, and the redirect still runs. */
const SEED_EN =
  "try{if(!localStorage.getItem('dhloot.lang.v1'))localStorage.setItem('dhloot.lang.v1','en')}catch(e){}";

// The stylesheet of every page this file writes.
const STYLE = `<style>
  body{background:#0e0c15;color:#ece8f6;font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
       margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .w{max-width:420px;text-align:center}
  img{width:100%;max-width:320px;border-radius:14px;display:block;margin:0 auto 18px}
  h1{font-size:22px;margin:0 0 6px}
  .s{color:#736b8c;font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 14px}
  p{color:#cfc8e0;margin:0 0 20px}
  p.c{color:#9b93b3;font-size:13px;margin:-12px 0 14px}
  a{color:#d8ab5e}
</style>`;

function page(it, lang = 'ru') {
  const t = TEXT[lang];
  if (!t) throw new Error('No share page text for language "' + lang + '". Use ru or en');
  const name = nameOf(it, lang);
  const craft = craftLines(it, lang);
  const set = setLines(it, lang);
  const rawDesc = (lang === 'ru' ? it.rud || it.ende : it.ende) || '';
  // the unfurl preview is one flat string, so the chain joins the description
  const from = provenance(it, lang);
  const desc =
    (from ? from + '. ' : '') +
    (it.eq ? eqLine(it, lang) + '. ' : '') +
    rawDesc.replace(/\s*\n\s*/g, ' ') +
    (craft.length ? ' ' + craft.join('. ') + '.' : '') +
    (set.length ? ' ' + set.join('. ') : '');
  // JPEG copy: some Telegram clients will not render a WebP og:image.
  // An entry without art still needs one, or the unfurl comes out blank.
  const img = SITE + 'og/' + (it.img ? it.img.replace(/\.webp$/, '.jpg') : '_none.jpg');
  const url = SITE + (lang === 'ru' ? 'i/' : 'i/en/') + it.id + '.html';
  const app = SITE + '#/i/' + it.id;
  const up = lang === 'ru' ? '../' : '../../';
  const script =
    (lang === 'ru' ? '' : SEED_EN) + 'location.replace(' + JSON.stringify(app) + ');';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- kept out of search results; see robots.txt for why crawling is allowed -->
<meta name="robots" content="noindex, nofollow">
<title>${esc(name)} — ${t.site}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">

<meta property="og:type" content="article">
<meta property="og:site_name" content="${t.site}">
<meta property="og:locale" content="${LOCALE[lang]}">
<meta property="og:title" content="${esc(name)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="640">
<meta property="og:image:height" content="640">
<meta property="og:image:alt" content="${esc(name)}">
<!-- the artwork is square, and a large-summary card would letterbox it -->
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(name)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">

<meta http-equiv="refresh" content="0; url=${esc(app)}">
${STYLE}
</head>
<body>
  <div class="w">
    <img src="${up}img/${esc(it.img || '_none.webp')}" alt="${esc(name)}">
    <h1>${esc(name)}</h1>
    <p class="s">${esc(subtitle(it, lang))}</p>
    ${descHtml(rawDesc)}
${craft
  .concat(set)
  .map((c) => `    <p class="c">${esc(c)}</p>\n`)
  .join('')}    <a href="${esc(app)}">${t.open}</a>
  </div>
  <script>${script}</script>
</body>
</html>
`;
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
