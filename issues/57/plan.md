# Plan - TASK 57

This plan orders the phase 3 batches of the UI redesign (direction R) on the
shape of `main` at `c8243ba6`. Phase 1 findings and their re-check are in
`audit.md`; facts and owner decisions are in `context.md`.

## Status

- Snapshot 2026-11-06 (tip `a8bdf1de`, CI green, the credit armed): waves 1, 2 and 2b are on `main`; wave 3 has built 9a, 8,
  9b, the batch CI split (`plan-ci.md`) and the CI fix pass. Phase 3 now runs 9a, 8, 9b, TD, N, P, 10, then the wave 3
  squash, the wave 3 blind review with its remediation, the whole-app blind review with its remediation and the closeout
  (section 16). The history of the earlier refreshes (device shares, mock answers, the plan reviews' sub-bullets, the 9a, 8
  and 9b refresh notes): `git show a8bdf1de:issues/57/plan.md`, Status.
- The plans of the rest of wave 3 are folded (2026-11-06) from the owner's decisions of 2026-11-05 (`context.md` items
  7-15 and their ANSWER and APPROVED lines; none is reopened here):
  - Batch TD = T + D + The Measure Rule in one batch (REBATCH option B; owner items 10 (approved), 13, 14, 15): brief
    `plan-TD.md`, which reads `plan-T.md`, `plan-D.md` and `plan-text.md`; mocks `mocks/T/`, `mocks/D/`, `mocks/text/`;
    cases 108-111; 44 acceptance lines; 168-230 min. Built, reviewed (`reviews/TD.md`) and fixed 2026-11-06.
  - Batch N (The Head Order Rule, the `/tables/*` exception at 761-999 px, owner item 12's d12 die marks): brief
    `plan-N.md`, mocks `mocks/N/`, cases 112-113, 17 acceptance lines, 115-150 min. Built 2026-11-06 (`handoff.md`,
    Completed); reviewed (`reviews/N.md`, fix-then-continue) and its one fix pass built the same day.
  - Batch P (print), restated for Q-P1 = no (owner: the standard card stays 63x88 mm): brief `plan-P.md`, mocks `mocks/P/`,
    cases 114-115, 30 acceptance lines, 157-197 min. Built 2026-11-06 (`handoff.md`, Completed); review pending.
  - Batch 10 (the docs lock and the cleanup the earlier batches left): an outline in section 7 with 21 acceptance
    lines; 95-125 min. Built 2026-11-06 (`handoff.md`, Completed: 10-1 to 10-19 and 10-21 have outcomes; 10-20 is
    the orchestrator's); reviewed (`reviews/10.md`, fix-then-continue) and its one fix pass built the same day. Next:
    10-20, the orchestrator's. The follow-up task's id is `57-debt` (DEBT.md section names).
  - Wave 3 is on `main` as `10011729` (merged back as `45050594`); its blind reviews are `reviews/post-wave-3.md`,
    `post-wave-3-signed-in.md` and `post-wave-3-owner-chrome.md`. Batch PW3, their one remediation batch, ships as the
    second squash S2: brief `plan-pw3.md` (owner decisions D1-D11, 40 acceptance lines, 80-115 min local). Its part C
    changes the whole-app blind review's dispatch (section 16, step 1).
  - Defaults taken while the owner is away are listed in `handoff.md`, Status, and logged by the orchestrator in
    `C:\Users\Ignat\.dhloot\notes\owner-afk-2026-11-03\decisions.md` (items 20-23 are the batch planners', item 24 is
    this fold's).
- Mocks: every batch mock is drawn ahead (section 9); with the owner away the recommended option is taken and logged.
- Release (owner, 2026-10-29, `context.md`, "Release in three waves"; "Batch 9 split"; 2026-11-04): waves 1, 2 and 2b are
  squashed; wave 3 (9a, 8, 9b, TD, N, P, 10) is squashed after batch 10's review and green CI, with no owner screenshot gate
  (section 16).
- Plan review: required before 1 (trigger: public contract changes in batch 1b - the no-picture asset paths of CONTRACTS.md - and in batch 2 - routes.json tab, llms.txt)
- Plan review coverage at the earlier refreshes (2026-10-29): no new plan review was required. Batch 2's contract set (`routes.json` `tab` and `mode`, `llms.txt` with `tests/contracts.js` and `CONTRACTS.md`) and batch 1b's (the no-picture asset paths) were reviewed by `reviews/plan-1-2.md` and `reviews/plan-1-3.md`; the later parts (light print well, waves, mark, burden hands, bottom line, first-screen exceptions) change no contract, store no data and add no write protocol.
- Plan review findings applied: reviews/plan-1-3.md
  - All 15 findings were applied before the batches they touch shipped (the report holds each id, section and change); the sub-bullets were collapsed at the batch 3 refresh (2026-10-30, last full text: `git show 65829261:issues/57/plan.md`, Status).
- Plan review findings applied: reviews/plan-1-2.md
  - All 29 findings were applied before the batches they touch shipped (the report holds each id, section and change); the sub-bullets were collapsed at the batch 3 refresh (2026-10-30, last full text: `git show 65829261:issues/57/plan.md`, Status).
- Plan review: not required (no trigger fired) for batches 3, 3b, 8, 9b and CI. None changed a `CONTRACTS.md` path, a
  `docs/fixtures/` value, a `tests/contracts.js` line or `llms.txt`, stored a new key, added a migration, a `SECURITY
  DEFINER` function or a write or sync protocol (each brief's "Plan review"). Batch CI changed `tests/run-all.js` and
  `ci.yml`: that is a batch-review trigger, not a plan-review one.
- Plan review: not required (no trigger fired) for batch TD. It changes control sizes, toast durations, borders, gaps,
  text widths and test limits only: no route, no contract (the static pages' URLs are frozen, their CSS is not), no
  stored key, no migration, no write path (`plan-TD.md`, "Writer tier, review and confirmation").
- Plan review: not required (no trigger fired) for batch N. It changes the DOM order and the look of the page heads and
  two dictionary keys: no contract (`routes.json`, `CONTRACTS.md`, `llms.txt` stay), no stored key, no write path
  (`plan-N.md`, "Gate cost, goldens, tier, review").
- Plan review: not required (no trigger fired) for batch P. The owner answered Q-P1 no (2026-11-05): the card stays 63x88
  mm, so `CLAUDE.md`, `llms.txt` and the product law do not change. The four `card/burden-*.svg` keep their paths and take
  new bytes (`CONTRACTS.md` section 5 freezes the paths); no stored key, no write path (`plan-P.md`, "Plan review").
  The `required before P` line that `plan-P.md`'s earlier fold list asked for is not written.
- Plan review: not required (no trigger fired) for batch 10. It is the docs lock plus a cleanup of the roll card's dead
  code and three roll copy rows: no contract, no stored key, no write path. P5 (`rollNo`, about 1000 generated stubs and
  `tools/share-card.mjs`) is not built here (acceptance 10-8); if the owner asks for it, the plan writes a `required before
  10` line first.
- Plan review: not required (no trigger fired) for batch PW3. It changes control sizes, the sheet's place from 761 px,
  heads, copy and the list name's element: no route, no contract, no stored key, no write path (`plan-pw3.md`, Status).
- Batch review (`orchestrate.prompt.md`, "When to run reviewer"): TD required (visual parity and changed UI on every
  route; generated artifacts: the static pages regenerate); N required (changed UI, a golden re-seed of about 145
  files); P required (visual parity and print, the four burden files); 10 required (a prompt changed:
  `.claude/prompts/review.prompt.md`; changed UI and a golden re-seed `--only` for the roll copy). Each reviewer dispatch
  names the guideline set of `context.md` item 10 (owner, 2026-11-05); one remediation pass per batch.
- NEEDS_HUMAN_CONFIRMATION: no for TD, N, P and 10; no product law changes (the print card stays 63x88 mm). Settled
  by the owner: Q3-S, Q-W1, Q-P1, N1-N4 and the 761-999 px form, items 12-15. One figure named to the owner, not a
  gate: the folded requests strip at 360x640 starts the rows at 304 px (the owner's figure was 292; review 9b B3,
  logged). Q3-T takes its default (deferred).

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
| The Two Breakpoints Rule | new steps at 760 px (the pin; a menu or a sheet; the `/p/` cards) and 1000 px (the side column) | 2 (the 760 pin), 3 (the sheet and picker below 761 px; the 1000 px filter column; the `viewport` port), 3b (the `--anchor-top` sentence, `--sticky-h`) | 4 (menu or sheet), P (print cards), 9b (1000 side column) |
| The Hidden Header Rule | new: up to 760 px the header leaves on a scroll down and returns on a scroll up | 3b | - |
| Layout (header 106 / 112 px) | 111 px sticky at 360, the mode row scrolls | 2 | - |
| Toast | a plate with the Float shadow; the error toast in dark ink on the alarm fill | 2 | - |
| Chips (7px 12px) | 40 px mode chips and dice at 360 | 2 (mode chips) | 5 (dice) |
| Filter pills | no pill row at 360; the count line names the chosen values | 3 | 6 (none at any width on `/homebrew`) |
| Shapes (dashed border = a property) | a dashed plate for every empty state | 3 | 7, 8 |
| Don'ts (no illustrated empty states) | a kind-glyph tile in the empty state | 3, unless it takes `reviews/mocks-2.md` N0-2 (drop the tile) and keeps the Don't | - |
| Seal Rule (selection neutral) and `FEATURES.md` "ticked card gold border" | ticked rows and cards lit, neutral | 3 | 6, 8, 9a (`FEATURES.md` "Lists") |
| Components (no sheet) | bottom sheets at 360 for menus, filters, the dialog, the delete confirm | 3 (the filter sheet) | 4, 7, 8 |
| Shapes, artwork (square, 420 px full card) | a 4:3 crop window on the item page, the dialog and roll cards | 4 | 5 |
| Cards, compact (132 px image) | a 96 px image at 360 | 5 | - |
| Badges (roll number) | the roll number at 1180 only; the rarity badge at 360 | 5 | - |
| Segmented control (neutral for mode toggles only) | segments with the neutral check as form-field pickers | 6 | - |
| Buttons, danger | a filled alarm red with dark text in the delete confirm | 7 | - |
| Seal Rule (gold budget) | the gold-bordered «Новое в списке (3)» chip | 8 | 9b |
| Signature component: the print card (art region) | the light well `#ebe7f0` with the glyph `#3a3350` | 1b | P |
| Signature component: the print card | 63x88 mm and 14.5 / 8.5 mm margins kept (Q-P1, owner, 2026-11-05), Source Sans 3, 4.0 / 4.6cqw, no «Daggerheart» on the bottom line | P | - |

## 5. Impeccable exceptions

Inventory on `main` `c8243ba6` (`git grep -i impeccable`, `.impeccable/`,
`.claude/`, `eslint.config.mjs`, `package.json`, `.git/info/exclude`):

| # | Exception | Where | Plan | Batch |
|---|---|---|---|---|
| E1 | `ignoreValues` `overused-font: inter` | `.impeccable/config.json` | remove: the ignore is already stale (`impeccable detect --json --no-config app/src` reports no `overused-font` while `--ui` still starts with 'Inter', plan review N1), so its removal proves nothing about the font; the font proof is `typo.js` | 1 |
| E2 | `ignoreValues` `side-tab` for `ListPage.svelte` (`value: "*"`) | `.impeccable/config.json` | its three findings are the reorder drop mark (`.lrow.drop-before`, `.lrow.drop-after`, `.lrow.drop-after .rnote`: an inset 3 px gold shadow), not the notes (plan review B2). Remove when batch 9b redraws the mark as a 2 px gold line drawn by a gap element between the rows, with every `FEATURES.md` "Lists" drop rule kept; `HitNote.svelte`'s unignored `side-tab` (N1) goes in the same batch. If no form passes the detector, a value-scoped ignore stays and batch 10 names it to the owner | 9b |
| E3 | `.prettierignore`: `hook.cache.json`, `hook.pending.json`, `config.local.json` | `.prettierignore` | remove: `.gitignore` lists all three (E5, E6 stay) and Prettier 3 reads `.gitignore` by default; `prettier --file-info <path>` proves `"ignored": true` | 1 |
| E4 | `.prettierignore`: `.impeccable/config.json` | `.prettierignore` | remove once `ignoreValues` is empty, after a proof that the hook does not rewrite the file in an ordinary session (plan review R8): one edit with the hook live and one `impeccable detect` run leave `config.json` byte-identical and `npx prettier --check .impeccable/config.json` passes. Then format the file with Prettier, or delete it if `impeccable detect` runs without it; a later `impeccable hooks ignore-value` reddens `format:check`, which makes a new exception visible. No proof: E4 stays with that reason | 9b |
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
| P | Print: the card's rules-text base, floors and markers, the print face and its fit, the line pitch; the `/p/` page (bar, switches, notes, the preview at 360, the first screen). The card stays 63x88 mm (Q-P1, owner, 2026-11-05) | PR1-PR10 and PR12 (`audit.md`, "Print audit"), C29, C30, C31 (from batch 7) | `R/print-preview` (screen); the print card has no R state, so mock P draws it at print resolution | 1b: mock P draws the light well as the owner confirmed it at mock 1b; N: `/p/` keeps no `PageHead`; TD: the bar is built on the Thumb Rule | its own route set (`/p/`, the print card, the editor's print view) with its own gate (`app/print`) and goldens, after N; split from 1b by 1b's public contract change (`CONTRACTS.md` asset paths), which P does not carry. Merged into P: the `/p/` rows of batch 7, because they share `PrintPage.svelte`, its seed sets and the `app/print` gate (`CLAUDE.md`, "merge work that shares a component, seed and filter") |
| 2 | Shell: header, three jobs with icons, the mode row and the supplements menu, the account control, the wordmark, the pin and «Справка» labels, the toast; the American-spelling sweep across the repository (owner: no batch 2b) | C6, C27, C34 (verify), C37, C47, C48, C52, A15 (verify), A27 (icons), A35, A36, A37, P7, P9, D9, D10, D11, N4, D121 | `R/header`, `R/shell-*`, `R/roller-supmenu` | none: R draws the header; the refresh adds the request toast and `/en/` | public contract changes (`routes.json` `tab`, `llms.txt`) and public spec changes (`ROUTES.md`, `FEATURES.md` "Chrome", `I18N.md`); it needs a batch review (contracts, `.claude/hooks/`, prompts and agents changed) |
| 3 | Catalog tables and filters | C1 (panel renamed «Об этих данных»), C2 («Все»), C3, C4, C5, C7, C8, C10, C12 (verify), C53, C54, C56, C57, C58, C59, A25, A40 (tables), P1, P13, P14, P15 | `R/catalog`, `R/catalog-*`, `R/pattern-empty` | none | a different route and filter set (`/tables/*`) |
| 3b | The header hides on scroll down and returns on scroll up up to 760 px, on every page; the `--sticky-h` / `--anchor-gap` focus fix at every width | F2 (B2, owner Q2), WCAG 2.4.11 (`feedback.md`, "New defect found") | none | none: `mocks/F/` draws the two positions | a different route set: the header is on every route and has no filter set; the owner ordered it as its own batch ("Header batch") |
| 4 | Record card, actions, item page, dialog, `/h/` | C17, C18, C19, C20, C21, C22, C40, C44 (verify), C45, C46, C63 (artefact, close), A23, A24, P4, P5, P6 | `R/item`, `R/item-dialog`, `R/item-nope`, `R/item-save-signedout`, `R/h-item`, `R/pattern-error` | none | a different component group and route (`/i/`, `/h/`, the dialog) |
| 5 | Roller pages and the card face on results | C23, C24, C25, C26, C36, C38 (panel renamed «Где какая редкость»), C39, C41, C43, C49, P10, P11, N2 | `R/roller`, `R/roller-alt-crit`, `R/roller-mwt` | none: the mode row in the mock is R's; batch 2 ships it | a different route and filter set (`/roll/*`) |
| 6 | Homebrew editor, homebrew pages and imports (old 5 + 6, owner merge) | A6, A7, A8, A9 (verify), A11 (artefact, close), A12, A13, A27 (panel removed, Q6.1), A28, A29, A30, A38, A40 (homebrew), D5, D14 (verify), D15, D16, editor clarity rows | `R/editor*`, `R/homebrew-*` | none: the refresh adds the Items-tab filter strip of `f74eae09` to `R/homebrew-items` | a different route and filter set (`/homebrew`, `/homebrew/<id>`) |
| 7 | Search, account, empty and error states | C13, C14, C15, C16, C32, C60, A31, A32, A33, A34, D7, D8 (verify) | `R/search-*`, `R/account-*`, `R/pattern-*` | none | different routes (`/search`, `/account`, the error pages) |
| 7b | Tags and relation lines on one rule, badges as one box, a steady head on `/tables/*`, compact roll results (`plan-tags.md`; owner's feedback of 2026-11-04) | owner feedback items 1-3, 5 and 6 (`context.md`, "Phone feedback") | none: the surfaces keep their R states | none: mocks 4, 5, 7 and `F` drew the surfaces; the rule is the owner's | the owner's wish to ship the fix before wave 3 and to start wave 3 on a clean `main` (wave 2b); it shares `RowMain`, `TableRows` and the list goldens with 9a, so those goldens are re-seeded twice (accepted) |
| 8 | Lists page `/lists`, list cards, lists import, add-to-list menu | A14, A16, A18, C35, C61, C62, D6, D20, D116 | `R/lists-*`, `R/item-listmenu` | none | a different route and filter set (`/lists`, and the add-to-list menu that the item pages open) |
| 9a | `/lists/<uuid>` and `/s/<token>` for the phone: the C1b compact row, search and filter on the owner's page, the actions into «Ещё», the list «Ещё» menu, the selection bar on both pages | F2 (C1b, D1, D-head 1), A2 (row actions), A19, A20, A21, A40 (list rows, `/s/`), A41, D2, list row clarity rows | `R/list`, `R/list-picked`, `R/shared-*` | none: `mocks/F/` replaces mock 9 for the row and the head up to 760 px; every other mock 9 state stands | the owner's wish to ship the F2 fix in wave 2 ("Batch 9 split"); split from 8 by a different route and filter set |
| 9b | The list panels: the note switch, the side column, the share, roll and requests panels, the price switch, A1 at 640-900 px, the «?» removal, the drop mark, E4 | A1, A2 (note area), A3, A4, A5, A22, A42, N1, E2 (the drop mark), E4, list panel clarity rows | `R/list-note`, `R/list-share`, `R/list-roll`, `R/list-prices`, `R/list-requests` | 9a: it draws on the 9a head and rows | the same split as 9a; wave 3, after batch 8 |
| TD | The Thumb Rule (40 px controls up to 600 px, 8-G1), the Reading Time Rule (toasts 4000 / 7000 / 10000 ms, every toast holds, 8-G4), the Drop Rule (no dashed border) with one 16 px gap above every empty plate, and The Measure Rule (leads on one line, help panels as wide as their text, notes and the footer at 70ch); the `FIRST_SCREEN` rows at 360 re-measured | 8-G1, 8-G4, 8-P1 (owner, item 10 "APPROVED"), owner items 13, 14, 15 | none: `mocks/T/`, `mocks/D/`, `mocks/text/` are the built app with the CSS injected | none | merged by `CLAUDE.md` (one component set, one seed, one gate, no golden tree moves except six headers; `plan-rebatch.md` option B). Split from 9b: every route up to 600 px, every plate state and every text block, with a re-baseline of every `FIRST_SCREEN` row at 360 that 9b's list review cannot hold; before N and P, so the head and the print bar are built on the rules |
| N | One head order on every page that draws a `PageHead` (the heading, the sibling pills, the pin, the help, the primary at the right end; the pills on their own row from 761 to 999 px), the roll `h1` «Бросок», the homebrew tabs as pills with counts, the d12 die marks of `/roll/alt` | owner items 11 and 12 | none: `mocks/N/` (`headorder/`, `tables-mid/`, `d12/`, `roll-head/`) | none | a different route set (the nine roll pages, `/tables/*` and `/homebrew` from 761 px) and its own about 145 goldens; merged with TD the review would pass one pass (about 65 files, 150 goldens) |
| 10 | Lock: DESIGN.md "Notes", detector at zero, `design.json`, re-audit, the cleanup the earlier batches left (the roll card's dead code, three roll copy rows, the case 89 audit, kept exceptions named), closeout | E5, E6, E8, E9 (record), E7, E11, N3 (rest), every row re-checked | none | no mock | docs and closeout plus a small code cleanup; follows P because it re-audits the final tree and carries the review-prompt change (a review trigger) |

Run order (owner, 2026-10-29, "Release in three waves"; 2026-11-03, "Header
batch", "Batch 9 split"; owner, 2026-11-04, "9a moves to wave 3", "wave 2b"; owner, 2026-11-05, "REBATCH option B"): 1, 1b, 2
(wave 1); 3, 3b, 4, 5, 6, 7 (wave 2); 7b, W (wave 2b); 9a, 8, 9b, TD, N, P, 10 (wave 3; T added at the 9b refresh,
2026-11-05, with D and the Measure Rule merged into it). The table keeps the old row order; section 16 gives the waves.

The list page and the shared page stay one pair (owner, 2026-10-29): 10 of the 15
components of `SharedListPage.svelte` are `ListPage.svelte`'s, and the note display,
the row anatomy and selection mode, the price display and the requests are the same
design on both. The owner's split of 2026-11-03 cuts across the work, not across the
pages: 9a takes the row, the head, search and filter and the selection bar on both
pages; 9b takes the panels on both pages. Accepted ("Batch 9 split"): about 45-60
min more, the list goldens re-seeded twice, an interim mix between the waves.

Rows cited only inside other rows go with their parent: C36, C41, C43 (5);
C40, C45, C46 (4); C47, C52, A36, A37 (2); C50, C64, A26 (1); C60 (7); C62
(8). A40 is done per surface: tables in 3, homebrew rows in 6, list rows and
`/s/` in 9a.

### Inherited acceptance lines (each is its own line in its batch)

Batch 1: done (`9a31aede`, review fix `80872b35`); `reviews/1.md`,
"Acceptance lines", gives each line's outcome.

Batch 1b: done (`reviews/1b.md`); its brief and acceptance lines are at `git show
5d9aefbc:issues/57/plan.md`, section 10 (mock `mocks/1b/`, confirmed by the
owner's answer M1b-1). The inherited
`reviews/1.md` N6 (the `#0a0810` literal on `--art-well`) is one of them.

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

Batch 3: done; its brief is collapsed in section 10 (full text at `git show
5ecca692:issues/57/plan.md`; mock `mocks/3/`, final at round 5). The owner's answers it carried: Q3.1 (the help
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
section 7. Batches 6, 9a and 8 take the selection bar as `SelectionBar.svelte`
(`BatchBar.svelte` goes with its last caller, `/lists` in batch 8) and the list
head from batch 3's decision file.

Batch 3b: its implement-ready brief and acceptance lines are `plan-3b.md`
(mock `mocks/F/`, the two header positions). The owner's answers it carries: Q2 B2
(the whole header, up to 760 px), "Header batch" (its own batch, with the focus fix).

DESIGN.md (section 4, departures): batch 3 wrote its rewrites (the list is in
section 10 of `git show 5ecca692:issues/57/plan.md`, "DESIGN.md rules this batch writes").

Batches 4, 5, 6, 7, 7b, W, 8, 9a and 9b: done. Their implement-ready briefs and acceptance lines are `plan-4.md` to
`plan-9b.md` and `plan-tags.md`; their outcomes are `handoff.md` "Completed" and `reviews/<batch>.md`; the owner answers they
carried are in `context.md` and section 13. This block was collapsed at the 2026-11-06 fold (the file passed the 150 KB
line); the earlier text is `git show a8bdf1de:issues/57/plan.md`, section 7. Every item those batches placed in a later
batch is an acceptance line of that batch below (TD, N, P, 10); the rules they wrote live in DESIGN.md, FEATURES.md and
`docs/decisions/`.

Batch TD (wave 3, after 9b; REBATCH option B, owner, 2026-11-05; the brief is `plan-TD.md`, which reads `plan-T.md`, `plan-D.md` and
`plan-text.md`; mocks `mocks/T/`, `mocks/D/`, `mocks/text/`; cases 108-111; `plan-rebatch.md` holds the options):

- Acceptance: 44 lines (`plan-TD.md`, "Acceptance"): T-1 to T-20 (`plan-T.md`), D-1 to D-14 (`plan-D.md`), MT-1 to MT-7
  (`plan-text.md`) and three placed lines: TD-P1 (6-N1, the editor row with a 120-character name at 1180), TD-P2 (the
  case 89 figure after T's folds) and TD-P3 (the 9a R2 probe: measured, not fixed, then `DEBT.md`).
- The Thumb Rule (8-G1), from the old outline with these changes (`plan-T.md` fold item 2): the floor is the box for a
  boxed control and the padded box for a text link; one token `--thumb`; the check is a hit test shared by the sweep step
  and case 109; a fourth toast class, long 10000 ms, for a toast with an email address or more than 80 characters; the
  toast floats above the selection bar; 8-P1 is the card's corner slot, a departure from mock 8's chip row; the header
  holds its height. The menu items' 44 px is already true.
- The Reading Time Rule (8-G4): plain 4000, error 7000, action 7000, long 10000 ms; every toast holds while touched,
  hovered or focused; the toast over «Ещё» is measured (case 108 (f)), not fixed (T-14).
- Batch D (owner items 13 and 14): the Drop Rule (`dashed` means "drop here", so the screen draws none), the plate on
  `--bg2` with a solid `--line` border, `--gap-plate` 16 px above every plate, the lead cap, which the Measure Rule
  replaces by `--measure-line`; the `FIRST_SCREEN` effect is about -22 px on `/search` and `/homebrew` at 1180.
- The Measure Rule (owner item 15): `--measure-line` 120ch and `--measure-text` 70ch, a help panel hugs its text, the
  derived check "One measure"; case 111 reads every class at five widths.
- The `FIRST_SCREEN` rows at 360 are re-measured before and after (`plan-T.md`, "First-screen rows"): a row past 256 px
  takes a fold or its measured exception, logged and named in DESIGN.md "The First-Screen Rule".
- Gate cost 168-230 min; writer tests 1 no, 2 no, 3 yes in part; review required; plan review not required;
  NEEDS_HUMAN_CONFIRMATION no (`plan-TD.md`).

Batch N (wave 3, after TD, before P; owner items 11 and 12, 2026-11-05; the brief is `plan-N.md`: decisions N-D1 to N-D12, steps
S1-S12, acceptance 1-17, cases 112-113; mocks `mocks/N/`; `plan-nav.md` holds the options and the first mock critique):

- Decided (owner, 2026-11-05): N1 option A with a visible `h1` on every family from 761 px (roll «Бросок» / "Roll"); N2 the
  homebrew tabs as pills with counts; N3 the head order is the heading, the pills, the pin, the help, the primary at the
  right end; N4 one rule for every `PageHead` ("The Head Order Rule"; `/lists` and `/search` already follow it); from 761 to
  999 px the pills take their own row (option A); item 12: the d12 die marks of `/roll/alt` in lines, Hope Amber and Fear
  Violet, no letter; `/tables/*` at 761-999 px is a named exception held to 336 px at 900x720 by a case (N-D5).
- Acceptance 1-17 (`plan-N.md`): the head order and the pills, the one-row head from 1000 px, the lit pill, the homebrew
  head, `FIRST_SCREEN` and `ROLL_FIT`, case 112, the goldens (about 140-150 files; `/lists` and `/search` byte-identical),
  parity, the focus across the 1000 px step, the `/tables/*` exception, the die marks (case 113), the prose, `polish` and
  `harden`, and line 17: the Deferred row on `/tables/eq_*` at 761-800 px in RU is read by case 112 (e) at 768.
- Placed in batch 10, not here (N acceptance 11): the `/roll/mwt` lead, «корника» in the `/roll/std` lead, the gold outline
  of the «ИЛИ» dividers (acceptance 10-11 below).
- Gate cost 115-150 min; writer tests 1 no, 2 no, 3 yes (a golden re-seed and the head at five widths); review required;
  plan review not required; NEEDS_HUMAN_CONFIRMATION no. It starts from TD's pushed tip and keeps `var(--measure-line)`
  when it moves `.page-sub`.

Batch P (wave 3, after N; the brief is `plan-P.md`: decisions P-D1 to P-D19, steps S1-S14, acceptance 1-30, cases 114-115;
mock `mocks/P/`, burden check `mocks/P/burden/`; restated 2026-11-06 for Q-P1 = no):

- Q-P1 (owner, 2026-11-05): the standard card stays 63x88 mm. P-D1 and P-D17 take their fallbacks: the sheet geometry,
  `PrintPreview`'s cell, `PRINTED_PX.std` and the subtitle `printSub` do not change; `CLAUDE.md`, `PRODUCT.md`,
  `README.md`, `README.ru.md`, `llms.txt` and DESIGN.md "Signature component: the print card" keep 63x88 mm. This
  reverses QP.2 of 2026-10-29. The phone preview reuses `previewScale` (no new `cardScale`; planner default, 2026-11-06).
- The inherited lines of the print review (owner, 2026-10-29, "Print review", "Print feel"), each an acceptance line of
  `plan-P.md`: PR1-PR10 and PR12 (`audit.md`, "Print audit"; PR9 closed by Q-P1), C29 (the bar holds fewer rows, the A4
  sentence goes), C30 (the preview at 360 can be read), C31 (the switches are a choice for the visit, no `KeepNote`; the
  Deferred line "`KeepNote.svelte` leaves with batch P" is placed: P-D15, acceptance 12 and 30), the retired link and
  failed read on `ErrorPage` with the gone set kept on `PageTitle` (`routes.json` `#/p/short`), the switch labels shared
  with the account (QP.7, RP-1), the `/p/` `FIRST_SCREEN` row asserted, each Figma departure in `FEATURES.md` "Print",
  the bottom line without «Daggerheart», the four burden files with fingers (paths unchanged), QP.1 (Source Sans 3), QP.4
  (4.0 and 4.6cqw; the compact floor 3.7cqw, P-D4), QP.6 (one card per row up to 760 px), QP.8 (the art gives way, the marks
  are cleared), and the lines of "Each of batches 2-9" below.
- New in the brief: the fonts port and the refit after the face loads with a waiting «Напечатать» (P-D3); `Crumb.svelte`
  as the head row of the editor and `/p/` (P-D11); the dock up to 760 px (P-D12); the notes under the sheets and «Лист N
  из M» (P-D13); the toast clears the dock (P-D18).
- Gate cost 157-197 min (`plan-P.md`, "Gate cost"); writer tests 1 no, 2 no, 3 yes (print fitting, 30-45 goldens, parity
  with Figma nodes `714-42387` and `3773-90792`); review required; plan review not required; NEEDS_HUMAN_CONFIRMATION no.
  Split criterion: its own route set (`/p/`, the print card, the editor's print view) with its own gate and goldens.

Batch 10 (wave 3, last; docs lock plus the cleanup the earlier batches left; outline, its refresh expands it; writer
tests 2 and 3: a prompt every later session runs under, and a `--only` golden re-seed; review required (a prompt changed);
plan review not required; NEEDS_HUMAN_CONFIRMATION no). Each line is its own acceptance line, and the batch is not closed
while one has no outcome:

- 10-1: DESIGN.md "Proposed rules" (written by 9b, M19) is re-checked against the shipped rules; an entry the owner said
  yes to before the closeout moves out with its batch.
- 10-2: `ignoreValues` is empty and `impeccable detect --json --no-inline-ignores app/src` reports nothing: each intended
  literal becomes a DESIGN.md frontmatter entry (32 of `PrintCard.svelte`'s 33 advisories are print colours - `#000`,
  `#fff`, the Figma golds - and one is the radius `2.4cqw`), and every other finding is fixed. A finding that is neither
  fixed nor documented is named to the owner as a kept exception (plan review N15). `git grep -n impeccable-disable -- app/src`
  returns nothing (E11).
- 10-3: The re-audit is Impeccable `audit` over the S1 capture; `.impeccable/design.json` is regenerated with Impeccable
  `document` after TD's tokens land (plan review R5): it draws no dashed unique tag (D), holds `--measure-line` and
  `--measure-text` (text), and keeps the print card at 63x88 mm (Q-P1 is no).
- 10-4: The kept exceptions are recorded with their reasons (plan review N14): a surviving detector ignore in DESIGN.md
  "Notes"; E5, E6, E8 and E9 in `.claude/README.md` (owner, Q4 and B1).
- 10-5: The spelling grep of batch 2 is re-run over the paths in scope and returns only the kept forms (its word list is
  the one `tests/derived.js` "American spelling" holds; the kept forms are in the batch 2 decision file).
- 10-6: The `FIRST_SCREEN` table has no logged row: every route is asserted (`shipped: true`), with the named exceptions.
- 10-7: Reviewer probes (owner, 2026-11-04, `context.md`, "Reviewer probes"): `.claude/prompts/review.prompt.md` and
  `.claude/README.md` (beside "Rule 2s ... are habit guards") say a reviewer may run read-only probes through stdin or
  `node -e` against the built app; no hook changes. In the same edit, `review.prompt.md` names a second plan look
  `plan-<batch>-<n>.md`, the name `agent-guard.mjs` reads (R5 of `reviews/plan-1-3.md`). The prompt change is a review
  trigger, which this batch's review covers.
- 10-8: P5 (`rollNo`, `plan-4.md` K11, `handoff.md` Deferred). Default (planner, 2026-11-06, owner away): not built. The
  change rewrites about 1000 generated share stubs (`i/*.html`) and `tools/share-card.mjs` for one word and needs its own
  plan review; it goes to `docs/specs/DEBT.md` at closeout with that cost. If the owner asks for the code, the plan writes
  `- Plan review: required before 10` first and the line reads "«№» and "No." in both languages, `node tools/build.js`
  regenerates the stubs, `app/contracts` passes".
- 10-9: From batch 6, settle (fold, or keep and name in the closeout) the tab and picker CSS copied into `HomebrewTabs` from
  `TableNav` (H2; after N moved the wide tabs to pills, count what is left) and `EQ_DT`'s abbreviations in the stat line (D15,
  shared with the catalog rows and print). Default: keep and name.
- 10-10: Dead code of the list roll (`handoff.md` Deferred): `RecordCard`'s `compact` variant and `nameActions`, the
  `.card.compact` rules and the `tools/artwork` `REVIEW_ART_SIZES` rows for 132 and 96 px go with the eight `record.test.ts`
  cases that read them, after `git grep` shows that no page draws them; `node --test tools/artwork/lib.test.mjs` passes.
- 10-11: Batch N's three copy rows (`handoff.md` Deferred): the `/roll/mwt` lead is an instruction sentence (Clarity Rule;
  proposed fix: no lead); «корника» in the `/roll/std` lead is decided with the `daggerheart-ru-terms` skill (the help text
  uses the word too); the gold outline of the «ИЛИ» dividers (`OrGrid`, The Seal Rule) takes `--line2`. The goldens of the
  changed roll states are re-seeded with `--only` in RU and EN; `i18n` parity holds.
- 10-12: The case 89 default (CI fix pass, `handoff.md` Deferred): up to 760 px the roll row keeps one line and cuts a long
  chosen part with an ellipsis («Оплот Шершней», «Проклятые предметы»; the select shows it whole). The batch measures a
  shorter roll label and a narrower picker frame at 360 and 390 px in RU and EN; it takes a narrower frame only if every
  roll row of `FIRST_SCREEN` still passes; otherwise the cut stays and DESIGN.md "The Whole Message Rule" keeps naming it.
  A label change needs the owner (The Same Label Rule).
- 10-13: `404.html` keeps its system face and its missing die mark (a script-free host page: a self-hosted font needs its
  own `@font-face` path); DESIGN.md "Notes" names it as a kept exception, or the batch builds it if the audit finds a cheap
  path (default: keep).
- 10-14: `/s/` shows the bare list position «1» where `/search` shows «№ 89» (`handoff.md` Deferred; M21 d). Default: keep;
  FEATURES.md "Lists" names it («№ 1» costs three characters of the name column at 360).
- 10-15: 2-R3: from 761 px the header draws brand, jobs, language, account while the DOM order is brand, language,
  account, jobs (WCAG 2.4.3); DESIGN.md "Navigation", "Header" names the trade-off unless the audit finds a cheap order that
  keeps the look. 2-N6: DESIGN.md "The Same Label Rule" and FEATURES.md "Chrome" lose "until their page's batch moves them".
- 10-16: Monospace labels outside the Key Characteristics rule (`.ordiv i`, `.altcol`, `HelpButton`, `.steps-l`) and the 15
  components with `text-transform: uppercase` outside The Capitals Rule: each is fixed or named in DESIGN.md "Notes".
- 10-17: `tests/app/typo.js`: `/search`'s kind row joins `SWITCHES` and the Whole Message step reads 360 as well as 1180 if
  each costs one loop entry; the note and price switches need an account list the loop cannot make (`DEBT.md`).
- 10-18: The closeout register (`/handoff`): each row goes to `docs/specs/DEBT.md` with its figures, or is named to the owner
  and dropped: the focus jump and the 9a R2 probe (TD-P3), the toast over «Ещё» (T-14), `RecordCard`'s dialog art at
  500-760 px wide and 481-560 px tall, `/search` at 320x568 RU (the 313 against 305 sideways scroll; one probe first),
  4-R1 (named to the owner; the recommendation is to keep the page), the tabular stat columns task (section 12),
  `reviews/CI.md` N6 (the `ci.yml` comment, the `bash-guard.mjs` text, no reminder for a bare `states.js`; a hook change
  needs selftest cases), the `reviews/5.md` and `reviews/6.md` "Checks still needed", the link-preview Worker's card images,
  the EN `<title>`, manifest name and `en/index.html` wordmark.
- 10-19: A defect that the re-audit finds goes to `DEBT.md` under the task that owes it and the batch stays small; or the
  batch fixes it in code and pays the full code gate.
- 10-20: Wave 3 lands after this batch's review and green CI; then the closing steps of section 16 run in order: the wave 3
  blind review with its remediation, the whole-app blind review with its remediation, the closeout commit that deletes
  `issues/57/`, and the last squash. The task directory is retired only after the whole-app blind review.
- 10-21: Gate cost 95-125 min (section 8): one `check:fast`, one CI run, one review and its fix cycle, the affected vitest
  files, the artwork test, both lints, `check:built`, the detector, `build:test`, the `--only` re-seeds and the loader runs of
  cases 83 and 89.
- Standing checks (outline; its refresh expands them): scale and error scenarios are not applicable (no new state, nothing
  stored, no write path; the copy rows change text only); consistency follows `FEATURES.md` rules 4 and 14 (one name, one
  wording, a lead that is not an instruction); RU/EN parity: each changed string has both languages and `i18n.test.ts`
  passes.

Each of batches 2-9 (3b, 9a, 9b, TD, N, P and 10 included):

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
- A writer's local gates are the affected vitest files, both lints, the golden
  re-seed when goldens move, and `rtk npm run check:fast` last. Browser suites and
  sweeps run on CI (owner, `context.md`, "Local gates").

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
| P | `plan-P.md`, "Gate cost": the affected vitest files (20-25), the catalog measure and the background PDFs (12-15), the golden re-seed of 30-45 print states (15-20), one local `app/print` run (8), `check:built` (2), the screenshot set and PDF rasters (8-10), `polish` and `harden` (5-10), the batch review (20-30) and one fix cycle (25). Q-P1 is no, so the plan review of the earlier estimate is gone | 157-197 in all |
| 2 (done) | spent (planned 65-75 min of extra gates: `check:db`, the golden re-seed, the sweep, the selftest, the mark) | - |
| 3 | `node tests/run-all.js app/contracts,app/states,app/typo,app/hues,app/print,contracts,dataint,derived,stub` (15-18); `node tests/app/sweep.js 360` and `768` (about 16); the golden re-seed, `build:test` and four `--update` shards (11-12; about 56 catalog states plus the Account, search and shared states whose text or bar moves); `npm run check:built` (1); both lints (2); `node tools/decisions.js` and the detector (2); the orchestrator's Impeccable `polish` and `harden` run (about 10, section 10) | 55-65 |
| 3b | `build:test` and one golden pair (about 5); `check:built`, both lints, decisions and the detector (about 5); `polish` and `harden` (5-10); the browser suites, the sweep and the focus-fix proof run on CI | 15-20 |
| 4, 5, 6, 7 (done) | spent (planned extra gates 30-35, 32-40, 38-49 and 32-43 min, each with `npm run check:built`) | - |
| 8 | `plan-8.md`: the golden re-seed of about 35-40 `/lists` and add-to-list states (`build:test` and four shards, 15-20); `check:built` and the configured budget line (3); both lints, decisions, the detector (3); `polish` and `harden` (5-10); the screenshot set (5); cases 102-104 run on CI. One `check:fast` (10-14), one CI run, one review fix cycle | 75-100 in all |
| 9a (done) | `npm run check:built` where `dist` assets change (1) | 1 |
| 7b | `plan-tags.md`: the vitest files of T1-T6 and T9 (about 15 files, 8-10); artwork test, both lints, decisions, the detector (4-5); `build:test` and the four golden shards (70-120 goldens, 15-20); `check:built` and the configured build (3-4); the head probe and its failing run at HEAD (T9.1, T9.3, 8-12); the roll probe before and after and the roll results CSS (T12, 20-30; folded in by `CLAUDE.md` "Size a batch by its gates": the same `RecordCard`, `RollResult` and `_roll_*` goldens; its own batch would cost 50-65); `polish` and `harden` (5-10); the screenshot set (about 3). One golden re-seed, one `check:fast`, one CI run, one batch review and by habit one fix cycle: 4-6 runs. Its wave 2b squash adds 15-20 (section 16) | 100-135 |
| 9a | the new 360 px goldens, the axe cases and the `check:fast` growth of C1b (10-15); the new goldens and `lists.test.ts` cases of D1 (5-10) | 15-25 |
| 9b | `plan-9b.md`, "Gate cost": the re-seed of about 70-100 list, `/s/` and add-to-list goldens (15-20); the affected vitest files alone with `VITEST_MAX_WORKERS=2` (15-20); `check:built`, detector, E4, Prettier (4-5); the loader runs of cases 83 and 104-107 (8-10); the shots at four widths (10); `polish` and `harden` (5-10); `sweep.js 768` on CI | 95-130 in all |
| TD | `plan-TD.md`, "Gate cost": T's three vitest files and the loader runs of cases 83, 108 and 109 before and after (30-38); D's two vitest files, `derived`, the loader runs of cases 110, 111 and 83 red then green, six `--only` re-seeds and the shots (25-35); the Measure Rule's CSS in 12 files, case 111 at five widths and the prose (40-55); lints, `check:built`, the detector, `polish` and `harden` once (15-20); the review of about 57 files and six goldens (25-35). No golden re-seed beyond the six headers | 168-230 in all (T 65-90 and D 100-140 as two batches; `plan-rebatch.md` 128-175 before the Measure Rule) |
| N | `plan-N.md`, "Gate cost": the homebrew head probe (12-15); 11 vitest files (12-16); the re-seed of about 145 roll, tables and homebrew states (25-30); the loader runs of cases 83, 96, 97, 112, 113 and `sweep.js` 768 and 1180 (15-20); `check:built` and lints (4-5); `polish` and `harden` (5-10); the review (20-30) | 115-150 in all |
| 10 | docs and the cleanup of acceptance 10-1 to 10-21: one `check:fast` (12-14), one CI run (10.5-11.5), the affected vitest files and the artwork test (6-8), lints, `check:built` and the detector (4-5), `build:test`, the `--only` re-seeds of the roll copy and the loader runs of cases 83 and 89 (10-12), `polish` and `harden` on the roll heads (5), the review of a prompt change (20-30) and one fix cycle (22-26). A docs-only batch would cost about 20; the code part is the cleanup of 10-8 to 10-17 | 95-125 in all |
| waves (section 16) | per wave: the merge of `origin/main`, the squash in the main checkout, the `main` CI run with the deploy (10.5-11.5) and the merge back (about 2); three waves, plus the small wave 2b (15-20, in the 7b row) | 37-41 |
| blind reviews, post-release check and closeout (section 16) | the three blind production reviews, after wave 2, after wave 3 and of the whole app, each with its remediation batch (the whole-app one about 45-60, the owner's print not counted; the two wave reviews and their fix batches are not in the totals below), then the closeout commit and its docs-only CI run and the last squash (about 20) | 65-80 |

Time left at the 2026-11-06 fold (batches up to the CI fix pass spent): TD 168-230 min, N 115-150, P 157-197, 10 95-125,
the wave 3 squash 12-14, the two blind reviews with their remediation and the closeout 65-80: about 612-796 min, 10.2-13.3
hours. The merge of D into T saved one CI cycle pair and one review (about 67-95 min, `plan-rebatch.md`); T and D as
batches of their own would have cost 65-90 and 100-140. This host is memory-starved: every vitest run takes
`VITEST_MAX_WORKERS=2`, and a browser suite never runs beside vitest, so the local `check:fast` is 12-14 min (744 s measured
at batch 8's remediation). The earlier totals (batch 3b refresh, 9b refresh) are at `git show a8bdf1de:issues/57/plan.md`,
section 8.

Writer tests per remaining batch (`orchestrate.prompt.md`, "Writer tier"; facts
for the orchestrator's dispatch, not a model choice):

| Batch | Test 2 (public contract, route, stored state, product law, hook, configuration) | Test 3 (print fitting, golden re-seed, parity with a design node) | Plan-review trigger |
|---|---|---|---|
| P | no: Q-P1 is no, so the product law, `CLAUDE.md` and `llms.txt` do not change | yes: print fitting; parity with Figma nodes `714-42387` and `3773-90792` (the burden export); 30-45 goldens | none (`plan-P.md`, "Plan review") |
| 3 | no (no contract, route or stored state changes; `tests/app/contracts.js` only reads a second form of the same fixture value) | yes: about 56 catalog goldens re-seeded, the first-screen offsets and the sheet, bar and column layouts rest on visual judgment | none (section 10) |
| 3b | no | one new golden pair, seeded with `--only`; no re-seed of other states and no design node | none (`plan-3b.md`) |
| 4 | no | yes: new states and their goldens | none |
| 5 | no | yes: goldens | none |
| 6 | no | yes: goldens | none |
| 7 | no | yes: goldens | none |
| 7b | no | yes: 75-125 goldens in one re-seed; badge, tile, head and roll result layouts. Test 1 is yes: the head choice HD1 and the roll choice RC1 have defaults (options A and B) that block nothing | none (`plan-tags.md`) |
| 8 | yes, in part: the bundle ceiling goes into `tools/bundle-budget.mjs`, `.claude/README.md` and a decision file (configuration every session runs under; no contract, route, stored state or product law) | yes: about 35-40 goldens re-seeded; the card, bar, head and menu follow mock 8. Test 1 is no: every fork has a default (`plan-8.md` L10, L12, L13) | none (`plan-8.md`) |
| 9a | no: no stored state, route or contract changes (D1 keeps the filter in memory) | yes: the list goldens, the compact row at 360 px | none |
| 9b | yes: `.prettierignore` (E4) and `.impeccable/config.json` (E2), configuration every session runs under | yes: about 70-100 goldens; the side column and the panels against mock 9, the row text against mock 9b. Test 1 is no (M1-M20 decided) | none: the note switch commits the shown draft before it switches (`plan-9b.md`) |
| TD | no: sizes, durations, borders, widths and test limits only | yes, in part: the folds at 360, the card corner, the header hold, the plate's ground and the hugging help panel rest on visual judgment; six header re-seeds. Test 1 is no: every fork has a default (T1-T12, D-1 to D-8, MR-1 to MR-6) | none |
| N | no | yes: about 145 goldens re-seeded; the head at five widths against the mocks. Test 1 is no (N-D1 to N-D12 decided) | none (`plan-N.md`) |
| 10 | yes: `.claude/prompts/review.prompt.md` and `.claude/README.md` (configuration every later session runs under); no hook change | yes: the `--only` re-seed of the roll copy states | none: P5 goes to `DEBT.md` (acceptance 10-8) |

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

## 10. Batch 3 - Catalog tables and filters (done; collapsed)

Batch 3 is done. `handoff.md`, Completed, holds its commits, its acceptance
outcomes ("Acceptance lines of `plan.md` section 10"), its deviations and its
review fix pass. The plan was collapsed at the fold of the placed items of
batches 4-7 (2026-11-04) because `plan.md` passed the 150 KB line. The last
full text of the brief is `git show 5ecca692:issues/57/plan.md`, section 10.
Its headings, in order (the shape that `plan-3b.md` and `plan-4.md` to
`plan-7.md` name): Objective, Dispatch preflight, Decisions of this refresh,
In scope, Out of scope, Files expected (steps S1-S15), Constraints from the mock
and the owner, Steps, Impeccable, Acceptance criteria, First-screen row,
Goldens and new states, DESIGN.md rules this batch writes, Verification, Risks
and do-nots, Standing checks for batch 3 (scale, error scenarios, consistency,
RU/EN parity), Gate cost. Batch 3 changed no contract and stores nothing; no
plan review was required. Its gate cost is section 8, row 3. The earlier
briefs: batch 2 at `git show 65829261:issues/57/plan.md`, batch 1b at `git show
5d9aefbc:issues/57/plan.md`, batch 1 at `git show 80872b35:issues/57/plan.md`.
Two sections stay below because the task still cites them: the planner defaults
D1-D13 (they bind batches 6, 8 and 9a, and sections 13 and 16 cite D5 and D6)
and the Impeccable procedure.

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
   conflict state (A30); batches 9a and 9b keep the list save, undo, limit and request
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
   add-to-list menu; batch 9a, the list «Ещё» menu, the compact row, the filter
   sheet and the `/s/` selection mode; batch 9b, the note switch; batch 3b, the
   hidden header.

## 12. Risks, assumptions, deferred

- Assumption: the package declares `'Source Sans 3 Variable'` and its italic
  carries Cyrillic; batch 1 step 2 reads and checks both.
- Risk: the font CSS passes the bundle budget; batch 1 step 8.
- Risk: the navigation change confuses returning users; both rule sets stay one
  click away, each supplement two, and every address works.
- Risk: 9a and 9b re-seed the list goldens twice, and between the waves the list
  page has the new rows beside the old panels (owner, "Batch 9 split"). Each refresh
  lists the review order (the list page, then the shared page).
- Risk: batch 3b's header is not verified on a real iOS device; section 16 places
  the check.
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
- Deferred (owner, 2026-11-05, "plan stat columns later"): tabular stat columns on table rows from 1440 px. Today a
  weapon or armor row draws trait, range, damage and burden as one stat sentence, so a row with a short description is
  60-70% empty at 1920 px even after the Row Text Rule (batch 9b). Outline: a states mock first (`eq_weapon` and
  `eq_armor` at 1440 and 1920 px, RU and EN); then right-aligned tabular columns with labels right of the text, rows
  still one column, the stat sentence kept below 1440 px, on `/search`, the list page and `/s/`; values from the source
  book data. It is the DESIGN.md "Proposed rules" row "The Stat Columns Rule" (written by 9b, M22). Recommended: its own
  task after wave 3, not batch 10 (the docs lock and a small cleanup) and not before wave 3 (9b, TD and N are full).
  Trade-off: production keeps half-empty weapon rows until then.
- Risk: batch P moves every print measurement that `tests/app/print.js` and
  `FEATURES.md` "Print" pin (the face, the bases and the floors move the fit); the
  sheet geometry stays at 63x88 mm (Q-P1 no). Its brief lists each pinned figure with
  its new value from the catalog measure, and its batch review reads the figures
  against the PDFs.
- Risk: batch TD holds three rule sets in one review (about 57 files, six goldens) and one red CI run blocks all
  three; the loader cases (83, 108, 109, 110, 111) run before `check:fast`. A hugging help panel leaves page space right of
  it at 1920 px: the owner may take MR-4's fallback, one line (`plan-text.md`, section 9).
- Risk: a self-hosted print face makes the fit depend on a font load (QP.1);
  the fit after `document.fonts.ready` and the waiting print button are the
  guard, and an offline tab prints in the fallback with its clip count.
- Batch 3's risks (the widest UI batch of wave 2; a usage wrap-up mid-batch)
  are closed: it shipped (section 10).
- Risk: between waves 2 and 3 two filter forms (`FilterPanel`, `FilterBar`) and
  two selection bars (`SelectionBar`, `BatchBar`) exist; batches 6, 9a and 8
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

- QP.2 (owner, 2026-10-29: 63.5 x 88.9 mm) is reversed by Q-P1 (owner, 2026-11-05): the standard card stays 63 x 88 mm with its
  8.5 mm side and 14.5 mm top and bottom margins (no official Daggerheart size was found; the difference is below printing
  tolerance). QP.3 the compact card stays 44 x 63 mm (it fits
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

Settled, not asked again: the list page and the shared page stay one pair, split
by work into 9a and 9b (section 7); the shell is batch 2 (foundations first); D121
is batch 2 and D116 batch 8.

Feedback answers (owner, 2026-11-03, `feedback.md`): Q1 A1, Q2 B2 (not the
recommended B1), Q3 C1b, Q4 D-head 1 with the `/s/` exception at 286 px. Defaults
kept: D1, a hidden tick leaves the selection, the grip goes while narrowed.

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
  leaves no `shipped: false` row. A row may read `shipped: 360`, asserted at 360x640 and logged at 1180x720: 9a brings
  the list page and `/s/` under the rule at 360, and their 1180 px figures (377 and 481
  px on the built page) wait for 9b's side column. Case 83 asserts when `row.shipped
  === true || row.shipped === width`. Waves 1 and 2 reach `main` with logged rows;
  that is accepted (owner, "Interim mix between waves"), because the later
  batches assert them.
- Roll results (owner, 2026-11-04, item 6; batch 7b, `plan-tags.md` T12.4): beside `FIRST_SCREEN`, a table
  `ROLL_FIT` asserts how much of a roll the first screen holds - every name of a four-result roll and the whole of
  a one- or two-result roll at 1180x720, the whole roll at 1919x980, the first two results at 1000x720. The roll
  rows of `FIRST_SCREEN` keep their limits.
- Named exceptions (owner, 2026-10-29 and 2026-11-03): `/roll/std` at 360 (variant
  A, the first result at about 325 px; batch 5), `/lists/<uuid>` with requests and 8
  or more entries at 360 (the folded requests strip and the search row, about 296 px;
  batch 9b) and `/s/` with a search row at 360 (286 px; batch 9a). Each is a row with an
  `exception` limit in px at 360 only, set from the owner's figure; the row
  is asserted against that limit at 360 and against the 0.4 rule at 1180, and
  DESIGN.md "The First-Screen Rule" lists each exception with the owner's
  date. If the built page measures past the owner's figure, the batch names
  the measured value to the owner before it moves the limit. Batch 5 adds a
  second roll row in another mode (asserted at the rule; the `AltPanel` or
  `RollPanel` deterministic first result is that refresh's choice,
  `reviews/1.md` "Deviations"); batch 9a adds the row of 8 or more entries beside
  `LIST_A as gm4`, and the `/s/` row of 8 or more entries; batch 9b adds the rows
  with requests. With the owner away, a value past the owner's figure is logged in
  the AFK decisions file and the limit takes it.
- Cost: about 50 page loads, about 70-100 s added to `app/states`.
- The mock step measures each batch mock the same way with
  `issues/57/mocks/measure.mjs` (plan review N6: the top of the primary
  element below the top of `header.top`, both viewports, RU and EN).

One place for each list control (plan review R3), on every list surface (the
catalog, `/homebrew`, `/lists`, `/lists/<uuid>`, `/s/`), at both widths:

- «Выбрать» / "Select" sits at the right end of the collection's head row
  (the row that holds the count). It never goes into «Ещё» / "More" and never
  joins the primary action's row.
  Since the 9b refresh (2026-11-05, the Field Measure Rule) "at the right end" reads "last in the row": from 761 px the
  search box is at most 720 px and the row's controls follow it.
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

Feedback answers (owner, 2026-11-03): at 360 the rows `9 / list` and
`9 / shared-player` are replaced by `mocks/F/`. `/lists/<uuid>`: 200 px below 8
entries, 252 px from 8. `/s/`: 286 px with a search row, a named exception. No row of
this table moves for batch 3b: the rule is measured at scroll 0, where the header is
shown and takes the same layout (`plan-3b.md`, "First-screen row").

The estimates are sums of the mocks' own row heights and gaps; each batch
mock re-renders with its fix and is measured again before the owner sees it.
The re-renders that follow from this table: `mocks/3/` (`catalog` and its
states), `mocks/5/` (`roller`), `mocks/6/` (`homebrew-items`, `editor`),
`mocks/7/` (`search-results`), `mocks/P/` (`print-preview`), `mocks/8/` (`lists-index`),
`mocks/9/` (`list`, `shared-player`).

Batch 8 (`plan-8.md`, L9): `#/lists as gm1` moves to `shipped: true`, and a new row `#/lists ~ many lists as gm4`
(30 lists, the search row) is asserted at the rule (mock 8 measured 231 / 189 and 253 / 191 at 360 / 1180).

FIRST_SCREEN batches: roll pages 5 (the header part 2), tables 3, item 4,
search and account 7, print P, homebrew and the editor 6, `/lists` 8,
`/lists/<uuid>` and `/s/` 9a at 360 and 9b at 1180.

Batch 9b (`plan-9b.md`, "First-screen rows"): the five list rows move to `shipped: true`; the requests state's row is
added (the rule, or its measured exception at 360; owner 292, estimate 296). Measured at the 9b refresh on the built
app with the rules injected (`mocks/9b/measure.json`; the Row Text Rule of the owner's 2026-11-05 choice): no first-screen top moves (`/search` 279, `/tables/eq_weapon`
244, `~ two filters` 244 at 1180 and 252 at 360, `/roll/std` 267 at 1180 and 323 at 360, `/s/` 275 at 1920, `/lists ~
many lists` 199 at 1920).

Batch TD re-measures every row at 360x640 before and after the folds (`plan-T.md`, "First-screen rows"; measured on the
live site, before / with the Thumb Rule only / with the folds): `/roll/std` 323.5 / 338.7 / 318.7 (its exception stays 325),
the roll pages 250.7 / 265.9 / 245.9, the catalog 234.4 / 242.4 / 230.4, two filters 252.4 / 260.4 / 248.4, `/i/ci1`
137.2 / 140.4 / 136.4, `/search` 230.0 / 236.4 / 232.4, the header 111.2 / 114.4 (155.6 at 360 EN) / 110.4. The list pages,
`/lists`, `/homebrew` and `/s/` are estimates that TD measures through the loader; a row past 256 px takes a fold or its
measured `exception` (section 7, "Batch TD"). The lead on one line (D, the Measure Rule) lowers `#/search ~ searched`,
`#/search ~ kind picked` and `#/homebrew as gm3` by about 22 px at 1180; nothing at 360 moves.

Batch N (`plan-N.md`, "First-screen rows") adds the 768x1024 and 900x720 columns (limit 410 and 288): the roll rows 264, the
catalog 334 (at 900x720 a named exception with a ceiling of 336, the reserved tab row), `#/homebrew as gm3` measured in S1;
at 1180 the roll rows read about 214 (267 before) and `/tables/eq_weapon` 244.

Batch P (`plan-P.md`, "First-screen rows"): the `#/p/set-emberaxe as gm2` row moves to `shipped: true` (estimate 236-248 px at
360x640, limit 256; 200-215 px at 1180x720, limit 288).

## 15. Batch P - Print (expanded into `plan-P.md`)

Batch P's brief is `plan-P.md` (2026-11-05), restated 2026-11-06 for the owner's Q-P1 answer: the standard card stays 63x88
mm. The outline that stood here (the owner's answers of 2026-10-29, the findings PR1-PR12, the card changes, the `/p/` page,
the checks and the risks) is at `git show a8bdf1de:issues/57/plan.md`, section 15; every line of it is an acceptance line of
`plan-P.md`. Departures from the outline are named there: P-D4 (the compact floor 3.7cqw), P-D5 (the label shortfall kept),
P-D8 (the mark clearance), P-D12 (the link is a button from 761 px), P-D14 (the 760 px step, with `previewScale` reused at 63x88
mm) and Q-P1 (QP.2's 63.5x88.9 mm is not built). The product law of `CLAUDE.md` ("nine 63x88 mm cards per A4 sheet") is
unchanged.

## 16. Release waves and the post-release check

Owner, 2026-10-29 (`context.md`, "Release in three waves" with its "Reviews"
paragraph, "Interim mix between waves", "Post-release review"). This replaces
"the task reaches `main` as one squash at closeout" and the owner's screenshot
review as a gate; the batches still save their screenshot sets as evidence.

| Wave | Batches | Lands after | Production until the next wave |
|---|---|---|---|
| 1 | 1, 1b, 2 | batch 2's review and the green CI run of its tip | the new face, ramp, glyph, mark and shell; gold default chips beside the neutral switches (accepted; batch 3 and the surface batches make them neutral); `FIRST_SCREEN` rows logged |
| 2 | 3, 3b, 4, 5, 6, 7 | batch 7's review and the green CI run of its tip | the new catalog, item, roller, homebrew, search and account pages; the hide-and-show header and the focus fix; `/lists/<uuid>`, `/s/`, the list panels, `/lists` and print as wave 1 left them (old rows, `FilterBar` and `BatchBar` stay) |
| 2b | 7b | batch 7b's review and the green CI run of its tip | wave 2's pages with the tag rule (relation lines and «Core» on the full record card only), one-box badges and a steady table head; the list rows, `FilterBar` and `BatchBar` as wave 2 left them |
| 3 | 9a, 8, 9b, TD, N, P, 10 | batch 10's review and the green CI run of its tip | the finished task |

Wave 2b is a small squash of one batch (owner, 2026-11-04, `context.md`, "Wave split"): it ships the tag
fix sooner and starts wave 3 on a clean `main`.

Each wave lands by `orchestrate.prompt.md`, "Task closeout and cleanup", step
8, with these changes (owner, "Wave squash content"); wave 2b follows the same steps, with one Conventional
Commits subject of its own (for example `fix(ui): land task 57 wave 2b, one tag rule and a steady table head`):

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
4. Waves 1, 2 and 2b keep the remote branch, the worktree and its
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

Blind reviews on production (owner, `context.md`, "Wave reviews"). Each runs with
no plan and no handoff, and checks production only:

- After wave 2's green deploy: a blind review of the scope of waves 1 and 2.
  Report: `issues/57/reviews/post-wave-2.md`. Done 2026-11-04 (fix-then-continue); its remediation is
  `handoff.md` Completed, "Post-wave-2 remediation" (R1 kept the dialog over a roll result: a feature-loss
  stop rule avoided, named there).
- Wave 2b has no blind review of its own: the owner's wave reviews do not require a read-only reviewer of the
  wave 2b scope on production, and the review after wave 3 covers it.
- After wave 3's green deploy: a blind review of the scope of wave 3 and of wave 2b. Report:
  `issues/57/reviews/post-wave-3.md`.
- Then the whole-app blind review, step 1 below. Report:
  `issues/57/reviews/post-release.md`.

Each of the three runs its own remediation at once, nits included, in a fix batch
on `claude/57`, with no wait for the owner and no entry in `DEBT.md`. A finding
goes to the owner only under a stop rule: a product law, a feature loss, or a gate
red after the one remediation cycle.

After wave 3 and its blind review, in order (batch 10's last lines):

1. The whole-app blind review. A fresh blind reviewer, with no plan and no
   handoff, checks production only: Source Sans 3 loads from the site (no
   fallback face); the First-Screen and Phone-First Rules on the live site at
   360 and 1180, RU and EN; Impeccable `audit` and the detector on
   production; axe on the main routes; the PWA install icon and the favicon
   (the mark); link previews in Telegram and Discord (old cached cards are
   expected for a while); one printed A4 sheet of each layout on paper (the
   owner prints).
   The owner also tries the header on a real iPhone (`plan-3b.md`: the bounce at both
   ends of a long list, the on-screen keyboard, VoiceOver into the hidden header);
   headless Chrome cannot show these. Report: `issues/57/reviews/post-release.md`.
   It covers the whole app. Its dispatch adds `plan-pw3.md` part C (the surface inventory, the consistency
   matrix, a screenshot per probe, the seeded defect classes) and runs two blind reviewers: production signed out
   and the fixture build signed in.
2. Its findings are remediated at once, nits included, in a fix batch on
   `claude/57` (the remediation rule above).
3. The closeout (`/handoff`): the audit, the durable moves, `git rm -r
   issues/57` in the closeout commit, push, a docs-only CI run, and a last
   squash onto `main` with the `DEBT.md` lines and the durable moves; that
   squash deletes `issues/57/` from `main` too.

Between waves (owner, "Interim mix between waves"): an inconsistency between
batches is accepted when a planned later batch removes it; take the option
with less work and name that batch; final consistency still matters. Home:
batch 2's waves decision file.

Cost: section 8, rows "waves" and "post-release check and closeout".
