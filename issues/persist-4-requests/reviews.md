# Review register - TASK persist-4-requests

| Id | Severity | Scope | Status |
|---|---|---|---|
| plan-B4.1-B1 | blocker | local | fixed plan pass 3 (5.1 client-made id; 5.2 `create_purchase_request(p_id, p_token, p_lines)`, step 3 replay, step 10 `on conflict (id) do nothing`; 6.1 `send(id, ...)`; 6.2 the id kept after `network`; 10 harness `create_purchase_request(uuid,text,jsonb)`, `COVERAGE.md`, the replay case, acceptance) |
| plan-B4.1-B2 | blocker | local | fixed plan pass 3 (5.1 `entry_id` dropped; 5.4 steps 3-4 stock by `list_id` + `item_key`, locked `order by id`; 6.1 `RequestLine` without `entry`; 10 case: re-added entry found, moved entry not touched) |
| plan-B4.1-B3 | blocker | local | fixed plan pass 3 (5.4 step 5 `reorder_list(r.list_id, '{}')` after a delete; 10 case: positions `0..n-1`; acceptance) |
| plan-B4.1-R1 | risk | local | fixed plan pass 3 (5.1 and 10: `service_role` keeps its five privileges, pinned as `list-shares.test.mjs`; `prosecdef` and `proconfig` pinned for all four functions) |
| plan-B4.1-R2 | risk | local | fixed plan pass 3 (5.6 `by` null on insert, header read only on a status change; 10 case with the header set) |
| plan-B4.1-R3 | risk | local | fixed plan pass 3 (5.2 housekeeping moved to step 9, before the insert; 10 case: a refused send deletes nothing) |
| plan-B4.1-R4 | risk | deferred-scope | placed in B4.2 (6.2 note: `decided` after this tab's own `network` is a quiet re-read; 8 layer 1 case) |
| plan-B4.1-R5 | risk | local | fixed plan pass 3 (5.4 step 3 lock `order by id`); deadlock with another device named as accepted in 14 |
| plan-B4.1-R6 | risk | local | named as accepted in 14 (apply cannot be undone; owner answer 37) |
| plan-B4.1-R7 | risk | local | named in 14; B4.1 step 6 adds the re-seed step to `.claude/README.md`, "Restore production (owner)" (file table, acceptance) |
| plan-B4.1-R8 | risk | local | named as accepted in 14 (R2's last write wins across devices) |
| plan-B4.1-R9 | risk | local | fixed plan pass 3 (10 step 4: the concurrency case at the pending cap; acceptance) |
| plan-B4.1-R10 | risk | local | named as accepted in 14 (the cap reached and the `request_lines` override value) |
| plan-B4.1-N1 | nit | local | fixed plan pass 3 (5.1 "Words": `applied_quantity` / `applied`; `taken` only for the answer's sum and `app.picked`) |
| plan-B4.1-N2 | nit | local | fixed plan pass 3 (5.2 step 4: extra keys ignored; 10 case) |
| plan-B4.1-N3 | nit | local | fixed plan pass 3 (5.7: the reversal drops every stored request) |
| plan-B4.1-N4 | nit | local | fixed plan pass 3 (roadmap `issues/persistent-storage/plan.md`: section 3 purchase-request bullet, section 5 R4 row, the specs row, the release table row, the `B4.2` row) |
| plan-B4.1-N5 | nit | local | fixed plan pass 3 (14: "stops the link"; a stopped link's requests stay pending and can be applied) |
| plan-B4.1-N6 | nit | local | fixed plan pass 3 (11 Display row: `value={app.notifyGm}`, the `NotifyGm` narrowing, `.sethint` after `.hint`, `aria-describedby`) |
| plan-B4.1-N7 | nit | deferred-scope | no change: `mocks/display-row.html` draws the lead line («Эти настройки действуют...», `.hint.lead`) in all three states; re-checked in pass 3 |
| plan-B4.1-D1 | delta | local | fixed plan pass 3 (16 and 6.4: contract helpers `joinLive`, `joinOnce`, `waitFor`) |
| plan-B4.1-D2 | delta | local | fixed plan pass 3 (16 and 6.4: case K runs before case E) |
