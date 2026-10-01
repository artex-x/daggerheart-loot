# Plan - TASK persist-10-legacy-removal

## Status

- Planning pass 1, 2026-10-01, planner, at HEAD `930dc986` (R7b built,
  unpushed). Mode A: no plan existed.
- Not dispatchable before 2026-10-26: R10 is the first release dispatched
  after `LEGACY_WRITE_UNTIL`. Order (owner, 2026-10-01): R7c, R7d, R8, R9,
  `debt-cleanup`, `persist-review`, R10.
- Batches: `B10.1` (implement-ready), `B10.2`, `B10.3`, `B10.4` (outlines).
  None started.
- NEEDS_HUMAN_CONFIRMATION: no. Q1 answered by the owner 2026-10-01:
  option B - `B10.4` drops `move_legacy_list`, the `dhloot.move` guard in
  both limit triggers, `lists.legacy_fingerprint` and its index (section 4).
- Plan review: required before B10.1 (trigger: a public contract change -
  the `#/l/` route, `docs/fixtures/lists/`, `tests/contracts.js`,
  `CONTRACTS.md` section 3 and `llms.txt` in `B10.1`, `routes.json` in
  `B10.3`; and a migration in `B10.4` that drops a SECURITY DEFINER
  function and drops a column with its stored values)
- Dispatch refresh (mandatory, section 6): the planner re-reads this plan
  against the tree at dispatch, because R7c-R9, `debt-cleanup` and
  `persist-review` land first.

## 1. Objective and current state

Objective: after the legacy write cutoff, remove the browser list model and
everything that served it, so the app has one list model (account lists)
and one link format (`#/s/<token>`). Source of the scope: the roadmap
`issues/persistent-storage/plan.md` section 9 (R10 row) and section 10
(list (c)); the owner decision
`docs/decisions/2026-09-27-r10-removes-browser-lists-and-the-move.md`.

State at HEAD `930dc986` (verified 2026-10-01):

- The codec is `app/src/lib/listLink.ts` (there is no `codec.ts`): encode,
  decode, base64url, the stamp, plus the shared types `ListEntryMeta`,
  `ListShape`, `DecodedList`, `QTY_MAX` and a `MoneyMode` re-export that
  13 modules import. Packed links use `Env.compress`
  (`app/src/ports/compress.ts`).
- `hash.ts` parses `#/l/...` to `{ kind: 'sharedList', payload, packed }`;
  `App.svelte` sends `storedList` and `sharedList` to `ListPage.svelte`,
  which draws an own browser list, the retired page after the date, or
  mounts `SharedListPage` with `payload`.
- `ListStore` (`state/lists.svelte.ts`) holds browser lists, the two-tab
  merge, the `.bad` backup, `dhloot.migrated.v1` and the move's settle
  step; it also declares `ListModel`, which `CloudLists` implements.
- `LegacyMove` runs the move through `ListRepository.move`
  (`move_legacy_list`). `MoveNotice` (Shell), `MoveStatus` and
  `StorageNotice` (lists index and list page) draw its states.
- The date gates: `AppState.legacyWritable` (`!env.cloud ||
  legacyWritable(clock.now())`), `localWritable`, `moveDue`, `TabBar`'s
  `lists` prop. The test build pins its clock at 2026-10-01 12:00 UTC
  (`TEST_NOW`), and `?today=` moves it; four goldens and states case 48
  run after the date.
- A build with no sign-in configured keeps writable browser lists for good
  (`legacyWritable` is true with no cloud).
- Many tests use a browser list only as a fixture for list page behaviour:
  `listPage.test.ts` (about 90 references), `listsPage.test.ts`,
  `components/lists.test.ts`, `a11y.test.ts`, `state/app.test.ts` (about
  150), states cases 13, 17, 18, 22, 26, 27, 30, 32, 33 and 62 (case 62
  even seeds account lists through the move), and about 40 goldens.

## 2. Scope and non-goals

In scope (owner decision 2026-09-27 and roadmap section 10 (c)):

- The codec, its fixtures, the list-encoding half of `tests/contracts.js`,
  the link half of `tests/app/contracts.js`, `CONTRACTS.md` section 3
  (a one-line history pointer stays), the `llms.txt` `#/l/` address, the
  `ROUTES.md` `#/l/` rows, the `#/l/` share buttons and address rewriting,
  the packed-link expansion and `Env.compress`, the `#/l/` shared page and
  the retired page. `#/l/<anything>` draws the not-found page, the address
  kept, never home. `#/print/<id>*<n>` keeps its spelling.
- `ListStore` and every browser list surface: the browser group of
  `#/lists`, browser lists in the add-to-list menu, `StorageNotice`,
  `MoveNotice` (with R5b's signed-out banner), `MoveStatus`, `LegacyMove`,
  `lib/legacy.ts`, the move's client path (`ListRepository.move`, its fake,
  contract case I, e2e F9), the date gates, `?today=`, the Lists tab.
- The database (Q1 B): `move_legacy_list`, the `dhloot.move` guard in the
  two limit triggers, `lists.legacy_fingerprint` and its unique index
  `lists_legacy_fingerprint`.
- `DEBT.md`: D24, D63 closed (their code is deleted); D62 closed by
  `B10.4`; D64 edited (its `MoveNotice` half goes with the component).
- Every spec, README and help text that describes the removed behaviour.

Non-goals:

- No key is deleted or written: `dhloot.lists.v1`, `dhloot.lists.v2`,
  `dhloot.lists.v2.bad`, `dhloot.migrated.v1`, `dhloot.warn.v1` stay in the
  browser, unread (owner decision; `STATE.md`).
- D64's «Выйти» half and D66 (owner, 2026-10-01: `debt-cleanup`). D61 is
  not a removal, so it is `debt-cleanup`'s too; R10 does not fix it.
- No new UI, no new copy beyond the shortened help paragraph (`B10.3`).
- No change to `#/s/`, the import file, the data zip or the account page.

## 3. Settled decisions and their consequences

Settled by the owner (2026-09-27, 2026-10-01) or by the repository; the
implementer does not reopen them.

1. **`#/l/` is a recognised address that draws the not-found page.**
   `parseHash` returns `{ kind: 'retired' }` for every hash that starts with
   `l/` (plain, packed `l/~`, empty or broken payload). No branch of
   `App.svelte` draws `retired`, so the last branch draws the existing
   not-found page («Предмет не найден», «Возможно, ссылка устарела или
   данные были изменены.», «На главную»); `#fallback` keeps the address
   because the kind is not `unknown`. The payload is never read. Why a kind
   and not `unknown`: `unknown` sends the reader home, which the owner
   refused.
2. **The shared types leave the codec.** `ListEntryMeta`, `ListShape` and
   `QTY_MAX` move to `lib/lists.ts`; `DecodedList` moves to
   `lib/cloudLists.ts` beside `sharedListOf` and is renamed `SharedList`
   (the projection a share page draws; nothing decodes any more);
   `KnowsId` is deleted; importers of the `MoneyMode` re-export import it
   from `lib/money.ts`.
3. **A build with no sign-in configured has no lists.** The decision says
   the app never reads `dhloot.lists.v2` again, and in such a build lists
   existed only there. From `B10.3`: `#/lists` and `#/lists/<id>` draw the
   not-found page, the address kept (as `#/homebrew` does), and no
   add-to-list control is drawn. Production is always configured; the
   unconfigured build is a developer's and the `dist/` budget's.
   `META.md` section 3's "keeps making browser lists" bullet goes.
4. **An old `#/lists/<local id>` bookmark is not found.** The redirect of a
   moved list's local id to its account list reads `dhloot.migrated.v1`,
   which is move support. From `B10.3` such an address draws the list
   page's existing not-found state.
5. **`ListModel` is deleted.** With `ListStore` gone, `CloudLists` is the
   one implementation; `ListPage`, `ListsPage` and `AddToList` use it
   directly, and `AppState.storeFor` goes (`CLAUDE.md`: no abstraction
   ahead of need).
6. **The test build keeps a fixed clock, without `?today=`.** `TEST_NOW`
   stays: the export file names and the toast hold read `env.clock`. Only
   the day switch goes (`queryClock` keeps `?toasts=held`), with the
   driver's `today`, `golden.js`'s `# today:` header and the dated-states
   block of `golden.test.mjs`.
7. **The capture signal `data-move` becomes `data-lists`.** `<main>`
   carries `data-lists`: `pending` while the session is unknown (a build
   with sign-in), the account lists' status (`idle`, `loading`, `ready`,
   `error`) signed in, absent signed out or with no sign-in. The driver
   verb `moveSettled` is renamed `settled` and waits for `data-lists`
   absent, `ready` or `error`, and `data-homebrew` as now. e2e's
   `settled(page, ...)` reads the same attribute.
8. **The heading "Account and browser lists" stays in `FEATURES.md`.**
   33 files cite it (2026-10-01), two of them applied migrations that
   `edit-guard.mjs` locks. The section's first paragraph says that browser
   lists left the app at R10.
9. **Nine tabs in every build.** `TabBar` loses its `lists` prop; `#/lists`
   stays a section route (the account menu's «Мои списки», a bookmark, a
   pin). `routes.json`'s `#/lists` row gets `"tab": null`.
10. **No decision file is written by this pass.** `B10.3` writes one for
    settled items 3, 4 and 6 and adds "Superseded in part by" lines to
    `2026-09-26-the-test-builds-clock-is-pinned-before-the-cutoff.md`
    and `2026-09-26-browser-lists-are-read-only-while-the-move-is-due.md`
    (`B10.4`'s decision adds the line to
    `2026-09-26-a-browser-list-moves-into-the-account-through-one-rpc.md`);
    `B10.4` writes the Q1 decision (section 4, "Decision for `B10.4` to
    write"). Each runs `node tools/decisions.js`.

## 4. Owner questions

**Q1 - answered 2026-10-01 (owner): B.** `B10.4`'s migration drops
`move_legacy_list`, the `dhloot.move` guard in `lists_limit` and
`list_entries_limit`, the column `lists.legacy_fingerprint` and its unique
index `lists_legacy_fingerprint`. The owner accepts that a tab still on the
R9 build fails its account list reads until it reloads: its select names
the column (`ports/supabase.ts`), and PostgREST refuses a select of a
column that does not exist.

Rejected, for the decision file: A (keep the column and the index until a
later schema release - dead schema with no owner, and a second migration
to remember); C (revoke EXECUTE only - dead SECURITY DEFINER code and its
Security Advisor row stay).

**Decision for `B10.4` to write** (`docs/decisions/<date of B10.4>-r10-drops-the-move-function-and-the-fingerprint-column.md`,
template `.claude/templates/decision.template.md`, then `node
tools/decisions.js`):

- Task: `persist-10-legacy-removal` (owner, 2026-10-01, Q1 B).
- Decision: R10's migration drops `move_legacy_list(uuid, text)`, the
  `dhloot.move` guard in `lists_limit()` and `list_entries_limit()`,
  `lists.legacy_fingerprint` and the index `lists_legacy_fingerprint`. The
  R10 build stops selecting the column before the migration reaches
  production (`B10.3` precedes `B10.4` in the one release commit, and CI's
  `deploy` follows `migrate-prod` in the same run). A tab still on a
  pre-R10 build fails its account list reads until it reloads; the owner
  accepts that. No list or entry row is deleted; only the fingerprint
  values go, which nothing reads after the move.
- Rejected: keeping the column and the index until a later schema release
  (dead schema with no owning release); revoking EXECUTE only (dead
  SECURITY DEFINER code and its Security Advisor row stay).
- Closes `DEBT.md` D62. Supersedes in part "A browser list moves through
  one RPC that hashes its canonical text" (2026-09-26): the RPC and the
  fingerprint are gone.

No other owner question: settled items 3 and 4 follow from the owner's
"the app never reads, draws or moves them"; they are named here so the
owner can object before the plan review.

## 5. What the app looks like after R10

- `#/l/...`: the not-found page, address kept, signed in or out.
- `#/lists`: signed in, the account lists (heading «Ваш аккаунт», the batch
  bar, the cards, import); signed out, the sign-in prompt panel only; no
  sign-in configured, the not-found page.
- `#/lists/<uuid>`: the account list page; any other id, the page's
  not-found state.
- The tab bar: nine sections. The header: no banner under it.
- The add-to-list menu: account lists only (signed in), the sign-in prompt
  (signed out), nothing (no sign-in configured).
- Modules deleted: `lib/listLink.ts`, `lib/legacy.ts`,
  `ports/compress.ts`, `state/lists.svelte.ts`,
  `state/legacyMove.svelte.ts`, `components/MoveNotice.svelte`,
  `MoveStatus.svelte`, `StorageNotice.svelte`, and their tests.
- `localStorage` keys the app reads: `dhloot.lang.v1`, `dhloot.home.v1`,
  `dhloot.prefs.v1`, `sb-<ref>-auth-token*`. `dhloot.probe` and
  `StoragePort.works()` go with the storage warning (their only readers
  were `StorageNotice` and `LegacyMove`).
- The database (Q1 B): `lists_limit` and `list_entries_limit` count every
  insert; no function inserts past a limit; `public.lists` has no
  `legacy_fingerprint` column and no `lists_legacy_fingerprint` index.

## 6. What an earlier release may move (the dispatch refresh)

R7c, R7d, R8, R9, `debt-cleanup` and `persist-review` land before R10.
At dispatch the planner refresh does, in order:

1. Confirm the date: `LEGACY_WRITE_UNTIL` in `app/src/lib/legacy.ts` still
   reads `Date.UTC(2026, 9, 26)` and today is on or after it. If the owner
   moved the date, R10 waits.
2. Re-run the inventory and update section 9's file lists:
   `git grep -n -E "listLink|PACK_MARK|sharedList|compress|legacyWritable|localWritable|moveDue|legacyMove|LegacyMove|MoveNotice|MoveStatus|StorageNotice|ListStore|app\.lists\b|storageWorks|warnHidden|followMoved|today|moveSettled|dhloot\.lists|dhloot\.migrated|move_legacy_list|legacy_fingerprint" -- app/src tests supabase tools docs/specs llms.txt README.md README.ru.md`.
3. Known overlaps to check: R8 adds `art_url` to the list or homebrew
   select strings in `ports/supabase.ts` (beside `legacy_fingerprint` at
   line 244 today); R9 adds `#/print/list/<id>` and `#/print/s/<token>` to
   `hash.ts`, `routes.json` and `ListPage`'s print button; R7c and R7d may
   change `ListPage`, `AddToList`, `ImportPanel`, `lib/bundle.ts` (it
   imports `QTY_MAX` from `listLink.ts`) and the fake seed; R7d adds
   `import-v2` fixtures (untouched by R10); new states cases and goldens
   may seed `dhloot.lists.v2` - they join `B10.2`'s port list.
4. `DEBT.md`: if `debt-cleanup` already closed or moved D64, drop `B10.3`'s
   D64 line; if D61 is still under "Legacy removal", name it to the owner
   (it is not R10's). Re-read D24, D62, D63.
5. Re-measure the gate costs on the host (context.md, "Command costs").

## 7. Contracts and specs changed, by batch

| Batch | Public contract | Specs and docs |
|---|---|---|
| `B10.1` | `#/l/` grammar (`ROUTES.md`, `CONTRACTS.md` section 1), `CONTRACTS.md` section 3 (history line), `docs/fixtures/lists/*.json` deleted, `routes.json` `#/l/` rows, `tests/contracts.js`, `llms.txt` | `FEATURES.md` ("Lists", "Account and browser lists": the `#/l/` paragraphs), `STATE.md` (hash row, `dhloot.auth.return`, `openList`/`urlPayload`), `META.md` section 3 (`#/l/` bullets), `COVERAGE.md` (link rows), `README.md`, `README.ru.md` (link format, two link buttons), `help.ts` (the browser-list buttons paragraph), `.claude/README.md` line 181 |
| `B10.2` | none | `COVERAGE.md` (the ported cases' rows) |
| `B10.3` | `routes.json` `#/lists` `tab: null` | `STATE.md`, `FEATURES.md`, `ROUTES.md` ("Sections", `#/lists/<listId>`), `META.md` section 3, `COVERAGE.md`, `I18N.md` (the cutoff bullet), `DEBT.md` (D24, D63 deleted, D64 edited), `README.md`, `README.ru.md` ("Where lists live", "What the app remembers"), `help.ts`, one decision file |
| `B10.4` | none | `DEBT.md` (D62 deleted, the section deleted when empty), `COVERAGE.md` (layer 3 rows), `.claude/README.md` ("Expected Security Advisor warnings", "Usage monitoring"), one decision file |

## 8. Batches

Costs: context.md, "Command costs" (one green pass, idle host). "check" is
`npm run check` (~7 min), a golden pass is four shards (~13 min).

| Batch | Goal | Gates (cost) | Review | Split criterion from the previous batch |
|---|---|---|---|---|
| `B10.1` | Retire `#/l/`: the codec, the compress port, the `#/l/` pages, buttons and rewriting, the contract fixtures and tests, the specs; `#/l/` draws the not-found page | check x2 (14), `contracts,dataint` (1), `build:test` (1), `app/contracts,app/states` (10), goldens compare then update (26), `sweep.js 360` (8), `check:built` (1) - about 61 min | required: public contract | - (first batch) |
| `B10.2` | Port every test that uses a browser list only as a fixture onto an account list of the fake cloud; no production change | check x2 (14), `build:test` (1), `app/states` (5) - about 20 min | required: harness changes that later batches rely on (reviewer judges against `COVERAGE.md`) | a commit boundary the harness cannot reach: `B10.3` deletes browser lists, so its states and unit cases need account-list fixtures first; and a review not held in one pass (harness against `COVERAGE.md` vs production removal against the architecture boundaries, the `B12b`/`B12c` precedent) |
| `B10.3` | Remove browser lists and the move: `ListStore`, `LegacyMove`, the three notices, `legacy.ts`, the date gates, `?today=`, the Lists tab, the move's client path, the unconfigured build's lists | check x2 (14), `check:built` and the configured budget (2), `build:test` (1), filter group `app/print,app/contracts,app/states,app/typo,app/hues,stub` (8), goldens compare then update (26), `sweep.js 360` (8), `npm run e2e` (2) - about 61 min | required: UI changes on every page (tab bar, banner), a public contract fixture (`routes.json`) | a different route and filter set from `B10.1` (`#/lists*`, the header on every route, versus `#/l/*` and the contract suites), and a review not held in one pass |
| `B10.4` | The migration (Q1 B): drop `move_legacy_list`, the `dhloot.move` guard, `lists.legacy_fingerprint` and its index; its reversal, `tests/db/`, D62 | check (7), `check:db` (9); after the approve `db:push --project test` (1) and `npm run e2e` (2) - about 19 min | required: a migration that drops a SECURITY DEFINER function and a column | a commit boundary the harness cannot reach: layer 4 (contract case I, e2e F9) calls `move_legacy_list`, and the client selects `legacy_fingerprint`, until `B10.3` removes both; and the schema batch rule (`orchestrate.prompt.md`, "Schema batches") |

Total gate cost: about 161 minutes for one green pass of the four batches,
plus the closeout's check (~7 min) - about 2 h 50 min, before review and
remediation cycles. No batch needs more than one foreground `npm run check`
per commit; every listed run fits one Bash call (one shard or one width per
call).

Merges considered and rejected: `B10.1`+`B10.3` (one review over about 90
paths and two contract surfaces; a stall forfeits both); `B10.2`+`B10.3`
(the test port and the deletions in one diff hide which red belongs to
which); `B10.3`+`B10.4` (the schema review and its push wait would hold the
whole removal).

## 9. Batch B10.1 - retire `#/l/` (implement-ready)

**Objective.** An old `#/l/` link draws the not-found page with its address
kept, and nothing in the app reads, writes or documents the list link
format any more. Browser lists stay (read-only after the date, as today)
until `B10.3`.

**In scope.** Settled items 1 and 2 (section 3); every file below.

**Out of scope.** Browser lists, the move, the notices, the date gates,
`?today=`, the tab bar, the database (later batches). `.claude/hooks/`.
`docs/fixtures/import/`, `schema/import-v1.json`, `docs/fixtures/share/`.

**Files deleted.**

- `app/src/lib/listLink.ts`, `app/src/lib/listLink.test.ts`
- `app/src/ports/compress.ts`
- `docs/fixtures/lists/` (six files: `equipment-entry.json`,
  `minimal.json`, `money-coin-mode.json`, `notes-both-kinds.json`,
  `qty-and-price.json`, `unicode-heavy.json`)
- the golden files of the deleted states (step 12), as `golden.js`'s stale
  sweep names them

**Files edited** (production): `app/src/lib/lists.ts`,
`app/src/lib/cloudLists.ts`, `app/src/lib/hash.ts`, `app/src/lib/bundle.ts`,
`app/src/lib/share.ts`, `app/src/lib/pending.ts` (comment),
`app/src/lib/dict.ts`, `app/src/lib/help.ts`, `app/src/ports/types.ts`,
`app/src/ports/index.ts`, `app/src/ports/redirect.ts` (comment),
`app/src/App.svelte`, `app/src/components/ListPage.svelte`,
`SharedListPage.svelte`, `ListsPage.svelte`, `Shell.svelte`,
`AddToList.svelte`, `SelBar.svelte` (import paths),
`app/src/state/app.svelte.ts`, `app/src/state/cloudLists.svelte.ts`
(import path), `app/src/state/lists.svelte.ts` (import path).

**Files edited** (tests and harness): `app/src/lib/hash.test.ts`,
`lists.test.ts`, `bundle.test.ts`, `share.test.ts`, `cloudLists.test.ts`;
`app/src/components/listPage.test.ts`, `listsPage.test.ts`,
`sharedListPage.test.ts`, `shell.test.ts`, `sharePanel.test.ts`,
`a11y.test.ts`, `lists.test.ts`; `app/src/state/app.test.ts`,
`lists.test.ts`; `app/src/ports/ports.test.ts`;
`tests/contracts.js`, `tests/derived.js`, `tests/app/contracts.js`,
`tests/app/states.js`, `tests/app/inventory.js`, `tests/app/sweep.js`,
`tests/app/driver.js`; `docs/fixtures/urls/routes.json`.

**Files edited** (docs): `docs/specs/CONTRACTS.md`, `ROUTES.md`,
`FEATURES.md`, `STATE.md`, `META.md`, `COVERAGE.md`; `llms.txt`;
`README.md`, `README.ru.md`; `.claude/README.md` (line 181 only).

**Behaviour and UI constraints.**

- `#/l/<payload>`, `#/l/~<payload>`, `#/l/` and `#/l/ABC.` each draw the
  not-found page; `location.hash` is unchanged after load; no tab is lit;
  the document title is the plain `docTitle`.
- A browser list's page keeps `#/lists/<id>` (no rewrite before the date
  either); its title is the plain `docTitle` (the `openList` title goes).
- A browser list's page and card draw no link buttons; the card links to
  `#/lists/<id>`.
- `#/s/` pages, `SharePanel`, «Сохранить себе» on `#/s/`, the dropped
  entries toast on `#/s/` do not change.
- No new text. Removed text keys are listed in step 8.

**Steps.**

1. Read section 6's inventory grep output once; it is the checklist for
   steps 2-13.
2. `lib/lists.ts`: add `ListEntryMeta`, `ListShape` and `QTY_MAX` (moved
   verbatim from `listLink.ts`, with their comments); import `MoneyMode`
   from `./money.js`; delete `findListByPayload` and `copyInit` (their
   callers go in steps 5-7). `lib/cloudLists.ts`: add the interface
   `SharedList` (the old `DecodedList`, same fields, its `dropped` comment
   reworded for a share projection: "How many entries the projection held
   that the reader's index does not know"); `sharedListOf` returns it.
   Point every other importer of `listLink.js` at `lists.js`,
   `cloudLists.js` or `money.js` (13 modules: the grep in step 1).
3. `lib/hash.ts`: replace the `sharedList` member of `Route` with
   `| { kind: 'retired' }` and a one-line comment: "An old list link
   (`#/l/...`): the not-found page, the address kept (docs/specs/ROUTES.md)".
   In `parseHash`, one branch where the packed test is now:
   `if (/^l\//.test(h)) return { kind: 'retired' };` - the same reach as the
   two old branches together (plain, packed, empty, stray character).
   Delete the later `l/` branch and its comment, `PACK_MARK` and
   `sharedListHash`. `QTY_MAX` from `./lists.js`.
4. `ports/types.ts`, `ports/index.ts`: delete `CompressPort`,
   `Env.compress`, `browserCompress`, `plainCompress` and the
   `compress:` entries of `browserEnv` and `fakeEnv`; reword the two
   comments in `types.ts` that mention compression.
5. `App.svelte`: the list branch reads
   `{:else if app.route.kind === 'storedList'}`. Reword the last branch's
   comment: it now draws the not-found page for an address this build
   reads but has no page for (`retired`, `account` with no sign-in, and
   the homebrew routes with no sign-in) - one or two lines, citing
   `docs/specs/ROUTES.md`.
6. `ListPage.svelte`:
   - `own` reads only `storedList` (the browser store, the account store,
     the moved-id redirect - unchanged until `B10.3`);
   - delete the URL sync machinery: `syncTimer`, `cancelUrlSync`,
     `scheduleUrlSync`, `flushUrlSync`, the effect that schedules it, the
     `pagehide`/`visibilitychange` effect, the long comment above them, and
     the `onDestroy` work that only served them (keep whatever else it
     does);
   - delete `shareLink`, `sharePlayers`, `shareGm` and the two buttons in
     the `{:else if !readOnly}` arm (the arm goes; `isCloud` keeps its
     arm);
   - delete the `route.kind === 'sharedList' && !app.legacyWritable`
     retired branch, the packed branch, the `sharedList` branch and the
     `SharedListPage` import; `{:else if !own}` keeps only what a
     `storedList` needs;
   - delete `encodeListRaw`, `findListByPayload` imports; `QTY_MAX`,
     `ListEntryMeta` from `lists.js`, `MoneyMode` from `money.js`.
7. `SharedListPage.svelte`: `token: string` is required; delete `payload`,
   the `decodeList` arm of `shared`, the local save (`app.lists.create`,
   `copyInit`, `openNewList`), the `token === undefined` arms (`index`,
   `view`, the `!shared` not-found arm with `badShare`, the `legacyLinks`
   line), and the `#/l/` sentences of the header comment. `saveShared`
   keeps `cloud` (`saveShareCopy`), `prompt` and `wait`. The dropped
   entries toast stays, keyed on the token.
8. `AppState` (`state/app.svelte.ts`): delete `expandFailed`, `#expand`
   and its three calls, `syncListUrl`, `openNewList`, `#claimList`,
   `openList`, `urlPayload`, `clearOpenList` (and its callers' calls),
   `saveCopyOf`; `#runPending` keeps the `share` arm and loses the
   `sharedList` lines and the packed wait; `followMoved` keeps only the
   `storedList` arm (`to = r.kind === 'storedList' ? into(r.listId) :
   undefined`); `shared` is `$state<SharedList | null>`. `Shell.svelte`:
   the title's `own` arm goes (it read `openList`). `ListsPage.svelte`:
   the card `href` is `storedListHash(l.id)`; delete `share()`, its button
   and the `encodeList`, `encodeListRaw`, `sharedListHash` imports.
   `dict.ts`: delete, in both languages, `legacyLinks`, `linkRetired`,
   `linkRetiredSub`, `sharePlayers`, `shareGm`, `playersLinkCopied`,
   `gmLinkCopied`, `badShare`, and any other key the compiler or
   `git grep -n -w <key> -- app/src` shows without a reader after the
   edits (`listEmpty`, `share` - check each; `SharePanel` uses its own
   keys).
9. `help.ts` `LISTS`: delete the fifth paragraph («У списка в этом браузере
   вместо неё две кнопки...» and "A list in this browser has two buttons
   instead..."), both languages. Paragraph 2 stays until `B10.3`.
10. Comments: `pending.ts` (the `saveList` action saves the open share
    link's list, `#/s/` only), `redirect.ts` (the 16384 bound: "a print
    address of 180 ids with counts passes 2048"; the bound stays).
11. Unit tests: delete every case whose subject is a `#/l/` address, a
    link button, the address rewrite, packed expansion, `compress`, the
    codec or `findListByPayload`/`copyInit`; in the cases that stay,
    replace `encodeList(...)` fixtures with the literal hash they need or
    with a `#/lists/<id>` address. `hash.test.ts` expects `{ kind:
    'retired' }` for `#/l/x`, `#/l/~x`, `#/l/`, `#/l/ABC.`, and still
    `unknown` for `#/lx` and `#/list`. `sharePanel.test.ts` keeps its "no
    `#/l/` copied" assertion as a literal substring check. Add one case
    in `listPage.test.ts`, in the file's `it('...')` sentence style:
    `it('draws the not-found page for an old list link and keeps the
    address')`, rendering `App` at a literal `#/l/` hash.
12. Layer 2:
    - `tests/app/inventory.js`: delete `#/l/ ~ own list`, `#/l/ ~ own list,
      retired`, `#/l/ ~ shared` and its five variants (`a row ticked`,
      `picked`, `saved`, `saved as gm2`, `noted`), `#/l/ ~ packed`,
      `#/l/ ~ every entry gone`, `#/l/zzzz`; rewrite `#/l/ ~ retired` with
      no `today`, the route literal (copy the payload string from
      `docs/fixtures/lists/qty-and-price.json`'s `player.payload` before
      deleting the file) and the why "an old list link draws the not-found
      page: «Предмет не найден», its sub, «На главную»; the address kept,
      nothing decoded"; rewrite `#/l/~AAAA` with no `enter` and the why "a
      packed old list link: the same not-found page, the address kept".
      Delete the constants `QTY_AND_PRICE`, `NOTES_BOTH_KINDS`, `PACKED`
      and the `seven` comment's codec sentence if they lose every reader.
    - `tests/app/states.js`: delete case 8 (packed link) and case 38 (old
      link saved after sign-in) from the functions and `CASES`; in case 47
      delete the own-`#/l/` sub-steps (`MOVE_A_GM`, the "OAuth return lands
      on the first list's own #/l/ page" block) and in case 48 the
      `READ_ONLY_OWN` sub-steps - the move and read-only cases themselves
      stay until `B10.3`; drop the `QTY_AND_PRICE` require; update the
      header's case count. Case 43's "no `#/l/` copied" check stays.
    - `tests/app/contracts.js`: replace the codec helpers and the four
      link blocks (lines 15-147 at `930dc986`) with one block "an old list
      link": for `#/l/<the same literal payload>`, `#/l/~AAAA` and
      `#/l/ABC.`, open the address, assert the `h1` reads «Предмет не
      найден» and `location.hash` equals the opened hash. Reword the file
      header (the codec half no longer exists).
    - `tests/app/sweep.js`: delete the `#/l/%%SHARED%%` row and its
      substitution; keep `#/l/zzzz` with the label «старая ссылка».
    - `tests/app/driver.js`: delete `addressSettled`, `expanded` and
      `expandFailed` if no caller is left (grep).
13. Contract fixtures and suites:
    - `docs/fixtures/urls/routes.json`: the `#/l/ABC.` row's why becomes
      "an old list link with a stray character draws the not-found page,
      the address kept, never home"; add, after it, a row for
      `#/l/~AAAA` ("a packed old list link: the not-found page, the address
      kept") and a row for the literal `qty-and-price` player payload ("an
      old list link that opened a list before 2026-10-26: the not-found
      page, the address kept"), each with the `resolves` shape of the
      `#/l/ABC.` row.
    - `tests/contracts.js`: delete the list-encoding half (the `b64url`,
      `stampOf`, `N_REC`/`N_SEP` helpers, the "list encoding" block) and
      the check that `llms.txt` and `CONTRACTS.md` name 2026-10-26; reword
      the header comment (its first paragraph explains the second
      implementation of the codec - now it covers the docs-name check, the
      address names, `data.json` keys and `import-v1`). Remove the `zlib`
      require only if nothing else uses it.
    - `tests/derived.js`: delete the "legacy write cutoff" check (it guards
      moving the date, which is past). Keep the `llms.txt` pin `'#/l/'`
      (step 14 keeps the sentence).
14. Specs and docs (each in the language and form of its file):
    - `CONTRACTS.md`: the fixtures paragraph names `docs/fixtures/urls/
      routes.json` and `docs/fixtures/import/` only; section 1's bullet
      lists `#/lists/<listId>` and says `#/l/<payload>` is a retired
      address that draws the not-found page, the address kept; section 3
      becomes its heading "3. List link encoding (retired)" and one
      paragraph: "`#/l/` links stopped opening on 2026-10-26 and R10
      removed their format; an old `#/l/` address draws the not-found
      page (section 1). The format is in `git show <base>:docs/specs/
      CONTRACTS.md`, section 3." where `<base>` is the commit R10 starts
      from (handoff, "Base / starting commit"). Sections 4 and 5 keep their
      numbers.
    - `ROUTES.md`: the two `#/l/` rows become one row "`#/l/...` - an old
      list link, retired on 2026-10-26: the not-found page, the address
      kept, the payload never read"; delete the paragraph on the stray
      character after `l/` (the row says it); the print paragraph says
      "the `*<n>` spelling the retired list link used" without citing
      section 3; the `#/lists/<listId>` row drops its `#/l/` rewrite clause.
    - `llms.txt`: rule 4's last sentence becomes "Do not build `#/l/`
      links: that format stopped opening on 2026-10-26."; delete the
      `#/l/<payload>` address entry.
    - `FEATURES.md`: in "Lists", delete the shared `#/l/` page bullet and
      its sub-bullets (the save, the 26 October line, the bad and packed
      links), the link buttons and the address-bar rewrite; in "Account
      and browser lists", every `#/l/` sentence becomes the not-found
      page or goes (the read-only bullet: "A `#/l/` address draws the
      not-found page"; "An account list's page keeps its address" keeps
      its sentence without the `#/l/` aside); in "Homebrew", "a `#/l/`
      link and a lists file never carry an own key" names the lists file
      only. `META.md`'s homebrew paragraph ("never in a `#/l/` link or a
      lists file") the same.
    - `STATE.md`: the URL hash row holds "route, table, anchor, filters, a
      share link's token, what to print"; `dhloot.auth.return`: the action
      saves "the open share link's list (`#/s/`)", and the bound sentence
      says "a print address with counts passes 2048"; the memory table
      drops `openList`, `urlPayload`, `shared {ids, meta}` stays (a `#/s/`
      page's), and the `urlPayload` paragraph is deleted.
    - `META.md` section 3: delete the two bullets on `#/l/` (cannot be
      revoked, as long as its contents) and replace the lead sentence "An
      old shared list is still its address..." with "An old `#/l/` link
      stopped opening on 2026-10-26 and draws the not-found page."; the
      "**Your own link** doubles as its backup" bullet loses that clause.
    - `COVERAGE.md`: the rows for `listLink.test.ts`, the codec half of
      `contracts`, the `#/l/` goldens and states 8 and 38, `compress`; add
      the "an old list link" block of `app/contracts` and the two kept
      goldens.
    - `README.md`, `README.ru.md`: "Two notes" - the table says what each
      note reaches now (the copied text and the players' share link; the
      GM's share link), and the paragraph on two link buttons becomes one
      on «Поделиться» (players' and GM's link, `#/s/<token>`); "The link
      format" is replaced by a short "Share links" subsection (an opaque
      token, made by the owner, revoked by «Удалить ссылку»); "Where lists
      live" loses its **Your own link** sentence (its storage text is
      `B10.3`'s). Keep each README's order and language.
    - `.claude/README.md` line 181: the clause names `docs/fixtures/urls/
      routes.json` and `docs/fixtures/import/` as the contract fixtures.
15. Run the gates (below), then commit: the first batch of the task, so a
    new commit `feat(persist): retire the old list links` with the
    Conventional Commits body (why: the cutoff passed; effect: an old link
    draws the not-found page). No AI trailer.

**Acceptance criteria.**

- `git grep -n -E "listLink|decodeList|encodeList|PACK_MARK|sharedListHash|compress\.(pack|unpack)|CompressPort|expandFailed|syncListUrl|urlPayload" -- app/src tests` prints nothing.
- `docs/fixtures/lists/` does not exist; `tests/contracts.js` and
  `tests/app/contracts.js` pass without it.
- `parseHash` answers `{ kind: 'retired' }` for `#/l/x`, `#/l/~x`, `#/l/`
  and `#/l/ABC.`; the built app keeps each address and draws «Предмет не
  найден» (`app/contracts`, the two goldens).
- A browser list's page and card draw no link button, and its address stays
  `#/lists/<id>` (goldens, `listPage.test.ts`).
- After R10 the only share labels left are «Ссылка для игроков» / «Ссылка
  для мастера» ("Players' link" / "GM's link", `shareLinkPlayers` and
  `shareLinkGm` in `SharePanel`): the keys `sharePlayers` («Ссылка
  игрокам») and `shareGm` («Ссылка себе», "Your own link") are gone from
  `dict.ts` in both languages, and `git grep -n -E "Ссылка себе|Ссылка
  игрокам|Your own link" -- app/src docs/specs` finds nothing outside
  `B10.3`'s browser-list sentences, which that batch removes (audit #13 of
  `issues/persist-7e-list-quick-item/consistency-audit.md`; owner,
  2026-10-01).
- `#/s/` behaviour is unchanged: states 43-46, 52, 55, 56 and the `#/s/`
  goldens pass without an update.
- `CONTRACTS.md` section 3 is the one history paragraph; `ROUTES.md` has
  one `#/l/` row; `llms.txt` names `#/l/` once, as not to be built.
- Every spec line that described the `#/l/` page, buttons or rewrite is
  gone or describes the not-found page (`git grep -n "#/l/" -- docs/specs
  README.md README.ru.md llms.txt` shows only the retired-address lines,
  the history line, the "not-found page" sentences, and the browser-list
  sentences `B10.3` rewrites).
- The golden compare reports only states that draw a browser list (link
  buttons gone, title plain) or a deleted `#/l/` state; the update then
  writes them; the stale sweep finds no orphan.

**Verification commands** (in this order; Bash tool unless noted):

```text
rtk npm run check                                    # Bash timeout 600000
node tests/run-all.js contracts,dataint
npm run build:test
node tests/run-all.js app/contracts,app/states
node tests/app/golden.js --shard=1/4                 # compare, then 2/4, 3/4, 4/4
node tests/app/golden.js --update --shard=1/4        # then 2/4, 3/4, 4/4
node tests/app/sweep.js 360
npm run check:built
rtk npm run check                                    # after any fix, before the commit
```

**Risks and do-nots.**

- Do not delete `dhloot.*` keys, `ListStore`, `LegacyMove` or the
  notices: `B10.3`'s.
- Do not reuse the old `notFound` copy for a new "link retired" text: the
  owner chose the existing not-found page.
- The `retired` kind must never become `unknown`: `routes.json` and
  `app/contracts` would send the reader home.
- A golden diff outside browser-list and `#/l/` states is a defect, not a
  re-seed: stop and report it.
- `.claude/hooks/selftest.mjs` keeps its synthetic `docs/fixtures/lists/
  x.json` path (a hook edit fires its own review).
- `MSYS_NO_PATHCONV=1` before any `golden.js --only="#/..."` on this host.

## 10. Batch B10.2 - port the list fixtures to account lists (outline)

Objective: every test whose subject is list page, lists index, add-to-list
or record behaviour, and that uses a browser list only as its fixture,
runs on an account list of the fake cloud. No production file changes.

- Unit: add `app/src/test/seed.ts` with `seedWith(lists: { gm1?: SeedList[];
  gm2?: SeedList[] })`, returning `SEED` with those lists appended to the
  user's own (its second real use is in this batch:
  `listPage.test.ts`, `listsPage.test.ts`, `components/lists.test.ts`,
  `a11y.test.ts`, `state/app.test.ts`). Port each `describe`/`it` that
  seeds `dhloot.lists.v2` for list behaviour to `fakeCloud(seedWith(...),
  'gm1')` and `#/lists/<uuid>`; leave in place (for `B10.3` to delete) the
  cases whose subject is the browser store, the merge, the backup, the
  move, the notices, read-only after the date or the unconfigured build.
- Layer 2 (`tests/app/states.js`): add `accountList(d, { name, ids, meta,
  money, note, hnote })`, which writes one `create` op through
  `d.fake('lists.apply', [...])` (ids from `uuid(7000+n)`, entries in
  order), then `d.shownAgain()`, and answers `#/lists/<id>`. Port cases
  13, 17 (its note sub-case and its storage reads become
  `d.fake('lists.list')`), 18, 22, 26, 27 (50 lists: 47 creates, under
  the 50-list limit with the seed's 3), 30, 32, 33 (the removal "from
  another tab" becomes `lists.apply` with `remove_entries` plus
  `d.fake('play', id, {})`; if `play` cannot announce an entry removal,
  add `playRemove(listId, entryId)` to `FakeCloud` with a
  `fake-cloud.test.ts` case) and 62 (twelve account lists through
  `accountList`, not the move). Cases 7, 20, 25, 34, 47, 48, 51 stay as
  they are for `B10.3`.
- Acceptance: the ported cases pass on the current build; `git grep -n
  "dhloot.lists.v2" -- tests/app/states.js app/src` lists only cases and
  tests that `B10.3` deletes (each named in the handoff).
- Gates: section 8. Review: required (harness), judged against
  `COVERAGE.md`.

## 11. Batch B10.3 - remove browser lists and the move (outline)

Objective: settled items 3-9; the app holds account lists only.

- Delete: `state/lists.svelte.ts` (+ `state/lists.test.ts`),
  `state/legacyMove.svelte.ts` (+ test), `lib/legacy.ts` (+ test),
  `components/MoveNotice.svelte`, `MoveStatus.svelte`,
  `StorageNotice.svelte` (+ `moveNotice.test.ts`, `moveStatus.test.ts`);
  `tests/db` stays (`B10.4`).
- `lib/lists.ts`: delete `keepLists`, `liftNotes`, `LegacyList`,
  `mergeLists`.
- `AppState`: delete `lists`, `legacyMove`, `legacyWritable`,
  `localWritable`, `moveDue`, `followMoved`, the list watch, the move step
  of `#listsReady` and `retryLists`, the move retry in `#pollLists`, the
  move wait in `#runPending`, `storeFor`, `storageWorks`, `warnHidden`,
  `hideWarn`, `WARN_KEY`; `newListTarget` answers `'cloud' | 'prompt' |
  'wait'` and the list surfaces are not drawn with no cloud.
- Ports: `StoragePort.works` and `dhloot.probe`; `ListRepository.move`
  (`types.ts`, `supabase.ts`, `fake-cloud.ts`, their tests); `ListRow`,
  the `supabase.ts` select string and every fake row lose
  `legacy_fingerprint` - a precondition of `B10.4`'s column drop (Q1 B):
  after `B10.3` no client file names the column;
  `cloud.contract.ts` loses `moveCases` (case I is retired, its letter not
  reused) and the signed-out move assert; `tests/e2e/flows.mjs` loses F9
  (header renumbered in prose only: "F9 retired at R10") and its
  `settled` reads `data-lists`; `tests/e2e/admin.mjs`'s select loses the
  column. `ports/clock.ts`: `queryClock` keeps `?toasts=held` only;
  `TEST_NOW`'s comment names its readers (export names, relative times).
- Components: `ListPage` (always an account list: no `readOnly`, no
  `isCloud` arms, no local delete or undo, no moved-id redirect),
  `ListsPage` (the account group only; filter and fold over account
  lists), `AddToList` (account lists only), `SharedListPage` (no move
  disable), `Shell` (no `MoveNotice`, `data-lists`), `TabBar` (no `lists`
  prop), `App.svelte` (`lists` and `storedList` only with `app.cloudLists`;
  otherwise the not-found branch). Add-to-list mount points
  (`git grep -n "<AddToList"`) draw nothing with no cloud.
- `dict.ts`: delete the move, banner, storage and browser-group keys
  (`noStorage*`, `badStorage*`, `localOnly*`, `readMore` if unused,
  `localReadOnly*`, `moved*`, `moving`, `moveFailed`, `moveAttention*`,
  `moveHeldWhy`, `moveBanner*`, `groupBrowser`, `noLists` if unused).
- `help.ts` `LISTS` paragraph 2 becomes, verbatim: «Войдите - и списки
  будут храниться в аккаунте: они сохраняются сами и открываются на любом
  устройстве.» / "Sign in and your lists are kept in your account: they
  save themselves and open on any device."
- Harness: `driver.js` (`today` option gone, `moveSettled` renamed
  `settled`, reads `data-lists`), `golden.js` (`# today:` gone),
  `golden.test.mjs` (the dated-states block gone); `states.js` deletes
  cases 7, 20, 25, 34, 47, 48, 51 and every left-over browser-list step;
  `inventory.js` deletes every state that seeds `dhloot.lists.v2` or
  `dhloot.migrated.v1` or sets `today`, except where `B10.2`'s rule says
  the state shows list page behaviour that no `as gm1` state holds - then
  it is ported to `SHOP` as `gm1` with the same `enter`; record and table
  states drop their `two`/`twelve`/`seven` storage.
- `routes.json`: the `#/lists` row's `tab` is `null`.
- Specs: section 7's row. `STATE.md`'s keys table keeps the live keys and
  adds one paragraph "Left in the browser" naming `dhloot.lists.v1`,
  `dhloot.lists.v2`, `dhloot.lists.v2.bad`, `dhloot.migrated.v1`,
  `dhloot.warn.v1`: the app reads, writes and deletes none of them since
  R10; "Two tabs" keeps only the account paragraph; "The list migration"
  section goes; "Storage that throws ... runs without lists" becomes "...
  runs on its defaults". `FEATURES.md` "Chrome": nine tabs, one bullet.
- `DEBT.md`: delete D24 and D63; edit D64 - **Where** names
  `AccountMenu.svelte` only, **Why deferred** gains "R10 removed
  `MoveNotice` with its two buttons; the «Выйти» half is `debt-cleanup`'s
  (owner, 2026-10-01)", **How to verify** drops the `MoveNotice` clause.
  If D62 is the last entry of "Legacy removal", the section stays for
  `B10.4`.
- One decision file (section 3, item 10), `node tools/decisions.js`.
- Acceptance: the section 6 grep prints only `tests/db/legacy-move.test.mjs`,
  the applied migrations and reversals, `usage.mjs`'s comment and
  `.claude/README.md` rows (all `B10.4`'s, the applied files locked);
  `git grep -n legacy_fingerprint -- app/src tests/e2e tests/app tools`
  prints nothing; nine tabs in every golden; no golden or states case sets
  `today` or seeds a `dhloot.*` list key; `npm run e2e` passes without F9
  and case I; `check:built` reports the unconfigured and configured sizes
  (recorded in the handoff).

## 12. Batch B10.4 - the migration (outline; Q1 B)

Objective: no database function inserts past a count limit, nothing of the
move is left that a client could call, and the move's fingerprint column is
gone.

**Order (the precondition of the column drop).** A client that selects
`legacy_fingerprint` fails every account list read once the column is
gone. So:

1. `B10.3` lands first: after it, `git grep -n legacy_fingerprint --
   app/src tests/app tests/e2e tools` prints nothing (`B10.3`'s
   acceptance). `B10.4` starts only on that tree; its first step re-runs
   the grep and stops if anything is printed.
2. The test project: `B10.4`'s `db:push --project test` runs after the
   review approves, with `B10.3`'s client in the same tree, so the `npm
   run e2e` that follows exercises the R10 client against the dropped
   column. An e2e run of an older commit against the test project fails
   from then on; that is expected and is not re-run.
3. Production: R10 ships as one commit and one push (`CLAUDE.md`, "one
   commit per task"), so the bundle `deploy` publishes is the R10 build,
   which never reads the column. CI runs `migrate-prod` before `deploy`
   in the same workflow run; between the two, and in every tab still on
   the R9 build until it reloads, account list reads fail. The owner
   accepted this (Q1 B). A cloud release pushes branch commits only to its
   branch; nothing reaches production before the squash-merge onto `main`.
4. Never push `B10.4`'s migration to production without `B10.3`'s client
   in the same deploy: a split push of the release is refused here.

**Steps.**

- `supabase/migrations/<ts>_drop_legacy_move.sql` (a timestamp after every
  applied one):
  `drop function public.move_legacy_list(uuid, text);`;
  `create or replace function public.lists_limit()` with the body of
  `20260925130400_legacy_move.sql` less the `dhloot.move` guard, and
  `create or replace function public.list_entries_limit()` with the body
  of `20260930121000_list_entries_statement_triggers.sql` less the guard
  (the triggers stay; the `revoke execute ... from public, anon,
  authenticated` lines repeated); `drop index
  public.lists_legacy_fingerprint;`; `alter table public.lists drop column
  legacy_fingerprint;` (drops its check with it). A two-line header
  comment cites `docs/decisions/` (the Q1 decision file).
- `supabase/reversals/<same name>`: in reverse order - `alter table
  public.lists add column legacy_fingerprint text check
  (legacy_fingerprint ~ '^[0-9a-f]{64}$');`, the unique partial index
  `lists_legacy_fingerprint on public.lists (owner_id, legacy_fingerprint)
  where legacy_fingerprint is not null`, the two limit functions with the
  guard, and the function as `20260925130500_legacy_move_conflict.sql`
  made it (body, `revoke` from `public, anon`, `grant` to
  `authenticated`). Copy each text from the applied files, never retype
  it. The values are not restored (the reversal brings back the shape;
  the reversibility gate compares `pg_dump --schema-only`).
- `tests/db/legacy-move.test.mjs` is replaced by
  `tests/db/legacy-move-dropped.test.mjs` (`node:test`, the roles helper
  the other files use): a signed-in call of `move_legacy_list` is refused
  as an unknown function (`42883`); `public.lists` has no column
  `legacy_fingerprint` (`pg_attribute`) and no index
  `lists_legacy_fingerprint` (`pg_class`); with `set_config('dhloot.move',
  'on', true)` in the transaction, a list past `lists_per_owner` and an
  entry past `entries_per_list` are still refused (`P0001`, `limit:
  lists_per_owner`, `limit: entries_per_list`). `tests/db/harness.test.mjs`
  and any other file that pins EXECUTE grants or the `lists` columns lose
  the function and the column (`git grep -n -E
  "move_legacy_list|legacy_fingerprint" -- tests/db`).
- `tools/supabase/usage.mjs` line 115 comment (no function passes a limit
  since R10; lists above 100 % are those moved before it).
- `.claude/README.md`: "Expected Security Advisor warnings" - the
  `move_legacy_list` row goes, and the paragraph's counts are re-counted
  from the table that remains (expected after R10's `migrate-prod`: 0
  errors, 8 warnings); the owner reads them back (section 14);
  "Usage monitoring" - the "above 100 %, which `move_legacy_list` allows"
  clause becomes "above 100 %, for lists moved in before R10".
- `COVERAGE.md`: the layer 3 row of `legacy-move.test.mjs` becomes the new
  file's; layer 4's contract and flow rows already lost case I and F9 in
  `B10.3`.
- `DEBT.md`: delete D62, and the "Legacy removal" section with it when it
  is empty (D61 belongs to `debt-cleanup`; if it is still there, name it to
  the owner and leave it).
- The Q1 decision file (section 4, "Decision for `B10.4` to write"); add
  "Superseded in part by" that file to
  `docs/decisions/2026-09-26-a-browser-list-moves-into-the-account-through-one-rpc.md`;
  `node tools/decisions.js`.

**Acceptance.**

- `git grep -n -E "move_legacy_list|legacy_fingerprint|dhloot\.move" -- app/src tests tools .claude/README.md docs/specs`
  prints only the new migration, its reversal, the new test file, and the
  applied migrations and reversals (locked history).
- `npm run check:db` passes, including the reversibility walk (all up, all
  down in reverse, all up, schema dumps equal).
- After the approve: `db:push --project test` applies the file and `npm
  run e2e` passes (contract cases without I, flows without F9).
- `DEBT.md` holds no D62.

**Flow.** `orchestrate.prompt.md`, "Schema batches": the implementer stops
after `rtk npm run check`, `npm run check:db` (PowerShell tool) and the
amend; after the review approves, `node --env-file=.env.test.local
tools/supabase/db-push.mjs --project test --yes`, `npm run e2e`, the
handoff amend.

## 13. Risks, assumptions, deferred

- Risk: an earlier release moves code this plan names (section 6). The
  dispatch refresh is mandatory, not optional.
- Risk (accepted by the owner, Q1 B): a tab of the R9 build open across
  R10's `migrate-prod` fails its account list reads («Не получилось
  загрузить списки аккаунта.» and «Повторить») until it reloads, and its move fails
  too; no row is lost. The window for a fresh page load is the time from
  `migrate-prod` to `deploy` in one CI run. Mitigation: section 12, "Order".
- Risk: the fingerprint values are lost for good (a column drop). Nothing
  reads them after the move; the nightly backups of the last 30 days keep
  them (`.claude/README.md`, "Backups and restore").
- Risk: `B10.2`'s port loses coverage silently. The per-file coverage
  thresholds of `npm run check` catch a file that drops below its line;
  the reviewer compares the deleted and ported case lists.
- Risk: golden churn hides a real change. `B10.1` and `B10.3` compare
  before they update, and the handoff lists the changed states by group.
- Assumption: no reader needs a browser list after 2026-10-26 that the
  move did not carry; the owner accepted this (decision 2026-09-27).
- Assumption: `debt-cleanup` runs before R10 and takes D61, D64's «Выйти»
  half, D65-D73 as they stand then.
- Deferred, named to the owner at closeout, not built: a clean-up of
  `StoragePort`'s keyed `onExternalChange` signal, which only
  `debt-cleanup`'s D61 fix may use.

## 14. Owner steps at R10's closeout

1. Before the push: the Q1 decision file is in the commit, and the release
   commit holds `B10.3` and `B10.4` together (section 12, "Order").
2. After `migrate-prod` and `deploy`: reload every open tab of the site
   (an R9 tab fails its list reads until then); open an old `#/l/` link on
   a phone and a desktop - the not-found page, the address kept; the tab
   bar has nine sections; a signed-in account's lists, share links and
   requests work.
3. Re-run the Security Advisor on both projects and confirm the warning
   count `B10.4` wrote into `.claude/README.md`.
