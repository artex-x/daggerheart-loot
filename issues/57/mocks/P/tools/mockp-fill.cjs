/* Fills the generated parts of mocks/P/index.html (FIT_ROWS, CROPS, SHEETS, ART_GONE) from
 * the fit JSONs and the rasters. node mockp-fill.cjs <evidence-dir> <mock-dir> */
const fs = require('fs');
const path = require('path');
const [EV, MOCK] = process.argv.slice(2);

function summary(file, std, compact) {
  const data = require(file).filter((r) => r.cards);
  const out = {};
  for (const r of data) {
    const key = `${r.lang} ${r.bw ? 'bw' : 'colour'} ${r.compact ? 'compact' : 'std'}`;
    (out[key] ??= { bw: r.bw, base: r.compact ? compact : std, cards: [] }).cards.push(
      ...r.cards.filter((x) => x.id && !x.id.startsWith('hb_'))
    );
  }
  const res = {};
  for (const [k, g] of Object.entries(out)) {
    const pts = g.cards.map((x) => x.textPx * 0.75).sort((a, b) => a - b);
    const art = g.cards
      .filter((x) => x.artShare > 0)
      .map((x) => x.artShare)
      .sort((a, b) => a - b);
    const smallest = g.cards.reduce((m, x) => (x.minPx < m.minPx ? x : m), g.cards[0]);
    res[k] = {
      below: g.cards.filter((x) => x.textCq < g.base - 0.05).length,
      minText: pts[0].toFixed(1),
      median: pts[Math.floor((pts.length - 1) / 2)].toFixed(1),
      art: g.bw ? null : art[Math.floor((art.length - 1) / 2)],
      gone: g.bw ? null : g.cards.filter((x) => x.artShare === 0).length,
      three: g.cards.filter((x) => x.nameLines >= 3).length,
      clipped: g.cards.filter((x) => x.clipped).length,
      smallest: (smallest.minPx * 0.75).toFixed(1) + ' pt'
    };
  }
  return res;
}
const today = summary(path.join(EV, 'fit-today.json'), 3.5, 3.5);
const propToday = summary(path.join(EV, 'mockp', 'fit-proposed-today.json'), 4.0, 4.6);
const propSs3 = summary(path.join(EV, 'mockp', 'fit-proposed-ss3.json'), 4.0, 4.6);
const cell = (s, base) =>
  `text ${s.median} pt (min ${s.minText}); below the base ${s.below}` +
  (s.art == null ? '' : `; art median ${s.art}%, art gone ${s.gone}`) +
  `; names on 3 lines ${s.three}; smallest ${s.smallest}` +
  (s.clipped ? `; clipped ${s.clipped}` : '') +
  (base ? '' : '');
const LABEL = {
  'ru colour std': 'RU, colour, 63 x 88 (proposed 63.5 x 88.9)',
  'en colour std': 'EN, colour, standard',
  'ru colour compact': 'RU, colour, 44 x 63',
  'en colour compact': 'EN, colour, compact',
  'ru bw std': 'RU, black and white, standard',
  'en bw std': 'EN, black and white, standard',
  'ru bw compact': 'RU, black and white, compact',
  'en bw compact': 'EN, black and white, compact'
};
const rows = Object.keys(LABEL)
  .map(
    (k) =>
      `<tr><td>${LABEL[k]}</td><td>${cell(today[k])}</td><td>${cell(propToday[k])}</td><td>${cell(propSs3[k])}</td></tr>`
  )
  .join('\n          ');

const fig = (src, cap, compact) =>
  `<figure class="real${compact ? ' compact' : ''}"><figcaption>${cap}</figcaption><a href="${src}"><img src="${src}" alt="${cap}" /></a></figure>`;
let crops = '';
for (const [sheet, compact, lang, layout] of [
  ['std9', false, 'ru', 'colour'],
  ['std9', false, 'en', 'colour'],
  ['compact16', true, 'ru', 'colour'],
  ['compact16', true, 'en', 'bw']
]) {
  for (const which of ['long', 'weapon']) {
    const f = (m, face) => `${m}-${face}-${sheet}-${layout}-${lang}__card-${which}__300dpi.jpg`;
    crops +=
      `<h4>${lang.toUpperCase()}, ${layout === 'bw' ? 'black and white' : 'colour'}, ${compact ? '44 x 63' : 'standard'}, ${which === 'long' ? 'the longest text' : 'a weapon'}</h4>\n<div class="trio">` +
      fig(f('current', 'today'), 'Today', compact) +
      fig(f('proposed', 'today'), "Proposed, today's stack", compact) +
      fig(f('proposed', 'ss3'), 'Proposed, Source Sans 3', compact) +
      '</div>\n';
  }
}
let sheets = '';
for (const sheet of ['std9', 'compact16'])
  for (const layout of ['colour', 'bw'])
    for (const lang of ['ru', 'en']) {
      const a = `current-today-${sheet}-${layout}-${lang}__300dpi.jpg`;
      const b = `proposed-ss3-${sheet}-${layout}-${lang}__300dpi.jpg`;
      const what = `${sheet === 'std9' ? 'Nine' : 'Sixteen'}, ${layout === 'bw' ? 'black and white' : 'colour'}, ${lang.toUpperCase()}`;
      sheets += `<h3>${what}</h3>\n<div class="pair"><figure><figcaption>Today</figcaption><a href="${a}"><img src="${a}" alt="${what}, today" loading="lazy" /></a></figure><figure><figcaption>Proposed (Source Sans 3)</figcaption><a href="${b}"><img src="${b}" alt="${what}, proposed" loading="lazy" /></a></figure></div>\n`;
    }
const gone = `${propSs3['ru colour std'].gone} RU and ${propSs3['en colour std'].gone} EN standard cards, ${propSs3['ru colour compact'].gone} RU and ${propSs3['en colour compact'].gone} EN compact cards in Source Sans 3`;
const idx = path.join(MOCK, 'index.html');
let html = fs.readFileSync(idx, 'utf8');
html = html
  .replace('FIT_ROWS', rows)
  .replace('CROPS', crops)
  .replace('SHEETS', sheets)
  .replace('ART_GONE', gone);
fs.writeFileSync(idx, html);
console.log(
  JSON.stringify({
    today: today['ru colour std'],
    propToday: propToday['ru colour std'],
    propSs3: propSs3['ru colour std'],
    gone
  })
);
