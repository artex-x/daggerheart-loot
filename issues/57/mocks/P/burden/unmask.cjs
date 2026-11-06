/* Rewrites each Figma outside-stroke mask (a white rect minus the shape) as the same region
   in a clipPath: the rect and the shape in one even-odd path. node unmask.cjs <in> <out> */
const fs = require('fs');
const [IN, OUT] = process.argv.slice(2);
let s = fs.readFileSync(IN, 'utf8');
const defs = {};
for (const m of s.matchAll(/<path id="([^"]+)" d="([^"]+)"\/>/g)) defs[m[1]] = m[2];
let n = 0;
s = s.replace(
  /<mask id="([^"]+)" maskUnits="userSpaceOnUse" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)" fill="black">\n<rect fill="white" x="[^"]+" y="[^"]+" width="[^"]+" height="[^"]+"\/>\n<use xlink:href="#([^"]+)"\/>\n<\/mask>/g,
  (_, id, x, y, w, h, ref) => {
    if (!defs[ref]) throw new Error('no path ' + ref);
    n++;
    return `<clipPath id="${id}" clipPathUnits="userSpaceOnUse">\n<path clip-rule="evenodd" d="M${x} ${y}H${+x + +w}V${+y + +h}H${x}Z ${defs[ref]}"/>\n</clipPath>`;
  }
);
s = s.replace(/ mask="url\(#([^)]+)\)"/g, ' clip-path="url(#$1)"');
if (/<mask/.test(s)) throw new Error('a mask is left in ' + IN);
fs.writeFileSync(OUT, s);
console.log(IN, n, 'masks');
