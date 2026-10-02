# 2026-10-02 - The signed-in pages follow one set of consistency rules

- Task: `persist-7f-consistency` (owner's answers of 2026-10-01; Q2 taken as recommended while the owner was away, 2026-10-02).
- Decision: the signed-in pages follow the numbered rules of
  `docs/specs/FEATURES.md`, "Chrome", "Consistency rules": counters from
  `my_limit()`, one failure wording, one delete-confirm ending, one
  `LoadState`, «Новый <noun>» with the plus icon, «Отмена» discards and
  «Закрыть» keeps, the fold shapes, `maxlength` from the validator's caps.
  The `#/lists` heading reads «Мои списки», as the menu item; the tab bar and
  the pin label keep «Списки» until the 2026-10-26 cutoff. A bulk item delete
  keeps one request per item, with a busy button and a progress line.
- Rejected: the menu item renamed to «Списки» (it would part from «Мои
  предметы»); «Отмена» everywhere (a folded panel that keeps its text is not
  cancelled); one `delete().in()` per 100 ids for the bulk delete (a new write
  path on a delete, for a minute saved at 300 items).
