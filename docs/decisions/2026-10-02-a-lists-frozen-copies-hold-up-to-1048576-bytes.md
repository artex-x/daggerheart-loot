# 2026-10-02 - A list's frozen copies hold up to 1048576 bytes together

- Superseded in part by "An item is read by its id by anyone; a list holds a live link" (2026-10-07): the sum bound and its `limit_defaults` row are dropped.
- Task: `persist-7g-read-scale` (the owner's answer to Q1, 2026-10-01).
- Decision: the frozen copies of one list hold at most 1048576 bytes together (`sum(octet_length(snapshot::text))`), the `limit_defaults` row `snapshot_bytes_per_list` that `limits:set` overrides per user; `list_entries_snapshot_limit()` checks every statement that adds or changes a frozen copy; a list already past it keeps its copies. The refusal is `limit: snapshot_bytes_per_list` with the limit as its detail, shown as KB.
- Rejected: 2097152 bytes (fits every real 300-entry list at 3x, but doubles the bound per shared page and per account); no sum bound (one account at the defaults could store 640 MB of copies, above the free plan's 500 MB database).
- Accepted trade-off: at 3x a full 300-entry list of real 4-6 KB copies is refused at about its 170th-250th copy, and 12 maximal copies (about 81 KB) fill a list; an override lifts it. A shared page carries at most 1 MiB of frozen copies, one account 50 MiB at the defaults and 150 MiB at 3x.
- Amends "A frozen copy holds up to 131072 bytes; a card text holds 1500 code points" (2026-10-01): a sum bound per list.
