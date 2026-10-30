/* Summarises print-measure.cjs output: argv[2] the JSON, argv[3] an optional label. */
const data = require(process.argv[2]).filter((r) => r.cards);
const groups = new Map();
for (const r of data) {
  const key = `${r.lang} ${r.bw ? 'bw' : 'colour'} ${r.compact ? 'compact' : 'std'}`;
  if (!groups.has(key)) groups.set(key, []);
  for (const c of r.cards) if (c.id) groups.get(key).push(c);
}
const pct = (a, p) => a[Math.min(a.length - 1, Math.floor((a.length - 1) * p))];
const rows = [];
for (const [key, cards] of groups) {
  const bw = key.includes(' bw');
  const pts = cards.map((c) => c.textPx * 0.75).sort((a, b) => a - b);
  const cqs = cards.map((c) => c.textCq);
  const n = cards.length;
  const atDefault = cqs.filter((v) => Math.abs(v - 3.5) < 0.05).length;
  const grew = cqs.filter((v) => v > 3.55).length;
  const shrunk = cqs.filter((v) => v < 3.45).length;
  const padStep = cards.filter((c) => c.pad !== 'default').length;
  const floor = cqs.filter((v) => v <= 2.65).length;
  const clipped = cards.filter((c) => c.clipped);
  const minPt = Math.min(...cards.map((c) => c.minPx * 0.75));
  const minCard = cards.find((c) => c.minPx * 0.75 === minPt);
  const under5 = cards.filter((c) => c.textPx * 0.75 < 5).length;
  const art = cards
    .filter((c) => c.artShare > 0)
    .map((c) => c.artShare)
    .sort((a, b) => a - b);
  const artHidden = bw ? '-' : cards.filter((c) => c.artShare === 0).length;
  const nameLines = cards.map((c) => c.nameLines);
  rows.push({
    key,
    n,
    default: atDefault,
    grew,
    shrunk,
    padStep,
    floor,
    clipped: clipped.length,
    clippedIds: clipped
      .map((c) => c.id)
      .slice(0, 12)
      .join(' '),
    textPt: `p10 ${pct(pts, 0.1).toFixed(1)} / median ${pct(pts, 0.5).toFixed(1)} / p90 ${pct(pts, 0.9).toFixed(1)} / min ${pts[0].toFixed(1)}`,
    under5,
    minPt: minPt.toFixed(2) + ' ' + (minCard ? minCard.minWhat : ''),
    art: art.length
      ? `p10 ${pct(art, 0.1)} / median ${pct(art, 0.5)} / p90 ${pct(art, 0.9)} %`
      : '-',
    artHidden,
    name3: nameLines.filter((v) => v >= 3).length
  });
}
for (const r of rows) console.log(JSON.stringify(r));
