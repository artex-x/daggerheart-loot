/*
  The bytes of the published data.js: the source data.js plus one line that
  assigns window.LOOT_V, the record links' card versions that tools/build.js
  writes to card-versions.json (docs/specs/CONTRACTS.md section 4). The build
  (vite.config.mts) emits these bytes, and tests/app/serve.js compares the
  built file against them, so a stale map stops the browser suites.
*/
const fs = require('fs');
const path = require('path');

function builtDataScript(root = path.join(__dirname, '..')) {
  const file = path.join(root, 'card-versions.json');
  if (!fs.existsSync(file))
    throw new Error('card-versions.json is missing. Run `node tools/build.js`');
  const map = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Buffer.concat([
    fs.readFileSync(path.join(root, 'data.js')),
    Buffer.from('\nwindow.LOOT_V = ' + JSON.stringify(map) + ';\n')
  ]);
}

module.exports = { builtDataScript };
