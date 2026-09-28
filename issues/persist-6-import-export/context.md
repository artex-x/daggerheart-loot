# Shared task context - TASK persist-6-import-export

## Goal
Release R6: JSON export (all lists, selected, one list) and create-only
import of a versioned bundle (`import-v1`) for signed-in users, published
as a JSON Schema and described in `llms.txt` so that an AI assistant can
write a file for a GM. Batches `B6.1` (contract, `llms.txt`, pure module,
port, RPC) and `B6.2` (UI) - `plan.md` section 7.

Planned ahead (pass 1, 2026-09-25/26); refreshed (pass 2, 2026-09-27)
against `1cbca5f7` (R3's `B3.1` and R3's refreshed plan). Slot: after R4,
before R7.

## Sources (read, do not re-fetch)
- Roadmap `issues/persistent-storage/plan.md`: sections 3, 5, 9, 12, 14
  (R6), section 10 (after the cutoff there is no local JSON export; the
  bundle is for signed-in users), section 16 (decisions 3, 14, 31), 17
  (the carried items: "R6's `import` is its own RPC beside `apply`, and
  `CloudLists.import` then `load()` calls `flushNow()` first"; each schema
  batch pushes to the test project and runs `npm run e2e` after the
  approving review).
- R3's plan `issues/persist-3-realtime/plan.md` sections 5.3, 5.4, 6.1,
  6.3 and 11 (`B3.2`'s shape: `CloudPort.events`, the tab header on
  PostgREST requests, the 20 s write timeout, the fake's sends, contract
  case J, states 52-53, flow F11).
- R4's plan `issues/persist-4-requests/plan.md` sections 6.1, 6.4, 11 and
  12 (`CloudPort.requests`, the fake's requests and events, a requests
  contract case, `RequestsPanel` on the list page, a new migration; R4
  leaves to R6 whether the bundle states that requests are not in it).
- R7's plan `issues/persist-7-homebrew/plan.md` section 4.8 (bundle v2
  calls `import_lists` from `import_bundle`, keeps its signature).
- `llms.txt`, `docs/specs/CONTRACTS.md`, `data.json`, `catalog.csv`.

## Key paths (checked at `1cbca5f7`)
- Specs: `docs/specs/CONTRACTS.md` section 4 (the published files),
  `FEATURES.md` "Lists" / "Account and browser lists" and "Account",
  `META.md` section 3, `COVERAGE.md` "Test layers" and "The unit suite",
  `I18N.md` "Rules".
- Pure: `app/src/lib/cloudLists.ts` (`NAME_MAX`, `NOTE_MAX`, module-local
  `PRICE_MAX`, `clip`, `EntryRow`, `ListRow`, `NewListRow`, `ListOp`,
  `entryRowsOf`, `quantityOf`, `priceOf`, `toCloudList`, `limitText`),
  `lib/listLink.ts` (`QTY_MAX` 99), `lib/money.ts` (`MONEY_MODES`,
  `MONEY_DEFAULT`), `lib/data.ts` (`Index.byId`).
- Ports: `app/src/ports/types.ts` (`ListRepository`: `newId`, `list`,
  `apply`, `move`; `ListWrite`), `supabase.ts` (`written`, `writeOf`,
  `refusalOf`, `keepaliveFetch`, `LIST_SELECT`), `lazy-cloud.ts`,
  `fake-cloud.ts` (`createList`, `insertEntries`, `limited`, `own`,
  `offline`, `maxLists`, `maxEntries`), `fake-cloud-seed.ts` (`gm1`:
  «Лавка кузнеца» `uuid(101)` 9 entries coin, «Пустой список» `uuid(102)`,
  «Трофеи» `uuid(103)`; `gm2` one list), `cloud.contract.ts` (cases A-I;
  `listCases`, `moveCases` with `MOVE_MS` 6000), `ports/image.ts`
  (`download`, `fakeImage().downloaded`).
- State: `app/src/state/cloudLists.svelte.ts` (`load`, `flushNow`,
  `#pull`, `#epoch`), `app.svelte.ts` (`cloudLists`, `env`, `say`, `t`,
  `lang`, `index`).
- UI: `components/ListsPage.svelte` (the account group under
  `Field label={t.groupAccount} heading`), `ListPage.svelte` (`Actions`
  row: «Поделиться» for an account list, «Скопировать текст», «Печать»,
  «Удалить»), `AccountPage.svelte` (signed in: Display, Signed in as,
  Providers, Sign out, Delete), `lib/help.ts` (`LISTS`).
- Database: `supabase/migrations/20260925130600_list_writes.sql`
  (`apply_list_writes`, `security invoker`, the `create` branch R6's RPC
  copies), `20260927120000_realtime.sql` (the deferred `lists_broadcast`
  trigger: one owner message per list per transaction), newest migration
  `20260927120000_realtime.sql` (R4 adds one after it).
- Layer 3: `tests/db/roles.mjs` (`asRole`, `commitAs`, `connect`),
  `tests/db/list-writes.test.mjs`, `tests/db/realtime.test.mjs`
  (`rowsOf`), `tests/db/harness.test.mjs` (`EXPECTED_ANON_FUNCTIONS`).
- Layer 2 and 4: `tests/app/driver.js` (`prepare`, `window.__clip`),
  `inventory.js`, `states.js`; `tests/e2e/flows.mjs`, `contract.mjs`.
- Published surface: `tests/contracts.js` (fs-only), `tests/derived.js`
  (pins `llms.txt` facts), `.github/workflows/ci.yml` "Collect what the
  site is made of" and "Nothing private slipped in", `tools/check-site.lib.mjs`
  (the `status200` probes), `app/index.html` `<noscript>`.
- `docs/fixtures/` is in `.prettierignore`: a fixture keeps the exact
  bytes the test compares.
- Mocks: `mocks/index.html` (m01-m14 and m16-m18 one screen state each,
  desktop and 360 px side by side; m15 the `llms.txt` section and edits
  as plain text).
- Selection patterns: `components/SelBar.svelte` (record selection,
  sticky at the window's bottom; R4 extends it) and `ListPage.svelte`'s
  `.batch` strip (rows of one page; R6 extracts it as `BatchBar`).
- The count badge: `ListCard.svelte` `<Badge cls="num">`, the variant
  `RecordCard.svelte` uses for a roll number.

## Command costs (this host, `.claude/README.md`, "Batch size and the fixed cost of a run", re-measured 2026-09-26/27)

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | 400-600 s | yes, or past the cap and armed by its own exit (`rtk npm run check`, timeout 600000) |
| `npm run check:built` | 23 s + the two builds | yes |
| `npm run check:db` | 545 s with Realtime, Auth and Kong | yes, near the cap (PowerShell tool) |
| `node tests/run-all.js app/states` | 250-300 s | yes |
| `node tests/run-all.js app/contracts` | 364 s | yes, alone |
| `node tests/app/golden.js --shard=n/4` | 186-201 s per shard | one shard per call |
| `node tests/app/sweep.js 360` | 430 s | one width per call |
| `npm run e2e` | 104-117 s (A-I, F0-F10), more after R3 and R4 | yes |

## Settled in planning pass 1 (2026-09-26)
- The format (`plan.md` 4.1), the schema as a public contract (4.2),
  client validation and the messages (4.4), new ids and one transaction
  (4.5), the three export surfaces and the import panel (4.6), the
  harness additions (4.7), the seams (4.8), the `llms.txt` section (4.9).
- Three decision files of 2026-09-26 in `docs/decisions/`.
- Owner questions Q1-Q4 answered as recommended (2026-09-26, `plan.md`
  section 11).

## Owner input after planning pass 1
- 2026-09-27, owner: "when implementing import and export we need to pay
  additional attention to modifying llms.txt to unblock AI users". The
  refresh treats the `llms.txt` section (4.9) as a first-class
  deliverable: an AI assistant that reads only `llms.txt` can produce a
  valid import file and read an export without other sources. The
  planner decides how to prove that (for example a fixture built from
  `llms.txt` alone that the import accepts).

## Owner input after the mocks (2026-09-27, verbatim)
1. "instead of selecting what to export in a separate view should we make
   selection of lists directly on that view? I think it would be also
   useful for batch deletion, we can also add in that ticket"
2. "can we also change the counter of list count? now it looks like roll
   indicator which is confusing"
3. "for import, should we link schema somehow? maybe even github link
   would work"
4. "how duplicates are considered in import? now we allow imports with
   same names, so maybe we should do the same"
5. "and for skips maybe we should be more clear what and in which list
   were skipped, maybe richer view of errors in that list"
6. "for downloading from account view, should we make it more abstract
   given we plan to add export of homebrew items later as well?" and "and
   it will be downloaded as zip file maybe"
7. "for llms section, should we delete old guidelines on how to create
   urls with items? I think it should be deprecated approach and llms
   should know only about new one"

Applied in planning pass 3: `plan.md` 4.6 and 4.10 (1), 4.11 (2), 4.12
(3), 4.13 (4), 4.4 and 4.13 (5), 4.14 and question Q5 (6), 4.9 (7).

## Mocks approved
- 2026-09-27, owner: "I approve r6 mocks" - the pass 3 set in `mocks/`
  (m01-m18, zip version, commit `35452a16`).

## Settled in planning pass 3 (2026-09-27)
- Selection on the index with `BatchBar` (extracted from the list page's
  `.batch`); batch deletion through the write buffer, one confirm, no
  undo; the count moves to the card's meta line; «Импорт из файла» sits
  in «Новый список»; the hint links the site's `schema/import-v1.json`
  and `llms.txt` (the repository is public, checked 2026-09-27, but the
  site's own files are the contract); duplicate names allowed; the report
  grouped by list; `llms.txt` without `#/l/` guidance.
- Q5 answered by the owner, 2026-09-27: "B - the account's «Скачать мои
  данные» downloads a zip (holding `lists.json` now, `homebrew.json` in
  R7, pictures in R8)". Applied (`plan.md` 4.14): a hand-written
  store-only writer and reader in `lib/zip.ts`, loaded by dynamic
  `import()`; import reads the zip and plain JSON; the `#/lists` exports
  stay plain JSON; `format` stays `daggerheart-loot/lists`; the zip layout
  is pinned by `docs/fixtures/import/data.zip`.

## Settled in planning pass 2 (2026-09-27)
- `llms.txt` is proven three ways (plan 4.9): the worked example is the
  fixture and imports clean; every schema key, value and bound is named
  in the section (`tests/contracts.js`); a blind round - a fresh agent
  with only `llms.txt` and `catalog.csv` writes `from-llms.json`, which
  must import clean, and reads `export.json` back correctly.
- `import_lists` is `security invoker` (the `apply_list_writes` pattern),
  not `security definer`; decision file 2 amended.
- The panel builds the import rows once per chosen file, so a retry after
  `network` resends the same ids.

## Constraints
- Public contracts default to no change; the one addition (`schema/
  import-v1.json`, `llms.txt`) ships with `CONTRACTS.md`, `docs/fixtures/
  import/` and `tests/contracts.js` in `B6.1`'s commit.
- `B6.1` starts after R4 closes; a delta check against `B3.2` and R4 as
  shipped runs first (`plan.md` section 8, "Delta check").
- Do not run the local Supabase stack, the test project or production in
  a planning pass.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need

## Owner answer to Q6 (2026-09-27, review item `plan-B6.1-2`)
- Keep the frozen bounds equal to the default limits (50 lists, 100
  entries); name the case in FEATURES and the export hint; the import
  report names the list and the bound. Trade-off accepted: a moved list
  over 100 entries cannot move between accounts by file. Applied in
  `plan.md` 4.15 and section 11.

## Delta check D1-D9 (2026-09-28, orchestrator, on `main` at `b0373a39` = R4 built, before its push)
The plan's `git rebase --onto` step is moot: the R6 plan is on `main`
(`287ba73b`). Every line holds; D2 as reworded in `reviews/plan-B6.1-2.md`.
- D1: `ListRow.revision: number` (`lib/cloudLists.ts`); `LIST_SELECT`
  reads `revision`; the fake's rows carry it.
- D2: `timed(call)` in `ports/supabase.ts` wraps every write RPC and reads
  `WRITE_TIMEOUT_MS = 20_000`; it has no bound parameter yet - step 4
  adds the optional one.
- D3: `keepaliveFetch(url, tab)` sets `x-dhloot-tab` on every `rest/v1/`
  request, `rpc/` included.
- D4: the fake's named helper is `announce(was, by)`; it sends one `list`
  message per changed list on `owner:<uid>` and a `revision` message per
  share.
- D5, D9: contract letters J (events) and K (R4's requests; E runs last);
  `states.js` ends at case 57 (`notify always`; R4 added 54-57); the last
  flow is F12 (R4). R6's next: contract case L, states 58+, flow F13.
- D6: `CloudLists.#pull` still drops a read that overlapped a write
  (`#edits`, queue, flushing) and re-reads when idle.
- D7: R4's migration is `20260928120000_purchase_requests.sql`;
  `import_lists`' `<ts>` must sort after it.
- D8: `CloudPort.requests: RequestRepository` and the fake's
  `requests` member exist; `ListRepository` has no `import`, so no
  conflict.
- D9: `RequestsPanel` sits under the list page's `Actions` row, after
  `SharePanel`; R4 left the `.batch` strip of `ListPage.svelte` as it
  was. For the `B6.2` refresh (Risk 8): R4 changed `SelBar.svelte` (about
  100 lines; read R4's pushed commit for `app/src/components/SelBar.svelte`) and `ListCard.svelte` (a `requests`
  prop, a `.listcard-req` line under the edit time, and the aria label).

## Settled in planning pass 5 (2026-09-28)
- `plan.md` section 9 P1-P21 make `B6.2` implement-ready. No QA file is
  used by a test (P13). `B6.1-N7` rides with R7's `B7.3` (P14). `m06`
  draws the "name already in the account" note under list 1 only; the
  rule and `m06`'s caption put it under list 2 too, so the golden shows
  both (P15, a drawing slip, not a design change).
- Measured 2026-09-28: jsdom 30.0.1 has `File.arrayBuffer` and `text`; a
  page reload re-seeds the test build's fake.
- `B6.1` is `c984aa9e`: the migration on the test project, `npm run e2e`
  green, case L 2504 ms and 2446 ms (5 461 091 bytes).

## Owner request: QA import files (2026-09-27, through the orchestrator)
- Delivered 2026-09-28 (after `B6.1`'s approve), outside the repository:
  the session scratchpad `qa-import/` and `qa-import-files.zip`. Every
  file checked with `parseBundle`: `happy-30` ok (30 lists, 211 entries),
  `fill-to-50` ok (17, 39), `unknown-item` ok with one skip (an unknown
  id is a skip, not an error), `mixed` refused with 5 errors in lists 3,
  5 and 6 (a refused file reports only errors, so its skips are not
  shown), the other error files one refusal each. `bag` lists carry no
  `money_mode` key, as the export writes them. The README's Russian UI
  texts come from plan 4.4, marked "planned"; after `B6.2` ships, the
  orchestrator checks them against `dict.ts` and re-sends the set if they
  differ.
- The orchestrator generates a QA set from the schema and `lib/bundle.ts`
  that `B6.1` ships, after `B6.1`'s review approves. Each file is checked
  against that parser. The set is kept outside the repository.
- The set holds 12 files. The owner's account holds 3 lists.
  - Two valid files, imported in order: `happy-30.json` (30 lists; search
    at 8, «Показать ещё» after 24) and `fill-to-50.json` (17 lists; the
    account reaches the cap of 50).
  - Nine error files, one defect each: not JSON, wrong `format`, wrong
    version, 101 entries, 51 lists, an unknown item, a malformed entry,
    a mixed file (skips and errors in different lists), and one valid
    list refused at the cap.
  - A README with the expected result of each file.
- Owner, verbatim in part: "you can use it for tests if you need, maybe
  be useful to use to set up some data". A test may take a file from the
  set as a fixture or as seed data only where it needs one. The planner
  decides that in the `B6.2` refresh or a later plan. A file that a test
  uses moves into the repository with that test. No file enters the
  repository before a test uses it (`CLAUDE.md`, campsite).
