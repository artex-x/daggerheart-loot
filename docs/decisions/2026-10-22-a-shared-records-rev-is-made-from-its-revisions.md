# 2026-10-22 - A shared record's rev is made from the revisions of its item, source and cards

- Task: `persist-review` (owner, P3 "Implement now" and the named rev case, 2026-10-22; planner, 2026-10-22).
- Decision: `get_shared_list(text, bigint, jsonb)`, the security definer, checks the share and
  the list's revision and answers `unchanged` before any build; `rev` is
  `homebrew_item_rev(uuid)`, the md5 of a leading format number and the revisions of the item,
  its source and its cards, and only an entry whose `rev` the caller does not hold gets a
  record. A null `p_have` answers with no `rev` and every record; `(text)` and `(text, bigint)`
  are now invoker forms of it (`supabase/migrations/20261022120000_shared_list_rev_and_bulk_delete.sql`).
- Rejected: a `private` schema helper (none here); three definer wrappers (two more warnings);
  md5 of the record text (it builds every record: 2305-3237 ms for 300 records of 81 KB, 2026-10-16).
- Accepted trade-off: the database no longer finds a changed record by itself: a migration that
  changes what `homebrew_item_record` or `homebrew_snapshot_of` builds must raise the format
  number, or `tests/db/list-shares.test.mjs` fails. The `rev` names neither the owner nor the
  item: an item deleted and made again with the same id, no source and no cards, and linked
  again between two reads can match a held `rev` and show the earlier record once.
- Amends "A shared page re-read names its held snapshots by hash" (2026-10-15): rev from revisions, not from the record text.
