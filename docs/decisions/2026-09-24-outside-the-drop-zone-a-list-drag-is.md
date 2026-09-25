# 2026-09-24 - Outside the drop zone a list drag is refused explicitly

- Task: `debt-cleanup`.
- Decision: while a list drag is live, the document's capturing `dragenter`/
  `dragover` listener cancels every event and sets `dropEffect` to `move`
  inside the zone and `none` outside it; a `drop` outside the zone is
  cancelled without a move (`app/src/ports/drag.ts`). An editable field
  outside the zone, the list's own note first, cannot take the row's
  `text/plain` index as text.
- Rejected: `dropEffect = 'move'` on every `dragover` (the cursor would read
  "move" outside the list, losing the cancellation signal of "A list drag
  resolves to a gap"); leaving the browser default outside the zone (an
  editable neighbour accepts the drop as text).
- Evidence: a trusted puppeteer drag (`page.mouse` down/move/up) in this
  headless Chrome starts a native drag but delivers no `drop` anywhere, even
  inside the zone, and `page.mouse.dragAndDrop` hangs, so the insert was
  never reproduced; the refusal is asserted with synthetic events instead.
