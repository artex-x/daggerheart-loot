/* Summarises a probe file (today.json or after.json) per state and block key:
 *   node issues/57/mocks/text/summarise.cjs today [csv]
 * Prints, per state and key, the longest text's characters, lines and characters per line at each width,
 * its cap, its free width and how many instances wrap earlier than their free width needs. */
const path = require('node:path');
const MODE = process.argv[2] || 'today';
const data = require(path.join(__dirname, MODE + '.json'));
const W = [360, 768, 1180, 1440, 1920];
const groups = new Map();
for (const r of data)
  for (const b of r.blocks) {
    const where = b.chain.split(' < ').slice(0, 2).join(' < ');
    const k = `${r.id} | ${where}`;
    if (!groups.has(k)) groups.set(k, {});
    const g = groups.get(k);
    const c = (g[r.lang + r.w] ||= { n: 0, early: 0, best: null });
    c.n++;
    if (b.early) c.early++;
    if (!c.best || b.chars > c.best.chars) c.best = b;
  }
const out = [];
for (const [k, g] of groups) {
  const line = [k];
  for (const lang of ['ru', 'en']) {
    const cells = W.map((w) => {
      const c = g[lang + w];
      if (!c) return '-';
      const b = c.best;
      return `${b.chars}c/${b.lines}L/${Math.round(b.cpl)}cpl${b.capCh ? '/cap' + Math.round(b.capCh) : ''}/free${Math.round(b.freeW)}/wid${Math.round(b.widest)}${c.early ? '/EARLY' + c.early + 'of' + c.n : c.n > 1 ? '/n' + c.n : ''}`;
    });
    line.push(lang + ': ' + cells.join('  '));
  }
  out.push(line.join('\n   '));
}
console.log(out.join('\n'));
