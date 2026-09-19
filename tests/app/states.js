/* The states a real click reaches, and nothing else does.
 *
 * Every other suite under tests/app/ opens a route and reads what is there;
 * this one presses controls with `press` - a trusted puppeteer
 * ElementHandle.click(), not the synthetic `el.click()` every parity state
 * and every legacy suite uses - because a handful of real defects only show
 * up on the far side of a browser's own microtask checkpoint (the
 * `isConnected` guard) or need a real network, a real clipboard stub, or a
 * real second tab to mean anything at all. Twenty-three cases, no ancestor. */
const fs = require('fs');
const { PNG } = require('pngjs');
const { fresh, sharedPage, reporter, closeBrowser } = require('./lib.js');
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
    ok(inside(box, card), '3 (modal): the input sits outside .modal-card (DEBT.md D6)');
  }
  await ctx.close();
}

/** 23. The add-to-list menu inside the record modal must not force a scroll
 *  on the card article, nor spill outside the modal - DEBT.md D6, paid off:
 *  the toggle (`:scope > .btn`), not whichever button happens to render
 *  first, is what the placement effect measures, and the modal's own card is
 *  what it clips against. Кольцо Тишины at 1100x900 with no lists seeded is
 *  the exact case D6's own evidence measured (`.card.scrollTop` 109). */
async function addToListMenuStaysInModal() {
  const { ctx, page, d } = await fresh({ width: 1100, height: 900 });
  await d.open('#/tables');
  await d.press('Кольцо Тишины');
  ok(await d.has('Добавить в список'), '23 (menu in the modal): the modal did not open');
  await d.press('Добавить в список');

  /* `.card` is `overflow: clip` (RecordCard.svelte), which creates no
     scroll container, so a `.card.scrollTop` reading would be 0 regardless
     of what the placement effect does - it stopped being able to fail and
     is not what D6's fix actually measures. The real invariant is that
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
    ok(
      inside(menu, card),
      '23 (menu in the modal): the menu sits outside .modal-card (DEBT.md D6)'
    );
  }

  await d.press('+ Новый список');
  const input = await newListInputBox(page);
  ok(!!input, '23 (menu in the modal): the new-list form did not open');
  ok(!!input?.focused, '23 (menu in the modal): the input is not focused');
  if (input && card) {
    ok(
      inside(input, card),
      '23 (menu in the modal): the input sits outside .modal-card (DEBT.md D6)'
    );
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

/** 7. Two pages sharing storage - file:// pages share one origin's storage
 *  in Chrome. Page B opens first and stays on #/lists; page A opens second
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

/** 10. Copy image - a live-shared defect this case found rather than one it
 *  proves closed: `docs/specs/DEBT.md` D10. Loading the record's own
 *  picture onto a `<canvas>` taints it on *both* apps under `file://`
 *  (Chrome has no `--allow-file-access-from-files`, so even a sibling file
 *  in the same folder the document opened from reads as cross-origin) -
 *  `canvas.toDataURL()` throws "Tainted canvases may not be exported" on
 *  both apps for the identical picture; `toBlob()` does not throw in this
 *  Chromium build, it simply never calls back, which is what made this
 *  invisible (`tests/app/driver.js`'s `clipboardImage()`
 *  reads a *pending promise*'s absent `.arrayBuffer` as `null` on both
 *  sides, so parity's own `copiedImage` spec has been comparing two
 *  identical nulls). D10, paid off: `RecordActions.svelte`'s `copyImage`
 *  now probes `toDataURL` itself and a `toBlob` watchdog, so the rejection
 *  is real rather than a promise that never settles - this reads whichever
 *  of the two outcomes this build actually produces (a real picture, on a
 *  build that is not tainted; the record's text and its own `imgTainted`
 *  toast, on this one) rather than racing a timeout against a hang. */
async function copyImage() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/i/ci1');
  await d.press('Скопировать изображение');
  const result = await page.evaluate(async () => {
    const m = window.__clip;
    const imgKey = m && Object.keys(m).find((k) => k.startsWith('image/'));
    const textKey = m && m['text/plain'] ? 'text/plain' : null;
    if (imgKey) return { blob: (await m[imgKey]).size };
    if (textKey) return { text: await m[textKey].text() };
    return { neither: true };
  });
  if ('blob' in result) {
    ok(result.blob > 0, '10 (copy image, D10): the copied picture is empty');
  } else {
    ok(
      typeof result.text === 'string' && result.text.length > 0,
      '10 (copy image, D10): neither the picture nor the fallback text arrived - ' +
        JSON.stringify(result)
    );
    const toast = await page.evaluate(
      () => document.querySelector('.toast')?.textContent || ''
    );
    ok(
      toast.includes('Не удалось скопировать картинку - скопирован текст'),
      '10 (copy image, D10): the toast about the unavailable picture is not shown - ' + toast
    );
  }
  await ctx.close();
}

/** 11. A broken art path - the real <img> error path, not a data mutation:
 *  the request for one record's own picture is aborted, so the browser
 *  fires a genuine error event and the port's own onartfail/markArtBroken
 *  path runs for real. */
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

/** 24. D1, paid off: the real reduced-motion policy - every transition and
 *  animation dies under `prefers-reduced-motion: reduce`, not only the
 *  card's entrance and the section outline's fade `RecordCard.svelte`/
 *  `TablesPage.svelte` killed by name. Explicit here even though `prepare()`
 *  already emulates the same media feature for every other case
 *  (`driver.js`'s own comment: D1 is the app's shipped behaviour for a
 *  visitor who asked for less motion, and this is what makes every suite
 *  exercise that branch, not a timing convenience) - this is the one case
 *  whose whole point is proving the policy itself, not relying on it as a
 *  side effect of something else. Hovers a button (the transition class) and
 *  crosses the 600px breakpoint (the responsive class) in the same pass. */
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
    '24 (reduced motion, D1): animations are still running under reduce - ' + running
  );
  await ctx.close();
}

/** 25. The storage-notice dismiss button stays hit-testable while its
 *  `<details>` is folded - real-browser coverage of exactly the regression
 *  class D3's fix could only be verified against by eye: jsdom does
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
  ['25 (notice dismiss while folded)', storageNoticeDismissWhileFolded]
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
      : '\nreal-input states (dist/): all twenty-four passed'
  );
  process.exit(rep.failed ? 1 : 0);
})();
