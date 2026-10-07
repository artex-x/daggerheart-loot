# Plan - TASK persist-8-media (homebrew release R8)

## Status

- Task status: refreshed 2026-10-07 (planner, mode B with a design
  correction) against R7h's plan at `ac23ce36`
  (`issues/persist-7h-homebrew-page/plan.md`: live links, `#/h/<uuid>`,
  «Сохранить себе», the change log, the four tabs, `lifecycle_cleanup()`
  and the lifecycle law of `B7h.1`) and R9's refresh of 2026-10-07
  (`issues/persist-9-item-share/plan.md`, uncommitted: the print routes
  `#/print/s/<token>/<ids>` and `#/print/h/<uuid>`). Not started. Order
  (owner): R7h, R9, R8, `debt-cleanup`, `persist-review`, R10.
- The design of 2026-10-02 is in git: `git show
  ac23ce36:issues/persist-8-media/plan.md`. Section 2 lists what changed and
  every user-visible behaviour of that design that changes or goes.
- R9's questions: Q9-8 = B (`get_homebrew_item` gains `updated_at`; its
  effect on R8 is in 2.4); for Q9-6, Q9-7, Q9-9 and Q9-10 this plan assumes
  the recommended answers (A, B, A, A); section 2.4 names what another
  answer would change here.
- NEEDS_HUMAN_CONFIRMATION: no. The owner answered Q8-9 = A and Q8-10 = a
  on 2026-10-07 (section 9.0); `B8.1` is implement-ready as written. The
  owner's one-time steps (9.2) are not confirmations: step 1 blocks `B8.1`.
- Plan review: required before B8.1 (trigger: a migration with a storage
  bucket, a storage policy and SECURITY DEFINER functions - the room check,
  the picture triggers, `delete_account()` and the three read functions
  `anon` or `authenticated` execute; possible loss of stored data - the
  database deletes picture files on a row change, on the hourly job and on
  an account deletion, and the reversal drops `homebrew_items.art`; a new
  write protocol - an upload before the row write)
- Plan review findings applied: reviews/plan-B8.1.md
  - plan-B8.1-1: 3.1 (`art_delete` catches every error and answers null),
    7.3 steps 1 and 3, 9.2 steps 1-2 - a failed delete never refuses a row
    write or stops the job; the `pg_net` versions are read.
  - plan-B8.1-2: 3.1 (an advisory lock per name in both picture triggers and
    the job; the table `homebrew_art_released`; the owner check refuses a
    released name), 3.5 (B8.2 re-names and re-uploads on `artGone`), 5, 7.3
    step 3 (a released name refused; a two-connection case) - the
    recommended fix.
  - plan-B8.1-3: 4 and 10 (the backup's egress figures), 3.8, 9.3 (owner
    question Q8-10), 7.3 step 10 (per-run figures in the test).
  - plan-B8.1-4: 7.3 step 1 (privileges, an upload through the local
    Storage API, the foreign keys, `rolbypassrls`, the trigger name, the
    key-header probe before the review), case Q (3.3: `copyArt`), 7.3 gates
    (the image pull, CI's `db` job), 9.2.
  - plan-B8.1-5: 10 (the CDN assumption and its fallback), 3.10 and m48
    (the privacy sentence, both languages).
  - plan-B8.1-6: 3.9, 5, the "To undo" note - a down then an up deletes
    every file; the recovery.
  - plan-B8.1-7: 3.8, 7.3 files and step 10 - the restore order and a
    `restore-prod.test.mjs` case.
  - plan-B8.1-8: 7.3 step 3 - no API role reads the key's tables; `net`
    stays out of `[api] schemas`.
  - plan-B8.1-9: 7.3 files and step 3 - the reversibility snapshot holds
    the policies on `storage.objects`.
  - plan-B8.1-10: 3.3 case Q - no account id in an object's headers or
    info.
  - plan-B8.1-11: 3.1 - revokes on `homebrew_art_name_ok` and both trigger
    functions; the grants sentence corrected.
  - plan-B8.1-12: 4, 7.3 step 3 - 300 items, 600 requests.
  - plan-B8.1-13: 3.1, 3.6 - the job and the watch select only valid names.
  - plan-B8.1-14: 3.1, 7.3 standing check 1 - the partial index
    `homebrew_items_art` at once.
  - plan-B8.1-15: 3.2, 3.3, 7.3, 7.4 - `MediaPort`, `Env.media` and
    `cropRect` move to B8.2.
  - plan-B8.1-16: 2.3, 5 - «Сохранить как новый» with the saved picture is
    refused with `hbArtGone`.
  - plan-B8.1-17: 3.10, m48 - a shared picture links two items to one
    author.
  - plan-B8.1-18: 7.3 files - the runbook step to remove a reported
    picture.
  - plan-B8.1-19: `handoff.md` - the report path and the prettier result.
- Refresh before dispatch (after R9's closeout): copy the newest bodies of
  `get_homebrew_item` (R9's, with `updated_at`, Q9-8 B), and of R7h `B7h.3`
  for `get_homebrew_items`, `get_shared_list`
  and `lifecycle_cleanup()`, and the port names of R7h `B7h.4` (section
  3.0); add each open R7h or R9 review row or Deferred item placed on R8 as
  its own acceptance line. The design does not depend on the names.
- Batches:

| Release | Task id | Batch | Status |
|---|---|---|---|
| R8 | `persist-8-media` | `B8.1` the bucket, its insert policy and room, `homebrew_items.art`, the database's file deletion (triggers, the hourly job, the account deletion), `img` in the three read functions, the usage watch, the art half of the homebrew port, the fake, contract case Q, layer 3, the backup copy | implement-ready after R9's closeout and the owner's step 1 (9.2); Q8-9 and Q8-10 answered 2026-10-07; plan review findings applied |
| R8 | | `B8.2` every screen: the media port, the picture field and the crop dialog, the save flow, the picture on every surface (R7h's and R9's included), «Выбрать из предметов», the copy for «Сохранить себе», the exports, privacy, D60, the R11 line | outline (7.4) |

## 1. Objective and non-goals

Objective: an author gives an own item a picture from a file (or from
another item's picture), crops it square, and the item draws it wherever the
catalog draws pictures: rows (160 px), cards, the record page, the editor
preview, print, copy-image, «Отправить», the four «Мои предметы» tabs,
`#/h/<uuid>` for every reader, every list that links the item (own, another
player's, `#/s/`), and R9's print routes. «Сохранить себе» copies the
picture into the reader's account. The database deletes a file when no item
names it any more (the lifecycle law, R7h `B7h.1`).

Non-goals: pictures for sources, sets or rule cards; more than one picture
per item; pictures in the lists or homebrew files and in the data zip
(Q8-7 A); server-side resizing (`imgproxy` stays off); a picture library
page; an image editor beyond the square crop; a WebAssembly WebP encoder
(Q8-2 A); an Edge Function (Q8-9 A, owner 2026-10-07).

## 2. What changes after R7h and R9

### 2.1 The model this plan builds on

| R7h / R9 part | What R8 does with it |
|---|---|
| No `list_entries.snapshot` after `B7h.3`; a homebrew entry is a live link `list_entries.hb_item` | a list row draws the item's current picture; nothing freezes a picture name, so the 2026-10-02 rows for frozen copies (`homebrew_snapshot_valid`, the client `snapshotValid` admitting `img`, Q8-5's placeholder for a gone file) are not built |
| `get_homebrew_item(uuid)` (`anon`, `authenticated`), `get_homebrew_items(uuid[])` (`authenticated`), `get_shared_list(text)` (`anon`) | each answer carries `img` beside the item, never inside the projection that a previous bundle validates (3.4) |
| R7h's forbidden keys: an answer holds no `owner_id` and no uuid but `hid` | a picture name holds no account id: `p/<32 hex>.<ext>` (3.2); the 2026-10-02 name `<uid>/<sha256>.<ext>` would put the author's account id into every reader's answer |
| «Сохранить себе» (`B7h.4`, one `import_homebrew` call, the row relink) | the copy gets the reader's own copy of the file (Q8-6 A), then its `art` (3.7) |
| The change log: `homebrew_items_touch()` runs after every update of an item | a picture change is an update: linking lists re-read and get one «changed» notice; no R8 code |
| `lifecycle_cleanup()`, hourly through `pg_cron`; the law "lifecycle data is deleted on the backend on a schedule; a client never deletes or keeps it" | files that no item names are lifecycle data: the database deletes them (3.6); the browser deletes nothing |
| R9's `#/print/s/<token>/<ids>` and `#/print/h/<uuid>` read the same answers | the colour card prints the picture; R9 writes nothing for it (R9 plan section 10) |
| The «Мои предметы» tabs (`B7h.5`) | the Items tab's rows draw the 160 px file; the Sets and Rules tabs draw member names only (no picture, unchanged) |

### 2.2 The 2026-10-02 design: kept, changed, dropped

Kept: the field and the crop dialog (m40, m41), the encoders (Q8-2 A), the
200 KB file and the room of item limit + 5 pictures (Q8-4), «Выбрать из
предметов» over catalog and own pictures (Q8-3 B, m42), the copy for a saved
item (Q8-6 A), no pictures in files (Q8-7 A), the bucket in the nightly
backup (Q8-8 A), the upload at the save (not at the choice), the stored name
instead of a URL.

Changed (no question except where named):

| 2026-10-02 | Now | Why |
|---|---|---|
| names `<uid>/<sha256>.<ext>` in the author's folder | `p/<32 hex>.<ext>` and `t/<32 hex>.<ext>`, a random name made once per cropped picture; ownership is the object's `owner_id`, which Storage sets from the session | R7h's forbidden keys (no account id in an answer); a content hash in a shared namespace would let one account pre-upload under the hash another will produce |
| the browser deletes the old file at the save, unnamed files older than 10 minutes before an upload, and the pictures of deleted items | the database: a trigger asks the Storage API to delete a file the moment no item names it; the hourly job deletes what is left after one hour | the lifecycle law (R7h `B7h.1`) |
| account deletion through the `delete-account` Edge Function, files first; the account kept while files remain (m45, Q8-1 B) | Q8-9 A: `delete_account()` as today; the cascade's item deletes trigger the file deletes in the same transaction | Q8-9 |
| `delete_account()` refuses while files remain | not built | no client deletes files, so a stale tab cannot leave them |
| the `deleteHintArt` text «..., картинки тоже, ...» | today's `deleteHint` stays: «все связанные с ним данные» already includes the pictures, and rule "texts true in every release" (`FEATURES.md`, "Account") prefers the general text | a text, not a feature; the owner may reverse it at the review |
| the backup reads the bucket with `SUPABASE_SECRET_KEY_PROD` | the backup lists names over its database connection and downloads the public addresses: no new secret | the bucket is public |
| the privacy text "the address holds your account's internal number" | dropped: it no longer does | random names |
| `img` inside the frozen copy's snapshot | `img` beside the answer's item | no snapshots; a previous bundle validates the projection's keys |
| `MediaPort.hash` | not built: names are random | 3.2 |

### 2.3 User-visible behaviour of the 2026-10-02 design that changes or goes

Each row is listed for the owner (memory: confirm feature sacrifices). None
is dropped outright.

| Behaviour (mock of 2026-10-02) | After the refresh | Question |
|---|---|---|
| Deleting an account deletes its pictures first; if they cannot be deleted, the account stays and the toast says «Не получилось...» (m45) | Q8-9 A: the account always deletes; its files are deleted within a minute, or within two hours if the first request fails | Q8-9 |
| A replaced or removed picture leaves its address at the save; a deleted item's pictures go with it (m40 notes) | the same timing: the database deletes them at the row change, usually within a minute | Q8-9 (B and C change the timing) |
| Another device deleted the item; «Сохранить как новый» keeps the chosen picture (2026-10-02 section 5) | true for a new file in the form; when the form shows the item's saved picture, the delete removed its file, the save is refused with `hbArtGone`, and the author chooses the file again | none (named) |
| A frozen copy shows the picture it was copied with, or the placeholder once the author removed it (m43, Q8-5 A) | no longer applies: a list row is a live link and shows the current picture; a saved copy holds its own file | none |
| The account deletion hint names the pictures (m45) | today's general hint stays | none (the owner may reverse it) |
| `#/h/<token>` with the picture (m43) | `#/h/<uuid>` with the picture (m46) | none |

### 2.4 R9's open questions and their effect here

| R9 question (assumed answer) | Effect on R8 with that answer | Effect with another answer |
|---|---|---|
| Q9-6 A (no revocable item link) | none | B (a switch «Открыт по ссылке»): a closed item still exposes its picture to whoever kept the file's address; the privacy paragraph would say so |
| Q9-7 B (`#/h/` re-reads every 45 s) | a replaced picture shows on an open `#/h/` within 45 s | A: after a tab switch or a reload; C: about a second |
| Q9-8 B (answered: `get_homebrew_item` gains `updated_at`, in an R9 schema batch before R8) | the edit of 3.1 does not change: `B8.1` adds `img` and its term in `revision` to the body R9 shipped, so the base body and the reversal's target are R9's, not B7h.3's (step 0 copies it); `updated_at` is not a picture key and R8 reads nothing from it | - |
| Q9-9 A (five «Сохранить себе» details in B7h.4) | the copy's picture follows the same flow, also after the sign-in of (a) | B: B9.1 builds them; R8 the same |
| Q9-10 A (two link-scoped print routes) | the colour card on both routes prints the picture (m47) | B: no effect on R8 (`img` is in `get_homebrew_items` anyway) |

## 3. Design

### 3.0 Names this plan assumes

From R7h (not built yet): the migration `<ts>_homebrew_links.sql` with
`get_homebrew_item(p_id uuid)` answering `{ hid, mine, revision, item,
related }`, `get_homebrew_items(p_ids uuid[])` answering `[{ hid, item }]`,
`get_shared_list(text)` with `hid` on each homebrew entry, `lifecycle_cleanup()`
with B7h.3's rows, the port types `HomebrewItemRead` and the linked records'
read, the route kind `item` and `app.itemView`. From R9: `PrintPage.svelte`
with the kinds `printShare` and `printItem`. The refresh at dispatch writes
the real names into this section and into 7.3's file list.

### 3.1 Storage and schema (migration `<ts>_homebrew_art.sql`, after R7h's last)

| Object | Shape |
|---|---|
| extension | `create extension if not exists pg_net with schema extensions;` (the schema clause as the Supabase docs of the pinned CLI name it; B8.1 step 1) |
| bucket | `insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('homebrew-art', 'homebrew-art', true, 204800, array['image/webp', 'image/jpeg']) on conflict (id) do nothing` (JPEG: Q8-2 A; `on conflict` because the reversal keeps the bucket, 3.9) |
| names | `p/<32 hex>.<webp\|jpg>` (640 px) and `t/<32 hex>.<webp\|jpg>` (160 px), the same 32 hex for both: `crypto.randomUUID()` without its hyphens, made when «Готово» renders the crop, kept in the form's memory, so a retry uploads the same names |
| `homebrew_art_name_ok(p_name text) returns boolean` | immutable, `set search_path = public, pg_temp`; `revoke execute ... from public, anon` then `grant ... to authenticated` (the policy runs it as `authenticated`): `p_name ~ '^[pt]/[0-9a-f]{32}\.(webp\|jpg)$'` |
| `homebrew_art_room() returns boolean` | security definer, stable, `set search_path = public, pg_temp`; `revoke execute ... from public, anon` then `grant ... to authenticated`: true when `effective_limit(auth.uid(), 'homebrew_items_per_owner')` is null, else when `count(*)` of `storage.objects` with `bucket_id = 'homebrew-art'` and `owner_id = auth.uid()::text` is below `2 * (limit + 5)` (two files per picture; 5 pictures of slack for the files the job has not deleted yet; Q8-4) |
| policy `homebrew_art_insert` on `storage.objects` | `for insert to authenticated with check (bucket_id = 'homebrew-art' and public.homebrew_art_name_ok(name) and public.homebrew_art_room())`. No select, update or delete policy: readers use the public address, which needs none; the database deletes. If Storage refuses an upload without a select policy (case Q shows it), add `for select to authenticated using (bucket_id = 'homebrew-art' and owner_id = (select auth.uid())::text)` and record why |
| `homebrew_items.art text` | constraint `homebrew_items_art_shape check (art is null or art ~ '^p/[0-9a-f]{32}\.(webp\|jpg)$' or art ~ '^[A-Za-z0-9_-]+\.webp$')`: an own file, or (Q8-3 B) a catalog picture's basename (every catalog `img` matches the second form, checked 2026-10-07: 381 values) |
| index `homebrew_items_art` | `create index homebrew_items_art on public.homebrew_items (art) where art like 'p/%'`: the release trigger's and the job's "does an item name this file" read one index entry, also at 3x (about 45 000 items; an account deletion runs 300 of these checks) |
| `homebrew_art_released` | `create table public.homebrew_art_released (name text primary key, at timestamptz not null default now())`; row level security on, no policy, no grant to an API role. Each `p/` name queued for deletion, upserted (`on conflict (name) do update set at = now()`); the job deletes rows older than one day. It closes the window between the queueing of a delete and Storage's answer, in which the object row still exists |
| lock per name | both picture triggers and the job take `pg_advisory_xact_lock(hashtext('homebrew-art:' \|\| <the p/ name>))` before their checks; an update that changes `art` locks the old and the new name in the before trigger, the smaller name first, so two crossed updates cannot deadlock (the after trigger's second lock on the same name is re-entrant). Each check is its own statement, so in read committed it sees a naming write that committed while the lock waited |
| `homebrew_items_art_owned()` | trigger function, security definer, `set search_path = public, pg_temp`; `revoke execute ... from public, anon, authenticated`; `before insert or update of art`: takes the locks above; when `new.art` starts with `p/` and (insert, or `new.art is distinct from old.art`), both `new.art` and its `t/` name must exist in the bucket with `owner_id = new.owner_id::text`, and `new.art` must not be in `homebrew_art_released`; else `raise exception 'homebrew: art missing' using errcode = 'P0001'`. So an item names only its owner's uploads, and never a file that is deleted or queued for deletion |
| `art_delete(p_names text[]) returns integer` | security invoker, `set search_path = public, pg_temp`; `revoke execute ... from public, anon, authenticated, service_role`. Reads `dhloot_api_url` and `dhloot_storage_key` from `vault.decrypted_secrets`; either missing: answers null and does nothing. Else, for each distinct name of `p_names` that passes `homebrew_art_name_ok` (at most 2000): `net.http_delete(url := <api url> \|\| '/storage/v1/object/homebrew-art/' \|\| name, headers := jsonb_build_object('apikey', <key>))`; answers the count. The whole body, the Vault read included, sits in `begin ... exception when others then raise warning 'art_delete: %', sqlerrm; return null; end`: a missing `net` function, another signature on a hosted image, or a missing privilege never refuses the row write that called it and never stops `lifecycle_cleanup()`; the files left behind are the job's and the watch's (3.6). One request per file (no request body: every `pg_net` version takes it); a 404 for a file already gone is fine. Header form: as `.claude/README.md`, "Usage monitoring", found for the publishable key (`apikey` alone); 7.3 step 1 probes it for the secret key before the review |
| `homebrew_items_art_release()` | trigger function, security definer, `set search_path = public, pg_temp`; `revoke execute ... from public, anon, authenticated`; `after delete or update of art on homebrew_items for each row`: when `old.art` starts with `p/` and (delete, or `new.art is distinct from old.art`): takes the lock on `old.art`, then, when no row of `homebrew_items` has `art = old.art`, upserts `old.art` into `homebrew_art_released` and `perform public.art_delete(array[old.art, 't/' \|\| substr(old.art, 3)])`. An after-row trigger sees the whole statement's result, so a bulk delete of two items that share a picture deletes it once or twice (the second answer is a 404). An account deletion cascades to the items, so this trigger also deletes the account's files |
| `lifecycle_cleanup()` | `create or replace` of R7h B7h.3's body, plus a files block: select up to 2000 names `o.name` of `storage.objects` with `o.bucket_id = 'homebrew-art' and public.homebrew_art_name_ok(o.name) and o.created_at < now() - interval '1 hour'` and no item naming `'p/' \|\| substr(o.name, 3)`, ordered by `created_at`; for each, `pg_try_advisory_xact_lock` on its `p/` name (a name it cannot lock is skipped until the next run), the `not exists` check again after the lock, then the upsert into `homebrew_art_released`; `v_files := public.art_delete(<the kept names>)`; `delete from public.homebrew_art_released where at < now() - interval '1 day'`; the answer gains `'files', v_files` (null when the key is missing or the call failed). The hour is the grace between an upload and its row write; the orphans this finds are uploads whose save never wrote the row, and files whose delete request failed |
| `get_homebrew_item(uuid)` | `create or replace` of the newest body (R9's, with `updated_at`, Q9-8 B; else B7h.3's): the answer gains `img` (the item's `art`; the key is absent when null), and `revision` hashes it too: `md5((item \|\| jsonb_build_object('related', related, 'img', img))::text)`. No other key; `related` rows carry no picture (they draw as names) |
| `get_homebrew_items(uuid[])` | `create or replace`: each row `{ hid, item, img }` (`img` absent when null) |
| `get_shared_list(text)` | `create or replace`: each homebrew entry gains `img` beside `hid` (absent when null) |
| `delete_account()` | unchanged (the cascade does the work) |

Grants: the three read functions keep R7h's grants (`create or replace`
keeps them); `anon` still executes exactly four functions (R7h's
`harness.test.mjs` list). `homebrew_art_room()` and `homebrew_art_name_ok()`
are the two new functions `authenticated` executes, through the policy; no
new function is executable by `anon`.

Vault (owner step 1, 9.1): two secrets per hosted project, set once in the
dashboard's SQL editor and never in a migration - `dhloot_api_url` (the
project's `https://<ref>.supabase.co`) and `dhloot_storage_key` (a secret
key the owner creates for this use only, so that it can be revoked alone).
The local stack's tests seed them inside their rolled-back transaction.

### 3.2 The picture value and `artSrc`

- A record's `img` keeps one meaning: the stored name. A catalog record and
  a catalog picture chosen for an own item hold a basename (`q1.webp`); an
  own file holds `p/<32 hex>.<ext>`. Rows, answers and records carry the
  same string; nothing converts it at a boundary.
- `lib/art.ts` (new, pure): `ART_BASE` = `import.meta.env.VITE_SUPABASE_URL`
  plus `/storage/v1/object/public/homebrew-art/` (an empty string in a build
  with no sign-in, where no own item exists; if the lint rules forbid
  `import.meta.env` in `lib/`, the constant moves to `ports/` and `artSrc`
  takes it from there - the call sites do not change); `isOwnArt(name)`
  (`/^p\//`), `thumbOf(name)` (`p/` to `t/`), `newArtName(ext, uuid)` (the
  uuid without hyphens; `copyArt` uses it in B8.1). The size constants of
  3.5 and `cropRect` come with the crop dialog in B8.2, their first caller.
- `artSrc(img, broken, size)`: an own name - `ART_BASE + img`, or for
  `thumb` `ART_BASE + thumbOf(img)`; a `blob:` URL (the editor's unsaved
  preview) passes through for both sizes; a basename keeps today's rule.
  Every call site stays as it is.
- The service worker passes every cross-origin request to the network
  (`app/public/sw.js`, `url.origin !== scope.origin`), so own pictures are
  cached by the browser's HTTP cache only (`cacheControl` one year; a name
  never changes its bytes). `sw.js` does not change.
- The decision deviates from the roadmap's "absolute URL in `Record_.img`":
  rows restored from a backup into the test project would otherwise name the
  production host. Recorded in B8.1's decision file.

### 3.3 Ports

- `MediaPort` (new in B8.2 with the crop dialog, its first caller;
  `app/src/ports/media.ts`, in `Env` as `media`):
  `decode(file: Blob)` answers `{ ok: true; image }` with `width`, `height`
  and `close()`, or `{ ok: false; error: 'bad' }` (`createImageBitmap`
  rejected); `render(image, rect, side, type, quality): Promise<Blob>` (a
  canvas, `drawImage` of the source square, `toBlob`); `webp():
  Promise<boolean>` (probe once: a 1x1 `toBlob('image/webp')` whose type is
  `image/webp`); `preview(blob): string` and `release(url)` (object URLs).
  jsdom has none of these, hence a port; the test env gets a fake.
- `HomebrewRepository` gains `uploadArt(name, blob): Promise<ListWrite>`
  (`storage.from('homebrew-art').upload(name, blob, { upsert: false,
  cacheControl: '31536000', contentType: blob.type })`; a "Duplicate" or 409
  answer is `ok`, because the name is this form's own; an RLS refusal is
  `limit` with key `homebrew_art`, because the client never sends a bad
  name; a network failure as the port's other writes) and `copyArt(img):
  Promise<{ ok: true; name: string } | { ok: false }>` (fetch the 640 and
  160 public files, `newArtName`, upload both; any failure is `ok: false`).
  `ItemRow`, the create and update patches gain `art: string | null`; a
  write refused with `homebrew: art missing` maps to a new `ListWrite` reason
  `artGone`. The reads of 3.0 gain `img?: string`. No list or remove call:
  the browser deletes no file.
- `recordOf(row)` sets `img` from `art`; the reads set it from `img`; the
  client `snapshotOf` (the lists file export) leaves `img` out, so the lists
  file stays byte-compatible with `import-v1` / `import-v2` (Q8-7 A).
  `snapshotValid` does not change: files never carry a picture.
- The fake (`fake-cloud.ts`): objects `{ name, owner, blob, created }`, the
  room, the duplicate rule, the art trigger's two checks, the release on a
  row change and a delete (immediate), the account deletion's cascade, `img`
  in the three reads.
- Contract case Q (`cloud.contract.ts`; fake in `npm run check`, the test
  project in `npm run e2e`): the member uploads `p/x` and `t/x` (ok), the
  same name again (ok), a name of the wrong shape (refused); the public
  address of `p/x` answers 200 (real); an item with `art = p/x` saves;
  `art` naming a file the member never uploaded is refused (`artGone`);
  signed out, `get_homebrew_item` of the item carries `img`; the item's
  `art` set to null - the public address answers 400 or 404 within 30 s
  (real: polled; fake: at once); a throwaway user uploads a picture, names
  it on an item, and deletes the account - its address answers 400 or 404
  within 30 s. The real run also sends one `DELETE` with the test project's
  secret key and the `apikey` header alone to a throwaway's file, to prove
  the request shape `art_delete` uses; calls `copyArt` as the throwaway on
  the member's picture (a cross-origin fetch of both public files, then the
  upload: this proves CORS on public objects); and reads the answer headers
  of a public object and `GET
  /storage/v1/object/info/public/homebrew-art/<name>`, which must hold no
  `owner_id`, `owner` or account uuid (on failure, the decision file
  records it and the privacy text says so). The first half's 200 read goes
  through the CDN before the delete, so the 30 s poll also proves 10's CDN
  assumption.

### 3.4 What a reader receives

`img` sits beside the item in each answer (3.1), never inside it: a tab with
the previous bundle validates the projection's keys (R7h kept `hid` outside
`snapshot` for the same reason), so it ignores `img` and draws the item
without its picture until a reload. The new client merges `img` into the
record. A related item on `#/h/` draws as a name: no picture is read for it.

### 3.5 Upload flow (m40, m41)

- The editor's field «Картинка» after «Описание»: a 96 px square, then
  «Выбрать файл» (a hidden `input type=file accept="image/*"`) and «Выбрать
  из предметов» (Q8-3 B), or, with a picture, «Заменить», «Обрезать заново»
  (while the source file is in memory) and «Убрать картинку». The line under
  it (rule 15 d): the format, the size and "uploads when you save".
- Checks before the dialog: the file at most 20 MiB; decoded; the short side
  at least 160 px; the long side at most 8000 px. Each refusal draws under
  the field and reads no further.
- The crop dialog «Обрезать картинку» (native `<dialog>`): a square frame
  over the picture; drag with the pointer, arrow keys on the focused stage
  (2 % of the side, Shift 10 %), «Масштаб» a range input from "the short
  side fits" to 4x (+ and - on the stage); opens centred at the smallest
  zoom; «Готово» renders the 640 px square, then the 160 px square from it,
  makes the name, and closes; «Отмена» and Escape keep the field as it was.
- Encoding: WebP at qualities 0.85, 0.75, 0.65, 0.55 until the 640 file is
  at most 204800 bytes; where `webp()` is false, JPEG at the same steps
  (Q8-2 A); none fits: `hbArtSqueeze`.
- The field and the preview card draw the chosen square at once from an
  object URL; nothing uploads before the save. The leave guard counts a
  chosen file, a picture chosen from items, or a removed picture as a
  change.
- The save: (1) with a new file - `uploadArt` of the 640 file, then the 160
  file; (2) the row's create or update with `art`. Nothing else: the old
  file goes when the database sees the row stop naming it (3.1).
  «Загружаем картинку...» shows under the buttons while (1) runs.
- On `artGone` while the form still holds the cropped blob (a retry whose
  names the database released meanwhile): the save makes a new name,
  uploads both files again and writes the row, without asking the author.
  Without a blob (a picture chosen from items, or the item's saved
  picture), the field shows `hbArtGone`.
- «Выбрать из предметов»: `ItemPicker` over the catalog and the own items
  that have a picture (the item itself excluded); this item's `art` names
  the same `img`; no upload. Another account's items are not offered.

### 3.6 File deletion (Q8-9 A, owner 2026-10-07)

- One rule in one place: a file of `homebrew-art` lives while an item names
  it. The database applies it: `homebrew_items_art_release()` at the row
  change (replace, remove, item delete, bulk delete, account deletion
  through the cascade), and `lifecycle_cleanup()` hourly for uploads whose
  row never came and for failed requests.
- A request runs after the transaction commits (`pg_net` reads its queue
  then); a rolled-back delete sends nothing.
- `delete_account()` does not change; the account never waits for its
  files.
- Nothing in the browser deletes a file, and nothing in the browser decides
  that a file is unused.
- Security: `art_delete` builds the address from the Vault URL and a name
  that passed `homebrew_art_name_ok`, so a caller cannot reach another
  address; a user's delete reaches only the files of rows that user may
  delete. The key is readable by the `postgres` role, which CI's
  `migrate-prod`, `backup.yml` and `usage.yml` already hold (accepted
  trade-off: the same holders gain Storage and Auth admin through the key;
  the owner revokes this one key alone if it leaks).
- Watch (the B7h.1 `lifecycle` row of the nightly usage report):
  `lifecycle_overdue` adds the files with a valid name
  (`homebrew_art_name_ok`) that no item names and that are older than 3
  hours (the grace, the hourly run, and 2 hours, as B7h.1's predicates);
  the row also warns "the picture clean-up has no storage key" when the
  bucket holds a file and either Vault secret is missing (names only:
  `select count(*) from vault.secrets where name in (...)`).

### 3.7 Where the picture shows (m46, m47)

Rows, the lists index strip, search, `#/tables/homebrew`, the equipment
tables, the Items tab: 160 px. Cards, the record page and modal,
`#/h/<uuid>`, the editor preview, print (colour) on `#/print/<ids>`,
`#/print/s/<token>/<ids>` and `#/print/h/<uuid>`, copy-image and
«Отправить»: 640 px. A list row of another account's item draws the
author's current picture; `#/s/` the same. A picture that fails draws
today's placeholder through the broken-picture rule. Public objects answer
with `Access-Control-Allow-Origin: *` (assumption; B8.2's E2E flow checks
copy-image; today's text fallback covers a refusal).

«Сохранить себе» (R7h `B7h.4`): a catalog `img` is written as is; an own
file of the author is copied with `copyArt` and the new name is written with
an `updateItem` after the `import_homebrew` call (the import carries no
`art`); a failed copy leaves the saved copy without a picture and the toast
appends `copyArtFailed` (m46). The same runs after R9's sign-in path
(Q9-9 a).

### 3.8 Files, account, backup

- Exports (Q8-7 A): `snapshotOf` leaves `img` out (3.3); the homebrew file
  never held it. The «Ваши данные» hint adds `zipNoArt`.
- Account deletion: 3.6; the page, its hint and its busy state are today's.
- Backup (decision 39, Q8-8 A): `backup.yml` gains a step after the dump
  that runs `node tools/supabase/backup-art.mjs "$out/art"` (new): it
  connects with the existing `SUPABASE_DB_URL` (`tools/supabase/db.mjs`
  `connect`), lists the names of `homebrew-art`, derives the project's
  public address from the connection string's ref (`PROJECTS` in
  `tools/supabase/lib.mjs`), downloads each public file into the directory
  (a 400 or 404 for a file deleted after the list is counted and skipped;
  any other answer fails the job), and prints the counts. The step then runs
  `tar -cf "$out/art.tar" -C "$out" art`, encrypts it to
  `BACKUP_AGE_RECIPIENT` as `art.tar.age` and removes the plain files. No
  new secret. `restore-drill.mjs` checks that `art.tar.age` decrypts and
  lists when the artifact holds it. The runbook "Backups and restore" gains
  the owner's file restore (`npx supabase storage cp -r <dir>/p
  ss:///homebrew-art/p --experimental`, the same for `t`, owner only) and
  the Vault secrets of a new project.
- Cadence (Q8-10 a, owner 2026-10-07): the picture step runs on one night a
  week (Sunday's run; the database dump stays nightly), and
  `backup-art.mjs` downloads with at most 8 requests at a time, so 3x fits
  the job's 20 minutes (section 4). A dispatch with the input
  `art: true` runs it on any night.
- The restore depends on today's order in `restore-prod.mjs`: `TRUNCATE`
  of the public tables (no row trigger fires), the `auth` rows deleted by
  key (the cascade finds the items already gone), then the load with
  `session_replication_role = replica` (no trigger fires, so the owner
  check refuses no restored row and no delete is queued). A change of that
  order (a `DELETE` instead of `TRUNCATE`, a load without `replica`) would
  queue the deletion of every production file or stop the restore at the
  first restored picture. The runbook says so in one sentence, and a
  `restore-prod.test.mjs` case guards it (7.3 step 10).

### 3.9 Reversal

Drop the two picture triggers and their functions, `art_delete`, the policy,
`homebrew_art_room` and `homebrew_art_name_ok`; drop the constraint and
`homebrew_items.art`; restore `lifecycle_cleanup()`, `get_homebrew_item`,
`get_homebrew_items` and `get_shared_list` as the previous migrations wrote
them (`get_homebrew_item` as R9 wrote it, Q9-8 B); drop
`homebrew_art_released` and the index; `drop extension if exists pg_net`
only when the owner's read (9.2 step 1) showed `pg_net` was not installed
before this migration, else the reversal keeps it. The bucket and its files
stay: Storage refuses a delete of its tables from SQL, and the files are
the owner's to empty with the CLI. The reversal loses every picture
reference (a plan-review trigger).

A down migration followed by an up deletes every file: the bucket and the
Vault secrets survive the down, `art` does not, so after a forward fix
every file is an orphan older than an hour and the job deletes 2000 an hour
until the bucket is empty. Recovery, before the forward fix is applied:
restore `homebrew_items.art` from the last backup taken before the down
(`data.sql` holds the column), or delete the Vault secret
`dhloot_storage_key` first, which stops all file deletion.

"To undo `<ts>_homebrew_art`" (`.claude/README.md`): revert the app first
(the previous bundle ignores `img`), then the down migration; the files stay
until the owner empties the bucket; before any later up, delete
`dhloot_storage_key` or restore `art` (above).

### 3.10 Privacy pages

`pages/src/privacy.html` and `pages/src/en/privacy.html` gain a "Pictures"
paragraph after the share-links paragraph (EN source; RU in m48): "A picture
you add to a homebrew item is kept as a file in Supabase Storage under a
random name. Its address is public: anybody who opens the item, or a list
that holds it, can open the picture. Two of your items that show the same
picture share its address, so a reader can tell they are from one account.
When no item of yours names a picture any more - you replaced or removed
it, deleted the item or deleted your account - the database deletes the
file, usually within a minute; the address can answer for a short time
after that. A player who saves your item to their own items gets their own
copy of the picture; deleting yours does not delete theirs. The backup
keeps pictures encrypted for at most 30 days. The data archive holds no
pictures." "Last changed" moves. If case Q finds the CDN serving a deleted
file past 30 s (section 10), the sentence says "within an hour" instead.

### 3.11 Strings (RU / EN)

Reused: `save`, `cancel`, `nothing`, the picker's «Ещё N - уточните
запрос», `accountFailed`, `deleteHint`, R7h's `saveItemSaved`. New:

| Key | RU | EN |
|---|---|---|
| `hbArt` | Картинка | Picture |
| `hbArtChoose` | Выбрать файл | Choose a file |
| `hbArtFromItems` | Выбрать из предметов | Choose from items |
| `hbArtFromItemsLabel` | Предмет с картинкой | Item with a picture |
| `hbArtLine` | Квадрат 640x640 из файла PNG, JPEG или WebP до 20 МБ. Картинка загрузится при сохранении. | A 640x640 square from a PNG, JPEG or WebP file up to 20 MB. The picture uploads when you save. |
| `hbArtReplace` | Заменить | Replace |
| `hbArtRecrop` | Обрезать заново | Crop again |
| `hbArtRemove` | Убрать картинку | Remove the picture |
| `hbArtCrop` | Обрезать картинку | Crop the picture |
| `hbArtCropHint` | Перетащите картинку, чтобы выбрать квадрат. Стрелки двигают её, + и - меняют масштаб. | Drag the picture to choose the square. Arrow keys move it; + and - zoom. |
| `hbArtStage` | Кадр: перетащите или двигайте стрелками | Frame: drag it or move it with the arrow keys |
| `hbArtZoom` | Масштаб | Zoom |
| `hbArtDone` | Готово | Done |
| `hbArtTooBig` | Файл больше 20 МБ - выберите файл поменьше. | The file is larger than 20 MB - choose a smaller one. |
| `hbArtBad` | Не получилось открыть картинку. Выберите файл PNG, JPEG или WebP. | Could not open the picture. Choose a PNG, JPEG or WebP file. |
| `hbArtSmall` | Картинка меньше 160 пикселей по короткой стороне - выберите побольше. | The picture is under 160 pixels on its short side - choose a larger one. |
| `hbArtHuge` | Картинка больше 8000 пикселей по стороне - уменьшите её и выберите снова. | The picture is over 8000 pixels on a side - make it smaller and choose it again. |
| `hbArtSqueeze` | Не получилось сжать картинку до 200 КБ - выберите другую. | Could not make the picture 200 KB or smaller - choose another one. |
| `hbArtUploading` | Загружаем картинку... | Uploading the picture... |
| `hbArtUploadFailed` | Не получилось загрузить картинку: нет связи. Правки остались в форме - нажмите «Сохранить» ещё раз. | Could not upload the picture: no connection. Your edits are still in the form - press "Save" again. |
| `hbArtGone` | Картинка не сохранилась: файла уже нет. Выберите картинку заново. | The picture was not saved: its file is gone. Choose the picture again. |
| `limitHbArt` | Не сохранено. Достигнут предел картинок: %n. Нужно больше - напишите на daggerheart.loot@gmail.com. | Not saved. The picture limit is reached: %n. Need more? Write to daggerheart.loot@gmail.com. |
| `copyArtFailed` | Картинку скопировать не получилось - копия сохранена без неё. | Could not copy the picture - the copy was saved without it. |
| `zipNoArt` | Картинок в архиве нет: после переноса добавьте их заново. | The archive holds no pictures: add them again after the move. |

The picture limit names `limit + 5` pictures (the files over two): 105 at
the defaults. Removed from the 2026-10-02 list: `deleteHintArt`.

## 4. Scale (States table, B8.2; B8.1's rows in 7.3)

Limits: own items 100 (`homebrew_items_per_owner`; 3x 300); pictures per
account item limit + 5 (105; 3x 305; 610 files, of which at most 600 are
named by the 300 items); a 640 file 204800 bytes (a
bucket constant, no 3x row); input 20 MiB, sides 160-8000 px (validator
constants); `art_delete` 2000 names per call (a constant).

| State | Screen | Proof |
|---|---|---|
| no picture / one / chosen unsaved / saved | m40 | unit `artField.test.ts`; golden `#/homebrew/<bedroll> as gm1` (saved, seeded with a catalog picture) |
| the Items tab at 300 own items with pictures (3x) | rows lazy-load 160 px files (about 8 KB each, cached a year) | R7h's 300-item timed case re-run with pictures; figures in the handoff |
| the picture limit and one past it | m40 limit line; nothing written | unit (fake at the room); layer 3 room case (B8.1) |
| the longest name (120) with a picture at 360 px and 1180 px | the card's picture box is square, the name wraps (rule 16) | `sweep.js 360` on the long bedroll with a picture; goldens at 1180 |
| the crop dialog at 360 px with the keyboard | no text input in it; it fits | m41; a11y unit with axe |
| `#/h/<uuid>` as gm2 with the picture; a picture that fails | m46; the placeholder | goldens `#/h/<bedroll hid> as gm2` and `as gm1` re-seeded; unit for the broken rule |
| gm2's list with 1 and 100 (the list limit) linked items of gm1 with pictures | rows draw each 160 px file; one `get_homebrew_items` call per read | unit; golden `#/lists/<gm2 list> as gm2` |
| the change log after a picture change | «Автор изменил «%s».» (R7h) | layer 3 (B8.1): one notice; golden unchanged |
| «Сохранить себе» with a picture, and the copy failed | m46 toasts | unit over the fake |
| print of 180 cards with own pictures on `#/print/<ids>`, `#/print/s/`, `#/print/h/` | colour cards draw each 640 file; black-and-white draw none | `tests/app/print.js` with a seeded picture; R9's print goldens re-seeded |
| an account deletion at 300 items with pictures (3x) | today's page | layer 3 (B8.1): 600 requests queued in one transaction; the 10 files of the slack that no item names go with the job |
| the backup's picture copy at 1x, at the 1 GB storage limit and at 3x | no screen; the run time and the egress below | `backup-art.test.mjs` (B8.1) with the per-run figures |

Backup egress (plan-B8.1-3). The free plan gives 5 GB uncached plus 5 GB
cached egress a month (`.claude/README.md`, "Usage monitoring"); the usage
report cannot see egress. A full copy downloads the whole bucket once:

| Bucket | Nightly full copy (30 a month) | Weekly full copy (about 4.3 a month, Q8-10 a) | Run at 8 requests at a time |
|---|---|---|---|
| 22 MB (one account at the defaults, the worst case, 210 files) | 0.66 GB | 0.09 GB | seconds |
| 170 MB (about 1 600 files) | 5.1 GB (the whole uncached allowance) | 0.73 GB | under a minute |
| 1 GB (the storage limit, about 10 000 files) | 30 GB | 4.3 GB | about 2-3 min |
| 92 000 objects at 3x (150 accounts, about 3 GB) | 90 GB | 13 GB | about 19 min at 100 ms a file, inside the job's 20 |

A serial download of 92 000 objects does not fit the job's 20 minutes;
the concurrency limit does. The 3x row passes the egress allowance even
weekly; the usage report's storage forecast warns long before (at 50 % of
1 GB).

At many the primary action keeps its place: the field sits inside the form;
the save button is where it is. No sticky region grows; the dialog has no
text field, so the on-screen keyboard does not open over it.

## 5. Error scenarios

| Scenario | Screen | Stored data and recovery |
|---|---|---|
| decode fails, wrong size, no encoding fits | the field's refusal line | nothing read further; nothing stored |
| upload: network | `hbArtUploadFailed` under the buttons; the form keeps the picture | no row written; an uploaded file waits, and the hourly job deletes it after an hour unless the retry names it; the retry sends the same names (duplicate is ok) |
| upload: picture limit | `limitHbArt` | nothing written; files waiting for the job count until it runs (the 5 pictures of slack) |
| row write fails after the upload | today's save failures | the files are deleted by the hourly job after an hour unless a retry names them |
| the row names a file that is gone (another tab removed the picture from every item meanwhile) | `hbArtGone` under the field | the row is not written (`homebrew: art missing`); the form keeps every other edit; the author chooses the picture again |
| another tab saved the item meanwhile | today's conflict banner; «Сохранить мою версию» uploads again (ok) | the row is read again; the file the row stopped naming is deleted by the database |
| another tab or device deleted the item | today's deleted banner; «Сохранить как новый» with a new file in the form uploads it; with the item's saved picture in the form the save is refused with `hbArtGone` (the delete removed its file), and the author chooses the file again | the deleted item's file went with it; the other edits stay in the form |
| a save names a file the database is deleting (another tab removed it from its last item, two writes at the same time, or the job queued an old orphan that a retry names) | none, or `hbArtGone` when the form holds no blob | the lock per name orders the two writes; a released name is refused (`homebrew_art_released`); with the blob in the form, the save re-names and re-uploads (3.5); no saved item names a deleted file |
| a delete request fails (Storage down, the key revoked) | nothing shown | the file stays; the hourly job asks again; the usage report warns after 3 hours |
| the Vault key is missing on a project | nothing shown | no file is deleted; account deletion still succeeds; the usage report warns "no storage key"; the next run after the owner sets it deletes the backlog (2000 a run) |
| an account deletion | today's page and toast | rows deleted; the files within a minute (two hours on a failed request) |
| `#/h/` or a list reads an answer with `img` in a stale tab (previous bundle) | the item without its picture | none; a reload draws it |
| revert: previous frontend | own items draw no picture; it writes no `art` (it does not know the column) | rows and files kept; files of rows deleted meanwhile are still deleted by the database |
| revert: down migration | no pictures | `art` dropped (a plan-review trigger); the files stay in the bucket |
| a down migration, then an up (a forward fix) | no pictures | every file becomes an orphan and the job deletes 2000 an hour; recovery before the up: restore `art` from the last backup taken before the down, or delete `dhloot_storage_key` (3.9) |
| a failed `pg_net` call inside a write (no function, another signature, no privilege) | nothing shown; the write succeeds | `art_delete` answers null with a warning; the file waits for the job; the watch warns after 3 hours |
| the backup step fails | the nightly run is red (GitHub's email) | the database dump of the same run is kept as today |
| a reader's «Сохранить себе» copy fails | the toast appends `copyArtFailed` | the copy exists without a picture; the reader may choose one |

## 6. Consistency and RU/EN parity

Rules of `FEATURES.md` "Consistency rules" followed: 2 (`hbArtUploadFailed`
and `hbArtGone` follow the editor's own save-failure form, a sibling
departure already in the editor; the account deletion keeps
`accountFailed`), 3 (no new delete confirm: removing a picture is part of
the form until «Сохранить»), 5 (no new toast but `copyArtFailed` appended to
R7h's saved toast), 6 (the dialog's decoding state uses `LoadState`), 11
(the dialog's «Отмена» discards the crop; «Готово» keeps it), 13 (no text
field), 14, 15 (a visible label «Картинка», the line under it states format,
size and the save effect; «Масштаб» labelled; no «?»: the field explains
itself, and rule 15(c) as R7h amends it gives a «?» only for what the site
does), 16. Siblings: the picture box, its fallback and its sizes equal the
catalog's on every surface, the reader's `#/h/` and the author's
`#/i/<key>` included; «Обрезать картинку» is the app's first crop control
(no sibling). RU/EN: every key of 3.11 in both languages, the same facts,
`%n` in both, ASCII punctuation, «ёлочки» in RU and straight quotes in EN.

## 7. Batches, gates, cost, review, split criterion

| Cut | Criterion |
|---|---|
| R9 \| R8 | the owner's order |
| `B8.1` \| `B8.2` | the schema batch rule (a bucket, a policy and definer functions stop for the plan review, the test push and `npm run e2e` before a screen uploads); a commit the harness cannot reach without `B8.1` (the port, the fake) |

`B8.2` stays one batch: the field, the dialog, the save flow and every
surface share `artSrc`, the media port and the seeded pictures; the goldens
re-seed once.

Costs: `context.md`, "Command costs".

| Batch | Goal and scope | Gates (minutes) | Review |
|---|---|---|---|
| `B8.1` | 3.1-3.4 (no media port), 3.6, 3.8's backup, 3.9, layer 3, contract case Q, the usage watch, a decision file | step 1 probe 3 (with the local upload and the key-header probe; the first pull of the `storage-api` image, 3-5 min, falls here, not in `check:db`), `check:db` 10, `check` 9, `build:test` + `check:built` 2; after the approve: `db:push --project test` 1, `e2e` 3 = 28 (33 the first time) | plan review before; batch review required (a storage policy, definer functions, file deletion, a new write protocol) |
| `B8.2` | 3.5, 3.7, 3.8's exports, 3.10, 3.11, D60, the R11 line, the specs | `check` x2 18, `check:built` 2, `app/states` 6, `app/contracts` 8, `app/print` 4, goldens compare 13 + re-seed 3, `sweep.js 360` 8, `e2e` 3 = 65 | required (new screens, a new write path, privacy text) |

R8 total: about 93 minutes of local gates (98 the first time) plus a
10-minute closeout and the owner's steps of 9.2. CI's `db` job starts
`storage-api` from B8.1 on (the shared `LOCAL_STACK_EXCLUDES`): one more
image pull and about a minute more per run. Against the 2026-10-02
plan: no Edge Function, no CI deploy step, no hook change, no wrapper, no
access token. Bundle: about +12 kB (the field, the dialog, the port,
`lib/art.ts`; storage-js is already in the account chunk); the dialog and
the encoder load as a lazy chunk on the first «Выбрать файл» (the chunk
still counts). Each batch raises the passed budget to the measured size
plus about 5 kB.

### 7.3 `B8.1` - storage, schema, the database's file deletion, ports, backup (implement-ready)

Objective: everything the plan review must see before a screen uploads:
the bucket and its insert policy, the `art` column and its owner check, the
file deletion in the database, `img` in the three read functions, the usage
watch, the homebrew port's art calls, the fake, contract case Q, layer 3
and the backup copy.

In scope: 3.1-3.4, 3.6, 3.8's backup, 3.9, the decision file. Out of scope:
every screen and string, `MediaPort`, `Env.media` and `cropRect` (`B8.2`,
their first caller), the seed (`fake-cloud-seed.ts`) and every golden
(`B8.2`, with its goldens), the export change (`B8.2`), privacy text
(`B8.2`).

Files:
- new `supabase/migrations/<ts>_homebrew_art.sql`,
  `supabase/reversals/<ts>_homebrew_art.sql`,
  `tests/db/homebrew-art.test.mjs`, `app/src/lib/art.ts` and
  `art.test.ts`,
  `tools/supabase/backup-art.mjs` and `backup-art.test.mjs`,
  `docs/decisions/<date>-own-pictures-are-random-named-files-the-database-deletes.md`
- edit `tools/supabase/lib.mjs` (`LOCAL_STACK_EXCLUDES` loses
  `storage-api`; its comment names the reason) and `lib.test.mjs` if it pins
  the list; `tests/db/lifecycle.test.mjs` (the files block),
  `tests/db/usage.test.mjs`, `tools/supabase/usage.mjs` and
  `usage-lib.mjs` (3.6's watch), `usage-lib.test.mjs`;
  `tests/db/homebrew-links.test.mjs` (R7h's, only where it pins an answer's
  keys); `app/src/lib/desc.ts` and its test, `app/src/lib/homebrew.ts`
  (`recordOf`, `snapshotOf`) and its test; `app/src/ports/types.ts`,
  `supabase.ts`, `supabase.test.ts`,
  `fake-cloud.ts`, `fake-cloud.test.ts`, `lazy-cloud.ts`,
  `cloud.contract.ts`; `tests/e2e/contract.mjs` (case Q) and
  `tests/e2e/admin.mjs` (a helper that polls a public address);
  `tests/db/reversibility.test.mjs` and `tests/db/roles.mjs` (the snapshot
  holds this project's policies on `storage.objects`, as it does for
  `realtime.messages`); `tests/db/restore-prod.test.mjs` (3.8's restore
  case);
  `.github/workflows/backup.yml`; `tools/supabase/restore-drill.mjs` and its
  test; `package.json` (`backup-art.test.mjs` on the `check` script's
  `node --test` line beside `tools/supabase/lib.test.mjs`);
  `.claude/README.md` ("Supabase configuration": the bucket, `pg_net`, the
  two Vault secrets and the owner's SQL, step 1's findings; "Backups and
  restore": the art tar, its weekly cadence, its restore, and the sentence
  that the restore depends on `restore-prod.mjs`'s order (3.8); the "To undo
  `<ts>_homebrew_art`" note with the down-then-up recovery (3.9); a
  runbook step "Remove a reported picture": in the SQL editor, `update
  public.homebrew_items set art = null where art = '<p/ name>'`, and the
  release trigger deletes the file);
  `docs/specs/META.md` section 3; `docs/specs/CONTRACTS.md` (the `#/s/`
  projection sentence R7h writes: a homebrew entry may carry `img`, an own
  picture's name); `docs/specs/COVERAGE.md`; then `node tools/decisions.js`.

Steps:
0. Refresh 3.0 against the tree. Stop and report if `get_homebrew_item`,
   `get_homebrew_items` or `lifecycle_cleanup()` is missing or answers a
   different shape.
1. Probe the local stack (PowerShell tool), with `'storage-api'` removed
   from `LOCAL_STACK_EXCLUDES`: `npx supabase db reset --local` with a
   scratch migration holding the extension statement of 3.1 and the bucket
   insert and the planned insert policy. Then read, with the local stack's
   database:
   - `select extversion from pg_extension where extname = 'pg_net'` and
     `select pg_get_function_arguments(p.oid) from pg_proc p join
     pg_namespace n on n.oid = p.pronamespace where n.nspname = 'net' and
     p.proname = 'http_delete'` (the version and the signature, beside the
     owner's hosted reads of 9.2);
   - `has_function_privilege('postgres', '<that signature>', 'execute')`
     and `has_table_privilege('postgres', 'vault.decrypted_secrets',
     'select')`;
   - `select conname from pg_constraint where conrelid =
     'storage.objects'::regclass and contype = 'f'` (expected: none to
     `auth.users`, else `delete_account()` fails while the user owns
     objects) and `select rolbypassrls from pg_roles where rolname =
     'postgres'` (expected: true, else the room, the owner check, the job
     and the backup listing read no object);
   - `select tgname from pg_trigger where tgrelid =
     'storage.objects'::regclass` (the trigger that refuses deletes from
     SQL; record its name);
   - one upload through the local Storage API (the local gateway URL, the
     member's JWT, the planned insert policy only), then the row's
     `owner_id` (expected: the member's uid) and whether the upload needed
     a select policy (3.1).
   Then the key-header probe on the test project, before the review: `node
   --env-file=.env.test.local` with a one-line `fetch` that sends `DELETE`
   to `/storage/v1/object/no-such-bucket/x` with the header `apikey:
   <E2E_SUPABASE_SECRET_KEY>` alone and prints only the status (the shape of
   the keep-alive command in `.claude/README.md`, "Usage monitoring"): 400
   or 404 means the gateway took the key; 401 or 403 means it refused it,
   and the header form of `art_delete` changes before the migration is
   written. A header change found later by case Q is a new migration and a
   second batch review.
   Record every finding in `.claude/README.md`, "Supabase configuration".
   Stop and report if `pg_net` or Vault cannot be used locally, if
   `postgres` lacks `rolbypassrls`, or if a foreign key ties
   `storage.objects` to `auth.users`: the planner revisits Q8-9. Remove the
   scratch file.
2. Write the migration of 3.1 in the table's order, then the reversal of
   3.9; the up-down-up walk must pass (the bucket insert's `on conflict`).
3. `tests/db/homebrew-art.test.mjs` (the six roles of `tests/db/roles.mjs`;
   every seed in one rolled-back transaction, as `lifecycle.test.mjs`):
   - insert into `storage.objects` as the member: a good name (ok), a name
     of the wrong shape (refused), as `anon` (refused); the room at the
     limit and one past it with an override row (the `limits:set` shape);
     the room counts only the caller's `owner_id`;
   - `art` of an own uploaded name (ok), of a name with no object (refused
     `homebrew: art missing`), of another user's object (refused), a
     catalog basename (ok), a wrong shape (the constraint); an update that
     keeps `art` does not re-check;
   - with the two Vault secrets seeded: setting `art` to null queues two
     `DELETE` requests in `net.http_request_queue` with the URL of 3.1 and
     the `apikey` header; a second item naming the same file - no request;
     deleting the item - two requests; a bulk delete of two items sharing
     one picture - at least two requests and only those names; deleting
     the user (`delete_account()`) queues every file of its items; 300
     items with pictures (3x, with a `limits:set` override) deleted in one
     transaction queue 600 requests;
   - without the secrets: the same writes succeed and queue nothing;
   - with the secrets seeded and `net.http_delete` made to fail (a revoke of
     `usage` on schema `net` from `postgres` inside the rolled-back
     transaction, or a stub): an `art` change, an item delete,
     `delete_account()` and `lifecycle_cleanup()` all succeed and queue
     nothing; `lifecycle_cleanup()`'s request, notice and share rows are
     still deleted;
   - released names: a write that names a name in `homebrew_art_released`
     is refused (`homebrew: art missing`); the release and the job upsert
     the names they queue; the job deletes released rows older than a day;
     a two-connection case (two `postgres` connections, the
     `lifecycle.test.mjs` style): connection A removes picture X from its
     last item and holds its transaction; connection B names X on another
     item and blocks on the lock; A commits; B is refused - and the reverse
     order: B names X first and holds; A's release blocks, then sees B's row
     and records no release (this case must commit: it seeds no Vault
     secret, so nothing is sent, and it deletes its rows at the end);
   - `lifecycle_cleanup()`: an unnamed object 61 minutes old is queued, 59
     minutes old is not, a named one is not, an object whose name fails
     `homebrew_art_name_ok` (`.emptyFolderPlaceholder`) is not selected and
     not counted by the watch, the answer's `files` matches; 2001 unnamed
     objects queue 2000;
   - `has_table_privilege` is false for `anon`, `authenticated` and
     `service_role` on `vault.decrypted_secrets`, `vault.secrets`,
     `net.http_request_queue` and `homebrew_art_released`;
     `supabase/config.toml` `[api] schemas` holds no `net` (a check in the
     same file);
   - `reversibility.test.mjs`: the up-down-up snapshot includes the
     policies on `storage.objects`;
   - the three read functions carry `img` beside the item for an item with
     a picture, and no `img` key without one; `get_homebrew_item`'s
     `revision` differs after an `art` change;
   - an `art` change of an item that another owner's list links leaves one
     `changed` notice there (R7h's trigger);
   - `has_function_privilege` is false for `anon`, `authenticated` and
     `service_role` on `art_delete` and both trigger functions, and for
     `anon` on `homebrew_art_room` and `homebrew_art_name_ok`;
     `harness.test.mjs`'s list of functions `anon` executes is unchanged.
   If inserting into `storage.objects` from SQL is refused, the upload
   cases go through the Storage API at the local Kong URL with the role's
   JWT, and the queue cases seed objects as `postgres`.
4. The usage watch (3.6) with `usage-lib.test.mjs` cases (0 and 3 overdue
   files; the key missing with and without objects) and a seeded overdue
   object in `usage.test.mjs`.
5. `npm run check:db` (PowerShell tool).
6. `lib/art.ts` and `artSrc` (3.2) with unit tests (both sizes of an own
   name, a `blob:` URL, a basename unchanged, `newArtName`).
7. (Moved to B8.2: `MediaPort`, `Env.media`, `cropRect`.)
8. The homebrew port (3.3); `supabase.test.ts` for each call's request and
   error mapping (duplicate ok, RLS refusal `limit`, `homebrew: art
   missing` `artGone`, network); `recordOf` and `snapshotOf` with tests.
9. The fake (3.3) and contract case Q in `cloud.contract.ts`; the real case
   in `tests/e2e/contract.mjs` with the polling helper.
10. `backup-art.mjs` with `node:test` over a stubbed connection and fetch
    (the list, a 404 skipped, a 500 failing, at most 8 requests in flight,
    names that fail `homebrew_art_name_ok` skipped, and the per-run figures
    of section 4: the bytes and the request count it prints for a stubbed
    bucket of 210 and of 10 000 files); the `backup.yml` step on Q8-10's
    cadence with its dispatch input; the drill's check and its test; the
    `restore-prod.test.mjs` case (with the two Vault secrets seeded, a
    restore that loads an item with `art` queues no request and refuses
    nothing); the runbook lines.
11. `META.md` section 3 (pictures are public files of one bucket under
    random names; ownership is the object's `owner_id`; the database
    deletes a file when no item names it, and the hourly job deletes the
    rest; `anon` still executes four functions), `CONTRACTS.md`,
    `COVERAGE.md`, the decision file (context: decisions 39 and 40 of the
    roadmap, the lifecycle law, R7h's forbidden keys; decision: random
    names `p/` and `t/`, ownership by `owner_id`, the stored name not a
    URL, deletion by the database through `pg_net` and Vault, a lock per
    name and the list of released names, a failed delete never refusing a
    write, the room derived from the item limit, the weekly picture copy
    (Q8-10); rejected: the `delete-account` Edge
    Function (Q8-9), deletion by the browser (the lifecycle law), a nightly
    workflow sweep (daily; GitHub stops an idle schedule), content-hash
    names in a folder per account (the account id in every answer) or in
    one namespace (pre-upload poisoning), absolute URLs (host-bound rows),
    a separate limit row (Q8-4)), then `node tools/decisions.js`.
12. `rtk npm run check` (Bash, timeout 600000), `npm run build:test`, `npm
    run check:built`; commit (the task's first commit, `feat(db): store
    homebrew pictures and delete unnamed files in the database`). After the
    batch review approves and the owner's step 1 (9.2) is done: `npm run
    db:push -- --project test`, then `npm run e2e`.

Acceptance:
- `check:db` green with `tests/db/homebrew-art.test.mjs`; the reversal walk
  passes; every case of step 3 holds.
- Step 1's findings are in `.claude/README.md`: the local `pg_net`
  version and signature, the two privileges, no foreign key from
  `storage.objects` to `auth.users`, `rolbypassrls`, the delete trigger's
  name, the upload's `owner_id` and select-policy answer, and the
  key-header probe's status.
- A failed `pg_net` call refuses no write and stops no part of
  `lifecycle_cleanup()` (step 3).
- No item can name a released name; the two-connection case passes.
- Contract case Q passes over the fake and on the test project, the
  account-deletion half included (the address answers 400 or 404 within
  30 s).
- `artSrc` answers the same as today for every catalog basename (the
  existing tests unchanged).
- `snapshotOf` writes no `img`: `import-v1` and `import-v2` fixtures
  unchanged, `tests/contracts.js` green.
- The usage report's `lifecycle` row warns on an overdue file and on a
  missing key with files present.
- The backup step's script passes its tests; the workflow change is read by
  the reviewer (it runs only on `main`, after the release push).
- The decision file and `docs/DECISIONS.md`.
- No code in `app/src` deletes or lists a file of the bucket (`git grep -n
  -E "\.remove\(|\.list\(" -- app/src` names no storage call).
- Standing checks:
  1. Scale: no screen. The room at the limit, one past it and at 3x (step
     3); 600 requests in one transaction for 300 items; 2000 names per job
     run; the orphan select reads `storage.objects` by `bucket_id` (its
     existing index) with a `not exists` on the partial index
     `homebrew_items_art` - at 3x and 150 accounts about 92 000 objects and
     45 000 items. Measured locally in step 3 with `homebrew_items` seeded
     at the 3x population (45 000 rows in the rolled-back transaction): one
     job run and one account deletion of 300 items, both recorded in the
     handoff; the target is under 1 s each.
  2. Error scenarios: section 5's rows "upload: picture limit", "the row
     names a file that is gone", "a save names a file the database is
     deleting", "a delete request fails", "a failed `pg_net` call inside a
     write", "the Vault key is missing", "an account deletion", "stale
     tab", "revert: down migration" each have a test (layer 3 or unit); no
     path deletes a file an item names; the restore queues nothing (step
     10).
  3. Consistency: not applicable - no screen, no string.
  4. RU/EN parity: not applicable - no string.

Verification commands: step 1's probe, `npm run check:db` (PowerShell),
`rtk npm run check`, `npm run build:test`, `npm run check:built`; after the
approve `npm run db:push -- --project test`, `npm run e2e`.

Do not: deploy to production (CI's `migrate-prod` does at the release
push); print or log the Vault key or put it in a migration; add a
dependency for image work; give `anon` a storage policy; store an absolute
URL; delete a file from the browser; delete `storage.objects` rows from
SQL.

### 7.4 `B8.2` - the screens (outline)

Files (expected): new `ArtField.svelte`, `CropDialog.svelte` (lazy chunk
with the encode step) and tests, `app/src/ports/media.ts` and its test fake
(3.3, moved from B8.1); edit `app/src/ports/index.ts` (`Env.media`),
`lib/art.ts` (`cropRect`, the size constants) and `art.test.ts`,
`HomebrewEditor.svelte`,
`ItemPicker.svelte` (a filter for items with a picture),
`state/homebrew.svelte.ts` (the save flow, `artGone`), the R7h «Сохранить
себе» path (the copy), `AccountPage.svelte` (the zip hint), `lib/dict.ts`,
`a11y.test.ts`, `fake-cloud-seed.ts` (gm1's bedroll takes a catalog picture
so goldens draw it; gm1's «Настой кузнеца» an own name whose file the fake
does not hold, so a golden draws the placeholder), `tests/app/inventory.js`
and the goldens it names, `tests/app/print.js`, `tests/e2e/flows.mjs` (upload
a picture, open the item signed out at `#/h/<uuid>`, copy-image, a list of a
throwaway user links it, «Сохранить себе» as the throwaway copies it, delete
the throwaway's account; the member's item keeps its picture at the end, the
next run's start removes it), `docs/specs/FEATURES.md` ("Records",
"Homebrew", "Print", "Account and browser lists"), `STATE.md` (the form's
picture in memory), `COVERAGE.md`, `DEBT.md` (D60), both privacy pages.

Acceptance lines (each its own line at the batch's close):
- The field and the crop dialog (3.5) with every refusal, both encoders, the
  keyboard and pointer paths, `hbArtGone`.
- `MediaPort` with its fake and `Env.media`; `cropRect` at both
  orientations and every zoom end (moved from B8.1, plan-B8.1-15).
- The save flow: the upload, the row write, the retry with the same names;
  on `artGone` with the blob in the form, a new name and a second upload
  without asking (plan-B8.1-2); the browser deletes nothing.
- «Выбрать из предметов» over catalog and own pictures (Q8-3 B).
- The picture on every surface of 3.7: the Items tab, `#/h/<uuid>` for the
  author and a reader, a live list row of another account's item, `#/s/`,
  the three print routes; a missing file draws the placeholder.
- «Сохранить себе» copies the author's file (Q8-6 A) and reports a failed
  copy; the same after R9's sign-in path.
- Exports carry no `img`; `import-v1` / `import-v2` fixtures unchanged; the
  zip hint (Q8-7 A).
- Privacy pages (3.10), both languages.
- `DEBT.md` D60: storage-js is called now; the entry narrows to functions-js
  (1.5 kB) and its fix to `AuthClient`, `PostgrestClient`,
  `RealtimeClient` and `StorageClient`.
- The R11 line: after the E2E run, the usage report run against the test
  project (`.claude/README.md`, "Usage monitoring") shows a non-zero
  `storage_bytes`; the handoff records the figure.
- R9's print goldens with a picture re-seeded (R9 plan section 10).
- Every state of section 4 and scenario of section 5 that B8.2 adds: its
  proof named in the handoff.

## 8. Specs and contracts per batch

| Batch | Specs | Contracts | Tests |
|---|---|---|---|
| `B8.1` | `META.md` 3, `COVERAGE.md`, `CONTRACTS.md` (one sentence on the `#/s/` projection), `.claude/README.md` ("Supabase configuration", "Backups and restore", "To undo"), a decision file | no route or fixture change; files unchanged | layer 3 new file, lifecycle, usage; layer 1 art, desc, homebrew, ports, contract case Q; layer 4 case Q |
| `B8.2` | `FEATURES.md`, `STATE.md`, `COVERAGE.md`, `DEBT.md`, privacy pages | none (Q8-7 A keeps both file formats) | layer 1 components, states, bundle; layer 2 states, goldens, print, sweep 360; layer 4 a flow |

## 9. Owner questions

### 9.0 Owner answers and their status

Owner, chat, 2026-10-07 (recorded as the orchestrator relayed them):
- **Q8-9: A.** "The database deletes picture files (a trigger plus the
  hourly job, pg_net with a key in Vault, no Edge Function). This reverses
  the earlier Q8-1 B."
- **Q8-10: a.** "A weekly full copy, 8 downloads at a time, with a manual
  run any night."

Answers of 2026-10-02:
- Q8-1 B (the `delete-account` Edge Function, deployed by CI with two
  project-scoped tokens): reversed by Q8-9 A (2026-10-07).
- Q8-2 A (WebP, JPEG where WebP does not encode), Q8-3 B (a file or any
  catalog or own item's picture), Q8-4 (200 KB; item limit + 5 pictures),
  Q8-6 A (copy the file for a saved copy), Q8-7 A (no picture in files):
  stand.
- Q8-8 A (the backup copies the bucket): stands; its cadence is Q8-10 a
  (weekly, 2026-10-07).
- Q8-5 (a frozen copy whose picture is gone): no subject after R7h.

### 9.1 Q8-9 Who deletes picture files (answered: A, owner 2026-10-07)

R7h `B7h.1` records the law: data with a lifecycle is deleted on the
backend on a schedule, never by the client, and chose `pg_cron` over a
scheduled Edge Function. A file that no item names is such data. The
2026-10-02 design let the browser delete old files and the Edge Function
delete an account's files. Supabase deletes a file only through the Storage
API (a delete of `storage.objects` from SQL leaves the file).

| Option | For | Against |
|---|---|---|
| **A. The database: a trigger on the item asks the Storage API to delete the file at the row change, and the hourly job deletes what is left; no Edge Function (recommended)** | one rule in SQL that the migrations deploy; account deletion stays today's one call and never fails because of files; files go within a minute; no Deno code, no deploy route, no hook change, no access token; the job and its watch exist | two extensions in use (`pg_net` beside `pg_cron`); a secret key in each project's Vault, readable by the `postgres` role (owner step) |
| B. A, plus the `delete-account` Edge Function for the account (the 2026-10-02 design for that part) | the account deletion deletes the files before the account and reports a failure | everything of A, plus the function, its CI deploy, the agent wrapper, a hook rule and the two tokens; two paths delete an account's files |
| C. A nightly workflow step deletes unnamed files with the secret key from the Environment | no `pg_net`, no Vault | daily: a removed picture and a deleted account's pictures stay reachable for up to a day; GitHub stops an idle schedule after 60 days; the law prefers the database job |

Reason for A: it applies the law in the place R7h chose, and it is the
smallest design that deletes files at once. Trade-off accepted: a secret
key in the database's Vault (the holders of the production connection
string can read it) and one more extension. With A, the two access tokens
of 2026-10-02 have no use (owner step 3 revokes them).

Decided here (recorded, no question): the name is random and holds no
account id (2.2); the name is the stored value, not a URL (3.2); upload at
the save, not at the choice; `img` beside the item in each answer (3.4);
the deletion hint stays general (2.2); the backup reads public addresses
(3.8); the crop is square only.

### 9.2 Owner steps (one-time, in this order; with Q8-9 A)

1. Before `B8.1` starts (the four reads below, which its reversal needs)
   and before its test push (the secrets): in the test project
   (`rdjxcjkhsklhprmzxajq`), create a secret key for this use only
   (Dashboard, Project Settings, API Keys, "Create new secret key", named
   `pg_net file cleanup`). In the SQL editor run, with the values filled
   in: `select vault.create_secret('https://rdjxcjkhsklhprmzxajq.supabase.co',
   'dhloot_api_url');` and `select vault.create_secret('<the new secret
   key>', 'dhloot_storage_key');`. Expected: two rows in `select name from
   vault.secrets`. The key never goes into the repository or a chat.
   In the same SQL editor, read and send the planner the four answers
   (read-only; they hold no secret):
   - `select extversion from pg_extension where extname = 'pg_net';` -
     whether `pg_net` is already installed, and its version (if installed,
     the reversal keeps the extension, 3.9);
   - `select default_version from pg_available_extensions where name =
     'pg_net';` - the version the migration installs;
   - `select rolbypassrls from pg_roles where rolname = 'postgres';` -
     expected `true`;
   - `select conname from pg_constraint where conrelid =
     'storage.objects'::regclass and contype = 'f';` - expected: no
     constraint that names `auth.users`.
   An answer other than the expected one stops `B8.1` before its test push
   (the planner revisits 3.1).
2. Before the release push: the same on production (`zzmrftmzefcqehhyztjq`,
   its own new secret key), with the same four reads.
3. Any time: revoke the two access tokens of 2026-10-02
   (`dhloot-functions-test`, `dhloot-functions-prod`; Account, Access
   Tokens), delete the repository secret `SUPABASE_ACCESS_TOKEN_TEST`, the
   Environment `production` secret `SUPABASE_ACCESS_TOKEN`, the
   `SUPABASE_ACCESS_TOKEN` line of `.env.test.local`, and
   `SUPABASE_SECRET_KEY_PROD` if it was added. Nothing reads them.
4. After the release push: dispatch the backup once with the picture copy
   and check the artifact: `gh workflow run backup.yml --ref main -f
   art=true`, then `gh run download <run id> --dir <dir>`; expected:
   `schema.sql.age`, `data.sql.age` and `art.tar.age`.
5. At the release closeout: delete an account that has a picture from
   `#/account` on a device and open the picture's address: expected 400 or
   404 within a minute (the E2E covers the test project).

### 9.3 Q8-10 How often the backup copies the pictures (answered: a, owner 2026-10-07)

Section 3.8 downloads every file of the bucket through the public
addresses. The free plan gives 5 GB uncached plus 5 GB cached egress a
month, and the usage report cannot see egress. Q8-8 A (2026-10-02) was
answered without these figures (section 4's egress table).

| Option | For | Against |
|---|---|---|
| **a. A weekly full copy on one night, 8 downloads at a time, a dispatch input for any night (recommended)** | about 4.3 times the bucket a month (0.73 GB at 170 MB, 4.3 GB at the 1 GB storage limit); fits the job's 20 minutes at 3x; a full, self-contained copy each week | a restore loses up to 7 days of new pictures; the items restored from the nightly dump then name files that are not in the tar and draw the placeholder until the author chooses them again |
| b. The nightly full copy, with a usage warning when `storage_bytes` passes 150 MB | a restore loses at most one day of pictures | 30 times the bucket a month: 170 MB uses the whole 5 GB uncached allowance, 1 GB uses 30 GB; the warning comes before that, but then the owner must choose again |
| c. A nightly copy of new names only, with the files kept in a GitHub Actions cache between runs | the smallest egress (each file once); a restore loses at most a day | a deleted picture stays in the cache until the next run prunes it, so the privacy text must say so; the cache is a second store of personal files outside the encrypted artifact, evicted after 7 days without use or above 10 GB per repository; more code in `backup-art.mjs` |

Reason for a: it keeps the egress well inside the free allowance up to the
storage limit, with no new store and no new privacy text. Trade-off
accepted: up to a week of new pictures lost in a disaster restore.

## 10. Risks, assumptions, deferred

- Assumption: `pg_net` and Vault are usable by `postgres` on both hosted
  projects (step 1 reads the local privileges; the owner's reads of 9.2
  give the hosted versions; B8.1's test push proves the test project
  before production; a failure on production refuses no write, 3.1).
- Assumption: Storage sets `storage.objects.owner_id` from the session on
  an upload, and the gateway takes a secret key in the `apikey` header for
  a Storage `DELETE` (step 1 and case Q prove both).
- Risk: storage policies created by a migration need the `postgres` role to
  own policies on `storage.objects`; the test push proves it.
- Risk: a file restored from the backup has no `owner_id` (the CLI uploads
  with the service role); an item restored with its row keeps naming it,
  but no other item can newly name it (the owner check). Accepted; the
  runbook says so.
- Risk: the free plan's 1 GB storage and 5 GB egress; the nightly usage
  report already forecasts storage, and a year of browser cache keeps
  readers' egress low. At the defaults an account holds at most about 22 MB
  (105 x (200 + 8) KB). The backup's own egress is the larger part: a full
  copy downloads the whole bucket, so a nightly copy costs 30 times the
  bucket a month (the whole 5 GB at 170 MB) and the weekly copy of Q8-10 a
  about 4.3 times (4.3 GB at the 1 GB storage limit); section 4's table has
  the figures. The usage report cannot see egress; the owner's monthly
  dashboard look stays the check.
- Assumption: a delete makes the public address answer 400 or 404 within
  30 s, also after a read through the CDN (uploads carry `cacheControl`
  one year; on a plan without Smart CDN a cached object can stay readable
  up to its cache age). Case Q's real run reads the address (200) before
  the delete and then polls. On failure: uploads use a shorter
  `cacheControl` (3600), and the privacy text says "within an hour"
  (3.10), both languages.
- Assumption: Supabase answers public objects with CORS `*` (B8.2's E2E
  flow verifies copy-image; the text fallback covers a refusal).
- Deferred (to the owner, not `DEBT.md`): a picture for sources and cards;
  pictures in the data zip (Q8-7 B); a WebP encoder for Safari (Q8-2 B).
- The roadmap rows of R8 (`issues/persistent-storage/plan.md` sections 5,
  12, 14, 16 decisions 39 and 40) still describe the Edge Function and
  `art_url`; the orchestrator updates them at R8's closeout.

## 11. Mocks

`issues/persist-8-media/mocks/index.html`:

| Mock | Screen and states |
|---|---|
| `m40-editor-picture-field.html` | the field: none, chosen (unsaved, the preview card), saved; refusals; uploading, network, limit; desktop and 360 px (unchanged) |
| `m41-crop-dialog.html` | the dialog on desktop and 360 px, decoding, the squeeze failure (unchanged) |
| `m42-picture-from-an-item.html` | Q8-3 B: the picker over catalog and own pictures (unchanged) |
| `m46-live-surfaces.html` | the Items tab rows, `#/h/<uuid>` as a reader, gm2's list linking gm1's item with the change-log notice, «Сохранить себе» toasts with `copyArtFailed` (replaces m43) |
| `m47-print-routes-with-pictures.html` | `#/print/s/<token>/<ids>` colour sheet, `#/print/h/<uuid>` with a missing file (extends m44) |
| `m48-account-files-and-texts.html` | Q8-9 A and B account pages, the zip hint, `hbArtGone`, the privacy paragraph RU and EN (replaces m45) |
| `m43`-`m45` | the 2026-10-02 design, superseded in part; kept for Q8-9 B |
