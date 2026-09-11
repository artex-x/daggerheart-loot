/*
  Composes lib.mjs's pure buildManifest with the real repository tree:
  data.js -> derived.js's everything()/SITE, build-share-pages.js's page(),
  the root index.html, and og/<name> bytes read from disk. This is the one
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

function readImageFrom(dir) {
  return (name) => {
    try {
      return readFileSync(join(dir, 'og', name));
    } catch {
      return null;
    }
  };
}

// `assets` is where og/ and index.html live: the repository root today, or a
// build output directory (e.g. `dist`) once issue 47 makes them one - see
// `--assets` in run.mjs.
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
    rootHtml: readFileSync(join(dir, 'index.html'), 'utf8'),
    readImage: readImageFrom(dir)
  });
}
