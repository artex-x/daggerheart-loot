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

## Search (no task filed yet; the owner names the task)

Owns: search defects found at the review of the words-in-any-order search
(task 63, 2026-10-02).

### D88 - search does not fold the left single quotation mark

- **Where**: `foldQuery` in `app/src/lib/search.ts`.
- **What**: the fold reads U+2019 and U+02BC as `'`, but not U+2018 (`‘`).
  A query typed with `‘` in place of an apostrophe (`keeper‘s`) finds
  nothing, while `keeper's` and `keeper’s` find "Keeper's Staff".
- **Why deferred**: found at the closeout review; a keyboard rarely types
  U+2018 inside a word, and the owner did not place it.
- **How to verify the fix**: `search.test.ts` finds q80 for `keeper‘s
  staff`, and the cached and uncached paths agree on it.

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
  reader downloads them after first paint. The budget is 226 kB (decision
  "The bundle budget steps up per batch to 250 kB configured and 190
  unconfigured"; the configured build measured 220.8 kB on 2026-09-30 with
  the homebrew pages), so it does not force this fix.
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

## Harness parity (no task filed yet; the owner names the release)

Owns: the fake's parity with the database's bounds of one write, and the
browser suites' language runs for a signed-in seed user.

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

### D89 - the sweep's English run draws gm1's pages in Russian

- **Where**: `tests/app/sweep.js` (the language set through
  `localStorage`), `app/src/ports/fake-cloud-seed.ts` (gm1's preferences).
- **What**: the sweep sets the language through `localStorage`, but gm1's
  seeded preferences (`lang: 'ru'`) replace it on sign-in. So every
  `as: 'gm1'` entry, the three `#/homebrew` panel entries included, draws
  Russian in the "en" run too, and "clean at 360 (ru, en)" proves only the
  Russian pages for those entries.
- **Why deferred**: found in the review of R7d (2026-10-02); the gap is
  older than that release, and a change to the harness's language setup
  touches every signed-in entry and its goldens.
- **How to verify the fix**: the "en" run of `node tests/app/sweep.js 360`
  draws gm1's pages in English (the run asserts the page's `lang`
  attribute for each signed-in entry), and the Russian run is unchanged.

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

## Persistence review (`persist-review`)

Owns: the consistency pass over the persistence surfaces after R7f, against
`docs/specs/FEATURES.md`, "Chrome", "Consistency rules", and the decision
"The signed-in pages follow one set of consistency rules". Each entry below
is a named departure from a rule, a defect found in R7f's reviews, or a
scale finding the owner sent to this task's scale re-run.

### D74 - the list notes' two boxes take their name from the placeholder

- **Where**: `app/src/components/ListPage.svelte`, the `notePair` snippet
  (`.nlbl` and the two `<textarea>`s, list and row notes).
- **What**: the visible label («Для игроков» / «Только для мастера» and its
  consequence line) is a `span`, not tied to the box, so a screen reader
  names each box by its placeholder. Rule 15 (a) says a placeholder is never
  the label; rule 15 names this departure.
- **Why deferred**: the fix needs a per-key id on an inner text span
  (`.nlbl` also holds the clear button) and moves every list-page golden
  (four shards of compare and re-seed); the visible label already serves
  sighted readers.
- **How to verify the fix**: `listPage.test.ts` finds each note box with
  `getByRole('textbox', { name: /Для игроков/ })` and the hidden one by its
  own label; the re-seeded list goldens name the boxes by their labels.

### D75 - each «?» has a description equal to its name

- **Where**: `app/src/components/HelpButton.svelte` (`title` and
  `aria-label` hold the same text).
- **What**: Chrome exposes the `title` as a description, so a screen reader
  can read «Подсказка: Источник» twice; the homebrew editor has nine such
  buttons, and the page-level «?» does the same (golden lines read
  `button "Подсказка: Источник" [description=Подсказка: Источник ...]`).
- **Why deferred**: found in the review of the editor's field help
  (2026-10-02); the fix moves every golden that draws a help button.
- **How to verify the fix**: the goldens show each «?» with no
  `description`; `a11y.test.ts` still passes on the help states.

### D77 - a refusal line keeps the language it was written in

- **Where**: the `refused` strings of `app/src/components/HomebrewEditor.svelte`,
  `CardForm.svelte` and `QuickItem.svelte`.
- **What**: each refusal is stored as a finished string, so after a
  language switch the line stays in the old language (the golden
  `#/homebrew/hb_emberaxeaaaaaaaa ~ not saved as gm1` shows the Russian line
  in its English tree). Rule 14 asks for both languages.
- **Why deferred**: found in R7f's first review (2026-10-02); the fix keeps
  a `Msg` (`lib/dict.ts`) instead of a string in three components.
- **How to verify the fix**: a refused save, then «EN»: the line reads in
  English (`homebrewEditor.test.ts`, `quickItem.test.ts`); the golden's
  English tree shows the English line.

### D78 - the bulk delete's progress line announces every step

- **Where**: `app/src/components/HomebrewPage.svelte`, the `p.note
  role="status"` line «Удаляем предметы: N из M».
- **What**: the line changes after each delete, so at 300 items a screen
  reader queues up to 300 polite announcements.
- **Why deferred**: found in R7f's first review (2026-10-02); the progress
  is correct on screen.
- **How to verify the fix**: the status region announces the start and the
  end only (a visible counter outside the live region, or a live text set
  twice); `homebrewPage.test.ts` checks the region's text at both ends.

### D79 - the list row's «Золото» «?» works on hover only

- **Where**: `app/src/components/ListPage.svelte`, the `.goldhint` glyph in
  a row's «Золото» label.
- **What**: the glyph shows the coin conversion in a `title` only: it is no
  button, answers no touch and no keyboard. Rule 15 (a) and (c) name it a
  departure.
- **Why deferred**: a rename of the field to «Цена» and a real «?» move
  every list golden.
- **How to verify the fix**: the conversion opens from a «?» button with
  `aria-expanded` on touch and keyboard; `listPage.test.ts` and the list
  goldens show it.

### D80 - strings outside the consistency rules

- **Where**: `app/src/lib/dict.ts` (the clipboard failure strings, the
  `docTitle` separator, `uniqueHint`, `printSub`, `printSubCompact`);
  `app/src/lib/help.ts` (45 em dashes; the «Хоумбрю» sentence of the tables
  help uses ` - ` among them); the `app.say` calls of `RequestsPanel`,
  `AddToList` and the `state/` stores.
- **What**: these strings predate rules 2, 5 and 14 (one failure wording,
  one toast shape, ASCII punctuation) and were not reviewed against them.
- **Why deferred**: each changes goldens across many pages; the owner sent
  them to one pass after R7f (2026-10-01).
- **How to verify the fix**: `git grep -n "—" -- app/src/lib/help.ts
  app/src/lib/dict.ts` finds nothing; each toast and failure string follows
  rules 2 and 5.

### D86 - the owner's pending requests are read whole after each new request

- **Where**: `requests.list` in `app/src/ports/supabase.ts`;
  `app/src/state/ownerRequests.svelte.ts` (the owner-topic `request`
  message and the 300 s safety read).
- **What**: every new request (an owner-topic `request` message) and every
  safety read downloads all pending requests with their lines again: up to
  about 4 MB at the defaults (500 requests of up to 100 lines, estimate)
  and up to 4500 requests of 300 lines at three times them. A link holder
  can send 5 requests a minute per link.
- **Why deferred**: found while R7g was planned (2026-10-01); the owner
  placed it with this section's scale re-run, not in R7g.
- **How to verify the fix**: after one new request, the read fetches that
  request alone (or the rows changed since the last read);
  `supabase.test.ts` counts the rows of the second read.

### D87 - an older account read can overwrite newer list rows

- **Where**: `CloudLists.#pull` in `app/src/lib/cloudLists.ts`.
- **What**: two account reads can overlap (a poll, a Realtime message, an
  other-tab edit). When the older one answers last, its changed rows
  replace the newer objects the store already holds, until the next read
  brings them back. The defect is older than the revision-keyed re-read;
  that change did not add it.
- **Why deferred**: found in the review of the revision-keyed re-read
  (2026-10-02), outside that release's scope.
- **How to verify the fix**: skip a changed row whose `revision` is below
  the one the store holds; a `cloudLists.test.ts` case answers two reads
  out of order and expects the newer row to stay.

## Debt cleanup (`debt-cleanup`)

Owns: scale findings at up to three times the default limits that no
release took (the scale review of 2026-10-01; the owner placed the rest in
R7d, R7e, R7f and R7g).

### D81 - the homebrew read downloads every row each time

- **Where**: `homebrew.load` in `app/src/ports/supabase.ts`;
  `app/src/state/homebrew.svelte.ts` (`load`); the poll and the `homebrew`
  message in `app/src/state/app.svelte.ts`.
- **What**: three whole-table reads (items, sources, cards) run on every
  45 s poll while the topic is down and after every remote homebrew
  message. At the defaults, maximal content is about 2.5 MB of items, 1.3 MB
  of cards and 0.4 MB of sources (estimate); typical use is under 100 KB.
- **Why deferred**: typical accounts are small; the owner did not place it.
- **How to verify the fix**: the read asks for `id,revision,updated_at`
  first and fetches only changed rows; `supabase.test.ts` counts the
  requests of an unchanged second read.

### D82 - a print card clips a long text with no notice

- **Where**: `app/src/components/PrintCard.svelte` (the text size ladder,
  then `overflow: hidden` on the text box).
- **What**: an item description may hold 3000 code points; past the last
  step of the ladder the text is cut on the printed card and nothing says
  so. Not measured in a browser.
- **Why deferred**: the owner did not place it; the catalog's longest text
  (1299 code points) fits.
- **How to verify the fix**: a 3000-character own item on `#/print/<key>`
  draws one warning line above the sheet (`printPage.test.ts`, and a
  `tests/app/print.js` measurement).

### D83 - a statement timeout makes the write buffer wait about a minute

- **Where**: the `57014` mapping in `app/src/ports/supabase.ts` (a fault);
  the retry in `app/src/state/cloudLists.svelte.ts`;
  `supabase/migrations/20260925120000_delete_account.sql`.
- **What**: an `apply_list_writes()` batch of big list deletes can pass the
  8 s timeout; `57014` counts as a fault, so the buffer waits 15 s three
  times before it halves the batch and shows «Не сохранено» meanwhile. The
  account delete cascades in one statement and is unmeasured for an
  override account (up to millions of rows).
- **Why deferred**: unverified; the default limits keep a batch small.
- **How to verify the fix**: one measured run on the test project; then
  `57014` halves at once (`cloudLists.test.ts`), and a chunked account
  delete passes `tests/db/delete-account.test.mjs` at a large seed.

### D84 - small costs at three times the limits

- **Where** and **What**, one line each (estimates, none measured):
  - `matchLists` (`app/src/lib/lists.ts`) folds every list name per
    keystroke (1000 x 200 characters, 30-80 ms); memoise as `hayFor` does.
  - `waiting()` in `ListsPage.svelte` calls `pendingFor`
    (`lib/requests.ts`) per card (1000 x 1000 parses); a `Map` by list id.
  - `AddToList.svelte` calls `l.ids.includes` twice per chip per render of
    the open menu; use the set built at open.
  - `listsHolding` (`state/app.svelte.ts`) is lists x entries x keys per
    lists change.
  - The `homebrew` table's «Раздел» filter row draws one chip per used
    section (up to 100) with no fold or search (`lib/facets.ts`,
    `FilterBar.svelte`).
  - `shares.list` returns revoked rows, which stay for ever.
  - The editor stringifies the draft and rebuilds the preview index per
    keystroke; `findItems` maps every match before the picker keeps 8.
  - One toast slot: an error can be replaced by the next success, a 7 s
    undo by any later toast.
  - `exportData` builds one string in memory (5 MiB at the import ceiling);
    the homebrew export must stay a few files (the zip reader takes 1000).
- **Why deferred**: each is a nit at the default limits; the owner did not
  place them.
- **How to verify the fix**: per line, a unit test or a timing at three
  times the limits; delete the line when it is paid, and the entry with its
  last line.

### D85 - the shared page downloads the whole list after each owner edit

- **Where**: `app/src/state/sharedView.svelte.ts` (`#message`, then
  `refresh()`); `get_shared_list` in the migrations.
- **What**: after each owner commit every open shared page downloads the
  whole projection again: about 0.1-1 MB for a real list of up to 300
  entries, up to 300 linked items of up to 81 KB each at three times the
  limits (estimates). An owner who types with pauses
  commits every 2 s.
- **Why deferred**: `p_since` removes the unchanged re-reads only. A
  smaller changed read needs per-entry change tracking, or sending only the
  snapshots the page lacks (by the item's `hid` and revision): a
  projection contract change the owner did not place.
- **How to verify the fix**: with a shared page open, edit one note; the
  re-read carries no snapshot of an unchanged item the page already holds.

### D90 - `npm run check:db` waits silently on a stack that cannot start

- **Where**: `tests/db/run.mjs` (the `supabase db reset --local` step).
- **What**: after a host restart on 2026-10-02, Rancher Desktop came up
  without seven Supabase images (PostgREST, Studio, postgres-meta and
  others). `db reset` restarted the database and then waited about 20
  minutes for containers that never started, with no output and the CPU
  idle; only a manual `npx supabase stop` and `start` (which pulled the
  images) recovered it.
- **Why deferred**: found while gating R7d; a change to tooling every
  later session runs under needs its own plan and review (owner,
  2026-10-02: paid in the `debt-cleanup` release).
- **How to verify the fix**: a preflight checks that every container the
  stack needs is running before the reset and fails within seconds naming
  the missing one and the `npx supabase stop` / `start` remedy; a timeout
  of about 5 minutes stops a hung reset with the same advice; both lines
  join the "FAIL" table in `.claude/README.md`; a test of
  `tests/db/run.mjs`'s helpers covers both failures.

## Item links (`persist-9-item-share`)

Owns: print routes for cloud lists and for another account's item (`#/h/`
ships in R7h), the drop of `list_entries.snapshot`, and a linked entry
whose key the reader also holds.

### D70 - a homebrew entry of another account's list does not print from its address

- **Where**: `app/src/state/app.svelte.ts` (`knows`, `recordFor`,
  `linkedRecord`); `app/src/components/PrintPage.svelte`.
- **What**: a reader who ticks such an entry on `#/s/<token>` and presses
  «Печать», or opens its `#/print/` address later, gets no card for it.
- **Why deferred**: the address holds only keys, and the share page closes
  the list's projection when it is left; R9 owns print routes for cloud
  lists.
- **How to verify the fix**: on `#/s/player-token-1` signed out, tick the
  axe and press «Печать»; the sheet holds its card, after a reload too.

### D93 - `list_entries.snapshot` stays as a column that is always null

- **Where**: `supabase/migrations/20261007130000_homebrew_links.sql`
  (`list_entries_snapshot_null`).
- **What**: R7h links every homebrew entry by `hb_item` and keeps the
  `snapshot` column with `check (snapshot is null)`. Nothing reads a value
  from it; each read and write of an entry carries the empty column.
- **Why deferred**: the frontend before R7h's links selects the column,
  so a frontend-only revert of R7h keeps reading the lists (owner,
  2026-10-07). The next release's first migration drops it.
- **How to verify the fix**: the first migration of R9 drops the column and
  its check; `git grep -n snapshot -- app/src/ports/supabase.ts` finds no
  select of it, and `npm run check:db` passes.

### D94 - a linked entry draws the reader's own item of the same key

- **Where**: `app/src/state/app.svelte.ts` (`recordFor`, which asks the
  catalogue and own-item index before `linkedRecord`).
- **What**: keys are unique per owner only. A reader who imported the
  author's homebrew file holds own items with the author's keys. A row of
  a list that links the author's item by its id then draws the reader's
  own record, while the entry keeps the link to the author's item, and
  «Сохранить себе» is not offered there.
- **Why deferred**: found in the R7h plan (2026-10-07); it needs a file
  import of another author's items first, and R9 owns the item links and
  «Сохранить себе».
- **How to verify the fix**: as gm2, import gm1's homebrew file, then open
  a list that links gm1's axe; the row draws gm1's item, and a test of
  `recordFor` covers a linked entry whose key the reader also holds.

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
