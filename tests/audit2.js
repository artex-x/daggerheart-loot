/* Walks every page and state on both languages and four widths, looking for the
   things that are easy to break and hard to notice: script errors, sideways
   scroll, text clipped by its own box, controls without a name, dead links,
   pictures that never arrived, repeated ids, and stray "undefined" in the copy. */
const puppeteer = require('puppeteer');
const ROOT = 'file://' + require('path').join(__dirname, '..', 'index.html');
const WIDTHS = [360, 390, 768, 1180];

let fail = 0;
const seen = new Set();
const ok = (c, m) => { if (!c && !seen.has(m)) { seen.add(m); fail++; console.log('  FAIL ' + m); } };

/* Every address the app can be at, plus the states that only exist after a
   click and would otherwise never be looked at. */
const TABLES = ['core_item','core_consumable','hnf_item','hnf_consumable','wondrous',
                'community','alt_item','alt_consumable','eq_weapon','eq_secondary','eq_armor'];
const PAGES = [
  ['#/roll/std', 'бросок d12'],
  ['#/roll/alt', 'альт. таблицы'],
  ['#/roll/wondrous', 'wondrous'],
  ['#/roll/community', 'сообщества'],
  ['#/lists', 'списки'],
  ['#/lists/a', 'список'],
  ['#/lists/empty', 'пустой список'],
  ['#/lists/nope', 'списка нет'],
  ['#/l/%%SHARED%%', 'чужой список'],
  ['#/l/zzzz', 'битая ссылка'],
  ['#/i/w1', 'карточка'],
  ['#/i/q1', 'карточка снаряжения'],
  ['#/i/nope', 'предмета нет'],
  ['#/search', 'поиск'],
  ['#/roll/core', 'старая ссылка'],
  ['#/nowhere', 'неизвестный адрес'],
].concat(TABLES.map(t => ['#/tables/' + t, 'таблица ' + t]))
 .concat([['#/tables/eq_weapon/t3', 'якорь раздела'],
          ['#/tables/eq_weapon/f_tier-2_cls-mag', 'ссылка на фильтры'],
          ['#/tables/community/Seaborne', 'якорь сообщества']]);

(async () => {
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });

  /* a payload for the "someone else's list" page */
  const boot = await browser.newPage();
  await boot.goto(ROOT + '#/roll/std', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 500));
  const shared = await boot.evaluate(() => {
    const b = btoa(unescape(encodeURIComponent('Чужой клад\nci1*2*30,w1,q1')));
    return b.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  });
  await boot.close();

  for (const width of WIDTHS) {
    for (const lang of ['ru', 'en']) {
      const page = await browser.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
      await page.setViewport({ width, height: 900 });
      await page.evaluateOnNewDocument(l => {
        // this also runs on about:blank, where there is no storage to seed
        try {
        localStorage.setItem('dhloot.lang.v1', l);
        localStorage.setItem('dhloot.lists.v1', JSON.stringify([
          { id:'a', name:'Клад дракона', ids:['ci1','cc1','w1','q1','q313','cm1'], created:1,
            note:'Заметка про весь список', noteShow:true,
            meta:{ ci1:{ qty:2, gold:30, note:'Под прилавком', noteShow:true } } },
          { id:'empty', name:'Пусто', ids:[], created:2 }]));
        } catch (e) {}
      }, lang);

      for (const [hash, label] of PAGES) {
        const url = ROOT + hash.replace('%%SHARED%%', shared);
        /* A hash-only move is a same-document navigation and puppeteer can see
           the frame swap under it, so wait for the app to have drawn something
           and give the load another go if the frame went away mid-flight. */
        let ready = false;
        for (let attempt = 0; attempt < 3 && !ready; attempt++) {
          try {
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.waitForFunction(
              () => { const v = document.getElementById('view'); return v && v.children.length; },
              { timeout: 5000 });
            await new Promise(r => setTimeout(r, 300));
            await page.evaluate(() => window.scrollTo(0, 0));
            ready = true;
          } catch (e) { await new Promise(r => setTimeout(r, 300)); }
        }
        ok(ready, label + ' @' + width + ' ' + lang + ': страница не отрисовалась');
        if (!ready) continue;
        const where = label + ' @' + width + ' ' + lang;

        const rep = await page.evaluate(() => {
          const out = { ids: [], noName: [], clipped: [], badLinks: [], undef: false, overflow: 0 };
          out.overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
          out.undef = /\bundefined\b/.test(document.body.innerText);

          const ids = {};
          document.querySelectorAll('[id]').forEach(e => {
            ids[e.id] = (ids[e.id] || 0) + 1;
            if (ids[e.id] === 2) out.ids.push(e.id);
          });

          const named = e => {
            const t = (e.textContent || '').trim();
            return !!(t || e.getAttribute('aria-label') || e.getAttribute('title') ||
                      e.getAttribute('aria-labelledby') || e.value);
          };
          document.querySelectorAll('button, a[href], input, select, textarea').forEach(e => {
            if (e.type === 'hidden' || e.closest('[hidden]')) return;
            const box = e.getBoundingClientRect();
            if (!box.width && !box.height) return;
            if (!named(e) && !e.placeholder) out.noName.push(e.tagName + '.' + e.className);
          });

          /* text wider than the box it sits in: a name or a chip that got cut */
          document.querySelectorAll('.card-name a, .card-name span, .badge, .chip, .eqpill, .btn, .lbl, .rnum')
            .forEach(e => {
              if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible')
                out.clipped.push((e.className || e.tagName) + ': ' + e.textContent.trim().slice(0, 28));
            });

          document.querySelectorAll('a[href^="#/"]').forEach(a => {
            const h = a.getAttribute('href').slice(2);
            const known = /^(roll\/(std|alt|wondrous|community)|tables|lists|search|i\/|l\/|lists\/)/.test(h);
            if (!known) out.badLinks.push(h);
          });
          return out;
        });

        ok(!errs.length, where + ': ошибка в консоли — ' + errs.slice(0, 2).join(' | '));
        errs.length = 0;
        ok(rep.overflow <= 0, where + ': горизонтальная прокрутка на ' + rep.overflow + 'px');
        ok(!rep.undef, where + ': на странице напечатано undefined');
        ok(!rep.ids.length, where + ': повторяющийся id — ' + rep.ids.join(', '));
        ok(!rep.noName.length, where + ': элемент без имени — ' + rep.noName.slice(0, 3).join(', '));
        ok(!rep.clipped.length, where + ': текст обрезан — ' + rep.clipped.slice(0, 3).join(' | '));
        ok(!rep.badLinks.length, where + ': ссылка в никуда — ' + rep.badLinks.slice(0, 3).join(', '));

        const broken = await page.evaluate(() => [...document.images]
          .filter(i => i.complete && !i.naturalWidth).map(i => i.getAttribute('src')));
        ok(!broken.length, where + ': картинка не загрузилась — ' + broken.slice(0, 2).join(', '));
      }
      await page.close();
    }
  }

  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\nобход страниц: чисто на всех ширинах и языках');
  process.exit(fail ? 1 : 0);
})();
