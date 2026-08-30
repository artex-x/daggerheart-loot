/* The bundle size budget.
 *
 * Gzip of the code, data excluded: `data.js` is 1061 records, big by definition
 * and unaffected by how the app is written. The code, on the other hand, grows
 * invisibly - one convenient dependency at a time - and a number is the only way
 * to notice.
 *
 * The threshold is not "what it is today" but "what would not be a shame": it
 * should catch the jump a new library causes, not fail on every added button.
 * Raising it is allowed, deliberately, in the same commit as the reason.
 */
import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(import.meta.dirname, '..', 'dist');
const BUDGET_KB = 120; // gzip, code only

if (!existsSync(DIST)) {
  console.log('  FAIL no dist - run `npm run build` first');
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
console.log('  ' + kb.toFixed(1).padStart(7) + ' kB  total (gzip, code only)');

if (kb > BUDGET_KB) {
  console.log(`\n  FAIL budget of ${String(BUDGET_KB)} kB exceeded by ${(kb - BUDGET_KB).toFixed(1)} kB`);
  process.exit(1);
}
console.log(`\nwithin the ${String(BUDGET_KB)} kB budget`);
