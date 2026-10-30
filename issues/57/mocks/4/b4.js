/* Batch 4 mock: the record card, its actions, the item page, the dialog and
   /h/ (plan section 7, batch 4; reviews/mocks-1.md M4-1 to M4-4). The item
   page at 360 is a page, not R's sheet: the sheet is the dialog's form.
   «Ещё» opens as a bottom sheet at 360 and as a menu aligned to its button's
   right edge from 760 px. «Сохранить себе» is one label on every page and in
   every state; its relink line, when a list of the reader links the item, is
   the item's second line. Round 5 (reviews/mocks-2.md): the dialog's fixed bar at
   360 is two rows of two (B4-1: «В список» and «··· Ещё», then «Поделиться» and
   «Печать»); /h/ keeps «Сохранить себе» inside «··· Ещё» as /i/ does, with its
   second line (N4-1); the relation lines carry no arrows (N4-2). */
(function () {
  const { t, R, nm, desc, art, ic, badge, L } = window.M;
  const { pageHead } = window.SHELL;
  const { E, addr } = window.UA;
  const RA = window.RA;
  const { btn, cap } = RA;
  const N = innerWidth <= 760;
  const SAVE = E('Сохранить себе', 'Save to My items');
  const RELINK = E(
    'Копия попадёт в «Хоумбрю», а строки ваших списков с этим предметом будут вести на неё.',
    'The copy goes to "Homebrew", and the rows of your lists that hold this item will point to it.'
  );
  const SIGNIN = E('Сначала вход в аккаунт', 'Signs you in first');

  /* Runs a state with the shell forced signed out. */
  const signedOut = (f) => {
    const orig = window.RX.rpage;
    window.RX.rpage = (o, m) => orig({ ...o, signedIn: false }, m);
    try {
      return f();
    } finally {
      window.RX.rpage = orig;
    }
  };

  /* The «Ещё» items: the four copies, then «Сохранить себе». */
  const mi = (icon, label, second = '') =>
    `<button class="mi">${ic(icon)}<span class="mit"><span>${label}</span>${second ? `<small>${second}</small>` : ''}</span></button>`;
  const moreItems = (o) =>
    `${mi('copy', t('copyText'))}${mi('copy', t('copyName'))}${mi('image', t('copyImg'))}${mi('link', t('copyLink'))}<hr>${o.signedOut ? mi('user', SAVE, SIGNIN) : mi('plus', SAVE, o.relink ? RELINK : '')}`;

  function page(o = {}) {
    const r = R.ci1;
    const add = btn(t('addList'), { cls: 'primary', i: 'plus', chev: true });
    const menu =
      o.moreOpen && !N
        ? `<div class="pop" style="top:calc(100% + 6px);right:0">${moreItems(o)}</div>`
        : '';
    const more = `<span class="anchor">${btn(t('more'), { i: 'more', chev: true, attr: `aria-expanded="${!!o.moreOpen}"` })}${menu}</span>`;
    const main = `<main class="wrap"><article class="dossier">${art(r)}<div class="txt"><h1>${nm(r)}</h1>${RA.meta(r)}<p class="lead">${desc(r)}</p>
      <div class="acts">${add}${btn(t('share'), { i: 'share' })}${btn(t('print'), { i: 'print' })}${more}</div></div></article></main>`;
    const pg = window.RX.rpage({ job: null, signedIn: !o.signedOut }, main);
    if (!(o.moreOpen && N)) return pg;
    return `<div class="ov" style="height:760px">${pg}<div class="scrim"></div><section class="sheet" role="dialog" aria-label="${t('more')}"><div class="grab"></div>
      <div class="sh" style="justify-content:space-between;padding:2px 16px 4px"><b style="font-size:18px">${nm(r)}</b>${btn(t('close'), { sm: true, cls: 'ghost', i: 'x' })}</div>
      <div class="msheet">${moreItems(o)}</div></section></div>`;
  }

  /* The record dialog (B4-1). 360: a bottom sheet whose fixed bar is two rows of
     two, every action labelled; from 761 px the dialog over the catalog. */
  function dialog() {
    const r = R.ci1;
    const { add, more } = RA.itemBody(r);
    const behind = PAT.catalog();
    if (N) {
      return `<div class="ov">${behind}<div class="scrim"></div><section class="sheet" role="dialog" aria-label="${nm(r)}"><div class="grab"></div>
      <div class="sh">${btn(t('close'), { sm: true, cls: 'ghost', i: 'x' })}</div>
      <div class="scroll">${art(r)}<h2>${nm(r)}</h2>${RA.meta(r)}<p class="lead" style="font-size:16px">${desc(r)}</p></div>
      <div class="dock4">${add}${more}${btn(t('share'), { i: 'share' })}${btn(t('print'), { i: 'print' })}</div></section></div>`;
    }
    return `<div class="ov" style="height:900px">${behind}<div class="scrim"></div><section class="dlg" role="dialog" aria-label="${nm(r)}">${btn(t('close'), { sm: true, cls: 'ghost x', i: 'x' })}
      <article class="dossier">${art(r)}<div class="txt"><h2 style="font-size:var(--t-page)">${nm(r)}</h2>${RA.meta(r)}<p class="lead">${desc(r)}</p>
      <div class="acts">${add}${btn(t('share'), { i: 'share' })}${btn(t('print'), { i: 'print' })}${more}</div></div></article></section></div>`;
  }

  /* /h/ (N4-1, N4-2): the same placement as /i/, «Сохранить себе» inside «··· Ещё»
     with its second line, and the relation lines without arrows. */
  function hPage(o = {}) {
    const r = R.hbS;
    const hb = `<span class="badge hb">${E('Хоумбрю', 'Homebrew')}</span>`;
    const rel = `<div class="rel"><span>${E('Получается из', 'Made from')}: <a href="#">${E('Скатка путника', "Traveler's bedroll")}</a> ${hb}</span><span>${E('Улучшается до', 'Upgrades to')}: <a href="#">${E('Скатка стража', "Warden's bedroll")}</a> ${hb}</span></div>`;
    const menu =
      o.moreOpen && !N
        ? `<div class="pop" style="top:calc(100% + 6px);right:0">${moreItems(o)}</div>`
        : '';
    const more = `<span class="anchor">${btn(t('more'), { i: 'more', attr: `aria-expanded="${!!o.moreOpen}"` })}${menu}</span>`;
    const main = `<main class="wrap"><article class="dossier">${art(r)}<div class="txt"><h1>${nm(r)}</h1>
      <div class="meta">${badge(r)}${hb}<span>${E('Предмет другого игрока · обновлён 11 часов назад', "Another player's item · updated 11 hours ago")}</span></div>
      <p class="lead">${L(r.d)}</p>${rel}
      <div class="acts">${btn(t('addList'), { cls: 'primary', i: 'plus', chev: true })}${btn(t('share'), { i: 'share' })}${btn(t('print'), { i: 'print' })}${more}</div></div></article></main>`;
    const pg = window.RX.rpage({ job: null, signedIn: !o.signedOut }, main);
    if (!(o.moreOpen && N)) return pg;
    return `<div class="ov" style="height:760px">${pg}<div class="scrim"></div><section class="sheet" role="dialog" aria-label="${t('more')}"><div class="grab"></div>
      <div class="sh" style="justify-content:space-between;padding:2px 16px 4px"><b style="font-size:18px">${nm(r)}</b>${btn(t('close'), { sm: true, cls: 'ghost', i: 'x' })}</div>
      <div class="msheet">${moreItems(o)}</div></section></div>`;
  }

  /* The author's own item at /i/<key>: «Изменить» after «Печать» (FEATURES
     "Records"). */
  function ownItem() {
    const r = R.hbA;
    const main = `<main class="wrap"><article class="dossier">${art(r)}<div class="txt"><h1>${nm(r)}</h1>
      <div class="meta">${badge(r)}<span class="badge hb">${E('Хоумбрю', 'Homebrew')}</span><span>${E('Хоумбрю · Мастерская Ольхи · Холодное оружие', "Homebrew · Olkha's workshop · Melee weapons")}</span><a href="#">${E('показать в таблице', 'show in the table')}</a></div>
      <p class="lead">${E('Лезвие тлеет и не гаснет под дождём.', 'The blade smolders and does not go out in the rain.')}</p>
      <div class="acts">${btn(t('addList'), { cls: 'primary', i: 'plus', chev: true })}${btn(t('share'), { i: 'share' })}${btn(t('print'), { i: 'print' })}${btn(E('Изменить', 'Edit'), { i: 'note' })}${btn(t('more'), { i: 'more', chev: true })}</div></div></article></main>`;
    return window.RX.rpage({ job: null, signedIn: true }, main);
  }
  const failPage = (title, p) =>
    window.RX.rpage(
      { job: null, signedIn: true },
      `<main class="wrap">${RA.errPage(title, p, btn(E('Повторить', 'Retry'), { cls: 'primary' }))}</main>`
    );
  function hLoading() {
    const main = `<main class="wrap"><article class="dossier"><div class="art skel"></div><div class="txt"><p class="lead" role="status">${E('Загружаем...', 'Loading...')}</p></div></article></main>`;
    return window.RX.rpage({ job: null, signedIn: true }, main);
  }

  window.XS = {
    item: () => `${addr('/i/ci1')}${page()}`,
    'item-more': () =>
      `${cap('«Ещё» открыто: на 360 - лист снизу, с 760 px - меню у правого края кнопки', '"More" open: a bottom sheet at 360, a menu at the button\'s right edge from 760 px')}${addr('/i/ci1')}${page({ moreOpen: true })}`,
    'item-save-signedout': () =>
      `${cap('не вошли: та же подпись «Сохранить себе», вторая строка говорит о входе', 'signed out: the same "Save to My items", its second line says it signs in first')}${addr('/i/ci1')}${page({ moreOpen: true, signedOut: true })}`,
    'item-dialog': () =>
      `${cap('диалог записи: на 360 - лист снизу с закреплённой панелью из двух рядов по два: «В список» и «··· Ещё», «Поделиться» и «Печать» (C44, B4-1)', 'the record dialog: at 360 a bottom sheet with a fixed bar of two rows of two: "Add to list" and "··· More", "Share" and "Print" (C44, B4-1)')}${addr('/tables/eq_weapon')}${dialog()}`,
    'item-nope': () => `${addr('/i/nope')}${RA.errorFor('item')}`,
    'own-item': () =>
      `${cap('свой предмет автора: «Изменить» после «Печать»', "the author's own item: Edit after Print")}${addr('/i/hb_emberaxe')}${ownItem()}`,
    'own-item-failed': () =>
      `${addr('/i/hb_emberaxe')}${failPage(E('Не получилось загрузить ваши предметы', 'Could not load your items'), E('Проверьте соединение и попробуйте ещё раз.', 'Check the connection and try again.'))}`,
    'h-item': () =>
      `${cap('ваш список ссылается на этот предмет: «Сохранить себе» в «··· Ещё», как на /i/, вторая строка говорит о перепривязке', 'a list of yours links this item: "Save to My items" in "··· More", as on /i/, its second line says the rows are relinked')}${addr('/h/00000000-0000-4000-8000-000000000511')}${hPage({ moreOpen: true, relink: true })}`,
    'h-item-signedout': () =>
      `${cap('не вошли: то же место, вторая строка говорит о входе', 'signed out: the same place, its second line says it signs in first')}${addr('/h/00000000-0000-4000-8000-000000000511')}${hPage({ moreOpen: true, signedOut: true })}`,
    'h-item-loading': () => `${addr('/h/00000000-0000-4000-8000-000000000511')}${hLoading()}`,
    'h-item-failed': () =>
      `${addr('/h/00000000-0000-4000-8000-000000000511')}${failPage(E('Предмет не загрузился', 'The item did not load'), E('Проверьте соединение и попробуйте ещё раз.', 'Check the connection and try again.'))}`,
    'pattern-error': () =>
      `${cap('образец страницы ошибки: причина в заголовке, один следующий шаг', 'the error-page pattern: the cause as the title, one next step')}${addr('/p/')}${RA.errorFor('print')}`
  };
})();
