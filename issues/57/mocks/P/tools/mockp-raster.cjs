/* Rasterises the mock P PDFs with pdftoppm: each sheet at 300 dpi as JPEG, and two cards
 * at real size (300 dpi PNG): the long-text card and a weapon. node mockp-raster.cjs <pdf-dir> <out-dir> */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const [IN, OUT] = process.argv.slice(2);
const DPI = 300;
const px = (mm) => Math.round((mm / 25.4) * DPI);
/* Card boxes in mm: [x, y, w, h] of the long-text card (voa2_a3) and the broadsword (q1). */
const BOX = {
  'current-std9': { long: [8.5 + 2 * 65, 14.5, 63, 88], weapon: [8.5, 14.5 + 90, 63, 88] },
  'proposed-std9': {
    long: [7.75 + 2 * 65.5, 13.15, 63.5, 88.9],
    weapon: [7.75, 13.15 + 90.9, 63.5, 88.9]
  },
  compact16: { long: [14 + 2 * 46, 19.5, 44, 63], weapon: [14 + 3 * 46, 19.5, 44, 63] }
};
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(IN).filter((x) => x.endsWith('.pdf'))) {
  const stem = f.replace(/\.pdf$/, '');
  const src = path.join(IN, f);
  /* Sheets: today and the Source Sans 3 proposal; crops: the four layouts the page shows. */
  if (!stem.startsWith('proposed-today'))
    execFileSync('pdftoppm', [
      '-r',
      String(DPI),
      '-jpeg',
      '-jpegopt',
      'quality=85',
      '-singlefile',
      src,
      path.join(OUT, stem + '__300dpi')
    ]);
  if (!/(std9-colour-(ru|en)|compact16-colour-ru|compact16-bw-en)$/.test(stem)) continue;
  const mode = stem.split('-')[0];
  const sheet = stem.includes('compact16') ? 'compact16' : mode + '-std9';
  for (const [which, [x, y, w, h]] of Object.entries(BOX[sheet])) {
    execFileSync('pdftoppm', [
      '-r',
      String(DPI),
      '-jpeg',
      '-jpegopt',
      'quality=92',
      '-singlefile',
      '-x',
      String(px(x)),
      '-y',
      String(px(y)),
      '-W',
      String(px(w)),
      '-H',
      String(px(h)),
      src,
      path.join(OUT, stem + '__card-' + which + '__300dpi')
    ]);
  }
  console.log('rasterised', stem);
}
