/* Публичные контракты против золотых образцов из docs/fixtures.

   Образец - это файл, а не то, что сегодня делает код: ссылка, которую кто-то
   вставил в чат полгода назад, обязана открываться и после переписывания
   приложения. Поэтому здесь всё сверяется с записанным на диске, а разбор
   base64 и контрольной суммы сделан отдельной реализацией - совпасть с
   приложением в ошибке они не смогут.

   Сюда же попадает то, чего не ловил никто: имена групп фильтра. Группа,
   которой у таблицы нет, молча игнорируется, и таблица остаётся целой - так
   `f_rg-melee` из llms.txt год выглядел работающим фильтром, ничего не
   отбирая. */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { ROOT, ready } = require('./lib.js');

const FIX = path.join(__dirname, '..', 'docs', 'fixtures');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL ' + m); } };

/* Своя реализация кодирования - в этом весь смысл проверки */
const b64url = s => Buffer.from(s, 'utf8').toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
/* FNV-1a, как в приложении, но написанная здесь заново */
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
  /* ---------- образцы списков: чистая часть ---------- */
  console.log('кодирование списка');
  const listFiles = fs.readdirSync(path.join(FIX, 'lists')).filter(f => f.endsWith('.json'));
  ok(listFiles.length >= 6, 'образцов списков меньше шести: ' + listFiles.length);
  const lists = listFiles.map(f => JSON.parse(fs.readFileSync(path.join(FIX, 'lists', f), 'utf8')));

  lists.forEach(function (fx) {
    ['player', 'gm'].forEach(function (who) {
      const side = fx[who];
      ok(b64url(side.raw) === side.payload,
         fx.id + '/' + who + ': payload не равен base64url(utf8(raw))');
      /* Строка позиций начинается с метки, и метка должна сходиться с телом */
      const itemsLine = side.raw.split('\n')[1] || '';
      const cut = itemsLine.indexOf('~');
      ok(cut > 0, fx.id + '/' + who + ': на строке позиций нет метки');
      const parts = itemsLine.slice(cut + 1).split(',');
      ok(stampOf(parts) === itemsLine.slice(0, cut + 1),
         fx.id + '/' + who + ': метка не сходится с позициями');
      ok(parts.length === fx.list.ids.length,
         fx.id + '/' + who + ': позиций в ссылке не столько, сколько в списке');
    });
    /* Ссылка игрокам не несёт ни одной непомеченной заметки */
    const hidden = fx.player.raw.split(N_REC).slice(1).filter(function (rec) {
      const id = rec.slice(0, rec.indexOf(N_SEP));
      return id.charAt(0) !== '+' && id !== '$';
    });
    ok(!hidden.length, fx.id + ': в ссылке игрокам осталась мастерская заметка');
  });

  /* ---------- образцы списков: против приложения ---------- */
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const fresh = async (seed) => {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    page.on('pageerror', e => { fail++; console.log('  FAIL страница упала: ' + e.message); });
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

  console.log('ссылка, которую пишет приложение');
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
       fx.id + ': в адресной строке не та ссылка, что в образце');
    await ctx.close();
  }

  console.log('ссылка, которую читает приложение');
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
    ok(seenPlayer.indexOf(fx.list.name) >= 0, fx.id + ': ссылка игрокам не открылась');
    forPlayers.forEach(n => ok(seenPlayer.indexOf(n) >= 0,
      fx.id + ': по ссылке игрокам пропала заметка для игроков'));
    gmOnly.forEach(n => ok(seenPlayer.indexOf(n) < 0,
      fx.id + ': по ссылке игрокам видна мастерская заметка'));
    await a.ctx.close();

    const b = await fresh();
    await open(b.page, '#/l/' + fx.gm.payload);
    const seenGm = await text(b.page);
    notes.forEach(n => ok(seenGm.indexOf(n) >= 0,
      fx.id + ': по своей ссылке пропала заметка'));
    await b.ctx.close();
  }

  /* Обрезанная ссылка не должна открываться списком поменьше: на это и стоит
     метка. Режем строку позиций, а не хвост заметок, иначе резать нечего. */
  console.log('обрезанная ссылка');
  const big = lists.filter(f => f.list.ids.length > 1)[0];
  const cutRaw = big.gm.raw.slice(0, big.gm.raw.lastIndexOf(','));
  const c = await fresh();
  await open(c.page, '#/l/' + b64url(cutRaw));
  const seenCut = await text(c.page);
  ok(/повреждена|damaged/i.test(seenCut),
     'обрезанная ссылка открылась списком, а не сообщением о поломке');
  await c.ctx.close();

  /* ---------- адреса ---------- */
  console.log('грамматика адресов');
  const routes = JSON.parse(fs.readFileSync(path.join(FIX, 'urls', 'routes.json'), 'utf8'));
  ok(routes.length >= 20, 'образцов адресов меньше двадцати: ' + routes.length);
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
    ok(seen.hash === want.hash, fx.hash + ': адрес стал ' + seen.hash + ', а не ' + want.hash);
    ok(seen.tab === want.tab, fx.hash + ': подсвечен раздел ' + seen.tab + ', а не ' + want.tab);
    ok(seen.rows === want.rows,
       fx.hash + ': строк ' + seen.rows + ', а в образце ' + want.rows);
    ok(seen.printCards === want.printCards,
       fx.hash + ': карт ' + seen.printCards + ', а в образце ' + want.printCards);
    ok(JSON.stringify(seen.picked) === JSON.stringify(want.picked),
       fx.hash + ': выбрано ' + JSON.stringify(seen.picked) +
       ', а в образце ' + JSON.stringify(want.picked));
    ok(JSON.stringify(seen.source) === JSON.stringify(want.source),
       fx.hash + ': источники ' + JSON.stringify(seen.source) +
       ', а в образце ' + JSON.stringify(want.source));
    await ctx.close();
  }

  /* ---------- имена групп фильтра ---------- */
  /* Каждая группа, названная в llms.txt и в CONTRACTS.md, обязана что-то
     отбирать. Неизвестная группа не ошибка - она просто ничего не делает, и
     опечатка в документации выглядит рабочей ссылкой. */
  console.log('имена групп фильтра');
  const PROBE = [
    ['eq_weapon', 'tier-2'], ['eq_weapon', 'src-core'], ['eq_weapon', 'cls-mag'],
    ['eq_weapon', 'trait-strength'], ['eq_weapon', 'range-melee'],
    ['eq_weapon', 'burden-2'], ['eq_weapon', 'line-uniq'],
    ['eq_armor', 'tier-1'], ['voa', 'tier-A'], ['frames', 'frame-colossus'],
    ['community', 'comm-Seaborne'],
    /* `kind` есть только там, где видов правда несколько: у core_item вид и
       есть таблица, и группы в панели нет вовсе */
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
       tid + '/f_' + seg + ': группа ничего не отбирает (' + n + ' из ' + whole[tid] +
       ') - скорее всего, имя группы написано не так, как ждёт код');
  }

  /* Документация обязана называть те же группы. Ошибка здесь не видна на
     экране: ссылка открывается, таблица целая, фильтра нет. */
  const docs = fs.readFileSync(path.join(__dirname, '..', 'llms.txt'), 'utf8') +
               fs.readFileSync(path.join(FIX, '..', 'specs', 'CONTRACTS.md'), 'utf8') +
               fs.readFileSync(path.join(FIX, '..', 'specs', 'ROUTES.md'), 'utf8');
  ['tier', 'src', 'cls', 'trait', 'range', 'burden', 'line', 'kind', 'frame', 'comm']
    .forEach(function (g) {
      ok(new RegExp('`' + g + '`').test(docs), 'группа `' + g + '` нигде не описана');
    });
  /* Отсутствие проверяется только в llms.txt: по нему агент собирает адрес, а
     в спеках эти два имени названы нарочно - как то, чем группы не являются. */
  const machine = fs.readFileSync(path.join(__dirname, '..', 'llms.txt'), 'utf8');
  ['`rg`', '`bu`'].forEach(function (g) {
    ok(machine.indexOf(g) < 0, 'в llms.txt осталась несуществующая группа ' + g);
  });

  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\nконтракты совпадают с образцами');
  process.exit(fail ? 1 : 0);
})();
