/*
  Regenerates everything that is derived from data.js:

    data.json     the same records, as plain JSON anything can parse
    catalog.csv   one row per record, for reading rather than parsing
    i/<id>.html   the share stubs
    pages/<id>.html  the site pages (tools/build-pages.js)

  Run after every edit to data.js:   node tools/build.js

  npm run check runs this automatically before tests/derived.js compares, so
  forgetting to run it by hand costs nothing inside that same check - the
  comparison there is the generator against its own freshly written output,
  not against a commit. A stale *commit* (edited data.js, never rebuilt, and
  committed anyway) is what actually needs catching; that is a CI step after
  npm run check, not this file or tests/derived.js.
*/
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const D = require('./derived.js');

const ROOT = path.join(__dirname, '..');
global.window = {};
require(path.join(ROOT, 'data.js'));
const L = global.window.LOOT;

[
  ['data.json', D.dataJson(L)],
  ['catalog.csv', D.catalogCsv(L)]
].forEach(function ([name, body]) {
  fs.writeFileSync(path.join(ROOT, name), body);
  console.log(name + ' - ' + Math.round(Buffer.byteLength(body) / 1024) + ' KB');
});

execFileSync(process.execPath, [path.join(__dirname, 'build-share-pages.js')], {
  stdio: 'inherit'
});
execFileSync(process.execPath, [path.join(__dirname, 'build-pages.js')], {
  stdio: 'inherit'
});
