/*
  Everything that is generated out of data.js and committed next to it.

  These live here rather than inside the build script so that the test can
  regenerate them into memory and compare against what is on disk: a stale
  catalogue is worse than no catalogue, because nothing about it looks wrong.

  Run `node tools/build.js` after editing data.js.
*/
const SITE = 'https://artex-x.github.io/daggerheart-loot/';
/* The csv carries record text as it reads: no markup (docs/specs/CONTRACTS.md section 4). */
const { markupText } = require('../app/src/lib/markup.ts');

/* Spelled out into human names: the csv and json are read aloud from the
   source, not matched against the code. A forgotten key used to leak out
   verbatim as `dread`/`frame`. */
const SRC = {
  core: 'Core',
  hnf: 'Hope & Fear',
  wondrous: 'Wondrous Loot',
  community: 'Community',
  dread: 'Dread GM Toolbox',
  frame: 'Campaign Frames',
  voa: 'Vault of Ages',
  dv: "The Dragon's Vault",
  arazo: "Arazo's Artifacts"
};
const RANGE = {
  melee: 'Melee',
  veryclose: 'Very Close',
  close: 'Close',
  far: 'Far',
  veryfar: 'Very Far'
};
const TRAIT = {
  agility: 'Agility',
  strength: 'Strength',
  finesse: 'Finesse',
  instinct: 'Instinct',
  presence: 'Presence',
  knowledge: 'Knowledge',
  spellcast: 'Spellcast'
};
const BURDEN = { 1: 'One-Handed', 2: 'Two-Handed', any: 'One/Two-Handed' };
const CLS = { phy: 'physical', mag: 'magic' };
const DT = { phy: 'phy', mag: 'mag', any: 'phy/mag' };

function everything(L) {
  return [].concat(...Object.values(L.items), L.eq);
}

/* Loot has no tier of its own - the alternate tables sort it by rarity, and
   that is the closest thing an agent can filter on. */
function rarityIndex(L) {
  const out = {};
  ['item', 'consumable'].forEach(function (kind) {
    const table = L.alt[kind] || {};
    Object.keys(table).forEach(function (rarity) {
      Object.keys(table[rarity]).forEach(function (pool) {
        table[rarity][pool].forEach(function (id) {
          out[id] = rarity;
        });
      });
    });
  });
  return out;
}

const CSV_HEAD = [
  'id',
  'kind',
  'source',
  'name_ru',
  'name_en',
  'tier',
  'rarity',
  'roll',
  'class',
  'trait',
  'range',
  'damage',
  'burden',
  'armor_score',
  'thresholds',
  'crafts_into',
  'community',
  'url',
  'text_ru',
  'text_en'
];

/* An item's description with two properties is stored across two lines. In
   the table, a file row must stay one line per record, or the catalog stops
   reading line by line - newlines collapse into a space. */
function cell(v) {
  const s = (v == null ? '' : String(v)).replace(/\s*\n\s*/g, ' ');
  return /[",]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/* One record's cells keyed by CSV_HEAD name, shared by the catalog and its
   index. */
function catalogRow(L, rarity, sets, x) {
  const e = x.eq;
  const set = setText(L, sets, x);
  return {
    id: x.id,
    kind: e ? e.t : x.kind,
    source: SRC[x.src] || x.src,
    name_ru: x.ru,
    name_en: x.en,
    /* Vault of Ages prints a tier on loot too, not only on equipment: the
       book is laid out by tier, and past the fourth come A (artifact) and
       C (cursed object). */
    tier: x.tier != null ? x.tier : e ? e.tier : '',
    rarity: rarity[x.id] || '',
    roll: x.roll == null ? '' : x.roll,
    class: e && e.cls ? CLS[e.cls] : '',
    trait: e && e.tr ? TRAIT[e.tr] : '',
    range: e && e.rg ? RANGE[e.rg] : '',
    damage: e && e.dmg ? e.dmg + (e.dt ? ' ' + DT[e.dt] : '') : '',
    burden: e && e.bu ? BURDEN[e.bu] : '',
    armor_score: e && e.as != null ? e.as : '',
    thresholds: e && e.th ? e.th.join('/') : '',
    crafts_into: (x.craft || []).join(';'),
    community: x.community || '',
    url: SITE + 'i/' + x.id + '.html',
    text_ru: markupText(x.rud || '') + set.ru,
    text_en: markupText(x.ende || '') + set.en
  };
}

function csvOf(L, head) {
  const rarity = rarityIndex(L);
  const sets = setGroups(L);
  const rows = everything(L).map(function (x) {
    const row = catalogRow(L, rarity, sets, x);
    return head.map((k) => cell(row[k])).join(',');
  });
  return head.join(',') + '\n' + rows.join('\n') + '\n';
}

/* One row per record, every column an agent needs to answer "give me tier 1-2
   physical armour and primary weapons" without parsing all of data.json. */
function catalogCsv(L) {
  return csvOf(L, CSV_HEAD);
}

/* The catalog without its text and page link, small enough for one fetch. */
const INDEX_HEAD = CSV_HEAD.filter((k) => !['url', 'text_ru', 'text_en'].includes(k));

function catalogIndexCsv(L) {
  return csvOf(L, INDEX_HEAD);
}

/* A set's members in the app's `[...eq, ...all]` order, keyed by set. */
function setGroups(L) {
  const out = {};
  [].concat(L.eq, ...Object.values(L.items)).forEach(function (x) {
    if (x.set) (out[x.set] = out[x.set] || []).push(x);
  });
  return out;
}

/* The bonus rides on every member's text, in the print card's label shape. */
function setText(L, sets, x) {
  const members = (x.set && sets[x.set]) || [];
  if (members.length < 2) return { ru: '', en: '' };
  const b = (L.sets || {})[x.set];
  const ru = members.map((m) => m.ru || m.en).join(', ');
  const en = members.map((m) => m.en).join(', ');
  return b
    ? {
        ru: `\n${b.ru} (Комплект: ${ru}): ${markupText(b.rud)}`,
        en: `\n${b.en} (Set: ${en}): ${markupText(b.ende)}`
      }
    : { ru: `\nКомплект: ${ru}`, en: `\nSet: ${en}` };
}

function dataJson(L) {
  return JSON.stringify(L) + '\n';
}

/* The catalog tables a table card names, in app/src/lib/types.ts's TABLE_IDS
   order without `homebrew`. */
const CARD_TABLES = [
  'core_item',
  'core_consumable',
  'hnf_item',
  'hnf_consumable',
  'wondrous',
  'community',
  'dread',
  'voa',
  'dv',
  'arazo',
  'other_starting',
  'other_frames',
  'alt_item',
  'alt_consumable',
  'eq_weapon',
  'eq_secondary',
  'eq_armor'
];

/* The rows the signed-out tables page draws for a table with no filter, by
   the app's own rules (app/src/lib/data.ts: rows, otherTableRows,
   equipOfKind, altColumn); app/src/lib/i18n.test.ts holds them equal. */
function tableRows(L, table) {
  const starting = L.items.starting || [];
  if (table === 'other_starting') return starting.filter((x) => !x.frame);
  if (table === 'other_frames')
    return (L.items.frames || []).concat(starting.filter((x) => x.frame));
  if (table.startsWith('eq_')) {
    const t = table.slice(3);
    return [].concat(L.eq, ...Object.values(L.items)).filter((x) => x.eq && x.eq.t === t);
  }
  if (table.startsWith('alt_')) {
    const ids = new Set(everything(L).map((x) => x.id));
    const byRarity = (L.alt || {})[table.slice(4)] || {};
    return Object.values(byRarity).flatMap((cols) =>
      ['hope', 'fear'].flatMap((col) => (cols[col] || []).filter((id) => ids.has(id)))
    );
  }
  return L.items[table] || [];
}

/* What the preview host reads at request time (docs/specs/CONTRACTS.md
   section 4): catalog names by id, the sets, and the counts a table card
   draws. One line, like data.json. A set bonus stays formatted-text source;
   the host draws it as plain text. */
function namesJson(L) {
  const items = {};
  everything(L).forEach(function (x) {
    items[x.id] = [x.ru || '', x.en || ''];
  });
  const groups = setGroups(L);
  const sets = {};
  Object.keys(L.sets || {}).forEach(function (key) {
    const b = L.sets[key];
    sets[key] = {
      ru: b.ru,
      en: b.en,
      rud: b.rud,
      ende: b.ende,
      members: (groups[key] || []).map((x) => x.id)
    };
  });
  const tables = {};
  CARD_TABLES.forEach(function (t) {
    tables[t] = { n: tableRows(L, t).length };
  });
  const communities = {};
  (L.items.community || []).forEach(function (x) {
    if (!x.community) return;
    const c = (communities[x.community] = communities[x.community] || {
      ru: x.community_ru || x.community,
      n: 0
    });
    c.n++;
  });
  const frames = {};
  tableRows(L, 'other_frames').forEach(function (x) {
    if (!x.frame) return;
    frames[x.frame] = { n: ((frames[x.frame] && frames[x.frame].n) || 0) + 1 };
  });
  return (
    JSON.stringify({
      format: 'daggerheart-loot/names',
      version: 1,
      items,
      sets,
      tables,
      communities,
      frames
    }) + '\n'
  );
}

module.exports = { SITE, dataJson, catalogCsv, catalogIndexCsv, namesJson, everything };
