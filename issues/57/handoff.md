# Handoff - TASK 57
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress. Waves 1, 2 and 2b are on `main`. Wave 3 has built 9a, 8, 9b, CI, TD, N, P and 10, each
  with its one fix pass. The batch 10 fix pass (previous sha `ca730999`) is committed and pushed on `claude/57` (sha in
  the implementer's report). CI of the new tip is the full gate: not yet run.
- Review: `reviews/10.md`, fix-then-continue; every local finding has an outcome (the fix-pass table under Completed).
  10-R2 (`.impeccable/design.json`) stays the orchestrator's, on the 10-20 checklist.
- Next: CI of the new tip, then 10-20 (the orchestrator's: the wave 3 squash, the blind reviews, `design.json`, the
  closeout commit, the last squash).
- NEEDS_HUMAN_CONFIRMATION: no. The "For the owner" list is under Notes.
- Defaults taken in the batch 10 fix pass (owner AFK; the orchestrator logs them in the AFK decisions file; batch
  10's defaults 1-8, all accepted by the review: `git show ca730999:issues/57/handoff.md`, Status):
  1. 10-B1: D125 is kept and rewritten, not dropped: the probe names `nav.tabs` (RU, 8.2 px past the 305 px body at
     320 px, on every route); the sideways scroll needs a classic scrollbar. For the owner item 10 asks whether that
     window is supported.
  2. 10-N6: the follow-up task's id is `57-debt` (DEBT.md section names, `plan-debt.md`).
  3. 10-N10: EN `subStd` reads "A roll over the Core and Hope & Fear tables." and the EN Recall Cost help says "in
     Core": one name in both languages. The `daggerheart-ru-terms` check: daggerheart.su prints the source of a Core
     card as «Core» (`ru.daggerheart.su/domain-card/book-of-ava`), so «Core» stays in RU. The 13 `#/roll/std` goldens
     were re-seeded by the tool (`--only`), one EN line each.
  4. 10-N9: the decision file now cites DESIGN.md "The Head Order Rule" and says it replaced "A steady head"; no
     "Amended by" line, because batch N wrote no decision file to name.
  5. CI run 42218469286: cases 11 and 68 are not batch 10's (Verification); no code change, no limit changed.
- Last agent: implementer (batch 10 fix pass). No subagent runs. No worker has uncommitted code edits.
- Branch: `claude/57` (worktree `.claude/worktrees/57`)
- Base / starting commit: `d8e30731`; previous sha of the batch 10 fix pass: `ca730999`.
- Pushed: `34ae151c`, `ca730999` and the fix-pass commit.

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
- Review: `reviews/TD.md`, fix-then-continue. The one fix pass (previous sha `d22f93a5`):

  | Finding | Outcome |
  |---|---|
  | CI `app/sweep` 768/1180: `nav.foot-nav > a` 20.8 px, `details.foot-licence > summary` 20.8 px | Real controls (a nav row, a disclosure). `Shell`: the footer links take `max(24px, var(--thumb))` as a padded box at every width with the growth given back; from 601 px the summary takes a 24 px padded box the same way. Reproduced red locally at 1180 (22 reports), clean after |
  | CI `app/sweep` 768/1180: `span > button.btn.bare.sm` «и ещё N» 18.8 px | A button (`FoldButton`), not a link: the `.craft a` entry does not cover it and should not. `Button`: `.btn.bare` takes `min-height: max(24px, var(--thumb))` with the growth given back at every width (the 600 px block widened to `screen`) |
  | CI `app/sweep` 360/390 EN: `div.nacts` «Clear» 30.2 wide, `div.reqhead` «Open» 31.7 wide | Real buttons. `.btn.bare` takes `min-width: var(--thumb)` and centers its text up to 600 px |
  | CI `app/sweep` 360/390 EN: the record card's `.refs summary` 26.2 px | A disclosure: `min-height: var(--thumb)` in `RecordCard` |
  | CI `app/sweep` 360/390 EN: `h1.page-h > input.titleinput` 38.8 px | A field: `.lhead .titleinput { min-height: var(--thumb) }` in `ListPage`; `LIST_A` first screen 209 to 210, the requests row 303 to 304 (exception 304) |
  | TD-B1 | Fixed, option A: `AppState.closeErrorToast()`; `ImportPanel` send, `HomebrewImport` send, `HomebrewBulk` delete and move, `HomebrewCards` remove, `write`, `writeCard` call it before the write. The eight `AFTER_ERROR` finds are back at the default timeout (the three files equal `ee4ddc74`); `app.test.ts` "shows a retry answer at once". FEATURES.md "Chrome", DESIGN.md "The Reading Time Rule" |
  | TD-R3 | Fixed: `RollPage` `.reshead` 4 px under it, `AltPanel` `.altctrl.row` 4 px under it; first screens at 360 in Verification |
  | TD-N1 | Fixed: "(T5)" gone |
  | TD-N2 | Fixed: `~ list limit as gm2` says a 10000 ms error toast; `~ not saved as gm2` is a 4000 ms create toast (kept); `Toast.svelte` comments name 7000 or 10000 ms and "its own time" |
  | TD-N3 | Fixed: "inside the toast's lifetime" |
  | TD-N4 | Fixed: `toastMs` not exported |
  | TD-N5 | Fixed: case 109 enters only `~ note open as gm4` at 1180 (`wideEnter` by a named regex) |
  | TD-N6 | Fixed: `targets` also requires 24 px between the centers of two undersized targets; the dead `LABEL` clause is `hidden(el)` |
  | TD-R1, TD-R2, TD-R4 | Left as `reviews.md` names them (owner list, batch N dispatch) |

  CI fix (run 42156716768, previous sha `0e78f7e8`): case 95 - the fold's new 24 px box came 0.4 px from a badge on the
  line above; `RecordCard` keeps the fold at the line's height from 601 px, `TARGET_ALLOW` covers it (default 9). The
  golden - the 4000 ms «Сохранено» toast was still up at the RU capture (`status ""`), a timing race, not the box; the
  state's `enter` now waits for the toast to end; the golden is unchanged, not re-seeded.

- Batch N - The Head Order Rule, the `/tables/*` mid-band exception, the d12 die marks (`plan-N.md`, previous sha
  `2986f75c`). Cases 112 (the head order) and 113 (the die marks). Acceptance (17):

  | Line | Outcome |
  |---|---|
  | 1 Visible `h1` | Done: «Бросок» / "Roll", «Таблицы» / "Tables", «Мои предметы» / "My items" first in the head from 761 px; at 360 px hidden with the same text; the roll document title starts with the lit mode (case 112 (f), (g)) |
  | 2 Head Order Rule | Done: `PageHead` `nav`, `navBelow`, `below`; DOM order `h1`, pills, pin, help, primary from 1000 px and `h1`, pin, help, primary, pills at 761-999; the primary within 16 px of the column edge; the tabs in `.page-below` (case 112 (a)-(d), `pageHead.test.ts`) |
  | 3 One row | Done: one row on the four roll routes of case 112 at 1000 and 1180 px, RU and EN, the pin pressed and not (`#/roll/community` RU pinned included); mid band: the pills alone on the next row; on `/roll/alt` the pills-to-lead gap 12 px against 10 px above; no check on a lit pill (case 112 (c), (h), (i)) |
  | 4 Pills hold still | Done for the geometry: the roll pills at one left and top per language and size (case 112 (g)); the catalog chips at one X (case 96). Deviation 1: `RollPage` is not one mounted instance across modes (each mode is its own panel in `App.svelte`, so the head is drawn again); its place holds |
  | 5 Homebrew pills | Done: four `Chip href` pills with counts, then the pin, then «Новый предмет» last; up to 760 px the picker unchanged; Measured at S1 below; "homebrew" cells of `mocks/N/headorder/` were roll-page offsets (`plan-N.md` correction) |
  | 6 First screen | Done: case 83 passes; roll rows 214 at 1180x720 (267 before), `/tables/eq_weapon` 244, `#/homebrew as gm3` 231; 360 rows unchanged (`/roll/std` 323, `/roll/alt` 254); 1000 and 768 figures under Verification |
  | 7 Case 112 | Done: passes; figures under Verification |
  | 8 Goldens | See Verification ("Goldens"); `_lists*` and `_search*` unchanged; the two new states (`#/roll/alt ~ mid band`, `#/homebrew ~ mid band as gm3`) seeded RU and EN; axe on the mid band is the unit tests' (`rollPage.test.ts`, `homebrewPage.test.ts`, `pageHead.test.ts`) |
  | 9 Parity | Done: no new string; `hopeLetter`, `fearLetter` gone in both languages; the roll `h1` is `jobRoll`; `pageStd`, `pageAlt` and the supplement names stay (the pills and the title read them) |
  | 10 Lit pill | Done: gold fill, no check (`chip.test.ts`, `homebrewTabs.test.ts`, case 112 (h)); DESIGN.md "Chips", "Sibling pills" |
  | 11 Copy rows | Done: the Deferred table keeps the batch N copy rows for 10-11 (the `/roll/mwt` lead, «корника», the «ИЛИ» gold) |
  | 12 Focus across 1000 px | Done: `pageHead.test.ts` "keeps the focus on the same pill" both ways, and leaves a focus off the pills alone |
  | 13 `/tables/*` exception | Done: DESIGN.md "The First-Screen Rule" (334 px, ceiling 336, dated); case 112 (e) asserts 336 at 900x720 and 410 at 768x1024 (333.6 measured) |
  | 14 Die marks | Done: `AltPanel` `.dv` holds `<Die faces={12} />` in `--hope` / `--fear`, no letter; case 113 passes at 360 and 1180, RU and EN; DESIGN.md "Tertiary" and "The Seal Rule" |
  | 15 Prose | Done: DESIGN.md (The Head Order Rule replaces "A steady head", Roll Page, Two Breakpoints, First-Screen, Layout, Tertiary, Seal, Chips, Navigation), FEATURES.md (Rolling, Tables and search, Homebrew, Lists, Chrome, rule 4), COVERAGE.md (cases 112, 113, 96, the sweep's head read, `pageHead.test.ts`); no decision file |
  | 16 `polish`, `harden`, shots | Shots: `mocks/N/built/shoot.js` (see Verification); `polish` and `harden` are the orchestrator's |
  | 17 `/tables/eq_*` 761-800 RU | Done: `eq_weapon` and `eq_armor` at 768x1024 read 333.6 px in RU and EN (336 or less); the Deferred row is dropped |

  Deviations: (1) acceptance 4's "one `RollPage` instance stays mounted" is not true of the code (App draws `StdPanel`,
  `AltPanel` or a keyed `RollPanel` per mode); the head's text and place hold, which case 112 (g) proves. (2) S1's DOM-move
  probe was not drawn: the built page was measured instead (case 112 and the S1 figures below), the same figures without
  a stand-in. (3) `.page-below` takes `margin-top: 10px` and the lead under a mid-band head 12px, not the brief's 6 and 8
  px: `main` is a block, so the head's 4 px bottom margin collapses into them; the measured gaps are the brief's 10 and
  12. (4) The title chain lost `title` past the three panels too: `RollPanel`, `PickerRollPanel` and `App.svelte`'s
  `ROLL_TABLE` / `PICKER_ROLL` (`title` fields), which had no other reader. (5) The two new states carry `width: 768`
  only; an inventory state has no height.
- Measured at S1 (the built page, case 112, `#/homebrew as gm3`): first content 231.4 px at 1180x720 RU and EN (254
  before), 266.0 RU and 231.4 EN at 1000x720 (the pills wrap in their box in RU), 286.2 at 900x720 and 768x1024 RU and
  EN (the pills on the next row), 242.4 at 360x640 (unchanged). Not measured: the 3x counts by text injection and
  1050/1920 px (the S1 probe was not drawn, Deviation 2).
- Review: `reviews/N.md`, fix-then-continue. Batch sha `cb581b66`. N-N11: its second `check:fast` passed (the task
  branch's commit gate takes only a passing run, and `cb581b66` was committed through it); its time was not recorded.
  The one fix pass (previous sha `ff41b4f7`):

  | Finding | Outcome |
  |---|---|
  | CI run 42177661196, case 90 at 1180x720 «the add menu slides under the header» | Reproduced locally (`states.js --shard=80/103`, the same FAIL). Not a flake: N moved the result row up 53 px (the first content 267 to 214), so at scroll 0 the toggle sat at 369 px, neither side held the 340 px menu, and the menu opened up to 21 px under a 63 px header with no scroll above the page top (`scratchpad/c90-probe.cjs`). `AddToList` opens up in the page scroll only where the page above holds the menu under the header (`--sticky-h`); a pinned box (`SelBar`, the editor bar) and a clipping card or dialog keep the old rule. After: the menu opens down, the page scrolls 53 px, the menu at 356 to 696 px. `rollResult.test.ts` three side cases (the down case red before); FEATURES.md "Records" |
  | N-B1 | Fixed as recommended: `ModeRow` `<script module>` flag set by a press that leaves the lit mode (an `OWN` link or a supplement item) in the `inhead` instance; the mounted `inhead` instance focuses the lit link, or the supplements button on a supplement page, when the focus is on `body`, and clears the flag. `rollPage.test.ts` "a mode switch at wide / mid" (link and menu, red before). The 760/761 px crossing: in `Shell` (default 7), `rollPage.test.ts` narrow to mid and back (red before). At 360 the menu item press returns the focus to its button (default 8; `modeRow.test.ts`, red before). FEATURES.md "Tables and search" (the mode row bullet), COVERAGE.md |
  | N-N1 | Fixed: `pageVoa`, `pageMwt`, `pageArazo` deleted in both languages |
  | N-N2 | Fixed: rule 4 lost the Arazo departure; the `modeRow.test.ts` comment fixed and `roll/arazo` in its `it.each` (passes) |
  | N-N3 | Fixed: "owner, 2026-11-05" |
  | N-N4 | Fixed: "about 1139px" in DESIGN.md and FEATURES.md |
  | N-N5 | Fixed: "a page with siblings reads its heading, not draws it" |
  | N-N6 | Fixed: case 113 cites FEATURES.md "Rolling" |
  | N-N7 | Reworded: jsdom's cascade lets the later `.page-sub` rule win (a computed-margin case read `0`), so the test states the order only and names case 112 (i), which measures the 12 px |
  | N-N8 | Fixed: "the group chips (the page head's pills) or the tabs under the head" |
  | N-N9 | Fixed: the dead `border-bottom: 0` removed |
  | N-N10 | Fixed: the comment states the measured totals (326.7 now, 326.3 and 325.7 before) |
  | N-N11 | Fixed: this line |
  | N-R2 | Met now: 269.2 kB unconfigured, the limit 270 (default 9); configured 326.7 of 327 |
  | N-R1, N-N12 | Left as `reviews.md` names them |

- Batch P - print: the card and the `/p/` page (`plan-P.md`, previous sha `b3d3994c`). Cases 114, 115. Acceptance (30):

  | Line | Outcome |
  |---|---|
  | 1 Q-P1 | Kept, owner: 63x88 mm, 8.5 / 14.5 mm; `print.js` "size and grid" unchanged; `CLAUDE.md`, `PRODUCT.md`, the READMEs and `llms.txt` untouched; no size line moved in DESIGN.md or FEATURES.md |
  | 2 PR1, PR2 | Done: 4.0cqw / 4.6cqw (`BASE`); catalog medians 7.1 / 5.7 pt in color (S11 below) |
  | 3 PR3 | Done: `git grep -n print-ui -- app` empty; `print.js` reads the platform face of `.pc-text` (CDP): Source Sans 3 |
  | 4 Face wait | Done: `printPage.test.ts` "the fit after the face loads" (held, released true: every card fitted again; false: once), `homebrewPrintPreview.test.ts`, case 115 (held 1500 ms: disabled, then the warm fit; aborted: enabled, no spill) |
  | 5 PR4, C29, C30 | Done: `/p/` row `shipped: true`; 233 px at 360x640, 190 at 1180x720, RU = EN (TD's before: 579 / 350); case 114 (c) logs 233.1 at 390, 189.8 at 768 |
  | 6 PR5 | Done: the tier word `max(2.6cqw, --pc-min-label)` (2cqw in black and white); `smallFields` floor 4.5 pt |
  | 7 PR6 | Done: `list-style-type: '\2013  '`, black `::marker`; `print.js` reads it on `voa2_a3` |
  | 8 PR7 | Closed with no code; FEATURES.md makes no claim |
  | 9 PR8, QP.8 | Done, with Deviation 2: the ladder order holds; a color card whose picture gives way lifts its text to its marks' clearance (`print.js` check; cards under S11) |
  | 10 PR9 | Closed by line 1: `printSub` unchanged |
  | 11 PR10 | Done: no `.pc-name` or `.pc-tag` rule changed |
  | 12 PR12, C31 | Done: no `KeepNote`; the A4 sentence gone; the hint gone too (S11.3: 0% of pixels differ without background graphics) |
  | 13 C29 bar | Done: the crumb row and one control row from 761 px, the crumb row and the switches' row up to 760 px (case 114 (a)) |
  | 14 C30, QP.6 | Done: one card per row `min(column, 420)` up to 760 px (the scale is cut to two decimals: up to 2.4 px narrower); print media unchanged at 360 (`print.js`) |
  | 15 QP.7, RP-1 | Done: «Цвет» / «Ч/б» / «63×88» / «44×63» / «Напечатать» and "Color" / "B&W" / "Print" on `/p/`, the editor's print view and the account; `printInk` names the color group |
  | 16 Bottom line | Done: no «Daggerheart»; `.pc-src` takes the width; the FEATURES.md sentence rewritten; the two `why`s changed |
  | 17 Hands | Done, with Deviation 1: S1 0% to the raw export; the four files hold the export's paths with the masks as clip paths (0.000% of pixels differ from the exact bytes at 12x, max channel 4); the `<img>` reserves 62x37; `derived` and `print.js` pass; paths unchanged |
  | 18 Compact floor | Done: 3.7cqw floor (`smallFields`, `cardFit`); the EN «DAMAGE» beside a modifier 3.94 pt, named in FEATURES.md |
  | 19 No clip | Done: only `uuid(516)` clips in all eight layouts; smallest text 4.5 pt labels, the named EN shortfall apart |
  | 20 Editor view | Done: `print.js` editor-view spec passes with `compact` and `refit` passed by `PrintPreview` |
  | 21 Retired and failed | Unchanged and still tested (`printPage.test.ts` "the states of #/p/") |
  | 22 Crumb | Done: `Crumb.svelte` serves both; `crumb.test.ts` ends with axe; editor goldens unchanged (Verification) |
  | 23 Fonts port | Done: `git grep -n "document.fonts" -- app/src` lists `ports/fonts.ts` only (the comment in `TablesPage` names the port) |
  | 24 Dock | Done: case 114 (b); the toast offset adds `--ebar-h`; `tokens.css` scroll padding names both bars |
  | 25 Thumb Rule | Done: case 114 (g) at 360 and 390, menu shut and open; sweep probe under Verification |
  | 26 New states | Done: `#/p/set-emberaxe ~ phone as gm2`, `~ phone more as gm2`; `#/p/set-tencards as gm2` existed (its `why` now names «Лист 2 из 2»); axe in `printPage.test.ts` "draws one card per row ..." |
  | 27 Departures | Done: FEATURES.md "Print" list with dates; DESIGN.md; the decision file; six "Amended by" lines |
  | 28 Batches 2-9 line | Partly: QP answers applied; detector and shots under Verification; `polish` and `harden` are the orchestrator's |
  | 29 Bundle | See Verification |
  | 30 Strings | Done: `printChanged`, `keepBefore`, `keepLink`, `keepAfter` gone in both languages |

  Deviations: (1) and (2) as Status defaults 1 and 2. (3) S12's 300 dpi PDF rasters of the four layouts were not drawn:
  one nine-card color RU sheet at 150 dpi (`mocks/P/built/built-std9-colour-ru__150dpi.png`) and the screen set are;
  `print.js` ran every PDF check locally. (4) No `cardScale`: the phone preview reuses `previewScale` (planner default
  2026-11-06), so a card is up to 2.4 px narrower than its column, never wider.
- Review: `reviews/P.md`, fix-then-continue. Batch sha `1ae45461`. The one fix pass (previous sha `e5d63c9c`):

  | Finding | Outcome |
  |---|---|
  | CI run 42200991922, `app/typo` `#/p/set-emberaxe` RU/EN 360/1180 "no pressed switch with a check in Печать карточек" | The test was stale: since P the color group is `printInk` «Цвет печати» / "Print color" (P-D16), and its pressed option draws the check. `typo.js` `SWITCHES` names the new group; the check is unchanged. `node tests/run-all.js app/typo` passes |
  | P-B1 | Fixed. `print.js` tests rectangles: no mark rect (tier `svg`/`b`/`i`, burden `img`/`small`, shield `img`/`i`) over a `.pc-tag` rect or a `.pc-name` line rect (`getClientRects`) by more than 0.5 px, no exemption, on the long set and on RU compact color `voa4_t4i-voa4_a3`, with each lift logged. The probe (`scratchpad/b1-probe.cjs`) on the take-back found `voa4_t4i` at 17.4cqw with the tier band 21.0 x 6.5 px and the burden label 2.9 x 4.8 px over a tag; `voa4_a3` at 16.4cqw clear. Default 1 (Status): `PrintCard` drops the take-back loop; text cut at its floor under a mark shrinks on to `SHORTFALL` (2.6cqw): both cards 3.4cqw (4.2 pt), lift 23.4 / 22.4cqw, no hit, no spill. `printPage.test.ts` "takes text cut at its floor under a mark below the floor" reaches the rung in jsdom (a stubbed burden label rect): red at `e5d63c9c` (`--pcpad` 5.8cqw for 22.3), green after. `smallFields` names the two cards' 3.4cqw floor. FEATURES.md "Print" (the fit, the named shortfalls, the catalog figures), DESIGN.md "Signature component" (P-N7), the decision file |
  | P-R1 | Fixed: `.pdock` is sticky at every height; it writes `--pdock-h`, which `tokens.css`' scroll padding and the page toast keep under 481 px (default 2). Case 114 adds 740x360 (the dock in view at scroll 0 and at the last card; `--pdock-h` and the scroll padding equal its height; the first-screen read skipped there) |
  | P-R2 | CI: the configured and unconfigured figures under Verification; no raise made locally |
  | P-R3 | Fixed: FEATURES.md "Print" and the `FontsPort` doc comment say the answer comes once the document has finished loading and its fonts have settled, in both cases |
  | P-N1 | Fixed: 14 `why`s lose "the note under the bar" / "no note under the bar" (the deleted-item note's `why` stays: that note is real); goldens re-seeded by the tool, line 3 only |
  | P-N2 | Fixed: `back()` returns on a modified or non-primary click; `printPage.test.ts` five cases (ctrl, meta, shift, alt, middle button), red at `e5d63c9c`, green after |
  | P-N3 | Fixed: `.toast.page` under 481 px of height drops `--ebar-h` and keeps `--selbar-h` and `--pdock-h` |
  | P-N4 | Fixed: `watchBarHeight` (`components/barHeight.ts`) in `PrintPage`, `HomebrewEditor` and `SelectionBar` (default 3) |
  | P-N5 | Fixed: FEATURES.md "(owner, 2026-10-30)"; the decision file names the owner's answers and dates, no QP ids |
  | P-N6 | Fixed: case 115 on `set-longtext`; the held fit before the face arrives must differ from the warm fit, and the fit after must equal it (default 4) |
  | P-N7 | Fixed with P-B1 (DESIGN.md "Signature component") |
  | P-N8, P-N9 | Deferred (below) |

- Batch 10 - the docs lock and the cleanup (`plan.md` section 7, previous sha `5147cd01`). Acceptance (21):

  | Line | Outcome |
  |---|---|
  | 10-1 Proposed rules | Done: re-checked against the shipped rules; the owner said yes to none, so none moved; the intro dated |
  | 10-2 Detector at zero | Done: `impeccable detect --json --no-inline-ignores app/src` 0 findings (61 before); `config.json` holds no ignore; `git grep -n impeccable-disable -- app/src` empty. Documented: 14 colors and the `print-strip` radius in the frontmatter. Fixed: 11 radii, 3 colors (defaults 1, 2) |
  | 10-3 Re-audit, `design.json` | Partly: the audit read the detector output and the shipped rules (nothing new to `DEBT.md` beyond 10-18); `design.json` not regenerated (default 8, the orchestrator's `document`) |
  | 10-4 Kept exceptions | Done: DESIGN.md "Notes" (no detector ignore survives); `.claude/README.md` "Kept tooling exceptions" (E5, E6, E8, E9) |
  | 10-5 Spelling | Done: `node tests/derived.js` "American spelling" passes; the batch 2 word list over `app/src`, DESIGN.md, `docs/specs`, `.claude` finds identifiers (`aria-labelledby`, the `colour` paint key, `foot-licence`), decision file names, record ids and test names only |
  | 10-6 `FIRST_SCREEN` | Done: 25 rows, every one `shipped: true`; no logged row |
  | 10-7 Reviewer probes | Done: `review.prompt.md` (probes; the second plan look `plan-<batch>-<n>.md`) and `.claude/README.md` beside the habit guards; no hook change |
  | 10-8 P5 | Not built (default): DEBT.md D130 |
  | 10-9 H2 copy, `EQ_DT` | Kept and named (For the owner): five rules (`.tab`, `.tab:hover`, `.tab[aria-current]`, `.picker`, `.picker-t`) of `TableNav` are copied in `HomebrewTabs`; `EQ_DT` serves the catalog rows and print |
  | 10-10 Dead code | Done: `git grep` found no page drawing `compact` or `nameActions`; both, `.card.compact` and `.card-name-acts` removed; `record.test.ts` adapted (8 cases); `REVIEW_ART_SIZES` lost 132, the 96 row points at the face's row rule; `CARD_HEAD_SHA256` re-pinned (the renderer draws no name actions); `node --test tools/artwork/lib.test.mjs` 77 pass |
  | 10-11 Copy rows | Done (defaults 3, 4): the mwt lead gone, «Core», the neutral divider; goldens re-seeded `--only` `#/roll/std` (13, one line each) and `#/roll/mwt` (7); `sections.test.ts` reads no lead; `i18n` parity in `check:fast` |
  | 10-12 Case 89 | Kept (default 6); DESIGN.md "The Whole Message Rule" still names the cut; DEBT.md D128; case 89 passes |
  | 10-13 `404.html` | Kept; DESIGN.md "Notes" |
  | 10-14 `/s/` «1» | Kept; FEATURES.md "Lists", the compact row |
  | 10-15 2-R3, 2-N6 | Done: DESIGN.md "Navigation", "Header" names the Tab-order trade-off; FEATURES.md "Chrome" lost "until its page's batch moves it" (DESIGN.md had no such text left) |
  | 10-16 Monospace, capitals | Done (default 5) |
  | 10-17 `typo.js` | Done in part (default 7); `node tests/run-all.js app/typo` passes |
  | 10-18 Register | Done: DEBT.md D122-D131 in two sections of the follow-up task; the rest named under Notes, "For the owner" |
  | 10-19 Re-audit defects | None new: every finding is in 10-18 |
  | 10-20 Landing | Not this batch (the orchestrator's) |
  | 10-21 Gate cost | See Verification; one CI run and one review cycle still to come |
- Review: `reviews/10.md`, fix-then-continue. Batch sha `34ae151c`. The one fix pass (previous sha `ca730999`):

  | Finding | Outcome |
  |---|---|
  | CI run 42218469286, `app/states` 11 `#/tables/wondrous/w3` navigation timeout | Not batch 10's: passes alone at `34ae151c` (10.4 s) and at `5147cd01` (11.6 s); "nothing in flight" is the CI host's load. No change |
  | CI run 42218469286, `app/states` 68 rows 507.5 ms over 500 | Not batch 10's: medians (a) 312.1 / 323.2 ms at `34ae151c`, 277.7 / 308.9 ms at `5147cd01`, single samples 270-481 ms on both; batch 10 touched only radii and copy on those rows. The limit stays 500 |
  | 10-B1 | Fixed: D125 rewritten from `scratchpad/d125-probe2.cjs` and `d125-routes.cjs`: RU `nav.tabs` 297.2 px, right 313.2 against the 305 px body (`scrollbar-gutter: stable`) at 320 px on five routes, before and after the kind sheet; EN 289; 360 px clean. No batch id; the check reads the bar's edge against the body |
  | 10-R1 | Fixed: the owner list under Notes (items 10-17 added) |
  | 10-N1 | Fixed: `reviews.md` heading restored; CI-N1 to CI-N5 `fixed CI-fix` |
  | 10-N2 | Fixed: `README.ru.md` «Core и Hope & Fear» |
  | 10-N3 | Fixed: `orchestrate.prompt.md` "a second look at a plan: `plan-<batch>-<n>.md`" |
  | 10-N4 | Fixed: FEATURES.md lost "compact card" in both sentences |
  | 10-N5 | Fixed: `.card-name :global(svg)` and its comment gone; the `.card-name-acts` assertion gone; the review page comment reads "168 + 96 px" |
  | 10-N6 | Fixed: the section intro names D122-D124 as the cause family and D125, D126 apart; sections name task `57-debt` |
  | 10-N7 | Fixed: DESIGN.md "Notes" says "no control label" and names the `.ini` initial |
  | 10-N8 | Fixed: "Four exceptions"; "(owner, 2026-10-29)" |
  | 10-N9 | Fixed (default 4); N-N12 with it |
  | 10-N10 | Fixed (default 3) |
  | 10-N11 | Fixed: the `tokens.css` comment says "the markup preview", as DESIGN.md |
  | 10-R2 | Left: the orchestrator's (10-20) |

## Verification
- Batch 10 fix pass, 2026-11-06 (previous sha `ca730999`), each in the foreground, one heavy command at a time. The
  batch 10 block: `git show ca730999:issues/57/handoff.md`, "Verification".
  - `npm run build:test`: exit 0 (before the probes, and again after the copy change).
  - D125 probes (`scratchpad/d125-probe.cjs`, `d125-probe2.cjs`, `d125-routes.cjs`): figures under the fix-pass table.
    A `::-webkit-scrollbar` style did not change `clientWidth` in headless (320), so the classic bar was read as the
    body edge that `scrollbar-gutter: stable` leaves (305).
  - `node tests/app/states.js --shard=8/105` (case 11): `all 1 runs passed` at `34ae151c` and at `5147cd01` (a detached
    worktree in the scratchpad, `node_modules` joined, removed after). `--shard=58/105` (case 68): passed twice at each.
  - `MSYS_NO_PATHCONV=1 node tests/app/golden.js --update --only="#/roll/std"`: 13 files, one EN line each, by the tool.
  - Vitest one file at a time, `VITEST_MAX_WORKERS=2`: `rollResult` 16, `record` 113, `help` 14, `i18n` 73, components `std` 23, components `sections` 23: all pass. `node --test tools/artwork/lib.test.mjs` 77 pass. `node tests/run-all.js derived`: ok.
  - `npm run lint:untyped`, `npm run lint:typed`: exit 0. `rtk npm run check:built`: pass; unconfigured bundle 269.5 kB within 270.
  - `VITEST_MAX_WORKERS=2 rtk npm run check:fast`: run last, after this file; the commit gate takes only its pass.

## Next batch (implement-ready)
- First: CI of the batch 10 fix-pass tip.
- Then: 10-20, the orchestrator's (plan.md section 16): the wave 3 squash, the wave 3 and whole-app blind reviews, the
  closeout commit that deletes `issues/57/` and moves `plan-debt.md` to the follow-up task, the last squash.

## Blockers
- None.

## Deferred
Batch 10 placed every row of the 2026-11-06 fold. The measured rows went to `docs/specs/DEBT.md` (the focus jump D122; the
9a R2 probe, `LIST_A ~ more` and the `/p/` dock «Ещё» D123; the toast over «Ещё» D124; the RU header tabs at 320 px D125; the
dialog art at 500-760 px D126; the stat columns D127; case 89 D128; TD-R1 and TD-R2 D129; P5 D130; the two RU compact
print cards D131). The rows with no user-visible defect are under Notes, "For the owner". The earlier text of this
section: `git show 5147cd01:issues/57/handoff.md`, "Deferred".

- `plan-debt.md` is the follow-up task's plan (steps 1-5); the closeout moves it to that task's directory.
- Batch 8 (`plan-8.md`): the signed-out add-to-list menu keeps its two steps (L13); the `HomebrewPage` search row keeps
  its own `.tools` beside `ListFind` (L8). Kept designs, not defects.

## Notes
- For the owner (named, not filed in `DEBT.md`; each is a refactor, a test or tooling gap, or a choice with no defect):
  1. 4-R1: at 360x640 «В список» ends inside the first screen on 21 of 98 sampled records (median bottom 693 px).
     Recommended: keep the page and let the reader scroll; the trade-off is one scroll on a long record.
  2. `reviews/CI.md` N6: the `ci.yml` comment says a job's fixed cost is about 20 s (about 70 s), `bash-guard.mjs` says a
     shard row costs about 380 s (440-840 s now), and a bare `node tests/app/states.js` has no long-check reminder. A
     hook change needs selftest cases: `plan-debt.md` step 1.
  3. The link-preview Worker's card images (`tools/share-card.mjs`) and the EN `<title>`, manifest name and
     `en/index.html` wordmark: no defect was measured; they wait for the owner's look (`plan-debt.md` step 3).
  4. `reviews/5.md` "Checks still needed" 3-5 and `reviews/6.md` item 3 (menus with 7+ lists at 360, a right-column
     card's menu at 1015-1075 px, Tab and Enter on the nine routes at 360, the homebrew bar at 640x360 and 768x1024):
     not measured; the batch reviews and CI's sweeps cover the families.
  5. 10-9: `HomebrewTabs` copies five tab and picker rules of `TableNav`; `EQ_DT`'s stat abbreviations serve the catalog
     rows and print. Kept; a refactor with no visible defect (`plan-debt.md` step 4).
  6. `typo.js` reads no note or price switch (an account list the loop cannot make) and runs the Whole Message step at
     1180 only (COVERAGE.md "Known thin spots").
  7. The `/roll/voa`, `/roll/community` and `/roll/wondrous` leads are instruction sentences, as the `/roll/mwt` lead was
     (Clarity Rule). Recommended: drop them in the follow-up's visual batch with a mock; trade-off: three more roll
     golden families re-seeded.
  8. P-N9: EN "Print" names two actions (`print`, `printNow`), RU keeps «Печать» / «Напечатать»; the RP-1 answer stands.
  9. The 2-R1 Impeccable `polish` and `harden` passes and `.impeccable/design.json` (`document`) are the orchestrator's.
  10. D125: the RU header tabs pass the page by 8.2 px at 320 px, a sideways scroll only with classic scrollbars.
      Recommended: keep the entry for `57-debt`; trade-off: a desktop window that narrow scrolls 8 px until then.
  11. The four burden hands keep the export's paths with the masks as clip paths, a departure from "Export vectors;
      do not redraw them" (0.000% of pixels differ from the exact bytes at 12x). Recommended: keep; trade-off: the
      files are not the export's bytes.
  12. The `/p/` background-graphics hint is gone (0% of pixels differ without background graphics). Recommended:
      keep it gone.
  13. D131: two RU compact color cards print their rules text at 3.4cqw (4.2 pt), under the 3.7cqw floor.
      Recommended: accept until `57-debt`; trade-off: smaller text on two cards.
  14. Bundle headroom: 269.5 of 270 kB unconfigured; the configured figure is measured on CI only, against 328. Recommended: let the next change raise the
      budget by the rounding rule (ceilings 300 and 350); trade-off: one raise per bundle change.
  15. 9b-N13: in the selection mode the row controls' fixed 146 px inset does not follow the tick column.
      Recommended: fix it in the `57-debt` visual batch with a mock; trade-off: a few px of misalignment until then.
  16. N-R1: thin first-screen margins (`#/homebrew as gm3` 286.2 of 288 at 900x720, `/tables/*` 333.6 of 336).
      Recommended: keep; case 83 fails first on any head growth, which is the guard.
  17. N-N12: fixed in the batch 10 fix pass (the decision file cites "The Head Order Rule"); no action.
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
- Post-wave-3 debt plan: `issues/57/plan-debt.md` (steps 1-5; at closeout the user-visible defects go to `docs/specs/DEBT.md` and the plan moves to the follow-up task directory).
