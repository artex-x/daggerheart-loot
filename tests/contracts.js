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
   check, the docs-name check, the lists file import-v1, import-v2 and import-v3 and the
   homebrew file homebrew-v1 (their schemas, fixtures, llms.txt sections and
   the data zip). The browser half (the link against a real
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
  [
    'tier',
    'src',
    'cls',
    'trait',
    'range',
    'burden',
    'line',
    'kind',
    'frame',
    'comm',
    'sect'
  ].forEach(function (g) {
    ok(new RegExp('`' + g + '`').test(docs), 'group `' + g + '` is documented nowhere');
  });
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
    ok(
      text.includes('#/s/<token>/f_'),
      name + " does not name the share link's filter #/s/<token>/f_"
    );
    ok(text.includes('#/h/<uuid>'), name + ' does not name the item address #/h/<uuid>');
  });
  /* A share link's `kind` names the gear a table calls `equip` (ROUTES.md, "Filter
     grammar"); an agent that writes `kind-equip` gets the whole list. */
  ok(
    machine.includes('`item`/`consumable`/`weapon`/`secondary`/`armor`'),
    "llms.txt does not list the share link's kind values"
  );
  ['weapon', 'secondary', 'armor'].forEach(function (v) {
    ok(routesDoc.includes('`' + v + '`'), "ROUTES.md does not name the share link's kind " + v);
  });
  /* The homebrew pages and the reserved key prefix are public (CONTRACTS.md sections 1
     and 2): an agent must not take `hb_` for a record id it can build. */
  [
    ['llms.txt', machine],
    ['CONTRACTS.md', contractsText],
    ['ROUTES.md', routesDoc]
  ].forEach(function ([name, text]) {
    ok(text.includes('#/homebrew'), name + ' does not name the homebrew page #/homebrew');
    ok(
      text.includes('#/tables/homebrew'),
      name + ' does not name the homebrew table #/tables/homebrew'
    );
    ok(text.includes('hb_'), name + ' does not name the reserved key prefix hb_');
    for (const tab of ['#/homebrew/sources', '#/homebrew/sets', '#/homebrew/rules']) {
      ok(text.includes(tab), name + ' does not name the «Мои предметы» tab ' + tab);
    }
    /* The meaning of `src` on the homebrew table: one value, the source chip. */
    ok(
      /On `homebrew`, `src` holds one value and picks the\s+source chip/.test(text),
      name + ' does not say that `src` on `homebrew` holds one value and picks the source chip'
    );
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

  const dataIds = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data.json'), 'utf8'));
  const allIds = [...Object.values(dataIds.items).flat(), ...(dataIds.eq || [])].map(
    (r) => r.id
  );
  const reserved = allIds.filter((id) => id.startsWith('hb'));
  ok(!reserved.length, 'data.json holds ids with the reserved prefix hb: ' + reserved.join());
  /* A record's `craft` is a list of record ids (CONTRACTS.md section 4); a reader
     outside the site takes that shape, so a string slipping back breaks it. */
  const knownIds = new Set(allIds);
  [...Object.values(dataIds.items).flat(), ...(dataIds.eq || [])]
    .filter((r) => r.craft !== undefined)
    .forEach((r) => {
      ok(
        Array.isArray(r.craft) && r.craft.length > 0 && r.craft.every((id) => knownIds.has(id)),
        'data.json ' +
          r.id +
          ': craft is not a non-empty list of known ids: ' +
          JSON.stringify(r.craft)
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
     today imports for good; a bound may widen in place, never narrow. Its bounds
     are the import call's, written here as literals; the fixtures and llms.txt
     are checked against it by a walk of their own, not by the app's validator. */
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
    ['lists.maxItems', schema.properties.lists.maxItems, 1000],
    ['lists.minItems', schema.properties.lists.minItems, 1],
    ['entries.maxItems', listSchema.properties.entries.maxItems, 5000],
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
  [1000, 5000, 200, 4000, 99, 99999].forEach((n) =>
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

  /* ---------- the homebrew file homebrew-v1 and the lists file import-v2 ---------- */
  /* Both are frozen (CONTRACTS.md section 4): a bound may widen, and a required key may
     become optional, in place; nothing narrows. Their bounds are the import calls'
     ceilings, written here as literals; the fixtures and llms.txt are checked by a walk of
     their own. */
  console.log('homebrew file and import-v2');
  const HB_URL = 'https://artex-x.github.io/daggerheart-loot/schema/homebrew-v1.json';
  const V2_URL = 'https://artex-x.github.io/daggerheart-loot/schema/import-v2.json';
  const HB_DIR = path.join(FIX, 'homebrew-file');
  const hb = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema', 'homebrew-v1.json'), 'utf8'));
  const v2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema', 'import-v2.json'), 'utf8'));
  ok(hb.$id === HB_URL, 'schema/homebrew-v1.json: $id is not ' + HB_URL);
  ok(v2.$id === V2_URL, 'schema/import-v2.json: $id is not ' + V2_URL);
  ok(
    hb.properties.format.const === 'daggerheart-loot/homebrew' &&
      hb.properties.version.const === 1,
    'homebrew-v1: format or version is not daggerheart-loot/homebrew, 1'
  );
  ok(
    v2.properties.format.const === 'daggerheart-loot/lists' &&
      v2.properties.version.const === 2,
    'import-v2: format or version is not daggerheart-loot/lists, 2'
  );
  const hd = hb.$defs;
  const vd = v2.$defs;
  [
    ['homebrew-v1 root', hb],
    ['homebrew-v1 book', hd.book],
    ['homebrew-v1 section', hd.section],
    ['homebrew-v1 card', hd.card],
    ['homebrew-v1 item', hd.item],
    ['homebrew-v1 eq', hd.eq],
    ['homebrew-v1 stats', hd.stats],
    ['import-v2 root', v2],
    ['import-v2 list', vd.list],
    ['import-v2 entry', vd.entry],
    ['import-v2 snapshot', vd.snapshot],
    ['import-v2 snapshot book', vd.snapshot.properties.book],
    ['import-v2 snapshot cards', vd.snapshot.properties.cards],
    ['import-v2 snapshotSet', vd.snapshotSet],
    ['import-v2 snapshotRef', vd.snapshotRef]
  ].forEach(function ([what, s]) {
    ok(s.additionalProperties === false, 'schema: ' + what + ' takes keys it does not name');
  });
  [
    ['homebrew-v1 books.maxItems', hb.properties.books.maxItems, 100],
    ['homebrew-v1 cards.maxItems', hb.properties.cards.maxItems, 1000],
    ['homebrew-v1 items.maxItems', hb.properties.items.maxItems, 1000],
    ['homebrew-v1 sections.maxItems', hd.book.properties.sections.maxItems, 30],
    ['homebrew-v1 book name', hd.book.properties.en.maxLength, 80],
    ['homebrew-v1 section name', hd.section.properties.ru.maxLength, 80],
    ['homebrew-v1 card name', hd.card.properties.en.maxLength, 80],
    ['homebrew-v1 card subtitle', hd.card.properties.rusub.maxLength, 60],
    ['homebrew-v1 card text', hd.card.properties.rud.maxLength, 1500],
    ['homebrew-v1 card url', hd.card.properties.url.maxLength, 300],
    ['homebrew-v1 item name', hd.item.properties.ru.maxLength, 120],
    ['homebrew-v1 item text', hd.item.properties.rud.maxLength, 3000],
    ['homebrew-v1 craft', hd.item.properties.craft.maxItems, 8],
    ['homebrew-v1 craft_from', hd.item.properties.craft_from.maxItems, 8],
    ['homebrew-v1 refs', hd.item.properties.refs.maxItems, 3],
    ['homebrew-v1 as', hd.eq.properties.as.maximum, 12],
    ['homebrew-v1 th', hd.eq.properties.th.items.maximum, 99],
    ['import-v2 lists.maxItems', v2.properties.lists.maxItems, 1000],
    ['import-v2 entries.maxItems', vd.list.properties.entries.maxItems, 5000]
  ].forEach(function ([what, got, want]) {
    ok(got === want, 'schema: ' + what + ' is ' + got + ', not ' + want);
  });
  ok(hd.key.pattern === '^hb_[a-z2-7]{16}$', 'homebrew-v1: the key pattern changed');
  ok(
    hd.damage.pattern === '^d(4|6|8|10|12|20)(\\+[1-9][0-9]?)?$',
    'homebrew-v1: the damage pattern is not d4..d20 with a bonus of +1..+99'
  );
  ok(
    JSON.stringify(vd.entry.properties.source.enum) === '["official","homebrew"]',
    'import-v2: source is not official or homebrew'
  );
  ok(
    !(vd.entry.then.required || []).includes('snapshot'),
    'import-v2: the snapshot of a homebrew entry is optional'
  );

  const hbFiles = fs.readdirSync(HB_DIR).filter((f) => f.endsWith('.json'));
  hbFiles.forEach(function (f) {
    const text = fs.readFileSync(path.join(HB_DIR, f), 'utf8');
    ok(
      JSON.stringify(JSON.parse(text), null, 2) + '\n' === text,
      'docs/fixtures/homebrew-file/' + f + ' is not canonical JSON (two-space, a final newline)'
    );
  });
  /* A valid homebrew file uses only the keys the schema declares, at each level. */
  [
    'example.json',
    'example-edited.json',
    'no-book.json',
    'bedrolls.json',
    'lines.json',
    'crlf.json',
    'over-limit.json',
    'same-names.json',
    'export.json',
    'from-llms.json'
  ].forEach(function (f) {
    const doc = JSON.parse(fs.readFileSync(path.join(HB_DIR, f), 'utf8'));
    ok(
      doc.format === 'daggerheart-loot/homebrew' && doc.version === 1,
      f + ': not format daggerheart-loot/homebrew, version 1'
    );
    declared(doc, hb, f);
    (doc.books || []).forEach(function (b, i) {
      declared(b, hd.book, f + ' books[' + i + ']');
      (b.sections || []).forEach((s, j) =>
        declared(s, hd.section, f + ' books[' + i + '].sections[' + j + ']')
      );
    });
    (doc.cards || []).forEach((c, i) => declared(c, hd.card, f + ' cards[' + i + ']'));
    (doc.items || []).forEach(function (it, i) {
      declared(it, hd.item, f + ' items[' + i + ']');
      if (it.eq) declared(it.eq, hd.eq, f + ' items[' + i + '].eq');
    });
  });
  [
    'example-v2.json',
    'from-llms-v2.json',
    'export-v2.json',
    'bedroll-shop.json',
    'keys-only-v2.json'
  ].forEach(function (f) {
    const doc = JSON.parse(fs.readFileSync(path.join(IMPORT, f), 'utf8'));
    ok(
      doc.format === 'daggerheart-loot/lists' && doc.version === 2,
      f + ': not format daggerheart-loot/lists, version 2'
    );
    declared(doc, v2, f);
    doc.lists.forEach(function (l, i) {
      declared(l, vd.list, f + ' lists[' + i + ']');
      l.entries.forEach(function (e, j) {
        const at = f + ' lists[' + i + '].entries[' + j + ']';
        declared(e, vd.entry, at);
        ok(
          !('snapshot' in e) || e.source === 'homebrew',
          at + ': a snapshot on an entry that is not homebrew'
        );
        /* The export writes a snapshot on every homebrew entry (CONTRACTS.md section 4). */
        if (f.startsWith('export-')) {
          ok(
            (e.source === 'homebrew') === 'snapshot' in e,
            at + ': an exported homebrew entry without its snapshot'
          );
        }
        if (e.snapshot) declared(e.snapshot, vd.snapshot, at + '.snapshot');
      });
    });
  });

  /* llms.txt teaches both formats: each example verbatim, and every key, value and
     bound named in its own section. */
  const sectionOf = (head, level) => {
    const at = machine.indexOf(head);
    ok(at >= 0, 'llms.txt has no section "' + head + '"');
    const rest = machine.slice(at + 1);
    const next = rest.search(new RegExp('\\n#{2,' + level + '} '));
    return next < 0 ? rest : rest.slice(0, next);
  };
  const hbSection = sectionOf('## Homebrew items as a file (homebrew-v1)', 2);
  const hbExample = fs.readFileSync(path.join(HB_DIR, 'example.json'), 'utf8');
  ok(
    hbSection.includes('```json\n' + hbExample + '```'),
    'llms.txt does not hold docs/fixtures/homebrew-file/example.json verbatim in a json block'
  );
  const namedKeys = new Set();
  [hb, hd.book, hd.section, hd.card, hd.item, hd.eq, hd.stats].forEach((s) =>
    Object.keys(s.properties).forEach((k) => namedKeys.add(k))
  );
  /* A stat block key is named as `eq.<key>`: a bare `rg` or `bu` reads as a filter group. */
  namedKeys.forEach((k) =>
    ok(
      hbSection.includes('`' + k + '`') || hbSection.includes('`eq.' + k + '`'),
      'llms.txt homebrew section does not name the key `' + k + '`'
    )
  );
  [
    'daggerheart-loot/homebrew',
    'set',
    'ref',
    'item',
    'consumable',
    'equip',
    'weapon',
    'secondary',
    'armor',
    'phy',
    'mag',
    'any',
    ...hd.trait.enum,
    ...hd.range.enum,
    'A',
    'C',
    '+1',
    '+99'
  ].forEach((v) =>
    ok(
      hbSection.includes('`' + v + '`'),
      'llms.txt homebrew section does not name the value `' + v + '`'
    )
  );
  [100, 1000, 30, 80, 60, 1500, 300, 120, 3000, 8, 3, 12, 99, 20].forEach((n) =>
    ok(
      new RegExp('(^|\\D)' + n + '(\\D|$)').test(hbSection),
      'llms.txt homebrew section does not name the bound ' + n
    )
  );
  [
    '5 MB',
    HB_URL,
    'catalog.csv',
    'never work it out from the stats',
    '`catalog.csv`, `data.json`, `i/` and `og/` never carry a homebrew record'
  ].forEach((s) => ok(hbSection.includes(s), 'llms.txt homebrew section does not say ' + s));
  const v2Section = sectionOf('### Version 2: homebrew entries (import-v2)', 3);
  const v2Example = fs.readFileSync(path.join(IMPORT, 'example-v2.json'), 'utf8');
  ok(
    v2Section.includes('```json\n' + v2Example + '```'),
    'llms.txt does not hold docs/fixtures/import/example-v2.json verbatim in a json block'
  );
  [
    ...Object.keys(vd.snapshot.properties),
    ...Object.keys(vd.snapshot.properties.cards.properties),
    'source',
    'snapshot',
    'homebrew'
  ].forEach((k) =>
    ok(
      v2Section.includes('`' + k + '`'),
      'llms.txt version 2 section does not name `' + k + '`'
    )
  );
  [
    '131072',
    V2_URL,
    'A snapshot is optional',
    'A file for another GM must carry a snapshot on every homebrew entry',
    'import the homebrew file first'
  ].forEach((s) => ok(v2Section.includes(s), 'llms.txt version 2 section does not say ' + s));
  /* The zip's lines name both data files and the two-press restore. */
  ok(
    section.includes('`lists.json` is this same document, beside\n`homebrew.json`'),
    'llms.txt: the lists section does not say the zip holds homebrew.json beside lists.json'
  );
  ok(
    section.includes('`homebrew.json` first on «Мои предметы», then `lists.json` on'),
    'llms.txt: "Reading an export" does not name the two-press restore'
  );
  ok(
    !section.includes('today only `lists.json`'),
    'llms.txt: the zip still holds only lists.json'
  );
  /* The lines version 2 made false, corrected. */
  ok(
    section.includes('version 2 adds `homebrew`'),
    'llms.txt: the entry source row still says official is the only value'
  );
  ok(
    /What this site cannot do[\s\S]*Homebrew items as a file \(homebrew-v1\)/.test(machine),
    'llms.txt: "What this site cannot do" does not name the homebrew file'
  );
  [
    ['llms.txt', machine],
    ['CONTRACTS.md', contractsText]
  ].forEach(function ([name, text]) {
    ['schema/homebrew-v1.json', 'schema/homebrew-v2.json', 'schema/import-v2.json'].forEach(
      (p) => ok(text.includes(p), name + ' does not name ' + p)
    );
  });

  /* ---------- the homebrew file homebrew-v2: homebrew-v1 plus a card's book items ---------- */
  /* Frozen as homebrew-v1 is. Its other definitions are homebrew-v1's, held equal by
     app/src/lib/homebrewFile.test.ts; this checks what a reader of the published file sees. */
  console.log('homebrew-v2');
  const HB2_URL = 'https://artex-x.github.io/daggerheart-loot/schema/homebrew-v2.json';
  const hb2 = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'schema', 'homebrew-v2.json'), 'utf8')
  );
  const hd2 = hb2.$defs;
  ok(hb2.$id === HB2_URL, 'schema/homebrew-v2.json: $id is not ' + HB2_URL);
  ok(
    hb2.properties.format.const === 'daggerheart-loot/homebrew' &&
      hb2.properties.version.const === 2,
    'homebrew-v2: format or version is not daggerheart-loot/homebrew, 2'
  );
  [hb2, hd2.book, hd2.section, hd2.card, hd2.item, hd2.eq, hd2.stats].forEach((s, i) =>
    ok(
      s.additionalProperties === false,
      'schema: homebrew-v2 object ' + i + ' takes keys it does not name'
    )
  );
  const cardItems = hd2.card.properties.items;
  ok(
    cardItems &&
      cardItems.minItems === 1 &&
      cardItems.maxItems === 100 &&
      cardItems.uniqueItems === true &&
      cardItems.items.pattern === '^(?!hb_[a-z2-7]{16}$)[A-Za-z0-9_-]{1,64}$',
    "homebrew-v2: a card's items is not 1-100 unique catalog ids that are not an own key"
  );
  const hb2Example = JSON.parse(fs.readFileSync(path.join(HB_DIR, 'example-v2.json'), 'utf8'));
  ok(
    hb2Example.format === 'daggerheart-loot/homebrew' && hb2Example.version === 2,
    'example-v2.json: not format daggerheart-loot/homebrew, version 2'
  );
  declared(hb2Example, hb2, 'example-v2.json');
  hb2Example.cards.forEach((c, i) => declared(c, hd2.card, 'example-v2.json cards[' + i + ']'));
  hb2Example.items.forEach((it, i) =>
    declared(it, hd2.item, 'example-v2.json items[' + i + ']')
  );
  ok(
    hb2Example.cards.some((c) => Array.isArray(c.items) && c.items.length),
    'example-v2.json: no card holds book items'
  );
  const hb2Section = sectionOf('### Version 2: book items in a card (homebrew-v2)', 3);
  ok(hb2Section.includes(HB2_URL), 'llms.txt homebrew-v2 section does not name ' + HB2_URL);
  ok(
    hb2Section.includes('`items`') && hb2Section.includes('```json'),
    'llms.txt homebrew-v2 section does not name `items` or show a json example'
  );

  /* ---------- the lists file import-v3: import-v2 plus the GM-only mark ---------- */
  /* Frozen as import-v2 is. Its other definitions are import-v2's, held deep-equal by
     app/src/lib/bundle.test.ts; this checks what a reader of the published file sees. */
  console.log('import-v3');
  const V3_URL = 'https://artex-x.github.io/daggerheart-loot/schema/import-v3.json';
  const v3 = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema', 'import-v3.json'), 'utf8'));
  const v3d = v3.$defs;
  ok(v3.$id === V3_URL, 'schema/import-v3.json: $id is not ' + V3_URL);
  ok(
    v3.properties.format.const === 'daggerheart-loot/lists' &&
      v3.properties.version.const === 3,
    'import-v3: format or version is not daggerheart-loot/lists, 3'
  );
  [
    ['import-v3 root', v3],
    ['import-v3 list', v3d.list],
    ['import-v3 entry', v3d.entry],
    ['import-v3 snapshot', v3d.snapshot],
    ['import-v3 snapshot book', v3d.snapshot.properties.book],
    ['import-v3 snapshot cards', v3d.snapshot.properties.cards],
    ['import-v3 snapshotSet', v3d.snapshotSet],
    ['import-v3 snapshotRef', v3d.snapshotRef]
  ].forEach(function ([what, s]) {
    ok(s.additionalProperties === false, 'schema: ' + what + ' takes keys it does not name');
  });
  [
    ['import-v3 lists.maxItems', v3.properties.lists.maxItems, 1000],
    ['import-v3 entries.maxItems', v3d.list.properties.entries.maxItems, 5000],
    ['import-v3 gm_only type', v3d.entry.properties.gm_only.type, 'boolean']
  ].forEach(function ([what, got, want]) {
    ok(got === want, 'schema: ' + what + ' is ' + got + ', not ' + want);
  });
  ok(
    JSON.stringify(v3d.entry.properties.source.enum) === '["official","homebrew"]',
    'import-v3: source is not official or homebrew'
  );
  ok(
    !(v3d.entry.then.required || []).includes('snapshot'),
    'import-v3: the snapshot of a homebrew entry is optional'
  );
  ['example-v3.json', 'export-v3.json'].forEach(function (f) {
    const doc = JSON.parse(fs.readFileSync(path.join(IMPORT, f), 'utf8'));
    ok(
      doc.format === 'daggerheart-loot/lists' && doc.version === 3 && doc.$schema === V3_URL,
      f + ': not format daggerheart-loot/lists, version 3, the import-v3 schema'
    );
    declared(doc, v3, f);
    let marks = 0;
    doc.lists.forEach(function (l, i) {
      declared(l, v3d.list, f + ' lists[' + i + ']');
      l.entries.forEach(function (e, j) {
        const at = f + ' lists[' + i + '].entries[' + j + ']';
        declared(e, v3d.entry, at);
        ok(
          !('snapshot' in e) || e.source === 'homebrew',
          at + ': a snapshot on an entry that is not homebrew'
        );
        if (f.startsWith('export-')) {
          ok(
            (e.source === 'homebrew') === 'snapshot' in e,
            at + ': an exported homebrew entry without its snapshot'
          );
        }
        if (e.snapshot) declared(e.snapshot, v3d.snapshot, at + '.snapshot');
        if ('gm_only' in e) {
          ok(e.gm_only === true, at + ': gm_only is written, but not as true');
          marks++;
        }
      });
    });
    ok(marks === 1, f + ': holds ' + marks + ' GM-only entries, not 1');
  });
  const v3Section = sectionOf('### Version 3: GM-only entries (import-v3)', 3);
  const v3Example = fs.readFileSync(path.join(IMPORT, 'example-v3.json'), 'utf8');
  ok(
    v3Section.includes('```json\n' + v3Example + '```'),
    'llms.txt does not hold docs/fixtures/import/example-v3.json verbatim in a json block'
  );
  ['`gm_only`', '`true`', V3_URL, "players' link"].forEach((s) =>
    ok(v3Section.includes(s), 'llms.txt version 3 section does not say ' + s)
  );
  [
    ['llms.txt', machine],
    ['CONTRACTS.md', contractsText]
  ].forEach(([name, text]) =>
    ok(text.includes('schema/import-v3.json'), name + ' does not name schema/import-v3.json')
  );

  /* The account's data zips, read by a walk of their own: the end record, the central
     directory, each local header. data.zip is the frozen v1 pin; data-homebrew.zip is
     today's zip of an account with own items, lists.json then homebrew.json. */
  const zipEntries = function (name) {
    const zip = fs.readFileSync(path.join(IMPORT, name));
    const end = zip.length - 22;
    ok(zip.readUInt32LE(end) === 0x06054b50, name + ': no end record at its end');
    const count = zip.readUInt16LE(end + 10);
    let cd = zip.readUInt32LE(end + 16);
    const out = [];
    for (let i = 0; i < count; i++) {
      ok(zip.readUInt32LE(cd) === 0x02014b50, name + ': no central directory entry ' + i);
      const flags = zip.readUInt16LE(cd + 8);
      const method = zip.readUInt16LE(cd + 10);
      const crc = zip.readUInt32LE(cd + 16);
      const packed = zip.readUInt32LE(cd + 20);
      const size = zip.readUInt32LE(cd + 24);
      const nameLen = zip.readUInt16LE(cd + 28);
      const local = zip.readUInt32LE(cd + 42);
      const entryName = zip.toString('utf8', cd + 46, cd + 46 + nameLen);
      ok(method === 0 && packed === size, name + ': ' + entryName + ' is not stored');
      ok((flags & 0x0800) !== 0, name + ': the name ' + entryName + ' is not flagged UTF-8');
      ok(zip.readUInt32LE(local) === 0x04034b50, name + ': no local header for ' + entryName);
      const data = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
      const content = zip.subarray(data, data + size);
      ok(zlib.crc32(content) === crc, name + ': the CRC of ' + entryName + ' does not match');
      out.push({ name: entryName, content });
      cd += 46 + nameLen + zip.readUInt16LE(cd + 30) + zip.readUInt16LE(cd + 32);
    }
    return out;
  };
  const v1Zip = zipEntries('data.zip');
  ok(
    v1Zip.length === 1 && v1Zip[0].name === 'lists.json',
    'data.zip: not exactly one entry, lists.json'
  );
  ok(
    v1Zip[0].content.equals(fs.readFileSync(path.join(IMPORT, 'export.json'))),
    'data.zip: lists.json is not export.json'
  );
  const hbZip = zipEntries('data-homebrew.zip');
  ok(
    hbZip.map((e) => e.name).join(',') === 'lists.json,homebrew.json',
    'data-homebrew.zip: not lists.json then homebrew.json'
  );
  ok(
    hbZip[0].content.equals(fs.readFileSync(path.join(IMPORT, 'export-v2.json'))),
    'data-homebrew.zip: lists.json is not export-v2.json'
  );
  ok(
    hbZip[1].content.equals(fs.readFileSync(path.join(HB_DIR, 'export.json'))),
    'data-homebrew.zip: homebrew.json is not homebrew-file/export.json'
  );

  console.log(failed() ? '\n' + failed() + ' FAILED' : '\ncontracts match the fixtures');
  process.exit(failed() ? 1 : 0);
})();
