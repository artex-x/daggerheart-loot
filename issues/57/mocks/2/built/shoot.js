/* Batch 2 evidence: the shipped header at 360 and 1180 in RU and EN, and its measures.
   node issues/57/mocks/2/built/shoot.js  (after `npm run build:test`). Scratch: the
   closeout deletes it with issues/57/. */
const path = require('path');
const { fresh, closeBrowser } = require('../../../../../tests/app/lib.js');

const OUT = __dirname;
const STATES = [
  { id: 'roll-std-out', route: '#/roll/std' },
  { id: 'roll-hnf-pinned', route: '#/roll/hnf', storage: { 'dhloot.home.v1': '#/roll/hnf' } },
  { id: 'roll-voa-in', route: '#/roll/vault_of_ages', as: 'gm1' },
  { id: 'lists-ring', route: '#/lists', as: 'gm1' },
  { id: 'item-unlit', route: '#/i/ci1', as: 'gm1' },
  { id: 'mode-mwt', route: '#/roll/many_worlds_tavern' },
  { id: 'mode-community', route: '#/roll/community_items' },
  { id: 'supmenu-open', route: '#/roll/vault_of_ages', open: '.modes .sup' },
  { id: 'acctmenu-open', route: '#/roll/std', as: 'gm1', open: '.acct.in' },
  { id: 'toast-plain', route: '#/i/ci1', toast: true }
];

(async () => {
  const measures = [];
  for (const width of [360, 1180]) {
    for (const lang of ['ru', 'en']) {
      for (const s of STATES) {
        const { ctx, page, d } = await fresh({
          width,
          height: width === 360 ? 640 : 720,
          lang,
          storage: s.storage
        });
        await d.open(s.route, { as: s.as, holdToasts: !!s.toast, lang });
        await new Promise((r) => setTimeout(r, 400));
        if (s.open) await page.click(s.open);
        if (s.toast)
          await page
            .click('button[aria-label^="' + (lang === 'ru' ? 'Скопировать' : 'Copy') + '"]')
            .catch(() => d.click(lang === 'ru' ? 'Скопировать название' : 'Copy the name'));
        await new Promise((r) => setTimeout(r, 400));
        const m = await page.evaluate(() => {
          const box = (sel) => {
            const e = document.querySelector(sel);
            return e ? Math.round(e.getBoundingClientRect().height * 10) / 10 : null;
          };
          const items = [...document.querySelectorAll('.supmenu [role="menuitem"]')];
          const menu = document.querySelector('.supmenu');
          const modes = [...document.querySelectorAll('nav.modes .mode')].map((e) =>
            Math.round(e.getBoundingClientRect().height)
          );
          const primary = document.querySelector('[data-primary]');
          return {
            header: box('header.topbar'),
            modeRow: box('nav.modes'),
            modes,
            menu: menu ? Math.round(menu.getBoundingClientRect().height) : null,
            items: items.map((e) => Math.round(e.getBoundingClientRect().height)),
            primary: primary ? Math.round(primary.getBoundingClientRect().top) : null,
            overflow: document.documentElement.scrollWidth - innerWidth
          };
        });
        measures.push({ state: s.id, width, lang, ...m });
        await page.screenshot({ path: path.join(OUT, `${s.id}__${width}__${lang}.png`) });
        await ctx.close();
      }
    }
  }
  /* A page head from 761 px: the labelled pin and «Справка». */
  for (const lang of ['ru', 'en']) {
    const { ctx, page, d } = await fresh({ width: 1180, height: 720, lang });
    await d.open('#/tables/eq_weapon', { lang });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT, `pagehead-tables__1180__${lang}.png`) });
    await ctx.close();
  }
  console.log(JSON.stringify(measures, null, 1));
  await closeBrowser();
})().catch(async (e) => {
  console.error(e);
  await closeBrowser();
  process.exit(1);
});
