# 2026-09-26 - After the cutoff a browser list is written only by the move and a delete

- Task: `persist-5-migration` (planner, pass 1; roadmap decision 11, "delete the two-tab merge").
- Decision: from `LEGACY_WRITE_UNTIL` a configured build draws every
  browser list read-only (no rename, reorder, quantity, price, note, money,
  batch price or row removal; no link buttons; no `#/l/` rewrite). The only
  writes left are the move's removal (`ListStore.settleMove`, which removes
  a list only while its raw stored text equals the moved one) and «Удалить»
  (`ListStore.removeMany(ids)`); each reads storage fresh, drops the ids,
  writes the result and takes it as this tab's view. No merge: a removal is
  right against fresh storage, and another tab's lists survive. Before the date the
  writers and `save()`'s merge run as today; R10 deletes them with the codec.
- Rejected: deleting the merge in R5 (lists stay editable for the two weeks
  between R5's deploy and the date, so two tabs would lose lists again); a
  merge-based removal after the date (a backgrounded tab's memory could put
  a moved list back); no delete after the date (a reader could not drop a
  list they do not want in the account).
