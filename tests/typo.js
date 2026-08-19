/* Typography, measured rather than eyeballed. Two faces are allowed — the
   interface one and the monospace one for numbers — and sizes have to come from
   an agreed scale. A control that falls back to the browser's own font is the
   failure this exists to catch: `font: 14px/1.5 inherit` is not valid CSS, so
   the note boxes had quietly been monospace. */
const puppeteer = require('puppeteer');
const ROOT = 'file://' + require('path').join(__dirname, '..', 'index.html');

const UI = 'Inter', MONO = 'ui-monospace';
/* every size the design actually uses, largest first */
const SCALE = [23, 20, 19, 18, 17, 16, 15.5, 14, 13.5, 13, 12.5, 12, 11.5, 11, 10.5, 9.5];

const PAGES = ['#/roll/std','#/roll/alt','#/roll/wondrous','#/roll/community',
               '#/tables/core_item','#/tables/eq_weapon','#/tables/alt_item','#/tables/community',
               '#/lists','#/lists/a','#/i/w1','#/i/q1','#/search'];

let fail = 0;
const seen = new Set();
const ok = (c, m) => { if (!c && !seen.has(m)) { seen.add(m); fail++; console.log('  FAIL ' + m); } };

(async () => {
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
  for (const lang of ['ru', 'en']) {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    page.on('pageerror', e => { fail++; console.log('  FAIL страница упала: ' + e.message); });
    await page.setViewport({ width: 1180, height: 1000 });
    await page.evaluateOnNewDocument(l => {
      localStorage.setItem('dhloot.lang.v1', l);
      localStorage.setItem('dhloot.lists.v2', JSON.stringify(
        [{ id:'a', name:'Клад дракона', ids:['ci1','cc1','q1','q313'], created:1,
           note:'Заметка', meta:{ ci1:{ note:'Под прилавком' } } }].concat(
        Array.from({ length: 11 }, (_, i) => ({ id:'x'+i, name:'Лавка №'+(i+1), ids:[], created:10+i })))));
    }, lang);

    for (const hash of PAGES) {
      await page.goto(ROOT + hash, { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 460));
      // the parts that only exist after a click get their turn too
      await page.evaluate(() => {
        const hit = s => { const e = document.querySelector(s); if (e) e.click(); };
        hit('[data-act="fOpen"]'); hit('.cardpick [data-act="menu"]');
        hit('.helpbtn'); hit('[data-note-toggle]'); hit('.lnote summary');
      });
      await new Promise(r => setTimeout(r, 300));

      const bad = await page.evaluate(({ UI, MONO, SCALE }) => {
        const out = { fam: [], size: [] };
        document.querySelectorAll('body *').forEach(e => {
          const box = e.getBoundingClientRect();
          if (!box.width || !box.height) return;
          const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
          const field = /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.tagName);
          if (!own && !field) return;
          if (e.type === 'checkbox' || e.type === 'radio') return;   // no text of their own
          const c = getComputedStyle(e);
          const fam = c.fontFamily.split(',')[0].replace(/["']/g, '');
          const name = e.tagName.toLowerCase() +
            (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : '');
          if (fam !== UI && fam !== MONO) out.fam.push(name + ' → ' + fam);
          if (SCALE.indexOf(Math.round(parseFloat(c.fontSize) * 10) / 10) < 0)
            out.size.push(name + ' → ' + c.fontSize);
        });
        return out;
      }, { UI, MONO, SCALE });

      const where = hash + ' ' + lang;
      ok(!bad.fam.length, where + ': чужой шрифт — ' + bad.fam.slice(0, 3).join(', '));
      ok(!bad.size.length, where + ': размер вне шкалы — ' + bad.size.slice(0, 3).join(', '));
    }
    await page.close();
  }
  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\nтипографика: два шрифта и одна шкала на всех страницах');
  process.exit(fail ? 1 : 0);
})();
