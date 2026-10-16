# Review - plan before B2 (debt-cleanup)

Verdict: fix-then-continue
Reviewed: 5b72cec0658bc644a79ded8fb01a403721bf41ca
Scope: plan before B2

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Read: `CLAUDE.md`; `issues/debt-cleanup/context.md`, `plan.md` (Status with the plan-review
line, 2.1, 3.10.1-3.10.4, 4.2, 6, 7 split criteria and gate cost, 7.2, 8, 10), `handoff.md`
against `.claude/templates/handoff.template.md` (every section present), `reviews.md`,
`reviews/B1.md`; the migrations `20260925120000_delete_account.sql`,
`20261002120000_read_scale.sql`, `20261014120000_homebrew_art.sql` (the newest
`get_shared_list(text)`), `20260928120000_purchase_requests.sql` (keys, indexes, triggers),
`20261007130000_homebrew_links.sql` (`hb_item` on delete cascade, `homebrew_item_record`);
`origin/main`'s migration list (newest `20261014120200`; no later file redefines
`get_shared_list`, `delete_account` or the request tables); `docs/specs/CONTRACTS.md` (`#/s/`),
`META.md` (the `anon` functions), `FEATURES.md` ("Account"), `DEBT.md` (D83, D85, D98),
`COVERAGE.md` ("What is enforced"); `app/src/state/sharedView.svelte.ts`,
`ownerRequests.svelte.ts` (`read`), `lib/cloudLists.ts` (`SharedRow`, `sameProjection`),
`ports/supabase.ts` (`shares.read`, `deleteAccount`, `keepaliveFetch`), `ports/cloud.contract.ts`
(the share cases and the GM-only case), `AccountPage.svelte` (`deleteAccount`), `dict.ts` (the two
account toasts); `tests/db/delete-account.test.mjs`, `harness.test.mjs`
(`EXPECTED_ANON_FUNCTIONS`), the pin maps of `list-shares.test.mjs` and `homebrew.test.mjs`;
`components/homebrewPage.timed.test.ts`, the sibling case in `homebrewPage.test.ts`,
`HomebrewCards.svelte` (no member cap); `tools/supabase/lib.mjs` (`supabaseCli`),
`db-push.mjs`; `.github/workflows/ci.yml` (`migrate-test`, `migrate-prod`); `.claude/README.md`
(the `db:push` row, "Branch migrations on the test project", "Backups and restore");
`.claude/prompts/orchestrate.prompt.md` ("Schema batches"). Working tree clean at HEAD. No
check was run (read-only; Supabase not started).

## Blockers

1. The hosted and fake proofs of both new functions can pass with the functions absent
   (`plan.md` 3.10.1 port paragraph, 7.2 step 3, the D85 and D83 acceptance lines).
   - The planned `cloud.contract.ts` case runs "after the share cases". That list holds only
     `ci1` and `q1` (no linked homebrew entry), so `heldSnapshots` is empty and the re-read is a
     whole read on both adapters.
   - The fake writes no `rev`, so on the fake `heldSnapshots` is always empty. The fill path
     runs in no component test, contract case on the fake, or browser suite. B1 made the fake
     mirror `load(known)` and `list(held)`; this departs from that pattern with no reason in
     the plan.
   - The port takes today's calls on `PGRST202` with no sign. If the test push fails or is
     skipped, the D85 contract case, case E (`deleteAccount`) and every e2e flow pass against a
     test project that has neither function.
   Change:
   - 7.2 step 3: put the D85 contract case on a list with a linked homebrew entry that the
     link shows (the GM link of the "gm only" case, or a new entry with `hb_item` and no
     `gm_only`). Assert that the first read's homebrew entry carries a string `rev`, that
     `heldSnapshots(first).size > 0`, and that the re-read deep-equals the first read.
   - 3.10.1 and 7.2 step 3: the fake mirrors the rule. Its projection writes `rev` as any
     deterministic opaque string of its own snapshot (for example a hash of its JSON text), and
     `read(token, since, held)` leaves out `snapshot` where `held` names that `rev`. The client
     treats `rev` as opaque, so the fake need not match `md5`. `fake-cloud.test.ts` gains the
     strip case; expectations that `toEqual` a fake share read gain `rev`. Trade-off accepted:
     more fake code and expectation churn, for one fill path on every adapter.
   - 7.2 step 3, `tests/e2e/contract.mjs`: make the two checks raw RPC calls that fail on any
     error. `rpc('get_shared_list', { p_token: 'nonsense', p_since: null, p_have: {} })` answers
     `error === null` and `data === null`. As the signed-in test user,
     `rpc('delete_account_requests')` answers `error === null` and a number. A `PGRST202`
     here then fails the run, so a missing push cannot hide behind the port's fallback.

## Risks

1. The test push command will likely fail on this host (7.2 step 10, the verification block,
   the B1-7 acceptance line).
   - The command has no env file. `SUPABASE_DB_PASSWORD_TEST` is in the main checkout's
     `.env.test.local`, not in the shell (`.claude/README.md`, the `db:push` row and the
     paragraph after the table).
   - `.claude/README.md` records that `db-push.mjs` fails on this host with
     `LegacyDbConfigIpv6Error` (2026-10-07). It also refuses while another branch's migration
     sits on the test project. The recorded working path is `tools/supabase/migrate-test.mjs`
     with `SUPABASE_DB_URL` set to the session pooler string.
   - B1-7's acceptance line "the test push ran from this worktree" then fails for a reason
     that is not B1-7's.
   Change: in step 10 and the verification block, write
   `node --env-file=E:/dev/daggerheart-loot/.env.test.local tools/supabase/db-push.mjs --project test --yes`
   from the worktree. Name the fallback: on `LegacyDbConfigIpv6Error` or a refusal for remote
   versions, use the `migrate-test.mjs` path that the README records, and record which path
   ran. Change the B1-7 line to "the CLI started from this worktree through `supabaseCli()`
   (its own output in the log, the IPv6 error included)". A successful push is then
   evidence for step 10, not for B1-7.

2. The plan has no path for a failed push or e2e after the batch review (7.2 step 10, the
   do-nots). The acceptance lines for the hosted contract and case E are checked only after the
   approve. `migrate-test` applies by version. If a migration body changes after the test
   project applied it, the new body never reaches the test project, and a rename leaves an
   orphan that only the owner can clear (`.claude/README.md`, "Branch migrations on the test
   project").
   Change: add to step 10 and the do-nots: "A failed push or e2e reopens the batch. Record
   it, fix, amend and run the gates again. A change under `supabase/migrations/` needs a new
   approve (rule 2r). Once the test project has applied the two files, a change to their
   behaviour is a new migration, never an edit or a rename. The orchestrator stops for the
   owner when that is not possible."

3. The named data loss has no test that proves the recovery path (3.10.2, 4.2 item 2, 7.2
   steps 5-6). The table says that a failed `delete_account()` after the loop leaves the
   account without its requests, and that a second press resumes. No planned case proves the
   resume, or proves that the prune deletes nothing but requests.
   Change:
   - Step 6, `supabase.test.ts`: prune answers 200 and 0, then a `delete_account` error,
     answer `failed` with no sign-out. The next `deleteAccount()` call (prune 0,
     `delete_account` ok) answers ok and signs out.
   - Step 5, `delete-account.test.mjs`: after prune calls until 0, the caller's lists,
     entries, shares, items and print sets keep their counts, and only `purchase_requests`
     and `purchase_request_lines` of the caller's lists are 0.
   - Add one acceptance line for both cases.

4. Step 0's 80 % rule can pass on a double count (7.2 step 0). I am fairly sure, not certain,
   that the time EXPLAIN ANALYZE gives a referential-action trigger includes the time of the
   cascades that its own query fires. The two `purchase_requests_*_fkey` lines then include the
   `purchase_request_lines` time, so the three lines summed can pass 100 % of the total. A false
   pass costs only steps 5-6's work before the stop condition fires, but the rule does not
   measure what it names.
   Change: in the same rolled-back transaction, time
   `delete from public.purchase_requests where list_id in (select id from public.lists where owner_id = '<BIG>')`,
   then `delete from auth.users where id = '<BIG>'`. Rule: the second delete stays under 2 s (half
   the test's 4 s). Else D83's steps stop for the planner. Keep the EXPLAIN lines in the handoff
   as the breakdown.

5. `deferred-scope` (B5 closeout) - the release can be blocked by the migration order.
   `migrate-prod` runs `supabase db push` with no `--include-all`. If `main` gets a migration
   later than `20261015120100` before this task ships, production refuses B2's two files. After
   the test push, a renumber leaves an orphan on the test project. Change: add a line to B5's
   closeout acceptance, before the backup run: "`origin/main`'s newest migration sorts before
   B2's two files; else stop for the owner."

## Nits

1. `local` - 3.10.1 "Records" and 7.2 step 9 say that `META.md` lists five `anon` functions.
   `META.md` says four (lines 137 and 217), and `harness.test.mjs` already holds six
   (`get_item_preview(uuid,text)` and `get_shared_list_preview(text)` came with link-previews).
   After B2 the count is seven. Write "seven", and make both `META.md` sentences name the two
   preview functions too.
2. `local` - 4.2 item 1: a loop that stops at an answer of 0 makes 24 prune calls at 3x (23 that
   delete, one that answers 0) and 4 at the defaults (200, 200, 100, 0), not 23 and 3. Correct
   the figures. Do not stop at "below 200": that copies the SQL constant into the client.
3. `local` - 3.10.1 port paragraph: state the outcome of a second unfillable answer. It answers
   `{ ok: false }`, so the shown list stays and no third call is made.
4. `local` - 3.10.3: the 60 000 ms timeout is set from a time measured alone. This case timed
   out inside the full coverage run before (`DEBT.md`, D98). Record the case's time inside
   `check:2` too, and set the timeout to at least three times the larger figure. Write both
   figures in the closing comment.
5. `local` - 3.10.3 "Records": `COVERAGE.md`, "What is enforced, and by what", says
   "`expectNoA11yViolations` in every component test". Add the timed exception to that row too.
   It is already untrue for `listPage.timed.test.ts` and `importPanel.timed.test.ts`.
6. `local` - `sharedListPage.test.ts` (the `cloud.shares.read = (token, since) =>` stub) and
   `sharedView.test.ts` (the `read` bind) wrap the port with two arguments. Forward `held`, so
   that a later case through these stubs does not lose it silently.
7. `local` - 7.2 step 10: HEAD is the refresh commit `5b72cec0`, not B1's `7430de8e`. "An amend
   of the task's HEAD" gives the B1 subject to a second commit. Say that the amend turns
   `5b72cec0` into the B2 commit with its own subject, and that the closeout squash writes the
   one task subject.
8. `local` - 7, the release step: "a fresh `backup.yml` run" does not say to wait for it. Write:
   wait until the run ends with `success`, record its run id, and stop the push on any other
   result.
9. `local` - B1-7 makes the phrase "(the tools' own entry)" in `.claude/README.md`'s hook table
   (rule 2n, `node <...>/supabase/dist/supabase.js`) inexact: after B2 only CI's `migrate-prod`
   runs the wrapper. Change the phrase in step 9's README edit. The matching itself stays.

## Deviations

The handoff records no deviation for B2 (not started). The choices of the refresh before B2
(`plan.md` 10), judged:

- D83's account delete and D98 join B2: accepted. They share `check:db`, the plan review, the
  test push and e2e, and no split criterion separates them.
- D85 as an invoker overload that calls `get_shared_list(text, bigint)` with no copied body:
  accepted. R8's `img` and the GM-only rule stay in one body.
- D98, the timed case without axe: accepted. `HomebrewCards.svelte` draws every member in one
  `<ul class="members">` with no cap or fold, so the sibling case's own, book and gone rows reach
  the same markup and rules as 400 rows. Only the count text differs, which axe does not judge.
- B1-1, B1-2, B1-3, B1-5, B1-6, B1-7 and both B1 checks each have a step and an acceptance line.
  B1-4 goes to B4. B1-3's rule drops a whole older read once a newer read applied any part. A
  newer read with failed requests then keeps the shown requests until the next read. That is a
  delay, not a loss: accepted.

The dispatch questions:

- Data exposure of the overload: none. It is security invoker over the definer
  `get_shared_list(text)`, which keeps the token check and the GM-only drop. `rev` is the `md5`
  of a snapshot that the same caller already receives with `p_have` `{}`. It is an identity,
  not a secret, so a guessed `p_have` reveals nothing that a whole read does not. A players'
  link has no GM-only entry, so it has no `rev` for one. `p_have` that is not an object or is
  over 64 KiB counts as `{}`. The lookup is one jsonb key search per entry, and the gateway
  bounds the body before the function runs. `hb_item` cascades on an item delete, so an entry
  with `hid` always has an object snapshot. `homebrew_item_record`'s card `jsonb_agg` has no
  `order by`, so a `rev` can change with no edit; plan section 6 accepts this (a re-download
  only).
- Data exposure of `delete_account_requests()`: none. It is security definer with a fixed
  `search_path`. It refuses a null `auth.uid()` with `28000`. It deletes only requests reached
  through the caller's own lists (`list_shares.list_id` and `purchase_requests.share_id` are
  not null and cascade). `EXECUTE` is revoked from `public` and `anon`. A share holder's
  requests on the caller's lists are the caller's to decline, and the account delete removes
  them anyway.
- Client fallbacks: `PGRST202` on the shared read takes today's calls, once per tab, then
  sticks. `migrate-prod` runs before `deploy`, so this covers a revert and a stale schema.
  The unfillable answer makes one whole read (Nit 3). Blocker 1 is the gap here: the fallback
  also hides a missing function in every test.
- The account-delete loop: a prune error or timeout answers `failed` with the one error toast,
  and the confirm stays. Each later press resumes from what the database holds. A hosted
  timeout of one 200-request call repeats on each press; the local 4 s bound against the hosted
  8 s accepts this. Two tabs that press at once can deadlock one call, and that tab shows the
  error toast while the other finishes. The user sees the busy page for about 25 s at 3x, with
  no new string.
- Gates: `check:fast`, `check:1`, `check:2`, `check:built`, `check:db` under the hang guard with
  the 3x seed, the timed file, the tool tests, then the push and e2e after the approve. This
  matches `orchestrate.prompt.md`, "Schema batches". Risks 1 and 2 cover the push.
- The backup before the release push: planned in 7. Nit 8 adds the wait and the record.

## Standing checks

1. Scale: checked - 4.2 item 1 against the SQL and the seed. At 3x, 300 held entries send
   about 23 KB of `p_have`, so about 860 entries fit under 64 KiB. One prune call deletes at most
   200 requests (60 000 lines at `request_lines` 300), and `ACCOUNT_DELETE_CALLS_MAX` 100 covers
   20 000 requests. The busy state lasts about 25 s at 3x. No screen draws differently, so no
   width or keyboard state applies. Finding: Nit 2.
2. Error scenarios: checked - the 4.2 table against the two functions, the port and
   `SharedView`: `PGRST202` on both functions, an unfillable answer, out-of-order re-reads, a
   stale tab, a revert, a failed or timed-out prune call, a failed final step, a request sent
   during the loop, another tab's delete. The one loss (the requests before a failed final
   step) is named and accepted. Findings: Risk 3 (no test proves the resume), Nit 3, and the
   two-tab deadlock above, which loses nothing beyond the named loss.
3. Consistency: checked - `FEATURES.md` "Account" (every action disables the buttons, the one
   error toast, «Аккаунт удалён.»), the B1 read-order rule (now in four stores),
   `CHANGED_ROWS_MAX` untouched, the `check:db: FAIL - ...` and `restore: FAIL - ...` shapes.
   Finding: the fake's parity departs from B1's `known`/`held` pattern (Blocker 1).
4. RU/EN parity: not applicable - B2 adds and changes no user-visible string. `accountFailed`
   and `accountDeleted` exist in both languages (`dict.ts`).

Owner rules: checked - Q2 = A has its home in the decision file "A shared page re-read names
its held snapshots by hash". The refresh-before-B2 tags have their homes in `FEATURES.md`
"Account" and the D83 and D98 decision files. Every `check:db` runs under the hang guard
(7.2 verification). `.claude/README.md` stays net zero (two undo paragraphs inside B1's 7
lines). The plan reviews before B1, B2 and B3 are in Status. No rule is missing or over
budget.

## Suggested next action

Fix-then-continue. The planner applies Blocker 1, Risks 1-4 and Nits 1-9 in `plan.md` 3.10,
4.2, 7 and 7.2, and places Risk 5 in B5's closeout acceptance. Then the implementer runs B2 with
no second look.

## Checks still needed

- Step 0: the direct timings of Risk 4 and the EXPLAIN breakdown. Whether the trigger lines sum
  past the total shows whether the inclusive-time reading above is right.
- Which push path works on this host now (`db-push.mjs` or `migrate-test.mjs`), and whether the
  test project holds other branches' versions (the `migrate-test` log lists them).
- The 3x prune timings (the slowest call and the final `delete_account()`) under `'4s'`.
- The timed homebrew case's time inside `check:2` (Nit 4).
