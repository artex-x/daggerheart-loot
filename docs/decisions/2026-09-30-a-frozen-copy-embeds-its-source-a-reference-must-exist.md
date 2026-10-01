# 2026-09-30 - A frozen copy embeds its source and cards; a reference must exist when written

- Amended by "A frozen copy holds up to 131072 bytes; a card text holds 1500 code points" (2026-10-01): the snapshot bound is 131072 bytes.
- Task: `persist-7-homebrew` (planner, passes 2-4; the owner's answers of 2026-09-30).
- Decision: `homebrew_snapshot_of(key, content, book)` writes the record with each missing language
  filled from the other, `src: 'homebrew'` and `book { key, en, ru, section? }`, and from R7c the
  own set and rule cards the item names, so a viewer draws the tag, the path and the cards with
  nothing to resolve; relations stay keys and draw only where they resolve. `list_entries` bounds a
  snapshot at 32768 bytes (was 16384), checks its shape and that its `id` is the entry's key. A
  trigger refuses a reference (`source = 'homebrew'`, `snapshot` null) whose key the list's owner
  does not hold, on every write path, and locks the item against a concurrent delete.
  `get_shared_list` fills a reference's snapshot from the live item; `clone_shared_list` decides
  from the source row: a reference stays live only for its owner, a frozen entry stays frozen.
- Rejected: resolving cards through the viewer's index (a viewer holds none); a foreign key from
  `item_key` (a frozen copy names a key its owner does not hold); converting dangling references at
  read time.
- Amends "Homebrew in the owner's lists is a live reference; a copy that leaves is frozen" (2026-09-26): the snapshot's content and bound, and the reference check.
