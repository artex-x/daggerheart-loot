/* The states a real click reaches, and nothing else does.
 *
 * Every other suite under tests/app/ opens a route and reads what is there;
 * this one presses controls with `press` - a trusted puppeteer
 * ElementHandle.click(), not the synthetic `el.click()` every parity state
 * and every legacy suite uses - because a handful of real defects only show
 * up on the far side of a browser's own microtask checkpoint (B11's
 * `isConnected` guard) or need a real network, a real clipboard stub, or a
 * real second tab to mean anything at all. Thirteen cases, no ancestor. */
const fs = require('fs');
const { fresh, sharedPage, reporter, closeBrowser } = require('./lib.js');

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
  await d.open('#/tables/frames');
  await d.click('Фильтры');
  await d.click('Пир зверей');
  await d.click('Колоссы Сухоземья');
  const hash1 = await d.hash();
  ok(
    hash1 === '#/tables/frames/f_frame-beast_feast-colossus',
    '4 (два фрейма): адрес ' + hash1 + ', ожидали f_frame-beast_feast-colossus'
  );
  const rows1 = await d.count('.rows .row[data-row]');
  ok(rows1 === 57, '4 (два фрейма): ' + rows1 + ' строк вместо 57');
  const pills1 = await d.count('.fpill');
  ok(pills1 === 2, '4 (два фрейма): ' + pills1 + ' пиллов вместо 2');
  await ctx.close();

  const { ctx: ctx2, d: d2 } = await fresh({ width: 1180, height: 900 });
  await d2.open('#/tables/frames/f_frame-beast_feast-colossus');
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

  /* No navigation on B - the storage event alone must redraw it. */
  await b.page.waitForFunction(() => document.body.innerText.includes('Общий клад'), { timeout: 5000 }).catch(() => {});
  const bSees = (await b.page.evaluate(() => document.body.innerText)).includes('Общий клад');
  ok(bSees, '7 (два окна): страница B не увидела список, созданный на A, без перехода');

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
 *  invisible before B12 (`tests/parity/driver.js`'s `clipboardImage()`
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
  await ctx.close();
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
  ['13 (высота заметки)', noteTextareaHeight]
];

(async () => {
  /* Each case gets its own try/catch: a hung CDP call under host load
   * (this tree is shared - CLAUDE.md, "Task and session protocol") must not
   * take the other twelve cases down with it, and a synchronous write - not
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
  console.log(rep.failed ? '\n' + rep.failed + ' FAILED' : '\nсостояния реального ввода (dist/): все тринадцать пройдены');
  process.exit(rep.failed ? 1 : 0);
})();
