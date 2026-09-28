# Handoff - TASK persist-6-import-export
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress - `B6.2` (R6's terminal batch) implemented and
  amended onto the task commit; next the orchestrator's goldens (P12) and
  `sweep.js 360`, then the batch review, then closeout
- Last agent: implementer (2026-09-28, `B6.2`)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `ab261b41` (R7 plan docs, unpushed) on `88c9f8bc` (R4, pushed)
- Pushed: no

## Completed
- Batch name/id: `B6.2` - the UI (`plan.md` section 9). `B6.1` (the contract,
  `llms.txt`, the pure modules, the port and `import_lists`) is in the same
  commit, reviewed approve (`reviews/B6.1.md`), e2e green on 2026-09-28.
- What shipped: `components/BatchBar.svelte` (the list page's strip, extracted;
  the list page draws it `joined`); `ListCard.svelte` (the count as a meta line,
  the pick box); `ListsPage.svelte` (the strip over the account cards, the ticks
  pruned to the drawn cards, «Скачать JSON (N)», «Удалить (N)» with one confirm,
  «Импорт из файла» under the name row); `components/ImportPanel.svelte` (the
  field, the preview and its report by list, the error report, the one-line
  refusals, the press); «Скачать JSON» on an account list page; «Ваши данные»
  on `#/account`; `CloudLists.importRows`/`import`; `AppState.exportLists`/
  `exportData`; `lib/bundle.ts` `names`, `item`, `overBounds`, `dataFileName`;
  `lib/zip.ts` `manyLists`; `lib/i18n.ts` `fewNames`; every key of 4.6 in
  `dict.ts`; the sixth `help.ts` paragraph; the driver's `download()` and
  `upload()`; states 58-62; flow F13; six new goldens; the `B6.1` review items.
- Files changed: `README.md`, `README.ru.md`, `PRODUCT.md`,
  `docs/specs/{FEATURES,META,STATE,COVERAGE}.md`, `docs/DECISIONS.md`, both
  R6 decision files (the zip one's Task line; the new
  `2026-09-28-account-lists-are-selected-on-the-index-and-deleted-together.md`);
  `app/src/lib/{bundle,zip,i18n,dict,help}.ts` and tests;
  `app/src/state/{cloudLists.svelte,app.svelte}.ts` and tests;
  `app/src/components/{BatchBar,ImportPanel,ListCard,ListsPage,ListPage,AccountPage}.svelte`,
  `batchBar.test.ts`, `importPanel.test.ts`, `listsPage.test.ts`,
  `listPage.test.ts`, `accountPage.test.ts`, `a11y.test.ts`;
  `tests/app/{driver,inventory,states}.js`, six new `tests/app/snapshots/*`;
  `tests/e2e/flows.mjs`, `tests/e2e/admin.mjs` (`listsOf` reads `position`);
  `issues/persist-6-import-export/{plan,handoff,context,reviews}.md`,
  `reviews/B6.1.md`.
- Previous sha (batch diff base): `c984aa9e`.
- Deviations and rationale:
  1. P15 extended to `example.json`: gm1 holds «Лавка кузнеца», so by the rule
     (4.4, 4.13) `example.json`'s preview carries the name note, where mock
     `m05` (and the plan's `importPanel.test.ts` line "no report") draw none.
     The rule wins as in P15; the test "previews a clean file with no report"
     uses `example.json` renamed «Новая лавка», and a second test pins the note
     on `example.json`. No golden previews `example.json`.
  2. `quoted` already existed in `dict.ts` (R5's moved-lists notice, same RU and
     EN values); it is reused, not added a second time.
  3. State 61 sends the buffer with `d.hidden()` and polls `d.fake('lists.list')`
     (6 s at most) instead of `d.writesSettled()`: the index has no
     `[data-saving]`, so `writesSettled()` passes at once there.
  4. State 60 reads `ci1`'s quantity and price from the row's two inputs (2 and
     150): the list page draws them as field values, not as «×2» text.
  5. `ImportPanel` keeps a refusal as its dictionary key (and the version), so
     the line follows a language switch; `zipStored` returns
     `Uint8Array<ArrayBuffer>` so `exportData` builds its `Blob` without a copy.
  6. `listsOf` (`tests/e2e/admin.mjs`) also selects `position`, so F13 checks the
     entries by position as the plan asks.
  7. The golden count in `COVERAGE.md` was stale (185); it now says 196.
- Review: required (triggers: batch deletion of account lists can lose stored
  data; the import's UI over the new write path; the terminal batch), report
  `issues/persist-6-import-export/reviews/B6.2.md` - pending.

### Acceptance lines
- Q1 (all or nothing): `importPanel.test.ts` "says the list limit and keeps the
  preview, the account unchanged"; `cloudLists.test.ts` "passes a refusal on".
- Q2 (both notes in every export): state 58, `app.test.ts` "names the entries in
  the language on screen, with both notes".
- Q3 (three export surfaces): «Скачать мои данные (ZIP)», «Скачать JSON (N)»,
  «Скачать JSON» - `accountPage.test.ts`, `listsPage.test.ts`, `listPage.test.ts`.
- Q4 (an unknown id skipped and named): the `~ import preview as gm1` golden,
  `importPanel.test.ts`.
- Owner statement 1: state 61, `listsPage.test.ts` (confirm, no undo, buffer).
- Owner statement 2: no badge on a card; the meta line (`listsPage.test.ts`; the
  re-seeded `#/lists` goldens, orchestrator).
- Owner statement 3: the hint's two links, relative, new tab (`importPanel.test.ts`).
- Owner statement 4: the name note and the repeated id with both positions
  (`importPanel.test.ts`).
- Owner statement 5: skips and errors grouped by list with position, record and
  path (`importPanel.test.ts`; the `~ import preview` and `~ import refused` goldens).
- Owner statement 6: the data zip `daggerheart-loot-data-<date>.zip` with
  `lists.json` (state 59, `app.test.ts`).
- Owner statement 7: the help paragraph and the hint name `llms.txt`;
  `i18n.test.ts` "names the interface's own labels".
- Risk 7 (`plan-B6.1-10`): done; `svelte-check` 0 warnings (no unused selector).
- Risk 8 (`plan-B6.1-11`): done; the `#/lists ~ requests as gm1` golden re-seeds
  (orchestrator).
- Risk 9 (`plan-B6.1-12`): done (`listsPage.test.ts`, state 62).
- `plan-B6.1-22`: the seven owner lines above.
- `plan-B6.1-2-N4`: `dict.ts` holds every key of 4.6's table (`quoted` reused).
- `plan-B6.1-2-N5`: `manyLists` with its text (`zip.test.ts`, `importPanel.test.ts`).
- The error texts `B6.1` left open: `importErrId`, `importErrName`, `importTooSlow`
  (`importPanel.test.ts`).
- The owner's QA files: none entered the repository (P13).
- `B6.1-R1`: done; `git grep -n -e "list-link" -e "ссылки на список" -- README.md
  README.ru.md` shows only `README.ru.md:322`, which names the format frozen in
  `CONTRACTS.md`, not `llms.txt`. Lands before the push.
- `B6.1-N1`, `-N2`, `-N3`, `-N4`: done (`reviews.md`).
- `B6.1-N7`: left (P14), in Deferred for R7's `B7.3`.
- `lib/zip.ts` only through `import()`: `AppState.exportData` and `ImportPanel`
  (`git grep -n "lib/zip" -- app/src ':!*.test.ts'` plus the untracked panel);
  the zip chunk is 1.6 kB gzip (`node tools/bundle-budget.mjs`), the unconfigured
  build 144.0 kB of 150 kB (132.4 kB before `B6.2`).
- The list page draws what it drew: `listPage.test.ts` passes with no case edited
  (one case added); the `#/lists/a*` goldens are for the orchestrator's P12 diff.
- A retry after `network` sends the same rows (`importPanel.test.ts`,
  `cloudLists.test.ts`).
- `CloudLists.import` sends the buffer first and re-reads without «Загружаем...»
  (`cloudLists.test.ts`).
- Behaviour lines of section 9 (the pick box, «Выбрать все», the export over the
  bounds, a refused removal, the import field's states, the 5 MiB refusal, the
  zip's other files, «Ваши данные», «Скачать JSON» on the list page, the help
  paragraph, the dictionary, states 58-62, F13, the docs): done; the 360 px
  strip and the pick box geometry wait for `sweep.js 360` (orchestrator).
- Every new component test ends with `expectNoA11yViolations`; coverage reaches
  `BatchBar.svelte` and `ImportPanel.svelte` through their own tests.

### Golden ids (P12)
- New (6, seeded by the implementer with `node tests/app/golden.js --update
  "--only=~ import"`, `"--only=~ lists selected"`, `"--only=~ lists deleted"`):
  `#/lists ~ lists selected as gm1`, `#/lists ~ import panel as gm1`,
  `#/lists ~ import preview as gm1`, `#/lists ~ import refused as gm1`,
  `#/lists ~ imported as gm1`, `#/lists ~ lists deleted as gm1`.
- Expected re-seeded (26, not re-seeded here): the 13 `#/lists` states of
  `plan.md` section 9 "Golden ids", the seven `SHOP`/`TROPHIES` account list
  pages, `#/l/ ~ shared, saved as gm2`, `#/s/gm-token-1 ~ saved as gm2`, and
  `#/account as gm1`, `as gm2`, `~ delete confirmation as gm1`, `~ pinned table
  as gm2`. Their `why` lines changed only where they named the badge, the edit
  line, five paragraphs, five sections or the list page's actions.

## Verification
- Commands run (exact), 2026-09-28:
  - `npx vitest run <file>` per step (focused): green.
  - `rtk npm run test`: 4 failures in `importPanel.test.ts` (a leading `&#32;`
    trimmed at an `{#if}`); fixed, the file green.
  - `npm run build:test`, then the six `golden.js --update --only=...` runs
    above (6 files written, nothing else touched).
  - `rtk npm run check` (Bash, timeout 600000): FAIL once on
    `ListCard.svelte` branches 66.66 % < 75 %; two `listsPage.test.ts` cases
    added (the untitled pick box, the failed thumb); then PASS, 2394 tests,
    lines 99.03 %, branches 92.53 %; past the 600 s tool cap, armed by its own
    exit (`.claude/.check-cache.json` `"by":"exit"`).
  - `rtk npm run check:built`: PASS - both builds, the smoke over HTTP, the
    budget 144.0 kB of 150 kB (zip chunk 1.6 kB), no fake in `dist/`.
  - `node tests/run-all.js app/states`: FAIL on 59 (a page function closed
    over a Node helper) and 60 (read «×2» as text); both fixed; then ok, 298.6 s.
  - `node tests/run-all.js app/print,app/contracts,app/typo,app/hues,stub`: all
    ok (544 s).
  - `rtk npm run e2e`: PASS - contract 11 cases (`move of 1300 entries: 436 ms`,
    `import of 50 lists of 100 entries: 3847 ms`, `import of a 5 MB file
    (5461091 bytes of rows): 3950 ms`), the configured build, F0-F13, cleanup.
    `dist/` is left configured for the test project.
  - After the last edits (states 59 and 60, `COVERAGE.md`, the task files):
    `rtk npm run check` again: PASS, 2394 tests, lines 99.03 %, branches
    92.53 %; armed by its own exit.
- Results: every gate green on the amended tree; `app/states` and the second
  browser group ran on `dist-test/` built from the same sources (the two later
  fixes touch only `tests/app/states.js` and docs).
- Gates: `npm run check`, `npm run check:built`, `app/states`,
  `app/print,app/contracts,app/typo,app/hues,stub`, `npm run e2e`. No
  `check:db` (nothing under `supabase/` or `tests/db/`).

## Next batch (implement-ready)
- Name: none - `B6.2` is R6's terminal batch.
- Objective: the orchestrator runs P12 (`node tests/app/golden.js --update
  --shard=n/4`, n = 1..4, then `git status --short tests/app/snapshots/` must list
  exactly the 26 re-seeded and 6 new ids) and `node tests/app/sweep.js 360`,
  amends the goldens, then the `B6.2` review; then closeout (`/handoff`).
- In scope: the goldens, the review, the closeout audit.
- Out of scope: new behaviour.
- Files expected: `tests/app/snapshots/*`, `issues/persist-6-import-export/reviews/B6.2.md`.
- Steps: plan section 9 step 14 and "Verification" (orchestrator).
- Acceptance criteria: P12's list holds; `sweep.js 360` green; the review approves.
- Verification commands: as above.
- Risks / do-nots: a changed golden outside the list resumes the implementer
  with that id (section 9 "Fallback"); do not push before closeout.
- Fallback (optional): section 9 "Fallback".

## Blockers
- None.

## Deferred
- `B6.1-N7` (`const before` shadows `node:test`'s `before` in
  `tests/db/import-lists.test.mjs`): rides with R7's `B7.3`, which edits
  that file and runs `check:db` (plan section 9, P14).
- `B6.1-N6` (the `or` chain in `import_lists`): only with another edit of
  that migration.
- Review nit `plan-B6.1-23` (deferred-scope): `tests/contracts.js`' zip walk
  uses `zlib.crc32` (Node 22.2 or later) while `package.json` `engines` says
  `>=22`; `.nvmrc` pins 24, so CI holds. Raise `engines` in a tooling change,
  or name it at closeout.
- Bundle v2 with homebrew entries (R7); pictures in the data zip (R8).
- A JSON-Schema runtime validator: not unless the hand-written one drifts twice.
- Selection of browser lists (they end at the cutoff).
- After a batch delete the focus falls to the page (the pressed «Удалить (N)»
  is gone); no mock or rule names a target. Name it at closeout.

## Notes
- Mocks path: `issues/persist-6-import-export/mocks/index.html`.
- Screenshot findings: `m05`, `m09` and `m11` draw `example.json` as gm1 with no
  name note; the rule notes it (deviation 1).
- Cleanup performed / retained artifacts: the edit scripts lived in the session
  scratchpad (`b62/`), not committed. `dist/` is configured for the test project
  after `npm run e2e`.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section):
  `docs/specs/FEATURES.md` "Lists", "Account and browser lists" (the index,
  "Exports", "Import"), "Account"; `META.md` sections 3 and 4; `STATE.md` "The
  in-memory state object"; `COVERAGE.md` (the driver's verbs, F12-F13,
  `app/states` 58-62, the golden count, the unit rows, the feature row);
  `docs/decisions/2026-09-28-account-lists-are-selected-on-the-index-and-deleted-together.md`
  and `docs/DECISIONS.md`; `README.md`, `README.ru.md`, `PRODUCT.md`.
