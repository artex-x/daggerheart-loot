# Review - plan before B7h.1 (persist-7h-homebrew-page)

Verdict: fix-then-continue
Reviewed: 438b3315e07caa6feac34c28ec8016c24e2c48f0
Scope: plan before B7h.1

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Read: `CLAUDE.md`; `context.md`, `plan.md` (all, section 10 as owner
authority), `handoff.md`; mocks m02-m05 (m03 in full); the R8 and R9
Status notes (`git diff 70fe5598 HEAD`); the migrations
`20260925130100_lists`, `_list_shares`, `20260927120000_realtime`,
`20260928120000_purchase_requests`, `20260930130000_homebrew`,
`20261001130000_homebrew_relations`, `20261002120000_read_scale`,
`20261002130000_homebrew_files`; `tests/db/harness.test.mjs`,
`reversibility.test.mjs`; `tests/e2e/flows.mjs` F15 and F17,
`contract.mjs`, `admin.mjs`; `lib/dict.ts`, `lib/homebrew.ts`,
`lib/cloudLists.ts`, `lib/bundle.ts`; `META.md` section 3; `FEATURES.md`
"Homebrew" delete confirms; `DEBT.md` D70, D71; `.claude/README.md` "Batch
size and the fixed cost of a run", "Backups and restore", the "To undo"
notes.

## Blockers

- **plan-B7h.1-1** (B7h.3 outline and B7h.4 import; local to the plan)
  Unnamed loss of frozen content when one owner holds two or more different
  snapshots of one key. 2.8.5 step 4 makes "one new item per (list owner,
  key)". Keys are unique per owner, and a player who cloned or added the
  same GM item at two times holds two different snapshots in two lists.
  One snapshot becomes the item; the other entry is relinked to it, and its
  content is lost. The layer 3 matrix names the case ("two lists of one
  owner with one key") but not its outcome. The same collapse occurs in the
  new lists file import (2.8.7): `import_homebrew` refuses "a key twice in
  one array", so the client must dedupe by key and drops a variant. The
  embedded set and rule cards collapse the same way (one card per key).
  Change: in 2.8.5 step 4 write "one new item per distinct (list owner,
  key, snapshot content); the first distinct snapshot keeps the key, each
  other gets a new key made in SQL (`'hb_' || translate(substr(encode(
  gen_random_bytes(10), 'hex'), 1, 16), '0189', 'wxyz')`, valid for
  `homebrew_key_ok`), and each entry links the copy of its own snapshot".
  Apply the same rule to the lists file import in 2.8.7 (client side, new
  key from `keyFrom`). For an embedded card variant, keep the first text
  and name that loss in 2.8.5 and 5.1, or give it the same new-key rule and
  rewrite the variant item's `set`/`refs`. Add the outcome to the layer 3
  line and a 5.1 row.

## Risks

- **plan-B7h.1-2** (B7h.1; local) `revoke execute on function
  public.lifecycle_cleanup() from public, anon, authenticated` (section 3
  step 2) leaves `service_role` with EXECUTE: Supabase's default privileges
  grant it on every new public function. The plan's own do-not and the
  acceptance "No role but the job's may execute" then fail. Change: revoke
  from `public, anon, authenticated, service_role`; in
  `lifecycle.test.mjs` assert `has_function_privilege(r, ..., 'EXECUTE')`
  is false for all three roles (`asRole` refuses `service_role`, so the
  42501 call covers only `anon` and `authenticated`).
- **plan-B7h.1-3** (B7h.1; local) The hourly job runs on the local stack
  at minute 7 during `check:db`, `restore:drill` and, in production,
  between the commit and the verify of `restore:prod`. A test that commits
  rows past their retention (`usage.test.mjs` "a seeded overdue row is
  counted", any `lifecycle.test.mjs` seed outside a transaction) can lose
  them to the job before its assertion, and a drill or a production verify
  can read a row count the job changed. Change: in step 4 state that every
  seed, the call and the assertions run in one transaction (the `asRole`
  setup pattern, invisible to the job); in step 8 add to `.claude/README.md`
  "Backups and restore" that `restore:drill` and `restore:prod` deactivate
  `dhloot-lifecycle` (`cron.alter_job(jobid, active := false)`) for the
  load and the verify and activate it after, with the edit of
  `tools/supabase/restore-drill.mjs` and `restore-prod.mjs` in "Files to
  edit", or record why a flaky verify is accepted.
- **plan-B7h.1-4** (B7h.3 outline; local) `revision` in 2.8.4 ("the
  greatest of the item's, its source's and its cards' revisions") does not
  change when a lower counter moves: item revision 5, card revision 7, an
  item edit gives 6 and the greatest stays 7. A related item's rename
  changes `related` and no revision at all. A re-read that compares it
  misses the edit. Change: define `revision` as `md5((item ||
  jsonb_build_object('related', related))::text)`, compared for equality,
  or remove it and let the re-read always draw.
- **plan-B7h.1-5** (B7h.3 outline; local) `list_notices` grants the owner
  `update (read_at)` with any value. A future `read_at` keeps the row for
  ever (the "read 24 hours ago" predicate never holds, the "unread 30 days"
  one needs null), so a client keeps a lifecycle row - the B7h.1 law
  forbids that. Change: a before-update trigger sets `new.read_at :=
  now()` when it changes, or mark read through a definer function `update
  ... set read_at = now() where read_at is null`; add the case to layer 3.
- **plan-B7h.1-6** (B7h.3 outline; local) `list_notices_broadcast()` fires
  on insert or update, and the page marks notices read on draw. A read
  update broadcasts `notice`, the owner's other devices re-read, draw, and
  update again: a ping-pong between devices. Change: send only on insert
  and on an update that changes `kind` or `created_at` (the
  `purchase_requests_broadcast` early return), and mark read only rows with
  `read_at is null`; add "a read sends no message" to layer 3.
- **plan-B7h.1-7** (B7h.3 outline; local) `get_homebrew_items` is granted
  to `anon`, but its only caller is the list rows' read of an account list,
  which is signed in; `#/s/` reads through `get_shared_list` and `#/h/`
  through `get_homebrew_item`. A 1000-id bulk read for `anon` widens the
  anonymous surface with no user. Change: grant it to `authenticated`
  only; `anon` executes four functions; update 2.8.3, the `META.md` line
  and the harness pin.
- **plan-B7h.1-8** (B7h.3 and B7h.4 outlines; local) The acceptance line
  can fail on a key collision. 2.8.2 says "when a key collides with an own
  key ... the own record wins". A reader who imported the author's file
  holds the same keys, so on `#/h/` the reader's own records replace the
  author's related items: other relation lines, links to the reader's own
  items. Change: in 2.8.2 write that on `#/h/` the answer's `item` and
  `related` win over own records (the author's namespace), and that the
  own-wins rule applies only to list rows; add the collision to the golden
  pair or a unit case of B7h.4.
- **plan-B7h.1-9** (B7h.3 outline; local) Conversion rule 3 ("a frozen copy
  whose key exactly one other account holds") is a guess, not "the
  original item" of W1-d: keys repeat only by file import, so when the
  author deleted the item and one importer holds it, the list owner's row
  links the importer's item. That gives the importer's item id (and,
  through `related`, the importer's connected items) to an account the
  importer never shared with; the importer's later edits and delete then
  change that list. Section 9 names "visible changes", not this exposure.
  Change: name the exposure in 2.8.5, section 9 and the B7h.3 decision's
  consequences. The owner decides. Recommended: keep rule 3, because the
  common case (author still holds, no importer) is the owner's goal and
  the exposed content is a copy the list owner already saw.
- **plan-B7h.1-10** (B7h.3 outline; local) The recovery path for a wrong
  conversion is not named. The reversal (2.8.5) rebuilds snapshots from
  live items, so the original frozen contents do not come back. After the
  column drop, a backup taken before the release no longer restores into
  the new schema ("The dump restores against the schema the migrations
  produce"). Change: (a) add to B7h.3 a pre-flight: before the release
  push, the owner dispatches `backup.yml`, and an agent runs `npm run
  restore:drill` on it; (b) add a read-only count of the conversion
  branches (reference, own key, one holder, none or many, copies per
  account, accounts that end above a limit) on the drilled data, recorded
  in the handoff; (c) add a "To undo `<ts>_homebrew_links`" note to
  `.claude/README.md`: down migration first, then `restore:prod` of the
  pre-release backup.
- **plan-B7h.1-11** (B7h.4 outline; local) The lists file v2 import changes
  meaning in a way the plan does not state. Every unheld homebrew entry
  becomes a new own item, so a file that imports today as frozen copies is
  refused after the release when its copies pass `homebrew_items_per_owner`
  (100) or `import_homebrew`'s 1000 rows. Change: add a 5.1 row (the
  import refused whole with the limit text, nothing written) and a 5.2
  state (an import at the item limit, one past it), and the sentence in
  the 2.8.7 `CONTRACTS.md` "Lists file" text.
- **plan-B7h.1-12** (B7h.3 and B7h.4 outlines; local) The batch file lists
  miss paths that B7h.3's gates read. `tests/e2e/admin.mjs` selects
  `list_entries.snapshot`; `flows.mjs` F15 and F17 assert the column, and
  F17 imports `example-v2.json` with a frozen copy, which B7h.3's
  `import_lists` refuses; `contract.mjs` and `tests/db/realtime.test.mjs`
  send `snapshot: null`; `tests/db/limits.test.mjs` and
  `restore-drill.test.mjs` pin `snapshot_bytes_per_list=1048576`. B7h.3's
  gate runs `npm run e2e`. Also 4.3 (`lib/cloudLists.ts`, `lib/bundle.ts`)
  and 4.4 ("the write buffer's frozen path goes", "The lists file: export
  and import of 2.8.7") both claim the foreign add and the lists file
  import. Change: put the foreign add, the lists file export and import,
  and every file above in B7h.3, the batch that changes the server
  contract, so its e2e is green; leave B7h.4 the screens.
- **plan-B7h.1-13** (B7h.4 outline; local) Texts become false after W1, and
  the plan keeps them. `hbImportUpdateNote` (RU and EN) says "frozen copies
  do not change", but after W1 no frozen copy exists and an update changes
  the item in other players' lists. The delete confirms (`FEATURES.md`
  "Homebrew": «Они пропадут и из ваших списков», «Предмет «%s» есть в N
  списках...») name only the author's lists, but a delete now removes rows
  from other players' lists, and their quantity, price and both notes go
  with no record. Change: add new RU and EN texts for `hbImportUpdateNote`
  and the delete confirms that name other players' lists (no count; the
  count stays Deferred). Name in 5.1 that a cascaded row loses its
  quantity, price and notes. Optional: keep them in the notice as a
  `row jsonb` and show them.
- **plan-B7h.1-14** (B7h.4 outline; local) The reader's «Печать» on `#/h/`
  (m03, 4.4) meets D70: the print address holds keys only, and the
  per-view index closes when the page is left, so the sheet has no card.
  Section 1 makes print routes for another account's items a non-goal.
  Change, recommended (a): draw no «Печать» for another account's item on
  `#/h/` until R9, and update m03. Alternative (b): keep the button and
  widen D70's Where and What to `#/h/` in the same change.

## Nits

- **plan-B7h.1-15** (B7h.1; local) Step 6 edits `tests/db/usage.test.mjs`
  after step 5's `check:db`, so rule 2m needs a second `check:db` (about
  10 minutes; the gate total becomes 33, not 23). Change: do step 6 before
  step 5.
- **plan-B7h.1-16** (B7h.1; local) Add a "To undo
  `<ts>_lifecycle_cleanup`" note to `.claude/README.md` beside the other
  undo notes: revert the app alone is enough; the reversal brings back the
  write-time delete and does not restore deleted rows.
- **plan-B7h.1-17** (B7h.1; local) A6 keeps the 400-day delete of
  `usage_snapshots` in the nightly workflow, but the law text in 2.7 and
  step 7 says "deleted by the database on a schedule". Change: move that
  delete into `lifecycle_cleanup()` (one line, `usage.mjs` loses it), or
  word the law "on the backend: the database job, or the backend workflow
  that owns the table".
- **plan-B7h.1-18** (B7h.1; local) The law says a client never deletes a
  lifecycle row, but «Скрыть» and «Скрыть изменения» (2.8.6) delete
  notices. Change: add to the law text "a reader's explicit delete is not
  lifecycle logic".
- **plan-B7h.1-19** (B7h.1; deferred-scope) The usage watch detects only
  overdue rows; a job that fails every hour with nothing due is silent.
  Optional: `warn` also when the newest `cron.job_run_details` row of the
  job has `status = 'failed'` or is older than 2 hours.
- **plan-B7h.1-20** (B7h.3 outline; local) 2.8.3 "definer" rows do not
  name `set search_path = public, pg_temp`, `revoke execute ... from
  public` before the grant, or the keys the answer must not hold
  (`owner_id`, `book_id`, `created_at`). Add them, and a layer 3 case that
  the answer of `get_homebrew_item` has no `owner_id`. Use a fixed cap
  (1000, as `get_homebrew_items`) for `related`, not
  `effective_limit(o, ...)`, so an author above the limit after the
  conversion still gets every relation.
- **plan-B7h.1-21** (B7h.3 outline; local) The `get_shared_list` row must
  read the book and cards of the item's owner (`i.owner_id`), not
  `v_list.owner_id` as the shipped body does; write that in the row.
- **plan-B7h.1-22** (B7h.3 outline; local) `META.md` section 3 "An own item
  opens for its author alone" becomes false; name that sentence in B7h.3's
  `META.md` edit. In the B7h.4 privacy text, say that one item's link also
  opens the items it relates to.
- **plan-B7h.1-23** (B7h.3 outline; local) The fake seed change ("gm2
  links gm1's axe; a notice of each kind") alters what gm2's list pages
  draw in B7h.3, which runs no golden compare; B7h.4 then re-seeds a drift
  it did not cause. Change: move the seed change to B7h.4, and test the
  fake in B7h.3 with vitest fixtures.
- **plan-B7h.1-24** (B7h.4 outline; local) 5.1 names «Предмет не
  загрузился» and «Не получилось сохранить предмет себе...», which are not
  keys in `lib/dict.ts` and are absent from the 4.4 string list. Add both
  with EN texts. Add `limitSnapshots` (RU and EN) to the removed keys.
- **plan-B7h.1-25** (B7h.3 outline; local) W1-e says "one mechanism and one
  view shared with requests"; 2.8.6 builds one view, one clean-up and one
  topic pattern, but a second table. Name it in 2.8.6 and in the B7h.3
  decision's rejected alternative: one table for requests and notices,
  rejected because requests are written by `anon` with lines and a status,
  and notices by triggers.
- **plan-B7h.1-26** (B7h.4 outline; deferred-scope) Two 5.1 rows are
  missing: «Добавить в список» of an item that the author deleted meanwhile
  (FK `23503`, the buffer's text), and the reader's buffered edit of a row
  that the cascade removed.

## Deviations

- Handoff: the 2026-10-02 single batch `B7h.1` is gone; items 2.1-2.6 move
  to `B7h.5` and `B7h.6`, because owner R2 moves the search and the counter
  onto the tabs. Accepted: R2 requires it, and every item keeps its
  acceptance line (C1-C8 in 4.5 and 4.6).
- Handoff matches `.claude/templates/handoff.template.md`: every section is
  present.

## Standing checks

1. Scale: checked - section 3 standing check 1 (no screen; 3x as 150 lists,
   30 pending per list) and 5.2. The B7h.1 answer holds. Missing states:
   an import at and one past the item limit (plan-B7h.1-11); the `related`
   cap for an author above the limit (plan-B7h.1-20). The 5.2 rows at 0, 1,
   7, 8, 300 and the 360 px fold rule are present.
2. Error scenarios: checked - section 3 check 2 and 5.1 against each write
   path in scope (the job, `create_purchase_request`, the conversion, the
   cascade, the notices, the lists file import). Found: an unnamed content
   loss (plan-B7h.1-1, blocker); a lifecycle row a client can keep
   (plan-B7h.1-5); no recovery path for a wrong conversion
   (plan-B7h.1-10); the job against tests and restore verifies
   (plan-B7h.1-3); cascaded row notes (plan-B7h.1-13); two missing rows
   (plan-B7h.1-26).
3. Consistency: checked - 5.3 against `FEATURES.md` "Consistency rules"
   and the delete confirms of "Homebrew". The named departures (no topic on
   `#/h/`, the panel heading) have reasons. Found: stale import and delete
   texts (plan-B7h.1-13); a print button that fails (plan-B7h.1-14);
   "one mechanism" not named (plan-B7h.1-25).
4. RU/EN parity: checked - the strings of 4.4, 4.5 and 4.6: both languages,
   both plural sets of `noticesN`, ASCII punctuation, «ёлочки» in RU and
   straight quotation marks in EN. Found: two texts with no key and no EN
   (plan-B7h.1-24); `hbImportUpdateNote` false in both languages
   (plan-B7h.1-13). B7h.1 has no string.

Owner answers (section 10): R1 met (R7h first, R9 and R8 notes in their
Status); R2 met (4.5 C2-C5, C8); R3 met (B7h.1); R4 met (B7h.2); W1-a met,
with the exposure of plan-B7h.1-9 to name; W1-b met; W1-c met, the lost
notes to name (plan-B7h.1-13); W1-d met except plan-B7h.1-1 and the
guess of plan-B7h.1-9; W1-e met in the view, with plan-B7h.1-25 to name;
the acceptance line met by 4.4's golden pair and contracts probe, after
plan-B7h.1-8; W2 met (mechanism with options, law, audit A1-A10); W3 met
(tabs, one import, the subset downloads kept by P12); W4 met (2.10); W5
met (B7h.2); schema freedom used where needed and refused for
`homebrew_cards` with a reason; W6 met (2.11, P10, P11). No user-visible
feature is dropped without the owner's yes; the reader's «Печать» on `#/h/`
is a new control, not a dropped one.

Batch splits: each split names a criterion from `.claude/README.md`, "Batch
size and the fixed cost of a run": B7h.1 from B7h.3 "a review that could
not be held in one pass" (the R0b seam) plus owner R3 and R4; B7h.3 from
B7h.4 the schema batch rule (`plan.prompt.md`) and a public contract;
B7h.5 and B7h.6 a different route and filter set and a public contract.
The totals add up (23 + 9 + 27 + 68 + 63 + 59 = 249), except plan-B7h.1-15.

pg_cron fallback (section 3 step 1): adequate. A local failure stops
before any migration, a hosted failure stops at `db:push --project test`
before production, and option C goes back to the planner. The probe costs
one more `db reset --local` (about 1 minute), which the gate table does not
count.

## Suggested next action

The planner applies plan-B7h.1-1 to plan-B7h.1-26 (`local` ones in
`plan.md`, `deferred-scope` ones to the handoff's Deferred), and puts the
plan-B7h.1-9 question to the owner in the plan's Status with the
recommendation. Then the orchestrator dispatches the implementer for B7h.1
with the B7h.1 findings (2, 3, 15, 16, 17, 18) applied. No second plan
review.

## Checks still needed

- Section 3 step 1: the `pg_cron` probe on the local stack and the schema
  clause in the Supabase docs for the pinned CLI (a reviewer cannot run
  it).
- After the B7h.1 batch review: `npm run db:push -- --project test`
  creates the extension on the hosted test project, and `npm run e2e`
  passes.
- B7h.3: the pre-flight branch counts on a drilled production backup
  (plan-B7h.1-10).
