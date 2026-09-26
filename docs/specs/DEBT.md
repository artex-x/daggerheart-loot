# DEBT.md - defects kept on purpose, owed to a named task

A live defect the app ships on purpose, with the task that owes its fix. Each
entry reads **Where** / **What** / **Why deferred** / **How to verify the
fix**, is written in the batch that decides to defer it, and is deleted by
the batch that pays it. Sections are the tasks that owe the entries; a
section with no entry left is deleted. A kept design is a decision
(`docs/decisions/`), not an entry; a refactor question with no
user-visible defect does not belong here. Why this file is the home:
`docs/DECISIONS.md`, "Kept defects live in `docs/specs/DEBT.md`, grouped by
the task that owes them".

## Account data migration (`persist-5-migration`)

Owns: the move of this browser's lists into the account, the legacy write
cutoff (`LEGACY_WRITE_UNTIL`, 2026-10-26) and the retired `#/l/` page.

### D24 - a second `dhloot.lists.v2` corruption is never backed up, and the first backup is orphaned forever

- **Where**: `app/src/state/lists.svelte.ts`, `ListStore#readCurrent`.
- **What**: the first unreadable `dhloot.lists.v2` value is backed up once,
  under `dhloot.lists.v2.bad` - `get(LISTS_KEY_BAD) === null` guards it, on
  purpose, so this tab's own next successful write does not overwrite the
  one copy of what was actually lost. The guard has a consequence nothing
  else in the code addresses: once that key reads back as valid again (this
  tab's own next `save()`, or another tab's write), `unreadable` clears and
  the storage notice stops warning - but the `.bad` backup stays sitting
  there with no UI that ever reads it, orphaned for good. A **second**
  corruption after that point is not backed up at all (the guard still
  finds `.bad` occupied by the first one) and `save()` writes straight over
  it, while the notice tells the reader their data survived.
- **Why deferred**: the real fix needs a backup keying scheme and a way for
  a person to reach a backup, which today has no UI anywhere. The browser
  list store stops being written at the cutoff, so R5 pays the part a
  reader can lose: the automatic move also moves a readable
  `dhloot.lists.v2.bad` backup into the account, or names it in the move
  notice. R10 (`persist-10-legacy-removal`) removes the browser list store
  and deletes this entry.
- **How to verify the fix**: R5 - seed a readable `dhloot.lists.v2.bad`
  beside `dhloot.lists.v2`, sign in, and confirm that the backup's lists
  reach the account or that the move notice names the backup. R10 - confirm
  that no code reads or writes `dhloot.lists.v2` or its `.bad` key.
- **Copy** (was D31): `app/src/lib/dict.ts` `badStorage` (`ru`, `en`) tells
  the reader their unreadable data is kept "under a separate key", which no
  one can act on outside devtools. Rewrite it once a backup is reachable.

### D54 - a `#/l/` link with more than 100 items saves an empty account list

- **Where**: `app/src/state/app.svelte.ts` `AppState.saveCopyOf`, and
  `CloudLists.create` in `app/src/state/cloudLists.svelte.ts`.
- **What**: «Сохранить» on an old `#/l/` link creates the account list, then
  queues all its entries in one write. The server's `entries_per_list` limit
  (100 by default) refuses that whole write, so the reader gets a list with
  its name and no entries, and the limit toast.
- **Why deferred**: a link of more than 100 items is rare, and the move of
  browser lists into the account meets the same limit with the same data.
  One fix (cut at the limit and say how many were left out, or refuse
  before the list is made) serves both paths.
- **How to verify the fix**: open a `#/l/` link that holds 101 items, press
  «Сохранить» signed in, and confirm that the account list holds the items
  the limit allows, or that no empty list is made, and that the text says
  what happened.

## Slimmer account client (no task filed yet; runs before `persist-3-realtime`)

Owns: an account client built from the Supabase packages the app uses,
which brings the configured bundle back under its old 170 kB limit.

### D60 - the configured build ships 28 kB of account client that nothing calls

- **Where**: `app/src/ports/supabase.ts` (`createClient` from
  `@supabase/supabase-js`); `SUPABASE_ONLY_IN_PORT` in `eslint.config.mjs`
  (its `@supabase/*` pattern already covers the smaller packages); the
  decision "The account client loads after first paint; a provider redirect
  settles before mount", which names supabase-js as the one import.
- **What**: the full client carries realtime-js (16.1 kB gzip), storage-js
  (7.1 kB) and functions-js (1.5 kB), which the app does not call. The
  account chunk is 55.1 kB and the configured build 172.0 kB (measured
  2026-09-26), so every signed-in reader downloads them after first paint.
  The budget is 180 kB until this is paid (decision "The configured bundle
  budget is 180 kB until a slimmer account client").
- **Why deferred**: the fix replaces `createClient` with `AuthClient` from
  `@supabase/auth-js` and `PostgrestClient` from `@supabase/postgrest-js`
  (27.0 kB together against 54.8 kB) and changes who may import what. The
  risk: the session's access token must follow every auth change into the
  postgrest client's headers, or writes run as anon. `npm run e2e` is the
  gate. It is its own release, not a fix to a pushed commit.
- **How to verify the fix**: the configured build and its budget
  (`.claude/README.md`, "The configured bundle budget") report
  below 170 kB, about 160 kB after `persist-3-realtime` adds realtime-js
  back; the limit returns to 170; `npm run e2e` passes F0-F8.

## Live updates (`persist-3-realtime`)

Owns: Realtime on shared pages and the owner's lists, which replaces the
45 s poll as the primary path and reworks the account write queue. The
Realtime release's plan owns D56 and D57 by name; D55, D58 and D59 go with
the same rework.

### D55 - any refused account write, a lapsed session included, is dropped

- **Where**: `app/src/ports/supabase.ts` `writeOf`; `CloudLists#flush` in
  `app/src/state/cloudLists.svelte.ts`.
- **What**: every 4xx answer with an error code, 401 included, maps to
  `refused`. The queue drops a refused write and re-reads the account, so an
  edit made while the session token lapsed is lost, with the refusal toast.
- **Why deferred**: the Supabase client renews the session before it
  expires, so a 401 needs a device that slept past the renewal. The queue
  rework for Realtime decides which answers keep a write for a retry.
- **How to verify the fix**: in `supabase.test.ts`, answer one list write
  with status 401 and confirm that the write stays queued and is sent again
  after the session is renewed.

### D56 - a reorder after another device changed the entries is refused

- **Where**: `reorder_list` in
  `supabase/migrations/20260925130100_lists.sql`; `CloudLists#flush`.
- **What**: `reorder_list` refuses (`22023`) an entry set that does not match
  the list. When a second device added or removed an entry since this one
  last read the list, a drag on this device shows the refusal toast and the
  order snaps back after the re-read. No data is lost.
- **Why deferred**: it needs two devices editing one list inside the 45 s
  poll window. Realtime shortens that window, and its plan decides whether
  the reorder merges instead of refusing.
- **How to verify the fix**: open one account list on two devices, add an
  entry on the first, drag an entry on the second before it re-reads, and
  confirm that the order is kept or merged with no refusal toast.

### D57 - a fetch that never answers holds «Сохраняем...» with no end

- **Where**: `CloudLists#flush` in `app/src/state/cloudLists.svelte.ts`.
- **What**: the queue sends one write at a time and waits for its answer.
  A request that hangs (no answer and no error) keeps the status on
  «Сохраняем...», and every later edit waits behind it until the page is
  reloaded.
- **Why deferred**: the browser ends most dead connections with an error,
  which the queue retries. A timeout belongs to the queue rework that
  Realtime brings.
- **How to verify the fix**: in `cloudLists.test.ts`, make one write return
  a promise that never settles and confirm that the queue gives up after a
  set time, shows «Не сохранено» and retries.

### D58 - «Поделиться» on a list whose create is still queued says the links did not load

- **Where**: `app/src/components/SharePanel.svelte` `load`.
- **What**: a new account list exists on the server only after its queued
  create is sent. «Поделиться» pressed before that reads no shares and calls
  `create_list_share`, which refuses (`42501`, not the owner of the list).
  The panel then says the links did not load. «Повторить» works once the
  create has landed.
- **Why deferred**: the window is the queue's latency, usually well under a
  second, and «Повторить» recovers. The fix is to wait for the list's own
  queued writes before the panel reads, which is part of the queue rework.
- **How to verify the fix**: in `sharePanel.test.ts`, hold the list's create
  in the fake, press «Поделиться», release the create, and confirm that both
  links show with no error.

### D59 - a failed first read of a `#/s/` link is not retried by itself

- **Where**: `app/src/state/sharedView.svelte.ts` `SharedView.refresh`.
- **What**: `refresh()` re-reads only a page in the `ready` or `gone`
  state. When the first read fails (offline), the page shows the error and
  «Повторить», and neither the 45 s poll nor the shown-again signal reads
  it again. The reader must press «Повторить».
- **Why deferred**: this is the planned behaviour of the poll release, and
  the reader has a working button. Realtime replaces the poll and decides
  how a shared page recovers from a failed read.
- **How to verify the fix**: open `#/s/<token>` offline, go back online, and
  confirm that the list shows on the next poll or when the tab is shown
  again, with no press.

## Legacy removal (`persist-10-legacy-removal`)

Owns: the removal of the `#/l/` codec and the browser list store after the
cutoff.

### D61 - a signed-out tab keeps its old language, start section and warning until reload

- **Where**: `dhloot.lang.v1`, `dhloot.home.v1` and `dhloot.warn.v1` in
  `app/src/state/app.svelte.ts`; nothing watches them across tabs.
- **What**: a change in one tab reaches another open tab only when that tab
  reloads. A signed-in tab re-reads the account row when it is shown again;
  a signed-out tab does not.
- **Why deferred**: the consistent-storage ticket owned it and was superseded
  by the persistence programme (2026-09-26); the cost is one reload.
- **How to verify the fix**: signed out, open two tabs, change the language
  in the first, and confirm that the second tab shows it without a reload.
