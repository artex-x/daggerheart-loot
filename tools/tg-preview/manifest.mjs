/*
  Composes lib.mjs's pure buildManifest with the real repository tree:
  data.js -> derived.js's everything()/SITE, build-share-pages.js's page(),
  app/index.html (the deployed root's source), and og/<name> bytes read from
  disk. This is the one
  seam issue 47's cut-over touches (plan.md section 3.2, section 13): if the
  stub generator moves into the Vite build, the two `require()`s below move
  with it and nothing else here changes.
*/
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildManifest } from './lib.mjs';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
// Since issue 47's cut-over ci.yml deploys dist/index.html, built from
// app/index.html; the legacy root index.html is not published. Fingerprinting
// it would leave the root URL - the one every #/i/<id> share resolves to -
// silently unrefreshed the first time app/index.html's og:description moves
// alone (B6 review R5). The two files' og: tags are identical today.
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
