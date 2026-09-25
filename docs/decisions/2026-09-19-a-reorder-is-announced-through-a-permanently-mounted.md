# 2026-09-19 - A reorder is announced through a permanently mounted live region, not the shared toast

- Task: `dnd4` (find the commit with `git log --grep=dnd4`).
- Decision: `ListPage.svelte` always mounts an empty `<div class="lsaid"
  role="status" aria-live="polite">` beside `.lrows`. Both movers (`setPos`,
  the drag port's `onDrop`) fill it only when `store.move()` returns true, so
  a no-op move stays silent. The strings name the record and its position
  (`%s`, `%n`, `%m`) with no participle, which would have to agree with the
  record's gender (`docs/specs/I18N.md`, "Rules").
- Rejected: the toast (`app.say`) - its one shared slot drops a pending undo
  prompt; a region mounted only while it holds text - the unreliable half of
  the pattern, and blind to the goldens; a region in `Shell` - adds a node to
  all 110 goldens for one page; announcing a rejected typed position - a
  rejected entry is not a reorder.
- Evidence: `page.accessibility.snapshot()` keeps an empty `role="status"` as
  `status ""`, so the mount re-seeds every list-page golden.
