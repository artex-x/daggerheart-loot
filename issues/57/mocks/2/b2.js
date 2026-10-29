/* Batch 2 mock: the shell (plan section 7, batch 2). R's header with main's
   shape: every frame names the path it stands for, the EN wordmark «Loot»,
   the labelled pin and «Справка», the account control lit on its pages, and
   the toast family over a page. Round 5 (reviews/mocks-2.md): no h1 under the
   mode row at 360 (R2-1), the supplement menu marks the open one and its items
   are 44 px (N2-1), the Vault of Ages help button names its panel (N2-2), the
   toast plate has a border (N2-3), «··· Ещё» is a labelled control (R0-1). */
(function () {
  const { t, R, nm } = window.M;
  const { E, addr } = window.UA;
  const RA = window.RA;
  const { btn, cap } = RA;
  const { pageHead } = window.SHELL;

  const frame = (ru, en, path, opts, body = '', h = 0) =>
    `${cap(ru, en)}${addr(path)}<div class="frame" ${h ? `style="min-height:${h}px"` : ''}>${window.RX.rheader({ static: true, ...opts })}${body}</div>`;
  /* a roll page at 360 draws no h1 (the lit mode chip names the page; the pin and
     the help sit in «Настроить» and «··· Ещё», mock 5) */
  const head = (title, o, roll = true) =>
    `<main class="wrap ${roll ? 'mh' : ''}" style="padding:18px 0 10px">${pageHead(title, o)}</main>`;
  const VOAH = { helpLabel: E('Об этой книге', 'About this book') };

  function header() {
    return [
      frame(
        'не вошли · Бросок · Обычные правила; на 1180 кнопка закрепления говорит, что сделает, а на 360 заголовка нет: закрепление и справка в «··· Ещё» (макет 5)',
        'signed out · Roll · Standard rules; at 1180 the pin says what a press does, at 360 there is no heading: the pin and the help are in "··· More" (mock 5)',
        '/roll/std',
        { job: 'roll', mode: 'std' },
        head(t('std'))
      ),
      frame(
        'старый адрес /roll/hnf зажигает «Обычные правила»; раздел закреплён: нейтральное нажатое',
        'the old address /roll/hnf lights "Standard rules"; the section is pinned: neutral pressed',
        '/roll/hnf',
        { job: 'roll', mode: 'std', signedIn: true },
        head(t('std'), { pinned: true })
      ),
      frame(
        'вошли · Vault of Ages: чип показывает дополнение золотом текущего места; кнопка справки названа по панели',
        'signed in · Vault of Ages: the chip shows the supplement in the current-place gold; the help button is named after its panel',
        '/roll/vault_of_ages',
        { job: 'roll', mode: 'voa', signedIn: true },
        head('Vault of Ages', VOAH)
      ),
      frame(
        'вошли · Мои списки: ни одна работа не горит, горит кнопка аккаунта',
        'signed in · My lists: no job is lit, the account control is',
        '/lists',
        { job: null, signedIn: true, here: true },
        head(t('menuLists'), { pin: false, help: false }, false)
      ),
      frame(
        'страница предмета: не горит ничего',
        'an item page: nothing is lit',
        '/i/ci1',
        { job: null, signedIn: true },
        `<main class="wrap" style="padding:18px 0 10px"><h1>${nm(R.ci1)}</h1></main>`
      )
    ].join('');
  }

  const tabTitle = (n, page) =>
    `<div class="tabstrip" aria-hidden="true"><div class="tab"><svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>(${n}) ${page} - ${E('Генератор лута Daggerheart', 'Daggerheart Loot Generator')}</div><div class="tab off">${E('Новая вкладка', 'New tab')}</div></div>`;

  function toasts() {
    const N = innerWidth <= 760;
    const pageUnder = (signedIn) =>
      window.RX.rpage(
        { job: 'tables', signedIn },
        `<main class="wrap">${pageHead(t('tables'))}${['q1', 'q2', 'q4', 'q10'].map((id) => RA.row(R[id], { noSrc: true, noKind: true })).join('')}</main>`
      );
    const ov = (inner, toast, h) =>
      `<div class="ov" style="height:${h}px">${inner}${toast}</div>`;
    const arrival = `<div class="toast3" role="status">${E('Новый запрос по списку «Лавка кузнеца»', 'New request for the list "The smith\'s shop"')}${btn(E('Открыть', 'Open'), { sm: true })}</div>`;
    const undo = `<div class="toast3" role="status">${E('Убрано из списка: Палаш', 'Removed from the list: Broadsword')}${btn(E('Вернуть', 'Undo'), { sm: true, cls: 'fv' })}</div>`;
    const err = `<div class="toast3 err" role="alert">${E('Не получилось сохранить. Проверьте соединение и попробуйте ещё раз.', 'Could not save. Check the connection and try again.')}</div>`;
    const h = N ? 640 : 560;
    return `${cap('новый запрос: число в заголовке вкладки и тост с действием; тост - плашка, не золото', 'a new request: the count in the tab title and an action toast; the toast is a plate, not gold')}${addr('/tables/eq_weapon')}
      ${tabTitle(2, t('tables'))}${ov(pageUnder(true), arrival, h)}
      ${cap('тост с «Вернуть» берёт фокус; когда его сменит другой тост, фокус вернётся туда, откуда пришёл (D121)', 'a toast with "Undo" takes the focus; when a later toast replaces it, the focus returns to where it came from (D121)')}
      ${ov(pageUnder(true), undo, h)}
      ${cap('ошибка: красная заливка с тёмным текстом, контраст 4.5:1 и выше (A15)', 'an error: the alarm fill with dark text, contrast 4.5:1 or more (A15)')}
      ${ov(pageUnder(true), err, h)}`;
  }

  window.XS = {
    header,
    toasts,
    'shell-signed-out': () =>
      frame(
        'не вошли · Бросок · Обычные правила',
        'signed out · Roll · Standard rules',
        '/roll/std',
        { job: 'roll', mode: 'std' },
        head(t('std'))
      ),
    'shell-account-menu': () =>
      frame(
        'рекомендуется · меню в порядке FEATURES.md, без счётчиков и без строки с адресом почты',
        'recommended · the menu in the FEATURES.md order, with no counts and no email line',
        '/tables/eq_weapon',
        { job: 'tables', signedIn: true, menuOpen: true },
        '',
        300
      ) +
      frame(
        'не принято · меню R: счётчики, строка «Вы вошли как», другой порядок - новая функция (ревью плана R3)',
        `rejected · R's menu: counts, a "Signed in as" line, another order - a new feature (plan review R3)`,
        '/tables/eq_weapon',
        { job: 'tables', signedIn: true, menuOpen: true, menuR: true },
        '',
        360
      ),
    'mode-long': () =>
      [
        ['comm', E('Предметы сообществ', 'Community items')],
        ['wond', 'Wondrous Environments'],
        ['mwt', 'Many Worlds Tavern']
      ]
        .map(([k, l]) =>
          frame(
            `самое длинное название на чипе: ${l}`,
            `the longest name on the chip: ${l}`,
            '/roll/' +
              {
                comm: 'community_items',
                wond: 'wondrous_environments',
                mwt: 'many_worlds_tavern'
              }[k],
            { job: 'roll', mode: k, signedIn: true },
            head(l)
          )
        )
        .join(''),
    'roll-target': () =>
      frame(
        'рекомендуется · стартовый раздел Vault of Ages, в этой вкладке броска ещё не было: «Бросок» ведёт в /roll/vault_of_ages',
        'recommended · the start section is Vault of Ages and this tab has no roll yet: Roll opens /roll/vault_of_ages',
        '/roll/vault_of_ages',
        { job: 'roll', mode: 'voa', signedIn: true },
        head('Vault of Ages', { pinned: true, ...VOAH })
      ) +
      frame(
        'вариант · «Бросок» всегда ведёт в /roll/std, если в этой вкладке броска не было',
        'alternative · Roll always opens /roll/std when this tab has no roll yet',
        '/roll/std',
        { job: 'roll', mode: 'std', signedIn: true },
        head(t('std'))
      ),
    'roller-supmenu': () =>
      `${cap('«Дополнения» открыто на странице дополнения: открытое отмечено галочкой, пункты по 44 px; результат с «··· Ещё»', 'Supplements open on a supplement page: the open one is checked, the items are 44 px; the result carries "··· More"')}${window.RP5.rollPage('voa', { supOpen: true })}`
  };
})();
