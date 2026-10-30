# Plan - TASK 57

This plan orders the phase 3 batches of the UI redesign (direction R) on the
shape of `main` at `c8243ba6`. Phase 1 findings and their re-check are in
`audit.md`; facts and owner decisions are in `context.md`.

## Status

- Phase 1 (S1) and phase 2 (S2): done. The owner chose R on 2026-10-23.
- Refresh against `main` (2026-10-29): done. `claude/57` merged `main` at
  `9112c4ed`; every `audit.md` row is re-checked (`audit.md`, "Re-check
  against main"); every address in this plan is a path.
- Phase 3: twelve batches in the order 1, 1b, 2, 3-7, 8, 9, P, 10 (section 7;
  the waves of section 16 moved P from after 1b into wave 3). Batches 1
  (`9a31aede`, `80872b35`), 1b (`fce4a9f8`, `3e5f6301`; `reviews/1b.md`) and 2
  (`30de6bf5`, fix pass `65829261`; `reviews/2.md` approve) are done, and wave
  1 landed on `main` as `d83384b4`; `claude/57` merged it at the batch 3
  refresh (2026-10-30). Batch 3 is implement-ready (section 10). Batches 4-10
  and P are outlines; each one's refresh expands it.
- Release (owner, 2026-10-29, `context.md` "Release in three waves" and its
  "Reviews" paragraph): three waves - 1, 1b, 2; then 3-7; then 8, 9, P, 10 -
  each squashed onto `main` after its last batch's review and green CI, with
  no owner screenshot gate; one post-release live check after wave 3, then the
  closeout (section 16). This replaces "one squash at closeout" and "no batch
  lands on `main` before the owner has seen its screenshots".
- Mocks: every batch mock from 1 to 9 is drawn ahead (section 9); the owner
  confirms each one before its implementer starts. Mock P is drawn (2026-10-29,
  owner) from the pre-batch-1 build; its no-picture well follows mock 1b.
- Print review (owner, 2026-10-29, `context.md` "Print review", "Print feel"):
  the print audit is `audit.md`, "Print audit (2026-10-29)"; batch P (section
  15) runs in wave 3, after batch 9, and takes the `/p/` page rows C29, C30
  and C31 from batch 7.
  Batch P fires no plan-review trigger: it changes no public contract (the
  four burden files of `card/` keep their paths and take the Figma node's
  vectors as new bytes - `CONTRACTS.md` section 5 freezes the paths, as for the
  share cards; a card size change is a product rule of `FEATURES.md` and
  `CLAUDE.md`, not a `CONTRACTS.md` one), no stored data or key and no write
  protocol. If its refresh makes it delete or rename a `card/` file, it writes
  a `required` line before P.
- Plan review: required before 1 (trigger: public contract changes in batch 1b - the no-picture asset paths of CONTRACTS.md - and in batch 2 - routes.json tab, llms.txt)
- Plan review coverage at the earlier refreshes (2026-10-29): no new plan review was required. Batch 2's contract set (`routes.json` `tab` and `mode`, `llms.txt` with `tests/contracts.js` and `CONTRACTS.md`) and batch 1b's (the no-picture asset paths) were reviewed by `reviews/plan-1-2.md` and `reviews/plan-1-3.md`; the later parts (light print well, waves, mark, burden hands, bottom line, first-screen exceptions) change no contract, store no data and add no write protocol.
- Plan review coverage at the batch 3 refresh (2026-10-30): no new plan review
  is required (no trigger fired). Batch 3 changes no `CONTRACTS.md` path, no
  `docs/fixtures/` value, no `tests/contracts.js` line and no `llms.txt` text:
  `routes.json` `picked` keeps its values and only `tests/app/contracts.js`
  reads the new filter chips beside the shared page's pills. It stores nothing
  (the selection mode, the sheet and the viewport band are memory), adds no
  migration, no SECURITY DEFINER function and no write or sync protocol. The
  new `viewport` port reads the window width only.
- Plan review findings applied: reviews/plan-1-3.md
  - All 15 findings were applied before the batches they touch shipped (the report holds each id, section and change); the sub-bullets were collapsed at the batch 3 refresh (2026-10-30, last full text: `git show 65829261:issues/57/plan.md`, Status).
- Plan review findings applied: reviews/plan-1-2.md
  - All 29 findings were applied before the batches they touch shipped (the report holds each id, section and change); the sub-bullets were collapsed at the batch 3 refresh (2026-10-30, last full text: `git show 65829261:issues/57/plan.md`, Status).
- Earlier refresh history (device shares, First-Screen Rule, mock answers, mock-unit findings, the 2026-10-29 folds): `context.md` holds the owner decisions and `git show 65829261:issues/57/plan.md`, Status, the earlier text.
- Batch 3 refresh (2026-10-30): section 10 is batch 3's brief (batch 2's brief
  left; `git show 65829261:issues/57/plan.md`). The mock `mocks/3/` was
  re-checked against `main` and stands. Thirteen planner defaults D1-D13 are
  logged there; two need the owner's later yes (section 13: Q3-S, Q3-T). The
  Impeccable fallback of `reviews/2.md` R1 is named in section 10, "Impeccable".
- NEEDS_HUMAN_CONFIRMATION: no (the owner is away; Q3-S and Q3-T take their
  defaults). Every other question of section 13 is answered; Q-W1 took the
  owner's answer "Wave squash content" (`issues/57/` goes onto `main` with each
  squash).

Earlier plan review: `reviews/plan-1.md` (fix-then-continue) was applied to
the plan of 2026-10-23 (`git show 69f2178:issues/57/plan.md` and the commit
after it). Its findings live on in this rewrite: B1 in batch 2, B2-B6 and N2-N5
in batch 1, R1 (P7) in batch 2, R2's split replaced by the owner's merge, R3
and R4 in batch 2, R5 in section 11 item 5, R7 in section 7. This rewrite
reorders the batches and adds the share cards, so a new plan review reads it.

## 0. What changed since direction R (2026-10-23)

| Change on `main` | Effect on this plan |
|---|---|
| R10 (`e02364d3`): five tabs, no browser lists, `/l/` gone, account lists read by heads | the post-R10 shape is real; the list states of `tests/app/inventory.js` are account-list states (`LIST_A ... as gm4`), so the old batch 9a line that moved them is done |
| Cloudflare Pages (`d0fd98bc`) and path addresses (`1ace55e7`): `/en/` prefix, `pathOf()`, `app.href()`, root-absolute URLs | user-visible addresses are paths; `routes.json` keeps its internal `#/` strings and `tests/app/contracts.js` maps them with `pathOf()`; the `CLAUDE.md` law now reads "Keep URLs root-absolute" |
| Request toasts and the (N) title (`198997ed`) | the toast has a `go` action and a lowest-priority arrival toast; `DEBT.md` D121 (its focus defect) goes to the toast's batch |
| Items-tab filter address, tables nav landmark, 210 px strip cap, bold-italic set names (`f74eae09`) | `DEBT.md` D112 and D113 are fixed; the homebrew Items tab has a filter strip that R's mock does not show |
| deploy-replay-ci, path-urls-followups | no UI effect |
| Owner, 2026-10-29 | share cards in batch 1; DESIGN.md rules per batch with the clarity rule in batch 1; batches 5+6 and 9a+10 merged; a mock step in every batch, drawn ahead while the owner is present |

## 1. Chosen direction (R)

R is direction B, option B1, with A1's gold budget, Source Sans 3 and C's card
face on roll results (owner, 2026-10-23). Mocks:
`mocks/direction/index.html` (R first, by surface); one state opens at
`mocks/direction/R/state.html?s=<state>&lang=en`. R is a direction, not the
source of truth (owner, 2026-10-28): a state, page, dialog or width that no
mock shows adopts R's system (tokens, components, patterns); where a mock and
a spec rule conflict, the spec wins and the batch names the difference to the
owner.

| Part | Source | Reason |
|---|---|---|
| Three jobs (Бросок, Таблицы, Поиск), an icon before each label | B1 | every top-level place is visible at 360 in both languages (C6, P9, D10) |
| Roll mode row: «Обычные правила», «Альтернативные таблицы» (B5-2), «Дополнения ▾» (a menu of the seven) | owner, 2026-10-23 | three controls hold one line at every width; the chip shows the open supplement in the current-place gold |
| Filter column beside a column table at desktop width; a filter sheet at 360 | B1 | the panel no longer pushes the rows 570 px down (C3, C54) |
| Two-pane roller | B1 | the result is the focus and the controls stay in reach (C39, C25) |
| Dossier item page; a bottom-sheet dialog with a fixed action bar at 360 | B1 | it uses the desktop width (C17) and keeps the actions in reach (C44) |
| List controls and notes in a side column | B1 | the first item is in view at once (A3, A1) |
| Strict gold budget | A1 | gold on defaults is the defect C13 names |
| Source Sans 3, self-hosted | font study (section 3) | full Cyrillic, tabular figures by default, OFL, not flagged by the detector |
| Roll results drawn as the card face | C1 | the moment that matters at the table gets the printed card's register |

Trade-offs accepted: a returning GM learns one new click («Бросок», then the
mode); a switch between two supplements takes one more tap; at 360 a mode
label can take two lines inside its control (the mode chip reads the H1's
words «Альтернативные таблицы», B5-2, so it has no rule 4 departure).
The comparison of A, B, C and R is history: `git show 69f2178:issues/57/plan.md`,
sections 1 and 2.

Theme decisions (from `audit.md`, "Systemic themes"):

| # | Theme | Decision |
|---|---|---|
| 1 | Gold spent on things nobody chose | Gold fill: one primary action per panel, a choice that narrows the view, the current place. A pressed default («Все»), a mode toggle and a selection are neutral: a lit border and a check. Unique tag neutral dashed; footer links muted; roll number in the UI face. |
| 2 | Help text repairs controls | Each control says what it does, so a panel holds nothing new. The panels stay behind a labelled «Справка» button until the owner decides each one at its batch mock. |
| 3 | Labels change with the width | One action vocabulary at every width and one «Ещё» overflow: «В список», «Поделиться», «Печать», «Ещё» (Скопировать текст, Скопировать название, Скопировать картинку, Скопировать ссылку, Копия в мои предметы). |
| 4 | Navigation | Three jobs and the three-control mode row; «Бросок» opens the last roll section of this tab, else the start section when it is a roll section, else `/roll/std` (owner, R7); the account control is «Войти» signed out and an initial with a chevron signed in, lit on its pages. |
| 5 | Type floor and caps | Ten steps (23, 20, 18, 16, 15, 14, 13, 12, 11.5, numeral 19); data text 13 px at the least; capitals only for section labels and badges. |
| 6 | Density | Rows: name with its tags after it, one stat line, one feature line; tags that repeat the active filter hidden; a selection mode («Выбрать») replaces the always-on checkbox column. |
| 7 | Missing art | The kind glyph on the art well for a record with no picture and while a picture loads; the "?" pedestal and its three files go (owner, 2026-10-29; batch 1b), so an empty state draws no pedestal. |
| 8 | States | An empty or error page names the cause and one next step; a temporary choice lives where it is made, with no note; a dialog keeps its actions in a fixed bar. |

## 2. Scope, contracts and dependencies

- In scope: every row of `audit.md` (section 7 places each), every UI/UX
  entry of `docs/specs/DEBT.md` (section 6), every Impeccable exception
  (section 5), both languages, 360 to 1600 px, the two site share cards.
- Print: the sheet counts, the colour and black-and-white split and the
  browser-measured fit stay (product law). Inside the card, batch 1b changes
  the art area of a colour card with no picture, and batch P changes fonts,
  type sizes, spacing, art and stat blocks, each departure from the Figma
  nodes named for the owner's yes (owner, 2026-10-29, "Print review"; this
  replaces "print layouts stay" for task 57 only). The card sizes stay unless
  the owner says yes to a named proposal at mock P (QP.2, QP.3).
- Not in scope: new features
  (so no counts in the account menu, R3); the per-item `og/<id>.jpg` (art
  only); the wording of the frozen `schema/*.json` files (`CONTRACTS.md`
  section 4: "the frozen schemas' descriptions keep their published
  wording").
- Contracts that stay: routes, ids, links, asset paths (`og/_share.jpg` and
  `og/_share_en.jpg` keep their paths and take new bytes in batches 1 and 2;
  `card/burden-1.svg`, `burden-2.svg` and their `-bw` pair keep their paths
  and take the Figma node's vectors in batch P), `data.js`.
- Public contract change in batch 1b: `CONTRACTS.md` (the asset paths;
  `img/thumb/` "one per picture including `_none.webp`") loses
  `img/_none.webp`, `img/thumb/_none.webp` and `og/_none.jpg` (owner,
  2026-10-29). A link card of a record with no picture names the site share
  card of its language instead (section 7, batch 1b).
- Public contract changes in batch 2:
  - `docs/fixtures/urls/routes.json` `resolves.tab` pins the lit tab of every
    route (today the `href` of `nav.tabs a[aria-current="page"]`, compared
    through `pathOf()`). The three jobs change that value on every roll route,
    and a new `mode` field joins it (section 7, batch 2).
  - `llms.txt` takes American spelling (owner, 2026-10-29, Q3), with
    `CONTRACTS.md` and `tests/contracts.js` in the same commit.
- Order (owner): foundations first (tokens and type, then the shell). Each
  batch dispatch merges `main` into `claude/57` first (a merge, never a rebase
  or a force-push). The task reaches `main` in three waves, each a squash after
  its last batch's review and green CI, with no owner screenshot gate; the
  owner checks the live site after release (section 16).
- Decisions (`docs/decisions/`, indexed by `node tools/decisions.js`): the UI
  font (batch 1, done), the navigation (supersedes 2026-10-20 "Supplement roll
  sections share one tab and a chip panel"), the release waves (amends
  2026-10-21 "A task branch pushes every batch; a green CI run gates main")
  and the American spelling (batch 2), the print card (batch P).
- Added asset path in batch 2: `icons/favicon.svg` (the tab favicon, owner,
  "One mark"); no frozen path changes.

## 3. Font

Today `--ui` starts with the local name 'Inter'; there is no `@font-face`;
`PrintCard.svelte` reads `var(--ui)` in 17 places; the share cards are set in
Inter from `tools/artwork/fonts/`.

| Font | Licence | Cyrillic | Tabular figures | Detector | Verdict |
|---|---|---|---|---|---|
| Source Sans 3 | OFL | full, upright and italic | default (`pnum` switches them off) | not flagged | chosen |
| PT Sans | OFL | Cyrillic-first | no `tnum` | not flagged | rejected: stat numbers would need mono again (C33) |
| Golos Text | OFL | Cyrillic-first | not verified | not flagged | rejected for now: no local file to check |
| Inter, Open Sans, Roboto, Lato | OFL/Apache | full | `tnum` | flagged `overused-font` | rejected |

Loading: `@fontsource-variable/source-sans-3` (owner, 2026-10-23), woff2
from the build's own origin, `font-display: swap`, no font service. The family
name comes from the installed package CSS (expected `'Source Sans 3
Variable'`). Print keeps today's stack through `--print-ui` in batches 1 and
1b; batch P decides the print face at its mock (QP.1, section 15). The share cards
take static Source Sans 3 TTF faces in `tools/artwork/fonts/` (fontconfig
renders TTF; Q1).

## 4. Tokens and DESIGN.md rules

Tokens (`app/src/styles/tokens.css`), each added with its first reader:

| Token | Value | Replaces |
|---|---|---|
| `--ui` | `'<family from the package>', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | the Inter-first stack |
| `--print-ui` | today's `--ui` value | `var(--ui)` in `PrintCard.svelte` |
| `--t-page` | 23px | `--h-page-size` (`--h-page-weight`, `--h-page-spacing` stay) |
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

`tests/app/typo.js`: `UI` is the package family string; `SCALE = [23, 20,
19, 18, 16, 15, 14, 13, 12, 11.5]` (19 for the numeral). Colours do not change.

Each DESIGN.md rule is written by the batch that ships it (owner,
2026-10-29). The table maps every theme and every `audit.md` row to the batch
that writes its rule; a row with no rule is a local fix in its batch
(section 7).

| DESIGN.md rule (section) | Batch | Themes and rows |
|---|---|---|
| The Clarity Rule (new, "Overview"): a control, state or section that needs help text, a tooltip, a legend or an instruction sentence is a defect; the fix changes the UI so the text can go; removing a visible feature needs the owner's yes | 1 | theme 2; every row with clarity `explain`; the clarity inventory |
| The Local Font Rule, rewritten: one self-hosted family from the build's own origin, no font service, the print card on its local stack; the "There are no webfonts" paragraph of "Overview" | 1 | theme 5 |
| The Numerals Rule: the roll number and the stat line take the UI face's tabular figures; a number-field value, a rung, a quantity, a price and damage dice stay mono | 1 | C33, C15 |
| The Ten Steps Rule (replaces The Sixteen Steps Rule), with the 13 px data floor; frontmatter `typography` | 1 | theme 5, C2 (type), A5 (type), A39 |
| Capitals only for section labels and badges | 1 | A39, A5 |
| The Seal Rule budget, the neutral pressed default ("Chips", "Segmented control", "Badges") | 1 | theme 1: C9, C13, C18, C25, C28, C45, C49, C50, C64, A4, A16, A26 |
| Icon and label share one centre ("Buttons") | 1 | owner review note (2026-10-23) |
| The art well and the kind glyph ("Cards") | 1 (screen), 1b (print, the placeholder files gone; "Signature component: the print card") | theme 7: C55, C11, A10, A38 (the pedestal leaves rows; owner, 2026-10-29: the pedestal file goes too) |
| The First-Screen Rule ("Layout"): primary content starts within 40% of the height at 360x640 and 1180x720 | 1 (rule and check), each batch for its routes; its named exceptions by 5 (`/roll/std` at 360) and 9 (`/lists/<uuid>` with requests at 360) | owner, 2026-10-29; section 14 |
| The Phone-First Rule ("Layout"): the player surfaces (the shared list, the list page, the item, search, `/lists`) are designed at 360x640 first; the GM surfaces (the roller, the tables, homebrew, print) keep both widths and pass the First-Screen Rule on a phone | 1 | owner, 2026-10-29, "Devices during play" |
| The print card: the paper floors, the rules-text base and grow rungs, the print face, the list marker ("Signature component: the print card"), and "Overview" no longer claiming an identical print on every machine until it is true | P | `audit.md` "Print audit" PR1-PR7; section 15 |
| Navigation: three jobs, the mode row, the account control, the wordmark «Лут» / «Loot» (replaces "never translated"); The Two Breakpoints Rule takes the measured header | 2 | theme 4: C6, C27, C48, C52, A28, A35, A36, A37, P9, D10, D11 |
| The Same Label Rule: a label does not change with the width; the pin and «Справка» are labelled | 2 | theme 3: C27, A36, C37, A27 |
| Toast: its fill, its place over a fixed bar | 2 | C34, C47, A15 |
| Row anatomy and the selection mode; the filter column and sheet | 3 | theme 6: C3, C4, C10, C54, C56, A40, P1, P14 |
| Two chip levels (group and book) | 3 | C7, A25 |
| A temporary choice lives where it is made | 3 | theme 8: C57, C31 |
| The empty-state pattern (`R/pattern-empty`) | 3 | theme 8: C16, C60 (applied in 7) |
| Book names stay Latin in Russian | 3 | P13, C8 |
| The action vocabulary and «Ещё» | 4 | theme 3: C5, C18, C40, A23 |
| The dossier page and the bottom-sheet dialog | 4 | theme 6 and 8: C17, C44, A31 |
| The error-page pattern (`R/pattern-error`) | 4 | theme 8: C32, A18 (applied in 8) |
| The card face on roll results; the two-pane roller | 5 | C39, P11, C25 |
| Forms: optional fields marked, field-specific errors | 6 | A7, A8 |
| DESIGN.md "Notes": the detector exceptions list (empty), the full frontmatter colours and radii; `.impeccable/design.json` regenerated | 10 | N3, the exception inventory (section 5) |

No DESIGN.md rule (local fixes in the batch section 7 names): C1, C12, C14,
C19, C20, C21, C22, C23, C24, C26, C29, C30, C36, C38, C41, C43, C46, C53,
C58, C59, C61, C62, C35, A1, A2, A3, A6, A9, A12, A13, A14, A19, A20, A21,
A22, A24, A29, A30, A32, A33, A34, A41, A42, P4, P5, P6, P7, P10, P15, D2,
D5, D6, D7, D8, D9, D14, D15, D16, D20, N1, N2, N4, N5; C63 and A11 are
artefacts.

The round 2 mock review lists where the mocks depart from today's DESIGN.md
(`reviews/mocks-2.md`, "Departures from DESIGN.md"). That table is the input
for each batch's DESIGN.md rewrite: the batch that first ships a departure
rewrites the rule, and a later batch that reuses it checks the rule against
its own surface. Each batch's share is its own line in section 7.

| DESIGN.md rule | Departure the mocks draw | Rewritten by | Checked by |
|---|---|---|---|
| Navigation, "Tabs" | three jobs with icons, a mode row of three controls, the «Дополнения ▾» menu | 2 | - |
| Navigation, "Brand" | the EN wordmark «Loot»; the mark (candidate B) for the gold star | 2 | - |
| The Two Breakpoints Rule | new steps at 760 px (the pin; a menu or a sheet; the `/p/` cards) and 1000 px (the side column) | 2 (the 760 pin), 3 (the sheet and picker below 761 px; the 1000 px filter column; the `viewport` port) | 4 (menu or sheet), P (print cards), 9 (1000 side column) |
| Layout (header 106 / 112 px) | 111 px sticky at 360, the mode row scrolls | 2 | - |
| Toast | a plate with the Float shadow; the error toast in dark ink on the alarm fill | 2 | - |
| Chips (7px 12px) | 40 px mode chips and dice at 360 | 2 (mode chips) | 5 (dice) |
| Filter pills | no pill row at 360; the count line names the chosen values | 3 | 6 (none at any width on `/homebrew`) |
| Shapes (dashed border = a property) | a dashed plate for every empty state | 3 | 7, 8 |
| Don'ts (no illustrated empty states) | a kind-glyph tile in the empty state | 3, unless it takes `reviews/mocks-2.md` N0-2 (drop the tile) and keeps the Don't | - |
| Seal Rule (selection neutral) and `FEATURES.md` "ticked card gold border" | ticked rows and cards lit, neutral | 3 | 6, 8, 9 (`FEATURES.md` "Lists") |
| Components (no sheet) | bottom sheets at 360 for menus, filters, the dialog, the delete confirm | 3 (the filter sheet) | 4, 7, 8 |
| Shapes, artwork (square, 420 px full card) | a 4:3 crop window on the item page, the dialog and roll cards | 4 | 5 |
| Cards, compact (132 px image) | a 96 px image at 360 | 5 | - |
| Badges (roll number) | the roll number at 1180 only; the rarity badge at 360 | 5 | - |
| Segmented control (neutral for mode toggles only) | segments with the neutral check as form-field pickers | 6 | - |
| Buttons, danger | a filled alarm red with dark text in the delete confirm | 7 | - |
| Seal Rule (gold budget) | the gold-bordered «Новое в списке (3)» chip | 8 | 9 |
| Signature component: the print card (art region) | the light well `#ebe7f0` with the glyph `#3a3350` | 1b | P |
| Signature component: the print card | 63.5x88.9 mm, 7.75 / 13.15 mm, Source Sans 3, 4.0 / 4.6cqw, no «Daggerheart» on the bottom line | P | - |

## 5. Impeccable exceptions

Inventory on `main` `c8243ba6` (`git grep -i impeccable`, `.impeccable/`,
`.claude/`, `eslint.config.mjs`, `package.json`, `.git/info/exclude`):

| # | Exception | Where | Plan | Batch |
|---|---|---|---|---|
| E1 | `ignoreValues` `overused-font: inter` | `.impeccable/config.json` | remove: the ignore is already stale (`impeccable detect --json --no-config app/src` reports no `overused-font` while `--ui` still starts with 'Inter', plan review N1), so its removal proves nothing about the font; the font proof is `typo.js` | 1 |
| E2 | `ignoreValues` `side-tab` for `ListPage.svelte` (`value: "*"`) | `.impeccable/config.json` | its three findings are the reorder drop mark (`.lrow.drop-before`, `.lrow.drop-after`, `.lrow.drop-after .rnote`: an inset 3 px gold shadow), not the notes (plan review B2). Remove when batch 9 redraws the mark as a 2 px gold line drawn by a gap element between the rows, with every `FEATURES.md` "Lists" drop rule kept; `HitNote.svelte`'s unignored `side-tab` (N1) goes in the same batch. If no form passes the detector, a value-scoped ignore stays and batch 10 names it to the owner | 9 |
| E3 | `.prettierignore`: `hook.cache.json`, `hook.pending.json`, `config.local.json` | `.prettierignore` | remove: `.gitignore` lists all three (E5, E6 stay) and Prettier 3 reads `.gitignore` by default; `prettier --file-info <path>` proves `"ignored": true` | 1 |
| E4 | `.prettierignore`: `.impeccable/config.json` | `.prettierignore` | remove once `ignoreValues` is empty, after a proof that the hook does not rewrite the file in an ordinary session (plan review R8): one edit with the hook live and one `impeccable detect` run leave `config.json` byte-identical and `npx prettier --check .impeccable/config.json` passes. Then format the file with Prettier, or delete it if `impeccable detect` runs without it; a later `impeccable hooks ignore-value` reddens `format:check`, which makes a new exception visible. No proof: E4 stays with that reason | 9 |
| E5 | `.gitignore`: `hook.cache.json`, `hook.pending.json` | `.gitignore` | keep (owner, 2026-10-29, plan review B1): Prettier reads `.gitignore` but not `.git/info/exclude`, so these tracked lines are what let E3 go; without them `format:check` fails in every session where the hook writes the files | kept |
| E6 | `.gitignore`: `config.local.json` | `.gitignore` | keep (owner, Q4): a local config with no tracked ignore is how a credential gets committed (the `.gitignore` comment) | kept |
| E7 | detector advisories (N3) and the two warnings (N1, N2) | `app/src` | not exceptions yet; each batch leaves no detector finding in the files it touches; batch 10 reaches zero with no `ignoreValues` | 1-10 |
| E11 | inline ignores (`impeccable-disable`, `-line`, `-next-line`) | `app/src` | none on `deaa7989`; none may be added (plan review R6). Every detector run in this plan is `impeccable detect --json --no-inline-ignores app/src`, and `git grep -n impeccable-disable -- app/src` returns nothing | 1-10 |
| E8 | `tools/check/lib.mjs` `VITEST` rule `['.impeccable/', false]` | gate selector | keep: it says vitest reads no `.impeccable/` file, as for `DESIGN.md`; it suppresses no check | kept |
| E9 | ESLint `ignores: 'issues/*/mocks/**'` | `eslint.config.mjs` | keep: task mock pages are scratch that a closeout deletes (owner, 2026-10-23); not an Impeccable exception | kept |
| E10 | `.git/info/exclude` blocks | this host only | outside the repository; no change | kept |

No hook, agent guard or lint rule names Impeccable (`git grep -i impeccable --
.claude` finds nothing). `PRODUCT.md`'s `impeccable:product-schema` marker is
the skill's schema tag, not an exception.

Homes of the kept exceptions (plan review N14): a detector exception (an
`ignoreValues` entry, if any survives) is recorded in DESIGN.md "Notes"; the
kept repository and tooling exceptions (E5, E6, E8, E9) are recorded in
`.claude/README.md`, because `CLAUDE.md` routes tooling facts there. Batch 10
writes both.

## 6. DEBT.md placements

`docs/specs/DEBT.md` on `main` `c8243ba6` has two entries, both under task 57
and both UI/UX. No other entry is open.

| Entry | Batch | Acceptance (the entry's own "How to verify") |
|---|---|---|
| D116 - the lists page names its only group «Ваш аккаунт» | 8 | signed in, `/lists` draws no «Ваш аккаунт» / "Your account" heading; `groupAccount` leaves `dict.ts` in both languages; the lists goldens are re-seeded; the entry leaves `DEBT.md`, and with it the section "Tool UI redesign (`57`, GitHub issue 57)", because D121 left in batch 2 (plan review N17) |
| D121 - the focus goes to `body` when a later toast replaces an action toast that held it | 2 | a `shell.test.ts` case for each of `href` and `go`: focus moved into the toast, a later plain toast said, the focus lands on the element it came from, or `#main` when that is gone; `expectNoA11yViolations`; the entry leaves `DEBT.md` (its section stays for D116 until batch 8) |

The task closes with no UI/UX entry in `DEBT.md` unless the owner keeps one.

## 7. Batches

Every batch starts with its mock step (owner, 2026-10-29): its refresh makes
or updates `issues/57/mocks/<N>/` from R, shows it to the owner, and the
implementer starts after the owner's yes (with the owner away: the
recommended option, logged in `C:\Users\Ignat\.dhloot\notes\owner-afk-<date>\decisions.md`).
Before the owner sees a mock, Impeccable `critique` runs on it with the
Clarity Rule, and the mock's `index.html` names the outcome (plan review R5).
The mock step also measures the First-Screen Rule at 360x640 and 1180x720 in
RU and EN (section 14) and shows the offsets in the `index.html`.
A mock drawn ahead (section 9) is re-checked at the refresh against the
merged `main`; the owner sees it again only if it changed. Before its
screenshot set, each code batch runs Impeccable `polish` and `harden` on the
surfaces it changed and gives the outcome in `handoff.md`. Each code batch
ends with its screenshot set: every changed surface at 360 and 1180 px, RU and
EN, from `npm run build:test`, into `issues/57/mocks/<N>/built/`. The set is
evidence for the batch review, not an owner gate (owner, 2026-10-29,
"Release in three waves", "Reviews").

| # | Batch | Audit, DEBT and exception ids | R states | Mock depends on | Split criterion |
|---|---|---|---|---|---|
| 1 (done) | Foundation: font, ten-step ramp, tokens, neutral pressed default, badges, footer links, art well and kind glyph, share cards, clarity rule | C2 (type), C9, C11, C28, C33, C50, C55, C64, A10, A26, A39, N5, E1, E3 | all of `R/*` for type; `R/catalog` («Все»), `R/homebrew-items` (glyph); the share cards are new | none: the type, the ramp and the glyph are R's own; the share cards are new pictures | a review that cannot be held in one pass: it moves the text metrics of every route; layout work on top would hide its regressions |
| 1b | No-picture placeholder retired: the kind glyph on the colour print card, the three placeholder files deleted, every reader moved, the link card of a no-picture record | C55 (print), A38 (owner, 2026-10-29) | the colour print card of a no-picture record (new); the link card of a no-picture item | none: mock 1's glyph is approved; mock 1b draws the print card and the link card | a public contract change (`CONTRACTS.md` asset paths) and a print change (product law), with its own gates (`app/print`, `contracts,dataint`, the preview Worker and deploy tooling) and a review frame apart from batch 1's type sweep; it needs a batch review |
| P | Print: the card's rules-text base, floors and markers, the print face and its fit, the line pitch, the card size if the owner says yes; the `/p/` page (bar, switches, notes, the preview at 360, the first screen) | PR1-PR10, PR12 (`audit.md`, "Print audit"), C29, C30, C31 (from batch 7) | `R/print-preview` (screen); the print card has no R state, so mock P draws it at print resolution | 1b: mock P draws the light well as the owner confirmed it at mock 1b | split from 1b by 1b's public contract change (`CONTRACTS.md` asset paths), which P does not carry. Merged into P: the `/p/` rows of batch 7, because they share `PrintPage.svelte`, its seed sets and the `app/print` gate (`CLAUDE.md`, "merge work that shares a component, seed and filter") |
| 2 | Shell: header, three jobs with icons, the mode row and the supplements menu, the account control, the wordmark, the pin and «Справка» labels, the toast; the American-spelling sweep across the repository (owner: no batch 2b) | C6, C27, C34 (verify), C37, C47, C48, C52, A15 (verify), A27 (icons), A35, A36, A37, P7, P9, D9, D10, D11, N4, D121 | `R/header`, `R/shell-*`, `R/roller-supmenu` | none: R draws the header; the refresh adds the request toast and `/en/` | public contract changes (`routes.json` `tab`, `llms.txt`) and public spec changes (`ROUTES.md`, `FEATURES.md` "Chrome", `I18N.md`); it needs a batch review (contracts, `.claude/hooks/`, prompts and agents changed) |
| 3 | Catalog tables and filters | C1 (panel renamed «Об этих данных»), C2 («Все»), C3, C4, C5, C7, C8, C10, C12 (verify), C53, C54, C56, C57, C58, C59, A25, A40 (tables), P1, P13, P14, P15 | `R/catalog`, `R/catalog-*`, `R/pattern-empty` | none | a different route and filter set (`/tables/*`) |
| 4 | Record card, actions, item page, dialog, `/h/` | C17, C18, C19, C20, C21, C22, C40, C44 (verify), C45, C46, C63 (artefact, close), A23, A24, P4, P5, P6 | `R/item`, `R/item-dialog`, `R/item-nope`, `R/item-save-signedout`, `R/h-item`, `R/pattern-error` | none | a different component group and route (`/i/`, `/h/`, the dialog) |
| 5 | Roller pages and the card face on results | C23, C24, C25, C26, C36, C38 (panel renamed «Где какая редкость»), C39, C41, C43, C49, P10, P11, N2 | `R/roller`, `R/roller-alt-crit`, `R/roller-mwt` | none: the mode row in the mock is R's; batch 2 ships it | a different route and filter set (`/roll/*`) |
| 6 | Homebrew editor, homebrew pages and imports (old 5 + 6, owner merge) | A6, A7, A8, A9 (verify), A11 (artefact, close), A12, A13, A27 (panel removed, Q6.1), A28, A29, A30, A38, A40 (homebrew), D5, D14 (verify), D15, D16, editor clarity rows | `R/editor*`, `R/homebrew-*` | none: the refresh adds the Items-tab filter strip of `f74eae09` to `R/homebrew-items` | a different route and filter set (`/homebrew`, `/homebrew/<id>`) |
| 7 | Search, account, empty and error states | C13, C14, C15, C16, C32, C60, A31, A32, A33, A34, D7, D8 (verify) | `R/search-*`, `R/account-*`, `R/pattern-*` | none | different routes (`/search`, `/account`, the error pages) |
| 8 | Lists page `/lists`, list cards, lists import, add-to-list menu | A14, A16, A18, C35, C61, C62, D6, D20, D116 | `R/lists-*`, `R/item-listmenu` | none | a different route and filter set (`/lists`, and the add-to-list menu that the item pages open) |
| 9 | Account list page `/lists/<uuid>` and shared list page `/s/<token>` (old 9a + 10, owner merge) | A1, A2, A3, A4, A5, A19, A20, A21, A22, A40 (list rows, `/s/`), A41, A42, D2, N1, E2 (the drop mark), E4, list clarity rows | `R/list`, `R/list-*`, `R/shared-*` | none | a review that cannot be held in one pass is accepted by the owner's merge; split from 8 by a different route and filter set |
| 10 | Lock: DESIGN.md "Notes", detector at zero, `design.json`, re-audit, closeout | E5, E6, E8, E9 (record), E7, E11, N3 (rest), every row re-checked | none | no mock | docs and closeout, unless the re-audit finds a defect |

Run order (owner, 2026-10-29, "Release in three waves"): 1, 1b, 2 (wave 1);
3, 4, 5, 6, 7 (wave 2); 8, 9, P, 10 (wave 3). The table keeps the old row
order; section 16 gives the waves.

Merge evidence for batch 9 (owner, 2026-10-29: 9b+10, or 9a+10 if the
evidence says so). `SharedListPage.svelte` imports 15 components; 10 of them
are `ListPage.svelte`'s (`Actions`, `Button`, `Empty`, `HitNote`, `Icon`,
`LoadState`, `PageTitle`, `PickQty`, `RecordHost`, `StatusRegion`), and 6 are
`ListsPage.svelte`'s, all generic (`Actions`, `Button`, `Empty`, `LoadState`,
`SearchBox`, `SignInPrompt`). Four design decisions are the same on both pages:
the note display and its GM-only style (A5, A22, N1), the row anatomy and the
selection mode (A40, A19), the price display (list-prices, A19), and the
requests (the owner's `RequestsPanel`, the sender's sent line). So batch 9 is
9a + 10. Trade-off: it is the largest batch (`ListPage.svelte` about 2200
lines, `SharedListPage.svelte`); the batch review reads the diff, not the
whole files.

Rows cited only inside other rows go with their parent: C36, C41, C43 (5);
C40, C45, C46 (4); C47, C52, A36, A37 (2); C50, C64, A26 (1); C60 (7); C62
(8). A40 is done per surface: tables in 3, homebrew rows in 6, list rows and
`/s/` in 9.

### Inherited acceptance lines (each is its own line in its batch)

Batch 1: done (`9a31aede`, review fix `80872b35`); `reviews/1.md`,
"Acceptance lines", gives each line's outcome.

Batch 1b: done (`reviews/1b.md`); its brief and acceptance lines are at `git show
5d9aefbc:issues/57/plan.md`, section 10 (mock `mocks/1b/`, confirmed by the
owner's answer M1b-1). The inherited
`reviews/1.md` N6 (the `#0a0810` literal on `--art-well`) is one of them.

Batch P (owner, 2026-10-29, "Print review" and "Print feel"; outline and
acceptance in section 15; mock step `mocks/P/`):

- The print audit rows PR1-PR10 and PR12 (`audit.md`, "Print audit
  (2026-10-29)"), each with its outcome.
- C29 (from batch 7): the print bar holds fewer rows; the A4, orientation and
  margin sentence goes (`@page` sets them); at most the background-graphics
  hint stays, under the sheet.
- C30 (from batch 7): the screen preview at 360 can be read (section 15, "The
  `/p/` page").
- C31 (from batch 7, Q3.2 answered): the print switches are a choice for the
  visit in their own controls, with no `KeepNote` under the print bar.
- The `/p/` row of `FIRST_SCREEN` moves from logged to asserted at 360x640 and
  1180x720, RU and EN (section 14).
- Each departure from the Figma nodes `714-42387` and `3773-90792` that the
  owner said yes to at mock P is named in `FEATURES.md` "Print" with the date.
- The lines of "Each of batches 2-9" below apply to batch P too (new states,
  the owner's mock notes, `polish` and `harden`, the detector, American
  spelling in new prose, `FIRST_SCREEN`, the screenshot set, here at print
  resolution in `issues/57/mocks/P/built/`).
- Mock P answers (owner, 2026-10-29): QP.1 the print face is Source Sans 3;
  QP.6 `/p/` at 360 shows one card per row; QP.7 the short switch labels
  «Цвет» / «Ч/б» and «63×88» / «44×63» (EN "Color" / "B&W" after batch 2);
  QP.8 a card whose picture gives way keeps the ladder order and drops the
  blank paper band above the text.
- RP-1 (owner, round 2): the `/p/` primary reads «Напечатать» / "Print" in
  place of «Отправить на печать» / "Send to printer", in both languages.
- The card bottom line (owner, 2026-10-29, "Card bottom line"): «Daggerheart»
  leaves the bottom line of both layouts on both sheets; the source line stays
  and takes the freed width, so a long homebrew source no longer wraps beside
  it. `FEATURES.md` "Print" loses the «Daggerheart» sentence; the
  `PrintCard.svelte` comment on the long source line and the `why` of
  `#/p/set-longsrc1 as gm2` change with it.
- The burden hands (owner, 2026-10-29, "Burden hands"): `card/burden-1.svg`,
  `burden-2.svg`, `burden-1-bw.svg` and `burden-2-bw.svg` take the hands of
  Figma nodes `714-42387` (colour) and `3773-90792` (black and white), the
  hands only without the «ХВАТ» label, one- and two-hand, exported by Copy as
  SVG through the owner's Chrome (method and the probe file in `context.md`).
  The file names stay; the print checks run after the swap. If a colour and a
  black-and-white pair share one geometry after the export, it folds into
  `cardVectors.ts` by the rule that `tests/derived.js` checks
  (`UNFOLDED`). If the export fails, the fingers are redrawn to match the node,
  a named exception to "export vectors, do not redraw them".
- QP.2 changes the product law's card size: the `CLAUDE.md` line "Printing is
  nine 63x88 mm cards per A4 sheet" reads 63.5x88.9 mm, with `FEATURES.md`
  "Print" and DESIGN.md, in the same commit. If a guard refuses the
  `CLAUDE.md` write, the implementer stops and returns the text.
- DESIGN.md (section 4, departures): "Signature component: the print card"
  is rewritten for the card size, margins, face, rules-text base and bottom
  line; The Two Breakpoints Rule takes the `/p/` card step (one card per row
  below 600 px).

Batch 2: done (`reviews/2.md`); its brief and acceptance lines are at `git show
65829261:issues/57/plan.md`, section 10 (mock `mocks/2/`, the mark
`mocks/mark/b-vault-die.svg`). Every line that this
section held for batch 2 before the refresh of 2026-10-29 (R3, R7, the
`routes.json` set, «Бросок», the old addresses, the account menu and its lit
state, the header measure, C48, the mode row, the job icons, the rule 4
departures, the EN wordmark, P7 and the sweep, the navigation decision, D121,
the language switch, the pin and «Справка», the `TabBar.svelte` comment, the
new states, the mark, the waves decision file, the interim mix,
`FIRST_SCREEN`, the 40 px mode chips, «Мои предметы», the DESIGN.md
departures) is an acceptance line there; the earlier text is at `git show
5d9aefbc:issues/57/plan.md`, section 7. Changed at the refresh: the mode chip
reads «Альтернативные таблицы» (B5-2), so the «Альт. таблицы» rule 4
departure goes; `issues/57/` rides onto `main` with each squash (owner, "Wave
squash content"); below 760 px the pin and the help stay round buttons until
their page's batch moves them (lines in batches 3, 5, 6, 7, 8 below).

Batch 3: its implement-ready brief and acceptance lines are section 10 (mock
`mocks/3/`, final at round 5). The owner's answers it carries: Q3.1 (the help
panel is «Об этих данных», three data notes, its button takes the name), Q3.2
(the view choice is temporary, in its own control, no note; `KeepNote` keeps
serving the `/p/` print bar until batch P removes it there, and the component
goes with its last caller), R3-1 (no pill row at 360; the count line names the
chosen values), R3-2 (three taps at 360 to another group's table), the round 6
selection bar (the pattern every list page reuses), M2-2 (on `/tables` below
760 px the pin and the help live in «Ещё») and the batch 1 review's R4 (`Chip`
takes the neutral pressed variant, «Все» is its first caller). The empty state
draws no "?" pedestal: its file went in batch 1b. The selected row is a lit
border and a check, never a one-side accent (R's `.rl.sel` is a `side-tab`).
The earlier text of this block is at `git show 65829261:issues/57/plan.md`,
section 7. Batches 6, 8 and 9 take the selection bar as `SelectionBar.svelte`
(`BatchBar.svelte` goes with its last caller, batch 9) and the list head from
batch 3's decision file.

DESIGN.md (section 4, departures): the rewrites batch 3 owes are listed in
section 10, "DESIGN.md rules this batch writes".

Batch 4:

- New states: the «Ещё» menu open and the bottom-sheet dialog.
- C63 is closed by a live check of the rebuilt dialog's backdrop.
- Clarity inventory: the `/h/` signed-out box «Войдите, и копия...» becomes
  «Войти и сохранить» (plan review N11).
- The item sheet's fixed action bar holds three labelled controls at every
  width, with nothing cut at 360 in RU or EN (R cuts «Ещё» at 360; mock unit B,
  2026-10-29). Recommended set, confirmed at mock 4: the primary «В список»,
  «Поделиться» and «Ещё» (Печать and the copy actions inside «Ещё»).
- `Button` gets the neutral pressed variant only when a caller in this or a
  later batch needs it; the batch that adds the first caller adds the variant
  and its case (plan review R4).
- The card bottom line (owner, 2026-10-29, "Card bottom line"): the screen
  record card drops «Daggerheart» and keeps only the source (Core, Hope &
  Fear, a homebrew author); the roll cards (batch 5) and the list rows (batch
  9) that reuse it follow.
- M4-2 (owner): one label per action on every page and state («Сохранить
  себе»); the relink line stays as the menu item's second line.
- DESIGN.md (section 4, departures): "Shapes" (the 4:3 crop window on the item
  page and the dialog) is rewritten; the bottom sheet of batch 3 and the 760
  px menu-or-sheet step are checked against the dialog and «Ещё».

Batch 5:

- Q5.1 (owner): the roller help panel (C38) is renamed «Где какая редкость» /
  "Where each rarity is" and holds the book's four placement lines, as
  `mocks/5/` draws them; the rest goes; `help.ts` and its tests change with it.
  Its button reads «Где какая редкость» / "Where each rarity is" (plan review
  R3).
- N2: `orGrid.test.ts` gives its `<img>` a `src`, or the case uses no `<img>`.
- The dice at 360 (owner, "Roller dice at 360", variant A): each die keeps the
  rarities it covers, in two rows (3 + 2), 40 px tall (round 3, unit A).
  `/roll/std` at 360 is a named exception to the First-Screen Rule (the first
  result at about 325 px); every other roll mode keeps the rule (about 247
  px). Section 14 gives the check.
- M5-7 (owner): a compact roll result card at 360 (96 px art beside the text);
  the full card face from 600 px.
- N2-2 (owner, round 2): the Vault of Ages panel stays; its button takes the
  panel's name (the Same Label Rule), which mock 5 gives from its content.
- The roll cards drop «Daggerheart» from their bottom line (batch 4's card).
- M2-2 and R2-1 (from batch 2): on the nine roll pages below 760 px the pin
  and the panel button move into «Настроить» and «··· Ещё» (mock 5), and the
  H1 is visually hidden at 360; batch 2's interim round buttons go there.
- DESIGN.md (section 4, departures): "Cards" (the 96 px compact image at 360),
  "Badges" (the roll number at 1180 only) and the dice in "Chips" are
  rewritten; "Shapes" (batch 4's crop window) is checked on the roll cards.

Batch 6:

- Q6.1 (owner): the homebrew help panel (A27) goes; tabs with counts, a
  one-line empty state per tab and the import details inside the import panel
  replace it; `help.ts`, its tests and the help inventory states go with it.
- Q6.2 (owner): the eight field «?» buttons of the editor go; option text, the
  toolbar and fields shown only where they apply say the same; `FEATURES.md`
  rules 15 (c) and 18 change in the same commit (the owner's yes, 2026-10-29).
- The editor conflict state keeps its rule: the primary does not overwrite the
  other device's changes (A30).
- The Items-tab filter strip of `f74eae09` adopts R's filter system.
- A11 is closed by a live check (the preview is already `sticky`).
- Round 3, unit B (owner): the `/homebrew` primary marker is the first group
  head, and group heads stay at 360; a homebrew filter in force is a lit
  «Фильтры · 1» at 360.
- Round 6 (owner): on `/homebrew` at 360 «Новый предмет» has no plus icon (it
  has one at 1180); the selection bar of batch 3.
- DESIGN.md (section 4, departures): "Segmented control" (the neutral check on
  form-field pickers) is rewritten; "Filter pills" (none at any width on
  `/homebrew`) and the neutral selection are checked.
- M2-2 (from batch 2): on `/homebrew` below 760 px the pin moves into the head
  row's «Ещё» (mock 6); batch 2's interim round button goes there.

Batch 7:

- The `/p/` page rows (C29, C30, C31) and its first-screen row moved to
  batch P (same component, seed sets and gate).
- The batch 4 error-page pattern is applied to `/i/nope`, `/h/` gone and the
  other error pages.
- Clarity inventory, account: the settings scope sentence, the notify
  question, the ZIP manual (A33) and the «Выйти везде» note become labels that
  say it (plan review N11).
- The error-page pattern reaches the `/p/` not-found and retired-link pages
  (`print-nope` in `mocks/7/`); batch 7 runs before batch P (the waves), and
  batch P keeps that wording.
- DESIGN.md (section 4, departures): "Buttons" (the danger fill in the delete
  confirm) is rewritten; the empty-state plate and the bottom sheet are
  checked.
- M2-2 (from batch 2): on `/search` below 760 px the pin takes the place
  mock 7 draws; batch 2's interim round button goes.

Batch 8:

- D116 (section 6).
- A18: `/lists/<uuid>` not found names a true cause (no browser lists exist
  after R10) and one next step, with a sign-in when signed out.
- A new state: the add-to-list menu in its new form.
- Q8.1 (owner): the `/lists` «Справка» panel (`help.ts` `LISTS`) goes, with
  its tests and the `#/lists ~ help` inventory state and goldens.
- Round 3, unit B (owner): at 50 of 50 lists «Новый список» stays on and
  explains the limit, and the count turns red.
- The selection bar of batch 3 on `/lists`.
- DESIGN.md (section 4, departures): the Seal Rule's gold budget (the
  «Новое в списке (3)» chip) is rewritten; the empty-state plate, the bottom
  sheet and the neutral selection are checked.
- M2-2 (from batch 2): on `/lists` below 760 px the pin moves into «Ещё»
  (mock 8); batch 2's interim round button goes, and with it the Same Label
  Rule's interim note in DESIGN.md (the last page that draws it).

Batch 9:

- E2 (plan review B2): the reorder drop mark is redrawn so the detector does
  not flag it. Recommended form: a 2 px gold line drawn by a gap element
  between the rows, not an inset shadow on the row. Every `FEATURES.md`
  "Lists" drop rule stays (both rows lit, the mark on the last visible line
  under an open note); the existing reorder cases pass. Then the `side-tab`
  entry for `ListPage.svelte` leaves `.impeccable/config.json`, and
  `impeccable detect --json --no-config --no-inline-ignores` passes on
  `ListPage.svelte` and `HitNote.svelte` (N1). If no form passes, a
  value-scoped ignore stays and batch 10 names it to the owner.
- E4 (plan review R8): first, one edit with the Impeccable hook live and one
  `impeccable detect` run; `.impeccable/config.json` stays byte-identical and
  `npx prettier --check .impeccable/config.json` passes. Then the file holds no
  `ignoreValues`, and the `.prettierignore` line goes (the file is
  Prettier-formatted, or deleted if `impeccable detect` runs without it). If
  the hook rewrites the file, E4 stays and `handoff.md` gives that reason.
- A1 (P0, plan review R2): at 640-900 px the quantity, the price and the row
  actions stack under the row body; the title column holds at least one word
  per line, and no badge draws over a title. Proof: `node tests/app/sweep.js
  768` and a geometry case in `tests/app/states.js`. The screenshot set adds
  768 px (RU and EN) for `list`, `list-prices` and `shared-player`.
- The note switch saves a pending edit before it shows the other note (plan
  review, standing check 2).
- Q9.1 (owner): the list page's inline «?» buttons (the price display, the
  notes, the price field) go; the money, price and note help states of
  `inventory.js` (`LIST_A ~ money help`, `~ price help`, `~ note help`) leave
  with their goldens; `FEATURES.md` rule 15 (c) changes in the same commit.
- `FEATURES.md` "Lists": "A ticked row takes the gold selected style" becomes
  the neutral selection of theme 1 (a lit border and a check, no gold), in the
  same commit (mock unit B, 2026-10-29).
- The row keeps its position field and its drag grip: the position field is
  the non-drag way to reorder (WCAG 2.5.7), although R's mocks drop both; the
  batch mock draws them (mock unit B, 2026-10-29).
- Icon-and-label controls share one vertical centre in the note switch and the
  list controls, at 360 and 1180 (owner review, 2026-10-23); the batch 1
  browser check covers the new controls.
- A2: row actions are 24 px targets at the least; one note area with a «Для
  игроков» / «Только для мастера» switch replaces the two editors per row
  (`R/list-note`).
- A3: the list controls sit in the side column; «Удалить» moves to «Ещё»; the
  share panel is two labelled link rows (`R/list-share`).
- A42: «Бросить по списку» is a real button that opens the roll panel; the
  result shows as the card face with both notes (`R/list-roll`).
- Price toggle: the switch reads «Цены:» «Как в книге» / «Монетами», shows an
  example under it, and every price on the page follows it, rows, totals and
  the roll result included (`R/list-prices`, `R/list-picked`).
- Requests: «Новое в списке» shows was, taken and becomes per entry and names a
  short stock in words («Просили 9, в списке 5»), with no «×9 из 5» or «(без
  цен: 1)» (`R/list-requests`).
- The GM view of `/s/` draws the GM-only note in the same style as the owner's
  editor (A22).
- New states: the note switch, the list «Ещё» menu, the `/s/` selection mode.
- The requests panel on `/lists/<uuid>` (owner, round 6 and R9-1) folds to its
  head («Новое в списке (3)», «Открыть») at every width. At 360 the page with
  requests is a named exception to the First-Screen Rule (about 292 px); the
  page without requests passes (section 14).
- M9-1 (owner): on `/lists/<uuid>` «Печать» stays on the action row; the
  inline rename in the `h1` stays.
- Round 3, unit B (owner): on `/s/` at 360 «Печать» moves into «Выбрать»
  (it stays on the row at 1180); a 200-character list name is cut to one line
  at 360.
- N9-2 (owner, round 2): on `/lists/<uuid>` at 360 «Цены» goes into «Ещё» and
  «Заметки» sits on the meta line.
- The selection bar of batch 3 on both pages; the list rows drop
  «Daggerheart» from the bottom line where they reuse batch 4's card.
- DESIGN.md (section 4, departures): The Two Breakpoints Rule takes the 1000 px
  side-column step; the gold budget, the neutral selection (`FEATURES.md`
  "Lists") and the bottom sheet are checked.

Batch 10:

- `ignoreValues` is empty and `impeccable detect --json --no-inline-ignores
  app/src` reports nothing: each intended literal becomes a DESIGN.md
  frontmatter entry (32 of `PrintCard.svelte`'s 33 advisories are print
  colours - `#000`, `#fff`, the Figma golds - and one is the radius `2.4cqw`),
  and every other finding is fixed. A finding that is neither fixed nor
  documented is named to the owner as a kept exception (plan review N15).
  `git grep -n impeccable-disable -- app/src` returns nothing (E11).
- The re-audit is Impeccable `audit` over the S1 capture; `.impeccable/design.json`
  is regenerated with Impeccable `document` (plan review R5).
- The kept exceptions are recorded with their reasons (plan review N14): a
  surviving detector ignore in DESIGN.md "Notes"; E5, E6, E8 and E9 in
  `.claude/README.md` (owner, Q4 and B1).
- The spelling grep of batch 2 is re-run over the paths in scope and returns
  only the kept forms. Its word list is the one `tests/derived.js` ("American
  spelling") holds; the kept forms are in the batch 2 decision file (batch 2's
  brief, `git show 65829261:issues/57/plan.md`, S10, has the file set).
- The `FIRST_SCREEN` table has no logged row: every route is asserted.
- A defect that the re-audit finds goes to `docs/specs/DEBT.md` under the task
  that owes it and batch 10 stays docs only; or batch 10 fixes it in code and
  pays the full code gate (section 8).
- Wave 3 lands after batch 10's review and green CI; then the closing steps of
  section 16 run in order: the post-release live check, its findings to
  `DEBT.md` or a named follow-up task, the closeout commit that deletes
  `issues/57/`, and the last squash. The task directory is retired only after
  the post-release check.

Each of batches 2-9:

- Each new open or pressed state has its `tests/app/inventory.js` entry, a
  golden in RU and EN and an axe case (`expectNoA11yViolations`) in the same
  change.
- The owner's notes on its mock are applied, or named as rejected by the
  owner.
- Its `verify` rows are checked in a live browser before the code.
- Impeccable `polish` and `harden` ran on its changed surfaces before the
  screenshot set; `handoff.md` gives the outcome (plan review R5).
- No detector finding (`impeccable detect --json --no-inline-ignores`) in a
  file it touches, except the N3 advisories that batch 10 records; no
  `impeccable-disable` comment added (plan review N9, R6).
- New prose, comments and test titles use American spelling (the batch 2
  decision file).
- Its routes in the `FIRST_SCREEN` table move from logged to asserted
  (`shipped: true`) and pass at 360x640 and 1180x720 in RU and EN, with the
  fix section 14 recommends or the one the owner confirmed at the mock; a
  named exception of section 14 is asserted against its own limit.
- Its screenshot set is in `issues/57/mocks/<N>/built/`.

## 8. Gate cost

Per code batch (`.claude/README.md`, "Batch size and the fixed cost of a
run"): `rtk npm run check:fast` 8-14 min (564-840 s when the change reaches
the component suites or `dict.ts`, measured 2026-10-29), one CI run 10.5-11.5
min, one review fix cycle (a second `check:fast` and CI run), the screenshot
set about 8 min (`npm run build:test` and the capture). About 45-60 min per
code batch.

| Batch | Extra gates | Minutes |
|---|---|---|
| 1 (done) | `node tests/run-all.js app/print,app/typo,app/hues,stub,app/states`, `npm run check:built`, both lints, `node --test tools/artwork/lib.test.mjs`, `node tools/artwork/cards.mjs --check` | 13 (spent) |
| 1b (done) | spent (planned 16-18 min of extra gates) | - |
| P | `node tests/run-all.js app/print,app/states,stub` (6-8); `npm run check:built` (1); the catalog fit measure for the `FEATURES.md` figures (`issues/57/mocks/P/tools/print-measure.cjs` and `print-analyse.cjs`, RU and EN, four layouts, about 12); the burden export through the owner's Chrome (about 5); the print-resolution screenshot set (about 5); the batch review of the Figma departures in its fix cycle (about 5) | 30-35 |
| 2 (done) | spent (planned 65-75 min of extra gates: `check:db`, the golden re-seed, the sweep, the selftest, the mark) | - |
| 3 | `node tests/run-all.js app/contracts,app/states,app/typo,app/hues,app/print,contracts,dataint,derived,stub` (15-18); `node tests/app/sweep.js 360` and `768` (about 16); the golden re-seed, `build:test` and four `--update` shards (11-12; about 56 catalog states plus the Account, search and shared states whose text or bar moves); `npm run check:built` (1); both lints (2); `node tools/decisions.js` and the detector (2); the orchestrator's Impeccable `polish` and `harden` run (about 10, section 10) | 55-65 |
| 4-9 | `npm run check:built` where `dist` assets change (1) | 1 each |
| 10 | docs only: one `check:fast` and one docs-only CI run (no `e2e`) | about 20 in all |
| waves (section 16) | per wave: the merge of `origin/main`, the squash in the main checkout, the `main` CI run with the deploy (10.5-11.5) and the merge back (about 2); three waves | 37-41 |
| post-release check and closeout (section 16) | the blind production review (about 45-60, the owner's print not counted), then the closeout commit and its docs-only CI run and the last squash (about 20) | 65-80 |

Remaining total at the batch 3 refresh (batches 1, 1b, 2 and wave 1 spent):
eight code batches (3-9, P) at 45-60 min (360-480), plus 91-106 min of extra
gates (3: 55-65; P: 30-35; 4-9: 6), plus batch 10 at about 20, plus the two
waves that are left (25-28) and the post-release check and closeout (65-80):
about 561-714 min, so about 9.4-11.9 hours. If batch 10 takes code, add 25-35
min. Batch P adds 75-95 min of its own gates and measures. The owner's merges
saved two batches (about 90-120 min); keeping the spelling sweep in batch 2
saved one CI run and one review (about 30 min), and batch 1b cost one batch
because its contract and print change split from batch 1. Mock drawing (section
9) runs no gate.

Writer tests per remaining batch (`orchestrate.prompt.md`, "Writer tier"; facts
for the orchestrator's dispatch, not a model choice):

| Batch | Test 2 (public contract, route, stored state, product law, hook, configuration) | Test 3 (print fitting, golden re-seed, parity with a design node) | Plan-review trigger |
|---|---|---|---|
| P | yes: the product law's card size (QP.2, `CLAUDE.md`) | yes: print fitting; parity with Figma nodes `714-42387` and `3773-90792` (the burden export) | none |
| 3 | no (no contract, route or stored state changes; `tests/app/contracts.js` only reads a second form of the same fixture value) | yes: about 56 catalog goldens re-seeded, the first-screen offsets and the sheet, bar and column layouts rest on visual judgment | none (section 10) |
| 4 | no | yes: new states and their goldens | none |
| 5 | no | yes: goldens | none |
| 6 | no | yes: goldens | none |
| 7 | no | yes: goldens | none |
| 8 | no | yes: goldens | none |
| 9 | yes: `.prettierignore` (E4) and `.impeccable/config.json` (E2), configuration every session runs under | yes: goldens | its refresh checks the note switch's pending-edit save for possible data loss |
| 10 | no, unless it edits `.impeccable/config.json` again | no, unless it takes code | none |

## 9. Mock schedule

Done (2026-10-29): units A (`mocks/1/`, `2/`, `3/`, `4/`, `5/`, `7/`, `1b/`)
and B (`mocks/6/`, `8/`, `9/`) drew every batch mock from 1 to 9 ahead, with
the plan review additions (R5, N4-N7, B2, B3, R2, N11) and the follow-ups;
mock P is `mocks/P/` (section 15). The owner reviewed them in two rounds
(`reviews/mocks-1.md`, `reviews/mocks-2.md`) and rounds 3, 4 and 6; section 7
holds each answer as a line of its batch. The full schedule is at `git show
80872b35:issues/57/plan.md`, section 9. Batch 10 has no mock.

Rules that still hold for each batch's mock step (section 7):

- A batch's refresh re-checks its mock against the merged `main`; the owner
  sees it again only if it changed.
- A shared pattern changes only in the folder of the batch that owns it (plan
  review R9): 2 the header and the account control; 3 the row, the filter
  strip and sheet, the selection mode and the selection bar; 4 «Ещё», the
  dialog, the error page. Dependent states in `mocks/6/`, `8/` and `9/` follow
  it.
- Impeccable `critique` with the Clarity Rule runs on a changed mock before
  the owner sees it, and its `index.html` names the outcome (R5).
- Every mock step measures with `issues/57/mocks/measure.mjs` (N6), at
  360x640 and 1180x720, RU and EN.

## 10. Batch 3 - Catalog tables and filters (implement-ready)

Batch 2 is done (`30de6bf5`, fix pass `65829261`; `reviews/2.md` approve) and
wave 1 landed on `main` as `d83384b4`; `claude/57` merged it at the refresh
(`git merge -s ours`, the trees were equal). Batch 2's brief is at `git show
65829261:issues/57/plan.md`, section 10. Batch 1b's is at `git show
5d9aefbc:issues/57/plan.md`; batch 1's at `git show 80872b35:issues/57/plan.md`.

Batch 3 is the first batch of wave 2. Mock: `mocks/3/` (round 5, final; the
owner's answers R3-1, R3-2, C1 and C57 are on its `index.html`). Re-checked
against `main` `d83384b4` at this refresh: the header, the type and the glyph
match what shipped, so the mock stands and the owner sees nothing again. The
brief adds what the mock does not draw (the 761-999 px band, the homebrew
source tabs, the grid tile's kind label, the empty-state component) and names
two departures (D5, D6).

### Objective

Ship the catalog (`/tables/*`) in direction R: the list head (the table picker
and the view switch at 360, the search row ending in «Выбрать», the count line
that names the chosen values), the filter column beside the rows from 1000 px
and the filter sheet below it, «Все» as the neutral pressed default of every
filter row, the selection mode with the one selection bar, the two-level table
navigation with its labels, the renamed «Об этих данных» panel, the grid at
two columns, the search highlight and the empty-state plate. Remove the view
note and the always-on tick column. The pattern is the owner's list head for
`/homebrew`, `/lists`, `/lists/<uuid>` and `/s/` too; batches 6, 8 and 9 take it
from this batch.

### Dispatch preflight

- `git fetch origin`; merge `origin/main` into `claude/57` (a merge, never a
  rebase). At this refresh `main` and the branch tree are equal.
- The usage wrap-up (`orchestrate.prompt.md`, "Usage guards") can stop the
  implementer mid-batch. Steps are S1 to S15. The line "Session end partial
  progress" in `handoff.md` names the last finished step and the next one. A
  fresh implementer continues from that step on the uncommitted tree. Run the
  long gates (S14) only after every edit.
- Impeccable cannot run from a subagent (batch 2, `reviews/2.md` R1). S13 names
  the two ways to run `polish` and `harden`; the orchestrator runs the first.

### Decisions of this refresh (planner defaults; the owner is away)

Each is logged in the owner-AFK decisions file by the orchestrator. The
recommended option is the one built; the owner may reverse any of them later.

| # | Decision | Reason and trade-off |
|---|---|---|
| D1 | A new port `viewport` gives the band: `narrow` up to 760 px, `mid` 761-999 px, `wide` from 1000 px. The picker, the «··· Ещё» menu and the sheet are structural, so CSS alone would double the DOM. The filter column starts at 1000 px (the side-column step the departures table of section 4 already names); from 761 to 999 px the page draws the wide head with the filters in the sheet. | A 250 px column at 761 px leaves 460 px for the rows. Cost: one more state at 768 px (golden, sweep). The mock draws 360 and 1180 only. |
| D2 | `FilterPanel.svelte` is new and serves the catalog only. `FilterBar.svelte` stays for the Items tab (batch 6) and the shared page (batch 9) and is deleted with its last caller. The chosen-values logic moves to `lib/filters.ts` and both components read it. | Moving those two pages now means redrawing screens whose batches own their mocks. Interim mix: two filter forms between wave 2 and wave 3 (accepted rule, section 16). |
| D3 | `SelBar.svelte` keeps its logic (add to list, print, copy, the shared page's totals, send to owner) and draws through the new props-driven `SelectionBar.svelte` for all three callers (tables, search, the shared page). `BatchBar.svelte` stays for `/homebrew`, `/lists` and `/lists/<uuid>` and is deleted with its last caller (batch 9). | One bar shape everywhere (owner, round 6). The shared page and `/search` get the new bar before their own batches. Their ticks stay always visible. |
| D4 | The selection mode is `app.selecting` (memory only). Only the catalog hides the ticks until «Выбрать». `TableRows` takes `ticks` (default true) so `/search` and `/s/` keep today's ticks until batches 7 and 9. | The least work that keeps those two pages whole. |
| D5 | The bar's «Все» ticks every row drawn on the page, all sections. The per-section «Выбрать все (N)» strip goes from the catalog. A tier is still one step: pick the tier chip, then «Все». | The mock draws no section strip. A visible feature goes, so this is owner question Q3-S (default: as built). |
| D6 | The 1180 px equipment column table of mock 3 (`table.ct`) is not built. Rows keep one anatomy at every width. The four stats stay in the stat line of each row. | No spec or audit row asks for columns (C54's own fix is "tags after the name, cap at 70ch"). A table body for three of nineteen tables needs a second row component with ticks, anchors, flash and the grid. It is a candidate item in `handoff.md` Deferred. Owner question Q3-T (default: defer). |
| D7 | `Sheet.svelte` is a native `<dialog>` opened with `showModal()`, as `RecordModal.svelte` is. Its two callers are the filter sheet and the table picker. | Extract on the second real use. |
| D8 | «Ещё» at narrow is a `Menu.svelte` popover (batch 2), not a sheet. | The mock draws a popover. |
| D9 | A filter link that arrives does not open the sheet at narrow or mid. The count line states the picks. At wide the column is always open, so the open-on-arrival effect (`seenSeg`) goes. | A modal over a page the reader just opened is hostile. |
| D10 | The picker reads the table's sub-label; for the six tables whose sub-label is «Предметы» or «Расходники» (`SUB_LABEL` `fItems`, `fCons`) it reads «<Book> · <sub-label>», so «Core · Предметы» differs from «Hope & Fear · Предметы». | The sub-label alone names no book. |
| D11 | The tile of the grid drops the colored kind dot. A table that holds more than one kind draws a kind `Badge` in its place (the same rule as the row's kind tag, C10). | The Tag Rule: hue lives on a labeled badge. C56 asks "label or drop the dot". |
| D12 | `Empty.svelte` draws the dashed plate for every caller (CSS only, no accessible-name change, so no golden moves outside the catalog). Optional `title` and `glyph` props draw the heading and the glyph tile; the catalog passes both. DESIGN.md "Don'ts" keeps "no illustrated empty states": the only picture is the kind glyph in its art well. N0-2 stays in Deferred (batch 4). | One shape in all later batches. |
| D13 | `CHIP_SHORT`, `tables.ts`'s short forms and `Chip`'s `short` prop go: the tabs show full names from 761 px and the picker's sheet is wide enough. The decision `2026-10-21-source-names-follow-the-source-product.md` gets a pointer line. | The only caller leaves. |

### In scope

- The rows of section 7, row 3: C1, C2, C3, C4, C5, C7, C8, C10, C12 (verify),
  C53, C54, C56, C57, C58, C59, A25, A40 (tables), P1, P13, P14, P15.
- The catalog only: the 18 tables of `TABLE_IDS` that `TablesPage.svelte` draws
  and the `homebrew` table (own items).
- The ports, components and tests that those need (the files table).

### Out of scope

- `/homebrew` (batch 6), `/search` (7), `/lists` (8), `/lists/<uuid>` and `/s/`
  (9): their heads, filters and bars keep their own batches. Their ticks stay
  always on (D4).
- The Account page's Display note and its default-view wording (batch 7).
- The `/p/` print bar's `KeepNote` (batch P). `KeepNote.svelte` leaves with it.
- The pin and the help of the other pages below 760 px (batches 5, 6, 7, 8).
- The equipment column table (D6). The four-way owner choices of section 13.
- Gold chips elsewhere (interim mix): only the catalog's filter rows, group
  chips and the pressed default change here.

### Files expected

| Step | Files |
|---|---|
| S1 | `app/src/ports/types.ts`, new `ports/viewport.ts`, `ports/index.ts`, `ports/ports.test.ts`; `app/src/state/app.svelte.ts`, `app.test.ts` |
| S2 | `app/src/lib/dict.ts` (RU and EN), `lib/icons.ts` (`more`, `close`), `lib/help.ts` (`TABLES`, `Help.button`), `help.test.ts` |
| S3 | `lib/filters.ts` (`chosenLabels`), `filters.test.ts`; `lib/rowTags.ts` and `rowTags.test.ts` (new); `lib/search.ts` (`highlightRanges`), `search.test.ts`; `lib/tables.ts` (`pickerLabel`; `CHIP_SHORT` leaves), `tables.test.ts`; `lib/facets.ts` and `lib/i18n.ts` (`EQ_LINE` RU values); `FilterBar.svelte` (reads `chosenLabels`) |
| S4 | `Chip.svelte`, `chip.test.ts`; `tests/app/typo.js` |
| S5 | new `Sheet.svelte`, `sheet.test.ts`; `a11y.test.ts` (`COVERED`); `docs/specs/COVERAGE.md` |
| S6 | `state/app.svelte.ts` (`selecting`, `selectable`), `app.test.ts`; new `SelectionBar.svelte`, `selectionBar.test.ts`; `SelBar.svelte`; `TableRows.svelte`; `SearchPage.svelte`, `SharedListPage.svelte` (register `selectable`); `tests/app/driver.js` (`tick`) |
| S7 | new `FilterPanel.svelte`, `filterPanel.test.ts` |
| S8 | new `TableNav.svelte`, `tableNav.test.ts` |
| S9 | `TablesPage.svelte`, `PageHead.svelte`, `HelpButton.svelte`, `Empty.svelte`, `SectionHead.svelte`; `state/app.svelte.ts` (`pinHome`, `tablesViewChanged` leaves), `app.test.ts`; `tables.test.ts`, `shell.test.ts` where they read the strip |
| S10 | `RowMain.svelte`, `TableRows.svelte`, `Badge.svelte` if the tile badge needs it; `app/src/styles/tokens.css` only for a measured token |
| S11 | `tests/app/contracts.js`, `states.js`, `sweep.js`, `golden.js`, `inventory.js`, `driver.js`, `print.js`; `tests/app/snapshots/` |
| S12 | `docs/specs/FEATURES.md`, `ROUTES.md` (wording), `COVERAGE.md`, `STATE.md` (selection mode is memory); `DESIGN.md`; one file under `docs/decisions/` and the pointer in `2026-10-21-source-names-follow-the-source-product.md`; `docs/DECISIONS.md` |
| S13 | `handoff.md` (the Impeccable outcome) |
| S14 | none (gates) |
| S15 | `issues/57/mocks/3/built/`, `handoff.md` |

### Constraints from the mock and the owner

- The list head pattern is `mocks/3/index.html`, "List head pattern (final,
  round 5)". It governs, with these readings where the page contradicts
  itself: the count is on its own line under the search row at 360 (the line
  "At 360 the count shares its line with «Выбрать»" of the changes list is
  superseded), and it shows only while the view is narrowed by a filter or a
  query.
- Search: the first control of the search row at every width, at least 140 px
  at 360; placeholder «Поиск» / "Search", with the accessible name the long
  `searchPh` text. «Фильтры» after it at narrow and mid, plain at N = 0, lit
  (a gold label on a 45% gold border, no fill) while N > 0. «Выбрать» last, no
  icon, hidden while the mode is on.
- The page name «Таблицы» is the `h1` at every width. At narrow it is read, not
  drawn (`.vh`), and the picker is a button named «Таблица: <name>» / "Table:
  <name>". The pin and «Об этих данных» are labeled buttons beside the `h1`
  from 761 px; at narrow they live in «··· Ещё» with «Ссылка на таблицу» and
  the page's `h1` row is the picker row. The view switch («Список» / «Сетка»,
  `Seg neutral small`) sits beside the picker at narrow and in the search row
  from 761 px; it never goes into «Ещё».
- «··· Ещё» is the three-dot icon and the word, no chevron, never the icon
  alone. Its menu holds, in order, «Ссылка на таблицу» (not on `homebrew`, rule
  17), the pin (`Открывать при запуске` / `Открывается при запуске`) and «Об
  этих данных». Its `Menu.svelte` keys are batch 2's.
- The count line: «<chosen values> · Показано N из M» / "<chosen values> · N
  of M shown". The values are `chosenLabels`, joined with a comma, cut to one
  line with an ellipsis; the count never cuts (`flex: none`). The full text is
  the line's accessible name.
- The filter column (wide) and sheet (narrow, mid): head «Фильтры · N» (just
  «Фильтры» at N = 0), then «Сбросить» and «Ссылка на фильтры» once N > 0
  (`homebrew` draws no link, rule 17); rows with their label and chips, «Все»
  first and neutral-pressed while the row has no pick; a value chip gold when
  picked (it narrows the view). The sheet adds «Закрыть» to its head and the
  foot «Сбросить» and «Показать N» (the shown count). The «Свои предметы» switch
  (signed in, own items held, equipment tables only) sits in the search row
  after the view switch from 761 px and as the first row of the sheet below it.
- The two-level navigation: from 761 px the group chips (`Chip` links, one
  row, labeled «Группа» / "Group" for assistive technology) and under them
  the book or section as underlined tabs (a gold underline and gold text for
  the current one); at narrow both levels are the picker's sheet, labeled
  «Группа» and «<group name>». The source chips of `#/tables/homebrew` (two
  sources or more) are the same tabs with the same fold (`FoldButton`), labeled
  «Источник» / "Source" (A25).
- Rows: name, then its tags after it, then the stat line, then the one feature
  line; no tick column outside the selection mode; a meta separator stays with
  the value before it (no line starts with «·»); the line length holds at 70ch.
  A row hides the tags that repeat what the page already says: the kind tag on
  a one-kind table, the tier tag under a tier heading or a tier filter, the
  source tag on a one-book table and the «Core» source tag on an equipment
  table (a row from another book keeps its book name). `rowTags.ts` is the one
  place of this rule.
- A ticked row (and a ticked tile) is lit, neutral: a `--surface2` ground, a
  `--muted2` border, the checked box. Never gold, never a one-side stripe
  (`side-tab`; R's `.rl.sel` is not built).
- Grid: two columns at 360 (`repeat(2, 1fr)` up to 600 px, then today's
  `minmax(168px, 1fr)`); each tile is the art, the name and a second line (the
  stat line for equipment, else the other-language name as today); the roll
  number badge is Chalk on a seam border (the `.rnum` rule), not gold. The
  grid keeps the section heads and their link.
- Section head: the `h2` and «Ссылка на раздел» / "Link to this section" as a
  labeled icon button, a 28 px target at 360 (the mock's measure).
- The selection bar: «Все» (a tri-state box with its label always visible),
  «Выбрано: N» / "N selected" and the page's facts, the page's actions, «Снять
  выделение» / "Clear selection" last. At 360 the head (box, summary, clear)
  is one row and the actions are the next, the bar pinned to the bottom of the
  screen. Tables, search and the shared page draw «В список», «Печать»,
  «Скопировать текст» / "Copy text" (the shared page adds its own send line as
  today). Zero ticks: «Выбрано: 0», the actions off, «Снять выделение» on;
  «Снять выделение» clears the ticks and leaves the mode in both states, and
  «Выбрать» comes back. The bar draws no «··· Ещё» in this batch: no caller has
  a fourth action; the first one that has adds the `more` snippet (batch 6).
- The empty state (D12): the plate with the kind glyph tile, «Ничего не
  найдено» / "Nothing found", one cause sentence that names the query and the
  chosen values, and one primary «Сбросить фильтры» / "Reset the filters" when
  a filter is chosen. No tile or button when nothing narrows.
- The home-hash pin: `/tables` pins the table in view (`home=` as today).

### Steps

S1. The viewport port.
   1. `ports/types.ts`: `type Band = 'narrow' | 'mid' | 'wide'`; `interface
      ViewportPort { band(): Band; onchange(cb: (b: Band) => void): () => void
      }`; `Env.viewport: ViewportPort`.
   2. `ports/viewport.ts`: `browserViewport()` reads two `matchMedia` queries
      (`(max-width: 760px)`, `(min-width: 1000px)`) and listens to both; with
      no `matchMedia` it answers `wide`. `fakeViewport(band = 'wide')` has
      `set(band)`. `ports/index.ts` wires the browser port in the real env and
      the fake in the test env. A comment cites DESIGN.md "The Two Breakpoints
      Rule" for the two numbers and says no other code reads the width.
   3. `AppState`: `band = $state<Band>(...)`, set from `env.viewport.band()` in
      the constructor and from the subscription.
   4. Tests: `ports.test.ts` (the browser port against a stubbed `matchMedia`,
      the fake); `app.test.ts` (`band` follows `set`).
S2. Strings, icons and help.
   1. `dict.ts`: the keys of "RU/EN parity" below, both languages, in the
      groups where their neighbors sit. A key whose text is unchanged keeps its
      name. `subTables` leaves (C53); `viewList` and `viewGrid` change RU to
      «Список» and «Сетка» (the Account page's Display row reads them and
      follows: its goldens move).
   2. `icons.ts`: `more` (three dots, Material Icons `more_horiz`, Apache 2.0)
      and `close` (Material `close`), each with the file's source comment.
   3. `help.ts`: `Help` gains `button?: string`, the name of its button. `TABLES`
      becomes three notes with the `lead` shape, RU and EN, as `mocks/3/b3.js`
      `NOTES` writes them (sources and the translation credit; tier in Wondrous
      Environments; class against damage). `button` is «Об этих данных» / "About
      this data". The other ten paragraphs go. The «Линейка» paragraph goes with
      its control (S3.6). Every other `Help` keeps its text and has no `button`.
   4. `help.test.ts`: `TABLES` has three paragraphs in each language and
      `button`; no other help has one.
S3. Pure logic, each with its unit test.
   1. `filters.ts` `chosenLabels(rows, picked)`: the chosen `{group, value,
      label}` list of `FilterBar`'s `chosen` (a bare number takes its row's
      name: «Ранг 1»). `FilterBar.svelte` reads it (its own copy goes).
   2. `rowTags.ts` `hiddenTags(table, filter, section)`: returns `{ kind, tier,
      src }` booleans by the rules of "Constraints" (rows). Tests: one row per
      rule, on `eq_weapon`, `core_item`, `wondrous`, `homebrew`.
   3. `search.ts` `highlightRanges(text, terms)`: the `[start, end)` ranges of
      each term's folded text inside the name. It acts only when
      `foldQuery(text).length === text.length`; a stem match is not marked.
      Tests: case, `ё`/`е`, a phrase, two terms, an overlap, no match, the
      length guard.
   4. `tables.ts` `pickerLabel(table, t)` by D10; `CHIP_SHORT`, `shortOf` and
      the `short` use go (D13); `tables.test.ts` follows.
   5. `i18n.ts` `EQ_LINE`: RU `line` reads «Есть улучшение», `uniq` «Уникальные»;
      `dict.ts` `eqLineF` reads «Улучшения и уникальные» / "Upgrades and
      uniques" (clarity inventory, plan review N11). The shared page's panel
      shows the same words (one name for one thing).
S4. `Chip` neutral and the `filter` mark.
   1. `Chip.svelte`: the button form takes `neutral?: boolean` and `filter?:
      string`. A pressed neutral chip draws `Icon check` before the label,
      `--surface2` fill, `--txt` label, a `--muted2` border and weight 600,
      `inline-flex` with `align-items: center` and a 6 px gap (the icon and the
      label share one center). `filter` becomes `data-fval` (the browser suites
      read it; `data-val` stays StdPanel's). The `short` prop goes (D13).
   2. `chip.test.ts`: the neutral pressed state (check, `aria-pressed`), the
      unpressed state, `data-fval`; each case ends with
      `expectNoA11yViolations`.
   3. `tests/app/typo.js`: the neutral-switch list gains the pressed «Все» chip
      of `#/tables/eq_weapon` (the column at 1180, the open sheet at 360).
S5. `Sheet.svelte` (D7).
   1. Props: `app`, `label` (the dialog's name), `title`, `onclose`, `head?`
      (a snippet beside «Закрыть»), `children`, `foot?`. A native `<dialog>`
      opened with `showModal()` in an effect; `app.dialogOpen` follows it
      (as `RecordModal.svelte`); `<Toast {app} inDialog />` inside. The first
      focus is «Закрыть» (`Icon close` and `t.close`). Escape, «Закрыть» and a
      press on the scrim close it; the native `close` event calls `onclose`.
      No grab handle (N0-3).
   2. Layout: attached to the bottom, `width: min(100%, 560px)` centered, the top
      corners `--r`, `max-height: min(85dvh, 640px)`; the head and the foot stay,
      the body scrolls (`overflow: auto`, `overscroll-behavior: contain`).
   3. `sheet.test.ts`: the name, the three ways to close and one `onclose` call,
      `app.dialogOpen` true then false, the foot and the head snippets, axe.
      `a11y.test.ts` `COVERED` and `COVERAGE.md` name `Sheet.svelte`.
S6. The selection mode and the one bar (D3, D4, D5).
   1. `AppState`: `selecting = $state(false)`; `selectable = $state.raw<string[]>
      ([])` with `setSelectable(ids)`; `selecting` resets in `#clearTicks` and
      so in `clearSel()` (one effect: clear and leave). A route change that
      keeps the ticks (`keepsTicks`) keeps the mode.
   2. `SelectionBar.svelte` (new, props only): `total`, `picked`, `count` (the
      summary text), `onall(checked)`, `onclear`, `summary?`, `actions`,
      `disabled` (zero ticks), `below?`. It draws the `section.selbarwrap` /
      `.selbar` / `.selacts` classes of today (the print suite reads
      `.selbarwrap .selacts > *`), the sticky bottom place, the safe-area
      padding and the blur, with the new head: the tri-state «Все» box
      (`aria-label` `selectAll`, the visible text `allShort`), the summary (a
      polite live region), «Снять выделение» last. Neutral look: `--surface`
      ground, a `--muted2` top border; no gold.
   3. `SelBar.svelte` renders through it for tables, search and the shared page:
      the tables and search summary is `selCount`; the shared page keeps
      `selCountText` and its total. `AddToList` takes `disabled` (add the prop if
      absent) while nothing is ticked. The notify question and the sign-in
      prompt keep taking the action row's place. `SearchPage.svelte` and
      `SharedListPage.svelte` call `app.setSelectable(<drawn ids>)` in an
      effect and clear it on destroy; `TablesPage` does the same.
   4. `TableRows.svelte`: `ticks?: boolean` (default true); false draws no tick
      column, no tile overlay and no `selall` strip; `ontoggleall` stays for
      the two callers that keep the strip. The selected row and tile take the
      neutral style of "Constraints"; the box's `accent-color` is `--txt`.
   5. `tests/app/driver.js` `tick(name)`: when the page has a «Выбрать» / "Select"
      button and the mode is off, press it first. The other callers of `tick`
      need no edit.
   6. Tests: `selectionBar.test.ts` (zero ticks, one, all, the clear effect,
      focus: «Выбрать» opens the mode and the focus moves to «Все»; «Снять
      выделение» returns it to «Выбрать»; axe); `tables.test.ts` selection cases
      move to the mode; `searchPage.test.ts` and `sharedListPage.test.ts` change
      only the summary text and the box names they read.
   7. C12 (`verify`): in the built app at 360 and 1180, tab to the last row
      tick that sits under the bar. If the focus is covered, `html` takes
      `scroll-padding-bottom: var(--selbar-h, 0px)` and `SelectionBar` sets the
      variable from its own height while mounted. The outcome goes in the
      handoff.
S7. `FilterPanel.svelte` (D2, D9).
   1. Props: `rows`, `picked`, `shown`, `total`, `band`, `open` (the sheet),
      `onopen`, `onclose`, `onpick`, `onclear(group)`, `onreset`, `oncopylink?`,
      `own?` (the switch's state and handler), `app`. Wide draws the column
      (`position: sticky; top: var(--anchor-top)`, 250 px wide,
      `max-height: calc(100dvh - var(--anchor-top) - 16px)`, scrolling inside
      itself); narrow and mid draw `Sheet` with the head and foot of
      "Constraints".
   2. Each row is `role="group"` labeled by its label; the chips are `Chip`
      buttons; «Все» is `neutral`, `on` while `groupIsAny(picked, group)`, and a
      press clears the row (`onclear`); a value chip carries `filter="<group>:<value>"`.
      A row of more than `CHIP_FOLD_AT` values folds as today (`foldRows`,
      `FoldButton`, rule 12). The `любое` hint is gone: «Все» says it.
   3. Rule 20: after «Сбросить» the focus lands on the first row's «Все»
      (wide) or the sheet's «Закрыть» (sheet); after the empty state's «Сбросить
      фильтры» removes itself the focus lands on the first «Все» (wide) or the
      «Фильтры» button (narrow, mid), else `#main`. The rule 20 text in
      `FEATURES.md` follows (S12).
   4. Tests: `filterPanel.test.ts`: «Все» pressed with no pick and off with
      one, a press on «Все» clears the row, the column at `wide`, the sheet at
      `narrow` and `mid`, the head count and the reset, no link where
      `oncopylink` is absent, the fold, focus after a reset, axe with the sheet
      closed and open.
S8. `TableNav.svelte`.
   1. Props: `app`, `table`, `group`, the homebrew source list and its handler
      props as `TablesPage` holds them today. `wide` and `mid`: the group `Chip`
      links in `nav` labeled «Группа» (the landmark keeps the name `t.tables`
      that the browser suites read as `.tablenav`), then the tabs as links with
      `aria-current="page"` on the current one. `narrow`: the picker button
      (`aria-haspopup="dialog"`, `aria-label` `tablePick`, text `pickerLabel`,
      the chevron icon) and a `Sheet` holding both levels as links; a press on a
      link closes the sheet.
   2. The homebrew table's source tabs, the fold and the «и ещё N» button move
      here unchanged in behavior.
   3. Tests: `tableNav.test.ts`: the three bands, the current marks, the picker
      name for `eq_weapon` and `core_item`, the sheet closes on a navigation,
      the source tabs fold, axe.
S9. `TablesPage.svelte`, `PageHead.svelte`, `HelpButton.svelte`, `Empty.svelte`,
   `SectionHead.svelte`.
   1. `PageHead`: the `sub` line draws only when it is not empty (C53);
      `help.button`, when set, is the help button's name (`HelpButton`
      `label`); the other pages keep «Справка» and their round pin and help
      below 760 px (interim). `AppState.pinHome(home?)` takes PageHead's pin
      press handler (the toggle and its toast); its second caller is the
      «Ещё» item.
   2. `TablesPage`: replace `.tablenav`, the toolbar and `FilterBar` with
      `TableNav`, the search row and `FilterPanel` by `app.band`. From `mid` it
      draws `PageHead` (the `h1`, the labeled pin and help) as today. At
      `narrow` it draws `h1.vh`, the picker row (`TableNav`, the view `Seg`
      and the «··· Ещё» button with its `Menu`) and no `PageHead`; the help
      box opens from the menu item and `helpOpen` lives in the page. Delete
      `filterOpen`, `seenSeg`, `seenTable`, the open-on-arrival effect,
      `KeepNote` and the `tablesViewChanged` use (the getter leaves `AppState`
      and its test when no caller is left). `filterToggle` and `resetFromEmpty`
      follow S7.3. The search state, `q`, stays page memory. The count line is
      a `p` under the search row at narrow and a `span` in the row from `mid`,
      one element with one name.
   3. `SectionHead`: the visible label «Ссылка на раздел» / "Link to this
      section" (`copySection` carries it; its text changes) with the link icon,
      28 px tall at 360.
   4. `Empty`: D12.
   5. Every `data-primary` stays on the rows container; the filter column and
      sheet are not primary.
   6. Tests: `tables.test.ts` (head per band, the search row, the count line
      with one and two values, the picker, «Ещё» items, no `KeepNote`, the
      empty state with its reset, the `hb` states), `shell.test.ts` where it
      reads the strip.
S10. Rows, tiles, highlight.
   1. `RowMain.svelte`: the name line carries the tags after the name; the
      right-hand tag column goes. A new prop `hide: { kind, tier, src }` from
      `hiddenTags`; a new prop `terms` marks the name with `<mark>` through
      `highlightRanges` (`mark` has a `--surface2` ground and an underline, so
      the match does not rest on color alone, WCAG 1.4.1). Row text is capped at
      70ch. A separator never starts a line (the separator is part of the value
      before it, with a no-break joiner where the value wraps).
   2. `TableRows.svelte`: grid by the "Constraints"; the tile's second line;
      the kind `Badge` where the table holds more than one kind (D11); the roll
      number badge is neutral. `TablesPage` passes `hide`, `terms` and `ticks`.
   3. P1: no «Ранг 1» tag under the «Ранг 1» heading; P14: a row's height
      follows its lines, no fixed row height; P15: a unit test asserts the EN
      grid tile shows the English name first and the other-language name second
      where one exists; P13: the book chips «Core» and «Hope & Fear» stay Latin
      in RU (DESIGN.md names the rule, S12).
S11. The browser suites and the goldens (see "Goldens and new states").
   1. `tests/app/contracts.js`: the `picked` reader takes `.fpill` (the shared
      page, still `FilterBar`) and `[data-fval][aria-pressed="true"]` (the
      catalog at its 1280 px viewport, the column open). The fixture values of
      `routes.json` do not change. The comment says the reader follows both
      forms until batch 9 removes `FilterBar`.
   2. `tests/app/states.js`: case 4/5 counts the pressed `[data-fval]` chips
      (two) and drops the 32 px pill check; case 16 uses `tick` through the
      mode; case 83 (`FIRST_SCREEN`) per "First-screen row".
   3. `tests/app/sweep.js`: the "короткие чипы" case goes (D13); the strip
      height cap case (`stripCap`, `.tablenav .chips`) becomes a head case: at
      500, 600 and 700 px the nav is the picker row at most 64 px tall, and at
      768 px the group row plus the tabs at most 110 px; the focus-walk row for
      `#/tables/eq_weapon` no longer presses «Фильтры». `FEATURES.md` "Rolling"
      loses the cap sentence and says the measured heads (S12).
   4. `tests/app/golden.js` and `inventory.js`: an entry may carry `width`; the
      capture uses `state.width ?? WIDTH` in both branches. The inventory
      `enter` steps and the new states follow "Goldens and new states".
   5. `tests/app/print.js`: the `.selbarwrap .selacts` reads keep their class
      names; update only what the new markup breaks.
S12. Specs and the decision file.
   1. `FEATURES.md` "Tables and search": the group chips and the second row
      (tabs), the view note sentence (gone), the chosen values and the pill
      sentences for the catalog (the count line, no pill row at narrow or mid,
      the column at wide), the rule-20 filter cases, «Выбрать» and the
      selection mode, «Все» ticking every drawn row, the own-items switch's two
      places, the section link label; "Rolling" loses the strip cap and the
      short-forms sentences; "Print" names the bar's three controls as they
      read now. The consistency rules 16 (the count line is cut to one line:
      named departure) and 20 change where they name pills.
   2. `ROUTES.md` "Filter grammar": "draws its pill" reads "draws its chip" for
      the catalog; the grammar does not change. `COVERAGE.md`: rows for the new
      files; `STATE.md`: the selection mode is memory.
   3. `DESIGN.md`: see "DESIGN.md rules this batch writes".
   4. A decision file under `docs/decisions/` (template
      `.claude/templates/decision.template.md`): "List pages share one head and
      one selection bar", with the band port, the filter panel against the
      filter bar, the mode and its default, the rejected options (the column
      table D6; a per-section select D5; a pill row at 360) and the interim
      mix. `node tools/decisions.js` rebuilds the index.
S13. Impeccable (see "Impeccable" below).
S14. Gates ("Verification").
S15. Screenshots and the handoff: the screenshot set, the handoff lines of
   section 7 "Each of batches 2-9", the progress line.

### Impeccable

`polish` and `harden` are Impeccable skill runs and cannot run from a
subagent. Two named ways, in this order:

1. Orchestrator-run (default). After the implementer's commit and before the
   batch review, the orchestrator (the session that has the Skill tool) runs
   `impeccable polish` and `impeccable harden` on the changed surfaces
   (`TablesPage`, `TableNav`, `FilterPanel`, `Sheet`, `SelectionBar`, `SelBar`,
   `TableRows`, `RowMain`, `Chip`, `Empty`, `SectionHead`) with the Clarity
   Rule. It applies the findings as small edits and a fix commit, or hands them
   to the implementer as an ordered list. The outcome goes in `handoff.md`, with
   the date. A reviewer reads that line before the batch review.
2. Fallback (the orchestrator cannot: a usage wrap-up, no Skill tool). The
   implementer runs a manual pass with the skill's own checklist: `Glob` for
   `polish.md` and `harden.md` under `~/.claude/plugins/**/impeccable*`
   (the skill's `reference` directory), read both, and answer each line for the
   files above. The handoff records it as a deviation (as batch 2 did) and the
   post-release audit is the backstop. A subagent of type
   `impeccable:impeccable-finish-reviewer` may read the finished build as a
   second lens; it is read-only.

The detector line of section 7 holds either way: `impeccable detect --json
--no-inline-ignores app/src` reports no finding in a touched file, and `git
grep -n impeccable-disable -- app/src` returns nothing.

### Acceptance criteria

Each line is observable in the built app, in a unit case or in a suite.

- List head: at 360 the page draws the visually hidden `h1`, the picker (named
  «Таблица: <name>» / "Table: <name>"), the view switch and «··· Ещё»; then
  the search row («Поиск», «Фильтры» numbered and lit while N > 0, «Выбрать»
  last); then, only while narrowed, the count line. From 761 px the `h1`, the
  labeled pin and «Об этих данных», the group chips, the tabs and the search
  row; from 1000 px the filter column. The `h1` is drawn in every state
  (rule 7).
- «Выбрать» opens the selection mode (ticks appear, the button hides, the focus
  moves to «Все»). «Снять выделение» clears the ticks, leaves the mode and
  returns the focus to «Выбрать» (rule 20), also with zero ticks.
- The bar: «Все» (tri-state, label always visible) ticks every drawn row of
  the page; «Выбрано: N» / "N selected"; «В список», «Печать», «Скопировать
  текст»; «Снять выделение» last; zero ticks disable the three actions;
  pinned to the bottom at 360 and 1180; no tab stop hides under it (C12
  closed, outcome in the handoff).
- «Все» in a filter row is neutral-pressed with no pick, a press clears the
  row, a picked value is gold, no `любое` hint. `Chip neutral` has a component
  case ending in `expectNoA11yViolations`.
- The count line names the chosen values at 360 and the count («Ранг 1,
  Вплотную · Показано 4 из 458»), one line, the count never cut; a search alone
  shows the count too; nothing narrowed shows no line.
- The filter sheet (narrow, mid): the head with «Закрыть» (and «Ссылка на
  фильтры» once N > 0), the rows, the foot «Сбросить» and «Показать N»; the head
  and foot stay, the body scrolls; no grab handle; the own-items switch is its
  first row when drawn.
- The table, filter and section links are labeled at every width (C5);
  `homebrew` draws none (rule 17).
- The navigation is labeled at both levels (C7, A25); the picker's sheet holds
  both levels (three taps to another group's table, R3-2).
- «Об этих данных» opens the three data notes and names its button (Q3.1); the
  other ten paragraphs are gone from `help.ts` with their tests; no other help
  changes.
- The view switch reads «Список» / «Сетка» and carries no note (Q3.2); the
  default view is unchanged; `KeepNote` draws only on `/p/`.
- Rows follow "Constraints" (tags after the name, `rowTags`, no «Ранг 1» tag
  under «Ранг 1» (P1), no tick column outside the mode (A40), 70ch, no line
  starts with a separator). The search highlight marks the name with `<mark>`
  and more than color (C59).
- The grid is two columns at 360, keeps its section heads and links, has no
  colored dot, shows a kind badge only on a mixed-kind table, and reads the
  English name first in EN (C56, C58, P15, D11).
- The empty state is the plate, the glyph tile, the cause (query, values or
  both) and the primary reset when a filter is chosen (D12).
- The catalog is correct at 360, 390, 768 and 1180 (`sweep.js`); at 768 the
  wide head draws with the filters in the sheet.
- `routes.json` is unchanged and `app/contracts` passes with the `picked`
  reader of S11.1.
- Each new state of "Goldens and new states" has its entry, its RU and EN
  golden and an axe case.
- Inherited: `reviews/2.md` N1 and N3 hold (no "labelled" in `FEATURES.md`
  "Chrome" and `DESIGN.md`); 2-R1 is answered by "Impeccable"; 2-N5 and 2-N6
  stay deferred to batches 5 and 10.
- The two `FIRST_SCREEN` rows are `shipped: true` and pass; the DESIGN.md rules
  of its section match what ships; the detector line, American spelling in new
  prose, the screenshot set (`mocks/3/built/`, 360 and 1180 RU and EN, plus
  768) and the `polish` and `harden` outcome are in `handoff.md`.
- The gates pass and CI is green on the pushed tip.

### First-screen row (section 14)

| Row | 360x640 | 1180x720 | Limit | Target |
|---|---|---|---|---|
| `#/tables/eq_weapon` | 233 (mock) | 269 (mock) | 256 / 288, `shipped: true` | 240 / 270 |
| `#/tables/eq_weapon ~ two filters` (new, route only) | 249 (mock) | 269 (mock) | 256 / 288, `shipped: true` | 240 / 270 |

The built page measured at the handoff after batch 2: 748 / 681 at 360 and
526 / 504 at 1180 (RU, EN). The filtered row adds the count line, so 249 is 7 px
inside the limit: a measured value above 256 is named in the handoff and the
count line's line height is the first fix; no exception is requested. The
mock renders Source Sans Pro; the app, Source Sans 3 Variable. Case 83 gains
the second row; its `enter` is the route (no `d.click('Фильтры')`, which does
not exist at 1180).

### Goldens and new states

Every golden of a catalog state is re-seeded (about 56 states, RU and EN), plus
the Account Display states (the view labels) and the search and shared states
whose bar changes; run the four shards, none edited by hand.

| State id | Width | Entry |
|---|---|---|
| `#/tables/eq_weapon ~ filter sheet` | 360 | press «Фильтры» (new) |
| `#/tables/eq_weapon ~ filter sheet, two filters` | 360 | route with two groups, press «Фильтры» (new) |
| `#/tables/eq_weapon ~ filter sheet as gm1` | 360 | own items held: the switch is the first row (new) |
| `#/tables/eq_weapon ~ table picker` | 360 | press the picker (new) |
| `#/tables/eq_weapon ~ more menu` | 360 | press «Ещё» (new) |
| `#/tables/eq_weapon ~ mid band` | 768 | route only (new): wide head, filters in the sheet |
| `#/tables/eq_weapon ~ selecting` | 1100 | press «Выбрать»: zero ticks (new) |
| `#/tables/eq_weapon ~ two filters` | 1100 | route only (new; also the first-screen row) |
| `#/tables ~ help` | 1100 | renamed `#/tables ~ about this data`; press «Об этих данных» |
| `~ panel open` states of `wondrous`, `eq_weapon`, `community` | - | deleted with their goldens: the column is open in the base state |
| `~ filtered`, `~ nothing found`, `~ grid`, `~ searched`, `~ a row ticked`, `~ bar menu as gm4`, `~ selection copied` | 1100 | `enter` rewritten for the column (no `d.click('Фильтры')`), «Сетка», the placeholder «Поиск», `tick` through the mode |

`inventory.js` states every `why` in the file's style. Each new open or pressed
state has an axe case in its component test.

### DESIGN.md rules this batch writes

From the departures table of section 4 ("Rewritten by 3"), in the same commit:

- Filter pills: "Filter chips and the count line". No pill row at 360 or in the
  catalog's mid band; the count line names the chosen values; at wide the
  column shows the picks; the neutral «Все» row default.
- Chips: the neutral pressed variant (`Chip neutral`), the two-level navigation
  (group chips; book tabs), a chosen value chip stays gold.
- Components: the bottom sheet (`Sheet`): first used by the filter sheet and
  the table picker, no grab handle, native `<dialog>`; the selection bar (one
  shape, its tri-state «Все», zero-tick state) under "Components".
- Shapes: the dashed border marks a property and the empty-state plate; the
  Seal Rule's neutral selection (a lit ground and a check, never gold or a
  stripe) replaces the gold ticked row; "Cards" (art well) notes the tile's
  kind badge. "Don'ts": "no illustrated empty states" keeps its words and adds
  that the only picture is the kind glyph in its well.
- The Two Breakpoints Rule: the 761 px step now also draws the labeled pin, the
  wide head and the tabs; a new 1000 px step draws the filter column; below 761
  px the sheet, the picker and «Ещё» replace them. The `viewport` port is named
  as the one place that reads the width.
- Book names stay Latin in Russian (P13).
- The Same Label Rule loses `/tables` from its interim note (the pin and the
  help of the catalog are in «Ещё» below 761 px).

### Verification

In this order, after S12:

1. `npx vitest run app/src/components app/src/lib app/src/ports app/src/state`
   while editing; `npm run lint:untyped`, `npm run lint:typed`.
2. `rtk npm run check:fast` (Bash timeout 600000).
3. `node tools/build.js` (no change), `node tools/decisions.js`.
4. `npm run check:built`.
5. `npm run build:test`, then `node tests/run-all.js
   app/contracts,app/states,app/typo,app/hues,app/print,contracts,dataint,derived,stub`.
6. `node tests/app/sweep.js 360` and `node tests/app/sweep.js 768` (the mid
   band); CI runs 390, 768 and 1180.
7. `node tests/app/golden.js --update --shard=n/4`, n = 1 to 4, then
   `git diff --stat tests/app/snapshots` read for unexpected files.
8. `impeccable detect --json --no-inline-ignores app/src`; the spelling grep of
   batch 2's word list over the touched files.
9. Commit, push, the CI credit (`ci-credit.mjs`). The batch review follows
   (triggers: new or changed UI; `tests/app/` and a public contract reader
   changed).

### Risks and do-nots

- Do not hand-edit a golden; re-seed it.
- Do not change a `routes.json` value or an address. Only the test reader moves.
- Do not touch `FilterBar` behavior beyond reading `chosenLabels`; the Items tab
  and the shared page keep their pills and goldens.
- Do not add a `more` snippet or an «Ещё» to the bar (no caller has a fourth
  action); do not build the column table (D6); do not add a per-section select.
- Do not move a chip outside the catalog to neutral.
- Do not add another system breakpoint: only 760 and 1000 (D1), read by the
  port and the CSS media queries.
- Do not use a gold selected style, a one-side accent or `box-shadow: inset 3px`
  on a row (the `side-tab` detector rule).
- Review order: the selection model and bar, the filter panel and sheet, the
  navigation, the rows, the contract reader and suites, the prose.

### Standing checks for batch 3

1. Scale. The table sizes are fixed by the data: the largest are 458 weapons,
   135 secondary, 114 armor; `homebrew` holds up to 100 own items by default
   (300 at 3x). No collection cap changes. States:

   | State | Shows | Proof |
   |---|---|---|
   | one row (`eq_weapon` at tier `A`, the existing `f_tier-A` state) | the list head, one row, the count line | golden, `tables.test.ts` |
   | `eq_weapon`, 458 rows, five sections | head, column, sections with links; «Все» ticks 458 and the bar says «Выбрано: 458» | `tables.test.ts` (a fixture with 458 ids), `sweep.js` |
   | `homebrew` with 66 items and 14 sources (the sweep seed), and 300 own items (3x) | tabs fold past 12 sources («и ещё N»); rows draw; «Все» ticks the drawn rows only | `sweep.js` seed, `tables.test.ts` |
   | a filter that leaves one row, and one that leaves none | the count line; the empty state with its reset | goldens `~ filtered`, `~ nothing found` |
   | the longest allowed own-source name (80 characters, `BOOK_NAME_MAX`) in the tabs, the picker and the count line | the tab wraps inside its box; the picker cuts to one line with the full name in `aria-label`; the line cuts to one line | `tableNav.test.ts`, `sweep.js 360` |
   | each row above at 360 and 1180 | per "Acceptance" | screenshot set, `sweep.js` |

   At many and at the limit: the row order is the table's (tier sections
   first); the primary action of the page is the first row (open a record);
   the selection bar is the one sticky region, 150 px at 360 with the three
   actions, and the notify question or the sign-in prompt replaces the action
   row inside it (the shared page, signed-out print), with `max-height: 45dvh`
   and its own scroll so it never exceeds the viewport. The filter sheet is the
   other: `max-height: min(85dvh, 640px)`, body scrolling; no text field, so no
   on-screen keyboard state. The search field is outside the sheet.
2. Error scenarios. The catalog reads static data; only `homebrew` reads the
   account. Loading: `LoadState` and `NoData` as today, the head draws in every
   state (rule 7). Failed read: `homebrew`'s «Повторить» as today. Failed write:
   none; a failed clipboard write keeps today's toast. Offline: the catalog
   works; «Печать» keeps its cloud rule. Conflict and a deleted record: a
   ticked own item deleted elsewhere drops from `selectable` on the next read
   and `keepTicksIn` rules as today. A stale tab: a bundle from before wave 2 keeps the old tables until a
   reload; every address resolves, because no route changes. A revert: nothing is stored (the mode, the sheet and the band are memory), so
   the previous frontend meets no new data.
3. Consistency. Followed: `FEATURES.md` rules 1 (one count: the line's «Показано
   N из M» is the table's count at the head of the collection), 4 (the page
   name is the `h1` and the tab), 7, 9 (the first control under the lead is
   the search), 11 (Escape, the scrim and «Закрыть» close the sheet), 12
   (folds), 16 (long names) and 20 (focus), the Same Label Rule (no label
   changes with the width). Departures: rule 16 (the count line cuts to one
   line at 360; the full text is its name; owner R3-1); rule 9 (the picker row
   and the search row sit above the table's own first control, the first row;
   the batch 6 and 8 mocks do the same). Siblings compared: `/search`, `/s/`,
   `/homebrew`, `/lists` keep their older head and bar until batches 6-9; the
   differences are the interim mix named in D2-D4.
4. RU/EN parity. New or changed strings, both languages, the same facts:

   | Key | RU | EN |
   |---|---|---|
   | `selectMode` | Выбрать | Select |
   | `allShort` | Все | All |
   | `selCount` | Выбрано: %n | %n selected |
   | `filtersN` | Фильтры · %n | Filters · %n |
   | `shownOf` | Показано %n из %m | %n of %m shown |
   | `tablePick` | Таблица: %s | Table: %s |
   | `groupLabel` | Группа | Group |
   | `sourceLabel` | Источник | Source |
   | `moreMenu` | Ещё | More |
   | `viewList`, `viewGrid` | Список, Сетка | List, Grid |
   | `copySection` | Ссылка на раздел | Link to this section |
   | `searchShort` | Поиск | Search |
   | `showN` | Показать %n | Show %n |
   | `reset` | Сбросить | Reset |
   | `resetFilters` | Сбросить фильтры | Reset the filters |
   | `aboutData` | Об этих данных | About this data |
   | `eqLineF` | Улучшения и уникальные | Upgrades and uniques |
   | `EQ_LINE.line` | Есть улучшение | Upgradable |
   | `emptyBoth` | Нет совпадений с «%q» среди фильтров: %v. | No match for "%q" with these filters: %v. |
   | `emptyQuery` | Нет совпадений с «%q» в названиях и описаниях этой таблицы. | No match for "%q" in the names and text of this table. |
   | `emptyFilters` | Ничего не подходит под фильтры: %v. | Nothing fits these filters: %v. |

   The mock's cause names the table's noun («Нет оружия с ...»). A Russian
   noun needs the genitive plural for each of the 19 tables, so the cause
   names no noun: a named departure from the mock, the same facts. No new
   plural form: «Показано %n из %m» takes the total as a number, the count is
   not inflected. `clearSel`, `selectAll`, `outOf`, `resetAll` keep their text.
   `subTables` and the short-form keys leave both languages in this batch;
   `anyValue` leaves when `FilterBar` goes (batch 9).

### Gate cost

Section 8, row 3: 55-65 min of extra gates on top of the 45-60 min of a code
batch. Wave 2 lands after batch 7 (section 16), not after this batch.

## 11. Standing checks for the plan

1. Scale: each batch from 2 on writes its States table at its refresh, with
   rows at the limit, one past it (the refusal) and at 3x the default for each
   `limit_defaults` cap (a validator constant has no 3x row). The limits the
   changed screens draw: the list caps (100 entries, 50 lists), the homebrew
   caps (100 items, 20 sources, 30 sections, and 100 cards: rule 1's «2 карты
   из 100»), the seven supplements and nine roll modes (plan review N16).
   Sticky regions to measure: the header at 360 and 1180
   (batch 2), the filter sheet at 360 with the keyboard open (batch 3), the
   dialog's fixed bar (batch 4), the editor's fixed bar (batch 6). The
   supplements menu at 360 holds seven items in about 270 px
   (`R/roller-supmenu__360__ru.png`).
2. Error scenarios: the redesign adds no write path. Batch 2 keeps the toast
   priority rules of `FEATURES.md` "Chrome" and fixes D121; batch 6 keeps the
   conflict state (A30); batch 9 keeps the list save, undo, limit and request
   states; each batch names load, failed read, failed write, offline, conflict,
   deleted record, stale tab and revert for its screen. The last roll section
   (batch 2) is memory per tab and loses nothing.
3. Consistency: rule 4 (one name) drives the job, the mode chip and the H1,
   with one departure (the job «Бросок», a group of nine pages, batch 2); rule 9 (the primary action
   first) drives the item and editor bars; rule 11 drives «Закрыть» on sheets;
   rule 20 drives D121 and every control that removes itself. The empty-state
   and error-page patterns give every load, empty and error state one shape.
4. RU/EN parity: the R states exist in EN for every batch mock (section 9);
   every new string has both languages and the same facts; P5, P6, P7, D11,
   D15 and D16 close named gaps; the EN wordmark is the header only.
5. New pressed and open states: each gets an `inventory.js` entry, a golden in
   RU and EN and an axe case in the same change. Known: batch 1, the neutral
   pressed `Seg` (a component case only; `aria-pressed` is unchanged, so no
   inventory state); batch 2, the «Дополнения ▾» menu and the account menu
   with its chevron and its lit state; batch 3, the neutral pressed `Chip`
   («Все»), the filter sheet, the table picker, the «Ещё» menu, the 768 px mid
   band and the selection mode; batch 4, the «Ещё» menu and the bottom sheet; batch P, the `/p/` «Ещё» menu and the one-card-per-row preview at 360 (QP.6); batch 8, the
   add-to-list menu; batch 9, the note switch, the list «Ещё» menu and the
   `/s/` selection mode.

## 12. Risks, assumptions, deferred

- Assumption: the package declares `'Source Sans 3 Variable'` and its italic
  carries Cyrillic; batch 1 step 2 reads and checks both.
- Risk: the font CSS passes the bundle budget; batch 1 step 8.
- Risk: the navigation change confuses returning users; both rule sets stay one
  click away, each supplement two, and every address works.
- Risk: batch 9 is the largest batch; its refresh lists the review order (the
  list page, then the shared page) for the batch review.
- Risk: the owner's mock notes move a batch's scope; a change stays in the
  batch that owns the screen; only a public-contract change or a new route and
  filter set adds a batch.
- Risk: the task branch lives across three waves; each dispatch merges `main`
  first, and after each wave the branch merges the squash commit back
  (section 16).
- Risk: production shows a mixed system between waves (gold default chips
  beside neutral switches after wave 1; the old list and print pages after
  wave 2). Accepted by the owner when a planned later batch removes each mix
  ("Interim mix between waves").
- Deferred: the link-preview
  Worker's card images (`tools/share-card.mjs`); a Golos Text trial; the EN
  `<title>`, manifest name and `en/index.html` wordmark.
- Risk: batch P moves every print measurement that `tests/app/print.js` and
  `FEATURES.md` "Print" pin; with QP.2 the sheet geometry moves too. Its
  refresh lists each pinned figure with its new value from the catalog
  measure, and its batch review reads the figures against the PDFs.
- Risk: a self-hosted print face makes the fit depend on a font load (QP.1);
  the fit after `document.fonts.ready` and the waiting print button are the
  guard, and an offline tab prints in the fallback with its clip count.
- Risk: batch 3 is the widest UI batch of wave 2 (a port, six new components,
  about 56 catalog goldens and the browser suites that read the filter pills
  and the tick column); section 10 orders the review (the selection model, the
  filter panel, the navigation, the rows, the contract reader, the prose) and
  re-seeds the goldens locally.
- Risk: a usage wrap-up stops batch 3 mid-batch; the step ids S1-S15 of
  section 10 let a fresh implementer continue from the progress line.
- Risk: between waves 2 and 3 two filter forms (`FilterPanel`, `FilterBar`) and
  two selection bars (`SelectionBar`, `BatchBar`) exist; batches 6, 8 and 9
  remove the old ones (decisions D2 and D3, accepted by the interim-mix rule).

## 13. Owner questions

Answered (owner, 2026-10-29, `context.md` "Plan refresh answers", "Plan
review answers" and "Mock answers"):

- Q1: download `SourceSans3-Regular.ttf`, `SourceSans3-Semibold.ttf` and the
  OFL `LICENSE.md` from github.com/adobe-fonts/source-sans, release 3.052R,
  `TTF/`, into `tools/artwork/fonts/` (batch 1 step 9a).
- Q2: the share cards on the one page ground, gold on the star only,
  «DAGGERHEART» in `--muted2` as the header's brand line (batch 1 step 9c).
- Q3 and plan review B3: American spelling everywhere, the whole sweep in
  batch 2 (no batch 2b), code comments, test titles and `.claude/hooks/`
  included; kept only identifiers and stored values, the frozen
  `schema/*.json` wording, and quotations and records, each named in the
  decision file (section 7, batch 2).
- Q4 and plan review B1: keep E5, E6, E8 and E9, recorded as kept exceptions
  in batch 10 (`.claude/README.md`, plan review N14).
- Mock 1: approved.
- The no-picture state: the kind glyph everywhere, print included, and the
  three placeholder files deleted (batch 1b; a public contract change and a
  print change, both with the owner's yes).
- The page ground: `linear-gradient(180deg, var(--bg2) 0, var(--bg) 520px)`
  in place of the radial washes, the share cards included (batch 1).
- Q1.1: the share card text stays, with "armor" in EN.
- R3: the account menu in the `FEATURES.md` order, no counts (batch 2).
- R7: «Бросок» opens the last roll section of this tab, else the start
  section when it is a roll section, else `/roll/std` (batch 2).
- Q3.1 (C1): the tables help panel is renamed «Об этих данных», three data
  notes (batch 3).
- Q3.2 (C57): the grid/table choice is temporary, in its own control, with no
  note (batch 3; batch P applies it to `/p/`).
- Q5.1 (C38): the roller help panel is renamed «Где какая редкость», the
  book's four placement lines (batch 5).
- Q6.1 (A27): the homebrew help panel goes (batch 6).
- Q6.2: the editor's eight field «?» buttons go (batch 6).
- Q8.1: the `/lists` «Справка» panel goes (batch 8).
- Q9.1: the list page's inline «?» buttons go (batch 9).

- Q1b.1 (owner, "Print answers"; M1b-1): the black-and-white card stays as
  it is; the colour print card's no-picture well is `#ebe7f0` with the glyph
  in `#3a3350`, a named departure from Figma node `714-42387`, which leaves
  that area blank; the screen keeps the dark well (batch 1b).
- Q1.1 confirmed: today's share card text, with "armor".

Batch P (`mocks/P/index.html`), all answered (owner, 2026-10-29, `context.md`
"Print batch answers" and "Mock P answers"):

- QP.2 the standard card is 63.5 x 88.9 mm (nine on A4, 7.75 mm side and 13.15
  mm top and bottom margins); QP.3 the compact card stays 44 x 63 mm (it fits
  Mini European sleeves with about 5 mm spare in length, not Mini American
  ones); QP.4 the rules text starts at 4.0cqw standard (7.1 pt) and 4.6cqw
  compact (5.7 pt); QP.5 the Figma node's left-aligned name and pill tags stay.
- QP.1 the print face is Source Sans 3. The Core Set card pages (PDF pages 27
  and 330) use Questa Sans and Eveleth Clean; both fail self-hosting and
  Cyrillic; Overpass was not compared. Measured over the catalog (RU, standard
  colour): today's stack 11 cards below the base, art median 63%, 10 without
  art, 11 names on three lines; Source Sans 3 10, 66%, 10, 4. Accepted
  trade-off: the sheet fits again when the face has loaded, and a tab offline
  with no cached face prints in the fallback.
- QP.6 `/p/` at 360 shows one card per row at the column width, with «Лист N
  из M» / "Sheet N of M" before each later sheet; print output does not
  change.
- QP.7 the short switch labels «Цвет» / «Ч/б» and «63×88» / «44×63» on `/p/`,
  in the editor's print view and in the account defaults; the EN colour label
  is "Color" after batch 2.
- QP.8 a card whose picture gives way keeps the ladder order, drops the blank
  paper band (the padding takes the black-and-white 5.8cqw) and fits its text
  again from the base in the whole card. Measured: in Source Sans 3, 10 RU and
  1 EN standard cards, 17 RU and 8 EN compact cards give their picture way.
- RP-1 (round 2): the `/p/` primary reads «Напечатать» / "Print".

- Q-W1 (owner, 2026-10-29, `context.md` "Wave squash content"): `issues/57/`
  goes onto `main` with each wave squash (about 1094 files, 134 MB, mostly
  mock PNGs); the closeout deletes it there. The owner took the alternative,
  not the recommendation to leave it out; section 16 follows.

Open, with a default taken while the owner is away (batch 3 refresh,
2026-10-30; each is logged in the owner-AFK decisions file and reversible):

- Q3-S: the bar's «Все» ticks every row drawn on the catalog page, and the
  per-section «Выбрать все (N)» strip goes (section 10, D5). Current: each
  section of a sectioned table has its own select-all strip, always visible.
  Proposed: one «Все» in the bar, shown in the selection mode, on every device;
  to tick one tier, pick that tier's chip first. Recommended: as built; the
  mock draws no section strip, and one control beats several. Trade-off: one
  extra step to tick a single section.
- Q3-T: the 1180 px equipment column table of mock 3 is not built (section 10,
  D6). Current: rows at every width. Proposed by the mock: a five-column table
  for the three equipment tables from 761 px. Recommended: defer; the same
  four facts are in each row's stat line, and a second body would double the
  tick, anchor and grid code for three of nineteen tables. Trade-off: the GM
  laptop view does not compare weapons by column. If the owner says yes it is
  one added item with its own mock check.

Settled, not asked again: the batch 9 merge is 9a + 10 (section 7, the
evidence); the shell is batch 2 (foundations first); D121 is batch 2 and D116
batch 8.

## 14. First-screen rule

Owner, 2026-10-29 (`context.md`, "First-screen rule"): at 360x640 and
1180x720 each page's primary content starts inside the first screen, and the
controls above it take at most about 40% of the height (256 px at 640, 288 px
at 720). How each page meets it is the planner's recommendation per page and
width.

The rule (DESIGN.md "Layout", "The First-Screen Rule", written by batch 1):
the primary content of a route starts no lower than 40% of the viewport
height at 360x640 and at 1180x720, in RU and EN, at scroll 0, with the header
counted as a control. Primary content per route: the first roll result (roll
pages, after a roll), the table (its first section head or row, `/tables/*`), the item (`/i/`,
`/h/`), the first result (`/search`), the first settings panel (`/account`),
the sheet (`/p/`), the first item row (`/homebrew` tabs), the first form field
(`/homebrew/<id>`), the first list card (`/lists`), the first entry
(`/lists/<uuid>`, `/s/<token>`).

The check (batch 1 adds it):

- Each page marks its primary content with one `data-primary` attribute on
  the element named above, fifteen in all (plan review R2): the result
  container of each of the four roll panels that `App.svelte` mounts
  (`StdPanel`, `AltPanel`, `RollPanel`, `PickerRollPanel`), the `TablesPage`
  rows, the `ItemPage` and `RecordPage` card, the `SearchPage` results, the
  `AccountPage` first panel, the `PrintPage` sheet, the `HomebrewPage` rows,
  the `HomebrewEditor` form, the `ListsPage` cards, the `ListPage` entries and
  the `SharedListPage` entries.
- A case in `tests/app/states.js` ("primary content starts in the first
  screen") opens one inventory state per route family through `driver.js`
  (`/roll/std`, `/tables/eq_weapon`, `/i/ci1`, `/search` with results,
  `/account as gm1`, `/p/<set> as gm2`, `/homebrew as gm3`, the editor as gm1,
  `/lists as gm1`, `LIST_A as gm4`, `/s/player-token-1`), at 360x640 and
  1180x720, RU and EN. A roll is random and has no golden state, so on a roll
  route the case types a value in the number field (a deterministic result)
  instead of a roll; it adds no inventory state. After `document.fonts.ready`
  and the page's load state, it calls `scrollTo(0, 0)`, waits two animation
  frames, reads the top of the first `[data-primary]` with a nonzero height
  and asserts it is at most `0.4 * innerHeight`. Zero matches fail with the
  route name, so a load failure cannot pass.
- Design target (plan review R2): every section 14 fix aims at 240 px at 640
  and 270 px at 720, so a few pixels of face or line-box difference (the mocks
  render Source Sans Pro, the app Source Sans 3 Variable) do not fail the 0.4
  assertion. The roller, the list page and the shared page (estimates at the
  limit) re-fold to that target at their mocks.
- Longest names (plan review R2): one more row per route whose H1 is a user's
  name (`/lists/<uuid>`, `/s/<token>`, `/homebrew/<id>`), at its longest-name
  state (for example `#/homebrew/sets ~ long name as gm4`; a missing state is
  added with its inventory entry and golden by the batch that owns the
  route). That batch meets the rule there, or names the exception (for
  example an H1 clamped to two lines) to the owner.
- A table in the case, `FIRST_SCREEN`, lists each route family by its
  inventory state with a `shipped` flag (since `80872b35`; no batch id, which
  `main` would carry, `reviews/1.md` N7). A row with `shipped: false` is
  measured and logged, not asserted; the batch that brings a route under the
  rule (the batch list below) sets its row to `shipped: true`, and batch 10
  leaves no `shipped: false` row. Waves 1 and 2 reach `main` with logged rows;
  that is accepted (owner, "Interim mix between waves"), because the later
  batches assert them.
- Named exceptions (owner, 2026-10-29): `/roll/std` at 360 (variant A, the
  first result at about 325 px; batch 5) and `/lists/<uuid>` with requests at
  360 (the folded requests strip, about 292 px; batch 9). Each is a row with an
  `exception` limit in px at 360 only, set from the owner's figure; the row
  is asserted against that limit at 360 and against the 0.4 rule at 1180, and
  DESIGN.md "The First-Screen Rule" lists both exceptions with the owner's
  date. If the built page measures past the owner's figure, the batch names
  the measured value to the owner before it moves the limit. Batch 5 adds a
  second roll row in another mode (asserted at the rule; the `AltPanel` or
  `RollPanel` deterministic first result is that refresh's choice,
  `reviews/1.md` "Deviations"); batch 9 adds the row with requests beside the
  `LIST_A as gm4` row without them.
- Cost: about 50 page loads, about 70-100 s added to `app/states`.
- The mock step measures each batch mock the same way with
  `issues/57/mocks/measure.mjs` (plan review N6: the top of the primary
  element below the top of `header.top`, both viewports, RU and EN).

One place for each list control (plan review R3), on every list surface (the
catalog, `/homebrew`, `/lists`, `/lists/<uuid>`, `/s/`), at both widths:

- «Выбрать» / "Select" sits at the right end of the collection's head row
  (the row that holds the count). It never goes into «Ещё» / "More" and never
  joins the primary action's row.
- The search sits first in the row under the page head, beside «Фильтры · N»
  / "Filters · N" at 360; it is never inside the filter sheet.
- The view switch (grid or table, a choice for the visit, Q3.2) stays its own
  control in the section head beside the count; it never goes into «Ещё».
- One count per collection (rule 1): the count sits at the head of that
  collection. On `/homebrew` the H1 picker shows the tab's name only
  («Предметы ▾» / "Items ▾"); the tab's count sits in its collection head,
  not in the picker and not in a group head.
- Mocks 3, 6, 8 and 9 draw these places; `mocks/3/` owns the row and the
  selection mode (R9), and the dependent unit B states follow it. A mock that
  cannot meet the design target with them names the departure and its
  reason to the owner.

Measured on the batch mocks (2026-10-29, `mocks/<N>/state.html?s=<state>`,
RU / EN; limit 256 at 640 and 288 at 720):

| Mock / state | Primary content | 360x640 | 1180x720 | Recommended fix (batch) |
|---|---|---|---|---|
| 1 | share cards and the specimen: no page | n/a | n/a | - |
| 2 / `header` (roll page head) | content under the header and the mode row | pass, 176 / 176 | pass, 116 / 116 | - (2) |
| 3 / `catalog` | first table row | pass, 233 / 249 filtered (round 5) | pass, 269 / 269 | Built by batch 3 as drawn: at 360 the picker row, the search row and, only while narrowed, the count line; at 1180 the head row, the tabs and the search row beside the filter column. Asserted by two `FIRST_SCREEN` rows (`#/tables/eq_weapon` and its two-filter state) at the limit 256 / 288; target 240 / 270 (3) |
| 4 / `item` | the item | pass, 133 / 133 | pass, 85 / 85 | - (4) |
| 5 / `roller` | first roll result | fail, 971 / 877 (below the fold) | pass, 234 / 234 | At 360: the five dice are one row of 44 px buttons (the rarity is on the result cards, C38); the results follow the dice row; the number field, the source and type rows and the pin fold below the results into «Настроить бросок» / "Set up the roll"; the H1 is visually hidden, because the lit mode control and the job show the same name (rule 4). About 254, at the limit; re-folded at mock 5 to the 240 target (R2). (5) |
| 6 / `homebrew-items` | first item row | fail, 591 / 555 | fail, 347 / 347 | At 360, as the catalog: the H1 names the tab and opens the four tabs with their counts («Мои предметы · Предметы 9 ▾»), with «Ещё» (import, pin) on its row; the picker shows the tab's name only («Мои предметы · Предметы ▾» / "My items · Items ▾"); one row holds the search and «Фильтры» / "Filters", «Новый предмет» / "New item" sits on the head row with «Ещё», and the collection head holds the tab's one count and «Выбрать» (R3, rule 1). About 241 before the R3 places; re-measured at mock 6 against the 240 target. Alternative: four tabs in one row, about 290 (45%), a named departure. At 1180 the tabs stay a row, and the head row holds the H1, «Новый предмет» and «Ещё»; the search row sits beside the filter column. About 230. Rule 9's import departure is rewritten: import moves into «Ещё». (A28 changes form: the owner sees it at mock 6.) (6) |
| 6 / `editor` | first form field | fail at the margin, 264 / 264 | pass, 220 / 220 | The back link joins the H1 row as a breadcrumb. About 234. (6) |
| 7 / `search-results` | first result | fail, 343 / 343 | pass, 254 / 254 | At 360 the H1 and the count share one line, and the type chips become one «Вид: все ▾» / "Kind: all ▾" control beside the field (a menu of the five). About 225. (7) |
| 7 / `account-settings` | first settings panel | pass, 177 / 177 | pass, 129 / 129 | - (7) |
| 7 / `print-preview` (moves to `mocks/P/`) | the sheet | fail, 455 / 409 | pass, 267 / 267 | Mock 7 drew «Назад» and the H1 on one row, then the primary «Отправить на печать» and one «Настройки листа ▾» / "Sheet settings ▾" menu; batch P keeps the two switches visible instead (Q3.2, plan review R3) and moves «Ссылка на набор» into «Ещё»; the lead and the background-graphics hint go under the sheet; at 360 one card per row (QP.6). Re-measured at mock P against the 240 / 270 target. Today's built page: 529 / 529 at 360, 350 / 350 at 1180 (`audit.md`, PR4). (P) |
| 8 / `lists-index` | first list card | fail, 469 / 469 | fail, 343 / 343 | «Новый список» becomes a primary button in the head row that opens the name field in place (rule 8: «Новый <noun>» opens a create form); «Импорт из файла» goes into «Ещё»; the collection head holds the count and «Выбрать» / "Select" (R3). About 211 at 360, 155 at 1180. (8) |
| 9 / `list` | first entry | fail, 514 / 514 | pass, 159 / 159 | At 360 the side column becomes a head: the name, «Поделиться» and «Ещё» (Печать, notes, delete) on one row, the meta line, one row with «Бросить по списку» / "Roll from the list"; the entries' head holds the count and «Выбрать» (R3); the price switch and the list notes move under the entries. About 256 before the R3 places, at the limit; re-folded at mock 9 to the 240 target (R2). (9) |
| 9 / `shared-player` | first entry | fail, 413 / 413 | pass, 287 / 287 | At 360 «Копия в мои списки» / "Copy to my lists" keeps its own row; the entries' head holds the count and «Выбрать» (R3); the player note becomes a «Заметка для игроков ▾» / "Note for players ▾" link on the lead line that opens it in place. About 247 before the R3 places; re-measured at mock 9 against the 240 target. At 1180 it passes by 1 px; the same fold gives margin. (9) |

The estimates are sums of the mocks' own row heights and gaps; each batch
mock re-renders with its fix and is measured again before the owner sees it.
The re-renders that follow from this table: `mocks/3/` (`catalog` and its
states), `mocks/5/` (`roller`), `mocks/6/` (`homebrew-items`, `editor`),
`mocks/7/` (`search-results`), `mocks/P/` (`print-preview`), `mocks/8/` (`lists-index`),
`mocks/9/` (`list`, `shared-player`).

FIRST_SCREEN batches: roll pages 5 (the header part 2), tables 3, item 4,
search and account 7, print P, homebrew and the editor 6, `/lists` 8,
`/lists/<uuid>` and `/s/` 9.

## 15. Batch P - Print (outline)

Owner, 2026-10-29 (`context.md`, "Print review" and "Print feel"): a print
audit, then a print mock the owner confirms, then this batch with the print
checks (after 1b by its mock; in wave 3, after batch 9, by the release
order). The product law holds: nine cards on A4 or sixteen on the
compact sheet, colour and black-and-white as two layouts, the fit measured in
the browser. Inside the card, fonts, type sizes, spacing, art and stat blocks
may change; each departure from the Figma nodes is named for the owner's yes.
The cards keep the feeling of Daggerheart cards; the Core Set PDF is a style
reference only (hierarchy, type feel, banners, stat blocks, density), and
nothing from it enters the repository or a mock.

Owner answers (2026-10-29, `context.md` "Print batch answers"): QP.2 the
standard card is 63.5 x 88.9 mm; QP.3 the compact card stays 44 x 63 mm;
QP.4 the rules text starts at 4.0cqw on the standard card (7.1 pt) and at
4.6cqw on the compact card (5.7 pt); QP.5 the Figma node's left-aligned name
and pill tags stay. Mock P is drawn now from the pre-batch-1 build; only the
no-picture well waits for batch 1b.

Mock P answers (owner, 2026-10-29, `context.md` "Mock P answers"; section 13):
QP.1 Source Sans 3; QP.6 one card per row at 360; QP.7 the short switch
labels; QP.8 the band drops. RP-1: the primary reads «Напечатать» / "Print".
No design question is open; the later owner decisions for this batch (the
bottom line, the burden hands, the card size in `CLAUDE.md`) are its lines in
section 7, "Batch P". Read every «Отправить на печать» / "Send to printer" and
EN "Colour" below as «Напечатать» / "Print" and "Color"; the refresh rewrites
those lines.

Findings (`audit.md`, "Print audit (2026-10-29)"): PR1 (compact colour text
4.3 pt), PR2 (standard colour text 6.2 pt under the reference's 7 pt, art 66%
against 49%), PR3 (the print face depends on the machine), PR4 (`/p/` fails
the First-Screen Rule; C29, C30), PR5 (the tier word at 4 pt), PR6 (list
markers), PR7 (line pitch, verify), PR8 (art on long texts: keep the ladder
order), PR9 (card size), PR10 (the name and tags: keep), PR12 (the bar notes;
C29, C31). PR11 is batch 1b's.

What may change, by part of the card (recommended options):

| Part | Today | Proposed | Departure from the Figma nodes |
|---|---|---|---|
| Face | `var(--ui)`, the reader's installed face (Segoe UI on this host) | Source Sans 3, the self-hosted UI face; `--print-ui` goes and the card reads `--ui` again (one token, no near-duplicate), QP.1 | yes: the nodes are set in their own face; named |
| Rules-text base | 3.5cqw on both sheets (6.2 / 4.3 pt) | 4.0cqw standard (7.1 pt), 4.6cqw compact (5.7 pt) (owner, QP.4); black and white grows from the same base to today's 5cqw cap | yes: the node's text size; named |
| Ladder | 3.5 to 3.0cqw, the padding 23 to 8cqw (colour) or 5.8 to 3cqw (black and white), then to 2.6cqw | unchanged below the base: base to 3.0cqw, the padding, then to 2.6cqw | no |
| Paper floors | labels 4.5 pt, values 5 pt, the tier word 4 pt | the tier word takes the 4.5 pt label floor (PR5); the others stay; the named compact shortfalls are re-measured in the new face | yes for the tier word; named |
| List marker | the default disc (a speck at 6.2 pt) | an en dash in black (mock P), PR6 | no: the node has no list |
| Line pitch | PR7: measured in mock P, the line pitch is even (10.41 px on `voa2_a3`); each list item adds the 1 px `li` margin, and the jitter in the 300 dpi rasters is raster rounding (32.5 device px a line) | unchanged; PR7 closes with no code change | no |
| Art | the square art region; the text takes what it needs, the art the rest; a card whose art gives way keeps a blank band of paper at the top | the ladder order stays; a colour card whose art gives way drops the band (padding 5.8cqw) and fits its text again from the base (QP.8, recommended, drawn in mock P) | no: the node has no card without art |
| Name and tags | left, 5.8cqw 900 capitals; pill tags | unchanged (owner, QP.5) | no |
| Card size | 63 x 88 and 44 x 63 mm | 63.5 x 88.9 on A4 with 7.75 mm side and 13.15 mm top margins (owner, QP.2); 44 x 63 kept (owner, QP.3) | yes for 63.5 x 88.9; named |
| Black and white | top-aligned, no art block, text grows to 5cqw | unchanged apart from the base, the face and the floors (owner, Q1b.1) | no |

The fit with a self-hosted face (QP.1): `fit()` runs synchronously after
render and never awaits a font. With Source Sans 3 the sheet fits again when
the face has loaded: `PrintPage.svelte` (and `PrintPreview.svelte`) re-run the
fit of every card once `document.fonts.ready` settles after the page opens,
and `/p/` preloads the face. «Отправить на печать» / "Print" waits for that
fit (disabled with its existing busy state until then). The browser suite
waits for the fit as it waits for the sheet today. A tab opened offline with
no cached face fits and prints in the fallback; the clip count says what it
cuts, as today.

The `/p/` page (C29, C30, C31, PR4, PR12; the First-Screen Rule):

- Primary content: the first sheet (or, at 360 with QP.6, the first card).
  Design target 240 px at 640 and 270 px at 720 (section 14); today 529 and
  350.
- The bar (mock P): «Назад» / "Back" and the H1 on one row; the two switches
  stay visible controls for the visit (Q3.2, plan review R3), never inside a
  menu, on one row with short labels (QP.7: «Цвет» / «Ч/б», «63×88» /
  «44×63»; EN "Colour" / "B&W"); at 1180 the primary «Отправить на печать» /
  "Send to printer" leads that row and «Ещё» / "More" (holding «Ссылка на
  набор») ends it; at 360 the primary and «Ещё» sit in a fixed bottom bar,
  as the item sheet's (batch 4). The sub line (cards, sheets, size) moves
  under the sheets, and each sheet from the second has «Лист N из M» /
  "Sheet N of M" above it (at 1180 every sheet). `mocks/7/`'s «Настройки
  листа ▾» menu is not built, because it hides the temporary choice.
- First screen, measured in mock P (`mocks/P/first-screen.jsonl`): today the
  sheet starts at 529 px at 360x640 and at 350 px at 1180x720 (RU and EN);
  proposed, 248 at 360 (limit 256, 8 over the 240 target) and 271 at 1180
  (limit 288, 1 over the 270 target). The batch reaches the target by the
  page's top padding or the batch 2 header, and names the outcome.
- The A4, orientation and margin sentence goes (`@page` sets them); the
  background-graphics hint moves under the sheet. `KeepNote` leaves the print
  bar (C31); the switches show the visit's choice themselves.
- At 360 (QP.6, recommended): one card per row at the column width, with «Лист
  N из M» / "Sheet N of M" between sheets; print media and every width from
  600 px draw the sheets as today.
- The not-found and retired-link pages keep their wording for batch 7's
  error pattern.

Mock spec: drawn and answered (`mocks/P/index.html`; the spec is at `git show
5d9aefbc:issues/57/plan.md`, section 15, "Mock spec"). Its tools stay in
`mocks/P/tools/` for the catalog measure.

Files expected (outline; the refresh names every edit): `PrintCard.svelte`
(the face, the base and grow start per sheet, the tier floor, the marker, the
line pitch); `PrintPage.svelte` and `PrintPreview.svelte` (the fit after the
face loads, the bar, the notes, the 360 preview); `PrintSwitches.svelte` if
the switches change form; `KeepNote.svelte` callers; `tokens.css` (the
`--print-ui` token goes with QP.1); `app/src/lib/print.ts` (`sheetScale` and
the sheet geometry with QP.2); `dict.ts` (the bar sentence, the subtitle with
QP.2, «Лист N из M», the switch labels with QP.7; both languages);
`AccountPage.svelte` (the default switches take the QP.7 labels); `FEATURES.md` "Print" (every figure and
each departure with its date); DESIGN.md "Signature component: the print
card" and "Overview" (the identical-print sentence becomes true); a
`docs/decisions/` file that amends the 2026-09-23 decisions ("Print card small
text ..." and "The compact sheet ..."), then `node tools/decisions.js`;
`tests/app/print.js` (the measured figures, the face wait, the geometry with
QP.2, the marker and pitch checks); `printPage.test.ts`; `tests/app/states.js`
(the `/p/` `FIRST_SCREEN` row asserted); the `/p/` inventory states and their
goldens (the bar's text moves; CI's golden text or the shard).

Acceptance (outline; each a line of the expanded batch):

- Each of PR1-PR10 and PR12 has its outcome: fixed as the owner chose at mock
  P, or kept with the owner's answer.
- C29, C30 and C31 (from batch 7) are fixed as section 7, "Batch P" states.
- The catalog measure, run on the built batch in both languages and all four
  layouts, gives the figures that `FEATURES.md` "Print" states, and the
  handoff records them.
- No catalog card is clipped; the smallest rendered text is at its floor or a
  named shortfall.
- The print card is set in the face the owner chose, on every machine the
  suite runs on, and the fit runs after the face has loaded.
- The `/p/` row of `FIRST_SCREEN` is asserted and passes at 360x640 and
  1180x720, RU and EN.
- `FEATURES.md` "Print" names each Figma departure with its date; DESIGN.md
  and the decision file match.
- `tests/app/print.js` passes; every `card/*.svg` path is unchanged
  (`CONTRACTS.md` section 5), and only the four burden files take new bytes
  (the node's hands).

Standing checks:

1. Scale. States:

   | State | Shows | Proof |
   |---|---|---|
   | empty set, one card, nine, sixteen, 180 (the cap), 181 pressed (the refusal toast) | the sheets, or the "nothing to print" page; the cap toast unchanged | `tests/app/print.js` (`MAX`), `printPage.test.ts` |
   | the longest rules text (`voa2_a3`, 847 RU characters) and the clipping fixture | the ladder from the new base; the clip count names the fixture | print suite, catalog measure |
   | the longest names (`cm26`, `f60`, `hi62`, `ci81`, with ` ×99`) | at most three lines (`FEATURES.md` cap) | `nameLines` in the print suite |
   | a no-picture record and a broken picture | the light well with the glyph (batch 1b) | print suite |
   | `/p/` at 360 and at 1180, RU and EN | the first sheet or card inside the first screen | `FIRST_SCREEN`, `sweep.js 360` and `1180` |

   No collection or cap changes. At 360 the primary action «Отправить на
   печать» is first in the row under the head; no sticky region grows.
2. Error scenarios: the face fails to load - the fallback face, the fit of the
   fallback, the clip count as today; a failed set read, a deleted homebrew
   card, an expired set - unchanged pages and notes (`FEATURES.md` "Print");
   offline - the cached face or the fallback; a stale tab - the old bundle
   prints with its old sizes; a revert - the previous card returns, nothing
   is stored (the switches are visit memory, the defaults in
   `dhloot.prefs.v1` keep their shape). No stored data or key changes.
3. Consistency: rule 9 (the primary action first) on the bar; rule 19 (the
   warning box) for the clip note; the temporary choice where it is made
   (Q3.2); one name for the print action across the pick row, the selection
   bar and the list toolbar (rule 4), unchanged. Departures: the compact card
   is no longer the standard card at 70% (QP.4), named.
4. RU/EN parity: every changed string in both languages with the same facts
   (the subtitle, «Лист N из M» / "Sheet N of M", the bar's labels); the
   catalog measure runs in both languages; the EN `printColor` is "Color"
   after batch 2's spelling sweep, which ships before batch P (the waves), so
   batch P's new labels are American ("Color" / "B&W").

Gates: `rtk npm run check:fast`; `node tests/run-all.js
app/print,app/states,stub`; `npm run check:built`; the catalog measure;
push and CI credit; a batch review (the Figma departures, the print figures).
Cost: section 8, row P.

Risks and do-nots:

- Do not change the sheet counts, the colour and black-and-white split or
  the browser-measured fit (product law).
- Do not copy anything from the Core Set PDF into the repository or a mock.
- Do not delete or rename a `card/*.svg` (`CONTRACTS.md` section 5); a new
  vector is an addition with its own file. Re-export only the four burden
  files, from the Figma nodes (owner, "Burden hands").
- `tests/app/print.js` pins many measured values; change each to the new
  measurement with its reason, never loosen a check to pass.
- The editor's print preview (batch 6's surface) follows the card
  automatically; batch P checks it renders the same card and fit.

## 16. Release waves and the post-release check

Owner, 2026-10-29 (`context.md`, "Release in three waves" with its "Reviews"
paragraph, "Interim mix between waves", "Post-release review"). This replaces
"the task reaches `main` as one squash at closeout" and the owner's screenshot
review as a gate; the batches still save their screenshot sets as evidence.

| Wave | Batches | Lands after | Production until the next wave |
|---|---|---|---|
| 1 | 1, 1b, 2 | batch 2's review and the green CI run of its tip | the new face, ramp, glyph, mark and shell; gold default chips beside the neutral switches (accepted; batch 3 and the surface batches make them neutral); `FIRST_SCREEN` rows logged |
| 2 | 3, 4, 5, 6, 7 | batch 7's review and the green CI run of its tip | the new catalog, item, roller, homebrew, search and account pages; the list and print pages as wave 1 left them |
| 3 | 8, 9, P, 10 | batch 10's review and the green CI run of its tip | the finished task |

Each wave lands by `orchestrate.prompt.md`, "Task closeout and cleanup", step
8, with these changes (owner, "Wave squash content"):

1. `claude/57` merges the latest `origin/main`; push; the CI credit for the
   tip.
2. In the main checkout: `git pull`, `git merge --squash claude/57`. The
   squash carries `issues/57/` onto `main` (about 1094 files, 134 MB);
   nothing is taken out. The main checkout's own untracked files (for example
   `issues/pistolheart/`) stay as they are.
3. `node E:/dev/daggerheart-loot/.claude/hooks/ci-credit.mjs <tip sha>`,
   commit (one Conventional Commits subject per wave, for example
   `feat(ui): land task 57 wave 1, the system, the mark and the shell`, the
   issue in the footer), push `main`, watch its run deploy with one
   background `gh run watch <id> --exit-status`.
4. Waves 1 and 2 keep the remote branch, the worktree and its
   `.env.test.local`: step 8's last sentence applies after wave 3 only.
5. `claude/57` merges `origin/main` (the squash commit) and the next batch
   starts. The merge is clean: the squash holds the same changes as the
   branch.

Who runs the squash: in a session that the owner started or is present in,
the orchestrator runs it when the table's conditions hold (the waves decision
file; no owner gate). In a session that a `USAGE RESUME` job continued, the
squash and the push to `main` wait for the owner (`orchestrate.prompt.md`,
"Resume after the reset", step 4); the orchestrator reports it and stops that
task.

No owner screenshot review gates a wave; the owner checks the live site after
each release.

After wave 3, in order (batch 10's last lines):

1. The post-release check. A fresh blind reviewer, with no plan and no
   handoff, checks production only: Source Sans 3 loads from the site (no
   fallback face); the First-Screen and Phone-First Rules on the live site at
   360 and 1180, RU and EN; Impeccable `audit` and the detector on
   production; axe on the main routes; the PWA install icon and the favicon
   (the mark); link previews in Telegram and Discord (old cached cards are
   expected for a while); one printed A4 sheet of each layout on paper (the
   owner prints). Report: `issues/57/reviews/post-release.md`. It covers all
   three waves; there is no check per wave.
2. Each finding goes to `docs/specs/DEBT.md` under the task that owes it, or
   to a named follow-up task.
3. The closeout (`/handoff`): the audit, the durable moves, `git rm -r
   issues/57` in the closeout commit, push, a docs-only CI run, and a last
   squash onto `main` with the `DEBT.md` lines and the durable moves; that
   squash deletes `issues/57/` from `main` too.

Between waves (owner, "Interim mix between waves"): an inconsistency between
batches is accepted when a planned later batch removes it; take the option
with less work and name that batch; final consistency still matters. Home:
batch 2's waves decision file.

Cost: section 8, rows "waves" and "post-release check and closeout".
