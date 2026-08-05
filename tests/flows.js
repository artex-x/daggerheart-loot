/* Real-browser checks for the behaviour a jsdom test cannot see:
   the modal following navigation, the address bar tracking a list,
   and what actually lands on the clipboard. */
const puppeteer = require('puppeteer');
const ROOT = 'file://' + require('path').join(__dirname, '..', 'index.html');

let fail = 0;
const ok = (cond, msg) => { if (!cond) { fail++; console.log('  FAIL ' + msg); } };
const b64 = s => Buffer.from(s, 'utf8').toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 900 });
  await page.evaluateOnNewDocument(() => {
    // observe the clipboard instead of the OS one
    window.isSecureContext = true;
    window.__clip = null;
    window.ClipboardItem = class { constructor(m) { this.map = m; } };
    Object.defineProperty(navigator, 'clipboard', {
      value: { write: i => { window.__clip = i[0].map; return Promise.resolve(); } }
    });
    localStorage.setItem('dhloot.lists.v2', JSON.stringify(
      [{ id: 'tst', name: 'Клад', ids: ['w3', 'w1'], created: 1 }]));
  });
  const go = async (h) => {
    await page.goto(ROOT + h, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 250));
  };
  const settle = () => new Promise(r => setTimeout(r, 300));
  const clip = k => page.evaluate(async (kk) => window.__clip ? await window.__clip[kk].text() : null, k);
  const has = s => page.evaluate(sel => !!document.querySelector(sel), s);

  /* ---------- modal must not outlive the route it belongs to ---------- */
  console.log('modal');
  await go('#/tables/wondrous');
  await page.click('[data-open="w3"]');
  await settle();
  ok(await has('#modal:not([hidden])'), 'modal did not open from a table row');
  ok(await has('#modal .craft a'), 'craft link missing inside the modal');
  await page.click('#modal .craft a');
  await settle();
  ok(!(await has('#modal:not([hidden])')), 'modal survived the navigation behind it');
  ok((await page.evaluate(() => location.hash)) === '#/i/w2', 'craft link did not navigate to the target');

  /* ---------- the address bar is the shareable link ---------- */
  console.log('list address');
  await go('#/lists');
  await page.click('.listcard-main');
  await settle();
  const h1 = await page.evaluate(() => location.hash);
  ok(h1.indexOf('#/l/') === 0, 'opening a list left a private-looking address: ' + h1);
  ok(await has('[data-copy-listtext]'), 'list editor did not render');
  const shareBtnUrl = await page.evaluate(() => {
    const el = document.querySelector('[data-share-list]');
    return el ? el.dataset.shareList : null;
  });
  ok(shareBtnUrl !== null, 'share control missing on the list page');

  await page.click('.lrow .row-x');           // drop an item
  await settle();
  const h2 = await page.evaluate(() => location.hash);
  ok(h2 !== h1, 'address did not follow the edit');
  ok(await has('[data-copy-listtext]'), 'editor lost after an edit');

  await go(h2);                                // reload straight from the address
  ok(await has('[data-copy-listtext]'), 'reloading the address did not reopen the editor');
  ok(!(await has('[data-act="saveShared"]')), 'own list offered as someone else\'s');

  // a list we do not have must read as shared, not as ours
  await go('#/l/' + b64('Чужой список\nw5,w6'));
  ok(await has('[data-act="saveShared"]'), 'a foreign list did not offer saving');
  ok(!(await has('[data-copy-listtext]')), 'a foreign list opened in the editor');
  await page.click('[data-act="saveShared"]');
  await settle();
  ok(await has('[data-copy-listtext]'), 'saving a shared list did not open it');

  // the old short link still works and upgrades itself
  await go('#/lists/tst');
  ok((await page.evaluate(() => location.hash)).indexOf('#/l/') === 0,
     'the old #/lists/<id> address was not upgraded');
  ok(await has('[data-copy-listtext]'), 'the old address did not open the editor');

  /* ---------- copy carries everything the player needs ---------- */
  console.log('clipboard');
  await go('#/i/w1');                          // references a spell
  await page.click('[data-copy-full]');
  await settle();
  let txt = await clip('text/plain');
  ok(/Неистовое опутывание/.test(txt), 'referenced card name missing from the copy');
  ok(/корни и лозы вырываются/.test(txt), 'referenced card text missing from the copy');

  let rich = await clip('text/html');
  ok(/<i>Неистовое опутывание/.test(rich),
     'attached block should be italic — bold reads as a separate entry');
  ok(!/<b>Неистовое опутывание/.test(rich), 'attached block still bold');
  ok(/<b>Смола Бездны/.test(rich), 'the item name itself should stay bold');

  await go('#/i/w118');                        // multi-line reference
  await page.click('[data-copy-full]');
  await settle();
  txt = await clip('text/plain');
  const beast = txt.split('Крупный зверь · Звериная Форма · Ранг 2')[1] || '';
  ok(beast.split('\n').filter(l => l.trim()).length >= 5,
     'the beastform block came out as one wall of text:\n' + beast);
  ok(/Сила \+3, Уклонение \+1\n/.test(txt), 'stat line not on its own line');
  rich = await clip('text/html');
  ok(/Уклонение \+1<br>/.test(rich), 'line breaks lost in the rich flavour');
  ok((await page.evaluate(() => document.querySelectorAll('.refs p br').length)) >= 4,
     'the card shows the reference without its line breaks');

  await go('#/i/w3');                          // has a craft partner
  await page.click('[data-copy-full]');
  await settle();
  txt = await clip('text/plain');
  ok(/Улучшается до: Чай Эфироцвета/.test(txt), 'craft line missing');
  ok(/слабую ауру вокруг видимых объектов/.test(txt), 'craft partner text missing from the copy');

  await go('#/i/w4');                          // plain item, nothing attached
  await page.click('[data-copy-full]');
  await settle();
  txt = await clip('text/plain');
  ok(!/Улучшается до|Получается из|·\s*Уровень/.test(txt), 'extra blocks added to a plain item');

  /* ---------- the whole roll as one message ---------- */
  console.log('roll copy');
  await go('#/roll/std');
  ok(await has('[data-copy-roll]'), 'no way to copy the whole roll');
  await page.click('[data-copy-roll]');
  await settle();
  txt = await clip('text/plain');
  const parts = txt.split('— ИЛИ —');
  ok(parts.length >= 2, 'options are not separated by a visible OR');
  ok(parts.every(p => p.trim().length > 20), 'an option came out empty');
  rich = await clip('text/html');
  ok(/<b>— ИЛИ —<\/b>/.test(rich), 'the OR is not emphasised in the rich flavour');
  ok(!/<a /.test(rich), 'roll copy should paste link-free');

  // a single-option roll has nothing to choose between
  await go('#/roll/wondrous');
  ok(!(await has('[data-copy-roll]')), 'copy-all offered on a roll with one result');

  await browser.close();
  console.log(fail ? '\n' + fail + ' FAILED' : '\nall flows pass');
  process.exit(fail ? 1 : 0);
})();
