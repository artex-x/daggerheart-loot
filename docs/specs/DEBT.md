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

### D60 - the configured build ships about 1.5 kB of account client that nothing calls

- **Where**: `app/src/ports/supabase.ts` (`createClient` from
  `@supabase/supabase-js`); `SUPABASE_ONLY_IN_PORT` in `eslint.config.mjs`
  (its `@supabase/*` pattern already covers the smaller packages); the
  decision "The account client loads after first paint; a provider redirect
  settles before mount", which names supabase-js as the one import.
- **What**: the full client carries functions-js (1.5 kB gzip), which the
  app does not call; realtime-js is called since the Realtime release and
  storage-js since the pictures of own items (R8), and both stay. The account
  chunk is 58.1 kB and the configured build 290.9 kB (measured 2026-10-14),
  so every signed-in reader downloads it after first paint. The budget is
  294 kB under the 350 kB ceiling (decision "The configured bundle ceiling
  rises to 350 kB"), so it does not force this fix.
- **Why deferred**: the fix replaces `createClient` with `AuthClient` from
  `@supabase/auth-js`, `PostgrestClient` from `@supabase/postgrest-js`,
  `RealtimeClient` from `@supabase/realtime-js` and `StorageClient` from
  `@supabase/storage-js`, and changes who may import
  what. The risk: the session's access token must follow every auth change
  into the postgrest client's headers, the Realtime client and the Storage
  client, or writes run as anon, an owner topic's join is refused and an
  upload is refused. `npm run e2e` is
  the gate. It is its own release, not a fix to a pushed commit.
- **How to verify the fix**: the configured build and its budget
  (`.claude/README.md`, "The configured bundle budget") report about 1.5 kB
  less than before the fix; `npm run e2e` passes every flow (F20 uploads a
  picture) and contract cases J and Q.

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

### D95 - focus falls to `body` when a dropped filter pick removes its row

- **Where**: `app/src/components/TablesPage.svelte` and
  `app/src/components/FilterBar.svelte` (the offer rule: a row that cannot
  narrow is not drawn; `FEATURES.md`, "Tables and search").
- **What**: a pressed pill or «Сбросить всё» that drops the last pick of a
  row, or of the whole strip, removes the pressed control with its row or
  strip, and nothing moves focus, so it falls to `body`. The pill press and
  «Сбросить всё» did so before the offer rule too.
- **Why deferred**: found in the review of the offer rule on every page
  (task `homebrew-followups`, 2026-10-08); the target is the same decision
  as D64 and D66.
- **How to verify the fix**: on `#/tables/weapons` pick one value with the
  keyboard, press its pill so that the row goes, and confirm that
  `document.activeElement` is a named element (for example the table
  heading or `#main`), not `body`; the same for «Сбросить всё». Cover it
  in `tables.test.ts`.

## Harness parity (no task filed yet; the owner names the release)

Owns: the fake's parity with the database's bounds of one write, and the
browser suites' language runs for a signed-in seed user.

### D99 - the browser suites name a titled control by its title, not its text

- **Where**: `tests/app/driver.js` (`NAME_FN`, read by `click`, `press`, `tick`
  and `controls`).
- **What**: `NAME_FN` takes `title` before the text, though its comment says it
  names a control the way a screen reader would say it; the accessible name of
  a titled button is its text (the goldens draw `button "Печать"`). A suite
  must press «Печать» by its hint, «Собрать карточки для печати: девять на
  лист A4».
- **Why deferred**: a fix changes how every suite finds its controls, a change
  of its own, not the print batch's.
- **How to verify the fix**: `d.click('Печать')` presses the print control on
  `#/i/ci1`, and every browser suite still passes.

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

## Persistence review (`persist-review`)

Owns: the consistency pass over the persistence surfaces after R7f, against
`docs/specs/FEATURES.md`, "Chrome", "Consistency rules", and the decision
"The signed-in pages follow one set of consistency rules". Each entry below
is a named departure from a rule, a defect found in R7f's reviews, or a
scale finding the owner sent to this task's scale re-run.

### D100 - a print press stores the reader's own item of a clashing key

- **Where**: `app/src/state/app.svelte.ts` (`printEntriesOf` resolves ids with
  `recordFor`).
- **What**: `recordFor` finds the reader's own item before another account's
  item of the same key, so «Печать» on `#/h/<uuid>` or on `#/s/<token>` stores
  the reader's own item when the reader holds that key. Only a clash made
  before derived keys can occur
  (`docs/decisions/2026-10-10-a-key-the-account-does-not-hold-becomes-a-derived-key.md`).
  The `#/p/` page itself draws the set's records, never an own record.
- **Why deferred**: rare after derived keys, and the fix (resolve a press by
  the item's `hid` where the page holds it) touches every print control.
- **How to verify the fix**: signed in with an own item of a key that another
  account's item also has, «Печать» on that item's `#/h/<uuid>`, and on a
  `#/s/` link that holds it, opens a set of the other account's item.

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

## Authoring print preview (`authoring-print-preview`)

Owns: a print view in the item editor (owner, 2026-10-14; it ships after
`rich-descriptions` and before `debt-cleanup`).

### D82 - a print card clips a long text with no notice

- **Where**: `app/src/components/PrintCard.svelte` (the text size ladder,
  then `overflow: hidden` on the text box).
- **What**: an item description may hold 3000 code points; past the last
  step of the ladder the text is cut on the printed card and nothing says
  so. Not measured in a browser.
- **Why deferred**: the owner did not place it; the catalog's longest text
  (1299 code points) fits.
- **How to verify the fix**: a 3000-character own item on `#/p/<id>`
  draws one warning line above the sheet (`printPage.test.ts`, and a
  `tests/app/print.js` measurement). The warning also counts a clipped
  table: a 4x20 table in a long text (the `app/print` case of 2026-10-15)
  draws the line when its last rows are cut.

## Debt cleanup (`debt-cleanup`)

Owns: scale findings at up to three times the default limits that no
release took (the scale review of 2026-10-01; the owner placed the rest in
R7d, R7e, R7f and R7g).

### D101 - a row's name joins two marked words that only a space parts

- **Where**: `app/src/components/RowMain.svelte` and `MarkupInline.svelte`
  (the row's description run).
- **What**: Chrome drops a space-only text node between two inline elements
  from a button's name, so a row reads "Ослепительный Свет:Потратьте
  Надежду" where the screen shows the space (76 joins in 39 catalog records
  since the catalog style, 2026-10-15; the four Arazo shields `aa43`-`aa46`,
  `f56`). The card, print and the clipboard keep the space.
- **Why deferred**: the fix is in the row renderer, and the visible text
  is right.
- **How to verify the fix**: the `#/tables/eq_secondary` golden names row 46
  "... Ослепительный Свет: Потратьте Надежду ..." and the `#/tables/other_frames
  ~ two frames` golden names the `f56` row "... Быстрый выстрел: Потратьте 2
  Надежды ..."; each row name gains one character per join.

### D102 - a table with a head and no rows has header cells with no data

- **Where**: `app/src/components/Markup.svelte` (the table block) and
  `PrintCard.svelte` (`.dtable`).
- **What**: formatted text with a `|` line and a separator line but no row
  under it draws a `<thead>` of `<th>` cells and an empty `<tbody>`; axe's
  `th-has-data-cells` may flag it. No stored text has one (2026-10-15).
- **Why deferred**: only a homebrew author can write it, and the text still
  reads; the fix (draw a head-only table as a paragraph, or its cells as
  `<td>`) is a renderer change of its own.
- **How to verify the fix**: `components/markup.test.ts` renders `| a | b |`
  over `|---|---|` and `expectNoA11yViolations` passes.

### D103 - a one-language set bonus or rule card text draws with no mark

- **Where**: `app/src/components/RecordCard.svelte` (the set bonus and the
  rule card text) and `HomebrewCards.svelte`.
- **What**: a homebrew set bonus or rule card text written in one language
  draws in the other language with no «Текст только на английском» /
  "Text in English only" line and no `lang` (`I18N.md` names the
  departure); an item's description carries both.
- **Why deferred**: the mark derives from the drawn record (`textLangOf`),
  and the card texts reach `RecordCard` as stored cards, a second path.
- **How to verify the fix**: a set with only `ende` drawn in Russian shows
  the line before the bonus and `lang="en"` on it (`record.test.ts`), and
  the `I18N.md` departure sentence goes.

### D97 - the usage report rounds the bucket to 0.1 MB

- **Where**: `tools/supabase/usage-lib.mjs` (the Storage row's MB format).
- **What**: the Storage row prints megabytes with one decimal, so a bucket
  under 50 kB reads "0.0 MB" (39 362 bytes on the test project, 2026-10-14);
  the stored `storage_bytes` and the forecast are exact.
- **Why deferred**: found at R8's usage line; the forecast warns at 50 % of
  1 GB, where the rounding does not matter.
- **How to verify the fix**: `usage-lib.test.mjs` renders 39 362 bytes as a
  non-zero figure (kB under 1 MB).

### D98 - one homebrew page test costs about 100 s of every coverage run

- **Where**: `app/src/components/homebrewPage.timed.test.ts`.
- **What**: the test took 96 s alone and timed out at 120 s twice inside
  the full coverage run (measured 2026-10-14 on this host); its timeout is
  300 s and its 3000 ms draw bound is unchanged.
- **Why deferred**: found in R8's gates; the test belongs to
  `homebrew-followups`, and nothing in R8 touches it.
- **How to verify the fix**: the file runs under 30 s in
  `npx vitest run app/src/components/homebrewPage.timed.test.ts` with the
  same bound.

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

## Cloudflare Pages move (`cloudflare-pages`)

Owns: what the site host cannot do while the site sits at a subpath of
GitHub Pages: a robots file at a host root and an `X-Robots-Tag` header.

### D104 - the site's robots.txt is read by no crawler, and its text files carry no noindex

- **Where**: `robots.txt` on the GitHub Pages host
  (`https://artex-x.github.io/daggerheart-loot/robots.txt`), and the text
  files `llms.txt`, `data.json`, `catalog.csv`, `catalog-index.csv`,
  `names.json`, `schema/*.json`.
- **What**: a crawler reads robots.txt only at a host root, and
  `https://artex-x.github.io/robots.txt` answers 404, so the eight named
  blocks and the `Content-Signal` line have no effect on the site host;
  GitHub Pages sends no `X-Robots-Tag`, so the text files carry no
  `noindex`. The old host keeps these files and this `robots.txt` with the
  same bytes for good (`CONTRACTS.md` section 5), so there the blocks and
  the signal stay unread and the files carry no `noindex` after the move
  too.
- **Why deferred**: owner, 2026-10-15: no root file for `artex-x.github.io`.
  The move to Cloudflare Pages pays the new host only: it puts the site's
  file at a host root and adds the header there. The old-host half is an
  accepted trade-off of the decision "AI assistants read a compact index and
  the record pages".
- **How to verify the fix**: `curl https://daggerheart-loot.pages.dev/robots.txt`
  returns the site's own file: its "Readable data" comment, the
  `Content-Signal` line and the named blocks;
  `curl -I https://daggerheart-loot.pages.dev/llms.txt` shows
  `X-Robots-Tag: noindex`.
