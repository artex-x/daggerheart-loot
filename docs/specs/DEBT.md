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

Owns: the fake's parity with the database's bounds of one write.

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

## Persistence review (`persist-review`)

Owns: the consistency pass over the persistence surfaces after R7f, against
`docs/specs/FEATURES.md`, "Chrome", "Consistency rules", and the decision
"The signed-in pages follow one set of consistency rules". Each entry below
is a named departure from a rule, or a defect found in R7f's reviews.

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

### D76 - a failed limit read clears a known limit until the next read

- **Where**: `app/src/state/cloudLists.svelte.ts` and
  `app/src/state/homebrew.svelte.ts` (`load` copies the limits);
  `limitOf` in `app/src/ports/supabase.ts`.
- **What**: a transient failure of `my_limit()` answers `null`, which the
  stores copy over a number an earlier read returned, so «3 списка из 50»
  reads «3 списка» until the next read (45 s poll). `null` also means "no
  limit" (a null override), so the store cannot tell the two apart.
- **Why deferred**: a visible flicker only, no data risk; the fix is a port
  answer that separates "failed" from "no limit", which R7g's account-read
  work (`persist-7g-read-scale`) may take.
- **How to verify the fix**: `cloudLists.test.ts` loads with a limit, then
  fails the limit read once, and the count keeps «из 50».

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
  - `HomebrewCards.svelte` lists up to 100 cards per fold with no search.
  - `shares.list` returns revoked rows, which stay for ever.
  - An `add` or `create` op with a frozen copy over 60 kB goes alone and
    without `keepalive` (`lib/cloudLists.ts`), so a tab closed inside the
    2 s window loses it.
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

## Homebrew files (`persist-7d-homebrew-files`)

Owns: the homebrew file formats, their import, and the account's data zip.

### D69 - the data zip and the privacy merge steps leave out homebrew

- **Where**: `app/src/state/app.svelte.ts` (`exportData`, `#bundle`);
  `app/src/lib/dict.ts` (`yourDataHint`); `pages/src/privacy.html` and
  `pages/src/en/privacy.html` (the paragraph "Если Google или Discord уже
  занят" and its English twin).
- **What**: «Скачать мои данные (ZIP)» carries no homebrew item or source
  and, from the lists release of R7 on, no homebrew list entry, while the
  hint says the archive holds everything in the account. The privacy
  pages' merge steps (export, delete the account, load the file into the
  other one) therefore lose the homebrew for good.
- **Why deferred**: the owner released R7 first (2026-09-30, "release
  fast"); the homebrew file formats and their import are R7d's.
- **How to verify the fix**: the zip of an account with a source, an item
  and a list holding a reference and a frozen copy loads back into a new
  account with all of them.

### D72 - a source or section rename writes only the language on screen

- **Where**: the source and section rename in `app/src/state/homebrew.svelte.ts` and
  `app/src/components/HomebrewSources.svelte`; items avoid it with `editLang`.
- **What**: a source named only in English and renamed in the Russian
  interface keeps its old English name, so the English interface shows the
  old name.
- **Why deferred**: R7 draws one language per source name; the second
  language is filled only by a file import (R7d).
- **How to verify the fix**: rename an English-only source in the Russian
  interface; the English interface shows the new name too, or the rename
  asks which language it changes.

### D73 - the database and the library differ on a name of only U+00A0

- **Where**: the name checks in `supabase/migrations/20260930130000_homebrew.sql`
  (SQL `\S`) and `app/src/lib/homebrew.ts` (`/\S/u`).
- **What**: a name of only U+00A0, U+2007, U+202F or U+FEFF passes the
  database and fails the library. Only a direct API write reaches the gap.
- **Why deferred**: the client is the stricter side; a migration after the
  test push needs its own review, and a file import (R7d) makes the gap
  reachable.
- **How to verify the fix**: one explicit space class on both sides and one
  fixture case that holds such a name.

## Item links (`persist-9-item-share`)

Owns: `#/h/<token>`, the add and the clone from it, and print routes for
cloud lists.

### D70 - a homebrew entry of another account's list does not print from its address

- **Where**: `app/src/state/app.svelte.ts` (`knows`, `recordFor`,
  `frozenCopy`); `app/src/components/PrintPage.svelte`.
- **What**: a reader who ticks such an entry on `#/s/<token>` and presses
  «Печать», or opens its `#/print/` address later, gets no card for it.
- **Why deferred**: the address holds only keys, and the share page closes
  the list's projection when it is left; R9 owns print routes for cloud
  lists.
- **How to verify the fix**: on `#/s/player-token-1` signed out, tick the
  axe and press «Печать»; the sheet holds its card, after a reload too.

### D71 - the privacy pages say a share link to a homebrew item works

- **Where**: `pages/src/privacy.html` and `pages/src/en/privacy.html`.
- **What**: both pages say a share link to a homebrew item works as a
  list's. Item links ship only in R9, so the text promises a link that does
  not exist.
- **Why deferred**: the text describes the R9 behaviour; R9 corrects it.
- **How to verify the fix**: the pages name the item link only after
  `#/h/<token>` ships, and match `FEATURES.md`.

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
