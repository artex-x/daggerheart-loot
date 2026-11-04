/* Badges that can share a screen have to be told apart by color, not by
 * reading them - the same rule the live app's own suite, since deleted
 * (issue 47), enforced there. Distance in Lab was the wrong measure there; hue
 * is what the eye sorts by, so hue is what is checked.
 *
 * Rewritten, not ported: the original injected a bare `<span class="badge
 * item">` into the document and read its color, which gave Svelte's
 * scoped `.badge` rules nothing to match, and grepped `[data-act="roll"]`,
 * which does not exist here. This reads the computed color off *rendered*
 * badges instead - one table route per badge class, taking the first
 * `.badge.<cls>` each draws - and finds the roll button by the real markup
 * every roll page shares. */
const { fresh, reporter, closeBrowser } = require('./lib.js');

/* One route per badge class - the first row of each table carries it -
 * plus `.badge.src`, which every row on every table carries, so any of them
 * will do for that one. */
/* A one-kind or one-book table hides the tag its page already says (`rowTags.ts`), so
   the kinds are read on a table of all five and the source on the equipment table,
   whose rows from other books keep theirs. */
const ROUTES = {
  item: '#/tables/dragons_vault',
  cons: '#/tables/dragons_vault',
  'eq-weapon': '#/tables/dragons_vault',
  'eq-secondary': '#/tables/dragons_vault',
  'eq-armor': '#/tables/dragons_vault',
  src: '#/tables/eq_weapon'
};

const MIN_HUE = 40; // degrees between two colorful badges
const MIN_SAT = 0.12; // below this a color reads as gray and hue means nothing

const rep = reporter();
const { ok } = rep;

const hsl = (rgb) => {
  const [r, g, b] = rgb
    .match(/\d+/g)
    .slice(0, 3)
    .map(Number)
    .map((v) => v / 255);
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
    ok(!!c, route + ': no .badge.' + cls + ' drawn to read a color off');
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
          na + ' and ' + nb + ': both muted and the same lightness'
        );
        continue;
      }
      ok(
        gap(a.h, b.h) >= MIN_HUE,
        na +
          ' and ' +
          nb +
          ' are the same hue: ' +
          Math.round(gap(a.h, b.h)) +
          '° against a minimum of ' +
          MIN_HUE
      );
    }
  }

  /* A roll button with a die is gold, one to a page; the five dice of the Core rules are an
   * action each, and plain (DESIGN.md, "The Seal Rule").
   * `:has()` is Chrome's, and this only ever runs in Chrome. */
  console.log('roll buttons match');
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
  ok(std.length === 0, 'a gold roll button on the Core rules page: ' + std.length);
  const dice = await page.$$eval('.dicebar button', (els) =>
    els.map((x) => {
      const s = getComputedStyle(x);
      return {
        look: s.backgroundImage + '|' + s.backgroundColor + '|' + s.color,
        fill: s.backgroundImage + '|' + s.backgroundColor
      };
    })
  );
  const plainFill = await page.$eval('.resacts .morewrap > .btn', (x) => {
    const s = getComputedStyle(x);
    return s.backgroundImage + '|' + s.backgroundColor;
  });
  ok(dice.length === 5, 'not five dice: ' + dice.length);
  ok(
    dice.every((x) => x.fill === plainFill),
    'a die is not filled as a plain button: ' + dice[0]?.fill + ' against ' + plainFill
  );
  ok(
    new Set(dice.map((x) => x.look)).size === 1,
    'the dice look different: ' + [...new Set(dice.map((x) => x.look))].join(' / ')
  );
  let rollButton = null;
  for (const h of [
    '#/roll/alt',
    '#/roll/wondrous_environments',
    '#/roll/vault_of_ages',
    '#/roll/dragons_vault',
    '#/roll/arazos_artifacts',
    '#/roll/many_worlds_tavern'
  ]) {
    const one = await rollLook(h);
    ok(one.length === 1, h + ': not exactly one roll button');
    ok(!!one[0]?.die, h + ': the roll button has no die');
    rollButton ??= one[0]?.look;
    ok(one[0]?.look === rollButton, h + ': the roll button looks different than on /roll/alt');
  }

  /* The editor's choices are the neutral pressed state: a check and no gold; the gold is
   * «Сохранить» alone (DESIGN.md, "Segmented control"). */
  console.log('the editor keeps gold for its save');
  await d.open('#/homebrew/new', { as: 'gm1' });
  const gold = await page.evaluate(() => {
    const probe = document.createElement('i');
    probe.style.color = 'var(--gold)';
    document.body.append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  });
  const pressed = await page.$$eval('.hbform .seg [aria-pressed="true"]', (els) =>
    els.map((x) => ({ color: getComputedStyle(x).color, check: !!x.querySelector('svg') }))
  );
  ok(pressed.length >= 2, 'the editor draws ' + pressed.length + ' pressed options');
  ok(
    pressed.every((x) => x.check && x.color !== gold),
    'an editor choice is gold or has no check: ' + JSON.stringify(pressed)
  );
  const golden = await page.$$eval('.hbform .btn.primary', (els) => els.length);
  ok(golden === 1, 'the editor draws ' + golden + ' gold buttons');

  /* The account's pickers are neutral too, and its one fill is the delete confirm's final
   * button (DESIGN.md, "Buttons"). */
  console.log('the account keeps its pickers neutral');
  await d.open('#/account', { as: 'gm1' });
  await page.waitForSelector('.acc .seg');
  const accPressed = await page.$$eval('main .seg [aria-pressed="true"]', (els) =>
    els.map((x) => ({ color: getComputedStyle(x).color, check: !!x.querySelector('svg') }))
  );
  ok(accPressed.length === 4, 'the account draws ' + accPressed.length + ' pressed options');
  ok(
    accPressed.every((x) => x.check && x.color !== gold),
    'an account choice is gold or has no check: ' + JSON.stringify(accPressed)
  );

  /* Search lights a kind chip only once it narrows: «Все» is the neutral default. */
  console.log('search lights a picked kind only');
  await d.open('#/search');
  const lit = () =>
    page.$$eval('.kindrow .chip', (els) => els.map((x) => getComputedStyle(x).backgroundColor));
  const before = await lit();
  await d.click('Снаряжение');
  const after = await lit();
  const goldBg = await page.evaluate(() => {
    const probe = document.createElement('i');
    probe.style.backgroundColor = 'var(--gold)';
    document.body.append(probe);
    const c = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return c;
  });
  ok(!before.includes(goldBg), 'search lights a kind chip before a pick: ' + before.join(', '));
  ok(
    after.filter((c) => c === goldBg).length === 1,
    'search does not light exactly the picked kind: ' + after.join(', ')
  );

  /* Equipment's stat line keeps one tone everywhere across the three
   * equipment tables - the kind is told by the badge, not by a second color
   * on the numbers, the same rule the legacy `eqtest.js` enforced. */
  console.log('equipment stats are one tone');
  const statColour = async (hash) => {
    await d.open(hash);
    return page.$$eval('.rows .row .rstats', (els) => [
      ...new Set(els.map((x) => getComputedStyle(x).color))
    ]);
  };
  const csw = await statColour('#/tables/eq_weapon');
  const css = await statColour('#/tables/eq_secondary');
  const csa = await statColour('#/tables/eq_armor');
  ok(
    new Set([].concat(csw, css, csa)).size === 1,
    'equipment stats are colored differently: ' + [csw, css, csa].join(' | ')
  );

  /* A selected tile has its own fill, read off the rendered page rather than
   * grepped out of the legacy style.css - the same claim, made against the
   * app as it stands today. */
  console.log('selected tile fill');
  await d.open('#/tables/eq_weapon');
  await d.press('Сетка');
  await d.tick('Палаш');
  const selFill = await page.evaluate(() => {
    const el = document.querySelector('.tilewrap.sel .tile');
    return el ? getComputedStyle(el).backgroundColor : null;
  });
  const tileFill = await page.evaluate(() => {
    const el = document.querySelector('.tilewrap:not(.sel) .tile');
    return el ? getComputedStyle(el).backgroundColor : null;
  });
  ok(!!selFill, 'selected tile: .tilewrap.sel .tile not found');
  ok(
    !!tileFill && selFill !== tileFill,
    'the selected tile does not differ in its fill: ' + selFill + ' vs ' + tileFill
  );

  await ctx.close();
  await closeBrowser();
  console.log(
    rep.failed
      ? '\n' + rep.failed + ' FAILED'
      : '\nbadge colors (dist-test/): all distinguishable by hue'
  );
  process.exit(rep.failed ? 1 : 0);
})();
