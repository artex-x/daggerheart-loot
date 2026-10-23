/* Direction A surfaces. Option A1 (default): the strict gold budget. Option A2
   (`?opt=A2`): the lenient budget - defaults and segments stay gold, and
   1d12 is a gold primary. */
(function () {
  const { t, L, R, nm, desc, statLine, feat, ic, art, badge, srcName, OPT, LANG } = window.M;
  const { header, footer, pageHead } = window.SHELL;
  const A2 = OPT === 'A2';
  const surface = document.body.dataset.surface;
  const qs = (on) => (A2 ? '' : 'quiet');

  const allChip = (pressed) =>
    `<button class="chip ${A2 ? '' : 'all'}" aria-pressed="${pressed}">${pressed && !A2 ? ic('check') : ''}${t('all')}</button>`;
  const chip = (label, pressed) =>
    `<button class="chip" aria-pressed="${!!pressed}">${label}</button>`;
  const viewSeg = () =>
    `<div class="seg ${qs()}" role="group"><button aria-pressed="true">${t('viewList')}</button><button aria-pressed="false">${t('viewGrid')}</button></div>`;

  function row(r) {
    const src = r.src !== 'Core' ? `<span class="badge">${srcName(r)}</span>` : '';
    const uq = r.uniq ? `<span class="badge uniq">${t('unique')}</span>` : '';
    const f = feat(r);
    return `<div class="row">${art(r, 56)}<div class="body"><div class="ttl"><b>${nm(r)}</b>${src}${uq}</div>
      <div class="stat">${statLine(r)}</div>${f ? `<div class="feat">${f}</div>` : ''}</div></div>`;
  }

  function filterPanel() {
    const rowF = (lbl, opts, anyPressed = true) =>
      `<div class="frow2"><span class="lbl">${lbl}</span><div class="opts">${allChip(anyPressed)}${opts}</div></div>`;
    return `<div class="panel fpanel" id="fp">
      ${rowF(t('tier'), ['1', '2', '3', '4'].map((n, i) => chip(n, i === 0)).join('') + chip(t('artifacts')), false)}
      ${rowF(t('source'), ['Core', 'Hope & Fear', 'Wondrous Environments', 'Dread GM Toolbox', 'Vault of Ages', "The Dragon's Vault", "Arazo's Artifacts", 'Many Worlds Tavern'].map((s) => chip(s)).join(''))}
      ${rowF(t('cls'), chip(t('phy')) + chip(t('mag')))}
      ${rowF(t('trait'), ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'].map((k) => chip(L({ agility: ['Проворность', 'Agility'], strength: ['Сила', 'Strength'], finesse: ['Искусность', 'Finesse'], instinct: ['Инстинкт', 'Instinct'], presence: ['Влияние', 'Presence'], knowledge: ['Знание', 'Knowledge'] }[k]))).join(''))}
      ${rowF(
        t('range'),
        [
          ['Вплотную', 'Melee'],
          ['Близко', 'Very close'],
          ['Средне', 'Close'],
          ['Далеко', 'Far'],
          ['Очень далеко', 'Very far']
        ]
          .map((p) => chip(L(p)))
          .join('')
      )}
      ${rowF(t('burden'), chip(t('oneH')) + chip(t('twoH')))}
      ${rowF(t('upg'), chip(t('upgOk')) + chip(t('uniques')))}
    </div>`;
  }

  function catalog() {
    const groups = [['gCore'], ['gHnf'], ['gAlt'], ['gSup'], ['gEq'], ['gOther']]
      .map(
        ([k, n]) =>
          `<a href="#" class="chip" ${k === 'gEq' ? 'aria-current="page"' : ''}>${t(k)}</a>`
      )
      .join('');
    const rows = ['q1', 'q2', 'q4', 'q10', 'q16', 'q20', 'q23', 'q26']
      .map((id) => row(R[id]))
      .join('');
    return `${header({ current: 'tables', quietLang: !A2 })}
      <main class="wrap">${pageHead(t('tables'))}
        <nav class="groups" aria-label="${t('tables')}">${groups}</nav>
        <nav class="sub"><a href="#" class="on" aria-current="page">${t('tWeapon')}</a><a href="#">${t('tSecondary')}</a><a href="#">${t('tArmor')}</a></nav>
        <div class="toolbar"><label class="field">${ic('search')}<input placeholder="${t('tblSearch')}"></label>
          <button class="btn">${ic('link')}${t('tableLink')}</button>${viewSeg()}</div>
        <div class="frow"><button class="btn sm on" aria-expanded="true" aria-controls="fp">${ic('filter')}${t('filters')} · 1${ic('chev')}</button>
          <span class="pill">${t('tier1')}<span aria-label="${t('reset')}">${ic('x')}</span></span><button class="btn sm ghost">${t('reset')}</button>
          <span class="count">${t('shown')}</span><button class="btn sm">${ic('check')}${t('select')}</button></div>
        ${filterPanel()}
        <div class="secthead"><h2>${t('tier1')}</h2><button class="btn sm ghost">${ic('link')}${t('link')}</button></div>
        <div class="rows">${rows}</div>
      </main>`;
  }

  function moreMenu() {
    return `<div class="menu" role="menu" style="left:0;min-width:250px">
      <a role="menuitem" href="#">${ic('copy')}${t('copyText')}</a><a role="menuitem" href="#">${ic('copy')}${t('copyName')}</a>
      <a role="menuitem" href="#">${ic('image')}${t('copyImg')}</a><a role="menuitem" href="#">${ic('link')}${t('copyLink')}</a>
      <hr><a role="menuitem" href="#">${ic('sword')}${t('keepCopy')}</a></div>`;
  }

  function item() {
    const r = R.ci1;
    const wide = innerWidth > 640;
    if (wide) {
      return `${header({ current: null, quietLang: !A2 })}
        <main class="wrap"><article class="panel dossier">${art(r)}<div class="txt">
          <h1>${nm(r)}</h1>
          <div class="meta">${badge(r)}<span>Core · ${t('no')} ${r.no}</span><a href="#">${t('showInTable')}</a></div>
          <p class="lead">${desc(r)}</p>
          <div class="acts"><button class="btn primary">${ic('plus')}${t('addList')}${ic('chev')}</button>
            <button class="btn">${ic('share')}${t('share')}</button><button class="btn">${ic('print')}${t('print')}</button>
            <div style="position:relative"><button class="btn on" aria-expanded="true">${ic('more')}${t('more')}${ic('chev')}</button>${moreMenu()}</div></div>
          </div></article></main>`;
    }
    const behind = `${header({ current: 'tables', quietLang: !A2 })}<main class="wrap">${pageHead(t('tables'))}<div class="rows">${['q1', 'q2', 'q4', 'q10'].map((id) => row(R[id])).join('')}</div></main>`;
    return `<div class="sheetwrap">${behind}<div class="scrim"></div>
      <section class="sheet" role="dialog" aria-label="${nm(r)}"><div class="grab"></div>
        <div class="sh"><button class="btn sm ghost">${ic('x')}${t('close')}</button></div>
        <div class="scroll">${art(r)}<h2>${nm(r)}</h2>
          <div class="meta">${badge(r)}<span>Core · ${t('no')} ${r.no}</span><a href="#">${t('showInTable')}</a></div>
          <p class="lead">${desc(r)}</p></div>
        <div class="dock"><button class="btn primary">${ic('plus')}${t('addList')}</button><button class="btn">${ic('share')}${t('share')}</button><button class="btn" aria-label="${t('more')}">${ic('more')}${t('more')}</button></div>
      </section></div>`;
  }

  function resultCard(r) {
    const up = r.up
      ? `<div class="up">${LANG === 'en' ? 'Upgrades to' : 'Улучшается до'}: <a href="#">${L(r.up)}</a></div>`
      : '';
    return `<article class="panel res">${art(r)}<div class="txt"><div class="head"><div class="tags"><span class="badge rno">${t('no')} ${r.no}</span>${badge(r)}<span class="badge">${r.src}</span></div>
      <b class="nm">${nm(r)}</b></div><div class="bodyx"><p>${desc(r)}</p>${up}
      <div class="acts"><button class="btn sm">${ic('plus')}${t('addList')}</button><button class="btn sm">${ic('share')}${t('share')}</button><button class="btn sm">${ic('more')}${t('more')}</button></div></div></div></article>`;
  }

  function roller() {
    const dice = [
      ['1d12', 'common'],
      ['2d12', 'cu'],
      ['3d12', 'ur'],
      ['4d12', 'rl'],
      ['5d12', 'leg']
    ]
      .map(
        ([d, k], i) =>
          `<button class="die ${i === 0 ? (A2 ? 'primary' : 'on') : ''}" ${i === 0 && !A2 ? 'aria-describedby="last"' : ''}><span class="d">${ic('die')}${d}</span><span class="r">${t(k)}</span></button>`
      )
      .join('');
    return `${header({ current: 'std', quietLang: !A2 })}
      <main class="wrap">${pageHead(t('std'))}
        <section class="panel rollpanel"><div class="dice" role="group" aria-label="${t('rollBtn')}">${dice}</div>
          <span class="sr" id="last">${t('lastRoll')}</span>
          <div class="own"><span class="cap2">${t('orEnter')}</span><div class="num" role="group" aria-label="${t('sumField')}"><button aria-label="-1">−</button><output>1</output><button aria-label="+1">+</button></div><span class="cap2">${t('sumField')}, 1-60</span></div>
          <div class="fls"><div class="fl"><span class="lbl">${t('source')}</span>${allChip(true)}${chip('Core')}${chip('Hope & Fear')}</div>
          <div class="fl"><span class="lbl">${t('type')}</span>${allChip(true)}${chip(t('items'))}${chip(t('cons'))}</div></div>
        </section>
        <div class="reshead"><h2>${t('pickOne')}</h2><button class="btn sm">${ic('copy')}${t('copyAll')}</button></div>
        <div class="results">${['ci1', 'cc1', 'hi1', 'hc1'].map((id) => resultCard(R[id])).join('')}</div>
      </main>`;
  }

  function lrow(r, i, o = {}) {
    const src = `<span class="badge">${srcName(r)}</span>`;
    const st = statLine(r, { tier: r.kind === 'weapon' || r.kind === 'armor' });
    const f = feat(r);
    const d =
      r.kind === 'item' || r.kind === 'cons' || r.d ? `<div class="stat">${desc(r)}</div>` : '';
    const note = o.open
      ? `<div class="rnote"><div class="seg quiet" role="group"><button aria-pressed="true">${ic('globe')} ${t('forPlayers')}</button><button aria-pressed="false">${ic('lock')} ${t('gmOnly')}</button></div><div class="ta">${LANG === 'en' ? 'The last one in stock.' : 'Последний в наличии.'}</div></div>`
      : '';
    return `<div class="lrow ${o.open ? 'open' : ''}"><span class="grip">${ic('grip')}</span><span class="pos">${i}</span>${art(r, 48)}
      <div class="body"><div class="ttl"><b>${nm(r)}</b>${badge(r)}${src}${r.uniq ? `<span class="badge uniq">${t('unique')}</span>` : ''}</div>
        ${st ? `<div class="stat">${st}</div>` : ''}${f ? `<div class="stat feat">${f}</div>` : ''}${d}</div>
      <div class="qra"><div class="qp"><label>${t('qty')}<span class="box">${o.q || 1}</span></label><label>${t('price')}<span class="box ${o.p ? '' : 'empty'}">${o.p || '-'}</span></label></div>
      <div class="ra"><button class="btn sm ${o.open ? 'on' : ''}" aria-pressed="${!!o.open}">${ic('note')}${t('note')}</button><button class="btn sm" aria-label="${t('more')}">${ic('more')}</button></div></div>${note}</div>`;
  }

  function list() {
    return `${header({ current: null, signedIn: true, quietLang: !A2 })}
      <main class="wrap">
        <div class="lhead"><div><h1>${t('listName')}</h1><div class="meta2">${t('listMeta')}</div></div></div>
        <div class="ltools"><button class="btn">${ic('share')}${t('share')}${ic('chev')}</button><button class="btn">${ic('print')}${t('print')}</button>
          <button class="btn">${ic('die')}${t('rollList')}</button><button class="btn">${ic('more')}${t('more')}${ic('chev')}</button>
          <span class="seglbl">${t('prices')}<span class="seg quiet" role="group"><button aria-pressed="false">${t('asBook')}</button><button aria-pressed="true">${t('inCoins')}</button></span></span></div>
        <div class="notes"><div class="nt pl"><div class="nh">${ic('globe')}${t('forPlayers')}</div><p>${t('note1')}</p></div>
          <div class="nt gm"><div class="nh">${ic('lock')}${t('gmOnly')}<span class="hint">${t('gmOnlyHint')}</span></div><p>${t('note2')}</p></div></div>
        <div class="lrows">${lrow(R.ci1, 1, { q: 2, p: 150 })}${lrow(R.q1, 2, { open: true })}${lrow(R.q313, 3)}${lrow(R.cc1, 4, { q: 5, p: 20 })}${lrow(R.voa, 5)}${lrow(R.hb1, 6, { p: 800 })}</div>
        <button class="btn addown">${ic('plus')}${t('addOwn')}</button>
      </main>`;
  }

  function headerSurface() {
    return `<div class="cap">${LANG === 'en' ? 'signed out · Standard rules' : 'не вошли · Обычные правила'}</div>
      <div class="frame">${header({ current: 'std', static: true, quietLang: !A2 })}<main class="wrap" style="padding:18px 0 14px">${pageHead(t('std'))}</main></div>
      <div class="cap">${LANG === 'en' ? 'signed in · Tables · account menu open' : 'вошли · Таблицы · меню аккаунта открыто'}</div>
      <div class="frame" style="min-height:330px">${header({ current: 'tables', static: true, signedIn: true, menuOpen: true, quietLang: !A2 })}</div>
      <div class="cap">${LANG === 'en' ? 'signed in · Account page: the account control is lit, no tab is' : 'вошли · страница аккаунта: горит кнопка аккаунта, не вкладка'}</div>
      <div class="frame">${header({ current: null, static: true, signedIn: true, here: true, quietLang: !A2 })}</div>`;
  }

  const editor = () =>
    header({ current: null, signedIn: true, quietLang: !A2 }) + window.EDITOR('A');
  const S = { header: headerSurface, catalog, item, roller, list, editor };
  document.body.insertAdjacentHTML(
    'afterbegin',
    S[surface]() + (surface === 'header' ? '' : footer())
  );
})();
