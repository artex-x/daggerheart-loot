/* Unit A's copy of direction R's states.js for the batch mocks 1-5 and 7.
   Changes from R: path addresses (main c8243ba6), hooks for the batch
   options (catalog `o.q`, `o.headOpts`, `o.afterHead`, `o.underToolbar`),
   and `window.RA` plus `window.XS` so a batch file adds or replaces a
   state. R itself stays read-only. */
(function () {
  const { t, L, R, nm, desc, statLine, feat, ic, art, badge, srcName, LANG } = window.M;
  const { pageHead } = window.SHELL;
  const E = (ru, en) => (LANG === 'en' ? en : ru);
  const N = innerWidth <= 760;
  const S = new URLSearchParams(location.search).get('s') || 'catalog-filters';

  /* records beyond kit.js, from data.js */
  Object.assign(R, {
    hi3: {
      kind: 'item',
      src: 'Hope & Fear',
      no: 3,
      ru: 'Металлические Шарики',
      en: 'Ball Bearings',
      rud: 'В этом мешочке лежат идеально гладкие металлические шарики.',
      ende: 'This pouch contains perfectly smooth metal spheres.'
    },
    cc2: {
      kind: 'cons',
      src: 'Core',
      no: 2,
      ru: 'Зелье Усиления',
      en: 'Bolster Potion',
      rud: 'Вы получаете бонус +1 к следующему Броску Силы.',
      ende: 'You gain a +1 bonus to your next Strength Roll.',
      up: ['Большое Зелье Усиления', 'Major Bolster Potion']
    },
    hc3: {
      kind: 'cons',
      src: 'Hope & Fear',
      no: 3,
      ru: 'Семя Вергласа',
      en: 'Verglasian Seed',
      rud: 'Этим осколком льда можно мгновенно заморозить участок воды в пределах Средней дистанции.',
      ende: 'You can use this ice shard to instantly freeze an area of water up to Close range.'
    },
    ci2: {
      kind: 'item',
      src: 'Core',
      no: 2,
      ru: 'Пронзительная Свирель',
      en: 'Piper Whistle',
      rud: 'Эта свирель ручной работы имеет характерный звук. Её пронзительный звук слышен в радиусе 1 километра.',
      ende: 'This handcrafted whistle has a distinctive sound. Its piercing tone can be heard within a 1-mile radius.'
    },
    w1: {
      kind: 'cons',
      src: 'Wondrous Environments',
      no: 1,
      ru: 'Смола Бездны',
      en: 'Abyssal Sap',
      rud: 'Вы можете бросить флакон этой смолы в цель в пределах Далекой дистанции, воспроизводя эффект заклинания «Неистовое опутывание».',
      ende: 'You can throw a vial of this sap at a target within Far range to have the effect of the Vicious Entangle spell.'
    },
    dv3: {
      kind: 'item',
      src: "The Dragon's Vault",
      no: 3,
      ru: 'Агатовый Паук',
      en: 'Agate Spider',
      rud: 'Вы можете приказать украшению в виде паука прыгнуть на существо в пределах Средней дистанции.',
      ende: 'You can command this spider ornament to leap onto a creature within Close range.'
    },
    mw9: {
      kind: 'item',
      src: 'Many Worlds Tavern',
      no: 9,
      ru: 'Мицелиевый Плащ',
      en: 'Mycelial Cloak',
      rud: 'Пока вы носите этот плащ, вы получаете преимущество на Бросок Инстинкта для использования свойства Родословной «Сеть фангрилов».',
      ende: 'While wearing this, gain advantage on your Instinct Roll to use your "Fungril Network" ancestry feature.'
    },
    hbA: {
      kind: 'weapon',
      src: ['Мастерская Ольхи', "Olkha's workshop"],
      hb: true,
      img: 'q17',
      uniq: true,
      ru: 'Топор Тлеющих Углей',
      en: 'Emberaxe',
      d: [
        'Лезвие тлеет и не гаснет под дождём.',
        'The blade smolders and does not go out in the rain.'
      ],
      tr: 'knowledge',
      rg: 'melee',
      dmg: 'd10+2',
      dt: 'mag',
      bu: 2,
      tier: 2
    },
    hbR: {
      kind: 'item',
      src: ['Хоумбрю', 'Homebrew'],
      hb: true,
      noimg: true,
      ru: 'Кольцо с гравировкой',
      en: 'Engraved ring',
      d: [
        'Надпись на неизвестном языке. Тёплое на ощупь.',
        'An inscription in an unknown tongue. Warm to the touch.'
      ]
    },
    hbB: {
      kind: 'cons',
      src: ['Хоумбрю', 'Homebrew'],
      hb: true,
      noimg: true,
      ru: 'Настой кузнеца',
      en: "Smith's brew",
      d: [
        'Выпейте перед работой у горна: до конца сцены вы не отмечаете Стресс от жара.',
        'Drink it before work at the forge: until the end of the scene you mark no Stress from heat.'
      ]
    },
    hbC: {
      kind: 'item',
      src: ['Хоумбрю', 'Homebrew'],
      hb: true,
      noimg: true,
      enOnly: true,
      ru: 'Whispering Cap',
      en: 'Whispering Cap',
      d: [
        'Once per rest, hear one sentence spoken within Far range.',
        'Once per rest, hear one sentence spoken within Far range.'
      ]
    },
    hbS: {
      kind: 'item',
      src: ['Хоумбрю', 'Homebrew'],
      hb: true,
      img: 'cc1',
      ru: 'Скатка следопыта',
      en: "Ranger's bedroll",
      d: ['Свёрнутая постель для ночёвки в пути.', 'A rolled bed for nights on the road.']
    }
  });
  for (const [id, r] of Object.entries(R)) r.id = id;

  /* r.js loads after this file and defines RX before it calls RSTATE */
  const rpage = (...a) => window.RX.rpage(...a);
  const roller = (...a) => window.RX.roller(...a);
  const scard = window.CX.scard;
  const { FI } = window.UA;
  const cap = (ru, en) => `<div class="cap">${E(ru, en)}</div>`;
  const allChip = (p = true) =>
    `<button class="chip all" aria-pressed="${p}">${p ? FI('check') : ''}${t('all')}</button>`;
  const chip = (l, p) => `<button class="chip" aria-pressed="${!!p}">${l}</button>`;
  const btn = (label, o = {}) =>
    `<button class="btn ${o.sm ? 'sm' : ''} ${o.cls || ''}" ${o.attr || ''}>${o.i ? ic(o.i) : ''}${label}${o.chev ? ic('chev') : ''}</button>`;
  const seg = (opts, on, quiet = true) =>
    `<div class="seg ${quiet ? 'quiet np' : ''}" role="group">${opts.map((o, i) => `<button aria-pressed="${i === on}">${quiet && i === on ? FI('check') : ''}${o}</button>`).join('')}</div>`;
  const ck = (on) =>
    `<span class="ck2 ${on ? 'on' : ''}" role="checkbox" aria-checked="${!!on}">${on ? FI('check') : ''}</span>`;
  /* The empty-state art: the art well with a kind glyph. The "?" pedestal
     (img/_none.webp) is deleted (owner, 2026-10-29). */
  const none = (size, g = 'kindItem') =>
    `<div class="art" style="width:${size}px"><span class="glyph">${FI(g)}</span></div>`;
  const hl = (s, q) => (q ? s.replace(new RegExp(`(${q})`, 'i'), '<mark>$1</mark>') : s);
  const srcLabel = (r) =>
    r.hb
      ? `<span class="badge hb">${E('Хоумбрю', 'Homebrew')}</span>`
      : `<span class="src">${srcName(r)}</span>`;
  const sub = (r) =>
    r.kind === 'weapon' || r.kind === 'armor'
      ? `<div class="stat">${statLine(r, r.hb ? { tier: true } : {})}</div>${feat(r) ? `<div class="d2 feat">${feat(r)}</div>` : r.d ? `<div class="d2">${L(r.d)}</div>` : ''}`
      : `<div class="d2">${desc(r)}</div>`;

  /* One record row: catalog, search, homebrew, list and shared pages share it. */
  function row(r, o = {}) {
    const tags = `${o.noKind ? '' : badge(r)}${r.uniq ? `<span class="badge uniq">${t('unique')}</span>` : ''}${o.noSrc ? '' : srcLabel(r)}${r.enOnly && LANG === 'ru' ? '<span class="badge lang">EN</span>' : ''}${o.no ? `<span class="badge rno">${t('no')} ${r.no}</span>` : ''}`;
    return `<div class="rl ${o.ck === undefined ? 'nock' : ''} ${o.ck ? 'sel' : ''}">${o.ck === undefined ? '' : ck(o.ck)}${art(r, 48)}
      <div><b>${hl(nm(r), o.q)}</b><div class="tg">${tags}</div>${sub(r)}${o.note || ''}</div>${o.side ? `<div class="side">${o.side}</div>` : ''}</div>`;
  }
  const empty = (title, p, action, ex = '', g) =>
    `<div class="empty" role="status">${none(N ? 64 : 96, g)}<div><b>${title}</b><p>${p}</p>${ex}${action}</div></div>`;
  const errPage = (title, p, acts) =>
    `<div class="errp"><div class="eg">${ic('link')}</div><h1>${title}</h1><p>${p}</p><div class="acts">${acts}</div></div>`;

  /* ---------- catalog ---------- */
  const TR = {
    agility: ['Проворность', 'Agility'],
    strength: ['Сила', 'Strength'],
    finesse: ['Искусность', 'Finesse'],
    instinct: ['Инстинкт', 'Instinct'],
    presence: ['Влияние', 'Presence'],
    knowledge: ['Знание', 'Knowledge']
  };
  const RG = {
    melee: ['Вплотную', 'Melee'],
    veryclose: ['Близко', 'Very close'],
    close: ['Средне', 'Close'],
    far: ['Далеко', 'Far'],
    veryfar: ['Очень далеко', 'Very far']
  };
  function filterGroups(o = {}) {
    const g = (lbl, opts, any = true) =>
      `<div class="fgrp"><span class="lbl">${lbl}</span><div class="opts">${allChip(any)}${opts}</div></div>`;
    return `${g(t('tier'), ['1', '2', '3', '4'].map((n, i) => chip(n, i === 0)).join('') + chip(t('artifacts')), false)}
      ${g(t('source'), ['Core', 'Hope & Fear', 'Wondrous Environments', 'Dread GM Toolbox', 'Vault of Ages', "The Dragon's Vault", "Arazo's Artifacts", 'Many Worlds Tavern'].map((s) => chip(s)).join(''))}
      ${g(t('cls'), chip(t('phy')) + chip(t('mag')))}
      ${g(
        t('trait'),
        Object.values(TR)
          .map((p) => chip(L(p)))
          .join('')
      )}
      ${g(
        t('range'),
        Object.values(RG)
          .map((p, i) => chip(L(p), o.melee && i === 0))
          .join(''),
        !o.melee
      )}
      ${g(t('burden'), chip(t('oneH')) + chip(t('twoH')))}
      ${g(E('Улучшения и уникальные', 'Upgrades and uniques'), chip(t('upgOk')) + chip(t('uniques')))}`;
  }
  function catalog(o = {}) {
    const qMatch = (id) => new RegExp(E('меч', 'sword'), 'i').test(nm(R[id]));
    const ids = o.nothing
      ? []
      : o.q
        ? ['q1', 'q2', 'q4', 'q10', 'q16', 'q20', 'q23', 'q26'].filter(qMatch)
        : o.filtered
          ? ['q1', 'q4', 'q10', 'q26']
          : ['q1', 'q2', 'q4', 'q10', 'q16', 'q20', 'q23', 'q26'];
    const groups = ['gCore', 'gHnf', 'gAlt', 'gSup', 'gEq', 'gOther']
      .map(
        (k) =>
          `<a href="#" class="chip" ${k === 'gEq' ? 'aria-current="page"' : ''}>${t(k)}</a>`
      )
      .join('');
    const nf = o.filtered ? 2 : 1;
    const shown = o.nothing
      ? E('Показано 0 из 458', '0 of 458 shown')
      : o.q
        ? E(`Показано ${ids.length} из 458`, `${ids.length} of 458 shown`)
        : o.filtered
          ? E('Показано 23 из 458', '23 of 458 shown')
          : t('shown');
    const pills = `<span class="pill">${t('tier1')}${ic('x')}</span>${o.filtered || o.nothing ? `<span class="pill">${E('Вплотную', 'Melee')}${ic('x')}</span>` : ''}${o.filtered || o.nothing ? btn(t('reset'), { sm: true, cls: 'ghost' }) : ''}`;
    const tr = ids
      .map((id, i) => {
        const r = R[id];
        const f = feat(r);
        return `<tr class="${o.sel && i === 1 ? 'selr' : ''}">${o.sel ? `<td style="width:34px">${ck(i === 1)}</td>` : ''}<td><div class="nm">${art(r, 48)}<div><b>${hl(nm(r), o.q ? E('меч', 'sword') : '')}</b>${r.src !== 'Core' ? `<span class="src"> ${r.src}</span>` : ''}${f ? `<div class="feat">${f}</div>` : ''}</div></div></td>
        <td class="n">${L(TR[r.tr])}</td><td class="n">${L(RG[r.rg])}</td><td class="d">${r.dmg} ${E(r.dt === 'mag' ? 'маг' : 'физ', r.dt === 'mag' ? 'mag' : 'phy')}</td><td class="n">${r.bu === 2 ? t('twoH') : t('oneH')}</td></tr>`;
      })
      .join('');
    const rows = ids
      .slice(0, 6)
      .map((id, i) =>
        row(R[id], {
          noSrc: R[id].src === 'Core',
          noKind: true,
          q: o.q ? E('меч', 'sword') : '',
          ck: o.sel ? i === 1 : undefined
        })
      )
      .join('');
    const grid = ids
      .map(
        (id) =>
          `<div class="gcard">${art(R[id])}<div class="gt"><b>${nm(R[id])}</b><div class="stat">${statLine(R[id])}</div></div></div>`
      )
      .join('');
    let body;
    if (o.nothing) {
      body = empty(
        E('Ничего не найдено', 'Nothing found'),
        E(
          'Нет оружия с «кракен» в названии или описании среди фильтров: Ранг 1, Вплотную.',
          'No weapon has "kraken" in its name or text with these filters: Tier 1, Melee.'
        ),
        btn(E('Сбросить фильтры', 'Reset the filters'), { cls: 'primary' }),
        '',
        'kindWeapon'
      );
    } else if (o.grid) {
      body = `<div class="ggrid">${grid}</div>`;
    } else {
      body = `<div class="secth"><h2>${t('tier1')}</h2><span class="count n360">${shown.replace('Показано ', '').replace(' shown', '')}</span>${btn(E('Ссылка на раздел', 'Link to this section'), { sm: true, cls: 'ghost', i: 'link' })}</div>
        <table class="ct"><thead><tr>${o.sel ? '<th></th>' : ''}<th>${t('name')}</th><th>${t('trait')}</th><th>${t('range')}</th><th>${t('dmg')}</th><th>${t('burden')}</th></tr></thead><tbody>${tr}</tbody></table>
        <div class="rows360">${rows}</div>`;
    }
    const selbar = o.sel
      ? `<div class="selbar" role="region" aria-label="${E('Выбранные', 'Selected')}"><b>${E('Выбрано: 1', '1 selected')}</b>${btn(t('addList'), { sm: true, i: 'plus' })}${btn(E('Скопировать текст', 'Copy text'), { sm: true, i: 'copy' })}${btn(E('Готово', 'Done'), { sm: true, cls: 'ghost' })}</div>`
      : '';
    /* First-screen layout (plan section 14, batch 3; plan review plan-1-3 R3).
       One list head on every list page: the search row ends with «Выбрать»;
       the view switch is its own control (360: beside the table picker; 1180:
       in the search row); the count sits once, in the section head (360) or
       the search row (1180); «Ещё» holds the table link, the pin and the
       data panel at 360. */
    const view = seg([E('Список', 'List'), E('Сетка', 'Grid')], o.grid ? 1 : 0);
    const head = window.SHELL.pageHead(t('tables'), o.headOpts || {});
    const sub = `<a href="#" class="on" aria-current="page">${t('tWeapon')}</a><a href="#">${t('tSecondary')}</a><a href="#">${t('tArmor')}</a>`;
    const moreMenu = o.moreOpen
      ? `<div class="pop" style="top:calc(100% + 6px);right:0"><button class="mi">${ic('link')}${t('tableLink')}</button><hr><button class="mi">${ic('home')}${E('Открывать при запуске', 'Open on start')}</button><button class="mi">${ic('help')}${E('Об этих данных', 'About this data')}</button></div>`
      : '';
    const more360 = `<span class="anchor n360">${btn(t('more'), { sm: true, i: 'more', chev: true, attr: `aria-expanded="${!!o.moreOpen}"` })}${moreMenu}</span>`;
    const picker = `<div class="pickrow n360"><h1 class="picker"><button class="pick" aria-haspopup="dialog" aria-expanded="${!!o.pickerOpen}"><span>${t('tWeapon')}</span>${ic('chev')}</button></h1><span class="n360">${view}</span>${more360}</div>`;
    const main = `<main class="wrap fs">${picker}<div class="headrow w1180">${head}<nav class="groups">${groups}</nav></div>${o.afterHead || ''}
      <nav class="sub w1180">${sub}</nav>
      <div class="cat"><aside class="panel fside" aria-label="${t('filters')}"><div class="fh"><b>${t('filters')} · ${nf}</b>${btn(t('reset'), { sm: true, cls: 'ghost' })}</div>${filterGroups({ melee: o.filtered || o.nothing })}</aside>
      <div><div class="fsbar"><label class="field">${ic('search')}<input placeholder="${t('tblSearch')}" value="${o.nothing ? E('кракен', 'kraken') : o.q ? E('меч', 'sword') : ''}"></label>${btn(`${t('filters')} · ${nf}`, { sm: true, cls: 'fbtn', i: 'filter' })}<span class="count w1180">${shown}</span><span class="w1180">${view}</span><span class="w1180">${btn(t('tableLink'), { sm: true, i: 'link' })}</span>${o.sel ? '' : btn(t('select'), { sm: true, i: 'check', cls: 'selbtn' })}</div>${o.filtered || o.nothing ? `<div class="frow n360">${pills}</div>` : ''}${o.underToolbar || ''}
        ${body}${selbar}</div></div></main>`;
    const pg = rpage({ job: 'tables' }, main);
    if (o.pickerOpen && N) {
      const subChips = [t('tWeapon'), t('tSecondary'), t('tArmor')]
        .map(
          (l, i) => `<a href="#" class="chip" ${i === 0 ? 'aria-current="page"' : ''}>${l}</a>`
        )
        .join('');
      return `<div class="ov">${pg}<div class="scrim"></div><section class="sheet" role="dialog" aria-label="${E('Выбор таблицы', 'Choose a table')}"><div class="grab"></div>
        <div class="sh" style="justify-content:space-between;padding:2px 16px 8px"><b style="font-size:18px">${t('tables')}</b>${btn(t('close'), { sm: true, cls: 'ghost', i: 'x' })}</div>
        <div class="fbody"><div class="fgrp"><span class="lbl">${E('Группа', 'Group')}</span><div class="opts">${groups}</div></div><div class="fgrp"><span class="lbl">${t('gEq')}</span><div class="opts">${subChips}</div></div></div></section></div>`;
    }
    if (o.sheet && N) {
      return `<div class="ov">${pg}<div class="scrim"></div><section class="sheet" role="dialog" aria-label="${t('filters')}"><div class="grab"></div>
        <div class="sh" style="justify-content:space-between;padding:2px 16px 8px"><b style="font-size:18px">${t('filters')} · 1</b>${btn(t('close'), { sm: true, cls: 'ghost', i: 'x' })}</div>
        <div class="fbody">${filterGroups()}</div><div class="dock2">${btn(t('reset'))}${btn(E('Показать 91', 'Show 91'), { cls: 'primary' })}</div></section></div>`;
    }
    return pg;
  }

  /* ---------- item ---------- */
  const meta = (r) =>
    `<div class="meta">${badge(r)}<span>${srcName(r)} · ${t('no')} ${r.no}</span><a href="#">${t('showInTable')}</a></div>`;
  const listMenu = `<div class="pop" style="top:calc(100% + 6px);left:0"><div class="mh">${t('lists')}</div>
      <button class="mi">${ic('check').replace('class="i', 'class="i ckm')}${t('listName')}<span class="n">10</span></button>
      <button class="mi"><span class="sp"></span>${E('Трофеи', 'Trophies')}<span class="n">2</span></button>
      <button class="mi"><span class="sp"></span>${E('Пустой список', 'Empty list')}<span class="n">0</span></button><hr>
      <button class="mi">${ic('plus')}${E('Новый список', 'New list')}</button></div>`;
  function itemBody(r, o = {}) {
    const add = o.listOpen
      ? `<span class="anchor">${btn(t('addList'), { cls: 'primary', i: 'plus', chev: true, attr: 'aria-expanded="true"' })}${listMenu}</span>`
      : btn(t('addList'), { cls: 'primary', i: 'plus', chev: true });
    const moreMenu = o.moreOpen
      ? `<div class="pop" style="top:calc(100% + 6px);right:0">${['copyText', 'copyName', 'copyImg', 'copyLink'].map((k) => `<button class="mi">${ic(k === 'copyImg' ? 'image' : k === 'copyLink' ? 'link' : 'copy')}${t(k)}</button>`).join('')}<hr>
      <button class="mi hl">${ic('user')}${E('Войти и сохранить копию в «Мои предметы»', 'Sign in and save a copy to "My items"')}</button></div>`
      : '';
    const more = `<span class="anchor">${btn(t('more'), { i: 'more', chev: true, attr: `aria-expanded="${!!o.moreOpen}"` })}${moreMenu}</span>`;
    return { add, more };
  }
  function itemPage(o = {}) {
    const r = R.ci1;
    const { add, more } = itemBody(r, o);
    if (!N) {
      const main = `<main class="wrap"><article class="dossier">${art(r)}<div class="txt"><h1>${nm(r)}</h1>${meta(r)}<p class="lead">${desc(r)}</p>
        <div class="acts">${add}${btn(t('share'), { i: 'share' })}${btn(t('print'), { i: 'print' })}${more}</div></div></article></main>`;
      return rpage({ job: null, signedIn: !o.signedOut }, main);
    }
    return sheet(r, add, more, o);
  }
  function sheet(r, add, more, o = {}) {
    const behind = rpage(
      { job: 'tables', signedIn: !o.signedOut },
      `<main class="wrap">${pageHead(t('tables'))}</main>`
    );
    return `<div class="ov">${behind}<div class="scrim"></div><section class="sheet" role="dialog" aria-label="${nm(r)}"><div class="grab"></div>
      <div class="sh">${btn(t('close'), { sm: true, cls: 'ghost', i: 'x' })}</div>
      <div class="scroll">${art(r)}<h2>${nm(r)}</h2>${meta(r)}<p class="lead" style="font-size:16px">${desc(r)}</p></div>
      <div class="dock" style="position:relative">${add}${btn(t('share'), { i: 'share' })}${more}</div></section></div>`;
  }
  function itemDialog() {
    const r = R.ci1;
    const { add, more } = itemBody(r);
    if (N) return sheet(r, add, more);
    const behind = catalog();
    return `<div class="ov" style="height:900px">${behind}<div class="scrim"></div><section class="dlg" role="dialog" aria-label="${nm(r)}">${btn(t('close'), { sm: true, cls: 'ghost x', i: 'x' })}
      <article class="dossier">${art(r)}<div class="txt"><h2 style="font-size:var(--t-page)">${nm(r)}</h2>${meta(r)}<p class="lead">${desc(r)}</p>
      <div class="acts">${add}${btn(t('share'), { i: 'share' })}${btn(t('print'), { i: 'print' })}${more}</div></div></article></section></div>`;
  }

  /* ---------- roller ---------- */
  function rollAlt() {
    const rar = [
      E('Обычная', 'Common'),
      E('Необычная', 'Uncommon'),
      E('Редкая', 'Rare'),
      E('Очень редкая', 'Very rare'),
      E('Легендарная', 'Legendary')
    ];
    const res = [
      ['ci1', 'h'],
      ['hi3', 'f'],
      ['cc2', 'h'],
      ['hc3', 'f']
    ]
      .map(([id, d]) => {
        const card = scard(R[id]).replace(
          '<div class="kind">',
          `<div class="kind"><span class="badge ${d === 'h' ? 'hope' : 'fear'}">${d === 'h' ? E('Надежда', 'Hope') : E('Страх', 'Fear')}</span>`
        );
        return `<div class="dealt">${card}<div class="cardacts">${btn(t('addList'), { sm: true, i: 'plus' })}${btn(t('share'), { sm: true, i: 'share' })}${btn('', { sm: true, i: 'more', attr: `aria-label="${t('more')}"` })}</div></div>`;
      })
      .join('');
    const main = `<main class="wrap">${pageHead(E('Альтернативные таблицы', 'Alternate tables'))}<div class="two">
      <section class="panel ctrl"><span class="lbl">${t('rarity')}</span><div class="rar">${seg(
        rar,
        0,
        true
      )
        .replace('class="seg quiet np"', 'class="seg full"')
        .replace(
          /<svg class="fi [^]*?<\/svg>/,
          ''
        )}<span class="cap2">${E('Обычная: ранг 1-2', 'Common: tier 1-2')}</span></div>
        ${btn(E('Бросить Кости Дуальности', 'Roll the Duality Dice'), { cls: 'primary', i: 'die' })}
        <span class="lbl">${E('или введите свой бросок', 'or enter your own roll')}</span>
        <div class="nums2"><label><span><span class="dv h" style="width:22px;height:22px;font-size:12px;margin-right:6px">H</span>${E('Кость Надежды', 'Hope die')}</span><div class="num"><button>−</button><output>2</output><button>+</button></div></label>
          <label><span><span class="dv f" style="width:22px;height:22px;font-size:12px;margin-right:6px">F</span>${E('Кость Страха', 'Fear die')}</span><div class="num"><button>−</button><output>2</output><button>+</button></div></label></div>
        <span class="lbl">${t('type')}</span><div class="fl">${allChip()}${chip(t('items'))}${chip(t('cons'))}</div></section>
      <section><div class="crit" role="status"><div class="dd"><span class="dv h">2</span><span class="dv f">2</span></div><div><b>${E('Критический успех: дубль', 'Critical success: doubles')}</b><p>${E('Игрок берёт любую позицию этой редкости.', 'The player takes any entry of this rarity.')}</p></div>
          <div class="wb">${btn(E('Таблица этой редкости', 'This rarity table'), { sm: true, i: 'table' })}${btn(E('Поднять до Необычной', 'Raise to Uncommon'), { sm: true })}</div></div>
        <div class="reshead"><h2>${E('Выберите одно', 'Pick one')}</h2>${btn(E('Скопировать все четыре', 'Copy all four'), { sm: true, i: 'copy' })}</div><div class="hand2">${res}</div></section></div></main>`;
    return rpage({ job: 'roll', mode: 'alt' }, main);
  }
  function rollMwt() {
    const realms =
      LANG === 'en'
        ? ['Sporopolis', 'Wagerwood', "Warrin' Warrens", 'Godsvale', 'Hornet Hold', 'The Drome']
        : ['Спорополис', 'Лес Пари', 'Воющие Норы', 'Долина Богов', 'Оплот Шершней', 'Дром'];
    const r = R.mw9;
    const main = `<main class="wrap">${pageHead('Many Worlds Tavern')}<div class="two">
      <section class="panel ctrl"><span class="lbl">${E('Мир', 'Realm')}</span><div class="realm">${realms.map((x, i) => chip(x, i === 0)).join('')}</div>
        ${btn(E('Бросить d20', 'Roll d20'), { cls: 'primary', i: 'die' })}
        <span class="lbl">${E('или введите свой бросок', 'or enter your own roll')}</span><div class="own"><div class="num"><button>−</button><output>9</output><button>+</button></div><span class="cap2">${E('Результат d20,', 'd20 result,')}<br>1-20</span></div></section>
      <section><div class="reshead"><h2>${E('Спорополис · бросок 9', 'Sporopolis · roll 9')}</h2></div>
        <div class="hand2"><div class="dealt">${scard(r)}<div class="cardacts">${btn(t('addList'), { sm: true, i: 'plus' })}${btn(t('share'), { sm: true, i: 'share' })}${btn('', { sm: true, i: 'more', attr: `aria-label="${t('more')}"` })}</div></div></div></section></div></main>`;
    return rpage({ job: 'roll', mode: 'mwt' }, main);
  }

  /* ---------- search ---------- */
  function search(o = {}) {
    const q = o.q || '';
    const types = `<div class="fl" style="margin:10px 0 14px">${allChip()}${chip(t('items'))}${chip(t('cons'))}${chip(E('Оружие', 'Weapons'))}${chip(E('Броня', 'Armor'))}</div>`;
    let body = '';
    if (o.state === 'empty') {
      body = empty(
        E('Что ищем?', 'What are you looking for?'),
        E(
          'Ищет по названиям и описаниям всех книг и ваших предметов, по-русски и по-английски.',
          'Searches the names and text of every book and your items, in Russian and English.'
        ),
        '',
        `<div class="ex">${[E('зелье', 'potion'), E('меч', 'sword'), E('кольцо', 'ring'), '№ 12'].map((x) => `<button class="chip">${x}</button>`).join('')}</div>`
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
      const hits = ['cc1', 'cc2', 'w1'];
      body = `${hits.map((id) => row(R[id], { q: E('зелье', 'potion').slice(0, 5), no: true })).join('')}`;
    }
    /* First-screen layout (plan section 14, batch 7): the H1 and the count
       share one line; at 360 the type chips are one «Вид: все ▾» control
       beside the field. */
    const count = o.state ? '' : `<span class="count2">${E('Найдено: 3', '3 found')}</span>`;
    const kinds = [
      t('all'),
      t('items'),
      t('cons'),
      E('Оружие', 'Weapons'),
      E('Броня', 'Armor')
    ];
    const kindItem = (k, i) =>
      `<button class="mi">${i === 0 ? FI('check') : '<span class="sp"></span>'}${k}</button>`;
    const kindMenu = o.kindOpen
      ? `<div class="pop" style="top:calc(100% + 6px);right:0"><div class="mh">${E('Вид', 'Kind')}</div>${kinds.map(kindItem).join('')}</div>`
      : '';
    const kindAttr = `aria-expanded="${!!o.kindOpen}"`;
    const kind = `<span class="anchor n360">${btn(E('Вид: все', 'Kind: all'), { chev: true, attr: kindAttr })}${kindMenu}</span>`;
    const main = `<main class="wrap sfs"><div class="ph"><h1>${t('search')}</h1>${count}</div>
      <div class="sbar"><label class="field">${ic('search')}<input value="${q}" placeholder="${E('Название или описание, например «зелье»', 'A name or text, for example "potion"')}"></label>${kind}</div><div class="w1180">${types}</div>${body}</main>`;
    return rpage({ job: 'search' }, main);
  }

  /* ---------- lists ---------- */
  function listsIndex() {
    const thumbs = (ids) =>
      `<div class="thumbs">${ids.map((id) => art(R[id], 36)).join('')}</div>`;
    const card = (name, m, ids, sel) =>
      `<article class="panel lcard ${sel ? 'sel' : ''}">${ck(sel)}<h3>${name}</h3><div class="m">${m}</div>${ids.length ? thumbs(ids) : `<div class="m">${E('Пусто', 'Empty')}</div>`}<div class="foot3">${btn('', { sm: true, cls: 'ghost', i: 'more', attr: `aria-label="${t('more')}"` })}</div></article>`;
    const main = `<main class="wrap">${pageHead(t('menuLists'))}
      <section class="panel newl"><span class="lbl">${E('Новый список', 'New list')}</span><div class="rowf"><label class="field"><input placeholder="${E('Клад дракона', "Dragon's hoard")}"></label>${btn(E('Создать', 'Create'), { cls: 'primary' })}</div>
        <div>${btn(E('Импорт из файла', 'Import from a file'), { sm: true, i: 'plus' })}</div></section>
      <div class="acts2"><span class="count2" style="margin:0">${E('3 списка из 50', '3 lists of 50')}</span></div>
      <div class="selbar" style="position:relative;margin:0 0 12px"><b>${E('Выбрано: 2', '2 selected')}</b>${btn(E('Скачать JSON', 'Download JSON'), { sm: true })}${btn(E('Удалить', 'Delete'), { sm: true, cls: 'danger' })}${btn(E('Готово', 'Done'), { sm: true, cls: 'ghost' })}</div>
      <div class="cards3">${card(E('Пустой список', 'Empty list'), E('0 позиций · изменён 1 час назад', '0 entries · changed 1 hour ago'), [], true)}${card(t('listName'), E('10 позиций · изменён 3 дня назад', '10 entries · changed 3 days ago'), ['ci1', 'q1', 'q313', 'cc1', 'voa', 'q23'], false)}${card(E('Трофеи', 'Trophies'), E('2 позиции · изменён в прошлом месяце', '2 entries · changed last month'), ['q1', 'ci1'], true)}</div></main>`;
    return rpage({ job: null, signedIn: true }, main);
  }
  function listPage(o = {}) {
    const ents = [
      [R.ci1, 2, 150],
      [R.q1, 1, 0, 'pl'],
      [R.q313, 1],
      [R.cc1, 5, 20],
      [R.voa, 1, 0, 'gm'],
      [R.hbA, 1, 800]
    ];
    const noteFor = (k) =>
      k === 'pl'
        ? `<div class="rnote"><div class="nbox pl"><div class="nh">${ic('globe')}${t('forPlayers')}</div><p>${E('Последний в наличии.', 'The last one in stock.')}</p></div></div>`
        : k === 'gm'
          ? `<div class="rnote"><div class="nbox gm"><div class="nh">${ic('lock')}${t('gmOnly')}<span class="hint">${t('gmOnlyHint')}</span></div><p>${E('Проклят.', 'Cursed.')}</p></div></div>`
          : '';
    const editor = (k) =>
      k === 'pl' && o.editNote
        ? `<div class="rnote"><div class="seg quiet" style="margin-bottom:6px"><button aria-pressed="true">${ic('globe')} ${t('forPlayers')}</button><button aria-pressed="false">${ic('lock')} ${t('gmOnly')}</button></div><div class="ta" style="width:100%;border:1px solid var(--muted2);border-radius:var(--r-sm);background:var(--bg2);padding:9px 11px;min-height:60px">${E('Последний в наличии.', 'The last one in stock.')}</div></div>`
        : noteFor(k);
    const rows = ents
      .map(([r, q, p, n], i) => {
        const side = o.shared
          ? `${q > 1 ? `<span class="px">×${q}</span>` : ''}${p ? `<span class="px">${p} ${t('gp')}</span>` : ''}`
          : `<span class="box2">${q}</span><span class="box2 ${p ? '' : 'e'}">${p || '-'}</span>${btn(t('note'), { sm: true, i: 'note', cls: n === 'pl' && o.editNote ? 'on' : '', attr: `aria-pressed="${n === 'pl' && !!o.editNote}"` })}${btn('', { sm: true, i: 'more', attr: `aria-label="${t('more')}"` })}`;
        const note = o.shared && n === 'gm' && !o.gm ? '' : o.shared ? noteFor(n) : editor(n);
        return row(r, { side, note, noSrc: false });
      })
      .join('');
    const share = o.sharePanel
      ? `<section class="panel ibox"><h2>${t('share')}</h2>
        <div class="kv"><div class="k"><b>${E('Ссылка для игроков', 'Player link')}</b><span>${E('Без заметок мастера', 'Without GM notes')}</span></div><div class="wb"><code class="lnk" style="font:600 13px var(--mono)">loot.example/s/k3p9…</code>${btn(E('Скопировать', 'Copy'), { sm: true, i: 'copy' })}</div></div>
        <div class="kv"><div class="k"><b>${E('Ссылка для мастера', 'GM link')}</b><span>${E('С заметками «Только для мастера»', 'With the "GM only" notes')}</span></div><div class="wb"><code class="lnk" style="font:600 13px var(--mono)">loot.example/s/m7q2…</code>${btn(E('Скопировать', 'Copy'), { sm: true, i: 'copy' })}</div></div>
        <div>${btn(E('Закрыть доступ по ссылкам', 'Turn off both links'), { sm: true, cls: 'danger' })}</div></section>`
      : '';
    const head = o.shared
      ? `<h1>${t('listName')}</h1><div class="lead2" style="margin:4px 0 12px">${E('Список мастера · 6 позиций · обновлён 3 дня назад', "The GM's list · 6 entries · updated 3 days ago")}</div>
        <div class="acts2">${btn(E('Копия в мои списки', 'Copy to my lists'), { cls: 'primary', i: 'plus' })}${btn(t('print'), { i: 'print' })}${btn(t('select'), { i: 'check' })}<span class="count2">${E('6 из 6', '6 of 6')}</span></div>
        <div class="nbox pl"><div class="nh">${ic('globe')}${t('forPlayers')}</div><p>${t('note1')}</p></div>${o.gm ? `<div class="nbox gm"><div class="nh">${ic('lock')}${t('gmOnly')}<span class="hint">${t('gmOnlyHint')}</span></div><p>${t('note2')}</p></div>` : ''}`
      : '';
    if (o.shared) {
      const main = `<main class="wrap">${head}<div style="margin-top:12px">${rows}</div></main>`;
      return rpage({ job: null, signedIn: !!o.gm }, main);
    }
    const aside = `<aside class="panel laside"><h1>${t('listName')}</h1><div class="meta2">${t('listMeta')}</div>
        <div class="stack">${btn(t('share'), { i: 'share', cls: o.sharePanel ? 'on' : '', attr: `aria-expanded="${!!o.sharePanel}"` })}${btn(t('print'), { i: 'print' })}${btn(t('rollList'), { i: 'die' })}${btn(t('more'), { i: 'more' })}</div>
        <div class="seglbl">${t('prices')}${seg([t('asBook'), t('inCoins')], 1)}</div>
        <div class="nbox pl"><div class="nh">${ic('globe')}${t('forPlayers')}</div><p>${t('note1')}</p></div>
        <div class="nbox gm"><div class="nh">${ic('lock')}${t('gmOnly')}<span class="hint">${t('gmOnlyHint')}</span></div><p>${t('note2')}</p></div></aside>`;
    const main = `<main class="wrap"><div class="lgrid">${aside}<section class="lmain">${share}<div class="lhead2"><span class="lbl">${E('Кол-во · Цена', 'Qty · Price')}</span></div>${rows}${btn(t('addOwn'), { i: 'plus', attr: 'style="margin-top:12px"' })}</section></div></main>`;
    return rpage({ job: null, signedIn: true }, main);
  }
  /* Prices: stored in coins; «Как в книге» draws them in the book's units
     (handful 10, bag 100, chest 1000). */
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
    return parts.join(' ');
  }
  function shop(o = {}) {
    const mode = o.mode || 'coins';
    const noPrices = o.noPrices;
    const ents = [
      [R.ci1, 2, 150],
      [R.ci2, o.soldQty || 2, 750],
      [R.q1, 1, 0],
      [R.q313, 1, 0],
      [R.cc1, 5, 20],
      [R.voa, 1, 0],
      [R.hbA, 1, 800]
    ].map(([r, q, p]) => [r, q, noPrices ? 0 : p]);
    const sel = o.sel || [];
    const selMode = sel.length > 0 || o.selMode;
    const rows = ents
      .map(([r, q, p], i) => {
        const on = sel.includes(i);
        const priceCell =
          mode === 'book'
            ? `<span class="box2 wide ${p ? '' : 'e'}">${money(p, 'book')}</span>`
            : `<span class="box2 ${p ? '' : 'e'}">${p || '-'}</span>`;
        const side = `<span class="box2" aria-label="${t('qty')}">${q}</span>${priceCell}${btn('', { sm: true, i: 'more', attr: `aria-label="${t('more')}"` })}`;
        const take =
          o.take && o.take[0] === i
            ? `<div class="take">${E('Взять', 'Take')} <span class="box2 sm">${o.take[1]}</span> ${E('из', 'of')} ${q} = <b>${money(p * o.take[1], mode)}</b></div>`
            : '';
        const hit =
          o.rolled === i
            ? `<div class="rnote"><div class="nbox pl"><div class="nh">${ic('globe')}${t('forPlayers')}</div><p>${E('Звенит на всю округу.', 'It rings across the valley.')}</p></div></div>`
            : '';
        return row(r, { ck: selMode ? on : undefined, side, note: take + hit, noSrc: false });
      })
      .join('');
    const totalCoins = o.take
      ? ents[o.take[0]][2] * o.take[1]
      : sel.reduce((s, i) => s + ents[i][1] * ents[i][2], 0);
    const pieces = sel.reduce(
      (s, i) => s + (o.take && o.take[0] === i ? o.take[1] : ents[i][1]),
      0
    );
    const selLabel = E(
      sel.length === 1 ? 'Выбрана 1 позиция' : `Выбрано ${sel.length} позиции`,
      sel.length === 1 ? '1 entry selected' : `${sel.length} entries selected`
    );
    const bar = sel.length
      ? `<div class="selbar lbar" role="region" aria-label="${E('Выбранные', 'Selected')}"><b>${selLabel}${pieces !== sel.length ? ` · ${pieces} ${E('шт.', 'pcs')}` : ''}${totalCoins ? ` · ${E('Итого', 'Total')}: ${money(totalCoins, mode)}` : ''}</b>
        ${btn(E('Цены', 'Prices'), { sm: true, chev: true, cls: o.panel ? 'on' : '', attr: `aria-expanded="${!!o.panel}"` })}${btn(E('Скопировать текст', 'Copy text'), { sm: true, i: 'copy' })}${btn(`${E('Удалить', 'Delete')} (${sel.length})`, { sm: true, cls: 'danger' })}${btn(E('Готово', 'Done'), { sm: true, cls: 'ghost' })}</div>`
      : '';
    const guess = (r, band, sug) =>
      `<div class="kv"><div class="k"><b>${nm(r)}</b><span>${band}</span></div><div class="wb"><span class="box2 wide">${money(sug, mode)}</span></div></div>`;
    const panel = o.panel
      ? `<section class="panel ibox ppanel"><h2>${E('Цены выбранных', 'Prices of the selected')}</h2>
        ${o.panel === 'none' ? `<p class="hint3">${E('У выбранной позиции ещё нет цены. Ниже - цена по редкости из книги; её можно поправить до того, как проставить.', 'The selected entry has no price yet. Below is the price for its rarity from the book; you can change it before you set it.')}</p>` : `<div class="kv"><div class="k"><b>${E('Скидка или наценка', 'Discount or markup')}</b><span>${E('Меняет цену выбранных в процентах', 'Changes the selected prices by a percentage')}</span></div><div class="wb"><span class="box2">-20</span><span>%</span>${btn(`${E('Применить', 'Apply')}: ${money(1200, mode)}`, { sm: true })}</div></div>`}
        ${guess(o.panel === 'none' ? R.ci1 : R.ci2, E('Обычная · в книге 1-2 мешка', 'Common · 1-2 bags in the book'), o.panel === 'none' ? 150 : 750)}
        <div class="wb">${btn(E('Проставить эту цену', 'Set this price'), { cls: 'primary', sm: true })}${o.panel === 'none' ? '' : btn(E('Убрать цену (1)', 'Remove the price (1)'), { sm: true, cls: 'danger' })}${btn(t('close'), { sm: true, cls: 'ghost' })}</div></section>`
      : '';
    const roll = o.roll
      ? `<section class="panel ibox"><h2>${t('rollList')}</h2><div class="wb">${btn(E('Бросить d7', 'Roll d7'), { cls: 'primary', i: 'die', sm: true })}<span class="count2">${E('или введите номер позиции', 'or enter an entry number')}</span><div class="num" style="height:38px"><button>−</button><output>2</output><button>+</button></div>${btn(t('reset'), { sm: true, cls: 'ghost' })}</div>
        <div class="rollres">${scard(R.ci2).replace(/<span class="badge rno">[^<]*<\/span>/, `<span class="badge rno">${E('Позиция', 'Entry')} 2</span>`)}<div class="rr"><b>${E('Выпало: 2 - Пронзительная Свирель, 2 шт.', 'Rolled: 2 - Piper Whistle, 2 pcs')}, ${money(750, mode)} ${E('за штуку', 'each')}</b><div class="nbox pl"><div class="nh">${ic('globe')}${t('forPlayers')}</div><p>${E('Звенит на всю округу.', 'It rings across the valley.')}</p></div><div class="nbox gm"><div class="nh">${ic('lock')}${t('gmOnly')}<span class="hint">${t('gmOnlyHint')}</span></div><p>${E('Свистит и под водой.', 'It whistles under water too.')}</p></div>${btn(E('Показать в списке', 'Show in the list'), { sm: true })}</div></div></section>`
      : '';
    const req = (
      head,
      lines,
      total
    ) => `<div class="req"><div class="count2">${head}</div><table class="rqt"><thead><tr><th>${E('Позиция', 'Entry')}</th><th>${E('Было', 'Was')}</th><th>${E('Возьмут', 'Taken')}</th><th>${E('Станет', 'Becomes')}</th><th>${t('price')}</th></tr></thead><tbody>${lines.map(([r, was, take, p, warn]) => `<tr><td>${nm(r)}${warn ? `<div class="warn2">${warn}</div>` : ''}</td><td data-l="${E('Было', 'Was')}">${was}</td><td data-l="${E('Возьмут', 'Taken')}">${take}</td><td data-l="${E('Станет', 'Becomes')}">${Math.max(0, was - take)}</td><td data-l="${t('price')}">${p ? money(p, mode) : E('без цены', 'no price')}</td></tr>`).join('')}</tbody></table>
      <div class="wb"><b>${total}</b><span style="margin-left:auto"></span>${btn(E('Принять', 'Accept'), { sm: true, cls: 'primary' })}${btn(E('Отклонить', 'Decline'), { sm: true })}</div></div>`;
    const requests = o.requests
      ? `<section class="panel ibox"><h2>${E('Новое в списке: 2 запроса', 'New on the list: 2 requests')}</h2>
        ${req(
          E(
            'По ссылке для мастера · только что · истечёт через 60 минут',
            'From the GM link · just now · expires in 60 minutes'
          ),
          [
            [
              R.cc1,
              5,
              5,
              180,
              E('Просили 9, в списке 5: возьмут 5', 'Asked for 9, the list has 5: 5 are taken')
            ],
            [R.q1, 1, 1, 0]
          ],
          E('Итого: 180 зол. · 1 позиция без цены', 'Total: 180 gp · 1 entry without a price')
        )}
        ${req(
          E(
            'По ссылке для игроков · только что · истечёт через 60 минут',
            'From the player link · just now · expires in 60 minutes'
          ),
          [
            [R.ci1, 2, 1, 150],
            [R.cc1, 5, 3, 60]
          ],
          E('Итого: 210 зол.', 'Total: 210 gp')
        )}</section>`
      : '';
    const toast = o.toast
      ? `<div class="toast2" role="status">${o.toast}${btn(E('Вернуть', 'Undo'), { sm: true })}</div>`
      : '';
    const aside = `<aside class="panel laside"><h1>${t('listName')}</h1><div class="meta2">${E('7 позиций из 100 · сохранено', '7 entries of 100 · saved')}</div>
        <div class="stack">${btn(t('share'), { i: 'share' })}${btn(t('print'), { i: 'print' })}${btn(t('rollList'), { i: 'die', cls: o.roll ? 'on' : '', attr: `aria-expanded="${!!o.roll}"` })}${btn(t('more'), { i: 'more' })}</div>
        <div class="seglbl">${E('Цены:', 'Prices:')}${seg([t('asBook'), t('inCoins')], mode === 'book' ? 0 : 1)}</div>
        <div class="pex">${E('Например', 'For example')}: ${money(750, mode)}</div></aside>`;
    const tools = selMode
      ? ''
      : `<div class="acts2">${btn(t('select'), { sm: true, i: 'check' })}</div>`;
    const main = `<main class="wrap"><div class="lgrid">${aside}<section class="lmain">${requests}${roll}${tools}${bar}${panel}<div class="lhead2"><span class="lbl">${E('Кол-во · Цена', 'Qty · Price')}</span></div>${rows}${btn(t('addOwn'), { i: 'plus', attr: 'style="margin-top:12px"' })}</section></div></main>`;
    const pg = rpage({ job: null, signedIn: true }, main);
    return toast
      ? `<div class="ov" style="height:${N ? 1400 : 900}px">${pg}${toast}</div>`
      : pg;
  }

  function listsImport() {
    const main = `<main class="wrap">${pageHead(t('menuLists'))}
      <section class="panel ibox"><h2>${E('Импорт списков из файла', 'Import lists from a file')}</h2>
        <div class="wb">${btn(E('Выбрать файл', 'Choose a file'), { sm: true })}<span class="count2">unknown-id.json</span><a class="lnk" href="#" style="margin-left:auto">${E('Формат файла', 'File format')}</a></div>
        <div class="sum"><b>${E('Будет добавлено: 2 списка, 3 позиции.', 'To add: 2 lists, 3 entries.')}</b> ${E('Пропущено 2 позиции.', '2 entries skipped.')}</div>
        <div class="kv"><div class="k"><b>${t('listName')}</b><span>${E('3 позиции · такой список уже есть: появится второй', '3 entries · a list with this name exists: a second one is added')}</span></div>
          <details class="more2" open><summary>${E('Пропущено: 2', 'Skipped: 2')}</summary><ul><li>${E('Позиция 4: такого предмета нет в данных', 'Entry 4: no such record in the data')}</li><li>${E('Позиция 5: «Первоклассный Спальный Мешок» уже есть в позиции 1', 'Entry 5: "Premium Bedroll" is already entry 1')}</li></ul></details></div>
        <div class="kv"><div class="k"><b>${E('Пустой список', 'Empty list')}</b><span>${E('без позиций · такой список уже есть: появится второй', 'no entries · a list with this name exists: a second one is added')}</span></div><div></div></div>
        <div class="wb">${btn(E('Импортировать 2 списка', 'Import 2 lists'), { cls: 'primary' })}${btn(E('Отмена', 'Cancel'))}</div></section></main>`;
    return rpage({ job: null, signedIn: true }, main);
  }

  /* ---------- homebrew ---------- */
  function hbShell(tab, body, o = {}) {
    const tabs = [
      ['items', E('Предметы', 'Items'), 4],
      ['sources', E('Источники', 'Sources'), 2],
      ['sets', E('Комплекты', 'Sets'), 1],
      ['rules', E('Карты правил', 'Rule cards'), 1]
    ];
    const nav = `<nav class="tabs2" aria-label="${t('myItems')}">${tabs.map(([k, l, n]) => `<a href="#" class="${k === tab ? 'on' : ''}" ${k === tab ? 'aria-current="page"' : ''}>${l}<span class="n">${n}</span></a>`).join('')}</nav>`;
    const main = `<main class="wrap">${pageHead(t('myItems'))}${o.importPanel || ''}${nav}${body}</main>`;
    return rpage({ job: null, signedIn: true }, main);
  }
  const hbActs = (newLabel, count) =>
    `<div class="acts2">${btn(newLabel, { cls: 'primary', i: 'plus' })}${btn(E('Импорт из файла', 'Import from a file'))}${btn(t('select'), { i: 'check' })}<span class="count2">${count}</span></div>`;
  function hbItems(o = {}) {
    const body = `${hbActs(E('Новый предмет', 'New item'), E('4 предмета из 100', '4 items of 100'))}
      <div class="grp2">${E('Мастерская Ольхи · Холодное оружие', "Olkha's workshop · Melee weapons")}<span class="n">1</span></div>${row(R.hbA, { noSrc: true })}
      <div class="grp2">${E('Хоумбрю', 'Homebrew')}<span class="n">3</span></div>${[R.hbR, R.hbB, R.hbC].map((r) => row(r, { noSrc: true })).join('')}`;
    return hbShell('items', body, o);
  }
  const more = () => btn(t('more'), { sm: true, i: 'more', chev: true });
  function hbSources() {
    const body = `${hbActs(E('Новый источник', 'New source'), E('2 источника из 20', '2 sources of 20'))}
      <div class="srow"><b><a href="#" style="color:var(--txt)">${E('Мастерская Ольхи', "Olkha's workshop")}</a></b><span class="m">${E('1 предмет · разделов: 2 из 30', '1 item · sections: 2 of 30')}</span>${btn(E('Разделы', 'Sections'), { sm: true })}${more()}</div>
      <div class="srow"><b><a href="#" style="color:var(--txt)">${E('Хоумбрю', 'Homebrew')}</a></b><span class="m">${E('3 предмета · источник по умолчанию', '3 items · the default source')}</span>${more()}</div>`;
    return hbShell('sources', body);
  }
  function hbSets() {
    const body = `${hbActs(E('Новый комплект', 'New set'), E('1 комплект · карт: 2 из 100', '1 set · cards: 2 of 100'))}
      <div class="srow"><b>${E('Комплект Ольхи', "Olkha's set")}</b><span class="m">${E('0 предметов · Мастерская Ольхи', "0 items · Olkha's workshop")}</span>${btn(E('Изменить', 'Edit'), { sm: true })}${more()}</div>
      ${empty(E('В комплекте нет предметов', 'The set has no items'), E('Откройте предмет и выберите комплект в поле «Комплект».', 'Open an item and pick the set in its "Set" field.'), btn(E('Открыть предметы', 'Open the items'), { sm: true }))}`;
    return hbShell('sets', body);
  }
  function hbRules() {
    const body = `${hbActs(E('Новая карта правил', 'New rule card'), E('1 карта правил · карт: 2 из 100', '1 rule card · cards: 2 of 100'))}
      <div class="srow"><b>${E('Клеймо Ольхи', "Olkha's brand")}</b><span class="m">${E('0 предметов ссылаются на неё', '0 items refer to it')}</span>${btn(E('Изменить', 'Edit'), { sm: true })}${more()}</div>`;
    return hbShell('rules', body);
  }
  function hbImport() {
    const panel = `<section class="panel ibox"><h2>${E('Импорт предметов из файла', 'Import items from a file')}</h2>
      <div class="wb">${btn(E('Выбрать файл', 'Choose a file'), { sm: true })}<span class="count2">example-edited.json</span><a class="lnk" href="#" style="margin-left:auto">${E('Формат файла', 'File format')}</a></div>
      <div class="sum"><b>${E('В файле: 5 предметов, 1 источник, 2 раздела, 2 карты.', 'In the file: 5 items, 1 source, 2 sections, 2 cards.')}</b></div>
      <div class="kv"><div class="k"><b>${E('Мастерская Ольхи, второе издание', "Olkha's workshop, second edition")}</b><span>${E('4 предмета · совпадает с вашим источником', '4 items · matches your source')}</span></div><label class="field sel"><span>${E('В «Мастерская Ольхи»', 'Into "Olkha\'s workshop"')}</span>${ic('chev')}</label></div>
      <div class="kv"><div class="k"><b>${E('Без источника', 'No source')}</b><span>${E('1 предмет', '1 item')}</span></div><label class="field sel"><span>${E('В «Хоумбрю»', 'Into "Homebrew"')}</span>${ic('chev')}</label></div>
      <div class="kv"><div class="k"><b>${E('Если уже есть:', 'If it already exists:')}</b><span>${E('1 источник и 2 предмета совпали', '1 source and 2 items match')}</span></div>${seg([E('Пропустить', 'Skip'), E('Обновить', 'Update')], 0)}</div>
      <div class="wb">${btn(E('Импортировать 5 предметов', 'Import 5 items'), { cls: 'primary' })}${btn(E('Отмена', 'Cancel'))}</div></section>`;
    return hbItems({ importPanel: panel });
  }
  function editorState(kind) {
    let ed = window.EDITOR('B');
    if (kind === 'conflict') {
      ed = ed
        .replace(
          '<section class="es">',
          `<div class="alertc" role="alert"><b>${E('Предмет изменили на другом устройстве', 'The item changed on another device')}</b><p>${E('Ваши правки не сохранены. Посмотрите новую версию, прежде чем сохранять.', 'Your edits are not saved. Look at the new version before you save.')}</p>
        <div class="wb">${btn(E('Показать новую версию', 'Show the new version'), { sm: true, cls: 'primary' })}${btn(E('Заменить её моей', 'Replace it with mine'), { sm: true, cls: 'danger' })}</div></div><section class="es">`
        )
        .replace(
          '<button class="btn primary">',
          '<button class="btn" disabled style="opacity:.55">'
        );
      return rpage({ job: null, signedIn: true }, ed);
    }
    const dlg = `<section class="dlg sm" role="dialog" aria-label="${E('Обрезать картинку', 'Crop the picture')}"><h2>${E('Обрезать картинку', 'Crop the picture')}</h2>
      <div class="crop" style="margin:10px 0 12px"><img src="${window.M.IMG}ci1.webp" alt=""><div class="fr"><i class="hd a"></i><i class="hd b"></i><i class="hd c"></i><i class="hd d"></i></div></div>
      <div class="zoom"><button class="btn sm" aria-label="${E('Меньше', 'Zoom out')}">−</button><div class="tr" role="slider" aria-label="${E('Масштаб', 'Zoom')}" aria-valuenow="130"><i></i></div><button class="btn sm" aria-label="${E('Больше', 'Zoom in')}">+</button></div>
      <div class="wb" style="margin-top:14px">${btn(E('Готово', 'Done'), { cls: 'primary' })}${btn(E('Отмена', 'Cancel'))}</div></section>`;
    return `<div class="ov" style="height:${N ? 820 : 900}px">${rpage({ job: null, signedIn: true }, ed)}<div class="scrim"></div>${dlg}</div>`;
  }
  function hItem() {
    const r = R.hbS;
    const rel = `<div class="rel"><span>← ${E('Получается из', 'Made from')}: <a href="#">${E('Скатка путника', "Traveler's bedroll")}</a> <span class="badge hb">${E('Хоумбрю', 'Homebrew')}</span></span><span>→ ${E('Улучшается до', 'Upgrades to')}: <a href="#">${E('Скатка стража', "Warden's bedroll")}</a> <span class="badge hb">${E('Хоумбрю', 'Homebrew')}</span></span></div>`;
    const main = `<main class="wrap"><article class="dossier">${art(r)}<div class="txt"><h1>${nm(r)}</h1>
      <div class="meta">${badge(r)}<span class="badge hb">${E('Хоумбрю', 'Homebrew')}</span><span>${E('Предмет другого игрока · обновлён 11 часов назад', "Another player's item · updated 11 hours ago")}</span></div>
      <p class="lead">${L(r.d)}</p>${rel}
      <div class="acts">${btn(t('addList'), { cls: 'primary', i: 'plus', chev: true })}${btn(t('keepCopy'), { i: 'plus' })}${btn(t('share'), { i: 'share' })}${btn(t('print'), { i: 'print' })}${btn(t('more'), { i: 'more', chev: true })}</div></div></article></main>`;
    return rpage({ job: null, signedIn: true }, main);
  }

  /* ---------- account ---------- */
  function account(o = {}) {
    const sel = (v) =>
      `<label class="field sel" style="min-width:200px"><span>${v}</span>${ic('chev')}</label>`;
    const cb = (on, l) => `<span class="cb"><i>${on ? ic('check') : ''}</i>${l}</span>`;
    const disp = `<section class="panel setp"><h2>${E('Отображение', 'Display')}</h2>
      <div class="setr"><span>${E('Язык', 'Language')}</span>${seg(['RU', 'EN'], LANG === 'en' ? 1 : 0)}</div>
      <div class="setr"><span>${E('Раздел при запуске', 'Start section')}</span>${sel(t('std'))}</div>
      <div class="setr"><span>${E('Вид таблиц', 'Table view')}</span>${seg([E('Список', 'List'), E('Сетка', 'Grid')], 0)}</div>
      <div class="setr"><span>${E('Печать', 'Print')}</span><div class="wb">${seg([E('Цветная', 'Color'), E('Чёрно-белая', 'Black and white')], 1)}${cb(true, E('Компактный лист', 'Compact sheet'))}</div></div>
      <div class="setr"><span>${E('Беру из чужого списка', "I take from someone's list")}</span>${sel(E('Спросить, сообщить ли владельцу', 'Ask whether to tell the owner'))}</div></section>`;
    const sign = `<section class="panel setp"><h2>${E('Вход', 'Sign-in')}</h2>
      <div class="setr"><span><b>Google</b> · gm1@example.test <span class="badge">${E('сейчас', 'now')}</span></span>${btn(E('Отключить', 'Disconnect'), { sm: true })}</div>
      <div class="setr"><span><b>Discord</b> · gm1.discord@example.test</span>${btn(E('Отключить', 'Disconnect'), { sm: true })}</div></section>`;
    const data = `<section class="panel setp"><h2>${E('Ваши данные', 'Your data')}</h2><p style="margin:0;font-size:15px;color:var(--muted)">${E('Списки и свои предметы одним архивом ZIP, без картинок.', 'Your lists and items in one ZIP, without pictures.')}</p><div>${btn(E('Скачать мои данные (ZIP)', 'Download my data (ZIP)'), { i: 'copy' })}</div></section>`;
    const out = `<section class="panel setp"><h2>${E('Выход', 'Sign-out')}</h2><div class="wb">${btn(t('signOut'))}${btn(E('Выйти на всех устройствах', 'Sign out on every device'))}</div></section>`;
    const del = `<section class="panel setp"><h2>${E('Удаление аккаунта', 'Delete the account')}</h2><div>${btn(E('Удалить аккаунт', 'Delete the account'), { cls: 'danger' })}</div></section>`;
    const main = `<main class="wrap">${pageHead(t('account'), { pin: false, help: false })}<div class="acc"><div class="col">${disp}${data}</div><div class="col">${sign}${out}${del}</div></div></main>`;
    const pg = rpage({ job: null, signedIn: true, here: true }, main);
    if (!o.confirm) return pg;
    const dlg = `<section class="dlg sm" role="alertdialog" aria-label="${E('Удалить аккаунт?', 'Delete the account?')}"><h2>${E('Удалить аккаунт навсегда?', 'Delete the account forever?')}</h2>
      <p style="margin:6px 0 8px;color:var(--muted)">${E('Будут удалены:', 'This deletes:')}</p><ul style="margin:0 0 12px;padding-left:20px"><li>${E('3 списка и 12 позиций в них', '3 lists and their 12 entries')}</li><li>${E('4 своих предмета, 2 источника, 1 комплект, 1 карта правил', '4 own items, 2 sources, 1 set, 1 rule card')}</li><li>${E('2 ссылки на списки: игроки их больше не откроют', '2 list links: players can no longer open them')}</li></ul>
      <label style="display:grid;gap:6px;font-size:var(--t-small);font-weight:600">${E('Введите «удалить», чтобы подтвердить', 'Type "delete" to confirm')}<span class="field"><input value="${E('удалить', 'delete')}"></span></label>
      <div class="wb" style="margin-top:14px">${btn(E('Удалить навсегда', 'Delete forever'), { cls: 'danger-fill' })}${btn(E('Отмена', 'Cancel'))}${btn(E('Сначала скачать данные', 'Download my data first'), { cls: 'ghost' })}</div></section>`;
    return `<div class="ov" style="height:${N ? 820 : 900}px">${pg}<div class="scrim"></div>${dlg}</div>`;
  }

  /* ---------- print preview (the sheet is a crop of the S1 capture) ---------- */
  /* First-screen layout (plan section 14, batch 7): at 360 «Назад» and the H1
     share a row, the primary and «Настройки листа ▾» the next; the lead and
     the background-graphics hint go under the sheet. 1180 keeps its row. */
  function printPrev(o = {}) {
    const lead = E('2 карточки · 1 лист A4 · 63×88 мм', '2 cards · 1 A4 sheet · 63×88 mm');
    const hint = E(
      'В окне печати включите «Фоновые изображения».',
      'In the print window, turn on "Background graphics".'
    );
    const colour = seg([E('Цветная', 'Color'), E('Чёрно-белая', 'Black and white')], 0);
    const size = seg([E('Обычный лист', 'Standard sheet'), E('Компактный', 'Compact')], 0);
    const link = btn(E('Ссылка на набор', 'Link to this set'), { i: 'link' });
    const setMenu = o.setOpen
      ? `<div class="pop psets" style="top:calc(100% + 6px);right:0"><div class="mh">${E('Настройки листа', 'Sheet settings')}</div><div class="mview">${colour}</div><div class="mview">${size}</div><hr><button class="mi">${ic('link')}${E('Ссылка на набор', 'Link to this set')}</button></div>`
      : '';
    const setAttr = `aria-expanded="${!!o.setOpen}"`;
    const set360 = `<span class="anchor n360">${btn(E('Настройки листа', 'Sheet settings'), { chev: true, attr: setAttr })}${setMenu}</span>`;
    const main = `<main class="wrap pfs"><div class="phead"><a class="back" href="#">← ${E('Назад', 'Back')}</a><h1>${E('Печать карточек', 'Print cards')}</h1></div><div class="lead2 w1180" style="margin:4px 0 12px">${lead}</div>
      <div class="prow">${btn(E('Напечатать', 'Print'), { cls: 'primary', i: 'print' })}<span class="w1180">${colour}</span><span class="w1180">${size}</span><span class="w1180">${link}</span>${set360}</div>
      <div class="count2 w1180">${hint}</div>
      <img class="sheetimg" src="../shared/print-sheet-twocards.png" alt="${E('Лист A4 с двумя карточками', 'An A4 sheet with two cards')}"><div class="n360 punder"><div class="lead2">${lead}</div><div class="count2">${hint}</div></div></main>`;
    return rpage({ job: null, signedIn: true }, main);
  }

  /* ---------- the two patterns ---------- */
  function patternEmpty() {
    const main = `<main class="wrap"><h1>${E('Пустое состояние: один образец', 'Empty state: one pattern')}</h1>
      ${cap('в таблице: ничего не найдено', 'in a table: nothing found')}${empty(E('Ничего не найдено', 'Nothing found'), E('Нет оружия с «кракен» среди фильтров: Ранг 1.', 'No weapon has "kraken" with these filters: Tier 1.'), btn(E('Сбросить фильтры', 'Reset the filters'), { cls: 'primary' }), '', 'kindWeapon')}
      ${cap('в списке: позиций нет', 'in a list: no entries')}${empty(E('Список пуст', 'The list is empty'), E('Добавьте предмет кнопкой «В список» в таблице или в броске.', 'Add an item with "Add to list" in a table or a roll.'), btn(E('Открыть таблицы', 'Open the tables'), { cls: 'primary' }))}
      ${cap('в «Моих предметах»: вкладка пуста', 'in My items: an empty tab')}${empty(E('Своих предметов пока нет', 'No items of your own yet'), E('Свой предмет ищется вместе с книгами и попадает в списки.', 'Your own item is found with the books and goes into lists.'), btn(E('Новый предмет', 'New item'), { cls: 'primary', i: 'plus' }))}</main>`;
    return rpage({ job: null, signedIn: true }, main);
  }
  function errorFor(which) {
    const P = {
      item: [
        E('Предмета по этому адресу нет', 'No item at this address'),
        E(
          'Адрес <code>/i/nope</code> не ведёт ни к одному предмету. Ссылка могла устареть или быть набрана с ошибкой.',
          'The address <code>/en/i/nope</code> leads to no item. The link may be old or mistyped.'
        ),
        btn(E('Найти предмет', 'Find the item'), { cls: 'primary', i: 'search' }) +
          btn(E('Открыть таблицы', 'Open the tables'))
      ],
      list: [
        E('Список не открывается', 'This list does not open'),
        E(
          'Его удалили, или он сохранён в другом аккаунте. Войдите в тот аккаунт, где вы его создали.',
          'It was deleted, or it is in another account. Sign in to the account where you made it.'
        ),
        btn(t('signIn'), { cls: 'primary', i: 'user' }) +
          btn(E('Открыть таблицы', 'Open the tables'))
      ],
      print: [
        E('Набор для печати не найден', 'No print set at this address'),
        E(
          'Ссылка на набор неполная: в ней нет ни одной карточки.',
          'The set link is incomplete: it holds no card.'
        ),
        btn(E('Открыть таблицы', 'Open the tables'), { cls: 'primary' })
      ]
    }[which];
    return rpage(
      { job: null, signedIn: which !== 'list' },
      `<main class="wrap">${errPage(...P)}</main>`
    );
  }
  function shell(o = {}) {
    return `${cap(o.ru, o.en)}<div class="frame" style="min-height:${o.h || 0}px">${window.RX.rheader({ static: true, ...o.opts })}${o.body || ''}</div>`;
  }

  const STATES = {
    'shell-account-menu': () =>
      shell({
        ru: 'вошли · Таблицы · меню аккаунта открыто',
        en: 'signed in · Tables · account menu open',
        opts: { job: 'tables', signedIn: true, menuOpen: true },
        h: 360
      }),
    'shell-signed-out': () =>
      shell({
        ru: 'не вошли · Бросок · Обычные правила',
        en: 'signed out · Roll · Standard rules',
        opts: { job: 'roll', mode: 'std' },
        body: `<main class="wrap" style="padding:18px 0 10px">${pageHead(t('std'))}</main>`
      }),
    'catalog-filters': () => catalog({ sheet: true }),
    'catalog-filtered': () => catalog({ filtered: true }),
    'catalog-selection': () => catalog({ sel: true }),
    'catalog-nothing': () => catalog({ nothing: true }),
    'catalog-grid': () => catalog({ grid: true }),
    'item-dialog': () => itemDialog(),
    'item-listmenu': () => itemPage({ listOpen: true }),
    'item-save-signedout': () => itemPage({ moreOpen: true, signedOut: true }),
    'item-nope': () => errorFor('item'),
    'roller-alt-crit': () => rollAlt(),
    'roller-mwt': () => rollMwt(),
    'roller-supmenu': () => roller({ supOpen: true }),
    'search-empty': () => search({ state: 'empty' }),
    'search-results': () => search({ q: E('зелье', 'potion') }),
    'search-nothing': () => search({ q: E('кракенн', 'krakken'), state: 'nothing' }),
    'lists-index': () => listsIndex(),
    'list-note': () => listPage({ editNote: true }),
    'list-share': () => listPage({ sharePanel: true }),
    'list-prices': () => shop({ mode: 'book' }),
    'list-prices-panel': () => shop({ sel: [1], panel: 'set' }),
    'list-prices-none': () => shop({ sel: [0], panel: 'none', noPrices: true }),
    'list-picked': () => shop({ sel: [1], take: [1, 1], mode: 'book' }),
    'list-sold': () =>
      shop({
        soldQty: 1,
        toast: E(
          'Продано и убрано: Пронзительная Свирель, 1 шт.',
          'Sold and removed: Piper Whistle, 1 pc'
        )
      }),
    'list-roll': () => shop({ roll: true, rolled: 1 }),
    'list-selected': () => shop({ sel: [0, 4] }),
    'list-requests': () => shop({ requests: true }),
    'lists-import': () => listsImport(),
    'lists-nope': () => errorFor('list'),
    'shared-player': () => listPage({ shared: true }),
    'shared-gm': () => listPage({ shared: true, gm: true }),
    'homebrew-items': () => hbItems(),
    'homebrew-sources': () => hbSources(),
    'homebrew-sets': () => hbSets(),
    'homebrew-rules': () => hbRules(),
    'homebrew-import': () => hbImport(),
    'editor-crop': () => editorState('crop'),
    'editor-conflict': () => editorState('conflict'),
    'h-item': () => hItem(),
    'account-settings': () => account(),
    'account-delete': () => account({ confirm: true }),
    'print-preview': () => printPrev(),
    'pattern-empty': () => patternEmpty(),
    'pattern-error': () => errorFor('print')
  };
  window.RSTATES = Object.keys(STATES);
  window.RA = {
    E,
    N,
    S,
    cap,
    allChip,
    chip,
    btn,
    seg,
    ck,
    none,
    hl,
    row,
    empty,
    errPage,
    filterGroups,
    catalog,
    meta,
    itemBody,
    itemPage,
    sheet,
    itemDialog,
    rollAlt,
    rollMwt,
    search,
    hItem,
    account,
    printPrev,
    patternEmpty,
    errorFor,
    shell,
    STATES,
    rpage,
    roller
  };
  /* A batch file sets window.XS[<state>] to add or replace a state. */
  window.RSTATE = () => {
    const f = (window.XS || {})[S] || STATES[S];
    return f ? f() : `<main class="wrap"><h1>No state "${S}"</h1></main>`;
  };
})();
