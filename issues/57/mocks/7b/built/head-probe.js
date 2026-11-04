/* Evidence, not a gate: measures the head of every `/tables/*` table as gm3, moving from table
   to table in one window (batch 7b, T9.1). Read-only. Usage, one run per call, after
   `npm run build:test` in the tree named by `--root` (default: this checkout):
     node issues/57/mocks/7b/built/head-probe.js [--root=E:/dev/dhl-7b-base] [--sizes=1180x720,390x844]
   Prints, per size and language, the least and the greatest top (Y) of each block across the
   tables, the tables at either end, and the X of each toolbar item that moves. */
const path = require('path');

const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith('--' + k + '='));
  return hit ? hit.slice(k.length + 3) : d;
};
const ROOT = path.resolve(arg('root', path.join(__dirname, '../../../../..')));
const { fresh, closeBrowser } = require(path.join(ROOT, 'tests/app/lib.js'));

const TABLES = [
  'core_item',
  'core_consumable',
  'hnf_item',
  'hnf_consumable',
  'alt_item',
  'alt_consumable',
  'wondrous',
  'dread',
  'voa',
  'dv',
  'arazo',
  'community',
  'mwt',
  'eq_weapon',
  'eq_secondary',
  'eq_armor',
  'other_starting',
  'other_frames',
  'homebrew'
];
const SIZES = arg('sizes', '1180x720,1050x720,900x720,760x720,390x844,360x640')
  .split(',')
  .map((s) => s.split('x').map(Number));

function read() {
  const top = (el) => (el ? Math.round(el.getBoundingClientRect().top * 2) / 2 : null);
  const q = (s) => document.querySelector('main ' + s);
  const bar = q('.searchrow');
  return {
    title: top(q('.page-head') ?? q('.pickrow')),
    h1: top(q('.page-head h1')),
    groups: top(q('.page-head .groups')),
    tabs: top(q('.page-head .tabs')),
    tabsH: q('.page-head .tabs')
      ? Math.round(q('.page-head .tabs').getBoundingClientRect().height)
      : 0,
    groupsX: q('.page-head .groups')
      ? Math.round(q('.page-head .groups').getBoundingClientRect().left)
      : null,
    searchrow: top(bar),
    items: bar
      ? [...bar.children].map(
          (c) =>
            (c.className.split(' ')[0] || c.tagName) +
            '@' +
            Math.round(c.getBoundingClientRect().left)
        )
      : [],
    count: top(q('.count')),
    body: top(q('.body')),
    col: q('.body.withcol') ? 'col' : '-',
    rowscol: top(q('.rowscol')),
    first: top(q('[data-row]')),
    gutter: innerWidth - document.documentElement.clientWidth,
    y: scrollY
  };
}

(async () => {
  for (const [width, height] of SIZES) {
    for (const lang of ['ru', 'en']) {
      const { ctx, page, d } = await fresh({ width, height, lang });
      await d.open('#/tables/' + TABLES[0], { as: 'gm3' });
      const got = [];
      for (const table of TABLES) {
        await d.go('#/tables/' + table);
        await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        });
        got.push({ table, ...(await page.evaluate(read)) });
      }
      console.log(`\n== ${width}x${height} ${lang}`);
      for (const key of [
        'title',
        'h1',
        'groups',
        'tabs',
        'tabsH',
        'groupsX',
        'searchrow',
        'count',
        'body',
        'rowscol',
        'first',
        'gutter',
        'y'
      ]) {
        const vals = got.filter((g) => g[key] !== null && g[key] !== undefined);
        if (!vals.length) {
          console.log(`  ${key}: none`);
          continue;
        }
        const lo = vals.reduce((a, b) => (b[key] < a[key] ? b : a));
        const hi = vals.reduce((a, b) => (b[key] > a[key] ? b : a));
        const missing = got.filter((g) => g[key] === null).map((g) => g.table);
        console.log(
          `  ${key}: ${lo[key]} (${lo.table}) .. ${hi[key]} (${hi.table})` +
            (missing.length ? `; absent on ${missing.join(' ')}` : '')
        );
      }
      const items = new Map();
      for (const g of got)
        items.set(g.items.join(' '), [...(items.get(g.items.join(' ')) ?? []), g.table]);
      console.log('  toolbar:');
      for (const [k, v] of items) console.log(`    ${k} <- ${v.join(' ')}`);
      console.log('  column: ' + got.map((g) => g.table + ':' + g.col).join(' '));
      await ctx.close();
    }
  }
  await closeBrowser();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
