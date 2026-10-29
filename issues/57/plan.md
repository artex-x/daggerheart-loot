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
- Mocks: every batch mock from 1 to 9 is drawn ahead (section 9); the owner
  confirms each one before its implementer starts.
- Plan review: required before 1 (trigger: public contract changes in batch 2 - routes.json tab, llms.txt)
- Plan review findings applied: reviews/plan-1-2.md
  - B1, sections 5, 7 (batch 1), 10 and 13: E5 is kept (owner, 2026-10-29); its search step and acceptance line are gone; E3 still removes the three `.prettierignore` copies, because the kept `.gitignore` lines cover them.
  - B2, sections 5 and 7 (batch 9), 9: E2's cause is the reorder drop mark, not the notes; batch 9 redraws the mark as a gap line, keeps every `FEATURES.md` "Lists" drop rule, and proves it with `impeccable detect --no-config`; unit B draws a drag state; fallback a value-scoped ignore named to the owner.
  - B3, sections 2, 7 (batch 2), 8, 12 and 13: the whole American-spelling sweep is in batch 2 (owner: no batch 2b), with its file set, kept forms, word list, decision file, `I18N.md` rule, `llms.txt` contract set, hook selftest and batch review; batch 2's gate cost and the total are recomputed; "Each of batches 2-9" gains the spelling line; batch 10 re-runs the grep.
  - R1, sections 2 and 7 (batch 2): `tab` is read from `data-job`, `mode` is the canonical `#/roll/<URL id>` read from `data-section` and compared through `pathOf()`; the readers and `COVERAGE.md` rows are named; `tests/contracts.js` reads only `hash` (no change for `tab`); the `/en/` phrase became one `/en/roll/dread` probe; `tabBar.test.ts` and its `COVERAGE.md` row join the deletions.
  - R2, sections 7 (batch 9) and 9: an A1 acceptance line at 640-900 px with `sweep.js 768`; unit B renders `list`, `list-prices` and `shared-player` at 768; batch 9's screenshot set adds 768.
  - R3, sections 7 (batch 2), 9 and 13: the account menu keeps the `FEATURES.md` order with no counts in `mocks/2/`; an owner question at mock 2 (recommended: no counts).
  - R4, sections 7 (batches 1, 3, 4), 10 and 11: batch 1 gives the neutral pressed variant to `Seg` only; `Chip` moves to batch 3 («Все»); `Button` waits for its first caller.
  - R5, sections 7, 9 and 10: Impeccable `critique` with the Clarity Rule on each mock; `polish` and `harden` on the changed surfaces in batch 1 and each of 2-9; `audit` and `document` in batch 10.
  - R6, sections 5, 7 and 10: E11 (inline ignores: none, none may be added); every detector line runs `--no-inline-ignores` and `git grep -n impeccable-disable -- app/src` returns nothing.
  - R7, sections 1, 7 (batch 2) and 13: «Бросок» is an owner question at mock 2 (recommended: the last roll section of this tab, else the start section when it is a roll section, else `/roll/std`, with an `app.test.ts` case).
  - R8, sections 5 and 7 (batch 9): before E4's line goes, one edit with the hook live and an `impeccable detect` run leave `config.json` byte-identical and Prettier-clean; else E4 stays with that reason.
  - R9, section 9: a unit changes a shared pattern only in its owning batch folder and names it in that `index.html`; the orchestrator re-renders the dependent unit B states after mocks 2, 3 and 4 are confirmed.
  - N1, sections 5, 7 and 10: E1 reads "the stale ignore leaves"; the detector no longer claims to prove the font.
  - N2, section 10: the RU page asserts the face whose `unicodeRange` covers U+0400-045F is `loaded`, the EN page the face for U+0000-00FF; `document.fonts.check()` is gone.
  - N3, section 10: a `typo.js` request listener asserts every font request is same-origin under `/assets/`.
  - N4, section 9: the mocks use one pin pair with the same facts («Открывать при запуске» / "Open on start", «Открывается при запуске» / "Opens on start"); batch 2 takes it.
  - N5, section 9: `mocks/2/` draws the mode chip with the longest supplement names at 360, RU and EN.
  - N6, sections 7 (batch 2) and 9: `mocks/2/` draws the lit account control; unit B's headers use it.
  - N7, sections 9 and 10: `mocks/1/index.html` names the face it renders; step 9h compares against that face.
  - N8, section 7 (batch 2): the rule 4 departure names «Бросок» too.
  - N9, section 7: "Each of batches 2-9" gains the detector line.
  - N10, section 4: the empty-state row cites C60, not C59.
  - N11, section 7 (batches 3, 4, 7): the clarity inventory rows for «ЛИНЕЙКА», the `/h/` signed-out box and the account sentences are named.
  - N12, section 8: batch 2 takes CI's golden text (CI credit), or pays the four shards locally.
  - N13, section 10: step 9e uses `npm ci --prefix tools/artwork`.
  - N14, sections 5 and 7 (batch 10): detector exceptions stay in DESIGN.md "Notes"; the kept repository exceptions (E5, E6, E8, E9) go to `.claude/README.md`.
  - N15, section 7 (batch 10): intended literals become DESIGN.md frontmatter entries; a finding neither fixed nor documented is named to the owner.
  - N16, section 11: 3x and the card cap of 100 added.
  - N17, section 6: batch 8 removes the `DEBT.md` section "Tool UI redesign" with D116.
- Mock-unit findings folded into the same pass (2026-10-29, not a review):
  unit A - the share card's gold bottom rule goes (step 9c), the real `swords`
  glyph is checked at 36 px (step 5), C30 is an open screen-only question for
  batch 7, the questions Q1.1, R3, R7, Q3.1, Q3.2 and Q5.1 (section 13); unit
  B - the `/lists` panel (Q8.1), the editor's eight «?» (Q6.2), the list
  page's inline «?» (Q9.1), the `FEATURES.md` "Lists" gold selection line
  (batch 9), the position field and drag grip kept (batch 9), one page ground
  (section 10), R's `.rl.sel` side-tab not built (batch 3), three labelled
  controls in the item sheet bar (batch 4).
- NEEDS_HUMAN_CONFIRMATION: no for the plan - Q1-Q4 and the plan review's B1
  and B3 are answered (owner, 2026-10-29). The batch-mock questions of section
  13 (Q1.1, R3, R7, Q3.1, Q3.2, Q5.1, Q6.1, Q6.2, Q8.1, Q9.1) are asked at
  each mock.

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
| 4 | Navigation | Three jobs and the three-control mode row; «Бросок» opens the last roll section of this tab, else (owner question at mock 2, R7) the start section when it is a roll section, else `/roll/std`; the account control is «Войти» signed out and an initial with a chevron signed in, lit on its pages. |
| 5 | Type floor and caps | Ten steps (23, 20, 18, 16, 15, 14, 13, 12, 11.5, numeral 19); data text 13 px at the least; capitals only for section labels and badges. |
| 6 | Density | Rows: name with its tags after it, one stat line, one feature line; tags that repeat the active filter hidden; a selection mode («Выбрать») replaces the always-on checkbox column. |
| 7 | Missing art | The kind glyph on the art well for a record with no picture and while a picture loads; the "?" pedestal moves to empty states. |
| 8 | States | An empty or error page names the cause and one next step; a temporary choice lives where it is made, with no note; a dialog keeps its actions in a fixed bar. |

## 2. Scope, contracts and dependencies

- In scope: every row of `audit.md` (section 7 places each), every UI/UX
  entry of `docs/specs/DEBT.md` (section 6), every Impeccable exception
  (section 5), both languages, 360 to 1600 px, the two site share cards.
- Not in scope: print card layouts and sheets (product law); new features
  (so no counts in the account menu, R3); the per-item `og/<id>.jpg` (art
  only); the wording of the frozen `schema/*.json` files (`CONTRACTS.md`
  section 4: "the frozen schemas' descriptions keep their published
  wording").
- Contracts that stay: routes, ids, links, asset paths (`og/_share.jpg` and
  `og/_share_en.jpg` keep their paths; their bytes change), `data.js`.
- Public contract changes, both in batch 2:
  - `docs/fixtures/urls/routes.json` `resolves.tab` pins the lit tab of every
    route (today the `href` of `nav.tabs a[aria-current="page"]`, compared
    through `pathOf()`). The three jobs change that value on every roll route,
    and a new `mode` field joins it (section 7, batch 2).
  - `llms.txt` takes American spelling (owner, 2026-10-29, Q3), with
    `CONTRACTS.md` and `tests/contracts.js` in the same commit.
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
A mock drawn ahead (section 9) is re-checked at the refresh against the
merged `main`; the owner sees it again only if it changed. Before its
screenshot set, each code batch runs Impeccable `polish` and `harden` on the
surfaces it changed and gives the outcome in `handoff.md`. Each code batch
ends with its screenshot set: every changed surface at 360 and 1180 px, RU and
EN, from `npm run build:test`, into `issues/57/mocks/<N>/built/`.

| # | Batch | Audit, DEBT and exception ids | R states | Mock depends on | Split criterion |
|---|---|---|---|---|---|
| 1 | Foundation: font, ten-step ramp, tokens, neutral pressed default, badges, footer links, art well and kind glyph, share cards, clarity rule | C2 (type), C9, C11, C28, C33, C50, C55, C64, A10, A26, A39, N5, E1, E3 | all of `R/*` for type; `R/catalog` («Все»), `R/homebrew-items` (glyph); the share cards are new | none: the type, the ramp and the glyph are R's own; the share cards are new pictures | a review that cannot be held in one pass: it moves the text metrics of every route; layout work on top would hide its regressions |
| 2 | Shell: header, three jobs with icons, the mode row and the supplements menu, the account control, the wordmark, the pin and «Справка» labels, the toast; the American-spelling sweep across the repository (owner: no batch 2b) | C6, C27, C34 (verify), C37, C47, C48, C52, A15 (verify), A27 (icons), A35, A36, A37, P7, P9, D9, D10, D11, N4, D121 | `R/header`, `R/shell-*`, `R/roller-supmenu` | none: R draws the header; the refresh adds the request toast and `/en/` | public contract changes (`routes.json` `tab`, `llms.txt`) and public spec changes (`ROUTES.md`, `FEATURES.md` "Chrome", `I18N.md`); it needs a batch review (contracts, `.claude/hooks/`, prompts and agents changed) |
| 3 | Catalog tables and filters | C1 (panel, ask), C2 («Все»), C3, C4, C5, C7, C8, C10, C12 (verify), C53, C54, C56, C57, C58, C59, A25, A40 (tables), P1, P13, P14, P15 | `R/catalog`, `R/catalog-*`, `R/pattern-empty` | none | a different route and filter set (`/tables/*`) |
| 4 | Record card, actions, item page, dialog, `/h/` | C17, C18, C19, C20, C21, C22, C40, C44 (verify), C45, C46, C63 (artefact, close), A23, A24, P4, P5, P6 | `R/item`, `R/item-dialog`, `R/item-nope`, `R/item-save-signedout`, `R/h-item`, `R/pattern-error` | none | a different component group and route (`/i/`, `/h/`, the dialog) |
| 5 | Roller pages and the card face on results | C23, C24, C25, C26, C36, C38 (panel, ask), C39, C41, C43, C49, P10, P11, N2 | `R/roller`, `R/roller-alt-crit`, `R/roller-mwt` | none: the mode row in the mock is R's; batch 2 ships it | a different route and filter set (`/roll/*`) |
| 6 | Homebrew editor, homebrew pages and imports (old 5 + 6, owner merge) | A6, A7, A8, A9 (verify), A11 (artefact, close), A12, A13, A27 (panel, ask), A28, A29, A30, A38, A40 (homebrew), D5, D14 (verify), D15, D16, editor clarity rows | `R/editor*`, `R/homebrew-*` | none: the refresh adds the Items-tab filter strip of `f74eae09` to `R/homebrew-items` | a different route and filter set (`/homebrew`, `/homebrew/<id>`) |
| 7 | Search, account, print preview, empty and error states | C13, C14, C15, C16, C29, C30, C31, C32, C60, A31, A32, A33, A34, D7, D8 (verify) | `R/search-*`, `R/account-*`, `R/print-preview`, `R/pattern-*` | none | different routes (`/search`, `/account`, `/p/`, the error pages) |
| 8 | Lists page `/lists`, list cards, lists import, add-to-list menu | A14, A16, A18, C35, C61, C62, D6, D20, D116 | `R/lists-*`, `R/item-listmenu` | none | a different route and filter set (`/lists`, and the add-to-list menu that the item pages open) |
| 9 | Account list page `/lists/<uuid>` and shared list page `/s/<token>` (old 9a + 10, owner merge) | A1, A2, A3, A4, A5, A19, A20, A21, A22, A40 (list rows, `/s/`), A41, A42, D2, N1, E2 (the drop mark), E4, list clarity rows | `R/list`, `R/list-*`, `R/shared-*` | none | a review that cannot be held in one pass is accepted by the owner's merge; split from 8 by a different route and filter set |
| 10 | Lock: DESIGN.md "Notes", detector at zero, `design.json`, re-audit, closeout | E5, E6, E8, E9 (record), E7, E11, N3 (rest), every row re-checked | none | no mock | docs and closeout, unless the re-audit finds a defect |

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

- E1: the stale `overused-font: inter` ignore leaves `.impeccable/config.json`.
- E3: the three `.prettierignore` lines go; `prettier --file-info` reports
  each path `"ignored": true`; `npm run format:check` passes. E5 stays
  (owner).
- The Clarity Rule is in DESIGN.md (owner, 2026-10-29).
- The share cards are re-rendered in the new system (owner, 2026-10-29;
  section 10, step 9), with the owner's answer to Q1.1 (the card text) applied.
- No detector finding (`impeccable detect --json --no-inline-ignores`) in a
  file the batch touches, except the advisories that batch 10 records (N3);
  the count over `app/src` goes down; `git grep -n impeccable-disable -- app/src`
  returns nothing (E11).
- Impeccable `polish` and `harden` ran on the changed surfaces; `handoff.md`
  gives the outcome.

Batch 2:

- The same-commit `routes.json` contract set (plan review R1):
  - `resolves.tab` becomes the lit job: `"roll"`, `"tables"`, `"search"` or
    `null` («Бросок» has a dynamic `href`). `tests/app/contracts.js` reads it
    from `data-job` on the lit job link and compares it as a plain string.
  - A new `resolves.mode` holds the lit mode control's canonical route key,
    `#/roll/<URL id>` (for example `#/roll/vault_of_ages` for `/roll/voa`), or
    `null` off the roll routes. `tests/app/contracts.js` reads it from
    `data-section` on the mode control that carries `aria-current`, the
    «Дополнения ▾» menu button included, and compares it through `pathOf()`.
  - Readers that change: `tests/app/contracts.js`, `app/src/lib/hash.test.ts`
    (today `fx.resolves.tab === '#/tables'` becomes `'tables'`).
    `tests/contracts.js` and `address.test.ts` read only `hash`: no change for
    `tab`.
  - `docs/specs/CONTRACTS.md` section 1 gains one sentence: "`routes.json`
    pins each route's resolved address, its lit job and its lit mode."
    `docs/specs/ROUTES.md` "Sections" names the jobs and the mode row.
  - `COVERAGE.md`: the row at "`hash.test.ts`" and the row "Route resolution
    had no fixture" (its "28 shapes" is stale: 97 rows).
  - One `/en/roll/dread` probe in `tests/app/contracts.js` (`routes.json` has
    no `/en/` row).
  - Gates: `node tests/run-all.js contracts,dataint` and `node
    tests/run-all.js app/contracts`. A batch review before the next batch.
- «Бросок»: the memory holds the canonical section (`SECTION_SLUG` in
  `app/src/lib/hash.ts`), never the raw address, so `/roll/hnf` does not
  replay its source switch; `STATE.md` records it (memory only). Owner
  question at mock 2 (plan review R7). Recommended: the last roll section of
  this tab, else the start section when it is a roll section, else
  `/roll/std`, with a case in `app/src/state/app.test.ts`. Alternative: the
  last roll section, else `/roll/std`, with the reason named. The batch ships
  the owner's answer.
- Each old address lights the right job and mode: `/roll/core`, `/roll/hnf`
  and `/roll/all` light «Обычные правила»; `/roll/dread`, `/roll/voa` and every
  other supplement alias light «Дополнения ▾» with that supplement's name. Both
  sets are `routes.json` replay rows.
- The account menu keeps the `FEATURES.md` "Chrome" order («Аккаунт», «Мои
  списки», «Мои предметы», then «Выйти») with no counts (plan review R3). R's
  menu adds «Вы вошли как ...» and counts; that is a new feature (two reads on
  every page, their load and failure states, a rule 1 departure). Owner
  question at mock 2; recommended: no counts. If the owner wants them, the
  batch refresh names the reads, the failure states, the rule 1 departure and
  both languages.
- The account control has a lit state on its pages (A37), drawn in
  `mocks/2/` (plan review N6).
- Off the roll, tables and search routes no job is lit. The account control
  is lit on `/account`, `/lists`, `/lists/<uuid>` and `/homebrew` with its tabs
  (A37); nothing is lit on `/i/`, `/h/`, `/p/` and `/s/`.
- The header is measured at 360 and 1180 in both languages. The brand row and
  the job row stay sticky; the mode row scrolls with the page; the sticky part
  is no taller than today's 112 px at 360. `FEATURES.md` "Chrome" (the tab-bar
  bullets) and DESIGN.md "The Two Breakpoints Rule" take the measured figures.
- C48 removes `SupplementNav`: `SupplementNav.svelte`, `supplementNav.test.ts`,
  its `COVERAGE.md` row and its `a11y.test.ts` `COVERED` entry; `TabBar.svelte`
  gives way to the job row, and `tabBar.test.ts` and its `COVERAGE.md` row go
  with it (plan review R1); rule 4's
  «Дополнения» departure and the `FEATURES.md` "Rolling" paragraph that cites
  the supplements panel are rewritten.
- The mode row has three controls at every width; «Дополнения ▾» opens a menu
  of the seven supplements (`nav.ts`), each a link to its section path; on a
  supplement page the chip shows that supplement's name in the current-place
  gold; at 360 a label may take two lines; the chip text matches the page
  heading (owner, 2026-10-23).
- Each job shows its icon before its label at every width: `die`, `table` and
  a new `search` (Material Icons, Apache 2.0) in `app/src/lib/icons.ts`.
- Rule 4 departures recorded: the mode chip «Альт. таблицы» against the H1
  «Альтернативные таблицы»; the job «Бросок» names a group of nine roll pages
  and has no page heading of its own (plan review N8).
- DESIGN.md records the EN wordmark «Loot», the header only; `<title>`, the
  manifest name and `en/index.html` keep their text.
- P7 and the American-spelling sweep (owner, 2026-10-29, Q3 and plan review
  B3: everywhere, in batch 2, no batch 2b; the owner accepts the longer batch 2
  review). One English spelling, American, in every file that can change
  without breaking data or a frozen contract:
  - The UI: `footSummary` and `printColor` in `dict.ts` and the files that
    quote them (`shell.test.ts`, `printPage.test.ts`, `tests/app/print.js`
    `'Colour'`, `FEATURES.md` "Chrome"); the two EN head descriptions in
    `tools/build-share-pages.js` ("weapons and armour", the `en/index.html` and
    `i/en/*.html` link previews) and `tools/build-pages.js` (the Terms page,
    "the licence for the game content"), then `node tools/build.js`
    (`tests/derived.js` checks the heads).
  - The public contract file `llms.txt` (15 lines: "armour", "colour",
    "catalogue", "## Licence", "Recognising") with `docs/specs/CONTRACTS.md`
    and `tests/contracts.js` (line 187 pins `'| Artefact | Field | Carries |'`)
    in the same commit; `docs/fixtures/`: no change expected (no fixture that
    `llms.txt` quotes holds a British form; `from-llms.json` keys and the value
    "Armour" are data and stay); state it in the commit.
  - Developer docs: `README.md` with `tests/derived.js` (line 1612 matches
    `fall\s+outside that licence`), `docs/specs/*`, `DESIGN.md`, `PRODUCT.md`,
    `docs/artwork.md`, `.claude/README.md`.
  - AI-facing files: `.claude/prompts/`, `.claude/skills/`, `.claude/agents/`,
    `.claude/templates/`, `CLAUDE.md` (respelling only, no new rule line:
    `CLAUDE.md` "Maintaining this file").
  - Code comments, test titles and `.claude/hooks/*.mjs` (owner: minimise
    British); `node .claude/hooks/selftest.mjs` runs in `check:fast` when
    `.claude/` changes, and a hook change is its own review trigger.
  - `tools/decisions.js` (line 45 writes "Behaviour decisions"), then `node
    tools/decisions.js` renders `docs/DECISIONS.md` again.
  - Kept, each named in the decision file: identifiers and stored values
    (`VectorPaint` `'colour'` in `cardVectors.ts`, CSS class names such as
    `.foot-licence`, fixture keys, inventory ids and golden file names such as
    `~ colour for this visit`, decision file names and titles, which
    `tools/decisions.js` checks by path and title); the frozen `schema/*.json`
    wording (`CONTRACTS.md` section 4); quotations and records (earlier
    decision bodies, commit messages, the DPCGL text, source-book text in
    `data.js`, log excerpts); the `issues/57/` scratch.
  - Sizing on `deaa7989`: the grep below hits about 1330 lines in 529 files
    outside `issues/` and `schema/`; about 475 of them are goldens (340
    "licence" from `footSummary`, re-seeded, not edited by hand) and 60 are
    earlier decision bodies (kept). The batch refresh re-runs the count.
  - One decision file (`.claude/templates/decision.template.md`): American
    spelling everywhere; rejected: British everywhere, and the plan's earlier
    "UI only" default; the kept forms above; the word list for the grep:
    `colour|armour|licence|behaviour|catalogue|artefact|favour|honour|centre|\bgrey|recognis|organis|summaris|normalis|initialis|serialis|customis|prioritis|minimis|optimis|analys(e|ed|ing)\b|judgement|travell|modell|labell`.
    Then `node tools/decisions.js`.
  - `docs/specs/I18N.md` gains the rule: English text uses American spelling;
    the kept forms are the decision file's.
  - Acceptance: `git grep -n -i -E "<the word list>"` over the paths in scope
    returns only the kept forms the decision file names. The DPCGL notice
    keeps its own "License". Optional, recommended: a `tests/derived.js` check
    of the EN strings in `dict.ts` and of `llms.txt` against the word list, so
    the rule holds after closeout.
  - Risk: a hook guard may refuse a write under `.claude/`; the implementer
    stops and returns the text for the orchestrator (`CLAUDE.md`, "Task and
    session protocol").
- One `docs/decisions/` file for the navigation: three jobs and the
  three-control mode row; rejected: the scrolling strip with a fade, B2's rail
  and bottom bar, B1's row of nine chips, one scrolling row of nine. Indexed.
- D121 (section 6).
- The language switch stays a control that rewrites the `/en` prefix with
  `replaceState`, not a link.
- The pin (house) and «?» by the H1 are labelled controls on every page that
  draws them (`PageHead.svelte`, `HelpButton.svelte`): the pin says what it
  does and shows its pinned state with the same facts in both languages
  («Открывать при запуске» / "Open on start", pinned «Открывается при
  запуске» / "Opens on start"; plan review N4); «?» reads «Справка» / "Help".
  Each help panel's removal stays the owner's choice in its batch.
- The `TabBar.svelte` comment that counts six supplement sections goes with
  the component (N4).
- A new state: the «Дополнения ▾» menu open and the account menu with its
  chevron; each with an `inventory.js` entry, RU and EN goldens and an axe case.

Batch 3:

- Q3.1, the owner's answer on the tables help panel (C1), is applied
  (section 13).
- Q3.2, the C57 decision (where a temporary view choice lives), is applied; it
  covers the `/p/` compact-sheet note (C31) too, which batch 7 applies.
- New states: the filter sheet open at 360 (its height with the on-screen
  keyboard open) and the selection mode («Выбрать»).
- P15: the grid name order is checked in EN.
- `Chip` gets the neutral pressed variant (the `check` icon, a lit `--muted2`
  border, the icon-and-label centre) with its `chip.test.ts` case ending in
  `expectNoA11yViolations`; «Все» / "All" is its first caller (plan review R4).
- Clarity inventory: the «ЛИНЕЙКА» row name on `/tables` (and `/s/` in batch
  9) says upgrade chains or uniques (plan review N11).
- The selected row in the selection mode is a lit border and a check, never a
  one-side accent: R's `.rl.sel { box-shadow: inset 3px 0 0 var(--muted2) }` is
  a `side-tab` and is not built (mock unit B, 2026-10-29).

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

Batch 5:

- Q5.1, the owner's answer on the roller help panel (C38), is applied
  (section 13).
- N2: `orGrid.test.ts` gives its `<img>` a `src`, or the case uses no `<img>`.

Batch 6:

- Q6.1, the owner's answer on the homebrew help panel (A27), is applied
  (section 13).
- Q6.2, the owner's answer on the eight field «?» buttons of the editor, is
  applied; a kept hint is named with its reason, and `FEATURES.md` rules 15 (c)
  and 18 change with a removal (section 13).
- The editor conflict state keeps its rule: the primary does not overwrite the
  other device's changes (A30).
- The Items-tab filter strip of `f74eae09` adopts R's filter system.
- A11 is closed by a live check (the preview is already `sticky`).

Batch 7:

- The batch 3 C57 decision is applied to the `/p/` compact-sheet note (C31).
- The batch 4 error-page pattern is applied to `/i/nope`, `/h/` gone and the
  other error pages.
- Clarity inventory, account: the settings scope sentence, the notify
  question, the ZIP manual (A33) and the «Выйти везде» note become labels that
  say it (plan review N11).
- C30, the print preview at 360: the sheet stays scaled to about 313 px and
  its cards are unreadable. Print layouts are product law, so only the screen
  preview may change. Open screen-only question for the batch 7 refresh
  (mock unit A, 2026-10-29); the refresh names the options and asks the
  owner at mock 7.

Batch 8:

- D116 (section 6).
- A18: `/lists/<uuid>` not found names a true cause (no browser lists exist
  after R10) and one next step, with a sign-in when signed out.
- A new state: the add-to-list menu in its new form.
- Q8.1, the owner's answer on the `/lists` «Справка» panel (`help.ts`
  `LISTS`), is applied: removed with `help.ts`, its tests and the
  `#/lists ~ help` inventory state and goldens, or kept behind «Справка»
  (section 13).

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
- Q9.1, the owner's answer on the list page's inline «?» buttons (the price
  display, the notes, the price field), is applied; the money, price and note
  help states of `inventory.js` (`LIST_A ~ money help`, `~ price help`, `~ note
  help`) leave with a removal, with their goldens (section 13).
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
  only the kept forms.
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
- Impeccable `polish` and `harden` ran on its changed surfaces before the
  screenshot set; `handoff.md` gives the outcome (plan review R5).
- No detector finding (`impeccable detect --json --no-inline-ignores`) in a
  file it touches, except the N3 advisories that batch 10 records; no
  `impeccable-disable` comment added (plan review N9, R6).
- New prose, comments and test titles use American spelling (the batch 2
  decision file).
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
| 2 | `node tests/run-all.js contracts,dataint` and `app/contracts` (6-7); `npm run check:built` (1); `node tools/build.js` and `node tools/decisions.js` (1); `npm run lint:untyped` and `npm run lint:typed` (2, comments in `.mjs` and `.ts` files); the hook selftest inside each `check:fast` because `.claude/hooks/` changes (253-563 s, so 4-9 per run, two runs with the fix cycle: 8-18); the longer review of the spelling diff in its fix cycle (about 5-10); the goldens: every golden moves (the header, `footSummary`), so the batch takes CI's golden text (CI credit), or pays the four shards locally (4 x 3-4 = 12-16) | 25-55 |
| 3-9 | `npm run check:built` where `dist` assets change (1) | 1 each |
| 10 | docs only: one `check:fast` and one docs-only CI run (no `e2e`) | about 20 in all |

Total: nine code batches at 45-60 min (405-540), plus 41-71 min of extra
gates (batch 1: 9; batch 2: 25-55; batches 3-9: 7), plus batch 10 at about
20: about 466-631 min, so about 7.8-10.5 hours of gates. If batch 10 takes
code, add 25-35 min. The owner's merges saved two batches (about 90-120 min);
keeping the spelling sweep in batch 2 instead of a batch 2b saves one CI run
and one review (about 30 min). Mock drawing (section 9) runs no gate.

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

Shared patterns (plan review R9): a unit changes a shared pattern only in the
folder of the batch that owns it - 2: the header and the account control; 3:
the row, the filter strip and sheet, the selection mode; 4: «Ещё», the dialog,
the error page - and names each change in that folder's `index.html`. Unit B's
states that reuse them (`mocks/6/`, `8/`, `9/`) draw R's form first; the
orchestrator re-renders those dependent unit B states after the owner
confirms mocks 2, 3 and 4, and shows the owner only what changed.

Plan review additions to the units (the orchestrator sends them):

- Both units: Impeccable `critique` with the Clarity Rule on each mock before
  the owner sees it, its outcome in the `index.html` (R5); the pin pair
  «Открывать при запуске» / "Open on start" and «Открывается при запуске» /
  "Opens on start" on every page head (N4); the lit account control on its
  pages (N6).
- Unit A: `mocks/1/index.html` names the face that renders the specimen and
  the cards (the mocks use the Source Sans Pro files of
  `C:\Users\Ignat\.dhloot\notes\57\fonts\` until the Q1 download gives Source
  Sans 3; N7); `mocks/2/` keeps the `FEATURES.md` account menu order with no
  counts and asks R3 and R7 as questions (R3, R7), and draws the mode chip
  with the longest supplement names at 360 in RU and EN («Предметы сообществ»,
  "Wondrous Environments", "Many Worlds Tavern"; N5); `mocks/7/` shows the EN
  print segment "Color" on `account-settings` and `print-preview` (B3);
  `mocks/3/`, `4/` and `7/` draw the clarity rows of N11 («ЛИНЕЙКА», the `/h/`
  signed-out box, the account sentences).
- Unit B: `mocks/9/` adds a drag state - a drop between two rows, one with an
  open note (B2) - and 768 px renders (RU and EN) of `list`, `list-prices` and
  `shared-player` (R2).
- Mock-unit follow-ups (2026-10-29): unit B's folders 6, 8 and 9 use the
  `tokens.css` ground (section 10, "One page ground"); no copy keeps R's
  `.rl.sel` side-tab (a lit border and a check instead); `mocks/9/` draws the
  position field and the drag grip; `mocks/4/` draws the item sheet bar as
  three labelled controls with nothing cut at 360; `mocks/1/` drops the share
  card's gold bottom rule; each open question of section 13 sits in its
  mock's `index.html`.

| Unit | Folders | Surfaces and states | PNGs | Cost |
|---|---|---|---|---|
| A (catalog side) | `mocks/1/`, `mocks/2/`, `mocks/3/`, `mocks/4/`, `mocks/5/`, `mocks/7/` | 1: both share cards (1200x630, RU and EN; no width set), a type and pressed-default specimen, the glyph on a card, a row, a tile, a list cover and the editor thumbnail. 2: `header`, `shell-signed-out`, `shell-account-menu`, `roller-supmenu`, the request toast with the (N) title. 3: `catalog`, `catalog-filtered`, `catalog-filters`, `catalog-grid`, `catalog-nothing`, `catalog-selection`, `pattern-empty`, and the help panel question. 4: `item`, `item-dialog`, `item-nope`, `item-save-signedout`, `h-item`, `pattern-error`. 5: `roller`, `roller-alt-crit`, `roller-mwt`, and the help panel question. 7: `search-empty`, `search-nothing`, `search-results`, `account-settings`, `account-delete`, `print-preview` | about 2 cards + 30 states x 4 = 122 | 2-3 hours |
| B (account side) | `mocks/6/`, `mocks/8/`, `mocks/9/` | 6: `editor`, `editor-errors`, `editor-crop`, `editor-conflict`, `homebrew-items` (with the filter strip), `homebrew-sources`, `homebrew-sets`, `homebrew-rules`, `homebrew-import`, and the help panel question. 8: `lists-index`, `lists-nope`, `lists-import`, `item-listmenu`. 9: `list`, `list-note`, `list-picked`, `list-prices`, `list-prices-none`, `list-prices-panel`, `list-requests`, `list-roll`, `list-selected`, `list-share`, `list-sold`, `shared-gm`, `shared-player` | 26 states x 4 = 104 | 2-3 hours |

Order to show them to the owner: 1, 2, 3, 4, 5, 6, 7, 8, 9 - batch order,
because each earlier mock fixes a rule that later ones reuse (the type and the
gold budget in 1, the header in 2, the row and the selection mode in 3, the
action vocabulary and the dialog in 4). Unit A's folders arrive first in that
order; unit B's follow. Within a mock the owner sees the questions first (the
help panels in 3, 5 and 6; the C57 choice in 3; the share card text in 1; R3
and R7 in 2).

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
default for `Seg` only (its three callers move here; `Chip` waits for «Все» in
batch 3 and `Button` for its first caller, plan review R4), the unique and
roll-number badges, footer link colour, the art well and glyph on every
screen reader of `artSrc`, the share cards (Q1 and Q2 answered), the DESIGN.md
rules marked 1 in section 4, the `FEATURES.md` font bullet, the font decision
file, E1, E3. E5 stays (owner).
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
- `app/src/components/Seg.svelte`: a neutral pressed state for a mode toggle
  (a prop that the callers pass): the `check` icon and a lit `--muted2` border,
  no gold; the icon and the label share one centre (`inline-flex`,
  `align-items: center`, one 16 px icon box, one gap). Callers moved here, all
  `Seg`: the language switch (`Shell.svelte`), the tables list/grid switch
  (`TablesPage.svelte`), the print colour/black-and-white switch
  (`PrintSwitches.svelte`). `Chip.svelte` and `Button.svelte` do not change
  here (plan review R4).
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
- `tests/app/typo.js`: `UI`, `SCALE`, the face check (plan review N2: on the
  RU page the `FontFace` whose `unicodeRange` covers U+0400-045F has `status
  === 'loaded'`; on the EN page the one for U+0000-00FF), a request listener
  that asserts every font request is same-origin under `/assets/` (N3), and
  the icon-and-label centre check on the three moved switches.
- `app/src/components/shell.test.ts`: the neutral pressed case for `Seg`,
  ending with `expectNoA11yViolations`; `aria-pressed="true"` stays; the
  `check` icon is `aria-hidden`.
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
- `.impeccable/config.json`: remove the stale Inter entry (E1).
- `.prettierignore`: remove the three lines of E3; keep `.impeccable/config.json`
  until batch 9 (E4).
- `.gitignore`: no change (E5 and E6 stay, owner).
- `tests/app/inventory.js` and goldens: no new state; re-seed only what moves
  (the art well's text where a record has no picture).

Behaviour and UI constraints: the R states for the font, the sizes, the
neutral pressed chip (a check and a lit border, no gold:
`R/catalog__1180__ru.png`, the «Все» chips) and the glyph on the art well
(`R/homebrew-items__1180__ru.png`); the owner's confirmed `mocks/1/`; no layout
or label change; print output identical in layout (the print suite and
`check:built` prove it).

One page ground (mock unit B, 2026-10-29): R's `shared/base.css` and
`tokens.css` `body` draw the ground as two radial washes; unit B drew
`linear-gradient(180deg, var(--bg2) 0, var(--bg) 520px)` instead, because the
detector flagged `radial-halo` on its mock pages. Decision: keep the
`tokens.css` ground (`--bg` under the violet `#251c3d` and blue `#1b2b3d`
washes). Reason: it is the shipped ground that DESIGN.md "Neutral" records,
and `impeccable detect --json --no-config` passes on `tokens.css` (checked
2026-10-29, `[]`). Trade-off: unit B's folders 6, 8 and 9 re-render on that
ground. Batch 1 confirms it: if the detector reports `radial-halo` for the
app (step 7), the ground becomes unit B's linear gradient in `tokens.css`,
DESIGN.md "Neutral" and the share cards together, named in `handoff.md`. The
share cards (step 9c) take the same ground either way.

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
5. Add the five icon paths. Check the real Material Symbols `swords` path at
   36 px on the art well (the mock used a stand-in; mock unit A, 2026-10-29)
   and name the outcome in `handoff.md`; if it does not read as a weapon at
   that size, take the closest Material Symbols weapon glyph and name it. Add
   the neutral pressed variant to `Seg` with its `shell.test.ts` case; move the
   three switches; badges; footer links.
6. Add `kindGlyph`, `ArtWell` and the five screen callers; keep `artSrc` and
   print on `_none.webp` (keep the file: the empty-state pattern uses it from
   batch 3); update the tests that pin it. Count the `img/` files with an alpha
   channel; if any, hide the glyph on the image's `load` event and say so in
   `handoff.md`.
7. Exceptions: E1 (remove the stale Inter ignore); E3 (remove the three
   `.prettierignore` lines; `npx prettier --file-info .impeccable/hook.cache.json`
   and the other two report `"ignored": true`). Run `impeccable detect --json
   --no-inline-ignores app/src` and compare the count with the re-check's 130;
   `git grep -n impeccable-disable -- app/src` returns nothing (E11).
8. `npm run build`, then `npm run budget`. If it fails: raise the budget to
   the measured total rounded up to the next whole kB in the same commit, with
   the reason in the `tools/bundle-budget.mjs` comment (owner, 2026-10-23);
   past 270 kB unconfigured or 350 kB configured, stop and ask the owner.
9. Share cards (owner, 2026-10-29; Q1 and Q2 answered).
   a. Download `SourceSans3-Regular.ttf`, `SourceSans3-Semibold.ttf` and the
      OFL `LICENSE.md` from github.com/adobe-fonts/source-sans, release
      3.052R, `TTF/` (owner's yes, Q1), into `tools/artwork/fonts/`; first
      confirm the release holds those paths (not checked by the plan review);
      delete the Inter files. Record each file's sha256 in `docs/artwork.md`.
   b. `CARD_FONT` becomes the family name that fontconfig reads from those
      files (expected `'Source Sans 3'`).
   c. `shareCardSvg`: the ground of `tokens.css` `body` (`--bg` `#0e0c15`
      under the violet `#251c3d` wash at the top left and the blue `#1b2b3d`
      wash at the top right), the title in `--txt` `#ece8f6`, the subtitle in
      `--muted` `#9b93b3`, «DAGGERHEART» in `--muted2` `#8a83a3` with letter
      spacing, as the header's brand line; gold only on the star (the brand
      mark, as `.brand-ico`). The 6 px gold bottom rule (the `rect` at
      `y="624"`) goes, under the gold budget, as `mocks/1/` draws it (mock
      unit A, 2026-10-29); `MIN_INK` is re-measured without it (step 9e). The
      rest of the layout stays. The card text follows the owner's answer to
      Q1.1 (section 13).
   d. `CARD_TEXT.en.subtitle`: "armour" becomes "armor" (P7, American); RU
      does not change. Update `lib.test.mjs`.
   e. `npm ci --prefix tools/artwork` (the one-time setup of `docs/artwork.md`;
      no `cd`, which would move the session's working directory), then
      `node tools/artwork/cards.mjs`; measure each title's right edge and set
      `TITLE_END` to the measured value +-12 px; re-measure `MIN_INK`; replace
      "Inter" in the messages with the new family.
   f. Prove the guard: with `tools/artwork/fonts/` empty (a temporary rename),
      `node tools/artwork/cards.mjs --check` fails; restore it; `--check`
      prints `_share.jpg: ok` and `_share_en.jpg: ok`.
   g. Rewrite `docs/artwork.md` "The site share cards": the face, its source
      and hashes, the ground and gold, and that the text uses the app's UI
      family (the same family as `--ui`, as static faces).
   h. Open both JPEGs and compare them with the confirmed `mocks/1/` cards,
      allowing for the face that `mocks/1/index.html` names (the mocks may
      render Source Sans Pro, plan review N7).
10. DESIGN.md rules and frontmatter (the Clarity Rule included), `FEATURES.md`
    "Chrome", the decision file, `node tools/decisions.js`. Then Impeccable
    `polish` and `harden` on the changed surfaces; `handoff.md` gives the
    outcome (plan review R5).
11. Screenshot set: `npm run build:test`, then every route family at 360 and
    1180 px, RU and EN, into `issues/57/mocks/1/built/`, plus both share
    cards.
12. `rtk npm run check:fast` (Bash timeout 600000); `npm run lint:untyped`,
    `npm run lint:typed`, `node --test tools/artwork/lib.test.mjs` (the `test:artwork` stage) (`check:fast` runs none of
    them); commit, push, CI credit.

Acceptance criteria:

- The app renders in Source Sans 3 on a machine without it installed.
- In a real browser (`typo.js`): on a RU page the package `FontFace` whose
  `unicodeRange` covers U+0400-045F has `status === 'loaded'`; on an EN page
  the one for U+0000-00FF does (plan review N2).
- A `typo.js` request listener sees every font request same-origin under
  `/assets/`, and no request to another origin for a font (plan review N3).
- `typo.js` passes with the ten-step scale and the package family string.
- The print suite passes with no change to any print measurement.
- E1: `.impeccable/config.json` has no Inter entry (the ignore was stale; the
  font proof is `typo.js`).
- E3: `.prettierignore` has no `hook.cache.json`, `hook.pending.json` or
  `config.local.json` line; `npx prettier --file-info` reports each of the
  three `"ignored": true`; `npm run format:check` passes. `.gitignore` is
  unchanged (E5, E6 kept).
- No detector finding (`impeccable detect --json --no-inline-ignores
  app/src`) in a file this batch touches, except the N3 advisories that batch
  10 records; the total over `app/src` is below 130; `git grep -n
  impeccable-disable -- app/src` returns nothing.
- Impeccable `polish` and `harden` ran on the changed surfaces; `handoff.md`
  gives the outcome.
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
- `shell.test.ts` covers the neutral pressed `Seg` with
  `expectNoA11yViolations`; `Chip.svelte` and `Button.svelte` have no new
  variant; `ArtWell` has its own test and `COVERED` entry; the per-file
  coverage thresholds hold.
- `icons.ts` holds the five paths, each with its family, name and a reader;
  `label.test.ts` covers each `kindGlyph` branch.
- `package.json` pins `@fontsource-variable/source-sans-3` exactly, and the
  parser confirms Cyrillic in its upright and italic files.
- `npm run budget` passes, at today's budget or at a raise recorded in the same
  commit with its reason; `handoff.md` names the outcome.
- Both share cards are set in Source Sans 3 on the app's ground with gold on
  the star only; the EN subtitle reads "armor"; `node tools/artwork/cards.mjs
  --check` passes and fails with the fonts directory empty; `docs/artwork.md`
  names the new faces (Adobe release 3.052R) with their hashes and no longer
  says Inter.
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
paths; `impeccable detect --json --no-inline-ignores app/src`; `git grep -n
impeccable-disable -- app/src`; push and CI credit (CI runs the sweep at 360,
390, 768, 1180 and the golden shards).

Risks and do-nots:

- The ramp moves text widths everywhere; the sweep at 360 is the check. Do not
  change a layout to absorb it; list the overflow and fix the smallest cause.
- `TablesPage.svelte`'s scroll wait now waits for a real font; keep the wait
  and update its comment.
- The artwork review page gets the font through the same import or keeps the
  fallback; `handoff.md` names the outcome.
- Do not touch print layouts, `PrintPage` structure or `card-vectors.css`.
- Download only the three files Q1 names, from the Adobe release; nothing
  else.
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
   `Seg` switches use the neutral pressed style. Interim departure: «Все» and the
   other default chips stay gold until batch 3 and their own batches; the mix
   does not reach `main` (one squash at closeout).
4. RU/EN parity: no app string changes (P7 and the spelling sweep are batch
   2); the glyph and the check carry no text; the share card EN subtitle
   changes "armour" to "armor", with the same facts as RU.

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
   with one departure («Альт. таблицы», batch 2); rule 9 (the primary action
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
   («Все»), the filter sheet and the selection mode; batch 4, the «Ещё» menu and the bottom sheet; batch 8, the
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
  `<title>`, manifest name and `en/index.html` wordmark.
- Risk: batch 2 is now the widest diff (the shell code plus the spelling sweep
  over about 530 files); its refresh orders the review (the shell code first,
  then the contract set, then the prose) and keeps the goldens to CI's text.

## 13. Owner questions

Answered (owner, 2026-10-29, `context.md` "Plan refresh answers" and "Plan
review answers"):

- Q1: download `SourceSans3-Regular.ttf`, `SourceSans3-Semibold.ttf` and the
  OFL `LICENSE.md` from github.com/adobe-fonts/source-sans, release 3.052R,
  `TTF/`, into `tools/artwork/fonts/` (batch 1 step 9a).
- Q2: the share cards on the app's own ground, gold on the star only,
  «DAGGERHEART» in `--muted2` as the header's brand line (batch 1 step 9c).
  The ground is the one page ground that batch 1 chooses (section 10, "One page
  ground").
- Q3 and plan review B3: American spelling everywhere, the whole sweep in
  batch 2 (no batch 2b), code comments, test titles and `.claude/hooks/`
  included; kept only identifiers and stored values, the frozen
  `schema/*.json` wording, and quotations and records, each named in the
  decision file (section 7, batch 2).
- Q4 and plan review B1: keep E5, E6, E8 and E9, recorded as kept exceptions
  in batch 10 (`.claude/README.md`, plan review N14).

Asked at mock 2 (the owner answers there; the batch 2 refresh ships the
answer):

- R3, the account menu. Today (`FEATURES.md` "Chrome"): «Аккаунт», «Мои
  списки», «Мои предметы», «Выйти», no counts. R's mock adds «Вы вошли как
  ...» and counts («Мои списки 3»). Recommended: the `FEATURES.md` order with
  no counts. Reason: the counts are a new feature (two reads on every page,
  their failure states, a rule 1 departure). Trade-off: the menu shows no
  totals. Alternative: the counts, with their reads and states planned in
  batch 2.
- R7, «Бросок» with no visit in this tab. Today a reader on `/tables/...`
  presses the «Обычные правила» tab and gets `/roll/std`. Recommended: the
  last roll section of this tab, else the start section when it is a roll
  section, else `/roll/std`. Reason: the pin means "open the app here".
  Trade-off: one more branch and one `app.test.ts` case. Alternative: the last
  roll section, else `/roll/std`.

Open, asked at the batch mock (mock units A and B, 2026-10-29). A removed
help control needs the owner's yes (`context.md`, Constraints):

- Q1.1, the share card text (mock 1). Today: «Генератор лута» /
  "Loot Generator", «DAGGERHEART», and the subtitle «Добыча, расходники,
  оружие и броня · RU / EN» / "Loot, consumables, weapons and armour · RU /
  EN". Recommended: keep the text, with "armor" in EN (Q3). Reason: it names
  the product and its two languages, and the card paths and alt text stay
  true. Trade-off: no new line about lists or homebrew. Alternative: the text
  `mocks/1/` proposes, if it differs.
- Q3.1, the tables help panel (C1, mock 3; about ten paragraphs that push the
  table 2000 px down at 360). Recommended: remove it; counts on the group
  chips and one-line captions replace it. Trade-off: no long help on the page.
  Alternative: keep it behind «Справка».
- Q3.2, where a temporary view choice lives (C57, mock 3; today the note
  «Только до перезагрузки...»). Recommended: the choice lives in its own
  control and lasts the visit, with no note; the account setting stays the
  lasting default. Reason: the control already shows the state, and no stored
  key is added. Trade-off: a reader who wants the choice to last sets it in the
  account. Alternative: remember the view per device (a new `localStorage`
  key, a new stored state).
- Q5.1, the roller help panel (C38, mock 5; three paragraphs and a rarity
  legend). Recommended: remove it; rarity on the result cards and the field
  caption «Сумма кубиков» replace it. Trade-off: no rule text on the page.
  Alternative: keep it behind «Справка».

- Q6.1, the homebrew help panel (A27; `/homebrew` «?» panel of five
  paragraphs and the subtitle sentence). Recommended: remove it; tabs with
  counts, a one-line empty state per tab and the import details inside the
  import panel replace it. Trade-off: no long help on the page. Alternative:
  keep it behind the labelled «Справка» button.
- Q6.2, the eight field «?» buttons of the homebrew editor (rule 15 (c) hints:
  «Линия улучшений», «Второй набор характеристик», «Источник» and the markup
  hints among them). Recommended: remove them where option text, the toolbar
  or a field shown only where it applies says the same (clarity inventory,
  "editor"); keep a hint only where a site constraint has no other place, and
  name each kept one. Trade-off: `FEATURES.md` rule 15 (c) and rule 18 change in
  batch 6. Alternative: keep all eight.
- Q8.1, the `/lists` «Справка» panel (`help.ts` `LISTS`). Recommended: remove
  it; the list cards, the counter and the import panel say what it says.
  Trade-off: no long help on the page. Alternative: keep it behind «Справка».
- Q9.1, the list page's inline «?» buttons (the price display, the notes, the
  price field). Recommended: remove them; the «Цены:» switch with its example,
  the note switch «Для игроков» / «Только для мастера» and a field caption
  replace them (batch 9 lines). Trade-off: rule 15 (c) departures change.
  Alternative: keep them.

Settled, not asked again: the batch 9 merge is 9a + 10 (section 7, the
evidence); the shell is batch 2 (foundations first); D121 is batch 2 and D116
batch 8; a help panel stays until its batch mock's question is answered.
