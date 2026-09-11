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

Use [`docs/parity.md`](../parity.md) for the operational loop. Current migration
status and debt belong in `issues/47/plan.md` and `issues/47/handoff.md`.

Every spec in `tests/parity/specs.js` observes a **state** - the controls on it,
what a button puts on the clipboard, the label on the roll button, the title of
the document - and returns what it saw. The harness runs each spec twice,
against `index.html` at the root and against the built `dist/`, and compares.
**Nothing is written down as the expected value: the live app is the
expectation**, re-read on every run, so it cannot go stale.

A state is a route plus what was pressed to reach it (`STATES` in the same
file), and every state is compared **in both languages at three widths** -
`LANGS` × `WIDTHS`, so the id a debt is keyed by is `"<id> @ <lang> <width>"`.
Routes alone were not enough: they only ever reach the first paint, in the
default language, at one width, above the fold.

What that has found so far: a modal four times too wide with none of the card's
buttons; an English tab reading "Core rules" where the live app says "Standard
rules"; two English subtitles and *every* English help paragraph rewritten
rather than copied; a Russian document title that had drifted; a wordmark being
translated to "Loot" when the live app never translates it; the pin toggle not
renaming itself when it is on; and focus moved into a field whose outline is
suppressed instead of left on the stepper.

Two of those came from pressing something for the first time, which is what the
coverage line at the end of a run is for: it counts the control names the run
pressed against the names it merely saw. A control nobody presses is compared
as a name in a list and in no other way. Not all of them can be states - the
roll button is random, and the live app's randomness cannot be seeded from the
harness - but the number is the honest measure of how much of the app the
states actually exercise.

The two targets are separate files and never clash. `dist/` has to be built
first; without it the suite says so and stops.

Three kinds of finding:

- **a difference** fails the run, and names the state, the spec and the field
- **outstanding** is a state the rewrite has not reached, or a difference listed
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

Five conditions the harness controls, each of which had produced a false
reading before it did: every state is opened from a fresh document, because a
hash-only navigation keeps the previous state's variables; the screenshot waits
for the artwork, because `loading="lazy"` keeps images out of `networkidle0` and
a blank card scores five percent; and a press waits on `document.getAnimations()`
rather than a timer, because the modal animates in one app and not the other.
The screenshot is also taken before the clipboard specs press anything - the
live app raises a toast after a copy, and taking the picture afterwards was
quietly inflating the debt on both record routes by about seven tenths of a
percent. A `timed` state is arrived at afresh at every width rather than swept
on one page, because a width sweep photographs a fading toast at whatever
distance from the press host load happened to leave it. A full-page capture is
retaken until two in a row agree, because `page.screenshot({ fullPage: true })`
can hand back a raster that has not finished, geometry unchanged and pixels
swinging by several percent on an unchanged build.

### The look

Three instruments, because they answer different questions.

**Measured** - typography and colour of the landmarks both apps certainly share,
compared strictly. These name something to go and change: "the heading is 800 at
24px and was 680 at 23px" is a fix, where "40% of pixels differ" is not.
Position and size are not measured this way: two layouts mid-port disagree about
them by definition, and a metric that always differs teaches everyone to ignore
the report.

**A per-control probe** (`driver.js`'s `typeAt`, `specs.js`'s `typeRuns`) -
computed type, text content and a measured text advance for a handful of named
controls, run at every width rather than once. It exists because a whole-page
percentage cannot see a control-sized defect: a wrong font-size on one line of
a 1100x900 screen scores about 0.09%, under `JITTER`, so the pixel diff below
reported the state as matching while three real defects sat inside it (B3.6).
This is where geometry *is* measured, as the exception to the paragraph above:
on a named handful of controls, on screens that are already built, where a
width is the consequence of a rule that was ported wrong rather than of a
layout that has not settled yet.

**A pixel diff, against zero.** `pixelmatch` compares the two screenshots and
writes a diff image next to them in `test-output/parity/`. The expectation is
that a state matches exactly: a state with no entry in `VISUAL_DEBT` fails on
any difference at all.

An entry in `VISUAL_DEBT` is a debt rather than a tolerance. It records what has
not been reproduced yet, with the reason, and it is enforced from both sides:

- the screen drifts worse than the number - it regressed, and the run fails
- the screen gets better than the number - the run fails too, asking for the
  number to come down
- the screen reaches `JITTER` or below - the run fails too, asking for the
  entry to be deleted rather than left to sit inside `DEBT_SLACK` unnoticed

So it can only ratchet towards zero, and the slice that finishes a screen
deletes its entry. `JITTER` is a tenth of a percent for machine-to-machine text
rendering; pixelmatch already discards antialiasing, so a real difference is
worth whole percents rather than hundredths.

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
| `search.test.ts`, `lib/lists.test.ts`, `roll.test.ts` | stated behaviour |
| `state/lists.test.ts` | the live app's own list-store rules - `loadLists`..`storageWorks` and `createList` (app.js 1149-1330): the v1-to-v2 migration runs once and leaves v1 alone, a save merges with whatever another tab wrote, a refused write keeps the session working |
| `components/lists.test.ts` | the add-to-list row itself - `listMenuHTML`/`addToListBtn` and `listMemberFor(item)`'s live behaviour: the button, the menu, a chip's tick, the new-list form, and the toast each raises |
| `components/tables.test.ts` | the plain table's own behaviour - chip nav, the toolbar, selection, sectioned bodies, the row/section anchor - and, off `renderSelBar` (app.js 3706-3721), the selection bar it raises once a row is ticked: the count, the cross, its own add-to-list menu, and copying the whole selection |
| `filters.test.ts` | the facet grammar both ways, and the predicate and counters the panel is built from |
| `ports/ports.test.ts` | every way the browser says no: storage that throws, a page outside a secure context, a missing compressor, a dismissed share; and the hash router against a fake window |
| `state/app.test.ts` | settings read as untrusted data, which address may be pinned, a refused write, what an old section name sets, the storage notice's own dismissal flag, a packed address expanded through the compress port, and where it lands when the port cannot |
| `components/shell.test.ts` | the frame: labels a screen reader needs, the language switch and what it redraws, which tab is lit, the address on the way in, and axe on three states |
| `components/listsPage.test.ts` | `#/lists` - off `renderLists`/`storageWarning`/`listCardHTML` and the create/share/delete/restore handlers (app.js 2865-2931, 4136-4270): the head and its help, the storage notice (`StorageNotice.svelte`, extracted on its second use in B5.4) in both live forms, a card per list with a known-record badge and its actions, and `noData` |
| `components/listPage.test.ts` | `#/lists/<id>` and `#/l/<own payload>` - off `renderOneList` and everything it draws (app.js 2933-3128, the address at 1537-1607, the handlers at 3944-4571): the address rewrite and its address-only edge cases, the title input and the actions row, the storage notice, the money picker and its help, the list note, the roll panel (folded/absent/rolled/reset), select-all, a row's position/qty/gold/note/remove with undo, copying and sharing, deleting, a row's own modal, the drag port's `onDrop`, `noData`, and the branch into the shared page (drawn for a payload that is nobody's, nothing drawn while a packed address expands, the bad-link page when the port cannot expand one) |
| `components/sharedListPage.test.ts` | `#/l/<payload>` for a payload that is nobody's own list - off `renderSharedList` (app.js 3130-3170): the heading and the one-text-node sub, the add-to-list control and taking the whole list into a new one or an existing one (with its qty/gold/note, never the GM's own note), both list hitnotes and each entry's own after its row, the tails (`×qty`, `×qty · price`, bare price, coin mode), selection and the bar it raises, a row's own modal, the bad-link page, and English |
| `components/searchPage.test.ts` | `#/search` - off `renderSearch`, `kindChips` and the `#sq`/kind handlers (app.js 2841-2859, 2114-2132, 4160-4164, 4333): the head with no help button, the box focused on arrival, both languages at once, the assembled stat line, the 300 cap, the kind filter narrowing and refusing its last chip, equipment obeying the equipment chip regardless of its own `kind`, the filter shared with the roll pages, selection, a row's own modal, `noData`, and English |

The browser adapters' happy paths are the one thing these cannot reach - a real
clipboard write, a real share sheet - because jsdom has neither. That is what
the e2e layer in Phase 5 is for; the fallbacks, which is where the logic
actually lives, are covered here.

`tools/tg-preview/lib.test.mjs` is a separate suite again, run under
`node --test` as its own step in `npm run check` rather than through vitest:
it covers the Telegram preview refresher's pure logic (URL derivation,
fingerprinting, what counts as stale, batching, the flood/fatal error table,
button matching, and the two-phase send-and-press loop against a fake
client, clock and live check). The real Telegram connection (`client.mjs`)
and the real CDN fetch (`live.mjs`) are deliberately outside it - thin
wrappers around a live network, where the only honest proof is Telegram and
the CDN themselves. See `docs/tg-preview.md`.

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
- `tests/parity.js` compares behaviour and screenshots only for registered
  states the rewrite has reached. Missing states remain invisible, so each new
  interaction surface must be registered in `STATES` in the same change.
- A native `<dialog>` cannot be opened in jsdom - there is no `showModal` - so
  `app/vitest-setup.ts` shims presence and open/closed. The focus trap, Escape
  and the page behind going inert are the browser's, and are checked in one:
  `flows` today, `parity` and the Phase 5 e2e layer as they grow.
