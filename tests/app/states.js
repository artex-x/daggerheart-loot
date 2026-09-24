/* The states a real click reaches, and nothing else does.
 *
 * Every other suite under tests/app/ opens a route and reads what is there;
 * this one presses controls with `press` - a trusted puppeteer
 * ElementHandle.click(), not the synthetic `el.click()` every parity state
 * and every legacy suite uses - because a handful of real defects only show
 * up on the far side of a browser's own microtask checkpoint (the
 * `isConnected` guard) or need a real network, a real clipboard stub, or a
 * real second tab to mean anything at all. Thirty-five cases in thirty-four
 * runs (4 and 5 share one), no ancestor. Like every suite here it drives
 * dist-test/, the test build (docs/specs/COVERAGE.md, "Test layers"). */
const fs = require('fs');
const { PNG } = require('pngjs');
const { baseUrl, fresh, sharedPage, reporter, closeBrowser } = require('./lib.js');
const { TARGETS, ready } = require('./driver.js');

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
  await d.open('#/i/ci1');
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
  await d.open('#/tables');
  await d.tick('Первоклассный Спальный Мешок'); // ticking a row is not this case's point
  await d.press('Добавить в список');
  await d.press('+ Новый список');
  const box = await newListInputBox(page);
  ok(!!box, '2 (selection bar): the new-list form did not open');
  ok(!!box?.focused, '2 (selection bar): the input is not focused');
  await ctx.close();
}

/** 3. New list from the modal - Самоцвет Чутья, 1100x900, no seed: the
 *  pre-measured case this fix was verified against. */
async function newListFromModal() {
  const { ctx, page, d } = await fresh({ width: 1100, height: 900 });
  await d.open('#/tables');
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
 *  what it clips against. Кольцо Тишины at 1100x900 with no lists seeded is
 *  the exact case the defect's own evidence measured (`.card.scrollTop` 109). */
async function addToListMenuStaysInModal() {
  const { ctx, page, d } = await fresh({ width: 1100, height: 900 });
  await d.open('#/tables');
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

  const { ctx: ctx2, d: d2 } = await fresh({ width: 1180, height: 900 });
  await d2.open('#/tables/other_frames/f_frame-beast_feast-colossus');
  const rows2 = await d2.count('.rows .row[data-row]');
  ok(rows2 === 57, '5 (link arriving fresh): ' + rows2 + ' rows instead of 57');
  const pills2 = await d2.count('.fpill');
  ok(pills2 === 2, '5 (link arriving fresh): ' + pills2 + ' pills instead of 2');
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
 *  context share its storage. Page B opens first and stays on #/lists; page A opens second
 *  and creates a list; B must redraw on the storage event with no
 *  navigation of its own. */
async function twoTabsShareStorage() {
  const b = await sharedPage({ width: 1180, height: 900 });
  /* The test's own listener, independent of app/src/ports/storage.ts's -
   * it answers "did Chrome deliver the event at all" on its own, so a
   * timeout below can say which half failed instead of one sentence
   * covering both. */
  await b.page.evaluateOnNewDocument(() => {
    window.addEventListener('storage', (e) => {
      /* Gated on the list key, so prepare()'s own
       * localStorage.clear() on the next fresh() call cannot satisfy this
       * stage by itself - the two stages stay disjoint as designed. */
      if (e.key === 'dhloot.lists.v2') window.__storageSeen = (window.__storageSeen || 0) + 1;
    });
  });
  await b.d.open('#/lists');
  ok(
    (await b.page.evaluate(() => document.body.innerText)).includes('Списков пока нет'),
    '7 (two windows): page B does not start with an empty list'
  );

  const a = await sharedPage({ width: 1180, height: 900 });
  await a.d.open('#/lists');
  await a.d.type('Например: клад дракона', 'Общий клад');
  await a.d.click('Создать');
  ok(
    (await a.page.evaluate(() => document.body.innerText)).includes('Общий клад'),
    '7 (two windows): page A did not create the list'
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
      await b.page.waitForFunction(() => document.body.innerText.includes('Общий клад'), {
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
 *  thumbnail, and proves the row never asks for the 640 px file. */
async function brokenArtPath() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
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
      return { x: r.x, bottom: r.bottom };
    }, i);
    const clip = {
      x: Math.round(rect.x),
      y: Math.round(rect.bottom - 3),
      width: 200,
      height: 3
    };
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
 *  the legacy `qa.js`. */
async function tileGeometryNoArt() {
  const { ctx, page, d } = await fresh({ width: 360, height: 800 });
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
  const { ctx, page, d } = await fresh({ width: 1280, height: 900 });
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
    await d.open('#/i/ci1');
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
 *  is installable, and the footer links the install guide and the two
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
    ok(
      await page.evaluate(
        () =>
          document.head.querySelector('link[rel="manifest"]')?.getAttribute('href') ===
          './manifest.webmanifest'
      ),
      at + 'the page has no manifest link'
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
 *  focused `.card-media`, against the ring's own colour. */
async function cardMediaRingVisible() {
  async function ringAt(route, selector, label) {
    const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
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
      await page.evaluate(
        (sel) => document.querySelector(sel).scrollIntoView({ block: 'center' }),
        selector
      );
      const box = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        const r = el.getBoundingClientRect();
        const m = /rgba?\((\d+), (\d+), (\d+)/.exec(getComputedStyle(el).outlineColor);
        return {
          x: r.x,
          y: r.y,
          w: r.width,
          h: r.height,
          rgb: m ? m.slice(1, 4).map(Number) : null
        };
      }, selector);
      const clip = {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.w),
        height: Math.round(box.h)
      };
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
            len
        );
      }
    }
    await ctx.close();
  }
  await ringAt('#/i/ci1', '.card.full .card-media', 'full');
  await ringAt('#/roll/wondrous', '.card.compact .card-media', 'compact');
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
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
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
  ['35 (fake cloud signed state)', fakeCloudSignedState]
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
