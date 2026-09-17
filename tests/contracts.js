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

   R0c (2026-09-17) trimmed this file to its fs-only half - the list-encoding
   check and the docs-name check. The browser half (the link against a real
   app, the address grammar, the stat line, the filter-group probe) moved to
   `tests/app/contracts.js`, which reads the rewrite instead of the live app;
   `docs/specs/COVERAGE.md`'s `contracts` row says where each assertion went. */
const fs = require('fs');
const path = require('path');

const FIX = path.join(__dirname, '..', 'docs', 'fixtures');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL ' + m); } };

/* A separate implementation of the encoding - that is the whole point */
const b64url = s => Buffer.from(s, 'utf8').toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
/* FNV-1a, as in the app, but written again here */
function stampOf(parts){
  const body = parts.join(',');
  let h = 2166136261;
  for (let i = 0; i < body.length; i++) {
    h ^= body.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return parts.length.toString(36) + '.' + (h >>> 0).toString(36).slice(-4) + '~';
}

const N_REC = '\x1e', N_SEP = '\x1f';

(async () => {
  /* ---------- list fixtures: the pure half ---------- */
  console.log('list encoding');
  const listFiles = fs.readdirSync(path.join(FIX, 'lists')).filter(f => f.endsWith('.json'));
  ok(listFiles.length >= 6, 'fewer than six list fixtures: ' + listFiles.length);
  const lists = listFiles.map(f => JSON.parse(fs.readFileSync(path.join(FIX, 'lists', f), 'utf8')));

  lists.forEach(function (fx) {
    ['player', 'gm'].forEach(function (who) {
      const side = fx[who];
      ok(b64url(side.raw) === side.payload,
         fx.id + '/' + who + ': payload is not base64url(utf8(raw))');
      /* The items line starts with the checksum, and it has to match the body */
      const itemsLine = side.raw.split('\n')[1] || '';
      const cut = itemsLine.indexOf('~');
      ok(cut > 0, fx.id + '/' + who + ': no checksum on the items line');
      const parts = itemsLine.slice(cut + 1).split(',');
      ok(stampOf(parts) === itemsLine.slice(0, cut + 1),
         fx.id + '/' + who + ': the checksum does not match the items');
      ok(parts.length === fx.list.ids.length,
         fx.id + '/' + who + ': the link holds a different number of entries than the list');
    });
    /* The player link carries no unmarked note */
    const hidden = fx.player.raw.split(N_REC).slice(1).filter(function (rec) {
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
  const docs = fs.readFileSync(path.join(__dirname, '..', 'llms.txt'), 'utf8') +
               fs.readFileSync(path.join(FIX, '..', 'specs', 'CONTRACTS.md'), 'utf8') +
               fs.readFileSync(path.join(FIX, '..', 'specs', 'ROUTES.md'), 'utf8');
  ['tier', 'src', 'cls', 'trait', 'range', 'burden', 'line', 'kind', 'frame', 'comm']
    .forEach(function (g) {
      ok(new RegExp('`' + g + '`').test(docs), 'group `' + g + '` is documented nowhere');
    });
  /* Absence is checked only in llms.txt: that is what an agent builds an address
     from, while the specs name these two on purpose - as what the groups are not. */
  const machine = fs.readFileSync(path.join(__dirname, '..', 'llms.txt'), 'utf8');
  ['`rg`', '`bu`'].forEach(function (g) {
    ok(machine.indexOf(g) < 0, 'llms.txt still carries the non-existent group ' + g);
  });

  console.log(fail ? '\n' + fail + ' FAILED' : '\ncontracts match the fixtures');
  process.exit(fail ? 1 : 0);
})();
