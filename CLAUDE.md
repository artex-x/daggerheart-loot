# Notes for the agent

A static site with no build step: `index.html`, `style.css`, `app.js`, `data.js`.
Nothing is transpiled, nothing is minified, there are no runtime dependencies.
It opens both from `file://` and from GitHub Pages.

## After editing data.js

```
node tools/build.js
```

This regenerates `data.json`, `catalog.csv` and the 859 stubs in `i/*.html`.
`tests/derived.js` rebuilds them into memory and compares byte for byte, so a
skipped rebuild is caught by a test rather than by a user. Editing the stub
generator itself without rebuilding is caught in the same place.

Art in `img/` and previews in `og/` are outside the script: they are made from
the source PNGs (WebP 640x640, quality 82, method 6; JPEG 640x640, quality 90).
Identical bytes are never stored twice - a record simply points at another
record's file, and `tests/dataint.js` watches for that.

The record count is spelled out in `index.html` (meta descriptions), `README.md`,
`app.js` (the search blurb) and `llms.txt`. `tests/derived.js` finds every
three-digit number next to its own word in those files and checks it against
data.js, so the numbers still have to be edited by hand - but a forgotten place
cannot slip through.

## Tests

```
node tests/run-all.js
```

Seventeen-odd suites, some on puppeteer. Every defect that gets fixed gets a
test - that is a rule here, not a wish.

## Conventions

- Comments explain **why**, not what the line does.
- Interface text and test messages are in Russian; English only in code
  comments.
- No non-ASCII characters outside Russian text; a hyphen rather than an em dash.
- `git push` is the repository owner's job, not the agent's. Commits are
  authored by `artex-x <artex-x@users.noreply.github.com>`.
- Lists live in the link, not on a server. The link format is documented in
  `llms.txt` and verified by a separate implementation in `tests/lists2.js` - if
  the format changes, both places need editing.
- `llms.txt` and `robots.txt` are in English: models read them, and it is
  cheaper that way.
- The site is kept out of search results by a `noindex` tag on every page. Do
  not close crawling in `robots.txt`: a blocked page gets listed as a bare URL
  without the tag ever being read, and messenger previews break.
- Do not invent a tier for equipment that has none. Damage bands for adjacent
  tiers overlap; a guess trained on the Core tables misses one row in seven of
  its own, and four out of seven on a third-party book. The card leaves the tier
  out instead, and the source chip says where the entry came from.
