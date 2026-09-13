/* Typography, measured against the built app rather than the live one -
 * ported from tests/typo.js. Two faces are allowed - the interface one and
 * the monospace one for numbers - and sizes have to come from an agreed
 * scale, the same rule the live-app suite enforces.
 *
 * Five grips reach the parts that only exist after a click on the live app -
 * `[data-act="fOpen"]`, `.cardpick [data-act="menu"]`, `.helpbtn`,
 * `[data-note-toggle]`, `.lnote summary` there. Two of the five survive here
 * as the same raw selector (`.helpbtn`, `.lnote summary`); the other three -
 * the filter toggle, the card's add-to-list menu, and a list row's note
 * toggle - have no class the port kept, so they are pressed by the
 * accessible name a person reads instead, through the shared driver
 * (`softClick`, below).
 *
 * Both kinds used to fail silently where a page had lost the control they
 * grip - `softClick`'s `has()` guard and `hit()`'s `querySelector` both
 * no-op on nothing found, and a renamed name or class stopped checking a
 * panel without saying so (B12 nit 1). `EXPECTED` is what turns "found
 * nothing" into a failure where the grip should have resolved: a table of
 * which of the five each of the thirteen pages actually offers, read off the
 * components rather than assumed, so a page that loses one goes red instead
 * of quietly skipping it. */
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

/* Which of the five grips each page actually offers - read off the
 * components, not assumed: `FilterBar.svelte` draws nothing at all where a
 * table has no facets (`core_item`, `alt_item`), so 'filters' is only for
 * the two with some (`eq_weapon`'s equipment facets, `community`'s `comm`);
 * `AddToList.svelte`'s trigger sits on `RecordPage` alone among these pages,
 * not on a roll/tables card, which only opens it inside a modal `typo.js`
 * never presses; `.lnote`/the per-row note toggle are `ListPage.svelte`
 * only, so `#/lists` (no entries of its own) gets neither; every `PageHead`
 * caller among these routes has help text except `SearchPage`
 * (`help={null}`), and `RecordPage`/`ListPage` render no `PageHead` at all. */
const EXPECTED = {
  '#/roll/std': ['help'],
  '#/roll/alt': ['help'],
  '#/roll/wondrous': ['help'],
  '#/roll/community': ['help'],
  '#/tables/core_item': ['help'],
  '#/tables/eq_weapon': ['filters', 'help'],
  '#/tables/alt_item': ['help'],
  '#/tables/community': ['filters', 'help'],
  '#/lists': ['help'],
  '#/lists/a': ['note', 'listNote'],
  '#/i/w1': ['addToList'],
  '#/i/q1': ['addToList'],
  '#/search': []
};

/* `softClick`'s three name-based grips, in both languages this suite drives -
 * the accessible name is the dictionary's own string (`dict.ts`'s `filters`,
 * `addToList`, `note`), so it changes with `lang` the same way the rest of
 * the page does. A grip hardcoded to one language silently found nothing on
 * the other - the exact class of failure `EXPECTED` exists to catch, so this
 * table cannot itself repeat it. */
const LABELS = {
  filters: { ru: 'Фильтры', en: 'Filters' },
  addToList: { ru: 'Добавить в список', en: 'Add to list' },
  note: { ru: 'Заметка', en: 'Note' }
};

const rep = reporter();
const { ok } = rep;

/** Presses a control by name if the page has one, and reports whether it
 *  did - the live equivalent of `hit()`'s `querySelector` returning null,
 *  but reported rather than swallowed: a grip `EXPECTED` names for this page
 *  and does not find is a failure, not a skip (B12 nit 1). */
async function softClick(d, name) {
  const has = await d.has(name);
  if (has) await d.click(name);
  return has;
}

(async () => {
  for (const lang of ['ru', 'en']) {
    const { ctx, page, d } = await fresh({ width: 1180, height: 1000, lang, storage: STORAGE });

    for (const hash of PAGES) {
      await d.open(hash);

      const found = {
        filters: await softClick(d, LABELS.filters[lang]),
        addToList: await softClick(d, LABELS.addToList[lang]),
        note: await softClick(d, LABELS.note[lang])
      };
      const hit = await page.evaluate(() => {
        const press = (s) => {
          const e = document.querySelector(s);
          if (e) e.click();
          return !!e;
        };
        return { help: press('.helpbtn'), listNote: press('.lnote summary') };
      });
      Object.assign(found, hit);
      await new Promise((r) => setTimeout(r, 300));

      const where = hash + ' ' + lang;
      for (const grip of EXPECTED[hash] ?? []) {
        ok(found[grip], where + ': ожидаемый элемент управления не найден — ' + grip);
      }

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
