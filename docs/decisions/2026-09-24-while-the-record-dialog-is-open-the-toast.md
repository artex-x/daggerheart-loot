# 2026-09-24 - While the record dialog is open, the toast is drawn inside it

- Task: `debt-cleanup` (owner: fix now).
- Decision: `RecordModal.svelte` renders its own `<Toast inDialog>` and sets
  `app.dialogOpen` after `showModal()`; `Shell.svelte`'s copy draws nothing
  while the flag is set, so one element holds the live region at a time.
  "An undo toast takes focus" holds inside the dialog; when the origin is
  gone, focus returns to the dialog's first control (where `showModal()`
  put it), never to the inert `#main`. A dialog closed while a toast shows
  hands the rest of its time to Shell's copy.
- Rejected: `popover="manual"` from Shell alone (a modal dialog makes every
  node outside it inert, the top layer included: the toast drew but took no
  focus, had no accessibility node, and a click on it reached the backdrop
  and closed the dialog - Chromium, 2026-09-24); `show()` for `showModal()`
  (gives up the focus trap, the inert page and Escape); closing the dialog
  when an undo is offered (loses the card being acted on); moving one toast
  node between Shell and the dialog (a DOM move under Svelte's ownership).
