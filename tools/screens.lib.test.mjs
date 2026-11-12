// The README screenshots: node --test tools/screens.lib.test.mjs
// Checks the shot table, the budgets and that both READMEs show the same set.

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  FILE_BUDGET,
  SCREENS_DIR,
  SET_BUDGET,
  SHOTS,
  allImages,
  changedShare,
  imageRefs,
  outPath
} from './screens.lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readme = (name) => readFileSync(path.join(ROOT, name), 'utf8');
const names = (lang) =>
  allImages()
    .filter((i) => i.lang === lang)
    .map((i) => path.basename(i.file));

describe('the shot table', () => {
  it('names each shot once and builds from a known directory', () => {
    assert.equal(new Set(SHOTS.map((s) => s.name)).size, SHOTS.length);
    for (const s of SHOTS) assert.ok(['dist', 'dist-test'].includes(s.build), s.name);
  });

  it('puts every image of a shot under the images folder, named by shot and language', () => {
    assert.equal(outPath(SHOTS[0], 'ru'), SCREENS_DIR + '/roll-ru.webp');
    assert.equal(allImages().length, SHOTS.length * 2);
  });

  it('opens an English shot under /en/ and a Russian one outside it', () => {
    for (const s of SHOTS) {
      assert.ok(s.route.en.startsWith('/en/'), s.name);
      assert.ok(!s.route.ru.startsWith('/en/'), s.name);
    }
  });
});

describe('the image files', () => {
  it('exist and each stays under the file budget', () => {
    for (const { file } of allImages()) {
      const full = path.join(ROOT, file);
      assert.ok(existsSync(full), file + ' is missing: run npm run screens');
      assert.ok(statSync(full).size <= FILE_BUDGET, file + ' is over the file budget');
    }
  });

  it('stay under the set budget', () => {
    const total = allImages().reduce(
      (n, { file }) => n + statSync(path.join(ROOT, file)).size,
      0
    );
    assert.ok(total <= SET_BUDGET, 'the set is ' + String(total) + ' bytes');
  });

  it('leave no file in the folder that the shot table does not name', () => {
    const named = new Set(allImages().map((i) => path.basename(i.file)));
    const present = readdirSync(path.join(ROOT, SCREENS_DIR));
    assert.deepEqual(
      present.filter((f) => !named.has(f)),
      []
    );
  });
});

describe('the READMEs', () => {
  it('show the English images in README.md and the Russian ones in README.ru.md', () => {
    assert.deepEqual([...new Set(imageRefs(readme('README.md')))].sort(), names('en').sort());
    assert.deepEqual(
      [...new Set(imageRefs(readme('README.ru.md')))].sort(),
      names('ru').sort()
    );
  });

  it('read a text with no reference as an empty list', () => {
    assert.deepEqual(imageRefs('no image here'), []);
    assert.deepEqual(imageRefs('<img src="docs/img/screens/roll-en.webp">'), ['roll-en.webp']);
  });
});

describe('changedShare', () => {
  it('counts the pixels that move more than the noise and treats a size change as total', () => {
    const a = new Uint8ClampedArray([0, 0, 0, 255, 10, 10, 10, 255]);
    const b = new Uint8ClampedArray([0, 0, 0, 255, 90, 10, 10, 255]);
    assert.equal(changedShare(a, a), 0);
    assert.equal(changedShare(a, b), 0.5);
    assert.equal(changedShare(a, new Uint8ClampedArray(4)), 1);
  });
});
