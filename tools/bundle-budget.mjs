/* The bundle size budget.
 *
 * Gzip of the code, data excluded: `data.js` is 1459 records, big by definition
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

/* Two limits by what was built: the configured build (`deploy`'s, and the
   one `npm run e2e` leaves) adds the account client (auth-js, postgrest-js,
   realtime-js and storage-js) as a chunk loaded after first paint - 297.5
   kB in all, under 303 - while the unconfigured one `check:built`
   measures, 236.3 kB, must stay under 242 (both measured 2026-10-15 with
   the formatted text box, its toolbar and the two-language forms; each
   passed its old limit, so both rose by the rule below). A batch raises a
   passed budget to its size plus about 5 kB, never past 350 and 250 (decisions
   "The bundle ceilings rise to 300 kB configured and 250 unconfigured" and
   "The configured bundle ceiling rises to 350 kB"). */
const withAccount = code.some((f) => /[\\/]assets[\\/]supabase-[^\\/]*\.js$/.test(f));
const BUDGET_KB = withAccount ? 303 : 242; // gzip, code only
const WHICH = withAccount ? 'with the account client chunk' : 'no account client chunk';

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
  console.log(
    `\n  FAIL budget of ${String(BUDGET_KB)} kB (${WHICH}) exceeded by ${(kb - BUDGET_KB).toFixed(1)} kB`
  );
  process.exit(1);
}
console.log(`\nwithin the ${String(BUDGET_KB)} kB budget (${WHICH})`);
