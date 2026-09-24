/*
  Pure logic for tools/artwork/: no fs, no sharp, no network. Everything that
  touches the outside world - reading upload bytes, hashing them, decoding
  geometry, encoding, writing atomically - lives in run.mjs. See
  docs/artwork.md for the operator-facing behaviour this implements and
  docs/specs/COVERAGE.md's `tools/artwork/lib.test.mjs` paragraph for the
  design.

  Boundary drawn exactly as tools/tg-preview/lib.mjs draws it (the pure-module
  contract docs/specs/COVERAGE.md documents): this module holds every rule
  that can be stated over data - name normalisation, matching, destination resolution,
  shared-asset grouping, collision and duplicate detection, the
  affected-stub-URL set, the stale-set algebra, the thumbnail destination
  and the thumbnail set. It also holds the SVG template of the two site
  share cards, which cards.mjs renders.
*/

// Typographic apostrophes a source or a record name may use in place of a
// plain ASCII one - folded so "Ranger's Bow" and "Ranger’s Bow" match. U+2018
// is here because a drop name used it as an apostrophe ("Hook Line ‘N’ Sinker").
const APOSTROPHES = /[‘’ʼ′]/g;

// A trailing " v2" / " v10" is a delivery's own provenance suffix, not part of
// the name - stripped only at the end, so "Halberd v2 Blade" (v2 in the
// middle) is untouched.
const VERSION_SUFFIX = /\s+v\d+$/i;

// The match key for a delivered filename or a record's en/ru name: NFC so a
// combining-character spelling matches a precomposed one, apostrophes
// folded, whitespace collapsed, the version suffix stripped, case folded.
// The original string is never overwritten - callers keep it for reporting.
export function normalizeName(s) {
  let out = String(s).normalize('NFC');
  out = out.replace(APOSTROPHES, "'");
  out = out.replace(/\s+/g, ' ').trim();
  out = out.replace(VERSION_SUFFIX, '');
  return out.toLowerCase();
}

// { byId, byName, byImg }. byName is keyed by normalizeName of both `en` and
// `ru` and its values are arrays, so a name shared by two records is
// representable rather than silently last-wins. byImg maps an `img` value to
// every record claiming it - the shared-asset groups (q24.webp -> 4 records).
export function indexRecords(records) {
  const byId = {};
  const byName = {};
  const byImg = {};
  for (const r of records) {
    byId[r.id] = r;

    const keys = new Set();
    if (r.en) keys.add(normalizeName(r.en));
    if (r.ru) keys.add(normalizeName(r.ru));
    for (const key of keys) {
      if (!byName[key]) byName[key] = [];
      byName[key].push(r);
    }

    if (r.img) {
      if (!byImg[r.img]) byImg[r.img] = [];
      byImg[r.img].push(r);
    }
  }
  return { byId, byName, byImg };
}

function stripExt(name) {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(0, i) : name;
}

// Two delivered files with identical bytes - a delivery mistake (the same
// picture given two names), and a hard error: it would violate
// tests/dataint.js's duplicate-bytes invariant once installed. Checked over
// every source regardless of whether it later matches a record.
function findDuplicateSources(sources) {
  const bySha = new Map();
  for (const s of sources) {
    if (!bySha.has(s.sha256)) bySha.set(s.sha256, []);
    bySha.get(s.sha256).push(s.name);
  }
  const out = [];
  for (const [sha256, names] of bySha) {
    if (names.length > 1) out.push({ sha256, sources: names.slice() });
  }
  return out;
}

// Resolves each source to a candidate record via `map.assign` first, then by
// normalized name - the matching half shared by `planInstall` and
// `planIngest`, reusing the same helpers rather than forking the matching
// code. Returns { candidates, unmatched, ambiguous,
// duplicateSources }; `candidates` is [{ source, record }].
function matchSources({ sources, index, assign }) {
  const duplicateSources = findDuplicateSources(sources);
  const duplicateNames = new Set();
  for (const d of duplicateSources) for (const name of d.sources) duplicateNames.add(name);

  const unmatched = [];
  const ambiguous = [];
  const candidates = [];

  for (const source of sources) {
    // A duplicate-bytes source is reported once, above; matching it further
    // would just produce a second, redundant complaint about the same file.
    if (duplicateNames.has(source.name)) continue;

    if (Object.prototype.hasOwnProperty.call(assign, source.name)) {
      const recordId = assign[source.name];
      const record = index.byId[recordId];
      if (!record) {
        unmatched.push({ source: source.name, reason: 'assign target not found: ' + recordId });
        continue;
      }
      candidates.push({ source, record });
      continue;
    }

    const key = normalizeName(stripExt(source.name));
    const matches = index.byName[key] || [];
    if (matches.length === 0) {
      unmatched.push({ source: source.name, reason: 'no matching record' });
    } else if (matches.length > 1) {
      ambiguous.push({ source: source.name, recordIds: matches.map((r) => r.id) });
    } else {
      candidates.push({ source, record: matches[0] });
    }
  }

  return { candidates, unmatched, ambiguous, duplicateSources };
}

// The 160 px row thumbnail of a picture: one per `img/<asset>`, including
// `_none.webp` (docs/artwork.md, "Thumbnails").
export function thumbPath(asset) {
  return 'img/thumb/' + asset;
}

// { targets, orphans } for the `thumbs` verb. `images` are the `.webp` names
// in `img/`, `thumbs` the `.webp` names in `img/thumb/`. `targets` is one
// { source, thumb } per picture, sorted by name; `orphans` is every thumbnail
// whose picture is gone, sorted - the verb refuses them and never deletes.
export function planThumbs({ images, thumbs }) {
  const names = images.slice().sort();
  const have = new Set(images);
  return {
    targets: names.map((name) => ({ source: 'img/' + name, thumb: thumbPath(name) })),
    orphans: thumbs
      .filter((name) => !have.has(name))
      .sort()
      .map(thumbPath)
  };
}

// { pairs, unmatched, ambiguous, collisions, duplicateSources, counts }.
//
// - `sources` is [{ name, sha256, bytes }] - metadata only; run.mjs reads
//   the files and never passes raw bytes in here.
// - `map` is the parsed --map object or null; only its `assign` key is read:
//   { "<source filename>": "<record id>" }. An assign entry naming an
//   unknown record id is reported in `unmatched`, never thrown.
// - The pair list is keyed by distinct **asset** (a record's `img` value),
//   never by record: two matched records sharing one asset and one source
//   produce one pair, whose `jpeg` is the shared asset's own `.jpg` and never
//   `og/<other-record-id>.jpg` (the structural form of the og/-naming trap).
// - `collisions`: two different sources resolving to the same asset - a hard
//   error, because it would mean two different files racing to become one
//   destination.
export function planInstall({ sources, records, map }) {
  const index = indexRecords(records);
  const assign = (map && map.assign) || {};
  const { candidates, unmatched, ambiguous, duplicateSources } = matchSources({
    sources,
    index,
    assign
  });

  const byAsset = new Map();
  for (const c of candidates) {
    const asset = c.record.img;
    if (!byAsset.has(asset)) byAsset.set(asset, []);
    byAsset.get(asset).push(c);
  }

  const collisions = [];
  const pairs = [];
  for (const [asset, list] of byAsset) {
    if (list.length > 1) {
      collisions.push({ asset, sources: list.map((c) => c.source.name) });
      continue;
    }
    const { source, record } = list[0];
    const sharedWith = (index.byImg[asset] || [])
      .filter((r) => r.id !== record.id)
      .map((r) => r.id);
    pairs.push({
      source: source.name,
      sourceSha256: source.sha256,
      recordId: record.id,
      recordName: record.ru || record.en,
      asset,
      webp: 'img/' + asset,
      thumb: thumbPath(asset),
      jpeg: 'og/' + asset.replace(/\.webp$/, '.jpg'),
      sharedWith
    });
  }

  const recordLinks = pairs.reduce((n, p) => n + 1 + p.sharedWith.length, 0);

  return {
    pairs,
    unmatched,
    ambiguous,
    collisions,
    duplicateSources,
    counts: { acceptedArtwork: pairs.length, assetPairs: pairs.length, recordLinks }
  };
}

// Sorted unique stub URLs for every matched record and every sharedWith
// record - the set a byte change is expected to invalidate. Both languages:
// i/en/<id>.html shows the same og/ picture as i/<id>.html (CONTRACTS.md
// section 5), so a byte change invalidates both. Same URL shape as
// tools/tg-preview/lib.mjs's `urls()`; not a second URL builder.
export function affectedStubUrls(pairs, site) {
  const ids = new Set();
  for (const p of pairs) {
    ids.add(p.recordId);
    for (const id of p.sharedWith) ids.add(id);
  }
  return Array.from(ids)
    .flatMap((id) => [site + 'i/' + id + '.html', site + 'i/en/' + id + '.html'])
    .sort();
}

// { newlyStale, alreadyStale, missing, extra, disappeared, ok }. `before` and
// `after` are the `stale` arrays from two tg-preview --stale-list files;
// `expected` is affectedStubUrls(...) for the change just installed.
// `missing` = expected but never went stale - the change did not actually
// invalidate what it should have. `extra` = went stale but was not expected -
// something else changed too, or the expected set is wrong. `disappeared` =
// stale before, not stale after, and not part of the expected change -
// worth a look, never itself a failure. `ok` is true only when `missing` and
// `extra` are both empty.
export function staleDelta({ before, after, expected }) {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  const expectedSet = new Set(expected);

  const newlyStale = after.filter((u) => !beforeSet.has(u));
  const alreadyStale = after.filter((u) => beforeSet.has(u));
  const newlyStaleSet = new Set(newlyStale);

  const missing = expected.filter((u) => !newlyStaleSet.has(u));
  const extra = newlyStale.filter((u) => !expectedSet.has(u));
  const disappeared = before.filter((u) => !afterSet.has(u) && !expectedSet.has(u));

  return {
    newlyStale: newlyStale.slice().sort(),
    alreadyStale: alreadyStale.slice().sort(),
    missing: missing.slice().sort(),
    extra: extra.slice().sort(),
    disappeared: disappeared.slice().sort(),
    ok: missing.length === 0 && extra.length === 0
  };
}

// The lettering of the two site share cards, og/_share.jpg (ru) and
// og/_share_en.jpg (en) - docs/artwork.md, "The site share cards".
export const CARD_TEXT = {
  ru: {
    title: 'Генератор лута',
    brand: 'DAGGERHEART',
    subtitle: 'Добыча, расходники, оружие и броня · RU / EN'
  },
  en: {
    title: 'Loot Generator',
    brand: 'DAGGERHEART',
    subtitle: 'Loot, consumables, weapons and armour · RU / EN'
  }
};

export const CARD_FONT = 'Inter';

function escXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// A five-point star centred on (cx, cy), point up.
function starPath(cx, cy, outer, inner) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push((cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1));
  }
  return 'M' + pts.join(' L') + ' Z';
}

// The 1200x630 SVG of one site share card. The layout is the one the
// hand-made og/_share.jpg of 7fd046c carried; the colours are the share
// stubs' stylesheet (tools/build-share-pages.js).
export function shareCardSvg(lang) {
  const text = CARD_TEXT[lang];
  if (!text) throw new Error('No share card text for language "' + lang + '". Use ru or en');
  const font = 'font-family="\'' + CARD_FONT + '\'"';
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">',
    '<defs>',
    '<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">',
    '<stop offset="0" stop-color="#171425"/><stop offset="0.75" stop-color="#0e0c15"/>',
    '</linearGradient>',
    '<radialGradient id="violet" cx="150" cy="0" r="620" gradientUnits="userSpaceOnUse">',
    '<stop offset="0" stop-color="#2c2248" stop-opacity="0.85"/><stop offset="1" stop-color="#2c2248" stop-opacity="0"/>',
    '</radialGradient>',
    '<radialGradient id="blue" cx="1180" cy="0" r="520" gradientUnits="userSpaceOnUse">',
    '<stop offset="0" stop-color="#26334e" stop-opacity="0.85"/><stop offset="1" stop-color="#26334e" stop-opacity="0"/>',
    '</radialGradient>',
    '</defs>',
    '<rect width="1200" height="630" fill="url(#bg)"/>',
    '<rect width="1200" height="630" fill="url(#violet)"/>',
    '<rect width="1200" height="630" fill="url(#blue)"/>',
    '<path d="' + starPath(92, 301, 35, 15) + '" fill="#d8ab5e"/>',
    '<text x="150" y="321" ' +
      font +
      ' font-size="64" font-weight="600" fill="#ece8f6">' +
      escXml(text.title) +
      '</text>',
    '<text x="152" y="368" ' +
      font +
      ' font-size="30" font-weight="600" letter-spacing="2" fill="#d8ab5e">' +
      escXml(text.brand) +
      '</text>',
    '<text x="152" y="418" ' +
      font +
      ' font-size="26" font-weight="400" fill="#9b93b3">' +
      escXml(text.subtitle) +
      '</text>',
    '<rect y="624" width="1200" height="6" fill="#d8ab5e"/>',
    '</svg>'
  ].join('\n');
}

// { creates, shares, unarted, unsourced, unmatched, ambiguous, collisions,
// duplicateSources, counts } - the ingest planner.
//
// - `missingAssets` is supplied by run.mjs: the distinct `img` values in
//   data.js for which `img/<value>` does not exist on disk yet. planIngest
//   never touches the filesystem itself and never infers which records are
//   "new" - it only knows an asset is missing because the caller told it so.
// - `creates` is keyed by distinct **asset**, never by record, exactly like
//   `planInstall`'s `pairs`: one entry per source that resolves to a missing
//   asset, `recordIds` is every record in `records` claiming that asset (so
//   two brand-new records sharing one not-yet-installed asset still produce
//   one entry). This is what makes `og/<new-record-id>.jpg` structurally
//   unreachable - the destination name only ever comes from `asset`.
// - `shares` covers the opposite case: a source was matched to a record
//   whose asset turns out to already exist on disk (not in `missingAssets`).
//   No new file is needed - the record is simply joining an already-arted
//   line - so a `shares` entry carries no filenames at all, only
//   `{ recordId, asset, alsoClaimedBy }`. A record nobody uploaded a source
//   for is not reported here: if it needs no art, there is nothing to plan.
// - `unarted`: every record with a falsy `img` - `img: ''` rendering
//   `_none.webp` is a legal ingest outcome (app/src/components/record.test.ts,
//   ported from the live app's tests/noart.js), reported, not an error.
// - `unsourced`: every asset in `missingAssets` that no source resolved to -
//   the blocker an ingest most often hits - named by asset and by the
//   record ids waiting on it.
// - `unmatched`, `ambiguous`, `duplicateSources`, and the collision rule are
//   the same helpers `planInstall` uses; the matching code is not forked.
export function planIngest({ sources, records, missingAssets, map }) {
  const index = indexRecords(records);
  const assign = (map && map.assign) || {};
  const missingSet = new Set(missingAssets);
  const { candidates, unmatched, ambiguous, duplicateSources } = matchSources({
    sources,
    index,
    assign
  });

  const byAsset = new Map();
  for (const c of candidates) {
    const asset = c.record.img;
    if (!byAsset.has(asset)) byAsset.set(asset, []);
    byAsset.get(asset).push(c);
  }

  const collisions = [];
  const creates = [];
  const shares = [];
  for (const [asset, list] of byAsset) {
    if (list.length > 1) {
      collisions.push({ asset, sources: list.map((c) => c.source.name) });
      continue;
    }
    const { source, record } = list[0];
    if (missingSet.has(asset)) {
      const recordIds = (index.byImg[asset] || [record]).map((r) => r.id);
      creates.push({
        source: source.name,
        sourceSha256: source.sha256,
        asset,
        webp: 'img/' + asset,
        thumb: thumbPath(asset),
        jpeg: 'og/' + asset.replace(/\.webp$/, '.jpg'),
        recordIds
      });
    } else {
      const alsoClaimedBy = (index.byImg[asset] || [])
        .filter((r) => r.id !== record.id)
        .map((r) => r.id);
      shares.push({ recordId: record.id, asset, alsoClaimedBy });
    }
  }

  const unarted = records.filter((r) => !r.img).map((r) => ({ recordId: r.id }));

  const resolvedAssets = new Set(creates.map((c) => c.asset));
  const unsourced = [];
  for (const asset of missingSet) {
    if (resolvedAssets.has(asset)) continue;
    const recordIds = (index.byImg[asset] || []).map((r) => r.id);
    unsourced.push({ asset, recordIds });
  }

  const recordLinks = creates.reduce((n, c) => n + c.recordIds.length, 0);

  return {
    creates,
    shares,
    unarted,
    unsourced,
    unmatched,
    ambiguous,
    collisions,
    duplicateSources,
    counts: {
      acceptedArtwork: creates.length,
      newAssets: creates.length,
      recordLinks,
      shared: shares.length,
      unarted: unarted.length
    }
  };
}
