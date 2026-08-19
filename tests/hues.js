/* Badges that can share a screen have to be told apart by colour, not by
   reading them. Distance in Lab was the wrong measure here: steel-blue armour
   was far enough from azure "предмет" by ΔE and still read as a paler version
   of the same thing. Hue is what the eye sorts by, so hue is what is checked. */
const puppeteer = require('puppeteer');
const ROOT = 'file://' + require('path').join(__dirname, '..', 'index.html');

/* everything that can appear in one listing: loot, gear and the source tag */
const TOGETHER = ['badge item', 'badge cons', 'badge eq-weapon', 'badge eq-secondary',
                  'badge eq-armor', 'badge src'];
const MIN_HUE = 40;      // degrees between two colourful badges
const MIN_SAT = 0.12;    // below this a colour reads as grey and hue means nothing

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL ' + m); } };

const hsl = (rgb) => {
  const [r, g, b] = rgb.match(/\d+/g).slice(0, 3).map(Number).map(v => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return { h, s, l };
};
const gap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

(async () => {
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
  const page = await browser.newPage();
  page.on('pageerror', e => { fail++; console.log('  FAIL страница упала: ' + e.message); });
  await page.goto(ROOT + '#/roll/std', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 520));

  const colours = await page.evaluate((names) => {
    const probe = document.createElement('div');
    document.body.appendChild(probe);
    const out = {};
    names.forEach(function (cls) {
      const el = document.createElement('span');
      el.className = cls; el.textContent = 'X';
      probe.appendChild(el);
      out[cls] = getComputedStyle(el).color;
    });
    probe.remove();
    return out;
  }, TOGETHER);

  const info = {};
  Object.keys(colours).forEach(k => { info[k] = hsl(colours[k]); });
  Object.keys(info).forEach(k => {
    console.log('  ' + k.replace('badge ', '').padEnd(13) + colours[k].padEnd(20) +
      'H' + Math.round(info[k].h).toString().padStart(4) + '°  S' + info[k].s.toFixed(2));
  });

  const keys = Object.keys(info);
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = info[keys[i]], b = info[keys[j]];
      const na = keys[i].replace('badge ', ''), nb = keys[j].replace('badge ', '');
      // a washed-out badge is told apart by being grey, so hue is not asked of it
      if (a.s < MIN_SAT || b.s < MIN_SAT) {
        ok(Math.abs(a.s - b.s) > 0.2 || Math.abs(a.l - b.l) > 0.12,
           na + ' и ' + nb + ': оба блёклые и одной светлоты');
        continue;
      }
      ok(gap(a.h, b.h) >= MIN_HUE,
         na + ' и ' + nb + ' одного тона: ' + Math.round(gap(a.h, b.h)) + '° при минимуме ' + MIN_HUE);
    }
  }

  /* Кнопка броска на сайте одна и та же везде: золотая, с костью. На обычных
     таблицах их пять, и все пять - одно действие с разным числом костей, так
     что выделять первую нечем: бросают по редкости, а не по порядку кнопок. */
  console.log('кнопки броска одинаковы');
  const rollLook = async h => {
    await page.goto(ROOT + h, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 450));
    return page.$$eval('[data-act="roll"],[data-act="rollDuality"]', e => e.map(x => {
      const s = getComputedStyle(x);
      return { look: s.backgroundImage + '|' + s.color, die: !!x.querySelector('svg') };
    }));
  };
  const std = await rollLook('#/roll/std');
  ok(std.length >= 4, 'кнопок броска меньше четырёх: ' + std.length);
  ok(std.every(x => x.die), 'не на каждой кнопке броска есть кость');
  ok(new Set(std.map(x => x.look)).size === 1,
     'кости броска выглядят по-разному: ' + [...new Set(std.map(x => x.look))].join(' / '));
  for (const h of ['#/roll/alt', '#/roll/wondrous', '#/roll/voa']) {
    const one = await rollLook(h);
    ok(one.length === 1, h + ': кнопок броска не одна');
    ok(one[0].die, h + ': на кнопке броска нет кости');
    ok(one[0].look === std[0].look,
       h + ': кнопка броска выглядит иначе, чем на обычных таблицах');
  }

  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\nцвета ярлыков: все различимы по тону');
  process.exit(fail ? 1 : 0);
})();
