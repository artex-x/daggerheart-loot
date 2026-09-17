/*
  The design these "plan.md section N" comments index below is
  issues/tg-preview-refresh/plan.md, deleted at 1a06122; read it with
  `git show 1a06122^:issues/tg-preview-refresh/plan.md`.

  Composes lib.mjs's pure buildManifest with the real repository tree:
  data.js -> derived.js's everything()/SITE, build-share-pages.js's page(),
  app/index.html (the deployed root's source), and og/<name> bytes read from
  disk.
*/
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildManifest } from './lib.mjs';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
// ROOT_HTML is app/index.html because that is what the build publishes as
// dist/index.html - the page every #/i/<id> share resolves to.
const ROOT_HTML = join(ROOT, 'app', 'index.html');

function readImageFrom(dir) {
  return (name) => {
    try {
      return readFileSync(join(dir, 'og', name));
    } catch {
      return null;
    }
  };
}

// `assets` means "the root's index.html and og/ both live under <dir>" - a
// built tree such as `dist`. Without it, og/ is read from the repository root
// (a tracked source directory that deploy copies verbatim) and the root's
// HTML from ROOT_HTML above - see `--assets` in run.mjs.
export function buildFromTree({ assets } = {}) {
  const dir = assets || ROOT;

  // data.js assigns to window.LOOT as a side effect of being require()'d;
  // guard so a second call in the same process reuses the cache instead of
  // finding `require` already resolved and doing nothing (build-share-pages.js
  // relies on the same guard).
  if (!globalThis.window) globalThis.window = {};
  if (!globalThis.window.LOOT) require(join(ROOT, 'data.js'));
  const L = globalThis.window.LOOT;

  const { everything, SITE } = require(join(ROOT, 'tools', 'derived.js'));
  const { page } = require(join(ROOT, 'tools', 'build-share-pages.js'));

  return buildManifest({
    site: SITE,
    L: everything(L),
    renderStub: page,
    rootHtml: readFileSync(assets ? join(dir, 'index.html') : ROOT_HTML, 'utf8'),
    readImage: readImageFrom(dir)
  });
}
