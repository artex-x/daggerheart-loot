#!/usr/bin/env node
/*
  Rasterises app/public/icons/icon.svg into the PNG sizes the web app
  manifest and iOS ask for (docs/specs/META.md section 9). The PNGs are
  committed build inputs, like card/*.svg: root `npm ci` installs no encoder,
  so this runs by hand from the sibling project that carries `sharp`
  (docs/artwork.md, "Icons").

  The drawing keeps every stroke inside the maskable safe zone, so the
  maskable size is the same drawing at the same size.
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ICONS = join(HERE, '..', '..', 'app', 'public', 'icons');

/* 384 dpi renders the 512-unit drawing at about 2730 px before the resize,
   so every output size is downsampled rather than upscaled. */
const DENSITY = 384;

const OUTPUTS = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['maskable-512.png', 512],
  ['apple-touch-icon.png', 180]
];

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (err) {
  throw new Error('sharp is not installed for tools/artwork. Run: cd tools/artwork && npm ci', {
    cause: err
  });
}

const svg = readFileSync(join(ICONS, 'icon.svg'));
for (const [name, size] of OUTPUTS) {
  const png = await sharp(svg, { density: DENSITY })
    .resize(size, size, { kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(join(ICONS, name), png);
  console.log(name + ' ' + String(size) + 'x' + String(size) + ' ' + String(png.length) + ' B');
}
