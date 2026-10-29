# Plan - TASK 57

This plan orders the phase 3 batches of the UI redesign (direction R) on the
shape of `main` at `c8243ba6`. Phase 1 findings and their re-check are in
`audit.md`; facts and owner decisions are in `context.md`.

## Status

- Phase 1 (S1) and phase 2 (S2): done. The owner chose R on 2026-10-23.
- Refresh against `main` (2026-10-29): done. `claude/57` merged `main` at
  `9112c4ed`; every `audit.md` row is re-checked (`audit.md`, "Re-check
  against main"); every address in this plan is a path.
- Phase 3: ten batches (section 7). Batch 1 is implement-ready after its
  mock step (section 10). Batches 2-10 are outlines; each one's refresh
  expands it.
- Mocks: every batch mock from 1 to 9 can be drawn now (section 9). The
  orchestrator dispatches them after the plan review; the owner confirms
  each one before its implementer starts.
- Plan review: required before 1 (trigger: public contract change in batch 2)
- NEEDS_HUMAN_CONFIRMATION: yes - section 13, Q1 (the font download for the
  share cards) blocks batch 1 step 9; Q2-Q4 have recommended defaults.

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
| Roll mode row: «Обычные правила», «Альт. таблицы», «Дополнения ▾» (a menu of the seven) | owner, 2026-10-23 | three controls hold one line at every width; the chip shows the open supplement in the current-place gold |
| Filter column beside a column table at desktop width; a filter sheet at 360 | B1 | the panel no longer pushes the rows 570 px down (C3, C54) |
| Two-pane roller | B1 | the result is the focus and the controls stay in reach (C39, C25) |
| Dossier item page; a bottom-sheet dialog with a fixed action bar at 360 | B1 | it uses the desktop width (C17) and keeps the actions in reach (C44) |
| List controls and notes in a side column | B1 | the first item is in view at once (A3, A1) |
| Strict gold budget | A1 | gold on defaults is the defect C13 names |
| Source Sans 3, self-hosted | font study (section 3) | full Cyrillic, tabular figures by default, OFL, not flagged by the detector |
| Roll results drawn as the card face | C1 | the moment that matters at the table gets the printed card's register |

Trade-offs accepted: a returning GM learns one new click («Бросок», then the
mode); a switch between two supplements takes one more tap; at 360 a mode
label can take two lines inside its control; the mode chip keeps «Альт.
таблицы» against the H1 «Альтернативные таблицы» (rule 4 departure, batch 2).
The comparison of A, B, C and R is history: `git show 69f2178:issues/57/plan.md`,
sections 1 and 2.

Theme decisions (from `audit.md`, "Systemic themes"):

| # | Theme | Decision |
|---|---|---|
| 1 | Gold spent on things nobody chose | Gold fill: one primary action per panel, a choice that narrows the view, the current place. A pressed default («Все»), a mode toggle and a selection are neutral: a lit border and a check. Unique tag neutral dashed; footer links muted; roll number in the UI face. |
| 2 | Help text repairs controls | Each control says what it does, so a panel holds nothing new. The panels stay behind a labelled «Справка» button until the owner decides each one at its batch mock. |
| 3 | Labels change with the width | One action vocabulary at every width and one «Ещё» overflow: «В список», «Поделиться», «Печать», «Ещё» (Скопировать текст, Скопировать название, Скопировать картинку, Скопировать ссылку, Копия в мои предметы). |
| 4 | Navigation | Three jobs and the three-control mode row; «Бросок» opens the last roll section of this tab, else `/roll/std`; the account control is «Войти» signed out and an initial with a chevron signed in, lit on its pages. |
| 5 | Type floor and caps | Ten steps (23, 20, 18, 16, 15, 14, 13, 12, 11.5, numeral 19); data text 13 px at the least; capitals only for section labels and badges. |
| 6 | Density | Rows: name with its tags after it, one stat line, one feature line; tags that repeat the active filter hidden; a selection mode («Выбрать») replaces the always-on checkbox column. |
| 7 | Missing art | The kind glyph on the art well for a record with no picture and while a picture loads; the "?" pedestal moves to empty states. |
| 8 | States | An empty or error page names the cause and one next step; a temporary choice lives where it is made, with no note; a dialog keeps its actions in a fixed bar. |

## 2. Scope, contracts and dependencies

- In scope: every row of `audit.md` (section 7 places each), every UI/UX
  entry of `docs/specs/DEBT.md` (section 6), every Impeccable exception
  (section 5), both languages, 360 to 1600 px, the two site share cards.
- Not in scope: print card layouts and sheets (product law); new features;
  `llms.txt` spelling (Q3); the per-item `og/<id>.jpg` (art only).
- Contracts that stay: routes, ids, links, asset paths (`og/_share.jpg` and
  `og/_share_en.jpg` keep their paths; their bytes change), `data.js`.
- Public contract change: batch 2. `docs/fixtures/urls/routes.json`
  `resolves.tab` pins the lit tab of every route (the `href` of `nav.tabs
  a[aria-current="page"]`, compared through `pathOf()`). The three jobs change
  that value on every roll route.
- Order (owner): foundations first (tokens and type, then the shell). Each
  batch dispatch merges `main` into `claude/57` first (a merge, never a rebase
  or a force-push). No batch lands on `main` before the owner has seen its
  screenshots; the task reaches `main` as one squash at closeout.
- Decisions (`docs/decisions/`, indexed by `node tools/decisions.js`): the UI
  font (batch 1), the navigation (batch 2).

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
Variable'`). Print keeps today's stack through `--print-ui`. The share cards
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
| The art well and the kind glyph ("Cards") | 1 | theme 7: C55, C11, A10, A38 (the pedestal leaves rows) |
| Navigation: three jobs, the mode row, the account control, the wordmark «Лут» / «Loot» (replaces "never translated"); The Two Breakpoints Rule takes the measured header | 2 | theme 4: C6, C27, C48, C52, A28, A35, A36, A37, P9, D10, D11 |
| The Same Label Rule: a label does not change with the width; the pin and «Справка» are labelled | 2 | theme 3: C27, A36, C37, A27 |
| Toast: its fill, its place over a fixed bar | 2 | C34, C47, A15 |
| Row anatomy and the selection mode; the filter column and sheet | 3 | theme 6: C3, C4, C10, C54, C56, A40, P1, P14 |
| Two chip levels (group and book) | 3 | C7, A25 |
| A temporary choice lives where it is made | 3 | theme 8: C57, C31 |
| The empty-state pattern (`R/pattern-empty`) | 3 | theme 8: C16, C59 (applied in 7) |
| Book names stay Latin in Russian | 3 | P13, C8 |
| The action vocabulary and «Ещё» | 4 | theme 3: C5, C18, C40, A23 |
| The dossier page and the bottom-sheet dialog | 4 | theme 6 and 8: C17, C44, A31 |
| The error-page pattern (`R/pattern-error`) | 4 | theme 8: C32, A18 (applied in 8) |
| The card face on roll results; the two-pane roller | 5 | C39, P11, C25 |
| Forms: optional fields marked, field-specific errors | 6 | A7, A8 |
| DESIGN.md "Notes": the detector exceptions list (empty), the full frontmatter colours and radii; `.impeccable/design.json` regenerated | 10 | N3, the exception inventory (section 5) |

No DESIGN.md rule (local fixes in the batch section 7 names): C1, C12, C14,
C19, C20, C21, C22, C23, C24, C26, C29, C30, C36, C38, C41, C43, C46, C53,
C58, C60, C61, C62, C35, A1, A2, A3, A6, A9, A12, A13, A14, A19, A20, A21,
A22, A24, A29, A30, A32, A33, A34, A41, A42, P4, P5, P6, P7, P10, P15, D2,
D5, D6, D7, D8, D9, D14, D15, D16, D20, N1, N2, N4, N5; C63 and A11 are
artefacts.

## 5. Impeccable exceptions

Inventory on `main` `c8243ba6` (`git grep -i impeccable`, `.impeccable/`,
`.claude/`, `eslint.config.mjs`, `package.json`, `.git/info/exclude`):

| # | Exception | Where | Plan | Batch |
|---|---|---|---|---|
| E1 | `ignoreValues` `overused-font: inter` | `.impeccable/config.json` | remove with the font change | 1 |
| E2 | `ignoreValues` `side-tab` for `ListPage.svelte` (`value: "*"`) | `.impeccable/config.json` | remove with the list page's note redesign (A5, A22); `HitNote.svelte`'s unignored `side-tab` (N1) goes in the same batch | 9 |
| E3 | `.prettierignore`: `hook.cache.json`, `hook.pending.json`, `config.local.json` | `.prettierignore` | remove: `.gitignore` lists all three and Prettier 3 reads `.gitignore` by default; `prettier --file-info <path>` proves `"ignored": true` | 1 |
| E4 | `.prettierignore`: `.impeccable/config.json` | `.prettierignore` | remove once `ignoreValues` is empty: format the file with Prettier, or delete it if `impeccable detect` runs without it; a later `impeccable hooks ignore-value` then reddens `format:check`, which makes a new exception visible | 9 |
| E5 | `.gitignore`: `hook.cache.json`, `hook.pending.json` | `.gitignore` | the hook's runtime state; this host's `.git/info/exclude` already holds an `impeccable-hook-ignore` block. Remove only when the batch finds the code that writes that block (so every host that makes the files also excludes them); else keep and name the reason in DESIGN.md "Notes" | 1 (check), 10 (record) |
| E6 | `.gitignore`: `config.local.json` | `.gitignore` | keep: a local config with no tracked ignore is how a credential gets committed (the `.gitignore` comment); named to the owner (Q4) | kept |
| E7 | detector advisories (N3) and the two warnings (N1, N2) | `app/src` | not exceptions yet; each batch leaves no detector finding in the files it touches; batch 10 reaches zero with no `ignoreValues` | 1-10 |
| E8 | `tools/check/lib.mjs` `VITEST` rule `['.impeccable/', false]` | gate selector | keep: it says vitest reads no `.impeccable/` file, as for `DESIGN.md`; it suppresses no check | kept |
| E9 | ESLint `ignores: 'issues/*/mocks/**'` | `eslint.config.mjs` | keep: task mock pages are scratch that a closeout deletes (owner, 2026-10-23); not an Impeccable exception | kept |
| E10 | `.git/info/exclude` blocks | this host only | outside the repository; no change | kept |

No hook, agent guard or lint rule names Impeccable (`git grep -i impeccable --
.claude` finds nothing). `PRODUCT.md`'s `impeccable:product-schema` marker is
the skill's schema tag, not an exception.

## 6. DEBT.md placements

`docs/specs/DEBT.md` on `main` `c8243ba6` has two entries, both under task 57
and both UI/UX. No other entry is open.

| Entry | Batch | Acceptance (the entry's own "How to verify") |
|---|---|---|
| D116 - the lists page names its only group «Ваш аккаунт» | 8 | signed in, `/lists` draws no «Ваш аккаунт» / "Your account" heading; `groupAccount` leaves `dict.ts` in both languages; the lists goldens are re-seeded; the entry leaves `DEBT.md` |
| D121 - the focus goes to `body` when a later toast replaces an action toast that held it | 2 | a `shell.test.ts` case for each of `href` and `go`: focus moved into the toast, a later plain toast said, the focus lands on the element it came from, or `#main` when that is gone; `expectNoA11yViolations`; the entry and its section header leave `DEBT.md` when both entries are gone |

The task closes with no UI/UX entry in `DEBT.md` unless the owner keeps one.

## 7. Batches

Every batch starts with its mock step (owner, 2026-10-29): its refresh makes
or updates `issues/57/mocks/<N>/` from R, shows it to the owner, and the
implementer starts after the owner's yes (with the owner away: the
recommended option, logged in `C:\Users\Ignat\.dhloot\notes\owner-afk-<date>\decisions.md`).
A mock drawn ahead (section 9) is re-checked at the refresh against the
merged `main`; the owner sees it again only if it changed. Each code batch
ends with its screenshot set: every changed surface at 360 and 1180 px, RU and
EN, from `npm run build:test`, into `issues/57/mocks/<N>/built/`.

| # | Batch | Audit, DEBT and exception ids | R states | Mock depends on | Split criterion |
|---|---|---|---|---|---|
| 1 | Foundation: font, ten-step ramp, tokens, neutral pressed default, badges, footer links, art well and kind glyph, share cards, clarity rule | C2 (type), C9, C11, C28, C33, C50, C55, C64, A10, A26, A39, N5, E1, E3, E5 (check) | all of `R/*` for type; `R/catalog` («Все»), `R/homebrew-items` (glyph); the share cards are new | none: the type, the ramp and the glyph are R's own; the share cards are new pictures | a review that cannot be held in one pass: it moves the text metrics of every route; layout work on top would hide its regressions |
| 2 | Shell: header, three jobs with icons, the mode row and the supplements menu, the account control, the wordmark, the pin and «Справка» labels, the toast, EN spelling | C6, C27, C34 (verify), C37, C47, C48, C52, A15 (verify), A27 (icons), A35, A36, A37, P7, P9, D9, D10, D11, N4, D121 | `R/header`, `R/shell-*`, `R/roller-supmenu` | none: R draws the header; the refresh adds the request toast and `/en/` | a public contract change (`routes.json` `tab`) and a public spec change (`ROUTES.md`, `FEATURES.md` "Chrome"); it needs a batch review |
| 3 | Catalog tables and filters | C1 (panel, ask), C2 («Все»), C3, C4, C5, C7, C8, C10, C12 (verify), C53, C54, C56, C57, C58, C59, A25, A40 (tables), P1, P13, P14, P15 | `R/catalog`, `R/catalog-*`, `R/pattern-empty` | none | a different route and filter set (`/tables/*`) |
| 4 | Record card, actions, item page, dialog, `/h/` | C17, C18, C19, C20, C21, C22, C40, C44 (verify), C45, C46, C63 (artefact, close), A23, A24, P4, P5, P6 | `R/item`, `R/item-dialog`, `R/item-nope`, `R/item-save-signedout`, `R/h-item`, `R/pattern-error` | none | a different component group and route (`/i/`, `/h/`, the dialog) |
| 5 | Roller pages and the card face on results | C23, C24, C25, C26, C36, C38 (panel, ask), C39, C41, C43, C49, P10, P11, N2 | `R/roller`, `R/roller-alt-crit`, `R/roller-mwt` | none: the mode row in the mock is R's; batch 2 ships it | a different route and filter set (`/roll/*`) |
| 6 | Homebrew editor, homebrew pages and imports (old 5 + 6, owner merge) | A6, A7, A8, A9 (verify), A11 (artefact, close), A12, A13, A27 (panel, ask), A28, A29, A30, A38, A40 (homebrew), D5, D14 (verify), D15, D16, editor clarity rows | `R/editor*`, `R/homebrew-*` | none: the refresh adds the Items-tab filter strip of `f74eae09` to `R/homebrew-items` | a different route and filter set (`/homebrew`, `/homebrew/<id>`) |
| 7 | Search, account, print preview, empty and error states | C13, C14, C15, C16, C29, C30, C31, C32, C60, A31, A32, A33, A34, D7, D8 (verify) | `R/search-*`, `R/account-*`, `R/print-preview`, `R/pattern-*` | none | different routes (`/search`, `/account`, `/p/`, the error pages) |
| 8 | Lists page `/lists`, list cards, lists import, add-to-list menu | A14, A16, A18, C35, C61, C62, D6, D20, D116 | `R/lists-*`, `R/item-listmenu` | none | a different route and filter set (`/lists`, and the add-to-list menu that the item pages open) |
| 9 | Account list page `/lists/<uuid>` and shared list page `/s/<token>` (old 9a + 10, owner merge) | A1, A2, A3, A4, A5, A19, A20, A21, A22, A40 (list rows, `/s/`), A41, A42, D2, N1, E2, E4, list clarity rows | `R/list`, `R/list-*`, `R/shared-*` | none | a review that cannot be held in one pass is accepted by the owner's merge; split from 8 by a different route and filter set |
| 10 | Lock: DESIGN.md "Notes", detector at zero, `design.json`, re-audit, closeout | E5 (record), E7, N3 (rest), every row re-checked | none | no mock | docs and closeout, unless the re-audit finds a defect |

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

Batch 1:

- E1: `overused-font: inter` leaves `.impeccable/config.json`;
  `impeccable detect --json app/src` reports no `overused-font`.
- E3: the three `.prettierignore` lines go; `prettier --file-info` reports
  each path `"ignored": true`; `npm run format:check` passes.
- E5: the batch searches for the writer of the `impeccable-hook-ignore` block
  (the installed Impeccable skill and CLI); found: the two `.gitignore` lines
  go; not found: they stay, and `handoff.md` names the search and its result.
- The Clarity Rule is in DESIGN.md (owner, 2026-10-29).
- The share cards are re-rendered in the new system (owner, 2026-10-29;
  section 10, step 9).
- No detector finding in a file the batch touches, except the advisories
  that batch 10 records (N3); the count of findings over `app/src` goes down.

Batch 2:

- The same-commit contract set: `docs/fixtures/urls/routes.json` with the new
  semantics (`tab` becomes the lit job: `roll`, `tables`, `search` or `null`,
  because «Бросок» has a dynamic `href`; a new `mode` field holds the lit mode
  control's canonical section, or `null` off the roll routes); the fixture
  keeps its internal `#/` strings and `tests/app/contracts.js` compares
  through `pathOf()`, as today; `app/src/lib/hash.test.ts`;
  `tests/contracts.js` where it asserts the fixture; `docs/specs/CONTRACTS.md`
  section 1; `docs/specs/ROUTES.md` "Sections"; the `COVERAGE.md` rows that name
  `routes.json`. `llms.txt` names no tab bar, so it changes only if the batch
  adds one. Gates: `node tests/run-all.js contracts,dataint` and `node
  tests/run-all.js app/contracts`. A batch review before the next batch.
- «Бросок» opens the last roll section of this tab. The memory holds the
  canonical section (`SECTION_SLUG` in `app/src/lib/hash.ts`), never the raw
  address, so `/roll/hnf` does not replay its source switch. `STATE.md`
  records it (memory only).
- Each old address lights the right job and mode: `/roll/core`, `/roll/hnf`
  and `/roll/all` light «Обычные правила»; `/roll/dread`, `/roll/voa` and every
  other supplement alias light «Дополнения ▾» with that supplement's name. Both
  sets are `routes.json` replay rows, with `/en/` twins where the fixture has
  them.
- Off the roll, tables and search routes no job is lit. The account control
  is lit on `/account`, `/lists`, `/lists/<uuid>` and `/homebrew` with its tabs
  (A37); nothing is lit on `/i/`, `/h/`, `/p/` and `/s/`.
- The header is measured at 360 and 1180 in both languages. The brand row and
  the job row stay sticky; the mode row scrolls with the page; the sticky part
  is no taller than today's 112 px at 360. `FEATURES.md` "Chrome" (the tab-bar
  bullets) and DESIGN.md "The Two Breakpoints Rule" take the measured figures.
- C48 removes `SupplementNav`: `SupplementNav.svelte`, `supplementNav.test.ts`,
  its `COVERAGE.md` row and its `a11y.test.ts` `COVERED` entry; rule 4's
  «Дополнения» departure and the `FEATURES.md` "Rolling" paragraph that cites
  the supplements panel are rewritten.
- The mode row has three controls at every width; «Дополнения ▾» opens a menu
  of the seven supplements (`nav.ts`), each a link to its section path; on a
  supplement page the chip shows that supplement's name in the current-place
  gold; at 360 a label may take two lines; the chip text matches the page
  heading (owner, 2026-10-23).
- Each job shows its icon before its label at every width: `die`, `table` and
  a new `search` (Material Icons, Apache 2.0) in `app/src/lib/icons.ts`.
- Rule 4 departure recorded: the mode chip «Альт. таблицы», the H1
  «Альтернативные таблицы».
- DESIGN.md records the EN wordmark «Loot», the header only; `<title>`, the
  manifest name and `en/index.html` keep their text.
- P7: one English spelling app-wide in the UI, American ("Color", "license"):
  `footSummary` and `printColor` in `dict.ts`, and the files that quote them
  (`shell.test.ts`, `printPage.test.ts`, `tests/app/print.js` `'Colour'`,
  `FEATURES.md` "Chrome"). The DPCGL notice keeps "License".
- One `docs/decisions/` file for the navigation: three jobs and the
  three-control mode row; rejected: the scrolling strip with a fade, B2's rail
  and bottom bar, B1's row of nine chips, one scrolling row of nine. Indexed.
- D121 (section 6).
- The language switch stays a control that rewrites the `/en` prefix with
  `replaceState`, not a link.
- The pin (house) and «?» by the H1 are labelled controls on every page that
  draws them (`PageHead.svelte`, `HelpButton.svelte`): the pin says what it
  does and shows its pinned state; «?» reads «Справка» / "Help". Each help
  panel's removal stays the owner's choice in its batch.
- The `TabBar.svelte` comment that counts six supplement sections goes with
  the component (N4).
- A new state: the «Дополнения ▾» menu open and the account menu with its
  chevron; each with an `inventory.js` entry, RU and EN goldens and an axe case.

Batch 3:

- The owner's answer on the tables help panel (C1).
- The C57 decision (where a temporary view choice lives) covers the `/p/`
  compact-sheet note (C31) too; batch 7 applies it.
- New states: the filter sheet open at 360 (its height with the on-screen
  keyboard open) and the selection mode («Выбрать»).
- P15: the grid name order is checked in EN.

Batch 4:

- New states: the «Ещё» menu open and the bottom-sheet dialog.
- C63 is closed by a live check of the rebuilt dialog's backdrop.

Batch 5:

- The owner's answer on the roller help panel (C38).
- N2: `orGrid.test.ts` gives its `<img>` a `src`, or the case uses no `<img>`.

Batch 6:

- The owner's answer on the homebrew help panel (A27).
- The editor conflict state keeps its rule: the primary does not overwrite the
  other device's changes (A30).
- The Items-tab filter strip of `f74eae09` adopts R's filter system.
- A11 is closed by a live check (the preview is already `sticky`).

Batch 7:

- The batch 3 C57 decision is applied to the `/p/` compact-sheet note (C31).
- The batch 4 error-page pattern is applied to `/i/nope`, `/h/` gone and the
  other error pages.

Batch 8:

- D116 (section 6).
- A18: `/lists/<uuid>` not found names a true cause (no browser lists exist
  after R10) and one next step, with a sign-in when signed out.
- A new state: the add-to-list menu in its new form.

Batch 9:

- E2: the `side-tab` entry for `ListPage.svelte` leaves
  `.impeccable/config.json`; the detector passes on `ListPage.svelte` and
  `HitNote.svelte` (N1) with no ignore.
- E4: `.impeccable/config.json` holds no `ignoreValues`; the `.prettierignore`
  line goes (the file is Prettier-formatted, or deleted if `impeccable detect`
  runs without it).
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

Batch 10:

- `ignoreValues` is empty and `impeccable detect --json app/src` reports
  nothing; any finding left is fixed, or recorded in DESIGN.md "Notes" with a
  reason and named to the owner.
- `.impeccable/design.json` is regenerated (Impeccable `document`).
- E5's outcome and every kept exception (E6, E8, E9) are listed in DESIGN.md
  "Notes" with their reasons.
- A defect that the re-audit finds goes to `docs/specs/DEBT.md` under the task
  that owes it and batch 10 stays docs only; or batch 10 fixes it in code and
  pays the full code gate (section 8).

Each of batches 2-9:

- Each new open or pressed state has its `tests/app/inventory.js` entry, a
  golden in RU and EN and an axe case (`expectNoA11yViolations`) in the same
  change.
- The owner's notes on its mock are applied, or named as rejected by the
  owner.
- Its `verify` rows are checked in a live browser before the code.
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
| 1 | `node tests/run-all.js app/print,app/typo,app/hues,stub` (about 5), `npm run check:built` (about 1), `npm run lint:untyped`, `npm run lint:typed`, `node --test tools/artwork/lib.test.mjs` (the `test:artwork` stage) (about 2), `node tools/artwork/cards.mjs --check` (about 1) | 9 |
| 2 | `node tests/run-all.js contracts,dataint` and `app/contracts` (6-7), `npm run check:built` (1) | 8 |
| 3-9 | `npm run check:built` where `dist` assets change (1) | 1 each |
| 10 | docs only: one `check:fast` and one docs-only CI run (no `e2e`) | about 20 in all |

Total: nine code batches at 45-60 min (405-540), plus 24 min of extra gates,
plus batch 10 at about 20: about 449-584 min, so about 7.5-9.7 hours of
gates. If batch 10 takes code, add 25-35 min. The owner's merges saved two
batches, about 90-120 min. Mock drawing (section 9) runs no gate.

## 9. Mock schedule

Every batch mock from 1 to 9 depends on no shipped batch: R's mocks already
draw the font, the ramp, the gold budget and the glyph, and every surface has
R states. So all nine can be drawn now, while the owner is present (owner,
2026-10-29). Batch 10 has no mock. The orchestrator dispatches the two units
after the plan review; they run in parallel because their folders are
disjoint and they run no gate.

Each unit, for each state: update the R state to `main`'s shape (path
addresses, `/en/`, five-tab removal, request toasts, the Items-tab filter),
render it at 360 and 1180 px in RU and EN (four PNGs), and add the batch's
`index.html` with the state list and the questions for the owner. Shared code
stays in `mocks/direction/shared/` and `R/` (read-only for both units); a
unit copies what it changes into its own batch folder. Neither unit commits:
the orchestrator commits `issues/57/mocks/` once both are done.

| Unit | Folders | Surfaces and states | PNGs | Cost |
|---|---|---|---|---|
| A (catalog side) | `mocks/1/`, `mocks/2/`, `mocks/3/`, `mocks/4/`, `mocks/5/`, `mocks/7/` | 1: both share cards (1200x630, RU and EN; no width set), a type and pressed-default specimen, the glyph on a card, a row, a tile, a list cover and the editor thumbnail. 2: `header`, `shell-signed-out`, `shell-account-menu`, `roller-supmenu`, the request toast with the (N) title. 3: `catalog`, `catalog-filtered`, `catalog-filters`, `catalog-grid`, `catalog-nothing`, `catalog-selection`, `pattern-empty`, and the help panel question. 4: `item`, `item-dialog`, `item-nope`, `item-save-signedout`, `h-item`, `pattern-error`. 5: `roller`, `roller-alt-crit`, `roller-mwt`, and the help panel question. 7: `search-empty`, `search-nothing`, `search-results`, `account-settings`, `account-delete`, `print-preview` | about 2 cards + 30 states x 4 = 122 | 2-3 hours |
| B (account side) | `mocks/6/`, `mocks/8/`, `mocks/9/` | 6: `editor`, `editor-errors`, `editor-crop`, `editor-conflict`, `homebrew-items` (with the filter strip), `homebrew-sources`, `homebrew-sets`, `homebrew-rules`, `homebrew-import`, and the help panel question. 8: `lists-index`, `lists-nope`, `lists-import`, `item-listmenu`. 9: `list`, `list-note`, `list-picked`, `list-prices`, `list-prices-none`, `list-prices-panel`, `list-requests`, `list-roll`, `list-selected`, `list-share`, `list-sold`, `shared-gm`, `shared-player` | 26 states x 4 = 104 | 2-3 hours |

Order to show them to the owner: 1, 2, 3, 4, 5, 6, 7, 8, 9 - batch order,
because each earlier mock fixes a rule that later ones reuse (the type and the
gold budget in 1, the header in 2, the row and the selection mode in 3, the
action vocabulary and the dialog in 4). Unit A's folders arrive first in that
order; unit B's follow. Within a mock the owner sees the questions first (the
help panels in 3, 5 and 6; the C57 choice in 3; the share card text in 1).

## 10. Batch 1 - Foundation (implement-ready after its mock step)

Objective: ship the new UI font, the ten-step ramp, the type and art tokens,
the neutral pressed state, the kind-glyph art well, the share cards in the
new system and the batch 1 DESIGN.md rules, with print unchanged. No layout
change.

Mock step: `mocks/1/` (section 9, unit A): the two share cards and the
specimen. The owner confirms them (or the recommended option, logged, if the
owner is away). Mock depends on: none.

In scope: tokens, the font package and its loading, the type sizes in every
component (mechanical, to the nearest step of section 4), the neutral pressed
default for `Chip` and `Seg`, the unique and roll-number badges, footer link
colour, the art well and glyph on every screen reader of `artSrc`, the share
cards, the DESIGN.md rules marked 1 in section 4, the `FEATURES.md` font
bullet, the font decision file, E1, E3, E5.
Out of scope: navigation, layouts, labels, help panels, print layouts, P7 in
the app (batch 2; the share card's own subtitle changes here, step 9).

Facts checked on `9112c4ed` (the old dispatch refresh list):

- `app/index.html` is root-absolute (`/data.js`, `/manifest.webmanifest`);
  Vite emits hashed files under `/assets/`; `CLAUDE.md` says "Keep URLs
  root-absolute".
- The language switch is a `Seg` control that rewrites the `/en` prefix.
- The `typo.js` seed opens `#/lists` and `LIST_A` as `gm4` (post-R10 form);
  batch 1 keeps it.
- Readers to move (`git grep -n -E "artSrc|var\(--ui\)|--h-page-size|--step-0"
  -- app/src tools/artwork`): `--step-0` in `tokens.css`, `AccountPage`,
  `ListCard`, `RequestsPanel`; `--h-page-size` in `ListPage`, `PageHead`,
  `PageTitle` and `tools/artwork/review/index.html`; `var(--ui)` in
  `PrintCard` (17 places), `BatchBar`, `ListPage`, `MarkupField`, `PickQty`,
  `RecordCard`, the review page; `artSrc` in `ArtField`, `ListCard`,
  `PrintCard`, `RecordActions`, `RecordCard`, `RowMain`, `TableRows`.
- The bundle budget is still 253 kB unconfigured and 311 kB configured
  (`tools/bundle-budget.mjs`); R10 removed code, so step 8 measures again.
- `app/public/sw.js` `ASSET_CAP` is 30.

Files expected:

- `package.json`, `package-lock.json`: devDependency
  `@fontsource-variable/source-sans-3`, exact version, through `npm install
  --save-dev --save-exact` (the lock file is hook-guarded; never by hand).
  Fallback, only if the package lacks the Cyrillic italic subset: woff2 files
  under `app/public/fonts/` with an `@font-face` in `tokens.css`.
- `app/src/main.ts`: import the package's upright and italic CSS before
  `tokens.css`.
- `app/index.html`: one `<link rel="preload" as="font" type="font/woff2"
  crossorigin>` for the upright Cyrillic and Latin subsets, if Vite rewrites
  it to the hashed `/assets/` file; else no preload, and `handoff.md` says why.
- `app/src/styles/tokens.css`: the tokens of section 4; `--ui` names the
  package family string; delete `--step-0` and `--h-page-size` after their
  readers move; `body` takes `var(--t-body)`.
- `tools/artwork/review/index.html`: `var(--h-page-size)` becomes
  `var(--t-page)`; nothing else.
- `app/src/components/PrintCard.svelte`: every `var(--ui)` becomes
  `var(--print-ui)`; nothing else.
- Components with a literal size: every `.svelte` file that `git grep -n -E
  "font(-size)?:.*[0-9.]+px" -- app/src/components` lists, mapped to the
  tokens. Mono stays for a quantity, a price, the number field, damage dice and
  a rung; the roll number and the stat line move to the UI face.
- `app/src/components/Chip.svelte`, `Seg.svelte`, `Button.svelte`: a neutral
  pressed state for a default option (a prop that callers pass for «Все» /
  "All" and for mode toggles): the `check` icon and a lit `--muted2` border, no
  gold; the icon and the label share one centre (`inline-flex`, `align-items:
  center`, one 16 px icon box, one gap). Callers moved here: the language
  switch (`Shell.svelte`), the tables list/grid switch (`TablesPage.svelte`),
  the print colour/black-and-white switch (`PrintSwitches.svelte`). Other
  callers move in their own batches.
- `app/src/components/Badge.svelte`: unique neutral dashed; roll number in the
  UI face.
- `app/src/components/Shell.svelte`: footer links `--muted`, underlined.
- `app/src/lib/icons.ts`: five filled 24 px paths, each with its family and
  name in the comment: `kindArmor` (Material Icons `shield`),
  `kindConsumable` (Material Icons `science`), `kindItem` (Material Icons
  `diamond`), `check` (Material Icons `check`), `kindWeapon` (Material
  Symbols `swords`). Each has a reader in this batch.
- `app/src/lib/label.ts`: `kindGlyph(kind, t)`: `t === 'armor'` gives
  `kindArmor`; `t === 'weapon'` or `'secondary'` gives `kindWeapon`; else
  `kind === 'consumable'` gives `kindConsumable`; else `kindItem`. One
  `label.test.ts` case per branch.
- `app/src/components/ArtWell.svelte` (new; five callers): the well
  (`--art-well`), the kind glyph through `Icon.svelte` at 42% of the well in
  `--line2`, `aria-hidden`, and a `children` snippet for the caller's `<img>`.
  Its own component test with `expectNoA11yViolations`, and an `a11y.test.ts`
  `COVERED` entry.
- Screen callers: `RecordCard.svelte`, `RowMain.svelte`, `TableRows.svelte`,
  `ListCard.svelte` (the cover strip) and `ArtField.svelte` (a `glyph` prop
  from `HomebrewEditor.svelte`). Each draws its `<img>` inside `ArtWell` only
  when `it.img` is set and `app.artBroken(it.id)` is false, else the glyph
  alone; while a picture loads the glyph shows under it. `artSrc` keeps its
  result (`img/_none.webp`), because print reads it.
- Kept on `_none.webp`: `PrintCard.svelte` and the editor's print preview.
  `RecordActions.svelte`: «Скопировать картинку» shows only when `it.img &&
  !app.artBroken(it.id)`, as today.
- Tests that pin `_none.webp`: `desc.test.ts` and `printPage.test.ts` stay;
  `homebrewEditor.test.ts` keeps its print-preview case; the screen cases of
  `record.test.ts`, `tables.test.ts`, `listsPage.test.ts` and
  `artField.test.ts` change to "no `<img>`, the glyph of the kind".
- `app/public/sw.js`: `ASSET_CAP` raised to hold the font files;
  `docs/specs/META.md` section 9 says so; `tests/sw.test.mjs` if it asserts
  the cap.
- `tools/bundle-budget.mjs`: only if the budget fails (step 8).
- `tests/app/typo.js`: `UI`, `SCALE`, the `document.fonts` check, and the
  icon-and-label centre check on the three moved switches.
- `app/src/components/chip.test.ts`, `shell.test.ts`: the neutral pressed case
  for `Chip` and for `Seg`, each ending with `expectNoA11yViolations`;
  `aria-pressed="true"` stays; the `check` icon is `aria-hidden`.
- Share cards (step 9): `tools/artwork/lib.mjs` (`CARD_FONT`, `shareCardSvg`
  colours, the EN subtitle "armor"), `tools/artwork/lib.test.mjs`,
  `tools/artwork/cards.mjs` (`TITLE_END`, `MIN_INK` if it moves, the messages
  that name Inter), `tools/artwork/fonts/` (the Source Sans 3 faces and their
  OFL licence replace the Inter files), `og/_share.jpg`, `og/_share_en.jpg`,
  `docs/artwork.md` "The site share cards".
- `DESIGN.md`: the rules marked 1 in section 4, the "Overview" font paragraph
  and "Key Characteristics", "Do's and Don'ts" (the sixteen-step line, the
  monospace line, "Don't declare an `@font-face`"), the frontmatter
  `typography` (the package family string, ten steps).
- `docs/specs/FEATURES.md` "Chrome": the bullet "Self-hosted fonts were
  considered and dropped ..." becomes the shipped fact.
- `docs/decisions/<date>-the-ui-font-is-source-sans-3-self-hosted.md` (from
  `.claude/templates/decision.template.md`): Task 57, the owner, 2026-10-23;
  rejected: PT Sans (no `tnum`), Golos Text (not verified), Inter (flagged),
  a font service (a third-party request). Then `node tools/decisions.js`.
- `.impeccable/config.json`: remove the Inter entry (E1).
- `.prettierignore`: remove the three lines of E3; keep `.impeccable/config.json`
  until batch 9 (E4).
- `.gitignore`: E5, only if the writer is found (step 7).
- `tests/app/inventory.js` and goldens: no new state; re-seed only what moves
  (the art well's text where a record has no picture).

Behaviour and UI constraints: the R states for the font, the sizes, the
neutral pressed chip (a check and a lit border, no gold:
`R/catalog__1180__ru.png`, the «Все» chips) and the glyph on the art well
(`R/homebrew-items__1180__ru.png`); the owner's confirmed `mocks/1/`; no layout
or label change; print output identical in layout (the print suite and
`check:built` prove it).

Steps:

1. Merge `main` into `claude/57` if `main` moved.
2. Add the font dependency and import it. Read the family name from the
   installed package CSS and use that exact string in `--ui`, `typo.js` `UI`
   and the DESIGN.md frontmatter. Confirm with a font parser that the upright
   and italic files carry Cyrillic. `npm run build:test`; confirm the woff2
   files land under `dist-test/assets/`.
3. Add the tokens; move `PrintCard.svelte` to `--print-ui` and the review page
   to `--t-page`; run `node tests/run-all.js app/print`.
4. Map every component size to the ramp; update `typo.js`; run `node
   tests/run-all.js app/typo`.
5. Add the five icon paths. Add the neutral pressed variant to `Chip`, `Seg`
   and `Button` with its component cases; move the three switches; badges;
   footer links.
6. Add `kindGlyph`, `ArtWell` and the five screen callers; keep `artSrc` and
   print on `_none.webp` (keep the file: the empty-state pattern uses it from
   batch 3); update the tests that pin it. Count the `img/` files with an alpha
   channel; if any, hide the glyph on the image's `load` event and say so in
   `handoff.md`.
7. Exceptions: E1 (remove the Inter ignore); E3 (remove the three
   `.prettierignore` lines; `npx prettier --file-info .impeccable/hook.cache.json`
   and the other two report `"ignored": true`); E5 (search the installed
   Impeccable skill and CLI for the code that writes `impeccable-hook-ignore`;
   if found and it writes on every host that runs the hook, remove the two
   `.gitignore` lines; else keep them; `handoff.md` names the outcome).
   Run `impeccable detect --json app/src` and compare the count with the
   re-check's 130.
8. `npm run build`, then `npm run budget`. If it fails: raise the budget to
   the measured total rounded up to the next whole kB in the same commit, with
   the reason in the `tools/bundle-budget.mjs` comment (owner, 2026-10-23);
   past 270 kB unconfigured or 350 kB configured, stop and ask the owner.
9. Share cards (owner, 2026-10-29). Prerequisite: Q1 answered.
   a. Put the static Source Sans 3 Regular and Semibold TTF faces and the OFL
      licence in `tools/artwork/fonts/` (from the source Q1 names), and delete
      the Inter files. Record each file's sha256 in `docs/artwork.md`.
   b. `CARD_FONT` becomes the family name that fontconfig reads from those
      files (expected `'Source Sans 3'`).
   c. `shareCardSvg`: the ground of `tokens.css` `body` (`--bg` `#0e0c15`
      under the violet `#251c3d` wash at the top left and the blue `#1b2b3d`
      wash at the top right), the title in `--txt` `#ece8f6`, the subtitle in
      `--muted` `#9b93b3`, «DAGGERHEART» in `--muted2` `#8a83a3` with letter
      spacing, as the header's brand line; gold only on the star (the brand
      mark, as `.brand-ico`). The layout stays.
   d. `CARD_TEXT.en.subtitle`: "armour" becomes "armor" (P7, American); RU
      does not change. Update `lib.test.mjs`.
   e. `cd tools/artwork && npm ci` (one-time setup, `docs/artwork.md`), then
      `node tools/artwork/cards.mjs`; measure each title's right edge and set
      `TITLE_END` to the measured value +-12 px; re-measure `MIN_INK`; replace
      "Inter" in the messages with the new family.
   f. Prove the guard: with `tools/artwork/fonts/` empty (a temporary rename),
      `node tools/artwork/cards.mjs --check` fails; restore it; `--check`
      prints `_share.jpg: ok` and `_share_en.jpg: ok`.
   g. Rewrite `docs/artwork.md` "The site share cards": the face, its source
      and hashes, the ground and gold, and that the text uses the app's UI
      family (the same family as `--ui`, as static faces).
   h. Open both JPEGs and compare them with the confirmed `mocks/1/` cards.
10. DESIGN.md rules and frontmatter (the Clarity Rule included), `FEATURES.md`
    "Chrome", the decision file, `node tools/decisions.js`.
11. Screenshot set: `npm run build:test`, then every route family at 360 and
    1180 px, RU and EN, into `issues/57/mocks/1/built/`, plus both share
    cards.
12. `rtk npm run check:fast` (Bash timeout 600000); `npm run lint:untyped`,
    `npm run lint:typed`, `node --test tools/artwork/lib.test.mjs` (the `test:artwork` stage) (`check:fast` runs none of
    them); commit, push, CI credit.

Acceptance criteria:

- The app renders in Source Sans 3 on a machine without it installed; no
  request leaves the origin for a font.
- In a real browser (`typo.js`), on a RU page and an EN page, the package face
  is in `document.fonts` with `status === 'loaded'`, and
  `document.fonts.check('16px "<family>"', text)` is true for a Cyrillic and a
  Latin sample.
- `typo.js` passes with the ten-step scale and the package family string.
- The print suite passes with no change to any print measurement.
- E1: `impeccable detect --json app/src` reports no `overused-font`, and
  `.impeccable/config.json` has no Inter entry.
- E3: `.prettierignore` has no `hook.cache.json`, `hook.pending.json` or
  `config.local.json` line, and `npm run format:check` passes.
- E5: `handoff.md` names the writer search and its outcome; the `.gitignore`
  lines are gone only if the writer was found.
- No detector finding in a file this batch touches, except the N3 advisories
  that batch 10 records; the total over `app/src` is below 130.
- A homebrew record with no picture, and a record whose picture is broken,
  shows the glyph of its kind on every screen surface (card, row, table tile,
  list cover, editor thumbnail); no screen surface shows the "?" pedestal; the
  print card and the editor's print preview still show `_none.webp`.
- «Скопировать картинку» is absent for a record with no picture or a broken
  one, as today.
- The language switch, the tables list/grid switch and the print
  colour/black-and-white switch show the neutral pressed state with no gold.
- On those three switches each icon's centre is within 1 px of its label's
  first line box, at 360 and 1180 (a browser check).
- `chip.test.ts` and `shell.test.ts` cover the neutral pressed state with
  `expectNoA11yViolations`; `ArtWell` has its own test and `COVERED` entry; the
  per-file coverage thresholds hold.
- `icons.ts` holds the five paths, each with its family, name and a reader;
  `label.test.ts` covers each `kindGlyph` branch.
- `package.json` pins `@fontsource-variable/source-sans-3` exactly, and the
  parser confirms Cyrillic in its upright and italic files.
- `npm run budget` passes, at today's budget or at a raise recorded in the same
  commit with its reason; `handoff.md` names the outcome.
- Both share cards are set in Source Sans 3 on the app's ground with gold on
  the star only; the EN subtitle reads "armor"; `node tools/artwork/cards.mjs
  --check` passes and fails with the fonts directory empty; `docs/artwork.md`
  names the new faces with their hashes and no longer says Inter.
- DESIGN.md holds the Clarity Rule, The Local Font Rule, The Numerals Rule,
  The Ten Steps Rule, the capitals rule, the Seal Rule budget, the icon-and-label
  rule and the art-well rule as section 4 states them, and no longer says
  "There are no webfonts"; `FEATURES.md` "Chrome" no longer says that
  self-hosted fonts were dropped; the decision file exists and
  `docs/DECISIONS.md` lists it.
- The screenshot set is in `issues/57/mocks/1/built/`.

Verification: `rtk npm run check:fast`; `node tests/run-all.js
app/print,app/typo,app/hues,stub`; `npm run check:built` (it runs the budget);
`npm run lint:untyped`; `npm run lint:typed`; `node --test tools/artwork/lib.test.mjs` (the `test:artwork` stage); `node
tools/artwork/cards.mjs --check`; `npx prettier --file-info` on the three E3
paths; `impeccable detect --json app/src`; push and CI credit (CI runs the
sweep at 360, 390, 768, 1180 and the golden shards).

Risks and do-nots:

- The ramp moves text widths everywhere; the sweep at 360 is the check. Do not
  change a layout to absorb it; list the overflow and fix the smallest cause.
- `TablesPage.svelte`'s scroll wait now waits for a real font; keep the wait
  and update its comment.
- The artwork review page gets the font through the same import or keeps the
  fallback; `handoff.md` names the outcome.
- Do not touch print layouts, `PrintPage` structure or `card-vectors.css`.
- Do not download a font file before the owner answers Q1.
- The share card's URL carries no version: Telegram keeps the cached card for
  the site root after a re-render (`META.md` section 8); that is expected.

Standing checks for batch 1:

1. Scale: no collection or cap changes. States:

   | State | Shows | Proof |
   |---|---|---|
   | every route at 360 and 1180, RU and EN | the new face and the ramp, no overflow | sweep, `typo.js` |
   | longest names (`Возвращающийся клинок`, a 100-character homebrew name) at 360 | wrapped inside its box | sweep |
   | a record with no picture, and one with a broken picture: card, row, tile, list cover, editor thumbnail | the kind glyph | component tests |
   | a picture loading | the glyph under the picture | component test |
   | print sheet, nine and sixteen per page | unchanged | print suite |
   | share cards, RU and EN | the new face on the app's ground | `cards.mjs --check` |

2. Error scenarios: the font fails to load - `swap` shows the fallback stack,
   nothing is stored; offline - the cached font or the fallback; a stale tab -
   the old bundle keeps its own font links; a revert - the previous frontend
   ignores the font files; a broken picture - the glyph. No stored data
   changes; no write path changes.
3. Consistency: `FEATURES.md` "Consistency rules" 1-20 unchanged; the three
   switches use the neutral pressed style. Interim departure: «Все» and the
   other default chips stay gold until batch 3 and their own batches; the mix
   does not reach `main` (one squash at closeout).
4. RU/EN parity: no app string changes (P7 in the app is batch 2); the glyph
   and the check carry no text; the share card EN subtitle changes "armour" to
   "armor", with the same facts as RU.

## 11. Standing checks for the plan

1. Scale: each batch from 2 on writes its States table at its refresh. The
   limits the changed screens draw: the list caps (100 entries, 50 lists), the
   homebrew caps (100 items, 20 sources, 30 sections), the seven supplements
   and nine roll modes. Sticky regions to measure: the header at 360 and 1180
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
   with one departure («Альт. таблицы», batch 2); rule 9 (the primary action
   first) drives the item and editor bars; rule 11 drives «Закрыть» on sheets;
   rule 20 drives D121 and every control that removes itself. The empty-state
   and error-page patterns give every load, empty and error state one shape.
4. RU/EN parity: the R states exist in EN for every batch mock (section 9);
   every new string has both languages and the same facts; P5, P6, P7, D11,
   D15 and D16 close named gaps; the EN wordmark is the header only.
5. New pressed and open states: each gets an `inventory.js` entry, a golden in
   RU and EN and an axe case in the same change. Known: batch 1, the neutral
   pressed `Chip` and `Seg` (component cases only; `aria-pressed` is
   unchanged, so no inventory state); batch 2, the «Дополнения ▾» menu and
   the account menu with its chevron; batch 3, the filter sheet and the
   selection mode; batch 4, the «Ещё» menu and the bottom sheet; batch 8, the
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
- Risk: the task branch lives for ten batches before one squash; each dispatch
  merges `main` first.
- Deferred: a print font change (owner's yes, own batch); the link-preview
  Worker's card images (`tools/share-card.mjs`); a Golos Text trial; the EN
  `<title>`, manifest name and `en/index.html` wordmark; `llms.txt` spelling
  (Q3).

## 13. Owner questions

- Q1 (blocks batch 1 step 9). The share cards need static Source Sans 3 TTF
  faces in `tools/artwork/fonts/`: fontconfig renders TTF, and the fontsource
  package ships woff2 only. Today the cards use Inter 4.1 TTF files taken from
  the Inter release archive.
  - Recommended: download `SourceSans3-Regular.ttf`, `SourceSans3-Semibold.ttf`
    and `LICENSE.md` (OFL 1.1) from the official Adobe release
    (`github.com/adobe-fonts/source-sans`, release 3.052R, `TTF/`; about 400
    KB per face). Reason: it is the face's own source, as Inter's were.
    Trade-off: two binary files in the repository, as today.
  - Alternative: keep Inter on the share cards and defer them. Then
    `docs/artwork.md` stays true only if it stops saying the cards use `--ui`'s
    family, and the cards keep the old ground.
- Q2 (default applies if no answer). The share card ground and gold:
  recommended: the app's own ground (the two `tokens.css` washes), gold on the
  star only, «DAGGERHEART» in `--muted2` as the header's brand line. Reason:
  the gold budget marks only a chosen thing, and the header already sets the
  brand line muted. Trade-off: the card loses its gold brand line.
  Alternative: keep «DAGGERHEART» gold.
- Q3 (default applies if no answer). P7 "one English spelling": today the UI
  has "Colour" and "licence", and `llms.txt` uses British spelling throughout
  ("armour", "Licence"). Recommended: American in the UI and the share cards
  only; `llms.txt` keeps its text. Reason: `llms.txt` is a public contract file
  and its readers are assistants, not the UI. Trade-off: two spellings across
  the repository. Alternative: change `llms.txt` too in batch 2, with the
  contract set.
- Q4 (default applies if no answer). Kept exceptions: E6 (`.gitignore`
  `config.local.json`, a credential guard), E8 (a gate selector), E9 (the mocks
  ESLint ignore). Recommended: keep all three and list them in DESIGN.md
  "Notes" at batch 10. E5 (the two hook-state `.gitignore` lines) goes only if
  batch 1 finds the code that writes the local exclude block. Alternative:
  remove E5 without the proof; a host where the hook runs without its exclude
  block would then show the files in `git status` and in the commit-gate
  fingerprint.

Settled, not asked again: the batch 9 merge is 9a + 10 (section 7, the
evidence); the shell is batch 2 (foundations first); D121 is batch 2 and D116
batch 8; the help panels stay until each batch mock asks.
