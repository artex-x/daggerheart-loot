# Plan - TASK persist-10-legacy-removal

## Status

- Planning pass 1, 2026-10-01, planner, at `930dc986` (mode A). Pass 2 (the
  dispatch refresh of section 6), 2026-10-23, planner, at `0b73fd5c` on
  `claude/persist-10-legacy-removal` (mode B). The pass-1 text is in
  `git show 46cf7c04:issues/persist-10-legacy-removal/plan.md`.
- Dispatchable from 2026-10-26 (00:00 UTC, `LEGACY_WRITE_UNTIL`). Every
  release the pass-1 order put first has shipped (section 6).
- Batches: `B10.1` (implement-ready), `B10.2`, `B10.3`, `B10.4`, `B10.5`
  (outlines). None started.
- NEEDS_HUMAN_CONFIRMATION: yes, Q2 only (section 4): D115's changed
  verify criterion. It blocks `B10.4` alone; `B10.1`-`B10.3` do not depend
  on it. Q1 answered by the owner 2026-10-01 (B, section 4). The P6 fork is
  settled in this pass (section 4, "P6").
- Plan review: required before B10.1 (trigger: a public contract change - the `#/l/` route, `docs/fixtures/lists/`, `tests/contracts.js`, `CONTRACTS.md` and `llms.txt` in `B10.1`, `routes.json` in `B10.3`; a migration in `B10.5` that drops a SECURITY DEFINER function and a column with its stored values; a new sync protocol in `B10.4`)
- `B10.4` (the first read, a sync protocol change) gets its own
  `- Plan review: required before B10.4` line at its refresh, when its brief
  becomes implement-ready.
- Plan review findings applied: reviews/plan-B10.1.md
  - B1: sections 4 ("P6") and 12 ("State") - relink is out of the writes that need details; `relinkAs` runs on heads only; the writes that need details are `restoreEntry`'s callers.
  - B2: sections 13 ("Steps", "Standing checks", "Acceptance") and 14 - the app-only revert, the restore of an older backup and the null values are named; a `.claude/README.md` paragraph "To undo `<ts>_drop_legacy_move`" is a `B10.5` step.
  - R1: sections 4 and 12 - `SharedListPage`'s `hiddenN` reads details first; a unit case is an acceptance line.
  - R2: section 12 - five guards of the detail read, each an acceptance line with a fake and a contract case.
  - R3: section 12 - the add-to-list remove-with-undo gets a busy state as its own acceptance line, or the refresh names why it needs none.
  - R4: sections 4 and 12 - the bar is defined (build, stack, seed, host, width, start and end, median of three), the head JSON bound is 6 MB in `check:db`, the list page is measured, and requests and bytes per state are recorded before and after.
  - R5: sections 13 ("Order"), 14, 15 and handoff "Blockers" - the push check covers every branch's queued and running runs, a stall rule, and the open branches named at closeout.
  - R6: section 13 - both limit functions are copied whole with their SECURITY DEFINER header; a layer 3 assertion after the up and after the reversal.
  - R7: sections 4 ("Q2") and 12 - D115's changed criterion is an owner question (Q2, NEEDS_HUMAN_CONFIRMATION); the two sections no longer contradict each other.
  - N1: section 9, step 11 - the two filter-threshold cases join the port list.
  - N2: section 9, step 1 and "Files edited" - `git grep -n "#/l/" -- app/src` and `FilterBar.svelte`'s comment; `tools/check/lib.test.mjs` stays (risks).
  - N3: section 9, step 11 - `seedWith`'s argument type needs no new export.
  - N4: section 9, step 8 - the fixture of the `pageRecordFor` case is pinned.
  - N5: sections 8 and 9 and handoff - `node tests/app/sweep.js 360` joins `B10.1`'s gates; costs and the total follow.
  - N6: section 8 - `B10.2`'s criterion cell names the `B10.1` boundary; `B10.1`+`B10.2` joins the rejected merges.

## 1. Objective and current state

Objective: after the legacy write cutoff, remove the browser list model and
everything that served it, so the app has one list model (account lists)
and one link format (`#/s/<token>`); and make the account's first read cheap
at three times the default limits (carry P6, `DEBT.md` D115). Source of the
scope: the owner decision
`docs/decisions/2026-09-27-r10-removes-browser-lists-and-the-move.md`, the
Q1 answer (section 4), and the two carries (context.md, "Carries").

State at `0b73fd5c` (verified 2026-10-23; the inventory is section 6):

- The codec is `app/src/lib/listLink.ts`: encode, decode, base64url, the
  stamp, and the shared types `ListEntryMeta`, `ListShape`, `DecodedList`,
  `KnowsId`, `QTY_MAX` and a `MoneyMode` re-export (`lib/money.ts` owns
  `MoneyMode`). 12 production modules and 9 other test files import it. Packed
  links use `Env.compress` (`app/src/ports/compress.ts`).
- `hash.ts` parses `#/l/...` to `{ kind: 'sharedList', payload, packed }`
  and `#/print/...` to `{ kind: 'printRetired' }` (print-snapshots).
  `App.svelte` sends `storedList` and `sharedList` to `ListPage.svelte`; its
  last branch draws the not-found page («Предмет не найден»,
  `notFoundSub`, «На главную»).
- `ListStore` (`state/lists.svelte.ts`) holds browser lists and declares
  `ListModel`, which `CloudLists` implements. `LegacyMove` runs the move
  through `ListRepository.move` (`move_legacy_list`). `MoveNotice`,
  `MoveStatus` and `StorageNotice` draw its states.
- The date gates: `AppState.legacyWritable`, `localWritable`, `moveDue`,
  `TabBar`'s `lists` prop, and, new since pass 1, `sectionLabel(s, t,
  legacyWritable)` in `lib/dict.ts` (read by `Shell.svelte` and
  `AccountPage.svelte`'s home-section menu). The test build pins its clock
  at 2026-10-01 12:00 UTC (`TEST_NOW`); `?today=` moves it.
- The first signed-in read of every page load embeds every entry of every
  list with both notes (`LIST_SELECT` in `ports/supabase.ts`); D115 records
  8-9 s in the browser at three times the limits.
- The shared page's unit coverage is mostly on `#/l/` payloads
  (`sharedListPage.test.ts`: the heading, the notes, the tails, the
  selection, the taken count, the add-to-list carry, English, axe). Case 77
  of `tests/app/states.js` (new since pass 1) opens a `#/l/` link. The
  sweep's only shared-page rows are two `#/l/` rows. These move to `#/s/`
  in `B10.1`; they do not go.
- New browser-list fixtures since pass 1: `tests/app/print.js` (two seeds),
  `tests/app/typo.js` and `tests/app/sweep.js` (`STORAGE`),
  `components/record.test.ts`, `components/tables.test.ts`,
  `state/cloudLists.test.ts` (one case runs on both stores), states cases 64
  and 76. `tests/db/delete-account.test.mjs` reads `l.legacy_fingerprint`.
- A latent defect in a touched path: `AppState.pageRecordFor` reads
  `this.openList` for an account list's linked record, but only a browser
  list sets `openList` (`#claimList`), so the branch never runs on an
  account list's page. `B10.1` fixes it (step 8).

## 2. Scope and non-goals

In scope:

- The codec, its fixtures, the list-encoding half of `tests/contracts.js`,
  the link half of `tests/app/contracts.js`, `CONTRACTS.md` section 3 (one
  history paragraph stays), the `llms.txt` `#/l/` address, the `ROUTES.md`
  `#/l/` rows, the `#/l/` buttons and address rewriting, the packed-link
  expansion and `Env.compress`, the `#/l/` shared page and the retired
  page. `#/l/<anything>` draws the not-found page, the address kept, never
  home.
- `ListStore` and every browser list surface, `StorageNotice`, `MoveNotice`,
  `MoveStatus`, `LegacyMove`, `lib/legacy.ts`, the move's client path, the
  date gates, `?today=`, the Lists tab, the list print `prompt` state of a
  browser list.
- P6 (D115): the first read takes list heads with each entry's identity;
  an entry's details load when a caller needs them (section 4, "P6").
- P36: every line citation of the deleted `app.js` and `style.css` in
  `app/src`.
- The database (Q1 B): `move_legacy_list`, the `dhloot.move` guard in the
  two limit triggers, `lists.legacy_fingerprint` and its unique index.
- `DEBT.md`: D24, D63, D64 deleted (their code goes), D115 deleted by
  `B10.4`, D62 deleted by `B10.5`, the section "Legacy removal" deleted
  when it is empty.
- Every spec, README and help text that describes the removed behaviour.

Non-goals:

- No storage key is deleted or written: `dhloot.lists.v1`,
  `dhloot.lists.v2`, `dhloot.lists.v2.bad`, `dhloot.migrated.v1`,
  `dhloot.warn.v1` stay in the browser, unread (owner decision; `STATE.md`).
- No new UI, no new copy beyond the shortened help paragraph (`B10.3`).
- No change to `#/s/` behaviour, the import file, the data zip or the
  account page (but the home-section label, `B10.3`).
- `DEBT.md` sections other than "Legacy removal" (D104, D112-D114 belong to
  other tasks).

## 3. Settled decisions and their consequences

Settled by the owner (2026-09-27, 2026-10-01, 2026-10-22) or by the
repository; the implementer does not reopen them.

1. **`#/l/` is a recognised address that draws the not-found page.**
   `parseHash` returns `{ kind: 'listRetired' }` for every hash that starts
   with `l/` (plain, packed `l/~`, empty or broken payload). The name
   follows `printRetired`. No branch of `App.svelte` draws `listRetired`, so
   the last branch draws the existing not-found page; `#fallback` keeps the
   address because the kind is not `unknown`. The payload is never read.
   `unknown` sends the reader home, which the owner refused.
2. **The shared types leave the codec.** `ListEntryMeta`, `ListShape` and
   `QTY_MAX` move to `lib/lists.ts`; `DecodedList` moves to
   `lib/cloudLists.ts` beside `sharedListOf` and becomes `SharedList`;
   `KnowsId` is deleted; every `MoneyMode` import reads `lib/money.ts`.
3. **A build with no sign-in configured has no lists.** From `B10.3`:
   `#/lists` and `#/lists/<id>` draw the not-found page, the address kept
   (as `#/homebrew` does), and no add-to-list control is drawn. Production
   is always configured.
4. **An old `#/lists/<local id>` bookmark is not found.** The redirect of a
   moved list's local id reads `dhloot.migrated.v1`, which is move support.
   From `B10.3` such an address draws the list page's not-found state.
5. **`ListModel` is deleted.** `CloudLists` is the one implementation;
   `AppState.storeFor` goes.
6. **The test build keeps a fixed clock, without `?today=`.** `TEST_NOW`
   stays (export names, relative times); the day switch, the driver's
   `today`, `golden.js`'s `# today:` and `golden.test.mjs`'s dated-states
   block go (`B10.3`).
7. **The capture signal `data-move` becomes `data-lists`** (`B10.3`):
   `pending` while the session is unknown, the account lists' status
   signed in, absent signed out or with no sign-in. The driver verb
   `moveSettled` becomes `settled`; e2e's `settled(page, ...)` reads the
   same attribute.
8. **The heading "Account and browser lists" stays in `FEATURES.md`.** Many
   files cite it, applied migrations among them (locked). Its first
   paragraph says that browser lists left the app at R10.
9. **Nine tabs in every build.** `TabBar` loses its `lists` prop;
   `sectionLabel` loses its `legacyWritable` parameter and names `lists`
   «Мои списки» (`menuLists`) in every build; `routes.json`'s `#/lists` row
   gets `"tab": null`.
10. **Decision files are written by the batches that establish them**
    (`B10.3`, `B10.4`, `B10.5`; section 4 and each outline give the text).
    Each runs `node tools/decisions.js`.
11. **The shared page's coverage moves from `#/l/` to `#/s/`, never
    deleted** (`B10.1`). A case whose subject is shared-page behaviour runs
    on a fake-cloud share link seeded by `app/src/test/seed.ts`'s
    `seedWith`; a case whose subject is the codec, a `#/l/` address, a link
    button, the address rewrite, a packed link or a browser-list save goes.

## 4. Owner questions and design forks

**Q1 - answered 2026-10-01 (owner): B.** `B10.5`'s migration drops
`move_legacy_list`, the `dhloot.move` guard in `lists_limit` and
`list_entries_limit`, the column `lists.legacy_fingerprint` and its unique
index `lists_legacy_fingerprint`. The owner accepts that a tab still on a
pre-R10 build fails its account list reads until it reloads. Rejected: A
(keep the column until a later schema release - dead schema with no owner);
C (revoke EXECUTE only - dead SECURITY DEFINER code and its Security
Advisor row stay).

**P6 - settled by the planner, 2026-10-23 (the carry leaves the choice to
the planner).** The first read is a PostgREST select of list heads with
each entry's identity; an entry's details load per list.

- The head read: each list's own columns (`id,name,money_mode,player_note,
  gm_note,created_at,updated_at,revision`) and
  `list_entries(id,item_key,source,hb_item,position)`. It keeps the
  revision protocol of `lists.list(known)`.
- The detail read: `rows(ids)` reads the named lists with every entry
  column (today's `LIST_SELECT` without `legacy_fingerprint`) in chunks of
  `CHANGED_ROWS_MAX`, as `RequestRepository.lines(ids)` does.
- `CloudLists` holds every list's `ids`, `entryIds` and `links` from the
  head read, and a list's `meta` only once its details are read. The list
  page, the share panel, the requests panel, the copy text, the print of a
  list, the export (`exportLists`, `exportData`), the add-to-list menu's
  remove-with-undo and `SharedListPage`'s `hiddenN` (the owner's own
  players' link counts its GM-only entries) read details first.
- `relinkAs` runs on a list with heads only: the server keeps the row's
  meta (the `relink` op, `ListOp` in `lib/cloudLists.ts`), and the local
  `meta` moves only when it is present. The writes that need details are
  `restoreEntry`'s callers only: the list page's row remove and sell undo,
  and the add-to-list menu's remove-with-undo.
- Why: the add-to-list menu, `listsHolding` and `relinkTargets` need every
  list's keys at
  once, so heads without keys would move the whole read to the first menu
  press. The entry notes are the measured cost (81.7 MB with long notes
  against an est. 11 MB with short ones, D115). The repository chose
  PostgREST heads over an RPC for the requests read
  (`docs/decisions/2026-10-22-the-owners-requests-read-takes-every-head-and-the-open-lists-lines.md`,
  which rejected a `my_limits()` RPC as "a migration").
- Rejected: an `account_heads()` RPC with counts and thumbnail keys (a
  migration with its reversal, a fake mirror of the RPC, a plan review of a
  new function, and the menu would still need every key); counts through
  PostgREST aggregates (`db_aggregates_enabled` is off, and turning it on is
  a role setting for every table `authenticated` reads); lazy notes only
  (quantities, prices and flags of every entry stay in the first read, est.
  7-9 MB at 3x, and a half-filled `meta` that no type shows).
- Accepted trade-off: the first read still carries one small row per entry
  (est. 4-5 MB at 3x, est. 0.5 MB at the defaults; `B10.4` measures it),
  and a list page waits one more round trip for its details.
- Fallback, only if `B10.4`'s measurement at 3x misses the 4000 ms bar
  (defined in section 12) after the extra reads per state are explained:
  the head read moves to an invoker RPC that answers each list's keys and entry
  ids as arrays; `B10.4` then carries a migration and a new plan review.
- Deviation from D115's "How to verify": the first read still embeds
  `list_entries`, with identity columns only. The owner gave the carry with
  the line "the first read does not embed `list_entries`" (2026-10-22), so
  the change is Q2.

**Q2 - open, for the owner; it blocks `B10.4` only.** D115's "How to
verify" says "the first read does not embed `list_entries`". The P6 design
above never meets that line.

- A (recommended): change the criterion to "the first read carries no
  entry note, quantity, price or GM-only flag; the head JSON at 3x is at
  most 6 MB (`check:db`); and the 4000 ms bar of section 12 passes on
  `#/lists` and on the largest list's page". `B10.4` deletes D115 when all
  three pass, and its decision file records the changed criterion as a
  deviation from the carry. Why: the add-to-list menu, `listsHolding` and
  `relinkTargets` need every key at once, and the identity rows are the
  smallest PostgREST read that gives them. Trade-off accepted: the first
  read keeps one small row per entry (est. 4-5 MB at 3x).
- B: keep the original line. Then the head read is an invoker RPC that
  answers each list's keys and entry ids as arrays (the fallback above):
  `B10.4` becomes a schema batch with a migration, a reversal, `tests/db/`
  cases and a new plan review, for an est. 2x smaller first read.
- Owner AFK: take A and log it as the default (memory rule).

No other question is open. Settled items 3 and 4 follow from the owner's
"the app never reads, draws or moves them".

## 5. What the app looks like after R10

- `#/l/...`: the not-found page, the address kept, signed in or out, in
  every build.
- `#/lists`: signed in, the account lists; signed out, the sign-in prompt;
  no sign-in configured, the not-found page.
- `#/lists/<uuid>`: the account list page («Загружаем...» until its details
  are read); any other id, the page's not-found state.
- The tab bar: nine sections. The header: no banner.
- The add-to-list menu: account lists only (signed in), the sign-in prompt
  (signed out), nothing (no sign-in configured).
- Modules deleted: `lib/listLink.ts`, `lib/legacy.ts`, `ports/compress.ts`,
  `state/lists.svelte.ts`, `state/legacyMove.svelte.ts`,
  `components/MoveNotice.svelte`, `MoveStatus.svelte`,
  `StorageNotice.svelte`, and their tests.
- `localStorage` keys the app reads: `dhloot.lang.v1`, `dhloot.home.v1`,
  `dhloot.prefs.v1`, `dhloot.auth.return`, `sb-<ref>-auth-token*`.
  `dhloot.probe` and `StoragePort.works()` go with the storage warning.
- The database: `lists_limit` and `list_entries_limit` count every insert;
  `public.lists` has no `legacy_fingerprint` column and no
  `lists_legacy_fingerprint` index.

## 6. The dispatch refresh (done 2026-10-23)

Results of the pass-1 checklist, at `0b73fd5c`:

1. The date: `LEGACY_WRITE_UNTIL` reads `Date.UTC(2026, 9, 26)`. R10 is
   dispatchable from 2026-10-26. At dispatch the implementer confirms the
   date and merges `origin/main` (`B10.1` step 1); no planner pass is due
   for a small drift (the implementer adapts).
2. The inventory grep (below) was re-run; sections 9-13 name the files of
   today's tree. Re-run it at `B10.1` step 1:
   `git grep -n -E "listLink|PACK_MARK|sharedList|compress|legacyWritable|localWritable|moveDue|legacyMove|LegacyMove|MoveNotice|MoveStatus|StorageNotice|ListStore|app\.lists\b|storageWorks|warnHidden|followMoved|today|moveSettled|dhloot\.lists|dhloot\.migrated|move_legacy_list|legacy_fingerprint" -- app/src tests supabase tools docs/specs llms.txt README.md README.ru.md`.
   Most `today` and `compress` hits are other words (`zip.ts`,
   `usage*.mjs`, comments).
3. Overlaps: R8 and R9 changed nothing R10 owns; print-snapshots retired
   `#/print/...` (`printRetired`), so the pass-1 line "`#/print/<id>*<n>`
   keeps its spelling" is gone. `hash.ts` no longer imports `QTY_MAX`;
   `bundle.ts` and `cloudLists.ts` do. The `ListPage` print `prompt` state
   for a browser list, its golden `#/lists/a ~ print signed out`, the sweep
   row «печать без входа: список» and `tests/app/print.js`'s signed-out
   browser-list check go in `B10.3`.
4. `DEBT.md`: `debt-cleanup` fixed D64's «Выйти» half; D64 now names only
   `MoveNotice` and goes whole in `B10.3`. D61 is not in "Legacy removal".
   D24, D62, D63 are unchanged. `persist-review` added D115 (P6) to the
   section.
5. Gate costs: section 8 uses `.claude/README.md`, "Batch size and the
   fixed cost of a run" (2026-10-07 to 2026-10-22); context.md, "Command
   costs", holds the table.
6. New code since 2026-10-01 that depends on the removed model:
   `sectionLabel(..., legacyWritable)` (`B10.3`); case 77 and the sweep's
   `#/l/` notes row (`B10.1`); the browser-list seeds of section 1
   (`B10.2`, `B10.3`); `tests/db/delete-account.test.mjs`'s
   `legacy_fingerprint` (`B10.5`). Nothing new reads `#/l/` in production
   code, and nothing new calls `move_legacy_list`.

## 7. Contracts and specs changed, by batch

| Batch | Public contract | Specs and docs |
|---|---|---|
| `B10.1` | `#/l/` grammar (`ROUTES.md`, `CONTRACTS.md` section 1), `CONTRACTS.md` section 3 (one history paragraph), `docs/fixtures/lists/*.json` deleted, `routes.json` `#/l/` rows, `tests/contracts.js`, `llms.txt` | `FEATURES.md`, `STATE.md`, `META.md`, `COVERAGE.md`, `CONTRACTS.md` section 4 ("Formatted text" table), `README.md`, `README.ru.md`, `help.ts`, `.claude/README.md` ("Hooks" table, `edit-followup.mjs` row) |
| `B10.2` | none | `COVERAGE.md` (the ported cases) |
| `B10.3` | `routes.json` `#/lists` `tab: null` | `STATE.md`, `FEATURES.md`, `ROUTES.md`, `META.md` section 3, `COVERAGE.md`, `I18N.md` (the cutoff bullet), `DEBT.md` (D24, D63, D64), `README.md`, `README.ru.md`, `help.ts`, one decision file |
| `B10.4` | none | `FEATURES.md` ("Account and browser lists": the first read), `COVERAGE.md`, `DEBT.md` (D115), one decision file |
| `B10.5` | none | `DEBT.md` (D62, the section), `COVERAGE.md` (layer 3), `.claude/README.md` ("Expected Security Advisor warnings", "Usage monitoring", "Undo a deploy that carried a migration"), one decision file |

## 8. Batches

The gate model (`CLAUDE.md`, "Quality gates"; `.claude/README.md`, "CI
credit"): a batch is one new commit on `claude/persist-10-legacy-removal`
and one push. The writer's local floor is `rtk npm run check:fast`, plus
`npm run check:db` (PowerShell tool) for a `supabase/` or `tests/db/`
change. The writer re-seeds goldens locally when a batch changes screens,
and runs the browser suites it edits once, so the CI run is not spent on a
red that a local run finds. CI's green run of the exact tree is the full
gate; the orchestrator waits on it with one background `ci-credit.mjs`
call. A schema batch (`B10.5`) stops unpushed after its local gates and
commit until its batch review approves.

Costs (idle host): `check:fast` 8-12 min when `dict.ts` or
`state/app.svelte.ts` changes (474-710 s), about 4 min otherwise;
`check:db` about 15 min with the stack start; `build:test` 1 min; one
golden pass (`--update`, four shards) about 13 min; `app/contracts,
app/states` about 10 min; the filter group
`app/print,app/contracts,app/states,app/typo,app/hues,stub` about 5 min
pooled; `sweep.js 360` about 8 min; a CI run about 11 min (remote).

| Batch | Goal | Gates (cost) | Review | Split criterion from the previous batch |
|---|---|---|---|---|
| `B10.1` | Retire `#/l/`: the codec, the compress port, the `#/l/` pages, buttons and rewriting, the contract fixtures and suites, the specs; port the shared page's `#/l/` coverage to `#/s/` | `check:fast` (10), `build:test` (1), `app/contracts,app/states` (10), goldens (13), `sweep.js 360` (8), `contracts,dataint` (1), CI (11) - about 54 min | required: public contract | - (first batch) |
| `B10.2` | Port every test that uses a browser list only as a fixture onto an account list of the fake cloud; no production change | `check:fast` (10), `build:test` (1), the filter group (5), `sweep.js 360` (8), CI (11) - about 35 min | required: harness that later batches rely on, judged against `COVERAGE.md` | a public-contract change: `B10.1` changes `CONTRACTS.md`, `docs/fixtures/`, `tests/contracts.js` and `llms.txt` and needs its own commit and its own review; `B10.2` changes no contract (and `B10.2` lands before `B10.3` because the harness cannot reach `B10.3` without its account-list fixtures) |
| `B10.3` | Remove browser lists and the move on the client: `ListStore`, `LegacyMove`, the three notices, `legacy.ts`, the date gates, `?today=`, the Lists tab, the move's client path, the unconfigured build's lists; P36 | `check:fast` (10), `build:test` (1), the filter group (5), goldens (13), `sweep.js 360` (8), CI with `e2e` (11) - about 48 min | required: UI changes on every page, a public contract fixture (`routes.json`) | a different route and filter set from `B10.1` (`#/lists*` and the header on every route, against `#/l/*` and the contract suites), and a review that cannot be held in one pass with `B10.1` |
| `B10.4` | P6: the first read takes heads with entry identities; details load per list (D115) | `check:fast` (10), `check:db` (15), `build:test` (1), `app/states` (5), goldens (13), CI (11) - about 55 min | required: a sync protocol change (and a plan review at its refresh) | a review that cannot be held in one pass with `B10.3` (a protocol of `CloudLists`, the ports, the fake and the contract suite, against a removal of about 90 paths), and it needs `B10.3`'s tree (no `ListModel`, no browser consumer of `CloudList`) |
| `B10.5` | The migration (Q1 B): drop `move_legacy_list`, the `dhloot.move` guard, `lists.legacy_fingerprint` and its index; its reversal, `tests/db/`, D62 | `check:fast` (4), `check:db` (15); after the approve, the push and CI with `migrate-test` and `e2e` (11) - about 30 min | required: a migration that drops a SECURITY DEFINER function and a column | a commit boundary the harness cannot reach (contract case I and e2e F9 call the function, and the client selects the column, until `B10.3`); the schema batch rule; and the last batch, so the test project's window (section 13, "Order") is as short as one CI run before the landing |

Total gate cost: about 222 minutes for one green pass of the five batches
(about 167 min local, 55 min of CI), plus the closeout (merge `origin/main`,
push, CI of the tip, the squash and `main`'s run: about 22 min) - about
4 h, before reviews and remediation. Every local run fits one foreground
call (one shard or one width per call; `check:db` past 600 s arms by its
own exit).

Merges considered and rejected: `B10.1`+`B10.2` (they share `seed.ts`,
five unit files and `app/states`, and the merge would save one
`check:fast`, one `build:test` and one CI run, about 22 min; rejected
because a public-contract change takes its own commit and its own review,
and the merged diff would put a contract review and a harness review
against `COVERAGE.md` in one pass); `B10.1`+`B10.3` (one review over about
120 paths and two contract surfaces); `B10.2`+`B10.3` (the port and the
deletions in one diff hide which red belongs to which); `B10.3`+`B10.4`
(the review of a removal and of a new read protocol in one pass);
`B10.4`+`B10.5` (they share `check:db`, but the schema review and its
unpushed wait would hold the protocol change, and the test project's
window would open one batch earlier).

## 9. Batch B10.1 - retire `#/l/` (implement-ready)

**Objective.** An old `#/l/` link draws the not-found page with its address
kept, nothing in the app reads, writes or documents the list link format,
and every shared-page test that used a `#/l/` payload as its fixture runs
on a `#/s/` share link. Browser lists stay (read-only after the date) until
`B10.3`.

**In scope.** Settled items 1, 2 and 11 (section 3); the `pageRecordFor`
fix; every file below.

**Out of scope.** Browser lists, the move, the notices, the date gates,
`?today=`, the tab bar, the first read, the database (later batches).
`.claude/hooks/`. `docs/fixtures/import/`, `schema/import-v1.json`,
`docs/fixtures/share/`.

**Files deleted.**

- `app/src/lib/listLink.ts`, `app/src/lib/listLink.test.ts`
- `app/src/ports/compress.ts`
- `docs/fixtures/lists/` (six files: `equipment-entry.json`, `minimal.json`,
  `money-coin-mode.json`, `notes-both-kinds.json`, `qty-and-price.json`,
  `unicode-heavy.json`)
- the golden files of the deleted states (step 12), as `golden.js`'s stale
  sweep names them

**Files created.** `app/src/test/seed.ts` (step 11).

**Files edited** (production): `app/src/lib/lists.ts`, `cloudLists.ts`,
`hash.ts`, `bundle.ts`, `share.ts`, `pending.ts` (comment), `dict.ts`,
`help.ts`; `app/src/ports/types.ts`, `index.ts`, `redirect.ts` (comment);
`app/src/App.svelte`; `app/src/components/ListPage.svelte`,
`SharedListPage.svelte`, `ListsPage.svelte`, `Shell.svelte`,
`AddToList.svelte`, `SelBar.svelte` (import paths), `FilterBar.svelte`
(the prop comment that names `#/l/`); `app/src/state/
app.svelte.ts`, `cloudLists.svelte.ts` (import path), `lists.svelte.ts`
(import path).

**Files edited** (tests and harness): `app/src/lib/hash.test.ts`,
`lists.test.ts`, `bundle.test.ts`, `share.test.ts`; `app/src/components/
listPage.test.ts`, `listsPage.test.ts`, `sharedListPage.test.ts`,
`shell.test.ts`, `sharePanel.test.ts`, `a11y.test.ts`; `app/src/state/
app.test.ts`; `app/src/ports/ports.test.ts`; `tests/contracts.js`,
`tests/derived.js`, `tests/app/contracts.js`, `tests/app/states.js`,
`tests/app/inventory.js`, `tests/app/sweep.js`, `tests/app/driver.js`;
`docs/fixtures/urls/routes.json`.

**Files edited** (docs): `docs/specs/CONTRACTS.md`, `ROUTES.md`,
`FEATURES.md`, `STATE.md`, `META.md`, `COVERAGE.md`; `llms.txt`;
`README.md`, `README.ru.md`; `.claude/README.md` (the `edit-followup.mjs`
row of "Hooks" only).

**Behaviour and UI constraints.**

- `#/l/<payload>`, `#/l/~<payload>`, `#/l/` and `#/l/ABC.` each draw the
  not-found page in every build; `location.hash` is unchanged after load;
  no tab is lit; the document title is the plain `docTitle`.
- A browser list's page keeps `#/lists/<id>` (no rewrite before the date
  either); its title is the plain `docTitle` (the `openList` title goes).
- A browser list's page and card draw no link buttons; the card links to
  `#/lists/<id>`.
- `#/s/` pages, `SharePanel`, «Сохранить себе» on `#/s/` and the
  dropped-entries toast on `#/s/` do not change.
- No new text. Removed text keys are listed in step 8.
- Between `B10.1` and `B10.3` the branch draws `localOnly` and the help
  paragraph 2 with the names of the removed buttons. Accepted: the branch
  reaches production only whole, after `B10.3` removes both.

**Standing checks.**

1. Scale. States table (the only screens that change are the `#/l/` pages,
   a browser list's page and the lists index card):

   | State | What the screen shows | Proof |
   |---|---|---|
   | `#/l/<payload>` (plain) | the not-found page, the address kept | golden `#/l/ ~ retired` (rewritten), `app/contracts`, `routes.json` |
   | `#/l/~AAAA` (packed) | the same page | golden `#/l/~AAAA` (rewritten), `app/contracts` |
   | `#/l/`, `#/l/ABC.` | the same page | `hash.test.ts`, `routes.json`, `app/contracts` |
   | a browser list's page, one and many entries | no «Ссылка игрокам», no «Ссылка себе»; the address stays `#/lists/<id>` | goldens `#/lists/a*`, `listPage.test.ts` |
   | the lists index, one and many browser lists | the card has no link button and links to `#/lists/<id>` | goldens `#/lists ~ two lists`, `~ many lists` |
   | at the limit, one past it, 3x | unchanged (no collection or cap changes) | unchanged |
   | the longest list name | unchanged | case 66 |
   | 360 px and 1180 px | the not-found page as `#/h/<unknown>` draws it; a list page's toolbar holds two buttons fewer | goldens, `sweep.js 360` in CI |

2. Error scenarios. Loading and a failed read: none (`listRetired` reads
   nothing). Offline: the same page. A conflict, a deleted record: not
   applicable (no write). A stale tab on the previous bundle keeps decoding
   `#/l/` until it reloads and writes nothing new. A pending
   `dhloot.auth.return` action `saveList` that an old bundle stored on a
   `#/l/` page and that returns to a `#/l/` address on this bundle is
   dropped: `#runPending` has no `sharedList` arm, the page draws not found,
   and no list is made (acceptance line; nothing stored is lost, because
   the old save never ran). A revert (the previous frontend): nothing this
   batch stores is new; the previous bundle decodes `#/l/` again.
3. Consistency. No rule of `FEATURES.md`, "Consistency rules", covers a
   retired address; the sibling pages are the reference: `#/homebrew` and
   `#/account` with no sign-in draw the same not-found page with the
   address kept and «На главную», and `#/print/...` keeps its own retired
   print page (a different kind, decided 2026-10-08). Rule 4 ("One name")
   is untouched here; `B10.3` ends its departure. The share labels left are «Ссылка для игроков» / «Ссылка для мастера»
   (`SharePanel`); «Ссылка игрокам» and «Ссылка себе» go (audit #13 of
   `persist-7e`, owner 2026-10-01). No departure.
4. RU/EN parity. No new string. Each removed key goes in both languages;
   the help paragraph 5 goes in both.

**Steps.**

1. `git fetch origin`, `git merge origin/main` (a merge, never a rebase).
   Confirm `date -u` is 2026-10-26 or later and `LEGACY_WRITE_UNTIL` still
   reads `Date.UTC(2026, 9, 26)`; otherwise stop. Run the inventory grep
   (section 6, item 2), `git grep -n "#/l/" -- app/src` and `git grep -n -E "#/l/|list link|docs/fixtures/lists" -- docs/specs llms.txt README.md README.ru.md .claude/README.md docs/fixtures/urls/routes.json tests/contracts.js tests/derived.js`;
   the three outputs are the checklist for steps 2-14.
2. `lib/lists.ts`: add `ListEntryMeta`, `ListShape` and `QTY_MAX` (moved
   verbatim from `listLink.ts`, with their comments); import `MoneyMode`
   from `./money.js`; delete `findListByPayload` and `copyInit`.
   `lib/cloudLists.ts`: add the interface `SharedList` (the old
   `DecodedList`, the same fields; its `dropped` comment reads "How many
   entries the projection held that the reader's index does not know");
   `sharedListOf` returns it. Point every other importer of `listLink.js`
   at `lists.js`, `cloudLists.js` or `money.js`.
3. `lib/hash.ts`: replace the `sharedList` member of `Route` with
   `| { kind: 'listRetired' }` and the comment "An old list link
   (`#/l/...`): the not-found page, the address kept
   (docs/specs/ROUTES.md)". In `parseHash`, one branch where the packed
   test is now: `if (/^l\//.test(h)) return { kind: 'listRetired' };`.
   Delete the later `l/` branch and its comment, `PACK_MARK` and
   `sharedListHash`.
4. `ports/types.ts`, `ports/index.ts`: delete `CompressPort`,
   `Env.compress`, the `compress.js` import and re-export, and the
   `compress:` entries of `browserEnv` and `fakeEnv`; reword the two
   comments in `types.ts` that mention compression.
5. `App.svelte`: the list branch reads
   `{:else if app.route.kind === 'storedList'}`. Reword the last branch's
   comment in one or two lines: it draws the not-found page for an address
   this build reads but has no page for (`listRetired`, and the routes that
   need sign-in in a build without it), citing `docs/specs/ROUTES.md`.
6. `ListPage.svelte`:
   - `own` reads only `storedList` (the browser store, the account store,
     the moved-id redirect - unchanged until `B10.3`);
   - delete the URL sync machinery: `syncTimer`, `cancelUrlSync`,
     `scheduleUrlSync`, `flushUrlSync`, the effect that schedules it, the
     `pagehide`/`visibilitychange` effect, the comment above them, and the
     `onDestroy` work that only served them (`app.clearOpenList()`; keep
     whatever else it does);
   - delete `shareLink`, `sharePlayers`, `shareGm` and the two buttons in
     the `{:else if !readOnly}` arm (the arm goes; `isCloud` keeps its arm);
   - delete the retired branch (`route.kind === 'sharedList' &&
     !app.legacyWritable`), the packed branch, the `sharedList` branch and
     the `SharedListPage` import;
   - `QTY_MAX` and `ListEntryMeta` from `lists.js`, `MoneyMode` from
     `money.js`.
7. `SharedListPage.svelte`: `token: string` is required; delete `payload`,
   the `decodeList` arm of `shared`, the local save (`app.lists.create`,
   `copyInit`, `openNewList`), the `token === undefined` arms (the
   not-found arm with `badShare`, the `legacyLinks` line, the `#/l/` filter
   in page memory) and the `#/l/` sentences of the header comment.
   `saveShared` keeps `cloud`, `prompt` and `wait`. The dropped-entries
   toast stays, keyed on the token.
8. `AppState` (`state/app.svelte.ts`): delete `expandFailed`, `#expand` and
   its calls, `syncListUrl`, `openNewList`, `#claimList`, `openList`,
   `urlPayload`, `clearOpenList`, `saveCopyOf`; `#runPending` keeps the
   `share` arm and loses the `sharedList` lines and the packed wait;
   `followMoved` keeps only the `storedList` arm (`to = r.kind ===
   'storedList' ? into(r.listId) : undefined`); `shared` is
   `$state<SharedList | null>`. `pageRecordFor`: the account-list branch
   reads the route, `else if (r.kind === 'storedList') { const linked =
   this.cloudLists?.get(r.listId)?.linked?.[id]; ... }`, with a unit case
   in `app.test.ts` that fails on the old code. Its fixture: two account
   lists link two other accounts' items of one homebrew key (an own item
   never reaches `linked`, because `#withLinked` leaves out the keys the
   account holds); the other list comes first in `cloudLists.lists`; on the
   second list's page, a print press resolves the second list's record
   (the old code answers the other list's record through `recordFor`).
   `Shell.svelte`: the title's `own` arm goes (it read
   `openList`); reword its comment. `ListsPage.svelte`: the card `href` is
   `storedListHash(l.id)`; delete `share()`, its button and the codec
   imports. `dict.ts`: delete, in both languages, `legacyLinks`,
   `linkRetired`, `linkRetiredSub`, `sharePlayers`, `shareGm`,
   `playersLinkCopied`, `gmLinkCopied`, `badShare`, and every other key
   that `git grep -n -w <key> -- app/src` shows without a reader after the
   edits.
9. `help.ts` `LISTS`: delete the fifth paragraph («У списка в этом
   браузере вместо неё две кнопки...» and "A list in this browser has two
   buttons instead..."), both languages. Paragraph 2 stays until `B10.3`.
10. Comments: `pending.ts` (the `saveList` action saves the open share
    link's list, `#/s/` only); `redirect.ts` (the 16384 bound stays; its
    reason becomes "`#/l/` links with notes passed 2048 before R10").
11. Unit tests (settled item 11):
    - Create `app/src/test/seed.ts`: `seedWith(lists, shares = [])` returns
      `SEED` with `lists` (typed `Partial<Record<keyof Seed['lists'],
      SeedList[]>>`, so `fake-cloud-seed.ts` needs no new export) appended
      to each named user's own lists and `shares` appended to
      `SEED.shares`. One-sentence method comment, third-person verb.
    - `sharedListPage.test.ts`: replace the three payload fixtures with
      `SeedList` literals of the same content (name, entries with
      `qty`/`gold`/`note`/`hnote`, `money`) in gm4's lists (`uuid(901)`,
      `uuid(902)`, `uuid(903)`; entries `uuid(9011)` up), each with a
      players' and a GM's share (`player-token-9n`, `gm-token-9n`; ids and
      topic keys from `uuid(911)` up). Each behaviour case (heading and
      sub, ticked, a dropped entry, every entry gone, untitled, the notes,
      the tails, selection, adding to a list, the taken count, a row
      opened, English, accessibility, and the filter threshold's "draws no
      search box below 8 entries, and the box and the strip at 8" and
      "starts unfiltered, folded and without the box on another list" on
      `seedWith` lists of 7 and 8 entries with players' shares) opens the
      matching `#/s/` token with `fakeCloud(seedWith(...))` and waits for
      the heading. Delete the
      cases whose subject is the codec or `#/l/`: "the bad link", "the
      legacy announcement", "saving the whole list" (browser save), "draws
      no region on a #/l/ page", "nor on a #/l/ page" (keep its
      not-the-owner half), "encodes the 8-entry #/l/ list", "on a #/l/
      link", "disables «Сохранить себе» while the browser lists move" stays
      (B10.3's). Where a `#/s/` case already pins the same behaviour, the
      port may merge into it; record each merge in the handoff.
    - `listPage.test.ts`: delete the cases on the rewrite to `#/l/`, the
      own `#/l/` page, the shared and packed pages, the packed buttons,
      "draws the retired page..." and "follows its own #/l/ page...";
      add `it('draws the not-found page for an old list link and keeps the
      address')`, rendering `App` at a literal `#/l/` hash. Its clipboard
      "no `#/l/`" assertions stay as literal substring checks.
    - `listsPage.test.ts`: the card `href` is `#/lists/<id>`; delete the
      share-button cases. `sharePanel.test.ts`, `shell.test.ts`: replace
      the `#/l/` fixture with a `#/s/` token or delete the case when its
      subject is `#/l/`. `a11y.test.ts`: the `#/l/` route becomes the GM
      share of a `seedWith` list with both notes. `lib/lists.test.ts`:
      delete the `findListByPayload` and `#/l/ payload` cases.
      `bundle.test.ts`, `share.test.ts`: import paths. `hash.test.ts`
      expects `{ kind: 'listRetired' }` for `#/l/x`, `#/l/~x`, `#/l/`,
      `#/l/ABC.`, and `unknown` for `#/lx` and `#/list`. `ports.test.ts`:
      delete the compress cases. `app.test.ts`: delete the `openList`,
      `urlPayload`, packed and own-`#/l/` cases; add the `pageRecordFor`
      case (step 8) and a case for the dropped `saveList` pending action
      on a `#/l/` return (standing check 2).
12. Layer 2:
    - `tests/app/inventory.js`: delete `#/l/ ~ own list`, `~ own list,
      retired`, `~ shared` and its variants (`a row ticked`, `picked`,
      `saved`, `saved as gm2`, `noted`), `~ packed`, `~ every entry gone`,
      `~ filtered`, `#/l/zzzz`; rewrite `#/l/ ~ retired` with no `today`,
      the route as a literal (copy `qty-and-price.json`'s `player.payload`
      before the file goes) and the why "an old list link draws the
      not-found page: «Предмет не найден», its sub, «На главную»; the
      address kept, nothing decoded"; rewrite `#/l/~AAAA` with no `enter`
      and the why "a packed old list link: the same not-found page, the
      address kept". Delete `QTY_AND_PRICE`, `NOTES_BOTH_KINDS`, `PACKED`
      and the comments that explain them when no reader is left.
    - `tests/app/states.js`: delete case 8 (packed link) and case 38 (old
      link saved after sign-in) from the functions and `CASES`; in case 47
      delete `MOVE_A_GM` and the "OAuth return lands on the first list's
      own #/l/ page" block; in case 48 delete `READ_ONLY_OWN` and its
      sub-steps (both cases stay until `B10.3`); port case 77 to
      `#/s/player-token-1`: open it signed out, `await d.fake('playEntry',
      SHOP_ID, 'ci1', { player_note: 'Видно игрокам' })`, wait until the
      ci1 row draws its note, then the existing assertions; delete
      `NOTED_AND_COUNTED` and the `QTY_AND_PRICE` require; update the
      header's case count. Case 43's "no `#/l/` copied" check stays.
    - `tests/app/contracts.js`: replace "the link the app writes" and the
      other codec blocks with one block "an old list link": for `#/l/<the
      same literal payload>`, `#/l/~AAAA` and `#/l/ABC.`, open the address,
      assert that the `h1` reads «Предмет не найден» and `location.hash`
      equals the opened hash. Reword the file header.
    - `tests/app/sweep.js`: `['#/l/%%SHARED%%', 'чужой список']` becomes
      `['#/s/player-token-1', 'чужой список']`; the `#/l/` notes row
      becomes `['#/s/gm-token-1', 'чужой список: заметки в строках']`;
      delete the `%%SHARED%%` substitution; keep `#/l/zzzz` with the label
      «старая ссылка».
    - `tests/app/driver.js`: delete `addressSettled`, `expanded` and
      `expandFailed` when no caller is left.
13. Contract fixtures and suites:
    - `docs/fixtures/urls/routes.json`: the `#/l/ABC.` row's why becomes
      "an old list link with a stray character draws the not-found page,
      the address kept, never home"; after it, add a `#/l/~AAAA` row ("a
      packed old list link: the not-found page, the address kept") and a
      row for the literal `qty-and-price` player payload ("an old list link
      that opened a list before 2026-10-26: the not-found page, the address
      kept"), each with the `resolves` shape of the `#/l/ABC.` row.
    - `tests/contracts.js`: delete the list-encoding half (`b64url`,
      `stampOf`, `N_REC`/`N_SEP`, the "list encoding" block) and the check
      that `llms.txt` and `CONTRACTS.md` name 2026-10-26; reword the header
      comment. Remove the `zlib` require only if nothing else uses it.
    - `tests/derived.js`: delete the "legacy write cutoff" check. Keep the
      `llms.txt` pin `'#/l/'` (step 14 keeps one sentence); the message "the
      fragment of a list link" becomes "the fragment of a link".
14. Specs and docs (each in the language and form of its file; the step-1
    grep is the checklist):
    - `CONTRACTS.md`: the fixtures paragraph names `docs/fixtures/urls/
      routes.json` and `docs/fixtures/import/`; section 1's bullet says
      `#/l/<payload>` is a retired address that draws the not-found page,
      the address kept; section 3 becomes "3. List link encoding
      (retired)" and one paragraph: "`#/l/` links stopped opening on
      2026-10-26, and R10 removed their format; an old `#/l/` address draws
      the not-found page (section 1). The format is in `git show
      0b73fd5c:docs/specs/CONTRACTS.md`, section 3." Sections 4 and 5 keep
      their numbers. Section 4, "Formatted text": the row `dhloot.lists.v2`,
      `#/l/` payload loses `#/l/ payload` (`B10.3` takes the rest).
    - `ROUTES.md`: the two `#/l/` rows become one row "`#/l/...` - an old
      list link, retired on 2026-10-26: the not-found page in every build,
      the address kept, the payload never read"; delete the `#/l/`
      sentences after the `#/s/` grammar and the paragraph on the stray
      character after `l/`; the print paragraph drops "the list link's
      `id*qty` spelling stays in `CONTRACTS.md` section 3"; the
      `#/lists/<listId>` row drops its `#/l/` clause.
    - `llms.txt`: rule 4's sentence becomes "Do not build `#/l/` links: that
      format stopped opening on 2026-10-26."; delete the `#/l/<payload>`
      address entry; the `?v=` sentence names an item or a share link.
    - `FEATURES.md`: in "Lists", delete the shared `#/l/` page bullets (the
      page, the save, the 26 October line, the bad and packed links, the
      `#/l/` filter in page memory), the link buttons and the address-bar
      rewrite; "held to 99, the most a list link carries" becomes "held to
      99"; every other `#/l/` sentence (the formatted text on `#/l/`, the
      selection bar "as on a `#/l/` page", the own `#/l/` follow, the
      read-only bullet, "a `#/l/` link and a lists file never carry an own
      key", the retired page) goes or says the not-found page.
    - `STATE.md`: the hash row holds "route, table, anchor, filters, a share
      link's token, what to print"; `dhloot.auth.return` saves "the open
      share link's list (`#/s/`)", and its bound sentence says "`#/l/`
      links with notes passed 2048 before R10"; the memory table drops
      `openList` and `urlPayload`, and the `urlPayload` paragraph goes.
    - `META.md` section 3: the two `#/l/` bullets become "An old `#/l/` link
      stopped opening on 2026-10-26 and draws the not-found page."; the
      homebrew sentence names the lists file only; the PWA line on "a list
      link carries a list" names a share link.
    - `COVERAGE.md`: the rows of `listLink.test.ts`, the codec half of
      `contracts`, the `#/l/` goldens, states 8 and 38, `compress`; the
      `listPage.test.ts` and `sharedListPage.test.ts` rows name `#/s/`;
      add the "an old list link" block of `app/contracts`, the two kept
      goldens, and `test/seed.ts`.
    - `README.md`, `README.ru.md`: the example `#/l/` address becomes a
      `#/s/` example; "Two notes" says what each note reaches now; the two
      link buttons become «Поделиться»; "The link format" becomes a short
      "Share links" subsection (an opaque token, made by the owner, revoked
      by «Удалить ссылку»); "the list link format" in the contracts
      sentence goes; the fetcher sentence names a share link. Keep each
      README's order and language.
    - `.claude/README.md`, "Hooks", the `edit-followup.mjs` row:
      "`CONTRACTS.md` enumerates only `docs/fixtures/urls/routes.json` and
      `docs/fixtures/import/`". The 2026-09-30 measurement that names
      `#/l/ ~ every entry gone` stays (a dated measurement).
15. Gates (below), then one commit `feat(persist): retire the old list
    links` (body: the cutoff passed; an old link draws the not-found page;
    the shared page's tests run on share links). No AI trailer. `git fetch
    origin`, `git merge origin/main`, then `git push -u origin
    claude/persist-10-legacy-removal`.

**Acceptance criteria.**

- `git grep -n -E "listLink|decodeList|encodeList|PACK_MARK|sharedListHash|compress\.(pack|unpack)|CompressPort|expandFailed|syncListUrl|urlPayload|openList\b" -- app/src tests` prints nothing.
- `docs/fixtures/lists/` does not exist; `tests/contracts.js` and
  `tests/app/contracts.js` pass without it.
- `parseHash` answers `{ kind: 'listRetired' }` for `#/l/x`, `#/l/~x`,
  `#/l/` and `#/l/ABC.`; the built app keeps each address and draws
  «Предмет не найден» (`app/contracts`, the two goldens).
- A browser list's page and card draw no link button, and its address stays
  `#/lists/<id>` (goldens, `listPage.test.ts`).
- The keys `sharePlayers` and `shareGm` are gone from `dict.ts` in both
  languages; `git grep -n -E "Ссылка себе|Ссылка игрокам|Your own link" -- app/src docs/specs`
  finds only `localOnly` and help paragraph 2, which `B10.3` removes.
- Every shared-page behaviour case of `sharedListPage.test.ts` runs on a
  `#/s/` token; the handoff lists the deleted cases and each merge.
  `npm run check:fast`'s coverage of `SharedListPage.svelte` does not
  drop below its threshold.
- States case 77 passes on `#/s/player-token-1`; the sweep draws
  `#/s/player-token-1` and `#/s/gm-token-1`.
- `pageRecordFor` on an account list's page answers that list's linked
  record (the new `app.test.ts` case fails on the old code).
- A `saveList` pending action that returns to a `#/l/` address makes no
  list (`app.test.ts`).
- `#/s/` behaviour is unchanged: states 43-46, 52, 55, 56 and the `#/s/`
  goldens pass without an update.
- `CONTRACTS.md` section 3 is the one history paragraph; `ROUTES.md` has
  one `#/l/` row; `llms.txt` names `#/l/` once, as not to be built.
- `git grep -n "#/l/" -- docs/specs README.md README.ru.md llms.txt` shows
  only the retired-address lines, the history line, the not-found
  sentences, and browser-list sentences that `B10.3` rewrites.
- The golden update moves only states that draw a browser list (link
  buttons gone, title plain) or a `#/l/` state; the stale sweep finds no
  orphan.

**Verification commands** (in this order; Bash tool, timeout 600000 where
a run can pass 120 s):

```text
npm run build:test
node tests/run-all.js app/contracts,app/states
node tests/app/golden.js --update --shard=1/4        # then 2/4, 3/4, 4/4
git status -- tests/app/snapshots                    # what moved: browser-list and #/l/ states only
node tests/app/sweep.js 360                          # the two new #/s/ rows and the #/l/zzzz label
node tests/run-all.js contracts,dataint
rtk npm run check:fast                               # the last green run arms the commit gate
```

CI's run of the pushed tip is the full gate (the orchestrator's
`ci-credit.mjs`).

**Risks and do-nots.**

- Do not delete `dhloot.*` keys, `ListStore`, `LegacyMove` or the
  notices: `B10.3`'s.
- Do not add a "link retired" text: the owner chose the existing
  not-found page.
- `listRetired` never becomes `unknown`: `routes.json` and `app/contracts`
  would send the reader home.
- A golden move outside browser-list and `#/l/` states is a defect, not a
  re-seed: stop and report it.
- `.claude/hooks/selftest.mjs` keeps its synthetic `docs/fixtures/lists/
  x.json` path (a hook edit fires its own review), and
  `tools/check/lib.test.mjs` keeps its synthetic `docs/fixtures/lists` path.
- `MSYS_NO_PATHCONV=1` before any `golden.js --only="#/..."` on this host.

## 10. Batch B10.2 - port the list fixtures to account lists (outline)

Objective: every test whose subject is list page, lists index, add-to-list,
record, table or print behaviour, and that uses a browser list only as its
fixture, runs on an account list of the fake cloud. No production file
changes.

- Unit: `seedWith` (from `B10.1`) is the fixture; `fakeCloud(seedWith(...),
  'gm1')` and `#/lists/<uuid>`. Port each `describe`/`it` that seeds
  `dhloot.lists.v2` for list behaviour in `listPage.test.ts`,
  `listsPage.test.ts`, `components/lists.test.ts`, `a11y.test.ts`,
  `record.test.ts`, `tables.test.ts`, `shell.test.ts`, `app.test.ts`, and
  `state/cloudLists.test.ts` (its case on both stores keeps the account
  store only). Leave for `B10.3` the cases whose subject is the browser
  store, the merge, the backup, the move, the notices, read-only after the
  date or the unconfigured build.
- Layer 2: add `accountList(d, { name, ids, meta, money, note, hnote })` to
  `tests/app/states.js` (one `create` op through `d.fake('lists.apply',
  [...])`, ids from `uuid(8000 + n)`, then `d.shownAgain()`; answers
  `#/lists/<id>`). Port cases 13, 17, 18, 22, 26, 27 (50 lists: 47 creates
  beside the seed's 3), 30, 32, 33 (the removal "from another tab" becomes
  `lists.apply` with `remove_entries` and a `playRemove(listId, entryId)`
  fake verb, with a `fake-cloud.test.ts` case, if `play` cannot announce
  it), 62 (twelve account lists, not the move), 64, 76. Cases 7, 20, 25,
  34, 47, 48, 51 stay for `B10.3`.
- `tests/app/print.js`: the D20 toast check opens SHOP as `gm1`; the
  signed-out browser-list print check stays for `B10.3`. `tests/app/
  typo.js` and `tests/app/sweep.js`: `#/lists` and `#/lists/a` open as
  `gm1` on SHOP, `#/lists/b` on TROPHIES; `STORAGE` goes when no route reads
  it.
- Standing checks: not applicable - no production change; the reviewer
  compares the deleted and the ported case lists against `COVERAGE.md`.
- Acceptance: the ported cases pass on the current build; `git grep -n "dhloot.lists.v2" -- tests/app app/src`
  lists only cases that `B10.3` deletes, each named in the handoff.

## 11. Batch B10.3 - remove browser lists and the move (outline)

Objective: settled items 3-9; the app holds account lists only; P36.

- Delete: `state/lists.svelte.ts` (+ test), `state/legacyMove.svelte.ts` (+
  test), `lib/legacy.ts` (+ test), `components/MoveNotice.svelte`,
  `MoveStatus.svelte`, `StorageNotice.svelte` (+ `moveNotice.test.ts`,
  `moveStatus.test.ts`).
- `lib/lists.ts`: delete `keepLists`, `liftNotes`, `LegacyList`,
  `mergeLists`.
- `AppState`: delete `lists`, `legacyMove`, `legacyWritable`,
  `localWritable`, `moveDue`, `followMoved`, the list watch, the move step
  of `#listsReady` and `retryLists`, the move retry, the move wait in
  `#runPending`, `storeFor`, `storageWorks`, `warnHidden`, `hideWarn`,
  `WARN_KEY` (and from `SETTINGS_KEYS`); `newListTarget` answers `'cloud' |
  'prompt' | 'wait'`.
- `lib/dict.ts`: `sectionLabel(s, t)` - `lists` reads `menuLists` in every
  build; `i18n.test.ts` follows; `AccountPage.svelte` and `Shell.svelte`
  drop the argument; `SECTION_LABEL`'s `lists` key goes if no reader is
  left.
- Ports: `StoragePort.works` and `dhloot.probe`; `ListRepository.move`,
  `MoveWrite` (`types.ts`, `supabase.ts`, `fake-cloud.ts`, their tests);
  `ListRow`, the select string and every fake row lose
  `legacy_fingerprint` (after `B10.3`, no client file names it);
  `cloud.contract.ts` loses `moveCases` (case I retired, its letter not
  reused) and the signed-out move assert; `tests/e2e/flows.mjs` loses F9
  ("F9 retired at R10" in the header) and its `settled` reads `data-lists`;
  `tests/e2e/admin.mjs`'s select loses the column. `ports/clock.ts`:
  `queryClock` keeps `?toasts=held`; `TEST_NOW`'s comment names its
  readers.
- Components: `ListPage` (an account list only: no `readOnly` and no
  `isCloud` arms, no local delete or undo, no moved-id redirect, no print
  `prompt` state), `ListsPage` (the account group only), `AddToList`
  (account lists only), `SharedListPage` (no move disable), `Shell` (no
  `MoveNotice`; `data-lists`), `TabBar` (no `lists` prop), `App.svelte`
  (`lists` and `storedList` only with `app.cloudLists`; else the not-found
  branch). The `<AddToList` mount points draw nothing with no cloud.
- `dict.ts`: delete the move, banner, storage and browser-group keys
  (`noStorage*`, `badStorage*`, `localOnly*`, `localReadOnly*`, `moved*`,
  `moving`, `moveFailed`, `moveAttention*`, `moveHeldWhy`, `moveBanner*`,
  `groupBrowser`, and `readMore`, `noLists` when unread).
- `help.ts` `LISTS` paragraph 2 becomes, verbatim: «Войдите - и списки
  будут храниться в аккаунте: они сохраняются сами и открываются на любом
  устройстве.» / "Sign in and your lists are kept in your account: they
  save themselves and open on any device."
- Harness: `driver.js` (`today` goes, `moveSettled` becomes `settled` and
  reads `data-lists`; every caller in `golden.js`, `sweep.js`,
  `contracts.js`, `states.js`), `golden.js` (`# today:` goes),
  `golden.test.mjs` (the dated-states block goes); `states.js` deletes
  cases 7, 20, 25, 34, 47, 48, 51 and every browser-list step left;
  `inventory.js` deletes every state that seeds `dhloot.lists.v2` or
  `dhloot.migrated.v1` or sets `today`, or ports it to SHOP as `gm1` with
  the same `enter` when no `as gm1` state shows that list page behaviour;
  record and table states drop their `two`/`twelve`/`seven` storage;
  `print.js`'s signed-out browser-list print check, the golden `#/lists/a ~
  print signed out` and the sweep row «печать без входа: список» go.
- `routes.json`: the `#/lists` row's `tab` is `null`.
- Specs: section 7's row. `STATE.md`'s keys table keeps the live keys and
  adds one paragraph "Left in the browser" (the five keys; the app reads,
  writes and deletes none of them since R10); "Two tabs" keeps only the
  account paragraph; "The list migration" goes; "Storage that throws ...
  runs without lists" becomes "... runs on its defaults". `FEATURES.md`
  "Chrome": nine tabs. `FEATURES.md`, "Consistency rules", rule 4 ("One
  name"): the departure "until 2026-10-26" for «Списки» goes, because the
  tab goes and every other place already says «Мои списки». `CONTRACTS.md`
  section 4, "Formatted text": the `dhloot.lists.v2` row goes.
- `DEBT.md`: delete D24, D63 and D64. The section stays for `B10.4` and
  `B10.5`.
- P36 (carry, context.md): its own acceptance line - `git grep -n -E "(app\.js|style\.css)[: ]+[0-9]" -- app/src`
  prints nothing, or only lines that are not citations, each named in the
  handoff. Each citation becomes `git show 23c00a6^:app.js` (or
  `style.css`) with the function or selector name, or the comment goes when
  the code says it. No behaviour change, no golden move from P36.
- One decision file (settled items 3, 4, 6, 9; "Superseded in part by"
  lines on `2026-09-26-the-test-builds-clock-is-pinned-before-the-cutoff.md`
  and `2026-09-26-browser-lists-are-read-only-while-the-move-is-due.md`),
  `node tools/decisions.js`.
- Standing checks at its refresh: the States table covers `#/lists` and a
  list page signed in, signed out and unconfigured, at 360 and 1180; the
  error scenarios cover a stale tab of the previous bundle (its browser
  lists are left in storage, unread) and a revert (the previous bundle
  reads the keys again, writable before the date only).
- Acceptance: the section 6 grep prints only `tests/db/legacy-move.test.mjs`,
  `tests/db/delete-account.test.mjs`, the applied migrations and
  reversals, `usage.mjs`'s comment and `.claude/README.md` rows (all
  `B10.5`'s, the applied files locked); `git grep -n legacy_fingerprint -- app/src tests/e2e tests/app tools`
  prints nothing; nine tabs in every golden; no golden or states case sets
  `today` or seeds a `dhloot.*` list key; CI's `e2e` passes without F9 and
  case I; CI's `check:built` budget passes for both builds.

## 12. Batch B10.4 - the first read takes heads (outline; P6, D115)

Objective: a signed-in page load reads each list's head and its entries'
identities, not their details; a list's details load when a caller needs
them (section 4, "P6"). Carry P6 is its own acceptance line.

- Ports: `ListRepository.list(known)` reads `LIST_HEAD_SELECT`; add
  `rows(ids)` (chunks of `CHANGED_ROWS_MAX`, a failed chunk fails the
  read); `ListRow` splits into a head row and a full row. `fake-cloud.ts`
  mirrors both; `cloud.contract.ts` gets cases for the head shape (no
  `quantity`, `price_coins`, notes or `gm_only` in it) and for `rows`
  (order, chunks, a deleted list answers nothing).
- State: `CloudLists` keeps a per-list detail state (`absent`, `loading`,
  `ready`, `error`) and `detail(ids): Promise<boolean>`; a re-read by
  revision re-reads the heads and the rows of each detailed list that
  changed; a write that copies an entry's meta (`restoreEntry`'s callers:
  the list page's row remove and sell undo, the add-to-list menu's
  remove-with-undo) runs only on a detailed list. `relinkAs` runs on a list
  with heads only: the server keeps the row's meta, and the local `meta`
  moves only when it is present («Сохранить себе» never waits for a detail
  read; `docs/decisions/2026-10-21-each-save-to-my-items-press-makes-a-new-copy.md`).
- The guards of the detail read (R2 of the plan review), each its own
  acceptance line with a `fake-cloud` case, and a `cloud.contract.ts` case
  where the real adapter takes part:
  - a detail answer that overlaps a local edit or a buffered write is
    dropped and read again when idle (as `#pull` does with `#edits` and the
    queue), or the store flushes first; an add from the menu followed by
    «Открыть» inside the 2 s quiet window keeps the added row;
  - a list this tab makes (`create`, the menu's new list) is detailed at
    birth, and its detail read never runs before its `create` has flushed;
  - a re-read of a detailed list applies the new head together with its
    rows, or not at all; when the rows read fails, the store keeps the last
    detailed list and sets the detail state to `error`, never a head without
    `meta`;
  - the detail state, not the presence of `meta`, decides "detailed";
    `add()` on a list with heads only writes `meta` for the added keys only
    (`withIds`);
  - an answer whose revision is older than the held one is dropped, as in
    `#apply` (with the epoch and `#readSeq` checks of `#pull`).
- Consumers: `ListPage` draws «Загружаем...» until its list is detailed and
  after a failed detail read a load line with «Повторить» in the wording
  of rule 2 ("Failures", `FEATURES.md`, "Consistency rules");
  `SharePanel`, `RequestsPanel`, the copy text and the print of a list
  read the open list; `exportLists` and `exportData` await `detail` of
  every named list, and a failed read toasts `accountFailed`;
  `SharedListPage`'s `hiddenN` calls `detail([mine])` on the owner's own
  players' link, with a unit case: the owner's players' link of a list with
  heads only and one GM-only entry counts it.
- The add-to-list menu's remove-with-undo (`AddToList.pick` is synchronous
  today) is its own acceptance line: the chip reports busy (`aria-busy`,
  disabled) while the detail read runs, a failed read toasts
  `cloudLoadFailed` and removes nothing, and the busy state has axe
  coverage. Or the refresh names why the remove can wait with no state.
  Section 2's "No new UI" allows this one state.
- `tests/db/`: a case on the 3x seed of `delete-account.test.mjs` (with
  `analyze`) that times the head select's SQL and bounds its JSON at 6 MB
  (the est. 4-5 MB plus a margin); `check:db` runs it. This bound is the
  gate that does not depend on the host.
- The browser bar: the configured build, the local stack, the 3x seed with
  `analyze`, an idle host, 1180 px; from navigation start to the moment
  `cloud.status` is `ready` and the cards draw; the median of three runs
  under 4000 ms. The same bar for `#/lists/<the largest list>` drawing its
  rows (one more round trip after P6). Record the request count and the
  bytes of each signed-in page state at 3x before and after the batch;
  explain the extra reads per state (D115 measured 82-217 MB, up to 2.6
  full reads) before a miss sends the batch to the RPC fallback. The
  results go to the handoff and to `FEATURES.md`.
- Specs: `FEATURES.md` ("Account and browser lists": the first read, the
  list page's wait), `COVERAGE.md`, the decision file
  `docs/decisions/<date>-the-first-account-read-takes-list-heads.md` from
  section 4, "P6" (with "Amends" the 2026-10-22 requests decision and the
  2026-10-02 re-read decision), `node tools/decisions.js`.
- `DEBT.md` (after the owner's Q2, section 4): with A, D115 is deleted
  when the changed criterion and the defined bar pass, and the decision
  file records the changed criterion as a deviation from the carry, which
  the closeout names to the owner; with B, the batch follows the RPC
  fallback and the original line. If the batch cannot pass, D115 stays
  with its measured numbers updated.
- Standing checks at its refresh: a States table for the list page's new
  wait (empty, one, many, 3x lists; 360 and 1180); error scenarios for a
  failed detail read, offline, a list deleted while its details load, a
  stale tab, a revert (the previous bundle reads full rows again; nothing
  stored changes).
- Acceptance: carry P6 closed (D115 deleted, after Q2); the first read
  carries no entry note, quantity, price or GM-only flag (contract case);
  the head JSON at 3x is at most 6 MB (`check:db`); the defined bar met on
  `#/lists` and on the largest list's page, with the requests and bytes
  per state recorded; each guard of the detail read passes its cases; the
  `hiddenN` case and the add-to-list busy state pass; «Сохранить себе»
  relinks a list with heads only (a case); every consumer of `meta` reads a
  detailed list
  (`git grep -n -E "\.meta\b|itemMeta\(" -- app/src` reviewed in the
  handoff).

## 13. Batch B10.5 - the migration (outline; Q1 B)

Objective: no database function inserts past a count limit, nothing of the
move is left that a client can call, and the fingerprint column is gone.

**Order (the precondition of the column drop).**

1. `B10.3` landed on the branch: `git grep -n legacy_fingerprint --
   app/src tests/app tests/e2e tools` prints nothing. `B10.5`'s first step
   re-runs the grep and stops if anything is printed.
2. The test project: after the batch review approves, the push runs CI's
   `migrate-test` (it applies the branch's new file) and `e2e` with the R10
   client. From then until R10 lands on `main`, the test project has no
   column and no function while `main`'s client still selects the column
   and contract case I calls the function, so a `main` run or another
   branch's run of `e2e` in that window fails (every push of a task branch
   runs `e2e`). So, before the push, `gh run list --workflow ci.yml --status
   in_progress` and `gh run list --workflow ci.yml --status queued` show no
   run of another branch, and no other session pushes until `main`'s run
   after the squash is green; the closeout runs right after `B10.5`'s CI
   credit (the window is about one CI run and the squash). A
   computed-column shim for `legacy_fingerprint` is rejected: it keeps the
   reads but not case I and F9, and it works against Q1 B.
   - The stall rule: if a red after `B10.5`'s push needs a remediation and
     keeps the window open, the owner applies `B10.5`'s reversal to the test
     project by the orphan procedure of `.claude/README.md`, "Branch
     migrations on the test project" (the reversal with `psql`, then the
     version's row deleted from `supabase_migrations.schema_migrations`);
     the next push of R10 applies the migration again.
   - Another branch's `e2e` is green again once it merges `origin/main`
     after R10 lands; the closeout names each open `claude/*` branch that
     must do so before its next push (section 15).
3. Production: the squash onto `main` holds the R10 client and the
   migration; CI runs `migrate-prod` before `deploy` in one run. Between the
   two, and in every tab still on a pre-R10 build until it reloads, account
   list reads fail. The owner accepted this (Q1 B).
4. Rejected: two squashes (the client first, the migration later) - one
   task lands as one commit (`CLAUDE.md`, "Source and commit conventions").

**Steps.**

- `supabase/migrations/<ts>_drop_legacy_move.sql` (a timestamp after every
  applied one): `drop function public.move_legacy_list(uuid, text);`;
  `create or replace function public.lists_limit()` copied whole from
  `20260925130400_legacy_move.sql`, header included (`returns trigger`,
  `language`, `security definer`, `set search_path = public, pg_temp`),
  less the `dhloot.move` guard; `create or replace function
  public.list_entries_limit()` copied whole the same way from
  `20260930121000_list_entries_statement_triggers.sql`, less the guard
  (`create or replace` takes its attributes from the new statement, so a
  missing header makes the function invoker with no fixed `search_path`,
  and the up-down-up walk cannot see it); the triggers stay; the `revoke
  execute ... from public, anon, authenticated` lines repeated; `drop index
  public.lists_legacy_fingerprint;`; `alter table public.lists drop column
  legacy_fingerprint;`. A two-line header comment cites the decision file.
- `supabase/reversals/<same name>`: in reverse order - the column with its
  check (`legacy_fingerprint text check (legacy_fingerprint ~
  '^[0-9a-f]{64}$')`), the unique partial index on `(owner_id,
  legacy_fingerprint) where legacy_fingerprint is not null`, the two limit
  functions with the guard (each copied whole, header included), and the
  function as
  `20260925130500_legacy_move_conflict.sql` made it (body, `revoke` from
  `public, anon`, `grant` to `authenticated`). Copy each text from the
  applied files. The values are not restored (the walk compares the schema
  only).
- `tests/db/legacy-move.test.mjs` is replaced by
  `tests/db/legacy-move-dropped.test.mjs`: a signed-in call of
  `move_legacy_list` is refused as an unknown function (`42883`);
  `public.lists` has no column `legacy_fingerprint` (`pg_attribute`) and no
  index `lists_legacy_fingerprint` (`pg_class`); with
  `set_config('dhloot.move', 'on', true)` in the transaction, a list past
  `lists_per_owner` and an entry past `entries_per_list` are still refused
  (`P0001`); after the migration and after the reversal, `lists_limit` and
  `list_entries_limit` have `prosecdef` true and `proconfig`
  `{search_path=public, pg_temp}`, and `public`, `anon` and
  `authenticated` have no EXECUTE on them. `tests/db/delete-account.test.mjs` and every other file that
  names the function or the column lose it (`git grep -n -E
  "move_legacy_list|legacy_fingerprint" -- tests/db`).
- `tools/supabase/usage.mjs` (the comment near "move_legacy_list can pass
  a"): no function passes a limit since R10; lists above 100 % are those
  moved before it.
- `.claude/README.md`: "Expected Security Advisor warnings" loses the
  `move_legacy_list` row, and its counts are re-counted from the rows that
  remain; "Usage monitoring": "above 100 %, which `move_legacy_list`
  allows" becomes "above 100 %, for lists moved in before R10"; "Undo a
  deploy that carried a migration" gains a paragraph "To undo
  `<ts>_drop_legacy_move`", in the form of the
  `20261010120000_drop_list_entry_snapshot` paragraph, with three facts:
  (a) the app alone cannot be reverted: every frontend before R10 selects
  `legacy_fingerprint`, so every account list read fails; push the
  reversal in the same push as the app revert (`migrate-prod` runs before
  `deploy`); (b) for 30 days `restore:prod` and `restore:drill` of a
  nightly backup made before the migration fail until the reversal is
  pushed, because the dump's `lists` inserts name the column; a drill of a
  backup made after the push needs nothing; (c) the reversal brings the
  column back with nulls; the values come back only from a restore of a
  backup made before R10, after the reversal.
- `COVERAGE.md`: the layer 3 row of `legacy-move.test.mjs` becomes the new
  file's.
- `DEBT.md`: delete D62, and the "Legacy removal" section when it is empty.
- The Q1 decision file
  `docs/decisions/<date>-r10-drops-the-move-function-and-the-fingerprint-column.md`
  (task, decision, rejected A and C, closes D62, "Supersedes in part"
  `2026-09-26-a-browser-list-moves-into-the-account-through-one-rpc.md`,
  which gets the matching line); `node tools/decisions.js`.
- Standing checks at its refresh: no screen changes; the error scenarios
  are the order above (a stale tab, the test project window and its stall
  rule) and the revert: (a) no app-only revert after R10 - the reversal
  goes in the same push as the app revert; (b) a restore or a drill of a
  backup made before the migration fails until the reversal is pushed;
  (c) the reversal restores the shape with null values; the values come
  back only from a restore of a pre-R10 backup after the reversal.

**Acceptance.**

- `git grep -n -E "move_legacy_list|legacy_fingerprint|dhloot\.move" -- app/src tests tools .claude/README.md docs/specs`
  prints only the new migration, its reversal, the new test file, and the
  applied migrations and reversals.
- `npm run check:db` passes, the reversibility walk and the
  `prosecdef`/`proconfig`/EXECUTE assertions after the up and after the
  reversal included.
- `.claude/README.md` holds the paragraph "To undo
  `<ts>_drop_legacy_move`" with facts (a), (b) and (c).
- Right before the push, the two `gh run list` checks of "Order", item 2,
  show no run of another branch.
- After the approve and the push: CI's `migrate-test` applies the file and
  `e2e` passes (contract cases without I, flows without F9).
- `DEBT.md` holds no D62 and no "Legacy removal" section.

**Flow.** `orchestrate.prompt.md`, "Schema batches": the implementer stops
after `rtk npm run check:fast`, `npm run check:db` (PowerShell tool) and
the commit, unpushed; after the approve, the push and the CI credit. The
outage path only: `node --env-file=.env.test.local
tools/supabase/db-push.mjs --project test --yes` and a local `npm run
e2e`, after one `gh run list --workflow ci.yml --status in_progress` check.

## 14. Risks, assumptions, deferred

- Risk (accepted by the owner, Q1 B): a tab of a pre-R10 build open across
  R10's `migrate-prod` fails its account list reads («Не получилось
  загрузить списки аккаунта.» and «Повторить») until it reloads; no row is
  lost.
- Risk: the test project window (section 13, "Order", item 2). Mitigation:
  `B10.5` is the last batch, pushed only when the `gh run list` checks show
  no run of another branch, with no other push until `main`'s run after
  the squash is green; the stall rule reverses the migration on the test
  project if a remediation keeps the window open.
- Risk: the fingerprint values leave the live database. Nothing reads them
  after the move. The reversal brings the column back with nulls only; the
  values come back only from a restore of a backup made before R10 (the
  nightly backups of the last 30 days), after the reversal. Until the
  reversal is pushed, `restore:prod` and `restore:drill` of such a backup
  fail, because its `lists` inserts name the column. No app-only revert
  exists after R10: the reversal goes in the same push as the app revert
  (section 13, the `.claude/README.md` paragraph).
- Risk: a port loses coverage silently (`B10.1`, `B10.2`). The per-file
  thresholds of `check:fast` and CI catch a file that drops below its line;
  the reviewer compares the deleted and the ported case lists.
- Risk: golden churn hides a real change. `B10.1` and `B10.3` read
  `git status -- tests/app/snapshots` after the update, and the handoff
  lists the changed states by group.
- Risk: P6's identity rows miss the 4000 ms bar at 3x. Fallback in
  section 4, "P6".
- Assumption: no reader needs a browser list after 2026-10-26 that the move
  did not carry (owner decision 2026-09-27).
- Deferred, named to the owner at closeout, not built: a clean-up of
  `StoragePort`'s keyed `onExternalChange` signal once nothing reads it.

## 15. Owner steps at R10's closeout

1. Before the landing: the decision files of `B10.3`, `B10.4` and `B10.5`
   are in the branch, and no other branch has a queued or running CI run
   (section 13, "Order"). The closeout report names each open `claude/*`
   branch (by `git branch -r --list "origin/claude/*"`) that must merge
   `origin/main` before its next push; without the merge its `e2e` fails,
   and the failure looks like its own bug.
2. After `migrate-prod` and `deploy`: reload every open tab of the site;
   open an old `#/l/` link on a phone and a desktop (the not-found page,
   the address kept); the tab bar has nine sections; a signed-in account's
   lists, share links and requests work.
3. Re-run the Security Advisor on both projects and confirm the warning
   count `B10.5` wrote into `.claude/README.md`.
