/* Summarises a fit JSON of mockp.cjs or print-measure.cjs over the catalog (homebrew left
 * out). node mockp-analyse.cjs <fit.json> <std base cqw> <compact base cqw>; prints JSON rows. */
const [file, s, c] = process.argv.slice(2);
const BASE = { std: Number(s || 3.5), compact: Number(c || 3.5) };
const data = require(file).filter((r) => r.cards);
const groups = new Map();
for (const r of data) {
  const key = `${r.lang} ${r.bw ? 'bw' : 'colour'} ${r.compact ? 'compact' : 'std'}`;
  if (!groups.has(key)) groups.set(key, { compact: r.compact, bw: r.bw, cards: [] });
  for (const card of r.cards)
    if (card.id && !card.id.startsWith('hb_')) groups.get(key).cards.push(card);
}
const pct = (a, p) => a[Math.min(a.length - 1, Math.floor((a.length - 1) * p))];
for (const [key, g] of groups) {
  const base = g.compact ? BASE.compact : BASE.std;
  const cards = g.cards;
  const pts = cards.map((x) => x.textPx * 0.75).sort((a, b) => a - b);
  const art = cards
    .filter((x) => x.artShare > 0)
    .map((x) => x.artShare)
    .sort((a, b) => a - b);
  const min = cards.reduce((m, x) => (x.minPx < m.minPx ? x : m), cards[0]);
  console.log(
    JSON.stringify({
      key,
      n: cards.length,
      belowBase: cards.filter((x) => x.textCq < base - 0.05).length,
      grew: g.bw ? cards.filter((x) => x.textCq > base + 0.05).length : 0,
      padRung: cards.filter((x) => x.pad !== 'default').length,
      atFloor: cards.filter((x) => x.textCq <= 2.65).length,
      clipped: cards.filter((x) => x.clipped).length,
      textPt: `min ${pts[0].toFixed(1)} / p10 ${pct(pts, 0.1).toFixed(1)} / median ${pct(pts, 0.5).toFixed(1)}`,
      artMedian: g.bw ? '-' : `${pct(art, 0.5)}% (p10 ${pct(art, 0.1)}%)`,
      artHidden: g.bw ? '-' : cards.filter((x) => x.artShare === 0).length,
      nameThreeLines: cards.filter((x) => x.nameLines >= 3).length,
      smallest: `${(min.minPx * 0.75).toFixed(2)} pt ${min.minWhat} @${min.id}`
    })
  );
}
