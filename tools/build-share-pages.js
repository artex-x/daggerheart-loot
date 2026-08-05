/*
  Builds one tiny HTML stub per item into i/<id>.html.
  Each stub carries Open Graph tags, so pasting the link into Telegram,
  Discord, WhatsApp etc. unfurls the picture, the name and the description.
  A human opening the stub is redirected into the app.

  Run after editing data.js:   node tools/build-share-pages.js
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://artex-x.github.io/daggerheart-loot/';
const OUT = path.join(ROOT, 'i');

global.window = {};
require(path.join(ROOT, 'data.js'));
const DATA = global.window.LOOT.items;
const EQ = global.window.LOOT.eq || [];

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const COMMUNITY_RU = {
  Highborne: 'Великородное', Loreborne: 'Научное', Orderborne: 'Догматичное',
  Ridgeborne: 'Горное', Seaborne: 'Морское', Slyborne: 'Криминальное',
  Underborne: 'Подземное', Wanderborne: 'Кочевое', Wildborne: 'Лесное'
};
const SRC_LABEL = { core: 'Core', hnf: 'Hope & Fear', wondrous: 'Wondrous Loot' };

/* Kept in step with the app's own vocabulary (app.js, EQ_* tables) */
const EQ_TYPE   = { weapon:'Основное оружие', secondary:'Вторичное оружие', armor:'Броня' };
const EQ_TRAIT  = { agility:'Проворность', strength:'Сила', finesse:'Искусность',
                    instinct:'Инстинкт', presence:'Влияние', knowledge:'Знание' };
const EQ_RANGE  = { melee:'Вплотную', veryclose:'Близко', close:'Средне',
                    far:'Далеко', veryfar:'Очень далеко' };
const EQ_DT     = { phy:'физ', mag:'маг', any:'физ/маг' };
const EQ_BURDEN = { 1:'Одноручное', 2:'Двуручное' };

function eqLine(it){
  const e = it.eq, out = [EQ_TYPE[e.t], e.tier ? 'Ранг ' + e.tier : 'Wondrous'];
  if (e.t === 'armor') {
    if (e.th) out.push('Пороги ' + e.th[0] + '/' + e.th[1]);
    if (e.as != null) out.push('Броня ' + e.as);
  } else {
    out.push(EQ_TRAIT[e.tr], EQ_RANGE[e.rg],
             e.dmg + (e.dt ? ' ' + EQ_DT[e.dt] : ''), EQ_BURDEN[e.bu]);
  }
  return out.filter(Boolean).join(' · ');
}

function subtitle(it){
  if (it.eq) return eqLine(it);
  const kind = it.kind === 'consumable' ? 'Расходник' : 'Предмет';
  const src = it.src === 'community'
    ? (COMMUNITY_RU[it.community] || 'Сообщества')
    : SRC_LABEL[it.src];
  return kind + ' · ' + src + ' · №' + it.roll;
}

/* Crafting chains, resolved the same way the app does it: the target is stored
   forward, the "made from" direction is derived so the halves cannot drift. */
const ALL = [].concat(...Object.values(DATA));
const BY_ID = {};
ALL.forEach(it => { BY_ID[it.id] = it; });
const CRAFTED_FROM = {};
ALL.forEach(it => {
  if (it.craft && BY_ID[it.craft]) CRAFTED_FROM[it.craft] = it.id;
});

function craftLines(it){
  const out = [];
  const into = BY_ID[it.craft];
  if (into) out.push('Улучшается до: ' + (into.ru || into.en));
  const from = BY_ID[CRAFTED_FROM[it.id]];
  if (from) out.push('Получается из: ' + (from.ru || from.en));
  return out;
}

function page(it){
  const name = it.ru || it.en;
  const craft = craftLines(it);
  // the unfurl preview is one flat string, so the chain joins the description
  const desc = (it.eq ? eqLine(it) + '. ' : '') + (it.rud || it.ende) +
    (craft.length ? ' ' + craft.join(' ') + '.' : '');
  // JPEG copy: some Telegram clients will not render a WebP og:image.
  // An entry without art still needs one, or the unfurl comes out blank.
  const img = SITE + 'og/' + (it.img ? it.img.replace(/\.webp$/, '.jpg') : '_none.jpg');
  const url = SITE + 'i/' + it.id + '.html';
  const app = SITE + '#/i/' + it.id;
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(name)} — Генератор лута Daggerheart</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">

<meta property="og:type" content="article">
<meta property="og:site_name" content="Генератор лута Daggerheart">
<meta property="og:title" content="${esc(name)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="640">
<meta property="og:image:height" content="640">
<meta property="og:image:alt" content="${esc(name)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(name)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">

<meta http-equiv="refresh" content="0; url=${esc(app)}">
<style>
  body{background:#0e0c15;color:#ece8f6;font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
       margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .w{max-width:420px;text-align:center}
  img{width:100%;max-width:320px;border-radius:14px;display:block;margin:0 auto 18px}
  h1{font-size:22px;margin:0 0 6px}
  .s{color:#736b8c;font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 14px}
  p{color:#cfc8e0;margin:0 0 20px}
  p.c{color:#9b93b3;font-size:13px;margin:-12px 0 14px}
  a{color:#d8ab5e}
</style>
</head>
<body>
  <div class="w">
    <img src="../img/${esc(it.img || '_none.webp')}" alt="${esc(name)}">
    <h1>${esc(name)}</h1>
    <p class="s">${esc(subtitle(it))}</p>
    <p>${esc(it.rud || it.ende)}</p>
${craft.map(c => `    <p class="c">${esc(c)}</p>\n`).join('')}    <a href="${esc(app)}">Открыть в генераторе лута</a>
  </div>
  <script>location.replace(${JSON.stringify(app)});</script>
</body>
</html>
`;
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) {
  if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
}

let n = 0;
for (const arr of Object.values(DATA).concat([EQ])) {
  for (const it of arr) {
    fs.writeFileSync(path.join(OUT, it.id + '.html'), page(it), 'utf8');
    n++;
  }
}
console.log('wrote ' + n + ' share pages into i/');
