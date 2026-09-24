/* #/print/<ids> against dist-test/ - sheet grid, card size against the design,
 * versatile weapons, dice by class, armour, black and white, art
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
/* Six burden marks in the black-and-white head, and one loot card - the same
 * route as `tests/app/inventory.js`'s `DV_SET`. */
const DV_SET = '#/print/dve19-dve20-dve26-dve30-dve50-dve54-dv14';
const TEN = '#/print/' + Array.from({ length: 10 }, (_, i) => 'ci' + (i + 1)).join('-');
const TOO_MANY =
  '#/print/' +
  Object.values(LOOT.items)
    .flat()
    .slice(0, 181)
    .map((x) => x.id)
    .join('-');

/* The fifteen states that draw a sheet at all - `tests/parity/specs.js`'s
 * `PRINT_CARD_STATES`, minus `#/print/nope`, which draws no sheet for
 * `sheetCounts`/`cardFit` to read, plus the compact twins. `n` is each
 * route's own id count, so the sheet arithmetic below is computed, not
 * copied as a magic number: printed = min(n, 180), sheets = ceil(printed /
 * per), per = 16 on the compact sheet and 9 otherwise. */
const PRINT_CARD_STATES = [
  { route: NINE, bw: false, label: 'NINE', n: 9 },
  { route: NINE, bw: true, label: 'NINE ~ bw', n: 9 },
  { route: LONG, bw: false, label: 'LONG', n: 9 },
  { route: LONG, bw: true, label: 'LONG ~ bw', n: 9 },
  { route: '#/print/ci1-q1', bw: false, label: 'ci1-q1', n: 2 },
  { route: '#/print/ci1-q1', bw: true, label: 'ci1-q1 ~ bw', n: 2 },
  { route: TEN, bw: false, label: 'TEN', n: 10 },
  { route: TOO_MANY, bw: false, label: 'TOO_MANY', n: 181 },
  { route: NINE, bw: false, compact: true, label: 'NINE ~ compact', n: 9 },
  { route: NINE, bw: true, compact: true, label: 'NINE ~ compact bw', n: 9 },
  { route: LONG, bw: false, compact: true, label: 'LONG ~ compact', n: 9 },
  { route: LONG, bw: true, compact: true, label: 'LONG ~ compact bw', n: 9 },
  { route: '#/print/ci1-q1', bw: false, compact: true, label: 'ci1-q1 ~ compact', n: 2 },
  { route: '#/print/ci1-q1', bw: true, compact: true, label: 'ci1-q1 ~ compact bw', n: 2 },
  { route: TEN, bw: false, compact: true, label: 'TEN ~ compact', n: 10 }
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
  const compact = () => d.click('Компактная');
  /* Opens a route in the layout and sheet size a state names. `d.open`
     reloads the page, so both switches start at colour and standard. */
  const openAs = async (d2, route, isBw, isCompact, bwFn, compactFn) => {
    await d2.open(route);
    if (isCompact) {
      await compactFn();
      await d2.settle();
    }
    if (isBw) {
      await bwFn();
      await d2.settle();
    }
  };

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

  /* The opt-in compact sheet: sixteen 44x63 mm cards on the same A4, four to
     a row, with the same cut gap. */
  console.log('compact size and grid');
  await compact();
  await d.settle();
  const cBox = await page.$$eval('.pcard', (e) =>
    e.map((x) => {
      const r = x.getBoundingClientRect();
      return {
        w: r.width,
        h: r.height,
        top: r.top,
        left: r.left,
        right: r.right,
        bottom: r.bottom
      };
    })
  );
  ok(
    Math.abs(cBox[0].w / MM - 44) < 0.4,
    'compact card width is not 44 mm: ' + (cBox[0].w / MM).toFixed(2)
  );
  ok(
    Math.abs(cBox[0].h / MM - 63) < 0.4,
    'compact card height is not 63 mm: ' + (cBox[0].h / MM).toFixed(2)
  );
  ok(cBox.length === 16, 'the compact sheet does not have sixteen slots: ' + cBox.length);
  ok(
    Math.abs(cBox[3].top - cBox[0].top) < 1 && Math.abs(cBox[4].top - cBox[0].top) > 1,
    'the compact sheet does not lay four cards to a row'
  );
  const cGap = cBox[1].left - cBox[0].right;
  ok(
    cGap / MM > 1 && cGap / MM < 4,
    'compact gap is not sized for the cut: ' + (cGap / MM).toFixed(2) + ' mm'
  );
  const cSheet = await page.$eval('.psheet.compact', (e) => {
    const r = e.getBoundingClientRect();
    return { w: r.width, h: r.height, right: r.right, bottom: r.bottom };
  });
  ok(
    Math.abs(cSheet.w / MM - 210) < 0.6 && Math.abs(cSheet.h / MM - 297) < 0.6,
    'compact sheet is not A4: ' + (cSheet.w / MM).toFixed(1) + 'x' + (cSheet.h / MM).toFixed(1)
  );
  /* A swapped `14mm 19.5mm` padding still lays a 4x4 grid, about 11 mm past
     the right edge: the grid itself must stay inside the sheet box. */
  ok(
    cBox[15].right <= cSheet.right + 0.5 && cBox[15].bottom <= cSheet.bottom + 0.5,
    'the last compact card spills past the sheet: right ' +
      (cBox[15].right - cSheet.right).toFixed(2) +
      ', bottom ' +
      (cBox[15].bottom - cSheet.bottom).toFixed(2)
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
  /* Values sit between the frame's own partitions, not wherever: the
     dividers span 30.2-30.9% and 63.6-64.3% of its width, and each cell
     stops just short of one. The damage die stands outside - inside, it took space from
     the first cell. */
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
    cells[0].r >= 29 &&
      cells[0].r <= 30.2 &&
      cells[1].l >= 30.9 &&
      cells[1].l <= 32 &&
      cells[1].r >= 62.5 &&
      cells[1].r <= 63.6 &&
      cells[2].l >= 64.3 &&
      cells[2].l <= 65.5,
    "cells do not sit against the frame's dividers: " +
      cells.map((c) => c.l.toFixed(1) + '-' + c.r.toFixed(1)).join(', ')
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
  await d.open('#/print/voa4_t3d');
  const guardLast = await page.$$eval('.pc-text i', (e) => e.map((x) => x.textContent).pop());
  ok(
    guardLast === 'Убранство Святого (Комплект: Святой Щит, Святой Клинок, Святое Облачение):',
    'Saintly Guard set line label: ' + guardLast
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

  /* Each die has its own shape, and colour follows the weapon's class:
     physical gold, magical blue-violet. */
  console.log('die by class');
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
     with the damage type beside it. With no bonus the type centres in the
     cell: nothing to press it against then. */
  ok(await page.$('.pc-c1.wbonus .pc-bonus'), 'the damage bonus is outside the frame again');
  const spread = await page.$eval('.pc-c1', (e) => getComputedStyle(e).justifyContent);
  ok(spread === 'flex-start', 'the bonus is not pressed against the die: ' + spread);
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
  /* An artifact weapon reads like the loot artifact card and keeps its strip
     (docs/specs/FEATURES.md, "Print"). */
  await d.open('#/print/voa4_a3');
  ok(!(await page.$('.pc-tier')), 'the artifact weapon grew a tier ribbon');
  ok(
    /АРТЕФАКТ/i.test(await page.$eval('.pc-tag', (e) => e.textContent)),
    'the artifact weapon is not named on the tag'
  );
  const oathDice = await page.$$eval('.pc-die', (e) => e.map((x) => x.textContent.trim()));
  ok(oathDice.join() === 'd12', 'the artifact weapon die: ' + oathDice.join());
  /* A consumable artifact is named by its section, not by its kind. */
  await d.open('#/print/voa4_a2');
  ok(!(await page.$('.pc-tier')), 'the consumable artifact grew a tier ribbon');
  ok(
    /АРТЕФАКТ/i.test(await page.$eval('.pc-tag', (e) => e.textContent)),
    'the consumable artifact is not named on the tag'
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
  /* A faceted die, as in the design, and a light outline saves the digit
     from the facets. The facets were once simply removed, and the die
     stopped looking like a die. */
  const bwDie = await page.$eval('.pc-die img', (e) => e.getAttribute('src'));
  ok(/-bw\.svg$/.test(bwDie), 'black-and-white uses a colour die: ' + bwDie);
  const bwFile = svgFile(bwDie);
  ok(
    (bwFile.match(/<path/g) || []).length === 2,
    "the black-and-white die's facets are missing"
  );
  ok(/0 0 [\d.]+ [\d.]+/.test(bwFile), 'the black-and-white die has no frame');
  /* The outline is a vector stroke: Chrome prints a blurred `text-shadow` as
     a raster patch. */
  const halo = await page.$eval('.pc-die b', (e) =>
    parseFloat(getComputedStyle(e).webkitTextStrokeWidth)
  );
  ok(halo > 0, 'the number on the die has no outline: ' + halo);
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
    /* The frame and die follow the class, not the damage type: q33 is a
       magic weapon dealing either type, dve38 a physical one dealing magic
       damage, q171 a magic one whose second strip deals physical damage. */
    const frameOf = async (id) => {
      await d.open('#/print/' + id);
      if (isBw) {
        await bw();
        await d.settle();
      }
      return page.$$eval('.pcard[data-pid="' + id + '"]', (cards) =>
        cards.flatMap((c) =>
          [...c.querySelectorAll('.pc-ribbon, .pc-die img')].map((e) =>
            e.getAttribute('src').replace(/^.*\//, '')
          )
        )
      );
    };
    const tag = isBw ? 'bw: ' : 'colour: ';
    const q33 = await frameOf('q33');
    ok(
      q33.length === 2 &&
        q33.includes(isBw ? 'ribbon-mag-bw.svg' : 'ribbon-mag.svg') &&
        (isBw || /^die-d\d+-mag\.svg$/.test(q33.find((f) => f.startsWith('die')))),
      tag + 'the magic weapon dealing either type does not draw the magic frame: ' + q33
    );
    const dve38 = await frameOf('dve38');
    ok(
      dve38.length === 2 &&
        dve38.includes(isBw ? 'ribbon-bw.svg' : 'ribbon.svg') &&
        (isBw || /^die-d\d+-phy\.svg$/.test(dve38.find((f) => f.startsWith('die')))),
      tag +
        'the physical weapon dealing magic damage does not draw the physical frame: ' +
        dve38
    );
    const q171 = await frameOf('q171');
    ok(
      q171.filter((f) => f === (isBw ? 'ribbon-mag-bw.svg' : 'ribbon-mag.svg')).length === 2 &&
        (isBw || q171.filter((f) => /^die-d\d+-mag\.svg$/.test(f)).length === 2),
      tag + 'the second strip of a magic weapon does not draw the magic frame: ' + q171
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
     screen and another on paper, but the shares are the same. Measured
     inside the cut border, which the design has none of and Chrome draws
     1 px wide at any card size; the 1.5-point tolerance is for rounding. */
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
  /* Design units are shares of the card, so the compact card holds the same
     numbers at 70% - except the damage strip, which keeps a 20pt paper floor
     there (docs/DECISIONS.md, "Print card small text keeps the ribbon and
     gets one paper floor in every view"). */
  const COMPACT_SPEC = { ...SPEC };
  delete COMPACT_SPEC['damage strip height'];
  for (const isCompact of [false, true]) {
    for (const isBw of [false, true]) {
      for (const id of ['q1', 'q313']) {
        await openAs(d, '#/print/' + id, isBw, isCompact, bw, compact);
        if (isCompact && id === 'q1') {
          const stripPt = await page.$eval(
            '.pc-strip',
            (e) => e.getBoundingClientRect().height * 0.75
          );
          ok(
            Math.abs(stripPt - 20) < 0.3,
            'compact ' + (isBw ? 'bw' : 'colour') + ' q1: the strip is not 20pt: ' + stripPt
          );
        }
        const off = await page.evaluate(
          (spec) => {
            const c = document.querySelector('.pcard'),
              b = c.getBoundingClientRect();
            const cr = {
              left: b.left + c.clientLeft,
              top: b.top + c.clientTop,
              right: b.left + c.clientLeft + c.clientWidth
            };
            const k = 344 / c.clientWidth,
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
          },
          isCompact ? COMPACT_SPEC : SPEC
        );
        ok(
          !off.length,
          (isCompact ? 'compact ' : '') +
            (isBw ? 'bw ' : 'colour ') +
            id +
            ' diverges from the design: ' +
            off.join('; ')
        );
      }
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

  /* ---------- short text grows in black and white ----------
     Up to `GROW_CAP` (FEATURES.md, "Print"). Only short cards are pinned to
     the cap: where a long card lands depends on the host's font metrics. */
  console.log('short text grows in black and white');
  const grown = async () =>
    page.$$eval('.pcard:not(.blank) .pc-text', (e) =>
      e.map((x) => ({
        id: x.closest('.pcard').getAttribute('data-pid'),
        size: x.style.fontSize,
        over: x.scrollHeight - x.clientHeight
      }))
    );
  const inGrowRange = (t) => {
    if (!t.size) return true;
    const v = parseFloat(t.size);
    return v >= 2.6 && v <= 5;
  };
  for (const isCompact of [false, true]) {
    const tag = isCompact ? 'NINE compact bw: ' : 'NINE bw: ';
    await openAs(d, NINE, true, isCompact, bw, compact);
    const nineBw = await grown();
    for (const id of ['ci1', 'cc1', 'q1']) {
      const t = nineBw.find((x) => x.id === id);
      ok(
        t && parseFloat(t.size) === 5,
        tag + id + ' text did not grow to the cap: ' + (t && t.size)
      );
    }
    ok(
      nineBw.every((t) => t.over <= 1),
      tag +
        'grown text spilled off the card: ' +
        nineBw
          .filter((t) => t.over > 1)
          .map((t) => t.id + ' ' + t.over)
          .join(', ')
    );
    /* 2.6, not 3.5: `voa2_a3` is on this route and may be tight at 3.5cqw on
       another host's fonts, which sends it down the shrink ladder instead. */
    ok(
      nineBw.every(inGrowRange),
      tag +
        'a text size is outside 2.6..5: ' +
        nineBw.map((t) => t.id + ' ' + t.size).join(', ')
    );
  }
  await d.open(LONG);
  await bw();
  await d.settle();
  const longBw = await grown();
  ok(
    longBw.every((t) => t.over <= 1),
    'LONG bw: text spilled off the card: ' +
      longBw
        .filter((t) => t.over > 1)
        .map((t) => t.id + ' ' + t.over)
        .join(', ')
  );
  ok(
    longBw.every(inGrowRange),
    'LONG bw: a text size is outside 2.6..5: ' +
      longBw.map((t) => t.id + ' ' + t.size).join(', ')
  );
  await d.open(DV_SET);
  await bw();
  await d.settle();
  const dvBw = await grown();
  ok(
    dvBw.every((t) => t.over <= 1),
    'DV_SET bw: text spilled off the card: ' +
      dvBw
        .filter((t) => t.over > 1)
        .map((t) => t.id + ' ' + t.over)
        .join(', ')
  );
  ok(
    dvBw.every(inGrowRange),
    'DV_SET bw: a text size is outside 2.6..5: ' +
      dvBw.map((t) => t.id + ' ' + t.size).join(', ')
  );
  for (const isCompact of [false, true]) {
    const tag = isCompact ? 'NINE compact colour: ' : 'NINE colour: ';
    await openAs(d, NINE, false, isCompact, bw, compact);
    const nineColour = await grown();
    ok(
      nineColour.every((t) => !t.size || parseFloat(t.size) <= 3.5),
      tag + 'text grew above 3.5cqw: ' + nineColour.map((t) => t.id + ' ' + t.size).join(', ')
    );
    ok(
      nineColour.every((t) => t.over <= 1),
      tag +
        'text spilled off the card: ' +
        nineColour
          .filter((t) => t.over > 1)
          .map((t) => t.id + ' ' + t.over)
          .join(', ')
    );
  }
  await d.open('#/print/q1');
  await colour();
  await d.settle();

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
     `renderPrint`'s own arithmetic, off seven counts rather than pixels - the
     fast, always-on half of what a print state checks. Every number below is
     computed from each state's own id count, not copied as a constant: a
     future entry inherits the check for free. */
  console.log('the sheet, in counts');
  for (const s of PRINT_CARD_STATES) {
    await openAs(d, s.route, s.bw, s.compact, bw, compact);
    const counts = {
      sheets: await d.count('.psheet'),
      cards: await d.count('.pcard'),
      blanks: await d.count('.pcard.blank'),
      breaks: await d.count('.psheet[data-next]'),
      bw: await d.count('.psheet.bw'),
      compact: await d.count('.psheet.compact'),
      warn: await d.count('.printnote.warnnote')
    };
    const per = s.compact ? 16 : 9;
    const printed = Math.min(s.n, 180);
    const sheets = Math.ceil(printed / per);
    ok(counts.sheets === sheets, s.label + ': sheets are not ' + sheets + ': ' + counts.sheets);
    ok(
      counts.cards === sheets * per,
      s.label + ': slots are not ' + sheets * per + ': ' + counts.cards
    );
    ok(
      counts.blanks === sheets * per - printed,
      s.label + ': blank slots are not ' + (sheets * per - printed) + ': ' + counts.blanks
    );
    ok(
      counts.compact === (s.compact ? sheets : 0),
      s.label + ': .psheet.compact count did not match: ' + counts.compact
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

  /* ---------- small fields readable on paper ----------
     Every view, both languages, on the routes with the longest strip values
     and the artifact weapon. The floors and the named shortfalls are in
     docs/specs/FEATURES.md, "Print". */
  console.log('small fields readable on paper');
  const SMALL_ROUTES = [
    '#/print/dve50-di1-w51-f33-w22-di7-f23-q1-w7',
    '#/print/f44-f64-voa1_t2f-di7-w82-f77-di3-f7-q23-voa4_a3'
  ];
  async function smallFields(d2, page2, langTag, bwFn, compactFn) {
    for (const route of SMALL_ROUTES) {
      for (const isCompact of [false, true]) {
        for (const isBw of [false, true]) {
          await openAs(d2, route, isBw, isCompact, bwFn, compactFn);
          const tag =
            route.slice(8, 20) +
            (isCompact ? ' compact' : '') +
            (isBw ? ' bw' : ' colour') +
            langTag +
            ': ';
          const bad = await page2.evaluate(
            (ru, compactSheet) => {
              const out = [];
              const MM = 96 / 25.4;
              const pt = (e) => parseFloat(getComputedStyle(e).fontSize) * 0.75;
              const rects = (e) => {
                const r = document.createRange();
                r.selectNodeContents(e);
                return [...r.getClientRects()].filter((x) => x.width > 0);
              };
              const span = (e) => {
                const rs = rects(e);
                return {
                  left: Math.min(...rs.map((x) => x.left)),
                  right: Math.max(...rs.map((x) => x.right)),
                  top: Math.min(...rs.map((x) => x.top)),
                  bottom: Math.max(...rs.map((x) => x.bottom)),
                  wide: Math.max(...rs.map((x) => x.width)),
                  lines: new Set(rs.map((x) => Math.round(x.top))).size
                };
              };
              const LABEL = [
                '.pc-box small',
                '.pc-th-lab small',
                '.pc-shield i',
                '.pc-burden small',
                '.pc-tag',
                '.pc-bottom',
                ".pc-die.own[data-die='d4'] b"
              ];
              const VALUE = [
                '.pc-box b',
                '.pc-bonus',
                '.pc-die b',
                '.pc-th-box b',
                '.pc-shield b'
              ];
              for (const c of document.querySelectorAll('.pcard:not(.blank)')) {
                const id = c.dataset.pid + ' ';
                const cqw = c.clientWidth / 100;
                /* The floors: labels 4.5pt, values and numbers 5pt, the
                   tier word 4pt. The ribbon's cells set two shortfalls on
                   the compact sheet: a Russian value that is one long word,
                   and the English damage-type label beside a modifier. */
                for (const sel of LABEL) {
                  for (const e of c.querySelectorAll(sel)) {
                    const beside = !ru && compactSheet && e.matches('.pc-c1.wbonus small');
                    const floor = beside ? 3.0 : 4.5;
                    if (pt(e) < floor - 0.01)
                      out.push(id + sel + ' ' + pt(e).toFixed(2) + 'pt');
                  }
                }
                for (const sel of VALUE) {
                  for (const e of c.querySelectorAll(sel)) {
                    if (e.matches(".pc-die.own[data-die='d4'] b")) continue;
                    /* A value kept on one line may go down to the label
                       floor: a third line costs more than 0.5pt. */
                    if (e.matches('.pc-box b') && e.style.whiteSpace === 'nowrap') {
                      if (pt(e) < 4.49 || span(e).lines !== 1)
                        out.push(
                          id + 'one-line value ' + e.textContent + ' ' + pt(e).toFixed(2) + 'pt'
                        );
                      continue;
                    }
                    const word = ru && compactSheet && e.matches('.pc-box b');
                    const floor = word ? 4.1 : 5;
                    if (pt(e) < floor - 0.01)
                      out.push(id + sel + ' ' + pt(e).toFixed(2) + 'pt');
                  }
                }
                for (const e of c.querySelectorAll('.pc-tier i')) {
                  if (pt(e) < 3.99) out.push(id + 'tier word ' + pt(e).toFixed(2) + 'pt');
                }
                /* The weight scale: only the name and the tier number are
                   900. */
                const WEIGHT = {
                  '.pc-name': 900,
                  '.pc-tier b': 900,
                  '.pc-die b': 700,
                  '.pc-bonus': 700,
                  '.pc-th-box b': 700,
                  '.pc-shield b': 700,
                  '.pc-box b': 600,
                  '.pc-box small': 500,
                  '.pc-th-lab small': 500,
                  '.pc-shield i': 500,
                  '.pc-burden small': 500,
                  '.pc-tier i': 500,
                  '.pc-tag': 500,
                  '.pc-bottom': 400
                };
                for (const [sel, w] of Object.entries(WEIGHT)) {
                  for (const e of c.querySelectorAll(sel)) {
                    const got = +getComputedStyle(e).fontWeight;
                    if (got !== w) out.push(id + sel + ' weight ' + got);
                  }
                }
                /* A value has no clipping box: one cut the tops of the
                   capitals on a printed sheet. */
                for (const e of c.querySelectorAll('.pc-box b')) {
                  const s = getComputedStyle(e);
                  if (s.overflow !== 'visible' || s.textOverflow === 'ellipsis') {
                    out.push(id + 'a value clips: ' + s.overflow + ' ' + s.textOverflow);
                  }
                  /* Two lines get 1.2 leading; one line keeps 1. */
                  const n = span(e).lines;
                  const lh = parseFloat(s.lineHeight) / parseFloat(s.fontSize);
                  if (n > 2 || Math.abs(lh - (n === 2 ? 1.2 : 1)) > 0.01) {
                    out.push(
                      id + e.textContent + ' ' + n + ' lines at leading ' + lh.toFixed(2)
                    );
                  }
                  /* 2A: values as written, the damage type capitalised. */
                  const want = e.closest('.pc-c1') ? 'capitalize' : 'none';
                  if (s.textTransform !== want)
                    out.push(id + e.textContent + ' case ' + s.textTransform);
                }
                /* A gap under each label; labels stay in tracked capitals,
                   except the one beside a modifier, which the fit shrinks. */
                for (const e of c.querySelectorAll('.pc-box small')) {
                  const s = getComputedStyle(e);
                  const em = parseFloat(s.fontSize);
                  if (parseFloat(s.marginBottom) < 0.2 * em - 0.01)
                    out.push(id + e.textContent + ' label gap ' + s.marginBottom);
                  if (s.textTransform !== 'uppercase')
                    out.push(id + e.textContent + ' label case ' + s.textTransform);
                  const track = e.matches('.pc-c1.wbonus small') ? 0 : 0.06 * em;
                  if (Math.abs((parseFloat(s.letterSpacing) || 0) - track) > 0.01)
                    out.push(id + e.textContent + ' label tracking ' + s.letterSpacing);
                }
                /* Air between the die's `d` and its number, read from the
                   glyph boxes: a computed `::first-letter` style reads the
                   declared margin even with no first-letter box. */
                for (const e of c.querySelectorAll('.pc-die b')) {
                  const node = e.firstChild;
                  const box = (i) => {
                    const r = document.createRange();
                    r.setStart(node, i);
                    r.setEnd(node, i + 1);
                    return r.getBoundingClientRect();
                  };
                  const em = parseFloat(getComputedStyle(e).fontSize);
                  if (!node || node.length < 2 || box(1).left - box(0).right < 0.1 * em)
                    out.push(id + 'no gap after the die d in ' + e.textContent);
                }
                /* A blurred text-shadow prints as a raster patch; the halos
                   are vector strokes. */
                for (const e of c.querySelectorAll('*')) {
                  if (getComputedStyle(e).textShadow !== 'none') {
                    out.push(id + 'text-shadow on ' + (e.className || e.tagName));
                  }
                }
                for (const e of c.querySelectorAll('.pc-die.own b')) {
                  if (!(parseFloat(getComputedStyle(e).webkitTextStrokeWidth) > 0)) {
                    out.push(id + 'the die value has no outline');
                  }
                }
                /* The strip: each text inside its ribbon cell and its own
                   block, below the top ornament lines (y 10.4 of 47.9) and
                   above the band's bottom edge (78%). */
                const CELL = {
                  'pc-c1': [0.06, 0.296],
                  'pc-c2': [0.315, 0.63],
                  'pc-c3': [0.65, 0.98]
                };
                for (const st of c.querySelectorAll('.pc-strip')) {
                  const rib = st.querySelector('.pc-ribbon');
                  const rr = rib && rib.getBoundingClientRect();
                  if (!rr || rr.width === 0 || getComputedStyle(rib).display === 'none') {
                    out.push(id + 'the ribbon is not drawn');
                  }
                  const sr = st.getBoundingClientRect();
                  const fr = st.querySelector('.pc-frame').getBoundingClientRect();
                  const top = sr.top + sr.height * 0.218;
                  const bottom = st.querySelector('.pc-cells').getBoundingClientRect().bottom;
                  for (const t of st.querySelectorAll('.pc-box small, .pc-box b')) {
                    const cell = t.closest('.pc-c1, .pc-c2, .pc-c3');
                    const k = cell.classList.contains('pc-c1')
                      ? 'pc-c1'
                      : cell.classList.contains('pc-c2')
                        ? 'pc-c2'
                        : 'pc-c3';
                    const [l, r] = CELL[k];
                    const s = span(t);
                    const word = t.textContent.trim();
                    if (
                      s.left < fr.left + l * fr.width - 0.5 ||
                      s.right > fr.left + r * fr.width + 0.5
                    ) {
                      out.push(id + word + ' leaves its ribbon cell');
                    }
                    /* Its own block too: in the first cell a value that
                       spills left would run onto the modifier. */
                    const own = t.closest('.pc-box').getBoundingClientRect();
                    if (s.left < own.left - 0.5 || s.right > own.right + 0.5) {
                      out.push(id + word + ' leaves its block');
                    }
                    /* Vertically the line box, not the Range: a Range spans
                       the font's whole ascent, above the capitals' ink. */
                    const lb = t.getBoundingClientRect();
                    if (lb.top < top - 0.5 || lb.bottom > bottom + 0.5) {
                      out.push(id + word + ' leaves the band');
                    }
                  }
                  /* The modifier sits against the die, on its centre; each
                     label-value block is centred in the band. */
                  const die = st.querySelector('.pc-die').getBoundingClientRect();
                  const mid = (x) => (x.top + x.bottom) / 2;
                  const bo = st.querySelector('.pc-bonus');
                  if (bo) {
                    const br = bo.getBoundingClientRect();
                    if (br.left - die.right > 1.5 * cqw)
                      out.push(id + 'the modifier is off the die');
                    if (Math.abs(mid(br) - mid(die)) > 0.1 * MM) {
                      out.push(id + 'the modifier is off the die centre');
                    }
                  }
                  const band = st.querySelector('.pc-cells').getBoundingClientRect();
                  for (const b of st.querySelectorAll('.pc-box')) {
                    if (Math.abs(mid(b.getBoundingClientRect()) - mid(band)) > 0.25 * MM) {
                      out.push(id + b.textContent + ' block is off the band centre');
                    }
                  }
                  /* A value on two lines raises the strip, and the block
                     stays inside the band. */
                  const wrapped = [...st.querySelectorAll('.pc-box b')].some(
                    (v) => span(v).lines > 1
                  );
                  const base = Math.max(14 * cqw, (20 * 96) / 72);
                  if (!wrapped && Math.abs(sr.height - base) > 0.5) {
                    out.push(
                      id + 'the strip is ' + sr.height.toFixed(1) + 'px, not ' + base.toFixed(1)
                    );
                  }
                  if (wrapped) {
                    if (sr.height <= base)
                      out.push(id + 'a wrapped value did not raise the strip');
                    for (const b of st.querySelectorAll('.pc-box')) {
                      const r = b.getBoundingClientRect();
                      if (r.top < band.top - 0.5 || r.bottom > band.bottom + 0.5) {
                        out.push(id + b.textContent + ' block leaves the raised band');
                      }
                    }
                  }
                }
                /* Thresholds: diamonds 1.3mm or taller, 0.5mm clear of the
                   frame, above their caption; arrows 1.3mm wide. */
                for (const th of c.querySelectorAll('.pc-thstrip')) {
                  const f = th.getBoundingClientRect();
                  const inner = f.top + parseFloat(getComputedStyle(th).borderTopWidth);
                  const frameInk = getComputedStyle(th).borderTopColor;
                  if (c.classList.contains('bw') && frameInk !== 'rgb(0, 0, 0)') {
                    out.push(id + 'the black-and-white threshold frame is ' + frameInk);
                  }
                  for (const lab of th.querySelectorAll('.pc-th-lab')) {
                    const img = lab.querySelector('img').getBoundingClientRect();
                    const cap = lab.querySelector('small');
                    const s = span(cap);
                    const word = cap.textContent;
                    if (img.height < 1.3 * MM - 0.05)
                      out.push(id + 'diamonds ' + (img.height / MM).toFixed(2) + 'mm');
                    if (img.top - inner < 0.5 * MM)
                      out.push(id + 'diamonds touch the frame over ' + word);
                    if (img.bottom > s.top + 0.1) out.push(id + 'diamonds touch ' + word);
                    if (s.wide > lab.clientWidth + 0.5)
                      out.push(id + word + ' is wider than its cell');
                    if (s.bottom > f.bottom || img.top < f.top)
                      out.push(id + word + ' leaves the frame');
                  }
                  /* The arrow grows from the box's notch: the box's own
                     `::before`; the arrow image stays in the markup, hidden.
                     Colour outlines it (a dark `::after` inside a gold rim),
                     black and white draws it solid. */
                  for (const a of th.querySelectorAll('.pc-th-arrow')) {
                    if (getComputedStyle(a).display !== 'none')
                      out.push(id + 'the arrow image is drawn');
                  }
                  for (const b of th.querySelectorAll('.pc-th-box')) {
                    const br = b.getBoundingClientRect();
                    if (br.height <= f.height)
                      out.push(id + 'a threshold box does not overhang');
                    const o = getComputedStyle(b, '::before');
                    const w = parseFloat(o.width);
                    if (!(w >= 1.3 * MM - 0.05))
                      out.push(id + 'arrow ' + (w / MM).toFixed(2) + 'mm');
                    if (o.clipPath === 'none') out.push(id + 'the arrow is not a triangle');
                    const at = parseFloat(o.left) / br.width;
                    if (at < 0.91 || at > 0.925)
                      out.push(id + 'the arrow starts at ' + (at * 100).toFixed(1) + '%');
                    const inner = getComputedStyle(b, '::after');
                    if (c.classList.contains('bw')) {
                      if (inner.display !== 'none') out.push(id + 'a bw arrow is outlined');
                    } else if (
                      inner.display === 'none' ||
                      inner.backgroundColor !== 'rgb(24, 23, 28)'
                    ) {
                      out.push(id + 'a colour arrow has no dark inside');
                    }
                  }
                }
                /* The burden and armour labels clear their marks; the line
                   box starts above the ink, hence 0.2em. */
                for (const m of c.querySelectorAll('.pc-burden, .pc-shield')) {
                  const img = m.querySelector('img').getBoundingClientRect();
                  const lab = m.querySelector('small, i');
                  const em = parseFloat(getComputedStyle(lab).fontSize);
                  if (span(lab).top < img.bottom - 0.2 * em)
                    out.push(id + lab.textContent + ' sits on its mark');
                }
              }
              return out;
            },
            langTag === '',
            isCompact
          );
          ok(!bad.length, tag + bad.slice(0, 8).join('; '));
        }
      }
    }
    /* Vector text only: a compact black-and-white sheet prints no raster,
       and neither does a colour sheet once its pictures and the gold tag's
       gradient are hidden - Chrome can tile that gradient as small images
       (measured 2026-09-23 on this host). The sheet with pictures goes
       last, as a proof that the count sees an image. */
    if (langTag === '') {
      const images = async () => {
        const pdf = Buffer.from(await page2.pdf({ format: 'A4', printBackground: true }));
        return (pdf.toString('latin1').match(/\/Subtype\s*\/Image/g) || []).length;
      };
      await openAs(d2, SMALL_ROUTES[0], true, true, bwFn, compactFn);
      ok((await images()) === 0, 'a compact black-and-white sheet prints a raster');
      await openAs(d2, SMALL_ROUTES[0], false, true, bwFn, compactFn);
      const hide = await page2.addStyleTag({
        content:
          '.pc-art { display: none !important; } .pc-tag.on { background: none !important; }'
      });
      ok((await images()) === 0, 'a colour sheet without pictures still prints a raster');
      await hide.evaluate((e) => e.remove());
      ok((await images()) > 0, 'a colour sheet with pictures shows no image in its PDF');
    }
  }
  await smallFields(d, page, '', bw, compact);

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
     English on a second page opened `lang: 'en'`, over the same fifteen
     card-drawing states and all three widths - the one surface where a
     longer or shorter word can change what the fitting ladder decides.
     `sheetCounts` and `printMedia` below are driven in Russian only: sheet
     counts and the print-media rules are arithmetic and CSS, neither of
     which depends on text length in either language. */
  console.log('card fit, in numbers');
  async function cardFit(d2, bwFn, colourFn, compactFn, langTag) {
    for (const width of WIDTHS) {
      await d2.viewport(width.w, width.h);
      for (const s of PRINT_CARD_STATES) {
        await openAs(d2, s.route, s.bw, s.compact, bwFn, compactFn);
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
          /* The text ladder's floor is 2.6cqw, not the strip's 2.2; the top is
             3.5cqw in colour and `GROW_CAP` (5cqw) in black and white. */
          ok(
            v >= 2.6 && v <= (s.bw ? 5 : 3.5),
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
          /* The ladder starts at the computed size: 5pt is about 4.1cqw on
             the compact card. */
          ok(
            n >= 2.2 && n <= 4.1,
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
  await cardFit(d, bw, colour, compact, '');

  console.log('card fit, in numbers (en)');
  const {
    ctx: ctxEn,
    page: pageEn,
    d: dEn
  } = await fresh({ width: 1180, height: 950, lang: 'en' });
  const bwEn = () => dEn.click('Black and white');
  const colourEn = () => dEn.click('Colour');
  const compactEn = () => dEn.click('Compact');
  const pageErrsEn = [];
  pageEn.on('pageerror', (e) => pageErrsEn.push(e.message));
  await cardFit(dEn, bwEn, colourEn, compactEn, ' en');
  await smallFields(dEn, pageEn, ' en', bwEn, compactEn);

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
    { route: TEN, bw: false, compact: true, label: 'TEN ~ compact' },
    { route: '#/print/nope', bw: false, label: 'nope' }
  ];
  for (const s of MEDIA_STATES) {
    await openAs(d, s.route, s.bw, s.compact, bw, compact);
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

      if (s.route === TEN && s.compact) {
        ok(
          !(await d.computed('.psheet[data-next]', ['break-before'])),
          s.label + ': ten cards on the compact sheet started a second print page'
        );
      } else if (s.route === TEN) {
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
    rep.failed ? '\n' + rep.failed + ' FAILED' : '\nprint (dist-test/): every check passed'
  );
  process.exit(rep.failed ? 1 : 0);
})();
