/* Batch 6 evidence: the homebrew pages and the editor at 360 and 1180 in RU and EN, and
   /homebrew at 761. node issues/57/mocks/6/built/shoot.js  (after `npm run build:test`).
   Scratch: the closeout deletes it with issues/57/. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PNG } = require('pngjs');
const { fresh, closeBrowser } = require('../../../../../tests/app/lib.js');

const OUT = __dirname;
const SIZES = [
  [360, 640],
  [1180, 720]
];
const AXE = '#/homebrew/hb_emberaxeaaaaaaaa';
const LONG = '#/homebrew/hb_longsrcaaaaaaaaa';
const WIDE = path.join(os.tmpdir(), 'dhloot-crop-3x2.png');

/* A 600 x 400 picture, written once for the crop dialog. */
function writeWide() {
  const png = new PNG({ width: 600, height: 400 });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = (i / 4) % 600 < 300 ? 120 : 60;
    png.data[i + 1] = 70;
    png.data[i + 2] = 110;
    png.data[i + 3] = 255;
  }
  fs.writeFileSync(WIDE, PNG.sync.write(png));
}

(async () => {
  writeWide();
  const measures = [];
  const primary = (page) =>
    page.evaluate(() => {
      const el = [...document.querySelectorAll('[data-primary]')].find(
        (e) => e.getBoundingClientRect().height > 0
      );
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    });
  for (const lang of ['ru', 'en']) {
    const w = (ru, en) => (lang === 'ru' ? ru : en);
    for (const [width, height] of SIZES) {
      const narrow = width === 360;
      const { page, d, ctx } = await fresh({ width, height, lang });
      const shot = async (id) => {
        await d.settle();
        await page.screenshot({ path: path.join(OUT, `${id}__${width}__${lang}.png`) });
      };
      const open = async (hash, as, extra = {}) => {
        await d.open(hash, { as, lang, ...extra });
        await d.settle();
      };
      const closeSheet = async () => {
        await page.keyboard.press('Escape');
        await d.settle();
      };

      await open('#/homebrew', 'gm3');
      measures.push({ state: 'homebrew', width, lang, top: await primary(page) });
      await shot('homebrew');
      if (narrow) {
        await d.press(w('Мои предметы: Предметы', 'My items: Items'));
        await shot('homebrew-tabs');
        await closeSheet();
        await d.openMore('.pickrow [aria-haspopup="menu"]');
        await shot('homebrew-more');
        await page.keyboard.press('Escape');
        await d.press(w('Фильтры', 'Filters'));
        await shot('homebrew-filter-sheet');
        await closeSheet();
      }
      const names = await d.tickNames();
      for (const n of names.slice(0, 2)) await d.tick(n);
      await shot('homebrew-select');
      if (narrow) {
        await page.click('.selbarwrap .seldrop > .btn');
        await shot('homebrew-bar-list');
        await page.keyboard.press('Escape');
        await d.openMore('.selbarwrap [aria-haspopup="menu"]');
        await shot('homebrew-bar-more');
        await d.press(w('Переместить (2)', 'Move (2)'));
      } else {
        await d.press(w('Переместить (2)', 'Move (2)'));
      }
      await shot('homebrew-move');
      await closeSheet();

      await open('#/homebrew', 'gm2');
      await shot('homebrew-empty');
      await open('#/homebrew/sets', 'gm4');
      await shot('homebrew-sets-empty');
      await open('#/homebrew/rules', 'gm4');
      await shot('homebrew-rules-empty');
      await open('#/homebrew/sets', 'gm1');
      await shot('homebrew-sets');
      await open('#/homebrew/rules', 'gm1');
      await shot('homebrew-rules');
      await open('#/homebrew/sources', 'gm1');
      await d.openMore('.book [aria-haspopup="menu"]');
      await shot('homebrew-sources-more');

      await open('#/homebrew', 'gm1');
      if (narrow) await d.openMore('.pickrow [aria-haspopup="menu"]');
      await d.press(w('Импорт из файла', 'Import from file'));
      await page.waitForSelector('input[type="file"]', { timeout: 5000 });
      await d.upload(
        path.join(__dirname, '../../../../../docs/fixtures/homebrew-file/example-edited.json')
      );
      await page
        .waitForFunction(() => /\(7\)/.test(document.body.innerText), { timeout: 5000 })
        .catch(() => {});
      await shot('homebrew-import');

      await open('#/homebrew/new', 'gm1');
      measures.push({ state: 'new', width, lang, top: await primary(page) });
      await shot('editor-new');
      await d.press(w('Снаряжение', 'Equipment'));
      await shot('editor-equipment');
      await d.press(w('Сохранить', 'Save'));
      await shot('editor-errors');
      if (narrow) {
        await d.press(w('Предпросмотр', 'Preview'));
        await shot('editor-preview');
        await closeSheet();
      }
      await open(AXE, 'gm1');
      await shot('editor-axe');
      await page.evaluate(() => {
        const el = document.querySelector('.ebar');
        el.scrollIntoView({ block: 'end' });
      });
      await shot('editor-axe-end');
      await page.evaluate(() => scrollTo(0, 0));
      if (narrow) {
        await d.openMore('.ebar [aria-haspopup="menu"]');
        await shot('editor-bar-more');
        await page.keyboard.press('Escape');
      }
      await open(LONG, 'gm4');
      measures.push({ state: 'long', width, lang, top: await primary(page) });
      await shot('editor-long');
      await open('#/homebrew/sets', 'gm4');
      await d.press(w('Новый комплект', 'New set'));
      await shot('card-form');
      await d.type(w('Название комплекта', 'Set name'), 'Ж'.repeat(80));
      await d.type(w('Бонус комплекта', 'Set bonus'), 'Бонус.');
      await d.choose('#hb-card-new-set-book', '00000000-0000-4000-8000-000000000451');
      await d.click(w('Создать комплект', 'Create set'));
      await page.waitForSelector('ul.cards', { timeout: 5000 });
      measures.push({ state: 'sets-long', width, lang, top: await primary(page) });
      await shot('homebrew-sets-long');

      /* A9: a 3:2 picture in the crop dialog. */
      await open('#/homebrew/new', 'gm1');
      await d.upload(WIDE);
      await page.waitForSelector('.stage img', { timeout: 5000 });
      await d.settle();
      measures.push({
        state: 'crop',
        width,
        lang,
        crop: await page.evaluate(() => {
          const sq = document.querySelector('.sq').getBoundingClientRect();
          const im = document.querySelector('.stage img').getBoundingClientRect();
          const st = document.querySelector('.stage').getBoundingClientRect();
          const range = document.querySelector('#hb-crop-zoom');
          const thumb = getComputedStyle(range, '::-webkit-slider-thumb');
          return {
            stage: Math.round(st.width),
            frameTop: Math.round(sq.top - st.top),
            pictureTop: Math.round(im.top - st.top),
            thumb: [thumb.width, thumb.height],
            hint: getComputedStyle(document.getElementById('hb-crop-hint')).position
          };
        })
      });
      await shot('editor-crop');
      await ctx.close();
    }
    const { page, d, ctx } = await fresh({ width: 761, height: 768, lang });
    await d.open('#/homebrew', { as: 'gm3', lang });
    await d.settle();
    await page.screenshot({ path: path.join(OUT, `homebrew__761__${lang}.png`) });
    await ctx.close();
  }
  console.log(JSON.stringify(measures));
  await closeBrowser();
})().catch(async (e) => {
  console.error(e);
  await closeBrowser();
  process.exit(1);
});
