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
node tests/run-all.js              # all of them, in parallel
node tests/run-all.js eqtest,qa    # just these
node tests/run-all.js --jobs 1     # one at a time, for debugging
```

Seventeen-odd suites, most on puppeteer. They run in a pool as wide as the
machine, slowest first, and the summary keeps the order of the list in
`run-all.js` rather than the order they finished - so two runs read the same.
The page walk is registered four times, one per screen width, because on its
own it took as long as everything else together.

Browser suites wait on `ready(page)` from `tests/lib.js`, not on a fixed pause:
the page is ready once the app has drawn something into `#view`. Do not put a
`setTimeout` back after a `goto` - that is what used to make the set slow on a
fast machine and flaky on a slow one.

Every defect that gets fixed gets a test - that is a rule here, not a wish.

## Printing (`#/print/<ids>`)

Nine cards to an A4 sheet, 63x88 mm each - the size of a playing card. The card
follows the printable equipment card from the project's Figma file, and the
pieces that cannot be redrawn by eye - the tier banner, the burden hands, the
armour shield, the dice, the ribbon around the stat strip - are the exported
vectors themselves, in `card/`. Every one has a `-bw` twin with a white fill and
a dark outline for the black-and-white sheet, and the dice come in a physical
(gold) and a magic (blue) colour, as they do in the design.

Two modes, and they are two different cards rather than one with a switch: the
colour sheet keeps the photo and hangs the banner and the hands over it, the
black-and-white one drops the photo entirely and collects the banner, the type
chip and the mark into a row above the name.

`fitPrintCards()` runs after render because only the browser knows what fits:
the rules text steps its font down, then the top padding, and the stat values
step down separately. Widths there are measured with a `Range` - a value cut by
`text-overflow` reports the same `scrollWidth` as its box, so overflow is
invisible to the usual check.

Versatile weapons carry a second stat line in `eq.alt`, parsed once out of the
property text and pinned by name in `tests/derived.js`. It prints as a second
strip rather than a sentence.

## Working from an issue or from the design

Open the issue and **look at its screenshots** before touching anything. The
title names a symptom, and the same words fit several components: "fix price
display tooltip" was read as the hint beside a price field and was in fact the
help panel above the whole list. One glance at the picture settles it; an hour
was spent fixing the wrong element for want of that glance.

The same goes for the design. The file is
`88Hhc89oY9Orcbvd2ok1Hx` - node `714-42387` for the colour cards, `3773-90792`
for the black-and-white ones. Compare against it rather than reasoning about it,
and take the geometry and the palette from there rather than from memory:
guessing produced a shield from the wrong control once already.

Assets come out of the design file itself. The Figma MCP runs out of calls
quickly, so the working route is the browser: open the file, select the node,
right-click, Copy/Paste as, Copy as SVG, and read the clipboard. One trap - a
copied path is a filled outline, so internal edges of a vector network (the
finger slots in the burden hands) are silently dropped and the shape arrives as
a mitten. When that happens, the node has to be exported from Figma properly
rather than redrawn by eye.

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
- Never infer a tier from the stats. Damage bands for adjacent tiers overlap; a
  guess trained on the Core tables misses one row in seven of its own, and four
  out of seven on a third-party book. Every piece of equipment now carries a
  tier taken from a book: Wondrous does not print one beside the item, but its
  "Loot items by environment" table binds each piece to a location, and the
  location has a tier. `tests/derived.js` pins those eleven tiers by name, so a
  silent drift is caught.
