# Coverage matrix

What the 20 suites in `tests/` actually assert, mapped onto the features in
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
| `parity` | migration | the rewrite against the live app: the same script on both, differences reported |
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

## The rewrite against the app it replaces

`tests/parity.js` is the answer to "is anything missing from the port?", and it
answers it without anybody having to remember what the old screen did.

Every spec in `tests/parity/specs.js` observes a route - the controls on it,
what a button puts on the clipboard, the label on the roll button - and returns
what it saw. The harness runs each spec twice, against `index.html` at the root
and against the built `dist/`, and compares. **Nothing is written down as the
expected value: the live app is the expectation**, re-read on every run, so it
cannot go stale.

The two targets are separate files and never clash. `dist/` has to be built
first; without it the suite says so and stops.

Three kinds of finding:

- **a difference** fails the run, and names the route, the spec and the field
- **outstanding** is a route the rewrite has not reached, or a difference listed
  in `ACCEPTED` with a reason - printed on every run so the list stays visible
- **stale** is an `ACCEPTED` entry that is no longer a difference. It fails, so
  an excuse has to be deleted by the slice that makes it untrue

It found four things on its first run, all of which a component test had missed
because a component test only checks what somebody remembered to write:

- the record page had no **copy image** button at all
- **send** was hidden when the browser had no share sheet; the live app shows it
  and falls back to copying the link
- the roll label used a hyphen where the live app prints an en dash
- the card's metadata line and the page footer were missing, which is now
  written down as outstanding rather than unnoticed

This is also where the canvas conversion behind `ImagePort` is exercised: it
cannot run in jsdom, and here it runs in a real Chrome on both apps.

### The look

Two instruments, because they answer different questions.

**Measured** - typography and colour of the landmarks both apps certainly share,
compared strictly. These name something to go and change: "the heading is 800 at
24px and was 680 at 23px" is a fix, where "40% of pixels differ" is not.
Position and size are deliberately *not* measured: two layouts mid-port disagree
about them by definition, and a metric that always differs teaches everyone to
ignore the report.

**A pixel diff, against zero.** `pixelmatch` compares the two screenshots and
writes a diff image next to them in `test-output/parity/`. The expectation is
that a route matches exactly: a route with no entry in `VISUAL_DEBT` fails on
any difference at all.

An entry in `VISUAL_DEBT` is a debt rather than a tolerance. It records what has
not been reproduced yet, with the reason, and it is enforced from both sides:

- the screen drifts worse than the number - it regressed, and the run fails
- the screen gets better than the number - the run fails too, asking for the
  number to come down

So it can only ratchet towards zero, and the slice that finishes a screen
deletes its entry. `JITTER` is a tenth of a percent for machine-to-machine text
rendering; pixelmatch already discards antialiasing, so a real difference is
worth whole percents rather than hundredths.

What is owed today: the record card's internals - the metadata line, the badges
over the art, the action row - and, on the roll pages, the intro text, the help
panel and the footer. The palette, the font, the page heading and the container
geometry already match exactly.

## What is enforced, and by what

Coverage here is a build failure, not a report somebody reads. Five things
enforce it, and they catch different mistakes:

| Layer | Catches | Where |
|---|---|---|
| Coverage `include` covers everything that ships | a whole directory left out of the measurement | `vite.config.mts` |
| Per-file thresholds (`perFile: true`) | a file with no test, hidden behind a well covered neighbour | `vite.config.mts` |
| Thresholds set per directory | lib's numbers paying for a component's | `vite.config.mts` |
| `expectNoA11yViolations` in every component test | markup a screen reader cannot follow | `app/src/test/a11y.ts` |
| Layer rules in ESLint | logic that reaches for the DOM and stops being testable | `eslint.config.mjs` |

The bars differ because the obligations do. `src/lib` is pure and has no
excuse: 90 lines, 90 functions, 85 branches. `src/ports` wraps browser APIs
whose success paths jsdom cannot run at all, so it sits at 70/70/55 and the
difference is covered by the browser suites and, from Phase 5, by e2e.
Components and state are at 85 and 90.

**A per-file rule is not a per-file *test* rule.** Nothing requires a
`Foo.test.ts` beside every `Foo.svelte`, and a rule that did would be answered
with tests asserting that a button renders a button. What is required is that
every file is *reached* by some test - `perFile` fails at 0% whether the file
has a test of its own or is exercised through a parent. `TabBar` and
`LangSwitch` have no test files and are at 100% because `shell.test.ts` drives
them through `App`. That is the intended shape.

What this found the day it was turned on, all of it invisible to the previous
global number:

- Components, state and `App.svelte` were **outside the measurement entirely**.
  The reported 88% described `src/lib` and `src/ports` and nothing else.
- `filters.ts` had **no test file**, only incidental coverage through
  `hash.test.ts`. Decoding was covered; `groupIsAny`, `groupHits` and
  `chosenCount` - which are what the filter panel is built out of - were not.
- Five of the ten writers in `hash.ts` had **no test at all**. The parser was
  held to fixtures; the functions that produce the links were not.
- `hashRouter` was written to take an injectable window so it could be tested
  without a browser, and then was not tested.
- Three things existed with **no caller**: a `Button.svelte`, a `statLabels`
  helper, and the pin-the-start-section API on `AppState`. The first two were
  deleted - markup is written when a screen needs it. The third was kept and
  given `app.test.ts`, because it encodes rules read off the live app that
  would otherwise be re-derived, differently, by whoever writes that screen.

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
| `filters.test.ts` | the facet grammar both ways, and the predicate and counters the panel is built from |
| `ports/ports.test.ts` | every way the browser says no: storage that throws, a page outside a secure context, a missing compressor, a dismissed share; and the hash router against a fake window |
| `state/app.test.ts` | settings read as untrusted data, which address may be pinned, a refused write, what an old section name sets |
| `components/shell.test.ts` | the frame: labels a screen reader needs, the language switch and what it redraws, which tab is lit, the address on the way in, a browser that refuses storage, and axe on three states |

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
- The success paths of `clipboard`, `share` and `compress` cannot run in jsdom:
  there is no real clipboard, no share sheet and no `CompressionStream`. Their
  fallbacks - where the logic is - are covered; the happy paths are why the
  `src/ports/**` bar is lower than the others, and they wait for Phase 5.
- Colour contrast is switched off in the axe pass, because jsdom lays nothing
  out and resolves no cascade. Contrast stays a real measurement in `qa` and
  `typo`, on a real page.
- `tests/parity.js` drives the built bundle, but only on the routes the rewrite
  has reached, and it compares behaviour rather than appearance. Nothing
  compares the two apps pixel for pixel yet.
- A native `<dialog>` cannot be opened in jsdom - there is no `showModal` - so
  `app/vitest-setup.ts` shims presence and open/closed. The focus trap, Escape
  and the page behind going inert are the browser's, and are checked in one:
  `flows` today, `parity` and the Phase 5 e2e layer as they grow.
