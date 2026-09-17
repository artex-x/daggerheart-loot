/* The states a real click reaches, and nothing else does.
 *
 * Every other suite under tests/app/ opens a route and reads what is there;
 * this one presses controls with `press` - a trusted puppeteer
 * ElementHandle.click(), not the synthetic `el.click()` every parity state
 * and every legacy suite uses - because a handful of real defects only show
 * up on the far side of a browser's own microtask checkpoint (B11's
 * `isConnected` guard) or need a real network, a real clipboard stub, or a
 * real second tab to mean anything at all. Twenty-two cases, no ancestor. */
const fs = require('fs');
const { fresh, sharedPage, reporter, closeBrowser } = require('./lib.js');
const { TARGETS, ready } = require('./driver.js');

const rep = reporter();
const { ok } = rep;

/** Case 7's two-stage wait budget. Set against tests/app/lib.js:37's own
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
  return a.x >= b.x - 0.5 && a.y >= b.y - 0.5 && a.x + a.w <= b.x + b.w + 0.5 && a.y + a.h <= b.y + b.h + 0.5;
}

/** 1. New list from the card. */
async function newListFromCard() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/i/ci1');
  await d.press('Добавить в список');
  await d.press('+ Новый список');
  const box = await newListInputBox(page);
  ok(!!box, '1 (карточка): форма нового списка не открылась');
  ok(!!box?.focused, '1 (карточка): поле ввода не в фокусе');
  ok(await d.has('Создать'), '1 (карточка): меню закрылось после "+ Новый список"');
  await ctx.close();
}

/** 2. New list from the selection bar. */
async function newListFromBar() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/tables');
  await d.click('Выбрано'); // ticking a row is not this case's point
  await d.press('Добавить в список');
  await d.press('+ Новый список');
  const box = await newListInputBox(page);
  ok(!!box, '2 (панель выбора): форма нового списка не открылась');
  ok(!!box?.focused, '2 (панель выбора): поле ввода не в фокусе');
  await ctx.close();
}

/** 3. New list from the modal - the cell B11.1's fix turned, and the plan's
 *  own pre-measured one: Самоцвет Чутья, 1100x900, no seed. */
async function newListFromModal() {
  const { ctx, page, d } = await fresh({ width: 1100, height: 900 });
  await d.open('#/tables');
  await d.press('Самоцвет Чутья');
  ok(await d.has('Добавить в список'), '3 (модалка): модалка не открылась');
  await d.press('Добавить в список');
  await d.press('+ Новый список');
  const box = await newListInputBox(page);
  ok(!!box, '3 (модалка): форма нового списка не открылась');
  ok(!!box?.focused, '3 (модалка): поле ввода не в фокусе');
  const card = await page.evaluate(() => {
    const el = document.querySelector('.modal-card');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  ok(!!card, '3 (модалка): .modal-card не найден');
  if (box && card) {
    ok(inside(box, card), '3 (модалка): поле ввода лежит вне .modal-card (DEBT.md D6)');
  }
  await ctx.close();
}

/** 4/5. Two frames picked, and the same link arriving fresh - decided 7,
 *  defect 1: the live side legitimately reads 0 on arrival, so no parity
 *  state can hold this one. */
async function twoFramesPicked() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/tables/other_frames');
  await d.press('Фильтры');
  await d.press('Пир зверей');
  await d.press('Колоссы Сухоземья');
  const hash1 = await d.hash();
  ok(
    hash1 === '#/tables/other_frames/f_frame-beast_feast-colossus',
    '4 (два фрейма): адрес ' + hash1 + ', ожидали f_frame-beast_feast-colossus'
  );
  const rows1 = await d.count('.rows .row[data-row]');
  ok(rows1 === 57, '4 (два фрейма): ' + rows1 + ' строк вместо 57');
  const pills1 = await d.count('.fpill');
  ok(pills1 === 2, '4 (два фрейма): ' + pills1 + ' пиллов вместо 2');
  await ctx.close();

  const { ctx: ctx2, d: d2 } = await fresh({ width: 1180, height: 900 });
  await d2.open('#/tables/other_frames/f_frame-beast_feast-colossus');
  const rows2 = await d2.count('.rows .row[data-row]');
  ok(rows2 === 57, '5 (ссылка с ходу): ' + rows2 + ' строк вместо 57');
  const pills2 = await d2.count('.fpill');
  ok(pills2 === 2, '5 (ссылка с ходу): ' + pills2 + ' пиллов вместо 2');
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
  ok(inDialog, '6 (диалог): фокус не попал внутрь диалога при открытии');

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
    ok(escaped < 2, '6 (диалог): Tab вывел фокус за пределы диалога и не вернул его на следующем шаге');
  }

  /* The page behind is inert: trying to focus something outside directly
   * must not move focus there. */
  const blocked = await page.evaluate(() => {
    const outside = document.querySelector('nav.tabs a, .tablenav a, .tablenav button');
    if (!outside) return true;
    outside.focus();
    return document.activeElement !== outside;
  });
  ok(blocked, '6 (диалог): фон не инертен - элемент за диалогом принял фокус');

  await page.keyboard.press('Escape');
  const closed = await page.evaluate(() => !document.querySelector('dialog[open]'));
  ok(closed, '6 (диалог): Escape не закрыл диалог');
  const returned = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(
      (b) => (b.textContent || '').includes('Кольцо Тишины')
    );
    return !!btn && btn === document.activeElement;
  });
  ok(returned, '6 (диалог): фокус не вернулся на открывавшую строку');
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
      /* R0b.1 review nit 6: gated on the list key, so prepare()'s own
       * localStorage.clear() on the next fresh() call cannot satisfy this
       * stage by itself - the two stages stay disjoint as designed. */
      if (e.key === 'dhloot.lists.v2') window.__storageSeen = (window.__storageSeen || 0) + 1;
    });
  });
  await b.d.open('#/lists');
  ok(
    (await b.page.evaluate(() => document.body.innerText)).includes('Списков пока нет'),
    '7 (два окна): страница B не начинает с пустого списка'
  );

  const a = await sharedPage({ width: 1180, height: 900 });
  await a.d.open('#/lists');
  await a.d.type('Например: клад дракона', 'Общий клад');
  await a.d.click('Создать');
  ok(
    (await a.page.evaluate(() => document.body.innerText)).includes('Общий клад'),
    '7 (два окна): страница A не создала список'
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
  ok(storageDelivered, `7 (два окна): страница B не получила событие storage за ${STORAGE_WAIT_MS / 1000}с`);

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
    ok(repainted, '7 (два окна): событие storage пришло, но страница B не перерисовалась');
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
  const seedIds = ['ci1', 'cc1', 'q1', 'q313', 'w1', 'cm1', 'ci28', 'ci56', 'q239', 'cc2', 'w2', 'q26'];
  const bigNote =
    'Очень длинная заметка про весь список, чтобы сжатый вариант точно перевесил издержки заголовка deflate. '.repeat(4);
  const { ctx, page, d } = await fresh({
    width: 1180, height: 900,
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
  ok(!!m, '8 (упакованная ссылка): скопированный текст не содержит #/l/~ - ' + text.slice(0, 120));
  if (m) {
    await d.open('#/l/' + m[1]);
    await d.expanded();
    /* Not the list's own name: the payload matches this browser's own
     * stored list 'a' (the same page shared it from), so it opens as the
     * owner's page - `.titleinput`'s value, not text content - the same
     * way on both apps. What proves the packed round trip is the count and
     * the long note, which are body text either way. */
    const seen = await page.evaluate(() => document.body.innerText);
    ok(seen.includes('12 позиций'), '8 (упакованная ссылка): не все позиции распаковались - ' + seen.slice(0, 200));
    /* The note is a <textarea>'s value, not rendered text - innerText does
     * not carry it. */
    const noteValue = await page.evaluate(() => document.querySelector('textarea')?.value || '');
    ok(
      noteValue.includes('перевесил издержки заголовка'),
      '8 (упакованная ссылка): длинная заметка не распаковалась - ' + noteValue.slice(0, 80)
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
  ok(!!clip?.text, '9 (копия текста): text/plain не попал в буфер');
  ok(!!clip?.html, '9 (копия текста): text/html не попал в буфер');
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
 *  invisible before B12 (`tests/app/driver.js`'s `clipboardImage()`
 *  reads a *pending promise*'s absent `.arrayBuffer` as `null` on both
 *  sides, so parity's own `copiedImage` spec has been comparing two
 *  identical nulls). What this case can honestly assert today is the shape
 *  of the defect - drawing succeeds, the blob promise never settles - not a
 *  successful copy; D10 names the fix and what replaces this case once it
 *  lands. */
async function copyImage() {
  const { ctx, page, d } = await fresh({ width: 1180, height: 900 });
  await d.open('#/i/ci1');
  await d.press('Скопировать изображение');
  const result = await page.evaluate(async () => {
    const m = window.__clip;
    const key = m && Object.keys(m).find((k) => k.startsWith('image/'));
    if (!key) return { noClip: true };
    const settled = Symbol('unsettled');
    const timeout = new Promise((resolve) => {
      setTimeout(() => {
        resolve(settled);
      }, 5_000);
    });
    const raced = await Promise.race([m[key].then((b) => ({ blob: b })).catch((e) => ({ err: e.message })), timeout]);
    return raced === settled ? { pending: true } : raced;
  });
  ok(!!result.pending, '10 (копия картинки, D10): промис не завис, как ожидалось - ' + JSON.stringify(result));
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
  const src = await page.evaluate(() => document.querySelector('.card-media img')?.getAttribute('src'));
  ok(/_none\.webp$/.test(src || ''), '11 (без картинки): вместо заглушки — ' + src);
  ok(await d.has('Скопировать текст'), '11 (без картинки): кнопка текста пропала вместе с картинкой');
  /* R0b.4's divergence 3: the copy-image button must go with the picture,
   * not just switch to offering the placeholder (RecordActions.svelte:105,
   * restored to it.img && !app.artBroken(it.id) - app.js:1684's hasImage). */
  ok(!(await d.has('Скопировать изображение')), '11 (без картинки): кнопка копирования картинки должна пропасть вместе с картинкой');
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
    (ph) => document.activeElement instanceof HTMLInputElement && document.activeElement.placeholder === ph,
    'Поиск по названию или описанию…'
  );
  ok(stillFocused, '12 (фокус переживает ввод): фокус ушёл с поля поиска после перерисовки');
  await ctx.close();
}

/** 13. The note textarea's height - grows to fit, which jsdom cannot
 *  measure at all (no layout). */
async function noteTextareaHeight() {
  const { ctx, page, d } = await fresh({
    width: 1180, height: 900,
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
  ok(before !== null, '13 (высота заметки): текстовое поле не найдено');
  await d.type(PH, 'Строка первая\nСтрока вторая\nСтрока третья\nСтрока четвёртая\nСтрока пятая');
  const after = await page.evaluate((ph) => {
    const ta = document.querySelector(`textarea[placeholder="${ph}"]`);
    if (!ta) return null;
    return { height: parseFloat(getComputedStyle(ta).height), scrollHeight: ta.scrollHeight };
  }, PH);
  ok(!!after, '13 (высота заметки): текстовое поле пропало после ввода');
  if (before !== null && after) {
    ok(after.height > before, '13 (высота заметки): поле не выросло - было ' + before + ', стало ' + after.height);
    ok(
      after.height >= after.scrollHeight - 1 || after.height >= 320,
      '13 (высота заметки): высота ' + after.height + ' меньше содержимого ' + after.scrollHeight
    );
  }

  /* The list's own note group (notes.js:256-311) - a second, independent
   * pair of boxes at `.lnote`, closed by default until its summary is
   * pressed, plus the clear cross's `:has(:placeholder-shown)` visibility
   * (notes.js:225-241) - a real-CSS read jsdom cannot make. */
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
    '13 (заметки списка): пустая заметка открывается не на три строки - ' + lnoteLines.join(',')
  );

  await d.type(LIST_PH, Array.from({ length: 8 }, (_, i) => 'строка ' + i).join('\n'));
  lnoteLines = await boxLines();
  ok(lnoteLines[0] >= 8, '13 (заметки списка): публичное поле не выросло под текст - ' + lnoteLines[0]);
  ok(lnoteLines[1] === 3, '13 (заметки списка): соседнее поле выросло заодно - ' + lnoteLines[1]);

  await d.type(LIST_PH, Array.from({ length: 80 }, (_, i) => 'строка ' + i).join('\n'));
  const tall = await page.$eval('.lnote .n-pub textarea', (t) => ({
    h: t.offsetHeight,
    over: t.scrollHeight > t.clientHeight
  }));
  ok(tall.h <= 320, '13 (заметки списка): поле переросло потолок - ' + tall.h);
  ok(tall.over, '13 (заметки списка): выше потолка текст должен прокручиваться');

  await d.type(LIST_PH, 'одна строка');
  lnoteLines = await boxLines();
  ok(lnoteLines[0] === 3, '13 (заметки списка): поле не вернулось к трём строкам - ' + lnoteLines[0]);

  const crossVisible = await page.evaluate(() =>
    [...document.querySelectorAll('.lnote .note-x')].map((x) => getComputedStyle(x).display)
  );
  ok(
    crossVisible.length === 2 && crossVisible[0] !== 'none' && crossVisible[1] === 'none',
    '13 (заметки списка): крестик показан не у того поля - ' + crossVisible.join(',')
  );

  await ctx.close();
}

/** 14. A roll replaces its card's <img>, as the live app does - it rebuilds
 *  #view.innerHTML on every render, so a new record's picture is always a
 *  brand-new node that paints empty and fills; `RollPanel.svelte`'s
 *  `{#key shown.it}` (issue 47, "B14 planned") reproduces that. Node identity
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
  ok(marked, '14 (карточка ролла): исходный <img> не найден - .results .card-media img переименован?');
  const rollName = await page.evaluate(() => {
    const btn = document.querySelector('.numrow button.primary');
    return btn ? (btn.textContent || '').replace(/\s+/g, ' ').trim() : '';
  });
  ok(!!rollName, '14 (карточка ролла): кнопка броска не найдена');

  let replaced = false;
  for (let i = 0; rollName && i < 20 && !replaced; i++) {
    await d.press(rollName);
    replaced = await page.evaluate(
      () => !document.querySelector('.results .card-media img[data-mark]')
    );
  }
  ok(replaced, '14 (карточка ролла): узел <img> выжил после броска на другую запись');
  await ctx.close();
}

/** 15. Real history - Back/Forward, not only the hash changing.
 *  `behave.js:303-312`. */
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
  ok(chip === 'Броня', '15 (навигация): назад вернуло не ту таблицу - ' + chip);
  await page.goForward();
  await d.settle();
  /* The live `#sq` has no ported id - `input[type=search]` is the driver's
   * own structural stand-in (driver.js's `typeAt` doc comment). */
  const hasSearch = await d.count('input[type="search"]');
  ok(hasSearch > 0, '15 (навигация): вперёд не вернуло поиск');
  await ctx.close();
}

/** 16. The selection bar pinned to the viewport bottom, and its buttons not
 *  spilling at 360. `select.js:54-57`, `craftmob.js:77-99`. */
async function selectionBarGeometry() {
  const { ctx, page, d } = await fresh({ width: 1000, height: 900 });
  await d.open('#/tables/core_item');
  await d.click('Выбрано');
  const gap = await page.evaluate(() => {
    const w = document.querySelector('.selbarwrap');
    return w ? Math.abs(w.getBoundingClientRect().bottom - window.innerHeight) : null;
  });
  ok(gap !== null && gap <= 2, '16 (панель выбора): панель не прижата к низу окна - ' + gap);
  await ctx.close();

  const { ctx: ctx2, page: page2, d: d2 } = await fresh({ width: 360, height: 840 });
  await d2.open('#/tables/core_item');
  await d2.click('Выбрано');
  const spill = await page2.evaluate((w) => {
    const out = [];
    document.querySelectorAll('.selbarwrap .btn').forEach((b) => {
      const r = b.getBoundingClientRect();
      if (b.scrollWidth > b.clientWidth + 1) out.push('подпись обрезана: ' + b.textContent.trim());
      if (r.left < -1 || r.right > w + 1) out.push('кнопка за краем экрана: ' + b.textContent.trim());
    });
    return out;
  }, 360);
  ok(spill.length === 0, '16 (панель выбора, 360px): ' + spill.join('; '));
  await ctx2.close();
}

/** 17. A real HTML5 drag reorder. `lists2.js:61-79`. */
async function dragReorder() {
  const seedIds = ['ci1', 'ci2', 'ci3', 'ci4'];
  const { ctx, page, d } = await fresh({
    width: 1180, height: 900,
    storage: {
      'dhloot.lists.v2': JSON.stringify([{ id: 'a', name: 'Тайник', ids: seedIds, created: 1 }])
    }
  });
  await d.open('#/lists/a');
  /* Three round trips, not one: `app/src/ports/drag.ts`'s handlers write to
   * `$state`, and Svelte's own microtask-scheduled flush (CLAUDE.md, the
   * `queueMicrotask` note) has not necessarily run by the time a *single*
   * `page.evaluate()` call's own script returns - unlike the live app's
   * imperative classList write, which lists2.js:61-79 could read back in the
   * same call. Splitting dispatch from read across separate CDP round trips
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
        bubbles: true, cancelable: true, dataTransfer: window.__dragDT, clientY: box.top + box.height - 2
      })
    );
  });
  await d.settle();
  const dragged = await page.evaluate(() => document.querySelectorAll('.lrow')[2].className);
  ok(/drop-after/.test(dragged), '17 (перетаскивание): место вставки не подсвечено - ' + dragged);

  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.lrow')];
    const box = rows[2].getBoundingClientRect();
    rows[2].dispatchEvent(
      new DragEvent('drop', {
        bubbles: true, cancelable: true, dataTransfer: window.__dragDT, clientY: box.top + box.height - 2
      })
    );
  });
  await d.settle();
  const order = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('dhloot.lists.v2') || '[]');
    const list = stored.find((l) => l.id === 'a');
    return list ? list.ids.join(',') : '';
  });
  ok(order === 'ci2,ci3,ci1,ci4', '17 (перетаскивание): итоговый порядок ' + order);
  const stillDragging = await d.count('.lrow.dragging');
  ok(stillDragging === 0, '17 (перетаскивание): строка осталась в состоянии перетаскивания');
  await ctx.close();
}

/** 18. A folded `<details>` surviving a select-all/money-mode re-render.
 *  `lists2.js:571-589`. */
async function foldedDetailsSurviveRerender() {
  const { ctx, page, d } = await fresh({
    width: 1180, height: 900,
    storage: {
      'dhloot.lists.v2': JSON.stringify([
        { id: 'a', name: 'Тайник', ids: ['ci1', 'ci2', 'ci3'], created: 1, meta: { ci1: { gold: 70 } } }
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
    '18 (свёрнутые панели): «выбрать все» развернуло свёрнутое - ' + JSON.stringify(open1)
  );

  await d.click('Монетами');
  const open2 = await openState();
  ok(
    open2.note === false && open2.roll === false,
    '18 (свёрнутые панели): смена режима цен развернула свёрнутое - ' + JSON.stringify(open2)
  );
  await ctx.close();
}

/** 19. Tile geometry with no art loaded - `/img/*.webp` left unanswered by
 *  request interception, never aborted and never continued.
 *  `qa.js:266-283`. */
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
  ok(widths.length === 1 && widths[0] > 100, '19 (плитки без картинок): ширины ' + widths.join(', '));
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
  ok(clash === 0, '19 (плитки без картинок): галочка налезла на подпись у ' + clash + ' плиток');
  page.off('request', onReq);
  await ctx.close();
}

/** 20. The storage notice folded on a phone. `qa.js:359-368`. */
async function storageNoticeAt320() {
  const { ctx, page, d } = await fresh({
    width: 320, height: 700,
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
  ok(!!warn, '20 (предупреждение на 320): .warn не найден');
  if (warn) {
    ok(warn.h < 140, '20 (предупреждение на 320): свёрнутое предупреждение занимает ' + Math.round(warn.h) + 'px');
    ok(warn.xw > 0, '20 (предупреждение на 320): крестик не виден, пока предупреждение свёрнуто');
  }
  await ctx.close();
}

/** 21. A button keeps focus across a re-render - not only an input (case
 *  12). `qa.js:122-134`. */
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
  ok(afterRoll, '21 (фокус кнопки): после броска с клавиатуры фокус ушёл с кнопки');

  await page.evaluate(() => document.querySelector('.chip[data-val="core"]')?.focus());
  await page.keyboard.press('Enter');
  await d.settle();
  const afterSrc = await page.evaluate(() => {
    const a = document.activeElement;
    return a instanceof HTMLElement && a.matches('.chip[data-val="core"]');
  });
  ok(afterSrc, '21 (фокус источника): после переключения источника фокус потерян');
  await ctx.close();
}

/** 22. The money help box measured against its container, and the pressed
 *  add-to-list button's own colour. `lists2.js:338-355, 144-156`. */
async function moneyHelpAndPressedPicker() {
  const { ctx, page, d } = await fresh({
    width: 1180, height: 900,
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
    return { box: h.classList.contains('helpbox'), w: h.getBoundingClientRect().width, cw: c.getBoundingClientRect().width };
  });
  ok(!!helpBox, '22 (справка и выбор списка): .money-help не открылась');
  if (helpBox) {
    ok(helpBox.box, '22 (справка и выбор списка): справка о золоте - не та рамка');
    ok(
      Math.abs(helpBox.w - helpBox.cw) < 2,
      '22 (справка и выбор списка): справка о золоте не по ширине контейнера - ' + helpBox.w + ' из ' + helpBox.cw
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
  ok(!!btn, '22 (справка и выбор списка): кнопка .cardpick .btn не найдена');
  if (btn) {
    ok(btn.on, '22 (справка и выбор списка): нажатая кнопка не помечена on');
    ok(btn.color !== 'rgb(99, 194, 148)', '22 (справка и выбор списка): нажатая кнопка снова бирюзовая - ' + btn.color);
  }
  await ctx2.close();
}

const CASES = [
  ['1 (новый список с карточки)', newListFromCard],
  ['2 (панель выбора)', newListFromBar],
  ['3 (модалка)', newListFromModal],
  ['4/5 (два фрейма)', twoFramesPicked],
  ['6 (диалог)', dialogSemantics],
  ['7 (два окна)', twoTabsShareStorage],
  ['8 (упакованная ссылка)', packedLink],
  ['9 (копия текста)', copyTextThroughClipboard],
  ['10 (копия картинки)', copyImage],
  ['11 (без картинки)', brokenArtPath],
  ['12 (фокус переживает ввод)', focusSurvivesKeystroke],
  ['13 (высота заметки)', noteTextareaHeight],
  ['14 (карточка ролла)', rollReplacesCardImg],
  ['15 (навигация)', historyBackForward],
  ['16 (панель выбора)', selectionBarGeometry],
  ['17 (перетаскивание)', dragReorder],
  ['18 (свёрнутые панели)', foldedDetailsSurviveRerender],
  ['19 (плитки без картинок)', tileGeometryNoArt],
  ['20 (предупреждение на 320)', storageNoticeAt320],
  ['21 (фокус кнопки)', buttonFocusSurvivesRerender],
  ['22 (справка и выбор списка)', moneyHelpAndPressedPicker]
];

(async () => {
  /* Each case gets its own try/catch: a hung CDP call under host load
   * (this tree is shared - CLAUDE.md, "Task and session protocol") must not
   * take the other cases down with it, and a synchronous write - not
   * console.log's own buffering - is what survives a crash that follows
   * immediately after. */
  for (const [label, fn] of CASES) {
    fs.writeSync(1, 'запуск: ' + label + '\n');
    try {
      await fn();
    } catch (e) {
      rep.ok(false, label + ': упало - ' + (e && e.message ? e.message : String(e)));
    }
  }

  await closeBrowser().catch(() => {});
  console.log(rep.failed ? '\n' + rep.failed + ' FAILED' : '\nсостояния реального ввода (dist/): все двадцать два пройдены');
  process.exit(rep.failed ? 1 : 0);
})();
