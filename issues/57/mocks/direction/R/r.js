/* The recommendation R: B1's shell and work areas, A1's strict gold budget,
   Source Sans 3, and one graft from C - a roll result is drawn as the card it
   prints as (art fading into the plate), with the name in title case. */
(function () {
  const { t, R, ic } = window.M;
  const { page, pageHead } = window.SHELL;
  const BX = window.BX;
  const scard = window.CX.scard;
  const surface = document.body.dataset.surface;

  function roller() {
    const dice = [['1d12', 'common'], ['2d12', 'cu'], ['3d12', 'ur'], ['4d12', 'rl'], ['5d12', 'leg']]
      .map(([d, k], i) => `<button class="die ${i === 0 ? 'on' : ''}"><span class="d">${ic('die')}${d}</span><span class="r">${t(k)}</span></button>`).join('');
    const allChip = `<button class="chip all" aria-pressed="true">${ic('check')}${t('all')}</button>`;
    const chip = (l) => `<button class="chip" aria-pressed="false">${l}</button>`;
    const hand = ['ci1', 'cc1', 'hi1', 'hc1'].map((id) => `<div class="dealt">${scard(R[id])}<div class="cardacts"><button class="btn sm">${ic('plus')}${t('addList')}</button><button class="btn sm">${ic('share')}${t('share')}</button><button class="btn sm" aria-label="${t('more')}">${ic('more')}</button></div></div>`).join('');
    const main = `<main class="wrap">${pageHead(t('std'))}<div class="two">
      <section class="panel ctrl"><span class="lbl">${t('rollBtn')}</span><div class="dice">${dice}</div>
        <span class="lbl">${t('orEnter')}</span><div class="own"><div class="num" role="group" aria-label="${t('sumField')}"><button>−</button><output>1</output><button>+</button></div><span class="cap2">${t('sumField')},<br>1-60</span></div>
        <span class="lbl">${t('source')}</span><div class="fl">${allChip}${chip('Core')}${chip('Hope & Fear')}</div>
        <span class="lbl">${t('type')}</span><div class="fl">${allChip}${chip(t('items'))}${chip(t('cons'))}</div></section>
      <section><div class="reshead"><h2>${t('pickOne')}</h2><button class="btn sm">${ic('copy')}${t('copyAll')}</button></div>
        <div class="hand2">${hand}</div></section></div></main>`;
    return page({ job: 'roll', mode: 'std' }, main);
  }

  const editor = () => page({ job: null, signedIn: true }, window.EDITOR('B'));
  const S = { header: BX.header, catalog: BX.catalog, item: BX.item, list: BX.list, roller, editor };
  document.body.insertAdjacentHTML('afterbegin', S[surface]());
})();
