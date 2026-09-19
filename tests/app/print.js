/* #/print/<ids> against dist/ - sheet grid, card size against the design,
 * versatile weapons, dice by damage type, armour, black and white, art
 * edges, text fitting, entry points.
 *
 * Transposed from tests/print.js (the live-app suite, `print`) onto
 * `fresh()` and the moved driver (`tests/app/driver.js`). `window.LOOT` does
 * not exist here - the rewrite loads `data.js` into its own module graph, not
 * onto `window` - so the one set built from it (all of Wondrous, for the
 * "does not silently drop a big set" case) comes from `data.json` instead,
 * the way the deleted parity harness's own `tests/parity/specs.js` built its
 * print sets. Every `[data-act="printArt"][data-val=...]` click becomes a
 * name-based `d.click()`: `dist/` renders no `data-act` attribute anywhere
 * (checked live against a built tree) - `PrintPage.svelte`
 * wires its colour/black-and-white switch and its "back" control through
 * Svelte `onclick` handlers on plain buttons, not through attributes a CSS
 * selector can grip. This is the same fallback `tests/parity/specs.js` used
 * for the same buttons (`d.click('Чёрно-белая')`, `NAME[lang].printLink`),
 * recorded here as a design change rather than substituted silently. The one
 * other id the rewrite dropped, `#selBar`, is `.selbarwrap` here - the same
 * substitution `tests/app/states.js`'s case 16 already made.
 *
 * The three SVG-file reads resolve their basename against the repository's
 * own `card/` directory: the legacy file joined `__dirname/..` (the
 * repository root, from `tests/`) to a `src` already shaped `card/x.svg`,
 * but this suite's `__dirname` is `tests/app/`, one level deeper, so the same
 * join would look for `tests/card/`. `readPNG` is inlined - one consumer, no
 * shared home earned, and `tests/lib.js` (its former home) has since been
 * deleted.
 *
 * `sheetCounts`, `cardFit`, `printMedia` and `copiedPrintLink` below are
 * ported from `tests/parity/specs.js`'s own print specs, which died
 * with the parity harness and are measured nowhere else. A parity spec only
 * observed and compared against the live app; run standalone here, each
 * becomes a real assertion against numbers read directly off `dist/` (and,
 * for the sheet arithmetic, cross-checked against the live app on the same
 * routes at batch open) rather than a diff.
 */
const fs = require('fs');
const path = require('path');
const { fresh, reporter, closeBrowser } = require('./lib.js');

const MM = 96 / 25.4; // css pixels per millimetre
const CARD_DIR = path.join(__dirname, '..', '..', 'card');
const LOOT = require('../../data.json');

const svgFile = (src) => fs.readFileSync(path.join(CARD_DIR, src.replace(/^.*\//, '')), 'utf8');

/* The print routes shared between the card-layout assertions above and the
 * four ported specs below - `tests/parity/specs.js`'s own `NINE`/`LONG`/
 * `TEN`/`TOO_MANY`, rebuilt off `data.json` the way it built `TOO_MANY`. */
const NINE = '#/print/ci1-q1-q313-cc1-voa2_a3-q23-w51-q35-di11';
const LONG = '#/print/voa2_a3-voa2_a1-voa2_c4-voa2_c3-voa2_t4e-voa2_t4d-voa2_c1-voa2_a6-di11';
const TEN = '#/print/' + Array.from({ length: 10 }, (_, i) => 'ci' + (i + 1)).join('-');
const TOO_MANY =
  '#/print/' +
  Object.values(LOOT.items)
    .flat()
    .slice(0, 181)
    .map((x) => x.id)
    .join('-');

/* The eight states that draw a sheet at all - `tests/parity/specs.js`'s
 * `PRINT_CARD_STATES`, minus `#/print/nope`, which draws no sheet for
 * `sheetCounts`/`cardFit` to read. `n` is each route's own id count, so the
 * sheet arithmetic below is computed, not copied as a magic number: printed
 * = min(n, 180), sheets = ceil(printed / 9). */
const PRINT_CARD_STATES = [
  { route: NINE, bw: false, label: 'NINE', n: 9 },
  { route: NINE, bw: true, label: 'NINE ~ bw', n: 9 },
  { route: LONG, bw: false, label: 'LONG', n: 9 },
  { route: LONG, bw: true, label: 'LONG ~ bw', n: 9 },
  { route: '#/print/ci1-q1', bw: false, label: 'ci1-q1', n: 2 },
  { route: '#/print/ci1-q1', bw: true, label: 'ci1-q1 ~ bw', n: 2 },
  { route: TEN, bw: false, label: 'TEN', n: 10 },
  { route: TOO_MANY, bw: false, label: 'TOO_MANY', n: 181 }
];

/* style.css's own breakpoints, the same three widths `tests/parity/specs.js`
 * swept every state at - not because the print card's own size depends on
 * the viewport (it does not: 63x88 mm is absolute), but because its
 * container query makes its size the one thing worth re-checking at every
 * width regardless (`tests/app/driver.js`, `eachAt`'s own doc comment). */
const WIDTHS = [
  { w: 1100, h: 900 },
  { w: 768, h: 900 },
  { w: 375, h: 812 }
];

/**
 * PNG bytes to pixels, inlined from `tests/lib.js` (its only consumer).
 * Chrome's own screenshots are always 8-bit, non-interlaced, so a hand-rolled
 * decoder covers the one case actually produced here rather than pulling in a
 * dependency for it.
 */
function readPNG(buf) {
  let p = 8,
    w = 0,
    h = 0,
    depth = 0,
    type = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p),
      tag = buf.toString('ascii', p + 4, p + 8);
    const d = buf.slice(p + 8, p + 8 + len);
    if (tag === 'IHDR') {
      w = d.readUInt32BE(0);
      h = d.readUInt32BE(4);
      depth = d[8];
      type = d[9];
    } else if (tag === 'IDAT') idat.push(d);
    else if (tag === 'IEND') break;
    p += 12 + len; // length + tag + data + crc
  }
  if (depth !== 8 || (type !== 6 && type !== 2)) {
    throw new Error('wrong PNG shape: ' + depth + ' bit, type ' + type);
  }
  const ch = type === 6 ? 4 : 3;
  const raw = require('zlib').inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(w * h * ch);
  let q = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[q++],
      line = q;
    q += w * ch;
    for (let x = 0; x < w * ch; x++) {
      const a = x >= ch ? out[y * w * ch + x - ch] : 0;
      const b = y > 0 ? out[(y - 1) * w * ch + x] : 0;
      const c = x >= ch && y > 0 ? out[(y - 1) * w * ch + x - ch] : 0;
      const v = raw[line + x];
      let r;
      if (f === 0) r = v;
      else if (f === 1) r = v + a;
      else if (f === 2) r = v + b;
      else if (f === 3) r = v + ((a + b) >> 1);
      else {
        const pp = a + b - c,
          pa = Math.abs(pp - a),
          pb = Math.abs(pp - b),
          pc = Math.abs(pp - c);
        r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      out[y * w * ch + x] = r & 255;
    }
  }
  return {
    w,
    h,
    lum(x, y) {
      const i = (y * w + x) * ch;
      return 0.2126 * out[i] + 0.7152 * out[i + 1] + 0.0722 * out[i + 2];
    }
  };
}

const rep = reporter();
const { ok } = rep;

(async () => {
  const { ctx, page, d } = await fresh({ width: 1180, height: 950 });
  const bw = () => d.click('Чёрно-белая');
  const colour = () => d.click('Цветная');

  /* A page error would otherwise fail silently: every other tests/app/ suite
     that drives a real page collects one (sweep.js is the pattern), and this
     one - single shared page across the whole file - had none. */
  const pageErrs = [];
  page.on('pageerror', (e) => pageErrs.push(e.message));

  /* ---------- card size ----------
     63x88 mm is a playing-card size: sleeves and boxes are sold to it, so it
     is checked in millimetres, not "by eye off a picture". */
  console.log('size and grid');
  await d.open('#/print/ci1-ci2-ci3-w7-w1-q1-voa1_t1a-cc1-f1');
  const box = await page.$eval('.pcard', (e) => {
    const r = e.getBoundingClientRect();
    return { w: r.width, h: r.height };
  });
  ok(Math.abs(box.w / MM - 63) < 0.4, 'card width is not 63 mm: ' + (box.w / MM).toFixed(2));
  ok(Math.abs(box.h / MM - 88) < 0.4, 'card height is not 88 mm: ' + (box.h / MM).toFixed(2));

  ok(
    (await page.$$eval('.psheet', (e) => e.length)) === 1,
    'nine cards did not lay out on one sheet'
  );
  ok(
    (await page.$$eval('.pcard', (e) => e.length)) === 9,
    'the sheet does not have nine slots'
  );
  /* The sheet is a whole A4: its margins live inside it, not on the page, or
     the third column drifts onto the next sheet. */
  const sheet = await page.$eval('.psheet', (e) => {
    const r = e.getBoundingClientRect();
    return { w: r.width, h: r.height };
  });
  ok(
    Math.abs(sheet.w / MM - 210) < 0.6 && Math.abs(sheet.h / MM - 297) < 0.6,
    'sheet is not A4: ' + (sheet.w / MM).toFixed(1) + 'x' + (sheet.h / MM).toFixed(1)
  );
  /* A gap between cards is where the cut goes, and the card's own border
     stays visible. */
  const gap = await page.evaluate(() => {
    const c = document.querySelectorAll('.pcard');
    return c[1].getBoundingClientRect().left - c[0].getBoundingClientRect().right;
  });
  ok(
    gap / MM > 1 && gap / MM < 4,
    'gap between cards is not sized for the cut: ' + (gap / MM).toFixed(2) + ' mm'
  );

  /* A tenth card starts a second sheet, and blanks pad it to nine: a full
     grid cuts more evenly. */
  console.log('several sheets');
  await d.open('#/print/ci1-ci2-ci3-ci4-ci5-ci6-ci7-ci8-ci9-ci10');
  ok(
    (await page.$$eval('.psheet', (e) => e.length)) === 2,
    'the tenth card did not start a second sheet'
  );
  ok(
    (await page.$$eval('.pcard', (e) => e.length)) === 18,
    'the second sheet is not padded to nine slots'
  );
  ok((await page.$$eval('.pcard.blank', (e) => e.length)) === 8, 'blank slots are not eight');
  /* A place is held, but no cut line is drawn over it: there is nothing to
     cut there, and an extra line is an extra reason to cut the wrong thing. */
  ok(
    (await page.$eval('.pcard.blank', (e) =>
      parseFloat(getComputedStyle(e).borderTopWidth)
    )) === 0,
    'a cut line is drawn over a blank slot'
  );
  ok(
    (await page.$eval('.pcard:not(.blank)', (e) =>
      parseFloat(getComputedStyle(e).borderTopWidth)
    )) > 0,
    "a card's cut line is missing"
  );
  ok(await page.$('.psheet[data-next]'), 'the second sheet is not marked as a page start');
  /* A third sheet at the twentieth card, and every sheet stays exactly A4. */
  await d.open('#/print/' + Array.from({ length: 20 }, (_, i) => 'ci' + (i + 1)).join('-'));
  const heights = await page.$$eval('.psheet', (e) =>
    e.map((x) => x.getBoundingClientRect().height)
  );
  ok(heights.length === 3, 'twenty cards did not lay out on three sheets: ' + heights.length);
  ok(
    heights.every((h) => Math.abs(h / MM - 297) < 0.6),
    'a sheet is not A4: ' + heights
  );

  /* All of Wondrous at once - 119 cards - fits: the old cap of 54 clipped
     exactly this case, and clipped it silently. */
  console.log('a large set');
  const many = LOOT.items.wondrous.map((x) => x.id);
  await d.open('#/print/' + many.join('-'));
  const drawn = await page.$$eval('.pcard:not(.blank)', (e) => e.length);
  ok(drawn === many.length, 'all of Wondrous did not fit: ' + drawn + ' of ' + many.length);
  ok(!(await page.$('.warnnote')), 'a truncation warning on a set that fit');
  /* And when it genuinely does not fit, that is said, not silently dropped. */
  const tooMany = many
    .concat(LOOT.items.voa.map((x) => x.id))
    .concat(LOOT.items.community.map((x) => x.id));
  await d.open('#/print/' + tooMany.join('-'));
  ok(await page.$('.warnnote'), 'the set was truncated silently, with no warning');

  /* ---------- card layout ----------
     Off the print-card design: the rank ribbon, the grip marks, a pair of
     tags, the name in capitals, the framed stat strip, the text, the book
     caption. */
  console.log('card layout');
  await d.open('#/print/q1');
  const parts = await page.evaluate(() => {
    const q = (s) => {
      const e = document.querySelector(s);
      return e && e.textContent.trim();
    };
    return {
      tier: q('.pc-tier'),
      tags: [...document.querySelectorAll('.pc-tag')].map((x) => x.textContent.trim()),
      name: q('.pc-name'),
      text: q('.pc-text'),
      cells: q('.pc-cells'),
      bottom: q('.pc-bottom'),
      hands: document.querySelectorAll('.pc-burden img').length,
      ribbon: !!document.querySelector('.pc-ribbon'),
      die: q('.pc-die')
    };
  });
  ok(/^1/.test(parts.tier || ''), 'the ribbon has no tier: ' + parts.tier);
  ok(
    /ОРУЖИЕ/i.test(parts.tags[0] || ''),
    "the first tag is not the item's kind: " + parts.tags
  );
  ok(/ФИЗИЧЕСК/i.test(parts.tags[1] || ''), 'the second tag is not the class: ' + parts.tags);
  ok(parts.name === 'Палаш', 'the name on the card is different: ' + parts.name);
  ok(/Надёжное/.test(parts.text), 'no property text');
  ok(parts.die === 'd8', 'the die does not show the right damage: ' + parts.die);
  ok(parts.ribbon, 'the stat strip has no frame');
  /* Values sit at the frame's own partitions, not wherever: the dividers are
     at 30.4% and 64.1% of its width, and the cells' shares repeat them. The
     damage die with its bonus stands outside - inside, it took space from the
     first cell. */
  ok(!(await page.$('.pc-cells .pc-die')), 'the damage die sits inside the frame');
  const cells = await page.evaluate(() => {
    const f = document.querySelector('.pc-frame').getBoundingClientRect();
    return [...document.querySelectorAll('.pc-cells > *')].map((b) => {
      const r = b.getBoundingClientRect();
      return {
        l: ((r.left - f.left) / f.width) * 100,
        r: ((r.right - f.left) / f.width) * 100
      };
    });
  });
  ok(cells.length === 3, 'the stat strip does not have three cells: ' + cells.length);
  ok(
    Math.abs(cells[0].r - 30.8) < 1 && Math.abs(cells[1].r - 63.7) < 1,
    "cells do not line up with the frame's dividers: " +
      cells.map((c) => c.r.toFixed(1)).join(', ')
  );
  ok(
    /Проворность/i.test(parts.cells) && /Вплотную/i.test(parts.cells),
    'the stat strip is missing the trait or the range: ' + parts.cells
  );
  ok(parts.hands === 1, 'burden mark count is not one: ' + parts.hands);

  /* The grip mark comes from the design whole. Assembled from two pictures,
     it drew the right palm twice - a two-handed grip looked like two right
     palms. */
  const burden = () =>
    page.$eval('.pc-burden img', (e) => e.getAttribute('src').replace(/^.*\//, ''));
  await d.open('#/print/w51'); // two-handed grip
  ok(
    (await burden()) === 'burden-2.svg',
    'the two-handed grip has the wrong mark: ' + (await burden())
  );
  await d.open('#/print/w7'); // one-handed
  ok(
    (await burden()) === 'burden-1.svg',
    'the one-handed grip has the wrong mark: ' + (await burden())
  );

  /* `bu: 'any'` draws the one-handed mark captioned "1/2": no two-handed pair
   * is exported (docs/DECISIONS.md, "Gryphon Hammer `bu: 'any'`"). */
  await d.open('#/print/dve30');
  ok(
    (await burden()) === 'burden-1.svg',
    'the One/Two-Handed grip has the wrong mark: ' + (await burden())
  );
  const burdenCaption = await page.$eval('.pc-burden small', (e) => e.textContent.trim());
  ok(
    burdenCaption === '1/2',
    'the One/Two-Handed caption does not read the value: ' + burdenCaption
  );
  ok(
    /Daggerheart/.test(parts.bottom) && /Core/i.test(parts.bottom),
    'the caption is missing the book: ' + parts.bottom
  );
  /* A community item's caption names the book, not only the community: the
     card leaves the table on its own, and "Великородное" does not say where
     it came from. */
  await d.open('#/print/cm1');
  const commBottom = await page.$eval('.pc-bottom', (e) => e.textContent);
  ok(
    /Сообществ/i.test(commBottom) && /Великородное/.test(commBottom),
    'the community card is missing the book: ' + commBottom
  );

  /* Damage with a bonus: "d6 +2" beside the die, not a digit over it. */
  await d.open('#/print/w7');
  ok(
    (await page.$eval('.pc-die', (e) => e.textContent.trim())) === 'd6',
    'the damage bonus crept onto the die'
  );
  ok(
    (await page.$eval('.pc-bonus', (e) => e.textContent.trim())) === '+2',
    'the damage bonus is not shown separately'
  );

  /* "Versatile" is a second set of stats, and the book hides it in the
     property's prose. On the card it stands as a second strip, as the design
     has it. */
  console.log('versatile weapon');
  await d.open('#/print/q23');
  const strips = await page.$$eval('.pc-strip .pc-cells', (e) => e.map((x) => x.textContent));
  ok(strips.length === 2, 'versatile weapon does not have two strips: ' + strips.length);
  ok(
    /Далеко/i.test(strips[0]) && /Вплотную/i.test(strips[1]),
    'the second strip repeats the first: ' + strips.join(' | ')
  );
  const dice = await page.$$eval('.pc-die', (e) => e.map((x) => x.textContent.trim()));
  ok(dice.join() === 'd6,d8', "the two strips' dice are not from the book: " + dice.join());

  /* A feature that swaps the stat set draws the same second strip, and a
     set's shared bonus is the last text line of every member. */
  console.log('stat-swapping weapons and the set bonus');
  await d.open('#/print/dve19');
  const emberStrips = await page.$$eval('.pc-strip .pc-cells', (e) =>
    e.map((x) => x.textContent)
  );
  ok(emberStrips.length === 2, 'Ember does not have two strips: ' + emberStrips.length);
  ok(/Близко/i.test(emberStrips[1] || ''), 'Ember second strip: ' + emberStrips[1]);
  const emberDice = await page.$$eval('.pc-die', (e) => e.map((x) => x.textContent.trim()));
  ok(emberDice.join() === 'd8,d12', 'Ember dice: ' + emberDice.join());
  const emberLast = await page.$$eval('.pc-text i', (e) => e.map((x) => x.textContent).pop());
  ok(
    emberLast === 'Пылающие близнецы (Комплект: Уголёк, Искра):',
    'Ember set line label: ' + emberLast
  );
  await d.open('#/print/dve54');
  const gauntletDice = await page.$$eval('.pc-die', (e) => e.map((x) => x.textContent.trim()));
  ok(gauntletDice.join() === 'd10,d12', 'Steampowered Gauntlets dice: ' + gauntletDice.join());
  await d.open('#/print/dve20');
  const sparkText = await page.$eval('.pc-text', (e) => e.textContent);
  ok(
    sparkText.split('Пылающие близнецы').length === 2 && !/вместе с Угольком/.test(sparkText),
    'Spark carries the bonus other than once, in the set line: ' + sparkText
  );

  /* The Spellcast trait cell uses the print-only short form, and fits. */
  for (const isBw of [false, true]) {
    await d.open('#/print/dve50');
    if (isBw) {
      await bw();
      await d.settle();
    }
    const trait = await page.$eval('.pc-c2 .pc-box b', (e) => e.textContent.trim());
    ok(
      trait === 'Хар. Заклинателя',
      (isBw ? 'bw: ' : 'colour: ') + 'Spellblade trait: ' + trait
    );
    const clipped = await page.$$eval('.pc-strip .pc-box b', (all) => {
      const rng = document.createRange();
      return all
        .filter((v) => {
          rng.selectNodeContents(v);
          return rng.getBoundingClientRect().width > v.clientWidth + 1;
        })
        .map((v) => v.textContent);
    });
    ok(
      !clipped.length,
      (isBw ? 'bw: ' : 'colour: ') + 'Spellblade strip text is clipped: ' + clipped.join(', ')
    );
  }
  await colour();
  await d.settle();

  /* Each die has its own shape, and colour follows the damage type: physical
     gold, magical blue-violet. */
  console.log('die by damage type');
  await d.open('#/print/q1');
  ok(
    /die-d8-phy\.svg$/.test(await page.$eval('.pc-die img', (e) => e.getAttribute('src'))),
    'the physical d8 does not have its own die'
  );
  await d.open('#/print/q35');
  const md = await page.$$eval('.pc-die img', (e) => e.map((x) => x.getAttribute('src')));
  ok(/die-d6-mag\.svg$/.test(md[0]), 'the magical d6 does not have a magical die: ' + md[0]);
  ok(await page.$('.pc-die.mag'), 'the magical die is not marked with its class');
  /* Every die has its own shape, and none draws as the generic hexagon - d4
     and d12 used to fall into it and looked out of place. */
  const DICE = [
    ['q241', 'd4'],
    ['q13', 'd6'],
    ['q1', 'd8'],
    ['q2', 'd10'],
    ['q6', 'd12'],
    ['q143', 'd20']
  ];
  for (const [id, die] of DICE) {
    await d.open('#/print/' + id);
    const src = await page.$eval('.pc-die img', (e) => e.getAttribute('src'));
    ok(
      new RegExp('die-' + die + '-(phy|mag)\\.svg$').test(src),
      die + ' took the wrong shape: ' + src
    );
    ok(await page.$('.pc-die.own'), die + ' is drawn as the generic hexagon');
  }

  /* Values in the strip are not ellipsised: they shrink by font instead. */
  await d.open('#/print/q129');
  const cut = await page.$$eval('.pc-box b', (e) =>
    e
      .filter((x) => {
        const r = document.createRange();
        r.selectNodeContents(x);
        return r.getBoundingClientRect().width > x.clientWidth + 1;
      })
      .map((x) => x.textContent)
  );
  ok(!cut.length, 'a value in the strip is clipped: ' + cut.join(', '));

  /* The longest trait/range/bonus combinations in the whole catalogue: if a
     value is ever going to be cut, it is on these. Both sheet kinds are
     checked - black-and-white has its own size. "Did not fit" here means
     "part of the card's data is lost", not "looks bad". */
  for (const isBw of [false, true]) {
    await d.open('#/print/f44-f64-voa1_t2f-di7-w82-f77-di3-f7-q23');
    if (isBw) {
      await bw();
      await d.settle();
    }
    const lost = await page.$$eval('.pc-strip .pc-box b,.pc-strip .pc-box small', (all) => {
      const rng = document.createRange();
      return all
        .filter((v) => {
          rng.selectNodeContents(v);
          return rng.getBoundingClientRect().width > v.clientWidth + 1;
        })
        .map((v) => v.textContent);
    });
    ok(
      !lost.length,
      (isBw ? 'bw: ' : 'colour: ') + 'text is lost on the longest values: ' + lost.join(', ')
    );
  }
  await d.open('#/print/q1');
  await colour();
  await d.settle();

  /* The frame grows out of the die, not standing beside it: in the design its
     whiskers meet the die's right edge. There used to be a gap between them,
     and the strip read as broken. */
  await d.open('#/print/w7');
  const seam = await page.evaluate(() => {
    const die = document.querySelector('.pc-die').getBoundingClientRect();
    const fr = document.querySelector('.pc-frame').getBoundingClientRect();
    return ((fr.left - die.right) / document.querySelector('.pcard').clientWidth) * 344;
  });
  ok(seam < 0, 'the frame does not reach behind the die: gap ' + seam.toFixed(1));
  /* And the damage bonus sits inside the first cell, pressed against the die,
     while the damage type sits at the divider. With no bonus the type
     centres in the cell: nothing to press it against then. */
  ok(await page.$('.pc-c1.wbonus .pc-bonus'), 'the damage bonus is outside the frame again');
  const spread = await page.$eval('.pc-c1', (e) => getComputedStyle(e).justifyContent);
  ok(spread === 'space-between', 'the bonus is not pressed against the die: ' + spread);
  await d.open('#/print/q1'); // damage with no bonus
  ok(!(await page.$('.pc-c1.wbonus')), 'a die with no bonus has spacing turned on');
  ok(
    (await page.$eval('.pc-c1', (e) => getComputedStyle(e).justifyContent)) === 'center',
    'with no bonus the damage type is not centred in the cell'
  );

  /* Armour is counted differently: instead of a grip mark, a shield with its
     Armour Score; instead of damage, a threshold scale. */
  console.log('armour');
  await d.open('#/print/q313');
  ok(!(await page.$('.pc-burden')), 'armour grew burden-grip hands');
  const shield = await page.$eval('.pc-shield', (e) => e.textContent.trim());
  ok(
    /^3/.test(shield),
    'the shield is missing the Armor Score ("Показатель Брони"): ' + shield
  );
  ok(/БРОНЯ/i.test(shield), 'the shield is missing the word: ' + shield);
  /* The mark comes from the design: in colour it is a dark shield in a gold
     halo with a white number, not an outline with a dark number - a
     different mark altogether. */
  const shieldFile = svgFile(await page.$eval('.pc-shield img', (e) => e.getAttribute('src')));
  ok(
    /fill="#18171C"/.test(shieldFile),
    'the shield in colour is an outline again, with no dark fill'
  );
  const asInk = await page.$eval('.pc-shield b', (e) => getComputedStyle(e).color);
  ok(/255, 255, 255/.test(asInk), 'the number on the dark shield is not white: ' + asInk);
  /* The number sits centred on the shield, the caption under it and not
     flush: both offsets were computed from the mark's width, and the width
     later changed - so they drifted apart. */
  const mark = () =>
    page.$eval('.pc-shield', (e) => {
      const img = e.querySelector('img').getBoundingClientRect();
      const num = e.querySelector('b').getBoundingClientRect();
      const cap = e.querySelector('i').getBoundingClientRect();
      const k = 33 / img.width; // into design units
      return {
        off: ((num.top + num.bottom) / 2 - (img.top + img.bottom) / 2) * k,
        gap: (cap.top - img.bottom) * k
      };
    });
  for (const isBw of [false, true]) {
    await d.open('#/print/q313');
    if (isBw) {
      await bw();
      await d.settle();
    }
    /* Both numbers are read off the shield vector, so it has to have a size
       first. A fixed pause was enough on an idle machine and not enough on a
       busy one: the caption then measured flush against a zero-height image,
       and the suite failed on a card nobody had touched. */
    await page.waitForFunction(
      () => {
        const img = document.querySelector('.pc-shield img');
        return !!img && img.getBoundingClientRect().width > 0;
      },
      { timeout: 8000, polling: 'raf' }
    );
    const m = await mark();
    ok(
      Math.abs(m.off) < 1.5,
      (isBw ? 'bw: ' : 'colour: ') +
        'the number is offset from the shield centre by ' +
        m.off.toFixed(1)
    );
    ok(
      m.gap > 1.5,
      (isBw ? 'bw: ' : 'colour: ') +
        'the caption is pressed against the shield: gap ' +
        m.gap.toFixed(1)
    );
  }
  await d.open('#/print/q313');
  await colour();
  await d.settle();
  const th = await page.$eval('.pc-thstrip', (e) => e.textContent);
  ok(/5/.test(th) && /11/.test(th), 'the scale has no thresholds: ' + th);
  ok(
    (await page.$$eval('.pc-th-box', (e) => e.length)) === 2,
    'the scale does not have two thresholds'
  );
  /* Both threshold cells are the same size, however many digits sit in them. */
  const thBox = await page.$$eval('.pc-th-box', (e) =>
    e.map((x) => Math.round(x.getBoundingClientRect().width))
  );
  ok(thBox[0] === thBox[1], 'threshold cells are different widths: ' + thBox.join(' and '));
  /* And the diamonds over the captions: one, two or three of them, but always
     the same diamond. */
  const dots = await page.$$eval('.pc-th-lab img', (e) =>
    e.map((x) => {
      const r = x.getBoundingClientRect();
      return +(r.width / r.height).toFixed(2) + '@' + Math.round(r.height);
    })
  );
  ok(
    new Set(dots.map((d2) => d2.split('@')[1])).size === 1,
    'diamonds above the captions are different heights: ' + dots.join(', ')
  );
  /* The scale's frame is a css border, not a picture: the picture stretched
     to height (the file is half as tall as the space it sits in) and the
     rounded corners came out oval. The sign it is back: a non-empty
     background-image. */
  const frame = await page.$eval('.pc-thstrip', (e) => {
    const c = getComputedStyle(e),
      r = e.getBoundingClientRect();
    return {
      img: c.backgroundImage,
      rad: parseFloat(c.borderTopLeftRadius),
      h: r.height,
      w: r.width
    };
  });
  ok(frame.img === 'none', "the threshold scale's frame is a picture again: " + frame.img);
  ok(
    frame.rad <= frame.h / 2 + 0.5,
    "the frame's rounding is more than half its height: " + frame.rad + ' at ' + frame.h
  );
  /* The cells overhang the frame top and bottom - as the design has it. */
  const thH = await page.$eval('.pc-th-box', (e) => e.getBoundingClientRect().height);
  ok(thH > frame.h, 'threshold cells do not overhang the frame: ' + thH + ' and ' + frame.h);
  ok(!(await page.$('.pc-die')), 'armour grew a damage die');

  /* Loot has neither. */
  await d.open('#/print/ci1');
  ok(
    !(await page.$('.pc-strip')) && !(await page.$('.pc-thstrip')),
    'the item grew a stat strip'
  );
  ok(!(await page.$('.pc-burden')), 'the item grew burden-grip hands');

  /* An artifact or a cursed item carries no rank, and the book's word for it
     sits on the tag instead of "item". */
  await d.open('#/print/voa2_a3');
  ok(!(await page.$('.pc-tier')), 'the artifact grew a tier ribbon');
  ok(
    /АРТЕФАКТ/i.test(await page.$eval('.pc-tag', (e) => e.textContent)),
    'the artifact is not named on the tag'
  );

  /* An upgrade chain and links to other cards do not go to print: the card
     goes to a player, and that is a conversation with the GM, and 63 mm is
     spoken for already. */
  console.log('extras are not printed');
  await d.open('#/print/ci18');
  const crafted = await page.$eval('.pcard', (e) => e.textContent);
  ok(
    !/Крафт|Craft|улучш/i.test(crafted),
    'the upgrade chain leaked onto the card: ' + crafted.slice(0, 120)
  );

  /* The card is deliberately light: a dark background eats ink, and on a
     black-and-white printer it turns text to mush. */
  const paint = await page.$eval('.pcard', (e) => ({
    card: getComputedStyle(e).backgroundColor,
    name: getComputedStyle(e.querySelector('.pc-name')).color
  }));
  ok(/255, 255, 255/.test(paint.card), 'the card does not print white: ' + paint.card);
  const lum =
    (paint.name.match(/\d+/g) || [])
      .slice(0, 3)
      .map(Number)
      .reduce((a, b) => a + b, 0) / 3;
  ok(lum < 90, 'the name on the card is too light to print: ' + paint.name);

  /* ---------- black-and-white sheet ----------
     Not "colour with no colour": there are no pictures at all, details are
     white with a dark outline, and the ribbon, the tag and the mark gather
     into a row above the name. */
  console.log('black-and-white sheet');
  await d.open('#/print/q1');
  ok(await page.$('.pc-img'), 'no picture in colour mode');
  await bw();
  await d.settle();
  ok(await page.$('.pcard.bw'), 'the button did not switch to the black-and-white sheet');
  ok(
    !(await page.$('.pc-img')) && !(await page.$('.pc-art')),
    'a picture remains in black-and-white'
  );
  ok(
    (await page.$('.pc-head .pc-tier')) && (await page.$('.pc-head .pc-tags')),
    'in black-and-white the ribbon and tag did not gather into a row'
  );
  ok(
    /-bw\.svg$/.test(await page.$eval('.pc-tier img', (e) => e.getAttribute('src'))),
    'black-and-white uses a colour asset'
  );
  /* The rank ribbon hangs from the card's top edge - in the design it starts
     exactly on the border. Standing in the common row it used to drift down
     by the block's own padding. */
  const tierTop = await page.$eval('.pcard:not(.blank)', (c) => {
    const t = c.querySelector('.pc-tier').getBoundingClientRect();
    return Math.round(t.top - c.getBoundingClientRect().top);
  });
  ok(tierTop <= 1, "the tier ribbon detached from the card's top by " + tierTop + ' px');
  /* The space held for the ribbon is held only where the ribbon exists. Loot
     has no rank, and the kind tag used to sit under the empty space instead
     of the text's own left edge. */
  await d.open('#/print/ci1');
  await bw();
  await d.settle();
  const noTier = await page.$eval('.pcard', (c) => {
    const cr = c.getBoundingClientRect();
    return {
      tier: !!c.querySelector('.pc-tier'),
      tag: c.querySelector('.pc-tag').getBoundingClientRect().left - cr.left,
      name: c.querySelector('.pc-name').getBoundingClientRect().left - cr.left
    };
  });
  ok(!noTier.tier, 'loot somehow grew a tier ribbon');
  ok(
    Math.abs(noTier.tag - noTier.name) < 2,
    "with no ribbon, the kind tag is not at the text's left edge: " +
      noTier.tag.toFixed(0) +
      ' and ' +
      noTier.name.toFixed(0)
  );
  /* A magic weapon's die shows a white number on a blue fill. In
     black-and-white the fill is white, and the number has to darken or it is
     simply gone. */
  await d.open('#/print/q35');
  await bw();
  await d.settle();
  /* A faceted die, as in the design, and a light halo saves the digit from
     the facets. The facets were once simply removed, and the die stopped
     looking like a die. */
  const bwDie = await page.$eval('.pc-die img', (e) => e.getAttribute('src'));
  ok(/-bw\.svg$/.test(bwDie), 'black-and-white uses a colour die: ' + bwDie);
  const bwFile = svgFile(bwDie);
  ok(
    (bwFile.match(/<path/g) || []).length === 2,
    "the black-and-white die's facets are missing"
  );
  ok(/0 0 [\d.]+ [\d.]+/.test(bwFile), 'the black-and-white die has no frame');
  const halo = await page.$eval('.pc-die b', (e) => getComputedStyle(e).textShadow);
  ok(halo && halo !== 'none', 'the number on the die has no halo: ' + halo);
  const dieInk = await page.$eval('.pc-die b', (e) => getComputedStyle(e).color);
  const dl =
    (dieInk.match(/\d+/g) || [])
      .slice(0, 3)
      .map(Number)
      .reduce((a, b) => a + b, 0) / 3;
  ok(dl < 90, 'in black-and-white the number on the die is white on white: ' + dieInk);
  /* The caption sits at the card's bottom edge. In black-and-white the block
     is pinned to the top, and it used to hang wherever the rule ended - a
     different height on every card. */
  await d.open('#/print/q1-q313-voa2_a3');
  await bw();
  await d.settle();
  const feet = await page.$$eval('.pcard:not(.blank)', (e) =>
    e.map(
      (c) =>
        c.getBoundingClientRect().bottom -
        c.querySelector('.pc-bottom').getBoundingClientRect().bottom
    )
  );
  ok(
    feet.every((v) => v < 24),
    'the caption is not at the bottom edge: ' + feet.map((v) => v.toFixed(0)).join(', ')
  );

  /* A held grip in black-and-white used to paint almost black, with a dark
     outline round it - the fingers on the mark disappeared. In the design the
     fill is mid-grey, the outline light, and the cuts between the fingers
     read. */
  await d.open('#/print/w51');
  await bw();
  await d.settle();
  const bwBurden = await page.$eval('.pc-burden img', (e) => e.getAttribute('src'));
  ok(/-bw\.svg$/.test(bwBurden), 'black-and-white uses a colour grip mark: ' + bwBurden);
  const bwHand = svgFile(bwBurden);
  const ink = (h) =>
    parseInt(h.slice(1, 3), 16) + parseInt(h.slice(3, 5), 16) + parseInt(h.slice(5, 7), 16);
  const fills = (bwHand.match(/fill="#[0-9a-fA-F]{6}"/g) || []).map((s) => s.slice(7, 14));
  ok(
    fills.length && fills.every((f) => ink(f) > 180),
    'in black-and-white the hand is filled almost black: ' + fills.join(', ')
  );

  /* The die is the same size in both looks: the same card must not change its
     die size because it is printed without ink. */
  await d.open('#/print/q1');
  const dieColour = await page.$eval('.pc-die', (e) =>
    Math.round(e.getBoundingClientRect().width)
  );
  await bw();
  await d.settle();
  const dieBw = await page.$eval('.pc-die', (e) => Math.round(e.getBoundingClientRect().width));
  ok(
    dieColour === dieBw,
    'the die is a different size in colour vs black-and-white: ' + dieColour + ' and ' + dieBw
  );

  await colour();
  await d.settle();
  ok(await page.$('.pc-img'), 'the button did not return to the colour sheet');

  /* A magic weapon has its own frame - by picture and by colour. In
     black-and-white the picture stays: it is its own there too, and the
     general "drop -mag in black-and-white" rule - which is about the dice -
     was standing in for it with the physical frame. */
  const ribbonOf = () =>
    page.$eval('.pc-ribbon', (e) => e.getAttribute('src').replace(/^.*\//, ''));
  for (const isBw of [false, true]) {
    await d.open('#/print/q23');
    if (isBw) {
      await bw();
      await d.settle();
    }
    ok(
      (await ribbonOf()) === (isBw ? 'ribbon-mag-bw.svg' : 'ribbon-mag.svg'),
      'the magic weapon does not have its own frame: ' + (await ribbonOf())
    );
    await d.open('#/print/q1');
    if (isBw) {
      await bw();
      await d.settle();
    }
    ok(
      (await ribbonOf()) === (isBw ? 'ribbon-bw.svg' : 'ribbon.svg'),
      'the physical weapon does not have its own frame: ' + (await ribbonOf())
    );
  }
  await d.open('#/print/q1');
  await colour();
  await d.settle();

  /* The picture fills the card's whole top: nobody keeps a strip under the
     ribbon or the mark clear for it. In every capture both top corners are
     empty near-black background, so the marks sit on it and cover nothing,
     and the captions under them are light. */
  await d.open('#/print/q1-q313-w7-ci1');
  const art = await page.$$eval('.pcard:not(.blank)', (cards) =>
    cards
      .map((c) => {
        const cr = c.getBoundingClientRect();
        const a = c.querySelector('.pc-art');
        if (!a || a.style.display === 'none') return null;
        const ar = a.getBoundingClientRect(),
          i = c.querySelector('.pc-img').getBoundingClientRect();
        const box2 = c.querySelector('.pc-content');
        const line =
          box2.getBoundingClientRect().top -
          cr.top +
          parseFloat(getComputedStyle(box2).paddingTop);
        return {
          id: c.dataset.pid,
          top: ar.top - cr.top,
          wide: ar.width / cr.width,
          over: i.bottom - cr.top - line
        };
      })
      .filter(Boolean)
  );
  ok(art.length > 2, "nothing to check the card's top against");
  art.forEach((a) => {
    ok(
      Math.abs(a.top) < 2,
      a.id + ": the picture's field is not flush with the top edge: " + a.top.toFixed(1)
    );
    ok(
      a.wide > 0.98,
      a.id + ": the picture's field is not full width: " + (a.wide * 100).toFixed(0) + '%'
    );
    /* The picture does not run under the text: the item itself is there, and
       its bottom cannot be cut. */
    ok(a.over < 2, a.id + ': the picture runs under the text by ' + a.over.toFixed(0) + ' px');
  });
  const capInk = await page.$eval('.pc-shield i', (e) => getComputedStyle(e).color);
  ok(
    /255, 255, 255/.test(capInk),
    "the mark's caption over the picture is not light: " + capInk
  );
  /* And in black-and-white there is no picture, and it is dark again - over
     white. */
  await bw();
  await d.settle();
  const bwCap = await page.$eval('.pc-shield i', (e) => getComputedStyle(e).color);
  ok(
    !/255, 255, 255/.test(bwCap),
    "in black-and-white the mark's caption is white on white: " + bwCap
  );
  await d.open('#/print/q1');
  await colour();
  await d.settle();

  /* ---------- art edge at the cut line ----------
     The picture is square and narrower than the card, so a margin remains on
     either side of it, and the picture's own edges fade into that margin.
     While the margin was one flat near-black colour everywhere the geometry
     all lined up, but pictures with a light background - the knife, the
     sceptre, the bow - had their fade run into the black, and a dark band
     stood along the cut line. Neither the markup nor the sizes see it: it
     exists only in colour. So the sheet is captured and taken apart pixel by
     pixel.

     The condition itself is not "no band" (its width cannot be measured) but
     "the colour at the cut is taken from the picture": across nine different
     cards it has to differ. With a flat fill it was the same on all of them
     to within half a point. */
  {
    console.log('art edge at the cut line');
    const dpr = 2; // at one pixel the noise eats the difference
    await page.setViewport({ width: 1180, height: 950, deviceScaleFactor: dpr });
    /* Nine cards with different picture backgrounds: from near-black (ci19)
       to a light studio shot (ci1, q23). */
    await d.open('#/print/ci1-q23-w2-w3-ci19-f7-w1-di3-w65');
    await d.settle();
    const spots = await page.$$eval('.pcard:not(.blank)', (cards) =>
      cards
        .map((c) => {
          const a = c.querySelector('.pc-art'),
            i = c.querySelector('.pc-img');
          if (!a || !i) return null;
          const ar = a.getBoundingClientRect(),
            ir = i.getBoundingClientRect();
          /* The upper half of the picture: below it the fade into the white
             margin begins. */
          return {
            id: c.dataset.pid,
            left: ar.left,
            right: ar.right,
            top: ir.top + ir.height * 0.1,
            bot: ir.top + ir.height * 0.6
          };
        })
        .filter(Boolean)
    );
    ok(spots.length === 9, 'nothing to check the art edge against: ' + spots.length);
    const shot = readPNG(await page.screenshot({ fullPage: true }));
    const edges = [];
    spots.forEach((s) => {
      const y0 = Math.round(s.top * dpr),
        y1 = Math.round(s.bot * dpr);
      const x0 = Math.round(s.left * dpr),
        x1 = Math.round(s.right * dpr);
      const band = (at) => {
        let sum = 0,
          n = 0;
        for (let y = y0; y < y1; y++)
          for (let k = 0; k < 3; k++) {
            sum += shot.lum(at(k), y);
            n++;
          }
        return sum / n;
      };
      edges.push(
        band((k) => x0 + 1 + k),
        band((k) => x1 - 2 - k)
      );
    });
    const lo = Math.min.apply(null, edges),
      hi = Math.max.apply(null, edges);
    ok(
      hi - lo > 8,
      'the colour at the cut line is the same on every card (' +
        lo.toFixed(1) +
        '..' +
        hi.toFixed(1) +
        ') - meaning it comes from the fill, not the picture'
    );
    /* And light pictures read noticeably lighter than the near-black margin
       that used to stand in for them: the band is gone there, the picture
       reaches all the way to the cut. */
    ok(edges.filter((v) => v > 14).length >= 3, 'no light card has its picture reach the cut');
    /* The backing is the same file as the picture itself: otherwise it has
       its own colour and the seam comes back, just somewhere else. */
    const same = await page.$$eval('.pcard:not(.blank)', (cards) =>
      cards.every((c) => {
        const b = c.querySelector('.pc-back'),
          i = c.querySelector('.pc-img');
        return !i || (b && b.getAttribute('src') === i.getAttribute('src'));
      })
    );
    ok(same, 'the backing under the picture is not the same file as the picture');
    await page.setViewport({ width: 1180, height: 950 });
  }

  /* ---------- design measurements ----------
     The card in the design is 344x482, and everything on it sits by its own
     numbers. Checked in design units, not pixels: the card is one size on
     screen and another on paper, but the shares are the same. A 1.5-point
     tolerance is for the cut border, which the design has none of, and for
     rounding. */
  console.log('measurements against the design');
  const SPEC = {
    'tier ribbon left': ['.pc-tier', 'left', 24],
    'tier ribbon top': ['.pc-tier', 'top', 0],
    'armour mark right': ['.pc-shield', 'right', 24],
    'armour mark top': ['.pc-shield', 'top', 20],
    'armour mark width': ['.pc-shield', 'width', 32],
    'burden mark right': ['.pc-burden', 'right', 24],
    'burden mark top': ['.pc-burden', 'top', 20],
    'burden mark width': ['.pc-burden', 'width', 62],
    'damage strip left': ['.pc-strip', 'left', 24],
    'damage strip height': ['.pc-strip', 'height', 48],
    'die width': ['.pc-die', 'width', 40],
    'text left': ['.pc-text', 'left', 24],
    'caption left': ['.pc-bottom', 'left', 24]
  };
  for (const isBw of [false, true]) {
    for (const id of ['q1', 'q313']) {
      await d.open('#/print/' + id);
      if (isBw) {
        await bw();
        await d.settle();
      }
      const off = await page.evaluate((spec) => {
        const c = document.querySelector('.pcard'),
          cr = c.getBoundingClientRect();
        const k = 344 / cr.width,
          out = [];
        for (const name in spec) {
          const [sel, what, ideal] = spec[name];
          const e = c.querySelector(sel);
          if (!e) continue;
          const r = e.getBoundingClientRect();
          const v =
            what === 'left'
              ? (r.left - cr.left) * k
              : what === 'right'
                ? (cr.right - r.right) * k
                : what === 'top'
                  ? (r.top - cr.top) * k
                  : what === 'width'
                    ? r.width * k
                    : r.height * k;
          if (Math.abs(v - ideal) > 1.5)
            out.push(name + ': ' + v.toFixed(1) + ' instead of ' + ideal);
        }
        return out;
      }, SPEC);
      ok(
        !off.length,
        (isBw ? 'bw ' : 'colour ') + id + ' diverges from the design: ' + off.join('; ')
      );
    }
  }
  await d.open('#/print/q1');
  await colour();
  await d.settle();

  /* ---------- long text shrinks ----------
     An artifact's description runs many times longer than a potion's, and
     the space is the same one. */
  console.log('long text shrinks');
  await d.open(
    '#/print/voa2_a3-voa2_a1-voa2_c4-voa2_c3-voa2_t4e-voa2_t4d-voa2_c1-voa2_a6-di11'
  );
  const over = await page.$$eval('.pc-text', (e) =>
    e.map((x) => x.scrollHeight - x.clientHeight)
  );
  ok(
    over.every((v) => v <= 1),
    'long text spilled off the card: ' + over.join(',')
  );
  /* The fit hands over space rule by rule: font, then padding, then the
     picture itself. On this Windows host, 2026-09-16, this nine-card set
     never pushes the ladder past the font step - measured directly against
     the live app's own `index.html` on the same route (since deleted, issue
     47), so it is text-metric variance between hosts, not catalogue content
     or a fit regression: ubuntu CI reaches the art rung on the same route
     (this suite's `print` job, CI run 35130947774, green on `98ddf52` before
     R0c (23c00a6) existed). A local result is advisory and may legitimately fail a
     cell CI passes (`CLAUDE.md`, "Decisions taken by the repository owner").
     So this first check only pins what is true on every host - the font step
     engages - and the rung invariant right below it is what still holds
     end-to-end wherever the ladder is actually reached. */
  const shrunk = await page.$$eval(
    '.pc-text',
    (e) => e.filter((x) => x.style.fontSize !== '').length
  );
  ok(shrunk > 0, 'no long card shrank its text');

  /* The rung invariant, host-independent: the padding step only ever runs
     after the font step has already failed to fit, and the art step only
     ever runs after the padding step has bottomed out - so wherever a card's
     `--pcpad` sits at its own floor, some card's picture must be hidden.
     Vacuously true when the floor is never reached (this host, above);
     the real check wherever it is (ubuntu CI, run 35130947774). Read as
     computed style, not `eachAt`'s inline-only view: the floor is a written
     value, but "at the floor" has to be compared against the actual ladder
     constant, not just "is something set". */
  const floors = await page.$$eval('.pcard:not(.blank)', (cards) =>
    cards.map((c) => {
      const box = c.querySelector('.pc-content');
      const art = c.querySelector('.pc-art');
      const isBw = c.classList.contains('bw');
      const padStr = box ? box.style.getPropertyValue('--pcpad') : '';
      const pad = padStr ? parseFloat(padStr) : null;
      const floor = isBw ? 2.8 : 8;
      return {
        atFloor: pad !== null && pad <= floor + 0.05,
        artHidden: !art || art.style.display === 'none'
      };
    })
  );
  ok(
    !floors.some((c) => c.atFloor) || floors.some((c) => c.artHidden),
    'the fit reached the padding floor, but no card hid its picture'
  );

  /* The picture either takes a visible band or is gone entirely. There must
     be no middle: the white block is pinned to the card's bottom, and a long
     rule used to leave a grey sliver of picture over the name - on paper that
     reads as dirt. */
  const slivers = await page.$$eval('.pcard', (e) =>
    e
      .map((c) => {
        const art = c.querySelector('.pc-art'),
          box2 = c.querySelector('.pc-content');
        if (!art || !box2 || art.style.display === 'none') return 0;
        const pad = parseFloat(getComputedStyle(box2).paddingTop);
        return ((box2.offsetTop + pad - art.offsetTop) / c.clientWidth) * 100;
      })
      .filter((v) => v > 0 && v < 20)
  );
  ok(
    !slivers.length,
    'a sliver of picture remains above the name: ' + slivers.map((v) => v.toFixed(1)).join(', ')
  );

  /* Print replaces the page it came from: with no "back" button there was
     nowhere to return to except browser history. */
  console.log('the way back');
  await d.open('#/tables/core_item');
  await page.click('.rows .row .selbox input');
  await d.settle();
  await page.click('.selbarwrap a[href^="#/print/"]');
  await d.settle();
  ok(await d.has('Назад'), 'there is no way back from print');
  await d.click('Назад');
  ok(
    /#\/tables\/core_item/.test(await d.hash()),
    'the back button did not return to where it came from: ' + (await d.hash())
  );

  /* ---------- entry points ----------
     Three places: the item card, a list, and the selection bar in a table. */
  console.log('entry points');
  await d.open('#/i/q1');
  ok(
    (await page.$eval('a[href^="#/print/"]', (e) => e.getAttribute('href'))) === '#/print/q1',
    'the item page does not print itself'
  );
  /* And it stands beside "add to list": both take the item off the page - to
     a list or onto paper - while copying leaves it in the clipboard. */
  ok(
    await page.$('.card.full .cardpick a[href^="#/print/"]'),
    'the print button is not beside "add to list"'
  );
  ok(
    !(await page.$('.card.full .card-acts a[href^="#/print/"]')),
    'the print button remained among the copy buttons'
  );

  await d.open('#/tables/core_item');
  await page.click('.rows .row .selbox input');
  await d.settle();
  const acts = await page.$$eval('.selbarwrap .selacts > *', (e) =>
    e.map((x) => (x.className || '') + '|' + x.tagName)
  );
  ok(
    /seldrop/.test(acts[0] || '') && /A$/.test(acts[1] || ''),
    'in the selection bar, print is not right after "add to list": ' + acts.join(' ')
  );
  const sel = await page.$eval('.selbarwrap a[href^="#/print/"]', (e) =>
    e.getAttribute('href')
  );
  ok(/^#\/print\/\w+$/.test(sel), 'the selection bar does not print: ' + sel);
  /* Print is a link, and ordinary buttons stand beside it. The rule that
     strips the underline sat only on the card's own actions, and here it
     arrived underlined - one button in the row unlike the rest. */
  ok(
    (await page.$eval('.selbarwrap a.btn', (e) => getComputedStyle(e).textDecorationLine)) ===
      'none',
    'the print button is underlined, and its neighbours are not'
  );

  await d.seed({
    'dhloot.lists.v2': JSON.stringify([
      { id: 'p', name: 'Печать', ids: ['ci1', 'q1'], created: 1 },
      { id: 'p2', name: 'Счёт', ids: ['ci1', 'q1'], created: 2, meta: { ci1: { qty: 3 } } }
    ])
  });
  await d.open('#/lists/p');
  ok(
    (await page.$eval('.card-acts a[href^="#/print/"]', (e) => e.getAttribute('href'))) ===
      '#/print/ci1-q1',
    'the list does not print itself'
  );
  await d.open('#/lists/p2');
  const countedHref = await page.$eval('.card-acts a[href^="#/print/"]', (e) =>
    e.getAttribute('href')
  );
  ok(
    countedHref === '#/print/ci1*3-q1',
    'the list print link does not carry the count: ' + countedHref
  );

  /* Garbage in the address must not drop the page - only say there is
     nothing to print. */
  await d.open('#/print/nosuchid');
  ok(!(await page.$('.psheet')), 'a made-up address assembled a sheet');
  ok(
    /\S/.test(await page.$eval('.page-h', (e) => e.textContent)),
    'the empty print page has no heading'
  );

  /* ---------- the sheet, in counts (`sheetCounts`) ----------
     `renderPrint`'s own arithmetic, off six counts rather than pixels - the
     fast, always-on half of what a print state checks. Every number below is
     computed from each state's own id count, not copied as a constant: a
     future ninth PRINT_CARD_STATES entry inherits the check for free. */
  console.log('the sheet, in counts');
  for (const s of PRINT_CARD_STATES) {
    await d.open(s.route);
    if (s.bw) {
      await bw();
      await d.settle();
    }
    const counts = {
      sheets: await d.count('.psheet'),
      cards: await d.count('.pcard'),
      blanks: await d.count('.pcard.blank'),
      breaks: await d.count('.psheet[data-next]'),
      bw: await d.count('.psheet.bw'),
      warn: await d.count('.printnote.warnnote')
    };
    const printed = Math.min(s.n, 180);
    const sheets = Math.ceil(printed / 9);
    ok(counts.sheets === sheets, s.label + ': sheets are not ' + sheets + ': ' + counts.sheets);
    ok(
      counts.cards === sheets * 9,
      s.label + ': slots are not ' + sheets * 9 + ': ' + counts.cards
    );
    ok(
      counts.blanks === sheets * 9 - printed,
      s.label + ': blank slots are not ' + (sheets * 9 - printed) + ': ' + counts.blanks
    );
    ok(
      counts.breaks === sheets - 1,
      s.label + ': page breaks are not ' + (sheets - 1) + ': ' + counts.breaks
    );
    ok(
      counts.bw === (s.bw ? sheets : 0),
      s.label + ': .psheet.bw count did not match: ' + counts.bw
    );
    ok(
      counts.warn === (s.n > 180 ? 1 : 0),
      s.label + ': the truncation warning did not match: ' + counts.warn
    );
  }

  /* ---------- the fit, as the numbers it wrote (`cardFit`) ----------
     What `fitPrintCards` actually wrote onto each card - the only instrument
     that reads the *decision*, not its pixel consequence. Per width, unlike
     the legacy suite's single 1180: the card's own container query makes its
     size worth re-checking at every width even though the card is a fixed
     63 mm regardless of the viewport around it. `.pc-art` renders only in
     colour (`{#if !bw}` in `PrintCard.svelte`), and `.pc-head` only in
     black-and-white (`{#if bw}`) - so their counts flip with `s.bw` rather
     than both landing on `printed`.
     Run twice: once in Russian on the shared page above, once in
     English on a second page opened `lang: 'en'`, over the same eight
     card-drawing states and all three widths - the one surface where a
     longer or shorter word can change what the fitting ladder decides.
     `sheetCounts` and `printMedia` below are driven in Russian only: sheet
     counts and the print-media rules are arithmetic and CSS, neither of
     which depends on text length in either language. */
  console.log('card fit, in numbers');
  async function cardFit(d2, bwFn, colourFn, langTag) {
    for (const width of WIDTHS) {
      await d2.viewport(width.w, width.h);
      for (const s of PRINT_CARD_STATES) {
        await d2.open(s.route);
        if (s.bw) {
          await bwFn();
          await d2.settle();
        }
        const printed = Math.min(s.n, 180);
        const tag = s.label + ' @ ' + width.w + langTag + ': ';

        const text = await d2.eachAt('.pcard:not(.blank) .pc-text', ['font-size']);
        ok(
          text.length === printed,
          tag + 'the count of cards with text did not match: ' + text.length
        );
        text.forEach((t) => {
          if (!t.style['font-size']) return;
          const v = parseFloat(t.style['font-size']);
          /* The text ladder's own floor (PrintCard.svelte's second `while (tight()
             && pct > 2.6)`), not the strip box's 2.2 - the two ladders are
             separate and this one never goes lower. */
          ok(
            v >= 2.6 && v <= 3.5,
            tag + 'text size is off the ladder: ' + t.style['font-size']
          );
        });

        const box2 = await d2.eachAt('.pcard:not(.blank) .pc-content', ['--pcpad']);
        ok(
          box2.length === printed,
          tag + 'the count of cards with padding did not match: ' + box2.length
        );
        box2.forEach((b) => {
          if (!b.style['--pcpad']) return;
          const v = parseFloat(b.style['--pcpad']);
          /* The floor is 2.8, not 3: `let pad = bw ? 5.8 : 23; while (tight() &&
             pad > (bw ? 3 : 8)) pad -= 1.5;` steps 5.8 -> 4.3 -> 2.8 in
             black-and-white, one step past the loop's own `> 3` guard -
             `printPage.test.ts` pins the same 2.8 floor. */
          ok(v >= 2.8 && v <= 23, tag + 'padding is off the ladder: ' + b.style['--pcpad']);
        });

        const art = await d2.eachAt('.pc-art', ['height', '--artw', 'display']);
        ok(
          art.length === (s.bw ? 0 : printed),
          tag + 'the picture count does not match colour mode: ' + art.length
        );
        art.forEach((a) => {
          ok(
            a.style.display === '' || a.style.display === 'none',
            tag + "the picture's display is neither empty nor none: " + a.style.display
          );
        });

        const strip = await d2.eachAt('.pc-strip .pc-box b', ['font-size']);
        strip.forEach((v) => {
          if (!v.style['font-size']) return;
          const n = parseFloat(v.style['font-size']);
          ok(
            n >= 2.2 && n <= 3,
            tag + 'strip text size is off the ladder: ' + v.style['font-size']
          );
        });

        const head = await d2.eachAt('.pc-head', []);
        if (s.bw) {
          ok(
            head.length === printed,
            tag + 'not every black-and-white card has its own pc-head: ' + head.length
          );
          ok(
            head.every((h) => h.w > 0 && h.h > 0),
            tag + 'pc-head is zero-sized'
          );
        } else {
          ok(head.length === 0, tag + 'colour mode grew a pc-head: ' + head.length);
        }
      }
    }
    await d2.viewport(1180, 950);
    await d2.open('#/print/q1');
    await colourFn();
    await d2.settle();
  }
  await cardFit(d, bw, colour, '');

  console.log('card fit, in numbers (en)');
  const {
    ctx: ctxEn,
    page: pageEn,
    d: dEn
  } = await fresh({ width: 1180, height: 950, lang: 'en' });
  const bwEn = () => dEn.click('Black and white');
  const colourEn = () => dEn.click('Colour');
  const pageErrsEn = [];
  pageEn.on('pageerror', (e) => pageErrsEn.push(e.message));
  await cardFit(dEn, bwEn, colourEn, ' en');

  /* ---------- the card's own name, capped at three lines ----------
     "Look first, then shrink": `.pc-name` stays out of `fit()`'s shrink
     ladder. The four longest names, bare and with ` ×99`, both languages,
     both layouts, are pinned at three lines so a longer name fails loudly;
     the measurement is in `docs/specs/FEATURES.md`, "Print". */
  console.log('card name no longer than three lines (P16)');
  async function nameLines(d2, page2, langTag, restoreW, restoreH) {
    await d2.viewport(1100, 900);
    try {
      for (const route of [
        '#/print/cm26-f60-hi62-ci81',
        '#/print/cm26*99-f60*99-hi62*99-ci81*99'
      ]) {
        for (const bwOn of [false, true]) {
          await d2.open(route);
          if (bwOn) {
            await d2.click(langTag === ' en' ? 'Black and white' : 'Чёрно-белая');
            await d2.settle();
          }
          for (const pid of ['cm26', 'f60', 'hi62', 'ci81']) {
            /* A block has one client rect however many lines it wraps to:
               count the distinct line tops of its contents instead. */
            const lines = await page2.$eval(`.pcard[data-pid="${pid}"] .pc-name`, (e) => {
              const r = document.createRange();
              r.selectNodeContents(e);
              const tops = [];
              for (const rect of r.getClientRects()) {
                if (!tops.some((t) => Math.abs(t - rect.top) < 2)) tops.push(rect.top);
              }
              return tops.length;
            });
            ok(
              lines <= 3,
              'name ' +
                pid +
                langTag +
                (bwOn ? ' bw' : '') +
                ' at ' +
                route +
                ' exceeded the three-line cap: ' +
                lines
            );
          }
        }
      }
    } finally {
      /* This driver is reused below at its own original width - leaving it
         at 1100 moved `printMedia`'s "main fills the whole sheet" numbers
         out from under it. */
      await d2.viewport(restoreW, restoreH);
    }
  }
  /* Both drivers are 1180x950 here - `cardFit`'s own final line sets it for
     `d`, and `dEn`'s `fresh()` call started there. */
  await nameLines(d, page, '', 1180, 950);
  await nameLines(dEn, pageEn, ' en', 1180, 950);

  /* ---------- the sheet under print media (`printMedia`) ----------
     The chrome hidden, the page unshadowed and page-broken, the print
     colours kept - `d.media('print')` is the only thing in the repository
     that emulates print media, so it always restores the medium in a
     `finally`, or leaving it on would photograph the wrong medium for
     whatever runs next. */
  console.log('the sheet under print media');
  const MEDIA_STATES = [
    { route: '#/print/ci1-q1', bw: false, label: 'ci1-q1' },
    { route: '#/print/ci1-q1', bw: true, label: 'ci1-q1 ~ bw' },
    { route: TEN, bw: false, label: 'TEN' },
    { route: '#/print/nope', bw: false, label: 'nope' }
  ];
  for (const s of MEDIA_STATES) {
    await d.open(s.route);
    if (s.bw) {
      await bw();
      await d.settle();
    }
    await d.media('print');
    try {
      const chrome = {
        header: await d.computed('header', ['display']),
        nav: await d.computed('nav', ['display']),
        footer: await d.computed('footer', ['display']),
        skip: await d.computed('a.skip', ['display']),
        /* `.printbar` does not render at all when there is nothing to print
           (`printPage.test.ts`, "nothing to print") - a route fact, not a
           print-media rule, so `nope` carries no `bar` key rather than
           reading its absence as "hidden". */
        ...(s.route === '#/print/nope'
          ? {}
          : { bar: await d.computed('.printbar', ['display']) })
      };
      /* `val && ...`, not `!val || ...`: a `null` read (the selector matched
         nothing) must fail, not pass - proven once by pointing `header` at a
         nonexistent selector and watching this loop catch it, reverted
         before commit. The old form let a renamed `.printbar` pass silently. */
      for (const [name, val] of Object.entries(chrome)) {
        ok(
          val && val.display === 'none',
          s.label + ': ' + name + ' is not hidden under print: ' + JSON.stringify(val)
        );
      }

      if (s.route === '#/print/nope') {
        ok(
          !(await d.computed('.psheet', ['display'])),
          s.label + ': an empty print page grew a sheet anyway'
        );
      } else {
        const body = await d.computed('body', ['background-color', 'color']);
        ok(
          body['background-color'] === 'rgb(255, 255, 255)',
          s.label + ': page background is not white: ' + body['background-color']
        );
        ok(body.color === 'rgb(0, 0, 0)', s.label + ': page text is not black: ' + body.color);

        const main = await d.computed('main', [
          'max-width',
          'width',
          'padding-top',
          'padding-left',
          'margin-left'
        ]);
        ok(
          main['max-width'] === 'none',
          s.label + ': main still has a width limit: ' + main['max-width']
        );
        /* `width: auto` (Shell.svelte's @media print, off style.css's
           `.wrap,#view{width:auto}`) resolves to the full viewport minus the
           stable scrollbar gutter at this suite's fixed 1180 width - measured
           live, not guessed: 1180 - 15px. */
        ok(
          main.width === '1165px',
          s.label + ": main's width is not the full sheet: " + main.width
        );
        ok(
          main['padding-top'] === '0px' &&
            main['padding-left'] === '0px' &&
            main['margin-left'] === '0px',
          s.label + ': main still has print padding: ' + JSON.stringify(main)
        );

        const psheet = await d.computed('.psheet', [
          'margin-top',
          'margin-left',
          'box-shadow',
          'break-inside'
        ]);
        ok(
          psheet['margin-top'] === '0px' && psheet['margin-left'] === '0px',
          s.label + ': the sheet still has margins: ' + JSON.stringify(psheet)
        );
        ok(
          psheet['box-shadow'] === 'none',
          s.label + ': the sheet still has a shadow: ' + psheet['box-shadow']
        );
        ok(
          psheet['break-inside'] === 'avoid',
          s.label + ': the sheet can break mid-page: ' + psheet['break-inside']
        );

        const last = await d.computed('.psheet:last-child', ['height']);
        const lastPx = parseFloat(last.height);
        ok(
          Math.abs(lastPx / MM - 297) < 0.6,
          s.label + ': the last sheet is not A4 under print: ' + (lastPx / MM).toFixed(1)
        );

        const card2 = await d.computed('.pcard', ['break-inside', 'print-color-adjust']);
        ok(
          card2['break-inside'] === 'avoid',
          s.label + ': the card can break mid-page: ' + card2['break-inside']
        );
        ok(
          card2['print-color-adjust'] === 'exact',
          s.label +
            ": the card's print colours are not preserved: " +
            card2['print-color-adjust']
        );
      }

      if (s.route === TEN) {
        const next = await d.computed('.psheet[data-next]', ['break-before']);
        ok(
          next['break-before'] === 'page',
          s.label +
            ': the second sheet does not start a new print page: ' +
            next['break-before']
        );
      }
    } finally {
      await d.media(undefined);
    }
  }

  /* ---------- an open dialog and an action toast, under print media (D20) ----------
     Neither is drawn by a print route itself, so each needs its own state:
     `RecordModal` opened from a roll result, and the "removed" undo toast
     from a seeded list. Both print rules carry `!important`/are otherwise
     unconditional, so nothing here depends on which route raised them. */
  console.log('the dialog and the action toast under print media (D20)');
  await d.open('#/roll/wondrous');
  await d.click('Страница');
  await d.media('print');
  try {
    const dialog = await d.computed('dialog', ['display']);
    ok(
      dialog && dialog.display === 'none',
      'D20: the open dialog did not hide under print: ' + JSON.stringify(dialog)
    );
  } finally {
    await d.media(undefined);
  }

  /* `seed()` registers an `evaluateOnNewDocument` handler that survives every
     later `d.open()` on this page, not only the next one - there is no
     unseed. Harmless here because everything below reads a print route,
     which shows no lists; a case appended later that opens a list-bearing
     route on this same `d` would silently inherit list `a`. If that
     ever matters, open a fresh driver for the later case rather than fight
     this one's residual seed. */
  await d.seed({
    'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'Тайник', ids: ['ci1'] }])
  });
  await d.open('#/lists/a');
  await d.click('Убрать из списка');
  await d.media('print');
  try {
    /* The assertion below depends on the action toast still being alive -
       `say()` gives an action toast 7000ms (dict.ts/AppState), and the two
       round trips above (open + click) are comfortable inside that window,
       but it is a real flake budget on a contended host, not a guaranteed
       margin. */
    const toast = await d.computed('.toast', ['display']);
    ok(
      toast && toast.display === 'none',
      'D20: the action toast did not hide under print: ' + JSON.stringify(toast)
    );
  } finally {
    await d.media(undefined);
  }

  /* ---------- the print link, copied (`copiedPrintLink`) ----------
     The set-link button, copied - only the hash is compared, the way the
     deleted parity harness's `copiedPrintLink` spec read it. Russian-only
     above, English added below - the link text changes, the hash
     it carries does not. */
  console.log('the set link, copied');
  await d.open('#/print/ci1-q1');
  await d.resetClipboard();
  await d.click('Ссылка на набор');
  const clip = await d.clipboard();
  const hash = clip.text ? clip.text.slice(clip.text.indexOf('#')) : null;
  ok(hash === '#/print/ci1-q1', 'the copied set link is wrong: ' + hash);

  console.log('the set link, copied with a count');
  await d.open('#/print/ci1*3-q1');
  await d.resetClipboard();
  await d.click('Ссылка на набор');
  const clipQty = await d.clipboard();
  const hashQty = clipQty.text ? clipQty.text.slice(clipQty.text.indexOf('#')) : null;
  ok(hashQty === '#/print/ci1*3-q1', 'the copied set link lost the count: ' + hashQty);

  console.log('the set link, copied (en)');
  await dEn.open('#/print/ci1-q1');
  await dEn.resetClipboard();
  await dEn.click('Link to this set');
  const clipEn = await dEn.clipboard();
  const hashEn = clipEn.text ? clipEn.text.slice(clipEn.text.indexOf('#')) : null;
  ok(hashEn === '#/print/ci1-q1', 'copied set link (en) is wrong: ' + hashEn);

  ok(!pageErrs.length, 'page error — ' + pageErrs.slice(0, 2).join(' | '));
  ok(!pageErrsEn.length, 'page error (en) - ' + pageErrsEn.slice(0, 2).join(' | '));

  await ctxEn.close();
  await ctx.close();
  await closeBrowser();
  console.log(
    rep.failed ? '\n' + rep.failed + ' FAILED' : '\nprint (dist/): every check passed'
  );
  process.exit(rep.failed ? 1 : 0);
})();
