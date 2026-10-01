# Scale challenge of the persistence surfaces (task scale-challenge, 2026-10-01)

Read-only pass. No repository file changed, no build, check, test or browser run. Every timing below is an
estimate from reading the code, marked "est". Nothing was measured. Paths are relative to `app/src/`
unless they start with `supabase/` or `docs/`.

## 1. Numbers used

| Item | Default | Ceiling or override | Source |
|---|---|---|---|
| Lists per account | 50 | null override = no limit; import 1000 per call | `supabase/migrations/20260925130000_limits.sql:28`, `20260930120000_import_lists_ceiling.sql` |
| Entries per list | 100 | write 5000 per op, import 5000 per list; one entry per item key (`unique (list_id, item_key)`) | `20260925130100_lists.sql:36` |
| Request lines / pending requests per list | 100 / 10 | 32 KiB JSON; a request expires after 1 h | `20260928120000_purchase_requests.sql:8,148` |
| Own items / cards / sources | 100 / 100 / 20 | 30 sections per source | `20260930130000_homebrew.sql:10`, `20261001130000_homebrew_relations.sql:7`, `lib/homebrew.ts:61` |
| Frozen copy | - | 131072 bytes each, no sum bound per list or account | `20261001130000_homebrew_relations.sql:638-641` |
| Share links | 1 active player + 1 active GM per list | revoked rows stay | `20260925130200_list_shares.sql:22` |
| PostgREST rows | 1000 per read | `supabase/config.toml:21` | |
| apply_list_writes | 200 ops per call | statement timeout 8 s (hosted, FEATURES "Limits") | `20260925130600_list_writes.sql` |
| Text caps | list name 200, notes 4000 | item name 120, desc 3000 per language, source or section 80, card name 80, subtitle 60, text 1500, url 300, craft 8, refs 3 | `lib/cloudLists.ts:22-24`, `lib/homebrew.ts:55-250` |

Catalog size is 1272 records (`lib/search.ts` header). A list holds each key once, so a list of catalog and own
items tops out near 1372 rows. Rows past that need frozen copies of other authors' items. So "5000 entries"
is reachable only with an override plus a hand-made import or many frozen copies. I use 1400 rows as the
realistic override case and 5000 as the ceiling.

Payload sizes (est): one entry JSON is about 350 bytes without a snapshot. A real frozen copy is about 2 KB
(decision file). A maximal item with its cards is about 81 KB. The bound is 128 KB.

## 2. Findings, ordered by user impact

Format: ID, surface, severity (blocker / risk / nit), size (S / M / L), release.

### F1. The account read ships every entry with its snapshot, on every load, poll and remote edit
- Severity: risk (blocker only with hostile or pathological data). Size: L. Release: own task (`account-read-shape`), load states part to R7f.
- Evidence: `ports/supabase.ts:249-251` (`LIST_SELECT` embeds `list_entries(...snapshot...)`), `:503-517`
  (no order, no range), `state/cloudLists.svelte.ts:272-302` (`#pull` then `#apply`), `:314-323` (`#remote`: any
  other tab's edit re-reads the whole account), `state/app.svelte.ts:592-594,874-893` (poll every 45 s while the
  owner topic is down), `lib/live.ts:17` (safety re-read every 300 s even when live).
- Size at defaults: 50 lists x 100 entries = 5000 entries, about 1.8 MB (est) with no snapshots. With 2 KB
  real snapshots on every entry, about 12 MB. One list of 100 frozen copies at the bound is 12.8 MB (the
  decision file's own number). 50 such lists is 640 MB, which a browser tab cannot parse. This needs hostile
  or pathological data, but nothing in the schema bounds it (no sum cap per list or account).
- Silent truncation: the read has no `.order()` and PostgREST caps at 1000 rows. A null override on
  `lists_per_owner` and more than 1000 lists returns an arbitrary 1000. The same cap hits
  `requests.list()` (`ports/supabase.ts:662-674`: pending of all lists, up to 10 x lists) and
  `homebrew.load` with a null items override.
- 360 px: a 12 MB parse on a phone shows «Загружаем...» for many seconds on `#/lists`, with no progress and
  no way out. Desktop: the same, shorter.
- Smallest fix, in the existing patterns: (a) read entries without `snapshot` plus a boolean column or a
  second small read for the keys that carry one, and fetch the snapshots of the open list on demand;
  (b) add `.order('updated_at', {ascending:false})` and page by `range()` once the count passes 500; (c) a
  per-list snapshot byte sum bound (server, a new limit key: owner decision, a contract change). Option (c)
  is the cheapest and stops the worst case at the source.

### F2. The shared page re-downloads the whole projection after every owner commit
- Severity: risk. Size: M. Release: own task (with F1), poll part R7f.
- Evidence: `supabase/migrations/20261001130000_homebrew_relations.sql:645-707` (`get_shared_list` returns
  all entries with snapshots, and fills a reference entry from the live item with its cards),
  `state/sharedView.svelte.ts:106-121` (`#message` then `refresh()` reads everything and compares
  `updated_at` after the download), `state/app.svelte.ts:865-868` (a poll every 45 s while the share topic
  is down).
- The owner's buffer commits 2 s after typing stops (`QUIET_MS`), so a note typed over a minute gives each
  open viewer about 30 full reads. At defaults a list of 100 own references of 81 KB each is 8 MB per read
  (est); 100 frozen copies at the bound is 12.8 MB. Readers are anonymous and often on a phone.
- Smallest fix: `get_shared_list(p_token, p_since int)` that answers `{unchanged:true}` when
  `revision <= p_since` (S, server plus port). The 12.8 MB first read stays; it needs F1 option (c).

### F3. A request panel that cannot be folded sits above the list rows
- Severity: risk. Size: S/M. Release: R7f.
- Evidence: `components/RequestsPanel.svelte:58-112` draws each pending request as a table of all its lines.
  `:44-50` `stockOf` runs `list.ids.includes` per line.
- Default worst case: 10 pending x 100 lines = 1000 table rows above the list, with «Принять» and «Отклонить»
  at the bottom of each request. At 360 px a row is about 36 px, so about 36,000 px (est) before the first
  list row, and 3600 px to reach the first «Принять». Any holder of a player link fills this: the send rate
  is 5 per minute per link, so the 10 slots fill in 2 minutes and expire after 1 h. It is a cheap
  griefing path against the list page.
- Smallest fix: show the first 5 lines of a request and «и ещё N» (a button that opens the rest), put the
  buttons and the total above the lines, fold requests after the first 3 behind a count (the Sources fold
  pattern: `PanelFold`). Move `stockOf` to a `Set` of `list.ids`.

### F4. The reader's limit message tells an anonymous reader to ask for a bigger limit
- Severity: risk (wrong guidance, no data loss). Size: S. Release: R7f.
- Evidence: `lib/cloudLists.ts:347-357` has no text for `request_lines`, so it falls to `limitOther`
  («Достигнут предел: 100. Нужно больше - напишите на daggerheart.loot@gmail.com.»).
  `state/requestSender.svelte.ts:93-103`. `components/SelBar.svelte:69-70` sends every ticked row as a line.
- A reader who ticks all rows of a list of more than 100 entries and presses send gets the owner's limit
  text. The reader cannot raise it. The bar shows no count against 100 before the press.
- Smallest fix: a dict key «В запросе не больше N позиций» for `request_lines`, and a hint on the bar
  above 100 ticked rows.

### F5. List page rows have no paging, and each row carries two hidden textareas
- Severity: nit at defaults, risk at an override of about 1400 rows. Size: S for the textareas, M for paging. Release: own task (`list-page-scale`); the textarea part may go with R7e because R7e edits this file.
- Evidence: `components/ListPage.svelte:1224` (`{#each items}` over every id), `:1367` (the note box
  `<div class="rnote" hidden=...>` with two `<textarea>` is always rendered), `:155-158` (`items` and
  `qtyById` rebuilt on each edit), `:768-777` (an effect over `items` runs `autoSize` on every
  `.rnote textarea` in the document after each keystroke), `:1014-1017` (`printHash` of all ids per render).
- 1400 rows is about 1400 x 30 nodes (est 40k nodes) plus 2800 textareas. First paint is est 0.5-1.5 s on
  a desktop and more than 3 s on a mid phone. Each qty or gold keystroke runs the `autoSize` walk (hidden
  boxes return at `offsetParent`, but it is 2800 reads).
- At the 100-entry default none of this shows.
- Smallest fix: draw the note box only when it is open or the entry holds a note (`{#if !boxHidden(...)}`
  around `:1367`), and give the effect a narrower selector (the focused textarea). Paging with «Показать
  ещё» is M because drag, `pickAll`, the position field and the print link all assume the full array.

### F6. Batch actions on a big selection are O(selected x rows) and send one op per row
- Severity: risk at an override. Size: M. Release: own task (`list-batch-ops`), or R7e if the owner wants it there.
- Evidence: `components/ListPage.svelte:696-725` (`batchDelete`), `:619-647` (`goldEdit`: reprice, guess,
  clear prices), `:585-589` (`pickAll` ticks all). Each call goes through `state/cloudLists.svelte.ts:622-650`
  (`removeEntry`: copies `entryIds` and `ids`, calls `#put` which filters all lists, then `#reorder` maps
  all ids) and `:587-611` (`setMeta`: copies `meta` of the list). `#enqueue` (`:331-346`) scans the queue
  with `findIndex` per op.
- 1400 ticked rows: about 1400 x 6 x 1400 = 12M element copies (est, main thread blocked about 1 s), then 1400
  `remove_entries` ops in 7 requests of 200 ops. The single undo toast replays `restoreEntry` 1400 times
  with the same cost and sends 1400 `add` ops. 5000 rows: 150M copies (est), several seconds frozen.
- Smallest fix: store methods `removeEntries(id, entryIds[])` and `setMetaMany(...)` that make one `#change`, one
  `remove_entries` op with an `ids` array (the op shape already allows it), and one `reorder`.

### F7. Deleting many own items is one request per item, with no progress
- Severity: risk. Size: S. Release: R7f (load states) or R7d.
- Evidence: `state/homebrew.svelte.ts:297-312` (`removeItems` loops `await #send(removeItem)`),
  `components/HomebrewPage.svelte:40-50` (`deletePicked` has no busy flag, the confirm names only a count).
- 100 items x 150-400 ms round trip on mobile (est) = 15-40 s with the button still enabled. A second press
  starts a second loop over rows that are already gone.
- Smallest fix: one request `delete().in('id', ids)` in the port, a `busy` flag on the button, and the
  confirm in the existing «N предметов» form.

### F8. Long name and note inputs have no `maxlength` and no counter; the store clips silently
- Severity: risk (silent loss of text). Size: S. Release: R7f (counters).
- Evidence: no `maxlength` in `components/` (searched). `state/cloudLists.svelte.ts:555-576` clips list name
  to 200 and notes to 4000 with `clip`; `components/ListPage.svelte:941-951` (title input is `value={own.name}`
  with `oninput`), `:803-831` (`seedText` ignores updates while the textarea is focused).
- Paste 500 characters into a list name: the field is reset to 200 characters on the next reactive update
  with no message. Type past 4000 in a note: the box shows the full text, the store keeps 4000, and the rest
  is gone at the next load. The homebrew editor is better: it has `descLength` and a validator message
  (`components/HomebrewEditor.svelte:572`).
- Smallest fix: `maxlength` on those inputs and a counter in the style of `descLength`.

### F9. Limits for sources and cards are not shown until the refusal
- Severity: nit. Size: S. Release: R7f (counters).
- Evidence: `ports/supabase.ts:772-780` reads `my_limit` for `homebrew_items_per_owner` only.
  `components/HomebrewSources.svelte:181-185` and `components/HomebrewCards.svelte:42-48` show plain counts.
  The quick item (`components/QuickItem.svelte:78-101`) and the list page show no «N из M» for entries.
- At 20 sources or 100 cards the author learns at the failure toast. At the entry limit the quick item
  creates the item first, the list refuses the entry 2 s later through the buffer, and the author keeps an
  orphan item after the toast «Добавлено» (`QuickItem.svelte:96-101`; refusal at `cloudLists.svelte.ts:427-430`).
- Smallest fix: `my_limit` for the other keys through one `my_limits(keys[])` RPC, shown as «из M» in the
  folds and in the list sub; a pre-check in the quick item when `ids.length >= limit`.

### F10. Import preview: O(lists x skips) report and an uncapped list of blocks
- Severity: nit to risk. Size: S. Release: R7d (it edits `ImportPanel`).
- Evidence: `components/ImportPanel.svelte:246-262` (`skipped.filter((s) => s.list === i)` per list; a 5 MiB
  file holds about 100k entries; 1000 lists x 100k skips = 100M ops, est 0.3-1 s freeze), `:331-340` (one
  `.rep-list` block per list whenever any list has a skip or a taken name; importing the same file twice makes
  1000 «name taken» blocks). Per-list lines are capped at `REPORT_LINES = 10` (`:79`); the error report is
  capped at 50 (`lib/bundle.ts:37`).
- Smallest fix: group the skips once into a `Map`, draw the first 20 blocks and «и ещё N списков».

### F11. Homebrew read is three whole-table reads, repeated by poll and by message
- Severity: nit. Size: M. Release: own task, or `debt-cleanup`.
- Evidence: `ports/supabase.ts:768-805`, `state/homebrew.svelte.ts:152-174`, `state/app.svelte.ts:886-892`.
- Worst case at defaults: 100 maximal items (2 x 120 + 2 x 3000 code points, up to 4 bytes) is about 2.5 MB,
  100 maximal cards 1.3 MB, 20 sources with 30 sections 0.4 MB (est). Typical use is under 100 KB. It re-reads
  every 45 s while the topic is down and after any remote homebrew message. `kept()` avoids redraws, not
  the download.
- Smallest fix: read `id,revision,updated_at` first and fetch only changed rows.

### F12. Print clips long text silently
- Severity: risk (printed card loses text). Size: S for a notice. Release: `debt-cleanup` (write it to `DEBT.md`) or R7f. Unverified in a browser.
- Evidence: `components/PrintCard.svelte:226-238` (the text ladder ends at 2.6cqw, then the box
  has `overflow: hidden`, `:409,434,542`). An item description may hold 3000 code points; the longest catalog rule
  card is 1299.
- Count cap works: `lib/hash.ts:18,123` limit a sheet to 180 cards, and `PrintPage.svelte:78-79,131-133` says how
  many were dropped. The list page print link carries all ids in its href (22 kB for 1400 ids, est), which
  the parser cuts to 180. Which 180 is the list order; the user cannot choose except by ticking (the bar's
  print link prints the ticked rows).
- Smallest fix: after the ladder, if `tight()` is still true, mark the card and show one warning line above
  the sheet.

### F13. Account deletion and large-account cascades are unmeasured against the 8 s timeout
- Severity: risk, unverified. Size: M. Release: own task (measure first; one test-project run).
- Evidence: `supabase/migrations/20260925120000_delete_account.sql` deletes `auth.users` and cascades. An override
  account with 1000 lists x 5000 entries is up to 5M rows. The import measurement in FEATURES (1000 lists x 5
  entries = 1.66 s plus 0.38 s commit) suggests it will not finish. `delete from lists` in the buffer has the
  same shape: 200 ops of big lists in one `apply_list_writes` call can pass 8 s, then `57014` counts as a
  fault (`ports/supabase.ts:132`) and the buffer waits 15 s x 3 tries before it halves
  (`state/cloudLists.svelte.ts:381-402`), showing «Не сохранено» for about a minute while the lists are
  already gone from the screen.
- Smallest fix: treat `57014` as an immediate halve (S). For the account delete, a chunked delete function (M).

### F14. Smaller items (nits)
- `#/lists` search refolds every name per keystroke: `lib/lists.ts:140-143` (`matchLists`) calls
  `foldQuery` (an NFD per character, `lib/search.ts:56-76`) on 1000 x 200 characters, est 30-80 ms.
  Fix: a `WeakMap` memo by list object, as `hayFor` does (`lib/search.ts:104-120`). S, `debt-cleanup`.
- `#/lists` pending counts: `waiting()` (`ListsPage.svelte:135-138`) calls `pendingFor` (`lib/requests.ts:129-137`),
  which filters and sorts all requests per card. 1000 cards x 1000 requests = 1M `Date.parse`, est 0.1-0.3 s per
  render once every card is drawn. Fix: a `Map` by list id in `OwnerRequests`. S.
- Add-to-list menu: `components/AddToList.svelte:96,387-388` calls `l.ids.includes(one)` twice per chip;
  1000 lists x 1400 ids x 2 = 2.8M per render of the open menu, repeated on each search keystroke. The menu
  is scroll-contained and has a search from 8 lists (`:129`, CSS `.dropmenu.long`), so it is usable.
  Fix: use the `held` set built at open. S, `debt-cleanup`.
- `listsHolding` (`state/app.svelte.ts:934-937`, used at `HomebrewEditor.svelte:213`) is O(lists x entries x keys). It re-runs
  only when the lists change. Nit.
- Unbroken long names: no `overflow-wrap` in `ListCard.svelte` (the `b` in `.listcard-top`, card is
  `overflow: hidden`), `PageTitle.svelte`, `Toast.svelte`, `Chip.svelte`, `HomebrewSources.svelte` (`.name`) or in the global styles. A 200-character
  name without spaces is clipped on a card, and may push an `h1` or a toast past 360 px (unverified in a
  browser). Fix: `overflow-wrap: anywhere` on those selectors. S, R7f.
- Filter chips: the `homebrew` table's «Раздел» row has one chip per used section, up to 100, each up to 161
  characters, with no fold or search (`lib/facets.ts:103-112,235-240`, `components/FilterBar.svelte`). The
  equipment `src` row gains up to 20 own sources. S, `debt-cleanup`.
- Homebrew cards fold lists up to 100 rows with no search (`HomebrewCards.svelte:76-117`), about 9000 px at
  360 px (est). Reuse the `LIST_SEARCH_AT` search box. S.
- Share panel: `shares.list` returns revoked rows too (`ports/supabase.ts:572-583`); each delete and create leaves
  a 150-byte row for ever. Only 2 links are active per list, so "many links" does not scale. Nit.
- A `add` or `create` op with a frozen copy over 60 kB is always sent alone and without `keepalive`
  (`lib/cloudLists.ts:100-111`, `ports/supabase.ts:165,194`), so a tab closed inside the 2 s window loses it.
  Nit.
- Editor per keystroke: `JSON.stringify(draft)` (`HomebrewEditor.svelte:118`), `previewOf` and `withRecords`
  over the catalog (`:187-191`, copies the byId map and 3 relation maps, est 1-3 ms) and the card preview.
  Fine at 360 px and desktop. `findItems` maps every match to an option before the picker keeps 8
  (`HomebrewRelations.svelte:67-76`); slice first. Nit.
- Toasts: one slot, a new `say` replaces the old (`state/app.svelte.ts:1233-1247`). No storm, but an error
  (2.6 s) can be replaced by the next success; a 7 s undo is replaced by any later toast. `#send` toasts once
  per flush (`cloudLists.svelte.ts:366,426-432`). Nit.
- Confirms: `delPicked` names 5 lists and «и ещё N» (`ListsPage.svelte:118-132`), so 1000 lists is fine; each name can be
  200 characters, so the native dialog can hold 1000 characters. `hbDeleteMany` names nobody. Nit.
- Export: `exportData` and `exportLists` build one string in memory (`state/app.svelte.ts:724-764`); it is 5 MiB at the
  import ceiling. The zip reader refuses more than 1000 entries (`lib/zip.ts:38`), so R7d must keep the homebrew
  export to a few files, not one per item.

## 3. Surface by surface (what holds, what breaks)

| Surface | Default limits | Override or ceiling | 360 px | Desktop |
|---|---|---|---|---|
| `#/lists` | 50 cards, 3 pages of 24 (`lib/lists.ts:23`), search from 8 | 1000 lists: 42 presses of «Показать ещё», selection stays on drawn cards, confirm names 5 | `listgrid` is one column; long unbroken name clipped (F14) | same; read time = F1 |
| ListsPage import | one file, preview | 1000 lists: F10 | long report page | same |
| List page rows | 100 rows, fine | about 1400 rows: F5, F6 | 5 controls per row already tight; reorder by the position field, native drag is slow on phones | drag needs edge scroll of 22 px per frame over a 1400-row page: minutes; the position field is the way |
| Requests panel | 10 x 100 lines: F3 | `pending_requests_per_list` raised: worse | 36,000 px | same |
| Share panel | 2 rows | - | link wraps (`overflow-wrap` present) | fine |
| Shared page `#/s/` | 100 rows | F2, 5000 rows draw unpaged through `TableRows` | `SelBar` sends every ticked row: F4 | same |
| Quick item | creates then adds: F9 | - | fine | fine |
| Print `#/print/` | cap 180 holds | F12 | fine | fine |
| `#/homebrew` | folds closed with counts, 100 rows in up to 100 section groups | null items override: no paging, F7, F11 | sections list 30 rows is about 2700 px | fine |
| Editor | selects of 21 and 31 options, pickers with search and 8 hits | - | form then preview stacked | preview sticky with inner scroll (`HomebrewEditor.svelte:1125-1129`) |
| `#/account` | no list rendering | F13 | fine | fine |
| Add-to-list menu | scroll box, search from 8 | 1000 chips, F14 | width min(320px, 90vw) | fine |
| Search and tables with 100 own | `searchable` 1372 records, results sliced to 300 (`SearchPage.svelte:62`), haystack cached per record | own records are new objects after any homebrew change, so 100 are refolded once (est under 10 ms) | fine | fine |
| Export zip | one file `lists.json` | 5 MiB; R7d adds homebrew | - | - |

Patterns that already hold and need no change: list index paging and search (`LIST_PAGE`, `LIST_SEARCH_AT`), `fewNames`
in confirms, folds closed with counts (`PanelFold`), `ItemPicker` (8 hits, «и ещё N», `hbPickMore`), report line
caps, `PRINT_MAX`, the atomic import with the 8 s note, one toast slot, batch splitting by 200 ops and 60 kB.

## 4. Realtime and poll cost, in one place
- One owner topic per account; one message per touched list per commit plus one per active share
  (`supabase/migrations/20260927120000_realtime.sql:11-66`). An import of 1000 lists sends 1000+ messages at
  commit (the 380 ms in FEATURES). Other tabs coalesce to one full re-read per 250 ms burst (F1).
- Poll: 45 s, only while the topic is not joined and only on `#/lists`, an open list, the homebrew pages and
  an open share page. Safety re-read: 300 s of lists, pending requests and homebrew, even while live.
- Steady cost per open tab at defaults: about 1.8 MB (est, no snapshots) every 5 minutes, up to 12 MB with
  real snapshots, plus the 2.5-4 MB homebrew worst case.

## 5. Bundle section

### 5.1 Budget and current output
`tools/bundle-budget.mjs`: limits 242 kB (configured build, with the `supabase-*.js` chunk) and 183 kB
(unconfigured); ceilings 250 and 190 (header comment, per decision). The script sums gzip of every `.js` and
`.css` in `dist/` except `data.js`. A lazy split therefore does not lower the number; it lowers first-load
bytes only. The number falls only when code is removed.

Measured by gzipping the existing files in memory (2026-10-01 evening builds; no build run now):

| Build | File | Raw | Gzip |
|---|---|---|---|
| `dist/assets` (configured) | `index-BOBXjXxN.js` | 511.2 kB | 159.9 kB |
| | `supabase-B5Ly021k.js` | 219.6 kB | 56.7 kB |
| | `index-DgNXGOeR.css` | 89.5 kB | 16.4 kB |
| | `zip-C5KV9HU8.js` | 3.7 kB | 1.6 kB |
| | total | | 234.6 kB (headroom 7.4 kB to 242; 15.4 kB to 250) |
| `dist-test/assets` (fake cloud) | `index-DENdjPZL.js` | 506.3 kB | 158.1 kB |
| | `fake-cloud-DBpvuFhV.js` | 24.3 kB | 8.2 kB |
| | css, zip | | 16.4 + 1.6 kB |
| | total | | 184.4 kB; 176.2 kB without the fake cloud (about 6.8 kB under 183; 13.8 kB under 190) |

First-load gzip in the configured build is about 178 kB (index, css, zip); supabase loads after first paint.

### 5.2 Heaviest modules (proxy, not a bundle analysis)
No analyzer output exists and no source maps are in `dist/`. I ranked by source size after stripping comments,
then scaled by the measured ratio (min about 0.6 of source, gzip about 0.19 of source; strings compress
better, template code worse). Error bar about 40 percent.

| Module | Source | Est gzip | Note |
|---|---|---|---|
| `lib/dict.ts` | 88.6 kB (both languages) | 11-12 kB | one object, not split by language |
| `components/ListPage.svelte` | 71 kB | 7 kB | core route |
| `lib/help.ts` | 38.9 kB | 4-5 kB (up to 10 if prose compresses worse) | read only on «?» |
| Homebrew UI (editor, relations, picker, card form, page, sources, cards, load, name field) | 91.6 kB | 10-15 kB | see 5.3 |
| `components/PrintCard.svelte` + `PrintPage.svelte` | 38 kB | 4-5 kB | route `#/print/` only |
| `components/TablesPage.svelte` | 28.9 kB | 2.7 kB | core |
| `lib/homebrew.ts` | 27.6 kB | 3-4 kB | stays: `withRecords`, validators, the index merge |
| `components/RecordCard.svelte` | 21.7 kB | 4 kB | core |
| `components/AddToList.svelte` | 20.5 kB | 3.5 kB | core |
| `components/AccountPage.svelte` | 19.6 kB | 2.4 kB | route |
| `lib/bundle.ts` + `components/ImportPanel.svelte` | 33 kB | 4 kB | used on one button |
| `ports/supabase.ts` | 29.9 kB plus supabase-js | 56.7 kB chunk | already lazy (`main.ts:53`) |

Directory totals (non-test source): components 566 kB, lib 384 kB, state 155 kB, ports 111 kB.

### 5.3 What the homebrew editor and its pickers weigh, and lazy loading
Existing `import()` sites: `lib/zip.js` (`state/app.svelte.ts:750`, `components/ImportPanel.svelte:127`),
`ports/supabase.js` and `ports/fake-cloud.js` (`main.ts:30,53`). Every page is a static import in `App.svelte:21-39`.
The service worker caches hashed files on fetch and the app needs a connection anyway (`docs/specs/META.md` section
"The service worker"), so a lazy chunk adds no offline case.

Candidates, most useful first:

| Split | Est gzip out of first load | Notes |
|---|---|---|
| Homebrew pages and editor (`HomebrewPage`, `HomebrewEditor`, `HomebrewRelations`, `ItemPicker`, `CardForm`, `HomebrewSources`, `HomebrewCards`) as one `import()` at `App.svelte` route level | 10-15 kB (editor alone 8-9) | Keep `lib/homebrew.ts`, `state/homebrew.svelte.ts` and `lib/homebrewForm.ts` in main: `app.index`, `QuickItem` and `TablesPage` need them. A part of `homebrewForm.ts` (pickers' `recordOption`, `cardOption`, `cardMatches`, `lineOption`) can move into the chunk (about 1-2 kB). The dict strings stay in main. |
| `PrintPage` + `PrintCard` | 4-5 kB | clean boundary, route only |
| `ImportPanel` + `lib/bundle.ts` parse side | 3-4 kB | `app.svelte.ts` still needs `toBundle` for export; move that call behind the existing `zip` import to free the rest |
| `help.ts` behind the «?» button | 4-10 kB | needs an async open state; touches `PageHead` and every `helpFor` call (M) |
| `QuickItem` | under 1 kB | not worth a chunk |
| `dict.ts` split by language | 5-6 kB | L, own task |

Rough cost of the homebrew split: a chunk of about 12 kB gzip plus its CSS (est 1.5 kB gzip), a total increase of 0.5-1.5 kB
because gzip works per file. It needs: a loading state in the route (`HomebrewLoad` shows «Загружаем...»
already), a failed-chunk state with «Повторить» (the `ImportPanel` pattern `import(...).catch(() => null)`), an
await in the browser suite before the editor states, and `guardLeave` kept working across the mount. Size M.
Trade-off: the first open of «Мои предметы» or the editor waits for one 12 kB request (about 100-150 ms on 4G, est);
the first load is 12 kB lighter. With the budget headroom at 7 kB, the cheaper first step is to put R7d's
homebrew import and export code into the lazy `zip` chunk, or its own lazy chunk, from the start. That code is
used on one press and would otherwise take R7d's share of the 7 kB.
Recommendation: lazy-load the homebrew pages only when a batch needs the budget or the first-load number
matters; do the R7d export and import code lazy now (S); do `PrintPage` next (S, clean boundary).

## 6. Recommendation, with the trade-off

Recommended order (by user impact, then cost):
1. F3, F4, F7, F8, F9 into R7f as one counters-and-load-states batch (all S, same files). Trade-off: R7f grows by
   5 small items; each is small and the same surfaces are open anyway.
2. F10 with R7d (same file). F5 textarea part and the quick-item pre-check (F9) with R7e.
3. F1 and F2 as one own task `account-read-shape`: option (c) in F1 (a snapshot byte sum bound) first, because it
   is a limit decision for the owner and it caps F1 and F2 with one migration. Trade-off: it refuses a rare
   large frozen copy, and it changes a contract the owner set at 131072 bytes on 2026-10-01.
4. F6 and the paging half of F5 as `list-page-scale`, only if the owner plans to raise `entries_per_list`.
   At the default of 100 neither is visible.
5. F13: one measured run on the test project before any code.
6. Nits in `debt-cleanup`.

## 7. Not verified
- No timing, payload or DOM measurement was taken; every "est" is arithmetic from the code and the migrations.
- Hosted `max_rows` and statement timeout were read from `supabase/config.toml:21` and FEATURES, not from the project.
- Unbroken-name overflow (F14) and the print clip (F12) are from CSS and ladder reading, not from a browser.
- The module weights in 5.2 are a proxy; run the bundle analyzer in the batch that splits a chunk.

## Placement (owner, 2026-10-01)
- R7f: F3 (requests panel folds), F4 (request-lines limit text), F7 (bulk
  item delete progress and busy state), F8 (`maxlength` on every capped
  field), F9 (missing «из M» counters; the quick item orphan when the list is
  full).
- R7e: F5 (render a row's note box only when open or filled; no re-walk per
  keystroke).
- A new release after R7f, working id `persist-7g-read-scale`: F1 (account
  read size, ordering and paging past the 1000-row cap, a snapshot byte
  limit per list as an option), F2 (`get_shared_list` answers `unchanged`
  for a known revision), F6 (batch delete and price edit as one op over
  `ids[]`). Own plan review (ports, RPCs, maybe a migration).
- R7d: F10 (the import report's per-list skip filter, «и ещё N»), and the
  homebrew import and export code ships as a lazy chunk like `zip` from the
  start (bundle headroom 7.4 kB to 242, 15.4 kB to the 250 ceiling).
- Not placed by the owner: F11 (homebrew read size), F12 (print clip,
  unverified), F13 (`57014` timeout handling, unverified), F14 nits. R7f's
  closeout moves each still-open one to `docs/specs/DEBT.md` for
  `debt-cleanup`.
