/* Mock P (task 57): today's print card beside the proposed one, against the
 * pre-batch-1 build in C:\Users\Ignat\.dhloot\notes\57\p-build (its own server and
 * harness, never the task worktree's dist-test/).
 *
 * node mockp.cjs <mode> <face> <out>
 *   mode: current  - the build as it ships (no injection)
 *         proposed - QP.2 standard card 63.5x88.9, QP.4 bases 4.0cqw / 4.6cqw,
 *                    the tier word at the 4.5 pt label floor, an en dash list marker,
 *                    and the fit run again after the face has loaded
 *   face: today | ss3 | overpass (ss3 and overpass inject the face as the card's --ui)
 *   out:  a folder; writes <mode>-<face>-<sheet>-<layout>-<lang>.pdf and fit-<mode>-<face>.json
 * Env: MEASURE=0 skips the catalog measure, PDF=0 skips the PDFs.
 */
const fs = require('fs');
const path = require('path');
const B = 'C:/Users/Ignat/.dhloot/notes/57/p-build';
const { fresh, closeBrowser } = require(B + '/tests/app/lib.js');
const LOOT = require(B + '/data.json');
const FONTS = 'C:/Users/Ignat/.dhloot/notes/57/fonts/';

const [mode, face, OUT] = process.argv.slice(2);
if (
  !['current', 'proposed'].includes(mode) ||
  !['today', 'ss3', 'overpass'].includes(face) ||
  !OUT
)
  throw new Error('usage: node mockp.cjs <current|proposed> <today|ss3|overpass> <out>');
const BASE = { std: 4.0, compact: 4.6 };

const b64 = (f) => fs.readFileSync(f).toString('base64');
function faceCss() {
  if (face === 'today') return '';
  if (face === 'ss3') {
    const d = FONTS + 'source-sans-3/source-sans-3-';
    const R = {
      cyrillic: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
      'latin-ext':
        'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF',
      latin:
        'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
    };
    let css = '';
    for (const [sub, range] of Object.entries(R))
      for (const st of ['normal', 'italic'])
        css += `@font-face{font-family:'Mock Face';font-style:${st};font-weight:200 900;src:url(data:font/woff2;base64,${b64(d + sub + '-wght-' + st + '.woff2')}) format('woff2');unicode-range:${range}}\n`;
    return css + ".pcard{--ui:'Mock Face',sans-serif}";
  }
  const d = FONTS + 'overpass/';
  if (!fs.existsSync(d + 'Overpass[wght].ttf'))
    throw new Error(
      'Overpass files are missing in ' + d + ' (Overpass[wght].ttf, Overpass-Italic[wght].ttf)'
    );
  return (
    `@font-face{font-family:'Mock Face';font-style:normal;font-weight:100 900;src:url(data:font/ttf;base64,${b64(d + 'Overpass[wght].ttf')}) format('truetype')}\n` +
    `@font-face{font-family:'Mock Face';font-style:italic;font-weight:100 900;src:url(data:font/ttf;base64,${b64(d + 'Overpass-Italic[wght].ttf')}) format('truetype')}\n` +
    ".pcard{--ui:'Mock Face',sans-serif}"
  );
}
const PROPOSED_CSS = `
.psheet:not(.compact){padding:13.15mm 7.75mm !important;grid-template-columns:repeat(3,63.5mm) !important;grid-template-rows:repeat(3,88.9mm) !important}
.pcard .pc-tier i{font-size:max(2.6cqw,4.5pt) !important}
.pcard.bw .pc-tier i{font-size:max(2cqw,4.5pt) !important}
.pcard .pc-text ul{list-style-type:'\\2013  '}
.pcard .pc-text li::marker{color:#000}
`;
const CSS = faceCss() + (mode === 'proposed' ? PROPOSED_CSS : '');

/* PrintCard.svelte's fit(), ported for the mock at screen scale 1 and card scale 1, with the
   rules text starting from `base` instead of 3.5cqw (QP.4). */
function refitAll(bases) {
  const GROW_CAP = 5;
  for (const el of document.querySelectorAll('.pcard[data-pid]')) {
    const bw = el.classList.contains('bw');
    const base = el.closest('.psheet')?.classList.contains('compact')
      ? bases.compact
      : bases.std;
    const text = el.querySelector('.pc-text');
    const art = el.querySelector('.pc-art');
    const box = el.querySelector('.pc-content');
    const cq = (px) => (px / el.clientWidth) * 100;
    const rng = document.createRange();
    const shrink = (e, over) => {
      e.style.fontSize = '';
      const px = parseFloat(getComputedStyle(e).fontSize);
      let z = el.clientWidth > 0 && Number.isFinite(px) ? Math.round(cq(px) * 10) : 30;
      while (over() && z > 22) {
        z -= 1;
        e.style.fontSize = (z / 10).toFixed(1) + 'cqw';
      }
    };
    const lines = (v) => {
      rng.selectNodeContents(v);
      const tops = [];
      let wide = 0;
      for (const r of rng.getClientRects()) {
        if (r.width <= 0) continue;
        wide = Math.max(wide, r.width);
        if (!tops.some((t) => Math.abs(t - r.top) < 1)) tops.push(r.top);
      }
      return { wide, tops: tops.length };
    };
    for (const strip of el.querySelectorAll('.pc-strip')) {
      for (const v of strip.querySelectorAll('.pc-box b')) {
        v.style.lineHeight = '';
        v.style.whiteSpace = 'nowrap';
        v.style.fontSize = '';
        const px = parseFloat(getComputedStyle(v).fontSize);
        let z = el.clientWidth > 0 && Number.isFinite(px) ? Math.round(cq(px) * 10) : 30;
        const pt = (tenths) => (tenths / 1000) * el.clientWidth * 0.75;
        while (lines(v).wide > v.clientWidth && pt(z - 1) >= 4.5) {
          z -= 1;
          v.style.fontSize = (z / 10).toFixed(1) + 'cqw';
        }
        if (lines(v).wide > v.clientWidth) {
          v.style.whiteSpace = '';
          shrink(v, () => {
            const l = lines(v);
            return l.wide > v.clientWidth || l.tops > 2;
          });
          if (lines(v).tops === 2) v.style.lineHeight = '1.2';
        }
      }
      const lab = strip.querySelector('.pc-c1.wbonus .pc-box small');
      if (lab)
        shrink(lab, () => {
          rng.selectNodeContents(lab);
          return rng.getBoundingClientRect().width > lab.clientWidth;
        });
      strip.style.height = '';
      const band = strip.querySelector('.pc-cells');
      let tall = 0;
      for (const b of strip.querySelectorAll('.pc-box, .pc-bonus'))
        tall = Math.max(tall, b.getBoundingClientRect().height);
      if (band && tall > band.clientHeight)
        strip.style.height = (Math.ceil(cq(tall / 0.56) * 10) / 10).toFixed(1) + 'cqw';
    }
    if (!text) continue;
    if (box) box.style.removeProperty('--pcpad');
    let pct = base;
    text.style.fontSize = pct.toFixed(1) + 'cqw';
    const tight = () => text.scrollHeight > text.clientHeight + 1;
    if (bw && !tight()) {
      while (!tight() && pct < GROW_CAP - 0.05) {
        pct += 0.1;
        text.style.fontSize = pct.toFixed(1) + 'cqw';
      }
      if (tight()) {
        pct -= 0.1;
        text.style.fontSize = pct.toFixed(1) + 'cqw';
      }
    }
    while (tight() && pct > 3) {
      pct -= 0.1;
      text.style.fontSize = pct.toFixed(1) + 'cqw';
    }
    let pad = bw ? 5.8 : 23;
    while (tight() && pad > (bw ? 3 : 8)) {
      pad -= 1.5;
      if (box) box.style.setProperty('--pcpad', `${String(pad)}cqw`);
    }
    while (tight() && pct > 2.6) {
      pct -= 0.1;
      text.style.fontSize = pct.toFixed(1) + 'cqw';
    }
    if (art && box) {
      const line = cq(box.offsetTop) + pad;
      const top = cq(art.offsetTop);
      art.style.height = `${String(Math.max(0, line - top + 6))}cqw`;
      art.style.setProperty('--artw', `${String(Math.min(100, line - top - 1))}cqw`);
      art.style.display = line - top < 24 ? 'none' : '';
      /* QP.8, proposed: a colour card whose art gives way drops the blank band the art
         padding left, and fits its text again from the base in the whole card. */
      if (!bw && art.style.display === 'none' && box) {
        box.style.setProperty('--pcpad', '5.8cqw');
        pct = base;
        text.style.fontSize = pct.toFixed(1) + 'cqw';
        while (tight() && pct > 2.6) {
          pct -= 0.1;
          text.style.fontSize = pct.toFixed(1) + 'cqw';
        }
      }
    }
  }
}

function measure() {
  const out = [];
  for (const el of document.querySelectorAll('.pcard[data-pid]')) {
    const cw = el.clientWidth;
    const cq = (v) => Math.round((v / cw) * 1000) / 10;
    const text = el.querySelector('.pc-text');
    const box = el.querySelector('.pc-content');
    const art = el.querySelector('.pc-art');
    const name = el.querySelector('.pc-name');
    const bottom = el.querySelector('.pc-bottom');
    const tall = (e) => !!e && e.scrollHeight > e.clientHeight + 1;
    const wide = (e) => !!e && e.scrollWidth > e.clientWidth + 1;
    let minPx = Infinity;
    let minWhat = '';
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      const p = n.parentElement;
      if (!p || p.offsetParent === null) continue;
      const cs = getComputedStyle(p);
      if (cs.display === 'none') continue;
      const px = parseFloat(cs.fontSize);
      if (px < minPx) {
        minPx = px;
        minWhat =
          String(p.className || p.tagName).slice(0, 40) +
          ':' +
          n.textContent.trim().slice(0, 16);
      }
    }
    const r = document.createRange();
    let nameLines = 0;
    if (name) {
      r.selectNodeContents(name);
      const tops = [];
      for (const q of r.getClientRects())
        if (!tops.some((t) => Math.abs(t - q.top) < 2)) tops.push(q.top);
      nameLines = tops.length;
    }
    let pitch = null;
    if (el.getAttribute('data-pid') === 'voa2_a3' && text) {
      r.selectNodeContents(text);
      const tops = [];
      for (const q of r.getClientRects()) {
        if (q.width <= 0) continue;
        if (!tops.some((t) => Math.abs(t - q.top) < 1)) tops.push(q.top);
      }
      tops.sort((a, b) => a - b);
      pitch = tops.slice(1).map((t, i) => Math.round((t - tops[i]) * 100) / 100);
    }
    const artShown = art && getComputedStyle(art).display !== 'none';
    out.push({
      id: el.getAttribute('data-pid'),
      cwPx: cw,
      textPx: text ? parseFloat(getComputedStyle(text).fontSize) : null,
      textCq: text ? cq(parseFloat(getComputedStyle(text).fontSize)) : null,
      pad: box ? box.style.getPropertyValue('--pcpad') || 'default' : null,
      artShare: artShown
        ? Math.round((art.getBoundingClientRect().height / el.clientHeight) * 100)
        : 0,
      nameLines,
      clipped: tall(text) || wide(text) || wide(name) || wide(bottom) || tall(box),
      minPx,
      minWhat,
      pitch
    });
  }
  return out;
}

const NAMES = {
  ru: { color: 'Цветная', bw: 'Чёрно-белая', std: 'Обычная', compact: 'Компактная' },
  en: { color: 'Colour', bw: 'Black and white', std: 'Standard', compact: 'Compact' }
};
const NOPIC = { h: '00000000-0000-4000-8000-000000000461' };
const LONGHB = { h: '00000000-0000-4000-8000-000000000516' };
const k = (...ids) => ids.map((x) => ({ k: x }));
const NINE = [...k('ci1', 'cc7', 'voa2_a3', 'q1', 'w7', 'f23', 'f33', 'voa4_t2b'), NOPIC];
const SIXTEEN = [...NINE, ...k('cm26', 'voa4_a3', 'q313', 'cc1', 'di11', 'voa2_a1'), LONGHB];

async function openSet(d, page, lang, entries) {
  await d.open('#/p/', { as: 'gm4', lang });
  const made = await d.fake('prints.create', entries);
  if (!made || !made.ok) throw new Error('refused ' + JSON.stringify(made));
  await d.go('#/p/' + made.id);
  for (let i = 0; i < 400; i++) {
    if ((await d.count('.pcard[data-pid]')) > 0) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  if (CSS) await page.addStyleTag({ content: CSS });
  await page.evaluate(() => document.fonts.ready.then(() => true));
}

async function layout(d, page, N, bw, compact) {
  await d.click(bw ? N.color : N.bw);
  await d.click(bw ? N.bw : N.color);
  await d.click(compact ? N.compact : N.std);
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await new Promise((r) => setTimeout(r, 300));
  if (mode === 'proposed' || face !== 'today') {
    const bases = mode === 'proposed' ? BASE : { std: 3.5, compact: 3.5 };
    await page.evaluate(refitAll, bases);
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const result = [];
  for (const lang of ['ru', 'en']) {
    const { ctx, page, d } = await fresh({ width: 1180, height: 950, lang });
    const N = NAMES[lang];
    if (process.env.PDF !== '0') {
      for (const compact of [false, true]) {
        await openSet(d, page, lang, compact ? SIXTEEN : NINE);
        for (const bw of [false, true]) {
          await layout(d, page, N, bw, compact);
          await page.evaluate(() =>
            Promise.all(
              [...document.images].map((im) =>
                im.complete ? 0 : new Promise((r) => ((im.onload = r), (im.onerror = r)))
              )
            )
          );
          const name = `${mode}-${face}-${compact ? 'compact16' : 'std9'}-${bw ? 'bw' : 'colour'}-${lang}.pdf`;
          await page.pdf({
            path: path.join(OUT, name),
            printBackground: true,
            preferCSSPageSize: true,
            pageRanges: '1'
          });
          console.log('wrote', name);
        }
      }
    }
    if (process.env.MEASURE !== '0') {
      const ids = [
        ...new Set([...Object.values(LOOT.items).flat(), ...LOOT.eq].map((x) => x.id))
      ];
      const chunks = [];
      for (let i = 0; i < ids.length; i += 176)
        chunks.push(ids.slice(i, i + 176).map((x) => ({ k: x })));
      chunks[0] = [NOPIC, LONGHB, ...chunks[0]];
      if (process.env.NINEONLY) chunks.splice(0, chunks.length, NINE);
      for (let c = 0; c < chunks.length; c++) {
        await openSet(d, page, lang, chunks[c]);
        for (const [bw, compact] of [
          [false, false],
          [false, true],
          [true, true],
          [true, false]
        ]) {
          await layout(d, page, N, bw, compact);
          result.push({ lang, bw, compact, chunk: c, cards: await page.evaluate(measure) });
        }
        console.log(lang, 'chunk', c);
      }
    }
    await ctx.close();
  }
  if (result.length)
    fs.writeFileSync(path.join(OUT, `fit-${mode}-${face}.json`), JSON.stringify(result));
  await closeBrowser();
})().catch(async (e) => {
  console.error(e);
  await closeBrowser();
  process.exit(1);
});
