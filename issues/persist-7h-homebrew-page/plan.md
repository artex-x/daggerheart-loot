# Plan - TASK persist-7h-homebrew-page (homebrew release R7h)

## Status

- Task status: re-planned 2026-10-06 (planner, mode B) with the homebrew
  rework W1-W6 merged into the release (owner, 2026-10-03 and 2026-10-05,
  section 10); not started. R7d is closed and live. R7h ships before R9
  and R8 (owner R1).
- NEEDS_HUMAN_CONFIRMATION: no for `B7h.1` (it can start now). Two owner
  questions are open in section 8.1: Q1 (conversion rule 3, plan review
  finding plan-B7h.1-9) and Q2 (the purchase request lifecycle, owner
  input 2026-10-06). Both must be answered before `B7h.3` is dispatched;
  neither touches `B7h.1` (it moves today's request retention unchanged)
  or `B7h.2`. Every other fork is decided with a recommendation (section
  8).
- Plan review: required before B7h.1 (trigger: migrations - a `pg_cron`
  schedule that deletes rows in B7h.1, SECURITY DEFINER functions that
  `anon` executes in B7h.3; possible loss of stored data - the clean-up
  deletes rows past their retention, and B7h.3 converts every stored frozen
  copy and drops `list_entries.snapshot`; public contract changes - the
  route `#/h/<uuid>` in B7h.4, the lists file v2 import meaning in B7h.3, the
  `#/homebrew` tab routes in B7h.5, the meaning of `src` on
  `#/tables/homebrew` in B7h.6; a new write protocol - live links across
  accounts and the list change log in B7h.3)
- Plan review findings applied: reviews/plan-B7h.1.md
  - plan-B7h.1-1: 2.8.5 step 4, 2.8.7, 4.3, 5.1 - one fixed copy per
    distinct (list owner, key, snapshot); a variant item or card gets a
    new key made in SQL; the same rule in the lists file import.
  - plan-B7h.1-2: 2.7, section 3 step 2, step 4, acceptance - the revoke
    names `service_role`; the test asserts no EXECUTE for three roles.
  - plan-B7h.1-3: section 3 Files to edit, steps 4 and 5 - seeds run in one
    rolled-back transaction; `restore:drill` and `restore:prod` pause the
    job.
  - plan-B7h.1-4: 2.8.4 - `revision` is an md5 of the answer, compared for
    equality.
  - plan-B7h.1-5: 2.8.3, 2.8.6, 4.3 - `read_at` is set only by the definer
    function `mark_list_notices_read`; no update grant.
  - plan-B7h.1-6: 2.8.3, 2.8.6, 4.3 - the broadcast sends on insert and on
    a change of `kind` or `created_at` only; a read sends no message.
  - plan-B7h.1-7: 2.8.3, 4.3 - `get_homebrew_items` for `authenticated`
    only; `anon` executes four functions.
  - plan-B7h.1-8: 2.8.2, 4.4 - on `#/h/` the answer's records win over own
    records; own-wins applies to list rows only; a collision unit case.
  - plan-B7h.1-9: 2.8.5, 2.8.7, 8.1, 9, 4.3 - the exposure of conversion
    rule 3 is named; owner question Q1 with options and a recommendation.
  - plan-B7h.1-10: 4.3 - a pre-flight (backup, drill, branch counts)
    before the release push, and a "To undo" note.
  - plan-B7h.1-11: 2.8.7, 5.1, 5.2 - the lists file import at and past the
    item limit is refused whole; the contract text says so.
  - plan-B7h.1-12: Status, 4.1, 4.3, 4.4 - the foreign add, the lists file
    export and import and the e2e, limits and drill files move to B7h.3;
    B7h.4 keeps the screens; B7h.3's gates gain a golden compare.
  - plan-B7h.1-13: 4.4, 5.1 - new RU and EN texts for `hbImportUpdateNote`
    and the item delete confirms; a cascaded row's quantity, price and
    notes are named as lost.
  - plan-B7h.1-14: 4.4, m03 - no «Печать» for another account's item on
    `#/h/` until R9.
  - plan-B7h.1-15: section 3 steps 5 and 6, gates, 4.1 - the usage edit
    runs before `check:db`; the probe's minute is counted.
  - plan-B7h.1-16: section 3 Files to edit, step 8, acceptance - a "To undo
    `<ts>_lifecycle_cleanup`" note.
  - plan-B7h.1-17: 2.7, A6, step 7 - the law reads "on the backend: the
    database job, or the backend workflow that owns the table".
  - plan-B7h.1-18: 2.7, step 7 - a reader's explicit delete is not
    lifecycle logic.
  - plan-B7h.1-19: 2.7, section 3 step 5, acceptance - placed in B7h.1: the
    watch also warns on a failed or missing newest run.
  - plan-B7h.1-20: 2.8.3, 2.8.4, 4.3 - definer rows name `search_path`,
    the revoke and the forbidden keys; `related` capped at 1000.
  - plan-B7h.1-21: 2.8.3 - `get_shared_list` reads the item owner's book
    and cards.
  - plan-B7h.1-22: 4.3, 4.4 - the `META.md` sentence named; the privacy
    text names the related items.
  - plan-B7h.1-23: 4.3, 4.4 - the fake seed change moves to B7h.4.
  - plan-B7h.1-24: 4.3, 4.4 - `itemFailed` and `saveItemFailed` added with
    EN; `limitSnapshots` removed in B7h.3.
  - plan-B7h.1-25: 2.8.6, 2.8.7 - the second table is named, with the
    rejected one-table alternative.
  - plan-B7h.1-26: 5.1, 4.4 - placed in B7h.4: two rows (an add of a
    deleted item; a buffered edit of a cascaded row).
  - owner 2026-10-06: expiry after read - 2.7 A10, 2.8.3, 2.8.6, 4.3, 5.1,
    8 P5, 10: a change-log entry expires 1 hour after it is read, or 30
    days after creation if unread; the request lifecycle is owner question
    Q2 (8.1).
- Batch reviews: required for B7h.1 (migration, scheduled delete),
  B7h.2 (prompt and skill changes), B7h.3 (migration, definer functions,
  stored-data conversion), B7h.4 (public contract, new screens, privacy
  text); recommended for B7h.5 and B7h.6 (new routes and a route meaning
  change). The orchestrator decides.
- Refresh before each dispatch: the batch's file list and golden list
  against the tree; the design does not depend on them.
- Batches:

| Release | Task id | Batch | Status |
|---|---|---|---|
| R7h | `persist-7h-homebrew-page` | `B7h.1` W2: the scheduled clean-up in the database, the lifecycle law, the audit's backend findings | implement-ready after the plan review (section 3) |
| R7h | | `B7h.2` W5: owner insights are written to their homes | outline (4.2) |
| R7h | | `B7h.3` W1 schema: live links by item id, the change log, the snapshot conversion, the read-by-id functions, port, fake, contract case, the foreign add and the lists file export and import | outline (4.3); dispatch after the owner answers Q1 (8.1) |
| R7h | | `B7h.4` W1 screens: `#/h/<uuid>`, relation links, «Сохранить себе», the change log view, privacy, D71 | outline (4.4) |
| R7h | | `B7h.5` W3 + W4 + 2.1-2.5: the «Мои предметы» tabs, the import preview names, the field help, the search, the counter, the 300-item measurement | outline (4.5) |
| R7h | | `B7h.6` W6 + 2.6: the «Свои предметы» switch and the `#/tables/homebrew` source chips and facets | outline (4.6) |

## 1. Objective and non-goals

Objective: the owner's homebrew rework after the R7d hand test (2026-10-02)
plus the R7h page fixes, in one release:

- W1: an item is opened by its id by anyone, a list holds a live link to
  any item, «Сохранить себе» makes an own copy fixed in time, a deleted or
  changed linked item leaves a change-log entry on the list, and every
  stored frozen copy is converted. Acceptance: a reader opening an item by
  its link sees the same relations as the author (without edit controls),
  and every relation link opens (screenshot 02 dropped «Получается из» and
  the set members).
- W2: lifecycle data is cleaned on the backend on a schedule; the stray
  purchase request of 2026-09-30 goes.
- W3: «Мои предметы» gets four tabs: Items, Sources, Sets, Rules; one
  import, one account export.
- W4: the import preview names the held items.
- W5: owner insights are written to their permanent homes.
- W6: `#/tables/homebrew` gets one chip per source, and its facets follow.
- The page fixes 2.1-2.6 (owner, 2026-10-02), with the search, the counter
  and the 300-item measurement on the new Items tab and the cards search
  on the new Sets and Rules tabs (owner R2).

Non-goals: item share tokens (R9's `homebrew_shares` is not built, section
6); print routes for another account's items (R9, D70); pictures (R8);
shared books or subscriptions (D7 stays open, section 2.9); per-tab
exports (owner); a search on `#/tables/homebrew`; a stored switch or
query.

## 2. Design

### 2.1 Field help (owner, 2026-10-02; B7h.5)

Unchanged from the 2026-10-02 design:

- Remove the «?» of «Ранг» (both kinds: `hb-tier-help`, `hb-eqtier-help`)
  and of «Урон» (`hb-dmg-help`) in `HomebrewEditor.svelte`, the keys
  `hbTierHelp` and `hbDmgHelp` in RU and EN, their rows in
  `homebrewEditor.test.ts`, and the `why` of the state `#/homebrew/<axe>
  as gm1` in `tests/app/inventory.js`. The editor goldens that draw the
  two buttons are re-seeded.
- Amend rule 15(c) of `FEATURES.md` "Consistency rules": "A «?» explains
  what the site does with the field or a constraint of the site, never a
  basic game term: a player knows the Daggerheart rules (owner,
  2026-10-02)." `FEATURES.md` "Homebrew" drops «Ранг» and «Урон» from the
  fields that carry a «?».
- The other «?» hints pass the principle and stay («Источник», «Второй
  набор характеристик», «Улучшается до», «Получается из», «Карты правил»,
  «Линия улучшений», «Комплект»).
- The tier law binds the code, which obeys it; nothing on screen repeats it.
- C8 (R7d review Nit 13): the «Переместить (N)» panel's «Источник» either
  gains its «?» as rule 15(c) names, or `FEATURES.md` names the departure;
  decided with the «?» rework. Recommendation: no «?» - the panel's one
  select explains itself, and the departure is named in `FEATURES.md`.

### 2.2 The Items tab search (owner answer 1; moved to the Items tab by R2; B7h.5)

- From the eighth own item the Items tab's rows get a `SearchBox`. The
  threshold is `LIST_SEARCH_AT` (8) from `lib/lists.ts`; its comment widens
  to name the own items, the sets and the rule cards. Placeholder
  `hbFindOwn`.
- The match is a new pure `matchRecords(records, query)` in
  `lib/homebrew.ts`: the query folded as search folds it (`foldQuery`, the
  rule of `matchLists`), kept when either language of the name holds it; a
  blank query keeps every item. The query is page memory.
- `groupsOf` runs over the matched records, so a heading with no match is
  not drawn. No match draws `<Empty>{t.nothing}</Empty>` in place of the
  strip and the groups. «Выбрать все», the strip's count and every bulk
  action act on the drawn rows only; an effect removes from `app.sel` each
  own key the query hides.

### 2.3 The counter at the head of the rows (owner answer 2; B7h.5)

- On every tab the counter sits on the line right above its strip or its
  rows («N предметов из 100», «N источников из 20», «Комплектов: N, карт
  всего M из 100», «Карт правил: N, карт всего M из 100»). It counts every
  record of the tab, not the matches; with none it still shows the zero
  line above the empty text.
- Rule 1 of "Consistency rules" gains: "A counter sits at the head of the
  collection it counts: above its strip, or in its fold's summary."

### 2.4 The measured scale (owner answer 3; B7h.5)

- Measure the Items tab at 300 own items in the built test app in Chrome,
  unthrottled, on this host: (a) the route's navigation to the rows drawn,
  (b) one keystroke in the search box to the repaint; each the median of
  three runs, in a timed case of `tests/app/states.js`. The account: a
  test-build option of the fake that adds 300 generated items to gm1.
- Thresholds: (a) at most 500 ms, (b) at most 100 ms. Both under: no
  paging; the figures go into this plan and the handoff. Either over: the
  rows get the lists index's fold (the first 100 rows, then «Показать
  ещё»), and the case runs again.

### 2.5 The cards search (owner answer 4; moved to the Sets and Rules tabs by R2; B7h.5)

- The Sets tab and the Rules tab each draw a `SearchBox` from the eighth
  card of their kind (`LIST_SEARCH_AT`), placeholders `hbFindSets`
  («Найти комплект» / "Find a set") and `hbFindRules` («Найти карту» /
  "Find a card"); the match is `cardMatches` (`lib/homebrewForm.ts`). An
  open card form whose card the query hides stays open (rule 11).
- `DEBT.md` D84 loses its line "`HomebrewCards.svelte` lists up to 100 cards
  per fold with no search".

### 2.6 The «Свои предметы» switch (owner answer 5; mock m01; B7h.6)

Unchanged from the 2026-10-02 design (m01): a new `components/Switch.svelte`
(two real uses: `#/search` and the equipment tables' toolbar), the label
`ownSwitch` «Свои предметы» / "My items", on by default, memory only
(`app.homebrewShown`), drawn only while the account holds an own item. The
«Хоумбрю» chip leaves `#/search`'s kind row and the tables' toolbar;
`hbChipHint` goes. Track 34 x 20 px, knob 14 px, `--gold` on, `--surface`
off, the gold focus ring, no transition under `prefers-reduced-motion`.

### 2.7 W2 - lifecycle data is cleaned in the database (B7h.1)

Diagnosis: `create_purchase_request` deletes requests decided more than
24 hours ago, or pending and expired more than 24 hours ago, but only when
somebody sends a new request ("housekeeping runs at write time", decision
2026-09-26). With no new send, the row of 2026-09-30 stays for ever.

Mechanism - recommended: `pg_cron` in the database.

| Option | For | Against |
|---|---|---|
| **A. `pg_cron` calls one SQL function hourly (recommended)** | deploys through the migrations CI already pushes; no secret, no new deploy path; runs even when GitHub is idle; `tests/db` calls the function directly; the reversal removes it | one extension to enable; a failed run is silent unless watched (the usage report watches it, below) |
| B. A scheduled Edge Function | the owner's first idea | needs a scheduler anyway (`pg_cron` plus `pg_net`, or GitHub); R8's deploy route and tokens do not exist yet; a service key in the function |
| C. A step of the nightly `usage.yml` | the job and its production credentials exist | once a day; GitHub disables a scheduled workflow after 60 days with no push; the law would depend on CI |

Accepted trade-off of A: one more extension on both hosted projects; the
usage report turns a stopped job into a warning.

The function `public.lifecycle_cleanup() returns jsonb` (security invoker,
run as `postgres` by `pg_cron`; no API role may execute it: the revoke
names `public, anon, authenticated, service_role`, because Supabase's
default privileges grant EXECUTE on a new function to `service_role` too)
deletes:

| Rows | Retention | Why |
|---|---|---|
| `purchase_requests` decided | 24 hours after `decided_at` | today's constant, moved from the write path |
| `purchase_requests` pending and expired | 24 hours after `expires_at` | today's constant |
| `list_shares` revoked | 30 days after `revoked_at`, and only when a newer row of the same list and audience exists | the owner's panel draws the newest row of each audience («Ссылка удалена» and «Создать ссылку»); deleting the newest stopped row would make the panel create a new link on its next open |
| `cron.job_run_details` | 7 days | the job's own log grows by 24 rows a day |

It answers `{ "requests": n, "shares": n, "runs": n }`, which `pg_cron`
keeps in its run log. The schedule: `cron.schedule('dhloot-lifecycle',
'7 * * * *', 'select public.lifecycle_cleanup()')`. `create_purchase_request`
loses its delete (one rule, one place). B7h.3 adds the change log's rows to
the same function.

The standing law (decision file in B7h.1): data with a lifecycle - expiry,
retention after a decision or a read, a stopped link - is deleted on the
backend on a schedule: by the database job, or by the backend workflow
that owns the table (`usage_snapshots`, A6). A client may hide such a row
by its clock for display, never delete or keep it on its own. A reader's
explicit delete («Скрыть» of a notice) is not lifecycle logic.

Watch: `tools/supabase/usage.mjs` `collect()` adds `lifecycle_overdue`, the
count of rows the job should have deleted more than 2 hours ago (the same
predicates, each retention plus 2 hours); `usage-lib.mjs` `evaluate()` adds
a `lifecycle` check row: `ok` at 0, `warn` above 0 with the note "the
hourly clean-up has not run: N rows past their retention". The same row
also warns when the newest `cron.job_run_details` row of
`dhloot-lifecycle` has `status = 'failed'` or started more than 2 hours
ago (note "the hourly clean-up failed" or "the hourly clean-up has not
run since <time>"), so a job that fails with nothing due is not silent.

The audit of frontend-owned lifecycle logic (one-time, 2026-10-06):

| # | Finding | Where | Placement |
|---|---|---|---|
| A1 | Request clean-up runs only when a new request is sent | `create_purchase_request` | B7h.1: the scheduled job; the delete leaves the function |
| A2 | Revoked share links are never deleted; every revoke and re-create adds a row | `revoke_list_share`, `list_shares` | B7h.1: the job, with the newest-row rule above |
| A3 | `pg_cron`'s own run log would grow | `cron.job_run_details` | B7h.1: the job |
| A4 | The owner's panel hides an expired request by the browser clock | `lib/requests.ts` `pendingFor`, `ownerRequests.svelte.ts` | keep: display only; the database refuses a late apply or decline (`request: expired`) and deletes the row 24 hours later |
| A5 | Decided requests show until the page reloads | `ownerRequests.svelte.ts` `decided`, `forget` | keep: memory display, nothing stored |
| A6 | `usage_snapshots` past 400 days are deleted by the nightly report | `tools/supabase/usage.mjs` `saveSnapshot` | keep: the backend workflow that owns the table deletes them as `postgres` (the law's second form); the rows stop with the workflow, so they cannot pile up |
| A7 | The legacy write cutoff (2026-10-26) is the browser clock | `lib/legacy.ts` | keep: it gates the browser's own `localStorage`; R10 removes the legacy path and `move_legacy_list` |
| A8 | Browser keys: `dhloot.auth.return` expires after 10 minutes; tombstones grow | `ports/redirect.ts`, `state/lists.svelte.ts` | keep: browser data, not backend data |
| A9 | The fake mirrors expiry with `Date.now()` | `ports/fake-cloud.ts` | keep: a test double; the port does not expose the clean-up |
| A10 | The change log (new in W1) needs a retention | `list_notices` | B7h.3: 1 hour after read, or 30 days after creation if nobody reads it (owner, 2026-10-06), in the same function |

No finding goes to `DEBT.md`.

### 2.8 W1 - one item, one id, live links (B7h.3 schema, B7h.4 screens)

#### 2.8.1 What exists and what it breaks

- An item is `homebrew_items (id uuid, owner_id, key hb_..., book_id,
  content)`; `key` is unique per owner, not across owners: a homebrew file
  imported into a second account carries the same keys (decision "A
  homebrew import matches items by key, never by name").
- A list entry names an item by `item_key` with `source = 'homebrew'`: a
  reference (`snapshot` null, the list owner's own item, checked by
  `list_entries_reference_exists`) or a frozen copy (`snapshot` = the
  projection at the time, up to 131072 bytes, 1 MiB per list).
- A frozen copy carries its source and its own set and rule cards, but not
  the author's other items, so «Получается из» and the set members vanish
  for a reader (screenshot 02), and a relation to the author's other item
  is a name nobody else can open.
- Row level security on `homebrew_*` is owner-only; nobody else reads an
  item.

#### 2.8.2 The model

- An item's public id is `homebrew_items.id` (a random uuid the client
  makes with `crypto.randomUUID()`; B7h.3 step 1 confirms every create path
  uses it). Its address is `#/h/<uuid>`. Anyone with the id reads the item,
  signed out too (owner W1-a): ids are random, so items are unlisted, not
  secret. Nobody can list items: there is no `select` grant beyond the
  owner, only definer functions that read by id.
- A list entry of a homebrew item is a live link: `list_entries.hb_item uuid
  references homebrew_items (id) on delete cascade`, for an own item and
  for another account's item alike. `item_key` stays: a trigger sets it
  from the linked item, so `unique (list_id, item_key)` and the purchase
  request lines (which name `item_key`) keep working. `snapshot` goes.
- «Сохранить себе» (owner W1-b) makes an ordinary own item in «Хоумбрю»
  (no source, no section) from what the reader sees, with the item's own
  set and rule cards copied as new own cards; catalog relations stay, keys
  of the author's other items are dropped (R9's Q9-3 A rule). The copy is
  fixed in time because it is the reader's own item. On the reader's own
  list row the press also relinks the row to the copy.
- Relations resolve in the author's namespace on the server:
  `get_homebrew_item` returns the item and its related items (2.8.4), each
  with its `hid`, so the reader's card draws the same lines as the
  author's and every name links to `#/h/<hid>`. The author's own pages use
  the same links.
- Records in memory keep `id` = the key (selection, print, lists, the
  index are unchanged) and gain `hid` (the uuid). Another account's records
  live in a per-view index (the open `#/h/` page, the list's linked items).
  When a key collides with an own key (only after a file import of the
  other account's items): on `#/h/` the answer's `item` and `related` win
  over own records (the author's namespace), so the reader sees the
  author's relations; on a list row the own record wins, as `withRecords`
  does today.
- `#/i/hb_<key>` (shipped) keeps opening the owner's own item; every
  homebrew link the app writes from B7h.4 on is `#/h/<uuid>`.

#### 2.8.3 Schema (migration `<ts>_homebrew_links.sql`, B7h.3)

| Object | Change | Reversal |
|---|---|---|
| `list_entries.hb_item` | `uuid references homebrew_items (id) on delete cascade`, index `list_entries_hb_item (hb_item)`; check `(source = 'homebrew') = (hb_item is not null)` | snapshots rebuilt (below), then the column dropped |
| `list_entries_hb_key()` | before insert or update of `hb_item`: sets `item_key` and `source` from the item; replaces `list_entries_reference_exists()` (the FK checks existence; `for key share` is the FK's own lock) | the old trigger restored |
| `list_entries.snapshot` | converted (2.8.5), then dropped with `list_entries_snapshot_source`, `_valid`, `_size`, `list_entries_snapshot_limit()` and its two triggers, and the `limit_defaults` row `snapshot_bytes_per_list` | the column, its checks, the triggers and the row restored; every foreign link rebuilt as a snapshot of the live item |
| `list_notices` | `id uuid pk default gen_random_uuid()`, `list_id uuid not null references lists on delete cascade`, `item_key text not null`, `hid uuid` (null after a delete), `kind text check (kind in ('changed', 'deleted'))`, `name jsonb not null` (`{ en, ru }` at the time), `created_at`, `read_at`; `unique (list_id, item_key)`; RLS: the list's owner may `select` and `delete`; no insert or update grant | dropped |
| `mark_list_notices_read(p_list uuid) returns void` | definer, `set search_path = public, pg_temp`, `revoke execute ... from public, anon` then `grant ... to authenticated`: `42501` unless the caller owns the list; `update list_notices set read_at = now() where list_id = p_list and read_at is null` - a client never chooses the value, so no row outlives its retention | dropped |
| `homebrew_items_before_delete()` | rewritten: for every list of another owner that links the item, upsert a `deleted` notice with the item's names; the FK cascade then removes the entries (own lists too, as today) | the old body |
| `homebrew_items_touch()`, `homebrew_books_touch()`, `homebrew_cards_touch()` | rewritten: bump every list that links an affected item (any owner, by `hb_item`), and upsert a `changed` notice (read_at null, created_at now) for each such list of another owner | the old bodies |
| `list_notices_broadcast()` | deferred constraint trigger on `list_notices` insert, and on an update that changes `kind` or `created_at` (the early return of `purchase_requests_broadcast`); a `read_at` change sends nothing: one `notice` message `{ list }` per list owner per transaction on `owner:<uid>` (the request event's pattern) | dropped |
| `get_homebrew_item(p_id uuid) returns jsonb` | definer, stable, `set search_path = public, pg_temp`; `revoke execute ... from public` then `grant ... to anon, authenticated`: null for an unknown id; else `{ hid, mine, revision, item, related }` (2.8.4); the answer never holds `owner_id`, `book_id`, `created_at`, or a uuid other than the item's and the related items' `hid` | dropped |
| `get_homebrew_items(p_ids uuid[]) returns jsonb` | definer, stable, `set search_path = public, pg_temp`; `revoke execute ... from public, anon` then `grant ... to authenticated` (its one caller, the account list read, is signed in; `#/s/` reads through `get_shared_list` and `#/h/` through `get_homebrew_item`): at most 1000 ids; `[{ hid, item }]` for each id that exists; no `related`; the same forbidden keys | dropped |
| `get_shared_list(text)` | a homebrew entry's `snapshot` filled from the linked item through `hb_item` (any owner), with the book and cards of the item's owner (`i.owner_id`, not `v_list.owner_id` as the shipped body reads them), and `hid` added to the entry object (not inside `snapshot`, whose shape a stale tab validates) | the previous body |
| `clone_shared_list(text, uuid)` | copies `hb_item` (every homebrew entry stays live) | the previous body |
| `apply_list_writes(jsonb)`, `import_lists(jsonb)` | an entry carries `hb_item` instead of `snapshot`; a `snapshot` key is refused (`22023`) | the previous bodies |
| `lifecycle_cleanup()` | adds: `list_notices` read more than 1 hour ago (`read_at < now() - interval '1 hour'`), or unread and created more than 30 days ago (`read_at is null and created_at < now() - interval '30 days'`) - owner, 2026-10-06 | the B7h.1 body |

`META.md` section 3: `anon` executes four functions (today three; adds
`get_homebrew_item(uuid)`); `tests/db/harness.test.mjs` pins the list.

#### 2.8.4 What a reader receives

`get_homebrew_item(p_id)` answers, for the item `i` of owner `o`:

- `item`: `homebrew_snapshot_of(i.key, i.content, <source>, <o's cards the
  item names>)`, the projection a frozen copy carries today, plus `hid`;
- `mine`: `i.owner_id = auth.uid()` (the page then draws the edit controls);
- `revision`: `md5((item || jsonb_build_object('related', related))::text)`;
  a re-read compares it for equality and redraws only when it differs (a
  greatest-of-revisions number misses an edit of a lower counter and every
  change of a related item);
- `related`: `o`'s items that the item names in `craft`, `craft_from`, or
  that name it there, or share its `set` key, or its `eq.line` key - each
  as `{ hid, key, kind, en, ru, tier, eq: { t, tier, line }, set, craft,
  craft_from }` (no descriptions, no cards), ordered by name, at most 1000
  rows (a fixed cap, as `get_homebrew_items`: an author above the item
  limit after the conversion still gets every relation).

The client builds the card's relation lines from `related` with the same
functions the author's index uses (`madeFrom`, `upgradesTo`, `setOf` in
`lib/data.ts`), so the reader and the author see the same lines.

#### 2.8.5 The conversion of stored rows (owner W1-d)

In the migration, in this order, for every `list_entries` row with
`source = 'homebrew'`:

1. A reference (`snapshot` null): `hb_item` = the list owner's item of
   that key.
2. A frozen copy whose key the list owner holds: `hb_item` = that own item
   (visible content may change: accepted by the owner).
3. A frozen copy whose key exactly one other account holds: `hb_item` =
   that item. Exposure (plan-B7h.1-9): keys repeat only through a file
   import, so when the author deleted the item and one importer still
   holds it, the list owner's row links the importer's item - the
   importer's item id and, through `related`, the importer's connected
   items reach an account the importer never shared with, and the
   importer's later edits and delete change that list. Rule 3 stands
   unless the owner answers Q1 (8.1) otherwise.
4. Every other frozen copy (no holder, or more than one): a fixed copy in
   the list owner's «Хоумбрю» (no source, no section), its content the
   snapshot minus `id`, `src`, `book`, `cards` and the derived `tier:
   "A"`. One new item per distinct (list owner, key, snapshot content):
   the first distinct snapshot (by entry `id`) keeps the key; each other
   gets a new key made in SQL (`'hb_' || translate(substr(encode(
   gen_random_bytes(10), 'hex'), 1, 16), '0189', 'wxyz')`, valid for
   `homebrew_key_ok`), and each entry links the copy of its own snapshot,
   so no frozen content is lost. Embedded set and rule cards follow the
   same rule: a card key the owner does not hold becomes a new own card of
   that key (no source) from the first distinct text; a key the owner
   already holds with another text, or a later text that differs, becomes
   a new card under a new key, and the variant item's `set` or `refs` is
   rewritten to it. `hb_item` = the new item. The migration disables
   `homebrew_items_limit` and `homebrew_cards_limit` for these inserts
   only: an account may end above its limit, as after a lowered limit, and
   loses nothing.

The migration raises and rolls back if a homebrew entry is left without
`hb_item`. The reversal rebuilds a snapshot for every entry whose linked
item belongs to another account; entries that point to the list owner's
own items, including the fixed copies, stay references; the fixed copies
stay own items.

#### 2.8.6 The change log (owner W1-c, W1-e)

- One mechanism with purchase requests: one view, one clean-up
  (`lifecycle_cleanup()`) and one owner-topic pattern - but a second table,
  `list_notices`. One table for both was rejected: requests are written by
  `anon` through a bounded function with lines and a status; notices are
  written by triggers and have neither.
- One view with purchase requests: the list page's panel becomes «Новое в
  списке (N)» / "New in this list (N)", N = pending requests + unread
  notices. Requests keep their rows and buttons; a notice row reads
  «Автор изменил «%s».» with «Открыть» (`#/h/<hid>`), or «Автор удалил
  «%s» - строка убрана из списка.»; each has «Скрыть» (deletes the row);
  «Скрыть изменения» deletes every notice of the list.
- Read: the page calls `mark_list_notices_read(list)` when the panel draws
  an unread notice in a visible tab (only rows with `read_at` null change,
  and a read sends no message, so the owner's devices do not ping-pong); a
  read notice stays drawn, without the «новое» mark, until it is hidden or
  the job deletes it.
- Retention (owner, 2026-10-06): a notice expires 1 hour after it is
  read, so it never disappears before somebody has seen it; if nobody reads
  it, it expires 30 days after it was created (the backend cap the
  lifecycle law needs: a list nobody opens would otherwise keep its rows
  for ever). The hourly job deletes it within the next hour after either
  point. One row per (list, item): a second edit refreshes the row
  (`created_at` now, `read_at` null), so the 30 days count from the last
  change; a delete after an edit turns it into `deleted`.
- The lists index line adds the unread count beside the requests:
  «%n изменение» (plural set). The owner's devices re-read on the `notice`
  message, as on `request`.

#### 2.8.7 Public contracts and decisions

| Contract | Change | Files (same commit) |
|---|---|---|
| `#/h/<uuid>` | new route: one homebrew item by its id, for everyone; a malformed or unknown id draws «Предмет не найден» (the record page's not-found) | `docs/fixtures/urls/routes.json`, `tests/contracts.js`, `CONTRACTS.md` section 1, `ROUTES.md` "Records, lists and print", `llms.txt` (an agent cannot build the id) |
| `#/i/hb_<key>` | unchanged: the owner's own item | none |
| `#/s/<token>` | route and projection keys unchanged; the projection adds `hid` per homebrew entry; a list's homebrew entries are always live | `CONTRACTS.md` text |
| lists file v1 / v2 (B7h.3) | format unchanged (`import-v1`, `import-v2` fixtures byte for byte); export writes a snapshot for every homebrew entry, own or another account's (from the live item); import: an entry whose key the account holds becomes a link to the own item, every other entry becomes a fixed copy in «Хоумбрю» (one `import_homebrew` call, then `import_lists`), one copy per distinct (key, snapshot) - a later differing snapshot of a key gets a new key from `keyFrom`, cards likewise. `CONTRACTS.md` "Lists file" adds: "Each homebrew entry the account does not hold becomes an own item, so the import counts against the item and card limits and `import_homebrew`'s 1000 rows; past either it is refused whole, and nothing is written." | `CONTRACTS.md` "Lists file", `llms.txt`, `importFrozenN` text |
| `homebrew-v1` | unchanged | none |

Decisions written in B7h.3: "An item is read by its id by anyone; a list
holds a live link to any item" (amends "Homebrew in the owner's lists is a
live reference; a copy that leaves is frozen" and "A frozen copy embeds its
source and cards; a reference must exist when written", both superseded in
part; amends D7 "Homebrew keeps the way open to shared books": items are
readable by id, `list_entries.hb_item` is the anticipated `item_owner`,
books stay owner-only, subscriptions stay open; its consequences name the
exposure of conversion rule 3, 2.8.5, as the owner answers Q1); "A list's
change log shares the requests' view and the database's clean-up"
(rejected: one table for requests and notices, 2.8.6). Decisions of R7d
that name frozen copies ("A lists file is version 2 only when it holds
homebrew", "A frozen copy holds up to 131072 bytes", "A list's frozen
copies hold up to 1048576 bytes") get their "Superseded in part" pointers.

### 2.9 W3 - the «Мои предметы» tabs (B7h.5; mock m02)

Placement - recommended: tabs inside «Мои предметы» (the owner's
preference).

| Option | For | Against |
|---|---|---|
| **A. Tabs inside «Мои предметы» (recommended)** | one menu entry, one import; the four kinds share the page head and the limit lines | the page grows a tab row |
| B. Four account-menu entries | each page is short | four menu lines for one feature; the import would need a home |
| C. Tabs in the main tab bar | always visible | the main bar is the catalog's; signed-out readers would see dead tabs |

Routes (a public contract addition, fixtures in B7h.5):

| Hash | Tab |
|---|---|
| `#/homebrew` | Items (unchanged address) |
| `#/homebrew/sources` | Sources |
| `#/homebrew/sets`, `#/homebrew/sets/<key>` | Sets; with a key, that set open and scrolled to |
| `#/homebrew/rules`, `#/homebrew/rules/<key>` | Rules; with a key, that card open and scrolled to |
| `#/homebrew/new`, `#/homebrew/<key>` | the editor (unchanged) |

- The tab row is a `ChipRow` of `Chip href` links with `aria-current="page"`
  (the tables' group chips pattern; navigation, not ARIA tabs). Labels:
  «Предметы», «Источники», «Комплекты», «Карты правил» / "Items",
  "Sources", "Sets", "Rule cards".
- Shared head above the tab row: `PageTitle` «Мои предметы», the lead, and
  the one import toggle «Импорт из файла» (the lists page's label; it
  imports sources, cards and items and is drawn on every tab).
- Items: «Новый предмет», then the rows' head (search from 8, counter,
  strip with «Переместить (N)», «Скачать JSON (N)», «Удалить (N)»), then
  the groups.
- Sources: «Новый источник» first (the place of the primary action on the
  Items tab), the counter, then the rows of today's «Источники» fold
  (sections, rename, «Скачать JSON», delete); each source name links to its
  rows on `#/tables/homebrew` (B7h.5: the source anchor; B7h.6: the chip).
- Sets: «Новый комплект», the search from 8, the counter, then each set
  card with its text, its source and its members (links to `#/h/<hid>`),
  «Убрать» per member and «Добавить предмет» (an `ItemPicker` over own
  items; an item in another set asks «Предмет уйдёт из комплекта «%s».»).
  A member change is an `updateItem` of that item's `set`.
- Rules: the same with the items that name the card in `refs`; a fourth
  card on an item is refused «У предмета уже три карты правил.».
- Links from items: on the author's card the «Комплект» line's set name
  and each own rule card link to `#/homebrew/sets/<key>` and
  `#/homebrew/rules/<key>`; a reader's card draws no management link.
- Schema: no change. A set's members and a rule card's items stay on the
  item (`content.set`, `content.refs`), which the Sets and Rules tabs read
  and write; the schema freedom of section 10 is not used for `homebrew_cards`
  because nothing on these pages needs a new column. One import
  (`import_homebrew`, unchanged) and one account export (the data zip,
  unchanged); the shipped subset downloads (per source, ticked items) stay,
  so no feature is dropped.

### 2.10 W4 - the import preview names the items (B7h.5; mock m04)

- `heldOf` (`lib/homebrewFile.ts`) returns, beside its counts, the names
  of the held items, cards and sources and of the new items whose name
  equals an own item's name, each in file order.
- Under the «Пропустить» / «Обновить» control the preview draws one line
  per kind that has names: «Уже есть - останутся как есть: <names>.» or
  «Уже есть - заменятся из файла: <names>.» (the verb follows the
  control), and «Новые с тем же названием, что у ваших: <names>.». Each
  line names the first 10, then «и ещё N» (rule 12, the existing plural
  key). Sources take their own line, cards theirs.
- The count lines `hbImportHeld` and `hbImportSameNames` give way to these
  lines; the notes `hbImportSkipNote` and `hbImportUpdateNote` stay.

### 2.11 W6 - the `#/tables/homebrew` source chips (B7h.6; mock m05)

- With items in two or more sources (the default «Хоумбрю» counts), the
  page draws one chip per source above the rows, in `groupsOf`'s order
  (named sources oldest first, «Хоумбрю» last), each with its item count.
  One chip is always on; inside it the rows are grouped by that source's
  sections only («<section>» headings, then «Без раздела»). With one
  source the page stays as it is (no chip row).
- The chip is the `src` filter with one value: `#/tables/homebrew/f_src-<key>`
  (or `f_src-hb`). The grammar does not change; the meaning does: on this
  table `src` holds at most one value and picks the chip. A bare address
  picks the first chip. An address with several `src` values keeps the
  first value that names a held source (`app.replace` drops the rest). An
  anchor (`#/tables/homebrew/<section or source or item key>`) picks the
  chip of its source and scrolls as today.
- Facets: the filter panel drops its `src` row on this table (the chips
  are the row); `sect` lists only the chosen source's sections; `kind`
  stays. Switching a chip keeps `kind`, drops a `sect` value of another
  source, and writes the address, so «Скопировать ссылку» copies the chip.
- The equipment tables' `src` facet does not change (book and own sources
  mix there; the chips there are the table groups).
- The Sources tab links each source to its chip (`f_src-<key>`).
- This is a route-meaning change: `ROUTES.md` (the `homebrew` row and the
  chip text), `CONTRACTS.md`, `llms.txt`, a new fixture
  `#/tables/homebrew/f_src-hb_alderworkshopaaa` and its contracts case.

### 2.12 W5 - owner insights (B7h.2)

- The rule: when the owner states a reusable rule (how mocks look, when a
  field gets a «?», how a page is laid out), the role that receives it
  writes it into its existing home in the same batch: `FEATURES.md`
  "Consistency rules" (product behaviour), `DESIGN.md` (visual and mock
  rules), `.claude/README.md` (tooling, process), `docs/decisions/` (a
  choice with rejected alternatives), a prompt (a step of a role).
  `CLAUDE.md` only under its own "repeated mistake" rule.
- Limits: only a rule that changes later work; one to three lines per
  rule; a size budget per home (the handoff skill's table: `FEATURES.md`
  "Consistency rules" 20 rules, `DESIGN.md` "Named Rules" 8 per section,
  `.claude/README.md` the existing 150 KB warning); a rule that would pass a
  budget replaces or merges an older one.
- Who: the orchestrator when it records an owner answer in `context.md`;
  the planner when an answer settles a rule; the reviewer checks it in
  every review ("an owner rule stated in this batch's sources is in its
  home").
- Files: `orchestrate.prompt.md` (a step under "Shared context"),
  `plan.prompt.md` (a step after "Design decisions"), `review.prompt.md`
  (a line in section I), `.claude/skills/handoff/SKILL.md` (a closeout
  check in "Finishing a task" and the budget table), `.claude/README.md`
  (a short "Owner insights" section with the homes table).

## 3. Batch `B7h.1` - W2: the scheduled clean-up (implement-ready)

Objective: the database deletes lifecycle rows on a schedule; the law is
recorded; the audit's backend findings are fixed.

Split criterion: the owner placed W2 first (R3) and W5 as its own batch
(R4), so W2 cannot merge with W1's schema batch without reordering; and a
review that cannot be held in one pass - W1's migration converts every
stored frozen copy and rewrites nine functions. Merging would save about
23 minutes of gates.

In scope: 2.7 (the function, the schedule, the change of
`create_purchase_request`, the usage watch, the decision, the specs).
Out of scope: the change log (B7h.3 adds its rows to the function); any
screen; any string.

Files to create:
- `supabase/migrations/<ts>_lifecycle_cleanup.sql` (`<ts>` after
  `20261002130000`)
- `supabase/reversals/<ts>_lifecycle_cleanup.sql`
- `tests/db/lifecycle.test.mjs`
- `docs/decisions/<date>-lifecycle-data-is-deleted-by-the-database-on-a-schedule.md`

Files to edit:
- `tests/db/purchase-requests.test.mjs` (a case that proves the write-time
  delete, if one exists: `rtk grep -n -E "24 hours|interval|decided_at <"
  tests/db/purchase-requests.test.mjs`; it moves to `lifecycle.test.mjs`)
- `tests/db/harness.test.mjs` (only if it pins the functions
  `authenticated` may execute)
- `tools/supabase/usage.mjs` (`collect()`: `lifecycle_overdue` and the
  newest run of the job), `tools/supabase/usage-lib.mjs` (`evaluate()`:
  the `lifecycle` row, `renderSummary` if rows are listed by key),
  `tools/supabase/usage-lib.test.mjs`, `tests/db/usage.test.mjs`
- `tools/supabase/restore-drill.mjs` and `tools/supabase/restore-prod.mjs`
  (deactivate `dhloot-lifecycle` with `cron.alter_job(jobid, active :=
  false)` before the load and activate it after the verify, also on a
  failure; skip both when `cron.job` has no such row, as in a backup taken
  before B7h.1), and their tests `tests/db/restore-drill.test.mjs`,
  `tests/db/restore-prod.test.mjs`
- `docs/decisions/2026-09-26-purchase-requests-are-written-only-by-a-bounded.md`
  (pointer: `- Amended by "<title>" (<date>): the 24-hour retention runs
  hourly in the database, not at write time.`)
- `docs/specs/META.md` section 3 (one paragraph: the database deletes
  lifecycle rows hourly with `pg_cron`; the table of 2.7)
- `docs/specs/FEATURES.md` "Account and browser lists" (only where it says
  when a request is deleted)
- `.claude/README.md` "Backups and restore" (the drill and the production
  restore pause the job for the load and the verify) and the "To undo"
  notes (a new note: "To undo `<ts>_lifecycle_cleanup`, revert the app
  alone: it reads nothing the job changes. The reversal unschedules the
  job, drops the function and the extension, and brings back the
  write-time delete; rows the job deleted are not restored - they were
  past their retention.")
- `.claude/README.md` "Supabase configuration" (the extension, the job
  name, how the owner reads the last runs:
  `select jobid, status, return_message, start_time from cron.job_run_details order by start_time desc limit 5`
  in the dashboard SQL editor, read-only)
- `docs/specs/COVERAGE.md` (the new test file)
- `docs/DECISIONS.md` by `node tools/decisions.js`

Ordered steps:

1. Probe the local stack (PowerShell tool): `npx supabase db reset --local`
   with a scratch migration holding `create extension if not exists pg_cron
   with schema pg_catalog;` and `select cron.schedule('probe', '7 * * * *',
   'select 1');`. Expected: both succeed (the local log shows `pg_cron
   scheduler started`). Confirm the schema clause against the Supabase docs
   for the pinned CLI (`pg_catalog` per the current docs; use what they
   name). If the extension cannot be created locally, stop and report: the
   fallback is option C (a step of `usage.yml` that calls the function as
   `postgres`), which needs the planner. Remove the scratch file.
2. Write the migration, in this order:
   - the extension (step 1's statement), and `grant usage on schema cron
     to postgres` only if step 1 shows it is needed;
   - `create function public.lifecycle_cleanup() returns jsonb language
     plpgsql security invoker set search_path = public, pg_temp`, a
     one-line comment naming the law and the decision; three deletes with
     `get diagnostics ... row_count` (the requests rule; the shares rule
     with `exists (select 1 from public.list_shares n where n.list_id =
     s.list_id and n.audience = s.audience and n.created_at > s.created_at)`;
     `delete from cron.job_run_details where end_time < now() - interval
     '7 days'`); returns `jsonb_build_object('requests', ..., 'shares', ...,
     'runs', ...)`;
   - `revoke execute on function public.lifecycle_cleanup() from public,
     anon, authenticated, service_role;`
   - `create or replace function public.create_purchase_request(...)`: the
     body of `20260928120000_purchase_requests.sql` byte for byte without
     the comment "Only now that the call inserts..." and its `delete`
     (lines 161-165); the grants stay (`create or replace` keeps them);
   - `select cron.schedule('dhloot-lifecycle', '7 * * * *', 'select
     public.lifecycle_cleanup()');`
3. Write the reversal: `select cron.unschedule('dhloot-lifecycle');`,
   `create or replace` of `create_purchase_request` with the original body
   byte for byte, `drop function public.lifecycle_cleanup();`, `drop
   extension if exists pg_cron;`. Its first comment says the deleted rows
   are not restored (they were past their retention).
4. `tests/db/lifecycle.test.mjs` with the helpers of `tests/db/roles.mjs`
   and the seeding style of `purchase-requests.test.mjs` (rows inserted as
   `postgres` with set timestamps). Every seed, the call and the
   assertions of a case run in one transaction that the case rolls back
   (the `asRole` setup pattern): the hourly job at minute 7 cannot see an
   uncommitted row, so it cannot delete a seed before the assertion.
   - the job: `cron.job` holds `dhloot-lifecycle` with schedule
     `7 * * * *` and command `select public.lifecycle_cleanup()`;
   - requests: decided 25 hours ago deleted, decided 23 hours ago kept,
     pending expired 25 hours ago deleted, pending expired 1 hour ago kept,
     pending live kept; their lines go with them (cascade);
   - shares: revoked 31 days ago with a newer row of the same list and
     audience deleted; revoked 31 days ago and newest kept; revoked 29 days
     ago with a newer row kept; active kept; a share of the other audience
     does not count as newer;
   - the answer's counts match;
   - `anon` and `authenticated` get `42501` on `select
     public.lifecycle_cleanup()`; `has_function_privilege(r,
     'public.lifecycle_cleanup()', 'EXECUTE')` is false for `anon`,
     `authenticated` and `service_role` (`asRole` refuses `service_role`);
   - a send through `create_purchase_request` leaves a decided row of 25
     hours ago in place (the delete moved);
   - a second call deletes nothing and answers zeros.
5. Usage watch (before the `check:db` of step 6, so one `check:db` covers
   `usage.test.mjs`): `collect()` adds `lifecycle_overdue` (one `select`
   with the three predicates, each retention plus 2 hours) and
   `lifecycle_last` (the newest `cron.job_run_details` row of the job:
   `status`, `start_time`, or null); `evaluate()` adds the `lifecycle` row
   after `requests` (`ok` at 0 overdue and a succeeded run in the last 2
   hours; `warn` with the notes of 2.7 otherwise); tests in
   `usage-lib.test.mjs` (0 and 3 overdue, a failed run, a run 3 hours old,
   no run) and `usage.test.mjs` (a seeded overdue row is counted, inside
   one rolled-back transaction). The restore pause of "Files to edit" in
   `restore-drill.mjs` and `restore-prod.mjs` with their tests.
6. `npm run check:db` (PowerShell tool): the new file, the moved case, the
   usage and restore cases, and the up-down-up walk pass.
7. The decision file (template `.claude/templates/decision.template.md`):
   - Task: `persist-7h-homebrew-page` (owner, 2026-10-03, W2; planner,
     2026-10-06, the mechanism).
   - Decision: lifecycle data is deleted on the backend on a schedule -
     by `public.lifecycle_cleanup()`, which `pg_cron` runs hourly, or by
     the backend workflow that owns the table (`usage_snapshots`); the
     retentions of 2.7; a client may hide such a row by its clock, never
     delete or keep it; a reader's explicit delete is not lifecycle logic;
     the nightly usage report warns when rows outlive their retention by 2
     hours or the job's newest run failed or is older than 2 hours.
   - Rejected: a scheduled Edge Function (needs a scheduler and a deploy
     route that do not exist yet); a step of the nightly workflow (daily,
     and GitHub stops an idle schedule after 60 days); housekeeping at
     write time (rows stay while nobody writes).
   - Amends "Purchase requests are written only by a bounded function any
     link holder calls" (2026-09-26): the retention runs hourly, not at
     write time.
   Then the pointer line in the 2026-09-26 file, `node tools/decisions.js`.
8. The spec and README edits of "Files to edit", the "To undo" note
   included.
9. `rtk npm run check` (Bash, timeout 600000). Commit: the task's first
   commit, `feat(db): delete lifecycle rows hourly with pg_cron` with the
   reason in the body. After the batch review approves: `npm run db:push --
   --project test`, then `npm run e2e`.

New and changed strings: none.

Acceptance:
- `check:db` passes with `tests/db/lifecycle.test.mjs`; the reversal walk
  passes.
- The job `dhloot-lifecycle` exists after the migration and is gone after
  the reversal.
- Each retention row of 2.7 is proved by a kept and a deleted case.
- `create_purchase_request` deletes nothing; its other behaviour is
  unchanged (`purchase-requests.test.mjs` passes).
- No API role (`anon`, `authenticated`, `service_role`) may execute
  `lifecycle_cleanup()`.
- The usage report shows the `lifecycle` row: `ok` at 0 overdue with a
  recent succeeded run; `warn` on overdue rows, a failed newest run, or no
  run in 2 hours.
- `restore:drill` and `restore:prod` pause and resume the job; a backup
  without the job restores as before.
- Every `lifecycle.test.mjs` and `usage.test.mjs` seed runs in a
  rolled-back transaction.
- The "To undo `<ts>_lifecycle_cleanup`" note exists.
- The decision file and its pointer exist; `docs/DECISIONS.md` is rebuilt.
- After the approve: `db:push --project test` applies the migration on the
  hosted test project (the extension is created there), and `npm run e2e`
  passes.
- C7 (the budget rule of R7d plan section 7) does not apply: no bundle
  change.

Standing checks:
1. Scale: no screen. The function deletes at most what has passed its
   retention; at 3x (150 lists, 30 pending requests per list, 300 decided
   in a day) one run deletes a few thousand rows by sequential scan of
   small tables; no index is added.
2. Error scenarios: a failed run leaves the rows for the next hour and is
   logged by `pg_cron` (`status = failed`); the usage report warns after 2
   hours. A concurrent apply or decline: the job deletes only rows past 24
   hours, which no client can act on (`request: expired` or `decided`). A
   share purged under an open panel: the panel shows the newest row, which
   stays. Revert (previous frontend): it reads nothing the job changes.
   Revert (down migration): the job and the function go, the write-time
   delete returns; deleted rows stay deleted (they were past retention). A
   stale tab: no client change. No path loses data inside its retention.
3. Consistency: not applicable - no screen, no string.
4. RU/EN parity: not applicable - no string.

Gates (this host, `context.md` costs):

| Gate | Minutes |
|---|---|
| step 1 probe: `npx supabase db reset --local` | 1 |
| `npm run check:db` (PowerShell), after the usage and restore edits | 10 |
| `rtk npm run check` | 9 |
| after the approve: `npm run db:push -- --project test` | 1 |
| after the approve: `npm run e2e` | 3 |

Total about 24 minutes. No `check:built`, goldens or sweep: nothing draws
differently.

Risks, do-nots:
- Do not give `anon`, `authenticated` or `service_role` execute on the
  function.
- Do not delete inside a retention; do not delete the newest share row of
  an audience.
- Do not push to production (CI's `migrate-prod` does at the release push).
- If `cron.schedule` needs a different call form on the hosted project,
  `db:push --project test` fails; stop and report with the error text.

## 4. Later batches (outlines)

### 4.1 Batch table, gates and costs

| Batch | Scope | Gates (minutes, `context.md` costs) | Split criterion from the previous batch |
|---|---|---|---|
| `B7h.1` | 2.7 | probe 1, `check:db` 10, `check` 9, after approve `db:push` 1, `e2e` 3 = 24 | first batch (owner R3) |
| `B7h.2` | 2.12 | `check` 9 (prettier and the hook selftest) = 9 | owner R4: W5 is its own batch |
| `B7h.3` | 2.8.3-2.8.5, the lists file row of 2.8.7, the foreign add, the port, the fake, contract case R, layer 3, the e2e flows | `check` 9, `check:db` 12, `build:test` + `check:built` 2, goldens compare of the lists import states and re-seed 4, after approve `db:push` 1, `e2e` 3 = 31 | a review that cannot be held in one pass (with B7h.1); W5 sits between them (owner R4) |
| `B7h.4` | 2.8.2 screens, 2.8.6, the route rows of 2.8.7 | `check` x2 18, `check:built` 2, `app/states` 6, `app/contracts` 8, `app/print` 4, goldens compare 13 + re-seed 6, `sweep.js 360` 8, `e2e` 3 = 68 | the schema batch rule (the migration's definer functions stop for review, the test push and `e2e` before a screen reads them) and a public-contract change (`#/h/<uuid>`) |
| `B7h.5` | 2.1-2.5, 2.9, 2.10, C8 | `check` x2 18, `check:built` 2, `app/states` 8 (with the timed case), `app/contracts` 8, goldens compare 13 + re-seed 6, `sweep.js 360` 8 = 63 | a different route and filter set (`#/homebrew/*` and its editor, after `#/h/`, lists and `#/s/`) and a public-contract change (the tab routes) |
| `B7h.6` | 2.6, 2.11 | `check` x2 18, `check:built` 2, `app/states` 6, `app/contracts` 8, goldens compare 13 + re-seed 4, `sweep.js 360` 8 = 59 | a different route and filter set (`#/search`, `#/tables`) and a public-contract change (the meaning of `src` on `#/tables/homebrew`) |

Total: about 254 minutes of gates (about 4 hours 15 minutes) plus a
10-minute closeout, the plan review and the batch reviews. The fallback
fold of 2.4 adds one `app/states` run (about 6).

### 4.2 `B7h.2` - W5 (outline)

- Files: `.claude/prompts/orchestrate.prompt.md`, `plan.prompt.md`,
  `review.prompt.md`, `.claude/skills/handoff/SKILL.md`, `.claude/README.md`
  ("Owner insights"), one decision file "Owner rules are written to their
  homes in the batch that hears them" (rejected: a separate insights file -
  a swamp nobody reads at dispatch; `CLAUDE.md` for every rule - its
  200-line budget).
- Acceptance: each of the four role files names the step in one to three
  lines; the README section holds the homes table and the budgets; the
  handoff skill's closeout checks that every owner rule in the task's
  `context.md` "Decisions already settled" is in its home; this release's
  own rules (rule 15(c)'s principle, the counter rule, the lifecycle law,
  the change-log retention) are listed as the first entries to check.
- Standing checks: not applicable - no screen, no write path, no stored
  shape.

### 4.3 `B7h.3` - W1 schema (outline)

- Files: `supabase/migrations/<ts>_homebrew_links.sql` and its reversal;
  `tests/db/homebrew-links.test.mjs` (new); edits of `homebrew.test.mjs`,
  `homebrew-cards.test.mjs`, `lists.test.mjs`, `list-writes.test.mjs`,
  `import-lists.test.mjs`, `list-shares.test.mjs`, `lifecycle.test.mjs`,
  `harness.test.mjs`, `usage.test.mjs` (snapshot rows gone),
  `restore-prod.test.mjs` (if it seeds snapshots), `realtime.test.mjs`
  (sends `snapshot: null`), `limits.test.mjs` and
  `restore-drill.test.mjs` (pin `snapshot_bytes_per_list=1048576`);
  `tests/e2e/admin.mjs` (selects `list_entries.snapshot`),
  `tests/e2e/flows.mjs` F15 and F17 (assert the column; F17 imports
  `example-v2.json` with a frozen copy, which now becomes an own item),
  `tests/e2e/contract.mjs` (sends `snapshot: null`);
  `app/src/ports/types.ts` (`HomebrewRead`, `HomebrewItemRead`,
  `NoticeRow`, the entry's `hb_item`), `supabase.ts`, `fake-cloud.ts`,
  `fake-cloud.test.ts` (vitest fixtures for links and notices; the seed
  `fake-cloud-seed.ts` is unchanged here, B7h.4 changes it with its
  goldens), `cloud.contract.ts` (case R), `lib/cloudLists.ts`
  (`entrySource`: the foreign add writes a link; the frozen path goes),
  `lib/bundle.ts` (the lists file export from live items and the import's
  held split with 2.8.7's distinct-snapshot rule), `lib/homebrew.ts`
  (`snapshotValid` kept for files only), `lib/dict.ts` (`importFrozenN`
  RU and EN as in 4.4; `limitSnapshots` removed in both languages), the
  import panel's tests and goldens that draw `importFrozenN`,
  `docs/specs/META.md` section 3 (the sentence "An own item opens for its
  author alone" is replaced: any item opens by its id), `CONTRACTS.md`
  "Lists file", `llms.txt`, `COVERAGE.md`, `.claude/README.md` ("To undo
  `<ts>_homebrew_links`": the down migration first, then `restore:prod` of
  the pre-release backup, because the reversal rebuilds snapshots from
  live items and a pre-release dump does not load into the new schema),
  three decision files (2.8.7) and the pointers.
- Pre-flight before the release push (plan-B7h.1-10): the owner dispatches
  `backup.yml` (`gh workflow run backup.yml --ref main`); an agent runs
  `npm run restore:drill` on that backup, applies the B7h.3 migration to
  the drilled database, and records in the handoff a read-only count of
  the conversion branches (references, own key, one holder, none, several
  holders, distinct-snapshot variants, copies per account, accounts that
  end above a limit). A branch count the owner did not expect stops the
  release push.
- Step 1: `git grep -n -E "randomUUID|newId" -- app/src` - every item
  create path makes the id with `crypto.randomUUID()`; else fix it here.
- Contract case R (fake by vitest, real by `npm run e2e`): the member makes
  an item; signed out, `get_homebrew_item` reads it with `mine` false; the
  doomed user adds it to a list (a link); the member edits it - the
  doomed user's list holds one `changed` notice; edits it again - still
  one; deletes it - the entry is gone and the notice is `deleted` with
  the name; `get_homebrew_items` of an unknown id answers nothing for it.
- Layer 3: every row of 2.8.3 and each branch of 2.8.5 (reference, own
  key, one holder, two holders, none, a copy over the limit, cards held
  and not held, two lists of one owner with one key and the same snapshot
  - one copy; with two different snapshots - two copies, the second under
  a new key, each entry linking its own; a card variant under a new key
  with the variant item's `set` rewritten); the reversal rebuilds
  snapshots; RLS on `list_notices` (owner select and delete; no update);
  `mark_list_notices_read` sets `now()` on unread rows only and refuses
  another owner; a read sends no message; the notice retention (a notice
  read 61 minutes ago deleted, 59 minutes ago kept; unread 31 days after
  `created_at` deleted, 29 days kept); the notice upsert and broadcast
  count per transaction; `anon` executes exactly four functions and
  `get_homebrew_items` is not among them; the answer of
  `get_homebrew_item` holds no `owner_id`, `book_id` or `created_at`;
  `related` returns every relation of an author above the item limit (up
  to 1000); the touch triggers at 300 linking lists finish under 1 s on
  the local stack (measured, recorded).
- Acceptance lines: each row of 2.8.3; each branch of 2.8.5; the lists
  file export and import of 2.8.7, at and one past the item limit; the
  foreign add writes a link; case R over the fake and the test project;
  `npm run e2e` green with F15 and F17 updated; the pre-flight counts in
  the handoff; the "To undo" note; the three decisions, the B7h.3 one
  naming the rule 3 exposure as Q1 settles it; the request lifecycle as Q2
  settles it (8.1); standing checks: scale (the 300-list touch, the import
  at the limit), error scenarios (5.1 rows "migration", "revert", "lists
  file import"), consistency (the import panel's line), RU/EN
  (`importFrozenN` in both languages).
- Dispatch condition: the owner has answered Q1 and Q2 (8.1).

### 4.4 `B7h.4` - W1 screens and routes (outline)

- `#/h/<uuid>` (m03): the record page's shape; «Загружаем...» while it
  reads; the full `RecordCard` with the relation lines from `related`;
  the pick row «Добавить в список» and «Сохранить себе» for a reader;
  «Добавить в список», «Печать» and «Изменить» for the author (`mine`), as
  on `#/i/<key>`. No «Печать» for another account's item until R9's print
  routes (D70; plan-B7h.1-14); m03 shows it. Not found: «Предмет не
  найден». A re-read when the tab is shown again (no realtime topic: a
  named difference from `#/s/`).
- Every homebrew relation link, row link, «Отправить» and copied address
  is `#/h/<hid>` (`recordHash` gains the homebrew case).
- The foreign add and the lists file are B7h.3's (server contract); this
  batch draws them.
- The fake seed (`fake-cloud-seed.ts`): gm2's list links gm1's bedroll; one
  notice of each kind on it; the goldens re-seed with it.
- A key collision unit case: a reader who holds the author's keys sees the
  author's relation lines on `#/h/` (2.8.2).
- «Сохранить себе» on `#/h/`, on a `#/s/` row, and on a linked row of the
  reader's own list (the row is relinked to the copy); `copyRows` in
  `lib/homebrew.ts` (R9 3.6's rule) and one `import_homebrew` call.
- The change-log view (2.8.6) in `RequestsPanel.svelte` (renamed in place,
  one component) and the lists index line.
- `importFrozenN` (written in B7h.3) reads «Своих предметов, которых нет
  в аккаунте: %n - они станут вашими копиями в «Мои предметы».» / "Own
  items your account does not hold: %n - they become your copies in My
  items.".
- Texts that become false after W1 (plan-B7h.1-13): `hbImportUpdateNote`
  becomes «Текст и характеристики существующих предметов и карт (%n)
  заменятся данными из файла, названия источников тоже. Списки, где есть
  эти предметы, - ваши и других игроков, - покажут новую версию.» / "The
  text and stats of the items and cards you hold (%n) are replaced from
  the file, and so are the source names. Lists that hold these items,
  yours and other players', show the new version."; every item delete
  confirm (`hbDeleteItem`, `hbDeleteItemInLists`, `hbDeleteMany`,
  `hbDeleteItemRel`, `hbDeleteItemInListsRel`) gains the sentence of the
  new key `hbDeleteOthers`: «Если предмет есть в списках других игроков,
  строка пропадёт и там - с количеством, ценой и заметками; владельцы
  списков увидят, что он удалён.» / "If the item is in other players'
  lists, its row leaves them too, with its quantity, price and notes; the
  list owners see that it was deleted." (no count; the count stays
  Deferred).
- Privacy pages: items are readable by anyone who has the address, and one
  item's address also opens the items it relates to; D71 deleted. `DEBT.md` "Item links" section: Owns text narrows to print
  routes; D70 stays (R9).
- `FEATURES.md` ("Records", "Homebrew", "Account and browser lists"),
  `ROUTES.md`, `CONTRACTS.md`, `STATE.md` (the open item in memory),
  `llms.txt`, fixtures, `tests/contracts.js`, `tests/e2e/flows.mjs` (open an
  item signed out, add it, edit it, read the notice, delete it).
- Strings (new): `itemFrom` «Предмет другого игрока» / "Another player's
  item"; `saveItem` «Сохранить себе» / "Save to my items"; `saveItemNote`
  «Копия попадёт в «Хоумбрю» и больше не будет меняться вместе с
  оригиналом.» / "The copy goes to Homebrew and no longer changes with the
  original."; `saveItemSaved` «Предмет «%s» сохранён в «Мои предметы»» /
  "Item "%s" saved to My items"; `inboxHead` «Новое в списке (%n)» / "New
  in this list (%n)"; `noticeChanged` «Автор изменил «%s».» / "The author
  changed "%s"."; `noticeDeleted` «Автор удалил «%s» - строка убрана из
  списка.» / "The author deleted "%s" - the row was removed from the
  list."; `noticeOpen` «Открыть» / "Open"; `noticesHide` «Скрыть изменения»
  / "Hide changes"; `noticesN` «%n изменение|%n изменения|%n изменений» /
  "%n change|%n changes"; `itemFailed` «Предмет не загрузился» / "The
  item did not load"; `saveItemFailed` «Не получилось сохранить предмет
  себе. Проверьте соединение и попробуйте ещё раз.» / "Could not save the
  item to your items. Check the connection and try again.";
  `hbDeleteOthers`, `hbImportUpdateNote` (above). Reused: `requestsHide`
  («Скрыть»), `nothing`, `retry`, the record page's not-found keys, the
  limit texts. Removed in B7h.3: `limitSnapshots`.
- Acceptance lines: the owner's acceptance (a reader sees the same
  relations, every relation link opens) as a golden pair `#/h/<gm1 bedroll
  hid> as gm1` and `as gm2` drawing the same three relation lines, and a
  `tests/app/contracts.js` probe that follows every relation link on the
  reader's page and gets a drawn record; each string above in both
  languages; each state of the States table (5.2) and each scenario of
  5.1 that the batch adds, the two rows placed from plan-B7h.1-26
  included; the key collision case; no «Печать» on another account's
  item; the request view as Q2 settles it (8.1); D71 deleted.

### 4.5 `B7h.5` - the tabs, the import names, the page fixes (outline)

- Files: `HomebrewPage.svelte` (the head, the tab row, the Items tab),
  new `HomebrewSourcesTab.svelte`, `HomebrewCardsTab.svelte` (one component
  for Sets and Rules, `kind` prop; replaces `HomebrewCards.svelte`, whose
  fold goes) built from `HomebrewSources.svelte` and `CardForm.svelte`;
  `HomebrewImport.svelte` and `lib/homebrewFile.ts` (W4);
  `HomebrewEditor.svelte` (2.1); `lib/hash.ts` (the tab routes);
  `lib/homebrew.ts` (`matchRecords`); `lib/dict.ts`; `RecordCard.svelte`
  (the author's set and rule links); `ports/fake-cloud.ts` (the 300-item
  option); tests and goldens; `FEATURES.md` ("Homebrew", "Consistency
  rules" 1 and 15), `ROUTES.md`, `CONTRACTS.md`, `llms.txt`, fixtures,
  `tests/contracts.js`, `COVERAGE.md`, `DEBT.md` (the D84 line); decision
  files "A field's help explains the site, never a game term" and "«Мои
  предметы» holds four tabs: items, sources, sets and rule cards".
- Strings (new): `hbTabItems` «Предметы» / "Items"; `hbTabSources`
  «Источники» / "Sources"; `hbTabSets` «Комплекты» / "Sets"; `hbTabRules`
  «Карты правил» / "Rule cards"; `hbFindOwn` «Найти предмет» / "Find an
  item"; `hbFindSets` «Найти комплект» / "Find a set"; `hbFindRules` «Найти
  карту» / "Find a card"; `hbNewSet` «Новый комплект» / "New set";
  `hbNewRule` «Новая карта правил» / "New rule card"; `hbAddMember`
  «Добавить предмет» / "Add an item"; `hbRemoveMember` «Убрать» /
  "Remove"; `hbMemberMoves` «Предмет уйдёт из комплекта «%s».» / "The
  item leaves the set "%s"."; `hbRefsFull` «У предмета уже три карты
  правил.» / "The item already has three rule cards."; `hbImportHeldKeep`
  «Уже есть - останутся как есть: %s.» / "Already held - they stay as they
  are: %s."; `hbImportHeldReplace` «Уже есть - заменятся из файла: %s.» /
  "Already held - replaced from the file: %s."; `hbImportSameNamed`
  «Новые с тем же названием, что у ваших: %s.» / "New, with the same name
  as yours: %s.". Removed: `hbTierHelp`, `hbDmgHelp`, `hbImportHeld`,
  `hbImportSameNames`.
- Acceptance lines: C1 (2.1), C2 (2.2 on the Items tab), C3 (2.3 on every
  tab), C4 (2.4), C5 (2.5 on the Sets and Rules tabs; the D84 line
  deleted), C7 (each build measured, each passed budget stepped to the
  measured size plus about 5 kB), C8 (2.1); each tab and its route; a
  member added and removed on the Sets and the Rules tab; the author's set
  and rule links; W4's lines at 0, 10 and 11 names, both verbs; each state
  of 5.2 for these pages.

### 4.6 `B7h.6` - the switch and the source chips (outline)

- Files: new `components/Switch.svelte` and its test; `SearchPage.svelte`;
  `TablesPage.svelte` (the switch, the source chips, the facet rules);
  `lib/facets.ts` (no `src` row on `homebrew`, `sect` of the chosen source);
  `lib/filters.ts` or `lib/hash.ts` (one `src` value on `homebrew`);
  `HomebrewSourcesTab.svelte` (the chip link); tests and goldens;
  `FEATURES.md` ("The «Свои предметы» switch", "Tables and search"),
  `STATE.md` (the switch's name), `ROUTES.md`, `CONTRACTS.md`, `llms.txt`,
  the fixture and its contracts case; decision files "The own-items filter
  is a labelled switch" and "A source chip on `#/tables/homebrew` is the
  `src` filter with one value".
- Strings: `ownSwitch` «Свои предметы» / "My items"; removed `hbChipHint`.
  The chip labels are the source names (no new key).
- Acceptance lines: C6 (2.6); 2.11's chip row at 1, 2 and 21 sources (20
  named plus «Хоумбрю»: the limit plus the default), the bare address, a
  multi-value address, an anchor, a chip switch dropping a foreign `sect`;
  the Sources tab's chip link; the fixture case.

## 5. Standing checks for the release

Each batch answers them again with its own proofs; this section holds the
design-level answers the plan review reads.

### 5.1 Error scenarios

| Scenario | Screen | Stored data and recovery |
|---|---|---|
| Migration B7h.3 meets a frozen copy it cannot place | none: the migration rolls back and `db:push` fails | nothing changed; the planner revisits 2.8.5 |
| `#/h/` first read fails or offline | «Предмет не загрузился» and «Повторить» | nothing stored |
| `#/h/` of a deleted item | «Предмет не найден» | none |
| The author deletes an item while a reader's list links it | the row goes; the panel says «Автор удалил «%s»...» | the entry is deleted by the cascade with its quantity, price and both notes (lost; the author's confirm says so, `hbDeleteOthers`); the notice keeps the name until 1 hour after it is read, or 30 days after it was created if nobody reads it |
| «Добавить в список» of an item the author deleted meanwhile (B7h.4) | the buffer's refusal text (FK `23503`) and «Не сохранено», as a missing record today | nothing written; the add leaves the buffer |
| The reader's buffered edit of a row the cascade removed (B7h.4) | the edit is dropped (today's rule for a deleted entry); the list re-reads | none; the notice says what was lost |
| The author edits while the reader's list page is open | the list re-reads on the `notice` message; the panel gains the row | none |
| «Добавить в список» of a foreign item fails | today's buffer failures and «Не сохранено» | the link waits in the buffer |
| «Сохранить себе»: network, lost answer | «Не получилось сохранить предмет себе...»; a retry sends the same ids and keys | a held key is skipped; nothing twice |
| «Сохранить себе» at the item or card limit | the limit text | nothing written (one transaction) |
| The relink after a copy fails | «Не сохранено» on the list | the copy exists; the row stays a link until the buffer lands |
| Conflict: another device hid a notice | the next read drops it | none |
| Lists file import: the copies call succeeds, the lists call fails | the import's failure line | the copies exist; a retry skips held keys and links them |
| Lists file import past the item or card limit, or past 1000 rows (B7h.3) | the import refused whole with the limit text | nothing written |
| One owner held two different snapshots of one key (B7h.3 migration, lists file import) | two own items, the second under a new key | each entry links the copy of its own snapshot; nothing lost |
| Stale tab (previous bundle) after B7h.3 | its write buffer sends `snapshot`: refused, «Не сохранено» until a reload; a link to another account's item draws as a missing record | nothing lost; a reload loads the new bundle |
| Revert: previous frontend over the B7h.3 schema | as the stale tab | entries, items and notices kept |
| Revert: B7h.3 down migration | frozen copies are back for foreign links | snapshots rebuilt from live items; notices dropped (a plan-review trigger; transient data) |
| The hourly clean-up stops | nothing on screen | rows wait; the usage report warns after 2 hours |
| A tab switch to a chip whose source was deleted on another device | the first chip | none |

### 5.2 Scale (States, per batch; proofs named in the batch)

| State | Batch | Proof |
|---|---|---|
| `#/h/` signed out, as a reader, as the author, loading, not found, failed | B7h.4 | goldens and unit tests |
| `#/h/` with 0 related, 3 related, 300 related (3x items in one set) | B7h.4 | unit; the relation line folds after three own names («и ещё N») |
| A list with 0, 1 and 200 linked foreign items (`entries_per_list` limit) | B7h.4 | unit; one `get_homebrew_items` call per list read |
| The panel with 0, 1, 10 requests and 0, 1, 200 notices; one past (none: notices have no limit beyond one per entry) | B7h.4 | unit; the panel folds after three, as requests do |
| The Items tab at 0, 1, 7, 8, 34, 100, 300 items | B7h.5 | goldens, unit, the timed case |
| Sources at 0, 1, 20 (the limit), 21 refused, 60 (3x) | B7h.5 | unit; golden at gm1 |
| Sets and Rules at 0, 1, 8, 100, 300 cards; a set with 300 members | B7h.5 | unit (timed under 100 ms in jsdom at 300) |
| The import preview at 0, 10, 11 and 300 names | B7h.5 | unit |
| A lists file import whose copies reach the item limit, and one past it (refused) | B7h.3 | layer 3 and unit |
| `#/tables/homebrew` with 1, 2 and 21 sources | B7h.6 | goldens (gm1, gm3), unit |
| The longest name (120 code points) on `#/h/`, a tab row, a notice, a chip | B7h.4-6 | `sweep.js 360` |
| Every new page at 360 px and 1180 px | B7h.4-6 | `sweep.js 360`, goldens at 1180 |

At many: the primary action of each tab stays before its rows; the panel
stays about one screen at 360 px (three requests, three notices, then the
fold buttons); no sticky region grows; the tab row wraps to two lines at
360 px.

### 5.3 Consistency

Rules of `FEATURES.md` "Consistency rules" followed: 1 (as amended: a
counter heads its collection on every tab), 2 (failure texts), 4 (one name
per thing: «Сохранить себе» for the item copy and the list copy is the
departure the owner accepted in R9; «Импорт из файла» on both pages), 5
(toasts), 6 (`LoadState` on `#/h/`), 10 (no undo for a hidden notice, as a
hidden decided request), 11 (an open card form stays under a query), 12
(«и ещё N»), 15 (as amended), 16 (long names wrap). Named departures: `#/h/`
re-reads on the shown-again signal only (no live topic, unlike `#/s/`);
the change-log panel heading «Новое в списке» replaces «Запросы» (one view
for two kinds, owner W1-e).

### 5.4 RU/EN parity

Every string of 4.4, 4.5 and 4.6 has both languages, the same facts and
both plural sets (`noticesN`); ASCII punctuation; «ёлочки» in RU and
straight quotes in EN; removed keys leave both languages.

## 6. Effect on R9 and R8

- R9 (`persist-9-item-share`): superseded in part. W1 builds the item
  address (`#/h/<uuid>` instead of a share token), the add, «Сохранить
  себе» and D71; `homebrew_shares`, its three functions, contract case P
  and the share panel are not built. Still owed at R9's refresh: the print
  routes (D70: `#/print/h/<uuid>` and `#/print/s/<token>/<ids>`), D65, the
  `#/s/` loading state. A note sits in R9's Status.
- R8 (`persist-8-media`): no snapshots exist after B7h.3, so the
  `homebrew_snapshot_valid` part of 3.1, the frozen-copy art of 3.5 and
  Q8-5 change; `img` reaches readers through `get_homebrew_item(s)` and
  `get_shared_list`; «Сохранить себе» is R7h's (Q8-6 applies to it). A note
  sits in R8's Status.

## 7. Mocks (`mocks/`)

| Mock | Screen | What it settles |
|---|---|---|
| m01 | `#/search` switch, `#/tables/eq_weapon`, the rows' head | 2.6, the order search box, counter, strip |
| m02 | «Мои предметы»: the tab row, Items, Sources, Sets (members), Rules; 360 px | 2.9 placement and each tab's head |
| m03 | `#/h/<uuid>` as the author and as a reader (same relations); the list panel «Новое в списке» with a request and two notices | 2.8.2, 2.8.6, the acceptance line |
| m04 | the import preview with names, both verbs, «и ещё N» | 2.10 |
| m05 | `#/tables/homebrew` with three source chips, the filter panel without `src` | 2.11 |

Open `mocks/index.html` in the Browser pane.

## 8. Decided here (recorded; no owner question)

Each with the recommendation and the trade-off accepted. The owner may
reverse any of them at the plan review.

| # | Fork | Decision | Trade-off accepted |
|---|---|---|---|
| P1 | The item's public id | `homebrew_items.id` (uuid) at `#/h/<uuid>`; keys stay per owner | a long address (36 characters); two addresses for an own item (`#/i/hb_...` kept) |
| P2 | How a list names another account's item | `list_entries.hb_item` (FK, cascade) | one more column; `item_key` is derived by a trigger |
| P3 | A frozen copy with no single holder | a fixed copy in «Хоумбрю», no source | the source tag of such a copy changes to «Хоумбрю» |
| P4 | Fixed copies past the item limit | allowed in the migration only | an account may sit above its limit until it deletes items |
| P5 | Change-log retention | owner, 2026-10-06: 1 hour after read, or 30 days after creation if unread; one row per item | an unread notice older than a month is lost |
| P6 | Which writes notify | every write that bumps a linking list (item, its source, its cards) | a source rename notifies too |
| P7 | The clean-up mechanism | `pg_cron`, hourly | one extension on both projects |
| P8 | The tabs' place | inside «Мои предметы» (owner's preference) | a tab row on the page |
| P9 | `homebrew_cards` schema | unchanged; members stay on the item | the Sets tab writes items, not cards |
| P10 | The chip's address | the `src` filter with one value | `src` on this table means one source |
| P11 | The equipment tables' `src` | unchanged | none |
| P12 | Subset downloads (per source, ticked items) | kept | they are not per-tab exports, so no feature is dropped |
| P13 | `#/h/` live updates | re-read when the tab is shown again; no topic | a reader sees an edit after a tab switch or a reload |

### 8.1 Open owner questions

**Q1 (plan-B7h.1-9) - conversion rule 3 links an importer's item.** When
a frozen copy's author has deleted the item and exactly one other account
holds the same key (it imported the author's file), rule 3 links the list
owner's row to that importer's item. The importer never shared it: its
item id and, through `related`, its connected items reach the list owner,
and the importer's later edits and delete change that list. Needed before
`B7h.3` is dispatched; `B7h.1` and `B7h.2` do not depend on it.

- **A (recommended): keep rule 3.** The common case - the author still
  holds the item and nobody imported it - links the original, which is
  your goal in W1-d; the exposed content is a copy the list owner already
  saw. Trade-off: in the rare import case a stranger's later edits reach
  the list.
- B: link only when exactly one account holds the key and that account
  made the list's share link the copy came from. A snapshot does not
  record its source account, so B cannot be checked for most rows and
  falls back to a fixed copy. Trade-off: many entries whose author still
  holds the item become fixed copies instead of live links.
- C: never relink to another account; every frozen copy whose key the list
  owner does not hold becomes a fixed copy. Trade-off: W1-d ("an entry
  whose original item still exists becomes a live link") is not met for
  any foreign copy.

**Q2 (owner input 2026-10-06) - do purchase requests also expire after
they are read?** Today a request can be accepted for 1 hour after it is
created (`expires_at`), read or not; the panel then hides it by the clock,
so a request the GM never saw disappears silently; the row is deleted 24
hours after its expiry or decision. W1-e puts requests and change-log
entries in one view, and change-log entries now expire 1 hour after they
are read, or 30 days after creation. Moving requests fully to that rule
changes what a request means: a GM could accept a request days later,
after the player has left the shop, and 10 unread requests (the
`pending_requests_per_list` limit) would block new sends for up to 30
days. Needed before `B7h.3` (a `read_at` column on `purchase_requests`)
and `B7h.4` (the view); `B7h.1` moves today's retention unchanged.

- **A (recommended): the decision window stays 1 hour from creation; the
  visibility follows the log.** A request can be accepted or declined only
  in its first hour, as today. An expired request the GM has not seen stays
  in «Новое в списке» as «Истёк без ответа» until it is read, then expires
  1 hour after it is read, or 30 days after creation if nobody reads it;
  a decided request expires 1 hour after its decision. Nothing disappears
  unseen, and a stale request is never applied. Trade-off: an expired row
  for each unseen request, at most 10 live ones per list plus the expired
  ones, until read.
- B: requests take the log's rule whole: «Принять» works until 1 hour
  after the GM reads the request, or 30 days after creation. Trade-off: a
  GM may apply a request days after the player asked; stale stock changes;
  unread requests fill the 10-request limit and block new sends.
- C: no change: 1 hour from creation, hidden when expired, deleted 24 hours
  later. Trade-off: a request the GM never saw disappears silently (the
  owner's concern).

## 9. Risks, assumptions, deferred

- Risk: a popular item linked from many lists makes each edit update every
  linking list and upsert a notice per list; bounded by the user base, and
  B7h.3 measures 300 linking lists on the local stack.
- Risk: the conversion picks a holder by key; when the original author
  deleted the item and one other account imported the same file, the entry
  links that account's item: the importer's item id and its related items
  reach the list owner, and the importer's edits and delete change the
  list (2.8.5 rule 3; owner question Q1, 8.1).
- Assumption: `pg_cron` can be created by `postgres` on the hosted projects
  (B7h.1's test push proves it before production).
- Deferred (to the owner, not `DEBT.md`): telling the author how many other
  players' lists link an item before a delete (a definer count; privacy to
  weigh); live updates on `#/h/` through a topic.

## 10. Owner answers (2026-10-03, W6 2026-10-05; section 7.4 of the earlier plan) - settled, kept verbatim

Routing:
- R1 (R9 and R8): the rework ships before R9. R9 is not cancelled: its plan
  stays as input, and a plan refresh at R9's dispatch decides what is still
  needed. R8 is refreshed against the rework too.
- R2: yes - the «Карты» search and the counter move onto the new pages; the
  switch, the help removal and C8 stay as designed.
- R3: W2 (scheduled clean-up) is in R7h's first batch.
- R4: W5 (owner insights) stays inside R7h as its own batch.

W1 sharing model:
- W1-a: anyone with an item's id may open it (signed out too), like a
  catalog record; ids are random, so items are unlisted, not secret.
- W1-b: «Добавить в список» adds a live link; «Сохранить себе» makes the
  reader's own fixed copy.
- W1-c: when the author deletes a linked item, the row disappears from the
  other lists and a change-log entry says what was lost.
- W1-d: migration of stored snapshots: an entry whose original item still
  exists becomes a live link; the rest become fixed copies (own items of the
  list owner). Visible content can change for re-linked entries (accepted).
- W1-e: the change log lives on the list like purchase requests - one
  mechanism and one view shared with requests; an entry is dropped soon after
  it is read (3 days after read, or faster; the planner proposes the figure).
- Acceptance line: a reader opening an item by its link sees the same
  relations as the author (without edit controls), and every relation link
  opens (screenshot 02 dropped «Получается из» and the set members).

W2 clean-up:
- The mechanism (pg_cron in SQL, a scheduled Edge Function, or the nightly
  workflow) is the planner's choice with a recommendation.
- Yes to a standing law: lifecycle data is cleaned on the backend, never by
  the frontend - a decision file plus a one-time audit of frontend-owned
  lifecycle logic, each finding placed in a batch or `DEBT.md`.

W3 pages and files:
- The planner decides where the Items, Sources, Sets and Rules pages live;
  the owner prefers tabs inside «Мои предметы».
- One import and one export (the account export); no per-tab export.

W4 import preview: names of held items (items, cards, sources) with what
happens to each (skip or replace), first 10 then «и ещё N» (rule 12); the
same for same-name new items.

W5 owner insights: a reusable rule the owner states is written into its
existing home (`FEATURES.md` rules, `DESIGN.md` for mocks,
`.claude/README.md`, `docs/decisions/`, a prompt) under documented limits:
only what changes later work, with a size budget per home, so the files do
not become a swamp. The closeout audit checks it was written.

Schema freedom (owner, 2026-10-03): the rework may redesign the homebrew
schema where the new pages and the sharing model need it - in particular
`homebrew_cards` (sets and rule cards), so that a set or rule card can be
edited, listed and shown on its own page (members added and removed there,
links from items). Public contracts and stored data still change only with
a migration path, fixtures and a plan review; the planner names each schema
change and its reversal.
The same freedom covers other persistence schemas the rework touches
(owner, 2026-10-03): for example `homebrew_items` and `homebrew_books`,
`list_entries` (snapshot removal, live links, the deleted-item path),
`purchase_requests` and their lines (one mechanism and view with the change
log), and any new table for the change log or the clean-up. Each change
follows the same rules: a migration path for stored rows, a reversal,
fixtures, and the plan review.

W6 (owner, 2026-10-05): `#/tables/homebrew` with more than one source gets
one chip per source (like the catalog's table group chips); inside a chip
the rows are grouped by that source's sections only. Today every row sits
under one long list of «<source> · <section>» headings. With one source the
page stays as it is. The planner decides how the chip relates to the
existing `src` and `sect` facets and to the anchors (`#/tables/homebrew`
anchors are source and section keys today, a public route grammar in
`ROUTES.md`), and whether the Sources page of W3 links to a chip.
W6 also reconsiders the filters of `#/tables/homebrew` after the chip
change (owner, 2026-10-05): which facets stay once a chip picks the source
(`src` may become redundant; `sect` may narrow to the chip's sections;
`kind` stays), how the filter panel, its pills and the copy-link address
behave when a chip is switched, and whether the equipment tables' `src`
facet for own sources changes in step. Filter state is in the address
(`STATE.md`, `ROUTES.md`): a change is a route-grammar change with fixtures.

Change-log expiry (owner, 2026-10-06, in chat): "re expiration we might
need to ensure we expire 1 hour AFTER it was read because otherwise it
will silently disappear", and the follow-up "or have some workaround maybe
in a month since created". Read together: a change-log entry expires 1
hour after it is read, or 30 days after it was created if nobody reads it,
whichever comes first. Whether purchase requests follow is question Q2
(8.1).
