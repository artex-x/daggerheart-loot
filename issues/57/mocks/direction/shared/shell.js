/* The polished-in-place shell (directions A and C): the post-R10 header with
   five tabs over the nine roll sections, tables and search; no Lists tab, no
   banner under the header. */
(function () {
  const { t, ic, star, LANG } = window.M;

  const TABS = [
    ['std', 'std'],
    ['alt', 'alt'],
    ['sup', 'sup'],
    ['tables', 'tables', 'sep'],
    ['search', 'search']
  ];

  function lang(quiet) {
    return `<div class="seg ${quiet ? 'quiet' : ''}" role="group" aria-label="Язык / Language">
      <button aria-pressed="${LANG === 'ru'}">RU</button><button aria-pressed="${LANG === 'en'}">EN</button></div>`;
  }

  function account(signedIn, open, here) {
    if (!signedIn)
      return `<button class="acct">${ic('user')}<span>${t('signIn')}</span></button>`;
    const menu = open
      ? `<div class="menu" role="menu">
          <div class="who">${t('signedAs')}<b>gm1@example.test</b></div>
          <a role="menuitem" class="hl" href="#">${ic('list')}${t('menuLists')}<span class="n">3</span></a>
          <a role="menuitem" href="#">${ic('sword')}${t('myItems')}<span class="n">12</span></a>
          <a role="menuitem" href="#">${ic('user')}${t('account')}</a>
          <hr><a role="menuitem" href="#">${t('signOut')}</a></div>`
      : '';
    return `<div style="position:relative"><button class="acct ${open ? 'open' : ''} ${here ? 'here' : ''}" ${here ? 'aria-current="page"' : ''} aria-haspopup="menu" aria-expanded="${!!open}" aria-label="${t('account')}: gm1@example.test"><span class="ini">G</span>${ic('chev')}</button>${menu}</div>`;
  }

  /* opts: current tab key, signedIn, menuOpen, quietLang */
  function header(opts = {}) {
    const tabs = TABS.map(
      ([k, label, sep]) =>
        `<a href="#" class="${k === opts.current ? 'on' : ''} ${sep || ''}" ${k === opts.current ? 'aria-current="page"' : ''}>${t(label)}</a>`
    ).join('');
    return `<header class="top ${opts.static ? 'static' : ''}">
      <div class="wrap bar"><a class="brand" href="#">${star()}<span><b>${t('brand')}</b><small>${t('brandSub')}</small></span></a>
        ${lang(opts.quietLang)}${account(opts.signedIn, opts.menuOpen, opts.here)}</div>
      <nav class="wrap tabs" aria-label="Разделы">${tabs}</nav></header>`;
  }

  function footer() {
    return `<footer class="foot"><div class="wrap"><nav><a href="#">${t('footInstall')}</a><a href="#">${t('footPrivacy')}</a><a href="#">${t('footTerms')}</a></nav>Daggerheart © Darrington Press - DPCGL</div></footer>`;
  }

  /* The page head: title plus labelled pin and help buttons (no bare icons). */
  function pageHead(title, opts = {}) {
    const pin =
      opts.pin === false
        ? ''
        : `<button class="btn sm ${opts.pinned ? 'on' : ''}" aria-pressed="${!!opts.pinned}">${ic('home')}${opts.pinned ? t('homeOn') : t('home')}</button>`;
    const help =
      opts.help === false
        ? ''
        : `<button class="btn sm ghost" aria-expanded="false">${ic('help')}${t('help')}</button>`;
    return `<div class="ph"><h1>${title}</h1>${pin}${help}</div>`;
  }

  /* As the app does today: the lit tab scrolls to the centre of the narrow
     strip; with no lit tab the strip starts at the first tab. */
  addEventListener('DOMContentLoaded', () => {
    for (const nav of document.querySelectorAll('.tabs, .modes')) {
      const on = nav.querySelector('.on, [aria-current="page"]');
      if (on && nav.scrollWidth > nav.clientWidth)
        nav.scrollLeft = Math.max(0, on.offsetLeft - (nav.clientWidth - on.offsetWidth) / 2);
    }
  });

  window.SHELL = { header, footer, pageHead, lang, account };
})();
