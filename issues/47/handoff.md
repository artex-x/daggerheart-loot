# Issue #47 - handoff

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/47/plan.md`, then this file. Nothing here depends on chat history.

## Status

Phase 4 is **in progress**. All six roll modes and the record page are built
and match the live app exactly - every state, both languages, all three widths.
`HEAD` is `e5985ff`; `origin/main` is at `a772a15`, so **nine commits are local
and unpushed**. Pushing is the repository owner's job, never the agent's.

## Completed this session

- `1d99d07` - **the alternate tables** (`#/roll/alt`), the last roll mode.
  `lib/alt.ts` (which four rows a hope/fear pair produces, which tables a crit
  opens, what the step-up offers), `AltPanel.svelte`, four parity states, and
  `PageHead.svelte` extracted from the two panels that had copied it.
- `e5985ff` - **the Core rules help was printing its own markup.** A paragraph
  can now carry a line break and a bold word; `#/roll/std ~ help` is a state.

Three things the slice found, each written up in `plan.md`:

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

## Ten parity failures that are not yours

`node tests/parity.js` reports **10 разхождений on this machine and reported
the same ten before any of this session's work**. Verified: `git stash push -u`,
rebuild, run the failing states - the numbers came back identical to two
decimals.

All ten are debt-carrying states at 768 or 375 whose measured difference sits
0.12-0.68 above the recorded number, which is more than `JITTER` (0.1):

```
#/i/q1 @ ru 375                  1.02 vs 0.73
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

If a future session runs on the Linux agent and these ten come back green, that
confirms the diagnosis and nothing needs doing. If somebody decides the
Windows numbers should be the recorded ones, that is a deliberate change to
make on its own, with CI checked afterwards.

## Remaining work, in batches

**Batch B - tables** (`#/tables`, `#/tables/eq_weapon`). The biggest remaining
surface, and it unlocks the modal-from-a-row path. Two-level chip navigation,
the filter bar, list and grid views, section anchors. `lib/filters.ts` and
`lib/label.ts` already hold the logic. Two things now waiting on it: the crit
box on `#/roll/alt` links into `#/tables/alt_item/<rarity>` and
`#/tables/alt_consumable/<rarity>`, so those anchors have to land; and the
tables help uses `<b>` mid-sentence, which the help shape now supports.

**Batch C - search** (`#/search`). `lib/search.ts` exists.

**Batch D - lists** (`#/lists`). Also pays off the outstanding add-to-list
debts on both record routes and in the modal.

**Batch E - print** (`#/print/<ids>`). Pays the print half of the same row.

**Batch F - the toast.** Small, and it closes `~ pinned` and `#/i/ci1 ~ toast`.
Could be folded into any batch above.

Then Phase 6 (deployment, the `_site` file list becomes `dist/`) and Phase 7
(cut-over: delete `index.html`, `app.js`, `style.css` and the legacy suites).

## Ordered next steps

1. Read `CLAUDE.md`, this file, `issues/47/plan.md`, then `docs/specs/ROUTES.md`
   and `docs/specs/FEATURES.md` for the tables surface.
2. Confirm the environment - see "Environment" below. It is not what the last
   handoff described.
3. Batch B, smallest coherent piece first: the table index (`#/tables`) with
   its chip navigation, before the filter bar and the two views.
4. Add its parity states in the **same** commit - the index, one table, one
   filtered table, the two views - and a `COVERED` entry in
   `app/src/components/a11y.test.ts` for every new component.
5. Measure, record any debt with a real reason, run both gates, commit.

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
- **Do not re-record the ten failing debts.** See above.
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

Must pass: 570+ tests, per-file coverage thresholds, 0 svelte-check errors,
prettier clean, and no `VISUAL_DEBT` entry that is stale in either direction -
apart from the ten above.

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
