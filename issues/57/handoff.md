# Handoff - TASK 57
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress, STOPPED by the owner for a session reboot (2026-11-05, about 23:30 UTC). Waves 1, 2
  and 2b are on `main`; wave 3: 9a, 8, 9b and batch CI are built and pushed. Tip `22d9a00b` (batch CI; 9b is
  `18429aee`, its review `22f93378`, its remediation `6578a2c7`). Batch CI's review is APPROVED
  (`reviews/CI.md`, report-only nits N1-N6). CI run 42116078717 of `22d9a00b` is RED, but the split works: every
  `browser (n)` job now ends in about 10-11 min (it timed out at 30 before). Four real failures to fix first,
  all from CI's log (`gh run view 42116078717 --log-failed`):
  (1) `app/states` case 86 (the hidden header): "after the slide: the header is not out of the window,
  top -54.33 bottom 56.85" - the SAME figures failed in runs 42020997138 and 42083009049 and in a CI run before
  9b, so it is deterministic on CI, not a flake (the earlier "timing flake" claim in `handoff.md` Deferred is
  wrong: reproduce on a CI-like build with the 2 vCPU/slow headless settings, or measure the transform at the
  moment of the check); (2) `app/states` case 89 (the roll page layout): `#/roll/many_worlds_tavern` and
  `#/roll/vault_of_ages` at 360 RU, "the results line ends at 294.69" (the 9b remediation's `.rp-ctrl` /
  `AltPanel` wrap change or R1/R2; read the case's limit); (3) `app/states` case 44 (share link saved after
  sign-in): "the players' note is not on the page" (9b's note/share rewrite: stale case or a real defect);
  (4) `e2e`: "contract: import: 50 lists of 100 entries took 9329 ms" (a timing limit on the hosted test project:
  read the limit in `tests/e2e`, check whether the lists import or store changed in 8/9b, re-run the failed `e2e`
  once before changing anything: `gh run rerun <id> --failed`, which the CI credit counts once).
- Last agent: reviewer (batch CI). No subagent runs. No worker has uncommitted code edits.
- NEEDS_HUMAN_CONFIRMATION: no. One figure for the owner: the folded requests strip at 360x640 now starts the
  rows at 304 px (was 324; the owner's figure was 292), so the 360 exception is 304 (review B3: above 300, logged).
  No for batch N: the owner answered N1-N4 on 2026-11-05; one planner default the owner may overrule: from 761 to
  999 px the pills take their own row under the head row (`plan-nav.md` section 4).
- Branch: `claude/57` (worktree `.claude/worktrees/57`)
- Base / starting commit: `d8e30731`; previous sha of batch CI: `0f931af2`.
- Pushed: up to `22d9a00b`.
- Next step, in order (the owner's decisions of 2026-11-05 are in `context.md` items 7-15 and their ANSWERS):
  (1) fix the four CI failures above in ONE fix pass (writer `opus`; reproduce each before the fix; never loosen
  a check), apply `reviews/CI.md` nits N1-N4 and the S8 step of `plan-ci.md` (record each job's minutes, each
  `app/states` row's seconds, the pass-line counts 25/24/24/24 of 97; the README CI row), push, CI credit;
  (2) FOLD the plans into `plan.md`/`handoff.md` (the fold lists at the end of `plan-T.md`, `plan-D.md`,
  `plan-text.md`, `plan-N.md`, `plan-P.md`; batch D is merged into T as "TD" with the Measure Rule `plan-text.md`;
  renumber the new browser cases: TD 108-111, N 112-113, P 114-115; restate `plan-P.md` for the owner's "keep 63x88
  mm" (Q-P1 no: P-D1 and P-D17 take their fallbacks, no `CLAUDE.md`/`llms.txt` change, no plan review for P));
  (3) batches in this order: TD (`plan-T.md` + `plan-D.md` + `plan-text.md`; opus), N (`plan-N.md`; opus), P
  (`plan-P.md`; opus), 10 (docs lock; `plan.md` section 7 row 10 plus the inherited lines), each with its batch
  review (reviewer dispatches name the guideline set of `context.md` item 10) and one fix pass, a push and a CI
  credit per batch; (4) the wave 3 blind review of production-like screens and its mitigation, the closeout
  (`/handoff` skill, "Finishing a task"; `orchestrate.prompt.md` "Task closeout and cleanup": the squash onto
  `main`, the deploy, the merge back), then the whole-feature blind review and its mitigation. The squash message
  takes `reviews/9b.md` R7's corrected text (commit `18429aee`'s body has wrong sentences).

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


## Verification
- Batch CI, 2026-11-05 (previous sha `0f931af2`), each in the foreground:
  - `node tests/run-all.js --shard=n/5 --list`, n = 1 to 5: 3, 3, 8, 4, 4 rows, as `plan-ci.md` section 5.
  - `node tests/app/states.js --shard=5/4`, `node tests/app/golden.js --shard=5/4`, `node tests/run-all.js
    --shard=5/4 --list`: each exit 1 with `--shard must look like --shard=1/4 (got "--shard=5/4")`.
  - `node tests/run-all.js derived,contracts`: first FAIL (the cited decision file did not exist yet), then pass
    after it was written.
  - `node tools/decisions.js`: `docs/DECISIONS.md - 315 decisions`.
  - `npm run build:test`, then `node tests/app/states.js --shard=1/40`: cases 1 (3.0 s), 50 (7.9 s), 91 (20.7 s);
    `all 3 runs passed (shard 1/40 of 97)`.
  - `npm run lint:untyped`, `npm run lint:typed`: exit 0 (untyped rerun after the last format).
  - `VITEST_MAX_WORKERS=2 rtk npm run check:fast`: first FAIL (prettier on `tests/app/states.js`), fixed with
    `prettier --write`; then PASS in 54 s, gate credit armed.
- Batch 9b remediation, 2026-11-05 (previous sha `22f93378`; vitest with `VITEST_MAX_WORKERS=2`):
  - Reproduced first, on the 9b build: `sweep-only.cjs` (the sweep's `PAGES` filtered to «список: заметки
    открыты», no focus walk) at 360: 45 px RU, 16 px EN, as CI; `pv-probe.cjs` on `#/roll/community_items` at
    1180 RU: the picker 125 px, the value 81 of 99 px; `print-step.cjs`: the old press throws `no control named
    "Убрать из списка"`. The new case 107 360 block and the two new unit tests fail at `22f93378` in a detached
    worktree outside the repo (107: the note content box 88 of 245 px and 69 / 40 px sideways; vitest: the one gold
    action and the reopen); the worktree is removed.
  - After the fix: the sweep entry clean at 360 and 390, RU and EN; `node tests/run-all.js app/typo`: ok, 219 s;
    `print-step.cjs`: the toast under print `display: none`; `seg-probe.cjs` (R4): every switch inside its box.
  - Loader runs (`states-only.cjs`) on the final `dist-test/`: 83 (requests 304 / 304 at 360, 209 at 1180; `/s/ ~
    long name` 301 / 302 at 360, 312 / 312 at 1180), 105, 106 (clamp shares as at 9b), 107, 65 pass.
  - Vitest: the 11 affected files 786 of 788 on the first run; the 2 stale tests fixed (`rollPage.test.ts` read the
    dead «Справка» fallback, `sharePanel.test.ts` the deleted hint) and their files rerun: pass.
  - Goldens: compare `golden.js --only=#/lists` (91 states): 22 diffs, all explained (EN "Show less", the share hint
    gone, the tall face's number badge in `~ rolled`); re-seeded with `--update`: 11 files.
  - Shots re-taken: `list-note*`, `list-notes*`, `list-note-area__360`, `list-requests*`, `list-roll` at 768 and
    1180, `hb-new`, `hb-card`, `hb-set` at 320 / 360. `list-roll__360` is skipped by `shoot.js` (its state presses
    «Бросить по списку» at the state's own width).
  - `npm run lint:untyped`, `npm run lint:typed`: exit 0 after the last edit. `rtk npm run check:built`: pass,
    267.4 kB within 269. Detector `impeccable detect --json --no-inline-ignores app/src`: 60 findings (60 before),
    none new.
  - `VITEST_MAX_WORKERS=2 rtk npm run check:fast`: PASS (format, svelte-check, golden stage: 3 stages 87 s; vitest 79
    files, 2926 tests with coverage on the changed sources, 931 s; budget within 269 kB), gate credit armed.
- Batch 9b and earlier: `git show 22f93378:issues/57/handoff.md`, "Verification".

## Next batch (implement-ready)
- Name: the CI fix pass (the four failures in Status, plus `reviews/CI.md` nits N1-N4 and step S8 of
  `plan-ci.md`), then the fold, then batch TD, N, P, 10 (see Status "Next step").
- Verification: CI of the fix tip: every `browser (n)` green, each `app/states` row under 600 s, the longest job
  under 20 min, pass lines 25, 24, 24, 24 of 97 (the split already holds: jobs ended in 10-11 min on
  `22d9a00b`), `e2e` green.
- CI of `22d9a00b` already proved the rest of the 9b remediation: `check` coverage, `app/sweep` 360/390/768,
  `app/typo`, `app/print` passed in shards 1 and 4; the failures are the four in Status.
- Facts for the dispatches: the local gates are the affected vitest files, both lints after the last edit, the golden
  re-seed when goldens move (each shard with the Bash timeout 600000), `npm run check:built`, the detector, and
  `rtk npm run check:fast` last; browser suites and sweeps run on CI. On this host `VITEST_MAX_WORKERS=2` bounds
  vitest's workers. A golden is re-seeded, never edited.

## Blockers
- None.

## Deferred
- 9a R2 probe (run in 9b, 360x640 RU, `LIST_A ~ noted as gm4`): the list «Ещё» at top 141 and scroll 0; opening its
  menu scrolls to 83 and the shown header covers «Ещё» (top 58); Escape returns the focus and the page to scroll 0;
  a tap outside leaves scroll 83 with «Ещё» covered. A `preventScroll` focus return cannot cure the tap path (no focus
  returns there): not taken. The same family as the focus jump below; at closeout to `DEBT.md` unless batch T fixes it.
- `RecordCard`'s `compact` variant and `nameActions`, the `.card.compact` rules and the `REVIEW_ART_SIZES` rows for
  132 and 96 px: no page draws them since the list roll took `RollResult`; `record.test.ts` and `tools/artwork`
  still read them. Batch 10's audit removes them with their tests (`RecordActions`' dead rows left in the 9b
  remediation).
- Batch 9b, `typo.js`: the note switch and the price switch are not in `SWITCHES` (the loop opens a route and cannot
  make an account list); `/search`'s kind row is not either; the Whole Message step reads 1180 only, not 360.
- `/s/` shows the bare list position «1» where `/search` shows «№ 89» (critique, 2026-11-05; `plan-9b.md` M21 d): two
  different numbers, «№ 1» costs three characters of the name column at 360 px. Not changed; batch 10's audit may
  revisit it.
- Tabular stat columns on table rows from 1440 px (owner, 2026-11-05, `plan-9b.md` M22): a "Proposed rules" row, built by
  its own task after wave 3 with a mock first (`plan.md` section 12).
- Batch N, copy in the touched heads (critique N-7, `plan-nav.md` section 6): the `/roll/mwt` lead «Выберите мир и бросьте
  кость по нему.» is an instruction sentence (Clarity Rule; proposed fix: no lead); «корника» in the `/roll/std` lead
  needs the `daggerheart-ru-terms` skill (the help text uses it too); the gold-outlined «ИЛИ» dividers of the roll
  pages (Seal Rule, pre-existing). Batch 10.
- Case 86 "after the slide" (CI run 42020997138, shard 3 at 1414 s): the header read mid-way (top -54.3, bottom 56.9)
  after the filtered `transitionend`; it passed twice alone on 2026-11-05. If it recurs, log each `transitionend`'s
  `elapsedTime` and target before the read.
- Add-to-list states whose EN half holds a closed menu (the 8-R3 shape): `#/i/ci1 ~ many lists as gm4`, `~ new list`,
  `~ new list as gm2`, `~ new list from a search as gm2`, `#/tables ~ a row opened, list menu as gm4`, `~ a row
  opened, new list`, `~ bar menu as gm4`, `#/homebrew ~ add to list as gm1`, `#/homebrew/<HB_AXE> ~ add to list as
  gm1`. Each needs an `again` that repeats its enter's presses; it rides 9b's re-seed (placed: `plan-9b.md` S13.2,
  acceptance 20).
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
- `404.html`'s look (pw2-N1, the reviewer's deferred-scope half): it keeps the system font and draws no die mark;
  the words, the `h1` and the actions now match the app. A self-hosted font on a script-free host page needs its own
  `@font-face` path; batch 10's lock is the place to decide it.
- `/search` at 320x568 RU (batch 7 remediation probe): after a kind is picked in the sheet and the sheet closes,
  `scrollWidth` is 313 against a `clientWidth` of 305, and a probe that hides one element at a time finds the
  header's tab links. Case 93 checks no sideways scroll before the sheet opens, where it passes. Not investigated.
- 6-N1 (the next batch with a golden re-seed): add an editor entry with a 120-character name as the fourth
  `FIRST_SCREEN` row, or log its 1180 offset from one probe. From 761 px the `h1` takes three lines, so the
  offset at 1180 is unmeasured (about 240 of 288 by the review's estimate).
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
- P5 (batch 4, K11): `rollNo` («номер» / "roll") stays; batch 10 changes it with `tools/share-card.mjs`
  and the stubs after a plan review (`plan.md`, batch 10).
- Toast over «Ещё» (batch 4): at 360 an action toast covers the end of the menu for its 7 s; a second
  save by touch waits for it. Batch 8 decided no sheet (`plan-8.md` L12), so it stays, and it now also covers the
  end of the add-to-list popover; batch T measures it with the new toast durations (`plan.md` section 7, "Batch T");
  at closeout it goes to `docs/specs/DEBT.md` unless a later batch fixes it.
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
- 2-R3 (batch 10 audit): from 761 px the header draws brand, jobs, language,
  account while the DOM order is brand, language, account, jobs (WCAG 2.4.3).
  Recommended: name the trade-off in DESIGN.md "Navigation", "Header", and let
  the audit decide.
- 2-N6 (batch 10): DESIGN.md "The Same Label Rule" and FEATURES.md "Chrome" say
  "until their page's batch moves them"; batch 10's lock removes it.
- R5 of `reviews/plan-1-3.md` (deferred-scope): `review.prompt.md` names a third
  look `<name>-2.md`, while `agent-guard.mjs` reads only `plan-<batch>-<n>.md`.
- Batch 10: the tab and picker CSS copied into `HomebrewTabs` from `TableNav` (H2); `EQ_DT`'s abbreviations
  in the stat line (D15, shared).
- Batch 3 candidate: the 1180 px equipment column table of mock 3 (D6, Q3-T), if
  the owner says yes; one added item with its own mock check.
- N0-2 of `reviews/mocks-2.md` (batch 4): the error-page pattern's circled icon
  is a template shape; keep the heading, the cause and the action.
- `KeepNote.svelte` leaves with batch P (the Account page's Display note left with batch 7).
- The link-preview Worker's card images (`tools/share-card.mjs`).
- The EN `<title>`, manifest name and `en/index.html` wordmark.
- Uppercase controls outside the capitals rule are audited by their surface
  batches (15 components carry `text-transform: uppercase`).
- Monospace labels still outside the Key Characteristics rule, owed to their
  surface batches: `.ordiv i` (OrGrid), `.altcol`
  (TablesPage), HelpButton, `.steps-l` (RecordCard).


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
- Cleanup performed / retained artifacts: compacted on 2026-11-05 (142 KB against the 150 KB line): Completed is one
  line per shipped batch, Verification holds batch 8, Notes hold current state. The last pre-collapse commit is
  `c489766a` (`git log --oneline -3 -- issues/57/`: `c489766a`, `17700f3c`, `dc132655`);
  `git show c489766a:issues/57/handoff.md` holds the full tables and every measurement.
- Session end partial progress (if any): none
- Durable items written to their homes this pass: `FEATURES.md` "Chrome" (help and pin) and "Lists" (the menu count,
  the name field up to 760 px, `aria-expanded`, the not-found title); `COVERAGE.md` (the not-found title); the
  decision files of 2026-09-28 ("Amended by") and 2026-11-05 (two).
