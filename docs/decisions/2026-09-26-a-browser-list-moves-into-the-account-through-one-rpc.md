# 2026-09-26 - A browser list moves through one RPC that hashes its canonical text

- Task: `persist-5-migration` (planner, 2026-09-26, passes 1, 7 and 8; the owner's answers of 2026-09-26: automatic, the two guards; decision 31's limit exemption).
- Decision: when a signed-in reader's app loads with browser lists and its catalog, each list is
  sent as one canonical JSON text (keys sorted, repeated and malformed ids dropped, every other id
  kept whether or not the catalog knows it, fields clipped) to `move_legacy_list(p_id, p_canonical)`;
  the database hashes it (SHA-256, hex) into `lists.legacy_fingerprint`, inserts the list and its
  entries in one transaction under a transaction-local setting the limit triggers honour, and
  answers the existing id with `inserted = false` on `(owner_id, legacy_fingerprint)`. The client
  stops when the user changed, reads back (a missing row ends the run, to be moved again), holds a
  list whose account copy differs (`held`, never sent again), and in one settle step removes a list
  only while its raw stored text still equals the moved one, writing the tombstones, the owner, the
  held ids and the names of new tombstones into `dhloot.migrated.v1` before the lists; one notice.
- Rejected: a button (the owner: seamless for readers who do not know); a client digest (jsdom has
  no `crypto.subtle`); the two-upsert `create` path (a drop leaves an empty list with the
  fingerprint); refusing over-limit lists; dropping ids the catalog does not know (with no
  `data.js` loaded every list would move empty and leave the browser).
