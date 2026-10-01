# Shared task context - TASK persist-10-legacy-removal

Orchestrator (or first worker) maintains this file so later steps do not re-fetch the same sources.

## Goal
- Release R10 of the persistence programme: after `LEGACY_WRITE_UNTIL`
  (2026-10-26, 00:00 UTC) remove browser lists and all move support, and
  retire the `#/l/` list link (an old `#/l/` link draws the not-found page,
  the address kept). The browser's data is never deleted.
- Planned 2026-10-01 at the owner's request, ahead of `debt-cleanup` and
  `persist-review`. R10 is the first release dispatched after 2026-10-26;
  nothing of it is implemented before that date.

## GitHub issue (if any)
- URL: none (local task id).
- Captured or last verified: 2026-10-01, HEAD `930dc986` (R7b, unpushed).
- Title: -
- Summary (facts only): the programme roadmap
  `issues/persistent-storage/plan.md` section 9 (the R10 row) and section 10
  (list (c)) name the scope; the owner decision is
  `docs/decisions/2026-09-27-r10-removes-browser-lists-and-the-move.md`.
- Decisions already settled:
  - Owner, 2026-09-27: R10 removes the codec, the `#/l/` list and retired
    pages, `ListStore`'s browser lists, `LegacyMove`, `MoveNotice`,
    `MoveStatus`, `StorageNotice` and the move's RPC path. From R10 an old
    `#/l/` link draws the not-found page, the address kept. The browser's
    data is not deleted. `#/print/<id>*<n>` keeps its spelling.
  - Owner, 2026-10-01: `DEBT.md` D64 and D66 are not in R10. A new release
    `debt-cleanup` between R9 and `persist-review` takes every `DEBT.md`
    entry still open then. R10 removes only what it deletes anyway:
    `MoveNotice`'s half of D64, D24, D63, and D62 through the migration.
  - `STATE.md`: `dhloot.lists.v1` is never deleted; R10 deletes no key.
- Open questions: plan.md, "Owner questions" (Q1, the migration scope).

## Screenshot / attachment findings
- None. R10 adds no UI: it removes controls and draws the existing
  not-found page (`App.svelte`'s last branch: «Предмет не найден»,
  «Возможно, ссылка устарела или данные были изменены.», «На главную»).

## Key paths
- Specs: `docs/specs/CONTRACTS.md` (section 1, section 3), `ROUTES.md`
  ("Sections", "Records, lists and print"), `STATE.md` (keys table, "Two
  tabs", memory table), `FEATURES.md` ("Lists", "Account and browser
  lists", "Chrome"), `META.md` section 3, `COVERAGE.md` (about 46 lines;
  `git grep -n -E "#/l/|legacy|today|browser list|move_legacy|fixtures/lists" -- docs/specs/COVERAGE.md`),
  `I18N.md` (the cutoff date bullet), `DEBT.md` ("Legacy removal", D64),
  `llms.txt` (rule 4, the `#/l/<payload>` address), `README.md` and
  `README.ru.md` ("Lists", "What the app remembers").
- Code hot paths (HEAD `930dc986`):
  - the codec: `app/src/lib/listLink.ts` (+ `listLink.test.ts`), the
    compress port `app/src/ports/compress.ts` (`Env.compress`,
    `CompressPort`), `hash.ts` (`sharedList` route kind, `PACK_MARK`,
    `sharedListHash`), `AppState` (`#expand`, `expandFailed`,
    `syncListUrl`, `openNewList`, `#claimList`, `openList`, `urlPayload`,
    `saveCopyOf`, `followMoved`'s `#/l/` branch, `#runPending`'s `#/l/`
    branch);
  - browser lists: `app/src/state/lists.svelte.ts` (`ListStore`,
    `ListModel`, `Migrated`), `app/src/lib/lists.ts` (`keepLists`,
    `liftNotes`, `LegacyList`, `mergeLists`, `findListByPayload`,
    `copyInit`), `app/src/lib/legacy.ts`;
  - the move: `app/src/state/legacyMove.svelte.ts`,
    `MoveNotice.svelte`, `MoveStatus.svelte`, `StorageNotice.svelte`,
    `ListRepository.move` in `ports/types.ts`, `ports/supabase.ts`,
    `ports/fake-cloud.ts`, contract case I in `ports/cloud.contract.ts`,
    e2e F9 in `tests/e2e/flows.mjs`;
  - gates on the date: `AppState.legacyWritable`, `localWritable`,
    `moveDue`, `TabBar`'s `lists` prop, `ports/clock.ts` (`queryClock`'s
    `?today=`), `main.ts`;
  - the database: `supabase/migrations/20260925130400_legacy_move.sql`,
    `20260925130500_legacy_move_conflict.sql` (the function),
    `20260930121000_list_entries_statement_triggers.sql` (the current
    `list_entries_limit`, with the `dhloot.move` guard),
    `20260925130400_legacy_move.sql` (the current `lists_limit`, with the
    guard), `tests/db/legacy-move.test.mjs`.
  - the harness: `tests/app/states.js` (cases 7, 8, 13, 17, 18, 20, 22,
    25-27, 30, 32-34, 38, 47, 48, 51, 62 seed browser lists or open `#/l/`),
    `tests/app/inventory.js` (about 40 states), `tests/app/contracts.js`
    (the link half), `tests/app/sweep.js` (`#/l/%%SHARED%%`, `#/l/zzzz`),
    `tests/app/driver.js` (`today`, `moveSettled`, `addressSettled`),
    `tests/app/golden.js` (`# today:`), `tests/app/golden.test.mjs` (dated
    states), `tests/contracts.js` (the list-encoding half, the date check),
    `tests/derived.js` ("legacy write cutoff" check).
- Mocks: none needed (no new UI).

## Command costs

What each check costs in wall clock, and whether it fits one foreground call
(the Bash tool caps at 600s). Fill this in once per task; every worker
otherwise rediscovers it. Never let two heavy runs overlap.

Figures from `.claude/README.md`, "Batch size and the fixed cost of a run"
(2026-09-26/27, this host). Re-measure at the first batch.

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | 396-404 s idle, up to 593 s loaded | yes, near the cap; gate credit covers a run past it |
| `npm run check:built` | ~25 s (plus the configured build for the budget) | yes |
| `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub` | ~430 s pooled | yes |
| `node tests/app/sweep.js <width>` | 328-532 s per width | yes, one width per call |
| `node tests/app/golden.js --shard=n/4` | 186-201 s per shard | yes, one shard per call |
| `npm run check:db` (PowerShell tool) | 432-545 s | yes, near the cap |
| `npm run e2e` | 104-117 s | yes |

## Which machine is authoritative
- For recorded numbers (visual debt, timings): this Windows host.
- What a difference on another machine means: load, not a regression
  (`.claude/README.md`, "This host silently downclocks under load").

## Reasons already disproved

- None yet.

## Constraints
- Contracts / parity / i18n notes:
  - `#/l/` stays a recognised address: it draws the not-found page and
    never falls home (the address kept). `#/print/<id>*<n>` keeps its
    spelling.
  - No storage key is deleted or written by R10: `dhloot.lists.v1`,
    `dhloot.lists.v2`, `dhloot.lists.v2.bad`, `dhloot.migrated.v1` and
    `dhloot.warn.v1` stay in the browser, unread.
  - `docs/fixtures/import/` and `schema/import-v1.json` do not change.
  - Russian product text only for removed controls; the help paragraph that
    replaces the move sentence is given verbatim in plan.md (B10.3).
  - Do not touch `issues/persist-7b-homebrew-catalog/` (R7b closeout runs in
    parallel) or `.claude/hooks/selftest.mjs` (its
    `docs/fixtures/lists/x.json` is a synthetic path that still exercises
    the `docs/fixtures/` prefix).

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
