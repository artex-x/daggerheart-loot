/* Batch 8 mock: the lists page (/lists), its cards, the lists import, the
   list-not-found page (/lists/<uuid>) and the add-to-list menu.
   state.html?s=<state>&lang=en; the list and the owner questions are in index.html. */
(function () {
  const { t, R, nm, ic, art, badge, srcName, desc, LANG } = window.M;
  const U = window.U;
  const {
    E,
    N,
    S,
    btn,
    ck,
    empty,
    errPage,
    loadErr,
    head,
    pop,
    mi,
    anchor,
    rpage,
    ov,
    icx,
    selBar,
    selState
  } = U;

  const LISTS = [
    {
      name: t('listName'),
      m: E('10 позиций · изменён 3 дня назад', '10 entries · changed 3 days ago'),
      ids: ['ci1', 'q1', 'q313', 'cc1', 'voa', 'q23'],
      req: E('2 запроса', '2 requests'),
      notice: E('1 изменение', '1 change')
    },
    {
      name: E('Трофеи', 'Trophies'),
      m: E('2 позиции · изменён в прошлом месяце', '2 entries · changed last month'),
      ids: ['q1', 'ci1']
    },
    {
      name: E('Пустой список', 'Empty list'),
      m: E('0 позиций · изменён 1 час назад', '0 entries · changed 1 hour ago'),
      ids: []
    }
  ];
  const MORE_NAMES = [
    E('Лавка алхимика', "The alchemist's shop"),
    E('Клад дракона', "Dragon's hoard"),
    E('Сундук в склепе', 'The crypt chest'),
    E('Награда гильдии', 'Guild reward'),
    E('Рынок Порта', 'The harbor market'),
    E('Трофеи босса', 'Boss trophies'),
    E('Запасы отряда', 'Party supplies'),
    E('Дары фей', 'Fey gifts'),
    E('Сессия 12', 'Session 12')
  ];

  function card(l, o = {}) {
    const thumbs = l.ids.length
      ? `<div class="thumbs">${l.ids.map((id) => art(R[id], 36)).join('')}</div>`
      : '';
    const reqs =
      l.req || l.notice
        ? `<div class="reqs"><a class="badge req" href="#">${E('Новое в списке (3)', 'New in this list (3)')}</a></div>`
        : '';
    const menu = o.menuOpen
      ? pop(
          mi(E('Открыть', 'Open'), { i: 'open' }) +
            mi(E('Скачать JSON', 'Download JSON'), { i: 'download' }) +
            '<hr>' +
            mi(E('Удалить список', 'Delete the list'), { i: 'trash', cls: 'danger' }),
          { r: true, w: 220 }
        )
      : '';
    const more = o.sel
      ? ''
      : anchor(
          btn(t('more'), {
            sm: true,
            cls: 'ghost',
            i: 'more',
            attr: `aria-label="${t('more')}: ${l.name}" aria-expanded="${!!o.menuOpen}"`
          }),
          menu
        );
    return `<article class="panel lcard ${o.sel ? 'selmode' : ''} ${o.on ? 'sel' : ''}">${o.sel ? ck(o.on) : ''}<h3><a href="#">${l.name}</a></h3><div class="m">${l.m}</div>${thumbs}<div class="foot3">${reqs || '<span></span>'}${more}</div></article>`;
  }

  /* «Новый список» is the head's primary; it opens the name field in place
     (plan.md section 14, rule 8). «Импорт из файла» sits in «Ещё» on the count line. */
  const newField = (o = {}) =>
    o.newOpen
      ? `<section class="panel newl" aria-label="${E('Новый список', 'New list')}"><div class="rowf nlr"><label class="mvl">${E('Название списка', 'List name')}<span class="field foc"><input placeholder="${E('Клад дракона', "Dragon's hoard")}"></span></label>${btn(E('Создать', 'Create'), { cls: 'primary' })}${btn(E('Отмена', 'Cancel'), { cls: 'ghost' })}</div></section>`
      : '';
  const limitNote = `<p class="limitnote" style="margin:0 0 12px">${icx('alert')}<span>${E('В аккаунте 50 списков из 50. Удалите ненужный или напишите на daggerheart.loot@gmail.com.', 'The account holds 50 lists of 50. Delete one you do not need or write to daggerheart.loot@gmail.com.')}</span></p>`;

  /* The page: the title with «Новый список» (no group heading: one account, one
     group - D116), the count line with «Выбрать» and «Ещё», the cards. */
  function listsPage(o = {}) {
    const lists = o.lists || LISTS;
    const total = o.total === undefined ? lists.length : o.total;
    const sel = o.sel;
    const count = E(
      `${total} ${U.plural(total, ['список', 'списка', 'списков'])} из 50`,
      `${total} ${total === 1 ? 'list' : 'lists'} of 50`
    );
    const moreMenu = o.moreOpen
      ? pop(mi(E('Импорт из файла', 'Import from file'), { i: 'upload' }), { r: true, w: 220 })
      : '';
    const more = anchor(
      btn(t('more'), {
        sm: true,
        i: 'more',
        cls: `m-only ${o.importPanel ? 'on' : ''}`,
        attr: `aria-expanded="${!!o.moreOpen}"`
      }),
      moreMenu
    );
    const tools = sel
      ? selBar({
          state: selState(sel.length, lists.length),
          head: E(`Выбрано: ${sel.length}`, `${sel.length} selected`),
          acts:
            btn(E(`Скачать JSON (${sel.length})`, `Download JSON (${sel.length})`), {
              sm: true,
              i: 'download',
              dis: !sel.length
            }) +
            btn(E(`Удалить (${sel.length})`, `Delete (${sel.length})`), {
              sm: true,
              cls: 'danger',
              dis: !sel.length
            })
        })
      : o.signedOut
        ? ''
        : o.find
          ? `<div class="acts2 cline"><label class="field fcount">${ic('search')}<input placeholder="${E('Поиск', 'Search')}"></label><span class="count2 d-only ${o.full ? 'full' : ''}" style="margin:0">${count}</span>${btn(t('select'), { sm: true })}</div><p class="count2 m-only ${o.full ? 'full' : ''}" style="margin:-8px 0 6px">${count}</p>`
          : `<div class="acts2 cline"><span class="count2" style="margin:0">${count}</span>${lists.length ? btn(t('select'), { sm: true }) : ''}</div>`;
    const find = '';
    const cards = lists.length
      ? `<div class="cards3">${lists.map((l, i) => card(l, { sel: !!sel, on: sel && sel.includes(i), menuOpen: o.menuOpen && i === 0 })).join('')}</div>`
      : '';
    const fold = o.hidden
      ? `<div style="display:flex;justify-content:center;margin-top:14px">${btn(E(`Показать ещё (${o.hidden})`, `Show more (${o.hidden})`))}</div>`
      : '';
    const body = `${o.body || `${find}${cards}${fold}`}${sel ? tools : ''}`;
    const head2 = sel ? '' : tools;
    const primary = o.signedOut
      ? ''
      : btn(E('Новый список', 'New list'), {
          cls: 'primary',
          i: 'plus',
          sm: N,
          attr: `aria-expanded="${!!o.newOpen}"`
        });
    const imp = o.signedOut
      ? ''
      : btn(E('Импорт из файла', 'Import from file'), {
          sm: true,
          i: 'upload',
          cls: `d-only ${o.importPanel ? 'on' : ''}`,
          attr: `aria-expanded="${!!o.importPanel}"`
        });
    const h = `<div class="ph one"><h1>${t('menuLists')}</h1><div class="phr">${imp}${primary}${o.signedOut ? '' : more}</div></div>`;
    const main = `<main class="wrap">${h}${newField(o)}${o.importPanel || ''}${head2}<div class="${sel ? 'padbar' : ''}">${body}</div></main>`;
    return rpage({ job: null, signedIn: !o.signedOut, here: !o.signedOut }, main);
  }

  const listsEmpty = () =>
    listsPage({
      lists: [],
      total: 0,
      body: empty(
        E('Списков пока нет', 'No lists yet'),
        E(
          'Нажмите «Новый список» - или «В список» у предмета в таблице или в броске.',
          'Press "New list" - or "Add to list" on an item in a table or a roll.'
        ),
        btn(E('Открыть таблицы', 'Open the tables'), { i: 'table' }),
        '',
        'list'
      )
    });
  const listsSignedOut = () =>
    listsPage({
      signedOut: true,
      body: empty(
        E('Войдите, чтобы собирать списки', 'Sign in to keep lists'),
        E(
          'Списки хранятся в аккаунте: открываются на любом устройстве и уходят игрокам одной ссылкой.',
          'Lists live in your account: they open on any device and go to your players as one link.'
        ),
        btn(t('signIn'), { cls: 'primary', i: 'user' }),
        '',
        'list'
      )
    });
  const listsError = () =>
    listsPage({
      body: loadErr(
        E('Не получилось загрузить списки', 'Your lists did not load'),
        E('Проверьте соединение и попробуйте ещё раз.', 'Check the connection and try again.'),
        btn(E('Повторить', 'Retry'), { i: 'refresh' })
      )
    });
  function listsLimit() {
    const extra = MORE_NAMES.map((name, i) => ({
      name,
      m: E(
        `${i + 3} ${U.plural(i + 3, ['позиция', 'позиции', 'позиций'])} · изменён ${i + 4} ${U.plural(i + 4, ['день', 'дня', 'дней'])} назад`,
        `${i + 3} entries · changed ${i + 4} days ago`
      ),
      ids: [
        ['cc1', 'cc2', 'cc3'],
        ['q26', 'voa'],
        ['ci5'],
        ['hi2', 'ci3'],
        ['cc2'],
        ['q4', 'q10', 'q13'],
        ['hi1', 'hc1'],
        ['ci2', 'w1'],
        ['dv3']
      ][i]
    }));
    const rest = Array.from({ length: 12 }, (_, i) => ({
      name: E(`Сессия ${13 + i}`, `Session ${13 + i}`),
      m: E(
        `${i + 1} ${U.plural(i + 1, ['позиция', 'позиции', 'позиций'])} · изменён в прошлом месяце`,
        `${i + 1} ${i ? 'entries' : 'entry'} · changed last month`
      ),
      ids: [['cc1'], ['q26', 'voa'], ['ci5'], ['hi2', 'ci3']][i % 4]
    }));
    return listsPage({
      full: true,
      find: true,
      total: 50,
      lists: [...LISTS.slice(0, 3), ...extra, ...rest],
      hidden: 26
    });
  }

  /* ---------- the lists import (A14, D6) ---------- */
  function importPanel() {
    return `<div style="display:grid;gap:12px">
      <div class="wb">${btn(E('Выбрать файл', 'Choose a file'), { sm: true })}<span class="count2">lists-2026-10.json</span><a class="lnk" href="#" style="margin-left:auto">${E('Формат файла', 'File format')}</a></div>
      <div class="sum"><b>${E('Будет добавлено: 2 списка, 13 позиций.', 'To add: 2 lists, 13 entries.')}</b> ${E('Пропущено 2 позиции.', '2 entries skipped.')}</div>
      <div class="kv"><div class="k"><b>${t('listName')}</b><span>${E('13 позиций · такой список уже есть: появится второй', '13 entries · a list with this name exists: a second one is added')}</span></div>
        <details class="more2" open><summary>${E('Пропущено: 2', 'Skipped: 2')}</summary><ul><li>${E('Позиция 4: такого предмета нет в каталоге', 'Entry 4: no such record in the catalog')}</li><li>${E('Позиция 9: «Первоклассный Спальный Мешок» уже есть в позиции 1', 'Entry 9: "Premium Bedroll" is already entry 1')}</li></ul></details></div>
      <div class="kv"><div class="k"><b>${E('Пустой список', 'Empty list')}</b><span>${E('без позиций', 'no entries')}</span></div><div></div></div>
      <div class="wb">${btn(E('Импортировать 2 списка', 'Import 2 lists'), { cls: 'primary' })}${btn(E('Отмена', 'Cancel'))}</div></div>`;
  }
  const listsImport = () =>
    listsPage({
      importPanel: `<section class="panel ibox"><div class="wb" style="justify-content:space-between"><h2>${E('Импорт из файла', 'Import from file')}</h2>${btn(t('close'), { sm: true, cls: 'ghost', i: 'x' })}</div>${importPanel()}</section>`
    });

  /* ---------- /lists/<uuid> not found (A18): a true cause, one next step ---------- */
  function listsNope(signedIn) {
    const P = signedIn
      ? [
          E('Этого списка нет в вашем аккаунте', 'This list is not in your account'),
          E(
            'Его удалили, или он сохранён в другом аккаунте. Вы вошли как gm1@example.test.',
            'It was deleted, or it is in another account. You are signed in as gm1@example.test.'
          ),
          btn(t('menuLists'), { cls: 'primary', i: 'list' }) +
            btn(E('Открыть таблицы', 'Open the tables'), { i: 'table' })
        ]
      : [
          E('Список не открывается', 'This list does not open'),
          E(
            'Списки открываются только в аккаунте, где их создали. Войдите в него.',
            'A list opens only in the account where it was made. Sign in to that account.'
          ),
          btn(t('signIn'), { cls: 'primary', i: 'user' }) +
            btn(E('Открыть таблицы', 'Open the tables'), { i: 'table' })
        ];
    return rpage(
      { job: null, signedIn, here: false },
      `<main class="wrap">${errPage(...P)}</main>`
    );
  }

  /* ---------- the add-to-list menu (C61, C35, C62) ---------- */
  const r = R.ci1;
  const meta = `<div class="meta">${badge(r)}<span>${srcName(r)} · ${t('no')} ${r.no}</span><a href="#">${t('showInTable')}</a></div>`;
  function menuRows(big) {
    const rows = [
      [t('listName'), 10, true],
      [E('Трофеи', 'Trophies'), 2, true],
      [E('Пустой список', 'Empty list'), 0, false]
    ];
    const tick = (on) => (on ? ic('check') : '<span class="sp"></span>');
    return rows
      .map(
        ([l, n, on]) =>
          `<button class="mi" role="menuitemcheckbox" aria-checked="${on}">${tick(on)}${l}<span class="nn">${E(`${n} ${U.plural(n, ['позиция', 'позиции', 'позиций'])}`, `${n} ${n === 1 ? 'entry' : 'entries'}`)}</span></button>`
      )
      .join('');
  }
  function newRow(signedOut) {
    return signedOut
      ? `<div style="padding:8px 10px 6px;display:grid;gap:8px"><span style="font-size:15px;color:var(--muted)">${E('Списки хранятся в аккаунте.', 'Lists live in your account.')}</span>${btn(E('Войти и создать список', 'Sign in and make a list'), { cls: 'primary', i: 'user', sm: true })}</div>`
      : `<button class="mi">${ic('plus')}${E('Новый список', 'New list')}</button>`;
  }
  function menuDesk(signedOut) {
    const body = signedOut
      ? `<div class="mh">${t('lists')}</div>${newRow(true)}`
      : `<div class="mh">${t('lists')}</div>${menuRows()}<hr>${newRow(false)}`;
    return `<div class="pop" role="menu" style="top:calc(100% + 6px);left:0;min-width:280px">${body}</div>`;
  }
  function itemListMenu(o = {}) {
    const addBtn = btn(t('addList'), {
      cls: 'primary',
      i: 'plus',
      chev: true,
      attr: 'aria-expanded="true"'
    });
    if (!N) {
      const acts = `${anchor(addBtn, menuDesk(o.signedOut))}${btn(t('share'), { i: 'share' })}${btn(t('print'), { i: 'print' })}${btn(t('more'), { i: 'more', chev: true })}`;
      const main = `<main class="wrap"><article class="dossier">${art(r)}<div class="txt"><h1>${nm(r)}</h1>${meta}<p class="lead">${desc(r)}</p><div class="acts">${acts}</div>
        ${o.signedOut ? '' : `<div class="toast2" role="status" style="position:relative;left:auto;bottom:auto;transform:none;margin-top:260px">${E('Добавлено в «Трофеи»', 'Added to "Trophies"')}${btn(E('Вернуть', 'Undo'), { sm: true })}</div>`}</div></article></main>`;
      return rpage({ job: null, signedIn: !o.signedOut }, main);
    }
    /* 360: the item sheet, then the menu as a second sheet over it, so no list
       hides under the action bar (C62). */
    const behind = rpage(
      { job: 'tables', signedIn: !o.signedOut },
      `<main class="wrap">${head(t('tables'), {})}</main>`
    );
    const item = `<section class="sheet" role="dialog" aria-label="${nm(r)}"><div class="grab"></div><div class="sh">${btn(t('close'), { sm: true, cls: 'ghost', i: 'x' })}</div>
      <div class="scroll">${art(r)}<h2>${nm(r)}</h2>${meta}</div>
      <div class="dock d3" style="position:relative">${btn(t('addList'), { cls: 'primary', i: 'plus', chev: true, attr: 'aria-expanded="true"' })}${btn(t('share'), { i: 'share' })}${btn(t('more'), { i: 'more' })}</div></section>`;
    const body = o.signedOut ? newRow(true) : `${menuRows(true)}<hr>${newRow(false)}`;
    const sheet2 = `<div class="scrim2"></div><section class="sheet2" role="dialog" aria-label="${t('addList')}"><div class="grab"></div><div class="sh2"><b>${t('addList')}</b>${btn(t('close'), { sm: true, cls: 'ghost', i: 'x' })}</div>${body}</section>`;
    return `<div class="ov" style="height:820px">${behind}<div class="scrim"></div>${item}${sheet2}</div>`;
  }

  const STATES = {
    'lists-index': () => listsPage(),
    'lists-new': () => listsPage({ newOpen: true }),
    'lists-more': () => listsPage({ moreOpen: true }),
    'lists-cardmenu': () => listsPage({ menuOpen: true }),
    'lists-selected': () => listsPage({ sel: [0, 2] }),
    'lists-select-none': () => listsPage({ sel: [] }),
    'lists-empty': listsEmpty,
    'lists-signedout': listsSignedOut,
    'lists-error': listsError,
    'lists-limit': listsLimit,
    'lists-import': listsImport,
    'lists-nope': () => listsNope(false),
    'lists-nope-signedin': () => listsNope(true),
    'item-listmenu': () => itemListMenu(),
    'item-listmenu-signedout': () => itemListMenu({ signedOut: true })
  };
  window.RSTATES = Object.keys(STATES);
  window.RSTATE = () => {
    U.pinned = '';
    let h = (STATES[S] || STATES['lists-index'])();
    if (U.pinned)
      h = `<div class="ov" style="height:640px">${h}<div class="pinbar">${U.pinned}</div></div>`;
    U.pinned = '';
    return U.fix(h);
  };
})();
