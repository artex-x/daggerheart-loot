/* Batch 9b evidence, not a gate: the list page panels and the five rules, RU and EN, at 360
   and 1180 px, a few at 768, and the wide set at 1920 and 2560 px.
   node issues/57/mocks/9b/built/shoot.js [file id prefix]  (after `npm run build:test`).
   Scratch: the closeout deletes it with issues/57/. */
const path = require('path');
const { fresh, closeBrowser } = require('../../../../../tests/app/lib.js');
const { STATES } = require('../../../../../tests/app/inventory.js');

const OUT = __dirname;
const LIST = '#/lists/00000000-0000-4000-8000-000000008001';
const SHOP = '#/lists/00000000-0000-4000-8000-000000000101';
const SMALL = [
  [360, 640],
  [1180, 720]
];
const MID = [[768, 1024]];
const WIDE = [
  [1920, 1080],
  [2560, 1440]
];

const settings = async (d, lang, width) => {
  if (width <= 760) await d.click(lang === 'en' ? 'Set up' : 'Настроить');
};
const share = async (d, lang, width) => {
  if (width <= 760) {
    await d.openMore('.lhead-acts .morewrap > [aria-haspopup="menu"]');
    await d.click(lang === 'en' ? 'Share' : 'Поделиться');
  } else await d.click(lang === 'en' ? 'Share' : 'Поделиться');
  await d.settle();
};

const noteArea = async (d, lang, width, page) => {
  await page.click('.lrow .cfull [data-note-open]');
  await d.settle();
};
const NARROW = [
  [320, 640],
  [360, 640]
];

/* [file id, inventory state id, sizes, a step after the language, full page] */
const PAGES = [
  ['list', LIST + ' ~ noted as gm4', [...SMALL, ...MID, ...WIDE], null, true],
  ['list-note', LIST + ' ~ note open as gm4', [[1180, 720]], null, true],
  ['list-note-gm', LIST + ' ~ note open, gm as gm4', [[1180, 720]], null, true],
  ['list-notes', LIST + ' ~ list notes open as gm4', [[1180, 720]], null, true],
  ['list-prices', LIST + ' ~ prices in coins as gm4', [[1180, 720], ...MID], null, true],
  ['list-roll', LIST + ' ~ rolled as gm4', [[1180, 720], ...MID], null, true],
  ['list-share', LIST + ' ~ noted as gm4', SMALL, share, true],
  ['list-requests', SHOP + ' ~ requests as gm1', [...SMALL, ...WIDE], null, false],
  ['list-requests-open', SHOP + ' ~ requests open as gm1', SMALL, null, true],
  ['list-rowmore', LIST + ' ~ row menu as gm4', [[1180, 720]], null, false],
  ['list-rowmore', LIST + ' ~ row more as gm4', [[360, 640]], null, false],
  ['list-note', LIST + ' ~ compact, row open as gm4', [[360, 640]], null, true],
  ['list-notes', LIST + ' ~ compact, noted as gm4', [[360, 640]], null, true],
  ['list-roll', LIST + ' ~ roll panel as gm4', [[360, 640]], null, true],
  ['list-note-area', LIST + ' ~ compact, row open as gm4', [[360, 640]], noteArea, true],
  ['hb-new', '#/homebrew/new ~ equipment as gm1', NARROW, null, true],
  ['hb-card', '#/homebrew/new ~ new card as gm1', NARROW, null, true],
  ['hb-set', '#/homebrew/sets/hb_starsleepsetaaaa as gm3', NARROW, null, true],
  ['shared-player', '#/s/player-token-1', [...SMALL, ...MID, ...WIDE], null, true],
  ['shared-gm', '#/s/gm-token-1', SMALL, null, true],
  ['search', '#/search ~ searched', [...SMALL, ...WIDE], null, false],
  ['eq-weapon', '#/tables/eq_weapon ~ two filters', SMALL, null, false],
  ['roll-std', '#/roll/std', SMALL, settings, false]
];

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
  if (lang === 'en') {
    await got.d.click('EN');
    if (state.again) await state.again(got.d);
  }
  await got.d.addressSettled();
  return got;
}

(async () => {
  const only = process.argv[2];
  for (const [id, sid, sizes, after, full] of PAGES) {
    if (only && !id.startsWith(only)) continue;
    for (const [width, height] of sizes) {
      for (const lang of ['ru', 'en']) {
        try {
          const got = await inv(sid, width, height, lang);
          if (after) await after(got.d, lang, width, got.page);
          await got.d.settle();
          await got.page.evaluate(async () => {
            await document.fonts.ready;
            scrollTo(0, 0);
          });
          await got.page.screenshot({
            path: path.join(OUT, `${id}__${width}__${lang}.png`),
            fullPage: full
          });
          await got.ctx.close();
        } catch (e) {
          console.log('skipped ' + id + ' ' + width + ' ' + lang + ': ' + e.message);
        }
      }
    }
  }
  await closeBrowser();
})();
