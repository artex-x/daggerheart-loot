# Plan - TASK persist-8-media (homebrew release R8)

## Status

- Task status: planned 2026-10-02 (planner, planning mode A); not started.
  R8 ships after R9 (owner, 2026-10-02). Refresh before dispatch: R9's
  `B9.1` and `B9.2` add `get_shared_homebrew`, `#/h/<token>`,
  `#/print/h/<token>` and «Сохранить себе», which this plan extends; check
  section 3 and the file lists against the tree after R9's closeout.
- R7h re-plan (2026-10-06; owner R1, 2026-10-03): refresh at dispatch.
  After R7h's `B7h.3` no snapshot is stored (`list_entries.snapshot` is
  dropped; a list holds live links by `hb_item`), so the
  `homebrew_snapshot_valid` row of 3.1, the frozen-copy picture of 3.5 and
  Q8-5 change: `img` reaches readers through R7h's `get_homebrew_item`,
  `get_homebrew_items` and `get_shared_list`, not R9's
  `get_shared_homebrew`; R9's `#/h/<token>` is R7h's `#/h/<uuid>`;
  «Сохранить себе» is R7h's (`B7h.4`), and Q8-6's file copy applies to it.
  Q8-7 is unchanged: the lists file v2 still writes snapshots.
- NEEDS_HUMAN_CONFIRMATION: no - the owner answered Q8-1 to Q8-8 on
  2026-10-02 (section 9): decision 40's Edge Function stays, and CI deploys it
  with two project-scoped tokens (Q8-1 B and follow-ups); Q8-4 takes the item limit + 5. The batches follow the answers.
  The owner's one-time steps (section 9.1) are no confirmations; they block
  the first test deploy and the release push.
- Plan review: required before B8.1 (trigger: a migration with a storage
  bucket, storage policies and SECURITY DEFINER functions; possible loss of
  stored data - picture files are deleted by the client and by the Edge
  Function, and the reversal drops `homebrew_items.art`; a new write protocol
  - uploads; a hook change - `bash-guard.mjs` admits the function deploy to
  the test project)
- Batches:

| Release | Task id | Batch | Status |
|---|---|---|---|
| R8 | `persist-8-media` | `B8.1` the bucket, its policies, `homebrew_items.art`, the snapshot and projection changes, the account delete rule, the `delete-account` Edge Function and its CI deploy, the agent's test deploy route, the media port, the art half of the homebrew port, the fake, contract case Q, layer 3 cases, the backup copy | implement-ready after R9's closeout, the owner's step 1 (9.1) and the plan review (7.3) |
| R8 | | `B8.2` every screen: the picture field and the crop dialog, the save flow, the picture everywhere, «Выбрать из предметов», the saved copy's picture, the account deletion, the exports, privacy, D60 | outline (7.4) |

## 1. Objective and non-goals

Objective: an author gives an own item a picture from a file (or from another
item's picture), crops it square, and the item draws it wherever the catalog
draws pictures: rows (160 px), cards, the record page, the editor preview,
print, copy-image, account lists, frozen copies, share pages and R9's item
page. Deleting the account deletes the pictures. Roadmap: section 5 row R8,
section 14 `B8.1`, decisions 39 and 40.

Non-goals: pictures for sources, sets or rule cards; more than one picture
per item; pictures in the lists or homebrew files and the data zip (Q8-7);
server-side resizing (`imgproxy` stays off); a picture library page; an
image editor beyond the square crop; a WebAssembly WebP encoder (Q8-2).

## 2. What the tree holds today (2026-10-02)

- No bucket; `LOCAL_STACK_EXCLUDES` leaves `storage-api` and `edge-runtime`
  out of the local stack and of CI's `db` job; `tests/db/usage.test.mjs`
  tolerates a missing `storage.objects`.
- Own items have no `img`; every own row draws `img/thumb/_none.webp`.
  `artSrc(img, broken, size)` maps a catalog basename to `img/` or
  `img/thumb/`; a failed picture is remembered per record for the session.
- `homebrew_snapshot_valid` closes a snapshot's keys (`id`, `src`, `book`,
  `cards` stripped, then `homebrew_content_valid`), so an `img` is refused
  today; the client's `snapshotValid` mirrors it. `import-v2.json`'s
  snapshot and `homebrew-v1.json`'s item are closed and hold no `img`.
- `AuthPort.deleteAccount()` calls `delete_account()` (deletes `auth.users`,
  rows cascade). Storage objects have no foreign key to `auth.users`: a
  deleted user's files would stay.
- `usage.mjs` already sums every object of `storage.objects`; the R11 line
  only needs a proof on the test project.
- `backup.yml` dumps `auth` and `public` rows; decision 39 owes the bucket.
- D60 says storage-js and functions-js are shipped and never called. R8
  calls both (uploads, and `functions.invoke('delete-account')`), so D60's
  premise ends; B8.2 deletes the entry.
- No Edge Function exists; `supabase/functions/` is empty; `bash-guard.mjs`
  rule 2n denies `supabase functions deploy` to agents; CI deploys migrations
  only (`migrate-test` in `e2e`, `migrate-prod` before `deploy`).

## 3. Design

### 3.1 Storage and schema (migration `<ts>_homebrew_art.sql`, after R9's)

| Object | Shape |
|---|---|
| bucket | `insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('homebrew-art', 'homebrew-art', true, 204800, array['image/webp', 'image/jpeg'])` (JPEG: Q8-2 A) |
| names | `<uid>/<sha256 of the 640 file, 64 hex>.<webp\|jpg>` and `<uid>/thumb/<same>.<ext>`: the same bytes always get the same name, so a retry rewrites nothing and the browser may cache a year |
| `homebrew_art_room() returns boolean` | security definer, stable, `search_path = public, pg_temp`: true when the caller's item limit is null, else when the caller's folder holds fewer than `2 * (effective_limit(auth.uid(), 'homebrew_items_per_owner') + 5)` objects (a 640 and a 160 file per picture; 5 pictures of slack for a replace that uploads before the old file goes, and a few leftovers). Q8-4 |
| `homebrew_art_name_ok(p_name text) returns boolean` | immutable: `p_name ~ ('^' \|\| auth.uid() \|\| '/(thumb/)?[0-9a-f]{64}\.(webp\|jpg)$')` (written as a stable function, it reads `auth.uid()`) |
| policies on `storage.objects`, `to authenticated` | insert `with check (bucket_id = 'homebrew-art' and homebrew_art_name_ok(name) and homebrew_art_room())`; select and delete `using (bucket_id = 'homebrew-art' and (storage.foldername(name))[1] = (select auth.uid())::text)`; no update policy (a name never changes). Public reads go through the public object URL, which needs no policy |
| `homebrew_items.art text` | `check (art is null or art ~ ('^' \|\| owner_id \|\| '/[0-9a-f]{64}\.(webp\|jpg)$') or art ~ '^[A-Za-z0-9_-]+\.webp$')`: the author's own file, or (Q8-3 B) a catalog picture's basename |
| `homebrew_snapshot_valid` | `create or replace`: an `img` is a string of either shape with any uuid; it is stripped before `homebrew_content_valid`, as `book` and `cards` are |
| projections | `get_shared_list(text)` and R9's `get_shared_homebrew(text)` pass `i.content \|\| case when i.art is null then '{}' else jsonb_build_object('img', i.art) end` to `homebrew_snapshot_of`, which copies every content key, so `img` reaches the record with no signature change |
| `delete_account()` | `create or replace`: `P0001 'delete_account: pictures remain'` while `storage.objects` holds a `homebrew-art` object under the caller's folder; else as today. The app no longer calls it (3.9); the refusal stops a stale tab, or a direct call, from deleting an account and leaving its files |

Reversal: drop the three policies and two functions, `delete from
storage.objects where bucket_id = 'homebrew-art'` and the bucket row (on a
hosted project the files then stay unreferenced in its storage - an
emergency path only), drop `homebrew_items.art`, restore
`homebrew_snapshot_valid`, `get_shared_list`, `get_shared_homebrew` and
`delete_account` as the previous migrations wrote them. The reversal loses
every picture reference (a plan-review trigger, section 5).

Local stack: B8.1 step 1 runs `npx supabase db reset --local` with the
migration; if `storage.buckets` does not exist with today's excludes,
`'storage-api'` leaves `LOCAL_STACK_EXCLUDES` (`tools/supabase/lib.mjs`), and
`.claude/README.md`, "Supabase configuration", records the reason. CI's `db`
job reads the same list.

### 3.2 The picture value and `artSrc`

- A record's `img` keeps one meaning: the stored name. A catalog record and a
  catalog picture chosen for an own item hold a basename (`q1.webp`); an own
  file holds `<uid>/<hash>.<ext>`. Rows, snapshots, frozen copies and
  projections carry the same string; nothing converts it at a boundary.
- `lib/art.ts` (new, pure): `ART_BASE` = `import.meta.env.VITE_SUPABASE_URL`
  plus `/storage/v1/object/public/homebrew-art/` (an empty prefix in a build
  with no sign-in, where no own item exists), the size constants of 3.4, the
  path builders, `cropRect`, `unnamed(files, names, now)`.
- `artSrc(img, broken, size)`: a name with a `/` is an own file -
  `ART_BASE + img`, or for `thumb` `ART_BASE + <uid>/thumb/<file>`; a
  `blob:` URL (the editor's unsaved preview) passes through for both sizes;
  a basename keeps today's rule. Every call site stays as it is.
- The decision deviates from the roadmap's "absolute URL in `Record_.img`":
  rows restored from a backup into the test project, and frozen copies,
  would otherwise name the production host. Recorded in B8.1's decision file.

### 3.3 Ports

- `MediaPort` (new, `app/src/ports/media.ts`, in `Env` as `media`):
  `decode(file: Blob)` answers `{ ok: true; image }` with `width`, `height`
  and `close()`, or `{ ok: false; error: 'bad' }` (`createImageBitmap`
  rejected); `render(image, rect, side, type, quality): Promise<Blob>` (a
  canvas, `drawImage` of the source square, `toBlob`); `webp():
  Promise<boolean>` (probe once: a 1x1 `toBlob('image/webp')` whose type is
  `image/webp`); `hash(blob): Promise<string>` (SHA-256 hex); `preview(blob):
  string` and `release(url)` (object URLs). jsdom has none of these, hence a
  port; the test env gets a fake.
- `HomebrewRepository` gains: `listArt(): Promise<{ ok: true; files: { name:
  string; created_at: string }[] } | { ok: false }>` (the caller's folder and
  its `thumb/`, every page); `uploadArt(name, blob): Promise<ListWrite>`
  (`upsert: false`, `cacheControl: '31536000'`, the blob's type; a
  "duplicate" answer is `ok` because the name is the content's hash; a
  policy refusal or `413` is `limit` with key `homebrew_art`);
  `removeArt(names): Promise<ListWrite>` (at most 1000 per call);
  `copyArt(name): Promise<{ ok: true; name: string } | { ok: false }>` (the
  saved copy of R9: fetch both public files of another owner and upload them under the
  caller's folder). `ItemRow` and the create and update patches gain `art:
  string | null`.
- `AuthPort.deleteAccount()` (Q8-1 B): `functions.invoke('delete-account')`
  with the session; `2xx` is `ok`, anything else `failed`; then the port
  signs out locally as today. The fake removes its in-memory files, then the
  user.
- Contract case Q (`cloud.contract.ts`): upload under the member's folder,
  list it, a second upload of the same name answers ok, a name under another
  uuid is refused, `removeArt` empties the folder, `deleteAccount` of the
  doomed user with a file deletes the file first (the real run reads the
  public URL: 400 or 404 after it).

### 3.4 Upload flow (m40, m41)

- The editor's field «Картинка» after «Описание»: a 96 px square, then
  «Выбрать файл» (a hidden `input type=file accept="image/*"`) and «Выбрать из
  предметов» (Q8-3 B), or, with a picture, «Заменить», «Обрезать заново»
  (while the source file is in memory) and «Убрать картинку». The line under
  it (rule 15 d): the format, the size and "uploads when you save".
- Checks before the dialog: the file at most 20 MiB; decoded; the short side
  at least 160 px; the long side at most 8000 px. Each refusal draws under the
  field and reads no further.
- The crop dialog «Обрезать картинку» (native `<dialog>`): a square frame
  over the picture; drag with the pointer, arrow keys on the focused stage
  (2 % of the side, Shift 10 %), «Масштаб» a range input from "the short side
  fits" to 4x (+ and - on the stage); opens centred at the smallest zoom;
  «Готово» renders the 640 px square, then the 160 px square from it, and
  closes; «Отмена» and Escape keep the field as it was.
- Encoding: WebP at qualities 0.85, 0.75, 0.65, 0.55 until the 640 file is at
  most 204800 bytes; where `webp()` is false, JPEG at the same steps (Q8-2
  A); none fits: «Не получилось сжать картинку до 200 КБ - выберите другую.».
- The field and the preview card draw the chosen square at once from an
  object URL; nothing uploads before the save. The leave guard counts a
  chosen file, a picture chosen from items, or a removed picture as a change.
- The save: (1) with a new file - `listArt`, `removeArt` of files that no own
  item names and that are older than 10 minutes, `uploadArt` of the 640 file,
  then the 160 file; (2) the row's create or update with `art`; (3) the
  previous `art` of this item, when no own item names it now, `removeArt` of
  both files (a failure is ignored: step 1 of a later save sweeps it).
  «Загружаем картинку...» shows under the buttons while (1) runs.
- Item delete and «Удалить (N)»: after the delete answers, `removeArt` of the
  pictures no remaining own item names; a failure is ignored the same way.
- «Выбрать из предметов»: `ItemPicker` over the catalog and the own items that
  have a picture (the item itself excluded); the chosen record keeps its
  picture, and this item's `art` names the same `img`; no upload.

### 3.5 Where the picture shows (m43, m44)

Rows, the lists index strip, search, `#/tables/homebrew`, the equipment
tables: 160 px. Cards, the record page and modal, the editor preview, print
(colour), copy-image and «Отправить»: 640 px. Frozen copies carry `img` from
R8 on (the client's `snapshotOf` and `homebrew_snapshot_of` both copy it);
older copies keep none. A file the author replaced or removed answers 400 or
404, and the copy draws `_none.webp` through today's broken-picture rule
(Q8-5 A). Public objects answer with `Access-Control-Allow-Origin: *`, so
copy-image and the share sheet's file work as for a catalog picture (B8.2
verifies it in the E2E flow; if not, today's text fallback applies).

R9's surfaces: `#/h/<token>` and `#/print/h/<token>` draw the picture from
the projection's `img`; «Сохранить себе» (Q8-6 A) keeps a catalog `img`, and
for another owner's file calls `copyArt` and writes the new `art` with an
`updateItem` after the `import_homebrew` call (the import carries no `art`);
a failed copy leaves the saved copy without a picture and the toast adds
«Картинку скопировать не получилось - копия сохранена без неё.».

### 3.6 Files, account, backup

- Exports (Q8-7 A): the lists file writer drops `img` from every snapshot
  (`lib/bundle.ts`), so `import-v1`/`import-v2` stay unchanged; the homebrew
  file never held it. The «Ваши данные» hint adds «Картинок в архиве нет:
  после переноса добавьте их заново.».
- Account deletion (Q8-1 B): 3.3 and 3.9; the page's busy state is today's. The hint
  «Удаление аккаунта» reads «Аккаунт и все связанные с ним данные, картинки
  тоже, будут удалены навсегда.».
- Backup (decision 39, Q8-8 A): `backup.yml` gains a step that runs
  `node tools/supabase/backup-art.mjs` (new): it lists `homebrew-art` with
  the secret key from the Environment `production` (`SUPABASE_SECRET_KEY_PROD`,
  an owner step), downloads every object into a tar and encrypts it to
  `BACKUP_AGE_RECIPIENT` as `art.tar.age` in the same artifact.
  `restore-drill.mjs` checks that the tar decrypts and lists. The runbook
  "Backups and restore" gains the owner's file restore (`npx supabase storage
  cp -r <dir> ss:///homebrew-art --experimental`, owner only).

### 3.7 Privacy pages

`pages/src/privacy.html` and `pages/src/en/privacy.html` gain a "Pictures"
paragraph after "Share links" (EN; RU is its translation): "A picture you add
to a homebrew item is kept as a file in Supabase Storage. Its address is
public: anybody who has the address can open the picture, and every share
link that shows the item shows it. The address holds your account's internal
number, not your name or email. Copies of your item in other users' lists
show the picture until you replace or remove it. Deleting your account
deletes your pictures first. The nightly backup keeps them encrypted for at
most 30 days. The data archive holds no pictures." "Last changed" moves.

### 3.8 Strings (RU / EN)

Reused: `save`, `cancel`, `nothing` («Ничего не найдено»), the picker's
«Ещё N - уточните запрос», `accountFailed` («Не получилось. Проверьте
соединение и попробуйте ещё раз.»). New:

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
| `limitHbArt` | Не сохранено. Достигнут предел картинок: %n. Нужно больше - напишите на daggerheart.loot@gmail.com. | Not saved. The picture limit is reached: %n. Need more? Write to daggerheart.loot@gmail.com. |
| `copyArtFailed` | Картинку скопировать не получилось - копия сохранена без неё. | Could not copy the picture - the copy was saved without it. |
| `zipNoArt` | Картинок в архиве нет: после переноса добавьте их заново. | The archive holds no pictures: add them again after the move. |
| `deleteHintArt` | Аккаунт и все связанные с ним данные, картинки тоже, будут удалены навсегда. | The account and all its data, pictures included, will be deleted for ever. |

The picture limit names `limit + 5` pictures (the files over two): 105 at
the defaults.

### 3.9 The `delete-account` Edge Function and its deploy (Q8-1 B)

- Code: `supabase/functions/delete-account/index.ts` (Deno, `Deno.serve`,
  `createClient` from `npm:@supabase/supabase-js` at the version
  `package.json` pins) wires a pure handler `handler.ts`: read the bearer
  token, `auth.getUser(token)` (no user: `401`); list `<uid>/` and
  `<uid>/thumb/` of `homebrew-art` page by page and remove the names in
  chunks of 1000 (a failure: `500`, the account kept); then
  `auth.admin.deleteUser(uid)` (rows cascade as today; a failure: `500`, the
  pictures already gone, a retry finishes); `204`. The handler takes its
  client as an argument, so `node --test` covers it with a stub
  (`tests/functions/delete-account.test.mjs`, Node strips the types; added to
  the `check` script's `node --test` line). The service key comes from the
  platform's injected variable (the implementer confirms its name in the
  Supabase docs of the pinned CLI). `supabase/config.toml`
  `[functions.delete-account] verify_jwt = true`.
- CI deploy (as the migrations): in the `e2e` job, after `migrate-test` and
  before `npm run e2e`, the step `functions-test: deploy delete-account to the
  test project` runs `npm run functions:deploy -- --project test` with
  `SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN_TEST }}`, a
  repository secret holding the test-scoped token (branch runs need it, as
  `SUPABASE_DB_URL_TEST`). In the `migrate-prod` job (the one that holds the
  Environment `production`), after the `db push` step, the step
  `functions-prod: deploy delete-account to production` runs `node
  node_modules/supabase/dist/supabase.js functions deploy delete-account
  --project-ref zzmrftmzefcqehhyztjq --use-api` with
  `SUPABASE_ACCESS_TOKEN` from the Environment `production` (the
  production-scoped token); a failure stops the publish as
  a failed `db push` does. Every run deploys (idempotent, about 20-40 s);
  `--use-api` bundles on Supabase's side, so no Docker is needed (B8.1
  verifies the flag on the pinned CLI).
- The agent's route to the test project: a wrapper
  `tools/supabase/functions-deploy.mjs` with the npm script
  `functions:deploy`, the shape of `db-push.mjs`: `--project test|prod`
  resolved through `PROJECTS` in `tools/supabase/lib.mjs`, the test-scoped token
  loaded by `node --env-file-if-exists=.env.test.local` (agents never read
  the file), the target ref printed, `--project prod` only on an interactive
  terminal (the owner) or with `CI` set. `bash-guard.mjs`: `functions:deploy`
  joins `HOSTED_SCRIPTS` (allowed only with `--project test`), and rule 2r
  also denies it while `supabase/functions` has uncommitted changes or no
  approving review covers `HEAD`'s `supabase/functions` tree; selftest cases
  for each. Rule 2n keeps denying a bare `supabase functions deploy`. A
  wrapper is the right shape: one place loads the token, names the target
  and carries the review gate, as `db:push` does; opening 2n's table to
  `functions deploy --project-ref <test>` would need the token in the agent's
  environment and a second review check. The hook change is a review
  trigger (Status).
- The tokens (owner's steps 1-2, 9.1): two Supabase access tokens, each
  limited on the token screen's resource access settings to one project and
  to the Edge Functions access a deploy needs. The production-scoped token is
  `SUPABASE_ACCESS_TOKEN` in the Environment `production` (read only by
  `migrate-prod`, on `main`); the test-scoped token is the repository secret
  `SUPABASE_ACCESS_TOKEN_TEST` (read by `e2e` on every branch) and the
  `SUPABASE_ACCESS_TOKEN` line of `.env.test.local` (the agent wrapper).
  Accepted trade-off: the test-scoped token is readable by any branch's
  workflow run, as `SUPABASE_DB_URL_TEST` is; it can only deploy functions to
  the test project. A leaked production token can replace production's Edge
  Functions and nothing else. Neither token reads data or changes the
  database, Auth or Storage. The exact scope names are the token screen's;
  B8.1 step 8a records them in `.claude/README.md`, "Supabase configuration".
- Revert: the previous frontend calls `delete_account()`, which refuses while
  files remain (`accountFailed`); a reversal migration leaves the function
  deployed and harmless (it deletes nothing that is not there).

## 4. Scale (States table, B8.2)

Limits: own items 100 (3x 300); pictures per account item limit + 5 (105;
3x: 305); a 640 file 204800 bytes (a bucket constant, no 3x row); input 20 MiB,
sides 160-8000 px (validator constants).

| State | Screen | Proof |
|---|---|---|
| no picture / one / chosen unsaved / saved | m40 | unit `artField.test.ts`; goldens `#/homebrew/<axe> as gm1` (saved, seeded with a catalog picture) |
| 300 own items with pictures (3x) on `#/homebrew` | rows lazy-load 160 px files (about 8 KB each, cached a year) | R7h's 300-item measurement re-run with pictures; figures in the handoff |
| the picture limit and one past it | m40 limit line; nothing written | unit (fake at the room), layer 3 room case |
| the longest name with a picture at 360 px | the card's picture box is square, the name wraps (rule 16) | `sweep.js 360` on the long bedroll with a picture |
| the crop dialog at 360 px with the keyboard | no text input in it; it fits | m41; a11y unit with axe |
| a frozen copy whose file is gone | `_none` placeholder, no error | golden `#/lists/<gm2 list> as gm2` with a seeded missing file |
| account deletion at 305 pictures (610 files) | the function lists the folder and removes 610 names in one call, then deletes the user | handler unit test at 610 names; layer 4 flow with 2 files |
| print of 180 cards with own pictures | colour cards draw each 640 file; black-and-white draw none | `tests/app/print.js` with a seeded picture |

At many the primary action keeps its place: the field sits inside the form;
the save button is where it is. No sticky region grows.

## 5. Error scenarios

| Scenario | Screen | Stored data and recovery |
|---|---|---|
| decode fails, wrong size | the field's refusal line | nothing read further; nothing stored |
| upload: network | `hbArtUploadFailed` under the buttons; the form keeps the picture | no row written; uploaded files stay until a later sweep; the retry re-uploads (a duplicate name is ok) |
| upload: picture limit | `limitHbArt` | none written; the sweep ran first, so only named pictures count |
| row write fails after the upload | today's save failures | files orphaned until the next sweep (10 minutes) |
| another tab saved the item meanwhile | today's conflict banner; «Сохранить мою версию» uploads again (ok) | the row read again; the old picture deleted only when unnamed |
| another tab or device deleted the item | today's deleted banner; «Сохранить как новый» keeps the chosen picture | as today |
| the removal of an unnamed old file fails | nothing shown | the next save's sweep deletes it |
| a frozen copy names a deleted file | the placeholder | the copy keeps its text; nothing to recover |
| account deletion: the function fails before the user delete | `accountFailed`; the account stays | some pictures gone, the account and its rows kept; the retry finishes |
| account deletion: the function is not deployed or answers 5xx | `accountFailed` | nothing deleted; CI deploys it on every run (3.9) |
| account deletion from a stale tab (previous bundle) | `accountFailed` (`delete_account()` refuses while files remain) | nothing deleted; a reload loads the new bundle |
| stale tab reads a snapshot or projection with `img` | the old `snapshotValid` refuses it: a frozen copy is not drawn, `#/h/` says «Предмет не загрузился» | none; a reload fixes it |
| revert: previous frontend | own items draw no picture; it calls `delete_account()`, refused while files remain | rows and files kept; a forward fix restores deletion |
| revert: down migration | no pictures | `art` dropped, the bucket rows deleted (a plan-review trigger) |
| backup step fails | the nightly run is red (GitHub's email) | the database dump of the same run is kept as today |
| function deploy fails in CI | the `e2e` or `migrate-prod` job is red; nothing publishes | the previous function stays deployed |

## 6. Consistency and RU/EN parity

Rules followed: 2 (`hbArtUploadFailed` follows the editor's own save-failure
form, a sibling departure already in the editor; the account deletion keeps
`accountFailed`), 3 (no new delete confirm: removing a picture is part of the
form until «Сохранить»), 5 (no new toast but `copyArtFailed` appended to
R9's create toast), 6 (the dialog's decoding state uses `LoadState`), 11
(the dialog's «Отмена» discards the crop; «Готово» keeps it), 13 (no text
field), 14, 15 (a visible label «Картинка», the line under it states format,
size and the save effect; «Масштаб» labelled; no «?»: the field explains
itself), 16. Siblings: the picture box, its fallback and its sizes equal the
catalog's; «Обрезать картинку» is the app's first crop control (no sibling).
RU/EN: every key of 3.8 in both languages, same facts, `%n` in both, ASCII
punctuation, «ёлочки» in RU.

## 7. Batches, gates, cost, review, split criterion

| Cut | Criterion |
|---|---|
| R9 \| R8 | the owner's order |
| `B8.1` \| `B8.2` | the schema batch rule (bucket, policies, definer functions stop for the plan review, the test push and `npm run e2e`); a commit the harness cannot reach without `B8.1` (the port, the fake, the seed's art) |

`B8.2` stays one batch: the field, the dialog, the save flow and every
surface share `artSrc`, the media port and the seeded pictures; the goldens
re-seed once.

| Batch | Goal and scope | Gates (cost) | Review |
|---|---|---|---|
| `B8.1` | 3.1-3.3, 3.6's backup, 3.9 (the function, its CI steps, the wrapper and the hook rule), layer 3, contract case Q, a decision file | `check` 9 (with the handler and hook selftest cases), `check:db` 10 (+5 once for the storage image), `build:test` + `check:built` 2; after the approve: `db:push --project test` 1, `functions:deploy --project test` 1, `e2e` 3 (~26 min, ~31 the first time) | plan review before; batch review (storage policies, definer functions, an Edge Function, two CI steps, a hook change, a CI secret) |
| `B8.2` | 3.4-3.7, D60, the R11 line, the specs | `check` x2 18, `check:built` 2, `app/states` 6, `app/contracts` 8, `app/print` 4, goldens compare 13 and re-seed 3, `sweep.js 360` 8, `e2e` 4 (~66 min) | required (new screens, a new write protocol, privacy text) |

R8 total: about 96 minutes of local gates plus a 10-minute closeout, and the
owner's steps of 9.1. CI grows by about 20-40 s in `e2e` and in
`migrate-prod` (one function deploy each). Bundle: about +12 kB (the field, the dialog, the
port, `lib/art.ts`); the dialog and the encoder load as a lazy chunk on the
first «Выбрать файл» (the chunk still counts in the figure). Each batch
raises the passed budget to the measured size plus about 5 kB.

### 7.3 `B8.1` - storage, schema, ports, the Edge Function and the backup copy (implement-ready)

Objective: everything the plan review must see before a screen uploads: the
bucket and its policies, the `art` column, the snapshot and projection
changes, the account delete rule, the two ports, the fake, contract case Q,
layer 3 cases and the backup copy.

In scope: 3.1, 3.2 (`lib/art.ts`, `artSrc`), 3.3, 3.6's backup, 3.9, the
decision file. Out of scope: every screen and string (`B8.2`), the export change
(`B8.2`), privacy text (`B8.2`).

Files:
- new `supabase/migrations/<ts>_homebrew_art.sql`,
  `supabase/reversals/<ts>_homebrew_art.sql`,
  `tests/db/homebrew-art.test.mjs`, `app/src/lib/art.ts` and
  `art.test.ts`, `app/src/ports/media.ts` (and its test fake),
  `tools/supabase/backup-art.mjs` and its `node:test` file,
  `supabase/functions/delete-account/index.ts` and `handler.ts`,
  `tests/functions/delete-account.test.mjs`,
  `tools/supabase/functions-deploy.mjs` and its `node:test` file,
  `docs/decisions/<date>-own-pictures-are-files-named-by-their-hash-in-the-authors-folder.md`
- edit `tools/supabase/lib.mjs` (only if step 1 needs `storage-api`),
  `tests/db/delete-account.test.mjs`, `tests/db/usage.test.mjs` (the bucket
  now exists), `app/src/lib/desc.ts` and its test, `app/src/lib/homebrew.ts`
  (`recordOf` takes `art`, `snapshotValid` admits `img`) and its test,
  `app/src/ports/types.ts`, `index.ts` (`Env.media`), `supabase.ts`,
  `supabase.test.ts`, `fake-cloud.ts`, `fake-cloud-seed.ts` (gm1's axe takes
  the catalog picture `q1.webp`; gm1's «Настой кузнеца» an own file name
  whose file the fake does not hold), `fake-cloud.test.ts`, `lazy-cloud.ts`,
  `cloud.contract.ts`, `.github/workflows/backup.yml`, `.github/workflows/ci.yml`
  (the two deploy steps), `package.json` (`functions:deploy`, the
  `node --test` line), `supabase/config.toml` (`[functions.delete-account]`),
  `.claude/hooks/bash-guard.mjs` and its selftest cases, `eslint.config.mjs`
  and `tsconfig.json` (only as far as the Deno entry needs),
  `tools/supabase/restore-drill.mjs`, `.claude/README.md` ("Backups and
  restore", "Supabase configuration"), `docs/specs/COVERAGE.md`,
  `docs/specs/META.md` section 3, then `node tools/decisions.js`.

Steps:
1. Run `npx supabase db reset --local` (PowerShell) with a draft bucket
   insert; if `storage.buckets` is missing, remove `'storage-api'` from
   `LOCAL_STACK_EXCLUDES` and retry; record the finding.
2. Write the migration of 3.1 and its reversal; `npm run check:db`.
3. `tests/db/homebrew-art.test.mjs` (six roles): insert into
   `storage.objects` as the owner under its folder (ok), under another
   uuid (refused), as `anon` (refused); a name of the wrong shape (refused);
   the room at the limit and one past it (with a `limits:set`-style override
   row); select and delete only in the own folder; `art` of the own folder
   and of a catalog basename accepted, another uuid refused; a snapshot with
   `img` of either shape valid, a wrong shape invalid; `get_shared_list` and
   `get_shared_homebrew` carry `img`; `delete_account()` refused while a file
   remains, done after the delete. If inserting into `storage.objects` from
   SQL is refused by the storage schema's triggers, the cases go through the
   Storage API at the local Kong URL with the role's JWT.
4. `lib/art.ts` and `artSrc` (3.2) with unit tests (paths, thumb, blob,
   basename unchanged, `cropRect` at both orientations and every zoom end,
   `unnamed` with the 10-minute age).
5. `MediaPort` and its fake; `Env.media`.
6. The homebrew port's art calls, `ItemRow.art`, the patches,
   `AuthPort.deleteAccount` (3.3); `supabase.test.ts` for each call's request
   and error mapping (duplicate ok, policy refusal `limit`, network).
7. The fake and the seed; contract case Q; the fake run in `npm run check`.
8. `backup-art.mjs`, `backup.yml` step, the drill's check, the runbook lines;
   `node --test` for the script's tar and listing over a stubbed client.
8a. The Edge Function, its handler test, `config.toml`, the wrapper and its
   test, the npm script, the two `ci.yml` steps, the `bash-guard.mjs` rule
   with selftest cases (3.9); `.claude/README.md` "Supabase configuration"
   gains "Edge Functions deploy from CI", the two tokens' places and the
   scope names the owner ticked.
9. `META.md` section 3 (pictures are public files in one bucket, the folder
   per account), `COVERAGE.md`, the decision file (context: decisions 39, 40,
   the roadmap's URL; decision: hash names in the author's folder, a stored
   name not a URL, deletion by the client before `delete_account()`, the
   room derived from the item limit, the Edge Function deployed by CI and by the
   wrapper; rejected: the browser-side delete (the owner, Q8-1), a deploy by
   hand (the owner, 2026-10-02), absolute URLs (host-bound rows), per-item
   folders (no reuse), a separate limit row).
10. `rtk npm run check`, `npm run build:test`, `npm run check:built`; commit.
    After the approve: `npm run db:push -- --project test`, `npm run
    functions:deploy -- --project test`, `npm run e2e`.

Acceptance:
- `check:db` green, the reversal walk passes, and every policy case of step 3
  holds.
- Contract case Q passes over the fake and the test project, its account
  delete through the deployed function.
- The handler test covers 401, the two failure points and 204; the
  selftest covers `functions:deploy --project test` allowed after an
  approving review, denied before it, denied with `--project prod`, and a
  bare `supabase functions deploy` denied.
- `artSrc` answers the same as today for every catalog basename (the
  existing tests unchanged).
- The backup step's script passes its tests; the workflow change is read by
  the reviewer (it runs only on `main`, after the release push).
- Standing checks: scale - the room at the limit and past it (step 3);
  error scenarios - the rows "upload: picture limit", "account deletion from
  a stale tab", "revert: down migration" each have a test; consistency and
  RU/EN not applicable (no screen, no string).

Verification commands: `npm run check:db` (PowerShell), `rtk npm run check`,
`npm run build:test`, `npm run check:built`; after the approve
`npm run db:push -- --project test`, `npm run functions:deploy -- --project
test`, `npm run e2e`.

Do not: deploy to production (CI's `migrate-prod` does at the release push);
print the token; add a dependency for image work; give `anon` a storage
policy; store an absolute URL.

### 7.4 `B8.2` - the screens (outline)

Files (expected): new `ArtField.svelte`, `CropDialog.svelte` (lazy chunk with
the encode step) and tests; edit `HomebrewEditor.svelte`, `ItemPicker.svelte`
(a filter for items with a picture), `state/homebrew.svelte.ts` (the save
flow, the deletes, the sweep), `state/app.svelte.ts` (R9's `saveItem` copies
the picture), `AccountPage.svelte` (the hint), `lib/bundle.ts` (drop `img`),
`lib/dict.ts`, `a11y.test.ts`, `tests/app/inventory.js` and goldens,
`tests/app/print.js`, `tests/e2e/flows.mjs` (upload a picture on the test
project, open it signed out through an item link, delete the account of a
throwaway user, read the public URL gone), `docs/specs/FEATURES.md`
("Records", "Homebrew", "Print", "Account"), `STATE.md` (the form's picture
in memory), `COVERAGE.md`, `DEBT.md` (D60 deleted with its section), both
privacy pages.

Acceptance lines (each its own line at the batch's close):
- The field and the crop dialog (3.4) with every refusal, both encoders, the
  keyboard and pointer paths.
- The save flow: upload, sweep, the old file's removal; delete and bulk
  delete remove unnamed files.
- «Выбрать из предметов» over catalog and own pictures (Q8-3 B).
- The picture on every surface of 3.5, R9's included; a missing file draws
  the placeholder.
- «Сохранить себе» copies another owner's file (Q8-6 A) and reports a failed
  copy.
- Exports carry no `img`; `import-v1`/`import-v2` fixtures unchanged; the
  zip hint (Q8-7 A).
- Account deletion calls the `delete-account` Edge Function, which deletes
  the files first (Q8-1 B).
- Privacy pages (3.7).
- `DEBT.md` D60 deleted: storage-js and functions-js are both called now.
- The R11 line: after the E2E upload, the usage report run against the test
  project (`.claude/README.md`, "Usage monitoring") shows a non-zero
  `storage_bytes`; the handoff records the figure.
- Every state of section 4 and scenario of section 5 that B8.2 adds: its
  proof named in the handoff.

## 8. Specs and contracts per batch

| Batch | Specs | Contracts | Tests |
|---|---|---|---|
| `B8.1` | `META.md` 3 (one Edge Function, deployed by CI), `COVERAGE.md`, `.claude/README.md` ("Supabase configuration", "Backups and restore", "Hooks" for the rule), a decision file | none (the stored name is internal; files and fixtures unchanged) | layer 3 new file, delete-account, usage; layer 1 art, desc, homebrew, ports, contract case Q; layer 4 case Q |
| `B8.2` | `FEATURES.md`, `STATE.md`, `COVERAGE.md`, `DEBT.md`, privacy pages | none (Q8-7 A keeps both file formats) | layer 1 components, states, bundle; layer 2 states, goldens, print, sweep 360; layer 4 a flow |

## 9. Owner answers (2026-10-02)

Every question is answered; nothing stays open. The options not taken are
kept one line each for the record.

- **Q8-1 Account deletion: B, decision 40's `delete-account` Edge Function**,
  deployed by CI with two project-scoped tokens (owner follow-ups,
  2026-10-02). The function deletes the
  account's files, then the account (3.9). Not taken: A (the browser deletes
  the files, then calls `delete_account()`), a deploy by hand.
- **Q8-2 Safari and iPhone: A.** WebP where the browser encodes it, JPEG at
  the same size and quality steps elsewhere; the bucket takes both. Not
  taken: B (a WebAssembly encoder), C (no upload on iPhone).
- **Q8-3 Where a picture comes from: B.** A file, or any item's picture - the
  catalog's or an own one - through «Выбрать из предметов» (m42). Accepted
  trade-off: `art` holds two shapes; a renamed catalog picture shows the
  placeholder. Not taken: A (own items only), C (a file only).
- **Q8-4 Limits: changed.** A 640 file of at most 200 KB; pictures per
  account = the item limit **+ 5** (105 at the defaults, 305 at 3x), derived
  from `homebrew_items_per_owner`. The slack covers a replace that uploads
  before the old file is deleted and a few leftovers that the sweep has not
  removed yet. At the defaults an account holds at most about 22 MB (105 x
  (200 + 8) KB), typically about 7 MB, so the free plan's 1 GB holds about 45
  full worst-case accounts. Not taken: a separate limit row, 300 KB files,
  the planner's + 20.
- **Q8-5 A frozen copy whose picture is gone: A.** The placeholder. Not
  taken: B (keep files a copy names).
- **Q8-6 «Сохранить себе» of an item with an own picture: A.** Copy both files
  into the reader's folder; a failed copy saves the item without the picture
  and the toast adds `copyArtFailed`. Not taken: B (name the author's file).
- **Q8-7 Files carry no picture: A.** The lists and homebrew files and the
  data zip hold no picture; the «Ваши данные» hint says so (`zipNoArt`). Not
  taken: B (`homebrew-v2` with pictures in the zip).
- **Q8-8 The backup copies the bucket: A.** An encrypted tar in the nightly
  artifact. Not taken: B (rows only).

### 9.1 Owner steps (one-time, in this order)

1. Before `B8.1`'s test deploy: create the test-scoped token (Supabase
   dashboard, Account, Access Tokens, generate a new token named
   `dhloot-functions-test`). In its resource access settings pick the test
   project `rdjxcjkhsklhprmzxajq` only, and the minimal Edge Functions access
   that lets it deploy (write); grant nothing else (no database, Auth,
   Storage, secrets or organization access). The planner could not read the
   screen's exact scope names; the owner picks the minimal Edge Functions
   write scope for one project, and B8.1 records the names. Add the token as
   the GitHub repository secret `SUPABASE_ACCESS_TOKEN_TEST` (Settings,
   Secrets and variables, Actions, New repository secret), and add the line
   `SUPABASE_ACCESS_TOKEN=<test-scoped token>` to `.env.test.local` at the
   main checkout's root (the agent wrapper loads it; agents never read it).
2. Before the release push: create the production-scoped token the same way
   (`dhloot-functions-prod`, the production project `zzmrftmzefcqehhyztjq`
   only, the same minimal Edge Functions write access) and add it as the
   secret `SUPABASE_ACCESS_TOKEN` of the Environment `production`
   (Settings, Environments, production, Add environment secret).
3. Before the release push: add `SUPABASE_SECRET_KEY_PROD` (production's
   secret key) to the Environment `production` (Settings, Environments,
   production, Add environment secret), for the backup's picture copy.
4. After the release push: dispatch the backup once and check the artifact:
   `gh workflow run backup.yml --ref main`, then `gh run download <run id>
   --dir <dir>`; expected: `schema.sql.age`, `data.sql.age` and
   `art.tar.age`.
5. At the release closeout, as at every release: confirm on the device list
   that an account with a picture deletes from `#/account` (the E2E covers
   the test project).

No owner command deploys the function: CI's `functions-test` and
`functions-prod` steps do, and the agent route covers the test project
between CI runs.

Decided here (recorded, no question): the name is the stored value, not a
URL (3.2); upload at the save, not at the choice (no orphan per cancelled
form); the sweep before an upload keeps the room honest; the crop is square
only.

## 10. Risks, assumptions, deferred

- Risk: a scope too wide on either token (for example the whole account, or
  a write scope beyond Edge Functions) widens what a leak can do; the owner
  ticks one project and the Edge Functions deploy access only (9.1 steps 1-2),
  and the release closeout reads both tokens' settings once.
- Risk: the deployed function can differ from the repository's if a CI run
  failed after a merge; the next green run deploys it again, and the release
  closeout reads the `functions-prod` step's log.
- Risk: the Deno entry is outside vitest's coverage; the handler test and
  layer 4 cover it, and `COVERAGE.md` names the gap.
- Risk: storage policies created by a migration on the hosted projects need
  the `postgres` role to own policies on `storage.objects`; B8.1's test push
  proves it on the test project before production.
- Risk: the free plan's 1 GB storage and 5 GB egress; the nightly usage
  report already forecasts storage, and a year of browser cache keeps
  egress low.
- Assumption: Supabase answers public objects with CORS `*` (B8.2's E2E
  flow verifies copy-image; the text fallback covers a refusal).
- Deferred: a picture for sources and cards; pictures in the data zip
  (Q8-7 B); a WebP encoder for Safari (Q8-2 B).

## 11. Mocks

`issues/persist-8-media/mocks/index.html`:

| Mock | Screen and states |
|---|---|
| `m40-editor-picture-field.html` | the field: none, chosen (unsaved, the preview card), saved; refusals; uploading, network, limit; desktop and 360 px |
| `m41-crop-dialog.html` | the dialog on desktop and 360 px, decoding, the squeeze failure |
| `m42-picture-from-an-item.html` | Q8-3 B (owner, 2026-10-02): the picker over catalog and own pictures, a picture chosen |
| `m43-pictures-everywhere.html` | `#/homebrew` rows, a list row, `#/h/` with the picture, a frozen copy whose file is gone |
| `m44-print-with-a-picture.html` | colour cards with own pictures, black-and-white unchanged |
| `m45-account-deletion-and-files.html` | Q8-1 B deletion through the Edge Function (busy, failure), Q8-7 A zip hint |
