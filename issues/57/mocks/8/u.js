/* Unit B batch mocks (6, 8, 9): shared snippets over direction R. Loads after
   ../direction/R/states.js (for its extra records) and before the batch's states.js.
   The same file sits in mocks/6/, mocks/8/ and mocks/9/; edit one and copy it. */
(function () {
  const M = window.M;
  const { t, L, R, nm, desc, statLine, feat, ic, art, badge, srcName, LANG } = M;
  const E = (ru, en) => (LANG === 'en' ? en : ru);
  const N = innerWidth <= 760;
  const P = new URLSearchParams(location.search);
  const S = P.get('s') || '';

  /* Icons the kit lacks: drawn in the kit's 24 px stroke style. */
  const EXTRA = {
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.4v.1"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    download: '<path d="M12 4v11M7 10.5l5 5 5-5"/><path d="M5 20h14"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
    move: '<path d="M4 12h13M13 7.5l4.5 4.5-4.5 4.5"/><path d="M20 5v14"/>',
    upload: '<path d="M12 20V9M7 13.5l5-5 5 5"/><path d="M5 4h14"/>',
    refresh: '<path d="M20 11a8 8 0 10-2.3 5.7"/><path d="M20 5v6h-6"/>',
    back: '<path d="M14.5 6l-6 6 6 6"/>',
    open: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>'
  };
  const icx = (n) =>
    EXTRA[n] ? `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${EXTRA[n]}</svg>` : ic(n);

  /* Extra records: the homebrew Items tab past its search threshold. Pictures are
     real files from img/ standing in for the author's uploads. */
  Object.assign(R, {
    hbS: Object.assign(R.hbS || {}, { img: 'ci1' }),
    hbM: {
      kind: 'weapon',
      src: ['Мастерская Ольхи', "Olkha's workshop"],
      hb: true,
      img: 'q5',
      ru: 'Молот Горна',
      en: 'Forge Hammer',
      d: ['Ударом по наковальне будит огонь в горне.', 'A blow on the anvil wakes the fire in the forge.'],
      tr: 'strength',
      rg: 'melee',
      dmg: 'd8+2',
      dt: 'phy',
      bu: 1,
      tier: 1
    },
    hbK: {
      kind: 'weapon',
      src: ['Мастерская Ольхи', "Olkha's workshop"],
      hb: true,
      noimg: true,
      ru: 'Клинок Закалки',
      en: 'Tempered Blade',
      d: ['Звенит, когда рядом враг.', 'It rings when an enemy is near.'],
      tr: 'finesse',
      rg: 'melee',
      dmg: 'd8',
      dt: 'phy',
      bu: 1,
      tier: 2
    },
    hbP: {
      kind: 'armor',
      src: ['Мастерская Ольхи', "Olkha's workshop"],
      hb: true,
      img: 'q320',
      ru: 'Фартук Кузнеца',
      en: "Smith's Apron",
      d: ['Кожа, прошитая медной нитью.', 'Leather sewn with copper thread.'],
      th: '6/13',
      as: 3,
      tier: 1
    },
    hbL: {
      kind: 'item',
      src: ['Хоумбрю', 'Homebrew'],
      hb: true,
      img: 'ci4',
      ru: 'Фонарь Светлячков',
      en: 'Firefly Lantern',
      d: ['Светит, пока в нём живут светлячки.', 'It shines while the fireflies live in it.']
    },
    ci3: {
      kind: 'item',
      src: 'Core',
      no: 3,
      ru: 'Заряжающий Колчан',
      en: 'Charging Quiver',
      rud: 'Когда вы успешно наносите удар стрелой из этого колчана, получите бонус к Броску Урона, равный вашему текущему Рангу.',
      ende: 'When you succeed on an attack with an arrow stored in this quiver, gain a bonus to the damage roll equal to your current tier.'
    },
    ci5: {
      kind: 'item',
      src: 'Core',
      no: 5,
      ru: 'Разговаривающие Сферы',
      en: 'Speaking Orbs',
      rud: 'Эта пара сфер позволяет существам, которые держат их, общаться друг с другом на любом расстоянии.',
      ende: 'This pair of orbs allows any creatures holding them to communicate with each other across any distance.'
    },
    hi2: {
      kind: 'item',
      src: 'Hope & Fear',
      no: 2,
      ru: 'Крюк-Кошка',
      en: 'Grapnel',
      rud: 'Вы получаете преимущество на Броски Действия, когда взбираетесь по отвесным поверхностям.',
      ende: 'You gain advantage on action rolls to climb sheer surfaces.'
    },
    cc3: {
      kind: 'cons',
      src: 'Core',
      no: 3,
      ru: 'Зелье Сосредоточенности',
      en: 'Control Potion',
      rud: 'Вы получаете бонус +1 к следующему Броску Искусности.',
      ende: 'You gain a +1 bonus to your next Finesse Roll.'
    }
  });
  for (const [id, r] of Object.entries(R)) r.id = id;

  /* Paths: kit.js points two levels deeper than a batch folder; the editor's preview
     image lives in the direction's shared folder. EN spelling is American (P7). */
  const fix = (html) =>
    html
      .split('../../../../../img/')
      .join('../../../../img/')
      .split('../shared/')
      .join('../direction/shared/')
      .replace(/Colour/g, 'Color')
      .replace(/colour/g, 'color')
      .replace(/smoulders/g, 'smolders')
      .replace(/Traveller/g, 'Traveler')
      .replace(/armour/g, 'armor')
      .replace(/licence/g, 'license')
      .replace(/catalogue/g, 'catalog')
      .replace(/harbour/g, 'harbor')
      /* batch 1 and 2 shell (review X-3, M6-3, M2-2): a pressed segment shows a check
         before its label; the footer keeps its DPCGL fold; the pin reads as mock 2 */
      .replace(/<button aria-pressed="true">(?!<svg)/g, `<button aria-pressed="true">${ic('check')}`)
      .replace(
        'Daggerheart © Darrington Press - DPCGL</div></footer>',
        `Daggerheart © Darrington Press - DPCGL - <button class="lnkb foldb">${E('Источники и лицензия', 'Sources and license')}${ic('chev')}</button></div></footer>`
      )
      .replace(/Стартовый раздел/g, 'Открывать при запуске')
      .replace(/Start section/g, 'Open on start');

  const cap = (ru, en) => `<div class="cap">${E(ru, en)}</div>`;
  const allChip = (p = true) =>
    `<button class="chip all" aria-pressed="${p}">${p ? ic('check') : ''}${t('all')}</button>`;
  const chip = (l, p, x = '') => `<button class="chip" aria-pressed="${!!p}" ${x}>${l}</button>`;
  const btn = (label, o = {}) =>
    `<button class="btn ${o.sm ? 'sm' : ''} ${o.cls || ''}" ${o.attr || ''} ${o.dis ? 'disabled' : ''}>${o.i ? icx(o.i) : ''}${label}${o.chev ? ic('chev') : ''}</button>`;
  const seg = (opts, on, cls = 'quiet') =>
    `<div class="seg ${cls}" role="group">${opts.map((o, i) => `<button aria-pressed="${i === on}">${o}</button>`).join('')}</div>`;
  const ck = (on) =>
    `<span class="ck2 ${on ? 'on' : ''}" role="checkbox" aria-checked="${!!on}">${on ? ic('check') : ''}</span>`;
  /* The no-picture well: the kind glyph on the art well (owner, 2026-10-29: the _none
     pedestal is deleted). */
  const none = (size, g = 'gem') =>
    `<div class="art" style="width:${size}px"><span class="glyph">${icx(g)}</span></div>`;
  const hl = (s, q) => (q ? s.replace(new RegExp(`(${q})`, 'i'), '<mark>$1</mark>') : s);
  const srcLabel = (r) =>
    r.hb
      ? `<span class="badge hb">${E('Хоумбрю', 'Homebrew')}</span>`
      : `<span class="src">${srcName(r)}</span>`;
  const sub = (r) =>
    r.kind === 'weapon' || r.kind === 'armor'
      ? `<div class="stat">${statLine(r, r.hb ? { tier: true } : {})}</div>${feat(r) ? `<div class="d2 feat">${feat(r)}</div>` : r.d ? `<div class="d2">${L(r.d)}</div>` : ''}`
      : `<div class="d2">${desc(r)}</div>`;
  const tags = (r, o = {}) =>
    `${badge(r)}${r.uniq ? `<span class="badge uniq">${t('unique')}</span>` : ''}${o.noSrc ? '' : srcLabel(r)}${r.enOnly && LANG === 'ru' ? '<span class="badge lang">EN</span>' : ''}${o.gmOnly ? `<span class="badge gmo">${ic('lock')}${t('gmOnly')}</span>` : ''}`;

  /* One record row: catalog, search, homebrew and shared pages share it. */
  function row(r, o = {}) {
    return `<div class="rl ${o.ck === undefined ? 'nock' : ''} ${o.ck ? 'sel' : ''}">${o.ck === undefined ? '' : ck(o.ck)}${art(r, 48)}
      <div><b>${hl(nm(r), o.q)}</b><div class="tg">${tags(r, o)}</div>${sub(r)}${o.note || ''}</div>${o.side ? `<div class="side">${o.side}</div>` : ''}</div>`;
  }
  const empty = (title, p, action = '', ex = '', g = 'gem') =>
    `<div class="empty" role="status">${none(N ? 64 : 96, g)}<div><b>${title}</b><p>${p}</p>${ex}<div class="wb">${action}</div></div></div>`;
  const errPage = (title, p, acts) =>
    `<div class="errp"><div class="eg">${ic('link')}</div><h1>${title}</h1><p>${p}</p><div class="acts">${acts}</div></div>`;
  const loadErr = (title, p, acts) =>
    `<div class="loaderr" role="alert">${icx('alert')}<div><b>${title}</b><p>${p}</p><div class="wb">${acts}</div></div></div>`;
  /* Page head: the title, the pin (labelled), «Справка» only where asked, then a
     page-level action on the right. */
  function head(title, o = {}) {
    const pin =
      o.pin === false
        ? ''
        : `<button class="btn sm ${o.pinned ? 'on' : ''}" aria-pressed="${!!o.pinned}">${ic('home')}${t('home')}</button>`;
    const help = o.help
      ? `<button class="btn sm ghost ${o.helpOpen ? 'on' : ''}" aria-expanded="${!!o.helpOpen}">${ic('help')}${t('help')}</button>`
      : '';
    return `<div class="ph"><h1>${title}</h1>${pin}${help}${o.right ? `<div class="phr">${o.right}</div>` : ''}</div>`;
  }
  const pop = (items, o = {}) =>
    `<div class="pop ${o.r ? 'r' : ''}" role="menu" style="top:calc(100% + 6px);${o.r ? 'right:0' : 'left:0'}${o.w ? `;min-width:${o.w}px` : ''}">${items}</div>`;
  const mi = (label, o = {}) =>
    `<button class="mi ${o.cls || ''}" role="menuitem">${o.i ? icx(o.i) : '<span class="sp"></span>'}${label}${o.n !== undefined ? `<span class="nn">${o.n}</span>` : ''}</button>`;
  const anchor = (b, menu) => `<span class="anchor">${b}${menu}</span>`;
  const rpage = (o, main) => window.RX.rpage(o, main);
  /* An overlay frame: the page behind, the scrim, and the layer on top. */
  const ov = (page, layer, h) =>
    `<div class="ov" style="height:${h || (N ? 820 : 900)}px">${page}<div class="scrim"></div>${layer}</div>`;
  const sheet360 = (title, body, dock, o = {}) =>
    `<section class="sheet" role="dialog" aria-label="${title}"><div class="grab"></div>
      <div class="sh" style="justify-content:space-between;padding:2px 16px 8px"><b style="font-size:18px">${title}</b>${o.headExtra || ''}${btn(t('close'), { sm: true, cls: 'ghost', i: 'x' })}</div>
      <div class="fbody">${body}</div>${dock ? `<div class="dock2" ${o.dockStyle ? `style="${o.dockStyle}"` : ''}>${dock}</div>` : ''}</section>`;

  /* Prices: stored in coins; «Как в книге» draws them in the book's units
     (handful 10, bag 100, chest 1000), two highest units. */
  const plural = (n, f) =>
    LANG === 'en'
      ? n === 1
        ? f[0]
        : f[1]
      : n % 10 === 1 && n % 100 !== 11
        ? f[0]
        : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)
          ? f[1]
          : f[2];
  const UNITS = [
    [1000, E(['сундук', 'сундука', 'сундуков'], ['chest', 'chests'])],
    [100, E(['мешок', 'мешка', 'мешков'], ['bag', 'bags'])],
    [10, E(['горсть', 'горсти', 'горстей'], ['handful', 'handfuls'])]
  ];
  function money(n, mode) {
    if (!n) return '-';
    if (mode !== 'book') return `${n} ${t('gp')}`;
    const parts = [];
    let rest = n;
    for (const [v, f] of UNITS) {
      const k = Math.floor(rest / v);
      if (k) parts.push(`${k} ${plural(k, f)}`);
      rest -= k * v;
    }
    return parts.slice(0, 2).join(' ');
  }

  window.U = {
    E,
    N,
    S,
    P,
    icx,
    fix,
    cap,
    allChip,
    chip,
    btn,
    seg,
    ck,
    none,
    hl,
    srcLabel,
    sub,
    tags,
    row,
    empty,
    errPage,
    loadErr,
    head,
    pop,
    mi,
    anchor,
    rpage,
    ov,
    sheet360,
    plural,
    money
  };
})();
