# Plan - TASK 57

This plan settles the design direction of the UI audit (phase 2) and orders
the phase 3 batches. Phase 1 findings are in `audit.md`; facts and owner
decisions are in `context.md`.

## Status

- Phase 1 (S1): done, triaged (`context.md`).
- Phase 2 (S2): done - three directions, three options, a recommended
  combination R, mocks and this plan. Waiting for the owner's choice.
- Phase 3: batch 1 is implement-ready (section 8); batches 2-11 are outlines.
- Plan review: not required (no trigger fired). No migration, no SECURITY
  DEFINER function, no public contract change (routes, ids, links, asset
  paths stay; font files are new paths, not changed ones), no stored data or
  `localStorage` key at risk, no new write or sync protocol.
- NEEDS_HUMAN_CONFIRMATION: yes - the owner approves R (section 1) or names
  another direction or option (section 11).

Mocks: `issues/57/mocks/direction/index.html` (R first). Shared code and the
font specimen: `mocks/direction/shared/`. Discovery came from the phase 1
triage; this session had no question tool, so the Impeccable interview was
replaced by the owner's recorded decisions (`context.md`).

## 1. Recommendation (R)

R is direction B, option B1, with A1's gold budget, the Source Sans 3 font,
and one part of C. Set: `mocks/direction/R/` (six surfaces, 360 and 1180 RU,
EN 360 for the header, the item and the editor, and the editor's failed save).

| Part | Source | Reason |
|---|---|---|
| Three jobs (Бросок, Таблицы, Поиск) and one row of nine roll modes | B1 | Every top-level place is visible at 360 in both languages, so no tab hides behind a scroll (C6, P9, D10). |
| Filter column beside a column table at desktop width; a filter sheet at 360 | B1 | The GM compares weapons by column, and the panel no longer pushes the rows 570 px down (C3, C54). |
| Two-pane roller: controls on the left, results on the right | B1 | The result is the focus during play and the controls stay in reach (C39, C25). |
| Dossier item page, bottom-sheet dialog with a fixed action bar at 360 | B1 (A's sheet) | It uses the desktop width (C17) and keeps the actions reachable on a phone (C44). |
| List controls and notes in a side column | B1 | The first item is in view at once, and the controls do not wrap above it (A3, A1). |
| Strict gold budget | A1 | The Seal Rule is already the system's own law; A2 keeps gold on defaults, which is the defect C13 names. |
| Source Sans 3, self-hosted | font study (section 4) | It meets every hard requirement, and it is the only OFL candidate whose tabular figures and Cyrillic I could check on this host. |
| Roll results drawn as the card face (art fading into the plate, kind tag, stat ribbon) | C1 | It gives the one moment that matters at the table the register of the printed card, and it uses the fixed art at full width. |

Trade-off accepted: the navigation changes shape, so a returning GM learns
one new click ("Бросок" then the mode), and the plan pays two more batches
than A (11 against 9).

Conflicts and how R resolves them:

- C's card name is set in heavy capitals; A1 allows capitals only for section
  labels (A39). R sets the name in title case at the title step.
- C draws the tier banner; the print vectors must not be redrawn. R shows the
  tier as a badge on screen and draws no banner.
- B's filter column needs a width the two system breakpoints do not give.
  R makes it a container query of the tables page, which the Two Breakpoints
  Rule allows for one component and its own measured problem.
- B's mode row and job tab are two "current place" marks on a roll page. R
  keeps both: the tab is a gold underline, the mode is the one gold fill.

Considerations weighed:

- Density: B keeps the table density and adds columns; C loses about half of
  it in the grid and the list; A keeps today's density.
- Clarity rule: B has no hidden navigation and labels every action; A still
  hides two tabs at 360; C needs a dot row to tell a phone user that more
  cards follow.
- Fixed art: C uses it best, B well (4:3 crop window on results, 460 px on the
  item page), A as today. All keep the image bytes and use the kind glyph
  for a record without a picture.
- Fantasy register: C strongest, R takes C's card face for the roll result;
  A and B rely on the art and the font.
- Impeccable with no exceptions: all four pass the anti-pattern rules on the
  mocks; the remaining findings are DESIGN.md frontmatter gaps that the lock
  batch closes (section 2, "Detector").
- RU/EN length: B's job labels are short in both languages; A's five tabs are
  the longest strip at 360; C's capitals make RU names two lines in a 156 px
  card.
- Gate cost: A 9 batches, R/B 11, C 12 (section 7).

What would make me choose differently: if the owner wants no navigation
change before `cloudflare-pages` moves `/en/` into the URL, take A1 with the
C card face on roll results (batches 2-7 stay, batch 8 shrinks to A's tab
polish).

## 2. Directions compared

| | A - polish in place | B - two-level index | C - card table | R - recommended |
|---|---|---|---|---|
| What changes | Rules enforced, font, type floor, labels, placeholder; layout and navigation stay | Navigation regrouped; filter column and column table; two-pane roller; dossier; list side column | A record is shown as its card: roll hand, card item page, card grid and card list | B1 + A1 gold + C card face on roll results |
| Options | A1 strict gold (in the set); A2 lenient gold (`catalog`, `roller`) | B1 three jobs in the header (in the set); B2 left rail and phone bottom bar (`header`, `roller`) | C1 screen card (in the set); C2 printed paper card on the item page (`item`) | - |
| Batches | 9 | 11 | 12 (the card face needs the exported vectors on screen) | 11 |
| Risk | Low; the 360 tab strip stays a scroller | Medium; navigation spec and goldens change; a container query | High; density drops, print vectors on screen, long RU names in narrow cards | Medium, as B |
| Detector on the mocks | Passes the anti-pattern rules | Passes | Adds an 8.5 px step (the tier banner label) | Passes |
| Fit with the fixed art | As today: 56 px rows, 150 px result art | Good: 4:3 result art, 460 px item art | Best: art is the card's top, faded into the plate | Good, best on roll results |
| Clarity at 360 | Two tabs off-screen | All places visible | A deck that scrolls sideways | All places visible |

Detector: `impeccable detect --json issues/57/mocks/direction` after the
fixes found no anti-pattern (the striped GM-note ground and black mask stops
were removed). It still reports `design-system-font-size`,
`design-system-color` and `design-system-font`: the sizes, the gold gradient
stops `#e2b76c`/`#e8c27c`, the wash `#1b2b3d` and the font are not in the
DESIGN.md frontmatter. Batch 1 writes the new ramp and the font there; batch
11 records every remaining colour. `#6f8fb0` is the mock caption colour only.

Directions not taken, one reason each:

- A: it leaves C6 half fixed (a fade still hides two tabs at 360) and C17 as a
  narrower card.
- C: it halves the catalog density that 1459 records need, and it puts the
  print vectors on screen, which costs a batch and a print review.
- B2: a rail takes 236 px of every desktop page, and a phone bottom bar
  covers the toast and the selection bar (C12, C34).
- A2: gold on defaults is the defect C13 names.
- C2: white paper on the dark page is the brightest object on screen, and the
  printed card already has its own page (`#/p/<id>`).

## 3. The eight themes

| # | Theme | Decision | Rejected, one reason each | Settles |
|---|---|---|---|---|
| 1 | Gold spent on things nobody chose | Polish in place. Gold fill: one primary action per panel, a choice that narrows the view, the current place. A pressed default (`«Все»`), a mode toggle (view, language, prices) and a selection are neutral: a lit border and a check. Roll buttons are plain; the one that made the shown result keeps a gold border. Unique tag neutral dashed; footer links muted; roll number in the UI face. | A2 lenient budget: gold on defaults is C13. A second accent: two accents halve the signal. | C9, C13, C18, C25, C28, C45, C49, A4, A16, A26 |
| 2 | Help text repairs controls | Polish in place: each control says what it does (captions, option text, counts), so a panel holds nothing new. The three panels stay behind a labelled «Справка» button until the owner decides per batch mock (owner, 2026-10-23). | Remove the panels now: the owner keeps that decision per batch. Tooltips: they are help text in another place. | C1, C38, A27 (panel), clarity inventory |
| 3 | Labels change with the width | Polish in place: one action vocabulary, the same labels at every width, and one «Ещё» / "More" overflow for the rare actions. Vocabulary: «В список», «Поделиться», «Печать», «Ещё» (Скопировать текст, Скопировать название, Скопировать картинку, Скопировать ссылку, Копия в мои предметы). | Icon-only at 360 (today): fails the clarity rule. An action sheet per card: one more tap for the primary action. | C5, C18, C27, C40, A23, A36 |
| 4 | Navigation at 360 and after R10 | Redesign: three jobs and a row of nine roll modes (B1). «Бросок» opens the last roll section of this tab, else `#/roll/std`. The account control is «Войти» signed out and an initial with a chevron signed in, lit on `#/account`; the menu is the only path to «Мои списки». | A1 scroller with a fade: two tabs stay hidden. B2 rail: costs 236 px and a bottom bar. Shorter tab names: the names change between the menu, the tab and the heading. | C6, C7, C27, C48, A28, A35, A37 |
| 5 | Type floor and caps | Polish in place with a new font: ten steps (23, 20, 18, 16, 15, 14, 13, 12, 11.5, numeral 19); data text 13 px at the least; capitals only for section labels and badges. | Keep Inter at 12 px: it is a local name most machines lack, and the detector flags it. Mono for stat lines: Cyrillic words in mono at 11 px are C33. | C2, C33, A5, A39 |
| 6 | Density on phones, space on desktop | Redesign for the catalog, roller, item and list (B1); polish for the rest. Rows: name with its tags after it, one stat line, one feature line, tags that repeat the active filter hidden, no tier in the stat line under a tier heading; a selection mode («Выбрать») replaces the always-on checkbox column. | C card grid: half the density. Keep the 520 px card: C17. | C3, C10, C17, C39, C54, C56, A1, A40 |
| 7 | Missing art | Polish in place. Every record has its image (C55 and C11 were a lazy-load capture artefact, `context.md`). A record with no picture (homebrew) and an image still loading show the kind glyph on the art well; the "?" pedestal moves to empty states. | Keep the pedestal on rows: it reads "unknown item", not "no picture". Generated art: the art is fixed. | C11, C55, A10, A38 |
| 8 | State and empty-state consistency | Polish in place: an empty or error page names the cause and one next step; a temporary choice lives where it is made, with no note; a dialog keeps its actions in a fixed bar. | A new empty-state illustration set: the art is fixed and the pedestal exists. | C16, C32, C44, C57, A18 |

## 4. Font

Today: no `@font-face`; `--ui` starts with the local name 'Inter', so Windows
renders Segoe UI, macOS SF and Android Roboto. `PrintCard.svelte` reads
`var(--ui)`.

Candidates (checked 2026-10-23 with a local parser of the font files, and with
the detector):

| Font | Licence | Cyrillic | Tabular figures | 12 px | Detector | Verdict |
|---|---|---|---|---|---|---|
| Source Sans 3 | OFL | full (upright and, in v3, italic) | default figures are tabular (`pnum` switches them off) | open forms, clear at 12-13 px | not flagged | chosen |
| PT Sans | OFL (ParaType) | Cyrillic-first design | no `tnum` | good | not flagged | rejected: stat numbers would need the mono face again (C33) |
| Golos Text | OFL (ParaType) | Cyrillic-first | not verified | good | not flagged | rejected for now: no local file to check `tnum` or to show in the mocks |
| Inter | OFL | full | `tnum` | good | flagged `overused-font` | rejected: the owner wants the exception gone |
| Open Sans, Roboto, Lato | OFL/Apache | full | `tnum` | good | flagged | rejected |

The mocks render Source Sans from OFL files copied to
`C:\Users\Ignat\.dhloot\notes\57\fonts\` (the Source Sans Pro release, whose
italic has no Cyrillic; the product takes Source Sans 3, whose italic has it).
Specimen: `mocks/direction/shared/fonts__1180.png`.

Loading: self-hosted woff2 from the build's own origin, Latin and Cyrillic
subsets with `unicode-range`, `font-display: swap`, the upright subset
preloaded. No font service. The service worker caches the files as hashed
assets (`ASSET_CAP` grows to hold them).

Print: the new font does not reach the print cards. The card keeps today's
stack through a new token `--print-ui`. A print font change is a separate,
optional batch with the print checks and the owner's yes.

## 5. Token changes and DESIGN.md rules

Tokens (`app/src/styles/tokens.css`), each added with its first reader:

| Token | Value | Replaces |
|---|---|---|
| `--ui` | `'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | the Inter-first stack |
| `--print-ui` | today's `--ui` value | `var(--ui)` in `PrintCard.svelte` |
| `--t-page` | 23px | `--h-page-size` (same value) |
| `--t-section` | 20px | 19, 20 |
| `--t-title` | 18px | 17, 18, 19 |
| `--t-body` | 16px | `--step-0` 15.5 |
| `--t-control` | 15px | 14 and 15.5 controls |
| `--t-small` | 14px | 13.5, 14 |
| `--t-data` | 13px | 11, 11.5 (mono stat line), 12.5, 13 |
| `--t-label` | 12px | 11.5 labels, 12 |
| `--t-badge` | 11.5px | 10.5, 9.5 |
| `--t-num` | 19px (mono) | 20 in the number field |
| `--art-well` | `#0a0810` | the literal in the record components |

`tests/app/typo.js`: `UI = 'Source Sans 3'`, `SCALE = [23, 20, 19, 18, 16,
15, 14, 13, 12, 11.5]` (19 for the numeral). Colours do not change.

DESIGN.md rules changed (each written by the batch that ships it):

- The Local Font Rule becomes "one self-hosted family from the build's own
  origin; no font service; the print card keeps the local stack" (batch 1).
- The Sixteen Steps Rule becomes a ten-step rule with the 13 px data floor
  (batch 1).
- The Seal Rule gains the budget of theme 1, with the neutral pressed
  default (batch 1).
- Capitals only for section labels and badges (batch 1).
- The kind glyph on the art well is the no-picture state (batch 1).
- Navigation: three jobs and the mode row replace the six-tab text; the
  wordmark is «Лут» in RU and «Loot» in EN, which replaces "never
  translated" (batch 7).
- Book names stay Latin in RU (P13) (batch 2).
- The clarity rule, as a check, in "Notes"; the detector exceptions list,
  empty (batch 11).

## 6. Scope, contracts and dependencies

- In scope: every row of `audit.md` (section 7 places each), the post-R10
  shape, both languages, 360 to 1600.
- Not in scope: print card layouts and sheets (product law); new features;
  the surfaces R10 deletes; the link-preview Worker's card images (they keep
  their own font, `tools/artwork/fonts/`).
- Contracts stay: routes, ids, links, asset paths, `data.js`. New: font files
  under the build's assets. Specs that change: `FEATURES.md` "Chrome" and
  `ROUTES.md` "Sections" (batch 7), `STATE.md` (the last roll section, memory
  only, batch 7), `META.md` section 9 (asset cache, batch 1).
- R10 `B10.3` first for batches 7, 9 and 10 (header, tab bar, add-to-list
  menu, list pages). `catalog-filter-links` touches `FilterBar`: whichever
  lands second merges the other.

## 7. Phase 3 batch outline

Each batch: the owner approves its mock first (`issues/57/mocks/<N>/`, from
R), a help panel it touches is shown with its replacement and asked about,
and its `verify` rows are checked in a live browser first.

| # | Batch | Audit ids | Mock to approve | After R10 B10.3 | Split criterion |
|---|---|---|---|---|---|
| 1 | Foundation: font, ten-step ramp, tokens, gold primitives, art well | C2 (type), C9, C28, C33, A39, C55, C11, A10, A26, P7 | `R/*` (all surfaces show the font) | no | a review that cannot be held in one pass: it moves every route's text metrics; layout work on top would hide its regressions |
| 2 | Catalog tables and filters | C1 (panel, ask), C3, C4, C5, C7, C8, C10, C12 (verify), C53, C54, C56, C57, C58, C59, A25, A40 (tables), P1, P13, P14, P15 | `R/catalog` | no | a different route and filter set (`#/tables/*`) |
| 3 | Record card, actions, item page, dialog, `#/h` | C17, C18, C19, C20, C21, C22, C34 (verify), C40, C44 (verify), C45, C46, C47, A23, A24, P4, P5, P6 | `R/item` | no | a different component group and route (`#/i/`, `#/h/`, the dialog) |
| 4 | Roller pages and the card face on results | C23, C24, C25, C26, C36, C37, C38 (panel, ask), C39, C41, C43, C49, P10, P11 | `R/roller` | no | a different route and filter set (`#/roll/*`) |
| 5 | Homebrew editor | A6, A7, A8, A9 (verify), A11 (artefact, close), A12, A30, D14 (verify), D15, editor clarity rows | `R/editor` | no | a different route (`#/homebrew/<id>`) |
| 6 | Homebrew pages and imports | A13, A27 (panel, ask), A28, A29, A38, A40 (homebrew), D5, D16 | new mock | no | a different route and filter set (`#/homebrew` tabs) |
| 7 | Shell: header, jobs, mode row, account control, wordmark | C6, C27, C48, C52, A35, A36, A37, P9, D9, D10, D11 | `R/header` | yes | a public spec change (`ROUTES.md`, `FEATURES.md` Chrome) and R10's files |
| 8 | Search, account, print preview, empty and error states | C13, C14, C15, C16, C29, C30, C31, C32, C60, A15 (verify), A31, A32, A33, A34, D7, D8 (verify) | new mock | no | different routes (`#/search`, `#/account`, `#/p/`, error pages) |
| 9 | Account list page, list cards, add-to-list menu, lists import | A1, A2, A3, A4, A5, A14, A16, A18, A22 (owner editor), A41, A42, C35, C61, C62, D6, D20 | `R/list` | yes | R10's files (`ListPage`, `AddToList`) and a different route |
| 10 | Shared list page `#/s/<token>` | A19, A20, A21, A22 (GM view), A40 (`#/s`), D2 | new mock | yes | a different route and filter set |
| 11 | Lock: DESIGN.md, detector clean, re-audit, closeout | C63 (artefact, close), all rows re-checked | none | after 10 | docs and closeout only |

Every row of `audit.md` is placed above. Theme rows are decided in section 3
and implemented in the batch named. Rows cited only inside other rows (C36,
C41, C43, C46, C47, C50, C52, C60, C62, C64, A26, A36, A37) go with their
parent row's batch; C50, C64 and A26 go to batch 1 with C9 and C28. A40
(always-on checkboxes) is done per surface: tables in batch 2, homebrew rows
in batch 6, list rows in batch 9, `#/s` in batch 10 (with A19).

Inherited acceptance lines (each is its own line in its batch):

- Batch 9: the `side-tab` entry for `ListPage.svelte` leaves
  `.impeccable/config.json`, and the detector passes on `ListPage.svelte`
  without it (owner, 2026-10-23).
- Batch 1: the `overused-font: inter` entry leaves `.impeccable/config.json`,
  and the detector passes on `tokens.css` without it.
- Batch 11: `ignoreValues` holds only exceptions that DESIGN.md "Notes"
  records (target: none), and `.impeccable/design.json` is regenerated.
- Batch 7: DESIGN.md records the EN wordmark «Loot».
- Batch 2 and batch 4, batch 6: the owner's answer on each help panel.

Gate cost per batch (`.claude/README.md`, "Batch size and the fixed cost of a
run"): `npm run check:fast` 4-12 min, one CI run 10.5-11.5 min, one review fix
cycle (a second `check:fast` and CI run), and golden re-seeds by CI's text
where a11y text moves. About 35-45 min of gates per batch; 11 batches, about
7-8 hours of gates in total. Batch 1 also runs `node tests/run-all.js
app/print,app/typo,app/hues,stub` locally (about 5 min), because the print
token moves.

Under the other directions:

- A: batch 7 becomes tab polish (fade, the account control, the wordmark);
  batches 2, 3, 4 and 9 lose their layout changes (no column table, no
  two-pane roller, no dossier, no list side column). 9 batches.
- B: as R, without the card face in batch 4.
- C: batch 3 and batch 4 take the card face for every record surface and
  need the exported vectors on screen (a new batch before 3, with the print
  checks); batch 2 makes the grid the main view. 12 batches.

## 8. Batch 1 - Foundation (implement-ready)

Objective: ship the new UI font, the ten-step ramp, the type and art tokens,
the neutral pressed state, and the kind-glyph placeholder, with print
unchanged. No layout change.

In scope: tokens, the font files and their loading, the type sizes in every
component (mechanical, to the nearest step of the table in section 5), the
neutral pressed default for `Chip` and `Seg`, the unique and roll-number
badges, footer link colour, the art well and glyph in `RecordCard`,
`RowMain`, `TableRows` and `HomebrewCards`, P7 spelling, DESIGN.md rules
listed under batch 1 in section 5.
Out of scope: navigation, layouts, labels, help panels, print layouts.

Files expected:

- `package.json`, `package-lock.json`: devDependency
  `@fontsource-variable/source-sans-3` (exact version). Fallback: woff2 files
  from the Adobe release under `app/public/fonts/` with an `@font-face` in
  `tokens.css`. The dependency add needs the owner's yes at the batch mock.
- `app/src/main.ts`: import the upright and italic CSS of the package before
  `tokens.css`.
- `app/index.html`: one `<link rel="preload" as="font" type="font/woff2"
  crossorigin>` for the upright Latin and Cyrillic subsets, if Vite exposes a
  stable path; else no preload (record why).
- `app/src/styles/tokens.css`: the tokens of section 5; delete `--step-0` and
  `--h-page-*` after their readers move.
- `app/src/components/PrintCard.svelte`: every `var(--ui)` becomes
  `var(--print-ui)`; nothing else.
- Components with a literal size: every `.svelte` file `git grep -n -E
  "font(-size)?:.*[0-9.]+px" -- app/src/components` lists, mapped to the
  tokens; mono stays for numbers only (roll number, qty, price, number field,
  damage dice).
- `app/src/components/Chip.svelte`, `Seg.svelte`: a neutral pressed state for
  the default option (a prop that callers pass for «Все»/"All" and for mode
  toggles; callers move in their own batches, except the language switch and
  the view switch, which move here).
- `app/src/components/Badge.svelte`: unique neutral dashed; roll number in the
  UI face.
- `app/src/components/Shell.svelte`: footer links `--muted`, underlined.
- `app/src/components/RecordCard.svelte`, `RowMain.svelte`,
  `TableRows.svelte`, `HomebrewCards.svelte`: the art well draws the kind
  glyph (sword, shield, flask, gem; the icon set in `Icon.svelte`) under the
  image; a record without a picture shows the glyph and no `_none.webp`.
- `app/public/sw.js`: `ASSET_CAP` raised to hold the font files; `META.md`
  section 9 says so; `tests/sw.test.mjs` if it asserts the cap.
- `tests/app/typo.js`: `UI`, `SCALE`.
- `app/src/lib/dict.ts`: P7 - one English spelling app-wide (recommended:
  American, as the Daggerheart books print it: "Color", "license").
- `DESIGN.md`: the batch 1 rules of section 5 and the frontmatter typography
  (font, ten steps) so the detector reads them.
- `.impeccable/config.json`: remove the `overused-font: inter` entry.
- `tests/app/inventory.js` and goldens: no new state; re-seed only what moves.

Behaviour and UI constraints: the mocks in `mocks/direction/R/` for the font,
sizes and the neutral pressed chip; no layout or label change in this batch;
print output byte-identical in layout (the print suite and `check:built`
prove it).

Steps:

1. Add the font dependency and import it; build with `npm run build:test`
   and confirm the woff2 files land under `dist-test/assets/` with relative
   paths.
2. Add the tokens; move `PrintCard.svelte` to `--print-ui`; run the print
   suite (`node tests/run-all.js app/print`).
3. Map every component size to the ramp; update `typo.js`; run `node
   tests/run-all.js app/typo`.
4. Add the neutral pressed variant to `Chip` and `Seg`; use it for the
   language and view switches; badges; footer links.
5. Add the art-well glyph; remove `_none.webp` from row and card rendering
   (keep the file: empty states use it in batch 8).
6. P7 spelling in `dict.ts` (both language tables stay in step).
7. Service worker cap, `META.md` section 9.
8. DESIGN.md rules and frontmatter; remove the Inter ignore; run the
   detector over `app/src`.
9. `rtk npm run check:fast`, commit, push, CI credit.

Acceptance criteria:

- The app renders in Source Sans 3 on a machine without it installed; no
  request leaves the origin for a font.
- `typo.js` passes with the ten-step scale and the new UI family.
- The print suite passes with no change to any print measurement.
- `impeccable detect --json app/src` reports no `overused-font` finding, and
  `.impeccable/config.json` has no Inter entry.
- A homebrew row with no picture shows the kind glyph; no row shows the "?"
  pedestal.
- The language and view switches show the neutral pressed state; gold is not
  used on them.
- RU and EN strings change together (P7).

Verification: `rtk npm run check:fast` (Bash timeout 600000); `node
tests/run-all.js app/print,app/typo,app/hues,stub`; `npm run check:built`;
push and CI credit (CI runs the sweep at 360, 390, 768, 1180 and the golden
shards).

Risks and do-nots:

- The ramp change moves text widths everywhere; the sweep at 360 is the
  check. Do not change a layout to absorb it in this batch: list the overflow
  and fix the smallest cause.
- `TablesPage.svelte`'s scroll wait now waits for a real font; keep the wait
  and update its comment (the face exists now).
- The artwork review page under `tools/artwork/review/` draws the card head
  from the same CSS; it gets the font through the same import or keeps the
  fallback - name the outcome in the handoff.
- Do not touch print layouts, `PrintPage` structure or `card-vectors.css`.

Standing checks for batch 1:

1. Scale: no collection or cap changes. States: every route at 360 and 1180
   (sweep); the longest names (`Возвращающийся клинок`, a 100-character
   homebrew name) at 360 in both languages; proof: sweep and typo suites.
2. Error scenarios: the font fails to load - `swap` shows the fallback stack
   and nothing is stored; offline - the cached font or the fallback; a stale
   tab - the old bundle keeps its own font links; a revert - the previous
   frontend ignores the font files. No stored data changes.
3. Consistency: FEATURES.md rules 1-11 unchanged; one pressed style for
   defaults on every page that this batch touches.
4. RU/EN parity: P7 changes EN strings only in spelling; RU unchanged; both
   tables keep the same keys.

## 9. Standing checks for the plan

1. Scale: each batch from 2 on writes its States table; the limits that the
   changed screens draw are the list caps (100 entries, 50 lists), the
   homebrew caps (100 items, 20 sources, 30 sections) and the 9 roll modes;
   the mocks cover one, many, the longest names and 360/1180. The filter
   sheet at 360 with the keyboard open and the editor's fixed bar are the
   sticky regions to measure in batches 2 and 5.
2. Error scenarios: the redesign adds no write path. Batch 5 keeps the
   conflict state (A30, the primary must not overwrite); batch 9 keeps the
   list save, undo and limit states; each batch names load, failed read,
   failed write, offline, conflict, deleted record, stale tab and revert for
   its screen.
3. Consistency: rule 4 (one name) drives the job tab, the mode chip and the H1
   («Обычные правила» in all three); rule 9 (the primary action first) drives
   the item and editor bars; rule 11 drives «Закрыть» on sheets. A departure
   is named in its batch.
4. RU/EN parity: every mock exists in both languages for the header, the item
   and the editor; every new string has both languages and the same facts; P5,
   P6, P7, D11, D15 and D16 close named gaps.

## 10. Risks, assumptions, deferred

- Assumption: Source Sans 3 italic carries Cyrillic in the version the batch
  installs; batch 1 checks it with the same parser before it ships.
- Risk: the navigation change confuses returning users; the mode row keeps
  every section one click away and every address works.
- Risk: R10 slips; batches 1-6 and 8 do not wait for it.
- Deferred: a print font change (optional, owner's yes, own batch); the
  link-preview card images keep Inter; a Golos Text trial if the owner wants a
  Cyrillic-first face.

## 11. Owner questions

1. Approve R: B1 navigation and work areas, A1 gold budget, Source Sans 3,
   and C's card face on roll results only. Recommended. Or name a direction
   and option (A1, A2, B1, B2, C1, C2).
2. Batch 1 adds the dependency `@fontsource-variable/source-sans-3` (OFL,
   self-hosted). Recommended; the fallback is committed woff2 files.
