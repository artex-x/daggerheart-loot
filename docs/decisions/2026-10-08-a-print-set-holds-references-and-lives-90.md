# 2026-10-08 - A print set holds references and lives 90 days after its last open

- Task: `print-snapshots` (the owner's answers of 2026-10-08; the limit by the planner, confirmed by the owner the same
  day; the picture rule added on 2026-10-14).
- Decision: `print_sets` stores the ordered entries of one sheet as references - a catalog id, a homebrew item's id,
  a count of 2 to 99 - and `get_print_set` answers the cards as they are at the read; an item deleted since is left out
  and counted. A set lives 90 days after `opened_at`, which an open moves at most once a day, and the hourly
  `lifecycle_cleanup()` deletes it; an account holds at most 1000 live sets (`print_sets_per_owner`). The same
  sheet of one account is one row, by `unique (owner_id, digest)`. One definer read answers the records. At the limit
  the make is refused and nothing is deleted. A set names items, never a picture file, so the file
  clean-up needs no change (`DEBT.md` D96 closed).
- Rejected: frozen records (an author's delete would no longer stop readers, a set grows to about 0.5 MB, a fixed card
  never reaches it); 90 days from the press (a set in use dies on a date nobody sees); 200 sets (a GM printing 10
  sheets a week makes about 130 in 90 days); a row per press (the same list printed each session fills the limit); one
  client read per item (up to 180 calls); a read through the share it was made on (a revoke hides entries already
  seen); an oldest-first eviction (a write-time delete, against the lifecycle law, and it breaks a held link); `img`
  stored in the set (a frozen picture against live cards, and a join in three file checks for no reader gain).
