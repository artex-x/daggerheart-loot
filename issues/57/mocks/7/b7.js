/* Batch 7 mock: search, account, print preview, empty, loading and error states
   (plan section 7, batch 7). The account clarity rows (plan review N11): the
   scope sentence becomes the heading, the notify question becomes a
   three-way switch whose options say what happens. The /p/ compact-sheet
   note goes (batch 3's C57 recommendation).
   Round 5 (reviews/mocks-2.md):
   - B7-1: the /p/ switches read «Цвет» / «Ч/б» and «63×88» / «44×63» (QP.7);
     the account page's print default takes the same two switches (N7-2);
   - B7-2: /search has mock 3's list head: «Поиск», «Вид: все», «Выбрать» last,
     and the one selection bar (add to a list, print, copy);
   - R3-3: the «Свои предметы» switch, in the kind row at 1180 and in the kind
     menu at 360;
   - R7-1: at 360 the delete confirm is a sheet whose field and buttons dock
     above the on-screen keyboard (drawn);
   - N7-1: «Поиск» placeholder, "No. 12" on EN;
   - N7-3: /p/ and /account loading and failed-read states;
   - the /p/ page is drawn here once (window.PP.printPage), and mock P takes it. */
(function () {
  const { t, R, nm, ic, art, L } = window.M;
  const { E, FI, addr } = window.UA;
  const RA = window.RA;
  const { seg, cap, btn, chip, allChip, row, empty, errPage } = RA;
  const { pageHead } = window.SHELL;
  const N = innerWidth <= 760;
  const rpage = (...a) => window.RX.rpage(...a);

  /* an own record with a name the search finds */
  Object.assign(R, {
    hbP: {
      kind: 'cons',
      src: ['Хоумбрю', 'Homebrew'],
      hb: true,
      noimg: true,
      ru: 'Зелье Ольхи',
      en: "Olkha's potion",
      d: [
        'Тёплое на вкус: до конца сцены вы не мёрзнете.',
        'Warm on the tongue: you do not feel the cold until the end of the scene.'
      ]
    }
  });
  R.hbP.id = 'hbP';

  /* ---------- search ---------- */
  function search(o = {}) {
    const q = o.q || '';
    const kinds = [
      t('all'),
      t('items'),
      t('cons'),
      E('Оружие', 'Weapons'),
      E('Броня', 'Armor')
    ];
    const ownRow = `<div class="mh">${E('Свои предметы', 'Own items')}</div>`;
    const kindItem = (k, i) =>
      `<button class="mi">${i === 0 ? FI('check') : '<span class="sp"></span>'}${k}</button>`;
    const kindMenu = o.kindOpen
      ? `<div class="pop" style="top:calc(100% + 6px);right:0"><div class="mh">${E('Вид', 'Kind')}</div>${kinds.map(kindItem).join('')}${o.own ? `<hr><div style="padding:2px 10px">${PAT.sw(E('Свои предметы', 'Own items'), true)}</div>` : ''}</div>`
      : '';
    const kind = `<span class="anchor n360">${btn(E('Вид: все', 'Kind: all'), { cls: 'kbtn', attr: `aria-expanded="${!!o.kindOpen}"` })}${kindMenu}</span>`;
    const types = `<div class="fl w1180 kindrow" style="margin:10px 0 14px">${allChip()}${chip(t('items'))}${chip(t('cons'))}${chip(E('Оружие', 'Weapons'))}${chip(E('Броня', 'Armor'))}${o.own ? `<span class="ownsw">${PAT.sw(E('Свои предметы', 'Own items'), true)}</span>` : ''}</div>`;
    const selMode = !!o.sel;
    const ticked = o.ticked || [];

    let body = '';
    if (o.state === 'empty') {
      body = empty(
        E('Что ищем?', 'What are you looking for?'),
        E(
          'Ищет по названиям и описаниям всех книг и ваших предметов, по-русски и по-английски.',
          'Searches the names and text of every book and your items, in Russian and English.'
        ),
        '',
        `<div class="ex">${[E('зелье', 'potion'), E('меч', 'sword'), E('кольцо', 'ring'), E('№ 12', 'No. 12')].map((x) => `<button class="chip">${x}</button>`).join('')}</div>`
      );
    } else if (o.state === 'nothing') {
      body = empty(
        E(`Ничего не найдено по «${q}»`, `Nothing found for "${q}"`),
        E(
          'Проверьте написание или поищите по-английски: названия есть на обоих языках.',
          'Check the spelling or search in Russian: every name exists in both languages.'
        ),
        btn(E('Очистить поиск', 'Clear the search'), { cls: 'primary' })
      );
    } else {
      const hits = [...(o.own ? ['hbP'] : []), 'cc1', 'cc2', 'w1'];
      body = hits
        .map((id, i) =>
          row(R[id], {
            q: E('зелье', 'potion').slice(0, 5),
            no: !R[id].hb,
            noSrc: false,
            ck: selMode ? ticked.includes(i) : undefined
          })
        )
        .join('');
      if (selMode)
        body = `<div class="selon">${body}</div>${PAT.selbar({ n: ticked.length, acts: PAT.tableActs(), all: 'mixed' })}`;
    }
    const sel = selMode ? '' : btn(t('select'), { sm: true, cls: 'selbtn' });
    const main = `<main class="wrap sfs"><div class="ph"><h1>${t('search')}</h1></div>
      <div class="sbar"><label class="field">${ic('search')}<input value="${q}" placeholder="${E('Поиск', 'Search')}"></label>${kind}${sel}</div>${types}${body}</main>`;
    return rpage({ job: 'search', signedIn: !!o.own }, main);
  }

  /* ---------- account ---------- */
  const selField = (v) =>
    `<label class="field sel" style="min-width:200px"><span>${v}</span>${ic('chev')}</label>`;
  const colorSeg = () => seg([E('Цвет', 'Color'), E('Ч/б', 'B&W')], 1);
  const sizeSeg = () => seg(['63×88', '44×63'], 0);
  const accountMain = () => {
    const disp = `<section class="panel setp"><h2>${E('Отображение на всех устройствах', 'Display on all your devices')}</h2>
      <div class="setr"><span>${E('Язык', 'Language')}</span>${seg(['RU', 'EN'], window.M.LANG === 'en' ? 1 : 0)}</div>
      <div class="setr"><span>${E('Раздел при запуске', 'Section on start')}</span>${selField(t('std'))}</div>
      <div class="setr"><span>${E('Вид таблиц', 'Table view')}</span>${seg([E('Список', 'List'), E('Сетка', 'Grid')], 0)}</div>
      <div class="setr"><span>${E('Печать', 'Print')}</span><div class="wb">${colorSeg()}${sizeSeg()}</div></div>
      <div class="setr"><span>${E('Когда беру из чужого списка', "When I take from someone's list")}</span>${seg([E('Спрашивать', 'Ask'), E('Сообщать владельцу', 'Notify the owner'), E('Не сообщать', "Don't notify")], 0)}</div></section>`;
    const sign = `<section class="panel setp"><h2>${E('Вход', 'Sign-in')}</h2>
      <div class="setr"><span><b>Google</b> · gm1@example.test <span class="badge">${E('сейчас', 'now')}</span></span>${btn(E('Отключить', 'Disconnect'), { sm: true })}</div>
      <div class="setr"><span><b>Discord</b> · gm1.discord@example.test</span>${btn(E('Отключить', 'Disconnect'), { sm: true })}</div></section>`;
    const data = `<section class="panel setp"><h2>${E('Ваши данные', 'Your data')}</h2><p style="margin:0;font-size:15px;color:var(--muted)">${E('Списки и свои предметы одним архивом ZIP, без картинок.', 'Your lists and items in one ZIP, without pictures.')}</p><div><button class="btn"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>${E('Скачать мои данные (ZIP)', 'Download my data (ZIP)')}</button></div></section>`;
    const out = `<section class="panel setp"><h2>${E('Выход', 'Sign-out')}</h2><div class="wb">${btn(t('signOut'))}${btn(E('Выйти на всех устройствах', 'Sign out on every device'))}</div></section>`;
    const del = `<section class="panel setp"><h2>${E('Удаление аккаунта', 'Delete the account')}</h2><div>${btn(E('Удалить аккаунт', 'Delete the account'), { cls: 'danger' })}</div></section>`;
    return `<main class="wrap">${pageHead(t('account'), { pin: false, help: false })}<div class="acc"><div class="col">${disp}${data}</div><div class="col">${sign}${out}${del}</div></div></main>`;
  };
  const gone = () =>
    `<ul style="margin:0 0 12px;padding-left:20px"><li>${E('3 списка и 12 позиций в них', '3 lists and their 12 entries')}</li><li>${E('4 своих предмета, 2 источника, 1 комплект, 1 карта правил', '4 own items, 2 sources, 1 set, 1 rule card')}</li><li>${E('2 ссылки на списки: игроки их больше не откроют', '2 list links: players can no longer open them')}</li></ul>`;
  const confirmLabel = E('Введите «удалить», чтобы подтвердить', 'Type "delete" to confirm');
  const confirmBtns = () =>
    `${btn(E('Удалить навсегда', 'Delete forever'), { cls: 'danger-fill' })}${btn(E('Отмена', 'Cancel'))}`;

  /* R7-1: at 360 the confirm is a sheet; its field and buttons dock at the foot,
     so with the keyboard open (`keyboard`) the sheet rises above it and nothing
     that needs a tap is covered. From 761 px it is a dialog, as before. */
  function account(o = {}) {
    const pg = rpage({ job: null, signedIn: true, here: true }, accountMain());
    if (!o.confirm) return pg;
    if (!N) {
      const dlg = `<section class="dlg sm" role="alertdialog" aria-label="${E('Удалить аккаунт?', 'Delete the account?')}"><h2>${E('Удалить аккаунт навсегда?', 'Delete the account forever?')}</h2>
      <p style="margin:6px 0 8px;color:var(--muted)">${E('Будут удалены:', 'This deletes:')}</p>${gone()}
      <label style="display:grid;gap:6px;font-size:var(--t-small);font-weight:600">${confirmLabel}<span class="field"><input value="${E('удалить', 'delete')}"></span></label>
      <div class="wb" style="margin-top:14px">${confirmBtns()}${btn(E('Сначала скачать данные', 'Download my data first'), { cls: 'ghost' })}</div></section>`;
      return `<div class="ov" style="height:900px">${pg}<div class="scrim"></div>${dlg}</div>`;
    }
    const kb = o.keyboard
      ? `<div class="kbd" aria-hidden="true">${['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
          .map(
            (r, i) =>
              `<div class="kr">${i === 2 ? '<span class="w">&#8679;</span>' : ''}${[...r].map((c) => `<span>${c}</span>`).join('')}${i === 2 ? '<span class="w">&#9003;</span>' : ''}</div>`
          )
          .join(
            ''
          )}<div class="kr"><span class="w">?123</span><span class="sp"></span><span class="w">&#9166;</span></div></div>`
      : '';
    const sheet = `<section class="sheet kdock" role="alertdialog" style="bottom:${o.keyboard ? 270 : 0}px" aria-label="${E('Удалить аккаунт?', 'Delete the account?')}"><div class="grab"></div>
      <div class="sh" style="justify-content:space-between;padding:6px 16px 4px"><b style="font-size:18px">${E('Удалить аккаунт навсегда?', 'Delete the account forever?')}</b></div>
      <div class="kscroll" style="max-height:${o.keyboard ? 92 : 160}px"><p style="margin:0 0 6px;color:var(--muted)">${E('Будут удалены:', 'This deletes:')}</p>${gone()}</div>
      <div class="dock3"><label class="kfield">${confirmLabel}<span class="field ${o.keyboard ? 'focus' : ''}"><input value="${E('удалить', 'delete')}"></span></label>
        <div class="wb">${confirmBtns()}</div><div>${btn(E('Сначала скачать данные', 'Download my data first'), { sm: true, cls: 'ghost' })}</div></div></section>`;
    return `<div class="ov" style="height:640px">${pg}<div class="scrim"></div>${sheet}${kb}</div>`;
  }

  /* N7-3: loading and a failed read */
  const skelPanel = (h) =>
    `<div class="skelp" style="min-height:${h}px" aria-hidden="true"></div>`;
  const retry = btn(E('Повторить', 'Retry'), { cls: 'primary' });
  const accountLoading = () =>
    rpage(
      { job: null, signedIn: true, here: true },
      `<main class="wrap">${pageHead(t('account'), { pin: false, help: false })}<p class="count2" role="status">${E('Загружаем...', 'Loading...')}</p><div class="acc"><div class="col">${skelPanel(300)}${skelPanel(110)}</div><div class="col">${skelPanel(110)}${skelPanel(90)}</div></div></main>`
    );
  const accountFailed = () =>
    rpage(
      { job: null, signedIn: true, here: true },
      `<main class="wrap">${pageHead(t('account'), { pin: false, help: false })}${errPage(E('Не получилось загрузить настройки', 'Could not load your settings'), E('Проверьте соединение и попробуйте ещё раз.', 'Check the connection and try again.'), retry)}</main>`
    );

  /* ---------- the print page (also drawn by mock P) ---------- */
  /* First-screen layout (plan section 14, batch 7): at 360 «Назад» and the H1
     share a row, the primary and «Настройки листа ▾» the next; the lead and
     the background-graphics hint go under the cards. 1180 keeps its row.
     `cards`: [{src, alt}] at 360 (one card per row, QP.6); `sheet`: the A4
     capture at 1180; `lead` the sub line. */
  function printPage(o = {}) {
    const en = window.M.LANG === 'en';
    const lead =
      o.lead || E('2 карточки · 1 лист A4 · 63×88 мм', '2 cards · 1 A4 sheet · 63×88 mm');
    const hint = E(
      'В окне печати включите «Фоновые изображения».',
      'In the print window, turn on "Background graphics".'
    );
    const color0 = seg([E('Цвет', 'Color'), E('Ч/б', 'B&W')], 0);
    const size0 = sizeSeg();
    const link = btn(E('Ссылка на набор', 'Link to this set'), { i: 'link' });
    const setMenu = o.setOpen
      ? `<div class="pop psets" style="top:calc(100% + 6px);right:0"><div class="mh">${E('Настройки листа', 'Sheet settings')}</div><div class="mview">${color0}</div><div class="mview">${size0}</div><hr><button class="mi">${ic('table')}${E('Показать весь лист', 'Show the whole sheet')}</button><button class="mi">${ic('link')}${E('Ссылка на набор', 'Link to this set')}</button></div>`
      : '';
    const setAttr = `aria-expanded="${!!o.setOpen}"`;
    const set360 = `<span class="anchor n360">${btn(E('Настройки листа', 'Sheet settings'), { chev: true, attr: setAttr })}${setMenu}</span>`;
    const cards = o.cards || [
      { src: `../shared/printcard-ci1${en ? '-en' : ''}.png`, alt: nm(R.ci1) },
      { src: `../shared/printcard-q1${en ? '-en' : ''}.png`, alt: nm(R.q1) }
    ];
    const sheet = o.sheet || `../shared/print-sheet-twocards.png`;
    const main = `<main class="wrap pfs"><div class="phead"><a class="back" href="#"><span class="bk" style="display:inline-flex;transform:rotate(90deg);margin-right:2px">${ic('chev')}</span>${E('Назад', 'Back')}</a><h1>${E('Печать карточек', 'Print cards')}</h1></div><div class="lead2 w1180" style="margin:4px 0 12px">${lead}</div>
      <div class="prow">${btn(E('Напечатать', 'Print'), { cls: 'primary', i: 'print' })}<span class="w1180">${color0}</span><span class="w1180">${size0}</span><span class="w1180">${link}</span>${set360}</div>
      <div class="count2 w1180">${hint}</div>
      ${o.sheetHtml || `<img class="sheetimg w1180" src="${sheet}" alt="${E('Лист A4 с двумя карточками', 'An A4 sheet with two cards')}">`}<div class="n360 pcards">${cards.map((c) => `<img src="${c.src}" alt="${c.alt}">`).join('')}</div><div class="n360 punder"><div class="lead2">${lead}</div><div class="count2">${hint}</div></div></main>`;
    return rpage({ job: null, signedIn: true }, main);
  }
  const printLoading = () =>
    rpage(
      { job: null, signedIn: true },
      `<main class="wrap pfs"><div class="phead"><a class="back" href="#"><span class="bk" style="display:inline-flex;transform:rotate(90deg);margin-right:2px">${ic('chev')}</span>${E('Назад', 'Back')}</a><h1>${E('Печать карточек', 'Print cards')}</h1></div><p class="count2" role="status" style="margin:6px 0 12px">${E('Загружаем набор...', 'Loading the set...')}</p><div class="skelp" style="min-height:${N ? 340 : 420}px;max-width:520px" aria-hidden="true"></div></main>`
    );
  const printFailed = () =>
    rpage(
      { job: null, signedIn: true },
      `<main class="wrap pfs"><div class="phead"><a class="back" href="#"><span class="bk" style="display:inline-flex;transform:rotate(90deg);margin-right:2px">${ic('chev')}</span>${E('Назад', 'Back')}</a></div>${errPage(E('Набор не загрузился', 'The set did not load'), E('Проверьте соединение и попробуйте ещё раз.', 'Check the connection and try again.'), retry)}</main>`
    );

  window.PP = { printPage, search, account };
  const Q = E('зелье', 'potion');
  window.XS = {
    'search-empty': () => `${addr('/search')}${search({ state: 'empty' })}`,
    'search-results': () => `${addr('/search')}${search({ q: Q })}`,
    'search-nothing': () =>
      `${addr('/search')}${search({ q: E('кракенн', 'krakken'), state: 'nothing' })}`,
    'search-kind': () =>
      `${cap('360: «Вид: все» открыто - пять видов в одном меню; на 1180 - ряд чипов', '360: "Kind: all" open - the five kinds in one menu; at 1180 a row of chips')}${addr('/search')}${search({ q: Q, kindOpen: true })}`,
    'search-own': () =>
      `${cap('вошли, есть свои предметы (R3-3): переключатель «Свои предметы» в ряду видов на 1180, отдельно от чипов; на 360 он в меню «Вид»', 'signed in with own items (R3-3): the "Own items" switch ends the kind row at 1180, apart from the chips; at 360 it is in the "Kind" menu')}${addr('/search')}${search({ q: Q, own: true })}`,
    'search-own-kind': () =>
      `${cap('360: меню «Вид» с переключателем «Свои предметы»; на 1180 то же в ряду видов (снимок «search-own»)', '360: the "Kind" menu with the "Own items" switch; at 1180 the same sits in the kind row (the "search-own" render)')}${addr('/search')}${search({ q: Q, own: true, kindOpen: true })}`,
    'search-selection': () =>
      `${cap('режим выбора на поиске (B7-2): «Выбрать» последним в строке поиска, отметки, одна панель: «Все», «Выбрано: 1», «В список», «Печать», «Скопировать текст», «Снять выделение»', 'selection mode on search (B7-2): "Select" last in the search row, ticks, the one bar: "All", "1 selected", "Add to list", "Print", "Copy text", "Clear the selection"')}${addr('/search')}${search({ q: Q, own: true, sel: true, ticked: [1] })}`,
    'account-settings': () => `${addr('/account')}${account()}`,
    'account-loading': () => `${addr('/account')}${accountLoading()}`,
    'account-failed': () => `${addr('/account')}${accountFailed()}`,
    'account-delete': () =>
      `${cap('удаление: что пропадёт, и опасное действие сильнее «Отмены» (A34); на 360 лист, поле и кнопки внизу листа', 'delete: what goes, and the danger action stronger than "Cancel" (A34); at 360 a sheet, the field and the buttons at its foot')}${addr('/account')}${account({ confirm: true })}`,
    'account-delete-keyboard': () =>
      `${cap('360, клавиатура открыта (R7-1): лист поднялся над клавиатурой, поле и обе кнопки на виду, список «Будут удалены» прокручивается', '360, the keyboard open (R7-1): the sheet rose above the keyboard, the field and both buttons show, the "This deletes" list scrolls')}${addr('/account')}${account({ confirm: true, keyboard: true })}`,
    'print-preview': () =>
      `${cap('обычный или компактный лист выбирается здесь же, без заметки «Только до перезагрузки» (C31 по C57); короткие подписи «Цвет» / «Ч/б» и «63×88» / «44×63» (QP.7)', 'the standard or compact sheet is chosen right here, with no "until you reload" note (C31 under C57); the short labels "Color" / "B&W" and "63×88" / "44×63" (QP.7)')}${addr('/p/set-twocards')}${printPage()}`,
    'print-settings': () =>
      `${cap('360: «Настройки листа» открыто - цвет, размер листа, ссылка; на 1180 они в строке', '360: "Sheet settings" open - the color, the sheet size, the link; at 1180 they sit in the row')}${addr('/p/set-twocards')}${printPage({ setOpen: true })}`,
    'print-loading': () => `${addr('/p/set-twocards')}${printLoading()}`,
    'print-failed': () => `${addr('/p/set-twocards')}${printFailed()}`,
    'print-nope': () => `${addr('/p/short')}${RA.errorFor('print')}`
  };
})();
