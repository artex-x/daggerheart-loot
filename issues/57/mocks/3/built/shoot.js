/* Batch 3 evidence: the catalog at 360 and 1180 (and 768) in RU and EN, and its measures.
   node issues/57/mocks/3/built/shoot.js  (after `npm run build:test`). Scratch: the
   closeout deletes it with issues/57/. */
const path = require('path');
const { fresh, closeBrowser } = require('../../../../../tests/app/lib.js');

const OUT = __dirname;
const T = (ru, en) => ({ ru, en });
const STATES = [
  { id: 'catalog', route: '#/tables/eq_weapon' },
  { id: 'catalog-filtered', route: '#/tables/eq_weapon/f_tier-1.range-melee' },
  { id: 'catalog-sheet', route: '#/tables/eq_weapon', narrow: T('Фильтры', 'Filters') },
  {
    id: 'catalog-picker',
    route: '#/tables/eq_weapon',
    narrow: T('Таблица: Оружие', 'Table: Weapons')
  },
  { id: 'catalog-more', route: '#/tables/eq_weapon', narrow: T('Ещё', 'More') },
  { id: 'picker-alt-cons', route: '#/tables/alt_consumable', only: 360 },
  { id: 'picker-hnf-cons', route: '#/tables/hope_and_fear_consumable', only: 360 },
  { id: 'picker-wondrous', route: '#/tables/wondrous_environments', only: 360 },
  { id: 'catalog-alt', route: '#/tables/alt_item', only: 360 },
  { id: 'catalog-grid', route: '#/tables/wondrous_environments', press: T('Сетка', 'Grid') },
  { id: 'catalog-selecting', route: '#/tables/eq_weapon', press: T('Выбрать', 'Select') },
  { id: 'catalog-searched', route: '#/tables/eq_weapon', type: 'меч' },
  { id: 'catalog-nothing', route: '#/tables/eq_weapon/f_tier-1', type: 'zzzqqq' },
  {
    id: 'catalog-about',
    route: '#/tables/eq_weapon',
    wide: T('Об этих данных', 'About this data')
  }
];

(async () => {
  const measures = [];
  for (const width of [360, 768, 1180]) {
    for (const lang of ['ru', 'en']) {
      for (const s of STATES) {
        if (width === 768 && s.id !== 'catalog' && s.id !== 'catalog-sheet') continue;
        if (s.only && s.only !== width) continue;
        if (s.narrow && width === 1180) continue;
        if (s.wide && width === 360) continue;
        const { ctx, page, d } = await fresh({
          width,
          height: width === 360 ? 640 : 720,
          lang
        });
        await d.open(s.route, { lang });
        await new Promise((r) => setTimeout(r, 400));
        const press = s.narrow ?? s.press ?? s.wide;
        if (press) await d.click(press[lang]);
        if (s.type)
          await d.type(
            lang === 'ru'
              ? 'Поиск по названию или описанию...'
              : 'Search by name or description...',
            s.type
          );
        await new Promise((r) => setTimeout(r, 400));
        const m = await page.evaluate(() => {
          const top = (sel) => {
            const e = document.querySelector(sel);
            return e ? Math.round(e.getBoundingClientRect().top) : null;
          };
          const h = (sel) => {
            const e = document.querySelector(sel);
            return e ? Math.round(e.getBoundingClientRect().height) : null;
          };
          return {
            primary: top('[data-primary]'),
            head: h('.pickrow') ?? h('.tablenav'),
            searchrow: h('.searchrow'),
            bar: h('.selbarwrap'),
            overflow: document.documentElement.scrollWidth - innerWidth
          };
        });
        measures.push({ state: s.id, width, lang, ...m });
        await page.screenshot({ path: path.join(OUT, `${s.id}__${width}__${lang}.png`) });
        await ctx.close();
      }
    }
  }
  console.log(JSON.stringify(measures));
  await closeBrowser();
})().catch(async (e) => {
  console.error(e);
  await closeBrowser();
  process.exit(1);
});
