# Review - plan before B3.1 (persist-3-realtime)

Verdict: fix-then-continue
Reviewed: 90fcfc0367767eb9b9460d43f57ac83f9b6630df
Scope: plan before B3.1

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

The design holds: the share policy, the owner policy, the missing `insert` policy, the deferred trigger that sends one message per list, the fixed `search_path`, the revoked `EXECUTE` and the tolerant reorder are sound. Two plan edits are needed before the implementer starts. Both are text changes to `plan.md` section 10. They do not change the design.

## Blockers

B1. The tolerant `reorder_list` on the shared test project breaks every other branch's `e2e`, and `main`'s deploy with it, until R3 ships.
- Step 4 changes the behaviour of an existing function. After the push that follows the approval, the test project answers `ok` to a stale reorder.
- `main`'s `cloud.contract.ts` case G (lines 145-153) asserts `refused,ok` for `{ op: 'reorder', ids: [c, a] }`. Every `e2e` run from `main` or another branch fails with "lists: a reorder that misses an entry, then a rename, answered ok,ok".
- `migrate-prod` and `deploy` need `e2e` (`ci.yml`, `needs: [..., e2e]`). From B3.1's test push until R3's closeout push, no other change can deploy.
- `.claude/README.md` ("Branch migrations on the test project") promises that "`main`'s runs stay green while a branch is open". This migration breaks that promise. The plan does not name the window.
- Required plan edit: choose one of these options, name the window, and give the owner the decision if it costs a commit.
  - Recommended: a precursor commit on `main`, pushed before B3.1's test push, that changes case G's refused write to the duplicate `add`. That write is refused under both rules. The commit also removes the stale-reorder assertion. Reason: `main` stays green under the old and the new `reorder_list`. Trade-off: one more commit and a push before closeout, which is the owner's call (`CLAUDE.md`).
  - Alternative: a stated freeze - no push to `main` and no other `npm run e2e` between B3.1's test push and R3's closeout. The owner is told. Recovery is the reversal file against the test project.

B2. The prescribed header read can fail the owner's commit. This contradicts "a send never fails the owner's write".
- Section 5.4 and step 2 give `current_setting('request.headers', true)::jsonb ->> 'x-dhloot-tab'`.
- A session that set `request.headers` in an earlier transaction reads `''`, not `NULL`, after that transaction ends. The cast `''::jsonb` raises `22P02`.
- The trigger is deferred, so the error fires at COMMIT, outside `apply_list_writes`'s per-write handler. The whole request fails, and the buffer retries it with the same result.
- PostgREST always sets the value, so a hosted app write is safe today. Other paths are not safe: `tests/db`'s one-connection `sql` (certain after the `tab-1` case in step 7), the dashboard SQL editor, and any later job.
- Also, only `realtime.send` catches its own errors. An error in the trigger body (the header parse, a lookup) is not caught.
- Required plan edit, step 2:
  - Read the header with `nullif(current_setting('request.headers', true), '')`.
  - Parse it inside `begin ... exception when others then v_by := null; end`.
  - Wrap the send section so that an unexpected error raises a warning, not an error.
- Required plan edit, step 7: add one case. On one connection, commit a transaction that sets `request.headers`. Then a later committed write with no header commits and sends `by: null`.

## Risks

R1. The step 1 fallback (a) covers too few reset sites.
- If `db reset` drops the realtime tables (CLI issue 1073), the plan restarts the container only in `roles.mjs` `resetLocal()` and in `run.mjs`.
- `restore-drill.test.mjs` and `restore-prod.test.mjs` reset through their own helper, and `tools/supabase/restore.mjs` resets too.
- `usage.test.mjs` runs last, after the reversibility resets, and its new `realtime.send` case needs `realtime.messages`.
- With the fallback active, about eight restarts of up to 60 s each can push CI's `db` job (`timeout-minutes: 20`) near its cap.
- If the fallback is taken, list every reset site, re-measure, and raise the CI timeout if needed.

R2. The step 1 spike (a2) proves only the CLI's reset path. The reversibility walk (`applySql`), `apply-pending` and CI's `migrate-test` apply the file on a plain `postgres` connection. `create policy on realtime.messages` needs the table's owner rights. Add to the spike: apply the policy statement through the `DHLOOT_DB_URL` connection, and drop it again. The hosted proof is the test push after the approval.

R3. Spike (b) has no fallback.
- If `supabase status -o json` gives no HS256 JWT secret (a CLI with asymmetric signing keys), `jwtFor` cannot sign. Extend the `gotrue` fallback (sign in a seeded user) to cover (b), not only a JWT error in (c).
- `jwtFor` needs `exp`, `role`, `sub` and `aud`. Realtime checks `exp`.

R4. The overlap list in section 15 is incomplete.
- The claim for `app.svelte.ts` holds. `main`'s working diff touches only the preference fields, the setters and the new `shown*`/`show*`/`*Changed` members.
- `display-settings` also edits `docs/specs/FEATURES.md`, `docs/specs/COVERAGE.md`, `docs/specs/STATE.md`, `docs/DECISIONS.md`, `app/src/state/app.test.ts`, `tests/app/states.js`, `tests/app/inventory.js` and component tests.
- B3.1 edits `FEATURES.md`, `COVERAGE.md` and `DECISIONS.md`. B3.2 edits `states.js`, `inventory.js`, `STATE.md` and probably `app.test.ts`.
- The serial order (R3 starts on `main` after `display-settings` ships) makes the overlap safe. The acceptance line "`B3.1` edits no file that section 15 lists" is true, but it checks nothing. Complete the list and state that the serial order is the mitigation.

R5. For the B3.2 refresh: a player share's `revision` also moves on a GM note edit. The planned status region (6.5) would say «Список обновлён» for a change that the player cannot see. The poll has the same effect today. The B3.2 planner decides whether to compare the drawn content.

R6. `check:db` was 403-520 s before Realtime. Two more containers and the new WebSocket cases will exceed the 600 s tool cap. The plan accounts for this (gate credit by exit). CI's 20-minute job timeout is the hard limit.

Checked and sound, with no finding:
- Both trigger functions: `security definer`, `set search_path = public, pg_temp`, `realtime.send` schema-qualified, `EXECUTE` revoked from `public`, `anon` and `authenticated`. The harness invariant still holds.
- The policies: share topics accept only `^share:<lowercase uuid>$`, for `broadcast` only. The owner topic accepts only `'owner:' || auth.uid()`, and `anon` has a null uid, so no match. No `insert` policy exists.
- The `realtime` schema is not in `[api] schemas`. The payloads carry no token, no list id and no user id on a share topic.
- Deferred-event semantics: an aborted subtransaction discards its queued events. A rollback sends nothing. The `list_shares_gone` inserts roll back with the subtransaction.
- The tolerant rule keeps the owner check and the `list_id` filter. `apply_list_writes` still answers `gone` for a missing list.
- Gate order: check, check:db, commit, then the test push and `e2e` only after the approval (rule 2r).
- D56 has its own acceptance line. R11's `realtime_rows_24h` has its own line.

## Nits

- N1 (`local`): the new case G reorder `[c, a]` reads back `c, a, b`. That is the order before the call, so the case passes even if the reorder does nothing. Use `[a, c]` and expect `a, c, b`, or use `[b, c]` and expect `b, c, a`.
- N2 (`local`): in `lists_broadcast`, the not-found branch takes `old.owner_id`. For a list created and removed in one request, the first event to fire is the INSERT event (`old` is null), and the dedup skips the DELETE event. The topic is then `NULL`. Use `coalesce(new.owner_id, old.owner_id)`.
- N3 (`local`): after D56 is deleted, the intro of the `DEBT.md` "Live updates" section still names D56. Reword it in the same edit.
- N4 (`local` for the test, B3.2 for the comment): the tolerant reorder makes two texts stale. One is the `cloudLists.test.ts` title "says the entry limit alone when the refused add is followed by its reorder". B3.1 edits that file, so retitle it there. The other is the `cloudLists.svelte.ts` `#send` comment "the reorder's refusal must not replace the limit text". B3.2 edits that file, so fix it there.
- N5 (`local`): owner answers Q2 and Q3 have no decision file. Q3 amends "Realtime is the primary live path; the 45 s poll runs while it is down" (a 5-minute re-read while `live`). Q2 is an exception to "Supabase configuration is code". Place both in step 11, or name them in B3.2.
- N6 (`local`): the owner-topic decision file is named `2026-09-25-...`, but the owner answered Q1 on 2026-09-26.
- N7 (`local`): step 8, "an unknown id (`EB`) is ignored". Also assert that user B's entry keeps its position. This proves the `list_id` filter under `security definer`.
- N8 (`local`): spike step (c) sends "from `psql` as `postgres`". This host has no `psql` client on the path. Name the tool: `docker exec supabase_db_<id> psql` or a Node `postgres` script.
- N9 (`deferred-scope`): the handoff Status reads "Task status: planned", which is not one of the template values.

## Deviations

- `B3.1` edits four `app/` files (`fake-cloud.ts`, `fake-cloud.test.ts`, `cloud.contract.ts`, `cloudLists.test.ts`). Accepted: `B3.1`'s `e2e` runs the contract against the tolerant function, so the fake and the contract must change with it.
- The roadmap (`issues/persistent-storage/plan.md`, section 12, the specs-to-batch table) places the `FEATURES.md` shared-page live-update text on `B3.1`. This plan puts it on `B3.2`, where the behaviour ships. Accepted: this plan is R3's authority. Record it at the roadmap compaction during closeout.

## Suggested next action

1. Send B1 and B2 to the planner. The B1 option is the owner's decision: give the recommended precursor commit and the freeze alternative.
2. The planner also applies N1-N8 and the section 15 correction from R4.
3. Run a second-look plan review (`reviews/plan-B3.1-2.md`) before the implementer. `agent-guard.mjs` needs `Verdict: approve`.

## Checks still needed

- The step 1 spike results (a), (a2), (b) and (c), plus the extra (a2) run through `applySql` from R2. Record them in the handoff before step 2.
- After the approval of the implemented batch: the test push, then `npm run e2e`, with B1's chosen mitigation in place first.
