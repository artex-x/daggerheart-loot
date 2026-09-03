# Issue #47 - handoff

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/47/plan.md`, then this file. Nothing here depends on chat history.

## Status

Phase 4 is **in progress**. All six roll modes and the record page are built
and match the live app exactly - every state, both languages, all three widths.
`HEAD` is `e5985ff`; `origin/main` is at `a772a15`, so **nine commits are local
and unpushed**. Pushing is the repository owner's job, never the agent's.

## Completed this session

Four commits, all local. The tables batch that follows them is planned in
detail below and deliberately not started - implementation is the next
session's.

- `1d99d07` - **the alternate tables** (`#/roll/alt`), the last roll mode.
  `lib/alt.ts` (which four rows a hope/fear pair produces, which tables a crit
  opens, what the step-up offers), `AltPanel.svelte`, four parity states, and
  `PageHead.svelte` extracted from the two panels that had copied it.
- `e5985ff` - **the Core rules help was printing its own markup.** A paragraph
  can now carry a line break and a bold word; `#/roll/std ~ help` is a state.
- **the tier ladder** - the row of tier buttons on equipment in an upgrade
  line, which nothing had ported. `upgradeLine` had been extracted and tested
  in Phase 2 and no component called it. It hid behind a debt reason that named
  only the add-to-list row; porting it took `#/i/q1` to **exact at four of its
  six cells**. A rung opens the record over the page, so `RecordPage` has a
  modal now, and each rung is named for the piece it leads to.

Four things the work found, each written up in `plan.md`:

- **every icon in a button is 15px**, whatever its `width` attribute says -
  `.btn svg` in style.css overrides it. `lib/icons.ts` had copied the
  external-link icon's 13 and the crit box came out four pixels narrow per
  link. The rule, and the `.btn .dieicon` counter-rule the live app also
  writes, now live in `Button.svelte`.
- **the two dice name their own controls.** The live app calls both number
  fields "Roll result" and all four steppers "One lower"/"One higher", so a
  screen reader hears the same controls twice on the one screen with two dice.
  Eight `ACCEPTED` entries record the deviation.
- **the Core rules help had never been read by anything.** See above; the
  general lesson is already a standing rule - a slice is not finished until its
  states are in `STATES`.
- **a debt reason has to name everything the state is short of.** The one on
  `#/i/q1` named the add-to-list row while the route was also missing the tier
  ladder, so the number looked explained and the missing control stayed
  invisible. Now a standing rule in `CLAUDE.md`, "What you find in passing goes
  in the plan, not into a reason".

## Nine parity failures that are not yours

`node tests/parity.js` reports **9 расхождений on this machine, and reported
the same states before any of this session's work**. Verified: `git stash push -u`,
rebuild, run the failing states - the numbers came back identical to two
decimals.

All nine are debt-carrying states at 768 or 375 whose measured difference sits
0.12-0.68 above the recorded number, which is more than `JITTER` (0.1). There
were ten; `#/i/q1 @ ru 375` came off the list when the tier ladder landed,
which is a hint about the rest - the drift scales with how much of the screen
already differs, so the states carrying the biggest debts are the ones that
cross the threshold.

```
#/roll/wondrous ~ modal @ ru 768 8.73 vs 8.57
#/roll/wondrous ~ modal @ ru 375 13.90 vs 13.55
#/roll/wondrous ~ help @ ru 768  0.92 vs 0.73
#/roll/wondrous ~ help @ ru 375  0.64 vs 0.52
#/roll/wondrous ~ help @ en 375  0.95 vs 0.79
#/i/ci1 ~ whole @ ru 768         5.61 vs 5.39
#/i/ci1 ~ whole @ ru 375         7.64 vs 7.28
#/i/ci1 ~ whole @ en 768         5.40 vs 5.22
#/i/ci1 ~ whole @ en 375         7.69 vs 7.01
```

**They were left alone on purpose.** The numbers were recorded on the Linux
agent, CI runs there, and re-recording them to this machine's rendering would
only move the failure to CI - four of them by more than `DEBT_SLACK`. Every
other debt state reproduces within a few hundredths, so this is not a case for
loosening `JITTER` either. The trap is now a standing note in `CLAUDE.md`
("A debt number belongs to the machine that recorded it").

If a future session runs on the Linux agent and these nine come back green, that
confirms the diagnosis and nothing needs doing. If somebody decides the
Windows numbers should be the recorded ones, that is a deliberate change to
make on its own, with CI checked afterwards.

## Remaining work, in batches

**Batch B - tables.** The biggest remaining surface, and it unlocks the
modal-from-a-row path. Split into four, because it carries 79 top-level CSS
rules and four different body shapes - `plan.md`, "The tables surface, and how
it splits", holds the table and the reasoning. **B1 is planned in full below
and not started.** `lib/filters.ts` and `lib/label.ts` already hold the logic
B2 and B4 need. Two things wait on the batch as a whole: the crit box on
`#/roll/alt` links into `#/tables/alt_item/<rarity>` and
`#/tables/alt_consumable/<rarity>`, so those anchors have to land (B3); and the
tables help uses `<b>` mid-sentence, which the help shape now supports.

**Batch C - search** (`#/search`). `lib/search.ts` exists.

**Batch D - lists** (`#/lists`). Also pays off the outstanding add-to-list
debts on both record routes and in the modal.

**Batch E - print** (`#/print/<ids>`). Pays the print half of the same row.

**Batch F - the toast.** Small, and it closes `~ pinned` and `#/i/ci1 ~ toast`.
Could be folded into any batch above.

Then Phase 6 (deployment, the `_site` file list becomes `dist/`) and Phase 7
(cut-over: delete `index.html`, `app.js`, `style.css` and the legacy suites).

## Batch B1 in detail - the plain table, end to end

Planned and agreed, **not started**. Nothing below needs the chat history.

**In:** the two-level chip navigation, the toolbar (search box,
copy-table-link button, list/grid switch), the row and the tile, the selection
checkbox and "select all", the empty state, and opening a row into the record
modal.

**Out:** the filter (B2), the sectioned bodies and anchors (B3), the equipment
tables (B4), and search - which reuses the row wholesale and so comes after it,
by the rule that a component is extracted on its second use rather than
designed for two callers at once.

### Where it goes

One new `app/src/components/TablesPage.svelte`, wired from the
`route.kind === 'tables'` branch of `app/src/App.svelte`, which renders a
`.todo` placeholder today. One component rather than five: the second use of
the row is the search slice, and `RecordCard.svelte` at 611 lines is the
precedent for the size.

### Already built - reuse, do not rewrite

- `parseHash` in `lib/hash.ts` already returns
  `{ kind: 'tables', table, anchor, filter }`, and `tablesHash` builds the link
  back. No router work at all.
- `index.rows.get(table)` in `lib/data.ts` gives a table's records in the order
  the book prints them, under the same key the route uses.
- `matches(it, q, statLine)` in `lib/search.ts` is the live `matches`, ported
  and tested.
- `descParts` and `artSrc` in `lib/desc.ts`; `cardBadges` and `srcLabel` in
  `lib/label.ts`; `nameOf` and `eqParts` in `lib/i18n.ts`.
- `RecordModal.svelte`, which now takes `onopen` carrying a record, so a row
  opens it exactly as a tier-ladder rung does.

### New pure logic

`app/src/lib/tables.ts` with its own unit test: `TABLE_GROUPS` and `SUB_LABEL`
off `app.js` around line 2410 - nine groups, the table ids under each, and the
shorter caption a sub-chip uses ("Предметы" under "Core", not "Core -
предметы") - plus `groupOf(table)` and the rule that the second row of chips
appears only where a group has more than one table under it.

### Two component growths, each on a real second use

- **`Chip.svelte` gains an `href` form.** The nav chips are `<a>` in the live
  app, and `Chip`'s own comment says its styles were copied from the rule
  shared with the table navigation. Same shape as the `href` form
  `Button.svelte` grew for the critical-success box.
- **the selection.** The checkbox is part of the row's geometry and the row is
  wrong without it, so it is drawn and it ticks. Reset it when the **hash**
  changes rather than on unmount - a hash-only move between two tables keeps
  the same component alive. The selection *bar* (add to list, print, copy
  selection) belongs to lists and print and is the one thing this slice
  knowingly leaves missing.

### The values to copy from `style.css`

Measured, never rounded. `.subchips` (178), `.chip.sm` (179), `.toolbar` and
`.grow` (485), `.seg` and `.seg.small` (72-81), `.rows` and `.row` (547),
`.row-main` and everything under it (555-577, plus `.rstats` at 909 and
`.rt span b` at 925), `.rtail` (785), `.tgrid` (488), `.tile` and the
`.tile-*` family (489-519), `.tilewrap` (788 and 424-427), `.selbox`
(408-416), `.selall` (417-420), `.empty` (524), and the media-query variants.

Two of these will catch a careless port: `.row-main .rt span` clamps **every**
span in the row to two lines, and `.rcraft` and `.rstats` each opt out of that
clamp by name; and `.row.sel .selbox[data-on]{background:none}` undoes the
checkbox's own tint once the row itself is tinted.

### Dictionary

Add to `lib/dict.ts` (the Russian side is the source of truth, so a missing
English key is a compile error): the nine group labels, the sub-captions that
are not already keys, and `searchPh`, `tableLink`, `view`, `viewList`,
`viewGrid`, `nothing`, `selectAll`, `selected`. Several exist already -
`fItems`, `fCons`, `srcCore`, `srcHnf`, `voa` - so reuse them rather than
adding twins, the way `t.tier` was reused for the tier ladder.

### The harness needs one new verb

`tests/parity/driver.js` can click, ask `has`, and read; it cannot type, and a
table's query never enters the hash - see `plan.md` for why that matters. Add
`type(placeholder, text)`, gripping by the placeholder rather than by
`id="tq"`.

### The seven states, all in the same commit

| id | what it reaches |
| --- | --- |
| `#/tables` | the index, which is `core_item` |
| `#/tables/hnf_consumable` | a second table: the chosen chip moves, the sub-row changes |
| `#/tables ~ grid` | the other view, a different body entirely |
| `#/tables ~ searched` | a query that narrows the table |
| `#/tables ~ nothing found` | the empty state, which no route draws |
| `#/tables ~ a row opened` | the record modal over a table |
| `#/tables ~ a row ticked` | the selection, where the missing bar is honest |

`#/tables/eq_weapon` stays `pending`; narrow its reason to name B4. The nav
links to tables B1 has not built - those render the `.todo` placeholder rather
than crashing, and no state compares them. Every new component gets a `COVERED`
entry in `app/src/components/a11y.test.ts`, and two pressed states go into its
`STATES`: the modal over a table, and the grid view.

### What will bite

- **The row is a button containing a lot of text**, so its accessible name is
  the whole row - name, stat line, description, badges. `d.click` matches by
  substring, which works, but the `inventory` spec will now carry sixty long
  names per table. Check the report is still readable.
- **Artwork.** Rows and tiles each load an image, sixty at a time. The harness
  waits for artwork, but this is the first screen with more images than fit
  above the fold; if a screenshot races, that is where.
- **The view switch and the search box do not touch the address.** Both are
  memory only in the live app. Do not "improve" that - `docs/specs/STATE.md` is
  explicit that what was *asked* on a page is not remembered, and the filter is
  the only part of this screen that is.

## Ordered next steps

1. Read `CLAUDE.md`, this file, `issues/47/plan.md`, then `docs/specs/ROUTES.md`
   ("Tables" and the filter grammar) and `docs/specs/FEATURES.md` ("Tables and
   search").
2. Confirm the environment - see "Environment" below. It is not what the
   handoff before this one described.
3. Build B1 as set out above: `lib/tables.ts` and its test first, then the
   component, then the states.
4. Measure, record any debt with a reason that names **everything** the state
   is short of, run both gates and a full parity run, commit.
5. Update `docs/specs/FEATURES.md`, `plan.md` and this file in the same commit
   as the behaviour.

## What not to start yet

- **Do not touch Phase 7.** `index.html`, `app.js` and `style.css` are the
  parity harness's expectation. Deleting them ends the ability to verify
  anything.
- **Do not point Pages at `dist/`.** Phase 6, and it needs the owner to switch
  Settings -> Pages -> Source first.
- **Do not start Playwright.** Ask first whether it earns its place - the parity
  harness already drives both apps in a real browser.
- **Do not chase the help-panel debts.** Both of them are measured identical;
  there is nothing to copy.
- **Do not re-record the nine failing debts.** See above.
- **Do not translate the legacy Russian comments** in `app.js`, `style.css` and
  the older suites. Those files are deleted at the cut-over.

## Quality gates for a slice

```
npm run check          # format, lint, typecheck, data, derived, i18n, tests
npm run check:built    # build, file:// smoke, bundle budget
node tests/parity.js   # the rewrite against the live app
```

`check:built` is required for anything that alters what a screen draws. A full
parity run takes about nine minutes here; filter while working, the argument is
a substring of the expanded id: `node tests/parity.js "alt @ ru"`.

Must pass: 580+ tests, per-file coverage thresholds, 0 svelte-check errors,
prettier clean, and no `VISUAL_DEBT` entry that is stale in either direction -
apart from the nine above.

## Environment

**This session ran natively on Windows** at `E:\dev\daggerheart-loot`, not in a
Linux sandbox reaching the repository over a host mount. The `/tmp` mirror
described in `CLAUDE.md` had nothing to mirror, and none of the mount costs
applied. Measured here, from the repository root:

| | this machine |
|---|---|
| `vitest run --coverage`, 27 files | 40 s |
| `svelte-check` | 15 s |
| `eslint .` | 25 s |
| `vite build` | 1 s |
| `npm run check` end to end | ~2 min |
| full `node tests/parity.js` | ~9 min |

So: **check which kind of session you are in before paying for a mirror.** If
`node -v` and `npx eslint` on a couple of files answer in seconds, work in
place. The mirror is for the sandbox, and the numbers in `CLAUDE.md` are that
sandbox's.

`prettier --write` after editing, always: it is the one gate that fails on
whitespace, and three files went in unformatted this session before the check
caught them.

## Session gotchas

- **Parity output is buffered when redirected.** `node tests/parity.js > log`
  writes nothing until the process ends, so a background run cannot be watched
  through its log. Watching `ls test-output/parity | wc -l` gives progress -
  three files per state - and a `grep -q FAIL` loop on the log fires as soon as
  the buffer flushes.
- **A parity run wipes `test-output/parity/`.** Analyse a diff image before
  starting another run, or it is gone.
- **Do not pipe a long parity run through `tail`.** The FAIL lines scroll past
  the window and the summary alone does not name them. Redirect the whole
  thing.
- **The tool call cap is about 178 seconds.** A full parity run exceeds it; run
  it in the background and wait on it.
- **Two parity runs at once, or a run alongside `npm test`,** compete for CPU
  and can make a screenshot race. Serialise them.

## Open questions

- **Pages source.** Settings -> Pages -> Source is still not "GitHub Actions",
  so a red build can still publish. Owner-side; nothing in a workflow can fix
  it.
- **Playwright.** Phase 5 asks for it. The parity harness may already cover
  what it would. Worth a decision before building anything.
- **`noData` and `storageOff`.** Two dictionary strings in the rewrite have no
  twin in the live app's dictionary - the live app words the "storage is
  blocked" case as `noStorageTitle` + `noStorage`. Neither is reachable by any
  parity state today. Worth aligning when the lists slice touches storage.
- **The kind filter's scope.** The live app shares one `S.kind` across Core
  rules, the alternate tables and Tables; the rewrite gives each panel its own.
  Nothing compares it. The tables slice is where a person might notice, and
  `plan.md` records the decision.

## Critical files

| Path | What it settles |
|---|---|
| `tests/parity/specs.js` | `STATES`, `LANGS`, `WIDTHS`, `NAME`, `ACCEPTED`, `VISUAL_DEBT` |
| `tests/parity.js` | the runner: matrix expansion, one page per target, coverage report |
| `tests/parity/driver.js` | gripping by accessible name, `settle`, waiting for artwork |
| `app/src/components/a11y.test.ts` | axe on pressed states, and the `COVERED` guard |
| `app/src/components/PageHead.svelte` | the heading, the two round buttons, the help panel |
| `app/src/components/AltPanel.svelte` | the duality pair and the critical-success box |
| `app/src/components/RollPanel.svelte` | the shape four sections share |
| `app/src/components/OrGrid.svelte` | 1 / 2 / 4 card layouts with OR, generic in its item |
| `app/src/lib/alt.ts` | the alternate tables: picks, the crit's links, the step up |
| `app/src/lib/help.ts` | the help shape: text, links, bold words, breaks |
| `app/src/lib/dict.ts` | `Dict` derives from the Russian side; parity is a compile error |
| `vite.config.mts` | the artwork links, the `file://` build, coverage thresholds |
| `app.js`, `style.css`, `index.html` | the expectation. Read values from here, never guess |
