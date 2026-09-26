# 2026-09-26 - Browser lists are read-only while the move is due

- Task: `persist-5-migration` (owner, 2026-09-26, answering how an edit made during the move is kept; planner).
- Decision: in a configured build, from sign-in until the move has ended (`LegacyMove.status`
  is not `done`), a signed-in reader's browser lists draw as they will after the cutoff - no
  edit, no link button, no `#/l/` rewrite, no add-to-list target - and «Удалить» is hidden too;
  `AppState.localWritable = legacyWritable && !moveDue` is the gate, while the `#/l/` retired
  page, the packed-link expansion and the Lists tab read the date alone. The status line says
  «Переносим списки в аккаунт...», or «Не все списки перенесены: нет связи...» when the run
  ended without a network, and the lists stay read-only until a run lands. So an edit cannot
  land in the move's window; a list that still changed (a second tab's write in the storage
  event's delay) is held, never removed and never sent again. Accepted: a reader who opens the
  app offline before their lists moved cannot edit or delete them until the network answers.
- Rejected: compare, then move a changed list again (a second row beside the first in the
  account, a visible duplicate the reader would delete by hand, plus content-stamped
  tombstones); deleting the first row when the second lands (an edited account row would go).
