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
