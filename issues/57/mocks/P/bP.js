/* Mock P: the /p/ page frames (RP-1). The page is mock 7's, drawn once (window.PP.printPage):
   the new shell, the neutral switches, «Цвет» / «Ч/б» and «63×88» / «44×63» (QP.7), one card
   per row at the column width at 360 (QP.6), and «Напечатать» / "Print" as the one primary
   label. Only the cards differ: they are the proposed print cards of this mock (63.5 x 88.9 mm,
   Source Sans 3, QP.2 and QP.4), a weapon and the longest text, from the 300 dpi crops. */
(function () {
  const { E } = window.UA;
  const en = window.M.LANG === 'en';
  const crop = (k) =>
    `../../P/proposed-ss3-std9-colour-${en ? 'en' : 'ru'}__card-${k}__300dpi.jpg`;
  const names = {
    weapon: E('Палаш', 'Broadsword'),
    long: E('Длинный текст', 'The longest text')
  };
  const cards = ['weapon', 'long'].map((k) => ({ src: crop(k), alt: names[k] }));
  /* the A4 sheet at 1180: the two proposed cards at their printed places (7.75 mm side,
     13.15 mm top margin, 63.5 mm cards, 2 mm gutters) */
  const cell = (k, i) =>
    `<div class="cell" style="left:${((7.75 + i * 65.5) / 210) * 100}%;top:${(13.15 / 297) * 100}%;width:${(63.5 / 210) * 100}%"><img src="${crop(k)}" alt="" style="width:100%;display:block"></div>`;
  const sheetHtml = `<div class="a4 w1180">${cell('weapon', 0)}${cell('long', 1)}</div>`;
  window.XS = Object.assign(window.XS || {}, {
    'page-proposed': () => window.PP.printPage({ cards, sheetHtml }),
    'page-proposed-settings': () => window.PP.printPage({ cards, sheetHtml, setOpen: true })
  });
})();
