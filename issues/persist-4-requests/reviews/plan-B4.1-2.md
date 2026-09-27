Verdict: approve
Reviewed: 9ef4d385681ce383806a478c041a6a33a50e8b58
Scope: plan before B4.1

# Review - plan before B4.1, second look (persist-4-requests)

B4.1 can start after R3's closeout push. Planning pass 3 resolves all three blockers and all ten risks as `reviews.md` states. The fixes add one new defect: the renumber call from Blocker 3 can deadlock two applies on the same list. It causes a retryable refusal, not data loss, and a one-line lock fixes it. The implementer takes that line and three small nits into B4.1, and the B4.1 batch review checks them. None of them needs a third plan pass.

## Blockers

None.

Each first-review blocker is resolved:

1. **Client-made id and replay (Blocker 1): resolved.** The plan changes 5.1 (the `id` has no default), 5.2 (signature `(p_id uuid, p_token text, p_lines jsonb)`, step 3 replay, step 10 `on conflict (id) do nothing returning id`), 6.1 `send(id, ...)`, 6.2 (the id is kept after `network` and dropped otherwise), the harness pin `create_purchase_request(uuid,text,jsonb)`, `COVERAGE.md`, the replay cases and the acceptance. The replay path is safe:
   - It runs after the token check and under the list lock. A replay racing its own original on the same list waits for the lock and then finds the row.
   - It skips the bounds only when nothing is inserted.
   - An id on another share gets the generic `P0002`. An id taken on another list between the step 3 read and the insert, outside the lock, also gets `P0002` through `on conflict ... returning`.
   - A uuid cannot be guessed, so the distinction leaks nothing.
2. **Stock found by `list_id` and `item_key` (Blocker 2): resolved.** `entry_id` is gone from the table, from 6.1 and from the roadmap row. The layer 3 cases cover an entry re-added under a new id, an entry moved to LA2, and B's own `ci1`.
3. **Positions renumbered after an apply (Blocker 3): resolved as designed.** `reorder_list(r.list_id, '{}')` works from the SECURITY DEFINER apply:
   - `auth.uid()` reads `request.jwt.claims`, not `current_user`, so the owner check inside `reorder_list` passes.
   - The function owner can execute `reorder_list`.
   - An empty array is not null, and the tolerant form renumbers by `(position, id)`.
   - The test proves `0..n-1`: `q1` is taken whole, which leaves `ci1` 0 and `cc1` 1.
   - The new lock-order problem this call brings is Risk 1 below.

## Risks

1. **New from the Blocker 3 fix: two applies on one list can deadlock. Take this into B4.1 as a local line.**
   - Apply locks the request row, then the entries it names in `id` order. It then calls `reorder_list`, which updates every entry of the list. Each entry update fires `list_entries_touch`, which updates the `lists` row.
   - Suppose request X names `e1` and request Y names `e2` on the same list, and both are applied at the same time (two devices, or two presses in a row). X holds `e1` and then the `lists` row through the touch trigger. Y holds `e2` and waits for the `lists` row. X's `reorder_list` then waits for `e2`. This is a deadlock: Postgres cancels one call with `40P01`, and the client shows `refused`.
   - Before the renumber, the second apply only waited.
   - Fix: in 5.4 step 1, also take the list row lock, as `create_list_share` does. Use `for update of r` on the request, then `perform 1 from public.lists where id = r.list_id for no key update`, before step 3's entry locks. Two applies or declines on one list then run in order.
   - The deadlock with the owner's other device's `apply_list_writes` stays as accepted in section 14. That call takes the entries first and the list second, the opposite order.
   - Optional layer 3 case: two committed connections apply two requests on one list, and both succeed.
2. **The concurrency case can pass without proving the lock.** The case in 10 step 4 is sound under READ COMMITTED: connection 2's count runs in a new snapshot after it gets the lock, so it sees connection 1's row. But if connection 2's call reaches the server only after connection 1 commits, the case passes even with no lock. Before connection 1 commits, the test should confirm that connection 2 waits: `pg_stat_activity.wait_event_type = 'Lock'` and `wait_event = 'advisory'` for connection 2's pid. With postgres.js, start connection 2's query without `await`, poll the view, commit connection 1, then `await` connection 2.
3. **The rest are accepted as written in section 14:**
   - Risks 5, 6, 8 and 10 are named as accepted.
   - Risk 7 has the runbook line in the B4.1 file table and acceptance; `.claude/README.md` has the section "Restore production (owner)".
   - Risk 4 is placed in B4.2 section 6.2, with its layer 1 case in section 8.
   - Risk 1: the privilege pin is now `service_role: DELETE, REFERENCES, SELECT, TRIGGER, TRUNCATE`, which matches `list-shares.test.mjs`. `prosecdef`, `proconfig`, and EXECUTE for `service_role` are pinned for all four functions.
   - Risk 2: `by` is null on insert, and a case sends with the header set.
   - Risk 3: housekeeping is at step 9, and a case proves that a refused call deletes nothing.
   - Risk 9: the concurrency case is added (see Risk 2 above).

## Nits

- `local`: 5.2 step 10 reads each line's price "from `list_entries` by `list_id` and `item_key`" but does not say how. Write it as a scalar subquery or a left join. An inner join drops a line whose entry the owner deleted between step 6 and step 10, because step 6 takes no lock, and that can leave a request with fewer lines or none. With `entry_id` gone, a line needs no entry, and a null price is valid.
- `local`: 5.2 step 1 puts the null `p_id` check inside the token step, so the order of the two refusals is open. State it: token first, then id, so a bad token always gets the one generic answer. The replay case already expects `22023` only with a valid token.
- `local`: the roadmap's `B4.1` row (`issues/persistent-storage/plan.md`, the section 14 batch table) still reads "the status read shows nothing about the owner" and "the `request` events on the owner and share topics". Pass 3 updated the other four R4 lines only. Change both phrases to the replay, the owner topic only, and `by` null on insert.
- `deferred-scope`: handoff Status "Branch: the planning worktree's branch (pass 2)" is one pass behind. It is cosmetic, and the next handoff write replaces it.

## Deviations

None new. `reviews.md` records R4 and N7 as `deferred-scope`:
- R4 is placed in B4.2 with its layer 1 case. Accepted.
- N7: my first nit was wrong. `mocks/display-row.html` draws the lead line; my grep missed it. Accepted as "no change".

Section 16 and 6.4 now name `joinLive`, `joinOnce` and `waitFor`, and place case K before case E. Both deltas are resolved. The owner's approval of the mocks, which the planner added to `context.md` in this pass, changes nothing in B4.1.

## Suggested next action

Hold B4.1 until R3's closeout push is on `origin/main`, as the handoff says. Then dispatch the implementer with plan section 10 plus four local lines:
1. The list row lock in 5.4 step 1 (Risk 1).
2. The wait check in the concurrency case (Risk 2).
3. The scalar-subquery price read in 5.2 step 10.
4. The token-before-id order in 5.2 step 1.

Fix the roadmap `B4.1` row in the same commit. The B4.1 batch review checks these.

## Checks still needed

- On B4.1: `npm run check:db` with every step 4 case, the replay and concurrency cases included, and the reversibility walk.
- `npm run check`.
- After B4.1's batch review approves: `db-push --project test`, then `npm run e2e`, in that order.
- I ran no gates here. This was a plan review.
