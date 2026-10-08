/* The states a real click reaches, and nothing else does.
 *
 * Every other suite under tests/app/ opens a route and reads what is there;
 * this one presses controls with `press` - a trusted puppeteer
 * ElementHandle.click(), not the synthetic `el.click()` every parity state
 * and every legacy suite uses - because a handful of real defects only show
 * up on the far side of a browser's own microtask checkpoint (the
 * `isConnected` guard) or need a real network, a real clipboard stub, or a
 * real second tab to mean anything at all. Sixty-three cases in
 * sixty-two runs (4 and 5 share one), no ancestor. Like every suite here it drives
 * dist-test/, the test build (docs/specs/COVERAGE.md, "Test layers"): signed
 * out it draws the sign-in prompt where a list would be made, so the cases
 * that make one open as the seed's `gm2`. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PNG } = require('pngjs');
const { axe, baseUrl, fresh, sharedPage, reporter, closeBrowser } = require('./lib.js');
const { TARGETS, ready } = require('./driver.js');
/** The shared page's «Лавка»: three rows with a quantity and a price. */
const QTY_AND_PRICE = require('../../docs/fixtures/lists/qty-and-price.json');

/** The fake seed's `gm1` list «Лавка кузнеца», `uuid(101)`, and the first id
 *  the fake hands a new list, `uuid(5000)`. */
const SHOP = '#/lists/00000000-0000-4000-8000-000000000101';
const FIRST_NEW = '#/lists/00000000-0000-4000-8000-000000005000';
/** The fake seed's `gm1` list «Трофеи», `uuid(103)`, with no share link. */
const TROPHIES = '#/lists/00000000-0000-4000-8000-000000000103';

/** One browser list: signed out, the index draws the storage notice only
 *  over this browser's lists. */
const ONE_LOCAL = {
  'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'Клад', ids: [], created: 1 }])
};

/** Waits up to 5 s for `fn` to hold in the page; answers whether it did. */
async function waitIn(page, fn, ...args) {
  try {
    await page.waitForFunction(fn, { timeout: 5000, polling: 50 }, ...args);
    return true;
  } catch {
    return false;
  }
}

const rep = reporter();
const { ok } = rep;

/** Case 7's two-stage wait budget. Set against tests/app/lib.js's own
 *  protocolTimeout (300_000) - this tree is shared with peer sessions and a
 *  loaded host makes CDP round trips slower, so the wait has to outlast
 *  ordinary contention without outlasting a genuine hang. */
const STORAGE_WAIT_MS = 30_000;

/** The new-list form's input, wherever the caller's markup put it -
 *  `.picker-new input[type=text]`, the only text input the add-to-list menu
 *  ever draws. */
async function newListInputBox(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.picker-new input[type="text"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, focused: el === document.activeElement };
  });
}

/** A screenshot clip in document coordinates: `page.screenshot({ clip })`
 *  captures beyond the viewport, so a viewport rect `r` is shifted by the
 *  page scroll `r.sx`, `r.sy` that the same `evaluate` read. */
function pageClip(r) {
  return {
    x: Math.round(r.x + r.sx),
    y: Math.round(r.y + r.sy),
    width: Math.round(r.width),
    height: Math.round(r.height)
  };
}

/** Whether box `a` lies entirely inside box `b` - `.modal-card`'s own
 *  bounds, for case 3. */
function inside(a, b) {
  return (
    a.x >= b.x - 0.5 &&
    a.y >= b.y - 0.5 &&
    a.x + a.w <= b.x + b.w + 0.5 &&
    a.y + a.h <= b.y + b.h + 0.5
  );
}

/** 1. New list from the card. */
async function newListFromCard() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/i/ci1', { as: 'gm2' });
  await d.press('Добавить в список');
  await d.press('+ Новый список');
  const box = await newListInputBox(page);
  ok(!!box, '1 (card): the new-list form did not open');
  ok(!!box?.focused, '1 (card): the input is not focused');
  ok(await d.has('Создать'), '1 (card): the menu closed after "+ Новый список"');
  await ctx.close();
}

/** 2. New list from the selection bar. */
async function newListFromBar() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/tables', { as: 'gm2' });
  await d.tick('Первоклассный Спальный Мешок'); // ticking a row is not this case's point
  await d.press('Добавить в список');
  await d.press('+ Новый список');
  const box = await newListInputBox(page);
  ok(!!box, '2 (selection bar): the new-list form did not open');
  ok(!!box?.focused, '2 (selection bar): the input is not focused');
  await ctx.close();
}

/** 3. New list from the modal - Самоцвет Чутья, 1100x900, no browser list:
 *  the pre-measured case this fix was verified against, as `gm2`. */
async function newListFromModal() {
  const { ctx, page, d } = await fresh({ width: 1100, height: 900 });
  await d.open('#/tables', { as: 'gm2' });
  await d.press('Самоцвет Чутья');
  ok(await d.has('Добавить в список'), '3 (modal): the modal did not open');
  await d.press('Добавить в список');
  await d.press('+ Новый список');
  const box = await newListInputBox(page);
  ok(!!box, '3 (modal): the new-list form did not open');
  ok(!!box?.focused, '3 (modal): the input is not focused');
  const card = await page.evaluate(() => {
    const el = document.querySelector('.modal-card');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  ok(!!card, '3 (modal): .modal-card not found');
  if (box && card) {
    ok(inside(box, card), '3 (modal): the input sits outside .modal-card');
  }
  await ctx.close();
}

/** 23. The add-to-list menu inside the record modal must not force a scroll
 *  on the card article, nor spill outside the modal:
 *  the toggle (`:scope > .btn`), not whichever button happens to render
 *  first, is what the placement effect measures, and the modal's own card is
 *  what it clips against. Кольцо Тишины at 1100x900 with no browser list is
 *  the exact case the defect's own evidence measured (`.card.scrollTop` 109),
 *  as `gm2`, whose one account list the menu also draws. */
async function addToListMenuStaysInModal() {
  const { ctx, page, d } = await fresh({ width: 1100, height: 900 });
  await d.open('#/tables', { as: 'gm2' });
  await d.press('Кольцо Тишины');
  ok(await d.has('Добавить в список'), '23 (menu in the modal): the modal did not open');
  await d.press('Добавить в список');

  /* `.card` is `overflow: clip` (RecordCard.svelte), which creates no
     scroll container, so a `.card.scrollTop` reading would be 0 regardless
     of what the placement effect does - it stopped being able to fail and
     is not what the fix actually measures. The real invariant is that
     `:scope > .btn` (AddToList.svelte's own selector for the toggle) finds
     exactly one direct child of `.seldrop`, so it cannot accidentally
     resolve to a `.dropmenu` button instead. */
  const toggleCount = await page.evaluate(
    () => document.querySelectorAll('.seldrop > .btn').length
  );
  ok(
    toggleCount === 1,
    '23 (menu in the modal): .seldrop > .btn matched ' + toggleCount + ', expected 1'
  );

  const box = (sel) =>
    page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }, sel);

  const card = await box('.modal-card');
  ok(!!card, '23 (menu in the modal): .modal-card not found');
  const menu = await box('.dropmenu');
  ok(!!menu, '23 (menu in the modal): .dropmenu not found');
  if (menu && card) {
    ok(inside(menu, card), '23 (menu in the modal): the menu sits outside .modal-card');
  }

  await d.press('+ Новый список');
  const input = await newListInputBox(page);
  ok(!!input, '23 (menu in the modal): the new-list form did not open');
  ok(!!input?.focused, '23 (menu in the modal): the input is not focused');
  if (input && card) {
    ok(inside(input, card), '23 (menu in the modal): the input sits outside .modal-card');
  }
  await ctx.close();
}

/** 4/5. Two frames picked, and the same link arriving fresh - the live side
 *  legitimately reads 0 on arrival, so no parity state can hold this one. */
async function twoFramesPicked() {
  const { ctx, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/tables/other_frames');
  await d.press('Фильтры');
  await d.press('Пир зверей');
  await d.press('Колоссы Сухоземья');
  const hash1 = await d.hash();
  ok(
    hash1 === '#/tables/other_frames/f_frame-beast_feast-colossus',
    '4 (two frames): address ' + hash1 + ', expected f_frame-beast_feast-colossus'
  );
  const rows1 = await d.count('.rows .row[data-row]');
  ok(rows1 === 57, '4 (two frames): ' + rows1 + ' rows instead of 57');
  const pills1 = await d.count('.fpill');
  ok(pills1 === 2, '4 (two frames): ' + pills1 + ' pills instead of 2');
  await ctx.close();

  const { ctx: ctx2, page: page2, d: d2 } = await fresh({ width: 1180, height: 900 });
  await d2.open('#/tables/other_frames/f_frame-beast_feast-colossus');
  const rows2 = await d2.count('.rows .row[data-row]');
  ok(rows2 === 57, '5 (link arriving fresh): ' + rows2 + ' rows instead of 57');
  const pills2 = await d2.count('.fpill');
  ok(pills2 === 2, '5 (link arriving fresh): ' + pills2 + ' pills instead of 2');
  /* A one-line pill keeps the strip's 32px, beside «Сбросить всё»; only a long
     name wraps it taller (docs/specs/FEATURES.md, rule 16). */
  const heights = await page2.evaluate(() =>
    [...document.querySelectorAll('.fpill, .fclear')].map(
      (e) => e.getBoundingClientRect().height
    )
  );
  ok(
    heights.length === 3 && heights.every((h) => h === 32),
    '5 (link arriving fresh): pill and reset heights ' + heights.join(', ') + ', expected 32'
  );
  await ctx2.close();
}

/** 6. <dialog> semantics: a real focus trap, real Escape, real return. */
async function dialogSemantics() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/tables');
  await d.press('Кольцо Тишины');

  const inDialog = await page.evaluate(() => {
    const dlg = document.querySelector('dialog[open]');
    return !!dlg && dlg.contains(document.activeElement);
  });
  ok(inDialog, '6 (dialog): focus did not land inside the dialog on open');

  /* Tab a generous number of times - a real click's own trip past the wrap
   * point (last control back to the first) measures one Tab where Chrome's
   * native dialog briefly hands focus to the page's skip link before
   * correcting on the very next Tab - reproduced twice, with and without a
   * settle frame in between, so it is the browser's own dialog focus-trap at
   * the wrap boundary, not a race in this probe. Failing the case on one
   * self-correcting stop would be wrong; failing to correct by the next one
   * would be a real trap failure and is what this still catches. */
  let escaped = 0;
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    const out = await page.evaluate(() => {
      const dlg = document.querySelector('dialog[open]');
      return !dlg || !dlg.contains(document.activeElement);
    });
    escaped = out ? escaped + 1 : 0;
    ok(
      escaped < 2,
      '6 (dialog): Tab moved focus outside the dialog and did not return it on the next step'
    );
  }

  /* The page behind is inert: trying to focus something outside directly
   * must not move focus there. */
  const blocked = await page.evaluate(() => {
    const outside = document.querySelector('nav.tabs a, .tablenav a, .tablenav button');
    if (!outside) return true;
    outside.focus();
    return document.activeElement !== outside;
  });
  ok(
    blocked,
    '6 (dialog): the background is not inert - an element behind the dialog took focus'
  );

  await page.keyboard.press('Escape');
  const closed = await page.evaluate(() => !document.querySelector('dialog[open]'));
  ok(closed, '6 (dialog): Escape did not close the dialog');
  const returned = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) =>
      (b.textContent || '').includes('Кольцо Тишины')
    );
    return !!btn && btn === document.activeElement;
  });
  ok(returned, '6 (dialog): focus did not return to the row that opened it');
  await ctx.close();
}

/** 7. Two pages sharing storage - two pages of one origin in one browser
 *  context share its storage. Both hold one browser list; page B stays on
 *  #/lists while page A deletes the list; B must redraw without it on the
 *  storage event, with no navigation of its own. A delete, not a create:
 *  signed out, the test build makes no browser list. */
async function twoTabsShareStorage() {
  const seed = {
    'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'Общий клад', ids: [], created: 1 }])
  };
  const b = await sharedPage({ width: 1180, height: 900, storage: seed });
  /* The test's own listener, independent of app/src/ports/storage.ts's -
   * it answers "did Chrome deliver the event at all" on its own, so a
   * timeout below can say which half failed instead of one sentence
   * covering both. */
  await b.page.evaluateOnNewDocument(() => {
    window.addEventListener('storage', (e) => {
      if (e.key === 'dhloot.lists.v2') window.__storageSeen = (window.__storageSeen || 0) + 1;
    });
  });
  await b.d.open('#/lists');
  ok(
    (await b.page.evaluate(() => document.body.innerText)).includes('Общий клад'),
    '7 (two windows): page B does not start with the list'
  );

  const a = await sharedPage({ width: 1180, height: 900, storage: seed });
  await a.d.open('#/lists');
  /* Page A's own arrival clears and re-seeds the shared storage, which B
     hears too: the count starts here, and B shows the list again first. */
  ok(
    await waitIn(b.page, () => document.body.innerText.includes('Общий клад')),
    '7 (two windows): page B lost the list when page A arrived'
  );
  await b.page.evaluate(() => {
    window.__storageSeen = 0;
  });
  await a.d.press('Удалить');
  ok(
    await a.page.evaluate(() => !document.querySelector('.listcard')),
    '7 (two windows): page A did not delete the list'
  );

  /* No navigation on B - the storage event alone must redraw it. Two
   * stages, no swallow: stage one says whether Chrome delivered the event
   * at all (environment), stage two says whether the page redrew once it
   * had the event (app) - a loaded runner and a real regression must not
   * print the same sentence. */
  let storageDelivered = true;
  try {
    await b.page.waitForFunction(() => window.__storageSeen > 0, { timeout: STORAGE_WAIT_MS });
  } catch (e) {
    void e;
    storageDelivered = false;
  }
  ok(
    storageDelivered,
    `7 (two windows): page B did not receive the storage event within ${STORAGE_WAIT_MS / 1000}s`
  );

  if (storageDelivered) {
    let repainted = true;
    try {
      await b.page.waitForFunction(() => !document.querySelector('.listcard'), {
        timeout: STORAGE_WAIT_MS
      });
    } catch (e) {
      void e;
      repainted = false;
    }
    ok(repainted, '7 (two windows): the storage event arrived, but page B did not redraw');
  }

  await a.page.close();
  await b.page.close();
}

/** 8. The packed link - CompressionStream for real. */
async function packedLink() {
  /* Deflate's header costs more than it saves on a short list (compress.ts:
   * "for three entries and no notes"), so the plain form wins there - a
   * bigger list with a long note is what actually reaches the packed branch
   * this case exists to exercise. */
  const seedIds = [
    'ci1',
    'cc1',
    'q1',
    'q313',
    'w1',
    'cm1',
    'ci28',
    'ci56',
    'q239',
    'cc2',
    'w2',
    'q26'
  ];
  const bigNote =
    'Очень длинная заметка про весь список, чтобы сжатый вариант точно перевесил издержки заголовка deflate. '.repeat(
      4
    );
  const { ctx, page, d } = await fresh({
    width: 1180,
    height: 900,
    storage: {
      'dhloot.lists.v2': JSON.stringify([
        { id: 'a', name: 'Пакуемый клад', ids: seedIds, created: 1, note: bigNote }
      ])
    }
  });
  await d.open('#/lists');
  await d.click('Поделиться');
  const clip = await d.clipboard();
  const text = clip?.text || '';
  const m = /#\/l\/(~[A-Za-z0-9_-]+)/.exec(text);
  ok(!!m, '8 (packed link): the copied text does not contain #/l/~ - ' + text.slice(0, 120));
  if (m) {
    await d.open('#/l/' + m[1]);
    await d.expanded();
    /* Not the list's own name: the payload matches this browser's own
     * stored list 'a' (the same page shared it from), so it opens as the
     * owner's page - `.titleinput`'s value, not text content - the same
     * way on both apps. What proves the packed round trip is the count and
     * the long note, which are body text either way. */
    const seen = await page.evaluate(() => document.body.innerText);
    ok(
      seen.includes('12 позиций'),
      '8 (packed link): not every entry unpacked - ' + seen.slice(0, 200)
    );
    /* The note is a <textarea>'s value, not rendered text - innerText does
     * not carry it. */
    const noteValue = await page.evaluate(
      () => document.querySelector('textarea')?.value || ''
    );
    ok(
      noteValue.includes('перевесил издержки заголовка'),
      '8 (packed link): the long note did not unpack - ' + noteValue.slice(0, 80)
    );
  }
  await ctx.close();
}

/** 9. Copy text through the stubbed clipboard - both flavours. */
async function copyTextThroughClipboard() {
  const { ctx, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/i/ci1');
  await d.press('Скопировать текст');
  const clip = await d.clipboard();
  ok(!!clip?.text, '9 (copy text): text/plain did not reach the clipboard');
  ok(!!clip?.html, '9 (copy text): text/html did not reach the clipboard');
  await ctx.close();
}

/** 10. Copy image. Over HTTP the picture is same-origin, the canvas is
 *  clean, and a real picture reaches the clipboard. The tainted-canvas
 *  fallback (the record's text and the `imgTainted` toast) is
 *  `record.test.ts`'s; here it is a regression. */
async function copyImage() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/i/ci1');
  await d.press('Скопировать изображение');
  /* The canvas loads, draws and encodes the picture after the press
     returns; the clipboard write or the fallback toast marks the outcome. */
  await page
    .waitForFunction(
      () => !!window.__clip || !!document.querySelector('.toast')?.textContent?.trim(),
      { timeout: 15_000 }
    )
    .catch(() => {});
  const result = await page.evaluate(async () => {
    const m = window.__clip;
    const imgKey = m && Object.keys(m).find((k) => k.startsWith('image/'));
    if (imgKey) return { blob: (await m[imgKey]).size };
    return {
      clip: m ? Object.keys(m) : null,
      toast: document.querySelector('.toast')?.textContent || ''
    };
  });
  ok(
    'blob' in result,
    '10 (copy image): no picture reached the clipboard (a clean canvas is expected over HTTP) - ' +
      JSON.stringify(result)
  );
  ok(result.blob > 0, '10 (copy image): the copied picture is empty');
  await ctx.close();
}

/** 11. A broken art path - the real <img> error path, not a data mutation:
 *  the request for one record's own picture is aborted, so the browser
 *  fires a genuine error event and the port's own onartfail/markArtBroken
 *  path runs for real. A second page does the same to a table row's
 *  thumbnail, and proves the row never asks for the 640 px file.
 *
 *  Both pages bypass the service worker: once sw.js controls the page, a
 *  lazy picture is fetched by the worker, which page interception never sees. */
async function brokenArtPath() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await page.setBypassServiceWorker(true);
  await page.setRequestInterception(true);
  const onReq = (req) => {
    if (/\/img\/w3[._]/.test(req.url()) || /w3\.webp$/.test(req.url())) req.abort();
    else req.continue();
  };
  page.on('request', onReq);
  await d.open('#/i/w3');
  const src = await page.evaluate(() =>
    document.querySelector('.card-media img')?.getAttribute('src')
  );
  ok(/_none\.webp$/.test(src || ''), '11 (no picture): instead of the placeholder — ' + src);
  ok(
    await d.has('Скопировать текст'),
    '11 (no picture): the text button disappeared along with the picture'
  );
  /* The copy-image button must go with the picture, not just switch to
   * offering the placeholder (RecordActions.svelte, restored to
   * it.img && !app.artBroken(it.id) - the legacy app.js's own hasImage). */
  ok(
    !(await d.has('Скопировать изображение')),
    '11 (no picture): the copy-image button should disappear along with the picture'
  );
  page.off('request', onReq);
  await ctx.close();

  /* A table row asks for its 160 px thumbnail, never the full picture, and a
   * failed thumbnail falls back to the thumbnail placeholder
   * (docs/specs/FEATURES.md, "Records"). */
  const row = await fresh({ width: 1180, height: 900 });
  const asked = [];
  await row.page.setBypassServiceWorker(true);
  await row.page.setRequestInterception(true);
  row.page.on('request', (req) => {
    asked.push(req.url());
    if (/\/img\/thumb\/w3\.webp$/.test(req.url())) req.abort();
    else req.continue();
  });
  await row.d.open('#/tables/wondrous/w3');
  await row.page
    .waitForFunction(
      () =>
        /\/_none\.webp$/.test(
          document.querySelector('[data-row="w3"] .row-main img')?.getAttribute('src') || ''
        ),
      { timeout: 5000 }
    )
    .catch(() => {});
  ok(
    asked.some((u) => /\/img\/thumb\/w3\.webp$/.test(u)),
    '11 (row thumbnail): the row did not ask for its thumbnail'
  );
  ok(
    !asked.some((u) => /\/img\/w3\.webp$/.test(u)),
    '11 (row thumbnail): the row downloaded the full picture'
  );
  const rowSrc = await row.page.evaluate(() =>
    document.querySelector('[data-row="w3"] .row-main img')?.getAttribute('src')
  );
  ok(
    rowSrc === 'img/thumb/_none.webp',
    '11 (row thumbnail): instead of the thumbnail placeholder - ' + rowSrc
  );
  await row.ctx.close();
}

/** 12. Focus survives a tables keystroke - Svelte keeps the search box's
 *  own node where the live app rebuilt it (qa 9.1). */
async function focusSurvivesKeystroke() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/tables');
  await d.type('Поиск по названию или описанию…', 'к');
  const stillFocused = await page.evaluate(
    (ph) =>
      document.activeElement instanceof HTMLInputElement &&
      document.activeElement.placeholder === ph,
    'Поиск по названию или описанию…'
  );
  ok(stillFocused, '12 (focus survives input): focus left the search box after the redraw');
  await ctx.close();
}

/** 13. The note textarea's height - grows to fit, which jsdom cannot
 *  measure at all (no layout). */
async function noteTextareaHeight() {
  const { ctx, page, d } = await fresh({
    width: 1180,
    height: 900,
    storage: { 'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'Тайник', ids: ['ci1'] }]) }
  });
  await d.open('#/lists/a');
  await d.press('Заметка');
  /* The exact textarea `d.type()` targets below, by the same placeholder -
   * `.rnote textarea, .lnote textarea` also matches the list's own note box,
   * which sits earlier in the DOM and is not the one this case types into. */
  const PH = 'Как предмет выглядит, что о нём знают';
  const before = await page.evaluate((ph) => {
    const ta = document.querySelector(`textarea[placeholder="${ph}"]`);
    return ta ? parseFloat(getComputedStyle(ta).height) : null;
  }, PH);
  ok(before !== null, '13 (note height): the textarea was not found');
  await d.type(
    PH,
    'Строка первая\nСтрока вторая\nСтрока третья\nСтрока четвёртая\nСтрока пятая'
  );
  const after = await page.evaluate((ph) => {
    const ta = document.querySelector(`textarea[placeholder="${ph}"]`);
    if (!ta) return null;
    return { height: parseFloat(getComputedStyle(ta).height), scrollHeight: ta.scrollHeight };
  }, PH);
  ok(!!after, '13 (note height): the textarea disappeared after typing');
  if (before !== null && after) {
    ok(
      after.height > before,
      '13 (note height): the field did not grow - was ' + before + ', became ' + after.height
    );
    ok(
      after.height >= after.scrollHeight - 1 || after.height >= 320,
      '13 (note height): height ' +
        after.height +
        ' is less than its content ' +
        after.scrollHeight
    );
  }

  /* The list's own note group (the legacy notes.js) - a second, independent
   * pair of boxes at `.lnote`, closed by default until its summary is
   * pressed, plus the clear cross's `:has(:placeholder-shown)` visibility
   * (also notes.js) - a real-CSS read jsdom cannot make. */
  await d.press('Заметки');
  const LIST_PH = 'Например: лавка закрыта до утра';
  const boxLines = () =>
    page.$$eval('.lnote textarea', (els) =>
      els.map((t) => {
        const cs = getComputedStyle(t);
        const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        return Math.round((t.clientHeight - pad) / parseFloat(cs.lineHeight));
      })
    );
  let lnoteLines = await boxLines();
  ok(
    lnoteLines.length === 2 && lnoteLines.every((n) => n === 3),
    '13 (list notes): an empty note does not open at three lines - ' + lnoteLines.join(',')
  );

  await d.type(LIST_PH, Array.from({ length: 8 }, (_, i) => 'строка ' + i).join('\n'));
  lnoteLines = await boxLines();
  ok(
    lnoteLines[0] >= 8,
    '13 (list notes): the public field did not grow to fit the text - ' + lnoteLines[0]
  );
  ok(
    lnoteLines[1] === 3,
    '13 (list notes): the neighbouring field grew along with it - ' + lnoteLines[1]
  );

  await d.type(LIST_PH, Array.from({ length: 80 }, (_, i) => 'строка ' + i).join('\n'));
  const tall = await page.$eval('.lnote .n-pub textarea', (t) => ({
    h: t.offsetHeight,
    over: t.scrollHeight > t.clientHeight
  }));
  ok(tall.h <= 320, '13 (list notes): the field grew past its ceiling - ' + tall.h);
  ok(tall.over, '13 (list notes): past the ceiling the text should scroll');

  await d.type(LIST_PH, 'одна строка');
  lnoteLines = await boxLines();
  ok(
    lnoteLines[0] === 3,
    '13 (list notes): the field did not return to three lines - ' + lnoteLines[0]
  );

  const crossVisible = await page.evaluate(() =>
    [...document.querySelectorAll('.lnote .note-x')].map((x) => getComputedStyle(x).display)
  );
  ok(
    crossVisible.length === 2 && crossVisible[0] !== 'none' && crossVisible[1] === 'none',
    '13 (list notes): the clear cross is shown on the wrong field - ' + crossVisible.join(',')
  );

  await ctx.close();
}

/** 14. A roll replaces its card's <img>, as the live app does - it rebuilds
 *  #view.innerHTML on every render, so a new record's picture is always a
 *  brand-new node that paints empty and fills; `RollPanel.svelte`'s
 *  `{#key shown.it}` (issue 47) reproduces that. Node identity
 *  is the only instrument that can see a transient a settled screenshot never
 *  catches, and `OrGrid.svelte`'s own `{#key cell.it}` - three of the four
 *  call sites - is `orGrid.test.ts`'s. Rolling the *same* record twice
 *  legitimately keeps the node (the image is identical, so nothing visible
 *  differs), which is why this presses in a loop rather than once - capped
 *  well above what chance should ever need across 119 rows. */
async function rollReplacesCardImg() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/roll/wondrous');
  const marked = await page.evaluate(() => {
    const img = document.querySelector('.results .card-media img');
    if (img) img.setAttribute('data-mark', '1');
    return !!img;
  });
  ok(
    marked,
    '14 (roll card): the original <img> was not found - was .results .card-media img renamed?'
  );
  const rollName = await page.evaluate(() => {
    const btn = document.querySelector('.numrow button.primary');
    return btn ? (btn.textContent || '').replace(/\s+/g, ' ').trim() : '';
  });
  ok(!!rollName, '14 (roll card): the roll button was not found');

  let replaced = false;
  for (let i = 0; rollName && i < 20 && !replaced; i++) {
    await d.press(rollName);
    replaced = await page.evaluate(
      () => !document.querySelector('.results .card-media img[data-mark]')
    );
  }
  ok(replaced, '14 (roll card): the <img> node survived a roll onto a different record');
  await ctx.close();
}

/** 15. Real history - Back/Forward, not only the hash changing, ported
 *  from the legacy `behave.js`. */
async function historyBackForward() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/roll/std');
  await page.evaluate(() => {
    location.hash = '#/tables/eq_armor';
  });
  await d.settle();
  await page.evaluate(() => {
    location.hash = '#/search';
  });
  await d.settle();
  await page.goBack();
  await d.settle();
  const chip = await page.evaluate(
    () => document.querySelector('.subchips .chip.on')?.textContent
  );
  ok(chip === 'Броня', '15 (navigation): back returned the wrong table - ' + chip);
  await page.goForward();
  await d.settle();
  /* The live `#sq` has no ported id - `input[type=search]` is the driver's
   * own structural stand-in (driver.js's `typeAt` doc comment). */
  const hasSearch = await d.count('input[type="search"]');
  ok(hasSearch > 0, '15 (navigation): forward did not return to search');
  await ctx.close();
}

/** 16. The selection bar pinned to the viewport bottom, and its buttons not
 *  spilling at 360, ported from the legacy `select.js` and `craftmob.js`. */
async function selectionBarGeometry() {
  const { ctx, page, d } = await fresh({ width: 1000, height: 900 });
  await d.open('#/tables/core_item');
  await d.tick('Первоклассный Спальный Мешок');
  const gap = await page.evaluate(() => {
    const w = document.querySelector('.selbarwrap');
    return w ? Math.abs(w.getBoundingClientRect().bottom - window.innerHeight) : null;
  });
  ok(
    gap !== null && gap <= 2,
    '16 (selection bar): the bar is not pinned to the window bottom - ' + gap
  );
  await ctx.close();

  const { ctx: ctx2, page: page2, d: d2 } = await fresh({ width: 360, height: 840 });
  await d2.open('#/tables/core_item');
  await d2.tick('Первоклассный Спальный Мешок');
  const spill = await page2.evaluate((w) => {
    const out = [];
    document.querySelectorAll('.selbarwrap .btn').forEach((b) => {
      const r = b.getBoundingClientRect();
      if (b.scrollWidth > b.clientWidth + 1) out.push('label clipped: ' + b.textContent.trim());
      if (r.left < -1 || r.right > w + 1)
        out.push('button off the edge of the screen: ' + b.textContent.trim());
    });
    return out;
  }, 360);
  ok(spill.length === 0, '16 (selection bar, 360px): ' + spill.join('; '));
  await ctx2.close();
}

/** 17. A real HTML5 drag reorder, ported from the legacy `lists2.js`. */
async function dragReorder() {
  const seedIds = ['ci1', 'ci2', 'ci3', 'ci4'];
  const { ctx, page, d } = await fresh({
    width: 1180,
    height: 900,
    storage: {
      'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'Тайник', ids: seedIds, created: 1 }])
    }
  });
  await d.open('#/lists/a');
  /* Three round trips, not one: `app/src/ports/drag.ts`'s handlers write to
   * `$state`, and Svelte's own microtask-scheduled flush (CLAUDE.md, the
   * `queueMicrotask` note) has not necessarily run by the time a *single*
   * `page.evaluate()` call's own script returns - unlike the live app's
   * imperative classList write, which the legacy lists2.js could read back
   * in the same call. Splitting dispatch from read across separate CDP round trips
   * gives the flush somewhere to happen. */
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.lrow')];
    const grip = rows[0].querySelector('[data-drag]');
    const dt = new DataTransfer();
    window.__dragDT = dt;
    grip.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
  });
  await d.settle();

  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.lrow')];
    const box = rows[2].getBoundingClientRect();
    rows[2].dispatchEvent(
      new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: window.__dragDT,
        clientY: box.top + box.height - 2
      })
    );
  });
  await d.settle();
  const dragged = await page.evaluate(() => document.querySelectorAll('.lrow')[2].className);
  ok(
    /drop-after/.test(dragged),
    '17 (drag reorder): the drop position is not highlighted - ' + dragged
  );

  /* Defect 2 (git log --grep=dnd2): a `dragenter` fired crossing into one
   * of row 2's own children - not only a `dragover` - must be prevented
   * too, or the drop is refused until the next throttled `dragover`
   * restores it (docs/specs/FEATURES.md, "Lists"). */
  const enterPrevented = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.lrow')];
    const child = rows[2].querySelector('input, textarea, button, svg') || rows[2];
    const box = rows[2].getBoundingClientRect();
    const e = new DragEvent('dragenter', {
      bubbles: true,
      cancelable: true,
      dataTransfer: window.__dragDT,
      clientY: box.top + box.height - 2
    });
    child.dispatchEvent(e);
    return e.defaultPrevented;
  });
  ok(
    enterPrevented,
    "17 (drag reorder): a dragenter crossing into a row's own child is not prevented"
  );

  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.lrow')];
    const box = rows[2].getBoundingClientRect();
    rows[2].dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: window.__dragDT,
        clientY: box.top + box.height - 2
      })
    );
  });
  await d.settle();
  const order = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('dhloot.lists.v2') || '[]');
    const list = stored.find((l) => l.id === 'a');
    return list ? list.ids.join(',') : '';
  });
  ok(order === 'ci2,ci3,ci1,ci4', '17 (drag reorder): final order ' + order);
  const stillDragging = await d.count('.lrow.dragging');
  ok(stillDragging === 0, '17 (drag reorder): the row remained in the dragging state');

  /* The dead zone the human reported: a release aimed inside the real 8px
   * `.rows` gap between two rows must land there too, with both rows beside
   * it marked at once - "after 2" and "before 3" are one insertion point.
   * The `dragover`/`drop` fire on `document` itself, not on a row: the gap
   * is not any one row's own element to target, and the port's capturing
   * document listener sees it either way. */
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.lrow')];
    const grip = rows[0].querySelector('[data-drag]');
    const dt = new DataTransfer();
    window.__dragDT = dt;
    grip.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
  });
  await d.settle();

  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.lrow')];
    const clientY = rows[2].getBoundingClientRect().bottom + 4;
    document.dispatchEvent(
      new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: window.__dragDT,
        clientY
      })
    );
  });
  await d.settle();
  const gapMarks = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.lrow')];
    return [rows[2].className, rows[3].className];
  });
  ok(
    /drop-after/.test(gapMarks[0]) && /drop-before/.test(gapMarks[1]),
    '17 (drag reorder): the gap between two rows is not marked on both sides - ' +
      gapMarks.join(' | ')
  );

  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.lrow')];
    const clientY = rows[2].getBoundingClientRect().bottom + 4;
    document.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: window.__dragDT,
        clientY
      })
    );
  });
  await d.settle();
  const gapOrder = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('dhloot.lists.v2') || '[]');
    const list = stored.find((l) => l.id === 'a');
    return list ? list.ids.join(',') : '';
  });
  ok(gapOrder === 'ci3,ci1,ci2,ci4', '17 (drag reorder): gap-drop final order ' + gapOrder);

  /* Leaving the drag with no `drop` - Escape, or a release outside the zone
   * - must change nothing and clear both marks. */
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.lrow')];
    const grip = rows[0].querySelector('[data-drag]');
    const dt = new DataTransfer();
    window.__dragDT = dt;
    grip.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
  });
  await d.settle();

  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.lrow')];
    const clientY = rows[2].getBoundingClientRect().bottom + 4;
    document.dispatchEvent(
      new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: window.__dragDT,
        clientY
      })
    );
  });
  await d.settle();

  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.lrow')];
    const grip = rows[0].querySelector('[data-drag]');
    grip.dispatchEvent(
      new DragEvent('dragend', { bubbles: true, dataTransfer: window.__dragDT })
    );
  });
  await d.settle();

  const cancelledOrder = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('dhloot.lists.v2') || '[]');
    const list = stored.find((l) => l.id === 'a');
    return list ? list.ids.join(',') : '';
  });
  ok(
    cancelledOrder === gapOrder,
    '17 (drag reorder): a cancelled drag changed the order - ' + cancelledOrder
  );
  const leftoverMarks = await d.count('.lrow.drop-before, .lrow.drop-after');
  ok(leftoverMarks === 0, '17 (drag reorder): a cancelled drag left a mark behind');

  /* Outside the zone a live drag is refused, over the list's own note too,
   * which would otherwise take the row's `text/plain` index as text. */
  if (!(await page.evaluate(() => document.querySelector('.lnote')?.open))) {
    await d.press('Заметки');
  }
  await page.evaluate(() => {
    const grip = document.querySelector('.lrow [data-drag]');
    const dt = new DataTransfer();
    window.__dragDT = dt;
    grip.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
  });
  await d.settle();
  const overNote = await page.evaluate(() => {
    const ta = document.querySelector('.lnote textarea');
    const r = ta.getBoundingClientRect();
    const e = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      dataTransfer: window.__dragDT,
      clientX: r.x + r.width / 2,
      clientY: r.y + r.height / 2
    });
    ta.dispatchEvent(e);
    const out = { prevented: e.defaultPrevented, effect: window.__dragDT.dropEffect };
    document
      .querySelector('.lrow [data-drag]')
      .dispatchEvent(
        new DragEvent('dragend', { bubbles: true, dataTransfer: window.__dragDT })
      );
    return out;
  });
  ok(
    overNote.prevented && overNote.effect === 'none',
    '17 (drag reorder): a dragover on the list note is not refused - ' +
      JSON.stringify(overNote)
  );

  await ctx.close();

  /* Defect 1 (git log --grep=dnd2): an inset box-shadow paints below its
   * element's children, and an open note box is `.rnote`, a row's own last
   * child, so it used to cover the bottom gold line entirely
   * (docs/specs/FEATURES.md, "Lists"). A note on every row opens every box
   * by default (`boxHidden` in ListPage.svelte); a 200x3 px strip at a
   * `drop-after` row's bottom edge should then read mostly `--gold`
   * (`216,171,94`), at the end of the list and in the middle of it.
   * Viewport height 1600, not 900: the port's own 120px edge-scroll band
   * moves the page under a probe placed any closer to either edge - the
   * measured harness trap at docs/specs/COVERAGE.md, "app/states - the
   * drag pixel probe's viewport trap"; the 400/600 pass value is measured
   * at docs/DECISIONS.md, "A drop indicator redraws...". */
  const notedIds = ['ci1', 'ci2', 'ci3', 'ci4'];
  const {
    ctx: noteCtx,
    page: notePage,
    d: noteD
  } = await fresh({
    width: 1180,
    height: 1600,
    storage: {
      'dhloot.lists.v2': JSON.stringify([
        {
          id: 'a',
          name: 'Тайник',
          ids: notedIds,
          created: 1,
          meta: Object.fromEntries(notedIds.map((id) => [id, { note: 'x' }]))
        }
      ])
    }
  });
  await noteD.open('#/lists/a');

  /** Gold pixels (within 24/255 of `--gold`, `216,171,94`) in a 200x3 px
   *  strip at row `i`'s bottom edge - the same probe docs/DECISIONS.md,
   *  "A drop indicator redraws...", measured against `dist/`. */
  async function goldStripAt(i) {
    /* `getBoundingClientRect()` returns a `DOMRect` whose fields are
       prototype getters, not own properties - puppeteer's own JSON
       serialization drops them, so the return value has to be a plain
       object built from them, not the `DOMRect` itself. */
    const rect = await notePage.evaluate((idx) => {
      const r = document.querySelectorAll('.lrow')[idx].getBoundingClientRect();
      return { x: r.x, y: r.bottom - 3, width: 200, height: 3, sx: scrollX, sy: scrollY };
    }, i);
    const clip = pageClip(rect);
    const png = PNG.sync.read(await notePage.screenshot({ type: 'png', clip }));
    let n = 0;
    for (let p = 0; p < png.width * png.height; p++) {
      const r = png.data[p * 4];
      const g = png.data[p * 4 + 1];
      const b = png.data[p * 4 + 2];
      if (Math.abs(r - 216) <= 24 && Math.abs(g - 171) <= 24 && Math.abs(b - 94) <= 24) n++;
    }
    return n;
  }

  await notePage.evaluate(() => {
    const rows = [...document.querySelectorAll('.lrow')];
    const grip = rows[0].querySelector('[data-drag]');
    const dt = new DataTransfer();
    window.__dragDT = dt;
    grip.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
  });
  await noteD.settle();

  // Mid-list: row 2 marked drop-after, note open.
  await notePage.evaluate(() => {
    const rows = [...document.querySelectorAll('.lrow')];
    const box = rows[2].getBoundingClientRect();
    rows[2].dispatchEvent(
      new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: window.__dragDT,
        clientY: box.top + box.height - 2
      })
    );
  });
  await noteD.settle();
  const midGold = await goldStripAt(2);
  ok(
    midGold > 300,
    '17 (drag reorder): an open note box hides the gold line mid-list - ' + midGold + '/600'
  );

  /* Defect superseded (git log --grep=dnd4, was dnd3): the mark used to fade
   * in over 150ms, and `.rnote`'s copy of the fade used to lag `.row`'s -
   * fixed by making the whole mark instant instead: `.row`'s transition list
   * is narrowed off `box-shadow` (so the base half no longer fades) and
   * `.rnote` is left with no transition of its own (so the redrawn half does
   * not either). `prepare()` emulates `prefers-reduced-motion: reduce` for
   * every case, and `tokens.css`'s blanket kill
   * forces every `transition-duration` to `0s` under it, which would make a
   * duration read here vacuous - true before this fix and after it alike
   * (COVERAGE.md, "app/states"). `transition-property` is not flattened by
   * that emulation, so `.row`'s is read directly; `.rnote`'s box-shadow
   * transition is checked by duration instead, with the emulation briefly
   * switched to `no-preference` for the one read, since an element with no
   * declared transition also reports `transition-property: all` by the CSS
   * default, which a property check cannot tell apart from `.row`'s old
   * shorthand. Restored after: the suite shares one page and a later case
   * must still see `reduce`. */
  await notePage.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: 'no-preference' }
  ]);
  let gapTransitions;
  try {
    gapTransitions = await notePage.evaluate(() => {
      const row = document.querySelectorAll('.lrow')[2];
      const rnote = row.querySelector('.rnote');
      return {
        rowProperty: getComputedStyle(row).transitionProperty,
        rnoteDuration: rnote ? getComputedStyle(rnote).transitionDuration : null
      };
    });
  } finally {
    await notePage.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  }
  const rowProps = gapTransitions.rowProperty.split(',').map((s) => s.trim());
  ok(
    !rowProps.includes('all') &&
      !rowProps.includes('box-shadow') &&
      rowProps.includes('border-color'),
    '17 (drag reorder): the row still transitions box-shadow, so the mark fades in - ' +
      JSON.stringify(gapTransitions)
  );
  ok(
    gapTransitions.rnoteDuration === '0s',
    '17 (drag reorder): the noted row half of the mark still fades in - ' +
      JSON.stringify(gapTransitions)
  );

  // End of the list: the last row marked drop-after, note open.
  await notePage.evaluate(() => {
    const rows = [...document.querySelectorAll('.lrow')];
    const clientY = rows[3].getBoundingClientRect().bottom + 4;
    document.dispatchEvent(
      new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: window.__dragDT,
        clientY
      })
    );
  });
  await noteD.settle();
  const endGold = await goldStripAt(3);
  ok(
    endGold > 300,
    '17 (drag reorder): an open note box hides the gold line at the end of the list - ' +
      endGold +
      '/600'
  );

  await notePage.evaluate(() => {
    const rows = [...document.querySelectorAll('.lrow')];
    const grip = rows[0].querySelector('[data-drag]');
    grip.dispatchEvent(
      new DragEvent('dragend', { bubbles: true, dataTransfer: window.__dragDT })
    );
  });
  await noteCtx.close();
}

/** 18. A folded `<details>` surviving a select-all/money-mode re-render,
 *  ported from the legacy `lists2.js`. */
async function foldedDetailsSurviveRerender() {
  const { ctx, page, d } = await fresh({
    width: 1180,
    height: 900,
    storage: {
      'dhloot.lists.v2': JSON.stringify([
        {
          id: 'a',
          name: 'Тайник',
          ids: ['ci1', 'ci2', 'ci3'],
          created: 1,
          meta: { ci1: { gold: 70 } }
        }
      ])
    }
  });
  await d.open('#/lists/a');
  await page.$eval('.lnote', (e) => {
    e.open = false;
  });
  await page.$eval('.lroll', (e) => {
    e.open = false;
  });
  await d.settle();

  const openState = () =>
    page.evaluate(() => ({
      note: document.querySelector('.lnote')?.open,
      roll: document.querySelector('.lroll')?.open
    }));

  await page.evaluate(() => document.querySelector('.batch-all input')?.click());
  await d.settle();
  let open1 = await openState();
  ok(
    open1.note === false && open1.roll === false,
    '18 (folded panels): "select all" unfolded something folded - ' + JSON.stringify(open1)
  );

  await d.click('Монетами');
  const open2 = await openState();
  ok(
    open2.note === false && open2.roll === false,
    '18 (folded panels): switching price mode unfolded something folded - ' +
      JSON.stringify(open2)
  );
  await ctx.close();
}

/** 19. Tile geometry with no art loaded - `/img/*.webp` left unanswered by
 *  request interception, never aborted and never continued, ported from
 *  the legacy `qa.js`. The service worker is bypassed for the reason case 11
 *  gives: a worker fetch escapes the interception. */
async function tileGeometryNoArt() {
  const { ctx, page, d } = await fresh({ width: 360, height: 800 });
  await page.setBypassServiceWorker(true);
  await page.setRequestInterception(true);
  const onReq = (req) => {
    if (/\/img\/.*\.webp$/.test(req.url())) return; // deliberately left hanging
    req.continue();
  };
  page.on('request', onReq);
  /* Not d.open(): its networkidle0 wait would never settle with a request
   * left permanently in flight. domcontentloaded, same as qa.js's own go(). */
  await page.goto('about:blank');
  await page.goto(TARGETS.next + '#/tables/eq_weapon', { waitUntil: 'domcontentloaded' });
  await ready(page);
  await d.press('Сеткой');
  await new Promise((r) => setTimeout(r, 700));
  const widths = await page.$$eval('.tilewrap .tile', (e) => [
    ...new Set(e.map((x) => Math.round(x.getBoundingClientRect().width)))
  ]);
  ok(
    widths.length === 1 && widths[0] > 100,
    '19 (tiles with no pictures): widths ' + widths.join(', ')
  );
  const clash = await page.$$eval(
    '.tilewrap',
    (e) =>
      e.filter((w) => {
        const n = w.querySelector('.tile-n');
        if (!n) return false;
        const a = w.querySelector('.selbox').getBoundingClientRect();
        const b = n.getBoundingClientRect();
        return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      }).length
  );
  ok(
    clash === 0,
    '19 (tiles with no pictures): the checkbox overlaps the label on ' + clash + ' tiles'
  );
  page.off('request', onReq);
  await ctx.close();
}

/** 20. The storage notice folded on a phone, ported from the legacy `qa.js`. */
async function storageNoticeAt320() {
  const { ctx, page, d } = await fresh({
    width: 320,
    height: 700,
    storage: {
      'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'Клад', ids: ['ci1'], created: 1 }])
    }
  });
  await d.open('#/lists/a');
  const warn = await page.evaluate(() => {
    const w = document.querySelector('.warn');
    const x = document.querySelector('.warn-x');
    if (!w || !x) return null;
    return { h: w.getBoundingClientRect().height, xw: x.getBoundingClientRect().width };
  });
  ok(!!warn, '20 (warning at 320): .warn not found');
  if (warn) {
    ok(
      warn.h < 140,
      '20 (warning at 320): the folded warning takes up ' + Math.round(warn.h) + 'px'
    );
    ok(
      warn.xw > 0,
      '20 (warning at 320): the cross is not visible while the warning is folded'
    );
  }
  await ctx.close();
}

/** 21. A button keeps focus across a re-render - not only an input (case
 *  12), ported from the legacy `qa.js`. */
async function buttonFocusSurvivesRerender() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/roll/std');
  await page.evaluate(() => document.querySelector('.dicebar button')?.focus());
  await page.keyboard.press('Enter');
  await d.settle();
  const afterRoll = await page.evaluate(() => {
    const a = document.activeElement;
    return a instanceof HTMLElement && !!a.closest('.dicebar') && a.tagName === 'BUTTON';
  });
  ok(afterRoll, '21 (button focus): after a keyboard roll, focus left the button');

  await page.evaluate(() => document.querySelector('.chip[data-val="core"]')?.focus());
  await page.keyboard.press('Enter');
  await d.settle();
  const afterSrc = await page.evaluate(() => {
    const a = document.activeElement;
    return a instanceof HTMLElement && a.matches('.chip[data-val="core"]');
  });
  ok(afterSrc, '21 (source focus): focus was lost after switching source');
  await ctx.close();
}

/** 22. The money help box measured against its container, and the pressed
 *  add-to-list button's own colour, ported from the legacy `lists2.js`. */
async function moneyHelpAndPressedPicker() {
  const { ctx, page, d } = await fresh({
    width: 1180,
    height: 900,
    storage: {
      'dhloot.lists.v2': JSON.stringify([
        { id: 'a', name: 'Клад', ids: ['ci1'], created: 1, meta: { ci1: { gold: 70 } } }
      ])
    }
  });
  await d.open('#/lists/a');
  await d.press('Как это работает');
  const helpBox = await page.evaluate(() => {
    const h = document.querySelector('.money-help');
    /* The rewrite has no global `.wrap` container (SelBar.svelte's own
     * comment) - every frame element composes the same width off `--wrap`
     * instead, `main` (Shell.svelte) included, which is what the help box
     * sits inside here. */
    const c = document.querySelector('main');
    if (!h || !c) return null;
    return {
      box: h.classList.contains('helpbox'),
      w: h.getBoundingClientRect().width,
      cw: c.getBoundingClientRect().width
    };
  });
  ok(!!helpBox, '22 (help and list pick): .money-help did not open');
  if (helpBox) {
    ok(helpBox.box, '22 (help and list pick): the gold help is not the right frame');
    ok(
      Math.abs(helpBox.w - helpBox.cw) < 2,
      '22 (help and list pick): the gold help is not the width of its container - ' +
        helpBox.w +
        ' of ' +
        helpBox.cw
    );
  }
  await ctx.close();

  const { ctx: ctx2, page: page2, d: d2 } = await fresh({ width: 1180, height: 900 });
  await d2.open('#/tables/wondrous');
  await d2.open('#/i/w3');
  await d2.press('Добавить в список');
  const btn = await page2.evaluate(() => {
    const b = document.querySelector('.cardpick .btn');
    return b ? { on: b.classList.contains('on'), color: getComputedStyle(b).color } : null;
  });
  ok(!!btn, '22 (help and list pick): the .cardpick .btn button was not found');
  if (btn) {
    ok(btn.on, '22 (help and list pick): the pressed button is not marked on');
    ok(
      btn.color !== 'rgb(99, 194, 148)',
      '22 (help and list pick): the pressed button is teal again - ' + btn.color
    );
  }
  await ctx2.close();
}

/** 24. The real reduced-motion policy - every transition and
 *  animation dies under `prefers-reduced-motion: reduce`, not only the
 *  card's entrance and the section outline's fade `RecordCard.svelte`/
 *  `TablesPage.svelte` killed by name. Explicit here even though `prepare()`
 *  already emulates the same media feature for every other case
 *  (`driver.js`'s own comment: the blanket kill is the app's shipped behaviour for a
 *  visitor who asked for less motion, and this is what makes every suite
 *  exercise that branch, not a timing convenience) - this is the one case
 *  whose whole point is proving the policy itself, not relying on it as a
 *  side effect of something else. Hovers a button (the transition class) and
 *  crosses the 600px breakpoint (the responsive class) in the same pass,
 *  and every delay is zeroed too. */
async function reducedMotionKillsEverything() {
  const { ctx, page, d } = await fresh({ width: 900, height: 900 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await d.open('#/roll/std');
  await page.hover('button');
  await d.viewport(560, 900);
  await new Promise((r) => setTimeout(r, 80));
  const running = await page.evaluate(() => document.getAnimations().length);
  ok(
    running === 0,
    '24 (reduced motion): animations are still running under reduce - ' + running
  );
  const delays = await page.evaluate(() => {
    const el = document.createElement('div');
    el.style.cssText = 'transition: opacity 1s 1s; animation: none 1s 1s';
    document.body.append(el);
    const cs = getComputedStyle(el);
    const out = { transitionDelay: cs.transitionDelay, animationDelay: cs.animationDelay };
    el.remove();
    return out;
  });
  ok(
    delays.transitionDelay === '0s' && delays.animationDelay === '0s',
    '24 (reduced motion): a delay survives reduce - ' + JSON.stringify(delays)
  );
  await ctx.close();
}

/** 25. The storage-notice dismiss button stays hit-testable while its
 *  `<details>` is folded - real-browser coverage of exactly the regression
 *  class the sibling-button fix could only be verified against by eye: jsdom does
 *  not implement `<details>`'s native closed-content suppression at all, so
 *  every vitest test for the dismiss button passed against the *old*,
 *  button-hidden structure the first time it was tried. `.warn-x` is a
 *  sibling of `<details>`, not a child (StorageNotice.svelte), so folding
 *  the disclosure must not hide or unhit-test it. */
async function storageNoticeDismissWhileFolded() {
  const { ctx, page, d } = await fresh({ width: 1280, height: 900, storage: ONE_LOCAL });
  await d.open('#/lists');
  const open = await page.evaluate(() => document.querySelector('.warn details')?.open ?? null);
  ok(open === false, '25 (notice dismiss while folded): <details> is not closed on arrival');
  const box = await page.evaluate(() => {
    const x = document.querySelector('.warn-x');
    if (!x) return null;
    const r = x.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  ok(!!box, '25 (notice dismiss while folded): .warn-x not found');
  if (box) {
    ok(
      box.w > 0 && box.h > 0,
      '25 (notice dismiss while folded): .warn-x has zero size (' + box.w + 'x' + box.h + ')'
    );
    const hit = await page.evaluate(
      (cx, cy) => !!document.elementFromPoint(cx, cy)?.closest('.warn-x'),
      box.x + box.w / 2,
      box.y + box.h / 2
    );
    ok(
      hit,
      '25 (notice dismiss while folded): the center of .warn-x is not hit-testable there'
    );
  }
  await ctx.close();
}

/** 26. Two device-capability defects fixed together (git log --grep=dnd4):
 *  a completed reorder was announced nowhere, and the drag grip stayed drawn
 *  on a device that can never start an HTML5 drag from a touch. Both read
 *  through a touch-emulated viewport - `page.emulateMediaFeatures` cannot
 *  move `hover`/`pointer` at all (docs/specs/COVERAGE.md, "app/states - two
 *  harness facts a device-capability case runs into"), only
 *  `setViewport({ isMobile, hasTouch })` does - and a second, untouched
 *  viewport proves the grip is not hidden by width alone. */
async function announceOnTouchAndHideInertGrip() {
  const seed = {
    'dhloot.lists.v2': JSON.stringify([
      { id: 'a', name: 'Тайник', ids: ['ci1', 'ci2', 'ci3', 'ci4'], created: 1 }
    ])
  };

  const { ctx, page, d } = await fresh({ width: 390, height: 900, storage: seed });
  await page.setViewport({ width: 390, height: 900, isMobile: true, hasTouch: true });
  await d.open('#/lists/a');

  const grip = await page.evaluate(() => {
    const g = document.querySelector('.lrow-grip');
    return g && getComputedStyle(g).display;
  });
  ok(grip === 'none', '26 (touch device): the drag grip is still drawn - display ' + grip);

  await page.evaluate(() => {
    const pos = document.querySelectorAll('.lrow-n')[3];
    pos.value = '1';
    pos.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await d.settle();

  const said = await page.evaluate(() => {
    const r = document.querySelector('.lsaid');
    if (!r) return null;
    const rect = r.getBoundingClientRect();
    return {
      text: r.textContent,
      role: r.getAttribute('role'),
      position: getComputedStyle(r).position,
      w: rect.width,
      h: rect.height
    };
  });
  ok(!!said, '26 (announce on touch): the live region .lsaid was not found');
  if (said) {
    ok(
      said.role === 'status' && (said.text ?? '').includes('позиция 1 из 4'),
      '26 (announce on touch): the region did not announce the move - ' + JSON.stringify(said)
    );
    ok(
      said.position === 'absolute' && said.w <= 1 && said.h <= 1,
      '26 (announce on touch): the region is visible on screen - ' + JSON.stringify(said)
    );
  }
  await ctx.close();

  const {
    ctx: ctx2,
    page: page2,
    d: d2
  } = await fresh({ width: 1180, height: 900, storage: seed });
  await d2.open('#/lists/a');
  const gripHover = await page2.evaluate(() => {
    const g = document.querySelector('.lrow-grip');
    return g && getComputedStyle(g).display;
  });
  ok(
    gripHover === 'flex',
    '26 (no touch): the drag grip is hidden on a device that can hover - display ' + gripHover
  );
  await ctx2.close();
}

/** 27. At 50 lists the menu keeps its label, search and «+ Новый список» in
 *  view and scrolls only its chips; the lists holding the record lead
 *  (docs/specs/FEATURES.md, "Lists"). */
async function listMenuKeepsItsControlsInView() {
  const seed = {
    'dhloot.lists.v2': JSON.stringify(
      Array.from({ length: 50 }, (_, i) => ({
        id: 'm' + String(i),
        name: 'Лавка ' + String(i + 1),
        ids: i % 10 === 0 ? ['ci1'] : [],
        created: i + 1
      }))
    )
  };
  for (const [width, height] of [
    [1100, 900],
    [360, 740]
  ]) {
    const at = '27 (' + String(width) + '): ';
    const { ctx, page, d } = await fresh({ width, height, storage: seed });
    await d.open('#/i/ci1', { as: 'gm2' });
    await d.press('Добавить в список');
    await d.settle();

    const m = await page.evaluate(() => {
      /* `shown`: what a press at the centre reaches - a clipping ancestor
         can hide a box that still reads inside the menu and the window. */
      const box = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return { x: r.x, y: r.y, w: r.width, h: r.height, shown: !!hit && el.contains(hit) };
      };
      const menu = document.querySelector('.dropmenu');
      const chips = menu?.querySelector('.pickchips');
      const newChip = [...(menu?.querySelectorAll(':scope > .chip') ?? [])].find(
        (c) => c.textContent === '+ Новый список'
      );
      return {
        menu: box(menu),
        search: box(menu?.querySelector('input[type="search"]')),
        newChip: box(newChip),
        scrolls: !!chips && chips.scrollHeight > chips.clientHeight,
        firstOn: [...(chips?.querySelectorAll('.chip') ?? [])]
          .slice(0, 6)
          .map((c) => c.classList.contains('on')),
        view: { x: 0, y: 0, w: innerWidth, h: innerHeight }
      };
    });
    ok(!!m.menu, at + 'the menu did not open');
    if (m.menu) {
      ok(m.menu.h <= 342, at + 'the menu is ' + String(m.menu.h) + ' px tall, over 342');
      for (const [name, b] of [
        ['the search box', m.search],
        ['«+ Новый список»', m.newChip]
      ]) {
        ok(
          !!b && inside(b, m.menu),
          at + name + ' lies outside the menu - ' + JSON.stringify(b)
        );
        ok(
          !!b && inside(b, m.view),
          at + name + ' lies outside the window - ' + JSON.stringify(b)
        );
        ok(!!b && b.shown, at + name + ' is covered or clipped - ' + JSON.stringify(b));
      }
    }
    ok(m.scrolls, at + 'the chips do not scroll on their own');
    ok(
      JSON.stringify(m.firstOn) === JSON.stringify([true, true, true, true, true, false]),
      at + 'the five lists holding the record do not lead - ' + JSON.stringify(m.firstOn)
    );

    await d.type('Найти список', 'Шкатулка');
    await d.press('+ Новый список');
    const input = await page.evaluate(() => {
      const el = document.querySelector('.picker-new input[type="text"]');
      return el && { value: el.value, focused: el === document.activeElement };
    });
    ok(
      !!input && input.value === 'Шкатулка' && input.focused,
      at + 'the new-list input does not hold the query with focus - ' + JSON.stringify(input)
    );
    await ctx.close();
  }
}

/** 28. The minimal worker over http: it registers, controls the page after
 *  one reload, deletes the retired shell cache, and caches the hashed build
 *  files but never the document or `data.js`. The manifest parses, the page
 *  is installable, both install guides are installable on their own
 *  before the app loads, and the footer links the install guide and the two
 *  policy pages, which the server answers (docs/specs/META.md section 9,
 *  FEATURES.md, "Chrome"). */
async function minimalWorker() {
  const at = '28 (minimal worker): ';
  const { ctx, page } = await fresh({ width: 1180, height: 900 });
  try {
    const root = baseUrl();
    /* A site page registers no worker: the retired cache is seeded on the
       origin before the app's first load. */
    await page.goto(root + 'pages/install.html', { waitUntil: 'load' });
    await page.evaluate(() =>
      caches.open('dhloot-shell-v1').then((c) => c.put('./', new Response('old shell')))
    );
    const url = root + 'index.html#/roll/std';
    await page.goto(url, { waitUntil: 'load' });
    ok(
      await page.evaluate(() => navigator.serviceWorker.ready.then(() => true)),
      at + 'the service worker never became ready'
    );
    const manifestLinks = JSON.stringify(
      await page.evaluate(() =>
        [...document.head.querySelectorAll('link[rel="manifest"]')].map((l) =>
          l.getAttribute('href')
        )
      )
    );
    ok(
      manifestLinks === '["./manifest.webmanifest"]',
      at + 'the page does not carry exactly one manifest link - ' + manifestLinks
    );
    const footer = await page.evaluate(() =>
      [...document.querySelectorAll('.foot-nav a')].map((a) => a.getAttribute('href'))
    );
    ok(
      JSON.stringify(footer) ===
        JSON.stringify(['pages/install.html', 'pages/privacy.html', 'pages/terms.html']),
      at +
        'the footer does not link the install guide and the two policy pages - ' +
        JSON.stringify(footer)
    );
    /* The folded licence notice opens from the keyboard, with the focus ring
       drawn on its summary (FEATURES.md, "Chrome"). */
    await page.focus('footer details > summary');
    await page.keyboard.press('Enter');
    const licence = await page.evaluate(() => {
      const summary = document.querySelector('footer details > summary');
      const style = summary && getComputedStyle(summary);
      return {
        open: !!summary?.parentElement?.open,
        ring: !!style && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
      };
    });
    ok(
      licence.open && licence.ring,
      at +
        'the licence notice does not open from the keyboard with a focus ring - ' +
        JSON.stringify(licence)
    );
    for (const href of footer) {
      ok(
        await page.evaluate(
          (h) =>
            fetch(h)
              .then((r) => (r.status === 200 ? r.text() : ''))
              .then((body) => body.includes('id="app-page"')),
          href
        ),
        at + href + ' is not served beside the app'
      );
    }
    await page.reload({ waitUntil: 'load' });
    ok(
      await page.evaluate(() => navigator.serviceWorker.controller !== null),
      at + 'the page is not controlled after one reload'
    );
    const stored = await page.evaluate(async () => {
      const out = {};
      for (const name of await caches.keys()) {
        const c = await caches.open(name);
        out[name] = (await c.keys()).map((r) => new URL(r.url).pathname);
      }
      return out;
    });
    ok(
      !('dhloot-shell-v1' in stored),
      at +
        'the retired shell cache survived activation - ' +
        JSON.stringify(Object.keys(stored))
    );
    ok(
      (stored['dhloot-assets-v1'] || []).some((p) => /^\/assets\/index-[\w-]+\.js$/.test(p)),
      at +
        'the entry module was not cached after the controlled reload - ' +
        JSON.stringify(stored)
    );
    const paths = Object.values(stored).flat();
    ok(
      !paths.some((p) => p === '/' || p === '/index.html' || p === '/data.js'),
      at + 'the document or data.js was cached - ' + JSON.stringify(stored)
    );
    const cdp = await page.createCDPSession();
    const manifest = await cdp.send('Page.getAppManifest');
    ok(
      manifest.errors.length === 0 && manifest.url.endsWith('/manifest.webmanifest'),
      at + 'Chrome did not parse the manifest: ' + JSON.stringify(manifest.errors)
    );
    await cdp.detach();
    /* Installability is asked on a page in the browser's default context:
       Chrome answers `in-incognito` for `fresh()`'s own context whatever the
       site does. The worker it registers there is removed afterwards. */
    const shared = await sharedPage({ width: 1180, height: 900 });
    try {
      /* The guides go first, before the app registers the worker in this
         context: the manifest link alone makes a static page installable. */
      for (const guide of ['pages/install.html', 'pages/en/install.html']) {
        await shared.page.goto(root + guide, { waitUntil: 'load' });
        const guideCdp = await shared.page.createCDPSession();
        const m = await guideCdp.send('Page.getAppManifest');
        const { installabilityErrors: errs } = await guideCdp.send(
          'Page.getInstallabilityErrors'
        );
        await guideCdp.detach();
        fs.writeSync(
          1,
          at +
            guide +
            ' installability error ids: ' +
            JSON.stringify(errs.map((e) => e.errorId)) +
            '\n'
        );
        ok(
          m.errors.length === 0 && m.url === root + 'manifest.webmanifest',
          at +
            guide +
            ' does not link the manifest at the app root: ' +
            JSON.stringify({ url: m.url, errors: m.errors })
        );
        ok(
          errs.length === 0,
          at + 'Chrome finds ' + guide + ' not installable: ' + JSON.stringify(errs)
        );
      }
      await shared.page.goto(url, { waitUntil: 'load' });
      await shared.page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
      const sharedCdp = await shared.page.createCDPSession();
      const { installabilityErrors } = await sharedCdp.send('Page.getInstallabilityErrors');
      await sharedCdp.detach();
      fs.writeSync(
        1,
        at +
          'installability error ids: ' +
          JSON.stringify(installabilityErrors.map((e) => e.errorId)) +
          '\n'
      );
      ok(
        installabilityErrors.length === 0,
        at + 'Chrome finds the page not installable: ' + JSON.stringify(installabilityErrors)
      );
      await shared.page.evaluate(() =>
        navigator.serviceWorker.getRegistration().then((r) => r && r.unregister())
      );
    } finally {
      await shared.page.close();
    }
  } finally {
    await ctx.close();
  }
}

/** 29. The install guide links back to the screen the reader left, in both
 *  languages: from `#/lists` the top back link of `pages/install.html`
 *  (`../`) and of `pages/en/install.html` (`../../`) returns to
 *  `index.html#/lists`, and on a direct visit it opens the app root. The
 *  two policy pages draw the same back links in both languages, and
 *  `privacy` names the contact address (docs/specs/META.md section 9,
 *  "Static pages"). */
async function guideBackLink() {
  const at = '29 (guide back link): ';
  const { ctx, page } = await fresh({ width: 1180, height: 900 });
  let en = null;
  try {
    const root = baseUrl();
    for (const [dir, back] of [
      ['pages/', '../'],
      ['pages/en/', '../../']
    ]) {
      for (const id of ['privacy', 'terms']) {
        await page.goto(root + dir + id + '.html', { waitUntil: 'load' });
        const seen = await page.evaluate((b) => {
          const main = document.getElementById('app-page');
          const first = main && main.firstElementChild;
          const last = main && main.lastElementChild;
          return {
            backs:
              !!first &&
              first !== last &&
              [first, last].every((a) => a.matches('a.back') && a.getAttribute('href') === b),
            h1: !!main?.querySelector('h1'),
            mail: !!main?.querySelector('a[href="mailto:daggerheart.loot@gmail.com"]')
          };
        }, back);
        ok(
          seen.backs && seen.h1 && seen.mail,
          at +
            dir +
            id +
            '.html lacks its back links, its heading or the contact address - ' +
            JSON.stringify(seen)
        );
      }
    }
    await page.goto(root + 'index.html#/lists', { waitUntil: 'load' });
    await page.waitForSelector('.foot-nav a');
    await page.click('.foot-nav a');
    await page.waitForFunction(() => location.pathname.endsWith('/pages/install.html'));
    await page.waitForSelector('#app-page');
    ok(
      await page.evaluate(() => {
        const main = document.getElementById('app-page');
        const first = main.firstElementChild;
        const last = main.lastElementChild;
        return (
          first !== last &&
          [first, last].every((a) => a.matches('a.back') && a.getAttribute('href') === '../')
        );
      }),
      at + 'the guide does not draw a back link as the first and the last child of #app-page'
    );
    await page.click('#app-page > a.back');
    ok(
      await page
        .waitForFunction(
          () =>
            location.pathname === '/index.html' &&
            location.hash === '#/lists' &&
            !!document.querySelector('#app')?.childElementCount,
          { timeout: 30_000 }
        )
        .then(() => true)
        .catch(() => false),
      at + 'the back link did not return to index.html#/lists'
    );
    await page.goto(root + 'pages/install.html', { waitUntil: 'load' });
    await page.click('#app-page > a.back');
    ok(
      await page
        .waitForFunction(
          () =>
            location.pathname === '/' &&
            location.hash === '' &&
            !!document.querySelector('#app')?.childElementCount,
          { timeout: 30_000 }
        )
        .then(() => true)
        .catch(() => false),
      at + 'the back link on a direct visit did not open ../'
    );

    // prepare() clears storage on every document, so English needs its own seeded context.
    en = await fresh({ width: 1180, height: 900, lang: 'en' });
    const enPage = en.page;
    await enPage.goto(root + 'index.html#/lists', { waitUntil: 'load' });
    await enPage.waitForSelector('.foot-nav a');
    await enPage.click('.foot-nav a');
    await enPage.waitForFunction(() => location.pathname.endsWith('/pages/en/install.html'));
    await enPage.waitForSelector('#app-page');
    ok(
      await enPage.evaluate(() => {
        const main = document.getElementById('app-page');
        const first = main.firstElementChild;
        const last = main.lastElementChild;
        const second = first && first.nextElementSibling;
        return (
          first !== last &&
          [first, last].every(
            (a) => a.matches('a.back') && a.getAttribute('href') === '../../'
          ) &&
          !!second &&
          second.matches('nav.lang') &&
          second.querySelector('a')?.getAttribute('href') === '../install.html'
        );
      }),
      at +
        'the English guide does not draw its back links ("../../") first and last, with the language link second'
    );
    await enPage.click('#app-page > a.back');
    ok(
      await enPage
        .waitForFunction(
          () =>
            location.pathname === '/index.html' &&
            location.hash === '#/lists' &&
            !!document.querySelector('#app')?.childElementCount,
          { timeout: 30_000 }
        )
        .then(() => true)
        .catch(() => false),
      at + 'the English back link did not return to index.html#/lists'
    );
    await enPage.goto(root + 'pages/en/install.html', { waitUntil: 'load' });
    await enPage.click('#app-page > a.back');
    ok(
      await enPage
        .waitForFunction(
          () =>
            location.pathname === '/' &&
            location.hash === '' &&
            !!document.querySelector('#app')?.childElementCount,
          { timeout: 30_000 }
        )
        .then(() => true)
        .catch(() => false),
      at + 'the English back link on a direct visit did not open the app root'
    );
  } finally {
    if (en) await en.ctx.close();
    await ctx.close();
  }
}

/** 30. The note clear button's 44px target yields to the note textarea
 *  where the two overlap: a point just inside the textarea under the button
 *  hits the textarea, the button's own centre hits the button. */
async function noteClearTargetYieldsToTextarea() {
  const { ctx, page, d } = await fresh({
    width: 1180,
    height: 900,
    storage: {
      'dhloot.lists.v2': JSON.stringify([
        { id: 'a', name: 'Тайник', ids: ['ci1'], created: 1, note: 'текст' }
      ])
    }
  });
  await d.open('#/lists/a');
  /* A list with a note opens its note group already; a press would fold it. */
  if (!(await page.evaluate(() => document.querySelector('.lnote')?.open))) {
    await d.press('Заметки');
  }
  const hits = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.lnote .note-x')].find(
      (b) => getComputedStyle(b).display !== 'none'
    );
    if (!btn) return null;
    const ta = btn.closest('.nfield').querySelector('textarea');
    const b = btn.getBoundingClientRect();
    const t = ta.getBoundingClientRect();
    const cx = b.x + b.width / 2;
    const edge = document.elementFromPoint(cx, t.top + 3);
    const centre = document.elementFromPoint(cx, b.y + b.height / 2);
    return {
      overlap: b.y + b.height / 2 + 22 - t.top,
      edgeIsTextarea: !!edge && (edge === ta || ta.contains(edge)),
      centreIsButton: !!centre && (centre === btn || btn.contains(centre)),
      target: getComputedStyle(btn, '::after').width
    };
  });
  ok(!!hits, '30 (note clear target): no visible clear button on the list note');
  if (hits) {
    ok(hits.overlap > 3, '30 (note clear target): no overlap left to test - ' + hits.overlap);
    ok(
      hits.edgeIsTextarea,
      '30 (note clear target): the textarea edge under the button hits the button'
    );
    ok(
      hits.centreIsButton,
      '30 (note clear target): the button centre does not hit the button'
    );
    ok(
      hits.target === '44px',
      '30 (note clear target): the target is not 44px - ' + hits.target
    );
  }

  await ctx.close();
}

/** 31. The card image's focus ring is drawn, not clipped by the card, at
 *  both card sizes: a pixel read of a 3px band inside each edge of the
 *  focused `.card-media`, against the ring's own colour. At 600 px the full
 *  card scrolls the page, and the case asserts it, so the clip's scroll
 *  offset stays tested. */
async function cardMediaRingVisible() {
  async function ringAt(route, selector, label, mustScroll) {
    const { ctx, page, d } = await fresh({ width: 1180, height: 600 });
    await d.open(route);
    let reached = false;
    for (let i = 0; i < 80 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(
        (sel) => document.activeElement === document.querySelector(sel),
        selector
      );
    }
    ok(reached, '31 (card image focus ring, ' + label + '): Tab never reached ' + selector);
    if (reached) {
      /* `end`, not `center`: a 420 px card centred in 600 px starts under the
         sticky top bar (about 106 px), which hides the ring's top edge. */
      await page.evaluate(
        (sel) => document.querySelector(sel).scrollIntoView({ block: 'end' }),
        selector
      );
      const box = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        const r = el.getBoundingClientRect();
        const m = /rgba?\((\d+), (\d+), (\d+)/.exec(getComputedStyle(el).outlineColor);
        return {
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          sx: window.scrollX,
          sy: window.scrollY,
          rgb: m ? m.slice(1, 4).map(Number) : null
        };
      }, selector);
      const clip = pageClip(box);
      console.log('31 (card image focus ring, ' + label + '): scrollY ' + box.sy);
      if (mustScroll) {
        ok(
          box.sy > 0,
          '31 (card image focus ring, ' +
            label +
            '): the page did not scroll, so the clip offset is not tested'
        );
      }
      ok(!!box.rgb, '31 (card image focus ring, ' + label + '): no outline colour to match');
      if (!box.rgb) {
        await ctx.close();
        return;
      }
      const png = PNG.sync.read(await page.screenshot({ type: 'png', clip }));
      const near = (x, y) => {
        const p = (y * png.width + x) * 4;
        return [0, 1, 2].every((k) => Math.abs(png.data[p + k] - box.rgb[k]) <= 48);
      };
      const edges = {
        top: (x) => [0, 1, 2].some((dy) => near(x, dy)),
        bottom: (x) => [1, 2, 3].some((dy) => near(x, png.height - dy)),
        left: (y) => [0, 1, 2].some((dx) => near(dx, y)),
        right: (y) => [1, 2, 3].some((dx) => near(png.width - dx, y))
      };
      for (const [edge, hit] of Object.entries(edges)) {
        const len = edge === 'top' || edge === 'bottom' ? png.width : png.height;
        let n = 0;
        for (let i = 0; i < len; i++) if (hit(i)) n++;
        ok(
          n >= len / 2,
          '31 (card image focus ring, ' +
            label +
            '): the ' +
            edge +
            ' edge shows ' +
            n +
            '/' +
            len +
            ' (rect ' +
            JSON.stringify(clip) +
            ', scrollY ' +
            box.sy +
            ')'
        );
      }
    }
    await ctx.close();
  }
  await ringAt('#/i/ci1', '.card.full .card-media', 'full', true);
  await ringAt('#/roll/wondrous', '.card.compact .card-media', 'compact', false);
}

/** 32. The undo toast an action inside the record dialog raises is drawn
 *  inside the dialog: focused, hit-testable, in the accessibility tree, and
 *  its undo runs (docs/DECISIONS.md, 2026-09-24, "While the record dialog is
 *  open, the toast is drawn inside it"). Escape and the backdrop still close
 *  the dialog, and a toast still on offer then moves to the page's copy. */
async function undoToastInRecordDialog() {
  const at = '32 (undo toast in the record dialog): ';
  const { ctx, page, d } = await fresh({
    width: 1180,
    height: 900,
    storage: {
      'dhloot.lists.v2': JSON.stringify([
        { id: 'a', name: 'Клад дракона', ids: ['ci28'], created: 1 }
      ])
    }
  });
  const stored = () =>
    page.evaluate(() => {
      const lists = JSON.parse(localStorage.getItem('dhloot.lists.v2') || '[]');
      return (lists.find((l) => l.id === 'a') || { ids: [] }).ids.join(',');
    });
  /* The menu stays open after a pick, so a second removal presses the chip only. */
  const remove = async () => {
    if (!(await page.evaluate(() => !!document.querySelector('dialog[open] .dropmenu')))) {
      await d.press('Добавить в список');
    }
    await d.press('Клад дракона');
    await d.settle();
  };
  await d.open('#/tables');
  await d.press('Кольцо Тишины');
  await remove();
  ok((await stored()) === '', at + 'the chip did not remove ci28 from the list');

  const where = await page.evaluate(() => {
    const dialog = document.querySelector('dialog[open]');
    const shown = [...document.querySelectorAll('.toast')].filter((t) =>
      t.matches(':popover-open')
    );
    const act = shown[0]?.querySelector('.toast-act');
    const r = act?.getBoundingClientRect();
    const hit = r && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return {
      dialog: !!dialog,
      shown: shown.length,
      inDialog: !!dialog && shown.length === 1 && dialog.contains(shown[0]),
      roles: document.querySelectorAll('.toast[role]').length,
      focused: !!act && document.activeElement === act,
      hit: !!act && hit === act
    };
  });
  ok(
    where.dialog && where.inDialog && where.roles === 1,
    at + 'the shown toast is not the one inside the open dialog - ' + JSON.stringify(where)
  );
  ok(where.focused, at + '«Вернуть» is not focused');
  ok(where.hit, at + '«Вернуть» is not what a point at its centre hits');

  const cdp = await page.createCDPSession();
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  await cdp.detach();
  ok(
    nodes.some((n) => !n.ignored && n.name && n.name.value === 'Вернуть'),
    at + '«Вернуть» has no accessibility node'
  );

  await d.press('Вернуть');
  await d.settle();
  const afterUndo = await page.evaluate(() => ({
    open: !!document.querySelector('dialog[open]'),
    inside: !!document.activeElement?.closest('dialog[open]'),
    body: document.activeElement === document.body
  }));
  ok(afterUndo.open, at + 'the undo closed the dialog');
  ok((await stored()) === 'ci28', at + 'the undo did not restore ci28');
  ok(
    afterUndo.inside && !afterUndo.body,
    at + 'focus left the dialog after the undo - ' + JSON.stringify(afterUndo)
  );

  await remove();
  /* The first Escape folds the add-to-list menu, the second closes the dialog. */
  await page.keyboard.press('Escape');
  await d.settle();
  await page.keyboard.press('Escape');
  await d.settle();
  const handed = await page.evaluate(() => {
    const shown = [...document.querySelectorAll('.toast')].filter((t) =>
      t.matches(':popover-open')
    );
    return {
      open: !!document.querySelector('dialog[open]'),
      shown: shown.length,
      outside: shown.length === 1 && !shown[0].closest('dialog'),
      focused: document.activeElement?.classList.contains('toast-act') ?? false
    };
  });
  ok(
    !handed.open && handed.outside,
    at +
      'after Escape the dialog is open or the page does not show the toast - ' +
      JSON.stringify(handed)
  );
  ok(handed.focused, at + "after Escape «Вернуть» on the page's toast is not focused");
  await page.keyboard.press('Enter');
  await d.settle();
  ok((await stored()) === 'ci28', at + 'Enter on the handed-over toast did not restore ci28');
  ok(
    await page.evaluate(() => document.activeElement !== document.body),
    at + 'focus fell to body after the handed-over undo'
  );

  await d.press('Кольцо Тишины');
  await remove();
  await page.mouse.click(8, 8);
  await d.settle();
  ok(
    await page.evaluate(() => !document.querySelector('dialog[open]')),
    at + 'a backdrop click with the toast showing did not close the dialog'
  );
  await ctx.close();
}

/** 33. A drag whose own row another tab removes is void: the storage merge
 *  keeps the binding, the next `dragover` refuses the drop and clears the
 *  marks, the release moves nothing, and the page takes a text drop into a
 *  note again (docs/DECISIONS.md, 2026-09-24, "A drag whose own row leaves
 *  the list is void"). Synthetic `DragEvent`s, as case 17. */
async function dragSourceRemovedMidDrag() {
  const at = '33 (drag source removed mid-drag): ';
  const { ctx, page, d } = await fresh({
    width: 1180,
    height: 900,
    storage: {
      'dhloot.lists.v2': JSON.stringify([
        { id: 'a', name: 'Тайник', ids: ['ci1', 'ci2', 'ci3', 'ci4'], created: 1 }
      ])
    }
  });
  const order = () =>
    page.evaluate(() => {
      const stored = JSON.parse(localStorage.getItem('dhloot.lists.v2') || '[]');
      const list = stored.find((l) => l.id === 'a');
      return list ? list.ids.join(',') : '';
    });
  await d.open('#/lists/a');
  if (!(await page.evaluate(() => document.querySelector('.lnote')?.open))) {
    await d.press('Заметки');
  }

  await page.evaluate(() => {
    const grip = document.querySelectorAll('.lrow')[1].querySelector('[data-drag]');
    const dt = new DataTransfer();
    window.__grip = grip;
    window.__dragDT = dt;
    grip.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
  });
  await d.settle();

  await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('dhloot.lists.v2'));
    stored[0].ids = ['ci1', 'ci3', 'ci4'];
    localStorage.setItem('dhloot.lists.v2', JSON.stringify(stored));
    window.dispatchEvent(new StorageEvent('storage', { key: 'dhloot.lists.v2' }));
  });
  await d.settle();
  ok((await d.count('.lrow')) === 3, at + "the other tab's removal was not drawn");

  const over = await page.evaluate(() => {
    const row = document.querySelectorAll('.lrow')[1];
    const box = row.getBoundingClientRect();
    const e = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      dataTransfer: window.__dragDT,
      clientY: box.top + box.height - 2
    });
    row.dispatchEvent(e);
    return { prevented: e.defaultPrevented, effect: window.__dragDT.dropEffect };
  });
  ok(over.prevented, at + 'the dragover after the removal is not handled');
  ok(over.effect === 'none', at + 'the drop is not refused - dropEffect ' + over.effect);
  await d.settle();
  const marks = await d.count('.lrow.dragging, .lrow.drop-before, .lrow.drop-after');
  ok(marks === 0, at + marks + ' drag marks left on the rows');

  await page.evaluate(() => {
    const row = document.querySelectorAll('.lrow')[1];
    const box = row.getBoundingClientRect();
    row.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: window.__dragDT,
        clientY: box.top + box.height - 2
      })
    );
  });
  await d.settle();
  const after = await order();
  ok(after === 'ci1,ci3,ci4', at + 'the void release moved an entry - ' + after);

  const accepted = await page.evaluate(() => {
    window.__grip.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
    const ta = document.querySelector('.lnote textarea');
    if (!ta) return null;
    const e = new DragEvent('dragenter', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer()
    });
    ta.dispatchEvent(e);
    return !e.defaultPrevented;
  });
  ok(accepted !== null, at + 'no list note textarea to drop text into');
  ok(accepted !== false, at + 'the note still refuses a text drop after the drag ended');
  await ctx.close();
}

/** 34. The storage notice's summary wins the taps on its own row: its box
 *  ends at the painted cross, and the cross's 44x44 target yields to it
 *  where the two overlap, so a tap just left of the cross unfolds the notice
 *  rather than dismissing it. */
async function noticeSummaryWinsItsTaps() {
  const at = '34 (notice summary wins its taps): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900, storage: ONE_LOCAL });
  await d.open('#/lists');
  const m = await page.evaluate(() => {
    const btn = document.querySelector('.warn-x');
    const sum = document.querySelector('.warn summary');
    if (!btn || !sum) return null;
    const b = btn.getBoundingClientRect();
    const s = sum.getBoundingClientRect();
    const y = Math.min(Math.max(b.y + b.height / 2, s.y + 2), s.bottom - 2);
    const inSummary = (x) => !!document.elementFromPoint(x, y)?.closest('summary');
    const onCross = (x) => !!document.elementFromPoint(x, y)?.closest('.warn-x');
    const after = getComputedStyle(btn, '::after');
    return {
      sRight: s.right,
      bLeft: b.x,
      y,
      leftIsSummary: inSummary(b.x - 4),
      paintIsCross: onCross(b.x + 3) && onCross(b.x + b.width / 2),
      pastIsCross: onCross(b.right + 4),
      target: after.width + ' x ' + after.height
    };
  });
  ok(!!m, at + 'no storage notice on #/lists');
  if (m) {
    ok(
      m.sRight <= m.bLeft + 0.5,
      at + 'the summary covers the painted cross - ' + m.sRight + ' > ' + m.bLeft
    );
    ok(m.leftIsSummary, at + 'a point 4px left of the cross does not hit the summary');
    ok(m.paintIsCross, at + 'the painted cross does not hit the cross');
    ok(m.pastIsCross, at + 'the target no longer reaches past the painted cross');
    ok(m.target === '44px x 44px', at + 'the target is not 44x44 - ' + m.target);
    await page.mouse.click(m.bLeft - 4, m.y);
    await d.settle();
    const state = await page.evaluate(() => ({
      open: document.querySelector('.warn details')?.open ?? null,
      drawn: !!document.querySelector('.warn-x')
    }));
    ok(
      state.open === true && state.drawn,
      at + 'a tap left of the cross did not unfold the notice - ' + JSON.stringify(state)
    );
  }
  await ctx.close();
}

/** 35. The test build's cloud: signed out without `?as=`, the seed's `gm1`
 *  with `?as=gm1` - and the query survives arrival, so a reload keeps the
 *  session; a user the seed does not have fails `open()` by name
 *  (docs/specs/COVERAGE.md, "Test layers"). */
async function fakeCloudSignedState() {
  const at = '35 (fake cloud signed state): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/roll/std');
  const out = await page.evaluate(async () => {
    const fake = window.__dhlootFake;
    return fake ? { session: await fake.auth.session() } : null;
  });
  ok(!!out, at + 'no window.__dhlootFake - is this the test build?');
  ok(out?.session === null, at + 'signed out: the session is ' + JSON.stringify(out?.session));
  await d.open('#/roll/std', { as: 'gm1' });
  const as = await page.evaluate(async () => ({
    session: (await window.__dhlootFake?.auth.session()) ?? null,
    search: location.search
  }));
  ok(
    as.session?.userId === '00000000-0000-4000-8000-000000000001',
    at + 'as gm1: the user id is ' + JSON.stringify(as.session?.userId)
  );
  ok(
    as.session?.email === 'gm1@example.test',
    at + 'as gm1: the email is ' + JSON.stringify(as.session?.email)
  );
  ok(as.search === '?as=gm1', at + 'the query did not survive arrival - ' + as.search);
  const refused = await d.open('#/roll/std', { as: 'nobody' }).then(
    () => '',
    (e) => String(e && e.message)
  );
  ok(
    refused.includes('unknown user "nobody"'),
    at + 'an unknown ?as= user did not fail open() by name - ' + JSON.stringify(refused)
  );
  await ctx.close();
}

/** 36. Account preferences over the fake cloud: the account's language
 *  wins over this browser's and is written back; an account with no row is
 *  seeded from this browser; a signed-out print press lasts until a reload,
 *  stores nothing and draws the note (docs/specs/STATE.md, "Account
 *  preferences"). */
async function accountPreferences() {
  const at = '36 (account preferences): ';
  const lang = (page) => page.evaluate(() => document.documentElement.lang);
  const until = async (page, fn, ...args) => {
    try {
      await page.waitForFunction(fn, { timeout: 2000, polling: 50 }, ...args);
      return true;
    } catch {
      return false;
    }
  };

  const a = await fresh({ width: 1180, height: 900, lang: 'en' });
  await a.d.open('#/roll/std', { as: 'gm1' });
  ok(
    await until(a.page, () => document.documentElement.lang === 'ru'),
    at + "a: the account's ru did not win over this browser's en - " + (await lang(a.page))
  );
  ok((await a.d.storage('dhloot.lang.v1')) === 'ru', at + 'a: dhloot.lang.v1 is not ru');
  const local = JSON.parse((await a.d.storage('dhloot.prefs.v1')) ?? 'null');
  ok(
    JSON.stringify(local) ===
      JSON.stringify({ view: 'grid', printBw: true, printCompact: true }),
    at + "a: dhloot.prefs.v1 is not the account's - " + JSON.stringify(local)
  );
  await a.ctx.close();

  const b = await fresh({
    width: 1180,
    height: 900,
    lang: 'en',
    storage: { 'dhloot.prefs.v1': '{"view":"grid","printBw":false,"printCompact":true}' }
  });
  await b.d.open('#/roll/std', { as: 'gm2' });
  const want = {
    ok: true,
    prefs: {
      lang: 'en',
      home: '#/roll/std',
      view: 'grid',
      printBw: false,
      printCompact: true,
      notifyGm: 'ask'
    }
  };
  ok(
    await until(
      b.page,
      async (w) => JSON.stringify(await window.__dhlootFake?.prefs.load()) === w,
      JSON.stringify(want)
    ),
    at +
      'b: the account with no row was not seeded from this browser - ' +
      JSON.stringify(await b.page.evaluate(() => window.__dhlootFake?.prefs.load()))
  );
  ok((await lang(b.page)) === 'en', at + 'b: the page did not stay English');
  await b.ctx.close();

  const SEEDED = '{"view":"list","printBw":false,"printCompact":false}';
  const c = await fresh({ width: 1180, height: 900, storage: { 'dhloot.prefs.v1': SEEDED } });
  const sheet = (page) =>
    page.evaluate(() => ({
      bw: document.querySelector('.psheet.bw') !== null,
      note: document.querySelector('.keepnote a')?.getAttribute('href') ?? null
    }));
  await c.d.open('#/print/ci1-q1');
  await c.d.click('Чёрно-белая');
  const kept = await c.d.storage('dhloot.prefs.v1');
  ok(kept === SEEDED, at + 'c: the signed-out print press changed dhloot.prefs.v1 - ' + kept);
  let seen = await sheet(c.page);
  ok(
    seen.bw && seen.note === '#/account',
    at + 'c: the press did not draw black and white with the note - ' + JSON.stringify(seen)
  );
  await c.d.go('#/lists');
  await c.d.go('#/print/ci1-q1');
  seen = await sheet(c.page);
  ok(
    seen.bw && seen.note === '#/account',
    at + 'c: the pick did not survive a return from #/lists - ' + JSON.stringify(seen)
  );
  await c.d.open('#/print/ci1-q1');
  seen = await sheet(c.page);
  ok(
    !seen.bw && seen.note === null,
    at +
      'c: a reload did not draw the colour default without the note - ' +
      JSON.stringify(seen)
  );
  await c.ctx.close();
}

/** The prompt's own «Войти» - the header draws one too. */
async function pressPromptSignIn(page) {
  await page.click('.signin button');
  await ready(page);
}

/** 37. A signed-out selection's «+ Новый список» is the sign-in prompt; its
 *  «Войти» opens #/account, whose Google sign-in comes back to the table with
 *  the same row ticked and the bar's menu open over the account's lists.
 *  Leaving #/account by a tab first forgets it (docs/specs/FEATURES.md,
 *  "Account"). */
async function signInFromTheBar() {
  const at = '37 (sign-in from the bar): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/tables');
  await d.tick('Первоклассный Спальный Мешок');
  await d.press('Добавить в список');
  await d.press('+ Новый список');
  ok(
    (await page.evaluate(() => document.body.innerText)).includes(
      'Войдите, чтобы создать список.'
    ),
    at + 'the prompt did not take the new-list slot'
  );
  ok(!(await d.has('Войти через Google')), at + 'a provider button sits in the prompt');
  await pressPromptSignIn(page);
  ok((await d.hash()) === '#/account', at + '«Войти» did not open #/account');
  await d.press('Войти через Google');
  ok(
    await waitIn(
      page,
      () => location.hash === '#/tables' && !!document.querySelector('.dropmenu')
    ),
    at + 'the sign-in did not come back to #/tables with the menu open - ' + (await d.hash())
  );
  const back = await page.evaluate(() => ({
    ticked: [...document.querySelectorAll('input[type="checkbox"]')].some(
      (c) => c.checked && c.getAttribute('aria-label') === 'Первоклассный Спальный Мешок'
    ),
    chips: [...document.querySelectorAll('.dropmenu .chip')].map((c) => c.textContent)
  }));
  ok(back.ticked, at + 'the row is no longer ticked');
  ok(
    back.chips.some((c) => c.includes('Лавка кузнеца')) &&
      back.chips.includes('+ Новый список'),
    at +
      "the menu lacks the account's lists or «+ Новый список» - " +
      JSON.stringify(back.chips)
  );
  await ctx.close();

  const again = await fresh({ width: 1180, height: 900 });
  await again.d.open('#/tables');
  await again.d.tick('Первоклассный Спальный Мешок');
  await again.d.press('Добавить в список');
  await again.d.press('+ Новый список');
  await pressPromptSignIn(again.page);
  await again.d.press('Списки');
  await again.page.click('header a[href="#/account"]');
  await again.d.settle();
  await again.d.press('Войти через Google');
  await again.d.settle();
  ok(
    (await again.d.hash()) === '#/account' &&
      !(await again.page.evaluate(() => !!document.querySelector('.dropmenu'))),
    at + 'a prompt left behind by a tab still ran - ' + (await again.d.hash())
  );
  await again.ctx.close();
}

/** 38. An old #/l/ link, signed out: «Сохранить себе» opens the prompt under
 *  it; the sign-in comes back and saves the list into the account by itself,
 *  and opens it. */
async function saveOldLinkAfterSignIn() {
  const at = '38 (old link saved after sign-in): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/l/' + QTY_AND_PRICE.player.payload);
  await d.press('Сохранить себе');
  ok(
    (await page.evaluate(() => document.body.innerText)).includes(
      'Войдите, и список сохранится в ваш аккаунт.'
    ),
    at + 'the prompt did not open under the button'
  );
  await pressPromptSignIn(page);
  ok((await d.hash()) === '#/account', at + '«Войти» did not open #/account');
  await d.press('Войти через Google');
  ok(
    await waitIn(
      page,
      (h) =>
        location.hash === h && document.querySelector('input.titleinput')?.value === 'Лавка',
      FIRST_NEW
    ),
    at + 'the sign-in did not open the saved «Лавка» - ' + (await d.hash())
  );
  await d.writesSettled();
  const read = await d.fake('lists.list');
  ok(
    !!read?.ok && read.lists.some((l) => l.name === 'Лавка' && l.list_entries.length === 3),
    at + 'the account does not hold «Лавка» with its three rows'
  );
  ok((await d.storage('dhloot.lists.v2')) === null, at + 'a browser list was made');
  await ctx.close();
}

/** 39. Signing out on an account list's page goes to the lists page, with
 *  no account list left on screen. */
async function signOutOnAccountList() {
  const at = '39 (sign-out on an account list): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open(SHOP, { as: 'gm1' });
  ok(
    await waitIn(
      page,
      () => document.querySelector('input.titleinput')?.value === 'Лавка кузнеца'
    ),
    at + 'the account list did not open'
  );
  await d.fake('auth.signOut');
  ok(
    await waitIn(page, () => location.hash === '#/lists'),
    at + 'the address is not #/lists - ' + (await d.hash())
  );
  ok(
    !(await page.evaluate(() => document.body.innerText)).includes('Лавка кузнеца'),
    at + 'an account list is still on screen'
  );
  await ctx.close();
}

/** 40. A rename with no network: «Не сохранено» and «Повторить» in the sub,
 *  the edit kept; online again, «Повторить» saves it. */
async function notSavedThenRetried() {
  const at = '40 (not saved, then retried): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open(SHOP, { as: 'gm1' });
  await waitIn(
    page,
    () => document.querySelector('input.titleinput')?.value === 'Лавка кузнеца'
  );
  await d.fake('setOffline', true);
  await d.type('Название списка', 'Лавка у моста');
  ok(
    await waitIn(
      page,
      () =>
        document.querySelector('.page-sub')?.textContent.includes('Не сохранено') &&
        [...document.querySelectorAll('.page-sub button')].some(
          (b) => b.textContent === 'Повторить'
        )
    ),
    at + 'the sub does not say «Не сохранено» with «Повторить»'
  );
  ok(
    (await page.evaluate(() => document.querySelector('input.titleinput')?.value)) ===
      'Лавка у моста',
    at + 'the edit left the screen'
  );
  await d.fake('setOffline', false);
  await d.press('Повторить');
  ok(
    await waitIn(page, () =>
      document.querySelector('.page-sub')?.textContent.includes('Сохранено')
    ),
    at + 'the retry did not save'
  );
  const read = await d.fake('lists.list');
  ok(
    !!read?.ok && read.lists.some((l) => l.name === 'Лавка у моста'),
    at + 'the account does not hold the new name'
  );
  await ctx.close();
}

/** 41. Deleting an account list on the index: the browser's confirm names
 *  the share links, the card goes, and the toast offers no undo. */
async function deleteAccountList() {
  const at = '41 (delete an account list): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/lists', { as: 'gm1' });
  await waitIn(page, () => document.body.innerText.includes('Трофеи'));
  const index = await page.evaluate(() =>
    [...document.querySelectorAll('.listcard')].findIndex((c) =>
      c.textContent.includes('Трофеи')
    )
  );
  await d.press('Удалить', index);
  ok(
    (d.dialog() ?? '').includes('перестанут работать'),
    at + 'the confirm does not name the links - ' + JSON.stringify(d.dialog())
  );
  const after = await page.evaluate(() => ({
    card: [...document.querySelectorAll('.listcard')].some((c) =>
      c.textContent.includes('Трофеи')
    ),
    undo: [...document.querySelectorAll('button')].some((b) => b.textContent === 'Вернуть')
  }));
  ok(!after.card, at + 'the card is still drawn');
  ok(!after.undo, at + 'the toast offers «Вернуть»');
  await ctx.close();
}

/** 42. The sign-in prompt inside the record dialog's menu at 360 wide: the
 *  menu, measured against the dialog's card with the prompt open, keeps the
 *  prompt and its «Войти» inside the card and the window, and reachable. */
async function promptInDialogMenuAt360() {
  const at = '42 (prompt in the dialog menu at 360): ';
  const { ctx, page, d } = await fresh({ width: 360, height: 740 });
  await d.open('#/tables');
  await d.press('Кольцо Тишины');
  await d.press('Добавить в список');
  await d.press('+ Новый список');
  await d.settle();
  const m = await page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { x: r.x, y: r.y, w: r.width, h: r.height, shown: !!hit && el.contains(hit) };
    };
    return {
      card: box(document.querySelector('.modal-card')),
      menu: box(document.querySelector('.dropmenu')),
      signIn: box(document.querySelector('.dropmenu .signin button')),
      view: { x: 0, y: 0, w: innerWidth, h: innerHeight }
    };
  });
  ok(!!m.menu && !!m.signIn, at + 'the menu or its prompt did not draw');
  for (const [name, b] of [
    ['the menu', m.menu],
    ['«Войти»', m.signIn]
  ]) {
    ok(!!b && !!m.card && inside(b, m.card), at + name + ' lies outside .modal-card');
    ok(!!b && inside(b, m.view), at + name + ' lies outside the window');
  }
  ok(!!m.signIn?.shown, at + '«Войти» is covered or clipped - ' + JSON.stringify(m.signIn));
  await ctx.close();
}

/** The texts on the page, for a share-link wait. */
const bodyHas = (text) => document.body.innerText.includes(text);
/** The share panel's link texts, in row order. */
const shareLinks = () => [...document.querySelectorAll('.sharelink')].map((a) => a.textContent);

/** 43. An account list's share panel: both links made on open, «Скопировать»
 *  copies `#/s/<token>`, a deleted link opens nothing and a new one opens the
 *  list with the owner's line; a deleted GM link stays deleted on the next
 *  open until «Создать ссылку». No `#/l/` address is ever copied. */
async function shareLinksOfAnAccountList() {
  const at = '43 (share links): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  const copied = [];
  await d.open(TROPHIES, { as: 'gm1' });
  await waitIn(page, () => document.querySelector('input.titleinput')?.value === 'Трофеи');
  await d.press('Поделиться');
  ok(
    await waitIn(
      page,
      () =>
        [...document.querySelectorAll('.sharelink')].map((a) => a.textContent).join() ===
        '#/s/share-token-1,#/s/share-token-2'
    ),
    at +
      'the panel did not make both links - ' +
      JSON.stringify(await page.evaluate(shareLinks))
  );
  await d.press('Скопировать');
  const clip = (await d.clipboard())?.text ?? '';
  copied.push(clip);
  ok(clip.endsWith('#/s/share-token-1'), at + 'the players link was not copied - ' + clip);
  await d.press('Удалить ссылку');
  ok(await waitIn(page, bodyHas, 'Ссылка удалена'), at + 'the deleted row does not say so');
  await d.press('Создать ссылку');
  ok(
    await waitIn(
      page,
      () =>
        [...document.querySelectorAll('.sharelink')].map((a) => a.textContent)[0] ===
        '#/s/share-token-3'
    ),
    at + 'a new players link was not made - ' + JSON.stringify(await page.evaluate(shareLinks))
  );
  await d.go('#/s/share-token-1');
  ok(
    await waitIn(page, bodyHas, 'Список больше не доступен'),
    at + 'the deleted link still opens something'
  );
  ok((await d.hash()) === '#/s/share-token-1', at + 'the address moved - ' + (await d.hash()));
  await d.go('#/s/share-token-3');
  ok(
    await waitIn(
      page,
      () =>
        document.body.innerText.includes('Трофеи') &&
        document.body.innerText.includes('Это ваш список.')
    ),
    at + 'the new link does not open the list with the owner line'
  );
  await d.go(TROPHIES);
  await waitIn(page, () => document.querySelector('input.titleinput')?.value === 'Трофеи');
  await d.press('Поделиться');
  await waitIn(
    page,
    () => [...document.querySelectorAll('.sharelink')].map((a) => a.textContent).length === 2
  );
  await d.press('Удалить ссылку', 1);
  ok(await waitIn(page, bodyHas, 'Ссылка удалена'), at + 'the GM row does not say deleted');
  await d.press('Поделиться');
  await d.press('Поделиться');
  ok(
    await waitIn(
      page,
      () =>
        document.body.innerText.includes('Ссылка удалена') &&
        [...document.querySelectorAll('.sharelink')].map((a) => a.textContent).length === 1
    ),
    at + 'the deleted GM link was made again on the next open'
  );
  const read = await d.fake('shares.list', '00000000-0000-4000-8000-000000000103');
  ok(
    !!read?.ok && !read.shares.some((s) => s.audience === 'gm' && s.revoked_at === null),
    at + 'the account holds an active GM link - ' + JSON.stringify(read)
  );
  await d.press('Создать ссылку');
  ok(
    await waitIn(
      page,
      () =>
        [...document.querySelectorAll('.sharelink')].map((a) => a.textContent)[1] ===
        '#/s/share-token-4'
    ),
    at + 'a new GM link was not made - ' + JSON.stringify(await page.evaluate(shareLinks))
  );
  await d.press('Скопировать', 1);
  copied.push((await d.clipboard())?.text ?? '');
  await d.press('Скопировать текст');
  copied.push((await d.clipboard())?.text ?? '');
  ok(
    copied.every((c) => !c.includes('#/l/')),
    at + 'a #/l/ address was copied - ' + JSON.stringify(copied)
  );
  await ctx.close();
}

/** 44. A share link signed out: «Сохранить себе» opens the prompt, the
 *  sign-in comes back and copies the list by itself - the players' notes,
 *  none of the GM's. */
async function saveShareLinkAfterSignIn() {
  const at = '44 (share link saved after sign-in): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/s/player-token-1');
  await waitIn(page, bodyHas, 'Лавка кузнеца');
  await d.press('Сохранить себе');
  ok(
    await waitIn(page, bodyHas, 'Войдите, и список сохранится в ваш аккаунт.'),
    at + 'the prompt did not open under the button'
  );
  await pressPromptSignIn(page);
  ok((await d.hash()) === '#/account', at + '«Войти» did not open #/account');
  await d.press('Войти через Google');
  ok(
    await waitIn(
      page,
      (h) =>
        location.hash === h &&
        document.querySelector('input.titleinput')?.value === 'Лавка кузнеца',
      FIRST_NEW
    ),
    at + 'the sign-in did not open the copy - ' + (await d.hash())
  );
  const notes = await page.evaluate(() =>
    [...document.querySelectorAll('textarea')].map((t) => t.value).join('\n')
  );
  ok(
    notes.includes('Открыта с рассвета до заката.'),
    at + "the players' note is not on the page"
  );
  ok(!notes.includes('Кузнец торгуется'), at + 'the GM note reached the copy');
  const read = await d.fake('lists.list');
  const copy = read?.ok ? read.lists.find((l) => l.id === FIRST_NEW.slice(8)) : null;
  ok(
    !!copy &&
      copy.gm_note === '' &&
      copy.player_note === 'Открыта с рассвета до заката.' &&
      copy.list_entries.every((e) => e.gm_note === ''),
    at + 'the copy in the account holds a GM note or lacks the players note'
  );
  await ctx.close();
}

/** 45. The owner on their own link: «Обновлено 3 дня назад»; with Realtime
 *  down, an edit made elsewhere shows when the tab is shown again, with
 *  «Обновлено только что». */
async function sharedPageRereadWhenShownAgain() {
  const at = '45 (shared page re-read): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/s/player-token-1', { as: 'gm1' });
  ok(
    await waitIn(page, bodyHas, 'Обновлено 3 дня назад'),
    at + 'the page does not say «Обновлено 3 дня назад»'
  );
  await d.fake('setLive', false);
  await d.fake('lists.apply', [
    {
      op: 'update',
      id: '00000000-0000-4000-8000-000000000101',
      patch: { name: 'Лавка у моста' }
    }
  ]);
  await d.shownAgain();
  ok(
    await waitIn(
      page,
      () =>
        document.querySelector('h1')?.textContent === 'Лавка у моста' &&
        document.body.innerText.includes('Обновлено только что')
    ),
    at + 'the edit did not show after the tab was shown again'
  );
  await ctx.close();
}

/** 46. With Realtime down, a link deleted while its page is open draws the
 *  no-longer-available page when the tab is shown again, the address kept. */
async function sharedPageGoneWhenShownAgain() {
  const at = '46 (shared page gone): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/s/gm-token-1', { as: 'gm1' });
  await waitIn(page, bodyHas, 'Лавка кузнеца');
  await d.fake('setLive', false);
  await d.fake('shares.revoke', '00000000-0000-4000-8000-000000000113');
  await d.shownAgain();
  ok(
    await waitIn(page, bodyHas, 'Список больше не доступен'),
    at + 'the deleted link still draws the list'
  );
  ok((await d.hash()) === '#/s/gm-token-1', at + 'the address moved - ' + (await d.hash()));
  await ctx.close();
}

/** Like `waitIn`, with its own limit: a live redraw has to land within `ms`. */
async function waitWithin(page, ms, fn, ...args) {
  try {
    await page.waitForFunction(fn, { timeout: ms, polling: 50 }, ...args);
    return true;
  } catch {
    return false;
  }
}

const SHOP_ID = '00000000-0000-4000-8000-000000000101';
const liveShare = () => !!document.querySelector('.said[data-live="live"]');

/** 52. A share page, signed out, draws another device's edit within a second
 *  with no reload and no shown-again signal, says «Список обновлён», and
 *  draws the no-longer-available page within a second of its link's delete. */
async function liveSharePage() {
  const at = '52 (live share page): ';
  let { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/s/player-token-1');
  ok(await waitIn(page, liveShare), at + 'the share topic did not join');
  await d.fake('play', SHOP_ID, { name: 'Лавка у моста' });
  ok(
    await waitWithin(
      page,
      1000,
      () =>
        document.querySelector('h1')?.textContent === 'Лавка у моста' &&
        document.body.innerText.includes('Обновлено только что') &&
        document.querySelector('.said')?.textContent === 'Список обновлён'
    ),
    at + 'the edit, «Обновлено только что» or «Список обновлён» did not show within 1 s'
  );
  await ctx.close();
  ({ ctx, page, d } = await fresh({ width: 1180, height: 900 }));
  await d.open('#/s/gm-token-1', { as: 'gm1' });
  ok(await waitIn(page, liveShare), at + 'the GM link did not join its topic');
  await d.fake('shares.revoke', '00000000-0000-4000-8000-000000000113');
  ok(
    await waitWithin(page, 1000, bodyHas, 'Список больше не доступен'),
    at + 'the deleted link still draws the list after 1 s'
  );
  ok((await d.hash()) === '#/s/gm-token-1', at + 'the address moved - ' + (await d.hash()));
  await ctx.close();
}

/** 53. An account list page redraws another device's rename within a second
 *  while the owner topic is joined; with Realtime down it waits for the tab
 *  to be shown again. */
async function liveAccountList() {
  const at = '53 (live account list): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open(SHOP, { as: 'gm1' });
  ok(
    await waitIn(page, () => !!document.querySelector('.lsaid[data-live="live"]')),
    at + 'the owner topic did not join'
  );
  const title = (name) => document.querySelector('input.titleinput')?.value === name;
  await d.fake('play', SHOP_ID, { name: 'Лавка у моста' });
  ok(
    await waitWithin(page, 1000, title, 'Лавка у моста'),
    at + 'the rename did not show in 1 s'
  );
  /* The loss re-reads the account once by itself; count the fake's answered
     reads so the next rename lands after that read, not inside it. */
  await page.evaluate(() => {
    const repo = window.__dhlootFake.lists;
    const list = repo.list.bind(repo);
    window.__dhlootReads = 0;
    repo.list = async () => {
      const read = await list();
      window.__dhlootReads++;
      return read;
    };
  });
  await d.fake('setLive', false);
  ok(
    await waitIn(page, () => !document.querySelector('.lsaid[data-live]')),
    at + 'the sync status stayed live with Realtime down'
  );
  ok(
    await waitIn(page, () => window.__dhlootReads >= 1),
    at + 'the loss did not re-read the account'
  );
  await d.fake('play', SHOP_ID, { name: 'Лавка у реки' });
  ok(
    !(await waitWithin(page, 1000, title, 'Лавка у реки')),
    at + 'the rename showed with Realtime down and no signal'
  );
  await d.shownAgain();
  ok(
    await waitIn(page, title, 'Лавка у реки'),
    at + 'the rename did not show when the tab was shown again'
  );
  await ctx.close();
}

/* Counts the fake's answered reads of the owner's requests in `window.__dhlootRequestReads`,
   so a case can wait until a re-read it started has landed. */
async function countRequestReads(page) {
  await page.evaluate(() => {
    const repo = window.__dhlootFake.requests;
    const list = repo.list.bind(repo);
    window.__dhlootRequestReads = 0;
    repo.list = async () => {
      const read = await list();
      window.__dhlootRequestReads++;
      return read;
    };
  });
}

/** 54. A purchase request reaches the owner's open list page and the index within a
 *  second while the owner topic is joined; with Realtime down it waits for the tab to
 *  be shown again. */
async function liveRequests() {
  const at = '54 (live requests): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open(SHOP, { as: 'gm1' });
  ok(
    await waitIn(page, () => !!document.querySelector('.lsaid[data-live="live"]')),
    at + 'the owner topic did not join'
  );
  await d.fake('request', 'player-token-1', [{ item: 'ci1', qty: 1 }]);
  ok(
    await waitWithin(page, 1000, bodyHas, 'Новое в списке (1)'),
    at + '«Новое в списке (1)» did not show within 1 s'
  );
  await d.go('#/lists');
  ok(
    await waitIn(page, bodyHas, '1 запрос ждёт ответа'),
    at + 'the index does not say «1 запрос ждёт ответа»'
  );
  /* The loss re-reads the requests once by itself; the next request comes after it. */
  await countRequestReads(page);
  await d.fake('setLive', false);
  ok(
    await waitIn(page, () => window.__dhlootRequestReads >= 1),
    at + 'the loss did not re-read the requests'
  );
  await d.fake('request', 'gm-token-1', [{ item: 'cc1', qty: 1 }]);
  ok(
    !(await waitWithin(page, 1000, bodyHas, '2 запроса ждут ответа')),
    at + 'the second request showed with Realtime down and no signal'
  );
  await d.shownAgain();
  ok(
    await waitIn(page, bodyHas, '2 запроса ждут ответа'),
    at + 'the second request did not show when the tab was shown again'
  );
  await ctx.close();
}

/** 55. A signed-out reader sends the ticked entry to the owner: the toast, the
 *  selection kept, the button «Запрос отправлен» disabled until the selection is
 *  cleared and ticked again, nothing written to either storage; the sixth send in a
 *  minute says the rate. */
async function sendARequest() {
  const at = '55 (send a request): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/s/player-token-1');
  await waitIn(page, bodyHas, 'Лавка кузнеца');
  const keys = () =>
    page.evaluate(() => [Object.keys(localStorage).sort(), Object.keys(sessionStorage).sort()]);
  const before = JSON.stringify(await keys());
  const ticked = () => document.querySelectorAll('.sel[data-row]').length;
  const sentDisabled = () =>
    [...document.querySelectorAll('.selbar button')].some(
      (b) => b.textContent.trim() === 'Запрос отправлен' && b.disabled
    );
  await d.tick('Первоклассный Спальный Мешок');
  for (let n = 1; n <= 5; n++) {
    if (n > 1) {
      /* The sent lines keep the button disabled until the selection changes. */
      await d.press('Снять выделение');
      await d.tick('Первоклассный Спальный Мешок');
    }
    await d.press('Сообщить владельцу');
    ok(
      await waitIn(page, sentDisabled),
      at + 'send ' + String(n) + ' did not leave «Запрос отправлен» disabled'
    );
    ok((await page.evaluate(ticked)) === 1, at + 'send ' + String(n) + ' cleared the row');
    if (n === 1) {
      ok(
        await waitIn(page, bodyHas, 'Запрос отправлен владельцу списка.'),
        at + 'no «Запрос отправлен владельцу списка.»'
      );
    }
  }
  ok(JSON.stringify(await keys()) === before, at + 'a send wrote to browser storage');
  await d.press('Снять выделение');
  await d.tick('Первоклассный Спальный Мешок');
  await d.press('Сообщить владельцу');
  ok(
    await waitIn(page, bodyHas, 'Слишком много запросов по этой ссылке: подождите минуту.'),
    at + 'the sixth send in a minute did not say the rate'
  );
  ok((await page.evaluate(ticked)) === 1, at + 'the refused send cleared the selection');
  await ctx.close();
}

/** 56. The owner applies a request within stock: one entry lowered, one removed at
 *  zero, the toast and the fold; an applied request redraws an open share page live. */
async function applyARequest() {
  const at = '56 (apply a request): ';
  let { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open(SHOP, { as: 'gm1' });
  await waitIn(page, () => !!document.querySelector('.lsaid[data-live="live"]'));
  await d.fake('request', 'player-token-1', [
    { item: 'ci1', qty: 1 },
    { item: 'cc1', qty: 5 }
  ]);
  ok(await waitIn(page, bodyHas, 'Новое в списке (1)'), at + 'the request is not on the page');
  const rows = await d.count('.lrow');
  await d.press('Принять');
  ok(await waitIn(page, bodyHas, 'Запрос принят'), at + 'no «Запрос принят»');
  ok(
    await waitIn(page, bodyHas, 'Решённые в этот раз (1)'),
    at + 'no «Решённые в этот раз (1)»'
  );
  ok(
    await waitIn(page, (n) => document.querySelectorAll('.lrow').length === n, rows - 1),
    at + 'the entry taken whole is still a row'
  );
  const read = await d.fake('lists.list');
  const shop = read?.ok ? read.lists.find((l) => l.id === SHOP_ID) : null;
  const qty = (key) => shop?.list_entries.find((e) => e.item_key === key)?.quantity;
  ok(qty('ci1') === 1 && qty('cc1') === undefined, at + 'the stock is ' + JSON.stringify(shop));
  await ctx.close();

  ({ ctx, page, d } = await fresh({ width: 1180, height: 900 }));
  await d.open('#/s/player-token-1');
  ok(await waitIn(page, liveShare), at + 'the share topic did not join');
  const id = await d.fake('request', 'player-token-1', [{ item: 'cc1', qty: 3 }]);
  await d.fake('decide', id, 'applied');
  ok(
    await waitWithin(page, 1000, () =>
      (document.querySelector('[data-row="cc1"]')?.textContent ?? '').includes('×2')
    ),
    at + 'the open share page did not draw «×2» for cc1 within 1 s'
  );
  await ctx.close();
}

/** 57. With «Сообщать владельцу» chosen in the Display row, an add from a share page's
 *  bar sends the request with no question and says so in the add toast. */
async function notifyAlways() {
  const at = '57 (notify always): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/account', { as: 'gm2' });
  await waitIn(page, () => !!document.querySelector('#display-notify'));
  await page.select('#display-notify', 'always');
  await d.go('#/s/player-token-1');
  await waitIn(page, bodyHas, 'Лавка кузнеца');
  await d.tick('Первоклассный Спальный Мешок');
  await d.press('Добавить в список');
  await d.press('Список второго ГМа');
  ok(
    await waitIn(page, bodyHas, 'Добавлено в «Список второго ГМа». Владелец получил запрос.'),
    at + 'the add toast does not say the owner got the request'
  );
  ok(!(await d.count('.notifyq')), at + 'the question was asked');
  await ctx.close();
}

/** 49. Account edits wait two seconds, then go once: ten presses of the
 *  first row's quantity and a list note typed key by key reach the fake as
 *  one request of two writes; hidden, the tab sends the buffer at once. */
async function accountEditsWaitThenGoOnce() {
  const at = '49 (account edits wait two seconds, then go once): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open(SHOP, { as: 'gm1' });
  await waitIn(
    page,
    () => document.querySelector('input.titleinput')?.value === 'Лавка кузнеца'
  );
  const shopRow = async () => {
    const read = await d.fake('lists.list');
    const shop = read?.ok
      ? read.lists.find((l) => l.id === '00000000-0000-4000-8000-000000000101')
      : null;
    return {
      qty: shop?.list_entries.find((e) => e.item_key === 'ci1')?.quantity,
      note: shop?.player_note
    };
  };
  const before = await shopRow();
  const c0 = await d.fake('writeCount');
  const o0 = await d.fake('opCount');
  const noteShown = () =>
    [...document.querySelectorAll('textarea')].some(
      (t) => t.placeholder === 'Например: лавка закрыта до утра' && t.offsetParent !== null
    );
  /* «Лавка кузнеца» has a list note, so its notes may already be open. */
  if (!(await page.evaluate(noteShown))) await d.press('Заметки');
  ok(await page.evaluate(noteShown), at + 'the list note field is not on screen');
  await page.focus('[data-qty]');
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowUp');
  await page.evaluate(() => {
    const note = [...document.querySelectorAll('textarea')].find(
      (t) => t.placeholder === 'Например: лавка закрыта до утра'
    );
    note.focus();
    note.setSelectionRange(note.value.length, note.value.length);
  });
  const typed = ' Закрыто в полночь!!';
  await page.keyboard.type(typed);
  const sub = () => document.querySelector('.page-sub')?.textContent ?? '';
  ok(
    (await page.evaluate(sub)).includes('Сохраняем...') &&
      (await page.evaluate(() => !!document.querySelector('[data-saving]'))),
    at +
      'the sub does not say «Сохраняем...» while the edits wait - ' +
      (await page.evaluate(sub))
  );
  const waiting = await shopRow();
  ok(
    waiting.qty === before.qty && waiting.note === before.note,
    at + 'an edit reached the fake before the quiet window - ' + JSON.stringify(waiting)
  );
  await d.writesSettled();
  ok(
    (await page.evaluate(sub)).includes('Сохранено'),
    at + 'the sub does not say «Сохранено» - ' + (await page.evaluate(sub))
  );
  const requests = (await d.fake('writeCount')) - c0;
  const writes = (await d.fake('opCount')) - o0;
  ok(
    requests === 1 && writes === 2,
    at + `the edits went as ${requests} requests of ${writes} writes, not one of two`
  );
  const saved = await shopRow();
  ok(
    saved.qty === before.qty + 10 && saved.note === before.note + typed,
    at +
      'the fake does not hold the quantity + 10 and the whole note - ' +
      JSON.stringify(saved)
  );
  await page.keyboard.type('abc');
  await d.hidden();
  let sent = false;
  for (let waited = 0; waited <= 1000 && !sent; waited += 50) {
    sent = (await shopRow()).note === before.note + typed + 'abc';
    if (!sent) await new Promise((r) => setTimeout(r, 50));
  }
  ok(sent, at + 'the hidden tab did not send the buffer within 1000 ms');
  await ctx.close();
}

/** Two browser lists, one with two entries, a quantity and a price, for the
 *  move of case 47; `MOVE_A_GM` is the first one's own GM payload,
 *  `encodeList(<list a>, false)`, computed once by hand. */
const MOVE_SEED = {
  'dhloot.lists.v2': JSON.stringify([
    {
      id: 'a',
      name: 'Клад дракона',
      ids: ['ci1', 'ci2'],
      meta: { ci1: { qty: 2, gold: 150 } },
      created: 1
    },
    { id: 'b', name: 'Лавка в порту', ids: [], created: 2 }
  ])
};
const MOVE_A_GM = '#/l/0JrQu9Cw0LQg0LTRgNCw0LrQvtC90LAKMi42eWoyfmNpMSoyKjE1MCxjaTI';
/** The fake seed's `gm1` and the ids the fake hands the two moved lists. */
const GM1_ID = '00000000-0000-4000-8000-000000000001';
const MOVED_A = '00000000-0000-4000-8000-000000005000';
const MOVED_B = '00000000-0000-4000-8000-000000005001';

async function storedOf(page) {
  return page.evaluate(() => ({
    lists: localStorage.getItem('dhloot.lists.v2'),
    migrated: JSON.parse(localStorage.getItem('dhloot.migrated.v1') ?? 'null')
  }));
}

async function browserListsMovedOnSignIn() {
  const at = '47 (browser lists moved on sign-in): ';
  /* Tab B, signed out, holds the lists in memory while tab A signs in. */
  const b = await sharedPage({ width: 1180, height: 900, storage: MOVE_SEED });
  await b.d.open('#/lists');
  ok(
    (await b.page.evaluate(() => document.querySelectorAll('.listcard').length)) === 2,
    at + 'tab B does not start with the two browser cards'
  );
  const a = await sharedPage({ width: 1180, height: 900, storage: MOVE_SEED });
  await a.d.open('#/lists', { as: 'gm1' });
  await a.d.moveSettled('47, tab A');
  const stored = await storedOf(a.page);
  ok(stored.lists === '[]', at + 'dhloot.lists.v2 does not read [] - ' + stored.lists);
  const m = stored.migrated;
  ok(
    m?.owner === GM1_ID &&
      m.lists?.a === MOVED_A &&
      m.lists?.b === MOVED_B &&
      JSON.stringify(m.notice) === JSON.stringify(['Клад дракона', 'Лавка в порту']),
    at +
      'dhloot.migrated.v1 does not hold the owner, both tombstones and both names - ' +
      JSON.stringify(m)
  );
  const read = await a.d.fake('lists.list');
  const rows = read?.ok ? read.lists.filter((l) => l.legacy_fingerprint !== null) : [];
  const moved = rows.find((l) => l.id === MOVED_A);
  ok(
    rows.length === 2 &&
      rows.every((l) => /^[0-9a-f]{64}$/.test(l.legacy_fingerprint)) &&
      moved?.list_entries.map((e) => [e.item_key, e.quantity, e.price_coins]).join(';') ===
        'ci1,2,150;ci2,1,',
    at +
      'the fake does not hold both rows with a fingerprint and the entries - ' +
      JSON.stringify(rows.map((l) => [l.id, l.legacy_fingerprint, l.list_entries.length]))
  );
  const notice =
    'Списки из этого браузера перенесены в ваш аккаунт: «Клад дракона», «Лавка в порту».';
  ok(
    (await a.page.evaluate(() => document.body.innerText)).includes(notice),
    at + 'the notice does not name the two lists'
  );
  await a.d.press('Скрыть');
  const dismissed = await storedOf(a.page);
  ok(
    dismissed.migrated && !('notice' in dismissed.migrated),
    at + '«Скрыть» left the names - ' + JSON.stringify(dismissed.migrated)
  );
  await b.d.shownAgain();
  ok(
    await waitIn(b.page, () => !document.querySelector('.listcard')),
    at + 'tab B, shown again, still draws a browser card'
  );
  await a.page.close();
  await b.page.close();

  /* Another account on the same browser moves nothing. */
  const other = await fresh({
    width: 1180,
    height: 900,
    storage: {
      ...MOVE_SEED,
      'dhloot.migrated.v1': JSON.stringify({ owner: GM1_ID, lists: {} })
    }
  });
  await other.d.open('#/lists', { as: 'gm2' });
  await other.d.moveSettled('47, another account');
  const theirs = await other.d.fake('lists.list');
  ok(
    theirs?.ok && theirs.lists.length === 1 && theirs.lists[0].name === 'Список второго ГМа',
    at + "another account's move took a list - " + JSON.stringify(theirs)
  );
  ok(
    (await other.page.evaluate(() => document.querySelectorAll('.listcard').length)) === 3,
    at + "another account does not see its own list and the browser's two"
  );
  await other.ctx.close();

  /* The OAuth return lands on the first list's own #/l/ page: it follows the
     list to its account address. */
  const back = await fresh({ width: 1180, height: 900, storage: MOVE_SEED });
  await back.d.open(MOVE_A_GM, { as: 'gm1' });
  await back.d.moveSettled('47, the own #/l/ page');
  await back.d.addressSettled();
  ok(
    await waitIn(
      back.page,
      (want) =>
        location.hash === want &&
        document.querySelector('input.titleinput')?.value === 'Клад дракона' &&
        (document.querySelector('.page-sub')?.textContent ?? '').includes('2 позиции'),
      '#/lists/' + MOVED_A
    ),
    at +
      'the own #/l/ page did not follow the list to its account address - ' +
      (await back.page.evaluate(() => location.hash))
  );
  ok(
    !(await back.page.evaluate(() =>
      [...document.querySelectorAll('button')].some((x) =>
        x.textContent.includes('Сохранить себе')
      )
    )),
    at + 'the moved list draws «Сохранить себе»'
  );
  await back.ctx.close();
}

/** A browser list for case 48: two entries, the second counted and priced;
 *  `READ_ONLY_OWN` is its own players' payload, computed once by hand. */
const READ_ONLY_SEED = {
  'dhloot.lists.v2': JSON.stringify([
    {
      id: 'a',
      name: 'Клад дракона',
      ids: ['ci1', 'ci2'],
      meta: { ci2: { qty: 2, gold: 750 } },
      created: 1
    }
  ])
};
const READ_ONLY_OWN = '#/l/0JrQu9Cw0LQg0LTRgNCw0LrQvtC90LAKMi5rdTl3fmNpMSxjaTIqMio3NTA';

async function readOnlyAfterTheCutoff() {
  const at = '48 (read-only after the cutoff): ';
  const today = '2026-10-26';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900, storage: READ_ONLY_SEED });
  await d.open('#/lists/a', { today });
  const before = (await storedOf(page)).lists;
  await d.type('Название списка', 'Другое имя');
  await d.type('1', '9');
  await d.addressSettled();
  ok(
    (await storedOf(page)).lists === before,
    at + 'a typed name or quantity changed dhloot.lists.v2'
  );
  ok(
    (await page.evaluate(() => location.hash)) === '#/lists/a',
    at + 'the address left #/lists/a - ' + (await page.evaluate(() => location.hash))
  );
  await d.open(READ_ONLY_OWN, { today });
  ok(
    (await page.evaluate(() => document.querySelector('h1')?.textContent ?? '')).includes(
      'Ссылки такого вида перестали открываться 26 октября 2026 года.'
    ),
    at + 'the own #/l/ payload does not draw the retired page'
  );
  const tabBar = () =>
    page.evaluate(() => {
      const links = [...document.querySelectorAll('nav.tabs a')];
      return {
        n: links.length,
        lists: links.some((a) => a.textContent.trim() === 'Списки'),
        h1: document.querySelector('h1')?.textContent ?? ''
      };
    });
  /* Compared with the bar before the cutoff, so a new section does not stale the count. */
  await d.open('#/lists', { today: '2026-10-01' });
  const open = await tabBar();
  await d.open('#/lists', { today });
  const bar = await tabBar();
  ok(
    open.lists && bar.n === open.n - 1 && !bar.lists && bar.h1 === 'Мои списки',
    at +
      'the bar is not the open bar without «Списки» over the lists index - ' +
      JSON.stringify({ open, bar })
  );
  await d.press('Клад дракона');
  ok(
    await waitIn(page, () => location.hash === '#/lists/a'),
    at +
      'a click on the browser card did not land on #/lists/a - ' +
      (await page.evaluate(() => location.hash))
  );
  await ctx.close();
}

/** 50. The signed-in header control's menu under real clicks and keys: its
 *  four items, Escape, «Мои списки», «Мои предметы», «Выйти» from an account list, and the
 *  open menu and `#/account` at 360 (docs/specs/FEATURES.md, "Chrome"). */
async function accountMenu() {
  const at = '50 (the account menu): ';
  const CONTROL = 'Аккаунт: gm1@example.test';
  const menuItems = (page) =>
    page.evaluate(() =>
      [...document.querySelectorAll('[role="menuitem"]')].map((e) => e.textContent.trim())
    );

  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/roll/std', { as: 'gm1' });
  await d.press(CONTROL);
  const items = await menuItems(page);
  ok(
    items.join('|') === 'Аккаунт|Мои списки|Мои предметы|Выйти',
    at + 'the menu does not hold the four items in order - ' + JSON.stringify(items)
  );
  ok(
    await waitIn(
      page,
      () => document.activeElement === document.querySelector('[role="menuitem"]')
    ),
    at + 'the first item does not have the focus'
  );
  await page.keyboard.press('Escape');
  ok(
    await waitIn(
      page,
      () =>
        !document.querySelector('[role="menu"]') &&
        document.activeElement === document.querySelector('header button[aria-haspopup="menu"]')
    ),
    at + 'Escape did not close the menu and give the focus back to the control'
  );
  await d.press(CONTROL);
  await d.press('Мои списки');
  ok(
    await waitIn(
      page,
      () => location.hash === '#/lists' && !document.querySelector('[role="menu"]')
    ),
    at + '«Мои списки» did not land on #/lists with the menu closed - ' + (await d.hash())
  );
  await d.press(CONTROL);
  await d.press('Мои предметы');
  ok(
    await waitIn(
      page,
      () => location.hash === '#/homebrew' && !document.querySelector('[role="menu"]')
    ),
    at + '«Мои предметы» did not land on #/homebrew with the menu closed - ' + (await d.hash())
  );

  await d.open(SHOP, { as: 'gm1' });
  ok(
    await waitIn(
      page,
      () => document.querySelector('input.titleinput')?.value === 'Лавка кузнеца'
    ),
    at + 'the account list did not open'
  );
  await d.press(CONTROL);
  await d.press('Выйти');
  ok(
    await waitIn(
      page,
      () =>
        location.hash === '#/lists' &&
        document.body.innerText.includes('Вы вышли из аккаунта.') &&
        (document.querySelector('header a.acct')?.textContent ?? '').includes('Войти')
    ),
    at + '«Выйти» did not sign out to #/lists with its toast and «Войти» - ' + (await d.hash())
  );
  await ctx.close();

  const narrow = await fresh({ width: 360, height: 800 });
  await narrow.d.open('#/roll/std', { as: 'gm1' });
  await narrow.d.press(CONTROL);
  const box = await narrow.page.evaluate(() => {
    const menu = document.querySelector('.acctmenu')?.getBoundingClientRect();
    return {
      left: menu?.left ?? -1,
      right: menu?.right ?? Infinity,
      width: innerWidth,
      heights: [...document.querySelectorAll('[role="menuitem"]')].map(
        (e) => e.getBoundingClientRect().height
      ),
      overflow: document.documentElement.scrollWidth > innerWidth
    };
  });
  ok(
    box.left >= 0 && box.right <= box.width && !box.overflow,
    at +
      '360: the open menu leaves the viewport or the page scrolls sideways - ' +
      JSON.stringify(box)
  );
  ok(
    box.heights.length === 4 && box.heights.every((h) => h >= 44),
    at + '360: a menu item is shorter than 44px - ' + JSON.stringify(box.heights)
  );
  await narrow.d.open('#/account', { as: 'gm1' });
  ok(
    await waitIn(narrow.page, () => !!document.querySelector('#display-home')),
    at + '360: the Display section did not draw'
  );
  const page360 = await narrow.page.evaluate(() => {
    const r = document.querySelector('#display-home')?.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      select: r ? [r.left, r.right, r.width, innerWidth] : null
    };
  });
  ok(
    !page360.overflow &&
      !!page360.select &&
      page360.select[2] > 0 &&
      page360.select[0] >= 0 &&
      page360.select[1] <= page360.select[3],
    at + '360: #/account scrolls sideways or hides the select - ' + JSON.stringify(page360)
  );
  await narrow.ctx.close();
}

/** 51. The signed-out move banner: its text, «Скрыть» until the next page
 *  load, and «Войти» through the sign-in back to the page with the list
 *  moved; at 360 it stays inside the viewport (docs/specs/FEATURES.md,
 *  "Account and browser lists"). */
async function moveBanner() {
  const at = '51 (the move banner): ';
  const TEXT =
    'Ваши списки хранятся только в этом браузере. Войдите до 26 октября 2026 года - и они перенесутся в аккаунт. После этой даты приложение перестанет их показывать.';
  const storage = {
    'dhloot.lists.v2': JSON.stringify([
      { id: 'a', name: 'Клад дракона', ids: ['ci1'], created: 1 }
    ])
  };
  const bannerText = (page) =>
    page.evaluate(() => document.querySelector('.movenotice')?.textContent ?? null);

  const { ctx, page, d } = await fresh({ width: 1180, height: 900, storage });
  await d.open('#/tables');
  ok(
    (await bannerText(page))?.includes(TEXT) === true,
    at + 'the banner does not read the full text - ' + JSON.stringify(await bannerText(page))
  );
  await d.press('Скрыть напоминание');
  ok((await bannerText(page)) === null, at + '«Скрыть» did not hide the banner');
  await d.go('#/roll/std');
  ok((await bannerText(page)) === null, at + 'a navigation brought the banner back');
  await d.open('#/roll/std');
  ok((await bannerText(page)) !== null, at + 'a reload did not bring the banner back');
  await d.press('Войти и перенести списки');
  ok(
    (await d.hash()) === '#/account' && (await bannerText(page)) === null,
    at + '«Войти» did not open #/account without the banner - ' + (await d.hash())
  );
  await d.press('Войти через Google');
  await d.moveSettled('51, after the sign-in');
  ok(
    await waitIn(
      page,
      () =>
        location.hash === '#/roll/std' &&
        (document.querySelector('.movenotice')?.textContent ?? '').includes(
          'Списки из этого браузера перенесены в ваш аккаунт: «Клад дракона».'
        )
    ),
    at +
      'the sign-in did not come back to #/roll/std with the moved-lists notice - ' +
      (await d.hash()) +
      ' ' +
      JSON.stringify(await bannerText(page))
  );
  await ctx.close();

  const narrow = await fresh({ width: 360, height: 800, storage });
  await narrow.d.open('#/roll/std');
  const box = await narrow.page.evaluate(() => {
    const rects = [
      document.querySelector('.movenotice'),
      ...document.querySelectorAll('.movenotice button')
    ].map((e) => e?.getBoundingClientRect() ?? null);
    return {
      inside: rects.every((r) => !!r && r.width > 0 && r.left >= 0 && r.right <= innerWidth),
      buttons: rects.length - 1,
      overflow: document.documentElement.scrollWidth > innerWidth
    };
  });
  ok(
    box.inside && box.buttons === 2 && !box.overflow,
    at + '360: the banner or a button leaves the viewport - ' + JSON.stringify(box)
  );
  await narrow.ctx.close();
}

/** A file of docs/fixtures/import/. */
const IMPORT_FILE = (name) => path.join(__dirname, '../../docs/fixtures/import', name);
/** The account cards' pick boxes that are ticked, and the strip's summary. */
const picks = () => ({
  ticked: document.querySelectorAll('.listcard-pick input:checked').length,
  summary: document.querySelector('.batch-summ')?.textContent.trim() ?? ''
});

/** 58. The ticked lists download as one lists file: two account cards ticked,
 *  «Скачать JSON (2)» saves the dated file of the test build's clock with the
 *  two lists in index order and both notes, version 2 because «Лавка кузнеца»
 *  refers to the axe, which it carries with its snapshot; the ticks stay. */
async function ticksDownloadAsOneFile() {
  const at = '58 (the ticked lists download as one lists file): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/lists', { as: 'gm1' });
  await waitIn(page, () => !!document.querySelector('.listcard-pick'));
  await d.tick('Выбрать: Пустой список');
  await d.tick('Выбрать: Лавка кузнеца');
  await d.press('Скачать JSON (2)');
  await waitIn(page, () => !!window.__download);
  const file = await d.download();
  ok(
    file?.filename === 'daggerheart-loot-lists-2026-10-01.json',
    at + 'the file name - ' + JSON.stringify(file?.filename)
  );
  ok(file?.type === 'application/json', at + 'the type - ' + JSON.stringify(file?.type));
  const doc = file ? JSON.parse(Buffer.from(file.base64, 'base64').toString('utf8')) : null;
  ok(
    doc?.format === 'daggerheart-loot/lists' &&
      doc?.version === 2 &&
      doc?.exported_at === '2026-10-01T12:00:00.000Z',
    at + 'the head - ' + JSON.stringify(doc && { ...doc, lists: undefined })
  );
  const names = (doc?.lists ?? []).map((l) => l.name);
  ok(
    JSON.stringify(names) === JSON.stringify(['Пустой список', 'Лавка кузнеца']),
    at + 'the lists, in index order - ' + JSON.stringify(names)
  );
  const shop = doc?.lists?.[1];
  const ci1 = shop?.entries?.find((e) => e.id === 'ci1');
  const q1 = shop?.entries?.find((e) => e.id === 'q1');
  ok(
    ci1?.quantity === 2 && ci1?.price_coins === 150 && !!q1?.player_note,
    at + 'ci1 at 2 and 150, q1 with its player note - ' + JSON.stringify({ ci1, q1 })
  );
  ok(shop?.money_mode === 'coin', at + 'no coin money mode on «Лавка кузнеца»');
  const axe = shop?.entries?.find((e) => e.id === 'hb_emberaxeaaaaaaaa');
  ok(
    axe?.source === 'homebrew' && axe?.snapshot?.id === 'hb_emberaxeaaaaaaaa',
    at + 'the axe is not a homebrew entry with its snapshot - ' + JSON.stringify(axe)
  );
  ok(
    (doc?.lists ?? []).every((l) => !('id' in l)),
    at + 'a list carries an id - ' + JSON.stringify(doc?.lists)
  );
  const after = await page.evaluate(picks);
  ok(after.ticked === 2, at + 'the ticks went - ' + JSON.stringify(after));
  await ctx.close();
}

/** 59. The account's data zip reads back through the import field: «Скачать
 *  мои данные (ZIP)» saves the dated zip, and the app's own reader previews
 *  its three lists; the fixture data.zip previews the same. */
async function dataZipReadsBack() {
  const at = "59 (the account's data zip reads back through the import field): ";
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/account', { as: 'gm1' });
  ok(
    await waitIn(page, () =>
      [...document.querySelectorAll('button')].some(
        (b) => b.textContent.trim() === 'Скачать мои данные (ZIP)' && !b.disabled
      )
    ),
    at + 'the button is not enabled'
  );
  await d.press('Скачать мои данные (ZIP)');
  await waitIn(page, () => !!window.__download);
  const file = await d.download();
  ok(
    file?.filename === 'daggerheart-loot-data-2026-10-01.zip',
    at + 'the file name - ' + JSON.stringify(file?.filename)
  );
  ok(file?.type === 'application/zip', at + 'the type - ' + JSON.stringify(file?.type));
  const bytes = file ? Buffer.from(file.base64, 'base64') : Buffer.alloc(0);
  ok(
    bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])),
    at + 'the file does not start PK\\x03\\x04'
  );
  const tmp = path.join(os.tmpdir(), 'dhloot-state-59-' + String(process.pid) + '.zip');
  fs.writeFileSync(tmp, bytes);
  try {
    await d.go('#/lists');
    await waitIn(page, () => !!document.querySelector('.listcard-pick'));
    await d.press('Импорт из файла');
    await d.upload(tmp);
    ok(
      await waitIn(page, bodyHas, 'Импортировать (3)'),
      at + 'the downloaded zip does not offer «Импортировать (3)»'
    );
    ok(
      (await d.text()).includes('Списков: 3'),
      at + 'the downloaded zip does not preview «Списков: 3»'
    );
    await d.upload(IMPORT_FILE('data.zip'));
    ok(
      await waitIn(page, bodyHas, 'Списков: 3'),
      at + 'data.zip does not preview «Списков: 3»'
    );
  } finally {
    fs.rmSync(tmp, { force: true });
  }
  await ctx.close();
}

/** 60. An imported list opens with its rows in file order: example.json
 *  imports, its card comes first «изменён только что», and its page draws
 *  ci1, q1, q313 with ci1 at quantity 2 and 150. */
async function importedListOpens() {
  const at = '60 (an imported list opens with its rows in file order): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/lists', { as: 'gm1' });
  await waitIn(page, () => !!document.querySelector('.listcard-pick'));
  await d.press('Импорт из файла');
  await d.upload(IMPORT_FILE('example.json'));
  await waitIn(page, bodyHas, 'Импортировать (1)');
  await d.press('Импортировать (1)');
  ok(
    await waitIn(page, bodyHas, 'Импортировано списков: 1'),
    at + 'no toast «Импортировано списков: 1»'
  );
  const first = await page.evaluate(() => {
    const card = document.querySelector('.listcard');
    return {
      name: card?.querySelector('.listcard-top b')?.textContent,
      meta: card?.querySelector('.listcard-meta')?.textContent,
      href: card?.querySelector('a.listcard-main')?.getAttribute('href')
    };
  });
  ok(
    first.name === 'Лавка кузнеца' && (first.meta ?? '').includes('изменён только что'),
    at + 'the first card - ' + JSON.stringify(first)
  );
  await d.go(first.href ?? '#/lists');
  await waitIn(page, () => document.querySelectorAll('.lrow').length === 3);
  const shown = await page.evaluate(() => ({
    sub: document.querySelector('.page-sub')?.textContent ?? '',
    rows: [...document.querySelectorAll('.lrow .lrow-pick input')].map((i) =>
      i.getAttribute('aria-label')
    ),
    qty: document.querySelector('.lrow input[data-qty]')?.value ?? '',
    gold: document.querySelector('.lrow input[data-gold]')?.value ?? ''
  }));
  ok(shown.sub.includes('3 позиции'), at + 'the sub - ' + JSON.stringify(shown.sub));
  ok(
    JSON.stringify(shown.rows) ===
      JSON.stringify(['Первоклассный Спальный Мешок', 'Палаш', 'Стеганый Доспех']),
    at + 'the rows - ' + JSON.stringify(shown.rows)
  );
  ok(
    shown.qty === '2' && shown.gold === '150',
    at + 'ci1 does not hold 2 at 150 - ' + JSON.stringify(shown)
  );
  await ctx.close();
}

/** 61. Ticked lists are deleted together after one confirm: the confirm names
 *  both, both cards go, the toast has no «Вернуть», and the fake holds «Лавка
 *  кузнеца» alone once the buffer is sent (a reload re-seeds the fake). */
async function tickedListsDeletedTogether() {
  const at = '61 (ticked lists are deleted together after one confirm): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/lists', { as: 'gm1' });
  await waitIn(page, () => !!document.querySelector('.listcard-pick'));
  await d.tick('Выбрать: Пустой список');
  await d.tick('Выбрать: Трофеи');
  await d.press('Удалить (2)');
  const asked = d.dialog() ?? '';
  ok(
    asked.includes('«Пустой список»') && asked.includes('«Трофеи»'),
    at + 'the confirm does not name both - ' + JSON.stringify(asked)
  );
  const after = await page.evaluate(() => ({
    cards: [...document.querySelectorAll('.listcard-top b')].map((b) => b.textContent),
    undo: [...document.querySelectorAll('button')].some((b) => b.textContent === 'Вернуть'),
    toast: document.body.innerText.includes('Удалено списков: 2')
  }));
  ok(
    JSON.stringify(after.cards) === JSON.stringify(['Лавка кузнеца']),
    at + 'the cards - ' + JSON.stringify(after.cards)
  );
  ok(after.toast, at + 'no toast «Удалено списков: 2»');
  ok(!after.undo, at + 'the toast offers «Вернуть»');
  /* The buffer is sent at once on the hidden signal. */
  await d.hidden();
  let held = null;
  for (let i = 0; i < 60; i++) {
    const read = await d.fake('lists.list');
    held = read?.ok ? read.lists.map((l) => l.name) : null;
    if (held && held.length === 1) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  ok(
    JSON.stringify(held) === JSON.stringify(['Лавка кузнеца']),
    at + 'the fake holds - ' + JSON.stringify(held)
  );
  await ctx.close();
}

/** 62. A search prunes the ticks and «Выбрать все» ticks the drawn cards
 *  only: twelve account lists; a tick the query hides is dropped for good,
 *  and the checked boxes always equal the summary's number. */
async function searchPrunesTicks() {
  const at = '62 (a search prunes the ticks and select-all ticks the drawn cards only): ';
  const names = [
    'Порт Ветров',
    'Рынок',
    'Лавка в порту',
    ...Array.from({ length: 6 }, (_, i) => 'Сессия ' + String(i + 1))
  ];
  const storage = {
    'dhloot.lists.v2': JSON.stringify(
      names.map((name, i) => ({ id: 'p' + String(i), name, ids: [], created: 100 - i }))
    )
  };
  const { ctx, page, d } = await fresh({ width: 1180, height: 900, storage });
  await d.open('#/lists', { as: 'gm1' });
  await d.moveSettled('62');
  ok(
    (await d.count('.listcard-pick')) === 12,
    at + 'twelve account cards are not drawn - ' + String(await d.count('.listcard-pick'))
  );
  const agree = async (step, summary) => {
    const p = await page.evaluate(picks);
    const n = Number(/\d+/.exec(p.summary)?.[0] ?? 0);
    ok(p.summary === summary, at + step + ': the summary - ' + JSON.stringify(p));
    ok(
      p.ticked === n,
      at + step + ': checked boxes and the summary differ - ' + JSON.stringify(p)
    );
  };
  await d.tick('Выбрать: Порт Ветров');
  await d.tick('Выбрать: Рынок');
  await agree('two ticked', 'Выбрано 2');
  await d.type('Найти список', 'порт');
  await agree('the query', 'Выбрано 1');
  ok((await d.text()).includes('Удалить (1)'), at + 'the query does not leave «Удалить (1)»');
  await d.type('Найти список', '');
  const rynok = await page.evaluate(
    () =>
      [...document.querySelectorAll('.listcard-pick input')].find(
        (i) => i.getAttribute('aria-label') === 'Выбрать: Рынок'
      )?.checked
  );
  ok(rynok === false, at + '«Рынок» came back ticked');
  await agree('the query cleared', 'Выбрано 1');
  await d.type('Найти список', 'порт');
  await d.tick('Выбрать все');
  await agree('select-all over the query', 'Выбрано 2');
  ok(
    (await d.text()).includes('Скачать JSON (2)'),
    at + 'select-all does not offer «Скачать JSON (2)»'
  );
  await ctx.close();
}

/** 63. The relation folds, the fold summary and the preview menu: as `gm3`, q1's
 *  ladder of 19 rungs folds to 7 and opens on a click with the focus kept, every
 *  rung inside the card; ci1's 15 upgrades open inside the window; voa4_t3d's set
 *  line folds after three own members. Each `#/homebrew` fold summary is a 24 px
 *  target; the editor preview's add-to-list menu stays inside the capped preview. */
async function relationFolds() {
  const at = '63 (relation folds, the fold summary and the preview menu): ';
  /* The fold button of the line or the ladder, by its text. */
  const foldIn = (scope, text) =>
    [...document.querySelectorAll(scope + ' .btn.bare')].find(
      (b) => b.textContent.trim() === text
    );
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  };
  for (const [width, height] of [
    [360, 800],
    [1180, 900]
  ]) {
    const w = String(width) + ': ';
    const { ctx, page, d } = await fresh({ width, height });
    await d.open('#/i/q1', { as: 'gm3' });
    ok(
      await waitIn(page, () => document.querySelectorAll('.steps .step').length === 7),
      at + w + 'q1 does not draw 7 rungs closed - ' + String(await d.count('.steps .step'))
    );
    const closed = await page.evaluate(() => document.querySelector('.steps')?.offsetHeight);
    await d.press('и ещё 12');
    const open = await page.evaluate(
      (foldSrc, boxSrc) => {
        const fold = eval(foldSrc);
        const boxOf = eval(boxSrc);
        const btn = fold('.steps', 'свернуть');
        const card = document.querySelector('.card');
        return {
          rungs: [...document.querySelectorAll('.steps .step')].map(boxOf),
          card: card ? boxOf(card) : null,
          expanded: btn?.getAttribute('aria-expanded') ?? null,
          focused: !!btn && document.activeElement === btn,
          height: document.querySelector('.steps')?.offsetHeight,
          sideways: document.documentElement.scrollWidth > innerWidth
        };
      },
      foldIn.toString(),
      box.toString()
    );
    ok(
      open.rungs.length === 19,
      at + w + 'q1 does not open 19 rungs - ' + String(open.rungs.length)
    );
    ok(
      open.expanded === 'true',
      at + w + '«свернуть» is not expanded - ' + String(open.expanded)
    );
    ok(open.focused, at + w + 'the focus left the fold button');
    ok(
      open.rungs.every((r) => r.h >= 26 && !!open.card && inside(r, open.card)),
      at + w + 'a rung is under 26 px or outside the card - ' + JSON.stringify(open.rungs)
    );
    ok(!open.sideways, at + w + 'the open ladder scrolls the page sideways');
    console.log(
      '  63 ladder heights at ' +
        String(width) +
        ': closed ' +
        String(closed) +
        ', open ' +
        String(open.height)
    );

    await d.open('#/i/ci1', { as: 'gm3' });
    ok(
      await waitIn(page, () => document.body.innerText.includes('и ещё 12')),
      at + w + 'ci1 does not draw «и ещё 12»'
    );
    await d.press('и ещё 12');
    const into = await page.evaluate(() => {
      const p = [...document.querySelectorAll('.craft p')].find(
        (e) => e.querySelector('.craft-l')?.textContent === 'Улучшается до'
      );
      const links = [...(p?.querySelectorAll('a') ?? [])];
      const long = links.find((a) => a.textContent.startsWith('Спальный мешок долгой'));
      const r = long?.getBoundingClientRect();
      return {
        links: links.length,
        long: !!r && r.left >= 0 && r.right <= innerWidth,
        sideways: document.documentElement.scrollWidth > innerWidth
      };
    });
    ok(into.links === 15, at + w + 'ci1 does not open 15 links - ' + String(into.links));
    ok(into.long, at + w + 'the 120-code-point name lies outside the window');
    ok(!into.sideways, at + w + 'the open line scrolls the page sideways');

    await d.open('#/i/voa4_t3d', { as: 'gm3' });
    ok(
      await waitIn(page, () => document.body.innerText.includes('и ещё 1')),
      at + w + 'voa4_t3d does not draw «и ещё 1»'
    );
    const set = await page.evaluate(() => {
      const p = [...document.querySelectorAll('.craft p')].find(
        (e) => e.querySelector('.craft-l')?.textContent === 'Комплект'
      );
      return [...(p?.querySelectorAll('a, span[aria-current]') ?? [])].length;
    });
    ok(set === 6, at + w + 'the set line does not draw 6 names - ' + String(set));
    await d.press('и ещё 1');
    const found = await axe(page);
    ok(
      found.length === 0,
      at + w + 'axe with the set fold open - ' + JSON.stringify(found.map((v) => v.id))
    );
    await ctx.close();
  }

  {
    const { ctx, page, d } = await fresh({ width: 360, height: 800 });
    await d.open('#/homebrew/sets', { as: 'gm1' });
    ok(
      await waitIn(page, () => !!document.querySelector('.hbtab .head .name button')),
      at + 'the #/homebrew/sets card folds did not draw'
    );
    const heights = await page.evaluate(() =>
      [
        ...document.querySelectorAll('nav a.chip'),
        ...document.querySelectorAll('.hbtab .head .name button')
      ].map((e) => [e.textContent.trim(), e.getBoundingClientRect().height])
    );
    ok(
      heights.length === 5 && heights.every(([, h]) => h >= 24),
      at + 'a tab chip or a card fold is under 24 px - ' + JSON.stringify(heights)
    );
    await ctx.close();
  }

  /* The address key scrolls its card below the sticky top bar, not under it. */
  for (const [width, height] of [
    [360, 480],
    [1180, 480]
  ]) {
    const w = String(width) + ': ';
    const { ctx, page, d } = await fresh({ width, height });
    await d.open('#/homebrew/sets/hb_aldersetaaaaaaaa', { as: 'gm1' });
    ok(
      await waitIn(
        page,
        () => !!document.querySelector('.cards > li .head .name button[aria-expanded="true"]')
      ),
      at + w + 'the address key did not open its card'
    );
    /* The scroll has settled when scrollY holds across two frames. */
    await waitIn(page, async () => {
      const a = scrollY;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return a > 0 && scrollY === a;
    });
    const land = await page.evaluate(() => {
      const li = document
        .querySelector('.cards > li .head .name button[aria-expanded="true"]')
        ?.closest('li');
      const bar = document.querySelector('.topbar');
      return {
        head: li ? li.getBoundingClientRect().top : null,
        bar: bar ? bar.getBoundingClientRect().bottom : null,
        scrollY,
        scrolls: document.documentElement.scrollHeight > innerHeight
      };
    });
    ok(
      land.head !== null && land.bar !== null && land.head >= land.bar - 1,
      at + w + 'the open card head lies under the top bar - ' + JSON.stringify(land)
    );
    /* At 360 the gm1 page is long enough to scroll, so the margin itself is measured. */
    if (width === 360) {
      ok(
        land.scrollY > 0,
        at + w + 'the page did not scroll to the card - ' + JSON.stringify(land)
      );
    }
    console.log('  63 card landing at ' + String(width) + 'x480: ' + JSON.stringify(land));
    await ctx.close();
  }

  {
    const { ctx, page, d } = await fresh({ width: 960, height: 720 });
    await d.open('#/homebrew/hb_emberaxeaaaaaaaa', { as: 'gm1' });
    ok(
      await waitIn(page, () =>
        [...document.querySelectorAll('.preview button')].some(
          (b) => b.textContent.trim() === 'Добавить в список'
        )
      ),
      at + 'the preview does not draw «Добавить в список»'
    );
    const add = await page.evaluateHandle(() =>
      [...document.querySelectorAll('.preview button')].find(
        (b) => b.textContent.trim() === 'Добавить в список'
      )
    );
    await add.asElement()?.click();
    await add.dispose();
    await d.settle();
    const m = await page.evaluate(() => {
      const preview = document.querySelector('.preview');
      const menu = preview?.querySelector('.dropmenu');
      const items = [...(menu?.querySelectorAll('button, a[href], input') ?? [])];
      const last = items[items.length - 1];
      last?.scrollIntoView({ block: 'nearest' });
      const boxOf = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      };
      return {
        menu: !!menu,
        overflow: preview ? getComputedStyle(preview).overflowY : null,
        last: last ? boxOf(last) : null,
        preview: preview ? boxOf(preview) : null
      };
    });
    ok(m.menu, at + 'the menu does not open inside .preview');
    ok(m.overflow === 'auto', at + '.preview overflow-y is ' + String(m.overflow));
    ok(
      !!m.last && !!m.preview && inside(m.last, m.preview),
      at + "the menu's last item lies outside the preview - " + JSON.stringify(m)
    );
    const found = await axe(page);
    ok(
      found.length === 0,
      at + 'axe with the preview menu open - ' + JSON.stringify(found.map((v) => v.id))
    );
    await ctx.close();
  }
}

/** 64. The «Свой предмет» row after the entries at 360x640 as `gm1`: the open
 *  panel's «Название» in view, nothing sideways, «Добавить в список» not
 *  covered at the maximum scroll with a row ticked (the list page's batch bar
 *  is in flow, not sticky), and a 120-character name keeping
 *  the toast's «Изменить» on screen; then at 1180 a hand-resized row note box
 *  keeps its height across a fold and an unfold. */
async function ownItemRowAndNoteBox() {
  const at = '64 (the own-item row and a row note box): ';
  {
    const { ctx, page, d } = await fresh({ width: 360, height: 640 });
    await d.open(SHOP, { as: 'gm1' });
    ok(
      await waitIn(page, () => !!document.querySelector('button.addrow')),
      at + 'the row «Свой предмет» did not draw'
    );
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await d.press('Свой предмет');
    const opened = await page.evaluate(() => {
      const name = document.getElementById('qi-name');
      const r = name?.getBoundingClientRect();
      return {
        expanded: document.querySelector('button.addrow')?.getAttribute('aria-expanded'),
        nameInView: !!r && r.top >= 0 && r.bottom <= innerHeight,
        sideways: document.documentElement.scrollWidth > innerWidth
      };
    });
    ok(opened.expanded === 'true', at + 'the row is not expanded - ' + opened.expanded);
    ok(opened.nameInView, at + '«Название» is out of view after the press');
    ok(!opened.sideways, at + 'the open panel scrolls the page sideways');

    const first = await page.evaluate(() =>
      document.querySelector('.lrow input[type="checkbox"]')?.getAttribute('aria-label')
    );
    await d.tick(first ?? '');
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await d.settle();
    const add = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('.quick button')].find(
        (b) => b.textContent.trim() === 'Добавить в список'
      );
      const r = btn?.getBoundingClientRect();
      if (!btn || !r) return null;
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { hit: !!hit && btn.contains(hit), bar: !!document.querySelector('.batch.on') };
    });
    ok(!!add?.bar, at + 'the ticked row raised no batch bar');
    ok(
      !!add?.hit,
      at + '«Добавить в список» is covered at the maximum scroll - ' + JSON.stringify(add)
    );

    const long = Array.from({ length: 20 }, () => 'Фляга')
      .join(' ')
      .slice(0, 120);
    await page.evaluate((v) => {
      const name = document.getElementById('qi-name');
      name.focus();
      name.value = v;
      name.dispatchEvent(new Event('input', { bubbles: true }));
    }, long);
    const press = await page.evaluateHandle(() =>
      [...document.querySelectorAll('.quick button')].find(
        (b) => b.textContent.trim() === 'Добавить в список'
      )
    );
    await press.asElement()?.click();
    await press.dispose();
    ok(
      await waitIn(page, () => !!document.querySelector('.toast a.toast-act')),
      at + 'the toast has no «Изменить» link'
    );
    const edit = await page.evaluate(() => {
      const r = document.querySelector('.toast a.toast-act').getBoundingClientRect();
      return { left: r.left, right: r.right, focused: document.activeElement?.id };
    });
    ok(
      edit.left >= 0 && edit.right <= 360,
      at + '«Изменить» lies outside 0..360 - ' + JSON.stringify(edit)
    );
    ok(edit.focused === 'qi-name', at + 'focus left «Название» - ' + String(edit.focused));
    await ctx.close();
  }
  {
    const { ctx, page, d } = await fresh({
      width: 1180,
      height: 900,
      storage: {
        'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'Тайник', ids: ['ci1'] }])
      }
    });
    await d.open('#/lists/a');
    await d.press('Заметка');
    const marked = await page.evaluate(() => {
      const ta = document.querySelector('.rnote textarea');
      if (!ta) return false;
      ta.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      ta.style.height = '200px';
      ta.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      return ta.dataset.manual === '1';
    });
    ok(marked, at + 'the box was not marked hand-sized');
    await d.press('Заметка');
    ok((await d.count('.rnote')) === 0, at + 'a folded empty box is still in the document');
    await d.press('Заметка');
    const height = await page.evaluate(
      () => document.querySelector('.rnote textarea')?.style.height ?? null
    );
    ok(height === '200px', at + 'the hand height did not survive the fold - ' + String(height));
    await ctx.close();
  }
}

/** 65. The requests panel of «Лавка кузнеца» at 360x640 as `gm1` with four requests, the
 *  newest of seven lines: three requests and five lines drawn, the panel under 1000 px,
 *  the first «Принять» within one screen under the panel head, nothing sideways; the
 *  line fold opens in place and keeps the focus (docs/specs/FEATURES.md, "Account and
 *  browser lists"). */
async function requestsPanelFolds() {
  const at = '65 (the requests panel folds at 360): ';
  const { ctx, page, d } = await fresh({ width: 360, height: 640 });
  await d.open(SHOP, { as: 'gm1' });
  await waitIn(page, () => !!document.querySelector('h1 input'));
  await d.fake('request', 'player-token-1', [
    { item: 'ci1', qty: 1 },
    { item: 'cc1', qty: 3 }
  ]);
  await d.fake('request', 'gm-token-1', [{ item: 'cc1', qty: 9 }]);
  await d.fake('request', 'player-token-1', [{ item: 'q1', qty: 1 }]);
  await d.fake(
    'request',
    'gm-token-1',
    ['ci1', 'q1', 'q313', 'cc1', 'voa2_a3', 'q23', 'w51'].map((item) => ({ item, qty: 1 }))
  );
  ok(
    await waitIn(page, () => document.body.innerText.includes('Новое в списке (4)')),
    at + 'the panel did not count four requests'
  );
  const m = await page.evaluate(() => {
    const panel = document.querySelector('.reqpanel');
    const head = panel?.querySelector('h2')?.getBoundingClientRect();
    const take = [...(panel?.querySelectorAll('button') ?? [])].find(
      (b) => b.textContent.trim() === 'Принять'
    );
    return {
      reqs: panel?.querySelectorAll('.req').length ?? 0,
      lines: panel?.querySelector('.req')?.querySelectorAll('tbody tr').length ?? 0,
      height: panel?.getBoundingClientRect().height ?? 0,
      take: head && take ? take.getBoundingClientRect().bottom - head.top : null,
      sideways: document.documentElement.scrollWidth > innerWidth
    };
  });
  ok(m.reqs === 3, at + 'not three requests drawn - ' + JSON.stringify(m));
  ok(m.lines === 5, at + 'the first request does not draw five lines - ' + JSON.stringify(m));
  ok(m.height > 0 && m.height < 1000, at + 'the panel is not under 1000 px - ' + m.height);
  ok(
    m.take !== null && m.take <= 640,
    at + 'the first «Принять» is past one screen under the head - ' + JSON.stringify(m)
  );
  ok(!m.sideways, at + 'the panel scrolls the page sideways');
  await d.press('и ещё 2 позиции');
  const open = await page.evaluate(() => ({
    lines: document.querySelector('.reqpanel .req')?.querySelectorAll('tbody tr').length ?? 0,
    focus: document.activeElement?.textContent.trim() ?? ''
  }));
  ok(open.lines === 7, at + 'the fold did not draw every line - ' + JSON.stringify(open));
  ok(open.focus === 'свернуть', at + 'the focus left the fold button - ' + open.focus);
  await ctx.close();
}

/** 66. A 200-character unbroken list name at 360 as `gm1`: its card on `#/lists`, its
 *  page heading and its delete toast wrap, and nothing scrolls sideways
 *  (docs/specs/FEATURES.md, "Consistency rules", rule 16). */
async function longListName() {
  const at = '66 (a 200-character list name at 360): ';
  const { ctx, page, d } = await fresh({ width: 360, height: 640 });
  const long = 'Ж'.repeat(200);
  await d.open('#/lists', { as: 'gm1' });
  await waitIn(page, () => document.body.innerText.includes('Трофеи'));
  await d.fake('setLive', false);
  await d.fake('lists.apply', [
    { op: 'update', id: '00000000-0000-4000-8000-000000000103', patch: { name: long } }
  ]);
  await d.shownAgain();
  ok(
    await waitIn(page, (v) => document.body.innerText.includes(v), long),
    at + 'the long name did not draw on #/lists'
  );
  const sideways = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  ok(!(await sideways()), at + 'the card scrolls #/lists sideways');
  await page.evaluate(() => {
    location.hash = '#/lists/00000000-0000-4000-8000-000000000103';
  });
  await waitIn(page, () => !!document.querySelector('h1 input'));
  ok(!(await sideways()), at + 'the list page scrolls sideways');
  await page.evaluate(() => {
    location.hash = '#/lists';
  });
  await waitIn(page, () => document.body.innerText.includes('Пустой список'));
  const index = await page.evaluate(
    (v) =>
      [...document.querySelectorAll('.listcard')].findIndex((c) => c.textContent.includes(v)),
    long
  );
  ok(index >= 0, at + 'the long name has no card after the return');
  if (index >= 0) {
    await d.press('Удалить', index);
    ok(
      await waitIn(page, () => !!document.querySelector('.toast:popover-open')),
      at + 'the delete toast did not show'
    );
    const toast = await page.evaluate(() => {
      const r = document.querySelector('.toast')?.getBoundingClientRect();
      return r ? { left: r.left, right: r.right } : null;
    });
    ok(
      !!toast && toast.left >= 0 && toast.right <= 360,
      at + 'the toast lies outside 0..360 - ' + JSON.stringify(toast)
    );
    ok(!(await sideways()), at + 'the toast scrolls the page sideways');
  }
  await ctx.close();
}

/** 67. The editor's field help and the threshold labels at 360x640 as `gm1`: the «?» of
 *  «Комплект» opens its hint under its label inside 0..360; an armour's two threshold
 *  labels and boxes lie inside 0..360; nothing scrolls sideways (docs/specs/FEATURES.md,
 *  "Consistency rules", rule 15). */
async function fieldHelpAt360() {
  const at = '67 (field help and threshold labels at 360): ';
  const { ctx, page, d } = await fresh({ width: 360, height: 640 });
  const sideways = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await d.open('#/homebrew/hb_emberaxeaaaaaaaa', { as: 'gm1' });
  ok(
    await waitIn(page, () => !!document.querySelector('#hb-name')),
    at + 'the axe editor did not draw'
  );
  await d.click('Связи');
  await d.click('Подсказка: Комплект');
  const help = await page.evaluate(() => {
    const button = document.querySelector('button[aria-controls="hb-set-help"]');
    const hint = document.getElementById('hb-set-help');
    const label = document.querySelector('label[for="hb-set"]');
    const h = hint?.getBoundingClientRect();
    const l = label?.getBoundingClientRect();
    return {
      expanded: button?.getAttribute('aria-expanded') ?? null,
      left: h?.left ?? -1,
      right: h?.right ?? 999,
      height: h?.height ?? 0,
      under: !!h && !!l && h.top >= l.bottom
    };
  });
  ok(help.expanded === 'true', at + 'the «?» is not expanded - ' + JSON.stringify(help));
  ok(
    help.height > 0 && help.left >= 0 && help.right <= 360,
    at + 'the hint lies outside 0..360 - ' + JSON.stringify(help)
  );
  ok(help.under, at + 'the hint is not under its label - ' + JSON.stringify(help));
  ok(!(await sideways()), at + 'the open hint scrolls the editor sideways');
  await page.evaluate(() => {
    location.hash = '#/homebrew/new';
  });
  ok(
    await waitIn(
      page,
      () => !document.querySelector('#hb-dmg') && !!document.querySelector('#hb-name')
    ),
    at + 'the new item did not draw'
  );
  await d.click('Снаряжение');
  await d.click('Броня');
  ok(
    await waitIn(page, () => !!document.querySelector('#hb-th1')),
    at + 'the armour fields did not draw'
  );
  const boxes = await page.evaluate(() =>
    ['label[for="hb-th0"]', '#hb-th0', 'label[for="hb-th1"]', '#hb-th1'].map((sel) => {
      const r = document.querySelector(sel)?.getBoundingClientRect();
      return r ? { sel, left: r.left, right: r.right } : { sel, left: -1, right: 999 };
    })
  );
  for (const b of boxes) {
    ok(
      b.left >= 0 && b.right <= 360,
      at + b.sel + ' lies outside 0..360 - ' + JSON.stringify(b)
    );
  }
  ok(!(await sideways()), at + 'the armour form scrolls sideways');
  await ctx.close();
}

/** 69. The GM-only toggle at 1180 and 360 as `gm1` on «Лавка кузнеца»: at 1180x900 the
 *  pressed row's three action buttons are each at least 24 px tall, and at both widths its
 *  visually hidden ", Только для мастера" box is at most 1x1 px; on a 360x640 phone a
 *  120-character own item's row keeps note, eye and cross at 44 px on the meta box's line
 *  inside 0..360, and «Скрыть от игроков (2)» lies inside 0..360; nothing scrolls
 *  sideways (docs/specs/FEATURES.md, "Account and browser lists"). */
async function gmOnlyToggle() {
  const at = '69 (the GM-only toggle at 1180 and 360): ';
  const sideways = (page) =>
    page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  /* The action buttons of the row whose eye ends with `tail`, after a press on that eye. */
  const pressAndMeasure = (page, tail) =>
    page.evaluate(async (v) => {
      const eye = [...document.querySelectorAll('.lrow-acts .lrow-gm')].find((b) =>
        (b.getAttribute('aria-label') ?? '').endsWith(v)
      );
      if (!eye) return null;
      eye.click();
      /* Two frames: the store's redraw, then the layout it moves. */
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const row = eye.closest('.lrow');
      const acts = row.querySelector('.lrow-acts').getBoundingClientRect();
      const meta = row.querySelector('.lrow-meta').getBoundingClientRect();
      const state = row.querySelector('.gmstate')?.getBoundingClientRect();
      return {
        pressed: eye.getAttribute('aria-pressed'),
        dashed: row.classList.contains('gm-only'),
        state: state ? { w: state.width, h: state.height } : null,
        rowRight: row.getBoundingClientRect().right,
        actsTop: acts.top,
        metaBottom: meta.bottom,
        buttons: [...row.querySelectorAll('.lrow-acts button')].map((b) => {
          const r = b.getBoundingClientRect();
          return { w: Math.round(r.width), h: Math.round(r.height), right: r.right };
        })
      };
    }, tail);
  {
    const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
    await d.open(SHOP, { as: 'gm1' });
    ok(
      await waitIn(page, () => !!document.querySelector('.lrow-acts .lrow-gm')),
      at + 'the eye did not draw at 1180'
    );
    const m = await pressAndMeasure(page, 'Брошюра по Истории Искусства');
    console.log('  69 at 1180: ' + JSON.stringify(m));
    ok(!!m && m.pressed === 'true' && m.dashed, at + 'the eye did not mark the row at 1180');
    ok(
      !!m?.state && m.state.w <= 1 && m.state.h <= 1,
      at + 'the GM-only words draw at 1180 - ' + JSON.stringify(m?.state)
    );
    ok(
      !!m && m.buttons.length === 3 && m.buttons.every((b) => b.h >= 24),
      at + 'an action button is under 24 px tall at 1180 - ' + JSON.stringify(m)
    );
    ok(!(await sideways(page)), at + 'the page scrolls sideways at 1180');
    await ctx.close();
  }
  {
    const { ctx, page, d } = await fresh({ width: 360, height: 640 });
    /* A phone: its scrollbar overlays the page. A desktop window's 15 px scrollbar takes
       the row's room, and the buttons wrap under the meta box there. */
    await page.setViewport({ width: 360, height: 640, isMobile: true, hasTouch: true });
    await d.open(SHOP, { as: 'gm1' });
    ok(
      await waitIn(page, () => !!document.querySelector('button.addrow')),
      at + 'the row «Свой предмет» did not draw'
    );
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await d.press('Свой предмет');
    const long = 'Ж'.repeat(120);
    await page.evaluate((v) => {
      const name = document.getElementById('qi-name');
      name.focus();
      name.value = v;
      name.dispatchEvent(new Event('input', { bubbles: true }));
    }, long);
    const add = await page.evaluateHandle(() =>
      [...document.querySelectorAll('.quick button')].find(
        (b) => b.textContent.trim() === 'Добавить в список'
      )
    );
    await add.asElement()?.click();
    await add.dispose();
    ok(
      await waitIn(
        page,
        (v) =>
          [...document.querySelectorAll('.lrow-acts .lrow-gm')].some((b) =>
            (b.getAttribute('aria-label') ?? '').endsWith(v)
          ),
        long
      ),
      at + 'the 120-character row did not draw'
    );
    const m = await pressAndMeasure(page, long);
    console.log('  69 at 360: ' + JSON.stringify(m));
    ok(!!m && m.pressed === 'true' && m.dashed, at + 'the eye did not mark the row at 360');
    ok(
      !!m?.state && m.state.w <= 1 && m.state.h <= 1,
      at + 'the GM-only words draw at 360 - ' + JSON.stringify(m?.state)
    );
    ok(
      !!m && m.rowRight <= 360 && m.buttons.every((b) => b.right <= 360),
      at + 'the row passes the right edge at 360 - ' + JSON.stringify(m)
    );
    ok(
      !!m && m.buttons.length === 3 && m.buttons.every((b) => b.w === 44),
      at + 'an action button is not 44 px wide at 360 - ' + JSON.stringify(m)
    );
    ok(
      !!m && m.actsTop < m.metaBottom,
      at + 'the action buttons wrapped under the meta box at 360 - ' + JSON.stringify(m)
    );
    ok(!(await sideways(page)), at + 'the page scrolls sideways at 360');

    const names = await page.evaluate(() =>
      [...document.querySelectorAll('.lrow input[type="checkbox"]')]
        .slice(0, 2)
        .map((c) => c.getAttribute('aria-label') ?? '')
    );
    for (const n of names) await d.tick(n);
    const hide = await page.evaluate(() => {
      const b = [...document.querySelectorAll('.batch-acts button')].find(
        (x) => x.textContent.trim() === 'Скрыть от игроков (2)'
      );
      const r = b?.getBoundingClientRect();
      return r ? { left: r.left, right: r.right } : null;
    });
    ok(
      !!hide && hide.left >= 0 && hide.right <= 360,
      at + '«Скрыть от игроков (2)» lies outside 0..360 - ' + JSON.stringify(hide)
    );
    ok(!(await sideways(page)), at + 'the bar scrolls the page sideways at 360');
    await ctx.close();
  }
}

/** 68. «Мои предметы» at 300 own items (`?items=300`), at 1180x900 in Chrome as `gm1`:
 *  (a) the navigation from `#/lists` to the 300 rows drawn, (b) one keystroke «9» in
 *  «Найти предмет» to the second frame after it (54 rows drawn); each the median of three
 *  runs, at most 500 ms and 100 ms (docs/specs/FEATURES.md, "Homebrew"). */
async function homebrewAt300() {
  const at = '68 (#/homebrew at 300 items): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/lists', { as: 'gm1', items: 300 });
  await waitIn(page, () => document.body.innerText.includes('Пустой список'));
  const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  const nav = [];
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      location.hash = '#/lists';
    });
    await waitIn(page, () => !document.querySelector('.rows .row'));
    nav.push(
      await page.evaluate(
        () =>
          new Promise((done) => {
            const t0 = performance.now();
            location.hash = '#/homebrew';
            const poll = () => {
              if (document.querySelectorAll('.rows .row').length >= 300) {
                done(performance.now() - t0);
              } else requestAnimationFrame(poll);
            };
            requestAnimationFrame(poll);
          })
      )
    );
  }
  const key = [];
  let drawn = -1;
  for (let i = 0; i < 3; i++) {
    const r = await page.evaluate(
      () =>
        new Promise((done) => {
          const box = document.querySelector('input[type="search"]');
          if (!box) {
            done({ ms: Infinity, rows: -1 });
            return;
          }
          box.value = '';
          box.dispatchEvent(new Event('input', { bubbles: true }));
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              const t0 = performance.now();
              box.value = '9';
              box.dispatchEvent(new Event('input', { bubbles: true }));
              requestAnimationFrame(() =>
                requestAnimationFrame(() => {
                  done({
                    ms: performance.now() - t0,
                    rows: document.querySelectorAll('.rows .row').length
                  });
                })
              );
            })
          );
        })
    );
    key.push(r.ms);
    drawn = r.rows;
  }
  const a = median(nav);
  const b = median(key);
  console.log(
    '  68 medians at 300 items: (a) ' +
      a.toFixed(1) +
      ' ms ' +
      JSON.stringify(nav.map((x) => Math.round(x))) +
      ', (b) ' +
      b.toFixed(1) +
      ' ms ' +
      JSON.stringify(key.map((x) => Math.round(x)))
  );
  ok(drawn === 54, at + 'the query «9» does not draw 54 rows - ' + String(drawn));
  ok(a <= 500, at + 'the rows took ' + a.toFixed(1) + ' ms, over 500');
  ok(b <= 100, at + 'a keystroke took ' + b.toFixed(1) + ' ms, over 100');
  await ctx.close();
}

const CASES = [
  ['1 (new list from the card)', newListFromCard],
  ['2 (selection bar)', newListFromBar],
  ['3 (modal)', newListFromModal],
  ['4/5 (two frames)', twoFramesPicked],
  ['6 (dialog)', dialogSemantics],
  ['7 (two windows)', twoTabsShareStorage],
  ['8 (packed link)', packedLink],
  ['9 (copy text)', copyTextThroughClipboard],
  ['10 (copy image)', copyImage],
  ['11 (no picture)', brokenArtPath],
  ['12 (focus survives input)', focusSurvivesKeystroke],
  ['13 (note height)', noteTextareaHeight],
  ['14 (roll card)', rollReplacesCardImg],
  ['15 (navigation)', historyBackForward],
  ['16 (selection bar)', selectionBarGeometry],
  ['17 (drag reorder)', dragReorder],
  ['18 (folded panels)', foldedDetailsSurviveRerender],
  ['19 (tiles with no pictures)', tileGeometryNoArt],
  ['20 (warning at 320)', storageNoticeAt320],
  ['21 (button focus)', buttonFocusSurvivesRerender],
  ['22 (help and list pick)', moneyHelpAndPressedPicker],
  ['23 (menu in the modal)', addToListMenuStaysInModal],
  ['24 (reduced motion)', reducedMotionKillsEverything],
  ['25 (notice dismiss while folded)', storageNoticeDismissWhileFolded],
  ['26 (announce on touch, inert grip)', announceOnTouchAndHideInertGrip],
  ['27 (list menu at 50 lists)', listMenuKeepsItsControlsInView],
  ['28 (minimal worker)', minimalWorker],
  ['29 (guide back link)', guideBackLink],
  ['30 (note clear target)', noteClearTargetYieldsToTextarea],
  ['31 (card image focus ring)', cardMediaRingVisible],
  ['32 (undo toast in the record dialog)', undoToastInRecordDialog],
  ['33 (drag source removed mid-drag)', dragSourceRemovedMidDrag],
  ['34 (notice summary wins its taps)', noticeSummaryWinsItsTaps],
  ['35 (fake cloud signed state)', fakeCloudSignedState],
  ['36 (account preferences)', accountPreferences],
  ['37 (sign-in from the bar)', signInFromTheBar],
  ['38 (old link saved after sign-in)', saveOldLinkAfterSignIn],
  ['39 (sign-out on an account list)', signOutOnAccountList],
  ['40 (not saved, then retried)', notSavedThenRetried],
  ['41 (delete an account list)', deleteAccountList],
  ['42 (prompt in the dialog menu at 360)', promptInDialogMenuAt360],
  ['43 (share links)', shareLinksOfAnAccountList],
  ['44 (share link saved after sign-in)', saveShareLinkAfterSignIn],
  ['45 (shared page re-read)', sharedPageRereadWhenShownAgain],
  ['46 (shared page gone)', sharedPageGoneWhenShownAgain],
  ['47 (browser lists moved on sign-in)', browserListsMovedOnSignIn],
  ['48 (read-only after the cutoff)', readOnlyAfterTheCutoff],
  ['49 (account edits wait two seconds, then go once)', accountEditsWaitThenGoOnce],
  ['50 (the account menu)', accountMenu],
  ['51 (the move banner)', moveBanner],
  ['52 (live share page)', liveSharePage],
  ['53 (live account list)', liveAccountList],
  ['54 (live requests)', liveRequests],
  ['55 (send a request)', sendARequest],
  ['56 (apply a request)', applyARequest],
  ['57 (notify always)', notifyAlways],
  ['58 (the ticked lists download as one lists file)', ticksDownloadAsOneFile],
  ["59 (the account's data zip reads back through the import field)", dataZipReadsBack],
  ['60 (an imported list opens with its rows in file order)', importedListOpens],
  ['61 (ticked lists are deleted together after one confirm)', tickedListsDeletedTogether],
  [
    '62 (a search prunes the ticks and select-all ticks the drawn cards only)',
    searchPrunesTicks
  ],
  ['63 (relation folds, the fold summary and the preview menu)', relationFolds],
  ['64 (the own-item row and a row note box)', ownItemRowAndNoteBox],
  ['65 (the requests panel folds at 360)', requestsPanelFolds],
  ['66 (a 200-character list name at 360)', longListName],
  ['67 (field help and threshold labels at 360)', fieldHelpAt360],
  ['68 (#/homebrew at 300 items)', homebrewAt300],
  ['69 (the GM-only toggle at 1180 and 360)', gmOnlyToggle]
];

(async () => {
  /* Each case gets its own try/catch: a hung CDP call under host load
   * (this tree is shared - CLAUDE.md, "Task and session protocol") must not
   * take the other cases down with it, and a synchronous write - not
   * console.log's own buffering - is what survives a crash that follows
   * immediately after. */
  for (const [label, fn] of CASES) {
    fs.writeSync(1, 'running: ' + label + '\n');
    try {
      await fn();
    } catch (e) {
      rep.ok(false, label + ': threw - ' + (e && e.message ? e.message : String(e)));
    }
  }

  await closeBrowser().catch(() => {});
  console.log(
    rep.failed
      ? '\n' + rep.failed + ' FAILED'
      : '\nreal-input states (dist-test/): all ' + CASES.length + ' runs passed'
  );
  process.exit(rep.failed ? 1 : 0);
})();
