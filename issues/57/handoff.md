# Handoff - TASK 57
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress. Waves 1, 2 and 2b are on `main`. Wave 3 has built 9a, 8, 9b, the CI split, the CI fix pass
  and now batch TD (T + D + The Measure Rule; `plan-TD.md`), committed and pushed on `claude/57` (the sha is in the
  implementer's report; the handoff cannot name its own commit). CI of the TD tip is the full gate (the sweep at four
  widths, the goldens, cases 108-111): not yet run.
- Next batch: N (`plan-N.md`; cases 112 and 113), after TD's review and its one fix pass. Writer tier: opus, test 3.
- Review: required (trigger: visual parity and changed UI on every route; generated artifacts: the static pages'
  template `tools/build-pages.js` changed). Name the guideline set of `context.md` item 10, the Clarity Rule and the
  Measure Rule's sources in the dispatch. `polish` and `harden` on the T, D and text surfaces are the orchestrator's.
- Order after TD: N, P, 10, then the wave 3 squash, the wave 3 blind review with its remediation, the closeout and the
  whole-app blind review (unchanged from the fold; `plan.md` section 7). The squash message takes `reviews/9b.md` R7's
  corrected text.
- NEEDS_HUMAN_CONFIRMATION: no. Figures for the owner, not gates: the folded requests strip at 360x640 starts the rows
  at 303 px (owner's figure 292); `/s/<token>` at 360x640 now starts at 308.2 px (exception 309, was 302).
- Defaults taken in TD (owner AFK; the orchestrator logs them in the AFK decisions file):
  1. `/s/<token>` at 360x640: the thumb-size «Сохранить себе» (32 to 40 px) moved the first entry from 301 to 308.2 px;
     no spacing fold is named for that row, so the exception took the measured value, 309 px (`plan-T.md` T3 and S3
     step 5), for `/s/player-token-1` and its long-name state at 360. DESIGN.md "The First-Screen Rule" names it.
  2. `TARGET_ALLOW` gained a fourth class: a link of a record's craft or relation line (`.craft a`, 19 px lines of
     comma-joined links under a label): its size is set by the label's line height (WCAG 2.5.8 "Inline"); a padded box
     there would overlap the next line's links. DESIGN.md "The Phone-First Rule" names it.
  3. Text links and text buttons reach 40 px by a padded box whose growth is given back by a negative margin computed
     from the line (`max(0px, (var(--thumb) - 1lh) / 2)` and its negative), so no `@media` block holds a literal 40;
     the brand keeps the plan's literal 5 px.
  4. The roll picker's invisible `select` covers the box's border (`inset: -1px` in `RollSelect`), so the whole 40 px
     box is its target (the plan named `AltPanel`'s `.pick select`; the rule lives in `RollSelect`).
  5. `AccountPage` signed in below 1000 px keeps the passage measure on its column (`.col:has(.acc)`), so the signed-in
     page does not widen at 761-999 px; signed out the cap moved to the sign-in panel (MR-5).
- Last agent: implementer (batch TD). No subagent runs. No worker has uncommitted code edits.
- Branch: `claude/57` (worktree `.claude/worktrees/57`)
- Base / starting commit: `d8e30731`; previous sha of TD: `ee4ddc74`.
- Pushed: the TD commit (sha in the implementer's report).

## Completed
One line per shipped batch. The full acceptance tables, deviations and measurements of batches 1 to 9a are in
`git show c489766a:issues/57/handoff.md` (the Cleanup line under Notes).

- Batch 1 - foundation (fonts, the ten-step ramp, the art well): `9a31aede`, fix `80872b35` (`reviews/1.md`).
- Batch 1b - the no-picture placeholder retired: `fce4a9f8` (`reviews/1b.md`, approve).
- Batch 2 - the shell, the vault-die mark, American spelling: `30de6bf5`, fix `65829261` (`reviews/2.md`, approve).
- Wave 1 (1, 1b, 2): squashed onto `main` as `d83384b4`, merged back as `51370bf8`.
- Batch 3 - the catalog head, filters and selection bar: `ef44bb5d`, fix `cd36b52f` (`reviews/3.md`). Q3-S removed the
  catalog's per-section strip.
- Batch 3b - the hide-and-show header and the focus fix: `38767ca4`, fix `ed7d353a`.
- Batch 4 - the record card, actions, item page, dialog, `/h/`: `91bdcc55`, fix `4cfe9d91` (`reviews/4.md`; 4-R1 deferred).
- Batch 5 - the roll pages and the card face: `9d4f47ec`, fix `da96cbf3` (`reviews/5.md`).
- Batch 6 - the homebrew editor, pages and imports: `96710fe3`, fix `3e0106c8` and `0a43491f` (`reviews/6.md`).
- Batch 7 - search, account, empty and error states: `2c3f3833`, fix `30735930` (`reviews/7.md`).
- Wave 2 (3, 3b, 4, 5, 6, 7): squashed onto `main` as `dbd3cf73`; the post-wave-2 remediation `cd32174d`
  (`reviews/post-wave-2.md`).
- Batch 7b - one tag rule, one-box badges, a steady table head, compact roll results: `d10ffa41`, fix `4874ed63`
  (`reviews/7b.md`).
- Batch W - the page column grows to 1440 px and centers: `8b1bc021`, fix `5566dbf0`.
- Wave 2b (7b, W): on `main` as `b6f153a5`, merged back as `8b99ac8e`.
- Batch 9a - the list pages on a phone: `6703151d`, fix `6f90ccd6` (`reviews/9a.md`, approve).

- Batch 8 - the lists page, list cards, lists import, the add-to-list menu, the stepper and the ceiling
  (`reviews/8.md`, remediated): its acceptance table, deviations 1-10, the remediation table and its
  verification are in `git show 22f93378:issues/57/handoff.md`.

- Batch 9b - the list panels and five guideline rules (`plan-9b.md`, previous sha `340fa727`). Acceptance:

  | Line | Outcome |
  |---|---|
  | 1 Side column | Done: `.lpage`/`.lside`/`.lmain` in `ListPage`; from 1000 px a 330 px plate at the right, first in the DOM; 761-999 above the rows; up to 760 px 9a's `.lhead` unchanged. Case 105, `listPage.test.ts` (side order) |
  | 2 A1 | Done: `.lrows` is the `lrows` size container; under 760 px of it `.lrow-ctl` takes a line under the text (146 px inset). Case 105 at 768; `sweep.js 768` is CI's |
  | 3 Row controls | Done: «Заметка» (dot + hidden «, заполнена») and «Ещё: <name>»; one `rowMore` and one `noteBtn` snippet for the compact and full rows |
  | 4 Note switch | Done: `noteArea` (neutral `Seg` with `filled` dots, caption, one `MarkupField`, «Готово», «Очистить»), GM field dashed, read-only `HitNote`s while closed; `Seg` gained the `filled` option. Unit test across two switches and the buffer; case 107 |
  | 5 Price switch | Done: «Цены:», `Seg neutral`, «Например: ...»; rows, bar total, price sheet, requests panel and roll line all read the list's mode (they already did; the bar and the roll are asserted in `listPage.test.ts`) |
  | 6 Roll panel | Done: «Бросить по списку» button (`aria-expanded`) opens a `Panel` with `h2`; `RollResult` in a `faces` container, the count/price line, both notes, «Показать в списке» (scroll, 1.5 s flash, focus). Deleted: the `<details>`, `.lroll`, `.panel` copy, `OrGrid`/`RecordCard`/`RecordActions` use here. Kept (other readers: `record.test.ts`): `RecordCard`'s `compact` variant and `nameActions`, `RecordActions` `sendAll` (Deferred) |
  | 7 Share panel | Done: `h2` «Поделиться», two labeled rows with one muted line each, «Скопировать» plain, «Удалить ссылку» bare in the danger color; `shareHint` kept (the two lines do not say that a deleted link stays deleted) |
  | 8 Requests | Done: folded per visit (`folded`), head button «Открыть»/«Свернуть»; the five columns with `th scope=col` («Позиция» added: a name column needs a header); `reqShortLine`; «без цены»; the total with the plural; marks read only while open; the arrival focus opens it. `totalParts` unchanged (the bar keeps its form) |
  | 9 `HitNote` / A22 | Done: full `--line2` box, `gm` dashed on `--bg2`, no gold; `/s/` GM notes use `gm`. Detector: no `side-tab` on `HitNote` |
  | 10 E2 | Done: the 2 px gap line (`::before`/`:last-child::after`); `.lrow` no longer clips (`overflow: visible`, the first cell takes the corners); the `side-tab` entry is gone; cases 17 and 33 adapted and pass |
  | 11 E4 | Done: one edit with the hook live and one `impeccable detect --json app/src`: `config.json` byte-identical; it holds no `ignoreValues`; the `.prettierignore` line and its comment are gone; `prettier --check .impeccable/config.json` passes |
  | 12 Q9.1 | Done: no «?» on `/lists/<uuid>`; the three help states and goldens deleted; `FormField` has no `help`; `QuickItem`'s «?» gone; `moneyHelpFor` and its test deleted. `HelpButton`/`HelpBox` stay (callers: `PageHead`, `RollPage`, `TablesPage`); rule 15 (c) and rule 18 changed |
  | 13 Icon centers | Partly: `typo.js` `SWITCHES` gained the gold «2» chip of `#/tables/eq_weapon/f_tier-2` (column and sheet). The note and price switches need an account list, which the `SWITCHES` loop cannot make: not added (Deferred); `/search`'s kind row not added either |
  | 14 Row Text | Done: no `70ch`; clamp 3 / 2 / 3; DESIGN.md "The Row Text Rule" and "The One Width Rule", FEATURES.md "Tables and search"; the decision file; case 106 (shares under Verification) |
  | 15 Field Measure | Done: `max-width: 720px` from 761 px in `SearchPage`, `TablesPage`, `HomebrewPage`, `ListsPage` (the new-list name field: the plan named it; `/lists`' search is `ListFind`), `ListFind`; case 106 (g) |
  | 16 Stepper | Done: 480 px cap; case 104's `min(480, col)` and the list roll's content width; case 101's cap moved to 480; the 240 px sentences left DESIGN.md and FEATURES.md |
  | 17 Check | Done: `Chip` (button form) and `Seg` draw the check on every pressed option; `chip.test.ts`; goldens unchanged by it (the icon is `aria-hidden`) |
  | 18 Whole Message | Done: `AddToList`'s `.ln` wraps (`lists.test.ts`, 120 characters); the `typo.js` step at 1180 with the allow-list (row description, compact name and line). 360 is not read (Deferred) |
  | 19 Proposed rules | Done: DESIGN.md "Proposed rules" after "Do's and Don'ts", the Stat Columns Rule included |
  | 20 Nine add-to-list `again`s | Done; their EN goldens hold the open menu (checked on `_i_ci1_new_list.txt`, `many lists`, `bar menu`) |
  | 21 8-N2 | Kept: no `_lists` index golden moved |
  | 22 9a R2 probe | See Deferred (the numbers) |
  | 23 Monospace labels | Done: `.lnote`, `.lroll`, `.money-l` gone; `.batch-lbl` already used `var(--ui)` |
  | 24 `FIRST_SCREEN` | Partly: four rows `shipped: true` and pass; `/s/ ~ long name` kept at `shipped: 360` (312 at 1180, Deviation 3); the requests row asserted with a 324 px exception at 360, named in DESIGN.md |
  | 25 Wide lines | Done: W2 (case 105 at 1920/2560), W3 (`/s/` one column), W4 (case 105), W6 (shots), W7 (DESIGN.md "Layout"); W1 by M18 |
  | 26 New states | Done: `~ note open`, `~ note open, gm`, `~ list notes open`, `~ row menu`, `~ prices in coins`, `~ mid band` (gm4), `SHOP ~ requests open`, `GM2_LIST ~ notices open`; `~ rolled` and `~ roll panel` reused; axe on each is the unit tests' (`listPage.test.ts`, `requestsPanel.test.ts`), not a browser axe case |
  | 27 Parity, detector | Done: `i18n.test.ts` passes; detector 60 findings (62 before), none new in a touched file; no `impeccable-disable` |
  | 28 `polish`/`harden`, shots | Shots in `mocks/9b/built/` (`shoot.js`); `polish` and `harden` are the orchestrator's |
  | 29 Budget | See Verification |
  | 30 Line height | Done: 1.55 from 1000 px; case 106 (h) |
  | 31 `/s/` tail and note | Done: `.rtail` `--muted2`, mono, tabular; the GM box without gold; case 106 (i) |
  | 32 Deferred rows | Done: the bare «1» and the stat columns rows are in Deferred |

- Batch 9b deviations 1-6 (dict keys, state ids, `FIRST_SCREEN`, case 106 (b), case 65's insets, the sweep
  entry): `git show 22f93378:issues/57/handoff.md`. Deviation 3's 324 px and Deviation 5's wrapping insets are
  superseded by the remediation below.
- Review: required, `reviews/9b.md`, fix-then-continue. The one remediation pass (previous sha `22f93378`):

  | Finding | Outcome |
  |---|---|
  | CI `check`: `HelpButton.svelte`, `RecordActions.svelte` coverage | Cause: 9b removed the callers of `HelpButton`'s small and unlabeled forms (the list page's «?», `QuickItem`) and of `RecordActions`' `name` and `card` rows (the list roll's compact card). Fixed by removing the dead code, not by tests: `HelpButton` is the one labeled form `PageHead` draws (`size`, `controls`, `labeled`, `lang` gone); `Help.button` is required (every help names one), so `HelpItem` lost `t`; `RecordActions` keeps `share` and `menu`; dict keys `helpHint`, `fieldHelp`, `sendAll`, `sImg`, `sText` deleted (no reader). No threshold changed. `RecordCard`'s `compact` variant and `nameActions` stay for batch 10 (Deferred): their removal reaches `tools/artwork` `REVIEW_ART_SIZES` and eight `record.test.ts` cases |
  | CI `app/sweep` 360/390 «список: заметки открыты» | Cause: B1. Reproduced on the 9b build (45 px RU, 16 px EN at 360); after the fix the entry is clean at 360 and 390, RU and EN |
  | CI `app/typo` `#/roll/community_items` `span.pv` | The app was wrong: at 1180 the roll page's control row is 282 px and the primary takes 149, so the picker got 125 px and «Великородное» (99 px) was cut (81 shown). `.rp-ctrl` and `AltPanel`'s `.altctrl.row` wrap: the roll button takes its own line when the value and it do not fit (community RU at 1180: the picker 282 px). `node tests/run-all.js app/typo` passes |
  | CI `app/print` «Убрать из списка» | Stale step: from 761 px the removal is an item of the row's «Ещё». The step opens it first (`d.openMore('.lrow-acts .morewrap > ...')`); the assertion is kept. Reproduced and checked alone (`scratchpad/print-step.cjs`): the old press throws the CI error, the new one draws the toast, hidden under print |
  | B1 | Fixed: `.lrow.compact .rnote { padding: 0; margin: 4px 0 0 }`; case 107 checks at 360, RU and EN, the read-only notes and the open area against the row width less 24 px and no sideways scroll. Shots `list-notes__360`, `list-note__360`, `list-note-area__360` |
  | B2 | Fixed: the `Panel` ground (line border, plate gradient, shadow), the total in `--txt`, `.st-ok` and `.nnew` in `--muted2`, `primary` only on the first shown request; `requestsPanel.test.ts` (one gold action); FEATURES.md "Purchase requests: the owner" |
  | B3 | Fixed: up to 760 px the folded strip has a 6 px 12 px inset and a 10 px margin; measured 304 px at 360x640 RU and EN (was 324); the exception is 304 and DESIGN.md "The First-Screen Rule" says so. Above 300: logged for the owner in Status |
  | R1 | Fixed: the `faces` container is the whole `.lroll-res`, so a panel of 641 px or more draws the tall card face in the 260 px column (1180, 768); a narrower panel (601 to about 690 px windows) keeps the row face. Named deviation from "card face from 601 px" |
  | R2 | Fixed: up to 600 px each request line is a block: the name, then four values under their own captions (`data-h`, `content: attr() / ''`), the price whole (`max-content`); the head row is visually hidden for a screen reader. Case 65's 1000 px panel bound holds after the line insets were tightened |
  | R3 | Fixed: `FIRST_SCREEN` takes a per-width exception; `/s/ ~ long name` is `shipped: true` with `{ 360: 302, 1180: 312 }`, case 83 asserts it; DESIGN.md names it |
  | R4 | Checked, nothing widened past its box: `scratchpad/seg-probe.cjs` on `#/homebrew/new ~ equipment`, `~ new card` and a set page at 320 and 360, RU and EN: no `.seg` past its parent's content box, no cut option, no sideways scroll; some switches wrap to two to five rows. Shots `hb-new`, `hb-card`, `hb-set` at 320/360 |
  | N1 | Fixed: `.lroll-line` in `var(--ui)` with tabular figures |
  | N2 | Fixed: `shareHint` deleted in both languages, with its `.hint` rule |
  | N3 | Fixed: the Seal Rule comment sits on the panel head rule |
  | N4 | Fixed: DESIGN.md "Key Characteristics" and the Deferred monospace line no longer name the list summary labels |
  | N5 | Fixed: "(item 9)" and "(item 8)" gone |
  | N6 | Fixed: EN `requestsFold` "Show less", as the fold button |
  | N7 | Fixed: the «Возьмут» cell is not red; the short line under the name says it |
  | N8 | Fixed: the new `typo.js` message uses an ASCII hyphen |
  | N9 | Fixed: a closed area forgets its shown note (`closeArea`, the close branch of `toggleArea`); `listPage.test.ts` "reopens on the players note" |
  | N10 | Fixed: `.lrow-n` is `--txt` on no tint, focus on `--surface2`; the grip lost its gold tint |
  | N11 | Fixed: this Status; the file compacted (batch 8 and the 9b deviations to the pre-pass commit) |
  | R5, R7, N12, N13 | Left as their `reviews.md` rows say |

- Batch CI - `app/states` as four interleaved shard rows and fresh shard weights (`plan-ci.md` section 4, previous
  sha `0f931af2`). Acceptance:

  | Line | Outcome |
  |---|---|
  | 1 One parse | Done: `tests/app/shard.js`; `git grep -n --untracked -E "shardArg\|shard=\(" -- tests` finds only it |
  | 2 `--list` | Done: 22 rows over the five shards, each once, the bins of `plan-ci.md` section 5 exactly (sums 1586.3, 1471.6, 1458.8, 1461.8, 1490.5) |
  | 3 States rows | Done: 4/4 in shard 2, 3/4 in 3, 2/4 in 4, 1/4 in 5 |
  | 4 `--shard=1/40` | Done: cases 1, 50, 91, a `took:` line each, `all 3 runs passed (shard 1/40 of 97)` |
  | 5 Parse error | Done: `states.js`, `golden.js` and `run-all.js` with `--shard=5/4` throw the old message |
  | 6 `derived,contracts` | Done: pass |
  | 7, 8, 11 CI | Open: CI of the pushed tip (each `app/states` row under 600 s, the longest job under 20 min, pass lines 25/24/24/24 of 97) |
  | 9 Docs | Done: COVERAGE.md "Suites", `.claude/README.md` (a `states.js --shard=n/4` row, the CI fixed cost and the 2026-11-05 cause), the decision file, `docs/DECISIONS.md` rebuilt. The CI row of "Batch size" waits for S8's measured time |
  | 10 W-N4 | Done: removed from Deferred |

  Deviations: the start line `shard n/m: <rows>` prints after the empty-queue check (still after the build
  check); the help text says "once per shard" instead of a count; `.claude/README.md`'s CI fixed cost "about twenty
  seconds" was stale and now reads about seventy (`plan-ci.md` section 1). The `--list` sum line reads `sum <s>`.
- Review: required, `reviews/CI.md`, approve; nits N1-N5 done in the CI fix pass, N6 in Deferred.
- Batch CI, S8 (CI run 42116078717 of `22d9a00b`, 2026-11-05): `browser (1)` 14.9 min, (2) 11.2, (3) 12.2, (4)
  10.7, (5) 10.3; push to the last gate job 15.0 min. `app/states` rows: 1/4 542.6 s (FAIL), 2/4 318.6 s, 3/4
  491.3 s (FAIL), 4/4 411.3 s (FAIL); each under 600 s, sum 1764 against the projected 1760. Acceptance 8: 2/4 is
  28 % under 440 and 1/4 23 % over; the weights stay 440 until a green run (`tests/run-all.js` comment). The pass
  lines are not in a job log (the summary prints only `ok`/`FAIL` rows), so 25/24/24/24 is by construction, read
  from the `--shard=1/40` proof and the review. Shard rows matched `plan-ci.md` section 5.

- CI fix pass (previous sha `8c4c6833`): the four failures of run 42116078717, each reproduced first.

  | Failure | Cause | Fix |
  |---|---|---|
  | `app/states` 86 "after the slide" | The case: after `home()` a loaded runner draws the header's return after `settle()`; the motion came on while the header was still out, so the header slid in, that slide's `transitionend` answered the wait, and the read landed 4 frames (66.7 ms of the 0.2 s ease-out) into the slide out. Reproduced locally with `scratchpad/slide-probe.cjs` (no settle after the scroll to 0): top -54.32, bottom 56.87, CI's figures. The app is right. The Deferred "timing flake" line was wrong and is gone | The case waits for the header back at top 0 before the motion comes on, and the wait takes only a `transitionend` while the header is `away`. The probe with both: -111.19, hidden. Case 86 passes alone |
  | `app/states` 89 at 360 RU | The app: the 9b remediation's `flex-wrap` on `.rp-ctrl` put the roll button on its own line at 360 for «Оплот Шершней» and «Проклятые предметы» (the picker took 313 px), so the results line ended at 294.69 against the case's 256 (First-Screen Rule). `scratchpad/pick-probe.cjs`: every other part keeps one line at 246.69 | The wrap holds from 761 px only (`.rp.two .rp-ctrl`), where the results have their own column and `app/typo`'s 1180 read needs it; up to 760 px the row is one line and the chosen part is cut with its ellipsis (the select shows it whole). `AltPanel`'s narrow-only `.altctrl.row` wrap removed. DESIGN.md "The Whole Message Rule" names the cut. Case 89 passes |
  | `app/states` 44 | The case was stale: since 9b a closed note area draws each filled note as a read-only `HitNote`, not a `textarea` | The case reads `main .hitnote` text and `main textarea` values; the players' note is found, the GM note still is not. Case 44 passes |
  | `e2e` import 9329 ms | The hosted project's latency: no commit since `origin/main` changed `supabase/`, `supabase.ts`, `cloud.ts` or `cloud.contract.ts` (`git diff --stat origin/main HEAD`: only `tests/e2e/flows.mjs`, the UI flows), and the same code measured 2812 ms (run 42083009049, `18429aee`), 2383 ms (42102518161, `6578a2c7`) and 1860 ms (42036663681) | None; `IMPORT_MS` stays 6000. One `gh run rerun <id> --failed` if it recurs |

  Nits: N1 the `run-all.js` weight comment (the golden mean, the `app/states` projection and the measured rows);
  N2 `.claude/README.md` "Batch size": the CI row (S8), the pooled-suites row and the `--shard=n/m` row; N3 this
  handoff; N4 COVERAGE.md "the ninety-five states" gone (and case 86's line names the wait); N5 `states.js` reads
  `--shard` before `lib.js`.

- Batch TD - the Thumb Rule, the Reading Time Rule, the Drop Rule, `--gap-plate` and The Measure Rule (`plan-TD.md`,
  previous sha `ee4ddc74`). Cases 108 (toasts), 109 (targets), 110 (plates), 111 (the text measure). Acceptance (44):

  | Line | Outcome |
  |---|---|
  | T-1 Thumb Rule | Done: `sweep.js 360 ru` clean with the new `targets` step (before: 984 reports in 60 selector groups); 390, 360 EN and the other widths are CI's. The card «Ещё», `/search`'s «Выбрать» and `ListFind`'s row are 40 px at 360 |
  | T-2 Token | Done: `--thumb` (0 / 40 px, `screen` only) in `tokens.css`; every S2 component writes `max(<size>, var(--thumb))` or `min-height: var(--thumb)`. Two named departures: `AltPanel` has no select (the picker is `RollSelect`, whose label is 40 px; its invisible select now covers the border), and `PageHead` draws no pin or help up to 760 px (they are «Ещё» items), so neither takes the token. No 600 px block holds a literal 40 (`AddToList`'s row is `max(36px, var(--thumb) + 4px)`, 44 px) |
  | T-3 From 601 px | Done by construction (`--thumb: 0px`); the 768 and 1180 sweeps are CI's |
  | T-4 24 px floor | Open: `sweep.js 768`, `1180` with `spacing` run on CI only |
  | T-5 Text links | Done: the card name, the footer links, the members' links, the source names, the import links and summaries take a padded box with the growth given back (`1lh`); the brand 5 px; the license summary 40 px (the footer's last line). Shots `mocks/T/built/` |
  | T-6 8-P1 | Done: `MoreMenu` `variant`; `ListsPage` passes `bare`; `.listcard-acts` absolute at 4/4 px; the name reserves 76 px. At 360: the «Ещё» box 62x40 RU, 66x40 EN, 160 px clear of the name; a `/lists ~ many lists` card 104 px (197 before, with its own row); `listsPage.test.ts` asserts `bare`, outside the link, axe |
  | T-7 Case 109 | Done: passes, 33 open layers x RU/EN at 360x640 |
  | T-8 `FIRST_SCREEN` | Done: every row passes (Verification has both columns); `/roll/std` 319 (325 kept); `/s/` 308.2 takes the exception 309 (default 1, DESIGN.md) |
  | T-9 Header | Done: 110.4 px at 360 and 390, RU and EN, signed out and as gm1; track 42 px; the brand one row (top 12.9) |
  | T-10 Reading Time | Done: `TOAST_MS`, `TOAST_LONG_CHARS`, `toastMs`; `app.test.ts` pins them and each class; case 108 (a)-(d) pass RU and EN |
  | T-11 Hold | Done: `holdToast` for every toast, `Toast.svelte` holds for every mode; `app.test.ts`, `shell.test.ts` (pointer), case 108 (c); the undo's own focus case unchanged and green |
  | T-12 Queue | Done: every "toast slot" and arrival case passes on `TOAST_MS` |
  | T-13 Above the bar | Done: `.toast.page` at `26px + --selbar-h`; case 108 (e); `shell.test.ts` (the dialog copy has no `page`) |
  | T-14 Toast over «Ещё» | Done (measured): 360, a roll result's open «Ещё»: the toast top 570, the menu's last item bottom 625; overlap 4829 px² RU, 3405 px² EN, for 4000 ms. Row stays in Deferred for `DEBT.md` |
  | T-15 No golden | Done: no tree or control line moved locally; only D's six headers re-seeded; the full golden job is CI's |
  | T-16 Prose | Done: DESIGN.md "The Phone-First Rule", "The Two Breakpoints Rule", "Buttons", "Chips", "Toast", "Cards", "The Reading Time Rule" (5 of 8); FEATURES.md "Chrome" (durations, hold, thumb sentence, the toast's place), "Lists" (the card corner); COVERAGE.md cases 108-111, the sweep step |
  | T-17 Comments | Done: `git grep -n -E "1600 ?ms\|2600 ?ms" -- app/src tests/app docs/specs DESIGN.md` finds no toast (only `TablesPage`'s 1.6 s flash, a 1180x1600 viewport and a snapshot hash) |
  | T-18 Parity | Done: no string; the long class reads both languages (`toastMs`) |
  | T-19 `polish`, `harden`, shots | Shots in `mocks/T/built/`; `polish` and `harden` are the orchestrator's |
  | T-20 Detector | Done: 60 findings (60 before), none new; no `impeccable-disable` |
  | D-1 Drop Rule | Done: `tests/derived.js` "Dashed means drop" passes; `git grep -n -i dashed -- app/src` finds `PrintCard.svelte` only |
  | D-2 Plate | Done: case 110, 16 states x 360/1180 x RU/EN: solid `--line` on `--bg2` |
  | D-3 Other dashes | Done: `Badge` `.uniq`, `HitNote` `.gm`, `ListPage` title, add row, GM field (rule gone), GM-only row, `TableRows` GM row, `MarkupField` pane: solid, colour and ground kept |
  | D-4 Drop mark | Unchanged (not touched); case 17 is CI's |
  | D-5 Gap | Done: 16 px in every case 110 row (before 4 to 14, Verification); `gap-plate` lives in `tokens.css`, `Empty`, `TablesPage`, `HomebrewPage`, `ListsPage` |
  | D-6 Column top | Done: case 110 (c) 0 px on `eq_armor` and `wondrous` at 1180 (the `:has` pair compiled; no `:global` rewrite needed) |
  | D-7 Lead | Done: case 111 (a): `/search` and `/homebrew` one line from 768 to 1920, RU and EN; `/account` one line in RU too (MR-5 supersedes D's "RU two lines") |
  | D-8 360 wrap | Done: case 111 (a) at 360, no sideways scroll |
  | D-9 DESIGN.md | Done: "The Drop Rule" (Shapes, 2 of 8), the borders sentence, "Empty state", the Seal Rule, "Badges", "Compact row"; the One Width and Typography sentences follow MR's text (Overlaps) |
  | D-10 First screen 1180 | Done: `#/search ~ searched` 279 to 257, `~ kind picked` 279 to 257, `#/homebrew as gm3` 254 to 231; no 360 row moved by D |
  | D-11 Goldens | Done: six headers re-seeded one id each (`git diff` shows line 3 only); CI's golden job pending |
  | D-12 Parity | Done: no string; case 110 and 111 read both languages |
  | D-13 Shots, detector | Shots in `mocks/D/built/`; detector as T-20; `polish`/`harden` the orchestrator's |
  | D-14 Corrections | Done: the list drop mark is a 2 px gold line and the value-less filter chip is not dashed; neither changed |
  | MT-1 Tokens | Done: `--measure-line`, `--measure-text`; every selector of `plan-text.md` section 4 uses them. `SharePanel` `.hint` no longer exists (9b's N2 deleted it): nothing to cap |
  | MT-2 Case 111 (a), (a2) | Done: every line block one line from 768 where it fits; the sign-in button within 12 px of its lead at 1180 and 1920 |
  | MT-3 Case 111 (b) | Done: help panels 487 px hugging their 487 px paragraphs (1097 px before), `/s/` notes as wide as their text, the footer under 70ch; `voa2_a3` under 80ch; the side-column notes fill the column |
  | MT-4 One measure | Done: `tests/derived.js` passes; only `PickRow.svelte` (`28ch`) keeps a literal |
  | MT-5 Prose | Done: DESIGN.md "The Measure Rule" (Typography, 6 of 8) and the five sentences; FEATURES.md "Account" and the help-panel line; COVERAGE.md |
  | MT-6 Static pages | Done: `main{max-width:70ch}`; `node tools/build.js` exit 0 (the pages are generated, not committed); EN `privacy.html` at 1180: at most 85, mean 74 characters a line (RU 77 / 66) |
  | MT-7 Lines | Done: Verification, "Text measure" |
  | TD-P1 6-N1 | Done (measured): `#/homebrew/hb_emberaxeaaaaaaaa as gm1` with a 120-character name at 1180x720: the `h1` 86 px (three lines), the form at 232.6 px, under 288 |
  | TD-P2 Case 89 | Done: at 360x640 RU «Оплот Шершней» (mwt) and «Проклятые предметы» (voa) keep one line, the part cut by its ellipsis, the first result at 245.9 px (246.69 before); case 89 passes |
  | TD-P3 9a R2 probe | Done (measured, not fixed): `LIST_A ~ noted as gm4` 360x640 RU: «Ещё» at 136.4, scroll 0; open: scroll 87, «Ещё» at 49.4 under the header (header 0 to 110.4); Escape: scroll 0; a tap outside: scroll 87, «Ещё» covered. Row stays for `DEBT.md` |

  Deviations: (1) T5's padding is 76 px as planned; the EN box is 66 px. (2) Case 108 measures a toast's age from its
  first draw (a `MutationObserver` on `role`), not from the press. (3) Case 109 enters a state whose control draws from
  761 px only at 1180 px (`wideEnter`), as `LIST_A ~ note open` needs; case 110 does so for `eq_armor`, `wondrous` and
  `kind picked`. (4) Case 111 (b) opens each width afresh (a help panel folds when the head leaves at 760 px) and skips
  360 where the help is a menu item or the `/s/` notes sit on the lead line. (5) The text brief's
  `#/lists ~ no lists as gm1` is `#/lists ~ empty as gm4` and its not-found page is `#/i/nope`. (6) A plate parent
  beyond the plan: none; `#/tables/homebrew as gm2` joined case 110. (7) Eight component tests that find a plain
  toast said during an error toast (`homebrewImport`, `homebrewPage`, `importPanel`) wait `TOAST_MS.long + 2000` ms
  (`AFTER_ERROR`): a 7000 or 10000 ms error outlived the 5000 ms find; up to 5-7 s more each, real timers.
- Review: required (trigger: visual parity and changed UI on every route; the static pages' template changed).

## Verification
- Batch TD, 2026-11-06 (previous sha `ee4ddc74`), each in the foreground unless named; vitest with
  `VITEST_MAX_WORKERS=2`:
  - Red first: a detached worktree of `ee4ddc74` (outside the repo, removed after) with the new `states.js`, `lib.js`
    and `derived.js`: case 108 13 FAIL (no page toast class, no long or held toast), case 110 FAIL on every row (dashed,
    gaps 4-14 px), case 111 273 FAIL (leads at 70ch and two lines, help boxes 1097 px, the footer past 70ch).
    `sweep.js 360 ru` on the `ee4ddc74` build: 984 target reports.
  - After (`npm run build:test` of the final tree): `node tests/app/states.js --shard=n/101`, n = 98 (108), 99 (109),
    100 (110), 101 (111), 73 (83), 79 (89): each `all 1 runs passed`, except 83 before the `/s/` exception (4 FAIL at
    308.2 against 302; passes at 309). `node tests/app/sweep.js 360 ru`: `clean at 360 (ru)`.
  - Vitest: `app.test.ts` 310, `shell.test.ts` 135, `listsPage.test.ts` 52, `listPage.test.ts` 108,
    `sharedListPage.test.ts` 116: all pass.
  - `node tests/run-all.js derived`: ok (the two new blocks included). `node tools/build.js`: exit 0.
  - Goldens: `MSYS_NO_PATHCONV=1 node tests/app/golden.js --update --only=<id>` for the six ids (D S9): each
    "states compared: 1", six files, line 3 only.
  - Detector `npx impeccable detect --json --no-inline-ignores app/src`: 60 findings, none new.
  - `npm run lint:untyped`, `npm run lint:typed`: exit 0 after the last edit. `rtk npm run check:built`: pass, 268.2 kB
    within 269. `VITEST_MAX_WORKERS=2 rtk npm run check:fast`: first FAIL (8 tests of `homebrewImport`, `homebrewPage`,
    `importPanel` found a plain toast behind a 7000 or 10000 ms error inside the 5000 ms find; Deviation 7), then PASS
    in 1034 s (3 stages 87 s, vitest 2134 tests, budget), gate credit armed.
- First screen (case 83 rows at 360x640, RU = EN; before `ee4ddc74` / after): `/roll/std` 323 / 319 (exception 325);
  `/roll/alt`, `~ crit`, `voa`, `wondrous` 251 / 246; `/tables/eq_weapon` 234 / 230, `~ two filters` 252 / 248;
  `/i/ci1` and `/h/...0513` 137 / 136; `/search ~ searched` 230 / 232; `/account as gm1` 192 / 191; `/homebrew as gm3`
  243 / 242; `/homebrew/sets ~ long name` 241 / 240; `/homebrew/new` 223 / 223; `/homebrew/hb_longsrc...` 246 / 245;
  `/lists as gm1` 239 / 238; `/lists ~ many lists` 252 / 251; `LIST_A` 210 / 209, `~ many` 254 / 253, `~ long name`
  210 / 209; `/s/player-token-1` and `~ long name` 301 / 308.2 (exception 302 to 309); `SHOP ~ requests` 304 / 303;
  `/p/set-emberaxe` (logged) 583 / 579 RU. At 1180x720: `/search ~ searched` and `~ kind picked` 279 / 257,
  `/homebrew as gm3` 254 / 231, `/homebrew/sets ~ long name` 252 / 229; the rest unchanged.
- Plates (case 110, the gap in px, RU = EN, 360 / 1180; before / after 16): `/search` and `~ narrow`, `~ nothing found`
  8 / 4; `~ kind picked` 10 / 4; `/tables ~ nothing found`, `eq_armor`, `wondrous` 6 / 12; `/tables/homebrew as gm2`
  6 / 4; `/homebrew ~ no match` 12 / 12; sets and rules empty 10 / 10; `/lists` signed out 8 / 14; `~ empty` 10 / 10;
  `~ nothing found` 6 / 10; `LIST_A ~ no match` 8 / 10; `/s/ ~ no match` 8 / 10.
- Text measure (MT-7; 1180 and 1920 RU; before from `mocks/text/today-summary.txt`, after from case 111): the
  `/search`, `/homebrew` and `/account` leads 2 lines / 1 line; the `/lists` sign-in lead 2 / 1 (and 1 from 768); the
  plate causes 1 / 1; the `/lists ~ empty` hint 2 / 1; the help panel boxes 1097 px / 487 px around 487 px paragraphs;
  the Vault of Ages and arazo panels hug at 487 px; the footer license 165-220 / under 70ch a line. `/lists` and
  `/account` signed out rise one lead line (22.4 px) from 768 px; neither is a `FIRST_SCREEN` row.
- Batch CI fix pass and earlier: `git show ee4ddc74:issues/57/handoff.md`, "Verification".

## Next batch (implement-ready)
- Name: batch N (The Head Order Rule, the `/tables/*` exception at 761-999 px, the d12 die marks). Brief:
  `issues/57/plan-N.md`; mocks `issues/57/mocks/N/`. Cases 112 and 113; batch P takes 114 and 115. The last case in
  `states.js` is 111 (101 cases; `--shard=n/101` runs one).
- It starts after TD's review and its one fix pass, from TD's pushed tip. N keeps `var(--measure-line)` and
  `text-wrap: balance` on `.page-sub` when it moves `PageHead`, and reads TD's 360 figures (the roll pages 246 px,
  `/roll/std` 319, the header 110.4) and 1180 figures (`/homebrew as gm3` 231, `/search` 257).
- Gates: as `plan-N.md`, "Verification"; vitest with `VITEST_MAX_WORKERS=2`, one file at a time; `check:fast` last.
  The bundle is at 268.2 of 269 kB after TD: an addition to the JS or CSS may need a budget look.

## Blockers
- None.

## Deferred
Placed into acceptance lines at the 2026-11-06 fold (`plan.md` section 7; the line is checked at its batch's close). A placed
row whose facts the line carries is removed here; a row whose measured facts only this file holds stays below with its
placement named:

| Deferred row | Placed in |
|---|---|
| 9a R2 probe; the focus jump (3b); `LIST_A ~ more` scroll 83 | TD-P3 measured (done), then 10-18 (`DEBT.md`); rows stay below |
| Toast over «Ещё» (batch 4) | T-14 measured (done), then 10-18; row stays below |
| Case 89 default (the picker cuts a long chosen part up to 760 px) | TD-P2 done (245.9 px); 10-12 (the audit) |
| `/tables/*` at 761 to about 800 px in RU (batch 7b probe) | N acceptance 17; row stays below |
| Batch N copy rows (`/roll/mwt` lead, «корника», the «ИЛИ» dividers' gold) | 10-11 |
| `RecordCard` `compact` variant, `nameActions`, `REVIEW_ART_SIZES` rows | 10-10 |
| `typo.js` `SWITCHES` and the 360 Whole Message step | 10-17 |
| `/s/` bare «1» against «№ 89» | 10-14 |
| `404.html` look | 10-13 |
| H2 tab and picker CSS copy, `EQ_DT` abbreviations | 10-9 |
| 2-R3 header DOM order, 2-N6 text | 10-15 |
| R5 of `reviews/plan-1-3.md` (`<name>-2.md` against `plan-<batch>-<n>.md`) | 10-7 |
| P5 (`rollNo`) | 10-8 (`DEBT.md`) |
| Monospace labels and uppercase controls outside their rules | 10-16 |
| `reviews/CI.md` N6 | 10-18 |
| `/search` at 320x568 RU; 4-R1; the dialog art at 500-760 px; `reviews/5.md` and `reviews/6.md` checks | 10-18 (closeout register); rows stay below |
| `KeepNote.svelte` leaves with batch P | P-D15 (`plan-P.md` acceptance 12 and 30); row stays below |
| Add-to-list states with a closed EN menu | done in 9b (acceptance 20); row removed |

Rows below keep facts no acceptance line carries:
- 9a R2 probe, re-read in TD with the 40 px «Ещё» (360x640 RU, `LIST_A ~ noted as gm4`): «Ещё» at 136.4, scroll 0;
  open: scroll 87 and «Ещё» at 49.4 under the shown header (0 to 110.4); Escape: scroll 0; a tap outside: scroll 87,
  «Ещё» covered. In 9b: the list «Ещё» at top 141 and scroll 0; opening its
  menu scrolls to 83 and the shown header covers «Ещё» (top 58); Escape returns the focus and the page to scroll 0;
  a tap outside leaves scroll 83 with «Ещё» covered. A `preventScroll` focus return cannot cure the tap path (no focus
  returns there): not taken. The same family as the focus jump below; batch TD builds no fix (TD-P3 re-reads the probe once); at closeout to `DEBT.md` (10-18).
- Tabular stat columns on table rows from 1440 px (owner, 2026-11-05, `plan-9b.md` M22): a "Proposed rules" row, built by
  its own task after wave 3 with a mock first (`plan.md` section 12).
- 9a, found by the golden of `LIST_A ~ more`: at 360x900, after the list «Ещё» opens and closes, the page sits at
  scroll 83 and the shown header covers that «Ещё» (a press lands on the job row); the header hides only past its own
  height. The golden reopens from the top (`reopen` in `inventory.js`). The same family as the focus jump below.
  Review 9a R2: its probe (360x640 RU on `LIST_A ~ noted`: open «Ещё», close by Escape, then by a tap outside, read
  `scrollY`) was not run in the 9a fix pass; batch 9b takes it (`plan-9b.md` S8 step 10, acceptance 22), else
  `DEBT.md` at closeout.
- `/tables/eq_*` at 761-about 800 px in RU (batch 7b probe): the toolbar's five controls wrap to two lines, so the rows
  start at 381.5 px against 333.5 on the other tables. Case 96 reads 760 and 1050, not 761. Not fixed: the hidden
  toolbar slots were not built (Completed, "Batch 7b", deviation 3).
- The `--inject` model run of `roll-probe.cjs` was not repeated on the build of `377d0981`; the planner's production
  numbers stand for the model.
- `/search` at 320x568 RU (batch 7 remediation probe): after a kind is picked in the sheet and the sheet closes,
  `scrollWidth` is 313 against a `clientWidth` of 305, and a probe that hides one element at a time finds the
  header's tab links. Case 93 checks no sideways scroll before the sheet opens, where it passes. Not investigated.
- `reviews/6.md`, "Checks still needed", item 3: the homebrew selection bar at 640x360 and at 768x1024.
- `reviews/5.md`, "Checks still needed", items 3 to 5 (not measured here): the first `/roll/alt` card's
  menu at 360x640 with 7 or more lists at scroll 0; a right-column card's menu at about 1015-1075 px with
  a long list name; Tab and Enter on the nine routes at 360.
- 4-R1 (wave 2 blind review; the owner's choice): at 360x640 «В список» ends inside the first screen
  on 21 of 98 sampled records at the 4:3 crop (median bottom 693 px, worst 908 px). No device above
  760 px is affected. Current behavior: on a phone the primary is below the fold on most records.
  1. Recommended: keep the page, and let a reader scroll. The text starts in the first screen on
     almost every record. Trade-off: adding to a list from a long record takes a scroll.
  2. A sticky «В список» on the page up to 760 px, like the dock. Trade-off: it covers about 62 px of
     text on every record, and it adds a new surface rule.
  3. 16:9 up to 760 px. Trade-off: it reaches half of the records, and it changes M4-4.
- Toast over «Ещё» (batch 4): at 360 an action toast covers the end of the menu for its 7 s; a second
  save by touch waits for it. Batch 8 decided no sheet (`plan-8.md` L12), so it stays, and it now also covers the
  end of the add-to-list popover. TD's case 108 (f), 360: the 4000 ms toast's top at 570 px, the roll result's open
  «Ещё» last item ending at 625 px, 4829 px² of overlap RU, 3405 EN (the toast now floats above the selection bar
  only). At closeout it goes to `docs/specs/DEBT.md` (10-18) unless a later batch fixes it.
- Batch 8 (`plan-8.md`): the signed-out add-to-list menu keeps its two steps (L13); the `HomebrewPage` search row
  keeps its own `.tools` beside `ListFind` (L8).
- `RecordCard`'s dialog art at 500-760 px wide and 481-560 px tall: a 4:3 picture can fill the card, so
  the dock is not in view until a scroll (sticky holds inside `.card-body`). No phone portrait reaches it.
- Focus jump (batch 3b, measured facts item 3): a `focus()` on a header control moves the page up
  (scroll 1500 to 1199 at 320 px, to 1115 at 1180 px; 900 to 558 at 360 px with the fix). An
  existing defect, harmless for the hide: the upward move shows the header.
  `{ preventScroll: true }` fits only a control always in view, and `Menu` also serves controls
  that scroll away, so the fix needs its own look. At closeout it goes to `docs/specs/DEBT.md`
  unless a later batch fixes it.
- 2-R1 (answered for batch 3 on): the orchestrator-run `polish` and `harden`
  of section 10, "Impeccable". The batch 2 shell components still had a manual
  pass only; the post-release Impeccable audit is the backstop (with the C34 and
  A15 live-site toast check).
- Batch 3 candidate: the 1180 px equipment column table of mock 3 (D6, Q3-T), if
  the owner says yes; one added item with its own mock check.
- N0-2 of `reviews/mocks-2.md` (batch 4): the error-page pattern's circled icon
  is a template shape; keep the heading, the cause and the action.
- `KeepNote.svelte` leaves with batch P (the Account page's Display note left with batch 7).
- The link-preview Worker's card images (`tools/share-card.mjs`).
- The EN `<title>`, manifest name and `en/index.html` wordmark.


## Notes
- Mocks path: `issues/57/mocks/<N>/`; built shots in `mocks/<N>/built/` (`shoot.js` per batch).
- Impeccable `polish` and `harden`: the orchestrator runs them per batch (a subagent cannot); batch 8's outcome is in
  `reviews/8.md`, "polish and harden outcome". Earlier outcomes are in the pre-collapse handoff.
- Planner defaults D1-D13 of batch 3: `plan.md` section 10, "Decisions of this refresh".
- Scratch to retire at closeout, not before: the worktree `.claude/worktrees/57-fold` (branch `claude/57-fold`,
  merged); `issues/57/mocks/measure.mjs`; the print evidence and the mock P worktree at
  `C:\Users\Ignat\.dhloot\notes\57\`.
- Owner rules this session: "proceed autonomously"; the unconfigured ceiling is 300 kB; phone feedback goes to
  `context.md` "Phone feedback"; AFK defaults go to `C:\Users\Ignat\.dhloot\notes\owner-afk-2026-11-03\decisions.md`.
- Cleanup performed / retained artifacts: `handoff.md` compacted on 2026-11-05 (142 KB against the 150 KB line):
  Completed is one line per shipped batch, Verification holds the latest batch, Notes hold current state; the last
  pre-collapse commit is `c489766a` (`git show c489766a:issues/57/handoff.md` holds the full tables and every
  measurement). `plan.md` compacted on 2026-11-06 (147.7 KB to 114 KB): the Status history and the briefs of batches 4
  to 9b became one block; the last pre-collapse commit is `a8bdf1de` (`git show a8bdf1de:issues/57/plan.md`).
- Session end partial progress (if any): none
- Durable items written to their homes by TD: DESIGN.md "The Phone-First Rule", "The Drop Rule", "The Measure Rule",
  "The Reading Time Rule", "Empty state", "Toast", "The First-Screen Rule" (`/s/` 309); FEATURES.md "Chrome", "Lists",
  "Account"; COVERAGE.md cases 108-111, the sweep step, the derived blocks. Earlier pass: DESIGN.md "The Whole Message Rule" (the narrow picker cut);
  COVERAGE.md "Suites" (no state count; case 86's wait); `.claude/README.md` "Batch size and the fixed cost of a run"
  (the CI row, the pooled row, the `states.js --shard` and `--shard=n/m` rows); the `tests/run-all.js` weight comment.
  Batch CI's: COVERAGE.md "Suites", `.claude/README.md` "Batch size", the decision file of 2026-11-05.
