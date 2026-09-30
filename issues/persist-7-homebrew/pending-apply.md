# Pending apply - TASK persist-7-homebrew

Planning pass 2, phase A (2026-09-28) returned these texts to the
orchestrator instead of writing them, because R4 and R6 were being built
on the same tree. Planning pass 3 (2026-09-30) amended them for the
owner's first mock review (`plan.md` 4.14): the lines marked "pass 3".
They wait for the owner's answers to `plan.md` section 9 (Q1-Q12) and
the mock review. Apply them in phase B, adjusted to the answers (a
declined Q10, Q11 or Q12 drops its "pass 3" lines and D8 or D9); each
decision stays proposed until the owner approves. Then delete this file.

## Roadmap changes (`issues/persistent-storage/plan.md`)

1. Section 5, R7 row: replace with - three tables (`homebrew_books` {id,
   owner_id, key `^hb_[a-z2-7]{16}$`, content jsonb {en?, ru?}, revision,
   timestamps, unique (owner_id, key)}, `homebrew_cards` {..., kind
   set|ref, book_id null fk set null, content SetCard|RefCard},
   `homebrew_items` {..., book_id null, content = the whole catalog shape
   plus `craft_from`, validated by `homebrew_content_valid`}); limits
   `homebrew_books_per_owner` 20, `homebrew_cards_per_owner` 100,
   `homebrew_items_per_owner` (Q3: 500); owner-only RLS, `service_role`
   select and delete; pin, limit, touch (item, book, card), before-delete
   and `homebrew_broadcast` (event `homebrew` `{kind, key, revision, by}`
   on `owner:<uid>`) triggers; `homebrew_snapshot_of(key, content, book,
   cards)` embeds the source name and the cards; `list_entries`: the R2
   CHECK replaced by the two of pass 1, the bound widened to 32768, a
   `list_entries_reference_exists` trigger; `get_shared_list` and
   `clone_shared_list` re-created. Add an R7b row: `import_homebrew(p_books,
   p_cards, p_items, p_update) returns jsonb`, security invoker, one
   transaction, skip or update held keys. Remove `import_bundle` from the
   R7 row. Pass 3: `homebrew_items.draft boolean not null default false`;
   `homebrew_books.content.sections` (at most 30); `content.section`;
   `craft` and `craft_from` as lists of 1-8; the required-field rules in
   the validators; an update checks the loaded `revision`. R7b row:
   `import_homebrew` writes a held book's sections in both modes; the
   client maps sources before the call.
2. Section 6: keep `B7.2` (`ROUTES.md`, `CONTRACTS.md` 1, fixtures,
   `tests/contracts.js`, `llms.txt`: `#/homebrew`); add `B7.4` (pass 3;
   was `B7.3`: the same set for the `homebrew` table with the groups
   `kind`, `src`, `sect` and the group chip); add `B7b.1`
   (`CONTRACTS.md` 4: `schema/homebrew-v1.json`, `schema/import-v2.json`,
   the zip's `homebrew.json`; `llms.txt` two sections; `tests/derived.js`
   pins). `B7.3` (homebrew in lists) changes no public contract.
3. Section 9, releases table: R7 row -> `B7.1`-`B7.4` (planned 2026-09-28,
   pass 2, amended 2026-09-30, pass 3; `issues/persist-7-homebrew/plan.md`
   is the authority): homebrew
   items as first-class catalog records (sources with sections, cards,
   relations, the `homebrew` table, one merged search, the show/hide
   chip), live references in the owner's lists, a quick draft from a
   list page, «Мои предметы» from the account menu.
   New row after R7: `R7b | persist-7b-homebrew-files | B7b.1, B7b.2 | the
   homebrew-v1 file, import-v2 for lists, llms.txt with a blind round,
   import (skip or update) and export on #/homebrew, homebrew.json in the
   account zip`. The order line: "... R6, R7, R7b, R8, R9, persist-review,
   R10".
4. Section 12: replace the `B7.1`-`B7.3` rows with the six rows of
   `plan.md` 7.1-7.2; the total gains about 200 minutes (pass 3: R7 190 +
   R7b 81 against the old 70).
5. Section 14: replace the `B7.1`-`B7.3` outline with a pointer to
   `plan.md` section 4 and its one-paragraph summary (the record shape is
   the whole catalog shape plus `craft_from`, with `craft` and
   `craft_from` as lists and a `section` (pass 3); sources with sections,
   and cards, are rows; a quick draft from a list page carries a `draft`
   mark (pass 3);
   own records join `byId`, `searchable`, `allEquip`, the relation
   derivations and a `homebrew` table, frozen copies `byId` alone; dashed
   marks homebrew; the snapshot embeds cards; the editor keeps its save
   button with a guard; files in R7b). `B8.1` gains: the uploader offers
   the line's or another own item's picture; delete only when no item
   names the file. `B9.1` gains: the projection carries cards and book;
   relations to the author's other items travel as frozen names or are
   dropped (R9 decides); a clone drops or clones the chain.
6. Section 16, decision 31: the homebrew item default per Q3's answer (500
   recommended), plus the two new keys.
7. Section 17: "Deferred: homebrew import beyond v2's create-only" ->
   "import updates held keys when the GM chooses (R7b)"; drop "homebrew
   sets" from "Not in v1"; the R5b item "which release owns `DEBT.md` D64"
   stays open for the owner.

## Proposed decisions (`docs/decisions/`, then `node tools/decisions.js`)

### D1 - `2026-09-28-a-homebrew-item-carries-the-whole-catalog-shape.md`

```
# 2026-09-28 - A homebrew item carries the whole catalog shape; sources and cards are rows under the same `hb_` key

- Task: `persist-7-homebrew` (owner's scope of 2026-09-27/28; planner, pass 2).
- Decision: `homebrew_items.content` holds every field a catalog record may
  carry except a book's own (`roll`, `frame`, `starting`, `community`,
  `recall`, `img`): both languages optional with one name, `tier`
  (1-4, `A`, `C` on loot), `eq` with `line` and `alt`, `craft`, `set`,
  `refs` (at most 3), plus `craft_from` - the one field the catalog lacks,
  because an official record is never written. `craft` and `craft_from`
  are lists of up to 8 (the catalog's `craft` is one id; a file may give a
  string), and `section` names a section of the item's source. A draft
  mark is a column beside the content, never in a snapshot or a file.
  The required fields are the catalog's: one name; for a weapon the six
  stat fields; for armour the score and thresholds. A source («Источник»,
  code word `book`) is a `homebrew_books` row named by `book_id`; a set
  bonus or a referenced card is a `homebrew_cards` row (`kind` set or
  ref). Every homebrew object's key is `hb_` plus 16 base32 characters,
  unique per owner. Validators in SQL and `lib/homebrew.ts` share fixtures.
- Rejected: a free-text source tag on the item (item 13's books need an
  id); cards inside the source row (an item with no source has nowhere to
  put them); two card tables (the same RLS, limit and revision code twice);
  `recall` (drawn nowhere in the app).
- Amends "A homebrew item is stored as the catalog record shape in one
  jsonb column, under a per-owner `hb_` key" (2026-09-25): the shape is the
  whole record, not the seven fields.
```

### D2 - `2026-09-28-dashed-marks-homebrew-a-relation-draws-for-its-author.md`

```
# 2026-09-28 - Dashed marks homebrew; a homebrew relation draws on a catalog record for its author only

- Task: `persist-7-homebrew` (owner items 3-6; planner, pass 2).
- Decision: a homebrew item stores its relations as keys; the merged
  index derives `upgradesTo`, `madeFrom`, `setMembers` and the ladder over
  the catalog plus the signed-in account's own records, so an official
  card shows the author's relations to the author alone. One visual rule:
  dashed means homebrew - the source badge (`.badge.src.hb`), a homebrew
  name inside a craft or set line, a homebrew rung on a ladder, each
  titled with the source. A craft line with more than three names folds
  the rest behind «и ещё N» (a button with `aria-expanded`); a row draws
  the first name and the count. A frozen copy in a list joins `byId`
  alone: its own card draws what resolves, and it adds nothing to a
  catalog card.
- Rejected: a second relation line per origin (two labels for one arrow);
  a text suffix on every homebrew name; drawing a viewer's frozen copies on
  catalog cards (item 6).
```

### D3 - `2026-09-28-homebrew-is-first-class-in-the-catalog-pages.md`

```
# 2026-09-28 - Homebrew is first-class in the catalog pages; the roll pages are excluded

- Task: `persist-7-homebrew` (owner items 10-11; planner, pass 2).
- Decision: own records join `allEquip` (the three equipment tables, in
  their tier sections), `searchable` (one merged result list, the tag
  tells them apart) and a table `homebrew` in `TABLE_IDS`, sectioned by
  source with facets `kind` and `src`, its group chip drawn only signed
  in; the equipment tables' `src` facet appends `hb` and each source key
  after the fixed books. A memory-only `app.homebrewShown` chip «Хоумбрю»
  (pressed = shown) beside the kind chips on `#/search` and in the
  equipment tables' toolbar hides own records for this visit; it is not in
  the address. `rows` of the book tables and every roll pool stay the
  catalog's.
- Rejected: the second search group of pass 1 (not first-class); a `hb`
  filter group in the frozen grammar (a private narrowing has nobody to
  open its link); an eleventh tab; homebrew in the roll pages (owner).
```

### D4 - `2026-09-28-a-frozen-copy-embeds-its-cards-a-reference-must-exist.md`

```
# 2026-09-28 - A frozen copy embeds its cards and source; a reference must exist when written

- Task: `persist-7-homebrew` (planner, pass 2).
- Decision: `homebrew_snapshot_of` writes the record with the language
  fallbacks, `book { key, en, ru }` and `cards { sets, refs }` holding the
  own cards the item names, so a viewer's card draws its set bonus,
  referenced cards and source tag with nothing to resolve; relations stay
  keys and draw only where they resolve. The `list_entries` snapshot bound
  widens from 16384 to 32768 bytes. A trigger `list_entries_reference_exists`
  refuses a homebrew reference (`snapshot` null) whose key the list's
  owner does not hold, on every write path, import included.
- Rejected: resolving cards through the viewer's index (a viewer holds
  none); a foreign key from `item_key` (a frozen copy names a key its
  owner does not hold); dangling references converted at read time.
- Amends "Homebrew in the owner's lists is a live reference; a copy that
  leaves is frozen" (2026-09-26): the snapshot's content and the bound.
```

### D5 - `2026-09-28-the-homebrew-editor-keeps-its-save-button-with-a-guard.md`

```
# 2026-09-28 - The homebrew editor keeps its save button, with an unsaved-changes guard

- Task: `persist-7-homebrew` (owner asked, 2026-09-28; planner, pass 2).
- Decision: the editor saves on «Сохранить» (one awaited write) and
  guards unsaved changes: an in-app navigation with a dirty form asks
  through `env.dialog.confirm`, a closing tab through `beforeunload`
  behind `PagePort`, and Ctrl+S submits. The form checks on submit only:
  a focused error summary with links, a line under each field, a red
  mark on required fields. The update names the revision the form
  loaded; a newer revision or a deleted row draws a banner that lets the
  author overwrite, reload, or save a new item. A source, a section, a
  set or a rule card made from the editor is written at once by its own
  «Создать» button, never by «Сохранить».
- Rejected: R5's account write buffer for the item text - an own entry is
  a live reference, so a flush every 2 s would put a half-typed name on
  every referencing list, shared page and print sheet and send one owner
  and one share message per list per flush (R3's budget); a draft is
  invalid between keystrokes and the database's refusal would revert the
  form under the typist; a form has one submit and the buffer's
  merge-into-last serves a list's discrete fields.
- Amends "A homebrew save is a form submit, not the account lists'
  optimistic queue" (2026-09-25): the guard is added; the buffer stays rejected.
```

### D6 - `2026-09-28-homebrew-travels-as-its-own-file-lists-v2-carries-snapshots.md`

```
# 2026-09-28 - Homebrew travels as its own file; a lists file v2 carries frozen entries; import skips or updates held keys

- Task: `persist-7b-homebrew-files` (owner item 8; planner, pass 2).
- Decision: `daggerheart-loot/homebrew` version 1 (`schema/homebrew-v1.json`:
  `books`, `cards`, `items` with the catalog's field names and `hb_` keys
  the writer makes) is written by «Скачать предметы (JSON)» (a source, a
  selection) and as `homebrew.json` in the account zip, and read by
  «Импорт предметов» through `import_homebrew` (security invoker, one
  transaction; a held key is skipped, or updated when the GM chooses -
  references stay live, frozen copies do not move). `daggerheart-loot/lists`
  version 2 (`schema/import-v2.json`) adds `source: "homebrew"` entries
  with a required `snapshot`; v1 stays published and importable. A v2
  entry whose key the account holds is turned into a reference by the
  client before `import_lists`; the reference-exists trigger guards it.
  The import creates the file's sources; the preview maps each onto a new
  or an existing source (default: the held key, then the same name, then
  new), and the client rewrites `book` before the call.
- Rejected: a `homebrew` array inside the lists file (R6 moved it to the
  zip; a lists file stays lists); `import_bundle` (a second RPC for a
  conversion the client does); skip-only import (the GM iterates on a
  converted source).
```

### D8 - `2026-09-30-a-homebrew-source-may-hold-sections.md` (pass 3, with Q10)

```
# 2026-09-30 - A homebrew source may hold sections, as the community book holds communities

- Task: `persist-7-homebrew` (owner's mock review of 2026-09-29; planner, pass 3).
- Decision: a named source's row holds `sections [{ key, en?, ru? }]`
  (at most 30, `hb_` keys, names unique in the source); an item names
  one by `section`. Sections head the items on `#/homebrew` and
  `#/tables/homebrew`, give that table a `sect` facet and section
  anchors, and add a leaf to the path and the print source line; the
  tag stays the source. A section delete keeps its items in the source.
  Both file formats carry them from their first version.
- Rejected: separate sources per category (the owner asked for the
  community split); a text tag on each item (a rename rewrites every
  item; item 13's books need ids); a table of sections (a section has
  nothing but a name).
```

### D9 - `2026-09-30-a-quick-draft-from-a-list-page.md` (pass 3, with Q12)

```
# 2026-09-30 - A list page makes a homebrew draft in one press; the draft mark is the owner's

- Task: `persist-7-homebrew` (owner's mock review of 2026-09-29; planner, pass 3).
- Decision: an own account list offers «+ Свой предмет»: a name and a
  description make a homebrew item (kind «Предмет», the default source,
  `draft = true`), awaited, and then a reference entry through the
  list's write buffer. `draft` is a column, not content: the badge draws
  only from the owner's index, a projection, a snapshot and a file never
  carry it, `#/homebrew` lists drafts first, and the editor's first
  save clears it.
- Rejected: no mark (the drafts get lost among the other items); the
  mark in the content (it would reach frozen copies and files); one RPC
  for both writes (the two existing write paths already order them).
```

D7 (item 13's direction) is written at R7's closeout from `plan.md` 4.13.
