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

## Slimmer account client (no task filed yet)

Owns: an account client built from the Supabase packages the app uses,
which brings the configured bundle back under its old 170 kB limit.

### D60 - the configured build ships about 9 kB of account client that nothing calls

- **Where**: `app/src/ports/supabase.ts` (`createClient` from
  `@supabase/supabase-js`); `SUPABASE_ONLY_IN_PORT` in `eslint.config.mjs`
  (its `@supabase/*` pattern already covers the smaller packages); the
  decision "The account client loads after first paint; a provider redirect
  settles before mount", which names supabase-js as the one import.
- **What**: the full client carries storage-js (7.1 kB gzip) and
  functions-js (1.5 kB), which the app does not call; realtime-js is called
  since the Realtime release and stays. The account chunk is 55.7 kB and
  the configured build 184.5 kB (measured 2026-09-27), so every signed-in
  reader downloads them after first paint. The budget is 210 kB (decision
  "The configured bundle budget is 210 kB; the unconfigured stays 150 kB";
  the configured build measured 203.0 kB on 2026-09-30), so it does not
  force this fix.
- **Why deferred**: the fix replaces `createClient` with `AuthClient` from
  `@supabase/auth-js`, `PostgrestClient` from `@supabase/postgrest-js` and
  `RealtimeClient` from `@supabase/realtime-js`, and changes who may import
  what. The risk: the session's access token must follow every auth change
  into the postgrest client's headers and into the Realtime client, or
  writes run as anon and an owner topic's join is refused. `npm run e2e` is
  the gate. It is its own release, not a fix to a pushed commit.
- **How to verify the fix**: the configured build and its budget
  (`.claude/README.md`, "The configured bundle budget") report about 9 kB
  less than before the fix; `npm run e2e` passes F0-F11 and contract case J.

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

### D66 - focus falls to `body` after «Удалить (N)» deletes the ticked lists

- **Where**: `app/src/components/ListsPage.svelte` (the batch strip's
  «Удалить (N)» over the account cards; the strip leaves with the ticks).
- **What**: the confirmed delete removes the pressed button and nothing
  moves focus, so it falls to `body`; no mock or rule names a target. The
  same defect as D64, on the lists index.
- **Why deferred**: found in R6's closeout; the focus target is one
  decision for every control that removes itself, so it belongs to the
  task that owns D64.
- **How to verify the fix**: tick two account lists, delete them with the
  keyboard, and confirm that `document.activeElement` is a named control
  (for example the «Новый список» field), not `body`. Cover it in
  `listsPage.test.ts`.

## Limit texts and harness parity (no task filed yet; the owner names the release)

Owns: what a reader is told at a count limit that is not theirs, and the
fake's parity with the database's bounds of one write.

### D67 - a requester at `request_lines` is told to write to the site's owner

- **Where**: `app/src/lib/dict.ts` `limitOther` (RU, EN), shown for the
  refusal `limit: request_lines` of `create_purchase_request()`.
- **What**: a player whose request has more lines than the list owner's
  limit reads «Достигнут предел: %n. Нужно больше - напишите на
  daggerheart.loot@gmail.com.». The override of `request_lines` is the list
  owner's, set by the site's owner, so the requester's email asks for a
  limit on an account that is not theirs.
- **Why deferred**: found in the limits audit (2026-09-30), which changed
  no request text; a requester's own text is a small separate fix.
- **How to verify the fix**: over the fake, send a request past the lines
  limit through a share link as another reader and confirm the toast names
  the list's limit without the email line. Cover it in `state/app.test.ts`.

### D68 - the fake takes more than 5000 entries in one `create` or `add`

- **Where**: `app/src/ports/fake-cloud.ts`, `lists.apply` (`create`, `add`).
- **What**: `apply_list_writes()` refuses an op of more than 5000 entries
  with `22023`; the fake applies it. A test over the fake can pass with a
  write the database refuses (the export tests build lists of 5001 entries
  this way, as a shortcut).
- **Why deferred**: found in the limits audit (2026-09-30); no client path
  sends more than 5000 entries in one op, and no test depends on the gap.
- **How to verify the fix**: `fake-cloud.test.ts` expects a `create` of
  5001 entries answered as the database answers it, and the export tests in
  `state/app.test.ts` build their long lists another way.

## A live revoke on the shared page (no task filed yet; the owner names the release)

Owns: what a screen reader hears when an open shared page stops drawing its
list. No release plan owns it; the owner decides which one takes it.

### D65 - a live revoke swaps the shared page with no announcement

- **Where**: `app/src/components/SharedListPage.svelte` (the status region
  `.said` is inside the drawn-list branch); `SharedView.refresh()` in
  `app/src/state/sharedView.svelte.ts` (status `gone`).
- **What**: when the owner deletes the link or the list while `#/s/<token>`
  is open, the page swaps to «Список больше не доступен» within about a
  second. The status region leaves with the list, so a screen reader
  announces nothing, and the reader learns of the change only by moving
  through the page.
- **Why deferred**: found in the Realtime release's review (2026-09-27).
  That release scoped the region to a change of what a drawn list shows;
  a region that outlives the list, or moved focus, is a new design for the
  gone page, not a fix to the region.
- **How to verify the fix**: open `#/s/player-token-1` over the fake, call
  `shares.revoke` for its share, and confirm that a polite status region
  (or the focused heading) reads «Список больше не доступен» once. Cover it
  in `sharedListPage.test.ts`.

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
