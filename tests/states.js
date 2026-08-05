/* The states a page only reaches after a click: panels, menus, modals, results.
   Checked for the same things as a plain load, plus the ones that only matter
   once something is open — a menu that leaves the screen, a control too small
   to hit on a phone, a panel that covers what it belongs to. */
const puppeteer = require('puppeteer');
const ROOT = 'file://' + require('path').join(__dirname, '..', 'index.html');
const WIDTHS = [360, 1180];

let fail = 0;
const seen = new Set();
const ok = (c, m) => { if (!c && !seen.has(m)) { seen.add(m); fail++; console.log('  FAIL ' + m); } };

const tap = async (page, sel) => {
  const found = await page.$$eval(sel, e => { if (e[0]) { e[0].click(); return true; } return false; })
    .catch(() => false);
  await new Promise(r => setTimeout(r, 320));
  return found;
};

/* [name, hash, what to press to get into the state] */
const STATES = [
  ['справка на броске',   '#/roll/std',            p => tap(p, '.helpbtn')],
  ['справка в таблицах',  '#/tables/eq_weapon',    p => tap(p, '.helpbtn')],
  ['результат броска',    '#/roll/std',            p => tap(p, '[data-act="roll"]')],
  ['дуальный бросок',     '#/roll/alt',            p => tap(p, '[data-act="rollDuality"]')],
  ['бросок wondrous',     '#/roll/wondrous',       p => tap(p, '[data-act="roll"]')],
  ['бросок сообщества',   '#/roll/community',      p => tap(p, '[data-act="roll"]')],
  ['другое сообщество',   '#/roll/community',      p => tap(p, '[data-act="comm"]')],
  ['другая редкость',     '#/roll/alt',            p => tap(p, '[data-act="rarity"]')],
  ['источник выключен',   '#/roll/std',            p => tap(p, '[data-act="src"]')],
  ['тип выключен',        '#/search',              p => tap(p, '[data-act="kind"]')],
  ['таблица сеткой',      '#/tables/wondrous',     p => tap(p, '[data-act="view"][data-val="grid"]')],
  ['модалка из таблицы',  '#/tables/core_item',    p => tap(p, '[data-open]')],
  ['меню списков',        '#/i/w1',                p => tap(p, '.cardpick [data-act="menu"]')],
  ['новый список в меню', '#/i/w1',                async p => { await tap(p, '.cardpick [data-act="menu"]');
                                                                return tap(p, '[data-act="newListFor"]'); }],
  ['панель выделения',    '#/tables/core_item',    p => tap(p, '[data-sel]')],
  ['меню выделения',      '#/tables/core_item',    async p => { await tap(p, '[data-sel]');
                                                                return tap(p, '#selBar [data-act="menu"]'); }],
  ['фильтры снаряжения',  '#/tables/eq_weapon',    p => tap(p, '[data-act="eqOpen"]')],
  ['фильтр с выбором',    '#/tables/eq_weapon',    async p => { await tap(p, '[data-act="eqOpen"]');
                                                                return tap(p, '.eqfilter [data-val="trait:strength"]'); }],
  ['заметка в списке',    '#/lists/a',             p => tap(p, '[data-note-toggle]')],
  ['бросок по списку',    '#/lists/a',             p => tap(p, '[data-act="rollList"]')],
  ['поиск с находками',   '#/search',              async p => {
      await p.$eval('#sq', e => { e.value = 'меч'; e.dispatchEvent(new Event('input', { bubbles: true })); });
      await new Promise(r => setTimeout(r, 320)); return true; }],
  ['поиск без находок',   '#/search',              async p => {
      await p.$eval('#sq', e => { e.value = 'жжжж'; e.dispatchEvent(new Event('input', { bubbles: true })); });
      await new Promise(r => setTimeout(r, 320)); return true; }],
  ['фильтр без находок',  '#/tables/eq_armor/f_tier-1_src-hnf_line-uniq', async () => true],
];

(async () => {
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
  for (const width of WIDTHS) {
    for (const [label, hash, act] of STATES) {
      const page = await browser.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      await page.setViewport({ width, height: 820 });
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('dhloot.lists.v1', JSON.stringify([
          { id:'a', name:'Клад дракона', ids:['ci1','cc1','w1','q1'], created:1 },
          { id:'b', name:'Лавка', ids:[], created:2 }]));
      });
      await page.goto(ROOT + hash, { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 480));
      const reached = await act(page);
      const where = label + ' @' + width;
      ok(reached !== false, where + ': не удалось попасть в состояние');

      const rep = await page.evaluate(() => {
        const out = { overflow: 0, offscreen: [], small: [], undef: false, covered: [] };
        out.overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        out.undef = /\bundefined\b/.test(document.body.innerText);

        /* anything that floats over the page has to stay inside it */
        document.querySelectorAll('.dropmenu, .modal-box, #modal:not([hidden]) .card, .helpbox, .eqfilter, #selBar:not([hidden])')
          .forEach(e => {
            const r = e.getBoundingClientRect();
            if (!r.width) return;
            if (r.left < -1 || r.right > document.documentElement.clientWidth + 1)
              out.offscreen.push((e.className || e.id) + ' ' + Math.round(r.left) + '…' + Math.round(r.right));
          });

        /* on a phone a control smaller than 30px is hard to hit on purpose */
        if (window.innerWidth <= 420) {
          document.querySelectorAll('button:not([hidden]), a.chip, .selbox').forEach(e => {
            const r = e.getBoundingClientRect();
            if (!r.width || !r.height) return;
            if (r.height < 26 || r.width < 22)
              out.small.push((e.className || e.tagName) + ' ' + Math.round(r.width) + '×' + Math.round(r.height));
          });
        }

        /* an open menu must not be buried under the sticky header */
        document.querySelectorAll('.dropmenu').forEach(e => {
          const r = e.getBoundingClientRect();
          const mid = document.elementFromPoint(Math.min(r.left + r.width / 2, innerWidth - 2),
                                                Math.min(r.top + 12, innerHeight - 2));
          if (mid && !e.contains(mid)) out.covered.push('меню перекрыто ' + (mid.className || mid.tagName));
        });
        return out;
      });

      ok(!errs.length, where + ': ошибка в консоли — ' + errs.slice(0, 2).join(' | '));
      ok(rep.overflow <= 0, where + ': горизонтальная прокрутка на ' + rep.overflow + 'px');
      ok(!rep.undef, where + ': на странице напечатано undefined');
      ok(!rep.offscreen.length, where + ': элемент выехал за экран — ' + rep.offscreen.slice(0, 2).join(', '));
      ok(!rep.small.length, where + ': слишком мелкая цель — ' + rep.small.slice(0, 3).join(', '));
      ok(!rep.covered.length, where + ': ' + rep.covered.slice(0, 2).join(', '));
      await page.close();
    }
  }
  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\nсостояния: чисто');
  process.exit(fail ? 1 : 0);
})();
