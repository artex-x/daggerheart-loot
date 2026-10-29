/* Is the thing that is actually published the thing we meant to publish?
 *
 * Two callers, one list of assertions (tools/check-site.lib.mjs):
 *
 *     node tools/check-site.mjs https://daggerheart-loot.pages.dev/
 *     node tools/check-site.mjs --dir _site
 *     node tools/check-site.mjs --preview https://daggerheart-loot.pages.dev/
 *     node tools/check-site.mjs --mirror --dir _old
 *     node tools/check-site.mjs --mirror https://artex-x.github.io/daggerheart-loot/
 *
 * The URL form runs in the deploy job against the site's host after its
 * deploy, and by hand against the same URL - it
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
 * before anything is published rather than after. It also runs in the
 * `deploy-replay` job on every CI run outside `main`, so a task branch
 * finds the same defect before it lands.
 *
 * The `--preview` form runs the preview host's own list (`previewChecks`) with the
 * URL form's retries, in the deploy job after the preview host deploy and before
 * the old host's deploy.
 *
 * `--mirror` selects the old host's list (`mirrorChecks`), with `--dir` before its
 * deploy or with a URL after it (docs/specs/META.md section 9, "The old host").
 */
import {
  runChecks,
  fetchReader,
  dirReader,
  previewChecks,
  mirrorChecks,
  checks
} from './check-site.lib.mjs';

const TRIES = 6;
const WAIT_MS = 10_000;

function report(bad, where) {
  bad.forEach((m) => console.log('  FAIL ' + m));
  console.log(
    bad.length ? '\n' + bad.length + ' FAILED: ' + where : 'site published correctly: ' + where
  );
  process.exit(bad.length ? 1 : 0);
}

async function runDir(dir, list) {
  const bad = await runChecks(dirReader(dir), list);
  report(bad, dir);
}

async function runUrl(base, list) {
  const root = base.endsWith('/') ? base : base + '/';
  let bad = [];
  for (let i = 1; i <= TRIES; i++) {
    try {
      bad = await runChecks(fetchReader(root), list);
    } catch (e) {
      bad = ['request failed: ' + (e && e.message ? e.message : String(e))];
    }
    if (!bad.length) break;
    if (i < TRIES) {
      console.log(
        'attempt ' + i + ' of ' + TRIES + ': ' + bad.length + ' check(s) failed, waiting'
      );
      await new Promise((r) => setTimeout(r, WAIT_MS));
    }
  }
  report(bad, root);
}

const all = process.argv.slice(2);
const mirror = all.includes('--mirror');
const args = all.filter((a) => a !== '--mirror');
const siteList = mirror ? mirrorChecks() : checks();
const dirIdx = args.indexOf('--dir');
const previewIdx = args.indexOf('--preview');

if (dirIdx >= 0) {
  const dir = args[dirIdx + 1];
  if (!dir) {
    console.log('  FAIL --dir needs a path - usage: node tools/check-site.mjs --dir <path>');
    process.exit(1);
  }
  await runDir(dir, siteList);
} else if (previewIdx >= 0) {
  const origin = args[previewIdx + 1];
  if (!origin) {
    console.log(
      '  FAIL --preview needs an origin - usage: node tools/check-site.mjs --preview <url>'
    );
    process.exit(1);
  }
  await runUrl(origin, previewChecks());
} else if (args[0]) {
  await runUrl(args[0], siteList);
} else {
  console.log(
    '  FAIL no base url - usage: node tools/check-site.mjs [--mirror] <url> | [--mirror] --dir <path> | --preview <url>'
  );
  process.exit(1);
}
