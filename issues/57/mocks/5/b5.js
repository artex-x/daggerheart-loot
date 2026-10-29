/* Batch 5 mock: the roll pages (plan section 7, batch 5; reviews/mocks-1.md
   M5-1 to M5-10). One layout for the nine roll modes:
   - 360: the H1 is visually hidden (the lit mode control names the page);
     the mode's roll controls; one line «Бросок N» with «Настроить ▾» at its
     end, which opens the settings above the results (manual entry, the
     pickers' extras, Источник, Тип, copy, the pin, the help); compact result
     cards (96 px art beside the text).
   - 1180: two panes; the left pane holds every control; the page head shows
     the pin and the help; the full card face.
   Records are real data.js rows; img/ files are real. */
(function () {
  const { t, R, ic, LANG } = window.M;
  const { E, addr } = window.UA;
  const RA = window.RA;
  const { cap, btn } = RA;
  const scard = window.CX.scard;
  const L2 = (ru, en) => (LANG === 'en' ? en : ru);

  /* the single-result records of the supplement modes (data.js) */
  Object.assign(R, {
    w12: {
      kind: 'item',
      src: 'Wondrous Environments',
      no: 12,
      ru: 'Отвадитель Жуков',
      en: 'Big Bug Begone',
      rud: 'Один раз до следующего отдыха наведите эту антенну гигантского жука на любое гигантское беспозвоночное в пределах Средней дистанции, принудив его к Броску Реакции (15).',
      ende: 'Once per rest, point this giant beetle antenna at any giant invertebrate within Close range and force it to make a Reaction Roll (15).'
    },
    di12: {
      kind: 'item',
      src: 'Dread GM Toolbox',
      no: 12,
      ru: 'Проклятая Брошюра',
      en: 'Cursed Booklet',
      rud: 'Эта бесплатная брошюра меняет свою эстетику и стиль письма, чтобы соответствовать тому, что читатель ассоциирует с надёжностью и моральным благом.',
      ende: 'This free booklet shifts its aesthetics and writing style to match those the reader associates with trustworthiness and moral good.'
    },
    voa2_t1c: {
      kind: 'item',
      src: 'Vault of Ages',
      no: 12,
      ru: 'Оберег Демона',
      en: "Demon's Charm",
      f: ['Стоимость Призыва', 'Recall Cost', '2', '2'],
      rud: 'Вы можете отметить Стресс, чтобы призвать злого духа внутри маски для защиты, получая бонус к порогам урона, равный вашему Рангу, до конца сцены.',
      ende: 'You can mark a Stress to invoke the evil spirit within the mask for its protection, granting a bonus to your damage thresholds equal to your tier until the end of the scene.'
    },
    dv12: {
      kind: 'item',
      src: "The Dragon's Vault",
      no: 12,
      ru: 'Сапоги Возмездия',
      en: 'Boots of Vengeance',
      rud: 'Надев эти сапоги, вы должны отметить 3 Стресса, чтобы снять их.',
      ende: 'Once you have donned these boots, you must mark 3 Stress to remove them.'
    },
    aa9: {
      kind: 'item',
      src: "Arazo's Artifacts",
      no: 9,
      ru: 'Наручи Солнца и Луны',
      en: 'Bracers of the Sun and Moon',
      rud: 'Один раз за продолжительный отдых, когда вы должны отметить последнюю Рану, вы можете вместо этого потратить Надежду.',
      ende: 'Once per long rest, when you would mark your last Hit Point, you may spend a Hope instead.'
    },
    cm4: {
      kind: 'item',
      src: L2('Великородное', 'Highborne'),
      no: 4,
      ru: 'Обученная Посыльная Птица',
      en: 'Trained Messenger Bird',
      rud: 'Обученный сокол, ястреб или иная изящная птица, содержащаяся в уменьшающейся магической клетке.',
      ende: 'A trained falcon, hawk, or other elegant bird kept within a shrinking magical cage.'
    }
  });
  for (const id of ['w12', 'di12', 'voa2_t1c', 'dv12', 'aa9', 'cm4']) R[id].id = id;
  /* M5-10: a Many Worlds Tavern record names its realm */
  R.mw9.src = L2('Спорополис', 'Sporopolis');

  /* a settings icon (three sliders), not the filter funnel (M5-9) */
  const tune =
    '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>';
  const allChip = RA.allChip;
  const chip = (l, p) => `<button class="chip" aria-pressed="${!!p}">${l}</button>`;
  const num = (v, label) =>
    `<div class="num" role="group" aria-label="${label}"><button>−</button><output>${v}</output><button>+</button></div>`;
  const own = (v, label, range) =>
    `<span class="lbl">${t('orEnter')}</span><div class="own">${num(v, label)}<span class="cap2">${label},<br>${range}</span></div>`;
  const picker = (label, value) =>
    `<button class="btn pickb" aria-haspopup="listbox" aria-label="${label}: ${value}"><span class="pkv"><span class="pk">${label}</span><span class="pv">${value}</span></span>${ic('chev')}</button>`;

  /* The nine modes. `ctrl`: the roll controls that stay on the first screen;
     `cfg`: what «Настроить» opens at 360 (the left pane holds both at 1180). */
  const MODES = {
    std: {
      path: '/roll/std',
      title: E('Обычные правила', 'Standard rules'),
      help: E('Где какая редкость', 'Where each rarity fits'),
      hand: ['ci1', 'cc1', 'hi1', 'hc1'],
      n: '1',
      copy: true
    },
    alt: {
      path: '/roll/alt',
      title: E('Альтернативные таблицы', 'Alternate tables'),
      help: E('Об этих таблицах', 'About these tables'),
      hand: ['ci1', 'hi3', 'cc2', 'hc3'],
      n: E('2 и 2', '2 and 2'),
      copy: true
    },
    wond: {
      path: '/roll/wondrous_environments',
      title: 'Wondrous Environments',
      hand: ['w12'],
      n: '12',
      range: 119
    },
    dread: {
      path: '/roll/dread_gm_toolbox',
      title: 'Dread GM Toolbox',
      hand: ['di12'],
      n: '12',
      range: 29
    },
    voa: {
      path: '/roll/vault_of_ages',
      title: 'Vault of Ages',
      hand: ['voa2_t1c'],
      n: '12',
      range: 30,
      pick: [E('Раздел', 'Section'), E('Ранг 1', 'Tier 1')]
    },
    dv: {
      path: '/roll/dragons_vault',
      title: "The Dragon's Vault",
      hand: ['dv12'],
      n: '12',
      range: 145
    },
    arazo: {
      path: '/roll/arazos_artifacts',
      title: "Arazo's Artifacts",
      hand: ['aa9'],
      n: '9',
      range: 78
    },
    comm: {
      path: '/roll/community_items',
      title: E('Предметы сообществ', 'Community items'),
      hand: ['cm4'],
      n: '4',
      range: 10,
      die: 'd10',
      pick: [E('Сообщество', 'Community'), E('Великородное', 'Highborne')]
    },
    mwt: {
      path: '/roll/many_worlds_tavern',
      title: 'Many Worlds Tavern',
      hand: ['mw9'],
      n: '9',
      range: 20,
      die: 'd20',
      pick: [E('Мир', 'Realm'), E('Спорополис', 'Sporopolis')]
    }
  };

  const diceStd = (rar) =>
    [
      ['1d12', 'common'],
      ['2d12', 'cu'],
      ['3d12', 'ur'],
      ['4d12', 'rl'],
      ['5d12', 'leg']
    ]
      .map(
        ([d, k], i) =>
          `<button class="die ${i === 0 ? 'on' : ''}" aria-label="${d}: ${t(k)}"><span class="d">${ic('die')}${d}</span>${rar ? `<span class="r">${t(k)}</span>` : ''}</button>`
      )
      .join('');

  function rollPage(key, o = {}) {
    const m = MODES[key];
    const narrowed = !!o.narrowed;
    let ctrl;
    let cfg;
    if (key === 'std') {
      ctrl = `<span class="lbl w1180">${t('rollBtn')}</span><div class="dice ${o.noRarity ? 'one' : 'two3'}">${diceStd(!o.noRarity)}</div>`;
      cfg = `${own(1, t('sumField'), '1-60')}
        <span class="lbl">${t('source')}</span><div class="fl">${allChip()}${chip('Core')}${chip('Hope & Fear')}</div>
        <span class="lbl">${t('type')}</span><div class="fl">${allChip(!narrowed)}${chip(t('items'))}${chip(t('cons'), narrowed)}</div>`;
    } else if (key === 'alt') {
      const rar = [
        E('Обычная', 'Common'),
        E('Необычная', 'Uncommon'),
        E('Редкая', 'Rare'),
        E('Очень редкая', 'Very rare'),
        E('Легендарная', 'Legendary')
      ];
      /* 360: the rarity is a picker beside the roll; 1180: the segmented row */
      ctrl = `<div class="rrow n360">${picker(t('rarity'), rar[0])}${btn(E('Бросить кости', 'Roll the dice'), { cls: 'primary', i: 'die' })}</div><div class="w1180 cfgw"><span class="lbl">${t('rarity')}</span><div class="seg full rarseg" role="group">${rar.map((r, i) => `<button aria-pressed="${i === 0}">${r}</button>`).join('')}</div>${btn(E('Бросить Кости Дуальности', 'Roll the Duality Dice'), { cls: 'primary', i: 'die' })}</div>`;
      cfg = `<span class="lbl">${t('orEnter')}</span><div class="nums2"><label><span><span class="dv h" style="width:22px;height:22px;font-size:12px">H</span>${E('Кость Надежды', 'Hope die')}</span>${num(2, E('Кость Надежды', 'Hope die'))}</label><label><span><span class="dv f" style="width:22px;height:22px;font-size:12px">F</span>${E('Кость Страха', 'Fear die')}</span>${num(2, E('Кость Страха', 'Fear die'))}</label></div>
        <span class="lbl">${t('type')}</span><div class="fl">${allChip()}${chip(t('items'))}${chip(t('cons'))}</div>`;
    } else {
      const roll = m.die
        ? btn(`${E('Бросить', 'Roll')} ${m.die}`, { cls: 'primary', i: 'die' })
        : btn(`${E('Случайно', 'Random')} 1-${m.range}`, { cls: 'primary', i: 'die' });
      ctrl = `<div class="rrow">${m.pick ? picker(m.pick[0], m.pick[1]) : ''}${roll}</div>`;
      cfg = own(m.n, E('Номер в таблице', 'Table number'), `1-${m.range}`);
    }
    const extra = `<div class="wb cfgx">${m.copy ? btn(t('copyAll'), { sm: true, i: 'copy' }) : ''}${btn(E('Открывать при запуске', 'Open on start'), { sm: true, i: 'home' })}${btn(m.help || t('help'), { sm: true, cls: 'ghost', i: 'help' })}</div>`;
    const setLabel = narrowed
      ? `${E('Настроить', 'Set up')} · ${t('cons')}`
      : E('Настроить', 'Set up');
    const setBtn = `<button class="btn sm cfgbtn ${narrowed ? 'on' : ''}" aria-expanded="${!!o.cfgOpen}">${tune}${setLabel}${ic('chev')}</button>`;
    const crit =
      key === 'alt' && o.crit
        ? `<div class="crit" role="status"><div class="dd"><span class="dv h">2</span><span class="dv f">2</span></div><div><b>${E('Критический успех: дубль', 'Critical success: doubles')}</b><p>${E('Игрок берёт любую позицию этой редкости.', 'The player takes any entry of this rarity.')}</p></div>
          <div class="wb">${btn(E('Предметы: Обычная', 'Items: Common'), { sm: true, i: 'table' })}${btn(E('Расходники: Обычная', 'Consumables: Common'), { sm: true, i: 'table' })}${btn(E('Поднять до Необычной', 'Raise to Uncommon'), { sm: true })}</div></div>`
        : '';
    const rarity = key === 'std' ? `<span class="badge">${t('common')}</span>` : '';
    const dieTag = (id) => {
      if (key !== 'alt') return '';
      const hope = id === 'ci1' || id === 'cc2';
      return `<span class="badge ${hope ? 'hope' : 'fear'}">${hope ? E('Надежда', 'Hope') : E('Страх', 'Fear')}</span>`;
    };
    const hand = m.hand
      .map(
        (id) =>
          `<div class="dealt">${scard(R[id]).replace('<div class="kind">', `<div class="kind">${rarity}${dieTag(id)}`)}<div class="cardacts">${btn(t('addList'), { sm: true, i: 'plus' })}${btn(t('share'), { sm: true, i: 'share' })}${btn('', { sm: true, i: 'more', attr: `aria-label="${t('more')}"` })}</div></div>`
      )
      .join('');
    const head = window.SHELL.pageHead(m.title, { helpLabel: m.help || t('help') });
    const panel = o.cfgOpen ? `<div class="panel cfgbody n360">${cfg}${extra}</div>` : '';
    const main = `<main class="wrap rfs">${head}<div class="two">
      <section class="panel ctrl">${ctrl}<div class="w1180 cfgw">${cfg}</div></section>
      <section><div class="reshead"><h2>${E('Бросок', 'Roll')} ${m.n}</h2><span class="n360">${setBtn}</span>${m.copy ? `<span class="w1180">${btn(t('copyAll'), { sm: true, i: 'copy' })}</span>` : ''}</div>
        ${panel}${crit}<div class="hand2 ${m.hand.length === 1 ? 'one' : ''}">${hand}</div></section></div></main>`;
    const mode = {
      std: 'std',
      alt: 'alt',
      wond: 'wond',
      dread: 'dread',
      voa: 'voa',
      dv: 'dv',
      arazo: 'arazo',
      comm: 'comm',
      mwt: 'mwt'
    }[key];
    return `${addr(m.path)}${window.RX.rpage({ job: 'roll', mode }, main)}`;
  }

  window.XS = {
    roller: () => rollPage('std'),
    'roller-b': () =>
      `${cap('вариант B: кубики одной строкой без редкости - первый результат на 240 px', 'variant B: the dice in one row with no rarity - the first result at 240 px')}${rollPage('std', { noRarity: true })}`,
    'roller-config': () =>
      `${cap('«Настроить» открыто: панель над результатами (360); на 1180 всё в левой панели', '"Set up" open: the panel above the results (360); at 1180 everything is in the left pane')}${rollPage('std', { cfgOpen: true })}`,
    'roller-narrowed': () =>
      `${cap('выключены предметы: закрытая «Настроить» называет выбор и подсвечена', 'items switched off: the closed "Set up" names the choice and is lit')}${rollPage('std', { narrowed: true })}`,
    'roller-alt': () => rollPage('alt'),
    'roller-alt-crit': () =>
      `${cap('критический успех при обоих видах: две ссылки, у каждой своя таблица', 'a critical success with both kinds on: two links, each names its table')}${rollPage('alt', { crit: true })}`,
    'roller-wond': () => rollPage('wond'),
    'roller-dread': () => rollPage('dread'),
    'roller-voa': () => rollPage('voa'),
    'roller-dv': () => rollPage('dv'),
    'roller-arazo': () => rollPage('arazo'),
    'roller-comm': () => rollPage('comm'),
    'roller-mwt': () => rollPage('mwt')
  };
})();
