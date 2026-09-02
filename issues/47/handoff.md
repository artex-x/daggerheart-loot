# Issue #47 - handoff

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/47/plan.md`, then this file. Nothing here depends on chat history.

## Status

Phase 4 is **in progress**. Five of the six roll modes and the record page are
built and match the live app exactly - every state, both languages, all three
widths. `HEAD` is `d8f77f6`; `origin/main` is at `a772a15`, so **six commits are
local and unpushed**. Pushing is the repository owner's job, never the agent's.

## Completed this session

In commit order:

- `24d42b3` - two standing rules written into `CLAUDE.md`: a slice is not
  finished until its states are in `STATES`; when something is slow, measure it,
  report the number, and fix what is on this side without asking.
- `de514bd` - the `/tmp` mirror is how a session works here, not a bad-day
  workaround. Measured: a Dev Drive did not move the numbers, `git gc` did.
- `3506b04` - **Vault of Ages and Communities.** RollPanel takes rows plus an
  optional picker. Extracted `Field`, `ChipRow`, `Chip`. Found: no help text
  ported for either section, the picker label was the tab's word rather than the
  singular, three missing card badges, an invented `ul` rule, and a roll field
  that kept a number the new section could not hold.
- `117af2e` - **parity runs the whole matrix.** `STATES` x `LANGS` x `WIDTHS`,
  debts keyed `"<id> @ <lang> <width>"`, plus a report of how many control names
  the run pressed against how many it only saw. Found: every English help
  paragraph had been rewritten rather than copied, and `recordActions` gripped
  Russian literals with `has`, so in English it reported every button missing on
  both apps and agreed with itself.
- `1c71365` - **axe on pressed states**, plus the `COVERED` guard that fails
  when a component has no named state rendering it under axe.
- `f68b64c` - **Core rules.** `OrGrid`, `DiceBar`, `lib/std.ts`, `shareRoll`,
  the std help. All eighteen cells matched on the first measurement.
- `d8f77f6` - the build links `img/`, `og/`, `card/` into `dist/`; `npm run
  check:built` added. Fixes a CI failure, see gotchas.

## Remaining work, in batches

**Batch A - the alternate tables** (`#/roll/alt`). The last roll mode and the
only one that rolls two dice at once. Needs: the duality pair (two number fields
labelled hope and fear, `rollDuality` already in `lib/roll.ts`), the five rarity
chips, and the critical-success box - which appears when hope equals fear and
carries links into the alt tables plus a "bump to the next rarity" button
(`nextRarity` already exists). The OR grid, chips and card are all built.
Live source: `renderAlt` in `app.js` around line 2234; CSS `.crit`, `.crit-acts`,
`.dieblock`, `.dielbl` in `style.css`.

**Batch B - tables** (`#/tables`, `#/tables/eq_weapon`). The biggest remaining
surface, and it unlocks the modal-from-a-row path. Two-level chip navigation,
the filter bar, list and grid views, section anchors. `lib/filters.ts` and
`lib/label.ts` already hold the logic.

**Batch C - search** (`#/search`). `lib/search.ts` exists.

**Batch D - lists** (`#/lists`). Also pays off three of the outstanding debts:
the add-to-list row on both record routes and in the modal.

**Batch E - print** (`#/print/<ids>`). Pays the print half of the same row.

**Batch F - the toast.** Small, and it closes `~ pinned` and `#/i/ci1 ~ toast`.
Could be folded into any batch above.

Then Phase 6 (deployment, the `_site` file list becomes `dist/`) and Phase 7
(cut-over: delete `index.html`, `app.js`, `style.css` and the legacy suites).

## Ordered next steps

1. Read `CLAUDE.md`, this file, `issues/47/plan.md`, and `docs/specs/FEATURES.md`
   for the alternate tables.
2. Rebuild the session environment - see "Environment" below. Nothing works
   until the mirror exists.
3. Batch A: `lib/alt.ts` first (pure: which four records a hope/fear pair
   produces, and whether it is a critical success), with its unit test.
4. `AltPanel.svelte` reusing `OrGrid`, `Chip`, `ChipRow`, `Field`, `NumberField`.
5. Add its parity states in the **same** commit: the page, a critical success,
   and a rarity other than the first. Add a `COVERED` entry for every new
   component in `app/src/components/a11y.test.ts`.
6. Measure, record any debt with a real reason, run both gates, commit.

## What not to start yet

- **Do not touch Phase 7.** `index.html`, `app.js` and `style.css` are the
  parity harness's expectation. Deleting them ends the ability to verify
  anything.
- **Do not point Pages at `dist/`.** Phase 6, and it needs the owner to switch
  Settings -> Pages -> Source first.
- **Do not start Playwright.** Ask first whether it earns its place - the parity
  harness already drives both apps in a real browser.
- **Do not chase the help-panel debts.** Measured identical; there is nothing to
  copy.
- **Do not translate the legacy Russian comments** in `app.js`, `style.css` and
  the older suites. Those files are deleted at the cut-over.

## Quality gates for a slice

```
npm run check          # format, lint, typecheck, data, derived, i18n, tests
npm run check:built    # build, file:// smoke, bundle budget
node tests/parity.js   # the rewrite against the live app
```

`check:built` is required for anything that alters what a screen draws - that is
the gate whose absence let a CI failure through this session. A full parity run
takes several minutes; filter while working, the argument is a substring of the
expanded id: `node tests/parity.js "alt @ ru"`.

Must pass: 525+ tests, per-file coverage thresholds, 0 svelte-check errors,
prettier clean, `расхождений нет` from parity, and no `VISUAL_DEBT` entry that
is stale in either direction.

## Environment (rebuild every session)

The working copy is `E:\dev\daggerheart-loot`, reached over a host mount. The
mount costs ~10 ms per file whatever the disk underneath - eslint on three files
is 150 seconds there and under a second in a local mirror. So:

```
# 1. mirror (see CLAUDE.md for the tar pipe)
cd <repo> && tar -cf - --exclude=node_modules --exclude=.git --exclude=img \
  --exclude=og --exclude=card --exclude=i --exclude=dist --exclude=test-output . \
  | (mkdir -p /tmp/work && cd /tmp/work && tar -xf -)
for d in img og card i; do ln -sfn "$PWD/$d" /tmp/work/$d; done
cd /tmp/work && npm ci

# 2. puppeteer needs one 7 kB library
mkdir -p /tmp/sysroot/dl && cd /tmp/sysroot/dl
apt-get download libxdamage1 && dpkg -x libxdamage1_*.deb /tmp/sysroot/root
export LD_LIBRARY_PATH=/tmp/sysroot/root/usr/lib/x86_64-linux-gnu
```

Run **prettier on the mount** (3.2 s); run eslint, vitest, `vite build` and
parity **in the mirror**. Copy edited sources in with the same tar pipe before
each run.

## Session gotchas

- **Do not build on the mount.** `node_modules` there carries Windows native
  bindings only; `@rolldown/binding-linux-x64-gnu` and `lightningcss-linux-x64-gnu`
  are missing, so `vite build` fails. The mirror's own `npm ci` gets the right
  ones.
- **Parity: one page at a time.** Two apps loaded at once had Chrome killed
  part-way through a screenshot on a two-core box, and a browser that dies
  reports every later state as a failure of the port. Already fixed in
  `tests/parity.js`; do not "optimise" it back.
- **A parity run wipes `test-output/parity/`.** Analyse a diff image in the same
  command that produced it, or it is gone.
- **The tool call cap is about 178 seconds.** A full parity run exceeds it; use
  the filter and run in slices.
- **Local `dist/` used to lie.** Until `d8f77f6` the parity harness left
  `img/` symlinks in `dist/`, so the smoke check passed locally on links CI did
  not have. The build owns those links now, but the lesson stands: a green local
  run of a CI-only check is not evidence.

## Open questions

- **Pages source.** Settings -> Pages -> Source is still not "GitHub Actions",
  so a red build can still publish. Owner-side; nothing in a workflow can fix it.
- **Playwright.** Phase 5 asks for it. The parity harness may already cover what
  it would. Worth a decision before building anything.
- **`noData` and `storageOff`.** Two dictionary strings in the rewrite have no
  twin in the live app's dictionary - the live app words the "storage is
  blocked" case as `noStorageTitle` + `noStorage`. Neither is reachable by any
  parity state today, so neither is compared. Worth aligning when the lists
  slice touches storage.
- **`#/roll/alt` help text.** `helpFor('alt', ...)` returns null on purpose and
  `help.test.ts` asserts it. The live app has help for `alt`; port it with the
  slice and update that assertion.

## Critical files

| Path | What it settles |
|---|---|
| `tests/parity/specs.js` | `STATES`, `LANGS`, `WIDTHS`, `NAME`, `ACCEPTED`, `VISUAL_DEBT` |
| `tests/parity.js` | the runner: matrix expansion, one page per target, coverage report |
| `tests/parity/driver.js` | gripping by accessible name, `settle`, waiting for artwork |
| `app/src/components/a11y.test.ts` | axe on pressed states, and the `COVERED` guard |
| `app/src/components/RollPanel.svelte` | the shape four sections share |
| `app/src/components/StdPanel.svelte` | the multi-card shape Batch A copies |
| `app/src/components/OrGrid.svelte` | 1 / 2 / 4 card layouts with OR |
| `app/src/lib/std.ts` | `poolFor`, `isLastOn`, `NDICE` |
| `app/src/lib/help.ts` | the help shape: paragraphs of parts, optional bold lead |
| `app/src/lib/dict.ts` | `Dict` derives from the Russian side; parity is a compile error |
| `vite.config.mts` | the artwork links, the `file://` build, coverage thresholds |
| `app.js`, `style.css`, `index.html` | the expectation. Read values from here, never guess |
