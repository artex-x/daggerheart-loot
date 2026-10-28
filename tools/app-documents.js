/*
  The site's record and English-root documents: the built app document with each
  path's own card fields (docs/specs/CONTRACTS.md section 5). A crawler reads the
  card from the head; a person's browser runs the app at the same URL; a record's
  document also carries its readable text in a <noscript> block. The old
  host's mirror publishes the redirect pages of tools/build-share-pages.js under
  the same paths instead.

  Called by vite.config.mts after `vite build`, on the built index.html.
*/
const fs = require('fs');
const path = require('path');

const { appDocument } = require('./share-card.mjs');
const { headOf, bodyOf, rootHead, records } = require('./build-share-pages.js');

/** Returns a Map of every document path under the output folder to its text:
 *  `i/<id>.html` and `i/en/<id>.html` for each record, and `en/index.html`. */
function documentsOf(shell) {
  const out = new Map();
  for (const it of records()) {
    for (const [dir, lang] of [
      ['i/', 'ru'],
      ['i/en/', 'en']
    ])
      out.set(
        dir + it.id + '.html',
        appDocument(shell, headOf(it, lang), lang, bodyOf(it, lang))
      );
  }
  out.set('en/index.html', appDocument(shell, rootHead(), 'en'));
  return out;
}

/** Writes the documents of `<outDir>/index.html` under `outDir`. */
function writeAppDocuments(outDir) {
  const shell = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  const docs = documentsOf(shell);
  const want = 2 * records().length + 1;
  if (docs.size !== want)
    throw new Error(
      'The app documents number ' +
        docs.size +
        ', not ' +
        want +
        '. Check the record ids in data.js'
    );
  for (const [rel, text] of docs) {
    const file = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text, 'utf8');
  }
  return docs.size;
}

module.exports = { documentsOf, writeAppDocuments };
