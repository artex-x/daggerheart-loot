/* Direction C surfaces. C1 (default): the screen card everywhere. C2
   (`?opt=C2`): the item page shows the real printed card (cropped from the S1
   capture of #/p/<id>), not a screen version. The tier banner here is drawn
   for the mock only; the build would reuse the exported vectors. */
(function () {
  const { t, L, R, nm, desc, statLine, feat, ic, art, badge, srcName, LANG, OPT } = window.M;
  const { header, footer, pageHead } = window.SHELL;
  const C2 = OPT === 'C2';
  const surface = document.body.dataset.surface;
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
  const allChip = (p) =>
    `<button class="chip all" aria-pressed="${p}">${p ? ic('check') : ''}${t('all')}</button>`;
  const chip = (label, p) => `<button class="chip" aria-pressed="${!!p}">${label}</button>`;

  function scard(r, o = {}) {
    const rib =
      r.kind === 'weapon'
        ? `<div class="rib"><div><small>${t('dmg')}</small><span>${r.dmg} ${LANG === 'en' ? (r.dt === 'mag' ? 'mag' : 'phy') : r.dt === 'mag' ? 'маг' : 'физ'}</span></div><div><small>${LANG === 'en' ? 'Trait' : 'Черта'}</small><span>${L(TR[r.tr])}</span></div><div><small>${t('range')}</small><span>${L(RG[r.rg])}</span></div></div>`
        : r.kind === 'armor'
          ? `<div class="rib"><div><small>${LANG === 'en' ? 'Thresholds' : 'Пороги'}</small><span>${r.th}</span></div><div><small>${LANG === 'en' ? 'Armor' : 'Броня'}</small><span>${r.as}</span></div><div><small>${t('burden')}</small><span>-</span></div></div>`
          : '';
    const tier =
      r.kind === 'weapon' || r.kind === 'armor'
        ? `<div class="tier">${r.tier || 1}<small>${t('tier')}</small></div>`
        : '';
    const f = feat(r);
    const text = o.short
      ? ''
      : `<p>${r.kind === 'weapon' || r.kind === 'armor' ? f : desc(r)}</p>`;
    const H = o.h1 ? 'h1' : 'h3';
    return `<article class="scard">${art(r)}${tier}${r.no && !o.short ? `<span class="badge rno">${t('no')} ${r.no}</span>` : ''}<div class="body"><div class="kind">${badge(r)}${r.uniq ? `<span class="badge uniq">${t('unique')}</span>` : ''}</div>
      <${H} class="nm">${nm(r)}</${H}>${rib}${text}<div class="foot2"><span>Daggerheart</span><span>${srcName(r)}</span></div></div></article>`;
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
          `<button class="die ${i === 0 ? 'on' : ''}"><span class="d">${ic('die')}${d}</span><span class="r">${t(k)}</span></button>`
      )
      .join('');
    const hand = ['ci1', 'cc1', 'hi1', 'hc1']
      .map(
        (id) =>
          `<div>${scard(R[id])}<div class="cardacts"><button class="btn sm">${ic('plus')}${t('addList')}</button><button class="btn sm" aria-label="${t('more')}">${ic('more')}</button></div></div>`
      )
      .join('');
    return `${header({ current: 'std', quietLang: true })}<main class="wrap">${pageHead(t('std'))}
      <section class="panel rollpanel"><div class="dice">${dice}</div>
        <div class="own"><span class="cap2">${t('orEnter')}</span><div class="num"><button>−</button><output>1</output><button>+</button></div><span class="cap2">${t('sumField')}, 1-60</span></div>
        <div class="fls"><div class="fl"><span class="lbl">${t('source')}</span>${allChip(true)}${chip('Core')}${chip('Hope & Fear')}</div><div class="fl"><span class="lbl">${t('type')}</span>${allChip(true)}${chip(t('items'))}${chip(t('cons'))}</div></div></section>
      <div class="reshead"><h2>${t('pickOne')}</h2><button class="btn sm">${ic('copy')}${t('copyAll')}</button></div>
      <div class="hand">${hand}</div><div class="handdots" aria-hidden="true"><i class="on"></i><i></i><i></i><i></i></div></main>`;
  }

  function paper(r) {
    return `<img class="paper" src="../shared/printcard-${r.id}${LANG === 'en' ? '-en' : ''}.png" alt="${nm(r)}">`;
  }

  function item() {
    const r = R.q1;
    const meta = `<div class="meta"><span>Core · ${LANG === 'en' ? 'Primary weapons' : 'Основное оружие'} · ${t('tier1')}</span><a href="#">${t('showInTable')}</a></div>`;
    const acts = `<div class="acts"><button class="btn primary">${ic('plus')}${t('addList')}${ic('chev')}</button><button class="btn">${ic('share')}${t('share')}</button><button class="btn">${ic('print')}${t('print')}</button><button class="btn">${ic('more')}${t('more')}${ic('chev')}</button></div>`;
    const face = C2 ? paper(r) : scard(r, { h1: true });
    if (innerWidth > 760) {
      return `${header({ current: null, quietLang: true })}<main class="wrap"><div class="cardpage">${face}<div class="side">${C2 ? `<h1>${nm(r)}</h1>` : ''}${meta}
        <p class="lead stat">${statLine(r, { tier: true })}</p>${acts}</div></div></main>${footer()}`;
    }
    const behind = `${header({ current: 'tables', quietLang: true })}<main class="wrap">${pageHead(t('tables'))}</main>`;
    return `<div class="sheetwrap">${behind}<div class="scrim"></div><section class="sheet csheet" role="dialog" aria-label="${nm(r)}"><div class="grab"></div>
      <div class="sh"><button class="btn sm ghost">${ic('x')}${t('close')}</button></div>
      <div class="scroll">${face}${C2 ? `<h2>${nm(r)}</h2>` : ''}${meta}</div>
      <div class="dock"><button class="btn primary">${ic('plus')}${t('addList')}</button><button class="btn">${ic('share')}${t('share')}</button><button class="btn">${ic('more')}${t('more')}</button></div></section></div>`;
  }

  function catalog() {
    const groups = ['gCore', 'gHnf', 'gAlt', 'gSup', 'gEq', 'gOther']
      .map(
        (k) =>
          `<a href="#" class="chip" ${k === 'gEq' ? 'aria-current="page"' : ''}>${t(k)}</a>`
      )
      .join('');
    const rowF = (lbl, opts, any = true) =>
      `<div class="frow2"><span class="lbl">${lbl}</span><div class="opts">${allChip(any)}${opts}</div></div>`;
    const panel = `<div class="panel fpanel">${rowF(t('tier'), ['1', '2', '3', '4'].map((n, i) => chip(n, i === 0)).join('') + chip(t('artifacts')), false)}
      ${rowF(t('source'), ['Core', 'Hope & Fear', 'Wondrous Environments', 'Dread GM Toolbox', 'Vault of Ages'].map((s) => chip(s)).join(''))}
      ${rowF(
        t('range'),
        Object.values(RG)
          .map((p) => chip(L(p)))
          .join('')
      )}
      ${rowF(t('burden'), chip(t('oneH')) + chip(t('twoH')))}</div>`;
    const cards = ['q1', 'q2', 'q4', 'q10', 'q16', 'q20', 'q23', 'q26', 'q13', 'q313']
      .filter((id) => R[id].kind === 'weapon')
      .map((id) => scard(R[id], { short: true }))
      .join('');
    return `${header({ current: 'tables', quietLang: true })}<main class="wrap">${pageHead(t('tables'))}<nav class="groups">${groups}</nav>
      <nav class="sub"><a href="#" class="on">${t('tWeapon')}</a><a href="#">${t('tSecondary')}</a><a href="#">${t('tArmor')}</a></nav>
      <div class="toolbar"><label class="field">${ic('search')}<input placeholder="${t('tblSearch')}"></label><button class="btn">${ic('link')}${t('tableLink')}</button>
        <div class="seg quiet"><button aria-pressed="false">${t('viewList')}</button><button aria-pressed="true">${t('viewGrid')}</button></div></div>
      <div class="frow"><button class="btn sm on" aria-expanded="true">${ic('filter')}${t('filters')} · 1${ic('chev')}</button><span class="pill">${t('tier1')}${ic('x')}</span><button class="btn sm ghost">${t('reset')}</button><span class="count">${t('shown')}</span></div>
      ${panel}<div class="secthead"><h2>${t('tier1')}</h2></div><div class="cgrid">${cards}</div></main>${footer()}`;
  }

  function list() {
    const ents = [
      [R.ci1, 2, 150],
      [R.q1, 1],
      [R.q313, 1],
      [R.cc1, 5, 20],
      [R.voa, 1],
      [R.hb1, 1, 800]
    ];
    const cards = ents
      .map(
        ([r, q, p]) =>
          `<div>${scard(r)}<div class="q"><span class="box"><small>${t('qty')}</small>${q}</span><span class="box"><small>${t('price')}</small>${p || '-'}</span><button class="btn sm" aria-label="${t('more')}">${ic('more')}</button></div></div>`
      )
      .join('');
    return `${header({ current: null, signedIn: true, quietLang: true })}<main class="wrap">
      <div class="lhead"><div><h1>${t('listName')}</h1><div class="meta2">${t('listMeta')}</div></div></div>
      <div class="ltools"><button class="btn">${ic('share')}${t('share')}${ic('chev')}</button><button class="btn">${ic('print')}${t('print')}</button><button class="btn">${ic('die')}${t('rollList')}</button><button class="btn">${ic('more')}${t('more')}${ic('chev')}</button>
        <span class="seglbl">${t('prices')}<span class="seg quiet"><button aria-pressed="false">${t('asBook')}</button><button aria-pressed="true">${t('inCoins')}</button></span></span></div>
      <div class="notes"><div class="nt pl"><div class="nh">${ic('globe')}${t('forPlayers')}</div><p>${t('note1')}</p></div><div class="nt gm"><div class="nh">${ic('lock')}${t('gmOnly')}<span class="hint">${t('gmOnlyHint')}</span></div><p>${t('note2')}</p></div></div>
      <div class="lhand">${cards}</div><button class="btn addown" style="margin-top:14px">${ic('plus')}${t('addOwn')}</button></main>${footer()}`;
  }

  function headerSurface() {
    return `<div class="cap">${LANG === 'en' ? 'C keeps the A shell · signed out · Standard rules' : 'C берёт оболочку A · не вошли · Обычные правила'}</div>
      <div class="frame">${header({ current: 'std', static: true, quietLang: true })}<main class="wrap" style="padding:18px 0 14px">${pageHead(t('std'))}</main></div>
      <div class="cap">${LANG === 'en' ? 'signed in · Tables · account menu open' : 'вошли · Таблицы · меню аккаунта открыто'}</div>
      <div class="frame" style="min-height:330px">${header({ current: 'tables', static: true, signedIn: true, menuOpen: true, quietLang: true })}</div>`;
  }

  const editor = () =>
    header({ current: null, signedIn: true, quietLang: true }) + window.EDITOR('C') + footer();
  const S = { header: headerSurface, catalog, item, roller, list, editor };
  window.CX = Object.assign(S, { scard });
  if (!window.DEFER) document.body.insertAdjacentHTML('afterbegin', S[surface]());
})();
