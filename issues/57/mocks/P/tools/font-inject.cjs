/* Injects the Source Sans Pro stand-in faces (C:\Users\Ignat\.dhloot\notes\57\fonts) as the
   print card's --ui, for the font trial of the print audit. */
const fs = require('fs');
const DIR = 'C:/Users/Ignat/.dhloot/notes/57/fonts/';
const faces = [
  ['SourceSansPro-Regular.ttf', 400],
  ['SourceSansPro-SemiBold.ttf', 600],
  ['SourceSansPro-Bold.ttf', 700],
  ['SourceSansPro-Black.ttf', 900]
];
const css =
  faces
    .map(
      ([f, w]) =>
        `@font-face{font-family:'SSP trial';font-weight:${w};font-style:normal;src:url(data:font/ttf;base64,${fs
          .readFileSync(DIR + f)
          .toString('base64')}) format('truetype')}`
    )
    .join('\n') + "\n.pcard{--ui:'SSP trial',sans-serif}";
module.exports = async function inject(page) {
  await page.addStyleTag({ content: css });
  await page.evaluate(async () => {
    for (const w of [400, 600, 700, 900])
      await document.fonts.load(`${w} 12px 'SSP trial'`, 'Аa');
    await document.fonts.ready;
  });
};
