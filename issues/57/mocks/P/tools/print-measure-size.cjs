/* Print audit, task 57: the fit ladder's outcome for every catalog card, in both
   languages, both layouts and both sheets, against dist-test/. Writes JSON to argv[2]. */
const W = 'E:/dev/daggerheart-loot/.claude/worktrees/57';
const fs = require('fs');
const { fresh, closeBrowser } = require(W + '/tests/app/lib.js');
const LOOT = require(W + '/data.json');

const ids = [...new Set([...Object.values(LOOT.items).flat(), ...LOOT.eq].map((x) => x.id))];
const extra = [
  { h: '00000000-0000-4000-8000-000000000461' }, // gm4 long source, no picture
  { h: '00000000-0000-4000-8000-000000000516' }, // gm4 long text
  { h: '00000000-0000-4000-8000-000000000511' }, // gm4 ember axe
  { h: '00000000-0000-4000-8000-000000000515' } // gm4 markup
];
const chunks = [];
for (let i = 0; i < ids.length; i += 176)
  chunks.push(ids.slice(i, i + 176).map((k) => ({ k })));
chunks[0] = [...extra, ...chunks[0]];

const NAMES = {
  ru: { color: 'Цветная', bw: 'Чёрно-белая', std: 'Обычная', compact: 'Компактная' },
  en: { color: 'Colour', bw: 'Black and white', std: 'Standard', compact: 'Compact' }
};

function measure() {
  const out = [];
  for (const el of document.querySelectorAll('.pcard')) {
    const cw = el.clientWidth;
    const cq = (v) => Math.round((v / cw) * 1000) / 10;
    const text = el.querySelector('.pc-text');
    const box = el.querySelector('.pc-content');
    const art = el.querySelector('.pc-art');
    const name = el.querySelector('.pc-name');
    const bottom = el.querySelector('.pc-bottom');
    const tall = (e) => !!e && e.scrollHeight > e.clientHeight + 1;
    const wide = (e) => !!e && e.scrollWidth > e.clientWidth + 1;
    const clipped = tall(text) || wide(text) || wide(name) || wide(bottom) || tall(box);
    let minPx = Infinity;
    let minWhat = '';
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      const p = n.parentElement;
      if (!p || p.offsetParent === null) continue;
      const cs = getComputedStyle(p);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const px = parseFloat(cs.fontSize);
      if (px < minPx) {
        minPx = px;
        minWhat =
          (p.className || p.tagName).toString().slice(0, 40) +
          ':' +
          n.textContent.trim().slice(0, 16);
      }
    }
    const r = document.createRange();
    let textLines = 0;
    if (text) {
      r.selectNodeContents(text);
      const tops = [];
      for (const q of r.getClientRects()) {
        if (q.width <= 0) continue;
        if (!tops.some((t) => Math.abs(t - q.top) < 2)) tops.push(q.top);
      }
      textLines = tops.length;
    }
    let nameLines = 0;
    if (name) {
      r.selectNodeContents(name);
      const tops = [];
      for (const q of r.getClientRects())
        if (!tops.some((t) => Math.abs(t - q.top) < 2)) tops.push(q.top);
      nameLines = tops.length;
    }
    const artShown = art && getComputedStyle(art).display !== 'none';
    out.push({
      id: el.getAttribute('data-pid'),
      kind: [...el.classList].find((c) => c.startsWith('pk-')) || '',
      cwPx: cw,
      textPx: text ? parseFloat(getComputedStyle(text).fontSize) : null,
      textCq: text ? cq(parseFloat(getComputedStyle(text).fontSize)) : null,
      pad: box ? box.style.getPropertyValue('--pcpad') || 'default' : null,
      artCq: artShown ? cq(art.getBoundingClientRect().height) : 0,
      artShare: artShown
        ? Math.round((art.getBoundingClientRect().height / el.clientHeight) * 100)
        : 0,
      textLines,
      nameLines,
      clipped,
      minPx,
      minWhat,
      textChars: text ? text.textContent.length : 0
    });
  }
  return out;
}

(async () => {
  const result = [];
  for (const lang of ['ru', 'en']) {
    const { ctx, page, d } = await fresh({ width: 1180, height: 950, lang });
    const N = NAMES[lang];
    for (let c = 0; c < chunks.length; c++) {
      await d.open('#/p/', { as: 'gm4', lang });
      const made = await d.fake('prints.create', chunks[c]);
      if (!made || !made.ok) throw new Error('refused ' + JSON.stringify(made));
      await d.go('#/p/' + made.id);
      for (let i = 0; i < 400; i++) {
        if ((await d.count('.pcard')) > 0) break;
        await new Promise((r) => setTimeout(r, 50));
      }
      const docLang = await page.evaluate(() => document.documentElement.lang);
      if (process.env.TEXTCQ) {
        await page.addStyleTag({
          content: '.pcard:not(.bw) .pc-text{font-size:' + process.env.TEXTCQ + 'cqw}'
        });
        await d.click(N.bw);
        await d.click(N.color);
      }
      if (process.env.FONT) {
        await require('./font-inject.cjs')(page);
        await d.click(N.bw);
        await d.click(N.color);
      }
      for (const [bw, compact] of [
        [false, false],
        [false, true]
      ]) {
        await d.click(bw ? N.bw : N.color);
        await d.click(compact ? N.compact : N.std);
        await new Promise((r) => setTimeout(r, 400));
        const cards = await page.evaluate(measure);
        result.push({ lang, docLang, bw, compact, chunk: c, cards });
        console.log(
          lang,
          docLang,
          'chunk',
          c,
          bw ? 'bw' : 'colour',
          compact ? 'compact' : 'std',
          cards.length
        );
      }
    }
    if (lang === 'ru' && !process.env.FONT) {
      const cdp = await page.target().createCDPSession();
      await cdp.send('DOM.enable');
      await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument');
      const { nodeId } = await cdp.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: '.pc-text'
      });
      const fonts = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      result.push({ fonts: fonts.fonts });
      console.log('fonts', JSON.stringify(fonts.fonts));
    }
    await ctx.close();
  }
  fs.writeFileSync(process.argv[2], JSON.stringify(result));
  await closeBrowser();
})().catch(async (e) => {
  console.error(e);
  await closeBrowser();
  process.exit(1);
});
