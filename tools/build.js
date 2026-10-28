/*
  Regenerates everything that is derived from data.js:

    data.json     the same records, as plain JSON anything can parse
                  (not committed: build output, like names.json)
    catalog.csv   one row per record, for reading rather than parsing
                  (not committed: build output, like names.json)
    catalog-index.csv
                  the catalog without its text, for one fetch
                  (not committed: build output, like names.json)
    names.json    catalog names, sets and table counts for the preview host
                  (not committed: build output, like i/)
    i/<id>.html   the share stubs
    card-versions.json
                  each record's card version, which the built data.js carries
                  as window.LOOT_V (tools/data-script.js; not committed)
    pages/<id>.html  the site pages (tools/build-pages.js)

  Run after every edit to data.js:   node tools/build.js

  npm run check runs this automatically before tests/derived.js compares, so
  forgetting to run it by hand costs nothing inside that same check.
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
  ['catalog.csv', D.catalogCsv(L)],
  ['catalog-index.csv', D.catalogIndexCsv(L)],
  ['names.json', D.namesJson(L)]
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

const versions = JSON.stringify(require('./build-share-pages.js').cardVersions());
fs.writeFileSync(path.join(ROOT, 'card-versions.json'), versions + '\n');
console.log('card-versions.json - ' + Math.round(Buffer.byteLength(versions) / 1024) + ' KB');
