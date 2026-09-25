# 2026-09-25 - Share links are made when the Share panel opens; a deleted one stays deleted

- Task: `persist-2-lists` (owner, 2026-09-25; planner refresh of the share links).
- Decision: «Поделиться» on an account list's page opens a panel with a
  players' row and a GM row, both ready: the panel reads the list's shares
  (the owner reads stopped rows too) and calls `create_list_share` only for
  an audience with no row at all. An audience whose rows are all stopped
  shows «Ссылка удалена» and «Создать ссылку» alone until the owner presses
  it. An active row has «Скопировать» and «Удалить ссылку»: a link is
  replaced by deleting it and making a new one. A link is `#/s/<token>`;
  the shared page learns that the reader owns the list from the owner's
  `list_shares` row, not from the projection.
  Behaviour: `docs/specs/FEATURES.md`, "Account lists".
- Rejected: a row with no link offering «Скопировать» that makes the link
  on its first press (one more state per row); making a missing link again
  on every open (a deleted link would come back by itself); `list_id` in
  `get_shared_list`'s answer to find the owner (a schema change, and the
  list id would reach everyone who holds the link); a «Новая ссылка» button
  that stops a link and makes the next one in one step (the owner dropped it
  during the build, 2026-09-25: delete, then create, does the same, so
  `rotate_list_share` was removed before it shipped).
