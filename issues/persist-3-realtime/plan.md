# Plan - TASK persist-3-realtime (release R3: live updates through Realtime)

## Status

- Planning pass 1, 2026-09-25, planner, in a worktree cut from `da7378cb`
  (R2's task commit, not pushed). R2's `B2.3` (share panel, `#/s/<token>`,
  the poll, `SharedView`) is not in this tree; its in-progress code in the
  main tree was read for shape only.
- NEEDS_HUMAN_CONFIRMATION: no - the owner answered Q1-Q3 of section 13
  as recommended on 2026-09-26; the [Q1] steps stay in.
- Batches: `B3.1` (database) - implement-ready after the
  **[R2-refresh]** marks in section 10; `B3.2` (client) - outline, expanded
  by the refresh after R2 closes; closeout (section 12).
- Order (roadmap section 9): R2, R5, R3, R4. R3 is dispatched after R5 is
  live, so every step marked **[R2-refresh]** is re-read against the code
  on `main` at that time before an implementer starts.
- Roadmap: `issues/persistent-storage/plan.md` sections 5, 9, 12, 14, 15
  (step 18), 17. This file is R3's authority where the two differ.

## 1. Objective and current state

Goal: a shared page (`#/s/<token>`) and, if the owner agrees (Q1), the
owner's own account lists on another device show an edit within about a
second, through Supabase Realtime Broadcast from the database.

Owner, 2026-09-25: Realtime does not replace polling. Realtime is the
primary path. R2's poll (refetch on focus and every 45 s) is plan B and
runs whenever Realtime is not available: the channel is refused, not
connected, blocked by a network, errored, or a platform limit is hit.

State at `da7378cb` plus `B2.3` as planned:

- `lists.revision` goes up by one on every list update and on every entry
  insert, update and delete (`list_entries_touch`, one list update per
  entry row); a reorder of N entries bumps it N times in one transaction.
- `list_shares` has `topic_key uuid default gen_random_uuid()`, one per
  share row; `get_shared_list(token)` returns `revision`, `updated_at` and
  `topic_key` to anyone with the token. Rotate was dropped by the owner:
  "Delete link" calls `revoke_list_share` (sets `revoked_at`), a new link
  is a new row with a new token and a new `topic_key`.
- `B2.3` (main tree, in progress): `ShareRepository` (`list`, `create`,
  `revoke`, `read`, `ownerOf`, `clone`) on `CloudPort.shares`;
  `app/src/state/sharedView.svelte.ts` (`SharedView`: `open`, `refresh`,
  `retry`, `close`; `refresh()` replaces `shared` only when `updated_at`
  moved); `AppState` refreshes the share page from its 45 s interval (the
  same interval moves the relative-time clock `now`) and on the storage
  port's "shown again" signal. **[R2-refresh]**
- The owner's devices: `CloudLists` re-reads on focus and every 45 s while
  no write is queued (`app.svelte.ts` `#pollLists`, `LIST_POLL_MS`).
- No Realtime code exists: no `CloudPort` member, no channel, no policy on
  `realtime.messages`. `tests/db/run.mjs` starts the local stack with
  `realtime` excluded ("The release that ships Realtime removes `realtime`
  from this list").
- Deferred R2 review rows R3 (a reorder from a device with a stale entry
  set is refused with a toast) and R4 (a hanging write holds «Сохраняем...»
  with no timeout): section 9.

## 2. Scope and non-goals

In scope: the broadcast triggers, the `realtime.messages` policies, the
tolerant reorder (R2 row R3), the local stack with Realtime in layer 3,
the events port (real, lazy, fake), the live-feed state machine, the share
page live path, the owner topic for account lists (Q1), the write timeout
(R2 row R4), the layer 3 and layer 4 proofs, specs and decisions.

Non-goals: Presence (who is viewing); Postgres Changes; a visible "live"
badge; live updates of the share panel on the owner's other device (share
rows do not bump `revision`; the panel re-reads when opened); R4's
purchase-request events (R4 reuses the owner topic); closing the channel
while the tab is hidden (section 6.4, trade-off recorded); a Realtime
setting in `config.toml` (the CLI has none, section 7).

## 3. Existing behaviour and code paths

| Concern | Where |
|---|---|
| Revision bump, limits, reorder | `supabase/migrations/20260925130100_lists.sql` (`lists_before_update`, `list_entries_touch`, `reorder_list`) |
| Shares, projection | `supabase/migrations/20260925130200_list_shares.sql` (rotate removed by `B2.3` in the main tree) **[R2-refresh]** |
| Layer 3 runner and helpers | `tests/db/run.mjs` (`STACK_EXCLUDES`), `tests/db/roles.mjs` (`connect`, `asRole`, `snapshot`, `resetLocal`), `tests/db/reversibility.test.mjs`, `tests/db/apply-pending.test.mjs`, `tests/db/harness.test.mjs` (anon invariants) |
| Cloud port | `app/src/ports/types.ts` (`CloudPort`), `supabase.ts` (`createCloud`, `LIST_SELECT`, `writeOf`), `lazy-cloud.ts`, `fake-cloud.ts`, `fake-cloud-seed.ts`, `cloud.contract.ts` |
| Owner lists store | `app/src/state/cloudLists.svelte.ts` (`#pull` drops a read that overlapped a local write and re-reads when the queue is idle; `#apply` keeps an object whose `updated_at` did not move) |
| Share page state | `app/src/state/sharedView.svelte.ts` **[R2-refresh]** |
| Poll and focus | `app/src/state/app.svelte.ts` (`start()`, `#pollLists`, `#watchAccount`'s shown-again signal, `#refreshShared` from `B2.3`) **[R2-refresh]** |
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
`anon` with the publishable key, the CORS pass of a custom request header,
and the realtime tables after `db reset --local`. `B3.1` step 1 and
`B3.2`'s E2E measure them; each has a fallback (section 10).

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
  exists (the roadmap's "a forged message can only cause a refetch" is
  stronger now). The share policy checks the topic's shape only, not that
  the share is active. Rejected: a lookup of an active share through a
  `security definer` helper - after a revoke the triggers send nothing
  more to that topic (below), so a rejoin with an old key receives
  nothing; the helper would be one more function `anon` can call through
  PostgREST and one query per join.
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
  `null` message.

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

### 5.4 The owner topic and echo suppression (Q1)

Each page load makes a tab id (`crypto.randomUUID()`) and sends it on
every PostgREST and RPC request as the header `x-dhloot-tab`. The trigger
reads `current_setting('request.headers', true)::jsonb ->> 'x-dhloot-tab'`,
keeps it only when it matches `^[A-Za-z0-9-]{1,40}$`, and puts it in the
owner message as `by`. A tab ignores a message whose `by` is its own id -
exact echo suppression for its own writes. A message from another tab or
device is ignored when its `revision` is at or below the revision of the
list's last read; otherwise it asks `CloudLists` for a re-read, which the
existing `#pull` rule already defers until the write queue is empty
(section 6.3). Rejected: the JWT's `session_id` as `by` - two tabs of one
browser share a session and would drop each other's edits; returning the
revision from every write - an entry write does not return its list's
revision, and a reorder bumps it N times. Fallback when the gateway
refuses the header (CORS): send no header; `by` is null and an own write
costs one re-read after the queue drains.

### 5.5 Reorder from a stale device (R2 row R3)

`reorder_list(p_list, p_entries)` today refuses when `p_entries` is not
exactly the list's entry set. Replaced (same signature): ids that are not
entries of the list are ignored, a repeated id counts once, and entries
missing from `p_entries` keep their relative order after the given ones.
Still refused: not the owner (`42501`), `p_entries` null (`22023`). The
fake mirrors it (`B3.2`). Last write wins per entry stays the rule.

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
`global: { headers: { 'x-dhloot-tab': tab } }`. Lazy (`lazy-cloud.ts`):
queues a subscribe until the chunk loads; a chunk that never loads answers
`down`. Fake (`fake-cloud.ts`): answers `live` on a microtask unless the
test switch `setLive(false)` is on; every fake list write sends what the
triggers send (share topics and the owner topic, `by` = the fake's tab);
`window.__dhlootFake.play(listId, patch)` edits a list as another device
(`by: 'other-device'`). The contract (`cloud.contract.ts`) gains an
events case run against the fake (layer 1) and the real adapter in Node
(layer 4; Node 22 has a global `WebSocket`).

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

- **Share page** (`SharedView`) **[R2-refresh]**: after a read that is
  `ready`, watch `share:<topic_key>`; a new `topic_key` rewatches. A
  message with a revision above the drawn one schedules one refetch after
  250 ms (later messages in the window join it); `revision: null`
  refetches now, and the resulting `gone` stops the feed. `close()` stops
  it.
- **Owner** (`CloudLists`, Q1): while signed in and the route is the lists
  index or an account list page, watch `owner:<uid>`; sign-out stops it.
  A message: `by` equal to `events.tab` -> ignore; `revision` at or below
  the list's last read `revision` -> ignore; else `remoteChange()`: a
  coalesced (250 ms) `#pull`, which the existing rule turns into a re-read
  when the queue is idle if a write is queued or in flight. A list
  `revision: null` (deleted elsewhere) is a re-read too. `LIST_SELECT`,
  `ListRow` and `CloudList` gain `revision`.
- **The poll** (`AppState`): the 45 s interval keeps moving `now`; it
  re-reads the share page only while its feed is not `live`, and the
  owner lists only while the owner feed is not `live` (or Q1 is no).
  The refetch when the tab is shown again stays in every state. While
  `live`, a safety re-read every 5 minutes (Q3).

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
visually hidden polite status region on the share page announces
«Список обновлён» / "The list was updated" when a refetch (live or poll)
changes the drawn revision - once per change, never on a clock tick.
**[R2-refresh]**: reuse a status region if `B2.3` already has one.

### 6.6 A write that never answers (R2 row R4)

The real adapter gives every list and share write an
`AbortSignal.timeout(20000)` (`.abortSignal()` on the query builder and
the RPC); an abort is `network`, so the queue shows «Не сохранено -
Повторить» and retries. Safe because every write is idempotent on
client-made ids. Needed here because a queue stuck in flight would also
defer every owner-topic re-read forever.

## 7. Quotas and the owner's check

Estimate for one game session: a list with a player share and a GM share,
5 viewers, the owner on 2 devices, 200 saved edits. Per edit: 2 share
sends + 1 owner send, delivered to 5 + 2 clients = 3 + 7 = 10 messages;
2000 per session; with the 5-minute safety read none more. 2 million a
month holds about 1000 such sessions. Connections: one per open tab; 200
is far above a personal tool's peak. Heartbeats are not documented as
messages; the monthly check measures the real count. Roadmap section 15,
step 18 stays (peak under 150, messages under 1.5 million); the action if
passed is "raise the safety interval or turn the owner topic off behind a
constant". "Allow public access" is a dashboard setting with no
`config.toml` key: Q2.

## 8. Determinism, and what each layer proves

- **Layer 1** (vitest): `lib/live.ts` every transition and the backoff
  with a fixed `Random`; `LiveFeed` with fake timers; `SharedView` and
  `CloudLists` message handling (echo ignored, old revision ignored,
  coalescing, deferral while a write is queued, `null` gone); the poll
  gate in `AppState`; the real adapter against a stubbed client (status
  mapping, private flag, header, timeout); the fake; the contract's
  events case.
- **Layer 2** (`tests/app/`, `dist-test/`): the fake answers `live` on a
  microtask, so every golden draws the same page; the hidden region is
  empty at capture. States cases: `play()` into an open `#/s/player-token-1`
  shows the change without a reload; `setLive(false)` then `play()` shows
  no change until the tab is shown again; `as=gm1` on an account list,
  `play()` from another device redraws it.
- **Layer 3** (`check:db`, local stack with `realtime` and `kong`): the
  triggers, the policies and the reorder, with real WebSocket clients
  (`B3.1`, acceptance lines).
- **Layer 4** (`npm run e2e`, test project): an owner edit reaches an open
  anon share page in under 10 s (the poll is 45 s, so the time proves the
  live path); a revoke draws "no longer available" live; two pages of one
  owner see each other's edit (Q1); the contract's events case on the real
  adapter; the `x-dhloot-tab` header passes CORS (else its fallback).

## 9. Deferred R2 review rows

| Row | Belongs here | How |
|---|---|---|
| R3 (reorder refused when another device changed the entry set) | yes: it is the two-device sync problem this release is about | `B3.1`: tolerant `reorder_list` (section 5.5), layer 3 cases; `B3.2`: the fake mirrors it, and a unit case proves no toast for a stale reorder |
| R4 (a hanging write, no timeout) | yes: the owner topic defers its re-read until the queue is idle, so a hung write would stop live updates too | `B3.2`: 20 s abort on every write (section 6.6), unit case |

Both are acceptance lines of their batches (sections 10, 11). R2's other
deferred rows (L9, L10, R1b, R2, R5) stay with R2's closeout.

## 10. Batch `B3.1` - the database half (implement-ready after Q1)

**Objective.** The broadcast triggers, the `realtime.messages` policies
and the tolerant reorder, proven by layer 3 with real WebSocket clients
against a local stack that now runs Realtime.

**In scope.** One migration and its reversal; `tests/db/run.mjs` (stack
services, env for the WebSocket tests); `tests/db/realtime.test.mjs`
(new); the reversibility snapshot of the realtime policies; the reorder
cases in `tests/db/lists.test.mjs`; specs, README, decisions as listed.

**Out of scope.** Any `app/` code (all of it is `B3.2`); pushing to a
hosted project (CI's `migrate-test` and `migrate-prod`).

**Files.**

| File | Change |
|---|---|
| `supabase/migrations/<ts>_realtime.sql` | new; `<ts>` later than every file in `supabase/migrations/` when the batch starts (R5's migration lands first) **[R2-refresh]** |
| `supabase/reversals/<ts>_realtime.sql` | new |
| `tests/db/run.mjs` | `realtime` and `kong` leave `STACK_EXCLUDES`; a running stack without the realtime container is stopped and started again; passes `DHLOOT_API_URL`, `DHLOOT_ANON_KEY` and `DHLOOT_JWT_SECRET` from `supabase status -o json` to the suite (never printed) |
| `tests/db/roles.mjs` | `jwtFor(role, sub)` (HS256 over the local JWT secret, `node:crypto`); `realtimePolicies(sql)` (the `dhloot_%` rows of `pg_policies` on `realtime.messages`, as sorted text) |
| `tests/db/realtime.test.mjs` | new, the cases below |
| `tests/db/reversibility.test.mjs`, `tests/db/apply-pending.test.mjs` | every schema comparison also compares `realtimePolicies(sql)` |
| `tests/db/lists.test.mjs` | the old "entries do not match" refusals become the tolerant cases |
| `tests/db/harness.test.mjs` | unchanged, and must pass: the new functions are trigger functions with no `anon` `execute` |
| `docs/specs/FEATURES.md` "Lists" | the reorder rule for two devices (one sentence) |
| `docs/specs/COVERAGE.md` | `tests/db/` row: `realtime.test.mjs`, the stack now runs `realtime` and `kong`; the reversibility row names the realtime policies |
| `.claude/README.md` "The database suite" | the measured first start (image pull) and warm run with Realtime |
| `docs/decisions/` | the two files written by this planning pass stay; add the owner-topic file after Q1 (text in section 13) and the public-access file after Q2 |

**Steps.**

1. Spike, no commit (PowerShell tool, stack commands only; one session
   per stack). Start the stack with the new excludes, `db reset --local`,
   and record: (a) `realtime.messages` and `realtime.send` exist after the
   reset; (b) `supabase status -o json` names the API URL, the anon key
   and the JWT secret; (c) a Node `@supabase/supabase-js` client with the
   anon key joins a private channel `share:<uuid>` once a policy exists
   (apply the step 3 policy by hand in the spike). Fallbacks: (a) fails ->
   `run.mjs` restarts the stack (`stop`, `start`) in place of `db reset`
   and the README records the cost; (c) fails with a JWT error -> start
   `gotrue` too and sign in a seeded user for a real token.
2. Migration, trigger functions (`security definer`, `set search_path =
   public, pg_temp`, `realtime.send` schema-qualified, named arguments are
   not used - positional `(payload, event, topic, true)`):
   - `public.lists_broadcast()`: `v_id := coalesce(new.id, old.id)`; skip
     when `v_id` is in `current_setting('dhloot.broadcast', true)`, else
     append it with `set_config(..., true)`; read `owner_id, revision`
     from `public.lists` by `v_id` (not found: `old.owner_id`, revision
     null); send `jsonb_build_object('list', v_id, 'revision', v_rev,
     'by', v_by)` as event `list` to `'owner:' || v_owner` [Q1: omit this
     send if the answer is no]; for each share of `v_id` with `revoked_at
     is null`, send `jsonb_build_object('revision', v_rev)` as event
     `revision` to `'share:' || topic_key`. `v_by` from `request.headers`
     as in section 5.4, null when absent or malformed.
   - `create constraint trigger lists_broadcast after insert or update or
     delete on public.lists deferrable initially deferred for each row
     execute function public.lists_broadcast();`
   - `public.list_shares_gone()`: when `old.revoked_at is null` and
     (`tg_op = 'DELETE'` or `new.revoked_at is not null`), send
     `jsonb_build_object('revision', null)` as event `revision` to
     `'share:' || old.topic_key`. Trigger: `after update of revoked_at or
     delete on public.list_shares for each row`.
   - `revoke execute ... from public, anon, authenticated` on both.
   - Comments: why deferred (section 5.3, one line citing
     `docs/specs/FEATURES.md` "Lists" or the decision title), why no
     `insert` policy.
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
   The second only when Q1 is yes.
4. Migration, `create or replace function public.reorder_list(p_list
   uuid, p_entries uuid[])` with section 5.5's rule: owner check as
   today; `p_entries` null -> `22023`; new positions = the distinct given
   ids that are entries of the list, in given order (first occurrence),
   then the list's other entries in `(position, id)` order; one `update`.
   Grants as today.
5. Reversal: drop both triggers, both functions, both policies; restore
   `reorder_list` exactly as `20260925130100_lists.sql` defines it (copy
   the body; the reversibility walk compares the schema).
6. `run.mjs` and `roles.mjs` as in the file table. The service check: the
   container name `supabase_realtime_<project id>` in `docker ps
   --format {{.Names}}` (the runner already calls `docker`).
7. `tests/db/realtime.test.mjs` (node:test, `@supabase/supabase-js` with
   the local API URL; each case ends by removing its channels; a receive
   waits at most 5 s; the first case connects a client first, which makes
   the day's partition). Cases, each titled by its behaviour:
   - an owner's list update sends one `revision` message to each active
     share topic with the final revision, and none to a revoked share's
     topic (assert the received payload is exactly `{ revision }`);
   - a reorder of five entries in one call sends one message per topic,
     carrying the list's final revision;
   - three statements in one transaction (update, entry insert, entry
     delete) send one message per topic; a rolled-back transaction sends
     none (count rows in `realtime.messages` by topic as `postgres`);
   - revoking a share sends `{ revision: null }` to its topic once;
     deleting the list sends it to each active share's topic;
   - [Q1] the owner topic receives `{ list, revision, by: null }` on an
     update, an insert and a delete (`revision: null`); a request with
     `request.headers` `{"x-dhloot-tab":"tab-1"}` set by `set_config`
     carries `by: "tab-1"`, a malformed one carries null;
   - `anon` joins `share:<valid uuid>` (`SUBSCRIBED`) and receives; `anon`
     is refused `share:not-a-uuid`; [Q1] `anon` and another user are
     refused `owner:<uid>`, the owner joins it;
   - a client cannot send on a private share channel: a second subscriber
     receives nothing from `channel.send` within 2 s;
   - a public (not private) channel with a share topic receives nothing
     from a database send;
   - the reversibility snapshot names both policies after the migration
     and neither after the reversal.
8. `lists.test.mjs`: replace the mismatch refusals with: an unknown id is
   ignored; a missing entry keeps its place after the given ones; a
   repeated id counts once; null is refused; another user is refused.
9. Specs, README, decisions; `node tools/decisions.js`; `node
   tests/derived.js`.

**Acceptance.**

- `npm run check:db` passes with `realtime` and `kong` running; every
  case in step 7 and 8 is in the output.
- One message per list per transaction, with the final revision (step 7
  cases 2 and 3).
- A share topic payload has the single key `revision`; no case finds a
  list id, a token or a user id in it.
- No `insert` policy on `realtime.messages` from this migration; a client
  send is not delivered.
- Reversal: the up-down-up gate and the walk pass, and the realtime
  policies are part of the compared snapshot.
- R2 row R3 (inherited): a reorder with a stale entry set is applied by
  the tolerant rule, never refused; proven in `lists.test.mjs`.
- Placed by R11 (`issues/persist-usage-monitoring/plan.md` section 11):
  the nightly usage report gains `realtime_rows_24h`, the rows of
  `realtime.messages` inserted in the last 24 hours (a lower bound of
  billed messages), as an info row; `tools/supabase/usage-lib.mjs` and its
  test carry it **[R2-refresh]** (R11 ships before R3).
- Harness invariants unchanged: `anon` executes only the listed public
  functions.
- `node tests/derived.js` passes (decision index current).
- `B3.1` changes no `app/` file.

**Verification.** `rtk npm run check` (Bash tool, one foreground call,
timeout 600000; ~6 min); `npm run check:db` (PowerShell tool, alone,
timeout 600000; first run with the realtime and kong image pull ~10 min,
warm ~4 min). Gate cost: about 20-25 minutes with one re-run.

**Review.** Required: schema rule (every `supabase/` batch) and the
first `anon` access to `realtime.messages`.

**Risks and do-nots.** Do not set `private` to `false` in `realtime.send`
(the roadmap's section 5 row had `false`; it is wrong for private
channels). Do not add an `insert` policy. Do not change a shipped
migration file. Do not run the hosted projects' pushes. A policy change
takes effect for a joined channel only at its next join (documented).

## 11. Batch `B3.2` - the client half (outline; refresh after R2 closes)

**Objective.** Sections 6.1-6.6 in the app, the fake and layer 4.

**Scope.** `ports/types.ts` (`EventsPort`, `LiveStatus`, `CloudPort.events`),
`ports/supabase.ts` (channels, header, 20 s abort, `revision` in
`LIST_SELECT`), `ports/lazy-cloud.ts`, `ports/fake-cloud.ts` and
`fake-cloud-seed.ts` (`revision`, emits, `setLive`, `play`, tolerant
reorder), `ports/cloud.contract.ts` (events case), `lib/live.ts` (new),
`lib/cloudLists.ts` (`revision` on `ListRow` and `CloudList`),
`state/liveFeed.svelte.ts` (new), `state/sharedView.svelte.ts`
**[R2-refresh]**, `state/cloudLists.svelte.ts` (`remoteChange`, owner feed
[Q1]), `state/app.svelte.ts` (the poll gate, the safety read [Q3], the
feeds' start and stop on route and session) **[R2-refresh]**, the share
page component (the status region) **[R2-refresh]**, `lib/dict.ts` (one
string per language), `tests/app/states.js` (three cases), goldens of the
`#/s/` states (the empty region) **[R2-refresh]**, `tests/e2e/flows.mjs`
and `contract.mjs`, specs (`FEATURES.md` "Lists" shared page and account
lists, `STATE.md` the tab id in memory, `META.md` section 3 Realtime,
`I18N.md` the new string, `COVERAGE.md`).

**Acceptance (placed items are their own lines).**

- The share page draws an owner edit without a reload within 1 s in
  layer 2 (fake) and within 10 s in layer 4 (real), and draws "no longer
  available" after a revoke without a reload.
- While the feed is `live` no 45 s re-read runs; while `connecting` past
  10 s or `down` it runs; a return to `live` refetches once.
- Backoff 2 s doubling to 300 s with +/-20 %, reset by a join (unit).
- [Q1] Two pages of one owner see each other's edits; an own echo causes
  no read (unit: `by` equal to the tab); an old revision causes no read.
- R2 row R3 (inherited): the fake's reorder follows the tolerant rule;
  a stale reorder shows no «не сохранено» or refusal toast (unit).
- R2 row R4 (inherited): a write with no answer for 20 s becomes
  `network` and the queue retries (unit, fake timers).
- The `x-dhloot-tab` header passes on the test project (E2E), or the
  fallback (no header) is in place and the handoff says so.
- Every new file is reached by a test; component tests end with
  `expectNoA11yViolations`.

**Gates.** `rtk npm run check` x2 (~12 min), `npm run build:test` +
`npm run check:built` (~1 min), layer 2 filter group
`app/print,app/contracts,app/states,app/typo,app/hues,stub` (~5 min),
goldens `--update` 4 shards (~10 min, only the `#/s/` files may change),
`npm run e2e` (~2 min; needs `B3.1`'s migration on the test project - the
orchestrator applies it first, as in R2). About 30 minutes.

**Review.** Required: changed UI (the status region) and a new port.

**Split criterion from `B3.1`.** A commit the harness cannot reach:
`B3.2`'s layer 4 needs `B3.1`'s migration on the test project, which is
applied between the batches; the gate sets also differ (layer 3 against
layers 1, 2 and 4).

## 12. Closeout

- `/handoff` audit; decisions final (Q-dependent files written); roadmap
  section 5 R3 row, section 9 row, section 12 rows and section 17 risk
  compacted to the shipped state; this directory deleted; one push.
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
   the lists pages, and the per-tab header (section 5.4). If yes, `B3.1`
   writes `docs/decisions/2026-09-25-the-owners-devices-subscribe-to-a-private-owner-topic.md`
   with an `Amends` pointer to the 2026-09-24 Realtime file. If no, the
   steps marked [Q1] are dropped.
2. **"Allow public access" off on both hosted projects.** The app uses
   only private channels; with the setting on, anyone holding the
   publishable key can use the project's public channels as a free relay
   and spend its message quota. The setting has no `config.toml` key, so
   it is a dashboard click - an exception to "Supabase configuration is
   code". **Recommended: off, set by the owner after `B3.2` is live, with
   a line in the release checklist to read it back each release.**
   Trade-off: a dashboard value nothing diffs; if the Management API
   config endpoint carries it (`private_only`, unverified), a later
   release can move it into `config:push`.
3. **A safety re-read while Realtime reports `live`.** Your rule runs the
   poll whenever Realtime is unavailable, but an open platform report
   (2026-09-21) shows messages that are never delivered while the channel
   says `SUBSCRIBED` - "unavailable" that the page cannot see.
   **Recommended: while live, re-read every 5 minutes (and on focus, as
   now).** Trade-off: one small read per viewer per 5 minutes; no
   Realtime quota. Alternative: no timed read while live (a silent loss
   lasts until the next edit, focus or rejoin).

## 14. Risks, assumptions, deferred

- Risk: `anon` on a private channel with the publishable key is
  documented but not measured; `B3.1` step 1 measures it locally and
  `B3.2`'s E2E on the test project. If it fails there, the share page
  stays on the poll (the feed is `down`, by design) and the release ships
  the owner topic only; the owner is told.
- Risk: `db reset --local` may drop the realtime tables (CLI issue 1073);
  step 1 measures, the fallback costs a stack restart per run.
- Risk: CI's `db` job pulls two more images (`realtime`, `kong`); about a
  minute more per run. Recorded in `COVERAGE.md`.
- Risk: the deferred constraint trigger runs at commit inside the
  writer's transaction; a failing `realtime.send` only warns (documented),
  so a write never fails because of Realtime. Layer 3 proves the sends,
  not the warning path (it needs a missing partition).
- Assumption: supabase-js passes the access token to Realtime after a
  refresh (`setAuth` on the auth change); the owner feed's rejoin after a
  `lost` covers a miss.
- Assumption: the gateway allows the custom header; fallback in 5.4.
- Deferred: closing hidden tabs' channels (6.4); a live share panel on
  the owner's other device; Presence.
