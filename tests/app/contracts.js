/* Public contracts against the golden fixtures, re-pointed at dist-test/ - the
 * browser half of tests/contracts.js. The llms.txt/CONTRACTS.md/ROUTES.md name
 * greps need no browser and stay there. Nothing here edits a fixture: a
 * divergence is root-caused and reported, per CLAUDE.md, "Public contracts
 * default to no change". */
const fs = require('fs');
const path = require('path');
const { fresh, reporter, closeBrowser } = require('./lib.js');

const FIX = path.join(__dirname, '..', '..', 'docs', 'fixtures');
const rep = reporter();
const { ok } = rep;

(async () => {
  /* An old list link stopped opening on 2026-10-26 (docs/specs/ROUTES.md): a plain one that
     opened a list before, a packed one, and one with a stray character all draw the
     not-found page with the address kept. */
  console.log('an old list link');
  {
    const { ctx, page, d } = await fresh({ width: 1280, height: 900 });
    for (const hash of [
      '#/l/0JvQsNCy0LrQsAozLnZvY3h-Y2kxKjIsY2MyMSo1KjUwLHEzMzcqMSoxMg',
      '#/l/~AAAA',
      '#/l/ABC.'
    ]) {
      await d.open(hash);
      const seen = await page.evaluate(() => ({
        h1: document.querySelector('main h1')?.textContent?.trim() ?? null,
        hash: location.hash
      }));
      ok(seen.h1 === 'Предмет не найден', hash + ': the heading is ' + JSON.stringify(seen.h1));
      ok(seen.hash === hash, hash + ': the address became ' + seen.hash);
    }
    await ctx.close();
  }

  console.log('the address grammar');
  const routes = JSON.parse(fs.readFileSync(path.join(FIX, 'urls', 'routes.json'), 'utf8'));
  /* One context reused across every fixture rather than one per fixture -
   * none of them seed storage, so `d.open`'s full
   * navigation (driver.js's own) and `prepare()`'s per-navigation
   * localStorage.clear() (lib.js/driver.js) already give every fixture the
   * same clean slate a fresh context would, without paying puppeteer's
   * ~1.8s-per-context floor (tests/app/golden.js's measured cost) once per fixture. */
  const { ctx: rCtx, page: rPage, d: rD } = await fresh({ width: 1280, height: 900 });
  for (const fx of routes) {
    await rD.open(fx.hash);
    const seen = await rPage.evaluate(() => {
      const on = document.querySelector('nav.tabs a[aria-current="page"]');
      /* `.chip[data-val]` is StdPanel's source row and only it - the `value`
         prop on Chip.svelte has no other caller. */
      const srcBtns = [...document.querySelectorAll('.chip[data-val]')];
      return {
        hash: location.hash,
        tab: on ? on.getAttribute('href') : null,
        rows: document.querySelectorAll('.rows .row[data-row]').length,
        printCards: document.querySelectorAll('.pcard:not(.blank)').length,
        printQty: Object.fromEntries(
          [...document.querySelectorAll('.pcard[data-pid]')].flatMap((card) => {
            const q = card.querySelector('.pc-qty');
            return q
              ? [[card.dataset.pid, parseInt(q.textContent.replace(/\D/g, ''), 10)]]
              : [];
          })
        ),
        picked: [...document.querySelectorAll('.fpill')].map((e) => e.dataset.val),
        source: srcBtns.length
          ? srcBtns.map(
              (e) =>
                e.dataset.val + (e.getAttribute('aria-pressed') === 'true' ? ':on' : ':off')
            )
          : undefined
      };
    });
    const want = fx.resolves;
    /* A page whose state waits for the session (`#/p/`) names itself by its heading. */
    if (want.heading) {
      const h1 = () =>
        (
          document.querySelector('main h1') ?? document.querySelector('h1')
        )?.textContent?.trim() ?? null;
      const heading = await rPage
        .waitForFunction(
          (t) =>
            (
              document.querySelector('main h1') ?? document.querySelector('h1')
            )?.textContent?.trim() === t,
          { timeout: 5000 },
          want.heading
        )
        .then(
          () => want.heading,
          () => rPage.evaluate(h1)
        );
      ok(
        heading === want.heading,
        fx.hash + ': heading ' + JSON.stringify(heading) + ', the fixture says ' + want.heading
      );
    }
    /* Every #/p/ state draws one heading, so its sub names the state. */
    if (want.sub) {
      const sub = await rPage.evaluate(
        () => document.querySelector('main .page-sub')?.textContent?.trim() ?? null
      );
      ok(
        sub === want.sub,
        fx.hash + ': sub ' + JSON.stringify(sub) + ', the fixture says ' + want.sub
      );
    }
    ok(seen.hash === want.hash, fx.hash + ': became ' + seen.hash + ', not ' + want.hash);
    ok(seen.tab === want.tab, fx.hash + ': highlighted ' + seen.tab + ', not ' + want.tab);
    ok(
      seen.rows === want.rows,
      fx.hash + ': ' + seen.rows + ' rows, the fixture says ' + want.rows
    );
    ok(
      seen.printCards === want.printCards,
      fx.hash + ': ' + seen.printCards + ' cards, the fixture says ' + want.printCards
    );
    ok(
      JSON.stringify(seen.printQty) === JSON.stringify(want.printQty ?? {}),
      fx.hash +
        ': counts ' +
        JSON.stringify(seen.printQty) +
        ', the fixture says ' +
        JSON.stringify(want.printQty ?? {})
    );
    ok(
      JSON.stringify(seen.picked) === JSON.stringify(want.picked),
      fx.hash +
        ': picked ' +
        JSON.stringify(seen.picked) +
        ', the fixture says ' +
        JSON.stringify(want.picked)
    );
    ok(
      JSON.stringify(seen.source) === JSON.stringify(want.source),
      fx.hash +
        ': sources ' +
        JSON.stringify(seen.source) +
        ', the fixture says ' +
        JSON.stringify(want.source)
    );
  }
  await rCtx.close();

  console.log('every relation link on an item page opens its item');
  /* `#/h/<uuid>` signed out: each relation line's link is an item address, and each one
     draws a card headed by the name the link carries (docs/specs/FEATURES.md, "Records"). */
  {
    const { ctx: hCtx, page: hPage, d: hD } = await fresh({ width: 1280, height: 900 });
    await hD.open('#/h/00000000-0000-4000-8000-000000000662');
    const links = await hPage.evaluate(() =>
      [...document.querySelectorAll('.craft a')].map((a) => ({
        href: a.getAttribute('href'),
        text: a.textContent.trim()
      }))
    );
    ok(links.length === 4, 'the item page draws ' + links.length + ' relation links, not 4');
    for (const link of links) {
      ok(/^#\/h\/[0-9a-f-]{36}$/.test(link.href), link.text + ': links ' + link.href);
      await hD.open(link.href);
      const heading = await hPage.evaluate(
        () => document.querySelector('h1')?.textContent.trim() ?? ''
      );
      ok(
        !!heading && link.text.startsWith(heading),
        link.href + ': draws ' + JSON.stringify(heading) + ' for the link ' + link.text
      );
    }
    await hCtx.close();
  }

  console.log('the stat line');
  const lines = JSON.parse(
    fs.readFileSync(path.join(FIX, 'statlines', 'equipment.json'), 'utf8')
  );
  const ids = Object.keys(lines);
  for (const lang of ['ru', 'en']) {
    const { ctx, page, d } = await fresh({ width: 1280, height: 900, lang });
    for (const id of ids) {
      await d.open('#/i/' + id);
      const parts = await page.evaluate(() => {
        const box = document.querySelector('.eqstats');
        return box ? [...box.querySelectorAll('span')].map((s) => s.textContent) : null;
      });
      ok(
        JSON.stringify(parts) === JSON.stringify(lines[id][lang]),
        id +
          '/' +
          lang +
          ': stat line is ' +
          JSON.stringify(parts) +
          ', the fixture says ' +
          JSON.stringify(lines[id][lang])
      );
    }
    await ctx.close();
  }

  console.log('a share stub names the path its record page does');
  /* The stub builder copies the record page's path words (tools/share-card.mjs,
     PATH_TEXT); one record per table in each language catches a drift. */
  const stubs = require('../../tools/build-share-pages.js');
  const firstOf = {};
  for (const arr of Object.values(global.window.LOOT.items).concat([global.window.LOOT.eq])) {
    for (const it of arr) {
      const table = stubs.tableOf(it);
      if (!(table in firstOf)) firstOf[table] = it.id;
    }
  }
  const ROOT = path.join(__dirname, '..', '..');
  for (const lang of ['ru', 'en']) {
    const { ctx, page, d } = await fresh({ width: 1280, height: 900, lang });
    for (const id of Object.values(firstOf)) {
      await d.open('#/i/' + id);
      const where = await page.evaluate(() => {
        const sub = document.querySelector('.page-sub');
        return sub
          ? [...sub.childNodes]
              .filter((n) => n.nodeType === 3)
              .map((n) => n.textContent)
              .join('')
              .trim()
          : null;
      });
      const html = fs.readFileSync(
        path.join(ROOT, 'i', lang === 'ru' ? '' : 'en', id + '.html'),
        'utf8'
      );
      const m = /<p class="s">([^<]*)<\/p>/.exec(html);
      const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
      const stub = m ? m[1].replace(/&(amp|lt|gt|quot|#39);/g, (e) => ENT[e]) : null;
      ok(
        !!where && !!stub && stub.startsWith(where),
        id +
          '/' +
          lang +
          ': the stub subtitle is ' +
          JSON.stringify(stub) +
          ', the record page says ' +
          JSON.stringify(where)
      );
    }
    await ctx.close();
  }

  console.log('filter group names select something, on the tables and on a share link');
  const PROBE = [
    ['eq_weapon', 'tier-2'],
    ['eq_weapon', 'tier-A'],
    ['eq_weapon', 'src-core'],
    ['eq_weapon', 'cls-mag'],
    ['eq_weapon', 'trait-strength'],
    ['eq_weapon', 'range-melee'],
    ['eq_weapon', 'burden-2'],
    ['eq_weapon', 'line-uniq'],
    ['eq_armor', 'tier-1'],
    ['voa', 'tier-A'],
    ['other_frames', 'frame-colossus'],
    ['community', 'comm-Seaborne'],
    ['wondrous', 'kind-consumable'],
    ['dv', 'kind-consumable'],
    ['dv', 'kind-equip'],
    ['arazo', 'kind-equip'],
    ['mwt', 'kind-equip'],
    ['mwt', 'realm-warrens'],
    ['mwt', 'realm-drome']
  ];
  /* One context reused across all 27 opens (19 probes, 8 whole tables) - same
   * reasoning as the address-grammar loop above: no probe here seeds
   * storage, so a full `d.open` navigation already starts each one clean. */
  const { ctx: pCtx, page: pPage, d: pD } = await fresh({ width: 1280, height: 900 });
  const rowsAt = async (hash) => {
    await pD.open(hash);
    return pPage.evaluate(() => document.querySelectorAll('.rows .row[data-row]').length);
  };
  const whole = {};
  for (const [tid] of PROBE) if (!(tid in whole)) whole[tid] = await rowsAt('#/tables/' + tid);
  for (const [tid, seg] of PROBE) {
    const n = await rowsAt('#/tables/' + tid + '/f_' + seg);
    ok(
      n > 0 && n < whole[tid],
      tid + '/f_' + seg + ': the group selects nothing (' + n + ' of ' + whole[tid] + ')'
    );
  }
  await pCtx.close();

  /* A share link's groups beyond `kind` and `tier`, which the route fixtures replay:
     each value is one the test build's seeded share `player-token-1` (10 entries) holds. */
  const SHARE_PROBE = [
    'src-hnf',
    'cls-mag',
    'trait-presence',
    'range-far',
    'burden-2',
    'line-uniq'
  ];
  const { ctx: sCtx, page: sPage, d: sD } = await fresh({ width: 1280, height: 900 });
  for (const seg of SHARE_PROBE) {
    await sD.open('#/s/player-token-1/f_' + seg);
    const n = await sPage.evaluate(
      () => document.querySelectorAll('.rows .row[data-row]').length
    );
    ok(n > 0 && n < 10, 'player-token-1/f_' + seg + ': the group selects ' + n + ' of 10');
  }
  await sCtx.close();

  /* The own items' values exist in one account only: gm1's seed. gm1's tables view is the
     grid, so a row is any `[data-row]`. On `homebrew` the `src` value is the source chip
     (docs/specs/ROUTES.md, "Homebrew"): the bare address draws the first chip, and the
     chips add up to gm1's four own items. The `sect` narrowing inside a chip is proven in
     homebrewCatalog.test.ts. */
  const { ctx: oCtx, page: oPage, d: oD } = await fresh({ width: 1280, height: 900 });
  const ownRowsAt = async (hash) => {
    await oD.open(hash, { as: 'gm1' });
    await oD.settled();
    return oPage.evaluate(() => document.querySelectorAll('[data-row]').length);
  };
  const CHIP_PROBE = [
    ['#/tables/homebrew', 1],
    ['#/tables/homebrew/f_src-hb', 3],
    ['#/tables/homebrew/f_src-hb_alderworkshopaaa', 1],
    ['#/tables/homebrew/f_kind-item.src-hb', 2]
  ];
  for (const [hash, want] of CHIP_PROBE) {
    const n = await ownRowsAt(hash);
    ok(n === want, hash + ' as gm1: ' + n + ' rows, want ' + want);
  }
  const weaponWhole = await ownRowsAt('#/tables/eq_weapon');
  const ownWeapon = await ownRowsAt('#/tables/eq_weapon/f_src-hb_alderworkshopaaa');
  ok(
    ownWeapon > 0 && ownWeapon < weaponWhole,
    'eq_weapon/f_src-hb_alderworkshopaaa as gm1: the group selects nothing (' +
      ownWeapon +
      ' of ' +
      weaponWhole +
      ')'
  );
  await oCtx.close();

  await closeBrowser();
  console.log(
    rep.failed ? '\n' + rep.failed + ' FAILED' : '\ncontracts (dist-test/): match the fixtures'
  );
  process.exit(rep.failed ? 1 : 0);
})();
