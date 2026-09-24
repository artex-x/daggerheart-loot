/* The production bundle carries no fake cloud; the test bundle does.
 *
 * `app/src/ports/fake-cloud.ts` holds a marker string. `dist/assets/*.js`
 * must not contain it, and `dist-test/assets/*.js` must - the second half
 * is what stops a renamed marker from turning this guard into a pass that
 * checks nothing. Run by `npm run check:built` and CI's `check` job, after
 * both builds. docs/specs/COVERAGE.md, "Test layers". */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MARKER = 'dhloot-fake-cloud';
const ROOT = join(import.meta.dirname, '..');

/** The `.js` files under `<dir>/assets/` holding the marker, or null when
 *  that directory is not built. */
function carriers(dir) {
  const assets = join(ROOT, dir, 'assets');
  if (!existsSync(assets)) return null;
  return readdirSync(assets)
    .filter((f) => f.endsWith('.js'))
    .filter((f) => readFileSync(join(assets, f), 'utf8').includes(MARKER));
}

let fail = 0;
const prod = carriers('dist');
const test = carriers('dist-test');

if (prod === null) {
  fail++;
  console.log('  FAIL no dist/assets - run `npm run build` first');
} else if (prod.length) {
  fail++;
  console.log('  FAIL dist/ carries the fake cloud: ' + prod.join(', '));
} else {
  console.log('  ok   dist/ carries no fake cloud');
}

if (test === null) {
  fail++;
  console.log('  FAIL no dist-test/assets - run `npm run build:test` first');
} else if (!test.length) {
  fail++;
  console.log('  FAIL dist-test/ carries no "' + MARKER + '" - was the marker renamed?');
} else {
  console.log('  ok   dist-test/ carries the fake cloud: ' + test.join(', '));
}

process.exit(fail ? 1 : 0);
