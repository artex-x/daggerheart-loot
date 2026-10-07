# Review - plan before B8.1 (persist-8-media)

Verdict: fix-then-continue
Reviewed: ac23ce36 + uncommitted issues/persist-8-media/
Scope: plan before B8.1

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Read: `CLAUDE.md`; `issues/persist-8-media/` `context.md`, `plan.md`,
`handoff.md`, `mocks/index.html`, m46, m47, m48 (text); the 2026-10-02 plan
(`git show ac23ce36:issues/persist-8-media/plan.md`); R7h `plan.md` 2.7,
2.8.1-2.8.7, 6; the B7h.1 migration and reversal
`20261007120000_lifecycle_cleanup.sql`; the lifecycle decision draft; R9
`plan.md` (the R8 lines); migrations `20260925120000_delete_account.sql`,
`20260930130000_homebrew.sql` (table, grants, triggers),
`20261002130000_homebrew_files.sql` (inserts), `20260925130000_limits.sql`
(`effective_limit` grants); `tests/db/harness.test.mjs`,
`tests/db/reversibility.test.mjs`; `tools/supabase/lib.mjs`
(`LOCAL_STACK_EXCLUDES`, `keyDeleteStatements`, `cliShapedDataDump`),
`tools/supabase/restore-prod.mjs` (the load order);
`.github/workflows/backup.yml`; `supabase/config.toml` (`[api]`,
`[storage]`); `.claude/README.md` ("Migration names", the egress quota
line); `app/src/lib/dict.ts` (`deleteHint`). No check was run (read-only
review; an implementer runs heavy checks in this tree).

Q8-9 is reviewed with the recommended answer A. The section "Q8-9 under B
or C" at the end says what changes with the other answers.

## Blockers

- **plan-B8.1-1 (blocker, local).** An error inside `art_delete` aborts the
  user's write. Section 3.1 makes `art_delete` answer null only when a Vault
  secret is missing. Every other failure raises inside the
  `homebrew_items_art_release()` trigger: `net.http_delete` absent or with
  another signature on a hosted project (plpgsql checks the call only at
  run time, so the migration applies cleanly), no `USAGE` on `net`, no
  `SELECT` on `vault.decrypted_secrets`. Then each picture change, each
  item delete and each account deletion fails, and the hourly
  `lifecycle_cleanup()` fails as a whole, so the request, notice and share
  clean-up of R7h stops too. This contradicts the central claim of Q8-9 A,
  "the account always deletes" (2.3, 3.6, 5). The hosted projects can run
  different Postgres images, so the test project's case Q does not prove
  production. Change: (a) in 3.1, wrap the request loop of `art_delete` in
  `begin ... exception when others then raise warning 'art_delete: %',
  sqlerrm; return null; end`, so a failure to delete a file never refuses
  a row write; the job and the watch (3.6) handle the files left behind;
  (b) in 7.3 step 3, add a layer 3 case: with the secrets seeded and
  `net.http_delete` made to fail (for example a revoke of `USAGE` on `net`
  from `postgres` inside the rolled-back transaction, or a stub), an `art`
  change, an item delete, `delete_account()` and `lifecycle_cleanup()` all
  succeed and queue nothing; (c) in 9.2 steps 1 and 2, the owner reads
  `select extversion from pg_extension where extname = 'pg_net'` and
  `select default_version from pg_available_extensions where name =
  'pg_net'` on each project; step 1 of 7.3 records the local version beside
  them in `.claude/README.md`.

- **plan-B8.1-2 (blocker, local).** A saved item can name a file that is
  being deleted. That loss is not named in section 5. The owner check
  `homebrew_items_art_owned()` sees the object row until Storage processes
  the `DELETE`, and `pg_net` sends it only after the commit. Three paths
  lead to the loss: (1) tab A removes picture X from its last item and
  commits; tab B saves another item that names X («Выбрать из предметов»)
  before `pg_net` sends the request; (2) the same two writes in two
  transactions that run at the same time - the release check in A does not
  see the uncommitted row in B; (3) the hourly job queues X, an orphan more
  than an hour old, and a save retry of the form that owns X answers
  "Duplicate" (treated as ok in 3.3) and writes the row before the request
  runs. In each case the row names X, the file goes, and the item draws the
  placeholder; the picture is lost without a message. Change (recommended):
  (a) both picture triggers take `pg_advisory_xact_lock(hashtext('homebrew-art:'
  || <the p/ name>))` before their checks, so the release check runs after
  a concurrent naming write commits; (b) `homebrew_items_art_release()` and
  the files block of `lifecycle_cleanup()` record each name they queue in
  `public.homebrew_art_released (name text primary key, at timestamptz not
  null default now())`, with RLS on and no grant to an API role; (c) the
  owner check refuses a name in that table with `homebrew: art missing`;
  (d) the job takes the same lock with `pg_try_advisory_xact_lock` per name,
  skips a name it cannot lock, and checks `not exists` again after the
  lock; (e) the job deletes rows of `homebrew_art_released` older than one
  day; (f) on `artGone`, when the form still holds the cropped blob, the
  save flow (B8.2, 3.5) makes a new name and uploads again, without asking
  the author; (g) layer 3 cases: a write that names a released name is
  refused; a two-connection case for path (2). Accepted alternative (a
  minimum): name the three paths in section 5 and in the decision file as
  an accepted rare loss, with the symptom (the placeholder after a save
  that succeeded) and the recovery (choose the picture again).

- **plan-B8.1-3 (blocker, needs an owner answer).** The nightly backup's
  egress is not counted. Section 3.8 downloads every file of the bucket
  every night through the public addresses. The free plan gives 5 GB
  uncached plus 5 GB cached egress a month (`.claude/README.md`), and the
  usage report cannot see egress ("billed egress: dashboard only"). A
  nightly full copy uses about 30 times the bucket size a month: a bucket
  of about 170 MB uses the whole 5 GB, and the 1 GB storage limit that
  section 10 names uses 30 GB. The job also has `timeout-minutes: 20`;
  section 4's 92 000 objects at 3x do not fit a serial download. Q8-8 A
  was answered on 2026-10-02 without these figures. Change: add the egress
  figure to sections 4 and 10, and put the copy cadence to the owner as
  Q8-10 before B8.1. Options for the question: (a, recommended) a weekly
  full copy on one night, with a concurrency limit in `backup-art.mjs`
  (about 4.3 times the bucket size a month; trade-off: a restore loses up
  to 7 days of new pictures); (b) the nightly full copy with the figure,
  and a usage warning when `storage_bytes` passes 150 MB; (c) a nightly
  copy of new names only, with a GitHub Actions cache of the files (the
  smallest egress; trade-off: a deleted picture stays in the cache until
  the next run prunes it, and the privacy text must say so). Name the
  per-run figures in 7.3 step 10's test.

## Risks

- **plan-B8.1-4 (risk, local).** Step 1's probe does not test the
  assumptions that it is said to test. Each line is a fact that a failure
  after the batch review forces into a new migration, because the test
  project then holds the applied file ("A migration once applied is never
  edited", `.claude/README.md`, "Migration names").
  - `pg_net` and Vault usable by `postgres` on both hosted projects: step 1
    reads only that `net.http_delete` and `vault.decrypted_secrets` exist
    locally. Add `has_function_privilege('postgres', 'net.http_delete(...)',
    'execute')`, `has_table_privilege('postgres', 'vault.decrypted_secrets',
    'select')`, and the hosted versions of plan-B8.1-1 (c).
  - `storage.objects.owner_id` set from the session: step 1 reads only that
    the column exists, and layer 3 sets `owner_id` by hand when it inserts
    from SQL. Add to step 1 one upload through the local Storage API (the
    local gateway URL, the member's JWT, the planned insert policy), then
    read the row's `owner_id`. The same upload answers whether the upload
    needs a select policy (3.1 now leaves that to case Q on the test
    project, after the review).
  - The secret key in the `apikey` header alone: only case Q's real run
    proves it, after the batch review. Either add a pre-review probe (one
    `DELETE` with the E2E secret key to a name in a bucket that does not
    exist: 400 or 404 means the gateway took the key, 401 or 403 means it
    refused it), or write in 7.3 that a header change found by case Q is a
    new migration and a second batch review.
  - CORS `*` on public objects (B8.2 in section 10): `copyArt` is built in
    B8.1 and fetches the public files cross-origin, but case Q never calls
    it. Add `copyArt` to case Q's real run.
  - Not listed, and each one breaks Q8-9 A: no foreign key from
    `storage.objects` to `auth.users` (else `delete_account()` fails while
    the user owns objects); `postgres` has `rolbypassrls` (else the room,
    the owner check, the job and the backup listing read no object, and
    every `art` write is refused). Add `select conname from pg_constraint
    where conrelid = 'storage.objects'::regclass and contype = 'f'` and
    `select rolbypassrls from pg_roles where rolname = 'postgres'` to step
    1, and to owner step 1 for the hosted projects.
  - "Storage refuses deletes of its tables from SQL": step 1's
    `pg_trigger` read covers it; record the trigger name.
  - The probe's cost of 2 minutes leaves out the first pull of the
    `storage-api` image; the batch table counts it under `check:db`. CI's
    `db` job also starts `storage-api` from now on; name that growth.

- **plan-B8.1-5 (risk, local).** The CDN can serve a deleted picture.
  Section 3.3 uploads with `cacheControl: '31536000'`. On a plan without
  Smart CDN, a public object that the CDN holds can stay readable after the
  delete, up to its cache age. The privacy text (3.10, m48: "the database
  deletes the file within a minute") then promises more than the address
  does. Case Q's first half reads the address (200) and then polls for 400
  or 404, so it tests this, but the plan does not say what follows a
  failure. Add to section 10 as an assumption: "a delete makes the public
  address answer 400 or 404 within 30 s, also after a read through the
  CDN". On failure: a shorter `cacheControl` (for example 3600), and the
  privacy text says "within an hour". Also reword the privacy sentence
  "within two hours if the first attempt fails": with a missing or revoked
  key it is longer. Write "usually within a minute; the address can answer
  for a short time after that".

- **plan-B8.1-6 (risk, local).** A down migration followed by an up deletes
  every file. After the reversal (3.9) the bucket keeps its files, Vault
  keeps its secrets, and `art` is gone. A forward fix that adds `art` and
  the files block again (a new migration, or the same one) makes every
  file an orphan older than an hour, and the next job run deletes up to
  2000 files an hour until the bucket is empty. Section 5's row "revert:
  down migration" names the lost references, not this. Change: name it in
  3.9, section 5 and the "To undo `<ts>_homebrew_art`" note; the recovery
  is to restore `art` from the last backup before the down (`data.sql`
  holds `homebrew_items.art`) before the forward fix is applied, or to
  delete the Vault secret `dhloot_storage_key` first, which stops all file
  deletion.

- **plan-B8.1-7 (risk, local).** The restore paths are not named.
  `restore-prod.mjs` runs `TRUNCATE` on the public tables and then deletes
  `auth` rows by key, before the load; the load runs with
  `session_replication_role = replica` (`cliShapedDataDump`). So today no
  picture trigger fires during a restore: the truncate fires no row
  trigger, the cascade finds the items already gone, and the owner check
  does not refuse restored rows that name files deleted since the backup.
  A later change to that order (a `DELETE` instead of `TRUNCATE`, a load
  without `replica`) would queue the deletion of every production file, or
  stop the restore at the first restored picture. Change: add one sentence
  to 3.8 and the runbook that the restore depends on this order, and add a
  `restore-prod.test.mjs` case: with the two Vault secrets seeded, a
  restore that loads an item with `art` queues no request and refuses
  nothing.

- **plan-B8.1-8 (risk, local).** The key's readers are not proved. Section
  3.6 says `postgres` reads the key. The key also sits in clear text in
  `net.http_request_queue.headers` until the worker sends the request.
  Add to 7.3 step 3: `has_table_privilege` is false for `anon`,
  `authenticated` and `service_role` on `vault.decrypted_secrets`,
  `vault.secrets` and `net.http_request_queue`; `net` stays out of
  `[api] schemas` (`supabase/config.toml` holds `public` and
  `graphql_public`).

- **plan-B8.1-9 (risk, local).** The reversibility gate does not see the
  storage policy. `tests/db/reversibility.test.mjs` snapshots the schema
  and the policies on `realtime.messages` only, so a reversal that forgets
  `drop policy homebrew_art_insert on storage.objects` passes. Add
  `tests/db/reversibility.test.mjs` and `roles.mjs` to 7.3's files: the
  snapshot holds this project's policies on `storage.objects` as it does
  for `realtime.messages`.

- **plan-B8.1-10 (risk, local).** The account id can reach a reader by a
  way other than the name. Add to case Q's real run: the answer headers of
  a public object, and the answer of `GET
  /storage/v1/object/info/public/homebrew-art/<name>`, hold no
  `owner_id`, `owner` or account uuid. On failure, the decision file
  records it and the privacy text says so.

## Nits

- **plan-B8.1-11 (nit, local).** The grants are incomplete. 3.1 gives
  `homebrew_art_name_ok` no revoke and the two trigger functions no
  revoke, so `anon` executes all three through `PUBLIC`, and
  `harness.test.mjs` ("lets anon execute only the listed public
  functions") fails. Follow the pattern of `20260930130000_homebrew.sql`:
  `revoke execute on function public.homebrew_art_name_ok(text) from
  public, anon; grant ... to authenticated` (the policy runs it as
  `authenticated`), and `revoke execute ... from public, anon,
  authenticated` on both trigger functions. Correct the sentence "
  `homebrew_art_room()` is the only new function `authenticated` executes"
  in 3.1: `homebrew_art_name_ok` is the second.
- **plan-B8.1-12 (nit, local).** "At 610 files (3x) one transaction queues
  610 requests" (4, 7.3 step 3) does not fit the item limit: 300 items at
  3x name at most 600 files, and the release trigger deletes only named
  files. Write "300 items, 600 requests in one transaction; the 10 unnamed
  files go with the job", or seed 305 items with a `limits:set` override.
- **plan-B8.1-13 (nit, local).** The job's select and the watch's count
  read every object of the bucket. An object whose name fails
  `homebrew_art_name_ok` (a dashboard `.emptyFolderPlaceholder`, a
  mistaken restore path) is selected in each run, skipped by `art_delete`,
  and counted as overdue for ever; 2000 of them stop the job, because the
  select orders by `created_at` with `limit 2000`. Add `and
  public.homebrew_art_name_ok(o.name)` to both.
- **plan-B8.1-14 (nit, local).** The index measurement in 7.3's standing
  check 1 runs at 610 objects over a small `homebrew_items`. The release
  trigger's `no row of homebrew_items has art = old.art` is a sequential
  scan per deleted row; at 3x (about 45 000 items) an account deletion runs
  300 of them. Seed `homebrew_items` at the 3x population for the
  measurement, or add the partial index `on homebrew_items (art) where art
  like 'p/%'` at once.
- **plan-B8.1-15 (nit, local).** B8.1 adds code with no caller.
  `MediaPort`, `Env.media` and `cropRect` have no user until B8.2's crop
  dialog (`CLAUDE.md`: "Add no module, export, component, or variant before
  something uses it"). Move them to B8.2. Keep `copyArt` in B8.1 only with
  the case Q call of plan-B8.1-4.
- **plan-B8.1-16 (nit, local).** Section 5's row "another tab or device
  deleted the item" says «Сохранить как новый» re-uploads the chosen
  picture. That is true only for a new file in the form. When the form
  shows the item's saved picture, the delete removed its file, the save is
  refused with `hbArtGone`, and the author must choose the file again.
  State that, and name it in 2.3 (the 2026-10-02 row said "keeps the
  chosen picture").
- **plan-B8.1-17 (nit, local).** A shared picture links two items to one
  author: two items that show the same `p/` name belong to one account,
  also when no relation joins them. Add one clause to the privacy
  paragraph (3.10, m48), or accept it in the decision file.
- **plan-B8.1-18 (nit, local).** The runbook has no step for the owner to
  remove a reported picture. Add to `.claude/README.md` in 7.3: set the
  item's `art` to null in the SQL editor, and the trigger deletes the file.
- **plan-B8.1-19 (nit, local).** `handoff.md` "Review:" names no report
  path (the template asks for `issues/<id>/reviews/<batch>.md`), and
  "Verification: Results" reads "see the planner's report" instead of the
  results of `npx prettier --check issues/persist-8-media`.

## Deviations

The handoff records six deviations from the 2026-10-02 design. Each is
accepted, with the findings above applied:

- The database deletes files, not the browser, and no Edge Function
  (Q8-9 A): accepted, with plan-B8.1-1 and plan-B8.1-2.
- Random names `p/` and `t/` with no account id: accepted. They keep R7h's
  forbidden keys, and they stop pre-upload poisoning. plan-B8.1-10 checks
  the other ways an account id can leak.
- `img` beside the item in the three read functions: accepted; a previous
  bundle validates the projection's keys.
- The backup reads public addresses with no new secret: accepted for the
  key, not for the cadence (plan-B8.1-3).
- The seed and every golden move to B8.2: accepted (R7h's plan-B7h.1-23
  rule).
- R9's Q9-6 to Q9-10 assumed at their recommended answers: accepted;
  section 2.4 names the effect of each other answer.

Feature check against the 2026-10-02 plan: no user-visible behaviour goes
without an owner question. The changed rows are in 2.3: the account
deletion that waits for its files (Q8-9), the deletion timing (Q8-9), the
frozen-copy placeholder (no subject after R7h), and the `deleteHintArt`
text, which is listed for the owner. plan-B8.1-16 adds one row.

## Standing checks

1. Scale: checked - section 4's limits and States table, 7.3's standing
   check 1, the room formula, the 2000-name job cap, `backup.yml`'s
   timeout and the egress quota line in `.claude/README.md`. The States
   table has the limit, one past it and 3x for the room, the Items tab at
   300, the list limit of 100 and print of 180 cards. Findings:
   plan-B8.1-3 (the backup's egress and run time), plan-B8.1-12 (610
   against 600), plan-B8.1-14 (the measurement population). The 360 px and
   1180 px rows are B8.2's and are present in section 4.
2. Error scenarios: checked - section 5 against each write path (upload,
   row write, release trigger, job, account deletion, «Сохранить себе»,
   restore, revert). Findings: plan-B8.1-1 (an error in the trigger blocks
   the write), plan-B8.1-2 (a named file deleted: an unnamed loss),
   plan-B8.1-6 (down then up), plan-B8.1-7 (restore), plan-B8.1-16 (the
   «Сохранить как новый» row). A retry from a stale copy writes only `art`
   through the owner check, so no field is lost from a copy held from
   before a conflict.
3. Consistency: checked - section 6 against `FEATURES.md` "Consistency
   rules" as it cites them (2, 3, 5, 6, 11, 13, 14, 15, 16), and the
   sibling picture box. No defect. B8.1 draws no screen, so 7.3's "not
   applicable" is correct for the batch.
4. RU/EN parity: checked - every key of 3.11 and the RU and EN privacy
   paragraph in m48: the same facts in both languages, `%n` in both,
   `limitHbArt` needs no plural set (the number follows a colon), ASCII
   punctuation, «ёлочки» in RU and straight quotes in EN. No defect. The
   wording change of plan-B8.1-5 must reach both languages.

## Q8-9 under B or C

With A (reviewed here), the findings above apply. What changes with the
other answers:

- B (A plus the `delete-account` Edge Function for the account): the
  findings still apply, because the row-change trigger and the job stay.
  The batch takes back the 2026-10-02 surface: the Deno handler and its
  test, two CI deploy steps, the agent wrapper `functions-deploy.mjs`, a
  `bash-guard.mjs` rule with selftest cases (a hook change is a plan-review
  trigger), two access tokens, and the platform's service key in the
  function. That is a second holder of a full secret key. Two paths delete
  an account's files, so the trigger's requests answer 404 after the
  function ran. `delete_account()` needs the 2026-10-02 refusal while files
  remain, or a stale tab bypasses the function. D60 is deleted, not
  narrowed (functions-js is called). m45 and `deleteHintArt` come back. The
  review must then cover the function's error paths and the token scopes,
  and plan-B8.1-1 must not let the trigger refuse the function's
  `deleteUser`.
- C (a nightly workflow sweep with the secret key in the Environment): no
  `pg_net`, no Vault, no `art_delete`, no release trigger and no files
  block in `lifecycle_cleanup()`, so plan-B8.1-1, plan-B8.1-6 (in part)
  and plan-B8.1-8 do not apply. The key moves to GitHub (the Environment
  `production`, and a test secret for the E2E). A removed picture and a
  deleted account's pictures stay public for up to a day, or longer once
  GitHub stops an idle schedule after 60 days. The privacy text, m48 and
  section 5 change to "within a day". The room's 5 pictures of slack must
  cover a day of replacements, so Q8-4 needs a second look. Case Q can no
  longer poll for 30 s; it calls the sweep script. plan-B8.1-2 narrows to
  the sweep's own window between its read and its delete, which still
  needs the owner check against a list of released names. The choice also
  contradicts the lifecycle decision of 2026-10-07, which rejects a
  nightly workflow step.

## Suggested next action

The planner applies plan-B8.1-1, -2 (the recommended change, or the named
minimum), -4 to -19 in `plan.md` and `handoff.md`, and adds Q8-10
(plan-B8.1-3) beside Q8-9 in section 9. The owner then answers Q8-9 and
Q8-10 and does step 1. B8.1 starts after R9's closeout and the refresh of
section 3.0, with no second plan review (one remediation cycle).

## Checks still needed

- Step 1's probe with the additions of plan-B8.1-4, on the local stack.
- The owner's reads on both hosted projects: the `pg_net` version and
  whether `pg_net` is already installed (if so, the reversal keeps it
  instead of `drop extension if exists pg_net`), `rolbypassrls` for
  `postgres`, and the foreign keys on `storage.objects`.
- Case Q on the test project: the `apikey` header, the delete after a CDN
  read (plan-B8.1-5), `copyArt` across origins, and no owner id in the
  object's headers or info (plan-B8.1-10).
- The egress figure of one backup run on the test project after the E2E
  upload, recorded in the handoff (plan-B8.1-3).
