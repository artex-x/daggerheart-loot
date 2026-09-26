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
  account chunk is 55.4 kB and the configured build 178.2 kB (measured
  2026-09-26), so every signed-in reader downloads them after first paint.
  The budget is 200 kB (decision "The bundle budget is 150 kB unconfigured
  and 200 kB configured"), so it no longer forces this fix.
- **Why deferred**: the fix replaces `createClient` with `AuthClient` from
  `@supabase/auth-js` and `PostgrestClient` from `@supabase/postgrest-js`
  (27.0 kB together against 54.8 kB) and changes who may import what. The
  risk: the session's access token must follow every auth change into the
  postgrest client's headers, or writes run as anon. `npm run e2e` is the
  gate. It is its own release, not a fix to a pushed commit.
- **How to verify the fix**: the configured build and its budget
  (`.claude/README.md`, "The configured bundle budget") report
  about 27 kB less than before the fix; `npm run e2e` passes F0-F10.

## Focus after a control that removes itself (no task filed yet; the owner names the release)

Owns: where keyboard focus goes when a press removes the pressed control.
No release plan owns it; the owner decides which one takes it.

### D64 - focus falls to `body` when a pressed control disappears

- **Where**: `app/src/components/AccountMenu.svelte` («Выйти»: the menu
  closes and the signed-in control becomes the «Войти» link);
  `app/src/components/MoveNotice.svelte` («Скрыть напоминание» on the move
  banner, «Скрыть» on the moved-lists notice).
- **What**: each press removes the element that has focus, and nothing
  moves focus elsewhere, so focus falls to `body`. A keyboard reader's next
  Tab starts again from the top of the page, and a screen reader announces
  nothing about where focus went.
- **Why deferred**: found in the account menu's review (2026-09-27), after
  the gates of that release were green. The moved-lists «Скрыть» behaved
  the same before that release, so it is one focus-management task, not a
  fix to one control. R10 removes `MoveNotice` with both of its buttons;
  the menu's «Выйти» stays.
- **How to verify the fix**: signed in, open the account menu with the
  keyboard, press «Выйти», and confirm that `document.activeElement` is a
  named control (for example the «Войти» link), not `body`; the same for
  «Скрыть напоминание» while `MoveNotice` exists. Cover it in
  `accountMenu.test.ts`.

## Live updates (`persist-3-realtime`)

Owns: Realtime on shared pages and the owner's lists, which replaces the
45 s poll as the primary path and reworks the account write buffer. The
Realtime release's plan owns D56 and D57 by name; D59 goes with the same
rework.

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

- **Where**: `CloudLists#send` in `app/src/state/cloudLists.svelte.ts`.
- **What**: the write buffer sends one request at a time and waits for its
  answer. A request that hangs (no answer and no error) keeps the status on
  «Сохраняем...», and every later edit waits behind it until the page is
  reloaded. «Поделиться», «Сохранить себе» on a shared page and the move of
  browser lists into the account wait behind it too, and never open or
  start; a sign-out waits for it 5 s at most.
- **Why deferred**: the browser ends most dead connections with an error,
  which the buffer retries. A timeout belongs to the buffer rework that
  Realtime brings.
- **How to verify the fix**: in `cloudLists.test.ts`, make one `apply` call
  return a promise that never settles and confirm that the buffer gives up
  after a set time, shows «Не сохранено» and retries.

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

Owns: the removal, after the cutoff, of the `#/l/` codec, the browser list
store and all move support (`LegacyMove`, `MoveNotice`, `MoveStatus`,
`StorageNotice`, the move's RPC path), and a planned decision on whether a
migration drops `move_legacy_list` and `lists.legacy_fingerprint`
(`docs/DECISIONS.md`, "R10 removes browser lists and the move; an old
`#/l/` link is not found").

### D62 - `move_legacy_list` adds lists and entries past every count limit, with no bound

- **Where**: `move_legacy_list` and the `dhloot.move` guard in `lists_limit`
  and `list_entries_limit`,
  `supabase/migrations/20260925130400_legacy_move.sql`.
- **What**: a move skips the count limits, so every browser list reaches
  the account whole. The skip has no bound of its own: a scripted
  signed-in caller can add lists and entries past every limit through
  `move_legacy_list`, up to 5000 entries per call, with no bound on the
  number of calls.
- **Why deferred**: owner decision, 2026-09-26. A genuine browser list is
  bounded by the catalog (about 1300 records, each id at most once), and
  the rows count against their owner only. From R10 the app never calls
  the move again (owner, 2026-09-27), so only a scripted caller reaches it.
- **How to verify the fix**: R10 - either a migration drops
  `move_legacy_list` (and the `dhloot.move` guard in both limit triggers),
  and `tests/db/` confirms that a signed-in call is refused as an unknown
  function and that a list or entry past a limit is refused; or, if R10's
  plan keeps the function, confirm that `authenticated` has no EXECUTE on
  it. Close this entry in the batch that does either.

### D63 - the move's status says «нет связи» for a failure that is not the network

- **Where**: `app/src/components/MoveStatus.svelte` (the `failed` branch),
  `moveFailed` in `app/src/lib/dict.ts`, `LegacyMove#run` in
  `app/src/state/legacyMove.svelte.ts`.
- **What**: every run that ends `failed` draws «Не все списки перенесены:
  нет связи. Попробуем при следующем открытии.», also when the cause is a
  user switch during the run, a row missing from the read-back, or a
  refused storage write in `settleMove` (a full quota). With a full quota
  each retry calls `move_legacy_list` for every list again, answers
  `inserted: false` and removes nothing. No data is lost: the browser
  lists stay, and the account holds each moved list once.
- **Why deferred**: found in the last review of the move, after its texts
  were settled; every cause but the quota ends at the next run, and the
  quota case needs its own text and a way out for the reader. R10 removes
  `LegacyMove` and `MoveStatus` (owner, 2026-09-27), so the text goes with
  them.
- **How to verify the fix**: R10 - confirm that no file under `app/src/`
  holds `MoveStatus`, `LegacyMove` or `moveFailed`, and close this entry
  in that batch.

### D24 - a second `dhloot.lists.v2` corruption is never backed up, and the first backup is orphaned forever

- **Where**: `app/src/state/lists.svelte.ts`, `ListStore#readCurrent`.
- **What**: the first unreadable `dhloot.lists.v2` value is backed up once,
  under `dhloot.lists.v2.bad` - `get(LISTS_KEY_BAD) === null` guards it, on
  purpose, so this tab's own next successful write does not overwrite the
  one copy of what was actually lost. The guard has a consequence nothing
  else in the code addresses: once that key reads back as valid again (this
  tab's own next `save()`, or another tab's write), `unreadable` clears and
  the storage notice stops warning - but the `.bad` backup stays sitting
  there, orphaned for good. A **second** corruption after that point is not
  backed up at all (the guard still finds `.bad` occupied by the first one)
  and `save()` writes straight over it, while the notice tells the reader
  their data survived.
- **Why deferred**: the real fix needs a backup keying scheme and a way for
  a person to reach a backup. R5 (`persist-5-migration`) paid the part a
  reader can lose: the move's one-time notice names a `.bad` backup and the
  contact address, and the browser list store is written only by the move
  and by a delete after the cutoff. The backup cannot be moved: its only
  writer stores a value that failed `JSON.parse`. R10 removes the browser
  list store and deletes this entry.
- **How to verify the fix**: R10 - confirm that no code reads or writes
  `dhloot.lists.v2` or its `.bad` key.
- **Copy** (was D31): `app/src/lib/dict.ts` `badStorage` (`ru`, `en`) tells
  the reader their unreadable data is kept "under a separate key", which no
  one can act on outside devtools. Rewrite it once a backup is reachable.

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
