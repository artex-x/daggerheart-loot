# 2026-10-14 - Own pictures are random-named files the database deletes

- Task: `persist-8-media` (release R8; the owner's answers Q8-9 A and Q8-10 a of 2026-10-07 replace roadmap decisions 39 and 40).
- Decision: an own picture is two public files of the bucket `homebrew-art`, `p/<32 hex>.<ext>` (640 px) and `t/<32 hex>.<ext>`
  (160 px), named at random once per crop; `homebrew_items.art` stores the name, never a URL, and the answers carry it as
  `img` beside the item. Ownership is the object's `owner_id`, which Storage sets from the session; an item names only an
  upload of its stored owner. The database deletes a file when no item names it: a trigger at the row change and the
  hourly `lifecycle_cleanup()` ask the Storage API through `pg_net`, with the URL and a secret key in Vault; a lock per name
  and `homebrew_art_released` keep a write from naming a file queued for deletion; a failed request refuses no write. The
  upload room is twice `homebrew_items_per_owner` plus 5 pictures. The nightly backup copies the bucket on Sunday's run.
- Rejected: the `delete-account` Edge Function (Q8-9); deletion by the browser (the lifecycle law of 2026-10-07); a
  nightly workflow sweep (a day late, and GitHub stops an idle schedule); content-hash names in a folder per account (the
  account id in every reader's answer) or in one namespace (a pre-upload under another account's hash); absolute URLs (rows
  bound to one host through a restore); a limit row of its own (Q8-4); a nightly picture copy (Q8-10: the egress).
- Accepted trade-off: the secret key is readable by the `postgres` role, whose holders also gain Storage and Auth admin
  through it; a down migration then an up deletes every file unless the key or `art` is restored first; the CDN serves a
  deleted file until its one-day cache age runs out (owner, 2026-10-14: readers' egress), up to a day after the delete.
