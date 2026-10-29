/* Batch 7 mock: search, account, print preview, empty and error states
   (plan section 7, batch 7). The account clarity rows (plan review N11): the
   scope sentence becomes the heading, the notify question becomes a
   three-way switch whose options say what happens. The /p/ compact-sheet
   note goes (batch 3's C57 recommendation). */
(function () {
  const { E, addr } = window.UA;
  const RA = window.RA;
  const { seg, cap } = RA;
  const ST = RA.STATES;

  const fixAccount = (html) =>
    html
      .replace(
        /<h2>(Отображение|Display)<\/h2>/,
        `<h2>${E('Отображение на всех устройствах', 'Display on all your devices')}</h2>`
      )
      .replace(
        /<div class="setr"><span>(Беру из чужого списка|I take from someone's list)<\/span>[\s\S]*?<\/label><\/div>/,
        `<div class="setr"><span>${E('Когда беру из чужого списка', "When I take from someone's list")}</span>${seg([E('Спрашивать', 'Ask'), E('Сообщать владельцу', 'Notify the owner'), E('Не сообщать', "Don't notify")], 0)}</div>`
      )
      .replace(
        /<div class="setr"><span>(Раздел при запуске|Start section)<\/span>/,
        `<div class="setr"><span>${E('Раздел при запуске', 'Section on start')}</span>`
      );

  window.XS = {
    'search-empty': () => `${addr('/search')}${ST['search-empty']()}`,
    'search-results': () => `${addr('/search')}${ST['search-results']()}`,
    'search-nothing': () => `${addr('/search')}${ST['search-nothing']()}`,
    'account-settings': () => `${addr('/account')}${fixAccount(ST['account-settings']())}`,
    'account-delete': () =>
      `${cap('удаление: что пропадёт, и опасное действие сильнее «Отмены» (A34)', 'delete: what goes, and the danger action stronger than "Cancel" (A34)')}${addr('/account')}${fixAccount(ST['account-delete']())}`,
    'print-preview': () =>
      `${cap('обычный или компактный лист выбирается здесь же, без заметки «Только до перезагрузки» (C31 по C57)', 'the standard or compact sheet is chosen right here, with no "until you reload" note (C31 under C57)')}${addr('/p/set-twocards')}${ST['print-preview']()}`,
    'print-nope': () => `${addr('/p/short')}${RA.errorFor('print')}`,
    'search-kind': () =>
      `${cap('360: «Вид: все» открыто - пять видов в одном меню; на 1180 - ряд чипов', '360: "Kind: all" open - the five kinds in one menu; at 1180 a row of chips')}${addr('/search')}${RA.search({ q: E('зелье', 'potion'), kindOpen: true })}`,
    'print-settings': () =>
      `${cap('360: «Настройки листа» открыто - цвет, размер листа, ссылка; на 1180 они в строке', '360: "Sheet settings" open - the color, the sheet size, the link; at 1180 they sit in the row')}${addr('/p/set-twocards')}${RA.printPrev({ setOpen: true })}`
  };
})();
