/* Batch W evidence, not a gate: the page types at 1920x1080 and 3840x2160 RU (1920 EN for the roll and
   the list), the counter at 360 and 700, the editor at 360, 1180, 1440 and 1920.
   node issues/57/mocks/W/built/shoot.js  (after `npm run build:test`).
   Scratch: the closeout deletes it with issues/57/. */
const path = require('path');
const { fresh, closeBrowser } = require('../../../../../tests/app/lib.js');
const { STATES } = require('../../../../../tests/app/inventory.js');

const OUT = __dirname;
const PH = 'Поиск по названию или описанию...';

/* [file id, inventory state id, or a plain route with its account] */
const PAGES = [
  ['roll-std', '#/roll/std'],
  ['roll-voa', null, '#/roll/voa', 'gm3'],
  ['core-item', null, '#/tables/core_item', 'gm3'],
  ['eq-weapon', '#/tables/eq_weapon'],
  ['voa', null, '#/tables/voa', 'gm3'],
  ['ci1', '#/i/ci1'],
  ['homebrew', '#/homebrew as gm3'],
  ['homebrew-new', '#/homebrew/new as gm1'],
  ['account', '#/account as gm1'],
  ['print', '#/p/set-emberaxe as gm2'],
  ['nope', '#/i/nope']
];

/** Opens inventory state `sid` in a fresh context the way case 83 does. */
async function inv(sid, width, height, lang) {
  const state = STATES.find((x) => x.id === sid);
  if (!state) throw new Error('no state ' + sid);
  const got = await fresh({ width, height, storage: state.storage });
  await got.d.open(state.route, {
    as: state.as,
    items: state.items,
    sections: state.sections,
    sources: state.sources,
    hold: state.hold
  });
  if (state.enter) await state.enter(got.d);
  await got.d.settled(state.id);
  if (lang === 'en') await got.d.click('EN');
  await got.d.addressSettled();
  return got;
}

async function snap(got, file) {
  await got.d.settle();
  await got.page.evaluate(() => document.fonts.ready);
  await got.page.screenshot({ path: path.join(OUT, file) });
}

(async () => {
  for (const [width, height, lang] of [
    [1920, 1080, 'ru'],
    [3840, 2160, 'ru'],
    [1920, 1080, 'en']
  ]) {
    for (const [id, sid, hash, as] of PAGES) {
      if (lang === 'en' && id !== 'roll-std' && id !== 'core-item') continue;
      let got;
      if (sid) got = await inv(sid, width, height, lang);
      else {
        got = await fresh({ width, height, lang });
        await got.d.open(hash, { as, lang });
        await got.d.settled(hash);
      }
      await snap(got, `${id}__${width}__${lang}.png`);
      await got.ctx.close();
    }
    if (lang === 'ru') {
      const got = await fresh({ width, height, lang });
      await got.d.open('#/search', { as: 'gm3', lang });
      await got.d.type(PH, 'меч');
      await snap(got, `search__${width}__${lang}.png`);
      await got.d.type(PH, 'спальный мешок');
      await got.d.click('Первоклассный');
      await snap(got, `dialog__${width}__${lang}.png`);
      await got.ctx.close();
    }
  }
  for (const w of [360, 700]) {
    for (const hash of ['#/roll/std', '#/roll/alt']) {
      const got = await fresh({ width: w, height: 800, lang: 'ru' });
      await got.d.open(hash, { as: 'gm3', lang: 'ru' });
      await got.d.settled(hash);
      await got.d.click('Настроить');
      await snap(got, `counter-${hash.slice(7)}__${w}__ru.png`);
      await got.ctx.close();
    }
  }
  for (const [w, h] of [
    [360, 740],
    [1180, 720],
    [1440, 900],
    [1920, 1080]
  ]) {
    const got = await inv('#/homebrew/new as gm1', w, h, 'ru');
    await snap(got, `editor__${w}__ru.png`);
    await got.ctx.close();
  }
  await closeBrowser();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
