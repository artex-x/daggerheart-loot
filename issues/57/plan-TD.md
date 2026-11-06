# Batch TD - Thumb, Reading Time, Drop, gap, Measure (implement-ready; T, D and the Measure Rule in one batch)

This brief merges three briefs into one batch (owner, chat, 2026-11-05, `plan-rebatch.md` option B and `context.md`
item 15): `plan-T.md` (the Thumb Rule, the Reading Time Rule), `plan-D.md` (the Drop Rule, `--gap-plate`, the plate, the
lead cap) and `plan-text.md` (The Measure Rule). It is the implementer's map: the order of the steps, the case numbers,
the acceptance map, the overlaps and the gates. The three briefs stay the source of every decision, step and figure;
where this file differs from one of them, this file wins. Mocks: `mocks/T/`, `mocks/D/`, `mocks/text/`. A mock is
direction (owner, 2026-11-03). Section numbers ("section 7") are those of `plan.md`. The repository cites no file of
`issues/57/`.

Batch TD runs after batch 9b, its remediation, the batch CI split and the CI fix pass (tip `a8bdf1de`, CI green, credit
armed), before batch N.

## Objective

One batch of whole-system rules on every route, with no golden tree moved except six headers:

- Up to 600 px every pressed control is a 40 px thumb target (`--thumb`), every toast stays 4000, 7000 or 10000 ms and
  holds while touched, the `FIRST_SCREEN` rows at 360 keep their limits through spacing folds (`plan-T.md`).
- A dashed border means "drop here", so the screen draws none; the empty plate sits 16 px (`--gap-plate`) under the
  row above it (`plan-D.md`).
- Text keeps the measure of its class: a line 120ch (`--measure-line`), a passage 70ch (`--measure-text`), a box that
  holds only a passage is as wide as its text, a lead of one or two sentences takes one line while its column allows
  it (`plan-text.md`; this replaces D's lead cap).

Nothing is stored; no string changes; no route, contract or stored key moves.

## Dispatch preflight (merged)

- `git fetch origin`; merge `origin/main` into `claude/57` if it moved (a merge, never a rebase). `git log --oneline -6`
  must show `a8bdf1de` or later.
- Read, in this order: this file, `plan-T.md`, `plan-D.md`, `plan-text.md`. The preflight lists of the three briefs
  apply (the shipped components they name); a line that no longer matches the code is the implementer's to adapt, and
  `handoff.md` names the change. Batch 9b, the CI split and the fix pass changed `ListPage`, `SharedListPage`, `HitNote`,
  `RollPage`, `Chip`, `Seg`, `ListFind`, `RequestsPanel`, `SharePanel`, `states.js`, `tests/app/shard.js`.
- Case numbers (owner, 2026-11-05): 108 the toasts and 109 the targets (T); 110 the plates (D); 111 the text measure
  (the Measure Rule; D's lead case is widened into it). Batch N takes 112 and 113, batch P 114 and 115.
  `states.js` holds 107 as the last case today.
- Host: memory-starved. Run vitest with `VITEST_MAX_WORKERS=2`, one file at a time, and no browser suite in parallel
  with vitest. One `build:test` serves every loader run of a step group.
- Impeccable cannot run from a subagent. The orchestrator runs `critique` on `mocks/T/`, `mocks/D/` and `mocks/text/`
  before the dispatch and `polish` and `harden` once after the prose step (T: the roll pages, the catalog, `/search`,
  `/lists`, the list pages, the selection bar at 360 and 390 px; D: `/search`, `/tables/eq_weapon` (nothing found),
  `#/lists`, `#/homebrew` and a list page with a GM-only entry at 360 and 1180 px; text: a help panel, a note, the
  sign-in lead at 768 and 1920 px); fallback `impeccable:impeccable-finish-reviewer`.
- The line "Session end partial progress" in `handoff.md` names the last finished merged step (TD-1 to TD-12 below).

## The merged order of steps

Each step names the steps of the source briefs it contains. Do them in this order; a step is committed with the batch,
not alone (one commit, one push, at the end).

| Step | Contains | Notes |
|---|---|---|
| TD-1 Tokens | T S1 (`--thumb`), D S2 (`--gap-plate`), text section 4 (`--measure-line`, `--measure-text`) | One edit of `tokens.css`. |
| TD-2 Cases red, then the before columns | D S1 (case 110 red), the text brief's case 111 (red at HEAD: `/search` from 768 px draws two lines, the help panel box is 1097 px, the footer licence lines are 1391 px), T S3 step 5 "before" (`FIRST_SCREEN` at 360, RU and EN, through the loader of case 83) | One `npm run build:test` of the unchanged tree. Write cases 110 and 111 and run them red; keep every figure as the before column in `handoff.md`. |
| TD-3 Boxed controls, text links, the card corner | T S2, S4, S5 | The components of the Files table of `plan-T.md`. `Toast.svelte` takes its `.toast-act` floor here and its offset and hold in TD-5. |
| TD-4 The first-screen folds | T S3 | After TD-3. Measure `FIRST_SCREEN` at 360 and write the after column; a row past 256 takes a fold or its measured `exception` (T acceptance 8). |
| TD-5 Toasts | T S6 | `Toast.svelte` also takes the text rule's `max-width: min(var(--measure-line), calc(100% - 32px)); text-wrap: balance` in this step: one edit of the file, not two. |
| TD-6 The plate and the other dashes | D S3, S4 | The plate parents (`TablesPage`, `HomebrewPage`, `ListsPage`, any other case 110 names), then the dashes of the inventory. `HitNote` takes D's solid border here and the text rule's hugging box in TD-7. |
| TD-7 The Measure Rule CSS | the table of `plan-text.md` section 4; D S5 | `PageHead` and `PageTitle` `.page-sub` take `max-width: var(--measure-line); text-wrap: balance` once; D S5's literal `120ch` is not written. `HelpBox`, `HitNote`, `ListPage` `.lnotes > .hitnote { width: auto }`, `SignInPrompt`, `ErrorPage`, the plate causes and hints, `NoticeBox`, `HomebrewEditor` `.esub`, `SharePanel`, `RequestsPanel`, `PrintPage`, `Shell` `.foot-licence p`, `AccountPage`, `PickRow` (a comment), `tools/build-pages.js` (`main` 70ch). Then `node tools/build.js` regenerates the static pages. |
| TD-8 The checks | T S7 (`targets`, the sweep step, case 109) and S8 (unit tests, case 108, case 83 rows); D S6 (`tests/derived.js` "Dashed means drop"); the text brief's derived block "One measure"; D S1's case 110 and the text brief's case 111 run green | One edit of `tests/derived.js` holds both blocks. Case 111 replaces D's S7 (the lead). |
| TD-9 Prose, in the same commit | T S9, D S8, the text brief's DESIGN.md, FEATURES.md and COVERAGE.md lists | See "Overlaps" for the sentences that one brief replaces in another. `git grep -n -i dashed -- DESIGN.md docs/specs app/src tests` finds only the print card, The Drop Rule's own text, the derived check and `PrintCard.svelte`. |
| TD-10 Goldens | D S9 | Six headers only (the `why` text of six `inventory.js` states), re-seeded with `--only`, one id per call. Any other moved golden is a defect of this batch. T and the text rule move none. |
| TD-11 Evidence | T S10, D S10, MT-7 | `mocks/T/built/`, `mocks/D/built/`, `mocks/text/built/` (`shoot.js` from `mocks/9b/built/shoot.js`); the before and after tables go into `handoff.md`. |
| TD-12 Gates and one commit | the Verification lists of the three briefs, run once each | `check:fast` last (Bash timeout 600000). The commit subject names the three rules; the body gives the reason and the effect. Push. |

## Overlaps and what this file settles

| Overlap | Resolution |
|---|---|
| D-6's literal `max-width: 120ch` on `.page-sub` against the text rule's token | The token `--measure-line` (the same value) with `text-wrap: balance`. D acceptance 5's `git grep -n "gap-plate"` stays; a new `git grep -n -E "max-width: *[0-9.]+ch" -- app/src` finds only `PickRow.svelte` (the derived block enforces it). |
| D's lead case 113 (D S7) against the text brief's case 111 | One case, 111, "the text measure" (the text brief, section 5). D acceptance 7 and 8 are proven by its part (a). D's line "`/account` RU two lines inside its column" is superseded by MR-5: the 70ch cap moves from the column to the sign-in panel and the lead takes one line from 768 px in RU and EN. |
| D S8's One Width Rule sentence and its "Typography", "Hierarchy" Body line | Replaced by the text brief's section 4 ("Its measure follows The Measure Rule."; the Body Small "Notes cap at 62ch." goes). D's Body line "Prose caps at 70ch (The One Width Rule)" is not written. |
| `Toast.svelte` (T: `.toast-act`, the bar offset, the hold; text: `max-width`, `text-wrap`) | One edit in TD-5; T acceptance 13 and the text rule's toast row both hold. |
| `HitNote.svelte` (D: solid border, `.gm` ground; text: `width: fit-content`, `.htext` cap) and `ListPage.svelte` (D: `.titleinput`, `.addrow`, `.narea.gm`, `.lrow.gm-only`; text: `.lnotes > .hitnote`, `.guess-note`) | Different declarations in the same files. Case 111 (b) reads a list page with its notes open at 1180 and fails if a note there is narrower than its column (the text brief, section 9). |
| `ListsPage.svelte` (D: the plate's top; text: `.hint`) and `TablesPage.svelte`, `HomebrewPage.svelte` (D: the `:has` pair; text: `.cause`) | Same files, different rules; case 110 is the arbiter of the plate's top, case 111 of the cause's measure. |
| `tests/derived.js` | Two blocks after "American spelling": "Dashed means drop" (D S6) and "One measure" (the text brief). Each first asserts its pattern matches a positive sample and not a negative one. |
| The named-rule budget of 8 per DESIGN.md section | "Shapes": The Drop Rule (2 of 8). "Typography": The Measure Rule (6 of 8: Ten Steps, Capitals, Numerals, Whole Message, Local Font, Measure). "Components": The Reading Time Rule (5 of 8). "Layout" gains none (the Thumb Rule merges into The Phone-First Rule). |
| `FIRST_SCREEN` rows at 1180 | D and the text rule raise nothing; the lead on one line lowers `#/search ~ searched`, `#/search ~ kind picked` and `#/homebrew as gm3` by about 22 px (case 83 keeps their limits). `/lists` and `/account` signed out rise about 22 px from 768 px; they are not `FIRST_SCREEN` rows, logged in `handoff.md` (MT-7). |
| Batch N's `PageHead` rewrite | N keeps `var(--measure-line)` and `text-wrap: balance` when it moves `.page-sub` (`plan-N.md`, preflight). TD edits `PageHead` by CSS only (the lead rule and T's `.homebtn`, `.helpbtn` floors). |

## Acceptance (each line is checked and its outcome is in `handoff.md`; 44 lines)

1. T-1 to T-20: `plan-T.md`, "Acceptance criteria" 1 to 20 (the Thumb Rule and its check, the token, from 601 px nothing
   grows, the 24 px floor, text links, 8-P1, case 109, the first-screen rows with the folds or measured exceptions, the
   header hold, the Reading Time Rule and case 108, the hold, the queue order, the bar offset, the toast over «Ещё»
   numbers, no golden moves, the DESIGN.md and FEATURES.md text, the timing comments, parity, `polish` and `harden`,
   the detector).
2. D-1 to D-14: `plan-D.md`, "Acceptance criteria" 1 to 14, with case 110 for the plate (D-2, D-5, D-6) and case 111
   (a) for the lead (D-7, D-8). D-9's prose follows "Overlaps". D-10's rows are asserted in case 83 with T's exceptions.
3. MT-1 to MT-7: `plan-text.md`, section 8, item 1 (the tokens, case 111 (a) and (a2), case 111 (b), the derived block
   "One measure", the prose, `tools/build-pages.js` at 70ch with `node tools/build.js`, the before and after lines in
   `handoff.md`).
4. TD-P1 (6-N1, from `handoff.md` Deferred, the next batch with a golden re-seed): one probe reads the first-content
   offset of `#/homebrew/<id>` with a 120-character name at 1180x720 (the `h1` takes three lines from 761 px; the review
   estimate is about 240 of 288), or an inventory state is added as the fourth `FIRST_SCREEN` row; the figure is in
   `handoff.md`.
5. TD-P2 (CI fix pass, case 89): at 360x640 in RU the roll row of `«Оплот Шершней»` and `«Проклятые предметы»` keeps one
   line with the long part cut by its ellipsis and the first result at or under today's 246.69 px (T3's folds lower
   it); case 89 stays green and `handoff.md` logs both figures. Batch 10 audits the cut itself.
6. TD-P3 (9a R2 probe and the focus jump, `handoff.md` Deferred): TD builds no fix. The probe (360x640 RU,
   `LIST_A ~ noted as gm4`: open the list «Ещё», close it by Escape and by a tap outside, read `scrollY` and the
   header's top) runs once after the 40 px «Ещё» and its figures go into `handoff.md`; the row stays for `DEBT.md` at
   closeout.

## Standing checks

The four checks are answered in the three briefs; the merge adds no state, no write path and no string.

1. Scale: the States tables of `plan-T.md` (empty, one, many, the limit and one past it, the longest text, 360 and 1180
   px), `plan-D.md` and `plan-text.md` section 7 hold. Added by the merge: the longest text at 360 with the 40 px
   controls and a 120-character plate query (case 110 at 360), a four-thousand-character note at 70ch (case 111 (b)
   reads the cap, the length is arithmetic), and the sticky regions are unchanged (the selection bar grows about 24
   px and the toast floats above it, T10).
2. Error scenarios: not applicable to storage (CSS, sizes, durations and tests only). Toasts of every error read 7000 or
   10000 ms and hold while touched; `LoadState` and `ErrorPage` draw no plate; a stale tab draws the old sizes and
   widths; a revert returns them; nothing is stored.
3. Consistency: `FEATURES.md` "Consistency rules" 2, 4, 6, 9, 14 and 20 are followed (the three briefs name them). One
   token per rule across siblings; named differences: the 44 px menu and row targets, the text links' padded boxes, the
   `/lists` card's corner «Ещё» (T5), `/roll/std` and `/s/` first-screen exceptions, the print card's dashed cut line,
   the menu item's second line (28ch), the signed-in account and the dossier widths, the row description's clamp.
4. RU/EN parity: no string is added or changed. The long toast class reads both languages; the measure is in `ch`, so RU
   and EN take the same box; every browser case reads both languages.

## Gate cost and the split criteria

| Item | Minutes |
|---|---|
| One code batch: dispatch, `check:fast` (12-14 with `VITEST_MAX_WORKERS=2`), one CI run (10.5-11.5), one review fix cycle (22-26), the screenshot set (8) | 45-60 |
| T extras (`plan-T.md`, "Gate cost"): the three vitest files, the loader runs of cases 83, 108 and 109 before and after, `sweep.js 360 ru` once | 30-38 |
| D extras (`plan-D.md`): two vitest files, `derived`, the loader runs of cases 110, 111 and 83 red then green, six `--only` re-seeds, the shots at 360, 1180 and 1920 | 25-35 |
| The Measure Rule (`plan-text.md` section 6): the CSS of 12 files, the derived block, case 111 at five widths, the prose | 40-55 |
| Shared once: lints, `check:built`, the detector, `polish` and `harden`, the `build:test` and shot setup | 15-20 |
| The batch review (45 source files and 12 more, six goldens; grown by 10-15 for the merge) | 25-35 |
| **Total** | **168-230** |

Split criteria (`CLAUDE.md`, "Task and session protocol"): T, D and the Measure Rule are one batch because they share the
components, the seed and the gates and none of them moves a golden tree (merge, `plan-rebatch.md`). TD is split from 9b
by its own route set (every route up to 600 px, every plate state, every text block) with a re-baseline of every
`FIRST_SCREEN` row at 360; from N by a different route set (the nine roll pages, `/tables/*`, `/homebrew` from 761 px) and
its own 145 goldens, which together pass one review pass (about 65 files and 150 goldens). A split with no criterion is
a merge.

## Writer tier, review and confirmation (facts for the orchestrator's dispatch; not a model choice)

- Writer tests (`orchestrate.prompt.md`, "Writer tier"): test 1 no (T1-T12, D-1 to D-8 and MR-1 to MR-6 are defaults,
  the owner answered the rest); test 2 no (sizes, durations, borders, widths and test limits; no contract, route, stored
  state, product law, hook or configuration); test 3 yes, in part (the folds at 360, the card corner, the header hold,
  the plate's ground and the hugging help panel rest on visual judgment against the mocks; six header re-seeds).
- Review: required (`orchestrate.prompt.md`, "When to run reviewer"): visual parity and changed UI on every route;
  generated artifacts changed (the static pages regenerate through `tools/build-pages.js`). The reviewer's dispatch
  names the guideline set of `context.md` item 10, the Clarity Rule and the Measure Rule's sources. One remediation
  pass.
- Plan review: not required (no trigger fired). No migration, no `SECURITY DEFINER` function, no public contract change
  (the static pages' URLs are frozen, their CSS is not), no stored data or key, no write or sync protocol.
- NEEDS_HUMAN_CONFIRMATION: no. The owner may take, at the mock, D-2's option B (a plate with no border), MR-4's fallback
  (help paragraphs as lines inside the hugging box) or MR-5's alternative (the account's column cap); each is one line.

## Risks and do-nots

- One red gate blocks all three rule sets: run the loader cases (83, 108, 109, 110, 111) before `check:fast`, not
  after it.
- Do not grow anything from 601 px (T). Do not add a dashed style for the drag (D). Do not cap the record text or the
  row text (the Measure Rule): both are settled.
- Do not write a `ch` literal in a component (the derived block fails on it); do not write `height: 40px` in a new media
  block (T2).
- `:has()` with a `:global(.empty)` inside a scoped rule: if `npm run check` prunes it, write the whole selector inside
  one `:global(...)` and name it in `handoff.md` (D).
- The sweep's hit test scrolls each undersized control into view; up to 760 px the header hides on a scroll down, so a
  probe that lands on the shown header is a real cover (T).
- Never loosen a check to pass; adapt a stale case and name it in `handoff.md`.
