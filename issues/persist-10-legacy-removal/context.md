# Shared task context - TASK persist-10-legacy-removal

Orchestrator (or first worker) maintains this file so later steps do not re-fetch the same sources.

## Goal
- Release R10 of the persistence programme: after `LEGACY_WRITE_UNTIL`
  (2026-10-26, 00:00 UTC) remove browser lists and all move support, and
  retire the `#/l/` list link (an old `#/l/` link draws the not-found page,
  the address kept). The browser's data is never deleted. Also the two
  carries below (P6, P36).
- Planned 2026-10-01 at the owner's request; refreshed 2026-10-23 at
  `0b73fd5c`. Nothing of it is implemented before 2026-10-26.

## GitHub issue (if any)
- URL: none (local task id).
- Captured or last verified: 2026-10-23, `origin/main` `0b73fd5c`
  (persist-review shipped).
- Title: -
- Summary (facts only): the owner decision is
  `docs/decisions/2026-09-27-r10-removes-browser-lists-and-the-move.md`;
  `docs/specs/DEBT.md`, "Legacy removal", lists the defects R10 owes.
- Decisions already settled:
  - Owner, 2026-09-27: R10 removes the codec, the `#/l/` list and retired
    pages, `ListStore`'s browser lists, `LegacyMove`, `MoveNotice`,
    `MoveStatus`, `StorageNotice` and the move's RPC path. From R10 an old
    `#/l/` link draws the not-found page, the address kept. The browser's
    data is not deleted.
  - Owner, 2026-10-01: D64's «Выйти» half and D66 are `debt-cleanup`'s
    (shipped; D64 now names only `MoveNotice`). R10 removes D24, D63, D64,
    and D62 through the migration.
  - `STATE.md`: `dhloot.lists.v1` is never deleted; R10 deletes no key.
  - Owner, 2026-10-01, Q1 B: the migration drops `move_legacy_list`, the
    `dhloot.move` guard in both limit triggers, `lists.legacy_fingerprint`
    and its index; a tab still on an old build fails its list reads until
    it reloads (accepted).
  - Owner, 2026-10-22: carries P6 and P36 of the persistence review belong
    to R10.
  - Planner, 2026-10-23 (the carry leaves it to the planner): P6 is a
    PostgREST head read with entry identities and a per-list detail read,
    not an RPC (plan.md section 4).
  - `print-snapshots` (2026-10-08 decision, shipped 2026-10-14): every
    `#/print/...` address draws the retired print page (`printRetired`);
    nothing of R10 keeps a print spelling.
- Open questions: none.

## Screenshot / attachment findings
- None. R10 adds no UI: it removes controls and draws the existing
  not-found page (`App.svelte`'s last branch: «Предмет не найден»,
  `notFoundSub`, «На главную»).

## Key paths
- Specs: `docs/specs/CONTRACTS.md` (sections 1, 3, 4 "Formatted text"),
  `ROUTES.md` ("Records, lists and print"), `STATE.md` (keys table, "Two
  tabs", "The list migration", the memory table), `FEATURES.md` ("Lists",
  "Account and browser lists", "Chrome", "Consistency rules" rule 4),
  `META.md` section 3, `COVERAGE.md`, `I18N.md` (the cutoff bullet),
  `DEBT.md` ("Legacy removal": D115, D64, D62, D63, D24), `llms.txt`,
  `README.md`, `README.ru.md`.
- Code hot paths (`0b73fd5c`):
  - the codec: `app/src/lib/listLink.ts` (12 production importers), the
    compress port `app/src/ports/compress.ts`, `hash.ts` (`sharedList`,
    `PACK_MARK`, `sharedListHash`), `AppState` (`#expand`, `expandFailed`,
    `syncListUrl`, `openNewList`, `#claimList`, `openList`, `urlPayload`,
    `clearOpenList`, `saveCopyOf`, `followMoved`, `#runPending`,
    `pageRecordFor`);
  - browser lists: `app/src/state/lists.svelte.ts` (`ListStore`,
    `ListModel`), `app/src/lib/lists.ts` (`keepLists`, `liftNotes`,
    `LegacyList`, `mergeLists`, `findListByPayload`, `copyInit`),
    `app/src/lib/legacy.ts`;
  - the move: `app/src/state/legacyMove.svelte.ts`, `MoveNotice.svelte`,
    `MoveStatus.svelte`, `StorageNotice.svelte`, `ListRepository.move`
    (`ports/types.ts`, `supabase.ts`, `fake-cloud.ts`), `moveCases` (case
    I) in `ports/cloud.contract.ts`, F9 in `tests/e2e/flows.mjs`,
    `tests/e2e/admin.mjs`'s select;
  - gates on the date: `AppState.legacyWritable`, `localWritable`,
    `moveDue`, `TabBar`'s `lists` prop, `sectionLabel(s, t,
    legacyWritable)` in `lib/dict.ts` (`Shell.svelte`, `AccountPage.svelte`),
    `ports/clock.ts` (`queryClock`'s `?today=`), `main.ts`;
  - the first read (P6): `LIST_SELECT`, `lists.list`, `CHANGED_ROWS_MAX` in
    `ports/supabase.ts`; `#pull`, `#read`, `#apply` in
    `state/cloudLists.svelte.ts`; `CloudList`, `ListRow`, `toCloudList` in
    `lib/cloudLists.ts`; consumers of every list's entries: `AddToList`,
    `ListsPage` (thumbs, counts), `QuickItem`, `AppState.listsHolding`,
    `AppState.relinkTargets`,
    `#homebrewReady`, `exportLists`, `exportData`, `CloudLists#linkedIds`;
    consumers of one list's `meta`: `ListPage`, `SharePanel`,
    `RequestsPanel`, `lib/share.ts`, `lib/bundle.ts`, `AddToList`'s remove
    with undo;
  - the database: `supabase/migrations/20260925130400_legacy_move.sql` (the
    current `lists_limit`, the index), `20260925130500_legacy_move_conflict.sql`
    (the current function), `20260930121000_list_entries_statement_triggers.sql`
    (the current `list_entries_limit`); `tests/db/legacy-move.test.mjs`,
    `tests/db/delete-account.test.mjs` (selects the column; its 3x seed);
    `tools/supabase/usage.mjs` (the comment).
  - the harness: `tests/app/states.js` (browser lists or `#/l/` in cases 7,
    8, 13, 17, 18, 20, 22, 25-27, 30, 32-34, 38, 47, 48, 51, 62, 64, 76,
    77), `tests/app/inventory.js` (`#/l/` states, `two`/`twelve`/`seven`
    storage, two dated states), `tests/app/contracts.js`,
    `tests/app/sweep.js` (`STORAGE`, two `#/l/` rows, «печать без входа:
    список»), `tests/app/typo.js` (`STORAGE`), `tests/app/print.js` (two
    browser-list seeds), `tests/app/driver.js` (`today`, `moveSettled`,
    `addressSettled`), `tests/app/golden.js` (`# today:`),
    `tests/app/golden.test.mjs` (dated states), `tests/contracts.js`,
    `tests/derived.js`.
  - unit fixtures on browser lists: `listPage.test.ts`,
    `listsPage.test.ts`, `components/lists.test.ts`, `a11y.test.ts`,
    `record.test.ts`, `tables.test.ts`, `shell.test.ts`,
    `state/app.test.ts`, `state/cloudLists.test.ts`; on `#/l/` payloads:
    `sharedListPage.test.ts` (most of its cases), `sharePanel.test.ts`,
    `shell.test.ts`, `a11y.test.ts`, `lib/lists.test.ts`.
- Mocks: none needed (no new UI).

## Command costs

What each check costs in wall clock, and whether it fits one foreground call
(the Bash tool caps at 600 s). Figures: `.claude/README.md`, "Batch size and
the fixed cost of a run" (this host, 2026-10-07 to 2026-10-22). Re-measure at
the first batch. Never let two heavy runs overlap.

| Command | Wall clock | Fits one call? |
|---|---|---|
| `rtk npm run check:fast` | 215-310 s; 474-710 s when `dict.ts`, `app.svelte.ts` or the component suites change | yes; past 600 s it arms by its own exit |
| a CI run (push to the last gate job) | 10.5-11.5 min | remote; the orchestrator's background `ci-credit.mjs` |
| `npm run check` | 10-18 min cold | no; the offline path only, in the main session |
| `npm run check:db` (PowerShell tool) | 532-811 s warm, about 15 min with the stack start | arms by its own exit |
| `npm run build:test` | about 1 min | yes |
| `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub` | 260-290 s pooled | yes |
| `node tests/run-all.js app/contracts,app/states` | 343-414 s plus 243-299 s (2026-09-27 figures) | yes |
| `node tests/app/sweep.js <width>` | 320-590 s per width | yes, one width per call |
| `node tests/app/golden.js --shard=n/4` | 100-290 s per shard | yes, one shard per call |

## Which machine is authoritative
- For recorded numbers (visual debt, timings): this Windows host.
- What a difference on another machine means: load, not a regression
  (`.claude/README.md`, "This host silently downclocks under load").

## Reasons already disproved

- None yet.

## Constraints
- Contracts / parity / i18n notes:
  - `#/l/` stays a recognised address (`listRetired`): it draws the
    not-found page and never falls home (the address kept).
  - No storage key is deleted or written by R10: `dhloot.lists.v1`,
    `dhloot.lists.v2`, `dhloot.lists.v2.bad`, `dhloot.migrated.v1` and
    `dhloot.warn.v1` stay in the browser, unread.
  - `docs/fixtures/import/` and `schema/import-v1.json` do not change.
  - Russian product text only for removed controls; the help paragraph that
    replaces the move sentence is given verbatim in plan.md (`B10.3`).
  - Do not touch `.claude/hooks/selftest.mjs` (its
    `docs/fixtures/lists/x.json` is a synthetic path that still exercises
    the `docs/fixtures/` prefix).
  - The test project is shared by every branch's `e2e`: `B10.5`'s push
    drops the column there before `main` stops selecting it (plan.md
    section 13, "Order").

## Carries

Two items of the persistence review that the owner deferred to "persistent-cleanup", which
means R10 itself (owner, 2026-10-22). Each is its own acceptance line in the batch that the
planner gives it.

- P6 - placed in `B10.4` (plan.md section 12; the design is section 4, "P6").
  Every signed-in page load reads every entry of every list (`docs/specs/DEBT.md`,
  "Legacy removal", D115; the batch that fixes it deletes the entry).
  - Where: `app/src/ports/supabase.ts`, `lists.list` with `LIST_SELECT` (and
    `CHANGED_ROWS_MAX` = 50); `app/src/state/cloudLists.svelte.ts`, `#pull`; the fake's mirror
    in `app/src/ports/fake-cloud.ts`; the type `CloudList` in `app/src/lib/cloudLists.ts`.
  - Cause: a page load starts with an empty `#read`, so `#pull` calls `list()` with no
    `known`, and the select embeds `list_entries(...)` with both notes for every list. A
    re-read with more than 50 changed lists reads everything again. R7g made the re-read go by
    revision; the first read of each load did not change.
  - Measured 2026-10-22 on this Windows host, local stack seeded at three times the defaults
    (150 lists of 300 entries, a tenth of the entries with both notes at 4000 characters): the
    full read with entries 888 ms in SQL, 5019 ms and 81.7 MB over PostgREST, 8-9 s in the
    browser; every signed-in page state measured (15 states) made 37-60 requests, read
    82-217 MB and settled in 23-73 s; the heap reached 177 MB at 360 px. With short notes the
    same 45 000 entries are est. 11 MB. At the defaults (50 lists of 100 entries) the read is
    est. under 1 s.
  - What the reader sees at 3x: every page that waits for the account (`#/lists`, a list page,
    `#/homebrew`, search with own items) shows «Загружаем...» for 8 s or more on a fast local
    link, longer on a phone. The list page draws only after `cloud.status === 'ready'`.
  - Verify: the 3x seed in `tests/db/delete-account.test.mjs` ("delete_account() at three
    times every default limit"; 34-44 s through the triggers, `analyze` after it); the first
    read at 3x settles under the 4000 ms bar in the browser.
- P36 - placed in `B10.3` (plan.md section 11). Comments cite line numbers of the deleted
  `app.js` and `style.css` (a cleanup, not a defect; `CLAUDE.md`, "Comments").
  - Scope: the lines that `git grep -c -E "(app\.js|style\.css)[: ]+[0-9]" -- app/src`
    finds: 147 in 47 files on 2026-10-22 and on 2026-10-23 (14 of them in files R10 deletes:
    `StorageNotice.svelte`, `state/lists.svelte.ts`, `state/lists.test.ts`). Some hits may not
    be line citations.
  - The fix: replace each with `git show 23c00a6^:app.js` (or `style.css`) and the function or
    selector name, or delete the comment when the code says it. No behaviour changes; no
    golden moves.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
