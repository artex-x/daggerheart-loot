import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import type { Loot } from '../lib/data.js';

interface Derived {
  dataJson: (loot: unknown) => string;
  catalogCsv: (loot: unknown) => string;
}

let loot: unknown;
let text: string | undefined;

/* data.js's window.LOOT, evaluated once per test file: vitest isolates
   each file's modules (about 28 ms a file, measured 2026-10-28). */
function source(): unknown {
  if (loot === undefined) {
    const sandbox: { window: { LOOT?: unknown } } = { window: {} };
    runInNewContext(
      readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.js'), 'utf8'),
      sandbox
    );
    loot = sandbox.window.LOOT;
  }
  return loot;
}

const derived = (): Derived =>
  createRequire(import.meta.url)('../../../tools/derived.js') as Derived;

/** Returns a fresh copy of the catalog as the published `data.json` holds
 * it: `tools/derived.js` `dataJson` of `data.js`, parsed. */
export function readLoot(): Loot {
  text ??= derived().dataJson(source());
  return JSON.parse(text) as Loot;
}

/** Returns the text of the published `catalog.csv`: `tools/derived.js`
 * `catalogCsv` of `data.js`, as `node tools/build.js` writes it. */
export function readCatalogCsv(): string {
  return derived().catalogCsv(source());
}
