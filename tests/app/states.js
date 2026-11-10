/* The states a real click reaches, and nothing else does.
 *
 * Every other suite under tests/app/ opens a route and reads what is there;
 * this one presses controls with `press` - a trusted puppeteer
 * ElementHandle.click(), not the synthetic `el.click()` every parity state
 * and every legacy suite uses - because a handful of real defects only show
 * up on the far side of a browser's own microtask checkpoint (the
 * `isConnected` guard) or need a real network, a real clipboard stub, or a
 * real second tab to mean anything at all. One run per `CASES` entry (4 and 5
 * share one), no ancestor; `--shard=n/of` runs every `of`-th entry, as
 * `golden.js` does. Like every suite here it drives
 * dist-test/, the test build (docs/specs/COVERAGE.md, "Test layers"): signed
 * out it draws the sign-in prompt where a list would be made, so the cases
 * that make one open as the seed's `gm2`. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PNG } = require('pngjs');
const { shardOf } = require('./shard.js');
/* Read before lib.js, whose require checks the build: a bad `--shard` names itself first. */
const SHARD = shardOf(process.argv);
const {
  axe,
  baseUrl,
  fresh,
  sharedPage,
  reporter,
  closeBrowser,
  targets
} = require('./lib.js');
const { TARGETS, ready } = require('./driver.js');
const { HB_FILE, STATES, hbImportOpen } = require('./inventory.js');

/** The fake seed's `gm1` list «Лавка кузнеца», `uuid(101)`, and the first id
 *  the fake hands a new list, `uuid(5000)`. */
const SHOP = '#/lists/00000000-0000-4000-8000-000000000101';
const FIRST_NEW = '#/lists/00000000-0000-4000-8000-000000005000';
/** The fake seed's `gm2` list, `uuid(201)`, with its change notices. */
const GM2_LIST_ID = '#/lists/00000000-0000-4000-8000-000000000201';
/** The fake seed's `gm1` list «Трофеи», `uuid(103)`, with no share link. */
const TROPHIES = '#/lists/00000000-0000-4000-8000-000000000103';
/** The owner's list page «Ещё»: in the head's row up to 760 px, in the action row from 761 px. */
const LIST_MORE =
  '.lhead-acts .morewrap > [aria-haspopup="menu"], .lacts .morewrap > [aria-haspopup="menu"]';

/** Opens `#/lists` signed in as `as`, makes the account list `spec` (`driver.js`,
 *  `accountLists`) and goes to its page; answers the list's id. A new `d.open` resets the
 *  fake cloud, so the list is made after it. */
async function openAccountList(d, spec, name, as = 'gm4') {
  await d.open('#/lists', { as });
  await d.settled(name);
  const [{ id, hash }] = await d.accountLists([spec]);
  await d.go(hash);
  return id;
}

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
  await d.press('В список');
  await d.press('Новый список');
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
  await d.press('В список');
  await d.press('Новый список');
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
  ok(await d.has('В список'), '3 (modal): the modal did not open');
  await d.press('В список');
  await d.press('Новый список');
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
  ok(await d.has('В список'), '23 (menu in the modal): the modal did not open');
  await d.press('В список');

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

  await d.press('Новый список');
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
  await d.press('Пир зверей');
  await d.press('Колоссы Сухоземья');
  const hash1 = await d.hash();
  ok(
    hash1 === '#/tables/other_frames/f_frame-beast_feast-colossus',
    '4 (two frames): address ' + hash1 + ', expected f_frame-beast_feast-colossus'
  );
  const rows1 = await d.count('.rows .row[data-row]');
  ok(rows1 === 57, '4 (two frames): ' + rows1 + ' rows instead of 57');
  const pills1 = await d.count('[data-fval][aria-pressed="true"]');
  ok(pills1 === 2, '4 (two frames): ' + pills1 + ' pressed chips instead of 2');
  await ctx.close();

  const { ctx: ctx2, d: d2 } = await fresh({ width: 1180, height: 900 });
  await d2.open('#/tables/other_frames/f_frame-beast_feast-colossus');
  const rows2 = await d2.count('.rows .row[data-row]');
  ok(rows2 === 57, '5 (link arriving fresh): ' + rows2 + ' rows instead of 57');
  const pills2 = await d2.count('[data-fval][aria-pressed="true"]');
  ok(pills2 === 2, '5 (link arriving fresh): ' + pills2 + ' pressed chips instead of 2');
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

/** 9. Copy text through the stubbed clipboard - both flavors. */
async function copyTextThroughClipboard() {
  const { ctx, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/i/ci1');
  await d.more('Скопировать текст');
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
  await d.more('Скопировать изображение');
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
  const glyphOnly = (sel) =>
    !document.querySelector(sel + ' img') && !!document.querySelector(sel + ' svg path');
  await page.waitForFunction(glyphOnly, { timeout: 5000 }, '.card-media').catch(() => {});
  ok(
    await page.evaluate(glyphOnly, '.card-media'),
    '11 (no picture): the card well does not show the kind glyph alone'
  );
  await d.openMore();
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
   * failed thumbnail falls back to the kind glyph (docs/specs/FEATURES.md,
   * "Records"). */
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
    .waitForFunction(glyphOnly, { timeout: 5000 }, '[data-row="w3"] .row-main')
    .catch(() => {});
  ok(
    asked.some((u) => /\/img\/thumb\/w3\.webp$/.test(u)),
    '11 (row thumbnail): the row did not ask for its thumbnail'
  );
  ok(
    !asked.some((u) => /\/img\/w3\.webp$/.test(u)),
    '11 (row thumbnail): the row downloaded the full picture'
  );
  ok(
    await row.page.evaluate(glyphOnly, '[data-row="w3"] .row-main'),
    '11 (row thumbnail): the row well does not show the kind glyph alone'
  );
  await row.ctx.close();
}

/** 12. Focus survives a tables keystroke - Svelte keeps the search box's
 *  own node where the live app rebuilt it (qa 9.1). */
async function focusSurvivesKeystroke() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/tables');
  await d.type('Поиск по названию или описанию...', 'к');
  const stillFocused = await page.evaluate(
    (ph) =>
      document.activeElement instanceof HTMLInputElement &&
      document.activeElement.placeholder === ph,
    'Поиск'
  );
  ok(stillFocused, '12 (focus survives input): focus left the search box after the redraw');
  await ctx.close();
}

/** 13. The note textarea's height - grows to fit, which jsdom cannot
 *  measure at all (no layout). */
async function noteTextareaHeight() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await openAccountList(d, { n: 1, name: 'Тайник', ids: ['ci1'] }, '13 (note height)');
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

  /* The list's own note area (docs/specs/FEATURES.md, "Lists"): one field at a time, three
   * lines while empty, grown to fit and held at 320 px - a real-CSS read jsdom cannot make. */
  await d.press('Заметки');
  const LIST_PH = 'Например: лавка закрыта до утра';
  const boxLines = () =>
    page.$eval('.lnotes .narea textarea', (t) => {
      const cs = getComputedStyle(t);
      const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      return Math.round((t.clientHeight - pad) / parseFloat(cs.lineHeight));
    });
  let lnoteLines = await boxLines();
  ok(
    lnoteLines === 3,
    '13 (list notes): an empty note does not open at three lines - ' + lnoteLines
  );

  await d.type(LIST_PH, Array.from({ length: 8 }, (_, i) => 'строка ' + i).join('\n'));
  lnoteLines = await boxLines();
  ok(
    lnoteLines >= 8,
    '13 (list notes): the field did not grow to fit the text - ' + lnoteLines
  );

  await d.type(LIST_PH, Array.from({ length: 80 }, (_, i) => 'строка ' + i).join('\n'));
  const tall = await page.$eval('.lnotes .narea textarea', (t) => ({
    h: t.offsetHeight,
    over: t.scrollHeight > t.clientHeight
  }));
  ok(tall.h <= 320, '13 (list notes): the field grew past its ceiling - ' + tall.h);
  ok(tall.over, '13 (list notes): past the ceiling the text should scroll');

  await d.type(LIST_PH, 'одна строка');
  lnoteLines = await boxLines();
  ok(
    lnoteLines === 3,
    '13 (list notes): the field did not return to three lines - ' + lnoteLines
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
    const btn = document.querySelector('.rp-ctrl button.primary');
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
    () => document.querySelector('.tabslot .tabs [aria-current="page"]')?.textContent
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

/** 84. The filter column stuck under the header ends above the selection bar, so its last
 *  chip clears the bar: it scrolls inside itself, out of the page's scroll padding. */
async function filterColumnClearsTheBar() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 720 });
  await d.open('#/tables/eq_weapon');
  await d.press('Выбрать');
  const m = await page.evaluate(async () => {
    window.scrollTo(0, 900);
    const col = document.querySelector('.fcol');
    await new Promise((r) => requestAnimationFrame(r));
    col.scrollTop = col.scrollHeight;
    await new Promise((r) => requestAnimationFrame(r));
    const barTop = document.querySelector('.selbarwrap').getBoundingClientRect().top;
    return {
      barTop,
      colBottom: col.getBoundingClientRect().bottom,
      chipBottom: [...col.querySelectorAll('.chip')].at(-1).getBoundingClientRect().bottom
    };
  });
  ok(
    m.colBottom <= m.barTop && m.chipBottom <= m.barTop,
    '84 (filter column): the bar covers the column - ' + JSON.stringify(m)
  );
  await ctx.close();
}

/** 85. The shared page's tallest action row stays under 45% of a landscape phone. */
async function selectionBarInLandscape() {
  const { ctx, page, d } = await fresh({ width: 640, height: 360 });
  await d.open('#/s/player-token-1', { as: 'gm2' });
  await waitIn(page, bodyHas, 'Лавка кузнеца');
  await d.tick('Первоклассный Спальный Мешок');
  const h = await page.evaluate(
    () => document.querySelector('.selbarwrap').getBoundingClientRect().height
  );
  ok(h <= 360 * 0.45, '85 (selection bar in landscape): the bar is ' + h + ' px tall');
  await ctx.close();
}

/** 17. A real HTML5 drag reorder, ported from the legacy `lists2.js`. */
async function dragReorder() {
  const seedIds = ['ci1', 'ci2', 'ci3', 'ci4'];
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  const listId = await openAccountList(
    d,
    { n: 1, name: 'Тайник', ids: seedIds },
    '17 (drag reorder)'
  );
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
  const order = await d.listKeys(listId, { until: 'ci2,ci3,ci1,ci4' });
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
  const gapOrder = await d.listKeys(listId, { until: 'ci3,ci1,ci2,ci4' });
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

  /* A stray write waits 2 s in the account buffer: let it land before the read. */
  await d.writesSettled();
  const cancelledOrder = await d.listKeys(listId);
  ok(
    cancelledOrder === gapOrder,
    '17 (drag reorder): a cancelled drag changed the order - ' + cancelledOrder
  );
  const leftoverMarks = await d.count('.lrow.drop-before, .lrow.drop-after');
  ok(leftoverMarks === 0, '17 (drag reorder): a cancelled drag left a mark behind');

  /* Outside the zone a live drag is refused, over the list's own note too,
   * which would otherwise take the row's `text/plain` index as text. */
  if (!(await d.count('.lnotes .narea'))) {
    await page.evaluate(() => document.querySelector('.lnotes .nopen button')?.click());
    await d.settle();
  }
  await page.evaluate(() => {
    const grip = document.querySelector('.lrow [data-drag]');
    const dt = new DataTransfer();
    window.__dragDT = dt;
    grip.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
  });
  await d.settle();
  const overNote = await page.evaluate(() => {
    const ta = document.querySelector('.lnotes textarea');
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
  const { ctx: noteCtx, page: notePage, d: noteD } = await fresh({ width: 1180, height: 1600 });
  await openAccountList(
    noteD,
    {
      n: 1,
      name: 'Тайник',
      ids: notedIds,
      meta: Object.fromEntries(notedIds.map((id) => [id, { note: 'x' }]))
    },
    '17 (drag reorder, notes)'
  );

  /** Gold pixels (within 24/255 of `--gold`, `216,171,94`) in a 200x2 px strip of the
   *  8 px gap under row `i`, where the 2 px drop mark draws (docs/specs/FEATURES.md,
   *  "Lists") - the probe of docs/DECISIONS.md, "A drop indicator redraws...". */
  async function goldStripAt(i) {
    /* `getBoundingClientRect()` returns a `DOMRect` whose fields are
       prototype getters, not own properties - puppeteer's own JSON
       serialization drops them, so the return value has to be a plain
       object built from them, not the `DOMRect` itself. */
    const rect = await notePage.evaluate((idx) => {
      const r = document.querySelectorAll('.lrow')[idx].getBoundingClientRect();
      return { x: r.x, y: r.bottom + 3, width: 200, height: 2, sx: scrollX, sy: scrollY };
    }, i);
    const clip = pageClip(rect);
    /* By default puppeteer resizes the view for a clip, through 1x1 px: the list redraws as
       compact rows, and the dragged grip leaves, which ends the drag. */
    const png = PNG.sync.read(
      await notePage.screenshot({ type: 'png', clip, captureBeyondViewport: false })
    );
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
    midGold > 200,
    '17 (drag reorder): no gold line in the gap mid-list - ' + midGold + '/400'
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
    endGold > 200,
    '17 (drag reorder): no gold line in the gap after the last row - ' + endGold + '/400'
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

/** 18. The open note area and roll panel survive a select-all and a money-mode re-render
 *  (page memory, docs/specs/FEATURES.md, "Lists"), ported from the legacy `lists2.js`. */
async function foldedDetailsSurviveRerender() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await openAccountList(
    d,
    { n: 1, name: 'Тайник', ids: ['ci1', 'ci2', 'ci3'], meta: { ci1: { gold: 70 } } },
    '18 (open panels)'
  );
  await d.press('Бросить по списку');
  await page.evaluate(() => document.querySelector('.lnotes .nopen button')?.click());
  await d.settle();

  const openState = () =>
    page.evaluate(() => ({
      note: !!document.querySelector('.lnotes .narea'),
      roll: !!document.querySelector('.lroll-h')
    }));
  const open0 = await openState();
  ok(
    open0.note && open0.roll,
    '18 (open panels): the panels did not open - ' + JSON.stringify(open0)
  );

  await page.evaluate(() => document.querySelector('button.selmode')?.click());
  await d.settle();
  await page.evaluate(() => document.querySelector('.selbarwrap .selall input')?.click());
  await d.settle();
  const open1 = await openState();
  ok(
    open1.note && open1.roll,
    '18 (open panels): "select all" folded something open - ' + JSON.stringify(open1)
  );

  await d.click('Монетами');
  const open2 = await openState();
  ok(
    open2.note && open2.roll,
    '18 (open panels): switching price mode folded something open - ' + JSON.stringify(open2)
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
  await d.press('Сетка');
  /* The tile's box shows in the selection mode only. */
  await d.press('Выбрать');
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

/** 22. The price switch with no «?» on the list page (docs/specs/FEATURES.md, rule 15 (c)),
 *  and the pressed add-to-list button's own color, ported from the legacy `lists2.js`. */
async function moneyHelpAndPressedPicker() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await openAccountList(
    d,
    { n: 1, name: 'Клад', ids: ['ci1'], meta: { ci1: { gold: 70 } } },
    '22 (help and list pick)'
  );
  const prices = await page.evaluate(() => ({
    seg: !!document.querySelector('.lprices [role="group"]'),
    help: document.querySelectorAll('main .helpbtn, main .money-help').length
  }));
  ok(prices.seg, '22 (help and list pick): the price switch is not drawn');
  ok(
    prices.help === 0,
    '22 (help and list pick): the list page still draws a «?» - ' + prices.help
  );
  await ctx.close();

  const { ctx: ctx2, page: page2, d: d2 } = await fresh({ width: 1180, height: 900 });
  await d2.open('#/tables/wondrous');
  await d2.open('#/i/w3');
  await d2.press('В список');
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
 *  (`driver.js`'s own comment: the blanket kill is the app's shipped behavior for a
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

/** 26. Two device-capability defects fixed together (git log --grep=dnd4):
 *  a completed reorder was announced nowhere, and the drag grip stayed drawn
 *  on a device that can never start an HTML5 drag from a touch. Both read
 *  through a touch-emulated viewport - `page.emulateMediaFeatures` cannot
 *  move `hover`/`pointer` at all (docs/specs/COVERAGE.md, "app/states - two
 *  harness facts a device-capability case runs into"), only
 *  `setViewport({ isMobile, hasTouch })` does - and a second, untouched
 *  viewport proves the grip is not hidden by width alone. */
async function announceOnTouchAndHideInertGrip() {
  const spec = { n: 1, name: 'Тайник', ids: ['ci1', 'ci2', 'ci3', 'ci4'] };

  const { ctx, page, d } = await fresh({ width: 390, height: 900 });
  await page.setViewport({ width: 390, height: 900, isMobile: true, hasTouch: true });
  await openAccountList(d, spec, '26 (touch device)');
  /* Up to 760 px the grip and the position field sit in the unfolded compact row. */
  await page.evaluate(() => {
    for (const b of document.querySelectorAll('button.cbody')) b.click();
  });
  await d.settle();

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
    /* The list page holds more than one region; this one says the move. */
    const r = [...document.querySelectorAll('.said')].find((x) =>
      x.textContent.includes('позиция')
    );
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
  ok(!!said, '26 (announce on touch): the live region .said was not found');
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

  const { ctx: ctx2, page: page2, d: d2 } = await fresh({ width: 1180, height: 900 });
  await openAccountList(d2, spec, '26 (no touch)');
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

/** 27. At 50 lists the menu keeps its heading, search and «Новый список» in
 *  view and scrolls only its rows; the lists holding the record lead
 *  (docs/specs/FEATURES.md, "Lists"). */
async function listMenuKeepsItsControlsInView() {
  /* gm2 holds one list of its own; 49 more make the fake's limit of 50. */
  const specs = Array.from({ length: 49 }, (_, i) => ({
    n: i + 1,
    name: 'Лавка ' + String(i + 1),
    ids: i % 10 === 0 ? ['ci1'] : []
  }));
  for (const [width, height] of [
    [1100, 900],
    [360, 740]
  ]) {
    const at = '27 (' + String(width) + '): ';
    const { ctx, page, d } = await fresh({ width, height });
    await d.open('#/i/ci1', { as: 'gm2' });
    await d.settled(at);
    await d.accountLists(specs);
    await d.press('В список');
    await d.settle();

    const m = await page.evaluate(() => {
      /* `shown`: what a press at the center reaches - a clipping ancestor
         can hide a box that still reads inside the menu and the window. */
      const box = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return { x: r.x, y: r.y, w: r.width, h: r.height, shown: !!hit && el.contains(hit) };
      };
      const menu = document.querySelector('.dropmenu');
      const chips = menu?.querySelector('.pickchips');
      const newChip = menu?.querySelector(':scope > .lnew');
      return {
        menu: box(menu),
        search: box(menu?.querySelector('input[type="search"]')),
        newChip: box(newChip),
        scrolls: !!chips && chips.scrollHeight > chips.clientHeight,
        firstOn: [...(chips?.querySelectorAll('.lrow') ?? [])]
          .slice(0, 6)
          .map((c) => c.getAttribute('aria-pressed') === 'true'),
        view: { x: 0, y: 0, w: innerWidth, h: innerHeight }
      };
    });
    ok(!!m.menu, at + 'the menu did not open');
    if (m.menu) {
      ok(m.menu.h <= 342, at + 'the menu is ' + String(m.menu.h) + ' px tall, over 342');
      for (const [name, b] of [
        ['the search box', m.search],
        ['«Новый список»', m.newChip]
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
    ok(m.scrolls, at + 'the rows do not scroll on their own');
    ok(
      JSON.stringify(m.firstOn) === JSON.stringify([true, true, true, true, true, false]),
      at + 'the five lists holding the record do not lead - ' + JSON.stringify(m.firstOn)
    );

    await d.type('Найти список', 'Шкатулка');
    await d.press('Новый список');
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
    const url = root + 'roll/std';
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
      manifestLinks === '["/manifest.webmanifest"]',
      at + 'the page does not carry exactly one manifest link - ' + manifestLinks
    );
    const footer = await page.evaluate(() =>
      [...document.querySelectorAll('.foot-nav a')].map((a) => a.getAttribute('href'))
    );
    ok(
      JSON.stringify(footer) ===
        JSON.stringify(['/pages/install.html', '/pages/privacy.html', '/pages/terms.html']),
      at +
        'the footer does not link the install guide and the two policy pages - ' +
        JSON.stringify(footer)
    );
    /* The folded license notice opens from the keyboard, with the focus ring
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
        'the license notice does not open from the keyboard with a focus ring - ' +
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
 *  languages: from `/lists` the top back link of `pages/install.html`
 *  (`../`) and from `/en/lists` and `/i/en/ci1` that of `pages/en/install.html`
 *  (`../../en/`) return to it, and on a direct visit each opens the app root of its
 *  language. The
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
      ['pages/en/', '../../en/']
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
    await page.goto(root + 'lists', { waitUntil: 'load' });
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
            location.pathname === '/lists' &&
            !!document.querySelector('#app')?.childElementCount,
          { timeout: 30_000 }
        )
        .then(() => true)
        .catch(() => false),
      at + 'the back link did not return to /lists'
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
    await enPage.goto(root + 'en/lists', { waitUntil: 'load' });
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
            (a) => a.matches('a.back') && a.getAttribute('href') === '../../en/'
          ) &&
          !!second &&
          second.matches('nav.lang') &&
          second.querySelector('a')?.getAttribute('href') === '../install.html'
        );
      }),
      at +
        'the English guide does not draw its back links ("../../en/") first and last, with the language link second'
    );
    await enPage.click('#app-page > a.back');
    ok(
      await enPage
        .waitForFunction(
          () =>
            location.pathname === '/en/lists' &&
            !!document.querySelector('#app')?.childElementCount,
          { timeout: 30_000 }
        )
        .then(() => true)
        .catch(() => false),
      at + 'the English back link did not return to /en/lists'
    );
    /* An English record's path, /i/en/<id>, lies outside /en/: the back link still
       returns to it. */
    await enPage.goto(root + 'i/en/ci1', { waitUntil: 'load' });
    await enPage.waitForSelector('.foot-nav a');
    await enPage.click('.foot-nav a');
    await enPage.waitForFunction(() => location.pathname.endsWith('/pages/en/install.html'));
    await enPage.waitForSelector('#app-page');
    await enPage.click('#app-page > a.back');
    ok(
      await enPage
        .waitForFunction(
          () =>
            location.pathname === '/i/en/ci1' &&
            !!document.querySelector('#app')?.childElementCount,
          { timeout: 30_000 }
        )
        .then(() => true)
        .catch(() => false),
      at + 'the English back link did not return to /i/en/ci1'
    );
    await enPage.goto(root + 'pages/en/install.html', { waitUntil: 'load' });
    await enPage.click('#app-page > a.back');
    ok(
      await enPage
        .waitForFunction(
          () =>
            location.pathname === '/en/' &&
            location.hash === '' &&
            !!document.querySelector('#app')?.childElementCount,
          { timeout: 30_000 }
        )
        .then(() => true)
        .catch(() => false),
      at + 'the English back link on a direct visit did not open the English app root'
    );
  } finally {
    if (en) await en.ctx.close();
    await ctx.close();
  }
}

/** 30. The note area's «Очистить» and the toolbar take their own presses: each toolbar
 *  button's center and «Очистить»'s center hit that control, with no target over another
 *  (the clear cross whose 44 px target reached into the toolbar went with the note area,
 *  docs/specs/FEATURES.md, "Lists"). */
async function noteClearTargetYieldsToTheToolbar() {
  const at = '30 (note clear target): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await openAccountList(d, { n: 1, name: 'Тайник', ids: ['ci1'], note: 'текст' }, '30');
  await page.evaluate(() => document.querySelector('.lnotes .nopen button')?.click());
  await d.settle();
  const hits = await page.evaluate(() => {
    const area = document.querySelector('.lnotes .narea');
    if (!area) return null;
    const own = (el) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return !!hit && (hit === el || el.contains(hit));
    };
    const tools = [...area.querySelectorAll('[role="toolbar"] button')];
    const clear = [...area.querySelectorAll('.nacts button')].at(-1);
    return {
      tools: tools.length,
      toolsOwn: tools.every(own),
      clearOwn: !!clear && own(clear),
      clear: clear?.textContent.trim()
    };
  });
  ok(!!hits, at + 'the list note area did not open');
  if (hits) {
    ok(hits.tools > 0 && hits.toolsOwn, at + 'a toolbar button does not take its own press');
    ok(
      hits.clearOwn && hits.clear === 'Очистить',
      at + '«Очистить» does not take its own press'
    );
  }

  await ctx.close();
}

/** 31. The card image's focus ring is drawn, not clipped by the card, on a roll
 *  result: a pixel read of a 3px band inside each edge of the focused
 *  `.card-media`, against the ring's own color. The record page draws its
 *  picture as no control, so it has no ring to read. */
async function cardMediaRingVisible() {
  async function ringAt(route, selector, label, mustScroll) {
    const { ctx, page, d } = await fresh({ width: 1180, height: 520 });
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
      /* `end`, not `center`: a 420 px card centered in 520 px starts under the
         sticky top bar (63 px), which hides the ring's top edge. */
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
      ok(!!box.rgb, '31 (card image focus ring, ' + label + '): no outline color to match');
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
  await ringAt('#/roll/wondrous', '.card.face .card-media', 'face', false);
}

/** 32. The undo toast an action inside the record dialog raises is drawn
 *  inside the dialog: focused, hit-testable, in the accessibility tree, and
 *  its undo runs (docs/DECISIONS.md, 2026-09-24, "While the record dialog is
 *  open, the toast is drawn inside it"). Escape and the backdrop still close
 *  the dialog, and a toast still on offer then moves to the page's copy. */
async function undoToastInRecordDialog() {
  const at = '32 (undo toast in the record dialog): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/tables', { as: 'gm4' });
  await d.settled('32');
  const [{ id: listId }] = await d.accountLists([
    { n: 1, name: 'Клад дракона', ids: ['ci28'] }
  ]);
  /* The account buffer sends 2 s after the last edit: wait for the string `until`. */
  const stored = (until) => d.listKeys(listId, { until });
  /* The menu stays open after a pick, so a second removal presses the chip only. */
  const remove = async () => {
    if (!(await page.evaluate(() => !!document.querySelector('dialog[open] .dropmenu')))) {
      await d.press('В список');
    }
    await d.press('Клад дракона');
    await d.settle();
  };
  await d.press('Кольцо Тишины');
  await remove();
  ok((await stored('')) === '', at + 'the chip did not remove ci28 from the list');

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
  ok(where.hit, at + '«Вернуть» is not what a point at its center hits');

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
  ok((await stored('ci28')) === 'ci28', at + 'the undo did not restore ci28');
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
  ok(
    (await stored('ci28')) === 'ci28',
    at + 'Enter on the handed-over toast did not restore ci28'
  );
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
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  const listId = await openAccountList(
    d,
    { n: 1, name: 'Тайник', ids: ['ci1', 'ci2', 'ci3', 'ci4'] },
    '33'
  );
  const order = () => d.listKeys(listId);
  await page.evaluate(() => document.querySelector('.lnotes .nopen button')?.click());
  await d.settle();

  await page.evaluate(() => {
    const grip = document.querySelectorAll('.lrow')[1].querySelector('[data-drag]');
    const dt = new DataTransfer();
    window.__grip = grip;
    window.__dragDT = dt;
    grip.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
  });
  await d.settle();

  await d.fake('playRemove', listId, 'ci2');
  await waitIn(page, () => document.querySelectorAll('.lrow').length === 3);
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
  await d.writesSettled();
  const after = await order();
  ok(after === 'ci1,ci3,ci4', at + 'the void release moved an entry - ' + after);

  const accepted = await page.evaluate(() => {
    window.__grip.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
    const ta = document.querySelector('.lnotes textarea');
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
 *  seeded from this browser; a print page switch lasts until a reload,
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
  const sheet = async (page) => {
    await waitIn(page, () => !!document.querySelector('.psheet'));
    return page.evaluate(() => ({
      bw: document.querySelector('.psheet.bw') !== null,
      /* No note under the bar: the switch shows the visit's pick alone. */
      note: document.querySelector('.printbar a[href="/account"]') !== null,
      pressed:
        [...document.querySelectorAll('.printbar .seg button')]
          .find((b) => b.textContent.trim() === 'Ч/б')
          ?.getAttribute('aria-pressed') ?? null
    }));
  };
  const accountPrefs = () =>
    c.page.evaluate(async () => JSON.stringify(await window.__dhlootFake?.prefs.load()));
  await c.d.open('#/p/set-twocards', { as: 'gm2' });
  await sheet(c.page);
  const before = await accountPrefs();
  await c.d.click('Ч/б');
  const kept = await c.d.storage('dhloot.prefs.v1');
  ok(kept === SEEDED, at + 'c: the print page press changed dhloot.prefs.v1 - ' + kept);
  const account = await accountPrefs();
  ok(account === before, at + 'c: the print page press changed the account row - ' + account);
  let seen = await sheet(c.page);
  ok(
    seen.bw && !seen.note && seen.pressed === 'true',
    at +
      'c: the press did not draw black and white, pressed, with no note - ' +
      JSON.stringify(seen)
  );
  await c.d.go('#/lists');
  await c.d.go('#/p/set-twocards');
  seen = await sheet(c.page);
  ok(
    seen.bw && !seen.note && seen.pressed === 'true',
    at + 'c: the pick did not survive a return from #/lists - ' + JSON.stringify(seen)
  );
  await c.d.open('#/p/set-twocards', { as: 'gm2' });
  seen = await sheet(c.page);
  ok(
    !seen.bw && !seen.note && seen.pressed === 'false',
    at + 'c: a reload did not draw the color default - ' + JSON.stringify(seen)
  );
  await c.ctx.close();
}

/** The prompt's own «Войти» - the header draws one too. */
async function pressPromptSignIn(page) {
  await page.click('.signin button');
  await ready(page);
}

/** 37. A signed-out selection's «Новый список» is the sign-in prompt; its
 *  «Войти» opens #/account, whose Google sign-in comes back to the table with
 *  the same row ticked and the bar's menu open over the account's lists.
 *  Leaving #/account by a tab first forgets it (docs/specs/FEATURES.md,
 *  "Account"). */
async function signInFromTheBar() {
  const at = '37 (sign-in from the bar): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/tables');
  await d.tick('Первоклассный Спальный Мешок');
  await d.press('В список');
  await d.press('Новый список');
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
      () => location.pathname === '/tables' && !!document.querySelector('.dropmenu')
    ),
    at + 'the sign-in did not come back to #/tables with the menu open - ' + (await d.hash())
  );
  const back = await page.evaluate(() => ({
    ticked: [...document.querySelectorAll('input[type="checkbox"]')].some(
      (c) => c.checked && c.getAttribute('aria-label') === 'Первоклассный Спальный Мешок'
    ),
    chips: [...document.querySelectorAll('.dropmenu .lrow .ln, .dropmenu .lnew')].map(
      (c) => c.textContent
    )
  }));
  ok(back.ticked, at + 'the row is no longer ticked');
  ok(
    back.chips.some((c) => c.includes('Лавка кузнеца')) && back.chips.includes('Новый список'),
    at + "the menu lacks the account's lists or «Новый список» - " + JSON.stringify(back.chips)
  );
  await ctx.close();

  const again = await fresh({ width: 1180, height: 900 });
  await again.d.open('#/tables');
  await again.d.tick('Первоклассный Спальный Мешок');
  await again.d.press('В список');
  await again.d.press('Новый список');
  await pressPromptSignIn(again.page);
  await again.d.press('Поиск');
  await again.page.click('header a[href="/account"]');
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

/** 73. A signed-out selection's «Печать» is the sign-in prompt in place of the
 *  bar's action row; «Отмена» brings the row back; its «Войти» opens #/account,
 *  whose Google sign-in makes the set of the ticked record and opens its
 *  #/p/<id> (docs/specs/FEATURES.md, "Print"). */
async function printAfterSignIn() {
  const at = '73 (print after sign-in): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/tables');
  await d.tick('Первоклассный Спальный Мешок');
  await d.press('Печать');
  const text = () => page.evaluate(() => document.body.innerText);
  ok(
    (await text()).includes('Войдите, чтобы печатать карточки.') &&
      !(await page.$('.selbarwrap .selacts .seldrop')),
    at + "the prompt did not take the bar's action row"
  );
  await d.press('Отмена');
  ok(
    !!(await page.$('.selbarwrap .selacts .seldrop')),
    at + '«Отмена» did not bring the action row back'
  );
  await d.press('Печать');
  await pressPromptSignIn(page);
  ok((await d.hash()) === '#/account', at + '«Войти» did not open #/account');
  await d.press('Войти через Google');
  ok(
    await waitIn(
      page,
      () =>
        /^\/p\/[A-Za-z0-9_-]{12}$/.test(location.pathname) &&
        document.querySelectorAll('.pcard[data-pid="ci1"]').length === 1 &&
        document.querySelectorAll('.pcard:not(.blank)').length === 1
    ),
    at + 'the sign-in did not open the set of the ticked record - ' + (await d.hash())
  );
  await ctx.close();
}

/** 39. Signing out on an account list's page goes to the lists page, with
 *  no account list left on screen. */
async function signOutOnAccountList() {
  const at = '39 (sign-out on an account list): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open(SHOP, { as: 'gm1' });
  ok(
    await waitIn(page, () => document.querySelector('.titleinput')?.value === 'Лавка кузнеца'),
    at + 'the account list did not open'
  );
  await d.fake('auth.signOut');
  ok(
    await waitIn(page, () => location.pathname === '/lists'),
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
  await waitIn(page, () => document.querySelector('.titleinput')?.value === 'Лавка кузнеца');
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
    (await page.evaluate(() => document.querySelector('.titleinput')?.value)) ===
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

/** 41. Deleting an account list from its card's «Ещё»: the browser's confirm names
 *  the share links, the card goes, and the toast offers no undo. */
async function deleteAccountList() {
  const at = '41 (delete an account list): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/lists', { as: 'gm1' });
  await waitIn(page, () => document.body.innerText.includes('Трофеи'));
  await d.press('Ещё: Трофеи');
  await d.press('Удалить список');
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
  await d.press('В список');
  await d.press('Новый список');
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
 *  copies `/s/<token>`, a deleted link opens nothing and a new one opens the
 *  list with the owner's line; a deleted GM link stays deleted on the next
 *  open until «Создать ссылку». No `/l/` address is ever copied. */
async function shareLinksOfAnAccountList() {
  const at = '43 (share links): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  const copied = [];
  await d.open(TROPHIES, { as: 'gm1' });
  await waitIn(page, () => document.querySelector('.titleinput')?.value === 'Трофеи');
  await d.press('Поделиться');
  ok(
    await waitIn(
      page,
      () =>
        [...document.querySelectorAll('.sharelink')].map((a) => a.textContent).join() ===
        '/s/share-token-1,/s/share-token-2'
    ),
    at +
      'the panel did not make both links - ' +
      JSON.stringify(await page.evaluate(shareLinks))
  );
  await d.press('Скопировать');
  const clip = (await d.clipboard())?.text ?? '';
  copied.push(clip);
  ok(
    /\/s\/share-token-1\?v=[0-9a-z]+$/.test(clip),
    at + 'the players link was not copied - ' + clip
  );
  await d.press('Удалить ссылку');
  ok(await waitIn(page, bodyHas, 'Ссылка удалена'), at + 'the deleted row does not say so');
  await d.press('Создать ссылку');
  ok(
    await waitIn(
      page,
      () =>
        [...document.querySelectorAll('.sharelink')].map((a) => a.textContent)[0] ===
        '/s/share-token-3'
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
  await waitIn(page, () => document.querySelector('.titleinput')?.value === 'Трофеи');
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
        '/s/share-token-4'
    ),
    at + 'a new GM link was not made - ' + JSON.stringify(await page.evaluate(shareLinks))
  );
  await d.press('Скопировать', 1);
  copied.push((await d.clipboard())?.text ?? '');
  await d.openMore(LIST_MORE);
  await d.press('Скопировать текст');
  copied.push((await d.clipboard())?.text ?? '');
  ok(
    copied.every((c) => !c.includes('/l/')),
    at + 'an /l/ address was copied - ' + JSON.stringify(copied)
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
      (p) =>
        location.pathname === p &&
        document.querySelector('.titleinput')?.value === 'Лавка кузнеца',
      FIRST_NEW.slice(1)
    ),
    at + 'the sign-in did not open the copy - ' + (await d.hash())
  );
  /* A closed note area draws each filled note read-only (docs/specs/FEATURES.md, "Lists");
     an open one holds it in its field. */
  const notes = await page.evaluate(() =>
    [...document.querySelectorAll('main .hitnote, main textarea')]
      .map((e) => (e instanceof HTMLTextAreaElement ? e.value : e.textContent))
      .join('\n')
  );
  ok(
    notes.includes('Открыта с рассвета до заката.'),
    at + "the players' note is not on the page"
  );
  ok(!notes.includes('Кузнец торгуется'), at + 'the GM note reached the copy');
  const read = await d.fake('lists.rows', [FIRST_NEW.slice(8)]);
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
    await waitIn(page, () => !!document.querySelector('.said[data-live="live"]')),
    at + 'the owner topic did not join'
  );
  const title = (name) => document.querySelector('.titleinput')?.value === name;
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
    await waitIn(page, () => !document.querySelector('.said[data-live]')),
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

/* The index card's chip, which counts the pending requests with the unread notices. */
const cardSays = (text) =>
  [...document.querySelectorAll('.listcard-new')].some((e) => e.textContent.trim() === text);

/** 54. A purchase request reaches the owner's open list page and the index within a
 *  second while the owner topic is joined; with Realtime down it waits for the tab to
 *  be shown again. */
async function liveRequests() {
  const at = '54 (live requests): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open(SHOP, { as: 'gm1' });
  ok(
    await waitIn(page, () => !!document.querySelector('.said[data-live="live"]')),
    at + 'the owner topic did not join'
  );
  await d.fake('request', 'player-token-1', [{ item: 'ci1', qty: 1 }]);
  ok(
    await waitWithin(page, 1000, bodyHas, 'Новое в списке (1)'),
    at + '«Новое в списке (1)» did not show within 1 s'
  );
  await d.go('#/lists');
  ok(
    await waitIn(page, cardSays, 'Новое в списке (1)'),
    at + 'the index card does not say «Новое в списке (1)»'
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
    !(await waitWithin(page, 1000, cardSays, 'Новое в списке (2)')),
    at + 'the second request showed with Realtime down and no signal'
  );
  await d.shownAgain();
  ok(
    await waitIn(page, cardSays, 'Новое в списке (2)'),
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
  await waitIn(page, () => !!document.querySelector('.said[data-live="live"]'));
  await d.fake('request', 'player-token-1', [
    { item: 'ci1', qty: 1 },
    { item: 'cc1', qty: 5 }
  ]);
  ok(await waitIn(page, bodyHas, 'Новое в списке (1)'), at + 'the request is not on the page');
  const rows = await d.count('.lrow');
  /* The panel folds on each page visit (docs/specs/FEATURES.md, "Lists"). */
  await page.evaluate(() => document.querySelector('.reqhead button')?.click());
  await d.settle();
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
  const read = await d.fake('lists.rows', [SHOP_ID]);
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
  await d.press('В список');
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
  await waitIn(page, () => document.querySelector('.titleinput')?.value === 'Лавка кузнеца');
  const shopRow = async () => {
    const read = await d.fake('lists.rows', ['00000000-0000-4000-8000-000000000101']);
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
  /* The list notes open from the side column («Изменить»), or «Заметки» up to 760 px. */
  if (!(await page.evaluate(noteShown))) {
    await page.evaluate(() =>
      document.querySelector('.lnotes .nopen button, .lhead .metat')?.click()
    );
    await d.settle();
  }
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
      () => location.pathname === '/lists' && !document.querySelector('[role="menu"]')
    ),
    at + '«Мои списки» did not land on #/lists with the menu closed - ' + (await d.hash())
  );
  await d.press(CONTROL);
  await d.press('Мои предметы');
  ok(
    await waitIn(
      page,
      () => location.pathname === '/homebrew' && !document.querySelector('[role="menu"]')
    ),
    at + '«Мои предметы» did not land on #/homebrew with the menu closed - ' + (await d.hash())
  );

  await d.open(SHOP, { as: 'gm1' });
  ok(
    await waitIn(page, () => document.querySelector('.titleinput')?.value === 'Лавка кузнеца'),
    at + 'the account list did not open'
  );
  await d.press(CONTROL);
  await d.press('Выйти');
  ok(
    await waitIn(
      page,
      () =>
        location.pathname === '/lists' &&
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

/** A file of docs/fixtures/import/. */
const IMPORT_FILE = (name) => path.join(__dirname, '../../docs/fixtures/import', name);
/** The account cards' pick boxes that are ticked, and the selection bar's count. */
const picks = () => ({
  ticked: document.querySelectorAll('.listcard-pick input:checked').length,
  summary: document.querySelector('.selbarwrap .selcount')?.textContent.trim() ?? ''
});

/** 58. The ticked lists download as one lists file: two account cards ticked,
 *  «Скачать JSON (2)» saves the dated file of the test build's clock with the
 *  two lists in index order and both notes, version 2 because «Лавка кузнеца»
 *  refers to the axe, which it carries with its snapshot; the ticks stay. */
async function ticksDownloadAsOneFile() {
  const at = '58 (the ticked lists download as one lists file): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/lists', { as: 'gm1' });
  await waitIn(page, () => !!document.querySelector('.listcard'));
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
    await waitIn(page, () => !!document.querySelector('.listcard'));
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
  await waitIn(page, () => !!document.querySelector('.listcard'));
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
    rows: [...document.querySelectorAll('.lrow .rname')].map((e) => e.textContent),
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
  await waitIn(page, () => !!document.querySelector('.listcard'));
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

/** 62. A search prunes the ticks and the bar's «Все» ticks the drawn cards
 *  only: gm1's three lists and nine made through the fake; a tick the query hides is dropped for good,
 *  and the checked boxes always equal the summary's number. */
async function searchPrunesTicks() {
  const at = '62 (a search prunes the ticks and select-all ticks the drawn cards only): ';
  const names = [
    'Порт Ветров',
    'Рынок',
    'Лавка в порту',
    ...Array.from({ length: 6 }, (_, i) => 'Сессия ' + String(i + 1))
  ];
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/lists', { as: 'gm1' });
  await d.settled('62');
  await d.accountLists(names.map((name, n) => ({ n: n + 1, name, ids: [] })));
  ok(
    (await d.count('.listcard')) === 12,
    at + 'twelve account cards are not drawn - ' + String(await d.count('.listcard'))
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
  await agree('two ticked', 'Выбрано: 2');
  await d.type('Найти список', 'порт');
  await agree('the query', 'Выбрано: 1');
  ok(await d.has('Удалить (1)'), at + 'the query does not leave «Удалить (1)»');
  await d.type('Найти список', '');
  const rynok = await page.evaluate(
    () =>
      [...document.querySelectorAll('.listcard-pick input')].find(
        (i) => i.getAttribute('aria-label') === 'Выбрать: Рынок'
      )?.checked
  );
  ok(rynok === false, at + '«Рынок» came back ticked');
  await agree('the query cleared', 'Выбрано: 1');
  await d.type('Найти список', 'порт');
  await d.tick('Выбрать все');
  await agree('select-all over the query', 'Выбрано: 2');
  ok(await d.has('Скачать JSON (2)'), at + 'select-all does not offer «Скачать JSON (2)»');
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
    /* Up to 760 px the tabs are the picker and the links of its sheet. */
    const measure = (sel) =>
      page.evaluate(
        (s) =>
          [...document.querySelectorAll(s)].map((e) => [
            e.textContent.trim(),
            e.getBoundingClientRect().height
          ]),
        sel
      );
    const heights = await measure('.hbtabs .picker, .hbtab .head .name button');
    await d.press('Мои предметы: Комплекты');
    await waitIn(page, () => document.querySelectorAll('dialog[open] .tab').length > 0);
    heights.push(...(await measure('dialog[open] .tab')));
    ok(
      heights.length === 6 && heights.every(([, h]) => h >= 24),
      at + 'a tab control or a card fold is under 24 px - ' + JSON.stringify(heights)
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
          (b) => b.textContent.trim() === 'В список'
        )
      ),
      at + 'the preview does not draw «В список»'
    );
    const add = await page.evaluateHandle(() =>
      [...document.querySelectorAll('.preview button')].find(
        (b) => b.textContent.trim() === 'В список'
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

/** 64. The «Добавить свой предмет» row after the entries at 360x640 as `gm1`: the open
 *  panel's «Название» in view, nothing sideways, «Добавить в список» not
 *  covered at the maximum scroll with a row ticked (the selection bar sits after the
 *  footer there), and a 120-character name keeping
 *  the toast's «Изменить» on screen; then at 1180 a hand-resized row note box
 *  keeps its height across a fold and an unfold. */
async function ownItemRowAndNoteBox() {
  const at = '64 (the own-item row and a row note box): ';
  {
    const { ctx, page, d } = await fresh({ width: 360, height: 640 });
    await d.open(SHOP, { as: 'gm1' });
    ok(
      await waitIn(page, () => !!document.querySelector('button.addrow')),
      at + 'the row «Добавить свой предмет» did not draw'
    );
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await d.press('Добавить свой предмет');
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

    const first = await page.evaluate(
      () => document.querySelector('.lrow .cname')?.textContent
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
      return { hit: !!hit && btn.contains(hit), bar: !!document.querySelector('.selbarwrap') };
    });
    ok(!!add?.bar, at + 'the ticked row raised no selection bar');
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
    /* The focus scrolled «Название» into view, and the button can sit under the bar again. */
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await d.settle();
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
    const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
    await openAccountList(d, { n: 1, name: 'Тайник', ids: ['ci1'] }, '64');
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
  await page.evaluate(() =>
    document.querySelector('.reqhead button[aria-expanded="false"]')?.click()
  );
  await d.settle();
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
  /* The new-request toast covers the window's bottom for 7000 ms; a press scrolled only
     into view would land on it. */
  await page.evaluate(() => {
    [...document.querySelectorAll('.reqpanel button')]
      .find((b) => b.textContent.trim() === 'и ещё 2 позиции')
      ?.scrollIntoView({ block: 'center' });
  });
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
    await d.press('Ещё: ' + long);
    await d.press('Удалить список');
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
 *  «Комплект» opens its hint under its label inside 0..360; an armor's two threshold
 *  labels and boxes lie inside 0..360; nothing scrolls sideways (docs/specs/FEATURES.md,
 *  "Consistency rules", rule 15). */
async function fieldHelpAt360() {
  const at = '67 (no field help and the threshold labels at 360): ';
  const { ctx, page, d } = await fresh({ width: 360, height: 640 });
  const sideways = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await d.open('#/homebrew/hb_emberaxeaaaaaaaa', { as: 'gm1' });
  ok(
    await waitIn(page, () => !!document.querySelector('#hb-name')),
    at + 'the axe editor did not draw'
  );
  await d.click('Связи');
  ok(
    !(await page.$('.hbform button[aria-label^="Подсказка"]')),
    at + 'the editor still draws a field «?»'
  );
  ok(!(await sideways()), at + 'the open fold scrolls the editor sideways');
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
    at + 'the armor fields did not draw'
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
  ok(!(await sideways()), at + 'the armor form scrolls sideways');
  await ctx.close();
}

/** 69. The GM-only toggle at 1180 and 360 as `gm1` on «Лавка кузнеца»: at 1180x900 the row
 *  «Ещё» hides the entry, the row's two buttons («Заметка», «Ещё») are each at least 24 px
 *  tall, and at both widths its
 *  visually hidden ", Только для мастера" box is at most 1x1 px; on a 360x640 phone the open
 *  compact row of a 120-character own item hides it from its «Ещё», every control of the
 *  open row is inside 0..360 and at least 24 px tall, and the bar's «Скрыть от игроков (2)»
 *  lies inside 0..360; nothing scrolls sideways (docs/specs/FEATURES.md, "Account and
 *  browser lists"). */
async function gmOnlyToggle() {
  const at = '69 (the GM-only toggle at 1180 and 360): ';
  const sideways = (page) =>
    page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  /* The buttons of the row whose «Ещё» ends with `tail`, after its «Скрыть от игроков». */
  const pressAndMeasure = (page, tail) =>
    page.evaluate(async (v) => {
      const frames = () =>
        new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const more = [...document.querySelectorAll('.lrow-acts .morewrap > button')].find((b) =>
        (b.getAttribute('aria-label') ?? '').endsWith(v)
      );
      if (!more) return null;
      more.click();
      await frames();
      const item = [...document.querySelectorAll('[role="menuitem"]')].find(
        (b) => b.textContent.trim() === 'Скрыть от игроков'
      );
      if (!item) return null;
      item.click();
      /* Two frames: the store's redraw, then the layout it moves. */
      await frames();
      const row = more.closest('.lrow');
      const acts = row.querySelector('.lrow-acts').getBoundingClientRect();
      const meta = row.querySelector('.lrow-meta').getBoundingClientRect();
      const state = row.querySelector('.gmstate')?.getBoundingClientRect();
      return {
        gmOnly: row.classList.contains('gm-only'),
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
      await waitIn(page, () => !!document.querySelector('.lrow-acts .morewrap > button')),
      at + 'the row «Ещё» did not draw at 1180'
    );
    const m = await pressAndMeasure(page, 'Брошюра по Истории Искусства');
    console.log('  69 at 1180: ' + JSON.stringify(m));
    ok(!!m && m.gmOnly, at + 'the row «Ещё» did not mark the row at 1180');
    ok(
      !!m?.state && m.state.w <= 1 && m.state.h <= 1,
      at + 'the GM-only words draw at 1180 - ' + JSON.stringify(m?.state)
    );
    ok(
      !!m && m.buttons.length === 2 && m.buttons.every((b) => b.h >= 24),
      at + 'an action button is under 24 px tall at 1180 - ' + JSON.stringify(m)
    );
    ok(!(await sideways(page)), at + 'the page scrolls sideways at 1180');
    await ctx.close();
  }
  {
    const { ctx, page, d } = await fresh({ width: 360, height: 640 });
    /* A phone: its scrollbar overlays the page. */
    await page.setViewport({ width: 360, height: 640, isMobile: true, hasTouch: true });
    await d.open(SHOP, { as: 'gm1' });
    ok(
      await waitIn(page, () => !!document.querySelector('button.addrow')),
      at + 'the row «Добавить свой предмет» did not draw'
    );
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await d.press('Добавить свой предмет');
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
        (v) => [...document.querySelectorAll('.crow .cname')].some((e) => e.textContent === v),
        long
      ),
      at + 'the 120-character row did not draw'
    );
    /* Up to 760 px the toggle is the open compact row's «Ещё» item. */
    const m = await page.evaluate(async (v) => {
      const frames = () =>
        new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const name = [...document.querySelectorAll('.crow .cname')].find(
        (e) => e.textContent === v
      );
      const row = name?.closest('.lrow');
      if (!row) return null;
      row.querySelector('button.cbody').click();
      await frames();
      row.querySelector('.cfull .morewrap > button')?.click();
      await frames();
      const item = [...document.querySelectorAll('[role="menuitem"]')].find(
        (b) => b.textContent.trim() === 'Скрыть от игроков'
      );
      if (!item) return null;
      item.click();
      await frames();
      const state = row.querySelector('.cmark .vh')?.getBoundingClientRect();
      return {
        gmOnly: row.classList.contains('gm-only'),
        state: state ? { w: state.width, h: state.height } : null,
        rowRight: row.getBoundingClientRect().right,
        controls: [...row.querySelectorAll('.cfull button, .cfull input, .cqf')].map((b) => {
          const r = b.getBoundingClientRect();
          return { h: Math.round(r.height), right: r.right };
        })
      };
    }, long);
    console.log('  69 at 360: ' + JSON.stringify(m));
    ok(!!m && m.gmOnly, at + 'the row «Ещё» did not mark the row at 360');
    ok(
      !!m?.state && m.state.w <= 1 && m.state.h <= 1,
      at + 'the GM-only words draw at 360 - ' + JSON.stringify(m?.state)
    );
    ok(
      !!m && m.rowRight <= 360 && m.controls.every((b) => b.right <= 360 && b.h >= 24),
      at + 'a control of the open row passes 360 or is under 24 px - ' + JSON.stringify(m)
    );
    ok(!(await sideways(page)), at + 'the page scrolls sideways at 360');

    await page.evaluate(() => document.querySelector('button.selmode')?.click());
    await d.settle();
    const names = await page.evaluate(() =>
      [...document.querySelectorAll('.lrow input[type="checkbox"]')]
        .slice(0, 2)
        .map((c) => c.getAttribute('aria-label') ?? '')
    );
    for (const n of names) await d.tick(n);
    await page.evaluate(() =>
      document.querySelector('.selbarwrap .bulkmore .morewrap > button')?.click()
    );
    await d.settle();
    const hide = await page.evaluate(() => {
      const b = [...document.querySelectorAll('[role="menuitem"]')].find(
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

/** The catalog's 640 px square picture: a real file for the crop dialog to decode. */
const CI1 = path.join(__dirname, '../../img/ci1.webp');

/** Opens `#/homebrew/new` as `gm1`, uploads `CI1` and waits for the crop stage's picture. */
async function cropOpen(page, d, at) {
  await d.open('#/homebrew/new', { as: 'gm1' });
  ok(
    await waitIn(page, () =>
      [...document.querySelectorAll('button')].some(
        (b) => b.textContent.trim() === 'Выбрать файл'
      )
    ),
    at + 'the picture field did not draw'
  );
  await d.upload(CI1);
  return waitIn(page, () => {
    const img = document.querySelector('dialog.cropdlg .stage img');
    return !!img && img.complete && img.naturalWidth > 0;
  });
}

/** Types the item's name and saves; answers the saved row's picture name, or null. */
async function nameAndSave(page, d, name) {
  await page.evaluate((v) => {
    const box = document.getElementById('hb-name');
    box.focus();
    box.value = v;
    box.dispatchEvent(new Event('input', { bubbles: true }));
  }, name);
  await d.press('Сохранить');
  await waitIn(
    page,
    async (v) => {
      const r = await window.__dhlootFake.homebrew.load();
      return r.ok && r.items.some((i) => i.content.ru === v);
    },
    name
  );
  return page.evaluate(async (v) => {
    const r = await window.__dhlootFake.homebrew.load();
    return (r.ok && r.items.find((i) => i.content.ru === v)?.art) ?? null;
  }, name);
}

async function pictureChooseCropSave() {
  const at = '70 (a picture: choose, crop, save): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  ok(await cropOpen(page, d, at), at + 'the crop dialog did not draw the picture');
  const stage = await page.evaluate(() => {
    const r = document.querySelector('dialog.cropdlg .stage').getBoundingClientRect();
    return { w: r.width, h: r.height };
  });
  ok(
    stage.w >= 160 && Math.abs(stage.w - stage.h) < 1,
    at + 'the stage is not a square of 160 px or more - ' + JSON.stringify(stage)
  );
  const left = () =>
    page.evaluate(() => document.querySelector('dialog.cropdlg .stage img').style.left);
  /* The decoding state's «Отмена» held the focus; the ready stage takes it. */
  ok(
    await waitIn(page, () => document.activeElement?.classList.contains('stage') ?? false),
    at + 'the stage did not take the focus once the picture decoded'
  );
  /* A square picture fills the square at the smallest zoom: zoom in first. */
  await page.keyboard.type('++++');
  const zoomed = await left();
  await page.keyboard.press('ArrowRight');
  const moved = await left();
  ok(moved !== zoomed, at + 'an arrow key did not move the picture - ' + zoomed);
  const box = await page.evaluate(() => {
    const r = document.querySelector('dialog.cropdlg .stage').getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await page.mouse.move(box.x + 40, box.y + 10, { steps: 4 });
  await page.mouse.up();
  ok((await left()) !== moved, at + 'a drag did not move the picture - ' + moved);
  await d.press('Готово');
  ok(
    await waitIn(page, () => !document.querySelector('dialog.cropdlg')),
    at + '«Готово» did not close the dialog'
  );
  ok(
    await waitIn(page, () => {
      const card = document.querySelector('.preview .card-media img');
      return (
        !!card && card.src.startsWith('blob:') && card.complete && card.naturalWidth === 640
      );
    }),
    at + 'the preview card does not draw the 640 px crop'
  );
  ok(
    await page.evaluate(
      () => document.querySelector('.th img')?.src.startsWith('blob:') ?? false
    ),
    at + 'the field does not draw the crop'
  );
  /* The guard: an in-app navigation asks, and a no keeps the page. */
  const asked = await page.evaluate(async () => {
    let n = 0;
    window.confirm = () => {
      n++;
      return false;
    };
    location.hash = '#/homebrew';
    await new Promise((r) => setTimeout(r, 300));
    return { n, hash: location.pathname };
  });
  ok(
    asked.n >= 1 && asked.hash === '/homebrew/new',
    at + 'the guard did not ask - ' + JSON.stringify(asked)
  );
  const art = await nameAndSave(page, d, 'Фонарь 70');
  ok(/^p\/[0-9a-f]{32}\.webp$/.test(art ?? ''), at + 'the saved picture is ' + String(art));

  /* Escape keeps the field as it was and gives the focus back to its first button. */
  ok(
    await waitIn(page, () =>
      [...document.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Заменить')
    ),
    at + '«Заменить» did not draw after the save'
  );
  await new Promise((r) => setTimeout(r, 300));
  const before = await page.evaluate(() => document.querySelector('.th img')?.src);
  await d.upload(CI1);
  ok(
    await waitIn(page, () => !!document.querySelector('dialog.cropdlg .stage')),
    at + 'the second crop dialog did not open'
  );
  await page.keyboard.press('Escape');
  ok(
    await waitIn(page, () => !document.querySelector('dialog.cropdlg')),
    at + 'Escape did not close the dialog'
  );
  const after = await page.evaluate(() => ({
    src: document.querySelector('.th img')?.src,
    focus: document.activeElement?.textContent?.trim()
  }));
  ok(after.src === before, at + 'Escape changed the field - ' + JSON.stringify(after));
  ok(after.focus === 'Заменить', at + 'Escape left the focus on ' + String(after.focus));
  await ctx.close();
}

async function pictureWithoutWebp() {
  const at = '71 (a browser that cannot encode WebP): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  /* Safari: a canvas asked for WebP answers a PNG (MDN, `toBlob()`). */
  await page.evaluateOnNewDocument(() => {
    const toBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (cb, type, quality) {
      return toBlob.call(this, cb, type === 'image/webp' ? 'image/png' : type, quality);
    };
  });
  ok(await cropOpen(page, d, at), at + 'the crop dialog did not draw the picture');
  await d.press('Готово');
  ok(
    await waitIn(page, () => !document.querySelector('dialog.cropdlg')),
    at + '«Готово» did not close the dialog'
  );
  const art = await nameAndSave(page, d, 'Фонарь 71');
  ok(/^p\/[0-9a-f]{32}\.jpg$/.test(art ?? ''), at + 'the saved picture is ' + String(art));
  await ctx.close();
}

async function cropDialogOnPhones() {
  const at = '72 (the crop dialog at 360 and in landscape): ';
  const { ctx, page, d } = await fresh({ width: 360, height: 640 });
  await page.setViewport({ width: 360, height: 640, isMobile: true, hasTouch: true });
  ok(await cropOpen(page, d, at), at + 'the crop dialog did not draw the picture');
  const measure = () =>
    page.evaluate(() => {
      const dlg = document.querySelector('dialog.cropdlg');
      const r = dlg.getBoundingClientRect();
      const s = dlg.querySelector('.stage').getBoundingClientRect();
      return {
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        vw: innerWidth,
        vh: innerHeight,
        stage: { w: s.width, h: s.height },
        scrolls: dlg.scrollHeight > dlg.clientHeight,
        sideways: document.documentElement.scrollWidth > innerWidth
      };
    });
  const inside = (m) =>
    m.left >= 0 && m.top >= 0 && m.right <= m.vw + 0.5 && m.bottom <= m.vh + 0.5;
  const tall = await measure();
  console.log('  72 at 360x640: ' + JSON.stringify(tall));
  ok(inside(tall), at + 'the dialog leaves the viewport at 360 - ' + JSON.stringify(tall));
  ok(!tall.sideways, at + 'the page scrolls sideways at 360');
  ok(Math.abs(tall.stage.w - tall.stage.h) < 1, at + 'the stage is not square at 360');
  await page.setViewport({ width: 640, height: 360, isMobile: true, hasTouch: true });
  await new Promise((r) => setTimeout(r, 200));
  const wide = await measure();
  console.log('  72 at 640x360: ' + JSON.stringify(wide));
  ok(inside(wide), at + 'the dialog leaves the viewport at 640x360 - ' + JSON.stringify(wide));
  ok(wide.scrolls, at + 'the dialog does not scroll inside itself at 640x360');
  ok(!wide.sideways, at + 'the page scrolls sideways at 640x360');
  ok(Math.abs(wide.stage.w - wide.stage.h) < 1, at + 'the stage is not square at 640x360');
  await ctx.close();
}

/** 74. The record text through Markup.svelte keeps the card look (values read on
 *  the build before Markup.svelte, 2026-10-15, at 360 px): the card paragraph with
 *  its S1 label in bold italics, the Vault of Ages list, a rule card's text and a
 *  set bonus; then gm4's formatted item: its table no wider than the description. */
async function keepsTheCardDescriptionLook() {
  const at = '74 (the card text look): ';
  const { ctx, page, d } = await fresh({ width: 360, height: 800 });
  const style = (sel, props) =>
    page.evaluate(
      (s, ps) => {
        const el = document.querySelector(s);
        if (!el) return null;
        const cs = getComputedStyle(el);
        return Object.fromEntries(ps.map((p) => [p, cs.getPropertyValue(p)]));
      },
      sel,
      props
    );
  const expect = (got, want, what) =>
    ok(
      !!got && Object.entries(want).every(([k, v]) => got[k] === v),
      at + what + ' - ' + JSON.stringify(got)
    );

  await d.open('#/i/q1');
  await d.settle();
  expect(await style('.card-desc p', ['margin']), { margin: '0px' }, 'q1 paragraph margin');
  ok(
    (await page.evaluate(() => document.querySelector('.card-desc p b > i')?.textContent)) ===
      'Надёжное:',
    at + 'q1 does not draw its label in bold italics'
  );

  await d.open('#/i/voa2_a3');
  await d.settle();
  expect(
    await style('.card-desc ul', ['padding-left', 'margin-top', 'margin-bottom']),
    { 'padding-left': '18px', 'margin-top': '4px', 'margin-bottom': '0px' },
    'voa2_a3 list'
  );
  expect(
    await style('.card-desc li', ['margin-top', 'margin-bottom']),
    { 'margin-top': '1px', 'margin-bottom': '1px' },
    'voa2_a3 list item'
  );

  await d.open('#/i/w1');
  await d.settle();
  await page.evaluate(() => {
    const det = document.querySelector('.refs details');
    if (det) det.open = true;
  });
  expect(
    await style('.refs .ref-text', ['padding', 'color', 'font-size', 'line-height']),
    {
      padding: '7px 9px 5px',
      color: 'rgb(155, 147, 179)',
      'font-size': '13px',
      'line-height': '19.5px'
    },
    "w1's rule card text"
  );
  expect(await style('.refs .ref-text p', ['margin']), { margin: '0px' }, 'a rule card line');

  await d.open('#/i/voa4_t3d');
  await d.settle();
  expect(
    await style('.craft .set-bonus p', ['font-size', 'line-height', 'margin']),
    { 'font-size': '13px', 'line-height': '18.85px', margin: '0px' },
    'the set bonus'
  );

  await d.open('#/h/00000000-0000-4000-8000-000000000515', { as: 'gm4' });
  await waitIn(page, () => !!document.querySelector('.card-desc table'));
  const table = await page.evaluate(() => {
    const desc = document.querySelector('.card-desc');
    const t = desc?.querySelector('table');
    return {
      table: t ? t.getBoundingClientRect().width : null,
      desc: desc ? desc.getBoundingClientRect().width : null,
      layout: t ? getComputedStyle(t).tableLayout : null,
      sideways: document.documentElement.scrollWidth > innerWidth
    };
  });
  ok(
    table.table !== null && table.desc !== null && table.table <= table.desc + 0.5,
    at + 'the table is wider than the description - ' + JSON.stringify(table)
  );
  ok(table.layout === 'fixed', at + 'the table layout is not fixed - ' + JSON.stringify(table));
  ok(!table.sideways, at + 'the formatted card scrolls the page sideways');
  const found = await axe(page);
  ok(
    found.length === 0,
    at + 'axe on the formatted card - ' + JSON.stringify(found.map((v) => v.id))
  );
  await ctx.close();
}

/* A toolbar edit goes through `execCommand('insertText')`, so Ctrl+Z takes it back; jsdom
   has no `execCommand`, so only a real browser proves it (docs/specs/FEATURES.md,
   "Consistency rules", rule 18). */
async function undoesAToolbarEditWithTheBrowsersUndo() {
  const at = '75 (undo of a toolbar edit): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/homebrew/new', { as: 'gm1' });
  ok(
    await waitIn(page, () => !!document.getElementById('hb-desc')),
    at + 'the description box did not draw'
  );
  await page.focus('#hb-desc');
  await page.keyboard.type('огонь');
  await page.evaluate(() => {
    const box = document.getElementById('hb-desc');
    box.setSelectionRange(0, box.value.length);
  });
  await d.press('Жирный');
  const bold = await page.evaluate(() => document.getElementById('hb-desc').value);
  ok(bold === '**огонь**', at + 'Bold did not wrap the word - ' + JSON.stringify(bold));
  ok(
    await waitIn(
      page,
      () => document.querySelector('.preview .card-desc b')?.textContent === 'огонь'
    ),
    at + 'the card did not draw the bold word'
  );
  await page.focus('#hb-desc');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyZ');
  await page.keyboard.up('Control');
  await d.settle();
  const undone = await page.evaluate(() => document.getElementById('hb-desc').value);
  ok(undone === 'огонь', at + 'Ctrl+Z did not undo the edit - ' + JSON.stringify(undone));
  await ctx.close();
}

/** 76. A list note draws as formatted text at 360 px: the list note's «Просмотр» pane
 *  takes the shared list rules, and the rolled entry's note draws bold, a numbered list and
 *  a table no wider than its text (docs/specs/FEATURES.md, "Lists"). */
async function drawsListNotesAsFormattedText() {
  const at = '76 (list notes draw as formatted text): ';
  const { ctx, page, d } = await fresh({ width: 360, height: 800 });
  await openAccountList(
    d,
    {
      n: 1,
      name: 'Тайник',
      ids: ['ci1', 'ci2'],
      note: 'Лавка *закрыта* до утра\n- вход со двора',
      meta: {
        ci2: {
          note:
            '**Светится** в темноте\n1. днём тускло\n2. ночью ярко\n' +
            '| Время суток, когда свет заметнее всего | Свет |\n|---|---|\n| ночь | ярко |'
        }
      }
    },
    '76'
  );
  /* Up to 760 px the list notes and the roll open from the head. */
  await d.press('Заметки');
  await d.press('Просмотр');
  ok(
    await waitIn(page, () => !!document.querySelector('.lnotes .pane ul')),
    at + 'the pane drew no list'
  );
  const pane = await page.evaluate(() => {
    const ul = document.querySelector('.lnotes .pane ul');
    const cs = ul ? getComputedStyle(ul) : null;
    return {
      padding: cs?.paddingLeft,
      margin: cs?.marginTop,
      italic: document.querySelector('.lnotes .pane i')?.textContent
    };
  });
  ok(
    pane.padding === '18px' && pane.margin === '4px' && pane.italic === 'закрыта',
    at + 'the pane does not take the list rules - ' + JSON.stringify(pane)
  );
  await d.openMore(LIST_MORE);
  await d.press('Бросить по списку');
  await d.press('На единицу больше');
  await d.press('На единицу больше');
  ok(
    await waitIn(page, () => !!document.querySelector('.hitnote .htext ol')),
    at + 'the rolled entry drew no numbered list'
  );
  const hit = await page.evaluate(() => {
    const text = document.querySelector('.hitnote .htext');
    const table = text?.querySelector('table');
    return {
      bold: text?.querySelector('p b')?.textContent,
      stars: text?.textContent.includes('*'),
      table: table ? table.getBoundingClientRect().width : null,
      text: text ? text.getBoundingClientRect().width : null,
      sideways: document.documentElement.scrollWidth > innerWidth
    };
  });
  ok(
    hit.table !== null && hit.text !== null && hit.table <= hit.text + 0.5,
    at + 'the rolled note table is wider than its text - ' + JSON.stringify(hit)
  );
  ok(hit.bold === 'Светится', at + 'the rolled note has no bold word - ' + JSON.stringify(hit));
  ok(!hit.stars, at + 'the rolled note draws its markers');
  ok(!hit.sideways, at + 'the page scrolls sideways at 360');
  const found = await axe(page);
  ok(found.length === 0, at + 'axe - ' + JSON.stringify(found.map((v) => v.id)));
  await ctx.close();
}

/** 77. A shared row's tick column runs through its take line at 360 and through its note
 *  too at 1180, in the selection mode: the select box ends at the row's inner bottom, the
 *  checkbox sits on the main line (the compact row at 360), and a press low in the column
 *  unticks the row (docs/specs/FEATURES.md, "Lists"). The players' link of «Лавка
 *  кузнеца», whose ci1 counts 2, gets a players' note on ci1 as another device would write
 *  it; up to 760 px the note sits in the unfolded row. */
async function sharedRowTickColumn() {
  for (const width of [360, 1180]) {
    const at = `77 (the shared row's tick column) at ${width}: `;
    const { ctx, page, d } = await fresh({ width, height: 900 });
    await d.open('#/s/player-token-1');
    await d.fake('playEntry', SHOP_ID, 'ci1', { player_note: 'Видно игрокам' });
    ok(
      await waitIn(
        page,
        (wide) =>
          wide
            ? !!document.querySelector('[data-row="ci1"] > .rnotes')
            : !!document.querySelector('[data-row="ci1"] .cmark'),
        width > 760
      ),
      at + 'the ci1 row never drew its note'
    );
    await page.click('button.selmode');
    await d.settle();
    await page.click('[data-row="ci1"] .selbox input');
    ok(
      await waitIn(page, () => !!document.querySelector('[data-row="ci1"] > .pickrow')),
      at + 'the ticked row drew no take line'
    );
    const g = await page.evaluate(() => {
      const row = document.querySelector('[data-row="ci1"]');
      /* `scroll-margin-top` keeps the row under the sticky header and above the bar. */
      row.scrollIntoView({ block: 'start' });
      const box = row.querySelector(':scope > .selbox').getBoundingClientRect();
      const tick = row.querySelector(':scope > .selbox input').getBoundingClientRect();
      const main = row
        .querySelector(':scope > .row-main, :scope > .crow > .cbody')
        .getBoundingClientRect();
      const r = row.getBoundingClientRect();
      return {
        notes: !!row.querySelector(':scope > .rnotes, .cmark'),
        inner: r.bottom - parseFloat(getComputedStyle(row).borderBottomWidth),
        boxBottom: box.bottom,
        boxX: box.left + box.width / 2,
        tickY: tick.top + tick.height / 2,
        mainTop: main.top,
        mainBottom: main.bottom
      };
    });
    ok(g.notes, at + 'the row drew no note');
    ok(
      Math.abs(g.boxBottom - g.inner) <= 1,
      at + 'the select box stops short of the row - ' + JSON.stringify(g)
    );
    ok(
      g.tickY > g.mainTop && g.tickY < g.mainBottom,
      at + 'the checkbox is off the main line - ' + JSON.stringify(g)
    );
    await page.mouse.click(g.boxX, g.boxBottom - 6);
    ok(
      await waitIn(page, () => !document.querySelector('[data-row="ci1"].sel')),
      at + 'a press low in the tick column did not untick the row'
    );
    await ctx.close();
  }
}

/** 78. «Сохранить себе» on a catalog record as `gm1`: at 360x740 on `#/i/cm26`, the longest
 *  catalog name, the `h1` wraps inside 0..360 and nothing goes sideways; two presses in
 *  «Ещё», and the second toast names «... (2)» with its «Изменить» inside 0..360; at
 *  1180x900 the menu opens under «Ещё», inside the window (docs/specs/FEATURES.md,
 *  "Records"). */
async function catalogCopyPerPress() {
  const at = '78 (a copy per press of a catalog record): ';
  const NAME = 'Стрелы и Болты с Метеоритными Наконечниками';
  {
    const { ctx, page, d } = await fresh({ width: 360, height: 740 });
    await d.open('#/i/cm26', { as: 'gm1' });
    const narrow = await page.evaluate(() => {
      const r = document.querySelector('h1').getBoundingClientRect();
      return {
        left: r.left,
        right: r.right,
        sideways: document.documentElement.scrollWidth > innerWidth
      };
    });
    ok(
      narrow.left >= 0 && narrow.right <= 360,
      at + 'the heading lies outside 0..360 - ' + JSON.stringify(narrow)
    );
    ok(!narrow.sideways, at + 'the page scrolls sideways at 360');
    await d.more('Сохранить себе');
    ok(
      await waitIn(
        page,
        (n) => (document.querySelector('.toast')?.textContent ?? '').includes('«' + n + '»'),
        NAME
      ),
      at + 'the first press raised no toast with the name'
    );
    /* By keys: the first toast covers the end of the menu, and the focus is on «Ещё». */
    await page.keyboard.press('Enter');
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    ok(
      await waitIn(
        page,
        (n) =>
          (document.querySelector('.toast')?.textContent ?? '').includes('«' + n + ' (2)»') &&
          !!document.querySelector('.toast a.toast-act'),
        NAME
      ),
      at + 'the second press raised no toast with «... (2)» and «Изменить»'
    );
    const edit = await page.evaluate(() => {
      const r = document.querySelector('.toast a.toast-act').getBoundingClientRect();
      return { left: r.left, right: r.right };
    });
    ok(
      edit.left >= 0 && edit.right <= 360,
      at + '«Изменить» lies outside 0..360 - ' + JSON.stringify(edit)
    );
    await ctx.close();
  }
  {
    const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
    await d.open('#/i/cm26', { as: 'gm1' });
    await d.openMore();
    const wide = await page.evaluate(() => {
      const m = document.querySelector('[role="menu"]').getBoundingClientRect();
      const b = document
        .querySelector('.cardpick [aria-haspopup="menu"]')
        .getBoundingClientRect();
      return { top: m.top, right: m.right, under: b.bottom, view: innerWidth };
    });
    ok(
      wide.top >= wide.under && wide.right <= wide.view,
      at + 'the menu is not under «Ещё» inside the window - ' + JSON.stringify(wide)
    );
    await ctx.close();
  }
}

/** 88. The action row and the dialog's dock at every width. On the record page at 360, 320
 *  and 1180, RU and EN, signed out, signed in and as the author: every control inside the
 *  window and uncut, at most three lines, «В список» the only gold primary, and «Ещё» opens
 *  a menu inside the window with 44 px items at 360. In the dialog at 360x640, 640x360 and
 *  1180x720: the dock holds the card's bottom, or joins the scroll below 481 px of height and
 *  from 761 px, takes at most 0.45 of the window, «Ещё» opens up from the dock, or down from
 *  the row, inside the card, and a toast leaves the dock in place; a prompt leaves «Ещё»'s
 *  menu under the button, and a rule card draws its chevron; with 150 lists the add menu scrolls inside the window with its search and
 *  «+ Новый список» in view (docs/specs/FEATURES.md, "Records"). */
async function recordActionsFit() {
  const at = '88 (the record actions fit): ';
  for (const lang of ['ru', 'en']) {
    for (const [width, height] of [
      [360, 640],
      [320, 568],
      [1180, 720]
    ]) {
      const { ctx, page, d } = await fresh({ width, height, lang });
      for (const [route, as] of [
        ['#/i/ci1', undefined],
        ['#/i/ci1', 'gm3'],
        ['#/i/hb_emberaxeaaaaaaaa', 'gm1']
      ]) {
        const where = [route, as ?? 'signed out', lang, width].join(' ') + ': ';
        await d.open(route, { as, lang });
        const row = await page.evaluate(() => {
          const controls = [
            ...document.querySelectorAll(
              '.cardpick > .btn, .cardpick .seldrop > .btn, .cardpick .morewrap > .btn'
            )
          ];
          return {
            count: controls.length,
            lines: new Set(controls.map((c) => Math.round(c.getBoundingClientRect().top))).size,
            out: controls
              .filter((c) => {
                const r = c.getBoundingClientRect();
                return r.left < 0 || r.right > innerWidth || c.scrollWidth > c.clientWidth;
              })
              .map((c) => c.textContent),
            primaries: document.querySelectorAll('main .btn.primary').length
          };
        });
        ok(row.count >= 4, at + where + 'the row draws ' + row.count + ' controls');
        ok(row.lines <= 3, at + where + 'the row takes ' + row.lines + ' lines');
        ok(
          width !== 360 || row.count > 4 || row.lines === 2,
          at + where + 'four controls take ' + row.lines + ' lines'
        );
        ok(!row.out.length, at + where + 'cut or outside - ' + JSON.stringify(row.out));
        ok(row.primaries === 1, at + where + row.primaries + ' gold primaries');
        await d.openMore();
        const menu = await page.evaluate(() => {
          const m = document.querySelector('[role="menu"]').getBoundingClientRect();
          return {
            box: { x: m.x, y: m.y, w: m.width, h: m.height },
            view: { x: 0, y: 0, w: innerWidth, h: innerHeight },
            least: Math.min(
              ...[...document.querySelectorAll('[role="menuitem"]')].map(
                (i) => i.getBoundingClientRect().height
              )
            )
          };
        });
        ok(
          inside(menu.box, menu.view),
          at + where + 'the menu leaves the window - ' + JSON.stringify(menu)
        );
        ok(
          width > 600 || menu.least >= 44,
          at + where + 'an item is ' + menu.least + ' px tall'
        );
      }
      await ctx.close();
    }

    for (const [width, height] of [
      [360, 640],
      [640, 360],
      [1180, 720]
    ]) {
      const where = 'the dialog ' + lang + ' ' + width + 'x' + height + ': ';
      const { ctx, page, d } = await fresh({ width, height, lang });
      await d.open('#/tables/eq_weapon', { lang });
      await d.click(lang === 'ru' ? 'Палаш' : 'Broadsword');
      await waitIn(page, () => !!document.querySelector('dialog[open] .cardpick'));
      const dock = async () =>
        page.evaluate(() => {
          const card = document.querySelector('.modal-card');
          const el = card.querySelector('.cardpick');
          const r = el.getBoundingClientRect();
          return {
            sticky: getComputedStyle(el).position === 'sticky',
            height: r.height,
            gap: card.getBoundingClientRect().bottom - r.bottom
          };
        });
      const first = await dock();
      ok(
        first.sticky === (width <= 760 && height > 480),
        at + where + 'sticky is ' + first.sticky
      );
      ok(first.height <= 0.45 * height, at + where + 'the dock is ' + first.height + ' px');
      if (first.sticky) ok(Math.abs(first.gap) <= 1.5, at + where + 'gap ' + first.gap);
      await page.evaluate(() => {
        const card = document.querySelector('.modal-card');
        card.scrollTop = card.scrollHeight;
      });
      await d.settle();
      await d.openMore();
      const menu = await page.evaluate(() => {
        const box = (r) => ({ x: r.x, y: r.y, w: r.width, h: r.height });
        const m = document.querySelector('[role="menu"]');
        const card = document.querySelector('.modal-card').getBoundingClientRect();
        return {
          up: m.classList.contains('up'),
          box: box(m.getBoundingClientRect()),
          card: box(card),
          view: { x: 0, y: 0, w: innerWidth, h: innerHeight }
        };
      });
      ok(menu.up === first.sticky, at + where + 'the menu opens up: ' + menu.up);
      ok(
        inside(menu.box, menu.card),
        at + where + 'menu outside the card ' + JSON.stringify(menu)
      );
      ok(inside(menu.box, menu.view), at + where + 'menu outside the window');
      await d.press(lang === 'ru' ? 'Скопировать название' : 'Copy name');
      ok(
        await waitIn(page, () => !!document.querySelector('dialog[open] .toast')),
        at + where + 'the copy raised no toast'
      );
      ok(
        await page.evaluate(() => !!document.querySelector('dialog[open] .cardpick')),
        at + where + 'the toast took the dock away'
      );
      await ctx.close();
    }
  }

  const phone = await fresh({ width: 360, height: 640 });
  await phone.d.open('#/i/ci1');
  await phone.d.press('Печать');
  await phone.d.openMore();
  const under = await phone.page.evaluate(
    () =>
      document.querySelector('[role="menu"]').getBoundingClientRect().top -
      document.querySelector('.morewrap > .btn').getBoundingClientRect().bottom
  );
  ok(Math.abs(under - 8) <= 1, at + 'a prompt moves the menu ' + under + ' px off «Ещё»');
  await phone.d.open('#/i/mw9');
  const chevron = await phone.page.evaluate(
    () => getComputedStyle(document.querySelector('.refs summary'), '::after').content
  );
  ok(chevron !== 'none', at + 'the rule card draws no chevron');
  await phone.ctx.close();

  const { ctx, page, d } = await fresh({ width: 360, height: 640 });
  await d.open('#/tables/eq_weapon', { as: 'gm2' });
  await d.accountLists(
    Array.from({ length: 150 }, (_, i) => ({ n: i + 1, name: 'Список ' + i, ids: ['ci1'] }))
  );
  await d.click('Палаш');
  await waitIn(page, () => !!document.querySelector('dialog[open] .cardpick'));
  await page.click('dialog[open] .seldrop > .btn');
  await d.settle();
  const add = await page.evaluate(() => {
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const menu = document.querySelector('.dropmenu');
    const chips = menu.querySelector('.pickchips');
    return {
      menu: box(menu),
      search: box(menu.querySelector('.pickq')),
      add: box(menu.querySelector(':scope > .lnew') ?? menu.lastElementChild),
      scrolls: chips.scrollHeight > chips.clientHeight,
      view: { x: 0, y: 0, w: innerWidth, h: innerHeight }
    };
  });
  ok(add.scrolls, at + 'the 150 lists do not scroll');
  for (const name of ['menu', 'search', 'add']) {
    ok(inside(add[name], add.view), at + 'the add menu: ' + name + ' leaves the window');
  }
  ok(inside(add.search, add.menu), at + 'the search leaves the add menu');
  ok(inside(add.add, add.menu), at + '«+ Новый список» leaves the add menu');
  await ctx.close();
}

/** 79: on a 360x480 window (an 800 px phone less a 320 px keyboard) each `ItemPicker`
 *  list - «Связи» in the editor, the picture picker and the Sets tab's member picker -
 *  draws inside the window under the sticky top bar, with the field at the window's
 *  bottom and in its middle; at 1180x900 with the field in the upper half the list opens
 *  downward (docs/specs/FEATURES.md, "Relations"). */
async function pickerAboveKeyboard() {
  const at = '79 (a picker list stays above the on-screen keyboard): ';
  /* Scrolls the field to the window's bottom (8 px margin) or its middle, focuses it with
     no scroll, types «а» and answers the list's box against the top bar and the window. */
  const listAt = async (page, sel, where) => {
    await page.evaluate(
      (s, w) => {
        const el = document.querySelector(s);
        el.scrollIntoView({ block: 'center' });
        const r = el.getBoundingClientRect();
        const want = w === 'bottom' ? innerHeight - 8 - r.height : (innerHeight - r.height) / 2;
        window.scrollBy(0, r.top - want);
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.focus({ preventScroll: true });
      },
      sel,
      where
    );
    await page.keyboard.type('а');
    await waitIn(
      page,
      () =>
        !!document.querySelector('.drop li[role="option"]') &&
        document.querySelector('.drop')?.style.maxHeight !== ''
    );
    await new Promise((r) => setTimeout(r, 150));
    return page.evaluate((s) => {
      const drop = document.querySelector('.drop');
      const d = drop?.getBoundingClientRect();
      const f = document.querySelector(s)?.getBoundingClientRect();
      const bar = document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 0;
      return {
        options: drop ? drop.querySelectorAll('li[role="option"]').length : 0,
        top: d ? d.top : null,
        bottom: d ? d.bottom : null,
        up: !!drop?.classList.contains('up'),
        field: f ? [f.top, f.bottom] : null,
        bar,
        h: innerHeight
      };
    }, sel);
  };
  const inside = (m) =>
    m.options > 0 && m.top !== null && m.top >= m.bar - 1 && m.bottom <= m.h + 1;
  const open = {
    craft: async (d, page) => {
      await d.open('#/homebrew/new', { as: 'gm1' });
      await waitIn(page, () => !!document.querySelector('details.rel'));
      await page.evaluate(() => {
        document.querySelector('details.rel').open = true;
      });
      await waitIn(page, () => !!document.getElementById('hb-craft'));
      return '#hb-craft';
    },
    art: async (d, page) => {
      await d.open('#/homebrew/new', { as: 'gm1' });
      await d.press('Выбрать из предметов');
      await waitIn(page, () => !!document.getElementById('hb-art-pick'));
      return '#hb-art-pick';
    },
    member: async (d, page) => {
      await d.open('#/homebrew/sets/hb_aldersetaaaaaaaa', { as: 'gm1' });
      await waitIn(page, () => !!document.querySelector('input[id^="hb-add-"]'));
      return 'input[id^="hb-add-"]';
    }
  };
  for (const [name, go] of Object.entries(open)) {
    for (const where of ['bottom', 'middle']) {
      const { ctx, page, d } = await fresh({ width: 360, height: 480 });
      try {
        const sel = await go(d, page);
        const m = await listAt(page, sel, where);
        ok(
          inside(m),
          at + name + ' at the ' + where + ': the list leaves the window - ' + JSON.stringify(m)
        );
      } finally {
        await ctx.close();
      }
    }
  }
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  try {
    const sel = await open.craft(d, page);
    await page.evaluate((s) => {
      const el = document.querySelector(s);
      window.scrollBy(0, el.getBoundingClientRect().top - 300);
      el.focus({ preventScroll: true });
    }, sel);
    await page.keyboard.type('а');
    await waitIn(page, () => !!document.querySelector('.drop li[role="option"]'));
    await new Promise((r) => setTimeout(r, 150));
    ok(
      !(await page.evaluate(() => !!document.querySelector('.drop.up'))),
      at + 'the list opens upward at 1180x900 with the field in the upper half'
    );
  } finally {
    await ctx.close();
  }
}

/** 80: the editor's summary after a refused «Сохранить» and the homebrew import's
 *  refused-file box take the error look of docs/specs/FEATURES.md, rule 19: no fill and
 *  the danger border. */
async function homebrewRefusalLook() {
  const at = '80 (the homebrew refusals take the error look): ';
  const look = (page) =>
    page.evaluate(() => {
      const box = document.querySelector('.errs');
      if (!box) return null;
      const probe = document.createElement('span');
      probe.style.color = 'var(--danger)';
      document.body.append(probe);
      const danger = getComputedStyle(probe).color;
      probe.remove();
      const cs = getComputedStyle(box);
      return { bg: cs.backgroundColor, border: cs.borderTopColor, danger };
    });
  const errorLook = (m) => !!m && m.bg === 'rgba(0, 0, 0, 0)' && m.border === m.danger;
  {
    const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
    try {
      await d.open('#/homebrew/new', { as: 'gm1' });
      await d.press('Сохранить');
      await waitIn(page, () => !!document.querySelector('.errs'));
      const m = await look(page);
      ok(errorLook(m), at + 'the editor summary - ' + JSON.stringify(m));
    } finally {
      await ctx.close();
    }
  }
  {
    const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
    try {
      await d.open('#/homebrew', { as: 'gm1' });
      await hbImportOpen(d);
      await d.upload(HB_FILE('errors.json'));
      await waitIn(page, () => !!document.querySelector('.errs'));
      const m = await look(page);
      ok(errorLook(m), at + 'the import refused-file box - ' + JSON.stringify(m));
    } finally {
      await ctx.close();
    }
  }
}

/** 81. The address bar in its path form (docs/specs/ROUTES.md, "Path form"): a link click
 *  is one history step that Back undoes, a click on the active tab and the skip link are
 *  none, the record modal leaves the bar, the bar carries `?v` on a record at once and on
 *  an item and a share link after their read, and the page-level copy button hands out
 *  the bar on a record, an item, a share link with no filter, a print set and a table
 *  (docs/specs/FEATURES.md, "Consistency rules"). */
async function addressBarPathForm() {
  const at = '81 (the address bar): ';
  const VERSIONS = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', '..', 'card-versions.json'), 'utf8')
  );
  /* The driver's own parameters, which a copy never carries; `v` and the rest stay. */
  const TEST_PARAMS = ['as', 'lang', 'items', 'sections', 'sources', 'hold', 'toasts'];
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  const bar = () =>
    page.evaluate((drop) => {
      const u = new URL(location.href);
      for (const k of drop) u.searchParams.delete(k);
      return { href: u.href, path: location.pathname, search: u.search, n: history.length };
    }, TEST_PARAMS);
  const copiedIs = async (what) => {
    const clip = (await d.clipboard())?.text ?? '';
    const now = await bar();
    ok(clip === now.href, at + what + ': copied ' + clip + ', the bar is ' + now.href);
  };
  try {
    await d.open('#/roll/std');
    const start = await bar();
    await page.click('nav.tabs a[href="/tables"]');
    await d.settle();
    const step = await bar();
    ok(
      step.path === '/tables' && step.n === start.n + 1,
      at + 'a tab click is not one step to /tables - ' + JSON.stringify(step)
    );
    await page.goBack();
    await d.settle();
    ok((await bar()).path === '/roll/std', at + 'Back did not return to /roll/std');
    const before = await bar();
    await page.click('nav.tabs a[aria-current="page"]');
    await d.settle();
    await page.evaluate(() => document.querySelector('a.skip')?.click());
    const after = await bar();
    ok(
      after.path === '/roll/std' && after.n === before.n && after.href === before.href,
      at + 'the active tab or the skip link moved the address - ' + JSON.stringify(after)
    );
    ok(
      await page.evaluate(() => document.activeElement?.id === 'main'),
      at + 'the skip link did not move the focus to main'
    );

    await d.open('#/i/ci1');
    const record = await bar();
    ok(
      record.path === '/i/ci1' && record.search === '?v=' + VERSIONS.ci1,
      at + 'the record bar does not carry its card version - ' + JSON.stringify(record)
    );
    await d.more('Скопировать ссылку');
    await copiedIs('a record');
    await d.press('Таблицы', 0);
    await d.settle();
    ok((await bar()).search === '', at + 'a navigation kept ?v');

    await d.open('#/tables');
    const table = await bar();
    await d.press('Кольцо Тишины');
    ok(await waitIn(page, () => !!document.querySelector('dialog[open]')), at + 'no modal');
    ok(
      (await bar()).href === table.href,
      at + 'the record modal wrote to the bar - ' + (await bar()).href
    );
    await page.keyboard.press('Escape');
    ok(
      (await bar()).href === table.href,
      at + 'closing the modal wrote to the bar - ' + (await bar()).href
    );
    await d.open('#/tables/eq_weapon');
    await d.press('Ссылка на таблицу');
    await copiedIs('a table');

    await d.open('#/h/00000000-0000-4000-8000-000000000662');
    ok(
      await waitIn(page, () => /^\?v=[0-9a-z]+$/.test(location.search)),
      at + 'the item bar did not take its card version after the read'
    );
    await d.more('Скопировать ссылку');
    await copiedIs('an item');

    await d.open('#/p/set-twocards', { as: 'gm2' });
    await waitIn(page, () => !!document.querySelector('.psheet'));
    await d.click('Ссылка на набор');
    await copiedIs('a print set');

    /* The owner's panel copies the seeded players link; a reader opens it. */
    await d.open(SHOP, { as: 'gm1' });
    await waitIn(page, () => document.querySelector('.titleinput')?.value === 'Лавка кузнеца');
    await d.press('Поделиться');
    await waitIn(page, () => document.querySelectorAll('.sharelink').length === 2);
    await d.press('Скопировать');
    const share = (await d.clipboard())?.text ?? '';
    await d.open(new URL(share).pathname);
    ok(
      await waitIn(page, (s) => location.href === s, share),
      at + 'a share link: copied ' + share + ', the bar is ' + (await bar()).href
    );
  } finally {
    await ctx.close();
  }
}

/** 82: the Items tab filter of «Мои предметы» lives in the address (docs/specs/ROUTES.md,
 *  "Homebrew"): a pick replaces the address in place, Back from the editor and a reload
 *  draw the same filter with the panel open, and a tab press and back clears it. */
async function homebrewItemsFilterAddress() {
  const at = '82 (the Items tab filter address): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  const view = () =>
    page.evaluate(() => ({
      path: location.pathname,
      n: history.length,
      picks: [...document.querySelectorAll('.fcol .frow [aria-pressed="true"]')]
        .map((p) => p.textContent.trim())
        .filter((v) => v !== 'Все'),
      count: [...document.querySelectorAll('.tools .count')]
        .map((c) => c.textContent.trim())
        .join(' '),
      rows: document.querySelectorAll('[data-row]').length
    }));
  const FILTERED = '/homebrew/f_src-hb_alderworkshopaaa';
  const isFiltered = (v) =>
    v.path === FILTERED &&
    JSON.stringify(v.picks) === JSON.stringify(['Мастерская Ольхи']) &&
    v.count.includes('Показано 7 из 12') &&
    v.rows === 7;
  try {
    await d.open('#/homebrew', { as: 'gm1', items: 12 });
    await waitIn(page, () => document.querySelectorAll('[data-row]').length === 12);
    const start = await view();
    await d.press('Мастерская Ольхи');
    const picked = await view();
    ok(
      isFiltered(picked) && picked.n === start.n,
      at + 'a pick is not an in-place write of the filter - ' + JSON.stringify(picked)
    );
    await page.click('[data-row="hb_emberaxeaaaaaaaa"] .rt');
    ok(
      await waitIn(page, () => location.pathname === '/homebrew/hb_emberaxeaaaaaaaa'),
      at + 'a row did not open the editor'
    );
    await page.goBack();
    await waitIn(page, () => document.querySelectorAll('[data-row]').length === 7);
    const back = await view();
    ok(isFiltered(back), at + 'Back did not draw the filter - ' + JSON.stringify(back));
    await page.reload({ waitUntil: 'load' });
    await waitIn(page, () => document.querySelectorAll('[data-row]').length === 7);
    const reloaded = await view();
    ok(isFiltered(reloaded), at + 'a reload lost the filter - ' + JSON.stringify(reloaded));
    await d.press('Источники');
    await d.press('Предметы');
    await waitIn(page, () => document.querySelectorAll('[data-row]').length === 12);
    const cleared = await view();
    ok(
      cleared.path === '/homebrew' && cleared.picks.length === 0,
      at + 'a tab press and back kept the filter - ' + JSON.stringify(cleared)
    );
  } finally {
    await ctx.close();
  }
}

/** 91. The list head of `#/homebrew` (docs/specs/FEATURES.md, "`#/homebrew` and its tabs"):
 *  up to 760 px the read-only heading, the picker row and «Ещё», the sheet and the one bar;
 *  from 761 px the head with the tab pills; the 300-item page. */
async function homebrewHeadAndBar() {
  const at = '91 (the homebrew head, tabs and bar): ';
  const sideways = (page) =>
    page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
  const opened = (page) =>
    waitIn(page, () => document.querySelectorAll('[data-row]').length > 0);
  for (const [width, height] of [
    [760, 800],
    [390, 844],
    [360, 640],
    [320, 568]
  ]) {
    const { ctx, page, d } = await fresh({ width, height });
    try {
      await d.open('#/homebrew', { as: 'gm3' });
      await opened(page);
      const m = await page.evaluate(() => {
        const h1 = document.querySelector('main h1, h1');
        const row = document.querySelector('.pickrow');
        const picker = row?.querySelector('.picker');
        const kids = row ? [...row.children] : [];
        const rects = kids.map((k) => k.getBoundingClientRect());
        return {
          h1: h1?.getBoundingClientRect().width ?? 99,
          pin: !!document.querySelector('main .homebtn'),
          name: picker?.getAttribute('aria-label') ?? '',
          inside: rects.every((r) => r.left >= 0 && r.right <= innerWidth),
          kids: kids.length,
          lines: new Set(rects.map((r) => Math.round(r.top + r.height / 2))).size,
          plus: !!row?.querySelector('.btn.primary svg')
        };
      });
      ok(m.h1 <= 1, at + width + ': the heading is drawn - ' + JSON.stringify(m));
      ok(!m.pin, at + width + ': the round pin is drawn');
      ok(m.name === 'Мои предметы: Предметы', at + width + ': the picker name - ' + m.name);
      ok(
        m.kids === 3 && m.inside,
        at + width + ': the row leaves the window - ' + JSON.stringify(m)
      );
      ok(m.lines === 1, at + width + ': the row takes ' + m.lines + ' lines');
      const face = await page.evaluate(pickerFace);
      ok(
        face.size && face.high <= 41,
        at + width + ': the picker face is not the tables - ' + JSON.stringify(face)
      );
      ok(m.plus, at + width + ': the primary draws no plus (rule 8)');
      ok(!(await sideways(page)), at + width + ': the page scrolls sideways');
    } finally {
      await ctx.close();
    }
  }

  for (const lang of ['ru', 'en']) {
    const { ctx, page, d } = await fresh({ width: 761, height: 768, lang });
    try {
      await d.open('#/homebrew', { as: 'gm1', lang });
      await opened(page);
      const m = await page.evaluate(() => ({
        tabs: [...document.querySelectorAll('.hbtabs .chip')].map((a) => a.offsetTop),
        current: document.querySelectorAll('.hbtabs [aria-current="page"]').length,
        broken: [...document.querySelectorAll('.hbtabs .chip')].some(
          (a) => a.scrollWidth > a.clientWidth
        )
      }));
      ok(
        m.tabs.length === 4 && m.current === 1,
        at + '761 ' + lang + ': the tab links - ' + JSON.stringify(m)
      );
      ok(!m.broken, at + '761 ' + lang + ': a tab is cut');
    } finally {
      await ctx.close();
    }
  }

  {
    const { ctx, page, d } = await fresh({ width: 1180, height: 720 });
    try {
      await d.open('#/homebrew', { as: 'gm3' });
      await opened(page);
      const m = await page.evaluate(() => {
        const h1 = document.querySelector('h1').getBoundingClientRect();
        const go = document.querySelector('.headnew .btn')?.getBoundingClientRect();
        return {
          same: !!go && go.top < h1.bottom && go.bottom > h1.top,
          plus: !!document.querySelector('.headnew svg')
        };
      });
      ok(
        m.same && m.plus,
        at + '1180: the primary is not on the heading line - ' + JSON.stringify(m)
      );
      for (const name of await d.tickNames().then((n) => n.slice(0, 2))) await d.tick(name);
      const bar = await page.evaluate(() => ({
        bars: document.querySelectorAll('.selbarwrap').length,
        strip: document.querySelectorAll('main .batch').length,
        acts: document.querySelectorAll('.selbarwrap .selacts .btn').length,
        menu: !!document.querySelector('.selbarwrap [aria-haspopup="menu"]:not(.seldrop *)')
      }));
      ok(bar.bars === 1 && bar.strip === 0, at + '1180: not one bar - ' + JSON.stringify(bar));
      ok(
        bar.acts >= 6 && !bar.menu,
        at + '1180: the bar does not hold the six actions - ' + JSON.stringify(bar)
      );
    } finally {
      await ctx.close();
    }
  }

  const { ctx, page, d } = await fresh({ width: 360, height: 640 });
  try {
    await d.open('#/homebrew', { as: 'gm3' });
    await opened(page);
    const MORE = '.pickrow [aria-haspopup="menu"]';
    await d.openMore(MORE);
    const items = await page.$$eval('#hb-more [role="menuitem"]', (e) => e.length);
    ok(items === 2, at + '«Ещё» holds ' + items + ' items');
    await page.keyboard.press('Escape');
    await d.settle();
    ok(!(await page.$('#hb-more')), at + 'Escape left the menu open');
    ok(
      await page.evaluate((m) => document.activeElement === document.querySelector(m), MORE),
      at + 'Escape did not return the focus to «Ещё»'
    );
    await d.openMore(MORE);
    await d.press('Импорт из файла');
    /* The panel's caption is uppercase, and `innerText` reads it so. */
    ok(
      await waitIn(page, () => /Импорт предметов из файла JSON/i.test(document.body.innerText)),
      at + 'the import did not open'
    );
    await d.press('Отмена').catch(() => {});

    await d.press('Мои предметы: Предметы');
    const sheet = await page.evaluate(() => ({
      tabs: document.querySelectorAll('dialog[open] .tab').length,
      limit: document.querySelector('dialog[open] .limit')?.textContent ?? ''
    }));
    ok(
      sheet.tabs === 4 && sheet.limit.includes('39'),
      at + 'the tabs sheet - ' + JSON.stringify(sheet)
    );
    await page.keyboard.press('Escape');
    await d.settle();

    for (const name of await d.tickNames().then((n) => n.slice(0, 2))) await d.tick(name);
    const bar = await page.evaluate(() => {
      const r = document.querySelector('.selbarwrap').getBoundingClientRect();
      const inside = [...document.querySelectorAll('.selbarwrap .selacts .btn')].every((b) => {
        const x = b.getBoundingClientRect();
        return x.left >= 0 && x.right <= 360;
      });
      return { h: r.height, inside, n: document.querySelectorAll('.selbarwrap').length };
    });
    ok(bar.n === 1 && bar.inside, at + 'the bar at 360 - ' + JSON.stringify(bar));
    ok(bar.h <= 150, at + 'the bar is ' + bar.h + ' px high');
    const BAR = '.selbarwrap [aria-haspopup="menu"]';
    await d.openMore(BAR);
    const menu = await page.evaluate(() => {
      const m = document.getElementById('hb-bulk');
      const r = m?.getBoundingClientRect();
      return {
        n: m?.querySelectorAll('[role="menuitem"]').length ?? 0,
        inside: !!r && r.top >= 0 && r.left >= 0 && r.right <= 360,
        up:
          !!r && r.bottom <= document.querySelector('.bulkmore').getBoundingClientRect().top + 1
      };
    });
    ok(
      menu.n === 4 && menu.inside && menu.up,
      at + "the bar's «Ещё» - " + JSON.stringify(menu)
    );
    await d.press('Переместить (2)');
    ok(!!(await page.$('dialog[open] #hb-move')), at + 'the move sheet did not open');
    await page.keyboard.press('Escape');
    await d.settle();
    ok(
      await page.evaluate((m) => document.activeElement === document.querySelector(m), BAR),
      at + 'the move sheet did not return the focus to «Ещё»'
    );
  } finally {
    await ctx.close();
  }

  {
    const { ctx, page, d } = await fresh({ width: 360, height: 640 });
    try {
      await d.open('#/homebrew', { as: 'gm1', items: 300 });
      await waitIn(page, () => document.querySelectorAll('[data-row]').length >= 300);
      ok(!(await sideways(page)), at + '300 items scroll the page sideways');
    } finally {
      await ctx.close();
    }
  }
}

/** 92. The editor (docs/specs/FEATURES.md, "The editor"): the three groups, no «?» and no star,
 *  the sticky bar and the preview sheet up to 760 px, the stored item's bar at 320 px, the
 *  pairs from 1000 px, the sticky column from 800 px, the long name, one message per field. */
async function editorLayoutAndSheet() {
  const at = '92 (the editor): ';
  for (const lang of ['ru', 'en']) {
    const w = (ru, en) => (lang === 'ru' ? ru : en);
    for (const [width, height] of [
      [360, 640],
      [1180, 720]
    ]) {
      for (const hash of ['#/homebrew/new', '#/homebrew/hb_emberaxeaaaaaaaa']) {
        const where = at + width + ' ' + lang + ' ' + hash + ': ';
        const { ctx, page, d } = await fresh({ width, height, lang });
        try {
          await d.open(hash, { as: 'gm1', lang });
          await waitIn(page, () => !!document.querySelector('#hb-name'));
          const m = await page.evaluate(() => ({
            heads: [...document.querySelectorAll('.grp h2')].map((h) => h.textContent.trim()),
            help: document.querySelectorAll('.hbform .helpbtn').length,
            star: document.querySelector('.hbform').textContent.includes('*'),
            cards: document.querySelectorAll('.preview .card').length
          }));
          ok(m.heads.length >= 2, where + 'the groups - ' + JSON.stringify(m));
          ok(m.heads[0] === w('Предмет', 'Item'), where + 'the first group - ' + m.heads[0]);
          ok(
            m.heads.at(-1) === w('Где лежит', 'Where it goes'),
            where + 'the last group - ' + m.heads.at(-1)
          );
          ok(m.help === 0 && !m.star, where + 'a «?» or a star - ' + JSON.stringify(m));
          if (width === 360) {
            const bar = await page.evaluate(() => {
              const el = document.querySelector('.ebar');
              const r = el.getBoundingClientRect();
              const kids = [...el.querySelectorAll('.btn')].map((b) =>
                b.getBoundingClientRect()
              );
              return {
                pos: getComputedStyle(el).position,
                bottom: Math.round(r.bottom),
                h: innerHeight,
                n: kids.length,
                inside: kids.every((k) => k.left >= 0 && k.right <= innerWidth)
              };
            });
            ok(
              bar.pos === 'sticky' && bar.bottom === bar.h && bar.inside,
              where + 'the bar - ' + JSON.stringify(bar)
            );
            ok(bar.n === (hash.endsWith('new') ? 2 : 3), where + 'the bar holds ' + bar.n);
            ok(m.cards === 0, where + 'a card behind the sheet');
            await d.press(w('Предпросмотр', 'Preview'));
            const inSheet = await page.$$eval('dialog[open] .card', (c) => c.length);
            ok(inSheet === 1, where + 'the sheet holds ' + inSheet + ' cards');
            await page.keyboard.press('Escape');
            await d.settle();
            ok(
              await page.evaluate(
                () => document.activeElement === document.querySelectorAll('.ebar .btn')[1]
              ),
              where + 'the sheet did not return the focus'
            );
          } else {
            ok(m.cards === 1, where + 'the column holds ' + m.cards + ' cards');
            const col = await page.evaluate(
              () => getComputedStyle(document.querySelector('.preview')).position
            );
            ok(col === 'sticky', where + 'the column is ' + col);
          }
        } finally {
          await ctx.close();
        }
      }
    }
  }

  /* The three buttons of a stored item at 320 in RU, the longest bar: inside the bar's own
     box, not only the window, and no word cut. */
  {
    const { ctx, page, d } = await fresh({ width: 320, height: 568 });
    try {
      await d.open('#/homebrew/hb_emberaxeaaaaaaaa', { as: 'gm1' });
      await waitIn(page, () => !!document.querySelector('#hb-name'));
      const bar = await page.evaluate(() => {
        const el = document.querySelector('.ebar');
        const r = el.getBoundingClientRect();
        const btns = [...el.querySelectorAll('.btn')];
        return {
          n: btns.length,
          inside: btns.every((b) => {
            const x = b.getBoundingClientRect();
            return x.left >= r.left && x.right <= r.right && x.right <= innerWidth;
          }),
          cut: btns.some((b) => b.scrollWidth > b.clientWidth),
          sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          rects: btns.map((b) => Math.round(b.getBoundingClientRect().right)),
          right: Math.round(r.right)
        };
      });
      ok(
        bar.n === 3 && bar.inside && !bar.cut && !bar.sideways,
        at + '320 ru: the bar of a stored item - ' + JSON.stringify(bar)
      );
    } finally {
      await ctx.close();
    }
  }

  const lines = (page) =>
    page.evaluate(() => {
      const h = document.querySelector('.ttl');
      return Math.round(
        h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight)
      );
    });
  for (const [width, most] of [
    [360, 1],
    [1180, 3]
  ]) {
    const { ctx, page, d } = await fresh({ width, height: 720 });
    try {
      await d.open('#/homebrew/hb_emberaxeaaaaaaaa', { as: 'gm1' });
      await waitIn(page, () => !!document.querySelector('#hb-name'));
      await page.$eval('#hb-name', (el) => {
        el.value = 'Очень длинное название предмета '.repeat(4).slice(0, 120);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await d.settle();
      const n = await lines(page);
      ok(n <= most, at + width + ': the title takes ' + n + ' lines');
    } finally {
      await ctx.close();
    }
  }

  {
    const { ctx, page, d } = await fresh({ width: 1180, height: 720 });
    try {
      await d.open('#/homebrew/hb_emberaxeaaaaaaaa', { as: 'gm1' });
      await waitIn(page, () => !!document.querySelector('#hb-name'));
      const m = await page.evaluate(() => {
        const top = (id) =>
          document.getElementById(id).closest('.fld').getBoundingClientRect().top;
        return Math.abs(top('hb-eqtier') - top('hb-cls'));
      });
      ok(m <= 2, at + 'the pair «Ранг» and «Класс» is ' + m + ' px apart');
    } finally {
      await ctx.close();
    }
  }

  {
    const { ctx, page, d } = await fresh({ width: 360, height: 640, lang: 'en' });
    try {
      await d.open('#/homebrew/new', { as: 'gm1', lang: 'en' });
      await waitIn(page, () => !!document.querySelector('#hb-name'));
      await d.press('Equipment');
      await d.press('Save');
      await waitIn(page, () => !!document.querySelector('.errs'));
      const m = await page.evaluate(() => {
        const texts = ['hb-cls', 'hb-tr', 'hb-rg', 'hb-dt', 'hb-bu'].map(
          (id) => document.getElementById(id + '-err')?.textContent.trim() ?? ''
        );
        const dmg = document.getElementById('hb-dmg-err');
        const lh = dmg ? parseFloat(getComputedStyle(dmg).lineHeight) || 18 : 18;
        return { texts, dmgLines: dmg ? Math.round(dmg.offsetHeight / lh) : 0 };
      });
      ok(
        new Set(m.texts).size === 5 && m.texts.every(Boolean),
        at + 'two fields share a message - ' + JSON.stringify(m)
      );
      ok(m.dmgLines <= 2, at + 'the damage message takes ' + m.dmgLines + ' lines at 360');
    } finally {
      await ctx.close();
    }
  }
}

/** The route families of DESIGN.md, "The First-Screen Rule": the inventory state that
 *  opens each. A row whose surface is not yet under the rule is measured and logged,
 *  not asserted (`shipped: false`); `shipped: 360` asserts at 360 px and logs at 1180 px and
 *  at the wide window of 1920x1080. `exception` is a named limit at 360 px, in px; `wideOnly`
 *  measures the row at 1180 px alone; `mid` adds 768x1024 and 900x720, the mid band. A roll page draws its result for the number
 *  field's first value, so no roll is made and the offset is deterministic. */
const FIRST_SCREEN = [
  { state: '#/roll/std', shipped: true, exception: 322 },
  { state: '#/roll/alt', shipped: true },
  { state: '#/roll/alt ~ crit', shipped: true },
  { state: '#/roll/voa', shipped: true },
  { state: '#/roll/wondrous', shipped: true },
  /* A whole-table roll with no picker, so the first screen is the roll controls. */
  { state: '#/roll/vh', shipped: true },
  { state: '#/tables/eq_weapon', shipped: true },
  { state: '#/tables/eq_weapon ~ two filters', shipped: true },
  { state: '#/i/ci1', shipped: true },
  { state: '#/h/00000000-0000-4000-8000-000000000513 as gm1', shipped: true },
  { state: '#/search ~ searched', shipped: true },
  /* Its enter presses a kind chip, which draws from 761 px only. */
  { state: '#/search ~ kind picked', shipped: true, wideOnly: true },
  { state: '#/account', shipped: true },
  { state: '#/account as gm1', shipped: true },
  { state: '#/p/set-emberaxe as gm2', shipped: true },
  { state: '#/homebrew as gm3', shipped: true },
  { state: '#/homebrew/sets ~ long name as gm4', shipped: true },
  { state: '#/homebrew/new as gm1', shipped: true },
  { state: '#/homebrew/hb_longsrcaaaaaaaaa as gm4', shipped: true },
  { state: '#/lists as gm1', shipped: true },
  { state: '#/lists ~ many lists as gm4', shipped: true },
  { state: '#/lists/00000000-0000-4000-8000-000000008001 as gm4', shipped: true, mid: true },
  {
    state: '#/lists/00000000-0000-4000-8000-000000008001 ~ many as gm4',
    shipped: true,
    mid: true
  },
  {
    state: '#/lists/00000000-0000-4000-8000-000000008001 ~ long name as gm4',
    shipped: true,
    mid: true
  },
  /* Up to 999 px the owner's list page draws the compact head (docs/specs/FEATURES.md, "Lists"). */
  { state: '#/lists/00000000-0000-4000-8000-000000000101 as gm1', shipped: true, mid: true },
  /* Its folded notices strip above the rows takes the strip's exception at 360 px. */
  {
    state: '#/lists/00000000-0000-4000-8000-000000000201 as gm2',
    shipped: true,
    mid: true,
    exception: 304
  },
  /* The thumb-size «Сохранить себе» (DESIGN.md, "The First-Screen Rule", 2026-11-06). */
  { state: '#/s/player-token-1', shipped: true, exception: 309 },
  /* From 761 px the 120-character name takes three lines (DESIGN.md, "The First-Screen Rule"). */
  {
    state: '#/s/player-token-1 ~ long name',
    shipped: true,
    exception: { 360: 309, 1180: 312 }
  },
  /* The folded requests strip above the rows (docs/specs/FEATURES.md, "Lists"). */
  {
    state: '#/lists/00000000-0000-4000-8000-000000000101 ~ requests as gm1',
    shipped: true,
    mid: true,
    exception: 304
  }
];

/** Returns the top of the first `[data-primary]` with a nonzero height, at scroll 0
 *  after the fonts and two frames, or null when the page marks none. */
async function primaryTop(page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    scrollTo(0, 0);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const el = [...document.querySelectorAll('[data-primary]')].find(
      (e) => e.getBoundingClientRect().height > 0
    );
    return el ? { top: el.getBoundingClientRect().top, vh: innerHeight } : null;
  });
}

/** 93. The search page from 320 to 1180 px (docs/specs/FEATURES.md, "Tables and search"): up
 *  to 760 px the `h1` with «Ещё» on one row, the search row on one line with «Фильтры» and
 *  «Выбрать»; from 761 px the page head, the kind chips and «Выбрать» last; the pin menu,
 *  the kind sheet, the selection mode and the 300 cap. */
async function searchHeadAndRows() {
  const at = '93 (the search page): ';
  const typed = async (d, page, q, lang = 'ru') => {
    await d.type(
      lang === 'en' ? 'Search by name or description...' : 'Поиск по названию или описанию...',
      q
    );
    return waitIn(page, () => document.querySelectorAll('[data-row]').length > 0);
  };
  const sideways = (page) =>
    page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
  for (const lang of ['ru', 'en']) {
    for (const [width, height] of [
      [760, 800],
      [390, 844],
      [360, 640],
      [320, 568]
    ]) {
      const where = width + ' ' + lang;
      const { ctx, page, d } = await fresh({ width, height, lang });
      try {
        await d.open('#/search', { lang });
        await typed(d, page, 'меч', lang);
        const m = await page.evaluate(() => {
          const h1 = document.querySelector('main h1');
          const row = h1?.closest('.headrow');
          const more = row?.querySelector('button[aria-haspopup="menu"]');
          const sr = document.querySelector('.searchrow');
          const kids = sr ? [...sr.children] : [];
          const rects = kids.map((k) => k.getBoundingClientRect());
          const box = sr?.querySelector('input[type="search"]')?.getBoundingClientRect();
          return {
            h1: (h1?.getBoundingClientRect().width ?? 0) > 1,
            more: !!more,
            kids: kids.length,
            inside: rects.every((r) => r.left >= 0 && r.right <= innerWidth),
            lines: new Set(rects.map((r) => Math.round(r.top + r.height / 2))).size,
            box: box?.width ?? 0,
            last: kids.at(-1)?.classList.contains('selmode') ?? false
          };
        });
        ok(m.h1 && m.more, at + where + ': the h1 row - ' + JSON.stringify(m));
        ok(
          m.kids === 3 && m.inside && m.lines === 1 && m.last,
          at + where + ': the search row - ' + JSON.stringify(m)
        );
        ok(m.box >= (width === 320 ? 112 : 140), at + where + ': the box is ' + m.box + ' px');
        ok(!(await sideways(page)), at + where + ': the page scrolls sideways');
        /* A picked kind lengthens «Фильтры» to «Фильтры · 1»: the row still holds one line
           inside the row, the box as wide as above. */
        await d.press(lang === 'en' ? 'Filters' : 'Фильтры');
        await d.click(lang === 'en' ? 'Equipment' : 'Снаряжение');
        await page.keyboard.press('Escape');
        await d.settle();
        const p = await page.evaluate(() => {
          const sr = document.querySelector('.searchrow');
          const rects = sr ? [...sr.children].map((k) => k.getBoundingClientRect()) : [];
          return {
            inside: rects.every(
              (r) => r.left >= 0 && r.right <= sr.getBoundingClientRect().right + 0.5
            ),
            lines: new Set(rects.map((r) => Math.round(r.top + r.height / 2))).size,
            box: sr?.querySelector('input[type="search"]')?.getBoundingClientRect().width ?? 0,
            count: !!document.querySelector('.count')
          };
        });
        ok(
          p.inside && p.lines === 1 && p.box >= (width === 320 ? 112 : 140) && p.count,
          at + where + ': the search row with a kind picked - ' + JSON.stringify(p)
        );
      } finally {
        await ctx.close();
      }
    }
    for (const [width, height] of [
      [761, 768],
      [1180, 720]
    ]) {
      const where = width + ' ' + lang;
      const { ctx, page, d } = await fresh({ width, height, lang });
      try {
        await d.open('#/search', { lang });
        await typed(d, page, 'меч', lang);
        const m = await page.evaluate(() => {
          const chips = [...document.querySelectorAll('.kindrow .chips .chip')];
          const tops = new Set(chips.map((c) => Math.round(c.getBoundingClientRect().top)));
          const sr = document.querySelector('.searchrow');
          return {
            head: !!document.querySelector('main .page-head h1'),
            pin: !!document.querySelector('main .page-head .homebtn'),
            chips: chips.length,
            rows: tops.size,
            filters: !!sr?.querySelector('.btn.sm'),
            last: sr?.lastElementChild?.classList.contains('selmode') ?? false
          };
        });
        ok(m.head && m.pin, at + where + ': the page head - ' + JSON.stringify(m));
        ok(
          m.chips === 4 && m.rows === 1,
          at + where + ': the kind chips - ' + JSON.stringify(m)
        );
        ok(!m.filters && m.last, at + where + ': the search row - ' + JSON.stringify(m));
        /* From 761 px the count line ends the kind row, so a pick adds no line. */
        await d.click(lang === 'en' ? 'Equipment' : 'Снаряжение');
        await d.settle();
        const c = await page.evaluate(() => {
          const row = document.querySelector('.kindrow')?.getBoundingClientRect();
          const count = document.querySelector('.kindhead > .count')?.getBoundingClientRect();
          return {
            count: !!count,
            oneLine:
              !!row &&
              !!count &&
              Math.abs(count.top + count.height / 2 - (row.top + row.height / 2)) < 2,
            inside: !!count && count.right <= document.documentElement.clientWidth
          };
        });
        ok(
          c.count && c.oneLine && c.inside,
          at + where + ': the count line at the end of the kind row - ' + JSON.stringify(c)
        );
      } finally {
        await ctx.close();
      }
    }
  }

  {
    const { ctx, page, d } = await fresh({ width: 360, height: 640 });
    try {
      await d.open('#/search', { as: 'gm1' });
      await d.press('Ещё');
      ok(
        await waitIn(page, () => !!document.querySelector('[role="menu"] [role="menuitem"]')),
        at + '360: «Ещё» opens no menu'
      );
      await page.keyboard.press('Escape');
      ok(
        await waitIn(page, () => document.activeElement?.textContent?.trim() === 'Ещё'),
        at + '360: Escape does not return the focus to «Ещё»'
      );
      await typed(d, page, 'меч');
      await d.press('Фильтры');
      const sheet = await page.evaluate(() => {
        const dlg = document.querySelector('dialog[open]');
        const rows = dlg ? [...dlg.querySelectorAll('.frow')] : [];
        return {
          own: rows[0]?.classList.contains('own') ?? false,
          kind: rows[1]?.querySelector('.lbl')?.textContent ?? ''
        };
      });
      ok(
        sheet.own && sheet.kind === 'Тип',
        at + '360: the sheet rows - ' + JSON.stringify(sheet)
      );
      await d.click('Снаряжение');
      await page.keyboard.press('Escape');
      ok(
        await waitIn(page, () => document.activeElement?.textContent?.trim() === 'Фильтры · 1'),
        at + '360: Escape does not return the focus to «Фильтры · 1»'
      );
      ok(
        (
          await page.evaluate(() => document.querySelector('main .count')?.textContent ?? '')
        ).includes('Снаряжение'),
        at + '360: the count line does not name the kind'
      );
    } finally {
      await ctx.close();
    }
  }

  {
    const { ctx, page, d } = await fresh({ width: 1180, height: 720 });
    try {
      await d.open('#/search');
      await typed(d, page, 'меч');
      await d.press('Выбрать');
      ok(
        await waitIn(page, () => !!document.activeElement?.closest('.selbarwrap .selall')),
        at + "1180: «Выбрать» does not focus the bar's «Все»"
      );
      await page.evaluate(() => document.activeElement.click());
      const drawn = await page.evaluate(() => ({
        rows: document.querySelectorAll('main [data-row]').length,
        ticked: document.querySelectorAll('main [data-row].sel').length,
        strip: !!document.querySelector('main .selall')
      }));
      ok(
        drawn.rows > 0 && drawn.rows === drawn.ticked && !drawn.strip,
        at + '1180: «Все» did not tick the found rows - ' + JSON.stringify(drawn)
      );
      await d.press('Снять выделение');
      ok(
        await waitIn(
          page,
          () => document.activeElement?.classList.contains('selmode') ?? false
        ),
        at + '1180: «Снять выделение» does not return the focus to «Выбрать»'
      );
      await d.type('Поиск по названию или описанию...', 'а');
      ok(
        await waitIn(page, () => document.querySelectorAll('main [data-row]').length === 300),
        at + 'the cap does not draw 300 rows'
      );
      ok(
        /^Показано 300 из \d+$/.test(
          await page.evaluate(
            () => document.querySelector('main .count')?.textContent?.trim() ?? ''
          )
        ),
        at + 'the count line does not say «Показано 300 из N»'
      );
    } finally {
      await ctx.close();
    }
  }
}

/** 94. The account holds its layout and its delete confirm (docs/specs/FEATURES.md,
 *  "Account"): one column at 360, two from 1000 px, the two print rows inside the window, the
 *  filled final button and the focus of the confirm. */
async function accountLayoutAndConfirm() {
  const at = '94 (the account layout and confirm): ';
  for (const lang of ['ru', 'en']) {
    for (const [width, height] of [
      [360, 640],
      [1180, 720]
    ]) {
      const where = width + ' ' + lang;
      const { ctx, page, d } = await fresh({ width, height, lang });
      try {
        await d.open('#/account', { as: 'gm1', lang });
        await waitIn(page, () => !!document.querySelector('.acc .ids li'));
        const m = await page.evaluate(() => {
          const segs = [...document.querySelectorAll('main .set .seg')]
            .filter((s) =>
              /^(Цвет печати|Размер карты|Print color|Card size)$/.test(
                s.getAttribute('aria-label') ?? ''
              )
            )
            .map((s) => s.getBoundingClientRect());
          const a = document.querySelector('.colA')?.getBoundingClientRect();
          const b = document.querySelector('.colB')?.getBoundingClientRect();
          return {
            chk: !!document.querySelector('main input[type="checkbox"]'),
            segs: segs.length,
            inside: segs.every((r) => r.left >= 0 && r.right <= innerWidth),
            heads: [...document.querySelectorAll('main h2')].map((h) => h.textContent),
            tops: a && b ? Math.abs(a.top - b.top) : 999,
            sideways:
              document.documentElement.scrollWidth > document.documentElement.clientWidth
          };
        });
        ok(!m.chk, at + where + ': a checkbox is drawn');
        ok(m.segs === 2 && m.inside, at + where + ': the print rows - ' + JSON.stringify(m));
        ok(
          !m.heads.some((h) => /Вы вошли как|Signed in as/.test(h)),
          at + where + ': a «Вы вошли как» panel is drawn'
        );
        if (width === 1180)
          ok(m.tops <= 2, at + where + ': the column tops differ by ' + m.tops);
        ok(!m.sideways, at + where + ': the page scrolls sideways');

        const open = lang === 'en' ? 'Delete account...' : 'Удалить аккаунт...';
        const word = lang === 'en' ? 'delete' : 'удалить';
        const final = lang === 'en' ? 'Delete for good' : 'Удалить навсегда';
        await d.press(open);
        ok(
          await waitIn(page, () => document.activeElement?.id === 'account-delete-word'),
          at + where + ': the field does not take the focus'
        );
        const c = await page.evaluate((f) => {
          const btn = [...document.querySelectorAll('button')].find(
            (b) => b.textContent.trim() === f
          );
          return {
            goes: !!document.querySelector('p.goes'),
            disabled: btn?.disabled ?? false,
            fill: btn ? getComputedStyle(btn).backgroundColor : ''
          };
        }, final);
        ok(
          c.goes && c.disabled && c.fill !== 'rgba(0, 0, 0, 0)' && c.fill !== '',
          at + where + ': the confirm - ' + JSON.stringify(c)
        );
        await d.type('', word);
        ok(
          await waitIn(
            page,
            (f) =>
              [...document.querySelectorAll('button')].some(
                (b) => b.textContent.trim() === f && !b.disabled
              ),
            final
          ),
          at + where + ': the typed word does not enable the final button'
        );
        await d.press(lang === 'en' ? 'Cancel' : 'Отмена');
        ok(
          await waitIn(page, (o) => document.activeElement?.textContent?.trim() === o, open),
          at + where + ': «Отмена» does not return the focus to the opener'
        );
      } finally {
        await ctx.close();
      }
    }
  }
}

/** 83. The primary content of each route family starts within 40% of the viewport
 *  height at 360x640 and 1180x720, in Russian and in English (DESIGN.md, "The
 *  First-Screen Rule"). */
async function primaryContentInFirstScreen() {
  const states = new Map(STATES.map((s) => [s.id, s]));
  for (const row of FIRST_SCREEN) {
    const state = states.get(row.state);
    ok(!!state, '83 (first screen): no inventory state ' + row.state);
    if (!state) continue;
    const sizes = [
      [360, 640],
      [1180, 720],
      ...(row.shipped === 360 ? [[1920, 1080]] : []),
      ...(row.mid
        ? [
            [768, 1024],
            [900, 720]
          ]
        : [])
    ];
    for (const [width, height] of sizes) {
      if (row.wideOnly && width < 761) continue;
      const asserted = row.shipped === true || row.shipped === width;
      for (const lang of ['ru', 'en']) {
        const { ctx, page, d } = await fresh({ width, height, storage: state.storage });
        try {
          await d.open(state.route, {
            as: state.as,
            items: state.items,
            sections: state.sections,
            sources: state.sources,
            hold: state.hold
          });
          if (state.enter) await state.enter(d);
          await d.settled(state.id);
          if (lang === 'en') await d.click('EN');
          await d.addressSettled();
          const got = await primaryTop(page);
          const where = row.state + ' ' + width + 'x' + height + ' ' + lang;
          ok(!!got, '83 (first screen): ' + where + ' marks no [data-primary] with a height');
          if (!got) continue;
          /* A number is the 360 px exception; an object names one per width. */
          const exception =
            typeof row.exception === 'object'
              ? row.exception[width]
              : width === 360
                ? row.exception
                : undefined;
          const limit = exception ?? 0.4 * got.vh;
          const pass = got.top <= limit;
          fs.writeSync(
            1,
            '  first screen: ' +
              where +
              ' top ' +
              got.top.toFixed(0) +
              ' / ' +
              limit.toFixed(0) +
              (exception ? ' (exception)' : '') +
              (pass ? ' pass' : ' over') +
              (asserted ? '' : ' (logged)') +
              '\n'
          );
          if (asserted) ok(pass, '83 (first screen): ' + where + ' starts at ' + got.top);
        } finally {
          await ctx.close();
        }
      }
    }
  }
}

/** Returns the header's top and bottom edges in the window. */
function headerEdges(page) {
  return page.evaluate(() => {
    const r = document.querySelector('.topbar').getBoundingClientRect();
    return { top: r.top, bottom: r.bottom };
  });
}

/** 86. Up to 760 px the header leaves on a scroll down and returns on a scroll up, and each
 *  guard of DESIGN.md, "The Hidden Header Rule", holds; from 761 px it stays. Geometry only:
 *  the suite forces reduced motion, so the one timing read relaxes it and restores it. */
async function headerHidesAndReturns() {
  const at = '86 (the hidden header): ';
  const { ctx, page, d } = await fresh({ width: 360, height: 640 });
  const hiddenNow = async (what) => {
    const e = await headerEdges(page);
    ok(
      e.bottom <= 0,
      at + what + ': the header is not out of the window, ' + JSON.stringify(e)
    );
  };
  const shownNow = async (what) => {
    const e = await headerEdges(page);
    ok(e.top === 0, at + what + ': the header is not at the top, ' + JSON.stringify(e));
  };
  const by = async (dy) => {
    await page.evaluate((n) => {
      window.scrollBy(0, n);
    }, dy);
    await d.settle();
  };
  const home = async () => {
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await d.settle();
  };
  const primary = () =>
    page.evaluate(() => document.querySelector('[data-primary]').getBoundingClientRect().top);
  const height = () => page.evaluate(() => document.documentElement.scrollHeight);

  await d.open('#/tables/eq_weapon');
  const firstPrimary = await primary();

  await d.scrollPage(800);
  await hiddenNow('a scroll down');
  const tall = await height();
  await by(-20);
  await shownNow('a scroll up');
  ok((await height()) === tall, at + 'the page height moved with the header');

  await by(40);
  await hiddenNow('a scroll down again');
  await by(-5);
  await hiddenNow('5 px up, inside the dead zone');

  await home();
  await shownNow('scroll 0');
  ok((await primary()) === firstPrimary, at + 'the primary content moved at scroll 0');

  await d.scrollPage(800);
  await hiddenNow('before the focus');
  await page.focus('.topbar .seg button');
  await shownNow('a focus in the header');
  const hit = await page.evaluate(() => {
    const b = document.querySelector('.topbar .seg button');
    const r = b.getBoundingClientRect();
    return b.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
  });
  ok(hit, at + 'the focused header control is not hit at its center');
  await page.evaluate(() => {
    document.activeElement.blur();
  });

  await home();
  await page.click('nav.tabs a[data-job="tables"]');
  await d.settle();
  await d.scrollPage(800);
  await hiddenNow('a scroll down after a click on a job link');

  await page.focus('main input[type="search"]');
  for (let i = 0; i < 12; i += 1) {
    if (await page.evaluate(() => !!document.activeElement?.closest('.topbar'))) break;
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
  }
  ok(
    await page.evaluate(() => !!document.activeElement?.closest('.topbar')),
    at + 'Shift+Tab did not reach the header'
  );
  await shownNow('a Shift+Tab into the header');
  await page.evaluate(() => {
    document.activeElement.blur();
  });

  await home();
  await page.focus('main input[type="search"]');
  await d.scrollPage(800);
  await shownNow('a scroll with a text field in focus');
  await page.evaluate(() => {
    document.activeElement.blur();
  });
  await by(100);
  await hiddenNow('a scroll down after the blur');

  await home();
  await d.click('Ещё');
  await d.scrollPage(800);
  await shownNow('a scroll behind an open menu');
  await page.keyboard.press('Escape');
  await d.settle();

  await home();
  await d.click('Фильтры');
  await d.scrollPage(800);
  await shownNow('a scroll behind the filter sheet');
  await d.click('Закрыть');
  await d.scrollPage(1000);
  await hiddenNow('a scroll down after the sheet');

  await home();
  await page.evaluate(() => {
    document.querySelector('[data-row] button').click();
  });
  await waitIn(page, () => !!document.querySelector('dialog[open]'));
  await d.scrollPage(800);
  await shownNow('a scroll behind the record dialog');
  await page.keyboard.press('Escape');
  await d.settle();
  await d.scrollPage(1000);
  await hiddenNow('a scroll down after the dialog');

  await d.go('#/roll/std');
  await shownNow('a navigation');
  await page.goBack();
  await d.settle();
  await new Promise((r) => setTimeout(r, 200));
  await shownNow('Back');
  await page.goForward();
  await d.settle();
  await new Promise((r) => setTimeout(r, 200));
  await shownNow('Forward');
  await page.reload();
  await d.settle();
  await new Promise((r) => setTimeout(r, 200));
  await shownNow('a reload');
  await d.go('#/tables/eq_weapon');

  await d.scrollPage(1500);
  await by(100);
  await hiddenNow('before the anchor');
  await d.go('#/tables/vault_of_ages/tA');
  await waitIn(page, () => document.getElementById('sec-tA') !== null);
  await new Promise((r) => setTimeout(r, 300));
  await shownNow('a linked section');
  const landed = await page.evaluate(() => {
    const sec = document.getElementById('sec-tA').getBoundingClientRect().top;
    return { sec, header: document.querySelector('.topbar').getBoundingClientRect().bottom };
  });
  ok(
    landed.sec >= landed.header - 1 && landed.sec <= landed.header + 40,
    at + 'the section is not within 40 px under the header, ' + JSON.stringify(landed)
  );

  await d.go('#/i/nope');
  await d.scrollPage(10000);
  await shownNow('a short page');

  await d.go('#/tables/eq_weapon');
  await d.scrollPage(800);
  await by(100);
  await hiddenNow('before the print');
  const before = await headerEdges(page);
  await d.media('print');
  const shown = await d.computed('.topbar', ['display']);
  ok(shown?.display === 'none', at + 'the header prints: ' + JSON.stringify(shown));
  await d.media(undefined);
  await d.settle();
  const after = await headerEdges(page);
  ok(
    after.top === before.top && after.bottom === before.bottom,
    at + 'the header moved across a print: ' + JSON.stringify({ before, after })
  );

  await home();
  /* A loaded runner can draw the scroll to 0 after `settle()`. Motion that comes on before
     the header is back slides it in; that slide's end then answers the wait below, and the
     read lands 4 frames into the slide out (top -54.3, measured on CI 2026-11-05). */
  ok(
    await waitIn(page, () => {
      const bar = document.querySelector('.topbar');
      return !bar.classList.contains('away') && bar.getBoundingClientRect().top === 0;
    }),
    at + 'the header did not return at scroll 0'
  );
  const declared = () => d.computed('.topbar', ['transition-duration', 'transition-property']);
  try {
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'no-preference' }
    ]);
    const motion = await declared();
    ok(
      motion?.['transition-duration'] === '0.2s' &&
        motion['transition-property'] === 'transform',
      at + 'the slide is not declared: ' + JSON.stringify(motion)
    );
    const ended = page.evaluate(
      () =>
        new Promise((done) => {
          /* A link's or a button's own `transition: all` (a hover that the slide moves)
             bubbles a `transitionend` too, which can arrive while the header is mid-way. */
          const bar = document.querySelector('.topbar');
          bar.addEventListener('transitionend', (e) => {
            const away = bar.classList.contains('away');
            if (e.target === bar && e.propertyName === 'transform' && away) done(true);
          });
          setTimeout(() => done(false), 3000);
        })
    );
    await d.scrollPage(800);
    ok(await ended, at + 'the slide did not end');
    await hiddenNow('after the slide');
  } finally {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  }
  const still = await declared();
  ok(
    still?.['transition-duration'] === '0s',
    at + 'reduced motion keeps a slide: ' + JSON.stringify(still)
  );
  await ctx.close();

  const wide = await fresh({ width: 1180, height: 720 });
  await wide.d.open('#/tables/eq_weapon');
  await wide.d.scrollPage(800);
  const edges = await headerEdges(wide.page);
  ok(edges.top === 0, at + 'the header moved at 1180: ' + JSON.stringify(edges));
  ok((await wide.d.count('.topbar.away')) === 0, at + 'the header is marked away at 1180');
  await wide.ctx.close();
}

/** 87. A backward Tab never lands under the header (WCAG 2.4.11): 30 stops up from row 120,
 *  and the page's scroll padding is the header's measured height at each width. */
async function backwardTabClearsTheHeader() {
  const at = '87 (backward Tab): ';
  for (const [width, height] of [
    [360, 640],
    [1180, 720]
  ]) {
    const { ctx, page, d } = await fresh({ width, height });
    await d.open('#/tables/eq_weapon');
    await page.evaluate(() => {
      document.querySelectorAll('[data-row]')[119].querySelector('button').focus();
    });
    await d.settle();
    let covered = 0;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.down('Shift');
      await page.keyboard.press('Tab');
      await page.keyboard.up('Shift');
      await new Promise((r) => setTimeout(r, 40));
      const stop = await page.evaluate(() => {
        const el = document.activeElement;
        const r = el.getBoundingClientRect();
        const head = document.querySelector('.topbar').getBoundingClientRect();
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return {
          name: el.tagName + ' ' + (el.textContent ?? '').trim().slice(0, 30),
          top: r.top,
          headBottom: head.bottom,
          inside: el.contains(hit)
        };
      });
      if (stop.top < stop.headBottom - 1 || !stop.inside) {
        covered++;
        fs.writeSync(1, '  covered stop: ' + JSON.stringify(stop) + '\n');
      }
    }
    fs.writeSync(1, '  backward Tab at ' + width + ': ' + covered + ' of 30 covered\n');
    ok(covered === 0, at + covered + ' of 30 stops covered at ' + width);
    await ctx.close();
  }
  for (const [width, lang] of [
    [320, 'en'],
    [360, 'ru'],
    [768, 'ru'],
    [1180, 'ru']
  ]) {
    const { ctx, page, d } = await fresh({ width, height: 640, lang });
    await d.open('#/tables/eq_weapon');
    await d.settle();
    const m = await page.evaluate(() => ({
      padding: getComputedStyle(document.documentElement).scrollPaddingTop,
      header: document.querySelector('.topbar').offsetHeight
    }));
    fs.writeSync(1, '  header at ' + width + ' ' + lang + ': ' + m.header + ' px\n');
    ok(
      m.padding === m.header + 'px',
      at + 'the scroll padding at ' + width + ': ' + JSON.stringify(m)
    );
    await ctx.close();
  }
}

/** Returns the window's box for `inside`. */
const viewBox = (page) => page.evaluate(() => ({ x: 0, y: 0, w: innerWidth, h: innerHeight }));

/** Answers the face of the page's picker (`PickerButton`): the table picker's size (`--t-small`)
 *  and its height, the one face on the roll pages, the tables and «Мои предметы». Runs in the
 *  page. */
function pickerFace() {
  const picker = document.querySelector('main .picker');
  if (!picker) return { size: false, high: 0 };
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;visibility:hidden;font-size:var(--t-small)';
  document.body.append(probe);
  const small = getComputedStyle(probe).fontSize;
  probe.remove();
  return {
    size: getComputedStyle(picker).fontSize === small,
    high: Math.round(picker.getBoundingClientRect().height)
  };
}

/** Answers the words of the result's name that a line break cuts. */
const brokenWords = (page) =>
  page.evaluate(() => {
    const name = document.querySelector('.card-name a');
    return name.textContent
      .trim()
      .split(/\s+/)
      .filter((word) => {
        const range = document.createRange();
        const node = name.firstChild;
        const from = node.textContent.indexOf(word);
        range.setStart(node, from);
        range.setEnd(node, from + word.length);
        return range.getClientRects().length > 1;
      });
  });

/** Draws the longest record name of the picker's `parts` on the result card, by stepping the
 *  number field through each part; answers the name. */
async function showLongestTitle(page, d, parts) {
  await page.click('.reshead > .btn');
  await page.waitForSelector('.numbox input');
  let best = { name: '' };
  for (const part of parts) {
    await d.choose('.pick select', part);
    const top = await page.evaluate(async () => {
      const up = document.querySelectorAll('.numbox button')[1];
      const found = { name: '', n: 1 };
      for (let n = 1; ; n++) {
        const name = document.querySelector('.card-name a').textContent.trim();
        if (name.length > found.name.length) Object.assign(found, { name, n });
        if (up.disabled) return found;
        up.click();
        await new Promise(requestAnimationFrame);
      }
    });
    if (top.name.length > best.name.length) best = { ...top, part };
  }
  await d.choose('.pick select', best.part);
  await page.$eval('.numbox input', (field) => {
    field.focus();
    field.select();
  });
  await page.keyboard.type(String(best.n));
  await page.keyboard.press('Tab');
  await d.settle();
  return best.name;
}

/** 89. The twelve roll pages share one layout (docs/specs/FEATURES.md, "Rolling"): at 761 px the
 *  heading, the pin and the help share one line; up to 760 px the heading is read, not drawn,
 *  the picker row (the mode picker, «Ещё») comes first and the results line holds «Бросок N»
 *  and «Настроить»; «Ещё» holds the pin and the help; the dice are
 *  two rows at 360; the card is the tall face from a 641 px results column; a picker never
 *  cuts the roll button; the longest title of «Проклятые предметы» and of Many Worlds Tavern breaks no word. */
async function rollPageLayout() {
  const at = '89 (the roll page layout): ';
  for (const lang of ['ru', 'en']) {
    const wide = await fresh({ width: 761, height: 768, lang });
    for (const route of ['#/roll/alt', '#/roll/std', '#/roll/vault_of_ages']) {
      await wide.d.open(route, { lang });
      const head = await wide.page.evaluate(() => {
        const top = (s) => document.querySelector('main ' + s)?.getBoundingClientRect().top;
        const mid = (s) => {
          const r = document.querySelector('main ' + s)?.getBoundingClientRect();
          return r ? r.top + r.height / 2 : null;
        };
        return {
          h1: mid('h1'),
          pin: mid('.homebtn'),
          help: mid('.helpbtn'),
          tops: [top('h1'), top('.homebtn'), top('.helpbtn')],
          wide: document.documentElement.scrollWidth <= document.documentElement.clientWidth
        };
      });
      const where = route + ' ' + lang + ' 761: ';
      ok(
        Math.abs(head.h1 - head.pin) <= 8 && Math.abs(head.h1 - head.help) <= 8,
        at + where + 'the head is not one line - ' + JSON.stringify(head)
      );
      ok(head.wide, at + where + 'the page scrolls sideways');
    }
    await wide.ctx.close();

    for (const [width, height] of [
      [760, 800],
      [390, 844],
      [360, 640],
      [320, 568]
    ]) {
      const { ctx, page, d } = await fresh({ width, height, lang });
      for (const route of ['#/roll/alt', '#/roll/std', '#/roll/vault_of_ages']) {
        const where = route + ' ' + lang + ' ' + width + ': ';
        await d.open(route, { lang });
        const line = await page.evaluate(() => {
          const parts = [...document.querySelectorAll('.reshead h2, .reshead > .btn')].map(
            (e) => e.getBoundingClientRect()
          );
          return {
            h1: document.querySelector('main h1').getBoundingClientRect().width,
            round: document.querySelectorAll('main .homebtn, main .helpbtn').length,
            count: parts.length,
            lines: new Set(parts.map((r) => Math.round(r.top + r.height / 2))).size,
            out: parts.filter((r) => r.left < 0 || r.right > innerWidth).length,
            sideways:
              document.documentElement.scrollWidth > document.documentElement.clientWidth
          };
        });
        ok(line.h1 <= 1, at + where + 'the h1 is drawn, ' + line.h1 + ' px wide');
        ok(line.round === 0, at + where + 'the head buttons are drawn');
        ok(line.count === 2, at + where + 'the results line holds ' + line.count + ' parts');
        ok(!line.out, at + where + 'a part of the results line leaves the window');
        ok(line.lines === 1, at + where + 'the results line takes ' + line.lines + ' lines');
        ok(!line.sideways, at + where + 'the page scrolls sideways');
      }

      /* The picker row: the picker first, «Ещё» last, 8 px under the header's place, the
         longest names on two lines with no word cut, «Ещё» holding still across modes. */
      const moreRights = [];
      for (const route of ['#/roll/alt', '#/roll/std', '#/roll/vault_of_ages', '#/roll/vh']) {
        const where = route + ' ' + lang + ' ' + width + ': ';
        await d.open(route, { lang });
        const pick = await page.evaluate(() => {
          const main = document.querySelector('main');
          const row = main.querySelector(':scope > .pickrow');
          const nav = row?.querySelector(':scope > nav.modes');
          const btn = nav?.querySelector('button.picker');
          const text = btn?.querySelector('.picker-t');
          const more = row?.lastElementChild?.querySelector('.btn');
          /* Svelte leaves an empty text node first, so take the first node that holds text. */
          const walker = text && document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
          let node = null;
          while (walker?.nextNode()) {
            if (walker.currentNode.textContent.trim()) {
              node = walker.currentNode;
              break;
            }
          }
          const cut = (text?.textContent.trim().split(/\s+/) ?? []).filter((word) => {
            const from = node ? node.textContent.indexOf(word) : -1;
            if (from < 0) return true;
            const range = document.createRange();
            range.setStart(node, from);
            range.setEnd(node, from + word.length);
            return range.getClientRects().length > 1;
          });
          const r = (e) => e.getBoundingClientRect();
          return {
            row: !!row,
            first: row?.firstElementChild === nav,
            modes: document.querySelectorAll('nav.modes').length,
            more: more?.getAttribute('aria-haspopup') === 'menu',
            gap: row ? Math.round(r(row).top - r(main).top) : -1,
            high: btn ? Math.round(r(btn).height) : 0,
            clamped: text ? text.scrollHeight > text.clientHeight + 1 : true,
            cut,
            inside: btn && more ? r(btn).left >= 0 && r(more).right <= innerWidth : false,
            moreRight: more ? Math.round(r(more).right) : 0
          };
        });
        ok(
          pick.row && pick.first && pick.modes === 1,
          at + where + 'the picker row - ' + JSON.stringify(pick)
        );
        ok(pick.more, at + where + 'the row does not end with «Ещё»');
        ok(
          pick.gap === 8,
          at + where + 'the row is ' + pick.gap + ' px under the header, not 8'
        );
        ok(pick.high <= 41, at + where + 'the picker is ' + pick.high + ' px tall');
        ok(!pick.clamped, at + where + 'the picker name takes more than two lines');
        ok(!pick.cut.length, at + where + 'the picker name breaks a word: ' + pick.cut);
        ok(pick.inside, at + where + 'the row leaves the window');
        const face = await page.evaluate(pickerFace);
        ok(
          face.size && face.high <= 41,
          at + where + 'the picker face is not the tables - ' + JSON.stringify(face)
        );
        moreRights.push(pick.moreRight);
      }
      ok(
        new Set(moreRights).size === 1,
        at + lang + ' ' + width + ': «Ещё» moves between modes - ' + moreRights
      );

      /* A narrowed row lights «Настроить · 2»: the results line stays one line. */
      if (lang === 'ru' && (width === 360 || width === 320)) {
        await d.open('#/roll/std', { lang });
        await d.click('Настроить');
        await d.click('Расходники');
        await d.click('Hope & Fear');
        await d.click('Настроить');
        const lit = await page.evaluate(() => {
          const parts = [...document.querySelectorAll('.reshead h2, .reshead > .btn')].map(
            (e) => e.getBoundingClientRect()
          );
          return {
            text: document.querySelector('.reshead > .btn')?.textContent.trim(),
            lines: new Set(parts.map((r) => Math.round(r.top + r.height / 2))).size
          };
        });
        ok(
          lit.lines === 1 && /·/.test(lit.text ?? ''),
          at + width + ': the lit «Настроить» line - ' + JSON.stringify(lit)
        );
      }

      /* The mode sheet: the picker opens twelve links, Escape returns the focus. */
      if (width === 360) {
        await d.open('#/roll/vault_of_ages', { lang });
        await d.click(
          lang === 'en' ? 'Roll mode: Vault of Ages' : 'Режим броска: Vault of Ages'
        );
        const sheet = await page.evaluate(() => {
          const dlg = document.querySelector('dialog[open]');
          return {
            title: dlg?.querySelector('h2')?.textContent.trim(),
            links: dlg ? dlg.querySelectorAll('a').length : 0,
            current: dlg?.querySelector('a[aria-current="page"]')?.getAttribute('href')
          };
        });
        ok(
          sheet.title === (lang === 'en' ? 'Roll' : 'Бросок') &&
            sheet.links === 12 &&
            sheet.current === (lang === 'en' ? '/en' : '') + '/roll/vault_of_ages',
          at + lang + ': the mode sheet - ' + JSON.stringify(sheet)
        );
        await page.keyboard.press('Escape');
        ok(
          await waitIn(
            page,
            () =>
              !document.querySelector('dialog[open]') &&
              document.activeElement === document.querySelector('nav.modes button.picker')
          ),
          at + lang + ': Escape did not close the mode sheet onto the picker'
        );
      }

      if (width === 360) {
        await d.open('#/roll/alt', { lang });
        await d.openMore();
        const items = await page.$$eval('[role="menuitem"]', (els) => els.length);
        ok(items === 3, at + lang + ': «Ещё» on /roll/alt holds ' + items + ' items');
        await page.keyboard.press('Escape');
        ok(
          await waitIn(
            page,
            () =>
              !document.querySelector('[role="menu"]') &&
              document.activeElement === document.querySelector('.pickrow .morewrap > .btn')
          ),
          at + lang + ': Escape did not close «Ещё» onto its button'
        );
        await d.openMore();
        await page.click('[role="menuitem"]:last-of-type');
        ok(
          await waitIn(
            page,
            () =>
              !document.querySelector('[role="menu"]') &&
              document.activeElement === document.querySelector('.pickrow .morewrap > .btn') &&
              !!document.querySelector('.helpbox')
          ),
          at + lang + ': the help item did not open the box and return the focus'
        );
      }

      if (width === 360 || width === 320) {
        await d.open('#/roll/std', { lang });
        const dice = await page.$$eval('.dicebar button', (els) =>
          els.map((e) => {
            const r = e.getBoundingClientRect();
            const c = e.querySelector('small');
            return {
              top: r.top,
              left: r.left,
              right: r.right,
              h: r.height,
              cut: c.scrollWidth > c.clientWidth
            };
          })
        );
        ok(dice[3].top > dice[0].top, at + lang + ' ' + width + ': the dice are one row');
        ok(
          dice[2].top === dice[0].top,
          at + lang + ' ' + width + ': the first row is not three'
        );
        ok(
          dice[4].top === dice[3].top,
          at + lang + ' ' + width + ': the second row is not two'
        );
        for (const die of dice) {
          ok(die.h >= 44, at + lang + ' ' + width + ': a die is ' + die.h + ' px tall');
          ok(
            die.left >= 0 && die.right <= width && !die.cut,
            at + lang + ' ' + width + ': a die leaves the window or cuts its caption'
          );
        }

        for (const route of ['#/roll/many_worlds_tavern', '#/roll/vault_of_ages']) {
          await d.open(route, { lang });
          const longest = await page.$eval(
            '.pick select',
            (s) =>
              [...s.options]
                .map((o) => o.textContent.trim())
                .sort((a, b) => b.length - a.length)[0]
          );
          await d.part(longest);
          const row = await page.evaluate(() => {
            const r = (s) => document.querySelector(s).getBoundingClientRect();
            const btn = document.querySelector('.rp-ctrl .btn.primary');
            return {
              pick: r('.pick').bottom,
              roll: btn.getBoundingClientRect().right,
              cut: btn.scrollWidth > btn.clientWidth,
              line: r('.reshead').bottom
            };
          });
          const where = route + ' ' + lang + ' ' + width + ' «' + longest + '»: ';
          ok(row.roll <= width && !row.cut, at + where + 'the roll button is cut');
          ok(
            width !== 360 || row.line <= 256,
            at + where + 'the results line ends at ' + row.line
          );

          const parts =
            route === '#/roll/vault_of_ages'
              ? ['C']
              : await page.$eval('.pick select', (s) => [...s.options].map((o) => o.value));
          const title = await showLongestTitle(page, d, parts);
          const broken = await brokenWords(page);
          ok(
            !broken.length,
            at + route + ' ' + lang + ' ' + width + ' «' + title + '»: a word breaks: ' + broken
          );
        }
      }
      await ctx.close();
    }
  }

  const flip = await fresh({ width: 600, height: 800 });
  await flip.d.open('#/roll/wondrous');
  const read = () =>
    flip.page.evaluate(() => {
      const media = document.querySelector('.card.face .card-media').getBoundingClientRect();
      const card = document.querySelector('.card.face').getBoundingClientRect();
      const badge = document.querySelector('.card.face .badge.num');
      const b = badge.getBoundingClientRect();
      return {
        w: media.width,
        h: media.height,
        card: card.width,
        shown: getComputedStyle(badge).display !== 'none',
        over:
          b.top >= media.top && b.right <= media.right && b.left > media.left + media.width / 2
      };
    });
  /* The card is the tall face from a 641 px results column, which a 720 px window gives with
     the scrollbar's gutter; 640 and 600 px draw the row face. */
  for (const w of [600, 640]) {
    await flip.d.viewport(w, 800);
    await flip.d.settle();
    const phone = await read();
    ok(phone.w === 96, at + 'the picture is ' + phone.w + ' px at ' + w);
    ok(!phone.shown, at + 'the number badge is drawn at ' + w);
  }
  await flip.d.viewport(720, 800);
  await flip.d.settle();
  const face = await read();
  ok(Math.abs(face.w - face.card) <= 2, at + 'the picture does not fill the card at 720');
  ok(Math.abs(face.w / face.h - 4 / 3) < 0.02, at + 'the picture is not 4:3 at 720');
  ok(
    face.shown && face.over,
    at + 'the badge is not over the picture - ' + JSON.stringify(face)
  );
  await flip.ctx.close();
}

/** 90. A result's row at 360x640 and 1180x720: three labeled controls inside the card's width;
 *  its «Ещё» holds the copies inside the window and a copy returns the focus to it; the
 *  add-to-list menu stays in the window, under the header (near the page top it opens down,
 *  since no scroll uncovers a menu above the page top), and with 150 lists scrolls with
 *  «+ Новый список» in view; the dialog over the result opens its own add menu
 *  (docs/specs/FEATURES.md, "Records"). */
async function resultRowAndMenus() {
  const at = '90 (the result row): ';
  for (const [width, height] of [
    [360, 640],
    [1180, 720]
  ]) {
    const { ctx, page, d } = await fresh({ width, height });
    const where = at + width + ': ';
    await d.open('#/roll/std', { as: 'gm4' });
    const row = await page.evaluate(() => {
      const card = document.querySelector('.card.face').getBoundingClientRect();
      const row = document.querySelector('.resacts');
      const controls = [...row.querySelectorAll('.btn')];
      return {
        names: controls.filter((c) => c.textContent.trim().length > 0).length,
        count: controls.length,
        out: controls.filter((c) => {
          const r = c.getBoundingClientRect();
          return r.left < card.left - 1 || r.right > card.right + 1;
        }).length,
        below: row.getBoundingClientRect().top >= card.bottom
      };
    });
    ok(row.count === 3 && row.names === 3, where + 'the row is not three labeled controls');
    ok(!row.out, where + 'a control leaves the card width');
    ok(row.below, where + 'the row is not under the plate');

    await page.evaluate(() => {
      document.querySelector('.resacts').scrollIntoView({ block: 'center' });
    });
    await d.openCardMore();
    const menu = await page.evaluate(() => {
      const m = document.querySelector('.resacts [role="menu"]').getBoundingClientRect();
      return { x: m.x, y: m.y, w: m.width, h: m.height };
    });
    ok(inside(menu, await viewBox(page)), where + 'the menu leaves the window');
    await d.press('Скопировать название');
    ok(
      await waitIn(
        page,
        () =>
          !document.querySelector('[role="menu"]') &&
          document.activeElement === document.querySelector('.resacts .morewrap > .btn')
      ),
      where + 'a copy did not return the focus to «Ещё»'
    );

    await d.accountLists(
      Array.from({ length: 150 }, (_, i) => ({ n: i + 1, name: 'Список ' + i, ids: ['ci1'] }))
    );
    await page.evaluate(() => {
      document.querySelector('.resacts').scrollIntoView({ block: 'center' });
    });
    /* `pop` runs only with motion on, and its offset is what the menu's scroll margin answers. */
    let add;
    try {
      await page.emulateMediaFeatures([
        { name: 'prefers-reduced-motion', value: 'no-preference' }
      ]);
      await d.openCardList();
      add = await page.evaluate(async () => {
        const box = (el) => {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        };
        const list = document.querySelector('.resacts .dropmenu');
        await Promise.all(list.getAnimations().map((a) => a.finished));
        const chips = list.querySelector('.pickchips');
        return {
          menu: box(list),
          add: box(list.querySelector(':scope > .lnew') ?? list.lastElementChild),
          scrolls: chips.scrollHeight > chips.clientHeight,
          header: document.querySelector('.topbar').getBoundingClientRect().bottom
        };
      });
    } finally {
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    }
    ok(add.scrolls, where + 'the 150 lists do not scroll');
    ok(inside(add.menu, await viewBox(page)), where + 'the add menu leaves the window');
    ok(inside(add.add, add.menu), where + '«+ Новый список» leaves the add menu');
    ok(add.menu.y >= add.header, where + 'the add menu slides under the header');

    await page.keyboard.press('Escape');
    await page.click('.card.face .card-media');
    await page.waitForSelector('dialog[open] .seldrop > .btn', { timeout: 5000 });
    await d.settle();
    await page.click('dialog[open] .seldrop > .btn');
    await d.settle();
    const dialog = await page.evaluate(() => ({
      expanded: document
        .querySelector('dialog[open] .seldrop > .btn')
        .getAttribute('aria-expanded'),
      inside: document.querySelectorAll('dialog[open] .dropmenu').length,
      behind: document.querySelectorAll('.resacts .dropmenu').length
    }));
    ok(
      dialog.expanded === 'true' && dialog.inside === 1 && dialog.behind === 0,
      where + 'the dialog over a result does not open its add menu - ' + JSON.stringify(dialog)
    );
    await ctx.close();
  }
}

/** Opens inventory state `id` at `width` x `height` in `lang`, the way case 83 does, and
 *  answers the context, the page and the driver. `wideEnter` presses the state's controls at
 *  1180 px, where they draw, then takes the window to its size. */
async function openState(id, width, height, lang, wideEnter = false) {
  const state = STATES.find((s) => s.id === id);
  if (!state) throw new Error('no inventory state ' + id);
  const got = await fresh({
    width: wideEnter ? 1180 : width,
    height: wideEnter ? 720 : height,
    storage: state.storage
  });
  await got.d.open(state.route, {
    as: state.as,
    items: state.items,
    sections: state.sections,
    sources: state.sources,
    hold: state.hold
  });
  if (state.enter) await state.enter(got.d);
  await got.d.settled(state.id);
  if (wideEnter) await got.d.viewport(width, height);
  if (lang === 'en') await got.d.click('EN');
  await got.d.addressSettled();
  await got.page.evaluate(async () => {
    await document.fonts.ready;
    scrollTo(0, 0);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  return got;
}

/** 95. A badge is one box and keeps clear of the lines around it (DESIGN.md, "Badges"): the
 *  «Хоумбрю» badges of a relation line on the full card, a grid tile's kind badge in and out
 *  of the selection mode, and a roll result that draws no «Core» badge and no relation line. */
async function badgeIsOneBox() {
  const at = '95 (a badge is one box): ';
  for (const [width, height] of [
    [360, 640],
    [1180, 720]
  ]) {
    for (const lang of ['ru', 'en']) {
      const where = at + '#/i/ci1 as gm3 ' + width + ' ' + lang + ': ';
      const { ctx, page } = await openState('#/i/ci1 as gm3', width, height, lang);
      try {
        const m = await page.evaluate(() => {
          const out = { badges: 0, split: [], apart: [], close: [], cross: [] };
          for (const p of document.querySelectorAll('.craft p')) {
            const boxes = [...p.querySelectorAll('a, .badge, .btn')].flatMap((el) =>
              [...el.getClientRects()].map((r) => ({ el, r, badge: el.matches('.badge') }))
            );
            for (const badge of p.querySelectorAll('.badge.hb')) {
              out.badges++;
              const rects = badge.getClientRects();
              if (rects.length !== 1) out.split.push(badge.textContent + ' ' + rects.length);
              const b = rects[0];
              const name = badge.previousElementSibling;
              const nr = name ? [...name.getClientRects()].pop() : null;
              if (!nr || Math.min(b.bottom, nr.bottom) - Math.max(b.top, nr.top) <= 0)
                out.apart.push(
                  (name?.textContent ?? '?') + ' ' + JSON.stringify([b.top, nr?.top])
                );
              for (const o of boxes) {
                if (o.el === badge) continue;
                const v = Math.min(b.bottom, o.r.bottom) - Math.max(b.top, o.r.top);
                const h = Math.min(b.right, o.r.right) - Math.max(b.left, o.r.left);
                if (v > 0 && h > 0)
                  out.cross.push(badge.textContent + ' x ' + o.el.textContent);
                if (v <= 0) {
                  const gap = Math.max(o.r.top - b.bottom, b.top - o.r.bottom);
                  if (gap < 2)
                    out.close.push(o.el.textContent.slice(0, 20) + ' ' + gap.toFixed(1));
                }
              }
            }
          }
          return out;
        });
        ok(m.badges >= 3, where + 'the line draws ' + m.badges + ' «Хоумбрю» badges');
        ok(!m.split.length, where + 'a badge splits into fragments: ' + m.split.join(' | '));
        ok(!m.apart.length, where + "a badge leaves its name's line: " + m.apart.join(' | '));
        ok(
          !m.close.length,
          where + 'a box is closer than 2 px: ' + m.close.slice(0, 4).join(' | ')
        );
        ok(
          !m.cross.length,
          where + 'a badge touches a box: ' + m.cross.slice(0, 4).join(' | ')
        );
      } finally {
        await ctx.close();
      }
    }
  }

  /* The weapon kind badges on grid tiles: the first table of the list that draws both. */
  for (const [width, height] of [
    [360, 640],
    [390, 844],
    [412, 915],
    [768, 1024]
  ]) {
    for (const lang of ['ru', 'en']) {
      const { ctx, page, d } = await fresh({ width, height, lang });
      try {
        let table = null;
        for (const t of ['other_starting', 'voa', 'mwt']) {
          await d.open('#/tables/' + t, { lang });
          await d.click(lang === 'en' ? 'Grid' : 'Сетка');
          const both = await page.evaluate(
            () =>
              !!document.querySelector('.tile-k .badge.eq-weapon') &&
              !!document.querySelector('.tile-k .badge.eq-secondary')
          );
          if (both) {
            table = t;
            break;
          }
        }
        const where = at + 'tiles ' + table + ' ' + width + ' ' + lang + ': ';
        ok(!!table, at + width + ' ' + lang + ': no grid table draws both weapon badges');
        if (!table) continue;
        const read = () =>
          page.evaluate(() =>
            [...document.querySelectorAll('.tile-k .badge')].map((b) => {
              const rects = b.getClientRects();
              const r = b.getBoundingClientRect();
              const img = b.closest('.tile-img').getBoundingClientRect();
              return {
                text: b.textContent.trim(),
                cls: b.className,
                n: rects.length,
                h: r.height,
                w: r.width,
                inside:
                  r.left >= img.left - 0.5 &&
                  r.right <= img.right + 0.5 &&
                  r.top >= img.top - 0.5 &&
                  r.bottom <= img.bottom + 0.5
              };
            })
          );
        const out = await read();
        const line = Math.min(...out.map((b) => b.h));
        const weapons = out.filter((b) => /eq-(weapon|secondary)/.test(b.cls));
        ok(
          !out.some((b) => b.n !== 1),
          where +
            'a kind badge splits: ' +
            JSON.stringify(out.filter((b) => b.n !== 1).slice(0, 2))
        );
        ok(
          out.every((b) => b.inside),
          where + 'a kind badge leaves its picture'
        );
        const tall = weapons.filter((b) => b.h > line + 1);
        fs.writeSync(
          1,
          '  tile pills: ' +
            where +
            'one line ' +
            line.toFixed(1) +
            ' px; weapon widths ' +
            [
              ...new Set(
                weapons.map((b) => b.text + ' ' + b.w.toFixed(1) + 'x' + b.h.toFixed(1))
              )
            ].join(', ') +
            '\n'
        );
        /* At 360 px a tile leaves «ВТОРИЧНОЕ ОРУЖИЕ» 135.5 px of the 139.6 it needs (measured
           2026-11-04): the pill wraps inside its one border, logged and not asserted. */
        if (width > 360)
          ok(
            !tall.length,
            where + 'a weapon badge takes two lines: ' + JSON.stringify(tall.slice(0, 2))
          );
        await d.click(lang === 'en' ? 'Select' : 'Выбрать');
        const sel = await read();
        ok(!sel.some((b) => b.n !== 1), where + 'in the selection mode a kind badge splits');
        ok(
          sel.every((b) => b.inside),
          where + 'in the selection mode a kind badge leaves its picture'
        );
      } finally {
        await ctx.close();
      }
    }
  }

  /* A roll result of ci1: no «Core» badge and no relation line; its name opens the page,
     which draws them. */
  for (const [width, height] of [
    [360, 640],
    [1180, 720]
  ]) {
    const { ctx, page, d } = await fresh({ width, height });
    try {
      const where = at + '/roll/std as gm3 ' + width + ': ';
      await d.open('#/roll/std', { as: 'gm3' });
      await d.settled('#/roll/std as gm3');
      const card = await page.evaluate(() => {
        const face = document.querySelector('.card.face[data-id="ci1"]');
        return face
          ? {
              src: [...face.querySelectorAll('.badge.src')].map((b) => b.textContent.trim()),
              craft: !!face.querySelector('.craft'),
              steps: !!face.querySelector('.steps')
            }
          : null;
      });
      ok(!!card, where + 'the roll holds no ci1');
      if (!card) continue;
      ok(!card.src.includes('Core'), where + 'the result draws «Core»');
      ok(!card.craft && !card.steps, where + 'the result draws a relation line or a ladder');
      await page.click('.card.face[data-id="ci1"] .card-name a');
      await d.settled('/i/ci1 as gm3');
      ok(
        await waitIn(
          page,
          () => location.pathname.endsWith('/i/ci1') && !!document.querySelector('.craft')
        ),
        where + "the name does not open ci1's page with its relation lines"
      );
    } finally {
      await ctx.close();
    }
  }
}

/** The tables `TableNav` lists, in its order (`TABLE_NAV`), as gm3 draws them. */
const NAV_TABLES = [
  'core_item',
  'core_consumable',
  'hnf_item',
  'hnf_consumable',
  'alt_item',
  'alt_consumable',
  'wondrous',
  'dread',
  'voa',
  'dv',
  'arazo',
  'community',
  'mwt',
  'ph',
  'lr',
  'vh',
  'eq_weapon',
  'eq_secondary',
  'eq_armor',
  'other_starting',
  'other_frames',
  'homebrew'
];

/** 96. The table head holds still between tables (DESIGN.md, "The Head Order Rule"): per
 *  band, the title row, the group chips, the tab slot, the search row and the rows region
 *  start at one Y on every table, and the chips at one X. */
async function tableHeadHoldsStill() {
  const at = '96 (the table head holds still): ';
  for (const [width, height] of [
    [1180, 720],
    [1050, 720],
    [760, 720],
    [390, 844]
  ]) {
    for (const lang of ['ru', 'en']) {
      const { ctx, page, d } = await fresh({ width, height, lang });
      try {
        await d.open('#/tables/' + NAV_TABLES[0], { as: 'gm3', lang });
        await d.settled('#/tables as gm3');
        const seen = {};
        for (const table of NAV_TABLES) {
          await d.go('#/tables/' + table);
          const m = await page.evaluate(async () => {
            await document.fonts.ready;
            scrollTo(0, 0);
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
            const box = (s) => document.querySelector('main ' + s)?.getBoundingClientRect();
            const y = (s) => {
              const r = box(s);
              return r ? Math.round(r.top * 2) / 2 : null;
            };
            return {
              title: y('.page-head') ?? y('.pickrow'),
              picker: box('.pickrow .picker')
                ? Math.round(box('.pickrow .picker').height)
                : null,
              groups: y('.page-head .groups'),
              tabs: y('.page-below .tabslot') ?? y('.page-head .tabs'),
              searchrow: y('.searchrow'),
              rowscol: y('.rowscol'),
              groupsX: box('.page-head .groups')
                ? Math.round(box('.page-head .groups').left)
                : null
            };
          });
          for (const [k, v] of Object.entries(m)) (seen[k] ??= []).push([table, v]);
          if (width === 390 && table === NAV_TABLES[0]) {
            const face = await page.evaluate(pickerFace);
            ok(
              face.size && face.high <= 41,
              at +
                width +
                ' ' +
                lang +
                ': the picker face is not the one face - ' +
                JSON.stringify(face)
            );
          }
        }
        for (const [k, vals] of Object.entries(seen)) {
          const drawn = vals.filter(([, v]) => v !== null);
          if (!drawn.length) continue;
          const lo = drawn.reduce((a, b) => (b[1] < a[1] ? b : a));
          const hi = drawn.reduce((a, b) => (b[1] > a[1] ? b : a));
          const absent = vals.filter(([, v]) => v === null).map(([t]) => t);
          const line =
            width +
            ' ' +
            lang +
            ' ' +
            k +
            ': ' +
            lo[1] +
            ' (' +
            lo[0] +
            ') .. ' +
            hi[1] +
            ' (' +
            hi[0] +
            ')' +
            (absent.length ? ', absent on ' + absent.join(' ') : '');
          fs.writeSync(1, '  head: ' + line + '\n');
          ok(hi[1] - lo[1] <= 1 && !absent.length, at + line);
        }
      } finally {
        await ctx.close();
      }
    }
  }
}

/** The roll pages' fit check beside `FIRST_SCREEN` (DESIGN.md, "The Roll Page Rule"): per
 *  state and size, what of each result must end inside the first screen. `names` asserts the
 *  bottom of every name, `whole` of every action row, `first` of the first two action rows;
 *  `row` asks for pictures at most 100 px wide and no number, `tall` for pictures of at least
 *  300 px with the number, `narrow` for a result at most 380.5 px wide. `logged` measures only. */
const ROLL_FIT = [
  { state: '#/roll/std', size: [1180, 720], names: true, row: true },
  { state: '#/roll/alt', size: [1180, 720], names: true, row: true },
  { state: '#/roll/std ~ one source', size: [1180, 720], whole: true, tall: true },
  {
    state: '#/roll/std ~ one result',
    size: [1180, 720],
    whole: true,
    narrow: true,
    tall: true
  },
  { state: '#/roll/voa', size: [1180, 720], names: true, narrow: true, tall: true },
  { state: '#/roll/alt ~ crit', size: [1180, 720], logged: true },
  ...[
    '#/roll/std',
    '#/roll/alt',
    '#/roll/alt ~ crit',
    '#/roll/std ~ one source',
    '#/roll/std ~ one result',
    '#/roll/voa'
  ].map((state) => ({ state, size: [1919, 980], whole: true })),
  ...['#/roll/std', '#/roll/std ~ one source', '#/roll/std ~ one result'].map((state) => ({
    state,
    size: [1000, 720],
    row: true,
    first: true
  })),
  ...['#/roll/std', '#/roll/std ~ one result'].map((state) => ({
    state,
    size: [360, 640],
    phone: true
  }))
];

/** 97. A roll fits the first screen by its count (DESIGN.md, "The Roll Page Rule"). */
async function rollFitsByCount() {
  const at = '97 (a roll fits by its count): ';
  for (const row of ROLL_FIT) {
    const [width, height] = row.size;
    for (const lang of ['ru', 'en']) {
      const where = at + row.state + ' ' + width + 'x' + height + ' ' + lang + ': ';
      const { ctx, page } = await openState(row.state, width, height, lang, !!row.phone);
      try {
        const cards = await page.evaluate(() =>
          [...document.querySelectorAll('.dealt')].map((d) => {
            const r = (s) => d.querySelector(s)?.getBoundingClientRect();
            const num = d.querySelector('.badge.num');
            return {
              name: r('.card-name').bottom,
              acts: r('.resacts').bottom,
              pic: r('.card-media').width,
              w: d.getBoundingClientRect().width,
              num: !!num && getComputedStyle(num).display !== 'none'
            };
          })
        );
        fs.writeSync(
          1,
          '  roll fit: ' +
            where +
            cards.length +
            ' results; names ' +
            cards.map((c) => c.name.toFixed(0)).join('/') +
            '; acts ' +
            cards.map((c) => c.acts.toFixed(0)).join('/') +
            '; pic ' +
            cards.map((c) => c.pic.toFixed(0)).join('/') +
            '; w ' +
            cards.map((c) => c.w.toFixed(0)).join('/') +
            (row.logged ? ' (logged)' : '') +
            '\n'
        );
        ok(cards.length > 0, where + 'no result drawn');
        if (row.logged || !cards.length) continue;
        if (row.names)
          ok(
            cards.every((c) => c.name <= height),
            where + 'a name ends below the fold'
          );
        if (row.whole)
          ok(
            cards.every((c) => c.acts <= height),
            where + 'an action row ends below the fold'
          );
        if (row.first)
          ok(
            cards.slice(0, 2).every((c) => c.acts <= height),
            where + 'the first two results do not fit'
          );
        if (row.row)
          ok(
            cards.every((c) => c.pic <= 100 && !c.num),
            where + 'a result is not the row face'
          );
        if (row.tall)
          ok(
            cards.every((c) => c.pic >= 300 && c.num),
            where + 'a result is not the tall face'
          );
        if (row.narrow)
          ok(
            cards.every((c) => c.w <= 380.5),
            where + 'a result is wider than 380 px'
          );
        if (row.phone)
          ok(
            cards.every((c) => Math.abs(c.pic - 96) < 0.5 && !c.num),
            where + 'the phone face moved'
          );
      } finally {
        await ctx.close();
      }
    }
  }
}

/** 101. The page column grows with the window to 1440 px and stays centered past it; a reading
 *  surface keeps its measure at the column's left edge (DESIGN.md, "The One Width Rule"). The
 *  single counter of the roll pages keeps at most 480 px, the alt roll's two boxes fill their
 *  blocks (DESIGN.md, "Layout"). */
const WIDE_STATES = [
  '#/roll/std',
  '#/roll/alt',
  '#/tables/eq_weapon',
  '#/tables/eq_weapon ~ grid searched',
  '#/search ~ searched',
  '#/i/ci1',
  '#/search ~ relations, dialog as gm3',
  '#/i/nope',
  '#/homebrew as gm3',
  '#/homebrew/new as gm1',
  '#/account as gm1',
  '#/p/set-emberaxe as gm2'
];

/** Measures one wide-window state in the page: the column, its edges, the capped surfaces,
 *  the roll pairs and the number box. */
function measureWide() {
  const rect = (s) => document.querySelector(s)?.getBoundingClientRect();
  /* The body, not `clientWidth`: the headless scrollbar gutter is in `clientWidth` and not in the
     layout width the column centers in. */
  const client = document.body.getBoundingClientRect().width;
  const main = rect('main');
  const primary = [...document.querySelectorAll('[data-primary]')].find(
    (e) => e.getBoundingClientRect().height > 0
  );
  const pairs = [...document.querySelectorAll('.orgrid > .ordiv')].map((div) => {
    const a = div.previousElementSibling?.querySelector('.dealt')?.getBoundingClientRect();
    const b = div.nextElementSibling?.querySelector('.dealt')?.getBoundingClientRect();
    const m = div.getBoundingClientRect();
    return a && b
      ? { wa: a.width, wb: b.width, gapA: m.left - a.right, gapB: b.left - m.right }
      : null;
  });
  const widths = (s) =>
    [...document.querySelectorAll(s)].map((e) => e.getBoundingClientRect().width);
  const lefts = (s) =>
    [...document.querySelectorAll(s)].map((e) => e.getBoundingClientRect().left);
  return {
    /* Not the dialog's card, which is centered in the window by design; and the form's panel,
       since the form sits inside the panel's padding. */
    dossierL: [...document.querySelectorAll('.card.dossier')]
      .filter((e) => !e.closest('dialog'))
      .map((e) => e.getBoundingClientRect().left),
    formL: [...document.querySelectorAll('.hbform')].map(
      (e) => e.parentElement.getBoundingClientRect().left
    ),
    accountL: lefts('.col:has(.acc)'),
    client,
    scrollW: document.documentElement.scrollWidth,
    mainW: main.width,
    mainL: main.left,
    mainR: client - main.right,
    brandL: rect('.brand')?.left,
    footL: rect('.foot')?.left,
    topbarH: rect('.topbar')?.height,
    top: primary ? primary.getBoundingClientRect().top + scrollY : null,
    dossier: widths('.card.dossier'),
    /* `dialog[open]` itself fills the window; its card is `.modal-card`. */
    dialog: widths('dialog[open] .modal-card'),
    form: widths('.hbform'),
    preview: widths('.preview'),
    account: widths('.col:has(.acc)'),
    sheet: widths('.psheet'),
    sheetTransform: [...document.querySelectorAll('.pfit-in')].map(
      (e) => getComputedStyle(e).transform
    ),
    pairs: pairs.filter(Boolean),
    actsBottom: [...document.querySelectorAll('.dealt .resacts')].map(
      (e) => e.getBoundingClientRect().bottom
    ),
    numbox: widths('.numbox')
  };
}

async function pageColumnOnWideWindows() {
  const at = '101 (the page column on wide windows): ';
  const base = {};
  const run = async (id, width, height, lang) => {
    const { ctx, page } = await openState(id, width, height, lang);
    try {
      return await page.evaluate(measureWide);
    } finally {
      await ctx.close();
    }
  };
  for (const id of WIDE_STATES) {
    for (const lang of ['ru', 'en']) base[id + lang] = await run(id, 1180, 720, lang);
    const b = base[id + 'ru'];
    ok(
      b.numbox.every((w) => w <= 480.5),
      at + id + ' 1180: the number box is wider than 480 px - ' + JSON.stringify(b.numbox)
    );
    for (const [width, height, lang] of [
      [1366, 768, 'ru'],
      [1920, 1080, 'ru'],
      [1920, 1080, 'en'],
      [3840, 2160, 'ru']
    ]) {
      const where = at + id + ' ' + width + 'x' + height + ' ' + lang + ': ';
      const m = await run(id, width, height, lang);
      const was = base[id + lang];
      fs.writeSync(
        1,
        '  wide: ' +
          where +
          'main ' +
          m.mainW.toFixed(0) +
          ' (' +
          m.mainL.toFixed(0) +
          '/' +
          m.mainR.toFixed(0) +
          '); top ' +
          (m.top === null ? '-' : m.top.toFixed(0)) +
          ' (was ' +
          (was.top === null ? '-' : was.top.toFixed(0)) +
          '); dossier ' +
          m.dossier.map((w) => w.toFixed(0)).join('/') +
          '; form ' +
          m.form.map((w) => w.toFixed(0)).join('/') +
          '; numbox ' +
          m.numbox.map((w) => w.toFixed(0)).join('/') +
          '\n'
      );
      ok(
        Math.abs(m.mainW - Math.min(1440, m.client - 32)) <= 1,
        where + 'the column is ' + m.mainW + ' px, not min(1440, client - 32)'
      );
      ok(
        Math.abs(m.mainL - m.mainR) <= 1,
        where + 'the column is off center: ' + m.mainL + '/' + m.mainR
      );
      ok(
        Math.abs(m.brandL - m.mainL) <= 1,
        where + 'the brand is off the column edge: ' + m.brandL
      );
      ok(
        Math.abs(m.footL - m.mainL) <= 1,
        where + 'the footer is off the column edge: ' + m.footL
      );
      ok(
        m.scrollW <= m.client,
        where + 'the page scrolls sideways: ' + m.scrollW + ' > ' + m.client
      );
      if (m.top !== null && was.top !== null)
        ok(
          Math.abs(m.top - was.top) <= 2,
          where + 'the first screen moved: ' + m.top + ' vs ' + was.top
        );
      for (const [key, hit] of [
        ['dossier', id === '#/i/ci1'],
        ['dialog', id.includes('dialog')],
        ['form', id === '#/homebrew/new as gm1'],
        ['preview', id === '#/homebrew/new as gm1'],
        ['account', id.startsWith('#/account')],
        ['sheet', id.startsWith('#/p/')],
        ['pairs', id === '#/roll/std'],
        ['numbox', id.startsWith('#/roll/')]
      ])
        if (hit) ok(m[key].length > 0, where + 'no ' + key + ' measured');
      ok(
        m.dossier.every((w) => w <= 980.5),
        where + 'a dossier is wider than 980 px'
      );
      ok(
        m.dialog.every((w) => w <= 980.5),
        where + 'the dialog is wider than 980 px'
      );
      ok(
        m.form.every((w) => w <= 720.5),
        where + 'the editor form is wider than 720 px'
      );
      ok(
        m.preview.every((w) => Math.abs(w - 420) <= 1),
        where + 'the preview is not 420 px'
      );
      ok(
        m.account.every((w) => w <= 1100.5),
        where + 'the account grid is wider than 1100 px'
      );
      ok(
        m.sheet.every((w, i) => Math.abs(w - was.sheet[i]) <= 1) &&
          m.sheetTransform.every((t) => t === 'none'),
        where + 'the print sheet changed: ' + JSON.stringify(m.sheet) + ' ' + m.sheetTransform
      );
      ok(
        m.pairs.every((p) => Math.abs(p.wa - p.wb) <= 1 && Math.abs(p.gapA - p.gapB) <= 1),
        where + 'a roll pair is uneven: ' + JSON.stringify(m.pairs)
      );
      if (height === 1080 && id === '#/roll/std')
        ok(
          m.actsBottom.every((y) => y <= height),
          where + 'a result ends below the window'
        );
      ok(
        Math.abs(m.topbarH - was.topbarH) <= 1,
        where + 'the header changed height: ' + m.topbarH + ' vs ' + was.topbarH
      );
      ok(
        m.numbox.every((w) => w <= 480.5),
        where + 'the number box is wider than 480 px'
      );
      /* Each of the three surfaces starts at the column's left edge, so none is centered. */
      for (const key of ['dossierL', 'formL', 'accountL'])
        ok(
          m[key].every((x) => Math.abs(x - m.mainL) <= 1),
          where + key + ' is off the column edge: ' + JSON.stringify(m[key]) + ' vs ' + m.mainL
        );
    }
  }
  /* The cap is the single-box counter's; the two die boxes of the alt roll fill their blocks at
     every width, also in the phone settings panel where a block is wider than 480 px. */
  for (const width of [360, 700]) {
    const where = at + '#/roll/alt ' + width + ' ru, settings open: ';
    const { ctx, page, d } = await openState('#/roll/alt', width, 800, 'ru');
    try {
      await d.click('Настроить');
      await d.settle();
      const boxes = await page.evaluate(() =>
        [...document.querySelectorAll('.numbox')].map((n) => [
          n.getBoundingClientRect().width,
          n.parentElement.getBoundingClientRect().width
        ])
      );
      ok(boxes.length === 2, where + 'expected two number boxes, found ' + boxes.length);
      ok(
        boxes.every(([box, block]) => Math.abs(box - block) <= 1),
        where + 'a number box does not fill its block: ' + JSON.stringify(boxes)
      );
    } finally {
      await ctx.close();
    }
  }
  for (const id of ['#/roll/std', '#/search ~ searched']) {
    const m = await run(id, 1366, 650, 'ru');
    fs.writeSync(
      1,
      '  wide: ' +
        at +
        id +
        ' 1366x650 ru: primary top ' +
        (m.top ?? 0).toFixed(0) +
        ' against 260 (logged)\n'
    );
  }
}

const LIST_A_ID = '#/lists/00000000-0000-4000-8000-000000008001';

/** The geometry of every compact row of the page: its height, the quantity field's box and
 *  whether the field's center hits the field. */
const compactGeometry = () =>
  [...document.querySelectorAll('.lrow')].map((row) => {
    const r = row.getBoundingClientRect();
    const f = row.querySelector('.cqf');
    const b = f?.getBoundingClientRect();
    const hit = b ? document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2) : null;
    const name = row.querySelector('.cname')?.getBoundingClientRect().height ?? 0;
    return {
      h: r.height,
      line: !!row.querySelector('.cfx') && name <= 21,
      field: b ? [Math.round(b.width), Math.round(b.height)] : null,
      hits: !!f && hit === f,
      inside: r.left >= 0 && r.right <= innerWidth
    };
  });

/** 98. The compact row holds from 320 to 760 px (docs/specs/FEATURES.md, "Lists"; DESIGN.md,
 *  "Compact row"), as `gm4` on `LIST_A ~ many`, RU and EN: a row with its line is at most
 *  80 px, the quantity field is 42x44 and takes a press at its center, the Tab order is the
 *  body, the field, then the unfolded part, ten ArrowUp keys make one write, a write with
 *  no network keeps the number and says «Не сохранено», a touch device draws no grip and a
 *  typed position moves the row; from 761 px, at 1440 and at 1920 px the full row draws. */
async function compactRowHolds() {
  const at = '98 (the compact row from 320 to 760 px): ';
  const many = LIST_A_ID + ' ~ many as gm4';
  for (const [width, height] of [
    [360, 640],
    [320, 568]
  ]) {
    for (const lang of ['ru', 'en']) {
      const where = at + width + ' ' + lang + ': ';
      const { ctx, page } = await openState(many, width, height, lang);
      try {
        await page.evaluate(() => {
          scrollTo(0, 400);
        });
        const rows = await page.evaluate(compactGeometry);
        ok(rows.length === 14, where + 'not 14 compact rows - ' + rows.length);
        ok(
          rows.some((r) => r.line) && rows.every((r) => !r.line || r.h <= 80),
          where +
            'a one-line row with its line is over 80 px - ' +
            JSON.stringify(rows.map((r) => [r.h, r.line]))
        );
        ok(
          rows.every((r) => r.field?.[0] === 42 && r.field?.[1] === 44),
          where + 'a quantity field is not 42x44 - ' + JSON.stringify(rows.map((r) => r.field))
        );
        const visible = await page.evaluate(
          () =>
            [...document.querySelectorAll('.cqf')].filter((f) => {
              const r = f.getBoundingClientRect();
              return r.top > 120 && r.bottom < innerHeight - 10;
            }).length
        );
        ok(visible > 0, where + 'no quantity field in view');
        const hits = await page.evaluate(() =>
          [...document.querySelectorAll('.cqf')]
            .filter((f) => {
              const r = f.getBoundingClientRect();
              return r.top > 120 && r.bottom < innerHeight - 10;
            })
            .every((f) => {
              const r = f.getBoundingClientRect();
              return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === f;
            })
        );
        ok(hits, where + 'a press at a field center lands on another element');
        ok(
          rows.every((r) => r.inside) &&
            !(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)),
          where + 'a row or the page passes the window sideways'
        );
      } finally {
        await ctx.close();
      }
    }
  }

  /* The keyboard order, the one write and the unfold, at 360 RU. */
  {
    const { ctx, page, d } = await openState(many, 360, 640, 'ru');
    try {
      const order = async (n) =>
        page.evaluate(async (count) => {
          const out = [];
          for (let i = 0; i < count; i++) {
            const a = document.activeElement;
            out.push(
              a?.classList.contains('cbody')
                ? 'body'
                : a?.classList.contains('cqf')
                  ? 'field'
                  : a?.classList.contains('lrow-n')
                    ? 'position'
                    : a?.matches('[data-gold]')
                      ? 'price'
                      : a?.classList.contains('cnote')
                        ? 'note'
                        : a?.closest('.morewrap')
                          ? 'more'
                          : (a?.tagName ?? '')
            );
            await new Promise((r) => setTimeout(r, 0));
            out.push('|');
          }
          return out;
        }, n);
      await page.focus('button.cbody');
      const seq = [];
      for (let i = 0; i < 3; i++) {
        seq.push((await order(1))[0]);
        await page.keyboard.press('Tab');
      }
      ok(
        JSON.stringify(seq) === JSON.stringify(['body', 'field', 'body']),
        at + 'the folded Tab order - ' + JSON.stringify(seq)
      );
      await page.focus('button.cbody');
      await page.keyboard.press('Enter');
      await d.settle();
      const opened = await page.evaluate(() => ({
        expanded: document.querySelector('button.cbody')?.getAttribute('aria-expanded'),
        focus: document.activeElement === document.querySelector('button.cbody')
      }));
      ok(
        opened.expanded === 'true' && opened.focus,
        at + 'the press did not unfold the row and keep the focus - ' + JSON.stringify(opened)
      );
      const open = [];
      for (let i = 0; i < 7; i++) {
        open.push((await order(1))[0]);
        await page.keyboard.press('Tab');
      }
      ok(
        JSON.stringify(open) ===
          JSON.stringify(['body', 'field', 'position', 'price', 'note', 'more', 'body']),
        at + 'the unfolded Tab order - ' + JSON.stringify(open)
      );

      await d.writesSettled();
      const c0 = await d.fake('writeCount');
      await page.focus('.lrow:nth-child(2) .cqf');
      await d.writesSettled();
      ok((await d.fake('writeCount')) === c0, at + 'a focus alone wrote');
      for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowUp');
      await d.writesSettled();
      const writes = (await d.fake('writeCount')) - c0;
      const value = await page.evaluate(
        () => document.querySelector('.lrow:nth-child(2) .cqf')?.value
      );
      ok(
        writes === 1 && value === '10',
        at + `ten keys made ${writes} writes and the field reads ${value}`
      );

      await d.fake('setOffline', true);
      await page.focus('.lrow:nth-child(3) .cqf');
      await page.keyboard.type('4');
      ok(
        await waitIn(page, () =>
          document.querySelector('.page-sub')?.textContent.includes('Не сохранено')
        ),
        at + 'a write with no network does not say «Не сохранено»'
      );
      ok(
        (await page.evaluate(
          () => document.querySelector('.lrow:nth-child(3) .cqf')?.value
        )) === '4',
        at + 'the failed write lost the number'
      );
      await d.fake('setOffline', false);
      await d.press('Повторить');
      ok(
        await waitIn(page, () =>
          document.querySelector('.page-sub')?.textContent.includes('Сохранено')
        ),
        at + 'the retry did not save the number'
      );

      /* From 761 px the full row draws with the same number. */
      await d.viewport(761, 768);
      ok(
        await waitIn(
          page,
          () =>
            !document.querySelector('.crow') &&
            document.querySelectorAll('.lrow-meta input[data-qty]')[2]?.value === '4'
        ),
        at + 'at 761 px the full row did not draw with the typed number'
      );
      for (const [w, h] of [
        [1440, 900],
        [1920, 1080]
      ]) {
        await d.viewport(w, h);
        ok(
          await waitIn(
            page,
            () => !document.querySelector('.crow') && !!document.querySelector('.lrow-meta')
          ),
          at + w + ' px does not draw the full row'
        );
      }
    } finally {
      await ctx.close();
    }
  }

  /* A touch device: no grip; a typed position moves the row and the region says it. */
  {
    /* A touch viewport reloads the page, so it is set before the list is made. */
    const state = STATES.find((s) => s.id === many);
    const { ctx, page, d } = await fresh({ width: 390, height: 844 });
    try {
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      await d.open(state.route, { as: state.as });
      await state.enter(d);
      await d.settled(state.id);
      await d.unfold(3);
      const grip = await page.evaluate(() => {
        const g = document.querySelector('.lrow-grip');
        return g ? getComputedStyle(g).display : 'none';
      });
      ok(grip === 'none', at + 'a touch device draws the grip - ' + grip);
      const name = await page.evaluate(
        () => document.querySelectorAll('.lrow')[3]?.querySelector('.cname')?.textContent
      );
      await page.evaluate(() => {
        const pos = document.querySelectorAll('.lrow')[3].querySelector('.lrow-n');
        pos.value = '1';
        pos.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await d.settle();
      const moved = await page.evaluate(() => ({
        first: document.querySelector('.lrow .cname')?.textContent,
        said: [...document.querySelectorAll('.said')].map((s) => s.textContent).join(' ')
      }));
      ok(
        moved.first === name && moved.said.includes('позиция 1 из 14'),
        at + 'the typed position did not move the row - ' + JSON.stringify(moved)
      );
    } finally {
      await ctx.close();
    }
  }
}

/** 99. Search and filter on the owner's page (docs/specs/FEATURES.md, "Account and browser
 *  lists"), as `gm4` at 360x640 and 1180x720: the search row from 8 entries and not at 7,
 *  the filter a sheet with no link, a pick lights «Фильтры · 1» and the meta line reads
 *  «Показано 3 из 14», the numbers stay true and the grip goes, a ticked row the filter
 *  hides leaves the bar's count, «Все» ticks the drawn rows only; at 1920 px the search box
 *  is no wider than `/search`'s. */
async function listSearchAndFilter() {
  const at = '99 (search and filter on the owner page): ';
  for (const [width, height] of [
    [360, 640],
    [1180, 720]
  ]) {
    const where = at + width + ': ';
    {
      const { ctx, page } = await openState(LIST_A_ID + ' as gm4', width, height, 'ru');
      try {
        ok(
          !(await page.evaluate(() => !!document.querySelector('.lfind'))),
          where + 'a search row at 7 entries'
        );
      } finally {
        await ctx.close();
      }
    }
    const { ctx, page, d } = await openState(LIST_A_ID + ' ~ many as gm4', width, height, 'ru');
    try {
      const row = await page.evaluate(() => {
        const f = document.querySelector('.lfind');
        return {
          box: !!f?.querySelector('input[type="search"]'),
          last: f?.lastElementChild?.classList.contains('selmode') ?? false
        };
      });
      ok(
        row.box && row.last,
        where + 'no search row with «Выбрать» last - ' + JSON.stringify(row)
      );
      await d.tick('Первоклассный Спальный Мешок');
      await d.click('Фильтры');
      const sheet = await page.evaluate(() => ({
        open: !!document.querySelector('dialog.sheet[open]'),
        link: [...document.querySelectorAll('dialog.sheet button')].some(
          (b) => b.textContent.trim() === 'Ссылка на фильтры'
        )
      }));
      ok(sheet.open && !sheet.link, where + 'the filter sheet - ' + JSON.stringify(sheet));
      await d.click('Расходники');
      await d.click('Закрыть');
      const narrowed = await page.evaluate(() => ({
        toggle: [...document.querySelectorAll('.lfind button')].map((b) =>
          b.textContent.trim()
        ),
        sub: (document.querySelector('.page-sub')?.textContent ?? '')
          .replace(/\s+/g, ' ')
          .trim(),
        numbers: [...document.querySelectorAll('.lrow')].map(
          (r) => Number(r.dataset.index) + 1
        ),
        grips: document.querySelectorAll('.lrow-grip').length,
        count: document.querySelector('.selbarwrap .selcount')?.textContent ?? ''
      }));
      ok(
        narrowed.toggle.includes('Фильтры · 1') &&
          narrowed.sub.startsWith('Показано 3 из 14') &&
          JSON.stringify(narrowed.numbers) === '[9,10,11]' &&
          narrowed.grips === 0 &&
          narrowed.count.startsWith('Выбрано 0'),
        where + 'the narrowed page - ' + JSON.stringify(narrowed)
      );
      await page.evaluate(() => document.querySelector('.selbarwrap .selall input')?.click());
      await d.settle();
      const all = await page.evaluate(
        () => document.querySelector('.selbarwrap .selcount')?.textContent ?? ''
      );
      ok(all.startsWith('Выбрано 3'), where + '«Все» ticked more than the drawn rows - ' + all);
    } finally {
      await ctx.close();
    }
  }

  /* At 1920 px the list's box is no wider than the search page's. */
  {
    const { ctx, page } = await openState(LIST_A_ID + ' ~ many as gm4', 1920, 1080, 'ru');
    const list = await page.evaluate(
      () => document.querySelector('.lfind input[type="search"]')?.getBoundingClientRect().width
    );
    await ctx.close();
    const s = await fresh({ width: 1920, height: 1080 });
    await s.d.open('#/search');
    await s.d.settled('#/search');
    const search = await s.page.evaluate(
      () => document.querySelector('main input[type="search"]')?.getBoundingClientRect().width
    );
    await s.ctx.close();
    console.log('  99 at 1920: list box ' + list + ', search box ' + search);
    ok(
      typeof list === 'number' && typeof search === 'number' && list <= search + 0.5,
      at + '1920: the list box is wider than the search page box - ' + list + ' / ' + search
    );
  }
}

/** 100. The list head and the bars (docs/specs/FEATURES.md, "Lists"; DESIGN.md, "Selection
 *  bar"): at 360x640 the list «Ещё» opens inside the window with its items in order and
 *  opens the share panel, the roll and the notes; the bar is one bar at most 45% of a
 *  640x360 window; the price sheet's foot is in view at 360x480; «Снять выделение» gives
 *  the focus back to «Выбрать»; a `/s/` row unfolds and «Открыть карточку» opens the card;
 *  no select-all strip and no pill; at 1920 px the bar starts at `main`'s left edge on both
 *  pages. */
async function listHeadAndBars() {
  const at = '100 (the list head and the bars): ';
  {
    const { ctx, page, d } = await openState(LIST_A_ID + ' ~ noted as gm4', 360, 640, 'ru');
    try {
      await d.openMore('.lhead-acts .morewrap > [aria-haspopup="menu"]');
      const menu = await page.evaluate(() => {
        const m = document.querySelector('[role="menu"]');
        const r = m?.getBoundingClientRect();
        return {
          items: [...(m?.querySelectorAll('[role="menuitem"]') ?? [])].map((b) =>
            b.textContent.trim()
          ),
          inside:
            !!r && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight
        };
      });
      ok(
        menu.inside &&
          JSON.stringify(menu.items) ===
            JSON.stringify([
              'Поделиться',
              'Печать',
              'Бросить по списку',
              'Цены: монетами',
              'Скопировать текст',
              'Скачать JSON',
              'Удалить список'
            ]),
        at + 'the list «Ещё» at 360 - ' + JSON.stringify(menu)
      );
      await d.click('Бросить по списку');
      ok(!!(await d.count('.lroll-h')), at + '«Бросить по списку» opened no roll');
      await d.openMore('.lhead-acts .morewrap > [aria-haspopup="menu"]');
      await d.click('Поделиться');
      ok(
        (await d.text()).includes('Ссылка для игроков'),
        at + '«Поделиться» opened no share panel'
      );
      await d.click('Заметки');
      ok(!!(await d.count('.lnotes .narea textarea')), at + '«Заметки» opened no list notes');
      ok(
        !(await d.count('main .selall')) && !(await d.count('.fpill')),
        at + 'a strip or a pill'
      );

      await d.click('Выбрать');
      await d.tick('Пронзительная Свирель');
      await d.viewport(640, 360);
      const bar = await page.evaluate(() => ({
        bars: document.querySelectorAll('.selbarwrap').length,
        h: document.querySelector('.selbarwrap')?.getBoundingClientRect().height ?? 0
      }));
      ok(
        bar.bars === 1 && bar.h <= 0.45 * 360,
        at + 'the bar at 640x360 - ' + JSON.stringify(bar)
      );
      await d.viewport(360, 480);
      await d.click('Цены');
      const foot = await page.evaluate(() => {
        const f = document.querySelector('dialog.sheet .sheet-foot');
        const r = f?.getBoundingClientRect();
        return r ? { top: r.top, bottom: r.bottom, vh: innerHeight } : null;
      });
      ok(
        !!foot && foot.top >= 0 && foot.bottom <= foot.vh,
        at + 'the price sheet foot is out of view at 360x480 - ' + JSON.stringify(foot)
      );
      await d.click('Закрыть');
      await d.viewport(360, 640);
      await d.click('Снять выделение');
      ok(
        await waitIn(
          page,
          () => document.activeElement?.classList.contains('selmode') ?? false
        ),
        at + '«Снять выделение» did not return the focus to «Выбрать»'
      );
    } finally {
      await ctx.close();
    }
  }
  /* Fourteen ticks: the sheet's body reaches its height cap, and the foot stays in view. */
  {
    const { ctx, page, d } = await openState(LIST_A_ID + ' ~ many as gm4', 360, 640, 'ru');
    try {
      await d.click('Выбрать');
      await page.evaluate(() => document.querySelector('.selbarwrap .selall input')?.click());
      await d.settle();
      await d.viewport(360, 480);
      await d.click('Цены');
      const sheet = await page.evaluate(() => {
        const f = document.querySelector('dialog.sheet .sheet-foot')?.getBoundingClientRect();
        return {
          rows: document.querySelectorAll('dialog.sheet .guess-row').length,
          foot: f ? { top: f.top, bottom: f.bottom } : null,
          vh: innerHeight
        };
      });
      ok(
        sheet.rows === 14 &&
          !!sheet.foot &&
          sheet.foot.top >= 0 &&
          sheet.foot.bottom <= sheet.vh,
        at + 'the price sheet of 14 rows at 360x480 - ' + JSON.stringify(sheet)
      );
      /* From 761 px a sheet is centered with four round corners (DESIGN.md, "Sheet"). */
      await d.viewport(1180, 720);
      await d.settle();
      const wide = await page.evaluate(() => {
        const s = document.querySelector('dialog.sheet[open]');
        const r = s?.getBoundingClientRect();
        const cs = s ? getComputedStyle(s) : null;
        const root = getComputedStyle(document.documentElement);
        return r && cs
          ? {
              top: r.top,
              gap: innerHeight - r.bottom,
              radius: cs.borderBottomLeftRadius,
              r: root.getPropertyValue('--r').trim()
            }
          : null;
      });
      ok(
        !!wide &&
          Math.abs(wide.top - wide.gap) <= 1 &&
          wide.gap >= 16 &&
          wide.radius === wide.r,
        at + 'the price sheet of 14 rows at 1180x720 is not centered - ' + JSON.stringify(wide)
      );
    } finally {
      await ctx.close();
    }
  }
  {
    const { ctx, page, d } = await openState('#/s/player-token-1 ~ compact', 360, 640, 'ru');
    try {
      await d.unfold(0);
      await d.click('Открыть карточку');
      ok(
        await waitIn(page, () => !!document.querySelector('dialog[open]:not(.sheet)')),
        at + '«Открыть карточку» opened no card on /s/'
      );
      ok(
        !(await d.count('main .selall')) && !(await d.count('.fpill')),
        at + '/s/: a strip or a pill'
      );
    } finally {
      await ctx.close();
    }
  }
  /* At 1920 px the bar shares `main`'s left edge on both pages. */
  for (const id of [LIST_A_ID + ' ~ selecting as gm4', '#/s/player-token-1 ~ selecting']) {
    const { ctx, page } = await openState(id, 1920, 1080, 'ru');
    try {
      const edge = await page.evaluate(() => ({
        bar: document.querySelector('.selbarwrap .selbar')?.getBoundingClientRect().left,
        main: document.querySelector('main')?.getBoundingClientRect().left
      }));
      ok(
        typeof edge.bar === 'number' && Math.abs(edge.bar - edge.main) <= 0.5,
        at + id + ' 1920: the bar does not start at main - ' + JSON.stringify(edge)
      );
    } finally {
      await ctx.close();
    }
  }
}

/** 102. The lists page holds from 320 to 1440 px (docs/specs/FEATURES.md, "Lists"): no
 *  sideways scroll; up to 760 px the `h1`, «Новый список» and «Ещё» share one row from 360 px
 *  (at 320 px the primary and «Ещё» share the row under the `h1`); the
 *  primary and «Ещё» are the thumb's 40 px up to 600 px, and from 761 px the primary ends at
 *  the column's right edge;
 *  the cards of a grid row share one height and never pass the grid; a 120-character name
 *  wraps inside its card; the bar takes at most 45% of 640x360 and starts at `main` from
 *  1180 px; the count is red at the limit. */
async function listsPageHolds() {
  const at = '102 (the lists page): ';
  for (const id of ['#/lists as gm1', '#/lists ~ many lists as gm4']) {
    for (const lang of ['ru', 'en']) {
      for (const [width, height] of [
        [320, 568],
        [360, 640],
        [390, 844],
        [768, 1024],
        [1180, 720],
        [1440, 900]
      ]) {
        const where = at + id + ' ' + width + ' ' + lang + ': ';
        const { ctx, page } = await openState(id, width, height, lang);
        try {
          const m = await page.evaluate(() => {
            const box = (el) => {
              if (!el) return null;
              const r = el.getBoundingClientRect();
              return {
                top: r.top,
                bottom: r.bottom,
                left: r.left,
                right: r.right,
                h: r.height
              };
            };
            const head = document.querySelector('main .page-head');
            const grid = document.querySelector('.listgrid');
            return {
              sideways:
                document.documentElement.scrollWidth > document.documentElement.clientWidth,
              head: box(head),
              h1: box(head?.querySelector('h1')),
              prim: box(head?.querySelector('.btn.primary')),
              more: box(head?.querySelector('.headx [aria-haspopup="menu"]')),
              grid: box(grid),
              cards: [...(grid?.querySelectorAll('.listcard') ?? [])].map(box)
            };
          });
          ok(!m.sideways, where + 'the page scrolls sideways');
          ok(!!m.h1 && !!m.prim, where + 'no h1 or primary in the head - ' + JSON.stringify(m));
          if (!m.h1 || !m.prim) continue;
          const mid = (b) => b.top + b.h / 2;
          if (width <= 760) {
            ok(
              !!m.more &&
                Math.abs(mid(m.prim) - mid(m.more)) <= 1 &&
                (width < 360 || (mid(m.prim) > m.h1.top && mid(m.prim) < m.h1.bottom)),
              where +
                'the h1, the primary and «Ещё» do not share one row - ' +
                JSON.stringify(m)
            );
            ok(
              !!m.more && Math.abs(m.prim.h - 40) <= 0.5 && Math.abs(m.more.h - 40) <= 0.5,
              where + 'the primary and «Ещё» are not 40 px tall - ' + JSON.stringify(m)
            );
          } else {
            ok(
              Math.abs(m.prim.right - m.head.right) <= 1,
              where + 'the primary does not end at the column edge - ' + JSON.stringify(m)
            );
          }
          const rows = new Map();
          for (const c of m.cards) {
            const key = Math.round(c.top);
            rows.set(key, [...(rows.get(key) ?? []), c.h]);
          }
          ok(
            [...rows.values()].every((hs) => Math.max(...hs) - Math.min(...hs) <= 1),
            where + 'the cards of a row differ in height - ' + JSON.stringify([...rows])
          );
          ok(
            !!m.grid &&
              m.cards.every(
                (c) => c.left >= m.grid.left - 0.5 && c.right <= m.grid.right + 0.5
              ),
            where + 'a card passes the grid'
          );
        } finally {
          await ctx.close();
        }
      }
    }
  }
  {
    const where = at + '360, a name of 120 characters: ';
    const long = 'Сокровищница '.repeat(10).slice(0, 120);
    const { ctx, page, d } = await openState('#/lists as gm1', 360, 640, 'ru');
    try {
      await d.fake('setLive', false);
      await d.fake('lists.apply', [
        { op: 'update', id: '00000000-0000-4000-8000-000000000103', patch: { name: long } }
      ]);
      await d.shownAgain();
      await waitIn(page, (v) => document.body.innerText.includes(v), long);
      const m = await page.evaluate((v) => {
        const card = [...document.querySelectorAll('.listcard')].find((c) =>
          c.textContent.includes(v)
        );
        const name = card?.querySelector('.listcard-top b');
        const grid = document.querySelector('.listgrid')?.getBoundingClientRect();
        const r = card?.getBoundingClientRect();
        return {
          sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          inGrid: !!r && !!grid && r.right <= grid.right + 0.5,
          lines: name
            ? Math.round(
                name.getBoundingClientRect().height /
                  parseFloat(getComputedStyle(name).lineHeight)
              )
            : 0
        };
      }, long);
      ok(!m.sideways && m.inGrid && m.lines >= 2, where + JSON.stringify(m));
    } finally {
      await ctx.close();
    }
  }
  {
    const { ctx, page } = await openState('#/lists ~ lists selected as gm1', 640, 360, 'ru');
    try {
      const h = await page.evaluate(
        () => document.querySelector('.selbarwrap')?.getBoundingClientRect().height ?? 0
      );
      ok(h > 0 && h <= 0.45 * 360, at + 'the bar at 640x360 is ' + h + ' px');
    } finally {
      await ctx.close();
    }
  }
  for (const width of [1180, 1440]) {
    const { ctx, page } = await openState('#/lists ~ selecting as gm1', width, 900, 'ru');
    try {
      const edge = await page.evaluate(() => ({
        bar: document.querySelector('.selbarwrap .selbar')?.getBoundingClientRect().left,
        main: document.querySelector('main')?.getBoundingClientRect().left
      }));
      ok(
        typeof edge.bar === 'number' && Math.abs(edge.bar - edge.main) <= 0.5,
        at + width + ': the bar does not start at main - ' + JSON.stringify(edge)
      );
    } finally {
      await ctx.close();
    }
  }
  {
    const { ctx, page } = await openState('#/lists ~ list limit as gm2', 1180, 720, 'ru');
    try {
      const m = await page.evaluate(() => {
        const c = document.querySelector('.count');
        return {
          over: !!c?.classList.contains('over'),
          color: c ? getComputedStyle(c).color : ''
        };
      });
      const [r, g] = (m.color.match(/[\d.]+/g) ?? []).map(Number);
      ok(m.over && r - g > 40, at + 'the count at the limit is not red - ' + JSON.stringify(m));
    } finally {
      await ctx.close();
    }
  }
}

/** 103. The add-to-list menu keeps its place and its keys (docs/specs/FEATURES.md, "Lists"):
 *  on `/i/ci1` and a `/roll/std` result as gm1, at 360 and 1180, RU and EN: the heading, the
 *  checked rows that hold the record, rows of 44 px up to 760 px and 36 px from 761 px, the
 *  menu inside the window and uncovered, Tab and Shift+Tab in DOM order to «Новый список»,
 *  Escape back to the toggle. */
async function addToListMenuKeys() {
  const at = '103 (the add-to-list menu): ';
  for (const route of ['#/i/ci1', '#/roll/std']) {
    for (const lang of ['ru', 'en']) {
      for (const [width, height] of [
        [360, 640],
        [1180, 720]
      ]) {
        const where = at + route + ' ' + width + ' ' + lang + ': ';
        const { ctx, page, d } = await fresh({ width, height, lang });
        try {
          await d.open(route, { as: 'gm1', lang });
          await d.settled(where);
          if (route === '#/i/ci1') await d.press(lang === 'en' ? 'Add to list' : 'В список');
          else await d.openCardList();
          await d.settle();
          const m = await page.evaluate(() => {
            const menu = document.querySelector('.dropmenu');
            const r = menu?.getBoundingClientRect();
            const rows = [...(menu?.querySelectorAll('.lrow') ?? [])];
            const covered = rows.some((row) => {
              const b = row.getBoundingClientRect();
              const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
              return b.bottom <= innerHeight && !(hit && row.contains(hit));
            });
            return {
              head: menu?.querySelector('.lbl')?.textContent ?? '',
              pressed: rows
                .filter((row) => row.getAttribute('aria-pressed') === 'true')
                .map((row) => [
                  row.querySelector('.ln')?.textContent,
                  !!row.querySelector('svg')
                ]),
              heights: rows.map((row) => row.getBoundingClientRect().height),
              inside:
                !!r &&
                r.left >= 0 &&
                r.right <= innerWidth &&
                r.top >= 0 &&
                r.bottom <= innerHeight,
              covered
            };
          });
          ok(
            m.head === (lang === 'en' ? 'Lists' : 'Списки'),
            where + 'the heading - ' + m.head
          );
          ok(
            route !== '#/i/ci1' ||
              (m.pressed.length >= 1 && m.pressed.every(([, check]) => check)),
            where + 'no checked row holds the record - ' + JSON.stringify(m.pressed)
          );
          const want = width <= 760 ? 44 : 36;
          ok(
            m.heights.length > 0 && m.heights.every((h) => Math.abs(h - want) <= 0.5),
            where + 'the rows are not ' + want + ' px - ' + JSON.stringify(m.heights)
          );
          ok(m.inside, where + 'the menu leaves the window');
          ok(!m.covered, where + 'a row is covered');
          await page.evaluate(() =>
            document
              .querySelector('.dropmenu')
              ?.closest('.seldrop')
              ?.querySelector(':scope > .btn')
              ?.focus()
          );
          const walk = [];
          for (let i = 0; i < m.heights.length + 1; i++) {
            await page.keyboard.press('Tab');
            walk.push(
              await page.evaluate(() => document.activeElement?.className.split(' ')[0] ?? '')
            );
          }
          ok(
            walk.slice(0, -1).every((c) => c === 'lrow') && walk.at(-1) === 'lnew',
            where + 'Tab does not walk the rows to «Новый список» - ' + JSON.stringify(walk)
          );
          await page.keyboard.down('Shift');
          await page.keyboard.press('Tab');
          await page.keyboard.up('Shift');
          ok(
            await page.evaluate(() => document.activeElement?.classList.contains('lrow')),
            where + 'Shift+Tab does not return to the last row'
          );
          await page.keyboard.press('Escape');
          await d.settle();
          ok(
            await page.evaluate(
              () =>
                !document.querySelector('.dropmenu') &&
                !!document.activeElement?.matches('.seldrop > .btn')
            ),
            where + 'Escape does not close the menu onto its toggle'
          );
        } finally {
          await ctx.close();
        }
      }
    }
  }
}

/** 104. The number stepper is laid out as a stepper (owner, 2026-11-05; docs/specs/FEATURES.md,
 *  "Rolling"): on `/roll/std`, `/roll/wondrous` and `/roll/alt` at 360, 390, 768 and 1180,
 *  RU and EN, the value is centered in its box within 1.5 px, «+» ends at the box's right
 *  edge, and the box is `min(480, column)` wide (the alt pair: its block); the field is 46 px
 *  tall. The list page's price-sheet steppers keep their own narrow size. */
async function numberStepperLayout() {
  const at = '104 (the number stepper): ';
  for (const id of ['#/roll/std', '#/roll/wondrous', '#/roll/alt']) {
    for (const lang of ['ru', 'en']) {
      for (const [width, height] of [
        [360, 800],
        [390, 844],
        [768, 1024],
        [1180, 800]
      ]) {
        const where = at + id + ' ' + width + ' ' + lang + ': ';
        const { ctx, page, d } = await openState(id, width, height, lang);
        try {
          if (width <= 760) {
            await d.click(lang === 'en' ? 'Set up' : 'Настроить');
            await d.settle();
          }
          const m = await page.evaluate(() =>
            [...document.querySelectorAll('.numbox')]
              .filter((n) => n.getBoundingClientRect().width > 0)
              .map((n) => {
                const b = n.getBoundingClientRect();
                const input = n.querySelector('input').getBoundingClientRect();
                const plus = n.querySelector('button:last-of-type').getBoundingClientRect();
                const col = n.parentElement.getBoundingClientRect().width;
                return {
                  alt: !!n.closest('.dieblock'),
                  center: input.left + input.width / 2 - (b.left + b.width / 2),
                  plusGap: b.right - plus.right,
                  w: b.width,
                  col,
                  h: input.height
                };
              })
          );
          ok(m.length > 0, where + 'no number box');
          for (const n of m) {
            /* A lone field fills its column up to 480 px (DESIGN.md "Components", "The
               Stepper Rule"); the alt roll's pair takes its die block. */
            const want = n.alt ? n.col : Math.min(480, n.col);
            ok(
              Math.abs(n.center) <= 1.5 &&
                n.plusGap >= 0 &&
                n.plusGap <= 2 &&
                Math.abs(n.w - want) <= 1 &&
                Math.abs(n.h - 46) <= 0.5,
              where + JSON.stringify(n)
            );
          }
          ok(
            !(await page.evaluate(
              () => document.documentElement.scrollWidth > document.documentElement.clientWidth
            )),
            where + 'the page scrolls sideways'
          );
        } finally {
          await ctx.close();
        }
      }
    }
  }
  {
    const { ctx, page } = await openState(LIST_A_ID + ' ~ price sheet as gm4', 1180, 720, 'ru');
    try {
      const m = await page.evaluate(() =>
        [...document.querySelectorAll('.money-act .numbox')].map((n) => {
          const kids = [...n.children].reduce((s, k) => s + k.getBoundingClientRect().width, 0);
          return {
            input: n.querySelector('input').getBoundingClientRect().width,
            grew: n.getBoundingClientRect().width - kids
          };
        })
      );
      ok(
        m.length > 0 && m.every((n) => Math.abs(n.input - 52) <= 0.5 && n.grew <= 2.5),
        at + 'the price-sheet steppers changed size - ' + JSON.stringify(m)
      );
    } finally {
      await ctx.close();
    }
  }
  /* The list roll's field sits in a row with its button: it keeps its content width. */
  for (const width of [768, 1180]) {
    /* Up to 999 px «Бросить по списку» is an item of the list «Ещё»: entered at 1180. */
    const { ctx, page } = await openState(
      LIST_A_ID + ' ~ roll panel as gm4',
      width,
      800,
      'ru',
      width < 1000
    );
    try {
      const w = await page.evaluate(
        () => document.querySelector('.numbox')?.getBoundingClientRect().width ?? null
      );
      ok(w !== null && w <= 160, at + 'the list roll field grew at ' + width + ' - ' + w);
    } finally {
      await ctx.close();
    }
  }
}

/** 105. The list page layout (docs/specs/FEATURES.md, "Lists"; DESIGN.md, "The Two
 *  Breakpoints Rule"): at 768 px the compact head sits above the rows, no side column, and
 *  each row's controls take a line under its body; at 1000 and 1180 px the 330 px side column is at the
 *  right of the rows, first in the DOM, and at 1180 a row's controls are inline; at 1920 and
 *  2560 px the side column keeps 330 px and a row's text ends within 24 px of its quantity
 *  field. `#/s/` keeps one column and its row text takes the row. Nothing scrolls sideways. */
async function listPageLayout() {
  const at = '105 (the list page layout): ';
  const SIZES = [
    [768, 1024],
    [1000, 800],
    [1180, 800],
    [1920, 1080],
    [2560, 1440]
  ];
  for (const id of [LIST_A_ID + ' ~ many as gm4', '#/s/player-token-1']) {
    for (const lang of ['ru', 'en']) {
      for (const [width, height] of SIZES) {
        const where = at + id + ' ' + width + ' ' + lang + ': ';
        const { ctx, page } = await openState(id, width, height, lang);
        try {
          const m = await page.evaluate(() => {
            /* A plain object: a DOMRect's fields are getters puppeteer does not carry. */
            const box = (e) => {
              if (!e) return null;
              const r = e.getBoundingClientRect();
              return {
                top: r.top,
                bottom: r.bottom,
                left: r.left,
                right: r.right,
                width: r.width
              };
            };
            const side = document.querySelector('.lside');
            const head = document.querySelector('.lhead');
            const main = document.querySelector('.lmain');
            const rows = [...document.querySelectorAll('.lrows > .lrow, .rows > .row')];
            return {
              side: box(side),
              head: box(head),
              main: box(main),
              sideFirst:
                !!side &&
                !!main &&
                !!(side.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING),
              rowsTop: box(document.querySelector('.lrows, .rows'))?.top ?? null,
              rows: rows.slice(0, 6).map((r) => {
                const body = box(r.querySelector('.row-main'));
                const rt = box(r.querySelector('.row-main .rt'));
                const ctl = box(r.querySelector('.lrow-ctl'));
                const qty = box(r.querySelector('.lrow-meta label'));
                const rtMax = r.querySelector('.row-main .rt')
                  ? getComputedStyle(r.querySelector('.row-main .rt')).maxWidth
                  : null;
                return { body, rt, ctl, qty, rtMax, rowRight: r.getBoundingClientRect().right };
              }),
              sideways:
                document.documentElement.scrollWidth > document.documentElement.clientWidth
            };
          });
          ok(!m.sideways, where + 'the page scrolls sideways');
          ok(m.rows.length > 0, where + 'no rows');
          if (id.startsWith('#/s/')) {
            ok(!m.side, where + 'the shared page draws a side column');
            for (const r of m.rows) {
              ok(r.rtMax === 'none', where + 'a row text keeps a cap - ' + r.rtMax);
              ok(
                !!r.body && !!r.rt && r.body.right - r.rt.right <= 16,
                where + 'a row text stops short of its row - ' + JSON.stringify(r)
              );
            }
            continue;
          }
          if (width < 1000) {
            ok(
              !m.side && !!m.head && m.head.bottom <= m.rowsTop + 1,
              where +
                'the compact head is not above the rows - ' +
                JSON.stringify([m.side, m.head])
            );
            for (const r of m.rows) {
              ok(
                !!r.ctl && !!r.body && r.ctl.top >= r.body.bottom - 1,
                where + "a row's controls are not under its body - " + JSON.stringify(r)
              );
            }
          } else {
            ok(!!m.side && m.sideFirst, where + 'the side column is not first in the DOM');
            ok(
              !!m.side && Math.abs(m.side.width - 330) <= 1 && m.side.left >= m.main.right,
              where + 'the side column is not 330 px at the right - ' + JSON.stringify(m.side)
            );
            if (width >= 1180) {
              for (const r of m.rows) {
                ok(
                  !!r.ctl && !!r.body && r.ctl.top < r.body.bottom,
                  where + "a row's controls are not inline - " + JSON.stringify(r)
                );
              }
            }
            if (width >= 1920) {
              for (const r of m.rows) {
                ok(
                  !!r.rt && !!r.qty && r.qty.left - r.rt.right <= 24,
                  where + 'a row text ends short of its quantity - ' + JSON.stringify(r)
                );
              }
            }
          }
        } finally {
          await ctx.close();
        }
      }
    }
  }
}

/** The description box of a row (`RowMain.svelte`). */
const DESC = '.row-main:not(.full) .rt > span:not(.rh):not(.rstats)';

/** Reads every drawn row's text box on the page once the rows stop drawing. */
function rowTextOf(page) {
  return page.evaluate(async (DESC) => {
    await document.fonts.ready;
    for (let i = 0; i < 60 && document.querySelector('[data-drawing]'); i++)
      await new Promise((r) => setTimeout(r, 100));
    scrollTo(0, 0);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const out = { described: 0, clamped: 0, capped: [], freeCut: 0, hOver: 0, wrapBreak: 0 };
    out.partial = 0;
    out.lineHeights = [];
    out.names = [];
    for (const r of document.querySelectorAll('.rows > .row, .lrows > .lrow')) {
      const rt = r.querySelector('.row-main .rt');
      if (!rt) continue;
      const body = r.querySelector('.row-main');
      const bs = getComputedStyle(body);
      const cs = getComputedStyle(rt);
      if (cs.maxWidth !== 'none') out.capped.push(cs.maxWidth);
      const contentRight = body.getBoundingClientRect().right - parseFloat(bs.paddingRight);
      if (contentRight - rt.getBoundingClientRect().right > 16) out.capped.push('short');
      const d = r.querySelector(DESC);
      if (!d) continue;
      out.described++;
      const ds = getComputedStyle(d);
      const lh = parseFloat(ds.lineHeight);
      out.lineHeights.push(Math.round((lh / parseFloat(ds.fontSize)) * 100) / 100);
      if (d.scrollWidth > d.clientWidth + 1) out.hOver++;
      if (/anywhere|break-word/.test(ds.overflowWrap) || ds.wordBreak === 'break-all')
        out.wrapBreak++;
      if (d.scrollHeight > d.clientHeight + 1) {
        out.clamped++;
        out.names.push(r.querySelector('.rname')?.textContent ?? '');
        const lines = d.clientHeight / lh;
        if (Math.abs(lines - Math.round(lines)) > 0.05) out.partial++;
        /* Cut while free: a clamped box 40 px or more short of its row's content edge,
           the width a cap would take (a multi-paragraph text ends its lines early by
           content, so the text's own last line is no measure). */
        if (contentRight - d.getBoundingClientRect().right >= 40) out.freeCut++;
      }
    }
    return out;
  }, DESC);
}

/** 106. The Row Text Rule and the Field Measure Rule (DESIGN.md "Components", "Named
 *  Rules"): at 1180, 1440 and 1920 px a row's text takes the free width of its row (no cap),
 *  a clamped description is cut only when it is longer than its clamp, at most 15% of the
 *  described rows clamp (the Vault of Ages rules text and the ten rows of `/s/` are logged
 *  only), whole lines, no sideways cut and no word break, the owner's two rows whole at 1440
 *  and 1920; the clamp is 3 lines up to 600 px and from 1000 px, 2 between, with a 1.55
 *  line height from 1000 px; the `/s/` tail and its GM note hold no gold; a search box is at
 *  most 720 px from 761 px with its next control right after it. */
async function rowTextAndFieldMeasure() {
  const at = '106 (row text and field measure): ';
  const LOGGED = new Set(['#/tables/voa', '#/s/player-token-1']);
  for (const id of [
    '#/search ~ searched',
    '#/search ~ capped',
    '#/tables/eq_weapon',
    '#/tables/wondrous',
    '#/tables/hnf_consumable',
    '#/tables/voa',
    '#/s/player-token-1'
  ]) {
    for (const lang of ['ru', 'en']) {
      for (const [width, height] of [
        [1180, 720],
        [1440, 900],
        [1920, 1080]
      ]) {
        const where = at + id + ' ' + width + ' ' + lang + ': ';
        const { ctx, page } = await openState(id, width, height, lang);
        try {
          const m = await rowTextOf(page);
          const share = m.described ? (100 * m.clamped) / m.described : 0;
          fs.writeSync(
            1,
            '  row text: ' +
              id +
              ' ' +
              width +
              ' ' +
              lang +
              ' clamped ' +
              m.clamped +
              '/' +
              m.described +
              ' (' +
              share.toFixed(1) +
              '%)\n'
          );
          ok(
            !m.capped.length,
            where + 'a row text is capped - ' + m.capped.slice(0, 3).join(',')
          );
          ok(!m.freeCut, where + m.freeCut + ' rows are cut while their line has room');
          ok(!m.hOver && !m.wrapBreak, where + 'a row text is cut inside a word');
          ok(!m.partial, where + m.partial + ' clamped rows show a part line');
          ok(
            m.lineHeights.every((x) => Math.abs(x - 1.55) <= 0.01),
            where + 'the description line height is not 1.55 - ' + m.lineHeights.slice(0, 3)
          );
          if (!LOGGED.has(id) && m.described >= 20)
            ok(share <= 15, where + 'more than 15% of described rows clamp - ' + share);
          if (width >= 1440)
            for (const name of ['Фляга Путника', 'Мешок Собирателя', "Wanderer's Flask"])
              ok(!m.names.includes(name), where + '«' + name + '» is clamped');
        } finally {
          await ctx.close();
        }
      }
    }
  }

  /* The clamp and the line height by width, on one table. */
  {
    const { ctx, page, d } = await openState('#/tables/eq_weapon', 1180, 800, 'ru');
    try {
      for (const [w, lines, lh] of [
        [360, '3', 1.45],
        [390, '3', 1.45],
        [600, '3', 1.45],
        [601, '2', 1.45],
        [768, '2', 1.45],
        [999, '2', 1.45],
        [1000, '3', 1.55],
        [1180, '3', 1.55]
      ]) {
        await d.viewport(w, 800);
        const got = await page.evaluate((DESC) => {
          const e = document.querySelector(DESC);
          if (!e) return null;
          const c = getComputedStyle(e);
          return {
            clamp: c.webkitLineClamp,
            lh: Math.round((parseFloat(c.lineHeight) / parseFloat(c.fontSize)) * 100) / 100
          };
        }, DESC);
        ok(
          !!got && got.clamp === lines && Math.abs(got.lh - lh) <= 0.01,
          at + 'at ' + w + ' px the clamp or the line height is off - ' + JSON.stringify(got)
        );
      }
    } finally {
      await ctx.close();
    }
  }

  /* The `/s/` tail is monospace and neutral; the GM note box draws no gold. */
  {
    const { ctx, page } = await openState('#/s/gm-token-1', 1180, 800, 'ru');
    try {
      const got = await page.evaluate(() => {
        const tail = document.querySelector('.rtail');
        const note = document.querySelector('.hitnote.gm');
        const gold = (c) => /216,\s*171,\s*94|240,\s*208,\s*145/.test(c);
        return {
          tail: tail
            ? { color: getComputedStyle(tail).color, font: getComputedStyle(tail).fontFamily }
            : null,
          noteGold: note
            ? gold(getComputedStyle(note).borderTopColor) ||
              gold(getComputedStyle(note).backgroundColor)
            : null
        };
      });
      ok(
        !!got.tail &&
          !/240,\s*208,\s*145/.test(got.tail.color) &&
          /monospace/.test(got.tail.font),
        at + 'the /s/ tail is gold or proportional - ' + JSON.stringify(got.tail)
      );
      ok(got.noteGold === false, at + 'the GM note box draws gold - ' + JSON.stringify(got));
    } finally {
      await ctx.close();
    }
  }

  /* Field Measure: the box is at most 720 px from 761 px, its next control follows it; up to
     760 px it fills its row as before. */
  for (const id of [
    '#/search ~ searched',
    '#/tables/eq_weapon',
    '#/homebrew as gm3',
    '#/lists ~ many lists as gm4',
    LIST_A_ID + ' ~ many as gm4'
  ]) {
    for (const [width, height] of [
      [390, 844],
      [768, 1024],
      [1920, 1080]
    ]) {
      const where = at + id + ' ' + width + ': ';
      const { ctx, page } = await openState(id, width, height, 'ru');
      try {
        const m = await page.evaluate(() => {
          const input = document.querySelector('main input[type="search"]');
          const grow = input?.closest('.grow');
          if (!grow) return null;
          const g = grow.getBoundingClientRect();
          const next = grow.nextElementSibling?.getBoundingClientRect();
          return { w: g.width, gap: next && next.top < g.bottom ? next.left - g.right : null };
        });
        ok(!!m, where + 'no search box');
        if (!m) continue;
        ok(m.w <= 720.5, where + 'the search box is wider than 720 px - ' + m.w);
        if (width >= 1920 && m.gap !== null)
          ok(m.gap <= 16, where + 'the next control does not follow the box - ' + m.gap);
      } finally {
        await ctx.close();
      }
    }
  }
}

/** 107. The note switch, the requests fold and the price switch in a real browser: a typed
 *  players' note kept across a switch made inside the store's quiet time and a reload; the
 *  requests panel opens and folds by its head; the price switch moves every drawn price. */
async function noteSwitchInABrowser() {
  const at = '107 (the note switch): ';
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  const listId = await openAccountList(
    d,
    { n: 1, name: 'Тайник', ids: ['ci1', 'ci2'], meta: { ci2: { gold: 750, qty: 2 } } },
    '107'
  );
  await page.evaluate(() => document.querySelector('.lnotes .nopen button')?.click());
  await d.settle();
  await d.type('Например: лавка закрыта до утра', 'Закрыто до рассвета');
  await d.click('Только для мастера');
  await d.click('Для игроков, заполнена');
  const kept = await page.evaluate(
    () => document.querySelector('.lnotes .narea textarea')?.value ?? null
  );
  ok(kept === 'Закрыто до рассвета', at + 'the switch dropped the typed note - ' + kept);
  /* Away and back: the fake cloud lives in the page, so a reload would reset it. */
  await d.writesSettled();
  await d.go('#/lists');
  await d.go('#/lists/' + listId);
  ok(
    await waitIn(page, bodyHas, 'Закрыто до рассвета'),
    at + 'the note did not survive leaving the page'
  );

  const priceOf = () =>
    page.evaluate(() => document.querySelector('.lprices .pex')?.textContent.trim() ?? '');
  const bag = await priceOf();
  await d.click('Монетами');
  const coin = await priceOf();
  ok(
    bag !== coin && /750/.test(coin),
    at + 'the price switch did not move the example - ' + coin
  );
  await ctx.close();

  /* At 360 px the notes of an unfolded compact row, read-only and open, take the width of
     the unfolded part: no second indent under it, and no sideways scroll. */
  for (const lang of ['ru', 'en']) {
    const n = await fresh({ width: 360, height: 640 });
    try {
      await openAccountList(
        n.d,
        {
          n: 1,
          name: 'Тайник',
          ids: ['ci1', 'ci2'],
          meta: { ci1: { note: 'Светится в темноте', hnote: 'Проклят' } }
        },
        '107'
      );
      if (lang === 'en') await n.d.click('EN');
      await n.d.unfold(0);
      const width = () =>
        n.page.evaluate(() => {
          const body = document.querySelector('.lrow .cfull');
          const note = body?.querySelector('.rnote');
          /* The content box: a padded note box is as wide as its row and still narrow. */
          const inner = (e) => {
            const cs = getComputedStyle(e);
            return e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
          };
          return {
            row: body ? inner(body) : 0,
            note: note ? inner(note) : 0,
            scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth
          };
        });
      const ro = await width();
      ok(
        ro.note >= ro.row - 24 && ro.scroll <= 0,
        at + '360 ' + lang + ': the read-only row notes are narrow - ' + JSON.stringify(ro)
      );
      await n.page.click('.lrow .cfull [data-note-open]');
      await n.d.settle();
      const open = await width();
      ok(
        open.note >= open.row - 24 && open.scroll <= 0,
        at + '360 ' + lang + ': the open note area is narrow - ' + JSON.stringify(open)
      );
    } finally {
      await n.ctx.close();
    }
  }

  const r = await fresh({ width: 1180, height: 900 });
  try {
    await r.d.open(SHOP, { as: 'gm1' });
    await waitIn(r.page, () => !!document.querySelector('h1 input'));
    await r.d.fake('request', 'player-token-1', [{ item: 'ci1', qty: 1 }]);
    ok(await waitIn(r.page, bodyHas, 'Новое в списке (1)'), at + 'the request did not draw');
    const state = () =>
      r.page.evaluate(() => ({
        expanded: document.querySelector('.reqhead button')?.getAttribute('aria-expanded'),
        reqs: document.querySelectorAll('.reqpanel .req').length
      }));
    const folded = await state();
    ok(
      folded.expanded === 'false' && folded.reqs === 0,
      at + 'not folded - ' + JSON.stringify(folded)
    );
    await r.page.evaluate(() => document.querySelector('.reqhead button')?.click());
    await r.d.settle();
    const open = await state();
    ok(
      open.expanded === 'true' && open.reqs === 1,
      at + 'did not open - ' + JSON.stringify(open)
    );
    await r.page.evaluate(() => document.querySelector('.reqhead button')?.click());
    await r.d.settle();
    const again = await state();
    ok(again.reqs === 0, at + 'did not fold again - ' + JSON.stringify(again));
  } finally {
    await r.ctx.close();
  }
}

/** Opens inventory state `id` at 360x640 in `lang` and records in the page when the first
 *  toast shows (`__toastAt`, the page clock), so a case reads a toast's age. */
async function openToasting(id, lang) {
  const state = STATES.find((s) => s.id === id);
  if (!state) throw new Error('no inventory state ' + id);
  const got = await fresh({ width: 360, height: 640, storage: state.storage });
  await got.page.evaluateOnNewDocument(() => {
    new MutationObserver(() => {
      const t = document.querySelector('.toast.page[role]');
      if (t && window.__toastAt === undefined) window.__toastAt = performance.now();
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['role'] });
  });
  await got.d.open(state.route, {
    as: state.as,
    items: state.items,
    sections: state.sections,
    sources: state.sources,
    hold: state.hold
  });
  if (state.enter) await state.enter(got.d);
  await got.d.settled(state.id);
  /* The switch redraws a shown toast in English and keeps its deadline. */
  if (lang === 'en') await got.d.click('EN');
  return got;
}

/** Waits until the shown toast is `ms` old and answers whether a toast still shows. */
function toastAt(page, ms) {
  return page.evaluate(async (at) => {
    for (let i = 0; i < 400 && window.__toastAt === undefined; i++)
      await new Promise((r) => setTimeout(r, 25));
    if (window.__toastAt === undefined) return null;
    const wait = window.__toastAt + at - performance.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    return !!document.querySelector('.toast.page[role]');
  }, ms);
}

/** 108. The toasts in a real browser (DESIGN.md, "The Reading Time Rule"), 360x640: a plain
 *  toast lives 4000 ms, an error 7000 ms, a long one 10000 ms and takes three lines; a
 *  pointer on a toast holds it and it runs on when the pointer leaves; the page's toast sits
 *  above the selection bar. The toast over a result's «Ещё» is measured, not asserted. */
async function toastsInABrowser() {
  const at = '108 (the toasts): ';
  for (const lang of ['ru', 'en']) {
    const en = lang === 'en';
    const plain = async () => {
      const o = await openToasting('#/tables/eq_weapon', lang);
      await o.page.evaluate(() => document.querySelector('main .tsec-link')?.click());
      return o;
    };
    const runs = [
      /* (a) A plain toast: a section link copied. */
      async () => {
        const o = await plain();
        try {
          const a = await toastAt(o.page, 3500);
          const b = await toastAt(o.page, 4600);
          ok(
            a === true && b === false,
            at + lang + ' (a): the plain toast at 3.5 s / 4.6 s - ' + a + ' / ' + b
          );
        } finally {
          await o.ctx.close();
        }
      },
      /* (b) An error toast: the last source pressed off. */
      async () => {
        const o = await openToasting('#/roll/std ~ set up', lang);
        try {
          for (let i = 0; i < 3; i++) {
            const pressed = await o.page.evaluate(() => {
              if (document.querySelector('.toast.page[role="alert"]')) return false;
              const on = document.querySelector('button.chip[data-val][aria-pressed="true"]');
              on?.click();
              return !!on;
            });
            if (!pressed) break;
            await o.d.settle();
          }
          const a = await toastAt(o.page, 5000);
          const b = await toastAt(o.page, 6500);
          const c = await toastAt(o.page, 7600);
          ok(
            a === true && b === true && c === false,
            at + lang + ' (b): the error toast at 5 / 6.5 / 7.6 s - ' + [a, b, c].join(' / ')
          );
        } finally {
          await o.ctx.close();
        }
      },
      /* (c) A pointer on a plain toast holds it; it runs on with the time it had left. */
      async () => {
        const o = await plain();
        try {
          await toastAt(o.page, 1000);
          const box = await o.page.evaluate(() => {
            const r = document.querySelector('.toast.page[role]')?.getBoundingClientRect();
            return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
          });
          ok(!!box, at + lang + ' (c): no toast to point at');
          if (!box) return;
          await o.page.mouse.move(box.x, box.y);
          const held = await toastAt(o.page, 6000);
          await o.page.mouse.move(5, 300);
          const left = await o.page.evaluate(() => performance.now());
          const gone = await o.page.evaluate(async () => {
            for (let i = 0; i < 200 && document.querySelector('.toast.page[role]'); i++)
              await new Promise((r) => setTimeout(r, 25));
            return performance.now();
          });
          ok(
            held === true && gone - left <= 3600 && gone - left >= 2000,
            at +
              lang +
              ' (c): held ' +
              held +
              ', gone ' +
              Math.round(gone - left) +
              ' ms after the pointer left'
          );
        } finally {
          await o.ctx.close();
        }
      },
      /* (d) A long toast: the list limit with its email address. */
      async () => {
        const o = await openToasting('#/lists ~ list limit as gm2', lang);
        try {
          const lines = await o.page.evaluate(() => {
            const t = document.querySelector('.toast.page[role]');
            if (!t) return 0;
            const cs = getComputedStyle(t);
            const inner =
              t.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
            return Math.round(inner / parseFloat(cs.lineHeight));
          });
          const a = await toastAt(o.page, 9000);
          const b = await toastAt(o.page, 10600);
          ok(
            a === true && b === false,
            at + lang + ' (d): the long toast at 9 / 10.6 s - ' + a + ' / ' + b
          );
          if (!en)
            ok(lines >= 3, at + 'ru (d): the long toast takes ' + lines + ' lines at 360');
        } finally {
          await o.ctx.close();
        }
      }
    ];
    await Promise.all(runs.map((f) => f()));

    /* (e) The page's toast floats above the selection bar. */
    {
      const { ctx, page } = await openState('#/tables/eq_weapon ~ selecting', 360, 640, lang);
      try {
        await page.evaluate(() => {
          const boxes = [...document.querySelectorAll('main .selbox input')].slice(0, 2);
          for (const b of boxes) b.click();
        });
        await page.evaluate(
          (name) => {
            const b = [...document.querySelectorAll('.selbarwrap button')].find(
              (x) => x.textContent.trim() === name
            );
            b?.click();
          },
          en ? 'Copy text' : 'Скопировать текст'
        );
        ok(
          await waitIn(page, () => !!document.querySelector('.toast.page[role]')),
          at + lang + ' (e): no toast after «Скопировать текст»'
        );
        const m = await page.evaluate(() => ({
          toast: document.querySelector('.toast.page[role]')?.getBoundingClientRect().bottom,
          bar: document.querySelector('.selbarwrap')?.getBoundingClientRect().top
        }));
        ok(
          m.toast !== undefined && m.bar !== undefined && m.toast <= m.bar + 0.5,
          at + lang + ' (e): the toast covers the selection bar - ' + JSON.stringify(m)
        );
      } finally {
        await ctx.close();
      }
    }

    /* (f) A toast over a roll result's open «Ещё»: logged for DEBT.md, not asserted. */
    {
      const { ctx, page, d } = await openState('#/roll/std ~ card more', 360, 640, lang);
      try {
        /* The press on «EN» closes the menu: open it again. */
        if (!(await page.$('[role="menu"] [role="menuitem"]'))) await d.openCardMore();
        await page.evaluate(() =>
          document.querySelector('[role="menu"] [role="menuitem"]')?.click()
        );
        await d.settle();
        await d.openCardMore();
        const m = await page.evaluate(() => {
          const t = document.querySelector('.toast.page[role]')?.getBoundingClientRect();
          const items = [...document.querySelectorAll('[role="menu"] [role="menuitem"]')];
          const last = items.at(-1)?.getBoundingClientRect();
          if (!t || !last) return { toast: !!t, last: !!last };
          const v = Math.max(0, Math.min(t.bottom, last.bottom) - Math.max(t.top, last.top));
          const h = Math.max(0, Math.min(t.right, last.right) - Math.max(t.left, last.left));
          return {
            toastTop: Math.round(t.top),
            lastBottom: Math.round(last.bottom),
            overlap: Math.round(v * h)
          };
        });
        fs.writeSync(1, '  toast over «Ещё» (f) 360 ' + lang + ': ' + JSON.stringify(m) + '\n');
      } finally {
        await ctx.close();
      }
    }
  }
}

/** The open layers `sweep.js` does not open, read by case 109. */
const TARGET_LAYERS = [
  '#/tables/eq_weapon ~ filter sheet',
  '#/tables/eq_weapon ~ table picker',
  '#/tables/eq_weapon ~ more menu',
  '#/tables/eq_weapon ~ selecting',
  '#/tables ~ a row opened',
  '#/tables/eq_weapon ~ a row opened, actions menu',
  '#/tables ~ a row opened, list menu as gm4',
  '#/tables ~ bar menu as gm4',
  '#/i/ci1 ~ list menu as gm1',
  '#/i/q1 ~ more as gm3',
  '#/roll/std ~ set up',
  '#/roll/std ~ more',
  '#/roll/std ~ card more',
  '#/roll/vault_of_ages ~ picker sheet',
  '#/search ~ more',
  '#/search ~ selecting',
  '#/lists ~ more as gm1',
  '#/lists ~ card menu as gm1',
  '#/lists ~ selecting as gm1',
  '#/lists ~ import panel as gm1',
  '#/s/player-token-1 ~ selecting',
  '#/homebrew ~ more as gm3',
  '#/homebrew ~ filter sheet as gm3',
  '#/homebrew ~ select narrow as gm3',
  '#/homebrew ~ bar more as gm3',
  '#/homebrew/new ~ preview sheet as gm1',
  '#/homebrew/new ~ picker open as gm1',
  '#/homebrew/new ~ crop dialog as gm1',
  '#/account ~ delete confirmation as gm1',
  LIST_A_ID + ' ~ more as gm4',
  LIST_A_ID + ' ~ row more as gm4',
  LIST_A_ID + ' ~ note open as gm4',
  LIST_A_ID + ' ~ selecting as gm4',
  LIST_A_ID + ' ~ compact, selecting as gm4',
  LIST_A_ID + ' ~ price sheet as gm4',
  /* «Макс» and the take field; «Мин» is in `~ compact, selecting`. */
  LIST_A_ID + ' ~ picked as gm4',
  SHOP + ' ~ requests open as gm1',
  SHOP + ' ~ share as gm1',
  SHOP + ' ~ many requests as gm1',
  SHOP + ' ~ not saved as gm1',
  GM2_LIST_ID + ' ~ notices open as gm2',
  '#/i/ci1',
  '#/h/00000000-0000-4000-8000-000000000513 as gm1'
];

/** The layers case 109 also reads at 1180x720 with the 24 px floor and its spacing. */
const TARGET_LAYERS_WIDE = [
  '#/roll/vault_of_ages ~ supplements sheet',
  SHOP + ' ~ share as gm1',
  SHOP + ' ~ not saved as gm1',
  GM2_LIST_ID + ' ~ notices open as gm2',
  '#/i/ci1',
  '#/h/00000000-0000-4000-8000-000000000513 as gm1'
];

/** 109. Every open layer at 360x640 holds thumb targets (DESIGN.md, "The Phone-First
 *  Rule"): `targets` finds no control under 40 px (44 px for a menu item) that its hit test
 *  does not prove, in RU and EN; the wide layers hold 24 px targets at 1180x720. */
async function targetsInOpenLayers() {
  const at = '109 (the targets of open layers): ';
  for (const id of TARGET_LAYERS) {
    for (const lang of ['ru', 'en']) {
      /* A state whose control draws from 761 px only is entered there (`wideEnter`). */
      const { ctx, page } = await openState(
        id,
        360,
        640,
        lang,
        /~ (note open|share|not saved) as gm[14]$/.test(id)
      );
      try {
        const got = await targets(page, { floor: 40, menuFloor: 44 });
        for (const t of got)
          ok(
            false,
            at + id + ' ' + lang + ': ' + t.sel + ' «' + t.name + '» ' + t.w + 'x' + t.h
          );
      } finally {
        await ctx.close();
      }
    }
  }
  for (const id of TARGET_LAYERS_WIDE) {
    for (const lang of ['ru', 'en']) {
      const { ctx, page } = await openState(id, 1180, 720, lang);
      try {
        const got = await targets(page, { floor: 24, spacing: true });
        for (const t of got)
          ok(
            false,
            at + id + ' 1180 ' + lang + ': ' + t.sel + ' «' + t.name + '» ' + t.w + 'x' + t.h
          );
      } finally {
        await ctx.close();
      }
    }
  }
}

/** The empty plates of DESIGN.md, "Empty state": the inventory states that draw one. */
const PLATES = [
  '#/search',
  '#/search ~ narrow',
  '#/search ~ nothing found',
  '#/search ~ nothing found, kind picked',
  '#/tables ~ nothing found',
  '#/tables/eq_armor ~ nothing found',
  '#/tables/wondrous ~ nothing found',
  '#/tables/homebrew as gm2',
  '#/homebrew ~ no match as gm3',
  '#/homebrew/sets ~ empty as gm4',
  '#/homebrew/rules ~ empty as gm4',
  '#/lists',
  '#/lists ~ empty as gm4',
  '#/lists ~ nothing found as gm4',
  LIST_A_ID + ' ~ no match as gm4',
  '#/s/player-token-1 ~ no match'
];

/** Reads the first drawn plate in `main`: its four border styles, its ground, the gap from
 *  the lowest block above it that overlaps it sideways, and the filter column's top. */
function plateProbe() {
  const vis = (e) => {
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const plate = [...document.querySelectorAll('main .empty')].find(vis);
  if (!plate) return null;
  const pr = plate.getBoundingClientRect();
  let above = null;
  for (const e of document.querySelectorAll('main *')) {
    if (e === plate || e.contains(plate) || plate.contains(e) || !vis(e)) continue;
    /* An open sheet lies over the page, not above the plate. */
    if (e.closest('dialog')) continue;
    const r = e.getBoundingClientRect();
    if (r.bottom > pr.top + 0.5 || r.right <= pr.left || r.left >= pr.right) continue;
    if (!above || r.bottom > above.bottom) above = { bottom: r.bottom, el: e.className };
  }
  const cs = getComputedStyle(plate);
  const col = document.querySelector('main .fcol');
  return {
    borders: [cs.borderTopStyle, cs.borderRightStyle, cs.borderBottomStyle, cs.borderLeftStyle],
    ground: cs.backgroundColor,
    gap: above ? Math.round((pr.top - above.bottom) * 10) / 10 : null,
    above: above ? String(above.el).slice(0, 60) : null,
    colTop: col && vis(col) ? col.getBoundingClientRect().top - pr.top : null
  };
}

/** 110. The empty plate (DESIGN.md, "Empty state", "The Drop Rule"): a solid border on
 *  every side on the Vault Wall ground, 16 px under the block above it, and beside the
 *  filter column on the column's top. */
async function emptyPlate() {
  const at = '110 (the empty plate): ';
  for (const id of PLATES) {
    for (const [width, height] of [
      [360, 640],
      [1180, 720]
    ]) {
      for (const lang of ['ru', 'en']) {
        const where = at + id + ' ' + width + ' ' + lang + ': ';
        /* A state whose controls draw from 761 px or 1000 px is entered at 1180 px. */
        const wide = width < 761 && /kind picked|eq_armor|wondrous/.test(id);
        const { ctx, page } = await openState(id, width, height, lang, wide);
        try {
          const m = await page.evaluate(plateProbe);
          fs.writeSync(1, '  plate: ' + where + JSON.stringify(m) + '\n');
          ok(!!m, where + 'no plate');
          if (!m) continue;
          ok(
            m.borders.every((b) => b === 'solid'),
            where + 'the border is not solid - ' + m.borders.join(' ')
          );
          ok(m.ground === 'rgb(20, 17, 29)', where + 'the ground is ' + m.ground);
          ok(
            m.gap !== null && Math.abs(m.gap - 16) <= 0.5,
            where + 'the gap above the plate is ' + m.gap + ' (under ' + m.above + ')'
          );
          if (m.colTop !== null)
            ok(
              Math.abs(m.colTop) <= 0.5,
              where + 'the filter column starts ' + m.colTop + ' px off the plate'
            );
        } finally {
          await ctx.close();
        }
      }
    }
  }
}

/** Reads a text block's measure: its max-width and the width of 120ch and 70ch in its own
 *  font, its drawn lines (the line boxes of its text), its widest line, its one-line width
 *  and the free width of its parent. */
function measureProbe(sel) {
  const els = [...document.querySelectorAll(sel)].filter((e) => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden';
  });
  return els.map((e) => {
    const cs = getComputedStyle(e);
    const probe = document.createElement('span');
    probe.textContent = '0'.repeat(100);
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:inherit';
    e.appendChild(probe);
    const ch = probe.getBoundingClientRect().width / 100;
    probe.remove();
    const range = document.createRange();
    range.selectNodeContents(e);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0);
    const tops = new Set(rects.map((r) => Math.round(r.top + r.height / 2)));
    const lines = [];
    for (const t of tops) {
      const on = rects.filter((r) => Math.round(r.top + r.height / 2) === t);
      lines.push(Math.max(...on.map((r) => r.right)) - Math.min(...on.map((r) => r.left)));
    }
    const clone = e.cloneNode(true);
    clone.style.cssText =
      'position:absolute;visibility:hidden;white-space:nowrap;max-width:none;width:auto;left:0;top:0';
    e.parentElement.appendChild(clone);
    const natural = clone.getBoundingClientRect().width;
    clone.remove();
    const p = e.parentElement;
    const pcs = getComputedStyle(p);
    const free = p.clientWidth - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight);
    const box = e.getBoundingClientRect();
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.6;
    return {
      cls: String(e.className).slice(0, 40),
      max: cs.maxWidth === 'none' ? null : parseFloat(cs.maxWidth),
      line: ch * 120,
      text: ch * 70,
      balance: /balance/.test(cs.textWrapStyle || cs.textWrap || ''),
      lines: box.height < lh * 1.5 ? 1 : lines.length,
      widest: lines.length ? Math.max(...lines) : 0,
      natural,
      free,
      box: box.width,
      right: box.right,
      pright: p.getBoundingClientRect().right,
      sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });
}

const MEASURE_SIZES = [
  [360, 640],
  [768, 1024],
  [1180, 720],
  [1440, 900],
  [1920, 1080]
];

/** 111. The text measure (DESIGN.md, "The Measure Rule"): a line takes one line while its
 *  column allows it and wraps in the column at 360; a passage keeps 70ch, and a box that
 *  holds only a passage is as wide as its text; a box with actions follows its text. */
async function textMeasure() {
  const at = '111 (the text measure): ';
  /* (a) The line class: a lead, a sign-in lead, a plate's cause and hint, an error sentence. */
  const LINES = [
    ['#/search', 'main .page-sub'],
    ['#/homebrew as gm3', 'main .page-sub'],
    ['#/roll/alt', 'main .page-sub'],
    ['#/lists', 'main .page-sub, main .signin-lead'],
    ['#/account', 'main .page-sub'],
    ['#/search ~ nothing found', 'main .cause'],
    ['#/lists ~ empty as gm4', 'main .hint'],
    ['#/i/nope', 'main .errtext']
  ];
  for (const [id, sel] of LINES) {
    for (const lang of ['ru', 'en']) {
      const { ctx, page, d } = await openState(id, 1180, 720, lang);
      try {
        for (const [width, height] of MEASURE_SIZES) {
          await d.viewport(width, height);
          await d.settle();
          const where = at + id + ' ' + sel + ' ' + width + ' ' + lang + ': ';
          const got = await page.evaluate(measureProbe, sel);
          fs.writeSync(
            1,
            '  line: ' +
              where +
              got
                .map((g) => g.cls + ' ' + g.lines + 'L ' + Math.round(g.widest) + '/' + g.free)
                .join('; ') +
              '\n'
          );
          /* Up to 760 px a roll page and `/search` hide the lead. */
          if (!got.length && width <= 760) continue;
          ok(got.length > 0, where + 'no block drawn');
          for (const g of got) {
            ok(
              g.max !== null && Math.abs(g.max - g.line) <= 1,
              where + g.cls + ': its max-width is ' + g.max + ', not 120ch (' + g.line + ')'
            );
            ok(g.balance, where + g.cls + ': its wrap is not balanced');
            if (width >= 768 && g.natural <= Math.min(g.free, g.line) - 1)
              ok(
                g.lines === 1,
                where + g.cls + ': it fits its column and takes ' + g.lines + ' lines'
              );
            if (width === 360)
              ok(
                g.right <= g.pright + 0.5 && !g.sideways,
                where + g.cls + ': it does not wrap in its column'
              );
          }
        }
      } finally {
        await ctx.close();
      }
    }
  }

  /* (a2) A box with actions: the sign-in button follows the lead's widest line. */
  for (const lang of ['ru', 'en']) {
    for (const [width, height] of [
      [1180, 720],
      [1920, 1080]
    ]) {
      const where = at + '#/lists signed out ' + width + ' ' + lang + ': ';
      const { ctx, page } = await openState('#/lists', width, height, lang);
      try {
        const m = await page.evaluate(() => {
          const lead = document.querySelector('main .signin-lead');
          const btn = document.querySelector('main .signin .btn, main .signin button');
          if (!lead || !btn) return null;
          const range = document.createRange();
          range.selectNodeContents(lead);
          const right = Math.max(...[...range.getClientRects()].map((r) => r.right));
          return { gap: btn.getBoundingClientRect().left - right };
        });
        ok(
          !!m && m.gap >= 0 && m.gap <= 12,
          where + 'the button does not follow the lead - ' + JSON.stringify(m)
        );
      } finally {
        await ctx.close();
      }
    }
  }

  /* (b) The passage class: help panels, a note, the footer license. Each width opens its
     own page: a help panel folds when the page head leaves at 760 px. */
  const PASSAGES = [
    ['#/roll/std ~ help', 'main .helpbox p', 'main .helpbox'],
    ['#/roll/arazo ~ help', 'main .helpbox p', 'main .helpbox'],
    ['#/s/gm-token-1', 'main .hitnote .htext', 'main .hitnote'],
    ['#/roll/std', '.foot-licence p', null]
  ];
  for (const [id, sel, boxSel] of PASSAGES) {
    for (const lang of ['ru', 'en']) {
      for (const [width, height] of MEASURE_SIZES) {
        const { ctx, page } = await openState(id, width, height, lang, width < 761);
        try {
          if (!boxSel)
            await page.evaluate(() => (document.querySelector('.foot-licence').open = true));
          const where = at + id + ' ' + sel + ' ' + width + ' ' + lang + ': ';
          const got = await page.evaluate(measureProbe, sel);
          /* Up to 760 px a help panel is an item of «Ещё» and the `/s/` notes sit on the
             lead line: nothing to read there. */
          if (!got.length && width < 761) continue;
          ok(got.length > 0, where + 'no passage drawn');
          for (const g of got)
            ok(
              g.widest <= g.text + 1,
              where + 'a line is ' + Math.round(g.widest) + ' px, past 70ch (' + g.text + ')'
            );
          if (!boxSel) continue;
          /* The box against the extent of what it holds: a band inside it is the defect. */
          const box = await page.evaluate(
            (b) =>
              [...document.querySelectorAll(b)].map((e) => {
                const cs = getComputedStyle(e);
                const inner =
                  e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
                const kids = [...e.children].map((k) => k.getBoundingClientRect());
                const widest =
                  Math.max(...kids.map((k) => k.right)) - Math.min(...kids.map((k) => k.left));
                const p = e.parentElement;
                const pcs = getComputedStyle(p);
                const col =
                  p.clientWidth - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight);
                return { inner, widest, outer: e.getBoundingClientRect().width, col };
              }),
            boxSel
          );
          fs.writeSync(1, '  passage: ' + where + JSON.stringify(box) + '\n');
          for (const b of box) {
            if (width === 360)
              ok(
                b.outer >= b.col - 1 || b.inner <= b.widest + 1,
                where + 'the box is neither its text nor the column - ' + JSON.stringify(b)
              );
            else
              ok(
                b.inner <= b.widest + 1,
                where + 'the box is wider than its text - ' + JSON.stringify(b)
              );
          }
        } finally {
          await ctx.close();
        }
      }
    }
  }

  /* The dossier's text column is the measure of a record's text: at most 80ch. */
  for (const lang of ['ru', 'en']) {
    const { ctx, page, d } = await fresh({ width: 1180, height: 900, lang });
    try {
      await d.open('#/i/voa2_a3');
      const got = await page.evaluate(measureProbe, 'main .card-desc');
      ok(
        got.length > 0 && got.every((g) => g.box <= (g.line * 80) / 120 + 1),
        at + '#/i/voa2_a3 ' + lang + ': the record text is past 80ch - ' + JSON.stringify(got)
      );
    } finally {
      await ctx.close();
    }
  }

  /* The list page's side column: its read-only notes fill it, a hugging note would not. */
  {
    const { ctx, page } = await openState(LIST_A_ID + ' ~ noted as gm4', 1180, 720, 'ru');
    try {
      const m = await page.evaluate(() =>
        [...document.querySelectorAll('.lnotes > .hitnote')].map((n) => {
          const col = n.parentElement;
          return { note: n.getBoundingClientRect().width, col: col.clientWidth };
        })
      );
      ok(
        m.length > 0 && m.every((x) => x.note >= x.col - 1),
        at + 'the side column notes are narrower than the column - ' + JSON.stringify(m)
      );
    } finally {
      await ctx.close();
    }
  }
}

/** The routes of case 112: the family, the route, who is signed in. */
const HEAD_ROUTES = [
  ['roll', '#/roll/std', null],
  ['roll', '#/roll/alt', null],
  ['roll', '#/roll/community', null],
  ['roll', '#/roll/mwt', null],
  ['tables', '#/tables/eq_weapon', null],
  ['tables', '#/tables/eq_armor', null],
  ['tables', '#/tables/wondrous', null],
  ['homebrew', '#/homebrew', 'gm3'],
  ['homebrew', '#/homebrew/sources', 'gm3'],
  ['homebrew', '#/homebrew/sets', 'gm3'],
  ['homebrew', '#/homebrew/rules', 'gm3'],
  ['lists', '#/lists', 'gm4'],
  ['search', '#/search', null]
];
const HEAD_SIZES = [
  [1180, 720],
  [1000, 720],
  [900, 720],
  [768, 1024],
  [360, 640]
];
const HEADINGS = {
  roll: { ru: 'Бросок', en: 'Roll' },
  tables: { ru: 'Таблицы', en: 'Tables' },
  homebrew: { ru: 'Мои предметы', en: 'My items' }
};

/** Reads the page head of case 112: its parts' boxes, their DOM order and the lit pills. */
function headProbe() {
  const head = document.querySelector('main .page-head');
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, h: r.height };
  };
  const h1 = document.querySelector('main h1');
  const nav = head?.querySelector('.headnav') ?? null;
  const pin = head?.querySelector('.homebtn') ?? null;
  const help = head?.querySelector('.helpbtn') ?? null;
  const primary = head?.querySelector('.btn.primary') ?? null;
  const parts = [
    ['h1', h1],
    ['nav', nav],
    ['pin', pin],
    ['help', help],
    ['primary', primary]
  ].filter(([, el]) => el);
  const order = [...parts]
    .sort(([, a], [, b]) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    )
    .map(([k]) => k);
  /* The head's own controls outside the pills, in DOM order: the primary ends them. */
  const controls = head
    ? [...head.querySelectorAll('a, button')].filter((el) => !el.closest('.headnav'))
    : [];
  const lit = [...document.querySelectorAll('main .headnav .on, main .headnav [aria-current]')];
  const checks = lit.filter((el) => {
    const svgs = el.querySelectorAll('svg').length;
    return el.classList.contains('sup') ? svgs > 1 : svgs > 0;
  }).length;
  const mainEl = document.querySelector('main');
  const mcs = getComputedStyle(mainEl);
  const mr = mainEl.getBoundingClientRect();
  const lead = document.querySelector('main .page-sub');
  const modesLit = document.querySelector('nav.modes [aria-current="page"]');
  return {
    boxes: Object.fromEntries(parts.map(([k, el]) => [k, box(el)])),
    order,
    lastIsPrimary: !primary || controls[controls.length - 1] === primary,
    below: !!nav?.classList.contains('below'),
    h1: h1 ? { text: h1.textContent.trim(), w: h1.getBoundingClientRect().width } : null,
    checks,
    contentRight: mr.right - parseFloat(mcs.paddingRight),
    lead: box(lead),
    title: document.title,
    modeLit: modesLit?.textContent.trim() ?? null
  };
}

/** 112. The Head Order Rule (DESIGN.md): every page head draws the heading, the pills of
 *  the sibling pages, the pin, the help and the primary, in this DOM order and in this
 *  reading order; from 761 to 999 px the pills take the row under the others. The first
 *  content of each family against the First-Screen Rule at 768 and 900 px, `/tables/*` at
 *  900x720 under its named ceiling of 294 px. */
async function headOrder() {
  const at = '112 (the head order): ';
  /* The pills' place per language and size, on the roll routes; each pill's width, and the
     homebrew pills' first top and line count per tab. */
  const pills = {};
  const widths = {};
  const hbPills = {};
  for (const [family, route, as] of HEAD_ROUTES) {
    for (const lang of ['ru', 'en']) {
      const { ctx, page, d } = await fresh({ width: 1180, height: 720, lang });
      try {
        await d.open(route, { as, lang });
        await d.settled(route);
        for (const [width, height] of HEAD_SIZES) {
          await d.viewport(width, height);
          await d.settle();
          const presses =
            width >= 1000 && ['roll', 'tables', 'homebrew'].includes(family)
              ? [false, true]
              : [false];
          for (const pressed of presses) {
            if (pressed) {
              await page.evaluate(() =>
                document.querySelector('main .page-head .homebtn')?.click()
              );
              await d.settle();
            }
            const where =
              at +
              route +
              ' ' +
              width +
              'x' +
              height +
              ' ' +
              lang +
              (pressed ? ' pinned' : '') +
              ': ';
            const top = await primaryTop(page);
            const m = await page.evaluate(headProbe);
            fs.writeSync(
              1,
              '  head: ' +
                where +
                'order ' +
                m.order.join(',') +
                ', first content ' +
                (top ? top.top.toFixed(1) : 'none') +
                '\n'
            );
            /* (f) The heading. */
            if (HEADINGS[family]) {
              ok(
                m.h1?.text === HEADINGS[family][lang],
                where + 'the heading reads ' + m.h1?.text
              );
              if (width === 360) ok(m.h1.w <= 1, where + 'the heading is drawn at 360 px');
            }
            if (width === 360) continue;
            /* (a), (b) The DOM order. */
            const hasNav = ['roll', 'tables', 'homebrew'].includes(family);
            ok(
              !!m.boxes.h1 && m.order[0] === 'h1',
              where + 'the heading is not first - ' + m.order
            );
            ok(
              hasNav === !!m.boxes.nav,
              where + 'the pills box is ' + (m.boxes.nav ? 'drawn' : 'missing')
            );
            ok(!!m.boxes.pin, where + 'no pin in the head');
            const want = m.order.filter((k) => k !== 'nav');
            const pinAt = want.indexOf('pin');
            ok(pinAt === 1, where + 'the pin does not follow the heading - ' + m.order);
            ok(m.lastIsPrimary, where + 'a control follows the primary');
            if (hasNav) {
              const navAt = m.order.indexOf('nav');
              ok(
                m.below ? navAt === m.order.length - 1 : navAt === 1,
                where + 'the pills are out of place - ' + m.order
              );
              ok(
                m.below === width < 1000,
                where + 'the pills row is ' + (m.below ? 'below' : 'in the row')
              );
            }
            /* (c) The reading order equals the DOM order. */
            const center = (b) => (b.top + b.bottom) / 2;
            const row = Object.entries(m.boxes).filter(([k]) => !(m.below && k === 'nav'));
            const c0 = center(m.boxes.h1);
            for (const [k, b] of row)
              ok(
                Math.abs(center(b) - c0) <= 8,
                where + k + ' is off the title row by ' + (center(b) - c0).toFixed(1)
              );
            for (let i = 1; i < row.length; i++)
              ok(
                row[i][1].left >= row[i - 1][1].right - 1,
                where + row[i][0] + ' reads before ' + row[i - 1][0]
              );
            if (m.below) {
              const rowBottom = Math.max(...row.map(([, b]) => b.bottom));
              ok(
                m.boxes.nav.top >= rowBottom - 0.5,
                where + 'the pills are not under the title row'
              );
              /* (i) The pills stand closer to the title row than to the lead. */
              if (route === '#/roll/alt' && m.lead) {
                const up = m.boxes.nav.top - rowBottom;
                const down = m.lead.top - m.boxes.nav.bottom;
                ok(
                  down >= up - 0.5,
                  where +
                    'the pills-to-lead gap ' +
                    down.toFixed(1) +
                    ' is under ' +
                    up.toFixed(1)
                );
              }
            }
            /* (d) The primary ends the row. */
            if (m.boxes.primary && (width === 1180 || width === 768))
              ok(
                m.contentRight - m.boxes.primary.right <= 16,
                where +
                  'the primary ends ' +
                  (m.contentRight - m.boxes.primary.right).toFixed(1) +
                  ' px short'
              );
            /* (h) No lit pill draws a check. */
            ok(m.checks === 0, where + m.checks + ' lit pills draw a check');
            /* (e) The first screen. */
            if (top && !pressed) {
              const limit =
                width === 768
                  ? 410
                  : family === 'tables' && width === 900
                    ? 294
                    : width === 1000
                      ? null
                      : 288;
              if (limit !== null)
                ok(
                  top.top <= limit,
                  where +
                    'the first content starts at ' +
                    top.top.toFixed(1) +
                    ', past ' +
                    limit
                );
            }
            /* (g) The pill row holds still on the roll routes; the title names the mode. */
            if (family === 'roll' && !pressed) {
              const key = lang + ' ' + width;
              const p = { left: m.boxes.nav.left, top: m.boxes.nav.top };
              pills[key] ??= p;
              ok(
                Math.abs(pills[key].left - p.left) <= 1 &&
                  Math.abs(pills[key].top - p.top) <= 1,
                where + 'the pills moved - ' + JSON.stringify([pills[key], p])
              );
              ok(
                !!m.modeLit && m.title.startsWith(m.modeLit),
                where + 'the title ' + m.title + ' does not name ' + m.modeLit
              );
            }
            /* (g) A lit pill keeps its rest width (DESIGN.md, "Chips", "Sibling pills"): each
               mode pill, and each catalog group chip, is as wide on every route. */
            if ((family === 'roll' || family === 'tables') && !pressed) {
              const key = family + ' ' + lang + ' ' + width;
              const ws = await page.evaluate(() =>
                [
                  ...document.querySelectorAll(
                    'main .page-head .headnav .mode:not(.sup), main .page-head .headnav a.chip'
                  )
                ].map((e) => e.getBoundingClientRect().width)
              );
              widths[key] ??= ws;
              ok(
                ws.length === widths[key].length &&
                  ws.every((w, i) => Math.abs(w - (widths[key][i] ?? 0)) <= 0.5),
                where + 'a pill changed its width - ' + JSON.stringify([widths[key], ws])
              );
            }
            /* (j) From 1000 px every homebrew tab wraps its pills alike (the reserved primary). */
            if (family === 'homebrew' && width >= 1000 && !pressed) {
              const key = lang + ' ' + width;
              const hp = await page.evaluate(() => {
                const tops = [
                  ...document.querySelectorAll('main .page-head .headnav a.chip')
                ].map((e) => Math.round(e.getBoundingClientRect().top));
                return { top: tops[0] ?? null, lines: new Set(tops).size };
              });
              hbPills[key] ??= hp;
              ok(
                hp.lines === hbPills[key].lines &&
                  hp.top !== null &&
                  Math.abs(hp.top - (hbPills[key].top ?? 0)) <= 1,
                where +
                  'the homebrew pills differ from the Items tab - ' +
                  JSON.stringify([hbPills[key], hp])
              );
            }
          }
          if (presses.length > 1) {
            await page.evaluate(() =>
              document.querySelector('main .page-head .homebtn')?.click()
            );
            await d.settle();
          }
        }
      } finally {
        await ctx.close();
      }
    }
  }
}

/** 113. The die marks of `/roll/alt` (docs/specs/FEATURES.md, "Rolling"; DESIGN.md, "Colors",
 *  "Tertiary"): each die label starts with the page's d12 in its die's color, hidden from a
 *  reader, and no letter; the word names the die and the field. */
async function dieMarks() {
  const at = '113 (the die marks): ';
  for (const [width, height] of [
    [360, 640],
    [1180, 720]
  ]) {
    for (const lang of ['ru', 'en']) {
      const { ctx, page, d } = await fresh({ width, height, lang });
      try {
        await d.open('#/roll/alt', { lang });
        await d.settle();
        if (width === 360) await d.click(lang === 'ru' ? 'Настроить' : 'Set up');
        const where = at + width + ' ' + lang + ': ';
        const m = await page.evaluate(() => {
          const probe = (v) => {
            const s = document.createElement('span');
            s.style.color = v;
            document.body.append(s);
            const c = getComputedStyle(s).color;
            s.remove();
            return c;
          };
          const tones = {
            hope: probe('var(--hope)'),
            fear: probe('var(--fear)'),
            gold: probe('var(--gold)')
          };
          const labels = [...document.querySelectorAll('main .dielbl')].map((l) => {
            const dv = l.querySelector('.dv');
            const svg = dv?.querySelector('svg.dieicon');
            const lr = l.getBoundingClientRect();
            const sr = svg?.getBoundingClientRect();
            return {
              text: l.textContent.trim(),
              hidden: dv?.getAttribute('aria-hidden'),
              svgs: dv ? dv.querySelectorAll('svg.dieicon').length : 0,
              own: dv ? dv.textContent.trim() : null,
              color: svg ? getComputedStyle(svg).color : null,
              dy: sr ? sr.top + sr.height / 2 - (lr.top + lr.height / 2) : null
            };
          });
          const field = document.querySelector('main .dieblock input');
          return { tones, labels, field: field?.getAttribute('aria-label') ?? null };
        });
        const words =
          lang === 'ru' ? ['Кость Надежды', 'Кость Страха'] : ['Hope Die', 'Fear Die'];
        ok(m.labels.length === 2, where + m.labels.length + ' die labels');
        m.labels.forEach((l, i) => {
          const tone = i === 0 ? m.tones.hope : m.tones.fear;
          ok(l.text === words[i], where + 'the label reads ' + l.text);
          ok(
            l.hidden === 'true' && l.svgs === 1 && l.own === '',
            where + 'the mark - ' + JSON.stringify(l)
          );
          ok(
            l.color === tone && l.color !== m.tones.gold,
            where + 'the mark is ' + l.color + ', not ' + tone
          );
          ok(
            l.dy !== null && Math.abs(l.dy) <= 1,
            where + 'the mark is off the label line by ' + l.dy
          );
        });
        const name =
          lang === 'ru' ? 'Кость Надежды: Результат броска' : 'Hope Die: Roll result';
        ok(m.field === name, where + 'the Hope field is named ' + m.field);
      } finally {
        await ctx.close();
      }
    }
  }
}

/** 114. The print page head and dock (docs/specs/FEATURES.md, "Print"; DESIGN.md, "The Two
 *  Breakpoints Rule"): the way back and the heading on one row; from 761 px the primary,
 *  the two switches and the link in one row under it; up to 760 px the switches under it,
 *  one card per row and a dock with the primary and «Ещё», in view at every window height
 *  (740x360 included); the sheet inside the first screen; «Лист 2 из 2» before a second
 *  sheet; the Thumb Rule at 360 and 390 px. */
async function printHead() {
  const at = '114 (the print page head and dock): ';
  const WORDS = {
    ru: { print: 'Напечатать', more: 'Ещё', link: 'Ссылка на набор', sheet2: 'Лист 2 из 2' },
    en: { print: 'Print', more: 'More', link: 'Link to this set', sheet2: 'Sheet 2 of 2' }
  };
  /* 740x360: a phone on its side, where the dock still sticks. */
  for (const [width, height] of [
    [360, 640],
    [390, 844],
    [740, 360],
    [768, 1024],
    [1180, 720]
  ]) {
    for (const lang of ['ru', 'en']) {
      const w = WORDS[lang];
      const narrow = width <= 760;
      const short = height < 481;
      const where = at + width + ' ' + lang + ': ';
      const { ctx, page, d } = await fresh({ width, height, lang });
      try {
        await d.open('#/p/set-emberaxe', { as: 'gm2', lang });
        await waitIn(page, () => !!document.querySelector('.psheet'));
        await d.settle();
        const m = await page.evaluate(() => {
          const name = (e) => e.textContent.trim();
          const bar = document.querySelector('.printbar');
          const crumb = bar?.querySelector('.crumb');
          const row = bar?.querySelector('.prow');
          const first = document.querySelector('.psheet').getBoundingClientRect();
          const main = document.querySelector('main');
          const cs = getComputedStyle(main);
          const column =
            main.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
          const left = main.getBoundingClientRect().left + parseFloat(cs.paddingLeft);
          const cards = [...document.querySelectorAll('.pcard')]
            .filter((c) => getComputedStyle(c).display !== 'none')
            .map((c) => c.getBoundingClientRect());
          const dock = document.querySelector('.pdock');
          return {
            crumb: crumb ? [...crumb.children].map((e) => e.tagName + ':' + name(e)) : [],
            row: row
              ? [...row.children].map((e) =>
                  e.matches('.seg') ? 'group:' + e.getAttribute('aria-label') : name(e)
                )
              : [],
            rowTops: row
              ? new Set([...row.children].map((e) => Math.round(e.getBoundingClientRect().top)))
                  .size
              : 0,
            top: first.top,
            column,
            widths: cards.map((r) => r.width),
            offCentre: cards.map((r) => Math.abs(r.left - left + r.right - left - column) / 2),
            scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            dock: dock ? [...dock.querySelectorAll('button')].map(name) : null
          };
        });
        /* (a) the DOM order */
        ok(
          m.crumb.length === 2 && /^A:/.test(m.crumb[0]) && /^H1:/.test(m.crumb[1]),
          where + 'the crumb is ' + JSON.stringify(m.crumb)
        );
        const groups = m.row.filter((x) => x.startsWith('group:'));
        ok(groups.length === 2, where + 'the row holds ' + JSON.stringify(m.row));
        if (narrow) {
          ok(m.row.length === 2, where + 'the row up to 760 px is ' + JSON.stringify(m.row));
        } else {
          ok(
            m.row.length === 4 &&
              m.row[0].endsWith(w.print) &&
              m.row[3].endsWith(w.link) &&
              m.row[1].startsWith('group:') &&
              m.row[2].startsWith('group:'),
            where + 'the row from 761 px is ' + JSON.stringify(m.row)
          );
        }
        ok(m.rowTops === 1, where + 'the row takes ' + m.rowTops + ' lines');
        /* (c) the first sheet inside the first screen */
        ok(
          short || m.top <= height * 0.4,
          where + 'the first sheet starts at ' + m.top.toFixed(1) + ' px'
        );
        if (width === 390 || width === 768)
          console.log(
            '  114 ' + width + ' ' + lang + ': the first sheet at ' + m.top.toFixed(1)
          );
        /* (f) no sideways scroll */
        ok(m.scroll <= 0, where + 'the page scrolls sideways by ' + m.scroll + ' px');
        if (!narrow) {
          ok(m.dock === null, where + 'a dock is drawn from 761 px');
          continue;
        }
        /* (d) one card per row, its width cut to two decimals of scale */
        const want = Math.min(m.column, 420);
        ok(
          m.widths.length > 0 && m.widths.every((x) => x <= want + 0.5 && want - x < 2.5),
          where + 'a card is not ' + want + ' px wide: ' + m.widths.join(',')
        );
        ok(
          m.offCentre.every((v) => v <= 1),
          where + 'a card is off centre: ' + m.offCentre.join(',')
        );
        /* (b) the dock */
        ok(
          JSON.stringify(m.dock) === JSON.stringify([w.print, w.more]),
          where + 'the dock holds ' + JSON.stringify(m.dock)
        );
        const dockAt = () =>
          page.evaluate(() => {
            const r = document.querySelector('.pdock').getBoundingClientRect();
            return {
              top: r.top,
              bottom: r.bottom,
              h: r.height,
              inner: innerHeight,
              pdock: getComputedStyle(document.documentElement).getPropertyValue('--pdock-h'),
              pad: getComputedStyle(document.documentElement).scrollPaddingBottom
            };
          });
        let k = await dockAt();
        ok(
          k.top >= 0 && k.bottom <= k.inner + 0.5,
          where + 'the dock is out of view at scroll 0: ' + JSON.stringify(k)
        );
        /* The page's scroll padding holds the dock at every height, the short window too. */
        ok(
          Math.abs(parseFloat(k.pdock) - k.h) <= 1 && Math.abs(parseFloat(k.pad) - k.h) <= 1,
          where +
            '--pdock-h is ' +
            k.pdock +
            ', the scroll padding ' +
            k.pad +
            ' for a ' +
            k.h +
            ' px dock'
        );
        await page.evaluate(() => {
          const cards = document.querySelectorAll('.pcard:not(.blank)');
          cards[cards.length - 1].scrollIntoView({ block: 'end' });
        });
        await d.settle();
        k = await dockAt();
        ok(
          k.top >= 0 && k.bottom <= k.inner + 0.5,
          where + 'the dock is out of view at the last card: ' + JSON.stringify(k)
        );
        await page.evaluate(() => window.scrollTo(0, 0));
        await d.settle();
        /* (g) the Thumb Rule at 360 and 390 px (`--thumb` holds up to 600 px only) */
        const small = width <= 600 ? await targets(page, { floor: 40, menuFloor: 44 }) : [];
        for (const t of small)
          ok(false, where + t.sel + ' «' + t.name + '» ' + t.w + 'x' + t.h);
        await page.evaluate(() => document.querySelector('.pdock .morewrap button').click());
        await d.settle();
        const menu = await page.evaluate(() => {
          const btn = document.querySelector('.pdock .morewrap button');
          const box = document.getElementById('print-more');
          if (!box) return null;
          return {
            items: [...box.querySelectorAll('[role=menuitem]')].map((e) =>
              e.textContent.trim()
            ),
            up: box.getBoundingClientRect().bottom <= btn.getBoundingClientRect().top + 0.5
          };
        });
        ok(
          !!menu && menu.up && JSON.stringify(menu.items) === JSON.stringify([w.link]),
          where + '«' + w.more + '» does not open up with the link: ' + JSON.stringify(menu)
        );
        if (width === 360) {
          const open = await targets(page, { floor: 40, menuFloor: 44 });
          for (const t of open)
            ok(false, where + 'menu open: ' + t.sel + ' «' + t.name + '» ' + t.w + 'x' + t.h);
        }
      } finally {
        await ctx.close();
      }
    }
  }
  /* (e) the label before the second sheet of the ten-card set */
  for (const lang of ['ru', 'en']) {
    for (const width of [360, 1180]) {
      const { ctx, page, d } = await fresh({ width, height: 720, lang });
      try {
        await d.open('#/p/set-tencards', { as: 'gm2', lang });
        await waitIn(page, () => !!document.querySelector('.psheet'));
        const m = await page.evaluate(() => ({
          labels: [...document.querySelectorAll('.psheet-n')].map((e) => e.textContent.trim()),
          next: document
            .querySelector('.psheet-n')
            ?.nextElementSibling?.getAttribute('data-next')
        }));
        ok(
          JSON.stringify(m.labels) === JSON.stringify([WORDS[lang].sheet2]) && m.next === '1',
          at + width + ' ' + lang + ': the sheet label is ' + JSON.stringify(m)
        );
      } finally {
        await ctx.close();
      }
    }
  }
}

/** 115. The face wait (docs/specs/FEATURES.md, "Print"): «Напечатать» waits while the face
 *  loads and the cards fit again once it arrives, from the fallback face's numbers to those
 *  of a warm open; a failed face still enables the button and the sheet fits in the
 *  fallback face. */
async function printFaceWait() {
  const at = '115 (the face wait): ';
  const fitOf = (page) =>
    page.evaluate(() =>
      [...document.querySelectorAll('.pcard:not(.blank)')].map((c) => [
        c.querySelector('.pc-text')?.style.fontSize ?? '',
        c.querySelector('.pc-content')?.style.getPropertyValue('--pcpad') ?? ''
      ])
    );
  const button = (page) =>
    page.evaluate(() => {
      const b = [...document.querySelectorAll('.printbar .prow button')].find((e) =>
        /Напечатать/.test(e.textContent)
      );
      return b ? b.disabled : null;
    });
  const { ctx, page, d } = await fresh({ width: 1180, height: 720 });
  try {
    /* Nine long cards: their fit in the fallback face differs from the warm one, so the
       held open proves the refit ran. */
    await d.open('#/p/set-longtext', { as: 'gm2' });
    await waitIn(page, () => !!document.querySelector('.psheet'));
    ok(
      await waitIn(page, () =>
        [...document.querySelectorAll('.printbar .prow button')].some(
          (b) => /Напечатать/.test(b.textContent) && !b.disabled
        )
      ),
      at + 'the warm open never enabled «Напечатать»'
    );
    const warm = await fitOf(page);
    const url = page.url();

    for (const mode of ['held', 'failed']) {
      const p2 = await ctx.newPage();
      await p2.setViewport({ width: 1180, height: 720 });
      await p2.setBypassServiceWorker(true);
      await p2.setCacheEnabled(false);
      await p2.setRequestInterception(true);
      p2.on('request', (req) => {
        if (!/\.woff2(\?|$)/.test(req.url())) {
          req.continue().catch(() => {});
          return;
        }
        if (mode === 'failed') req.abort().catch(() => {});
        else setTimeout(() => req.continue().catch(() => {}), 1500);
      });
      try {
        await p2.goto(url, { waitUntil: 'domcontentloaded' });
        await waitIn(p2, () => !!document.querySelector('.psheet'));
        let early = null;
        if (mode === 'held') {
          const [disabled, fitted] = await Promise.all([button(p2), fitOf(p2)]);
          early = fitted;
          ok(disabled === true, at + 'held: «Напечатать» is not disabled while the face loads');
        }
        ok(
          await waitIn(p2, () =>
            [...document.querySelectorAll('.printbar .prow button')].some(
              (b) => /Напечатать/.test(b.textContent) && !b.disabled
            )
          ),
          at + mode + ': «Напечатать» never enabled'
        );
        await new Promise((r) => setTimeout(r, 200));
        if (mode === 'held') {
          const cold = await fitOf(p2);
          ok(
            JSON.stringify(cold) === JSON.stringify(warm),
            at +
              'held: the fit after the face ' +
              JSON.stringify(cold) +
              ' is not the warm ' +
              JSON.stringify(warm)
          );
          ok(
            JSON.stringify(early) !== JSON.stringify(warm),
            at + 'held: the fit in the fallback face already equals the warm one'
          );
        } else {
          const spill = await p2.evaluate(
            () =>
              [...document.querySelectorAll('.pcard:not(.blank) .pc-text')].filter(
                (e) => e.scrollHeight > e.clientHeight + 1
              ).length
          );
          ok(spill === 0, at + 'failed: ' + spill + ' cards spill in the fallback face');
        }
      } finally {
        await p2.close();
      }
    }
  } finally {
    await ctx.close();
  }
}

/** 116. The focus after an in-app navigation (docs/specs/FEATURES.md, rule 20): a keyboard
 *  press on a link that leaves with its page puts the focus on `#main`, not on `body`; a
 *  mode pill of the roll head keeps the focus on the lit pill, and up to 760 px the mode
 *  picker takes it. RU, 360 and 1180 px. */
async function focusAfterNavigation() {
  const at = '116 (the focus after a navigation): ';
  const focusOf = (page) =>
    page.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return 'BODY';
      return a.id === 'main' ? '#main' : a.tagName + ' ' + a.textContent.trim().slice(0, 30);
    });
  /* [route, as, the link to press, the address it leads to] */
  const LINKS = [
    ['#/l/abc', undefined, '.erracts a[href="/tables"]', /^\/tables/],
    ['#/l/abc', undefined, '.erracts a[href="/roll/std"]', /^\/roll\/std/],
    ['#/i/ci1', undefined, 'main a[href^="/tables/"]', /^\/tables\//],
    ['#/roll/std', undefined, 'main .rp-res a[href^="/i/"]', /^\/i\//],
    ['#/lists', 'gm1', 'main .listcard a[href^="/lists/"]', /^\/lists\/[0-9a-f-]+/],
    ['#/homebrew', 'gm3', 'main a[href="/homebrew/new"]', /^\/homebrew\/new/]
  ];
  for (const width of [360, 1180]) {
    const { ctx, page, d } = await fresh({ width, height: 720 });
    try {
      for (const [route, as, sel, to] of LINKS) {
        const where = at + route + ' ' + sel + ' ' + width + ': ';
        await d.open(route, as ? { as } : {});
        await d.settled(where);
        const found = await waitIn(page, (s) => !!document.querySelector(s), sel);
        ok(found, where + 'no link to press');
        if (!found) continue;
        await page.focus(sel);
        await page.keyboard.press('Enter');
        ok(
          await waitIn(page, (re) => new RegExp(re).test(location.pathname), to.source),
          where + 'the press did not navigate'
        );
        await d.settle();
        const got = await focusOf(page);
        ok(got === '#main', where + 'the focus is on ' + got);
      }
      if (width === 1180) {
        await d.open('#/roll/std');
        await page.focus('main nav.modes a[href="/roll/alt"]');
        await page.keyboard.press('Enter');
        await waitIn(page, () => location.pathname.startsWith('/roll/alt'));
        await d.settle();
        const got = await focusOf(page);
        ok(/^A Альтернативные/.test(got), at + 'a mode pill: the focus is on ' + got);
      }
      /* Up to 760 px the roll picker's sheet: Escape returns the focus to the picker, a pick
         puts it on the new page's picker. */
      if (width === 360) {
        const PICKER = 'nav.modes button.picker';
        await d.open('#/roll/std');
        await page.click(PICKER);
        await page.waitForSelector('dialog[open] a[href="/roll/alt"]');
        await page.keyboard.press('Escape');
        ok(
          await waitIn(
            page,
            (sel) =>
              !document.querySelector('dialog[open]') &&
              document.activeElement === document.querySelector(sel),
            PICKER
          ),
          at + 'the mode sheet: Escape did not return the focus to the picker'
        );
        await page.click(PICKER);
        await page.waitForSelector('dialog[open] a[href="/roll/alt"]');
        await page.focus('dialog[open] a[href="/roll/alt"]');
        await page.keyboard.press('Enter');
        await waitIn(page, () => location.pathname.startsWith('/roll/alt'));
        await d.settle();
        const got = await focusOf(page);
        ok(
          /^BUTTON Альтернативные/.test(got),
          at + 'the mode sheet: the new page focuses ' + got + ', not its picker'
        );
      }
    } finally {
      await ctx.close();
    }
  }
}

/** 117. One scrim and one modal shape (DESIGN.md, "Sheet"): the record dialog, a sheet and
 *  the crop dialog draw the same backdrop with no blur; the crop dialog sits on the window's
 *  bottom with its top corners at 360 px, and is the sheet's 560 px centered from 761 px. */
async function oneScrimAndShape() {
  const at = '117 (one scrim and shape): ';
  const scrim = (page, sel) =>
    page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const cs = getComputedStyle(el, '::backdrop');
      return cs.backgroundColor + ' / ' + (cs.backdropFilter || 'none');
    }, sel);
  const shape = (page) =>
    page.evaluate(() => {
      const dlg = document.querySelector('dialog.cropdlg');
      const r = dlg.getBoundingClientRect();
      const cs = getComputedStyle(dlg);
      return {
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        w: r.width,
        /* The window less the reserved scrollbar gutter, as a fixed box sees it. */
        vw: document.body.getBoundingClientRect().width,
        vh: innerHeight,
        tl: cs.borderTopLeftRadius,
        bl: cs.borderBottomLeftRadius
      };
    });
  for (const width of [360, 1180]) {
    const where = at + width + ': ';
    const { ctx, page, d } = await fresh({ width, height: width === 360 ? 640 : 720 });
    try {
      await d.open('#/tables/core_item');
      await d.press('Первоклассный Спальный Мешок');
      await waitIn(page, () => !!document.querySelector('dialog[open]:not(.sheet)'));
      const record = await scrim(page, 'dialog[open]:not(.sheet)');
      await page.keyboard.press('Escape');
      await d.settle();
      /* The catalog's filters are a sheet below 1000 px; one sheet rule serves every width. */
      let sheet = record;
      if (width === 360) {
        await d.open('#/tables/eq_weapon');
        await d.press('Фильтры');
        await waitIn(page, () => !!document.querySelector('dialog.sheet[open]'));
        sheet = await scrim(page, 'dialog.sheet[open]');
        await page.keyboard.press('Escape');
        await d.settle();
      }
      ok(await cropOpen(page, d, where), where + 'the crop dialog did not draw');
      const crop = await scrim(page, 'dialog.cropdlg[open]');
      ok(
        !!record && record === sheet && sheet === crop && /\/ none$/.test(record),
        where + 'the scrims differ - ' + JSON.stringify({ record, sheet, crop })
      );
      const m = await shape(page);
      if (width === 360) {
        ok(
          Math.abs(m.bottom - m.vh) <= 0.5 && m.left <= 0.5 && Math.abs(m.right - m.vw) <= 0.5,
          where + 'the crop dialog is not on the bottom edge - ' + JSON.stringify(m)
        );
        ok(m.tl === '14px' && m.bl === '0px', where + 'the corners - ' + JSON.stringify(m));
      } else {
        ok(
          Math.abs(m.w - 560) <= 0.5 &&
            Math.abs(m.left + m.right - m.vw) <= 1 &&
            Math.abs(m.top - (m.vh - m.bottom)) <= 1,
          where + 'the crop dialog is not the 560 px centered sheet - ' + JSON.stringify(m)
        );
        ok(m.tl === '14px' && m.bl === '14px', where + 'the corners - ' + JSON.stringify(m));
      }
    } finally {
      await ctx.close();
    }
  }
}

/** 118. The selection bar on a short page and the toasts beside docks (DESIGN.md,
 *  "Selection bar", "Toast"): on `/lists` with three lists and one tick the bar's bottom is
 *  the window's bottom at 1180x720 and 768x1024, and at the page's end the footer ends above
 *  it; a toast in the record dialog at 360x640 ends above the dialog's dock. */
async function barPinnedAndToastsClear() {
  const at = '118 (the bar pinned, the toasts clear): ';
  for (const [width, height] of [
    [1180, 720],
    [768, 1024]
  ]) {
    const where = at + width + 'x' + height + ': ';
    const { ctx, page, d } = await fresh({ width, height });
    try {
      await d.open('#/lists', { as: 'gm1' });
      await d.settled(where);
      await d.press('Выбрать');
      await page.evaluate(() => document.querySelector('main .listcard input')?.click());
      ok(
        await waitIn(page, () =>
          /1/.test(document.querySelector('.selbarwrap .selcount')?.textContent ?? '')
        ),
        where + 'no tick'
      );
      const m = await page.evaluate(async () => {
        const bar = () => document.querySelector('.selbarwrap').getBoundingClientRect();
        const top = { bottom: bar().bottom, vh: innerHeight };
        scrollTo(0, document.documentElement.scrollHeight);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const foot = document
          .querySelector('footer.foot')
          .lastElementChild.getBoundingClientRect();
        return { ...top, endBottom: bar().bottom, barTop: bar().top, footEnd: foot.bottom };
      });
      ok(
        Math.abs(m.bottom - m.vh) <= 0.5 && Math.abs(m.endBottom - m.vh) <= 0.5,
        where + 'the bar is not on the window bottom - ' + JSON.stringify(m)
      );
      ok(
        m.footEnd <= m.barTop + 0.5,
        where + 'the footer ends under the bar - ' + JSON.stringify(m)
      );
    } finally {
      await ctx.close();
    }
  }

  const where = at + 'the record dialog at 360x640: ';
  const { ctx, page, d } = await fresh({ width: 360, height: 640 });
  try {
    await d.open('#/tables/core_item');
    await d.press('Первоклассный Спальный Мешок');
    await waitIn(page, () => !!document.querySelector('dialog[open] .cardpick'));
    await page.evaluate(() =>
      document.querySelector('dialog[open] .cardpick .morewrap > .btn')?.click()
    );
    await waitIn(page, () => !!document.querySelector('dialog[open] [role="menu"]'));
    await page.evaluate(() =>
      document.querySelector('dialog[open] [role="menu"] [role="menuitem"]')?.click()
    );
    ok(
      await waitIn(page, () => !!document.querySelector('dialog[open] .toast[role]')),
      where + 'no toast after the first «Ещё» item'
    );
    const m = await page.evaluate(() => ({
      toast: document.querySelector('dialog[open] .toast[role]').getBoundingClientRect().bottom,
      dock: document.querySelector('dialog[open] .cardpick').getBoundingClientRect().top
    }));
    ok(m.toast <= m.dock + 0.5, where + 'the toast covers the dock - ' + JSON.stringify(m));
  } finally {
    await ctx.close();
  }

  /* Every «Ещё» menu at 360 px keeps the 16 px gutter of the window (DESIGN.md, "Sheet"):
     the record dialog's dock and the list page's head were the two that met the edge. */
  const menuAt = 'the «Ещё» gutter at 360x640: ';
  const SPOTS = [
    ['#/tables/core_item', undefined, 'record'],
    ['#/tables/core_item', undefined, 'record', 440],
    ['#/tables/eq_weapon', undefined, 'main'],
    ['#/search', undefined, 'main'],
    ['#/roll/std', undefined, 'main'],
    ['#/lists', 'gm1', 'main'],
    [SHOP, 'gm1', 'main'],
    ['#/homebrew', 'gm1', 'main'],
    ['#/homebrew/hb_emberaxeaaaaaaaa', 'gm1', 'main'],
    ['#/p/set-twocards', 'gm2', 'main']
  ];
  for (const [route, as, scope, height = 640] of SPOTS) {
    const here = at + menuAt + route + ' at height ' + height + ': ';
    const s = await fresh({ width: 360, height });
    try {
      await s.d.open(route, as ? { as } : undefined);
      await s.d.settled(here);
      if (scope === 'record') {
        await s.d.press('Первоклассный Спальный Мешок');
        await waitIn(s.page, () => !!document.querySelector('dialog[open] .cardpick'));
      }
      const count = await s.page.evaluate(
        (sc) =>
          document.querySelectorAll(
            (sc === 'record' ? 'dialog[open] ' : 'main ') + '.morewrap > [aria-haspopup="menu"]'
          ).length,
        scope
      );
      ok(count > 0, here + 'no «Ещё» on the page');
      for (let i = 0; i < count; i++) {
        const m = await s.page.evaluate(
          async (sc, n) => {
            const btn = document.querySelectorAll(
              (sc === 'record' ? 'dialog[open] ' : 'main ') +
                '.morewrap > [aria-haspopup="menu"]'
            )[n];
            btn.scrollIntoView({ block: 'center' });
            btn.click();
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
            const menu = document.querySelector('[role="menu"]');
            if (!menu) return null;
            await Promise.all(menu.getAnimations().map((a) => a.finished));
            const r = menu.getBoundingClientRect();
            /* The dialog's card is the box the menu must stay inside: its scrollbar takes
               width from the window. */
            const card = menu.closest('.modal-card');
            const out = {
              left: r.left,
              right: r.right,
              vw: card
                ? card.getBoundingClientRect().left + card.clientWidth
                : document.documentElement.clientWidth
            };
            btn.click();
            return out;
          },
          scope,
          i
        );
        if (!m) continue;
        ok(
          m.left >= 16 - 0.5 && m.right <= m.vw - 16 + 0.5,
          here + 'menu ' + i + ' leaves no 16 px gutter - ' + JSON.stringify(m)
        );
      }
    } finally {
      await s.ctx.close();
    }
  }
}

const CASES = [
  ['1 (new list from the card)', newListFromCard],
  ['2 (selection bar)', newListFromBar],
  ['3 (modal)', newListFromModal],
  ['4/5 (two frames)', twoFramesPicked],
  ['6 (dialog)', dialogSemantics],
  ['9 (copy text)', copyTextThroughClipboard],
  ['10 (copy image)', copyImage],
  ['11 (no picture)', brokenArtPath],
  ['12 (focus survives input)', focusSurvivesKeystroke],
  ['13 (note height)', noteTextareaHeight],
  ['14 (roll card)', rollReplacesCardImg],
  ['15 (navigation)', historyBackForward],
  ['16 (selection bar)', selectionBarGeometry],
  ['17 (drag reorder)', dragReorder],
  ['18 (open panels)', foldedDetailsSurviveRerender],
  ['19 (tiles with no pictures)', tileGeometryNoArt],
  ['21 (button focus)', buttonFocusSurvivesRerender],
  ['22 (help and list pick)', moneyHelpAndPressedPicker],
  ['23 (menu in the modal)', addToListMenuStaysInModal],
  ['24 (reduced motion)', reducedMotionKillsEverything],
  ['26 (announce on touch, inert grip)', announceOnTouchAndHideInertGrip],
  ['27 (list menu at 50 lists)', listMenuKeepsItsControlsInView],
  ['28 (minimal worker)', minimalWorker],
  ['29 (guide back link)', guideBackLink],
  ['30 (note clear target)', noteClearTargetYieldsToTheToolbar],
  ['31 (card image focus ring)', cardMediaRingVisible],
  ['32 (undo toast in the record dialog)', undoToastInRecordDialog],
  ['33 (drag source removed mid-drag)', dragSourceRemovedMidDrag],
  ['35 (fake cloud signed state)', fakeCloudSignedState],
  ['36 (account preferences)', accountPreferences],
  ['37 (sign-in from the bar)', signInFromTheBar],
  ['39 (sign-out on an account list)', signOutOnAccountList],
  ['40 (not saved, then retried)', notSavedThenRetried],
  ['41 (delete an account list)', deleteAccountList],
  ['42 (prompt in the dialog menu at 360)', promptInDialogMenuAt360],
  ['43 (share links)', shareLinksOfAnAccountList],
  ['44 (share link saved after sign-in)', saveShareLinkAfterSignIn],
  ['45 (shared page re-read)', sharedPageRereadWhenShownAgain],
  ['46 (shared page gone)', sharedPageGoneWhenShownAgain],
  ['49 (account edits wait two seconds, then go once)', accountEditsWaitThenGoOnce],
  ['50 (the account menu)', accountMenu],
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
  ['67 (no field help and the threshold labels at 360)', fieldHelpAt360],
  ['68 (#/homebrew at 300 items)', homebrewAt300],
  ['69 (the GM-only toggle at 1180 and 360)', gmOnlyToggle],
  ['70 (a picture: choose, crop, save)', pictureChooseCropSave],
  ['71 (a browser that cannot encode WebP)', pictureWithoutWebp],
  ['72 (the crop dialog at 360 and in landscape)', cropDialogOnPhones],
  ['73 (print after sign-in)', printAfterSignIn],
  ['74 (the card text keeps its look)', keepsTheCardDescriptionLook],
  ['75 (the browser undoes a toolbar edit)', undoesAToolbarEditWithTheBrowsersUndo],
  ['76 (list notes draw as formatted text)', drawsListNotesAsFormattedText],
  ["77 (the shared row's tick column)", sharedRowTickColumn],
  ['78 (a copy per press of a catalog record)', catalogCopyPerPress],
  ['79 (a picker list stays above the on-screen keyboard)', pickerAboveKeyboard],
  ['80 (the homebrew refusals take the error look)', homebrewRefusalLook],
  ['81 (the address bar)', addressBarPathForm],
  ['82 (the Items tab filter address)', homebrewItemsFilterAddress],
  ['83 (primary content starts in the first screen)', primaryContentInFirstScreen],
  ['84 (filter column clears the selection bar)', filterColumnClearsTheBar],
  ['85 (selection bar in landscape)', selectionBarInLandscape],
  ['86 (the header hides and returns up to 760 px)', headerHidesAndReturns],
  ['87 (a backward Tab never lands under the header)', backwardTabClearsTheHeader],
  ['88 (the record actions fit at 360, 320 and 1180)', recordActionsFit],
  ['89 (the roll page layout holds at 320 to 1180 px)', rollPageLayout],
  ['90 (the result row and its menus)', resultRowAndMenus],
  ['91 (the homebrew head, tabs and bar from 320 to 1180 px)', homebrewHeadAndBar],
  ['92 (the editor holds its layout and the preview sheet)', editorLayoutAndSheet],
  ['93 (the search page holds from 320 to 1180 px)', searchHeadAndRows],
  ['94 (the account holds its layout and its confirm)', accountLayoutAndConfirm],
  ['95 (a badge is one box and keeps clear of the lines around it)', badgeIsOneBox],
  ['96 (the table head holds still between tables)', tableHeadHoldsStill],
  ['97 (a roll fits the first screen by its count)', rollFitsByCount],
  ['98 (the compact row holds from 320 to 760 px)', compactRowHolds],
  ["99 (search and filter on the owner's page)", listSearchAndFilter],
  ['100 (the list head and bars)', listHeadAndBars],
  ['101 (the page column grows to 1440 px and stays centered)', pageColumnOnWideWindows],
  ['102 (the lists page holds from 320 to 1440 px)', listsPageHolds],
  ['103 (the add-to-list menu keeps its place and its keys)', addToListMenuKeys],
  ['104 (the number stepper is laid out as a stepper)', numberStepperLayout],
  ['105 (the list page layout)', listPageLayout],
  ['106 (row text and field measure)', rowTextAndFieldMeasure],
  ['107 (the note switch in a real browser)', noteSwitchInABrowser],
  ['108 (the toasts in a real browser)', toastsInABrowser],
  ['109 (the targets of open layers at 360)', targetsInOpenLayers],
  ['110 (the empty plate)', emptyPlate],
  ['111 (the text measure)', textMeasure],
  ['112 (the head order)', headOrder],
  ['113 (the die marks)', dieMarks],
  ['114 (the print page head and dock)', printHead],
  ['115 (the face wait)', printFaceWait],
  ['116 (the focus after a navigation)', focusAfterNavigation],
  ['117 (one scrim and shape)', oneScrimAndShape],
  ['118 (the bar pinned, the toasts clear)', barPinnedAndToastsClear]
];

/* The interleave spreads the slow layout cases at the end of the list over
 * every piece, as `golden.js` spreads its states. */
const MINE = CASES.filter((c, i) => !SHARD || i % SHARD.of === SHARD.n);

(async () => {
  /* Each case gets its own try/catch: a hung CDP call under host load
   * (this tree is shared - CLAUDE.md, "Task and session protocol") must not
   * take the other cases down with it, and a synchronous write - not
   * console.log's own buffering - is what survives a crash that follows
   * immediately after. */
  for (const [label, fn] of MINE) {
    fs.writeSync(1, 'running: ' + label + '\n');
    const t0 = Date.now();
    try {
      await fn();
    } catch (e) {
      rep.ok(false, label + ': threw - ' + (e && e.message ? e.message : String(e)));
    }
    fs.writeSync(1, 'took: ' + label + ' ' + ((Date.now() - t0) / 1000).toFixed(1) + 's\n');
  }

  await closeBrowser().catch(() => {});
  console.log(
    rep.failed
      ? '\n' + rep.failed + ' FAILED'
      : '\nreal-input states (dist-test/): all ' +
          MINE.length +
          ' runs passed' +
          (SHARD
            ? ' (shard ' + (SHARD.n + 1) + '/' + SHARD.of + ' of ' + CASES.length + ')'
            : '')
  );
  process.exit(rep.failed ? 1 : 0);
})();
