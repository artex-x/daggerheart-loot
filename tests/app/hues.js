/* Badges that can share a screen have to be told apart by colour, not by
 * reading them - the same rule the live app's own suite (deleted at R0c,
 * issue 47) enforced there. Distance in Lab was the wrong measure there; hue
 * is what the eye sorts by, so hue is what is checked.
 *
 * Rewritten, not ported: the original injected a bare `<span class="badge
 * item">` into the document and read its colour, which gave Svelte's
 * scoped `.badge` rules nothing to match, and grepped `[data-act="roll"]`,
 * which does not exist here. This reads the computed colour off *rendered*
 * badges instead - one table route per badge class, taking the first
 * `.badge.<cls>` each draws - and finds the roll button by the real markup
 * every roll page shares. */
const { fresh, reporter, closeBrowser } = require('./lib.js');

/* One route per badge class - the first row of each table carries it -
 * plus `.badge.src`, which every row on every table carries, so any of them
 * will do for that one. */
const ROUTES = {
  item: '#/tables/core_item',
  cons: '#/tables/core_consumable',
  'eq-weapon': '#/tables/eq_weapon',
  'eq-secondary': '#/tables/eq_secondary',
  'eq-armor': '#/tables/eq_armor',
  src: '#/tables/core_item'
};

const MIN_HUE = 40; // degrees between two colourful badges
const MIN_SAT = 0.12; // below this a colour reads as grey and hue means nothing

const rep = reporter();
const { ok } = rep;

const hsl = (rgb) => {
  const [r, g, b] = rgb.match(/\d+/g).slice(0, 3).map(Number).map((v) => v / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  const l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
};
const gap = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

(async () => {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });

  const colours = {};
  for (const [cls, route] of Object.entries(ROUTES)) {
    await d.open(route);
    const c = await page.evaluate((cls) => {
      const el = document.querySelector('.badge.' + cls);
      return el ? getComputedStyle(el).color : null;
    }, cls);
    ok(!!c, route + ': no .badge.' + cls + ' drawn to read a colour off');
    colours[cls] = c;
  }

  const info = {};
  for (const k of Object.keys(colours)) {
    if (colours[k]) info[k] = hsl(colours[k]);
  }
  for (const k of Object.keys(info)) {
    console.log(
      '  ' +
        k.padEnd(13) +
        String(colours[k]).padEnd(20) +
        'H' +
        Math.round(info[k].h).toString().padStart(4) +
        '°  S' +
        info[k].s.toFixed(2)
    );
  }

  const keys = Object.keys(info);
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = info[keys[i]];
      const b = info[keys[j]];
      const na = keys[i];
      const nb = keys[j];
      if (a.s < MIN_SAT || b.s < MIN_SAT) {
        ok(
          Math.abs(a.s - b.s) > 0.2 || Math.abs(a.l - b.l) > 0.12,
          na + ' и ' + nb + ': оба блёклые и одной светлоты'
        );
        continue;
      }
      ok(
        gap(a.h, b.h) >= MIN_HUE,
        na + ' и ' + nb + ' одного тона: ' + Math.round(gap(a.h, b.h)) + '° при минимуме ' + MIN_HUE
      );
    }
  }

  /* The roll button is the same control everywhere: gold, with a die on it.
   * `:has()` is Chrome's, and this only ever runs in Chrome. */
  console.log('кнопки броска одинаковы');
  const rollLook = async (hash) => {
    await d.open(hash);
    return page.$$eval('button.btn.primary:has(.dieicon)', (els) =>
      els.map((x) => {
        const s = getComputedStyle(x);
        return { look: s.backgroundImage + '|' + s.color, die: !!x.querySelector('svg') };
      })
    );
  };
  const std = await rollLook('#/roll/std');
  ok(std.length >= 4, 'кнопок броска меньше четырёх: ' + std.length);
  ok(
    std.every((x) => x.die),
    'не на каждой кнопке броска есть кость'
  );
  ok(
    new Set(std.map((x) => x.look)).size === 1,
    'кости броска выглядят по-разному: ' + [...new Set(std.map((x) => x.look))].join(' / ')
  );
  for (const h of ['#/roll/alt', '#/roll/wondrous', '#/roll/voa']) {
    const one = await rollLook(h);
    ok(one.length === 1, h + ': кнопок броска не одна');
    ok(!!one[0]?.die, h + ': на кнопке броска нет кости');
    ok(one[0]?.look === std[0]?.look, h + ': кнопка броска выглядит иначе, чем на обычных таблицах');
  }

  /* Equipment's stat line keeps one tone everywhere across the three
   * equipment tables - the kind is told by the badge, not by a second colour
   * on the numbers (`eqtest.js:207-218`). */
  console.log('характеристики снаряжения одного тона');
  const statColour = async (hash) => {
    await d.open(hash);
    return page.$$eval('.rows .row .rstats', (els) => [...new Set(els.map((x) => getComputedStyle(x).color))]);
  };
  const csw = await statColour('#/tables/eq_weapon');
  const css = await statColour('#/tables/eq_secondary');
  const csa = await statColour('#/tables/eq_armor');
  ok(
    new Set([].concat(csw, css, csa)).size === 1,
    'характеристики снаряжения окрашены по-разному: ' + [csw, css, csa].join(' | ')
  );

  /* A selected tile has its own fill, read off the rendered page rather than
   * grepped out of style.css (craftmob.js:68-71) - the same claim, made
   * against the app R0c keeps. */
  console.log('заливка выбранной плитки');
  await d.open('#/tables/eq_weapon');
  await d.press('Сеткой');
  await d.tick('Палаш');
  const selFill = await page.evaluate(() => {
    const el = document.querySelector('.tilewrap.sel .tile');
    return el ? getComputedStyle(el).backgroundColor : null;
  });
  const plainFill = await page.evaluate(() => {
    const el = document.querySelector('.tilewrap:not(.sel) .tile');
    return el ? getComputedStyle(el).backgroundColor : null;
  });
  ok(!!selFill, 'выбранная плитка: .tilewrap.sel .tile не найден');
  ok(
    !!plainFill && selFill !== plainFill,
    'выбранная плитка не отличается своей заливкой: ' + selFill + ' vs ' + plainFill
  );

  await ctx.close();
  await closeBrowser();
  console.log(rep.failed ? '\n' + rep.failed + ' FAILED' : '\nцвета ярлыков (dist/): все различимы по тону');
  process.exit(rep.failed ? 1 : 0);
})();
