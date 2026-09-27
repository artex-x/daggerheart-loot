# Plan - TASK persist-3-realtime (release R3: live updates through Realtime)

## Status

- Plan review: required before B3.1 (trigger: a migration with SECURITY DEFINER trigger functions and new `realtime.messages` policies; a new sync protocol - the Broadcast feed)
- Planning pass 2 (refresh), 2026-09-27, planner, in a worktree cut from
  `f6079277` (R11). R2, R5, R5b, `process-guards` and R11 have shipped;
  every **[R2-refresh]** mark of pass 1 is resolved against this tree
  (section 3). Pass 1: 2026-09-25, from `da7378cb`.
- NEEDS_HUMAN_CONFIRMATION: no - the owner answered Q1-Q3 of section 13
  as recommended on 2026-09-26; the [Q1] steps stay in.
- Plan review pass 1 (`reviews/plan-B3.1.md`, 2026-09-27):
  fix-then-continue; this file carries the fixes (register
  `reviews.md`). A second look (`reviews/plan-B3.1-2.md`) runs before
  any implementer; `agent-guard.mjs` holds every implementer dispatch of
  this task, `B3.0` included, until an approve.
- Batches: `B3.0` (the precursor commit on `main`, pushed alone; owner,
  2026-09-27) - implement-ready (section 10.0); `B3.1` (database, plus
  the tolerant reorder's fake and contract) - implement-ready (section
  10); `B3.2` (client) - outline, expanded by a planner refresh after
  `B3.1` lands (section 11); closeout (section 12).
- Release slot: after `display-settings` (in flight on `main`), before R4.
  Placement and the file overlap with `display-settings`: section 15.
- Gate cost of the plan: `B3.0` about 15 minutes (section 10.0), `B3.1`
  about 55 minutes (section 10, "Verification"), `B3.2` about 45 minutes
  (section 11), closeout about 5 minutes; about 120 minutes in total.
- Roadmap: `issues/persistent-storage/plan.md` sections 5, 9, 12, 14, 15
  (step 18), 17. This file is R3's authority where the two differ.

## 1. Objective and current state

Goal: a shared page (`#/s/<token>`) and the owner's own account lists on
another device (Q1, answered yes) show an edit within about a second,
through Supabase Realtime Broadcast from the database.

Owner, 2026-09-25: Realtime does not replace polling. Realtime is the
primary path. The poll (refetch on focus and every 45 s) is plan B and
runs whenever Realtime is not available: the channel is refused, not
connected, blocked by a network, errored, or a platform limit is hit.

State at `f6079277`:

- `lists.revision` goes up by one on every list update and on every entry
  insert, update and delete (`list_entries_touch`, one list update per
  entry row); a reorder of N entries bumps it N times in one transaction.
- `list_shares` has `topic_key uuid default gen_random_uuid()`, one per
  share row; `get_shared_list(token)` returns `revision`, `updated_at` and
  `topic_key` to anyone with the token. Rotate does not exist: «Удалить
  ссылку» calls `revoke_list_share` (sets `revoked_at`); a new link is a
  new row with a new token and a new `topic_key`.
- Every owner write goes through the account write buffer (R5):
  `CloudLists` (`QUIET_MS` 2 s, `#queue`, `#inFlight`, `flushNow`) sends
  one `apply_list_writes(p_ops jsonb)` request per flush
  (`20260925130600_list_writes.sql`, `security invoker`). Each write runs
  in its own subtransaction; a refused one rolls back alone. The `reorder`
  op calls `public.reorder_list(uuid, uuid[])` by name.
- `SharedView` (`app/src/state/sharedView.svelte.ts`: `open`, `refresh`,
  `retry`, `close`; `refresh()` re-reads only a `ready` or `gone` page and
  replaces `shared` only when `updated_at` moved). `AppState` keeps one
  45 s interval (`#listPoll`, `LIST_POLL_MS`) that moves the clock `now`,
  calls `#refreshShared()` and `#pollLists()`; the storage port's
  shown-again signal (`#watchAccount`) does the same.
- The owner's devices: `CloudLists.refresh()` re-reads on focus and every
  45 s while no write is buffered or in flight.
- No Realtime code exists: no `CloudPort` member, no channel, no policy on
  `realtime.messages`. `LOCAL_STACK_EXCLUDES` in `tools/supabase/lib.mjs`
  keeps `realtime` and `kong` out of the local stack ("The release that
  ships Realtime removes `realtime` from this list").
- Kept defects this release owns (`docs/specs/DEBT.md`, "Live updates"):
  D56 (a reorder after another device changed the entries is refused),
  D57 (a request that never answers holds «Сохраняем...»), D59 (a failed
  first read of a `#/s/` link is not retried by itself). Section 9.

## 2. Scope and non-goals

In scope: the broadcast triggers, the `realtime.messages` policies, the
tolerant reorder (D56) in the database, the fake and the contract, the
local stack with Realtime in layer 3, the usage report's Realtime row
(placed by R11), the events port (real, lazy, fake), the live-feed state
machine, the share page live path, the owner topic for account lists
(Q1), the write timeout (D57), the retry of a failed first share read
(D59), the layer 3 and layer 4 proofs, specs and decisions.

Non-goals: Presence (who is viewing); Postgres Changes; a visible "live"
badge; live updates of the share panel on the owner's other device (share
rows do not bump `revision`; the panel re-reads when opened); R4's
purchase-request events (R4 reuses the owner topic); closing the channel
while the tab is hidden (section 6.4, trade-off recorded); a Realtime
setting in `config.toml` (the CLI has none, section 7); the slimmer
account client (D60, its own release; section 11 rewords it).

## 3. Existing behaviour and code paths (re-read 2026-09-27 at `f6079277`)

| Concern | Where |
|---|---|
| Revision bump, limits, reorder | `supabase/migrations/20260925130100_lists.sql` (`lists_before_update`, `list_entries_touch`, `reorder_list`) |
| Shares, projection | `supabase/migrations/20260925130200_list_shares.sql` (`create_list_share`, `revoke_list_share`, `get_shared_list`, `clone_shared_list`; no rotate) |
| The write buffer's RPC | `supabase/migrations/20260925130600_list_writes.sql` (`apply_list_writes`, `security invoker`, one subtransaction per write, `reorder` calls `reorder_list`) |
| The move | `20260925130400_legacy_move.sql`, `20260925130500_legacy_move_conflict.sql` (inserts lists and entries; the triggers see it as any insert) |
| Newest migration | `20260927100900_usage_snapshots.sql` (R11) |
| Local stack services | `tools/supabase/lib.mjs` `LOCAL_STACK_EXCLUDES` (shared by `tests/db/run.mjs` and the restore drill's `ensureStackWithAuth`); `tools/supabase/restore.mjs` `runningContainer(name)`; `lib.mjs` `localProjectId(toml)` |
| Layer 3 runner and helpers | `tests/db/run.mjs` (stack lock, gate credit, `dbUrl`, `db reset --local`), `tests/db/roles.mjs` (`connect`, `asRole`, `snapshot`, `resetLocal`, `lineDiff`), `tests/db/reversibility.test.mjs`, `tests/db/apply-pending.test.mjs`, `tests/db/harness.test.mjs` (anon invariants), `tests/db/lists.test.mjs` (`reorder_list()` describe), `tests/db/list-writes.test.mjs`, `tests/db/usage.test.mjs` |
| Usage report | `tools/supabase/usage.mjs` (`collect`, `readStorage`), `tools/supabase/usage-lib.mjs` (`INFO`, `evaluate`), `usage-lib.test.mjs` |
| Cloud port | `app/src/ports/types.ts` (`CloudPort`, `ListRepository`: `newId`, `list`, `apply`, `move`), `supabase.ts` (`createCloud`, `LIST_SELECT`, `writeOf`, `callFailure`, `keepaliveFetch`), `lazy-cloud.ts`, `fake-cloud.ts` (`reorder`, `applyOne`), `fake-cloud-seed.ts`, `cloud.contract.ts` (case G) |
| Owner lists store | `app/src/state/cloudLists.svelte.ts` (`#pull` drops a read that overlapped a local write and re-reads when idle, `#apply` keeps an object whose `updated_at` did not move, `#send`, `#reorder`) |
| Share page state | `app/src/state/sharedView.svelte.ts`; component `app/src/components/SharedListPage.svelte` (no status region today) |
| Poll and focus | `app/src/state/app.svelte.ts` (`start()` sets `#listPoll`; `#pollLists`, `#refreshShared`, `#watchAccount`'s shown-again handler) |
| Layer 4 | `tests/e2e/flows.mjs`, `contract.mjs`, `run.mjs`, `admin.mjs` |

## 4. Platform facts (Supabase documentation, read 2026-09-25)

| Fact | Source |
|---|---|
| Free plan: 200 concurrent connections, 100 messages per second, 100 channel joins per second, 100 channels per connection, Broadcast payload 256 KB; errors `too_many_connections`, `too_many_joins`, `too_many_channels`, and a disconnect on message throughput (`tenant_events`) | https://supabase.com/docs/guides/realtime/limits |
| Free plan quota: 2 million messages and 200 peak connections a month; no over-usage on Free | https://supabase.com/docs/guides/realtime/pricing |
| Billing: a Broadcast counts one message sent plus one per subscribed client that receives it | https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages |
| `realtime.send(payload jsonb, event text, topic text, private boolean default true)`; `true` sends to private channels. The docs' inline comments contradict this (issue opened 2026-09-17, open) | https://supabase.com/docs/guides/realtime/broadcast, https://github.com/supabase/supabase/issues/50532 |
| `realtime.send` inserts into `realtime.messages` (daily partitions, kept 3 days); logical replication delivers it; with no partition the insert fails with a warning, not an error, and the calling transaction goes on | https://supabase.com/docs/guides/troubleshooting/realtime-warn-sending-broadcast-message |
| Private channels are authorized by RLS on `realtime.messages`: `select` to receive, `insert` to send; `realtime.topic()`; `extension` is `broadcast` or `presence`; roles `anon` and `authenticated` | https://supabase.com/docs/guides/realtime/authorization |
| Policies are checked on join and on a new access token only; a revoked user keeps receiving until the token expires | same page |
| "Allow public access" (default on) lets any key holder use public channels; off, every join must be private. A dashboard setting; no `config.toml` key (local stack cannot set it) | https://supabase.com/docs/guides/realtime/settings, https://github.com/orgs/supabase/discussions/40417 |
| A publishable-key (anon) Realtime connection lasts at most 24 hours | https://supabase.com/docs/guides/getting-started/api-keys |
| Open report: `realtime.send` rows enqueued but never delivered while the channel reports `SUBSCRIBED` (2026-09-21, cause unknown) | https://github.com/supabase/realtime/issues/2250 |
| Known CLI report: `supabase db reset` can leave the `realtime` schema's tables missing until a restart | https://github.com/supabase/cli/issues/1073 |
| `realtime-js` 2.117.1 (installed): channel states `SUBSCRIBED`, `TIMED_OUT`, `CLOSED`, `CHANNEL_ERROR`; client options `worker`, `heartbeatCallback`; `setAuth()` | `node_modules/@supabase/realtime-js/dist/module/*.d.ts` |

Not measured here (no stack, no hosted project): a private channel as
`anon` with the publishable key; whether `realtime.messages` and
`realtime.topic()` exist when `db reset --local` applies the migrations;
the JWT the local Realtime accepts; the CORS pass of a custom request
header. `B3.1` step 1 measures the first three, `B3.2`'s E2E the last;
each has a fallback or a stop (section 10).

## 5. Design: the database

### 5.1 Broadcast from a trigger, not Postgres Changes

Chosen: Broadcast from the database (`realtime.send` in a trigger) on
private channels.

Rejected: Postgres Changes - it needs `anon` `select` on `lists` and
`list_entries` under RLS, and `anon` holds no per-row right (the token is
an RPC argument, not a row claim); its payload is the row, which carries
`owner_id` and `id`; each change runs an RLS check per subscriber on one
thread. `realtime.broadcast_changes()` - it sends the old and new record,
the same leak. A client-sent Broadcast after each save - a viewer would
depend on the owner's tab being open and online, and the owner would need
`insert` on the share topics.

### 5.2 Topics, authorization, and what a message carries

| Topic | Who may join (`select` policy) | Event | Payload |
|---|---|---|---|
| `share:<topic_key>` | `anon`, `authenticated`; topic matches `^share:<uuid>$` | `revision` | `{ "revision": <bigint> }`, or `{ "revision": null }` when the share or the list is gone |
| `owner:<user id>` (Q1) | `authenticated` where the topic is `'owner:' \|\| auth.uid()` | `list` | `{ "list": <list id>, "revision": <bigint or null>, "by": <tab id or null> }` |

- **A token becomes a channel right without the token on the wire.** The
  viewer reads `get_shared_list(token)` over HTTPS; the answer holds
  `topic_key`, a random UUID of its own, not derived from the token or the
  list id. The page joins `share:<topic_key>` as a private channel. The
  token never reaches the WebSocket, the topic, the payload or
  `realtime.messages`; the list id never reaches a share topic. A holder of
  a `topic_key` learns only revision numbers and when the list changes.
- **Policy shape.** One `select` policy per topic family, no `insert`
  policy: no client can send on a private channel, so no forged message
  exists. The share policy checks the topic's shape only, not that the
  share is active. Rejected: a lookup of an active share through a
  `security definer` helper - after a revoke the triggers send nothing
  more to that topic, so a rejoin with an old key receives nothing; the
  helper would be one more function `anon` can call through PostgREST and
  one query per join.
- **Payload: a revision, then a refetch (chosen).** The page compares the
  revision with the one it draws and refetches through the same read the
  poll uses. Each message is idempotent; a lost one is healed by the next
  one, the rejoin read or the fallback poll; one read path draws the page.
  Rejected: the projection in the payload - a GM share and a player share
  need different payloads, GM notes would sit in `realtime.messages` for 3
  days, a large list nears the 256 KB cap, and a missed message leaves the
  page wrong until a full read.
- **Delete and re-create of a link.** Revoking sets `revoked_at`; a
  trigger sends `{ "revision": null }` to that share's topic once. The
  page refetches, `get_shared_list` answers null, the page draws "no
  longer available" and leaves the channel. A new link is a new row with a
  new token and a new `topic_key`; old viewers never learn it. Deleting a
  list cascades to its shares, and each active share's topic gets the same
  `null` message from the share trigger.

### 5.3 One message per list per transaction

`list_entries_touch` updates `lists` once per entry row, so a row trigger
on `lists` would send N messages for a reorder of N entries. The broadcast
trigger is a **deferred constraint trigger** (`after insert or update or
delete on public.lists deferrable initially deferred for each row`): it
fires at commit, marks the list id in a transaction-local setting
(`set_config('dhloot.broadcast', ..., true)`), skips a list already
marked, and reads the list's current row, so the one message carries the
final revision. A rolled-back transaction fires nothing. Realtime reads
`realtime.messages` through replication, so a viewer's refetch after a
message reads committed data.

With the write buffer (R5): one `apply_list_writes` request is one
transaction, so a flush sends one owner message per changed list, with the
final revision, whatever the number of writes in it. A refused write rolls
back its own subtransaction, and with it the trigger events it queued; the
deferred triggers fire once, at the request's commit, outside every
subtransaction. `realtime.send` catches its own failure and warns; the
trigger body catches the rest (the header parse, the lookups) and raises
a warning, not an error (step 2). So a send never fails the owner's
write.

### 5.4 The owner topic and echo suppression (Q1)

Each page load makes a tab id (`crypto.randomUUID()`) and sends it on
every PostgREST and RPC request as the header `x-dhloot-tab`. The trigger
reads `nullif(current_setting('request.headers', true), '')`, parses it
as `jsonb` inside its own `begin ... exception when others then v_by :=
null; end` block (a session that set the setting in an earlier
transaction reads `''`, and `''::jsonb` raises `22P02` at COMMIT, outside
`apply_list_writes`'s per-write handler), takes `->> 'x-dhloot-tab'`,
keeps it only when it matches `^[A-Za-z0-9-]{1,40}$`, and puts it in the
owner message as `by`. `apply_list_writes` is `security invoker` and the
trigger runs in the same transaction, so the setting reads the same there;
`keepaliveFetch` passes `init` through, so a `keepalive` flush keeps its
headers. A tab ignores a message whose `by` is its own id - exact echo
suppression for its own writes (one request per flush, one tab id). A
message from another tab or device is ignored when its `revision` is at
or below the revision of the list's last read; otherwise it asks
`CloudLists` for a re-read, which the existing `#pull` rule already
defers until the buffer is empty and nothing is in flight (section 6.3).
Rejected: the JWT's `session_id` as `by` - two tabs of one browser share a
session and would drop each other's edits; returning the revision from
every write - an entry write does not return its list's revision, and a
reorder bumps it N times. Fallback when the gateway refuses the header
(CORS): send no header; `by` is null and an own write costs one re-read
after the buffer drains.

### 5.5 Reorder from a stale device (D56)

`reorder_list(p_list, p_entries)` today refuses (`22023`) when `p_entries`
is not exactly the list's entry set. Replaced (same signature, same
grants - `apply_list_writes` calls it by name): ids that are not entries
of the list are ignored, a repeated id counts once, and entries missing
from `p_entries` keep their relative `(position, id)` order after the
given ones. Still refused: not the owner (`42501`), `p_entries` null
(`22023`). The fake and the contract move with it in `B3.1`, because
`B3.1`'s E2E runs the contract on the real adapter. The precursor
`B3.0` first makes `main`'s contract pass under both rules, because the
test project is shared (section 10.0). Last write wins per entry stays
the rule.

## 6. Design: the client

### 6.1 The port

`CloudPort` gains `events: EventsPort` (the roadmap's
`CapabilityEventsPort`, named for what it carries):

```ts
export type LiveStatus = 'live' | 'down';
export interface EventsPort {
  /** Joins the private topic; `status` reports each join and each loss. The
   *  message is untyped here and validated by `lib/live.ts`. */
  subscribe(
    topic: string,
    on: { message(event: string, payload: unknown): void; status(s: LiveStatus): void }
  ): () => void;
  /** This page load's tab id, sent as `x-dhloot-tab` (section 5.4). */
  readonly tab: string;
}
```

Real (`supabase.ts`): `client.channel(topic, { config: { private: true } })`,
`.on('broadcast', { event: '*' }, ...)`, `.subscribe(status => ...)`:
`SUBSCRIBED` -> `live`; `CHANNEL_ERROR`, `TIMED_OUT`, `CLOSED` -> `down`.
The unsubscribe calls `client.removeChannel(ch)`. `createClient` gains
`global: { headers: { 'x-dhloot-tab': tab }, fetch: keepaliveFetch(url) }`.
Lazy (`lazy-cloud.ts`): queues a subscribe until the chunk loads; a chunk
that never loads answers `down`. Fake (`fake-cloud.ts`): answers `live` on
a microtask unless the test switch `setLive(false)` is on; each `apply`
call sends what the triggers send - one owner message per changed list per
call (`by` = the fake's tab) and one share message per active share of it;
`window.__dhlootFake.play(listId, patch)` edits a list as another device
(`by: 'other-device'`). The contract (`cloud.contract.ts`) gains an events
case run against the fake (layer 1) and the real adapter in Node (layer 4;
Node 22 has a global `WebSocket`).

### 6.2 The feed state machine (`app/src/lib/live.ts`, pure)

States: `off` (no topic), `connecting`, `live`, `down`. Events: `watch`,
`joined` (port `live`), `lost` (port `down`), `timeout` (no join in
10 s), `retry` (backoff timer), `stop`.

| From | Event | To | Effect |
|---|---|---|---|
| `off` | `watch` | `connecting` | subscribe; start the 10 s join timer |
| `connecting` | `joined` | `live` | stop the poll; one refetch (covers the gap before the join) |
| `connecting` | `timeout` or `lost` | `down` | start the poll; schedule `retry` |
| `live` | `lost` | `down` | start the poll; one refetch; schedule `retry` |
| `down` | `retry` | `connecting` | unsubscribe, subscribe again |
| `down` | `joined` | `live` | stop the poll; one refetch; reset the backoff |
| any | `stop` | `off` | unsubscribe; clear the timers |

Backoff: 2 s, doubled per failed attempt, capped at 300 s, each delay
+/-20 % from the injected `Random`; a join resets it. A platform-limit
refusal is a `lost` like any other; the cap keeps a limited project at
one join per tab per 5 minutes. The 24-hour anon cut is a `lost`, then a
normal rejoin. `lib/live.ts` also holds `readShareMessage(payload)` and
`readOwnerMessage(payload)` (shape checks; anything else is dropped).

Driver: `app/src/state/liveFeed.svelte.ts`, class `LiveFeed` with
`state = $state<...>`, taking the port, the timer functions and `Random`
(the `CloudLists` pattern, so a unit test drives time). One `LiveFeed`
per topic.

### 6.3 Who subscribes, and what a message does

- **Share page** (`SharedView`): after a read that is `ready`, watch
  `share:<topic_key>`; a new `topic_key` rewatches. A message with a
  revision above the drawn one schedules one refetch after 250 ms (later
  messages in the window join it); `revision: null` refetches now, and
  the resulting `gone` stops the feed. `close()` stops it. `SharedRow`
  already carries `revision` and `topic_key`.
- **Owner** (`CloudLists`, Q1): while signed in and the route is the lists
  index or an account list page, watch `owner:<uid>`; sign-out stops it.
  A message: `by` equal to `events.tab` -> ignore; `revision` at or below
  the list's last read `revision` -> ignore; else `remoteChange()`: a
  coalesced (250 ms) `#pull`, which the existing rule turns into a re-read
  when the buffer is empty and nothing is in flight. A list `revision:
  null` (deleted elsewhere) is a re-read too. `LIST_SELECT`, `ListRow`
  and `CloudList` gain `revision`.
- **The poll** (`AppState`): the 45 s interval keeps moving `now`; it
  re-reads the share page only while its feed is not `live`, and the
  owner lists only while the owner feed is not `live`. The refetch when
  the tab is shown again stays in every state. While `live`, a safety
  re-read every 5 minutes (Q3).
- **A failed first share read (D59)**: the poll (while the feed is not
  `live`, which holds for a page that never read) and the shown-again
  signal also re-read a page in `error`, through the same path as
  «Повторить».

### 6.4 Hidden tabs and connections

The channel stays open while the tab is hidden. Reason: the browser keeps
the socket, the rejoin and refetch on return cost more than an idle
socket, and the project is far below 200 connections. Trade-off accepted:
a forgotten background tab holds one connection (an anon one for at most
24 hours). If the monthly check (roadmap section 15, step 18) shows a
peak above 150, a later release closes the channel after a minute hidden.

### 6.5 What the reader sees

Nothing new is drawn: no live badge. The share page's «Обновлено N
назад» moves to «только что» after a live refetch, as after a poll. One
visually hidden polite status region on the share page
(`SharedListPage.svelte`, none exists today) announces «Список обновлён» /
"The list was updated" when a refetch (live or poll) changes the drawn
revision - once per change, never on a clock tick.

### 6.6 A write that never answers (D57)

The real adapter gives every `apply` request and every share write an
`AbortSignal.timeout(20000)` (`.abortSignal()` on the RPC builder).
`keepaliveFetch` rethrows an aborted request and never resends it; an
abort is `network`, so the buffer keeps the request, shows «Не сохранено
- Повторить» and retries. Safe because every write is idempotent on
client-made ids. Needed here because a buffer stuck in flight would also
defer every owner-topic re-read forever; «Поделиться», «Сохранить себе»
and the move wait behind it too.

## 7. Quotas and the owner's check

Estimate for one game session: a list with a player share and a GM share,
5 viewers, the owner on 2 devices, 200 saved flushes. Per flush: 2 share
sends + 1 owner send, delivered to 5 + 2 clients = 3 + 7 = 10 messages;
2000 per session; with the 5-minute safety read none more. 2 million a
month holds about 1000 such sessions. The write buffer (2 s quiet window)
makes a flush rarer than an edit, so the estimate is high. Connections:
one per open tab; 200 is far above a personal tool's peak. Heartbeats are
not documented as messages. The nightly usage report gains
`realtime_rows_24h` (rows of `realtime.messages` in the last 24 hours, a
lower bound: one row is delivered once per subscriber); roadmap section
15, step 18 stays for peak connections and billed messages (peak under
150, messages under 1.5 million); the action if passed is "raise the
safety interval or turn the owner topic off behind a constant". "Allow
public access" is a dashboard setting with no `config.toml` key: Q2.

## 8. Determinism, and what each layer proves

- **Layer 1** (vitest): `lib/live.ts` every transition and the backoff
  with a fixed `Random`; `LiveFeed` with fake timers; `SharedView` and
  `CloudLists` message handling (echo ignored, old revision ignored,
  coalescing, deferral while a write is buffered or in flight, `null`
  gone); the poll gate in `AppState`; the real adapter against a stubbed
  client (status mapping, private flag, header, timeout); the fake; the
  contract's events case; the tolerant reorder in the fake and the
  contract (`B3.1`).
- **Layer 2** (`tests/app/`, `dist-test/`): the fake answers `live` on a
  microtask, so every golden draws the same page; the hidden region is
  empty at capture. States cases: `play()` into an open `#/s/player-token-1`
  shows the change without a reload; `setLive(false)` then `play()` shows
  no change until the tab is shown again; `as=gm1` on an account list,
  `play()` from another device redraws it.
- **Layer 3** (`check:db`, local stack with `realtime` and `kong`): the
  triggers, the policies, the reorder and the usage row, with real
  WebSocket clients (`B3.1`).
- **Layer 4** (`npm run e2e`, test project): `B3.1` - the contract's
  tolerant reorder on the real adapter; `B3.2` - an owner edit reaches an
  open anon share page in under 10 s (the poll is 45 s, so the time proves
  the live path); a revoke draws "no longer available" live; two pages of
  one owner see each other's edit (Q1); the contract's events case on the
  real adapter; the `x-dhloot-tab` header passes CORS (else its fallback).

## 9. Kept defects this release pays

| DEBT entry | Batch | How |
|---|---|---|
| D56 (a reorder refused after another device's edit) | `B3.1` | tolerant `reorder_list` (5.5); the fake and the contract follow; a `cloudLists.test.ts` case proves no toast; `DEBT.md` D56 deleted |
| D57 (a request that never answers) | `B3.2` | 20 s abort on every write (6.6), unit case with fake timers; `DEBT.md` D57 deleted |
| D59 (a failed first `#/s/` read not retried) | `B3.2` | the poll and the shown-again signal re-read an `error` page (6.3); unit case; `DEBT.md` D59 deleted, and the "Live updates" section with it |

Each is an acceptance line of its batch. R2's other deferred review rows
closed with R2 and R5.

## 10.0 Batch `B3.0` - the precursor contract commit on `main` (implement-ready)

**Why (review `plan-B3.1` B1; owner decision 2026-09-27).** The test
project is shared. After `B3.1`'s test push it runs the tolerant
`reorder_list` and answers `ok` to a stale reorder. `main`'s
`cloud.contract.ts` case G asserts `refused,ok` for `{ op: 'reorder',
ids: [c, a] }`, so every `npm run e2e` from `main` or another branch
would fail, and with it CI's `migrate-prod` and `deploy` (`ci.yml`:
`needs: [..., e2e]`). **The window it closes:** from `B3.1`'s test push
until R3's closeout push, no other change could deploy, against
`.claude/README.md`, "Branch migrations on the test project" ("`main`'s
runs stay green while a branch is open"). Rejected: a stated freeze (no
push to `main` and no other E2E in that window) - it stops every other
release for the length of R3.

**Objective.** `main`'s contract passes under the old and the new
`reorder_list`, pushed before `B3.1`'s test push.

**Placement.** After `display-settings` ships (one session on `main`),
before `B3.1` starts. It is R3's first commit and it is pushed, so the
amend window of that commit closes: `B3.1` makes a new commit, and
`B3.2` and the closeout amend `B3.1`'s commit. The push before closeout
is the owner's decision of 2026-09-27 (`CLAUDE.md`, "Source and commit
conventions").

**Files.** `app/src/ports/cloud.contract.ts` and `docs/specs/COVERAGE.md`
(and this task's `handoff.md`).

**Note (review `plan-B3.1-2` R7).** Any other branch that runs `npm run
e2e` in the window between `B3.1`'s test push and R3's closeout push
needs `B3.0` in its base first, or its `cloud.contract.ts` case G fails
against the tolerant `reorder_list`.

**Steps.**

1. In case G, "A refused write drops alone": replace the refused write
   `{ op: 'reorder', list_id: id, ids: [c, a] }` with `{ op: 'add',
   list_id: id, entries: [entryOf(lists.newId(), 'ci1', 3)] }` (`ci1` is
   already in the list; `unique (list_id, item_key)` refuses it under
   both rules, `23505` -> `refused`). Keep the rename after it and the
   `refused,ok` assertion; change the assertion message from "a reorder
   that misses an entry, then a rename" to "a second entry for one
   record, then a rename", and `theList`'s label "after the refused
   reorder" to "after the refused add".
2. Add no stale-reorder assertion: `B3.1` adds the tolerant one.
3. `docs/specs/COVERAGE.md`, contract selection G: "a `reorder` that
   misses an entry refused" becomes "a second entry for one record
   refused".

**Acceptance.**

- Case G asserts no reorder refusal; the fake (strict until `B3.1`)
  and the real adapter both answer `refused,ok` for the duplicate `add`.
- `npm run e2e` passes against the test project's current (strict)
  `reorder_list`.
- The commit is on `origin/main` before `B3.1`'s test push.

**Verification.** `rtk npm run check` (Bash, one foreground call,
timeout 600000; the contract runs over the fake in vitest), then `npm
run e2e` (the contract on the real adapter, about 2 minutes), then the
commit `test(e2e): refuse a duplicate add in the contract's refused-write
case`, then `git push` (the owner's decision). No `check:db`: nothing
under `supabase/` or `tests/db/` changes. No `check:built`: nothing is
drawn. About 15 minutes.

**Review.** Not required (no trigger fired: a test-only change to one
contract case, covered by this plan's second-look review).

**Split criterion from `B3.1`.** A commit the harness cannot reach
otherwise: it must be on `origin/main` before `B3.1`'s test push, while
`B3.1`'s own commit stays unpushed until closeout (owner, 2026-09-27).

## 10. Batch `B3.1` - the database half and the tolerant reorder (implement-ready)

**Objective.** The broadcast triggers, the `realtime.messages` policies
and the tolerant reorder (D56) in the database, the fake and the
contract; the usage report's Realtime row; all proven by layer 3 with
real WebSocket clients against a local stack that now runs Realtime.

**In scope.** One migration and its reversal; the local stack's service
list and `tests/db/run.mjs`; `tests/db/realtime.test.mjs` (new); the
reversibility and applier comparisons of the realtime policies; the
reorder cases in `tests/db/`; the fake's reorder, its tests and the
contract case G; one `cloudLists.test.ts` case; the usage row; specs,
README, `DEBT.md` D56, decisions.

**Out of scope.** Every other `app/` file (`B3.2`); the contract's
duplicate `add` (`B3.0`); pushing to production (CI's `migrate-prod`).

**Files.**

| File | Change |
|---|---|
| `supabase/migrations/<ts>_realtime.sql` | new; `<ts>` later than every file in `supabase/migrations/` when the batch starts (today the newest is `20260927100900_usage_snapshots.sql`) |
| `supabase/reversals/<ts>_realtime.sql` | new |
| `tools/supabase/lib.mjs` | `realtime` and `kong` leave `LOCAL_STACK_EXCLUDES`; the comment above it says the stack runs Realtime for layer 3 |
| `tests/db/run.mjs` | a running stack without the realtime container is stopped and started again; passes `DHLOOT_API_URL`, `DHLOOT_ANON_KEY` and `DHLOOT_JWT_SECRET` from `supabase status -o json` to the suite (never printed); the header comment names the services |
| `tests/db/roles.mjs` | `jwtFor(role, sub)` (HS256 over the local JWT secret, `node:crypto`; claims `role`, `sub`, `aud: 'authenticated'` for a user, and `exp` one hour ahead - Realtime checks `exp`); `realtimePolicies(sql)` (the `dhloot_%` rows of `pg_policies` on `realtime.messages`, as sorted text); `commitAs` (step 7) |
| `tests/db/realtime.test.mjs` | new, the cases in step 7 |
| `tests/db/reversibility.test.mjs`, `tests/db/apply-pending.test.mjs` | every schema comparison also compares `realtimePolicies(sql)` |
| `tests/db/lists.test.mjs` | the four "refuses ..." cases of `reorder_list()` become the tolerant cases (step 8) |
| `tests/db/list-writes.test.mjs` | one case: a `reorder` op with a stale entry set answers `ok` and applies the tolerant rule |
| `tests/db/harness.test.mjs` | unchanged, and must pass: the new functions are trigger functions with no `anon` `execute` |
| `tools/supabase/usage.mjs`, `tools/supabase/usage-lib.mjs`, `tools/supabase/usage-lib.test.mjs`, `tests/db/usage.test.mjs` | `realtime_rows_24h` (step 9) |
| `app/src/ports/fake-cloud.ts` | `reorder` follows the tolerant rule (step 10) |
| `app/src/ports/fake-cloud.test.ts` | the reorder expectations follow (step 10) |
| `app/src/ports/cloud.contract.ts` | case G (its refused write is already the duplicate `add` from `B3.0`): a stale `reorder` answers `ok` (step 10) |
| `app/src/state/cloudLists.test.ts` | one case: a stale reorder shows no toast; one retitle (step 10) |
| `docs/specs/FEATURES.md` "Account and browser lists", **Two devices** | one sentence: a reorder made on a device with an old entry set keeps the given order and puts the other entries after it; nothing is refused |
| `docs/specs/COVERAGE.md` | contract selection G (a stale `reorder` answers `ok`; `B3.0` already wrote the duplicate `add`); `tests/db/` paragraph (the stack runs the database, Realtime and Kong; `realtime.test.mjs`; `lists.test.mjs` "`reorder_list()` and its refusals" becomes its tolerant rule and refusals; the reversibility gate compares the realtime policies; `usage.test.mjs`'s Realtime row) |
| `docs/specs/DEBT.md` | D56 deleted; the "Live updates" section's intro names D57 and D59 only |
| `.claude/README.md` | "The database suite" and "Batch size and the fixed cost of a run": the measured first start (image pull) and warm run with Realtime; "Usage monitoring": the `realtime_rows_24h` info row; any line that lists the local stack's services (the restore drill now starts Realtime and Kong too) |
| `docs/decisions/` | four new files and the pointer lines they need (step 11); `node tools/decisions.js` |

**Steps.**

1. Spike, no commit (PowerShell tool, stack commands only). Warning:
   rule 2u refuses a stack command while another checkout holds the local
   stack lock, and the spike itself takes no lock; start it only when no
   other session runs `check:db` or the restore drill. Start the stack
   with the new excludes and record in the handoff:
   (a) after `supabase db reset --local` with the realtime container
   running, `realtime.messages` and `realtime.topic()` exist;
   (a2) a migration that creates a policy on `realtime.messages` applies
   inside `db reset --local` (write the step 3 policy into the new
   migration file first; the reset applies it);
   (a3) the same policy statement applies, and drops again, through a
   plain `postgres` connection to `DHLOOT_DB_URL` (the path of the
   reversibility walk's `applySql`, `apply-pending` and CI's
   `migrate-test`; `create policy` needs the table owner's rights) - a
   Node `postgres` script;
   (b) `supabase status -o json` names the API URL, the anon or
   publishable key and an HS256 JWT secret (`JWT_SECRET`);
   (c) a Node `@supabase/supabase-js` client with the anon key joins a
   private channel `share:<uuid>` once the policy exists, and receives a
   `realtime.send` sent as `postgres` through a Node `postgres` script
   or `docker exec supabase_db_<project id> psql -U postgres` (this host
   has no `psql` client on the path).
   Fallbacks:
   - (a) fails but (a2) and (a3) pass -> every reset site restarts the
     realtime container after its reset (`docker restart
     supabase_realtime_<project id>`, then wait until
     `to_regclass('realtime.messages')` is not null, at most 60 s): one
     helper beside `runningContainer` in `tools/supabase/restore.mjs`,
     called by `resetLocal()` in `tests/db/roles.mjs`, by `run.mjs`'s
     reset, and by `resetLocal()` in `tools/supabase/restore.mjs` (which
     `restore-drill.test.mjs`, `restore-prod.test.mjs`,
     `restore-drill.mjs` and `restore-prod.mjs` use). With the fallback,
     re-measure `check:db` (about eight resets per run) and raise the
     `db` job's `timeout-minutes: 20` in `ci.yml` when the measured run
     is above 15 minutes; the README records the cost.
   - (b) gives no HS256 secret, or (c) fails with a JWT error -> start
     `gotrue` too (drop it from the excludes) and sign in a seeded user
     for a real token in place of `jwtFor`; the anon key serves `anon`.
   **Stop** and report to the orchestrator for a planner pass when (a2)
   or (a3) fails (the migration cannot apply on the local stack or on a
   plain connection) or when (c) fails for another reason: each changes
   the design, not the steps.
2. Migration, trigger functions (`security definer`, `set search_path =
   public, pg_temp`, `realtime.send` schema-qualified, positional
   arguments `(payload, event, topic, true)`):
   - `public.lists_broadcast()`: `v_id := coalesce(new.id, old.id)`; skip
     when `v_id` is in `current_setting('dhloot.broadcast', true)`, else
     append it with `set_config(..., true)`; read `owner_id, revision`
     from `public.lists` by `v_id` (not found: `coalesce(new.owner_id,
     old.owner_id)`, revision null - a list created and removed in one
     request fires its INSERT event first, where `old` is null, and the
     mark skips the DELETE event); send `jsonb_build_object('list', v_id,
     'revision', v_rev, 'by', v_by)` as event `list` to `'owner:' ||
     v_owner`; for each share of `v_id` with `revoked_at is null`, send
     `jsonb_build_object('revision', v_rev)` as event `revision` to
     `'share:' || topic_key`. Return null.
   - `v_by`: `v_raw := nullif(current_setting('request.headers', true),
     '')`; then `begin v_by := (v_raw::jsonb) ->> 'x-dhloot-tab';
     exception when others then v_by := null; end;`; then null unless it
     matches `^[A-Za-z0-9-]{1,40}$` (section 5.4).
   - Everything after the mark (the lookup, the header, the sends) sits in
     one `begin ... exception when others then raise warning
     'lists_broadcast: % (%)', sqlerrm, sqlstate; end;` block, so an
     unexpected error warns and the owner's commit goes on. The same
     wrapper holds the send in `list_shares_gone()`.
   - `create constraint trigger lists_broadcast after insert or update or
     delete on public.lists deferrable initially deferred for each row
     execute function public.lists_broadcast();`
   - `public.list_shares_gone()`: when `old.revoked_at is null` and
     (`tg_op = 'DELETE'` or `new.revoked_at is not null`), send
     `jsonb_build_object('revision', null)` as event `revision` to
     `'share:' || old.topic_key`. Trigger: `after update of revoked_at or
     delete on public.list_shares for each row`.
   - `revoke execute ... from public, anon, authenticated` on both.
   - Comments (one to three lines each, `CLAUDE.md` "Comments"): why
     deferred (cite the decision "Share topics use topic_key and carry
     only a revision; the page refetches"), why no `insert` policy.
3. Migration, policies:
   ```sql
   create policy dhloot_share_topics_receive on realtime.messages
     for select to anon, authenticated
     using (realtime.messages.extension = 'broadcast'
       and realtime.topic() ~ '^share:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
   create policy dhloot_owner_topic_receive on realtime.messages
     for select to authenticated
     using (realtime.messages.extension = 'broadcast'
       and realtime.topic() = 'owner:' || (select auth.uid())::text);
   ```
4. Migration, `create or replace function public.reorder_list(p_list
   uuid, p_entries uuid[])` with section 5.5's rule: the owner check as
   today; `p_entries` null -> `22023`; new positions = the distinct given
   ids that are entries of the list, in given order (first occurrence),
   then the list's other entries in `(position, id)` order; one `update`.
   Grants as today (`revoke ... from public, anon`; `grant ... to
   authenticated`). The header comment of the function states the rule.
5. Reversal: drop both triggers, both functions, both policies; restore
   `reorder_list` exactly as `20260925130100_lists.sql` defines it (copy
   the body and its comment; the reversibility walk compares the schema).
   The migration drops nothing, but it replaces a function, so the
   reversal is real SQL, never `-- additive`.
6. `tools/supabase/lib.mjs`, `run.mjs` and `roles.mjs` as in the file
   table. The service check in `run.mjs`: `runningContainer(
   'supabase_realtime_' + localProjectId(toml))` (import
   `runningContainer` from `tools/supabase/restore.mjs`, `localProjectId`
   from `lib.mjs`; `run.mjs` already reads `config.toml`); when it is null
   and the stack is up, run `supabase stop`, then `start -x
   LOCAL_STACK_EXCLUDES`. Extend `dbUrl` into one status read that returns
   `DB_URL`, `API_URL`, `ANON_KEY` (or the key step 1 (b) names) and
   `JWT_SECRET`.
7. `tests/db/realtime.test.mjs` (node:test, `@supabase/supabase-js` with
   the local API URL; each case ends by removing its channels; a receive
   waits at most 5 s; the first case connects a client first, which makes
   the day's partition). Warning: a deferred trigger fires only at
   commit, and `asRole` always rolls back, so a sending case cannot use
   it. Add `commitAs(sql, { role, sub }, fn)` to `roles.mjs`: the same
   `set local role` and `request.jwt.claims` as `asRole`, in a
   transaction that commits. Seed `auth.users` and the lists as
   `postgres` in a committed setup, and delete every committed row in the
   case's `finally`. Cases, each titled by its behaviour:
   - an owner's list update sends one `revision` message to each active
     share topic with the final revision, and none to a revoked share's
     topic (assert the received payload is exactly `{ revision }`);
   - a reorder of five entries in one call sends one message per topic,
     carrying the list's final revision;
   - one `apply_list_writes` call with three writes (an update, an `add`,
     a `remove_entries`) sends one message per topic, and a call whose
     only write is refused sends none (count rows in `realtime.messages`
     by topic as `postgres`);
   - a rolled-back transaction sends none;
   - revoking a share sends `{ revision: null }` to its topic once;
     deleting the list sends it to each active share's topic;
   - the owner topic receives `{ list, revision, by: null }` on an update,
     an insert and a delete (`revision: null`); a request with
     `request.headers` `{"x-dhloot-tab":"tab-1"}` set by `set_config`
     carries `by: "tab-1"`, a malformed one carries null;
   - on one connection, a committed transaction sets `request.headers`
     with `set_config(..., true)`; a later committed write on the same
     connection, with no header, commits and sends `by: null` (the
     setting reads `''` there, not null);
   - `anon` joins `share:<valid uuid>` (`SUBSCRIBED`) and receives;
     `anon` is refused `share:not-a-uuid`; `anon` and another user are
     refused `owner:<uid>`, the owner joins it;
   - a client cannot send on a private share channel: a second subscriber
     receives nothing from `channel.send` within 2 s;
   - a public (not private) channel with a share topic receives nothing
     from a database send;
   - the reversibility snapshot names both policies after the migration
     and neither after the reversal.
8. `lists.test.mjs`, `describe('reorder_list()')`: keep "rewrites the
   order and bumps the list", "refuses B's list, and a caller with no user
   id" and "refuses anon"; replace the four `refuses ${what}` cases with:
   an unknown id (`EB`, user B's entry) is ignored, and `EB` keeps its
   position in B's list (the `list_id` filter under `security definer`);
   a missing entry keeps its place after
   the given ones (`[E3, E1]` -> `E3, E1, E2`); a repeated id counts once
   (`[E3, E1, E1]` -> `E3, E1, E2`); a null element is ignored; null
   `p_entries` is refused `22023`. `list-writes.test.mjs`: one case, a
   `reorder` op `[E3, E1]` answers `OK` and reads back `E3, E1, E2`.
9. The usage row (placed by R11): `collect()` in `tools/supabase/usage.mjs`
   gains `realtime_rows_24h`, the count of `realtime.messages` rows with
   `inserted_at >= now() - interval '24 hours'`, read like
   `readStorage` (0 with a note when the table does not exist, null with
   a note when the role may not read it); `usage-lib.mjs` `INFO` gains
   `{ key: 'realtime_rows_24h', label: 'Realtime messages (24 h, lower
   bound)', unit: 'count' }`. Tests: `usage-lib.test.mjs` (the row is
   `info`, never warns; a null reads as null), `tests/db/usage.test.mjs`
   (one `realtime.send` as `postgres` raises the count by one over a
   baseline; the read-only transaction case still passes).
10. The fake and the contract:
    - `fake-cloud.ts` `reorder`: drop the `same` check; order = the
      distinct given ids that are entries of the list (first occurrence),
      then the other entries in their current order; `GONE` for a list
      the caller does not hold, as today.
    - `fake-cloud.test.ts`: in "answers another user's list as gone or
      refused, ...", `reorder 201 []` and `reorder 201 [2101]` answer
      `OK`; retitle it without "a reorder that misses an entry"; in
      "applies the writes beside a refused one, in one call", the refused
      write becomes an `add` of a second entry for a record the list
      holds; add "a reorder with a stale entry set keeps the given order
      and puts the other entries after it".
    - `cloud.contract.ts` case G: its refused write is already the
      duplicate `add` (`B3.0`). After it, add a stale reorder: `{ op:
      'reorder', list_id: id, ids: [a, c] }` answers `ok` and reads back
      `a, c, b` (the order before the call is `c, a, b`, so a reorder
      that did nothing fails the case).
    - `cloudLists.test.ts`: another device adds an entry through the same
      fake's `lists.apply`; the store, which has not re-read, moves an
      entry; after the quiet window no toast is said, and the server
      order holds the moved entry where it was put and the other device's
      entry after the given ones. Retitle "says the entry limit alone
      when the refused add is followed by its reorder" to "says the entry
      limit alone when an add is refused" (its reorder is no longer
      refused). The `#send` comment in `cloudLists.svelte.ts` about "the
      reorder's refusal" is `B3.2`'s (it edits that file).
11. Specs, README, `DEBT.md` D56 as in the file table. Decisions (template
    `.claude/templates/decision.template.md`, at most fifteen non-blank
    lines each, both pointer directions):
    - `2026-09-26-the-owners-devices-subscribe-to-a-private-owner-topic.md`
      (owner, Q1, 2026-09-26): `owner:<uid>`, `{ list, revision, by }`,
      echo suppression by `x-dhloot-tab`; rejected: the owner's devices
      on the poll only (the 2026-09-24 "not subscribed in v1"), the JWT
      `session_id` as `by`; `Amends` the 2026-09-24 Realtime decision,
      whose file gains the `Amended by` line.
    - `2026-09-26-while-realtime-is-live-a-safety-re-read-runs-every.md`
      (owner, Q3, 2026-09-26): a 5-minute re-read while the feed is
      `live`; rejected: no timed read while live (an undelivered message,
      platform report of 2026-09-21, lasts until the next edit, focus or
      rejoin); `Amends` "Realtime is the primary live path; the 45 s
      poll runs while it is down" (2026-09-25), whose file gains the
      `Amended by` line.
    - `2026-09-26-realtime-allow-public-access-is-off-set-by-the.md`
      (owner, Q2, 2026-09-26): "Allow public access" off on both
      projects, a dashboard setting the owner sets after `B3.2` is live
      and reads back each release; rejected: leaving it on (any key
      holder relays on public channels and spends the quota); `Amends`
      "Supabase configuration is code; the dashboard is read..."
      (2026-09-24) as a named exception, whose file gains the `Amended
      by` line. Use the exact title from `docs/DECISIONS.md`.
    - `2026-09-27-a-stale-reorder-keeps-the-given-order-and-puts-the.md`
      (planner): the tolerant rule of 5.5; rejected: refusing and
      re-reading (D56, a toast for no loss), a client re-read before each
      reorder (a round trip per drag, still racy).
    Then `node tools/decisions.js`; `node tests/derived.js`.

**Acceptance.**

- `npm run check:db` passes with `realtime` and `kong` running; every
  case in steps 7, 8 and 9 is in the output.
- One message per list per transaction and per `apply_list_writes` call,
  with the final revision; a refused write and a rolled-back transaction
  send nothing (step 7).
- A share topic payload has the single key `revision`; no case finds a
  list id, a token or a user id in it.
- No `insert` policy on `realtime.messages` from this migration; a client
  send is not delivered.
- Reversal: the up-down-up gate and the walk pass, and the realtime
  policies are part of the compared state.
- D56 (inherited): a reorder with a stale entry set is applied by the
  tolerant rule, never refused - in `lists.test.mjs`,
  `list-writes.test.mjs`, the fake, the contract (layer 1 and layer 4)
  and `cloudLists.test.ts` (no toast); `DEBT.md` D56 is deleted.
- Placed by R11 (closed 2026-09-27; `.claude/README.md`, "Usage
  monitoring"): the nightly usage report gains `realtime_rows_24h`, the
  rows of `realtime.messages` inserted in the last 24 hours (a lower
  bound of billed messages), as an info row; `usage.mjs`'s `collect`,
  `usage-lib.mjs`'s `INFO`, and both tests carry it.
- Harness invariants unchanged: `anon` executes only the listed public
  functions.
- The restore drill still starts its stack: `ensureStackWithAuth` reads
  the shorter `LOCAL_STACK_EXCLUDES` without a code change.
- A write never fails because of the broadcast: a committed write on a
  connection whose `request.headers` reads `''` commits and sends `by:
  null` (step 7); every trigger body error becomes a warning.
- `node tests/derived.js` passes (decision index current).
- `B3.1` starts from `main` after `display-settings` ships (section 15).
- Before the test push: `B3.0`'s commit is on `origin/main` (`git
  merge-base --is-ancestor <B3.0 sha> origin/main` exits 0).
- After the approving review: the migration is pushed to the test
  project and `npm run e2e` passes, the contract's stale reorder included.

**Verification.** In this order:

1. `rtk npm run check` (Bash tool, one foreground call, timeout 600000;
   400-600 s on this host, 2026-09-27; a run past the cap arms the gate by
   its own exit - "Run a long check", "Gate credit").
2. `npm run check:db` (PowerShell tool, alone, timeout 600000; 450-520 s
   warm on 2026-09-27 before Realtime; the first run adds the realtime
   and kong image pull and a stack restart, so expect it past the cap and
   armed by its own exit).
3. Commit (the task's one commit), then stop for the review.
4. After the approve (orchestrator resumes): confirm `B3.0` is on
   `origin/main` (acceptance), then `node --env-file=.env.test.local
   tools/supabase/db-push.mjs --project test --yes`, then `npm run e2e`
   (about 2 minutes), then the handoff amend.

Gate cost: spike about 10 minutes; `check` and `check:db` twice each with
one re-run, about 40 minutes; push and E2E about 5 minutes; about 55
minutes.

**Review.** Required: a migration with SECURITY DEFINER functions and
RLS policies (every `supabase/` batch), the first `anon` access to
`realtime.messages`, and a changed contract case.

**Risks and do-nots.** Do not set `private` to `false` in `realtime.send`
(the roadmap's section 5 row once had `false`; it is wrong for private
channels). Do not add an `insert` policy. Do not change a shipped
migration file (edit-guard refuses it). Do not push to the test project
before the approve (rule 2r refuses it) or to production at all. A
policy change takes effect for a joined channel only at its next join
(documented). Do not rename `reorder_list` or change its signature:
`apply_list_writes` calls it by name.

## 11. Batch `B3.2` - the client half (outline; a planner refresh expands it after `B3.1`)

**Objective.** Sections 6.1-6.6 in the app, the fake and layer 4, and
D57 and D59.

**Scope.** `ports/types.ts` (`EventsPort`, `LiveStatus`,
`CloudPort.events`), `ports/supabase.ts` (channels, the `x-dhloot-tab`
header beside `keepaliveFetch`, the 20 s abort, `revision` in
`LIST_SELECT`), `ports/lazy-cloud.ts`, `ports/fake-cloud.ts` and
`fake-cloud-seed.ts` (`revision`, the sends per `apply` call, `setLive`,
`play`), `ports/cloud.contract.ts` (events case), `lib/live.ts` (new),
`lib/cloudLists.ts` (`revision` on `ListRow` and `CloudList`),
`state/liveFeed.svelte.ts` (new), `state/sharedView.svelte.ts` (watch,
coalesced refetch, the `error` re-read), `state/cloudLists.svelte.ts`
(`remoteChange`, the owner feed), `state/app.svelte.ts` (the poll gate in
`#pollLists` and `#refreshShared`, the safety read, the feeds' start and
stop in `start()`, `stop()`, `#watchAccount` and the sign-in and sign-out
path - section 15 names the members it must not touch),
`components/SharedListPage.svelte` (the status region), `lib/dict.ts`
(one string per language), `tests/app/states.js` and
`tests/app/inventory.js` (three cases), goldens of the `#/s/` states (the
empty region), `tests/e2e/flows.mjs` and `contract.mjs`, specs
(`FEATURES.md` "Account and browser lists": the shared page and **Two
devices**; `STATE.md` the tab id in memory; `META.md` section 3 Realtime;
`I18N.md` the new string; `COVERAGE.md`), `DEBT.md`.

**Acceptance (placed items are their own lines).**

- The share page draws an owner edit without a reload within 1 s in
  layer 2 (fake) and within 10 s in layer 4 (real), and draws "no longer
  available" after a revoke without a reload.
- While the feed is `live` no 45 s re-read runs; while `connecting` past
  10 s or `down` it runs; a return to `live` refetches once.
- Backoff 2 s doubling to 300 s with +/-20 %, reset by a join (unit).
- [Q1] Two pages of one owner see each other's edits; an own echo causes
  no read (unit: `by` equal to the tab); an old revision causes no read;
  a message while a write is buffered or in flight re-reads only after
  the buffer drains (unit).
- D57 (inherited): an `apply` request with no answer for 20 s becomes
  `network`, `keepaliveFetch` does not resend it, and the buffer keeps it
  and retries (unit, fake timers); `DEBT.md` D57 deleted.
- D59 (inherited): a `#/s/` page whose first read failed reads again on
  the next poll and when the tab is shown again, with no press (unit);
  `DEBT.md` D59 deleted, and the "Live updates" section with it.
- D60 reworded: realtime-js is now called, so the slimmer client keeps
  it; the entry's **What** names storage-js and functions-js only, its
  heading drops "runs before `persist-3-realtime`", and its **How to
  verify** gives the new saving.
- The `x-dhloot-tab` header passes on the test project (E2E), or the
  fallback (no header) is in place and the handoff says so.
- Every new file is reached by a test; component tests end with
  `expectNoA11yViolations`.
- `B3.2`'s edits to `app.svelte.ts`, `dict.ts` and any component stay
  out of the `display-settings` members (section 15).
- Carried from `B3.1` (review `plan-B3.1` N4): the `#send` comment in
  `cloudLists.svelte.ts` no longer speaks of "the reorder's refusal".

**For the `B3.2` refresh to decide (review `plan-B3.1` R5).** A player
share's `revision` also moves on a GM note edit, so the status region
(6.5) would say «Список обновлён» for a change the player cannot see; the
poll does the same today. The refresh decides whether the announcement
compares the drawn content rather than the revision.

**Gates.** `rtk npm run check` x2 (~20 min), `npm run build:test` +
`npm run check:built` (~1 min), layer 2 filter group
`app/print,app/contracts,app/states,app/typo,app/hues,stub` (~10 min),
goldens compare and `--update` of the `#/s/` files, 4 shards (~13 min),
`npm run e2e` (~2 min; `B3.1`'s migration is already on the test
project). About 45 minutes.

**Review.** Required: changed UI (the status region) and a new port.

**Split criterion from `B3.1`.** A commit the harness cannot reach:
`B3.2`'s layer 4 needs `B3.1`'s migration on the test project, which is
pushed only after `B3.1`'s approving review; the gate sets also differ
(layer 3 against layers 1, 2 and 4).

## 12. Closeout

- `/handoff` audit; decisions final; roadmap section 5 R3 row, section 9
  row, section 12 rows and section 17 risk compacted to the shipped
  state; this directory deleted; one push of `B3.1`'s amended commit
  (`B3.0` was pushed on its own before it).
- Owner after the push: turn "Allow public access" off on both projects
  (Q2), read it back, and confirm a share page updates live on a phone.

## 13. Owner questions - answered 2026-09-26

Answers (owner, 2026-09-26, all as recommended): Q1 yes - the owner's own
devices subscribe to `owner:<uid>` in `B3.1` and `B3.2`, reversing the
2026-09-24 "not subscribed in v1"; `B3.1` writes the decision file named in
Q1. Q2 yes - "Allow public access" off on both projects, set by the owner
after `B3.2` is live and read back each release. Q3 yes - a 5-minute
safety re-read while Realtime reports `live`. The questions as asked:

1. **The owner's own devices live (the goal's "if cheap").** It is cheap:
   the same port, feed and trigger; one more topic and policy; R4 reuses
   the topic for requests. It reverses the 2026-09-24 decision's "The
   owner's own devices are not subscribed in v1". **Recommended: yes, in
   `B3.1` and `B3.2`.** Trade-off: one more channel per signed-in tab on
   the lists pages, and the per-tab header (section 5.4).
2. **"Allow public access" off on both hosted projects.** The app uses
   only private channels; with the setting on, anyone holding the
   publishable key can use the project's public channels as a free relay
   and spend its message quota. The setting has no `config.toml` key, so
   it is a dashboard click - an exception to "Supabase configuration is
   code". **Recommended: off, set by the owner after `B3.2` is live, with
   a line in the release checklist to read it back each release.**
   Trade-off: a dashboard value nothing diffs.
3. **A safety re-read while Realtime reports `live`.** An open platform
   report (2026-09-21) shows messages that are never delivered while the
   channel says `SUBSCRIBED`. **Recommended: while live, re-read every 5
   minutes (and on focus, as now).** Trade-off: one small read per viewer
   per 5 minutes; no Realtime quota.

## 14. Risks, assumptions, deferred

- Risk: `anon` on a private channel with the publishable key is
  documented but not measured; `B3.1` step 1 measures it locally and
  `B3.2`'s E2E on the test project. If it fails there, the share page
  stays on the poll (the feed is `down`, by design) and the release ships
  the owner topic only; the owner is told.
- Risk: `db reset --local` may drop the realtime tables (CLI issue 1073),
  or a migration may not see them during the reset; step 1 measures both,
  with a fallback for the first and a stop for the second.
- Risk: `check:db` was already 450-520 s before Realtime; two more
  containers and a restart when the drill left the stack without Realtime
  push it past the 600 s cap. Gate credit arms the gate by its exit; the
  README records the measured figure. CI's `db` job pulls two more images,
  and its `timeout-minutes: 20` is the hard limit: step 1's fallback (a)
  raises it when the measured run passes 15 minutes.
- Risk: the deferred constraint trigger runs at commit inside the
  writer's transaction; a failing `realtime.send` only warns (documented),
  so a write never fails because of Realtime. Layer 3 proves the sends,
  not the warning path (it needs a missing partition).
- Assumption: supabase-js passes the access token to Realtime after a
  refresh (`setAuth` on the auth change); the owner feed's rejoin after a
  `lost` covers a miss.
- Assumption: the gateway allows the custom header; fallback in 5.4.
- Fact: backups hold `auth` and `public` rows; `realtime.messages` rows
  are transient (3 days) and are not backed up; the policies come from
  the migrations on any restored database.
- Deferred: closing hidden tabs' channels (6.4); a live share panel on
  the owner's other device; Presence.

## 15. Placement and the overlap with `display-settings`

R3 is dispatched after `display-settings` ships and before R4 (R4's
`B4.1` trigger sends to R3's `owner:<uid>`). `display-settings` (batch
`B1`, in flight on `main`, not on `origin/main` at `f6079277`; review
`plan-B3.1` R4 completed this list) edits
`app/src/state/app.svelte.ts` (only the preference fields and setters:
`#tablesView`, `#printBW`, `#printCompact`, new `...Now` page-value
fields and `shown*`/`show*`/`*Changed` members, `setTablesView`,
`setPrintBW`, `setPrintCompact`), `PrintPage.svelte`, `TablesPage.svelte`,
`AccountPage.svelte`, `lib/dict.ts`, a new `KeepNote.svelte`,
`app/src/state/app.test.ts`, component tests (`printPage.test.ts`,
`tables.test.ts`, `accountPage.test.ts`), `tests/app/states.js`,
`tests/app/inventory.js` (with a new golden), `docs/specs/FEATURES.md`,
`docs/specs/COVERAGE.md`, `docs/specs/STATE.md`, `docs/DECISIONS.md`
and `docs/decisions/` (read from `main`'s working tree, 2026-09-27).

Shared files: `B3.0` edits `COVERAGE.md`; `B3.1` edits `FEATURES.md`,
`COVERAGE.md`, `DECISIONS.md` and `docs/decisions/`; `B3.2` edits
`app.svelte.ts`, `dict.ts`, `app.test.ts` (probably), `states.js`,
`inventory.js`, `FEATURES.md`, `COVERAGE.md` and `STATE.md`.

**Mitigation: the serial order.** `B3.0` starts on `main` only after
`display-settings` has committed and shipped, so every R3 batch starts
from a base that holds it, and no two sessions edit one file at once.
Never start an R3 batch from an older base, and never while
`display-settings` has uncommitted changes on `main`.

- `B3.2` edits `app.svelte.ts` only in `start()`, `stop()`,
  `#watchAccount`, `#refreshShared`, `#pollLists` and the sign-in and
  sign-out path, never the members above; it adds one key to `dict.ts`
  and does not change the keys `display-settings` adds. `B3.2`'s planner
  refresh re-reads these files on `main` after `display-settings` ships.
