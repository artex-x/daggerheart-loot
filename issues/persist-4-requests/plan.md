# Plan - TASK persist-4-requests (release R4: purchase requests)

## Status

- Plan review: required before B4.1 (trigger: a migration with SECURITY DEFINER functions, the first function `anon` writes through - a new writing RPC - and a trigger that sends on R3's Realtime topics)
- Plan reviews: `reviews/plan-B4.1.md` fix-then-continue (2026-09-27);
  planning pass 3 answers it (register `reviews.md`); the second look,
  `reviews/plan-B4.1-2.md`, is next.
- Planning pass 3 (the review's fixes), 2026-09-27: 5.1, 5.2, 5.4, 5.6,
  5.7, 6.1, 6.2, 6.4, 10, 11, 14, 16 and the roadmap's R4 lines.
- Planning pass 2 (refresh), 2026-09-27, planner, in a worktree at
  `1cbca5f7` (`origin/main` `288ca549` plus R3's `B3.1` commit). Pass 1:
  2026-09-26 at `c39f3de1`.
- Release slot: after R3's closeout push, before R6 (roadmap section 9:
  R3, R4, R6-R9, R10). R2, R5, R5b, `process-guards`, R11 and
  `display-settings` are shipped.
- R3's `B3.2` (the client half) is being built on `main` and is not in
  this base; section 11 of `issues/persist-3-realtime/plan.md` (S1-S11,
  the files table, steps 1-17) is the client shape `B4.2` builds on.
  Every step that depends on `B3.2` code is marked **[B3.2]**; section 16
  is the delta check to run after R3 ships. `B4.1` depends on `B3.1` only,
  which is in this base.
- NEEDS_HUMAN_CONFIRMATION: no. Section 13: question 1 answered
  2026-09-26; question 2 answered 2026-09-27 (A: the Display row is a
  select at every width); item 3, the requester's status, decided in this
  pass from the owner's feedback of 2026-09-27 (A: removed; the owner
  offered it first). The owner's notes of 2026-09-27 (`context.md`,
  "Owner input after R5b") fix the row's wording, and this pass decides
  their one optional item: the hint line is drawn (section 6.3).
- Mocks (owner request, 2026-09-27): `mocks/index.html` lists one
  self-contained file per screen, each state at 960 px and 360 px.
- Batches: `B4.1` (database) - implement-ready (section 10); `B4.2`
  (client) - outline with the design settled (section 11), expanded to
  implement-ready by a short planner pass after `B4.1` closes and the
  section 16 delta check; closeout (section 15).
- Gate cost of the plan: `B4.1` about 40 minutes, `B4.2` about 70
  minutes, closeout about 5 minutes; about 115 minutes in total (section
  9).
- Roadmap: `issues/persistent-storage/plan.md` sections 3, 5, 12, 14, 16
  (answers 32-38), 17. This file is R4's authority where they differ.

## 1. Objective and current state

Goal: anyone holding a player or GM link of an account list can send the
list's owner a request for the entries they ticked, with the taken counts;
a signed-in reader who adds that selection to their own list is asked
whether to send it too; the owner sees the requests live on the list page
and a count on the lists index, and applies (stock deducted in one
transaction) or declines. The requester sees that the request was sent
and, while the page is open, the stock it lowers; no per-request status
is drawn (owner's feedback, 2026-09-27; section 13, item 3).

State the plan builds on (`1cbca5f7`, plus R3's `B3.2` as planned):

- `lists`, `list_entries` (`unique (list_id, item_key)`, `quantity` 1..99,
  `price_coins` null or 1..99999), `list_shares` (`audience`, `token`,
  `topic_key`, `revoked_at`); the owner reads its stopped shares; a link is
  replaced by delete, then create (no rotate).
- `limit_defaults`, `user_limit_overrides`, `effective_limit(user, key)`;
  limit triggers raise `limit: <key>` with `detail` = the value.
- Every owner write goes through the write buffer: `CloudLists`
  (`flushNow`, `refresh`, 2 s quiet window) sends one
  `apply_list_writes(p_ops jsonb)` request per flush.
- The shared page draws the projection by item id: `app.sel` holds item
  ids, `app.picked` the taken counts, `app.shared.meta` the stock and price
  (`SharedListPage.svelte`, `SelBar.svelte`); `app.sharedView`
  (`SharedView`: `token`, `status`, `shared`, `mine`) holds the open
  `#/s/` link. An item id is an entry's `item_key`, unique per list.
- R3's database half (`supabase/migrations/20260927120000_realtime.sql`):
  the deferred `lists_broadcast()` sends event `list` with `{ list,
  revision, by }` to `owner:<uid>` and event `revision` with `{ revision }`
  to each active share's `share:<topic_key>`; `list_shares_gone()` sends a
  null revision once; two `select` policies on `realtime.messages`
  (`dhloot_share_topics_receive` for `anon` and `authenticated` by topic
  shape, `dhloot_owner_topic_receive` for the owner), no `insert` policy.
  `by` is the `x-dhloot-tab` request header, parsed inline (no helper).
- R3's client half (**[B3.2]**, planned): `EventsPort` (`subscribe`,
  `tab`), `lib/live.ts` (`readShareMessage` accepts event `revision`
  only, `readOwnerMessage` event `list` only), `LiveFeed`, the share feed
  in `SharedView`, the owner feed in `CloudLists` for the whole signed-in
  session on every route (S4), the 45 s poll only while a feed is not
  `live`, a 5-minute safety re-read while `live`, the 20 s write timeout
  (`timed`, `WRITE_TIMEOUT_MS`), the tab header on PostgREST requests only
  (S1).
- Harness invariant: `anon` executes only `get_shared_list(text)`
  (`tests/db/harness.test.mjs`, `EXPECTED_ANON_FUNCTIONS`).
- `prefs.notifyGm` (`ask` | `always` | `never`), `app.notifyGm`,
  `app.setNotifyGm` and the Display row that changes it shipped in R5b's
  `B5b.1`; `display-settings` added the Display lead line above the rows.

## 2. Two conflicts found in the sources (raised in pass 1, resolved)

1. **Expiry: 14 days or 1 hour.** The owner's answer to 36 (roadmap
   section 16, "Answers to 32-38") and the limits amendment both say **1
   hour**; the 14 days was the planner's recommendation 36 and roadmap text
   written before the answer. Pass 1 rewrote those rows.
2. **Requester name.** The answer to 36 removes the name field: "a request
   shows its audience and its time only". This plan stores no name and no
   requester account id (section 5.1).

Both are resolved by the owner's own answers; neither needs a new answer.

## 3. Scope and non-goals

In scope: the tables, RLS and functions (section 5); two `limit_defaults`
rows; the request event on R3's owner topic; the requester's send and
flow b; the owner's Requests panel, apply, "Apply available", decline, the
index count; the reworded `notifyGm` row in Display settings (owner,
2026-09-27); the privacy and terms text; layer 1-4 tests; specs and
decisions.

Non-goals: the requester's per-request status - the pass 1 status block,
its `sessionStorage` key, the status key column, `get_purchase_requests`
and the share-topic event (owner's feedback, 2026-09-27; section 13,
item 3); a requester name or contact (owner, answer 36); email, push or
a Discord webhook (answer 38; the webhook is a deferred idea, roadmap
decision 40); a requester cancel; editing a request; a request from an old
`#/l/` link or a local list (no server object); a panel or count outside
the lists index and an account list page (the owner feed runs on every
route since R3's S4, but only those two pages draw requests); requests in
R6's export bundle (a request is transient); a homebrew line's own name
(R7's seam, section 12).

## 4. Existing behaviour and code paths (re-read 2026-09-27 at `1cbca5f7`)

| Concern | Where |
|---|---|
| Limits | `supabase/migrations/20260925130000_limits.sql`; `tests/db/limits.test.mjs` ("hold the two defaults") |
| Lists, entries, revision bump, limit triggers | `supabase/migrations/20260925130100_lists.sql` |
| Shares, projection | `supabase/migrations/20260925130200_list_shares.sql` (`create_list_share`, `revoke_list_share`, `get_shared_list`, `clone_shared_list`) |
| E2E admin grants | `supabase/migrations/20260925130300_lists_service_role.sql` |
| The write buffer's RPC | `supabase/migrations/20260925130600_list_writes.sql` |
| Newest migration | `supabase/migrations/20260927120000_realtime.sql` (R3 `B3.1`; `B3.2` adds none) |
| Realtime triggers and policies | the same file: `lists_broadcast()`, `list_shares_gone()`, the two policies |
| Layer 3 helpers | `tests/db/roles.mjs` (`connect`, `asRole`, `commitAs`, `jwtFor`, `realtimePolicies`, `realtimePartition`); `tests/db/realtime.test.mjs` (`rowsOf`, `withWorld`, the header cases); `list-shares.test.mjs` (the role pattern) |
| Layer 3 pins that move | `harness.test.mjs` (`EXPECTED_ANON_FUNCTIONS`), `limits.test.mjs` ("hold the two defaults"), `usage.test.mjs` (`PUBLIC_TABLES`), `restore-drill.test.mjs` (the seed `limit_defaults` after the reset) |
| Cloud port | `app/src/ports/types.ts` (`CloudPort`: `auth`, `prefs`, `lists`, `shares`; **[B3.2]** `events`), `supabase.ts`, `lazy-cloud.ts`, `fake-cloud.ts`, `fake-cloud-seed.ts` (`uuid(n)`, SHOP `uuid(101)`, shares `uuid(111)` player-token-1 and `uuid(113)` gm-token-1), `cloud.contract.ts` (cases A-I; **[B3.2]** J) |
| Storage port | `app/src/ports/storage.ts` (`browserStorage(win)` over `localStorage` only; `memoryStorage`), `ports/index.ts` (`browserEnv`, `fakeEnv`), `Env` in `types.ts` |
| Shared page | `SharedListPage.svelte`, `SelBar.svelte`, `AddToList.svelte` (`pick`, `createNew`, `added`), `state/sharedView.svelte.ts` |
| Owner pages | `ListPage.svelte` (the action row, then `SharePanel`), `ListsPage.svelte`, `ListCard.svelte`, `state/cloudLists.svelte.ts` (`flushNow`, `refresh`, `get`) |
| App state | `state/app.svelte.ts` (construction of `cloudLists` and `sharedView`, `#setUser`, `#refreshShared`, `#pollLists`, `#watchAccount`'s shown-again handler; all **[B3.2]**-touched) |
| Preferences | `lib/prefs.ts` (`NotifyGm`, `readPrefs`); `AccountPage.svelte` (the Display section's fifth row); `dict.ts` (`displayNotify`, `notifyAsk`, `notifyAlways`, `notifyNever`) |
| Limit texts | `lib/cloudLists.ts` `limitText` |
| Policy pages | `pages/src/privacy.html`, `pages/src/en/privacy.html`, `pages/src/terms.html`, `pages/src/en/terms.html` |
| Layer 4 | `tests/e2e/flows.mjs` (F0-F10; **[B3.2]** F11), `contract.mjs` (**[B3.2]** `portOf`), `admin.mjs` (`adminClient`, `listsOf`, `sharesOf`, `deleteListsOf`) |

## 5. Design: the database (`B4.1`)

### 5.1 Tables

```sql
create table public.purchase_requests (
  id uuid primary key,                 -- made by the client (5.2, replay)
  list_id uuid not null references public.lists (id) on delete cascade,
  share_id uuid not null references public.list_shares (id) on delete cascade,
  audience text not null check (audience in ('player', 'gm')),
  status text not null default 'pending' check (status in ('pending', 'applied', 'declined')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  decided_at timestamptz,
  check ((status = 'pending') = (decided_at is null))
);
create index purchase_requests_list_pending on public.purchase_requests (list_id)
  where status = 'pending';
create index purchase_requests_share_created on public.purchase_requests (share_id, created_at);

create table public.purchase_request_lines (
  request_id uuid not null references public.purchase_requests (id) on delete cascade,
  item_key text not null check (item_key ~ '^[A-Za-z0-9_-]{1,64}$'),
  quantity integer not null check (quantity between 1 and 99),
  price_coins integer check (price_coins is null or price_coins between 1 and 99999),
  applied_quantity integer check (applied_quantity is null or applied_quantity between 0 and 99),
  primary key (request_id, item_key)
);
```

- **No requester identity.** No name (answer 36), no `requester_user`: a
  signed-in requester's id links a person to a request and nothing shows
  it. The owner sees the audience and the time.
- **No status key** (section 13, item 3): the requester reads no status,
  so pass 1's `status_key uuid not null unique` column,
  `get_purchase_requests` and the share-topic event are gone.
- **"Expired" is read, not stored.** `status` stays `pending`; a pending
  row with `expires_at <= now()` reads `expired` everywhere, cannot be
  applied or declined, and does not count towards the pending cap.
  `expires_at` is a plain column set by the function (`timestamptz +
  interval` is not immutable, so a generated column is not allowed); tests
  set it directly.
- **Snapshot of the price; the entry found by its item.** `price_coins`
  is the entry's price when the request was made, so the owner's total is
  what the reader saw. A line holds no entry id (review `plan-B4.1`
  blocker 2): apply and the owner's panel find the stock by `list_id` and
  `item_key`, which is unique per list, so an entry deleted and re-added
  under a new id (the owner's undo, `CloudLists.restoreEntry`) is found,
  and an entry moved to another list is not.
- **The request id is made by the client** (review `plan-B4.1` blocker
  1): R3's transport may send a write twice (`keepaliveFetch` resends a
  `rest/v1` request when the keepalive fetch throws; a 20 s timeout
  answers `network` and the user sends again), so the id makes a replay
  harmless. It is a client value, not a database-made key: nothing leaves
  the database.
- **Words.** `applied_quantity` is what an apply took from a line; the
  client field is `applied`. "Taken" is kept only for the apply answer's
  sum and, on the share page, the reader's picked count (`app.picked`).
- **Grants.** `alter table ... enable row level security` on both;
  `revoke all ... from public, anon, authenticated` (a new table's Data
  API roles hold TRUNCATE, REFERENCES and TRIGGER by default,
  `COVERAGE.md` `tests/db/` paragraph); `grant select ... to
  authenticated`; `select` policies for `authenticated`: the list's owner
  (`exists (select 1 from public.lists l where l.id = list_id and
  l.owner_id = (select auth.uid()))`; the lines through their request); no
  `insert`, `update` or `delete` grant - every change goes through the
  functions. `grant select, delete ... to service_role` for the hosted
  E2E's admin client (the `lists_service_role` pattern, in the same
  migration). `service_role` also keeps the `REFERENCES`, `TRIGGER` and
  `TRUNCATE` a new table gives it on this stack; the migration leaves
  them, and the test pins all five, as `list-shares.test.mjs` does (review
  `plan-B4.1` risk 1; chosen over revoking them, so the two request tables
  match `list_shares`).
- **Limits.** `insert into public.limit_defaults (key, value) values
  ('request_lines', 100), ('pending_requests_per_list', 10);` read with
  `effective_limit(<list owner>, key)`, so `limits:set` raises or lowers
  them per owner. The rate (5 per share per minute), the expiry (1 hour)
  and the retention (24 hours) are constants in the function (limits
  amendment; decision "Purchase requests are written only by a bounded
  function any link holder calls").

### 5.2 `create_purchase_request(p_id uuid, p_token text, p_lines jsonb) returns void`

`security definer`, `set search_path = public, pg_temp`, `execute` to
`anon` and `authenticated` (the first function `anon` writes through).
`p_id` is the request id the client made (5.1). Answers nothing: no id or
key made by the database leaves it. Steps, in this order:

1. Token: null or not `^[A-Za-z0-9_-]{43}$`, or no share with that token
   and `revoked_at is null` -> `raise exception 'request: unknown link'
   using errcode = 'P0002'`. One answer for all four, as `get_shared_list`.
   A null `p_id` -> `22023`, message `request: bad id`.
2. `perform pg_advisory_xact_lock(hashtext('requests:' || v_share.list_id::text))`
   - two sends to one list count in order (the limit triggers' pattern).
3. Replay (review `plan-B4.1` blocker 1): a row with `id = p_id` and
   `share_id = v_share.id` -> return at once: success, nothing inserted,
   no line, rate or cap check. A row with `id = p_id` on another share ->
   the generic `request: unknown link` (`P0002`), so an id says nothing
   about another link. A replay after the housekeeping deleted the row
   (24 hours on) is a new request; a replay comes seconds after the send.
4. Lines shape, else `22023` with message `request: bad lines`: an array;
   `octet_length(p_lines::text) <= 32768`; length at least 1; each element
   an object with `item` a string matching the item-key pattern and `qty`
   a JSON number whose text matches `^[0-9]{1,2}$` and is at least 1; no
   `item` twice. Other keys in a line object are ignored: price, audience
   and entry are never read from the client.
5. `v_max := effective_limit(v_owner, 'request_lines')`; more lines (and
   `v_max` not null) -> `raise exception 'limit: request_lines' using
   errcode = 'P0001', detail = v_max::text`.
6. Every `item` is an entry of the list, else `22023` with message
   `request: stale` (the page is older than the list).
7. Rate: `count(*)` of this share's requests with `created_at > now() -
   interval '1 minute'` at or above 5 -> `limit: request_rate`, detail `5`.
   Counted from the table; the housekeeping never deletes a row that young.
8. Pending: `v_max := effective_limit(v_owner,
   'pending_requests_per_list')`; when not null, the list's rows with
   `status = 'pending' and expires_at > now()` at or above it -> `limit:
   pending_requests_per_list`, detail the value.
9. Housekeeping, every list, only now that the call will insert (review
   `plan-B4.1` risk 3: a refused call does no scan and takes no row
   locks): `delete from public.purchase_requests where decided_at < now()
   - interval '24 hours' or (status = 'pending' and expires_at < now() -
   interval '24 hours')`.
10. `insert into public.purchase_requests (id, list_id, share_id,
    audience, expires_at) values (p_id, ..., now() + interval '1 hour') on
    conflict (id) do nothing returning id`; no row returned (the id was
    taken on another list between the step 3 read and here, which the
    list lock does not cover) -> `request: unknown link` (`P0002`). Then
    its lines, each with the entry's `price_coins` read from
    `list_entries` by `list_id` and `item_key`.

The client maps the answer (section 6.1): `P0002` -> `gone`; `limit:
<key>` -> `limit` with the key and value; message `request: stale` ->
`stale`; any other refusal -> `refused`; no answer -> `network`.

### 5.3 (removed) the requester's status read

Pass 1's `get_purchase_requests(p_keys uuid[])` read a request's status
by its key for the requester. Removed with the status block (section 13,
item 3); `anon` executes one more function only,
`create_purchase_request`. The decision "A requester reads the status by
a key kept in the tab's sessionStorage" is superseded by "A requester
sees no request status; the send toast is the only answer" (written in
planning pass 2).

### 5.4 `apply_purchase_request(p_id uuid, p_clamp boolean default false) returns jsonb`

`security definer`, `set search_path = public, pg_temp`, `authenticated`
only. One transaction:

1. The request joined to its list `for update of r`; not found, or the
   list's owner is not `auth.uid()` -> `42501`.
2. `status <> 'pending'` -> `22023`, message `request: decided`;
   `expires_at <= now()` -> `22023`, message `request: expired`.
3. Lock the list's entries that the lines name: `select ... from
   public.list_entries where list_id = r.list_id and item_key in (the
   lines' items) order by id for update` (review `plan-B4.1` blocker 2
   and risk 5: a fixed lock order).
4. Per line: `want` = `quantity`, `have` = the quantity of the entry with
   this `list_id` and `item_key`, or 0 when the list holds none. Without
   `p_clamp`, any `want > have` -> answer `{ "short": [{ "item", "want",
   "have" }] }` (ordered by `item_key`), change nothing. With `p_clamp`
   and every `have` = 0 -> the same answer.
5. `applied_quantity := least(want, have)`; an entry whose `have` equals
   its line's `applied_quantity` is deleted (answer 37); the rest lose
   their line's `applied_quantity`. When any entry was deleted, `perform
   public.reorder_list(r.list_id, '{}')` (review `plan-B4.1` blocker 3):
   R3's tolerant form renumbers the list by `(position, id)` to
   `0..n-1`, so the owner's next add at the end never shares a position;
   `auth.uid()` is the owner, which `reorder_list` checks. The request
   becomes `applied`, `decided_at = now()`. Answer `{ "applied": true,
   "taken": <sum of applied_quantity> }` (the owner's toast and the
   decided fold, «списано N шт.»). `lists.revision` moves through the
   existing entry trigger; R3's deferred `lists_broadcast` sends one
   `list` message per list at commit, with the caller's `by`.

### 5.5 `decline_purchase_request(p_id uuid) returns void`

`security definer`, `set search_path = public, pg_temp`, `authenticated`
only: steps 1 and 2 of 5.4, then `status = 'declined'`, `decided_at =
now()`.

### 5.6 Events on R3's owner topic (decision "Request events nudge the owner and share topics; each page refetches", amended 2026-09-27: the owner topic only)

`purchase_requests_broadcast()`, a trigger function (`security definer`,
`set search_path = public, pg_temp`, no `execute` grant), trigger
`purchase_requests_broadcast after insert or update of status on
public.purchase_requests for each row`:

- On insert: `realtime.send(jsonb_build_object('list', new.list_id, 'by',
  null), 'request', 'owner:' || v_owner::text, true)`. The header is not
  read on insert (review `plan-B4.1` risk 2): a requester's page sends
  its own tab id on every PostgREST request, and that id would link one
  tab's requests in `realtime.messages` for 3 days; nothing reads `by` on
  an insert.
- On an update where `new.status is distinct from old.status`: the same
  send with `'by', v_by`, the owner tab's id, so the deciding tab ignores
  its own echo.
- Nothing is sent to a share topic: no share page reads a request (section
  13, item 3). An applied request lowers entries, so R3's own
  `revision` message still redraws an open share page.
- `v_by`: the same inline parse as R3's `lists_broadcast()` (settled in
  pass 2): `nullif(current_setting('request.headers', true), '')`, cast
  to `jsonb` inside its own `begin ... exception when others then v_by :=
  null; end`, `->> 'x-dhloot-tab'`, kept only when it matches
  `^[A-Za-z0-9-]{1,40}$`. Rejected: a shared helper function - R3's copy
  is in a shipped migration and would stay; the helper would be one more
  function every harness list has to name.
- The whole body sits in `begin ... exception when others then raise
  warning 'purchase_requests_broadcast: % (%)', sqlerrm, sqlstate; end`,
  as R3's triggers: a send never fails a request or a decision.
- A plain row trigger is enough: one insert or one status change per
  request, and `realtime.messages` is delivered after commit. No new
  `realtime.messages` policy: R3's owner-topic `select` policy covers it;
  no `insert` policy exists.
- A client without R4's code drops the event: R3's owner reader accepts
  only `list` (settled in pass 2).

Quota: a request costs 1 owner send (+1 per owner device) and a decision
1 owner send (+1 per owner device); a session of 20 requests adds about
120 messages to R3's estimate of 2000.

### 5.7 Reversal

Drop the trigger, the trigger function, the three functions and both
tables (lines first); `delete from public.limit_defaults where key in
('request_lines', 'pending_requests_per_list')` (overrides go by `on
delete cascade`). The reversal drops every stored request: requests are
transient (at most an hour pending, a day kept), so nothing is recovered.
The reversibility walk compares the schema and R3's realtime policy
snapshot.

## 6. Design: the client (`B4.2`)

### 6.1 The port

```ts
export interface RequestLine { item: string; qty: number; price: number | null; applied: number | null }
export interface OwnerRequest { id: string; listId: string; audience: ShareAudience; createdAt: string; expiresAt: string; lines: RequestLine[] }
export type RequestSent =
  | { ok: true }
  | { ok: false; error: 'gone' | 'stale' | 'network' | 'refused' }
  | { ok: false; error: 'limit'; key: string; value: number | null };
export type RequestApplied =
  | { ok: true; taken: number }
  | { ok: false; error: 'short'; short: { item: string; want: number; have: number }[] }
  | { ok: false; error: 'decided' | 'expired' | 'network' | 'refused' };
export interface RequestRepository {
  /** The signed-in owner's pending requests over all lists, lines included; expired rows too (the caller hides them by `expiresAt`). */
  list(): Promise<{ ok: true; requests: OwnerRequest[] } | { ok: false }>;
  /** `id` is made by the caller; the same id again is a replay that inserts nothing and answers ok. */
  send(id: string, token: string, lines: { item: string; qty: number }[]): Promise<RequestSent>;
  apply(id: string, clamp: boolean): Promise<RequestApplied>;
  decline(id: string): Promise<{ ok: true } | { ok: false; error: 'decided' | 'expired' | 'network' | 'refused' }>;
}
```

`CloudPort` gains `requests: RequestRepository`. Real (`supabase.ts`):
`list()` is one PostgREST select of `purchase_requests` with
`status=eq.pending` and the embedded lines; the rest are `rpc(...)` calls.
`send`, `apply` and `decline` go through R3's `timed()` (20 s abort,
**[B3.2]**); reads get no timeout, as R3's S7. Every call is a PostgREST
request, so it carries the tab header (R3's S1, **[B3.2]**). Pure parsing
and the error mapping live in `app/src/lib/requests.ts`.

### 6.2 Where state lives

- Nothing of a request is stored on the requester's side: no
  `sessionStorage` key, no `env.session` port (pass 1's
  `dhloot.requests.v1` and `env.session` are dropped with the status
  block, section 13 item 3).
- `app/src/state/requestSender.svelte.ts`, class `RequestSender` (the
  requester): `sending` (a send runs), `send(token, lines)` (the toast
  and the selection clear on success, the error toast on a refusal). The
  request id comes from `env.cloud.lists.newId()` once per selection and
  is kept after a `network` answer, so the user's second press after a
  timeout is a replay (5.2 step 3), not a second request; it is dropped
  after success, after any other refusal, and when the selection changes.
  `asking` (flow b's open question, `{ token, lines } | null`), `answer(send:
  boolean, remember: boolean)`. It reads no feed and no poll.
- `app/src/state/ownerRequests.svelte.ts`, class `OwnerRequests` (the
  owner): `byList`, `pendingCount(listId, now)`, `decided` (this page
  load), `read()`, `apply(id, clamp)`, `decline(id)`, `remoteChange()`
  (coalesced `COALESCE_MS`, the `CloudLists` pattern, **[B3.2]**). Read
  once the account's first read ends (beside `lists.watch`, **[B3.2]**),
  on the owner feed's `request` event (its `by` equal to `events.tab`
  ignored), on the owner feed's join and safety refetch, after the
  owner's own apply or decline, on the 45 s poll while the owner feed is
  not `live` on the routes `#pollLists` already reads, and on the
  shown-again signal.
- **Apply and the write buffer.** `OwnerRequests.apply` first awaits
  `cloudLists.flushNow()`; a `false` answer (a write waits for the
  network) stops with the save-failed toast and sends nothing, so a
  buffered quantity edit never lands after the apply. After `{ ok: true
  }` it awaits `cloudLists.refresh()`: R3's `list` message for the apply
  carries this tab's `by`, which `CloudLists` ignores as its own echo
  (settled in pass 2).
- **A replayed decision (review `plan-B4.1` risk 4).** R3's transport can
  send `apply_purchase_request` or `decline_purchase_request` twice; the
  replay answers `request: decided`, although this tab made the decision.
  `OwnerRequests` therefore maps `decided` after this tab's own `network`
  answer or timeout for the same request to a quiet re-read, with no
  «Этот запрос уже решён на другом устройстве.» toast; the data is
  already right. `expired` keeps its toast: an expiry is real.
- **Feed routing [B3.2].** One `LiveFeed` per topic stays the rule.
  `CloudLists`'s `live` constructor option gains `requests?: {
  message(event: string, payload: unknown): void; refetch(): void }`; the
  owner feed's `message` handler passes every message to it as well, and
  its `refetch` calls it too. `OwnerRequests` implements it; `SharedView`
  is not touched. `lib/live.ts` gains `readRequestMessage(event,
  payload): { list: string; by: string | null } | null` - `event ===
  'request'`, `list` a string `isCloudId` accepts, `by` a string or null;
  Realtime's `id` key ignored; anything else `null`.
- `lib/prefs.ts`: unchanged. Flow b reads `app.notifyGm` and writes
  `app.setNotifyGm` (R5b `B5b.1`, verified at `1cbca5f7`).

### 6.3 The screens (mocks: `mocks/index.html`)

Each mock is one self-contained HTML file with the app's tokens and
component rules inline, every state at 960 px and 360 px side by side;
the dashed violet outline marks what is new. Open them from disk (the
thumbnails load from `img/thumb/`).

- **Send** (`mocks/send.html`): «Сообщить владельцу» / "Notify the owner"
  in the selection bar of a `#/s/` page (`app.route.kind === 'share'`,
  the view `ready`) for every reader but the owner (`app.sharedView.mine`
  null), after «Скопировать». At 600 px or less it takes its own line, as
  the add menu does. One term, «владелец списка» / "the list's owner", in
  both flows: a GM-link holder is a GM too, so «мастер» would be
  ambiguous. Lines = the ticked item ids with their taken counts. While
  the call runs the button reads «Отправляем...» and is disabled. Success:
  the selection clears and the toast «Запрос отправлен владельцу
  списка.»; nothing is stored. Refusals, as error toasts with the selection kept:
  «Слишком много запросов по этой ссылке: подождите минуту.»
  (`request_rate`); «У владельца уже 10 запросов без ответа. Попробуйте
  позже.» (`pending_requests_per_list`, with the limit's value);
  «Список изменился. Проверьте выбор и отправьте снова.» (`stale`, the
  page re-reads); «Не получилось отправить. Проверьте соединение.»
  (`network`); `request_lines` through `limitText`; `gone` draws the
  shipped «Список больше не доступен» page.
- **After the send** (`mocks/status.html`; owner's feedback 2026-09-27,
  section 13 item 3): no status block. The page stays the shipped shared
  page; the send's toast is the only confirmation. An applied request
  lowers or removes the entries it took, and the open page redraws that
  through R3's live path (or the poll) like any owner edit **[B3.2]**. The
  player does not learn that a request was declined or expired, nor which
  request an entry change came from. Pass 1's strings «Ваши запросы
  владельцу», «ждёт ответа», «принят», «принят частично: N шт.»,
  «отклонён» and «истёк без ответа» are dropped.
- **Owner panel** (`mocks/owner-panel.html`): `RequestsPanel.svelte` on
  an account list page, after the action row and its `SharePanel`,
  before the browser-list notices and the money row; drawn while a
  pending unexpired request or a decision of this page load exists;
  «Запросы (N)», each request with audience, age and time to expiry, its
  lines (name through the catalog index, «×want из have», line sum), the
  total (`totalParts`), «Принять» and «Отклонить»; a short answer shows
  «Не хватает: ...» (`role="alert"`) and «Принять доступное»; «Решённые в
  этот раз (N)» folded, each decided line «принят», «принят: списано N
  шт.» or «отклонён». Toasts: «Запрос принят», «Запрос принят: списано N
  шт.», «Запрос отклонён»; refused: «Этот запрос уже решён на другом
  устройстве.» (`decided`), «Этот запрос истёк: прошёл час без ответа.»
  (`expired`). A new request is announced once by a hidden polite region,
  «Новый запрос».
- **Index** (`mocks/index-card.html`): one gold line on the card, «2
  запроса ждут ответа», inside the card's link; `ListCard.svelte`'s
  `aria-label` gains the same text, because it replaces the link's
  content for a screen reader.
- **Flow b** (`mocks/flow-b.html`): after a successful add from a `#/s/`
  page's bar (`AddToList` with `key="sel"`), signed in, not the owner,
  `notifyGm` `ask`: the bar's action row is replaced by «Сообщить
  владельцу списка, что вы взяли эти предметы?», «Сообщить», «Не
  сообщать», «Запомнить ответ». `always` sends and extends the add toast
  («... Владелец получил запрос.»); `never` does nothing. The item card's
  own menu never asks.
- **Display row** (`mocks/display-row.html`; owner, 2026-09-27; replaces
  R5b's wording): the fifth row of «Отображение» on `#/account` is
  labelled «Добавление из чужого списка» / "Adding from someone else's
  list", with the answers «Спрашивать» / «Сообщать владельцу» / «Не
  сообщать» ("Ask" / "Notify the owner" / "Don't notify") and, under
  them, the hint «Когда вы добавляете предметы из чужого списка в свой,
  сообщить об этом его владельцу?» / "When you add items from someone
  else's list to yours, notify its owner?". The planner decides the
  owner's optional hint: drawn, because the label alone does not say what
  is notified. The values and the key stay (`ask`, `always`, `never`;
  `notifyGm`). The control is a select at every width, as the «Раздел при
  запуске» row (owner, 2026-09-27, section 13 question 2): the segmented
  control does not fit the owner's wording at 360 px (measured in the
  mock: 307 px needed in a 288 px row, each button on two lines).

Texts in English follow `I18N.md` parity; the plan's Russian strings are
the proposal the review may change, except the Display row, which is the
owner's text.

### 6.4 The fake cloud and layer 2

- The fake seed gets no requests: the default goldens stay as they are.
  A state or a test makes requests through the driver.
- `fake-cloud.ts` implements the repository with the database's rules
  (the client id and its replay, lines check, stale item, rate 5 per
  share per minute on the fake's clock, pending cap 10, expiry, apply by
  `item_key` with short, clamp, zero removal and the position renumber,
  decline) and sends R3's fake events **[B3.2]**: `request` with `{ list,
  by }` on the owner topic on a send and a decision; an apply bumps the
  list's revision and sends `list` and `revision` as the fake's `apply`
  does. `window.__dhlootFake` gains `request(token, lines)` (a request
  from another reader, `by: 'other-device'`, answers the new request's
  id) and `decide(id, 'applied' | 'declined')` (the owner acting on
  another device).
- `cloud.contract.ts` gains case K "the purchase requests" **[B3.2]**
  (J is R3's), run on the fake (layer 1) and the real adapter (layer 4):
  send through a token, a replay with the same id, the owner's list,
  apply refused short, clamp, decline, the rate refusal. K runs before
  case E (delete the account), which runs last; it uses R3's `joinLive`,
  `joinOnce` and `waitFor` helpers where it needs the owner topic.

### 6.5 Policy text (both languages, `B4.2`)

`privacy.html`, first bullet: «Если вы не входите в аккаунт, на сервере о
вас не хранится ничего, кроме запросов владельцу списка (ниже); они не
связаны ни с вами, ни с вашим устройством.» New `<h3>Запросы владельцу
списка</h3>`: «Любой, у кого есть ссылка на список, может отправить его
владельцу запрос на выбранные предметы. Запрос хранит предметы, их
количество, вид ссылки (для игроков или для мастера) и время отправки;
имени, почты, аккаунта и IP-адреса отправителя в нём нет. Supabase, как и
GitHub, получает обычные технические данные каждого запроса к серверу.
Запрос без ответа истекает через час. Через сутки после ответа или
истечения запрос удаляется при следующей отправке любого запроса; вместе
со списком или аккаунтом владельца - сразу. В браузере отправителя о
запросе ничего не сохраняется.» `terms.html`, under «Что нельзя» or its own paragraph:
«Запрос владельцу списка - это сообщение, а не заказ и не сделка:
владелец сам решает, принять его или нет.» English in parity; the "Last
changed" line moves to the batch's date.

## 7. Laws, contracts and specs

- Public contracts: none change. No route, no fixture, no `llms.txt` line
  (`#/s/` already exists; requests are behaviour on it).
- Specs in `B4.2`: `FEATURES.md` "Account and browser lists" (send and
  its toasts, no status for the requester, the panel, apply and decline,
  the index line, flow b, the limits bullet) and "Account" (the Display
  row's new wording, its select and the hint); `STATE.md` ("Account
  preferences" names the reworded row; no new storage key);
  `META.md` section 3 (the first anonymous write and its bounds);
  `I18N.md` (strings, `запрос` plurals); `COVERAGE.md`.
- `B4.1`: `COVERAGE.md`, the `tests/db/` paragraph only.

## 8. Tests by layer

- **Layer 1** (vitest): `lib/requests.ts` (parse, error map, totals,
  plural); `readRequestMessage` in `live.test.ts`; `RequestSender` (the
  toast and the cleared selection, each refusal's toast with the
  selection kept, the same id reused after a `network` answer and a new
  one after success or a changed selection, the flow b question and its remembered answer, nothing
  written to any storage); `OwnerRequests` (echo ignored, coalescing,
  expired hidden, short then clamp, decided fold, flush before apply,
  re-read of the lists after it, `decided` after this tab's own
  `network` read quietly with no toast, a decision on another device removing
  the request from the pending list without a reload); the real adapter
  against a stubbed client (select shape, RPC names and arguments, error
  mapping, the write timeout on send, apply and decline); the fake; the
  contract case K; `requestsPanel.test.ts`, `selBar` send and flow b,
  `listCard` line and label, `accountPage` reworded row (the select and
  the hint in both languages) - each ending with
  `expectNoA11yViolations`, the open short state included.
- **Layer 2** (`tests/app/`, `dist-test/`): new inventory states `#/s/
  player-token-1 ~ ticked` (signed out, the notify button), `~ notify
  question as gm2`, `SHOP ~ requests as gm1` and `SHOP ~ short as gm1`
  (requests made by `__dhlootFake.request`), `#/lists ~ requests as gm1`
  (the card line); re-seeded: the four signed-in `#/account` goldens
  (the reworded row as a select). Pass 1's `~ request sent` state is
  dropped: after a send the page is the unchanged `#/s/player-token-1`
  golden plus a toast. States cases, numbered after R3's 52 and 53
  **[B3.2]**: a live `request()` adds to the open panel and the index line
  without a reload; `setLive(false)` then `request()` shows nothing until
  the tab is shown again; a send clears the selection and toasts; apply
  within stock lowers a row's quantity and removes the row at zero, and
  an open `#/s/` page of that list redraws it live; the sixth send in a
  minute toasts the rate text; `notifyGm: 'always'` sends without asking.
- **Layer 3** (`check:db`): section 10's cases.
- **Layer 4** (`npm run e2e`, test project): contract case K on the real
  adapter; F12 **[B3.2]** (F11 is R3's): a signed-out page sends on a
  player link; the owner's page shows it within 10 s; apply lowers the
  entry (admin read), and the signed-out page draws the lowered quantity
  within 10 s; an anon `select` on both tables is refused.

## 9. Batches: gates, cost, review, split criterion

Costs: this host, from `.claude/README.md`, "Batch size and the fixed
cost of a run" (2026-09-27: `npm run check` 400-600 s, one call;
`check:db` with Realtime, Auth and Kong 545 s; `app/states` 254-299 s; a
golden shard 186-201 s; `sweep.js 360` 430 s; `npm run e2e` 104-117 s
before R3's F11 and case J; `check:built` 23 s).

| Batch | Goal | Gates (cost) | Review | Split criterion |
|---|---|---|---|---|
| `B4.1` | section 5: tables, RLS, the three functions, the event trigger, the limit rows, reversal, layer 3 | `rtk npm run check` (~10 min), `npm run check:db` x2 with one re-run (~20 min); after the approve: `db-push --project test` and `npm run e2e` (~5 min) - about 35-40 min | required: a migration, SECURITY DEFINER functions (`orchestrate.prompt.md`, "When to run reviewer") | new release (R4); a commit the harness cannot reach otherwise: `B4.2`'s E2E needs `B4.1`'s migration on the test project, pushed only after `B4.1`'s approve ("Schema batches") |
| `B4.2` | section 6: port, fake, stores, the send, the panel, the index line, flow b, the Display row, policy text, specs, layers 1, 2 and 4 | `rtk npm run check` x2 (~20 min), `build:test` + `check:built` (~1 min), `app/states` (~5 min), `app/print,app/contracts,app/typo,app/hues,stub` (~7 min), goldens compare, re-seed, compare (~20 min), `sweep.js 360` (~8 min, the panel and the Display row at phone width), `npm run e2e` (~4 min) - about 65-70 min | required: new UI, a new port member, policy text | - |

Total gate cost, one green pass per batch: about 105-110 minutes, plus
the closeout's CI watch (about 5 minutes). Not split further: `B4.2`'s
requester and owner halves share the port, the fake, the `#/s/` and
`#/lists` states and one filter group, so the README's test says merge.
Named fallback only: if the reviewer cannot hold `B4.2` in one pass, the
remediation splits it at port, fake, contract and stores first, screens
second - two amends of the one commit.

## 10. Batch `B4.1` - the database half (implement-ready)

**Objective.** Section 5 in one migration, proven by layer 3.

**Prerequisite.** R3 is closed and pushed (its closeout squash or push
is on `origin/main`); the batch starts from that `main`. `B4.1` uses no
`B3.2` code; step 1 re-reads the shipped R3 migration only to confirm
pass 2's facts.

**In scope.** The migration and its reversal;
`tests/db/purchase-requests.test.mjs` (new); the four pinned layer 3
lists (`harness.test.mjs`, `limits.test.mjs`, `usage.test.mjs`,
`restore-drill.test.mjs`); `docs/specs/COVERAGE.md` (the `tests/db/`
paragraph); one runbook line in `.claude/README.md` (review `plan-B4.1`
risk 7); the decision index if a decision file changes.

**Out of scope.** Any `app/`, `tests/app/` or `tests/e2e/` file (`B4.2`);
`FEATURES.md` (the behaviour ships with the screens in `B4.2`); pushing
to production (CI's, at closeout); a code change to the restore tools
(the runbook line is the fix this release pays; section 14).

**Files.**

| File | Change |
|---|---|
| `supabase/migrations/<ts>_purchase_requests.sql` | new; `<ts>` later than every file in `supabase/migrations/` when the batch starts (today the newest is `20260927120000_realtime.sql`; use `20260928120000` unless a later file exists) |
| `supabase/reversals/<ts>_purchase_requests.sql` | new (section 5.7) |
| `tests/db/purchase-requests.test.mjs` | new, the cases of step 4 |
| `tests/db/harness.test.mjs` | `EXPECTED_ANON_FUNCTIONS` = `['create_purchase_request(uuid,text,jsonb)', 'get_shared_list(text)']` - `regprocedure` text has no space after a comma; the query orders by that text; the comment above it names the new exception ("a share link opens signed out, and its holder sends a purchase request") |
| `tests/db/limits.test.mjs` | "hold the two defaults" becomes "hold the four defaults": `['entries_per_list=100', 'lists_per_owner=50', 'pending_requests_per_list=10', 'request_lines=100']` |
| `tests/db/usage.test.mjs` | `PUBLIC_TABLES` gains `'purchase_request_lines'` and `'purchase_requests'` in sorted place (after `lists`, before `usage_snapshots`); the seeded-row map is unchanged (0 for both) |
| `tests/db/restore-drill.test.mjs` | the reset case's seed: `['entries_per_list=100', 'lists_per_owner=50', 'pending_requests_per_list=10', 'request_lines=100']`; the dump case keeps the dump's two values (the truncate empties the table) |
| `docs/specs/COVERAGE.md` | the `tests/db/` paragraph: "the two listed exceptions, `get_shared_list(text)` and `create_purchase_request(uuid,text,jsonb)`"; `limits.test.mjs` "the four defaults"; one sentence for `purchase-requests.test.mjs` and what it proves |
| `.claude/README.md` | "Restore production (owner)": one step after the load - a dump older than a migration that seeds `limit_defaults` lacks its keys (R4 adds `request_lines` and `pending_requests_per_list`), and every call that reads a missing key raises `unknown limit key`; re-insert each missing key at its migration's default (`insert ... on conflict (key) do nothing`), with the check query that lists the keys |

**Steps.**

1. Read `supabase/migrations/20260927120000_realtime.sql` and
   `tests/db/realtime.test.mjs` on the batch's base: confirm the event
   names (`list`, `revision`), the inline header parse of
   `lists_broadcast()`, the tolerant `reorder_list(uuid, uuid[])` (an
   empty array renumbers by `(position, id)`), and the helpers
   `commitAs`, `realtimePartition` and the `rowsOf` shape. If R3 shipped a
   header helper after all, call it instead of the inline parse and say
   so in the handoff.
2. Migration, in this order: the head comment (cites `docs/specs/FEATURES.md`,
   "Account and browser lists" and the decision "Purchase requests are
   written only by a bounded function any link holder calls"); the two
   `limit_defaults` rows; the two tables with the checks and indexes of
   5.1 (a client-made `id` with no default; no `entry_id`); RLS on both,
   `revoke all ... from public, anon, authenticated`, `grant select ... to
   authenticated`, the two `select` policies
   (`purchase_requests_owner_select`, `purchase_request_lines_owner_select`,
   `to authenticated`); `grant select, delete on both tables to
   service_role` (its default `REFERENCES`, `TRIGGER` and `TRUNCATE` stay,
   5.1); the three functions of 5.2, 5.4 and 5.5 with `set search_path =
   public, pg_temp`; `revoke execute ... from public, anon, authenticated`
   on all three, then `grant execute` on `create_purchase_request(uuid,
   text, jsonb)` to `anon, authenticated`, and on
   `apply_purchase_request(uuid, boolean)` and
   `decline_purchase_request(uuid)` to `authenticated`; the trigger
   function of 5.6 (`revoke execute ... from public, anon,
   authenticated`) and its trigger. One-line comments only where the code
   cannot say why: the advisory lock, the replay (a client id because the
   transport may resend), the housekeeping's place just before the insert,
   why `expires_at` is not generated, the entry lookup by `item_key`
   (an undo re-adds an entry under a new id), the renumber after a delete,
   `by` null on insert, and why the header parse sits in its own block
   (R3's reason: `''::jsonb` raises).
3. Reversal (section 5.7).
4. `tests/db/purchase-requests.test.mjs` (node:test; header comment names
   what the suite proves and cites `FEATURES.md` "Account and browser
   lists" and the decision above). Three worlds:
   - Rolled-back cases (`asRole` with `setup`, the `list-shares.test.mjs`
     world): A owns list LA with entries ci1 (qty 2, price 150, position
     0), q1 (qty 1, position 1), cc1 (qty 5, price 20, position 2); an
     active player share and an active GM share with 43-character tokens;
     a stopped share; A's second list LA2, empty; B is another user with
     list LB, which holds its own ci1. Time-dependent rows are inserted by the setup as `postgres` with
     explicit `created_at`, `expires_at`, `decided_at`. Every send passes
     a fresh `crypto.randomUUID()` unless the case says otherwise.
   - Committed cases for the events (`commitAs`, `before` awaits
     `realtimePartition(sql)`), the `realtime.test.mjs` `withWorld`
     pattern: commit the world, read `realtime.messages` as `postgres`
     (`select event, payload - 'id' as payload ... where topic = $1 order
     by inserted_at, id`), delete the users in a `finally`.
   - The concurrency case (review `plan-B4.1` risk 9): two `postgres`
     connections (`connect()` twice) over a committed world, deleted in a
     `finally`.
   Cases, each titled by its behaviour:
   - grants (review `plan-B4.1` risk 1): the privilege set on both tables
     pinned for `anon`, `authenticated` and `service_role` as
     `list-shares.test.mjs` pins it - `authenticated: SELECT` and
     `service_role: DELETE, REFERENCES, SELECT, TRIGGER, TRUNCATE`, `anon`
     nothing; an `authenticated` direct insert is refused (`42501`).
   - functions (review `plan-B4.1` risk 1): for
     `create_purchase_request(uuid,text,jsonb)`,
     `apply_purchase_request(uuid,boolean)`,
     `decline_purchase_request(uuid)` and `purchase_requests_broadcast()`,
     the pinned `{ anon, authed, service, prosecdef, proconfig }`:
     `prosecdef` true and `proconfig` `['search_path=public, pg_temp']`
     for all four; EXECUTE for `anon` and `authenticated` on the first,
     `authenticated` only on apply and decline, nobody on the trigger
     function; `service_role` none.
   - `anon` sends through a player token and through a GM token; the row
     has the given id, records the audience, `expires_at` = `created_at`
     + 1 hour, and each line its `price_coins`; the call answers nothing
     (a void result); an `authenticated` other user sends too.
   - replay (review `plan-B4.1` blocker 1): the same id and token again
     answers success and inserts no row and no line; five sends then a
     replay of the fifth passes the rate (it is not counted); a replay at
     the pending cap passes; the same id on the other share of the same
     list, and on B's share, is `P0002` `request: unknown link` and
     changes nothing; a null id is `22023` `request: bad id`.
   - a null, malformed, unknown or stopped token -> `P0002`, message
     `request: unknown link`, the same for all four.
   - bad lines -> `22023` `request: bad lines`: not an array, empty, a
     non-object element, `qty` 0, 100, 1.5 and `"2"`, a repeated item, a
     body over 32768 bytes; a line with extra keys (`price`, `entry`) is
     accepted and the stored price is the entry's.
   - an item not on the list -> `22023` `request: stale`.
   - `request_lines`: an override of 2 for A refuses 3 lines with `limit:
     request_lines`, detail `2`; an override of null allows them.
   - rate: five sends on one share pass, the sixth is `limit:
     request_rate`, detail `5`; a send on the other share of the same
     list passes; five rows 61 s old do not count.
   - pending cap: ten pending unexpired rows refuse the eleventh with
     `limit: pending_requests_per_list`, detail `10`; an expired pending
     row and a decided row do not count; an override of 11 lets one more
     through.
   - concurrency (review `plan-B4.1` risk 9): A's override
     `pending_requests_per_list = 1`; connection 1 opens a transaction and
     sends; connection 2 sends in its own transaction and waits on the
     list lock; connection 1 commits; connection 2 is refused `limit:
     pending_requests_per_list`, detail `1`; exactly one row exists.
   - housekeeping (review `plan-B4.1` risk 3): a successful send deletes
     rows (any list) decided or expired more than 24 hours ago, with
     their lines, and keeps one decided 23 hours ago; a refused send (bad
     lines) deletes nothing.
   - the owner selects the list's requests and lines; B selects none;
     `anon` is refused.
   - apply within stock: quantities drop by the request,
     `applied_quantity` is set, status `applied`, `decided_at` set, the
     answer `{ applied: true, taken: <sum> }`; an entry taken whole is
     deleted, and the list's positions read `0..n-1` after it (review
     `plan-B4.1` blocker 3; LA's middle entry q1 taken whole leaves ci1 0
     and cc1 1).
   - apply over stock: `{ short: [...] }` with `item`, `want`, `have`
     exactly, and no row changed (compare entries and the request before
     and after); with `clamp`: each line takes what is there, a line whose
     item the list no longer holds takes 0; clamp with nothing anywhere
     answers `short` and changes nothing.
   - apply finds the entry by its item (review `plan-B4.1` blocker 2): an
     entry deleted and re-added under a new id before the apply is found
     and lowered; an entry the owner moved to LA2 (`update list_entries
     set list_id`, which the owner's policy allows) is not touched, and
     the line reads `have` 0 as short; B's own ci1 is
     never touched.
   - apply or decline by B -> `42501`; by `anon` -> permission denied
     (`42501`); twice -> `request: decided`; past `expires_at` ->
     `request: expired`.
   - decline sets `declined` and changes no entry.
   - deleting the list deletes its requests and lines.
   - events (committed): a send writes one `request` row for `owner:<A>`
     with `{ list, by: null }`, also when the send's transaction set
     `request.headers` to `{"x-dhloot-tab":"tab-9"}` (review `plan-B4.1`
     risk 2); a decision writes one to `owner:<A>`, and a decision made
     with `request.headers` set to `{"x-dhloot-tab":"tab-1"}` carries
     `by: 'tab-1'`, a malformed tab `null`; no `request` row goes to any
     `share:` topic; no row names `owner:<B>`; an apply also writes R3's
     one `list` row for `owner:<A>` (the entry change).
5. `harness.test.mjs`, `limits.test.mjs`, `usage.test.mjs` and
   `restore-drill.test.mjs` as in the file table.
6. `COVERAGE.md`; the `.claude/README.md` runbook line; `node
   tests/derived.js`. The decision files are already in place (planning
   pass 2 wrote "A requester sees no request status; the send toast is
   the only answer" and its pointers); change them only if the batch
   deviates.
7. Commit: the task's first commit, `feat(persist): store purchase
   requests from share links` (body per `CLAUDE.md`; footer `Task:
   persist-4-requests`); no push.
8. After the review approves (orchestrator resumes the implementer once,
   `orchestrate.prompt.md`, "Schema batches"): `node
   --env-file=.env.test.local tools/supabase/db-push.mjs --project test
   --yes`, then `npm run e2e` (the existing flows stay green: the change
   is additive), then the handoff amend.

**Acceptance.**

- `npm run check:db` passes; every case of step 4 is in its output.
- `anon` executes exactly `create_purchase_request(uuid,text,jsonb)` and
  `get_shared_list(text)` (harness).
- The table privileges and the four functions' `prosecdef`, `proconfig`
  and EXECUTE are pinned as step 4 says.
- A replay with the same id and share inserts nothing, answers success
  and counts toward no bound; the same id on another share is refused
  with the generic answer (review `plan-B4.1` blocker 1).
- Every bound of section 5.2 is refused inside the function, with the
  messages and details above; the client can map each one; a refused
  call deletes nothing (the housekeeping runs only before an insert).
- A send answers nothing: no database-made id, key or list data reaches
  the caller.
- Apply finds stock by `list_id` and `item_key`, locks it in `id` order,
  and finds an entry re-added under a new id (review `plan-B4.1`
  blocker 2).
- After an apply that deletes an entry the list's positions are `0..n-1`
  (review `plan-B4.1` blocker 3).
- An over-stock apply changes no row; a clamp and a zero entry behave as
  section 5.4 says.
- Two concurrent sends at the pending cap: one row, one refusal.
- The events: `request` on the owner topic for a send (`by` null, header
  or not) and a decision (`by` from the header); nothing from R4 on a
  share topic.
- The reversal passes the up-down-up gate and the walk; the two limit
  rows go with it.
- No `insert` policy on `realtime.messages` and no new `realtime` policy
  (`realtimePolicies` unchanged).
- The four pinned lists (`EXPECTED_ANON_FUNCTIONS`, the limit defaults,
  `PUBLIC_TABLES`, the drill's reset seed) name the new rows.
- `COVERAGE.md`'s `tests/db/` paragraph names the new exception, the
  four defaults and the new suite.
- `.claude/README.md`, "Restore production (owner)", has the re-seed step
  for missing `limit_defaults` keys (review `plan-B4.1` risk 7).
- `node tests/derived.js` passes; `B4.1` changes no `app/` file.
- After the approve: the migration is on the test project and `npm run
  e2e` passes; the handoff records both.

**Verification.** `rtk npm run check` (Bash tool, one foreground call,
timeout 600000); `npm run check:db` (PowerShell tool, alone, timeout
600000). About 30 minutes with one re-run; the push and `npm run e2e`
after the approve about 5 more.

**Review.** Required: a migration, SECURITY DEFINER functions, RLS
policies, and the first anonymous write.

**Risks and do-nots.** Do not give `anon` a table grant. Do not trust a
client value for price, audience, expiry or entry: the function reads
them. Do not change a shipped migration (R3's `lists_broadcast()` and
`reorder_list()` included; apply calls `reorder_list`, it does not
replace it). Do not add a `realtime.messages` policy. Do not send a
token or a line on any topic, and do not send on a share topic. Do not
read the tab header on insert. Do not push to the test project before
the approve.

## 11. Batch `B4.2` - the client half (outline; expanded after `B4.1` and the section 16 check)

**Objective.** Section 6 in the app, the fake and layer 4, with the
reworded Display row and the policy text.

**Scope.** `ports/types.ts`, `ports/supabase.ts` **[B3.2]**,
`ports/lazy-cloud.ts` **[B3.2]**, `ports/fake-cloud.ts` **[B3.2]**,
`ports/cloud.contract.ts` (case K) **[B3.2]**, `lib/requests.ts` (new),
`lib/live.ts` (`readRequestMessage`) **[B3.2]**, `lib/cloudLists.ts`
(`limitText` for `request_lines`, `pending_requests_per_list` and
`request_rate`), `lib/dict.ts`, `state/requestSender.svelte.ts` (new),
`state/ownerRequests.svelte.ts` (new), `state/cloudLists.svelte.ts` and
`state/app.svelte.ts` (the `requests` feed option, construction,
`#setUser`, the poll, the shown-again handler) **[B3.2]**; components
`SelBar.svelte`, `AddToList.svelte`, `ListPage.svelte`, `ListCard.svelte`,
`RequestsPanel.svelte` (new), `AccountPage.svelte` (the Display row),
their tests; `tests/app/inventory.js`, `states.js` **[B3.2]**, goldens;
`tests/e2e/flows.mjs` (F12), `contract.mjs` **[B3.2]**, `admin.mjs` (read
an entry's quantity; read a list's requests); the four policy pages;
specs (section 7).

**Display row edits** (owner, 2026-09-27; fixed text): `dict.ts` ru
`displayNotify: 'Добавление из чужого списка'`, `notifyAlways: 'Сообщать
владельцу'`, `notifyNever: 'Не сообщать'`, new `notifyHint: 'Когда вы
добавляете предметы из чужого списка в свой, сообщить об этом его
владельцу?'`; en `displayNotify: "Adding from someone else's list"`,
`notifyAlways: 'Notify the owner'`, `notifyNever: "Don't notify"`,
`notifyHint: "When you add items from someone else's list to yours, notify
its owner?"`; `notifyAsk` unchanged. `AccountPage.svelte` (owner,
2026-09-27, section 13 question 2, A): the notify row's `Seg` becomes
`<label class="setname" for="display-notify">{t.displayNotify}</label>`
and `<select id="display-notify">` with one `<option>` per answer
(`ask`, `always`, `never`, labelled `notifyAsk`, `notifyAlways`,
`notifyNever`), `value={app.notifyGm}`, `aria-describedby="display-notify-hint"`,
and an `onchange` that narrows `e.currentTarget.value` to `NotifyGm`
(one of the three, else nothing) before `app.setNotifyGm`, as the
«Раздел при запуске» row at every width; the `notify` options array
stays, the `Seg` import stays for the other three rows. Then `<p
id="display-notify-hint" class="hint sethint">{t.notifyHint}</p>` with
`.sethint { flex: 1 1 100%; margin: 0; }` written after `.hint` in the
style block (both are one class; `.hint` sets `margin: 10px 0 0`)
(`mocks/display-row.html`, state 2). `accountPage.test.ts`: the four
places that read the old row (the English group name "Notify the list
owner", `pressed(d, 'Сообщать владельцу списка')` and the clicks on
«Всегда» and «Никогда») read the select by its label «Добавление из
чужого списка» and choose `always` and `never`; one case proves the
hint in both languages. `FEATURES.md` "Account", the Display
section's fifth row, with the hint; `STATE.md` "Account preferences"
names the row by its new label. Re-seed the four signed-in `#/account`
goldens.

**Acceptance (placed items are their own lines).**

- A signed-out reader of `#/s/player-token-1` sends the ticked entries;
  the selection clears and the toast says «Запрос отправлен владельцу
  списка.»; nothing is written to `localStorage` or `sessionStorage`; the
  owner's panel shows it without a reload (layer 2 fake, layer 4 real
  within 10 s).
- The share page draws no request status (owner's feedback 2026-09-27);
  an applied request's lowered entries reach an open share page through
  R3's live path.
- Apply within stock lowers the entries and removes one at zero; apply
  over stock shows the short lines and changes nothing; «Принять
  доступное» takes what is there; decline changes no entry.
- Apply sends the write buffer first and re-reads the account's lists
  after it (the own-echo `list` message is ignored).
- Flow b asks once per add, remembers with «Запомнить ответ», sends on
  `always`, stays silent on `never`; the answer persists through
  `user_prefs`.
- The index card line counts pending unexpired requests.
- The Display row reads «Добавление из чужого списка» with «Спрашивать»
  / «Сообщать владельцу» / «Не сообщать» and the hint, English to match,
  as a select at every width (owner, section 13, question 2); the key and
  values are unchanged; no horizontal overflow at 360 px
  (`sweep.js 360`); the four signed-in `#/account` goldens are re-seeded
  for this row alone (owner, 2026-09-27).
- R4 adds no other control to `#/account` (owner, 2026-09-26, section
  13).
- Privacy and terms text in both languages as section 6.5.
- Contract case K passes on the fake and the real adapter; F12 passes.
- Every new file is reached by a test; component tests end with
  `expectNoA11yViolations`, the short state included.

**Gates.** Section 9, `B4.2` row. No `check:db`: `B4.2` changes nothing
under `supabase/` or `tests/db/`; a need to stops the batch.

## 12. Seams with other releases (named, not decided here)

- **R3** (`persist-3-realtime`): R4 adds the event `request` on
  `owner:<uid>` only, a reader in `lib/live.ts`, the `requests` option on
  the owner feed, and one more refetch target for the poll and the
  shown-again signal; the share page uses R3's share feed unchanged; R3's topics, policies, `by` header,
  feed state machine, poll gate and safety re-read are used as built.
- **R5** (`persist-5-migration`, shipped): only the migration timestamp
  order. A migrated local list has no share until its owner makes one.
- **R5b** (`persist-5b-account-menu`, shipped): `notifyGm` in `Prefs`,
  `AppState.notifyGm` and `setNotifyGm`, and the Display row; R4's flow b
  uses them as built and rewords the row (owner, 2026-09-27).
- **`display-settings`** (shipped as `30444209`): the Display lead line
  above the rows; R4 changes the fifth row only.
- **R6** (`persist-6-import-export`): requests are not exported or
  imported; R6 decides whether its bundle states that.
- **R7** (`persist-7-homebrew`): a homebrew entry's line needs a name when
  its entry is gone; R7 decides whether lines carry the snapshot's name.
  R4 lines store `item_key` only.
- **R11** (usage monitoring, shipped): the nightly report counts every
  `public` table's rows, so the two new tables appear in it by
  themselves; `realtime_rows_24h` counts R4's sends. No near-limit row for
  the two new limits; R11's owner decides whether to add one.

## 13. Owner questions and feedback

### Item 3 - the requester's status: decided 2026-09-27 (removed)

Owner's feedback on the mocks, 2026-09-27 (verbatim in `context.md`):
the requester's status block matters little to a player; keeping the
list up to date is the GM's concern. The owner offered two ways: remove
the block, or show it for less time. The planner decided A, the owner's
first suggestion; no owner choice is left open. Decision file: "A
requester sees no request status; the send toast is the only answer".

- **A (chosen): remove it.** The send's toast is the only answer. What
  the player loses: knowing that a request was declined, expired, or
  applied only in part, and which request an entry change came from
  (an applied request still shows as lowered stock on the open page).
  What goes with it: the `status_key` column, `get_purchase_requests`
  (so `anon` gains one function, not two), the share-topic event, the
  `sessionStorage` key `dhloot.requests.v1`, the `env.session` port, the
  status block and its six strings, pass 1's `~ request sent` state, and
  the layer 2 and layer 4 status checks. The anonymous sender keeps no
  request id and no local key.
- B: show only pending requests, one line, until each is decided. It
  keeps every part A removes (the key, the `anon` read, the share event,
  the `sessionStorage` key) for a line that never says the outcome.
- C: one collapsed line with the full statuses. The same machinery as
  pass 1, drawn smaller.

### Question 2 - answered 2026-09-27 (A)

Answer (owner, 2026-09-27): A - a select at every width, as the «Раздел
при запуске» row, with the owner's wording word for word.

The question as asked: the owner's wording does not fit the segmented
control R5b ships for this row at 360 px (measured in
`mocks/display-row.html` on 2026-09-27: 307 px needed in a 288 px row,
each answer on two lines; the shorter «Сообщать» still needs 302 px; at
960 px it fits). A: a select at every width. C: the segmented control
above 600 px, the select at 600 px or less. Shorter answers were not
offered: they still overflow.

### Question 1 - answered 2026-09-26

Answer (owner, 2026-09-26): option A's control, moved - the remembered
answer (`prefs.notifyGm`: ask / always / never) is changed in the
«Отображение» / "Display" section of `#/account`, which R5b's account menu
opens (`docs/specs/FEATURES.md`, "Account"). R4 keeps «Запомнить ответ»
and adds no field to `#/account`. The owner's notes of 2026-09-27 reword
that row (section 6.3, "Display row").

The question as asked: where a reader changes a remembered "notify the
owner" answer (answer 33 stores `always` or `never` once «Запомнить ответ»
is ticked; after that the question is never drawn). A (recommended): one
field on `#/account`. B: no «Запомнить ответ»; ask after every add.

## 14. Risks, assumptions, deferred

- Risk: `create_purchase_request` is the first function `anon` writes
  through. Its bounds are inside it and proven by layer 3; a valid share
  token is its only capability; a leaked link costs at most 5 requests a
  minute and 10 pending on that list, which the owner declines or ends by
  stopping the link («Удалить ссылку», `revoke_list_share`, which sets
  `revoked_at`). The requests a stopped link already sent stay pending
  until they expire and can still be applied or declined.
- Accepted (review `plan-B4.1` risk 10): an anonymous caller learns that
  the list's pending cap is reached, and the owner's `request_lines`
  override value from the refusal's `detail`. Both are harmless, and both
  need a valid token.
- Risk: the pending cap of 10 lets one link holder fill a list's queue
  for an hour. Accepted: the owner declines them or stops the link; a
  new link has its own rate budget but shares the list's cap.
- Accepted (review `plan-B4.1` risk 5): apply locks its entries in `id`
  order, but a concurrent `apply_list_writes` from the owner's other
  device can still deadlock with it (`40P01`); Postgres cancels one, the
  client maps it to `refused`, and the owner presses again.
- Accepted (review `plan-B4.1` risk 6, owner answer 37): an apply cannot
  be undone. An entry taken to zero is deleted with its notes and price;
  nothing restores it but adding the item again by hand. The owner's
  «Принять» is the only confirmation; the panel shows the counts and
  «из N» before the press.
- Accepted (review `plan-B4.1` risk 8): R2's last write wins per entry
  still holds across devices. A quantity write buffered on the owner's
  other device that lands after an apply overwrites the deduction;
  `flushNow` before apply covers only this tab.
- Risk (review `plan-B4.1` risk 7): a backup taken before R4 and
  restored after it truncates `limit_defaults` and loads the dump's two
  rows, so `request_lines` and `pending_requests_per_list` are missing
  and every send raises `unknown limit key` until they are re-inserted.
  R4 is the first release that adds keys after R2's seed. Mitigation in
  `B4.1`: the re-seed step in `.claude/README.md`, "Restore production
  (owner)"; a restore that re-seeds by itself is not planned.
- Consequence of the 1-hour expiry (owner, answer 36): a request the GM
  has not answered within an hour of play is gone from the panel; the
  requester is not told (item 3). Named, not reopened.
- Risk: housekeeping runs only when somebody sends; a quiet project keeps
  decided rows longer than 24 hours. They hold no personal data; the
  privacy text says "at the next request".
- Measured, and settled: the reworded Display row overflows the segmented
  control at 360 px, so it is a select (section 13, question 2).
  `sweep.js 360` is the gate.
- Assumption: R3's `B3.2` ships as its plan section 11 says (`EventsPort`,
  `LiveFeed`, the `live` option of `CloudLists`, the fake's `send`,
  `setLive`, `play`, case J, F11, states 52 and 53). Section 16 checks it
  before `B4.2` is expanded. If the share page stays on the poll (R3's
  anon fallback), an applied request's lowered stock reaches it with the
  poll.
- Assumption: `jsonb` number `1.5` fails the `^[0-9]{1,2}$` text check;
  layer 3 proves it.
- Mocks (pass 2, owner request 2026-09-27): `mocks/index.html`,
  `send.html`, `status.html`, `flow-b.html`, `owner-panel.html`,
  `index-card.html`, `display-row.html`; they replace pass 1's
  `b42-requests.html` with `mock.css` and `r4.css`. Each is
  self-contained; the header chrome is drawn in outline only; a 360 px
  frame cannot fire the app's `max-width: 600px` queries, so those rules
  are written under `.phone`. The design hook may flag low contrast on
  `--muted2` over the washes; those are the app's measured tokens, left as
  they are (R2's triage).
- Deferred: a requester cancel; a notification outside the lists pages;
  a Discord webhook (roadmap decision 40).

## 15. Closeout

- `/handoff` audit; the roadmap's section 5 R4 row, section 9 row,
  section 12 rows and section 17 bullets compacted to the shipped state;
  this directory deleted; one push.
- Owner after the push: send a request from a phone on a player link and
  apply it on a desktop; confirm the privacy page and the reworded Display
  row read right in both languages.

## 16. Delta check after R3 ships (before `B4.2` is expanded)

A short planner pass reads R3's shipped tree and confirms each **[B3.2]**
mark. Each line is a check against `main` after R3's closeout; a
difference changes the named step of `B4.2`, not the design.

| Mark | What `B4.2` uses | Check |
|---|---|---|
| Port | `EventsPort` (`subscribe`, `tab`), `CloudPort.events` | `app/src/ports/types.ts` |
| Tab header | `keepaliveFetch(url, tab)` on `rest/v1` requests (S1), so `rpc` calls carry `by` | `app/src/ports/supabase.ts` |
| Write timeout | `timed()`, `WRITE_TIMEOUT_MS` for `send`, `apply`, `decline` | `app/src/ports/supabase.ts` |
| Readers | `readShareMessage` (`revision` only), `readOwnerMessage` (`list` only), `COALESCE_MS`, `SAFETY_MS`, `isCloudId` use | `app/src/lib/live.ts` |
| Feed driver | `LiveFeed(events, random, { message, refetch })` | `app/src/state/liveFeed.svelte.ts` |
| Share feed | `SharedView` redraws an owner edit live (R4 does not change it; F12 relies on it) | `app/src/state/sharedView.svelte.ts` |
| Owner feed | `CloudLists(repo, say, dict, live?)`, `watch`, `unwatch`, `live`, `#remote`, the echo rule | `app/src/state/cloudLists.svelte.ts` |
| App wiring | construction lines, `#setUser`'s `lists.watch`, `#refreshShared(always)`, `#pollLists` gate, the shown-again handler, `stop()` | `app/src/state/app.svelte.ts` |
| Lazy port | `events` waits for the chunk; `tab` is `''` before it | `app/src/ports/lazy-cloud.ts` |
| Fake | `send(topic, event, payload)`, `TAB = 'fake-tab'`, `setLive`, `play`, `FakeCloudOptions.live`, the seed shares' `topic_key` | `app/src/ports/fake-cloud.ts`, `fake-cloud-seed.ts` |
| Contract | case J and its `joinLive`, `joinOnce` and `waitFor` helpers (confirmed at `94058abd` by review `plan-B4.1`); case E runs last, so R4's case K goes before E | `app/src/ports/cloud.contract.ts` |
| Share page | `data-live` on the status region (F12 waits for it before it sends) | `app/src/components/SharedListPage.svelte` |
| Layer 2 | states cases 52 and 53; the inventory state `#/s/player-token-1 ~ updated live`; the golden count | `tests/app/states.js`, `tests/app/inventory.js` |
| Layer 4 | `portOf(env, session)` in `contract.mjs`; F11 in `flows.mjs`; R4's flow is F12 | `tests/e2e/` |
| Costs | the measured `check`, `app/states`, `app/contracts` and `e2e` times of `B3.2` | `.claude/README.md`, "Batch size and the fixed cost of a run" |
