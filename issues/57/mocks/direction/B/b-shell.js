/* Direction B shell: three jobs (Roll, Tables, Search) instead of five tabs;
   the nine roll sections become one row of modes under "Roll". Every section
   keeps its own address. Option B2 (`?opt=B2`): a left rail on wide screens
   and a bottom bar of the three jobs on phones. */
(function () {
  const { t, ic, star, LANG, OPT } = window.M;
  const B2 = OPT === 'B2';

  const MODES = [
    ['std', t('std')],
    ['alt', t('altLong')],
    ['wond', 'Wondrous Environments'],
    ['dread', 'Dread GM Toolbox'],
    ['voa', 'Vault of Ages'],
    ['dv', "The Dragon's Vault"],
    ['arazo', "Arazo's Artifacts"],
    ['comm', LANG === 'en' ? 'Community items' : 'Предметы сообществ'],
    ['mwt', 'Many Worlds Tavern']
  ];
  const JOBS = [['roll', 'die'], ['tables', 'table'], ['search', 'search']];

  function lang() {
    return `<div class="seg quiet" role="group" aria-label="Язык / Language"><button aria-pressed="${LANG === 'ru'}">RU</button><button aria-pressed="${LANG === 'en'}">EN</button></div>`;
  }
  function account(signedIn, open, here) {
    if (!signedIn) return `<button class="acct">${ic('user')}<span>${t('signIn')}</span></button>`;
    const menu = open
      ? `<div class="menu" role="menu"><div class="who">${t('signedAs')}<b>gm1@example.test</b></div>
          <a role="menuitem" class="hl" href="#">${ic('list')}${t('menuLists')}<span class="n">3</span></a>
          <a role="menuitem" href="#">${ic('sword')}${t('myItems')}<span class="n">12</span></a>
          <a role="menuitem" href="#">${ic('user')}${t('account')}</a><hr><a role="menuitem" href="#">${t('signOut')}</a></div>`
      : '';
    return `<div style="position:relative"><button class="acct ${open ? 'open' : ''} ${here ? 'here' : ''}" aria-haspopup="menu" aria-expanded="${!!open}" aria-label="${t('account')}: gm1@example.test"><span class="ini">G</span>${ic('chev')}</button>${menu}</div>`;
  }
  const jobs = (cur) => JOBS.map(([k, i]) => `<a href="#" class="${k === cur ? 'on' : ''}" ${k === cur ? 'aria-current="page"' : ''}>${ic(i)}<span>${t(k)}</span></a>`).join('');
  function modes(cur) {
    const chip = ([k, label]) => `<a href="#" class="chip" ${k === cur ? 'aria-current="page"' : ''}>${label}</a>`;
    return `<nav class="modes" aria-label="${t('modes')}">${MODES.slice(0, 2).map(chip).join('')}<span class="msep" aria-hidden="true"></span><span class="mlbl">${t('sup')}</span>${MODES.slice(2).map(chip).join('')}</nav>`;
  }

  /* opts: job ('roll'|'tables'|'search'|null), mode, signedIn, menuOpen, here, static */
  function header(opts = {}) {
    if (B2) return '';
    const modeRow = opts.job === 'roll' ? `<div class="moderow"><div class="wrap">${modes(opts.mode)}</div></div>` : '';
    return `<header class="top ${opts.static ? 'static' : ''}"><div class="wrap bar">
        <a class="brand" href="#">${star()}<span><b>${t('brand')}</b><small>${t('brandSub')}</small></span></a>
        <nav class="jobs" aria-label="Разделы">${jobs(opts.job)}</nav>
        <div class="tools">${lang()}${account(opts.signedIn, opts.menuOpen, opts.here)}</div></div>
      <nav class="jobs jobs-narrow wrap" aria-label="Разделы">${jobs(opts.job)}</nav></header>${modeRow}`;
  }

  /* B2: the rail (wide) or the top bar plus bottom bar (narrow). */
  function rail(opts = {}) {
    const m = MODES.map(([k, label], i) => `${i === 2 ? `<div class="rg">${t('sup')}</div>` : ''}<a href="#" class="${k === opts.mode && opts.job === 'roll' ? 'on' : ''}">${label}</a>`).join('');
    return `<aside class="rail"><a class="brand" href="#">${star()}<span><b>${t('brand')}</b><small>${t('brandSub')}</small></span></a>
      <nav aria-label="Разделы"><div class="rj ${opts.job === 'roll' ? 'cur' : ''}">${ic('die')}${t('roll')}</div><div class="rm">${m}</div>
      <a href="#" class="rj ${opts.job === 'tables' ? 'cur on' : ''}">${ic('table')}${t('tables')}</a><a href="#" class="rj ${opts.job === 'search' ? 'cur on' : ''}">${ic('search')}${t('search')}</a></nav>
      <div class="rfoot">${lang()}${account(opts.signedIn, opts.menuOpen, opts.here)}</div></aside>`;
  }
  function narrowB2(opts = {}) {
    return `<header class="top"><div class="wrap bar"><a class="brand" href="#">${star()}<span><b>${t('brand')}</b><small>${t('brandSub')}</small></span></a>${lang()}${account(opts.signedIn)}</div></header>
      ${opts.job === 'roll' ? `<div class="moderow"><div class="wrap">${modes(opts.mode)}</div></div>` : ''}`;
  }
  const bottomBar = (cur) => `<nav class="bottombar" aria-label="Разделы">${jobs(cur)}</nav>`;

  function footer() {
    return `<footer class="foot"><div class="wrap"><nav><a href="#">${t('footInstall')}</a><a href="#">${t('footPrivacy')}</a><a href="#">${t('footTerms')}</a></nav>Daggerheart © Darrington Press - DPCGL</div></footer>`;
  }
  function pageHead(title, opts = {}) {
    const pin = `<button class="btn sm ${opts.pinned ? 'on' : ''}" aria-pressed="${!!opts.pinned}">${ic('home')}${t('home')}</button>`;
    const help = opts.help === false ? '' : `<button class="btn sm ghost">${ic('help')}${t('help')}</button>`;
    return `<div class="ph"><h1>${title}</h1>${pin}${help}</div>`;
  }

  /* Wraps a page: B1 header + main, or the B2 rail layout. */
  function page(opts, mainHtml) {
    if (!B2) return header(opts) + mainHtml + footer();
    return `<div class="b2"><div class="b2wide">${rail(opts)}</div><div class="b2narrow">${narrowB2(opts)}</div><div class="b2main">${mainHtml}${footer()}</div></div>${bottomBar(opts.job)}`;
  }

  addEventListener('DOMContentLoaded', () => {
    for (const nav of document.querySelectorAll('.modes')) {
      const on = nav.querySelector('[aria-current="page"]');
      if (on && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, on.offsetLeft - 16);
    }
  });

  window.SHELL = { header, footer, pageHead, page, B2, lang, account };
})();
