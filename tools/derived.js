/*
  Everything that is generated out of data.js and committed next to it.

  These live here rather than inside the build script so that the test can
  regenerate them into memory and compare against what is on disk: a stale
  catalogue is worse than no catalogue, because nothing about it looks wrong.

  Run `node tools/build.js` after editing data.js.
*/
const SITE = 'https://artex-x.github.io/daggerheart-loot/';

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
  dv: "The Dragon's Vault"
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

/* One row per record, every column an agent needs to answer "give me tier 1-2
   physical armour and primary weapons" without parsing 450 KB of JSON. */
function catalogCsv(L) {
  const rarity = rarityIndex(L);
  const sets = setGroups(L);
  const rows = everything(L).map(function (x) {
    const e = x.eq;
    const set = setText(L, sets, x);
    return [
      x.id,
      e ? e.t : x.kind,
      SRC[x.src] || x.src,
      x.ru,
      x.en,
      /* Vault of Ages prints a tier on loot too, not only on equipment: the
         book is laid out by tier, and past the fourth come A (artifact) and
         C (cursed object). */
      x.tier != null ? x.tier : e ? e.tier : '',
      rarity[x.id] || '',
      x.roll == null ? '' : x.roll,
      e && e.cls ? CLS[e.cls] : '',
      e && e.tr ? TRAIT[e.tr] : '',
      e && e.rg ? RANGE[e.rg] : '',
      e && e.dmg ? e.dmg + (e.dt ? ' ' + DT[e.dt] : '') : '',
      e && e.bu ? BURDEN[e.bu] : '',
      e && e.as != null ? e.as : '',
      e && e.th ? e.th.join('/') : '',
      x.craft || '',
      x.community || '',
      SITE + 'i/' + x.id + '.html',
      (x.rud || '') + set.ru,
      (x.ende || '') + set.en
    ]
      .map(cell)
      .join(',');
  });
  return CSV_HEAD.join(',') + '\n' + rows.join('\n') + '\n';
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
    ? { ru: `\n${b.ru} (Комплект: ${ru}): ${b.rud}`, en: `\n${b.en} (Set: ${en}): ${b.ende}` }
    : { ru: `\nКомплект: ${ru}`, en: `\nSet: ${en}` };
}

function dataJson(L) {
  return JSON.stringify(L) + '\n';
}

module.exports = { SITE, dataJson, catalogCsv, everything };
