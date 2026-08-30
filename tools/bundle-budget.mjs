/* Бюджет на размер бандла.
 *
 * Считается gzip кода, без данных: `data.js` - это 1061 запись, он большой по
 * определению и от того, как написано приложение, не зависит. А вот код растёт
 * незаметно, по одной удобной зависимости за раз, и заметить это можно только
 * числом.
 *
 * Порог не «сколько сейчас», а «сколько не жалко»: он должен ловить прыжок от
 * новой библиотеки, а не падать от каждой добавленной кнопки. Поднимать его
 * можно, но осознанно и в том же коммите, что и причина.
 */
import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(import.meta.dirname, '..', 'dist');
const BUDGET_KB = 120; // gzip, только код

if (!existsSync(DIST)) {
  console.log('  FAIL dist нет - сначала `npm run build`');
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]
  );

const code = walk(DIST).filter(
  (f) => (f.endsWith('.js') || f.endsWith('.css')) && !f.endsWith('data.js')
);

let total = 0;
for (const f of code) {
  const size = gzipSync(readFileSync(f)).length;
  total += size;
  console.log('  ' + (size / 1024).toFixed(1).padStart(7) + ' kB  ' + f.slice(DIST.length + 1));
}

const kb = total / 1024;
console.log('  ' + '-'.repeat(30));
console.log('  ' + kb.toFixed(1).padStart(7) + ' kB  всего (gzip, без данных)');

if (kb > BUDGET_KB) {
  console.log(`\n  FAIL бюджет ${String(BUDGET_KB)} kB превышен на ${(kb - BUDGET_KB).toFixed(1)} kB`);
  process.exit(1);
}
console.log(`\nв бюджет ${String(BUDGET_KB)} kB укладываемся`);
