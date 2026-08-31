# Notes for the agent

A static site with no build step: `index.html`, `style.css`, `app.js`, `data.js`.
Nothing is transpiled, nothing is minified, there are no runtime dependencies.
It opens both from `file://` and from GitHub Pages.

## Read the specs first

`docs/specs/` is the source of truth for behaviour, and it is written down so a
session does not have to reconstruct it. Read what the task touches before
touching it:

| File | What it settles |
|---|---|
| `docs/specs/CONTRACTS.md` | the frozen public surface: hash grammar, record ids, list link encoding, generated artefacts, asset paths |
| `docs/specs/ROUTES.md` | every route, and the filter segment grammar |
| `docs/specs/STATE.md` | URL vs localStorage, the storage keys, the two-tab merge |
| `docs/specs/FEATURES.md` | what the app does, and the state each feature needs |
| `docs/specs/COVERAGE.md` | what each suite is responsible for, and where coverage is thin |
| `docs/specs/I18N.md` | how two languages work here |
| `docs/specs/META.md` | policies that look like bugs and are not: `noindex`, robots, hash-only lists, `file://`, never inferring a tier |
| `docs/REFACTOR_PLAN.md` | the Svelte migration (issue #47) and the decisions taken during it |

**Public contracts default to no change.** If one has to change, the same commit
updates `docs/fixtures/`, `tests/contracts.js`, `docs/specs/CONTRACTS.md` and
`llms.txt`. `tests/contracts.js` replays the golden fixtures in
`docs/fixtures/` and will not let a format drift quietly.

**When behaviour changes, the spec changes in the same commit.** A spec that
lags the code is worse than no spec: the next session trusts it.

## Before every commit

```
npm run check
```

Format, lint, typecheck, data generation, `derived`, `i18n`, unit tests with
coverage thresholds. The Husky hook only tidies staged files; it does not
replace this. CI adds the build, the `file://` smoke check, the bundle budget,
the 20 puppeteer suites, `npm audit` and gitleaks.

Definition of done: `npm run check` passes, the new behaviour has a test, and
`docs/specs/*` matches what the code now does.

Coverage in `app/` is enforced per file, per directory, and it measures
everything that ships - see `docs/specs/COVERAGE.md`, "What is enforced". Two
consequences worth knowing before writing a component:

- A new file with no test fails the build, whether or not it has a test file of
  its own. Being driven through a parent counts; nothing is required to have a
  matching `*.test.ts`, and a test asserting that a button renders a button is
  worse than none.
- A component test ends with `expectNoA11yViolations` from `app/src/test/a11y.ts`.
  Accessibility is not a later pass here: the last one arrived as an external
  bug report with eight items in it.

Do not write a module, an export or a component before something calls it. The
bar exists because three unused things - a component, a helper, a slice of API -
were written ahead of need in one sitting, and unused code cannot be tested
honestly. The exception is logic read off the live app during the migration:
that is knowledge which would otherwise be re-derived wrongly, and it earns a
direct test instead.

## This is a refactor, not a redesign

**The site must not change how it looks.** Every screen in `app/` is a
reproduction of the one in `index.html` + `style.css`, down to widths, control
sizes, spacing and placement - not an interpretation of it that happens to use
the same palette.

That is a rule with a measurement behind it. `tests/parity.js` screenshots both
apps on the same route and compares them with pixelmatch. **The expected
difference is zero**: a route with no entry in `VISUAL_DEBT` fails on any
difference at all. An entry there is a debt, not a tolerance - it names what has
not been reproduced yet and why, and it fails in both directions, so a screen
that regresses is caught and a screen that improves forces the number down. A
diff image is written to `test-output/parity/` on every run.

Practically, when building a screen:

- open `style.css` and take the numbers from it. The container width, the size
  of a control, the gap between two things - all of it is already decided.
- if a value is worth naming, put it in `styles/tokens.css` **with the value the
  live app uses**, not a rounder one. The page heading is 680 at 23px because
  `.page-h` is, not because 700 at 24px looks similar.
- do not improve anything on the way past. A refactor that also tidies the
  spacing is a refactor nobody can review, and the pixel budget will reject it.

The one exception is an accessibility defect in the original - a contrast
failure, a control that cannot be reached by keyboard, a missing name. Fix it,
and record the deviation in `ACCEPTED` in `tests/parity/specs.js` with the
reason, so it is a decision on the record rather than a drift.

## Components

Shared components are **extracted on the second use, not designed in advance**,
and the two halves of that rule are equally load-bearing. A `Button` written
before any screen had one arrived with four variants and two sizes that nothing
rendered; it was deleted, and then the record page immediately wrote four raw
`<button>` elements with their own styles - which is the same mistake from the
other end. The rule that avoids both: write the markup inline the first time,
and the moment a second place wants it, extract it and delete both copies.

What *is* designed in advance is the vocabulary, not the components:
`styles/tokens.css` is the only global stylesheet and holds every colour,
spacing step, radius and type step. A component may compose tokens; it may not
invent a value. That is what keeps two independently written screens looking
like one app before anything has been extracted, and it makes the eventual
extraction mechanical rather than a redesign.

A variant is added to a shared component the first time a screen needs it - not
because the old app had one. Growing `Button` from one variant to four as the
screens arrive costs a few minutes each time; shipping four unused ones costs a
test suite that cannot honestly cover them.

Practically, when a slice adds a control that already exists elsewhere:

- put it in `app/src/components/`, name it for what it is rather than where it
  first appeared, and give it props for what actually differs
- move the styles with it and take them out of the caller, so there is one
  place the padding is decided
- the parent's test keeps covering it (see `COVERAGE.md`); a new test file is
  only worth writing when the component has behaviour of its own

Two things live side by side while the migration runs (`docs/REFACTOR_PLAN.md`):
the live site is `index.html` + `app.js` + `style.css` in the repository root,
and the new application is `app/`, built to `dist/`. Pages still serves the
root. Do not delete the old one before the cut-over, and do not point Pages at
`dist/` until Phase 6.

`app/src/lib` is pure logic: no DOM, no storage, no Svelte, no network. ESLint
enforces that, and it is what makes the modules testable without a browser.

## After editing data.js

```
node tools/build.js
```

This regenerates `data.json`, `catalog.csv` and the 1061 stubs in `i/*.html`.
`tests/derived.js` rebuilds them into memory and compares byte for byte, so a
skipped rebuild is caught by a test rather than by a user. Editing the stub
generator itself without rebuilding is caught in the same place.

Art in `img/` and previews in `og/` are outside the script: they are made from
the source PNGs (WebP 640x640, quality 82, method 6; JPEG 640x640, quality 90).
Identical bytes are never stored twice - a record simply points at another
record's file, and `tests/dataint.js` watches for that.

The record count is spelled out in `index.html` (meta descriptions), `README.md`,
`README.ru.md`, `app.js` (the search blurb), `llms.txt` and `robots.txt`.
`tests/derived.js`
finds every three-digit number next to its own word in those files and checks it
against data.js, so the numbers still have to be edited by hand - but a
forgotten place cannot slip through. The same suite pins the licence notice,
which has to appear verbatim in both READMEs, in `llms.txt` and in both footers.

`README.md` is English and is what GitHub shows; `README.ru.md` is the Russian
twin. They carry the same sections, so an edit to one belongs in the other.

## Tests

```
node tests/run-all.js              # all of them, in parallel
node tests/run-all.js eqtest,qa    # just these
node tests/run-all.js --jobs 1     # one at a time, for debugging
```

Twenty suites, most on puppeteer. `parity` needs `dist/` built first
(`npm run build`): it drives the rewrite and the live app through the same
script and reports every difference - see `docs/specs/COVERAGE.md`, "The
rewrite against the app it replaces". That suite, not a component test, is what
catches a control the port forgot.

The rest run in a pool as wide as the
machine, slowest first, and the summary keeps the order of the list in
`run-all.js` rather than the order they finished - so two runs read the same.
The page walk is registered four times, one per screen width, because on its
own it took as long as everything else together.

Browser suites wait on `ready(page)` from `tests/lib.js`, not on a fixed pause:
the page is ready once the app has drawn something into `#view`. Do not put a
`setTimeout` back after a `goto` - that is what used to make the set slow on a
fast machine and flaky on a slow one.

Every defect that gets fixed gets a test - that is a rule here, not a wish.

If puppeteer reports `Failed to launch the browser process` with
`libXdamage.so.1: cannot open shared object file`, the machine is missing one
7 kB library and nothing else - `ldd` on the bundled Chrome names it. Where
there is no root to install it, no root is needed:

```
mkdir -p /tmp/sysroot/dl && cd /tmp/sysroot/dl
apt-get download libxdamage1 && dpkg -x libxdamage1_*.deb /tmp/sysroot/root
export LD_LIBRARY_PATH=/tmp/sysroot/root/usr/lib/x86_64-linux-gnu
```

All sixteen browser suites and `tools/smoke-file-url.mjs` then run. Do not
conclude the browser suites are unrunnable without checking `ldd` first: the
whole set was skipped once on the strength of a launch error that turned out to
be a single missing file.

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
- **Source code is English.** Comments, identifiers, test names and test failure
  messages - all of it, in every file, new or old. Do not add a Russian comment
  to a file that already has them; write the new one in English.
- The one exception is the product's own text, because it has to be Russian to
  work: the `T` dictionary and the record text in `data.js`. That is content,
  not source prose.
- No non-ASCII characters outside that content; a hyphen rather than an em dash.
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
