/* Typography, measured against the built app rather than the live one -
 * ported from tests/typo.js. Two faces are allowed - the interface one and
 * the monospace one for numbers - and sizes have to come from an agreed
 * scale, the same rule the live-app suite enforced.
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
 * panel without saying so. `EXPECTED` is what turns "found
 * nothing" into a failure where the grip should have resolved: a table of
 * which of the five each of the thirteen pages actually offers, read off the
 * components rather than assumed, so a page that loses one goes red instead
 * of quietly skipping it. */
const { fresh, reporter, closeBrowser } = require('./lib.js');

/* The family the self-hosted package declares (DESIGN.md, "The Local Font Rule"). */
const UI = 'Source Sans 3 Variable';
const MONO = 'ui-monospace';
/* The ten steps, largest first: the nine of tokens.css and the numeral 19
   (DESIGN.md, "The Ten Steps Rule"). */
const SCALE = [23, 20, 19, 18, 16, 15, 14, 13, 12, 11.5];

/* The subset each language needs first: the face whose unicode-range holds
   this range must have loaded on a page in that language. */
const FACE_RANGE = { ru: [0x0400, 0x045f], en: [0x0000, 0x00ff] };

/* The three mode toggles that draw the neutral pressed state (DESIGN.md,
   "Segmented control"), each opened where it lives. */
const SWITCHES = [
  { route: '#/roll/std', group: { ru: 'Язык', en: 'Language' } },
  { route: '#/tables/core_item', group: { ru: 'Вид', en: 'View' } },
  /* gm1's account keeps Russian, so the English pass presses EN after the open. */
  {
    route: '#/p/set-emberaxe',
    as: 'gm1',
    group: { ru: 'Печать карточек', en: 'Printing cards' }
  },
  {
    route: '#/p/set-emberaxe',
    as: 'gm1',
    group: { ru: 'Размер карты', en: 'Card size' }
  }
];

/* The account list `accountLists` makes first (`n: 1`): `uuid(8001)`. */
const LIST = '#/lists/00000000-0000-4000-8000-000000008001';

const PAGES = [
  '#/roll/std',
  '#/roll/alt',
  '#/roll/wondrous_environments',
  '#/roll/dragons_vault',
  '#/roll/arazos_artifacts',
  '#/roll/community_items',
  '#/roll/many_worlds_tavern',
  '#/tables/core_item',
  '#/tables/eq_weapon',
  '#/tables/alt_item',
  '#/tables/community_items',
  '#/tables/many_worlds_tavern',
  '#/lists',
  LIST,
  '#/i/w1',
  '#/i/q1',
  '#/search',
  '#/account'
];

/* The twelve index cards, made through the driver once a page signed in as gm4 is open.
   Neither note's text is the word "Заметка"/"Note" itself - the list note is a real
   <textarea> whose content NAME_FN falls back to, and a literal match would collide with
   the per-row note toggle's own accessible name and send the "Заметка" grip below at the
   wrong control. */
const SPECS = [
  {
    n: 1,
    name: 'Клад дракона',
    ids: ['ci1', 'cc1', 'q1', 'q313'],
    note: 'Общая заметка про весь клад',
    meta: { ci1: { note: 'Под прилавком' } }
  }
].concat(
  Array.from({ length: 11 }, (_, i) => ({ n: i + 2, name: 'Лавка №' + String(i + 1), ids: [] }))
);

/* Which of the five grips each page actually offers - read off the
 * components, not assumed: `FilterBar.svelte` draws nothing at all where a
 * table has no facets (`core_item`, `alt_item`), so 'filters' is only for
 * the three with some (`eq_weapon`'s equipment facets, `community`'s `comm`, `mwt`'s
 * `kind` and `realm`);
 * `AddToList.svelte`'s trigger sits on `RecordPage` alone among these pages,
 * not on a roll/tables card, which only opens it inside a modal `typo.js`
 * never presses; `.lnote`/the per-row note toggle are `ListPage.svelte`
 * only, so `#/lists` (no entries of its own) gets neither; every `PageHead`
 * caller among these routes has help text except `SearchPage`
 * (`help={null}`), and `RecordPage`/`ListPage`/`AccountPage` render no
 * `PageHead` at all. */
const EXPECTED = {
  '#/roll/std': ['help'],
  '#/roll/alt': ['help'],
  '#/roll/wondrous_environments': ['help'],
  '#/roll/dragons_vault': ['help'],
  '#/roll/arazos_artifacts': ['help'],
  '#/roll/community_items': ['help'],
  '#/roll/many_worlds_tavern': ['help'],
  '#/tables/core_item': ['help'],
  '#/tables/eq_weapon': ['filters', 'help'],
  '#/tables/alt_item': ['help'],
  '#/tables/community_items': ['filters', 'help'],
  '#/tables/many_worlds_tavern': ['filters', 'help'],
  '#/lists': ['help'],
  [LIST]: ['note', 'listNote'],
  '#/i/w1': ['addToList'],
  '#/i/q1': ['addToList'],
  '#/search': [],
  '#/account': []
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

/* EXPECTED and PAGES must name exactly the same set of routes - a page in
 * PAGES with no EXPECTED row used to fall through `EXPECTED[hash] ?? []` and
 * check nothing silently, and a stale EXPECTED row for a route
 * PAGES no longer visits would be dead weight nobody reads. Asserted once, at
 * start-up, both directions, so a route added to one and not the other fails
 * loudly instead of quietly checking less than it looks like it does. */
{
  const pageSet = new Set(PAGES);
  const expectedSet = new Set(Object.keys(EXPECTED));
  const missing = PAGES.filter((p) => !expectedSet.has(p));
  const extra = [...expectedSet].filter((p) => !pageSet.has(p));
  if (missing.length || extra.length) {
    throw new Error(
      'EXPECTED and PAGES diverge - ' +
        (missing.length ? 'missing from EXPECTED: ' + missing.join(', ') + '. ' : '') +
        (extra.length ? 'extra in EXPECTED: ' + extra.join(', ') + '.' : '')
    );
  }
}

/** Presses a control by name if the page has one, and reports whether it
 *  did - the live equivalent of `hit()`'s `querySelector` returning null,
 *  but reported rather than swallowed: a grip `EXPECTED` names for this page
 *  and does not find is a failure, not a skip. */
async function softClick(d, name) {
  const has = await d.has(name);
  if (has) await d.click(name);
  return has;
}

/** Returns the icon's vertical center against its label's first line box, for
 *  each button with an icon in the group of that accessible name. */
async function iconCentres(page, groupName) {
  return page.evaluate((name) => {
    const g = [...document.querySelectorAll('[role="group"]')].find(
      (e) => e.getAttribute('aria-label') === name
    );
    if (!g) return null;
    return [...g.querySelectorAll('button')]
      .filter((b) => b.querySelector('svg'))
      .map((b) => {
        const icon = b.querySelector('svg').getBoundingClientRect();
        const text = [...b.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
        const r = document.createRange();
        r.selectNodeContents(text);
        const line = r.getClientRects()[0];
        return {
          label: text.textContent.trim(),
          off: Math.abs(icon.top + icon.height / 2 - (line.top + line.height / 2))
        };
      });
  }, groupName);
}

(async () => {
  for (const lang of ['ru', 'en']) {
    const { ctx, page, d } = await fresh({ width: 1180, height: 1000, lang });
    const fonts = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'font') fonts.push(req.url());
    });

    for (const hash of PAGES) {
      if (hash === '#/lists' || hash === LIST) {
        await d.open('#/lists', { as: 'gm4', lang });
        await d.settled(hash + ' ' + lang);
        await d.accountLists(SPECS);
        if (hash === LIST) await d.go(hash);
      } else {
        await d.open(hash);
      }

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
      for (const grip of EXPECTED[hash]) {
        ok(found[grip], where + ': expected control not found — ' + grip);
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
              (typeof e.className === 'string' && e.className
                ? '.' + e.className.trim().split(/\s+/)[0]
                : '');
            if (fam !== UI && fam !== MONO) out.fam.push(name + ' → ' + fam);
            if (SCALE.indexOf(Math.round(parseFloat(c.fontSize) * 10) / 10) < 0)
              out.size.push(name + ' → ' + c.fontSize);
          });
          return out;
        },
        { UI, MONO, SCALE }
      );

      if (hash === PAGES[0]) {
        const [lo, hi] = FACE_RANGE[lang];
        const face = await page.evaluate(
          async (lo, hi) => {
            await document.fonts.ready;
            /* Chrome writes a range without leading zeros (`U+400-45F`). */
            const holds = (u) =>
              u.split(/,\s*/).some((r) => {
                const [a, b] = r.replace(/^U\+/i, '').split('-');
                return parseInt(a, 16) <= lo && parseInt(b ?? a, 16) >= hi;
              });
            const f = [...document.fonts].find(
              (x) =>
                x.family.replace(/["']/g, '') === 'Source Sans 3 Variable' &&
                x.style === 'normal' &&
                holds(x.unicodeRange)
            );
            return f ? f.status : 'absent';
          },
          lo,
          hi
        );
        ok(
          face === 'loaded',
          where + ': the face for U+' + lo.toString(16) + '-' + hi.toString(16) + ' is ' + face
        );
      }

      ok(!bad.fam.length, where + ': wrong font — ' + bad.fam.slice(0, 3).join(', '));
      ok(
        !bad.size.length,
        where + ': size outside the scale — ' + bad.size.slice(0, 3).join(', ')
      );
    }
    const here = new URL(page.url()).origin;
    const foreign = fonts.filter((u) => {
      const x = new URL(u);
      return x.origin !== here || !x.pathname.startsWith('/assets/');
    });
    ok(fonts.length > 0, lang + ': no font request seen, so the origin check proved nothing');
    ok(
      !foreign.length,
      lang + ': a font from outside /assets/ — ' + foreign.slice(0, 3).join(', ')
    );
    await ctx.close();
  }

  /* The icon and the label share one center on each neutral switch, at both widths. */
  for (const lang of ['ru', 'en']) {
    for (const width of [360, 1180]) {
      const { ctx, page, d } = await fresh({ width, height: 900, lang });
      for (const s of SWITCHES) {
        await d.open(s.route, s.as ? { as: s.as } : {});
        if (s.as && lang === 'en') {
          await d.click('EN');
          await d.addressSettled();
        }
        const where = s.route + ' ' + lang + ' ' + width;
        const got = await iconCentres(page, s.group[lang]);
        ok(
          !!got && got.length === 1,
          where + ': no pressed switch with a check in ' + s.group[lang]
        );
        for (const c of got ?? []) {
          ok(
            c.off <= 1,
            where + ': the check sits ' + c.off.toFixed(2) + ' px off «' + c.label + '»'
          );
        }
      }
      await ctx.close();
    }
  }

  await closeBrowser();
  console.log(
    rep.failed
      ? '\n' + rep.failed + ' FAILED'
      : '\ntypography (dist-test/): the self-hosted face, two fonts and ten steps across every page'
  );
  process.exit(rep.failed ? 1 : 0);
})();
