# Plan - TASK debt-cleanup (pay the open DEBT.md entries and the owner's carries)

## Status

- Task status: planned 2026-10-08 (planner, mode A); refreshed before B1 on 2026-10-15 (planner,
  mode B) against `origin/main` `e4f92f7c`. B1 implemented 2026-10-15 on `ae5ab7cf` as `7430de8e`
  (its own commit after the plan commit, per the dispatch); the B1 batch review approved it
  (`reviews/B1.md`, Nits 1-7 placed below). Refreshed before B2 on 2026-10-15 (planner, mode B):
  7.2 is implement-ready after the plan review before B2. Worktree `.claude/worktrees/debt-cleanup`,
  branch `claude/debt-cleanup`, unpushed; the closeout squashes the plan commit and the task
  commit into one (the orchestrator's call, `reviews/B1.md`, Deviations).
- B2 implemented 2026-10-16 (implementer) as its own commit on `fadcd0b1`: D85, D98, B1-3,
  B1-5, B1-6, B1-7 and both B1 checks ship; D83 took 7.2's stop condition (step 0: the
  `auth.users` delete after the request delete took 4.9-5.7 s in four of five runs, 318 ms after
  an `analyze`; the `homebrew_items` cascade is 9.0 s of the 14.8 s `explain`), so its
  migration, port loop and decision file are not in B2 and D83 stays in `DEBT.md` for the
  planner (`handoff.md`). The batch review approved it (`reviews/B2.md`); the test push applied
  `20261015120000_shared_list_have.sql` and the hosted `npm run e2e` passed; B2 is `5eb69ff6`.
- Refresh before B3: done 2026-10-16 (planner) on `5eb69ff6`, `origin/main` `ae5ab7cf`:
  - D83 takes the B2 design of 3.10.2 with one change: the 3x case runs `analyze` after its seed
    (3.11.2). After the plan review before B3 it is its own batch, B3b, after B3 (owner Q1:
    D60 alone). Measured reason: the request lines are row volume (5.4 s in the `explain`,
    2.3-4.2 s as one statement), so they keep the bounded calls; the rest of the delete took
    318 ms with statistics and 4.9-5.7 s without, so the `homebrew_items` cascade's 9.0 s is a
    statistics effect of a fresh seed, which a hosted database does not have (autovacuum's
    analyze). Rejected: a bounded item delete (more code on the one irreversible path for a
    planner effect); keeping D83 (the request lines alone pass 4 s at 3x).
  - B2 review Risk 2 (the overload's database time at 3x), Risk 3 (`STACK_TIMEOUT_MS`), Nit 5
    (`restore.mjs` with no timeouts) and Nit 2 (two README phrases) are B3b lines: they share
    `check:db` with D83. B2 Nit 1 (D83's inferred cause) clears when B3b deletes D83, else B3b
    fixes the text; Nit 3 (the handoff template label) is fixed in this refresh; Nit 4 (the B2 commit
    subject) goes to the closeout squash (7.5).
  - Configured bundle 300.8 kB, budget 303 (B2); B3 records its figures, B4 and B5 raise the
    budget by the rule when they pass it.
- B3 implemented 2026-10-16 (implementer) as its own commit on `f83b7f73`: D60 ships
  (`accountClients` in `supabase.ts`, the unit and real-package cases, the records); the
  configured bundle 300.8 kB before, 296.8 kB after; the hosted `npm run e2e` passed before the
  commit (`handoff.md`). The B3 batch review approved it (`reviews/B3.md`; Nits 1-3 in B3b,
  Nits 4-5 in `handoff.md` Deferred).
- B3b implemented 2026-10-16 (implementer) as its own commit on `6be801dc`: D83 ships (24
  bounded calls of at most 926 ms and a final 501-1252 ms under `'4s'` with `analyze`) and leaves
  `DEBT.md`; `STACK_TIMEOUT_MS` 180 000 (warm starts 39.9-42.5 s); the hosted `anon` timeout is
  3 s; the overload timing missed half of it (three-argument median 2305-3237 ms), so its case is
  a todo and `DEBT.md` D111 holds the figures (`handoff.md`). Next: the B3b batch review, then
  the test push and `npm run e2e`, then the B4 refresh.
- Refresh before B2: done 2026-10-15 (planner) on `7430de8e`, `origin/main` `ae5ab7cf`:
  - D83's account-delete half joins B2 (7, split criteria; 3.10.2). Real figure (B1-1): at the
    defaults the request lines are 1/27 and the entries 1/9 of the 3x seed, so the defect lives
    only near 3x, where the scale decision of 2026-10-01 designs.
  - D98 joins B2 (3.10.3): the timed case keeps its bound and ends without axe; the open fold's
    axe stays in `homebrewPage.test.ts`. A decision file records it.
  - `SUPABASE_CLI` (B1-7): B2 moves `config.mjs` and `db-push.mjs` to `supabaseCli()` (B2's own
    test push runs from this worktree) and deletes the export.
  - B1's nits: B1-1, B1-2, B1-3, B1-5, B1-6, B1-7 and the review's two "checks still needed" are
    acceptance lines of B2; B1-4 of B4 (`reviews.md`).
  - The owner's carry of 2026-10-15 (K16, `context.md`): a colour print card with no picture
    draws `img/_none.webp`; placed in B4. D105 is in B4 (2.1, 7.4).
- Refresh before B1: done 2026-10-15 (owner rule of 2026-10-08). It re-read every section of
  `DEBT.md` but R10's ("Legacy removal") and the owner's carries of 2026-10-14/15:
  - Added: D95 (Focus), D97, D98, D101, D102, D103 (Debt cleanup), D99 (Harness parity), D100
    (Persistence review), and the carries K1-K15 (`context.md`, "Carries from the owner").
  - Dropped: D74 (paid by rich-descriptions `c8a65230`); D82 (moved to `authoring-print-preview`,
    which ships before this task and deletes D82 and its section - this plan treats D82 as gone);
    D65, D93, D94 (paid by R9), D70 (paid by print-snapshots) were already non-goals.
  - Not this task's: D104 ("Cloudflare Pages move"), R10's section (D24, D62, D63, `MoveNotice`'s
    half of D64); D61 stays this task's (Q4 = A).
  - Re-read on the tree: the three homebrew selects (`ITEM_SELECT` gained `art`), the newest
    `get_shared_list(text)` (`20261014120000_homebrew_art.sql`) and its `(text, bigint)` wrapper,
    the newest migration (`20261014120200_link_previews.sql`), the bundle (configured 298.0 kB,
    budget 303; unconfigured 236.9 kB, budget 242; before authoring-print-preview).
- NEEDS_HUMAN_CONFIRMATION: no - Q1-Q4 answered 2026-10-08; every refresh choice is a recorded
  default (section 10); no user-visible feature is dropped.
- Plan review findings applied: reviews/plan-B1.md
  - Blocker 1: 3.6, 7.1 step 2 and the D90 acceptance - `supabaseBinary` and one `resetLocal`
    helper that spawns the binary directly with the timeout at all three reset sites
    (`tests/db/run.mjs`, `tests/db/roles.mjs`, `tools/supabase/restore.mjs`); `storage` in
    `STACK_SERVICES`, read by `run.mjs`'s `complete` check; the hung-child `node:test` case and
    the 1 s override run on this host.
  - Blocker 2: 3.7 and the D68 acceptance - the fake refuses the one over-long op, makes no list
    for it and applies the rest; a two-op test.
  - Blocker 3: 3.4, 7.1 step 11 and the D86 acceptance - a kept id the store no longer holds is
    dropped; the read is all or nothing; chunks in sequence; past 50 new ids a whole read.
  - Blocker 4: 3.1, 7.1 step 10 and the D81 acceptance - `#written` leaves locally written ids out
    of `known`; a create then a kept re-read gets the database's `created_at`.
  - Blocker 5: 3.2, 7.1 files, step 19 and the stop condition - a failed 3x delete keeps its cases
    as `todo` and D83's delete half in `DEBT.md`, and the batch still commits; the amendment line
    in the 2026-09-26 decision and the `FEATURES.md` exception are in B1's files.
  - Risk 1: 3.9, 6, 10, 7.1 step 18, the K6 acceptance and do-nots - `'networkidle2'` for the
    e2e driver and the in-flight URLs on a navigation timeout; the F8 log was read (no call named).
  - Risk 2: 3.1, 3.4, 3.5, 4.1 and a new acceptance line - a read counter per store
    (`CloudLists`, `Homebrew`, `OwnerRequests`), one test each.
  - Risk 3: 3.2 and 7.1 step 13 - `setFault(match, { timeout: true })`; the cases run on the fake.
  - Risk 4: 3.2, 7.1 steps 0c and 15, 6, the gate cost - the seed time measured in step 0 with a
    60 s rule (`session_replication_role = replica` past it) and logged beside the delete time.
  - Risk 5: 3.6 and 7.1 step 0b - the reset prints its seconds; step 0 measures one reset and
    sets `RESET_TIMEOUT_MS` by a three-times rule; an interrupt is `'failed'`, not `'timeout'`.
  - Nit 1: 3.3 and the K7 acceptance - `#cardKeyFor` reads a card key set (300 cards at 3x).
  - Nit 2: 3.8 and the D61 acceptance - `PREFS_KEY` in scope, under `STATE.md` "Defaults and a
    page's pick".
  - Nit 3: 3.1 and 7.1 step 10 - `known` built inside the read loop after the in-flight wait.
  - Nit 4: 7.1 step 0 - the three `_before_update` revision triggers are the proof, checked up to
    the newest migration.
  - Nit 5: 3.6 and 3.9 - `Run npm ci in <ROOT>.`; `supabaseBinary` resolves up the parents, so
    `SUPABASE_CLI`'s worktree defect does not reach the resets.
  - Nit 6: 3.13 and the 7.5 acceptance - B5's error table lists a bulk delete and a bulk move
    with a ticked row that a filter hides.
- Plan review findings applied: reviews/plan-B2.md
  - Blocker 1: 3.10.1 (the fake writes an opaque `rev` and strips a held snapshot), 7.2 step 3
    (the contract case on a list with a shown homebrew entry, `rev` and a non-empty held map;
    the fake strip case; two raw RPC checks in `tests/e2e/contract.mjs` that fail on any error),
    three new acceptance lines.
  - Risk 1: 7.2 step 10 and the verification block - the push by `migrate-test.mjs` with
    `--env-file` (the path used on this host), `db-push.mjs` as the alternative; the B1-7 line
    proves the CLI start through `supabaseCli()`, not the push.
  - Risk 2: 7.2 step 10, the do-nots and an acceptance line - a failed push or e2e reopens the
    batch; an applied migration is never edited or renamed.
  - Risk 3: 4.2 (the resume row), 7.2 steps 5 and 6 (the resume and the prune-only cases), one
    acceptance line.
  - Risk 4: 7.2 step 0 and an acceptance line - the rule times the delete after the request
    delete (under 2 s); the `explain` lines are the breakdown only; the stop condition follows.
  - Risk 5: 7, the release step, and B5's closeout acceptance (7.5) - `origin/main`'s newest
    migration sorts before B2's two files, else stop for the owner.
  - Nit 1: 3.10.1 Records, 7.2 step 9 and an acceptance line - `META.md` says seven and names them.
  - Nit 2: 4.2 item 1 - 24 prune calls at 3x, 4 at the defaults; the loop stops at 0.
  - Nit 3: 3.10.1, 4.2 and 7.2 step 3 - a second unfillable answer is `{ ok: false }`.
  - Nit 4: 3.10.3, 7.2 step 7 and the D98 line - the timeout from the larger of two figures.
  - Nit 5: 3.10.3 Records - the "What is enforced" row gains the timed exception.
  - Nit 6: 3.10.1, 7.2 files and step 3 - the two test stubs forward `held`.
  - Nit 7: 7.2 step 10 and an acceptance line - B2 is a new commit with its own subject; the
    closeout squashes.
  - Nit 8: 7 and 7.5 - wait for `backup.yml` to end with `success`, record its run id.
  - Nit 9: 7.2 step 9 and an acceptance line - rule 2n's phrase in the README hook table.
  - Coordinator: the configured bundle is built with `--env-file=E:/dev/daggerheart-loot/.env`
    and `VITE_PREVIEW_BASE`, no `.env` copy (7.2 step 0, the verification block, the do-nots).
- Plan review: required before B1 (trigger: a new sync protocol - the homebrew read and the owner's
  pending-requests read become re-reads that fetch only changed rows (D81, D86), an account read
  keeps the newer row (D87), and the write buffer halves a request at once on a statement timeout
  (D83))
- Plan review: required before B2 (trigger: a migration, a SECURITY DEFINER function, a public
  contract change and possible loss of stored data - an overload of `get_shared_list` that names
  the held snapshots by hash and a `rev` field in its `#/s/` projection (Q2 = A, D85); the
  security definer `delete_account_requests()` on the account-delete path, after whose calls a
  failed final step leaves the account without its purchase requests (D83))
- Plan review: required before B3 (trigger: possible loss of stored data - a request sent with a
  token other than the session's at its send is refused and the write buffer drops it, and a
  changed auth storage key signs every reader out (D60))
- Plan review: required before B3b (trigger: a migration, a SECURITY DEFINER function and
  possible loss of stored data - the security definer `delete_account_requests()` on the
  account-delete path, after whose calls a failed final step leaves the account without its
  purchase requests (D83)). `reviews/plan-B3.md` reviewed D83's design and the tooling before the
  split; the D83 and tooling text changed only by that review's findings, so it is B3b's plan
  review. `agent-guard.mjs` looks for `reviews/plan-B3b.md` by name, so the orchestrator copies
  or confirms that report under that name before it dispatches B3b.
- Plan review findings applied: reviews/plan-B3b.md
  - every finding: the same changes as reviews/plan-B3.md, below (one review, filed under both names).
- Plan review findings applied: reviews/plan-B3.md
  - Blocker 1: 3.11.1 (one base by supabase-js's rule, one `keepaliveFetch` instance for the
    auth client, wrapped by `authed`), 7.3 steps 2 and 3 (the exact constructor options for
    three URL shapes; the auth fetch reads no session; the new `supabase.real.test.ts` with the
    real packages: a stored session's read, the PKCE code exchange, the Google and Discord
    start), three acceptance lines and the COVERAGE row.
  - Risk 1: 4.3 (the row of a request with no session token: reads answer no rows, an upload is
    refused as the picture limit, a write is kept as `network`; the loss path is a request with
    another session's token), the B3 trigger line, an acceptance line.
  - Risk 2 (settled by the orchestrator): the split - B3 is D60 alone; B3b takes D83, the
    tooling and the overload timing (7, split criteria and gate cost; 7.3, 7.3b; the B3b
    plan-review line above).
  - Risk 3: 3.11.3 and 7.3b step 0 - the timed binary is the one `supabaseCli()` resolves, `&
    <path> stop` between runs; the 240 000 ms cap holds when the slowest is at most 120 s, else
    the batch stops for the planner.
  - Risk 4: 3.11.3, 4.3, 7.3b step 4 and its acceptance line - `runningContainer()` throws on a
    timeout and `run.mjs` prints `check:db: FAIL - ...`; `ensureStackWithAuth()` throws into the
    drill's `restore:drill: <message>` then `restore:drill: FAIL`; a `node:test` case.
  - Nit 1: 3.11.1 Records, 7.3 files and an acceptance line - `STATE.md`'s storage key row.
  - Nit 2: 3.11.1 Records, 7.3 files and an acceptance line - `COVERAGE.md`, `tests/e2e/lib.mjs`,
    `tools/bundle-budget.mjs` and `supabase.ts` comments.
  - Nit 3: 7.3 step 2 and the `setAuth` line - `INITIAL_SESSION` with and without a session.
  - Nit 4: 4.3 and the bundle line - "smaller than step 0's figure, both figures recorded"; the
    budget stays 303 kB.
  - Nit 5: 3.11.1 Records - the amendment line's four facts (`X-Client-Info`, one version for
    the five packages, the port names the key).
  - Nit 6: 3.11.2, 7.3b step 1 and an acceptance line - a second `analyze` after the rollback,
    the `reltuples` figures in the handoff.
  - Nit 7: 3.11.2 and the D83 decision line - the autoanalyze mechanism; the hosted figure is not
    measured.
  - Nit 8: 3.11.3 and the B2 Risk 3 line - `stalled()` prints `N minutes` or `N s` through
    `stackTimeoutMs(env)`.
  - Nit 9: 3.11.3 and 7.3b step 0 - production taken as equal; `pg_db_role_setting` when
    `rolconfig` holds none; the effective value recorded.
  - Nit 10: 3.11.3 and 7.3b step 6 - the COVERAGE rows say the timed figures are this host's; a
    CI miss is a `DEBT.md` entry.
  - Nit 11: 4.3 item 1 - the busy state is an unmeasured estimate of 5-10 s hosted.
  - Nit 12: `handoff.md` Notes - "Screenshot findings: none (no screen change in B3)".
  - The review's last check: B5's closeout gains the owner's manual Google and Discord sign-in
    and link on a B3 build against the test project (7.5).
- B4 and B5 fire no trigger (no migration, contract, stored shape or protocol change; B5's Items-tab
  filters are page memory, not the address); each gets its batch review.
- Batches:

| Batch | Scope | Status |
|---|---|---|
| `B1` | logic, ports, tooling and test harness, no screen change: D81, D83, D84 lines 1-4, 6, 7, 9, D86, D87, D88, D68, D90, D61, D97, D98, K6, K7, K9, K12; DEBT entries for K1, K3, K4, K10, K11; the `catalog-copy` follow-up (K5) | done `7430de8e`, review approve (`reviews/B1.md`); D83's account-delete half and D98 moved to B2 |
| `B2` | D85 (the projection names the held snapshots by hash); D83's account delete (the purchase requests in bounded calls first); D98 (the timed case without axe); `SUPABASE_CLI` gone; B1-1, B1-2, B1-3, B1-5, B1-6, B1-7 and the two B1 checks | done `5eb69ff6`, review approve, test push and e2e pass; D83 moved to B3 |
| `B3` | D60 (the account client from the four Supabase packages), alone (owner Q1) | done `6be801dc`, review approve (`reviews/B3.md`) |
| `B3b` | D83's account delete (bounded request deletes, `analyze` in the 3x case); the stack timeouts (B2 Risk 3, Nit 5); the overload timing at 3x (B2 Risk 2); B2 Nits 1-2; B3 Nits 1-3 | implemented 2026-10-16 as its own commit on `6be801dc`; batch review next, then the test push and e2e |
| `B4` | text, names, markup and placement that move goldens on every page: D75, D77, D79, D80, D89, D99, D100, D101, D102, D103, D105, K1, K3, K4, K11, K16; B1-4 | outline (7.4); mocks at its expansion |
| `B5` | new controls and states: D64 «Выйти», D66, D95, D78 with K8, D84 lines 5 and 8, K2 (Items-tab filters), K10; the closeout carry K14 | outline (7.5); mocks at its expansion |

## 1. Objective and non-goals

Objective: close every `DEBT.md` entry outside R10's section, by a fix or by a recorded reason that
the entry is not a defect at three times the default limits (owner, Q1), and pay the owner's carries
of 2026-10-14/15 (K1-K15).

Non-goals:

- R10's section: D24, D62, D63 and `MoveNotice`'s half of D64. R10's code removal pays them.
- D82: `authoring-print-preview` pays it before this task runs (owner, 2026-10-14).
- D104: `cloudflare-pages` pays the new host; the old-host half is an accepted trade-off.
- K5 «копия из каталога»: a feature, not a defect; B1 records it as the named follow-up
  `catalog-copy` with its open questions (section 10).
- `persist-review`'s consistency re-check itself; this task pays its entries only (2.2).
- Anything past three times the default limits (`docs/decisions/`, 2026-10-01, "Scale is designed
  for three times the default limits; nothing past that").
- The Items-tab filters in the address (K2 keeps them in page memory, as the tab's search).

## 2. Entries, carries, their owners and their fate

### 2.1 Every entry and carry this task takes

| Item | Section today | Decision | Batch |
|---|---|---|---|
| D60 unused account client | Slimmer account client | fix: `AuthClient`, `PostgrestClient`, `RealtimeClient`, `StorageClient` (owner: its own batch) | B3 |
| D64 «Выйти» half | Focus | fix: the focus rule; the `MoveNotice` half moves to R10's section | B5 |
| D66 «Удалить (N)» focus | Focus | fix: the focus rule | B5 |
| D95 a dropped filter pick removes its row | Focus | fix: the focus rule | B5 |
| D68 fake takes 5001 entries | Harness parity | fix | B1 |
| D89 sweep "en" draws gm1 in Russian | Harness parity | fix | B4 |
| D99 the driver names a titled control by its title | Harness parity | fix: `NAME_FN` follows the accessible name | B4 |
| D75 «?» description equals its name | Persistence review | fix: no `title` description | B4 |
| D77 refusal line keeps its language | Persistence review | fix: keep a `Msg` | B4 |
| D78 bulk delete announces every step | Persistence review | fix: announce the start and the end | B5 |
| D79 «Золото» «?» on hover only | Persistence review | fix: «Цена» and a real «?» | B4 |
| D80 strings outside the rules | Persistence review | fix: rules 2, 5, 14 | B4 |
| D86 pending requests read whole | Persistence review | fix: fetch only the requests not held | B1 |
| D87 an older read overwrites newer rows | Persistence review | fix: keep the higher revision | B1 |
| D100 a print press stores the own item of a clashing key | Persistence review | fix: a press resolves the record the page draws | B4 |
| D81 homebrew read downloads every row | Debt cleanup | fix: a re-read by revision | B1 |
| D83 statement timeout waits | Debt cleanup | fix: halve at once; measure the 3x account delete | B1 (paid) |
| D83 account delete at 3x (23.2 s, stops under 4 s) | Debt cleanup | fix: the client deletes the purchase requests in bounded calls, then `delete_account()` (3.10.2, 3.11.2); B2 stopped at step 0 | B3b |
| D84 lines 1-4 | Debt cleanup | fix (memoise, maps, sets) | B1 |
| D84 line 5 «Раздел» row | Debt cleanup | fix: a fold | B5 |
| D84 line 6 revoked shares | Debt cleanup | close: paid by `20261007120000_lifecycle_cleanup.sql` | B1 |
| D84 line 7 editor, `findItems` | Debt cleanup | fix `findItems`; measure the editor, fix past one frame | B1 |
| D84 line 8 one toast slot | Debt cleanup | fix (Q3 = A) | B5 |
| D84 line 9 `exportData` | Debt cleanup | close: not a defect (a string of at most 5 MiB; the zip writer needs whole bytes; `homebrew.json` is one file) | B1 |
| D85 shared page re-download | Debt cleanup | fix (Q2 = A) | B2 |
| D90 `check:db` waits silently | Debt cleanup | fix: a preflight and a reset timeout | B1 |
| D97 usage report rounds to 0.1 MB | Debt cleanup | fix: kB under 1 MB | B1 |
| D98 the slow timed homebrew test | Debt cleanup | fix: the bound kept, axe at the small count of the sibling test (3.10.3); B1's planned options measured no gain | B2 |
| D105 a long source line cut on a print card | Debt cleanup | fix: the whole source line inside the card | B4 |
| `SUPABASE_CLI` in `config.mjs`, `db-push.mjs` (B1-7) | none (handoff) | fix: `supabaseCli()`; the export deleted | B2 |
| D101 a row's name joins two marked words | Debt cleanup | fix in the row's inline renderer | B4 |
| D102 a head-only table has header cells with no data | Debt cleanup | fix: a head-only table draws `<td>` cells, no `<thead>` | B4 |
| D103 a one-language set bonus or rule card text has no mark | Debt cleanup | fix: the item's mark and `lang` | B4 |
| D88 U+2018 not folded | Search | fix | B1 |
| D61 a signed-out tab keeps its old settings | Legacy removal (R10's section) | fix (Q4 = A) | B1 |
| K1 editor «Отмена» after a save | carry | fix: «К моим предметам» in every state (10) | B4 |
| K2 Items-tab filters | carry (a feature) | build: `FilterBar` on the Items tab, page memory (10) | B5 |
| K3 «Сохранить себе» note detached | carry | fix: the button and its note form one group (10) | B4 |
| K4 shared-list note between rows | carry | fix: the notes draw inside the row's border (10) | B4 |
| K5 «копия из каталога» | carry (a feature) | named follow-up `catalog-copy` (10) | B1 writes it |
| K6 R9 e2e F8 navigation timeout | carry | fix: the e2e driver waits for `networkidle2` and names the in-flight URLs on a timeout (10) | B1 |
| K7 `ownKeyFor` cache | carry | fix: a key set and a memo (10) | B1 |
| K8 one shared status region | carry (refactor) | extract with D78 (`CLAUDE.md`, second real use) | B5 |
| K9 vitest timeouts under load | carry | fix: a 5 s Testing Library wait; a watch line (10) | B1 |
| K10 homebrew-table copy buttons | carry | fix: removed (10) | B5 |
| K11 Bold on italic does nothing | carry | fix: `***...***` both orders (10) | B4 |
| K12 `check:fast` vitest path in a worktree | carry | fix: find vitest up the parents (10) | B1 |
| K14 persist-review carry line | carry | closeout writes it | B5 |
| K16 colour print card with no picture | carry (owner, 2026-10-15) | fix: `img/_none.webp` in `.pc-art`, as the site; `PRINT_GLYPH` and `glyphKey` go (3.12) | B4 |

Each `DEBT.md` entry is deleted by the batch that pays it; a section with no entry left is deleted.
D87's **Where** names `app/src/lib/cloudLists.ts`; the code is `CloudLists.#pull` and `#apply` in
`app/src/state/cloudLists.svelte.ts`.

A carry that is a defect and is paid after B1 (K1, K3, K4, K10, K11) gets a `DEBT.md` entry in B1
under "Debt cleanup" (owner: "adds a `DEBT.md` entry"), so a stop after any batch keeps it; the
paying batch deletes it. A carry paid in B1 itself (K6, K7, K9, K12) gets no entry: it would be
written and deleted in one amend. K2 (a feature) and K8 (a refactor with no user-visible defect)
get no entry (`DEBT.md`'s own scope sentence).

### 2.2 Carry line for `persist-review` (owner, Q1; K14)

`persist-review` keeps only its consistency re-check (the pass over the persistence surfaces
against `FEATURES.md` "Consistency rules"); `debt-cleanup` pays D75-D80, D86, D87 and D100, so its
baseline is the rules, not those entries. The closeout writes this into `persist-review`'s roadmap
row (`issues/persistent-storage/plan.md`); B5's acceptance holds the line.

### 2.3 What the releases before this one changed (details: `context.md`)

| Release | Paths it shares with this task | What this plan does |
|---|---|---|
| `homebrew-followups` `4dad178c` | `lib/facets.ts`, `FilterBar.svelte` (offer-only rows), a card's `items`, D95 | B5's fold and the Items-tab filters build on the offer rows; D81 reads `CARD_SELECT` as it is |
| R9 `5a4709e5` | `SharedListPage.svelte`, `ItemPage.svelte` (`.said`), derived keys (`ownKeyFor`) | B4 and B5 edit the pages as R9 left them; K7 memoises `ownKeyFor` |
| R8 `cf98c94c` | `get_shared_list(text)`, `homebrew_items.art`, art triggers, D60 narrowed | B2 wraps the newest body; B1's 3x delete runs with the art triggers; B3 builds four sub-clients |
| print-snapshots `28950398` | `#/p/<id>`, `print_sets`, D99, D100 | B1's 3x delete includes 3000 print sets; B4 pays D99, D100 |
| link-previews `8e3cad6c` | `linkTo`, rule 17, `get_shared_list_preview` | K10 follows rule 17's exclusion; B2 does not touch the preview function |
| rich-descriptions `c8a65230` | `MarkupField.svelte`, `lib/markupEdit.ts`, `Markup.svelte`, `MarkupInline.svelte`, D101-D103, rule 18 | B4 pays K11 and D101-D103 |
| ai-integration `e4f92f7c` | `homebrewEditor.test.ts` (10 s `cropFile` wait) | K9 keeps that wait |
| authoring-print-preview (ships first) | `HomebrewEditor.svelte` (a print view), `PrintCard.svelte`, `PrintPage.svelte`; deletes D82 | B4 edits the editor as it leaves it; B4's D102 edits `PrintCard.svelte`'s `.dtable` as it leaves it |

Migrations of this task sort after every migration on `main` at its dispatch.

## 3. Design

### 3.1 D81: the homebrew re-read by revision (B1)

- Port: `HomebrewRepository.load(known?: HomebrewKnown)`, where
  `HomebrewKnown = { books: Record<string, number>; items: Record<string, number>; cards: Record<string, number> }`
  (row id to the revision held). With no `known`, or all three maps empty, the read is today's
  whole read. With `known`, per table: one `select('id,revision')` (the head), then one
  `select(<TABLE>_SELECT).in('id', changed)` for the ids whose revision differs or is not held,
  only when `changed` is not empty; more than `CHANGED_ROWS_MAX` (50) changed ids of one table
  read that table whole. The answer gains `kept?: { books: string[]; items: string[]; cards:
  string[] }`. An id in neither the rows nor `kept` is gone. The three limit reads stay.
- `CHANGED_LISTS_MAX` becomes `CHANGED_ROWS_MAX` (one name: the most ids one `in.(...)` filter
  names); every use is renamed (`supabase.ts` only; the decision file of 2026-10-02 keeps its
  historical name).
- Store (`Homebrew.read`): it passes `known` from its arrays when `status === 'ready'`, built
  inside the read loop after the in-flight wait, so a retried read sends the revisions held at
  that time (plan-B1 Nit 3). The merge per table: the fresh rows, plus each held row whose id is
  in `kept`; then today's `kept()`. A fresh row whose `revision` is below the held row's keeps the
  held row (the D87 rule).
- Local writes (plan-B1 Blocker 4): `Homebrew` writes a written row's `created_at` and
  `updated_at` from `nowIso()` until a read brings the database's own; a kept re-read would never
  bring them, and sources and items sort by `created_at`. So the store keeps `#written: Set<string>`,
  the ids of the rows its ok writes touched since its last applied read (the ok paths of
  `createBook`, `updateBook`, `createItem`, `updateItem`, `setArt`, `createCard`, `updateCard` and
  the import's rows); `known` leaves those ids out, so the next read fetches them whole; the set
  empties when a read applies. This is where the store departs from the lists store, whose `#read`
  holds only read revisions.
- Read order (plan-B1 Risk 2): the store numbers its reads (`#readSeq`, taken at the start of each
  port call) and drops an answer whose number is below the last applied read's, so an older read
  that answers last can neither remove a row that a newer read created nor bring back a row that
  a newer read deleted. The revision guard stays. `CloudLists` (3.5) and `OwnerRequests` (3.4)
  take the same counter.
- Fake: `load(known)` mirrors `list(known)`. `lazy-cloud.ts` forwards `known`.

### 3.2 D83: a statement timeout halves at once (B1)

- Port: `callFailure` answers `{ ok: false, error: 'fault', timeout: true }` for HTTP 500 with code
  `57014`; the type's fault variant gains `timeout?: true`.
- Store (`CloudLists.#send`): a fault with `timeout` and `n > 1` sets `#cap = Math.ceil(n / 2)`,
  resets `#faults` and `#faultAt`, and continues at once (no `RETRY_MS`, no «Не сохранено»). A
  timeout of a lone op takes today's fault path. The cancelled statement rolled back, so the resend
  is safe.
- Fake (plan-B1 Risk 3): `setFault(match, { timeout: true })` answers `{ ok: false, error:
  'fault', timeout: true }`; the store cases run through the fake, as today's fault cases do.
- Records (plan-B1 Blocker 5): `docs/decisions/2026-09-26-a-request-the-database-fails-three-times-is-halved.md`
  gains an amendment line: a statement timeout (`57014`) of more than one op halves at once; a
  lone op keeps the counted path; the reason: the cancelled statement rolled back. `FEATURES.md`
  "Account and browser lists" ("A send that the server fails three times in a row ...") gains the
  same exception. The new D83 decision file links to the amended one.
- Layer 3 measures `delete_account()` for an account at three times every default limit, and one
  `apply_list_writes` call that deletes 150 lists of 300 entries, each under `statement_timeout =
  '4s'` (half the hosted `authenticated` timeout of 8 s). Pass: the cases stay as the proof and a
  decision file "An account delete stays one statement at three times the limits" records the
  times and the seed time (rejected: a chunked delete in several calls - no measured need, more
  code on the one irreversible path). Fail: the cases stay as `todo` with the measured times,
  D83's account-delete half stays in `DEBT.md` with the figures, the timeout halving ships (it
  does not depend on the delete), and the batch commits on green gates (7.1, "Stop condition";
  plan-B1 Blocker 5).
- Seed (plan-B1 Risk 4): the 3x seed is about 45 000 entries and 1.35 million request lines in
  one rolled-back transaction. Step 0 times it; past 60 s, the request lines go in as the
  superuser with `set local session_replication_role = replica` (no trigger fires), with a
  comment that the case measures the delete, not the triggers of the seed.

### 3.3 D84 lines of B1, and K7

- Line 1: `matchLists` folds each name once per list object: a module-level `WeakMap<StoredList,
  string>` (list objects are replaced on change, so the cache never goes stale).
- Line 2: `OwnerRequests.pendingCounts(now): Map<string, number>` (one pass, `pendingFor`'s rule);
  `ListsPage.svelte` derives it once per render; `waiting()` reads the map.
- Line 3: `AddToList.svelte` derives the ids of the lists holding `one` as a `Set` from `all`;
  `inList` and `pick` read it (a toggle in the open menu updates it; the open-time `held` stays
  for the order only).
- Line 4: `listsHolding` builds `new Set(keys)` once.
- Line 7: `findItems` cuts the ranked hits to the picker's shown count before `recordOption` (export
  the picker's constant if it is local). `previewIndex` and `dirty`: a vitest timing at 3x (the
  catalog plus 300 own items, a 3000-character text); past 16 ms per keystroke, `previewIndex` is
  built only while the preview it feeds is drawn, else the line closes with the figure.
- Lines 6 and 9: closed with the reasons of 2.1.
- K7: `Homebrew` gains a derived key set (`new Set(this.items.map((r) => r.key))`); `has(key)`
  reads it. `AppState.ownKeyFor` keeps a `Map<string, string>` memo that it drops when the user id
  or the `homebrew.items` array changes (both replace on change). `#cardKeyFor` reads a derived
  card key set the same way (`homebrew_cards_per_owner` is 100, so 300 cards at 3x; plan-B1
  Nit 1). The handoff records the time of 5000 calls at 1000 own items before and after.

### 3.4 D86: the owner's pending requests re-read (B1)

- Fact (checked 2026-10-08, re-checked by step 0): a pending request's lines change only in the
  apply function, which sets `status = 'applied'` in the same call; so a pending request changes
  only in `read_at` and `expires_at` (`mark_list_read`).
- Port: `RequestRepository.list(held?: readonly string[])`. With `held`, the keyset pages select
  `id,list_id,audience,created_at,expires_at,read_at` (no lines); the requests whose id is not in
  `held` are then read with `REQUEST_SELECT` by `in('id', ...)` in sequential chunks of
  `CHANGED_ROWS_MAX`. More than `CHANGED_ROWS_MAX` new ids fall back to today's whole read (the
  lists and D81 rule), so a tab back after hours makes no 90 calls. The read is all or nothing: a
  failed head page or a failed chunk answers `{ ok: false }`. The answer is `{ ok: true,
  requests, kept }`: `requests` the new ones whole, `kept` the held ids still pending, each with
  its new `read_at` and `expires_at`. Without `held`, today's read (plan-B1 Blocker 3).
- Store (`OwnerRequests.#readRequests`): passes the held ids when it has read once; merges a kept
  request as the held object with the head's `readAt` and `expiresAt` (a new object only when one
  of them changed); drops a request in neither. A kept id that the store no longer holds is
  dropped: this tab decided it (`#decided`) or a newer read removed it. A failed read keeps what
  the store shows. The read counter of 3.1 drops an answer older than the last applied read. The
  `arrived` signal reads only the new ones, as today.
- Fake and `lazy-cloud.ts` mirror it; a `cloud.contract.ts` case: a second read with every id held
  carries no lines; a new request comes whole; a decided one leaves.

### 3.5 D87: an older account read keeps the newer rows (B1)

- `CloudLists.#apply`: a row whose `revision` is below the held `rev` of the same id keeps the held
  entry (`read[id] = had`, the held list). A `cloudLists.test.ts` case answers two reads out of
  order and expects the newer row to stay.
- `CloudLists.#pull` takes the read counter of 3.1 (plan-B1 Risk 2): an answer from a read that
  started before the last applied read is dropped, so it can neither remove a list that the newer
  read brought nor bring back one that it deleted. One test per store (`cloudLists.test.ts`,
  `homebrew.test.ts`, the `ownerRequests` test): the newer read answers first, the older one
  second, and the store shows the newer answer.

### 3.6 D90: `check:db` fails fast (B1)

- Why a `spawnSync` timeout alone does not end a hang (plan-B1 Blocker 1): `tests/db/run.mjs` runs
  the CLI as `process.execPath SUPABASE_CLI`, and `node_modules/supabase/dist/supabase.js` spawns
  the platform binary as its own child. On Windows the timeout's kill is a `TerminateProcess` of
  the node wrapper only; the Go binary keeps running, and a call with piped stdio stays blocked
  until that grandchild closes the pipes. The suite also resets in two more places with no
  timeout: `resetLocal` in `tests/db/roles.mjs` (`reversibility.test.mjs`,
  `apply-pending.test.mjs`) and `resetLocal` in `tools/supabase/restore.mjs` (the restore drill
  tests).
- `tools/supabase/lib.mjs` gains pure helpers, tested in `tools/supabase/lib.test.mjs`:
  - `supabaseBinary(platform, arch, resolve, env)`: mirrors `dist/supabase.js` -
    `env.SUPABASE_CLI_BINARY_OVERRIDE`, else `@supabase/cli-<platform>-<arch>/bin/supabase` (with
    `.exe` on `win32`), resolved by `resolve` (a `createRequire(import.meta.url).resolve`, which
    walks the parents, so it also finds the binary from a `.claude/worktrees/` checkout with no
    own `node_modules`; this removes `SUPABASE_CLI`'s worktree defect for the resets - plan-B1
    Nit 5).
  - `STACK_SERVICES = ['db', 'auth', 'realtime', 'storage', 'kong']` and
    `stackContainers(projectId)`; `run.mjs`'s existing `complete` check reads the same constant
    (`LOCAL_STACK_EXCLUDES`' comment: Storage must run).
  - `missingContainers(names, isRunning)`: the names whose `isRunning(name)` is false, in order.
  - `stackAdvice(what)`: `check:db: <what>. Run "npx supabase stop" through PowerShell, then run
    check:db again: it starts the stack with its excludes and pulls a missing image.` The line never
    says plain `npx supabase start` (`.claude/README.md`, "Shell hazards").
  - `RESET_TIMEOUT_MS` (the figure step 0 decides; default 300 000) overridable by the
    environment variable `DHLOOT_RESET_TIMEOUT_MS` for the proof, and `resetFailure(result)`:
    `'timeout'` only when `result.error?.code === 'ETIMEDOUT'`; `'failed'` for a signal with no
    `ETIMEDOUT` (an interrupt), another non-zero status or another error; else null (plan-B1
    Risk 5).
  - `resetLocal(opts)`: one reset helper that spawns `supabaseBinary(...)` directly (no node
    wrapper) with `db reset --local`, `timeout: RESET_TIMEOUT_MS`, and answers `{ failure,
    seconds }`. All three reset sites use it: `tests/db/run.mjs`, `tests/db/roles.mjs`,
    `tools/supabase/restore.mjs`. `RESET_COMMAND` (a printed command) stays as it is.
- `tests/db/run.mjs`: after `status`, it checks `missingContainers` for the five services and fails
  with `stackAdvice('<name> is not running')`; the reset runs through `resetLocal`; a timeout
  fails with `stackAdvice('db reset --local did not finish in <n> minutes')`; one progress line
  before `supabase start` and one before the reset, which prints its elapsed seconds when the
  reset ends (Risk 5).
- Proof, two parts: a `node:test` case in `tools/supabase/lib.test.mjs` runs the spawn helper on
  `process.execPath -e "setTimeout(() => {}, 60000)"` with piped stdio and a 1 s timeout and
  expects `'timeout'` within 5 s; on this host, `npm run check:db` (PowerShell) with
  `DHLOOT_RESET_TIMEOUT_MS=1000` prints the FAIL line with the remedy, and `Get-Process supabase`
  after it finds nothing. The handoff records both.
- `.claude/README.md`, "The database suite": a three-row FAIL table (Docker did not answer, a
  container is not running, the reset timed out). Net zero lines: remove "After a hang at "db
  reset", run only `npx supabase stop`, then rerun the check." from "Shell hazards" and cut the
  paragraph's measurement history by the rest (keep the newest figure).

### 3.7 D88 and D68 (B1)

- D88: `foldQuery` maps U+2018 to `'` as it maps U+2019 and U+02BC; `search.test.ts` finds q80 for
  `keeper‘s staff` on the cached and the uncached path.
- D68 (plan-B1 Blocker 2): `apply_list_writes` (`20261007130100_list_entry_gm_only.sql`) raises
  the 5000-entry `22023` inside the per-op `begin ... exception when others` block: the database
  answers that one op `{ ok: false, code: '22023', ... }`, rolls back its savepoint (a `create`
  makes no list) and applies the other ops; `refusalOf` maps it to `{ ok: false, error:
  'refused' }` for that op. A whole-call refusal is only for more than 200 writes. So the fake's
  `applyOne` answers `{ ok: false, error: 'refused' }` for a `create` or `add` of more than 5000
  entries, makes no list for that op and applies the rest. `fake-cloud.test.ts`: a two-op call
  with one 5001-entry `create` and one good op. The export tests in `state/app.test.ts` that built
  5001-entry lists through `create` build them through the fake's seed or `import`.

### 3.8 D61 (B1; owner Q4 = A)

- `AppState` subscribes `env.storage.onExternalChange` once at start, in every build (the existing
  subscription in the auth watch runs only with `env.cloud` and reads only `key === null`). For
  `LANG_KEY`, `HOME_KEY`, `WARN_KEY`, `PREFS_KEY` or `null`, and only while no user is signed in,
  it reads the values again with the start's readers (`readLang`, `homeOf`, `=== '1'`,
  `readLocalPrefs`) and applies a changed value, then `#changed()`; it writes nothing back.
  `PREFS_KEY` follows `STATE.md`, "Defaults and a page's pick" (plan-B1 Nit 2): an outside change
  moves the default and keeps a page value, as the account's answer does (not as a reload, which
  drops the page value). R10 keeps the storage port, so the fix survives R10.

### 3.9 B1 tooling and test harness (D90 above; D97, D98, K6, K9, K12)

- D97: `tools/supabase/usage-lib.mjs` prints bytes under 1 MB as kB with one decimal (`39.4 kB`,
  1 kB = 1000 bytes, as `MB` is 10^6), at and over 1 MB as today; the per-day rate follows the
  same rule. `usage-lib.test.mjs`: 39 362 bytes reads `39.4 kB`; 0 reads `0.0 kB`; 1 500 000 reads
  `1.5 MB`.
- D98: time the four phases of `homebrewPage.timed.test.ts` (the import, the page and tab, the
  fold's draw, `expectNoA11yViolations`) with `performance.now()` logs in one local run. Then
  apply, in this order, the first change that brings the file under 30 s alone, keeping the
  3000 ms draw bound and an axe check: (a) axe over the open fold's panel element, not the whole
  container; (b) the 300 items seeded as fake rows (`fakeCloud`'s seed argument) in place of
  `cloud.homebrew.import`; (c) both. The test's timeout drops to 120 s; its closing comment
  records the new figure. If none brings it under 30 s, keep the file, record the four figures in
  the handoff and leave D98 in `DEBT.md` with them.
- K6 (the F8 flake; plan-B1 Risk 1). The failed attempt's log, read 2026-10-15 (`gh run view
  38474328975 --attempt 1 --log-failed`): F0-F7 ok, then 79 s later `e2e: cleanup ok` and `e2e:
  FAIL - Navigation timeout of 30000 ms exceeded`, with no stack, route or pending request. So
  the call and the cause are unknown; the only navigation that waits for quiet is `driver.open()`
  (`waitUntil: 'networkidle0'`: no request for 500 ms). Fix, two parts:
  - `makeDriver` takes an option `{ waitUntil }`, default `'networkidle0'` (the browser suites
    against `dist-test/` do not change); `withPage` in `tests/e2e/flows.mjs` builds its driver
    with `'networkidle2'` (at most two connections for 500 ms). It keeps a settle point for the
    10 `expectInPage` checks that read once with no wait, some of them negative, and allows two
    long-lived connections (a Realtime socket, a keepalive request). `open()` still waits for
    `ready(page)`.
  - On a navigation timeout, the e2e driver's error names the route and the URLs still in flight
    (tracked from the page's `request`, `requestfinished` and `requestfailed` events), so the
    next flake names its cause; the message keeps the `e2e: FAIL - ...` shape.
  Trade-off accepted: a page with three or more connections that stay open still times out, and
  then the log names them. Rejected: `'load'` (the once-only `expectInPage` checks could run
  before a late alert and pass vacuously); a retry of the flow (it hides a real defect and doubles
  F8's cost); a longer timeout (the quiet can still never come).
- K9: `app/vitest-setup.ts` sets Testing Library's async wait to 5 s (`configure({
  asyncUtilTimeout: 5000 })` from `@testing-library/svelte`), with a comment: the default 1 s
  find failed under the full coverage run on a loaded host (2026-10-14/15: `requestsPanel.test.ts`,
  `importPanel.test.ts`, `homebrewEditor.test.ts`). The explicit 10 s waits on the lazy crop
  chunk stay. Before the change, `git grep -n -E "rejects|findBy.*\.not|queryBy" -- "app/src/**/*.test.ts"`
  locates a find or `waitFor` that is expected to fail; each such call passes `{ timeout: 1000 }`
  so a negative case does not slow down. Watch line in `docs/specs/COVERAGE.md`, "Component-test
  traps": the lazy crop chunk (`ArtField.svelte`) loads late under load; its finds wait 10 s where
  measured (`homebrewEditor.test.ts` `cropFile`, the crop heading of `artField.test.ts`'s
  chunk-failure case) and 5 s elsewhere
  (`artField.test.ts` `crop()` and its other `hbArtDone` finds). Rejected: per-find waits in two
  files (no record names the find that failed); moving cases to the `timed` project (no record
  says the 30 s test timeout fired).
- K12: `tools/check/lib.mjs` gains `findUp(start, rel, exists = existsSync)`: the first
  `<dir>/<rel>` that exists from `start` up to the filesystem root, else null.
  `tools/check/fast.mjs` runs `findUp(ROOT, 'node_modules/vitest/vitest.mjs')` and, on null,
  fails the vitest stage with `check:fast: vitest not found from <ROOT>. Run npm ci in <ROOT>.`
  (the checkout the run is in; never another session's checkout - plan-B1 Nit 5).
  `tools/check/lib.test.mjs`: found in `start`, found in a parent, not found.

### 3.10 B2: D85, D83's account delete, D98 and the tooling nits

#### 3.10.1 D85: the re-read names the held snapshots by hash (Q2 = A)

- Migration `supabase/migrations/20261015120000_shared_list_have.sql` (renumber after the newest
  migration on `main` at dispatch), reversal `supabase/reversals/` of the same name (`drop
  function public.get_shared_list(text, bigint, jsonb)`). A security invoker overload, no body
  copied, so R8's `img` and the GM-only rule stay:

  ```sql
  create function public.get_shared_list(p_token text, p_since bigint, p_have jsonb)
  returns jsonb language plpgsql stable security invoker
  set search_path = public, pg_temp
  as $$
  declare
    v jsonb := public.get_shared_list(p_token, p_since);
    v_have jsonb := case when jsonb_typeof(p_have) = 'object'
      and octet_length(p_have::text) <= 65536 then p_have else '{}'::jsonb end;
  begin
    if v is null or v ? 'unchanged' then
      return v;
    end if;
    return jsonb_set(v, '{entries}', coalesce((
      select jsonb_agg(case when h.rev is null then e.value
          when v_have ->> (e.value ->> 'hid') = h.rev
            then (e.value - 'snapshot') || jsonb_build_object('rev', h.rev)
          else e.value || jsonb_build_object('rev', h.rev) end
        order by e.n)
      from jsonb_array_elements(v -> 'entries') with ordinality as e(value, n)
      cross join lateral (select case when e.value ? 'hid'
          and jsonb_typeof(e.value -> 'snapshot') = 'object'
          then md5((e.value -> 'snapshot')::text) end as rev) h), '[]'::jsonb));
  end;
  $$;
  revoke execute on function public.get_shared_list(text, bigint, jsonb) from public;
  grant execute on function public.get_shared_list(text, bigint, jsonb) to anon, authenticated;
  ```

  The header comment names the decision file and why `rev` is the database's hash: the record
  embeds its source and cards, each with its own revision, and the client cannot rebuild
  `jsonb`'s text form. A `p_have` that is not an object or is over 64 KiB counts as `{}` (300
  entries at 3x send about 23 KB). An official entry carries no `rev`.
- `lib/cloudLists.ts` (pure): `SharedRow` entries gain `rev?: string` (the database's opaque
  hash). `type SharedHeld = ReadonlyMap<string, { rev: string; snapshot: unknown }>`;
  `heldSnapshots(row)` maps each entry with `hid`, a string `rev` and an object `snapshot`;
  `withSnapshots(raw, held)` rebuilds every entry as `{ ...rest, snapshot }` (one key order on
  every read, so `sameProjection` stays exact) and fills a missing `snapshot` from `held` by `hid`
  when the `rev` matches; it answers null when an entry with `hid` has no `snapshot` and no
  matching held one.
- Port `shares.read(token, since?, held?)` (`types.ts`, `supabase.ts`): every read names the
  three-argument overload, `{ p_token, p_since: since ?? null, p_have: <hid to rev of held, else
  {}> }`; a held map is captured before the call and filled from after it. An answer that
  `withSnapshots` cannot fill reads once more with `p_since: null, p_have: {}`; a second
  unfillable answer answers `{ ok: false }`, so the shown list stays and no third call is made
  (plan-B2 Nit 3). A `PGRST202` answer (the reversal pushed) sets a flag on the port instance and
  this and later reads take today's calls (`{ p_token }` or `{ p_token, p_since }`).
- The fake mirrors the rule, as B1's fake mirrors `load(known)` and `list(held)` (plan-B2
  Blocker 1): its projection writes `rev` on each entry with `hid` and an object `snapshot` as a
  deterministic opaque string of that snapshot (a hash of its JSON text; the client treats `rev`
  as opaque, so it need not match `md5`), and `read(token, since, held)` leaves out `snapshot`
  where `held` names that `hid` with that `rev`, then fills through the same `withSnapshots`.
  Trade-off accepted: more fake code and expectation churn, for one fill path on every adapter.
  `lazy-cloud.ts` forwards `held`; the `read` stubs of `sharedListPage.test.ts` and
  `sharedView.test.ts` forward `held` too (plan-B2 Nit 6).
- `SharedView.refresh()` passes `heldSnapshots(this.shared)` when `status === 'ready'`.
  Campsite in the touched path (the B1 read-order rule, 3.1): `SharedView` numbers its reads
  (`#readSeq`, taken before each port call in `open()` and `refresh()`) and drops an answer older
  than the last applied one.
- `get_shared_list_preview(text)` and `clone_shared_list` are not touched.
- Records: `CONTRACTS.md` (the `#/s/` projection sentence gains the overload and `rev`),
  `META.md` (both sentences that count the `anon` functions say seven and name
  `get_item_preview(uuid,text)`, `get_shared_list_preview(text)` and the new overload, as
  `harness.test.mjs` lists them; plan-B2 Nit 1), `FEATURES.md` "Account and browser lists"
  (after "A re-read names the revision the page shows ...": a re-read also names the linked
  items' records it holds by hash, and an unchanged record is not downloaded again),
  `COVERAGE.md` (the `list-shares.test.mjs` row), the decision file "A shared page re-read names
  its held snapshots by hash" (links 2026-10-02 "A shared page re-read names its revision";
  rejected: closing D85 by a decision, a 10 s throttle, a revision per entry, the item's
  `revision` as the key, a client-side hash). `docs/fixtures/`, `llms.txt` and
  `tests/contracts.js` hold no projection (checked 2026-10-15: no fixture or line names
  `get_shared_list` or `topic_key`); layer 3 and the hosted contract case pin it.

#### 3.10.2 D83: the account delete at three times the limits

- Cause (B1's measurement; real figure, B1-1): the 3x seed holds 1.35 million purchase request
  lines (150 lists x 30 pending x 300 lines) of about 1.4 million rows; the delete took 20-23 s and
  stopped at the cascade into `purchase_request_lines` under 4 s. At the defaults the lines are
  1/27 of that (50 000) and the entries 1/9, so a default account deletes well under the timeout;
  the defect is near 3x, where the 2026-10-01 scale decision designs. 150 lists of 300 entries
  delete in 172-215 ms (B1), so the rest of the cascade is small.
- Why not one statement: the `authenticated` statement timeout covers the whole RPC call, so a
  loop inside `delete_account()` does not help; a function-level `statement_timeout` is not relied
  on (`context.md`, "Reasons already disproved"); raising the role's timeout is a do-not.
- Migration `supabase/migrations/20261015120100_account_delete_requests.sql` (after 3.10.1's),
  reversal drops the function:

  ```sql
  create function public.delete_account_requests()
  returns integer language plpgsql security definer
  set search_path = public, pg_temp
  as $$
  declare
    v_uid uuid := auth.uid();
    v_n integer;
  begin
    if v_uid is null then
      raise exception 'delete_account_requests: not signed in' using errcode = '28000';
    end if;
    delete from public.purchase_requests r
      where r.id in (
        select q.id from public.lists l
          join public.list_shares s on s.list_id = l.id
          join public.purchase_requests q on q.share_id = s.id
        where l.owner_id = v_uid
        limit 200);
    get diagnostics v_n = row_count;
    return v_n;
  end;
  $$;
  revoke execute on function public.delete_account_requests() from public, anon;
  grant execute on function public.delete_account_requests() to authenticated;
  ```

  200 requests are at most 60 000 lines at 3x (`request_lines` 300). The header comment names the
  decision file. `delete_account()` is unchanged (a stale tab and the down migration keep it).
- Port `auth.deleteAccount()` (`supabase.ts`): calls `rpc('delete_account_requests')` until it
  answers 0 or not a number, at most `ACCOUNT_DELETE_CALLS_MAX` (100) times (20 000 requests;
  the 3x account holds 4500 pending plus the decided ones of the last 24 hours), then
  `rpc('delete_account')` and the local sign-out as today. An error answers `failed` and calls
  nothing more; `PGRST202` (the reversal pushed) goes straight to `delete_account()`. The fake,
  `lazy-cloud.ts`, `types.ts` and `AccountPage.svelte` do not change; the page's busy state
  covers the longer call (no new string).
- Records: `FEATURES.md` "Account" (deletion first removes the account's purchase requests in
  bounded calls, then the account), `COVERAGE.md` (the `delete-account.test.mjs` row), the
  decision file "An account delete removes its purchase requests in bounded calls first"
  (rejected: one statement - 20-23 s at 3x; a loop inside `delete_account()` - one timeout covers
  the call; a `pg_cron` delete - the account would stay usable until the job runs, a change of
  «Аккаунт удалён»; a new return type on `delete_account()` - a stale tab would report a delete
  that did not finish); the 2026-10-15 decision "A statement timeout halves a request at once"
  gains a line that links the new one. B1-1: if the stop condition of 7.2 fires, D83's text
  in `DEBT.md` takes the real ratio and the cost of its `todo` case (B1-2).

#### 3.10.3 D98: the timed case keeps its bound and ends without axe

- Fact (B1): axe over the 400 member links and their buttons is 41.0 s of the file's 52-56 s,
  43.2 s over the fold alone; the import is 17-22 ms; neither planned option helps.
- Decision: `homebrewPage.timed.test.ts` keeps its seed, the 3000 ms draw bound and the order
  check, and ends without `expectNoA11yViolations`. Its timeout is at least three times the
  larger of two figures, the file alone and the case inside `check:2` (the case timed out inside
  the full coverage run before; plan-B2 Nit 4), and at most the 300 000 ms of today; the closing
  comment records both figures and names the sibling case. The open fold's axe
  stays in `homebrewPage.test.ts`, "lists own and book members by name, a gone id by its own
  words, and counts both" (own, book and gone rows in one `{#each}`; three rows reach every rule
  that 400 rows reach, duplicate ids and same-name links included). `listPage.timed.test.ts` and
  `importPanel.timed.test.ts` already end without axe.
- Records: `COVERAGE.md` (the layer 1 row: a `timed` component case measures its bound; the axe of
  its state runs in the sibling component test at a small count; and the same exception in the
  row "`expectNoA11yViolations` in every component test" of "What is enforced, and by what",
  which names the three timed files; plan-B2 Nit 5), a decision file "A timed
  component case leaves axe to its sibling test" (rejected: a rule subset - it changes what axe
  proves for every rule; axe over a sample of rows - an axe context argument for one caller;
  keeping 52-56 s; a split of the file - it moves the cost and does not cut it).

#### 3.10.4 Tooling nits in B2's touched paths

- B1-7: `tools/supabase/config.mjs` and `db-push.mjs` spawn `supabaseCli()` (B1's helper) in
  place of `process.execPath SUPABASE_CLI`; `SUPABASE_CLI` and its JSDoc leave `lib.mjs` when
  `git grep -n SUPABASE_CLI` finds no other user (the `SUPABASE_CLI_BINARY_OVERRIDE` variable
  stays). B2's own test push runs from this worktree, which has no `node_modules`.
- B1-5: `tests/db/run.mjs` and `tools/supabase/restore.mjs` catch the throw of `supabaseCli()`
  once and print its message as one `check:db: FAIL - ...` (`restore: FAIL - ...`) line.
- B1-6: `bytesText` (`tools/supabase/usage-lib.mjs`) compares the rounded kB value with 1000, so
  999 950 bytes print `1.0 MB`; a `usage-lib.test.mjs` case.
- B1-3: `OwnerRequests.read()` advances `#appliedSeq` when any part of the read applies
  (`r.ok || all.ok || one?.ok`), so an older read cannot apply older notices over a newer read's;
  a test. Placed here with `SharedView`'s counter: one read-order rule, one batch.

### 3.11 B3 and B3b: D60 (B3); D83's account delete, the stack tooling and the overload's time (B3b)

#### 3.11.1 D60: the account client from four packages (B3)

- Read 2026-10-16: `@supabase/supabase-js` 2.117.1 (a devDependency, bundled by Vite) and its
  four sub-packages at 2.117.1. `SupabaseClient`'s constructor
  (`node_modules/@supabase/supabase-js/src/SupabaseClient.ts`) is the model, call for call:
  - one base: `new URL(ensureTrailingSlash(url.trim()))` (`validateSupabaseUrl`); every address
    is `new URL('auth/v1', base)`, `rest/v1`, `storage/v1`, and `realtime/v1` with `http`
    replaced by `ws` in the protocol (plan-B3 Blocker 1);
  - the auth storage key is `` `sb-${base.hostname.split('.')[0]}-auth-token` `` - the stored
    session of every signed-in reader and the PKCE verifier (`<key>-code-verifier`) live under
    it, so the new client uses the same key (a changed key signs everyone out);
  - `fetchWithAuth` (`src/lib/fetch.ts`) reads the session token on every request
    (`auth.getSession()`), sets `apikey: key` when absent and `Authorization: Bearer <token ??
    key>` when absent; PostgREST, Storage and Realtime's HTTP send use it, so no header holds a
    token between requests; the auth client's own fetch is never wrapped;
  - Realtime takes `params: { apikey: key }` and `accessToken: async () => token ?? key`, and
    `_handleTokenChanged` calls `realtime.setAuth(token)` on `SIGNED_IN`, `TOKEN_REFRESHED` and
    `INITIAL_SESSION` when the token changed, and `realtime.setAuth()` on `SIGNED_OUT`, from a
    synchronous `onAuthStateChange` callback.
- `app/src/ports/supabase.ts` (the only importer; `SUPABASE_ONLY_IN_PORT` already covers
  `@supabase/*`): in `createCloud`, in place of `createClient`, one local `accountClients(url,
  key, storage?)` builds the base by the rule above, one `keepaliveFetch(url, tab)` instance
  (`plain`), and returns `{ auth, rest, realtime, storage }`:
  - `auth = new AuthClient({ url: <base>auth/v1, headers: { Authorization: 'Bearer ' + key,
    apikey: key }, storageKey, flowType: 'pkce', detectSessionInUrl: false, persistSession:
    true, autoRefreshToken: true, fetch: plain, ...(storage ? { storage } : {}) })`
    (`keepaliveFetch` passes every non-`rest/v1` request through untouched, as today);
  - `authed`: a local `fetchWithAuth` of the rule above over `plain`;
  - `rest = new PostgrestClient(<base>rest/v1, { headers: {}, schema: 'public', fetch: authed })`;
  - `realtime = new RealtimeClient(<ws base>realtime/v1, { params: { apikey: key },
    accessToken: async () => (await token()) ?? key, fetch: authed })`;
  - `storage = new StorageClient(<base>storage/v1, {}, authed)`;
  - `auth.onAuthStateChange` with the token rule above (synchronous; no await - the existing
    comment on `onChange` holds the reason).
  Every call site renames: `client.auth.*` to `auth.*`, `client.rpc` and `client.from` to
  `rest.*`, `client.channel` and `client.removeChannel` to `realtime.*`, `client.storage.from`
  to `storage.from`. `REALTIME_SUBSCRIBE_STATES` comes from `@supabase/realtime-js`, `User` and
  `UserIdentity` from `@supabase/auth-js`. The header comment and the comments at
  `keepaliveFetch`, `storage` and `onChange` name the four packages (plan-B3 Nit 2).
- `package.json`: `@supabase/auth-js`, `@supabase/postgrest-js`, `@supabase/realtime-js` and
  `@supabase/storage-js` join `devDependencies` at `2.117.1` (the versions supabase-js already
  locks, so no second copy); `@supabase/supabase-js` stays (`tests/e2e/admin.mjs`,
  `tests/e2e/contract.mjs`, `tests/db/realtime.test.mjs` use it). `package-lock.json` by `npm
  install --package-lock-only` in this worktree (the main checkout's `node_modules` already holds
  the four packages; never `npm ci` in another checkout).
- Records:
  - the decision "The account client loads after first paint; a provider redirect settles
    before mount" (`docs/decisions/2026-09-24-the-account-client-loads-after-first-paint-a.md`)
    gains an amendment line with four facts (plan-B3 Nit 5): four packages and `fetchWithAuth`'s
    rule; `X-Client-Info: supabase-js/2.117.1; runtime=web` is no longer sent (nothing in
    `supabase/`, `app/`, `tests/` or `tools/` reads it); the five `@supabase/*` packages move
    together at one version (a split installs a second copy, and the old and the new bundle
    share one stored session); the port now names the storage key itself, by supabase-js's
    rule, which the decision once rejected reading - a library upgrade cannot move it;
  - `docs/specs/STATE.md`, the `sb-<ref>-auth-token` row (plan-B3 Nit 1): "Written and removed
    by auth-js 2.117.1 under the key that `ports/supabase.ts` names by supabase-js's rule
    (`sb-<first host label>-auth-token`); never by the app's own code";
  - `COVERAGE.md` (Nit 2): the `ports/supabase.test.ts` row (the four package stubs, the
    storage key, the per-request token, the `setAuth` rule) and a row for the new
    `ports/supabase.real.test.ts`; the "stub supabase-js client" and "as supabase-js parses the
    configured URL" wording in that row, the F1 paragraph and the Node paragraph;
    `tests/e2e/lib.mjs` (two comments) and `tools/bundle-budget.mjs` (the chunk comment) the
    same;
  - `.claude/README.md` "The configured bundle budget": step 0's figure and the new one (the
    budget stays 303 kB);
  - `DEBT.md` D60 and the section "Slimmer account client" deleted.

#### 3.11.2 D83: the account delete at three times the limits (B3b)

- The design of 3.10.2 holds unchanged: `20261015120100_account_delete_requests.sql` (200
  requests a call, security definer, `28000` with no session), its reversal, the port loop with
  `ACCOUNT_DELETE_CALLS_MAX` (through `rest.rpc` after B3's D60), the `PGRST202` fallback, the
  records of 3.10.2 (the decision file "An account delete removes its purchase requests in
  bounded calls first", the amendment line, `FEATURES.md` "Account"), and every test and
  acceptance line of 7.2 steps 5 and 6 (the plan-B2 Risk 3 cases included).
- The change (refresh before B3): the 3x case runs `analyze` on the seeded tables (`auth.users`,
  `homebrew_books`, `homebrew_items`, `homebrew_cards`, `lists`, `list_entries`, `list_shares`,
  `purchase_requests`, `purchase_request_lines`, `print_sets`) after the seed, inside its
  transaction, with a comment: a hosted database keeps statistics (autovacuum's analyze); a
  fresh local seed has none, and then the `homebrew_items` cascade took 9.0 s (2026-10-16).
  Plan-B3 Nit 6: `analyze` may write `pg_class.reltuples` and `relpages` in place, counting the
  transaction's own rows, so the seeded counts can outlive the rollback while the column
  statistics roll back. After the rollback the case runs `analyze` on the same tables again,
  outside a transaction, and its comment says why; the handoff records `select relname,
  reltuples from pg_class where relname in ('purchase_request_lines', 'list_entries')` before
  and after that second `analyze`.
- The decision file states the figures (B2 step 0: request delete 2.3-4.2 s as one statement;
  the rest 4.9-5.7 s without statistics, 318 ms with them; the `explain` lines) and the
  trade-off with its mechanism (plan-B3 Nit 7): autoanalyze runs on a table once its changed
  rows pass 50 plus 10 % of its row count, and autovacuum looks every 60 s; a hosted table that
  holds other accounts' rows already has statistics for the planner. Right after a bulk import,
  before autoanalyze, the final step may pass the hosted 8 s; the error toast shows, and a later
  press finishes. The hosted figure is not measured. Rejected: a bounded item delete (the item
  cascade is a planner effect, not row volume); keeping D83 (the request lines alone pass 4 s at
  3x).
- B2 Nit 1: if D83 stays (stop condition), its `DEBT.md` text says the per-row trigger cause is
  inferred: the `explain` line is the `homebrew_items_owner_id_fkey` cascade, 1 call.

#### 3.11.3 The stack tooling and the overload's time (B3b: B2 Risks 2, 3, Nit 5)

- B2 Risk 3: `supabase start` and `supabase stop` in `tests/db/run.mjs` run with stdout and
  stderr inherited (`['ignore', 'inherit', 'inherit']`): a pull shows progress, and no
  grandchild can hold a pipe of `run.mjs`; `status` stays piped (its JSON is read). A start that
  fails prints the CLI's own output above `supabase start failed.` `STACK_TIMEOUT_MS` comes from
  a measurement of the binary `check:db` spawns (plan-B3 Risk 3): step 0 resolves it with
  `node --input-type=module -e "const m = await import('./tools/supabase/lib.mjs');
  console.log(m.supabaseCli(process.env));"` from the worktree, then times three warm starts
  (the stack stopped, the images present; PowerShell, `Measure-Command { & <path> start -x
  <excludes> }`, `& <path> stop` between runs). Rule: three times the slowest, rounded up to the
  minute; past 240 000 ms (under the hang guard's 300 s stall kill, so the FAIL line prints
  first), the bound is 240 000 ms when the slowest is at most 120 s, else B3b stops for the
  planner with the three figures. A new `DHLOOT_STACK_TIMEOUT_MS` overrides it
  (`stackTimeoutMs(env)`, as `resetTimeoutMs`), and the timeout line names it for a first run
  that pulls images. `stalled()` prints the bound in the reset line's format (`N minutes` when
  whole, else `N s`) through `stackTimeoutMs(env)` (plan-B3 Nit 8). `lib.test.mjs` covers the
  override, a bad value and the format.
- B2 Nit 5, with plan-B3 Risk 4's shapes: `runningContainer()` runs `docker ps` with a
  30 000 ms timeout (`docker ps` answers in under a second when Docker is up) and throws
  `Error('docker ps did not answer in 30 s. ...')` on a timeout (its `null` keeps meaning "not
  running"); `run.mjs` catches it around the container checks, prints `failLine('check:db',
  err)` and returns `SAID`. `tools/supabase/restore.mjs` `cli()` runs through `runTimed` with the
  same bound and stdio rule; `ensureStackWithAuth()` throws on a timed-out start, stop or status
  with the `stalled()` text; the drill's `main()` catch puts it in `state.failure`
  (`restore:drill: <message>` then `restore:drill: FAIL`), and `restore-prod.mjs` has the same
  handler. A `node:test` case covers the throw (a stub `spawnSync` result with `error.code ===
  'ETIMEDOUT'` through `runTimed`'s failure helper).
- B2 Risk 2: a layer 3 case in `list-shares.test.mjs` seeds one list of 300 entries, each linked
  to its own homebrew item with the longest record the validators allow (each text field at its
  validator bound, about the 81 KB of D85's estimate; `homebrew_items` at 3x through
  `user_limit_overrides`; the seed through the superuser, as the 3x delete case seeds), and
  times `get_shared_list(token, null)` and `get_shared_list(token, null, '{}')` as `anon`, three
  runs each after an `analyze`; it logs both medians and asserts the three-argument median under
  half the hosted `anon` statement timeout. Step 0 reads that timeout once on the test project
  through `SUPABASE_DB_URL_TEST` (read-only, a scratch script with `--env-file`): `rolconfig` of
  `anon`; when it holds no `statement_timeout`, `pg_db_role_setting` for the database and for
  `authenticator`; the handoff records the effective value, never a silent default (plan-B3 Nit
  9). The bound takes production as equal to the test project (both on Supabase's defaults;
  agents read no production). Both figures go into `COVERAGE.md` (the `list-shares.test.mjs`
  row) and the decision file "A shared page re-read names its held snapshots by hash" (one
  line). A median past the bound is a `DEBT.md` entry under "Debt cleanup" with the figures, not
  a redesign in B3b.
- Plan-B3 Nit 10: the overload timing and the 3x delete case assert a host-dependent time in
  `check:db`, which CI's `db` job runs before `deploy`. The `COVERAGE.md` rows say so: the
  figure is this host's; a CI miss is a `DEBT.md` entry with the CI figure, not a retry.
- B2 Nit 2: `.claude/README.md`, the FAIL row of the missing CLI binary says "Run `npm ci` in the
  checkout the run is in"; rule 2n's phrase names `RESET_COMMAND` (`lib.mjs`) beside CI's entry.
  The README stays net zero over the task.

### 3.12 B4 designs (outline; expanded at B4's refresh after B3)

- D75: `HelpButton.svelte` keeps `aria-label` and drops `title` (or keeps a visible tooltip
  without `title`); every golden with a «?» loses its `description`.
- D77: the `refused` state of `HomebrewEditor`, `CardForm`, `QuickItem` holds a `Msg`.
- D79: the row field «Золото» becomes «Цена» / "Price" with a `HelpButton` that opens the coin
  conversion (`aria-expanded`, touch and keyboard).
- D80: `dict.ts` and `help.ts` lose every em dash; the clipboard failure strings, `docTitle`,
  `uniqueHint`, `printSub`, `printSubCompact` and the `app.say` calls of `RequestsPanel`,
  `AddToList` and `state/` follow rules 2, 5 and 14.
- D89: the sweep's English run signs gm1 in with English preferences and asserts the page's `lang`
  per signed-in entry.
- D99: `NAME_FN` in `tests/app/driver.js` names a control in the accessible-name order
  (`aria-labelledby`, `aria-label`, the text, then `title`); every suite that pressed a titled
  control by its title presses it by its text. The e2e flows use the same driver and run too.
- D100: `printEntriesOf(ids, qty, recordOf = (id) => this.recordFor(id))` and `print(ids, qty,
  recordOf?)`; `PickRow.svelte` passes its drawn `it` for its own id; `SelBar.svelte` takes an
  optional `recordOf` prop that `SharedListPage.svelte` (its index) and `ListPage.svelte` (a row's
  linked record) pass; a signed-out prompt stores the entries resolved the same way.
- D101: the inline renderer keeps the space between two marked runs inside the element before it
  (the visible text is unchanged), so Chrome's button name keeps it; the two goldens D101 names
  prove it.
- D102: a table with a head and no rows draws its cells as `<td>` in a `<tbody>`, no `<thead>`
  (`Markup.svelte` and `PrintCard.svelte`'s `.dtable`).
- D103: `RecordCard.svelte` draws the item's one-language mark and `lang` for a set bonus and a
  rule card text, by the same derivation as an item description; the `I18N.md` departure sentence
  goes. No new string.
- K1: the editor's ghost link reads «К моим предметам» / "To my items" (`t.hbToMyItems`, the
  editor's name for the same link in its missing and gone states) in every state. On a dirty form
  the press goes through the leave guard (`hbDropEdits`: OK leaves and drops the edits, Cancel
  stays). No new string; no label change while typing (no layout shift in the button row).
- K3: in `PickRow.svelte` the «Сохранить себе» button and its note form one group on a line of
  their own under the other pick buttons: the button, then the note beside it where it fits, else
  under it; the note has an id and the button `aria-describedby` names it. Mock at expansion on
  `#/h/<uuid>`, the record modal and `#/s/`, 360 px and 1180 px.
- K4: `SharedListPage.svelte` draws an entry's two `HitNote`s in `TableRows`'s `inside` snippet,
  before the take line, in a `div.rnotes` that takes the row's full width inside its border (the
  pattern of `.pickrow` and of the owner's list page, `list-editor-note-attached.png`); the first
  note has no top margin there. `TableRows`'s `after` prop goes (no other user). Mock at
  expansion, 360 px and 1180 px.
- K16 (owner, 2026-10-15): `PrintCard.svelte`'s `.pc-art` (drawn only when `!bw`) draws the
  site's fallback `img/_none.webp` (`artSrc`, `lib/desc.ts`) for a record with no picture or a
  broken one, in place of the `.pc-glyph` outline, on the standard and the compact sheet;
  black-and-white keeps no art block. `PRINT_GLYPH`, `glyphKey` and `GlyphKey` leave
  `lib/print.ts` with their `print.test.ts` cases (`git grep` on 2026-10-15: no other user).
  The Figma colour node `714-42387` draws the outline: `FEATURES.md` "Print" records the owner's
  departure (2026-10-15).
- D105: the source line of `.pc-bottom` wraps or shrinks so the whole line is inside the card
  (the design at B4's expansion, with the clip report counting it).
- K11: `toggleMark` wraps to `***core***` where today it returns null: the selection's core sits
  between equal star runs of the other mark (italic run 1 for Bold, bold run 2 for Italic), with
  the selection inside the stars (`{ from: s, to: e, text: mark + core + mark }`) or around them
  (the picked text holds the runs: the same edit over the whole selection). A selection with one
  end on stars, or with unequal runs, still returns null. Unit cases: Bold on `*word*` and Italic
  on `**word**`, inside and around; pressing the same button again restores the input; the
  existing parse property passes. A touch check in the Browser pane: the mobile preset (touch
  emulation) on the test build's `#/homebrew/new?as=gm1`, an italic word selected, Bold tapped,
  the box reads `***word***` (the handoff records it).

### 3.13 B5 designs (outline; expanded at B5's refresh after B4)

- D64, D66, D95: one rule in a decision file and a new numbered rule in `FEATURES.md`,
  "Consistency rules" (rule 19): when a press removes the pressed control, focus goes to the
  control that takes its place, else to the next control in reading order, else to the page
  heading (`tabindex="-1"`). «Выйти» focuses the «Войти» link; «Удалить (N)» on `#/lists`
  focuses the first card left, else the heading; a dropped pill or «Сбросить всё» focuses the
  next pill, else the table heading; the homebrew bulk delete follows the rule if it has the same
  defect.
- D78 and K8: one component for the visually hidden status regions (`.said` on `#/s/` and `#/h/`,
  `.lsaid`, `.rsaid`; `CLAUDE.md`, "Extract shared UI on its second real use"); the bulk delete's
  progress counter is drawn outside it, and the region says the start and the end.
- D84 line 5: the «Раздел» row draws its chosen chips and the first chips up to a count, then a fold
  «Ещё N» / "N more" (rule 12, `aria-expanded`). Mock at expansion, 360 px and 1180 px.
- D84 line 8 (Q3 = A): an error toast and a toast with an action keep the slot for their time; a
  later plain toast waits and shows when they end (one waiting toast; a newer one replaces it); a
  later error or action toast replaces them at once. `FEATURES.md` "Chrome" (the toast paragraph)
  gains the sentence.
- K2: the Items tab of `#/homebrew` draws the `FilterBar` of `#/tables/homebrew` over the own
  records (its facet groups, the offer rule, the «Раздел» fold), with a source row when the
  account has two or more sources; under the search, above the selection strip. Page memory, empty
  each time the tab opens (as the search); a tick that a filter hides is dropped (as the search;
  `STATE.md`, the UI row); the bulk strip acts on the ticked rows that the search and the filters
  draw. Not in the address (a route change is a public contract). Mock at expansion. B5's
  error-scenarios table lists a bulk delete and a bulk move with a ticked row that a filter
  hides (the tick is dropped before the strip acts), so the batch review sees the destructive
  path (plan-B1 Nit 6; the search's existing rule, no plan-review trigger).
- K10: on `table === 'homebrew'`, `TablesPage.svelte` draws no table-link button, passes no
  `oncopylink` to `FilterBar` and draws no section copy button; `FEATURES.md` "Tables and search"
  (the three copy buttons) and rule 17's exclusion say that the homebrew table hands out no link.

## 4. Standing checks

### 4.1 B1

1. Scale: no screen change. At 3x: D81's unchanged re-read sends three heads (at most 300, 300
   and 60 ids) and three limit reads in place of up to about 4 MB of rows at the defaults and
   three times that at 3x (D81's estimates); D86's unchanged re-read pages ids and two times of up
   to 4500 requests in place of up to about 4 MB at the defaults; D83 brings a 200-op request to a
   single op in at most eight sends with no waits; K7 makes `has` constant time and `ownKeyFor`
   one hash per key per items change. The 3x account (150 lists of 300 entries, 300 items, 300
   cards, 60 sources, 30 pending requests of 300 lines per list, R8's art rows, 3000 print sets)
   is deleted in one call under 4 s locally, or B1 stops.
2. Error scenarios:

| Scenario | What the screen shows | Stored data | Recovery |
|---|---|---|---|
| loading (first homebrew or requests read) | as today | none | - |
| failed head or changed read | the shown rows stay; a failed first read shows today's error state | kept | the next poll or message |
| offline | as a failed read | kept | as above |
| another device writes between head and changed read | the newer row | kept | the next read compares again |
| a row deleted (or a request decided) between the two reads | it leaves at this read | dropped from memory only | - |
| a row created after the head | it appears at the next read (its message triggers one) | kept | - |
| two reads answer out of order (D81, D86, D87) | the newer read's answer; an older answer is dropped by the read counter, and a changed row keeps the higher revision | kept | - |
| a request decided in this tab while a read with its id in `held` is in flight (D86) | it stays gone: a kept id the store no longer holds is dropped | none | - |
| a requests read fails on its head or one chunk (D86) | the shown requests stay | kept | the next message or safety read |
| a homebrew row written in this tab (D81) | the client's times until the next read, which fetches the row whole | kept; the database's times arrive | - |
| a stale tab (previous bundle) | today's whole reads | unchanged | - |
| revert (previous frontend) | today's reads and the 15 s fault wait | no stored shape changes | - |
| `apply` timeout, n > 1 | «Сохраняем...» stays | every op stays in the queue; halves are cut from the queue at send time | - |
| `apply` timeout, a lone op | today's fault path | dropped after `FAULT_LIMIT` with today's toast | - |
| D61: another tab writes a bad value | the start's fallback | this tab writes nothing | - |
| K7: the user or the own items change | the next `ownKeyFor` call reads the new set | none (memory only) | - |
| D90: a missing container or a hung reset (at any of the three reset sites) | one line with the remedy; no `supabase` process left | the local stack only | the remedy |
| K12: no vitest up the parents | one line naming the path | none | `npm ci` |

   No path loses stored data. Each retried write reads its fields from the queue at send time.
3. Consistency: no screen change; D61 applies settings as a reload does; D90 and K12 keep the
   `check:db:` and `check:fast:` line shapes.
4. RU/EN parity: not applicable - no new or changed user-visible string (D97, D90 and K12 change
   tool output only).

### 4.2 B2

1. Scale: no screen draws differently, so no States table; the rows that change are sizes and
   times. D85: a 300-entry re-read (3x) whose records are all held sends about 23 KB of `hid`
   to `rev` and gets 300 `rev` of 32 characters and no record, in place of up to 300 records of
   up to 81 KB (D85's estimate); a changed record comes whole; `p_have` past 64 KiB counts as
   `{}` (a whole answer, never a refusal). D83: the 3x account (60 sources, 300 items, 300 cards,
   150 lists of 300 entries, 30 pending requests of 300 lines per list, 3000 print sets) is
   deleted in 24 prune calls (23 that delete at most 200 requests, 60 000 lines, each, and one
   that answers 0) and one `delete_account()`, each under `statement_timeout = '4s'` locally; at
   the defaults the 500 pending requests (50 x 10) take 4 calls (200, 200, 100, 0). The loop stops
   at 0, never at "below 200", so the client holds no copy of the SQL bound (plan-B2 Nit 2). The page's busy state holds for the whole loop (about 25 s at 3x on this
   host, an estimate from B1's 23 s). D98: the timed file runs under 30 s alone.
2. Error scenarios:

| Scenario | What the screen shows | Stored data | Recovery |
|---|---|---|---|
| loading (`#/s/`, a re-read) | as today: the shown list stays until the answer | none | - |
| a failed re-read | the shown list stays | none | the next message, poll or shown-again |
| offline | as a failed read | none | as above |
| the owner edits a linked item between two re-reads | its `rev` differs: the record comes whole | none | - |
| an answer strips a record the held map lacks (a server defect) | one whole read, then the page; a second unfillable answer is a failed read (the shown list stays) | none | the next message, poll or shown-again |
| two re-reads answer out of order | the newer answer; `#readSeq` drops the older | none | - |
| a linked item deleted | its entry leaves the projection as today | none | - |
| a stale tab (previous bundle) | `get_shared_list(text)` and `(text, bigint)` answer as today; its delete calls `delete_account()` alone, as today | as today | as today |
| revert (the reversals pushed, the new bundle open) | `PGRST202`: the port takes today's calls; one spurious "changed" count at the switch (the key order of `withSnapshots`) | none | a reload |
| account delete: a prune call fails or times out | the error toast «Не получилось. Проверьте соединение и попробуйте ещё раз.»; the confirm stays | the account stays with its lists, items, prints and the requests not yet deleted; the deleted requests are gone (the owner typed the confirm to delete them all) | press again: the loop resumes |
| account delete: `delete_account()` fails after the loop | the same toast; no sign-out | the account stays without its purchase requests; its lists, entries, shares, items and print sets keep their counts | press again: the next prune answers 0 and `delete_account()` runs (proved by `supabase.test.ts` and layer 3, plan-B2 Risk 3) |
| account delete: two tabs press at once | one tab may get the error toast (a lock wait) while the other finishes | as the named loss only | the other tab's «Аккаунт удалён.» |
| account delete: a share holder sends a request during the loop | nothing | the next call or `delete_account()`'s cascade deletes it | - |
| account delete: another tab deleted the account first | «Аккаунт удалён.» (each call deletes nothing) | nothing left | - |
| account delete: the reversal pushed | `PGRST202`: `delete_account()` alone, as today | as today | - |

   The one path that loses data on a failure is the request delete before a failed final step;
   the requests are the owner's to delete, they expire by design (`META.md`, section 3), and the
   confirm named the whole account. A retry reads nothing held from before the failure: each
   call deletes what the database holds then.
3. Consistency: no screen change. The account delete keeps «Аккаунт удалён.» and the one error
   toast of `FEATURES.md` "Account"; no new confirm, toast or label. The tooling lines keep the
   `check:db: FAIL - ...` and `restore: FAIL - ...` shapes.
4. RU/EN parity: not applicable - no new or changed user-visible string.

### 4.3 B3 and B3b

1. Scale: no screen draws differently, so no States table.
   - B3 (D60): the configured build smaller than step 0's figure (300.8 kB on B2's tree; an
     in-memory build of the plan-B3 review measured the four packages 4.2 kB smaller gzip than
     `createClient`, the app's chunk may differ); every request reads the session once, as
     supabase-js does today.
   - B3b (D83): 24 prune calls and one `delete_account()` at 3x, 4 calls at the defaults; the
     busy state is an estimate of 5-10 s on the hosted project (about 24 round trips, 2-4 s of
     request deletes and the final step), not measured (plan-B3 Nit 11). B2 Risk 2: the
     overload's database time on 300 linked records of about 81 KB (3x) is measured against the
     two-argument form.
2. Error scenarios (D83's rows: the 4.2 table, unchanged, for B3b):

| Scenario | Batch | What the screen shows | Stored data | Recovery |
|---|---|---|---|---|
| loading (a first read after the chunk loads) | B3 | as today | none | - |
| a token refresh while a write is in flight | B3 | nothing; the next request reads the new token | kept | - |
| a sign-out, then another account's sign-in in the same tab | B3 | the new account's rows; the Realtime topics rejoin with the new token | each write carries the token of the session at its send | - |
| a request with no session token (a lapsed session, or a token that did not reach a client) | B3 | reads answer no rows (row level security); a private topic join is refused; an upload is refused and read as the picture limit | a write is kept and sent again (PostgREST answers 401, which `writeOf` reads as `network`); the picture is not stored | sign in again |
| offline, a failed read or write | B3 | as today | as today | as today |
| a Realtime rejoin after a network loss | B3 | as today: the topic joins with the current token (`accessToken`) | none | - |
| another tab signs in or out (the shared storage key) | B3 | as today: auth-js's storage event | none | - |
| a stale tab (the previous bundle, supabase-js) | B3 | as today; it reads and writes the same `sb-<ref>-auth-token` key, so both tabs keep one session; a PKCE redirect started on the old bundle finishes on the new one (the same verifier key) | kept | - |
| revert (the previous frontend) | B3 | as today; the session under the same key stays signed in | kept | - |
| revert of `20261015120100` (the reversal pushed) | B3b | the new bundle's delete takes `PGRST202` and calls `delete_account()` alone, as today | as today | - |
| `check:db`: a `supabase start` that hangs | B3b | `check:db: supabase start did not finish in N minutes ...` with the remedy and the override, before the guard's stall kill | the local stack only | the remedy |
| `check:db`: `docker ps` does not answer | B3b | `check:db: FAIL - docker ps did not answer in 30 s. ...` | the local stack only | the remedy |
| `restore:drill`: a hang of the CLI or `docker ps` | B3b | `restore:drill: <message>` then `restore:drill: FAIL` | the local stack only | the remedy |

   The path that loses stored data is a request sent with a token other than the session's at
   its send (another account's token: `gone` or `refused`, and the buffer drops the write);
   `authed` reads the token per request; the unit cases (the second account's sign-in), the real
   packages' case and `npm run e2e` (writes as the user, the owner topic, F20's upload) prove it
   (plan-B3 Risk 1). D83's named loss: 4.2.
3. Consistency: no screen change; no new string, toast or label. The tooling keeps the
   `check:db: FAIL - ...` and `restore:drill: <message>` / `restore:drill: FAIL` shapes and B1's
   override pattern (`DHLOOT_RESET_TIMEOUT_MS`, now `DHLOOT_STACK_TIMEOUT_MS` too).
4. RU/EN parity: not applicable - no new or changed user-visible string.

### 4.4 B4 and B5

Answered at each expansion. B4's States rows: the changed labels and strings on every page
(goldens, `sweep.js 360` and `1180` in both languages); the pick row with and without «Сохранить
себе» (K3) at 360 and 1180; a shared entry with no note, one note, both notes and a ticked take
line (K4), the longest note; the editor's button row clean and dirty (K1); a colour print card
with a picture, with none and with a broken one, on both sheets, and the black-and-white card
(K16); gm4's longest source line on both sheets (D105). B5's States rows: the
«Раздел» row (0, 1, the fold count, one past it, 300 sections at 3x, the longest name, 360 px with
the keyboard open, 1180 px), the Items tab with 0, 1, many and 300 own items (3x) and the filters
(no pick, a pick that hides every row, a pick that hides a ticked row), each pair of toast kinds,
each removed-control focus target, `#/tables/homebrew` with no copy control. RU/EN: B4 and B5
change strings; both languages and both plural sets per string.

## 5. Contracts, specs and tests

| Batch | Specs | Contracts | Tests |
|---|---|---|---|
| B1 | `DEBT.md`, `FEATURES.md` ("Homebrew", "Account and browser lists", the requests panel), `STATE.md` (D61), `COVERAGE.md` ("Component-test traps"), `.claude/README.md` (D90), a decision file (D83), `docs/DECISIONS.md`; `issues/catalog-copy/context.md` | none | `supabase.test.ts`, `fake-cloud.test.ts`, `lazy-cloud.test.ts`, `cloud.contract.ts` (fake and hosted), `homebrew.test.ts`, `cloudLists.test.ts`, `ownerRequests` tests, `app.test.ts`, `lists.test.ts`, `listsPage.test.ts`, the `AddToList` test, the `HomebrewRelations`/`HomebrewEditor` tests, `search.test.ts`, `tools/supabase/lib.test.mjs`, `tools/supabase/usage-lib.test.mjs`, `tools/check/lib.test.mjs`, `homebrewPage.timed.test.ts`, `tests/db/delete-account.test.mjs`, `tests/db/list-writes.test.mjs`, the e2e flows |
| B2 | `DEBT.md`, `FEATURES.md` (the shared page re-read; "Account"), `CONTRACTS.md`, `META.md` (the `anon` functions), `COVERAGE.md`, `.claude/README.md` (two undo paragraphs), three decision files and one amendment line, `docs/DECISIONS.md` | the `rev` field; a new overload | `list-shares.test.mjs`, `harness.test.mjs`, `homebrew.test.mjs` (the pin map), `delete-account.test.mjs`, `cloudLists.test.ts` (the lib), `supabase.test.ts`, `fake-cloud.test.ts`, `lazy-cloud.test.ts`, the `sharedView` test, the `ownerRequests` test, `cloud.contract.ts`, `tests/e2e/contract.mjs`, `homebrewPage.timed.test.ts`, `usage-lib.test.mjs` |
| B3 | `DEBT.md`, `STATE.md` (the storage key row), `COVERAGE.md`, `.claude/README.md` (the bundle figures), the 2026-09-24 amendment line, `docs/DECISIONS.md` | none | `supabase.test.ts`, `supabase.real.test.ts`, the e2e flows |
| B3b | `DEBT.md`, `FEATURES.md` ("Account"), `COVERAGE.md`, `.claude/README.md` (the stack timeout and its FAIL rows, the undo paragraph, B2 Nit 2), the D83 decision file, one amendment line, one decision line, `docs/DECISIONS.md` | none (a new authenticated function, no anon one) | `supabase.test.ts`, `delete-account.test.mjs`, `list-shares.test.mjs`, `tools/supabase/lib.test.mjs`, `tests/e2e/contract.mjs`, the e2e flows |
| B4 | `DEBT.md`, `FEATURES.md` (rule 15's departures removed, "Lists" price field and the shared page's notes, "Records" the pick row, "Homebrew" the editor's buttons, rule 18, "Print" the no-picture fallback and the Figma departure), `I18N.md` (D103's departure; any changed term) | none | component tests with `expectNoA11yViolations`, `markupEdit.test.ts`, `markupField.test.ts`, `markup.test.ts`, `record.test.ts`, `app.test.ts` (D100), goldens of every page, `tests/app/sweep.js`, every browser suite (D99) |
| B5 | `DEBT.md`, `FEATURES.md` ("Chrome" (toasts), "Consistency rules" (rule 19, rule 17), "Tables and search", "Homebrew" (the Items tab)), `STATE.md` (the UI row), a decision file (focus) | none | component tests, `tests/app/inventory.js` entries with goldens, sweep |

## 6. Risks and assumptions

- Risk (D81): a row whose record depends on another row would read stale under a per-row merge.
  Records embed their source and cards, each its own row with its own revision. Step 0 confirms
  that no trigger writes an item column from another table without moving the item's revision.
- Risk (D83, B2): the request lines are not the cost, or one prune call of 200 requests or the
  final `delete_account()` passes 4 s. Step 0 of 7.2 reads the cascade's trigger times by
  `explain analyze` first; the stop condition of 7.2 keeps D83 in `DEBT.md` and ships the rest.
- Risk (D83, B2): a failed final step leaves an account without its purchase requests (4.2).
  Accepted: the owner asked to delete them, and a retry resumes.
- Risk (D85, B2): `homebrew_item_record` text that differs between two reads of one record only
  re-downloads it (a new `rev`); a wrong fill is impossible, because the port fills only from
  the map it sent.
- Risk (D86): a field of a pending request other than `read_at` and `expires_at` changes; step 0
  confirms none does.
- Risk (K9): a longer default wait hides a slow render that a user would see. Accepted: the
  component tests do not measure time; the `timed` project does.
- Risk (K6): `'networkidle2'` still times out on a page with three or more open connections;
  the driver's error then names them. The once-only `expectInPage` checks keep their settle
  point.
- Risk (D83 seed): the 3x seed adds minutes to `check:db`; step 0 times it and the seed rule of
  3.2 bounds it.
- Risk (D60): the token does not follow an auth change into one client; writes run as anon and are
  dropped. The per-request `fetchWithAuth` rule (no stored header), unit cases, the plan review
  and the e2e gate.
- Risk (D60): a changed auth storage key signs every reader out at the deploy. A unit case pins
  `sb-<ref>-auth-token` for a hosted and a local URL.
- Risk (D83, B3): `analyze` in the case models a database with statistics; a hosted account
  right after a bulk import may still pass 8 s once. Accepted (3.11.2): the error toast, then a
  later press.
- Risk (B4): every golden moves; a wrong re-seed hides a regression. B4 compares each shard before
  it re-seeds and reviews the diff of the accessibility trees; D99 changes how every suite finds
  its controls, so every browser suite runs once before the re-seed.
- Risk (B5): K2 adds a feature to a clean-up release. It reuses `FilterBar`, the facets and the
  homebrew seed that the «Раздел» fold already touches; it adds no route, contract or stored shape.
- Assumption: the hosted `authenticated` role keeps an 8 s statement timeout.
- Dependency: every batch runs after authoring-print-preview ships (it deletes D82 and edits the
  editor and the print card).

## 7. Batches

Split criteria (`CLAUDE.md`, "Task and session protocol"; `.claude/README.md`, "Batch size and the
fixed cost of a run"):

- B1 | B2: a public-contract change with a migration (B2); it needs its own commit and review.
- D83's account delete and D98 join B2 (refresh before B2): no split criterion separates them.
  D83 is a migration with a security definer function: it shares B2's `check:db`, plan review,
  test push and `npm run e2e`, and changes no public contract, route or filter set. D98 is a test
  file that B2's `check:2` runs. Their own batch would pay `check:fast`, `check:1`, `check:2`,
  `check:db`, one more plan review, a test push and `e2e` again: about 40 minutes for no gate
  that B2 does not already run.
- B2 | B3: the owner's answer to Q1 ("D60: its own batch; `npm run e2e` is its gate"); B3 also
  carries its own plan-review trigger.
- B3 | B3b (plan-B3 Risk 2, settled by the orchestrator): the owner's rule Q1 ("D60: its own
  batch; `npm run e2e` is its gate"), and a bisect reason: in one batch a failed `npm run e2e`
  or a failed sign-in would have two candidate causes, the rewritten account client (D60) or the
  new function and delete loop (D83). B3b follows B3 because its port loop calls `rest.rpc`,
  which D60 introduces. The tooling lines and the overload timing go with D83: they share its
  `check:db`, and B3 runs no `check:db`. Added cost of the split: one more `check:fast`,
  `check:1`, `check:2` and `npm run e2e` (about 20-30 minutes) and one more batch review; the
  `check:db` and the push were B3b's work in either layout.
- B3b | B4: a different route and filter set: B4 pays the browser suites, goldens and sweep;
  B1-B3b pay none.
- B4 | B5: a commit boundary the harness cannot reach: B5 seeds new English goldens of gm1, which
  are English only after B4's D89 fix, and its new suite cases press controls by the names that
  B4's D99 fix gives; B5 also needs mocks of new controls that B4 does not.
- Not split further: B1's pieces share `check:db`, `e2e` and one plan review (the tooling pieces
  are small and independent, and D90 and K12 make B1's own gates fail fast); B4's pieces share one
  re-seed of every golden; B5's pieces share `FilterBar`, the homebrew seed and one re-seed.

Total gate cost (this host, idle, `context.md`): B1 about 55 min planned (measured: `check:fast`
813 s on a loaded host, `check:1` 255 s, `check:2` about 13 min, `check:db` 664 s, `e2e`);
B2 about 45 min idle, up to 70 loaded (step 0's `explain` 2, `check:fast` 4-14, `check:1` 4-5,
`check:2` 5-13, `check:built` 0.5, `check:db` 11-14 under the hang guard with the 3x seed, the
forced piped-reset run 2, the timed file 0.5, then after the batch review's approve the test push
1-2 and `e2e` 1-2; one half again after remediation; measured: `check:fast` 638 s, `check:1`
233 s, `check:2` 585 s, `check:db` 702 s with one guard restart); B3 about 30 min idle, up to 45
loaded (the configured bundle twice 2, `check:fast` 5-11, `check:1` 4, `check:2` 10,
`check:built` 0.5, `e2e` 2; one half again after remediation); B3b about 45 min idle, up to 70
loaded (step 0's three warm starts and the `anon` timeout read 5, `check:fast` 5-11, `check:1`
4, `check:2` 10, `check:db` 12-14 under the hang guard with the 3x seed and the overload timing,
the forced start-timeout run 2, then after the batch review's approve the test push 1-2 and
`e2e` 2; one half again after remediation); B4 about 95 min (`check:1`, `check:2`,
`check:built`, `app/print,app/contracts,app/states,app/typo,app/hues,stub` 5-8, four golden shards
compared and re-seeded 30-40, `sweep.js 360` and `1180` 12-20, `e2e` for D99, remediation); B5
about 80 min (as B4 without `e2e`). Remaining after B2 about 250 min (B3 30, B3b 45, B4 95, B5
80), plus four batch reviews (B3's and B3b's plan review is `reviews/plan-B3.md`). The release
step after B5's closeout: first `origin/main`'s newest migration sorts before this task's two
files (`20261015120000`, B2, and `20261015120100`, B3b), else stop for the owner (plan-B2 Risk 5; B5's
acceptance); then a fresh `backup.yml` run (`gh workflow run backup.yml`, `.claude/README.md`,
"Backups and restore"), waited on until it ends with `success`, its run id recorded, the push
stopped on any other result (plan-B2 Nit 8); then the one push of the task. Nothing is pushed
before it.

### 7.1 B1 - logic, ports, tooling and test harness (done `7430de8e`, review approve)

Objective: the homebrew and pending-requests re-reads fetch only what changed; an older account
read never replaces a newer row; a statement timeout halves a request at once and the 3x account
delete is measured; D84's small costs and the `ownKeyFor` cost are paid or closed; `check:db` and
`check:fast` fail fast with a remedy; the usage report, the slow timed test, the vitest waits and
the e2e F8 navigation are fixed; D88, D68 and D61 are paid; the carries paid later have `DEBT.md`
entries and «копия из каталога» has a named follow-up.

In scope: sections 3.1-3.9 and 2.1's B1 rows. Out of scope: every screen change (B4, B5), D85 (B2),
D60 (B3), any migration.

Files expected:

- `app/src/ports/types.ts`, `supabase.ts`, `supabase.test.ts`, `fake-cloud.ts`,
  `fake-cloud.test.ts`, `lazy-cloud.ts`, `lazy-cloud.test.ts`, `cloud.contract.ts`
- `app/src/state/homebrew.svelte.ts`, `homebrew.test.ts`, `cloudLists.svelte.ts`,
  `cloudLists.test.ts`, `ownerRequests.svelte.ts` and its test, `app.svelte.ts` and `app.test.ts`
  (D61; D68's export tests; K7)
- `app/src/lib/lists.ts` and its test, `app/src/lib/search.ts`, `search.test.ts`
- `app/src/components/ListsPage.svelte`, `AddToList.svelte`, `HomebrewRelations.svelte`,
  `HomebrewEditor.svelte` (only if the timing says so), and their tests;
  `homebrewPage.timed.test.ts`; the test files K9 names, if a negative find needs `{ timeout: 1000 }`
- `app/vitest-setup.ts`
- `tools/supabase/lib.mjs`, `lib.test.mjs`, `restore.mjs`, `usage-lib.mjs`, `usage-lib.test.mjs`;
  `tools/check/lib.mjs`, `lib.test.mjs`, `fast.mjs`; `tests/db/run.mjs`, `tests/db/roles.mjs`,
  `tests/db/delete-account.test.mjs`, `tests/db/list-writes.test.mjs`; `tests/app/driver.js`,
  `tests/e2e/flows.mjs`
- `docs/specs/DEBT.md`, `FEATURES.md` ("Account and browser lists": the timeout exception; the
  homebrew and requests re-reads), `STATE.md`, `COVERAGE.md`, `.claude/README.md`, the new D83
  decision file, the amendment line in
  `docs/decisions/2026-09-26-a-request-the-database-fails-three-times-is-halved.md`,
  `docs/DECISIONS.md` (`node tools/decisions.js`)
- `issues/catalog-copy/context.md` (new, from `.claude/templates/context.template.md`)

Steps:

0. Read Status and `context.md`. Confirm on the tree: `git -C <tree> log -1 --format=%h
   origin/main` and the newest migration (a migration newer than `20261014120200` that redefines
   a function this batch reads stops the batch for the planner); the three homebrew selects; that
   the `homebrew_books_before_update`, `homebrew_items_before_update` and
   `homebrew_cards_before_update` triggers still add one to the revision on every update,
   foreign-key actions included, and that no migration up to the newest disables or replaces them
   without that (`git grep -n -E "homebrew_(books|items|cards)_before_update" --
   supabase/migrations`; plan-B1 Nit 4); that a pending request changes only in `read_at` and
   `expires_at` (`git grep -n -E "update public.purchase_request" -- supabase/migrations`); that
   authoring-print-preview has shipped and D82 is gone from `DEBT.md`; the bundle figures (`npm
   run build` then `npm run budget`). A finding against 3.1 or 3.4 stops the batch for the
   planner. Then two measurements, each with its decision rule (PowerShell, Rancher up, the hang
   guard):
   - 0b, the reset time (plan-B1 Risk 5): with the stack started, time one `npx supabase db reset
     --local` (`Measure-Command`). Rule: `RESET_TIMEOUT_MS` is 300 000 when 300 s is at least
     three times the figure; else three times the figure, rounded up to the minute. The handoff
     records the figure and the value.
   - 0c, the 3x seed time (plan-B1 Risk 4): run the seed of step 15 alone in a rolled-back
     transaction through the superuser connection (a scratch script under the session's
     scratchpad, not committed) and time it. Rule: at 60 s or less, step 15 seeds through the
     triggers; past 60 s, the request lines (and the entries, if they alone pass 60 s) go in with
     `set local session_replication_role = replica`, with the comment of 3.2. The handoff
     records the figure and the choice.
1. Records first. In `docs/specs/DEBT.md`, section "Debt cleanup", write one entry each for K1,
   K3, K4, K10 and K11 (`context.md`, "Carries from the owner", with the verified facts there),
   numbered from the next free id (`git grep -n "^### D" -- docs/specs/DEBT.md`), each with
   **Where** / **What** / **Why deferred** ("paid by `debt-cleanup` B4" or "B5") / **How to verify
   the fix**; K11's **What** carries the repro of `context.md`. Write `issues/catalog-copy/context.md`
   from the template: the goal (K5), the source (owner, 2026-10-14) and the five open questions as
   "Open questions"; no plan.
2. D90: the helpers of 3.6 with JSDoc; `tools/supabase/lib.test.mjs` cases: `supabaseBinary`
   with the override, on `win32` (`.exe`) and on `linux`; `missingContainers` with all running,
   one missing (`storage`), all missing; `resetFailure` for `{ error: { code: 'ETIMEDOUT' } }`
   (`'timeout'`), `{ signal: 'SIGINT' }` with no `ETIMEDOUT` (`'failed'`), `{ status: 1 }`,
   `{ status: 0 }`; `stackAdvice` names the remedy; the hung-child case of 3.6 (`'timeout'`
   within 5 s). Wire `resetLocal` into `tests/db/run.mjs`, `tests/db/roles.mjs` and
   `tools/supabase/restore.mjs`, and `STACK_SERVICES` into `run.mjs`'s `complete` check. Write the
   FAIL table and the net-zero removals. Then the host proof of 3.6: `npm run check:db` with
   `DHLOOT_RESET_TIMEOUT_MS=1000`, the FAIL line and an empty `Get-Process supabase` in the
   handoff; then `npx supabase stop` and start again before the real runs.
3. K12: `findUp` and its three cases; `fast.mjs` uses it.
4. K9: the grep of 3.9, `{ timeout: 1000 }` on each negative find it locates, then the setup line
   and its comment; the `COVERAGE.md` watch line.
5. D98: the phase timings, then the first change of 3.9 that passes; or the figures in the handoff.
6. D97: the format rule and its three cases.
7. D81 port: `HomebrewKnown`, `HomebrewRead.kept`, `load(known?)`; rename `CHANGED_LISTS_MAX` to
   `CHANGED_ROWS_MAX` (all uses); 3.1 in `supabase.ts` with a fresh builder per read.
   `supabase.test.ts`: an unchanged second read sends three `id,revision` selects and the three
   limit reads and no full select; one changed item fetches that id alone; 51 changed items read
   the table whole; a failed head answers `{ ok: false }`.
8. D81 fake and lazy port, with their tests.
9. D81 contract case in `cloud.contract.ts` after the homebrew cases, on the pattern of the lists
   `known` case: all held - no rows, every id in `kept`; one item updated - that item alone; a
   stale revision and an unknown id as the lists case.
10. D81 store: 3.1's merge with the lower-revision guard, `#written` and the read counter, with
    `known` built inside the read loop. `homebrew.test.ts`: a kept read keeps the row objects and
    arrays; a deleted row leaves; two reads out of order keep the newer row; the newer read
    answering first and the older second leaves the newer answer shown; a create, then a kept
    re-read, gives the row the database's `created_at` (`#written`).
11. D86: 3.4 in `types.ts`, `supabase.ts` (`list(held?)`), the fake, `lazy-cloud.ts` and
    `OwnerRequests`. `supabase.test.ts`: the second read's head carries no lines and only unknown
    ids are read whole, in sequential chunks; more than `CHANGED_ROWS_MAX` new ids make one whole
    read; a failed head page or a failed chunk answers `{ ok: false }`. `ownerRequests` tests: a
    kept request keeps its object unless `readAt` or `expiresAt` moved; a new request raises
    `arrived`; a decided one leaves; a request decided in this tab while the read is in flight
    stays gone; a failed read keeps the shown requests; the read counter case. A contract case.
12. D87: 3.5 with its `cloudLists.test.ts` cases (the revision guard; the read counter).
13. D83: `timeout: true` in `callFailure`; the fake's `setFault(match, { timeout: true })`; the
    `#send` branch of 3.2. `cloudLists.test.ts`, through the fake: a 200-op request that times out
    is sent again at once as 100 ops with no timer and `sync` never `failed`; a lone timed-out op
    takes the fault path; a non-timeout fault keeps the wait. `supabase.test.ts`: HTTP 500
    `57014` maps to `timeout: true`; `fake-cloud.test.ts`: the timeout option.
14. D84 lines 1-4 and 7 as 3.3, each with a unit test of unchanged behaviour; line 7's timing case
    logs the time. K7 as 3.3: `homebrew.test.ts` - `has` follows an added and a removed row;
    `app.test.ts` - `ownKeyFor` answers the same keys before and after the memo and a new key
    after the own items change and after a user switch; the handoff records the 5000-call time.
15. D83 layer 3: in `tests/db/delete-account.test.mjs`, seed one user through the superuser
    connection with `user_limit_overrides` at three times every default and the rows of 4.1 item
    1 by `generate_series` (through the triggers or with `session_replication_role = replica`,
    as step 0c decided); as `authenticated` with `set local statement_timeout = '4s'`, call
    `delete_account()`; assert that no row of the user remains; log the seed time and the
    delete time. In
    `tests/db/list-writes.test.mjs`, delete 150 lists of 300 entries in one `apply_list_writes`
    call under the same timeout. Run `npm run check:db` (PowerShell, under the hang guard).
16. D88 and D68 as 3.7.
17. D61 as 3.8; `app.test.ts`: signed out, an external change of each key updates the language,
    the home pin and the warning; signed in, it does not; a bad value falls back; a build with no
    cloud follows too.
18. K6: the fix of 3.9 (`'networkidle2'` for the e2e driver, the in-flight URLs on a navigation
    timeout); a `node:test` or driver unit case is not required, the proof is `npm run e2e`
    green and one forced timeout (a 1 ms navigation timeout in a scratch run) printing the route
    and the URLs, recorded in the handoff.
19. Specs and register: `FEATURES.md` "Homebrew" (a re-read fetches the changed rows only), the
    requests panel (a re-read fetches new requests only), "Account and browser lists" (a
    statement timeout of more than one op halves the request at once, the exception to "A send
    that the server fails three times in a row ..."); `STATE.md` (D61, with "Defaults and a
    page's pick" for `PREFS_KEY`); the amendment line in
    `docs/decisions/2026-09-26-a-request-the-database-fails-three-times-is-halved.md` (3.2); the
    D83 decision file with the measured times, linking to the amended one; `DEBT.md`: delete D81,
    D86, D87, D88, D68, D90, D61, D97 (and D98 if paid), D83 (or keep its account-delete half
    with the figures, per the stop condition), and D84 lines 1-4, 6, 7, 9; delete the section
    "Search"; "Harness parity" stays until B4 (D89, D99); `node tools/decisions.js`.
20. Gates, then amend the task's one commit (the plan commit) with the subject `fix(persist):
    re-read only changed homebrew rows and requests` (footer `Task: debt-cleanup`; no trailer). If the configured build passes
    its budget, raise the budget by the rule (measured + 5 kB, ceiling 350 kB) in
    `tools/bundle-budget.mjs` and `.claude/README.md`.

Stop condition (plan-B1 Blocker 5; never a half-batch): step 0's findings against 3.1 or 3.4 stop
the batch before any production code. If step 15's account delete or 150-list delete does not
finish under 4 s, keep the case with the measured times as `todo`, keep D83's account-delete half
in `DEBT.md` with the figures, ship the timeout halving (it does not depend on the delete), amend
the commit on green gates and report the figures to the planner. Do not design a chunked delete in
this batch.

Acceptance criteria (each its own line at the batch's close):

- The refresh before B1 ran (Status): D95, D97-D103 and K1-K15 placed; D74 and D82 dropped.
- `DEBT.md` holds one entry each for K1, K3, K4, K10, K11 under "Debt cleanup", K11 with its repro.
- `issues/catalog-copy/context.md` exists with K5's goal and five open questions.
- D81: an unchanged homebrew re-read downloads no row (unit, the contract case on the fake and on
  the hosted test project); a changed row is fetched alone; past 50 changed ids the table is read
  whole; the store keeps its objects and the newer row.
- D81: a row written in this tab is fetched whole at the next read and gets the database's
  `created_at` and `updated_at`.
- D86: a re-read after one new request reads that request with its lines and no lines of a held
  one; a decided request leaves; `arrived` fires for the new one only.
- D86: a request decided in this tab during a read stays gone; a failed head or chunk keeps the
  shown requests; past 50 new ids the read is whole; the chunks run in sequence.
- D87: two account reads answered out of order keep the newer list row.
- Read order: in `CloudLists`, `Homebrew` and `OwnerRequests`, an answer from a read older than the
  last applied read is dropped (one test per store).
- D83: a timed-out request of n > 1 ops halves at once, with no 15 s wait and no «Не сохранено»;
  a lone timed-out op keeps the fault path; the fake answers a timeout through `setFault`.
- D83: the 2026-09-26 decision carries the amendment line and `FEATURES.md` "Account and browser
  lists" the exception; the new decision file links to the amended one.
- D83: the 3x account delete and the 150-list delete finish under `statement_timeout = '4s'`
  locally, with the seed time beside each, in the decision file; or the cases are `todo` with
  the figures and D83's account-delete half stays in `DEBT.md`.
- Step 0: the reset time and the 3x seed time are in the handoff with the values their rules
  chose.
- D84 lines 1-4 and 7 fixed with unit tests, or line 7's editor half closed with its figure; lines
  6 and 9 closed with their reasons; lines 5 and 8 stay for B5.
- K7: `Homebrew.has` and `#cardKeyFor` read key sets; `ownKeyFor` is memoised and follows an
  items change and a user switch; the 5000-call time before and after is in the handoff.
- D88: U+2018 folds as an apostrophe on both search paths.
- D68: the fake answers a `create` of 5001 entries in a two-op call as the database does: that op
  `refused` with no list made, the other op applied; the export tests build their long lists
  another way.
- D90: a missing container (`storage` included) fails in seconds with the remedy; a hung reset at
  any of the three reset sites fails at `RESET_TIMEOUT_MS` with the remedy, through the binary
  spawned directly; `tools/supabase/lib.test.mjs` covers both and a hung child with piped stdio
  ends within 5 s; the host run with `DHLOOT_RESET_TIMEOUT_MS=1000` prints the FAIL line and
  leaves no `supabase` process (handoff); an interrupt is not reported as a timeout; the README
  FAIL table exists and the file did not grow.
- D61: a signed-out tab follows another tab's language, start section, warning and display
  defaults without a reload, with and without a cloud; a page value stays.
- D97: the usage report prints 39 362 bytes as `39.4 kB` (`usage-lib.test.mjs`).
- D98: `npx vitest run app/src/components/homebrewPage.timed.test.ts` runs under 30 s with the
  3000 ms bound and an axe check, or D98 stays in `DEBT.md` with the four phase figures.
- K9: the Testing Library wait is 5 s in `app/vitest-setup.ts`; no negative find waits longer than
  1 s; the watch line is in `COVERAGE.md`, "Component-test traps".
- K12: `rtk npm run check:fast` runs its vitest stage in this worktree (no own `node_modules`);
  `tools/check/lib.test.mjs` covers `findUp`.
- K6: the e2e driver navigates with `'networkidle2'`; the browser suites still navigate with
  `'networkidle0'`; a navigation timeout in the e2e driver names the route and the URLs in
  flight (the forced-timeout run in the handoff); `npm run e2e` passes.
- `DEBT.md` holds no entry B1 paid; the section "Search" is gone; `docs/DECISIONS.md` rebuilt.
- No new user-visible string; no golden moved (`check:built` green).

Verification commands:

```text
rtk npm run check:fast
rtk npm run check:1
rtk npm run check:2
npm run check:built
npm run check:db            (PowerShell tool, Rancher's win32\bin first on PATH, output to a log, the hang guard; stop the stack and Rancher after)
npm run e2e                 (the new contract cases and F8 on the hosted test project; no migration)
npx vitest run app/src/components/homebrewPage.timed.test.ts
node --test tools/supabase/lib.test.mjs tools/supabase/usage-lib.test.mjs tools/check/lib.test.mjs
```

Risks / do-nots:

- Do not change the first reads, the poll or the safety cadence; keep the limit reads.
- Do not send a halved request from a copy: halves are cut from `#queue` at send time.
- Do not raise `statement_timeout` anywhere.
- Only `Homebrew.read` and `OwnerRequests` pass `known`/`held`; the tests' bare calls stay whole
  reads.
- Do not change `'networkidle0'` for the browser suites against `dist-test/`; only the e2e driver
  waits for `'networkidle2'`.
- Do not reset the database through the node wrapper or without `resetLocal`'s timeout.
- Do not retry an e2e flow and do not raise the 30 s navigation timeout.
- Settled, not to reopen: the re-read pattern is R7g's (`docs/decisions/`, 2026-10-02), with the
  homebrew store's `#written` departure (3.1) and the read counter in all three stores; nothing
  past 3x is designed for; K9's global wait (10).

### 7.2 B2 - D85, D83's account delete, D98 and B1's nits (implement-ready after the plan review)

Objective: a shared page's re-read downloads no linked record it already holds; an account at
three times every limit deletes within the statement timeout; the slow timed homebrew test runs
under 30 s; the Supabase CLI tools run from a worktree; B1's review nits and checks are closed.

In scope: section 3.10, 4.2, and the B2 rows of 2.1 and of `reviews.md`. Out of scope: every
screen change (B4, B5), D60 (B3), `get_shared_list_preview`, `clone_shared_list`,
`delete_account()`'s body, any `statement_timeout`.

Files expected:

- `supabase/migrations/20261015120000_shared_list_have.sql`,
  `supabase/migrations/20261015120100_account_delete_requests.sql` and the two files of the same
  names in `supabase/reversals/`
- `tests/db/list-shares.test.mjs`, `tests/db/harness.test.mjs` (`EXPECTED_ANON_FUNCTIONS`),
  `tests/db/homebrew.test.mjs` (the pin map selects every `get_shared_list` overload),
  `tests/db/delete-account.test.mjs`
- `app/src/lib/cloudLists.ts`, `cloudLists.test.ts`; `app/src/ports/types.ts`, `supabase.ts`,
  `supabase.test.ts`, `fake-cloud.ts`, `fake-cloud.test.ts`, `lazy-cloud.ts`, `lazy-cloud.test.ts`,
  `cloud.contract.ts`; `tests/e2e/contract.mjs`
- `app/src/state/sharedView.svelte.ts`, `sharedView.test.ts`, `ownerRequests.svelte.ts`,
  `ownerRequests.test.ts`
- `app/src/components/homebrewPage.timed.test.ts`, `sharedListPage.test.ts` (the `read` stub)
- `tools/supabase/lib.mjs`, `config.mjs`, `db-push.mjs`, `restore.mjs`, `usage-lib.mjs`,
  `usage-lib.test.mjs`; `tests/db/run.mjs`
- `docs/specs/CONTRACTS.md`, `META.md`, `FEATURES.md`, `COVERAGE.md`, `DEBT.md`;
  `.claude/README.md` ("Supabase configuration": the two undo paragraphs); three new decision
  files, the amendment line in `docs/decisions/2026-10-15-a-statement-timeout-halves-a-request-at-once.md`,
  `docs/DECISIONS.md` (`node tools/decisions.js`)

Steps:

0. Read Status, `context.md` and `reviews.md`. Confirm on the tree: `git -C <tree> log -1
   --format=%h origin/main`; the newest migration (`git -C <tree> ls-tree --name-only
   origin/main supabase/migrations/`): a migration newer than `20261014120200` renumbers both
   B2 files after it, and one that redefines `get_shared_list`, `delete_account` or the
   purchase-request tables stops the batch for the planner. Then, with the stack up
   (PowerShell, Rancher's `win32\bin` first, the hang guard): seed the 3x account of
   `delete-account.test.mjs` in a rolled-back transaction as the superuser (a scratch script in
   the session scratchpad) and, in that one transaction, time `delete from public.purchase_requests
   where list_id in (select id from public.lists where owner_id = '<BIG>')`, then `delete from
   auth.users where id = '<BIG>'` (plan-B2 Risk 4: an `explain analyze` trigger line may include
   the cascades its own query fires, so the lines can double count). Rule: the second delete
   stays under 2 s (half the test's 4 s); else D83's steps (5, 6) stop for the planner, the rest
   of the batch ships and D83 stays in `DEBT.md` with the figures (stop condition). In a second
   rolled-back run, `explain (analyze, timing on) delete from auth.users where id = '<BIG>'`:
   record the total and each "Trigger for constraint ..." line (time, calls) in the handoff as the
   breakdown, and whether the lines sum past the total. The configured bundle (B1 check), from
   the worktree with no env copy: `VITE_PREVIEW_BASE=https://daggerheart-loot.pages.dev/ node
   --env-file=E:/dev/daggerheart-loot/.env node_modules/vite/bin/vite.js build`, then `node
   tools/bundle-budget.mjs`; record both figures (this worktree has no own `node_modules`: when
   `node_modules/vite/bin/vite.js` does not resolve, use
   `E:/dev/daggerheart-loot/node_modules/vite/bin/vite.js`; the handoff names the path used).
   Copy no `.env` file into the worktree.
1. D85 migration of 3.10.1 and its reversal. Layer 3 in `list-shares.test.mjs`, beside
   `describe('get_shared_list(text, bigint)')`: a players' and a GM's link with one homebrew
   entry and one official entry - with `p_have` `{}` each homebrew entry carries `rev` =
   `md5(snapshot::text)` and its `snapshot`, the official entry no `rev`; with the entry's
   `hid` mapped to that `rev` the `snapshot` key is absent and `rev` stays; with another `rev` the
   `snapshot` comes; `p_since` at the revision answers `{ "unchanged": true }`; a null token, a
   bad token and a revoked one answer null; `p_have` `[]`, a string, and an object over 64 KiB
   answer the whole projection; `get_shared_list(text)` and `(text, bigint)` answer as before.
   Pins: `list-shares.test.mjs`' map gains `'get_shared_list(text,bigint,jsonb)': {
   ...pinned(true), prosecdef: false }`, `homebrew.test.mjs`' map gains `pin(false, true, true)`
   for it, `EXPECTED_ANON_FUNCTIONS` gains it after `'get_shared_list(text,bigint)'` (code-point
   order).
2. D85 lib: `SharedRow` `rev?`, `SharedHeld`, `heldSnapshots`, `withSnapshots` with JSDoc.
   `cloudLists.test.ts`: the map skips an official entry and one with no `rev`; a filled answer
   deep-equals the whole answer and `sameProjection` holds between them; an unfillable entry
   answers null; the key order is one for a whole and a filled answer.
3. D85 port: 3.10.1 in `types.ts` (`read(token, since?, held?)` JSDoc), `supabase.ts`,
   `fake-cloud.ts`, `lazy-cloud.ts`. `supabase.test.ts` (replace the three call expectations of
   the `get_shared_list` cases): a first read sends `{ p_token, p_since: null, p_have: {} }`; a
   re-read with `held` sends each `hid` with its `rev`; a stripped answer comes back filled; an
   unfillable answer makes one more call with `p_have: {}`; `PGRST202` makes today's call for
   this read and the next; a second unfillable answer answers `{ ok: false }` after two calls;
   `unchanged` as today. `lazy-cloud.test.ts`: `held` forwarded. `fake-cloud.test.ts` (plan-B2
   Blocker 1): a homebrew entry carries a string `rev`; a read with `held` naming it leaves the
   `snapshot` out before the fill and answers a row equal to a whole read; another `rev` gets the
   record; expectations that `toEqual` a fake share read gain `rev`. The stubs of
   `sharedListPage.test.ts` (`cloud.shares.read = (token, since) =>`) and `sharedView.test.ts`
   (the `read` bind) forward `held` (Nit 6). `cloud.contract.ts` (fake and hosted): on a list
   with a linked homebrew entry that the link shows (the GM link of the "gm only" case, or a new
   entry with `hb_item` and no `gm_only`), the first read's homebrew entry carries a string `rev`,
   `heldSnapshots(first).size > 0`, and a re-read with that map and an older `since` deep-equals
   the first read. `tests/e2e/contract.mjs`, two raw RPC checks that fail on any error, so a
   missing push cannot hide behind the port's `PGRST202` fallback: `anon.rpc('get_shared_list', {
   p_token: 'nonsense', p_since: null, p_have: {} })` answers `error === null` and `data ===
   null`; and, as the throwaway account of the art check before its `deleteAccount()`, through a
   client that carries its session, `rpc('delete_account_requests')` answers `error === null`
   and a number.
4. D85 store and the read order: `SharedView.refresh()` passes the held map; `#readSeq` in
   `open()` and `refresh()`. `sharedView.test.ts` (a stub repository records its arguments): a
   re-read of a ready page passes the shown records by `hid` and `rev`; a first read and a read
   after a failed first read pass none; two re-reads answered out of order leave the newer list
   shown. B1-3: `OwnerRequests.read()` advances `#appliedSeq` on `r.ok || all.ok || one?.ok`;
   `ownerRequests.test.ts`: a newer read with failed requests and ok notices answers first, an
   older read answers second, and the newer notices stay.
5. D83 migration of 3.10.2 and its reversal. `delete-account.test.mjs`: `delete_account_requests()`
   pins (`prosecdef`, `proconfig`, EXECUTE for `authenticated` only) as `delete_account()`'s
   cases do; it deletes at most 200 of the caller's requests per call with their lines, answers
   the count, and leaves another user's request; it refuses an authenticated call with no user id
   (`28000`) and `anon` (permission denied). The 3x case loses its `todo`: under `set local
   statement_timeout = '4s'`, call `delete_account_requests()` until it answers 0, then
   `delete_account()`; assert no row of the account remains (the four counts of today plus
   `purchase_requests` and `purchase_request_lines` of the account's lists); log one line
   `delete-account: 3x seed <ms> ms, <n> calls, slowest <ms> ms, delete <ms> ms`. The comment
   above the seed names the real ratio (B1-1: lines 1/27 and entries 1/9 at the defaults). A
   case (plan-B2 Risk 3): after prune calls until 0, the caller's lists, entries, shares, items
   and print sets keep their counts, and only `purchase_requests` and `purchase_request_lines`
   of the caller's lists are 0.
6. D83 port: `deleteAccount()` of 3.10.2 with `ACCOUNT_DELETE_CALLS_MAX`. `supabase.test.ts`
   (replace the `delete_account` cases): answers 200, 200, 0 make three prune calls, then
   `delete_account` and the local sign-out; a prune error answers `failed` with no
   `delete_account` call; `PGRST202` on the prune calls `delete_account` at once; 100 answers of
   200 stop the loop and call `delete_account`. The resume (plan-B2 Risk 3): prune 200, 0, then
   a `delete_account` error answer `failed` with no sign-out; the next `deleteAccount()` (prune 0,
   `delete_account` ok) answers ok and signs out.
7. D98: 3.10.3 in `homebrewPage.timed.test.ts` (drop the axe call and its import; the comment);
   run `npx vitest run app/src/components/homebrewPage.timed.test.ts` twice and read the case's
   time inside `check:2`'s run; the timeout is at least three times the larger figure (at most
   300 000 ms), and the comment holds both figures (plan-B2 Nit 4).
8. Tooling: B1-7 (`config.mjs`, `db-push.mjs` on `supabaseCli()`; `SUPABASE_CLI` deleted when
   unused), B1-5 (the FAIL line in `run.mjs` and `restore.mjs`), B1-6 (`bytesText` and its
   case). Then the B1 check: with the stack up, run `resetLocal` from `tests/db/roles.mjs` (a
   scratch call in the session scratchpad, `DHLOOT_RESET_TIMEOUT_MS=1000`, PowerShell) and
   record its answer (`'timeout'`) and an empty `Get-Process supabase`; then stop and start the
   stack before the real run. A run that hangs past 60 s is a finding for the reviewer: record
   it, stop the stack, continue.
9. Records: the `FEATURES.md`, `CONTRACTS.md`, `META.md` and `COVERAGE.md` lines of 3.10;
   `.claude/README.md`, "Supabase configuration": "To undo `20261015120000_shared_list_have`"
   (revert the app or not: the previous frontend never names the overload; push the reversal) and
   "To undo `20261015120100_account_delete_requests`" (the previous frontend calls
   `delete_account()` alone; push the reversal); the two paragraphs take at most the 7 lines B1
   saved, else the batch shortens the section by the rest (net zero for the file); in the hook
   table, rule 2n's phrase "(the tools' own entry)" becomes exact: after B2 only CI's
   `migrate-prod` runs `node <...>/supabase/dist/supabase.js`, the matching stays (plan-B2 Nit 9);
   `META.md`'s two sentences that count the `anon` functions say seven and name them (Nit 1); the
   three decision files and the amendment line; `node tools/decisions.js`. `DEBT.md`: delete D85, D83
   and D98 (or keep D83 per the stop condition, with the corrected ratio and its `todo` cost of
   about 45 s per `check:db`, B1-1 and B1-2).
10. Gates, then commit B2 as a new commit on the task's HEAD with its own subject, for example
    `fix(shares): re-read only changed shared records and bound the account delete` (footer
    `Task: debt-cleanup`; no trailer); a remediation amends that commit; the closeout squashes
    every task commit under the one task subject (plan-B2 Nit 7). After the batch review's
    approve, the hosted test push from this worktree by the path this run has used on this host
    (it applied link-previews' migration on 2026-10-15; plan-B2 Risk 1): `node
    --env-file=E:/dev/daggerheart-loot/.env.test.local --input-type=module -e
    "process.env.SUPABASE_DB_URL=process.env.SUPABASE_DB_URL_TEST; await
    import('./tools/supabase/migrate-test.mjs');"`; the alternative is `node
    --env-file=E:/dev/daggerheart-loot/.env.test.local tools/supabase/db-push.mjs --project test
    --yes` (`.claude/README.md` records `LegacyDbConfigIpv6Error` for it on this host). Then `npm
    run e2e`. The handoff records the path that ran and both results. A failed push or e2e reopens
    the batch (plan-B2 Risk 2): record it, fix, commit (an amend of B2's commit) and run the gates
    again; a change under `supabase/migrations/` needs a new approve (rule 2r). Once the test
    project has applied the two files, a change to their behaviour is a new migration, never an
    edit or a rename; the orchestrator stops for the owner when that is not possible.

Stop condition (never a half-batch): step 0's finding against `get_shared_list`,
`delete_account` or the request tables stops the batch before code. If step 0's timing rule
fails (the delete after the request delete takes 2 s or more), or step 5's prune call or final `delete_account()` does not finish under 4 s: keep
the 3x case as `todo` with the figures, keep D83 in `DEBT.md` with the corrected ratio, the
breakdown and the `todo` cost, drop steps 5-6's code and the D83 decision file, ship the rest on
green gates, and report the figures to the planner. Do not raise a timeout and do not redesign.

Acceptance criteria (each its own line at the batch's close):

- D85: with `p_have` naming a held record by its `rev`, the overload answers that entry with no
  `snapshot` and with `rev`; another `rev` gets the record; an official entry carries no `rev`
  (layer 3, both audiences).
- D85: `get_shared_list(text)`, `get_shared_list(text, bigint)` and `get_shared_list_preview(text)`
  answer as before; a `p_have` that is not an object or is over 64 KiB answers the whole
  projection.
- D85: `anon` executes `get_shared_list(text,bigint,jsonb)` and nothing else new
  (`harness.test.mjs`); the two pin maps hold it as security invoker.
- D85: a re-read of a ready `#/s/` page sends the shown records' `hid` and `rev`, and the port's
  answer equals a whole read (`supabase.test.ts`).
- D85 (plan-B2 Blocker 1): on a list whose link shows a linked homebrew entry, the first read's
  entry carries a string `rev`, `heldSnapshots(first).size > 0`, and the re-read with that map
  deep-equals the first read (`cloud.contract.ts` on the fake and the hosted test project).
- D85 (Blocker 1): the fake writes an opaque `rev` and leaves out a held `snapshot` before the
  fill (`fake-cloud.test.ts`); the stubs of `sharedListPage.test.ts` and `sharedView.test.ts`
  forward `held` (Nit 6).
- D85 and D83 (Blocker 1): `tests/e2e/contract.mjs` calls `get_shared_list` with three arguments
  as `anon` and `delete_account_requests()` as a signed-in throwaway account by raw RPC; any
  error, `PGRST202` included, fails the run.
- D85: an unfillable answer makes one whole read, and a second one answers `{ ok: false }`;
  `PGRST202` makes today's calls (`supabase.test.ts`).
- D85 campsite: `SharedView` drops a re-read answer older than the last applied one.
- D85: `CONTRACTS.md`, `META.md`, `FEATURES.md` and the decision file state the overload and
  `rev`; `docs/fixtures/`, `llms.txt` and `tests/contracts.js` are unchanged with the reason in
  the handoff.
- D83: the 3x account deletes through `delete_account_requests()` calls and `delete_account()`,
  each under `statement_timeout = '4s'`, with no row left, and the log line in the handoff; or
  the stop condition with step 0's timings and the `explain` breakdown.
- D83 step 0 (plan-B2 Risk 4): the delete of `auth.users` after the request delete is timed
  apart and is under 2 s; the `explain` lines and whether they sum past the total are in the
  handoff.
- D83 recovery (plan-B2 Risk 3): a failed `delete_account()` after the loop answers `failed` with
  no sign-out and the next `deleteAccount()` finishes (`supabase.test.ts`); prune calls until 0
  leave the caller's lists, entries, shares, items and print sets at their counts and only the
  requests and their lines at 0 (`delete-account.test.mjs`).
- D83: `delete_account_requests()` deletes only the caller's requests, at most 200 per call,
  refuses no session and `anon`, and is pinned as `delete_account()` is.
- D83: `deleteAccount()` loops, stops at 0, at an error and at 100 calls, and falls back on
  `PGRST202` (`supabase.test.ts`); hosted contract case E passes.
- D83: `FEATURES.md` "Account", the decision file and the amendment line state the bounded
  calls; the reversal is clean (`check:db`'s up-down-up walk).
- B1-1: no text in the tree says a default account is a third of the 3x rows; the 3x case's
  comment and any kept D83 entry give 1/27 for the lines and 1/9 for the entries.
- B1-2: the 3x case runs as a plain case; or, under the stop condition, stays `todo` and D83
  names its cost of about 45 s per `check:db` (recommended over `skip`: it keeps the
  re-measurement).
- D98: `npx vitest run app/src/components/homebrewPage.timed.test.ts` runs under 30 s with the
  3000 ms bound; its timeout is at least three times the larger of the alone and the `check:2`
  figure, both in its comment (Nit 4); the sibling case keeps axe over the open fold; both
  `COVERAGE.md` rows and the decision file state the rule (Nit 5); D98 deleted from `DEBT.md`.
- B1-7: `config.mjs` and `db-push.mjs` start the CLI through `supabaseCli()`; `git grep -n -w
  SUPABASE_CLI` finds no use; the CLI started from this worktree through `supabaseCli()` (its
  own output in the log, an auth or `LegacyDbConfigIpv6Error` included, never
  `MODULE_NOT_FOUND`): the `db-push.mjs` push if that path ran, else `node tools/supabase/config.mjs
  diff` (plan-B2 Risk 1). The push itself is step 10's evidence, not B1-7's.
- `META.md` counts seven `anon` functions in both sentences and names them (Nit 1); rule 2n's
  "(the tools' own entry)" in the README hook table is exact (Nit 9).
- B1-5: a missing CLI binary prints one `check:db: FAIL - ...` line (and `restore: FAIL - ...`),
  no stack trace (a `node:test` case on the message helper, or the handoff's forced run).
- B1-6: `bytesText(999950)` prints `1.0 MB` (`usage-lib.test.mjs`).
- B1-3: an older owner-requests read cannot apply its notices over a newer read's
  (`ownerRequests.test.ts`).
- B1 check: a forced 1 s timeout at the piped reset site of `tests/db/roles.mjs` answers
  `'timeout'` and leaves no `supabase` process (handoff), or the hang is recorded as a finding.
- B1 check: the configured bundle figure and its budget are in the handoff, or the reason they
  are not, with B3's step 0 named to read them.
- `.claude/README.md` did not grow over the task (B1's -7 lines included).
- `DEBT.md`: D85, D83, D98 deleted (D83 kept only under the stop condition).
- After the batch review's approve: the test push and `npm run e2e` pass, with the push path that
  ran (handoff); a failure reopened the batch by step 10's rule (Risk 2).
- B2 is its own commit on the task's HEAD with its own subject (Nit 7).

Verification commands:

```text
rtk npm run check:fast
rtk npm run check:1
rtk npm run check:2
npm run check:built
npm run check:db            (PowerShell tool, Rancher's win32\bin first on PATH, output to a log, the hang guard; stop the stack and Rancher after)
npx vitest run app/src/components/homebrewPage.timed.test.ts
node --test tools/supabase/lib.test.mjs tools/supabase/usage-lib.test.mjs
VITE_PREVIEW_BASE=https://daggerheart-loot.pages.dev/ node --env-file=E:/dev/daggerheart-loot/.env node_modules/vite/bin/vite.js build   (step 0; the parent checkout's vite path if needed)
node tools/bundle-budget.mjs
after the batch review's approve:
node --env-file=E:/dev/daggerheart-loot/.env.test.local --input-type=module -e "process.env.SUPABASE_DB_URL=process.env.SUPABASE_DB_URL_TEST; await import('./tools/supabase/migrate-test.mjs');"
  (alternative: node --env-file=E:/dev/daggerheart-loot/.env.test.local tools/supabase/db-push.mjs --project test --yes)
npm run e2e                 (node --env-file=E:/dev/daggerheart-loot/.env.test.local --import ./tests/e2e/ts-hooks.mjs tests/e2e/run.mjs, as B1 ran it)
```

Risks / do-nots:

- Do not copy a body of `get_shared_list`; the overload calls `get_shared_list(text, bigint)`.
- Do not change `delete_account()`, its grants or its return type; a stale tab relies on it.
- Do not raise or set a `statement_timeout` in a migration; the 4 s is the test's only.
- Do not fill a snapshot from anything but the map captured before the call.
- Do not copy an `.env` file into the worktree; the programs load them with `--env-file`.
- Do not push to `main`, and push nothing but the test project; the release pushes once after
  B5, after a `backup.yml` run that ended with `success`.
- A failed push or e2e reopens the batch (step 10). Once the test project has applied the two
  migrations, never edit or rename them: a behaviour change is a new migration (plan-B2 Risk 2).
- Settled, not to reopen: Q2 = A (the hash overload); D83 by bounded client calls; D98's axe in
  the sibling test; the B1 read counter in every store that re-reads.

Fallback: none planned. A failed D83 measurement takes the stop condition, not a second design.

### 7.3 B3 - D60, the account client from four packages (done `6be801dc`, review approve)

Objective: the account client is built from the four Supabase packages the app calls, every
request carrying the session's current token, the stored session and the PKCE verifier kept
under their keys.

In scope: sections 3.11.1, 4.3 (the B3 rows); the B3 rows of 2.1 and `reviews.md` (plan-B3
Blocker 1, Risk 1, Nits 1-5 and 12). Out of scope: D83 and every tooling line (B3b), every
screen change (B4, B5), the redirect handling in `redirect.ts`.

Files expected:

- `app/src/ports/supabase.ts`, `supabase.test.ts`, the new `supabase.real.test.ts`;
  `package.json`, `package-lock.json`
- `tests/e2e/lib.mjs` (two comments), `tools/bundle-budget.mjs` (the chunk comment)
- `docs/specs/DEBT.md`, `STATE.md` (the `sb-<ref>-auth-token` row), `COVERAGE.md`;
  `.claude/README.md` ("The configured bundle budget"); the amendment line in
  `docs/decisions/2026-09-24-the-account-client-loads-after-first-paint-a.md`,
  `docs/DECISIONS.md` (`node tools/decisions.js`)

Steps:

0. Read Status, `context.md` and `reviews.md`. Confirm on the tree: `git -C <tree> log -1
   --format=%h origin/main` and `origin/main`'s newest migration: any migration newer than
   `20261014120200` stops the batch for the owner (plan-B2 Risk 5). Then the configured bundle
   before any code: `VITE_PREVIEW_BASE=https://daggerheart-loot.pages.dev/ node
   --env-file=E:/dev/daggerheart-loot/.env E:/dev/daggerheart-loot/node_modules/vite/bin/vite.js
   build`, then `node tools/bundle-budget.mjs` (300.8 kB on B2's tree). The handoff records it.
1. D60: 3.11.1 in `supabase.ts` (`accountClients` with one base and one `keepaliveFetch`
   instance, the local `fetchWithAuth`, the token rule, the renamed call sites, the imports, the
   comments); `package.json` and `npm install --package-lock-only` in this worktree.
2. D60 unit cases, `supabase.test.ts`: the `vi.mock('@supabase/supabase-js')` block becomes four
   mocks (`@supabase/auth-js` `AuthClient`, `@supabase/postgrest-js` `PostgrestClient`,
   `@supabase/realtime-js` `RealtimeClient` and `REALTIME_SUBSCRIBE_STATES`,
   `@supabase/storage-js` `StorageClient`), each a constructor that records its arguments and
   returns the existing stub's part (`auth`, `rpc`/`from`, `channel`/`removeChannel`/`setAuth`,
   `storage.from`); every existing case keeps its expectation. New cases:
   - the constructors (plan-B3 Blocker 1): for `https://abcdefghijklmnopqrst.supabase.co`,
     `https://ABC.supabase.co:443/` and `http://127.0.0.1:54321`, `AuthClient` gets exactly `{
     url: '<origin>/auth/v1', headers: { Authorization: 'Bearer k', apikey: 'k' }, storageKey,
     flowType: 'pkce', detectSessionInUrl: false, persistSession: true, autoRefreshToken: true,
     fetch }` (plus `storage` when given), with `storageKey` `sb-abcdefghijklmnopqrst-auth-token`,
     `sb-abc-auth-token` and `sb-127-auth-token`; `PostgrestClient` gets `<origin>/rest/v1` and
     `schema: 'public'`; `RealtimeClient` gets `wss://<host>/realtime/v1` (`ws://` for the local
     URL); `StorageClient` gets `<origin>/storage/v1`; a request through the auth client's
     `fetch` calls `getSession` zero times and carries no `x-dhloot-tab`;
   - through the fetch handed to `PostgrestClient` (the same one `StorageClient` and
     `RealtimeClient` get): with `getSession` answering token A, a request carries `apikey: key`,
     `Authorization: Bearer A` and `x-dhloot-tab`; after the stub answers token B (a refresh) the
     next request carries B; with no session it carries `Bearer <key>`; an `Authorization` the
     caller set is kept;
   - the `onAuthStateChange` callback: `INITIAL_SESSION` with A calls `setAuth('A')`;
     `INITIAL_SESSION` with no session calls nothing (plan-B3 Nit 3); `TOKEN_REFRESHED` with B
     calls `setAuth('B')`; a repeat of B calls nothing; `SIGNED_OUT` calls `setAuth()`; a second
     account's `SIGNED_IN` with C calls `setAuth('C')`; the callback returns no promise;
   - `RealtimeClient` gets `params.apikey` and an `accessToken` that answers the session token,
     else the key.
3. D60 with the real packages (plan-B3 Blocker 1): `app/src/ports/supabase.real.test.ts`, no
   module mocks, a memory `storage` handed to `createCloud`, `fetch` stubbed by
   `vi.stubGlobal`. Cases:
   - a session stored under `sb-<ref>-auth-token` (expiry far ahead) makes `prefs.load()` send
     `apikey`, `Authorization: Bearer <access_token>` and `x-dhloot-tab` to
     `<origin>/rest/v1/user_prefs`;
   - a `createCloud` with `redirect.code` and a verifier stored under
     `sb-<ref>-auth-token-code-verifier` posts to `<origin>/auth/v1/token?grant_type=pkce` with
     that verifier and, on a session answer, writes `sb-<ref>-auth-token`;
   - if the test environment allows the navigation: `auth.signIn('google')` and
     `auth.signIn('discord')` (not awaited: the answer waits for `pageshow`) leave the verifier
     in the store; else the handoff says why the case is absent.
   Optional oracle: supabase-js's `createClient` (still a devDependency) with the same options,
   its requests compared field by field except `X-Client-Info`.
4. Records: 3.11.1's records (the decision's four-fact amendment line, `STATE.md`, `COVERAGE.md`
   with the new file's row, the comments in `tests/e2e/lib.mjs`, `tools/bundle-budget.mjs` and
   `supabase.ts`, the README bundle figures; `DEBT.md` D60 and its section deleted); `node
   tools/decisions.js`.
5. Gates, then `npm run e2e` before the commit (no migration, so no push; `npm run e2e` is D60's
   gate, owner Q1), then a new commit on the task's HEAD, `fix(account): build the account
   client from its four packages` (footer `Task: debt-cleanup`; no trailer); a remediation
   amends it.

Stop condition (never a half-batch): step 0's finding on `origin/main` stops the batch before
code. A unit case, the real-package case or an e2e flow that shows a request without the
session's token, a changed storage key or a wrong address is a defect to fix in this batch, not
a stop.

Acceptance criteria (each its own line at the batch's close):

- D60: `supabase.ts` imports `@supabase/auth-js`, `postgrest-js`, `realtime-js` and
  `storage-js`, and no module under `app/src` imports `@supabase/supabase-js` (`git grep`).
- D60 (plan-B3 Blocker 1): the four constructors get the exact options and addresses of step 2
  for the three URL shapes, and the auth client's `fetch` never reads the session.
- D60 (Blocker 1): with the real packages, a stored session makes `prefs.load()` send the token,
  `apikey` and `x-dhloot-tab` to `<origin>/rest/v1/user_prefs` (`supabase.real.test.ts`).
- D60 (Blocker 1): with the real packages, a redirect code and a stored verifier post to
  `<origin>/auth/v1/token?grant_type=pkce` and store the session under `sb-<ref>-auth-token`; the
  Google and Discord start case is present, or its absence is explained in the handoff.
- D60: the auth storage key is `sb-<first host label>-auth-token`, so a reader signed in on the
  previous build stays signed in (the unit cases; `npm run e2e`).
- D60: every PostgREST, Storage and Realtime HTTP request carries the session's current token,
  read per request: a refresh, a sign-out and a second account's sign-in reach all three (unit
  cases); `RealtimeClient.setAuth` follows `INITIAL_SESSION`, `SIGNED_IN`, `TOKEN_REFRESHED` and
  `SIGNED_OUT` (Nit 3).
- D60: `keepaliveFetch` still tags and flags the `rest/v1` requests (the existing cases pass).
- D60 (Nit 4): the configured build is smaller than step 0's figure, both figures in the README;
  the budget stays 303 kB.
- D60 (Nit 5): the 2026-09-24 decision carries the amendment line with its four facts; D60 and
  its section are gone from `DEBT.md`.
- D60 (Nits 1, 2): `STATE.md`'s `sb-<ref>-auth-token` row names auth-js and the port's rule;
  `COVERAGE.md`, `tests/e2e/lib.mjs`, `tools/bundle-budget.mjs` and `supabase.ts` no longer
  describe a supabase-js client; `COVERAGE.md` has a row for `supabase.real.test.ts`.
- D60 (Risk 1): plan 4.3's B3 rows hold, the row of a request with no session token included
  (no new code: the existing `writeOf` and `uploadRefusal` paths).
- `npm run e2e` passed every flow and contract case (writes as the user, the owner topic joins,
  F20's upload, cases J and Q).
- B3 is its own commit on the task's HEAD with its own subject.

Verification commands:

```text
rtk npm run check:fast
rtk npm run check:1
rtk npm run check:2
npm run check:built
VITE_PREVIEW_BASE=https://daggerheart-loot.pages.dev/ node --env-file=E:/dev/daggerheart-loot/.env E:/dev/daggerheart-loot/node_modules/vite/bin/vite.js build
node tools/bundle-budget.mjs
npm run e2e                 (node --env-file=E:/dev/daggerheart-loot/.env.test.local --import ./tests/e2e/ts-hooks.mjs tests/e2e/run.mjs)
```

Risks / do-nots:

- Do not change the auth storage key, `flowType`, `detectSessionInUrl` or the redirect handling.
- Do not hold a token in a client's headers; read it per request, as `fetchWithAuth` does; never
  wrap the auth client's own fetch.
- Do not await inside the `onAuthStateChange` callback.
- Do not remove `@supabase/supabase-js` from `package.json` (the e2e and layer 3 suites use it);
  do not run `npm ci` or `npm install` in another checkout.
- Do not copy an `.env` file into the worktree; push nothing.
- Settled, not to reopen: D60 as four packages in its own batch (owner Q1).

Fallback: none planned; a D60 defect is fixed in the batch.

### 7.3b B3b - D83's account delete, the stack tooling and the overload's time (implemented 2026-10-16; batch review next)

Objective: an account at three times every limit deletes within the statement timeout;
`check:db` and `restore:drill` end a hung CLI or Docker call with one FAIL line before the hang
guard; the shared-list overload's database time at 3x is measured.

In scope: sections 3.10.2 (as amended by 3.11.2), 3.11.2, 3.11.3, 4.2 and 4.3 (the B3b rows); the
B3b rows of 2.1 and `reviews.md` (B2 Risks 2 and 3, Nits 1, 2 and 5; plan-B3 Risks 3 and 4, Nits
6-11). Out of scope: D60 (B3), every screen change, `get_shared_list`'s bodies,
`delete_account()`'s body and grants, any `statement_timeout`, a bounded item delete.

Files expected:

- `app/src/ports/supabase.ts`, `supabase.test.ts`
- `supabase/migrations/20261015120100_account_delete_requests.sql` and
  `supabase/reversals/20261015120100_account_delete_requests.sql`
- `tests/db/delete-account.test.mjs`, `tests/db/list-shares.test.mjs`; `tests/e2e/contract.mjs`
- `tests/db/run.mjs`, `tools/supabase/lib.mjs`, `lib.test.mjs`, `restore.mjs`,
  `restore-drill.mjs`, `restore-prod.mjs` (the `main()` handlers, only if the throw needs them)
- `docs/specs/DEBT.md`, `FEATURES.md` ("Account"), `COVERAGE.md`; `.claude/README.md` ("The
  database suite", "Supabase configuration": the undo paragraph of `20261015120100`, the hook
  table's rule 2n phrase); the decision file "An account delete removes its purchase requests in
  bounded calls first", the amendment line in
  `docs/decisions/2026-10-15-a-statement-timeout-halves-a-request-at-once.md`, one line in the
  decision file "A shared page re-read names its held snapshots by hash", `docs/DECISIONS.md`
  (`node tools/decisions.js`)

Steps:

0. Read Status, `context.md` and `reviews.md`. Confirm `origin/main` and its newest migration as
   B3's step 0 does (a newer migration stops the batch for the owner). Then, before any code
   (PowerShell, Rancher's `win32\bin` first):
   - resolve the CLI binary (plan-B3 Risk 3): `node --input-type=module -e "const m = await
     import('./tools/supabase/lib.mjs'); console.log(m.supabaseCli(process.env));"` from the
     worktree;
   - three warm starts of that binary with the stack stopped and its images present:
     `Measure-Command { & <path> start -x <excludes> }`, where `<excludes>` is
     `LOCAL_STACK_EXCLUDES` of `tools/supabase/lib.mjs` joined by commas (never a plain start;
     `.claude/README.md`, "Shell hazards"), `& <path> stop` between runs; the rule of 3.11.3
     sets `STACK_TIMEOUT_MS` or stops the batch for the planner;
   - the hosted `anon` statement timeout (3.11.3, Nit 9: `rolconfig`, else
     `pg_db_role_setting`; a read-only scratch script with
     `--env-file=E:/dev/daggerheart-loot/.env.test.local`).
   The handoff records every figure and the values the rules chose.
1. D83 migration and tests: 7.2 step 5 as written, with the two `analyze` runs of 3.11.2 (in the
   3x case's transaction, and again after its rollback) and their comment; the prune-only case
   of plan-B2 Risk 3; the log line.
2. D83 port: 7.2 step 6 as written, on `rest.rpc` (the resume case included).
3. `tests/e2e/contract.mjs` (plan-B2 Blocker 1): as the throwaway account of the art check,
   before its `deleteAccount()`, through a client that carries its session,
   `rpc('delete_account_requests')` answers `error === null` and a number; any error,
   `PGRST202` included, fails the run.
4. Tooling, 3.11.3: `STACK_TIMEOUT_MS` by step 0's rule, `stackTimeoutMs(env)` with
   `DHLOOT_STACK_TIMEOUT_MS`, `stalled()`'s format (Nit 8), inherited stdio for `start` and
   `stop` in `run.mjs`, the FAIL line naming the override; `runningContainer()`'s throw and
   `run.mjs`'s catch; `restore.mjs` `cli()` on `runTimed` and `ensureStackWithAuth()`'s throw
   into the drill's and `restore-prod.mjs`'s handlers (Risk 4); `lib.test.mjs` cases for
   `stackTimeoutMs` (default, override, a bad value falls back, the format) and the throw.
   Proof: with the stack stopped, `DHLOOT_STACK_TIMEOUT_MS=1000` around `npm run check:db`
   (PowerShell, the guard) prints the start FAIL line within seconds; `Get-Process supabase`
   after it finds nothing; then `& <path> stop` (step 0's binary) and the real run.
5. B2 Risk 2: the layer 3 timing of 3.11.3 in `list-shares.test.mjs`.
6. Records: 3.10.2's and 3.11.2's records; `COVERAGE.md` (the `delete-account.test.mjs` and
   `list-shares.test.mjs` rows, each with Nit 10's sentence on the host-dependent time);
   `.claude/README.md` ("The database suite": the start timeout, its override and the `docker
   ps` line in the FAIL table; the undo paragraph "To undo
   `20261015120100_account_delete_requests`" (the previous frontend calls `delete_account()`
   alone; push the reversal); B2 Nit 2's two phrases; net zero over the task); `node
   tools/decisions.js`. `DEBT.md`: delete D83 (or keep it under the stop condition with B2 Nit
   1's wording).
7. Gates, then a new commit on the task's HEAD, `fix(account): bound the account delete and the
   local stack's start` (footer `Task: debt-cleanup`; no trailer); a remediation amends it.
   After the batch review's approve: the test push `node
   --env-file=E:/dev/daggerheart-loot/.env.test.local --input-type=module -e
   "process.env.SUPABASE_DB_URL=process.env.SUPABASE_DB_URL_TEST; await
   import('./tools/supabase/migrate-test.mjs');"` from this worktree, then `npm run e2e`; the
   handoff records both. A failed push or e2e reopens the batch: record it, fix, amend, run the
   gates again; a change under `supabase/migrations/` needs a new approve (rule 2r); once the
   test project has applied `20261015120100`, a behaviour change is a new migration, never an
   edit or a rename.

Stop condition (never a half-batch): step 0's finding on `origin/main`, or a slowest warm start
past 120 s with three times it past 240 000 ms, stops the batch before code. If the 3x case with
`analyze` fails its 4 s bound on a prune call or on the final `delete_account()`: keep it `todo`
with the figures, keep D83 in `DEBT.md` with B2 Nit 1's wording, drop steps 1-3's code and the
D83 records, ship the tooling and the timing on green gates, and report the figures to the
planner.

Acceptance criteria (each its own line at the batch's close):

- D83: every 7.2 D83 line (the bounded calls under `'4s'` with no row left, the function's pins
  and refusals, the loop with its stops and fallback, the resume and prune-only cases, the
  records, the clean reversal), with the `analyze` of 3.11.2 in the 3x case; or the stop
  condition with the figures.
- D83 (plan-B3 Nit 6): the case runs `analyze` again after its rollback, its comment says why,
  and the handoff holds the `pg_class.reltuples` figures before and after.
- D83: the hosted contract check calls `delete_account_requests()` by raw RPC and fails on any
  error (plan-B2 Blocker 1); hosted case E passes.
- D83 (Nit 7): the decision file gives the B2 step-0 figures, the statistics reason, the
  autoanalyze mechanism and the accepted trade-off; `DEBT.md` D83 is deleted, or kept with B2 Nit
  1's wording.
- B2 Risk 3 (plan-B3 Risk 3): the timed binary is the one `supabaseCli()` resolves;
  `STACK_TIMEOUT_MS` follows 3.11.3's rule (figures in the handoff); `DHLOOT_STACK_TIMEOUT_MS`
  overrides it (`lib.test.mjs`); `start` and `stop` inherit stdout and stderr; the forced 1 s run
  prints the FAIL line with the remedy, the override and the bound in `N s` (Nit 8), and leaves
  no `supabase` process.
- B2 Nit 5 (plan-B3 Risk 4): a `docker ps` timeout prints `check:db: FAIL - docker ps did not
  answer in 30 s. ...` from `run.mjs`, and a timed-out start, stop or status of the drill prints
  `restore:drill: <message>` then `restore:drill: FAIL` (a `node:test` case for the throw).
- B2 Risk 2 (plan-B3 Nits 9, 10): `list-shares.test.mjs` logs the medians of the two- and the
  three-argument forms on 300 linked records of about 81 KB as `anon`; the three-argument median
  is under half the effective hosted `anon` timeout read in step 0; both figures in `COVERAGE.md`
  (with the host-dependence sentence) and the decision file, or a `DEBT.md` entry with them.
- B2 Nit 2: the README's missing-binary FAIL row says "the checkout the run is in", and rule 2n's
  phrase names `RESET_COMMAND`.
- `.claude/README.md` did not grow over the task.
- After the batch review's approve: the test push applied `20261015120100` and `npm run e2e`
  passed every flow and contract case, the push path in the handoff; a failure reopened the
  batch by step 7's rule.
- B3b is its own commit on the task's HEAD with its own subject.

Verification commands:

```text
rtk npm run check:fast
rtk npm run check:1
rtk npm run check:2
npm run check:db            (PowerShell tool, Rancher's win32\bin first on PATH, output to a log, the hang guard; stop the stack and Rancher after)
node --test tools/supabase/lib.test.mjs
after the batch review's approve:
node --env-file=E:/dev/daggerheart-loot/.env.test.local --input-type=module -e "process.env.SUPABASE_DB_URL=process.env.SUPABASE_DB_URL_TEST; await import('./tools/supabase/migrate-test.mjs');"
npm run e2e                 (node --env-file=E:/dev/daggerheart-loot/.env.test.local --import ./tests/e2e/ts-hooks.mjs tests/e2e/run.mjs)
```

Risks / do-nots:

- Do not change `delete_account()` or set a `statement_timeout` in a migration.
- Do not time or stop the stack through `npx supabase` in this worktree; use step 0's binary.
- Do not copy an `.env` file into the worktree; push nothing but the test project.
- Settled, not to reopen: D83 by bounded request calls with `analyze` in the case (refresh before
  B3); the stack bound by measurement under the guard's stall kill.

Fallback: none planned. A failed D83 measurement takes the stop condition.

### 7.4 B4 - text, names, markup and placement on every page (outline)

Section 3.12. Expanded at its refresh after B3, with mocks of K3 and K4 (and D79's «?») under
`issues/debt-cleanup/mocks/`, grounded in the current pages and the owner's screenshots
(`context.md`).

Acceptance, each its own line:

- D75: no «?» golden line carries a `description`; `a11y.test.ts` passes on the help states.
- D77: a refused save, then «EN»: the line reads in English (`homebrewEditor.test.ts`,
  `quickItem.test.ts`, `CardForm`'s test); the golden's English tree shows English.
- D79: «Цена» / "Price" with a «?» that opens the conversion on touch and keyboard (`aria-expanded`);
  `listPage.test.ts` and the list goldens show it.
- D80: `git grep -n "—" -- app/src/lib/help.ts app/src/lib/dict.ts` finds nothing; each toast and
  failure string named in D80 follows rules 2 and 5.
- D89: the "en" run of `node tests/app/sweep.js 360` draws gm1's pages in English and asserts
  `lang`; the Russian run is unchanged.
- D99: `d.click('Печать')` presses the print control on `#/i/ci1`; every browser suite and
  `npm run e2e` pass.
- D100: signed in with an own item of a key that another account's item also has, «Печать» on
  that item's `#/h/<uuid>` and on a `#/s/` link that holds it stores the other account's item
  (`app.test.ts`, a `PickRow` test, a `SelBar` test).
- D101: the `#/tables/eq_secondary` golden names row 46 "... Ослепительный Свет: Потратьте Надежду
  ..." and the `#/tables/other_frames ~ two frames` golden names the `f56` row "... Быстрый
  выстрел: Потратьте 2 Надежды ...".
- D102: `components/markup.test.ts` renders `| a | b |` over `|---|---|` and
  `expectNoA11yViolations` passes; the print card draws the same cells.
- D103: a set with only `ende` drawn in Russian shows the one-language line before the bonus and
  `lang="en"` on it (`record.test.ts`); the `I18N.md` departure sentence is gone.
- K1: the editor's button row reads «Сохранить», «К моим предметам», «Удалить» clean and dirty;
  a dirty press asks `hbDropEdits` (`homebrewEditor.test.ts`, `homebrewEditor.timed.test.ts`);
  `FEATURES.md` "Homebrew" states the rule.
- K3: the «Сохранить себе» note sits in one group with its button, and the button's
  `aria-describedby` names it (`pickRow` or `itemPage` test); goldens of `#/h/`, the record modal
  and `#/s/` re-seeded; `FEATURES.md` "Records" states it.
- K4: on `#/s/` an entry's notes draw inside its row's border (a `sharedListPage` test reads the
  note inside `div.row`); `TableRows`'s `after` prop is gone; the shared-list goldens re-seeded at
  360 and 1180; `FEATURES.md` "Lists" states it.
- K11: Bold on an italic span and Italic on a bold span give `***...***` with the selection inside
  or around the stars, and a second press restores the text (`markupEdit.test.ts`,
  `markupField.test.ts`); the touch check in the handoff; `FEATURES.md` rule 18 states it.
- D105 (added by authoring-print-preview `ae5ab7cf`): gm4's `hb_longsrcaaaaaaaaa` on the standard
  and the compact sheet draws its whole source line inside the card (`PrintCard.svelte`,
  `.pc-bottom`); the print goldens re-seeded.
- K16: a colour print card (standard and compact) of a record with no picture, and of one whose
  picture fails, draws `img/_none.webp` in `.pc-art`, not an outline glyph; black-and-white draws
  no art block (a `printCard` or `printPage` test for each).
- K16: `PRINT_GLYPH`, `glyphKey`, `GlyphKey`, `.pc-glyph` and their `print.test.ts` cases are gone
  (`git grep -n -E "PRINT_GLYPH|glyphKey|pc-glyph" -- app/src` finds nothing).
- K16: the print goldens (and the editor's print-view goldens) re-seeded; `tests/app/print.js`
  passes its fitting checks; `FEATURES.md` "Print" states the fallback and records the owner's
  departure from Figma node `714-42387` (2026-10-15).
- B1-4: `app.test.ts`, "falls back on a bad value and writes nothing back", sets a good value
  first (`en`), then the bad one, and expects `ru` (B4 touches `app.test.ts` for D100).
- `DEBT.md`: D75, D77, D79, D80, D89, D99, D100, D101, D102, D103, D105 and the K1, K3, K4, K11
  entries (D106, D107, D108, D110) deleted; the section "Harness parity" deleted.

### 7.5 B5 - new controls and states (outline)

Section 3.13. Expanded at its refresh after B4, with mocks of the «Раздел» fold and the Items-tab
filter strip under `issues/debt-cleanup/mocks/`.

Acceptance, each its own line:

- D64 «Выйти»: focus lands on the «Войти» link (`accountMenu.test.ts`); the `MoveNotice` half of
  D64 moves to R10's section of `DEBT.md`.
- D66: after «Удалить (N)» on `#/lists`, focus lands on a named control (`listsPage.test.ts`); the
  homebrew bulk delete follows the rule.
- D95: on `#/tables/weapons` a pill press that drops its row, and «Сбросить всё», leave focus on a
  named element (`tables.test.ts`).
- The focus rule is rule 19 in `FEATURES.md`, "Consistency rules", and a decision file.
- D78: the bulk delete's status region says the start and the end only (`homebrewPage.test.ts`).
- K8: one shared status-region component replaces `.said`, `.lsaid`, `.rsaid`; the inline copies
  are gone.
- D84 line 5: the «Раздел» row folds past its first chips; states at 0, 1, the fold count, one past
  it and 300 sections, 360 px and 1180 px, goldens.
- D84 line 8: an error or undo toast keeps the slot; a later plain toast waits; unit tests for each
  pair of toast kinds; `FEATURES.md` "Chrome" (the toast paragraph).
- K2: the Items tab filters the own items by source, section and the table's facets with the offer
  rule; a pick that hides a ticked row drops the tick; the bulk strip acts on the drawn ticked rows;
  the filters are empty each time the tab opens; `homebrewPage.test.ts`, an inventory state and
  golden; `FEATURES.md` "Homebrew" and `STATE.md` (the UI row).
- K2 (plan-B1 Nit 6): a bulk delete and a bulk move with a ticked row that a filter hides act on
  the drawn ticked rows only (a `homebrewPage.test.ts` case each); B5's error-scenarios table
  lists both.
- K10: `#/tables/homebrew` draws no table-link, filter-link or section copy control
  (`tables.test.ts`, goldens); `FEATURES.md` "Tables and search" and rule 17 say so.
- `DEBT.md`: the sections "Debt cleanup", "Focus after a control that removes itself" and
  "Persistence review" are gone (every entry paid or moved), with the K10 entry.
- K14, at the closeout: the carry line is written into `persist-review`'s row of
  `issues/persistent-storage/plan.md` (2.2).
- Closeout, before the backup run (plan-B2 Risk 5): `origin/main`'s newest migration sorts before
  B2's two files (`migrate-prod` runs `supabase db push` with no `--include-all`, so a later
  stamp on `main` makes production refuse them; a renumber after the test push leaves an orphan
  on the test project); else stop for the owner.
- Release step: the `backup.yml` run ends with `success` and its run id is in the handoff before
  the one push; any other result stops the push (plan-B2 Nit 8).
- Closeout squash (B2 Nit 4): the one task commit's subject and body name behaviour, never a
  batch id or "the B1 nits".
- Owner step before the push (plan-B3, "Checks still needed"; no gate reaches a provider's
  consent page): the owner signs in with Google and with Discord, and links one to the other, on
  a build of B3's code (or later) against the test project; the handoff records the outcome, and
  any failure stops the push.

## 8. Deferred

- The Items-tab filters in the address (`#/homebrew?...`): a route change, not planned; named to
  the owner at closeout.
- `catalog-copy` (K5): its own task, recorded by B1.
- (Moved into B2 by the refresh before B2: `SUPABASE_CLI` in `config.mjs` and `db-push.mjs`,
  B1-7.)
- Closeout names any unrelated finding to the owner or writes a defect to `DEBT.md`.

## 9. Owner questions

### 9.0 Answered (owner, 2026-10-08, confirmed 2026-10-14/15)

- Q1: this task takes every `DEBT.md` entry except R10's section (D24, D62, D63, `MoveNotice`'s
  half of D64), including persist-review's entries and a real D60 fix (its own batch, `npm run
  e2e` its gate); `persist-review` keeps only its consistency re-check; plus every entry the
  earlier releases hand to this task.
- Q2 = A: the `get_shared_list` hash overload (B2).
- Q3 = A: an error or undo toast keeps the slot; a later plain toast waits (B5).
- Q4 = A: B1 fixes D61 (3.8), although Q1 left R10's section with R10.
- D82 moves to authoring-print-preview (2026-10-14); D90 is paid here; plan reviews before B1, B2
  and B3.

### 9.1 Open

- None.

## 10. Planner decisions (no owner question; the owner is away, each is a recommended default)

- D84 lines 6 and 9 close with reasons (2.1); D83's delete is measured before any chunking.
- D64, D66 and D95 share one focus rule (3.13).
- K8, R9's status-region candidate, ships in B5 with D78 (`CLAUDE.md`, "Extract shared UI on its
  second real use").
- `CHANGED_LISTS_MAX` is renamed `CHANGED_ROWS_MAX`: one name for one meaning across three reads.
- K1: «К моим предметам» in every state, not «Назад» or a label that flips while typing. Reason:
  the editor already names that link so, and the leave guard already asks on a dirty form.
  Trade-off accepted: a dirty form's ghost link no longer says «Отмена»; its confirm still offers
  to keep the edits.
- K2: built in B5, not a follow-up task. Reason: it reuses `FilterBar`, the facets, the homebrew
  seed and the mock that the «Раздел» fold already needs, so it costs no extra gate run. Trade-off
  accepted: a feature in a clean-up release, in page memory only.
- K3: the button and its note on a line of their own, tied by `aria-describedby`. Reason: a note
  under the whole row reads as the row's; one group reads as the button's. Trade-off: «Сохранить
  себе» moves under the other pick buttons.
- K4: the notes draw inside the row's border, as the owner's list page draws them. Reason: the
  owner's screenshots. Trade-off: the shared row grows taller by its notes.
- K5: a named follow-up `catalog-copy`, not a `DEBT.md` entry. Reason: a new capability, not a
  shipped defect (`DEBT.md`'s scope sentence).
- K6 (revised by plan-B1 Risk 1): `'networkidle2'` for the e2e driver only, and the in-flight
  URLs in its navigation-timeout error. Reason: it keeps a settle point for the once-only
  `expectInPage` checks and allows two long-lived connections; the failed log named no call, so
  the next flake must name its cause. Trade-off: a page with three or more open connections still
  times out; the browser suites are unchanged.
- K9: one 5 s Testing Library wait for every component test. Reason: the record names the files,
  not the finds; one line covers them and the watch. Trade-off: a failing find takes 5 s to fail.
- K10: all three copy controls go on `#/tables/homebrew` (table, filter, section). Reason: each
  reader sees only their own items, so no link there means anything to another reader; the
  section heads keep their in-page anchors.
- K11: the fix makes the other mark's equal runs wrap to `***...***`; uneven runs and a selection
  with one end on stars still do nothing (the B2-2 rule of rich-descriptions: never leave stars as
  text).
- Carries paid after B1 get `DEBT.md` entries in B1 (2.1), so a stop between batches loses none.
- Refresh before B2 (2026-10-15, owner away; each a recommended default):
  - D83's account delete joins B2, not its own batch. Reason: the same gates and plan review;
    no split criterion applies (7). Trade-off: B2's plan review carries two migrations.
  - D83 by bounded client calls (`delete_account_requests()`, 200 requests a call, then
    `delete_account()`). Reason: the timeout covers one RPC call, and the request lines are 96 %
    of the 3x rows. Trade-off: a failed final step leaves an account without its requests;
    the owner asked to delete them, and a retry resumes. Rejected: 3.10.2.
  - B1-2: `todo`, not `skip`, while D83 is unpaid. Reason: it keeps the re-measurement.
    Trade-off: about 45 s per `check:db` until B2 lands.
  - D98: the timed case ends without axe; the sibling case holds axe over the open fold. Reason:
    41 s of 52-56 s is axe over 400 identical rows, and three rows reach the same rules; two
    timed files already end without axe. Trade-off: axe no longer reads 400 rows at once.
  - D85's fill lives in the port with a pure lib helper; the store passes its held records (the
    R7g pattern of `known` and `held`). Rejected: a cache inside the port (state in an adapter,
    and the store and the port could disagree on what is held).
  - B1-3, B1-5 and B1-6 go to B2 (its read-order and tooling paths); B1-4 to B4 (its
    `app.test.ts`). Reason: each with the next batch that edits its file or pattern.
  - K16 in B4 (the owner's placement): the print goldens re-seed there anyway.
- Refresh before B3 (2026-10-16, owner away; each a recommended default):
  - D83 keeps the bounded request calls and gains `analyze` in its 3x case (3.11.2). Reason: with
    statistics the rest of the delete took 318 ms; the request lines are real row volume.
    Trade-off: a hosted account right after a bulk import may need a second press. Rejected: a
    bounded item delete; keeping D83 in `DEBT.md`.
  - D83 first joined B3; the plan review before B3 (Risk 2) and the orchestrator split it out:
    B3 is D60 alone (owner Q1) and B3b takes D83 with the tooling (7, split criteria).
    Trade-off: about 20-30 minutes of gates and one batch review more, for one cause per e2e
    failure.
  - B2 Risk 3: inherited stdio for `start` and `stop` and a measured bound under the guard's
    300 s stall kill, with an override for a first pull. Reason: both halves of the review's
    options cost little, and the inherited stdio removes the recorded hang's pipe shape.
  - B2 Risk 2: measured in B3's layer 3, a `DEBT.md` entry only if the bound fails.
  - D60's token by a per-request `fetchWithAuth`, as supabase-js does; no stored header.
