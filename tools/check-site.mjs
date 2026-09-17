/* Is the thing that is actually published the thing we meant to publish?
 *
 * Two callers, one list of assertions (tools/check-site.lib.mjs):
 *
 *     node tools/check-site.mjs https://artex-x.github.io/daggerheart-loot/
 *     node tools/check-site.mjs --dir _site
 *
 * The URL form runs as the deploy job's last step against
 * `steps.pages.outputs.page_url`, and by hand against the same URL - it
 * cannot un-publish anything and is not meant to: it is what tells a person
 * that the revert described in .github/workflows/ci.yml is needed, in the
 * place they already look. It retries: a fresh deploy is not served
 * instantly, and the CDN can hand back the previous page for a few seconds
 * after the API says the deployment is done, so a half-old, half-new read is
 * exactly the state worth waiting out.
 *
 * The `--dir` form runs inside the deploy job itself, before the deploy
 * step, against the local `_site/` collect output - the same assertions,
 * with no network and no retry, so a stale or partial local build is caught
 * before anything is published rather than after (issues/phase-8, T10/DP9).
 *
 * Issue 47, B13; issues/phase-8, B4.
 */
import { runChecks, fetchReader, dirReader } from './check-site.lib.mjs';

const TRIES = 6;
const WAIT_MS = 10_000;

function report(bad, where) {
  bad.forEach((m) => console.log('  FAIL ' + m));
  console.log(bad.length ? '\n' + bad.length + ' FAILED: ' + where : 'site published correctly: ' + where);
  process.exit(bad.length ? 1 : 0);
}

async function runDir(dir) {
  const bad = await runChecks(dirReader(dir));
  report(bad, dir);
}

async function runUrl(base) {
  const root = base.endsWith('/') ? base : base + '/';
  let bad = [];
  for (let i = 1; i <= TRIES; i++) {
    try {
      bad = await runChecks(fetchReader(root));
    } catch (e) {
      bad = ['request failed: ' + (e && e.message ? e.message : String(e))];
    }
    if (!bad.length) break;
    if (i < TRIES) {
      console.log('attempt ' + i + ' of ' + TRIES + ': ' + bad.length + ' check(s) failed, waiting');
      await new Promise((r) => setTimeout(r, WAIT_MS));
    }
  }
  report(bad, root);
}

const args = process.argv.slice(2);
const dirIdx = args.indexOf('--dir');

if (dirIdx >= 0) {
  const dir = args[dirIdx + 1];
  if (!dir) {
    console.log('  FAIL --dir needs a path - usage: node tools/check-site.mjs --dir <path>');
    process.exit(1);
  }
  await runDir(dir);
} else if (args[0]) {
  await runUrl(args[0]);
} else {
  console.log('  FAIL no base url - usage: node tools/check-site.mjs <url> | --dir <path>');
  process.exit(1);
}
