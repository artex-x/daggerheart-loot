#!/usr/bin/env node
/*
  CLI entry point for tools/artwork/. Verbs, not a mode flag or a second
  entry point (issues/art-tooling/plan.md 3.7): `lib.mjs` holds every rule
  that can be stated over data, this file holds only what its honest proof is
  the filesystem and the encoder - hashing uploads, decoding geometry,
  encoding, atomic install, byte verification. See docs/artwork.md for what
  each verb does and the runbook that drives this by hand.

  `sharp` is imported lazily, only by the verbs that encode (`install`,
  `verify`, `ingest`), so `plan` and `verify-previews` run on a machine where
  `tools/artwork/node_modules/` does not exist.
*/
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, renameSync, readdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { planInstall, planIngest, affectedStubUrls, staleDelta } from './lib.mjs';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..');

const VERBS = ['plan', 'install', 'verify', 'verify-previews', 'ingest'];

// The settings measured across three refreshes (issues/art-tooling/context.md,
// "Conversion settings, established across three refreshes") and documented
// once, in docs/artwork.md - not restated anywhere else in the repository.
const DIMENSION = 640;
const WEBP_QUALITY = 85;
const JPEG_QUALITY = 80;

function log(msg) {
  console.log(msg);
}

function usage() {
  return (
    'usage: node tools/artwork/run.mjs <verb> [flags]\n  verbs: ' +
    VERBS.join(', ') +
    '\nsee docs/artwork.md'
  );
}

function parseFlags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') {
      out.dryRun = true;
      continue;
    }
    if (!a.startsWith('--')) throw new Error('unexpected argument: ' + a);
    const key = a.slice(2);
    const value = argv[++i];
    if (value === undefined) throw new Error('--' + key + ' needs a value');
    out[key] = value;
  }
  return out;
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

// Metadata-only sources for planInstall, plus a name -> Buffer map for the
// verbs that need the actual bytes (install, verify). plan and
// verify-previews never touch the second map's contents.
function readUploads(dir) {
  const names = readdirSync(dir).filter((n) => !n.startsWith('.'));
  const bytesByName = new Map();
  const sources = names.map((name) => {
    const buf = readFileSync(join(dir, name));
    bytesByName.set(name, buf);
    return { name, sha256: sha256(buf), bytes: buf.length };
  });
  return { sources, bytesByName };
}

function readMap(path) {
  if (!path) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeReport(path, report) {
  if (!path) return;
  writeFileSync(path, JSON.stringify(report, null, 2) + '\n');
}

// The createRequire + window.LOOT shim tools/tg-preview/manifest.mjs already
// demonstrates. `--repo` only changes where data.js is loaded from; the
// generic derived.js helper (everything()/SITE) always comes from this
// repository's own tools/, since it is code, not the fixture's data.
function loadRecords(dataRoot) {
  if (!globalThis.window) globalThis.window = {};
  if (!globalThis.window.LOOT) require(join(dataRoot, 'data.js'));
  const L = globalThis.window.LOOT;
  const { everything, SITE } = require(join(REPO_ROOT, 'tools', 'derived.js'));
  return { records: everything(L), site: SITE };
}

function printPlan(result) {
  const { counts, unmatched, ambiguous, collisions, duplicateSources } = result;
  log(
    'accepted ' +
      counts.acceptedArtwork +
      ', asset pairs ' +
      counts.assetPairs +
      ', record links ' +
      counts.recordLinks
  );
  for (const u of unmatched) log('unmatched: ' + u.source + ' (' + u.reason + ')');
  for (const a of ambiguous) log('ambiguous: ' + a.source + ' -> ' + a.recordIds.join(', '));
  for (const c of collisions) log('collision: ' + c.asset + ' <- ' + c.sources.join(', '));
  for (const d of duplicateSources) log('duplicate bytes: ' + d.sources.join(' == '));
}

async function loadSharp() {
  try {
    const mod = await import('sharp');
    return mod.default || mod;
  } catch (err) {
    throw new Error(
      'sharp is not installed for tools/artwork - run: cd tools/artwork && npm ci (' +
        (err && err.message ? err.message : err) +
        ')'
    );
  }
}

// Effective width/height after EXIF auto-orientation - sharp's own
// `metadata()` reports pre-rotation dimensions, and orientations 5-8 swap
// the axes once rotation is applied.
function orientedSize(meta) {
  const swapped = meta.orientation >= 5 && meta.orientation <= 8;
  return swapped
    ? { width: meta.height, height: meta.width }
    : { width: meta.width, height: meta.height };
}

async function decodeAndCheck(sharpFn, buf, label) {
  const probe = sharpFn(buf, { failOn: 'error' });
  const meta = await probe.metadata();
  const { width, height } = orientedSize(meta);
  if (width !== height) {
    throw new Error(label + ': non-square input ' + meta.width + 'x' + meta.height);
  }
  if (meta.hasAlpha) {
    const stats = await sharpFn(buf).stats();
    const alpha = stats.channels[stats.channels.length - 1];
    if (alpha.min !== 255 || alpha.max !== 255) {
      throw new Error(label + ': input contains transparency');
    }
  }
  return meta;
}

// Same settings in both formats every time: EXIF-oriented, resized to
// 640x640 with Lanczos, no metadata (sharp strips EXIF/ICC by default unless
// withMetadata() is called, which this never does). docs/artwork.md documents
// this once; nowhere else in the repository restates it.
async function encodePair(sharpFn, buf) {
  const oriented = sharpFn(buf, { failOn: 'error' })
    .rotate()
    .resize(DIMENSION, DIMENSION, { kernel: 'lanczos3', fit: 'fill' });
  const webp = await oriented
    .clone()
    .webp({ quality: WEBP_QUALITY, effort: 6, lossless: false })
    .toBuffer();
  const jpeg = await oriented
    .clone()
    .jpeg({
      quality: JPEG_QUALITY,
      progressive: true,
      chromaSubsampling: '4:2:0',
      mozjpeg: true
    })
    .toBuffer();
  return { webp, jpeg };
}

async function validateEncoded(sharpFn, buf, format) {
  const meta = await sharpFn(buf).metadata();
  if (meta.format !== format || meta.width !== DIMENSION || meta.height !== DIMENSION) {
    throw new Error(
      'bad encoded asset: format=' + meta.format + ' size=' + meta.width + 'x' + meta.height
    );
  }
}

function atomicWrite(path, buf) {
  const tmp = path + '.artwork.tmp';
  writeFileSync(tmp, buf);
  renameSync(tmp, path);
}

async function planFromUploads(flags) {
  const repo = flags.repo || REPO_ROOT;
  const { records } = loadRecords(repo);
  const { sources } = readUploads(flags.uploads);
  const map = readMap(flags.map);
  return { result: planInstall({ sources, records, map }), repo };
}

async function verbPlan(flags) {
  if (!flags.uploads) throw new Error('plan needs --uploads <dir>');
  const { result } = await planFromUploads(flags);
  printPlan(result);
  writeReport(flags.report, result);
  const blocked =
    result.ambiguous.length || result.collisions.length || result.duplicateSources.length;
  return blocked ? 1 : 0;
}

// The one installer code path shared by `install` and `ingest` (plan.md 5.3
// acceptance: "grep for the temp-sibling rename and find one implementation").
// `entries` is [{ source, asset, webp, jpeg, label }] - `label` is what a
// progress line and a verification-failure message name (the record id for
// `install`, the asset for `ingest`, which has no single record to blame).
async function installAndVerify(sharpFn, repo, entries, bytesByName) {
  for (const e of entries) {
    const buf = bytesByName.get(e.source);
    const { webp, jpeg } = await encodePair(sharpFn, buf);
    await validateEncoded(sharpFn, webp, 'webp');
    await validateEncoded(sharpFn, jpeg, 'jpeg');
    atomicWrite(join(repo, e.webp), webp);
    atomicWrite(join(repo, e.jpeg), jpeg);
  }

  // Re-encode from source and compare against what was just installed - the
  // per-run determinism proof (plan.md 3.1: never a comparison against
  // bytes committed by a different encoder or a different run).
  for (const e of entries) {
    const buf = bytesByName.get(e.source);
    const { webp, jpeg } = await encodePair(sharpFn, buf);
    const installedWebp = readFileSync(join(repo, e.webp));
    const installedJpeg = readFileSync(join(repo, e.jpeg));
    if (!installedWebp.equals(webp))
      throw new Error(e.label + ': WebP re-encode verification failed');
    if (!installedJpeg.equals(jpeg))
      throw new Error(e.label + ': JPEG re-encode verification failed');
    log(
      e.label +
        '|' +
        e.source +
        '|' +
        e.asset +
        '|' +
        sha256(webp).slice(0, 16) +
        '|' +
        sha256(jpeg).slice(0, 16)
    );
  }
}

async function verbInstall(flags) {
  if (!flags.uploads) throw new Error('install needs --uploads <dir>');
  const repo = flags.repo || REPO_ROOT;
  const { records } = loadRecords(repo);
  const { sources, bytesByName } = readUploads(flags.uploads);
  const map = readMap(flags.map);
  const result = planInstall({ sources, records, map });
  printPlan(result);

  const hardStops = [];
  if (result.ambiguous.length)
    hardStops.push('ambiguous names: ' + result.ambiguous.map((a) => a.source).join(', '));
  if (result.collisions.length)
    hardStops.push('collisions: ' + result.collisions.map((c) => c.asset).join(', '));
  if (result.duplicateSources.length) {
    hardStops.push(
      'duplicate source bytes: ' +
        result.duplicateSources.map((d) => d.sources.join('==')).join(', ')
    );
  }

  const sharpFn = await loadSharp();
  for (const pair of result.pairs) {
    const buf = bytesByName.get(pair.source);
    try {
      await decodeAndCheck(sharpFn, buf, pair.source);
    } catch (err) {
      hardStops.push(err.message);
    }
    const webpPath = join(repo, pair.webp);
    const jpegPath = join(repo, pair.jpeg);
    // `install` replaces; it never creates - the inverted precondition
    // belongs to `ingest`, below.
    if (!existsSync(webpPath))
      hardStops.push('install refuses: destination does not exist: ' + pair.webp);
    if (!existsSync(jpegPath))
      hardStops.push('install refuses: destination does not exist: ' + pair.jpeg);
  }

  if (hardStops.length) {
    for (const h of hardStops) log('refused: ' + h);
    return 1;
  }

  if (flags.dryRun) {
    log('dry run: ' + result.pairs.length + ' pair(s) would be installed, nothing written');
    return 0;
  }

  await installAndVerify(
    sharpFn,
    repo,
    result.pairs.map((p) => ({
      source: p.source,
      asset: p.asset,
      webp: p.webp,
      jpeg: p.jpeg,
      label: p.recordId
    })),
    bytesByName
  );

  writeReport(flags.report, result);
  return 0;
}

function printIngest(result) {
  const {
    counts,
    creates,
    shares,
    unarted,
    unsourced,
    unmatched,
    ambiguous,
    collisions,
    duplicateSources
  } = result;
  log(
    'accepted ' +
      counts.acceptedArtwork +
      ', new assets ' +
      counts.newAssets +
      ', record links ' +
      counts.recordLinks +
      ', shared ' +
      counts.shared +
      ', unarted ' +
      counts.unarted
  );
  for (const c of creates)
    log(
      'creates: ' + c.asset + ' <- ' + c.source + ' (records: ' + c.recordIds.join(', ') + ')'
    );
  for (const s of shares)
    log(
      'shares: ' +
        s.recordId +
        ' -> ' +
        s.asset +
        ' (also claimed by: ' +
        s.alsoClaimedBy.join(', ') +
        ')'
    );
  for (const u of unarted) log('unarted: ' + u.recordId);
  for (const u of unsourced)
    log('unsourced: ' + u.asset + ' (waiting: ' + u.recordIds.join(', ') + ')');
  for (const u of unmatched) log('unmatched: ' + u.source + ' (' + u.reason + ')');
  for (const a of ambiguous) log('ambiguous: ' + a.source + ' -> ' + a.recordIds.join(', '));
  for (const c of collisions) log('collision: ' + c.asset + ' <- ' + c.sources.join(', '));
  for (const d of duplicateSources) log('duplicate bytes: ' + d.sources.join(' == '));
}

// The distinct `img` values data.js declares for which `img/<value>` does not
// exist on disk yet - the definition of "new art needed" (plan.md 5.3 step
// 3). run.mjs computes this; planIngest never touches the filesystem.
function findMissingAssets(repo, records) {
  const assets = new Set();
  for (const r of records) if (r.img) assets.add(r.img);
  return Array.from(assets).filter((asset) => !existsSync(join(repo, 'img', asset)));
}

async function verbIngest(flags) {
  if (!flags.uploads) throw new Error('ingest needs --uploads <dir>');
  const repo = flags.repo || REPO_ROOT;
  const { records } = loadRecords(repo);
  const { sources, bytesByName } = readUploads(flags.uploads);
  const map = readMap(flags.map);
  const missingAssets = findMissingAssets(repo, records);
  const result = planIngest({ sources, records, missingAssets, map });
  printIngest(result);

  const hardStops = [];
  if (result.ambiguous.length)
    hardStops.push('ambiguous names: ' + result.ambiguous.map((a) => a.source).join(', '));
  if (result.collisions.length)
    hardStops.push('collisions: ' + result.collisions.map((c) => c.asset).join(', '));
  if (result.duplicateSources.length) {
    hardStops.push(
      'duplicate source bytes: ' +
        result.duplicateSources.map((d) => d.sources.join('==')).join(', ')
    );
  }

  // `unsourced` and `unarted` are reported above and never stop the run: a
  // partially-arted ingest is normal (plan.md 5.3 step 3).
  const sharpFn = await loadSharp();
  for (const c of result.creates) {
    const buf = bytesByName.get(c.source);
    try {
      await decodeAndCheck(sharpFn, buf, c.source);
    } catch (err) {
      hardStops.push(err.message);
    }
    const webpPath = join(repo, c.webp);
    const jpegPath = join(repo, c.jpeg);
    // The inverted precondition: `ingest` creates, it never replaces. This is
    // `install`'s existence check with the sense flipped.
    if (existsSync(webpPath))
      hardStops.push('ingest refuses: destination already exists: ' + c.webp);
    if (existsSync(jpegPath))
      hardStops.push('ingest refuses: destination already exists: ' + c.jpeg);
  }

  if (hardStops.length) {
    for (const h of hardStops) log('refused: ' + h);
    return 1;
  }

  if (flags.dryRun) {
    log('dry run: ' + result.creates.length + ' asset(s) would be created, nothing written');
    return 0;
  }

  await installAndVerify(
    sharpFn,
    repo,
    result.creates.map((c) => ({
      source: c.source,
      asset: c.asset,
      webp: c.webp,
      jpeg: c.jpeg,
      label: c.asset
    })),
    bytesByName
  );

  writeReport(flags.report, result);
  log('next: node tools/build.js, then node tests/run-all.js dataint');
  return 0;
}

async function verbVerify(flags) {
  if (!flags.uploads) throw new Error('verify needs --uploads <dir>');
  const repo = flags.repo || REPO_ROOT;
  const { records } = loadRecords(repo);
  const { sources, bytesByName } = readUploads(flags.uploads);
  const map = readMap(flags.map);
  const result = planInstall({ sources, records, map });

  const sharpFn = await loadSharp();
  let failures = 0;
  for (const pair of result.pairs) {
    const buf = bytesByName.get(pair.source);
    const { webp, jpeg } = await encodePair(sharpFn, buf);
    const webpPath = join(repo, pair.webp);
    const jpegPath = join(repo, pair.jpeg);
    if (!existsSync(webpPath) || !existsSync(jpegPath)) {
      log('missing: ' + pair.webp + ' / ' + pair.jpeg);
      failures++;
      continue;
    }
    const installedWebp = readFileSync(webpPath);
    const installedJpeg = readFileSync(jpegPath);
    await validateEncoded(sharpFn, installedWebp, 'webp');
    await validateEncoded(sharpFn, installedJpeg, 'jpeg');
    if (!installedWebp.equals(webp) || !installedJpeg.equals(jpeg)) {
      log('mismatch: ' + pair.recordId + ' (' + pair.asset + ')');
      failures++;
      continue;
    }
    log('ok: ' + pair.recordId + ' (' + pair.asset + ')');
  }
  return failures === 0 ? 0 : 1;
}

// Reads the `pairs` a prior `plan`/`install --report <f>` call wrote, so the
// preview-staleness proof reuses exactly what was actually planned or
// installed rather than re-deriving it a third time. `--report` here is an
// input, the same artifact `plan`/`install` produce as output.
async function verbVerifyPreviews(flags) {
  if (!flags.before || !flags.after)
    throw new Error('verify-previews needs --before <f> and --after <f>');
  if (!flags.report)
    throw new Error(
      'verify-previews needs --report <f>, the plan/install report to read pairs from'
    );
  const before = JSON.parse(readFileSync(flags.before, 'utf8'));
  const after = JSON.parse(readFileSync(flags.after, 'utf8'));
  if (before.site !== after.site) {
    throw new Error(
      '--before and --after are for different sites: ' + before.site + ' vs ' + after.site
    );
  }
  const report = JSON.parse(readFileSync(flags.report, 'utf8'));
  const expected = affectedStubUrls(report.pairs || [], before.site);
  const delta = staleDelta({ before: before.stale || [], after: after.stale || [], expected });
  log(JSON.stringify(delta, null, 2));
  return delta.ok ? 0 : 1;
}

async function main() {
  const [verb, ...rest] = process.argv.slice(2);
  if (!verb || !VERBS.includes(verb)) {
    console.error(usage());
    process.exitCode = 1;
    return;
  }
  const flags = parseFlags(rest);
  if (verb === 'plan') process.exitCode = await verbPlan(flags);
  else if (verb === 'install') process.exitCode = await verbInstall(flags);
  else if (verb === 'verify') process.exitCode = await verbVerify(flags);
  else if (verb === 'verify-previews') process.exitCode = await verbVerifyPreviews(flags);
  else if (verb === 'ingest') process.exitCode = await verbIngest(flags);
}

main().catch((err) => {
  console.error('artwork run failed: ' + (err && err.message ? err.message : err));
  process.exitCode = 1;
});
