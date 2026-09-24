#!/usr/bin/env node
/*
  Renders the two site share cards, og/_share.jpg (Russian) and
  og/_share_en.jpg (English), from shareCardSvg() in lib.mjs. The JPEGs are
  committed build inputs, like the icons: run this by hand from the sibling
  project that carries `sharp` (docs/artwork.md, "The site share cards").

    node tools/artwork/cards.mjs          # writes both cards
    node tools/artwork/cards.mjs --check  # re-renders in memory, compares with og/

  Fontconfig is pointed at tools/artwork/fonts/ and nothing else before
  sharp loads, so a host font can never stand in for Inter: a missing font
  renders no glyphs, and --check fails on that. Both modes also check where
  each title ends, so a host face that stands in fails, and write mode
  writes neither card when one fails.
*/
import { mkdtempSync, writeFileSync, renameSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shareCardSvg } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FONTS = join(HERE, 'fonts');
const OG = join(HERE, '..', '..', 'og');

const OUTPUTS = [
  ['ru', '_share.jpg'],
  ['en', '_share_en.jpg']
];

// --check thresholds: sharp output is deterministic per encoder build, not
// byte-identical across builds (docs/artwork.md, "Determinism is per-run").
const CHANNEL_TOLERANCE = 32;
const MAX_DIFF_SHARE = 0.005;
// A pixel this far from the top-left background counts as ink. Measured
// 2026-09-23: about 11500 ink pixels without text (the star and the rule),
// about 23500 with it; below MIN_INK the render found no font.
const INK_DISTANCE = 96;
const MIN_INK = 17000;
// The title's rows: its baseline is y 321 at 64 px, the brand line's caps
// start near y 346 (shareCardSvg). A pixel whose three channels all exceed
// TITLE_BRIGHT is title ink (#ece8f6); the gold brand and the grey subtitle
// are darker in at least one channel.
const TITLE_BAND = [260, 340];
const TITLE_BRIGHT = 180;
// Each title's measured right edge +-12 px, measured 2026-09-24 on this
// host: ru 637, en 611 in Inter; the host face ends them at ru 673, en 672,
// and the pre-2026-09-23 face ended the Russian title near x 708.
const TITLE_END = { ru: [625, 649], en: [599, 623] };

function xmlPath(p) {
  return p.replace(/\\/g, '/').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

// Fontconfig reads its variables through the C runtime, which on Windows
// never sees a process.env write made after start-up (measured 2026-09-23:
// the render used a host face). So the script writes fonts.conf and runs
// itself again with the variables set from the start.
if (process.env.DHLOOT_CARDS_FONTCONF !== '1') {
  const confDir = mkdtempSync(join(tmpdir(), 'dhloot-cards-'));
  const conf = join(confDir, 'fonts.conf');
  writeFileSync(
    conf,
    [
      '<?xml version="1.0"?>',
      '<!DOCTYPE fontconfig SYSTEM "fonts.dtd">',
      '<fontconfig>',
      '  <dir>' + xmlPath(FONTS) + '</dir>',
      '  <cachedir>' + xmlPath(join(confDir, 'cache')) + '</cachedir>',
      '</fontconfig>',
      ''
    ].join('\n')
  );
  const child = spawnSync(
    process.execPath,
    [fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        FONTCONFIG_PATH: confDir,
        FONTCONFIG_FILE: conf,
        DHLOOT_CARDS_FONTCONF: '1'
      }
    }
  );
  rmSync(confDir, { recursive: true, force: true });
  if (child.error) {
    console.error('cards.mjs could not start its render process: ' + child.error.message);
    process.exit(1);
  }
  process.exit(child.status === null ? 1 : child.status);
}

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (err) {
  throw new Error('sharp is not installed for tools/artwork. Run: cd tools/artwork && npm ci', {
    cause: err
  });
}

function render(lang) {
  return sharp(Buffer.from(shareCardSvg(lang)), { density: 72 })
    .flatten({ background: '#0e0c15' })
    .jpeg({ quality: 85, progressive: true, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toBuffer();
}

async function rgb(input) {
  const { data, info } = await sharp(input)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function inkPixels({ data, width, height }) {
  const bg = [data[0], data[1], data[2]];
  let ink = 0;
  for (let i = 0; i < width * height * 3; i += 3) {
    const d =
      Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]);
    if (d > INK_DISTANCE) ink++;
  }
  return ink;
}

// The largest x with a bright pixel in TITLE_BAND's rows; -1 when there is none.
function titleEnd({ data, width }) {
  let end = -1;
  for (let y = TITLE_BAND[0]; y <= TITLE_BAND[1]; y++) {
    for (let x = width - 1; x > end; x--) {
      const i = (y * width + x) * 3;
      if (data[i] > TITLE_BRIGHT && data[i + 1] > TITLE_BRIGHT && data[i + 2] > TITLE_BRIGHT) {
        end = x;
        break;
      }
    }
  }
  return end;
}

function differingShare(a, b) {
  let diff = 0;
  for (let i = 0; i < a.data.length; i += 3) {
    if (
      Math.abs(a.data[i] - b.data[i]) > CHANNEL_TOLERANCE ||
      Math.abs(a.data[i + 1] - b.data[i + 1]) > CHANNEL_TOLERANCE ||
      Math.abs(a.data[i + 2] - b.data[i + 2]) > CHANNEL_TOLERANCE
    )
      diff++;
  }
  return diff / (a.width * a.height);
}

const check = process.argv.includes('--check');
let failed = false;
const writes = [];
for (const [lang, name] of OUTPUTS) {
  const file = join(OG, name);
  const jpeg = await render(lang);
  const fresh = await rgb(jpeg);
  const ink = inkPixels(fresh);
  if (fresh.width !== 1200 || fresh.height !== 630) {
    console.error(
      name + ': rendered ' + fresh.width + 'x' + fresh.height + ', expected 1200x630'
    );
    failed = true;
    continue;
  }
  if (ink < MIN_INK) {
    console.error(
      name +
        ': rendered no text (' +
        ink +
        ' ink pixels). Check tools/artwork/fonts/ holds Inter'
    );
    failed = true;
    continue;
  }
  const end = titleEnd(fresh);
  const [lo, hi] = TITLE_END[lang];
  if (end < lo || end > hi) {
    console.error(
      name +
        ': the title ends at x ' +
        end +
        ', expected ' +
        lo +
        '-' +
        hi +
        ' for Inter; a host face stood in - see docs/artwork.md, "The site share cards"'
    );
    failed = true;
    continue;
  }
  if (check) {
    const disk = await rgb(readFileSync(file));
    if (disk.width !== fresh.width || disk.height !== fresh.height) {
      console.error(
        name + ': on disk ' + disk.width + 'x' + disk.height + ', expected 1200x630'
      );
      failed = true;
      continue;
    }
    const share = differingShare(fresh, disk);
    const verdict = share > MAX_DIFF_SHARE ? 'DIFFERS' : 'ok';
    console.log(
      name + ': ' + verdict + ' (' + (share * 100).toFixed(3) + '% of pixels differ)'
    );
    if (share > MAX_DIFF_SHARE) failed = true;
  } else {
    writes.push([file, name, jpeg, ink]);
  }
}
if (failed) process.exit(1);
for (const [file, name, jpeg, ink] of writes) {
  const tmp = file + '.tmp';
  writeFileSync(tmp, jpeg);
  renameSync(tmp, file);
  console.log(name + ' 1200x630 ' + jpeg.length + ' B, ' + ink + ' ink pixels');
}
