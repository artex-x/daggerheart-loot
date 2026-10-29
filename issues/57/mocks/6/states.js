/* Batch 6 mock: «Мои предметы» (/homebrew and its tabs), the item editor
   (/homebrew/<id>) and the import. state.html?s=<state>&lang=en; the list and the
   owner answers are in index.html. Round 2 (plan.md section 14): the first-screen
   head; the help panel and the editor's field «?» are removed (owner, 2026-10-29). */
(function () {
  const { t, R, ic } = window.M;
  const U = window.U;
  const { E, N, S, btn, seg, chip, allChip, row, empty, loadErr, pop, mi, anchor, rpage, ov, sheet360, icx } = U;

  const COUNTS = { items: 9, sources: 2, sets: 1, rules: 1 };
  const TABS = [
    ['items', E('Предметы', 'Items')],
    ['sources', E('Источники', 'Sources')],
    ['sets', E('Комплекты', 'Sets')],
    ['rules', E('Карты правил', 'Rule cards')]
  ];
  const NEW = {
    items: E('Новый предмет', 'New item'),
    sources: E('Новый источник', 'New source'),
    sets: E('Новый комплект', 'New set'),
    rules: E('Новая карта правил', 'New rule card')
  };
  const LIMIT = {
    items: E('9 из 100', '9 of 100'),
    sources: E('2 из 20', '2 of 20'),
    sets: E('карт: 2 из 100', 'cards: 2 of 100'),
    rules: E('карт: 2 из 100', 'cards: 2 of 100')
  };
  const importLbl = E('Импорт из файла', 'Import from file');

  /* The head: mock 3's list head pattern. 1180: the title, the pin, the four tabs and the
     tab's primary on one row; the import shows in the search row. 360: the title is the
     tab picker with the primary and «Ещё» (import, pin) beside it. */
  function hbPage(tab, body, o = {}) {
    const n = o.counts || COUNTS;
    const cur = TABS.find((x) => x[0] === tab)[1];
    const nav = `<nav class="tabs2 inl" aria-label="${t('myItems')}">${TABS.map(([k, l]) => `<a href="#" class="${k === tab ? 'on' : ''}" ${k === tab ? 'aria-current="page"' : ''}>${l}<span class="n">${n[k]}</span></a>`).join('')}</nav>`;
    const items = () =>
      mi(importLbl, { i: 'upload' }) +
      `<button class="mi" role="menuitemcheckbox" aria-checked="false">${ic('home')}${t('home')}</button>`;
    const more = (wide) =>
      anchor(
        btn(t('more'), { sm: !wide, i: 'more', cls: o.importPanel ? 'on' : '', attr: `aria-expanded="${!!o.moreOpen}"` }),
        o.moreOpen ? pop(items(), { r: true, w: 240 }) : ''
      );
    const primary = (wide) => btn(NEW[tab], { cls: 'primary', i: wide ? 'plus' : '', sm: !wide });
    const pin = `<button class="btn sm" aria-pressed="false">${ic('home')}${t('home')}</button>`;
    const desk = `<div class="ph hbh d-only"><h1>${t('myItems')}</h1>${pin}${o.noTabs ? '' : `${nav}<div class="phr">${primary(true)}</div>`}</div>`;
    const mob = `<div class="tphead m-only"><div><h1 class="h1w">${o.noTabs ? t('myItems') : `<button class="h1pick" aria-expanded="${!!o.tabsOpen}" aria-haspopup="dialog"><span class="sr">${t('myItems')}: </span>${cur}${ic('chev')}</button>`}</h1></div>${o.noTabs ? '' : `<div class="tpr">${primary(false)}${more(false)}</div>`}</div>`;
    const main = `<main class="wrap">${desk}${mob}${o.importPanel || ''}${body.split('%%MORE%%').join('').split('%%IMPORT%%').join(btn(importLbl, { sm: true, i: 'upload', cls: o.importPanel ? 'on' : '', attr: `aria-expanded="${!!o.importPanel}"` }))}</main>`;
    const pg = rpage({ job: null, signedIn: true, here: true }, main);
    if (o.tabsOpen && N) {
      const rows = TABS.map(
        ([k, l]) =>
          `<a class="mi" href="#" ${k === tab ? 'aria-current="page"' : ''}>${k === tab ? ic('check') : '<span class="sp"></span>'}${l}<span class="nn">${n[k]}</span></a>`
      ).join('');
      return `<div class="ov" style="height:640px">${pg}<div class="scrim2"></div><section class="sheet2" role="dialog" aria-label="${t('myItems')}"><div class="grab"></div><div class="sh2"><b>${t('myItems')}</b>${btn(t('close'), { sm: true, cls: 'ghost', i: 'x' })}</div>${rows}</section></div>`;
    }
    return pg;
  }

  /* ---------- the Items tab ---------- */
  const GROUPS = [
    [E('Мастерская Ольхи · Холодное оружие', "Olkha's workshop · Melee weapons"), ['hbA', 'hbM', 'hbK'], 'olkha'],
    [E('Мастерская Ольхи · Броня', "Olkha's workshop · Armor"), ['hbP'], 'olkha'],
    [E('Мастерская Ольхи', "Olkha's workshop"), ['hbS'], 'olkha'],
    [E('Хоумбрю', 'Homebrew'), ['hbR', 'hbB', 'hbC', 'hbL'], 'home']
  ];
  const search = () =>
    `<label class="field">${ic('search')}<input placeholder="${E('Поиск', 'Search')}"></label>`;
  function hbFilters(o = {}) {
    const g = (lbl, opts, any = true) =>
      `<div class="fgrp"><span class="lbl">${lbl}</span><div class="opts">${allChip(any)}${opts}</div></div>`;
    const src = o.src === 'olkha';
    return `${g(E('Тип', 'Type'), chip(E('Предмет', 'Item')) + chip(E('Расходник', 'Consumable')) + chip(E('Снаряжение', 'Equipment')))}
      ${g(E('Источник', 'Source'), chip(E('Мастерская Ольхи', "Olkha's workshop"), src, o.focus ? 'style="outline:2px solid var(--gold);outline-offset:2px"' : '') + chip(E('Хоумбрю', 'Homebrew')), !src)}
      ${g(E('Раздел', 'Section'), chip(E('Холодное оружие', 'Melee weapons')) + chip(E('Броня', 'Armor')))}`;
  }
  function itemsBody(o = {}) {
    const groups = o.src === 'olkha' ? GROUPS.filter((x) => x[2] === 'olkha') : GROUPS;
    const shown = groups.reduce((s, x) => s + x[1].length, 0);
    const sel = o.sel || [];
    const selMode = !!o.sel;
    const rows = groups
      .map(
        ([lbl, ids]) =>
          `<div class="grp2">${o.src ? lbl.replace(/^(Мастерская Ольхи|Olkha's workshop)( · )?/, '') || E('Без раздела', 'No section') : lbl}<span class="n">${ids.length}</span>${o.src && lbl === groups[0][0] ? `<span class="n m-only" style="margin-left:auto">${E(`Показано ${shown} из 9`, `${shown} of 9 shown`)}</span>` : ''}</div>${ids
            .map((id) => row(R[id], { noSrc: true, ck: selMode ? sel.includes(id) : undefined }))
            .join('')}`
      )
      .join('');
    const nf = o.src ? 1 : 0;
    const fl = `${t('filters')}${nf ? ` · ${nf}` : ''}`;
    const mob = `<div class="hbtools m-only srow360">${search()}${btn(fl, { sm: true, cls: nf ? 'lit' : '' })}${selMode ? '' : btn(t('select'), { sm: true })}</div>`;
    const desk = `<div class="hbtools d-only">${search()}<span class="count2">${o.src ? E(`Показано ${shown} из 9`, `${shown} of 9 shown`) : E('9 предметов из 100', '9 items of 100')}</span>%%IMPORT%%${selMode ? '' : btn(t('select'), { sm: true })}</div>`;
    const move = o.moveOpen
      ? `<div class="kv" style="width:100%;border-top:1px solid var(--line);margin-top:4px;padding-top:10px">
          <div class="wb" style="grid-column:1/-1"><label style="display:grid;gap:4px;font-size:var(--t-small);font-weight:600">${E('Источник', 'Source')}<span class="field sel" style="min-width:210px"><span>${E('Хоумбрю', 'Homebrew')}</span>${ic('chev')}</span></label>
          <label style="display:grid;gap:4px;font-size:var(--t-small);font-weight:600;color:var(--muted)">${E('Раздел', 'Section')}<span class="field sel" style="min-width:170px;opacity:.6"><span>${E('Без раздела', 'No section')}</span>${ic('chev')}</span></label>
          <span style="align-self:end">${btn(E('Переместить 2 предмета', 'Move 2 items'), { cls: 'primary', i: 'move' })}</span></div>
          <p class="fcap" style="grid-column:1/-1;margin:0">${E('В «Хоумбрю» нет разделов: предметы лягут без раздела.', '"Homebrew" has no sections: the items go in with no section.')}</p></div>`
      : '';
    const bar = selMode
      ? `<div class="selbar bbar" role="region" aria-label="${E('Выбранные', 'Selected')}"><span class="cb"><i></i>${E('Все', 'All')}</span><b>${E(`Выбрано: ${sel.length}`, `${sel.length} selected`)}</b>
          ${btn(E(`Переместить (${sel.length})`, `Move (${sel.length})`), { sm: true, chev: true, cls: o.moveOpen ? 'on' : '', attr: `aria-expanded="${!!o.moveOpen}"` })}${btn(E(`Скачать JSON (${sel.length})`, `Download JSON (${sel.length})`), { sm: true, i: 'download' })}${btn(E(`Удалить (${sel.length})`, `Delete (${sel.length})`), { sm: true, cls: 'danger' })}${btn(E('Снять выделение', 'Clear the selection'), { sm: true, cls: 'ghost' })}${move}</div>`
      : '';
    const fh = `<div class="fh"><b>${fl}</b>${nf ? btn(t('reset'), { sm: true, cls: 'ghost' }) : ''}</div>${nf ? `<div style="margin-top:-8px">${btn(E('Ссылка на фильтры', 'Link to these filters'), { sm: true, cls: 'ghost', i: 'link' })}</div>` : ''}`;
    return `${mob}<div class="hbcat"><aside class="panel fside" aria-label="${t('filters')}">${fh}${hbFilters(o)}</aside>
      <div data-primary-col class="${selMode ? 'padbar' : ''}">${desk}${rows}${bar}</div></div>`;
  }
  const hbItems = (o = {}) => hbPage('items', itemsBody(o), o);

  /* The filter sheet at 360. */
  function hbFiltersSheet() {
    if (!N) return hbPage('items', itemsBody({ src: 'olkha', focus: true }));
    return ov(
      hbItems({ src: 'olkha' }),
      sheet360(
        `${t('filters')} · 1`,
        hbFilters({ src: 'olkha', focus: true }),
        btn(t('reset')) + btn(E('Показать 5', 'Show 5'), { cls: 'primary' }),
        { headExtra: `<span style="order:3;flex-basis:100%;margin:-4px 0 0 -10px">${btn(E('Ссылка на фильтры', 'Link to these filters'), { sm: true, cls: 'ghost', i: 'link' })}</span>` }
      )
    );
  }

  function hbEmpty() {
    const body = `${empty(
      E('Своих предметов пока нет', 'No items of your own yet'),
      E(
        'Свой предмет ищется вместе с книгами, виден в «Таблицах» и попадает в списки.',
        'Your own item is found with the books, shows in Tables and goes into lists.'
      ),
      ''
    )}`;
    return hbPage('items', body, { counts: { items: 0, sources: 1, sets: 0, rules: 0 }, limit: E('0 из 100', '0 of 100') });
  }
  function hbError() {
    const body = loadErr(
      E('Не получилось загрузить ваши предметы', 'Your items did not load'),
      E('Проверьте соединение и попробуйте ещё раз.', 'Check the connection and try again.'),
      btn(E('Повторить', 'Retry'), { i: 'refresh' })
    );
    return hbPage('items', body, { noTabs: true });
  }

  /* ---------- the Sources, Sets and Rule cards tabs ---------- */
  const moreMenu = (items, open) =>
    anchor(
      btn(t('more'), { sm: true, i: 'more', chev: true, attr: `aria-expanded="${!!open}"` }),
      open ? pop(items, { r: true, w: 230 }) : ''
    );
  const tabTools = (tab, count) =>
    `<div class="acts2 cline"><span class="count2" style="margin:0">${count}</span><span class="d-only" style="margin-left:auto">%%IMPORT%%</span></div>`;
  function hbSources(o = {}) {
    const srcMenu =
      mi(E('Переименовать', 'Rename'), { i: 'edit' }) +
      mi(E('Скачать JSON', 'Download JSON'), { i: 'download' }) +
      '<hr>' +
      mi(E('Удалить источник', 'Delete the source'), { i: 'trash', cls: 'danger' });
    const secs = o.sections
      ? `<section class="panel secs" aria-label="${E('Разделы: Мастерская Ольхи', "Sections: Olkha's workshop")}">
          <div class="sr"><b style="font-weight:600">${E('Холодное оружие', 'Melee weapons')}</b><span class="m">${E('3 предмета', '3 items')}</span>${btn(E('Переименовать', 'Rename'), { sm: true, cls: 'ghost' })}${btn(E('Удалить', 'Delete'), { sm: true, cls: 'ghost' })}</div>
          <div class="sr"><b style="font-weight:600">${E('Броня', 'Armor')}</b><span class="m">${E('1 предмет', '1 item')}</span>${btn(E('Переименовать', 'Rename'), { sm: true, cls: 'ghost' })}${btn(E('Удалить', 'Delete'), { sm: true, cls: 'ghost' })}</div>
          <div class="newsec"><label class="field"><input placeholder="${E('Новый раздел, например «Кольца»', 'A new section, for example "Rings"')}"></label>${btn(E('Добавить', 'Add'), { cls: 'primary' })}</div>
          <p class="fcap" style="margin:6px 0 0">${E('Разделов: 2 из 30', 'Sections: 2 of 30')}</p></section>`
      : '';
    const body = `${tabTools('sources', E('2 источника из 20', '2 sources of 20'))}
      <div class="srow"><b><a href="#" style="color:var(--txt)">${E('Мастерская Ольхи', "Olkha's workshop")}</a></b><span class="m">${E('5 предметов · разделов: 2 из 30', '5 items · sections: 2 of 30')}</span>${btn(E('Разделы', 'Sections'), { sm: true, chev: true, cls: o.sections ? 'on' : '', attr: `aria-expanded="${!!o.sections}"` })}${moreMenu(srcMenu, o.menu)}</div>
      ${secs}
      <div class="srow"><b><a href="#" style="color:var(--txt)">${E('Хоумбрю', 'Homebrew')}</a></b><span class="m">${E('4 предмета · здесь лежат предметы без источника', '4 items · items with no source go here')}</span></div>`;
    return hbPage('sources', body);
  }
  function hbSets() {
    const body = `${tabTools('sets', `<span class="d-only">${E('1 комплект · карт комплектов и правил: 2 из 100', '1 set · set and rule cards: 2 of 100')}</span><span class="m-only">${E('1 комплект · карт: 2 из 100', '1 set · cards: 2 of 100')}</span>`)}
      <div class="srow"><b>${E('Комплект Ольхи', "Olkha's set")}</b><span class="m">${E('3 предмета · Мастерская Ольхи', "3 items · Olkha's workshop")}</span>${btn(E('Изменить', 'Edit'), { sm: true, i: 'edit' })}${moreMenu('', false)}
        <div class="setbonus"><b>${E('Бонус:', 'Bonus:')}</b> ${E('пока на вас два предмета комплекта, +1 к Порогам урона.', 'while you wear two items of the set, +1 to your damage thresholds.')} · ${E('Топор Тлеющих Углей, Фартук Кузнеца, Молот Горна', "Emberaxe, Smith's Apron, Forge Hammer")}</div></div>`;
    return hbPage('sets', body);
  }
  function hbSetsEmpty() {
    return hbPage(
      'sets',
      empty(
        E('Комплектов пока нет', 'No sets yet'),
        E(
          'Комплект - предметы с общим бонусом: бонус виден на карточке каждого из них.',
          'A set is items with a shared bonus: the bonus shows on the card of each of them.'
        ),
        ''
      ),
      { counts: { items: 9, sources: 2, sets: 0, rules: 1 }, limit: E('карт: 1 из 100', 'cards: 1 of 100') }
    );
  }
  function hbRules() {
    const body = `${tabTools('rules', `<span class="d-only">${E('1 карта правил · карт комплектов и правил: 2 из 100', '1 rule card · set and rule cards: 2 of 100')}</span><span class="m-only">${E('1 карта правил · 2 из 100', '1 rule card · 2 of 100')}</span>`)}
      <div class="srow"><b>${E('Клеймо Ольхи', "Olkha's brand")}</b><span class="m">${E('на неё ссылаются 2 предмета', '2 items refer to it')}</span>${btn(E('Изменить', 'Edit'), { sm: true, i: 'edit' })}${moreMenu('', false)}
        <div class="setbonus">${E('Когда вы отмечаете Стресс от огня, бросьте d6: на 5-6 снимите его.', 'When you mark a Stress from fire, roll a d6: on a 5-6, clear it.')}</div></div>`;
    return hbPage('rules', body);
  }

  /* ---------- the import (A13, D16): «Ещё» > «Импорт из файла» opens it under the head ---------- */
  function importPanel() {
    return `<section class="panel ibox"><div class="wb" style="justify-content:space-between"><h2>${importLbl}</h2>${btn(t('close'), { sm: true, cls: 'ghost', i: 'x' })}</div>
      <div class="wb">${btn(E('Выбрать файл', 'Choose a file'), { sm: true })}<span class="count2">example-edited.json</span><a class="lnk" href="#" style="margin-left:auto">${E('Формат файла', 'File format')}</a></div>
      <p class="fcap" style="margin:0">${E('Подходит файл из «Скачать JSON», архив из «Скачать мои данные» или файл по описанию в llms.txt.', 'Takes a file from "Download JSON", the archive from "Download my data", or a file written to llms.txt.')}</p>
      <div class="sum"><b>${E('В файле: 5 предметов, 1 источник, 2 раздела, 2 карты.', 'In the file: 5 items, 1 source, 2 sections, 2 cards.')}</b></div>
      <div class="kv"><div class="k"><b>${E('Мастерская Ольхи, второе издание', "Olkha's workshop, second edition")}</b><span>${E('4 предмета · совпадает с вашим источником', '4 items · matches your source')}</span></div><label class="field sel"><span>${E('В «Мастерская Ольхи»', 'Into "Olkha\'s workshop"')}</span>${ic('chev')}</label></div>
      <div class="kv"><div class="k"><b>${E('Без источника', 'No source')}</b><span>${E('1 предмет', '1 item')}</span></div><label class="field sel"><span>${E('В «Хоумбрю»', 'Into "Homebrew"')}</span>${ic('chev')}</label></div>
      <div class="kv"><div class="k"><b>${E('Если уже есть:', 'If you already have it:')}</b><span>${E('совпали 1 источник и 2 предмета', '1 source and 2 items match')}</span></div><div style="display:grid;gap:4px">${seg([E('Пропустить', 'Skip'), E('Обновить', 'Update')], 0)}<span class="fcap" style="margin:0">${E('Ваши 2 предмета останутся как есть; 3 новых добавятся.', 'Your 2 items stay as they are; 3 new ones are added.')}</span></div></div>
      <div class="wb">${btn(E('Импортировать 5 предметов', 'Import 5 items'), { cls: 'primary' })}${btn(E('Отмена', 'Cancel'))}</div></section>`;
  }
  const hbImport = () => hbItems({ importPanel: importPanel() });

  /* ---------- the editor: no field «?» (owner, 2026-10-29) ---------- */
  function rels(o = {}) {
    const lbl = (text) => `<div class="el"><span>${text}</span></div>`;
    const line = `<div class="ef">${lbl(E('Линия улучшений', 'Upgrade line'))}${seg([E('Вне линии', 'Not in a line'), E('Ступень линии', 'A step of a line'), E('Начать линию', 'Start a line')], 0)}<p class="fcap">${E('Одно снаряжение на рангах 1-4: карточка рисует лесенку рангов.', 'One piece of equipment at tiers 1-4: the card draws a ladder of tiers.')}</p></div>`;
    const into = `<div class="ef">${lbl(E('Улучшается до', 'Upgrades to'))}<div class="relpick"><span class="relchip">${E('Топор Пробуждённого Пламени', 'Awakened Flame Axe')} <span class="badge hb">HB</span>${ic('x')}</span>${btn(E('Добавить', 'Add'), { sm: true, i: 'plus', cls: 'ghost' })}</div></div>`;
    const from = `<div class="ef">${lbl(E('Получается из', 'Made from'))}<div class="relpick">${btn(E('Добавить', 'Add'), { sm: true, i: 'plus', cls: 'ghost' })}</div></div>`;
    const set = `<div class="ef">${lbl(E('Комплект', 'Set'))}<label class="field sel" style="min-width:240px"><span>${E('Комплект Ольхи', "Olkha's set")}</span>${ic('chev')}</label><p class="fcap">${E('Бонус комплекта: пока на вас два предмета комплекта, +1 к Порогам урона.', 'Set bonus: while you wear two items of the set, +1 to your damage thresholds.')}</p></div>`;
    const refs = `<div class="ef">${lbl(E('Карты правил, до 3', 'Rule cards, up to 3'))}<div class="relpick"><span class="relchip">${E('Клеймо Ольхи', "Olkha's brand")}${ic('x')}</span>${btn(E('Добавить', 'Add'), { sm: true, i: 'plus', cls: 'ghost' })}</div></div>`;
    return `<details class="rels" ${o.open ? 'open' : ''}><summary><h2>${E('Связи', 'Relations')}</h2><span class="n">· 3</span>${ic('chev')}</summary><div class="body">${line}${into}${from}${set}${refs}</div></details>`;
  }
  /* The back link joins the title row as a breadcrumb (plan.md section 14). */
  const LONG = E(
    'Топор Тлеющих Углей, выкованный в горне Ольхи из обломков упавшей звезды и закалённый в водах подземной реки',
    "Emberaxe, forged in Olkha's furnace from the shards of a fallen star and quenched in the waters of an underground river"
  );
  const crumb = (html, long) =>
    html
      .replace(
        `<a class="back" href="#">← ${t('myItems')}</a><div class="ph">`,
        `<div class="ph crumb"><a class="back" href="#">${icx('back')}${t('myItems')}</a>`
      )
      .replace(`<h1>${E('Топор Тлеющих Углей', 'Emberaxe')}</h1><span class="badge">${E('Хоумбрю', 'Homebrew')}</span>`, `<h1 class="clamp" title="${long ? LONG : E('Топор Тлеющих Углей', 'Emberaxe')}">${long ? LONG : E('Топор Тлеющих Углей', 'Emberaxe')}</h1>`);
  function editorMain(o = {}) {
    let ed = crumb(window.EDITOR('B'), o.long).replace('<div class="ebar">', `${rels(o)}<div class="ebar">`);
    ed = ed.replace(
      `<div class="ef  " id="src"><div class="el"><span>${E('Источник', 'Source')}</span></div><label class="field sel"><span>${E('Мастерская Ольхи', "Olkha's workshop")}</span>${ic('chev')}</label></div>`,
      `<div class="ef  " id="src"><div class="el"><span>${E('Источник', 'Source')}</span></div><label class="field sel"><span>${E('Мастерская Ольхи', "Olkha's workshop")}</span>${ic('chev')}</label><p class="fcap">${E('Без источника предмет лежит в «Хоумбрю».', 'With no source the item goes to Homebrew.')}</p></div>`
    );
    ed = ed.replace(/<div class="dmg"><label class="field sel"><span>([^<]*)<\/span>([\s\S]*?)<\/label><span>\+<\/span><label class="field num2"><input value="2"[^>]*><\/label><\/div>/, (m, die, chev) =>
      `<div class="dmg"><label class="dmgf"><span class="sl">${E('Кость урона', 'Damage die')}</span><span class="field sel"><span>${die}</span>${chev}</span></label><span class="plus">+</span><label class="dmgf"><span class="sl">${E('Бонус к урону', 'Damage bonus')}</span><span class="field num2"><input value="2"></span></label></div>`
    );
    if (window.EDITOR_ERR) ed = ed.replace('<div class="esum"', '<div class="esum foc" tabindex="-1"');
    return ed;
  }
  const editor = () => rpage({ job: null, signedIn: true, here: true }, editorMain());
  const editorRels = () => rpage({ job: null, signedIn: true, here: true }, editorMain({ open: true }));
  function editorCrop() {
    const dlg = `<section class="dlg sm" role="dialog" aria-label="${E('Обрезать картинку', 'Crop the picture')}"><h2>${E('Обрезать картинку', 'Crop the picture')}</h2>
      <div class="crop" style="margin:10px 0 12px"><img src="${window.M.IMG}q17.webp" alt=""><div class="fr"><i class="hd a"></i><i class="hd b"></i><i class="hd c"></i><i class="hd d"></i></div></div>
      <div class="zoom"><button class="btn sm" aria-label="${E('Меньше', 'Zoom out')}">−</button><div class="tr" role="slider" aria-label="${E('Масштаб', 'Zoom')}" aria-valuenow="130"><i></i></div><button class="btn sm" aria-label="${E('Больше', 'Zoom in')}">+</button></div>
      <div class="wb" style="margin-top:14px">${btn(E('Готово', 'Done'), { cls: 'primary' })}${btn(E('Отмена', 'Cancel'))}</div></section>`;
    return ov(rpage({ job: null, signedIn: true, here: true }, editorMain()), dlg);
  }
  function editorConflict() {
    const ed = editorMain()
      .replace(
        '<section class="es">',
        `<div class="alertc" role="alert"><b>${E('Предмет изменили на другом устройстве', 'The item changed on another device')}</b><p>${E('Ваши правки не сохранены. Посмотрите новую версию, прежде чем сохранять.', 'Your edits are not saved. Look at the new version before you save.')}</p>
        <div class="wb">${btn(E('Показать новую версию', 'Show the new version'), { sm: true, cls: 'primary' })}${btn(E('Заменить её моей', 'Replace it with mine'), { sm: true, cls: 'danger' })}</div></div><section class="es">`
      )
      .replace('<button class="btn primary">', '<button class="btn" disabled style="opacity:.55">');
    return rpage({ job: null, signedIn: true, here: true }, ed);
  }

  const STATES = {
    'homebrew-items': () => hbItems(),
    'homebrew-tabs': () => hbItems({ tabsOpen: true }),
    'homebrew-more': () => hbItems({ moreOpen: true }),
    'homebrew-filtered': () => hbItems({ src: 'olkha', limit: E('показано 5 из 9', '5 of 9 shown') }),
    'homebrew-filters': hbFiltersSheet,
    'homebrew-select': () => hbItems({ sel: ['hbM', 'hbK'], moveOpen: true }),
    'homebrew-empty': hbEmpty,
    'homebrew-error': hbError,
    'homebrew-sources': () => hbSources({ menu: true }),
    'homebrew-sections': () => hbSources({ sections: true }),
    'homebrew-sets': hbSets,
    'homebrew-sets-empty': hbSetsEmpty,
    'homebrew-rules': hbRules,
    'homebrew-import': hbImport,
    editor,
    'editor-relations': editorRels,
    'editor-errors': editor,
    'editor-longname': () => rpage({ job: null, signedIn: true, here: true }, editorMain({ long: true })),
    'editor-crop': editorCrop,
    'editor-conflict': editorConflict
  };
  window.RSTATES = Object.keys(STATES);
  window.RSTATE = () => U.fix((STATES[S] || STATES['homebrew-items'])());
})();
