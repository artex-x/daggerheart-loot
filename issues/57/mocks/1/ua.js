/* Unit A's shared layer for the batch mocks 1-5 and 7 (task 57). It loads
   after R's kit.js and b-shell.js and before every other script, so the
   batch 1 and batch 2 system reaches every later batch mock:
   - the art well draws the filled kind glyph of batch 1 (plan section 10);
   - the page head pin says what it does and shows its pinned state
     (batch 2, C37);
   - the footer carries the real DPCGL summary line, links muted (batch 1, C28).
   Direction R stays read-only; this file only replaces exported helpers. */
(function () {
  const M = window.M;
  const { t, ic, LANG, IMG } = M;
  const SH = window.SHELL;
  const E = (ru, en) => (LANG === 'en' ? en : ru);

  /* Filled 24 px glyphs. shield, science, diamond and check are Material
     Icons paths (Apache 2.0); `swords` is a stand-in drawn for the mock,
     because batch 1 copies the real Material Symbols path. */
  const SWORD =
    'M3 3l3.2.4 8.6 8.6-2.8 2.8-8.6-8.6zM10.6 16.8l6.2-6.2 1.2 1.2-6.2 6.2zM15 16.4l1.4-1.4 3 3-1.4 1.4zM18.6 20.2a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0z';
  const FILLED = {
    kindArmor: '<path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>',
    kindConsumable:
      '<path d="M19.8 18.4 14 10.67V6.5l1.35-1.69c.26-.33.03-.81-.39-.81H9.04c-.42 0-.65.48-.39.81L10 6.5v4.17L4.2 18.4c-.49.66-.02 1.6.8 1.6h14c.82 0 1.29-.94.8-1.6z"/>',
    kindItem:
      '<path d="M19 3H5L2 9l10 12L22 9l-3-6zM9.62 8l1.5-3h1.76l1.5 3H9.62zM11 10v6.68L5.44 10H11zm2 0h5.56L13 16.68V10zm6.26-2h-2.65l-1.5-3h2.65l1.5 3zM6.24 5h2.65l-1.5 3H4.74l1.5-3z"/>',
    kindWeapon: `<path d="${SWORD}"/><path d="${SWORD}" transform="matrix(-1 0 0 1 24 0)"/>`,
    check: '<path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>'
  };
  const FI = (n, cls = '') =>
    `<svg class="fi ${cls}" viewBox="0 0 24 24" aria-hidden="true">${FILLED[n]}</svg>`;
  const kindGlyph = (r) =>
    r.kind === 'armor'
      ? 'kindArmor'
      : r.kind === 'weapon'
        ? 'kindWeapon'
        : r.kind === 'cons'
          ? 'kindConsumable'
          : 'kindItem';

  /* The well (plan section 10, ArtWell): the kind glyph on --art-well, the
     picture over it when the record has one; `o.loading` draws the state
     before the picture decodes. */
  M.art = (r, size, cls = '', o = {}) => {
    const s = size ? `style="width:${size}px"` : '';
    const img =
      r.noimg || o.loading
        ? ''
        : `<img src="${IMG}${r.img || r.id}.webp" alt="" loading="eager">`;
    const label = r.noimg ? `<span class="sr">${t('noPic')}</span>` : '';
    return `<div class="art ${cls}" ${s}><span class="glyph">${FI(kindGlyph(r))}</span>${img}${label}</div>`;
  };

  /* The pin and «Справка» (batch 2, C37): each a labelled control; the pin
     says what a press does and, pressed, shows the neutral pressed state. */
  /* The help buttons that name what they open (owner, 2026-10-29: C1 and
     C38 chosen; the alternate tables keep their author credit). */
  const HELP = {
    [t('tables')]: E('Об этих данных', 'About this data'),
    [t('std')]: E('Где какая редкость', 'Where each rarity fits'),
    [t('altLong')]: E('Об этих таблицах', 'About these tables')
  };
  SH.pageHead = function (title, opts = {}) {
    if (!opts.helpLabel && !opts.helpToday && HELP[title])
      opts = { ...opts, helpLabel: HELP[title] };
    const pin =
      opts.pin === false
        ? ''
        : opts.pinned
          ? `<button class="btn sm pressed pinb" aria-pressed="true">${FI('check')}${E('Открывается при запуске', 'Opens on start')}</button>`
          : `<button class="btn sm pinb" aria-pressed="false">${ic('home')}${E('Открывать при запуске', 'Open on start')}</button>`;
    const help =
      opts.help === false
        ? ''
        : `<button class="btn sm ghost helpb ${opts.helpOpen ? 'open' : ''}" aria-expanded="${!!opts.helpOpen}">${ic('help')}${opts.helpLabel || t('help')}${opts.helpOpen ? ic('chev') : ''}</button>`;
    return `<div class="ph"><h1>${title}</h1>${pin}${help}</div>`;
  };

  /* The footer: the three links muted and underlined, then the DPCGL
     summary line that folds the licence notice (FEATURES.md "Chrome"). */
  SH.footer = () =>
    `<footer class="foot"><div class="wrap"><nav><a href="#">${t('footInstall')}</a><a href="#">${t('footPrivacy')}</a><a href="#">${t('footTerms')}</a></nav><span class="dpcgl">Daggerheart © Darrington Press - DPCGL - ${E('Источники и лицензия', 'Sources and license')}${ic('chev')}</span></div></footer>`;
  /* The language switch (batch 1): the neutral pressed state with a check. */
  /* The account menu in the FEATURES.md "Chrome" order with no counts and no
     email line (plan review R3); `opts.menuR` keeps R's menu, the rejected
     option, for the side-by-side frame. */
  const menu = `<div class="menu" role="menu" aria-label="${E('Меню аккаунта', 'Account menu')}"><a role="menuitem" class="hl" href="#">${ic('user')}${t('account')}</a><a role="menuitem" href="#">${ic('list')}${t('menuLists')}</a><a role="menuitem" href="#">${ic('sword')}${t('myItems')}</a><hr><a role="menuitem" href="#">${t('signOut')}</a></div>`;
  const h0 = SH.header;
  SH.header = (opts) =>
    h0(opts)
      .replace(/<div class="menu" role="menu">[\s\S]*?<\/a><\/div>(?=<\/div>)/, (m) =>
        opts.menuR ? m : menu
      )
      .replace(
        /class="seg quiet" role="group" aria-label="Язык \/ Language"/g,
        `class="seg quiet np lang" role="group" aria-label="${E('Язык', 'Language')}"`
      )
      .replace(
        /<button aria-pressed="true">(RU|EN)<\/button>/g,
        `<button aria-pressed="true">${FI('check')}$1</button>`
      );
  SH.page = (opts, main) => SH.header(opts) + main + SH.footer();

  /* A mock-only address strip over a frame: the path the frame stands for. */
  const addr = (path) =>
    `<div class="addr" aria-hidden="true"><span>loot.example</span>${LANG === 'en' && !path.startsWith('/en') ? '/en' + path : path}</div>`;

  /* American spelling in every EN string (owner, 2026-10-29, Q3). */
  M.R.hb1.d = [M.R.hb1.d[0], 'The blade smolders and does not go out in the rain.'];

  window.UA = { E, FI, FILLED, kindGlyph, addr };
})();
