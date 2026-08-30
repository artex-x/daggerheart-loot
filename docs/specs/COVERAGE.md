# Coverage matrix

What the 19 suites in `tests/` actually assert, mapped onto the features in
`FEATURES.md`. Update this file whenever the shape of the coverage changes -
adding a suite, moving what a suite is responsible for, or filling a gap.

Run: `node tests/run-all.js`, or one suite by name. Every suite's full output is
written to `test-output/<name>.log` whatever the result; the summary only prints
the first dozen failing lines. CI uploads that directory when a job fails.

## Suites

| Suite | Kind | Responsible for |
|---|---|---|
| `dataint` | data | ids, numbering, required fields, cross-references, equipment fields, text hygiene, image and stub files |
| `derived` | data | `data.json` / `catalog.csv` / `i/*.html` rebuilt and compared byte for byte; counts spelled out in six files; the licence notice; die vectors; per-source pins (Dread, Vault of Ages, frames, equipment) |
| `contracts` | contract | golden fixtures: list encode and decode, both link variants, truncation, hash grammar for 26 route shapes, the equipment stat line in both languages, filter group key names against the docs |
| `i18n` | source | dictionary parity in both directions, and no key the code asks for that is missing |
| `craft` | feature | upgrade chains: data, rendering, copying, stubs |
| `notes` | feature | two notes: writing, copying, both links, migrating a v1 list, a v1 link, note field height |
| `lists2` | feature | list page: reorder, position entry, list search, storage warning, batch actions, upgrade steps, price modes, price suggestion, empty roll field, taking a shared list, per-list roll, kind filter |
| `select` | feature | selection, batch add and copy, select all, reset on navigation, card and modal |
| `flows` | feature | modal, list address, clipboard, copying a whole roll |
| `eqtest` | feature | equipment: class, order, filters, filter links, anchors, colours, copying, all sources |
| `print` | feature | sheet grid, card size against the design, versatile weapons, dice by damage type, armour, black and white, art edges, text fitting, entry points |
| `noart` | feature | records without artwork, and artwork that fails to load |
| `behave` | journey | rolls, search, language, remembered and corrupt settings, starting section, navigation, copy and share, storage disabled |
| `qa` | regression | one case per defect from an external report: caret, focus, live regions, contrast, truncated link, two tabs, previews, keyboard |
| `states` | journey | states reachable only by clicking |
| `audit2` | sweep | every address, at four widths, in both languages |
| `craftmob` | layout | narrow screens, touch highlight, selection bar overflow |
| `typo` | layout | two fonts and one size scale, every page, both languages |
| `hues` | layout | badges that can share a list are told apart by hue |

## Features to suites

| Feature | Covered by |
|---|---|
| Six roll modes | `behave`, `audit2`, `lists2` (empty field) |
| Source switch, cannot be emptied | `behave`, `contracts` (legacy routes set it) |
| Crit jump to the table | `qa`, `audit2` |
| Tables, list/grid, search | `behave`, `eqtest`, `audit2` |
| Filter panel, pills, reset, link | `eqtest`, `contracts` |
| Filter group key names | `contracts` |
| Anchors | `eqtest`, `contracts` |
| Lists: create, reorder, remove, undo | `lists2`, `qa` |
| Add to list, menu, search from the eighth | `select`, `lists2` |
| Quantity, price, price modes, batch prices | `lists2` |
| Two notes | `notes`, `contracts` |
| List link, checksum, short link | `contracts`, `lists2`, `notes`, `qa` |
| Two tabs merge | `qa` |
| v1 storage and v1 links migrate | `notes` |
| Record card, modal, copy, share, image | `flows`, `select`, `noart` |
| Craft chains, referenced cards | `craft` |
| Print | `print` |
| Language switch | `behave`, `i18n`, `audit2`, `typo` |
| Starting section | `behave` |
| Storage unavailable | `behave`, `lists2` |
| `noindex`, robots | `derived` |
| Data generation | `derived`, `dataint` |
| `file://` | every browser suite loads the app from `file://` |

## The unit suite

`npm run test` runs the ported modules in `app/src/lib` and `app/src/ports`, and
the components, under vitest with coverage thresholds. It is a separate pyramid
from the nineteen browser suites and does not replace them: those test the app
people use, these test the one that will replace it.

| File | Held to |
|---|---|
| `listLink.test.ts` | `docs/fixtures/lists/*.json` |
| `hash.test.ts` | `docs/fixtures/urls/routes.json` |
| `i18n.test.ts` | `docs/fixtures/statlines/equipment.json` |
| `data.test.ts` | the real `data.json`, and the counts the README publishes |
| `money.test.ts` | the worked examples in the app's own help panel |
| `search.test.ts`, `lists.test.ts`, `roll.test.ts` | stated behaviour |
| `ports/ports.test.ts` | every way the browser says no: storage that throws, a page outside a secure context, a missing compressor, a dismissed share |
| `components/shell.test.ts` | the frame: labels a screen reader needs, the language switch and what it redraws, which tab is lit, the address on the way in, a browser that refuses storage |

The browser adapters' happy paths are the one thing these cannot reach - a real
clipboard write, a real share sheet - because jsdom has neither. That is what
the e2e layer in Phase 5 is for; the fallbacks, which is where the logic
actually lives, are covered here.

Three of those fixtures are replayed by `contracts` as well, against the live
app. That is what makes them evidence rather than a record of what the new code
happens to do.

## Gaps closed in Phase 0

- **Filter group key names had no test at all.** `llms.txt` documented `rg` and
  `bu`; the code expects `range` and `burden`. A link built from the
  documentation returned the whole table, unfiltered and unmarked. `contracts`
  now probes every documented group on a real table and fails if the group does
  not narrow anything, and fails again if the wrong names reappear in
  `llms.txt`.
- **The list codec had no fixture on disk.** It was covered only by tests that
  encode and decode with the same code, which cannot catch a change of format -
  only a change of behaviour. `docs/fixtures/lists/*.json` now hold the raw
  string and payload for both link variants of six lists, and `contracts`
  re-derives base64url and the checksum with its own implementation.
- **Route resolution had no fixture either.** `audit2` walks addresses to check
  they render, not that they resolve to the state they used to.
  `docs/fixtures/urls/routes.json` pins 26 shapes, including the three legacy
  section names and the source switch each one sets.
- **`robots.txt` was not in the count check** and still advertised 830 records.
  It is now checked with the other five files.

## Known thin spots

Not blocking, recorded so they are not mistaken for coverage:

- The short (`~`, deflate) link form is exercised by `lists2` and `notes`
  through the share buttons, but has no golden fixture, because deflate output
  is not guaranteed byte-stable across browser versions. The contract that is
  pinned is the plain form plus "compressed is expanded to plain on open".
- Print fitting is measured, not compared to a reference image. `print` checks
  geometry against the design's numbers and one pixel property (the art edge);
  it would not catch a purely cosmetic regression elsewhere on the card.
- `states` walks click-only states but does not assert much about them beyond
  "did not throw and rendered something".
- Touch-only behaviour is checked statically in `craftmob`: headless Chrome
  reports `hover: none` and will not emulate the `hover` media feature, so the
  `@media (hover:hover)` branch cannot be rendered in a test.
