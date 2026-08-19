/*
  Everything that is generated out of data.js and committed next to it.

  These live here rather than inside the build script so that the test can
  regenerate them into memory and compare against what is on disk: a stale
  catalogue is worse than no catalogue, because nothing about it looks wrong.

  Run `node tools/build.js` after editing data.js.
*/
const SITE = 'https://artex-x.github.io/daggerheart-loot/';

/* Раскладка на человеческие имена: в csv и json источник читают вслух, а не
   сверяют с кодом. Забытый ключ раньше утекал наружу как `dread`/`frame`. */
const SRC = {
  core: 'Core', hnf: 'Hope & Fear', wondrous: 'Wondrous Loot',
  community: 'Community', dread: 'Dread GM Toolbox', frame: 'Campaign Frames'
};
const RANGE = { melee: 'Melee', veryclose: 'Very Close', close: 'Close',
                far: 'Far', veryfar: 'Very Far' };
const TRAIT = { agility: 'Agility', strength: 'Strength', finesse: 'Finesse',
                instinct: 'Instinct', presence: 'Presence', knowledge: 'Knowledge' };
const BURDEN = { 1: 'One-Handed', 2: 'Two-Handed' };
const CLS = { phy: 'physical', mag: 'magic' };
const DT = { phy: 'phy', mag: 'mag', any: 'phy/mag' };

function everything(L){
  return [].concat(...Object.values(L.items), L.eq);
}

/* Loot has no tier of its own — the alternate tables sort it by rarity, and
   that is the closest thing an agent can filter on. */
function rarityIndex(L){
  const out = {};
  ['item', 'consumable'].forEach(function (kind) {
    const table = L.alt[kind] || {};
    Object.keys(table).forEach(function (rarity) {
      Object.keys(table[rarity]).forEach(function (pool) {
        table[rarity][pool].forEach(function (id) { out[id] = rarity; });
      });
    });
  });
  return out;
}

const CSV_HEAD = ['id', 'kind', 'source', 'name_ru', 'name_en', 'tier', 'rarity', 'roll',
                  'class', 'trait', 'range', 'damage', 'burden', 'armor_score',
                  'thresholds', 'crafts_into', 'community', 'url', 'text_ru', 'text_en'];

/* Описание вещи с двумя свойствами хранится в двух строках. В таблице строка
   файла обязана оставаться одной строкой на запись, иначе каталог перестанет
   читаться построчно - переводы строк схлопываются в пробел. */
function cell(v){
  const s = (v == null ? '' : String(v)).replace(/\s*\n\s*/g, ' ');
  return /[",]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/* One row per record, every column an agent needs to answer "give me tier 1-2
   physical armour and primary weapons" without parsing 450 KB of JSON. */
function catalogCsv(L){
  const rarity = rarityIndex(L);
  const rows = everything(L).map(function (x) {
    const e = x.eq;
    return [
      x.id,
      e ? e.t : x.kind,
      SRC[x.src] || x.src,
      x.ru, x.en,
      e ? e.tier : '',
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
      x.rud || '', x.ende || ''
    ].map(cell).join(',');
  });
  return CSV_HEAD.join(',') + '\n' + rows.join('\n') + '\n';
}

function dataJson(L){ return JSON.stringify(L) + '\n'; }

module.exports = { SITE, dataJson, catalogCsv, everything };
