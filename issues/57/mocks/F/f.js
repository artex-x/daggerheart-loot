/* Feedback round (owner, 2026-11-03): F1 and F2 on the list pages. Reuses mock 9's
   classes and U snippets. Records are real data.js rows and img/ files are real. */
(function () {
  const { t, R, nm, ic, art } = window.M;
  const U = window.U;
  const { E, N, S, P, btn, ck, chip, allChip, tags, sub, rpage, ov, sheet360, icx, money } = U;
  const { selBar, selState, anchor } = U;
  document.body.dataset.hdr = P.get('hdr') || 'sticky';

  /* [record, qty, price in coins, player note, GM note, GM-only entry] */
  const SHOP = [
    [R.ci1, 2, 150],
    [R.ci2, 2, 750],
    [R.q1, 1, 0, E('Последний в наличии.', 'The last one in stock.')],
    [R.q313, 1, 300],
    [R.cc1, 5, 20],
    [
      R.voa,
      1,
      0,
      '',
      E(
        'Проклят: тянет карту Страха каждую ночь.',
        'Cursed: it draws a Fear card every night.'
      ),
      true
    ],
    [R.hbA, 1, 800],
    [R.cc2, 3, 25],
    [R.cc3, 2, 25],
    [R.hi1, 1, 60],
    [R.hi2, 1, 90],
    [R.ci5, 1, 1200],
    [R.q26, 1, 400],
    [R.ci3, 1, 240]
  ];
  const INV = SHOP.map((e) => [e[0], e[1], 0, e[3], e[4], e[5]]);
  const BOOK = SHOP.map((e, i) =>
    i === 0 ? [e[0], e[1], 7050] : i === 4 ? [e[0], e[1], 7550] : e
  );
  const SEVEN = SHOP.slice(0, 7);

  const KIND = (r) =>
    ({
      item: ['k-item', E('Предмет', 'Item')],
      cons: ['k-cons', E('Расходник', 'Consumable')],
      weapon: ['k-weapon', E('Оружие', 'Weapon')],
      armor: ['k-armor', E('Броня', 'Armor')]
    })[r.kind];
  const kindB = (r) => `<span class="badge ${KIND(r)[0]}">${KIND(r)[1]}</span>`;
  const srcOf = (r) => (r.hb ? E('Хоумбрю', 'Homebrew') : window.M.srcName(r));
  const noteBox = (kind, text) =>
    `<div class="nbox ${kind === 'pl' ? 'pl' : 'gm'}"><div class="nh">${ic(kind === 'pl' ? 'globe' : 'lock')}${kind === 'pl' ? t('forPlayers') : t('gmOnly')}</div><p>${text}</p></div>`;

  /* The one clamped line of C1b. A weapon leads with what a buyer compares (damage,
     range), so the cut falls on the least useful part; an item shows its effect. */
  function effect(r) {
    if (r.kind !== 'weapon' && r.kind !== 'armor')
      return String(window.M.desc(r)).replace(/<[^>]+>/g, ' ');
    const si = [...String(window.M.statLine(r, {})).matchAll(/class="si">([^<]*)/g)].map(
      (m) => m[1]
    );
    if (r.kind === 'armor' || si.length < 5) return si.join(' · ');
    return [si[3], si[2], si[4], si[1]].join(' · ');
  }

  /* The compact row: the body is one disclosure and ends with its chevron; the quantity
     stands apart at the far right, a live field on the owner's page, text on /s/. */
  function crow(e, i, o = {}) {
    const [r, q, p, pn, gn, gmo] = e;
    const mode = o.mode || 'coins';
    const selMode = o.sel !== undefined;
    const on = selMode && o.sel.includes(i);
    const open = o.open === i;
    const owner = !o.shared;
    const no = o.nos ? o.nos[i] : i + 1;
    const meta = `${kindB(r)}${p ? `<span class="pr">${money(p, mode)}</span>` : `<span>${srcOf(r)}</span>`}${pn || (gn && owner) ? icx('note') : ''}${gmo && owner ? ic('lock') : ''}`;
    const fx = o.fx ? `<span class="cfx">${effect(r)}</span>` : '';
    const body = `<button class="cbody" aria-expanded="${open}"><span class="cart">${art(r, 44)}<span class="cno">${no}</span></span><span class="ctext"><span class="cname">${nm(r)}</span><span class="cmeta">${meta}</span></span><span class="cchev">${ic('chev')}</span>${fx}</button>`;
    const qty =
      owner && !selMode
        ? `<input class="cqf" value="${q}" inputmode="numeric" aria-label="${t('qty')}: ${nm(r)}">`
        : q > 1
          ? `<span class="cqv">×${q}</span>`
          : '';
    const notes = `${pn ? `<div class="rnote">${noteBox('pl', pn)}</div>` : ''}${gn && owner ? `<div class="rnote">${noteBox('gm', gn)}</div>` : ''}`;
    const fields = owner
      ? `<div class="cfields"><div class="cf pos"><span>№</span><span class="box2 sm" aria-label="${E('Позиция в списке', 'Position in the list')}">${no}</span></div><div class="cf"><span>${t('price')}, ${t('gp')}</span><span class="box2 ${p ? '' : 'e'}">${p || '-'}</span></div>${btn(t('note'), { sm: true, i: 'note' })}${btn(t('more'), { sm: true, i: 'more' })}</div>`
      : `<div class="cfields">${btn(E('Открыть карточку', 'Open the card'), { sm: true, i: 'open' })}</div>`;
    const full = open
      ? `<div class="cfull"><div class="tg">${tags(r, { gmOnly: gmo && owner })}</div>${sub(r)}${notes}${fields}</div>`
      : '';
    return `<div class="crow ${owner && !selMode ? '' : 'ro'} ${selMode ? 'ck' : ''} ${on ? 'sel' : ''} ${gmo && owner ? 'gmo' : ''} ${open ? 'open' : ''}">${selMode ? ck(on) : ''}${body}${qty}${full}</div>`;
  }

  /* Mock 9's row, for today's plan and the 1180 px frames. */
  function lrow(e, i, o = {}) {
    const [r, q, p, pn, gn, gmo] = e;
    const no = o.nos ? o.nos[i] : i + 1;
    const lead = `<div class="posf">${o.locked ? '' : ic('grip')}<span class="pn" aria-label="${E('Позиция в списке', 'Position in the list')}">${no}</span></div>`;
    const noteBtn = btn(
      `${t('note')}${pn || gn ? ' <span class="dotf on" aria-hidden="true"></span>' : ''}`,
      { sm: true, i: 'note' }
    );
    const note =
      pn || gn
        ? `<div class="rnote">${pn ? noteBox('pl', pn) : ''}${gn ? noteBox('gm', gn) : ''}</div>`
        : '';
    return `<div class="lrow">${lead}${art(r, 48)}<div style="min-width:0"><b class="n">${nm(r)}</b><div class="tg">${tags(r, { gmOnly: gmo })}</div>${sub(r)}</div><div class="pos360"><span class="lbl360">№</span><span class="box2 sm">${no}</span></div><div class="line360"><div class="q"><span class="lbl360">${t('qty')}</span><span class="box2">${q}</span></div><div class="p"><span class="lbl360">${t('price')}, ${t('gp')}</span><span class="box2 ${p ? '' : 'e'}">${p || '-'}</span></div><div class="ra">${noteBtn}${anchor(btn(t('more'), { sm: true, i: 'more' }), '')}</div></div>${note}</div>`;
  }

  /* C2: mock 9's row with the text cut to one line and one control line. */
  function clrow(e, i) {
    const [r, q, p] = e;
    const line =
      r.kind === 'weapon' || r.kind === 'armor' ? window.M.statLine(r, {}) : window.M.desc(r);
    return `<div class="clrow">${art(r, 44)}<div style="min-width:0"><b class="n">${nm(r)}</b><div class="tg">${kindB(r)}<span class="src">${srcOf(r)}</span></div><div class="one">${String(line).replace(/<[^>]+>/g, ' ')}</div></div><div class="clline"><span class="box2 sm">${i + 1}</span><span class="box2">${q}</span><span class="box2 pr ${p ? '' : 'e'}">${p || '-'}</span>${btn(t('note'), { sm: true, i: 'note' })}${btn(t('more'), { sm: true, i: 'more' })}</div></div>`;
  }

  /* C3: a stored mode, «Инвентарь» or «Лавка»: one line, no picture. */
  function trow(e, i, o) {
    const [r, q, p] = e;
    return `<div class="trow"><span>${nm(r)}</span>${o.shop ? `<span class="pr">${p ? money(p, 'coins') : '-'}</span>` : ''}<input class="cqf" value="${q}" inputmode="numeric" aria-label="${t('qty')}: ${nm(r)}"></div>`;
  }

  function filterRows(o) {
    return `<div class="fgrp"><span class="lbl">${E('Тип', 'Type')}</span><div class="opts">${allChip(!o.filtered)}${chip(E('Предметы', 'Items'))}${chip(E('Расходники', 'Consumables'))}${chip(E('Оружие', 'Weapons'), !!o.filtered)}${chip(E('Броня', 'Armor'))}</div></div>
      <div class="fgrp"><span class="lbl">${E('Источник', 'Source')}</span><div class="opts">${allChip()}${chip('Core')}${chip('Hope &amp; Fear')}${chip('Vault of Ages')}${chip(E('Хоумбрю', 'Homebrew'))}</div></div>
      <div class="fgrp"><span class="lbl">${E('Ранг', 'Tier')}</span><div class="opts">${allChip()}${chip('1')}${chip('2')}</div></div>`;
  }

  function findRow(o, withSelect) {
    const q = o.q ? `value="${o.q}"` : '';
    const clear = o.q
      ? `<button class="sclear" aria-label="${E('Очистить поиск', 'Clear the search')}">${icx('x')}</button>`
      : '';
    return `<div class="lfind"><label class="field">${ic('search')}<input type="search" placeholder="${E('Поиск', 'Search')}" ${q}>${clear}</label>${btn(o.filtered ? `${t('filters')} · 1` : t('filters'), { cls: o.filtered ? 'lit' : '', sm: true })}${withSelect ? btn(t('select'), { sm: true }) : ''}</div>`;
  }
  function aside(o, n, shown) {
    const find = n >= 8;
    const meta =
      shown !== n
        ? E(`Показано ${shown} из ${n} · сохранено`, `${shown} of ${n} shown · saved`)
        : E(`${n} позиций из 100 · сохранено`, `${n} entries of 100 · saved`);
    const menu = o.menu
      ? U.pop(
          U.mi(t('share'), { i: 'share' }) +
            U.mi(t('print'), { i: 'print' }) +
            U.mi(t('rollList'), { i: 'die' }) +
            '<hr>' +
            U.mi(E('Цены: монетами', 'Prices: in coins'), { i: 'tune' }) +
            U.mi(t('copyText'), { i: 'copy' }) +
            U.mi(E('Скачать JSON', 'Download JSON'), { i: 'download' }) +
            '<hr>' +
            U.mi(E('Удалить список', 'Delete the list'), { i: 'trash', cls: 'danger' }),
          { r: true, w: 250 }
        )
      : '';
    const row3 = !o.keepAct
      ? ''
      : `<div class="row3 m-only">${btn(t('share'), { i: 'share' })}${btn(t('print'), { i: 'print' })}${btn(t('rollList'), { i: 'die' })}</div>`;
    return `<aside class="panel laside"><div class="ah"><h1 class="h1in"><input value="${o.name || t('listName')}" aria-label="${E('Название списка', 'List name')}"></h1>${find || o.sel ? '' : btn(t('select'), { sm: true, cls: 'm-only' })}${anchor(btn(t('more'), { sm: true, i: 'more', attr: `aria-expanded="${!!o.menu}"` }), menu)}</div><div class="meta2">${meta}<span class="m-only" style="display:inline"> · <button class="lnkb" aria-expanded="false">${E('Заметки', 'Notes')}${ic('chev')}</button></span></div>${row3}
      <div class="acts3 d-only">${btn(t('share'), { i: 'share' })}${btn(t('print'), { i: 'print' })}${btn(t('rollList'), { i: 'die', cls: 'span2' })}</div></aside>`;
  }

  function listPage(o = {}) {
    const all = o.ents || SHOP;
    let ents = all;
    let nos = o.nos;
    if (o.filtered) {
      const kept = all.map((e, i) => [e, i]).filter(([e]) => e[0].kind === 'weapon');
      ents = kept.map(([e]) => e);
      nos = kept.map(([, i]) => i + 1);
    }
    if (o.q && o.q !== 'zz') {
      const kept = all.map((e, i) => [e, i]).filter(([e]) => e[0].kind === 'cons');
      ents = kept.map(([e]) => e);
      nos = kept.map(([, i]) => i + 1);
    }
    const n = all.length;
    const rowsFor = (e, i) => {
      if (!N) return lrow(e, i, { ...o, nos, locked: o.filtered || !!o.q });
      if (o.kind === 'full') return lrow(e, i, { ...o, nos });
      if (o.kind === 'clamp') return clrow(e, i);
      if (o.kind === 'table') return trow(e, i, o);
      return crow(e, i, { ...o, nos });
    };
    const rows = ents.map(rowsFor).join('');
    const sel = o.sel;
    const bar = sel
      ? selBar({
          state: selState(sel.length, ents.length),
          head: `${E(`Выбрано: ${sel.length}`, `${sel.length} selected`)} · ${E('Итого', 'Total')}: ${money(400, 'coins')}`,
          acts:
            btn(E('Цены', 'Prices'), { sm: true, chev: true }) +
            btn(t('copyText'), { sm: true, i: 'copy' }) +
            btn(`${E('Удалить', 'Delete')} (${sel.length})`, { sm: true, cls: 'danger' })
        })
      : '';
    const find = n >= 8 ? findRow(o, !sel) : '';
    const modePick =
      o.kind === 'table'
        ? `<div class="modepick">${U.seg([E('Инвентарь', 'Inventory'), E('Лавка', 'Shop')], o.shop ? 1 : 0)}</div>`
        : '';
    const tools =
      !N && n < 8
        ? `<div class="acts2 d-only" style="justify-content:flex-end">${btn(t('select'), { sm: true })}</div>`
        : '';
    const lhead = !N
      ? `<div class="lhead3" aria-hidden="true"><span>№</span><span></span><span>${t('name')}</span><span>${t('qty')}</span><span>${t('price')}, ${t('gp')}</span><span></span></div>`
      : '';
    const empty =
      o.q === 'zz'
        ? U.empty(
            E('Ничего не найдено', 'Nothing found'),
            E('Запрос не совпал ни с одной позицией.', 'The search matched no entry.'),
            btn(E('Сбросить всё', 'Reset all'))
          )
        : '';
    const list =
      empty ||
      `${lhead}<div class="${N && !o.kind ? 'crows' : 'lrows'} ${sel ? 'padbar' : ''}">${rows}${bar}</div>${btn(t('addOwn'), { i: 'plus', attr: 'style="margin-top:12px"' })}`;
    const main = `<main class="wrap"><div class="lgrid">${aside(o, n, ents.length)}<section class="lmain">${modePick}${find}${tools}${list}</section></div></main>`;
    return rpage({ job: null, signedIn: true, here: true }, main);
  }

  function sharedPage(o = {}) {
    const ents = (o.ents || SHOP).filter((e) => !e[5]);
    const n = ents.length;
    const sel = o.sel;
    const find = n >= 8 ? findRow(o, !sel) : '';
    const bar = sel
      ? selBar({
          state: selState(sel.length, n),
          head: `${E(`Выбрано: ${sel.length}`, `${sel.length} selected`)} · 3 ${E('шт.', 'pcs')}`,
          acts:
            btn(t('addList'), { sm: true, i: 'plus' }) +
            btn(t('print'), { sm: true, i: 'print' }) +
            btn(t('copyText'), { sm: true, i: 'copy' }),
          line: btn(E('Сообщить владельцу', 'Notify the owner'), { sm: true })
        })
      : '';
    const nlink = `<button class="lnkb" aria-expanded="false">${E('Заметка', 'Note')}${ic('chev')}</button>`;
    const head = `<div class="shhead"><h1 class="clamp">${t('listName')}</h1><div class="lead2">${E(`${n} позиций`, `${n} entries`)} · ${E('обновлён 3 дня назад', 'updated 3 days ago')} · ${nlink}</div></div>
      <div class="acts2 one">${btn(E('Сохранить себе', 'Save to my lists'), { cls: 'primary', i: 'plus', sm: N })}${btn(t('print'), { i: 'print', cls: 'd-only', sm: N })}</div>`;
    const rowsHtml = ents
      .map((e, i) =>
        N
          ? crow(e, i, { ...o, shared: true })
          : U.row(e[0], {
              side: `<div class="qp"><span class="qf">${t('qty')}<span class="qv">${e[1]}</span></span><span class="qf">${t('price')}<span class="qv">${e[2] ? money(e[2], 'coins') : '-'}</span></span></div>`,
              ck: sel ? sel.includes(i) : undefined
            }).replace('class="rl', 'class="rl srow2')
      )
      .join('');
    const main = `<main class="wrap">${head}${find}<div class="${N ? 'crows' : 'shlist'}" style="margin-top:8px">${rowsHtml}${bar}</div></main>`;
    return rpage({ job: null, signedIn: !!sel }, main);
  }

  const sheetFor = (o) =>
    sheet360(
      o.filtered ? `${t('filters')} · 1` : t('filters'),
      filterRows(o),
      btn(t('reset')) + btn(E('Показать 3', 'Show 3'), { cls: 'primary' })
    );

  const STATES = {
    plan9: () => listPage({ kind: 'full', keepAct: true }),
    c1: () => listPage(),
    'c1-seven': () => listPage({ ents: SEVEN }),
    'c1-inv': () => listPage({ ents: INV }),
    'c1-book': () => listPage({ ents: BOOK, mode: 'book' }),
    c1b: () => listPage({ fx: true }),
    'c1b-inv': () => listPage({ fx: true, ents: INV }),
    'c1b-shared': () => sharedPage({ fx: true }),
    'c1-open': () => listPage({ open: 1 }),
    'c1-note': () => listPage({ open: 2 }),
    'c1-select': () => listPage({ sel: [0, 4] }),
    'c1-shared': () => sharedPage(),
    'c1-shared-open': () => sharedPage({ open: 2 }),
    'c1-shared-select': () => sharedPage({ sel: [0, 1] }),
    c2: () => listPage({ kind: 'clamp' }),
    'c3-inv': () => listPage({ kind: 'table', ents: INV }),
    'c3-shop': () => listPage({ kind: 'table', shop: true }),
    'd-keepact': () => listPage({ keepAct: true }),
    'd-more': () => listPage({ menu: true }),
    'd-filtered': () => listPage({ filtered: true }),
    'd-query': () => listPage({ q: E('зелье', 'potion') }),
    'd-empty': () => listPage({ q: 'zz' }),
    'd-sheet': () => ov(listPage({ filtered: true }), sheetFor({ filtered: true }), innerHeight)
  };
  window.RSTATES = Object.keys(STATES);
  window.RSTATE = () => {
    U.pinned = '';
    let h = (STATES[S] || STATES.c1)();
    if (U.pinned)
      h = `<div class="ov" style="height:${innerHeight}px">${h}<div class="pinbar">${U.pinned}</div></div>`;
    U.pinned = '';
    return U.fix(h);
  };
})();
