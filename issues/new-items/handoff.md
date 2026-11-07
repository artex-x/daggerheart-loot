# Handoff - TASK new-items
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (B1, V1 and the R1 remediation committed and pushed; next a green CI run of the tip, then closeout)
- Last agent: implementer (R1 remediation, 2026-11-07)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `claude/new-items` (worktree `.claude/worktrees/new-items`)
- Base / starting commit: f381d0df (main with task 57 closed, merged in)
- Pushed: yes (R1 remediation commit; the sha is in the push report)
- Session end partial progress (if any): none

## Completed
- R1 remediation (one pass; review `reviews/R1.md`, approve; previous sha 2fa766de): CI `craft` pin 31 -> 33 (the new `vh2>vh6` and `vh8>vh15` chains; the other 31 are unchanged); risk 1 `TableNav.svelte` `picked()` focuses the new group's current tab (else the lit pill) when the picker tab unmounted, one `tableNav.test.ts` case at `wide`; risk 2 `ModeRow.svelte` scrolls the checked supplement into view on open (360x640 RU `/roll/escape_the_veiled_halls`: `scrollTop` 0 -> 45, checked item 572-616 px of 640); nits 1-6 (`llms.txt` "3 items", worker volume anchor `s.chip` with its test and FEATURES example, `label.ts` "eleven books", Amends / Amended by pointers, this handoff, `.claude/README.md` sentence). Risk 3 and the `e2e` latency flake (import of 50 lists 7350 ms against 6000, no supabase code changed) wait for the next CI run.
- V1 (F1 closed): from 761 px the supplements group draws one lit tab, the table picker's button (`Таблица: <book>`, `aria-haspopup="dialog"`, gold text and underline), that opens the same sheet as below 761 px; the other groups keep tabs; the tab slot reserves one row. Previous sha: 5d2a0186.
  - First row of the tables (`[data-primary]` top, RU / EN; the same on ph, lr, vh, wondrous, eq_weapon, core_item), before (B1 handoff and dispatch) -> after: 768x1024 two lines -> 291 / 291 (rule 410); 900x720 334 (exception 336) -> 291 / 291 (exception tightened to 294); 1000x720 RU 331 -> 288, EN 244; 1180x720 287 -> 244 / 244; 1366x768 287 -> 244 / 244; 1440x900 244 -> 244 / 244. Head (chips top to tab slot bottom): 130 -> 87 at 768, 900, 1180, 1366, 1440; 131 at 1000 RU and 130.5 at 1050 RU (chips on two lines). `/roll/ph`, `/roll/lr`, `/roll/vh`: 221 at 768 and 900, 174 from 1000 (unchanged by V1).
  - Files: `TableNav.svelte`, `tableNav.test.ts`, `tables.test.ts`, `tests/app/inventory.js` (state `#/tables/ph ~ table picker`), `states.js` (112: `/tables/*` at 900x720 held to 294), `sweep.js` (`headCap` 110, 140 from 1000 to 1139), DESIGN.md, FEATURES.md, COVERAGE.md, a decision file.
  - Deviations: "before" figures come from the B1 handoff and the dispatch, not from a rebuild of 5d2a0186. The 900x720 rows start at 291 px, 3 px over 288, as the pills' own row under the heading (the named exception, tightened from 336 to 294). The sweep caps were tightened to the new measures.
- B1: the three sources ph (93), lr (26) and vh (15), 134 records, 7 rule cards, 86 pictures (45 + 26 + 15) by `ingest`; the shared section property (`app/src/lib/sectionProps.ts`, `rooms.ts`) for `realm`, `vol` and `room`; the vh room picker; the rule card link to a product host; specs, fixtures, goldens (63 re-seeded, 10 new), decisions.
- Files changed: `data.js`, `img/`, `img/thumb/`, `og/` (86 each), app lib and components, tools, preview worker, tests, docs (about 400 files with art).
- Previous sha (batch diff base): f381d0df
- Deviations and rationale:
  - context.md said ph has 29 items and vh 6 items / 9 consumables; the drafts (book) hold ph 25 non-equipment records (18 items, 7 consumables) and vh 7 items / 8 consumables. The drafts win; the totals 93 and 15 hold.
  - `lr-recipes`: the table became a list `- Name (rating N): effect` (the style tool refuses table lines; owner precedent 2026-10-14). Recorded in the decision file.
  - lr items are labelled (`isLabelled`), and a `<Name> - Action|Reaction|Passive|Rest Move:` head is a label at any length (`desc-style.mjs`); no existing record changed.
  - `Impaired`/«Ослаблен» joined `FEATURE_CONDITIONS`; one override keeps «Отметьте 1 Стресс» plain in `ref lr-fruitcake` (a penalty).
  - vh6 English "an experience" became "an Experience" (the catalog capitalizes it).
  - The Laboratory (d3) picks 1-3 at random: `REAL_DICE` stays (a d3 would relabel every 3-row roll).
  - Volume filter chips read «1», «2», «3» under the row «Том» (`SectionProp.chip`); sections and the path read «Том 2».
  - `catalog.csv` adds `volume` and `room` after `realm`; `names.json` adds `volumes` and `rooms`.
  - The unconfigured bundle budget rose 271 -> 273 kB (measured 272.3); the configured one 328 -> 330 kB (estimated 329.4; no `.env.test.local` in this worktree, CI's `e2e` measures it).
- Review: required (triggers: public contracts and routes changed, new source mechanics, large data ingest, new UI), report `issues/new-items/reviews/R1.md` (approve, remediated above).

## Verification
- R1 remediation commands and results: `node tests/run-all.js craft,derived,dataint,contracts` ok (craft 33 chains); `npm run build:test`; vitest `tableNav.test.ts` 13/13 and `modeRow.test.ts` 39/39; `node --test preview/worker.test.mjs` 181/181; a scratch probe at 360x640 RU on `/roll/escape_the_veiled_halls` (menu `scrollTop` 45, checked item 572-616 of 640); `node tests/app/golden.js --only=picker` (4) and `--only=#/roll` (48): unchanged, no golden touched; `node tools/decisions.js` ok; `VITEST_MAX_WORKERS=2 rtk npm run check:fast` (result in the push report).
- V1 commands and results: `npm run build:test` ok; a scratch probe (`fresh()` from `tests/app/lib.js`) at 768x1024, 900x720, 1000x720, 1180x720, 1366x768, 1440x900, RU and EN, on `/tables/{ph,lr,vh,wondrous,eq_weapon,core_item}` and `/roll/{ph,lr,vh}`: figures in Completed, no sideways scroll; vitest `tableNav.test.ts` 12/12 and `tables.test.ts` 137/137; `node tests/app/states.js --shard=k/108` for 15, 96, 101, 112, 116: all pass; `node tests/app/golden.js "--only=#/tables"`: 17 supplement-table goldens diverged on the tab row only (10 links -> one picker button) and were re-seeded from `test-output/golden/`, one new golden `_tables_ph_table_picker.txt`; `node tests/app/sweep.js 1180 ru`, `1180 en`, `768`: clean (head 131 px at 1050 RU, 87 px at 1050 EN, 40 px picker row at 500-700); eslint and prettier on the changed files clean; `VITEST_MAX_WORKERS=2 rtk npm run check:fast` PASS in 1126 s, bundle 272.5 of 273 kB.
- B1 commands run (exact): `node tests/run-all.js dataint,derived,contracts`; `VITEST_MAX_WORKERS=2 rtk npm run check:fast` (Bash timeout 600000); `npm run build:test`; `node tests/app/golden.js --update --shard=n/4` for n = 1-4; `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub`; `node tests/app/sweep.js <w>` for 360, 390, 768, 1180; `node --test preview/worker.test.mjs tools/desc-style.test.mjs`.
- B1 results: dataint, derived, contracts ok; check:fast PASS (1064 s); goldens re-seeded (73 files); browser suite: app/contracts, app/print, app/typo, app/hues, stub ok; app/states shards 1 and 4 ok, shard 2 one timing miss (68: `#/homebrew` at 300 items 520.6 ms over 500, 8 suites in parallel, not related), shard 3 six failures of check 101 (F1); sweep 360, 390 and 768 pass; sweep 1180 fails 48 checks, all "the catalog head 130px, cap 110" on every table in both languages (F1).
- Gates: check:fast green; CI is the full gate.

## Acceptance (B1)

| Line | Outcome |
|---|---|
| Every record of `context.md` "Goal" in `data.js` with Russian text | met: ph 93, lr 26, vh 15, total 1593 (`dataint`) |
| The seven refs render with their product link | met: `record.test.ts` ("a supplement's rule card"), golden `#/i/lr6 ~ ref open` |
| 86 pictures installed, no `unsourced` | met: `ingest` created 86 assets, 134 record links, 0 shared, 0 unarted; the Mournguard badge picture not shipped (owner) |
| `dataint` reports 1593 records | met |
| Roll (incl. the vh room picker), tables, search, stub, print card for ph, lr, vh | met in unit tests, goldens and the browser suite; print strips through `app/print` (no new trait or range word) |
| `check:fast` green | met |
| B0 checks: `lr-recipes` table | reshaped to a list (see Deviations) |
| B0 checks: «Ослаблен» and `Name - Kind:` labels | settled in `desc-style.mjs` (see Deviations) |
| B0 checks: ref `shambling-zombie` for lr12 | met: the key exists (dv66's card) |
| B0 checks: `ph-mounted` nesting | fixed: the subset has no nested list, and the three indented ability lines drew as paragraphs with a literal dash; they are now items of the one list (9 items), in both languages |
| B0 checks: vh6 "Experience" | capitalized |
| UI pass at ten supplements | done; F1 needs V1, F2 fixed (below) |
| lr owner decisions recorded | met: `docs/decisions/2026-11-07-pistolheart-last-round-table-and-veiled-halls-are-sources-ph-lr-vh.md` |

## UI pass findings (screenshots in `mocks/`)
- F1 (closed by V1; mocks `v1-supp-picker-*.jpg`, `v1-supp-sheet-*.jpg`): the supplements tabs row on the tables page. Ten tabs need 1331 px in one line (1169 px of names + 9 x 18 px gaps); from 761 to about 1380 px they take two lines on every table, since the tab slot is reserved for the tallest group. Measured RU: 768x1024 head 130 px (cap 140, ok; two lines before too); 1000x720 first row at 331 px, against the First-Screen Rule's 288 px at 720 (was 288); 1180x720 first row at 287 px (ok) but the head exceeds the 110 px cap from 1140 px; 1366 287 px against 244 px at 1440 (states check 101). Mock `f1-supp-tabs-two-lines-1180x720-ru.jpg`. No local fix: gaps or padding cannot win 200 px. V1 options: (a, recommended) from 761 px show the supplements group's books in the same picker the narrow layout uses, the other groups keep their tabs; (b) shorter tab captions (rejected by the source-name decision); (c) accept two lines and lower the First-Screen Rule (changes a design law).
- F2 (fixed): the supplements menu «Дополнения» at 360x640 RU is 498 px tall from 177 px and ended at 674 px, past the window. `ModeRow.svelte` caps it at the window less 186 px with its own scroll; it now ends at 617 px. Mocks `f2-supmenu-360x640-ru-before.jpg`, `-after.jpg`. FEATURES.md and DESIGN.md say so.
- F3 (by design, noted): the equipment tables' «Источник» row now holds three more books, so it folds behind «и ещё 3» (the existing fold); the frame chips sit behind it.
- OK: 360x640 RU and EN, no horizontal scroll and no clipped visible text on `/i/ph7` («Продвинутый Револьвер Вестника Войны»), `/i/lr6`, `/i/lr17`, `/i/lr23`, `/i/vh15`, the three tables, the three roll pages and search; first result at 250 px on the roll pages and first row at 230 px on the tables (rule 256 px); the table picker sheet at 360x640 holds the ten books (`ok-picker-sheet-360x640-ru.jpg`).
- Not covered by hand: 390-700, 999/1000/1050 in EN, list and print previews by hand (the browser suite and the sweep cover them).

## Next batch (implement-ready)
- Name: CI read and closeout
- Objective: read the next CI run of the tip, settle R1 risk 3, close the task.
- In scope: the `e2e` job log's configured bundle total; if the budget check fails, raise `tools/bundle-budget.mjs` (line 35 estimate 329.4, the limit) and `.claude/README.md` (about line 2423) to the measured total rounded up.
- Out of scope: new features; a second review (R1 has no blocker).
- Files expected: `tools/bundle-budget.mjs` and `.claude/README.md` only if the budget check fails; otherwise none until closeout.
- Steps: 1. Read the CI run for the tip. 2. Settle the budget. 3. Run `/handoff` closeout (durable list, delete `issues/new-items/`, push).
- Acceptance criteria: CI green on the tip; the configured bundle total recorded in `.claude/README.md`.
- Verification commands: `gh run view <id> --log` for `e2e`; `rtk npm run check:fast` after any edit.
- Risks / do-nots: do not loosen the `craft` pin or the budget without a measured figure; an `e2e` latency miss alone (import of 50 lists) is a re-run, not a fix.

## Blockers
- None for R1. V1's visible change (the supplements' books in the picker from 761 px) is an AFK default (N1) for the owner to confirm.

## Deferred
- `catalog-index.csv` is 183817 of 196608 bytes; about 110 more records fit (`CONTRACTS.md` section 4).

## Notes
- Mocks path: `issues/new-items/mocks/`.
- Screenshot findings: see "UI pass findings" (F1-F3); R1's probes found no new visual defect beyond risks 1-2, both fixed.
- Cleanup performed / retained artifacts: `issues/new-items/mocks/` is retained until closeout; no scratch files in the tree.
- Owner defaults taken (AFK): the d3 room rolls 1-3 at random; recipes as a list; volume chips as numbers; `lr` labelled; vh6 capitalized; budget raised; F2 fixed locally; F1 goes to V1 with option (a).
- Durable items written to their homes this batch (file, section): `docs/decisions/2026-11-07-*.md` (two files); `docs/specs/FEATURES.md` ("Rolling", "Tables and search", "Chrome"); `ROUTES.md`; `CONTRACTS.md` sections 1, 2, 4; `STATE.md`; `DESIGN.md` mode row; `.claude/README.md` bundle budget; `llms.txt`; both READMEs; `PRODUCT.md`.
