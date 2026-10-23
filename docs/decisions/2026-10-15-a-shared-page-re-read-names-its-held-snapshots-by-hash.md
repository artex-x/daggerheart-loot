# 2026-10-15 - A shared page re-read names its held snapshots by hash

- Amended by "A shared record's rev is made from the revisions of its item, source and cards" (2026-10-22): rev from revisions, not from the record text.
- Task: `debt-cleanup` (owner, Q2 = A, 2026-10-08; planner, 2026-10-15).
- Decision: `get_shared_list(p_token text, p_since bigint, p_have jsonb)`, security invoker,
  calls `get_shared_list(text, bigint)` and writes `rev`, the md5 of a linked snapshot's jsonb
  text, on each homebrew entry; an entry whose `hid` `p_have` maps to that `rev` comes without
  its `snapshot` (a `p_have` that is no object or is over 64 KiB counts as `{}`). The port fills
  it from the map the store captured before the call; an unfillable answer reads once more
  whole, a second fails; after `PGRST202` the older calls return, after `57014` for that read.
  `SharedView` drops an older answer. Extends "A shared page re-read names its revision".
- Why the database names the hash: a client cannot rebuild the jsonb text form it hashes.
- Rejected: closing D85 by a decision; a 10 s throttle (delays every change, still downloads
  all); a revision per entry (a trigger on each entry write); the item's `revision` (a source or
  card edit leaves it); a client-side hash.
- Accepted trade-off: one more anon-executable function and a fake that mirrors the strip.
- Measured 2026-10-16 (this host, 300 records of about 81 KB, as `anon`): median 1550-2120 ms for `(text, bigint)`, 2305-3237 ms here, past half the hosted `anon` 3 s.
