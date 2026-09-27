Verdict: fix-then-continue
Reviewed: b642493fef7b0e428c0a1c1646bf28a621970bc6
Scope: plan before B4.1

# Review - plan before B4.1 (persist-4-requests)

Summary: the security shape of the anon write path is sound. The token is the only capability, the bounds sit inside the function, `search_path` is fixed, EXECUTE is revoked and re-granted by name, there is no table grant to anon, and the owner topic is the only send target. Three design points in the B4.1 function bodies will ship in a permanent migration, and two of them change the pinned signature or the data result. Fix them in the plan text before the implementer starts. No replan is needed.

## Blockers

1. **`create_purchase_request` is not idempotent, but R3's transport assumes every write is.** (plan 5.2, 10 step 2; blocking)
   - R3's `keepaliveFetch` (`app/src/ports/supabase.ts` at `94058abd`) sends a `rest/v1` request a second time when the keepalive fetch throws. Its comment says "every write is idempotent".
   - `timed()` turns 20 s with no answer into `network`. The plan's `RequestSender` then keeps the selection and asks the user to send again.
   - A send that committed but lost its answer therefore makes a duplicate request. If the owner applies both, the stock drops twice.
   - Request: add a client-made id, `create_purchase_request(p_id uuid, p_token text, p_lines jsonb)`.
     - After the token check and the lock, a row with this id and this share returns at once, with no rate or cap check.
     - A row with this id on another share is refused with the generic answer.
     - The insert uses `on conflict (id) do nothing`.
   - This is not a database-made key, so "no id leaves the database" still holds.
   - Update `EXPECTED_ANON_FUNCTIONS` (`create_purchase_request(uuid,text,jsonb)`), `COVERAGE.md`, and 6.1 `send(id, token, lines)`.
   - Add a layer 3 case: a replay with the same id inserts nothing, answers success, and does not count toward the rate.

2. **Apply finds stock by `entry_id`, which loses the stock on an undo and can hit another list.** (plan 5.1, 5.4 step 4; blocking)
   - `CloudLists.restoreEntry` (the delete undo) gives the restored entry a new row id (`this.#repo.newId()`). A pending line's `entry_id` was set null by the delete, so apply reads `have = 0` and refuses as short, although the entry is back.
   - `list_entries.list_id` is updatable by the owner (`list_entries_update` policy; `list_entries_limit` handles a move). A line would then deduct from an entry in another list.
   - `item_key` is unique per list, so request: read `have` from `list_entries where list_id = r.list_id and item_key = line.item_key`, and lock those rows `order by id`.
   - Then drop `entry_id` from `purchase_request_lines`, or keep it only if something reads it.
   - Change the layer 3 case "deleting an entry sets its lines' entry_id to null" to: "an entry deleted and re-added (a new id) is found by apply".
   - Update 6.1 `RequestLine.entry`.

3. **Deleting an entry at zero leaves a gap in `position`.** (plan 5.4 step 5; blocking)
   - `CloudLists.removeEntry` reorders after a delete because "Positions stay 0..n-1, so an entry added at the end never shares one". `add` places new rows at `l.ids.length`.
   - After an apply removes an entry, the owner's next add at the end shares a position with an existing entry and can sort before it.
   - Request: after the deletes, renumber the list. `perform public.reorder_list(r.list_id, '{}')` works, because R3's tolerant form renumbers by `(position, id)` and `auth.uid()` is the owner.
   - Add a layer 3 assertion: after an apply that removes an entry, the positions are `0..n-1`.

## Risks

1. **The grants pin in 10 step 4 is wrong for `service_role`.** It says `service_role` holds `SELECT` and `DELETE` only, with the whole set pinned. On this stack `service_role` also keeps `REFERENCES`, `TRIGGER` and `TRUNCATE` on a new table (`list-shares.test.mjs` pins exactly that). Pin the five, as `list-shares` does, or revoke the three in the migration. State which, or `check:db` fails on the first run. Also pin `prosecdef` and `proconfig = ['search_path=public, pg_temp']` for all four functions, the trigger function included, as `list-shares.test.mjs` does.

2. **The requester's tab id reaches the owner.** R3's `EventsPort.tab` is "sent as `x-dhloot-tab` on every PostgREST request", anon included. The insert event therefore carries the requester's tab id as `by` to the owner's devices and to `realtime.messages`, which the decision file says is kept 3 days. This links requests from one tab, and the privacy text says a request is "не связаны ... с вашим устройством". Nothing reads `by` on an insert, because the echo rule only matters for the owner's own decisions. Request: send `by: null` on insert, and parse the header only on a status update. Add a case: a send with the header set carries `by: null`.

3. **Housekeeping runs before validation, and a refused call rolls it back.** Step 3 deletes across every list and then any refusal (bad lines, stale, rate, cap) raises. The delete is undone, but it still costs a scan and row locks on every refused anon call. Move it to just before the insert (step 9). Step 7's "never deletes a row that young" still holds. The privacy text then reads "при следующей отправке" of a successful request, which is accurate.

4. **A retried apply or decline is reported as another device's decision.** The same R3 retry (Blocker 1) replays `apply_purchase_request` or `decline_purchase_request`. The replay answers `request: decided` and shows «Этот запрос уже решён на другом устройстве.» The data is correct. B4.2 should map `decided` after this tab's own `network` or timeout to a re-read without that toast. Add a note in 6.2.

5. **Entry lock order.** 5.4 step 3 does not order the lock. Use `order by id`. A concurrent `apply_list_writes` from another device can still deadlock (`40P01`), and the client maps that to `refused`. Name it as accepted.

6. **An apply cannot be undone.** Apply deletes a zero entry with its notes and price, and has no undo. `restoreEntry` exists only for the owner's own delete. This is owner answer 37, but review H asks for what is lost and the recovery path: nothing restores it except re-adding the item. State it in 14. The owner's «Принять» is the only confirmation.

7. **A pre-R4 backup restored after R4 removes the two new `limit_defaults` rows.** The restore truncates and loads the dump's rows. After that, `effective_limit(..., 'request_lines')` raises `unknown limit key` and every send fails until someone re-inserts the rows. R4 is the first release that adds keys after R2's seed. Name it in 14, and put a line in `.claude/README.md`'s restore section or in `DEBT.md` so the restore runbook re-seeds the missing keys.

8. **Cross-device lost update.** Another device's buffered absolute `quantity` write that lands after an apply overwrites the deduction. This is R2's last-write-wins behaviour and `flushNow` covers only this tab. Name it as accepted.

9. **Concurrency is claimed but not proven.** The advisory lock's claim ("two sends to one list count in order") has no layer 3 case. Optional: two committed connections sending at the cap boundary, one refused.

10. **Anon learns little, and it is accepted.** An anon caller learns that the pending cap is reached, and the owner's `request_lines` override value from `detail`. Both are harmless. Name them in 14 next to the leaked-link bound.

## Nits

- `local`: "taken" has three meanings. It is the requester's picked count (`app.picked`), the request line's quantity ("the rest lose the taken count", 5.4 step 5), and `applied_quantity` ("`taken` is set", 10 step 4, and `RequestLine.taken`). Use `applied_quantity` or "applied" for the column and the line field. Keep `taken` only for the answer's sum.
- `local`: 5.2 step 4 does not say whether extra keys in a line object are ignored or refused. State "ignored" (price, audience and entry are never read from the client).
- `local`: 5.7 reversal - say that it drops every stored request (transient data, no recovery needed).
- `local`: roadmap `issues/persistent-storage/plan.md` still describes the removed status. Line 120 has "request key kept in sessionStorage". The section 5 R4 row (line 188) has `status_key` and `get_purchase_requests`, and the share-topic `{}` send. Line 437 has "requester status". The section 14 B4.2 row (line 571) has `env.session`, the status block, and "the requester's status reads applied". Update them in this pass rather than at closeout, because other plans read the roadmap.
- `local`: 14's first risk says the owner ends a spam run "by deleting the link". The app stops a link with `revoke_list_share` (`revoked_at`), and the rows stay. Say "stops the link", and state that the requests of a stopped link stay pending and can be applied.
- `local`: B4.2 Display row (checked against the shipped `AccountPage.svelte`):
  - Name `value={app.notifyGm}` on the select.
  - Narrow `currentTarget.value` to `NotifyGm` before `app.setNotifyGm`. It takes `NotifyGm` and the select gives `string`.
  - Put `.sethint` after `.hint` in the style block. Both have one-class specificity, and `.hint` sets `margin: 10px 0 0`.
  - Add `aria-describedby` from the select to the hint.
  - The rest matches the shipped code: the fifth `.set` row, the `notify` array kept, the `Seg` import kept for three rows, the four test places at lines 347, 435, 448-449 and 575-576, and no spec text that quotes the old strings except `FEATURES.md` line 844.
- `deferred-scope`: `mocks/display-row.html` omits display-settings' lead line above the rows. Cosmetic only.

## Deviations

- Handoff records four deviations: the hint is drawn, the status is removed rather than shortened, the inline header parse is copied instead of a helper, and the fake seed has no requests. All four are accepted.
- The requester status removal is complete in the R4 task files and the decisions:
  - No `status_key`, `get_purchase_requests`, `dhloot.requests.v1`, `env.session`, share-topic event or status strings remain in `plan.md` sections 5-11, the mocks' shipped states or the decision files.
  - The two 2026-09-26 decisions carry their superseded or amended pointers.
  - The only leftovers are the roadmap rows in Nits.
- The dispatch said three `tests/db` files would break; the plan names four: `harness`, `limits`, `usage`, `restore-drill`. I found no fifth. `restore-prod.test.mjs` pins named tables only, and the truncate reads the live table list.
- Section 16 against `94058abd`: every mark holds. These are confirmed: `EventsPort` (`subscribe`, `tab`), `keepaliveFetch`, `timed`, `WRITE_TIMEOUT_MS`, the readers and the constants, `LiveFeed`, `CloudLists(repo, say, dict, live?)` with `watch`, `unwatch`, `live`, `#remote` and the echo rule, the app wiring, lazy `tab` `''`, the fake `send`, `TAB`, `setLive`, `play` and `live?`, F11, `portOf`, states 52 and 53, and `~ updated live`. The migration is byte-identical to `1cbca5f7`. There are two deltas for B4.2:
  - The contract helpers are `joinLive` and `joinOnce` plus `waitFor`, not `join`.
  - Case E (delete the account) runs last, after J, so case K must be placed before E.

## Suggested next action

1. The planner amends `plan.md` sections 5.1, 5.2, 5.4, 5.6, 6.1, 10 (files table, step 2, step 4 cases, acceptance) and 14 for Blockers 1-3 and Risks 1-3. Fold in the `local` nits, including the roadmap rows.
2. A second look (`plan-B4.1-2.md`) checks only those sections.
3. B4.1 then starts after R3's closeout push, as the plan says.

## Checks still needed

- On the implementation (not on the plan):
  - `npm run check:db` with every step 4 case in its output.
  - The up-down-up gate and the walk with the new reversal. The limit-row delete is proven only indirectly, because a second up would fail on the duplicate key.
- `restore-prod.test.mjs` and `usage.test.mjs` pass with the two new tables. This is expected but was not run here.
- The gate order stays as planned: `db-push --project test` and `npm run e2e` run only after B4.1's batch review approves.
- The plan names no `tests/app` or `tests/e2e` change for B4.1, which is correct.
