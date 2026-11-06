/* Batch T probe analysis: groups the controls under 40 px (44 px for menu items) by selector and states, and lists
 * the first-screen tops before and after.  node issues/57/mocks/T/analyse.cjs measure-before.json [measure-after.json] */
const fs = require('node:fs');
const path = require('node:path');

const [a, b] = process.argv
  .slice(2)
  .map((f) => JSON.parse(fs.readFileSync(path.resolve(__dirname, f), 'utf8')));
const under = (c) => !c.inline && (c.h < (c.menu ? 44 : 40) - 0.5 || c.w < 40 - 0.5);

function groups(m) {
  const g = new Map();
  for (const s of m.states) {
    if (s.width > 600) continue;
    for (const c of s.under || s.controls || []) {
      if (!under(c)) continue;
      const key = c.sel + ' < ' + c.parent;
      const e = g.get(key) || {
        key,
        names: new Set(),
        states: new Set(),
        minH: 99,
        maxH: 0,
        minW: 999,
        n: 0
      };
      e.names.add(c.name);
      e.states.add(s.id);
      e.minH = Math.min(e.minH, c.h);
      e.maxH = Math.max(e.maxH, c.h);
      e.minW = Math.min(e.minW, c.w);
      e.n++;
      g.set(key, e);
    }
  }
  return [...g.values()].sort((x, y) => x.minH - y.minH);
}

function print(m, label) {
  const gs = groups(m);
  let total = 0;
  for (const s of m.states)
    if (s.width <= 600) total += (s.under || s.controls || []).filter(under).length;
  const inline = m.states.reduce(
    (n, s) => n + (s.under || s.controls || []).filter((c) => c.inline && c.h < 40).length,
    0
  );
  console.log(
    '\n## ' +
      label +
      ': ' +
      gs.length +
      ' selectors, ' +
      total +
      ' control readings under the floor; inline links under 40: ' +
      inline
  );
  for (const e of gs)
    console.log(
      [
        e.key,
        'h ' + e.minH + '-' + e.maxH,
        'w>=' + e.minW,
        'x' + e.n,
        [...e.states].join(','),
        [...e.names].slice(0, 4).join(' / ')
      ].join(' | ')
    );
  const errs = m.states.filter((s) => s.error || s.missed);
  for (const s of errs)
    console.log(
      '  !',
      s.id,
      s.width,
      s.lang,
      s.error || '',
      s.missed ? 'missed ' + s.missed.join(';') : ''
    );
}

print(a, 'before');
if (b) print(b, 'after');

console.log('\n## first screen (top / limit 256 at 640)');
const key = (s) => s.id + ' ' + s.width + ' ' + s.lang;
const after = new Map((b?.states || []).map((s) => [key(s), s]));
for (const s of a.states)
  if (s.primaryTop !== undefined)
    console.log(
      key(s),
      'before',
      s.primaryTop,
      b ? 'after ' + (after.get(key(s))?.primaryTop ?? '-') : ''
    );
