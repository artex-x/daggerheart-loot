/* Public contracts against the golden fixtures, re-pointed at dist/ - the
 * browser half of tests/contracts.js. The pure half (the second
 * implementation of the codec) and the llms.txt/CONTRACTS.md/ROUTES.md name
 * greps need no browser and stay there; decided 3 leaves that file alive
 * until Phase 7. Nothing here edits a fixture: a divergence is root-caused
 * and reported, per CLAUDE.md, "Public contracts default to no change". */
const fs = require('fs');
const path = require('path');
const { fresh, reporter, closeBrowser } = require('./lib.js');

const FIX = path.join(__dirname, '..', '..', 'docs', 'fixtures');
const rep = reporter();
const { ok } = rep;

const b64url = (s) =>
  Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function stampOf(parts) {
  const body = parts.join(',');
  let h = 2166136261;
  for (let i = 0; i < body.length; i++) {
    h ^= body.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return parts.length.toString(36) + '.' + (h >>> 0).toString(36).slice(-4) + '~';
}

(async () => {
  const listFiles = fs.readdirSync(path.join(FIX, 'lists')).filter((f) => f.endsWith('.json'));
  const lists = listFiles.map((f) => JSON.parse(fs.readFileSync(path.join(FIX, 'lists', f), 'utf8')));

  console.log('the link the app writes');
  for (const fx of lists) {
    const { ctx, page, d } = await fresh({
      width: 1280, height: 900,
      storage: { 'dhloot.lists.v2': JSON.stringify([fx.list]) }
    });
    await d.open('#/lists/' + fx.list.id);
    const inBar = (await page.evaluate(() => location.hash)).replace('#/l/', '');
    ok(inBar === fx.player.payload, fx.id + ': the address bar does not hold the link from the fixture');
    await ctx.close();
  }

  console.log('the link the app reads');
  for (const fx of lists) {
    const notes = [fx.list.note, fx.list.hnote]
      .concat(
        Object.keys(fx.list.meta || {}).map((id) => fx.list.meta[id].note),
        Object.keys(fx.list.meta || {}).map((id) => fx.list.meta[id].hnote)
      )
      .filter(Boolean);
    const forPlayers = [fx.list.note]
      .concat(Object.keys(fx.list.meta || {}).map((id) => fx.list.meta[id].note))
      .filter(Boolean);
    const gmOnly = notes.filter((n) => forPlayers.indexOf(n) < 0);

    const a = await fresh({ width: 1280, height: 900 });
    await a.d.open('#/l/' + fx.player.payload);
    const seenPlayer = await a.page.evaluate(() => document.body.innerText);
    ok(seenPlayer.indexOf(fx.list.name) >= 0, fx.id + ': the player link did not open');
    forPlayers.forEach((n) =>
      ok(seenPlayer.indexOf(n) >= 0, fx.id + ': a player note is missing from the player link')
    );
    gmOnly.forEach((n) =>
      ok(seenPlayer.indexOf(n) < 0, fx.id + ': a GM note is visible through the player link')
    );
    await a.ctx.close();

    const b = await fresh({ width: 1280, height: 900 });
    await b.d.open('#/l/' + fx.gm.payload);
    const seenGm = await b.page.evaluate(() => document.body.innerText);
    notes.forEach((n) => ok(seenGm.indexOf(n) >= 0, fx.id + ': a note is missing from the GM link'));
    await b.ctx.close();
  }

  console.log('a truncated link');
  const big = lists.filter((f) => f.list.ids.length > 1)[0];
  const cutRaw = big.gm.raw.slice(0, big.gm.raw.lastIndexOf(','));
  const c = await fresh({ width: 1280, height: 900 });
  await c.d.open('#/l/' + b64url(cutRaw));
  const seenCut = await c.page.evaluate(() => document.body.innerText);
  ok(/повреждена|damaged/i.test(seenCut), 'a truncated link opened as a list instead of a broken-link page');
  await c.ctx.close();

  /* ---------- a link assembled purely from llms.txt's own description ----------
   * Moved here from tests/lists2.js (decided 3): the format is documented so
   * an agent can build an address with no help from the app, and that promise
   * is only as good as this - a link built by a second implementation, not by
   * the app's own encoder, opening correctly. */
  console.log('a link assembled from llms.txt\'s description');
  {
    const parts = ['q26*1*30', 'q313*2', 'ci1'];
    const raw =
      'Лавка кузнеца\n' +
      stampOf(parts) +
      parts.join(',') +
      '\n\x1e+~\x1fТовар лежит навалом.' +
      '\x1e~\x1fКузнец сбывает краденое.' +
      '\x1e+q26\x1fНа клинке зазубрина.';
    const payload = b64url(raw);
    const { ctx, page, d } = await fresh({ width: 1280, height: 900 });
    await d.open('#/l/' + payload);
    const text = await page.evaluate(() => document.body.innerText);
    ok(/Лавка кузнеца/.test(text), 'собранная ссылка не открылась как список');
    ok(
      /Катана/.test(text) && /Стеганый Доспех/.test(text) && /Спальный Мешок/.test(text),
      'в собранном списке не все позиции: ' + text.slice(0, 120)
    );
    ok(/3 горсти/.test(text), 'цена из собранной ссылки не показана: ' + text.slice(0, 160));
    ok(/×2|x2/.test(text), 'количество из собранной ссылки не показано');
    ok(
      /Товар лежит навалом/.test(text) && /Кузнец сбывает краденое/.test(text),
      'заметки из собранной ссылки не показаны'
    );
    ok(/На клинке зазубрина/.test(text), 'заметка о позиции не показана');
    await ctx.close();

    const brokenRaw = raw.replace(stampOf(parts), stampOf(parts.slice(0, 2)));
    const broken = b64url(brokenRaw);
    const { ctx: c2, page: p2, d: d2 } = await fresh({ width: 1280, height: 900 });
    await d2.open('#/l/' + broken);
    const seenBroken = await p2.evaluate(() => document.body.innerText);
    ok(!/Катана/.test(seenBroken), 'ссылка с неверной контрольной суммой всё равно открылась');
    await c2.close();
  }

  console.log('the address grammar');
  const routes = JSON.parse(fs.readFileSync(path.join(FIX, 'urls', 'routes.json'), 'utf8'));
  /* One context reused across all 28 fixtures rather than one per fixture
   * (issues/phase-8, T3) - none of them seed storage, so `d.open`'s full
   * navigation (driver.js:151-153) and `prepare()`'s per-navigation
   * localStorage.clear() (lib.js/driver.js) already give every fixture the
   * same clean slate a fresh context would, without paying puppeteer's
   * ~1.8s-per-context floor (tests/app/golden.js's measured cost) 28 times. */
  const { ctx: rCtx, page: rPage, d: rD } = await fresh({ width: 1280, height: 900 });
  for (const fx of routes) {
    await rD.open(fx.hash);
    const seen = await rPage.evaluate(() => {
      const on = document.querySelector('nav.tabs a[aria-current="page"]');
      /* `.chip[data-val]` is StdPanel's source row and only it - the `value`
         prop on Chip.svelte has no other caller (plan.md, "B12 planned"). */
      const srcBtns = [...document.querySelectorAll('.chip[data-val]')];
      return {
        hash: location.hash,
        tab: on ? on.getAttribute('href') : null,
        rows: document.querySelectorAll('.rows .row[data-row]').length,
        printCards: document.querySelectorAll('.pcard:not(.blank)').length,
        picked: [...document.querySelectorAll('.fpill')].map((e) => e.dataset.val),
        source: srcBtns.length
          ? srcBtns.map((e) => e.dataset.val + (e.getAttribute('aria-pressed') === 'true' ? ':on' : ':off'))
          : undefined
      };
    });
    const want = fx.resolves;
    ok(seen.hash === want.hash, fx.hash + ': became ' + seen.hash + ', not ' + want.hash);
    ok(seen.tab === want.tab, fx.hash + ': highlighted ' + seen.tab + ', not ' + want.tab);
    ok(seen.rows === want.rows, fx.hash + ': ' + seen.rows + ' rows, the fixture says ' + want.rows);
    ok(
      seen.printCards === want.printCards,
      fx.hash + ': ' + seen.printCards + ' cards, the fixture says ' + want.printCards
    );
    ok(
      JSON.stringify(seen.picked) === JSON.stringify(want.picked),
      fx.hash + ': picked ' + JSON.stringify(seen.picked) + ', the fixture says ' + JSON.stringify(want.picked)
    );
    ok(
      JSON.stringify(seen.source) === JSON.stringify(want.source),
      fx.hash + ': sources ' + JSON.stringify(seen.source) + ', the fixture says ' + JSON.stringify(want.source)
    );
  }
  await rCtx.close();

  console.log('the stat line');
  const lines = JSON.parse(fs.readFileSync(path.join(FIX, 'statlines', 'equipment.json'), 'utf8'));
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
        id + '/' + lang + ': stat line is ' + JSON.stringify(parts) + ', the fixture says ' + JSON.stringify(lines[id][lang])
      );
    }
    await ctx.close();
  }

  console.log('filter group names select something');
  const PROBE = [
    ['eq_weapon', 'tier-2'], ['eq_weapon', 'src-core'], ['eq_weapon', 'cls-mag'],
    ['eq_weapon', 'trait-strength'], ['eq_weapon', 'range-melee'],
    ['eq_weapon', 'burden-2'], ['eq_weapon', 'line-uniq'],
    ['eq_armor', 'tier-1'], ['voa', 'tier-A'], ['other_frames', 'frame-colossus'],
    ['community', 'comm-Seaborne'],
    ['wondrous', 'kind-consumable']
  ];
  /* One context reused across all 18 opens (issues/phase-8, T3) - same
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

  await closeBrowser();
  console.log(rep.failed ? '\n' + rep.failed + ' FAILED' : '\ncontracts (dist/): match the fixtures');
  process.exit(rep.failed ? 1 : 0);
})();
