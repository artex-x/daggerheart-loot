/*
  Regenerates everything that is derived from data.js:

    data.json     the same records, as plain JSON anything can parse
    catalog.csv   one row per record, for reading rather than parsing
    i/<id>.html   the share stubs

  Run after every edit to data.js:   node tools/build.js

  Forgetting is caught by tests/derived.js, which rebuilds into memory and
  compares — so this is a convenience, not a rule to remember.
*/
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const D = require('./derived.js');

const ROOT = path.join(__dirname, '..');
global.window = {};
require(path.join(ROOT, 'data.js'));
const L = global.window.LOOT;

[['data.json', D.dataJson(L)],
 ['catalog.csv', D.catalogCsv(L)]].forEach(function ([name, body]) {
  fs.writeFileSync(path.join(ROOT, name), body);
  console.log(name + ' — ' + Math.round(Buffer.byteLength(body) / 1024) + ' КБ');
});

execFileSync(process.execPath, [path.join(__dirname, 'build-share-pages.js')],
             { stdio: 'inherit' });
