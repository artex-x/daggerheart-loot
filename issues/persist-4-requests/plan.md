# Plan - TASK persist-4-requests (release R4: purchase requests)

## Status

- Planning pass 1, 2026-09-26, planner, in a worktree cut from `cd1b3b15`
  and fast-forwarded to `c39f3de1` (R3's plan on R2's local task commit
  `da7378cb`). R2's `B2.3` (share panel, `#/s/`, `SharedView`, the poll;
  rotate dropped) is in progress in the main tree and was read there for
  shape only; R3 and R5 are planned, not built.
- Order (roadmap section 9): R2, R5, R3, R4. R4 is dispatched after R3 is
  live, so every step marked **[refresh]** is re-read against `main` at
  that time: R3's `realtime.send` triggers, its `tests/db` Realtime
  helpers, `lib/live.ts`, `LiveFeed`, the owner feed in `CloudLists`, and
  R5's last migration timestamp.
- R3's owner question Q1 is answered yes (owner, 2026-09-26, through the
  orchestrator): the owner's devices join `owner:<uid>`. R3's Q2 (public
  access off) and Q3 (a 5-minute safety re-read while live) are yes too.
  This plan builds on those answers; there is no "no" branch.
- NEEDS_HUMAN_CONFIRMATION: no - the owner answered section 13 on
  2026-09-26: the remembered answer is changed in «Настройки отображения»
  / "Display settings", the section R5b's account menu opens, not in a
  field R4 adds to `#/account`.
- Batches: `B4.1` (database) - implement-ready apart from the [refresh]
  marks; `B4.2` (client) - outline with the design settled; closeout.
- Roadmap: `issues/persistent-storage/plan.md` sections 3, 5, 12, 14, 16
  (answers 32-38), 17. This file is R4's authority where they differ.

## 1. Objective and current state

Goal: anyone holding a player or GM link of an account list can send the
list's owner a request for the entries they ticked, with the taken counts;
a signed-in reader who adds that selection to their own list is asked
whether to send it too; the owner sees the requests live on the list page
and a count on the lists index, and applies (stock deducted in one
transaction) or declines; the requester sees the outcome.

State the plan builds on (`c39f3de1` plus `B2.3`, R5 and R3 as planned):

- `lists`, `list_entries` (`unique (list_id, item_key)`, `quantity` 1..99,
  `price_coins` null or 1..99999), `list_shares` (`audience`, `token`,
  `topic_key`, `revoked_at`); the owner reads its stopped shares; a link is
  replaced by delete, then create (R2 context, "No rotate button").
- `limit_defaults`, `user_limit_overrides`, `effective_limit(user, key)`;
  limit triggers raise `limit: <key>` with `detail` = the value.
- The shared page draws the projection by item id: `app.sel` holds item
  ids, `app.picked` the taken counts, `app.shared.meta` the stock and price
  (`SharedListPage.svelte`, `SelBar.svelte`). An item id is an entry's
  `item_key`, unique per list.
- R3 (planned): a deferred trigger on `lists` sends `{ revision }` to
  `share:<topic_key>` and `{ list, revision, by }` (event `list`) to
  `owner:<uid>`; `select` policies on `realtime.messages` for both topic
  families and no `insert` policy; `by` is the `x-dhloot-tab` request
  header; the share page and the owner's lists pages join through
  `LiveFeed`; the 45 s poll runs only while a feed is down; a 5-minute
  safety re-read runs while live.
- Harness invariant: `anon` executes only `get_shared_list(text)`
  (`tests/db/harness.test.mjs`, `EXPECTED_ANON_FUNCTIONS`).

## 2. Two conflicts found in the sources (raised, not a question)

1. **Expiry: 14 days or 1 hour.** The orchestrator's context says the
   answer to 36 gives 14 days and the limits amendment 1 hour. The answer
   to 36 (roadmap section 16, "Answers to 32-38") says **1 hour**, and so
   does the limits amendment (`issues/persistent-storage/context.md`,
   2026-09-25; `docs/decisions/2026-09-25-count-limits-...`). The 14 days
   is the planner's recommendation 36 and the roadmap text written before
   the answer: section 5's R4 row, section 14's outline, section 17's
   privacy bullet. The two owner statements agree; the roadmap text was
   stale. This pass rewrites those rows to 1 hour.
2. **Requester name.** The dispatch asks for a name-length bound and a
   privacy text for a stored requester name. The answer to 36 removes the
   name field: "a request shows its audience and its time only", and "the
   privacy text then has no free-text personal data from requesters". This
   plan stores no name and no requester account id (section 5.1); the
   privacy text describes what a request does store.

Both are resolved by the owner's own answers; neither needs a new answer.

## 3. Scope and non-goals

In scope: the tables, RLS and functions (section 5); two `limit_defaults`
rows; the request events on R3's topics; the requester's send, status and
flow b; the owner's Requests panel, apply, "Apply available", decline, the
index count; `prefs.notifyGm`; the privacy and terms text; layer 1-4 tests;
specs and decisions.

Non-goals: a requester name or contact (owner, answer 36); email, push or
a Discord webhook (answer 38; the webhook is a deferred idea, roadmap
decision 40); a requester cancel; editing a request; a request from an old
`#/l/` link or a local list (no server object); a notification outside the
lists pages (R3's owner feed runs on the lists index and account list
pages only); requests in R6's export bundle (a request is transient); a
homebrew line's own name (R7's seam, section 12).

## 4. Existing behaviour and code paths

| Concern | Where |
|---|---|
| Limits | `supabase/migrations/20260925130000_limits.sql`, `tests/db/limits.test.mjs` ("hold the two defaults") |
| Lists, entries, revision bump, limit triggers | `supabase/migrations/20260925130100_lists.sql` |
| Shares, projection | `supabase/migrations/20260925130200_list_shares.sql` (rotate removed by `B2.3`) **[refresh]** |
| E2E admin grants | `supabase/migrations/20260925130300_lists_service_role.sql` |
| Realtime triggers and policies | R3's `<ts>_realtime.sql` **[refresh]** |
| Layer 3 | `tests/db/roles.mjs` (`connect`, `asRole`), `list-shares.test.mjs` (the six-role pattern), `harness.test.mjs`, `reversibility.test.mjs`, R3's `realtime.test.mjs` and `jwtFor` **[refresh]** |
| Cloud port | `app/src/ports/types.ts` (`CloudPort`, `ListWrite`, `ShareRepository`), `supabase.ts`, `lazy-cloud.ts`, `fake-cloud.ts`, `fake-cloud-seed.ts`, `cloud.contract.ts` |
| Shared page | `SharedListPage.svelte`, `SelBar.svelte`, `AddToList.svelte`, `state/sharedView.svelte.ts` |
| Owner pages | `ListPage.svelte`, `ListsPage.svelte`, `ListCard.svelte`, `state/cloudLists.svelte.ts` |
| Preferences | `lib/prefs.ts` (`Prefs`, `readPrefs`), `dhloot.prefs.v1`, `user_prefs` |
| Policy pages | `pages/src/privacy.html`, `pages/src/en/privacy.html`, `pages/src/terms.html`, `pages/src/en/terms.html` |

## 5. Design: the database (`B4.1`)

### 5.1 Tables

```sql
create table public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  share_id uuid not null references public.list_shares (id) on delete cascade,
  audience text not null check (audience in ('player', 'gm')),
  status text not null default 'pending' check (status in ('pending', 'applied', 'declined')),
  status_key uuid not null unique default gen_random_uuid(),
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
  entry_id uuid references public.list_entries (id) on delete set null,
  quantity integer not null check (quantity between 1 and 99),
  price_coins integer check (price_coins is null or price_coins between 1 and 99999),
  applied_quantity integer check (applied_quantity is null or applied_quantity between 0 and 99),
  primary key (request_id, item_key)
);
```

- **No requester identity.** No name (answer 36), no `requester_user`: a
  signed-in requester's id links a person to a request and nothing shows
  it. The owner sees the audience and the time.
- **"Expired" is read, not stored.** `status` stays `pending`; a pending
  row with `expires_at <= now()` reads `expired` everywhere, cannot be
  applied or declined, and does not count towards the pending cap.
  `expires_at` is a plain column set by the function (`timestamptz +
  interval` is not immutable, so a generated column is not allowed); tests
  set it directly.
- **Snapshot of the price, link to the entry.** `price_coins` is the
  entry's price when the request was made, so the owner's total is what
  the reader saw; `entry_id` finds the stock at apply time and becomes
  null if the entry is deleted.
- **Grants.** `revoke all ... from public, anon, authenticated`; `grant
  select ... to authenticated`; `select` policies: the list's owner
  (`exists (select 1 from lists l where l.id = list_id and l.owner_id =
  (select auth.uid()))`, the lines through their request); no `insert`,
  `update` or `delete` grant - every change goes through the functions.
  `grant select, delete ... to service_role` for the hosted E2E's admin
  client (the `lists_service_role` pattern, in the same migration).
- **Limits.** `insert into public.limit_defaults (key, value) values
  ('request_lines', 100), ('pending_requests_per_list', 10);` read with
  `effective_limit(<list owner>, key)`, so `limits:set` raises or lowers
  them per owner. The rate (5 per share per minute), the expiry (1 hour)
  and the retention (24 hours) are constants in the function (limits
  amendment; decision "Purchase requests are written only by a bounded
  function any link holder calls").

### 5.2 `create_purchase_request(p_token text, p_lines jsonb) returns uuid`

`security definer`, `set search_path = public, pg_temp`, `execute` to
`anon` and `authenticated` (the first function `anon` writes through).
Returns the new request's `status_key`. Steps, in this order:

1. Token: null or not `^[A-Za-z0-9_-]{43}$`, or no share with that token
   and `revoked_at is null` -> `raise exception 'request: unknown link'
   using errcode = 'P0002'`. One answer for all four, as `get_shared_list`.
2. `perform pg_advisory_xact_lock(hashtext('requests:' || v_share.list_id))`
   - two sends to one list count in order (the limit triggers' pattern).
3. Housekeeping, every list: `delete from purchase_requests where
   decided_at < now() - interval '24 hours' or (status = 'pending' and
   expires_at < now() - interval '24 hours')`.
4. Lines shape, else `22023` with message `request: bad lines`: an array;
   `octet_length(p_lines::text) <= 32768`; length at least 1; each element
   an object with `item` a string matching the item-key pattern and `qty`
   a JSON number whose text matches `^[0-9]{1,2}$` and is at least 1; no
   `item` twice.
5. `v_max := effective_limit(v_owner, 'request_lines')`; more lines ->
   `raise exception 'limit: request_lines' using errcode = 'P0001', detail
   = v_max::text`.
6. Every `item` is an entry of the list, else `22023` with message
   `request: stale` (the page is older than the list).
7. Rate: `count(*)` of this share's requests with `created_at > now() -
   interval '1 minute'` at or above 5 -> `limit: request_rate`, detail `5`.
   Counted from the table; the housekeeping never deletes a row that young.
8. Pending: `v_max := effective_limit(v_owner,
   'pending_requests_per_list')`; the list's rows with `status = 'pending'
   and expires_at > now()` at or above it -> `limit:
   pending_requests_per_list`, detail the value.
9. Insert the request (`audience` from the share, `expires_at = now() +
   interval '1 hour'`), then its lines, each joined to its entry for
   `entry_id` and `price_coins`. Return `status_key`.

The client maps the answer (section 6.1): `P0002` -> `gone`; `limit:
<key>` -> `limit` with the key and value; message `request: stale` ->
`stale`; any other refusal -> `refused`; no answer -> `network`.

### 5.3 `get_purchase_requests(p_keys uuid[]) returns jsonb`

`stable security definer`, `execute` to `anon` and `authenticated`. Reads
at most the first five keys; an unknown key is left out; null or empty
input answers `[]`. Each element, newest first:

```json
{ "key": "<uuid>", "status": "pending|applied|declined|expired",
  "created_at": "...", "lines": [{ "item": "ci1", "qty": 1, "taken": null }] }
```

`taken` is `applied_quantity`. Nothing else: no list id, share id, token,
owner or audience. The key is the capability (decision "A requester reads
the status by a key kept in the tab's sessionStorage").

### 5.4 `apply_purchase_request(p_id uuid, p_clamp boolean default false) returns jsonb`

`security definer`, `authenticated` only. One transaction:

1. The request joined to its list `for update of r`; not found, or the
   list's owner is not `auth.uid()` -> `42501`.
2. `status <> 'pending'` -> `22023`, message `request: decided`;
   `expires_at <= now()` -> `22023`, message `request: expired`.
3. Lock the request's entries (`select ... for update`).
4. Per line: `want` = `quantity`, `have` = the entry's quantity, or 0 for a
   null `entry_id`. Without `p_clamp`, any `want > have` -> answer `{
   "short": [{ "item", "want", "have" }] }` (ordered by `item_key`),
   change nothing. With `p_clamp` and every `have` = 0 -> the same answer.
5. `applied_quantity := least(want, have)`; an entry whose `have` equals
   its taken count is deleted (answer 37); the rest lose the taken count;
   the request becomes `applied`, `decided_at = now()`. Answer `{
   "applied": true }`. `lists.revision` moves through the existing
   entry trigger; R3's deferred trigger sends one message per list.

### 5.5 `decline_purchase_request(p_id uuid) returns void`

`authenticated` only: steps 1 and 2 of 5.4, then `status = 'declined'`,
`decided_at = now()`.

### 5.6 Events on R3's topics (decision "Request events nudge the owner and share topics; each page refetches")

`purchase_requests_broadcast()`, a trigger function (`security definer`,
no `execute` grant), `after insert or update of status on
public.purchase_requests for each row`:

- On insert, and on an update that changes `status`: `realtime.send(
  jsonb_build_object('list', new.list_id, 'by', v_by), 'request', 'owner:'
  || v_owner, true)`. `v_by` is read from `request.headers` exactly as R3's
  `lists_broadcast()` reads it; if R3 ships a helper for it, call the
  helper **[refresh]**.
- On an update that changes `status`, when the sending share is still
  active: `realtime.send('{}'::jsonb, 'request', 'share:' || topic_key,
  true)`. A share viewer learns only that some request of that link was
  decided; each page then re-reads the keys it holds.
- A plain row trigger is enough: one insert or one status change per
  request, and `realtime.messages` is delivered after commit. No new
  `realtime.messages` policy: R3's two `select` policies cover both
  topics; no `insert` policy exists.

Quota: a request costs 1 owner send (+1 per owner device) and a decision
1 owner send + 1 share send (+1 per viewer); a session of 20 requests
adds about 400 messages to R3's estimate of 2000.

### 5.7 Reversal

Drop the trigger, the four functions and the trigger function, both
tables; `delete from public.limit_defaults where key in ('request_lines',
'pending_requests_per_list')` (overrides go by `on delete cascade`). The
reversibility walk compares the schema and R3's realtime policy snapshot.

## 6. Design: the client (`B4.2`)

### 6.1 The port

```ts
export type RequestStatus = 'pending' | 'applied' | 'declined' | 'expired';
export interface RequestLine { item: string; qty: number; price: number | null; entry: string | null; taken: number | null }
export interface OwnerRequest { id: string; listId: string; audience: ShareAudience; createdAt: string; expiresAt: string; lines: RequestLine[] }
export type RequestSent =
  | { ok: true; key: string }
  | { ok: false; error: 'gone' | 'stale' | 'network' | 'refused' }
  | { ok: false; error: 'limit'; key: string; value: number | null };
export type RequestApplied =
  | { ok: true }
  | { ok: false; error: 'short'; short: { item: string; want: number; have: number }[] }
  | { ok: false; error: 'decided' | 'expired' | 'network' | 'refused' };
export interface RequestRepository {
  /** The signed-in owner's pending requests over all lists, lines included; expired rows too (the caller hides them by `expiresAt`). */
  list(): Promise<{ ok: true; requests: OwnerRequest[] } | { ok: false }>;
  send(token: string, lines: { item: string; qty: number }[]): Promise<RequestSent>;
  /** At most five keys; an unknown key is absent from the answer. */
  status(keys: string[]): Promise<{ ok: true; found: { key: string; status: RequestStatus; createdAt: string; lines: { item: string; qty: number; taken: number | null }[] }[] } | { ok: false }>;
  apply(id: string, clamp: boolean): Promise<RequestApplied>;
  decline(id: string): Promise<Exclude<RequestApplied, { error: 'short' }>>;
}
```

`CloudPort` gains `requests: RequestRepository`. Real: `list()` is one
PostgREST select of `purchase_requests` with `status=eq.pending` and the
embedded lines; the rest are `rpc(...)` calls with R3's 20 s abort. Pure
parsing and the error mapping live in `app/src/lib/requests.ts`.

### 6.2 Where state lives

- `env.session: StoragePort` - `browserStorage(win, 'session')` over
  `sessionStorage` (no external-change events), `memoryStorage` in tests.
  `sessionStorage['dhloot.requests.v1']`: `{ [token]: [{ key, at }] }`,
  the last five per token, read and written only by `SentRequests`.
- `app/src/state/sentRequests.svelte.ts`, class `SentRequests` (the
  requester): `keysFor(token)`, `statuses` (by key), `send(token, lines)`,
  `refresh(token)`. `SharedView` calls `refresh` after each read that
  changes the drawn revision, on the share topic's `request` event, and
  on the poll and the shown-again signal it already handles **[refresh]**.
- `app/src/state/ownerRequests.svelte.ts`, class `OwnerRequests` (the
  owner): `byList`, `pendingCount(listId, now)`, `decided` (this page
  load), `read()`, `apply(id, clamp)`, `decline(id)`, `remoteChange()`
  (coalesced 250 ms, the `CloudLists` pattern). Read when the owner feed
  starts, on the `request` event (its `by` equal to `events.tab` ignored),
  after the owner's own apply or decline, on the poll while the owner feed
  is down, on the shown-again signal and on the 5-minute safety re-read.
- `lib/live.ts` gains `readRequestMessage(payload)` for both topics; the
  owner feed's handler routes event `list` to `CloudLists` (R3) and
  `request` to `OwnerRequests`; the share feed routes `request` to
  `SentRequests` **[refresh]**.
- `lib/prefs.ts`: `notifyGm?: 'ask' | 'always' | 'never'` (default `ask`),
  with `AppState.notifyGm` and `setNotifyGm`, arrives with R5b's `B5.3`
  together with its row in Display settings (owner, 2026-09-26); R4 reads
  and writes it through those, adds no field **[refresh]**.

### 6.3 The screens (mock `mocks/b42-requests.html`)

- **Send** (frame A): «Сообщить владельцу» / "Notify the owner" in the
  selection bar of a `#/s/` page, for every reader but the owner. One
  term, «владелец списка» / "the list's owner", in both flows: a GM-link
  holder is a GM too, so «мастер» would be ambiguous. Lines = the ticked
  item ids with their taken counts. Success: the selection clears, the
  toast «Запрос отправлен владельцу списка.», the key is stored.
- **Status** (frame B): «Ваши запросы владельцу», up to five lines under
  the «Обновлено» line: count of positions and pieces, relative time
  (`agoText`), status «ждёт ответа» / «принят» / «принят частично: N шт.»
  / «отклонён» / «истёк без ответа»; a polite status region.
- **Owner panel** (frames C, C2): `RequestsPanel.svelte` between the
  action row and the list notes of an account list page, drawn while a
  pending unexpired request or a decision of this page load exists;
  «Запросы (N)», each request with audience, age and time to expiry, its
  lines (name through the catalog index, «×want из have», line sum), the
  total (`totalParts`), «Принять» and «Отклонить»; a short answer shows
  «Не хватает: ...» (`role="alert"`) and «Принять доступное»; «Решённые в
  этот раз (N)» folded.
- **Index** (frame D): one gold line on the card, «2 запроса ждут
  ответа», inside the card's link.
- **Flow b** (frame E): after a successful add from a `#/s/` page's bar,
  signed in, not the owner, `notifyGm` `ask`: the bar's action row is
  replaced by «Сообщить владельцу списка, что вы взяли эти предметы?»,
  «Сообщить», «Не сообщать», «Запомнить ответ». `always` sends and
  extends the add toast; `never` does nothing. The item card's own menu
  never asks.
- **Account**: none in R4. The remembered answer is changed in the row
  «Сообщать владельцу списка» of R5b's Display settings (owner,
  2026-09-26, section 13); the mock's frame F is void.

Texts in English follow `I18N.md` parity; the plan's Russian strings are
the proposal the mock review may change.

### 6.4 The fake cloud and layer 2

- `fake-cloud-seed.ts`: `requests` on «Лавка кузнеца» (`uuid(101)`):
  `uuid(121)`, player link, 10 minutes before boot, ci1 x1 and cc1 x3
  (within stock), key `uuid(131)`; `uuid(122)`, GM link, 25 minutes
  before boot, cc1 x9 (stock 5) and q1 x1, key `uuid(132)`.
- `fake-cloud.ts` implements the repository with the database's rules
  (lines check, stale item, rate 5 per share per minute on the fake's
  clock, pending cap 10, expiry, apply with short, clamp and zero removal,
  decline) and sends R3's fake events (`request` on the owner and share
  topics). `window.__dhlootFake` gains `request(token, lines)` (a request
  from another reader, `by: 'other-device'`) and `decide(key, 'applied' |
  'declined')` (the owner acting on another device).
- `cloud.contract.ts` gains a requests case, run on the fake (layer 1) and
  the real adapter (layer 4): send through a token, read by key, the
  owner's list, apply refused short, clamp, decline, the rate refusal.

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
со списком или аккаунтом владельца - сразу. Ключ, по которому отправитель
видит ответ, хранится только в этой вкладке браузера и исчезает, когда её
закрывают.» `terms.html`, under «Что нельзя» or its own paragraph:
«Запрос владельцу списка - это сообщение, а не заказ и не сделка:
владелец сам решает, принять его или нет.» English in parity; the "Last
changed" line moves to the batch's date.

## 7. Laws, contracts and specs

- Public contracts: none change. No route, no fixture, no `llms.txt` line
  (`#/s/` already exists; requests are behaviour on it).
- Specs in `B4.2`: `FEATURES.md` "Account lists" (send, status, the
  panel, apply and decline, the index line, flow b, the limits bullet);
  `STATE.md` (`sessionStorage` key; `notifyGm` is named by R5b); `META.md` section 3 (the first anonymous write and its
  bounds); `I18N.md` (strings, `запрос` plurals); `COVERAGE.md`.
- `B4.1`: `COVERAGE.md` `tests/db/` row only.

## 8. Tests by layer

- **Layer 1** (vitest): `lib/requests.ts` (parse, error map, totals,
  status text choice, plural); `SentRequests` (five-key bound, drop of an
  unknown key, refresh on events); `OwnerRequests` (echo ignored,
  coalescing, expired hidden, short then clamp, decided fold); the real
  adapter against a stubbed client (select shape, RPC names and
  arguments, error mapping); the fake; the contract case;
  `requestsPanel.test.ts`, `selBar` send and flow b, `listCard` line,
  `sharedListPage` status block - each ending with
  `expectNoA11yViolations`, the open short state included.
- **Layer 2** (`tests/app/`, `dist-test/`): new inventory states `#/s/
  player-token-1 ~ ticked` (signed out), `~ request sent`, `~ notify
  question as gm2`, `SHOP ~ short as gm1`; re-seeded `SHOP as gm1` (the
  panel), `#/lists as gm1` (the line).
  States cases: a live `request()` adds to the open panel and the index
  line without a reload; `decide()` turns the requester's line to
  «отклонён» without a reload; `setLive(false)` then `decide()` changes
  nothing until the tab is shown again; apply within stock lowers a row's
  quantity and removes the row at zero; the sixth send in a minute toasts
  the rate text; `notifyGm: 'always'` sends without asking.
- **Layer 3** (`check:db`): section 10's cases.
- **Layer 4** (`npm run e2e`, test project): a signed-out page sends on a
  player link; the owner's page shows it within 10 s; apply lowers the
  entry (admin read); the requester's line reads «принят» within 10 s;
  the contract's requests case on the real adapter; an anon `select` on
  both tables is refused.

## 9. Batches: gates, cost, review, split criterion

Costs: this host, idle, one green pass (`.claude/README.md`, "Batch size
and the fixed cost of a run", re-measured 2026-09-25: `check` 348 s,
`check:built` 19 s, `app/states` 197 s, `e2e` 50 s; `check:db` with
Realtime per R3's estimate, ~4-5 min warm).

| Batch | Goal | Gates (cost) | Review | Split criterion |
|---|---|---|---|---|
| `B4.1` | section 5: tables, RLS, the four functions, the event trigger, the limit rows, reversal, layer 3 | `rtk npm run check` (~6 min), `npm run check:db` x2 (~10 min) - about 16 min | required: schema rule, and the first function `anon` writes through | new release (R4) |
| `B4.2` | section 6: port, fake, stores, the four screens, flow b, `notifyGm`, policy text, specs, layer 1, 2 and 4 | `rtk npm run check` x2 (~12 min), `build:test` + `check:built` (~1 min), layer 2 filter group (~5 min), goldens `--update` 4 shards (~12 min), `sweep` at 360 (~8 min, the panel at phone width), `npm run e2e` (~2 min) - about 40 min | required: new UI, policy text | a commit the harness cannot reach: `B4.2`'s E2E needs `B4.1`'s migration on the test project, applied between the batches; the gate sets differ (layer 3 against layers 1, 2 and 4) |

Total gate cost, one green pass per batch: about 56 minutes, plus the
closeout's CI watch. Not split further: `B4.2`'s requester and owner
halves share the port, the fake seed, the `#/s/` and `#/lists` states and
one filter group, so the README's test says merge. Named fallback only: if
the reviewer cannot hold `B4.2` in one pass, the remediation splits it at
port, fake, contract and stores first, screens second - two amends of the
one commit.

## 10. Batch `B4.1` - the database half (implement-ready after the [refresh] marks)

**Objective.** Section 5 in one migration, proven by layer 3.

**In scope.** The migration and its reversal; `tests/db/purchase-requests.test.mjs`
(new); `tests/db/harness.test.mjs` (two anon functions);
`tests/db/limits.test.mjs` (four defaults); `docs/specs/COVERAGE.md`
(`tests/db/` row); the decision index.

**Out of scope.** Any `app/`, `tests/app/` or `tests/e2e/` file (`B4.2`);
pushing to a hosted project (CI's `migrate-test` and `migrate-prod`);
`FEATURES.md` (the behaviour ships with the screens in `B4.2`).

**Files.**

| File | Change |
|---|---|
| `supabase/migrations/<ts>_purchase_requests.sql` | new; `<ts>` later than every file in `supabase/migrations/` when the batch starts (R5's and R3's land first) **[refresh]** |
| `supabase/reversals/<ts>_purchase_requests.sql` | new |
| `tests/db/purchase-requests.test.mjs` | new, the cases below |
| `tests/db/harness.test.mjs` | `EXPECTED_ANON_FUNCTIONS` = `['create_purchase_request(text,jsonb)', 'get_purchase_requests(uuid[])', 'get_shared_list(text)']` - `regprocedure` text has no space after a comma; the query orders by that text; the comment above the list names the new exception (a link holder sends a request) |
| `tests/db/limits.test.mjs` | "hold the two defaults" becomes "hold the four defaults": `entries_per_list=100`, `lists_per_owner=50`, `pending_requests_per_list=10`, `request_lines=100` |
| `docs/specs/COVERAGE.md` | `tests/db/` row names `purchase-requests.test.mjs` and what it proves |

**Steps.**

1. Read R3's shipped migration and `tests/db/realtime.test.mjs`
   **[refresh]**: the header expression for `by`, whether a helper exists,
   and how the suite counts `realtime.messages` rows by topic as
   `postgres`. Use the same.
2. Migration, in this order: the two `limit_defaults` rows; the two tables
   with the checks, indexes, RLS, grants and policies of section 5.1; the
   four functions of 5.2-5.5 with `set search_path = public, pg_temp`;
   `revoke execute ... from public` on all four, then `grant execute` on
   `create_purchase_request(text, jsonb)` and `get_purchase_requests(uuid[])`
   to `anon, authenticated`, and on `apply_purchase_request(uuid, boolean)`
   and `decline_purchase_request(uuid)` to `authenticated`; the trigger
   function of 5.6 (`revoke execute ... from public, anon, authenticated`)
   and its trigger; `grant select, delete on both tables to service_role`.
   The file's head comment cites `docs/specs/FEATURES.md`, "Account lists"
   and the decision "Purchase requests are written only by a bounded
   function any link holder calls". One-line comments only where the code
   cannot say why: the advisory lock, the housekeeping, why `expires_at`
   is not generated, why the share topic payload is empty.
3. Reversal (section 5.7).
4. `tests/db/purchase-requests.test.mjs` (node:test, the
   `list-shares.test.mjs` world: A owns list LA with entries ci1 (qty 2,
   150), cc1 (qty 5, 20), q1 (qty 1); player and GM shares; B is another
   user; a stopped share). Time-dependent rows are inserted by the setup
   as `postgres` with explicit `created_at`, `expires_at`, `decided_at`.
   Cases, each titled by its behaviour:
   - grants: `anon` and `authenticated` hold no `insert`, `update`,
     `delete` on either table; `anon` has no `select`; an `authenticated`
     direct insert is refused (`42501`).
   - `anon` sends through a player token and through a GM token; the row
     records the audience, `expires_at` = `created_at` + 1 hour, and each
     line its `entry_id` and `price_coins`; the answer is the row's
     `status_key`; an `authenticated` other user sends too.
   - a null, malformed, unknown or stopped token -> `P0002`, message
     `request: unknown link`, the same for all four.
   - bad lines -> `22023` `request: bad lines`: not an array, empty, a
     non-object element, `qty` 0, 100, 1.5 and `"2"`, a repeated item, a
     body over 32768 bytes.
   - an item not on the list -> `22023` `request: stale`.
   - `request_lines`: an override of 2 for A refuses 3 lines with `limit:
     request_lines`, detail `2`; an override of null allows them.
   - rate: five sends on one share in one transaction pass, the sixth is
     `limit: request_rate`, detail `5`; a send on the other share of the
     same list passes; five rows 61 s old do not count.
   - pending cap: ten pending unexpired rows refuse the eleventh with
     `limit: pending_requests_per_list`, detail `10`; an expired pending
     row and a decided row do not count; an override of 11 lets one more
     through.
   - housekeeping: a send deletes rows (any list) decided or expired more
     than 24 hours ago, with their lines, and keeps one decided 23 hours
     ago.
   - status by key: `anon` reads `{ key, status, created_at, lines }` and
     no other key (assert the exact key sets); an unknown key is absent;
     a pending row past `expires_at` reads `expired`; six keys read five;
     null reads `[]`.
   - the owner selects the list's requests and lines; B selects none;
     `anon` is refused.
   - apply within stock: quantities drop by the request, `taken` is set,
     status `applied`, `decided_at` set; an entry taken whole is deleted.
   - apply over stock: `{ short: [...] }` with `item`, `want`, `have`
     exactly, and no row changed (compare entries and the request before
     and after); with `clamp`: each line takes what is there, a line with
     a deleted entry takes 0; clamp with nothing anywhere answers `short`
     and changes nothing.
   - apply or decline by B -> `42501`; by `anon` -> permission denied;
     twice -> `request: decided`; past `expires_at` -> `request: expired`.
   - decline sets `declined` and changes no entry.
   - deleting the list deletes its requests and lines; deleting an entry
     sets its lines' `entry_id` to null.
   - events: a send writes one `request` row to `realtime.messages` for
     `owner:<A>` with `{ list, by }`; a decision writes one to `owner:<A>`
     and one `{}` to the sending share's `share:<topic_key>`; a decision
     of a request whose share is stopped writes none to that topic; no
     row names `owner:<B>`; `by` carries the `x-dhloot-tab` value set
     through `request.headers` **[refresh]**.
5. `harness.test.mjs` and `limits.test.mjs` as in the file table.
6. `COVERAGE.md`; `node tools/decisions.js`; `node tests/derived.js`.

**Acceptance.**

- `npm run check:db` passes; every case of step 4 is in its output.
- `anon` executes exactly `create_purchase_request`,
  `get_purchase_requests` and `get_shared_list` (harness).
- Every bound of section 5.2 is refused inside the function, with the
  messages and details above; the client can map each one.
- A status read shows no list id, share id, token, owner or audience.
- An over-stock apply changes no row; a clamp and a zero entry behave as
  section 5.4 says.
- The reversal passes the up-down-up gate and the walk; the two limit rows
  go with it.
- No `insert` policy on `realtime.messages` and no new `realtime` policy.
- `node tests/derived.js` passes; `B4.1` changes no `app/` file.

**Verification.** `rtk npm run check` (Bash tool, one foreground call,
timeout 600000); `npm run check:db` (PowerShell tool, alone, timeout
600000). About 16 minutes with one re-run.

**Review.** Required: schema rule, and the first anonymous write.

**Risks and do-nots.** Do not give `anon` a table grant. Do not trust a
client value for price, audience, expiry or entry id: the function reads
them. Do not change a shipped migration. Do not add a `realtime.messages`
policy. Do not send a status key, a token or a line on any topic.

## 11. Batch `B4.2` - the client half (outline; refresh after R3 closes)

**Objective.** Section 6 in the app, the fake and layer 4, with the
policy text.

**Scope.** `ports/types.ts`, `ports/supabase.ts`, `ports/lazy-cloud.ts`,
`ports/fake-cloud.ts`, `ports/fake-cloud-seed.ts`, `ports/cloud.contract.ts`,
`ports/storage.ts` and `ports/index.ts` (`env.session`), `lib/requests.ts`
(new), `lib/live.ts` **[refresh]**, `lib/prefs.ts`, `lib/cloudLists.ts`
(limit texts for the two new keys and the rate), `lib/dict.ts`,
`state/sentRequests.svelte.ts` (new), `state/ownerRequests.svelte.ts`
(new), `state/sharedView.svelte.ts` and `state/app.svelte.ts`
**[refresh]**, components `SelBar.svelte`, `SharedListPage.svelte`,
`AddToList.svelte`, `ListPage.svelte`, `ListCard.svelte`,
`RequestsPanel.svelte` (new), their tests; `tests/app/inventory.js`, `states.js`, goldens; `tests/e2e/flows.mjs`,
`contract.mjs`, `admin.mjs` (read an entry's quantity); the four policy
pages; specs (section 7).

**Acceptance (placed items are their own lines).**

- A signed-out reader of `#/s/player-token-1` sends the ticked entries;
  the status block shows «ждёт ответа»; the owner's panel shows it
  without a reload (layer 2 fake, layer 4 real within 10 s).
- Apply within stock lowers the entries and removes one at zero; apply
  over stock shows the short lines and changes nothing; «Принять
  доступное» takes what is there; decline changes no entry.
- The requester's line moves to «принят», «принят частично», «отклонён»
  or «истёк без ответа» without a reload while the feed is live, and on
  the next poll or shown-again while it is down.
- Flow b asks once per add, remembers with «Запомнить ответ», sends on
  `always`, stays silent on `never`; the answer persists through
  `user_prefs`.
- The index card line counts pending unexpired requests.
- Flow b's remembered answer is R5b's `notifyGm`, changed in Display
  settings; R4 adds no control to `#/account` (owner, 2026-09-26, section
  13).
- Privacy and terms text in both languages as section 6.5.
- Every new file is reached by a test; component tests end with
  `expectNoA11yViolations`, the short state included.

**Gates.** Section 9, `B4.2` row.

## 12. Seams with other releases (named, not decided here)

- **R3** (`persist-3-realtime`): R4 adds the event `request` on
  `owner:<uid>` and `share:<topic_key>`, a reader in `lib/live.ts` and two
  routes in the feed handlers; R3's topics, policies, `by` header, feed
  state machine, poll gate and safety re-read are used as built.
- **R5** (`persist-5-migration`): only the migration timestamp order. A
  migrated local list has no share until its owner makes one.
- **R5b** (`persist-5b-account-menu`): ships `notifyGm` in `Prefs`,
  `AppState.notifyGm`/`setNotifyGm` and the Display settings row that
  changes it; R4's flow b uses them as built.
- **R6** (`persist-6-import-export`): requests are not exported or
  imported; R6 decides whether its bundle states that.
- **R7** (`persist-7-homebrew`): a homebrew entry's line needs a name when
  its entry is gone; R7 decides whether lines carry the snapshot's name.
  R4 lines store `item_key` only.
- **R11** (usage monitoring, planned elsewhere): R4 adds Realtime messages
  (section 5.6) and rows in two tables; R11 decides whether to count them.

## 13. Owner question - answered 2026-09-26

Answer (owner, 2026-09-26): option A's control, moved - the remembered
answer (`prefs.notifyGm`: ask / always / never) is changed in «Настройки
отображения» / "Display settings", the section R5b's account menu opens
(`issues/persist-5-migration/plan.md` section 4.9). R4 keeps «Запомнить
ответ» and adds no field to `#/account`. The question as asked:

1. **Where a reader changes a remembered "notify the owner" answer.**
   Answer 33 stores `always` or `never` once «Запомнить ответ» is ticked;
   after that the question is never drawn, so nothing on screen can
   change it back.
   - **A (recommended):** one field on `#/account` between «Подключённые
     входы» and «Выход»: «Добавление из чужого списка по ссылке» with
     «Спрашивать» / «Сообщать владельцу» / «Не сообщать» (mock frame F).
     Reason: one visible place, the existing `Seg` control, and
     `user_prefs` already carries it. Trade-off: `#/account` gains a field
     and its golden re-seeds.
   - B: no «Запомнить ответ»; the question is asked after every add from
     a shared link, and `notifyGm` is not stored. Trade-off: one more
     press per add for a reader who always answers the same.

## 14. Risks, assumptions, deferred

- Risk: `create_purchase_request` is the first function `anon` writes
  through. Its bounds are inside it and proven by layer 3; a valid share
  token is its only capability; a leaked link costs at most 5 requests a
  minute and 10 pending on that list, which the owner declines or ends by
  deleting the link.
- Risk: the pending cap of 10 lets one link holder fill a list's queue
  for an hour. Accepted: the owner declines them or deletes the link; a
  new link has its own rate budget but shares the list's cap.
- Consequence of the 1-hour expiry (owner, answer 36): a request the GM
  has not answered within an hour of play is gone from the panel and reads
  «истёк без ответа» for the requester. Named, not reopened.
- Risk: housekeeping runs only when somebody sends; a quiet project keeps
  decided rows longer than 24 hours. They hold no personal data; the
  privacy text says "at the next request".
- Assumption: R3 ships the owner topic, the share topic policies and the
  `by` header as planned; `B4.1` step 1 and `B4.2`'s [refresh] marks
  re-read them. If the share page stays on the poll (R3's anon risk), the
  requester's status moves with the poll and the shown-again signal.
- Assumption: `jsonb` number `1.5` fails the `^[0-9]{1,2}$` text check;
  layer 3 proves it.
- Mocks: `mocks/b42-requests.html` with `mock.css` (copied from R2) and
  `r4.css`; not rendered-checked in the browser pane (it shows local files
  without their stylesheet); open them from disk. The design hook flags
  low contrast on `--muted2` over the washes; those are the app's measured
  tokens, left as they are (R2's triage).
- Deferred: a requester cancel; a notification outside the lists pages;
  a Discord webhook (roadmap decision 40).

## 15. Closeout

- `/handoff` audit; the roadmap's section 5 R4 row, section 9 row,
  section 12 rows and section 17 bullets compacted to the shipped state;
  this directory deleted; one push.
- Owner after the push: send a request from a phone on a player link and
  apply it on a desktop; confirm the privacy page reads right in both
  languages.
