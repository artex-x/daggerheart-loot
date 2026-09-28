/* Public contracts against the golden fixtures in docs/fixtures.

   A fixture is a file, not whatever the code happens to do today: a link
   someone pasted into a chat six months ago has to keep opening after the app
   is rewritten. So everything here is compared with what is on disk, and the
   base64 and checksum work is done by a second implementation - one that cannot
   agree with the app in an error.

   This is also where the thing nobody was checking lives: the filter group
   names. A group a table does not offer is ignored silently and the table stays
   whole, which is how `f_rg-melee` from llms.txt spent a year looking like a
   working filter while selecting nothing.

   This file covers only its fs-only half - the list-encoding
   check, the docs-name check and the lists file import-v1 (its schema,
   fixtures, llms.txt section and data zip). The browser half (the link against a real
   app, the address grammar, the stat line, the filter-group probe) moved to
   `tests/app/contracts.js`, which reads the rewrite instead of the live app;
   `docs/specs/COVERAGE.md`'s `contracts` row says where each assertion went. */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { ok, failed } = require('./ok.js');

const FIX = path.join(__dirname, '..', 'docs', 'fixtures');

/* A separate implementation of the encoding - that is the whole point */
const b64url = (s) =>
  Buffer.from(s, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
/* FNV-1a, as in the app, but written again here */
function stampOf(parts) {
  const body = parts.join(',');
  let h = 2166136261;
  for (let i = 0; i < body.length; i++) {
    h ^= body.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return parts.length.toString(36) + '.' + (h >>> 0).toString(36).slice(-4) + '~';
}

const N_REC = '\x1e',
  N_SEP = '\x1f';

(async () => {
  /* ---------- list fixtures: the pure half ---------- */
  console.log('list encoding');
  const listFiles = fs.readdirSync(path.join(FIX, 'lists')).filter((f) => f.endsWith('.json'));
  ok(listFiles.length >= 6, 'fewer than six list fixtures: ' + listFiles.length);
  const lists = listFiles.map((f) =>
    JSON.parse(fs.readFileSync(path.join(FIX, 'lists', f), 'utf8'))
  );

  lists.forEach(function (fx) {
    ['player', 'gm'].forEach(function (who) {
      const side = fx[who];
      ok(
        b64url(side.raw) === side.payload,
        fx.id + '/' + who + ': payload is not base64url(utf8(raw))'
      );
      /* The items line starts with the checksum, and it has to match the body */
      const itemsLine = side.raw.split('\n')[1] || '';
      const cut = itemsLine.indexOf('~');
      ok(cut > 0, fx.id + '/' + who + ': no checksum on the items line');
      const parts = itemsLine.slice(cut + 1).split(',');
      ok(
        stampOf(parts) === itemsLine.slice(0, cut + 1),
        fx.id + '/' + who + ': the checksum does not match the items'
      );
      ok(
        parts.length === fx.list.ids.length,
        fx.id + '/' + who + ': the link holds a different number of entries than the list'
      );
    });
    /* The player link carries no unmarked note */
    const hidden = fx.player.raw
      .split(N_REC)
      .slice(1)
      .filter(function (rec) {
        const id = rec.slice(0, rec.indexOf(N_SEP));
        return id.charAt(0) !== '+' && id !== '$';
      });
    ok(!hidden.length, fx.id + ': a GM note survived into the player link');
  });

  /* ---------- filter group names ---------- */
  /* Every group named in llms.txt and in CONTRACTS.md has to select something
     on the rewrite; `tests/app/contracts.js` runs the probe itself. What
     stays here is fs-only: the documentation has to name the same groups. A
     mistake here is invisible on screen: the link opens, the table is whole,
     there is no filter. */
  console.log('filter group names');
  const docs =
    fs.readFileSync(path.join(__dirname, '..', 'llms.txt'), 'utf8') +
    fs.readFileSync(path.join(FIX, '..', 'specs', 'CONTRACTS.md'), 'utf8') +
    fs.readFileSync(path.join(FIX, '..', 'specs', 'ROUTES.md'), 'utf8');
  ['tier', 'src', 'cls', 'trait', 'range', 'burden', 'line', 'kind', 'frame', 'comm'].forEach(
    function (g) {
      ok(new RegExp('`' + g + '`').test(docs), 'group `' + g + '` is documented nowhere');
    }
  );
  /* Absence is checked only in llms.txt: that is what an agent builds an address
     from, while the specs name these two on purpose - as what the groups are not. */
  const machine = fs.readFileSync(path.join(__dirname, '..', 'llms.txt'), 'utf8');
  ['`rg`', '`bu`'].forEach(function (g) {
    ok(machine.indexOf(g) < 0, 'llms.txt still carries the non-existent group ' + g);
  });
  /* The English addresses are public paths too (CONTRACTS.md sections 3-5):
     an agent reads llms.txt to build them. */
  ok(
    machine.includes('i/en/<id>.html'),
    'llms.txt does not name the English stub i/en/<id>.html'
  );
  ok(
    machine.includes('daggerheart-loot/en/'),
    'llms.txt does not name the English address daggerheart-loot/en/'
  );
  /* The account share link is a public address (CONTRACTS.md section 1), and
     the old list links carry a published end date (section 3). */
  const routesDoc = fs.readFileSync(path.join(FIX, '..', 'specs', 'ROUTES.md'), 'utf8');
  const contractsText = fs.readFileSync(path.join(FIX, '..', 'specs', 'CONTRACTS.md'), 'utf8');
  [
    ['llms.txt', machine],
    ['CONTRACTS.md', contractsText],
    ['ROUTES.md', routesDoc]
  ].forEach(function ([name, text]) {
    ok(text.includes('#/s/<token>'), name + ' does not name the share link #/s/<token>');
  });
  [
    ['llms.txt', machine],
    ['CONTRACTS.md', contractsText]
  ].forEach(function ([name, text]) {
    ok(
      text.includes('2026-10-26'),
      name + ' does not name the date #/l/ links stop, 2026-10-26'
    );
  });

  /* ---------- data.json top-level keys ---------- */
  /* `CONTRACTS.md` section 4 publishes the key list; a key added to or dropped
     from `data.js` without that line moving is a silent contract change. */
  console.log('data.json keys');
  const contractsDoc = fs.readFileSync(path.join(FIX, '..', 'specs', 'CONTRACTS.md'), 'utf8');
  const shape = /`data\.json` - `\{([^`]*)\}`/.exec(contractsDoc);
  ok(!!shape, 'CONTRACTS.md no longer states the data.json shape');
  const documented = shape ? [...shape[1].matchAll(/(\w+):/g)].map((m) => m[1]) : [];
  const shipped = Object.keys(
    JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data.json'), 'utf8'))
  );
  ok(
    documented.slice().sort().join() === shipped.slice().sort().join(),
    'data.json keys ' + shipped.join() + ' differ from CONTRACTS.md ' + documented.join()
  );

  /* ---------- the lists file import-v1 ---------- */
  /* `schema/import-v1.json` is frozen (CONTRACTS.md section 4): a file written
     today imports for good. Its bounds are the database's, written here as
     literals; the fixtures and llms.txt are checked against it by a walk of
     their own, not by the app's validator. */
  console.log('import bundle');
  const ROOT = path.join(__dirname, '..');
  const IMPORT = path.join(FIX, 'import');
  const SCHEMA_URL = 'https://artex-x.github.io/daggerheart-loot/schema/import-v1.json';
  const schema = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'schema', 'import-v1.json'), 'utf8')
  );
  const listSchema = schema.$defs.list;
  const entrySchema = schema.$defs.entry;
  ok(schema.$id === SCHEMA_URL, 'schema/import-v1.json: $id is not ' + SCHEMA_URL);
  ok(
    schema.properties.format.const === 'daggerheart-loot/lists',
    'schema: format is not the const daggerheart-loot/lists'
  );
  ok(schema.properties.version.const === 1, 'schema: version is not the const 1');
  [
    ['the root', schema],
    ['a list', listSchema],
    ['an entry', entrySchema]
  ].forEach(function ([what, s]) {
    ok(s.additionalProperties === false, 'schema: ' + what + ' takes keys it does not name');
  });
  [
    ['lists.maxItems', schema.properties.lists.maxItems, 50],
    ['lists.minItems', schema.properties.lists.minItems, 1],
    ['entries.maxItems', listSchema.properties.entries.maxItems, 100],
    ['name.maxLength', listSchema.properties.name.maxLength, 200],
    ['name.minLength', listSchema.properties.name.minLength, 1],
    ['entry name.maxLength', entrySchema.properties.name.maxLength, 200],
    ['player_note.maxLength', listSchema.properties.player_note.maxLength, 4000],
    ['gm_note.maxLength', listSchema.properties.gm_note.maxLength, 4000],
    ['entry player_note.maxLength', entrySchema.properties.player_note.maxLength, 4000],
    ['entry gm_note.maxLength', entrySchema.properties.gm_note.maxLength, 4000],
    ['quantity.minimum', entrySchema.properties.quantity.minimum, 1],
    ['quantity.maximum', entrySchema.properties.quantity.maximum, 99],
    ['price_coins.minimum', entrySchema.properties.price_coins.minimum, 1],
    ['price_coins.maximum', entrySchema.properties.price_coins.maximum, 99999]
  ].forEach(function ([what, got, want]) {
    ok(got === want, 'schema: ' + what + ' is ' + got + ', not ' + want);
  });

  const importFiles = fs.readdirSync(IMPORT).filter((f) => f.endsWith('.json'));
  importFiles.forEach(function (f) {
    const text = fs.readFileSync(path.join(IMPORT, f), 'utf8');
    ok(
      JSON.stringify(JSON.parse(text), null, 2) + '\n' === text,
      'docs/fixtures/import/' + f + ' is not canonical JSON (two-space, a final newline)'
    );
  });
  /* A valid file uses only the keys the schema declares, at each level. */
  const declared = (o, s, where) =>
    Object.keys(o).forEach((k) =>
      ok(k in s.properties, where + ': the key ' + k + ' is not in the schema')
    );
  ['example.json', 'export.json', 'from-llms.json'].forEach(function (f) {
    const doc = JSON.parse(fs.readFileSync(path.join(IMPORT, f), 'utf8'));
    ok(
      doc.format === 'daggerheart-loot/lists' && doc.version === 1,
      f + ': not format daggerheart-loot/lists, version 1'
    );
    declared(doc, schema, f);
    doc.lists.forEach(function (l, i) {
      declared(l, listSchema, f + ' lists[' + i + ']');
      l.entries.forEach((e, j) =>
        declared(e, entrySchema, f + ' lists[' + i + '].entries[' + j + ']')
      );
    });
  });

  /* llms.txt teaches the format: the example verbatim, and every key, value
     and bound of the schema named in its section (to the next `## `, not a
     `### `). */
  const example = fs.readFileSync(path.join(IMPORT, 'example.json'), 'utf8');
  const head = machine.indexOf('## Lists as a file (import-v1)');
  ok(head >= 0, 'llms.txt has no section "Lists as a file (import-v1)"');
  const rest = machine.slice(head + 1);
  const next = rest.indexOf('\n## ');
  const section = next < 0 ? rest : rest.slice(0, next);
  ok(
    section.includes('```json\n' + example + '```'),
    'llms.txt does not hold docs/fixtures/import/example.json verbatim in a json block'
  );
  [schema, listSchema, entrySchema].forEach(function (s) {
    Object.keys(s.properties).forEach((k) =>
      ok(section.includes('`' + k + '`'), 'llms.txt does not name the key `' + k + '`')
    );
  });
  ['daggerheart-loot/lists', 'bag', 'coin', 'official'].forEach((v) =>
    ok(section.includes('`' + v + '`'), 'llms.txt does not name the value `' + v + '`')
  );
  [50, 100, 200, 4000, 99, 99999].forEach((n) =>
    ok(
      new RegExp('(^|\\D)' + n + '(\\D|$)').test(section),
      'llms.txt does not name the bound ' + n
    )
  );
  ['5 MB', 'lists.json', 'zip', SCHEMA_URL, 'catalog.csv'].forEach((s) =>
    ok(section.includes(s), 'llms.txt does not name ' + s + ' in its import section')
  );
  [
    ['llms.txt', machine],
    ['CONTRACTS.md', contractsText]
  ].forEach(function ([name, text]) {
    ok(text.includes('schema/import-v1.json'), name + ' does not name schema/import-v1.json');
  });

  /* The account's data zip, read by a walk of its own: the end record, the
     central directory, the local header. */
  const zip = fs.readFileSync(path.join(IMPORT, 'data.zip'));
  const end = zip.length - 22;
  ok(zip.readUInt32LE(end) === 0x06054b50, 'data.zip: no end record at its end');
  ok(zip.readUInt16LE(end + 10) === 1, 'data.zip: not exactly one entry');
  const cd = zip.readUInt32LE(end + 16);
  ok(zip.readUInt32LE(cd) === 0x02014b50, 'data.zip: no central directory entry');
  const flags = zip.readUInt16LE(cd + 8);
  const method = zip.readUInt16LE(cd + 10);
  const crc = zip.readUInt32LE(cd + 16);
  const packed = zip.readUInt32LE(cd + 20);
  const size = zip.readUInt32LE(cd + 24);
  const nameLen = zip.readUInt16LE(cd + 28);
  const local = zip.readUInt32LE(cd + 42);
  const entryName = zip.toString('utf8', cd + 46, cd + 46 + nameLen);
  ok(entryName === 'lists.json', 'data.zip: the entry is ' + entryName + ', not lists.json');
  ok(method === 0 && packed === size, 'data.zip: the entry is not stored');
  ok((flags & 0x0800) !== 0, 'data.zip: the name is not flagged UTF-8');
  ok(zip.readUInt32LE(local) === 0x04034b50, 'data.zip: no local header');
  const data = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
  const content = zip.subarray(data, data + size);
  ok(zlib.crc32(content) === crc, 'data.zip: the CRC does not match the content');
  ok(
    content.equals(fs.readFileSync(path.join(IMPORT, 'export.json'))),
    'data.zip: lists.json is not export.json'
  );

  console.log(failed() ? '\n' + failed() + ' FAILED' : '\ncontracts match the fixtures');
  process.exit(failed() ? 1 : 0);
})();
