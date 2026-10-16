# 2026-10-15 - A shared page re-read names its held snapshots by hash

- Task: `debt-cleanup` (owner, Q2 = A, 2026-10-08; planner, 2026-10-15).
- Decision: `get_shared_list(p_token text, p_since bigint, p_have jsonb)`, security invoker,
  calls `get_shared_list(text, bigint)` and writes `rev`, the md5 of a linked snapshot's jsonb
  text, on each homebrew entry; an entry whose `hid` `p_have` maps to that `rev` comes without
  its `snapshot` (a `p_have` that is no object or is over 64 KiB counts as `{}`). The port fills
  it from the map the store passed, captured before the call; an unfillable answer reads once
  more whole, a second one fails; after `PGRST202` the older calls return. `SharedView` drops an
  answer older than the one drawn. Extends "A shared page re-read names its revision" (2026-10-02).
- Why the database names the hash: the record embeds its source and cards, each with its own
  revision, and a client cannot rebuild the jsonb text form.
- Rejected: closing D85 by a decision; a 10 s throttle (it delays every change and still
  downloads everything); a revision per entry (a trigger on every entry write); the item's
  `revision` as the key (a source or card edit does not move it); a client-side hash.
- Accepted trade-off: one more anon-executable function and a fake that mirrors the strip.
- Measured 2026-10-16 (this host, 300 records of about 81 KB, as `anon`): median 1550-2120 ms for `(text, bigint)`, 2305-3237 ms for this overload, past half the hosted `anon` 3 s (`DEBT.md` D111).
