# Issue #47 - vanilla JS to Svelte + TypeScript

**Status: historical - done, 2026-09-17.** Task 47 (the migration) closed at
R0c. This file is a record, not instructions: read it for design rationale
and rejected alternatives, not as a live plan. It was scheduled for
retirement at this point (see "What 'task 47 is done' means" below, point
6) but the owner decided to **keep it permanently** instead - `bash-guard.mjs`
denies its deletion while a tracked citation stands, and that citation
belongs to a different, in-progress task whose own plan forbids touching it
(`issues/47/handoff.md`, "Blockers", has the full account). Every durable
fact this file held has a permanent home regardless -
`docs/specs/DEBT.md`, `docs/specs/COVERAGE.md`, `.claude/README.md`,
`docs/REFACTOR_PLAN.md`, and `issues/47/handoff.md`'s "Phase 8 opening
inputs" - so keeping this file costs a few dozen KB and loses nothing.
Phase 8, the post-migration review, runs under its own issue once the owner
files it.

Source: [issue #47](https://github.com/artex-x/daggerheart-loot/issues/47). That
issue is the agreed plan; this file is the working copy, plus the decisions
taken while carrying it out. Where the two differ, the difference is written
down here with a reason.

**Compacted 2026-09-16 and again at closeout, 2026-09-17** per
`.claude/skills/handoff/SKILL.md`, "The budget". Every shipped batch's
implement-ready brief, steps, file-by-file build notes and command output
collapsed to an outcome line plus its commits; the code, the specs and `git
show` are the record. Full pre-2026-09-16 text: `fc59ce4`. Full text as it
stood right before the closeout compaction: `git show
d78b60f:issues/47/plan.md`. Kept: the design, the decisions and the
alternatives rejected on the way, blockers, and every measurement that
cannot be re-derived from the repository.

## What must survive

Static site, no server, no build required to open it, lists in the URL hash,
two languages, GitHub Pages, `file://`. These are in `docs/specs/META.md` and
`docs/specs/CONTRACTS.md`, which outlive this file.

## Phases

| Phase | What | State |
|---|---|---|
| 0 | Baseline, inventory, durable specs, golden fixtures, coverage matrix | **done** |
| 1 | Vite + Svelte + TypeScript scaffold, quality gates, CI, contracts frozen | **done** |
| 2 | Extract pure logic to TypeScript modules with unit tests | **done** |
| 3 | Ports for replaceable concerns (drag and drop, search, modal) | **done** |
| 4 | Svelte component architecture, styling, i18n, the rewrite itself | **done (closed through B10; row corrected 2026-09-12)** - measured against Phase 8's own entry condition 1: `tests/parity/specs.js` has **no `pending` state and no `pending` spec**, and `VISUAL_DEBT` is 18 entries, every one a CI figure. Phases 5 and 6 both closed after it. See below for the slice-by-slice record |
| 5 | Testing pyramid: unit, component, a11y, the real-browser net | **done (2026-09-12)** - B11 (`73facda`+`64f9a27`), B11.1 (`e94a90e`), B12 (`a52c17d`, `9a4f8db`, `4adc5a5`, `9ced2b3`). The net is `tests/app/` driving `dist/` in a real browser. No Playwright exists or was built; the puppeteer legacy suites are re-homed and are deleted in R0c. The one production defect the net found, B12.1, opens Phase 6 |
| 6 | Build, artefacts, deployment | **done (2026-09-12)** - B12.1 (`bc96b59`) then B13 (`0819a73`, `9177f3b`, `a004764`, `515e257`). The site serves the built rewrite; run `34718569245` green in every job, the owner walked it. **Not owner-gated**: `gh api repos/:owner/:repo/pages` reads `build_type: workflow`, so the "Pages flip" this row was written around was already done - what published the old app was one step in `ci.yml`'s `deploy` job. See "Phase 6 - the cut-over, replanned" |
| 7 | Cut-over, cleanup, README, standing agent guidance | **done, 2026-09-17.** B14, R0a, R0b and R0c all shipped - R0c in five commits plus one review-remediation cycle (`5b2e693`, `23c00a6`, `5d2ddf9`, `b9d84ce`, `d6371e7`, `fdd015f`), CI green in every job, the deployed site verified by hand. See **"R0c designed: the sweep, the deletions, and the cliff"** at the end of this file for the design; `issues/47/handoff.md` for the exact commands and results |
| 8 | Post-migration review: the app on its own terms | designed (2026-09-11), **confirmed with four revisions (2026-09-12)**; it runs under a **new task id**, so task 47 closes at R0c. Design: "Phase 8" below; runs after the cut-over, on the register B9 opens (`docs/specs/DEBT.md`) |

## Phase 4 - where the rewrite is

Built, and matching the live app exactly in both languages at all three widths.
The record page and the five roll routes came first, then Tables across B1-B4,
then the lists slice across B5.1-B5.6, then `#/search` (B6) and `#/print` (B7).
**After B7 no state in `tests/parity/specs.js` is `pending`**; the per-state
inventory is `STATES` there, and after R0a it is `tests/app/inventory.js`.

### What the `VISUAL_DEBT` entries turned out to be, and the correction that cost four batches

The entries were filed as six causes; a human reading `#/tables/community` at
full width proved **three of the six were defects wearing a debt reason**, and
everything built on them was wrong with them:

- cause 5 ("search-box placeholder antialiasing") was `TablesPage.svelte`
  writing `font-size: 14px` where the live app inherits 15.5px - the
  placeholder is 25px narrower, not identically rendered;
- cause 6 ("a description line wrapping one word earlier on a phone") was
  `TableRows.svelte` missing `style.css:820`'s
  `@media (max-width:600px){.selbox{width:38px}}`, which makes `.rt` 196px
  instead of 200px at 375 and pushes rows near a wrap point onto an extra line
  - a consequence of a 4px column, not of kerning;
- the `~ panel open` entries blaming the space in `любое` on rasterisation were
  a third: Svelte trimmed that space out of the markup entirely.

The standing lesson: **"the add-to-list and print row" absorbed the tier ladder
for weeks, and "antialiasing" then absorbed three real defects.** A reason that
can explain any number explains none. B3.5 fixed all three and re-baselined the
debt; B3.6 built the instrument (`typeRuns`, `geometry`, the `DEBT_SLACK`
ratchet) that fails loudly on that class. The genuinely-not-a-defect causes that
remained are the deferred controls (the add-to-list/print row, the toast, the
selection bar) and help-panel rasterisation, measured at 0.29-2.12% with the
box, every paragraph, every line box and the colour identical to three decimals
and the text matching character for character.

Two real bugs surfaced while building the anchor, both fixed rather than filed:

- **A font-loading race put the scroll target a few pixels off.**
  `scrollIntoView` computes where to land from the layout at the moment it is
  called; the monospace numerals in `.rnum` and the toolbar shift a row by a
  handful of pixels when the fallback face swaps for the real one. Deterministic
  once isolated, and invisible to `document.getAnimations()` - a font swap is
  neither a CSS animation nor a transition. Fixed by waiting on
  `document.fonts.ready` before scrolling; the flash still fires immediately, as
  the live app's does, since it does not depend on layout.
- **`SectionHead.svelte` was missing style.css's mobile override for
  `.tsec-link`** (`padding:11px;margin-bottom:2px` under 600px). Every section
  heading was 10px shorter than the live app's on a phone, and a `.tsection`'s
  top offset compounds down a table - the third instance of "one constant offset
  reads as growing drift", after B1's toolbar margin and B2's `.field:last-child`
  cascade tie. `CLAUDE.md` now carries the rule: port a rule with every `@media`
  override it has.

### The tables surface, and how it splits

Tables was too big for one slice: 79 top-level rules in `style.css` and **four
different body shapes**. Split at boundaries chosen so nothing had to be faked:

| | what | why it is a boundary |
|---|---|---|
| **B1** | the plain table: two-level chip nav, the toolbar, rows and tiles, selection, the empty state, a row opening the modal | the four tables with no filter (`core_item`, `core_consumable`, `hnf_item`, `hnf_consumable`, 60 rows each, one kind each - checked against `data.js`) |
| **B2** | the filter: the bar, the chosen pills, the folded panel, reset, the filter link, the `f_` segment | unlocks `wondrous` and `dread` only - `community` has a `comm` facet *and* a sectioned body, so it waits for B3 |
| **B3** | sectioned bodies and section anchors: `voa`, `frames`, `community`, and the two alternate tables | the anchors `#/roll/alt`'s crit box already links to |
| **B4** | the equipment tables, their facets and tier sections | the last body shape |

Three things found while planning the slice, all still standing:

- **The parity driver could not type.** A table's query lives in `S.tables.q`
  and never enters the hash, so no URL reaches a searched table - the same hole
  that let the Core rules help print its own markup. B1 added
  `type(placeholder, text)` to the driver, gripping by the placeholder because
  that is the text a person reads, not by `id="tq"`.
- **Search reuses the row wholesale** (`renderSearch` calls the same `rowHTML`
  and `selectAllHTML`), which is why search is its own later slice: the row is
  written once for tables and extracted on its second use.
- **A selection belongs to the page it was made on.** The live app clears `S.sel`
  on every `hashchange` - route strings cannot tell one table from another - so
  the rewrite resets it when the hash changes, not when the component unmounts.

### Phase 4's batches, as built

| batch | outcome | commits |
|---|---|---|
| **B1** the plain table | shipped. `TablesPage.svelte` holds every table id; `lib/tables.ts` holds `TABLE_GROUPS`, `SUB_LABEL`/`subLabelOf`, `groupOf`; `Chip` grew an `href` form and a `size="sm"` variant. Found while building: a legacy grid-numbering bug (`list.map(tileHTML)` passes the array index as a roll-number override) **deliberately not reproduced**; two spacing bugs from values guessed instead of read; Svelte's whitespace collapsing changes what `textContent` says, so the row's accessible name is deliberately its whole content, not a label | `345498a` (plan), `64e79a0` |
| **B2** the filter | shipped; `lib/facets.ts` (new, pure), `FilterBar.svelte` (new - the strip and the panel in one component because the live app draws them from one function), `TablesPage` stays the owner of the address. Unlocked two tables, not three | `a82ddd0` |
| **B3** sectioned bodies and section anchors | shipped. `lib/frames.ts` (new; frame order is a book-authored fact, not inferred from row counts); `Index` grew `altColumn(kind, rarity, col)`; the row/tile markup became a real component rather than a snippet; the anchor effect lives in `TablesPage.svelte`, keyed off `app.route` | `2970c03` |
| **B3.5** the absorbed parity debt | shipped: the three defects above fixed, 49 debt entries deleted, the focus glow restored. One entry got worse and it was B3.5's own fix that did it - confirmed, not assumed. `.selbox`'s specificity confirmed in the rendered build rather than by reading | `a58dd97` |
| **B3.6 part 0** the harness fast enough to use | shipped: a content-addressed cache for the **legacy** screenshots, keyed on every input that can change their bytes (the three root files, `data.js`, `img/`, `og/`, `card/`, the driver and `parity.js` itself, plus the state's own source, the `whole` flag, the language and the viewport list); `--no-cache`; `--shard=N/M`; parity leaves the pooled CI run for its own 4-way sharded job; `expectNoA11yViolations` clears axe's `_running` flag so a timed-out test no longer takes its file down | `f7308a9` |
| **B3.6 part 1** the red CI run | shipped. The complete failing set (22 cells) came off run `34361836525`'s `failure-output` artifact, not off `gh run view --log-failed`, which showed about a dozen lines. Fixes: `.helpbox` never got the `animation: pop` line style.css gives it (three help states); stale numbers re-baselined to CI | `38cfbbb`, `fb8cb0d` |
| **B3.6 part 2** the instrument that would have caught them | shipped: `typeAt(probes)` in the driver, a `typeRuns` spec (`perWidth`), `parity.js` split into `looks` and `measured`, and the `DEBT_SLACK` ratchet so a paid-off entry fails instead of passing in silence. **A state carrying a `measured` spec cannot use part 0's legacy screenshot cache** - the cache stands in for the viewport switch as well as for the shot, and a `perWidth` probe has to run at a real viewport | `958f182` |
| **B4** the equipment tables, their facets and tier sections | shipped. Found while building, not anticipated: **`allEquip`'s concat order was backwards**, in code that had had no caller since Phase 2 and that B4 was the first to call | `fde9cdc` |
| **B5.1** the list store, the toast, the add-to-list row | shipped. `popover="manual"` measured pixel-identical on every new state at every width in both languages; the fallback was not needed. Deliberate divergence, recorded: the live `addIdsTo` toasts `addedTo` unconditionally right after `saveLists()` has toasted `saveFailed`, so a real storage refusal is never seen in the live app - `AddToList.svelte` checks `save()`'s return value first | `fe0043b`, `d1c1367` |
| **B5.2 part 0** green CI, two unstable classes named | shipped, no production code: five CI-red `VISUAL_DEBT` entries deleted, `timed: true` on `#/i/ci1 ~ toast` and `#/roll/wondrous ~ pinned`, a `geometry` spec for the one full-page state, and `shot(whole)` retaking a full-page capture until two in a row are `Buffer.equals()`, capped at four | `f167e62`, `4210ee3` |
| **B5.2 part 1** the selection bar | shipped: `app.sel` (a `SvelteSet`) and `clearSel()` on `AppState` because the bar lives in the frame, not on the page; `SelBar.svelte`; `shareSelection`; the driver's `click(name, nth)`. **No `VISUAL_DEBT` number was written from this host** | `ff741ad` |
| **B5.3** the lists index | shipped after one real blocker: the batch first stopped at "STOP AND REPORT", `#/lists` not reaching 0.00% for a reason outside the six the plan named. Close-out decision: the storage notice re-folds on a language switch, which is the live `render()` behaviour - see the `data-keep` working rule below | `ba8f4b1`, `e82cd24` |
| **B5.4a** the list page | shipped, no deviation. Ten new states read `совпадает` on every cell in both languages at all three widths on the first pass - no port fix needed, no group re-run | `f38b900` (step 0), `8873473`, `fe38973` |
| **B5.5** the list page complete - drag, and the actions under a ticked selection | shipped, no deviation. **The fallback was not needed**: the synthetic `DragEvent` sequence in `driver.js`'s `drag(from, to, after)` drove the live app's own handlers correctly on the first attempt | `a006792`, `ba0a92d`, `d6c951f` |
| **B5.6** the shared page, the packed link, the bad link | shipped, no deviation. `#expand()` (the live `expandHash`) is guarded by `plain.startsWith(PACK_MARK)` so a port that cannot decompress lands on `#/l/zzzz` instead of looping. Its review found what became `DEBT.md` D2 | `ccbf345`, `16bc32e` |
| **B6** the search slice | shipped, no design deviation. `KINDS`/`Kind` replaced a bare literal union; `statLineFor` moved off `TablesPage`'s inline builder; `app.kinds`/`toggleKind` became the third owner of the live `S.kind` | `9d5ca02`, `d696675` |
| **B7** the print slice | shipped, no design deviation; `#/print/<ids>` draws in full and the fit is ported verbatim. Measured deviations from the brief's own numbers, neither a defect: `dist/assets/*.css` does not exist (Vite inlines component styles into the iife bundle for this project), and `card/` holds 36 files, not 35. One genuine defect diagnosed wrong at first and then fixed: the reduced-motion blanket kill starts a `CSSTransition` whose t=0 value is the old one, breaking `fit()`'s synchronous read-back | `4776243`, `ee73d2e`, `9fd3000` |
| **B8** the anchor debts follow CI's read of `9fd3000` | shipped. `docker info` panics on this host (client-side, `reflect: indirection through nil pointer`), so the container fallback was unavailable and the second reading stayed CI's. Four `375` anchor entries became three: `core_item @ ru 375` 9.35, `core_item @ en 375` 8.85, `voa @ en 375` 9.86 (CI run `34616445556`); `voa @ ru 375` deleted, CI reading 0.00 - the ratchet admits no passing figure for a `0.00` cell | `274aa99` |
| **B9** the anchor re-play, the live reduced-motion policy, the behaviour-debt register | shipped, no design deviation, then one remediation pass. `TablesPage`'s effect keys on `${navigations}` plus `${lang}` and does the element lookup inside the `fonts.ready` `.then`; `tokens.css` lost the whole `@media (prefers-reduced-motion: reduce)` block; `docs/specs/DEBT.md` was created with D1-D4 | `ad46dac`, `84ca6df` |
| **B10** the page-furniture extraction pass | shipped with one real deviation in `PageTitle`'s markup, found by a test rather than by `svelte-check`. `Panel`, `Actions`, `NoData`, `PageTitle` extracted and swapped into every caller, each caller's own `.panel` block deleted | `8b0c3ce` |

## Phase 5 - what already exists

The pyramid arrived alongside Phase 4 rather than after it: unit and component
tests with per-file coverage thresholds, `a11y.test.ts` running axe on
**pressed** states plus a guard that fails when a component has no named state
rendering it under axe, and `tests/parity.js` driving both apps in a real
browser. What was left of Phase 5 was Playwright, and whether it was still
needed is answered in "Phase 5 - the testing pyramid, planned", decided 1: no.

## Phase 8 - the post-migration review: the app on its own terms (planner, 2026-09-11)

Asked for by the owner at the B9 kickoff (`context.md`, "The owner's answer on
B9, and a post-migration review step"): achieve full parity now, write down what
parity made the rewrite keep, and add a separate step where the migrated app is
reviewed, its issues found, and those fixed together with everything already
recorded as deferred or ported-not-fixed. This section is that step's design. It
is not implement-ready - it cannot be until Phase 7 has happened - but its entry
condition, its batches, its gates and its register are decided here so that B9
can open the register today.

### The register: `docs/specs/DEBT.md`

**What it is.** The third category beside `VISUAL_DEBT` and `ACCEPTED`. A
`VISUAL_DEBT` entry is a pixel difference not yet reproduced; an `ACCEPTED`
entry is a *difference* kept on purpose, keyed and enforced (a stale key
fails the run). Neither can hold a defect the rewrite reproduced *because
the live app has it*: there is no difference to key, both apps are
identical by construction, and the harness will never mention it. That is
what the register holds, and it is the one of the three that must outlive
the migration - the other two are deleted with the harness.

**Where, and why there.** `docs/specs/DEBT.md`, a spec file, listed in
`CLAUDE.md`'s spec table. Reasons: `docs/specs/` is what every agent reads
for a touched path and it is the one place `CLAUDE.md` says durable
behaviour belongs; a spec file survives the task directory's retirement and
the harness's; and an entry *is* a behaviour statement ("the app does X; X
is wrong; here is why it does it anyway").

Rejected homes: `tests/parity/specs.js` beside `ACCEPTED` (nothing keys an
identical behaviour, and the file goes when the static root does); a section in
`docs/parity.md` (the runbook is the harness's and retires with it); a section
in `docs/specs/FEATURES.md` (the product spec should say what the app does, and
an entry saying "and this is wrong, fix it later" in the middle of it would
either be read as behaviour or skipped - the register cross-references
`FEATURES.md` bullets instead); `issues/47/` (retired with the task, and Phase 8
needs the register as its *input*); GitHub issues, one per entry (outlive the
task but not in the tree, need `gh` and a network, and cannot carry a rule or a
measurement verbatim - R1 files issues *from* the register instead); the
READMEs (a reader's document, not a maintainer's).

**Shape.** A short header (the two sibling categories, the rule that the
batch which pays an entry deletes it - the same ratchet culture as
`VISUAL_DEBT` - and that a new entry is written in the batch that makes the
decision, never later), then two sections: **defects reproduced on purpose**,
and **live decisions kept over the rewrite's own**. Each entry is a
`### D<n> - <name>` with six filled fields, the file's own header being the
authority on them now that it exists. One is load-bearing and is repeated
here: **Where** quotes the live rule or code with its `style.css`/`app.js`
line *and a commit hash it can be read at*, because the live source is
deleted at the cut-over and a line number into a deleted file is no evidence.

**The entries.** B9 wrote D1 (transitions run under
`prefers-reduced-motion: reduce`), D2 (a stale packed-link expansion rewrites
the address after the reader has left), D3 (the storage notice's dismiss button
inside its `<summary>`, with axe's `nested-interactive` off suite-wide to allow
it) and D4 (one kind filter shared by Core rules, the alternate tables and
search - section 2, a decision rather than a defect), all citing `bb61db0` as
the commit the live lines are read at. They live in `docs/specs/DEBT.md`; the
verbatim copies this plan carried for the implementer to paste are collapsed now
that the file exists. The register stands at nine entries - D1, D2, D3, D5, D6,
D7, D10, D8, D4 in file order.

**The sweep of `handoff.md`'s "Deferred" and "Notes", classified.**
Everything there was one of four things, and only the second went in the
register: *ported-not-fixed* -> `DEBT.md` (D1, D2, D3); *a live decision
kept* -> `DEBT.md` section 2 (D4); *a port defect* -> fixed in the batch
that owned it (the anchor never re-playing on a language switch, B9;
`RecordPage.svelte`'s `.miss` where live draws `.page-sub`, B10); *a
refactor or doc nit* -> B10, Phase 7's sweep, or Phase 8 R1/R2 by surface.
The disposition table itself is collapsed - R0a's C2 carried the
`ACCEPTED`/"Recorded, not keyed"/`VISUAL_DEBT` half of it into
`FEATURES.md` (`30b2744`), and the rest landed in B10, B12.1 and the
`DEBT.md` entries above. Two entries are worth keeping out of it because
they are measurements, not intentions:

- **`Button.svelte`'s "missing `:focus-visible` ring" is a stale claim,
  measured false.** The ring is the global rule in `tokens.css:150`, gold
  2 px at 2 px offset in both apps; the one difference is the focused
  button's radius, 9 px (`--r-sm`) against the live rule's `8px`. The 1 px
  radius is Phase 8 R1's keyboard walk, not a batch.
- **The harness's own limitations die with it**: the parity-coverage gap on
  `href`, no keyboard-focus state, no equipment anchor state, the width
  sweep not being a state, language leaking through `localStorage`, probes
  not extended past tables. What replaces them is R0a's goldens and the
  `tests/app/` suites.

### Where the phase sits

Phase 8 **follows** the cut-over. Every fix it makes is a parity regression by
construction - that is the definition of the register - so while the static root
is the expectation and the parity shards are the gate, each fix would need a
`VISUAL_DEBT` or `ACCEPTED` entry to go green, which is the "keep the
improvement as debt" option the owner rejected for D1. The review part of R1
(read-only) could run earlier, but its findings could not be acted on, and a
finding list that sits for a phase goes stale; R1 runs once, on the app people
are using. (The order this section first named, `B9 -> B10 -> Phase 6/7,
owner-gated`, was superseded 2026-09-12 in its order and its gate only; the
reasoning stands.)

**"Migration complete", the entry condition, spelled out:**

1. Phase 4 closed: no `pending` state in `tests/parity/specs.js`,
   `VISUAL_DEBT` empty or every entry a CI figure with a current reason;
   B9 and B10 landed and read by CI.
2. Phase 7 done. **Corrected 2026-09-12** - the first draft said "the owner has
   switched Pages to GitHub Actions", written on the belief that Pages still
   served a branch; measurement says it was already switched (see "Phase 6 -
   the cut-over, replanned"). It now reads: **B13 has landed, a `deploy` run
   has published `dist/`, the static root is retired by R0, and `main` is
   green.**
3. **A regression net that does not need the live app exists** - the
   load-bearing one. **Decided, 2026-09-12** (Phase 5 planned, decided 1, 2
   and 6): the net is the parity driver re-pointed at `dist/` with a
   trusted `press` verb (`tests/app/`, B12), and after the cut-over
   rendering is proved by named invariants, numeric laws asserted against
   their source, and structural text goldens per state (accessibility tree
   plus controls inventory) seeded from `dist/` at R0 under the last green
   parity run's warrant - no Playwright, no PNG goldens, no frozen
   measured-spec JSON.
4. The `ACCEPTED` sweep done: when `specs.js` retires, every `ACCEPTED`
   reason and every "Recorded, not keyed" divergence has become a
   `FEATURES.md`/`STATE.md` bullet or been dropped with a reason in the
   commit - otherwise the fixed-not-ported decisions are lost with the file.
   **Satisfied by R0a's C2** (`30b2744`).

### The batches

**R1 - the review.** Read-only; one artefact, in a new task directory so
this file can retire with issue 47.

- *Surfaces*: every state in the inventory at the moment of retirement, both
  languages, 1100/768/375, on the deployed `dist/`. **Revised 2026-09-12:**
  the surfaces come from the structural goldens, not from
  `tests/parity/specs.js`, which no longer exists after R0c.
- *Against*: (a) `docs/specs/DEBT.md` - each entry re-verified as still true
  and given a decision (fix in R2-Rn, keep and delete the entry with a spec
  bullet, or file); (b) `FEATURES.md`, `STATE.md`, `I18N.md`, `META.md` -
  each bullet observed on the built app in both languages, and a bullet that
  is not observable is a finding; (c) accessibility in a real browser, not
  jsdom: axe over every state with `color-contrast` **on**; a keyboard walk of
  every route, **reading focus styles only after `getAnimations()` is empty**,
  because the rings transition for 150 ms (D1) and a t=0 read shows the
  pre-transition values; a screen-reader pass by hand of three flows (the toast
  over the record modal - the unverified B5.1 claim; the storage notice, D3;
  ticking rows and using the selection bar); a reduced-motion pass (D1's fix
  design); (d) the backlog, each line marked open or closed against the tree.
- *Output*: `issues/<id>/review.md` - a findings table (id, surface, evidence,
  class, decision), the register updated, one GitHub issue per `file`. No
  production code.
- *Fix in the phase versus file*: fixed in R2-Rn - every `DEBT.md`
  section-1 entry, every `a11y` finding, every `defect` with a local fix and
  a test, every nit in a file a fix batch opens. Filed - a redesign, a
  feature, a harness rewrite, anything the owner has to design (D1's real
  reduced-motion policy is proposed by R1 and confirmed by the owner at the
  phase's planning pass; that pass is expected to carry
  `NEEDS_HUMAN_CONFIRMATION: yes`).

**R2 .. Rn - the fixes**, grouped by surface and gate, sized by `CLAUDE.md`'s
"size a batch by its gates": one component family, one seed, one net filter
per batch. The expected grouping, revised by what R1 finds: *R2 - motion and
focus* (D1's policy, the focused-button radius, the `.toast.act` display guard
test, whatever the a11y sweep finds in `tokens.css`, `Button`, `Chip`, `Seg`);
*R3 - lists and storage* (D2, D3 with `nested-interactive` back on, D6, the
`works()` re-probe, `AppState.stop()`'s timer, `ListStore.load()`, the
`AddToList` nits, the shared-list spec bullet); *R4 - rolling and search* (D4's
outcome, B6 nits 4/5/7/11, the B4 nits - **revised 2026-09-12:** R4 loses the
roll re-render, which B14 fixed, it being a divergence from live rather than a
live defect reproduced); *R5 - the rest*, or folded into R2-R4 by surface.

Each fix batch: a test per fixed defect, the spec bullet in the same commit,
`npm run check`, `npm run check:built`, the net's filter for its surface, and
the register entry deleted in the commit that pays it.

**Exit.** `DEBT.md` section 1 is empty or every remaining entry names the
filed issue; section 2 is decided; `review.md` has no row without an outcome;
the handoff records exact commands and results. After that the register stays
as the place a *future* "kept on purpose" decision is written.

## Decisions taken while working

### `base: './'`, not `base: '/daggerheart-loot/'`

Phase 1 item 6 of the issue asks for the absolute Pages base path. That
contradicts the `file://` requirement stated in the same issue's opening
constraints: an absolute base breaks every asset URL when the page is opened
from a folder. Relative URLs work identically on Pages, so nothing is lost.
Recorded in `docs/specs/META.md` section 4.

Consequences: one classic IIFE bundle rather than modules (Chrome refuses
modules over `file://`), no code splitting, `data.js` stays a classic script
assigning `window.LOOT`, and a build smoke check opens the built page from a
folder.

### Publishing is not gated by CI until Pages is switched over

GitHub's own `pages-build-deployment` publishes the configured branch on every
push regardless of Actions. Nothing in a workflow can prevent that. The fix is
**Settings -> Pages -> Source: GitHub Actions**, after which the `deploy` job in
`ci.yml` is the only route and it `needs: [check, audit, secrets]`.

**Still outstanding on the repository owner's side.** Until it is flipped, a red
build can go live.

### Parity compares states, not routes

A route only ever reaches the first paint, in the default language, at one
width, above the fold. That is how the modal shipped four times too wide with
none of the card's buttons while every check stayed green. `STATES` is now
multiplied by `LANGS` and `WIDTHS`, so a state written for one reason is checked
for five more, and a debt is keyed `"<id> @ <lang> <width>"`.

The full rule, and what the run measures about itself, is in `CLAUDE.md` under
"This is a refactor, not a redesign".

### The pre-commit hook was removed

It ran `eslint --fix` over staged files: over 150 seconds for three of them on a
mounted working copy, against 3.5 for prettier, and eslint's own CPU time was
half a second - the cost is reading `node_modules`, not linting. It was also a
strict subset of `npm run check`, which CI runs on every push, so the only thing
it added was a reason to pass `--no-verify`. A guard that gets waved through is
worse than no guard.

### The build completes `dist/`

`dist/` never contained `img/`, `og/` or `card/`; the build emits the
application and the pictures are made outside it. Invisible until Core rules
made the opening screen draw four cards, at which point the `file://` smoke run
failed on five missing `.webp`. A `closeBundle` hook links the three folders in -
linked rather than copied, because 80 MB per build is not worth paying for a
folder that has not changed, and `junction` makes that work on Windows without
elevation. `tests/parity.js` used to lay the same links itself; that workaround
is gone.

### The tier ladder was missing, behind a debt reason that hid it

`lineStepsHTML` in `app.js` draws the row of tier buttons on equipment that
belongs to an upgrade line - Палаш, Улучшенный, Продвинутый, Легендарный are
one weapon at four tiers, and the ladder is how a person moves between them.
`upgradeLine` was extracted and tested in Phase 2; no component ever called it,
so the row was never drawn.

It stayed invisible because every `#/i/q1` debt was filed as "the add-to-list
and print row" and that route was short of two things. The number looked
explained. Porting the ladder took the route to **exact at four of its six
cells** and to 0.1% at the other two, which is the add-to-list row peeking
above the fold - so the ladder had been almost the whole difference all along.

Two things came with it, both faithful rather than invented:

- **a rung opens the record over the page.** The live app answers `data-open`
  with the modal, on the record page as well as from a roll, so `RecordPage`
  now has one - which also makes the card's picture work there, as it does in
  the live app. `onopen` carries the record because the ladder opens a
  different one.
- **each rung is named.** The live app gives it a `title` and a digit for its
  content, and content wins the accessible name, so a screen reader hears
  "button, 2" three times with nothing to tell them apart. An `aria-label`
  carrying the same string the title does fixes it, and the parity inventory
  reads the same on both apps - so there is nothing to record in `ACCEPTED`.

### The Core rules help shipped with its markup showing

`helpFor` modelled a paragraph as text, links and an optional bold lead-in.
That covered the four sections ported first and quietly failed on the fifth:
the Core rules paragraph listing where each rarity fits is one paragraph with
four `<br><b>Word</b>` lines inside it, and the port kept it as a string with
the tags in it. Svelte escapes what it renders, so the panel said
`<br><b>Обычная</b>` in both languages, on a screen that has been "finished"
for weeks.

Nothing caught it because nothing looked. Coverage renders the panel, axe reads
its structure, and neither reads prose; the parity harness would have seen it
at a glance and Core rules had shipped without a `~ help` state. That state
exists now, and a paragraph is a run that can carry a break and a bold word -
which the tables and lists help will need as well, because both use `<b>`
mid-sentence.

### The kind filter: per panel first, then per app (B6)

The live app keeps one `S.kind` for Core rules, the alternate tables and
**search**, so switching consumables off on one screen switches them off on the
others. The rewrite gives each panel its own, which is what
`docs/specs/STATE.md` argues for everywhere else: what was *asked* on a page
belongs to the page. Nothing compares it - no parity state navigates between
two roll modes - so it is written down here rather than caught. Search is where
a person would notice, so batch C is where this decision comes due, and
`AppState` is where it would move to.

**This has nothing to do with the tables filter**, which is what the first
version of this entry said and what the B1 handoff then repeated as an open
question. Tables narrows by `S.fOn.kind` - its own object, cleared whenever the
table changes (app.js:3622) - and has never shared `S.kind` with anything.
B2 has nothing to reconcile here.

**Came due in B6 (planner, 2026-09-11): the kind filter moves to `AppState`
as `kinds`/`toggleKind`, shared by Core rules, the alternate tables and
search, memory only and untouched by navigation - the live shape.** What
stays per page is the *query*: the live `S.search.q` and `S.tables.q` both
survive a route change in memory, and the rewrite's `TablesPage` and
`SearchPage` both forget theirs on unmount. That is an intentional
divergence: one page's own memory is not a cross-page contract, no parity
state can observe it, and `STATE.md`'s rule ("what was asked on a page is
not remembered") is the one the rewrite keeps. See "B6 planned", "Decided".

### Every icon in a button is 15px, whatever its attribute says

`style.css` has `.btn svg{width:15px;height:15px}`, and it beats the `width`
attribute in the markup. The external-link icon is written at 13 and drawn at
15; `lib/icons.ts` had copied the 13. Nothing noticed until the alternate
tables put that icon inside a button for the first time, and the crit box came
out four pixels narrow per link. The rule now lives in `Button.svelte`, with
the `.btn .dieicon` counter-rule the live app also writes, because a die is a
different shape at a different height.

The general form of this is already a standing rule in `CLAUDE.md` - copy the
behaviour, not the intent - and this is its second instance after the 74px
number field.

### The two dice name their own controls

The live app calls both number fields "Result of the roll" and all four
steppers "One lower" / "One higher". On the one screen with two dice that
means a screen reader hears the same two controls twice and nothing says which
die is being changed. The rewrite puts the die in front of each name. That is
the accessibility exception in `CLAUDE.md`, and it is recorded in `ACCEPTED` in
`tests/parity/specs.js` - eight entries, one per state per language, all for
the control inventory.

### `PageHead` was extracted at the third use

The heading row, the two round buttons and the help panel they fold open were
written twice - `RollPanel` and `StdPanel` - about thirty lines of markup and
two hundred of style each. The alternate tables would have been a third copy,
so both were deleted into `components/PageHead.svelte`. The existing parity
states are what verified it: nothing moved.

### A red run has to leave something to read

Every suite's whole output goes to `test-output/<name>.log`, and the workflow
uploads that directory - with `dist/` and `coverage/` - whenever the job fails.

### Phase 0 kept the puppeteer suites

The plan moves to Vitest and Playwright. The existing suites are the baseline
the migration is measured against, so they stay until the code they test is
gone. `tests/contracts.js` is written in the same style deliberately - it has to
run today, against the current app, or it is not a baseline.

## Working rules during the migration

From the issue, unchanged:

- repo files are authoritative; do not depend on chat history
- small vertical slices, each with its own tests
- never break a public contract without updating fixtures, `CONTRACTS.md`,
  `llms.txt` and the tests in the same change
- update `docs/specs/*` in the change that alters behaviour, not afterwards
- pure logic free of Svelte and DOM; ports for replaceable behaviour
- strict TypeScript, `any` is an error
- scoped CSS and tokens, plain CSS only
- never infer a tier from stats
- every defect fix gets a test
- bad deploys are fixed by `git revert`

Added during the migration:

- DOM-only transient state - an open `<details>`, a `hidden` toggle - survives
  a language switch in the port only where the live app marks the element
  `data-keep` (`restoreOpen`, app.js 3769-3775: the roll panel, the note box,
  the list note); everywhere else the port re-creates the element on
  `app.lang` with `{#key}`, because the live `render()` builds it fresh. The
  harness presses `EN` after `enter`, so an unkeyed element shows up as an
  English-only non-zero cell. In-page actions that happen to call `render()`
  (create, delete, rename) are not a reason to fold anything. (B5.3
  close-out; the notice on `#/lists`.)

## Phase 5 - the testing pyramid, planned (planner, 2026-09-12)

The owner's GOAL, verbatim, is in `context.md`, "State at the Phase 5 kickoff".
In one line: retire the flaky legacy browser suites into the existing
infrastructure, challenge every quality gate, review the pyramid for gaps,
decide whether the legacy suites can be run against the rewrite, and recommend
the P6/P7/P8 order. Everything below is measured on `9e3d19f`; the numbers are
in `context.md`, "Phase 5 planning facts".

### What the tree has, said plainly

**There are no Playwright tests, and never were.** `package.json` carries no
`@playwright/*`; no `*.spec.*` file exists. What the owner calls "the
playwright tests" is the **puppeteer** legacy set: 20 suites under `tests/`,
8.7k lines, run by `tests/run-all.js` (1m57s of the `check` job's 3m40s on run
`34643510887`). Three of those are not browser suites at all: `derived`,
`i18n` and `dataint` are node-only, and the first two run directly inside
`npm run check`. They are not retired by this plan.

**`tests/contracts.js` is a contract gate**, named by `CLAUDE.md` and
`docs/specs/CONTRACTS.md`. Its pure half (list encoding re-derived by a second
implementation) and its browser half (fixtures replayed on the live app) are
the evidence that `hash.test.ts`, `listLink.test.ts` and `i18n.test.ts` are
replaying real contracts rather than recording what the new code does. The
browser half is re-pointed at `dist/` (B12); the live-app copy is deleted only
when the live app is.

### Decided

**1. The regression net is the parity driver, re-pointed at `dist/` alone,
with real input. No Playwright.** Measured before choosing:

- *Can a legacy suite run against `dist/` at all?* Yes, for the state-free
  sweeps: `typo` passes against `dist/index.html` with exactly two changes
  (`ROOT`, and `ready()`'s `#view` becoming `#app`), and so does `audit2` at
  1180. `hues` fails 16 assertions for a reason that has nothing to do with the
  app: it injects bare `<span class="badge item">` elements and reads their
  colour, and the rewrite's `.badge` rules are Svelte-scoped. That is the shape
  of the other thirteen: they grip the live DOM by `data-act`, `data-open`,
  `data-copy-*`, `#modal`, `#selBar` (`behave` 35 such selectors, `lists2` 29,
  `select` 28, `print` 24, `flows` 23, `states` 21, `qa` 18, `notes` 12,
  `eqtest` 9, `noart` 6), none of which the rewrite emits. A re-point is a
  selector rewrite, and a selector rewrite of a suite whose assertions already
  live in a component test is waste.
- *What the parity harness cannot see.* `driver.js` presses a control with
  `el.click()` inside `page.evaluate` - a synthetic dispatch, the same kind
  jsdom's `userEvent` makes. Defect 2 below is invisible to both and visible to
  a real click, measured both ways on both apps. A net without trusted input has
  a hole exactly where the owner found one.
- *Why not Playwright.* A second browser dependency and a second driver for the
  same verbs `driver.js` already has (`open`, `click`, `type`, `seed`,
  `storage`, `hash`, `title`, `clipboard`, `controls`, `computed`, `typeAt`,
  `rectsAt`, `metrics`, `shot`), a second CI browser install, and nothing
  puppeteer cannot do here.

**2. After the cut-over, rendering is proved by named invariants and
structural text goldens - no pixel goldens, and no frozen dump of the
measured specs.** Rewritten 2026-09-12 after the owner reopened the question
and asked the better one: once there is no second implementation to diff
against, the instrument is not "how do we keep parity" but "what proves the
rewrite renders correctly on its own terms". Three instruments, all in the
real-browser layer B12 builds, none of them a bitmap:

- **Invariants that name what "correct" means**, one sentence each, failing
  with that sentence: the eight `audit2` checks (no sideways scroll, no text
  wider than its box, every control named, no dead link, broken image,
  duplicate id or stray `undefined`); axe with `color-contrast` on over every
  page; a focus-ring walk; a menu or form that opens lies inside the box that
  clips it; the dialog is inert behind and returns focus; a keystroke keeps
  focus; the type scale and badge hues; and **a computed-style anchor per
  control family asserted against `styles/tokens.css` rather than against a
  number** (body and search-box `font-size` equal, `h1` at its token, the card
  at `min(440px, 100%)`, `.selbox` 42/38 at the 600 breakpoint) - which is the
  shape of every B3.6 defect.
- **Numeric laws, asserted against their source, not recorded from a run**: the
  print sheet (63x88 mm at 96 dpi, nine per A4, page breaks, the
  black-and-white layout, the fit ladder's written numbers); the three
  breakpoints; the bundle budget.
- **Structural text goldens per state**: the accessibility tree
  (`page.accessibility.snapshot()` - puppeteer has had it for years, no new
  dependency) plus the controls inventory the harness already computes,
  compared strictly, regenerated with `--update` and read as a text diff in the
  commit that changes a screen. A structural golden says *what* changed where a
  pixel golden says only *that* something did.

*Where the goldens' authority comes from.* They are generated from `dist/` at
R0a under the last green **full** workflow run at that commit: for every state
the two apps matched there, so a snapshot of `dist/` is a snapshot of the
shipped app. That is the only moment such a file can be seeded honestly.

*What it cannot catch, said honestly.* A pure repaint that breaks no stated
rule: a colour swapped for another accessible colour, a wrong icon path,
padding off by a few pixels inside a box that still fits, a wrong picture
behind a correct `alt`. Nothing automatic sees those without a bitmap, and a
bitmap only says "changed"; the honest answer is that a person looks at the app,
and Phase 8 R1 is that pass. Which failures this repository has actually had,
all invariant-shaped and none of them a colour: a control at 14px where the body
is 15.5px, a mobile-only override ported at the base width only, a trimmed text
node that moved a hint 4.3px, a decoder heuristic met on a different code path,
a listener racing a microtask checkpoint, and a menu re-measured from the wrong
side of its button. The pixel harness found the first three only because a
second implementation existed to diff against; the last three it could not see.

*Rejected, each with the reason it loses:*

1. **Freezing the measured JSON specs** (this point's previous text). A golden
   in JSON clothing: `typeRuns` advances and `geometry` rects are one screen's
   numbers, every deliberate layout change invalidates them wholesale, and a
   diff of `668.3 -> 671.1` says nothing about right or wrong. The *questions*
   those specs asked survive as invariants and laws; the numbers do not.
2. **Committed PNG goldens** (CI-only, one width and language). A bitmap says
   changed, not wrong; the figure is one machine's; a whole-page percentage is
   blind to a control (B3.6); every deliberate change is a human eyeballing a
   diff image and re-blessing, which is the workflow this migration has spent
   batches escaping.
3. **A hosted visual-regression service** (Percy, Chromatic, Applitools).
   Bitmaps again behind a paid approval screen; an external service for a
   static-file project whose product law is "no backend".
4. **Playwright's screenshot assertions** (`toHaveScreenshot`) - goldens,
   rejected for what they are, not for the tool. **Playwright's aria snapshots**
   (`toMatchAriaSnapshot`) - the right idea, and it is adopted: puppeteer's
   `page.accessibility.snapshot()` yields the same tree, so the idea comes
   without the second driver. **Vitest browser mode** - would remove the
   `<dialog>` shim and the trusted-event blind spot at component level, but it
   swaps the coverage instrument's environment and duplicates what `tests/app/`
   does with the app assembled; a Phase 8 spike, filed, not planned. **axe over
   real pages** - adopted.
5. **Nothing beyond the component tests.** The "Known thin spots" list is the
   reason, and both owner defects were invisible there by construction.

*Playwright specifically.* Two of decided 1's three reasons still apply to a
post-cut-over rendering check, and one does not, quite: Playwright's golden
management and trace viewer are real conveniences that puppeteer lacks. They
are conveniences for a golden workflow this point rejects, so the rejection
stands - but for that reason, not by inheritance.

**3. The 20 suites, each with a fate.** Timing rule: a browser suite that tests
the live app is deleted in the batch that deletes the live app, never before -
until then it is the gate on what Pages serves. A suite's *assertions* are
re-homed first, so that the deletion batch is mechanical. **The fate table
itself now lives in `docs/specs/COVERAGE.md`** (R0b.1's C4, `92c239b`); the
version this plan carried was the pre-audit intent, and "The ten verdicts"
below is what measurement made of it. What it established and R0b did not
change: `derived`/`i18n`/`dataint` are kept (node-only); `contracts`'s pure
half is kept as is because a second implementation of the codec is the point;
`audit2` and `typo` port as is; `hues` is rewritten to read computed colour off
rendered badges rather than injected spans; `states` is superseded.

**No replacement yet, said honestly** (the "Known thin spots" that stay):
`hover: none` (touch highlight); the share sheet's success path (no headless
share sheet exists; the fallback is tested); real clipboard hardware (the
harness stubs `navigator.clipboard`, and the stub is what `tests/app/` keeps -
the port's happy path *is* exercised, the OS clipboard is not); print fitting
until R0b.3.

**4. The coverage gates, each with a verdict.** Measured on `9e3d19f` (998
tests). Raised where the bar sat thirty points under the measured floor:
`src/lib/**` lines/functions 90/90 -> **95/95**; `src/state/**` 90/90/80/90 ->
**95/95/85/90**; `src/ports/**` functions 70 -> **80**; `Button.svelte`'s
branch exception 50 -> **60**. Kept, each for a stated reason: `src/lib/**`
branches/statements (three points of room is a bar, not a ceiling);
`src/ports/**` lines/branches/statements (`compress.ts` sits one point over
each, and the happy paths are Chrome's); the components glob (two files sit
*on* the branch bar, and B12 adds the branch each is missing rather than moving
the bar); `DiceBar.svelte`'s 55 (attribute update paths); and the exclusions,
with `src/main.ts`'s and `src/ports/image.ts`'s reasons rewritten to name what
actually reaches them. The enforced numbers are in `vite.config.mts`.

**5. The two axe rules off.** `color-contrast` **stays off in jsdom** (it lays
nothing out) **and goes on in the browser layer** over every page of the sweep
- the first place contrast is measured on the *rewrite* rather than on the live
app. `nested-interactive` **narrows from suite-wide to per-call**, an `allow`
only in the tests that render `StorageNotice` (D3), so the rule is live on the
other 45 components; D3's fix deletes the `allow`.

**6. The pyramid, and the layer that is missing.** What nothing reaches, by
mechanism rather than by percentage: **trusted input events** (jsdom and
`el.click()` both dispatch synchronously, so no microtask checkpoint runs
between listeners, and the rewrite flushes in one - Svelte 5, `dom/task.js`);
**native `<dialog>` semantics** (shimmed in jsdom); **the ports' happy paths**
(clipboard, `CompressionStream`, the canvas conversion); **contrast, fonts, the
type scale, overflow, clipped text, unnamed controls and broken images on the
rewrite** (the legacy suites measure them on the live app only); **two tabs**;
**keyboard**; **print geometry**. The missing layer is **one real-browser layer
against `dist/` with real input** - not a second component layer, and not more
jsdom. Component tests are not thin: every component is reached and every one is
under axe in a pressed state; what they cannot do is the list above, and no
amount of them will.

**7. The two owner-reported defects - measured, root-caused, placed.**

*Defect 1, `#/tables/frames`: pick "Пир зверей", then "Колоссы Сухоземья" ->
the filter resets and the table empties.* **Reproduced on `dist/`, with real
and synthetic clicks alike. The live app does it too - but only when the link
arrives, not while picking**: live in-page after the second pick reads 57 of 94
rows and two pills, live at
`#/tables/frames/f_frame-beast_feast-colossus` arriving fresh reads 0 rows and
no pills, and the rewrite read 0 rows in both cases. Root cause, two halves:
(a) the shared decoder heuristic - `lib/filters.ts`'s `decodeFilter` and
`app.js:2724`'s `fDecode` both read a segment as the older `_`-separated form
when it has no `.` and every `_`-split piece contains a `-`, and
`frame-beast_feast-colossus` splits into two pieces that both "look like a
group", so it decodes as `{frame:['beast'], feast:['colossus']}`, `beast` is no
frame, and the table is empty with nothing to draw a pill from. The same holds
for `dark_heart` + `motherboard`; `colossus` + `dark_heart` and any three-frame
pick decode correctly, which is why it reads as "sometimes". (b) The live app
never re-reads its own write (the `S.fSeg` guard, `app.js:3627`), so it only
meets the heuristic on arrival; the rewrite read the filter off `app.route`
after every `replace()`, so it met it on every pick. **Not a `DEBT.md`
entry**: the rewrite fixes it, and the live app's own link-arrival failure
became a fixed-not-ported divergence. **Fix (B11)**: `decodeFilter(segment,
groups)` reads the old form only when every piece's head names a group the
table offers. The grammar in `CONTRACTS.md` item 1 is untouched - dot-separated
groups were always the contract; this makes the decoder honour it.

*Defect 2, add to list -> "+ Новый список" does nothing, from any view.*
**Reproduced on `dist/` with a real click only; the live app is fine either
way.** Root cause: `AddToList.svelte`'s `<svelte:document onclick>` handler
closed the menu when the click's target was outside `.seldrop`. Svelte 5
flushes state in a microtask; a trusted event runs a microtask checkpoint after
each listener, so between the app root's delegated handler (which sets
`newListFor = true`) and the document listener, `{#if newListFor}` has already
replaced the chip - `e.target` is detached, `root.contains` is false, the menu
closes. A synthetic dispatch runs no checkpoint until the stack unwinds, which
is why the component test and the parity state both passed: **neither layer can
see this class of defect, by construction.** **Fix (B11)**: in
`onDocumentClick`, a target that is no longer connected was inside this control
when it was pressed - return.

*Defect 2b, the menu inside the modal opening downward where the live app opens
it upward.* Root-caused on measurement, 2026-09-12, after the owner's repro
refuted an earlier "not reproduced". Probe: a read-only puppeteer script over
both apps, the modal opened on four records whose descriptions span the range,
at 1913x981 and 1100x900, with zero, one and two lists seeded - 24 cells per
app; numbers in `context.md`, "Q3 planning facts". Two findings:

- **The first open is identical on both apps in all 24 cells**, and it is
  downward on a tall window for a short card: both compute `below =
  innerHeight - toggle.bottom` against `need = menu.height + 16`, so the
  card's height decides the side. **What makes the downward open a defect is
  what it does next**: the menu overflows the card, and
  `menu.scrollIntoView({ block: 'nearest' })` scrolls the **`.card` article**
  (`overflow: hidden`, a scroll container for programmatic scrolls), not the
  `.modal-card`. The formula measures the window; the thing that clips is the
  card. **A live defect, reproduced faithfully: `DEBT.md` D6**, written by
  B11.1, owed a fix in Phase 8 R3.
- **After "+ Новый список" the two apps diverge, and this is the rewrite's
  regression.** Live flips the menu **up in 24 of 24 cells** by an accident
  with two parts: `refreshModal()` redraws the card's innerHTML, so the menu is
  fresh at its default side; then `placeMenu` reads `drop.querySelector('.btn')`
  - the **first** `.btn` inside `.seldrop`, which with the form open is the
  form's own "Создать" button, not the toggle. Its bottom is under the fold, so
  `below` is negative and `up` is set. The rewrite's `$effect` read the same
  first `.btn` but from wherever the menu already was, and in the band
  `need - 17 <= below < need` the sign flipped - the menu went **down** and the
  form was clipped, in 7 of 24 rewrite cells. **Fix: B11.1** - port the live
  algorithm's *order*, not only its formula: reset `up` to false and let the DOM
  catch up before measuring, keep the first-`.btn` reading (it is the live
  reading, and D6 records it), and put the class on the menu before scrolling it
  into view. Measuring the toggle instead (`:scope > .btn`) would be *more*
  correct and would break parity on every `~ new list` cell - that is the Phase
  8 fix, named in D6, not this one.
- **Does anything need the owner's 1913x981?** No: the height dependence is
  fully explained by `below < need`, and 1100x900 exercises both branches. A
  fourth harness width would be a global change (`WIDTHS` is hashed into every
  cache key) costing +204 cells, roughly a third of the parity wall clock per
  shard (~3 min); per-state widths would be a harness feature nobody else
  needs. Neither is planned.

*This class as coverage grows.* The two mechanisms here - a shared heuristic
met on a different code path, and event-loop timing that no synthetic dispatch
reproduces - are both things a component test cannot express and a
synthetic-click harness cannot see. That is the argument for decided 1 and 6 in
one sentence.

**8. P6 -> P7 -> P8, and "unify 7 and 8".** Recommended order: Phase 5, then
Phase 6 (publish `dist/`), then Phase 7 (the cut-over cleanup), then Phase 8.
7 before 8 is forced: every Phase 8 fix is a parity regression while the
harness is the gate. 6 before 7 is forced: deleting the root before the deploy
job publishes `dist/` takes the site down. 5 before 7 is forced by entry
condition 3; 5 before 6 is a choice, and the right one - the owner's two
defects are in the built app people will be sent to.

**Can 7 and 8 be unified?** As one *track*, yes - Phase 7's cleanup becomes
that track's first batch (R0) and R1's review starts the moment it lands, on a
tree with no old code for an agent to be confused by, which is the owner's
reason. As one *batch*, no: R0 changes public contracts and CI and must land
and be reviewed alone, and R1 is read-only by design.

**9. "Phase 5" survives as a label** for the net and the gates, B11 and B12.

### Phase 5's batches, as built

Three, sized by their gates. Merging B11.1 into B12 would have buried a
user-visible production fix inside a ~1k-line review of ported test code;
merging it into B11 was impossible, B11 having landed before the repro arrived.

| batch | outcome | commits |
|---|---|---|
| **B11** the decoder, and the menu that closed itself | shipped as specified, reviewed **approve**, no blockers, six nits. Gates green (41 files / 1004 tests, `check:built`, 60 parity cells `совпадает`). Deviation recorded here and nowhere else: step 2's "non-empty tail" was not implemented, behaviourally nil - `ROUTES.md` documents the code as written. The `onclickcapture` variant stays the recorded fallback and was *not* taken | `73facda`, `64f9a27` |
| **B11.1** the menu's second measurement | shipped; the parity state read red before the fix and green after, and `DEBT.md` D6 records the live defect the port reproduces on purpose. Reviewed and approved | `e94a90e`, `64e094d`, `e8bb37f` |
| **B12** the real-browser layer on `dist/`, and the gates | shipped in three commits after a real blocker (below). Deviation found while running gate 2 for the first time: **`tests/app/sweep.js`'s `focusWalk` had a real gap** - and the first fix for it was itself wrong. The reviewer's replay (each Tab stop read twice, once genuinely focused and once forcibly blurred) found the OR-combined `outline \|\| box \|\| border` check still passing while blurred on over a third of `#/roll/std`'s stops, across all six `FOCUS_WALK` addresses (894 stops): a permanent ancestor drop shadow (`.card`, `.panel`) satisfies the box-shadow arm with no notion of focus, and a resting gold border (`.chip.on`, `.homebtn.on`) satisfies the border arm the same way. Fixed by requiring the indicator to **change** - each of the three read separately per depth, focused against blurred | `a52c17d`, `9a4f8db`, `4adc5a5`, `9ced2b3` |

**B12's blocker, and the root cause worth keeping.** The batch sat for two
sessions with `npm run check` crossing the 600 s foreground cap. Root-caused
2026-09-12: **the CPU is throttled to ~20% of nominal** (`% Processor
Performance` read 20 four times running on an i7-8565U). One fifth the clock,
five times the wall - which reproduces every figure three sessions collected
and supersedes all three earlier attributions, peer contention and a runaway
`explorer.exe` alike. Lifting the throttle needs a human at the machine.
Numbers: `context.md`, "The host is throttled to ~20% of nominal".

**B12 built, the fallbacks it took.** Neither is a defect; both are fallbacks
the B12 plan itself wrote down and allowed, and they are recorded here because
a future reader of an a11y gap should find them:

- **axe runs RU-only at 360, 390 and 768** (`tests/app/sweep.js:286`), both
  languages at 1180 only. Taken for run time.
- **the focus walk runs at 1180 only** (`:310`), against the plan's "1180 and
  360".

The place to widen either is the sweep's own width loop.

**B12.1 named: the router does not reproduce the live app's bare-vs-unreadable
address distinction.** Found while porting `tests/contracts.js`'s route-grammar
check to `tests/app/contracts.js`. **Not a `DEBT.md` entry**: that file is for a
defect the rewrite reproduces *because the live app has it* - "both apps are
identical by construction" - and here the two apps read differently on the same
fixture, which is the opposite shape. Live (`app.js:3636-3644`): a bare address
draws home and leaves the bar alone; a genuinely unreadable one draws home
**and** rewrites the bar to it, so a refresh or a step back replays home, not
the garbage.

## Phase 6 - the cut-over, replanned (planner, 2026-09-12)

Two facts arrived after "Phase 5 - the testing pyramid, planned" was written,
and between them they move the gate and re-cut the batches. Both are in
`context.md`, "GitHub Pages is already served by Actions".

**Fact, measured.** `gh api repos/:owner/:repo/pages` reads `"build_type":
"workflow"`. The owner switched Pages to "GitHub Actions" before this session.
Every sentence in this file that treated "the Pages flip" as pending owner
work described a state that no longer existed; the ones that mattered are
corrected in place above.

**What actually publishes the old app** is one step, `deploy` -> "Collect what
the site is made of", copying `index.html style.css app.js data.js data.json
catalog.csv llms.txt robots.txt .nojekyll LICENSE img og i card` into `_site`
by an explicit list. The rewrite goes live when that list names the built
output instead of the two root code files.

**Owner decision, 2026-09-12: publish early, delete later.** Point the deploy
step at the built output and go live while `index.html`, `app.js` and
`style.css` stay in the repository and the parity harness keeps running
against them. A bad deploy is then one `git revert` away from the old app,
which is still there. Phase 7's deletions move behind the flip and earn their
own entry condition. Settled.

### The order, and why each step sits where it does

`B12.1 -> B13 (the flip) -> soak -> Phase 7 R0 -> Phase 8 R1..Rn`.

- **B12.1 before B13** because it is a defect on the public entry point: a
  bare `#/` - the address every link to the site root produces - has its
  address bar rewritten, and an unreadable one draws a debug heading instead
  of a page. Fixing it after the flip means shipping it to whoever is sent the
  link first. It is also the smallest possible batch to be holding when the
  publish path changes: if B13 has to be reverted, B12.1 is not entangled in
  the revert.
- **B13 before the deletions** is the owner's decision above.
- **The soak between B13 and Phase 7** is what makes "reversible" mean
  anything: a revert is only cheap while the thing to revert to is still in
  the repository and still gated. (**Dropped by the owner, 2026-09-12** - see
  "Phase 7's entry condition, as it now reads".)
- **Phase 8 after Phase 7** is unchanged and for the unchanged reason: every
  Phase 8 fix is a parity regression while the harness is the gate.

### Phase 6's batches, as built

| batch | outcome | commits |
|---|---|---|
| **B12.1** the router's bare-vs-unreadable fallback | shipped as designed, in one commit. `app/src/state/app.svelte.ts` (the constructor's bare-address branch plus a private `#fallback` shared with `start()`'s `onChange`), `App.svelte` (the `{:else}` branch and the `.todo` block removed), one test per row of the four-row table asserting `memoryRouter`'s `stack` and `app.hash`, `tests/app/contracts.js` (the `#/`/`#/nonsense` skip deleted), and `ROUTES.md`'s "Fallback" gaining the bare-address half and the boot-versus-navigation split | `bc96b59`, `7a729bd`, `cd71897` |
| **B13** the reversible cut-over | **the cut-over is live**; `https://artex-x.github.io/daggerheart-loot/` serves the built rewrite. F1 ported the live entry document into the rewrite (7 files, including `tools/check-site.mjs`, new). **F2 is `.github/workflows/ci.yml` and nothing else - 82 insertions, 12 deletions, one file**, which is the revert property the whole batch is built around and which the reviewer verified independently. Run `34718569245` on `9177f3b` was green in every job including `deploy`; the guard published exactly 13 entries with no `app.js`/`style.css`; `check-site.mjs` passed against the live URL; the owner walked the site: LGTM | `0819a73` (F1), `9177f3b` (F2), `a004764` (remediation), `515e257` (F3) |

### Phase 7 - what has to be true before the net comes out

**Superseded in part, 2026-09-12**, by "The finishing plan", "Phase 7's entry
condition, as it now reads": condition 4 (the seven-day soak) is **removed by
the owner**; condition 2 is reworded because there is no end-of-soak to be
green at; condition 3 is met by evidence rather than by waiting; condition 6
now gates **R0c alone**, because R0a and R0b delete nothing.

Phase 7's content is unchanged: delete `index.html`/`app.js`/`style.css` and
the legacy browser suites, port `print`'s geometry, add the structural
goldens, retire `tests/parity.js`, `VISUAL_DEBT` and `ACCEPTED`, drop CI's
parity job, shrink `CLAUDE.md`'s migration section. What it did not have was an
entry condition, because it used to be the same day as the flip - and "the
owner says so" is a legitimate condition, an unstated one is not.

And one condition R0 carries for its own sake, unchanged from Phase 5 decided
2: the tree it seeds the structural goldens from is green on the **full**
workflow, parity included, and the seeding commit says which run that was. The
goldens' entire warrant is that last green parity run; a seed taken from an
untested tree is a golden that records a bug.

### B12's deferred nits, placed

**Stale, and corrected in place 2026-09-12 rather than rewritten: two rows of
this table were not done.** B13 closed without touching either
`tests/app/typo.js` or `tests/app/states.js`, so nit 1 (`typo.js:11-12`
promises a missing grip "fails loudly", but `softClick` and `hit()` are both
silent, so a renamed `Фильтры` or `.helpbtn` stops checking a panel without
saying so) and nit 2b (`states.js` cases 4/5 use `d.click` where the plan's
text says `press`) were placed there, believed handled, and dropped. They were
re-placed in **B14 C3** as acceptance lines - which is the second time this
plan lost an item it had filed, and why "A placement has to be acceptance, not
a footnote" exists.

The rest: nit 2 (two of B12's plan fallbacks taken without being listed) is
closed by "B12 built, the fallbacks it took" above; nit 3 (`App.svelte`'s
comment overclaiming what the `<h1>` costs) went to B12.1 with the branch and
the `.todo` rule; nit 4 (`DEBT.md` reads D7, D10, D8, D4 - D10 inserted
mid-sequence) goes to Phase 8 R1, which rewrites the file top to bottom; nit 5
(`vite.config.mts`'s warrant for excluding `src/ports/image.ts` is thinner than
its comment reads, since D10 says the path cannot complete under `file://` on
either app) goes to Phase 8 with D10, because the wording is decided by what
D10's fix turns out to be; nit 6 (`CLAUDE.md` line count) was corrected in the
handoff.

## The finishing plan - every batch from here to done (planner, 2026-09-12)

The owner asked for one ordered account of what is left. This section is it.
Everything above stays as the record of how the migration was built; this is
the only place that says what happens next, in what order, and what has to be
true before each step.

### Where this starts

The cut-over is done and live (B13 above); Phase 6 is **done**. **The soak is
dropped** (owner, 2026-09-12): "I'm ok to get rid of soak, we can revert to
previous commit if needed, I would not block all the work." Condition 4 said
the seven days were the plan's number and that the owner alone may move them.
They have.

### The revert cliff, and where it is

**Today the revert is one command over one file.** `git revert 9177f3b`, push,
and the next `deploy` republishes the old app - `index.html`, `app.js` and
`style.css` never left the repository, the parity harness still gates them, and
the four shards still prove they work. That is what makes "we can revert to
previous commit if needed" true.

**R0c is where that stops being true.** It deletes the three root files, the
fifteen legacy browser suites, `tests/parity.js`, `tests/parity/`,
`VISUAL_DEBT`, `ACCEPTED` and CI's parity job. After it, recovery from a bad
rewrite is: restore the deleted paths out of git history (`git checkout
<pre-R0c sha> -- index.html app.js style.css tests/parity.js tests/parity
tests/<the fifteen>`), restore the workflow's collect step and its `needs:`,
and re-run the gates - possible, but a batch with its own review, not a
command. Everything before R0c (B14, R0a, R0b) adds or repairs and deletes
nothing, so the one-file revert survives all of it.

That is why condition 6, "the owner says go", is attached to **R0c alone**, and
to nothing else. Work flows; the irreversible step waits.

### The order

| # | Batch | What it is | Entry condition | Reversible? |
|---|---|---|---|---|
| 1 | **B14** | the roll surface, the pinned home, and the checks that should have caught them | none beyond a green HEAD | **shipped** |
| 2 | **R0a** | the evidence, the `ACCEPTED` sweep, the structural goldens - nothing deleted | Phase 7 conditions 1, 2, 3, 5 (evidence, not waiting) | **shipped** |
| 3 | **R0b** | re-home the live-app coverage that must survive, print geometry included | R0a landed, `main` green on the full workflow | **shipped** (R0b.1-R0b.4, closed 2026-09-16) |
| 4 | **R0c** | the divergence sweep, the deletions, CI's parity job, the documents | R0b landed **and condition 6 - the owner says go**: **both met 2026-09-16** | **no - this is the cliff**; implement-ready, "R0c designed" below |
| 5 | **Phase 8 R1..Rn** | the post-migration review, under a new task id | R0c landed, `main` green without parity | n/a |

### Phase 7's entry condition, as it now reads

Replaces the six-point list in "Phase 7 - what has to be true before the net
comes out". Conditions 1, 3 and 5 are unchanged in substance; 2 is reworded
because there is no end-of-soak to be green at; 4 is **removed** by the owner;
6 is unchanged and now names the batch it gates.

1. **B13 landed and published.** Satisfied: run `34718569245` on `9177f3b`,
   `deploy` green, `_site` assembled from `dist/`.
2. **The live site was checked twice.** Satisfied once - `check-site.mjs` green
   inside run `34718569245` and again on an independent read, plus the owner's
   walk. The second check is now taken **when R0c opens**, against the live
   URL, and its output goes in the handoff.
3. **The publish path repeats.** Three pushes to `main` since the flip -
   `9177f3b`, `515e257`, `6cb8293` - each with a `deploy` job. This is
   evidence-gathering, not a waiting period, and a non-green `deploy` is a
   blocker to raise rather than a clock to restart.
4. ~~A soak of at least seven days.~~ **Removed by the owner, 2026-09-12.** Do
   not replace it with a shorter calendar unless the owner asks for one.
5. **No unresolved revert.** If the flip is ever reverted, the cause is fixed
   and a later `deploy` is green before R0 resumes.
6. **The owner says go**, having used the deployed app themselves, with the
   date in the handoff. Still theirs alone, and it gates **R0c only**.
   **Satisfied 2026-09-16** - the owner's words are in `context.md`, decision
   11, with two rulings attached: R0c carries a divergence sweep over what it
   deletes, and what the sweep finds does **not** block the deletion.

And R0a's own condition, unchanged from Phase 5 decided 2: the tree the
structural goldens are seeded from is green on the **full** workflow, parity
included, and the seeding commit names that run.

### A placement has to be acceptance, not a footnote

Twice this plan filed an item into a future batch and lost it: B12's nits 1 and
2b were both placed in **B13**, B13 closed without doing either, and
`handoff.md` still said they were placed there. Before that, the same shape
produced the stale-baseline class in B3.6. A table that records an intention is
not a mechanism, because nothing reads it at the moment a batch closes.

**The rule, from B14 onward:** an item this plan places in a batch is written
into that batch's **acceptance criteria** in `handoff.md`, "Next batch", as its
own line - not as a cross-reference - and the batch's closing record says what
happened to each: done, or re-placed with a reason and a new batch. A batch may
not be recorded closed while an inherited line has no outcome. The reviewer
checks inherited lines the same way it checks the batch's own.

Where the rule lives: `.claude/prompts/plan.prompt.md` and
`.claude/prompts/implement.prompt.md` got it in B14. It does **not** go into
`CLAUDE.md` yet - that file is against its own 200-line cap, and a contrived
move-out to buy one line is worse than waiting. R0c rewrites `CLAUDE.md`'s
"Migration and parity" section (twenty lines, all of which retire with the
harness), and the one-line standing rule goes in there, as an acceptance line
of R0c.

### B14: the roll surface, the pinned home, and the checks that should have caught them

**What was wrong, measured.**

1. **The re-render divergence is four call sites, not two.** The handoff named
   `RollPanel.svelte:129` and `StdPanel.svelte:157`; read for the plan, it is
   also `AltPanel.svelte:228` and `ListPage.svelte:676`. `RollPanel` has one
   `<RecordCard>` under `{#if shown}` with no `{#key}`, so Svelte updates it in
   place; the other three render through `OrGrid`, whose
   `{#each cells as cell, i (i)}` keys by **position**. So one shared
   instrument covers three of the four. `TableRows.svelte` and
   `ListPage.svelte:782` are keyed by id and are not affected; `RecordPage` and
   `RecordModal` remount on navigation and are not affected. Live rebuilds
   everywhere (`app.js:3819` assigns `$('#view').innerHTML`), so a brand-new
   `<img>` paints empty and fills. Both apps ship identical
   `loading="lazy" decoding="async"` and neither ships `srcset`/`sizes` - this
   is not a loading-strategy difference.
2. **Why nothing caught it.** Parity screenshots settled states; this is a
   transient during re-render, invisible to a settled comparison, and it stays
   invisible to the structural goldens for the same reason. The instrument that
   can see it is **node identity**, assertable without timing: tag the current
   `<img>`, cause the re-render, look for the tag.
3. **It is not `DEBT.md` material.** The register holds live defects the
   rewrite reproduces on purpose; this is the opposite - a divergence *from*
   live that parity never measured - so it is migration work and belongs before
   the harness retires. No register entry, no `ACCEPTED` entry, no
   `VISUAL_DEBT` figure.
4. **The pinned bare `#/tables`, read against live.** The rewrite's
   `toggleHome()` stored `this.hash`, so on a bare `#/tables` it pinned
   `'#/tables'`, and `readHome` then refused that value next boot and opened
   `DEFAULT_HOME`. Live does two different things and the port copied neither:
   `homeHash()` **writes** `'#/tables/' + S.tables.t`, always a named table,
   and `homeAllows()` **accepts** any tab - a bare `tables` included.

**Built as designed, in three commits** (`6b18291` C1, `af7fa17` C2, `a7f8787`
C3), reviewed and approved with one harness blocker handed to R0a.

- **C1** keyed the card cell on the item itself and added the instrument at two
  levels: `OrGrid.test.ts` (new) asserts node identity across a record change
  at the same slot, covering the three sites that share `OrGrid`, and
  `tests/app/states.js` case 14 covers `RollPanel`'s own single card. Both were
  proven to fail by removing their `{#key}` and rebuilding, then restored and
  reproven green.
- **C2**: **the plan's remount claim was checked and found false**, as the plan
  asked. Svelte tears a branch down only when the *matched branch* changes, not
  when the route object's contents do, so two `tables` addresses in a row -
  named to bare or the reverse - never remount `TablesPage`, and its
  `lastTable` (not `route.table`) is what is genuinely on screen. So the naive
  `route.table ?? 'core_item'` computed inside `AppState` was never implemented
  - it would have written `core_item` silently wrong in that exact scenario.
  Took the plan's own named fallback: `toggleHome(hash?: string)`, with
  `PageHead` gaining an optional `home` prop it computes its own `pinned`/`on`
  state from. `canPinHome` was **deleted, not wired** - the plan's own choice
  point; every actual `PageHead` caller is a `'section'` or `'tables'` route.
- **C3**, all six items, each proven by breaking it once - including B12's two
  lost nits, which is what the placement rule above was written for.

### R0a planned in outline: the evidence, the sweep, the goldens

Deletes nothing, so it needs conditions 1, 2, 3 and 5 only. Three parts: read
and record the evidence (the `deploy` conclusions since the flip, a fresh
`check-site.mjs`, and the id of the last **full** green workflow run, which is
the goldens' seeding warrant); the `ACCEPTED` sweep, which is Phase 8's entry
condition 4; and the structural goldens per Phase 5 decided 2, which are also
the durable copy of the 105-state inventory that Phase 8 R1 needs once
`specs.js` is gone.

**The one thing the sweep must not walk past, and the reason it is written
down**: `VISUAL_DEBT` held **18 entries** - eighteen places where the rewrite
is known to draw something different from live, each with a CI figure and a
reason. R0c deletes the table, and with it every record that those differences
exist - the same "a check quietly stops checking" class as the dropped nits and
the ten uncounted suites. So R0a decided each of the 18: paid off, or carried
into a `FEATURES.md`/`STATE.md` bullet or a `DEBT.md` section-2 entry. None may
simply vanish with the file. Done in C2 (`30b2744`).

### R0b planned in outline: re-home what must survive

**Collapsed 2026-09-16, superseded by "R0b planned" below.** What it settled and
what still stands: fifteen suites die with the live app, four data-only ones
stay, five have `tests/app/` counterparts and **ten have none**; each of the ten
gets *covered already* (by a named test, never "probably"), *ported*, or
*dropped with its reason*; and **a suite whose coverage cannot be accounted for
is not deleted**. The suite lists are in `context.md`, "Delete the legacy browser
suites is fifteen suites"; the verdicts are in `docs/specs/COVERAGE.md`.

### R0c planned in outline: the deletions, and the cliff

**Entry: R0b landed, `main` green, and condition 6 - the owner says go**, with
the date in the handoff, plus the second `check-site.mjs` read from condition 2
taken when the batch opens.

Content, deliberately one batch because its gates are one set and a half-deleted
harness is worse than either end of it:

- delete `index.html`, `app.js`, `style.css`;
- delete the fifteen legacy browser suites and `tests/lib.js`, per R0b's table;
- delete `tests/parity.js`, `tests/parity/` (`specs.js`; the driver has already
  moved to `tests/app/driver.js`), `VISUAL_DEBT`, `ACCEPTED`, and
  `docs/parity.md`. **`tests/parity/lock.js` is deleted here with its
  `bash-guard.mjs` rule and its `selftest.mjs` case** - it is imported by
  `tests/parity.js` and by two hooks, so deleting the directory without them
  takes the hooks with it; after R0c nothing writes `test-output/parity.lock`,
  so the mechanism is dead (R0b.1 deliberately left it where it was);
- `.github/workflows/ci.yml`: drop the four-shard `parity` job and `deploy`'s
  `needs:` on it; rewrite the `deploy` guard with **N3** (make the guard at
  least as strict as `check-site.mjs`) and **N5** (prove `_site/index.html`
  came from this build, require `og/_share.jpg` by name, require
  `_site/data.js` to assign `window.LOOT`); fix **N6**'s `<noscript>` links for
  `file://`;
- `tests/derived.js`: the `COUNTERS` file list drops `index.html` and `app.js`,
  and the head-to-head comparison goes with `index.html` - settling **N2** and
  **N8** by deletion, or keeping a single-document check with a stated reason;
- `.claude/hooks/edit-followup.mjs` and `.claude/prompts/add-source.prompt.md`:
  the same list, now five files;
- `CLAUDE.md`: "Migration and parity" (twenty lines) goes; "Project shape" and
  "Quality gates" lose the live app and the parity harness; the spec table
  loses `docs/parity.md`; and the **placement rule** goes in, in the space this
  frees. The file must end under 200 lines and should end well under it;
- `docs/specs/COVERAGE.md`: suite ownership rewritten around what remains; both
  READMEs and `llms.txt` re-read for anything that names the old files;
- `docs/specs/DEBT.md` is **not** deleted: its live-code citations are already
  quoted with a commit hash precisely so they survive this batch. Verify one by
  `git show bb61db0:app.js` before committing.

Gates: `npm run check`, `check:built`, every `tests/app/` suite, and the push's
workflow - which is now a workflow without a parity job, so read it carefully:
the first green run after R0c proves less than the runs before it did, and that
is the trade the phase exists to make.

Acceptance includes: no reference to `index.html`, `app.js`, `style.css`,
`tests/parity`, `VISUAL_DEBT` or `ACCEPTED` survives anywhere in the tree (grep,
do not assert); `CLAUDE.md` under 200 lines and carrying the placement rule; and
the recovery instruction from "The revert cliff" written into the commit
message, because that message is where a future reader will look.

### What "task 47 is done" means

1. **R0c has landed and `main` is green** on the workflow as it stands after the
   parity job is gone.
2. **Nothing is published from the old app.** `check-site.mjs` green against the
   live URL after R0c's deploy, and the guard's published list contains no file
   the old app owned.
3. **Every open item has a home outside `issues/47/`**: a `docs/specs/DEBT.md`
   entry, a spec bullet, a filed GitHub issue, or a line in the Phase 8 task's
   opening handoff. `handoff.md`'s "Deferred" ends with no item whose only
   record is `handoff.md`.
4. **The specs describe the app as it is**, with no "the live app" as an
   authority, and `CLAUDE.md` has no migration section.
5. **Phase 8 is opened as its own task**, with the register, the structural
   goldens, the backlog and the open-items list handed to it as inputs.
6. `issues/47/plan.md` and `handoff.md` are marked historical - Status `done`,
   the date, and the pointer to the Phase 8 task id. **Done, 2026-09-17** -
   see this file's own opening Status line and `handoff.md`'s. The Phase 8
   task id is still "to be filed by the owner"; nothing here waits on it.

**This revises the opening of this file**, which says it becomes historical
"once Phase 8 closes". Phase 8's own design gives R1 a new task directory "so
this file can retire with issue 47", and the two cannot both be true. The one
that holds is the later and more specific: **47 is the migration and it closes
at R0c**; the review that follows is a task of its own. R0c's documentation
commit corrects line 8.

What happens to the directory itself is the owner's: keep `issues/47/` as the
record of how the rewrite was built (it is the only place the measurements
live), or delete it now that the durable parts are in `docs/specs/*`. The
recommendation is to keep it - three of this migration's worst hours were spent
re-deriving facts a previous session had already measured - but nothing depends
on it after point 5.

### R0a built: three commits, nineteen acceptance lines closed (implementer, 2026-09-13)

**First attempt stopped at C1's own size gate, nothing committed** - which is
what that gate was for. The seed landed at **5,204,669 bytes over 105 files,
40,361 section lines**, against Decided 1's 4 MB line. The planner's answer is
"Decided 1, revised" below; C1 then resumed under the revised format.

Second attempt landed all three commits on `main`, **none pushed** (the
coordinator's explicit instruction):

- **C1** `b0545ed` - `feat(tests): structural text goldens for dist/, seeded
  under CI run 34747570250`. 112 files.
- **C2** `30b2744` - `docs(issue-47): carry the ACCEPTED/VISUAL_DEBT sweep into
  FEATURES.md`. 2 files.
- **C3** `47a9a15` - `fix(tests): blocker B1 and B14's four inherited nits`.
  6 files.

Measured facts from the build that do not live anywhere else:

- **Step 0's evidence**: `gh run view 34747570250` - every job green:
  `secrets` 7s, `parity (1)` 9m31s, `parity (2)` 8m10s, `parity (3)` 10m32s,
  `parity (4)` 8m55s, `audit` 15s, `check` 11m51s, `deploy` 31s. That run is
  the goldens' seeding warrant.
- **`tests/app/inventory.js` carries `NAME` too** (`specs.js:91-185`, the
  two-language button-name dictionary), because sixteen `STATES` `enter`
  closures call `NAME.ru.*` / `NAME[lang]`. `context.md`'s five-name list was
  short by one. **R0b and R0c must know this**: `inventory.js` is `STATES`,
  `LANGS`, the print routes, `PACKED`, `NOTES_BOTH_KINDS`, `QTY_AND_PRICE`,
  `LOOT`, the storage seeds **and `NAME`**. The copy was verified by
  reproducing `context.md`'s seven measured numbers exactly - 105 / 0 / 61 /
  24 / 7 / 5.
- **The `timed`-state await bug is durable harness knowledge, not a one-off.**
  `return captureLang(page, d)` inside `try { ... } finally { await ctx.close() }`
  closes the browser context out from under an in-flight CDP call; the fix is
  `return await captureLang(page, d)`. It crashed loudly here, which was luck -
  a version that only sometimes lost the race is the same "quietly stops
  checking" class.
- **The seed's authority did not need renewing.** `dist/` was byte-identical to
  the warranted `32926a0` and the revised rules are post-processing over the
  same snapshot, so C1 re-seeded under the same warrant. If any non-document
  commit had landed before the re-seed, that would have stopped being true.

### Decided 1, revised: what a golden captures for the largest states (planner, 2026-09-13)

Measured against the seeded corpus itself, by replaying each candidate rule
over the 105 files already on disk - so every number here is a measurement of
the real corpus, not an estimate.

**The answer to half 1 (size): no, and bytes are not the reason.** 5.2 MB would
be tolerable on its own: `img/` is 29 MB, `i/` is 4.0 MB and
`data.js` + `data.json` + `catalog.csv` are 1.87 MB of a 63.4 MB tracked tree.
**The reason to refuse it is the second half.** The corpus is 40,361 lines of
which **14,720 carry an accessible name longer than 64 characters**, running to
1023, and those long names are catalogue strings `data.js` owns. Adding a
source rewrites hundreds of thousand-character lines in a file whose entire
value is that a person reads its `git diff`. An instrument nobody reads has
quietly stopped checking - the exact failure class this batch exists to
prevent - so the format changes, and the size falls out of that rather than
driving it.

**The mechanism: two rules, both local, both applying to all 105 states.**
Implemented in `tests/app/golden.js`; what matters here is why each is shaped
the way it is. Neither names a state, a route, a table or a size; each fires on
a property of the node in front of it, so the implementer writes no list and
maintains no threshold. **Rule A - same-shape sibling elision** groups a node's
children by a signature over role, attribute *values* and child roles: names
are excluded at every depth and values are not, so a ticked checkbox, a level
or a url moves a row out of its group and a row doing something different is
never folded into a run of rows that are not. It groups **across the whole
child list, not by consecutive run**, because a table row is a `checkbox` and a
`button` at the same depth with no wrapper and run-detection sees runs of one.
**Rule B - a cap on every accessible name** at 64 code points appends
`[namelen=N namehash=<sha1[0:8]>]` only when it fires, so an uncapped line
stays byte-identical to the seed, and hashes the *whole* name, which is what
makes the rule fail-closed. **Order is load-bearing**: Decided 1's rule 3 (drop
a sole `StaticText` child whose name equals its parent's) is applied first as a
tree transform, signatures are computed on the transformed tree, elision runs
on that, and the cap is applied last - computing a signature before rule 3
would group a joined text node with a split one. Why 64 and not 40: measured,
40 saves a further ~0.2 MB and cuts the line below the point where a person can
identify the row.

**What it measures out at**, replayed over the seeded corpus:

| | bytes | section lines |
|---|---|---|
| seeded, as built | 5,204,669 | 40,361 |
| tree sections, elision only | 3,142,681 -> 664,988 | 27,532 -> ~11,000 |
| controls sections, cap only | 2,040,411 -> 946,374 | 12,829 (unchanged) |
| **whole corpus, both rules** | **~1,575,000 (1.50 MB)** | **24,346** |
| largest file (`_tables_eq_weapon_panel_open.txt`) | 372 KB -> **89 KB** | |
| `_search_capped.txt` | 332 KB -> **81 KB** | |

The acceptance line moved from 4 MB to **2 MB** on that measurement.

**The blind spot, named rather than hidden**: the text of a node in positions
3..N-2 of a same-shape run can change without the golden noticing. That text is
`data.js` content, already owned by `tests/derived.js`, `tests/dataint.js` and
the contract fixtures, and a template-level rendering break hits the first two
and last two rows as well. It is written into `COVERAGE.md`'s "what a golden
cannot catch" line. Everything else still fails the run: a node added, removed
or reordered changes a group's total or its position, any attribute value
change moves that node out of its group, and a name change is either visible or
changes `namelen`/`namehash`.

**Four alternatives, and why each was rejected on evidence:**

1. **Keep as is.** Refused above: 14,720 thousand-character lines is an
   unreadable diff, and an unread golden has stopped checking.
2. **Cap names, no elision.** Measured: trees 3.14 MB -> 1.99 MB, line count
   unchanged at 27,532. It buys bytes and does not touch the churn, which was
   the half that mattered.
3. **Row count plus the first and last row, for "the big tables".** Needs a
   hand-listed set of states or a size threshold - a number nobody maintains -
   and it folds a ticked row into a run of unticked ones, which rule A's
   value-bearing signature is exactly what prevents.
4. **Couple the controls list to the tree's elision by matching names.** Tried
   and **measured: it matches 462 of 12,829 entries.** `NAME_FN`
   (`driver.js:105`) is `aria-label || title || textContent`, so a row's
   control name has no inter-element spaces, carries the roll-number cell, and
   keeps the DOM's letter case; the accessibility name inserts boundary spaces,
   omits the number, and reflects `text-transform: uppercase`. **That
   disagreement is itself signal** - it is the `Сообщество <i>любое</i>` class
   the two instruments exist to keep apart - and fuzzy-matching it away would
   destroy what the controls section is for. So the controls section gets rule
   B only, and its 12,829 lines stay: the list is a **set** record, and its line
   count is the honest size of "everything a person can reach".

**The run cost, the 2.4x gap, and how a proof fits in one foreground call.**
Measured, both on the same unchanged `dist/`: seeding (`--update`) **414.6 s**,
comparison **1005 s**, 105/105 byte-identical, exit 0. The format is
reproducible as written - the per-run handle ids and the absolute `file://` url
really were the whole non-determinism. **The 2.4x gap is not explained by the
compare path**: the extra work a comparison does is one `readFileSync`, one
`split` and one `join` per section over a 5.2 MB corpus - order of a second, not
590. Host contention is a candidate and was partly present, but it is not
established. So the suite is **instrumented instead of theorised about**: it
accumulates the milliseconds spent inside `captureState` and prints
`съёмка: 412.8s из 1005.1s` on every run. Capture close to total means the
browser or the host; capture at 415 s of 1005 s means there is a real cost in
the compare path and it is now visible.

**Sharding, the plan's own fallback taken rather than invented.** At 1005 s the
split is **four**, not two, matching `tests/parity.js`'s own matrix including
the `stateIdx % of !== n` interleave, which spreads the ~7 s `#/tables*`
arrivals evenly instead of piling them into one shard. `--shard` suppresses
**neither** guard - only `--only=` does. A shard is ~250 s, with 2.4x headroom
under the 600 s foreground cap, so the determinism proof is eight foreground
calls, four `--update` and four compare: every state captured twice and the
second capture compared byte-equal to the first. The original "twice, both
compared" third capture was dropped rather than deferred.

**CI: a job of its own, not seventeen minutes bolted onto `check`.** "CI picks
the suite up for free" is **wrong at this cost**: `ci.yml`'s `check` job
already takes 11m51s, and adding a 7-17 minute suite to its pooled `run-all`
step makes `check` the workflow's critical path past the parity shards' ~10
minutes. So the suite got a sharded `golden` job of its own mirroring the
`parity` job, and `run-all`'s pooled step excludes it. **This moved
`.github/workflows/ci.yml` out of R0a's "out of scope" list, deliberately and
as the planner's call**, because the alternative is a gate that doubles CI's
critical path. It is a workflow edit, not a contract change.

### R0b planned: re-home the live-app coverage that must survive

Supersedes "R0b planned in outline: re-home what must survive" above wherever
the two disagree. The outline's shape is corrected by measurement, not by
opinion; everything it settled that measurement did not touch still stands.

#### What the audit changed, and why the outline could not have known

The outline's premise was that the ten counterpart-less suites split cleanly:
`print` is ported, and the rest are mostly *covered already* by the fates
`COVERAGE.md` records. Reading all ten in full against every test named in
those fates says otherwise.

**Every one of the ten has assertions that nothing else makes.** The fates in
`COVERAGE.md` are honest about *intent* - "re-homed: `listPage.test.ts`,
`state/lists.test.ts`, ..." - and each named test does exist and does cover the
bulk of its suite. What they do not say is which assertions did **not** travel,
and the residue is consistent in kind: it is almost entirely **computed layout,
computed colour, real CSS, real input, and real-data counts** - exactly what a
jsdom component test cannot answer and exactly what a legacy suite in a real
browser was for. A fate line that names four vitest files reads as closure and
is not.

Three of those residues turn out not to be coverage gaps at all. See "The
fourth verdict" below.

**The consequence for the phase**: R0b is not one batch. The outline priced it
as "ten verdicts plus a driver move"; the true content is a driver move, about
twenty-five placements across four test homes, one new browser suite of ~650
lines, one new tiny suite, and three shipped divergences that need a decision
before any suite can be deleted. It is planned below as **three batches plus a
blocked fourth**, ordered so the cheap and certain work lands first and the
irreversible step (R0c) is not reached with anything unaccounted for.

#### The ten verdicts

Each suite gets one of the three verdicts the outline names. Where a suite is
*ported*, the port is named down to the assertion and the file it lands in;
where it is *covered already*, the covering test is named with a line number,
never "probably". Where a part is *dropped*, the reason is the commit's and is
carried into `COVERAGE.md`.

**The table itself now lives in `docs/specs/COVERAGE.md`**, written there by
R0b.1's C4 (`92c239b`) in the `Fate` column: the covering tests named to the
line, the ports named to the file and the batch that lands them, and every drop
carrying its reason. That is its permanent home - R0c reads a decision there
rather than re-deriving one - so the copy this plan carried is collapsed. The
verdicts, one line each:

| # | Suite | Verdict |
|---|---|---|
| 1 | `behave` | covered already, one port (real history Back/Forward, to `tests/app/states.js` - the legacy suite asserted the *sub-chip* came back, not just the hash). Dropped: the `dhloot.prefs.v1` group, which guards a feature the rewrite deliberately removed |
| 2 | `craftmob` | ported, in four places (R0b.2). Dropped with reasons: the `@media (hover:hover)` guard, a source-text assertion on `style.css` which R0c deletes and which headless Chrome cannot re-ask; the 320px width, below every other instrument's floor and below `style.css`'s narrowest breakpoint. Both recorded as thin spots |
| 3 | `eqtest` | covered already, four ports. Dropped: the `scrollY > 100` smooth-scroll assertion (what remains after the app's own half is a test of Chrome); the old chip strip, markup the rewrite never emitted |
| 4 | `flows` | covered already, one port - `w118`'s beastform shape, by adding `w118` to `docs/fixtures/share/records.json`; no new suite. The clipboard half is covered **more strictly** than the legacy suite, `share.test.ts:69` being a parameterised golden captured from the running live app char-for-char |
| 5 | `lists2` | covered already, seven ports (three real-browser, queued for R0b.2; four jsdom, landed). Dropped: markup the rewrite never had, and the exact real-data counts, which `tests/app/contracts.js` pins table-agnostically and `derived.js` pins as dataset sizes |
| 6 | `noart` | covered already, three ports. **One of them is a divergence, not a gap** - see "The fourth verdict", item 3. Dropped: the `noart` class on the placeholder (no such class exists); "share attaches no file" (structurally impossible); the placeholder in a table row (duplicative) |
| 7 | `notes` | covered already, two ports, both the note-field geometry group and the clear cross's real-CSS visibility, queued for R0b.2. Dropped: the toast's `display:none` after undo (the specificity clash cannot recur under `Toast.svelte`'s `{#if}` over a popover); `noteH` in prefs (no such key) |
| 8 | `print` | **ported, whole, and it is the largest single item** (R0b.3). Nothing covers it: the structural goldens carry the print routes as accessibility trees only, and a tree says nothing about millimetres. Nothing dropped |
| 9 | `qa` | covered already, six ports, one raise. **The `.results` live region is a divergence, not a gap** - "The fourth verdict", item 1. Dropped: two greps over `app.js`, which R0c deletes; the unreadable-address rewrite, **deliberately superseded** by B12.1; the whole-document "no Cyrillic in an EN label" regex, whose substitute is recorded as a thin spot |
| 10 | `select` | covered already, one port - the selection bar pinned to the bottom of the viewport, which nothing else measures and which a settled screenshot of a short table cannot see. The two `elementFromPoint` hit-tests are covered **better** by `tests/app/states.js`, which reaches the same controls with a trusted click through the same sticky stack rather than a synthetic probe |

Two rows of `COVERAGE.md` cite this file for their full line map rather than
repeating it, so those two lists stay here verbatim:

- **`lists2`, covered already by**: `listPage.test.ts:112,150,198,221,233,249,253,264,290,304,318,333,348,359,384,397,409,422,435,450,464,478,505,517,526,544,560,565,581,586,603,614,655,669`, `listsPage.test.ts:93,101,171,178,190,217`, `sharedListPage.test.ts:106,166,186,213,232,257,272,305,335`, `state/lists.test.ts:305,325,333,341,351,370`, `lib/lists.test.ts:66,143,153,159`, `money.test.ts:20,29,55,105,168,222`, `numField.test.ts:56`, `share.test.ts:50,248,252,283`, `record.test.ts:186,372,382,391,398,412`, `tables.test.ts:198,248,284,535,545,556,565,782,921,934,945`, `facets.test.ts:54,66,230`, `tests/app/contracts.js:89,117,186`, `tests/derived.js:154`.
- **`eqtest`, covered already by**: `data.test.ts:73,128,137,140,213,223`, `facets.test.ts:54,66,75,107,166,180,230`, `filters.test.ts:23,82,90,103,143,179,185,196,215`, `label.test.ts:126`, `i18n.test.ts:52,74,80`, `tables.test.ts:198,248,270,284,488,507,517,527,535,545,556,562,579,643,661,682,729,743,753,809,844,921,934,945,953,960,969`, `share.test.ts:67,93`, `tests/app/hues.js:99`.

(Read during the R0b audit; where these disagree with `COVERAGE.md`, that file
carries the later reading, corrected in the R0b.1 remediation.)

**No suite is dropped whole, and no suite's coverage is unaccounted for.** That
was the outline's bar and it is met.

#### The fourth verdict: four assertions that can take none of the three

Four legacy assertions cannot be given any verdict, because the rewrite does
not do what they assert. They are not *covered already* - nothing covers them.
They cannot be *ported* - a port would land a suite that fails against `dist/`
on its first run. They must not be *dropped* - dropping them deletes the only
instrument in the repository that can see a shipped divergence, which is the
exact failure the outline calls "the largest remaining risk in the phase".

The first three were verified against the source for this plan, not taken
from the audit's report. **The fourth was found later, during R0b.1's own
implementation (implementer, 2026-09-16), not by this planning pass** - see
item 4 below for how it surfaced. `plan.md`'s own out-of-scope clause below
says a batch that finds one should "record it beside the three and stop
rather than fixing it"; the finding was recorded in C3, but the batch ran on
to C4 and closeout rather than stopping, which review remediation is what
caught and is now correcting.

1. **The roll results lost their live region.** `app.js:2243, 2300, 2333, 2349,
   2376, 2399` all emit `<div class="results" role="status" aria-live="polite">`.
   `StdPanel.svelte:150`, `RollPanel.svelte:128` and `AltPanel.svelte:192` emit
   a bare `<div class="results">`. So a screen reader is told nothing when a
   roll lands. `qa.js:138` is the only test in the repository that asserts it;
   **axe does not report a *missing* live region**, so `sweep.js`'s axe pass
   cannot see it either, and the structural goldens record the tree without the
   attribute's absence being a line anyone reads.
2. **A referenced card lost its line breaks and its outbound link.**
   `app.js:886-896` (`refHTML`) writes `'<p>' + lines(r.text) + '</p>'` - and
   `lines` is `esc(s).replace(/\n/g, '<br>')` (`app.js:590`) - followed by
   `<a href="{r.url}" target="_blank" rel="noopener">daggerheart.su</a>`.
   `RecordCard.svelte:238` writes `<p>{lang === 'ru' ? r.rud : r.ende}</p>`: a
   plain text node, so `\n` collapses to a space and a multi-paragraph spell
   renders as one wall of text, and **there is no link at all** - `url` appears
   nowhere in `RecordCard.svelte`. The summary's `<i class="ref-s">` also
   became a `<span>`. All of it sits inside a `<details>` that is **closed by
   default** (`FEATURES.md:152`), which is why every instrument missed it: a
   pixel diff photographs a closed disclosure, and
   `page.accessibility.snapshot()` does not descend into one.
   `flows.js:117` was the only guard.
3. **The copy-image button no longer disappears when the art fails to load.**
   Live gates it on `hasImage(it)` = `!!it.img && !brokenArt[it.id]`
   (`app.js:1692`, used at `:2055`). `RecordActions.svelte:105` gates on
   `{#if it.img}` alone - half the rule - and its own comment beside it states
   only the half it kept. `app.artBroken(id)` is consulted for the `src`
   (`RecordActions.svelte:57-61`) and not for the button. So a record whose
   picture 404s offers to copy the placeholder. `noart.js:76` was the only
   guard.
4. **A frame-armour record's copy text keeps its tier word where the live app
   now drops it.** `app.js:612` reads `if (e.tier && !isFrameRecord(it))
   out.push(t().tier + ' ' + e.tier);` (added by commit `106e4dd`, itself
   after this planning pass first wrote items 1-3): a weapon or armour record
   whose table is a campaign frame (`src === 'frame'`, e.g. `f33`, Quilted
   Clothing) prints no rank/tier word in its stat line, matching
   `RecordCard.svelte`'s own `noTier: isFrameRecord(it)`. `app/src/lib/share.ts:85`
   calls the equivalent `eqLine(...)` with no `noTier` argument, so the
   rewrite's copy-to-clipboard text still prints "Ранг 1"/"Tier 1" for a frame
   armour record - the opposite direction from items 1-3 (there the rewrite
   dropped something; here the live app dropped something and the rewrite
   never caught up), but the same shape: one guard the fix needs
   (`noTier: isFrameRecord(it)`, the same option `i18n.ts:117,123` already
   defines and `i18n.test.ts:42,63` already exercises elsewhere), invisible to
   every instrument until a fixture was regenerated against the live app and
   diffed. Found regenerating `docs/fixtures/share/records.json` for `w118`
   during R0b.1's C3 (implementer, 2026-09-16) - `share.test.ts`'s existing
   golden and `share.ts`'s own output agree with each other and both disagree
   with the live app.

**Why this is not the planner's call to make alone.** `CLAUDE.md`, "Migration
and parity", says this is a refactor and the shipped app's behaviour, content
and controls are reproduced; by that law all four are fixed, not recorded. But
each is production code in deployed behaviour, none is in a path R0b otherwise
touches, item 2 removes a link to a third-party site whose removal may have
been intended, and item 1 is a live accessibility regression the owner should
see now rather than at the cliff. The alternative to a fix is a
`docs/specs/DEBT.md` entry, and `DEBT.md` is described in `CLAUDE.md` as
holding "live decisions kept over its own" - which is an owner's decision, not
a planner's. Items 1-3 carried `NEEDS_HUMAN_CONFIRMATION: yes` and the owner
answered **restore** on all three (2026-09-16). **Item 4 was put to the owner
separately, after it surfaced, and answered the same way: restore** (owner,
via the orchestrator, 2026-09-16). It undoes an accidental loss the same way
items 1-3 do, not a deliberate product change, so it does not go to `DEBT.md`
either. The fix is `noTier: isFrameRecord(it)` at `app/src/lib/share.ts:85`
plus regenerating `docs/fixtures/share/records.json` with
`tools/capture-share-fixture.mjs`. **All four are answered; nothing in R0b
waits on the owner.**

**What must not happen** is R0c deleting `app.js` and the ten suites while
any of these four sit unrecorded, because after that the correct behaviour
exists only in git history and the instrument that noticed is gone.

#### The batches, and why three rather than one

`CLAUDE.md` and `docs/parity.md` both say to prefer one coherent batch and to
split only at a real seam. There are two here, and they are the ones the
project already names.

- **A different route and filter set.** The print port is `#/print/*` and
  nothing else: its own routes, its own fixtures, its own instrument, and a
  diagnostic (`node tests/parity.js print`) that no other work in R0b needs.
- **A review that cannot be held in one pass.** The print port alone is ~650
  lines of transposed geometry with design numbers in it. Merged with twenty
  other placements it is not reviewable, and `docs/parity.md` names exactly
  that as the "too big" failure.

The jsdom placements and the real-browser placements are **not** split from
each other by a seam - they share `npm run check`, one build, and one
`tests/app` run - so they are merged. That leaves:

| batch | content | gate set | reversible |
|---|---|---|---|
| **R0b.1** | the driver move, `app/states` case 7, R0a's four nits, every jsdom placement, `COVERAGE.md`'s verdict table | check, build, the `tests/app` set, the four golden shards | yes |
| **R0b.2** | every real-browser placement: `tests/app/states.js`, `sweep.js`, `hues.js`, and the new `tests/stub.js` | the same set | yes |
| **R0b.3** | the print port: `tests/app/print.js`, the `run-all` row, `COVERAGE.md` | check, build, `run-all app/print`; `node tests/parity.js print` as a diagnostic on failure only | yes |
| **R0b.4** | the four divergences | check, check:built, a parity filter over `#/i/*` and `#/roll/*` | yes, but production code |

R0b.1 first because everything else builds on the moved driver. R0b.4's first
three items were **blocked on the owner**; the owner answered restore on all
three (2026-09-16), so it is now an ordinary queued batch, not blocked, and
the only batch that touches `app/src/`. Its fourth item (the frame-armour
tier text in `share.ts`, "The fourth verdict" above) surfaced after that
answer and was put to the owner separately; the answer was restore as well
(2026-09-16). **R0b deletes nothing in any of its batches**, so the
one-file revert's guarantee holds throughout - `git revert --no-commit
9177f3b` is the way to check it (not `git apply --reverse --check -`, which
needs exact context that later commits to `ci.yml` move; see
`issues/47/handoff.md`'s corrected acceptance line 19) - and it holds without
needing care, because none of R0b's batches touches `.github/workflows/ci.yml`
at all (a new suite reaches CI through `run-all.js`'s own `SUITES` list, which
`ci.yml:47` already runs whole).

#### R0b.1 designed, and built

**Objective.** Move the one harness module the surviving suites depend on out
of the directory R0c deletes; fix the one known flake; close R0a's four nits;
land every placement jsdom can hold; and write the ten verdicts into
`COVERAGE.md`. **Shipped in four commits, all on `main` and pushed**: `1402bea`
(`refactor(tests): re-home the parity driver into tests/app`), `1807334`
(`fix(tests): case 7's two-stage wait, and R0a's four review nits`), `4aa8252`
(`test(app): land every re-homed assertion that jsdom can hold`), `92c239b`
(`docs(coverage): write the ten-suite verdicts from the R0b audit`). Reviewed;
one remediation pass (`6b4c838`) fixed stale citations and folded in the fourth
divergence. The implement-ready brief is collapsed; the code and `COVERAGE.md`
are the record. What survives it as decision rather than as steps:

*The driver's home, and the alternative rejected.* `tests/app/driver.js` is the
driver's **final** home - after R0c its only consumers are the `tests/app/`
suites - so R0c does not move it a second time. The cost is one batch of an
odd-looking import direction, `tests/parity.js` reaching into `tests/app/`.
`tests/driver.js` at the root was considered and rejected: it reads neutral
today and misplaced the moment `tests/parity.js` is gone, which is one batch
later. The move's whole reason for needing a plan was `tests/parity.js:156`'s
`hashFile(h, path.join(__dirname, 'parity', 'driver.js'))` - the driver's
`ready()`, `settle()` and `shot()` decide the bytes of every cached legacy
screenshot, and a cache key that silently stops covering the driver is the same
class of defect as everything else in this phase.

*`lock.js` is deliberately not moved.* It is imported by `tests/parity.js`,
`.claude/hooks/bash-guard.mjs` and `.claude/hooks/selftest.mjs`, and R0c's
outline deletes `tests/parity/` whole - so the directory delete would take two
hooks with it. Moving it here would be work R0c undoes: after R0c nothing
writes `test-output/parity.lock`, so the mechanism is dead and the right R0c
action is to delete it with its `bash-guard.mjs` rule and its `selftest.mjs`
case. Recorded as an R0c step.

*Case 7's flake, and three rejected fixes.* The two-window case waited for page
B's repaint with a swallowed 5 s timeout and then asserted on whatever the page
said, so a loaded runner produced a failure indistinguishable from a real
regression. The decision was **a two-stage wait with its own message per stage
and no swallow**: page B carries the test's own `storage` listener and counter,
so stage one answers "did Chrome deliver the event" on its own and stage two
asks "did page B redraw", against a 30 s deadline chosen against
`tests/app/lib.js`'s `protocolTimeout: 300_000`. The point is not the larger
number; it is that stage-one red is the environment and stage-two red is the
app, and neither can be waved through as "that flaky case again". *Rejected:*
raising 5000 to 30000 and nothing else - it keeps the swallow, so a genuine
regression still prints the same sentence as a slow runner. *Rejected:* polling
in Node with a `page.evaluate` loop - identical semantics, more code, more CDP
round trips, which is the thing that is slow under load. *Rejected:* reloading
B - it destroys what the case tests.

*R0a's four nits* (a golden's header now compared as one string; the
`--only=` comment fixed rather than the code; **a golden is never hand-edited
or deleted** - `--update` rewrites in place and the stale sweep reports
orphans, so a guard is never routed around; two stale `specs.js` sentences)
and the *not-a-contract-change* confirmation for `docs/fixtures/share/` are
at `git show a6b4a94:issues/47/plan.md`, "R0b.1 designed, and built"; the
`docs/fixtures/` reminder hook fires on that directory although
`CONTRACTS.md:10` does not freeze it (`context.md`, "Framework and tooling
traps").

**The deviation that matters is a process one: R0b.1 did not stop when its own
C3 found a fourth divergence** - item 4 of "The fourth verdict" above; review
remediation folded it into R0b.4.

#### R0b's out-of-scope list and citation hazard - collapsed (2026-09-16)

R0b is closed; its out-of-scope list, stop-and-raise conditions and the
"citation hazard" rule for its three briefs are at `git show
a6b4a94:issues/47/plan.md`, same headings. Two things survive as standing
practice and are applied in "R0c designed" below: **no acceptance criterion
names a line number the batch itself moves** (the brief names the command that
re-derives it instead), and **a divergence found mid-batch is recorded and the
batch stops rather than fixing it** - R0b.1 did not stop at its fourth, and
review remediation had to fold the finding into R0b.4.

#### R0b.2, R0b.3 and R0b.4 designed - collapsed (2026-09-16)

All three shipped and are closed (`handoff.md`, "Completed", one outcome line
each with commits and deviations). Their implement-ready briefs, step lists,
gate sets and stop conditions are at `git show a6b4a94:issues/47/plan.md`,
"R0b.2 designed", "R0b.3 designed", "R0b.4 designed". What survives them as
decision rather than as steps:

- **`tests/stub.js` requires `./app/lib.js`**, never `tests/lib.js`, and
  navigates to `i/w3.html` directly; the `dist/` guard it inherits is
  accepted because `run-all` and CI both run after a build.
- **The print port landed as two commits** - the transposition ("does it
  still say what `tests/print.js` said") and the four folded parity specs
  ("does it still say what the specs said") - because that is the split a
  reviewer can hold. `.pc-name` is gripped by class, never by tag:
  `FEATURES.md` records the `<h3>` -> `<h2>` heading fix as deliberate.
- **R0b.4's C3 enumeration was wrong and let a fifth divergence through**:
  `PrintCard.svelte:34` and `TableRows.svelte:84` apply `isFrameRecord`
  inline and never call `eqLine`; the fourth production `eqLine` site was
  `app/src/lib/search.ts`, found only in review. **None of the five goes to
  `docs/specs/DEBT.md`** - accidental losses, all restored by owner ruling.
  The general lesson is the sweep in "R0c designed", below: enumerate by
  grep, not by memory.
- **The fixture regeneration is a step, not a consequence**:
  `tools/capture-share-fixture.mjs` rewrites all nine ids, so its diff is
  read, not assumed.

### R0c designed: the sweep, the deletions, and the cliff (planner, 2026-09-16)

Supersedes "R0c planned in outline" above wherever the two disagree. The
owner's go is `context.md`, decision 11 (2026-09-16), with two rulings: R0c
carries **one more deliberate pass over everything it deletes**, and **what
that pass finds does not block the deletion** - it is recorded and becomes
Phase 8 work. Every decision below follows from the tree as it stands at
`a6b4a94`, read for this pass, not from the outline.

#### What the tree says now, and where the outline was already stale - collapsed (2026-09-17)

Twelve findings from reading the tree fresh at `a6b4a94` before the batch
started (two lines already closed by a peer's `ci.yml` edit; four "kept"
suites that actually read files R0c deletes; the share-fixture tool's
`index.html` dependency; a false claim in `dice.ts`'s own comment;
`tests/parity/lock.js`'s three hook importers; `docs/parity.md`'s one
surviving section; `CLAUDE.md`'s stale counts sentence; the provenance
citations that are not the problem; `tests/app/inventory.js`'s self-retiring
guard; `docs/fixtures/lists/equipment-entry.json`'s one importer;
`check-site.mjs`'s second green read; `app/index.html`'s `<noscript>` links).
All twelve are now facts about a shipped batch, not open findings - each
became a step in "The batch" (collapsed below) and its outcome is in the
commits themselves. Full text: `git show d78b60f:issues/47/plan.md`, same
heading.

#### Decisions, each with the alternative rejected

- **One batch, five commits, the sweep first.** R0c stays one batch: its
  gates are one set (`check`, `check:built`, the `tests/app` suites, the
  push's workflow), a half-deleted harness is worse than either end, and a
  docs-only second batch would leave a tree whose `CLAUDE.md` and
  `COVERAGE.md` describe files that no longer exist. Inside it, five
  commits, each green on its own: **C0** the sweep and its records; **C1**
  the deletions plus everything `npm run check` needs to stay green without
  the old app; **C2** the surviving instruments (print's English pass, the
  `printMedia` null fix, N6, the share-fixture tool, stale comments and
  config); **C3** `ci.yml` alone; **C4** the documents and the closeout.
  *Rejected:* one commit (unreviewable: ~15,700 deleted lines plus ~40 edited
  files); a separate sweep batch before R0c (it would run against the same
  tree with the same reader and cost a second dispatch cycle for nothing);
  putting the sweep after the deletion (it would read `git show` instead of
  files, and could not run a legacy suite to settle a doubt).
- **The sweep is a read-only reviewer-role dispatch, not the implementer's
  step.** The implementer's incentive is to delete; the value of the pass is
  a read not anchored on that. Its output is one file, `issues/47/sweep.md`;
  if the runner cannot write, the orchestrator persists the returned table
  verbatim. The implementer then *homes* every non-`same` row in C0's commit.
  *Rejected:* a gate inside `npm run check` (there is nothing mechanical to
  assert - the point is judgement over what no instrument reads); the
  implementer doing it (anchoring); skipping it because R0b already audited
  ten suites (it audited *suites*, not `app.js`'s markup, `style.css`'s
  conditional rules, the dictionary or the 42 parity specs).
- **A finding is homed, never fixed, in R0c** (owner ruling). `app/src/`
  gets **no template, style or statement change** in this batch - comment
  re-points only - so the goldens prove the drawn app did not move. Three
  homes, by class: **(a)** the rewrite behaves differently from live on
  something a person can observe -> `docs/specs/DEBT.md`, a **new third
  section** "Divergences found at the deletion, owed a decision at Phase 8",
  entries `D12+` in the register's six-field shape with "Why parity won"
  replaced by "Why it was recorded, not restored: owner ruling 2026-09-16";
  **(b)** a question a deleted instrument asked that nothing surviving asks,
  where the rewrite is *not* known to differ -> `docs/specs/COVERAGE.md`,
  "Known thin spots"; **(c)** anything else - a refactor observation, a
  doubt about whether *live* was right (the D11 shape), a harness-ergonomics
  note -> the Phase 8 opening handover in `handoff.md`. Every (a) entry
  quotes the live code with the sha the sweep read at. *Rejected:* a
  `DEBT.md` section-1 entry (those are defects reproduced *on purpose*; a
  sweep finding is an accidental loss, the opposite shape - the same reason
  R0b.4's five did not go there); `issues/47/sweep.md` as the only record
  (the directory retires; a spec does not).
- **`tests/contracts.js` is trimmed, not deleted, and keeps its name.** The
  pure half is the one contract instrument four documents and a hook name;
  renaming it would churn `CLAUDE.md`, `CONTRACTS.md`, `ROUTES.md`,
  `README.ru.md`, `edit-followup.mjs` and `tests/app/contracts.js`'s header
  for nothing. It keeps the list-encoding half and the docs-name check (both
  `fs`-only) and drops puppeteer and `./lib.js`. The deletion list is
  therefore **fourteen** browser suites plus `tests/i18n.js`, not fifteen.
- **`tests/craft.js` is trimmed to sections 1 and 6** (data invariants; the
  share stubs). Sections 2-5 rendered the live app in JSDOM; their
  assertions are either covered (`tables.test.ts:190,195` both craft
  captions, `share.test.ts:130-142,204-231` forward-only copy and the
  repeated target, `record.test.ts:48` a craft fixture) or become sweep
  Part E rows - `craft` was never in R0b's ten-suite audit because the
  outline filed it as data-only, so this is the audit it never had.
  *Rejected:* re-pointing the JSDOM render at `dist/` (Vite's bundle is not
  a script JSDOM can run with `window.LOOT` seeded the same way, and every
  grip is `data-*` markup the rewrite does not emit).
- **`tests/i18n.js` is deleted and `package.json`'s `check` drops it.**
  `dict.ts:7-10` makes key parity a compile error in both directions
  (`Dict` is derived from `ru`; `en` is typed as `Dict`), and a key the code
  asks for that is missing is a type error too. The one thing lost is the
  informational dead-key report (`console.log`, never a failure). `I18N.md`
  says so.
- **`tests/derived.js` keeps one entry document.** The head-to-head loop
  and its `>= 20` floor go (N2 closes by deletion, as the outline allowed);
  `headFacts` scans `<head>` only (N8, one slice); the absolute og facts and
  the icon are asserted on `app/index.html` alone, which is what the
  agreement loop was a proxy for. `COUNTERS`' list drops the two deleted
  files. The three `app.js` reads re-point: the `tierBand`/`srcWond` guard
  over every `app/src/lib/*.ts` (the product law is `CLAUDE.md`'s "never
  infer tier from stats"); the die silhouettes parse `dice.ts`'s `DIE_ART`
  (`viewBox`, `body` = the SVG's first `d=`, `faces` = its second) for all
  six dice and are **proven to fail** once by editing a path in a scratch
  copy; the footer citation reads `dict.ts`'s `footBefore`+`footLink`+
  `footAfter` per language (`:81-84`, `:405-408`).
- **`tests/parity/lock.js` and its hook rule are deleted, not re-homed.**
  After R0c nothing writes the lock; `run-all.js` and `golden.js` never did.
  Re-homing means teaching those two to write a lock - new code in a
  deletion batch, guarding a collision that owner decision 10 already names
  as evidence for the Phase 8 Playwright/harness decision. The loss is
  written into that handover line and into `.claude/README.md`'s decisions
  table (rows 15 and 28 annotated "retired at R0c", not deleted - they are a
  dated record). *Rejected:* keeping the module with no writer (a guard that
  cannot fire is a lie in the hooks README).
- **`tools/capture-share-fixture.mjs` is re-pointed at `dist/`**, gripping
  the two copy buttons by the accessible names `dict.ts` gives them (read
  `RecordActions.svelte` for the keys), and its header says what the fixture
  now is: the rewrite's own golden, last matched against the live app at
  `cf96e6f` (R0b.4 C3). Its first run after the re-point must produce **zero
  diff** - that run is itself a sweep row (the clipboard text of nine ids,
  both languages). *Rejected:* deleting the tool and freezing the fixture
  (Phase 8 may change share text on purpose - D11 - and would then hand-edit
  a golden); keeping it pointed at a deleted file.
- **N6 closes in the build.** `vite.config.mts`'s `closeBundle` copies
  `catalog.csv`, `data.json` and `llms.txt` into `dist/` (files, so a copy
  rather than a junction), and `tools/smoke-file-url.mjs` asserts every
  `noscript a[href]` in `dist/index.html` resolves to a file under `dist/`.
  The deploy collect step is an explicit list, so nothing extra is
  published. `app/index.html` is untouched, so `dist/index.html` and every
  golden stay byte-identical. *Rejected:* rewriting the links to absolute
  Pages URLs (breaks the no-server property `META.md` section 4 states).
- **The English print pass is added, not waived.** `tests/app/print.js`
  gains a `fresh({ lang: 'en' })` pass over `cardFit` (every width, the
  eight card-drawing states) and `copiedPrintLink` (`'Link to this set'`);
  `sheetCounts` and `printMedia` stay Russian-only with the reason written
  in the file (counts and media rules do not depend on text length). Fit is
  the one surface where language changes geometry; the cost is one more
  pass of a 132 s suite. The `printMedia` chrome loop becomes
  `ok(val && val.display === 'none', ...)` so a renamed `.printbar` fails
  instead of passing on `null`.
- **The batch-size section moves to `.claude/README.md`**, beside "Run a
  long check", with the parity rows replaced by the surviving gates
  (`run-all app/*`, the golden shards, `sweep` per width); `CLAUDE.md:52`
  re-points to it. `docs/parity.md` is then deleted whole. The `timed`
  flag's explanation ("Timed states" / "Two unstable classes") moves into
  `tests/app/inventory.js`'s header in at most twelve lines, and the seven
  per-state comments point there.
- **`docs/specs/COVERAGE.md` keeps the old-app table as a record.** The
  Fate column *is* the durable answer to "where did each assertion go", and
  R1 will read it. It moves under a heading that names the deleting commit;
  the "Features to suites" table is re-pointed to surviving homes; the
  parity section ("The rewrite against the app it replaces" + "The look",
  `:94-216`) collapses to at most twenty lines of history and pointers
  (`FEATURES.md`'s sweep at `30b2744`, `DEBT.md`, the goldens, and how to
  resurrect the harness from history if ever needed).
- **Phase 8's task id is the owner's to assign** - the convention here is a
  GitHub issue number. R0c writes the handover as a section of
  `handoff.md` ("Phase 8 opening inputs") and `plan.md`'s closing status
  points at "the Phase 8 issue, to be filed"; the orchestrator's `/orchestrate`
  with that id is the kickoff. Not a blocker: nothing in R0c waits on it.
  `issues/47/` is kept (context.md's standing recommendation; the owner has
  not said otherwise).

#### The sweep and the batch's commits, files and gates - collapsed (2026-09-17)

Both fully executed; the design brief (the sweep's six read parts and their
row-count targets, the per-commit file lists, the recovery paragraph, the
gate commands) is superseded by what actually shipped. **The sweep**: run
as designed, output `issues/47/sweep.md` (519 rows, 82 homed into
`docs/specs/DEBT.md` section 3 and `docs/specs/COVERAGE.md`'s thin spots),
committed in `5b2e693`. **The batch**: five commits plus one remediation
cycle, all on `main` and pushed - `5b2e693` (C0), `23c00a6` (C1, the
deletions and re-points, with the recovery paragraph in its message
verbatim), `5d2ddf9` (C2), `b9d84ce` (C3), `d6371e7` (C4), `fdd015f`
(review remediation: the check-site guard gap, the `>= 20` floor, four
nits). Full command-by-command record, including every gate run and its
exact result: `issues/47/handoff.md`, "R0c's own commands and results"
through "R0c C1-C3 review remediation". Full pre-collapse design text: `git
show d78b60f:issues/47/plan.md`, same two headings.

#### The acceptance grep, defined

Two commands, run at C4's end, over the tree minus `issues/`,
`node_modules/`, `dist/`, `tests/app/snapshots/`:

1. **Broken instructions** - must return only the allowed residue:
   `git grep -n -E "tests/parity|docs/parity|tests/lib\.js|tools/probe|parity-ubuntu|VISUAL_DEBT|ACCEPTED|run-all\.js parity|node tests/parity|tests/(audit2|behave|craftmob|eqtest|flows|hues|lists2|noart|notes|print|qa|select|states|typo|i18n)\.js" -- . ':!issues' ':!node_modules' ':!dist' ':!tests/app/snapshots'`.
   Allowed: `.claude/improvements.md` (a dated record); `docs/specs/DEBT.md`
   and `docs/specs/COVERAGE.md` lines that name the harness in the past
   tense with the deleting sha; provenance lines of the form "Ported from
   tests/<x>.js" / "transposed from" / "lifted from". Everything else is
   edited in C2 or C4.
2. **Present-tense authority** - `git grep -n -i -E "the live app|the old
   app|the static root|parity expectation|parity baseline" -- CLAUDE.md
   docs/specs README.md README.ru.md .claude/README.md .claude/prompts
   .claude/skills .claude/templates`: every hit is past tense ("was", "at
   `<sha>`"), a `DEBT.md` cross-reference, or inside `COVERAGE.md`'s
   retained old-app table.

Not in the grep, on purpose: `app.js:N` / `style.css:N` / "off `renderX` in
app.js" citations in comments and in `COVERAGE.md`'s unit-suite table. They
resolve through one sentence written into `DEBT.md`'s header and
`COVERAGE.md`'s history paragraph: *the live sources were deleted at R0c
(`<C1 sha>`); `git show <C1 sha>^:app.js` (and `style.css`, `index.html`)
reads them at their final state, and a line citation with no other hash
refers to that state.* `DEBT.md`'s own citations name `bb61db0`, `b967481`,
`a52c17d` or `dc99f21` explicitly and are verified once (`git show
bb61db0:app.js` around `:3589-3603` matches D2's quote) before C4 commits.

#### Stop-and-raise - closed, none fired uncaught (2026-09-17)

None of the five named conditions blocked the batch: the `npm run check` cap
was crossed and re-run per the rule (`issues/47/handoff.md`'s C1 record);
no golden shard moved outside the `status`-node fix, found and closed inside
R0b.4 rather than here; the share-fixture tool's first `dist/` run produced
zero diff (C2, acceptance 23); the re-pointed die check was proven to fail
once on a scratch edit, then reverted, never on real data; CI was read job
by job on every push and stayed green. Full text: `git show
d78b60f:issues/47/plan.md`, same heading.

#### Closeout, and what Phase 8 is handed - done (2026-09-17)

Superseded by the closeout itself: `issues/47/handoff.md`'s Status section
records points 1-5 of "What 'task 47 is done' means" above with their
evidence (the CI run ids and job lists, the by-hand `check-site.mjs` line,
the acceptance-grep output, Phase 8's opening inputs). Point 6 - this file
and `handoff.md` marked historical - is this section and `handoff.md`'s
Status line. The Phase 8 handover itself - the register, the goldens, the
backlog, the Playwright decision, the sweep's class-(c) findings - was
migrated **in full**, not summarised, into `issues/47/handoff.md`, "Phase 8
opening inputs", at this same closeout: that is now the canonical copy, not
this file. Full pre-collapse text: `git show d78b60f:issues/47/plan.md`,
same heading.
