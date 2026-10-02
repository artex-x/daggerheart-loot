# 2026-10-01 - A frozen copy holds up to 131072 bytes; a card text holds 1500 code points

- Amended by "A list's frozen copies hold up to 1048576 bytes together" (2026-10-02): a sum bound per list.
- Task: `persist-7c-homebrew-relations` (the owner's answer to Q15, 2026-10-01; planner refresh).
- Decision: `list_entries_snapshot_size` bounds a frozen copy's snapshot at 131072 bytes (was
  32768), and a homebrew card's text (`ende`, `rud`) holds at most 1500 code points per language,
  with names of 80, subtitles of 60 and a link of 300. A maximal item with three maximal rule cards
  and a maximal set card snapshots to about 81 KB in four-byte characters, and every catalog rule
  card (the longest text is 1299 code points) fits a homebrew card. Migration
  `20261001130000_homebrew_relations.sql` and `SNAPSHOT_BYTES` hold the numbers.
- Rejected: 65536 bytes with texts of 800 code points (the catalog's own `huge-green-ooze` card
  would not fit a homebrew card); 32768 bytes (an item with its cards does not fit).
- Accepted trade-off: a worst-case shared list of 100 frozen entries grows from 3.2 MB to 12.8 MB
  in `get_shared_list()`; real snapshots are about 2 KB.
- Amends "A frozen copy embeds its source and cards; a reference must exist when written" (2026-09-30): the snapshot bound.
