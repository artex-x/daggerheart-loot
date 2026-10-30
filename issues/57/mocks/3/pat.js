/* Round 5 shared patterns for the mocks 2, 3, 4, 5, 7 and P (task 57,
   reviews/mocks-2.md). Mock 3 owns them. It loads after states-a.js and before
   the mock's own file, and:
   - draws the catalog with the list head (R0-3, R3-1, R3-3, N3-1, N3-2) as
     PAT.catalog, so mock 3, mock 4's dialog background and mock 7 share it;
   - draws the one selection bar (B3-1, R0-2) as PAT.selbar;
   - draws the own-items switch (R3-3) as PAT.sw;
   - after the page is drawn, makes every «···» control the one labelled form
     (R0-1) and puts the long name on the alternate-tables chip (B5-2). */
(function () {
  const M = window.M;
  const { t, R, nm, statLine, feat, ic, art, srcName } = M;
  const { E, FI } = window.UA;
  const RA = window.RA;
  const { btn, seg, ck, chip, hl, row, empty, filterGroups } = RA;
  const N = innerWidth <= 760;

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
  const L = (p) => (window.M.LANG === 'en' ? p[1] : p[0]);
  const DASH =
    '<svg class="fi" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11h14v2H5z"/></svg>';

  /* A labelled switch (role="switch"): neutral, never gold. */
  const sw = (label, on = true, cls = '') =>
    `<label class="sw ${cls}"><input type="checkbox" role="switch" ${on ? 'checked' : ''}><span class="trk"><i></i></span><span>${label}</span></label>`;

  /* The one selection bar (R0-2, owner-accepted shape): «Все» (a tri-state box,
     empty, dash or check, its label always visible), «Выбрано: N» plus the page's
     facts (`extra`), the page's actions (`acts`; a page with more than three folds
     the rare ones into «··· Ещё»), «Снять выделение» last. At 360 the head (box,
     summary, clear) takes its own row and the bar is pinned to the bottom of the
     screen. With no tick the actions are off and «Снять выделение» stays on: it
     leaves the selection mode and brings «Выбрать» back. */
  function selbar({ n, extra = '', acts, all = 'mixed', note = '' }) {
    const zero = n === 0;
    const st = zero ? 'false' : all;
    const box = `<span class="ck2 tri ${st === 'true' ? 'on' : st === 'mixed' ? 'on mixed' : ''}">${st === 'true' ? FI('check') : st === 'mixed' ? DASH : ''}</span>`;
    const allBtn = `<button class="allbtn" role="checkbox" aria-checked="${st}" aria-label="${E('Выбрать все', 'Select all')}">${box}<span>${E('Все', 'All')}</span></button>`;
    const summary = `<b class="sbn">${E(`Выбрано: ${n}`, `${n} selected`)}${extra}${note ? `<small>${note}</small>` : ''}</b>`;
    const clear = btn(E('Снять выделение', 'Clear the selection'), {
      sm: true,
      cls: 'ghost clr'
    });
    const off = (h) =>
      zero ? h.replace(/<button class="btn/g, '<button disabled class="btn') : h;
    return `<div class="selbar sb2" role="region" aria-label="${E('Выбранные', 'Selected')}"><div class="sb-top">${allBtn}${summary}${clear}</div><div class="sb-acts">${off(acts)}</div></div>`;
  }
  /* The actions of the tables, search and «Мои предметы» bars: add to a list,
     print, copy (FEATURES.md "Print"). */
  const tableActs = () =>
    `${btn(t('addList'), { sm: true, i: 'plus' })}${btn(t('print'), { sm: true, i: 'print' })}${btn(E('Скопировать текст', 'Copy text'), { sm: true, i: 'copy' })}`;

  const srcCell = (r) =>
    r.hb
      ? ` <span class="badge hb">${E('Хоумбрю', 'Homebrew')}</span>`
      : r.src !== 'Core'
        ? `<span class="src"> ${srcName(r)}</span>`
        : '';

  /* The catalog with the list head. Options: grid, nothing, q, filtered, sel
     (selection mode on), ticked (indexes), sheet, pickerOpen, moreOpen, own
     (signed in with own items: the switch shows), ownSheet, headOpts,
     afterHead, underToolbar. */
  function catalog(o = {}) {
    const total = 458;
    const qMatch = (id) => new RegExp(E('меч', 'sword'), 'i').test(nm(R[id]));
    const base = ['q1', 'q2', 'q4', 'q10', 'q16', 'q20', 'q23', 'q26'];
    const ids = o.nothing
      ? []
      : o.q
        ? base.filter(qMatch)
        : o.filtered
          ? ['q1', 'q4', 'q10', 'q26']
          : o.own
            ? ['q1', 'q2', 'q4']
            : base;
    const ownIds = o.own ? ['hbA'] : [];
    const filt = !!(o.filtered || o.nothing);
    const nf = filt ? 2 : 0;
    const count = (n) => E(`Показано ${n} из ${total}`, `${n} of ${total} shown`);
    const shown = o.nothing
      ? count(0)
      : o.q
        ? count(ids.length)
        : o.filtered
          ? count(ids.length)
          : '';
    const chosen = E('Ранг 1, Вплотную', 'Tier 1, Melee');
    const selMode = !!o.sel;
    const ticked = o.ticked || [];
    const sheetFilterN = o.filtered ? ids.length : total;

    const groups = ['gCore', 'gHnf', 'gAlt', 'gSup', 'gEq', 'gOther']
      .map(
        (k) =>
          `<a href="#" class="chip" ${k === 'gEq' ? 'aria-current="page"' : ''}>${t(k)}</a>`
      )
      .join('');
    const flink = btn(E('Ссылка на фильтры', 'Link to these filters'), {
      sm: true,
      cls: 'ghost',
      i: 'link'
    });
    const secth = (title) =>
      `<div class="secth"><h2>${title}</h2>${btn(E('Ссылка на раздел', 'Link to this section'), { sm: true, cls: 'ghost', i: 'link' })}</div>`;
    const trs = (list, off = 0) =>
      list
        .map((id, i) => {
          const r = R[id];
          const f = feat(r);
          const on = ticked.includes(off + i);
          return `<tr class="${on ? 'selr' : ''}">${selMode ? `<td style="width:34px">${ck(on)}</td>` : ''}<td><div class="nm">${art(r, 48)}<div><b>${hl(nm(r), o.q ? E('меч', 'sword') : '')}</b>${srcCell(r)}${f ? `<div class="feat">${f}</div>` : ''}</div></div></td>
        <td class="n">${L(TR[r.tr])}</td><td class="n">${L(RG[r.rg])}</td><td class="d">${r.dmg} ${E(r.dt === 'mag' ? 'маг' : 'физ', r.dt === 'mag' ? 'mag' : 'phy')}</td><td class="n">${r.bu === 2 ? t('twoH') : t('oneH')}</td></tr>`;
        })
        .join('');
    const rowsOf = (list, off = 0) =>
      list
        .slice(0, 6)
        .map((id, i) =>
          row(R[id], {
            noSrc: R[id].src === 'Core',
            noKind: true,
            q: o.q ? E('меч', 'sword') : '',
            ck: selMode ? ticked.includes(off + i) : undefined
          })
        )
        .join('');
    const section = (title, list, off = 0) =>
      `${secth(title)}<table class="ct"><thead><tr>${selMode ? '<th></th>' : ''}<th>${t('name')}</th><th>${t('trait')}</th><th>${t('range')}</th><th>${t('dmg')}</th><th>${t('burden')}</th></tr></thead><tbody>${trs(list, off)}</tbody></table><div class="rows360">${rowsOf(list, off)}</div>`;
    const tile = (id) =>
      `<div class="gcard">${art(R[id])}<div class="gt"><b>${nm(R[id])}</b><div class="stat">${statLine(R[id], R[id].hb ? { tier: true } : {})}</div></div></div>`;

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
      /* N3-2: the grid keeps the section head and its link */
      body = `${secth(t('tier1'))}<div class="ggrid">${ids.map(tile).join('')}</div>`;
    } else {
      body =
        section(t('tier1'), ids) +
        (ownIds.length ? section(E('Ранг 2', 'Tier 2'), ownIds, ids.length) : '');
    }
    const acts = tableActs();
    const bar = selMode
      ? selbar({ n: ticked.length, acts, all: ticked.length === ids.length ? 'true' : 'mixed' })
      : '';

    const view = seg([E('Список', 'List'), E('Сетка', 'Grid')], o.grid ? 1 : 0);
    const head = window.SHELL.pageHead(t('tables'), o.headOpts || {});
    const sub = `<a href="#" class="on" aria-current="page">${t('tWeapon')}</a><a href="#">${t('tSecondary')}</a><a href="#">${t('tArmor')}</a>`;
    const moreMenu = o.moreOpen
      ? `<div class="pop" style="top:calc(100% + 6px);right:0"><button class="mi">${ic('link')}${t('tableLink')}</button><hr><button class="mi">${ic('home')}${E('Открывать при запуске', 'Open on start')}</button><button class="mi">${ic('help')}${E('Об этих данных', 'About this data')}</button></div>`
      : '';
    const more360 = `<span class="anchor n360">${btn(t('more'), { sm: true, i: 'more', attr: `aria-expanded="${!!o.moreOpen}"` })}${moreMenu}</span>`;
    /* R0-3: the h1 is «Таблицы» at every width; at 360 it is read, not drawn, and
       the picker is a button that names the table it opens. */
    const picker = `<h1 class="h1sr n360">${t('tables')}</h1><div class="pickrow n360"><span class="picker"><button class="pick" aria-haspopup="dialog" aria-label="${E('Таблица', 'Table')}: ${t('tWeapon')}" aria-expanded="${!!o.pickerOpen}"><span>${t('tWeapon')}</span>${ic('chev')}</button></span><span class="n360 pv">${view}</span>${more360}</div>`;
    const ownSw = o.own
      ? `<span class="w1180">${sw(E('Свои предметы', 'Own items'), true)}</span>`
      : '';
    const cline =
      shown && N
        ? `<p class="cline2 n360">${filt ? `<span class="vals">${chosen}</span>` : ''}<span class="cnt">${shown}</span></p>`
        : '';
    const main = `<main class="wrap fs">${picker}<div class="headrow w1180">${head}<nav class="groups">${groups}</nav></div>${o.afterHead || ''}
      <nav class="sub w1180">${sub}</nav>
      <div class="cat"><aside class="panel fside" aria-label="${t('filters')}"><div class="fh"><b>${t('filters')}${nf ? ` · ${nf}` : ''}</b>${nf ? `<span class="wb">${btn(t('reset'), { sm: true, cls: 'ghost' })}${flink}</span>` : ''}</div>${filterGroups({ melee: filt, tier1: filt })}</aside>
      <div><div class="fsbar"><label class="field">${ic('search')}<input placeholder="${E('Поиск', 'Search')}" value="${o.nothing ? E('кракен', 'kraken') : o.q ? E('меч', 'sword') : ''}"></label>${btn(nf ? `${t('filters')} · ${nf}` : t('filters'), { sm: true, cls: `fbtn ${nf ? 'on' : ''}` })}${shown ? `<span class="count w1180">${shown}</span>` : ''}<span class="w1180">${view}</span>${ownSw}<span class="w1180">${btn(t('tableLink'), { sm: true, i: 'link' })}</span>${selMode ? '' : btn(t('select'), { sm: true, cls: 'selbtn' })}</div>${cline}${o.underToolbar || ''}
        <div class="${selMode ? 'selon' : ''}">${body}</div>${bar}</div></div></main>`;
    const pg = RA.rpage({ job: 'tables', signedIn: !!o.own }, main);

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
      /* R3-3: at 360 the own-items switch sits first in the filter sheet */
      const ownRow = o.own
        ? `<div class="fgrp">${sw(E('Свои предметы', 'Own items'), true, 'row')}</div>`
        : '';
      return `<div class="ov">${pg}<div class="scrim"></div><section class="sheet" role="dialog" aria-label="${t('filters')}"><div class="grab"></div>
        <div class="sh" style="justify-content:space-between;padding:2px 16px 8px"><b style="font-size:18px">${t('filters')}${nf ? ` · ${nf}` : ''}</b><span class="wb">${nf ? flink : ''}${btn(t('close'), { sm: true, cls: 'ghost', i: 'x' })}</span></div>
        <div class="fbody">${ownRow}${filterGroups({ melee: filt, tier1: filt })}</div><div class="dock2">${btn(t('reset'))}${btn(E(`Показать ${sheetFilterN}`, `Show ${sheetFilterN}`), { cls: 'primary' })}</div></section></div>`;
    }
    return pg;
  }

  /* R0-1 and B5-2, after the page is drawn: every «···» control is the one
     labelled form («··· Ещё», no chevron), and the alternate-tables chip
     carries the page heading's words. */
  function post() {
    const more = t('more');
    for (const b of document.querySelectorAll('button')) {
      const txt = b.textContent.trim();
      const hasDots = !!b.querySelector('svg circle[cx="5"]');
      if (hasDots && !txt) {
        b.insertAdjacentText('beforeend', more);
        b.removeAttribute('aria-label');
      } else if (txt === more) {
        for (const c of b.querySelectorAll('svg.chev')) c.remove();
      }
    }
    for (const c of document.querySelectorAll('.modes .chip')) {
      const label = c.textContent.trim();
      if (label === 'Альт. таблицы') c.textContent = 'Альтернативные таблицы';
      if (label === 'Alt. tables') c.textContent = 'Alternate tables';
    }
  }
  post();
  addEventListener('DOMContentLoaded', post);

  window.PAT = { sw, selbar, tableActs, catalog, post, DASH, TR, RG, L };
})();
