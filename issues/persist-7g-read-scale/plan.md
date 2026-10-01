# Plan - TASK persist-7g-read-scale (release R7g)

## Status

- Task status: planned (2026-10-01). One batch, `B7g.1`, implement-ready.
- NEEDS_HUMAN_CONFIRMATION: no. The owner answered on 2026-10-01 (section
  7): Q1 = C, a per-list frozen-copy byte limit of 1048576 bytes (1 MiB) as
  an overridable `limit_defaults` row; Q2 = drop F6.
- Plan review: required before B7g.1 (trigger: a migration - a new function
  overload that `anon` executes, a SECURITY DEFINER trigger function and a
  new limit that refuses writes; a sync protocol change - the
  revision-keyed account re-read and the shared page's `p_since`)
- Plan review findings applied: reviews/plan-B7g.1.md
  - B1, section 4.4 and steps 5, 8: the UPDATE branch checks the lists of
    rows with no unchanged old twin (`not exists` over `old_rows` on id,
    list and snapshot); tests for a new `id` with a big snapshot (refused)
    and a reorder and a note edit on an over-limit list (taken).
  - B2, Files, steps 8, 9, 10: `restore-drill.test.mjs` seeded keys gain
    `snapshot_bytes_per_list=1048576`; `.claude/README.md` "Restore
    production (owner)" step 4 names the row; "seven defaults" becomes
    eight in `limits.test.mjs` and `COVERAGE.md`.
  - B3, "Verification commands", step 12, handoff: `check`, `check:built`,
    `app/states`, `check:db` last; after the review `db:push` then `e2e`.
  - R1, steps 5, 8: the trigger function's `set search_path = public,
    pg_temp`, and its pin in `homebrew.test.mjs`.
  - R2, step 5: the fake checks the entry count before the byte sum.
  - R3, section 4.3 and D2: the accepted trade-off of a projection changed
    by a migration with no revision bump.
  - R4, step 8: the exact-sum case uses valid copies (at most 100 entries)
    whose sizes sum to 1048576, with no embedded cards.
  - N1, step 11 and section 10: D74 is the next free D number at dispatch.
  - N2, States table: about 27 characters longer.
  - N3, section 4.4, steps 5, 8: `Math.ceil(value / 1024)`; 500 reads 1.
  - N4, Files and step 8: the e2e contract comment says three functions.
  - N5, handoff: the "Review:" line names the report path.
  - N6, section 10 and the handoff's "Deferred": the older-read guard.
- Release order (owner, 2026-10-01): R7c, R7e, R7f, R7g, R7d. R7g starts
  after R7f's closeout; the dispatch refresh re-reads section 8.
- Batches:

| Batch | Goal | Status |
|---|---|---|
| `B7g.1` | F1 revision-keyed re-read, ordered reads and paged requests; F2 `p_since`; the per-list byte limit of 1048576 bytes | planned; waits for the plan review |

## 1. Objective

Make the account read and the shared page's read cost what changed, not
the whole account, at up to three times the default limits (owner,
2026-10-01): a re-read of the account fetches only the lists whose revision
moved; the owner's pending requests are read whole past PostgREST's
1000-row cap; a shared page's re-read of an unchanged list downloads one
small answer. A per-list byte limit of 1048576 bytes (owner, Q1 = C)
bounds the frozen copies one list (and so one shared page) can carry.

## 2. Sizing at the design target (3x defaults)

Target (owner): 150 lists, 300 entries per list, 30 pending requests per
list, 60 sources, 300 items, 300 cards, a frozen copy up to 131072 bytes.
Every figure is an estimate (est) from the code and the migrations; an
entry row is about 250-350 bytes of JSON without a snapshot, a real frozen
copy about 2-6 KB, a maximal own item with its cards about 81 KB.

| Read or write | Defaults today | 3x target today | After B7g.1 |
|---|---|---|---|
| Account read, first load | 5000 entries, about 1.8 MB catalog-only | 45000 entries, about 11-16 MB catalog-only; frozen copies add 2-6 KB each | unchanged (one read per page load; accepted, section 4.1) |
| Account re-read (45 s poll while the topic is down, 300 s safety, every other-tab edit) | the whole account each time | the whole account each time | `id,revision` of 150 lists (about 9 KB) plus the full rows of the changed lists (one list of 300 entries about 105 KB) |
| Lists read past 1000 rows | not reachable (50) | not reachable (150) | an `.order()` makes any cut deterministic (newest first) |
| Pending requests read | at most 500 | up to 4500: an arbitrary 1000 kept today | paged by id, 1000 per page, every request read |
| Homebrew reads (sources, items, cards) | 20 / 100 / 100 | 60 / 300 / 300 | unchanged: under the cap (F11 is not placed) |
| Shared page re-read with no change (45 s poll while the topic is down, 300 s safety, shown again) | the whole projection, about 50-250 KB real, up to 12.8 MB (100 copies at the bound) | about 0.1-1 MB real, up to 38 MB (300 copies at the bound) or 24 MB (300 own references at 81 KB) | `{"unchanged":true}`, a few bytes |
| Shared page re-read after an owner commit | the whole projection | the whole projection | unchanged (DEBT D74); the frozen part of one read is at most 1 MiB |
| F6 batch delete of all rows, its undo, a price edit | 100 rows: under 20 ms main thread, 101 ops in 1 request | 300 rows: about 50-75 ms main thread on a mid phone, 301 ops in 2 requests, about 0.3-0.6 s of database work in the background | unchanged (dropped: no visible cost at the target; Q2) |
| Frozen copies one account can store | 640 MB (50 x 100 x 128 KB; above the free plan's 500 MB database) | 5.76 GB | 50 MiB at the defaults, 150 MiB at 3x (1 MiB per list) |

## 3. Scope and non-goals

In scope: F1's frequency (the revision-keyed re-read), the ordered lists
read, the paged requests read, F2 (`p_since`), and the per-list byte limit
of 1048576 bytes (Q1 = C); the specs, tests, decisions and runbook text they need.

Non-goals:
- Anything reachable only past 3x: list-page paging (F5's paging half), a
  lists read past 1000 rows (an `.order()` guard only), homebrew paging.
- The first read's size (section 4.1, accepted), the after-commit shared
  re-read (D74), lazy entries or snapshots.
- F6 (Q2), F11 homebrew read size, F13 timeout handling: not placed here.
- No change to `apply_list_writes`, the write buffer, `ListPage.svelte`,
  `CONTRACTS.md`, routes, stored keys or `localStorage`.

## 4. Design and decisions

### 4.1 The account re-read fetches only the lists whose revision moved (F1)

- `ListRepository.list(known?: Readonly<Record<string, number>>)`: `known`
  maps a list id to the revision the caller holds. `ListsRead` gains
  `kept?: readonly string[]`, the ids whose revision equals `known`; their
  rows are not sent. An id in neither `lists` nor `kept` is gone.
- The real port, `known` absent or empty: one read, as today, with
  `.order('updated_at', { ascending: false }).order('id')`.
- The real port, `known` not empty: (1) `from('lists').select('id,revision')`
  with the same order; (2) `changed` = rows whose revision differs from
  `known`, `kept` = the others; (3) none changed: answer
  `{ ok: true, lists: [], kept }`; (4) up to `CHANGED_LISTS_MAX = 50`
  changed: `select(LIST_SELECT).in('id', changed)` with the same order,
  answer those rows and `kept`; (5) more than 50 changed (an import, an own
  item held by many lists): the full read of step "absent", with no `kept`.
  Any failed step answers `{ ok: false }`. A list changed between (1) and
  (4) comes back newer, which is right; one deleted between them is absent,
  so it is gone.
- `CloudLists.#pull` passes the revisions of `#read` (none on the first
  read); `#apply(rows, kept)` reuses `#read[id]` for each kept id. A kept id
  that `#read` no longer holds (an overlapping read replaced it) drops the
  read: `#reread = true; #rereadWhenIdle()`, with no redraw.
- Why 50: `in.(...)` of 50 UUIDs is about 1.9 kB of address; 150 would be
  5.5 kB, near a common 8 kB request-line buffer (the gateway's own value is
  not verified).
- Rejected: lazy snapshots or entries for the open list only (the index's
  count and thumbs, `RequestsPanel`, the add menu's held set and
  `app.frozenCopy` need every list's keys and copies at once); a new
  `get_lists(p_known)` RPC (a migration and a new function for what two
  PostgREST reads do at 150 lists); `.range()` paging of the embedded read
  (150 lists are under the cap, and paging still sends every entry).
- Accepted trade-off: the first read of each page load still carries every
  entry (about 1.8 MB catalog-only at the defaults, 11-16 MB at 3x full, est;
  the gateway's gzip is unverified).

### 4.2 Ordered reads, and the requests read in pages by id

- `REQUEST_SELECT` read: `.eq('status', 'pending').order('id').limit(READ_PAGE)`,
  then `.gt('id', last)` for each next page, until a page holds fewer than
  `READ_PAGE = 1000` rows (`supabase/config.toml` `max_rows`). A fresh query
  builder per page: postgrest-js builders mutate on `.order()`/`.gt()`.
  `readRequests` reads the concatenated rows once. Keyset, not offset: a
  request deleted between two pages would shift an offset page and skip a
  row. `pendingFor` already sorts, so the read order is free.
- Assumption (PostgREST's `db-max-rows` documentation, not measured here):
  the cap limits the top-level rows only, so embedded rows (the request
  lines, a list's entries) are not cut, and a scalar function answer is one
  row. The plan review may ask for one local-stack check.
- Homebrew and share reads are unchanged (under the cap at 3x).

### 4.3 The shared page names its revision (F2)

- New overload `get_shared_list(p_token text, p_since bigint) returns jsonb`,
  `language plpgsql stable security invoker`: it calls
  `public.get_shared_list(p_token)` and answers
  `jsonb_build_object('unchanged', true)` when the projection is not null,
  `p_since` is not null and `(v ->> 'revision')::bigint <= p_since`; else
  the projection (null for a stopped, unknown or malformed token).
- `get_shared_list(text)` keeps its body, its grants and its callers
  (`clone_shared_list`, the usage keep-alive, a stale tab). PostgREST picks
  the overload by argument names: `{ p_token }` matches only `(text)`;
  `{ p_token, p_since }` only `(text, bigint)` (no default on either, so no
  `PGRST203` ambiguity). R7d may `create or replace get_shared_list(text)`
  with no effect on the overload.
- Security invoker: no new Security Advisor warning; `anon` gets EXECUTE.
  The database still builds the projection; the saving is the download.
- Port: `ShareRepository.read(token, since?: number)`; the call sends
  `p_since` only when `since` is given. `SharedRead` becomes
  `{ ok: true; shared: SharedRow | null; unchanged?: never } |
  { ok: true; unchanged: true; shared?: never } | { ok: false }`.
- `SharedView.refresh()` passes `this.shared?.revision` when `status` is
  `ready`; `unchanged` keeps the shown object and bumps nothing. `open()`
  and a refresh after a failed first read pass nothing.
- Rejected: a default `p_since` on the one function (drops and re-creates
  the definer function with a copied body, and a later `create or replace
  get_shared_list(text)` would make two candidates for a one-argument call);
  a security definer wrapper that reads the revision before the projection
  (one more anon-executable definer function, an Advisor warning, for
  milliseconds of database work); entries changed since a revision (no
  tombstones; a projection contract change).
- Accepted trade-off: a deploy whose migration changes the projection
  without a revision bump (a new `get_shared_list(text)` body, as R7d may
  write, or a new `homebrew_snapshot_of`) leaves an open shared page on the
  old projection: it answers `unchanged` until the list's revision moves or
  the page reloads.

### 4.4 A per-list byte limit on frozen copies (owner: Q1 = C)

- `limit_defaults` row `snapshot_bytes_per_list` = 1048576 (1 MiB), read by
  `effective_limit` (so `limits:set` overrides it per user; null is no
  limit).
- Trigger function `list_entries_snapshot_limit()` (SECURITY DEFINER,
  `set search_path = public, pg_temp`, EXECUTE revoked from public, anon,
  authenticated), statement level, after INSERT (lists whose new rows carry
  a snapshot) and after UPDATE. Transition tables do not pair rows, and a
  client may UPDATE `id` itself (full UPDATE grant), so the UPDATE branch
  checks the lists of
  `select distinct n.list_id from new_rows n where n.snapshot is not null and not exists (select 1 from old_rows o where o.id = n.id and o.list_id = n.list_id and o.snapshot = n.snapshot)`
  - a row whose id, list or snapshot changed - and never an unchanged copy
  (a reorder or a note edit of an over-limit list is taken). Per list, in
  id order: `pg_advisory_xact_lock(hashtext('entries:' || list))` (the
  entries limit's lock), the owner's limit, then
  `sum(octet_length(snapshot::text))` over the list's frozen rows; past the
  limit `raise exception 'limit: snapshot_bytes_per_list' using errcode =
  'P0001', detail = v_limit::text`. A list already past the limit keeps its
  copies and still takes catalog entries and references; only a statement
  that adds or changes a frozen copy is checked.
- Every write path goes through it: `apply_list_writes` (`add`, `create`),
  `import_lists`, `clone_shared_list`, a direct PostgREST UPDATE.
- Client: `limitText` maps the key to `t.limitSnapshots` with `%n` =
  `Math.ceil(value / 1024)` (KB). The write buffer already drops a refused
  op, toasts the limit text once per flush and re-reads.
- What still fits at 1048576 bytes (the check refuses a sum greater than
  the limit, so a sum equal to it is taken):
  - at the defaults, 100 entries of copies averaging up to about 10.4 KB:
    every real list of real copies (2-6 KB);
  - at 3x, 300 entries of copies averaging up to about 3.4 KB
    (1048576 / 300 = 3495 bytes): a list of 2 KB copies (about 600 KB)
    fits; a full list of 4-6 KB copies (1.2-1.8 MB) is refused at about
    its 170th-250th copy (the trade-off the owner accepted; an override
    lifts it);
  - maximal copies: a valid snapshot tops out near 81 KB (a maximal item
    with its cards, decision 2026-10-01), so 12 fit (about 972 KB) and the
    13th is refused; even at the 131072-byte check bound only 8 would fit
    (8 x 131072 = 1048576, taken; a 9th refused).
- Bounds: a shared page's frozen part at 1 MiB (12.8 MB at the defaults and
  38 MB at 3x today); one account's copies at 50 MiB at the defaults (640 MB
  today) and 150 MiB at 3x (5.76 GB today).
- The fake: `limits.snapshotBytes` option (default 1048576), the sum by
  `utf8.encode(JSON.stringify(snapshot)).length` (the fake's existing
  measure; the database's `jsonb::text` adds a space after each `:` and
  `,`, so boundary tests stay per layer).

### 4.5 F6 is not done (owner: Q2 = drop)

At 300 rows the per-row calls cost about 50-75 ms of main thread on a mid
phone (est: each `removeEntry` copies 300 keys, filters 150 lists, maps 300
ids) and 301 ops in two requests, about 0.3-0.6 s of database work while the
page says «Сохраняем...». Nothing a reader sees changes. One-op store
methods (`removeEntries`, `restoreEntries`, `setMetaMany`) would touch
`ListPage.svelte` (R7e and R7f edit it first), both list stores and the
undo's failure mode (one dead reference would refuse a whole restored
group). The owner dropped it (2026-10-01); no batch is planned for it.

## 5. Contracts, RPCs, migration and stored data

- `CONTRACTS.md`, routes, ids, links, generated data, `llms.txt`,
  `schema/`: no change.
- RPCs: new `get_shared_list(p_token text, p_since bigint)`; unchanged
  `get_shared_list(text)`, `apply_list_writes`, `import_lists`,
  `clone_shared_list`. PostgREST reads: `lists` gains an order and the
  `id,revision` head read; `purchase_requests` gains an order and keyset
  pages.
- Migration: `supabase/migrations/<ts>_read_scale.sql` (the overload, the
  limit row, the trigger function and its two triggers) and its
  real reversal `supabase/reversals/<ts>_read_scale.sql`. `<ts>` is the
  batch's date and time, later than every migration on `main` at dispatch.
- Stored data: no row is changed or dropped. One new `limit_defaults` row
  (`snapshot_bytes_per_list`, 1048576); new frozen copies past the sum are
  refused; rows already past it stay. Before the production push, the owner
  or CI reads how many lists already pass 1048576 bytes (a count, kept
  either way; section 6, step 13).
- `localStorage`: no key added, read or dropped.
- Port types (internal): `ListRepository.list(known?)`, `ListsRead.kept?`,
  `ShareRepository.read(token, since?)`, `SharedRead`'s `unchanged` branch.
- Compatibility:
  - A stale tab (the previous bundle, open during the deploy): reads lists
    by the old embedded select, calls `get_shared_list` with `{ p_token }`
    (unchanged function), writes as before. Its frozen copy past the sum is
    refused and toasts the old `limitOther` («Достигнут предел: 1048576.
    Нужно больше - напишите на daggerheart.loot@gmail.com.»), the op dropped
    and the list re-read; a reload fixes the text.
  - Revert by the app alone (the runbook's first step): the previous
    frontend works unchanged on the new database (same as a stale tab).
  - The reversal (a second push after the app revert): drops the overload,
    the triggers, the function and the limit row (overrides of the key go
    with it, `on delete cascade`); stored copies stay. The new frontend never
    meets the narrowed database, because CI's `migrate-prod` runs before
    `deploy` and the runbook reverts the app first; if it did, a shared
    page's first read works and its re-reads fail quietly (what is shown
    stays), and the account read is unaffected (no RPC).

## 6. `B7g.1` - revision-keyed reads, paged requests, `p_since`, the byte limit

Objective: sections 4.1-4.4 in one amend of the task's commit.

In scope: the files below. Out of scope: section 3's non-goals; any change
to `ListPage.svelte`, the write buffer, `apply_list_writes`, R7f's limit
reads (kept as R7f ships them).

Files (expected):
- `supabase/migrations/<ts>_read_scale.sql`, `supabase/reversals/<ts>_read_scale.sql` (new).
- `tests/db/list-shares.test.mjs`, `tests/db/harness.test.mjs`
  (`EXPECTED_ANON_FUNCTIONS`), `tests/db/homebrew.test.mjs` (the
  `get_shared_list` grant pins, the trigger function's pin),
  `tests/db/limits.test.mjs` (the new default row; its title "hold the
  seven defaults" becomes eight), `tests/db/restore-drill.test.mjs` (the
  seeded `limit_defaults` keys of the `db reset` case: append
  `'snapshot_bytes_per_list=1048576'` last) and the byte-limit cases in
  `tests/db/lists.test.mjs`.
- `app/src/ports/types.ts`, `supabase.ts`, `lazy-cloud.ts`, `fake-cloud.ts`,
  `cloud.contract.ts` and their tests `supabase.test.ts`,
  `fake-cloud.test.ts`, `lazy-cloud.test.ts`.
- `app/src/state/cloudLists.svelte.ts`, `sharedView.svelte.ts` and
  `cloudLists.test.ts`, `sharedView.test.ts`.
- `app/src/lib/cloudLists.ts` (`limitText`), `lib/cloudLists.test.ts`,
  `app/src/lib/dict.ts` (`limitSnapshots`, both blocks).
- `tests/e2e/contract.mjs` (anon calls the overload; its comment "The two
  functions anon may run" becomes three).
- Docs: `docs/specs/FEATURES.md`, `docs/specs/META.md`,
  `docs/specs/COVERAGE.md` (also its "seven defaults" becomes eight),
  `docs/specs/DEBT.md` (D74),
  `.claude/README.md`, `docs/decisions/` (section 9) and `docs/DECISIONS.md`
  through `node tools/decisions.js`.

### Standing checks

1. Scale - States table (the drawn change is one toast; layout is
   unchanged at 360 px and 1180 px, so no row has a width-specific state,
   no fold or popup height changes, and no sticky region grows):

| State | The screen shows | Proof |
|---|---|---|
| `#/lists`: empty, one, many (50; 150 at 3x), the 51st list refused | unchanged | unchanged (goldens, `app/states`) |
| `#/lists` re-read, nothing changed | nothing redrawn (same array and list objects) | `cloudLists.test.ts`; `supabase.test.ts` (head read only) |
| re-read, one list changed elsewhere | that list redrawn, every other list keeps its object | `cloudLists.test.ts`; contract case G |
| re-read, 51 lists changed (an import) | every list read in full; unchanged lists keep their objects by `updated_at` | `supabase.test.ts`; `cloudLists.test.ts` |
| a list deleted elsewhere | it leaves the index | contract case G; `cloudLists.test.ts` |
| list page: 0, 1, 100 entries (300 at 3x), the 101st refused | unchanged | unchanged |
| a list's frozen copies under, at (1048576 bytes) and past the byte limit | under and at: unchanged; past: the entry is not added, the error toast «Достигнут предел копий предметов других игроков в списке: 1024 КБ. Нужно больше - напишите на daggerheart.loot@gmail.com.», the list read again | `tests/db/lists.test.mjs`; `fake-cloud.test.ts`; `cloudLists.test.ts` |
| copies summing to exactly 1048576 bytes in one list, then one more | the last of them taken (sum = the limit), the next refused with the toast | `tests/db/lists.test.mjs` (default limit, no override) |
| an override of the byte limit (2097152), and null | the toast says 2048 КБ; null takes any sum | `lib/cloudLists.test.ts`; `tests/db/lists.test.mjs` |
| the longest new text: `limitSnapshots` RU in a toast at 360 px | wraps like `limitEntries` (same toast, about 27 characters longer) | unchanged component; no golden (no sibling limit toast has one) |
| owner's requests: 0, 1, 30 per list, 1001 across lists | unchanged; every request drawn (today an arbitrary 1000) | `supabase.test.ts` (two pages) |
| `#/s/<token>` re-read, unchanged | nothing redrawn, no «Список обновлён» | `sharedView.test.ts`; contract case H |
| `#/s/` re-read after a change | as today | existing tests |
| `#/s/` link stopped or list deleted, re-read with `p_since` | «Список больше не доступен» | contract case H; `tests/db/list-shares.test.mjs` |

2. Error scenarios:

| Scenario | The screen shows | Stored data | Recovery |
|---|---|---|---|
| Loading (first account read) | «Загружаем...» as today (R7f's `LoadState`) | - | - |
| The head read or the changed-rows read fails | first read: the failed state with «Повторить»; a re-read: what is shown stays | kept | the next poll, message or «Повторить» reads again with the held revisions |
| A kept id the store no longer holds | nothing changes | kept | one more read with the current revisions |
| A failed write (offline, a refusal, a fault) | as today: the buffer is untouched by B7g.1 | as today | as today |
| A frozen copy past the byte limit | the limit toast once per flush; the row leaves on the re-read | the op is dropped; the server keeps what it held | add the item to another list, or remove copies; a retry is not sent: a refused op is never resent |
| Offline during a re-read | what is shown stays; «Не сохранено» only if a write waits | kept | the shown-again signal and the poll |
| Conflict: another tab or device wrote first | its revision moved, so the re-read fetches that list in full | kept | automatic |
| A list deleted elsewhere | it leaves on the next read | gone by the other device's choice | none needed |
| A shared page's link stopped, its list or a referenced item deleted | stopped or deleted: «Список больше не доступен»; an item deleted: its reference rows leave (the revision moved) | - | - |
| A stale tab, a revert, the reversal | section 5, "Compatibility" | kept in every case | reload; the runbook paragraph |

   No path in B7g.1 writes a field from a held copy: it adds no write and no
   retry. A refused frozen copy is dropped by the existing buffer rule, never
   resent; the next read draws the server's row.
3. Consistency (`FEATURES.md`, "Consistency rules", from R7f): the new limit
   text follows the sibling limit toasts' form («Достигнут предел ...: %n.
   Нужно больше - напишите на ...»), shown through the same `limitText` and
   the same error toast; one name for the thing: «копии предметов других
   игроков», after «Список от другого игрока». Departure: no «N из M» counter
   for the byte sum (R7f's counter rule names collections; a byte sum means
   nothing to a reader before the refusal). Load, empty and error states,
   confirms, undo, button verbs, selection bars and the primary action: no
   change on any page.
4. RU/EN parity: one new key `limitSnapshots`, both languages, the same
   facts (the list, the copies, the size in KB, the email), ASCII
   punctuation, no plural (a unit after the number).

### Steps (order)

1. Dispatch refresh: re-read section 8's files at `HEAD` and adapt every
   step's anchor to what R7e and R7f moved.
2. Migration: the overload (section 4.3) with
   `revoke execute on function public.get_shared_list(text, bigint) from public;`
   and `grant execute ... to anon, authenticated;` and a comment citing this
   decision's file (section 9, D2). Body:
   ```sql
   create function public.get_shared_list(p_token text, p_since bigint)
   returns jsonb
   language plpgsql
   stable
   security invoker
   set search_path = public, pg_temp
   as $$
   declare
     v jsonb := public.get_shared_list(p_token);
   begin
     if v is not null and p_since is not null
        and (v ->> 'revision')::bigint <= p_since then
       return jsonb_build_object('unchanged', true);
     end if;
     return v;
   end;
   $$;
   ```
3. Port and fake for F2: `types.ts` (`read(token, since?)`, `SharedRead`);
   `supabase.ts` `shares.read` sends `{ p_token, p_since }` only when
   `since !== undefined` and maps `{ unchanged: true }` to
   `{ ok: true, unchanged: true }`; `lazy-cloud.ts` forwards `since`;
   `fake-cloud.ts` answers `unchanged` when the projection is not null and
   its revision is at most `since`. `SharedView.refresh()` per section 4.3.
4. F1: `types.ts` (`list(known?)`, `ListsRead.kept?`); `supabase.ts`
   `lists.list` per section 4.1 with `CHANGED_LISTS_MAX`, keeping R7f's
   parallel `my_limit` reads; `lazy-cloud.ts` forwards `known`;
   `fake-cloud.ts` answers changed rows and `kept` for revisions equal to
   `known` (ids it does not hold ignored); `CloudLists.#pull`/`#apply` per
   section 4.1. `LegacyMove` keeps calling `list()` with no argument.
5. The byte limit (owner, Q1 = C): in the migration,
   `insert into public.limit_defaults (key, value) values ('snapshot_bytes_per_list', 1048576);`,
   `list_entries_snapshot_limit()` (`language plpgsql security definer
   set search_path = public, pg_temp`; no `auth.uid()` check - it is a
   trigger, and row level security decides who writes the row) and the
   triggers `list_entries_snapshot_limit_insert` /
   `list_entries_snapshot_limit_update` (section 4.4, the UPDATE branch
   with exactly its `not exists` predicate; transition tables as in
   `20260930121000_list_entries_statement_triggers.sql`), a comment citing
   decision D3 (section 9); the fake's `limits.snapshotBytes` (default
   1048576) in `insertEntries` and `clone`, answering
   `limited('snapshot_bytes_per_list', snapshotBytes)` and checked after
   the entry count (the database fires `list_entries_limit_*` before
   `list_entries_snapshot_limit_*` by trigger name, so a statement past
   both limits is refused as `entries_per_list` on both layers);
   `limitText` maps the key to `t.limitSnapshots` with `%n` =
   `Math.ceil(value / 1024)` (an override under 1024 bytes reads «1 КБ»,
   never «0 КБ»);
   `limitSnapshots` in `dict.ts` after `limitEntries`, exact text:
   - RU: `'Достигнут предел копий предметов других игроков в списке: %n КБ. Нужно больше - напишите на daggerheart.loot@gmail.com.'`
   - EN: `"This list has reached its limit of %n KB of copies of other players' items. Need more? Write to daggerheart.loot@gmail.com."`
   - At the default the toast reads «... в списке: 1024 КБ. ...» / "... of
     1024 KB of ...".
6. Requests: `supabase.ts` `requests.list` per section 4.2; export
   `READ_PAGE`; the lists reads get their `.order()`.
7. The reversal: `drop function public.get_shared_list(text, bigint);`,
   drop both triggers and the function, then
   `delete from public.limit_defaults where key = 'snapshot_bytes_per_list';`;
   a header comment naming what stays (stored copies past the sum).
8. Tests (each new state or scenario above is its own case):
   - `tests/db/list-shares.test.mjs`: the overload answers `unchanged` for
     `p_since` equal to and above the revision, the projection below it and
     for null, null for a malformed, unknown and stopped token with any
     `p_since`, the projection after an own item's edit with the old
     revision; `prosecdef` false; anon and authenticated may execute it;
     `get_shared_list(text)` answers as before. Grant pins in
     `list-shares.test.mjs` and `homebrew.test.mjs` name both signatures
     (the overload with its own pin, `prosecdef` false: the shared pin
     helper sets true); `harness.test.mjs` appends
     `'get_shared_list(text,bigint)'`.
   - `tests/db/homebrew.test.mjs`: pin `list_entries_snapshot_limit()` as
     the touch functions are pinned - `prosecdef` true, `proconfig`
     `['search_path=public, pg_temp']`, no EXECUTE for `anon`,
     `authenticated` or `service_role`.
   - `tests/db/lists.test.mjs`, the byte limit. Fixtures: a helper that
     builds a valid frozen snapshot of the entry's key padded to a given
     `octet_length(snapshot::text)` with `desc` texts within the
     validator's caps (no embedded cards needed); most cases lower the
     limit through an override in `user_limit_overrides` to a few thousand
     bytes. Cases: copies up to the sum taken, one past refused with
     `P0001`, message `limit: snapshot_bytes_per_list` and detail the
     limit; at the default (no override) valid copies, at most 100 entries,
     whose `octet_length(snapshot::text)` values sum to exactly 1048576
     taken, and one more copy refused with detail `1048576`; an override of
     2097152 and a null override lift it; a list already past the limit
     (filled under a raised override, then the override removed) takes an
     official entry and a reference; on such an over-limit list a reorder
     (a `position` UPDATE over rows with copies) and an entry note edit are
     taken (unchanged copies are not checked); a direct UPDATE of
     `snapshot` past the sum refused; a direct UPDATE that sets a new `id`
     together with a snapshot past the sum refused; `clone_shared_list` and
     `import_lists` past it refused whole; two lists in one statement each
     checked.
   - `tests/db/limits.test.mjs`: pins the default 1048576; the title "hold
     the seven defaults" becomes "hold the eight defaults".
   - `tests/db/restore-drill.test.mjs`: the `db reset` case's seeded
     `limit_defaults` keys gain `'snapshot_bytes_per_list=1048576'`, last.
   - `supabase.test.ts`: the stub builder gains `order`, `in`, `gt`,
     `limit`; the first read (one embedded select, ordered); a re-read with
     nothing changed (head read only, `kept` all); one changed (head, then
     `in` with one id); 51 changed (full read); a failed head or changed
     read `{ ok: false }`; requests in two pages (1000 then 1) with
     `gt('id', last)` and a fresh builder per page; `read` with and without
     `since` and the `unchanged` answer; a test that reads
     `supabase/config.toml` and expects `max_rows` = `READ_PAGE`.
   - `fake-cloud.test.ts`, `lazy-cloud.test.ts`: the new arguments
     forwarded and answered; the fake's byte limit (default 1048576, an
     option to lower it, the refusal's key and value).
   - `cloudLists.test.ts`: the first read passes no revisions; a re-read
     passes every held revision; kept lists keep their objects (`toBe`) and
     the array is not replaced when nothing changed; a changed list is
     replaced; a gone list leaves; a kept id not held reads again with no
     redraw; a refused frozen copy toasts `limitSnapshots` with 1024 КБ.
   - `lib/cloudLists.test.ts`: `limitText('snapshot_bytes_per_list', 1048576)`
     reads «... 1024 КБ ...» and EN "... 1024 KB ..."; 2097152 reads 2048;
     500 reads 1 (`Math.ceil`, never 0); a null value reads «?» as the
     other limits do.
   - `sharedView.test.ts`: `refresh()` passes the shown revision;
     `unchanged` keeps the object and `changes`; `open()` and the refresh
     after a failed first read pass none.
   - `cloud.contract.ts` case G: `list(known)` with nothing changed (no
     rows, every id kept), after an update of one list (that row only), with
     a stale revision and an unknown id, after a remove (in neither); case
     H: `read(token, revision)` `unchanged`, `read(token, revision - 1)` the
     projection, after an edit the projection with a higher revision, a
     stopped and an unknown token with `since` `shared: null`.
   - `tests/e2e/contract.mjs`: anon's `get_shared_list` with `{ p_token:
     'nonsense', p_since: 1 }` answers null; the comment "The two functions
     anon may run" becomes three and names the overload.
9. Specs: `FEATURES.md` "Two devices" adds «A re-read asks for each list's
   revision and fetches the lists whose revision moved (every list when
   more than 50 did); a page load reads every list.»; "The shared page"
   adds that a re-read names the shown revision and an unchanged list
   answers with nothing to draw; "Limits" adds: the frozen copies of other
   players' items in one list hold at most 1048576 bytes together
   (`snapshot_bytes_per_list`, `limits:set` changes it per user), a copy
   past it is refused with «Достигнут предел копий предметов других игроков
   в списке: 1024 КБ. Нужно больше - напишите на
   daggerheart.loot@gmail.com.», and a list already past it keeps its
   copies and takes catalog entries and own items. `META.md`: `anon`
   executes three functions, `get_shared_list(text)`, its revision overload
   `get_shared_list(text,bigint)` (security invoker) and
   `create_purchase_request`. `COVERAGE.md`: the `ports/supabase.test.ts`
   row (the head read, the changed read, the order, the request pages,
   `since`), the tests/db rows, the contract's cases G and H, and its
   "seven defaults" (the `limits.test.mjs` row) becomes "eight defaults".
10. `.claude/README.md`: "Expected Security Advisor warnings" says the
    overload is security invoker and adds none, and the trigger function
    is not executable by any Data API role; "Undo a deploy that carried a
    migration" gains a paragraph: revert the app alone (the old frontend
    never calls the overload, and reads the limit refusal as `limitOther`);
    the reversal as a second push drops the overload and the limit, and
    stored copies past the sum stay. "Restore production (owner)", step 4:
    name `<ts>_read_scale.sql` with `snapshot_bytes_per_list` 1048576 in
    its sentence, in the list of expected keys and in the example
    `insert ... on conflict (key) do nothing` - a backup from before R7g
    lacks the row, and every statement that writes a frozen copy then
    raises `22023` (unknown limit key in `effective_limit`).
11. `DEBT.md`: the section 10 entry under the next free D number at
    dispatch (D74 at planning; R7e and R7f may take it first - use the
    number everywhere this plan says D74); the decision files D1-D3 of
    section 9 and the "Amended by" line in the 131072-byte decision;
    `node tools/decisions.js`.
12. Gates in the order of "Verification commands" below; stage by path.
13. Closeout: name to the owner a read-only count for production before
    the merge (agents never touch production), for the record only - every
    row stays either way:
    `select count(*) from (select list_id from public.list_entries where snapshot is not null group by list_id having sum(octet_length(snapshot::text)) > 1048576) s;`
    Run the same count on the test project after the `db:push` and record
    it in the handoff.

### Acceptance criteria

- A re-read with nothing changed sends one `lists` read of `id,revision`
  and draws nothing new; a re-read after one list's edit fetches that list
  alone; more than 50 changed lists read in full (unit tests, contract G).
- Every pending request is read when there are more than 1000 (unit test
  with two pages); the lists reads carry `.order()`.
- `get_shared_list(text, bigint)` answers `unchanged` for a known revision,
  the projection otherwise, null for a link that opens nothing; it is
  security invoker; `get_shared_list(text)` and its grants are unchanged
  (tests/db, contract H, e2e).
- `SharedView` sends the shown revision on every re-read and redraws
  nothing on `unchanged` (unit test).
- A frozen copy past 1048576 bytes per list is refused on every write
  path with `limit: snapshot_bytes_per_list`; copies summing to exactly
  1048576 bytes are taken and one more refused; an override lifts it; the toast reads
  `limitSnapshots` with 1024 КБ / 1024 KB in both languages; a list already
  past it takes catalog entries and references (tests/db, fake, store, lib
  tests).
- The test project's count of lists past the limit (step 13) is in the
  handoff.
- `check:db`'s reversibility gate passes with the real reversal.
- Stale-tab compatibility holds: a `{ p_token }` call answers the full
  projection after the migration (tests/db).
- Each row of the States and Error tables above has its proof.
- `FEATURES.md`, `META.md`, `COVERAGE.md`, `DEBT.md`, `.claude/README.md`
  and the decision files say what shipped; `docs/DECISIONS.md` is rebuilt.
- The bundle budget passes (`check:built`); the figure is recorded.

### Verification commands

```text
rtk npm run check                                  (8-10 min; Bash timeout 600000)
npm run check:built                                (2 min)
node tests/run-all.js app/states                   (4-6 min; the fake drives every signed-in state)
npm run check:db                                   (9-10 min; PowerShell tool; last)
-- after the batch review approves, in this order:
npm run db:push -- --project test --yes            (1 min)
npm run e2e                                        (2-3 min; contract G, H and the anon call)
```

`check:db` runs last: gate credit arms it for the tree it started with, so
a fix that `check:built` or `app/states` forces after it would cost another
`check:db` before the commit.

No golden run: no state draws differently (the only new text is a limit
toast, and no limit toast has a golden state). Cost: about 30 minutes in
one pass, about 50 with one remediation cycle (`check` and `check:db`
again), plus a closeout of about 10. Review: required after the batch (a
migration).

Split criterion: none - one batch. F1, F2 and the byte limit share the ports, the fake,
the contract and one `check:db`; two batches would pay `check`, `check:db`
and the E2E twice (about 25 more minutes) for no new proof.

### Risks and do-nots

- Do not drop or replace `get_shared_list(text)`; do not give `p_since` a
  default (two candidates for `{ p_token }` answer `PGRST203`).
- Build a fresh postgrest-js query per page and per read step: a reused
  builder keeps the previous filters.
- `effective_limit` raises `22023` for an unknown key: spell
  `snapshot_bytes_per_list` exactly.
- Keep R7f's `listLimit`/`entryLimit` reads and their tests; do not move
  them into the head read.
- Do not change `ListPage.svelte`, the write buffer or `apply_list_writes`.
- `db:push` and `e2e` only after the batch review approves.
- Stage by path; R7c, R7e or R7f files may be in the working tree.

Fallback: none needed. If the plan review rejects the two-step read, the
alternative is the rejected `get_lists(p_known)` RPC in the same migration
(section 4.1), with the same store change.

## 7. Owner questions

Both answered by the owner on 2026-10-01.

| Id | Question | Answer (owner) | Rejected |
|---|---|---|---|
| Q1 | Add a per-list byte limit on frozen copies? It amends "A frozen copy holds up to 131072 bytes" (2026-10-01). | **C: `snapshot_bytes_per_list` = 1048576 (1 MiB), an overridable `limit_defaults` row.** It stops the unbounded sum at the source (today one account at the defaults can store 640 MB of copies, above the free plan's 500 MB database, and one shared page can carry 12.8 MB, 38 MB at 3x). Trade-off accepted: at 3x, a full 300-entry list of real 4-6 KB copies is refused at about its 170th-250th copy, and 12 maximal copies fill a list; an override lifts it for that user. | A: 2 MiB (the planner's recommendation; fits every real 300-entry list); B: no limit. |
| Q2 | F6 at 300 rows costs about 50-75 ms on a phone and two requests: drop it from R7g? | **Drop.** No reader-visible cost at the 3x target; the change would touch `ListPage.svelte` after R7e and R7f and change the undo's failure mode. Trade-off accepted: a batch edit sends one op per row. | Keep as a `B7g.2`. |

Found while planning, placed by the owner on 2026-10-01 as a line for
`persist-review`'s scale re-run (handoff "Deferred"): the owner's pending
requests read is re-sent whole after every new request (an owner-topic
`request` message) and on the 300 s safety read. At the defaults that is up
to 500 requests of up to 100 lines, about 4 MB (est); at 3x up to 4500 of
300 lines. A link holder can send 5 requests a minute per link.

## 8. Moves expected from earlier releases (the dispatch refresh re-reads these)

- R7c `B7c.4` (in progress): `app/src/lib/dict.ts` (catalog card strings).
  B7g.1 adds `limitSnapshots` after `limitEntries` in both blocks.
- R7e `B7e.1`: `ListPage.svelte`, `QuickItem.svelte`, `Toast.svelte`,
  `fake-cloud-seed.ts` (adds `gm3`). B7g.1 edits none of them; contract and
  fake tests that count seed users or lists may need the new user.
- R7f `B7f.1`: `ports/{types,supabase,fake-cloud,cloud.contract}.ts`
  (`ListsRead.listLimit`/`entryLimit` read by `my_limit` in parallel with
  `lists.list()`; `HomebrewRead.bookLimit`; contract cases G and M),
  `state/cloudLists.svelte.ts` (the stored limits), `HomebrewLoad.svelte`
  renamed `LoadState.svelte`, failure strings in `dict.ts`, `FEATURES.md`
  "Consistency rules" and its limit and failure text. B7g.1 keeps the limit
  reads in both `list()` branches (or once per call, as R7f wrote them),
  keeps R7f's case G lines, and words `limitSnapshots` by R7f's rules.

## 9. Decision files B7g.1 writes (body text settled here)

- D1 `docs/decisions/<date>-the-account-re-read-fetches-only-lists-whose-revision-moved.md`,
  title "The account re-read fetches only the lists whose revision moved":
  Decision - section 4.1's first three bullets and 4.2's keyset pages for
  the requests read; Rejected - 4.1's three alternatives and offset paging
  (a deleted row between pages skips another); Accepted trade-off - the
  first read's size.
- D2 `docs/decisions/<date>-a-shared-page-re-read-names-its-revision.md`,
  title "A shared page re-read names its revision; an unchanged list answers
  unchanged": Decision - section 4.3; Rejected - 4.3's three alternatives;
  Accepted trade-off - 4.3's last bullet (a migration that changes the
  projection without a revision bump leaves an open page on the old one
  until the revision moves or the page reloads).
- D3 `docs/decisions/<date>-a-lists-frozen-copies-hold-up-to-1048576-bytes.md`,
  title "A list's frozen copies hold up to 1048576 bytes together". Body:
  - `- Task: \`persist-7g-read-scale\` (the owner's answer to Q1, 2026-10-01).`
  - `- Decision: the frozen copies of one list hold at most 1048576 bytes together (\`sum(octet_length(snapshot::text))\`), the \`limit_defaults\` row \`snapshot_bytes_per_list\` that \`limits:set\` overrides per user; \`list_entries_snapshot_limit()\` checks every statement that adds or changes a frozen copy; a list already past it keeps its copies. The refusal is \`limit: snapshot_bytes_per_list\` with the limit as its detail, shown as KB.`
  - `- Rejected: 2097152 bytes (fits every real 300-entry list at 3x, but doubles the bound per shared page and per account); no sum bound (one account at the defaults could store 640 MB of copies, above the free plan's 500 MB database).`
  - `- Accepted trade-off: at 3x a full 300-entry list of real 4-6 KB copies is refused at about its 170th-250th copy, and 12 maximal copies (about 81 KB) fill a list; an override lifts it. A shared page carries at most 1 MiB of frozen copies, one account 50 MiB at the defaults and 150 MiB at 3x.`
  - `- Amends "A frozen copy holds up to 131072 bytes; a card text holds 1500 code points" (2026-10-01): a sum bound per list.`
  - and in that older file, after its title: `- Amended by "A list's frozen copies hold up to 1048576 bytes together" (<date>): a sum bound per list.`

## 10. Deferred

- D74 (the next free D number at dispatch; `DEBT.md`, new section "Shared page read size (no task filed yet;
  the owner names the release)"): **Where** `state/sharedView.svelte.ts`
  (`#message` then `refresh()`), `get_shared_list`. **What** after each
  owner commit every open shared page downloads the whole projection again
  - about 0.1-1 MB for a real list of up to 300 entries, up to 1 MiB of
  frozen copies plus 300 references of up to 81 KB at the 3x target; an owner who types with pauses commits every 2 s. **Why
  deferred** `p_since` removes the unchanged re-reads only; a smaller
  changed read needs per-entry change tracking or sending only the
  snapshots the page lacks (frozen copies never change per entry id), a
  projection contract change the owner did not place. **How to verify** with
  a shared page open, edit one note; the re-read carries no frozen snapshot
  the page already holds.
- F6: dropped by the owner (Q2); not a defect at the 3x target, so no
  `DEBT.md` entry. R7g's closeout names it to the owner as dropped.
- `persist-review`'s scale re-run (owner, 2026-10-01): the owner's pending
  requests read re-sent whole after every new request and on the 300 s
  safety read (section 7's note). The handoff's "Deferred" carries the
  line; R7g's closeout hands it to `persist-review`'s planning input.
- Not placed (owner): F11 homebrew read size, F13 the `57014` handling.
- Plan review N6 (pre-existing, not needed for B7g.1): `CloudLists.#pull`
  has no guard against an older read that answers after a newer one; its
  changed rows replace newer objects until the next read. A cheap guard:
  skip a changed row whose `revision` is below `#read[id].rev`. The
  handoff's "Deferred" carries it.
