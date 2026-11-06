# Handoff - TASK 57
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress. Waves 1, 2 and 2b are on `main`. Wave 3 has built 9a, 8, 9b, the CI split and fix pass, TD
  with its fix pass, N with its fix pass (`ef9b511c`, CI green and credited) and now batch P (print: the card and the
  `/p/` page), committed and pushed on `claude/57` (sha in the implementer's report; previous sha `b3d3994c`, the P
  plan's docs commit, pushed with it). CI of the new tip is the full gate: not yet run.
- Review: required (trigger: print fitting and its measured figures, a golden re-seed of 40 files, a Figma-node parity
  change (the burden hands) and two departures from the brief, defaults 1 and 2 below).
- Next batch: 10, after P's review with its one remediation cycle and a green CI of the tip.
- NEEDS_HUMAN_CONFIRMATION: no. For the owner: default 1 (the burden files are the export's paths with Figma's masks
  written as clip paths, not the exact bytes) and default 4 (the background-graphics hint is gone).
- Defaults taken in P (owner AFK; the orchestrator logs them in the AFK decisions file):
  1. The four `card/burden-*.svg` take the export's paths with each outside-stroke mask written as the same region in a
     clip path (`issues/57/mocks/P/burden/unmask.cjs`), not P-D10's exact bytes: Chrome prints a masked `<img>` SVG as a
     raster (4 to 10 images a file, `rasterprobe.cjs`), which broke FEATURES.md "A compact black-and-white sheet holds no
     raster image" (two `print.js` checks). The clip form draws the same pixels (`pixcmp.cjs`: 0.000% at 12x, max
     channel 4) and prints vector (0 images). The spec won over the brief.
  2. P-D8's clearance (about 23cqw under a burden mark and its label) left voa4_t4i and voa4_a3 cut on the RU compact
     color sheet at the 3.7cqw floor. At its floor the text now takes the mark's band back in 1.5cqw steps (18.9 and
     16.4cqw on those two), so no catalog card clips (acceptance 19); `print.js`'s clearance check exempts a card at its
     floor.
  3. The fonts port's browser form waits on the font set's `ready` for both answers (P-D3: "false at once" when none
     loads): `TablesPage`'s anchor scroll needs the document-loaded wait it had.
  4. The hint goes (S11.3): a nine-card color PDF with and without background graphics differs on 0% of its pixels
     (`print-color-adjust: exact`); `printNote` is deleted in both languages.
  5. The dock's «Ещё» is `up` without `flip` (the editor bar's form; `flip` is the record dialog's).
  6. `.pc-strip` and `.pc-thstrip` take `flex-shrink: 0`: a full content box shrank the strip under its 20 pt band
     (`print.js`: voa4_a3 compact 26.0 px for 26.7).
  7. The configured bundle measured 327.3 kB: its limit rose to 328 (`tools/bundle-budget.mjs`, `.claude/README.md`);
     unconfigured 269.8 of 270.
  8. S2 (the before tops) was not measured again: TD's Verification logs `/p/` at 579 px RU (360x640); the after tops are
     under Verification.
- Last agent: implementer (batch P). No subagent runs. No worker has uncommitted code edits.
- Branch: `claude/57` (worktree `.claude/worktrees/57`)
- Base / starting commit: `d8e30731`; previous sha of batch P: `b3d3994c`.
- Pushed: `b3d3994c` and the batch P commit.

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

## Verification
- Batch P, 2026-11-06 (previous sha `b3d3994c`), each in the foreground or waited on; vitest with `VITEST_MAX_WORKERS=2`,
  one file at a time. Earlier batches' blocks: `git show b3d3994c:issues/57/handoff.md`, "Verification".
  - S1: `node issues/57/mocks/P/burden/render.cjs`: `diffToRawPct` 0 and `natural` [62, 37] for all four; `sheet.png`
    draws fingers in both layouts. Then default 1: `rasterprobe.cjs` 4 and 10 images for masked files, 0 for each clip
    file and 0 for the old mittens; `pixcmp.cjs` 0.000% (max channel 4 and 3). `node tests/derived.js`: everything
    matches.
  - Vitest by file: `printPage` 79, `homebrewPrintPreview` 17, `crumb`, `ports`, `tables`, `accountPage`, `a11y`,
    `homebrewEditor`, `state/app`: all pass. `npm run typecheck`: 0 errors, 0 warnings.
  - `npm run build:test`, then `node tests/app/states.js --shard=n/105`: 104 (case 114) 22.7 s, 105 (case 115) 5.1 s,
    73 (case 83) 281 s: each `all 1 runs passed`. Case 114 logs the first sheet at 233.1 px (390x844) and 189.8 px
    (768x1024), RU = EN.
  - First screen (case 83, `#/p/set-emberaxe as gm2`, RU = EN): 233 px at 360x640 (limit 256; 579 before), 190 px at
    1180x720 (limit 288). The dock at 360: 67 px tall, `--ebar-h` equal (case 114 (b)).
  - S11 (`issues/57/mocks/P/tools/print-measure.cjs` on `dist-test/`, 1463 cards a layout, RU / EN): color standard
    median 7.1 pt, min 4.6, below the base 17 / 3, picture median 65 / 68%, gone 7 / 3 (4 / 1 with a mark, 23.2cqw);
    color compact median 5.7, min 4.6, below the base 35 / 14, picture median 60 / 63%, gone 21 / 9 (13 / 3 with a
    mark, 23.4cqw; voa4_t4i 18.9, voa4_a3 16.4 after default 2); black and white median 8.9 standard, 6.2 compact;
    names on three lines 4 / 0; clipped: `hb_longtextaaaaaaaa` (`uuid(516)`) alone in all eight layouts; the smallest
    text 4.5 pt labels, the EN compact «Damage» 3.94 pt. CDP reads Source Sans 3. S11.3 (`scratchpad/bgpdf.cjs`): 0
    of 2,174,960 pixels differ at 150 dpi.
  - `node tests/run-all.js app/print`: first run 6 FAIL (the footer gap at 768 after the new sub line, the strip at 26.0
    px, the two raster checks), fixed by the test (the sub line, then the footer) and defaults 6 and 1; second run 2
    FAIL (the gap 86 px against 80: the sub line's 18 px margin), fixed in `PrintPage` and measured by
    `scratchpad/gapprobe.cjs` (68 px at 768); the third run is CI's.
  - Sweep probe (`scratchpad/mkprobe.cjs`, `PROBE_RE="печать|редактор"`, the `targets` step included): `clean` at 360,
    390, 768 and 1180, RU and EN.
  - Goldens: `MSYS_NO_PATHCONV=1 node tests/app/golden.js --only="#/homebrew/hb_"`: 15 states, only the print preview
    moved (its labels), so the editor's `Crumb` is byte-identical; then `--update --only=` "print preview" (2), "#/p/"
    (38, the two phone states seeded) and "#/account" (6): 40 files, re-seeded by the tool, none edited. Read: the
    crumb link before the `h1`, the new labels, the sub line after the cards, no «Daggerheart», no hint, the dock menu.
  - Shots: `node issues/57/mocks/P/built/shoot.js`: 26 PNGs, none skipped.
  - Detector `npx impeccable detect --json --no-inline-ignores app/src`: 61 findings (60 before); the new one is
    `PrintCard`'s `li::marker` `#000`, an N3 print colour advisory for batch 10. No `impeccable-disable`.
  - `npm run lint:untyped`, `npm run lint:typed`: exit 0. `rtk npm run check:built`: pass, 269.8 kB within 270. The
    configured build (`.claude/README.md`'s line): 327.3 kB over 327, the limit rose to 328 (default 7), then pass.
  - `node tools/decisions.js`: 316 decisions. `node tests/derived.js`: everything matches.
  - `VITEST_MAX_WORKERS=2 rtk npm run check:fast`: run last, after this file; the commit gate takes only its pass.

## Next batch (implement-ready)
- First: the batch P review (`reviews/P.md`; the trigger is in Status), then CI of the P tip.
- Then: batch 10 (the docs lock and the cleanup; `plan.md` section 7). `states.js` ends at case 115 (105 cases;
  `--shard=n/105` runs one: 104 is case 114, 105 is case 115).
- `polish` and `harden` on `/p/` (360, 390, 768, 1180 px, RU and EN) and on the print renders are the orchestrator's
  (acceptance 28).

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
| `/tables/*` at 761 to about 800 px in RU (batch 7b probe) | done in N (acceptance 17: 333.6 px at 768x1024 on `eq_weapon` and `eq_armor`, RU and EN); row removed |
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
- Post-wave-3 debt plan: `issues/57/plan-debt.md` (steps 1-5; at closeout the user-visible defects go to `docs/specs/DEBT.md` and the plan moves to the follow-up task directory).
