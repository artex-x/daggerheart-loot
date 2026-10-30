/* The recommendation R: B1's shell and work areas, A1's strict gold budget,
   Source Sans 3, and one graft from C - a roll result is drawn as the card it
   prints as (art fading into the plate), with the name in title case.

   The roll mode row (owner critique, 2026-10-23): the two rule sets stay as
   two chips; the seven supplements fold into one «Дополнения ▾» chip that
   opens a menu, and the chip shows the active supplement's name. `?opt=alt`
   draws the alternative: all nine modes in one row that scrolls sideways. */
(function () {
  const { t, R, ic, LANG, OPT } = window.M;
  const { page, pageHead, header, footer } = window.SHELL;
  const BX = window.BX;
  const scard = window.CX.scard;
  const surface = document.body.dataset.surface;
  const ALT = OPT === 'alt';

  const SUPS = [
    ['wond', 'Wondrous Environments'],
    ['dread', 'Dread GM Toolbox'],
    ['voa', 'Vault of Ages'],
    ['dv', "The Dragon's Vault"],
    ['arazo', "Arazo's Artifacts"],
    ['comm', LANG === 'en' ? 'Community items' : 'Предметы сообществ'],
    ['mwt', 'Many Worlds Tavern']
  ];
  const KEY = { [t('std')]: 'std', [t('altLong')]: 'alt', [t('alt')]: 'alt' };
  for (const [k, l] of SUPS) KEY[l] = k;

  function modeRow(cur, open) {
    const chip = (k, label) =>
      `<a href="#" class="chip" ${k === cur ? 'aria-current="page"' : ''}>${label}</a>`;
    if (ALT) {
      return `<nav class="modes ralt" aria-label="${t('modes')}">${chip('std', t('std'))}${chip('alt', t('alt'))}<span class="msep" aria-hidden="true"></span><span class="mlbl">${t('sup')}</span>${SUPS.map(([k, l]) => chip(k, l)).join('')}</nav>`;
    }
    const sup = SUPS.find(([k]) => k === cur);
    const menu = open
      ? `<div class="menu supmenu" role="group" aria-label="${t('sup')}"><div class="mh">${t('sup')}</div>${SUPS.map(([k, l]) => `<a href="#" class="${k === cur ? 'hl' : ''}" ${k === cur ? 'aria-current="page"' : ''}>${k === cur ? ic('check') : '<span class="ck"></span>'}${l}</a>`).join('')}</div>`
      : '';
    return `<nav class="modes r3" aria-label="${t('modes')}">${chip('std', t('std'))}${chip('alt', t('alt'))}<div class="supw"><button class="chip sup ${sup ? 'cur' : ''} ${open ? 'open' : ''}" aria-expanded="${!!open}" aria-label="${t('sup')}${sup ? ': ' + sup[1] : ''}"><span>${sup ? sup[1] : t('sup')}</span>${ic('chev')}</button>${menu}</div></nav>`;
  }

  /* Rewrites every mode row B's shell drew into R's shape, keeping its
     current mode. */
  function fixModes(html, open) {
    return html.replace(/<nav class="modes"[\s\S]*?<\/nav>/g, (m) => {
      const cur = (m.match(/aria-current="page">([^<]+)</) || [])[1];
      return modeRow(KEY[cur] || null, open);
    });
  }
  const rpage = (opts, main) => fixModes(page(opts, main), opts.supOpen);
  const rheader = (opts) => fixModes(header(opts), opts.supOpen);

  function roller(o = {}) {
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
    const allChip = `<button class="chip all" aria-pressed="true">${ic('check')}${t('all')}</button>`;
    const chip = (l) => `<button class="chip" aria-pressed="false">${l}</button>`;
    const hand = ['ci1', 'cc1', 'hi1', 'hc1']
      .map(
        (id) =>
          `<div class="dealt">${scard(R[id])}<div class="cardacts"><button class="btn sm">${ic('plus')}${t('addList')}</button><button class="btn sm">${ic('share')}${t('share')}</button><button class="btn sm" aria-label="${t('more')}">${ic('more')}</button></div></div>`
      )
      .join('');
    const main = `<main class="wrap">${pageHead(t('std'))}<div class="two">
      <section class="panel ctrl"><span class="lbl">${t('rollBtn')}</span><div class="dice">${dice}</div>
        <span class="lbl">${t('orEnter')}</span><div class="own"><div class="num" role="group" aria-label="${t('sumField')}"><button>−</button><output>1</output><button>+</button></div><span class="cap2">${t('sumField')},<br>1-60</span></div>
        <span class="lbl">${t('source')}</span><div class="fl">${allChip}${chip('Core')}${chip('Hope & Fear')}</div>
        <span class="lbl">${t('type')}</span><div class="fl">${allChip}${chip(t('items'))}${chip(t('cons'))}</div></section>
      <section><div class="reshead"><h2>${t('pickOne')}</h2><button class="btn sm">${ic('copy')}${t('copyAll')}</button></div>
        <div class="hand2">${hand}</div></section></div></main>`;
    return rpage({ job: 'roll', mode: 'std', supOpen: o.supOpen }, main);
  }

  function headerSurface() {
    const cap = (ru, en) => `<div class="cap">${LANG === 'en' ? en : ru}</div>`;
    const f = (opts, extra = '', h = '') =>
      `<div class="frame" ${h ? `style="min-height:${h}px"` : ''}>${rheader({ static: true, ...opts })}${extra}</div>`;
    if (ALT) {
      return `${cap('вариант: одна прокручиваемая строка · не вошли · Обычные правила', 'alternative: one scrolling row · signed out · Standard rules')}${f({ job: 'roll', mode: 'std' }, `<main class="wrap" style="padding:18px 0 10px">${pageHead(t('std'))}</main>`)}
        ${cap('вариант · вошли · Vault of Ages: строка прокручена к текущему', 'alternative · signed in · Vault of Ages: the row scrolls to the current mode')}${f({ job: 'roll', mode: 'voa', signedIn: true })}`;
    }
    return `${cap('не вошли · Бросок · Обычные правила', 'signed out · Roll · Standard rules')}${f({ job: 'roll', mode: 'std' }, `<main class="wrap" style="padding:18px 0 10px">${pageHead(t('std'))}</main>`)}
      ${cap('вошли · Бросок · Vault of Ages: чип показывает дополнение', 'signed in · Roll · Vault of Ages: the chip shows the supplement')}${f({ job: 'roll', mode: 'voa', signedIn: true })}
      ${cap('вошли · нажат «Дополнения»: меню семи дополнений', 'signed in · Supplements pressed: the menu of seven')}${f({ job: 'roll', mode: 'voa', signedIn: true, supOpen: true }, '', 480)}
      ${cap('вошли · Таблицы · меню аккаунта открыто', 'signed in · Tables · account menu open')}${f({ job: 'tables', signedIn: true, menuOpen: true }, '', 330)}`;
  }

  window.RX = { modeRow, fixModes, rpage, rheader, roller, SUPS, footer };

  const editor = () => rpage({ job: null, signedIn: true }, window.EDITOR('B'));
  const S = {
    header: headerSurface,
    catalog: () => fixModes(BX.catalog()),
    item: () => fixModes(BX.item()),
    list: () => fixModes(BX.list()),
    roller: () => roller(),
    editor,
    state: () => window.RSTATE()
  };
  document.body.insertAdjacentHTML('afterbegin', S[surface]());
  addEventListener('DOMContentLoaded', () => {
    for (const nav of document.querySelectorAll('.modes.ralt')) {
      const on = nav.querySelector('[aria-current="page"]');
      if (on && nav.scrollWidth > nav.clientWidth)
        nav.scrollLeft = Math.max(0, on.offsetLeft - 16);
    }
  });
})();
