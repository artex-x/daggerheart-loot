/* Batch 1b mock: the no-picture placeholder retired (plan section 7, batch
   1b; owner, 2026-10-29). The colour print card of a record with no picture
   draws the kind glyph in its art block on the lighter print well (a
   paper-side tone, the glyph in dark ink); the screen keeps the dark well.
   The black-and-white card stays as it is (Q1b.1). A link card of a
   no-picture item takes the site share card as og:image. The print cards are
   R's captures of PrintCard.svelte; only the art block is drawn over them. */
(function () {
  const { R, LANG } = window.M;
  const { E, FI, addr } = window.UA;
  const RA = window.RA;
  const { cap, seg } = RA;
  const rpage = (...a) => window.RX.rpage(...a);
  const en = LANG === 'en' ? '-en' : '';

  /* One color card: `well` is 'none' (the picture), 'light' (print),
     'dark' (the screen tone, for comparison) or 'blank' (what Figma node
     714-42387 prints: blank paper). The art block of the two captures ends
     at a different height (RU 69.5%, EN 77%), so the drawn block follows
     its capture and no dark band shows under it (mocks-1 M1b-2). */
  const card = (well = 'none', glyph = 'kindItem', txt = null) =>
    `<div class="pcm ${en ? 'en' : ''}"><img src="../shared/printcard-ci1${en}.png" alt="">${well === 'none' ? '' : `<div class="pcm-art ${well}">${well === 'blank' ? '' : `<span>${FI(glyph)}</span>`}</div>`}${txt ? `<div class="pcm-text"><span class="pb">${txt.badge}</span><b>${txt.name}</b><p>${txt.desc}</p><div class="pf"><i>Daggerheart</i><i>${txt.foot}</i></div></div>` : ''}</div>`;
  const fig = (c, html) => `<figure class="pfig"><figcaption>${c}</figcaption>${html}</figure>`;
  /* R holds a black-and-white capture in Russian only, so the EN page says
     what it shows instead of showing Russian text (mocks-1 M1b-3). */
  const bwCard = () =>
    en
      ? `<div class="note">No English capture of the black-and-white card exists in the mock set. The card is unchanged: the black-and-white layout has no art block for any record.</div>`
      : `<div class="pcm"><img src="../shared/preview-emberaxe-bw.png" alt=""></div>`;

  function printCard() {
    const tiles = ['kindWeapon', 'kindConsumable', 'kindItem', 'kindArmor']
      .map((g) => `<div class="lwell"><span>${FI(g)}</span></div>`)
      .join('');
    const main = `<main class="wrap"><div class="spec">
      <h1>${E('Цветная карточка без картинки', 'A color card with no picture')}</h1>
      ${cap('в печати ниша светлая (тон бумаги, знак тёмной краской); на экране ниша остаётся тёмной; раскладка 63×88 мм не меняется', 'in print the well is light (a paper tone, the glyph in dark ink); on screen the well stays dark; the 63x88 mm layout does not change')}
      <div class="grid2">
        <section class="panel box wide"><h3>${E('Цветная печать', 'Color print')}</h3><div class="line" style="align-items:start">
          ${fig(E('с картинкой', 'with a picture'), card('none'))}
          ${fig(E('без картинки: светлая ниша, знак вида (выбрано)', 'no picture: the light well, the kind glyph (chosen)'), card('light'))}
          ${fig(E('узел Figma 714-42387: блок картинки - чистая бумага', 'Figma node 714-42387: the art block is blank paper'), card('blank'))}
          ${fig(E('для сравнения: тёмная ниша экрана', 'for comparison: the dark screen well'), card('dark'))}</div>
          <div class="note">${E('Светлая ниша со знаком - названное отступление от узла Figma 714-42387, где у карточки без картинки блок картинки остаётся чистой бумагой (владелец, 2026-10-29). Нарисовано на снимке карточки «Первоклассный Спальный Мешок»: блок картинки закрыт нишей.', 'The light well with the glyph is a named departure from Figma node 714-42387, where a card with no picture leaves the art block as blank paper (owner, 2026-10-29). Drawn on the capture of the Premium Bedroll card: a well covers its art block.')}</div></section>
        <section class="panel box"><h3>${E('Знак каждого вида в светлой нише', 'Each kind in the light well')}</h3><div class="line">${tiles}</div>
          <div class="note">${E('Оружие · расходник · предмет · броня. Ниша #ebe7f0, знак #3a3350. Ниша и её место на карточке одни для всех видов; меняется только знак.', 'Weapon · consumable · item · armor. Well #ebe7f0, glyph #3a3350. The well and its place on the card are the same for every kind; only the glyph changes.')}</div></section>
        <section class="panel box"><h3>${E('Чёрно-белая печать', 'Black-and-white print')}</h3>${fig(E('без картинки, как сегодня (Q1b.1)', 'no picture, as today (Q1b.1)'), bwCard())}
          <div class="note">${E('Без изменений: в чёрно-белой раскладке нет блока картинки ни у одной записи.', 'No change: the black-and-white layout has no art block for any record.')}</div></section>
      </div></div></main>`;
    return rpage({ job: null, signedIn: true }, main);
  }

  /* An A4 sheet: nine 63x88 mm cards (8.5 mm side and 14.5 mm top margins)
     or sixteen 44x63 mm cards (14 mm and 19.5 mm), 2 mm gutters. Positions are
     in per cent of the sheet so the sheet scales with its box. */
  function sheet(compact) {
    const [cols, rows, w, h, mx, my] = compact
      ? [4, 4, 44, 63, 14, 19.5]
      : [3, 3, 63, 88, 8.5, 14.5];
    let cells = '';
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const left = ((mx + c * (w + 2)) / 210) * 100;
        const top = ((my + r * (h + 2)) / 297) * 100;
        cells += `<div class="cell" style="left:${left}%;top:${top}%;width:${(w / 210) * 100}%">${card(i % 3 === 1 ? 'light' : 'none')}</div>`;
      }
    return `<div class="a4">${cells}</div>`;
  }
  function printSheets() {
    const main = `<main class="wrap"><div class="spec">
      <h1>${E('Листы печати', 'Print sheets')}</h1>
      ${cap('каждая третья карточка - запись без картинки; лист и поля не меняются (закон продукта)', 'every third card is a record with no picture; the sheet and its margins do not change (product law)')}
      <div class="grid2">
        <section class="panel box"><h3>${E('Девять на листе, 63×88 мм', 'Nine per sheet, 63x88 mm')}</h3>${sheet(false)}</section>
        <section class="panel box"><h3>${E('Шестнадцать на листе, 44×63 мм', 'Sixteen per sheet, 44x63 mm')}</h3>${sheet(true)}
          <div class="note">${E('Компактная карточка - та же композиция в 70%.', 'The compact card is the same composition at 70%.')}</div></section>
      </div></div></main>`;
    return rpage({ job: null, signedIn: true }, main);
  }

  /* The editor's print preview of a record with no picture (A12: one row of
     three switches is batch 6's; this mock shows the card only). */
  function editorPreview() {
    const main = `<main class="wrap"><div class="spec">
      <h1>${E('Предпросмотр печати в редакторе', "The editor's print preview")}</h1>
      ${cap('редактор своего предмета без картинки: превью печати показывает светлую нишу со знаком', 'the editor of an own item with no picture: the print preview shows the light well with the glyph')}
      <section class="panel box" style="max-width:420px"><h3>${E('Как будет напечатано', 'As it prints')}</h3>
        <div class="line">${seg([E('Экран', 'Screen'), E('Печать', 'Print')], 1)}${seg([E('Цвет', 'Color'), E('Ч/б', 'B&W')], 0)}${seg(['63×88', '44×63'], 0)}</div>
        <div class="pcenter">${card('light', 'kindItem', { badge: E('Предмет', 'Item'), name: E('Кольцо с гравировкой', 'Engraved ring'), desc: E('Надпись на неизвестном языке. Тёплое на ощупь.', 'An inscription in an unknown tongue. Warm to the touch.'), foot: E('Хоумбрю', 'Homebrew') })}</div>
        <div class="note">${E('Текст карточки нарисован поверх снимка, чтобы показать свой предмет; раскладку текста задаёт печатная карточка.', 'The card text is drawn over the capture to show an own item; the print card sets the text layout.')}</div></section>
    </div></main>`;
    return `${addr('/homebrew/00000000-0000-4000-8000-000000000511')}${rpage({ job: null, signedIn: true }, main)}`;
  }

  /* A messenger link card of a no-picture item: og:image is the site share
     card of the page's language; the stub page draws no visible picture. */
  function linkCard() {
    const r = R.hbR;
    const title = LANG === 'en' ? r.en : r.ru;
    const desc = `${E('Хоумбрю', 'Homebrew')}. ${LANG === 'en' ? r.d[1] : r.d[0]}`;
    const url = `loot.example${LANG === 'en' ? '/en' : ''}/h/00000000-0000-4000-8000-000000000511`;
    const main = `<main class="wrap"><div class="spec">
      <h1>${E('Карточка ссылки на предмет без картинки', 'The link card of an item with no picture')}</h1>
      ${cap('og:image - карточка сайта своего языка (og/_share.jpg или og/_share_en.jpg); og/_none.jpg удалён', 'og:image is the site card of its language (og/_share.jpg or og/_share_en.jpg); og/_none.jpg is deleted')}
      <div class="grid2">
        <section class="panel box"><h3>${E('В мессенджере', 'In a messenger')}</h3>
          <div class="chat"><div class="bubble"><a href="#">https://${url}</a><div class="lp"><b class="site">${E('Генератор лута Daggerheart', 'Daggerheart Loot Generator')}</b><b>${title}</b><p>${desc}</p><img src="../../1/share-rec__${LANG === 'en' ? 'en' : 'ru'}.png" alt=""></div></div></div></section>
        <section class="panel box"><h3>${E('Страница-заглушка по ссылке', 'The stub page behind the link')}</h3>
          <div class="stub"><h2>${title}</h2><p class="ssub">${E('Хоумбрю', 'Homebrew')}</p><p>${LANG === 'en' ? r.d[1] : r.d[0]}</p><a href="#">${E('Открыть в генераторе', 'Open in the generator')}</a></div>
          <div class="note">${E('Видимой картинки нет: tools/share-card.mjs не рисует &lt;img&gt;, когда у записи нет картинки.', 'No visible picture: tools/share-card.mjs draws no &lt;img&gt; when the record has no picture.')}</div></section>
      </div></div></main>`;
    return rpage({ job: null }, main);
  }

  window.XS = {
    'print-card': printCard,
    'print-sheets': printSheets,
    'editor-preview': editorPreview,
    'link-card': linkCard
  };
})();
