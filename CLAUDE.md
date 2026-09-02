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
coverage thresholds. CI adds the build, the `file://` smoke check, the bundle
budget, the 20 puppeteer suites, `npm audit` and gitleaks.

**Nothing enforces this locally.** There was a pre-commit hook and it was
removed - it ran `eslint --fix` over the staged files, which cost over 150
seconds for three of them on a mounted working copy, so it was bypassed with
`--no-verify` the first time it got in the way. It also only ever ran a subset
of `npm run check`. Running the full gate before the commit is now a rule
rather than a mechanism, and CI is the backstop; if the run cannot be finished
for some reason, say so in the response rather than committing quietly.

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
apps in the same **state** and compares them with pixelmatch. **The expected
difference is zero**: a state with no entry in `VISUAL_DEBT` fails on any
difference at all. An entry there is a debt, not a tolerance - it names what has
not been reproduced yet and why, and it fails in both directions, so a screen
that regresses is caught and a screen that improves forces the number down. A
diff image is written to `test-output/parity/` on every run.

### A state, not a route

A state is a URL plus whatever was pressed to get somewhere, and that
distinction is the whole point. Comparing routes only ever reaches the first
paint, in the default language, at one width, above the fold - so the modal
shipped four times too wide, with none of the card's buttons, and every check
was green. No route draws it.

**A slice is not finished until its states are in `STATES`.** Building a screen,
or adding a way to get to one, means adding the states it introduces to
`tests/parity/specs.js` in the same change - not afterwards, and not "once it
settles down". This is the rule the modal was shipped against and broke: it was
a screen nobody could reach from a URL, so nothing compared it, and it sat four
times too wide with none of the card's buttons while every check stayed green.
A slice that adds a panel, a dialog, a picker, a filter bar or an empty state
owes a state for each. If the state cannot pass yet, it still goes in -
`pending` for a screen the rewrite has not reached, an entry in `VISUAL_DEBT`
with the reason for one that is drawn but not yet right. Both are visible on
every run; a state that is absent is invisible forever.

Each carries `id` (`"<route> ~ <what>"`), `route`, and any of `enter` (what to
press, by the name a person reads), `whole` (the page end to end rather than
the fold), `pending`.

### The matrix, and what it is for

**Every state is compared in both languages at three widths.** The harness
multiplies `STATES` by `LANGS` and `WIDTHS`, so a state written for one reason
is checked for five more and the key in `VISUAL_DEBT` is the full
`"<id> @ <lang> <width>"`. Nobody has to remember the English case or the phone
case, which is exactly the pair nobody used to get round to: the English tab
read "Core rules" for weeks, and every English help paragraph turned out to
have been rewritten rather than copied.

That costs a full run several minutes, so use the filter while working - the
argument is a substring of the expanded id, and `node tests/parity.js "voa @ en"`
or `"@ ru 375"` both select what they look like they select.

The widths are style.css's breakpoints rather than three round numbers: 1100 is
above all of them, 768 sits between the 900 and 640 rules, 375 is under 430.
Adding a fourth is one line and 33% more run time; adding a language is one
line and a set of names in `NAME`, which is where a spec looks up the button it
grips. A spec that grips a Russian literal passes vacuously in English -
`recordActions` used `has`, reported every button missing on *both* apps, and
agreed with itself.

### What the run measures about itself

The last thing a run prints is how many control names it pressed and how many
it only saw. **A control nobody presses is compared as a name in a list and in
no other way**, so whatever it does is unported until something presses it -
that number is the honest measure of coverage, and it is meant to come down as
slices land. Pressing the pin toggle for the first time immediately found that
the live app renames the button when it is on and the port did not; pressing
the stepper found focus being moved into a field whose outline is suppressed.

Not every control can become a state. The roll button is random and the live
app's randomness cannot be seeded from here, so what it produces cannot be
compared - only that the shape around it is the same. Say so rather than
faking determinism.

The same applies to the specs beside the pixels. A spec is what catches a
difference the screenshot cannot see - the document title drifted in Russian
for weeks because nothing looked at it, and it took a four-line spec to find.
When a slice adds something off-screen that a person still depends on - a title,
a URL, what lands on the clipboard, what a control is called - add the spec too.

Three things the harness learned the hard way, all of them now in the driver:

- **every state gets a new document.** Two states on one route differ only by
  the hash, and a hash-only navigation does not reload - the page keeps its
  variables and `prepare` never runs again. The help panel one state opened was
  still open in the next, and the harness spent an hour reporting its own leak.
- **wait for the artwork.** A card is mostly its picture, and `loading="lazy"`
  keeps images out of `networkidle0`. A screenshot that races one reports a
  blank square as five percent.
- **wait for animations, not for a timer.** The modal opens over 0.22s in the
  live app and instantly in the rewrite; `document.getAnimations()` answers the
  actual question, where `setTimeout` moves the number with how busy the machine
  is.

Specs that press something are marked `presses: true` and get a page of their
own; everything else shares one arrival, which is what keeps a run to a couple
of minutes. `node tests/parity.js modal 375` runs only the states whose id
contains one of those words.

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

### Paying a visual debt

The loop, for one screen at a time:

1. run `node tests/run-all.js parity` and open the diff image it leaves in
   `test-output/parity/`. The number says how much; only the picture says what.
2. find the element in `app.js`, and its rule in `style.css`. Copy the values.
   Do not measure them off the screenshot and do not round them.
3. re-run. Lower the number in `VISUAL_DEBT`, or delete the entry if it is gone.

Two things that will happen and are not failures:

- **the number goes up when you add something correct.** Required content can
  land before the content that positions it - the footer did, and every route
  got worse for a while. Raising a debt is allowed, and the reason has to say
  which missing thing is holding it at the wrong height.
- **a made-up element can score better than the real one.** The roll result was
  a row somebody invented and it beat the actual card by two points, because
  less wrong content differs less. Reproduce the original anyway. The metric is
  a servant.

### Coverage exceptions

A file that cannot reach a bar gets **its own entry**, named, with the reason in
the config - never a lower bar for the whole class of files. `Button.svelte` is
the only one: Svelte compiles each attribute into an update path, and a
component that small cannot reach them all even from a test that changes its
props. Everything else keeps 75% branches. Lowering the rule to suit one file
would have hidden a component nobody rendered.

### What is left, in order

Debts first, then screens - a screen built on an unfinished pattern copies it.

Eight states match the original exactly: Wondrous in both languages and on a
phone, Dread, and both sections that pick a part of their book first - Vault of
Ages and Communities - each with the state that presses the picker. Every
remaining debt on a screen that has been built is **the add-to-list and print
row**, on both record routes, in both languages, at both widths, and in the
modal. That is not deferred polish - it is code that does not exist yet - and it
lands with the lists and print slices rather than before them.

Left, in order: **Core rules and the alternate tables** - the two modes that
deal several cards at once, so they need the OR grid, the source and kind
filters, the five dice buttons and the crit box - then tables, search, lists,
print, and Phase 5 onwards in `docs/REFACTOR_PLAN.md`.

One debt is not worth hunting. `#/roll/wondrous ~ help` is 0.29% because two
lines rasterise a pixel lower: the box, every paragraph, all thirteen line boxes
and the colour were measured identical to three decimals and the text matches
character for character, so there is no value to copy.

### Copy the behaviour, not the intent

A rule in `style.css` is only worth copying if it is a rule that *applies*.
`.numbox input[type=text]{width:56px}` sits inside the 430px block, and the base
rule that sets 74px is written after it at the same specificity - so the live
field is 74px on a phone and the media rule is dead. The port implemented the
intent, and the parity diff charged eighteen pixels for it. When a value looks
deliberate but the screenshots disagree, the screenshots are right; measure the
element in both apps before changing anything.

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

### The working copy is on a mount; mirror it before running anything

An agent sandbox reaches the repository over a host mount, and the cost there is
per file rather than per byte: about 10ms each, whatever the disk underneath.
Bulk throughput is a few MB/s and can collapse to a few hundred kB/s when the
host is busy. What that does to this repository, measured:

| | over the mount | mirrored to `/tmp` |
|---|---|---|
| `eslint` on three files | 2m27s | under a second |
| `vite build` | minutes, or a timeout | 5s |
| `npm ci` | timeout | 5s |

The `user` column of `time` on that eslint run was 4 seconds against 147 of wall
clock: it is not linting, it is reading `node_modules` a file at a time. So the
mirror is not a workaround for a bad day - it is how a session works here, and
the first slow command is not the moment to discover that. Read from the mount,
write somewhere local:

```
tar -cf - --exclude=node_modules --exclude=.git --exclude=img --exclude=og \
    --exclude=card --exclude=i --exclude=dist --exclude=test-output . \
  | (mkdir -p /tmp/work && cd /tmp/work && tar -xf -)
for d in img og card i; do ln -sfn "$PWD/$d" /tmp/work/$d; done
cd /tmp/work && npm ci          # faster than copying node_modules back
```

`node_modules` has to be installed rather than linked - a build reads thousands
of small files out of it, and that is where the time goes. Copy edited sources
in with the same `tar` pipe before each run, and copy anything prettier
reformatted back out. Measure before assuming: `dd` to `/tmp` and to the mount
told the whole story in two seconds.

Moving the repository to a faster volume does not help this. It was tried - a
Windows Dev Drive, ReFS, Defender in performance mode - and the numbers over the
mount did not move: 200 small writes 2.0s against 2.1s, eslint on three files
150s against 147s. The bridge is the cost, not the disk. What did help, and
travels with the repository, was `git gc`: `.git` had 7698 loose objects and no
packfile, so every git command walked all of them, and packing took
`git status` from 9.6s to 6s.

### When something is slow, say why, and fix what is yours

A command that runs long or times out is a finding, not a nuisance to be worked
around quietly. Two obligations follow, and neither of them is optional:

**Measure and report.** Do not just retry with a longer timeout. Find out what
the time is going on and say so in the response, with the number. `eslint --fix`
on three files taking 150 seconds against prettier's 3.5 is a fact that led
straight to deleting a pre-commit hook; "the commit timed out" would have led
nowhere. `dd` against `/tmp` and against the mount, `git count-objects -v`, the
`user` column of `time` (near zero means I/O, not computing) - these cost
seconds and they name the cause.

**Fix what is on this side without asking.** A test with an excessive timeout, a
suite re-loading a page once per spec when one arrival would do, a sleep where a
readiness check belongs, work repeated per iteration that could be hoisted -
those are defects in the code and they get fixed as part of the task, the same
as any other. No permission needed, and no need to raise it as a question first;
say what was changed afterwards. It was worth 8 arrivals per state down to 4 in
the parity harness, which is the difference between a run that finishes and one
that does not.

What does need raising is anything outside the repository - a slow disk,
antivirus, a machine setting, a tool's own limits. Those come with concrete
steps rather than a shrug, and with an honest ranking: the fix that the
measurement actually points at goes first, not the most interesting one.

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
