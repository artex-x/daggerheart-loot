/* The production bundle carries no fake cloud; the test bundle does.
 *
 * `app/src/ports/fake-cloud.ts` holds a marker string. `dist/assets/*.js`
 * must not contain it, and `dist-test/assets/*.js` must - the second half
 * is what stops a renamed marker from turning this guard into a pass that
 * checks nothing. `dist/` must not hold the seed's mail domain either: the
 * seed can reach a bundle without the module that carries the marker. Run
 * by `npm run check:built` and CI's `check` job, after both builds.
 * docs/specs/COVERAGE.md, "Test layers". */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MARKER = 'dhloot-fake-cloud';
/* The domain of every user in `app/src/ports/fake-cloud-seed.ts`. */
const SEED_DOMAIN = '@example.test';
const ROOT = join(import.meta.dirname, '..');

/** The `.js` files under `<dir>/assets/` holding `needle`, or null when
 *  that directory is not built. */
function carriers(dir, needle = MARKER) {
  const assets = join(ROOT, dir, 'assets');
  if (!existsSync(assets)) return null;
  return readdirSync(assets)
    .filter((f) => f.endsWith('.js'))
    .filter((f) => readFileSync(join(assets, f), 'utf8').includes(needle));
}

let fail = 0;
const prod = carriers('dist');
const prodSeed = carriers('dist', SEED_DOMAIN);
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

if (prodSeed?.length) {
  fail++;
  console.log(
    '  FAIL dist/ carries the fake cloud seed ("' + SEED_DOMAIN + '"): ' + prodSeed.join(', ')
  );
} else if (prodSeed) {
  console.log('  ok   dist/ carries no fake cloud seed');
}

// Every caller builds dist/ unconfigured, so a chunk here is a shell that
// leaked VITE_SUPABASE_*, and the budget would measure it against 180 kB.
const accountChunks = prod
  ? readdirSync(join(ROOT, 'dist', 'assets'))
      .map((f) => join('dist', 'assets', f))
      .filter((f) => /[\\/]assets[\\/]supabase-[^\\/]*\.js$/.test(f))
  : [];
if (accountChunks.length) {
  fail++;
  console.log(
    '  FAIL dist/ carries the account client chunk - `check:built` builds unconfigured; unset `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in this shell: ' +
      accountChunks.join(', ')
  );
} else if (prod) {
  console.log('  ok   dist/ carries no account client chunk');
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
