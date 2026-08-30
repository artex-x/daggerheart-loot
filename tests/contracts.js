/* Public contracts against the golden fixtures in docs/fixtures.

   A fixture is a file, not whatever the code happens to do today: a link
   someone pasted into a chat six months ago has to keep opening after the app
   is rewritten. So everything here is compared with what is on disk, and the
   base64 and checksum work is done by a second implementation - one that cannot
   agree with the app in an error.

   This is also where the thing nobody was checking lives: the filter group
   names. A group a table does not offer is ignored silently and the table stays
   whole, which is how `f_rg-melee` from llms.txt spent a year looking like a
   working filter while selecting nothing. */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { ROOT, ready } = require('./lib.js');

const FIX = path.join(__dirname, '..', 'docs', 'fixtures');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL ' + m); } };

/* A separate implementation of the encoding - that is the whole point */
const b64url = s => Buffer.from(s, 'utf8').toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
/* FNV-1a, as in the app, but written again here */
function stampOf(parts){
  const body = parts.join(',');
  let h = 2166136261;
  for (let i = 0; i < body.length; i++) {
    h ^= body.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return parts.length.toString(36) + '.' + (h >>> 0).toString(36).slice(-4) + '~';
}

const N_REC = '\x1e', N_SEP = '\x1f';

(async () => {
  /* ---------- list fixtures: the pure half ---------- */
  console.log('list encoding');
  const listFiles = fs.readdirSync(path.join(FIX, 'lists')).filter(f => f.endsWith('.json'));
  ok(listFiles.length >= 6, 'fewer than six list fixtures: ' + listFiles.length);
  const lists = listFiles.map(f => JSON.parse(fs.readFileSync(path.join(FIX, 'lists', f), 'utf8')));

  lists.forEach(function (fx) {
    ['player', 'gm'].forEach(function (who) {
      const side = fx[who];
      ok(b64url(side.raw) === side.payload,
         fx.id + '/' + who + ': payload is not base64url(utf8(raw))');
      /* The items line starts with the checksum, and it has to match the body */
      const itemsLine = side.raw.split('\n')[1] || '';
      const cut = itemsLine.indexOf('~');
      ok(cut > 0, fx.id + '/' + who + ': no checksum on the items line');
      const parts = itemsLine.slice(cut + 1).split(',');
      ok(stampOf(parts) === itemsLine.slice(0, cut + 1),
         fx.id + '/' + who + ': the checksum does not match the items');
      ok(parts.length === fx.list.ids.length,
         fx.id + '/' + who + ': the link holds a different number of entries than the list');
    });
    /* The player link carries no unmarked note */
    const hidden = fx.player.raw.split(N_REC).slice(1).filter(function (rec) {
      const id = rec.slice(0, rec.indexOf(N_SEP));
      return id.charAt(0) !== '+' && id !== '$';
    });
    ok(!hidden.length, fx.id + ': a GM note survived into the player link');
  });

  /* ---------- list fixtures: against the app ---------- */
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const fresh = async (seed) => {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    page.on('pageerror', e => { fail++; console.log('  FAIL the page threw: ' + e.message); });
    await page.setViewport({ width: 1280, height: 900 });
    if (seed) await page.evaluateOnNewDocument(seed);
    return { ctx, page };
  };
  const open = async (page, hash) => {
    await page.goto(ROOT + hash, { waitUntil: 'domcontentloaded' });
    await ready(page);
    await new Promise(r => setTimeout(r, 160));
  };
  const text = page => page.evaluate(() => document.body.innerText);

  console.log('the link the app writes');
  for (const fx of lists) {
    const { ctx, page } = await fresh(function (l) {
      localStorage.setItem('dhloot.lists.v2', JSON.stringify([l]));
    });
    await page.evaluateOnNewDocument(function (l) {
      localStorage.setItem('dhloot.lists.v2', JSON.stringify([l]));
    }, fx.list);
    await open(page, '#/lists/' + fx.list.id);
    const inBar = (await page.evaluate(() => location.hash)).replace('#/l/', '');
    ok(inBar === fx.player.payload,
       fx.id + ': the address bar does not hold the link from the fixture');
    await ctx.close();
  }

  console.log('the link the app reads');
  for (const fx of lists) {
    const notes = [fx.list.note, fx.list.hnote].concat(
      Object.keys(fx.list.meta || {}).map(id => fx.list.meta[id].note),
      Object.keys(fx.list.meta || {}).map(id => fx.list.meta[id].hnote)).filter(Boolean);
    const forPlayers = [fx.list.note].concat(
      Object.keys(fx.list.meta || {}).map(id => fx.list.meta[id].note)).filter(Boolean);
    const gmOnly = notes.filter(n => forPlayers.indexOf(n) < 0);

    const a = await fresh();
    await open(a.page, '#/l/' + fx.player.payload);
    const seenPlayer = await text(a.page);
    ok(seenPlayer.indexOf(fx.list.name) >= 0, fx.id + ': the player link did not open');
    forPlayers.forEach(n => ok(seenPlayer.indexOf(n) >= 0,
      fx.id + ': a player note is missing from the player link'));
    gmOnly.forEach(n => ok(seenPlayer.indexOf(n) < 0,
      fx.id + ': a GM note is visible through the player link'));
    await a.ctx.close();

    const b = await fresh();
    await open(b.page, '#/l/' + fx.gm.payload);
    const seenGm = await text(b.page);
    notes.forEach(n => ok(seenGm.indexOf(n) >= 0,
      fx.id + ': a note is missing from the GM link'));
    await b.ctx.close();
  }

  /* A truncated link must not open as a shorter list - that is what the
     checksum is for. Cut the items line, not the note tail, or there is nothing
     to cut. */
  console.log('a truncated link');
  const big = lists.filter(f => f.list.ids.length > 1)[0];
  const cutRaw = big.gm.raw.slice(0, big.gm.raw.lastIndexOf(','));
  const c = await fresh();
  await open(c.page, '#/l/' + b64url(cutRaw));
  const seenCut = await text(c.page);
  /* Matching the app's own message, which is why this pattern is bilingual */
  ok(/повреждена|damaged/i.test(seenCut),
     'a truncated link opened as a list instead of a broken-link page');
  await c.ctx.close();

  /* ---------- addresses ---------- */
  console.log('the address grammar');
  const routes = JSON.parse(fs.readFileSync(path.join(FIX, 'urls', 'routes.json'), 'utf8'));
  ok(routes.length >= 20, 'fewer than twenty route fixtures: ' + routes.length);
  for (const fx of routes) {
    const { ctx, page } = await fresh();
    await open(page, fx.hash);
    const seen = await page.evaluate(() => {
      const on = document.querySelector('#tabs a.on');
      const srcBtns = [].slice.call(document.querySelectorAll('[data-act="src"]'));
      return {
        hash: location.hash,
        tab: on ? on.getAttribute('href') : null,
        rows: document.querySelectorAll('.rows .row[data-row]').length,
        printCards: document.querySelectorAll('.pcard:not(.blank)').length,
        picked: [].slice.call(document.querySelectorAll('.fpill')).map(e => e.dataset.val),
        source: srcBtns.length
          ? srcBtns.map(e => e.dataset.val + (e.classList.contains('on') ? ':on' : ':off'))
          : undefined
      };
    });
    const want = fx.resolves;
    ok(seen.hash === want.hash, fx.hash + ': became ' + seen.hash + ', not ' + want.hash);
    ok(seen.tab === want.tab, fx.hash + ': highlighted ' + seen.tab + ', not ' + want.tab);
    ok(seen.rows === want.rows,
       fx.hash + ': ' + seen.rows + ' rows, the fixture says ' + want.rows);
    ok(seen.printCards === want.printCards,
       fx.hash + ': ' + seen.printCards + ' cards, the fixture says ' + want.printCards);
    ok(JSON.stringify(seen.picked) === JSON.stringify(want.picked),
       fx.hash + ': picked ' + JSON.stringify(seen.picked) +
       ', the fixture says ' + JSON.stringify(want.picked));
    ok(JSON.stringify(seen.source) === JSON.stringify(want.source),
       fx.hash + ': sources ' + JSON.stringify(seen.source) +
       ', the fixture says ' + JSON.stringify(want.source));
    await ctx.close();
  }

  /* ---------- filter group names ---------- */
  /* Every group named in llms.txt and in CONTRACTS.md has to select something.
     An unknown group is not an error - it simply does nothing, and a typo in
     the documentation looks like a working link. */
  console.log('filter group names');
  const PROBE = [
    ['eq_weapon', 'tier-2'], ['eq_weapon', 'src-core'], ['eq_weapon', 'cls-mag'],
    ['eq_weapon', 'trait-strength'], ['eq_weapon', 'range-melee'],
    ['eq_weapon', 'burden-2'], ['eq_weapon', 'line-uniq'],
    ['eq_armor', 'tier-1'], ['voa', 'tier-A'], ['frames', 'frame-colossus'],
    ['community', 'comm-Seaborne'],
    /* `kind` exists only where there really is more than one kind: on core_item
       the kind is the table, and the group is not in the panel at all */
    ['wondrous', 'kind-consumable']
  ];
  const rowsAt = async (hash) => {
    const { ctx, page } = await fresh();
    await open(page, hash);
    const n = await page.evaluate(() => document.querySelectorAll('.rows .row[data-row]').length);
    await ctx.close();
    return n;
  };
  const whole = {};
  for (const [tid] of PROBE) if (!(tid in whole)) whole[tid] = await rowsAt('#/tables/' + tid);
  for (const [tid, seg] of PROBE) {
    const n = await rowsAt('#/tables/' + tid + '/f_' + seg);
    ok(n > 0 && n < whole[tid],
       tid + '/f_' + seg + ': the group selects nothing (' + n + ' of ' + whole[tid] +
       ') - most likely its name is not spelled the way the code expects');
  }

  /* The documentation has to name the same groups. A mistake here is invisible
     on screen: the link opens, the table is whole, there is no filter. */
  const docs = fs.readFileSync(path.join(__dirname, '..', 'llms.txt'), 'utf8') +
               fs.readFileSync(path.join(FIX, '..', 'specs', 'CONTRACTS.md'), 'utf8') +
               fs.readFileSync(path.join(FIX, '..', 'specs', 'ROUTES.md'), 'utf8');
  ['tier', 'src', 'cls', 'trait', 'range', 'burden', 'line', 'kind', 'frame', 'comm']
    .forEach(function (g) {
      ok(new RegExp('`' + g + '`').test(docs), 'group `' + g + '` is documented nowhere');
    });
  /* Absence is checked only in llms.txt: that is what an agent builds an address
     from, while the specs name these two on purpose - as what the groups are not. */
  const machine = fs.readFileSync(path.join(__dirname, '..', 'llms.txt'), 'utf8');
  ['`rg`', '`bu`'].forEach(function (g) {
    ok(machine.indexOf(g) < 0, 'llms.txt still carries the non-existent group ' + g);
  });

  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\ncontracts match the fixtures');
  process.exit(fail ? 1 : 0);
})();
