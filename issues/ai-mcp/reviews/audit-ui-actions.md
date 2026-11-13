# Review - audit of the UI action coverage for the account tier, B5 (ai-mcp)

Verdict: fix-then-continue
Reviewed: 71c6827cb3e9d1c1440f9ee3cb3d66178f65edf6
Scope: plan before B5b

<!-- Phase 1 was written to this file before plan.md was opened (the independence rule of
the dispatch). Code audited: worktree ai-mcp, HEAD 8571dbe0d681344d37bf89478432b88c78c11b4f.
Plan audited: worktree ai-mcp-b5plan, HEAD above, plan.md section 6 "B5". -->

Summary: 3 missing actions (M1-M3), 0 unjustified exceptions (X3's reason needs a wording
fix, N1), 2 wrong mappings (W1 = the L15 shape, also counted as M2; W2 = the L17 MCP
tool), 1 blocker (the retry of an import is not idempotent). No operation needs a name
outside B5a's guard list, so no migration and no second plan review follow. Every finding
is applicable without design work.

## Phase 1: derived actions

Derived from `app/src` (components, state, lib, ports) and `docs/specs/FEATURES.md`
alone. Ids use a `D` prefix so they do not collide with the plan's row ids. "Local" marks
an action that writes nothing to the account.

Record of independence: this section was saved first, before `plan.md` was opened. After
the plan was opened, DS18 was added and DI1, DI3, DH5, DH13 gained detail; all of it comes
from code read in Phase 1 (`ports/types.ts` `RequestRepository.list()`, `ListsPage.svelte`
`waiting`, `ImportPanel.svelte`, `app.exportLists`, `HomebrewEditor.svelte`).

### Lists (account lists)

| Id | Action | Source that proves it | Write |
|---|---|---|---|
| DL1 | Create a list by name | `ListsPage.svelte` `create` -> `state/cloudLists.svelte.ts` `create` | op `create` |
| DL2 | Create a list with the records of an add-to-list menu (taken meta on `#/s/`) | `AddToList.svelte` `createNew` | op `create` + op `add` |
| DL3 | Rename a list | `ListPage.svelte` `rename` | op `update` name |
| DL4 | Delete one list (confirm, no undo, its share links go) | `ListsPage.svelte` `delAccount`, `ListPage.svelte` `del` | op `remove` |
| DL5 | Delete the ticked lists (one confirm, mode stays on) | `ListsPage.svelte` `delPicked` | N ops `remove` |
| DL6 | Set the money mode coin / bag | `ListPage.svelte` `pickMoney` | op `update` money_mode |
| DL7 | Write the list's players' note and GM note | `ListPage.svelte` `noteInput` key `list` -> `setNote` | op `update` |
| DL8 | Clear a list note or an entry note, with undo | `ListPage.svelte` `clearNote` | op `update` / `update_entry` |
| DL9 | Add records to a list (tables, search, record page and modal, roll result, `#/s/` bar with taken counts, Items tab bar) | `AddToList.svelte` `pick` -> `add` | op `add` |
| DL10 | Remove a record from a list in the add-to-list menu, with undo (reads the details first) | `AddToList.svelte` `removeFrom` | op `remove_entries` (+ `reorder`) |
| DL11 | Remove one entry on the list page, with undo | `ListPage.svelte` `removeEntry`; undo `restoreEntry` | `remove_entries` + `reorder`; undo `add` + `reorder` |
| DL12 | Reorder an entry by drag or by the position field | `ListPage.svelte` `setPos`, drag `onDrop` -> `move` | op `reorder` |
| DL13 | Set an entry quantity 0..99 | `ListPage.svelte` `setQty` | op `update_entry` quantity |
| DL14 | Set an entry price 0..99999 | `ListPage.svelte` `setGold` | op `update_entry` price_coins |
| DL15 | Write an entry's players' note and GM note | `ListPage.svelte` `noteInput` -> `setMeta` | op `update_entry` |
| DL16 | Hide one entry from the players / show it again | `ListPage.svelte` row menu -> `setGmOnly` | op `update_entry` gm_only |
| DL17 | Hide / show the ticked entries, with undo | `ListPage.svelte` `gmOnlyTicked` | N ops `update_entry` |
| DL18 | Delete the ticked entries by the taken count (whole: remove; part: lower the stock), one undo | `ListPage.svelte` `batchDelete` | mixed `remove_entries` / `update_entry` |
| DL19 | Bulk prices on the ticked entries: guess by rarity band, shift by percent, clear; one undo each | `ListPage.svelte` `applyGuess`, `repriceTicked`, `clearPrices` (`goldEdit`) | N ops `update_entry` |
| DL20 | Copy the list or the ticked entries as text | `ListPage.svelte` `copyList`, `copyTicked` | local |
| DL21 | Roll from the list | `ListPage.svelte` `rollNow` | local |
| DL22 | Quick own item: make an item in the default source and add it to this list (refused before any write at the entry limit) | `QuickItem.svelte` `add` | `createItem` + op `add` |
| DL23 | Relink list rows in place to an own copy (side effect of DH31) | `state/app.svelte.ts` `saveItem` -> `relinkAs` | op `relink` |
| DL24 | Find, filter, selection mode | `ListsPage.svelte`, `ListPage.svelte` | local |

The UI has no list copy, no list merge and no "clear all entries" action; DL18 after
«Все» is the only way to empty a list.

### Share links, requests and notices

| Id | Action | Source that proves it | Write |
|---|---|---|---|
| DS1 | Open «Поделиться»: make the players' and the GM link for an audience that never had one | `SharePanel.svelte` `load` | `shares.list` + `shares.create` |
| DS2 | Make a link again for an audience whose link was deleted | `SharePanel.svelte` `create` | `create_list_share` |
| DS3 | Delete (revoke) a link, confirm | `SharePanel.svelte` `remove` | `revoke_list_share` |
| DS4 | Copy a link with its card version | `SharePanel.svelte` `copy` | local |
| DS5 | Read a shared list `#/s/<token>`; the owner sees "your list" | `SharedListPage.svelte`, `state/sharedView.svelte.ts` | `get_shared_list`, `ownerOf` |
| DS6 | «Сохранить себе»: save a copy of a shared list | `SharedListPage.svelte` `saveShared` -> `app.saveShareCopy` | `clone_shared_list` |
| DS7 | Add ticked shared entries with taken counts to an own list | `SelBar.svelte` `AddToList meta={takenMeta}` | = DL9 / DL2 |
| DS8 | Send a purchase request to the list owner | `SelBar.svelte` `sender.send` | `requests.send` |
| DS9 | Flow b: after an add from the bar, answer "notify" / "never", optionally remembered | `SelBar.svelte` `answer` -> `requestSender.answer` | send + prefs `notifyGm` |
| DS10 | Owner: apply a request | `RequestsPanel.svelte` -> `owner.apply(id, false)` | `requests.apply` |
| DS11 | Owner: apply what the stock holds (clamp) | `RequestsPanel.svelte` -> `owner.apply(id, true)` | `requests.apply` clamp |
| DS12 | Owner: decline a request | `RequestsPanel.svelte` -> `owner.decline` | `requests.decline` |
| DS13 | Owner: mark the list's requests and notices read (automatic, panel fully drawn, tab visible) | `RequestsPanel.svelte` effect -> `markRead` | `mark_list_read` |
| DS14 | Owner: hide one notice / hide all notices | `RequestsPanel.svelte` `hideNotices` | `requests.hideNotices` |
| DS15 | Owner: hide the decided requests | `RequestsPanel.svelte` `hide` -> `forget` | local |
| DS16 | Copy a filter link on `#/s/` | `SharedListPage.svelte` `copyFilterLink` | local |
| DS17 | Copy the ticked shared entries as text | `SelBar.svelte` `copySel` | local |
| DS18 | Owner: see which lists hold new requests and notices («Новое в списке (N)» on each card, the tab title count) over all lists | `ListsPage.svelte` `waiting` -> `ownerRequests.pendingCounts`, `unreadNotices`; `ports/types.ts` `RequestRepository.list()`, `notices()` with no list | `purchase_requests` and `list_notices` reads over all lists |

A link's audience and mode never change after it is made: each audience row has its own
link. There is no "change audience" action.

### Homebrew

| Id | Action | Source that proves it | Write |
|---|---|---|---|
| DH1 | Create an item in the editor (kind, tier, fields, source, section, relations, alternate profile, picture) | `HomebrewEditor.svelte` `save` -> `create` | `createItem` |
| DH2 | Edit an item (over the revision read) | `HomebrewEditor.svelte` `write` | `updateItem` |
| DH3 | «Сохранить мою версию» after a conflict (re-read, then write over any revision) | `HomebrewEditor.svelte` `saveMine` | `updateItem` revision null |
| DH4 | Load the other device's version | `HomebrewEditor.svelte` `showNew` | read |
| DH5 | «Сохранить как новый» in the gone banner: the draft under a new key | `HomebrewEditor.svelte` gone `NoticeBox` -> `run(ids.key, create)` | `createItem` |
| DH6 | Delete one item (confirm names list and relation counts; the database drops its list entries) | `HomebrewEditor.svelte` `remove` | `removeItem` |
| DH7 | Move one item to another source / section in the editor | `HomebrewEditor.svelte` `pickBook`, `pickSection` | `updateItem` book_id + content.section |
| DH8 | Create a source inline from the editor | `HomebrewEditor.svelte` `createSource` | `createBook` |
| DH9 | Create a section inline from the editor (SECTIONS_MAX) | `HomebrewEditor.svelte` `createSection` | `updateBook` (addSection) |
| DH10 | Picture: upload a file with crop (640 px and 160 px files) | `ArtField.svelte`, `CropDialog.svelte`, `HomebrewEditor.svelte` `upload` | `uploadArt` x2, then art name |
| DH11 | Picture: take another item's picture | `ArtField.svelte` ItemPicker (art kind `item`) | art name in the item write |
| DH12 | Picture: remove | `HomebrewEditor.svelte` `artToSend` kind `remove` | art null |
| DH13 | Relations in the item: upgrade line and «Новая линия» (same-type rungs), craft and craft_from, set, rule cards | `HomebrewRelations.svelte`; `HomebrewEditor.svelte` `rungs` | inside the item content |
| DH14 | Create a set or rule card inline from the relations | `HomebrewRelations.svelte` `CardForm` | `createCard` |
| DH15 | Sources tab: create a source | `HomebrewSources.svelte` `createSource` | `createBook` |
| DH16 | Rename a source (the language on screen) | `HomebrewSources.svelte` `renameSource` | `updateBook` |
| DH17 | Delete a source (confirm; the database moves its items to the default source) | `HomebrewSources.svelte` `removeSource` | `removeBook` |
| DH18 | Add a section | `HomebrewSources.svelte` `addSection` | `updateBook` |
| DH19 | Rename a section | `HomebrewSources.svelte` `renameSection` | `updateBook` |
| DH20 | Delete a section (items keep the key, draw as no section) | `HomebrewSources.svelte` `removeSection` | `updateBook` |
| DH21 | Cards tab: create a set card or a rule card (names, sub, bonus or text, url, source) | `CardForm.svelte` | `createCard` |
| DH22 | Edit a card, its source included | `CardForm.svelte` | `updateCard` |
| DH23 | Delete a card (confirm with the use count; items keep its key) | `HomebrewCards.svelte` `remove` | `removeCard` |
| DH24 | Add an own item to a card, with undo; asks before it takes the item from another set | `HomebrewCards.svelte` `add` | `updateItem` content.set / refs |
| DH25 | Add a catalog item to a card (CARD_ITEMS_MAX, REFS_MAX); a move from another own set asks first and is two card writes, the old card first | `HomebrewCards.svelte` `addBook` | `updateCard` x1 or x2 |
| DH26 | Remove a member from a card, with undo | `HomebrewCards.svelte` | `updateItem` or `updateCard` |
| DH27 | Items tab: move the ticked items to a source and section (every item or none) | `HomebrewBulk.svelte` `movePicked` | `move_homebrew_items` |
| DH28 | Items tab: delete the ticked items (requests of DELETE_CHUNK, the first failure stops, earlier chunks stay deleted, the rest stay ticked) | `HomebrewBulk.svelte` `deletePicked` -> `removeItems` | `delete_homebrew_items` |
| DH29 | Items tab: download the ticked items as a homebrew file | `HomebrewBulk.svelte` `download` | read |
| DH30 | Items tab: add the ticked items to a list, print them, copy them as text | `SelBar.svelte` | = DL9, DP1, local |
| DH31 | «Сохранить себе»: copy another account's item or a catalog record into own items, copy its picture, relink the reader's list rows | `PickRow.svelte` -> `app.saveItem` | `import_homebrew` + `copyArt` + `setArt` + op `relink` |
| DH32 | Show own items in the tables and search | `app.toggleHomebrew` | local |

The UI has no general duplicate, no bulk rename, no bulk edit and no rename separate
from the item edit.

### Import and export

| Id | Action | Source that proves it | Write |
|---|---|---|---|
| DI1 | Import a lists file (or a zip's `lists.json`), preview with skips; own-item copies first, then every list or none; the plan is built once per file, so a retry sends the same ids | `ImportPanel.svelte` -> `app.importPlan`, `app.importLists` | `import_homebrew` then `import_lists` |
| DI2 | Import a homebrew file (or a zip's `homebrew.json`): a «Куда» target per file source (default, held source, own new source, another row's new source, a custom name), skip or update held keys; every row or none | `HomebrewImport.svelte`; `lib/homebrewFile.ts` `Target`, `defaultTarget` | `import_homebrew` |
| DI3 | Download one list, the ticked lists, as a lists file (an entry with no record is left out and counted; a warning past the import bounds) | `ListsPage.svelte`, `ListPage.svelte` -> `app.exportLists` | read |
| DI4 | Download a source or the default source as a homebrew file | `HomebrewSources.svelte` -> `app.exportHomebrew({ book })` | read |
| DI5 | Download the ticked items | = DH29 | read |
| DI6 | «Скачать мои данные (ZIP)»: `lists.json` + `homebrew.json`, no pictures | `AccountPage.svelte` -> `app.exportData` | read |

### Print

| Id | Action | Source that proves it | Write |
|---|---|---|---|
| DP1 | Make a print set (selection bar, list toolbar, record action row), at most 180 cards, the same sheet answers the same id; open `#/p/<id>` | `app.print` -> `prints.create` | `create_print_set` |
| DP2 | Read a print set | `PrintPage.svelte` -> `app.loadPrintSet` | `get_print_set` |
| DP3 | Switch colour / size for this visit | `app.showPrintBW`, `showPrintCompact` | local |
| DP4 | Copy the set link | `PrintPage.svelte` | local |
| DP5 | Print in the browser (browser-measured fitting) | `dialog.print` | local |

The UI has no edit and no delete of a print set (it expires 90 days after the last open
and goes with the account).

### Account and settings

| Id | Action | Source that proves it | Write |
|---|---|---|---|
| DA1 | Sign in with Google or Discord | `AccountPage.svelte` `leave` -> `app.signIn` | auth |
| DA2 | Connect a provider | `AccountPage.svelte` -> `auth.link` | auth |
| DA3 | Disconnect a provider while two are connected | `AccountPage.svelte` `disconnect` | auth |
| DA4 | Sign out here / on all devices | `AccountPage.svelte` `signOut` | auth |
| DA5 | Delete the account (typed confirm; requests in calls of 200, then the account) | `AccountPage.svelte` `deleteAccount` | `delete_account_requests`, `delete_account` |
| DA6 | Language (also the header switch) | `app.setLang` -> `#changed` -> prefs | `user_prefs` lang |
| DA7 | Start section (select, and the pin button / «Ещё» item) | `app.setHome`, `app.pinHome` | `user_prefs` home |
| DA8 | Default tables view | `app.setTablesView` | `user_prefs` view |
| DA9 | Default print colour | `app.setPrintBW` | `user_prefs` printBw |
| DA10 | Default card size | `app.setPrintCompact` | `user_prefs` printCompact |
| DA11 | Remembered flow b answer (account only, no browser key) | `AccountPage.svelte` `setNotify` -> `app.setNotifyGm` | `user_prefs` notifyGm |
| DA12 | Download my data | = DI6 | read |

Record actions with no account write (share sheet, copy link, copy text, copy picture,
save picture: `RecordActions.svelte`) are local and are not counted.

Totals: 24 list, 18 share and request, 32 homebrew, 6 import and export, 5 print and 12
account actions (97). Local or a duplicate of another row: DL20, DL21, DL24, DS4, DS7,
DS15, DS16, DS17, DH29, DH30, DH32, DI5, DP3, DP4, DP5, DA12; a side effect only: DL23.

## Phase 2: the diff against "UI action coverage"

Mapping of each derived action to a row or an exception:

| Derived | Row or exception | Outcome |
|---|---|---|
| DL1, DL2 | L3 (`entries?` in `POST /me/lists`) | covered |
| DL3, DL6, DL7, DL8 | L4, L5, L6 | covered |
| DL4, DL5 | L7, L8 | covered |
| DL9, DS7 | L9 (entries carry quantity, price, notes, `gm_only`) | covered |
| DL10, DL11 | L13 (undo: L9 + L14) | covered; nit N3 |
| DL12 | L14 | covered |
| DL13, DL14, DL15, DL16 | L10, L11, L12 | covered |
| DL17 | L16 | covered |
| DL18 | L17 | REST covered; MCP wrong (W2, R3) |
| DL19 | L15 | wrong: no guess mode (M2 / W1, R2) |
| DL20, DS4, DS16, DS17, DP4 | X5 | justified |
| DL21 | X7 | justified |
| DL22 | H25 | covered |
| DL23 | inside H24 | covered |
| DL24, DH32, DP3 | X8 | justified |
| DS1 | S1, S2, X11 | justified |
| DS2, DS3 | S2, S3 | covered |
| DS5 | T0 (`plan.md` section 5.4, shared lists) | covered by the public tier; nit N5 |
| DS6 | S5 | covered |
| DS8 | R7 | covered |
| DS9, DA6-DA11 | X3 | justified; nit N1 on the reason |
| DS10-DS14 | R2-R6 | covered |
| DS15 | X12 | justified |
| DS18 | none | missing (M1, R1) |
| DH1-DH6 | H3-H7, H2 | covered |
| DH7 | H9 (editor fields through H4) | covered |
| DH8, DH9, DH15-DH20 | H14-H17 | covered |
| DH10, DH11, DH12 | H11 (+ X9), H13, H12 | covered |
| DH13 | H10 (craft links only) + H3-H5 content | covered by H3-H5; risk R6 |
| DH14, DH21-DH23 | H18-H20 | covered |
| DH24-DH26 | H21 | covered; risk R5 |
| DH27, DH28 | H9, H8 | covered |
| DH29, DI4, DI5 | H22 | covered |
| DH31 | H24 | covered |
| DI1 | L19 | covered; blocker B1 |
| DI2 | H23 | missing the «Куда» targets (M3, R4); blocker B1 for new targets |
| DI3 | L18 | covered; risk R7 |
| DI6, DA12 | X6 | justified |
| DP1 | P1 | covered |
| DP2, DP5 | X4 | justified |
| DA1-DA4 | X1 | justified (B5a stop rule) |
| DA5 | X2 | justified (D7) |

Rows with no UI source: S4 (an owner requirement, `context.md` "Owner requirements
(chat, 2026-11-12)", not a UI control: the UI does S3 then S2), L15's `{ set }` and the
bulk `quantity` of `PATCH /me/lists/{id}/entries` (the UI sets one entry at a time,
L10). None of them is a defect; N2 asks for the place column to say so.

Guard list (B5a step 3) against every "Ends in" name, and against R8 below: every table,
verb and RPC is on the list (`GET purchase_requests` and `GET list_notices` serve R8;
`PATCH lists` and `DELETE lists` serve L4, L7, L8; the triggers `lists_before_update`,
`list_entries_touch_*` and the deferred `lists_broadcast` fire on a table write as on AL,
so a direct table write keeps the revision and the Realtime message). Storage insert serves
H11 and H24 (`copyArt` is two public fetches and two uploads). No gap needs a migration.

Batch coverage: each row has an acceptance line in its batch. L4-L6 share line 7 and
L10-L12 share line 11 of B5b; H14-H16 and H18-H20 share lines 14 and 16 of B5c "one case
each" (N4).

## Blockers

B1. (B5b, L19; B5c, H23) A retry of `POST /me/imports` after a lost answer duplicates
rows. The app builds the import plan once per file, so its retry sends the same list ids,
entry ids and copy keys (`ImportPanel.svelte` head comment; `app.importLists`), and
`import_lists` reads a held list id as a retry. The API builds the rows on every call with
new ids (`newId`), so a second call makes every list again, and a homebrew import with a
`custom` or `new` target (R4) makes a second source. B5b standing check 2 says "a failed
write is 503 and the retry converges (a create by its id ...)", but an import has no id.
Change: "Common rules", "Imports" - add "`import_id` (optional UUID; the service makes one
and answers it): every list id, entry id, copy key and new source id is a UUIDv5 of
`import_id` and the row's place in the file, so the same file with the same `import_id`
sends the same ids, and `import_lists` / `import_homebrew` read it as a retry". Add to B5b
acceptance 18: "a second apply with the same `import_id` adds nothing"; add the same line
to B5c acceptance 19 for a homebrew file with a `custom` target.

## Risks

R1. (M1, B5d) DS18 has no row. The lists index shows «Новое в списке (N)» per list and
the tab title counts the unread requests over all lists (`ListsPage.svelte` `waiting`;
`RequestRepository.list()` reads the pending heads of every list, `notices()` with no list
the change-log rows). R1 reads one list, so a client needs one call per list (150 at 3x) to
find new requests. Add row R8: "the new requests and notices of every list (`ListsPage`
cards, the tab title) | `GET /me/requests` (pending heads `{ id, list_id, created_at,
read_at, expires_at }`, paged, expired ones flagged; `unread_notices` per list) |
`list_my_requests` | tables `purchase_requests`, `list_notices` | B5d". B5d acceptance:
"R8 heads over two lists, paging, an expired request flagged". Both tables are on the
guard list.

R2. (M2 / W1, B5b) L15 has no guess mode, and its `{ set }` has no UI source. The UI's
«Цены» sheet has three actions: «Применить» sets each ticked entry to its own guessed
price (`lib/money.ts` `guessPrice` with the catalog's rarity, an entry with no guess left
alone), the percent shift (`reprice`, -90..500, priced entries only) and «Без цены»
(priced entries only). Change the B5b operation row: `price` is `{ guess: true }`, `{
clear: true }`, `{ raise_percent }` or `{ discount_percent }` (`{ set }` stays, named as an
API addition); "an entry the function skips is `results: skipped`". Change the coverage
row L15 to "«Цены»: guess, shift by percent, clear, with undo". B5b acceptance 14 adds
`guess` and "an unpriced entry is skipped by a shift and by a clear". Both functions are
already in `lib/money.ts`; the row's "moved to `lib/`" clause is moot.

R3. (W2, B5b) L17's MCP tool is `remove_from_list (ids)`, which cannot take a part of a
row's quantity; the REST call can (`entries: [{ id, quantity? }]`). Change the L17 MCP
cell to `remove_from_list` (`entries`: id and optional `quantity`, as the REST body), and
B5b acceptance 25 adds "`remove_from_list` with a part quantity lowers the row". Also say
what `confirm` counts on L17: the number of entries in `entries` (a lowered row included),
so the count never leaves out the lowered rows.

R4. (M3, B5c) The homebrew import has no «Куда» targets. The UI picks a target per file
source (`lib/homebrewFile.ts` `Target`: `home`, `held`, `new`, `file`, `custom`); the API
only has `mode`. A client can import only into `defaultTarget`'s choice, so a file source
with the key or the name of a held source always merges into it. Change the B5c `POST
/me/imports` clause: "`targets` (optional): a map from a file source key (or `""` for the
items with no source) to `"home"`, `{ held: <id> }`, `"new"`, `{ file: <key> }` or `{
custom: <name>, lang }`; a missing key takes `defaultTarget`; the dry run answers the
targets it applies". Coverage row H23 adds "«Куда»". B5c acceptance 19 adds "a `custom`
target makes one new source; a `held` target puts the items there". I recommend B5c, not
B5d, for this line: it is the shape of a B5c operation, and a B5d line would change it
after its batch ships `openapi.json` 1.4.0.

R5. (B5c, H21) A catalog item's move from another own set is two card writes, the old
card first; the app asks before it (`hbMemberMoves`), and a failed second write leaves
the item in no own set. The plan names one `If-Match` per changed row, with no order and
no question. Change the B5c MCP clause: "`add_card_member` of an item that another own set
holds answers 409 `conflict` with that set unless `move: true`; with it, it writes the
old card, then this one, as `HomebrewCards.svelte` `addBook`; a failed second write
answers 503 with the first one applied, and a retry converges". B5c acceptance 17 names
"a move without `move: true` 409".

R6. (B5c, H3-H5, H10) The editor checks more than `contentProblems`:
`lib/homebrewForm.ts` `formProblems` refuses an upgrade line whose rungs are another type
(`rungs` from the catalog index), a source or section name held already, and more than
SECTIONS_MAX sections; the card caps REFS_MAX and CARD_ITEMS_MAX are checked in
`HomebrewCards.svelte`. The plan says only "`content` checked by `lib/homebrew.ts` as the
editor checks it". Change the B5c clause to "checked by `contentProblems`, then by the
editor-level checks of `formProblems` that need no draft (line type, held names, the
section, ref and card-item caps), then by the database"; coverage row H10 adds the
upgrade line. A check that stays app-only is named in B5c's "Deviations".

R7. (B5b, L18) An entry whose own item is gone and that has no linked record is left
out of the lists file and counted (`app.exportLists`, `#bundle` `skipped`); the app says
so in a toast. The API answer names no such count, so a client can lose the entry on a
round trip and not know. B5b `GET /me/lists/file` adds `skipped` (the count, per list) to
the answer, and acceptance 17 adds "an entry with no record is counted in `skipped`".

## Nits

N1. `local` - X3 reads "display settings of the app's own screens". The rows are account
data (`user_prefs`, every device), not local, and «Когда беру из чужого списка» is a
flow setting, not a display one. Add: "stored in the account, read only by the app's
screens; a client sends a request only by R7, so the remembered flow b answer has no
effect on it".

N2. `local` - S4's place column: "owner requirement (chat, 2026-11-12); in the UI, S3
then S2". L15 `{ set }` and the bulk `quantity`: "an API addition; the UI does it one
entry at a time (L10)".

N3. `local` - L13 "the undo is L9": the undo restores the place too, so it is L9 then
L14 (or L9 with a `position`). Say which.

N4. `local` - "A row's id is its acceptance id in its batch", but B5b lines 7 and 11 hold
three rows each. Split them, or write "one case per row" as B5c line 14 does.

N5. `local` - DS5 (reading `#/s/<token>` before S5 or R7) is the public tier's read; a
cross-reference line under the table saves the next auditor the search.

N6. `deferred-scope` - R7 to the reader's own list: the app hides the send there
(`requestToken` is null when `view.mine`); the plan does not say what the API answers.
One clause in B5d acceptance 7.

## Deviations

None recorded by a handoff for this scope (a plan audit). The plan's own rule sends every
audit gap to B5d ("Audit gap rows"). I recommend the batch of the row instead for R2, R3
and R7 (B5b) and R4, R5, R6 (B5c), with R1 (R8) in B5d: each of those changes the shape
of an operation that its own batch ships, and a B5d line would change a shipped
`openapi.json` version. The orchestrator decides; B5d acceptance 11 then names only R8.

## Standing checks

1. Scale: checked - B5b standing check 1 (lists 50/150, entries 100/300, heads 100 a
   page, bulk 100, L8 10) and B5c's (items 100/300, files at 65536 B); R8 at 150 lists is
   one paged read instead of 150 (R1). No screen in scope.
2. Error scenarios: checked - B5b and B5c standing check 2, the common rules (stop before
   delete and overwrite), the app's retry paths in `ImportPanel.svelte`,
   `HomebrewImport.svelte`, `homebrew.svelte.ts` `removeItems` and `HomebrewCards.svelte`
   `addBook`. Findings: B1 (import retry), R5 (two-write move), R7 (silent skip on
   export).
3. Consistency: checked - the AL shapes in `lib/cloudLists.ts`, the price functions in
   `lib/money.ts`, the import targets in `lib/homebrewFile.ts`, the editor checks in
   `lib/homebrewForm.ts`, against the B5b and B5c operation rules. Findings: R2, R4, R6.
4. RU/EN parity: checked - the new strings in scope are B5d placed line (1), given in
   both languages with the same facts; API error texts are English by the plan's rule.
   No finding.

Owner rules: checked - `context.md` "Owner requirements (chat, 2026-11-12)" (full UI
parity with named exceptions; share links create, read, replace, revoke; every bulk
operation; import and export of both files) has its home in `plan.md` section 6 "B5" and
section 7. "Every bulk operation" is not met while R2 (bulk guess) and R3 (MCP part
delete) stand.

## Suggested next action

Send B1 and R1-R7 with N1-N5 to the planner as one remediation of the "UI action
coverage" table and the B5b-B5d sections, then continue with B5a (the guard list needs no
change). No second plan look is needed: each finding names the section, the defect and
the change.

## Checks still needed

- None for a read-only audit. B5b's stub suite proves B1 (a second apply with the same
  `import_id`) and R2 (the guess numbers equal `guessPrice`).
