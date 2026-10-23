# Review - plan before batch 1 (57)

Verdict: fix-then-continue
Reviewed: 69f21784d560f7c4db0888369ee23c26e4a07de4
Scope: plan before 1

## Blockers

B1. Batch 7 changes a public contract and the plan says it does not.
- Where: `plan.md` Status ("no public contract change"), section 6, section 7 row 7.
- Defect: `docs/fixtures/urls/routes.json` pins the lit tab of every route
  (`resolves.tab`, the `href` of `nav.tabs a[aria-current="page"]`, read by
  `tests/app/contracts.js` and `hash.test.ts`). The three jobs change that
  value on every roll route: the seven supplements now read
  `#/roll/wondrous_environments`, and «Бросок» has a dynamic `href` (the last
  roll section). R10 `B10.3` treats `routes.json` `#/lists` `tab: null` as a
  public contract change, so this is one too.
- Change: in Status and section 6, name batch 7 as a public contract change.
  Add to batch 7 the same-commit set: `routes.json` (new `tab` semantics or
  values), `tests/contracts.js`, `tests/app/contracts.js`,
  `docs/specs/CONTRACTS.md` section 1, `llms.txt` if it names the tab bar,
  and the gate `node tests/run-all.js contracts,dataint` plus `app/contracts`.
  Set Status to "Plan review: required before batch 7 (trigger: contract
  change)". Batch 7 needs a batch review.

B2. The font family name in `--ui` and in `typo.js` does not match the
package, and nothing proves the rendered face.
- Where: section 5 (`--ui`, `typo.js` `UI = 'Source Sans 3'`), section 8
  acceptance 1.
- Defect: the `@fontsource-variable/*` packages declare the family as
  `'<Name> Variable'` (here `'Source Sans 3 Variable'`). With
  `'Source Sans 3'` first in `--ui`, a machine without a local Source Sans 3
  renders the fallback. `typo.js` reads only the first name of the computed
  `font-family`, so it passes while the wrong face renders.
- Change: in step 1, read the family name from the installed package CSS and
  use it in `--ui`, `typo.js` `UI` and the DESIGN.md frontmatter. Add a proof
  to acceptance 1: a browser check (in `typo.js` or `app/states`) that
  `document.fonts` reports the face `loaded` and that
  `document.fonts.check('16px "<family>"')` is true in RU and EN text.

B3. The art-well file list names a file with no art and misses the real
readers.
- Where: section 8 "In scope", "Files expected" (the art well), step 5,
  acceptance 5.
- Defect: `HomebrewCards.svelte` draws set and rule cards; it has no `<img>`
  and no `artSrc`. The `_none.webp` fallback comes from `artSrc()` in
  `app/src/lib/desc.ts`. Its screen callers are `RecordCard`, `RowMain`,
  `TableRows`, `ListCard` (the cover strip), `ArtField` (the editor
  thumbnail) and `RecordActions` (copy image). `PrintCard` must keep
  `_none.webp` (print law). The broken-image path (`app.artBroken`) is not
  named.
- Change: replace `HomebrewCards.svelte` with `ListCard.svelte` and
  `ArtField.svelte`. Name the mechanism: `artSrc` keeps its print result, and
  screen callers draw the glyph when there is no picture or the picture is
  broken. Name the outcome for `RecordActions`' copy image. Add the tests that
  pin `_none.webp` today: `desc.test.ts`, `record.test.ts`, `tables.test.ts`,
  `listsPage.test.ts`, `artField.test.ts`, `homebrewEditor.test.ts` (the
  print preview keeps it). Add the glyph mapping for each kind (`eq` primary,
  secondary, armor; `item`; `consumable`).

B4. Batch 1 contradicts itself on the roll number face, and a DESIGN.md rule
it breaks is not listed.
- Where: section 8 "Files expected" ("mono stays for numbers only (roll
  number, ...)") against the `Badge.svelte` line ("roll number in the UI
  face") and theme 1. Section 5 "DESIGN.md rules changed".
- Defect: the implementer cannot meet both. DESIGN.md "The Numerals Rule"
  says a roll number and a stat line are monospace. Theme 5 also moves the
  stat line out of mono (C33).
- Change: pick one. Recommended: the roll number and the stat line in the UI
  face with its tabular figures (C33, C15). Add "The Numerals Rule" to the
  batch 1 rules in section 5, and remove "roll number" from the mono list in
  "Files expected".

B5. Batch 1 reverses a recorded owner decision without its spec line or a
decision file.
- Where: section 5, section 6 ("Specs that change"), section 8 files.
- Defect: `FEATURES.md` "Chrome" says "Self-hosted fonts were considered and
  dropped ... the owner decided against it". DESIGN.md "The Local Font Rule"
  says "no `@font-face` ... ever". The plan changes DESIGN.md only.
  `CLAUDE.md` sends a decision and its rejected alternatives to
  `docs/decisions/`.
- Change: add `FEATURES.md` "Chrome" (the font bullet) to batch 1's files and
  to section 6. Add one decision file for batch 1 (Source Sans 3 self-hosted;
  rejected PT Sans, Golos Text, Inter, a font service; `--print-ui` keeps
  print). Add one for batch 7 (three jobs and the three-control mode row;
  rejected the scroller, B2's rail and the nine-chip row). Index both in
  `docs/DECISIONS.md`.

B6. The bundle budget has almost no headroom, and the plan does not name it.
- Where: section 8 steps 1 and 9, "Risks and do-nots".
- Defect: `tools/bundle-budget.mjs` measures the unconfigured build at
  252.6 kB against 253 kB (2026-10-22). It counts `.css`. The fontsource CSS
  for every subset, upright and italic, adds `@font-face` blocks.
  `check:fast` runs the budget when the bundle changes.
- Change: add a step: measure after R10 (R10 removes code). If the total
  passes the limit, raise it to the measured total rounded up, under the
  270 kB ceiling, in the same commit with the reason. Or write `@font-face`
  for the Latin and Cyrillic subsets only. Name the outcome in the handoff.

## Risks

R1. P7 re-seeds every English golden in batch 1. Batch 7 re-seeds them
anyway.
- `footSummary` ("Sources and licence") is in the footer of every page, so
  every EN golden moves (`tests/app/snapshots/*`). `shell.test.ts`,
  `printPage.test.ts`, `tests/app/print.js` (`dEn.click('Colour')`) and
  `FEATURES.md` "Chrome" quote the strings. A full re-seed in batch 1 hides
  the small a11y-tree change of the art well.
- Change: move P7 to batch 7, whose header change re-seeds every golden. Or
  keep it in batch 1 as its own commit with its re-seed, and list the four
  quoting files. American spelling matches the shipped "catalog". Keep
  "License" in the DPCGL notice: it is the licence's own title.

R2. Batch 9 crosses a seam and is too big for one review.
- It holds 16 audit ids, about 12 inherited lines, `ListPage.svelte` (about
  2400 lines), `#/lists`, `#/lists/<uuid>`, imports and the add-to-list menu.
  `.claude/README.md` cuts at a different route and filter set and at a
  review that cannot be held in one pass (B5.3, B5.4a).
- Change: split into 9a `#/lists/<uuid>` (A1-A5, A22 owner, A41, A42, prices,
  requests, list roll, the centring line, the inventory-port line) and 9b
  `#/lists` with the add-to-list menu (A14, A16, A18, C35, C61, C62, D6,
  D20). Update the totals in section 7.

R3. The cloudflare-pages B1 rewrites the files that batches 1 and 7 touch.
- After it: Vite `base: '/'`, absolute paths in `app/index.html`, every
  `href` through `app.href()`, `pathRouter`, `/sw.js` at scope `/`. The
  language switch rewrites the `/en` prefix with `replaceState` and stays a
  control. It does not become a link.
- Batch 1: step 1's "relative paths" check becomes "`/assets/` paths". The
  preload `<link>` follows the absolute form. The CLAUDE.md law "Preserve
  relative asset paths" may change.
- Batch 7: job and mode links are paths. The last-roll-section memory holds
  the internal route string. The contract test compares paths. The
  `<title>`, the manifest name and `en/index.html` keep or change the EN
  wordmark: decide which.

R4. Batch 7 does not state the navigation details that a bookmark depends
on.
- The last roll section must store the canonical section
  (`SECTION_SLUG`), not the raw hash. Otherwise `#/roll/hnf` replays its
  source switch on each «Бросок» press, and `#/roll/dread` stores an old id.
- Each old address must light the right job and mode: `#/roll/core`, `hnf`,
  `all` -> «Обычные правила»; `roll/dread`, `roll/voa` and the rest -> the
  named supplement chip. Add both to the `routes.json` replay.
- Name what is lit on `#/lists`, `#/lists/<uuid>` and `#/homebrew` (A37).
- Name the sticky rows and the measured header height at 360 and 1180. The
  mock stacks the brand, the jobs and the mode row, about 215 px against
  today's 112 px. FEATURES.md "Chrome" and DESIGN.md "The Two Breakpoints
  Rule" hold the old figures.
- C48 removes `SupplementNav`. Batch 7 deletes
  `supplementNav.test.ts`, its `COVERAGE.md` row and its `a11y.test.ts`
  `COVERED` entry. It also rewrites the «Дополнения» departure of rule 4 and
  the "Rolling" paragraph that cites the supplements panel.

R5. The plan has no line for tests of new pressed and open states.
- Batch 1: the neutral pressed variant of `Chip` and `Seg` needs a
  component case with `expectNoA11yViolations` (`chip.test.ts`,
  `shell.test.ts` for `Seg`). The case keeps `aria-pressed`, and the check
  icon is `aria-hidden`. The new branches must meet the per-file
  component thresholds (85/80/75/85; `Badge` 50 branches).
- Batches 2-10 add open states: the supplements menu, the filter sheet,
  the selection mode, «Ещё», the bottom sheet, the note switch. Add one line
  to section 9: each new open or pressed state gets an `inventory.js` entry,
  a golden in RU and EN, and an axe case in the same change. List the known
  ones per batch.

R6. The plan text still says that batches 1-6 and 8 can run before R10.
- Section 10 ("R10 slips; batches 1-6 and 8 do not wait") and `context.md`
  Constraints conflict with the owner's order: all batches start after R10
  and cloudflare-pages. Batch 1 also touches `ListPage`, `ListCard` and
  `typo.js` (its `dhloot.lists.v2` seed and `#/lists/a`), which R10 changes.
- Change: state the owner's order in section 10 and Status. Name the
  `typo.js` seed for the dispatch refresh.

R7. The task branch lives for 11 batches before one squash.
- Batch 1 touches the font size of nearly every component. Each later task
  on `main` (R10, cloudflare-pages, catalog-filter-links) then conflicts.
- Change: add "merge `main` into `claude/57` at each batch dispatch" to
  section 7. Name `DEBT.md` D112 and D113 (the tables chip panel, owned by
  catalog-filter-links) in batch 2, because batch 2 rebuilds that panel.

## Nits

- N1 (local): Status reads "Plan review: not required". Set it to "required
  before batch 1 (trigger: owner request)", per review.prompt.md section H.
- N2 (local): `--h-page-weight` and `--h-page-spacing` have no replacement in
  section 5, but section 8 deletes `--h-page-*`. `tools/artwork/review/index.html`
  reads all three. Keep the two, or name their new token, and list the review
  page as a reader.
- N3 (local): the kind glyphs are said to be from "Material Symbols, the
  family of `copy`". `copy`, `table` and the toolbar icons are Material
  Icons; `swords` exists only in Material Symbols. Name the family of each
  path.
- N4 (local): "the view switch" is ambiguous. FEATURES.md names two (tables
  list/grid, print colour/black-and-white). Name the ones that batch 1 moves.
- N5 (local): batch 1 standing check 3 says "one pressed style for defaults
  on every page that this batch touches". Batch 1 touches every page, and
  «Все» stays gold until batch 2. Write that the interim mix is not on
  `main` (one squash at closeout).
- N6 (local): handoff Status "Pushed: no (this refresh is not committed)" is
  stale. HEAD is `69f2178` with the refresh committed.
- N7 (local): batch 11 is "docs only", but its re-audit can find a defect.
  Name the path: a defect goes to `DEBT.md`, or batch 11 takes code and pays
  the full gate.
- N8 (deferred-scope): C31 (the `#/p` compact note) is merged into C57 (batch
  2) and placed in batch 8. Name in batch 2 that the decision covers `#/p`,
  and in batch 8 that it applies it.

## Deviations

- The A1 refresh was asked and then withdrawn for R (handoff). Accepted:
  `compare-a.*` is history and the plan was not rewritten for A1.
- Batch 1's split criterion ("a review that cannot be held in one pass") is
  a named seam (`.claude/README.md`, R0b). Accepted.

## Standing checks

1. Scale: checked - section 9 and batch 1 standing check 1. The caps are
   named. Each batch's States table is deferred to its refresh, which is
   acceptable for outlines. Missing: the header height at 360 with three
   rows (R4) and the supplements menu at 360 (seven items, about 270 px,
   `R/roller-supmenu__360__ru.png`: it fits).
2. Error scenarios: checked - section 9 item 2 and batch 1 item 2. The plan
   adds no write path. Font failure, offline, stale tab and revert are
   answered. The service worker caches hashed font files under `ASSET_CAP`.
   The last-roll-section memory is per tab and loses nothing. No unnamed
   loss.
3. Consistency: checked - FEATURES.md "Consistency rules" 4, 9 and 11, and
   DESIGN.md Named Rules. Departures not named: the Numerals Rule (B4), the
   FEATURES.md font bullet (B5), the «Дополнения» departure of rule 4 and
   the Two Breakpoints Rule figures (R4).
4. RU/EN parity: checked - audit P and D rows, the EN 360 mocks for the
   header (`R/header__360__en.png`), and the dict strings for P7. New
   strings have both languages. Name the EN wordmark scope (R3). P7 touches
   two EN strings only (`footSummary`, `printColor`).

Owner rules: checked - `context.md` "Decisions already settled". The ESLint
mock ignore is in `eslint.config.mjs`. The clarity rule (DESIGN.md, batch
11), the EN wordmark (batch 7), the mode row and job icons (batch 7), the
font dependency (batch 1) and the detector exceptions (batches 1, 9, 11)
each have a home and a batch. None is over budget.

## Suggested next action

The planner applies B1-B6, R1-R7 and the local nits N1-N7 to `plan.md` (and
`context.md` for R6) with no second review. Then the batch 1 dispatch refresh
runs after R10 and cloudflare-pages ship. It re-checks: the base path and the
`app/index.html` form (R3), the language switch control (R3), the bundle
total after R10 (B6), the `typo.js` seed (R6), the file list from `git grep
-n -E "artSrc|var\(--ui\)|--h-page|--step-0" -- app/src tools/artwork`, and
the owner's screen notes.

## Checks still needed

- The installed family name of `@fontsource-variable/source-sans-3` and the
  Cyrillic coverage of its italic subset (batch 1 step 1).
- `npm run budget` on the post-R10 tree with the font CSS.
- Whether Vite rewrites a `<link rel="preload">` to a hashed font in
  `app/index.html` under `base: '/'`.
