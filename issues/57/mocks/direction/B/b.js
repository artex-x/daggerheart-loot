/* Direction B surfaces (B1 default; B2 swaps the shell for a rail). The gold
   budget is A1's strict one. */
(function () {
  const { t, L, R, nm, desc, statLine, feat, ic, art, badge, srcName, LANG } = window.M;
  const { page, pageHead, header, B2 } = window.SHELL;
  const surface = document.body.dataset.surface;
  const TR = { agility: ['Проворность', 'Agility'], strength: ['Сила', 'Strength'], finesse: ['Искусность', 'Finesse'], instinct: ['Инстинкт', 'Instinct'], presence: ['Влияние', 'Presence'], knowledge: ['Знание', 'Knowledge'] };
  const RG = { melee: ['Вплотную', 'Melee'], veryclose: ['Близко', 'Very close'], close: ['Средне', 'Close'], far: ['Далеко', 'Far'], veryfar: ['Очень далеко', 'Very far'] };
  const allChip = (p) => `<button class="chip all" aria-pressed="${p}">${p ? ic('check') : ''}${t('all')}</button>`;
  const chip = (label, p) => `<button class="chip" aria-pressed="${!!p}">${label}</button>`;
  const dt = (r) => `${r.dmg} ${LANG === 'en' ? (r.dt === 'mag' ? 'mag' : 'phy') : r.dt === 'mag' ? 'маг' : 'физ'}`;

  function filterGroups() {
    const g = (lbl, opts, any = true) => `<div class="fgrp"><span class="lbl">${lbl}</span><div class="opts">${allChip(any)}${opts}</div></div>`;
    return `${g(t('tier'), ['1', '2', '3', '4'].map((n, i) => chip(n, i === 0)).join('') + chip(t('artifacts')), false)}
      ${g(t('source'), ['Core', 'Hope & Fear', 'Wondrous Environments', 'Dread GM Toolbox', 'Vault of Ages', "The Dragon's Vault", "Arazo's Artifacts", 'Many Worlds Tavern'].map((s) => chip(s)).join(''))}
      ${g(t('cls'), chip(t('phy')) + chip(t('mag')))}
      ${g(t('trait'), Object.values(TR).map((p) => chip(L(p))).join(''))}
      ${g(t('range'), Object.values(RG).map((p) => chip(L(p))).join(''))}
      ${g(t('burden'), chip(t('oneH')) + chip(t('twoH')))}
      ${g(t('upg'), chip(t('upgOk')) + chip(t('uniques')))}`;
  }

  function catalog() {
    const ids = ['q1', 'q2', 'q4', 'q10', 'q16', 'q20', 'q23', 'q26'];
    const groups = ['gCore', 'gHnf', 'gAlt', 'gSup', 'gEq', 'gOther'].map((k) => `<a href="#" class="chip" ${k === 'gEq' ? 'aria-current="page"' : ''}>${t(k)}</a>`).join('');
    const tr = ids.map((id) => {
      const r = R[id];
      const f = feat(r);
      return `<tr><td><div class="nm">${art(r, 48)}<div><b>${nm(r)}</b>${r.src !== 'Core' ? `<span class="src">${r.src}</span>` : ''}${f ? `<div class="feat">${f}</div>` : ''}</div></div></td>
        <td class="n">${L(TR[r.tr])}</td><td class="n">${L(RG[r.rg])}</td><td class="d">${dt(r)}</td><td class="n">${r.bu === 2 ? t('twoH') : t('oneH')}</td></tr>`;
    }).join('');
    const rows = ids.slice(0, 6).map((id) => {
      const r = R[id];
      const f = feat(r);
      return `<div class="row">${art(r, 48)}<div><b>${nm(r)}</b>${r.src !== 'Core' ? ` <span class="src">${r.src}</span>` : ''}<div class="stat">${statLine(r)}</div>${f ? `<div class="feat">${f}</div>` : ''}</div></div>`;
    }).join('');
    const main = `<main class="wrap">${pageHead(t('tables'))}
      <nav class="groups">${groups}</nav>
      <nav class="sub"><a href="#" class="on" aria-current="page">${t('tWeapon')}</a><a href="#">${t('tSecondary')}</a><a href="#">${t('tArmor')}</a></nav>
      <div class="cat"><aside class="panel fside" aria-label="${t('filters')}"><div class="fh"><b>${t('filters')} · 1</b><button class="btn sm ghost">${t('reset')}</button></div>${filterGroups()}</aside>
      <div><div class="toolbar"><label class="field">${ic('search')}<input placeholder="${t('tblSearch')}"></label><button class="btn">${ic('link')}${t('tableLink')}</button>
        <div class="seg quiet"><button aria-pressed="true">${t('viewList')}</button><button aria-pressed="false">${t('viewGrid')}</button></div></div>
        <div class="frow"><button class="btn sm fbtn">${ic('filter')}${t('filters')} · 1</button><span class="pill">${t('tier1')}${ic('x')}</span><span class="count">${t('shown')}</span><button class="btn sm">${ic('check')}${t('select')}</button></div>
        <div class="secth"><h2>${t('tier1')}</h2><button class="btn sm ghost">${ic('link')}${t('link')}</button></div>
        <table class="ct"><thead><tr><th>${t('name')}</th><th>${t('trait')}</th><th>${t('range')}</th><th>${t('dmg')}</th><th>${t('burden')}</th></tr></thead><tbody>${tr}</tbody></table>
        <div class="rows360">${rows}</div>
        <div class="fsheet"><div class="cap" style="width:auto;margin:0 0 8px">${LANG === 'en' ? 'Filters pressed: the sheet' : 'нажаты «Фильтры»: лист'}</div><section class="sheet" role="dialog" aria-label="${t('filters')}"><div class="grab"></div>
          <div class="sh"><b>${t('filters')}</b><button class="btn sm ghost">${ic('x')}${t('close')}</button></div>${filterGroups()}
          <div class="dock"><button class="btn">${t('reset')}</button><button class="btn primary">${LANG === 'en' ? 'Show 91' : 'Показать 91'}</button></div></section></div>
      </div></div></main>`;
    return page({ job: 'tables' }, main);
  }

  function resultCard(r) {
    const up = r.up ? `<div class="stat">${LANG === 'en' ? 'Upgrades to' : 'Улучшается до'}: <a href="#">${L(r.up)}</a></div>` : '';
    return `<article class="panel res">${art(r)}<div class="txt"><div class="tags"><span class="badge rno">${t('no')} ${r.no}</span>${badge(r)}<span class="badge">${r.src}</span></div>
      <b class="nm">${nm(r)}</b><p>${desc(r)}</p>${up}
      <div class="acts"><button class="btn sm">${ic('plus')}${t('addList')}</button><button class="btn sm">${ic('share')}${t('share')}</button><button class="btn sm">${ic('more')}${t('more')}</button></div></div></article>`;
  }

  function roller() {
    const dice = [['1d12', 'common'], ['2d12', 'cu'], ['3d12', 'ur'], ['4d12', 'rl'], ['5d12', 'leg']]
      .map(([d, k], i) => `<button class="die ${i === 0 ? 'on' : ''}"><span class="d">${ic('die')}${d}</span><span class="r">${t(k)}</span></button>`).join('');
    const main = `<main class="wrap">${pageHead(t('std'))}<div class="two">
      <section class="panel ctrl"><span class="lbl">${t('rollBtn')}</span><div class="dice">${dice}</div>
        <span class="lbl">${t('orEnter')}</span><div class="own"><div class="num" role="group" aria-label="${t('sumField')}"><button>−</button><output>1</output><button>+</button></div><span class="cap2">${t('sumField')},<br>1-60</span></div>
        <span class="lbl">${t('source')}</span><div class="fl">${allChip(true)}${chip('Core')}${chip('Hope & Fear')}</div>
        <span class="lbl">${t('type')}</span><div class="fl">${allChip(true)}${chip(t('items'))}${chip(t('cons'))}</div></section>
      <section><div class="reshead"><h2>${t('pickOne')}</h2><button class="btn sm">${ic('copy')}${t('copyAll')}</button></div>
        <div class="results">${['ci1', 'cc1', 'hi1', 'hc1'].map((id) => resultCard(R[id])).join('')}</div></section></div></main>`;
    return page({ job: 'roll', mode: 'std' }, main);
  }

  function item() {
    const r = R.ci1;
    const meta = `<div class="meta">${badge(r)}<span>Core · ${t('no')} ${r.no}</span><a href="#">${t('showInTable')}</a></div>`;
    if (innerWidth > 760) {
      const main = `<main class="wrap"><article class="dossier">${art(r)}<div class="txt"><h1>${nm(r)}</h1>${meta}<p class="lead">${desc(r)}</p>
        <div class="acts"><button class="btn primary">${ic('plus')}${t('addList')}${ic('chev')}</button><button class="btn">${ic('share')}${t('share')}</button><button class="btn">${ic('print')}${t('print')}</button><button class="btn">${ic('more')}${t('more')}${ic('chev')}</button></div>
        </div></article></main>`;
      return page({ job: null }, main);
    }
    const behind = header({ job: 'tables' }) + `<main class="wrap">${pageHead(t('tables'))}</main>`;
    return `<div class="sheetwrap">${behind}<div class="scrim"></div><section class="sheet" role="dialog" aria-label="${nm(r)}"><div class="grab"></div>
      <div class="sh"><button class="btn sm ghost">${ic('x')}${t('close')}</button></div>
      <div class="scroll">${art(r)}<h2>${nm(r)}</h2>${meta}<p class="lead" style="font-size:16px">${desc(r)}</p></div>
      <div class="dock"><button class="btn primary">${ic('plus')}${t('addList')}</button><button class="btn">${ic('share')}${t('share')}</button><button class="btn">${ic('more')}${t('more')}</button></div></section></div>`;
  }

  function list() {
    const ents = [[R.ci1, 2, 150], [R.q1, 1, 0, true], [R.q313, 1], [R.cc1, 5, 20], [R.voa, 1], [R.hb1, 1, 800]];
    const lt = ents.map(([r, q, p, open], i) => {
      const st = r.kind === 'weapon' || r.kind === 'armor' ? statLine(r, { tier: true }) : desc(r);
      const row = `<tr class="${open ? 'open' : ''}"><td class="pos">${i + 1}</td><td><div class="nm">${art(r, 44)}<div><b>${nm(r)}</b> ${badge(r)} <span class="src">${srcName(r)}</span>${r.uniq ? ` <span class="badge uniq">${t('unique')}</span>` : ''}<div class="stat">${st}</div></div></div></td>
        <td><span class="box">${q}</span></td><td><span class="box ${p ? '' : 'empty'}">${p || '-'}</span></td>
        <td><div class="ra"><button class="btn sm ${open ? 'on' : ''}" aria-pressed="${!!open}">${ic('note')}${t('note')}</button><button class="btn sm" aria-label="${t('more')}">${ic('more')}</button></div></td></tr>`;
      const note = open ? `<tr class="noter"><td></td><td colspan="4"><div class="seg quiet"><button aria-pressed="true">${ic('globe')} ${t('forPlayers')}</button><button aria-pressed="false">${ic('lock')} ${t('gmOnly')}</button></div><div class="ta">${LANG === 'en' ? 'The last one in stock.' : 'Последний в наличии.'}</div></td></tr>` : '';
      return row + note;
    }).join('');
    const l3 = ents.map(([r, q, p]) => `<div class="lr">${art(r, 44)}<div><b>${nm(r)}</b> ${badge(r)}<div class="stat">${r.kind === 'weapon' || r.kind === 'armor' ? statLine(r, { tier: true }) : desc(r)}</div></div>
      <div class="q"><label>${t('qty')}<span class="box">${q}</span></label><label>${t('price')}<span class="box">${p || '-'}</span></label><div class="ra"><button class="btn sm">${ic('note')}${t('note')}</button><button class="btn sm" aria-label="${t('more')}">${ic('more')}</button></div></div></div>`).join('');
    const main = `<main class="wrap"><div class="lgrid">
      <aside class="panel laside"><h1>${t('listName')}</h1><div class="meta2">${t('listMeta')}</div>
        <div class="stack"><button class="btn">${ic('share')}${t('share')}</button><button class="btn">${ic('print')}${t('print')}</button><button class="btn">${ic('die')}${t('rollList')}</button><button class="btn">${ic('more')}${t('more')}</button></div>
        <div class="seglbl">${t('prices')}<span class="seg quiet"><button aria-pressed="false">${t('asBook')}</button><button aria-pressed="true">${t('inCoins')}</button></span></div>
        <div class="nt pl"><div class="nh">${ic('globe')}${t('forPlayers')}</div><p>${t('note1')}</p></div>
        <div class="nt gm"><div class="nh">${ic('lock')}${t('gmOnly')}<span class="hint">${t('gmOnlyHint')}</span></div><p>${t('note2')}</p></div></aside>
      <section class="lmain"><table class="lt"><thead><tr><th>№</th><th>${t('name')}</th><th>${t('qty')}</th><th>${t('price')}</th><th></th></tr></thead><tbody>${lt}</tbody></table>
        <div class="lrows360">${l3}</div><button class="btn" style="margin-top:12px">${ic('plus')}${t('addOwn')}</button></section></div></main>`;
    return page({ job: null, signedIn: true }, main);
  }

  function headerSurface() {
    if (B2) return page({ job: 'roll', mode: 'std', signedIn: true }, `<main class="wrap">${pageHead(t('std'))}<p class="stat">${LANG === 'en' ? 'The roll page sits here.' : 'Здесь страница броска.'}</p></main>`);
    const cap = (ru, en) => `<div class="cap">${LANG === 'en' ? en : ru}</div>`;
    return `${cap('не вошли · Бросок · Обычные правила', 'signed out · Roll · Standard rules')}<div class="frame">${header({ job: 'roll', mode: 'std', static: true })}<main class="wrap" style="padding:18px 0 10px">${pageHead(t('std'))}</main></div>
      ${cap('вошли · Бросок · Vault of Ages', 'signed in · Roll · Vault of Ages')}<div class="frame">${header({ job: 'roll', mode: 'voa', static: true, signedIn: true })}</div>
      ${cap('вошли · Таблицы · меню аккаунта открыто', 'signed in · Tables · account menu open')}<div class="frame" style="min-height:330px">${header({ job: 'tables', static: true, signedIn: true, menuOpen: true })}</div>`;
  }

  const editor = () => page({ job: null, signedIn: true }, window.EDITOR('B'));
  const S = { header: headerSurface, catalog, item, roller, list, editor };
  window.BX = Object.assign(S, { resultCard });
  if (!window.DEFER) document.body.insertAdjacentHTML('afterbegin', S[surface]());
})();
