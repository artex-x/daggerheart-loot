# Shared task context - TASK 47

Orchestrator maintains this file so later steps do not re-fetch the same sources.
Read this before `plan.md` and `handoff.md`.

## Goal

**Current: B5 - the lists slice** (`#/lists`). B4 is built and committed
(`fde9cdc`, reviewed, approve/no blockers), so every table in `TABLE_DEFS`
draws a real body and the tables surface is finished. Of the three slices left
in Phase 4 - lists, search, print - the orchestrator picked lists on
2026-09-10 because it is the one the other deferred work waits on: the 600px
overrides for `.selx`/`.selacts`/`.seldrop`/`.dropmenu`/`.lrow*`/`.npair`/
`.batch-acts`, `noData`/`storageOff`, and the add-to-list row that several
`ACCEPTED` parity entries currently excuse. Search reuses the row wholesale
and is cheaper after lists, not before. Everything below the "History" heading
is the record of B3.5/B3.6/B4, which are **built and committed**; read it for
the standing rules and the settled owner decisions, not as work to do.

## `npm run check`, settled (orchestrator, 2026-09-10) - do not re-derive

The B4 handoff's claim that the check "no longer fits one foreground tool
call" is **withdrawn**. Measured at `720266d` on a loaded host (1.0 GB free of
16 GB, 383 processes): 165s in total - `format:check` 11s, `lint` 30s,
`typecheck` 12s, `data` 4s, `derived` 1s, `i18n` 0s, `selftest` 19s, vitest
with coverage 88s - exit 0, 683 tests, thresholds met, and the commit gate
armed itself from that one foreground call. What the B4 session hit was
vitest's fork pool failing to boot workers within its hardcoded 60s
`START_TIMEOUT`; the signature is zeros down the whole coverage table with
`Errors N` equal to the file count, which means no test ran, not that anything
regressed. Re-run it. Fallback if it repeats on a loaded host,
`npx vitest run --coverage --maxWorkers=4`, costs 171s against 88s. Nothing in
`vite.config.mts`, `package.json` or the hooks is changed. Full write-up:
`handoff.md`, "Verification".

**Corrected the same day: 165s is not a constant, it is one host's idle
moment.** B5.1's implementer, hours later on this same machine, had its first
`npm run check` **exceed the 600s foreground cap** and get moved to the
background; its later calls, including the gate-arming one, finished in the
foreground. So the standing instruction is unchanged - run it in the
foreground, one call, `timeout: 600000` - but a worker must expect the cap to
be reachable under load and must not read "165s" as a guarantee. What does not
change: a backgrounded run cannot arm the gate however honestly it passes, so
a run that goes over is re-run, not salvaged.

## State at B4 kickoff (2026-09-09, orchestrator)

- Working tree clean at `ccb80cb`. B3.6 is complete in all three parts:
  part 0 `f7308a9`, part 1 `38cfbbb`, part 2 `958f182`; the ubuntu container
  tooling is `1d368e2`.
- **CI is green, measured. B3.6 part 1's open blocker is closed.** Run
  `34404013490` on `958f182` (B3.6 part 2) completed `success` on every job:
  `check`, `audit`, `secrets`, all four `parity` shards, and `deploy`. That is
  the first green run on `main` since 2026-09-03, and it is the criterion part
  1 said could only be reached by a push. The 4-way shard also did what part 0
  claimed: each parity shard finished in 4-5 minutes against the old 867s
  single job. The `bc91e63` run was still in flight when this was read; it is
  docs-only on top of a green tree.
- Owner decision 1 stands unchanged: CI (ubuntu) is authoritative for
  `VISUAL_DEBT` numbers, a local Windows run is advisory, and no number is
  re-baselined off a local run.
- `#/tables/voa ~ section anchor @ en 375` was left at 8.84 pending a CI
  measurement (handoff, "Deferred"). Run `34404013490` is that measurement -
  reconcile it off that run's artifact rather than off a local figure.
- `ccb80cb` (issue 65 docs) is local-only and unpushed. Not this task's.
- The parity harness now carries a third instrument, `typeRuns` (computed type
  plus a measured advance on four controls, per width), and a `DEBT_SLACK`
  ratchet that fails a paid-off entry instead of passing in silence.
  Extending the probes to the equipment tables is explicitly **deferred**, not
  B4's.
- Standing rules earned by the previous batches, already written down where
  they belong - do not re-derive them:
  - `CLAUDE.md`: port a rule with every `@media` override it has.
  - `docs/parity.md`: a whole-page percentage cannot see a control-sized
    defect; measure the control before writing a rendering-noise reason.
  - Handoff: a literal leading space at the start of a Svelte block is dropped
    by the compiler; emit it as an expression, inside one text node.
    **A second instance in B4 promotes this rule to `CLAUDE.md`.**

## GitHub issue (if any)

- URL: https://github.com/artex-x/daggerheart-loot/issues/47
- Captured or last verified: already summarized in `plan.md`; not re-fetched this
  session and not needed for this batch.
- Decisions already settled: see `plan.md`. Phase 4 batches B1-B3 are built; B4
  (the three equipment tables) was the next batch before this audit.

## History - B3.5/B3.6 (built). Human report (2026-09-09, two screenshots of `#/tables/community` at ~1100px)

1. The search box "is using a different font" in the rewrite.
2. The `любое` hint next to a filter row's label "is too close to the main text".

Both are real. Both were being absorbed by `VISUAL_DEBT` entries whose stated
reason is antialiasing. Measured, not guessed - see below.

## Measured findings (orchestrator, this session)

Method: Puppeteer, `args: ['--no-sandbox', '--disable-dev-shm-usage',
'--disable-gpu']` (the harness's own args), both `index.html` and
`dist/index.html` at the same route, reading computed styles and
`getBoundingClientRect()` via `page.evaluate`. `dist/` was the build at
`4976cb4`, working tree clean.

### Defect 1 - the toolbar search box is 14px, not 15.5px

- Live: `input[type=search]` inherits the body font. Computed `font-size:
  15.5px`, `line-height: 24.8px`. Placeholder measures **259.59px** wide.
- Rewrite: `app/src/components/TablesPage.svelte` `.toolbar input[type='search']`
  writes `font: inherit` and then `font-size: 14px`. Computed `14px / 22.4px`.
  Same placeholder measures **234.47px**.
- `style.css:254` has no font-size at all - only `font:inherit`. The 14px is
  invented, and it is the whole of the "search-box placeholder antialiasing"
  debt. The debt's reason claims the placeholder "measured pixel-identical";
  it is 25px narrower.
- Fix: delete the `font-size: 14px` line.

### Defect 2 - Svelte trimmed the space before the `любое` hint

- Live (`app.js:2692`): `Сообщество <i>любое</i>` - `textContent` is
  `"Сообщество любое"`.
- Rewrite (`app/src/components/FilterBar.svelte:96`): the space sits at the
  start of the `{#if}` block, so Svelte's whitespace normalisation drops it.
  Rendered HTML is `Сообщество<i>любое</i>`, `textContent`
  `"Сообществолюбое"`. The `<i>` starts 4.3px to the left.
- Fix: emit the space as an expression - `{' '}` - so it is a text node the
  compiler cannot trim. Do not put the space inside the `<i>`: an italic space
  is not the same glyph advance.
- Standing rule worth carrying: **a literal leading space at the start of a
  Svelte block is not preserved.** Any ported markup with `' <tag>'` inside an
  `{#if}`/`{#each}` has the same bug.

### Defect 3 - `.selbox` is missing its mobile width override

- `style.css:820`, inside `@media (max-width:600px)`: `.selbox{width:38px}`.
  `TableRows.svelte` ported the base `width: 42px` (line ~220) but not the
  override, so at 375px every row's checkbox column is 4px too wide.
- Consequence: `.row-main` starts at x=59 instead of 55 and is 284px instead of
  288, so `.rt` is 196px instead of 200. Rows whose title or description sits
  near the wrap point gain a whole extra line - e.g. row 5
  ("Разговаривающие Сферы") is 158.95px tall against the live app's 136.56px,
  and row 41 likewise. The page ends up ~78px taller.
- This is the entire "description line-wrap at 375px" debt. It is the **fourth**
  instance of the pattern the B3 handoff already names: a mobile-only override
  ported for the base width only, whose constant offset reads as growing drift.
- Fix: add `@media (max-width: 600px) { .selbox { width: 38px } }` to
  `TableRows.svelte`.

### What the three fixes are worth, simulated

`#/tables @ ru`, whole-page pixelmatch (`threshold: 0.1, includeAA: false`,
the harness's own settings), fixes injected as a stylesheet rather than edited
into source:

| width | as-is | + search font-size | + `.selbox` 38px |
|---|---|---|---|
| 1100 | 0.092% | 0.000% | 0.000% |
| 768 | 0.131% | 0.000% | 0.000% |
| 375 | 1.749% | 1.494% | 0.145% |

So both the 1100 and 768 states go to an exact match, and 375 loses 92% of its
difference. Every "search-box placeholder antialiasing" entry in `VISUAL_DEBT`
is expected to be deleted, not lowered.

### Why the harness did not catch this

Not a bug in the harness, a limit of its metric, and worth writing down:

- The verdict is a percentage of the **whole page**. A wrong font size on one
  line of a 1100x900 screen is ~0.09% - under `JITTER` (0.1), so
  `#/tables @ ru 1100` had **no `VISUAL_DEBT` entry at all** and was reported
  as `вид: совпадает`. A control-sized defect cannot outvote a page-sized
  denominator.
- `includeAA: false` is not the main culprit here - rescoring the same pair
  with `includeAA: true` moved 1100 from 0.092% to 0.127% and 768 from 0.131%
  to 0.181%. Do not "fix" the harness by flipping that flag and calling it
  done.
- The word "antialiasing" in a `VISUAL_DEBT` reason has become an absorbing
  excuse - exactly what the note above `VISUAL_DEBT` warns about for the
  add-to-list row ("Do not let this reason absorb anything else: it did once").
  Three of the six documented noise causes were written against measurements
  that were not actually taken at the level of the glyph run.
- The durable countermeasure is a **nonvisual spec**, not a smaller `JITTER`:
  the harness already compares non-pixel fields between the two apps, and
  computed typography (`font-size`, `line-height`, `font-family`) plus a
  measured text advance for the toolbar search box, a row title, a row
  description and a filter label is deterministic across machines and would
  have failed loudly on all three defects.

## Key paths

- Specs: `docs/specs/CONTRACTS.md`, `ROUTES.md`, `STATE.md`, `FEATURES.md`,
  `COVERAGE.md`, `I18N.md`, `META.md`; workflow in `docs/parity.md`
- Harness: `tests/parity.js` (verdict logic ~line 288-325, pixelmatch ~line 115),
  `tests/parity/specs.js` (`SPECS`, `STATES`, `VISUAL_DEBT` ~line 668,
  `DEBT_SLACK`, `JITTER` ~line 903)
- Code hot paths for this audit:
  - `app/src/components/TablesPage.svelte` - `.toolbar input[type='search']`
  - `app/src/components/FilterBar.svelte` - the `.lbl` line
  - `app/src/components/TableRows.svelte` - `.selbox`
  - Originals: `style.css:254`, `style.css:408-420`, `style.css:820`,
    `app.js:2686-2699`
- Scratch probes used for the measurements are disposable and were not kept.

## Constraints

- Contracts, routes and generated artefacts are untouched by these fixes.
- All three are style/markup parity fixes: `npm run check:built` is required.
- `VISUAL_DEBT` is enforced from both sides, but only outside `DEBT_SLACK`
  (0.5). The check is `pct < debt.pct - DEBT_SLACK`, so an entry recorded at
  0.13 that now measures 0.00 sits inside the slack and passes **silently** -
  which is true of most entries this audit is about. Corrected by the planner
  against an earlier claim here that any improvement fails. Practically: paid
  off entries have to be deleted by reading the run output, not by waiting for
  a failure. Still part of the same change, not a follow-up.
- A full parity run is ~9 minutes; filter while working.

## Do not re-fetch unless

- The human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan

## CI is red, and has been since B1 (added 2026-09-09)

`.github/workflows/ci.yml` runs `npm run test:legacy`, which is
`node tests/run-all.js` with **no filter**, so the full parity suite runs on
every push and pull request. Every run on `main` since
"Batch B1 planned and written down" (2026-09-03) has failed. Sessions recorded
parity as passing while only ever running the filtered `tables` subset locally.

Latest red run at `4976cb4` (`gh run view 34019148841 --log-failed`), on
ubuntu:

```
#/roll/wondrous ~ help  @ ru 768   0.98% vs debt 0.73%
#/roll/wondrous ~ help  @ ru 375   0.68% vs debt 0.52%
#/roll/wondrous ~ help  @ en 768   0.40% vs debt 0.29%
#/roll/wondrous ~ help  @ en 375   1.08% vs debt 0.79%
#/i/ci1 ~ whole         @ ru 1100  5.87% vs debt 5.29%
#/i/ci1 ~ whole         @ ru 768   6.14% vs debt 5.39%
#/i/ci1 ~ whole         @ ru 375   8.49% vs debt 7.28%
#/i/ci1 ~ whole         @ en 1100  5.70% vs debt 5.17%
#/i/ci1 ~ whole         @ en 768   5.91% vs debt 5.22%
#/i/ci1 ~ whole         @ en 375   8.37% vs debt 7.01%
#/tables/wondrous       @ en 768   0.12%, expected zero
#/tables/wondrous       @ en 375   1.64% vs debt 1.51%
```

**That list may be incomplete.** `run-all.js` prints only about a dozen grepped
lines per suite on CI - the workflow's own comment says so. The complete list
needs an unfiltered local run or the uploaded `failure-output` artifact.

Two facts to keep apart:

- The last two entries are **already fixed** by B3.5 - `#/tables/wondrous` was
  the search-box defect.
- The CI list and the local Windows list **overlap but differ**. Locally
  `#/roll/wondrous ~ modal` and `#/i/f1` fail and `~ help @ en 768` passes; on
  ubuntu the reverse. So there are two causes tangled together: a consistent
  overshoot on both machines (`~ help` and `#/i/ci1 ~ whole` are over debt
  everywhere, `~ whole` by up to 1.4pp - too large to be hinting noise), plus
  genuine cross-platform variance of a tenth or two on top.

### Decisions taken by the repository owner, 2026-09-09

Do not re-open these; they are settled input, not options.

1. **CI (ubuntu) is the authoritative machine for `VISUAL_DEBT` numbers.** A
   debt figure must make CI green. A local Windows run is advisory and gets a
   documented per-platform tolerance; local drift may not be written into the
   table as if it were the baseline, which is what `docs/parity.md`'s
   "Machine variance" section already says. Rejected alternatives, on the
   record: per-platform pairs of numbers (doubles bookkeeping this migration
   already struggles with) and simply widening `JITTER`/`DEBT_SLACK` (loosens
   the exact mechanism that let three defects hide this session).
2. **Diagnose every failing state and fix root causes; re-baseline only what is
   genuinely machine variance.** Explicitly *not* "re-baseline everything to
   green now, diagnose later" - the owner's reason is that it risks writing
   another absorbing excuse of the kind this session just spent a batch
   removing. `#/i/ci1 ~ whole` overshooting by ~1.4pp is expected to be a real
   defect, not drift.

## Correction: the CI failures are stale baselines, not machine drift (2026-09-09)

Found by the B3.5 reviewer and verified by the orchestrator against `git show`.
**This supersedes the "genuine cross-platform variance" branch offered in the
section above.** Do not start B3.6 part 1 from the drift hypothesis.

The control that rules drift out is in the reviewer's own run, on the Windows
machine: `#/tables ~ a row opened` - the same "card short by the add-to-list
row inside a modal" shape as `#/roll/wondrous ~ modal` - reproduces all six of
its recorded numbers **to the hundredth**, as does `#/tables ~ help`. This
machine reproduces recorded numbers exactly. So the failing entries are not
failing because the machine renders differently.

What actually happened is that the numbers were recorded, and then the
components those states render were changed without anyone re-baselining them:

| Commit | Date | What it changed | Re-baselined? |
|---|---|---|---|
| `117af2e` | 2026-09-02 | rewrote `tests/parity/specs.js`; every failing entry dates from here | n/a |
| `9fa9ad5` | 2026-09-03 | `RecordCard`, `RecordModal`, `AltPanel`, `RollPanel`, `StdPanel` - the components `#/i/ci1 ~ whole` and `#/roll/wondrous ~ modal` draw | **no** - the commit touches no specs file |
| `e5985ff` | 2026-09-03 | `PageHead`, `help.ts` - the components `~ help` draws | touched `specs.js`, but not these entries |

The entries that *do* reproduce exactly were recorded in `64e79a0`/`9fa9ad5`,
i.e. after those component changes. That is the whole pattern.

`#/i/f1` is a separate and simpler case: `2970c03` (B3) added the state with
**no `ACCEPTED` entry and no debt entry**, so it has never passed. Every other
record-card route has the add-to-list `ACCEPTED` entry; this one was missed.

Practical consequence for B3.6 part 1: the branch to expect is "the debt was
recorded before a change to the component and nobody re-ran it", which is
re-baselining with a reason that names the commit and the change - not
"rendering noise" and not "another machine". Cross-platform variance is still
real at the tenth-of-a-percent level (the CI and Windows failing lists differ
slightly) but it is not what these failures are.

## B4 planning facts (planner, 2026-09-09) - durable, read before implementing

Full design in `plan.md`, "B4 planned"; the brief in `handoff.md`, "Next
batch". Facts that were read off the source rather than assumed:

- `renderEquipTable` (app.js 2735-2761) draws **tier sections as well as
  facets**: `[1,2,3,4]` off `it.eq.tier`, keys `t1`-`t4`, labels
  `t().tier + ' ' + n`, `.tsection#sec-t<n>` at `margin-top:22px`,
  `sectionHead` + `renderList` (select-all per tier), empty tiers skipped.
  `.fcount` reads the whole pool: 317 / 108 / 90 (`data.json`, counted).
- `fChosen` tests the pill's **label** for `/^\d+$/`; `FilterBar.svelte`
  tests the **value**. They differ on the weapons' `burden` row (values
  `'1'`/`'2'`, labels Одноручное/Двуручное): the port would print "Хват 2".
  Fix is `v.label`.
- `dict.ts` lacks `eqClass`, `eqDmg`, `eqTrait`, `eqRange`, `eqBurden`,
  `eqLineF` (app.js 101-103 / 287-289). `source` exists.
- app.js `matches` searches `eqLine(it)` **with the type word**;
  `TablesPage.svelte`'s two `matches` callbacks pass `noType: true`. B4 fixes
  both; the row's display keeps `noType`.
- The `src` facet offers only sources with a record of that kind: weapon and
  secondary eight (no `motherboard` equipment exists), armor five (`core`,
  `hnf`, `voa`, `beast_feast`, `dark_heart`).
- `EQ_TRAIT`/`EQ_RANGE` key order in `lib/i18n.ts` matches app.js.
- `equipOfKind` and `equipFacets` in `lib/data.ts` exist and are uncalled; B4
  calls them. `frameName(id, lang)` falls back to the id, which is what
  `srcName`'s fallback needs.
- Wall clock: `node tests/parity.js "eq_"` (8 states) fits one 600s call;
  `node tests/parity.js "tables"` no longer does after B4 (was ~9 min for 26
  states, gains 8).

## B5 planning facts (planner, 2026-09-10) - durable, read before implementing

Full design in `plan.md`, "B5 planned" and "B5.1 planned"; the brief in
`handoff.md`, "Next batch". Facts read off the source rather than assumed:

- **The add-to-list menu is drawn before its button** in the DOM
  (`addToListBtn`, app.js 1879-1891), and the live document click handler
  closes any open menu *first*, on any click outside `.seldrop`/`.dropmenu` -
  so the harness's `EN` press after `enter` folds the menu, and every menu
  state's English cells compare the folded row. Not a defect on either side.
- **The menu sorts lists by `created` descending** (newest first,
  `listMenuHTML` 1834) while the lists index shows `S.lists` order (newest
  first because `createList` `unshift`s). A single record's menu label is
  `inLists` ("Лежит в списках") even when it lies in none; several ids read
  `addTo`. The search box appears at **eight** lists (`PICKER_SEARCH_AT`).
- **`+ Новый список` carries `class="chip ghost"` but draws plain**: the only
  `.chip.ghost` rule is `.picker .chip.ghost` and the menu is not inside
  `.picker`.
- **`placeMenu` (3695-3704) is part of every menu state**: `up` when
  `innerHeight - button.bottom < menu.height + 16`, then
  `scrollIntoView({ block: 'nearest' })` - on `#/i/ci1` at 1100x900 the row is
  below the fold, so a menu state is a scrolled state.
- **Toast timings**: 1600ms plain, 2600ms error (`role=alert`, assertive),
  7000ms with an undo action (`.toast.act`, `.toast-act`). `[hidden]{display:
  none !important}` hides it; `toastIn` replays on each show.
- **A `storage` event replaces the lists outright**: `mergeLists(loadLists())`
  has empty `theirs`, so it is a plain take of what storage holds.
- **The storage warning is not chrome**: the live app draws `storageWarning()`
  on the two lists pages only; `Shell.svelte`'s `storageOff` paragraph is the
  rewrite's invention and is reconciled in B5.3, not B5.1.
- **`dict.ts` keys are named differently from app.js in places** (`helpHint`
  for `whatIsThis`, `homeHint` for `setHome`); B5.1 adds seventeen keys under
  the live names listed in the plan. `lib/lists.ts` (`keepLists`, `liftNotes`,
  `mergeLists`) and `lib/money.ts` have had no caller since Phase 2.
- **The harness reaches list states by seeding**: `tests/select.js` and
  `tests/lists2.js` already write `dhloot.lists.v2` through
  `evaluateOnNewDocument` on the live app under `file://`; `dist/` is the
  same origin. B5.1 adds `d.seed(entries)` and `d.storage(key)` to the driver
  and a `storage` field on a state, hashed into the cache key.
- **`RecordModal` is a native `<dialog>`**, so a fixed toast in `Shell` sits
  under its backdrop and is inert while it is open; the design puts the toast
  in the top layer with `popover="manual"`, with a recorded fallback.
- Wall clock for B5.1's filters: `"i/ci1"` is 7 states, the second filter 6;
  each is about a third of the pre-B4 "tables" run (~9 min for 26 states).

## CI is red again, and the five cells are stable (orchestrator, 2026-09-10)

Measured, not guessed. Two consecutive runs on `main`, different commits, the
same five failing cells with the same figures - so this is not CI flake:

| run | commit | failing cells |
|---|---|---|
| `34482875625` | `a404a52` | the five below |
| `34485537392` | `b6a2fcd` | the five below, identically |

```text
shard 1  FAIL #/i/ci1 ~ whole @ ru 1100 :: вид :: 0.00%, долг записан как 5.53%
shard 1  FAIL #/i/ci1 ~ whole @ ru 768  :: вид :: 0.00%, долг записан как 7.31%
shard 1  FAIL #/i/ci1 ~ whole @ en 1100 :: вид :: 0.00%, долг записан как 4.88%
shard 3  FAIL #/i/ci1 ~ toast @ en 768  :: вид :: 0.00%, долг записан как 0.86%
shard 3  FAIL #/i/ci1 ~ toast @ en 375  :: вид :: 0.00%, долг записан как 2.78%
```

Every one is the ratchet firing in the *improvement* direction - `стало лучше -
опусти число в VISUAL_DEBT`. Every other cell in all four shards passes, and
`check`, `audit` and `secrets` are green; `deploy` is skipped because `parity`
failed.

Facts that follow from that, and that nobody needs to re-derive:

- **All five entries are B5.1's and its fix-pass's**, `specs.js` 863-892, and
  every one of them was written with a Windows figure and the words "CI to
  confirm" or "This class is B5.2's to solve" in its `why`. CI has now
  confirmed, twice: on the authoritative machine all five are an exact match.
- **The `~ whole` trio is the "paint noise" class** the handoff names
  ("A second unstable class, distinct from the toast"); the two `~ toast`
  cells are the "timed state" class. Both classes were already recorded as
  B5.2's research by owner decision, 2026-09-10.
- **`#/i/ci1 ~ whole @ ru 375`, `@ en 768`, `@ en 375` pass** (`совпадает`),
  as does every one of the twenty-four new B5.1 list-menu/`in a list`/
  `many lists`/`new list` cells. B5.1's actual work is CI-clean.
- Owner decision 1 (`CI (ubuntu) is authoritative for VISUAL_DEBT numbers`)
  decides the direction. What it does not decide is how a local Windows run
  stops re-introducing a Windows figure the next time somebody reads a red
  cell - that is the class question, and it is the planner's.
- The failing-shard artifacts (`failure-output-parity-1`, `-3`) hold
  `test-output/` and `dist/` for 14 days if a diff image is wanted.

`dc31460` (local HEAD) is one docs-only commit ahead of `b6a2fcd`, so it
changes nothing the harness photographs; the run at `b6a2fcd` reads for the
current tree.

## B5.2 planning facts (planner, 2026-09-10) - durable, read before implementing

Full design in `plan.md`, "B5.2 planned, part 0" (CI green, the two unstable
classes - tests and docs only) and "part 1" (the selection bar); the brief for
part 0 is `handoff.md`, "Next batch". Facts read off the source or measured,
not assumed:

- **Local HEAD moved to `252e0a6`** during planning (hooks-guardrails docs,
  another task's); still docs-only over `d1c1367`, so the CI run at `b6a2fcd`
  reads for the tree. Re-read `git log --oneline -3` before starting.
- **The five red cells are decided: deleted.** Owner decision 1 leaves no
  figure but 0.00, and 0.00 is deletion by the ratchet's own rule
  (`parity.js` 532-543). They were already red on a local Windows run under
  their Windows figures (1.43 vs 5.53 fails as `стало лучше`), so deletion
  does not turn a green local run red.
- **The timed class is the width sweep** (`parity.js` 352-450: one arrival,
  three viewports, a `settle()` of up to 680ms each, an `EN` press in between
  for English) against a 1600ms toast, with the legacy PNG possibly from a
  cache written on another clock. Chosen fix: `timed: true` on a state makes
  the runner arrive afresh at every width. The slack class is rejected (a
  tolerance as wide as the toast). Two states carry the flag; part 1's
  `~ selection copied` is the third.
- **The whole-page class is the capture**: `fullPage: true` rasterises a
  3000px document in one go; geometry was byte-identical in every reading
  while pixels swung 0.00-7.31% under load; CI reads 0.00. Chosen fix:
  `shot(whole)` captures until two consecutive captures are byte-equal (cap
  four), plus a `geometry` `perWidth` spec on `#/i/ci1 ~ whole` (which, like
  `typeRuns`, turns the legacy cache off for that state).
- **`.prettierignore` and `eslint.config.mjs` both skip `tests/`**, so runner
  and driver edits are verified only by running the harness; `npm run check`
  does not read them.
- **The live selection bar, measured** (read-only puppeteer probe on
  `index.html#/tables`, two lists seeded, reduced motion): 53px tall at 1100
  and 768, **137px at 375** (count row, the add-to-list control alone on a
  328px row, print and copy at 160px each below); `.selacts` children 176.7 /
  86.6 / 121.9px wide at 1100; `#/tables` has 60 rows and "Выбрано 60" when
  all are ticked. The bar's `innerHTML` is transcribed in `plan.md`, part 1.
- **The bar's menu opens above the bar at every width, with `up` set and
  inert.** `placeMenu` (app.js 3695-3704) always adds `up` at the bottom of
  the window, and **style.css has no base `.dropmenu.up` rule** - only
  `.cardpick .dropmenu.up` (443). `AddToList.svelte`'s `.dropmenu.up {
  bottom: auto; top: calc(100% + 8px) }` is invented; harmless on the card,
  it would push the bar's menu off-screen. Part 1 deletes it. Measured menu:
  230x171 with two lists, y=679 against the bar at y=847, right-aligned at
  x=614 at 1100; x=16-344 at 375; `scrollY` 0.
- **The print link's accessible name is its `title`** ("Собрать карточки для
  печати: девять на лист A4"): the driver's `NAME_FN` prefers `title` over
  text, so the inventory compares the long string and `d.click('Печать')`
  finds nothing. The bar's four control names, live: "Снять выделение",
  "Добавить в список", the title above, "Скопировать".
- **Select-all cannot be gripped by the harness**: `<label class="selall">`
  wraps an input with no `aria-label`/`title`, and `NAME_FN` reads none of
  the label. Every row box is named "Выбрано", so a second row needs
  `d.click(name, nth)` - part 1 adds the index; it does not name select-all
  (the inventory would differ).
- **The count is one text node** (`t.selected + ' ' + n`) followed by the
  cross inside `.selcount`; `selIds()` is `Object.keys(S.sel)` in tick order
  (existing keys keep position on select-all), which `SvelteSet` matches.
- **Copy selection** is each record's `shareText`/`shareHtml` with **no skip
  set**, joined by `\n\n` / `<br><br>` (app.js 1961-1966) - no OR, unlike a
  copied roll; the rewrite's `share()` per record joined the same way is
  `shareSelection` in `lib/share.ts`.
- **Three dictionary keys are missing**: `clearSel`, `copySel`, `selCopied`
  (app.js 113-114 / 299-300). `selected`, `print`, `printHint`, `copyFailed`
  exist. `lib/icons.ts` `copy` is `ICON_COPY`'s path.
- Wall clock for part 1's filters: `"a row ticked" "bar menu" "selection
  copied"` is 3 states (one timed); `"#/tables ~"` is 8; `"i/ci1 ~"` is 6.
  Each fits one foreground call; do not merge them.

## State at B5.3 kickoff (orchestrator, 2026-09-10)

Measured at dispatch, not inferred:

- HEAD is `afa82f3` (`docs(issue-47): CI is green - B5.2 part 0 closed by run
  34492619641`); `git status` clean; no `test-output/parity.lock`; no heavy
  run alive on this host.
- **Re-measured at the implement dispatch (2026-09-10, later session):** HEAD
  is `91d7899` (`docs(issue-47): plan B5.3 ...`), the planning commit; tree
  clean; still no `test-output/parity.lock` and no vitest or parity process
  alive (26 `node.exe` are peer Claude sessions, none running a check). 19
  peer sessions now share the tree. The line below about this cycle being
  "planner first" is spent - B5.3 is planned and implement-ready as of
  `91d7899`, and this cycle dispatches the implementer only.
- `origin/main` is `4210ee3`, so **three commits are unpushed**: `ff741ad`
  (B5.2 part 1, the selection bar), `6084846` and `afa82f3` (both docs). CI
  has therefore still not read the selection bar - that is the owner's push
  to make, and the only thing outstanding on B5.2. It does not block B5.3.
- 18 peer sessions share this working tree (9 interactive). Re-read
  `git log --oneline -3` before writing, and never `git add -A`.
- B5.3 is the next batch and is **outline-only** in `plan.md` ("B5 planned"),
  so this cycle is planner first, then implementer.

## B5.3 closed, and the full suite on it (orchestrator, 2026-09-10)

- B5.3 is built, reviewed, remediated and committed: `ba8f4b1`
  (`feat(lists): the lists index`, 30 files) and `e82cd24`
  (`fix(lists): match live's GM-payload list card link`, the review's one
  blocker). Review was opus against `ba8f4b1`: fix-then-continue, one
  blocker, five nits - the nits are in `handoff.md`, "Deferred".
- The blocker is worth remembering as a class, not as an incident: the card
  link's payload flavour was wrong, and **nothing in the harness could have
  caught it**. No parity spec reads an `href`, and the `seven` seed carries
  no `hnote`, so the two flavours are byte-identical for every seeded list.
  36/36 green cells and a full unit suite were silent on it. It was found by
  reading `app.js` against the port. The false fact had also been written
  into this file and into `plan.md` as measured, where B5.4 would have
  inherited it; both are corrected with verified line numbers
  (app.js:2894 for the call, 1534 for the signature).
- **The full unfiltered suite was run on `e82cd24`**: 1848.8s, 8 workers,
  five failing cells, none of them `#/lists`. Four are the documented
  Windows-vs-CI machine-variance class and need no action; the fifth,
  `#/tables ~ selection copied @ en 1100` at 0.74%, is new, reproduces
  identically alone, and is left for the planner. Full numbers and what
  bounds them: `handoff.md`, "Blockers", first entry. Do not re-measure it.
- **Pushed and read by CI, during this session and not by the orchestrator**
  (`git reflog show origin/main`: "update by push" to `e82cd24`). Run
  `34521343531`: `check`, `audit` and **all four `parity` shards succeed** -
  CI's authoritative word on both the selection bar and the lists index, and
  the condition B5.2 part 1 was waiting on. One job fails, `secrets`, on
  three gitleaks false positives over the localStorage key name
  `dhloot.warn.v1`; `deploy` is skipped behind it. Another session is already
  fixing that with an untracked `.gitleaks.toml` - see `handoff.md`,
  "Blockers". Do not duplicate it.

## B5.3 planning facts (planner, 2026-09-10) - durable, read before implementing

Full design in `plan.md`, "B5.3 planned"; the brief in `handoff.md`, "Next
batch". Facts read off the source or measured on the live app (a read-only
puppeteer probe on `index.html#/lists`, reduced motion, the harness's own
launch args, three widths), not assumed:

- **The live index is one function, `renderLists` (app.js 2909-2931)**:
  `pageHead('lists')`, `storageWarning()` (2872-2886), a `.panel` with inline
  `margin-top:16px` holding two `.field`s (`.lbl` + `.numrow` with a `.grow`
  input and a button: "Новый список"/`#lname`/"Создать" primary, "Восстановить
  из ссылки"/`#limport`/"Восстановить" plain), then either `.listgrid` of
  `listCardHTML` (2888-2907) in `S.lists` order (newest first) or
  `<div class="empty">` with `noLists`. No "storage off" chrome anywhere else:
  `Shell.svelte`'s `storageOff` paragraph and its dictionary key are the
  rewrite's invention.
- **The warning has two forms and only one is dismissible.** `storageWorks()`
  false: `<div class="warn"><b>noStorageTitle</b> noStorage</div>` - one text
  node after the `<b>`, starting with a space - and it cannot be dismissed
  (nothing would remember it). Storage working and `dhloot.warn.v1 !== '1'`:
  `<details class="warn"><summary><b>localOnlyTitle</b><i>readMore</i><button
  class="warn-x" data-act="hideWarn" title=aria-label=dismiss>×</button>
  </summary><p>localOnly</p></details>`, no whitespace between the three
  children of the summary. `hideWarn` (4175) calls `e.preventDefault()` - the
  cross sits inside the summary and a plain click would also toggle it - then
  writes `'1'` and re-renders. `.warn` is declared twice in style.css (855-861
  the box; 963 `position:relative; margin-bottom:16px`), then `summary`,
  `::-webkit-details-marker`, `summary i`, `[open] summary i{visibility:
  hidden}`, `p`, `.warn-x` and `:hover` (964-975), plus `.warn-x:focus-visible`
  in the keyboard block (1002-1005).
- **Measured, 1100x900**: folded warning 1053x43.5 at y=212.78 (18px under
  the page-sub, `.warn-x` 26x26 at top/right 6); unfolded 150px tall (the
  `<p>` 97.5px); the storage-off div 1053x64.5 at 768 / 121.5 at 375; panel
  198.78 tall (254.78 at 375, where the import row wraps its button under the
  input because `.numrow .grow{flex:1 1 170px}` cannot fit 170+10+127.56 in
  290px while the create row's 92.42px button fits); inputs 46px, `font-size`
  15.5px inherited; `.listgrid` `repeat(auto-fill, minmax(280px, 1fr))` gives
  three 341.66px columns at 1100, two 353.5 at 768, one at 375; a card with
  six thumbs is 149.59 tall, an empty one 129.59; `.empty` 104.8 tall. Unfolded
  at 375 the warning is 429.5px - the reason the live app folds it.
- **A card's accessible name is its text with no spaces**: `a.listcard-main`
  reads "Клад дракона7" / "Лавка в порту0Список пуст" through `NAME_FN`, because
  `<b>`, the `.badge.num` and the empty-state `<p>` are adjacent with no
  whitespace. A Svelte template with a newline between them would put a space
  in the inventory. The badge counts **known** records (`listItems`), not
  `l.ids.length`; thumbs are the first six known records, `imgTag(it,
  'thumb')` = `<img src alt="" loading="lazy" decoding="async">`.
- **The card link renders the GM payload, not the players' - a bug in the
  live app, not a deliberate choice.** `listCardHTML` (app.js:2894) calls
  `listHash(l)` with **one argument**; `listHash(l, forPlayers)` (app.js:1534)
  is `'#/l/' + encodeList(l, forPlayers)`, so `forPlayers` is `undefined`,
  falsy, and `encodeListRaw(l, false)` keeps any `hnote` records on the card's
  own link. Only `goToList` (app.js:1539-1540) calls `listHash(l, true)`. The
  two payload flavours are byte-identical whenever no record in the list
  carries an `hnote`, which is why this went unnoticed - deterministic from
  name and ids either way, so a list created inside a parity state still
  links identically on both apps in the common case. After navigation,
  `syncListUrl` (app.js:1599-1606) `replaceState`s the address bar to the
  players' form regardless, so the address bar converges; what the bug
  affects is the rendered `href` attribute itself - "copy link address", the
  hover status bar, and the history entry pushed on click - for any list
  carrying a GM-only note. The port matches this: `ListsPage.svelte`'s card
  link calls `encodeList(l, false)`.
- **Controls on the live index** (NAME_FN, chrome removed): "Как это
  работает", "Открывать этот раздел при запуске" (`homeHash()` returns
  `#/lists`, so the pin draws), "Скрыть", "Создать", "Восстановить", and per
  card "Поделиться", "Удалить" and the link name above. Both text inputs have
  no name (no label, aria-label or title) and are gripped by placeholder:
  "Например: клад дракона" / "Ссылка на список".
- **Share** (3971-3976): an empty list toasts `listEmpty` (plain) and stops;
  otherwise `listShareUrlShort(l, true)` = `appUrl('#/l/' + packPayload(
  encodeListRaw(l, true)))` - packed only when shorter - copied with
  `playersLinkCopied`. **Delete** (4136-4150): `confirm(deleteConfirm % name)`,
  then `deleteList` (1332-1336: `S.deleted[id] = true`, filter, `saveLists`);
  on the index it re-renders, on a list page it goes to `#/lists`.
  **Create** (4195-4203): blank → `nameFirst` error and focus; else
  `createList`, draft cleared, `listCreated % name` only if `createList.saved`.
  **Import** (4257-4270): `/#\/l\/([A-Za-z0-9_-]+)/` on the trimmed field,
  `decodeList` of the capture or the raw text, `badShare` error on null, else
  `createList(name)` + ids + meta, save, `goToList` (navigates to the players'
  hash).
- **Live defect, found by reading**: that regex has no `~`, and `decodeList`
  `atob`s the payload, so a packed short link - the very link "Поделиться"
  copies - is refused by "Восстановить" with `badShare`. The rewrite fixes it
  (`env.compress.unpack` before decode); see `plan.md`, "Decided".
- **`confirm()` blocks puppeteer**: an `el.click()` inside `page.evaluate`
  that opens a dialog never returns unless something accepts it - no state can
  press "Удалить" today. The batch gives the driver a dialog auto-accept that
  records the message, so delete is compared as data (`deletedList` press
  spec). `<summary>` is not in `click()`'s selector list either, so the
  unfolded warning needs `summary` added there (not to `has`/`controls`).
- **Missing from the rewrite**: 18 dictionary keys (`importList`, `importBtn`,
  `importPh`, `dismiss`, `readMore`, `listCreated`, `noLists`, `share`, `del`,
  `listEmpty`, `noStorageTitle`, `noStorage`, `localOnlyTitle`, `localOnly`,
  `deleteConfirm`, `playersLinkCopied`, `badShare`, `subLists`); the `lists`
  help (`help.ts` has no entry; app.js 252-257 / 433-438, four paragraphs,
  two with `<b>` parts); a `danger` button variant (`.btn.danger`, style.css
  795-796); a dialog port (`window.confirm` is a browser API and belongs
  behind `ports/`); `ListStore.remove` (the `#deleted` writer) and a
  `create` that takes ids/meta for import. `icons.ts` already has `link`
  (`ICON_LINK`, app.js 1054). No `::placeholder` rule exists anywhere under
  `app/` while style.css:727 sets one - see the plan for what that means.
- **`noData` is the rewrite's own state, kept.** The live app has no
  "data did not load" screen: `app.js:7` throws on a missing `window.LOOT`
  and index.html's static shell is all that draws. Every rewrite page draws
  `t.noData` in a `.miss` paragraph when `app.index` is null, per the
  `AppState.index` comment (FEATURES.md, "Records"); the lists page does the
  same. `storageOff`, by contrast, replaces a real live warning and goes.
- **Nothing in `VISUAL_DEBT` or `ACCEPTED` names `#/lists`**: the route was
  `pending`, so the batch deletes only the `pending: 'lists slice'` marker
  and the `outstanding` line it prints. `#/tables ~ nothing found` and its two
  siblings are the states that guard the `Empty.svelte` extraction.
- Wall clock for the filters: `"#/lists"` is 6 states (one timed) and does
  not match `#/i/ci1 ~ many lists`; `"nothing found"` is 3; `"#/tables ~"` is
  8. Each fits one foreground call; do not merge them.

## B5.3 close-out facts (planner, 2026-09-10) - durable

Read off the source while deciding the `~ notice unfolded @ en` blocker; the
decision itself is `plan.md`, "B5.3 built", "Close-out decision", and the
brief is `handoff.md`, "Next batch".

- **The live app has an opt-in for DOM state that survives `render()`.**
  `restoreOpen()` (app.js 3769-3775) re-applies `S.keepOpen[...]` to every
  `[data-keep]` element (`open` on a `<details>`, `hidden` otherwise), fed by
  a capturing `toggle` listener (3780-3783). Three elements opt in: the roll
  panel `roll:<id>` (3011), the note box `rnote:<key>` (3047), the list note
  `note:<id>` (3095) - all on B5.4's list page. `storageWarning()` writes no
  `data-keep`, so the notice folds on every re-render, a language switch
  included, by the live app's own rule.
- **`ACCEPTED` never reaches a pixel cell.** It is read only by the spec
  `diff()` (`tests/parity.js` 214), keyed `<state> @ <lang> :: <spec> ::
  <field>`; the pixel verdict (538-575) consults `VISUAL_DEBT` alone.
  "Accept a visual difference" therefore means a `VISUAL_DEBT` figure, which
  owner decision 1 forbids off this host.
- **`arrive()` runs `enter(d)` with no `lang`, then presses `EN`**
  (`parity.js` 353-363), deliberately - every `enter` grips Russian names.
  Any state whose `enter` leaves DOM-only state that the live `render()`
  discards shows the same English-only divergence unless the port
  re-creates the element on `app.lang`.
- **`AppState.setLang()` does not bump `navigations`** (`app.svelte.ts`
  252-255); `go()` and the router's `onChange` do. `App.svelte` (62-85)
  remounts the page component on every route change, so `ListsPage` never
  survives a navigation and a `navigations` key there would be a no-op.
- Wall clock unchanged: `"#/lists"` is 6 states / 36 cells, one foreground
  call. The other two B5.3 filters are banked by the implementer's run and
  are not re-run at close-out.

## State at B5.4 kickoff (orchestrator, 2026-09-10)

- HEAD `543222d` (docs), on top of `4b23f44` (docs) and `e82cd24` (B5.3's
  fix-then-continue). Working tree clean except one untracked path,
  `.gitleaks.toml`, written by another session and deliberately left alone -
  see `handoff.md`, "Blockers", the `secrets` bullet. Do not stage it, do not
  rewrite it, and check whether it has landed before writing anything about
  gitleaks.
- `set -o pipefail; npm run check 2>&1 | tail -n 120` on this exact tree:
  **exit 0**, thresholds met (statements 96.89, branches 90.09, functions
  96.93, lines 97.15), vitest 67s, one foreground call, no worker-fork crash.
  The commit gate is armed for `543222d`.
- `ListAgents` shows no subagent of this session running; the twenty-one peers
  are other sessions on the same tree. HEAD moves under this task - re-read
  `git log --oneline -3` before and after any writer.
- B5.1, B5.2 (both parts) and B5.3 are built, committed and read by CI
  (run `34521343531`: `check`, `audit` and all four `parity` shards green;
  `secrets` red on three localStorage-key-name false positives; `deploy`
  skipped behind it). **B5.4 is the next batch and is an outline only** -
  `plan.md`, "B5 planned", the batch table row - so it is planned before it
  is implemented.
- Open, and handed to B5.4's planning rather than re-measured:
  `#/tables ~ selection copied @ en 1100` reads 0.74% against an expected
  zero, twice (full suite and an isolated six-cell run), all five sibling
  cells clean. The diff image has not been opened and no `VISUAL_DEBT` line
  has been written; the measurements are in `handoff.md`, "Blockers", first
  bullet. Root-causing it is the planner's, not the orchestrator's.

## B5.4 planning facts (planner, 2026-09-10) - durable, read before implementing

Full design in `plan.md`, "B5.4 planned" (4a implement-ready, 4b outlined);
the brief in `handoff.md`, "Next batch". Facts read off the source or
measured on the live app (a read-only puppeteer probe with the harness's own
launch args and reduced motion, `index.html#/lists/<id>` seeded with `a` =
seven Core items + `meta.ci2 = {qty 2, gold 750, note, hnote}` + a list
note, `b` empty, `c` two entries; three widths), not assumed. HEAD at
planning: `13bba19` (the gitleaks allowlist landed); `app.js` unchanged since
B5.3, so every line below is current.

- **`#/tables ~ selection copied @ en 1100` is a stale cache hit.** The
  diff image is red only over the toast: the legacy shot has none, the
  rewrite's shows "Выбранное скопировано" (Russian - the toast is raised
  before the `EN` press in both apps). The legacy PNG is byte-identical to
  `test-output/.parity-cache/a6515261…/1100.png`, written 21:50:41 inside the
  full suite's 21:33-22:03 window; in the "isolated" 22:04-22:05 run all
  three English legacy files were written within 35ms of each other (cache
  copies - a fresh arrival is ~7s apart, which is the spacing of the `next`
  files). The two measurements share one legacy capture, taken under load
  after the 1600ms toast had gone. `tests/parity.js` turns the legacy cache
  off for `measured` states only (lines 414, 459-460, 476-477), never for
  `timed` ones. CI never caches (fresh runners). Decision: `&& !timed` on the
  three guards, no debt line - `plan.md`, "Decided", first bullet.
- **No tab is lit on a list page.** `renderTabs` (app.js 3667-3673) lights
  `tab[0] === currentRoute()` and the route string is `l/…` or `lists/…`;
  measured `#tabs a.on` empty at every width. `AppState.section` (rewrite)
  returns `'lists'` for both list route kinds and `shell.test.ts` asserts it -
  both wrong; B5.4a corrects them. `homeHash()` is `''` there and the page
  writes its own `<h1>`: no pin, no `?`, `document.title` plain.
- **The title input is the ordinary text field, not a dashed underline.**
  `.titleinput` (style.css 848-853, specificity 0,1,0) loses to the global
  `input[type=text]` (254-258, 0,1,1): computed 46px tall, `padding 0 14px`,
  `background rgb(20,17,29)`, `1px solid` border on all sides, `radius 9px`,
  the global gold `:focus` border and `0 0 0 3px rgba(216,171,94,.14)`
  shadow; only `max-width 560px`, `font-size 23px`, `font-weight 680`,
  `letter-spacing -0.23px` survive from the class. 560 wide at 1100/768, 328
  at 375. Port the cascade, not the intent.
- **The address.** Opening `#/lists/a` rewrites to `#/l/<encodeList(l,
  true)>` at once (`syncListUrl` 1599-1606 via `render` 3799-3803); remove,
  undo, position, rename, the money mode each rewrite it
  (`freshenListUrl` 1596-1598 after every writer); reopening that hash draws
  the own page (`findListByPayload` 1551-1574, or the `S.urlPayload`
  short-circuit 3805-3808); `#/lists/nope` stays as typed and draws "Список
  не найден" / `listNotFoundSub` / a `btn primary` "Списки" link (87.42x46).
- **Measured, 1100 (768 / 375 where different):** `h1.page-h` 46 tall;
  `.page-sub` "7 позиций" 22.39, margin-bottom 18; `.card-acts` 35 (73 at 375),
  margin-bottom 16; `.warn` 43.5 (69.5 at 375); `.money` 36.8 (65.8 at 375 -
  the `?` wraps), chips 98.97 wide, `.helpbtn.sm` 22x22 at every width, help
  open 235.95 (394.52 at 375), `.money-help p` 567.53 wide; `.lnote` folded
  36 (summary 34, padding 10/10), open 153 (172 / 285 - `.npair` stacks under
  640px), `[open] summary` padding-bottom 6, textareas 506.5 / 340.5 / 300
  wide, 83 tall auto-sized for one line; `.lroll` folded 43 (summary 41, svg
  15x15), open with no result 138.39 (numbox 156x48, primary button
  157.53x46, `.rollhint` 20), with result 2: 452.08 (field 74.39 with inline
  `margin-bottom:14px`, card 178.19, each `.hitnote` 59.25, ghost "Сбросить"
  100.23x46); at 375 the numrow wraps (button under the numbox, 214.39
  without a result, 600.98 with); `.batch` 36 unticked ("Выбрать все"), 49
  with acts at 1100, 80 at 375; `.lrow` 78 (102.03 / 202.63: three bands -
  grip+pick+position 19px tall, body 116.44, meta+acts 65.19); `.lrow-grip`
  26 wide, `.lrow-pick` 32, `.lrow-n` 40 (font 650 12px mono), `.row-main`
  753 wide, `.lrow-meta` 161 (238 at 375 with `padding-left 44`), qty input
  70x30, gold 64x30, `.goldhint` 13x13 at 9.5px, `.lrow-acts` 39 wide
  (88 at 375: two 44px buttons in a row), `.lrow-note` 37.5 tall, `.row-x`
  38.5; a row with one-line notes 202.64 (its `.rnote` 123, `.npair` 104,
  `.nlbl` 20 - 39 at 768/375, `.note-x` 20x20, textareas 509.5 / 343.5 / 304
  wide, 79 tall auto-sized); an opened empty box 116 (row 194); `.empty`
  129.59; `.toast.act` after a remove 313.42x50 with `.toast-act` 73.78x30,
  text "«Заряжающий Колчан» убранВернуть"; the plain copy toast 152.55x41.59.
- **Behaviour measured:** `.lnote` opens when a note exists, `.lroll` starts
  folded; the note box of a noted row is visible and the row `has-note`;
  `Сбросить` empties `#n` and leaves the panel open; the note toggle shows
  the box and focuses its first textarea; a typed gold sets the field's
  `title` at once ("2 мешка 3 горсти") but the `?` appears only after the
  next render (`had !== has`, 4346-4370); the coin mode removes every title
  and `?` and marks the chip `on` + `aria-current="true"`; `.note-x` is
  `display:none` on an empty box (`:has(textarea:placeholder-shown)`, 1096);
  remove → 6 rows and the address rewritten, undo → 7 in the original order;
  position "1" typed on row 5 and committed → that entry first, storage and
  address updated; rename → storage and address updated, the `h1` text stays
  `''`; the roll card's "Скопировать текст" ends `\n\nЗаметка\nСветится в
  темноте` (the players' note; the GM's does not travel) - `contextNote`
  568-573.
- **The inventory names a textarea by its text content** (NAME_FN falls
  through `aria-label`, `title`, `textContent`): "Лавка закрыта до утра",
  "Светится в темноте", "Проклят" are in the live inventory; empty boxes
  and unpriced number inputs are not; the priced gold input is named by its
  `title` "7 мешков 5 горстей". Svelte's `<textarea>{x}</textarea>` and
  `bind:value` both compile to a `.value` assignment (verified with
  `svelte/compiler`) and leave `textContent` empty - the port seeds the text
  child with an action.
- **Live controls on the page** (Russian, NAME_FN): "Название списка",
  "Ссылка игрокам", "Ссылка себе", "Скопировать текст", the print link by its
  title, "Удалить", "Скрыть", "Как в книге", "Монетами", "Как это работает"
  (the money `?`), "Очистить заметку" (x4), "Бросок по списку" (a `summary`),
  "Результат броска", "На единицу меньше"/"больше", "Случайно 1–7",
  "Выбрать позицию", "Позиция в списке", "Заметка", "Убрать из списка", one
  whole-row name per entry. English: "List name", "Players’ link" (curly
  apostrophe), "Your own link", "Copy text", "Delete", "Dismiss", "As in the
  book", "In coins", "How this works", "Clear the note", "Roll on this list",
  "Roll result", "One lower"/"One higher", "Random 1–7", "Select entry",
  "Position in the list", "Note", "Remove from the list"; the sub "7 items",
  the bar "Select all", captions "Qty"/"Gold".
- **Forty dictionary keys are missing from the rewrite** (list in `plan.md`);
  `helpHint` already equals `whatIsThis`; `moneyHelp` carries five `<b>`
  runs per language and goes into `help.ts` structured, not the dictionary.
- **`Field`'s margin is set inline on the roll panel** (`margin-bottom:14px`
  with a hit, `0` without), which beats `.lroll>:last-child{margin-bottom:
  13px}`; `NumberField` shows `String(value)` where the live `numBox` shows
  `''` below `min` (#16) and steps from `(parseInt('') || 0)`.
- **Wall clock:** `"#/lists/a @"` 1 state + 6 press specs; `"~ noted" "~
  money help"` 2 + 4; `"~ roll panel" "~ rolled" "~ removed" "~ note opened"`
  4 (one timed); `"#/lists/b" "#/lists/nope" "own list"` 3; regressions `"~
  help"` 4, `"#/tables ~" "#/tables/eq_weapon"` 11, `"#/lists @" "#/lists ~"`
  6, `"i/ci1 ~"` 6. Each fits one foreground call; do not merge them. A bare
  `"#/lists"` now matches sixteen states.
- **4b inherits:** the live drag model (app.js 4443-4530): `data-drag` on the
  grip, `dragging` on the row, `setDragImage(row, 24, 24)`, `drop-before`/
  `drop-after` by the row's vertical midpoint, `EDGE = 120` / `EDGE_MAX = 22`
  autoscroll on `requestAnimationFrame`, `to` adjusted by the mark; the
  rewrite's `nativeDrag` is index-on-drop only and 4a binds it as is.

## B5.4a step 6's parity result, and how it was nearly lost (orchestrator, 2026-09-10)

- `MSYS_NO_PATHCONV=1 node tests/parity.js "#/tables ~" "#/tables/eq_weapon"`
  (11 states, 66 cells, both languages, three widths) finished **clean at
  23:36:43**: `расхождений нет`, 60 cells `совпадает` and six reading exactly
  their recorded debt (0.02/0.02/0.03/0.03/0.07/0.07% `из ... долга`). No
  `FAIL`. That is step 6's acceptance - `RowMain.svelte`'s extraction from
  `TableRows.svelte` is proved, and the batch is clear to continue at step 7.
  The run also carries the harness's own advisory notes (the two `#/tables ~
  grid` `controls` lines are the known legacy `tileHTML` index bug, not this
  batch's).
- **The near-loss, worth one line so the next session does not repeat it.**
  The implementer backgrounded that run and ended its turn on it. Two
  false readings followed, both the orchestrator's:
  1. Git Bash's `kill -0 <pid>` answers in the **MSYS pid namespace**, not the
     Windows one, so it reported the live `node` as dead. Use `tasklist //FI
     "PID eq <pid>"`, or PowerShell `Get-Process -Id`, to ask about a Windows
     pid. `.claude/hooks/bash-guard.mjs` reads the lock through
     `tests/parity/lock.js`, which uses Node's `process.kill(pid, 0)` - it was
     right and the shell check was wrong, which is what the block was saying.
  2. A background run's `.output` file **reads 0 bytes until the run flushes**.
     An empty file is not a lost result while the pid is alive; `parity.lock`
     tells the difference - a released (absent) lock means a clean exit, a lock
     left behind with a dead pid means the run was killed.
  So the standing rule is unchanged and now has a test: a backgrounded check
  is not to be started at all. But if one is found running, wait on the
  Windows pid and read the lock, rather than concluding from a shell builtin
  and an unflushed file.

## The commit gate cannot arm on this host tonight (orchestrator, 2026-09-11)

**Measured, three runs, no edits between the last two - so this is the gate
mechanism, not a failing batch.** B5.4a's code is written (43 uncommitted
paths on top of `f38b900`) and the implementer spent roughly two hours
re-running `npm run check` without being able to commit.

| run | pid | duration | gate armed? |
|---|---|---|---|
| 02:37:50 - 03:01:47 | 258284 | ~1437s | no |
| ~03:14 - 03:24:51 | 261096 | ~630s | no |
| ~03:38 - 03:52:22 | 262164 | >=813s | no |

`.claude/.check-cache.json` still holds `388cd5e9e1099e7a`, written by the
orchestrator's own 23:00 run on the `543222d` tree - no run since has been
observed.

**Why, exactly.** `check-observer.mjs` is a PostToolUse(Bash) hook: it arms
the gate only from a **foreground** call whose own stdout it can read. The
Bash tool's ceiling is 600000ms and it moves a call that outlives its timeout
into the background, where there is no stdout to attribute. So once
`npm run check` exceeds ten minutes on this host, **every** attempt is
unobservable by construction, and retrying cannot help. `bash-guard.mjs`
(line 70) correctly refuses a deliberately backgrounded check for the same
reason, so that is not a way round it either.

**It is load, not a regression.** The same check took ~165s at `720266d` and
~3 minutes at `543222d` tonight (orchestrator, 23:00, exit 0). `ListAgents`
showed twenty-one peer sessions on this machine, ten of them interactive, for
the whole window above. The figure is this host's load at this hour, and the
"165s is not a constant" correction earlier in this file now has its third
data point.

**The sanctioned escape is in the gate's own message:** run the commit again
with `SKIP_CHECK_GATE=1` in front of it and say why in the summary. That is
only honest if the last full check actually passed - a fact only the worker
that read the output holds, which is why this was put to the owner rather
than decided here.

## The host block lifted, and the check is green (orchestrator, 2026-09-11, 08:25-08:30)

The two sections above - "The commit gate cannot arm on this host tonight" and
"The B5.4a tree passes; the host cannot prove it" - are **closed**. They
described a loaded host, not a defect, and the diagnosis held exactly.

One reading before anything heavy, which is the whole procedure the amended
brief asks for: `Get-CimInstance Win32_OperatingSystem` gave **RAM free
7.44 GB of 15.82 GB**, 251 processes, no `chrome.exe`, no
`test-output/parity.lock`. Against 0.35 GB free and 424 processes at 06:25,
that is the difference between a fork pool that boots its children and one
that loses 11-13 files to its hardcoded 60s `START_TIMEOUT`.

On that host, one foreground call, unchained and unredirected:

```text
set -o pipefail; npm run check 2>&1 | tail -n 120
```

exit 0, well inside the 600000ms ceiling. 37 test files, 854 tests, 0
failures; coverage 96.24 stmts / 88.87 branch / 96.86 funcs / 96.86 lines,
every threshold met; vitest with coverage 78.8s. No zero rows, no `Errors N`,
no worker-fork crash. `check-observer.mjs` armed `.claude/.check-cache.json`
at tree key `2ab9c1a7...` from that one call, which is what five previous
attempts could never reach.

Three durable things follow, and none of them should be re-derived:

1. **Nothing in B5.4a's code was ever wrong.** The 469-test run and the
   isolated 35/35 `listPage.test.ts` pass recorded at 06:25 were right; the
   854-test run confirms it with every file present.
2. **The rule is the reading, not the retry.** Do not re-run a heavy check on
   a loaded host hoping for a different answer, and do not treat a zeroed
   coverage table as a regression - take the RAM reading first and wait. The
   same command that burned roughly two hours across two sessions cost 165s
   on an idle host.
3. **A doc edit disarms the gate.** `tree-key.mjs` fingerprints tracked and
   untracked content alike, `issues/**` and `*.md` included; the gate exempts
   those paths from *what it counts* but not from *the fingerprint*. So a
   batch whose last step writes `plan.md` and `handoff.md` must run one more
   foreground `npm run check` after those writes and immediately before
   `git commit`, or the gate blocks a commit whose code has genuinely passed.

## The B5.4a tree passes; the host cannot prove it (orchestrator, 2026-09-11, scheduled run)

**The batch is not the problem, and that is now measured rather than hoped.**
Picking up the tree the previous session left (43 uncommitted paths on
`f38b900`, B5.4a steps 1-9 written, stalled at step 10), three runs:

| run | command | wall clock | result |
|---|---|---|---|
| 05:28-05:42 | `npm run check` | >600s, backgrounded | exit 1, coverage thresholds only |
| 05:49-05:57 | `npx vitest run` | 437s | **26 files passed, 469 tests passed, 0 failures, 11 files failed to start** |
| 06:0x | `npx vitest run --coverage --maxWorkers=4` | see below | the README's documented fallback |

**Every coverage ERROR in run 1 is a file that never ran.** The eleven files
that died on `Failed to start forks worker ... Timeout waiting for worker to
respond` include `record`, `roll`, `listsPage`, `std`, `shell`, `ports` and
`hash` - and those are precisely the components reading 0-50% in run 1's
table (`AltPanel` 0%, `SectionHead` 0%, `SelBar` 9.3%, `FilterBar` 34%,
`TablesPage` 50%, `RecordCard` 46%). Files this batch never touched do not
regress from 100% to 0%; they regress to 0% when nothing imports them.
So run 1's exit 1 is the fork-pool failure mode `.claude/README.md` already
documents, reading as a coverage regression. **No test failed anywhere in
this batch.**

**Do not re-run `npm run check` on this host at this hour hoping for a
different answer.** That is now five attempts across two sessions (three
last night at 1437s/630s/813s, two this morning) and the ceiling is
structural, not statistical: the Bash tool caps at 600000ms and moves a
longer call to the background, where `check-observer.mjs` has no stdout to
attribute, so the commit gate cannot arm however well the run goes. The
run above took 437s for vitest *alone*, without coverage and without the
seven stages that precede it.

**`--reporter=basic` no longer exists** in this vitest (`Failed to load
custom Reporter from basic`). The default reporter with a `grep`/`tail`
filter is the way to keep the output under the tool's ~30000-char cap.

### Why, measured rather than inferred (06:25)

`RAM free 0.35 GB of 15.82 GB; CPU 100%; 424 processes, 26 of them node; 8
cores.` That is the cause of every number above. A fork pool that must boot
one child per test file inside a hardcoded 60s `START_TIMEOUT` cannot do it
with ~350 MB free, and the files that lose the race read 0% coverage.

Note against the README's own caution ("free memory does not predict this -
the failing session had 2.9 GB free and the passing one 1.0 GB"): that
caution stands for the 1-3 GB range and is not contradicted here. 0.35 GB
with the CPU pegged is a different regime, not a counter-example. Do not
promote this into a rule off one reading - it is recorded as a measurement.

### What was proved about the batch anyway

| run | what it proves |
|---|---|
| `npx vitest run` (437s) | 26 files, 469 tests, **0 failures** |
| `npx vitest run --coverage --maxWorkers=4` (1067s) | 23 files pass, 13 fail to start, **1 test fails**: `listPage.test.ts > a row's note > clears the box on the cross...` at 14745ms |
| `npx vitest run app/src/components/listPage.test.ts` (211s) | **35 tests, all pass** |

The one failure is a load-induced timeout, not a defect: the same file passes
alone. Between the first two runs every component test file and most of `lib`
has been observed passing at least once. **No genuine test failure has been
found in B5.4a.** What has *not* been achieved is a single complete run, so
the coverage thresholds - the thing the gate actually needs - remain
unevaluated.

**`--maxWorkers=4` made it worse here, not better** (1067s against 437s, 13
failed starts against 11). The README's fallback was measured on a host with
memory to spare; under memory starvation, reducing worker count does not help
because the cost is per-fork allocation, not scheduling. Recorded as a
measurement, not a rule change.

### A peer session is on this batch too (06:31)

`test-output/parity.lock` appeared mid-session: pid 276576, `argv
["#/lists/a @"]`, started 06:20:21, confirmed alive. That is B5.4a step 11's
first filter, so a second session is already verifying this tree. This
session therefore committed nothing, dispatched nobody, and left the lock
alone. Anyone reading this must re-read `git log --oneline -3` and the lock
before assuming the batch is still at step 10 - see `handoff.md`, Status.

Note for the record: this session's 06:19 single-file vitest run (211s for 35
tests) overlapped that parity run's start, so its wall clock is contended and
should not be quoted as a baseline.

## B5.4a closed: step 11 needed no fix (implementer, 2026-09-11)

Resuming at step 11 exactly as directed, on the tree the prior sessions left
(HEAD `f38b900`, step 10 already green): all six parity filter groups - ten
new states across 96 cells, plus the two regression filters at 72 cells -
read `совпадает` on the first pass, in both languages, at all three widths.
No diff image was ever opened, because no cell ever went non-zero. This is
the strongest confirmation available that steps 1-9's port matches the
measurements `plan.md`'s "B5.4 planned" recorded: every number in that
section (the title input's cascade, the auto-size heights, the folded/open
panel heights, the row bands) was ported correctly the first time, with no
iteration needed. `npm run check:built` also exited 0 on the first attempt
(77.3 kB gzip against the 120 kB budget). One commit, `feat(lists): the list
page`, on top of `f38b900`. B5.4b (drag), B5.5 (batch actions) and B5.6 (the
shared page) remain unplanned - see `handoff.md`, "Next batch".

## State at the B5-remainder kickoff (orchestrator, 2026-09-11)

- HEAD `3cb2bd0` (`docs(issue-47): B5.4a closed - the three commits that carry
  it`), working tree **clean**, no `test-output/parity.lock`. B5.4a is closed
  by three commits: `f38b900`, `8873473`, `fe38973`.
- Host reading before anything heavy: RAM free 6.84 GB of 15.82 GB, 271
  processes, **no `chrome.exe`**, 13 `node` processes (editor/tooling). This is
  the idle-enough shape in which `npm run check` has fit one foreground call.
- `ListAgents` shows one **interactive peer session** (`daggerheart-loot-ce`,
  started ~46 min before this reading) on the same tree; every other peer is
  offline. The tree was clean and unlocked throughout this reading, but HEAD
  can move under this task - re-read `git log --oneline -3` before dispatching
  a writer and again at closeout.
- Human GOAL for this session, recorded verbatim in intent: finish the next
  batch; **merge the remaining lists batches into fewer, larger batches** if
  they are individually small; and **write down a standing rule for choosing
  larger batches**, because the per-batch fixed cost (`npm run check`,
  `npm run check:built`, the parity loop) is paid once per batch whatever the
  batch's size. Deciding the merge and authoring the rule are the planner's,
  not the orchestrator's.
- What is left of the lists slice, all three unplanned as of this reading:
  **B5.4b** (drag as the live app does it - outlined, `plan.md` line ~6060),
  **B5.5** (batch actions, the money panel, delete selected, undo),
  **B5.6** (the shared list page, packed-link expansion, taking a shared list).
- Fixed per-batch check costs, measured in this repo and unchanged:
  `npm run check` a few minutes (165s on an idle host; has exceeded the 600s
  foreground cap under load), `npm run check:built` a few minutes,
  `node tests/parity.js "<filter>"` ~9 min for a large filter, the full parity
  suite ~867s single-job / 4-5 min per shard on CI's 4-way split.

## B5-remainder planning facts (planner, 2026-09-11) - durable, read before implementing

Decision: two batches remain, not three - **B5.5 absorbs B5.4b** (same file,
same seeds, same parity filter `"#/lists/a"`), **B5.6 stays separate** (its
own route, filter `"#/l/"`, component, and a routing change). Reasoning and
the rejected splits: `plan.md`, "B5 remainder planned". The standing rule:
`CLAUDE.md`, "Task and session protocol"; costs and the test:
`docs/parity.md`, "Batch size and the fixed cost of a run".

Harness facts that shaped the plan (`tests/parity/driver.js`,
`tests/parity.js` at `3cb2bd0`):

- `NAME_FN` (driver.js 102-107) names a control by `aria-label`, then
  `title`, then `textContent`. **`d.controls()` never reads `aria-pressed`
  or `aria-current`**, so the money chips' `aria-pressed` (rewrite) against
  `aria-current="true"` (live, app.js 2944) is not a measured difference.
- **A stale `ACCEPTED` key fails the run** (parity.js ~615: `fail +=
  stale.length`, printed as `различий больше нет, убери из ACCEPTED`). An
  entry for an unmeasured difference would therefore be red from its first
  run. This is why B5.4a nit 2 is recorded as prose, not as an entry.
- `d.click(name, nth)` prefers an **exact** name match and falls back to
  `includes` only at `nth` 0. The list page's action row has a delete-list
  button named exactly `Удалить`, so the batch delete must be pressed as
  `Удалить (1)`; `Удалить` would delete the list.
- The driver has no drag verb (B5.4a's review found the inert grip because
  of it). B5.5 adds `drag(from, to, after)` by `.lrow` index, dispatching
  synthetic `DragEvent`s with one `DataTransfer` - Chrome constructs both.
- `enter` runs in Russian; `arrive()` presses `EN` afterwards. Component
  state that must survive that press (`lsel`, `guess`, `rp`) has to sit
  outside any `{#key app.lang}` block.

Live-app facts (`app.js`/`style.css` at `3cb2bd0`, unchanged since
`d5d63c1`):

- Batch bar and money panel: `batchBarHTML` 724-745, `moneyPanelHTML`
  750-782, `guessBand`/`guessPrice` 811-829, `guessWhy` 831-842, `RAR_KEY`
  463, `voaTierName` 920, `numBox` 2096, the `#rp` input handler 4336-4344,
  the four handlers 3986-4083 (`data-guess`, `data-guess-apply`,
  `data-reprice`, `data-batch-clearprice`, `data-batch-del`). `S.rp` defaults
  to `-20`, `S.guess` to `false`; `hashchange` (4629-4636) clears `S.lsel`
  but neither of those.
- `.batch-price` and its three rules (style.css 1064, 1078-1080) are dead:
  nothing writes the class. Do not port.
- Drag: 4443-4530; `EDGE = 120`, `EDGE_MAX = 22`; the edge loop runs off a
  **capturing** `document` `dragover` because the pointer spends most of a
  drag between rows; the `to` adjustment is `after && to < from → +1`,
  `!after && to > from → -1`.
- Shared page: `renderSharedList` 3130-3170 (rows through `rowHTML(it, '',
  tail)` - so they carry `selBox` and the selection bar works there; no
  `.selall`), `expandHash` 3589-3603 (a failed unpack rewrites to
  `#/l/zzzz`; `currentRoute` reports `l/zzzz` while unpacking), the
  `N_SHARED` (`'@'`) branch of `createFor` 4213-4224 (a new list takes name,
  meta, note and hnote; an existing list takes ids only), `lines()` 589.
- Dictionary strings for everything above: ru 116-188, en 302-372. Product
  text carries U+2013 (band range), U+2014 (no price), U+00D7 (quantity),
  U+00B7 (separators); port the bytes.

Rewrite facts (`app/src` at `3cb2bd0`):

- `ListStore` already has `setMeta`, `removeEntry`, `restoreEntry(id,
  entryId, at, meta)`, `create(name, init)` - B5.5 needs no new method;
  B5.6's "take into a new list" is `create(name, init)`'s second caller.
- `lib/money.ts` has `guessBand`, `guessPrice(it, rarityOf)`, `reprice`,
  `priceText`, `moneyMode`; `index.rarityOf` exists (`lib/data.ts:147`).
  `guessWhy` does not exist yet.
- `DragHandlers` is `onDrop(from, to)` only; `nativeDrag` is index-based on
  `[data-index]`; `fakeDrag` exposes the bound handlers for tests.
- Svelte drops a scoped rule no template element can match and `npm run
  check` fails it as dead CSS (`ListPage.svelte` ~1246) - so the drag
  classes must be `class:` bindings driven by port callbacks, not classes
  the port toggles.
- `Chip.svelte`'s button form writes `aria-pressed={on}`; its link form
  `aria-current="page"`.
- `browserCompress.unpack` exists, is tested, and has one caller
  (`ListsPage`'s restore). `AppState` does not expand `#/l/~` yet: `hash.ts`
  parses it as `{ kind: 'sharedList', packed: true }` and `ListPage` shows
  the `todo` paragraph.
- `TableRows.svelte`'s `TableEntry` is `{ it, n? }`; it draws `.selall`
  only when `ontoggleall` is passed. `RowMain`'s `tail`/`.rtail` has no
  caller (B5.4a nit 1). `ListPage.svelte` ~434 draws the rolled entry's
  hitnotes inline - `HitNote.svelte`'s first copy; the shared page is the
  second.
- `docs/fixtures/lists/` has no packed (`~`) payload; `notes-both-kinds.json`'s
  `gm.payload` carries all four notes and is contract-tested. A packed
  parity state computes its payload once with Node's `zlib.deflateRawSync`
  and records the command beside it.

## B5.5 built: durable facts for B5.6 (implementer, 2026-09-11)

- **The drag verb needed no fallback.** `tests/parity/driver.js`'s
  `drag(from, to, after)` (a synthetic `DataTransfer` and three `DragEvent`s
  on `.lrow`/`[data-drag]`) drove the **live** app's own 4443-4530 handlers
  correctly on the first attempt in puppeteer's Chrome - `reorderedByDrag`
  observed the same id order on both apps with no re-run.
- **`NumberField`/`lib/numField.ts` now supports a negative `min`.**
  `typed(raw, caret, max, min = 0)` and `committed(raw, min, max)` keep a
  single leading minus when `min < 0` (a `digitsOf` helper); every existing
  call passes no fourth argument and is byte-for-byte unchanged. Needed
  because the reprice field's default is `-20` and the old code stripped
  every non-digit, minus included. Any future field with a negative range
  (there is only the one today) needs no further change here.
- **A loot record's `guessBand` never returns `null`** - only equipment can
  (`GUESS_EQ[t]?.[tier-1] ?? null`), and every other kind falls back to
  `GUESS_RAR[kind].uncommon`. `ci1` (a plain core item, no `eq`, no `tier`)
  always gets a band; the "confirm ci1 gets one" caveat in `plan.md`'s "B5.5
  planned" never applied and needed no substitution.
- **`Button.svelte` needed no change.** `on`, `caret` and `expanded` already
  existed from B5.1 and are exactly what the `.batch-acts` pair needed
  (`caret` flips via `expanded`, `on` draws the pushed-in look) - confirm
  this before adding anything to `Button` for B5.6's own controls.

## State at the B5.6 kickoff (orchestrator, 2026-09-11)

- HEAD `d6c951f` (`fix(lists): start a drag only from the grip`), working tree
  **clean**, no `test-output/parity.lock`. B5.5 is closed by four commits:
  `36fd2f1` (planning docs), `a006792` (drag), `ba0a92d` (batch actions),
  `d6c951f` (the one allowed review remediation).
- Host reading before anything heavy: RAM free 4.44 GB of 15.82 GB, **no
  `chrome.exe`**, 12 `node` processes (editor/tooling). Less headroom than the
  B5-remainder kickoff's 6.84 GB; `npm run check` has exceeded the 600s
  foreground cap under load before, so treat a timeout here as host load, not
  as a suite regression.
- `ListAgents` shows **two interactive peer sessions** on this tree
  (`daggerheart-loot-96` ~1h old, `daggerheart-loot-ce` ~2h old); every other
  peer is offline. HEAD can move under this task - re-read `git log --oneline
  -3` before dispatching a writer and again at closeout.
- Human GOAL this session: finish the next batch. **B5.6 is the last lists
  batch** and the only one left in the slice. It is outlined in `plan.md`,
  "B5.6 outlined", but the handoff records it as not implement-ready: the
  outline names the pieces, not ordered steps, exact test cases, or acceptance
  criteria. Planner first, then implementer.

## B5.6 planning facts (planner, 2026-09-11) - durable, read before implementing

Read alongside "B5-remainder planning facts" and "B5.5 built" above; this
adds only what B5.6's own reading found. Line numbers are `app.js` at
`d6c951f` (unchanged since `d5d63c1`).

- **The outline's "adding to an existing list copies ids only" was wrong.**
  `applyAddTo` (1907-1920) sends `'@'` to `addIdsTo(l, ids, S.shared.meta)`
  *before* the single-record toggle, and every other key goes through
  `metaForKey(key)` (1874-1877), which returns `S.shared.meta` whenever the
  route is `l/` with no `S.openList` - so the bar's `sel` key and a card's
  own key copy meta on the shared page too. `addIdsTo` (1924-1940) writes
  `qty` (`> 1`), `gold` (`> 0`), `note` - in that order, for fresh ids only,
  never `hnote`. Only the GM's note stays behind. The rewrite ports this as
  `ListStore.addIds(list, ids, knows, meta?)` plus `AppState.shared`
  (`DecodedList | null`, set while `SharedListPage` is mounted).
- **`contextNote` (568-578) is empty on a shared page** - `onListPage()`
  needs `S.openList`. The shared page's modal passes no `extra`.
- **The live app renders nothing while a packed link expands**: `if
  (!expandHash()) render()` (4636), and `expandHash` returns true the
  moment it sees `l/~`. The harness's `ready()` waits for `#view`/`#app`
  children, which on the live side therefore already implies the expansion
  landed; the rewrite's `Shell` mounts at once, so the packed state needs
  the `expanded()` verb (waits on `location.hash` leaving `#/l/~`).
- **`plainCompress.unpack` returns a packed payload unchanged** (it has no
  decompressor), so an expansion that `replace`s whatever `unpack` returns
  would loop under the test env. `#expand` treats a result still starting
  with `~` as the failure it is (`#/l/zzzz`), which is also what a browser
  without `DecompressionStream` gets from the live `catch`.
- **Fixture ids are all in `data.js`**: `ci1`, `cc1`, `cc21`, `q337`,
  `voa2_a1`, `q26`, `q33` (checked with `window.LOOT` - items are nested
  under `LOOT.items.<table>` and `LOOT.eq`). `qty-and-price.json`'s payload
  carries the three tail shapes (`×2`, `×5 · price`, bare price);
  `notes-both-kinds.json`'s `gm` payload carries all four notes and no
  meta; `player === gm` for both equipment-entry and qty-and-price.
- **The packed form of `notes-both-kinds.json`'s `gm.raw`**, computed with
  `zlib.deflateRawSync` and round-tripped through `inflateRawSync` back to
  `gm.payload`: `~JY2hDsIwFAD9PqKrH5AUwwfVMIXCLqNIBAkWQUKCL6xkpdB-w70_IgN5d-K44nmRiaRquVhttuvOtmZmralU09Wc8TxIeM2IJ0kvB3ETBoqWvTjp8aqruVEY5Ugk67kmUcj_yh1PJhBlJ041tjU1JyKBTNFEBukp04WP-tULhUDgyXvSXw`
  (179 chars against 223 plain). Node's deflate bytes differ from Chrome's
  `CompressionStream` output, but both are raw deflate and
  `DecompressionStream('deflate-raw')` reads either. The command is in
  `plan.md`, "B5.6 planned", "Parity states".
- **Svelte prunes a scoped sibling rule a single instance cannot match.**
  `HitNote.svelte` cannot carry `.hitnote + .hitnote` scoped; it carries
  `:global(.hitnote + .hitnote)` after the base rule (equal specificity,
  source order decides - the live cascade decides by specificity, same
  result).
- **`a11y.test.ts`'s guard compares `COVERED` against every `*.svelte` on
  disk** - a new component fails the suite until it is named there with a
  state that renders it under axe. `HitNote` and `SharedListPage` both need
  entries and the shared-list state.
- **`specs.js` already `require`s a fixture** (`EQUIPMENT_ENTRY`, line 17);
  the new states read `notes-both-kinds.json` and `qty-and-price.json` the
  same way rather than pasting plain payloads. A spec has no `storage` of
  its own - only a state seeds (parity.js 367) - so `#/l/ ~ shared` seeds
  `two` for `addedSharedToList`, and `~ shared, noted` seeds nothing for
  `tookSharedList`.
- **`TablesPage`'s local `toggleSel` (197-200) was the first copy**; the
  shared page is the second, so it moves to `AppState.toggleSel`.

## B5.6 built: the lists slice is closed, and a `svelte-check` narrowing trap (implementer, 2026-09-11)

- **The lists slice (`#/lists*`, `#/l/*`) is done as of `feat(lists): the
  shared list page`.** `plan.md`'s "Not built" list under "Phase 4" now
  names only `#/search` and `#/print/ci1-q1` as `pending` in
  `tests/parity/specs.js`. Whoever plans next picks one of those two, or
  scopes a first batch of one - there is no third `#/lists` follow-up.
- **`svelte-check`'s narrowing of a `$derived.by` nullable across an
  `{#if}/{:else if}/{:else}` chain needs the terminating negative check to
  be bare.** `ListPage.svelte`'s `own: StoredList | null` narrowed to
  non-null in the final `{:else}` only because the branch directly above it
  was `{:else if !own}` - a compound condition like `{:else if route.kind
  === 'sharedList' && !own}` sitting in that same position breaks it: TS
  cannot prove `own` is non-null from a chain of conjunctions it cannot
  fully enumerate (the component's own `Route` type has cases besides
  `storedList`/`sharedList`, even though `App.svelte` never actually mounts
  `ListPage` for one). Fixed by nesting the route-kind branch *inside* a
  bare `{:else if !own}`, keeping the outer chain's narrowing intact. Worth
  knowing before the next component that branches on both a route kind and
  a derived nullable in the same `{#if}` chain.
- **`exactOptionalPropertyTypes: true` (already on in `tsconfig.json`)
  rejects `{ tail: undefined }` for a `tail?: string` field, and rejects
  re-reading `m.qty` after only a `(m.qty ?? 0) > 1` check** (the boolean
  coercion does not narrow the property access). Two instances hit in this
  batch: `SharedListPage.svelte`'s `entries` now omits the `tail` key
  entirely rather than setting it `undefined`; `state/lists.svelte.ts`'s
  `addIds` meta-copy uses `typeof m.qty === 'number' && m.qty > 1` (and the
  same shape for `gold`) instead of the `??`-coerced comparison. Neither
  surfaced in `npx vitest run` - only `svelte-check`/`tsc` catch them, so a
  batch that skips the typecheck step before the full `npm run check` risks
  finding both at once inside the slow gate instead of a fast one.

## B5.6 reviewed and approved; the lists slice is closed (orchestrator, 2026-09-11)

- HEAD `ccbf345` (`feat(lists): the shared list page`) on top of `3324039`
  (the planning commit). Working tree clean; no peer commit landed during
  either dispatch - `git log` read the same two commits at closeout as at
  dispatch, with two interactive peer sessions live throughout.
- **Review verdict: approve, no blockers** (reviewer, against `ccbf345`).
  The three things this slice's reviews kept catching were all checked and
  all clean here: no affordance drawn but inert (every new interactive
  element is reached by a real event on at least one of the two proofs, not
  through a directly-invoked handler), no divergence from `app.js` in the
  ported behaviour or its product-text bytes, no contract file moved. Four
  risks and five nits recorded in `handoff.md`, "Deferred", not fixed - the
  batch's one remediation cycle went unused and there is no second review.
- **The `~ packed` cell's blind spot is the one worth acting on later**, and
  it is recorded rather than fixed: the driver's `expanded()` returns as soon
  as the hash leaves `#/l/~`, so two apps that both fail to decompress land
  on identical `#/l/zzzz` pages and the cell reads green. Same app-to-app
  shape `reorderedByDrag` closed with a throw; the close is one spec with
  `only: ['#/l/ ~ packed']`.
- **What is left of the migration: the search slice (`#/search`) and the
  print slice (`#/print/ci1-q1`)**, both still `pending` in
  `tests/parity/specs.js`, neither planned. The next session starts with a
  planner pass, not an implement dispatch. Print carries the heavier
  evidence requirement - the Figma nodes named in `CLAUDE.md` must be opened
  before any visual work.

## State at the search-slice kickoff (orchestrator, 2026-09-11)

- HEAD `16bc32e` (`docs(issue-47): B5.6 reviewed and approved - the lists slice
  is closed`), working tree **clean**, no `test-output/parity.lock`. HEAD is
  unchanged from this session's `SessionStart` reading.
- Host reading before anything heavy: RAM free 3.63 GB of 15.82 GB, **no
  `chrome.exe`**, 8 `node` processes (editor/tooling), 312 processes. Less
  headroom than the B5.6 kickoff's 4.44 GB; `npm run check` has exceeded the
  600s foreground cap under load before, so treat a timeout here as host load,
  not as a suite regression.
- `ListAgents` shows **three interactive peer sessions** on this tree
  (`daggerheart-loot-96` ~3h, `daggerheart-loot-ce` ~3h, `daggerheart-loot-15`
  ~1h); every other peer is offline. HEAD can move under this task - re-read
  `git log --oneline -3` before dispatching a writer and again at closeout.
- Human GOAL this session: finish the next batch. **The lists slice is closed**
  (B5.1-B5.6), so the two remaining Phase 4 slices are search (`#/search`) and
  print (`#/print/ci1-q1`); both are still `pending` in
  `tests/parity/specs.js:1540-1541` and neither has planning notes. The
  handoff's "Next batch" says the next step is a planning pass, not
  implementation.
- **Orchestrator picks search over print**, on the same sequencing grounds
  `plan.md`, "B5 planned" recorded when it picked lists: search reuses the row
  and the selection bar wholesale and is cheaper after lists, whereas print is
  a from-scratch visual surface whose evidence is the Figma nodes
  (`88Hhc89oY9Orcbvd2ok1Hx`, `714-42387`/`3773-90792`), and the Figma connector
  is **unauthenticated in this session**. That is a routing call; how the
  search slice is scoped and split is the planner's.
- Measured, so the planner need not: `renderSearch` is `app.js:2841-2859` -
  `pageHead('search')`, one `.panel` holding a `.field` with
  `input[type=search]#sq` (`autofocus`) and `kindChips()`, then a body that is
  one of three shapes: the no-query hint (`Начните вводить запрос` / `Start
  typing`), `selectAllHTML(res) + '<div class="rows">' + rowHTML(it) ...` over
  `SEARCHABLE.filter(kindAllows(kindOf(x)) && matches(x, q)).slice(0, 300)`, or
  the `t().nothing` empty. It is dispatched from the route table at
  `app.js:3574`. Every part named there already has a rewrite counterpart
  (`PageHead`, the kind chips, `RowMain`, the select-all row), so this looks
  like a small slice - but sizing it is the planner's call, not this reading.

## B6 planning facts - the search slice (planner, 2026-09-11) - durable, read before implementing

Read off `app.js`/`style.css` at HEAD `16bc32e` and measured with a
headless-Chrome probe of `file:///E:/dev/daggerheart-loot/index.html#/search`
at 1100x900 (puppeteer, 700ms after `domcontentloaded`; the script is not
kept). Design and steps: `plan.md`, "B6 planned".

- **Live code map.** `renderSearch` 2841-2859 (routed 3574, tab 3580);
  `matches` 2834-2840; `S.search.q` 58; `S.kind` 60 (one object for Core
  rules, the alternate tables and search; not cleared on `hashchange`
  4628-4636, never persisted - `tests/behave.js` 262-267); `KINDS`/
  `LOOT_KINDS` 2110-2112; `kindChips(list)` 2114-2127 (`data-last` +
  `title=keepOneKind` on the last one on, `aria-pressed`); `kindOf`/
  `kindAllows` 2131-2132 (anything with `eq` is `equip` - the Wondrous
  weapons stored as items obey the equipment chip); the kind handler
  4160-4164 (error toast when `data-last`); the `#sq` input handler 4333
  (`S.search.q = el.value; render()`); `keepFocus`/`restoreFocus`
  3740-3762; `selectAllHTML` 2763-2773; `rowHTML` 2785-2803; `selBox`
  2810-2815; `SEARCHABLE = ALL.concat(EQ)` 23 - the rewrite's
  `index.searchable` is `[...all, ...eq]` (`lib/data.ts` 144), same order;
  the cap `.slice(0, 300)` 2847; the hint strings inline at 2845 (`Начните
  вводить запрос` / `Start typing` - **not** dictionary keys); `pageHead`
  2145-2168; the sub lines `t().pages.search` 268 / 449; **no `help.search`
  key** (201-263, 382-445), so no help button. CSS: `.panel` 145-149,
  `.field` 150-151, `.lbl` 152, `.chips`/`.chip` 155-163, `input[type=
  search]` 254-257 and `:focus` 258, `.empty` 524-525, `.rows` 547.
- **Measured on arrival at `#/search` (ru, 1100).** `document.activeElement.id`
  = `sq` - the box **is** focused on a fresh open, `autofocus` attribute
  present, border `rgb(216, 171, 94)` (the `:focus` rule is in the first
  paint). Input computed: `15.5px Inter`, height `46px`, padding `0 14px`.
  `.panel` margin-bottom `16px` (inline style); the input's `.field`
  margin-bottom `16px`; the chips' `.field:last-child` `0px`. `.empty`
  reads `Начните вводить запрос`; no `.selall`, no rows; `.helpbtn` absent;
  `.homebtn` present. `#view` text starts `Поиск / Поиск по всем 1061
  позиции сразу — добыча, расходники и снаряжение, на русском и на
  английском. / ТИП / Предметы / Рас...`.
- **Measured row counts (all three kinds on).** `кольцо` 12, `зелье` 40,
  `меч` 87, `а` 300 (`Выбрать все (300)`), `о` 300, `zzzqqqxx123` 0 with
  `.empty` `Ничего не найдено`. `меч` with `Снаряжение` pressed off: 34
  rows, `Выбрать все (34)`, no `eq-*` badge left, `activeElement` is the
  chip `BUTTON` (the live `restoreFocus` re-focuses it after the redraw).
  `tests/behave.js` 136-162 additionally proves `катана`/`katana`/`КаТаНа`
  >= 4, `стресс` > 20, `двуручное` > 20 (assembled from `bu`, on no
  record as text), `снежный` 1 with equipment on and 0 with it off.
- **Focus mechanics the harness will see.** `d.type` calls `el.focus()`
  before dispatching `input`; `d.click` is `el.click()` (moves no focus);
  `arrive()`'s `EN` press is a `d.click`. So on every search state the box
  is focused on both apps, ru and en alike, provided the rewrite focuses it
  on mount. A chip press leaves the chip focused on the live app
  (`restoreFocus`) and naturally on the rewrite (no redraw); no
  `:focus-visible` ring is painted for a script click on either - the
  existing `#/roll/std ~ items only` cells already match under the same
  mechanics.
- **Rewrite facts that shape the batch.** `AppState.sel` is app-wide since
  B5.2 and its doc comment already names search as the second owner.
  `StdPanel`/`AltPanel` each hold a local `kinds` `$state` and `toggleKind`
  (StdPanel 51/91-97, AltPanel 49/98-104) over `LOOT_KINDS`; `isLastOn`
  (`lib/std.ts` 87-93) is generic and needs no change to judge `KINDS`.
  `Chip.svelte`'s button form writes `aria-pressed` and takes `title`;
  `Field.svelte` requires `label` today; `ChipRow`, `Empty`, `PageHead`
  (`help={null}` draws no button), `TableRows` (`ontoggleall` draws
  `.selall`; `view` prop), `RowMain`, `RecordModal` (`app, index, it,
  onclose, onopen?`), `SelBar` (mounted by `Shell`) need no change.
  `TablesPage.svelte` holds the only `input[type='search']` rules
  (`.toolbar input[type='search']` and `:focus`) and an inline `statLine`
  builder whose comment records that the live `matches` searches
  `eqLine(it)` *with* the type word. `App.svelte` still has a generic
  section fallback (`h1` + `.todo`) that search is the last user of.
  `lib/search.ts` has `matches(it, q, statLine)` and `search()`; its
  `search.test.ts` runs against the real `data.json`.
- **Harness facts.** `d.controls()` reads names off `button, a[href],
  input, select, textarea` and dedupes them, so a row count is not in the
  inventory - hence the `count` verb. `typeRuns`'s `search` probe is
  `.toolbar input[type=search]`; on every tables state `input[type=search]`
  resolves to the same element (the menu's own search box only exists
  from the eighth list, inside an open menu). `copiedSelection` ticks a
  second `Выбрано` then presses `Скопировать` - needs at least two rows.
  `#/print/ci1-q1` stays `pending` after B6.
- **Not a fact, a decision, recorded in `plan.md` "Decisions"**: the kind
  filter moves to `AppState` (live shape); the query stays with the page
  (`TablesPage` precedent, `STATE.md`).

## B6 built: durable facts for print (implementer, 2026-09-11)

- **`tests/parity/driver.js`'s `count(selector)` is `page.$$eval`, not
  `page.$eval`.** Puppeteer's `$eval` queries only the first match
  (`querySelector`) and hands one element to the callback; `$$eval` queries
  every match (`querySelectorAll`) and hands the array. Any future driver
  verb that counts or reduces over several elements needs `$$eval` - `has()`
  beside it is a single-match lookup and is not a template for this.
- **A component test that renders 300+ rows must not be typed into
  character by character.** `userEvent.type` fires one `input` event per
  keystroke, each re-rendering every row; under `vitest run --coverage`
  that alone pushed one case past the 30s default timeout. `userEvent.click`
  the field, then `userEvent.paste(text)`, lands the whole value in one
  `input` event. `tests/derived.js`'s own counts (1061 records) are far
  larger than anything a component test builds, so this only bites a
  fixture built for one test's own reason - the cap test here, and likely
  the only place in the app a screen ever draws hundreds of rows at once.
- **`SearchBox.svelte`'s `oninput` callback parameter needs an explicit
  type annotation at the call site.** `oninput={(v) => { q = v; }}` was
  flagged `@typescript-eslint/no-unsafe-assignment` in both callers
  (`SearchPage.svelte`, `TablesPage.svelte`) even though `SearchBox`'s own
  prop is typed `oninput: (value: string) => void` - the inline arrow
  function's parameter is not contextually typed through a component prop
  the way `AltPanel.svelte`'s `onchange={(n: number) => {...}}` already
  showed for `NumberField`. Write `(v: string) =>` at the call site, the
  same way the roll panels already do for their own callbacks.
- **`app.js`'s "основное оружие" (the primary-weapon type word) is not
  unique to weapon stat lines - it is ordinary prose in at least one
  record's own description** (`hi20`, "Кольцо Возвращения"). A test that
  asserts "every hit for this query is equipment" against the real
  catalogue is not safe; assert on one record's own built stat line
  instead (`statLineFor(...)`  called directly), not on `search()`'s
  output over the whole corpus.
- **`#/print/ci1-q1` is still `pending`** in `tests/parity/specs.js` after
  B6 - it is now the only Phase 4 slice left, and this session's Figma
  connector was unauthenticated, so the print batch's surface is
  unmeasured. A planning pass is needed before it is implement-ready.

## B6 reviewed and approved; the search slice is closed (orchestrator, 2026-09-11)

- HEAD `9d5ca02` (`feat(search): the search page`), working tree clean apart
  from this closeout's doc edits. The batch sits on `37ecc8d`
  (`feat(artwork): refresh audited polish batch`), a peer session's
  images-only commit that landed mid-batch and was preserved, not fought.
- **Review verdict: approve, no blockers; the batch's one remediation cycle is
  unspent.** Three risks and eight nits are in `handoff.md`, "Deferred". Two
  are worth carrying into any later session as facts rather than as chores:
  1. **B6 widened the `typeRuns` `search` probe** from `.toolbar
     input[type=search]` to `input[type=search]` (`tests/parity/specs.js:768`),
     which touches seven existing tables states, and **neither parity group B6
     ran exercises them**. The selector was verified by inspection only (the
     only other `input[type=search]` is `AddToList.svelte:210`, in the DOM
     only with the menu open, and no `typeRuns` state opens it). **CI is the
     proof - read those seven cells and the plain `#/tables` cells on the next
     run.** CI's five standing red cells are all `#/i/ci1`, so a tables
     regression would stand out.
  2. **A parity group reading `расхождений нет` does not by itself prove rows
     drew.** `foundRows`' figures (87 / 34 / stat line / 300) were compared but
     not printed, and an empty match on both apps would read green too. The
     reviewer closed it by other means this time; print the figures next run.
- Durable, and the reason no `ACCEPTED` or `VISUAL_DEBT` entry was written:
  `style.css:254-258` (the search box) is top-level with **no `@media`
  override**, so `SearchBox.svelte` is a complete port; and `app.js:60`'s
  `S.kind` is genuinely one object shared by Core rules, the alternate tables
  and search, which is why `AppState.kinds` is right and `plan.md`'s old
  decision heading "The kind filter is per panel, not per app" is now
  retired by its own body.
- **Cleanup:** the stray gitignored vitest cache at
  `app/src/components/app/node_modules/.vite/vitest/` (6.1 MB) and its
  otherwise-empty parent `app/src/components/app/` were deleted. Nothing
  tracked was touched.
- **Phase 4 has one slice left: print (`#/print/ci1-q1`).** It needs a planner
  pass, and its design evidence needs the Figma connector authorized by the
  owner - see `handoff.md`, "Next batch".

## State at the print-slice kickoff (orchestrator, 2026-09-11)

- HEAD `d696675` (`docs(issue-47): B6 reviewed and approved - the search slice
  is closed`), working tree **clean** - verified at kickoff, and it matches
  what `handoff.md` records. `9d5ca02` is the search code commit; `37ecc8d`
  below it is the peer session's images-only artwork commit, preserved.
- **B6 is closed** (built, verified, reviewed `approve`, no blockers, its one
  remediation cycle unspent). `#/print/ci1-q1` is the single remaining
  `pending` entry in `tests/parity/specs.js:1643` and the last Phase 4 slice.
- **Next action: a planner dispatch, not an implementer one.** Print has no
  measured surface and no planning notes anywhere in `plan.md`; the
  `handoff.md` "Next batch" section is a brief for planning, not for building.
- **The Figma connector is unauthenticated in this session too** (2026-09-11,
  Windows desktop app; `plugin:design:figma` is listed among the servers
  needing authorization, and a non-interactive session cannot run the OAuth
  flow). `88Hhc89oY9Orcbvd2ok1Hx`, nodes `714-42387` (colour) and `3773-90792`
  (black-and-white) therefore cannot be opened from here. This is owner action
  - claude.ai connector settings, or `claude mcp` / `/mcp` in an interactive
  session. Whether the port actually *needs* a vector export, or whether the
  live `app.js`/`style.css`/`img/` already carry everything the sheet draws,
  is a planning question and is not settled here.
- No check was run at kickoff: the tree is clean at a committed boundary and a
  planning pass writes only `issues/47/*.md`, which `bash-guard.mjs`'s commit
  gate exempts (`isExempt`: anything under `issues/`).

## B7 planning facts - the print slice (planner, 2026-09-11) - durable, read before implementing

Read off `app.js`/`style.css` at HEAD `d696675` and measured with a
headless-Chrome probe (puppeteer, the harness's launch args, reduced
motion, `ready()`'s waits, 250ms after each press) of
`file:///E:/dev/daggerheart-loot/index.html` on `#/print/ci1-q1`,
`#/print/nope`, `#/print/ci1-q1-q313-cc1-voa2_a3-q23-w51-q35-di11` and
`#/print/ci1-...-ci10` at 1100x900 / 768x900 / 375x812, in colour, after the
`Чёрно-белая` press, after `EN`, and once per route under
`page.emulateMediaType('print')`. The script is not kept. Design and steps:
`plan.md`, "B7 planned".

- **Figma is not needed.** `card/` holds 35 SVGs (2026-08-20..26):
  `banner`, `shield`, `burden-1`, `burden-2`, `ribbon`, `ribbon-mag`,
  `thbox`, `die-d{4,6,8,10,12,20}-{phy,mag}`, each with a `-bw` twin (the
  dice one `die-d<n>-bw`), plus `dots1`-`dots3` and `arrow` (no `-bw`).
  `app.js:3257` `CARD_ART = 'card/'`; `cardArt()` 3282-3291 builds exactly
  those names (in bw `die-d<n>-(phy|mag)` collapses to `die-d<n>`, then
  `-bw`); `PRINT_GLYPH` 3259-3266 (five inline paths) and the die hexagon
  (`clip-path`) are the only other shapes. `vite.config.mts` junctions
  `card/` into `dist/`; `CONTRACTS.md` section 5 freezes `card/*.svg`.
- **Live code map.** `PRINT_MAX = 180` 3235; `printAsked` 3237-3240
  (known, first occurrence), `printIds` 3241 (capped), `printHref` 3242,
  `printBtn` 3245-3249; `statBox` 3273; `cardArt` 3282-3291; `dmgStripHTML`
  3298-3320; `dieHTML` 3323-3331 (`DIE_ART` d4-d20); `thStripHTML`
  3333-3356; `printCardHTML` 3364-3425; `eqClassFor` 3430-3432 (`pk-*`,
  read by no rule); `fitPrintCards` 3438-3508; `renderPrint` 3510-3558;
  route 3610; `render()` calls the fit at 3829 on every print render;
  handlers 4236-4245 (`doPrint` = `window.print()`, `printBack` =
  `history.length > 1 ? history.back() : #/lists`, `printArt` sets
  `S.printBW` (49, app memory, never stored), `printLink` =
  `copyText(appUrl(printHref(printIds(S.printIds))), linkCopied)`);
  `descHtml` 661-690 (non-plain: `<br>` between consecutive plain lines,
  `<ul class="dlist">` lists, `<i>label:</i>` + the rest of the line with
  its leading space, never `<p>`); `printSrc` 954-958; `hasImage` 1675 (a
  print image has no `data-art` and never marks itself broken, 4597);
  `ICON_BACK` 1039. CSS: `.printbar`/`.printnote`/`.warnnote` 1112-1116,
  `.psheet` 1118-1126, `.pcard`...`.pc-bottom` 1128-1395 (no `@media`
  inside), `@media print` 1397-1414, `.seg`/`.seg.small` 72-81 + mobile
  880-881 + focus 1002-1005, `.card-acts` 405, `.dlist` 724-725.
- **Measured, 1100 (ru).** `h1.page-h` 36.8 tall at y=131.59 (23px/680,
  margin-bottom 4); `.page-sub` 528.28x22.39 (14px, `--muted`, 70ch,
  margin-bottom 18); `.card-acts` 1053x49 at y=212.78 (gap 6, padding-top
  3): `Назад` 100.48x46, `Отправить на печать` 203.81x46 (primary), the
  segment 192.67x46 (`align-self:stretch`; buttons 77.58x38 / 107.09x38,
  `padding 4px 12px`, 12px/650, letter-spacing 0.6px, **no
  `aria-pressed`**), `Ссылка на набор` 173.39x46; `.printnote` 417.77x58.13
  (12.5px/19.375, `--muted2`, 62ch, margin-top 12); `.printbar` 200.31;
  `.psheet` 793.69x1122.52 at (145.66, 349.91), padding 54.8/32.13,
  gap 7.56, columns 238.109 x3, shadow `0 0 0 1px rgba(0,0,0,.5), 0 14px
  40px rgba(0,0,0,.45)`; cards 238.11x332.59, the first at (177.78,
  404.7); document 1085x1681. English: `Back` 90.7, `Send to printer`
  160.53, segment 195.34 (`Colour` 65.22 / `Black and white` 122.13), `Link
  to this set` 153.34. `document.title` `Генератор лута — Daggerheart` /
  `Daggerheart Loot Generator`; no tab lit; `activeElement` `body`.
- **768 / 375.** The sheet keeps its 793.69px and sits at x=16 (`margin
  auto` cannot go negative): `scrollWidth` 810 at both. 768: everything
  else as at 1100. 375: `.page-sub` 44.78 (two lines); `.card-acts` wraps
  to three rows - `Назад` + `Отправить` (16..326.29), the segment alone
  200.67x43.19 (mobile `padding 8px 14px`, buttons 35.19 tall), the link
  alone - 150.19 tall; `.printbar` 323.89; sheet at y=479.48; document
  810x1951 (10 cards: 3092).
- **The empty page** (`#/print/nope`): `h1` + `.page-sub` `Печатать
  нечего...` + `a.btn.primary[href="#/lists"]` `Списки` 87.42x46 at
  y=212.78; no `.printbar`; document 900 tall.
- **Sheets.** 2 cards -> 1 sheet, 9 places, 7 blank; 9 -> 1/9/0; 10 -> 2
  sheets (second at y=1490.42, `data-next="1"`), 18 places, 8 blank,
  `Карточек: 10. Листов A4: 2.`; 181 known ids -> 180 cards, 20 sheets, the
  red note (`tests/print.js` proves the shape; not probed).
- **The fit, measured.** Every `.pc-strip .pc-box b` ends at inline
  `font-size: 2.2cqw` - `over()` never turns false (a block `b` in a
  shrink-to-fit box is never narrower than its text minus 2px) and the loop
  exits when `sz` reaches 2.1999999999999993 after eight `-= 0.1` steps
  from 3. Colour: `ci1` art `height 104cqw`, `--artw 97cqw`; `q1`
  `97.2203cqw` / `90.22033898305084cqw`; `q313` `101.881cqw` / `94.88...`;
  `cc1` `110.356cqw` / `100cqw`; `q23`, `q35` `71.3729cqw` / `64.37...`;
  `w51` `79.8475cqw` / `72.85...`; `di11` `51.4576cqw` / `44.46...`;
  `voa2_a3` text `3.3cqw`, `--pcpad` untouched, art `32.8136cqw` /
  `25.81...cqw`, no card `display:none`. Identical at 375. Black-and-white:
  no card of the nine needed a step (`.pc-text` 150-245px for texts up to
  145); the `-bw` head vectors read `complete` with real heights
  (`burden-*-bw` 24.66, `shield-bw` 24.7, `banner-bw` 37.31) by the time
  the probe looked, but the live fit had already run synchronously at
  render, before any load. Under always-tight conditions (computed): the
  font ladders stop at `3.0cqw` then `2.6cqw`; the pad floor is `8cqw` in
  colour and **`2.8cqw`** in bw (`5.8 - 1.5 - 1.5`; the loop stops when
  `pad > 3` fails).
- **Card facts.** `.pc-tier` text `1Ранг`, `.pc-bottom` `DaggerheartCore`,
  `.pc-cells` `УронфизЧертаПроворностьДистанцияВплотную` - no whitespace
  between siblings; `q1` `.pc-text` `innerHTML` `<i>Надёжное:</i> +1 к
  Броскам Атаки`; `voa2_a3` `<i>Стоимость Призыва:</i> 2<br>Эта колода...`
  (and it carries a list: `voa2_a3`, `voa2_a1`, `voa2_a6` have `- ` lines
  in both languages); `q23` bw: `ribbon-mag-bw.svg`, `die-d6-bw.svg`,
  `burden-2-bw.svg`; `q313` colour: `banner`, `shield`, `dots1`, `thbox`,
  `arrow`, `dots2`, `thbox`, `arrow`, `dots3`; `w51` `.pc-c1.wbonus` with
  `+3` and `d8`; `eq.th` is `[5, 11]` in the data while `lib/types.ts`
  says `string | null` (fixed in B7). The bw `.pc-head` is 18.09 tall on a
  loot card, 32.75 with hands, 31.78 with the shield.
- **Print media, live.** `header.topbar`, `nav.tabs`, `footer.foot`,
  `a.skip`, `.printbar` `display:none`; `body` `#fff`/`#000`; `main`
  `max-width:none; width:1085px; padding:0; margin:0`; `.psheet` `margin:0;
  box-shadow:none; break-inside:avoid`, `:last-child` `height 1122.14px`
  (296.9mm) against 1122.52 otherwise; `[data-next]` `break-before:page`;
  `.pcard` `break-inside:avoid`, `-webkit-print-color-adjust:exact`.
- **Rewrite facts that shape the batch.** `AppState.route` calls
  `parseHash(hash)` with the default `knows = () => true`, so the print
  route today keeps unknown ids; `router.canGoBack()`/`back()` already
  exist ("so a print page knows whether to offer one"); `DialogPort` has
  `confirm` only; `.seg` is already copied twice (`LangSwitch.svelte`,
  `TablesPage.svelte` 627-670, "not yet worth extracting on its own") and
  neither copy ports `.seg button:focus-visible`; `Button.svelte` ports no
  `.btn:focus-visible` either; `OrGrid.svelte` is the `generics=`
  precedent; `RecordCard` uses `<h2 class="card-name">` where the live
  writes `h2`, and the print card's live `<h3>` would fail axe's
  `heading-order` under the page's `h1`; `test/a11y.ts` switches off only
  `color-contrast` and `nested-interactive`; `ListPage.svelte` 905-926 and
  984-991 hold the `.page-h`/`.page-sub`/`.card-acts` copies to reuse;
  `data.json` is `{ items: { core_item: 60, core_consumable: 60, hnf_item:
  60, hnf_consumable: 60, wondrous: 119, community: 90, dread: 29, frames:
  94, voa: 108 }, alt, refs, eq: 381 }` - the first 181 item ids make an
  884-character route; puppeteer is 25.9.0 (`emulateMediaType(type?:
  string)`, `undefined` disables).
- Wall clock: group A `"#/print"` is 9 states / 54 cells, 24 `whole`;
  group B is 5 states / 30 cells. Each fits one foreground call; do not
  merge them.

## State at the B7 implement kickoff (orchestrator, 2026-09-11)

- HEAD `8b96ff4` (`docs(issue-47): B7 planned - the print slice, one batch`),
  working tree **clean** - verified at kickoff, and it matches what
  `handoff.md` records. `d696675` below it is B6's review close-out. No
  foreign commit moved HEAD since the planning pass.
- Nothing heavy is running on this tree: no `chrome.exe`, no parity run, no
  vitest. The node processes present are the desktop app's own MCP servers.
- **Next action: one implementer dispatch for B7** - the batch is
  implement-ready (`handoff.md`, "Next batch"; `plan.md`, "B7 planned"),
  `NEEDS_HUMAN_CONFIRMATION: no`, blockers none. Tier: economy default
  (sonnet) - no prior implement failed on this batch, and B5.x/B6 all
  landed at that tier.
- **Figma stays unauthenticated in this session** and stays a non-blocker:
  the planner settled that the port needs no export ("B7 planning facts"
  above). Do not wait on the connector.
- No check was run at kickoff: clean tree at a committed boundary, and the
  implementer's own `npm run check` is what arms the commit gate for the
  tree it actually builds.
- Review is expected after this batch: new UI, nine new parity states, and
  `tests/parity/specs.js` changes all match the risk rules.

## B7 built, then remediated (implementer, 2026-09-11) - one durable fact

**`0.01ms` is not zero, and the popular reduced-motion snippet ships it.**
`app/src/styles/tokens.css`'s `@media (prefers-reduced-motion: reduce)` block
carried `transition-duration: 0.01ms !important` on `*`. A non-zero duration
starts a real `CSSTransition` on every inline style write, and a transition's
value at t=0 is the **old** one - so any code that writes an inline style and
reads the layout back synchronously reads the pre-write layout. That is exactly
what `PrintCard.svelte`'s `fit()` does, so `tight()` never turned false, all
three ladders ran to their floors, the first cards on each sheet lost their
art, and 50 of 54 group-A parity cells went red at `4776243`. The live app's
reduced-motion rules (`style.css:311`, `:544`) kill two named animations only
and leave `transition-duration` at its initial `0s`, which is why the live app
reads correctly. The parity harness runs every cell under
`prefers-reduced-motion: reduce` (`tests/parity/driver.js:649`), so this
surfaces in parity and nowhere else - CI would have read it red too. Fixed to
`transition-duration: 0s !important`; nothing in `app/src` listens for
`transitionend`/`animationend`, so the transition bought nothing.

**The first pass's "`cqw` instability class" was a false diagnosis and is
deleted everywhere, not softened.** It is not in `docs/parity.md`'s "Two
unstable classes" and must not be added: the staleness reproduces on a
non-container element with px units, `document.getAnimations()` returns a
`CSSTransition` on the rewrite and `[]` on the live app, and with
`transition-duration: 0s` injected the live `fitPrintCards` run verbatim over
the rewrite's DOM reproduces the legacy numbers exactly. **The standing lesson,
which this task has now paid for three times: a "measured" fact written into a
durable doc outlives the session that wrote it and is read as settled. Measure
the mechanism, not the correlation, before writing one down.**

The remaining group-A residue after the fix - 4 image cells, a different
non-overlapping 3 on a re-run of the same build, every `cardFit`/`sheetCounts`
cell agreeing - is the already-documented `whole:true` full-page capture class
and is CI's to adjudicate: `handoff.md`, "Blockers", first entry.

## The print image residue, measured a third time (orchestrator, 2026-09-11)

A status, recorded so CI's reader does not re-derive it. After `ee73d2e`, on a
quiet host with nothing else running, `MSYS_NO_PATHCONV=1 node tests/parity.js
"voa2_a3-voa2_a1" "ci1-q1-q313"` read **4 расхождений** - a third set, again
not the same one:

- run 1 (implementer): `NINE @ en 1100`, `NINE @ en 768`, `LONG @ en 768`,
  `LONG @ ru 1100`
- run 2 (implementer): `NINE @ ru 1100`, `NINE @ ru 768`, `NINE @ en 1100`;
  both `LONG` states clean
- run 3 (orchestrator): `LONG @ en 1100` (3.10%), `LONG @ en 768` (3.53%), and
  two `NINE` cells; the `LONG` pair clean in run 2 is red here

Three runs, three non-overlapping sets, one unchanged build. The diff image for
`LONG @ en 1100` was opened rather than inferred: all nine cards carry their
art on both sides and no text differs - the red is an edge outline over
**every** element on the page, the topbar, the tab row and the footer legal
text included, none of which B7 touched. That is a whole-page one-pixel shift,
i.e. `docs/parity.md`'s existing "Full-page captures" class, whose recipe is
re-run, write nothing, let CI decide. No `VISUAL_DEBT` entry was written, and
`docs/parity.md` gains no third class.

The `cardFit` numbers - the thing that actually broke and was actually fixed -
agree on both apps at every width in every one of these runs.

## The CI read on `9fd3000`: print is clean, four table-anchor debts moved down (orchestrator, 2026-09-11)

Run [`34616445556`](https://github.com/artex-x/daggerheart-loot/actions/runs/34616445556),
push of `9fd3000`, four parity shards. `check`, `audit` and `secrets` green.
Shards 1 and 4 green; **shards 2 and 3 red, on three cells, all of them
`VISUAL_DEBT` ratchet failures** - "стало лучше - опусти число в VISUAL_DEBT".
No other cell failed anywhere in the run.

**The print blocker is closed by this read.** All **54** `#/print` cells -
every one of the nine states, both languages, all three widths, the 24
`whole:true` ones included - read `совпадает`. The 4-cell image residue this
host measured three times, in three non-overlapping sets, was this machine's
paint, exactly as `docs/parity.md`'s "Full-page captures" class predicts. No
`VISUAL_DEBT` entry was ever written for it and none is needed; `handoff.md`,
"Blockers", first entry can be marked resolved.

**What is red.** The four `375` anchor cells, which had been dead stable at
their recorded figures across the two preceding CI runs (`34588378763` and
`34591864170`, identical to the hundredth), all moved **down** on `9fd3000`:

| cell | recorded | prior two CI runs | this run |
|---|---|---|---|
| `#/tables/core_item ~ row anchor @ ru 375` | 10.52 | 10.51 | **9.35** FAIL |
| `#/tables/core_item ~ row anchor @ en 375` | 9.92 | 9.92 | **8.85** FAIL |
| `#/tables/voa ~ section anchor @ ru 375` | 11.55 | 11.55 | **0.00** FAIL |
| `#/tables/voa ~ section anchor @ en 375` | 10.31 | 10.31 | 9.86 (passes, 0.45 under a `DEBT_SLACK` of 0.5) |

The `@ 1100` and `@ 768` members of those states are unmoved (`0.42%`/`0.43%`
of their own debts). Two facts the next reader should not re-derive: the move
is **caused, not noise** - three consecutive CI runs agreed to the hundredth
before it, and the only global change in between is B7's
`transition-duration: 0.01ms` -> `0s` in `tokens.css`, which is the one edit
that could touch a state whose subject is a re-played flash; and the `ru`/`en`
split on `voa ~ section anchor` (**0.00 against 9.86** on the same state) is
not explained by that, and is the reason this is a planning question rather
than a mechanical edit.

**Not settled here, by design:** what numbers to write, whether a cell reading
`0.00` once has its entry deleted or waits for a second reading (the existing
reasons in `specs.js` cite "three CI runs and the ubuntu container", and
`tools/parity-ubuntu/` reproduces CI), and whether this rides alone to get
`main` green or merges with the next batch. Planner's.

**Tree at this read:** HEAD `9fd3000` == `origin/main`, working tree clean but
for untracked `issues/tg-preview-refresh/`, which belongs to another task and
is preserved.

## B8 planning facts - the anchor debts after B7, measured (planner, 2026-09-11) - durable, read before implementing

Read off the source at HEAD `9fd3000` and measured with two read-only
puppeteer probes that drive the harness's own `tests/parity/driver.js`
(`prepare`, `open`, `click('EN')`, `viewport`, `settle` - the run's exact
arrival and sweep) against `index.html` and a fresh `npm run build` of
`dist/index.html`, on `#/tables/voa/tA` and `#/tables/core_item/ci1`, both
languages, reading `scrollY`, `scrollHeight`, the target's viewport top and
whether `.flash` is on it at the moment the shot would be taken. The scripts
are disposable and were not kept. Windows host: **the scroll positions are
mechanism evidence, not `VISUAL_DEBT` figures** (owner decision 1). Design and
steps: `plan.md`, "B8 planned".

- **The sweep, as the harness runs it today (arrive at 1100, resize through
  768 to 375 on one document):**

  | state | lang | app | 1100 | 768 | 375 | `.flash` at shot |
  |---|---|---|---|---|---|---|
  | `voa ~ section anchor` | ru | legacy / next | 9642 / 9642 | 9642 / 9642 | 9642 / 9642 | no / no |
  | `voa ~ section anchor` | en | legacy / next | 9616 / 9616 | 9616 / 9616 | 9616 / 9616 | **yes / no** |
  | `core_item ~ row anchor` | ru | legacy / next | 368 / 368 | 368 / 368 | **374 / 368** | no / no |
  | `core_item ~ row anchor` | en | legacy / next | 346 / 346 | 346 / 346 | **352 / 346** | **yes / no** |

  Document heights agree on both apps at every width (voa 11061 / 11523 /
  19332 ru, 11035 / 11477 / 18630 en; core_item 5890 / 6129 / 10065 ru, 5850 /
  6041 / 9696 en). On `voa` neither app is adjusted by the resize at all: the
  section's top sits 531px then 7423px below the viewport at 768 and 375 -
  the 375 shot of the section-anchor state is a slab of the Vault of Ages
  table thousands of pixels above its subject, in both apps.
- **`core_item @ 375` is the reduced-motion transition policy, measured, not
  correlated.** The live app leaves every declared `transition` alive under
  `prefers-reduced-motion: reduce` (`style.css:311` and `:544` kill two
  named animations and nothing else), so when the viewport crosses 600px its
  mobile overrides animate over ~150ms and Chrome's scroll anchoring adjusts
  the scrolled document by 6px across those frames. The rewrite's
  `tokens.css` reduced-motion block writes `transition-duration: 0s
  !important` on `*` (B7; it was `0.01ms` before, a two-frame transition that
  yielded a different adjustment - the old 368 -> 387 reading in the
  `specs.js` note), so it gets no adjustment. Proof: the live app with
  `*{transition-duration:0s!important}` injected lands at **368** at 375 in
  both languages - exactly where the rewrite lands. The converse was tried
  with `.selbox{transition-duration:.15s!important}` alone injected into the
  rewrite and it did **not** reproduce the 6px, so the transitioning element
  is another of the live rules with a mobile override, not `.selbox` alone;
  which one is B9's to measure, not B8's. This closes the "something else is
  in there as well and has not been found yet" sentence in the `specs.js`
  note: the something else was the transitions.
- **The `ru`/`en` split on `voa ~ section anchor` is not a scroll
  difference on this host.** After the `EN` press the two apps sit at the same
  `scrollY` at every width; the one measured difference is the `.flash` class,
  which the live app re-plays on the language switch (`render()` re-parses the
  hash into `S.tables.anchor` every time and runs the scroll-and-flash block,
  app.js 3832-3845) and the rewrite never re-plays (`TablesPage.svelte`'s
  effect is guarded on `app.navigations`, which `setLang()` does not bump). At
  375 the flashed section is 6918px below the fold, so on this host the `en
  375` cell would be near zero; CI's 9.86 is therefore made of something this
  host does not reproduce - see the CI diff-image reading below.
- **Fresh arrival at each width (what `timed: true` does), for the record:**
  ru identical on both apps at every width (voa 9642 / 10064 / 16955;
  core_item 368 / 458 / 567); en `core_item` identical (346 / 436 / 545); en
  `voa` **1px apart at 768** (10018 / 10017) and **8px at 375** (16428 /
  16436) because the live app re-scrolls to the English anchor on the `EN`
  press and the rewrite is left where scroll anchoring put it. So flagging
  the anchor states `timed` would zero the four ru cells and the core_item en
  cells but make `voa @ en 768` worse than its recorded 0.42 and leave `voa @
  en 375` several percent - and the container is not evidence for a timed
  state, so every en number would wait on CI. Rejected for B8; the re-play
  on language switch is the real fix and is B9's.
- **`docker` on this host cannot run the ubuntu container today:** `docker
  --version` answers (20.10.8) but `docker info` panics in the client
  (`reflect: indirection through nil pointer`), so the daemon is unreachable.
  The container step in B8 is optional and falls back to CI as the second
  reading.
- **Shard map for the two anchor states** (`tests/parity.js:350`,
  `stateIdx % 4`, shard names 1-based): `voa ~ section anchor` is state 57
  -> shard 2; `core_item ~ row anchor` is state 58 -> shard 3. Run
  `34616445556`'s artifacts: `failure-output-parity-2` (134 MB) and `-3`
  (142 MB), unexpired at planning time.
- **`RecordPage.svelte:59` draws `notFoundSub` as `<p class="miss">` where
  the live app draws `<p class="page-sub">`** (app.js:3195) - a real
  divergence on an unphotographed state (`#/i/<unknown id>` has no parity
  state). Noticed while inventorying the furniture copies; it is B10's (the
  furniture pass) and is recorded there, not fixed here.
- **`toggleAllIn` stays at two copies.** `ListPage.svelte` ticks its own
  `lsel`, not `app.sel` (lines 340-345), so the "third caller moves it to
  `AppState`" rule in the handoff has not triggered; B10 leaves it.
- **CI's own diff image for `voa ~ section anchor @ en 375`, read (artifact
  `failure-output-parity-2` of run `34616445556`, downloaded to the session
  scratchpad, outside the repository):** rows 10-13 of the Vault of Ages
  table (Shaman's Blade, Mastery Bell, Mossblossom Staff, Harrowcleave) with
  every line doubled - no content difference. Aligning CI's `-legacy.png`
  against its `-next.png` at every vertical shift from -60 to +60: the best
  fit is **22px, 2.52% residual** (the fixed topbar and the ring), against
  20.77% at 0px; the same for `@ ru 375` is **0px, 0.00%**, and for `@ en
  768` **0px, 0.43%** (the ring). So on ubuntu the two apps are 22px apart
  in scroll position in English at 375 and coincide in Russian - the
  English-only divergence is the live app's re-scroll on the `EN` press,
  which this host happens to converge on and CI does not. A deterministic
  mechanism, not an unstable one: three runs at 10.31 to the hundredth,
  then 9.86 once the transition policy changed. The alignment script is
  disposable and was not kept; the artifact is outside the tree and expires
  with the run's retention.

## The CI read on `435a5ac`: B8's second reading, parity green (orchestrator, 2026-09-11)

Run [`34628983995`](https://github.com/artex-x/daggerheart-loot/actions/runs/34628983995), the owner's push of `274aa99` + `435a5ac`, four parity
shards. This is the reading B8 was designed to wait for, and it agrees.

**All four parity shards green**, `audit` and `secrets` green. Shards 2 and 3 -
the two that failed on `9fd3000` - now pass:

| cell | recorded by B8 | on `9fd3000` | on `435a5ac` |
|---|---|---|---|
| `#/tables/core_item ~ row anchor @ ru 375` | 9.35 | 9.35 FAIL vs 10.52 | pass |
| `#/tables/core_item ~ row anchor @ en 375` | 8.85 | 8.85 FAIL vs 9.92 | pass |
| `#/tables/voa ~ section anchor @ ru 375` | entry deleted | 0.00 FAIL vs 11.55 | no cell to fail |
| `#/tables/voa ~ section anchor @ en 375` | 9.86 | 9.86 (0.45 of slack) | pass |

Two facts the next reader should not re-derive. **The deleted `voa @ ru 375`
entry is now safe**: a second independent run with no cell to fail is what the
ratchet's rule wanted before a `0.00` could lose its entry, so the deletion
stands on evidence rather than on one reading. And **the 54 `#/print` cells are
`совпадает` for the second consecutive run**, which closes the print residue
question for good - the four-cell image residue measured three times on the
Windows host was that machine's paint, and no `VISUAL_DEBT` entry exists or is
needed.

**The one red in the run is not parity and not B8's.** The `check` job failed
on the legacy `behave` suite against the **live** app - `FAIL приложение
открылось не на поиске`, `failed to find element matching selector ".subchips
.chip.on"`, 18.8s - with all 20 other legacy suites green. B8's five paths are
`tests/parity/specs.js`, `tools/parity-ubuntu/README.md` and three
`issues/47/*.md`; none can reach the live app. `behave` was green on `9fd3000`
an hour earlier and on `37ecc8d` before that. The owner identified it as flaky
and re-ran the failed jobs (attempt 2; a re-run of failed jobs leaves the four
green parity shards alone). If it recurs on a clean tree it is a real
live-app regression and belongs to its own task, not to issue 47.

**Tree at this read:** HEAD `435a5ac` == `origin/main`, working tree clean but
for untracked `issues/tg-preview-refresh/`, which belongs to another task and
is preserved.

**One cheap correction made in the same pass:** `plan.md` had no `### B9
outlined` heading - the section's text ran straight on from "B8 built", while
`plan.md`'s own Phase 4 summary and `handoff.md`'s "Next batch" both send
readers to "B9 outlined" by name. The heading is restored; no content changed.
