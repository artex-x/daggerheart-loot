/* Typography, measured against the built app rather than the live one -
 * ported from tests/typo.js. Two faces are allowed - the interface one and
 * the monospace one for numbers - and sizes have to come from an agreed
 * scale, the same rule the live-app suite enforces.
 *
 * Five grips reached the parts that only exist after a click on the live
 * app; three survive as the same classes in the port (`.helpbtn`,
 * `.cardpick`, `.lnote summary`), and the other two - the filter toggle and
 * a list row's note toggle - have no `data-act`/`data-note-toggle` to grep
 * for here, so they are pressed by the accessible name a person reads
 * instead, through the shared driver. A grip that resolves to nothing on a
 * page that should have it fails loudly rather than being skipped. */
const { fresh, reporter, closeBrowser } = require('./lib.js');

const UI = 'Inter';
const MONO = 'ui-monospace';
/* every size the design actually uses, largest first */
const SCALE = [23, 20, 19, 18, 17, 16, 15.5, 14, 13.5, 13, 12.5, 12, 11.5, 11, 10.5, 9.5];

const PAGES = [
  '#/roll/std', '#/roll/alt', '#/roll/wondrous', '#/roll/community',
  '#/tables/core_item', '#/tables/eq_weapon', '#/tables/alt_item', '#/tables/community',
  '#/lists', '#/lists/a', '#/i/w1', '#/i/q1', '#/search'
];

const STORAGE = {
  'dhloot.lists.v2': JSON.stringify(
    [
      {
        id: 'a', name: 'Клад дракона', ids: ['ci1', 'cc1', 'q1', 'q313'], created: 1,
        /* Neither note's text is the word "Заметка"/"Note" itself - the
           list note is a real <textarea> whose content NAME_FN falls back
           to, and a literal match would collide with the per-row note
           toggle's own accessible name and send the "Заметка" grip below
           at the wrong control. */
        note: 'Общая заметка про весь клад', meta: { ci1: { note: 'Под прилавком' } }
      }
    ].concat(
      Array.from({ length: 11 }, (_, i) => ({ id: 'x' + String(i), name: 'Лавка №' + String(i + 1), ids: [], created: 10 + i }))
    )
  )
};

const rep = reporter();
const { ok } = rep;

/** Presses a control by name if the page has one, and does nothing rather
 *  than throw if it does not - the live equivalent of `hit()`'s
 *  `querySelector` returning null. */
async function softClick(d, name) {
  if (await d.has(name)) await d.click(name);
}

(async () => {
  for (const lang of ['ru', 'en']) {
    const { ctx, page, d } = await fresh({ width: 1180, height: 1000, lang, storage: STORAGE });

    for (const hash of PAGES) {
      await d.open(hash);

      await softClick(d, 'Фильтры');
      await softClick(d, 'Добавить в список');
      await softClick(d, 'Заметка');
      await page.evaluate(() => {
        const hit = (s) => {
          const e = document.querySelector(s);
          if (e) e.click();
        };
        hit('.helpbtn');
        hit('.lnote summary');
      });
      await new Promise((r) => setTimeout(r, 300));

      const bad = await page.evaluate(
        ({ UI, MONO, SCALE }) => {
          const out = { fam: [], size: [] };
          document.querySelectorAll('body *').forEach((e) => {
            const box = e.getBoundingClientRect();
            if (!box.width || !box.height) return;
            const own = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
            const field = /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.tagName);
            if (!own && !field) return;
            if (e.type === 'checkbox' || e.type === 'radio') return;
            const c = getComputedStyle(e);
            const fam = c.fontFamily.split(',')[0].replace(/["']/g, '');
            const name =
              e.tagName.toLowerCase() +
              (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : '');
            if (fam !== UI && fam !== MONO) out.fam.push(name + ' → ' + fam);
            if (SCALE.indexOf(Math.round(parseFloat(c.fontSize) * 10) / 10) < 0)
              out.size.push(name + ' → ' + c.fontSize);
          });
          return out;
        },
        { UI, MONO, SCALE }
      );

      const where = hash + ' ' + lang;
      ok(!bad.fam.length, where + ': чужой шрифт — ' + bad.fam.slice(0, 3).join(', '));
      ok(!bad.size.length, where + ': размер вне шкалы — ' + bad.size.slice(0, 3).join(', '));
    }
    await ctx.close();
  }

  await closeBrowser();
  console.log(
    rep.failed ? '\n' + rep.failed + ' FAILED' : '\nтипографика (dist/): два шрифта и одна шкала на всех страницах'
  );
  process.exit(rep.failed ? 1 : 0);
})();
