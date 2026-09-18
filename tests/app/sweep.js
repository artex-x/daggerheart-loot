/* Walks every page and state of the built app, in a real browser, looking
 * for what tests/audit2.js looked for against the live app - script errors,
 * sideways scroll, text clipped by its own box, controls without a name,
 * dead links, pictures that never arrived, repeated ids, and stray
 * "undefined" in the copy - plus two things audit2 never had: axe with
 * `color-contrast` on, and a focus-ring walk over a named subset.
 *
 * Ported from tests/audit2.js; not a fork of it kept in sync by hand. The
 * width is one argument, the way `run-all.js` already splits audit2 into
 * four entries - `node sweep.js 1180` runs one width alone. A trailing
 * `ru`/`en` narrows the languages too - `node sweep.js 1180 ru` runs 1180
 * alone in Russian, with the focus walk (issues/phase-8, T2: 1180 axe'd both
 * languages and ran the focus walk, which made it 1.7x its siblings; the
 * language split is what `run-all.js`'s two 1180 rows pass). No language
 * argument means both, the original shape. */
const { fresh, axe, reporter, closeBrowser } = require('./lib.js');

const argv = process.argv.slice(2);
const ONLY = argv.map(Number).filter(Boolean);
const WIDTHS = ONLY.length ? ONLY : [360, 390, 768, 1180];
const langArg = argv.find((a) => a === 'ru' || a === 'en');
const LANGS = langArg ? [langArg] : ['ru', 'en'];

const rep = reporter();
const { ok } = rep;

const TABLES = [
  'core_item', 'core_consumable', 'hnf_item', 'hnf_consumable', 'wondrous',
  'dread', 'voa', 'frames', 'community', 'alt_item', 'alt_consumable',
  'eq_weapon', 'eq_secondary', 'eq_armor'
];

/* audit2's own 41 addresses, plus the routes only tests/app/states.js
 * reaches (`#/tables` bare, `#/lists/b`, `#/i/ci1`) so the sweep's net does
 * not stop short of what the real-input layer opens. */
const PAGES = [
  ['#/roll/std', 'бросок d12'],
  ['#/roll/alt', 'альт. таблицы'],
  ['#/roll/wondrous', 'wondrous'],
  ['#/roll/dread', 'dread'],
  ['#/roll/voa', 'vault of ages'],
  ['#/roll/community', 'сообщества'],
  ['#/lists', 'списки'],
  ['#/lists/a', 'список'],
  ['#/lists/b', 'вторая сумка'],
  ['#/lists/empty', 'пустой список'],
  ['#/lists/nope', 'списка нет'],
  ['#/l/%%SHARED%%', 'чужой список'],
  ['#/l/zzzz', 'битая ссылка'],
  ['#/i/ci1', 'карточка Кольцо Тишины'],
  ['#/i/w1', 'карточка'],
  ['#/i/di1', 'карточка Dread'],
  ['#/i/q1', 'карточка снаряжения'],
  ['#/i/voa2_a6', 'карточка Vault of Ages'],
  ['#/i/voa1_t1a', 'карточка снаряжения Vault of Ages'],
  ['#/i/cc1', 'карточка сообщества'],
  ['#/i/f1', 'карточка фрейма'],
  ['#/i/nope', 'предмета нет'],
  /* The four craft-heavy worst cases craftmob.js:7 swept - the mobile craft
   * block and the dice bar overflow checks below need a page that actually
   * draws `.craft`/`.rcraft`/`.dicebar`/`.numrow`. */
  ['#/i/w65', 'карточка с крафтом (худший случай 1)'],
  ['#/i/w3', 'карточка с крафтом (худший случай 2)'],
  ['#/i/ci19', 'карточка с крафтом (худший случай 3)'],
  ['#/i/w2', 'карточка с крафтом (худший случай 4)'],
  ['#/search', 'поиск'],
  ['#/roll/core', 'старая ссылка'],
  ['#/nowhere', 'неизвестный адрес -> раздел по умолчанию'],
  ['#/tables', 'таблицы (без указания)']
]
  .concat(TABLES.map((t) => ['#/tables/' + t, 'таблица ' + t]))
  .concat([
    ['#/tables/eq_weapon/t3', 'якорь раздела'],
    ['#/tables/eq_weapon/f_tier-2_cls-mag', 'ссылка на фильтры'],
    ['#/tables/community/Seaborne', 'якорь сообщества']
  ]);

/* An A4 sheet legitimately scrolls sideways in a 360px window - the overflow
 * check would be reading the medium, not a defect - so print is checked at
 * 1180 only. */
const PRINT_ONLY_1180 = [
  ['#/print/ci1-q1', 'печать: два предмета'],
  ['#/print/nope', 'печать: пусто']
];

/* The list seed both audit2 and this sweep have always used, plus a second
 * list so #/lists/b is a real page rather than a repeat of #/lists/nope. */
const STORAGE = {
  'dhloot.lists.v2': JSON.stringify([
    {
      id: 'a', name: 'Клад дракона', ids: ['ci1', 'cc1', 'w1', 'q1', 'q313', 'cm1'], created: 1,
      note: 'Заметка про весь список', noteShow: true,
      meta: { ci1: { qty: 2, gold: 30, note: 'Под прилавком', noteShow: true } }
    },
    { id: 'b', name: 'Вторая сумка', ids: ['ci1'], created: 3 },
    { id: 'empty', name: 'Пусто', ids: [], created: 2 }
  ])
};

/* Six addresses, RU only, at 1180 alone - a round trip a stop, so this
 * alone would cost minutes if it ran everywhere. `filterOpen` presses the
 * one control that needs a click before the walk starts. */
const FOCUS_WALK = [
  { hash: '#/roll/std', label: 'бросок d12' },
  { hash: '#/tables/eq_weapon', label: 'таблица с открытой панелью фильтров', filterOpen: true },
  { hash: '#/lists', label: 'списки' },
  { hash: '#/lists/a', label: 'список' },
  { hash: '#/i/ci1', label: 'карточка' },
  { hash: '#/search', label: 'поиск' }
];

/** Tabs through every reachable control, and reads whether the one that has
 *  focus draws a visible ring - `outline` after any animation it triggered
 *  has drained. Stops once focus cycles back to the body, or after a
 *  generous cap, whichever comes first: a stray listener that keeps moving
 *  focus forward must not hang the suite.
 *
 *  Three indicators, any one is enough - the app uses all three, not just
 *  the first two this check started with: most controls draw the browser's
 *  own outline; the text fields' `:focus` rule (style.css) replaces it with
 *  a border colour change plus a gold `box-shadow` ring; `NumberField.svelte`
 *  (`.numbox input[type=text]:focus{outline:none;box-shadow:none}`, matching
 *  style.css:217 byte-for-byte) suppresses both on the input itself and
 *  raises the ring on the wrapper via `.numbox:focus-within` instead
 *  (style.css:218); and `ListPage.svelte`'s qty/gold fields
 *  (`.lrow-meta input:focus{outline:none;border-color:var(--gold)}`, matching
 *  style.css:776) show neither outline nor box-shadow at all, only a border
 *  colour swap to the app's one accent token. An element-only outline/
 *  box-shadow read misses the second and third shapes and reports a real,
 *  visible ring as absent - measured directly against `dist/` on
 *  `#/roll/std`'s custom-modifier field and `#/lists/a`'s qty/gold fields.
 *
 *  None of the three indicators is checked in isolation, because "has a
 *  box-shadow" and "has a gold border" are also true of plenty of elements
 *  that are not focused at all - `.card`, `.panel` and friends carry a
 *  permanent drop shadow, and `.chip`/`.homebtn` carry a gold border at
 *  rest. The walk therefore reads every ancestor (up to four deep) twice:
 *  once while the element holds focus, once with it blurred a moment later
 *  (settled the same way, so a transitioning box-shadow is not read
 *  mid-flight), and only counts a depth whose indicator is present focused
 *  and *absent* blurred - a ring that does not change on focus is not a
 *  focus ring, whatever else lit it up. Found by review: the first version
 *  of this check read the static case as passing on over a third of
 *  `#/roll/std`'s stops alone. */
async function focusWalk(page, where) {
  await page.evaluate(() => document.body.focus());
  const cap = await page.evaluate(
    () =>
      document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ).length + 2
  );
  /* The app's one accent colour, read off the token rather than hard-coded,
     so a border-colour-only focus style compares against what --gold
     actually resolves to in this browser. */
  const gold = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:-9999px;border:1px solid var(--gold)';
    document.body.appendChild(probe);
    const v = getComputedStyle(probe).borderTopColor;
    probe.remove();
    return v;
  });
  for (let i = 0; i < cap; i++) {
    await page.keyboard.press('Tab');
    await page.evaluate(async () => {
      const running = document.getAnimations().map((a) => a.finished.catch(() => undefined));
      await Promise.race([Promise.all(running), new Promise((r) => setTimeout(r, 300))]);
    });
    const elHandle = await page.evaluateHandle(() => document.activeElement);
    const isBody = await page.evaluate((el) => !el || el === document.body, elHandle);
    if (isBody) {
      await elHandle.dispose();
      break;
    }
    const at = await page.evaluate(
      async (el, goldColor) => {
        /* Three indicators, read separately rather than pre-collapsed into
           one boolean - a node can carry a permanent gold border (`.chip.on`,
           `.homebtn.on`) alongside a genuinely focus-driven outline, and
           OR-ing them at read time hides the outline's own true-to-false
           transition behind the border's constant true. Comparing the
           combined boolean before and after blur missed exactly this: three
           of `#/roll/std`'s stops carry both, and the outline that really
           does disappear on blur was invisible next to the border that
           never does. */
        const ring = (e) => {
          const c = getComputedStyle(e);
          return {
            outline: c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0,
            box: c.boxShadow !== 'none' && c.boxShadow !== '',
            border:
              c.borderTopStyle !== 'none' && parseFloat(c.borderTopWidth) > 0 && c.borderTopColor === goldColor
          };
        };
        const settle = async () => {
          const running = document.getAnimations().map((a) => a.finished.catch(() => undefined));
          await Promise.race([Promise.all(running), new Promise((r) => setTimeout(r, 300))]);
        };
        const nodes = [];
        for (let node = el, depth = 0; node && depth < 4; depth++, node = node.parentElement) {
          nodes.push(node);
        }
        const focused = nodes.map(ring);
        el.blur();
        await settle();
        const blurred = nodes.map(ring);
        /* Put focus back where Tab left it, so the next real Tab keypress
           advances from here rather than restarting from the body. */
        el.focus();
        const name =
          el.tagName + (typeof el.className === 'string' && el.className ? '.' + el.className.split(/\s+/)[0] : '');
        const visible = focused.some(
          (f, i) =>
            (f.outline && !blurred[i].outline) || (f.box && !blurred[i].box) || (f.border && !blurred[i].border)
        );
        return { name, visible };
      },
      elHandle,
      gold
    );
    await elHandle.dispose();
    ok(at.visible, where + ': нет видимого focus-ring на ' + at.name);
  }
}

(async () => {
  /* a payload for the "someone else's list" page, built the same way
   * audit2's own boot page does it. */
  const boot = await fresh({ width: 1180, height: 900 });
  await boot.d.open('#/roll/std');
  const shared = await boot.page.evaluate(() => {
    const b = btoa(unescape(encodeURIComponent('Чужой клад\nci1*2*30,w1,q1')));
    return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  });
  await boot.ctx.close();

  for (const width of WIDTHS) {
    for (const lang of LANGS) {
      const { ctx, page, d } = await fresh({ width, height: 900, lang, storage: STORAGE });
      const errs = [];
      page.on('pageerror', (e) => errs.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errs.push('console: ' + m.text());
      });

      const pages = width === 1180 ? PAGES.concat(PRINT_ONLY_1180) : PAGES;
      for (const [hash, label] of pages) {
        const asked = hash.replace('%%SHARED%%', shared);
        const where = label + ' @' + width + ' ' + lang;
        try {
          await d.open(asked);
        } catch (e) {
          ok(false, where + ': страница не отрисовалась - ' + e.message);
          continue;
        }
        await page.evaluate(() => window.scrollTo(0, 0));

        const rep2 = await page.evaluate((w) => {
          const out = {
            ids: [], noName: [], clipped: [], badLinks: [], undef: false, overflow: 0, craftBad: []
          };
          out.overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
          out.undef = /\bundefined\b/.test(document.body.innerText);

          const ids = {};
          document.querySelectorAll('[id]').forEach((e) => {
            ids[e.id] = (ids[e.id] || 0) + 1;
            if (ids[e.id] === 2) out.ids.push(e.id);
          });

          const named = (e) => {
            const t = (e.textContent || '').trim();
            return !!(
              t ||
              e.getAttribute('aria-label') ||
              e.getAttribute('title') ||
              e.getAttribute('aria-labelledby') ||
              e.value
            );
          };
          document.querySelectorAll('button, a[href], input, select, textarea').forEach((e) => {
            if (e.type === 'hidden' || e.closest('[hidden]')) return;
            const box = e.getBoundingClientRect();
            if (!box.width && !box.height) return;
            if (!named(e) && !e.placeholder) out.noName.push(e.tagName + '.' + e.className);
          });

          document
            .querySelectorAll(
              '.card-name a, .card-name span, .badge, .chip, .fpill, .btn, .lbl, .rnum, ' +
                '.craft, .rcraft, .dicebar, .numrow'
            )
            .forEach((e) => {
              if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible')
                out.clipped.push((e.className || e.tagName) + ': ' + e.textContent.trim().slice(0, 28));
            });

          /* craftmob.js:22-42's three extra reads on the craft block, ported
           * onto the same walk rather than a second one: a spill past either
           * edge, a caption squeezed under 60px, and a craft link under the
           * 12px tap-height floor. */
          document.querySelectorAll('.craft, .rcraft, .dicebar, .numrow').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.right > w + 1) out.craftBad.push(el.className + ' вылезает за правый край (' + Math.round(r.right) + ')');
            if (r.left < -1) out.craftBad.push(el.className + ' вылезает за левый край');
            if (r.height > 0 && r.width < 60) out.craftBad.push(el.className + ' сжат до ' + Math.round(r.width) + 'px');
          });
          document.querySelectorAll('.craft a').forEach((a) => {
            const r = a.getBoundingClientRect();
            if (r.height < 12) out.craftBad.push('ссылка крафта высотой всего ' + Math.round(r.height) + 'px');
          });

          document.querySelectorAll('a[href^="#/"]').forEach((a) => {
            const h = a.getAttribute('href').slice(2);
            const known =
              /^(roll\/(std|alt|wondrous|dread|voa|community)|tables|lists|search|print\/|i\/|l\/|lists\/)/.test(h);
            if (!known) out.badLinks.push(h);
          });
          return out;
        }, width);

        const landed = await page.evaluate(() => location.hash);
        if (/^#\/(roll\/|tables|lists$|search|l\/|i\/)/.test(asked))
          ok(
            landed === asked,
            where + ': адрес поменялся сам — просили ' + asked + ', оказались на ' + landed
          );

        ok(!errs.length, where + ': ошибка в консоли — ' + errs.slice(0, 2).join(' | '));
        errs.length = 0;
        ok(rep2.overflow <= 0, where + ': горизонтальная прокрутка на ' + rep2.overflow + 'px');
        ok(!rep2.undef, where + ': на странице напечатано undefined');
        ok(!rep2.ids.length, where + ': повторяющийся id — ' + rep2.ids.join(', '));
        ok(!rep2.noName.length, where + ': элемент без имени — ' + rep2.noName.slice(0, 3).join(', '));
        ok(!rep2.clipped.length, where + ': текст обрезан — ' + rep2.clipped.slice(0, 3).join(' | '));
        ok(!rep2.badLinks.length, where + ': ссылка в никуда — ' + rep2.badLinks.slice(0, 3).join(', '));
        ok(!rep2.craftBad.length, where + ': крафт — ' + rep2.craftBad.slice(0, 3).join(' | '));

        if (/^таблица/.test(label)) {
          const strip = await page.evaluate(() => {
            const c = document.querySelectorAll('.tablenav .chips');
            return c.length ? Math.round([...c].reduce((h, x) => h + x.getBoundingClientRect().height, 0)) : 0;
          });
          const cap = width < 500 ? 260 : width < 1000 ? 150 : 130;
          ok(strip <= cap, where + ': полоса разделов ' + strip + 'px, потолок ' + cap);
        }

        const broken = await page.evaluate(() =>
          [...document.images].filter((i) => i.complete && !i.naturalWidth).map((i) => i.getAttribute('src'))
        );
        ok(!broken.length, where + ': картинка не загрузилась — ' + broken.slice(0, 2).join(', '));

        /* axe, right here - the page is already open, so this is not an
         * extra navigation. Contrast and heading order are a function of
         * tokens and DOM order, not of which language's text occupies a
         * node - `plan.md`, "B12 planned", fallback - so at the three
         * narrow widths axe runs RU only, and 1180 alone keeps both
         * languages; a real production fix would show up in whichever
         * language reaches it first, so nothing measurable is lost. Every
         * disabled rule is named, and each one points at a DEBT.md entry -
         * a live-shared defect ported on purpose, checked against
         * index.html before it was recorded. */
        if (width === 1180 || lang === 'ru') {
          const violations = await axe(page);
          for (const v of violations) {
            ok(false, where + ': axe ' + v.id + ' (' + String(v.impact) + ') x' + String(v.nodes.length));
          }
        }
      }
      await ctx.close();
    }

    /* The focus-ring walk: six addresses, RU only, at 1180 alone - the same
     * fallback as axe's language split, for the same reason: round trips,
     * not page loads, and a stray tabindex does not appear or vanish with
     * the viewport. */
    if (width === 1180 && LANGS.includes('ru')) {
      const { ctx, page, d } = await fresh({ width, height: 900, lang: 'ru', storage: STORAGE });
      for (const { hash, label, filterOpen } of FOCUS_WALK) {
        const where = label + ' @' + width + ' ru, фокус';
        await d.open(hash);
        if (filterOpen) await d.click('Фильтры');
        await focusWalk(page, where);
      }
      await ctx.close();
    }
  }

  await closeBrowser();
  /* Names only what this run actually covered: a narrowed call (a width, or
     a width plus a language) is not "all widths and languages", and the
     completion line used to claim that regardless. */
  const scope = ONLY.length || langArg
    ? 'на ' + WIDTHS.join(', ') + ' (' + LANGS.join(', ') + ')'
    : 'на всех ширинах и языках';
  console.log(rep.failed ? '\n' + rep.failed + ' FAILED' : '\nобход страниц (dist/): чисто ' + scope);
  process.exit(rep.failed ? 1 : 0);
})();
