/* Собранная страница обязана открываться из папки.
 *
 * Это не украшение: `file://` записан в docs/specs/META.md, раздел 4, и ровно
 * он диктует относительный `base` и один классический бандл вместо модулей.
 * Проверка дешёвая, а ломается тихо - Chrome просто откажется грузить модуль,
 * и на Pages при этом всё будет выглядеть исправным.
 *
 * Заодно смотрит, что данные доехали: `fetch` к локальному json запрещён, и
 * набор приходит скриптом, который кладёт себя в window.LOOT.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';

const DIST = join(import.meta.dirname, '..', 'dist');
const INDEX = join(DIST, 'index.html');

let fail = 0;
const ok = (c, m) => {
  if (!c) {
    fail++;
    console.log('  FAIL ' + m);
  }
};

if (!existsSync(INDEX)) {
  console.log('  FAIL dist/index.html нет - сначала `npm run build`');
  process.exit(1);
}

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
page.on('requestfailed', (r) => errors.push('не загрузилось: ' + r.url()));

await page.goto(pathToFileURL(INDEX).href, { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 400));

ok(!errors.length, 'страница из папки ругается: ' + errors.join('; '));

const seen = await page.evaluate(() => ({
  mounted: !!document.querySelector('#app')?.childElementCount,
  data: typeof window.LOOT === 'object' && window.LOOT !== null,
  /* Абсолютный base сломал бы ровно это: адрес поехал бы от корня диска */
  scripts: [...document.querySelectorAll('script[src]')].map((s) => s.getAttribute('src')),
  modules: [...document.querySelectorAll('script[type="module"]')].length
}));

ok(seen.mounted, 'приложение не отрисовалось из папки');
ok(seen.data, 'данные не доехали: window.LOOT пуст');
ok(seen.modules === 0, 'в собранной странице остался script type="module" - из папки он не грузится');
ok(
  seen.scripts.every((s) => s.startsWith('./') || s.startsWith('../')),
  'адрес скрипта не относительный: ' + seen.scripts.join(', ')
);

await browser.close();
console.log(fail ? '\n' + fail + ' FAILED' : 'собранная страница открывается из папки');
process.exit(fail ? 1 : 0);
