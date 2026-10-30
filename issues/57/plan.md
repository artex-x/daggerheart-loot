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
  the waves of section 16 moved P from after 1b into wave 3). Batch 1 is done
  (`9a31aede`, review fix `80872b35`). Batch 1b is done (`fce4a9f8`, merge
  `3e5f6301`; `reviews/1b.md` approve, no finding; its CI run 40960103117 was
  in progress at the refresh). Batch 2 is implemented (section 10; the commit
  `feat(ui): ship the shell, the vault-die mark and American spelling`, its
  batch review `reviews/2.md` next); then the wave 1 squash (section 16). Batches 3-10 and P are
  outlines; each one's refresh expands it.
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
- Plan review coverage at the batch 2 refresh (2026-10-29): no new plan
  review is required. Batch 2's triggers are the contract set that
  `reviews/plan-1-2.md` (R1, B3) and `reviews/plan-1-3.md` (B3, R4) reviewed:
  `routes.json` `tab` and `mode`, `llms.txt` with `tests/contracts.js` and
  `CONTRACTS.md`. The refresh keeps that set and adds no trigger: the mode
  chip's text (B5-2), the interim pin below 760 px, `Menu.svelte`, the
  favicon file (an added asset path), the D121 fix and the waves decision
  (`issues/57/` on `main`, owner) change no fixture, store no data and add no
  write protocol; `rollHash` is memory per tab.
- Plan review coverage at the refresh of 2026-10-29: no new plan review is
  required. `reviews/plan-1-3.md` reviewed batch 1b's contract set (B1, B2, N3,
  N4 applied) and batch 2's (B3, R1, R4), and this refresh keeps both sets and
  1b's gates. The parts that changed fire no trigger: the light print well is
  a named departure in `PrintCard.svelte` (no node values to read), N6 is a
  token, the release waves are a process rule (batch 2's decision file), the
  mark and the burden hands replace the bytes of files whose paths stay (one
  new favicon file is an addition), the bottom line and the first-screen
  exceptions are UI. None of them changes a `CONTRACTS.md` path, a fixture,
  `tests/contracts.js` or `llms.txt`, stores data or adds a write protocol.
- Plan review findings applied: reviews/plan-1-3.md
  - B1, sections 7 (batch 1b) and 8: the README pair 1193 to 1192 with the `tests/derived.js` comment, the two `COVERAGE.md` rows, the `set-longsrc1` inventory `why` and its golden header, the `tools/artwork/lib.mjs` comments; the 1b gates add `app/states`, `derived` and both lints; row 1b gains 5 min.
  - B2, section 7 (batch 1b): a no-picture link card takes the site share card of its language with `large: true` (the `siteCtx` pattern) in `preview/worker.mjs` and in `pageCtx`; `wantImg`, `worker.test.mjs` asserts (1200, 630, `summary_large_image`, RU and EN) and the two `META.md` rows follow.
  - B3, sections 7 (batch 2) and 8: the hook selftest runs once on its own; `tests/db/` joins the sweep with `npm run check:db` (owner's minimum of British forms, the recommended option); `derived` joins the batch 2 suites; row 2 is recomputed.
  - R1, sections 7 (batch 1b) and 9: the mock step reads the node's paper and ink values and its per-kind outline and writes them into the 1b line; the values live in `PrintCard.svelte` as overrides on `.pcard:not(.bw) .pc-art`; the tone is proved in `tests/app/print.js`; the `/p/` sheet and the editor preview draw the light well; `FEATURES.md` "Print" and the `PrintCard.svelte` comment change with it.
  - R2, sections 10 and 14: the fifteen real components are named (four roll panels); a roll route sets the number field instead of a roll; the design target is 240 px at 640 and 270 px at 720 under the 0.4 assertion; `scrollTo(0, 0)` and two frames before the read; zero matches fail; one row per user-named H1 at its longest name.
  - R3, section 14: one place for «Выбрать» and one for the search on every list surface; the view switch stays its own control; one count per collection (rule 1); a button that opens a renamed panel takes the panel's name (batch 2).
  - R4, section 7 (batch 2): the word list gains `sanitis|tokenis|capitalis|italicis|millimetre|defence`; `cancelled` (an American form and GitHub's API value), `smoulder` (fixture data) and the sub-package lock files are kept forms.
  - R5: deferred-scope (`handoff.md`, Deferred): `review.prompt.md`'s naming of a third look against `agent-guard.mjs`.
  - N1, sections 1 and 7 (batch 2): the R3 and R7 lines state the owner's answer only.
  - N2, section 10: an acceptance line for the page ground and its `background-attachment`.
  - N3, section 7 (batch 1b): `docs/fixtures/`, `tests/contracts.js` and `llms.txt` hold no `_none` path; the commit says so.
  - N4, section 7 (batch 1b): the stale tab and the revert.
  - N5, `handoff.md`: "Pushed" and "Review" take the template values.
  - N6, sections 7, 14 and `handoff.md`: `issues/57/mocks/measure.mjs` is the measure script.
  - N7, section 14: every new label has its EN pair.
- Device shares (owner, 2026-10-29, `context.md` "Devices during play"): batch 1 rewrites `PRODUCT.md` "Users", "Operating Context" and "Positioning" and writes the Phone-First Rule beside the First-Screen Rule (section 10).
- First-Screen Rule (owner, 2026-10-29, `context.md` "First-screen rule"): written by batch 1 with a measured `tests/app/states.js` case; section 14 lists each mock's pass or fail at 360x640 and 1180x720 and the recommended fix; the mock re-renders of 3, 5, 6, 7, 8 and 9 follow from it.
- Mock answers recorded (owner, 2026-10-29, `context.md` "Mock answers"): mock 1 approved; batch 1b added (the glyph replaces the no-picture placeholder everywhere, print included, and the three placeholder files go); the linear page ground in batch 1; C1 and C38 renamed, not removed; every other section 13 question answered. A second plan-review look on these parts follows.
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
- Folded at the refresh of 2026-10-29 (`context.md`, the entries after "Mock P
  answers"): the release waves (section 16), the mark (batch 2), the
  «Daggerheart» bottom line (batches 4 and P), the burden hands (batch P), the
  round 2 departures from DESIGN.md (section 4, one line per batch in section
  7), the first-screen exceptions (section 14), and the answers of the mock
  reviews and rounds 3, 6 and 2 (one line each in section 7).
- NEEDS_HUMAN_CONFIRMATION: no. Every question of section 13 is answered;
  Q-W1 took the owner's answer "Wave squash content" (`issues/57/` goes onto
  `main` with each squash).

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
| The Two Breakpoints Rule | new steps at 760 px (the pin; a menu or a sheet; the `/p/` cards) and 1000 px (the side column) | 2 (the 760 pin) | 4 (menu or sheet), P (print cards), 9 (1000 side column) |
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

Batch 1b: its implement-ready brief and acceptance lines are section 10 (mock
`mocks/1b/`, confirmed by the owner's answer M1b-1). The inherited
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

Batch 2: its implement-ready brief and acceptance lines are section 10 (mock
`mocks/2/`, the mark `mocks/mark/b-vault-die.svg`). Every line that this
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

Batch 3:

- Q3.1 (owner): the tables help panel (C1) is renamed «Об этих данных» /
  "About this data" and holds three data notes, as `mocks/3/` draws them; the
  rest of its paragraphs go; `help.ts` and its tests change with it. Its
  button reads «Об этих данных» / "About this data" (plan review R3).
- Q3.2 (owner): the grid/table view choice is temporary, lives in its own
  control for the visit and carries no note («Только до перезагрузки...»
  goes); it covers the `/p/` compact-sheet note (C31) too. Batch 3 runs before
  batch P now (the waves), so it removes the note from the tables toolbar
  only; `KeepNote` keeps serving the `/p/` print bar until batch P removes it
  there, and the component goes with its last caller.
- New states: the filter sheet open at 360 (its height with the on-screen
  keyboard open) and the selection mode («Выбрать»).
- P15: the grid name order is checked in EN.
- The empty-state pattern draws no "?" pedestal: its file goes in batch 1b
  (owner, 2026-10-29); the cause and one next step carry the state.
- `Chip` gets the neutral pressed variant (the `check` icon, a lit `--muted2`
  border, the icon-and-label centre) with its `chip.test.ts` case ending in
  `expectNoA11yViolations`; «Все» / "All" is its first caller (plan review R4).
- Clarity inventory: the «ЛИНЕЙКА» row name on `/tables` (and `/s/` in batch
  9) says upgrade chains or uniques (plan review N11).
- The selected row in the selection mode is a lit border and a check, never a
  one-side accent: R's `.rl.sel { box-shadow: inset 3px 0 0 var(--muted2) }` is
  a `side-tab` and is not built (mock unit B, 2026-10-29).
- R3-1 (owner, round 2): no pill row at 360 on the catalog; the count line
  names the chosen values in text.
- R3-2 (owner, round 2): accepted - at 360 another group's table takes three
  taps.
- The selection bar (owner, round 6), the pattern every list page reuses: «Все»
  (tri-state), «Выбрано: N», the page's actions, «Снять выделение» last; at 360
  the rare actions fold into «··· Ещё»; a zero-tick state. The select-all box
  keeps «Все» visible while rows are ticked, a named `FEATURES.md` change in
  the same commit.
- DESIGN.md (section 4, departures): "Filter pills", "Shapes" (the
  empty-state plate), "Don'ts" (the glyph tile, or N0-2 applied), the Seal
  Rule's neutral selection and "Components" (the bottom sheet, first used by
  the filter sheet) are rewritten to what batch 3 ships.
- M2-2 (from batch 2): on `/tables` below 760 px the pin and the page's
  panel button leave the H1 row for the page's «Ещё»; batch 2's interim round
  buttons go there; the Same Label Rule's interim note loses `/tables`.

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
  only the kept forms.
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
| 1b | `node tests/run-all.js app/print,app/states,contracts,dataint,derived,stub` (12-14), `npm run check:built` (1), `npm run lint:untyped` and `npm run lint:typed` (2), `node --test preview/worker.test.mjs tools/check-site.test.mjs tools/artwork/lib.test.mjs` (1), the one-state golden re-seed (about 1 after `build:test`); CI runs deploy-replay (about 2-3 inside the CI run) | 16-18 |
| P | `node tests/run-all.js app/print,app/states,stub` (6-8); `npm run check:built` (1); the catalog fit measure for the `FEATURES.md` figures (`issues/57/mocks/P/tools/print-measure.cjs` and `print-analyse.cjs`, RU and EN, four layouts, about 12); the burden export through the owner's Chrome (about 5); the print-resolution screenshot set (about 5); the batch review of the Figma departures in its fix cycle (about 5) | 30-35 |
| 2 | `npm run check:db` for the `tests/db/` comments (about 13); `node tests/run-all.js app/contracts,app/states,app/typo,contracts,dataint,derived,stub` (11-13, measured costs of `run-all.js`); `node tests/app/sweep.js 360` (about 7); the golden re-seed, `build:test` and four `--update` shards (about 11-12; every golden moves, and a local re-seed avoids a red CI run, a download and a second run, about 25); `npm run check:built` (1); `node tools/build.js` and `node tools/decisions.js` (1); both lints (2); the hook selftest once on its own (434-563 s: 7-9.5); the mark: `npm ci --prefix tools/artwork`, `icons.mjs`, `cards.mjs`, `--check`, `lib.test.mjs` and the 16 px render (about 5); the detector and the spelling grep (1); the longer review of the spelling diff in its fix cycle (5-10) | 65-75 |
| 3-9 | `npm run check:built` where `dist` assets change (1) | 1 each |
| 10 | docs only: one `check:fast` and one docs-only CI run (no `e2e`) | about 20 in all |
| waves (section 16) | per wave: the merge of `origin/main`, the squash in the main checkout, the `main` CI run with the deploy (10.5-11.5) and the merge back (about 2); three waves | 37-41 |
| post-release check and closeout (section 16) | the blind production review (about 45-60, the owner's print not counted), then the closeout commit and its docs-only CI run and the last squash (about 20) | 65-80 |

Remaining total at the batch 2 refresh (1b spent): nine code batches (2-9,
P) at 45-60 min (405-540), plus 102-117 min of extra gates (2: 65-75; P:
30-35; 3-9: 7), plus batch 10 at about 20, plus the waves (37-41) and the
post-release check and closeout (65-80): about 629-798 min, so about
10.5-13.3 hours. Batch 2 alone, with the wave 1 squash: about 122-149 min. If
batch 10 takes code, add 25-35 min. Batch P adds 75-95 min; taking the `/p/` rows from
batch 7 saves that batch no gate (its `check:built` stays). The owner's
merges saved two batches (about 90-120 min); keeping the spelling sweep in
batch 2 instead of a batch 2b saves one CI run and one review (about 30 min);
batch 1b costs one batch (45-72 min) because its contract and print change
splits from batch 1. The waves add two squashes and their deploys to the one
that the closeout always pays. Mock drawing (section 9) runs no gate.

Writer tests per remaining batch (`orchestrate.prompt.md`, "Writer tier"; facts
for the orchestrator's dispatch, not a model choice):

| Batch | Test 2 (public contract, route, stored state, product law, hook, configuration) | Test 3 (print fitting, golden re-seed, parity with a design node) | Plan-review trigger |
|---|---|---|---|
| 1b | yes: `CONTRACTS.md` section 5 asset paths | yes: one golden re-seed; the print well against mock 1b | covered by `reviews/plan-1-3.md` |
| P | yes: the product law's card size (QP.2, `CLAUDE.md`) | yes: print fitting; parity with Figma nodes `714-42387` and `3773-90792` (the burden export) | none |
| 2 | yes: `routes.json`, `llms.txt`; the lit route state; `.claude/hooks/`, prompts, agents and `CLAUDE.md` respelled | yes: every golden moves; the mark's renders | covered by `reviews/plan-1-2.md` and `plan-1-3.md`; the batch 2 refresh adds none (Status) |
| 3 | no | yes: new states and their goldens | none |
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

## 10. Batch 2 - Shell, the mark and the American spelling (implement-ready)

Batch 1b is done: `fce4a9f8` and the merge `3e5f6301` (`reviews/1b.md`,
approve, no finding, five deviations accepted). Its brief is at `git show
5d9aefbc:issues/57/plan.md`, section 10. Batch 1 is done: `9a31aede` and
`80872b35`; its brief is at `git show 80872b35:issues/57/plan.md`, section 10.

Batch 2 is the last batch of wave 1. Mock: `mocks/2/` (confirmed, rounds 1 to
5; the round 5 fixes are on its `index.html`), the mark
`mocks/mark/b-vault-die.svg` (owner, "One mark", candidate B).

### Objective

Ship the header of direction R: three jobs with icons, the three-control mode
row with the «Дополнения ▾» menu, the account control and its lit state, the
EN wordmark, the labelled pin and «Справка», the toast as a plate, and D121.
Replace the three marks with the vault die. Respell the repository in American
English, with the kept forms named in a decision file. Record the release
waves. Then wave 1 lands (section 16).

### Dispatch preflight

- Merge `origin/main` into `claude/57` (a merge, never a rebase). On
  2026-10-29 the branch already holds `main` `eea84371` (the usage guards of
  `dd13136d` and `eea84371`); the merge takes whatever landed after it.
- The CI credit of `3e5f6301` (run 40960103117) is in `handoff.md` before the
  implementer starts.
- The usage wrap-up (`orchestrate.prompt.md`, "Usage guards") can reach the
  implementer mid-batch. The steps below are numbered S1 to S12; the line
  "Session end partial progress" names the last finished step and the next
  one. A fresh implementer continues from that step on the uncommitted tree.
  Run the long gates (S12) only after every edit: the selftest and `check:db`
  prove the final text of their files.

### In scope

- The rows of section 7, row 2: C6, C27, C34 (verify), C37, C47, C48, C52,
  A15 (verify), A27 (icons), A35, A36, A37, P7, P9, D9, D10, D11, N4, D121.
- The mark at every size it ships at, both share cards re-rendered.
- The whole American-spelling sweep (owner, Q3 and B3: no batch 2b).
- Three decision files: the navigation, the release waves, the spelling.

### Out of scope

- The gold default chips («Все» and the others): they stay gold until their
  surface batches (owner, "Interim mix between waves"; batch 3 first).
- The pin and the help in «Ещё» / «Настроить» at 360 (M2-2): those containers
  arrive with batches 3, 5, 6, 7 and 8 (each carries the line, section 7).
- The renamed help panels (C1 batch 3, C38 and N2-2 batch 5): batch 2 ships
  the label «Справка» only.
- The visually hidden H1 at 360 on roll pages (R2-1): batch 5.
- The EN `<title>`, the manifest name and `en/index.html` keep their text.
- The `FIRST_SCREEN` rows stay logged (`shipped: false`); batch 2 asserts no
  row (section 14: the header is part of the roll pages' row, batch 5).
- The link-preview Worker's card images (`tools/share-card.mjs`, Deferred).

### Files expected

| Step | Files |
|---|---|
| S1 | `app/src/lib/nav.ts`, `nav.test.ts`; `app/src/state/app.svelte.ts`, `app.test.ts` |
| S2 | new `app/src/components/Menu.svelte`; `AccountMenu.svelte`; `accountMenu.test.ts`; `a11y.test.ts` (`COVERED`) |
| S3 | `TabBar.svelte`, `tabBar.test.ts`; `app/src/lib/icons.ts` (`search`, `chevron` if absent) |
| S4 | new `app/src/components/ModeRow.svelte`, new `modeRow.test.ts`; `Shell.svelte`; `RollPanel.svelte`; deleted `SupplementNav.svelte`, `supplementNav.test.ts`; `roll.test.ts` (the `SUPPLEMENTS` case that reads the chip panel) |
| S5 | `Shell.svelte`, `shell.test.ts`; `app/src/lib/dict.ts` |
| S6 | `PageHead.svelte`, `HelpButton.svelte`, `dict.ts`; the tests that name `homeHint` or `helpHint` (`homebrewPage.test.ts` and the others `git grep -n -E "homeHint|helpHint" -- app/src` finds) |
| S7 | `Toast.svelte`, `shell.test.ts` (D121) |
| S8 | `docs/fixtures/urls/routes.json`, `tests/app/contracts.js`, `app/src/lib/hash.test.ts`, `docs/specs/CONTRACTS.md`, `docs/specs/ROUTES.md`, `docs/specs/COVERAGE.md`; `tests/app/states.js` and `tests/app/sweep.js` where they read the tab bar |
| S9 | `app/public/icons/icon.svg`, new `app/public/icons/favicon.svg`, the four PNGs; `app/index.html`, `404.html`, `old-host/index.html`, `tools/build-pages.js`, `tools/build-share-pages.js`; `tests/derived.js`; `tools/collect-site.sh`; `tools/artwork/lib.mjs`, `lib.test.mjs`; `og/_share.jpg`, `og/_share_en.jpg`; `docs/artwork.md`, `docs/specs/META.md`; `issues/57/mocks/mark/candidates.js` (evidence only) |
| S10 | the sweep's file set (below); `llms.txt`, `tests/contracts.js`; `tools/decisions.js`; `docs/specs/I18N.md`; `tests/derived.js` |
| S11 | `docs/specs/FEATURES.md`, `STATE.md`, `DEBT.md`, `DESIGN.md`; three files under `docs/decisions/` and the two older files they amend or supersede; `docs/DECISIONS.md`; `tests/app/inventory.js`; `tests/app/snapshots/` |
| S12 | `issues/57/mocks/2/built/`, `handoff.md` |

### Constraints from the mock and the owner

- Jobs: «Бросок» / "Roll" (`die`), «Таблицы» / "Tables" (`table`),
  «Поиск» / "Search" (`search`, Material Icons, Apache 2.0); the icon before
  the label at every width; a label never gives way to an icon (theme 3).
  The lit job: gold text and the gold underline (today's `a.on`). Three jobs
  hold one row at 360 in both languages; the 640 px scroller and its
  `scrollLeft` effect go.
- The mode row shows on the nine roll sections only, under the sticky
  header, and scrolls with the page. Three controls at every width:
  «Обычные правила» / "Standard rules" (`t.pageStd`), «Альтернативные
  таблицы» / "Alternate tables" (`t.pageAlt`, the page heading's words, B5-2),
  and the menu button «Дополнения ▾» / "Supplements ▾". On a supplement page
  the button shows that supplement's name (`t[SECTION_LABEL[s]]`) with the
  chevron. The lit control takes the current-place gold fill. At 360 each
  control is 40 px tall, a label may take two lines, and the row takes 6 px
  above and below (mock 2, M2-3); the widths share the row as 0.8 / 1.25 / 1
  at 13 px (mock 2, "Changes"), so the longest names hold two lines.
- The menu: seven links in `SUPPLEMENTS` order, each to its section path
  (`app.href(sectionHash(s))`), 44 px items, a muted caption «Дополнения» /
  "Supplements" at the top, the open supplement with a check and
  `aria-current="page"`, right-aligned under its button. No grab handle and no
  sheet (N0-3).
- The account control: signed out, the person icon and «Войти» / "Sign in" at
  every width (the label is never hidden; the 419 px rule goes); signed in,
  the initial in the 38 px circle (44 px at 600 px and below) and a chevron.
  The gold ring on `/account`, `/lists`, `/lists/<uuid>`, `/homebrew` with its
  tabs, `/homebrew/<id>` and `/homebrew/new` (the «Мои предметы» pages), and
  while the menu is open. `aria-current="page"` stays on `/account` only (the
  control is a link to `/account` only there).
- The account menu: the `FEATURES.md` order «Аккаунт», «Мои списки», «Мои
  предметы», a rule, «Выйти»; no counts, no «Вы вошли как» line (owner, R3).
  «Мои предметы» is capitalised (M4-2; `t.myItems` already is: check).
- The brand: the mark (26 px, the same gold drop shadow as today), then the
  wordmark «Лут» in Russian and «Loot» in English over «DAGGERHEART». The
  wordmark is the header only.
- The pin and the page help (M2-2): from 760 px they are labelled buttons
  beside the H1 - the pin «Открывать при запуске» / "Open on start", pinned
  «Открывается при запуске» / "Opens on start" with the neutral pressed check
  (N4); the help «Справка» / "Help" where the panel has that name. Below
  760 px each stays today's round button with the same accessible name, until
  its page's batch moves it into «Ещё» or «Настроить» (the interim rule;
  batches 3, 5, 6, 7, 8).
- The toast: a plate - `--surface`, a 1px `--muted2` border, `--txt`, the
  Float shadow, `--r` corners (not a pill), at most the window's width less
  16 px a side, 26 px off the bottom. Its action button: `--surface2` with a
  `--line2` border. The error toast: the Alarm Red fill (`--danger`) with
  dark ink (`--ink-on-gold`, about 5.6:1). The gold leaves the toast.
- The language switch stays the `Seg` control that rewrites the `/en` prefix
  with `replaceState`; it is not a link.
- The mark: `mocks/mark/b-vault-die.svg` as drawn - the d12 decagon
  `#d8ab5e`, the pentagon face `#f0d091`, the edges and the keyhole cut as a
  mask. Its decagon reaches 198 units from the centre, inside the maskable
  safe zone (204.8). The favicon is the mark on the dark tile the owner saw
  (`mocks/mark/stage.html`, `.tile`: `#0e0c15`, radius 18.75%).

### Steps

S1. Navigation logic.
   1. `nav.ts`: replace `tabOf` with `jobOf(s: Section | null): Job | null`
      (`type Job = 'roll' | 'tables' | 'search'`; every `roll/*` section is
      `'roll'`, `'lists'` and `null` are `null`) and `modeOf(s)` (`'roll/std'`,
      `'roll/alt'`, the supplement itself, or `null` off the roll sections).
      Keep `SUPPLEMENTS` and `isSupplement`. The file comment cites the new
      navigation decision file (S11), not the 2026-10-20 one.
   2. `app.svelte.ts`: `hash` becomes a `$state` behind a get/set pair, so the
      five assignments stay as written. The setter records the last roll
      section of this tab (`#lastRoll`) from `parseHash(h)` when it is a
      `section` route with a `roll/*` section; a legacy `#/roll/hnf` parses to
      `roll/std`, so the memory never holds a raw address (no replayed source
      switch). New getter `rollHash`: `sectionHash(#lastRoll)`, else the
      pinned start section when it is a roll section, else `'#/roll/std'`
      (owner, R7). Memory only; nothing is stored.
   3. Tests: `nav.test.ts` (each section's job and mode, `null`);
      `app.test.ts` - a fresh tab pinned at `#/roll/vault_of_ages` on a table
      gives `#/roll/vault_of_ages`; after `/roll/dread` then `/tables` it gives
      `#/roll/dread_gm_toolbox`; after `/roll/hnf` it gives `#/roll/std`; a
      fresh tab pinned at `#/tables/eq_weapon` gives `#/roll/std`.
S2. `Menu.svelte` (the menu pattern's second use: extract it, `CLAUDE.md`).
   Move `AccountMenu.svelte`'s box, `role="menu"`, the first-item focus, the
   Up, Down, Home, End and Escape keys and the outside-click close into
   `Menu.svelte` (props: `control`, `label`, `id`, `onclose`, `cls`,
   `children`). `AccountMenu.svelte` keeps its items, its sign-out and the
   class `acctmenu` (`tests/app/states.js` reads it) and renders through
   `Menu`. `accountMenu.test.ts` passes unchanged; `a11y.test.ts` `COVERED`
   names `Menu.svelte`.
S3. `TabBar.svelte` becomes the job row: `<nav class="tabs"
   aria-label={t.sectionsLabel}>` keeps its class, so the browser suites'
   `nav.tabs` selectors stay; three links, each `data-job="<job>"`, with
   `Icon` before the label; «Бросок» links to `app.href(app.rollHash)`,
   «Таблицы» to `/tables`, «Поиск» to `/search`; `aria-current="page"` and
   `.on` on `jobOf(app.section)`. The props change to `{ app }`. The
   `scrollLeft` effect, the separator and the six-supplements comment go (N4).
   `tabBar.test.ts` is rewritten: three links in both languages with their
   icons, the lit job on a roll, a table and a search route, none lit on
   `/lists`, `/i/ci1`, `/p/<id>`, `/account`; «Бросок»'s `href` follows
   `rollHash`; `expectNoA11yViolations`.
S4. `ModeRow.svelte`: `<nav class="modes" aria-label={t.modesLabel}>` with
   two links and the menu button, each carrying `data-section` (the
   canonical key, `sectionHash(s)`); the lit one carries `aria-current="page"`.
   Its own controls, not `Chip`: `Chip`'s button form is a pressed toggle
   (`aria-pressed`), and the menu button needs `aria-haspopup="menu"` and
   `aria-expanded`; the styles compose Chip's tokens. The menu renders through
   `Menu.svelte` and closes on a navigation. `Shell.svelte` draws `ModeRow`
   after `</header>` and before `<main>` when `modeOf(app.section)` is not
   null. `RollPanel.svelte` drops `SupplementNav`; delete
   `SupplementNav.svelte`, `supplementNav.test.ts`, its `COVERAGE.md` row and
   its `a11y.test.ts` entry. `modeRow.test.ts`: the three controls on each of
   the nine sections, the lit one and its text equal to the page's H1 (the
   chip matches the heading), the menu's seven links in order with the check
   on the open one, the keys, and the axe check with the menu closed and open.
S5. `Shell.svelte`: the mark as an inline SVG (`viewBox="0 0 512 512"`, the
   mask id `brand-mark-cut`) in `.brand-ico`; the wordmark from a new `dict`
   key `brandWord` («Лут» / "Loot"), whose comment says the wordmark follows
   the language in the header only (it replaces the "not a translated
   string" comment); the account control of the constraints above, its ring
   on the account pages (`acctPage`, derived from the route kinds `account`,
   `section` `lists`, `storedList`, `homebrew`, `homebrewItem`); the
   chevron after the initial; the 419 px block goes. `shell.test.ts`: the
   brand link names «ЛутDaggerheart» and "LootDaggerheart"; «Войти» visible at
   360; the ring on each account page and on none of `/i/ci1`, `/roll/std`.
S6. `PageHead.svelte` and `HelpButton.svelte`: the pin and the help take a
   visible label from 760 px (`homeHint` becomes «Открывать при запуске» /
   "Open on start"; `homeOn` stays; `helpHint` becomes «Справка» / "Help");
   below 760 px the label is visually hidden and stays the name (the `.vh`
   rule). The pressed pin draws the neutral check of `Seg`, not a gold fill.
   `HelpButton` gets the visible label only where `PageHead` asks for it (one
   prop, one caller); the field «?» buttons are unchanged (batches 6 and 9
   remove them). The tests that read the names follow the new values.
S7. `Toast.svelte`: the plate and the error flavour of the constraints. D121:
   the focus effect is keyed on `run ?? go ?? href` of the action, so it runs
   when a link or move toast gives way, and still not on a language redraw
   (the same `Said` keeps the same functions); `onfocusin` records
   `relatedTarget` as the origin when it lies outside the toast. When a later
   toast replaces a toast that held the focus, the focus goes to that origin,
   else `#main` (inside the record dialog, its close button). `shell.test.ts`:
   one case each for `href` and `go` as `DEBT.md` D121 says, ending in
   `expectNoA11yViolations`. D121 leaves `DEBT.md`; its section stays for D116.
S8. The contract set (plan review R1), in the same commit:
   1. `routes.json`, all 97 rows by a one-off script (not committed):
      `tab` `'#/roll/<any>'` becomes `"roll"`, `'#/tables'` `"tables"`,
      `'#/search'` `"search"`, `null` stays; a new `mode` after `tab`: the
      `sectionHash` of the section the row resolves to on a roll route
      (`#/` and the legacy names give `"#/roll/std"`, a supplement its URL id,
      for example `"#/roll/vault_of_ages"` for `#/roll/voa`), else `null`.
   2. `tests/app/contracts.js`: `tab` from `data-job` of `nav.tabs
      a[aria-current="page"]`, `mode` from `data-section` of `nav.modes
      [aria-current="page"]`, both compared as plain strings (both sides are
      canonical keys, so `pathOf()` adds nothing); one `/en/roll/dread` probe:
      English, job `roll`, mode `#/roll/dread_gm_toolbox`, the button text
      "Dread GM Toolbox".
   3. `hash.test.ts`: `fx.resolves.tab === 'tables'`; its comment loses
      `tabOf`.
   4. `CONTRACTS.md` section 1 gains: "`routes.json` pins each route's
      resolved address, its lit job and its lit mode." `ROUTES.md` "Sections"
      (the paragraph after "URL ids and old ids") names the three jobs and the
      mode row in place of the five tabs.
   5. `COVERAGE.md`: the `hash.test.ts` row, the row "Route resolution had no
      fixture" (97 rows, not 28 shapes), the `tabBar.test.ts` and `nav.test.ts`
      rows, a `modeRow.test.ts` row, the accounts row (line "Accounts: sign-in,
      the header control"), the `supplementNav.test.ts` row deleted.
   6. `tests/app/states.js` and `tests/app/sweep.js`: each `nav.tabs` reader
      still finds its links (the Tables job is `a[href="/tables"]`); a reader
      that expects five tabs reads three.
S9. The mark.
   1. `app/public/icons/icon.svg`: the `#0e0c15` ground and the mark of
      `b-vault-die.svg`; the comment keeps the safe-zone sentence with the
      198-unit reach.
   2. New `app/public/icons/favicon.svg`: the mark on the rounded tile
      (`<rect width="512" height="512" rx="96" fill="#0e0c15"/>`).
   3. `npm ci --prefix tools/artwork`, then `node tools/artwork/icons.mjs`:
      the four PNGs.
   4. The favicon link in every document that has one: `app/index.html`
      `<link rel="icon" type="image/svg+xml" href="/icons/favicon.svg">`;
      `tools/build-pages.js` `${t.rootHref}icons/favicon.svg` (the pattern of
      its apple-touch line); `404.html`, `old-host/index.html` and
      `tools/build-share-pages.js` `rootPage()` the absolute
      `https://daggerheart-loot.pages.dev/icons/favicon.svg` (their links name
      the site's host already). Then `node tools/build.js`.
   5. `tests/derived.js`: the app's icon link is `/icons/favicon.svg` and the
      file exists in `app/public/`; no tracked document holds the emoji data
      URI (`%F0%9F%97%9D`). `tools/collect-site.sh` `guard` names
      `icons/favicon.svg` beside `icons/maskable-512.png`.
   6. `tools/artwork/lib.mjs`: export `MARK`, the mark's `<defs>` and `<g>`
      with a mask id parameter; `shareCardSvg` draws it in the star's place in
      an 84 px box at (50, 258) (`translate(50 258) scale(0.1640625)`, the box
      of `mocks/mark/stage.html`, view `share`); `starPath` goes. `lib.test.mjs`:
      the gold test counts `#d8ab5e` once and `#f0d091` once and names "the
      mark", not "the star"; one more case reads `app/public/icons/icon.svg`,
      `favicon.svg` and `app/src/components/Shell.svelte` and asserts the same
      path data as `MARK` (four copies, one drawing).
   7. `node tools/artwork/cards.mjs`, then `node tools/artwork/cards.mjs
      --check`: both `ok`.
   8. The 16 px check: add `{ id: 'shipped', file:
      '../../../../app/public/icons/favicon.svg', ... }` to
      `issues/57/mocks/mark/candidates.js` and run `node
      issues/57/mocks/mark/render.mjs shipped`; the handoff names
      `png/shipped__fav.png`, `__apps`, `__big`, `__head__*` and `__share__*`
      and says how the mark reads at 16 px on the dark and the light strip.
      The owner chose B knowing its 16 px cost (`candidates.js`: the keyhole
      becomes a dot below 32 px); the batch records the outcome and changes no
      geometry.
   9. Homes: `docs/artwork.md` "Icons" (the vault die, owner 2026-10-29,
      replacing "a flat key"; `favicon.svg` and its tile) and "The site share
      cards" (the mark in the star's place; gold on the mark only);
      `META.md` the icons bullet (`favicon.svg`; "The tab favicon is
      unchanged" goes).
S10. The American-spelling sweep (owner, Q3 and B3).
   1. Word list (`git grep -n -i -I -E`):
      `colour|armour|licence|behaviour|catalogue|artefact|favour|honour|centre|\bgrey|recognis|organis|summaris|normalis|initialis|serialis|customis|prioritis|minimis|optimis|sanitis|tokenis|capitalis|italicis|millimetre|defence|analys(e|ed|ing)\b|judgement|travell|modell|labell|flavour|neighbour|centring|maths\b|parallelis(e|ed|es|ing)\b|rasteris` (the last six from the batch 2 review, N2).
      On `3e5f6301` it hits 1381 lines in 539 files outside `issues/` and
      `schema/`: 476 in 340 goldens (re-seeded in S11, never edited), 64 in 44
      decision files (kept), 273 in 81 `app/src` files, 222 in 15 other test
      files (102 in `tests/app/print.js`), 85 in `docs/specs/`, 73 under
      `.claude/` (23 in `.claude/hooks/`), 41 in `tools/`, 31 `DESIGN.md`, 21
      `README.md`, 16 `llms.txt`, 14 `CLAUDE.md`, 7 `tests/db/`.
   2. Respell: prose, comments, test and suite titles, log and error texts,
      the UI (`footSummary` "Sources and license", EN `printColor` "Color"),
      the inventory `why` texts, `llms.txt`, `README.md` (with the
      `tests/derived.js` pattern `fall\s+outside that license`),
      `docs/specs/*`, `DESIGN.md`, `PRODUCT.md`, `docs/artwork.md`,
      `docs/provenance/*`, `docs/fixtures/homebrew-file/README.md`,
      `.claude/README.md`, prompts, skills, agents, templates, hooks,
      `CLAUDE.md` (respelling only, no new line), `tools/decisions.js` (its
      generated header, then `node tools/decisions.js`), the two EN head
      descriptions in `tools/build-share-pages.js` and the Terms description in
      `tools/build-pages.js` (then `node tools/build.js`), `.prettierignore`
      and `eslint.config.mjs` comments, the three `tests/db/` comments.
   3. Kept, each class named in the decision file: identifiers (code names
      such as `VectorPaint` `'colour'`, `isLabelled`, CSS classes such as
      `.foot-licence`, keys such as `hb_sectarmouraaaaaa`); stored and seed
      values (`docs/fixtures/` data, `from-llms.json` "Armour", the seeds of
      `app/src/ports/fake-cloud-seed.ts` such as «Traveller's Roll» and «the
      old armourer», the `tests/db/` inputs); inventory ids and golden file
      names (`~ colour for this visit`); decision file names and titles
      (`tools/decisions.js` checks them) and earlier decision bodies; the
      frozen `schema/*.json` wording; quotations and records (commit
      messages, the DPCGL text and its "License", source-book text in
      `data.js` such as «Crown of Judgement», log excerpts); `cancelled`
      (American too, and GitHub's `cancelled()` in `.github/workflows/`);
      `smoulder` (fixture data `llms.txt` quotes); `preview/` and
      `tools/artwork/` `package-lock.json` and third-party licence texts;
      `.impeccable/design.json` (generated; batch 10 regenerates it from
      DESIGN.md); the `issues/57/` scratch.
   4. `llms.txt` with `docs/specs/CONTRACTS.md` and `tests/contracts.js` (the
      pinned `'| Artefact | Field | Carries |'` and its `CONTRACTS.md` table
      head move together); `docs/fixtures/` does not change (state it in the
      commit body). The cited `schema/*.json` sections hold no listed word, so
      the frozen-schema check holds.
   5. `.claude/hooks/*.mjs`: comments and messages only. After the hook
      edits, `node --check` each edited hook. A message that a selftest case
      matches changes with that case. If a guard refuses a write under
      `.claude/` or to `CLAUDE.md`, stop and return the text for the
      orchestrator (`CLAUDE.md`, "Task and session protocol").
   6. `tests/derived.js`: a new check that the EN strings of `dict.ts` and
      the text of `llms.txt` hold no listed word except the kept forms, so the
      rule holds after closeout.
   7. `docs/specs/I18N.md` "Rules": "English text uses American spelling;
      the kept forms are the spelling decision file's."
S11. Docs, decisions, states and goldens.
   1. `FEATURES.md` "Chrome": the tab-bar bullets become the jobs, the mode
      row, the menu and the measured header; the account control bullet (the
      label at every width, the chevron, the ring on the account pages); the
      pin bullet (the labels, the 760 px step); the toast plate; "Help panels
      under a `?`" reads «Справка»; `footSummary` in EN. "Rolling": the
      paragraph that cites the supplements panel. "Consistency rules", rule 4:
      the «Дополнения» departure is rewritten (the menu button shows the open
      supplement's name); the job «Бросок» names a group of nine roll pages and
      has no heading of its own (N8); the «Альт. таблицы» departure goes (B5-2).
   2. `STATE.md`, "The in-memory state object": the last roll section of this
      tab, memory only, never a raw address.
   3. `DESIGN.md` (section 4, departures for batch 2): "Navigation" ("Tabs":
      the jobs, the mode row, the menu; "Brand": the mark and «Лут» /
      «Loot», replacing "never translated"); The Two Breakpoints Rule (the
      760 px label step; the 640 px tab scroller goes); "Layout" (the measured
      sticky header at 360 and 1180, the scrolling mode row); "Toast" (the
      plate, the error toast with dark ink); "Chips" (the 40 px mode controls
      at 360); The Same Label Rule (a label does not change with the width;
      the pin and «Справка» are labelled; the interim round buttons below 760
      px named with their batches).
   4. Decision files (`.claude/templates/decision.template.md`, then `node
      tools/decisions.js`):
      - `2026-10-29-the-header-has-three-jobs-and-a-mode-row.md`: three jobs
        and the three-control mode row with the supplements menu; rejected:
        five tabs with a chip panel, one row of nine chips, one scrolling row
        of nine with an edge fade, B2's rail and bottom bar. `- Supersedes
        "Supplement roll sections share one tab and a chip panel"
        (2026-10-20).` and the mirror pointer in that file.
      - `2026-10-29-task-57-lands-on-main-in-three-waves.md`: three waves (1,
        1b, 2; 3-7; 8, 9, P, 10), a squash after each wave's last batch review
        and green CI, no owner screenshot gate, `issues/57/` on `main` with
        each squash and deleted there by the closeout (owner, "Wave squash
        content"), one post-release live check after wave 3; an
        inconsistency between batches is accepted when a planned later batch
        removes it (the option with less work, that batch named). Rejected:
        one squash at closeout; a landing per batch; an owner screenshot
        review per wave; `issues/57/` left out of each squash. `- Amends "A
        task branch pushes every batch; a green CI run gates main"
        (2026-10-21): for task 57, three squashes.` and the mirror pointer.
      - `2026-10-29-english-text-uses-american-spelling.md`: American
        everywhere it can change; the kept classes of S10.3; rejected: British
        everywhere; American in the UI only.
   5. `tests/app/inventory.js`: a new state `#/roll/vault_of_ages ~
      supplements menu` (the menu open on a supplement page; RU and EN
      goldens; its axe case is `modeRow.test.ts`). The account menu state
      `#/roll/std ~ account menu as gm1` keeps its id; its golden moves.
   6. Goldens: `npm run build:test`, then `node tests/app/golden.js --update
      --shard=n/4` for n = 1 to 4 (each call fits 600 s). Every golden moves
      (the header, `footSummary`). Then `git diff --stat --
      tests/app/snapshots` and a read of a sample per class: the job row, the
      mode row, the account control, the pin and help names, the footer line,
      "Color", the respelled `# why:` lines. A changed line outside those
      classes is a defect to fix in code, never in the golden.
S12. Polish, evidence and gates.
   1. Impeccable `polish` and `harden` on `Shell`, `TabBar`, `ModeRow`,
      `Menu`, `AccountMenu`, `PageHead`, `HelpButton` and `Toast`; outcome in
      `handoff.md`. `impeccable detect --json --no-inline-ignores app/src`:
      no finding in a touched file (N3 advisories excepted); `git grep -n
      impeccable-disable -- app/src` returns nothing.
   2. C34 and A15 (`verify`): check the toast on the live site first and
      name what the plate fixes.
   3. The screenshot set from `npm run build:test` into
      `issues/57/mocks/2/built/`, at 360 and 1180, RU and EN: the header on
      `/roll/std` signed out, `/roll/hnf` pinned, `/roll/vault_of_ages`
      signed in, `/lists` (the ring), `/i/ci1` (nothing lit); the longest
      supplement names (`/roll/many_worlds_tavern`, `/roll/community_items`);
      the supplements menu open; the account menu open; the three toasts; a
      page head from 760 px with the labelled pin and «Справка».
   4. The header measured at 360 and 1180 in both languages: the sticky part
      (brand row and job row) and the mode row; the figures go into
      `FEATURES.md` "Chrome" and DESIGN.md. The `FIRST_SCREEN` log of
      `app/states` (case 83) for every row goes into `handoff.md`.
   5. Gates (Verification, below), then one commit
      `feat(ui): ship the shell, the vault-die mark and American spelling`
      (body: the contract set, "docs/fixtures/ unchanged", the kept forms),
      push, the CI credit.

### Acceptance criteria

- Three jobs with their icons at every width in RU and EN; the lit job on
  every roll, tables and search route; nothing lit on `/i/`, `/h/`, `/p/`,
  `/s/`, `/lists`, `/lists/<uuid>`, `/account`, `/homebrew` and its pages.
- «Бросок» opens the last roll section of this tab, else the pinned start
  section when it is a roll section, else `/roll/std` (owner, R7;
  `app.test.ts`). The memory holds the canonical section (`/roll/hnf` gives
  `/roll/std` with no source switch); `STATE.md` says memory only.
- The mode row has three controls on each of the nine roll sections and none
  elsewhere. `/roll/core`, `/roll/hnf` and `/roll/all` light «Обычные
  правила»; `/roll/dread`, `/roll/voa` and every other supplement alias light
  the menu button with that supplement's name. Both sets are `routes.json`
  replay rows. The lit control's text equals the page's H1 (B5-2).
- At 360 the mode controls are 40 px tall and hold the longest supplement
  names in two lines in RU and EN (N5; mock 2, `mode-long`).
- The «Дополнения ▾» menu: seven links in `SUPPLEMENTS` order, the open one
  checked with `aria-current`, 44 px items, the menu keys of the account
  menu, its height at 360 named in the handoff.
- `Menu.svelte` serves the account menu and the supplements menu;
  `AccountMenu.svelte` keeps no keyboard code of its own.
- `SupplementNav.svelte`, `supplementNav.test.ts`, their `COVERAGE.md` row and
  `a11y.test.ts` entry are gone (C48); `FEATURES.md` "Rolling" holds no
  supplements panel.
- The account menu in the `FEATURES.md` order with no counts (R3); «Мои
  предметы» capitalised (M4-2).
- The account control: «Войти» / "Sign in" visible at 360 and 390 in both
  languages; signed in, the initial and the chevron; the gold ring on the
  account pages of the constraints and while its menu is open (A37, N6).
- The brand shows the mark and «Лут» / «Loot»; `<title>`, the manifest name
  and `en/index.html` keep their text; DESIGN.md records the header-only EN
  wordmark.
- The sticky header is no taller than 112 px at 360 in both languages; the
  mode row scrolls; the measured figures are in `FEATURES.md` "Chrome" and
  DESIGN.md.
- The pin and «Справка» are labelled from 760 px with the N4 pair; below 760
  px the round buttons keep the same names; the pressed pin shows the neutral
  check. A button whose panel the owner renamed is renamed by batch 3 or 5.
- The toast is a plate; the error toast is the Alarm Red fill with dark ink
  at 4.5:1 or more; the toast priority rules of `FEATURES.md` "Chrome" hold
  (the existing shell and state cases pass).
- D121: the two `shell.test.ts` cases pass; the entry leaves `DEBT.md` and the
  "Tool UI redesign" section stays for D116.
- The contract set: `routes.json` (`tab` as the job, the new `mode`),
  `tests/app/contracts.js`, `hash.test.ts`, the `/en/roll/dread` probe,
  `CONTRACTS.md` section 1, `ROUTES.md` "Sections", the `COVERAGE.md` rows,
  `llms.txt` with `tests/contracts.js` and `CONTRACTS.md`, all in the one
  commit; `docs/fixtures/` otherwise unchanged.
- The language switch is unchanged (a `Seg` control, `replaceState`).
- The mark: `icon.svg`, `favicon.svg`, the four PNGs, the header and both
  share cards draw the vault die; every document that had the emoji favicon
  links `favicon.svg`; `tests/derived.js` and `lib.test.mjs` hold the four
  copies to one drawing; `cards.mjs --check` passes; the 16 px renders are in
  `mocks/mark/png/shipped__*` with the outcome in the handoff; the
  `collect-site.sh` guard names `icons/favicon.svg`.
- `docs/artwork.md` "Icons" and "The site share cards", `META.md` (icons)
  and DESIGN.md "Brand" describe the mark.
- The spelling: the word-list grep over the paths in scope returns only the
  kept classes of the decision file; the handoff gives the count per class.
  `tests/derived.js` holds `dict.ts` EN and `llms.txt` to the rule;
  `I18N.md` states it; the decision file is indexed.
- The navigation and the waves decision files exist with their pointers in
  the older files; `node tools/decisions.js` leaves `docs/DECISIONS.md`
  current.
- The interim mix (owner, `reviews/1.md` R3): no chip turns neutral in this
  batch; the waves decision file names the rule.
- `FIRST_SCREEN` (`reviews/1.md` N7) still keys each row by its inventory
  state with `shipped: false` and no batch id; the logged offsets after the
  new header are in the handoff.
- The new state `#/roll/vault_of_ages ~ supplements menu` has its inventory
  entry, RU and EN goldens and an axe case; every other golden is re-seeded,
  none edited by hand.
- DESIGN.md "Navigation" ("Tabs", "Brand"), The Two Breakpoints Rule, "Layout",
  "Toast", "Chips" and The Same Label Rule match what ships (section 4).
- The owner's mock 2 notes (rounds 1 to 5, `mocks/2/index.html`) are applied.
- `polish` and `harden` ran; the detector line holds; the screenshot set is
  in `mocks/2/built/`.
- The gates below pass; CI is green on the pushed tip.

### Verification

In this order, after S11:

0. `npm run check:db` through the PowerShell tool (about 13 min;
   `bash-guard.mjs` rule 2m requires it for the `tests/db/` comments). Then
   stop Supabase and Rancher before the next check (a busy WSL VM slows
   `check:fast`).
1. `rtk npm run check:fast` (Bash timeout 600000).
2. `npm run lint:untyped`, `npm run lint:typed`.
3. `node tools/build.js` (no unexpected change), `node tools/decisions.js`.
4. `npm run check:built`.
5. `npm run build:test`, then `node tests/run-all.js
   app/contracts,app/states,app/typo,contracts,dataint,derived,stub` and
   `node tests/app/sweep.js 360` (the header at the narrowest width; CI runs
   390, 768 and 1180).
6. `node --test tools/artwork/lib.test.mjs`; `node tools/artwork/cards.mjs
   --check`.
7. `node .claude/hooks/selftest.mjs` once, on its own (434-563 s; past 600 s
   run it in the background).
8. `impeccable detect --json --no-inline-ignores app/src`; the spelling grep.
9. Commit, push, the CI credit (`ci-credit.mjs`). A batch review follows
    (triggers: public contracts, `.claude/hooks/`, prompts and agents).

A fix pass after the review that touches `tests/db/` runs step 0 again; one
that touches `.claude/hooks/` runs step 7 again.

### Risks and do-nots

- Do not hand-edit a golden; re-seed it.
- Do not respell an identifier, a stored or seed value, a golden id, a
  decision file name or title, or a quotation (the decision file's classes).
- A hook edit that breaks a hook breaks the session's guards: edit comments
  and messages only, `node --check` each file, then the selftest.
- A guard may refuse a write under `.claude/` or to `CLAUDE.md`: stop and
  return the text.
- Do not move a chip to neutral, a help panel's name, or the H1 at 360: later
  batches own them.
- `routes.json` is a public contract: change `tab` and add `mode`, nothing
  else.
- Review order for the batch review (section 12): the shell code, then the
  contract set, then the mark, then the prose.
- A stale tab (a bundle from before wave 1) keeps the old header until a
  reload; every address still resolves. A browser keeps the old favicon in
  its cache for a while.

### Standing checks for batch 2

1. Scale. No collection or cap changes. States:

   | State | Shows | Proof |
   |---|---|---|
   | each of the nine roll sections | three jobs, «Бросок» lit; the mode row, its lit control | `tabBar.test.ts`, `modeRow.test.ts`, `routes.json` |
   | a table, `/tables`, `/search` | the lit job; no mode row | `routes.json`, `tabBar.test.ts` |
   | `/i/`, `/h/`, `/p/`, `/s/` | nothing lit | `routes.json`, `tabBar.test.ts` |
   | `/account`, `/lists`, `/lists/<uuid>`, `/homebrew`, its tabs and the editor | no job lit; the account ring | `shell.test.ts`, mock 2 `header` |
   | the seven supplements in the menu (the menu's whole length) | seven 44 px items, the open one checked | `modeRow.test.ts`; its height at 360 in the handoff |
   | the longest supplement names at 360, RU and EN | two lines inside a 40 px control | screenshot set, `sweep.js 360` |
   | signed out at 360 and 390 in EN | «Войти» / "Sign in" visible, nothing cut | `shell.test.ts`, `sweep.js 360`, CI 390 |
   | the header at 360 and 1180, RU and EN | sticky part at most 112 px at 360; the mode row scrolls | the handoff's measure |
   | a long toast (rule 16) at 360 | the plate wraps within the window less 16 px a side | the existing toast cases, screenshot set |

   The primary action of each page is unchanged. The menu at 360 opens under
   its button with no on-screen keyboard (no text field); the account menu as
   today.
2. Error scenarios: no write path or stored shape changes. Loading - the
   session unknown draws no account control, as today; `rollHash` needs no
   read. A failed read and offline - the header needs no data; the favicon
   and icons are static files. A conflict and a deleted record - none. A
   stale tab - the old bundle draws the old header and the old favicon until
   a reload; every address resolves, because no route changes. A revert - the
   previous frontend draws five tabs again; nothing is stored (the last roll
   section is memory per tab), `dhloot.home.v1` keeps its shape, and the
   reverted commit brings back the emoji favicon and the star.
3. Consistency: rule 4 (one name for one thing) - the lit mode control reads
   its page's H1 (B5-2); the departures are the job «Бросок» (a group of nine
   pages, no heading of its own) and the menu button's name (it shows the open
   supplement). Rule 11 - Escape and a click outside close both menus the same
   way (one `Menu`). Rule 20 - D121, the toast's focus return. The Same Label
   Rule - the labels hold at every width, except the interim round pin and
   help below 760 px, named with the batches that move them. Sibling headers:
   none; every page shares the one shell. The toast keeps its priority rules.
4. RU/EN parity: new and changed strings, both languages, the same facts:
   `jobRoll` «Бросок» / "Roll"; `modesLabel` «Режим броска» / "Roll mode";
   `brandWord` «Лут» / "Loot"; `homeHint` «Открывать при запуске» / "Open on
   start"; `helpHint` «Справка» / "Help"; EN `footSummary` "... Sources and
   license", EN `printColor` "Color" (the RU strings keep their text). The menu
   caption reuses `grpSupplements`, the mode labels `pageStd` and `pageAlt`.
   No plural form is added. A key that loses its last caller (`alt` «Альт.
   таблицы», `std` if unused) leaves both languages.

### Gate cost

Section 8, row 2: 65-75 min of extra gates on top of the 45-60 min of a code
batch, then the wave 1 squash (section 16, about 12-14 min).

### After batch 2: the wave 1 squash

After batch 2's batch review (and its fix pass, if any) and the green CI run
of the branch tip, wave 1 lands by section 16. The orchestrator runs it; it is
not the implementer's step.

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
   («Все»), the filter sheet and the selection mode; batch 4, the «Ещё» menu and the bottom sheet; batch P, the `/p/` «Ещё» menu and the one-card-per-row preview at 360 (QP.6); batch 8, the
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
- Risk: batch 2 is the widest diff (the shell code plus the spelling sweep
  over about 540 files and every golden); section 10 orders the review (the
  shell code, the contract set, the mark, then the prose) and re-seeds the
  goldens locally, so the first CI run can be green.
- Risk: a usage wrap-up stops batch 2 mid-sweep; the step ids S1-S12 of
  section 10 let a fresh implementer continue from the progress line.

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
| 3 / `catalog` | first table row | fail, 632 / 586 | fail, 399 / 399 | At 360 the H1 is the table picker («Оружие ▾» / "Weapons ▾", with «Снаряжение · Core» / "Equipment · Core" under it), which opens a sheet with the group and book chips (C7); one row holds the search and «Фильтры · N» / "Filters · N"; the link goes into «Ещё» / "More"; the section head holds the count, the view switch and «Выбрать» / "Select" (R3). About 215; re-measured at mock 3 against the 240 target. At 1180 the H1 and the group chips share one row, the sub-tables are the second, and the search, count and «Выбрать» share the third beside the filter column. About 240. (3) |
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
