# 2026-09-26 - A browser list moves through one RPC that hashes its canonical text

- Task: `persist-5-migration` (planner, 2026-09-26; the owner's answers of
  2026-09-26: automatic, the two guards; decision 31's limit exemption).
- Decision: when a signed-in reader's app loads with browser lists, each is
  sent as one canonical JSON text (keys sorted, unknown and repeated ids
  dropped, fields clipped) to `move_legacy_list(p_id, p_canonical)`; the
  database hashes it (SHA-256, hex) into `lists.legacy_fingerprint`, inserts
  the list and its entries in one transaction under a transaction-local
  setting the limit triggers honour, and answers the existing id with
  `inserted = false` on `(owner_id, legacy_fingerprint)`. The client reads
  back, removes the browser list, records the tombstone, the first
  account's id and the names in `dhloot.migrated.v1`, and shows a one-time
  notice; a later account on that browser moves nothing.
- Rejected: a button (the owner: seamless for readers who do not know); a
  client digest (jsdom has no `crypto.subtle`); the two-upsert `create` path
  (a drop leaves an empty list with the fingerprint); refusing over-limit lists.
