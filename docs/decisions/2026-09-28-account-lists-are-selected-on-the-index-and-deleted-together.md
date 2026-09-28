# 2026-09-28 - Account lists are selected on the index and deleted together, with no undo

- Task: `persist-6-import-export` (the owner asked for selection on the index and batch
  deletion on 2026-09-27).
- Decision: each account card on `#/lists` carries a pick box, and the list page's selection
  strip, extracted as `BatchBar.svelte`, sits over the account cards with «Скачать JSON (N)»
  and «Удалить (N)». The ticks are a subset of the drawn cards at all times. «Удалить (N)»
  asks one browser confirm that names the lists, then removes each through the write buffer
  (`CloudLists.remove`), which sends them as one `apply_list_writes` request; there is no
  undo (`docs/specs/FEATURES.md`, "Lists").
- Rejected: a separate export checklist view (the owner wanted the selection where the lists
  are); a `delete_lists(uuid[])` RPC (a second migration and write path for nothing the buffer
  lacks, and each deletion stands alone, so all or nothing is not wanted); an undo (a deleted
  list takes its share links and pending requests with it, which an undo could not bring
  back); sharing code with `SelBar.svelte` (it selects records across the app and floats at
  the window's bottom; `BatchBar` selects rows or cards of its own page).
