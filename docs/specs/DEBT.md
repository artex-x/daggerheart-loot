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

Owns: how the browser suites name a control, and their language runs for a
signed-in seed user.

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

### D111 - a shared page of 300 of the longest linked records nears the anon timeout

- **Where**: `get_shared_list(text, bigint)` and its `(text, bigint, jsonb)`
  overload (`supabase/migrations/20261015120000_shared_list_have.sql`), which
  build every linked entry's record with `homebrew_item_record`; the todo case
  in `tests/db/list-shares.test.mjs`.
- **What**: one list of 300 entries at three times the limits, each linked to
  its own item with the longest record the validators allow (about 81 KB with
  its source and four cards), read as `anon`: the median of three calls, measured
  2026-10-16 on this host in three runs, 1550-2120 ms for the two-argument form
  and 2305-3237 ms for the overload with `p_have = {}`. The hosted `anon`
  statement timeout is 3 s (read on the test project), so the first read of
  such a page may stop there; a re-read that names every held record sends no
  snapshot but still builds each record to hash it. Real records are about
  2 KB, and at the default limits a list holds 100 entries.
- **Why deferred**: the measurement belongs to `debt-cleanup` B3b, whose
  plan records a miss as an entry, not a redesign; the fix (a cached record
  text or hash per item, or a bound on the bytes a page builds) changes the
  projection's path and is the planner's choice.
- **How to verify the fix**: the todo case passes (drop its `todo`), with
  both medians in its log line under 1500 ms.

### D84 - small costs at three times the limits

- **Where** and **What**, one line each (estimates, none measured):
  - The `homebrew` table's «Раздел» filter row draws one chip per used
    section (up to 100) with no fold or search (`lib/facets.ts`,
    `FilterBar.svelte`).
  - One toast slot: an error can be replaced by the next success, a 7 s
    undo by any later toast.
- **Why deferred**: each is a nit at the default limits; the owner did not
  place them. `debt-cleanup` B5 pays both.
- **How to verify the fix**: per line, a unit test or a timing at three
  times the limits; delete the line when it is paid, and the entry with its
  last line.

### D105 - a long source line is cut at the side of a print card with no warning

- **Where**: `app/src/components/PrintCard.svelte` (`.pc-bottom`, `white-space:
  nowrap`, inside the `overflow: hidden` of `.pc-content`).
- **What**: a homebrew card's source line (the author's source and section, up
  to 80 code points per name) runs past the content box and is cut at the
  side. The clip report counts the content box down only, so neither the
  editor nor `#/p/` warns. Measured 2026-10-15 on this host: 170 px in a
  142 px box on gm1's axe, compact sheet.
- **Why deferred**: the fix changes the card's layout (a wrap, a fold or a
  shrink of the source line), which `authoring-print-preview` did not take.
- **How to verify the fix**: gm4's `hb_longsrcaaaaaaaaa` on the standard and the
  compact sheet: the whole source line is inside the card.

### D106 - the homebrew editor's way back after a save reads «Отмена»

- **Where**: `app/src/components/HomebrewEditor.svelte`, the button row
  («Сохранить», the ghost link to `HOMEBREW_HASH`, «Удалить»).
- **What**: after a save the only way back to «Хоумбрю» is a link that reads
  «Отмена» / "Cancel", which tells the author that the save is undone. The
  editor already names the same link «К моим предметам» / "To my items"
  (`t.hbToMyItems`) in its missing and gone states, and the leave guard
  (`hbDropEdits`) already asks on every navigation while the form is dirty.
- **Why deferred**: owner carry of 2026-10-14; the label moves the editor's
  goldens, which `debt-cleanup` B4 re-seeds.
- **How to verify the fix**: the button row reads «Сохранить», «К моим
  предметам», «Удалить» on a clean and on a dirty form; a press on a dirty
  form asks `hbDropEdits` (`homebrewEditor.test.ts`). Paid by `debt-cleanup`
  B4.

### D107 - the «Сохранить себе» note reads as the note of the whole pick row

- **Where**: `app/src/components/PickRow.svelte` (`p.savenote`, the strings
  `saveItemNote` and `saveItemNoteList`).
- **What**: the note about the copy sits under the whole row of pick
  buttons, so it reads as if it applies to «Добавить в список» too; it
  belongs to «Сохранить себе» only, and no attribute ties the two.
- **Why deferred**: owner carry of 2026-10-14; the fix moves the pick row on
  `#/h/`, the record modal and `#/s/`, a layout change for `debt-cleanup` B4.
- **How to verify the fix**: the button and its note form one group, and the
  button's `aria-describedby` names the note (a `PickRow` or item page test);
  the goldens of `#/h/`, the record modal and `#/s/` show the group. Paid by
  `debt-cleanup` B4.

### D108 - a shared entry's «Для игроков» note draws between two rows

- **Where**: `app/src/components/SharedListPage.svelte` (the two `HitNote`s
  in `TableRows`'s `after` snippet, outside the row's `div.row`);
  `HitNote.svelte` (`.hitnote`, `margin-top: 12px`).
- **What**: on `#/s/` an entry's note draws as a box under the row's border
  with a larger gap above it than below, so it reads as the next item's
  note. The owner's list page draws the notes inside the row's border.
- **Why deferred**: owner carry of 2026-10-14; the fix moves the shared-list
  goldens, which `debt-cleanup` B4 re-seeds.
- **How to verify the fix**: a `sharedListPage` test finds the note inside
  `div.row`; `TableRows` has no `after` prop; the shared-list goldens at 360
  and 1180 show it. Paid by `debt-cleanup` B4.

### D109 - the homebrew table hands out a link with no card

- **Where**: `app/src/components/TablesPage.svelte` on `#/tables/homebrew`:
  `copyTableLink` (the toolbar), `copyFilterLink` (`FilterBar`'s
  `oncopylink`) and `copySectionLink` (two section heads).
- **What**: on the homebrew table `linkTo` falls back to the app address,
  so the three copy buttons hand out a bare app link with no preview card,
  and the link shows another reader none of the copier's items
  (`FEATURES.md`, rule 17, names the exclusion).
- **Why deferred**: owner carry of 2026-10-14; removing three controls moves
  the table's goldens, which `debt-cleanup` B5 re-seeds.
- **How to verify the fix**: `#/tables/homebrew` draws no table-link,
  filter-link or section copy control (`tables.test.ts`, goldens). Paid by
  `debt-cleanup` B5.

### D110 - Bold on italic text and Italic on bold text do nothing

- **Where**: `toggleMark` in `app/src/lib/markupEdit.ts`, called by
  `MarkupField.svelte` (`run`).
- **What**: with the selection inside or around the stars of the other
  mark, `toggleMark` returns null and the button does nothing, so bold
  italic text cannot be made from the buttons, on a phone or on a desktop.
  Repro (2026-10-15): `toggleMark('*word*', 1, 5, '**')` finds one star
  before and after, neither holds bold, and returns null;
  `toggleMark('*word*', 0, 6, '**')` and `toggleMark('**word**', 2, 6, '*')`
  return null too.
- **Why deferred**: owner carry of 2026-10-14; the fix changes rule 18 of
  `FEATURES.md` ("Formatted text boxes"), a B4 change.
- **How to verify the fix**: Bold on an italic span and Italic on a bold
  span give `***...***` with the selection inside or around the stars, and
  a second press restores the text (`markupEdit.test.ts`,
  `markupField.test.ts`); a touch check on a phone width. Paid by
  `debt-cleanup` B4.

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
