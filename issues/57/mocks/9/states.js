/* Batch 9 mock: the account list page (/lists/<uuid>) and the shared list page
   (/s/<token>). state.html?s=<state>&lang=en; the list and the owner questions
   are in index.html. */
(function () {
  const { t, L, R, nm, ic, art, LANG } = window.M;
  const U = window.U;
  const { E, N, S, btn, seg, ck, chip, allChip, tags, sub, empty, errPage, loadErr, pop, mi, anchor, rpage, ov, sheet360, icx, money } = U;
  const scard = window.CX.scard;

  /* The list: [record, qty, price in coins, player note, GM note, GM-only entry] */
  const ENTS = [
    [R.ci1, 2, 150],
    [R.ci2, 2, 750],
    [R.q1, 1, 0, E('Последний в наличии.', 'The last one in stock.')],
    [R.q313, 1, 0],
    [R.cc1, 5, 20],
    [R.voa, 1, 0, '', E('Проклят: тянет карту Страха каждую ночь.', 'Cursed: it draws a Fear card every night.'), true],
    [R.hbA, 1, 800]
  ];
  const noteBox = (kind, text, o = {}) =>
    kind === 'pl'
      ? `<div class="nbox pl"><div class="nh">${ic('globe')}${t('forPlayers')}${o.edit ? btn(E('Изменить', 'Edit'), { sm: true, cls: 'ghost nedb', i: 'edit' }) : ''}</div><p>${text}</p></div>`
      : `<div class="nbox gm">${o.edit ? `<div class="nh">${ic('lock')}${t('gmOnly')}${btn(E('Изменить', 'Edit'), { sm: true, cls: 'ghost nedb', i: 'edit' })}</div><div class="ncap" style="margin-top:-4px">${t('gmOnlyHint')}</div>` : `<div class="nh">${ic('lock')}${t('gmOnly')}<span class="hint">${t('gmOnlyHint')}</span></div>`}<p>${text}</p></div>`;

  /* One account-list row. */
  function lrow(e, i, o = {}) {
    const [r, q, p, pn, gn, gmo] = e;
    const mode = o.mode || 'coins';
    const selMode = o.sel !== undefined;
    const on = selMode && o.sel.includes(i);
    const lead = selMode
      ? ck(on)
      : `<div class="posf">${ic('grip')}<span class="pn" aria-label="${E('Позиция в списке', 'Position in the list')}">${i + 1}</span></div>`;
    const price =
      mode === 'book'
        ? `<span class="box2 wide ${p ? '' : 'e'}">${money(p, 'book')}</span>`
        : `<span class="box2 ${p ? '' : 'e'}">${p ? `${p}` : '-'}</span>`;
    const hasNote = !!(pn || gn);
    const noteBtn = btn(`${t('note')}${hasNote ? ' <span class="dotf on" aria-hidden="true"></span>' : ''}`, {
      sm: true,
      i: 'note',
      cls: o.noteOpen === i ? 'on' : '',
      attr: `aria-expanded="${o.noteOpen === i}"`
    });
    const rowMenu =
      o.rowMenu === i
        ? pop(
            mi(gmo ? E('Показать игрокам', 'Show to players') : E('Скрыть от игроков', 'Hide from players'), { i: 'eyeoff' }) +
              mi(E('Открыть карточку', 'Open the card'), { i: 'open' }) +
              '<hr>' +
              mi(E('Убрать из списка', 'Remove from the list'), { i: 'trash', cls: 'danger' }),
            { r: true, w: 230 }
          )
        : '';
    const more = anchor(
      btn('', { sm: true, cls: 'ico', i: 'more', attr: `aria-label="${t('more')}: ${nm(r)}" aria-expanded="${o.rowMenu === i}"` }),
      rowMenu
    );
    const take =
      o.take && o.take[0] === i
        ? `<div class="take">${E('Взять', 'Take')} <span class="box2 sm">${o.take[1]}</span> ${E('из', 'of')} ${q} = <b>${money(p * o.take[1], mode)}</b></div>`
        : '';
    let note = '';
    if (o.legacy && o.legacy[0] === i) {
      note = o.legacy[1];
    } else if (o.noteOpen === i) {
      const gm = o.noteKind === 'gm';
      note = `<div class="rnote"><div class="nedit"><div class="nsw">${seg([`${ic('globe')}${t('forPlayers')} <span class="dotf ${pn ? 'on' : ''}"></span>`, `${ic('lock')}${t('gmOnly')} <span class="dotf ${gn ? 'on' : ''}"></span>`], gm ? 1 : 0)}<span class="ncap">${gm ? t('gmOnlyHint') : E('Видна по ссылке для игроков', "Shows on the players' link")}</span></div>
        <div class="ta2 ${gm ? 'gm' : ''} focus">${(gm ? gn : pn) || ''}</div><div class="wb">${btn(E('Готово', 'Done'), { sm: true })}${btn(E('Очистить', 'Clear'), { sm: true, cls: 'ghost' })}</div></div></div>`;
    } else if (pn || gn) {
      note = `<div class="rnote">${pn ? noteBox('pl', pn) : ''}${gn ? noteBox('gm', gn) : ''}</div>`;
    }
    if (o.rolled === i)
      note += `<div class="rnote"><div class="nbox pl"><div class="nh">${ic('die')}${E('Выпало при броске по списку', 'Rolled on this list')}</div><p>${E('Звенит на всю округу.', 'It rings across the valley.')}</p></div></div>`;
    const drop = o.drop ? (o.drop[0] === i ? 'drop-after' : o.drop[1] === i ? 'drop-before' : '') : '';
    const dragging = o.drag === i ? 'dragging' : '';
    return `<div class="lrow ${selMode ? 'ck' : ''} ${on ? 'sel' : ''} ${drop} ${dragging}">${lead}${art(r, 48)}
      <div style="min-width:0"><b class="n">${nm(r)}</b><div class="tg">${tags(r, { gmOnly: gmo })}</div>${sub(r)}${take}</div>
      ${selMode ? '' : `<div class="pos360"><span class="lbl360">№</span><span class="box2 sm">${i + 1}</span></div>`}<div class="line360"><div class="q"><span class="lbl360">${t('qty')}</span><span class="box2" aria-label="${t('qty')}">${q}</span></div><div class="p"><span class="lbl360">${t('price')}${mode === 'coins' ? `, ${t('gp')}` : ''}</span>${price}</div><div class="ra">${noteBtn}${more}</div></div>${note}</div>`;
  }

  function listExtras(o = {}) {
    const mode = o.mode || 'coins';
    const prices = `<div class="prices"><div class="seglbl">${E('Цены:', 'Prices:')}${seg([t('asBook'), t('inCoins')], mode === 'book' ? 0 : 1)}</div><div class="pex">${E('Например', 'For example')}: ${money(750, mode)}</div></div>`;
    return `${o.noPricesBlock ? '' : prices}${o.notes === false ? '' : `<div class="nset">${noteBox('pl', t('note1'), { edit: true })}${noteBox('gm', t('note2'), { edit: true })}</div>`}${o.asideExtra || ''}`;
  }
  function aside(o = {}) {
    const mode = o.mode || 'coins';
    const listMenu = o.listMenu
      ? pop(
            `<div class="m-only mgrp"><div class="mh">${E('Цены', 'Prices')}</div>${['book', 'coins'].map((m) => `<button class="mi" role="menuitemradio" aria-checked="${mode === m}">${mode === m ? ic('check') : '<span class="sp"></span>'}${m === 'book' ? t('asBook') : t('inCoins')}<span class="nn">${money(750, m)}</span></button>`).join('')}<hr></div>` +
            mi(t('copyText'), { i: 'copy' }) +
            mi(E('Скачать JSON', 'Download JSON'), { i: 'download' }) +
            '<hr>' +
            mi(E('Удалить список', 'Delete the list'), { i: 'trash', cls: 'danger' }),
          { r: true, w: 230 }
        )
      : '';
    const metaLine = o.meta || E(`${o.n || 7} позиций из 100 · сохранено`, `${o.n || 7} entries of 100 · saved`);
    const prices = `<div class="prices"><div class="seglbl">${E('Цены:', 'Prices:')}${seg([t('asBook'), t('inCoins')], mode === 'book' ? 0 : 1)}</div><div class="pex">${E('Например', 'For example')}: ${money(750, mode)}</div></div>`;
    return `<aside class="panel laside"><div class="ah"><h1 class="h1in"><input value="${o.name || t('listName')}" aria-label="${E('Название списка', 'List name')}"></h1>${o.sel ? '' : btn(t('select'), { sm: true, cls: 'm-only' })}${anchor(btn(t('more'), { sm: true, i: 'more', attr: `aria-expanded="${!!o.listMenu}"` }), listMenu)}</div><div class="meta2">${metaLine}${o.notes === false ? '' : `<span class="m-only" style="display:inline"> · <button class="lnkb" aria-expanded="${!!o.notesOpen}">${E('Заметки', 'Notes')}${ic('chev')}</button></span>`}</div>
      ${o.notesOpen ? `<div class="m-only nset">${noteBox('pl', t('note1'), { edit: true })}${noteBox('gm', t('note2'), { edit: true })}</div>` : ''}
      <div class="row3 m-only">${btn(t('share'), { i: 'share', cls: o.share ? 'on' : '', attr: `aria-expanded="${!!o.share}"` })}${btn(t('print'), { i: 'print' })}${btn(t('rollList'), { i: 'die', cls: o.roll ? 'on' : '', attr: `aria-expanded="${!!o.roll}"` })}</div>
      <div class="acts3 d-only">${btn(t('share'), { i: 'share', cls: o.share ? 'on' : '', attr: `aria-expanded="${!!o.share}"` })}${btn(t('print'), { i: 'print' })}${btn(t('rollList'), { i: 'die', cls: `span2 ${o.roll ? 'on' : ''}`, attr: `aria-expanded="${!!o.roll}"` })}</div>
      <div class="d-only" style="display:grid;gap:12px">${listExtras(o)}</div></aside>`;
  }

  function listPage(o = {}) {
    const ents = (o.ents || ENTS).map((e) => (o.noPrices ? [e[0], e[1], 0, e[3], e[4], e[5]] : e));
    const mode = o.mode || 'coins';
    const sel = o.sel;
    const rows = ents.map((e, i) => lrow(e, i, { ...o, mode })).join('');
    const totalCoins = sel
      ? o.take
        ? ents[o.take[0]][2] * o.take[1]
        : sel.reduce((s, i) => s + ents[i][1] * ents[i][2], 0)
      : 0;
    const pieces = sel ? sel.reduce((s, i) => s + (o.take && o.take[0] === i ? o.take[1] : ents[i][1]), 0) : 0;
    const selLabel = sel
      ? E(
          sel.length === 1 ? 'Выбрана 1 позиция' : `Выбрано ${sel.length} позиции`,
          sel.length === 1 ? '1 entry selected' : `${sel.length} entries selected`
        )
      : '';
    const bar = sel
      ? `<div class="selbar bbar" role="region" aria-label="${E('Выбранные', 'Selected')}"><span class="cb"><i></i>${E('Все', 'All')}</span><b>${selLabel}${pieces !== sel.length ? ` · ${pieces} ${E('шт.', 'pcs')}` : ''}${totalCoins ? ` · ${E('Итого', 'Total')}: ${money(totalCoins, mode)}` : ''}</b>
        ${btn(E('Цены', 'Prices'), { sm: true, chev: true, cls: o.panel ? 'on' : '', attr: `aria-expanded="${!!o.panel}"` })}${btn(t('copyText'), { sm: true, i: 'copy' })}${btn(`${E('Удалить', 'Delete')} (${sel.length})`, { sm: true, cls: 'danger' })}${btn(E('Снять выделение', 'Clear the selection'), { sm: true, cls: 'ghost' })}</div>`
      : '';
    const guess = (r, band, sug) =>
      `<div class="kv"><div class="k"><b>${nm(r)}</b><span>${band}</span></div><div class="wb"><span class="box2 wide">${money(sug, mode)}</span></div></div>`;
    const panel = o.panel
      ? `<section class="panel ibox ppanel"><h2>${E('Цены выбранных', 'Prices of the selected')}</h2>
        ${o.panel === 'none' ? `<p class="hint3">${E('У выбранной позиции ещё нет цены. Ниже - цена по её редкости из книги.', 'The selected entry has no price yet. Below is the book price for its rarity.')}</p>` : `<div class="kv"><div class="k"><b>${E('Скидка или наценка', 'Discount or markup')}</b><span>${E('Минус - скидка, плюс - наценка', 'Minus discounts, plus marks up')}</span></div><div class="wb"><span class="box2">-20</span><span>%</span>${btn(`${E('Применить', 'Apply')}: ${money(1200, mode)}`, { sm: true })}</div></div>`}
        ${guess(o.panel === 'none' ? R.ci1 : R.ci2, E('Обычная · в книге 1-2 мешка', 'Common · 1-2 bags in the book'), o.panel === 'none' ? 150 : 750)}
        <div class="wb">${btn(E('Проставить эту цену', 'Set this price'), { cls: 'primary', sm: true })}${o.panel === 'none' ? '' : btn(E('Убрать цену (1)', 'Clear the price (1)'), { sm: true, cls: 'danger' })}${btn(t('close'), { sm: true, cls: 'ghost' })}</div></section>`
      : '';
    const roll = o.roll
      ? `<section class="panel ibox"><h2>${t('rollList')}</h2><div class="wb">${btn(E('Бросить d7', 'Roll d7'), { cls: 'primary', i: 'die', sm: true })}<span class="count2">${E('или введите номер позиции', 'or enter an entry number')}</span><div class="num" style="height:38px"><button>−</button><output>2</output><button>+</button></div></div>
        <div class="rollres">${scard(R.ci2).replace(/<span class="badge rno">[^<]*<\/span>/, `<span class="badge rno">${E('Позиция', 'Entry')} 2</span>`)}<div class="rr"><b>${E('Выпало: 2 - Пронзительная Свирель, 2 шт.', 'Rolled: 2 - Piper Whistle, 2 pcs')}, ${money(750, mode)} ${E('за штуку', 'each')}</b>${noteBox('pl', E('Звенит на всю округу.', 'It rings across the valley.'))}${noteBox('gm', E('Свистит и под водой.', 'It whistles under water too.'))}${btn(E('Показать в списке', 'Show in the list'), { sm: true })}</div></div></section>`
      : '';
    const share = o.share
      ? `<section class="panel ibox"><h2>${t('share')}</h2>
        <div class="kv"><div class="k"><b>${E('Ссылка для игроков', 'Players\' link')}</b><span>${E('Без заметок мастера и скрытых позиций', 'Without GM notes and hidden entries')}</span></div><div class="lnkrow"><code>daggerheart-loot.pages.dev/s/k3p9x2wq</code>${btn(E('Скопировать', 'Copy'), { sm: true, i: 'copy' })}</div></div>
        <div class="kv"><div class="k"><b>${E('Ссылка для мастера', "GM's link")}</b><span>${E('С заметками «Только для мастера»', 'With the "GM only" notes')}</span></div><div class="lnkrow"><code>daggerheart-loot.pages.dev/s/m7q2c8vn</code>${btn(E('Скопировать', 'Copy'), { sm: true, i: 'copy' })}</div></div>
        <div class="wb">${btn(E('Закрыть доступ по обеим ссылкам', 'Turn off both links'), { sm: true, cls: 'danger' })}</div></section>`
      : '';
    const req = (h, lines, total, first) => `<div class="req"><div class="count2">${h}</div><table class="rqt"><thead><tr><th>${E('Позиция', 'Entry')}</th><th>${E('Было', 'Was')}</th><th>${E('Возьмут', 'Taken')}</th><th>${E('Станет', 'Becomes')}</th><th>${t('price')}</th></tr></thead><tbody>${lines.map(([r, was, tk, p, warn]) => `<tr><td>${nm(r)}${warn ? `<div class="warn2">${warn}</div>` : ''}</td><td data-l="${E('Было', 'Was')}">${was}</td><td data-l="${E('Возьмут', 'Taken')}">${tk}</td><td data-l="${E('Станет', 'Becomes')}">${Math.max(0, was - tk)}</td><td data-l="${t('price')}">${p ? money(p, mode) : E('без цены', 'no price')}</td></tr>`).join('')}</tbody></table>
      <div class="wb"><b>${total}</b><span style="margin-left:auto"></span>${btn(E('Принять', 'Accept'), { sm: true, cls: first ? 'primary' : '' })}${btn(E('Отклонить', 'Decline'), { sm: true })}</div></div>`;
    const requests = o.requests
      ? `<section class="panel ibox"><h2>${E('Новое в списке (3)', 'New in this list (3)')}</h2>
        ${req(E('По ссылке для мастера · только что · истечёт через 60 минут', "From the GM's link · just now · expires in 60 minutes"), [[R.cc1, 5, 5, 180, E('Просили 9, в списке 5: возьмут 5', 'Asked for 9, the list has 5: 5 are taken')], [R.q1, 1, 1, 0]], E('Итого: 180 зол. · 1 позиция без цены', 'Total: 180 gp · 1 entry without a price'), true)}
        ${req(E('По ссылке для игроков · 5 минут назад · истечёт через 55 минут', "From the players' link · 5 minutes ago · expires in 55 minutes"), [[R.ci1, 2, 1, 150], [R.cc1, 5, 3, 60]], E('Итого: 210 зол.', 'Total: 210 gp'))}
        <div class="req"><div class="wb"><span class="badge req">${E('изменение', 'change')}</span><span style="font-size:15px">${E('Автор изменил «Топор Тлеющих Углей».', 'The author changed "Emberaxe".')}</span><span style="margin-left:auto"></span>${btn(E('Открыть', 'Open'), { sm: true, i: 'open' })}${btn(E('Скрыть', 'Hide'), { sm: true, cls: 'ghost' })}</div></div></section>`
      : '';
    const toast = o.toast
      ? `<div class="toast2" role="status">${o.toast}${btn(E('Вернуть', 'Undo'), { sm: true })}</div>`
      : '';
    const tools = sel || o.noTools ? '' : `<div class="acts2 d-only" style="justify-content:flex-end">${btn(t('select'), { sm: true })}</div>`;
    const lhead = `<div class="lhead3" aria-hidden="true"><span>№</span><span></span><span>${t('name')}</span><span>${t('qty')}</span><span>${t('price')}${mode === 'coins' ? `, ${t('gp')}` : ''}</span><span></span></div>`;
    const addOwn = o.full
      ? `<div style="margin-top:12px;display:grid;gap:8px;justify-items:start">${btn(t('addOwn'), { i: 'plus', dis: true })}<p class="limitnote">${icx('alert')}<span>${E('В списке 100 позиций из 100. Уберите ненужное или напишите на daggerheart.loot@gmail.com.', 'The list holds 100 entries of 100. Remove what you do not need or write to daggerheart.loot@gmail.com.')}</span></p></div>`
      : btn(t('addOwn'), { i: 'plus', attr: 'style="margin-top:12px"' });
    const body =
      o.body ||
      `${o.alert || ''}${requests}${roll}${share}${tools}${panel}${lhead}<div class="lrows ${sel ? 'padbar' : ''}">${rows}${bar}</div>${addOwn}`;
    const main = `<main class="wrap"><div class="lgrid">${aside(o)}<section class="lmain">${body}</section></div></main>`;
    const pg = rpage({ job: null, signedIn: true, here: true }, main);
    return toast ? `<div class="ov" style="height:${N ? 1500 : 1000}px">${pg}${toast}</div>` : pg;
  }

  const listEmpty = () =>
    listPage({
      n: 0,
      notes: false,
      body: `${empty(
        E('Список пуст', 'The list is empty'),
        E(
          'Добавьте предмет кнопкой «В список» в таблице, поиске или броске - или свой предмет ниже.',
          'Add an item with "Add to list" in a table, a search or a roll - or your own item below.'
        ),
        btn(E('Открыть таблицы', 'Open the tables'), { i: 'table' })
      )}${btn(t('addOwn'), { i: 'plus' })}`,
      meta: E('0 позиций из 100 · сохранено', '0 entries of 100 · saved')
    });
  const listLimit = () => listPage({ full: true, meta: E('100 позиций из 100 · сохранено', '100 entries of 100 · saved') });
  const listError = () =>
    listPage({
      meta: `<span style="color:var(--danger-text)">${E('7 позиций из 100 · не сохранено', '7 entries of 100 · not saved')}</span>`,
      alert: loadErr(
        E('Изменение не сохранилось', 'The change was not saved'),
        E('Нет связи с сервером. Последнее изменение ждёт в этой вкладке.', 'No connection to the server. The last change waits in this tab.'),
        btn(E('Повторить', 'Retry'), { i: 'refresh' })
      )
    });
  const listDrag = () =>
    listPage({ drag: 2, drop: [3, 4] }).replace(
      '<div class="lrows">',
      `<div class="cap inline">${E('перетаскивание за ручку: «Палаш» встанет между 4 и 5, метка на обеих строках у промежутка', 'dragging by the grip: "Broadsword" lands between 4 and 5, the mark on both rows by the gap')}</div><div class="lrows">`
    );

  /* ---------- the shared page (/s/<token>) ---------- */
  const SHENTS = ENTS.filter((e) => !e[5]);
  function srow(e, i, o = {}) {
    const [r, q, p, pn, gn] = e;
    const on = o.sel && o.sel.includes(i);
    const side = `<div class="qp"><span class="qf">${t('qty')}<span class="qv">${q}</span></span><span class="qf">${t('price')}<span class="qv">${p ? money(p, 'coins') : '-'}</span></span></div>`;
    const take =
      on && q > 1
        ? `<div class="take">${E('Взять', 'Take')} <span class="box2 sm">1</span> ${E('из', 'of')} ${q}</div>`
        : '';
    const notes = `${pn ? `<div class="rnote">${noteBox('pl', pn)}</div>` : ''}${gn && o.gm ? `<div class="rnote">${noteBox('gm', gn)}</div>` : ''}`;
    return U.row(r, { side, note: take + notes, ck: o.sel ? on : undefined }).replace('class="rl', 'class="rl srow2');
  }
  function shared(o = {}) {
    const ents = o.ents || (o.gm ? ENTS : SHENTS);
    const n = ents.length;
    const selMode = !!o.sel;
    const bar = selMode
      ? `<div class="selbar bbar" role="region" aria-label="${E('Выбранные', 'Selected')}"><b>${E(`Выбрано: ${o.sel.length} · 2 шт.`, `${o.sel.length} selected · 2 pcs`)}</b>${btn(t('addList'), { sm: true, i: 'plus' })}${btn(t('copyText'), { sm: true, i: 'copy' })}${btn(t('print'), { sm: true, i: 'print' })}${btn(E('Снять выделение', 'Clear the selection'), { sm: true, cls: 'ghost' })}<span class="bline">${btn(E('Сообщить владельцу', 'Notify the owner'), { sm: true })}</span></div>`
      : '';
    const own = o.own
      ? `<div class="ownl">${E('Это ваш список.', 'This is your list.')} <span style="color:var(--muted)">${E('Только для мастера: 1 позиция - по этой ссылке её не видно.', 'GM only: 1 entry - this link does not show it.')}</span><a href="#">${E('Открыть для правки', 'Open to edit')}</a></div>`
      : '';
    const find = o.find
      ? `<div class="hbtools srow360"><label class="field">${ic('search')}<input placeholder="${E('Поиск', 'Search')}"></label>${btn(t('filters'), { cls: 'fbtn2', sm: true })}${btn(t('select'), { sm: true })}</div>`
      : '';
    const nlink = (label, open) =>
      `<button class="lnkb" aria-expanded="${!!open}">${label}${ic('chev')}</button>`;
    const head = `${own}<div class="shhead"><h1 class="clamp" title="${o.name || t('listName')}">${o.name || t('listName')}</h1><div class="lead2">${E(`${n} из ${n} · обновлён 3 дня назад`, `${n} of ${n} · updated 3 days ago`)} · ${nlink(E('Заметка', 'Note'), o.noteOpen)}${o.gm ? ` · ${nlink(E('Заметка мастера', "GM's note"), o.gmOpen)}` : ''}</div></div>
      ${o.noteOpen ? noteBox('pl', t('note1')) : ''}${o.gmOpen ? noteBox('gm', t('note2')) : ''}
      <div class="acts2 one">${btn(E('Сохранить себе', 'Save to my lists'), { cls: 'primary', i: 'plus', sm: N })}${btn(t('print'), { i: 'print', cls: 'd-only', sm: N })}${selMode || o.find ? '' : `<span style="margin-left:auto">${btn(t('select'), { sm: true })}</span>`}</div>`;
    const rows = ents.map((e, i) => srow(e, i, o)).join('');
    const filt = (any) =>
      `<div class="fgrp"><span class="lbl">${E('Тип', 'Type')}</span><div class="opts">${allChip()}${chip(E('Предмет', 'Item'))}${chip(E('Расходник', 'Consumable'))}${chip(E('Снаряжение', 'Equipment'))}</div></div>
      <div class="fgrp"><span class="lbl">${E('Источник', 'Source')}</span><div class="opts">${allChip()}${chip('Core')}${chip('Hope &amp; Fear')}${chip('Vault of Ages')}${chip(E('Хоумбрю', 'Homebrew'))}</div></div>
      <div class="fgrp"><span class="lbl">${E('Ранг', 'Tier')}</span><div class="opts">${allChip()}${chip('1')}${chip('2')}</div></div>`;
    const listCol = o.find
      ? `<div class="hbcat"><aside class="panel fside" aria-label="${t('filters')}"><div class="fh"><b>${t('filters')}</b></div>${filt()}</aside><div>${find}${rows}</div></div>`
      : `<div class="shlist ${selMode ? 'padbar' : ''}" style="margin-top:8px">${rows}${bar}</div>`;
    const main = `<main class="wrap">${head}${o.find ? '' : ''}${listCol}</main>`;
    const pg = rpage({ job: null, signedIn: !!(o.gm || o.own || o.sel) }, main);
    if (o.find && N && o.sheetOpen)
      return ov(pg, sheet360(t('filters'), filt(), btn(t('reset')) + btn(E(`Показать ${n}`, `Show ${n}`), { cls: 'primary' })));
    return pg;
  }
  function sharedMany() {
    const extra = [
      [R.cc2, 3, 25],
      [R.cc3, 2, 25],
      [R.hi1, 1, 60],
      [R.hi2, 1, 90],
      [R.ci5, 1, 1200],
      [R.q26, 1, 400]
    ];
    return shared({ ents: [...SHENTS, ...extra], find: true, sheetOpen: true });
  }
  const sharedGone = () =>
    rpage(
      { job: null, signedIn: false },
      `<main class="wrap">${errPage(
        E('Список больше не доступен', 'This list is no longer available'),
        E('Владелец закрыл доступ по этой ссылке или удалил список. Попросите у него новую ссылку.', 'The owner turned this link off or deleted the list. Ask them for a new link.'),
        btn(E('Открыть таблицы', 'Open the tables'), { cls: 'primary', i: 'table' })
      )}</main>`
    );

  const STATES = {
    list: () => listPage(),
    'list-longname': () => listPage({ name: E("Лавка кузнеца Ольхи у северных ворот старого Порта, где по вторникам торгуют трофеями из склепа под холмом, а по четвергам - зельями, оружием и бронёй, которую чинят прямо при покупателе за одну горсть", "Olkha's forge shop by the north gate of the old Harbor, where trophies from the crypt under the hill sell on Tuesdays, and on Thursdays potions, weapons and armor, mended on the spot for one handful") }),
    'list-notes': () => listPage({ notesOpen: true }),
    'list-note': () => listPage({ noteOpen: 2 }),
    'list-note-gm': () => listPage({ noteOpen: 5, noteKind: 'gm' }),
    'list-more': () => listPage({ listMenu: true }),
    'list-rowmore': () => listPage({ rowMenu: 5 }),
    'list-drag': listDrag,
    'list-share': () => listPage({ share: true }),
    'list-prices': () => listPage({ mode: 'book' }),
    'list-prices-panel': () => listPage({ sel: [1], panel: 'set' }),
    'list-prices-none': () => listPage({ sel: [0], panel: 'none', noPrices: true }),
    'list-picked': () => listPage({ sel: [1], take: [1, 1], mode: 'book' }),
    'list-selected': () => listPage({ sel: [0, 4] }),
    'list-sold': () =>
      listPage({
        toast: E('Продано и убрано: Пронзительная Свирель, 1 шт.', 'Sold and removed: Piper Whistle, 1 pc')
      }),
    'list-roll': () => listPage({ roll: true, rolled: 1 }),
    'list-requests': () => listPage({ requests: true }),
    'list-empty': listEmpty,
    'list-limit': listLimit,
    'list-error': listError,
    'shared-player': () => shared(),
    'shared-longname': () => shared({ name: E("Лавка кузнеца Ольхи у северных ворот старого Порта, где по вторникам торгуют трофеями из склепа под холмом, а по четвергам - зельями, оружием и бронёй, которую чинят прямо при покупателе за одну горсть", "Olkha's forge shop by the north gate of the old Harbor, where trophies from the crypt under the hill sell on Tuesdays, and on Thursdays potions, weapons and armor, mended on the spot for one handful") }),
    'shared-note': () => shared({ noteOpen: true }),
    'shared-gm': () => shared({ gm: true }),
    'shared-gm-note': () => shared({ gm: true, gmOpen: true }),
    'shared-own': () => shared({ own: true }),
    'shared-select': () => shared({ sel: [0, 1] }),
    'shared-filters': sharedMany,
    'shared-gone': sharedGone
  };
  window.RSTATES = Object.keys(STATES);
  window.RSTATE = () => U.fix((STATES[S] || STATES.list)());
})();
